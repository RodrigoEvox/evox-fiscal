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
  Paperclip, ShieldCheck, ShieldAlert, ShieldOff, XCircle, X,
  UserPlus, Flag, MessageSquarePlus, FileDown, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Constants ─── */
const FILA_LABELS: Record<string, string> = {
  apuracao: 'Apuração', retificacao: 'Retificação', compensacao: 'Compensação',
  ressarcimento: 'Ressarcimento', restituicao: 'Restituição',
};
const PRIORIDADE_OPTIONS = [
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'media', label: 'Média', color: 'bg-amber-100 text-amber-800' },
  { value: 'baixa', label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
];

/* ─── Helpers ─── */
const fmt = {
  date: (d: any) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }); } catch { return String(d); } },
  dateTime: (d: any) => { if (!d) return '—'; try { return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return String(d); } },
  currency: (v: any) => { if (!v) return 'R$ 0,00'; return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); },
  regime: (r: any) => { if (!r) return '—'; const m: Record<string, string> = { simples_nacional: 'Simples Nacional', lucro_presumido: 'Lucro Presumido', lucro_real: 'Lucro Real' }; return m[r] || r; },
  status: (s: any) => {
    const m: Record<string, { label: string; color: string }> = {
      a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
      fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
      feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
      concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
    };
    return m[s] || { label: s || '—', color: 'bg-gray-100 text-gray-800' };
  },
  sla: (s: any) => {
    if (s === 'vencido') return { label: 'Vencido', color: 'bg-red-100 text-red-800', Icon: AlertTriangle };
    if (s === 'atencao') return { label: 'Atenção', color: 'bg-amber-100 text-amber-800', Icon: Clock };
    return { label: 'No Prazo', color: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle };
  },
  proc: (s: any) => {
    if (s === 'habilitada') return { label: 'Habilitada', color: 'bg-emerald-100 text-emerald-800', Icon: ShieldCheck };
    if (s === 'prox_vencimento') return { label: 'Vencendo', color: 'bg-amber-100 text-amber-800', Icon: ShieldAlert };
    if (s === 'vencida') return { label: 'Vencida', color: 'bg-red-100 text-red-800', Icon: ShieldOff };
    return { label: 'Sem', color: 'bg-gray-100 text-gray-600', Icon: ShieldOff };
  },
};

