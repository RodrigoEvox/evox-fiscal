import { trpc } from '@/lib/trpc';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DollarSign, Plus, Search, Loader2, ChevronRight, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TIPO_MAP: Record<string, { label: string; color: string; icon: any }> = {
  apuracao: { label: 'Apuração', color: 'text-blue-700 bg-blue-50', icon: TrendingUp },
  compensacao: { label: 'Compensação', color: 'text-emerald-700 bg-emerald-50', icon: ArrowUpRight },
  ajuste: { label: 'Ajuste', color: 'text-amber-700 bg-amber-50', icon: BarChart3 },
  estorno: { label: 'Estorno', color: 'text-red-700 bg-red-50', icon: ArrowDownRight },
  vencimento: { label: 'Vencimento', color: 'text-gray-700 bg-gray-50', icon: TrendingDown },
};

export default function CreditoLedger() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todas');
  const [showCreate, setShowCreate] = useState(false);

  const ledger = trpc.creditRecovery.credito.ledger.list.useQuery();
  const summary = trpc.creditRecovery.credito.ledger.summary.useQuery();
  const cases = trpc.creditRecovery.credito.cases.list.useQuery();
  const clientes = trpc.clientes.list.useQuery();
  const utils = trpc.useUtils();

  const [newEntry, setNewEntry] = useState({
    caseId: null as number | null,
    clienteId: null as number | null,
    tipo: 'apuracao',
    valor: '',
    tributo: '',
    competencia: '',
    descricao: '',
  });

  const createMutation = trpc.creditRecovery.credito.ledger.create.useMutation({
    onSuccess: () => {
      toast.success('Lançamento registrado');
      setShowCreate(false);
      setNewEntry({ caseId: null, clienteId: null, tipo: 'apuracao', valor: '', tributo: '', competencia: '', descricao: '' });
      utils.creditRecovery.credito.ledger.list.invalidate();
      utils.creditRecovery.credito.ledger.summary.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!ledger.data) return [];
    const items = ledger.data as any[];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((l: any) =>
      l.tributo?.toLowerCase().includes(q) ||
      l.competencia?.toLowerCase().includes(q) ||
      l.descricao?.toLowerCase().includes(q)
    );
  }, [ledger.data, search]);

  const sm = (summary.data || { totalApurado: 0, totalCompensado: 0, totalEstornado: 0, saldo: 0 }) as any;
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

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
            <span className="text-foreground font-medium">Ledger de Créditos</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Ledger de Créditos</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro contábil de todos os créditos apurados, compensados, ajustados e estornados</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Lançamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Case</Label>
                  <Select value={newEntry.caseId?.toString() || '_none'} onValueChange={v => setNewEntry(p => ({ ...p, caseId: v === '_none' ? null : Number(v) }))}>
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
                  <Select value={newEntry.clienteId?.toString() || '_none'} onValueChange={v => setNewEntry(p => ({ ...p, clienteId: v === '_none' ? null : Number(v) }))}>
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
                  <Label>Tipo</Label>
                  <Select value={newEntry.tipo} onValueChange={v => setNewEntry(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={newEntry.valor} onChange={e => setNewEntry(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tributo</Label>
                  <Input value={newEntry.tributo} onChange={e => setNewEntry(p => ({ ...p, tributo: e.target.value }))} placeholder="PIS, COFINS, ICMS..." />
                </div>
                <div>
                  <Label>Competência</Label>
                  <Input value={newEntry.competencia} onChange={e => setNewEntry(p => ({ ...p, competencia: e.target.value }))} placeholder="01/2025" />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={newEntry.descricao} onChange={e => setNewEntry(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição do lançamento" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate({ ...newEntry, valor: parseFloat(newEntry.valor) || 0 } as any)} disabled={createMutation.isPending || !newEntry.valor}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Apurado</p>
            <p className="text-2xl font-bold mt-1 text-blue-700">{formatCurrency(sm.totalApurado)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#10B981' }}>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Compensado</p>
            <p className="text-2xl font-bold mt-1 text-emerald-700">{formatCurrency(sm.totalCompensado)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#EF4444' }}>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Estornado</p>
            <p className="text-2xl font-bold mt-1 text-red-700">{formatCurrency(sm.totalEstornado)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#8B5CF6' }}>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo</p>
            <p className="text-2xl font-bold mt-1 text-purple-700">{formatCurrency(sm.saldo)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lançamentos</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  {Object.entries(TIPO_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 w-56 h-9" placeholder="Buscar tributo, competência..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ledger.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum lançamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tributo</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l: any) => {
                    const tipoInfo = TIPO_MAP[l.tipo] || { label: l.tipo, color: 'text-gray-700 bg-gray-50' };
                    const isNegative = l.tipo === 'estorno' || l.tipo === 'vencimento';
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(l.criadoEm)}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', tipoInfo.color)}>{tipoInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{getClienteName(l.clienteId)}</TableCell>
                        <TableCell className="text-sm font-medium">{l.tributo || '—'}</TableCell>
                        <TableCell className="text-sm">{l.competencia || '—'}</TableCell>
                        <TableCell className={cn('text-right text-sm font-bold', isNegative ? 'text-red-600' : 'text-emerald-600')}>
                          {isNegative ? '−' : '+'}{formatCurrency(Math.abs(l.valor))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{l.descricao || '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
