import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  ChevronRight, Loader2, PlusCircle, Search, Building2, AlertTriangle,
  CheckCircle, XCircle, ShieldAlert, FileText, Info, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BackToDashboard from '@/components/BackToDashboard';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const FILAS = [
  { value: 'apuracao', label: 'Apuração', requiresContract: false, ndaOptional: true },
  { value: 'revisao', label: 'Revisão da Apuração', requiresContract: false, ndaOptional: true },
  { value: 'onboarding', label: 'Onboarding', requiresContract: true, ndaOptional: false },
  { value: 'retificacao', label: 'Retificação', requiresContract: true, ndaOptional: false },
  { value: 'compensacao', label: 'Compensação', requiresContract: true, ndaOptional: false },
  { value: 'ressarcimento', label: 'Ressarcimento', requiresContract: true, ndaOptional: false },
  { value: 'restituicao', label: 'Restituição', requiresContract: true, ndaOptional: false },
] as const;

type FilaValue = typeof FILAS[number]['value'];

interface TeseItem {
  teseId: number;
  teseNome: string;
  tributoEnvolvido: string;
  tipo: string;
  classificacao: string;
  potencialFinanceiro: string;
  motivos?: string[];
}

export default function CreditoNovaTarefa() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Unsaved changes tracking
  const { setDirty, confirmNavigation, UnsavedAlert } = useUnsavedChanges();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Select client
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);

  // Step 2: Select fila + details
  const [fila, setFila] = useState<FilaValue | ''>('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<'urgente' | 'alta' | 'media' | 'baixa'>('media');

  // Step 3: Select teses
  const [selectedTeses, setSelectedTeses] = useState<Set<number>>(new Set());
  const [justificativas, setJustificativas] = useState<Record<number, string>>({});
  const [showJustificativaDialog, setShowJustificativaDialog] = useState(false);
  const [pendingTeseId, setPendingTeseId] = useState<number | null>(null);
  const [tempJustificativa, setTempJustificativa] = useState('');

  // Track dirty state when form fields change
  useEffect(() => {
    const hasSomething = !!selectedClienteId || !!fila || !!titulo.trim() || !!descricao.trim() || selectedTeses.size > 0;
    setDirty(hasSomething);
  }, [selectedClienteId, fila, titulo, descricao, selectedTeses, setDirty]);

  // Data queries
  const { data: clientes, isLoading: loadingClientes } = trpc.clientes.list.useQuery();
  const { data: tesesResult, isLoading: loadingTeses } = trpc.creditRecovery.credito.clientes.evaluateTeses.useQuery(
    { clienteId: selectedClienteId! },
    { enabled: !!selectedClienteId && step >= 2 }
  );

  // Check if client has a contract (via credit_cases with contrato_assinado status)
  const { data: clienteCases } = trpc.creditRecovery.credito.cases.list.useQuery(
    { clienteId: selectedClienteId! } as any,
    { enabled: !!selectedClienteId && step >= 2 }
  );

  const createTask = trpc.creditRecovery.credito.tasks.create.useMutation({
    onSuccess: (result) => {
      toast.success(`Tarefa ${result?.codigo} criada com sucesso!`);
      setDirty(false);
      navigate('/credito/dashboard-credito');
    },
    onError: (err) => {
      toast.error(`Erro ao criar tarefa: ${err.message}`);
    },
  });

  const createTaskTese = trpc.creditRecovery.credito.taskTeses.create.useMutation();

  // Filter clients
  const filteredClientes = useMemo(() => {
    if (!clientes) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return (clientes as any[]).slice(0, 50);
    return (clientes as any[]).filter((c: any) =>
      c.razaoSocial?.toLowerCase().includes(term) ||
      c.cnpj?.includes(term) ||
      c.nomeFantasia?.toLowerCase().includes(term)
    ).slice(0, 50);
  }, [clientes, searchTerm]);

  const selectedCliente = useMemo(() => {
    if (!selectedClienteId || !clientes) return null;
    return (clientes as any[]).find((c: any) => c.id === selectedClienteId);
  }, [clientes, selectedClienteId]);

  const selectedFila = FILAS.find(f => f.value === fila);

  // Check if client has contract
  const hasContract = useMemo(() => {
    if (!clienteCases) return false;
    return (clienteCases as any[]).some((c: any) =>
      c.contratoAssinadoEm || c.status === 'contrato_assinado' || c.fase === 'contratado'
    );
  }, [clienteCases]);

  const contractWarning = selectedFila?.requiresContract && !hasContract;

  // Teses data
  const aderentes = (tesesResult as any)?.aderentes || [];
  const naoAderentes = (tesesResult as any)?.naoAderentes || [];

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  // Handle tese selection
  const handleTeseToggle = (tese: TeseItem, isAderente: boolean) => {
    const id = tese.teseId;
    if (selectedTeses.has(id)) {
      const newSet = new Set(selectedTeses);
      newSet.delete(id);
      setSelectedTeses(newSet);
      const newJust = { ...justificativas };
      delete newJust[id];
      setJustificativas(newJust);
    } else {
      if (!isAderente) {
        // Non-adherent tese: require justification
        setPendingTeseId(id);
        setTempJustificativa('');
        setShowJustificativaDialog(true);
      } else {
        const newSet = new Set(selectedTeses);
        newSet.add(id);
        setSelectedTeses(newSet);
      }
    }
  };

  const handleConfirmJustificativa = () => {
    if (!tempJustificativa.trim()) {
      toast.error('A justificativa é obrigatória para teses não aderentes.');
      return;
    }
    if (pendingTeseId !== null) {
      const newSet = new Set(selectedTeses);
      newSet.add(pendingTeseId);
      setSelectedTeses(newSet);
      setJustificativas({ ...justificativas, [pendingTeseId]: tempJustificativa.trim() });
    }
    setShowJustificativaDialog(false);
    setPendingTeseId(null);
    setTempJustificativa('');
  };

  const selectAllAderentes = () => {
    const newSet = new Set(selectedTeses);
    aderentes.forEach((t: TeseItem) => newSet.add(t.teseId));
    setSelectedTeses(newSet);
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedClienteId || !fila || !titulo.trim()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    if (selectedTeses.size === 0) {
      toast.error('Selecione pelo menos uma tese/oportunidade.');
      return;
    }
    if (contractWarning) {
      toast.error('Este cliente não possui contrato assinado com a Evox. Para esta fila, o contrato é obrigatório.');
      return;
    }

    try {
      const result = await createTask.mutateAsync({
        fila: fila as any,
        clienteId: selectedClienteId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        prioridade,
      });

      // Create task-tese associations
      if (result?.id) {
        const allTeses = [...aderentes, ...naoAderentes];
        for (const teseId of selectedTeses) {
          const tese = allTeses.find((t: TeseItem) => t.teseId === teseId);
          if (tese) {
            const isAderente = aderentes.some((a: TeseItem) => a.teseId === teseId);
            await createTaskTese.mutateAsync({
              taskId: result.id,
              teseId: tese.teseId,
              teseNome: tese.teseNome,
              aderente: isAderente ? 1 : 0,
              justificativaNaoAderente: justificativas[teseId] || null,
              valorEstimado: '0',
            });
          }
        }
      }
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to Dashboard */}
      <BackToDashboard />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Crédito Tributário</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Nova Tarefa</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Nova Tarefa — Recuperação de Créditos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crie uma tarefa rápida associando a um cliente e uma fila do setor
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[
          { num: 1, label: 'Selecionar Cliente' },
          { num: 2, label: 'Definir Tarefa' },
          { num: 3, label: 'Selecionar Teses' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
            </div>
            <span className={cn('text-sm font-medium', step >= s.num ? 'text-foreground' : 'text-muted-foreground')}>
              {s.label}
            </span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Client */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Selecionar Cliente
            </CardTitle>
            <CardDescription>
              Busque e selecione o cliente da base para associar à tarefa. Para apurações de novos clientes, a inserção deve ser feita pelo parceiro ou pelo suporte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por razão social, CNPJ ou nome fantasia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loadingClientes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto border rounded-lg divide-y">
                {filteredClientes.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum cliente encontrado.
                  </div>
                ) : (
                  filteredClientes.map((c: any) => (
                    <div
                      key={c.id}
                      className={cn(
                        'p-3 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between',
                        selectedClienteId === c.id && 'bg-primary/5 border-l-4 border-l-primary'
                      )}
                      onClick={() => setSelectedClienteId(c.id)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{c.razaoSocial}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">{c.cnpj}</span>
                          {c.nomeFantasia && (
                            <span className="text-xs text-muted-foreground">• {c.nomeFantasia}</span>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {c.regimeTributario?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      {selectedClienteId === c.id && (
                        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedClienteId}
                className="gap-2"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Define Task */}
      {step === 2 && selectedCliente && (
        <div className="space-y-4">
          {/* Selected client summary */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Cliente Selecionado</p>
                  <p className="font-semibold text-foreground mt-1">{selectedCliente.razaoSocial}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">{selectedCliente.cnpj}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedCliente.regimeTributario?.replace('_', ' ')}
                    </Badge>
                    {selectedCliente.parceiroId && (
                      <span className="text-xs text-muted-foreground">Parceiro ID: {selectedCliente.parceiroId}</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Alterar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Definir Tarefa
              </CardTitle>
              <CardDescription>
                Selecione a fila e preencha os detalhes da tarefa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fila *</Label>
                  <Select value={fila} onValueChange={(v) => setFila(v as FilaValue)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fila..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FILAS.map(f => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={prioridade} onValueChange={(v) => setPrioridade(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contract validation warning */}
              {fila && selectedFila && (
                <div className="space-y-2">
                  {selectedFila.requiresContract && (
                    <div className={cn(
                      'p-3 rounded-lg border flex items-start gap-3',
                      hasContract
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    )}>
                      {hasContract ? (
                        <>
                          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Contrato verificado</p>
                            <p className="text-xs mt-0.5">O cliente possui contrato assinado com a Evox. A tarefa pode ser criada nesta fila.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Contrato obrigatório</p>
                            <p className="text-xs mt-0.5">
                              Para a fila de <strong>{selectedFila.label}</strong>, o cliente precisa ter contrato assinado com a Evox.
                              O sistema cruzará esta informação com o setor de contratos. Não é possível criar a tarefa sem contrato.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {!selectedFila.requiresContract && (
                    <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 flex items-start gap-3">
                      <Info className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Contrato não obrigatório</p>
                        <p className="text-xs mt-0.5">
                          Para <strong>{selectedFila.label}</strong>, não é necessário contrato de crédito assinado.
                          {selectedFila.ndaOptional && ' O NDA é opcional.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Título da Tarefa *</Label>
                <Input
                  placeholder="Ex: Apuração de PIS/COFINS - Monofásico"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  placeholder="Detalhes adicionais sobre a tarefa..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!fila || !titulo.trim() || (selectedFila?.requiresContract && !hasContract)}
                  className="gap-2"
                >
                  Próximo: Selecionar Teses
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Select Teses */}
      {step === 3 && selectedCliente && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Cliente</p>
                  <p className="font-semibold text-foreground mt-1 text-sm">{selectedCliente.razaoSocial}</p>
                  <p className="text-xs text-muted-foreground">{selectedCliente.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Fila</p>
                  <p className="font-semibold text-foreground mt-1 text-sm">{selectedFila?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tarefa</p>
                  <p className="font-semibold text-foreground mt-1 text-sm">{titulo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingTeses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">Avaliando teses tributárias...</span>
            </div>
          ) : (
            <>
              {/* Aderentes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle className="w-5 h-5" />
                        Teses Aderentes ({aderentes.length})
                      </CardTitle>
                      <CardDescription>
                        Teses identificadas como oportunidades para este cliente com base no motor de regras tributárias.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={selectAllAderentes} className="gap-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Selecionar Todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {aderentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma tese aderente encontrada para este cliente.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {aderentes.map((tese: TeseItem) => (
                        <div
                          key={tese.teseId}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3',
                            selectedTeses.has(tese.teseId)
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'hover:bg-muted/50'
                          )}
                          onClick={() => handleTeseToggle(tese, true)}
                        >
                          <Checkbox
                            checked={selectedTeses.has(tese.teseId)}
                            onCheckedChange={() => handleTeseToggle(tese, true)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">{tese.teseNome}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">{tese.tributoEnvolvido}</Badge>
                              <Badge variant="outline" className="text-[10px]">{tese.tipo}</Badge>
                              <Badge variant="outline" className="text-[10px]">{tese.classificacao}</Badge>
                              <Badge
                                className={cn('text-[10px]',
                                  tese.potencialFinanceiro === 'muito_alto' ? 'bg-emerald-100 text-emerald-800' :
                                  tese.potencialFinanceiro === 'alto' ? 'bg-blue-100 text-blue-800' :
                                  tese.potencialFinanceiro === 'medio' ? 'bg-amber-100 text-amber-800' :
                                  'bg-gray-100 text-gray-800'
                                )}
                              >
                                {tese.potencialFinanceiro?.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Não Aderentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    Teses Não Aderentes ({naoAderentes.length})
                  </CardTitle>
                  <CardDescription>
                    Teses que o motor de regras identificou como não aplicáveis. Selecionar requer justificativa obrigatória.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {naoAderentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Todas as teses são aderentes para este cliente.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {naoAderentes.map((tese: TeseItem) => (
                        <div
                          key={tese.teseId}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3',
                            selectedTeses.has(tese.teseId)
                              ? 'bg-amber-50 border-amber-300'
                              : 'hover:bg-muted/50'
                          )}
                          onClick={() => handleTeseToggle(tese, false)}
                        >
                          <Checkbox
                            checked={selectedTeses.has(tese.teseId)}
                            onCheckedChange={() => handleTeseToggle(tese, false)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">{tese.teseNome}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">{tese.tributoEnvolvido}</Badge>
                              <Badge variant="outline" className="text-[10px]">{tese.tipo}</Badge>
                              {tese.motivos?.map((m, i) => (
                                <Badge key={i} variant="destructive" className="text-[10px]">
                                  <XCircle className="w-3 h-3 mr-1" />{m}
                                </Badge>
                              ))}
                            </div>
                            {selectedTeses.has(tese.teseId) && justificativas[tese.teseId] && (
                              <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-900">
                                <strong>Justificativa:</strong> {justificativas[tese.teseId]}
                              </div>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary and Submit */}
              <Card className="border-primary/30">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {selectedTeses.size} tese(s) selecionada(s)
                      </p>

                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Voltar
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={selectedTeses.size === 0 || createTask.isPending}
                        className="gap-2"
                      >
                        {createTask.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PlusCircle className="w-4 h-4" />
                        )}
                        Criar Tarefa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Justificativa Dialog */}
      <Dialog open={showJustificativaDialog} onOpenChange={setShowJustificativaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Tese Não Aderente — Justificativa Obrigatória
            </DialogTitle>
            <DialogDescription>
              O motor de regras identificou que esta tese não é aderente para o cliente selecionado.
              Para prosseguir com a inclusão, é necessário fornecer uma justificativa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Justificativa *</Label>
            <Textarea
              placeholder="Explique por que esta tese deve ser incluída mesmo não sendo identificada como aderente..."
              value={tempJustificativa}
              onChange={(e) => setTempJustificativa(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowJustificativaDialog(false);
              setPendingTeseId(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmJustificativa} disabled={!tempJustificativa.trim()}>
              Confirmar e Incluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UnsavedAlert />
    </div>
  );
}
