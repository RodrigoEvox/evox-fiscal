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
import {
  MessageSquare, Plus, Search, Loader2, ChevronRight, CheckCircle, Clock, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-amber-100 text-amber-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  aguardando_cliente: { label: 'Aguardando Cliente', color: 'bg-purple-100 text-purple-800' },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-800' },
  fechado: { label: 'Fechado', color: 'bg-gray-100 text-gray-600' },
};

const PRIORIDADE_MAP: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

const CATEGORIA_MAP: Record<string, string> = {
  duvida: 'Dúvida',
  problema: 'Problema',
  solicitacao: 'Solicitação',
  reclamacao: 'Reclamação',
  outro: 'Outro',
};

export default function CreditoTickets() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [showCreate, setShowCreate] = useState(false);

  const tickets = trpc.creditRecovery.credito.tickets.list.useQuery(
    statusFilter !== 'todas' ? { status: statusFilter } : undefined
  );
  const cases = trpc.creditRecovery.credito.cases.list.useQuery();
  const clientes = trpc.clientes.list.useQuery();
  const users = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  const [newTicket, setNewTicket] = useState({
    caseId: null as number | null,
    clienteId: null as number | null,
    categoria: 'duvida',
    prioridade: 'normal',
    assunto: '',
    descricao: '',
  });

  const createMutation = trpc.creditRecovery.credito.tickets.create.useMutation({
    onSuccess: () => {
      toast.success('Ticket criado');
      setShowCreate(false);
      setNewTicket({ caseId: null, clienteId: null, categoria: 'duvida', prioridade: 'normal', assunto: '', descricao: '' });
      utils.creditRecovery.credito.tickets.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.creditRecovery.credito.tickets.update.useMutation({
    onSuccess: () => {
      toast.success('Ticket atualizado');
      utils.creditRecovery.credito.tickets.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!tickets.data) return [];
    const items = tickets.data as any[];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((t: any) =>
      t.numero?.toLowerCase().includes(q) ||
      t.assunto?.toLowerCase().includes(q)
    );
  }, [tickets.data, search]);

  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const getClienteName = (id: number | null) => {
    if (!id || !clientes.data) return '—';
    return (clientes.data as any[]).find((c: any) => c.id === id)?.razaoSocial || '—';
  };
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
            <span className="text-foreground font-medium">Tickets</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">Chamados e solicitações de clientes e parceiros vinculados a cases</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Ticket</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Case</Label>
                  <Select value={newTicket.caseId?.toString() || '_none'} onValueChange={v => setNewTicket(p => ({ ...p, caseId: v === '_none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
                      {(cases.data as any[] || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.numero}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Select value={newTicket.clienteId?.toString() || '_none'} onValueChange={v => setNewTicket(p => ({ ...p, clienteId: v === '_none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
                      {(clientes.data as any[] || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.razaoSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={newTicket.categoria} onValueChange={v => setNewTicket(p => ({ ...p, categoria: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIA_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={newTicket.prioridade} onValueChange={v => setNewTicket(p => ({ ...p, prioridade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORIDADE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Assunto</Label>
                <Input value={newTicket.assunto} onChange={e => setNewTicket(p => ({ ...p, assunto: e.target.value }))} placeholder="Assunto do ticket" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newTicket.descricao} onChange={e => setNewTicket(p => ({ ...p, descricao: e.target.value }))} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(newTicket as any)} disabled={createMutation.isPending || !newTicket.assunto}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Criar Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_MAP).map(([key, val]) => (
          <Card key={key} className={cn('cursor-pointer hover:shadow-sm transition-shadow', statusFilter === key && 'ring-2 ring-primary')} onClick={() => setStatusFilter(statusFilter === key ? 'todas' : key)}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-foreground">{(tickets.data as any[] || []).filter((t: any) => t.status === key).length}</p>
              <p className="text-[10px] text-muted-foreground">{val.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tickets</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 w-64 h-9" placeholder="Buscar por número, assunto..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum ticket encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Número</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-36">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs font-medium">{t.numero}</TableCell>
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">{t.assunto}</TableCell>
                      <TableCell className="text-sm">{getClienteName(t.clienteId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{CATEGORIA_MAP[t.categoria] || t.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', PRIORIDADE_MAP[t.prioridade]?.color)}>{PRIORIDADE_MAP[t.prioridade]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{getUserName(t.responsavelId)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', STATUS_MAP[t.status]?.color)}>{STATUS_MAP[t.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(t.criadoEm)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {t.status === 'aberto' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: t.id, status: 'em_andamento' })}>
                              Iniciar
                            </Button>
                          )}
                          {t.status === 'em_andamento' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-700" onClick={() => updateMutation.mutate({ id: t.id, status: 'resolvido' })}>
                              Resolver
                            </Button>
                          )}
                          {t.status === 'resolvido' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: t.id, status: 'cancelado' })}>
                              Fechar
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
