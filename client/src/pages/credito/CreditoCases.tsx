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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase, Plus, Search, Loader2, ChevronRight, Eye, ArrowRight,
  CheckCircle, Clock, AlertTriangle, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FASE_MAP: Record<string, { label: string; color: string }> = {
  analise_inicial: { label: 'Análise Inicial', color: 'bg-blue-100 text-blue-800' },
  apuracao: { label: 'Apuração', color: 'bg-indigo-100 text-indigo-800' },
  revisao: { label: 'Revisão', color: 'bg-purple-100 text-purple-800' },
  compensacao: { label: 'Compensação', color: 'bg-emerald-100 text-emerald-800' },
  acompanhamento: { label: 'Acompanhamento', color: 'bg-teal-100 text-teal-800' },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-600' },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  pausado: { label: 'Pausado', color: 'bg-amber-100 text-amber-800' },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-600' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-600' },
};

export default function CreditoCases() {
  const [tab, setTab] = useState('todas');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);

  const cases = trpc.creditRecovery.credito.cases.list.useQuery(
    tab !== 'todas' ? { fase: tab } : undefined
  );
  const stats = trpc.creditRecovery.credito.cases.stats.useQuery();
  const clientes = trpc.clientes.list.useQuery();
  const parceiros = trpc.parceiros.list.useQuery();
  const users = trpc.users.list.useQuery();
  const teses = trpc.teses.list.useQuery();
  const utils = trpc.useUtils();

  const [newCase, setNewCase] = useState({
    clienteId: null as number | null,
    parceiroId: null as number | null,
    teseId: null as number | null,
    responsavelId: null as number | null,
    descricao: '',
    periodoInicio: '',
    periodoFim: '',
  });

  const createMutation = trpc.creditRecovery.credito.cases.create.useMutation({
    onSuccess: () => {
      toast.success('Case criado com sucesso');
      setShowCreate(false);
      setNewCase({ clienteId: null, parceiroId: null, teseId: null, responsavelId: null, descricao: '', periodoInicio: '', periodoFim: '' });
      utils.creditRecovery.credito.cases.list.invalidate();
      utils.creditRecovery.credito.cases.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const advanceMutation = trpc.creditRecovery.credito.cases.update.useMutation({
    onSuccess: () => {
      toast.success('Fase avançada');
      utils.creditRecovery.credito.cases.list.invalidate();
      utils.creditRecovery.credito.cases.stats.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!cases.data) return [];
    const items = cases.data as any[];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((c: any) =>
      c.numero?.toLowerCase().includes(q) ||
      c.descricao?.toLowerCase().includes(q)
    );
  }, [cases.data, search]);

  const statsData = (stats.data || {}) as any;
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const getClienteName = (id: number | null) => {
    if (!id || !clientes.data) return '—';
    return (clientes.data as any[]).find((c: any) => c.id === id)?.razaoSocial || '—';
  };

  const getUserName = (id: number | null) => {
    if (!id || !users.data) return 'Não atribuído';
    return (users.data as any[]).find((u: any) => u.id === id)?.name || 'Não atribuído';
  };

  const nextFase = (fase: string) => {
    const order = ['analise_inicial', 'apuracao', 'revisao', 'compensacao', 'acompanhamento', 'encerrado'];
    const idx = order.indexOf(fase);
    return idx < order.length - 1 ? order[idx + 1] : null;
  };

  // Detail view
  const detailCase = showDetail ? (filtered.find((c: any) => c.id === showDetail) || null) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Cases</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Cases de Recuperação</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de cases por fases: Análise → Apuração → Revisão → Compensação → Acompanhamento</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Case</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Case de Recuperação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Select value={newCase.clienteId?.toString() || '_none'} onValueChange={v => setNewCase(p => ({ ...p, clienteId: v === '_none' ? null : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
                  <Label>Parceiro</Label>
                  <Select value={newCase.parceiroId?.toString() || '_none'} onValueChange={v => setNewCase(p => ({ ...p, parceiroId: v === '_none' ? null : Number(v) }))}>
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
                  <Label>Responsável</Label>
                  <Select value={newCase.responsavelId?.toString() || '_none'} onValueChange={v => setNewCase(p => ({ ...p, responsavelId: v === '_none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Não atribuir</SelectItem>
                      {(users.data as any[] || []).map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Tese Tributária</Label>
                <Select value={newCase.teseId?.toString() || '_none'} onValueChange={v => setNewCase(p => ({ ...p, teseId: v === '_none' ? null : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhuma</SelectItem>
                    {(teses.data as any[] || []).map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Período Início</Label>
                  <Input type="date" value={newCase.periodoInicio} onChange={e => setNewCase(p => ({ ...p, periodoInicio: e.target.value }))} />
                </div>
                <div>
                  <Label>Período Fim</Label>
                  <Input type="date" value={newCase.periodoFim} onChange={e => setNewCase(p => ({ ...p, periodoFim: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newCase.descricao} onChange={e => setNewCase(p => ({ ...p, descricao: e.target.value }))} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(newCase as any)} disabled={createMutation.isPending || !newCase.clienteId}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Criar Case
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Phase Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(FASE_MAP).map(([key, val]) => (
          <Card key={key} className={cn('cursor-pointer hover:shadow-sm transition-shadow', tab === key && 'ring-2 ring-primary')} onClick={() => setTab(tab === key ? 'todas' : key)}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{statsData[key] || 0}</p>
              <p className="text-[11px] text-muted-foreground">{val.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Cases</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 w-64 h-9" placeholder="Buscar por número..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cases.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum case encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Estimado</TableHead>
                    <TableHead className="text-right">Valor Apurado</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="w-36">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-medium">{c.numero}</TableCell>
                      <TableCell className="text-sm">{getClienteName(c.clienteId)}</TableCell>
                      <TableCell className="text-sm">{getUserName(c.responsavelId)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', FASE_MAP[c.fase]?.color)}>{FASE_MAP[c.fase]?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', STATUS_MAP[c.status]?.color)}>{STATUS_MAP[c.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(c.valorEstimado)}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-emerald-700">{formatCurrency(c.valorApurado)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(c.periodoInicio)} — {formatDate(c.periodoFim)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {nextFase(c.fase) && c.status === 'ativo' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => advanceMutation.mutate({ id: c.id, fase: nextFase(c.fase) as any })}>
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Avançar
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
