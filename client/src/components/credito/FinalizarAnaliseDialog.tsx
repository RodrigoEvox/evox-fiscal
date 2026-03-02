import { useState, useMemo, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CurrencyInput from '@/components/CurrencyInput';
import {
  Flag, Loader2, AlertTriangle, CheckCircle, Plus, Trash2, Upload, Paperclip,
  FileText, Calculator, ShieldAlert, ArrowRight, Info, XCircle, Scale,
} from 'lucide-react';
import {
  detectConflicts, calculateConflictScenarios, determineViabilidade,
  VIABILIDADE_THRESHOLD, type ConflictDetection, type ConflictScenario,
} from '@shared/teseConflicts';

interface FinalizarAnaliseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSuccess: () => void;
}

interface TeseEntry {
  id?: number; // credit_task_teses.id
  teseId: number;
  teseNome: string;
  classificacao: string; // pacificada, judicial, administrativa, controversa
  tributoEnvolvido: string;
  valorApurado: string; // raw numeric string "1234.56"
  semValor: boolean; // true if no value (needs justification)
  motivoSemValor: string;
  isNew?: boolean; // true if added by analyst during this session
}

const CLASSIFICACAO_LABELS: Record<string, { label: string; color: string }> = {
  pacificada: { label: 'Pacificada', color: 'bg-emerald-100 text-emerald-800' },
  judicial: { label: 'Judicial', color: 'bg-blue-100 text-blue-800' },
  administrativa: { label: 'Administrativa', color: 'bg-amber-100 text-amber-800' },
  controversa: { label: 'Controversa', color: 'bg-red-100 text-red-800' },
};

