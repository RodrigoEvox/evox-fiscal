import { trpc } from '@/lib/trpc';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ListOrdered, Plus, Search, Loader2, ChevronRight, CheckCircle, Clock, Play, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FILA_MAP: Record<string, string> = {
  apuracao: 'Apuração',
  revisao: 'Revisão',
  compensacao: 'Compensação',
  retificacao: 'Retificação',
  entrega: 'Entrega',
  geral: 'Geral',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
};

const PRIORIDADE_MAP: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

export default function CreditoFilas() {
  const [filaFilter, setFilaFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const tasks = trpc.creditRecovery.credito.tasks.list.useQuery(
    { ...(filaFilter !== 'todas' ? { fila: filaFilter } : {}), ...(statusFilter !== 'todas' ? { status: statusFilter } : {}) }
  );
  const taskStats = trpc.creditRecovery.credito.tasks.stats.useQuery();
  const users = trpc.users.list.useQuery();
  const cases = trpc.creditRecovery.credito.cases.list.useQuery();
  const utils = trpc.useUtils();

  const [newTask, setNewTask] = useState({
    caseId: null as number | null,
    fila: 'apuracao',
    titulo: '',
    descricao: '',
    prioridade: 'normal',
    responsavelId: null as number | null,
  });

  const createMutation = trpc.creditRecovery.credito.tasks.create.useMutation({
    onSuccess: () => {
      toast.success('Tarefa criada');
      setShowCreate(false);
      setNewTask({ caseId: null, fila: 'apuracao', titulo: '', descricao: '', prioridade: 'normal', responsavelId: null });
      utils.creditRecovery.credito.tasks.list.invalidate();
      utils.creditRecovery.credito.tasks.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.creditRecovery.credito.tasks.update.useMutation({
    onSuccess: () => {
      utils.creditRecovery.credito.tasks.list.invalidate();
      utils.creditRecovery.credito.tasks.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!tasks.data) return [];
    const items = tasks.data as any[];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((t: any) =>
      t.codigo?.toLowerCase().includes(q) ||
      t.titulo?.toLowerCase().includes(q)
    );
  }, [tasks.data, search]);

  const ts = (taskStats.data || {}) as any;
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const getUserName = (id: number | null) => {
    if (!id || !users.data) return 'Não atribuído';
    return (users.data as any[]).find((u: any) => u.id === id)?.name || 'Não atribuído';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Filas de Trabalho</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Filas de Trabalho</h1>
          <p className="text-sm text-muted-foreground mt-1">Tarefas organizadas por fila: Apuração, Revisão, Compensação, Retificação, Entrega</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Tarefa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Case</Label>
                <Select value={newTask.caseId?.toString() || '_none'} onValueChange={v => setNewTask(p => ({ ...p, caseId: v === '_none' ? null : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum</SelectItem>
                    {(cases.data as any[] || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.numero} — {c.descricao?.slice(0, 40) || 'Sem descrição'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fila</Label>
                  <Select value={newTask.fila} onValueChange={v => setNewTask(p => ({ ...p, fila: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FILA_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={newTask.prioridade} onValueChange={v => setNewTask(p => ({ ...p, prioridade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORIDADE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={newTask.titulo} onChange={e => setNewTask(p => ({ ...p, titulo: e.target.value }))} placeholder="Título da tarefa" />
              </div>
              <div>
                <Label>Responsável</Label>
                <Select value={newTask.responsavelId?.toString() || '_none'} onValueChange={v => setNewTask(p => ({ ...p, responsavelId: v === '_none' ? null : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Não atribuir</SelectItem>
                    {(users.data as any[] || []).map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newTask.descricao} onChange={e => setNewTask(p => ({ ...p, descricao: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(newTask as any)} disabled={createMutation.isPending || !newTask.titulo}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Criar Tarefa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pendentes', value: ts.pendente || 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Em Andamento', value: ts.em_andamento || 0, icon: Play, color: 'text-blue-600 bg-blue-50' },
          { label: 'Concluídas', value: ts.concluida || 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Total', value: ts.total || 0, icon: ListOrdered, color: 'text-gray-600 bg-gray-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.color)}>
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Tarefas</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filaFilter} onValueChange={setFilaFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Fila" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Filas</SelectItem>
                  {Object.entries(FILA_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 w-56 h-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma tarefa encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Fila</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className="w-36">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs font-medium">{t.codigo}</TableCell>
                      <TableCell className="text-sm font-medium">{t.titulo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{FILA_MAP[t.fila] || t.fila}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', PRIORIDADE_MAP[t.prioridade]?.color)}>{PRIORIDADE_MAP[t.prioridade]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{getUserName(t.responsavelId)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', STATUS_MAP[t.status]?.color)}>{STATUS_MAP[t.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(t.prazo)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {t.status === 'pendente' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: t.id, status: 'fazendo' })}>
                              <Play className="w-3 h-3 mr-1" />Iniciar
                            </Button>
                          )}
                          {t.status === 'em_andamento' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-700" onClick={() => updateMutation.mutate({ id: t.id, status: 'feito' })}>
                              <CheckCircle className="w-3 h-3 mr-1" />Concluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
