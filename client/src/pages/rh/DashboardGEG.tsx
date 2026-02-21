import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Legend,
} from "recharts";
import {
  Users, UserCheck, UserX, UserMinus, Briefcase, TrendingDown, TrendingUp,
  DollarSign, Cake, PartyPopper, CalendarClock, FileWarning, CheckCircle,
  AlertTriangle, ArrowRight, Loader2, Activity, Clock, User, Shield,
  ArrowUpCircle, ArrowDownCircle, Bus, Dumbbell, Gift,
} from "lucide-react";
import { CardDescription } from "@/components/ui/card";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#14b8a6"];

const STATUS_LABELS: Record<string, string> = {
  ativo: "Ativo", inativo: "Inativo", afastado: "Afastado", licenca: "Licença",
  atestado: "Atestado", desligado: "Desligado", ferias: "Férias",
  experiencia: "Experiência", aviso_previo: "Aviso Prévio",
};

const STATUS_ICONS: Record<string, any> = {
  ativo: UserCheck, inativo: UserX, afastado: UserMinus, licenca: Shield,
  atestado: AlertTriangle, desligado: UserX, ferias: Cake,
  experiencia: Clock, aviso_previo: FileWarning,
};

const STATUS_COLORS: Record<string, string> = {
  ativo: "text-green-600 bg-green-50", inativo: "text-gray-600 bg-gray-50",
  afastado: "text-orange-600 bg-orange-50", licenca: "text-blue-600 bg-blue-50",
  atestado: "text-red-600 bg-red-50", desligado: "text-gray-500 bg-gray-100",
  ferias: "text-cyan-600 bg-cyan-50", experiencia: "text-purple-600 bg-purple-50",
  aviso_previo: "text-amber-600 bg-amber-50",
};

function formatHoras(h: number | string) {
  const num = Number(h);
  const hrs = Math.floor(Math.abs(num));
  const mins = Math.round((Math.abs(num) - hrs) * 60);
  const sign = num < 0 ? "-" : "";
  return `${sign}${hrs}h${mins > 0 ? mins.toString().padStart(2, "0") + "min" : ""}`;
}

