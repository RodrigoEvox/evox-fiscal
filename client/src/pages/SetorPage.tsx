import { useParams, useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, CheckSquare, Clock, AlertTriangle, BarChart3, ListOrdered,
  ArrowRight, Loader2, ChevronRight, ClipboardList, Users, TrendingUp,
  Home, ArrowLeft, Filter, X, RefreshCw,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_LABELS: Record<string, string> = {
  a_fazer: 'A Fazer',
  fazendo: 'Fazendo',
  feito: 'Feito',
  concluido: 'Concluído',
  backlog: 'Backlog',
  em_andamento: 'Em Andamento',
  revisao: 'Revisão',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  a_fazer: 'bg-gray-100 text-gray-700',
  fazendo: 'bg-blue-100 text-blue-700',
  feito: 'bg-amber-100 text-amber-700',
  concluido: 'bg-green-100 text-green-700',
  backlog: 'bg-gray-100 text-gray-600',
  em_andamento: 'bg-blue-100 text-blue-700',
  revisao: 'bg-purple-100 text-purple-700',
  cancelado: 'bg-red-100 text-red-700',
};

const CHART_STATUS_COLORS: Record<string, string> = {
  a_fazer: '#9ca3af',
  fazendo: '#3b82f6',
  feito: '#f59e0b',
  concluido: '#22c55e',
  backlog: '#6b7280',
  em_andamento: '#3b82f6',
  revisao: '#a855f7',
  cancelado: '#ef4444',
};

const CHART_PRIO_COLORS: Record<string, string> = {
  urgente: '#ef4444',
  alta: '#f97316',
  media: '#eab308',
  baixa: '#3b82f6',
};

const PRIORIDADE_COLORS: Record<string, string> = {
  urgente: 'bg-red-500 text-white',
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baixa: 'bg-blue-100 text-blue-700',
};

export default function SetorPage() {
  const params = useParams<{ sigla: string; sub?: string }>();
  const sigla = (params.sigla || '').toUpperCase();
  const sub = params.sub || '';
  const [, navigate] = useLocation();

  const setorConfigs = trpc.setorConfig.list.useQuery();
  const setoresData = trpc.setores.list.useQuery();

  const config = useMemo(() => {
    if (!setorConfigs.data) return null;
    return (setorConfigs.data as any[]).find((c: any) => c.sigla === sigla);
  }, [setorConfigs.data, sigla]);

  const setor = useMemo(() => {
    if (!setoresData.data || !config) return null;
    return (setoresData.data as any[]).find((s: any) => s.id === config.setorId);
  }, [setoresData.data, config]);

  if (!config || !setor) {
    return (
      <div className="p-6 text-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Carregando setor...
      </div>
    );
  }

  // Route to the right sub-page
  if (sub === 'dashboard') return <SetorDashboard setor={setor} config={config} sigla={sigla} />;
  if (sub === 'nova-tarefa') return <NovaTarefaSetor setorId={setor.id} setorNome={setor.nome} sigla={sigla} />;
  if (sub === 'fila') return <FilaSetor setorId={setor.id} setorNome={setor.nome} sigla={sigla} />;
  if (sub === 'analitica' || sub === 'relatorio') return <AnaliticaSetor setorId={setor.id} setorNome={setor.nome} sigla={sigla} />;

  // Default: show dashboard
  return <SetorDashboard setor={setor} config={config} sigla={sigla} />;
}

// ===== NAVIGATION HEADER =====
function NavHeader({ sigla, title }: { sigla: string; title?: string }) {
  const [, navigate] = useLocation();
  return (
    <div className="flex items-center gap-2 mb-4">
      <button onClick={() => window.history.back()} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="Voltar">
        <ArrowLeft className="w-4 h-4 text-gray-600" />
      </button>
      <button onClick={() => navigate('/')} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="Início">
        <Home className="w-4 h-4 text-gray-600" />
      </button>
      {title && <span className="text-sm text-gray-500 ml-1">{title}</span>}
    </div>
  );
}

// ===== SETOR DASHBOARD =====
function SetorDashboard({ setor, config, sigla }: { setor: any; config: any; sigla: string }) {
  const [, navigate] = useLocation();
  const users = trpc.users.list.useQuery();
  const workflow = config.workflowStatuses || ['a_fazer', 'fazendo', 'feito', 'concluido'];

  // Filters
  const [responsavelId, setResponsavelId] = useState<number | undefined>();
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const statsQuery = trpc.tarefas.setorStats.useQuery({
    setorId: setor.id,
    responsavelId,
    periodoInicio: periodoInicio || undefined,
    periodoFim: periodoFim || undefined,
  }, { refetchInterval: 30000 });

  const stats = statsQuery.data;

  const clearFilters = () => {
    setResponsavelId(undefined);
    setPeriodoInicio('');
    setPeriodoFim('');
  };

  const hasFilters = !!responsavelId || !!periodoInicio || !!periodoFim;

  // Chart data
  const statusChartData = useMemo(() => {
    if (!stats?.statusBreakdown) return [];
    return stats.statusBreakdown.map((s: any) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      fill: CHART_STATUS_COLORS[s.status] || '#9ca3af',
    })).filter((d: any) => d.value > 0);
  }, [stats]);

  const prioridadeChartData = useMemo(() => {
    if (!stats?.prioridadeBreakdown) return [];
    return stats.prioridadeBreakdown.map((p: any) => ({
      name: p.prioridade.charAt(0).toUpperCase() + p.prioridade.slice(1),
      value: p.count,
      fill: CHART_PRIO_COLORS[p.prioridade] || '#9ca3af',
    })).filter((d: any) => d.value > 0);
  }, [stats]);

  const responsavelChartData = useMemo(() => {
    if (!stats?.responsavelStats || !users.data) return [];
    return stats.responsavelStats.map((r: any) => {
      const user = (users.data as any[])?.find((u: any) => u.id === r.responsavelId);
      return {
        name: user?.name?.split(' ')[0] || 'Não atribuído',
        total: r.total,
        concluido: r.concluido,
        vencido: r.vencido,
      };
    }).sort((a: any, b: any) => b.total - a.total).slice(0, 8);
  }, [stats, users.data]);

  const submenus = config.submenus || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard — {setor.nome}</h1>
          <p className="text-sm text-gray-500 mt-1">Visão consolidada das tarefas do setor</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-1" />
            Filtros
            {hasFilters && <Badge className="ml-1 bg-blue-500 text-white text-[10px] px-1">!</Badge>}
          </Button>
          <Link href={`/setor/${sigla.toLowerCase()}/nova-tarefa`}>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Tarefa</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Responsável</Label>
                <Select value={responsavelId ? String(responsavelId) : 'all'} onValueChange={(v) => setResponsavelId(v === 'all' ? undefined : Number(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(users.data as any[])?.filter((u: any) => u.ativo).map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Período Início</Label>
                <Input type="date" className="h-9" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Período Fim</Label>
                <Input type="date" className="h-9" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
              </div>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" /> Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Total de Tarefas</p>
            <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Pendentes</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{stats?.pendentes || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Concluídas</p>
            <p className="text-3xl font-bold mt-1 text-green-600">{stats?.concluido || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Em Atraso</p>
            <p className="text-3xl font-bold mt-1 text-red-600">{stats?.vencido || 0}</p>
            {(stats?.atencao || 0) > 0 && (
              <p className="text-xs text-amber-500 mt-0.5">{stats?.atencao} em atenção</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {(stats?.total || 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Status Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`} labelLine={false}>
                      {statusChartData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Sem dados</div>
              )}
            </CardContent>
          </Card>

          {/* Priority Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              {prioridadeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={prioridadeChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`} labelLine={false}>
                      {prioridadeChartData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Sem dados</div>
              )}
            </CardContent>
          </Card>

          {/* Responsavel Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              {responsavelChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={responsavelChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="concluido" name="Concluído" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Sem dados</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Fila de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {workflow.map((status: string) => {
              const count = stats?.statusBreakdown?.find((s: any) => s.status === status)?.count || 0;
              return (
                <div key={status} className="text-center p-3 rounded-lg bg-gray-50 border">
                  <Badge variant="outline" className={cn('text-xs mb-2', STATUS_COLORS[status])}>
                    {STATUS_LABELS[status] || status}
                  </Badge>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {submenus.filter((s: any) => s.key !== 'dashboard').map((sub: any) => (
              <Link key={sub.key} href={sub.rota}>
                <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                  <span className="text-sm text-gray-700">{sub.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent overdue */}
        {(stats?.vencido || 0) > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" /> Tarefas em Atraso ({stats?.vencido})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Existem {stats?.vencido} tarefa(s) com SLA vencido neste setor.
                Acesse a fila de trabalho para verificar e priorizar.
              </p>
              <Link href={`/setor/${sigla.toLowerCase()}/fila`}>
                <Button variant="outline" size="sm" className="mt-3 text-red-600 border-red-200 hover:bg-red-50">
                  Ver Fila <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <RefreshCw className="w-3 h-3" />
        Atualização automática a cada 30 segundos
      </div>
    </div>
  );
}

function TarefaCard({ tarefa, users }: { tarefa: any; users: any }) {
  const [, navigate] = useLocation();
  const responsavel = (users as any[])?.find((u: any) => u.id === tarefa.responsavelId);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/tarefas/${tarefa.id}`)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-blue-600">{tarefa.codigo}</span>
          <Badge variant="outline" className={cn('text-[10px]', PRIORIDADE_COLORS[tarefa.prioridade])}>
            {tarefa.prioridade}
          </Badge>
        </div>
        <p className="text-sm font-medium text-gray-900 line-clamp-2">{tarefa.titulo}</p>
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>{responsavel?.name || 'Não atribuído'}</span>
          {tarefa.slaStatus === 'vencido' && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="w-3 h-3" /> SLA
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NovaTarefaSetor({ setorId, setorNome, sigla }: { setorId: number; setorNome: string; sigla: string }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const users = trpc.users.list.useQuery();
  const [form, setForm] = useState({
    titulo: '', descricao: '', prioridade: 'media' as string,
    responsavelId: undefined as number | undefined,
    slaHoras: 48,
  });

  const createTarefa = trpc.tarefas.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Tarefa ${data.codigo} criada!`);
      utils.tarefas.list.invalidate();
      utils.tarefas.setorStats.invalidate();
      navigate(`/setor/${sigla.toLowerCase()}`);
    },
    onError: () => toast.error('Erro ao criar tarefa'),
  });

  const handleSubmit = () => {
    if (!form.titulo) { toast.error('Informe o título da tarefa'); return; }
    createTarefa.mutate({
      titulo: form.titulo,
      descricao: form.descricao || undefined,
      tipo: 'tarefa',
      prioridade: form.prioridade as any,
      setorId,
      responsavelId: form.responsavelId,
      slaHoras: form.slaHoras,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <NavHeader sigla={sigla} title={`${setorNome} > Nova Tarefa`} />

      <Card>
        <CardHeader>
          <CardTitle>Nova Tarefa — {sigla}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Descreva brevemente a tarefa" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes da tarefa..." rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>SLA (horas)</Label>
              <Input type="number" value={form.slaHoras} onChange={(e) => setForm({ ...form, slaHoras: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Select value={form.responsavelId ? String(form.responsavelId) : 'none'} onValueChange={(v) => setForm({ ...form, responsavelId: v === 'none' ? undefined : Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não atribuído</SelectItem>
                {(users.data as any[])?.filter((u: any) => u.ativo).map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(`/setor/${sigla.toLowerCase()}`)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createTarefa.isPending}>
              {createTarefa.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Criar Tarefa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FilaSetor({ setorId, setorNome, sigla }: { setorId: number; setorNome: string; sigla: string }) {
  const tarefas = trpc.tarefas.list.useQuery({ setorId });
  const users = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  const updateTarefa = trpc.tarefas.update.useMutation({
    onSuccess: () => {
      toast.success('Status atualizado!');
      utils.tarefas.list.invalidate();
      utils.tarefas.setorStats.invalidate();
    },
  });

  const sortedTarefas = useMemo(() => {
    if (!tarefas.data) return [];
    return [...(tarefas.data as any[])].sort((a, b) => {
      const order = ['a_fazer', 'fazendo', 'feito', 'concluido'];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
  }, [tarefas.data]);

  const overdue = sortedTarefas.filter(t => t.slaStatus === 'vencido');

  return (
    <div className="p-6 space-y-6">
      <NavHeader sigla={sigla} title={`${setorNome} > Fila de Trabalho`} />

      {/* Overdue banner */}
      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">{overdue.length} tarefa(s) em atraso</p>
              <p className="text-xs text-red-500">
                {overdue.slice(0, 3).map(t => t.codigo).join(', ')}
                {overdue.length > 3 && ` e mais ${overdue.length - 3}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {sortedTarefas.length === 0 && (
          <Card><CardContent className="py-8 text-center text-gray-400">Nenhuma tarefa na fila</CardContent></Card>
        )}
        {sortedTarefas.map((t: any) => {
          const responsavel = (users.data as any[])?.find((u: any) => u.id === t.responsavelId);
          return (
            <Card key={t.id} className={cn("hover:shadow-sm transition-shadow", t.slaStatus === 'vencido' && 'border-red-200')}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-blue-600 w-16">{t.codigo}</span>
                  <div>
                    <Link href={`/tarefas/${t.id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.titulo}</Link>
                    <p className="text-xs text-gray-400">
                      {responsavel?.name || 'Não atribuído'}
                      {t.slaStatus === 'vencido' && <span className="text-red-500 ml-2">SLA vencido</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={cn('text-[10px]', PRIORIDADE_COLORS[t.prioridade])}>{t.prioridade}</Badge>
                  <Select
                    value={t.status}
                    onValueChange={(v) => updateTarefa.mutate({ id: t.id, data: { status: v } })}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a_fazer">A Fazer</SelectItem>
                      <SelectItem value="fazendo">Fazendo</SelectItem>
                      <SelectItem value="feito">Feito</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AnaliticaSetor({ setorId, setorNome, sigla }: { setorId: number; setorNome: string; sigla: string }) {
  const stats = trpc.tarefas.setorStats.useQuery({ setorId }, { refetchInterval: 30000 });
  const users = trpc.users.list.useQuery();

  const data = stats.data;
  const taxaConclusao = (data?.total || 0) > 0 ? Math.round(((data?.concluido || 0) / (data?.total || 1)) * 100) : 0;

  const responsavelData = useMemo(() => {
    if (!data?.responsavelStats || !users.data) return [];
    return data.responsavelStats.map((r: any) => {
      const user = (users.data as any[])?.find((u: any) => u.id === r.responsavelId);
      return { name: user?.name?.split(' ')[0] || 'N/A', total: r.total, concluido: r.concluido, vencido: r.vencido };
    }).sort((a: any, b: any) => b.total - a.total);
  }, [data, users.data]);

  return (
    <div className="p-6 space-y-6">
      <NavHeader sigla={sigla} title={`${setorNome} > Visão Analítica`} />

      <h1 className="text-2xl font-bold text-gray-900">Visão Analítica — {sigla}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{data?.total || 0}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{data?.emAndamento || 0}</p>
            <p className="text-xs text-gray-500">Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-green-600">{data?.concluido || 0}</p>
            <p className="text-xs text-gray-500">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-red-600">{data?.vencido || 0}</p>
            <p className="text-xs text-gray-500">SLA Vencido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{data?.urgente || 0}</p>
            <p className="text-xs text-gray-500">Urgentes/Alta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{taxaConclusao}%</p>
            <p className="text-xs text-gray-500">Taxa Conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Progresso Geral</CardTitle></CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${taxaConclusao}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-2">{data?.concluido || 0} de {data?.total || 0} tarefas concluídas</p>
        </CardContent>
      </Card>

      {/* Responsavel chart */}
      {responsavelData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Tarefas por Responsável</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={responsavelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="concluido" name="Concluído" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vencido" name="Vencido" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
