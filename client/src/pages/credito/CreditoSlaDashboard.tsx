import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import {
  Loader2, Clock, AlertTriangle, CheckCircle, XCircle,
  Search, BarChart3, Users, ArrowLeft, Timer, TrendingDown,
  ShieldAlert, Eye, ChevronRight, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BackToDashboard from '@/components/BackToDashboard';

const FILA_LABELS: Record<string, string> = {
  apuracao: 'Apuração',
  retificacao: 'Retificação',
  compensacao: 'Compensação',
  ressarcimento: 'Ressarcimento',
  restituicao: 'Restituição',
};

const FILA_COLORS: Record<string, string> = {
  apuracao: 'bg-blue-500',
  retificacao: 'bg-purple-500',
  compensacao: 'bg-amber-500',
  ressarcimento: 'bg-teal-500',
  restituicao: 'bg-indigo-500',
};

const PRIORIDADE_LABELS: Record<string, { label: string; color: string }> = {
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  media: { label: 'Média', color: 'bg-amber-100 text-amber-800' },
  baixa: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
};

export default function CreditoSlaDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [filaFilter, setFilaFilter] = useState('all');
  const [analistaFilter, setAnalistaFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [slaStatusFilter, setSlaStatusFilter] = useState('all');

  const { data, isLoading } = trpc.creditRecovery.admin.slaDashboard.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const summary = (data?.summary || { total: 0, vencido: 0, atencao: 0, dentroPrazo: 0 }) as any;
  const byFila = (data?.byFila || []) as any[];
  const byAnalista = (data?.byAnalista || []) as any[];
  const allTasks = (data?.tasks || []) as any[];

  // Unique analysts for filter
  const analysts = useMemo(() => {
    const names = new Set<string>();
    allTasks.forEach(t => { if (t.responsavelNome) names.add(t.responsavelNome); });
    return Array.from(names).sort();
  }, [allTasks]);

  // Filtered tasks for the table
  const filteredTasks = useMemo(() => {
    let result = allTasks;
    if (filaFilter !== 'all') result = result.filter(t => t.fila === filaFilter);
    if (analistaFilter !== 'all') result = result.filter(t => t.responsavelNome === analistaFilter);
    if (slaStatusFilter !== 'all') result = result.filter(t => t.slaStatus === slaStatusFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.codigo?.toLowerCase().includes(term) ||
        t.titulo?.toLowerCase().includes(term) ||
        t.clienteNome?.toLowerCase().includes(term) ||
        t.responsavelNome?.toLowerCase().includes(term)
      );
    }
    // Sort: vencido first, then atencao, then dentro_prazo. Within each, sort by diasRestantes ASC
    result.sort((a, b) => {
      const order: Record<string, number> = { vencido: 0, atencao: 1, dentro_prazo: 2 };
      const diff = (order[a.slaStatus] ?? 2) - (order[b.slaStatus] ?? 2);
      if (diff !== 0) return diff;
      return (a.diasRestantes || 0) - (b.diasRestantes || 0);
    });
    return result;
  }, [allTasks, filaFilter, analistaFilter, slaStatusFilter, searchTerm]);

  // Critical tasks (vencido or <= 1 day)
  const criticalTasks = allTasks.filter(t => t.slaStatus === 'vencido' || (t.slaStatus === 'atencao' && t.diasRestantes <= 1));

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackToDashboard />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Dashboard SLA</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            Dashboard de SLA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento em tempo real dos prazos de todas as filas de crédito tributário.
          </p>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalTasks.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 dark:bg-red-900 rounded-full p-2 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                {criticalTasks.length} tarefa(s) em situação crítica
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Tarefas vencidas ou com menos de 24h para o vencimento do SLA. Ação imediata necessária.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => { setSlaStatusFilter('vencido'); setActiveTab('tarefas'); }}
            >
              Ver Críticas
            </Button>
          </div>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Ativas</p>
                <p className="text-3xl font-bold text-foreground mt-1">{summary.total}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn("border-l-4", summary.vencido > 0 ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20" : "border-l-red-300")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Vencidas</p>
                <p className={cn("text-3xl font-bold mt-1", summary.vencido > 0 ? "text-red-600" : "text-foreground")}>{summary.vencido}</p>
              </div>
              <XCircle className={cn("w-8 h-8", summary.vencido > 0 ? "text-red-400" : "text-muted-foreground/30")} />
            </div>
            {summary.total > 0 && (
              <Progress value={(summary.vencido / summary.total) * 100} className="mt-2 h-1.5 [&>div]:bg-red-500" />
            )}
          </CardContent>
        </Card>
        <Card className={cn("border-l-4", summary.atencao > 0 ? "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20" : "border-l-amber-300")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Atenção (≤3d)</p>
                <p className={cn("text-3xl font-bold mt-1", summary.atencao > 0 ? "text-amber-600" : "text-foreground")}>{summary.atencao}</p>
              </div>
              <AlertTriangle className={cn("w-8 h-8", summary.atencao > 0 ? "text-amber-400" : "text-muted-foreground/30")} />
            </div>
            {summary.total > 0 && (
              <Progress value={(summary.atencao / summary.total) * 100} className="mt-2 h-1.5 [&>div]:bg-amber-500" />
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Dentro do Prazo</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{summary.dentroPrazo}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            {summary.total > 0 && (
              <Progress value={(summary.dentroPrazo / summary.total) * 100} className="mt-2 h-1.5 [&>div]:bg-emerald-500" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="visao-geral" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="por-analista" className="gap-2">
            <Users className="w-4 h-4" />
            Por Analista
          </TabsTrigger>
          <TabsTrigger value="tarefas" className="gap-2 relative">
            <Timer className="w-4 h-4" />
            Tarefas
            {summary.vencido > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{summary.vencido}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== VISÃO GERAL TAB ===== */}
        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {byFila.map((fila: any) => (
              <Card key={fila.fila} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", FILA_COLORS[fila.fila] || 'bg-gray-400')} />
                    {FILA_LABELS[fila.fila] || fila.fila}
                    <Badge variant="outline" className="ml-auto text-[10px]">{fila.total} tarefas</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fila.total === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma tarefa ativa</p>
                  ) : (
                    <>
                      {/* SLA Status Bars */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-[10px] text-muted-foreground">Vencidas</div>
                          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", fila.vencido > 0 ? "bg-red-500" : "bg-transparent")}
                              style={{ width: `${(fila.vencido / fila.total) * 100}%` }}
                            />
                          </div>
                          <span className={cn("text-xs font-bold w-8 text-right", fila.vencido > 0 ? "text-red-600" : "text-muted-foreground")}>{fila.vencido}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-[10px] text-muted-foreground">Atenção</div>
                          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", fila.atencao > 0 ? "bg-amber-500" : "bg-transparent")}
                              style={{ width: `${(fila.atencao / fila.total) * 100}%` }}
                            />
                          </div>
                          <span className={cn("text-xs font-bold w-8 text-right", fila.atencao > 0 ? "text-amber-600" : "text-muted-foreground")}>{fila.atencao}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-[10px] text-muted-foreground">No prazo</div>
                          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${(fila.dentroPrazo / fila.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold w-8 text-right text-emerald-600">{fila.dentroPrazo}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs text-muted-foreground"
                        onClick={() => { setFilaFilter(fila.fila); setActiveTab('tarefas'); }}
                      >
                        Ver tarefas desta fila
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overall health gauge */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Saúde Geral do SLA</CardTitle>
              <CardDescription className="text-xs">Percentual de tarefas dentro do prazo em todas as filas</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.total > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex h-6 rounded-full overflow-hidden bg-muted">
                        {summary.vencido > 0 && (
                          <div className="bg-red-500 transition-all" style={{ width: `${(summary.vencido / summary.total) * 100}%` }} />
                        )}
                        {summary.atencao > 0 && (
                          <div className="bg-amber-500 transition-all" style={{ width: `${(summary.atencao / summary.total) * 100}%` }} />
                        )}
                        {summary.dentroPrazo > 0 && (
                          <div className="bg-emerald-500 transition-all" style={{ width: `${(summary.dentroPrazo / summary.total) * 100}%` }} />
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-lg font-bold",
                      summary.dentroPrazo / summary.total >= 0.8 ? "text-emerald-600" :
                      summary.dentroPrazo / summary.total >= 0.5 ? "text-amber-600" : "text-red-600"
                    )}>
                      {Math.round((summary.dentroPrazo / summary.total) * 100)}%
                    </span>
                  </div>
                  <div className="flex gap-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Vencidas ({summary.vencido})</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Atenção ({summary.atencao})</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> No Prazo ({summary.dentroPrazo})</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa ativa no momento</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== POR ANALISTA TAB ===== */}
        <TabsContent value="por-analista" className="space-y-4">
          {byAnalista.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Nenhum analista com tarefas ativas.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {byAnalista.map((analista: any) => (
                <Card key={analista.nome} className={cn(
                  "hover:shadow-md transition-shadow",
                  analista.vencido > 0 && "border-red-200 dark:border-red-800"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                          analista.vencido > 0 ? "bg-red-100 text-red-700" :
                          analista.atencao > 0 ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {analista.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{analista.nome}</p>
                          <Badge variant="outline" className="text-[10px]">{analista.total} tarefas</Badge>
                        </div>
                        <div className="flex gap-3 mt-1.5">
                          {analista.vencido > 0 && (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                              <XCircle className="w-3 h-3" /> {analista.vencido} vencida(s)
                            </span>
                          )}
                          {analista.atencao > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <AlertTriangle className="w-3 h-3" /> {analista.atencao} em atenção
                            </span>
                          )}
                          {analista.dentroPrazo > 0 && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle className="w-3 h-3" /> {analista.dentroPrazo} no prazo
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {analista.total > 0 && (
                          <div className="flex h-3 w-24 rounded-full overflow-hidden bg-muted">
                            {analista.vencido > 0 && <div className="bg-red-500" style={{ width: `${(analista.vencido / analista.total) * 100}%` }} />}
                            {analista.atencao > 0 && <div className="bg-amber-500" style={{ width: `${(analista.atencao / analista.total) * 100}%` }} />}
                            {analista.dentroPrazo > 0 && <div className="bg-emerald-500" style={{ width: `${(analista.dentroPrazo / analista.total) * 100}%` }} />}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => { setAnalistaFilter(analista.nome); setActiveTab('tarefas'); }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAREFAS TAB ===== */}
        <TabsContent value="tarefas" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, título, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filaFilter} onValueChange={setFilaFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Fila" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Filas</SelectItem>
                {Object.entries(FILA_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={analistaFilter} onValueChange={setAnalistaFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Analista" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Analistas</SelectItem>
                {analysts.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={slaStatusFilter} onValueChange={setSlaStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status SLA" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vencido">Vencidas</SelectItem>
                <SelectItem value="atencao">Atenção</SelectItem>
                <SelectItem value="dentro_prazo">No Prazo</SelectItem>
              </SelectContent>
            </Select>
            {(filaFilter !== 'all' || analistaFilter !== 'all' || slaStatusFilter !== 'all' || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => { setFilaFilter('all'); setAnalistaFilter('all'); setSlaStatusFilter('all'); setSearchTerm(''); }}
              >
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Tasks Table */}
          <Card>
            <CardContent className="p-0">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">Nenhuma tarefa encontrada com os filtros selecionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px]">Código</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">Fila</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Título / Cliente</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Responsável</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px]">Prioridade</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">Vence Em</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px] text-center">Tempo Restante</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px] text-center">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTasks.map((task: any) => {
                        const slaColor = task.slaStatus === 'vencido' ? 'bg-red-50 dark:bg-red-950/20' :
                          task.slaStatus === 'atencao' ? 'bg-amber-50/50 dark:bg-amber-950/10' : '';
                        const prioInfo = PRIORIDADE_LABELS[task.prioridade] || { label: task.prioridade, color: 'bg-gray-100 text-gray-800' };
                        return (
                          <tr key={task.id} className={cn('hover:bg-muted/30 transition-colors', slaColor)}>
                            <td className="px-3 py-3">
                              <span className="text-xs font-mono font-medium text-primary">{task.codigo}</span>
                            </td>
                            <td className="px-3 py-3">
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <div className={cn("w-2 h-2 rounded-full", FILA_COLORS[task.fila] || 'bg-gray-400')} />
                                {FILA_LABELS[task.fila] || task.fila}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-xs font-medium truncate max-w-[250px]">{task.titulo}</p>
                              {task.clienteNome && <p className="text-[10px] text-muted-foreground truncate">{task.clienteNome}</p>}
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-muted-foreground">{task.responsavelApelido || task.responsavelNome || '—'}</span>
                            </td>
                            <td className="px-3 py-3">
                              <Badge className={cn('text-[10px]', prioInfo.color)}>{prioInfo.label}</Badge>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs text-muted-foreground">{formatDate(task.dataFimPrevista)}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {task.slaStatus === 'vencido' ? (
                                <span className="text-xs font-bold text-red-600">
                                  {Math.abs(Math.round(task.diasRestantes))}d atrás
                                </span>
                              ) : task.diasRestantes <= 1 ? (
                                <span className="text-xs font-bold text-amber-600 animate-pulse">
                                  {Math.max(0, task.horasRestantes)}h
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-muted-foreground">
                                  {Math.round(task.diasRestantes)}d
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {task.slaStatus === 'vencido' && (
                                <Badge variant="destructive" className="text-[10px] gap-1 animate-pulse">
                                  <XCircle className="w-3 h-3" />Vencido
                                </Badge>
                              )}
                              {task.slaStatus === 'atencao' && (
                                <Badge className="text-[10px] gap-1 bg-amber-100 text-amber-800">
                                  <AlertTriangle className="w-3 h-3" />Atenção
                                </Badge>
                              )}
                              {task.slaStatus === 'dentro_prazo' && (
                                <Badge className="text-[10px] gap-1 bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="w-3 h-3" />OK
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-[10px] text-muted-foreground text-center">
            Exibindo {filteredTasks.length} de {allTasks.length} tarefas ativas. Atualização automática a cada 60 segundos.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
