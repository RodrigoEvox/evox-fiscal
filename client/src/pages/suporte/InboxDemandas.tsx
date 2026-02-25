import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
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
  Inbox, Plus, Search, Filter, Clock, AlertTriangle, CheckCircle, ArrowRight,
  Loader2, Eye, Send, BarChart3, Users, FileText, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  triagem: { label: 'Triagem', color: 'bg-amber-100 text-amber-800' },
  classificada: { label: 'Classificada', color: 'bg-blue-100 text-blue-800' },
  roteada: { label: 'Roteada', color: 'bg-purple-100 text-purple-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-sky-100 text-sky-800' },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
};

const URGENCIA_MAP: Record<string, { label: string; color: string }> = {
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

const TIPO_MAP: Record<string, string> = {
  apuracao: 'Apuração',
  retificacao: 'Retificação',
  compensacao: 'Compensação',
  onboarding: 'Onboarding',
  chamado: 'Chamado',
  outro: 'Outro',
};

export default function InboxDemandas() {
  const { user } = useAuth();
  const [tab, setTab] = useState('todas');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [showClassificar, setShowClassificar] = useState<number | null>(null);
  const [showRotear, setShowRotear] = useState<number | null>(null);

  const demands = trpc.creditRecovery.suporte.demandRequests.list.useQuery(
    tab !== 'todas' ? { status: tab } : undefined
  );
  const stats = trpc.creditRecovery.suporte.demandRequests.stats.useQuery();
  const clientes = trpc.clientes.list.useQuery();
  const parceiros = trpc.parceiros.list.useQuery();
  const users = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  // Create mutation
  const [newDemand, setNewDemand] = useState({
    tipoDemanda: 'apuracao' as string,
    urgencia: 'normal' as string,
    clienteId: null as number | null,
    parceiroId: null as number | null,
    clienteCnpj: '',
    descricao: '',
    origem: 'suporte' as string,
  });
  const createMutation = trpc.creditRecovery.suporte.demandRequests.create.useMutation({
    onSuccess: () => {
      toast.success('Demanda criada com sucesso');
      setShowCreate(false);
      setNewDemand({ tipoDemanda: 'apuracao', urgencia: 'normal', clienteId: null, parceiroId: null, clienteCnpj: '', descricao: '', origem: 'suporte' });
      utils.creditRecovery.suporte.demandRequests.list.invalidate();
      utils.creditRecovery.suporte.demandRequests.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Classificar mutation
  const [classificarData, setClassificarData] = useState({ tipoDemanda: '', urgencia: '', observacao: '' });
  const classificarMutation = trpc.creditRecovery.suporte.demandRequests.classificar.useMutation({
    onSuccess: () => {
      toast.success('Demanda classificada');
      setShowClassificar(null);
      utils.creditRecovery.suporte.demandRequests.list.invalidate();
      utils.creditRecovery.suporte.demandRequests.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Rotear mutation
  const [rotearData, setRotearData] = useState({ setorDestinoId: null as number | null, responsavelId: null as number | null, observacao: '' });
  const rotearMutation = trpc.creditRecovery.suporte.demandRequests.rotear.useMutation({
    onSuccess: () => {
      toast.success('Demanda roteada com sucesso');
      setShowRotear(null);
      utils.creditRecovery.suporte.demandRequests.list.invalidate();
      utils.creditRecovery.suporte.demandRequests.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Concluir mutation
  const concluirMutation = trpc.creditRecovery.suporte.demandRequests.concluir.useMutation({
    onSuccess: () => {
      toast.success('Demanda concluída');
      utils.creditRecovery.suporte.demandRequests.list.invalidate();
      utils.creditRecovery.suporte.demandRequests.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!demands.data) return [];
    const items = demands.data as any[];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((d: any) =>
      d.numero?.toLowerCase().includes(q) ||
      d.clienteCnpj?.toLowerCase().includes(q) ||
      d.descricao?.toLowerCase().includes(q)
    );
  }, [demands.data, search]);

  const statsData = (stats.data || { total: 0, triagem: 0, classificada: 0, roteada: 0, em_andamento: 0, concluida: 0 }) as any;

  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: any) => d ? new Date(d).toLocaleString('pt-BR') : '—';

  const isSlaExpiring = (d: any) => {
    if (!d.slaTriagemVenceEm || d.status !== 'triagem') return false;
    const vence = new Date(d.slaTriagemVenceEm);
    return vence.getTime() - Date.now() < 2 * 60 * 60 * 1000; // < 2h
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Suporte Comercial</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Inbox de Demandas</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Inbox de Demandas</h1>
          <p className="text-sm text-muted-foreground mt-1">Triagem, classificação e roteamento de demandas de parceiros e clientes</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Demanda</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Demanda</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Demanda</Label>
                  <Select value={newDemand.tipoDemanda} onValueChange={v => setNewDemand(p => ({ ...p, tipoDemanda: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgência</Label>
                  <Select value={newDemand.urgencia} onValueChange={v => setNewDemand(p => ({ ...p, urgencia: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Origem</Label>
                <Select value={newDemand.origem} onValueChange={v => setNewDemand(p => ({ ...p, origem: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parceiro">Parceiro</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                    <SelectItem value="interno">Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente (opcional)</Label>
                <Select value={newDemand.clienteId?.toString() || '_none'} onValueChange={v => setNewDemand(p => ({ ...p, clienteId: v === '_none' ? null : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum</SelectItem>
                    {(clientes.data as any[] || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.razaoSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CNPJ do Cliente</Label>
                <Input value={newDemand.clienteCnpj} onChange={e => setNewDemand(p => ({ ...p, clienteCnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <Label>Parceiro (opcional)</Label>
                <Select value={newDemand.parceiroId?.toString() || '_none'} onValueChange={v => setNewDemand(p => ({ ...p, parceiroId: v === '_none' ? null : Number(v) }))}>
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
                <Label>Descrição</Label>
                <Textarea value={newDemand.descricao} onChange={e => setNewDemand(p => ({ ...p, descricao: e.target.value }))} rows={3} placeholder="Descreva a demanda..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(newDemand as any)} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Criar Demanda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: statsData.total, icon: Inbox, color: 'text-gray-600 bg-gray-50' },
          { label: 'Triagem', value: statsData.triagem, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Classificadas', value: statsData.classificada, icon: Filter, color: 'text-blue-600 bg-blue-50' },
          { label: 'Roteadas', value: statsData.roteada, icon: ArrowRight, color: 'text-purple-600 bg-purple-50' },
          { label: 'Em Andamento', value: statsData.em_andamento, icon: BarChart3, color: 'text-sky-600 bg-sky-50' },
          { label: 'Concluídas', value: statsData.concluida, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map(s => (
          <Card key={s.label} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setTab(s.label === 'Total' ? 'todas' : Object.entries(STATUS_MAP).find(([, v]) => v.label === s.label)?.[0] || 'todas')}>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Demandas</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 w-64 h-9" placeholder="Buscar por número, CNPJ..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
          <Tabs value={tab} onValueChange={setTab} className="mt-2">
            <TabsList className="h-9">
              <TabsTrigger value="todas" className="text-xs">Todas</TabsTrigger>
              <TabsTrigger value="triagem" className="text-xs">Triagem</TabsTrigger>
              <TabsTrigger value="classificada" className="text-xs">Classificadas</TabsTrigger>
              <TabsTrigger value="roteada" className="text-xs">Roteadas</TabsTrigger>
              <TabsTrigger value="em_andamento" className="text-xs">Em Andamento</TabsTrigger>
              <TabsTrigger value="concluida" className="text-xs">Concluídas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {demands.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma demanda encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente / CNPJ</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Urgência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA Triagem</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d: any) => (
                    <TableRow key={d.id} className={cn(isSlaExpiring(d) && 'bg-red-50/50')}>
                      <TableCell className="font-mono text-xs font-medium">{d.numero}</TableCell>
                      <TableCell className="text-sm">{TIPO_MAP[d.tipoDemanda] || d.tipoDemanda}</TableCell>
                      <TableCell className="text-sm">
                        <div>{d.clienteCnpj || '—'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{d.origem}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', URGENCIA_MAP[d.urgencia]?.color)}>{URGENCIA_MAP[d.urgencia]?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', STATUS_MAP[d.status]?.color)}>{STATUS_MAP[d.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.slaTriagemVenceEm ? (
                          <span className={cn(isSlaExpiring(d) && 'text-red-600 font-medium')}>
                            {formatDateTime(d.slaTriagemVenceEm)}
                            {isSlaExpiring(d) && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(d.criadoEm)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {d.status === 'triagem' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                              setClassificarData({ tipoDemanda: d.tipoDemanda, urgencia: d.urgencia, observacao: '' });
                              setShowClassificar(d.id);
                            }}>
                              Classificar
                            </Button>
                          )}
                          {d.status === 'classificada' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                              setRotearData({ setorDestinoId: null, responsavelId: null, observacao: '' });
                              setShowRotear(d.id);
                            }}>
                              Rotear
                            </Button>
                          )}
                          {(d.status === 'roteada' || d.status === 'em_andamento') && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-700" onClick={() => concluirMutation.mutate({ id: d.id, observacao: '' })}>
                              Concluir
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

      {/* Classificar Dialog */}
      <Dialog open={showClassificar !== null} onOpenChange={() => setShowClassificar(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Classificar Demanda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Demanda</Label>
              <Select value={classificarData.tipoDemanda} onValueChange={v => setClassificarData(p => ({ ...p, tipoDemanda: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Urgência</Label>
              <Select value={classificarData.urgencia} onValueChange={v => setClassificarData(p => ({ ...p, urgencia: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea value={classificarData.observacao} onChange={e => setClassificarData(p => ({ ...p, observacao: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClassificar(null)}>Cancelar</Button>
            <Button onClick={() => showClassificar && classificarMutation.mutate({ id: showClassificar, ...classificarData } as any)} disabled={classificarMutation.isPending}>
              {classificarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Classificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotear Dialog */}
      <Dialog open={showRotear !== null} onOpenChange={() => setShowRotear(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rotear Demanda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Responsável</Label>
              <Select value={rotearData.responsavelId?.toString() || '_none'} onValueChange={v => setRotearData(p => ({ ...p, responsavelId: v === '_none' ? null : Number(v) }))}>
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
              <Label>Observação</Label>
              <Textarea value={rotearData.observacao} onChange={e => setRotearData(p => ({ ...p, observacao: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRotear(null)}>Cancelar</Button>
            <Button onClick={() => showRotear && rotearMutation.mutate({ id: showRotear, ...rotearData } as any)} disabled={rotearMutation.isPending}>
              {rotearMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Rotear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
