import { trpc } from '@/lib/trpc';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign, Search, Loader2, ChevronRight, AlertTriangle,
  TrendingUp, FileText, BarChart3, Shield, Banknote,
  ArrowUpRight, ArrowDownRight, Target, Calendar, Clock,
  CheckCircle, XCircle, PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR');
};

const STATUS_COLORS: Record<string, string> = {
  apurado: 'bg-blue-100 text-blue-700',
  revisado: 'bg-indigo-100 text-indigo-700',
  validado: 'bg-emerald-100 text-emerald-700',
  utilizado: 'bg-green-100 text-green-800',
  disponivel: 'bg-purple-100 text-purple-700',
  prescrito: 'bg-red-100 text-red-700',
  transmitido: 'bg-blue-100 text-blue-700',
  homologado: 'bg-green-100 text-green-700',
  rejeitado: 'bg-red-100 text-red-600',
  pendente: 'bg-amber-100 text-amber-700',
  compensado: 'bg-emerald-100 text-emerald-700',
};

export default function CreditoGestaoCreditos() {
  const [search, setSearch] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');

  const clientesQuery = trpc.creditRecovery.credito.clientes.list.useQuery();
  const clientes = useMemo(() => (clientesQuery.data || []) as any[], [clientesQuery.data]);

  const gestaoQuery = trpc.creditRecovery.credito.clientes.gestaoCreditos.useQuery(
    { clienteId: Number(selectedClienteId) },
    { enabled: !!selectedClienteId }
  );

  const gestao = useMemo(() => gestaoQuery.data as any, [gestaoQuery.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Crédito Tributário</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Gestão de Créditos</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Gestão de Créditos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico completo de créditos, PerdComps e alertas de prescrição por cliente
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
          <SelectTrigger className="w-[350px]">
            <SelectValue placeholder="Selecione um cliente..." />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c: any) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nomeFantasia || c.razaoSocial} — {c.cnpj}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClienteId && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tese, PerdComp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {!selectedClienteId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Selecione um cliente para visualizar a gestão de créditos</p>
          </CardContent>
        </Card>
      ) : gestaoQuery.isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !gestao ? (
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum dado de crédito encontrado para este cliente</p>
          </CardContent>
        </Card>
      ) : (
        <GestaoDetail gestao={gestao} search={search} />
      )}
    </div>
  );
}

