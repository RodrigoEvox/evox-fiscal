import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  ChevronRight, Loader2, Search, AlertTriangle, CheckCircle,
  User, PlusCircle, Receipt, Eye, FileText, ShieldCheck, ShieldAlert, CalendarClock, RefreshCw,
  ArrowLeft, Clock, Flag, Lock, RotateCcw, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GuiaUploadOcr from '@/components/GuiaUploadOcr';
import BackToDashboard from '@/components/BackToDashboard';
import ClientSummaryPanel from '@/components/ClientSummaryPanel';
import TarefasAtrasadasBanner from '@/components/TarefasAtrasadasBanner';
import { useConfirmClose } from '@/components/ConfirmCloseDialog';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
  fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
  feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
};

const PRIORIDADE_LABELS: Record<string, { label: string; color: string }> = {
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  media: { label: 'Média', color: 'bg-amber-100 text-amber-800' },
  baixa: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
};

const STATUS_GUIA: Record<string, { label: string; color: string }> = {
  a_vencer: { label: 'A Vencer', color: 'bg-blue-100 text-blue-800' },
  vencida: { label: 'Vencida', color: 'bg-red-100 text-red-800' },
  perto_vencimento: { label: 'Próx. Vencimento', color: 'bg-amber-100 text-amber-800' },
  compensada: { label: 'Compensada', color: 'bg-emerald-100 text-emerald-800' },
};

