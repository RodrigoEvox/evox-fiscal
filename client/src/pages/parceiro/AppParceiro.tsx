import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Handshake, Plus, Search, Loader2, Building2, FileText, MessageSquare, DollarSign,
  Clock, CheckCircle, AlertTriangle, Send, Eye, TrendingUp, ChevronRight, Inbox,
  ArrowRight, BarChart3, Users, Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEMANDA_STATUS: Record<string, { label: string; color: string }> = {
  nova: { label: 'Nova', color: 'bg-blue-100 text-blue-800' },
  em_triagem: { label: 'Em Triagem', color: 'bg-amber-100 text-amber-800' },
  classificada: { label: 'Classificada', color: 'bg-purple-100 text-purple-800' },
  roteada: { label: 'Roteada', color: 'bg-cyan-100 text-cyan-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-indigo-100 text-indigo-800' },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
};

const TICKET_STATUS: Record<string, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-amber-100 text-amber-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  aguardando_cliente: { label: 'Aguardando Resp.', color: 'bg-purple-100 text-purple-800' },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-800' },
  fechado: { label: 'Fechado', color: 'bg-gray-100 text-gray-600' },
};

export default function AppParceiro() {
  const { user } = useAuth();
  const [tab, setTab] = useState('demandas');
  const [search, setSearch] = useState('');
  const [showNewDemanda, setShowNewDemanda] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);

  // Queries
  const demandas = trpc.creditRecovery.suporte.demandRequests.list.useQuery();
  const tickets = trpc.creditRecovery.credito.tickets.list.useQuery();
  const cases = trpc.creditRecovery.credito.cases.list.useQuery();
  const clientes = trpc.clientes.list.useQuery();
  const exitos = trpc.creditRecovery.credito.exito.list.useQuery();
  const utils = trpc.useUtils();

  // New Demanda form
  const [newDemanda, setNewDemanda] = useState({
    clienteId: null as number | null,
    tipo: 'analise_credito',
    descricao: '',
    prioridade: 'normal',
    tributos: '',
  });

  const createDemandaMutation = trpc.creditRecovery.suporte.demandRequests.create.useMutation({
    onSuccess: () => {
      toast.success('Demanda cadastrada com sucesso!');
      setShowNewDemanda(false);
      setNewDemanda({ clienteId: null, tipo: 'analise_credito', descricao: '', prioridade: 'normal', tributos: '' });
      utils.creditRecovery.suporte.demandRequests.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // New Ticket form
  const [newTicket, setNewTicket] = useState({
    caseId: null as number | null,
    clienteId: null as number | null,
    categoria: 'duvida',
    prioridade: 'normal',
    assunto: '',
    descricao: '',
  });

  const createTicketMutation = trpc.creditRecovery.credito.tickets.create.useMutation({
    onSuccess: () => {
      toast.success('Ticket criado com sucesso!');
      setShowNewTicket(false);
      setNewTicket({ caseId: null, clienteId: null, categoria: 'duvida', prioridade: 'normal', assunto: '', descricao: '' });
      utils.creditRecovery.credito.tickets.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const getClienteName = (id: number | null) => {
    if (!id || !clientes.data) return '—';
    return (clientes.data as any[]).find((c: any) => c.id === id)?.razaoSocial || '—';
  };

  // Stats
  const demandasData = (demandas.data as any[] || []);
  const ticketsData = (tickets.data as any[] || []);
  const casesData = (cases.data as any[] || []);
  const exitosData = (exitos.data as any[] || []);
  const totalRecuperado = exitosData.reduce((sum: number, e: any) => sum + (e.valorRecuperado || 0), 0);
  const totalHonorarios = exitosData.reduce((sum: number, e: any) => sum + (e.valorHonorarios || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Handshake className="w-4 h-4" />
            <span className="text-foreground font-medium">App do Parceiro</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portal do Parceiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie demandas, acompanhe cases e tickets dos seus clientes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewDemanda} onOpenChange={setShowNewDemanda}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nova Demanda</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Demanda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={newDemanda.clienteId?.toString() || '_none'} onValueChange={v => setNewDemanda(p => ({ ...p, clienteId: v === '_none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Selecione...</SelectItem>
                      {(clientes.data as any[] || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.razaoSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={newDemanda.tipo} onValueChange={v => setNewDemanda(p => ({ ...p, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analise_credito">Análise de Crédito</SelectItem>
                        <SelectItem value="revisao_fiscal">Revisão Fiscal</SelectItem>
                        <SelectItem value="compensacao">Compensação</SelectItem>
                        <SelectItem value="consultoria">Consultoria</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={newDemanda.prioridade} onValueChange={v => setNewDemanda(p => ({ ...p, prioridade: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Tributos (separados por vírgula)</Label>
                  <Input value={newDemanda.tributos} onChange={e => setNewDemanda(p => ({ ...p, tributos: e.target.value }))} placeholder="PIS, COFINS, ICMS..." />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={newDemanda.descricao} onChange={e => setNewDemanda(p => ({ ...p, descricao: e.target.value }))} rows={3} placeholder="Descreva a demanda..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDemanda(false)}>Cancelar</Button>
                <Button onClick={() => createDemandaMutation.mutate({ ...newDemanda, origem: 'parceiro' } as any)} disabled={createDemandaMutation.isPending || !newDemanda.clienteId || !newDemanda.descricao}>
                  {createDemandaMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  <Send className="w-4 h-4 mr-2" />Enviar Demanda
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
            <DialogTrigger asChild>
              <Button variant="outline"><MessageSquare className="w-4 h-4 mr-2" />Abrir Ticket</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Abrir Ticket de Suporte</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Case</Label>
                    <Select value={newTicket.caseId?.toString() || '_none'} onValueChange={v => setNewTicket(p => ({ ...p, caseId: v === '_none' ? null : Number(v) }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Nenhum</SelectItem>
                        {casesData.map((c: any) => (
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
                        <SelectItem value="duvida">Dúvida</SelectItem>
                        <SelectItem value="problema">Problema</SelectItem>
                        <SelectItem value="solicitacao">Solicitação</SelectItem>
                        <SelectItem value="reclamacao">Reclamação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={newTicket.prioridade} onValueChange={v => setNewTicket(p => ({ ...p, prioridade: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
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
                <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancelar</Button>
                <Button onClick={() => createTicketMutation.mutate(newTicket as any)} disabled={createTicketMutation.isPending || !newTicket.assunto}>
                  {createTicketMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Criar Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Inbox className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{demandasData.length}</p>
                <p className="text-[10px] text-muted-foreground">Demandas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{casesData.length}</p>
                <p className="text-[10px] text-muted-foreground">Cases Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <MessageSquare className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{ticketsData.filter((t: any) => t.status !== 'fechado').length}</p>
                <p className="text-[10px] text-muted-foreground">Tickets Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Trophy className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalRecuperado)}</p>
                <p className="text-[10px] text-muted-foreground">Recuperado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <DollarSign className="w-4.5 h-4.5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalHonorarios)}</p>
                <p className="text-[10px] text-muted-foreground">Comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="demandas" className="gap-1.5"><Inbox className="w-3.5 h-3.5" />Minhas Demandas</TabsTrigger>
          <TabsTrigger value="cases" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Cases</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Tickets</TabsTrigger>
          <TabsTrigger value="exitos" className="gap-1.5"><Trophy className="w-3.5 h-3.5" />Êxitos</TabsTrigger>
        </TabsList>

        {/* Demandas Tab */}
        <TabsContent value="demandas" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Demandas Cadastradas</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9 w-64 h-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {demandas.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : demandasData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma demanda cadastrada</p>
                  <Button size="sm" className="mt-3" onClick={() => setShowNewDemanda(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" />Cadastrar Primeira Demanda
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criada em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demandasData.filter((d: any) => {
                        if (!search) return true;
                        const q = search.toLowerCase();
                        return d.numero?.toLowerCase().includes(q) || d.descricao?.toLowerCase().includes(q);
                      }).map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono text-xs font-medium">{d.numero}</TableCell>
                          <TableCell className="text-sm">{getClienteName(d.clienteId)}</TableCell>
                          <TableCell className="text-sm capitalize">{d.tipo?.replace(/_/g, ' ')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">{d.prioridade}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px]', DEMANDA_STATUS[d.status]?.color)}>{DEMANDA_STATUS[d.status]?.label}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(d.criadoEm)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cases em Andamento</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cases.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : casesData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum case em andamento</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tese</TableHead>
                        <TableHead>Fase</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor Estimado</TableHead>
                        <TableHead>Atualizado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {casesData.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs font-medium">{c.numero}</TableCell>
                          <TableCell className="text-sm">{getClienteName(c.clienteId)}</TableCell>
                          <TableCell className="text-sm">{c.teseNome || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">{c.fase?.replace(/_/g, ' ')}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px]', c.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>{c.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold text-emerald-600">{formatCurrency(c.valorEstimado)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(c.atualizadoEm)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Meus Tickets</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowNewTicket(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />Novo Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {tickets.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : ticketsData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum ticket</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Número</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketsData.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-mono text-xs font-medium">{t.numero}</TableCell>
                          <TableCell className="text-sm font-medium">{t.assunto}</TableCell>
                          <TableCell className="text-sm capitalize">{t.categoria?.replace(/_/g, ' ')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">{t.prioridade}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px]', TICKET_STATUS[t.status]?.color)}>{TICKET_STATUS[t.status]?.label}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(t.criadoEm)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Êxitos Tab */}
        <TabsContent value="exitos" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Eventos de Êxito</CardTitle>
              <CardDescription>Créditos recuperados e comissões geradas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {exitos.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : exitosData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum evento de êxito registrado</p>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exitosData.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm font-medium">{getClienteName(e.clienteId)}</TableCell>
                          <TableCell className="text-sm">{e.tributo || '—'}</TableCell>
                          <TableCell className="text-sm">{e.competencia || '—'}</TableCell>
                          <TableCell className="text-right text-sm font-bold text-emerald-600">{formatCurrency(e.valorRecuperado)}</TableCell>
                          <TableCell className="text-right text-sm font-medium text-purple-600">{formatCurrency(e.valorHonorarios)}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px]', e.status === 'confirmado' || e.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800')}>{e.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(e.criadoEm)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
