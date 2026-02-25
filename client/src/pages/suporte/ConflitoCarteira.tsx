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
  ArrowLeftRight, Plus, Search, Loader2, ChevronRight, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aberta: { label: 'Aberta', color: 'bg-amber-100 text-amber-800' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
  resolvida: { label: 'Resolvida', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
};

export default function ConflitoCarteira() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('todas');

  const migrations = trpc.creditRecovery.suporte.portfolioMigration.list.useQuery(
    statusFilter !== 'todas' ? { status: statusFilter } : undefined
  );
  const clientes = trpc.clientes.list.useQuery();
  const parceiros = trpc.parceiros.list.useQuery();
  const users = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  const [newMigration, setNewMigration] = useState({
    clienteId: null as number | null,
    parceiroOrigemId: null as number | null,
    parceiroDestinoId: null as number | null,
    motivo: '',
  });

  const createMutation = trpc.creditRecovery.suporte.portfolioMigration.create.useMutation({
    onSuccess: () => {
      toast.success('Conflito de carteira registrado');
      setShowCreate(false);
      setNewMigration({ clienteId: null, parceiroOrigemId: null, parceiroDestinoId: null, motivo: '' });
      utils.creditRecovery.suporte.portfolioMigration.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resolveMutation = trpc.creditRecovery.suporte.portfolioMigration.resolve.useMutation({
    onSuccess: () => {
      toast.success('Conflito resolvido');
      utils.creditRecovery.suporte.portfolioMigration.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!migrations.data) return [];
    const items = migrations.data as any[];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((m: any) => m.motivo?.toLowerCase().includes(q));
  }, [migrations.data, search]);

  const getClienteName = (id: number | null) => {
    if (!id || !clientes.data) return '—';
    const c = (clientes.data as any[]).find((c: any) => c.id === id);
    return c?.razaoSocial || '—';
  };

  const getParceiroName = (id: number | null) => {
    if (!id || !parceiros.data) return '—';
    const p = (parceiros.data as any[]).find((p: any) => p.id === id);
    return p?.nomeFantasia || p?.razaoSocial || '—';
  };

  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Suporte Comercial</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Conflito de Carteira</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Conflito de Carteira</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de migrações e conflitos de carteira entre parceiros</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Conflito</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Registrar Conflito de Carteira</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Select value={newMigration.clienteId?.toString() || '_none'} onValueChange={v => setNewMigration(p => ({ ...p, clienteId: v === '_none' ? null : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum</SelectItem>
                    {(clientes.data as any[] || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.razaoSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Parceiro Origem</Label>
                  <Select value={newMigration.parceiroOrigemId?.toString() || '_none'} onValueChange={v => setNewMigration(p => ({ ...p, parceiroOrigemId: v === '_none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
                      {(parceiros.data as any[] || []).map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.nomeFantasia || p.razaoSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Parceiro Destino</Label>
                  <Select value={newMigration.parceiroDestinoId?.toString() || '_none'} onValueChange={v => setNewMigration(p => ({ ...p, parceiroDestinoId: v === '_none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
                      {(parceiros.data as any[] || []).map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.nomeFantasia || p.razaoSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Motivo</Label>
                <Textarea value={newMigration.motivo} onChange={e => setNewMigration(p => ({ ...p, motivo: e.target.value }))} rows={3} placeholder="Descreva o motivo do conflito..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(newMigration as any)} disabled={createMutation.isPending || !newMigration.clienteId}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: filtered.length, icon: ArrowLeftRight, color: 'text-gray-600 bg-gray-50' },
          { label: 'Abertas', value: filtered.filter((m: any) => m.status === 'aberta').length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Em Análise', value: filtered.filter((m: any) => m.status === 'em_analise').length, icon: Search, color: 'text-blue-600 bg-blue-50' },
          { label: 'Resolvidas', value: filtered.filter((m: any) => m.status === 'resolvida').length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
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

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Conflitos</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  <SelectItem value="aberta">Abertas</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="resolvida">Resolvidas</SelectItem>
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
          {migrations.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum conflito encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Parceiro Origem</TableHead>
                    <TableHead>Parceiro Destino</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm font-medium">{getClienteName(m.clienteId)}</TableCell>
                      <TableCell className="text-sm">{getParceiroName(m.parceiroOrigemId)}</TableCell>
                      <TableCell className="text-sm">{getParceiroName(m.parceiroDestinoId)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{m.motivo || '—'}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', STATUS_MAP[m.status]?.color)}>{STATUS_MAP[m.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(m.criadoEm)}</TableCell>
                      <TableCell>
                        {(m.status === 'aberta' || m.status === 'em_analise') && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-700" onClick={() => resolveMutation.mutate({ id: m.id, resolucao: 'Resolvido', parceiroVencedorId: m.parceiroDestinoId })}>
                            Resolver
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
