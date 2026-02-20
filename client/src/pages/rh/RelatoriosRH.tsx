import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingDown, Clock, DollarSign, Building2, BarChart3, AlertTriangle, UserMinus, UserPlus, Activity, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

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

  // Headcount
  const ativos = colabList.filter(c => c.ativo !== false);
  const inativos = colabList.filter(c => c.ativo === false);
  const totalHeadcount = ativos.length;

  // Turnover (últimos 12 meses)
  const hoje = new Date();
  const umAnoAtras = new Date(hoje);
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  const desligados12m = inativos.filter(c => {
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

  // Salary cost
  const custoSalarialTotal = ativos.reduce((sum: number, c: any) => {
    return sum + Number(c.salarioBase || 0) + Number(c.comissoes || 0) + Number(c.adicionais || 0);
  }, 0);
  const salarioMedio = totalHeadcount > 0 ? custoSalarialTotal / totalHeadcount : 0;

  // By sector
  const porSetor = useMemo(() => {
    const map = new Map<number, { nome: string; count: number; custo: number; atestados: number }>();
    ativos.forEach(c => {
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
  }, [ativos, atestadosList, setoresList, colabList]);

  // By level
  const porNivel = useMemo(() => {
    const map = new Map<string, { count: number; custo: number }>();
    const nivelLabels: Record<string, string> = {
      estagiario: 'Estagiário', auxiliar: 'Auxiliar', assistente: 'Assistente',
      analista_jr: 'Analista Jr', analista_pl: 'Analista Pl', analista_sr: 'Analista Sr',
      coordenador: 'Coordenador', supervisor: 'Supervisor', gerente: 'Gerente', diretor: 'Diretor',
    };
    ativos.forEach(c => {
      const nivel = c.nivelHierarquico || 'sem_nivel';
      const existing = map.get(nivel) || { count: 0, custo: 0 };
      existing.count += 1;
      existing.custo += Number(c.salarioBase || 0);
      map.set(nivel, existing);
    });
    return Array.from(map.entries()).map(([k, v]) => ({ nivel: nivelLabels[k] || k, ...v })).sort((a, b) => b.custo - a.custo);
  }, [ativos]);

  // By contract type
  const porContrato = useMemo(() => {
    const map = new Map<string, number>();
    ativos.forEach(c => {
      const tipo = c.tipoContrato || 'clt';
      map.set(tipo, (map.get(tipo) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [ativos]);

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
      const desl = inativos.filter(c => c.dataDesligamento?.startsWith(mesStr)).length;
      result.push({ mes: label, admissoes: adm, desligamentos: desl });
    }
    return result;
  }, [colabList, inativos, hoje]);

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
    return porSetor.map(([id, data]) => ({ name: data.nome, headcount: data.count, custo: data.custo }));
  }, [porSetor]);

  // Chart data: Nível hierárquico (for pie chart)
  const nivelChartData = useMemo(() => {
    return porNivel.map(item => ({ name: item.nivel, value: item.count }));
  }, [porNivel]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios RH</h1>
        <p className="text-muted-foreground">Dashboard consolidado — Gente & Gestão</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Headcount</p>
                <p className="text-3xl font-bold">{totalHeadcount}</p>
                <p className="text-xs text-muted-foreground">{inativos.length} inativos</p>
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

      {/* Charts: Turnover + Absenteísmo */}
      <div className="grid grid-cols-2 gap-6">
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
      </div>

      {/* Charts: Headcount por Setor + Nível Hierárquico */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> Headcount por Setor</CardTitle></CardHeader>
          <CardContent>
            {setorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
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

      {/* Contract types and recent movements */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Tipo de Contrato</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {porContrato.map(([tipo, count]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{tipo === 'clt' ? 'CLT' : tipo === 'pj' ? 'PJ' : 'Contrato'}</Badge>
                  <span className="font-bold text-lg">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4 text-green-500" /> Admissões Recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAdmissoes.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.nomeCompleto}</span>
                  <span className="text-xs text-muted-foreground">{formatDateBR(c.dataAdmissao)}</span>
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
                  <span>{c.nomeCompleto}</span>
                  <span className="text-xs text-muted-foreground">{formatDateBR(c.dataDesligamento)}</span>
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
