import { trpc } from '@/lib/trpc';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Users, Search, Loader2, ChevronRight, ArrowLeft, Eye,
  Briefcase, Clock, AlertTriangle, DollarSign, FileBarChart,
  ClipboardList, CheckCircle, XCircle, TrendingUp, Calendar,
  User, Building2, Shield, FileText, Activity, History,
  ArrowUpRight, ArrowDownRight, Timer, Target, Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR');
};

const formatDateTime = (d: string | Date | null | undefined) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const STATUS_COLORS: Record<string, string> = {
  a_fazer: 'bg-slate-100 text-slate-700',
  fazendo: 'bg-blue-100 text-blue-700',
  feito: 'bg-emerald-100 text-emerald-700',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-600',
  vencido: 'bg-red-100 text-red-700',
  no_prazo: 'bg-green-100 text-green-700',
  ativo: 'bg-green-100 text-green-800',
  pausado: 'bg-amber-100 text-amber-800',
  encerrado: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  a_fazer: 'A Fazer',
  fazendo: 'Fazendo',
  feito: 'Feito',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  vencido: 'Em Atraso',
  no_prazo: 'No Prazo',
  ativo: 'Ativo',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
};

const FILA_LABELS: Record<string, string> = {
  apuracao: 'Apuração',
  retificacao: 'Retificação',
  compensacao: 'Compensação',
  ressarcimento: 'Ressarcimento',
  restituicao: 'Restituição',
  revisao: 'Revisão',
  onboarding: 'Onboarding',
};

const ESTRATEGIA_LABELS: Record<string, string> = {
  compensacao: 'Compensação',
  ressarcimento: 'Ressarcimento',
  restituicao: 'Restituição',
  mista: 'Mista',
};

