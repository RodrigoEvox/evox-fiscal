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
  Trophy, Plus, Search, Loader2, ChevronRight, DollarSign, TrendingUp, CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  pago: { label: 'Pago', color: 'bg-blue-100 text-blue-800' },
};

export default function CreditoExitos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [showCreate, setShowCreate] = useState(false);

  const exitos = trpc.creditRecovery.credito.exito.list.useQuery();
  const cases = trpc.creditRecovery.credito.cases.list.useQuery();
  const clientes = trpc.clientes.list.useQuery();
  const utils = trpc.useUtils();

  const [newExito, setNewExito] = useState({
    caseId: null as number | null,
    clienteId: null as number | null,
    valorRecuperado: '',
    valorHonorarios: '',
    tributo: '',
    competencia: '',
    descricao: '',
  });

  const createMutation = trpc.creditRecovery.credito.exito.create.useMutation({
    onSuccess: () => {
      toast.success('Evento de êxito registrado');
      setShowCreate(false);
      setNewExito({ caseId: null, clienteId: null, valorRecuperado: '', valorHonorarios: '', tributo: '', competencia: '', descricao: '' });
      utils.creditRecovery.credito.exito.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const confirmMutation = trpc.creditRecovery.credito.exito.confirm.useMutation({
    onSuccess: () => {
      toast.success('Êxito confirmado');
      utils.creditRecovery.credito.exito.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!exitos.data) return [];
    const items = exitos.data as any[];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((e: any) =>
      e.tributo?.toLowerCase().includes(q) ||
      e.descricao?.toLowerCase().includes(q)
    );
  }, [exitos.data, search]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const totalRecuperado = useMemo(() => (exitos.data as any[] || []).reduce((sum: number, e: any) => sum + (e.valorRecuperado || 0), 0), [exitos.data]);
  const totalHonorarios = useMemo(() => (exitos.data as any[] || []).reduce((sum: number, e: any) => sum + (e.valorHonorarios || 0), 0), [exitos.data]);

  const getClienteName = (id: number | null) => {
    if (!id || !clientes.data) return '—';
    return (clientes.data as any[]).find((c: any) => c.id === id)?.razaoSocial || '—';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Êxitos</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Eventos de Êxito</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro de créditos efetivamente recuperados e honorários</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Êxito</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Registrar Evento de Êxito</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Case</Label>
                  <Select value={newExito.caseId?.toString() || '_none'} onValueChange={v => setNewExito(p => ({ ...p, caseId: v === '_none' ? null : Number(v) }))}>
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
                  <Select value={newExito.clienteId?.toString() || '_none'} onValueChange={v => setNewExito(p => ({ ...p, clienteId: v === '_none' ? null : Number(v) }))}>
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
                  <Label>Valor Recuperado (R$)</Label>
                  <Input type="number" step="0.01" value={newExito.valorRecuperado} onChange={e => setNewExito(p => ({ ...p, valorRecuperado: e.target.value }))} placeholder="0,00" />
                </div>
                <div>
                  <Label>Valor Honorários (R$)</Label>
                  <Input type="number" step="0.01" value={newExito.valorHonorarios} onChange={e => setNewExito(p => ({ ...p, valorHonorarios: e.target.value }))} placeholder="0,00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tributo</Label>
                  <Input value={newExito.tributo} onChange={e => setNewExito(p => ({ ...p, tributo: e.target.value }))} placeholder="PIS, COFINS..." />
                </div>
                <div>
                  <Label>Competência</Label>
                  <Input value={newExito.competencia} onChange={e => setNewExito(p => ({ ...p, competencia: e.target.value }))} placeholder="01/2025" />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newExito.descricao} onChange={e => setNewExito(p => ({ ...p, descricao: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate({ ...newExito, valorRecuperado: parseFloat(newExito.valorRecuperado) || 0, valorHonorarios: parseFloat(newExito.valorHonorarios) || 0 } as any)} disabled={createMutation.isPending || !newExito.valorRecuperado}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Registrar Êxito
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: '#10B981' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Recuperado</p>
                <p className="text-2xl font-bold mt-1 text-emerald-700">{formatCurrency(totalRecuperado)}</p>
              </div>
              <Trophy className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#8B5CF6' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Honorários</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">{formatCurrency(totalHonorarios)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Êxitos</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">{(exitos.data as any[] || []).length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Êxitos</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
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
          {exitos.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum êxito encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tributo</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead className="text-right">Valor Recuperado</TableHead>
                    <TableHead className="text-right">Honorários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm font-medium">{getClienteName(e.clienteId)}</TableCell>
                      <TableCell className="text-sm">{e.tributo || '—'}</TableCell>
                      <TableCell className="text-sm">{e.competencia || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-emerald-600">{formatCurrency(e.valorRecuperado)}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-purple-600">{formatCurrency(e.valorHonorarios)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', STATUS_MAP[e.status]?.color)}>{STATUS_MAP[e.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(e.criadoEm)}</TableCell>
                      <TableCell>
                        {e.status === 'pendente' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-700" onClick={() => confirmMutation.mutate({ id: e.id })}>
                            <CheckCircle className="w-3 h-3 mr-1" />Confirmar
                          </Button>
                        )}
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