function GestaoDetail({ gestao, search }: { gestao: any; search: string }) {
  const [tab, setTab] = useState('visao-geral');
  const { totals, ledger, perdcomps, exitos, strategies, prescricaoAlerts } = gestao;

  const filteredLedger = useMemo(() => {
    if (!ledger) return [];
    if (!search) return ledger;
    const s = search.toLowerCase();
    return ledger.filter((l: any) =>
      (l.teseNome || '').toLowerCase().includes(s) ||
      (l.grupoSigla || '').toLowerCase().includes(s)
    );
  }, [ledger, search]);

  const filteredPerdcomps = useMemo(() => {
    if (!perdcomps) return [];
    if (!search) return perdcomps;
    const s = search.toLowerCase();
    return perdcomps.filter((p: any) =>
      (p.numeroPerdcomp || '').toLowerCase().includes(s) ||
      (p.tipoCredito || '').toLowerCase().includes(s)
    );
  }, [perdcomps, search]);

  const t = totals || {};

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          icon={TrendingUp}
          label="Total Apurado"
          value={formatCurrency(t.totalApurado || 0)}
          color="text-blue-600 bg-blue-50"
        />
        <KPICard
          icon={CheckCircle}
          label="Total Validado"
          value={formatCurrency(t.totalValidado || 0)}
          color="text-emerald-600 bg-emerald-50"
        />
        <KPICard
          icon={Banknote}
          label="Total Utilizado"
          value={formatCurrency(t.totalUtilizado || 0)}
          color="text-green-600 bg-green-50"
        />
        <KPICard
          icon={Target}
          label="Saldo Disponível"
          value={formatCurrency(t.saldoDisponivel || 0)}
          color="text-purple-600 bg-purple-50"
        />
        <KPICard
          icon={AlertTriangle}
          label="Risco Prescrição"
          value={String((prescricaoAlerts || []).length)}
          color={(prescricaoAlerts || []).length > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}
        />
      </div>

      {/* Prescrição Alerts */}
      {(prescricaoAlerts || []).length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" /> Alertas de Prescrição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prescricaoAlerts.map((alert: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-red-50 text-sm">
                <div>
                  <p className="font-medium text-red-800">{alert.teseNome || 'Crédito'}</p>
                  <p className="text-xs text-red-600">
                    Valor: {formatCurrency(alert.valor)} | Vence em: {formatDate(alert.dataLimite)}
                  </p>
                </div>
                <Badge variant="destructive" className="gap-1">
                  <Clock className="w-3 h-3" /> {alert.diasRestantes} dias
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="visao-geral" className="gap-1"><PieChart className="w-3.5 h-3.5" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="ledger" className="gap-1"><DollarSign className="w-3.5 h-3.5" /> Créditos ({filteredLedger.length})</TabsTrigger>
          <TabsTrigger value="perdcomps" className="gap-1"><FileText className="w-3.5 h-3.5" /> PerdComps ({filteredPerdcomps.length})</TabsTrigger>
          <TabsTrigger value="exitos" className="gap-1"><CheckCircle className="w-3.5 h-3.5" /> Êxitos ({(exitos || []).length})</TabsTrigger>
        </TabsList>

        {/* TAB: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Saldo por Tese */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Saldo por Tese
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(ledger || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum crédito registrado</p>
                ) : (
                  <div className="space-y-3">
                    {groupByTese(ledger).map((group: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate max-w-[60%]">{group.tese}</span>
                          <span className="font-mono text-xs">{formatCurrency(group.saldo)}</span>
                        </div>
                        <Progress
                          value={group.total > 0 ? (group.saldo / group.total) * 100 : 0}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Apurado: {formatCurrency(group.total)}</span>
                          <span>Utilizado: {formatCurrency(group.total - group.saldo)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saldo por Grupo de Débitos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Saldo por Grupo de Débitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(ledger || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum crédito registrado</p>
                ) : (
                  <div className="space-y-3">
                    {groupByGrupo(ledger).map((group: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{group.grupo || 'Sem grupo'}</span>
                          <span className="font-mono text-xs">{formatCurrency(group.saldo)}</span>
                        </div>
                        <Progress
                          value={group.total > 0 ? (group.saldo / group.total) * 100 : 0}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Apurado: {formatCurrency(group.total)}</span>
                          <span>Utilizado: {formatCurrency(group.total - group.saldo)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estratégia */}
            {(strategies || []).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" /> Estratégia de Monetização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {strategies.map((s: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50">
                      <Badge className="bg-primary/10 text-primary mb-2">
                        {s.estrategia === 'compensacao' ? 'Compensação' :
                         s.estrategia === 'ressarcimento' ? 'Ressarcimento' :
                         s.estrategia === 'restituicao' ? 'Restituição' :
                         s.estrategia === 'mista' ? 'Mista' : s.estrategia}
                      </Badge>
                      {s.estrategia === 'mista' && (
                        <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Compensação</p>
                            <p className="font-bold">{s.compensacaoPct}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ressarcimento</p>
                            <p className="font-bold">{s.ressarcimentoPct}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Restituição</p>
                            <p className="font-bold">{s.restituicaoPct}%</p>
                          </div>
                        </div>
                      )}
                      {s.observacoes && (
                        <p className="text-xs text-muted-foreground mt-2">{s.observacoes}</p>
                      )}
                      {s.definidoPorNome && (
                        <p className="text-xs text-muted-foreground mt-1">Definido por: {s.definidoPorNome}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Resumo PerdComps */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Resumo PerdComps
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(perdcomps || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma PerdComp registrada</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total de PerdComps</span>
                      <span className="font-bold">{perdcomps.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Total Créditos</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(perdcomps.reduce((s: number, p: any) => s + Number(p.valorCredito || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Débitos Compensados</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(perdcomps.reduce((s: number, p: any) => s + Number(p.valorDebitosCompensados || 0), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Feitas pela Evox</span>
                      <span className="font-bold">{perdcomps.filter((p: any) => p.feitoPelaEvox).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Homologadas</span>
                      <span className="font-bold text-green-700">{perdcomps.filter((p: any) => p.status === 'homologado').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pendentes</span>
                      <span className="font-bold text-amber-700">{perdcomps.filter((p: any) => !['homologado', 'rejeitado'].includes(p.status)).length}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Créditos (Ledger) */}
        <TabsContent value="ledger" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tese</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Estimado</TableHead>
                  <TableHead className="text-right">Validado</TableHead>
                  <TableHead className="text-right">Efetivado</TableHead>
                  <TableHead className="text-right">Saldo Residual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum crédito encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLedger.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm max-w-[180px] truncate">{l.teseNome || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{l.grupoSigla || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{l.tipo || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(l.valorEstimado)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(l.valorValidado)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(l.valorEfetivado)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(l.saldoResidual)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', STATUS_COLORS[l.status] || 'bg-gray-100 text-gray-700')}>
                          {l.status || '—'}
                        </Badge>
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
                  <TableHead>Venc. Guia</TableHead>
                  <TableHead>Transmissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evox?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerdcomps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhuma PerdComp encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPerdcomps.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm font-medium">{p.numeroPerdcomp}</TableCell>
                      <TableCell className="text-sm">{p.tipoCredito || '—'}</TableCell>
                      <TableCell className="text-sm">{p.periodoApuracao || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(p.valorCredito)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(p.valorDebitosCompensados)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(p.saldoRemanescente)}</TableCell>
                      <TableCell className="text-sm">{p.guiaNumero || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDate(p.dataVencimentoGuia)}</TableCell>
                      <TableCell className="text-sm">{formatDate(p.dataTransmissao)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700')}>
                          {p.status}
                        </Badge>
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

        {/* TAB: Êxitos */}
        <TabsContent value="exitos" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(exitos || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum êxito registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  (exitos || []).map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{e.tipo || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">{e.descricao || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(e.valor)}</TableCell>
                      <TableCell className="text-sm">{e.registradoPorNome || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDate(e.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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

function groupByTese(ledger: any[]): { tese: string; total: number; saldo: number }[] {
  const map = new Map<string, { total: number; saldo: number }>();
  for (const l of ledger) {
    const key = l.teseNome || 'Sem tese';
    const cur = map.get(key) || { total: 0, saldo: 0 };
    cur.total += Number(l.valorEstimado || 0);
    cur.saldo += Number(l.saldoResidual || 0);
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([tese, v]) => ({ tese, ...v }))
    .sort((a, b) => b.saldo - a.saldo);
}

function groupByGrupo(ledger: any[]): { grupo: string; total: number; saldo: number }[] {
  const map = new Map<string, { total: number; saldo: number }>();
  for (const l of ledger) {
    const key = l.grupoSigla || 'Sem grupo';
    const cur = map.get(key) || { total: 0, saldo: 0 };
    cur.total += Number(l.valorEstimado || 0);
    cur.saldo += Number(l.saldoResidual || 0);
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([grupo, v]) => ({ grupo, ...v }))
    .sort((a, b) => b.saldo - a.saldo);
}
