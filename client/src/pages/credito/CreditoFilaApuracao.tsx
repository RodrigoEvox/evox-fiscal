import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  Calculator, ChevronRight, Loader2, Search, Clock, AlertTriangle, CheckCircle,
  User, PlusCircle, FileText, ClipboardList, Send, Eye, Trash2,
  Plus, ArrowRight, Building2, BarChart3, Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BackToDashboard from '@/components/BackToDashboard';
import TarefasAtrasadasBanner from '@/components/TarefasAtrasadasBanner';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
  fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
  feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
};

const RETORNO_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aguardando: { label: 'Aguardando', color: 'bg-amber-100 text-amber-800' },
  fechou: { label: 'Fechou', color: 'bg-emerald-100 text-emerald-800' },
  nao_fechou: { label: 'Não Fechou', color: 'bg-red-100 text-red-800' },
  sem_retorno: { label: 'Sem Retorno', color: 'bg-gray-100 text-gray-800' },
  em_negociacao: { label: 'Em Negociação', color: 'bg-blue-100 text-blue-800' },
};

export default function CreditoFilaApuracao() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('fila');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // RTI Dialog
  const [rtiDialogOpen, setRtiDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [rtiTab, setRtiTab] = useState('dados');

  // RTI Form
  const [rtiForm, setRtiForm] = useState({
    periodoAnalise: '',
    resumoExecutivo: '',
    metodologia: '',
    conclusao: '',
    observacoes: '',
  });
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [cenarioCompensacao, setCenarioCompensacao] = useState<any[]>([
    { tributo: 'PIS/COFINS', mediaMensal: 0 },
    { tributo: 'IRPJ/CSLL', mediaMensal: 0 },
    { tributo: 'INSS', mediaMensal: 0 },
  ]);
  const [alertas, setAlertas] = useState<any[]>([]);

  // Checklist Dialog
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [checklistTask, setChecklistTask] = useState<any>(null);

  // Partner Return Dialog
  const [retornoDialogOpen, setRetornoDialogOpen] = useState(false);
  const [retornoForm, setRetornoForm] = useState<any>({});

  // Queries
  const { data: tasks, isLoading, refetch: refetchTasks } = trpc.creditRecovery.credito.tasks.list.useQuery({ fila: 'apuracao' } as any);
  const { data: partnerReturns, refetch: refetchReturns } = trpc.creditRecovery.admin.partnerReturns.list.useQuery({});
  const { data: partnerReturnStats } = trpc.creditRecovery.admin.partnerReturns.stats.useQuery();
  const { data: checklistTemplates } = trpc.creditRecovery.admin.checklists.list.useQuery({ fila: 'apuracao' });
  const { data: rtiTemplates } = trpc.creditRecovery.admin.rtiTemplates.list.useQuery();

  // Mutations
  const createRti = trpc.creditRecovery.credito.rti.create.useMutation();
  const updateRti = trpc.creditRecovery.credito.rti.update.useMutation();
  const emitirRti = trpc.creditRecovery.credito.rti.emitir.useMutation();
  const createOportunidade = trpc.creditRecovery.admin.rtiOportunidades.create.useMutation();
  const upsertCenario = trpc.creditRecovery.admin.rtiCenario.upsert.useMutation();
  const upsertAlertas = trpc.creditRecovery.admin.rtiAlertas.upsert.useMutation();
  const createPartnerReturn = trpc.creditRecovery.admin.partnerReturns.create.useMutation();
  const updatePartnerReturn = trpc.creditRecovery.admin.partnerReturns.update.useMutation();
  const createChecklistInstance = trpc.creditRecovery.admin.checklists.createInstance.useMutation();
  const updateChecklistInstance = trpc.creditRecovery.admin.checklists.updateInstance.useMutation();

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks as any[];
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.titulo?.toLowerCase().includes(term) ||
        t.codigo?.toLowerCase().includes(term) ||
        t.responsavelNome?.toLowerCase().includes(term)
      );
    }
    result.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return result;
  }, [tasks, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const all = (tasks as any[]) || [];
    return {
      total: all.length,
      aFazer: all.filter(t => t.status === 'a_fazer').length,
      fazendo: all.filter(t => t.status === 'fazendo').length,
      feito: all.filter(t => t.status === 'feito').length,
      emAtraso: all.filter(t => t.slaStatus === 'vencido').length,
    };
  }, [tasks]);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatCurrency = (v: number | string) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // ===== RTI Generation =====
  const handleOpenRtiDialog = (task: any) => {
    setSelectedTask(task);
    setRtiForm({ periodoAnalise: '', resumoExecutivo: '', metodologia: '', conclusao: '', observacoes: '' });
    setOportunidades([]);
    setCenarioCompensacao([
      { tributo: 'PIS/COFINS', mediaMensal: 0 },
      { tributo: 'IRPJ/CSLL', mediaMensal: 0 },
      { tributo: 'INSS', mediaMensal: 0 },
    ]);
    setAlertas([]);
    setRtiTab('dados');

    // Load template if available
    if (rtiTemplates && (rtiTemplates as any[]).length > 0) {
      const tpl = (rtiTemplates as any[])[0];
      setRtiForm(prev => ({
        ...prev,
        resumoExecutivo: tpl.textoIntro || '',
        observacoes: tpl.textoObservacoes || '',
      }));
      if (tpl.cenarioCompensacaoDefault) {
        try {
          const parsed = typeof tpl.cenarioCompensacaoDefault === 'string' ? JSON.parse(tpl.cenarioCompensacaoDefault) : tpl.cenarioCompensacaoDefault;
          if (Array.isArray(parsed)) setCenarioCompensacao(parsed);
        } catch {}
      }
      if (tpl.alertasDefault) {
        try {
          const parsed = typeof tpl.alertasDefault === 'string' ? JSON.parse(tpl.alertasDefault) : tpl.alertasDefault;
          if (Array.isArray(parsed)) setAlertas(parsed);
        } catch {}
      }
    }
    setRtiDialogOpen(true);
  };

  const addOportunidade = () => {
    setOportunidades(prev => [...prev, {
      descricao: '',
      classificacao: 'pacificado',
      valorApurado: 0,
      ordem: prev.length,
    }]);
  };

  const removeOportunidade = (idx: number) => {
    setOportunidades(prev => prev.filter((_, i) => i !== idx));
  };

  const updateOportunidade = (idx: number, field: string, value: any) => {
    setOportunidades(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const addAlerta = () => {
    setAlertas(prev => [...prev, { tipo: 'observacao', texto: '', ordem: prev.length }]);
  };

  const totalOportunidades = useMemo(() => {
    return oportunidades.reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
  }, [oportunidades]);

  const totalPacificado = useMemo(() => {
    return oportunidades.filter(o => o.classificacao === 'pacificado').reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
  }, [oportunidades]);

  const totalNaoPacificado = useMemo(() => {
    return oportunidades.filter(o => o.classificacao === 'nao_pacificado').reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
  }, [oportunidades]);

  const handleSaveRti = async () => {
    if (!selectedTask) return;
    try {
      const rti = await createRti.mutateAsync({
        caseId: selectedTask.caseId || 0,
        clienteId: selectedTask.clienteId,
        periodoAnalise: rtiForm.periodoAnalise,
        resumoExecutivo: rtiForm.resumoExecutivo,
        metodologia: rtiForm.metodologia,
        conclusao: rtiForm.conclusao,
        observacoes: rtiForm.observacoes,
        valorTotalEstimado: totalOportunidades.toFixed(2),
      } as any);

      const rtiId = (rti as any)?.id;
      if (rtiId) {
        // Save oportunidades
        for (const op of oportunidades) {
          await createOportunidade.mutateAsync({ ...op, rtiId, valorApurado: parseFloat(op.valorApurado) || 0 });
        }
        // Save cenário compensação
        await upsertCenario.mutateAsync({
          rtiId,
          items: cenarioCompensacao.map((c, i) => ({ ...c, mediaMensal: parseFloat(c.mediaMensal) || 0, ordem: i })),
        });
        // Save alertas
        if (alertas.length > 0) {
          await upsertAlertas.mutateAsync({
            rtiId,
            items: alertas.map((a, i) => ({ ...a, ordem: i })),
          });
        }
      }

      toast.success('RTI criado com sucesso!');
      setRtiDialogOpen(false);
      refetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar RTI');
    }
  };

  // ===== Checklist =====
  const handleOpenChecklist = (task: any) => {
    setChecklistTask(task);
    setChecklistDialogOpen(true);
  };

  // ===== Partner Return =====
  const handleOpenRetornoDialog = (returnItem?: any) => {
    if (returnItem) {
      setRetornoForm(returnItem);
    } else {
      setRetornoForm({});
    }
    setRetornoDialogOpen(true);
  };

  const handleUpdateRetorno = async (id: number, status: string, obs?: string, motivo?: string, valor?: number) => {
    try {
      await updatePartnerReturn.mutateAsync({
        id,
        retornoStatus: status,
        retornoObservacao: obs,
        motivoNaoFechamento: motivo,
        valorContratado: valor,
      });
      toast.success('Retorno atualizado!');
      refetchReturns();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar retorno');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Dashboard */}
      <BackToDashboard />

      {/* Tarefas Atrasadas */}
      <TarefasAtrasadasBanner fila="apuracao" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Apuração</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Calculator className="w-6 h-6" />
            Fila de Apuração
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Checklist de apuração por tese, geração de RTI e gestão de retorno dos parceiros.
          </p>
        </div>
        <Button onClick={() => navigate('/credito/nova-tarefa-credito')} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fila" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Fila de Tarefas
          </TabsTrigger>
          <TabsTrigger value="retornos" className="gap-2">
            <Handshake className="w-4 h-4" />
            Retorno Parceiros
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* ===== FILA TAB ===== */}
        <TabsContent value="fila" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-gray-700' },
              { label: 'A Fazer', value: stats.aFazer, color: 'text-amber-600' },
              { label: 'Fazendo', value: stats.fazendo, color: 'text-blue-600' },
              { label: 'Feito (RTI Gerado)', value: stats.feito, color: 'text-purple-600' },
              { label: 'Em Atraso', value: stats.emAtraso, color: 'text-red-600' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por código, título ou responsável..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="a_fazer">A Fazer</SelectItem>
                <SelectItem value="fazendo">Fazendo</SelectItem>
                <SelectItem value="feito">Feito</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task List */}
          <Card>
            <CardContent className="p-0">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">Nenhuma tarefa de apuração encontrada.</p>
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/credito/nova-tarefa-credito')}>
                    <PlusCircle className="w-4 h-4" />
                    Criar Nova Tarefa
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-1">Código</div>
                    <div className="col-span-2">Cliente</div>
                    <div className="col-span-2">Título</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Responsável</div>
                    <div className="col-span-1">SLA</div>
                    <div className="col-span-1">Criado</div>
                    <div className="col-span-1">Por</div>
                    <div className="col-span-2 text-center">Ações</div>
                  </div>
                  {filteredTasks.map((task: any) => {
                    const statusInfo = STATUS_LABELS[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-800' };
                    const isOverdue = task.slaStatus === 'vencido';
                    return (
                      <div key={task.id} className={cn('grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-sm', isOverdue && 'bg-red-50/50')}>
                        <div className="col-span-1">
                          <span className="font-mono text-xs text-muted-foreground">{task.codigo}</span>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <p className="text-xs font-medium truncate">{task.clienteNome || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{task.clienteCnpj || ''}</p>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <p className="font-medium text-foreground truncate text-xs">{task.titulo}</p>
                        </div>
                        <div className="col-span-1">
                          <Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge>
                        </div>
                        <div className="col-span-1 flex items-center gap-1 min-w-0">
                          <User className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-[10px] text-muted-foreground truncate">{task.responsavelNome || '—'}</span>
                        </div>
                        <div className="col-span-1">
                          {isOverdue ? (
                            <Badge variant="destructive" className="text-[10px] gap-0.5"><AlertTriangle className="w-3 h-3" />Atraso</Badge>
                          ) : (
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-0.5"><CheckCircle className="w-3 h-3" />OK</Badge>
                          )}
                        </div>
                        <div className="col-span-1">
                          <span className="text-[10px] text-muted-foreground">{formatDateTime(task.createdAt)}</span>
                        </div>
                        <div className="col-span-1">
                          <span className="text-[10px] text-muted-foreground truncate">{task.criadoPorNome || '—'}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1 justify-center">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => handleOpenChecklist(task)} title="Checklist">
                            <ClipboardList className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary" onClick={() => handleOpenRtiDialog(task)} title="Gerar RTI">
                            <FileText className="w-3.5 h-3.5" />
                            RTI
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== RETORNO PARCEIROS TAB ===== */}
        <TabsContent value="retornos" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total Enviados', value: partnerReturnStats?.total || 0, color: 'text-gray-700' },
              { label: 'Aguardando', value: partnerReturnStats?.aguardando || 0, color: 'text-amber-600' },
              { label: 'Fechou', value: partnerReturnStats?.fechou || 0, color: 'text-emerald-600' },
              { label: 'Não Fechou', value: partnerReturnStats?.naoFechou || 0, color: 'text-red-600' },
              { label: 'Em Negociação', value: partnerReturnStats?.emNegociacao || 0, color: 'text-blue-600' },
              { label: 'SLA Vencido', value: partnerReturnStats?.slaVencido || 0, color: 'text-red-700' },
              { label: 'Valor Contratado', value: formatCurrency(partnerReturnStats?.valorTotalContratado || 0), color: 'text-emerald-700', isText: true },
            ].map((s: any) => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <p className={cn('text-lg font-bold', s.color)}>{s.isText ? s.value : s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Partner Returns List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Handshake className="w-5 h-5" />
                Gestão de Retorno dos Parceiros (Comercial)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!partnerReturns || (partnerReturns as any[]).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">Nenhum RTI enviado a parceiros ainda.</p>
                  <p className="text-xs mt-1">Gere um RTI e envie ao parceiro para iniciar o acompanhamento.</p>
                </div>
              ) : (
                <div className="divide-y">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-1">RTI</div>
                    <div className="col-span-2">Cliente</div>
                    <div className="col-span-2">Parceiro</div>
                    <div className="col-span-1">Valor RTI</div>
                    <div className="col-span-1">Enviado</div>
                    <div className="col-span-1">SLA Vence</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Valor Contratado</div>
                    <div className="col-span-2 text-center">Ações</div>
                  </div>
                  {(partnerReturns as any[]).map((pr: any) => {
                    const statusInfo = RETORNO_STATUS_LABELS[pr.retornoStatus] || { label: pr.retornoStatus, color: 'bg-gray-100 text-gray-800' };
                    const slaVencido = pr.retornoStatus === 'aguardando' && new Date(pr.slaVenceEm) < new Date();
                    return (
                      <div key={pr.id} className={cn('grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-sm', slaVencido && 'bg-red-50/50')}>
                        <div className="col-span-1">
                          <span className="font-mono text-xs">{pr.rtiNumero || `#${pr.rtiId}`}</span>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <p className="text-xs font-medium truncate">{pr.clienteNome || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{pr.clienteCnpj || ''}</p>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <p className="text-xs truncate">{pr.parceiroNome || '—'}</p>
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs font-medium">{formatCurrency(pr.valorRti)}</span>
                        </div>
                        <div className="col-span-1">
                          <span className="text-[10px] text-muted-foreground">{formatDate(pr.enviadoEm)}</span>
                        </div>
                        <div className="col-span-1">
                          <span className={cn('text-[10px]', slaVencido ? 'text-red-600 font-bold' : 'text-muted-foreground')}>
                            {formatDate(pr.slaVenceEm)}
                            {slaVencido && ' ⚠️'}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge>
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs">{pr.valorContratado ? formatCurrency(pr.valorContratado) : '—'}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1 justify-center">
                          {pr.retornoStatus === 'aguardando' && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600" onClick={() => handleUpdateRetorno(pr.id, 'fechou')}>
                                Fechou
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600" onClick={() => handleUpdateRetorno(pr.id, 'em_negociacao')}>
                                Negociando
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600" onClick={() => handleUpdateRetorno(pr.id, 'nao_fechou')}>
                                Não Fechou
                              </Button>
                            </>
                          )}
                          {pr.retornoStatus === 'em_negociacao' && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600" onClick={() => handleUpdateRetorno(pr.id, 'fechou')}>
                                Fechou
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600" onClick={() => handleUpdateRetorno(pr.id, 'nao_fechou')}>
                                Não Fechou
                              </Button>
                            </>
                          )}
                          {(pr.retornoStatus === 'fechou' || pr.retornoStatus === 'nao_fechou') && (
                            <span className="text-[10px] text-muted-foreground">Finalizado</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== RELATÓRIOS TAB ===== */}
        <TabsContent value="relatorios" className="space-y-4">
          <ApuracaoRelatorios />
        </TabsContent>
      </Tabs>

      {/* ===== RTI GENERATION DIALOG ===== */}
      <Dialog open={rtiDialogOpen} onOpenChange={setRtiDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gerar RTI — Relatório Técnico Inicial
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedTask?.titulo} — {selectedTask?.clienteNome || 'Cliente'}
            </p>
          </DialogHeader>

          <Tabs value={rtiTab} onValueChange={setRtiTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
              <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
              <TabsTrigger value="cenario">Cenário Compensação</TabsTrigger>
              <TabsTrigger value="alertas">Alertas</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período Analisado</Label>
                  <Input placeholder="Ex: 01/2020 a 12/2024" value={rtiForm.periodoAnalise} onChange={(e) => setRtiForm(prev => ({ ...prev, periodoAnalise: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Texto Introdutório / Resumo Executivo</Label>
                <Textarea rows={4} placeholder="A EVOX FISCAL LTDA, empresa especializada em consultoria tributária..." value={rtiForm.resumoExecutivo} onChange={(e) => setRtiForm(prev => ({ ...prev, resumoExecutivo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Metodologia</Label>
                <Textarea rows={3} placeholder="Descreva a metodologia utilizada na análise..." value={rtiForm.metodologia} onChange={(e) => setRtiForm(prev => ({ ...prev, metodologia: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Conclusão</Label>
                <Textarea rows={3} placeholder="Conclusão da análise técnica..." value={rtiForm.conclusao} onChange={(e) => setRtiForm(prev => ({ ...prev, conclusao: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea rows={3} placeholder="Observações adicionais..." value={rtiForm.observacoes} onChange={(e) => setRtiForm(prev => ({ ...prev, observacoes: e.target.value }))} />
              </div>
            </TabsContent>

            <TabsContent value="oportunidades" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Oportunidades Identificadas</h3>
                <Button variant="outline" size="sm" className="gap-1" onClick={addOportunidade}>
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>

              {oportunidades.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground border rounded-lg border-dashed">
                  <p className="text-sm">Nenhuma oportunidade adicionada.</p>
                  <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={addOportunidade}>
                    <Plus className="w-4 h-4" />
                    Adicionar Oportunidade
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {oportunidades.map((op, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1">
                          <Label className="text-xs">Descrição</Label>
                          <Input placeholder="Ex: PIS/COFINS Monofásico" value={op.descricao} onChange={(e) => updateOportunidade(idx, 'descricao', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Classificação</Label>
                          <Select value={op.classificacao} onValueChange={(v) => updateOportunidade(idx, 'classificacao', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pacificado">Pacificado</SelectItem>
                              <SelectItem value="nao_pacificado">Não Pacificado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor Apurado (R$)</Label>
                          <Input type="number" step="0.01" value={op.valorApurado} onChange={(e) => updateOportunidade(idx, 'valorApurado', e.target.value)} />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 mt-5" onClick={() => removeOportunidade(idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {oportunidades.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Somatório Bruto</p>
                        <p className="text-lg font-bold">{formatCurrency(totalOportunidades)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Pacificado</p>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPacificado)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Não Pacificado</p>
                        <p className="text-lg font-bold text-amber-600">{formatCurrency(totalNaoPacificado)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cenario" className="space-y-4 mt-4">
              <h3 className="font-medium">Cenário de Compensação</h3>
              <p className="text-sm text-muted-foreground">Média mensal de tributos pagos para cálculo do cenário de compensação.</p>
              <div className="space-y-3">
                {cenarioCompensacao.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Input className="flex-1" value={item.tributo} onChange={(e) => {
                      const updated = [...cenarioCompensacao];
                      updated[idx] = { ...updated[idx], tributo: e.target.value };
                      setCenarioCompensacao(updated);
                    }} />
                    <div className="w-48">
                      <Input type="number" step="0.01" placeholder="Média Mensal (R$)" value={item.mediaMensal} onChange={(e) => {
                        const updated = [...cenarioCompensacao];
                        updated[idx] = { ...updated[idx], mediaMensal: e.target.value };
                        setCenarioCompensacao(updated);
                      }} />
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setCenarioCompensacao(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setCenarioCompensacao(prev => [...prev, { tributo: '', mediaMensal: 0 }])}>
                  <Plus className="w-4 h-4" />
                  Adicionar Tributo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="alertas" className="space-y-4 mt-4">
              <h3 className="font-medium">Observações e Alertas</h3>
              <p className="text-sm text-muted-foreground">Alertas importantes para o cliente, como subvenções, incompatibilidades, travas do e-Social, etc.</p>
              <div className="space-y-3">
                {alertas.map((alerta, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Select value={alerta.tipo} onValueChange={(v) => {
                          const updated = [...alertas];
                          updated[idx] = { ...updated[idx], tipo: v };
                          setAlertas(updated);
                        }}>
                          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="observacao">Observação</SelectItem>
                            <SelectItem value="alerta">Alerta</SelectItem>
                            <SelectItem value="incompatibilidade">Incompatibilidade</SelectItem>
                            <SelectItem value="subvencao">Subvenção</SelectItem>
                            <SelectItem value="trava_esocial">Trava e-Social</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea rows={2} placeholder="Texto do alerta..." value={alerta.texto} onChange={(e) => {
                        const updated = [...alertas];
                        updated[idx] = { ...updated[idx], texto: e.target.value };
                        setAlertas(updated);
                      }} />
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setAlertas(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-1" onClick={addAlerta}>
                  <Plus className="w-4 h-4" />
                  Adicionar Alerta
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card className="bg-white border-2">
                <CardContent className="p-6 space-y-6">
                  {/* RTI Preview */}
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-gray-900">RTI — RELATÓRIO TÉCNICO INICIAL</h2>
                    <p className="text-sm text-gray-600">Análise de possíveis oportunidades de recuperação de créditos tributários</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Razão Social:</span> {selectedTask?.clienteNome || '—'}</div>
                    <div><span className="font-medium">CNPJ:</span> {selectedTask?.clienteCnpj || '—'}</div>
                    <div><span className="font-medium">Período Analisado:</span> {rtiForm.periodoAnalise || '—'}</div>
                    <div><span className="font-medium">Data:</span> {new Date().toLocaleDateString('pt-BR')}</div>
                  </div>
                  {rtiForm.resumoExecutivo && (
                    <div>
                      <h3 className="font-medium text-sm mb-1">Introdução</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{rtiForm.resumoExecutivo}</p>
                    </div>
                  )}
                  {oportunidades.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-2">Oportunidades Identificadas</h3>
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Descrição</th>
                            <th className="border p-2 text-center">Classificação</th>
                            <th className="border p-2 text-right">Valor Apurado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oportunidades.map((op, idx) => (
                            <tr key={idx}>
                              <td className="border p-2">{op.descricao}</td>
                              <td className="border p-2 text-center">{op.classificacao === 'pacificado' ? 'Pacificado' : 'Não Pacificado'}</td>
                              <td className="border p-2 text-right">{formatCurrency(op.valorApurado)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td className="border p-2" colSpan={2}>Somatório Bruto</td>
                            <td className="border p-2 text-right">{formatCurrency(totalOportunidades)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {cenarioCompensacao.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-2">Cenário de Compensação</h3>
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Tributo</th>
                            <th className="border p-2 text-right">Média Mensal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cenarioCompensacao.map((c, idx) => (
                            <tr key={idx}>
                              <td className="border p-2">{c.tributo}</td>
                              <td className="border p-2 text-right">{formatCurrency(c.mediaMensal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {alertas.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-2">Observações / Alertas</h3>
                      <ul className="space-y-2">
                        {alertas.map((a, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>{a.texto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRtiDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRti} disabled={createRti.isPending} className="gap-2">
              {createRti.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Salvar RTI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== CHECKLIST DIALOG ===== */}
      <Dialog open={checklistDialogOpen} onOpenChange={setChecklistDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Checklist de Apuração
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {checklistTask?.titulo} — {checklistTask?.clienteNome || 'Cliente'}
            </p>
          </DialogHeader>
          <ChecklistContent taskId={checklistTask?.id} fila="apuracao" templates={checklistTemplates as any[]} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== CHECKLIST COMPONENT =====
function ChecklistContent({ taskId, fila, templates }: { taskId: number; fila: string; templates: any[] }) {
  const { data: instance, refetch } = trpc.creditRecovery.admin.checklists.getInstance.useQuery({ taskId }, { enabled: !!taskId });
  const createInstance = trpc.creditRecovery.admin.checklists.createInstance.useMutation();
  const updateInstance = trpc.creditRecovery.admin.checklists.updateInstance.useMutation();

  const [items, setItems] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (instance && !initialized) {
    try {
      const parsed = typeof instance.itens === 'string' ? JSON.parse(instance.itens) : instance.itens;
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {}
    setInitialized(true);
  }

  const handleInitFromTemplate = async (template: any) => {
    try {
      const itens = typeof template.itens === 'string' ? JSON.parse(template.itens) : template.itens;
      const formattedItems = (itens || []).map((item: any, idx: number) => ({
        id: idx,
        texto: typeof item === 'string' ? item : item.texto || item.label || '',
        concluido: false,
        concluidoEm: null,
        concluidoPor: null,
      }));
      await createInstance.mutateAsync({ taskId, templateId: template.id, fila, nome: template.nome, itens: formattedItems, progresso: 0 } as any);
      setItems(formattedItems);
      setInitialized(true);
      refetch();
      toast.success('Checklist iniciado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar checklist');
    }
  };

  const toggleItem = async (idx: number) => {
    if (!instance) return;
    const updated = items.map((item, i) => i === idx ? { ...item, concluido: !item.concluido, concluidoEm: !item.concluido ? new Date().toISOString() : null } : item);
    setItems(updated);
    const progresso = Math.round((updated.filter(i => i.concluido).length / updated.length) * 100);
    await updateInstance.mutateAsync({ id: (instance as any).id, itens: updated, progresso });
  };

  const progresso = items.length > 0 ? Math.round((items.filter(i => i.concluido).length / items.length) * 100) : 0;

  if (!instance && !initialized) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Selecione um template de checklist para iniciar:</p>
        {templates && templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map((t: any) => (
              <Button key={t.id} variant="outline" className="w-full justify-start gap-2" onClick={() => handleInitFromTemplate(t)}>
                <ClipboardList className="w-4 h-4" />
                {t.nome}
              </Button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground border rounded-lg border-dashed">
            <p className="text-sm">Nenhum template de checklist configurado para Apuração.</p>
            <p className="text-xs mt-1">O administrador pode criar templates em Configurações.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">{progresso}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${progresso}%` }} />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className={cn('flex items-start gap-3 p-3 border rounded-lg transition-colors', item.concluido && 'bg-emerald-50/50 border-emerald-200')}>
            <Checkbox checked={item.concluido} onCheckedChange={() => toggleItem(idx)} className="mt-0.5" />
            <div className="flex-1">
              <p className={cn('text-sm', item.concluido && 'line-through text-muted-foreground')}>{item.texto}</p>
              {item.concluidoEm && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Concluído em {new Date(item.concluidoEm).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== RELATÓRIOS COMPONENT =====
function ApuracaoRelatorios() {
  const { data: stats, isLoading } = trpc.creditRecovery.admin.apuracaoStats.useQuery({});

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const formatCurrency = (v: number | string) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats?.totalRtis || 0}</p>
            <p className="text-xs text-muted-foreground">RTIs Gerados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats?.totalClientes || 0}</p>
            <p className="text-xs text-muted-foreground">Clientes Analisados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.valorTotalApurado || 0)}</p>
            <p className="text-xs text-muted-foreground">Valor Total Apurado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats?.rtisEmitidos || 0}</p>
            <p className="text-xs text-muted-foreground">RTIs Emitidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Por Tese */}
      {stats?.porTese && (stats.porTese as any[]).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Valor Apurado por Tese</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                <div className="col-span-1">Tese</div>
                <div className="col-span-1">Classificação</div>
                <div className="col-span-1 text-center">Quantidade</div>
                <div className="col-span-1 text-right">Valor Total</div>
              </div>
              {(stats.porTese as any[]).map((t: any, idx: number) => (
                <div key={idx} className="grid grid-cols-4 gap-2 px-4 py-3 text-sm">
                  <div className="col-span-1 font-medium">{t.tese}</div>
                  <div className="col-span-1">
                    <Badge className={cn('text-[10px]', t.classificacao === 'pacificado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                      {t.classificacao === 'pacificado' ? 'Pacificado' : 'Não Pacificado'}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-center">{t.quantidade}</div>
                  <div className="col-span-1 text-right font-medium">{formatCurrency(t.valorTotal)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
