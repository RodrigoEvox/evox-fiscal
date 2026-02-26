import { useState, useMemo } from 'react';
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
  User, PlusCircle, Receipt, Eye, FileText, ShieldCheck, CalendarClock, Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function CreditoFilaRestituicao() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
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
    feitoPelaEvox: true, modalidade: 'restituicao' as const,
    debitosCompensadosJson: [] as Array<{ tributo: string; valor: number }>,
  });

  const { data: tasks, isLoading } = trpc.creditRecovery.credito.tasks.list.useQuery({ fila: 'restituicao' } as any);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span><ChevronRight className="w-3.5 h-3.5" /><span className="text-foreground font-medium">Restituição</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3"><Undo2 className="w-6 h-6 text-primary" />Fila de Restituição</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de pedidos de restituição, PerdComps e comprovantes.</p>
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
              <p className="text-sm">Nenhuma tarefa de restituição encontrada.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/credito/nova-tarefa-credito')}><PlusCircle className="w-4 h-4" />Criar Nova Tarefa</Button>
            </div>
          ) : (
            <div className="divide-y">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Código</div><div className="col-span-3">Título</div><div className="col-span-1">Status</div><div className="col-span-1">Prioridade</div><div className="col-span-2">Responsável</div><div className="col-span-1">SLA</div><div className="col-span-1">Criado em</div><div className="col-span-2 text-right">Ações</div>
              </div>
              {filteredTasks.map((task: any) => {
                const statusInfo = STATUS_LABELS[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-800' };
                const prioridadeInfo = PRIORIDADE_LABELS[task.prioridade] || { label: task.prioridade, color: 'bg-gray-100 text-gray-800' };
                const isOverdue = task.slaStatus === 'vencido';
                return (
                  <div key={task.id} className={cn('grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-sm', isOverdue && 'bg-red-50/50')}>
                    <div className="col-span-1"><span className="font-mono text-xs text-muted-foreground">{task.codigo}</span></div>
                    <div className="col-span-3 min-w-0"><p className="font-medium text-foreground truncate">{task.titulo}</p></div>
                    <div className="col-span-1"><Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge></div>
                    <div className="col-span-1"><Badge className={cn('text-[10px]', prioridadeInfo.color)}>{prioridadeInfo.label}</Badge></div>
                    <div className="col-span-2 flex items-center gap-1.5 min-w-0"><User className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground truncate">{task.responsavelNome || '—'}</span></div>
                    <div className="col-span-1">{isOverdue ? <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="w-3 h-3" />Atraso</Badge> : <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-1"><CheckCircle className="w-3 h-3" />OK</Badge>}</div>
                    <div className="col-span-1"><span className="text-xs text-muted-foreground">{formatDateTime(task.createdAt)}</span></div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => { setSelectedTask(task); setShowDetailDialog(true); setActiveTab('guias'); }}><Eye className="w-3.5 h-3.5" />Detalhar</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />Restituição — {selectedTask?.titulo}</DialogTitle></DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="guias" className="gap-1"><FileText className="w-3.5 h-3.5" />Guias</TabsTrigger>
              <TabsTrigger value="perdcomps" className="gap-1"><Receipt className="w-3.5 h-3.5" />PerdComps</TabsTrigger>
              <TabsTrigger value="info" className="gap-1"><ShieldCheck className="w-3.5 h-3.5" />Informações</TabsTrigger>
            </TabsList>

            <TabsContent value="guias" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Guias para Restituição</h3>
                <Button size="sm" className="gap-1" onClick={() => { setGuiaForm({ cnpjGuia: '', codigoReceita: '', grupoTributo: '', periodoApuracao: '', dataVencimento: '', valorOriginal: 0, valorMulta: 0, valorJuros: 0, valorTotal: 0, valorCompensado: 0, statusGuia: 'a_vencer', observacoes: '' }); setShowGuiaDialog(true); }}><PlusCircle className="w-3.5 h-3.5" />Adicionar Guia</Button>
              </div>
              {guiasByTask.isLoading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div> : (guiasByTask.data as any[])?.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-8 gap-2 px-3 py-1.5 bg-muted/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wider rounded">
                    <div>Cód. Receita</div><div>Grupo</div><div>Período</div><div>Vencimento</div><div className="text-right">Original</div><div className="text-right">Total</div><div className="text-right">Restituído</div><div>Status</div>
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
                  <div className="flex justify-end pt-2 border-t text-sm"><span className="text-muted-foreground mr-2">Total Restituído:</span><span className="font-bold text-emerald-600">{formatCurrency((guiasByTask.data as any[]).reduce((s, g) => s + Number(g.valorCompensado || 0), 0))}</span></div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Nenhuma guia registrada.</p><p className="text-xs mt-1">Adicione as guias para pedido de restituição.</p></div>
              )}
            </TabsContent>

            <TabsContent value="perdcomps" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">PerdComps de Restituição</h3>
                <Button size="sm" className="gap-1" onClick={() => { setPerdcompForm({ numeroPerdcomp: '', tipoDocumento: 'Original', numeroControle: '', cnpjDeclarante: '', nomeEmpresarial: '', tipoCredito: '', oriundoAcaoJudicial: false, creditoSucedida: false, numeroDocArrecadacao: '', codigoReceita: '', grupoTributo: '', dataArrecadacao: '', periodoApuracao: '', valorCredito: 0, valorDebitosCompensados: 0, saldoRemanescente: 0, dataTransmissao: '', representanteNome: '', representanteCpf: '', versaoSistema: '', codigoSerpro: '', dataRecebimentoSerpro: '', status: 'transmitido', despachoDecisorio: '', observacoes: '', feitoPelaEvox: true, modalidade: 'restituicao', debitosCompensadosJson: [] }); setShowPerdcompDialog(true); }}><PlusCircle className="w-3.5 h-3.5" />Registrar PerdComp</Button>
              </div>
              <div className="text-center py-6 text-muted-foreground"><Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">As PerdComps de restituição aparecerão aqui.</p><p className="text-xs mt-1">Use a busca rápida no topo para localizar PerdComps por número, CNPJ ou nome.</p></div>
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
                  <div className="pt-3 border-t"><p className="text-xs text-muted-foreground">A restituição segue o mesmo fluxo da compensação. Insira as guias, registre os dados do recibo da PerdComp e anexe comprovantes. O pedido de restituição será acompanhado até a devolução dos valores.</p></div>
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* New Guia Dialog */}
      <Dialog open={showGuiaDialog} onOpenChange={setShowGuiaDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Adicionar Guia — Restituição</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
            <div><Label className="text-xs">Valor Restituído (R$)</Label><Input type="number" step="0.01" value={guiaForm.valorCompensado || ''} onChange={(e) => setGuiaForm(f => ({ ...f, valorCompensado: parseFloat(e.target.value) || 0 }))} /></div>
            <div><Label className="text-xs">Observações</Label><Textarea value={guiaForm.observacoes} onChange={(e) => setGuiaForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuiaDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitGuia} disabled={createGuia.isPending} className="gap-2">{createGuia.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Registrar Guia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New PerdComp Dialog */}
      <Dialog open={showPerdcompDialog} onOpenChange={setShowPerdcompDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />Registrar PerdComp — Restituição</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setShowPerdcompDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitPerdcomp} disabled={createPerdcomp.isPending} className="gap-2">{createPerdcomp.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Registrar PerdComp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