// ============= LIST VIEW =============
function ClientesList({ onSelect }: { onSelect: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const clientesQuery = trpc.creditRecovery.credito.clientes.list.useQuery(
    search ? { search } : undefined
  );

  const clientes = useMemo(() => {
    if (!clientesQuery.data) return [];
    return clientesQuery.data as any[];
  }, [clientesQuery.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Crédito Tributário</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Clientes</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Clientes — Visão 360°</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione um cliente para ver o histórico completo e situação atual no setor de crédito
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, CNPJ ou fantasia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {clientesQuery.isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : clientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum cliente com atividade no setor de crédito</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Cases</TableHead>
                <TableHead className="text-center">Tarefas Ativas</TableHead>
                <TableHead className="text-center">Em Atraso</TableHead>
                <TableHead className="text-right">Valor Estimado</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c: any) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelect(c.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{c.nomeFantasia || c.razaoSocial}</p>
                      <p className="text-xs text-muted-foreground">{c.cnpj}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{c.totalCases || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.tasksAtivas > 0 ? 'default' : 'secondary'}>
                      {c.tasksAtivas || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {(c.tasksEmAtraso || 0) > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {c.tasksEmAtraso}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-green-700 bg-green-50">0</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(c.valorEstimado || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    {(c.tasksEmAtraso || 0) > 0 ? (
                      <Badge className="bg-red-100 text-red-700 gap-1">
                        <AlertTriangle className="w-3 h-3" /> Atenção
                      </Badge>
                    ) : (c.tasksAtivas || 0) > 0 ? (
                      <Badge className="bg-blue-100 text-blue-700 gap-1">
                        <Clock className="w-3 h-3" /> Em andamento
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle className="w-3 h-3" /> OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onSelect(c.id); }}>
                      <Eye className="w-4 h-4 mr-1" /> Ver 360°
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ============= 360° DETAIL VIEW =============
function Cliente360({ clienteId, onBack }: { clienteId: number; onBack: () => void }) {
  const [tab, setTab] = useState('resumo');
  const { data, isLoading } = trpc.creditRecovery.credito.clientes.get360.useQuery({ clienteId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Cliente não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { cliente, cases, tasks, rtis, tickets, ledger, perdcomps, exitos, strategy, auditLog, demands, totals } = data as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para lista
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Clientes</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Visão 360°</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{cliente.nomeFantasia || cliente.razaoSocial}</h1>
          <p className="text-sm text-muted-foreground mt-1">CNPJ: {cliente.cnpj} | {cliente.estado}</p>
        </div>
        {strategy && (
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Estratégia de Monetização</p>
              <Badge className="bg-primary/10 text-primary text-sm">
                {ESTRATEGIA_LABELS[strategy.estrategia] || strategy.estrategia}
              </Badge>
              {strategy.estrategia === 'mista' && (
                <div className="text-xs text-muted-foreground mt-1">
                  Comp: {strategy.compensacaoPct}% | Ress: {strategy.ressarcimentoPct}% | Rest: {strategy.restituicaoPct}%
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={DollarSign} label="Valor Estimado" value={formatCurrency(totals.totalEstimado)} color="text-blue-600 bg-blue-50" />
        <KPICard icon={CheckCircle} label="Valor Validado" value={formatCurrency(totals.totalValidado)} color="text-emerald-600 bg-emerald-50" />
        <KPICard icon={Banknote} label="Valor Efetivado" value={formatCurrency(totals.totalEfetivado)} color="text-green-600 bg-green-50" />
        <KPICard icon={Target} label="Saldo Disponível" value={formatCurrency(totals.saldoDisponivel)} color="text-purple-600 bg-purple-50" />
        <KPICard icon={Activity} label="Tarefas Ativas" value={String(totals.tasksAtivas || 0)} color="text-orange-600 bg-orange-50" />
        <KPICard icon={AlertTriangle} label="Em Atraso" value={String(totals.tasksEmAtraso || 0)} color={totals.tasksEmAtraso > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'} />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="resumo" className="gap-1"><Activity className="w-3.5 h-3.5" /> Resumo</TabsTrigger>
          <TabsTrigger value="cases" className="gap-1"><Briefcase className="w-3.5 h-3.5" /> Cases ({cases?.length || 0})</TabsTrigger>
          <TabsTrigger value="tarefas" className="gap-1"><ClipboardList className="w-3.5 h-3.5" /> Tarefas ({tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="rtis" className="gap-1"><FileBarChart className="w-3.5 h-3.5" /> RTIs ({rtis?.length || 0})</TabsTrigger>
          <TabsTrigger value="creditos" className="gap-1"><DollarSign className="w-3.5 h-3.5" /> Créditos ({ledger?.length || 0})</TabsTrigger>
          <TabsTrigger value="perdcomps" className="gap-1"><FileText className="w-3.5 h-3.5" /> PerdComps ({perdcomps?.length || 0})</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1"><History className="w-3.5 h-3.5" /> Timeline</TabsTrigger>
        </TabsList>

        {/* TAB: Resumo */}
        <TabsContent value="resumo" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dados do Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Razão Social" value={cliente.razaoSocial} />
                <InfoRow label="Nome Fantasia" value={cliente.nomeFantasia || '—'} />
                <InfoRow label="CNPJ" value={cliente.cnpj} />
                <InfoRow label="Regime Tributário" value={cliente.regimeTributario?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} />
                <InfoRow label="Situação Cadastral" value={cliente.situacaoCadastral?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} />
                <InfoRow label="Estado" value={cliente.estado || '—'} />
                <InfoRow label="CNAE" value={`${cliente.cnaePrincipal || '—'} — ${cliente.cnaePrincipalDescricao || ''}`} />
                <InfoRow label="Parceiro" value={cliente.parceiroNome || '—'} />
                <InfoRow label="Procuração" value={cliente.procuracaoHabilitada ? `Sim (${cliente.procuracaoCertificado || ''})` : 'Não'} />
                {cliente.procuracaoValidade && (
                  <InfoRow label="Validade Procuração" value={formatDate(cliente.procuracaoValidade)} />
                )}
              </CardContent>
            </Card>

            {/* O que está sendo feito */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" /> O que está sendo feito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks?.filter((t: any) => ['a_fazer', 'fazendo'].includes(t.status)).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa ativa no momento</p>
                ) : (
                  tasks?.filter((t: any) => ['a_fazer', 'fazendo'].includes(t.status)).slice(0, 8).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-xs', STATUS_COLORS[t.status])}>
                            {STATUS_LABELS[t.status] || t.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {FILA_LABELS[t.fila] || t.fila}
                          </Badge>
                        </div>
                        <p className="font-medium mt-1 truncate">{t.titulo || t.codigo}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {t.responsavelNome && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {t.responsavelNome}
                            </span>
                          )}
                          {t.dataVencimento && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(t.dataVencimento)}
                            </span>
                          )}
                        </div>
                      </div>
                      {t.slaStatus === 'vencido' && (
                        <Badge variant="destructive" className="ml-2 gap-1 text-xs">
                          <AlertTriangle className="w-3 h-3" /> Atraso
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* O que foi feito */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> O que foi feito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks?.filter((t: any) => ['feito', 'concluido'].includes(t.status)).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa concluída</p>
                ) : (
                  tasks?.filter((t: any) => ['feito', 'concluido'].includes(t.status)).slice(0, 6).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-xs', STATUS_COLORS[t.status])}>
                            {STATUS_LABELS[t.status] || t.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {FILA_LABELS[t.fila] || t.fila}
                          </Badge>
                        </div>
                        <p className="font-medium mt-1 truncate">{t.titulo || t.codigo}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {t.responsavelNome && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {t.responsavelNome}
                            </span>
                          )}
                          {t.dataConclusao && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Concluído em {formatDate(t.dataConclusao)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* O que tem a fazer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" /> O que tem a fazer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks?.filter((t: any) => t.status === 'a_fazer').length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente</p>
                ) : (
                  tasks?.filter((t: any) => t.status === 'a_fazer').slice(0, 6).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {FILA_LABELS[t.fila] || t.fila}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{t.codigo}</span>
                        </div>
                        <p className="font-medium mt-1 truncate">{t.titulo || t.codigo}</p>
                        {t.dataVencimento && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Timer className="w-3 h-3" /> Prazo: {formatDate(t.dataVencimento)}
                          </span>
                        )}
                      </div>
                      {t.slaStatus === 'vencido' && (
                        <Badge variant="destructive" className="ml-2 gap-1 text-xs">
                          <AlertTriangle className="w-3 h-3" /> Atraso
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Cases */}
        <TabsContent value="cases" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Valor Estimado</TableHead>
                  <TableHead className="text-right">Valor Contratado</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(cases || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum case encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  (cases || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.numero}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{c.fase}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', STATUS_COLORS[c.status])}>{STATUS_LABELS[c.status] || c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{c.responsavelNome || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(c.valorEstimado)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(c.valorContratado)}</TableCell>
                      <TableCell className="text-sm">{formatDate(c.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB: Tarefas */}
        <TabsContent value="tarefas" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Fila</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma tarefa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  (tasks || []).map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.codigo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{FILA_LABELS[t.fila] || t.fila}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{t.titulo || '—'}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', STATUS_COLORS[t.status])}>{STATUS_LABELS[t.status] || t.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs',
                          t.prioridade === 'urgente' && 'border-red-300 text-red-700',
                          t.prioridade === 'alta' && 'border-orange-300 text-orange-700',
                          t.prioridade === 'media' && 'border-yellow-300 text-yellow-700',
                          t.prioridade === 'baixa' && 'border-blue-300 text-blue-700',
                        )}>
                          {t.prioridade || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{t.responsavelNome || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDate(t.dataVencimento)}</TableCell>
                      <TableCell>
                        {t.slaStatus === 'vencido' ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="w-3 h-3" /> Atraso
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-xs">No prazo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(t.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB: RTIs */}
        <TabsContent value="rtis" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead className="text-right">Valor Estimado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Emitido por</TableHead>
                  <TableHead>Emitido em</TableHead>
                  <TableHead>Devolutiva</TableHead>
                  <TableHead>SLA Devolutiva</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rtis || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum RTI encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  (rtis || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.numero}</TableCell>
                      <TableCell className="text-sm">v{r.versao || 1}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(r.valorTotalEstimado)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', STATUS_COLORS[r.status])}>{STATUS_LABELS[r.status] || r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.emitidoPorNome || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.emitidoEm)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.devolutivaStatus || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(r.slaDevolutivaVenceEm)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB: Créditos */}
        <TabsContent value="creditos" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tese</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Estimado</TableHead>
                  <TableHead className="text-right">Validado</TableHead>
                  <TableHead className="text-right">Efetivado</TableHead>
                  <TableHead className="text-right">Saldo Residual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ledger || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum crédito registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  (ledger || []).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm max-w-[200px] truncate">{l.teseNome || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{l.grupoSigla || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(l.valorEstimado)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(l.valorValidado)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(l.valorEfetivado)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(l.saldoResidual)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', STATUS_COLORS[l.status])}>{STATUS_LABELS[l.status] || l.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(l.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB: PerdComps */}
        <TabsContent value="perdcomps" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº PerdComp</TableHead>
                  <TableHead>Tipo Crédito</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Valor Crédito</TableHead>
                  <TableHead className="text-right">Débitos Compensados</TableHead>
                  <TableHead className="text-right">Saldo Remanescente</TableHead>
                  <TableHead>Guia</TableHead>
                  <TableHead>Transmissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evox?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(perdcomps || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhuma PerdComp registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  (perdcomps || []).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm font-medium">{p.numeroPerdcomp}</TableCell>
                      <TableCell className="text-sm">{p.tipoCredito || '—'}</TableCell>
                      <TableCell className="text-sm">{p.periodoApuracao || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(p.valorCredito)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(p.valorDebitosCompensados)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(p.saldoRemanescente)}</TableCell>
                      <TableCell className="text-sm">{p.guiaNumero || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDate(p.dataTransmissao)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.feitoPelaEvox ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Sim</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Não</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB: Timeline */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" /> Histórico de Atividades (últimas 50)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(auditLog || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro no histórico</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {(auditLog || []).map((log: any, idx: number) => (
                      <div key={log.id || idx} className="relative pl-10">
                        <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{log.entidade}</Badge>
                              <Badge variant="secondary" className="text-xs">{log.acao}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                          </div>
                          <p className="text-sm">{log.descricao || `${log.acao} em ${log.entidade} #${log.entidadeId}`}</p>
                          {log.usuarioNome && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <User className="w-3 h-3" /> {log.usuarioNome}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============= HELPER COMPONENTS =============
function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  );
}

// ============= MAIN COMPONENT =============
export default function CreditoClientes() {
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);

  if (selectedClienteId) {
    return (
      <Cliente360
        clienteId={selectedClienteId}
        onBack={() => setSelectedClienteId(null)}
      />
    );
  }

  return <ClientesList onSelect={setSelectedClienteId} />;
}
