import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus, Search, LayoutGrid, List, Clock, AlertTriangle,
  CheckCircle2, Circle, ArrowRight, Timer, Calendar, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  backlog: { label: 'Backlog', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Circle },
  a_fazer: { label: 'A Fazer', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Circle },
  em_andamento: { label: 'Em Andamento', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: ArrowRight },
  revisao: { label: 'Revisão', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Clock },
  concluido: { label: 'Concluído', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
};

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  urgente: { label: 'Urgente', color: 'bg-red-500 text-white' },
  alta: { label: 'Alta', color: 'bg-red-100 text-red-700' },
  media: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
  baixa: { label: 'Baixa', color: 'bg-blue-100 text-blue-700' },
};

export default function Tarefas() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  const tarefas = trpc.tarefas.list.useQuery({});
  const setores = trpc.setores.list.useQuery();
  const users = trpc.users.list.useQuery();
  const createTarefa = trpc.tarefas.create.useMutation({
    onSuccess: () => { tarefas.refetch(); setShowCreate(false); toast.success('Tarefa criada!'); },
    onError: (e) => toast.error(e.message),
  });
  const updateTarefa = trpc.tarefas.update.useMutation({
    onSuccess: () => tarefas.refetch(),
  });

  const [form, setForm] = useState({
    titulo: '', descricao: '', tipo: 'tarefa', prioridade: 'media',
    setorId: '', responsavelId: '', slaHoras: '', dataVencimento: '',
  });

  const filtered = useMemo(() => {
    if (!tarefas.data) return [];
    return tarefas.data.filter((t: any) => {
      if (search && !t.titulo.toLowerCase().includes(search.toLowerCase()) && !t.codigo?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPrioridade !== 'all' && t.prioridade !== filterPrioridade) return false;
      if (t.tarefaPaiId) return false; // hide subtasks from main view
      return true;
    });
  }, [tarefas.data, search, filterStatus, filterPrioridade]);

  const kanbanColumns = ['backlog', 'a_fazer', 'em_andamento', 'revisao', 'concluido'];

  const handleCreate = () => {
    if (!form.titulo.trim()) { toast.error('Título é obrigatório'); return; }
    createTarefa.mutate({
      titulo: form.titulo,
      descricao: form.descricao || undefined,
      tipo: form.tipo as any,
      prioridade: form.prioridade as any,
      setorId: form.setorId ? parseInt(form.setorId) : undefined,
      responsavelId: form.responsavelId ? parseInt(form.responsavelId) : undefined,
      slaHoras: form.slaHoras ? parseInt(form.slaHoras) : undefined,
      dataVencimento: form.dataVencimento || undefined,
    });
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateTarefa.mutate({ id, data: { status: newStatus } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} tarefa(s) • Gerencie atividades de todos os setores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', view === 'kanban' ? 'bg-background shadow text-foreground' : 'text-muted-foreground')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', view === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título da tarefa" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descreva a tarefa..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tarefa">Tarefa</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="melhoria">Melhoria</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="documento">Documento</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Setor</Label>
                    <Select value={form.setorId} onValueChange={v => setForm(f => ({ ...f, setorId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {setores.data?.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Select value={form.responsavelId} onValueChange={v => setForm(f => ({ ...f, responsavelId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {users.data?.filter((u: any) => u.ativo !== false).map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>{u.name || u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SLA (horas)</Label>
                    <Input type="number" value={form.slaHoras} onChange={e => setForm(f => ({ ...f, slaHoras: e.target.value }))} placeholder="48" />
                  </div>
                  <div>
                    <Label>Data Vencimento</Label>
                    <Input type="date" value={form.dataVencimento} onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={createTarefa.isPending} className="w-full">
                  {createTarefa.isPending ? 'Criando...' : 'Criar Tarefa'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefas..." className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(prioridadeConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(status => {
            const config = statusConfig[status];
            const items = filtered.filter((t: any) => t.status === status);
            return (
              <div key={status} className="flex-shrink-0 w-72">
                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-lg border', config.color)}>
                  <config.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
                </div>
                <div className="space-y-2 p-2 bg-muted/30 rounded-b-lg min-h-[200px] border border-t-0">
                  {items.map((t: any) => (
                    <Link key={t.id} href={`/tarefas/${t.id}`}>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow border">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">{t.codigo}</span>
                            <Badge className={cn('text-[10px]', prioridadeConfig[t.prioridade]?.color)}>
                              {prioridadeConfig[t.prioridade]?.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium leading-tight">{t.titulo}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {t.slaHoras && (
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {t.slaHoras}h
                              </span>
                            )}
                            {t.dataVencimento && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                          {t.slaStatus === 'vencido' && (
                            <Badge variant="destructive" className="text-[10px]">SLA Vencido</Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left p-3 font-medium">Código</th>
                  <th className="text-left p-3 font-medium">Título</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Prioridade</th>
                  <th className="text-left p-3 font-medium">SLA</th>
                  <th className="text-left p-3 font-medium">Vencimento</th>
                  <th className="text-left p-3 font-medium">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => window.location.href = `/tarefas/${t.id}`}>
                    <td className="p-3 text-xs font-mono text-muted-foreground">{t.codigo}</td>
                    <td className="p-3 text-sm font-medium">{t.titulo}</td>
                    <td className="p-3">
                      <Badge className={cn('text-[10px]', statusConfig[t.status]?.color)}>{statusConfig[t.status]?.label}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={cn('text-[10px]', prioridadeConfig[t.prioridade]?.color)}>{prioridadeConfig[t.prioridade]?.label}</Badge>
                    </td>
                    <td className="p-3 text-xs">{t.slaHoras ? `${t.slaHoras}h` : '—'}</td>
                    <td className="p-3 text-xs">{t.dataVencimento ? new Date(t.dataVencimento).toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${t.progresso || 0}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{t.progresso || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">Nenhuma tarefa encontrada</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
