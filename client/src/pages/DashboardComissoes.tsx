import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, Users, TrendingUp, Award, Search, Loader2,
  ArrowUpRight, ArrowDownRight, BarChart3, Trophy, Target,
  CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function DashboardComissoes() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = trpc.comissoesDashboard.consolidated.useQuery();

  const filteredRanking = useMemo(() => {
    if (!data?.ranking) return [];
    if (!searchQuery.trim()) return data.ranking;
    const q = searchQuery.toLowerCase();
    return data.ranking.filter((p: any) => p.nome.toLowerCase().includes(q));
  }, [data?.ranking, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Nenhum dado de comissões disponível.
      </div>
    );
  }

  const summary = (data as any).kpis;
  const ranking = (data as any).ranking;
  const monthlyEvolution = ((data as any).evolucaoMensal || []).map((m: any) => ({ ...m, label: m.month }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" />
          Dashboard de Comissões
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão consolidada de todas as comissões por parceiro com evolução mensal e ranking.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor Total Aprovado</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.valorTotalAprovado)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor Pendente</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.valorTotalPendente)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aprovações</p>
                <p className="text-2xl font-bold mt-1">{summary.totalAprovadas}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{summary.totalPendentes} pendentes</span>
                  <span className="text-xs text-red-500">{summary.totalRejeitadas} rejeitadas</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parceiros Ativos</p>
                <p className="text-2xl font-bold mt-1">{summary.parceirosAtivos}</p>
                <p className="text-xs text-muted-foreground mt-0.5">de {summary.totalParceiros} total</p>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Evolution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolução Mensal de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyEvolution && monthlyEvolution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyEvolution}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                    labelFormatter={(label: string) => `Mês: ${label}`}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="url(#colorValor)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                Nenhum dado de evolução disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Parceiros Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Top Parceiros por Valor Aprovado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking && ranking.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ranking.slice(0, 8).map((p: any) => ({
                      name: p.nome.length > 15 ? p.nome.slice(0, 15) + '...' : p.nome,
                      value: p.valorTotalAprovado,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {ranking.slice(0, 8).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                Nenhum parceiro com comissões aprovadas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Quantidade de Aprovações por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyEvolution && monthlyEvolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number, name: string) => [value, name === 'quantidade' ? 'Aprovações' : name]}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="quantidade" fill="#10b981" radius={[4, 4, 0, 0]} name="Aprovações" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Ranking de Parceiros
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar parceiro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Parceiro</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Modelo</TableHead>
                  <TableHead className="text-center">Clientes</TableHead>
                  <TableHead className="text-center">Serviços</TableHead>
                  <TableHead className="text-center">Aprovadas</TableHead>
                  <TableHead className="text-center">Pendentes</TableHead>
                  <TableHead className="text-right">Valor Aprovado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRanking.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'Nenhum parceiro encontrado' : 'Nenhum parceiro cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRanking.map((p: any, idx: number) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">
                        {idx === 0 ? <span className="text-amber-500 font-bold">🥇</span> :
                         idx === 1 ? <span className="text-gray-400 font-bold">🥈</span> :
                         idx === 2 ? <span className="text-amber-700 font-bold">🥉</span> :
                         <span className="text-muted-foreground">{idx + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {p.tipo === 'pj' ? 'PJ' : 'PF'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={p.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                          {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{p.modelo}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{p.clientesAtivos}</span>
                        <span className="text-xs text-muted-foreground">/{p.totalClientes}</span>
                      </TableCell>
                      <TableCell className="text-center text-sm">{p.servicosAutorizados}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200">
                          {p.aprovadas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.pendentes > 0 ? (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200">
                            {p.pendentes}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {formatCurrency(p.valorTotalAprovado)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
