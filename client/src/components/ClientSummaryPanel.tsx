import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Calculator, Loader2, Clock, AlertTriangle, CheckCircle,
  User, FileText, ClipboardList, Download, Building2, BarChart3, Handshake,
  Paperclip, ShieldCheck, ShieldAlert, ShieldOff, XCircle,
  UserPlus, Flag, MessageSquarePlus, FileDown, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FILA_LABELS: Record<string, string> = {
  apuracao: 'Apuração',
  retificacao: 'Retificação',
  compensacao: 'Compensação',
  ressarcimento: 'Ressarcimento',
  restituicao: 'Restituição',
};

const PRIORIDADE_OPTIONS = [
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'media', label: 'Média', color: 'bg-amber-100 text-amber-800' },
  { value: 'baixa', label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
];

interface ClientSummaryPanelProps {
  taskId: number;
  open: boolean;
  onClose: () => void;
  filaLabel?: string;
}

export default function ClientSummaryPanel({ taskId, open, onClose, filaLabel }: ClientSummaryPanelProps) {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';

  const { data, isLoading, refetch } = trpc.creditRecovery.credito.tasks.apuracaoSummary.useQuery(
    { taskId },
    { enabled: open && !!taskId }
  );

  // Users list for analyst assignment
  const { data: allUsers } = trpc.users.list.useQuery(undefined, { enabled: open && isAdmin });

  // Quick action states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showObsDialog, setShowObsDialog] = useState(false);
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [newObservation, setNewObservation] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const updateTaskMut = trpc.creditRecovery.credito.tasks.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Tarefa atualizada com sucesso');
    },
    onError: (e) => toast.error(e.message),
  });

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }); } catch { return d; }
  };
  const formatDateTime = (d: string | null | undefined) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
  };
  const formatCurrency = (v: number | string | null | undefined) => {
    if (!v) return 'R$ 0,00';
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  const regimeLabel = (r: string | null | undefined) => {
    if (!r) return '—';
    const map: Record<string, string> = { simples_nacional: 'Simples Nacional', lucro_presumido: 'Lucro Presumido', lucro_real: 'Lucro Real' };
    return map[r] || r;
  };
  const statusLabel = (s: string | null | undefined) => {
    if (!s) return { label: '—', color: 'bg-gray-100 text-gray-800' };
    const map: Record<string, { label: string; color: string }> = {
      a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
      fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
      feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
      concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
    };
    return map[s] || { label: s, color: 'bg-gray-100 text-gray-800' };
  };
  const slaLabel = (s: string | null | undefined) => {
    if (s === 'vencido') return { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (s === 'atencao') return { label: 'Atenção', color: 'bg-amber-100 text-amber-800', icon: Clock };
    return { label: 'No Prazo', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle };
  };
  const procLabel = (s: string | null | undefined) => {
    if (s === 'habilitada') return { label: 'Habilitada', color: 'bg-emerald-100 text-emerald-800', icon: ShieldCheck };
    if (s === 'prox_vencimento') return { label: 'Vencendo', color: 'bg-amber-100 text-amber-800', icon: ShieldAlert };
    if (s === 'vencida') return { label: 'Vencida', color: 'bg-red-100 text-red-800', icon: ShieldOff };
    return { label: 'Sem', color: 'bg-gray-100 text-gray-600', icon: ShieldOff };
  };

  const task = data?.task;
  const teses = data?.teses || [];
  const rtis = data?.rtis || [];
  const arquivos = data?.arquivos || [];
  const auditLog = data?.auditLog || [];

  const resolvedFilaLabel = filaLabel || (task?.fila ? FILA_LABELS[task.fila] || task.fila : 'Apuração');

  const sla = slaLabel(task?.slaStatus);
  const proc = procLabel(task?.procuracaoStatus);
  const st = statusLabel(task?.status);
  const SlaIcon = sla.icon;
  const ProcIcon = proc.icon;

  // Quick action handlers
  const handleAssignAnalyst = () => {
    if (!selectedAnalystId) return;
    const analyst = allUsers?.find((u: any) => u.id === Number(selectedAnalystId));
    updateTaskMut.mutate({
      id: taskId,
      responsavelId: Number(selectedAnalystId),
      responsavelNome: analyst?.name || '',
    });
    setShowAssignDialog(false);
    setSelectedAnalystId('');
  };

  const handleChangePriority = () => {
    if (!selectedPriority) return;
    updateTaskMut.mutate({
      id: taskId,
      prioridade: selectedPriority as any,
    });
    setShowPriorityDialog(false);
    setSelectedPriority('');
  };

  const handleAddObservation = () => {
    if (!newObservation.trim()) return;
    const currentObs = task?.observacoes || '';
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const userName = authUser?.name || 'Usuário';
    const appendedObs = currentObs
      ? `${currentObs}\n\n[${timestamp} - ${userName}]\n${newObservation.trim()}`
      : `[${timestamp} - ${userName}]\n${newObservation.trim()}`;
    updateTaskMut.mutate({
      id: taskId,
      observacoes: appendedObs,
    });
    setShowObsDialog(false);
    setNewObservation('');
  };

  // PDF Export
  const handleExportPdf = async () => {
    if (!task) return;
    setIsExportingPdf(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup bloqueado. Permita popups para exportar.');
        setIsExportingPdf(false);
        return;
      }

      const teseRows = teses.map((t: any) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${t.teseNome || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${t.tributoEnvolvido || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${t.teseTipo || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${t.aderente ? 'Sim' : 'Não'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;">${formatCurrency(t.valorEstimado)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;">${t.valorApurado ? formatCurrency(t.valorApurado) : '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${t.status || '—'}</td>
        </tr>
      `).join('');

      const rtiRows = rtis.map((r: any) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${r.numero || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${r.status || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${r.emitidoPorNome || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${formatDate(r.emitidoEm || r.createdAt)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;">${formatCurrency(r.totalApurado || r.valorTotalEstimado)}</td>
        </tr>
      `).join('');

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Resumo - ${task.clienteNome || task.codigo}</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 24px; color: #1f2937; font-size: 13px; line-height: 1.5; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 24px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.85; font-size: 13px; }
    .header .code { background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-family: monospace; font-weight: 700; font-size: 12px; }
    .header .badges { display: flex; gap: 8px; margin-top: 8px; }
    .header .badge { background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 14px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 20px; }
    .field-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
    .field-value { font-size: 13px; font-weight: 500; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; padding: 8px; text-align: left; font-size: 11px; font-weight: 600; color: #374151; border-bottom: 2px solid #d1d5db; }
    td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #d1d5db; font-size: 10px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${task.clienteNome || '—'}</h1>
    <p>${task.clienteCnpj || ''} ${task.clienteNomeFantasia ? '• ' + task.clienteNomeFantasia : ''}</p>
    <div class="badges">
      <span class="code">${task.codigo}</span>
      <span class="badge">${st.label}</span>
      <span class="badge">${sla.label}</span>
      <span class="badge">Fila: ${resolvedFilaLabel}</span>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Dados do Cliente</div>
    <div class="grid">
      <div><div class="field-label">Regime Tributário</div><div class="field-value">${regimeLabel(task.clienteRegime)}</div></div>
      <div><div class="field-label">Situação Cadastral</div><div class="field-value">${task.clienteSituacao || '—'}</div></div>
      <div><div class="field-label">Classificação</div><div class="field-value">${task.clienteClassificacao === 'novo' ? 'Novo' : 'Base'}</div></div>
      <div><div class="field-label">CNAE Principal</div><div class="field-value">${task.clienteCnae || '—'}</div></div>
      <div><div class="field-label">Faturamento Médio</div><div class="field-value">${formatCurrency(task.clienteFaturamento)}</div></div>
      <div><div class="field-label">Valor Médio Guias</div><div class="field-value">${formatCurrency(task.clienteGuias)}</div></div>
      <div><div class="field-label">Folha Pagamento</div><div class="field-value">${formatCurrency(task.clienteFolha)}</div></div>
      <div><div class="field-label">UF</div><div class="field-value">${task.clienteEstado || '—'}</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Dados da Tarefa</div>
    <div class="grid">
      <div><div class="field-label">Analista Responsável</div><div class="field-value">${task.responsavelApelido || task.responsavelNomeCompleto || 'Não atribuído'}</div></div>
      <div><div class="field-label">Parceiro</div><div class="field-value">${task.parceiroNome || 'Sem parceiro'}</div></div>
      <div><div class="field-label">Procuração</div><div class="field-value">${proc.label}</div></div>
      <div><div class="field-label">Prioridade</div><div class="field-value">${PRIORIDADE_OPTIONS.find(p => p.value === task.prioridade)?.label || 'Média'}</div></div>
      <div><div class="field-label">SLA</div><div class="field-value">${sla.label} (${task.slaDias} dias)</div></div>
      <div><div class="field-label">Criado Por</div><div class="field-value">${task.criadoPorNomeCompleto || '—'}</div></div>
    </div>
  </div>
  ${teses.length > 0 ? `
  <div class="section">
    <div class="section-title">Teses em ${resolvedFilaLabel} (${teses.length})</div>
    <table>
      <thead><tr><th>Tese</th><th>Tributo</th><th>Tipo</th><th style="text-align:center">Aderente</th><th style="text-align:right">Valor Estimado</th><th style="text-align:right">Valor Apurado</th><th style="text-align:center">Status</th></tr></thead>
      <tbody>${teseRows}</tbody>
    </table>
  </div>` : ''}
  ${rtis.length > 0 ? `
  <div class="section">
    <div class="section-title">RTIs Emitidos (${rtis.length})</div>
    <table>
      <thead><tr><th>Número</th><th>Status</th><th>Emitido Por</th><th>Data</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${rtiRows}</tbody>
    </table>
  </div>` : ''}
  <div class="footer">
    Relatório gerado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} • Evox Fiscal
  </div>
</body>
</html>`;

      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setIsExportingPdf(false);
      }, 500);
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Erro ao exportar PDF');
      setIsExportingPdf(false);
    }
  };

  /* ─── Field helper component ─── */
  const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
    <div className={cn('min-w-0', className)}>
      <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</span>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[92vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando resumo...</span>
          </div>
        ) : !task ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">Dados não encontrados.</div>
        ) : (
          <div className="flex flex-col">

            {/* ═══ HEADER ═══ */}
            <div className="sticky top-0 z-10 bg-background border-b">
              <div className="px-8 py-5 flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">{task.codigo}</span>
                    <Badge className={cn('text-xs px-2.5 py-0.5', st.color)}>{st.label}</Badge>
                    <Badge className={cn('text-xs gap-1.5 px-2.5 py-0.5', sla.color)}>
                      <SlaIcon className="w-3.5 h-3.5" />
                      {sla.label}
                    </Badge>
                    <Badge className={cn('text-xs gap-1.5 px-2.5 py-0.5', proc.color)}>
                      <ProcIcon className="w-3.5 h-3.5" />
                      {proc.label}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{task.clienteNome || '—'}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {task.clienteCnpj || ''} {task.clienteNomeFantasia ? `• ${task.clienteNomeFantasia}` : ''}
                    {' • Fila: '}<span className="font-semibold text-foreground">{resolvedFilaLabel}</span>
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <TooltipProvider delayDuration={200}>
                    {isAdmin && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9"
                              onClick={() => { setSelectedAnalystId(task.responsavelId?.toString() || ''); setShowAssignDialog(true); }}>
                              <UserPlus className="w-4 h-4" /> Analista
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Atribuir ou reatribuir analista</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9"
                              onClick={() => { setSelectedPriority(task.prioridade || 'media'); setShowPriorityDialog(true); }}>
                              <Flag className="w-4 h-4" /> Prioridade
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Alterar prioridade da tarefa</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9"
                          onClick={() => setShowObsDialog(true)}>
                          <MessageSquarePlus className="w-4 h-4" /> Observação
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Adicionar observação à tarefa</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9"
                          onClick={handleExportPdf} disabled={isExportingPdf}>
                          {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                          Exportar PDF
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar resumo em PDF</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* ═══ BODY ═══ */}
            <div className="px-8 py-6 space-y-6">

              {/* ─── ROW 1: Dados do Cliente + Dados da Tarefa — 3 columns ─── */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Card 1: Dados do Cliente */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Dados do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                      <Field label="Regime Tributário">{regimeLabel(task.clienteRegime)}</Field>
                      <Field label="Situação Cadastral"><span className="capitalize">{task.clienteSituacao || '—'}</span></Field>
                      <Field label="Classificação">
                        <Badge className={cn('text-[10px]', task.clienteClassificacao === 'novo' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700')}>
                          {task.clienteClassificacao === 'novo' ? 'Novo' : 'Base'}
                        </Badge>
                      </Field>
                      <Field label="CNAE Principal">
                        <span className="text-xs">{task.clienteCnae || '—'}</span>
                        {task.clienteCnaeDescricao && <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{task.clienteCnaeDescricao}</p>}
                      </Field>
                      <Field label="Faturamento Médio">{formatCurrency(task.clienteFaturamento)}</Field>
                      <Field label="Valor Médio Guias">{formatCurrency(task.clienteGuias)}</Field>
                      <Field label="Folha Pagamento">{formatCurrency(task.clienteFolha)}</Field>
                      <Field label="UF">{task.clienteEstado || '—'}</Field>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Atividades</span>
                      <div className="flex flex-wrap gap-1.5">
                        {task.clienteIndustrializa ? <Badge variant="outline" className="text-[10px]">Industrializa</Badge> : null}
                        {task.clienteComercializa ? <Badge variant="outline" className="text-[10px]">Comercializa</Badge> : null}
                        {task.clientePrestaServicos ? <Badge variant="outline" className="text-[10px]">Presta Serviços</Badge> : null}
                        {task.clienteContribuinteIcms ? <Badge variant="outline" className="text-[10px]">ICMS</Badge> : null}
                        {task.clienteContribuinteIpi ? <Badge variant="outline" className="text-[10px]">IPI</Badge> : null}
                        {task.clienteRegimeMonofasico ? <Badge variant="outline" className="text-[10px]">Monofásico</Badge> : null}
                        {!task.clienteIndustrializa && !task.clienteComercializa && !task.clientePrestaServicos && (
                          <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                        )}
                      </div>
                    </div>
                    {(task.clienteProcessos || task.clienteParcelamentos) && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Alertas</span>
                        <div className="flex gap-2">
                          {task.clienteProcessos ? <Badge variant="destructive" className="text-[10px]">Processos Judiciais Ativos</Badge> : null}
                          {task.clienteParcelamentos ? <Badge className="text-[10px] bg-amber-100 text-amber-800">Parcelamentos Ativos</Badge> : null}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Card 2: Dados da Tarefa */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      Dados da Tarefa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                      <Field label="Analista Responsável">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{task.responsavelApelido || task.responsavelNomeCompleto || <span className="italic text-muted-foreground">Não atribuído</span>}</span>
                          {isAdmin && (
                            <button className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                              onClick={() => { setSelectedAnalystId(task.responsavelId?.toString() || ''); setShowAssignDialog(true); }}
                              title="Reatribuir analista">
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {task.responsavelEmail && <p className="text-[10px] text-muted-foreground mt-0.5">{task.responsavelEmail}</p>}
                      </Field>
                      <Field label="Parceiro">
                        <div className="flex items-center gap-1.5">
                          <Handshake className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span className="truncate">{task.parceiroNome || <span className="italic text-muted-foreground">Sem parceiro</span>}</span>
                        </div>
                        {task.parceiroCnpj && <p className="text-[10px] text-muted-foreground mt-0.5">{task.parceiroCnpj}</p>}
                      </Field>
                      <Field label="Procuração">
                        <Badge className={cn('text-[10px] gap-1', proc.color)}>
                          <ProcIcon className="w-3 h-3" />
                          {proc.label}
                        </Badge>
                        {task.clienteProcuracaoValidade && <p className="text-[10px] text-muted-foreground mt-0.5">Validade: {formatDate(task.clienteProcuracaoValidade)}</p>}
                      </Field>
                      <Field label="Prioridade">
                        <div className="flex items-center gap-1.5">
                          <Badge className={cn('text-[10px]',
                            PRIORIDADE_OPTIONS.find(p => p.value === task.prioridade)?.color || 'bg-amber-100 text-amber-800'
                          )}>
                            {PRIORIDADE_OPTIONS.find(p => p.value === task.prioridade)?.label || 'Média'}
                          </Badge>
                          {isAdmin && (
                            <button className="text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => { setSelectedPriority(task.prioridade || 'media'); setShowPriorityDialog(true); }}
                              title="Alterar prioridade">
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </Field>
                      <Field label="SLA">
                        <Badge className={cn('text-[10px] gap-1 w-fit', sla.color)}>
                          <SlaIcon className="w-3 h-3" />
                          {sla.label} ({task.slaDias} dias)
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Início: {formatDate(task.dataInicio)} • Fim: {formatDate(task.dataFimPrevista)}
                        </p>
                      </Field>
                      <Field label="Criado Por">
                        {task.criadoPorNomeCompleto || '—'}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(task.createdAt)}</p>
                      </Field>
                      {task.viabilidade && (
                        <Field label="Viabilidade">
                          <Badge className={cn('text-[10px] gap-1', task.viabilidade === 'viavel' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                            {task.viabilidade === 'viavel' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {task.viabilidade === 'viavel' ? 'Viável' : 'Inviável'}
                          </Badge>
                          {task.valorGlobalApurado && <p className="text-[10px] text-muted-foreground mt-0.5">Valor: {formatCurrency(task.valorGlobalApurado)}</p>}
                        </Field>
                      )}
                      {task.dataConclusao && (
                        <Field label="Concluído em">{formatDateTime(task.dataConclusao)}</Field>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: Observações + Exceções + Arquivos */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <MessageSquarePlus className="w-4 h-4 text-primary" />
                      Observações & Arquivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 space-y-4">
                    {/* Observações */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Observações</span>
                        <button className="text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => setShowObsDialog(true)} title="Adicionar observação">
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {task.observacoes ? (
                        <div className="text-sm whitespace-pre-wrap max-h-[100px] overflow-y-auto bg-muted/30 rounded-lg p-2.5 text-foreground">
                          {task.observacoes}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhuma observação registrada.</p>
                      )}
                    </div>

                    {/* Exceções */}
                    {task.clienteExcecoes && (
                      <div>
                        <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Exceções / Especificidades</span>
                        <div className="text-sm whitespace-pre-wrap max-h-[80px] overflow-y-auto bg-amber-50 rounded-lg p-2.5 text-amber-900 border border-amber-200">
                          {task.clienteExcecoes}
                        </div>
                      </div>
                    )}

                    {/* Arquivos */}
                    <div>
                      <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Arquivos Vinculados ({arquivos.length})
                      </span>
                      {arquivos.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhum arquivo vinculado.</p>
                      ) : (
                        <div className="space-y-1 max-h-[120px] overflow-y-auto">
                          {arquivos.map((arq: any) => (
                            <a key={arq.id} href={arq.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 p-1.5 rounded-md border hover:bg-muted/40 transition-colors group text-xs">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                              <span className="truncate flex-1 group-hover:text-primary">{arq.nomeOriginal || arq.nome}</span>
                              <Download className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ─── ROW 2: Teses Vinculadas (full width) ─── */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    Teses em {resolvedFilaLabel}
                    <Badge variant="outline" className="text-[10px] ml-1">{teses.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {teses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">Nenhuma tese vinculada a esta tarefa.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Tese</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">Tributo</th>
                            <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">Tipo</th>
                            <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">Classificação</th>
                            <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">Aderente</th>
                            <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs">Valor Estimado</th>
                            <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs">Valor Apurado</th>
                            <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">SLA (dias)</th>
                            <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teses.map((tese: any) => (
                            <tr key={tese.id} className="border-b hover:bg-muted/20 transition-colors">
                              <td className="px-3 py-2.5">
                                <p className="font-medium text-sm">{tese.teseNome || '—'}</p>
                                {tese.teseFundamentacao && <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{tese.teseFundamentacao}</p>}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">{tese.tributoEnvolvido || '—'}</td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge variant="outline" className="text-[10px]">{tese.teseTipo || '—'}</Badge>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge variant="outline" className="text-[10px]">{tese.teseClassificacao || '—'}</Badge>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {tese.aderente ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(tese.valorEstimado)}</td>
                              <td className="px-3 py-2.5 text-right font-medium">{tese.valorApurado ? formatCurrency(tese.valorApurado) : '—'}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{tese.slaApuracaoDias || '—'}</td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge className={cn('text-[10px]',
                                  tese.status === 'apurada' ? 'bg-emerald-100 text-emerald-800' :
                                  tese.status === 'em_apuracao' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                )}>{tese.status || 'selecionada'}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ─── ROW 3: RTIs + Histórico side by side ─── */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* RTIs */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      RTIs Emitidos
                      <Badge variant="outline" className="text-[10px] ml-1">{rtis.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {rtis.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">Nenhum RTI emitido.</p>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {rtis.map((rti: any) => (
                          <div key={rti.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary">{rti.numero}</span>
                                <Badge className={cn('text-[10px]',
                                  rti.status === 'emitido' ? 'bg-emerald-100 text-emerald-800' :
                                  rti.status === 'rascunho' ? 'bg-amber-100 text-amber-800' :
                                  'bg-gray-100 text-gray-800'
                                )}>{rti.status || '—'}</Badge>
                                {rti.versao && <span className="text-[10px] text-muted-foreground">v{rti.versao}</span>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {rti.emitidoPorNome || '—'} • {formatDate(rti.emitidoEm || rti.createdAt)}
                              </p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-bold">{formatCurrency(rti.totalApurado || rti.valorTotalEstimado)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Histórico de Ações */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Histórico de Ações
                      <Badge variant="outline" className="text-[10px] ml-1">{auditLog.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {auditLog.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">Nenhuma ação registrada.</p>
                    ) : (
                      <div className="space-y-0 max-h-[200px] overflow-y-auto">
                        {auditLog.map((log: any) => (
                          <div key={log.id} className="flex items-start gap-3 text-xs py-2 border-b last:border-0">
                            <span className="text-muted-foreground shrink-0 w-[110px] tabular-nums">{formatDateTime(log.createdAt)}</span>
                            <span className="font-semibold shrink-0 text-foreground">{log.usuarioNome || '—'}</span>
                            <span className="text-muted-foreground flex-1">{log.descricao}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        )}
      </DialogContent>

      {/* ═══ ACTION DIALOGS ═══ */}

      {/* Assign Analyst Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Atribuir Analista
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Selecione o analista responsável pela tarefa <span className="font-mono font-bold text-primary">{task?.codigo}</span>
            </p>
            <Select value={selectedAnalystId} onValueChange={setSelectedAnalystId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um analista..." />
              </SelectTrigger>
              <SelectContent>
                {(allUsers || []).map((u: any) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name} {u.apelido ? `(${u.apelido})` : ''} — {u.role === 'admin' ? 'Gestor' : 'Analista'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
            <Button disabled={!selectedAnalystId || updateTaskMut.isPending} onClick={handleAssignAnalyst}>
              {updateTaskMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Priority Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-primary" />
              Alterar Prioridade
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Selecione a nova prioridade para a tarefa <span className="font-mono font-bold text-primary">{task?.codigo}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRIORIDADE_OPTIONS.map((p) => (
                <button key={p.value}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium',
                    selectedPriority === p.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                  onClick={() => setSelectedPriority(p.value)}>
                  <Badge className={cn('text-[10px]', p.color)}>{p.label}</Badge>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPriorityDialog(false)}>Cancelar</Button>
            <Button disabled={!selectedPriority || selectedPriority === task?.prioridade || updateTaskMut.isPending} onClick={handleChangePriority}>
              {updateTaskMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Observation Dialog */}
      <Dialog open={showObsDialog} onOpenChange={setShowObsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-primary" />
              Adicionar Observação
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              A observação será adicionada ao histórico da tarefa <span className="font-mono font-bold text-primary">{task?.codigo}</span>
            </p>
            <Textarea
              placeholder="Digite sua observação..."
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 5 caracteres. Será registrada com seu nome e data/hora.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowObsDialog(false); setNewObservation(''); }}>Cancelar</Button>
            <Button disabled={newObservation.trim().length < 5 || updateTaskMut.isPending} onClick={handleAddObservation}>
              {updateTaskMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
