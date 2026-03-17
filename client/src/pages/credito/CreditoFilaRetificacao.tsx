import { useState, useMemo, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  ChevronRight, Loader2, Search, Clock, AlertTriangle, CheckCircle,
  User, PlusCircle, FileEdit, ArrowRight, Eye, BarChart3, ListChecks,
  DollarSign, ShieldAlert, ShieldCheck, Info, Play, Flag, Square, Lock, RotateCcw, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BackToDashboard from '@/components/BackToDashboard';
import ClientSummaryPanel from '@/components/ClientSummaryPanel';
import TarefasAtrasadasBanner from '@/components/TarefasAtrasadasBanner';

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

const OBRIGACOES_ACESSORIAS = [
  'EFD-Contribuições', 'EFD-ICMS/IPI', 'DCTF', 'DCTF-Web', 'ECF', 'ECD',
  'DIRF', 'GFIP/SEFIP', 'REINF', 'PERDCOMP', 'DACON', 'DIPJ',
];

const GRUPOS_TRIBUTO = [
  { sigla: 'INSS', nome: 'INSS/Previdenciários' },
  { sigla: 'PIS/COFINS', nome: 'PIS/COFINS' },
  { sigla: 'IRPJ/CSLL', nome: 'IRPJ/CSLL' },
  { sigla: 'IPI', nome: 'IPI' },
  { sigla: 'OUTROS', nome: 'Outros Tributos' },
];

export default function CreditoFilaRetificacao() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewRetifDialog, setShowNewRetifDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('checklist');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const resetPage = () => setCurrentPage(1);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // Queue exception (gestor)
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

  // Time counter
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const getTimeInStage = (task: any) => {
    // Tempo total que a empresa está na fila (desde a criação)
    if (!task.createdAt) return '—';
    const diff = Math.max(0, Date.now() - new Date(task.createdAt).getTime());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Form state for new retificação
  const [retifForm, setRetifForm] = useState({
    tipoRetificacao: 'total' as 'total' | 'parcial',
    periodoInicio: '',
    periodoFim: '',
    valorApuradoRti: 0,
    valorCreditoDisponivel: 0,
    teseNome: '',
    teseId: undefined as number | undefined,
    obrigacoesAcessorias: [] as string[],
    saldoPorGrupo: {} as Record<string, number>,
    observacoes: '',
    justificativaDivergencia: '',
  });

  const { data: tasks, isLoading, refetch } = trpc.creditRecovery.credito.tasks.list.useQuery({ fila: 'retificacao' } as any);
  const retificacaoByTask = trpc.creditRecovery.admin.retificacao.listByTask.useQuery(
    { taskId: selectedTask?.id || 0 },
    { enabled: !!selectedTask }
  );
  const checklistInstances = trpc.creditRecovery.admin.checklists.getInstance.useQuery(
    { taskId: selectedTask?.id || 0 },
    { enabled: !!selectedTask }
  );

  const createRetificacao = trpc.creditRecovery.admin.retificacao.create.useMutation({
    onSuccess: () => {
      toast.success('Retificação registrada com sucesso');
      retificacaoByTask.refetch();
      setShowNewRetifDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const createNextTask = trpc.creditRecovery.admin.createNextQueueTask.useMutation({
    onSuccess: () => {
      toast.success('Tarefa automática criada para a próxima fila');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleCheckItem = trpc.creditRecovery.admin.checklists.updateInstance.useMutation({
    onSuccess: () => checklistInstances.refetch(),
  });

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

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  useEffect(() => { resetPage(); }, [statusFilter, searchTerm]);

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

  const divergencia = retifForm.valorApuradoRti - retifForm.valorCreditoDisponivel;
  const divergenciaPct = retifForm.valorApuradoRti > 0 ? (Math.abs(divergencia) / retifForm.valorApuradoRti) * 100 : 0;
  const alertaDivergencia = divergenciaPct > 15;

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  const handleSubmitRetificacao = () => {
    if (!selectedTask) return;
    if (alertaDivergencia && !retifForm.justificativaDivergencia.trim()) {
      toast.error('Divergência acima de 15% requer justificativa');
      return;
    }
    createRetificacao.mutate({
      taskId: selectedTask.id,
      caseId: selectedTask.caseId || 0,
      clienteId: selectedTask.clienteId,
      teseId: retifForm.teseId,
      teseNome: retifForm.teseNome,
      tipoRetificacao: retifForm.tipoRetificacao,
      periodoInicio: retifForm.periodoInicio || undefined,
      periodoFim: retifForm.periodoFim || undefined,
      valorApuradoRti: retifForm.valorApuradoRti,
      valorCreditoDisponivel: retifForm.valorCreditoDisponivel,
      divergencia,
      divergenciaPct,
      alertaDivergencia,
      justificativaDivergencia: retifForm.justificativaDivergencia || undefined,
      saldoPorGrupo: retifForm.saldoPorGrupo,
      obrigacoesAcessorias: retifForm.obrigacoesAcessorias,
      observacoes: retifForm.observacoes || undefined,
    });
  };

  const handleConcluirRetificacao = (task: any) => {
    const records = (retificacaoByTask.data as any[]) || [];
    if (records.length === 0) {
      toast.error('É necessário registrar pelo menos uma retificação antes de concluir');
      return;
    }
    // Determine next queue based on strategy
    const fila = 'compensacao'; // Default - should come from onboarding strategy
    createNextTask.mutate({
      caseId: task.caseId || 0,
      clienteId: task.clienteId,
      fila,
      titulo: `[Auto] Compensação - ${task.titulo?.replace('[Retificação]', '').trim() || 'Cliente'}`,
    });
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
      <TarefasAtrasadasBanner fila="retificacao" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Retificação</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <FileEdit className="w-6 h-6 text-primary" />
            Fila de Retificação
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Checklist de retificação por tese, validação de créditos e constituição de saldo disponível por grupo de débitos.
          </p>
        </div>
        <Button onClick={() => navigate('/credito/nova-tarefa')} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Tarefa
        </Button>
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
              <p className="text-sm">Nenhuma tarefa de retificação encontrada.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/credito/nova-tarefa')}>
                <PlusCircle className="w-4 h-4" />
                Criar Nova Tarefa
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-2 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[40px] text-center">#</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px]">Código</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Título</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[90px]">Status</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[90px]">Prioridade</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px] text-center">Tempo</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Responsável</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px]">SLA</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[150px]">Criado Por</th>
                      <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-[140px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedTasks.map((task: any, idx: number) => {
                      const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                      const statusInfo = STATUS_LABELS[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-800' };
                      const prioridadeInfo = PRIORIDADE_LABELS[task.prioridade] || { label: task.prioridade, color: 'bg-gray-100 text-gray-800' };
                      const isOverdue = task.slaStatus === 'vencido';
                      const aFazerTasks = filteredTasks.filter((t: any) => t.status === 'a_fazer');
                      const isFirstAFazer = aFazerTasks.length > 0 && aFazerTasks[0].id === task.id;
                      const isQueueLocked = task.status === 'a_fazer' && !isFirstAFazer && !isAdmin;
                      return (
                        <tr key={task.id} className={cn('hover:bg-muted/30 transition-colors', isOverdue && 'bg-red-50/50 dark:bg-red-950/20', isQueueLocked && 'opacity-60')}>
                          <td className="px-2 py-3 text-center"><span className="font-mono text-xs font-bold text-muted-foreground">{globalIndex}</span></td>
                          <td className="px-3 py-3"><span className="font-mono text-xs text-muted-foreground">{task.codigo}</span></td>
                          <td className="px-3 py-3">
                            <button className="text-left group cursor-pointer flex items-center gap-1.5" title="Clique para ver resumo completo" onClick={() => setSummaryTaskId(task.id)}>
                              <div>
                                <p className="font-medium text-foreground text-sm truncate max-w-[220px] group-hover:text-primary group-hover:underline transition-colors">{task.clienteNome || task.titulo}</p>
                                {task.clienteCnpj && <p className="text-xs text-muted-foreground mt-0.5">{task.clienteCnpj}</p>}
                              </div>
                              <Eye className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                            </button>
                          </td>
                          <td className="px-3 py-3"><Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge></td>
                          <td className="px-3 py-3"><Badge className={cn('text-[10px]', prioridadeInfo.color)}>{prioridadeInfo.label}</Badge></td>
                          <td className="px-3 py-3 text-center">
                            <span className="text-xs font-mono text-muted-foreground">{getTimeInStage(task)}</span>
                          </td>
                          <td className="px-3 py-3">
                              <span className="text-xs text-muted-foreground truncate">{task.responsavelNome || '—'}</span>
                          </td>
                          <td className="px-3 py-3">
                            {isOverdue ? (
                              <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="w-3 h-3" />Atraso</Badge>
                            ) : (
                              <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-1"><CheckCircle className="w-3 h-3" />OK</Badge>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-xs">
                              <span className="font-medium text-foreground">{task.criadoPorNome || '—'}</span>
                              <div className="text-[10px] text-muted-foreground">
                                {task.createdAt ? new Date(task.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-center gap-1">
                              {task.status === 'a_fazer' && !isQueueLocked && (
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => { setSelectedTask(task); setShowDetailDialog(true); setActiveTab('checklist'); }}>
                                  <Eye className="w-3.5 h-3.5" />Detalhar
                                </Button>
                              )}
                              {task.status === 'a_fazer' && isQueueLocked && !isAdmin && (
                                <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => { setExceptionRequestTask(task); setExceptionRequestJustificativa(''); setExceptionRequestDialog(true); }}>
                                  <Lock className="w-3 h-3" />Pegar
                                </Button>
                              )}
                              {task.status === 'a_fazer' && isQueueLocked && isAdmin && (
                                <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 border-amber-300 text-amber-700" onClick={() => { setExceptionTask(task); setExceptionJustificativa(''); setQueueExceptionDialog(true); }}>
                                  <Flag className="w-3 h-3" />Exceção
                                </Button>
                              )}
                              {task.status !== 'a_fazer' && (
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => { setSelectedTask(task); setShowDetailDialog(true); setActiveTab('checklist'); }}>
                                  <Eye className="w-3.5 h-3.5" />Detalhar
                                </Button>
                              )}
                              {task.status !== 'concluido' && task.status !== 'a_fazer' && (
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-emerald-600" onClick={() => {
                                  setConfirmDialog({
                                    open: true,
                                    title: 'Confirmar Conclusão',
                                    message: `Deseja realmente concluir a tarefa ${task.codigo}? Esta ação é irreversível.`,
                                    onConfirm: () => { setSelectedTask(task); handleConcluirRetificacao(task); setConfirmDialog(prev => ({ ...prev, open: false })); },
                                  });
                                }}>
                                  <ArrowRight className="w-3.5 h-3.5" />Concluir
                                </Button>
                              )}
                              {(task.status === 'feito' || task.status === 'concluido') && isAdmin && (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => {
                                  setConfirmDialog({ open: true, title: 'Reabrir Tarefa', message: `Deseja reabrir a tarefa ${task.codigo}? Informe a justificativa ao gestor.`, onConfirm: () => { toast.info('Solicitação de reabertura registrada.'); setConfirmDialog(prev => ({ ...prev, open: false })); } });
                                }}>
                                  <RotateCcw className="w-3 h-3" />Reabrir
                                </Button>
                              )}
                              {task.reaberta && (
                                <Badge variant="outline" className="text-[9px] border-blue-300 text-blue-600 gap-0.5">
                                  <RotateCcw className="w-2.5 h-2.5" />Reaberta
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {filteredTasks.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Exibindo {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredTasks.length)} de {filteredTasks.length}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>Por página:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); resetPage(); }}>
                      <SelectTrigger className="h-7 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}>«</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>‹</Button>
                    <span className="text-xs font-medium px-2">Página {currentPage} de {totalPages}</span>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>»</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-primary" />
              Retificação — {selectedTask?.titulo}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="checklist" className="gap-1"><ListChecks className="w-3.5 h-3.5" />Checklist</TabsTrigger>
              <TabsTrigger value="retificacoes" className="gap-1"><FileEdit className="w-3.5 h-3.5" />Retificações</TabsTrigger>
              <TabsTrigger value="saldo" className="gap-1"><DollarSign className="w-3.5 h-3.5" />Saldo/Créditos</TabsTrigger>
              <TabsTrigger value="info" className="gap-1"><Info className="w-3.5 h-3.5" />Informações</TabsTrigger>
            </TabsList>

            {/* CHECKLIST TAB */}
            <TabsContent value="checklist" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Checklist de Retificação</CardTitle>
                  <p className="text-xs text-muted-foreground">Siga o passo a passo para cada tese a ser retificada</p>
                </CardHeader>
                <CardContent>
                  {checklistInstances.isLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                  ) : (checklistInstances.data as any[])?.length > 0 ? (
                    <div className="space-y-2">
                      {(checklistInstances.data as any[]).map((item: any) => (
                        <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/30">
                          <Checkbox
                            checked={!!item.concluido}
                            onCheckedChange={() => {
                              const newConcluido = !item.concluido;
                              const allItems = (checklistInstances.data as any[]);
                              const updatedItems = allItems.map((i: any) => i.id === item.id ? { ...i, concluido: newConcluido } : i);
                              const progresso = Math.round(updatedItems.filter((i: any) => i.concluido).length / updatedItems.length * 100);
                              toggleCheckItem.mutate({ id: item.id, itens: updatedItems, progresso });
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm', item.concluido && 'line-through text-muted-foreground')}>{item.descricao || item.titulo}</p>
                            {item.observacao && <p className="text-xs text-muted-foreground mt-0.5">{item.observacao}</p>}
                          </div>
                          {item.concluido && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum checklist configurado para esta tarefa.</p>
                      <p className="text-xs mt-1">O administrador pode configurar templates de checklist por tese.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  {(checklistInstances.data as any[])?.filter((i: any) => i.concluido).length || 0} de {(checklistInstances.data as any[])?.length || 0} itens concluídos
                </p>
              </div>
            </TabsContent>

            {/* RETIFICAÇÕES TAB */}
            <TabsContent value="retificacoes" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Registros de Retificação</h3>
                <Button size="sm" className="gap-1" onClick={() => {
                  setRetifForm({ tipoRetificacao: 'total', periodoInicio: '', periodoFim: '', valorApuradoRti: 0, valorCreditoDisponivel: 0, teseNome: '', teseId: undefined, obrigacoesAcessorias: [], saldoPorGrupo: {}, observacoes: '', justificativaDivergencia: '' });
                  setShowNewRetifDialog(true);
                }}>
                  <PlusCircle className="w-3.5 h-3.5" />
                  Nova Retificação
                </Button>
              </div>

              {retificacaoByTask.isLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : (retificacaoByTask.data as any[])?.length > 0 ? (
                <div className="space-y-3">
                  {(retificacaoByTask.data as any[]).map((rec: any) => (
                    <Card key={rec.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm">{rec.teseNome || 'Tese não especificada'}</p>
                            <p className="text-xs text-muted-foreground">
                              Retificação {rec.tipoRetificacao} — Período: {formatDate(rec.periodoInicio)} a {formatDate(rec.periodoFim)}
                            </p>
                          </div>
                          <Badge className={rec.alertaDivergencia ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}>
                            {rec.alertaDivergencia ? 'Divergência' : 'OK'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Valor RTI</p>
                            <p className="font-medium">{formatCurrency(Number(rec.valorApuradoRti || 0))}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Crédito Disponível</p>
                            <p className="font-medium">{formatCurrency(Number(rec.valorCreditoDisponivel || 0))}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Divergência</p>
                            <p className={cn('font-medium', Number(rec.divergenciaPct) > 15 ? 'text-red-600' : 'text-foreground')}>
                              {formatCurrency(Number(rec.divergencia || 0))} ({Number(rec.divergenciaPct || 0).toFixed(1)}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Registrado por</p>
                            <p className="font-medium">{rec.registradoPorNome || '—'}</p>
                          </div>
                        </div>
                        {rec.saldoPorGrupo && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium mb-2">Saldo por Grupo de Débitos</p>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(typeof rec.saldoPorGrupo === 'string' ? JSON.parse(rec.saldoPorGrupo) : rec.saldoPorGrupo).map(([grupo, valor]) => (
                                <div key={grupo} className="bg-muted/50 rounded p-2 text-xs">
                                  <p className="text-muted-foreground">{grupo}</p>
                                  <p className="font-medium">{formatCurrency(Number(valor))}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {rec.obrigacoesAcessorias && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(typeof rec.obrigacoesAcessorias === 'string' ? JSON.parse(rec.obrigacoesAcessorias) : rec.obrigacoesAcessorias).map((ob: string) => (
                              <Badge key={ob} variant="outline" className="text-[10px]">{ob}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileEdit className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma retificação registrada ainda.</p>
                </div>
              )}
            </TabsContent>

            {/* SALDO TAB */}
            <TabsContent value="saldo" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Constituição de Saldo Disponível
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Saldo global e por grupo de débitos/tributos</p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const records = (retificacaoByTask.data as any[]) || [];
                    const totalRti = records.reduce((s, r) => s + Number(r.valorApuradoRti || 0), 0);
                    const totalDisponivel = records.reduce((s, r) => s + Number(r.valorCreditoDisponivel || 0), 0);
                    const totalDivergencia = totalRti - totalDisponivel;
                    
                    // Aggregate saldo por grupo
                    const grupoCombined: Record<string, number> = {};
                    records.forEach(r => {
                      const spg = typeof r.saldoPorGrupo === 'string' ? JSON.parse(r.saldoPorGrupo || '{}') : (r.saldoPorGrupo || {});
                      Object.entries(spg).forEach(([g, v]) => {
                        grupoCombined[g] = (grupoCombined[g] || 0) + Number(v);
                      });
                    });

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-blue-600 font-medium">Valor Apurado (RTI)</p>
                            <p className="text-xl font-bold text-blue-800">{formatCurrency(totalRti)}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-emerald-600 font-medium">Crédito Disponível</p>
                            <p className="text-xl font-bold text-emerald-800">{formatCurrency(totalDisponivel)}</p>
                          </div>
                          <div className={cn('rounded-lg p-4 text-center', Math.abs(totalDivergencia) > totalRti * 0.15 ? 'bg-red-50' : 'bg-amber-50')}>
                            <p className={cn('text-xs font-medium', Math.abs(totalDivergencia) > totalRti * 0.15 ? 'text-red-600' : 'text-amber-600')}>Divergência</p>
                            <p className={cn('text-xl font-bold', Math.abs(totalDivergencia) > totalRti * 0.15 ? 'text-red-800' : 'text-amber-800')}>{formatCurrency(totalDivergencia)}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-3">Saldo por Grupo de Débitos</p>
                          <div className="space-y-2">
                            {GRUPOS_TRIBUTO.map(g => (
                              <div key={g.sigla} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium">{g.sigla}</p>
                                  <p className="text-xs text-muted-foreground">{g.nome}</p>
                                </div>
                                <p className="text-sm font-bold">{formatCurrency(grupoCombined[g.sigla] || 0)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* INFO TAB */}
            <TabsContent value="info" className="space-y-4">
              {selectedTask && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-muted-foreground text-xs">Código</p><p className="font-medium">{selectedTask.codigo}</p></div>
                      <div><p className="text-muted-foreground text-xs">Status</p><Badge className={STATUS_LABELS[selectedTask.status]?.color || ''}>{STATUS_LABELS[selectedTask.status]?.label || selectedTask.status}</Badge></div>
                      <div><p className="text-muted-foreground text-xs">Responsável</p><p className="font-medium">{selectedTask.responsavelNome || '—'}</p></div>
                      <div><p className="text-muted-foreground text-xs">Criado por</p><p className="font-medium">{selectedTask.criadoPorNome || '—'}</p></div>
                      <div><p className="text-muted-foreground text-xs">Criado em</p><p className="font-medium">{formatDateTime(selectedTask.createdAt)}</p></div>
                      <div><p className="text-muted-foreground text-xs">Vencimento</p><p className="font-medium">{formatDate(selectedTask.dataVencimento)}</p></div>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Após concluir a retificação, o sistema criará automaticamente uma tarefa na próxima fila de acordo com a estratégia de monetização definida no onboarding.
                        A estratégia é visível a todos que acessarem o cliente na aba crédito.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* New Retificação Dialog */}
      <Dialog open={showNewRetifDialog} onOpenChange={setShowNewRetifDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Retificação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo e Período */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Tipo de Retificação</Label>
                <Select value={retifForm.tipoRetificacao} onValueChange={(v) => setRetifForm(f => ({ ...f, tipoRetificacao: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Total</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Período Início</Label>
                <Input type="date" value={retifForm.periodoInicio} onChange={(e) => setRetifForm(f => ({ ...f, periodoInicio: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Período Fim</Label>
                <Input type="date" value={retifForm.periodoFim} onChange={(e) => setRetifForm(f => ({ ...f, periodoFim: e.target.value }))} />
              </div>
            </div>

            {/* Tese */}
            <div>
              <Label className="text-xs">Tese</Label>
              <Input placeholder="Nome da tese retificada" value={retifForm.teseNome} onChange={(e) => setRetifForm(f => ({ ...f, teseNome: e.target.value }))} />
            </div>

            {/* Valores - Comparativo RTI vs Real */}
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Comparativo: Valor Apurado (RTI) vs Crédito Disponível</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Valor Apurado no RTI (R$)</Label>
                    <Input type="number" step="0.01" value={retifForm.valorApuradoRti || ''} onChange={(e) => setRetifForm(f => ({ ...f, valorApuradoRti: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Crédito Efetivamente Disponível (R$)</Label>
                    <Input type="number" step="0.01" value={retifForm.valorCreditoDisponivel || ''} onChange={(e) => setRetifForm(f => ({ ...f, valorCreditoDisponivel: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>

                {/* Divergência */}
                <div className={cn('p-3 rounded-lg', alertaDivergencia ? 'bg-red-50 border border-red-200' : 'bg-muted/30')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {alertaDivergencia && <ShieldAlert className="w-4 h-4 text-red-600" />}
                      <span className="text-sm font-medium">Divergência:</span>
                    </div>
                    <span className={cn('text-sm font-bold', alertaDivergencia ? 'text-red-600' : 'text-foreground')}>
                      {formatCurrency(divergencia)} ({divergenciaPct.toFixed(1)}%)
                    </span>
                  </div>
                  {alertaDivergencia && (
                    <p className="text-xs text-red-600 mt-1">
                      Divergência acima de 15% detectada. Justificativa obrigatória.
                    </p>
                  )}
                </div>

                {alertaDivergencia && (
                  <div>
                    <Label className="text-xs text-red-600">Justificativa da Divergência *</Label>
                    <Textarea
                      placeholder="Explique a razão da divergência entre o valor apurado e o crédito disponível..."
                      value={retifForm.justificativaDivergencia}
                      onChange={(e) => setRetifForm(f => ({ ...f, justificativaDivergencia: e.target.value }))}
                      className="border-red-200"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saldo por Grupo */}
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Saldo Disponível por Grupo de Débitos</CardTitle>
                <p className="text-xs text-muted-foreground">Informe quanto do crédito está disponível para compensar cada grupo</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {GRUPOS_TRIBUTO.map(g => (
                    <div key={g.sigla}>
                      <Label className="text-xs">{g.sigla} — {g.nome}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={retifForm.saldoPorGrupo[g.sigla] || ''}
                        onChange={(e) => setRetifForm(f => ({
                          ...f,
                          saldoPorGrupo: { ...f.saldoPorGrupo, [g.sigla]: parseFloat(e.target.value) || 0 },
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Obrigações Acessórias */}
            <div>
              <Label className="text-xs mb-2 block">Obrigações Acessórias Retificadas</Label>
              <div className="grid grid-cols-3 gap-2">
                {OBRIGACOES_ACESSORIAS.map(ob => (
                  <div key={ob} className="flex items-center gap-2">
                    <Checkbox
                      checked={retifForm.obrigacoesAcessorias.includes(ob)}
                      onCheckedChange={(checked) => {
                        setRetifForm(f => ({
                          ...f,
                          obrigacoesAcessorias: checked
                            ? [...f.obrigacoesAcessorias, ob]
                            : f.obrigacoesAcessorias.filter(o => o !== ob),
                        }));
                      }}
                    />
                    <span className="text-xs">{ob}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea placeholder="Observações adicionais..." value={retifForm.observacoes} onChange={(e) => setRetifForm(f => ({ ...f, observacoes: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRetifDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitRetificacao} disabled={createRetificacao.isPending} className="gap-2">
              {createRetificacao.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar Retificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {confirmDialog.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">{confirmDialog.message}</p>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                      disabled={respondExceptionMut.isPending}
                      onClick={async () => {
                        try {
                          await respondExceptionMut.mutateAsync({ requestId: req.id, status: 'negado', resposta: 'Solicitação negada pelo gestor.' });
                          toast.success('Solicitação negada. Analista será notificado.');
                          refetchExceptions();
                        } catch (err: any) { toast.error(err.message || 'Erro'); }
                      }}
                    >
                      <XCircle className="w-3 h-3" /> Negar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={respondExceptionMut.isPending}
                      onClick={async () => {
                        try {
                          await respondExceptionMut.mutateAsync({ requestId: req.id, status: 'aprovado' });
                          toast.success('Solicitação aprovada! Tarefa atribuída ao analista.');
                          refetchExceptions();
                          refetch();
                        } catch (err: any) { toast.error(err.message || 'Erro'); }
                      }}
                    >
                      {respondExceptionMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Aprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Exception Dialog */}
      <Dialog open={queueExceptionDialog} onOpenChange={setQueueExceptionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-amber-500" />
              Exceção de Fila
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Tarefa: <strong>{exceptionTask?.codigo}</strong> — {exceptionTask?.titulo}</p>
            <div className="space-y-2">
              <Label>Justificativa Obrigatória <span className="text-red-500">*</span></Label>
              <Textarea placeholder="Informe o motivo da exceção..." value={exceptionJustificativa} onChange={(e) => setExceptionJustificativa(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setQueueExceptionDialog(false)}>Cancelar</Button>
            <Button disabled={!exceptionJustificativa.trim()} className="bg-amber-600 hover:bg-amber-700" onClick={() => {
              toast.success(`Exceção aplicada para ${exceptionTask?.codigo}. Justificativa registrada.`);
              setQueueExceptionDialog(false);
            }}>Aplicar Exceção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {summaryTaskId && (
        <ClientSummaryPanel
          taskId={summaryTaskId}
          open={!!summaryTaskId}
          onClose={() => setSummaryTaskId(null)}
          filaLabel="Retificação"
        />
      )}
    </div>
  );
}
