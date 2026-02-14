import { useParams, useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus, CheckSquare, Clock, AlertTriangle, BarChart3, ListOrdered,
  ArrowRight, Loader2, ChevronRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  if (sub === 'nova-tarefa') return <NovaTarefaSetor setorId={setor.id} setorNome={setor.nome} sigla={sigla} />;
  if (sub === 'fila') return <FilaSetor setorId={setor.id} setorNome={setor.nome} sigla={sigla} />;
  if (sub === 'analitica') return <AnaliticaSetor setorId={setor.id} setorNome={setor.nome} sigla={sigla} />;

  // Default: show setor overview with Kanban
  return <SetorOverview setor={setor} config={config} sigla={sigla} />;
}

function SetorOverview({ setor, config, sigla }: { setor: any; config: any; sigla: string }) {
  const tarefas = trpc.tarefas.list.useQuery({ setorId: setor.id });
  const users = trpc.users.list.useQuery();
  const workflow = config.workflowStatuses || ['a_fazer', 'fazendo', 'feito', 'concluido'];

  const tarefasByStatus = useMemo(() => {
    const map: Record<string, any[]> = {};
    workflow.forEach((s: string) => { map[s] = []; });
    (tarefas.data as any[])?.forEach((t: any) => {
      const status = workflow.includes(t.status) ? t.status : 'a_fazer';
      if (!map[status]) map[status] = [];
      map[status].push(t);
    });
    return map;
  }, [tarefas.data, workflow]);

  const total = (tarefas.data as any[])?.length || 0;
  const concluidas = tarefasByStatus['concluido']?.length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ color: setor.cor }}>{setor.nome}</h1>
          <p className="text-sm text-gray-500 mt-1">{setor.descricao}</p>
        </div>
        <Link href={`/setor/${sigla.toLowerCase()}/nova-tarefa`}>
          <Button><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-gray-500">Total de Tarefas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{tarefasByStatus['fazendo']?.length || 0}</p>
            <p className="text-xs text-gray-500">Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{concluidas}</p>
            <p className="text-xs text-gray-500">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {(tarefas.data as any[])?.filter((t: any) => t.slaStatus === 'vencido').length || 0}
            </p>
            <p className="text-xs text-gray-500">SLA Vencido</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${workflow.length}, minmax(200px, 1fr))` }}>
        {workflow.map((status: string) => (
          <div key={status} className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className={cn('text-xs font-semibold px-2 py-1 rounded', STATUS_COLORS[status] || 'bg-gray-100')}>
                {STATUS_LABELS[status] || status}
              </span>
              <span className="text-xs text-gray-400">{tarefasByStatus[status]?.length || 0}</span>
            </div>
            <div className="space-y-2 min-h-[100px] bg-gray-50 rounded-lg p-2">
              {tarefasByStatus[status]?.map((t: any) => (
                <TarefaCard key={t.id} tarefa={t} users={users.data} />
              ))}
              {(!tarefasByStatus[status] || tarefasByStatus[status].length === 0) && (
                <div className="text-center text-xs text-gray-300 py-6">Nenhuma tarefa</div>
              )}
            </div>
          </div>
        ))}
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
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/setor/${sigla.toLowerCase()}`} className="hover:text-gray-700">{setorNome}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Nova Tarefa</span>
      </div>

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
    onSuccess: () => { toast.success('Status atualizado!'); utils.tarefas.list.invalidate(); },
  });

  const sortedTarefas = useMemo(() => {
    if (!tarefas.data) return [];
    return [...(tarefas.data as any[])].sort((a, b) => {
      const order = ['a_fazer', 'fazendo', 'feito', 'concluido'];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
  }, [tarefas.data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/setor/${sigla.toLowerCase()}`} className="hover:text-gray-700">{setorNome}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Fila de Apuração</span>
      </div>

      <div className="space-y-2">
        {sortedTarefas.length === 0 && (
          <Card><CardContent className="py-8 text-center text-gray-400">Nenhuma tarefa na fila</CardContent></Card>
        )}
        {sortedTarefas.map((t: any) => {
          const responsavel = (users.data as any[])?.find((u: any) => u.id === t.responsavelId);
          return (
            <Card key={t.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-blue-600 w-16">{t.codigo}</span>
                  <div>
                    <Link href={`/tarefas/${t.id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.titulo}</Link>
                    <p className="text-xs text-gray-400">{responsavel?.name || 'Não atribuído'}</p>
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
  const tarefas = trpc.tarefas.list.useQuery({ setorId });

  const stats = useMemo(() => {
    const data = (tarefas.data as any[]) || [];
    const total = data.length;
    const concluidas = data.filter(t => t.status === 'concluido').length;
    const emAndamento = data.filter(t => t.status === 'fazendo' || t.status === 'em_andamento').length;
    const vencidas = data.filter(t => t.slaStatus === 'vencido').length;
    const urgentes = data.filter(t => t.prioridade === 'urgente' || t.prioridade === 'alta').length;
    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    return { total, concluidas, emAndamento, vencidas, urgentes, taxaConclusao };
  }, [tarefas.data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/setor/${sigla.toLowerCase()}`} className="hover:text-gray-700">{setorNome}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Relatórios e Visão Analítica</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Visão Analítica — {sigla}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.emAndamento}</p>
            <p className="text-xs text-gray-500">Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.concluidas}</p>
            <p className="text-xs text-gray-500">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.vencidas}</p>
            <p className="text-xs text-gray-500">SLA Vencido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{stats.urgentes}</p>
            <p className="text-xs text-gray-500">Urgentes/Alta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.taxaConclusao}%</p>
            <p className="text-xs text-gray-500">Taxa Conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Progresso Geral</CardTitle></CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${stats.taxaConclusao}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-2">{stats.concluidas} de {stats.total} tarefas concluídas</p>
        </CardContent>
      </Card>
    </div>
  );
}