const PERDCOMP_STATUS: Record<string, { label: string; color: string }> = {
  transmitido: { label: 'Transmitido', color: 'bg-blue-100 text-blue-800' },
  homologado: { label: 'Homologado', color: 'bg-emerald-100 text-emerald-800' },
  nao_homologado: { label: 'Não Homologado', color: 'bg-red-100 text-red-800' },
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

export default function CreditoFilaRessarcimento() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const resetPage = () => setCurrentPage(1);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [queueExceptionDialog, setQueueExceptionDialog] = useState(false);
  const [exceptionTask, setExceptionTask] = useState<any>(null);
  const [exceptionJustificativa, setExceptionJustificativa] = useState('');

  // Exception request (analyst)
  const [exceptionRequestDialog, setExceptionRequestDialog] = useState(false);
  const [exceptionRequestTask, setExceptionRequestTask] = useState<any>(null);
  const [exceptionRequestJustificativa, setExceptionRequestJustificativa] = useState('');
  const [summaryTaskId, setSummaryTaskId] = useState<number | null>(null);
  const requestExceptionMut = trpc.creditRecovery.credito.tasks.requestException.useMutation();
  const { data: exceptionRequests, refetch: refetchExceptions } = trpc.creditRecovery.credito.tasks.listExceptionRequests.useQuery(
    { status: 'pendente' },
    { enabled: isAdmin, staleTime: 30_000 }
  );
  const { data: pendingExceptionsCount = 0 } = trpc.creditRecovery.credito.tasks.countPendingExceptions.useQuery(
    undefined,
    { enabled: isAdmin, staleTime: 30_000 }
  );
  const respondExceptionMut = trpc.creditRecovery.credito.tasks.respondException.useMutation();
  const [, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 60000); return () => clearInterval(i); }, []);
  const getTimeInStage = (task: any) => {
    // Tempo total que a empresa está na fila (desde a criação)
    if (!task.createdAt) return '—';
    const diff = Math.max(0, Date.now() - new Date(task.createdAt).getTime());
    const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`; if (h > 0) return `${h}h ${m}m`; return `${m}m`;
  };
  const [showGuiaDialog, setShowGuiaDialog] = useState(false);
  const [showPerdcompDialog, setShowPerdcompDialog] = useState(false);
  const [perdcompSearch, setPerdcompSearch] = useState('');
  const [activeTab, setActiveTab] = useState('guias');

  const [guiaForm, setGuiaForm] = useState({
    cnpjGuia: '', codigoReceita: '', grupoTributo: '', periodoApuracao: '',
    dataVencimento: '', valorOriginal: 0, valorMulta: 0, valorJuros: 0,
    valorTotal: 0, valorCompensado: 0, statusGuia: 'a_vencer', observacoes: '',
  });

  const [perdcompForm, setPerdcompForm] = useState({
    numeroPerdcomp: '', tipoDocumento: 'Original', numeroControle: '',
    cnpjDeclarante: '', nomeEmpresarial: '', tipoCredito: '',
    oriundoAcaoJudicial: false, creditoSucedida: false,
    numeroDocArrecadacao: '', codigoReceita: '', grupoTributo: '',
    dataArrecadacao: '', periodoApuracao: '', valorCredito: 0,
    valorDebitosCompensados: 0, saldoRemanescente: 0,
    dataTransmissao: '', representanteNome: '', representanteCpf: '',
    versaoSistema: '', codigoSerpro: '', dataRecebimentoSerpro: '',
    status: 'transmitido', despachoDecisorio: '', observacoes: '',
    feitoPelaEvox: true, modalidade: 'ressarcimento' as const,
    debitosCompensadosJson: [] as Array<{ tributo: string; valor: number }>,
  });

  const isGuiaFormDirty = !!(guiaForm.cnpjGuia || guiaForm.codigoReceita || guiaForm.valorOriginal || guiaForm.observacoes);
  const closeGuiaDialog = useCallback(() => setShowGuiaDialog(false), []);
  const { guardedClose: guardedCloseGuia, ConfirmAlert: GuiaConfirmAlert } = useConfirmClose(isGuiaFormDirty, closeGuiaDialog);
  const isPerdcompFormDirty = !!(perdcompForm.numeroPerdcomp || perdcompForm.cnpjDeclarante || perdcompForm.valorCredito || perdcompForm.observacoes);
  const closePerdcompDialog = useCallback(() => setShowPerdcompDialog(false), []);
  const { guardedClose: guardedClosePerdcomp, ConfirmAlert: PerdcompConfirmAlert } = useConfirmClose(isPerdcompFormDirty, closePerdcompDialog);

  const { data: tasks, isLoading } = trpc.creditRecovery.credito.tasks.list.useQuery({ fila: 'ressarcimento' } as any);
  const guiasByTask = trpc.creditRecovery.admin.guias.list.useQuery(
    { taskId: selectedTask?.id || 0 }, { enabled: !!selectedTask }
  );
  const perdcompSearchResult = trpc.creditRecovery.admin.perdcompFull.search.useQuery(
    { query: perdcompSearch }, { enabled: perdcompSearch.length >= 3 }
  );

  const createGuia = trpc.creditRecovery.admin.guias.create.useMutation({
    onSuccess: () => { toast.success('Guia registrada'); guiasByTask.refetch(); setShowGuiaDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const createPerdcomp = trpc.creditRecovery.admin.perdcompFull.create.useMutation({
    onSuccess: () => { toast.success('PerdComp registrada'); setShowPerdcompDialog(false); },
    onError: (e) => toast.error(e.message),
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks as any[];
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => t.titulo?.toLowerCase().includes(term) || t.codigo?.toLowerCase().includes(term) || t.responsavelNome?.toLowerCase().includes(term));
    }
    result.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return result;
  }, [tasks, statusFilter, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = useMemo(() => { const s = (currentPage - 1) * pageSize; return filteredTasks.slice(s, s + pageSize); }, [filteredTasks, currentPage, pageSize]);
  useEffect(() => { resetPage(); }, [statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const all = (tasks as any[]) || [];
    return { total: all.length, aFazer: all.filter(t => t.status === 'a_fazer').length, fazendo: all.filter(t => t.status === 'fazendo').length, feito: all.filter(t => t.status === 'feito').length, emAtraso: all.filter(t => t.slaStatus === 'vencido').length };
  }, [tasks]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  const handleSubmitGuia = () => {
    if (!selectedTask) return;
    createGuia.mutate({ taskId: selectedTask.id, caseId: selectedTask.caseId || undefined, clienteId: selectedTask.clienteId, ...guiaForm });
  };

  const handleSubmitPerdcomp = () => {
    if (!selectedTask) return;
    if (!perdcompForm.numeroPerdcomp.trim()) { toast.error('Número da PerdComp é obrigatório'); return; }
    createPerdcomp.mutate({ taskId: selectedTask.id, caseId: selectedTask.caseId || undefined, clienteId: selectedTask.clienteId, ...perdcompForm });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Back to Dashboard */}
      <BackToDashboard />

      {/* Tarefas Atrasadas */}
      <TarefasAtrasadasBanner fila="ressarcimento" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span><ChevronRight className="w-3.5 h-3.5" /><span className="text-foreground font-medium">Ressarcimento</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3"><RefreshCw className="w-6 h-6 text-primary" />Fila de Ressarcimento</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de pedidos de ressarcimento, PerdComps e comprovantes.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar PerdComp..." value={perdcompSearch} onChange={(e) => setPerdcompSearch(e.target.value)} className="pl-10 w-[220px]" />
            {perdcompSearch.length >= 3 && perdcompSearchResult.data && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {(perdcompSearchResult.data as any[]).length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">Nenhuma PerdComp encontrada</div>
                ) : (perdcompSearchResult.data as any[]).map((pc: any) => (
                  <div key={pc.id} className="p-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0" onClick={() => { setPerdcompSearch(''); toast.info(`PerdComp ${pc.numeroPerdcomp} — ${pc.feitoPelaEvox ? 'Feita pela Evox' : 'Não feita pela Evox'} — Status: ${pc.status}`); }}>
                    <p className="text-xs font-medium">{pc.numeroPerdcomp}</p>
                    <p className="text-[10px] text-muted-foreground">{pc.cnpjDeclarante} — {pc.nomeEmpresarial}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={cn('text-[9px]', PERDCOMP_STATUS[pc.status]?.color)}>{PERDCOMP_STATUS[pc.status]?.label || pc.status}</Badge>
                      <Badge className={cn('text-[9px]', pc.feitoPelaEvox ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800')}>{pc.feitoPelaEvox ? 'Evox' : 'Externo'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => navigate('/credito/nova-tarefa-credito')} className="gap-2"><PlusCircle className="w-4 h-4" />Nova Tarefa</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'A Fazer', value: stats.aFazer, color: 'text-amber-600' },
          { label: 'Fazendo', value: stats.fazendo, color: 'text-blue-600' },
          { label: 'Feito', value: stats.feito, color: 'text-purple-600' },
          { label: 'Em Atraso', value: stats.emAtraso, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-3 text-center"><p className={cn('text-2xl font-bold', s.color)}>{s.value}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p></CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, título ou responsável..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
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
              <p className="text-sm">Nenhuma tarefa de ressarcimento encontrada.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/credito/nova-tarefa-credito')}><PlusCircle className="w-4 h-4" />Criar Nova Tarefa</Button>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="bg-muted/50 border-b">
                    <th className="px-2 py-3 text-xs font-semibold text-muted-foreground uppercase w-[40px] text-center">#</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase w-[80px]">Código</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase min-w-[200px]">Título</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase w-[90px]">Status</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase w-[90px]">Prioridade</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase w-[100px] text-center">Tempo</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase w-[120px]">Responsável</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase w-[80px]">SLA</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase w-[150px]">Criado Por</th>
                    <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase text-center w-[120px]">Ações</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {paginatedTasks.map((task: any, idx: number) => {
                      const gi = (currentPage - 1) * pageSize + idx + 1;
                      const si = STATUS_LABELS[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-800' };
                      const pi = PRIORIDADE_LABELS[task.prioridade] || { label: task.prioridade, color: 'bg-gray-100 text-gray-800' };
                      const ov = task.slaStatus === 'vencido';
                      const af = filteredTasks.filter((t: any) => t.status === 'a_fazer');
                      const isFirst = af.length > 0 && af[0].id === task.id;
                      const locked = task.status === 'a_fazer' && !isFirst && !isAdmin;
                      return (
                        <tr key={task.id} className={cn('hover:bg-muted/30 transition-colors', ov && 'bg-red-50/50', locked && 'opacity-60')}>
                          <td className="px-2 py-3 text-center"><span className="font-mono text-xs font-bold text-muted-foreground">{gi}</span></td>
                          <td className="px-3 py-3"><span className="font-mono text-xs text-muted-foreground">{task.codigo}</span></td>
                          <td className="px-3 py-3"><p className="font-medium text-sm truncate max-w-[250px] cursor-pointer hover:text-primary hover:underline transition-colors" onClick={() => setSummaryTaskId(task.id)}>{task.titulo}</p></td>
                          <td className="px-3 py-3"><Badge className={cn('text-[10px]', si.color)}>{si.label}</Badge></td>
                          <td className="px-3 py-3"><Badge className={cn('text-[10px]', pi.color)}>{pi.label}</Badge></td>
                          <td className="px-3 py-3 text-center"><span className="text-xs font-mono text-muted-foreground">{getTimeInStage(task)}</span></td>
                          <td className="px-3 py-3"><span className="text-xs text-muted-foreground truncate">{task.responsavelNome || '—'}</span></td>
                          <td className="px-3 py-3">{ov ? <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="w-3 h-3" />Atraso</Badge> : <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-1"><CheckCircle className="w-3 h-3" />OK</Badge>}</td>
                          <td className="px-3 py-3"><div className="text-xs"><span className="font-medium text-foreground">{task.criadoPorNome || '—'}</span><div className="text-[10px] text-muted-foreground">{task.createdAt ? new Date(task.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div></div></td>
                          <td className="px-3 py-3 text-center">
                            {locked && !isAdmin && <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => { setExceptionRequestTask(task); setExceptionRequestJustificativa(''); setExceptionRequestDialog(true); }}><Lock className="w-3 h-3" />Pegar</Button>}
                            {locked && isAdmin && <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 border-amber-300 text-amber-700" onClick={() => { setExceptionTask(task); setExceptionJustificativa(''); setQueueExceptionDialog(true); }}><Flag className="w-3 h-3" />Exceção</Button>}
                            {!locked && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => { setSelectedTask(task); setShowDetailDialog(true); setActiveTab('guias'); }}><Eye className="w-3.5 h-3.5" />Detalhar</Button>}
                            {(task.status === 'feito' || task.status === 'concluido') && isAdmin && (
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => {
                                setConfirmDialog({ open: true, title: 'Reabrir Tarefa', message: `Deseja reabrir a tarefa ${task.codigo}?`, onConfirm: () => { toast.info('Solicitação de reabertura registrada.'); setConfirmDialog(prev => ({ ...prev, open: false })); } });
                              }}><RotateCcw className="w-3 h-3" />Reabrir</Button>
                            )}
                            {task.reaberta && <Badge variant="outline" className="text-[9px] border-blue-300 text-blue-600 gap-0.5"><RotateCcw className="w-2.5 h-2.5" />Reaberta</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredTasks.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Exibindo {((currentPage-1)*pageSize)+1}–{Math.min(currentPage*pageSize, filteredTasks.length)} de {filteredTasks.length}</span>
                    <span>|</span><span>Por página:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); resetPage(); }}>
                      <SelectTrigger className="h-7 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage<=1} onClick={() => setCurrentPage(1)}>«</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage<=1} onClick={() => setCurrentPage(p=>p-1)}>‹</Button>
                    <span className="text-xs font-medium px-2">Página {currentPage} de {totalPages}</span>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage>=totalPages} onClick={() => setCurrentPage(p=>p+1)}>›</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage>=totalPages} onClick={() => setCurrentPage(totalPages)}>»</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />Ressarcimento — {selectedTask?.titulo}</DialogTitle></DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="guias" className="gap-1"><FileText className="w-3.5 h-3.5" />Guias</TabsTrigger>
              <TabsTrigger value="perdcomps" className="gap-1"><Receipt className="w-3.5 h-3.5" />PerdComps</TabsTrigger>
              <TabsTrigger value="info" className="gap-1"><ShieldCheck className="w-3.5 h-3.5" />Informações</TabsTrigger>
            </TabsList>

            <TabsContent value="guias" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Guias para Ressarcimento</h3>
                <Button size="sm" className="gap-1" onClick={() => { setGuiaForm({ cnpjGuia: '', codigoReceita: '', grupoTributo: '', periodoApuracao: '', dataVencimento: '', valorOriginal: 0, valorMulta: 0, valorJuros: 0, valorTotal: 0, valorCompensado: 0, statusGuia: 'a_vencer', observacoes: '' }); setShowGuiaDialog(true); }}><PlusCircle className="w-3.5 h-3.5" />Adicionar Guia</Button>
              </div>
              {guiasByTask.isLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div> : (guiasByTask.data as any[])?.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-8 gap-2 px-3 py-1.5 bg-muted/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wider rounded">
                    <div>Cód. Receita</div><div>Grupo</div><div>Período</div><div>Vencimento</div><div className="text-right">Original</div><div className="text-right">Total</div><div className="text-right">Ressarcido</div><div>Status</div>
                  </div>
                  {(guiasByTask.data as any[]).map((guia: any) => {
                    const statusG = STATUS_GUIA[guia.statusGuia] || { label: guia.statusGuia, color: 'bg-gray-100 text-gray-800' };
                    return (
                      <div key={guia.id} className="grid grid-cols-8 gap-2 px-3 py-2 border rounded hover:bg-muted/20 items-center text-xs">
                        <div className="font-mono">{guia.codigoReceita || '—'}</div>
                        <div className="truncate">{guia.grupoTributo || '—'}</div>
                        <div>{guia.periodoApuracao || '—'}</div>
                        <div className="flex items-center gap-1"><CalendarClock className="w-3 h-3 text-muted-foreground" />{formatDate(guia.dataVencimento)}</div>
                        <div className="text-right font-medium">{formatCurrency(Number(guia.valorOriginal || 0))}</div>
                        <div className="text-right font-medium">{formatCurrency(Number(guia.valorTotal || 0))}</div>
                        <div className="text-right font-medium text-emerald-600">{formatCurrency(Number(guia.valorCompensado || 0))}</div>
                        <div><Badge className={cn('text-[9px]', statusG.color)}>{statusG.label}</Badge></div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end pt-2 border-t text-sm"><span className="text-muted-foreground mr-2">Total Ressarcido:</span><span className="font-bold text-emerald-600">{formatCurrency((guiasByTask.data as any[]).reduce((s, g) => s + Number(g.valorCompensado || 0), 0))}</span></div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Nenhuma guia registrada.</p><p className="text-xs mt-1">Adicione as guias para pedido de ressarcimento.</p></div>
              )}
            </TabsContent>

            <TabsContent value="perdcomps" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">PerdComps de Ressarcimento</h3>
                <Button size="sm" className="gap-1" onClick={() => { setPerdcompForm({ numeroPerdcomp: '', tipoDocumento: 'Original', numeroControle: '', cnpjDeclarante: '', nomeEmpresarial: '', tipoCredito: '', oriundoAcaoJudicial: false, creditoSucedida: false, numeroDocArrecadacao: '', codigoReceita: '', grupoTributo: '', dataArrecadacao: '', periodoApuracao: '', valorCredito: 0, valorDebitosCompensados: 0, saldoRemanescente: 0, dataTransmissao: '', representanteNome: '', representanteCpf: '', versaoSistema: '', codigoSerpro: '', dataRecebimentoSerpro: '', status: 'transmitido', despachoDecisorio: '', observacoes: '', feitoPelaEvox: true, modalidade: 'ressarcimento', debitosCompensadosJson: [] }); setShowPerdcompDialog(true); }}><PlusCircle className="w-3.5 h-3.5" />Registrar PerdComp</Button>
              </div>
              <div className="text-center py-6 text-muted-foreground"><Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">As PerdComps de ressarcimento aparecerão aqui.</p><p className="text-xs mt-1">Use a busca rápida no topo para localizar PerdComps por número, CNPJ ou nome.</p></div>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              {selectedTask && (
                <Card><CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground text-xs">Código</p><p className="font-medium">{selectedTask.codigo}</p></div>
                    <div><p className="text-muted-foreground text-xs">Status</p><Badge className={STATUS_LABELS[selectedTask.status]?.color || ''}>{STATUS_LABELS[selectedTask.status]?.label || selectedTask.status}</Badge></div>
                    <div><p className="text-muted-foreground text-xs">Responsável</p><p className="font-medium">{selectedTask.responsavelNome || '—'}</p></div>
                    <div><p className="text-muted-foreground text-xs">Criado por</p><p className="font-medium">{selectedTask.criadoPorNome || '—'}</p></div>
                    <div><p className="text-muted-foreground text-xs">Criado em</p><p className="font-medium">{formatDateTime(selectedTask.createdAt)}</p></div>
                    <div><p className="text-muted-foreground text-xs">Vencimento</p><p className="font-medium">{formatDate(selectedTask.dataVencimento)}</p></div>
                  </div>
                  <div className="pt-3 border-t"><p className="text-xs text-muted-foreground">O ressarcimento segue o mesmo fluxo da compensação. Insira as guias, registre os dados do recibo da PerdComp e anexe comprovantes. O pedido de ressarcimento será acompanhado até a homologação.</p></div>
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* New Guia Dialog */}
      <Dialog open={showGuiaDialog} onOpenChange={(val) => { if (!val) guardedCloseGuia(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Adicionar Guia — Ressarcimento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* OCR Upload */}
            <GuiaUploadOcr
              clienteId={selectedTask?.clienteId}
              onGuiaProcessed={() => {}}
              onAutoFillGuia={(data) => setGuiaForm(f => ({ ...f, ...data, valorCompensado: f.valorCompensado }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">CNPJ da Guia</Label><Input placeholder="00.000.000/0000-00" value={guiaForm.cnpjGuia} onChange={(e) => setGuiaForm(f => ({ ...f, cnpjGuia: e.target.value }))} /></div>
              <div><Label className="text-xs">Código da Receita</Label><Input placeholder="Ex: 2172" value={guiaForm.codigoReceita} onChange={(e) => setGuiaForm(f => ({ ...f, codigoReceita: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Grupo de Tributo</Label>
                <Select value={guiaForm.grupoTributo} onValueChange={(v) => setGuiaForm(f => ({ ...f, grupoTributo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="INSS/Previdenciários">INSS/Previdenciários</SelectItem><SelectItem value="PIS/COFINS">PIS/COFINS</SelectItem><SelectItem value="IRPJ/CSLL">IRPJ/CSLL</SelectItem><SelectItem value="IPI">IPI</SelectItem><SelectItem value="Outros">Outros</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Período de Apuração</Label><Input placeholder="MM/AAAA" value={guiaForm.periodoApuracao} onChange={(e) => setGuiaForm(f => ({ ...f, periodoApuracao: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data de Vencimento</Label><Input type="date" value={guiaForm.dataVencimento} onChange={(e) => setGuiaForm(f => ({ ...f, dataVencimento: e.target.value }))} /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={guiaForm.statusGuia} onValueChange={(v) => setGuiaForm(f => ({ ...f, statusGuia: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="a_vencer">A Vencer</SelectItem><SelectItem value="perto_vencimento">Próx. Vencimento</SelectItem><SelectItem value="vencida">Vencida</SelectItem><SelectItem value="compensada">Compensada</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div><Label className="text-xs">Valor Original (R$)</Label><Input type="number" step="0.01" value={guiaForm.valorOriginal || ''} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setGuiaForm(f => ({ ...f, valorOriginal: v, valorTotal: v + f.valorMulta + f.valorJuros })); }} /></div>
              <div><Label className="text-xs">Multa (R$)</Label><Input type="number" step="0.01" value={guiaForm.valorMulta || ''} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setGuiaForm(f => ({ ...f, valorMulta: v, valorTotal: f.valorOriginal + v + f.valorJuros })); }} /></div>
              <div><Label className="text-xs">Juros (R$)</Label><Input type="number" step="0.01" value={guiaForm.valorJuros || ''} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setGuiaForm(f => ({ ...f, valorJuros: v, valorTotal: f.valorOriginal + f.valorMulta + v })); }} /></div>
              <div><Label className="text-xs">Valor Total (R$)</Label><Input type="number" step="0.01" value={guiaForm.valorTotal || ''} readOnly className="bg-muted/30" /></div>
            </div>
            <div><Label className="text-xs">Valor Ressarcido (R$)</Label><Input type="number" step="0.01" value={guiaForm.valorCompensado || ''} onChange={(e) => setGuiaForm(f => ({ ...f, valorCompensado: parseFloat(e.target.value) || 0 }))} /></div>
            <div><Label className="text-xs">Observações</Label><Textarea value={guiaForm.observacoes} onChange={(e) => setGuiaForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={guardedCloseGuia}>Cancelar</Button>
            <Button onClick={handleSubmitGuia} disabled={createGuia.isPending} className="gap-2">{createGuia.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Registrar Guia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New PerdComp Dialog */}
      <Dialog open={showPerdcompDialog} onOpenChange={(val) => { if (!val) guardedClosePerdcomp(); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />Registrar PerdComp — Ressarcimento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Card className="border-dashed"><CardHeader className="pb-2"><CardTitle className="text-sm">Dados da Declaração</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Número da Declaração *</Label><Input value={perdcompForm.numeroPerdcomp} onChange={(e) => setPerdcompForm(f => ({ ...f, numeroPerdcomp: e.target.value }))} /></div>
                <div><Label className="text-xs">Número de Controle</Label><Input value={perdcompForm.numeroControle} onChange={(e) => setPerdcompForm(f => ({ ...f, numeroControle: e.target.value }))} /></div>
                <div><Label className="text-xs">Tipo de Documento</Label><Select value={perdcompForm.tipoDocumento} onValueChange={(v) => setPerdcompForm(f => ({ ...f, tipoDocumento: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Original">Original</SelectItem><SelectItem value="Retificadora">Retificadora</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">CNPJ Declarante</Label><Input value={perdcompForm.cnpjDeclarante} onChange={(e) => setPerdcompForm(f => ({ ...f, cnpjDeclarante: e.target.value }))} /></div>
                <div><Label className="text-xs">Nome Empresarial</Label><Input value={perdcompForm.nomeEmpresarial} onChange={(e) => setPerdcompForm(f => ({ ...f, nomeEmpresarial: e.target.value }))} /></div>
              </div>
              <div><Label className="text-xs">Data de Transmissão</Label><Input type="date" value={perdcompForm.dataTransmissao} onChange={(e) => setPerdcompForm(f => ({ ...f, dataTransmissao: e.target.value }))} /></div>
            </CardContent></Card>

            <Card className="border-dashed"><CardHeader className="pb-2"><CardTitle className="text-sm">Dados do Crédito</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Tipo de Crédito</Label><Input value={perdcompForm.tipoCredito} onChange={(e) => setPerdcompForm(f => ({ ...f, tipoCredito: e.target.value }))} /></div>
                <div><Label className="text-xs">Código da Receita</Label><Input value={perdcompForm.codigoReceita} onChange={(e) => setPerdcompForm(f => ({ ...f, codigoReceita: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3"><Checkbox checked={perdcompForm.oriundoAcaoJudicial} onCheckedChange={(c) => setPerdcompForm(f => ({ ...f, oriundoAcaoJudicial: !!c }))} /><Label className="text-xs">Oriundo de Ação Judicial</Label></div>
                <div className="flex items-center gap-3"><Checkbox checked={perdcompForm.creditoSucedida} onCheckedChange={(c) => setPerdcompForm(f => ({ ...f, creditoSucedida: !!c }))} /><Label className="text-xs">Crédito de Sucedida</Label></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Nº Doc. Arrecadação</Label><Input value={perdcompForm.numeroDocArrecadacao} onChange={(e) => setPerdcompForm(f => ({ ...f, numeroDocArrecadacao: e.target.value }))} /></div>
                <div><Label className="text-xs">Grupo de Tributo</Label><Input value={perdcompForm.grupoTributo} onChange={(e) => setPerdcompForm(f => ({ ...f, grupoTributo: e.target.value }))} /></div>
                <div><Label className="text-xs">Data de Arrecadação</Label><Input type="date" value={perdcompForm.dataArrecadacao} onChange={(e) => setPerdcompForm(f => ({ ...f, dataArrecadacao: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Valor do Crédito (R$)</Label><Input type="number" step="0.01" value={perdcompForm.valorCredito || ''} onChange={(e) => setPerdcompForm(f => ({ ...f, valorCredito: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label className="text-xs">Valor Débitos (R$)</Label><Input type="number" step="0.01" value={perdcompForm.valorDebitosCompensados || ''} onChange={(e) => setPerdcompForm(f => ({ ...f, valorDebitosCompensados: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label className="text-xs">Saldo Remanescente (R$)</Label><Input type="number" step="0.01" value={perdcompForm.saldoRemanescente || ''} onChange={(e) => setPerdcompForm(f => ({ ...f, saldoRemanescente: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
            </CardContent></Card>

            <Card className="border-dashed"><CardHeader className="pb-2"><CardTitle className="text-sm">Representante Legal</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome</Label><Input value={perdcompForm.representanteNome} onChange={(e) => setPerdcompForm(f => ({ ...f, representanteNome: e.target.value }))} /></div>
                <div><Label className="text-xs">CPF</Label><Input value={perdcompForm.representanteCpf} onChange={(e) => setPerdcompForm(f => ({ ...f, representanteCpf: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Versão Sistema</Label><Input value={perdcompForm.versaoSistema} onChange={(e) => setPerdcompForm(f => ({ ...f, versaoSistema: e.target.value }))} /></div>
                <div><Label className="text-xs">Código SERPRO</Label><Input value={perdcompForm.codigoSerpro} onChange={(e) => setPerdcompForm(f => ({ ...f, codigoSerpro: e.target.value }))} /></div>
                <div><Label className="text-xs">Data Recebimento SERPRO</Label><Input type="date" value={perdcompForm.dataRecebimentoSerpro} onChange={(e) => setPerdcompForm(f => ({ ...f, dataRecebimentoSerpro: e.target.value }))} /></div>
              </div>
            </CardContent></Card>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Status</Label><Select value={perdcompForm.status} onValueChange={(v) => setPerdcompForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="transmitido">Transmitido</SelectItem><SelectItem value="homologado">Homologado</SelectItem><SelectItem value="nao_homologado">Não Homologado</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Despacho Decisório</Label><Input value={perdcompForm.despachoDecisorio} onChange={(e) => setPerdcompForm(f => ({ ...f, despachoDecisorio: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-3"><Checkbox checked={perdcompForm.feitoPelaEvox} onCheckedChange={(c) => setPerdcompForm(f => ({ ...f, feitoPelaEvox: !!c }))} /><Label className="text-xs">PerdComp feita pela Evox</Label></div>
            <div><Label className="text-xs">Observações</Label><Textarea value={perdcompForm.observacoes} onChange={(e) => setPerdcompForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={guardedClosePerdcomp}>Cancelar</Button>
            <Button onClick={handleSubmitPerdcomp} disabled={createPerdcomp.isPending} className="gap-2">{createPerdcomp.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Registrar PerdComp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <GuiaConfirmAlert />
      <PerdcompConfirmAlert />
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />{confirmDialog.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{confirmDialog.message}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>Cancelar</Button>
            <Button onClick={confirmDialog.onConfirm} className="bg-blue-600 hover:bg-blue-700">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Exception Request Dialog (Analyst) */}
      <Dialog open={exceptionRequestDialog} onOpenChange={setExceptionRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Lock className="w-5 h-5" />
              Tarefa Bloqueada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Esta empresa <strong>não é a primeira da fila</strong>. Pela regra FIFO, você só pode pegar a primeira tarefa disponível.
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                Deseja solicitar autorização ao gestor para pegar esta demanda?
              </p>
            </div>
            {exceptionRequestTask && (
              <div className="text-sm space-y-1">
                <p><strong>Tarefa:</strong> {exceptionRequestTask.codigo}</p>
                <p><strong>Cliente:</strong> {exceptionRequestTask.clienteNome || exceptionRequestTask.titulo}</p>
              </div>
            )}
            <div>
              <Label className="text-xs font-medium">Justificativa <span className="text-red-500">*</span></Label>
              <Textarea
                value={exceptionRequestJustificativa}
                onChange={(e) => setExceptionRequestJustificativa(e.target.value)}
                placeholder="Informe o motivo da solicitação (ex: prioridade, potencial financeiro, urgência do cliente...)"
                className="mt-1 min-h-[80px]"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Mínimo 10 caracteres. Justifique com critérios objetivos.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExceptionRequestDialog(false)}>Cancelar</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={exceptionRequestJustificativa.length < 10 || requestExceptionMut.isPending}
              onClick={async () => {
                try {
                  await requestExceptionMut.mutateAsync({
                    taskId: exceptionRequestTask.id,
                    justificativa: exceptionRequestJustificativa,
                  });
                  toast.success('Solicitação enviada ao gestor. Você será notificado quando for respondida.');
                  setExceptionRequestDialog(false);
                } catch (err: any) {
                  toast.error(err.message || 'Erro ao enviar solicitação');
                }
              }}
            >
              {requestExceptionMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Solicitar Autorização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== SOLICITAÇÕES SECTION (Admin) ===== */}
      {isAdmin && (exceptionRequests as any[])?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Solicitações de Exceção de Fila
              <Badge className="bg-red-500 text-white text-[10px]">{(exceptionRequests as any[]).length} pendente(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(exceptionRequests as any[]).map((req: any) => (
                <div key={req.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{req.solicitanteNome} solicita pegar a tarefa <strong>{req.taskCodigo}</strong></p>
                      <p className="text-xs text-muted-foreground">{req.clienteNome || ''} • Fila: {req.fila} • {formatDateTime(req.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-700 border-amber-300">Pendente</Badge>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Justificativa:</p>
                    <p className="text-sm">{req.justificativa}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50" disabled={respondExceptionMut.isPending} onClick={async () => { try { await respondExceptionMut.mutateAsync({ requestId: req.id, status: 'negado', resposta: 'Solicitação negada pelo gestor.' }); toast.success('Solicitação negada.'); refetchExceptions(); } catch (err: any) { toast.error(err.message || 'Erro'); } }}><XCircle className="w-3 h-3" /> Negar</Button>
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={respondExceptionMut.isPending} onClick={async () => { try { await respondExceptionMut.mutateAsync({ requestId: req.id, status: 'aprovado' }); toast.success('Solicitação aprovada!'); refetchExceptions(); } catch (err: any) { toast.error(err.message || 'Erro'); } }}>{respondExceptionMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Aprovar</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={queueExceptionDialog} onOpenChange={setQueueExceptionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Flag className="w-5 h-5 text-amber-500" />Exceção de Fila</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Tarefa: <strong>{exceptionTask?.codigo}</strong> — {exceptionTask?.titulo}</p>
            <div className="space-y-2">
              <Label>Justificativa Obrigatória <span className="text-red-500">*</span></Label>
              <Textarea placeholder="Informe o motivo da exceção..." value={exceptionJustificativa} onChange={(e) => setExceptionJustificativa(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setQueueExceptionDialog(false)}>Cancelar</Button>
            <Button disabled={!exceptionJustificativa.trim()} className="bg-amber-600 hover:bg-amber-700" onClick={() => { toast.success(`Exceção aplicada para ${exceptionTask?.codigo}.`); setQueueExceptionDialog(false); }}>Aplicar Exceção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {summaryTaskId && (
        <ClientSummaryPanel
          taskId={summaryTaskId}
          open={!!summaryTaskId}
          onClose={() => setSummaryTaskId(null)}
          filaLabel="Ressarcimento"
        />
      )}
    </div>
  );
}