export default function DashboardGEG() {
  const [, setLocation] = useLocation();
  const { data: dashboard, isLoading: loadingDash } = trpc.relatoriosRH.dashboard.useQuery();
  const { data: colabs, isLoading: loadingColabs } = trpc.colaboradores.list.useQuery();
  const { data: aniversariantes } = trpc.aniversariantes.mes.useQuery();
  const { data: contratosVencendo } = trpc.contratosVencendo.list.useQuery({ diasAntecedencia: 30 });
  const { data: saldosBH } = trpc.bancoHoras.saldos.useQuery();
  const { data: dashGEG } = trpc.dashboardGEG.get.useQuery({});

  const hoje = useMemo(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const mesAtual = new Date().getMonth() + 1;

  const aniversariantesHoje = useMemo(() => {
    if (!aniversariantes) return [];
    return aniversariantes.filter((a: any) => {
      if (!a.dataNascimento) return false;
      return a.dataNascimento.substring(5) === hoje;
    });
  }, [aniversariantes, hoje]);

  // Status distribution
  const statusData = useMemo(() => {
    if (!colabs) return [];
    const counts: Record<string, number> = {};
    (colabs as any[]).forEach((c: any) => {
      const st = c.statusColaborador || "ativo";
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count, key: status }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [colabs]);

  // Headcount por setor
  const headcountSetor = useMemo(() => {
    if (!dashboard) return [];
    const d = dashboard as any;
    return Object.entries(d.headcountPorSetor || {})
      .map(([setor, count]) => ({ setor: setor.length > 18 ? setor.substring(0, 18) + "…" : setor, quantidade: Number(count) }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [dashboard]);

  // Turnover últimos 6 meses
  const turnoverData = useMemo(() => {
    if (!dashboard) return [];
    const d = dashboard as any;
    return (d.turnoverMensal || []).slice(-6).map((m: any) => ({
      mesLabel: new Date(m.mes + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      admissoes: m.admissoes,
      desligamentos: m.desligamentos,
    }));
  }, [dashboard]);

  // KPI metrics
  const metricas = useMemo(() => {
    if (!dashboard) return null;
    const d = dashboard as any;
    const totalColabs = d.totalAtivos + d.totalInativos;
    const taxaTurnover = totalColabs > 0
      ? ((d.turnoverMensal || []).reduce((s: number, m: any) => s + m.desligamentos, 0) / totalColabs * 100).toFixed(1)
      : "0.0";
    const totalAbsenteismo = (d.absenteismoMensal || []).reduce((s: number, m: any) => s + m.diasAfastamento, 0);
    return {
      totalAtivos: d.totalAtivos,
      totalInativos: d.totalInativos,
      totalColabs,
      taxaTurnover,
      totalAbsenteismo,
      custoSalarial: d.custoSalarialTotal || 0,
    };
  }, [dashboard]);

  // Banco de Horas summary
  const bancoHorasResumo = useMemo(() => {
    if (!saldosBH || !Array.isArray(saldosBH)) return null;
    const list = saldosBH as any[];
    const totalExtras = list.reduce((acc, s) => acc + (s.extras || 0), 0);
    const totalCompensacoes = list.reduce((acc, s) => acc + (s.compensacoes || 0), 0);
    const saldoGeral = totalExtras - totalCompensacoes;
    const negativos = list.filter(s => s.saldo < 0).sort((a, b) => a.saldo - b.saldo);
    const positivos = list.filter(s => s.saldo > 0).sort((a, b) => b.saldo - a.saldo);
    return { totalExtras, totalCompensacoes, saldoGeral, negativos, positivos, total: list.length };
  }, [saldosBH]);

  if (loadingDash || loadingColabs) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-7 h-7 text-primary" />
          Dashboard — Gente & Gestão
        </h1>
        <p className="text-muted-foreground mt-1">Visão consolidada do setor de Recursos Humanos</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/rh/colaboradores")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Ativos</p>
                <p className="text-2xl font-bold mt-1">{metricas?.totalAtivos || 0}</p>
              </div>
              <UserCheck className="w-6 h-6 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Inativos</p>
                <p className="text-2xl font-bold mt-1">{metricas?.totalInativos || 0}</p>
              </div>
              <UserX className="w-6 h-6 text-gray-400 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Total</p>
                <p className="text-2xl font-bold mt-1">{metricas?.totalColabs || 0}</p>
              </div>
              <Users className="w-6 h-6 text-blue-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Turnover</p>
                <p className="text-2xl font-bold mt-1">{metricas?.taxaTurnover}%</p>
              </div>
              <TrendingDown className="w-6 h-6 text-amber-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Absenteísmo</p>
                <p className="text-2xl font-bold mt-1">{metricas?.totalAbsenteismo || 0}<span className="text-xs font-normal ml-1">dias</span></p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Custo Mensal</p>
                <p className="text-lg font-bold mt-1">
                  {(metricas?.custoSalarial || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                </p>
              </div>
              <DollarSign className="w-6 h-6 text-emerald-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Status Distribution + Headcount */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" /> Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 overflow-y-auto max-h-[220px]">
                {statusData.map((s) => {
                  const Icon = STATUS_ICONS[s.key] || Users;
                  const colorClass = STATUS_COLORS[s.key] || "text-gray-600 bg-gray-50";
                  return (
                    <div key={s.key} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm">{s.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{s.value}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Headcount por Setor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Headcount por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={headcountSetor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="setor" type="category" width={130} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [v, "Colaboradores"]} />
                <Bar dataKey="quantidade" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Banco de Horas + Aniversariantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Banco de Horas Summary */}
        <Card className="border-l-4" style={{ borderLeftColor: "#6366f1" }}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Banco de Horas
            </CardTitle>
            <div className="flex items-center gap-2">
              {bancoHorasResumo && bancoHorasResumo.negativos.length > 0 && (
                <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                  {bancoHorasResumo.negativos.length} alerta(s)
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setLocation("/rh/banco-horas")}>
                Ver detalhes <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!bancoHorasResumo || bancoHorasResumo.total === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum registro de banco de horas ainda.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setLocation("/rh/banco-horas")}>
                  Registrar horas
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Saldo Geral Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-center">
                    <ArrowUpCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-[10px] text-green-700 dark:text-green-400 uppercase font-medium">Extras</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatHoras(bancoHorasResumo.totalExtras)}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                    <ArrowDownCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-medium">Compensações</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatHoras(bancoHorasResumo.totalCompensacoes)}</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${
                    bancoHorasResumo.saldoGeral >= 0
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-red-50 dark:bg-red-900/20"
                  }`}>
                    <Clock className={`w-5 h-5 mx-auto mb-1 ${
                      bancoHorasResumo.saldoGeral >= 0 ? "text-emerald-600" : "text-red-600"
                    }`} />
                    <p className={`text-[10px] uppercase font-medium ${
                      bancoHorasResumo.saldoGeral >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                    }`}>Saldo Geral</p>
                    <p className={`text-lg font-bold ${
                      bancoHorasResumo.saldoGeral >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                    }`}>{formatHoras(bancoHorasResumo.saldoGeral)}</p>
                  </div>
                </div>

                {/* Alertas de Saldo Negativo */}
                {bancoHorasResumo.negativos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Saldo Negativo</span>
                    </div>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                      {bancoHorasResumo.negativos.slice(0, 5).map((s: any) => (
                        <div key={s.colaboradorId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50/80 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-red-600" />
                            </div>
                            <span className="text-sm font-medium">{s.colaboradorNome}</span>
                          </div>
                          <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] font-mono">
                            {formatHoras(s.saldo)}
                          </Badge>
                        </div>
                      ))}
                      {bancoHorasResumo.negativos.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{bancoHorasResumo.negativos.length - 5} colaborador(es) com saldo negativo
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Top saldos positivos */}
                {bancoHorasResumo.negativos.length === 0 && bancoHorasResumo.positivos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Maiores Saldos</span>
                    </div>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                      {bancoHorasResumo.positivos.slice(0, 5).map((s: any) => (
                        <div key={s.colaboradorId} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="text-sm font-medium">{s.colaboradorNome}</span>
                          </div>
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-mono">
                            +{formatHoras(s.saldo)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aniversariantes do Mês */}
        <Card className="border-l-4" style={{ borderLeftColor: "#EC4899" }}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" /> Aniversariantes — {meses[mesAtual]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-50 text-pink-700 border-pink-200 text-[10px]">
                {(aniversariantes || []).length} neste mês
              </Badge>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setLocation("/rh/email-aniversariante")}>
                E-mails <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!aniversariantes || aniversariantes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversariante neste mês.</p>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {aniversariantesHoje.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <PartyPopper className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Hoje!</span>
                    </div>
                    {aniversariantesHoje.map((a: any) => (
                      <div key={`hoje-${a.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-pink-50 to-amber-50 border border-pink-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                            <PartyPopper className="w-4 h-4 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{a.nomeCompleto}</p>
                            <p className="text-[10px] text-muted-foreground">{a.cargo}</p>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] animate-pulse">Parabéns!</Badge>
                      </div>
                    ))}
                    <Separator className="my-2" />
                  </>
                )}
                {(aniversariantes || []).filter((a: any) => {
                  if (!a.dataNascimento) return false;
                  return a.dataNascimento.substring(5) !== hoje;
                }).map((a: any) => {
                  const dia = a.dataNascimento ? a.dataNascimento.substring(8, 10) : "??";
                  return (
                    <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                          <User className="w-4 h-4 text-pink-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.nomeCompleto}</p>
                          <p className="text-[10px] text-muted-foreground">{a.cargo}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-pink-50/50 text-pink-600 border-pink-200">Dia {dia}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Contratos Vencendo */}
      <Card className="border-l-4" style={{ borderLeftColor: "#F59E0B" }}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-500" /> Contratos Vencendo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] ${(contratosVencendo || []).length > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
              {(contratosVencendo || []).length > 0 ? `${(contratosVencendo || []).length} alerta(s)` : "Sem alertas"}
            </Badge>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setLocation("/rh/workflow-renovacao")}>
              Workflows <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!contratosVencendo || contratosVencendo.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum contrato próximo do vencimento nos próximos 30 dias.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto">
              {contratosVencendo.map((c: any) => {
                const urgente = c.diasRestantes <= 7;
                const atencao = c.diasRestantes <= 15;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors ${
                      urgente ? "bg-red-50/80 border-red-200" :
                      atencao ? "bg-amber-50/80 border-amber-200" :
                      "bg-slate-50/80 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        urgente ? "bg-red-100" : atencao ? "bg-amber-100" : "bg-slate-100"
                      }`}>
                        <FileWarning className={`w-4 h-4 ${urgente ? "text-red-600" : atencao ? "text-amber-600" : "text-slate-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.nomeCompleto}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground">{c.cargo}</p>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <p className="text-[10px] text-muted-foreground">
                            {c.tipoContrato === "clt" ? "CLT" : c.tipoContrato === "pj" ? "PJ" : "Contrato"} — {c.periodoExperiencia} dias
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-[10px] ${
                        urgente ? "bg-red-100 text-red-700 border-red-300" :
                        atencao ? "bg-amber-100 text-amber-700 border-amber-300" :
                        "bg-slate-100 text-slate-600 border-slate-300"
                      }`}>
                        {c.diasRestantes === 0 ? "Vence hoje!" : c.diasRestantes === 1 ? "Amanhã" : `${c.diasRestantes} dias`}
                      </Badge>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Venc: {c.dataVencimento ? new Date(c.dataVencimento + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 5: Turnover Chart */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Turnover — Últimos 6 Meses
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setLocation("/rh/bi")}>
            Ver BI completo <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {turnoverData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={turnoverData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="admissoes" name="Admissões" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                <Area type="monotone" dataKey="desligamentos" name="Desligamentos" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados de turnover para exibir.</p>
          )}
        </CardContent>
      </Card>

      {/* ===== SEÇÃO: BENEFÍCIOS E CUSTOS ===== */}
      <Separator />
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          Benefícios &amp; Custos do Mês
        </h2>
        <p className="text-xs text-muted-foreground">VT, Academia, Comissões RH, Reajustes e Day Offs</p>
      </div>

      {dashGEG && (
        <>
          {/* Benefits KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/rh/vale-transporte")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Vale Transporte</p>
                    <p className="text-lg font-bold mt-1">{dashGEG.vt.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    <p className="text-[10px] text-muted-foreground">{dashGEG.vt.qtd} colab.</p>
                  </div>
                  <Bus className="w-5 h-5 text-green-500 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/rh/academia")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Academia</p>
                    <p className="text-lg font-bold mt-1">{dashGEG.academia.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    <p className="text-[10px] text-muted-foreground">{dashGEG.academia.qtd} benef.</p>
                  </div>
                  <Dumbbell className="w-5 h-5 text-purple-500 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/rh/comissao-rh")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Comissões RH</p>
                    <p className="text-lg font-bold mt-1">{dashGEG.comissoes.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    <p className="text-[10px] text-muted-foreground">{dashGEG.comissoes.qtd} lanç.</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-amber-500 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${dashGEG.reajustesPendentes > 0 ? "border-l-red-500" : "border-l-emerald-500"} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setLocation("/rh/reajustes")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Reajustes Pend.</p>
                    <p className="text-2xl font-bold mt-1">{dashGEG.reajustesPendentes}</p>
                    {dashGEG.reajustesPendentes > 0 && <p className="text-[10px] text-red-500 font-medium">Ação necessária</p>}
                  </div>
                  <AlertTriangle className={`w-5 h-5 opacity-60 ${dashGEG.reajustesPendentes > 0 ? "text-red-500" : "text-emerald-500"}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-pink-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/rh/day-off")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Day Offs</p>
                    <p className="text-2xl font-bold mt-1">{dashGEG.dayOffs.total}</p>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[9px] px-1">{dashGEG.dayOffs.aprovados} aprov.</Badge>
                      {dashGEG.dayOffs.pendentes > 0 && <Badge variant="secondary" className="text-[9px] px-1">{dashGEG.dayOffs.pendentes} pend.</Badge>}
                    </div>
                  </div>
                  <Gift className="w-5 h-5 text-pink-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custo Total Banner */}
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">Custo Total de Benefícios — {meses[mesAtual]}/{new Date().getFullYear()}</p>
                  <p className="text-3xl font-bold mt-1">{dashGEG.custoTotalMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  <p className="text-xs text-slate-400">VT + Academia + Comissões RH</p>
                </div>
                <div className="text-right space-y-0.5 text-sm">
                  <div><span className="text-green-400">VT:</span> {dashGEG.vt.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                  <div><span className="text-purple-400">Academia:</span> {dashGEG.academia.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                  <div><span className="text-amber-400">Comissões:</span> {dashGEG.comissoes.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evolução Mensal + Próximos Aniversários (Day Off) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Evolução Mensal de Custos</CardTitle>
                <CardDescription className="text-xs">Últimos 6 meses — VT, Academia e Comissões</CardDescription>
              </CardHeader>
              <CardContent>
                {dashGEG.evolucao.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={dashGEG.evolucao}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                      <Legend />
                      <Area type="monotone" dataKey="vt" name="VT" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="academia" name="Academia" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="comissoes" name="Comissões" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados para o período.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Gift className="w-4 h-4 text-pink-500" /> Próximos Aniversários
                </CardTitle>
                <CardDescription className="text-xs">Próximos 30 dias (Day Off)</CardDescription>
              </CardHeader>
              <CardContent>
                {dashGEG.proximosAniversarios.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum aniversário nos próximos 30 dias</p>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {dashGEG.proximosAniversarios.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{a.nome}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(a.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </p>
                        </div>
                        <Badge variant={a.diasAte === 0 ? "default" : a.diasAte <= 7 ? "secondary" : "outline"} className="text-xs">
                          {a.diasAte === 0 ? "Hoje!" : `${a.diasAte}d`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reajustes Pendentes Alert */}
          {dashGEG.reajustesPendentesLista.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Reajustes Salariais Pendentes (2 anos)
                  </CardTitle>
                  <CardDescription className="text-xs">Colaboradores elegíveis para reajuste de 10%</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => setLocation("/rh/reajustes")}>
                  Ir para Reajustes <ArrowRight className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Colaborador</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Admissão</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground text-xs">Anos</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Salário Atual</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Novo (+10%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashGEG.reajustesPendentesLista.map((r) => (
                        <tr key={r.colaboradorId} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium text-sm">{r.nome}</td>
                          <td className="py-2 px-3 text-muted-foreground text-sm">
                            {r.dataAdmissao ? new Date(r.dataAdmissao + "T12:00:00").toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant="destructive" className="text-xs">{r.anosCompletos}a</Badge>
                          </td>
                          <td className="py-2 px-3 text-right text-sm">{r.salarioAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                          <td className="py-2 px-3 text-right font-semibold text-green-600 text-sm">{r.salarioEstimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Colaboradores", path: "/rh/colaboradores", icon: Users, color: "text-blue-600" },
          { label: "Férias", path: "/rh/ferias", icon: Cake, color: "text-cyan-600" },
          { label: "Atestados", path: "/rh/atestados-licencas", icon: FileWarning, color: "text-red-600" },
          { label: "Vale Transporte", path: "/rh/vale-transporte", icon: Bus, color: "text-green-600" },
          { label: "Reajustes", path: "/rh/reajustes", icon: TrendingUp, color: "text-indigo-600" },
        ].map((link) => (
          <Card key={link.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(link.path)}>
            <CardContent className="p-4 flex items-center gap-3">
              <link.icon className={`w-5 h-5 ${link.color}`} />
              <span className="text-sm font-medium">{link.label}</span>
              <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