export default function FinalizarAnaliseDialog({ open, onOpenChange, task, onSuccess }: FinalizarAnaliseDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('teses');
  const [observacoes, setObservacoes] = useState('');
  const [anexos, setAnexos] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [teses, setTeses] = useState<TeseEntry[]>([]);
  const [showAddTese, setShowAddTese] = useState(false);
  const [rtiGenerated, setRtiGenerated] = useState(false);
  const [rtiGenerating, setRtiGenerating] = useState(false);
  const [generatedRtiId, setGeneratedRtiId] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  // RTI form fields
  const [rtiForm, setRtiForm] = useState({
    periodoAnalise: '',
    resumoExecutivo: '',
    metodologia: '',
    conclusao: '',
  });

  // Queries
  const { data: taskTesesData } = trpc.creditRecovery.admin.taskTeses.list.useQuery(
    { taskId: task?.id },
    { enabled: !!task?.id && open }
  );
  const { data: allTeses } = trpc.teses.list.useQuery(undefined, { enabled: open });
  const { data: existingRtis } = trpc.creditRecovery.credito.rti.listByTask.useQuery(
    { taskId: task?.id },
    { enabled: !!task?.id && open }
  );
  const { data: rtiTemplates } = trpc.creditRecovery.admin.rtiTemplates.list.useQuery(undefined, { enabled: open });

  // Mutations
  const finishTask = trpc.creditRecovery.credito.tasks.finishTask.useMutation();
  const createRti = trpc.creditRecovery.credito.rti.create.useMutation();
  const createOportunidade = trpc.creditRecovery.admin.rtiOportunidades.create.useMutation();
  const upsertCenario = trpc.creditRecovery.admin.rtiCenario.upsert.useMutation();
  const upsertAlertas = trpc.creditRecovery.admin.rtiAlertas.upsert.useMutation();
  const uploadFile = trpc.arquivos.upload.useMutation();
  const updateTaskTese = trpc.creditRecovery.admin.taskTeses.update.useMutation();
  const createTaskTese = trpc.creditRecovery.admin.taskTeses.create.useMutation();

  // Initialize teses from task data
  useEffect(() => {
    if (!open) {
      setInitialized(false);
      return;
    }
    if (initialized) return;
    if (!taskTesesData) return;

    const entries: TeseEntry[] = (taskTesesData as any[]).map((tt: any) => ({
      id: tt.id,
      teseId: tt.teseId,
      teseNome: tt.teseNome || `Tese #${tt.teseId}`,
      classificacao: tt.classificacao || 'judicial',
      tributoEnvolvido: tt.tributoEnvolvido || '',
      valorApurado: tt.valorApurado ? String(tt.valorApurado) : '0',
      semValor: false,
      motivoSemValor: '',
      isNew: false,
    }));
    setTeses(entries);
    setObservacoes(task?.observacoes || '');
    setAnexos([]);

    // Check if RTI already exists for this task
    if (existingRtis && (existingRtis as any[]).length > 0) {
      const latestRti = (existingRtis as any[])[(existingRtis as any[]).length - 1];
      if (latestRti.status === 'emitido' || latestRti.status === 'rascunho') {
        setRtiGenerated(true);
        setGeneratedRtiId(latestRti.id);
      }
    }

    // Load RTI template
    if (rtiTemplates && (rtiTemplates as any[]).length > 0) {
      const tpl = (rtiTemplates as any[])[0];
      setRtiForm(prev => ({
        ...prev,
        resumoExecutivo: tpl.textoIntro || '',
      }));
    }

    setInitialized(true);
  }, [open, taskTesesData, existingRtis, rtiTemplates, initialized, task]);

  // ===== CALCULATIONS =====
  const teseValues = useMemo(() => {
    return teses.map((t, idx) => ({
      nome: t.teseNome,
      valor: t.semValor ? 0 : parseFloat(t.valorApurado) || 0,
      index: idx,
    }));
  }, [teses]);

  const totalGeral = useMemo(() => {
    return teseValues.reduce((sum, t) => sum + t.valor, 0);
  }, [teseValues]);

  const totalPacificado = useMemo(() => {
    return teses.reduce((sum, t, idx) => {
      if (t.classificacao === 'pacificada' && !t.semValor) {
        return sum + (parseFloat(t.valorApurado) || 0);
      }
      return sum;
    }, 0);
  }, [teses]);

  const totalJudicial = useMemo(() => {
    return teses.reduce((sum, t) => {
      if ((t.classificacao === 'judicial' || t.classificacao === 'controversa' || t.classificacao === 'administrativa') && !t.semValor) {
        return sum + (parseFloat(t.valorApurado) || 0);
      }
      return sum;
    }, 0);
  }, [teses]);

  // Conflict detection
  const conflicts = useMemo(() => {
    return detectConflicts(teseValues);
  }, [teseValues]);

  const conflictScenarios = useMemo(() => {
    return calculateConflictScenarios(teseValues, conflicts);
  }, [teseValues, conflicts]);

  // Best scenario value (max among scenarios, or total if no conflicts)
  const bestScenarioValue = useMemo(() => {
    if (conflictScenarios.length === 0) return totalGeral;
    return Math.max(...conflictScenarios.map(s => s.valorTotal));
  }, [conflictScenarios, totalGeral]);

  // Viabilidade
  const viabilidade = useMemo(() => {
    return determineViabilidade(bestScenarioValue);
  }, [bestScenarioValue]);

  // Validation
  const allTesesFilled = useMemo(() => {
    return teses.every(t => {
      if (t.semValor) return t.motivoSemValor.trim().length > 0;
      return parseFloat(t.valorApurado) > 0;
    });
  }, [teses]);

  const canGenerateRti = teses.length > 0 && allTesesFilled;
  const canFinish = rtiGenerated;

  // ===== HANDLERS =====
  const updateTese = useCallback((idx: number, field: keyof TeseEntry, value: any) => {
    setTeses(prev => prev.map((t, i) => {
      if (i !== idx) return t;
      const updated = { ...t, [field]: value };
      // If toggling semValor, reset the other field
      if (field === 'semValor' && value === true) {
        updated.valorApurado = '0';
      }
      if (field === 'semValor' && value === false) {
        updated.motivoSemValor = '';
      }
      return updated;
    }));
  }, []);

  const removeTese = useCallback((idx: number) => {
    setTeses(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const addTeseFromCatalog = useCallback((tese: any) => {
    const alreadyExists = teses.some(t => t.teseId === tese.id);
    if (alreadyExists) {
      toast.error('Esta tese já está na lista.');
      return;
    }
    setTeses(prev => [...prev, {
      teseId: tese.id,
      teseNome: tese.nome,
      classificacao: tese.classificacao || 'judicial',
      tributoEnvolvido: tese.tributoEnvolvido || '',
      valorApurado: '0',
      semValor: false,
      motivoSemValor: '',
      isNew: true,
    }]);
    setShowAddTese(false);
    toast.success(`Tese "${tese.nome}" adicionada.`);
  }, [teses]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        const result = await uploadFile.mutateAsync({
          nome: file.name,
          nomeOriginal: file.name,
          mimeType: file.type,
          tamanhoBytes: file.size,
          base64Data: base64,
          entidadeTipo: 'tarefa',
          entidadeId: task?.id,
          descricao: 'Memória de cálculo / Documento de análise',
        });
        setAnexos(prev => [...prev, { nome: file.name, url: result.url, tipo: file.type }]);
      }
      toast.success('Arquivo(s) enviado(s) com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar arquivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleGenerateRti = async () => {
    if (!task || !canGenerateRti) return;
    setRtiGenerating(true);
    try {
      // First, save/update task teses with valorApurado
      for (const tese of teses) {
        if (tese.id) {
          // Update existing
          await updateTaskTese.mutateAsync({
            id: tese.id,
            valorApurado: tese.semValor ? null : parseFloat(tese.valorApurado) || 0,
            status: tese.semValor ? 'descartada' : 'apurada',
          });
        } else if (tese.isNew) {
          // Create new task tese
          await createTaskTese.mutateAsync({
            taskId: task.id,
            teseId: tese.teseId,
            teseNome: tese.teseNome,
            aderente: tese.semValor ? 0 : 1,
            justificativaNaoAderente: tese.semValor ? tese.motivoSemValor : undefined,
            valorEstimado: parseFloat(tese.valorApurado) || 0,
          });
        }
      }

      // Build oportunidades for RTI
      const oportunidades = teses.filter(t => !t.semValor).map((t, idx) => ({
        descricao: t.teseNome,
        classificacao: t.classificacao === 'pacificada' ? 'pacificado' : 'nao_pacificado',
        valorApurado: parseFloat(t.valorApurado) || 0,
        teseId: t.teseId,
        ordem: idx,
      }));

      // Build alertas from conflicts
      const alertasItems = conflicts.map((c, idx) => ({
        tipo: 'conflito_teses',
        texto: `⚠️ ${c.descricao}: ${c.motivo}`,
        ordem: idx,
      }));

      // Create RTI
      const rti = await createRti.mutateAsync({
        caseId: task.caseId || 0,
        clienteId: task.clienteId,
        taskId: task.id,
        tesesAnalisadas: oportunidades.map(op => ({
          descricao: op.descricao,
          classificacao: op.classificacao,
          valorApurado: op.valorApurado,
          teseId: op.teseId,
        })),
        periodoAnalise: rtiForm.periodoAnalise,
        resumoExecutivo: rtiForm.resumoExecutivo,
        metodologia: rtiForm.metodologia,
        conclusao: rtiForm.conclusao,
        observacoes: observacoes,
        valorTotalEstimado: totalGeral.toFixed(2),
      } as any);

      const rtiId = (rti as any)?.id;
      if (rtiId) {
        // Save oportunidades
        for (const op of oportunidades) {
          await createOportunidade.mutateAsync({ ...op, rtiId, valorApurado: op.valorApurado });
        }
        // Save alertas
        if (alertasItems.length > 0) {
          await upsertAlertas.mutateAsync({
            rtiId,
            items: alertasItems,
          });
        }
        setGeneratedRtiId(rtiId);
      }

      setRtiGenerated(true);
      toast.success('RTI gerado com sucesso! Agora você pode finalizar a análise.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar RTI');
    } finally {
      setRtiGenerating(false);
    }
  };

  const handleFinishTask = async () => {
    if (!task || !rtiGenerated) {
      toast.error('É necessário gerar o RTI antes de finalizar a análise.');
      return;
    }
    try {
      const result = await finishTask.mutateAsync({
        id: task.id,
        observacoes,
        anexos,
        viabilidade: viabilidade as any,
        valorGlobalApurado: bestScenarioValue,
      });
      const viabLabel = viabilidade === 'viavel' ? 'VIÁVEL' : 'INVIÁVEL';
      const valorLabel = `R$ ${bestScenarioValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      toast.success(`Tarefa ${task.codigo} finalizada! Apuração: ${viabLabel} (${valorLabel}). Status alterado para "Feito".`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar tarefa');
    }
  };

  const formatCurrency = (v: number | string) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-purple-600" />
            Finalizar Análise &amp; Gerar RTI
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {task.codigo} — {task.clienteNome || task.titulo}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex gap-1 h-auto p-1">
            <TabsTrigger value="teses" className="text-xs flex-1 gap-1">
              <Scale className="w-3.5 h-3.5" />
              Teses &amp; Valores
              {teses.length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-1 h-4 px-1">{teses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resumo" className="text-xs flex-1 gap-1">
              <Calculator className="w-3.5 h-3.5" />
              Resumo &amp; Viabilidade
            </TabsTrigger>
            <TabsTrigger value="rti" className="text-xs flex-1 gap-1">
              <FileText className="w-3.5 h-3.5" />
              Dados RTI
            </TabsTrigger>
            <TabsTrigger value="anexos" className="text-xs flex-1 gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              Anexos
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: TESES & VALORES ===== */}
          <TabsContent value="teses" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Teses Atribuídas à Análise</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Insira o valor apurado para cada tese. Se não houver valor, marque "Sem valor" e informe o motivo.
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAddTese(!showAddTese)}>
                <Plus className="w-4 h-4" />
                Nova Tese
              </Button>
            </div>

            {/* Add Tese Selector */}
            {showAddTese && (
              <Card className="border-2 border-primary/30">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Selecione uma tese do banco:</p>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowAddTese(false)}>Fechar</Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {(allTeses as any[] || []).filter((t: any) => t.ativa).map((tese: any) => {
                      const alreadyAdded = teses.some(t => t.teseId === tese.id);
                      return (
                        <div key={tese.id} className={cn('flex items-center justify-between p-2 rounded hover:bg-muted/50 text-sm cursor-pointer', alreadyAdded && 'opacity-50')} onClick={() => !alreadyAdded && addTeseFromCatalog(tese)}>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{tese.nome}</p>
                            <p className="text-xs text-muted-foreground">{tese.tributoEnvolvido} • {tese.classificacao}</p>
                          </div>
                          {alreadyAdded ? (
                            <Badge variant="secondary" className="text-[10px] shrink-0">Já adicionada</Badge>
                          ) : (
                            <Plus className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Teses List */}
            {teses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border rounded-lg border-dashed">
                <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tese vinculada a esta tarefa.</p>
                <p className="text-xs mt-1">Adicione teses usando o botão "Nova Tese" acima.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teses.map((tese, idx) => {
                  const classInfo = CLASSIFICACAO_LABELS[tese.classificacao] || { label: tese.classificacao, color: 'bg-gray-100 text-gray-800' };
                  const isInConflict = conflicts.some(c =>
                    c.tesesGrupoA.some(t => t.index === idx) || c.tesesGrupoB.some(t => t.index === idx)
                  );

                  return (
                    <Card key={idx} className={cn('transition-all', isInConflict && 'border-amber-400 border-2')}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{tese.teseNome}</span>
                              <Badge className={cn('text-[10px]', classInfo.color)}>{classInfo.label}</Badge>
                              {tese.tributoEnvolvido && (
                                <Badge variant="outline" className="text-[10px]">{tese.tributoEnvolvido}</Badge>
                              )}
                              {tese.isNew && (
                                <Badge className="text-[10px] bg-blue-100 text-blue-800">Nova</Badge>
                              )}
                              {isInConflict && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-800 gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Conflito
                                </Badge>
                              )}
                            </div>

                            {/* Value or No-Value */}
                            <div className="flex items-end gap-3">
                              {!tese.semValor ? (
                                <div className="flex-1 max-w-xs space-y-1">
                                  <Label className="text-xs text-muted-foreground">Valor Apurado (R$)</Label>
                                  <CurrencyInput
                                    value={tese.valorApurado}
                                    onChange={(val) => updateTese(idx, 'valorApurado', val)}
                                    placeholder="R$ 0,00"
                                  />
                                </div>
                              ) : (
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs text-muted-foreground">Motivo (obrigatório)</Label>
                                  <Input
                                    placeholder="Informe por que não há valor para esta tese..."
                                    value={tese.motivoSemValor}
                                    onChange={(e) => updateTese(idx, 'motivoSemValor', e.target.value)}
                                    className={cn(!tese.motivoSemValor.trim() && 'border-red-300')}
                                  />
                                </div>
                              )}
                              <Button
                                variant={tese.semValor ? 'default' : 'outline'}
                                size="sm"
                                className={cn('gap-1 text-xs shrink-0', tese.semValor && 'bg-gray-600')}
                                onClick={() => updateTese(idx, 'semValor', !tese.semValor)}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {tese.semValor ? 'Sem valor' : 'Sem valor'}
                              </Button>
                            </div>
                          </div>

                          {/* Remove button (only for new teses) */}
                          {tese.isNew && (
                            <Button variant="ghost" size="sm" className="text-red-500 mt-1 shrink-0" onClick={() => removeTese(idx)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Validation message */}
            {teses.length > 0 && !allTesesFilled && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Preencha o valor apurado ou informe o motivo para todas as teses antes de gerar o RTI.</span>
              </div>
            )}
          </TabsContent>

          {/* ===== TAB: RESUMO & VIABILIDADE ===== */}
          <TabsContent value="resumo" className="space-y-4 mt-4">
            {/* Totals */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Geral</p>
                  <p className="text-xl font-bold">{formatCurrency(totalGeral)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Pacificado</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPacificado)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Judicial/Controverso</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(totalJudicial)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <Card className="border-amber-300 border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <h3 className="font-medium text-sm text-amber-800">Incompatibilidade entre Teses Detectada</h3>
                  </div>

                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="space-y-2 p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm font-medium text-amber-900">{conflict.descricao}</p>
                      <p className="text-xs text-amber-700">{conflict.motivo}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="p-2 bg-white rounded border">
                          <p className="text-[10px] text-muted-foreground mb-1">Grupo A</p>
                          {conflict.tesesGrupoA.map((t, i) => (
                            <p key={i} className="text-xs">{t.nome}: <strong>{formatCurrency(t.valor)}</strong></p>
                          ))}
                          <p className="text-xs font-medium mt-1">Subtotal: {formatCurrency(conflict.totalGrupoA)}</p>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <p className="text-[10px] text-muted-foreground mb-1">Grupo B</p>
                          {conflict.tesesGrupoB.map((t, i) => (
                            <p key={i} className="text-xs">{t.nome}: <strong>{formatCurrency(t.valor)}</strong></p>
                          ))}
                          <p className="text-xs font-medium mt-1">Subtotal: {formatCurrency(conflict.totalGrupoB)}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Cenários Alternativos</h4>
                    {conflictScenarios.map((scenario, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <p className="text-xs font-medium">{scenario.label}</p>
                          <p className="text-[10px] text-muted-foreground">{scenario.descricao}</p>
                        </div>
                        <p className="text-sm font-bold">{formatCurrency(scenario.valorTotal)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Viabilidade */}
            <Card className={cn(
              'border-2',
              viabilidade === 'viavel' ? 'border-emerald-300' : 'border-red-300'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">Classificação de Viabilidade</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Critério: ≥ R$ {VIABILIDADE_THRESHOLD.toLocaleString('pt-BR')} = Viável, &lt; R$ {VIABILIDADE_THRESHOLD.toLocaleString('pt-BR')} = Inviável
                    </p>
                    {conflicts.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Baseado no melhor cenário: {formatCurrency(bestScenarioValue)}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
                    viabilidade === 'viavel' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  )}>
                    {viabilidade === 'viavel' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                    {viabilidade === 'viavel' ? 'VIÁVEL' : 'INVIÁVEL'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações da Análise</Label>
              <Textarea
                placeholder="Descreva as conclusões da análise, pontos de atenção, etc."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>

          {/* ===== TAB: DADOS RTI ===== */}
          <TabsContent value="rti" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">
                Preencha os dados complementares do RTI. As teses e valores já são preenchidos automaticamente a partir da aba "Teses &amp; Valores".
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Período Analisado</Label>
              <Input
                placeholder="Ex: 01/2020 a 12/2024"
                value={rtiForm.periodoAnalise}
                onChange={(e) => setRtiForm(prev => ({ ...prev, periodoAnalise: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Resumo Executivo</Label>
              <Textarea
                rows={4}
                placeholder="A EVOX FISCAL LTDA, empresa especializada em consultoria tributária..."
                value={rtiForm.resumoExecutivo}
                onChange={(e) => setRtiForm(prev => ({ ...prev, resumoExecutivo: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Metodologia</Label>
              <Textarea
                rows={3}
                placeholder="Descreva a metodologia utilizada na análise..."
                value={rtiForm.metodologia}
                onChange={(e) => setRtiForm(prev => ({ ...prev, metodologia: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Conclusão</Label>
              <Textarea
                rows={3}
                placeholder="Conclusão da análise técnica..."
                value={rtiForm.conclusao}
                onChange={(e) => setRtiForm(prev => ({ ...prev, conclusao: e.target.value }))}
              />
            </div>
          </TabsContent>

          {/* ===== TAB: ANEXOS ===== */}
          <TabsContent value="anexos" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Anexar Documentos (Memória de Cálculo, etc.)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="finish-file-upload-new"
                  accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
                />
                <label htmlFor="finish-file-upload-new" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar arquivos</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Excel, Word, Imagens</p>
                </label>
                {uploadingFile && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs text-muted-foreground">Enviando...</span>
                  </div>
                )}
              </div>
              {anexos.length > 0 && (
                <div className="space-y-2 mt-2">
                  {anexos.map((anexo, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{anexo.nome}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => setAnexos(prev => prev.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Footer with RTI generation + Finish */}
        <div className="space-y-3">
          {/* RTI Status */}
          {rtiGenerated ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>RTI gerado com sucesso (ID: {generatedRtiId}). Você pode finalizar a análise.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
              <Info className="w-4 h-4 shrink-0" />
              <span>O RTI é pré-requisito para finalizar a tarefa. Preencha as teses e clique em "Gerar RTI".</span>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>

            {!rtiGenerated && (
              <Button
                onClick={handleGenerateRti}
                disabled={!canGenerateRti || rtiGenerating}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {rtiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Gerar RTI
              </Button>
            )}

            <Button
              onClick={handleFinishTask}
              disabled={!canFinish || finishTask.isPending}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {finishTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              Finalizar Análise
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
