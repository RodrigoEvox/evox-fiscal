import { Link } from 'wouter';
import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, TrendingDown, Clock, DollarSign, Building2, BarChart3,
  AlertTriangle, UserMinus, UserPlus, Activity, Calendar, FileDown,
  Loader2, UserCheck, UserX, ShieldAlert, HeartPulse, Palmtree,
  Briefcase, FileWarning, ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; chartColor: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700 border-green-200', icon: UserCheck, chartColor: '#10B981' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: UserX, chartColor: '#6B7280' },
  afastado: { label: 'Afastado', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ShieldAlert, chartColor: '#F97316' },
  licenca: { label: 'Licença', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: FileWarning, chartColor: '#8B5CF6' },
  atestado: { label: 'Atestado', color: 'bg-red-100 text-red-700 border-red-200', icon: HeartPulse, chartColor: '#EF4444' },
  desligado: { label: 'Desligado', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle, chartColor: '#475569' },
  ferias: { label: 'Férias', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Palmtree, chartColor: '#06B6D4' },
  experiencia: { label: 'Experiência', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, chartColor: '#EAB308' },
  aviso_previo: { label: 'Aviso Prévio', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Briefcase, chartColor: '#D97706' },
};

// Lucide doesn't export XCircle from the same import, use a simple fallback
function XCircle(props: any) {
  return <UserX {...props} />;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function RelatoriosRH() {
  const colaboradores = trpc.colaboradores.list.useQuery();
  const atestados = trpc.atestadosLicencas.list.useQuery();
  const setores = trpc.setores.list.useQuery();

  const colabList = (colaboradores.data || []) as any[];
  const atestadosList = (atestados.data || []) as any[];
  const setoresList = (setores.data || []) as any[];

  // Status-based classification
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    colabList.forEach(c => {
      const st = c.statusColaborador || (c.ativo === false ? 'desligado' : 'ativo');
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [colabList]);

  // "Efetivos" = todos que NÃO são desligados ou inativos (ou seja, estão na folha)
  const efetivos = colabList.filter(c => {
    const st = c.statusColaborador || (c.ativo === false ? 'desligado' : 'ativo');
    return st !== 'desligado' && st !== 'inativo';
  });
  const desligados = colabList.filter(c => {
    const st = c.statusColaborador || (c.ativo === false ? 'desligado' : 'ativo');
    return st === 'desligado' || st === 'inativo';
  });
  const totalHeadcount = efetivos.length;

  // Turnover (últimos 12 meses)
  const hoje = new Date();
  const umAnoAtras = new Date(hoje);
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  const desligados12m = desligados.filter(c => {
    if (!c.dataDesligamento) return false;
    const d = new Date(c.dataDesligamento + 'T12:00:00');
    return d >= umAnoAtras;
  });
  const admitidos12m = colabList.filter(c => {
    const d = new Date(c.dataAdmissao + 'T12:00:00');
    return d >= umAnoAtras;
  });
  const turnoverRate = totalHeadcount > 0 ? ((desligados12m.length / ((totalHeadcount + desligados12m.length) / 2)) * 100).toFixed(1) : '0.0';

  // Absenteeism
  const totalDiasAfastamento = atestadosList.reduce((sum: number, a: any) => sum + (a.diasAfastamento || 0), 0);
  const diasUteisMes = 22;
  const absenteeismRate = totalHeadcount > 0 ? ((totalDiasAfastamento / (totalHeadcount * diasUteisMes * 12)) * 100).toFixed(2) : '0.00';

  // Salary cost (only efetivos)
  const custoSalarialTotal = efetivos.reduce((sum: number, c: any) => {
    return sum + Number(c.salarioBase || 0) + Number(c.comissoes || 0) + Number(c.adicionais || 0);
  }, 0);
  const salarioMedio = totalHeadcount > 0 ? custoSalarialTotal / totalHeadcount : 0;

  // By sector
  const porSetor = useMemo(() => {
    const map = new Map<number, { nome: string; count: number; custo: number; atestados: number }>();
    efetivos.forEach(c => {
      const setorId = c.setorId || 0;
      const setor = setoresList.find(s => s.id === setorId);
      const existing = map.get(setorId) || { nome: setor?.nome || 'Sem Setor', count: 0, custo: 0, atestados: 0 };
      existing.count += 1;
      existing.custo += Number(c.salarioBase || 0) + Number(c.comissoes || 0) + Number(c.adicionais || 0);
      map.set(setorId, existing);
    });
    atestadosList.forEach(a => {
      const colab = colabList.find(c => c.id === a.colaboradorId);
      if (colab) {
        const setorId = colab.setorId || 0;
        const existing = map.get(setorId);
        if (existing) existing.atestados += a.diasAfastamento || 0;
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [efetivos, atestadosList, setoresList, colabList]);

  // By level
  const porNivel = useMemo(() => {
    const map = new Map<string, { count: number; custo: number }>();
    const nivelLabels: Record<string, string> = {
      estagiario: 'Estagiário', auxiliar: 'Auxiliar', assistente: 'Assistente',
      analista_jr: 'Analista Jr', analista_pl: 'Analista Pl', analista_sr: 'Analista Sr',
      coordenador: 'Coordenador', supervisor: 'Supervisor', gerente: 'Gerente', diretor: 'Diretor',
    };
    efetivos.forEach(c => {
      const nivel = c.nivelHierarquico || 'sem_nivel';
      const existing = map.get(nivel) || { count: 0, custo: 0 };
      existing.count += 1;
      existing.custo += Number(c.salarioBase || 0);
      map.set(nivel, existing);
    });
    return Array.from(map.entries()).map(([k, v]) => ({ nivel: nivelLabels[k] || k, ...v })).sort((a, b) => b.custo - a.custo);
  }, [efetivos]);

  // By contract type
  const porContrato = useMemo(() => {
    const map = new Map<string, number>();
    efetivos.forEach(c => {
      const tipo = c.tipoContrato || 'clt';
      map.set(tipo, (map.get(tipo) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [efetivos]);

  // Status distribution for pie chart
  const statusChartData = useMemo(() => {
    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_CONFIG[status]?.label || status,
        value: count,
        color: STATUS_CONFIG[status]?.chartColor || '#6B7280',
      }));
  }, [statusCounts]);

  // Recent admissions and terminations
  const recentAdmissoes = [...admitidos12m].sort((a, b) => b.dataAdmissao?.localeCompare(a.dataAdmissao || '') || 0).slice(0, 5);
  const recentDesligamentos = [...desligados12m].sort((a, b) => (b.dataDesligamento || '').localeCompare(a.dataDesligamento || '') || 0).slice(0, 5);

  // Chart data: Turnover mensal
  const turnoverMensal = useMemo(() => {
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      const adm = colabList.filter(c => c.dataAdmissao?.startsWith(mesStr)).length;
      const desl = desligados.filter(c => c.dataDesligamento?.startsWith(mesStr)).length;
      result.push({ mes: label, admissoes: adm, desligamentos: desl });
    }
    return result;
  }, [colabList, desligados, hoje]);

  // Chart data: Absenteísmo mensal
  const absenteismoMensal = useMemo(() => {
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      const atMes = atestadosList.filter((a: any) => a.dataInicio?.startsWith(mesStr));
      const dias = atMes.reduce((s: number, a: any) => s + (a.diasAfastamento || 0), 0);
      result.push({ mes: label, atestados: atMes.length, diasAfastamento: dias });
    }
    return result;
  }, [atestadosList, hoje]);

  // Chart data: Headcount por setor (for bar chart)
  const setorChartData = useMemo(() => {
    return porSetor.map(([_, data]) => ({ name: data.nome, headcount: data.count, custo: data.custo }));
  }, [porSetor]);

  // Chart data: Nível hierárquico (for pie chart)
  const nivelChartData = useMemo(() => {
    return porNivel.map(item => ({ name: item.nivel, value: item.count }));
  }, [porNivel]);

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/relatorios-rh/pdf');
      if (!response.ok) throw new Error('Erro ao gerar relatório');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-rh-${new Date().toISOString().slice(0,10)}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Relatório exportado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao exportar relatório: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold">Relatórios RH</h1>

              <p className="text-muted-foreground">Dashboard consolidado — Gente & Gestão</p>

            </div>

          </div>
        </div>
        <Button onClick={handleExportPDF} disabled={exporting} variant="outline" className="gap-2">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {exporting ? 'Exportando...' : 'Exportar Relatório'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Headcount Efetivo</p>
                <p className="text-3xl font-bold">{totalHeadcount}</p>
                <p className="text-xs text-muted-foreground">{desligados.length} desligados/inativos</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${Number(turnoverRate) > 10 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Turnover (12m)</p>
                <p className="text-3xl font-bold">{turnoverRate}%</p>
                <p className="text-xs text-muted-foreground">{desligados12m.length} desligados</p>
              </div>
              <TrendingDown className={`w-8 h-8 opacity-50 ${Number(turnoverRate) > 10 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${Number(absenteeismRate) > 3 ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Absenteísmo</p>
                <p className="text-3xl font-bold">{absenteeismRate}%</p>
                <p className="text-xs text-muted-foreground">{totalDiasAfastamento} dias afastamento</p>
              </div>
              <Clock className={`w-8 h-8 opacity-50 ${Number(absenteeismRate) > 3 ? 'text-yellow-500' : 'text-green-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Custo Salarial</p>
                <p className="text-2xl font-bold">{formatCurrency(custoSalarialTotal)}</p>
                <p className="text-xs text-muted-foreground">Média: {formatCurrency(salarioMedio)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = statusCounts[key] || 0;
              const Icon = cfg.icon;
              const pct = colabList.length > 0 ? ((count / colabList.length) * 100).toFixed(0) : '0';
              return (
                <div key={key} className={`flex flex-col items-center p-3 rounded-lg border ${cfg.color} text-center`}>
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-lg font-bold">{count}</span>
                  <span className="text-[10px] font-medium">{cfg.label}</span>
                  <span className="text-[9px] opacity-70">{pct}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts: Turnover + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4 text-green-500" /> Turnover Mensal (12 meses)</CardTitle></CardHeader>
          <CardContent>
            {turnoverMensal.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={turnoverMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="admissoes" fill="#10B981" name="Admissões" radius={[4,4,0,0]} />
                  <Bar dataKey="desligamentos" fill="#EF4444" name="Desligamentos" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Distribuição por Status</CardTitle></CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts: Absenteísmo + Headcount por Setor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-red-500" /> Absenteísmo Mensal (12 meses)</CardTitle></CardHeader>
          <CardContent>
            {absenteismoMensal.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={absenteismoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="atestados" stroke="#F59E0B" fill="#FEF3C7" name="Atestados" />
                  <Area type="monotone" dataKey="diasAfastamento" stroke="#EF4444" fill="#FEE2E2" name="Dias Afastamento" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> Headcount por Setor</CardTitle></CardHeader>
          <CardContent>
            {setorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={setorChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="headcount" fill="#3B82F6" radius={[0,4,4,0]} name="Colaboradores" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>
      </div>

      {/* Nível Hierárquico Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-purple-500" /> Distribuição por Nível</CardTitle></CardHeader>
          <CardContent>
            {nivelChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={nivelChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {nivelChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>

        {/* Contract types */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Tipo de Contrato</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {porContrato.map(([tipo, count]) => {
                const pct = totalHeadcount > 0 ? ((count / totalHeadcount) * 100).toFixed(0) : '0';
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">{tipo === 'clt' ? 'CLT' : tipo === 'pj' ? 'PJ' : 'Contrato'}</Badge>
                      <span className="font-bold text-lg">{count} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution by Sector - Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Resumo por Setor</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Setor</th>
                  <th className="text-right py-2 px-3 font-medium">Headcount</th>
                  <th className="text-right py-2 px-3 font-medium">% do Total</th>
                  <th className="text-right py-2 px-3 font-medium">Custo Salarial</th>
                  <th className="text-right py-2 px-3 font-medium">Dias Afastamento</th>
                </tr>
              </thead>
              <tbody>
                {porSetor.map(([id, data], i) => {
                  const pct = totalHeadcount > 0 ? ((data.count / totalHeadcount) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {data.nome}
                      </td>
                      <td className="text-right py-2 px-3 font-medium">{data.count}</td>
                      <td className="text-right py-2 px-3 text-muted-foreground">{pct}%</td>
                      <td className="text-right py-2 px-3">{formatCurrency(data.custo)}</td>
                      <td className="text-right py-2 px-3 text-muted-foreground">{data.atestados}d</td>
                    </tr>
                  );
                })}
                <tr className="font-semibold bg-muted/30">
                  <td className="py-2 px-3">Total</td>
                  <td className="text-right py-2 px-3">{totalHeadcount}</td>
                  <td className="text-right py-2 px-3">100%</td>
                  <td className="text-right py-2 px-3">{formatCurrency(custoSalarialTotal)}</td>
                  <td className="text-right py-2 px-3">{totalDiasAfastamento}d</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4 text-green-500" /> Admissões Recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAdmissoes.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.nomeCompleto}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDateBR(c.dataAdmissao)}</span>
                </div>
              ))}
              {recentAdmissoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma admissão recente</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><UserMinus className="w-4 h-4 text-red-500" /> Desligamentos Recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDesligamentos.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.nomeCompleto}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDateBR(c.dataDesligamento)}</span>
                </div>
              ))}
              {recentDesligamentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum desligamento recente</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
