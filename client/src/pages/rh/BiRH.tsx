import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Users, TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle,
  Target, Activity, BarChart3, PieChart as PieChartIcon, Download,
} from "lucide-react";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#a855f7"];

const STATUS_LABELS: Record<string, string> = {
  ativo: "Ativo", inativo: "Inativo", afastado: "Afastado", licenca: "Licença",
  atestado: "Atestado", desligado: "Desligado", ferias: "Férias",
  experiencia: "Experiência", aviso_previo: "Aviso Prévio",
};

const NIVEL_LABELS: Record<string, string> = {
  estagiario: "Estagiário", auxiliar: "Auxiliar", assistente: "Assistente",
  analista_jr: "Analista Jr", analista_pl: "Analista Pl", analista_sr: "Analista Sr",
  coordenador: "Coordenador", supervisor: "Supervisor", gerente: "Gerente", diretor: "Diretor",
};

export default function BiRH() {
  const [periodo, setPeriodo] = useState("12");
  const [tab, setTab] = useState("visao-geral");

  const { data: dashboard, isLoading } = trpc.relatoriosRH.dashboard.useQuery();
  const { data: colabs } = trpc.colaboradores.list.useQuery();
  const { data: metas } = trpc.metasIndividuais.list.useQuery({});
  const { data: ciclos } = trpc.ciclosAvaliacao.list.useQuery();

  const metricas = useMemo(() => {
    if (!dashboard) return null;
    const d = dashboard as any;
    const totalColabs = d.totalAtivos + d.totalInativos;
    const taxaTurnover = totalColabs > 0
      ? ((d.turnoverMensal || []).reduce((s: number, m: any) => s + m.desligamentos, 0) / totalColabs * 100).toFixed(1)
      : "0.0";
    const totalAbsenteismo = (d.absenteismoMensal || []).reduce((s: number, m: any) => s + m.diasAfastamento, 0);
    const custoMedio = d.totalAtivos > 0 ? (d.custoSalarialTotal / d.totalAtivos) : 0;

    return { totalColabs, taxaTurnover, totalAbsenteismo, custoMedio };
  }, [dashboard]);

  // Dados de evolução temporal
  const evolucaoTurnover = useMemo(() => {
    if (!dashboard) return [];
    const d = dashboard as any;
    const meses = parseInt(periodo);
    return (d.turnoverMensal || []).slice(-meses).map((m: any) => ({
      mes: m.mes,
      mesLabel: new Date(m.mes + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      admissoes: m.admissoes,
      desligamentos: m.desligamentos,
      saldo: m.admissoes - m.desligamentos,
    }));
  }, [dashboard, periodo]);

  const evolucaoAbsenteismo = useMemo(() => {
    if (!dashboard) return [];
    const d = dashboard as any;
    const meses = parseInt(periodo);
    return (d.absenteismoMensal || []).slice(-meses).map((m: any) => ({
      mes: m.mes,
      mesLabel: new Date(m.mes + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      atestados: m.atestados,
      diasAfastamento: m.diasAfastamento,
    }));
  }, [dashboard, periodo]);

  // Custo salarial por setor
  const custoSetorData = useMemo(() => {
    if (!dashboard) return [];
    const d = dashboard as any;
    return Object.entries(d.custoPorSetor || {}).map(([setor, valor]) => ({
      setor: setor.length > 15 ? setor.substring(0, 15) + "…" : setor,
      setorFull: setor,
      valor: Number(valor),
    })).sort((a, b) => b.valor - a.valor);
  }, [dashboard]);

  // Headcount por setor
  const headcountSetorData = useMemo(() => {
    if (!dashboard) return [];
    const d = dashboard as any;
    return Object.entries(d.headcountPorSetor || {}).map(([setor, count]) => ({
      setor: setor.length > 15 ? setor.substring(0, 15) + "…" : setor,
      setorFull: setor,
      quantidade: Number(count),
    })).sort((a, b) => b.quantidade - a.quantidade);
  }, [dashboard]);

  // Status distribution
  const statusData = useMemo(() => {
    if (!colabs) return [];
    const counts: Record<string, number> = {};
    (colabs as any[]).forEach((c: any) => {
      const st = c.statusColaborador || "ativo";
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
    })).filter(d => d.value > 0);
  }, [colabs]);

  // Nível hierárquico distribution
  const nivelData = useMemo(() => {
    if (!colabs) return [];
    const counts: Record<string, number> = {};
    (colabs as any[]).forEach((c: any) => {
      if (c.statusColaborador === "ativo" || c.statusColaborador === "experiencia") {
        const nivel = c.nivelHierarquico || "nao_definido";
        counts[nivel] = (counts[nivel] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([nivel, count]) => ({
      name: NIVEL_LABELS[nivel] || nivel,
      value: count,
    })).filter(d => d.value > 0);
  }, [colabs]);

  // Metas progress
  const metasResumo = useMemo(() => {
    if (!metas) return { total: 0, concluidas: 0, emAndamento: 0, atrasadas: 0, taxa: 0 };
    const all = metas as any[];
    const total = all.length;
    const concluidas = all.filter(m => m.status === "concluida").length;
    const emAndamento = all.filter(m => m.status === "em_andamento").length;
    const atrasadas = all.filter(m => {
      if (m.status === "concluida" || m.status === "cancelada") return false;
      if (m.prazo) return new Date(m.prazo) < new Date();
      return false;
    }).length;
    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    return { total, concluidas, emAndamento, atrasadas, taxa };
  }, [metas]);

  // Radar chart - performance indicators
  const radarData = useMemo(() => {
    if (!metricas || !metasResumo) return [];
    return [
      { indicador: "Headcount", valor: Math.min(100, (metricas.totalColabs / 200) * 100), fullMark: 100 },
      { indicador: "Retenção", valor: Math.max(0, 100 - parseFloat(String(metricas.taxaTurnover))), fullMark: 100 },
      { indicador: "Presença", valor: Math.max(0, 100 - (metricas.totalAbsenteismo / 30)), fullMark: 100 },
      { indicador: "Metas", valor: metasResumo.taxa, fullMark: 100 },
      { indicador: "Engajamento", valor: Math.min(100, metasResumo.emAndamento > 0 ? 75 : 50), fullMark: 100 },
    ];
  }, [metricas, metasResumo]);

  // Custo x Headcount combined
  const custoHeadcountCombo = useMemo(() => {
    if (!dashboard) return [];
    const d = dashboard as any;
    const setores = new Set([
      ...Object.keys(d.headcountPorSetor || {}),
      ...Object.keys(d.custoPorSetor || {}),
    ]);
    return Array.from(setores).map(setor => ({
      setor: setor.length > 12 ? setor.substring(0, 12) + "…" : setor,
      headcount: (d.headcountPorSetor || {})[setor] || 0,
      custo: ((d.custoPorSetor || {})[setor] || 0) / 1000,
    })).sort((a, b) => b.headcount - a.headcount).slice(0, 10);
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            BI — Indicadores de RH
          </h1>
          <p className="text-muted-foreground mt-1">Painel consolidado com cruzamento de dados de turnover, absenteísmo, custo salarial e metas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Colaboradores Ativos</p>
                <p className="text-2xl font-bold mt-1">{metricas?.totalColabs || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Taxa Turnover</p>
                <p className="text-2xl font-bold mt-1">{metricas?.taxaTurnover}%</p>
              </div>
              <TrendingDown className="w-8 h-8 text-amber-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Dias Absenteísmo</p>
                <p className="text-2xl font-bold mt-1">{metricas?.totalAbsenteismo || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Custo Médio/Colab</p>
                <p className="text-2xl font-bold mt-1">
                  {(metricas?.custoMedio || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="turnover">Turnover</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="metas">Metas & KPIs</TabsTrigger>
        </TabsList>

        {/* VISÃO GERAL */}
        <TabsContent value="visao-geral" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Radar de Performance RH
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Performance" dataKey="valor" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Headcount por Setor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Headcount por Setor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={headcountSetorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="setor" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [v, "Colaboradores"]} />
                    <Bar dataKey="quantidade" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por Nível */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Distribuição por Nível Hierárquico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={nivelData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {nivelData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TURNOVER */}
        <TabsContent value="turnover" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Turnover Mensal */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Evolução de Turnover — Admissões vs Desligamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={evolucaoTurnover}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="admissoes" name="Admissões" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="desligamentos" name="Desligamentos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Absenteísmo */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Evolução de Absenteísmo — Atestados e Dias de Afastamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={evolucaoAbsenteismo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="diasAfastamento" name="Dias Afastamento" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="atestados" name="Qtd Atestados" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CUSTOS */}
        <TabsContent value="custos" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custo por Setor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Custo Salarial por Setor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={custoSetorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="setor" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "Custo"]} />
                    <Bar dataKey="valor" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Custo x Headcount Combo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Custo (R$ mil) x Headcount por Setor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={custoHeadcountCombo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="setor" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="headcount" name="Headcount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="custo" name="Custo (R$ mil)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resumo de Custos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Resumo de Custos Salariais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Custo Total Mensal</p>
                    <p className="text-xl font-bold mt-1">
                      {((dashboard as any)?.custoSalarialTotal || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Custo Anual Estimado</p>
                    <p className="text-xl font-bold mt-1">
                      {(((dashboard as any)?.custoSalarialTotal || 0) * 12).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Custo Médio/Colaborador</p>
                    <p className="text-xl font-bold mt-1">
                      {(metricas?.custoMedio || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Setores Ativos</p>
                    <p className="text-xl font-bold mt-1">{headcountSetorData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* METAS & KPIs */}
        <TabsContent value="metas" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase">Total de Metas</p>
                <p className="text-2xl font-bold mt-1">{metasResumo.total}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase">Concluídas</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{metasResumo.concluidas}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase">Em Andamento</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{metasResumo.emAndamento}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase">Atrasadas</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{metasResumo.atrasadas}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Taxa de Conclusão */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Taxa de Conclusão de Metas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-primary" strokeWidth="8"
                      strokeDasharray={`${metasResumo.taxa * 2.51} 251`} strokeLinecap="round"
                      transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{metasResumo.taxa}%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {metasResumo.concluidas} de {metasResumo.total} metas concluídas
                </p>
              </CardContent>
            </Card>

            {/* Ciclos de Avaliação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Ciclos de Avaliação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ciclos && (ciclos as any[]).length > 0 ? (
                  <div className="space-y-3">
                    {(ciclos as any[]).slice(0, 6).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{c.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.dataInicio} — {c.dataFim}
                          </p>
                        </div>
                        <Badge variant={c.status === "em_andamento" ? "default" : c.status === "concluido" ? "secondary" : "outline"}>
                          {c.status === "em_andamento" ? "Em Andamento" : c.status === "concluido" ? "Concluído" : c.status === "rascunho" ? "Rascunho" : c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum ciclo de avaliação cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