/* ─── Field display ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm text-foreground leading-snug">{children}</div>
    </div>
  );
}

/* ─── Props ─── */
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
  const { data: allUsers } = trpc.users.list.useQuery(undefined, { enabled: open && isAdmin });

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showObsDialog, setShowObsDialog] = useState(false);
  const [selectedAnalystId, setSelectedAnalystId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [newObservation, setNewObservation] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const updateTaskMut = trpc.creditRecovery.credito.tasks.update.useMutation({
    onSuccess: () => { refetch(); toast.success('Tarefa atualizada com sucesso'); },
    onError: (e) => toast.error(e.message),
  });

  const task = data?.task;
  const teses = data?.teses || [];
  const rtis = data?.rtis || [];
  const arquivos = data?.arquivos || [];
  const auditLog = data?.auditLog || [];

  const resolvedFilaLabel = filaLabel || (task?.fila ? FILA_LABELS[task.fila] || task.fila : 'Apuração');
  const sla = fmt.sla(task?.slaStatus);
  const proc = fmt.proc(task?.procuracaoStatus);
  const st = fmt.status(task?.status);

  /* ─── Quick action handlers ─── */
  const handleAssignAnalyst = () => {
    if (!selectedAnalystId) return;
    const analyst = allUsers?.find((u: any) => u.id === Number(selectedAnalystId));
    updateTaskMut.mutate({ id: taskId, responsavelId: Number(selectedAnalystId), responsavelNome: analyst?.name || '' });
    setShowAssignDialog(false); setSelectedAnalystId('');
  };
  const handleChangePriority = () => {
    if (!selectedPriority) return;
    updateTaskMut.mutate({ id: taskId, prioridade: selectedPriority as any });
    setShowPriorityDialog(false); setSelectedPriority('');
  };
  const handleAddObservation = () => {
    if (!newObservation.trim()) return;
    const currentObs = task?.observacoes || '';
    const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const name = authUser?.name || 'Usuário';
    const obs = currentObs ? `${currentObs}\n\n[${ts} - ${name}]\n${newObservation.trim()}` : `[${ts} - ${name}]\n${newObservation.trim()}`;
    updateTaskMut.mutate({ id: taskId, observacoes: obs });
    setShowObsDialog(false); setNewObservation('');
  };

  /* ─── PDF Export ─── */
  const handleExportPdf = async () => {
    if (!task) return;
    setIsExportingPdf(true);
    try {
      const pw = window.open('', '_blank');
      if (!pw) { toast.error('Popup bloqueado. Permita popups para exportar.'); setIsExportingPdf(false); return; }
      const teseRows = teses.map((t: any) => `<tr><td>${t.teseNome||'—'}</td><td>${t.tributoEnvolvido||'—'}</td><td style="text-align:center">${t.teseTipo||'—'}</td><td style="text-align:center">${t.aderente?'Sim':'Não'}</td><td style="text-align:right">${fmt.currency(t.valorEstimado)}</td><td style="text-align:right">${t.valorApurado?fmt.currency(t.valorApurado):'—'}</td><td style="text-align:center">${t.status||'—'}</td></tr>`).join('');
      const rtiRows = rtis.map((r: any) => `<tr><td>${r.numero||'—'}</td><td>${r.status||'—'}</td><td>${r.emitidoPorNome||'—'}</td><td>${fmt.date(r.emitidoEm||r.createdAt)}</td><td style="text-align:right">${fmt.currency(r.totalApurado||r.valorTotalEstimado)}</td></tr>`).join('');
      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Resumo - ${task.clienteNome||task.codigo}</title><style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}body{font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:24px;color:#1f2937;font-size:13px;line-height:1.5}.header{background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);color:#fff;padding:24px;border-radius:8px;margin-bottom:20px}.header h1{margin:0 0 4px;font-size:22px}.header p{margin:0;opacity:.85;font-size:13px}.header .code{background:rgba(255,255,255,.2);padding:2px 8px;border-radius:4px;font-family:monospace;font-weight:700;font-size:12px}.header .badges{display:flex;gap:8px;margin-top:8px}.header .badge{background:rgba(255,255,255,.2);padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}.section{margin-bottom:16px}.section-title{font-size:14px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #2563eb;padding-bottom:4px;margin-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 20px}.field-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:1px}.field-value{font-size:13px;font-weight:500;margin-bottom:6px}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:8px;text-align:left;font-size:11px;font-weight:600;color:#374151;border-bottom:2px solid #d1d5db}td{padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px}.footer{margin-top:20px;padding-top:12px;border-top:1px solid #d1d5db;font-size:10px;color:#9ca3af;text-align:center}</style></head><body><div class="header"><h1>${task.clienteNome||'—'}</h1><p>${task.clienteCnpj||''} ${task.clienteNomeFantasia?'• '+task.clienteNomeFantasia:''}</p><div class="badges"><span class="code">${task.codigo}</span><span class="badge">${st.label}</span><span class="badge">${sla.label}</span><span class="badge">Fila: ${resolvedFilaLabel}</span></div></div><div class="section"><div class="section-title">Dados do Cliente</div><div class="grid"><div><div class="field-label">Regime</div><div class="field-value">${fmt.regime(task.clienteRegime)}</div></div><div><div class="field-label">Situação</div><div class="field-value">${task.clienteSituacao||'—'}</div></div><div><div class="field-label">CNAE</div><div class="field-value">${task.clienteCnae||'—'}</div></div><div><div class="field-label">Faturamento</div><div class="field-value">${fmt.currency(task.clienteFaturamento)}</div></div><div><div class="field-label">Guias</div><div class="field-value">${fmt.currency(task.clienteGuias)}</div></div><div><div class="field-label">Folha</div><div class="field-value">${fmt.currency(task.clienteFolha)}</div></div></div></div><div class="section"><div class="section-title">Dados da Tarefa</div><div class="grid"><div><div class="field-label">Analista</div><div class="field-value">${task.responsavelApelido||task.responsavelNomeCompleto||'Não atribuído'}</div></div><div><div class="field-label">Parceiro</div><div class="field-value">${task.parceiroNome||'Sem parceiro'}</div></div><div><div class="field-label">Procuração</div><div class="field-value">${proc.label}</div></div><div><div class="field-label">Prioridade</div><div class="field-value">${PRIORIDADE_OPTIONS.find(p=>p.value===task.prioridade)?.label||'Média'}</div></div><div><div class="field-label">SLA</div><div class="field-value">${sla.label} (${task.slaDias} dias)</div></div><div><div class="field-label">Criado Por</div><div class="field-value">${task.criadoPorNomeCompleto||'—'}</div></div></div></div>${teses.length>0?`<div class="section"><div class="section-title">Teses (${teses.length})</div><table><thead><tr><th>Tese</th><th>Tributo</th><th>Tipo</th><th style="text-align:center">Aderente</th><th style="text-align:right">Estimado</th><th style="text-align:right">Apurado</th><th style="text-align:center">Status</th></tr></thead><tbody>${teseRows}</tbody></table></div>`:''}${rtis.length>0?`<div class="section"><div class="section-title">RTIs (${rtis.length})</div><table><thead><tr><th>Número</th><th>Status</th><th>Emitido Por</th><th>Data</th><th style="text-align:right">Valor</th></tr></thead><tbody>${rtiRows}</tbody></table></div>`:''}<div class="footer">Relatório gerado em ${new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} • Evox Fiscal</div></body></html>`;
      pw.document.write(html); pw.document.close();
      setTimeout(() => { pw.print(); setIsExportingPdf(false); }, 500);
    } catch { toast.error('Erro ao exportar PDF'); setIsExportingPdf(false); }
  };

  /* ═══════════════════════════════════════════════════════════════════
     RENDER — Fullscreen overlay
     ═══════════════════════════════════════════════════════════════════ */
  if (!open) return null;

  return (
    <>
      {/* ─── FULLSCREEN OVERLAY ─── */}
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-4 z-50 bg-background rounded-xl border shadow-2xl flex flex-col overflow-hidden">

        {/* ═══ STICKY HEADER ═══ */}
        <div className="shrink-0 border-b bg-background px-8 py-4">
          <div className="flex items-start justify-between gap-6">
            {/* Left: Task info */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Carregando resumo...</span>
                </div>
              ) : !task ? (
                <span className="text-muted-foreground">Dados não encontrados.</span>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded">{task.codigo}</span>
                    <Badge className={cn('text-xs', st.color)}>{st.label}</Badge>
                    <Badge className={cn('text-xs gap-1', sla.color)}><sla.Icon className="w-3 h-3" />{sla.label}</Badge>
                    <Badge className={cn('text-xs gap-1', proc.color)}><proc.Icon className="w-3 h-3" />{proc.label}</Badge>
                    {task.prioridade && (
                      <Badge className={cn('text-xs', PRIORIDADE_OPTIONS.find(p => p.value === task.prioridade)?.color || 'bg-amber-100 text-amber-800')}>
                        {PRIORIDADE_OPTIONS.find(p => p.value === task.prioridade)?.label || 'Média'}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{task.clienteNome || '—'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {task.clienteCnpj} {task.clienteNomeFantasia ? `• ${task.clienteNomeFantasia}` : ''} • Fila: <span className="font-semibold text-foreground">{resolvedFilaLabel}</span>
                  </p>
                </>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <TooltipProvider delayDuration={200}>
                {isAdmin && task && (
                  <>
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
                        onClick={() => { setSelectedAnalystId(task.responsavelId?.toString() || ''); setShowAssignDialog(true); }}>
                        <UserPlus className="w-3.5 h-3.5" /> Analista
                      </Button>
                    </TooltipTrigger><TooltipContent>Atribuir/reatribuir analista</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
                        onClick={() => { setSelectedPriority(task.prioridade || 'media'); setShowPriorityDialog(true); }}>
                        <Flag className="w-3.5 h-3.5" /> Prioridade
                      </Button>
                    </TooltipTrigger><TooltipContent>Alterar prioridade</TooltipContent></Tooltip>
                  </>
                )}
                {task && (
                  <>
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowObsDialog(true)}>
                        <MessageSquarePlus className="w-3.5 h-3.5" /> Observação
                      </Button>
                    </TooltipTrigger><TooltipContent>Adicionar observação</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleExportPdf} disabled={isExportingPdf}>
                        {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} Exportar PDF
                      </Button>
                    </TooltipTrigger><TooltipContent>Exportar resumo em PDF</TooltipContent></Tooltip>
                  </>
                )}
              </TooltipProvider>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ═══ SCROLLABLE BODY ═══ */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !task ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Dados não encontrados.</div>
          ) : (
            <div className="p-8 space-y-8">

              {/* ─── ROW 1: 3 cards side by side ─── */}
              <div className="grid grid-cols-3 gap-6">

                {/* Card: Dados do Cliente */}
                <Card className="border">
                  <CardHeader className="pb-3 pt-5 px-6">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> Dados do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <Field label="Regime Tributário">{fmt.regime(task.clienteRegime)}</Field>
                      <Field label="Situação Cadastral"><span className="capitalize">{task.clienteSituacao || '—'}</span></Field>
                      <Field label="Classificação">
                        <Badge className={cn('text-[10px]', task.clienteClassificacao === 'novo' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700')}>
                          {task.clienteClassificacao === 'novo' ? 'Novo' : 'Base'}
                        </Badge>
                      </Field>
                      <Field label="CNAE Principal">{task.clienteCnae || '—'}</Field>
                      <Field label="Faturamento Médio">{fmt.currency(task.clienteFaturamento)}</Field>
                      <Field label="Valor Médio Guias">{fmt.currency(task.clienteGuias)}</Field>
                      <Field label="Folha Pagamento">{fmt.currency(task.clienteFolha)}</Field>
                      <Field label="UF">{task.clienteEstado || '—'}</Field>
                    </div>
                    {/* Atividades */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Atividades</p>
                      <div className="flex flex-wrap gap-1.5">
                        {task.clienteIndustrializa && <Badge variant="outline" className="text-[10px]">Industrializa</Badge>}
                        {task.clienteComercializa && <Badge variant="outline" className="text-[10px]">Comercializa</Badge>}
                        {task.clientePrestaServicos && <Badge variant="outline" className="text-[10px]">Presta Serviços</Badge>}
                        {task.clienteContribuinteIcms && <Badge variant="outline" className="text-[10px]">ICMS</Badge>}
                        {task.clienteContribuinteIpi && <Badge variant="outline" className="text-[10px]">IPI</Badge>}
                        {task.clienteRegimeMonofasico && <Badge variant="outline" className="text-[10px]">Monofásico</Badge>}
                        {!task.clienteIndustrializa && !task.clienteComercializa && !task.clientePrestaServicos && (
                          <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                        )}
                      </div>
                    </div>
                    {/* Alertas */}
                    {(task.clienteProcessos || task.clienteParcelamentos) && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Alertas</p>
                        <div className="flex gap-2">
                          {task.clienteProcessos && <Badge variant="destructive" className="text-[10px]">Processos Judiciais</Badge>}
                          {task.clienteParcelamentos && <Badge className="text-[10px] bg-amber-100 text-amber-800">Parcelamentos</Badge>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Card: Dados da Tarefa */}
                <Card className="border">
                  <CardHeader className="pb-3 pt-5 px-6">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" /> Dados da Tarefa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <Field label="Analista Responsável">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{task.responsavelApelido || task.responsavelNomeCompleto || 'Não atribuído'}</span>
                          {isAdmin && <button className="text-muted-foreground hover:text-primary shrink-0" onClick={() => { setSelectedAnalystId(task.responsavelId?.toString() || ''); setShowAssignDialog(true); }}><Pencil className="w-3 h-3" /></button>}
                        </div>
                        {task.responsavelEmail && <p className="text-[10px] text-muted-foreground mt-0.5">{task.responsavelEmail}</p>}
                      </Field>
                      <Field label="Parceiro">
                        <div className="flex items-center gap-1.5">
                          <Handshake className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span className="truncate">{task.parceiroNome || 'Sem parceiro'}</span>
                        </div>
                        {task.parceiroCnpj && <p className="text-[10px] text-muted-foreground mt-0.5">{task.parceiroCnpj}</p>}
                      </Field>
                      <Field label="Procuração">
                        <Badge className={cn('text-[10px] gap-1', proc.color)}><proc.Icon className="w-3 h-3" />{proc.label}</Badge>
                        {task.clienteProcuracaoValidade && <p className="text-[10px] text-muted-foreground mt-0.5">Validade: {fmt.date(task.clienteProcuracaoValidade)}</p>}
                      </Field>
                      <Field label="Prioridade">
                        <div className="flex items-center gap-1.5">
                          <Badge className={cn('text-[10px]', PRIORIDADE_OPTIONS.find(p => p.value === task.prioridade)?.color || 'bg-amber-100 text-amber-800')}>
                            {PRIORIDADE_OPTIONS.find(p => p.value === task.prioridade)?.label || 'Média'}
                          </Badge>
                          {isAdmin && <button className="text-muted-foreground hover:text-primary" onClick={() => { setSelectedPriority(task.prioridade || 'media'); setShowPriorityDialog(true); }}><Pencil className="w-3 h-3" /></button>}
                        </div>
                      </Field>
                      <Field label="SLA">
                        <Badge className={cn('text-[10px] gap-1', sla.color)}><sla.Icon className="w-3 h-3" />{sla.label} ({task.slaDias}d)</Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Início: {fmt.date(task.dataInicio)} • Fim: {fmt.date(task.dataFimPrevista)}</p>
                      </Field>
                      <Field label="Criado Por">
                        {task.criadoPorNomeCompleto || '—'}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{fmt.dateTime(task.createdAt)}</p>
                      </Field>
                      {task.viabilidade && (
                        <Field label="Viabilidade">
                          <Badge className={cn('text-[10px] gap-1', task.viabilidade === 'viavel' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                            {task.viabilidade === 'viavel' ? 'Viável' : 'Inviável'}
                          </Badge>
                        </Field>
                      )}
                      {task.dataConclusao && <Field label="Concluído em">{fmt.dateTime(task.dataConclusao)}</Field>}
                    </div>
                  </CardContent>
                </Card>

                {/* Card: Observações & Arquivos */}
                <Card className="border">
                  <CardHeader className="pb-3 pt-5 px-6">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <MessageSquarePlus className="w-4 h-4 text-primary" /> Observações & Arquivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 space-y-5">
                    {/* Observações */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Observações</p>
                        <button className="text-muted-foreground hover:text-primary" onClick={() => setShowObsDialog(true)}><MessageSquarePlus className="w-3.5 h-3.5" /></button>
                      </div>
                      {task.observacoes ? (
                        <div className="text-sm whitespace-pre-wrap max-h-[120px] overflow-y-auto bg-muted/30 rounded-lg p-3">{task.observacoes}</div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhuma observação.</p>
                      )}
                    </div>
                    {/* Exceções */}
                    {task.clienteExcecoes && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Exceções</p>
                        <div className="text-sm whitespace-pre-wrap max-h-[80px] overflow-y-auto bg-amber-50 rounded-lg p-3 text-amber-900 border border-amber-200">{task.clienteExcecoes}</div>
                      </div>
                    )}
                    {/* Arquivos */}
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Arquivos ({arquivos.length})</p>
                      {arquivos.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhum arquivo.</p>
                      ) : (
                        <div className="space-y-1 max-h-[120px] overflow-y-auto">
                          {arquivos.map((arq: any) => (
                            <a key={arq.id} href={arq.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 transition-colors group text-xs">
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

              {/* ─── ROW 2: Teses (full width table) ─── */}
              <Card className="border">
                <CardHeader className="pb-3 pt-5 px-6">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" /> Teses em {resolvedFilaLabel}
                    <Badge variant="outline" className="text-[10px] ml-1">{teses.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {teses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhuma tese vinculada.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground">Tese</th>
                            <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground">Tributo</th>
                            <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground">Tipo</th>
                            <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground">Classificação</th>
                            <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground">Aderente</th>
                            <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground">Valor Estimado</th>
                            <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground">Valor Apurado</th>
                            <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground">SLA (dias)</th>
                            <th className="text-center px-4 py-3 font-semibold text-xs text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teses.map((t: any) => (
                            <tr key={t.id} className="border-b hover:bg-muted/20">
                              <td className="px-4 py-3">
                                <p className="font-medium">{t.teseNome || '—'}</p>
                                {t.teseFundamentacao && <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">{t.teseFundamentacao}</p>}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{t.tributoEnvolvido || '—'}</td>
                              <td className="px-4 py-3 text-center"><Badge variant="outline" className="text-[10px]">{t.teseTipo || '—'}</Badge></td>
                              <td className="px-4 py-3 text-center"><Badge variant="outline" className="text-[10px]">{t.teseClassificacao || '—'}</Badge></td>
                              <td className="px-4 py-3 text-center">
                                {t.aderente ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">{fmt.currency(t.valorEstimado)}</td>
                              <td className="px-4 py-3 text-right font-medium">{t.valorApurado ? fmt.currency(t.valorApurado) : '—'}</td>
                              <td className="px-4 py-3 text-center font-mono text-xs">{t.slaApuracaoDias || '—'}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge className={cn('text-[10px]',
                                  t.status === 'apurada' ? 'bg-emerald-100 text-emerald-800' :
                                  t.status === 'em_apuracao' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                )}>{t.status || 'selecionada'}</Badge>
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
              <div className="grid grid-cols-2 gap-6">
                {/* RTIs */}
                <Card className="border">
                  <CardHeader className="pb-3 pt-5 px-6">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> RTIs Emitidos
                      <Badge variant="outline" className="text-[10px] ml-1">{rtis.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    {rtis.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Nenhum RTI emitido.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto">
                        {rtis.map((rti: any) => (
                          <div key={rti.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
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
                              <p className="text-xs text-muted-foreground mt-1">{rti.emitidoPorNome || '—'} • {fmt.date(rti.emitidoEm || rti.createdAt)}</p>
                            </div>
                            <p className="text-sm font-bold shrink-0 ml-4">{fmt.currency(rti.totalApurado || rti.valorTotalEstimado)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Histórico */}
                <Card className="border">
                  <CardHeader className="pb-3 pt-5 px-6">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" /> Histórico de Ações
                      <Badge variant="outline" className="text-[10px] ml-1">{auditLog.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    {auditLog.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Nenhuma ação registrada.</p>
                    ) : (
                      <div className="space-y-0 max-h-[320px] overflow-y-auto">
                        {auditLog.map((log: any) => {
                          // Parse detailed descriptions that contain ': ' separator
                          const hasDetails = log.descricao && log.descricao.includes(': ') && (log.descricao.includes('alterado de') || log.descricao.includes('definido como') || log.descricao.includes('Observação adicionada'));
                          const parts = hasDetails ? log.descricao.split('. ').filter(Boolean) : null;
                          return (
                            <div key={log.id} className="flex flex-col gap-1 text-xs py-2.5 border-b last:border-0">
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground shrink-0 w-[110px] tabular-nums">{fmt.dateTime(log.createdAt)}</span>
                                <span className="font-semibold shrink-0">{log.usuarioNome || '—'}</span>
                                {!hasDetails && <span className="text-muted-foreground flex-1">{log.descricao}</span>}
                              </div>
                              {hasDetails && parts && (
                                <div className="ml-[110px] pl-3 border-l-2 border-primary/20 space-y-0.5">
                                  {parts.map((part: string, idx: number) => {
                                    // Highlight the changed field name in bold
                                    const match = part.match(/^(.+?)\s+(alterado de|definido como)\s+(.+)$/);
                                    if (match) {
                                      return (
                                        <div key={idx} className="text-muted-foreground">
                                          <span className="font-medium text-foreground">{match[1]}</span>{' '}
                                          <span>{match[2]}</span>{' '}
                                          <span className="text-foreground">{match[3].replace(/\.$/, '')}</span>
                                        </div>
                                      );
                                    }
                                    return <div key={idx} className="text-muted-foreground">{part.replace(/\.$/, '')}</div>;
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ═══ ACTION DIALOGS (rendered outside the fullscreen overlay) ═══ */}

      {/* Assign Analyst */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md z-[60]">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Atribuir Analista</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Selecione o analista para <span className="font-mono font-bold text-primary">{task?.codigo}</span></p>
            <Select value={selectedAnalystId} onValueChange={setSelectedAnalystId}>
              <SelectTrigger><SelectValue placeholder="Selecione um analista..." /></SelectTrigger>
              <SelectContent className="z-[70]">
                {(allUsers || []).map((u: any) => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.name} {u.apelido ? `(${u.apelido})` : ''} — {u.role === 'admin' ? 'Gestor' : 'Analista'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
            <Button disabled={!selectedAnalystId || updateTaskMut.isPending} onClick={handleAssignAnalyst}>
              {updateTaskMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Priority */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent className="max-w-md z-[60]">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Flag className="w-5 h-5 text-primary" /> Alterar Prioridade</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Nova prioridade para <span className="font-mono font-bold text-primary">{task?.codigo}</span></p>
            <div className="grid grid-cols-2 gap-2">
              {PRIORIDADE_OPTIONS.map((p) => (
                <button key={p.value} className={cn('flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium',
                  selectedPriority === p.value ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-muted-foreground/30'
                )} onClick={() => setSelectedPriority(p.value)}>
                  <Badge className={cn('text-[10px]', p.color)}>{p.label}</Badge>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPriorityDialog(false)}>Cancelar</Button>
            <Button disabled={!selectedPriority || selectedPriority === task?.prioridade || updateTaskMut.isPending} onClick={handleChangePriority}>
              {updateTaskMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Observation */}
      <Dialog open={showObsDialog} onOpenChange={setShowObsDialog}>
        <DialogContent className="max-w-md z-[60]">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-primary" /> Adicionar Observação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Observação para <span className="font-mono font-bold text-primary">{task?.codigo}</span></p>
            <Textarea placeholder="Digite sua observação..." value={newObservation} onChange={(e) => setNewObservation(e.target.value)} rows={4} className="resize-none" />
            <p className="text-xs text-muted-foreground">Mínimo 5 caracteres.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowObsDialog(false); setNewObservation(''); }}>Cancelar</Button>
            <Button disabled={newObservation.trim().length < 5 || updateTaskMut.isPending} onClick={handleAddObservation}>
              {updateTaskMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
