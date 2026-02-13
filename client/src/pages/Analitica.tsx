/*
 * Visão Analítica — Evox Fiscal
 * Análise por período com métricas de teses, empresas, status, analistas
 */

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Users, BookOpen, Target, TrendingUp, Clock, BarChart3,
  FileSpreadsheet, FileText, Building2, User, CheckCircle2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['#0A2540', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'];

function formatDuration(ms: number): string {
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${totalHours}h ${minutes}m`;
}

export default function Analitica() {
  const { state } = useApp();

  // Period filter
  const now = new Date();
  const [periodoTipo, setPeriodoTipo] = useState<'mes' | 'trimestre' | 'semestre' | 'ano' | 'custom'>('mes');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  });

  const handlePeriodoChange = (tipo: string) => {
    setPeriodoTipo(tipo as any);
    const today = new Date();
    let start: Date;
    let end: Date;
    switch (tipo) {
      case 'mes':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'trimestre':
        const q = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), q * 3, 1);
        end = new Date(today.getFullYear(), q * 3 + 3, 0);
        break;
      case 'semestre':
        const s = today.getMonth() < 6 ? 0 : 6;
        start = new Date(today.getFullYear(), s, 1);
        end = new Date(today.getFullYear(), s + 6, 0);
        break;
      case 'ano':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        return;
    }
    setDataInicio(start.toISOString().split('T')[0]);
    setDataFim(end.toISOString().split('T')[0]);
  };

  // Filter data by period
  const periodoStart = new Date(dataInicio).getTime();
  const periodoEnd = new Date(dataFim + 'T23:59:59').getTime();

  const clientesNoPeriodo = useMemo(() =>
    state.clientes.filter(c => {
      const d = new Date(c.dataCadastro).getTime();
      return d >= periodoStart && d <= periodoEnd;
    }),
    [state.clientes, periodoStart, periodoEnd]
  );

  const relatoriosNoPeriodo = useMemo(() =>
    state.relatorios.filter(r => {
      const d = new Date(r.dataAnalise).getTime();
      return d >= periodoStart && d <= periodoEnd;
    }),
    [state.relatorios, periodoStart, periodoEnd]
  );

  const filaNoPeriodo = useMemo(() =>
    state.filaApuracao.filter(f => {
      const d = new Date(f.dataInsercao).getTime();
      return d >= periodoStart && d <= periodoEnd;
    }),
    [state.filaApuracao, periodoStart, periodoEnd]
  );

  const filaConcluida = useMemo(() =>
    state.filaApuracao.filter(f => {
      if (f.status !== 'concluido' || !f.dataConclusao) return false;
      const d = new Date(f.dataConclusao).getTime();
      return d >= periodoStart && d <= periodoEnd;
    }),
    [state.filaApuracao, periodoStart, periodoEnd]
  );

  // Stats
  const totalNovasEmpresas = clientesNoPeriodo.length;
  const totalAnalises = relatoriosNoPeriodo.length;
  const totalConcluidas = filaConcluida.length;
  const totalNaFila = filaNoPeriodo.length;

  // By status
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    state.statusApuracaoList.forEach(s => { map[s] = 0; });
    state.filaApuracao.forEach(f => {
      map[f.status] = (map[f.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value }));
  }, [state.filaApuracao, state.statusApuracaoList]);

  // By analyst
  const byAnalista = useMemo(() => {
    const map: Record<string, { nome: string; concluidas: number; emAndamento: number; tempoTotalMs: number }> = {};
    state.filaApuracao.forEach(f => {
      if (!f.analistaNome) return;
      if (!map[f.analistaNome]) map[f.analistaNome] = { nome: f.analistaNome, concluidas: 0, emAndamento: 0, tempoTotalMs: 0 };
      if (f.status === 'concluido') {
        map[f.analistaNome].concluidas++;
        map[f.analistaNome].tempoTotalMs += f.tempoGastoMs || 0;
      } else if (f.status === 'fazendo') {
        map[f.analistaNome].emAndamento++;
      }
    });
    return Object.values(map);
  }, [state.filaApuracao]);

  // By priority
  const byPrioridade = [
    { name: 'Alta', value: state.clientes.filter(c => c.prioridade === 'alta').length, color: '#10B981' },
    { name: 'Média', value: state.clientes.filter(c => c.prioridade === 'media').length, color: '#F59E0B' },
    { name: 'Baixa', value: state.clientes.filter(c => c.prioridade === 'baixa').length, color: '#EF4444' },
  ];

  // By regime
  const byRegime = [
    { name: 'Lucro Real', value: state.clientes.filter(c => c.regimeTributario === 'lucro_real').length },
    { name: 'Lucro Presumido', value: state.clientes.filter(c => c.regimeTributario === 'lucro_presumido').length },
    { name: 'Simples Nacional', value: state.clientes.filter(c => c.regimeTributario === 'simples_nacional').length },
  ];

  // By tese classification
  const byTese = [
    { name: 'Pacificada', value: state.teses.filter(t => t.classificacao === 'pacificada' && t.ativa).length },
    { name: 'Judicial', value: state.teses.filter(t => t.classificacao === 'judicial' && t.ativa).length },
    { name: 'Administrativa', value: state.teses.filter(t => t.classificacao === 'administrativa' && t.ativa).length },
    { name: 'Controversa', value: state.teses.filter(t => t.classificacao === 'controversa' && t.ativa).length },
  ];

  // By parceiro
  const byParceiro = useMemo(() => {
    const map: Record<string, { nome: string; clientes: number }> = {};
    state.clientes.forEach(c => {
      const nome = c.parceiroId ? (state.parceiros.find(p => p.id === c.parceiroId)?.nomeCompleto || 'Desconhecido') : 'Sem parceiro';
      if (!map[nome]) map[nome] = { nome, clientes: 0 };
      map[nome].clientes++;
    });
    return Object.values(map).sort((a, b) => b.clientes - a.clientes);
  }, [state.clientes, state.parceiros]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: { month: string; empresas: number; analises: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthStr = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const empresas = state.clientes.filter(c => {
        const cd = new Date(c.dataCadastro);
        return cd >= d && cd <= monthEnd;
      }).length;
      const analises = state.relatorios.filter(r => {
        const rd = new Date(r.dataAnalise);
        return rd >= d && rd <= monthEnd;
      }).length;
      months.push({ month: monthStr, empresas, analises });
    }
    return months;
  }, [state.clientes, state.relatorios, now]);

  // Tese potential ranking
  const teseRanking = useMemo(() => {
    const potOrder: Record<string, number> = { muito_alto: 4, alto: 3, medio: 2, baixo: 1 };
    return [...state.teses]
      .filter(t => t.ativa)
      .sort((a, b) => (potOrder[b.potencialFinanceiro] || 0) - (potOrder[a.potencialFinanceiro] || 0))
      .slice(0, 8);
  }, [state.teses]);

  const tooltipStyle = { background: '#0A2540', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Analítica</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise por período com métricas detalhadas</p>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <Label className="text-xs mb-1 block">Período</Label>
              <Select value={periodoTipo} onValueChange={handlePeriodoChange}>
                <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Mês Atual</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                  <SelectItem value="ano">Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">De</Label>
              <Input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPeriodoTipo('custom'); }} className="h-9 text-sm w-40" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Até</Label>
              <Input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPeriodoTipo('custom'); }} className="h-9 text-sm w-40" />
            </div>
            <Badge variant="outline" className="h-9 px-3 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(dataInicio).toLocaleDateString('pt-BR')} — {new Date(dataFim).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0A2540]">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0A2540]/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#0A2540]" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Novas Empresas</p>
                <p className="text-2xl font-bold font-data">{totalNovasEmpresas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Análises Realizadas</p>
                <p className="text-2xl font-bold font-data">{totalAnalises}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Apurações Concluídas</p>
                <p className="text-2xl font-bold font-data">{totalConcluidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Na Fila (Período)</p>
                <p className="text-2xl font-bold font-data">{totalNaFila}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="analistas">Por Analista</TabsTrigger>
          <TabsTrigger value="teses">Por Tese</TabsTrigger>
          <TabsTrigger value="parceiros">Por Parceiro</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="geral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Tendência Mensal (Últimos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="empresas" name="Empresas" stroke="#0A2540" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="analises" name="Análises" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" /> Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={byStatus} barSize={40}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Quantidade" fill="#0A2540" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" /> Clientes por Prioridade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={byPrioridade} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                        {byPrioridade.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {byPrioridade.map(item => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                        <span className="text-sm font-bold font-data">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regime Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Clientes por Regime Tributário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byRegime} barSize={50} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={120} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Quantidade" fill="#0A2540" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Por Analista */}
        <TabsContent value="analistas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" /> Desempenho por Analista
                </CardTitle>
              </CardHeader>
              <CardContent>
                {byAnalista.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum analista com apurações atribuídas.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={byAnalista} barSize={30}>
                      <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="concluidas" name="Concluídas" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="emAndamento" name="Em Andamento" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Tempo Médio por Analista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {byAnalista.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Sem dados de tempo disponíveis.</p>
                  ) : (
                    byAnalista.map(a => {
                      const tempoMedio = a.concluidas > 0 ? a.tempoTotalMs / a.concluidas : 0;
                      return (
                        <div key={a.nome} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0A2540]/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-[#0A2540]" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{a.nome}</p>
                              <p className="text-[11px] text-muted-foreground">{a.concluidas} concluída(s) • {a.emAndamento} em andamento</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Tempo médio</p>
                            <p className="text-sm font-bold font-data">{tempoMedio > 0 ? formatDuration(tempoMedio) : '—'}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Por Tese */}
        <TabsContent value="teses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Classificação das Teses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={byTese} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                        {byTese.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {byTese.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                        <span className="text-sm font-bold font-data">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Ranking de Potencial Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teseRanking.map((tese, idx) => (
                    <div key={tese.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-data text-muted-foreground w-5 text-center">#{idx + 1}</span>
                        <div>
                          <p className="text-xs font-semibold">{tese.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{tese.tributoEnvolvido}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          tese.potencialFinanceiro === 'muito_alto' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' :
                          tese.potencialFinanceiro === 'alto' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
                          tese.potencialFinanceiro === 'medio' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
                          'bg-red-500/10 text-red-700 border-red-200'
                        }>
                          {tese.potencialFinanceiro.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">{tese.classificacao}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Por Parceiro */}
        <TabsContent value="parceiros" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" /> Clientes por Parceiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={byParceiro} barSize={30} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: '#6B7280' }} width={160} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="clientes" name="Clientes" fill="#0A2540" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" /> Detalhamento por Parceiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {byParceiro.map((p, idx) => (
                    <div key={p.nome} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS[idx % COLORS.length]}15` }}>
                          <Users className="w-4 h-4" style={{ color: COLORS[idx % COLORS.length] }} />
                        </div>
                        <span className="text-sm font-medium">{p.nome}</span>
                      </div>
                      <Badge variant="outline" className="font-data">{p.clientes} cliente{p.clientes !== 1 ? 's' : ''}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
