import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Users, CalendarDays, AlertTriangle, ArrowUpRight, ArrowDownRight, Briefcase, Wallet, Receipt, PiggyBank } from 'lucide-react';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function ProjecaoFinanceiraGEG() {
  const now = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(now.getFullYear());

  const colaboradores = trpc.colaboradores.list.useQuery();
  const ferias = trpc.ferias.list.useQuery();
  const rescisoes = trpc.rescisoes.list.useQuery();
  const apontamentos = trpc.apontamentosFolha.list.useQuery();

  const colabList = (colaboradores.data || []) as any[];
  const feriasList = (ferias.data || []) as any[];
  const rescisoesList = (rescisoes.data || []) as any[];
  const apontList = (apontamentos.data || []) as any[];

  // Active employees (not desligado)
  const ativos = useMemo(() => colabList.filter(c => c.statusColaborador !== 'desligado' && c.ativo !== false), [colabList]);

  // Monthly projection
  const projecaoMensal = useMemo(() => {
    return MESES.map((mes, idx) => {
      const mesNum = idx + 1;

      // Base salary cost
      const custoSalarial = ativos.reduce((sum, c) => sum + parseFloat(c.salarioBase || '0'), 0);

      // Commissions
      const custoComissoes = ativos.filter(c => c.recebeComissao).reduce((sum, c) => sum + parseFloat(c.comissoes || '0'), 0);

      // Additionals
      const custoAdicionais = ativos.reduce((sum, c) => sum + parseFloat(c.adicionais || '0'), 0);

      // Employer charges (INSS patronal ~28.8%, FGTS 8%)
      const encargos = custoSalarial * 0.368;

      // Benefits from apontamentos for this month/year
      const apontMes = apontList.filter(a => a.mesReferencia === mesNum && a.anoReferencia === anoSelecionado);
      const proventosMes = apontMes.filter(a => a.natureza === 'provento').reduce((sum: number, a: any) => sum + parseFloat(a.valor || '0'), 0);
      const descontosMes = apontMes.filter(a => a.natureza === 'desconto').reduce((sum: number, a: any) => sum + parseFloat(a.valor || '0'), 0);

      // VT estimate (6% discount from salary for those who receive)
      const vtColabs = ativos.filter(c => c.valeTransporte);
      const custoVT = vtColabs.length * 300; // estimated average monthly VT cost

      // Vacation costs for this month
      const feriasMes = feriasList.filter(f => {
        if (!f.periodo1Inicio) return false;
        const inicio = new Date(f.periodo1Inicio + 'T12:00:00');
        return inicio.getMonth() + 1 === mesNum && inicio.getFullYear() === anoSelecionado;
      });
      const custoFerias = feriasMes.reduce((sum: number, f: any) => {
        const colab = colabList.find(c => c.id === f.colaboradorId);
        if (!colab) return sum;
        const salDiario = parseFloat(colab.salarioBase || '0') / 30;
        const dias = f.periodo1Dias || f.diasTotais || 30;
        const valorFerias = salDiario * dias;
        const terco = valorFerias / 3;
        return sum + valorFerias + terco;
      }, 0);

      // Rescission costs for this month
      const rescisoesMes = rescisoesList.filter(r => {
        if (!r.dataDesligamento) return false;
        const dt = new Date(r.dataDesligamento + 'T12:00:00');
        return dt.getMonth() + 1 === mesNum && dt.getFullYear() === anoSelecionado;
      });
      const custoRescisoes = rescisoesMes.reduce((sum: number, r: any) => sum + parseFloat(r.totalLiquido || '0'), 0);

      // 13th salary provision (1/12 per month)
      const provisao13 = custoSalarial / 12;

      // Vacation provision (1/12 + 1/3)
      const provisaoFerias = (custoSalarial / 12) * (4 / 3);

      const totalMensal = custoSalarial + custoComissoes + custoAdicionais + encargos + custoVT + custoFerias + custoRescisoes + provisao13 + provisaoFerias + proventosMes - descontosMes;

      return {
        mes, mesNum,
        custoSalarial, custoComissoes, custoAdicionais, encargos,
        custoVT, custoFerias, custoRescisoes,
        provisao13, provisaoFerias,
        proventosMes, descontosMes,
        totalMensal,
        feriasMes: feriasMes.length,
        rescisoesMes: rescisoesMes.length,
      };
    });
  }, [ativos, feriasList, rescisoesList, apontList, colabList, anoSelecionado]);

  // Annual totals
  const totalAnual = useMemo(() => {
    return projecaoMensal.reduce((acc, m) => ({
      custoSalarial: acc.custoSalarial + m.custoSalarial,
      custoComissoes: acc.custoComissoes + m.custoComissoes,
      custoAdicionais: acc.custoAdicionais + m.custoAdicionais,
      encargos: acc.encargos + m.encargos,
      custoVT: acc.custoVT + m.custoVT,
      custoFerias: acc.custoFerias + m.custoFerias,
      custoRescisoes: acc.custoRescisoes + m.custoRescisoes,
      provisao13: acc.provisao13 + m.provisao13,
      provisaoFerias: acc.provisaoFerias + m.provisaoFerias,
      totalMensal: acc.totalMensal + m.totalMensal,
    }), {
      custoSalarial: 0, custoComissoes: 0, custoAdicionais: 0, encargos: 0,
      custoVT: 0, custoFerias: 0, custoRescisoes: 0,
      provisao13: 0, provisaoFerias: 0, totalMensal: 0,
    });
  }, [projecaoMensal]);

  const mesAtual = now.getMonth();
  const projecaoMesAtual = projecaoMensal[mesAtual];
  const projecaoMesAnterior = mesAtual > 0 ? projecaoMensal[mesAtual - 1] : null;
  const variacao = projecaoMesAnterior ? ((projecaoMesAtual.totalMensal - projecaoMesAnterior.totalMensal) / projecaoMesAnterior.totalMensal) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600" /> Projeção Financeira da Folha
          </h1>
          <p className="text-muted-foreground">Projeção mensal e anual de custos com pessoal para o setor financeiro</p>
        </div>
        <Select value={String(anoSelecionado)} onValueChange={v => setAnoSelecionado(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={String(now.getFullYear() - 1)}>{now.getFullYear() - 1}</SelectItem>
            <SelectItem value={String(now.getFullYear())}>{now.getFullYear()}</SelectItem>
            <SelectItem value={String(now.getFullYear() + 1)}>{now.getFullYear() + 1}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Custo Mensal Estimado</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(projecaoMesAtual.totalMensal)}</p>
                {projecaoMesAnterior && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${variacao >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {variacao >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(variacao).toFixed(1)}% vs mês anterior
                  </div>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Projeção Anual {anoSelecionado}</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(totalAnual.totalMensal)}</p>
                <p className="text-xs text-muted-foreground mt-1">Média: {formatCurrency(totalAnual.totalMensal / 12)}/mês</p>
              </div>
              <Wallet className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Colaboradores Ativos</p>
                <p className="text-xl font-bold text-purple-700">{ativos.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Folha base: {formatCurrency(ativos.reduce((s, c) => s + parseFloat(c.salarioBase || '0'), 0))}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Encargos + Provisões</p>
                <p className="text-xl font-bold text-orange-700">{formatCurrency(projecaoMesAtual.encargos + projecaoMesAtual.provisao13 + projecaoMesAtual.provisaoFerias)}</p>
                <p className="text-xs text-muted-foreground mt-1">INSS + FGTS + 13º + Férias</p>
              </div>
              <PiggyBank className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed breakdown - current month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Composição do Custo — {MESES[mesAtual]} {anoSelecionado}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Custos Fixos</h4>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> Salários Base</span>
                <span className="font-semibold">{formatCurrency(projecaoMesAtual.custoSalarial)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /> Comissões</span>
                <span className="font-semibold">{formatCurrency(projecaoMesAtual.custoComissoes)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-teal-500" /> Adicionais</span>
                <span className="font-semibold">{formatCurrency(projecaoMesAtual.custoAdicionais)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><PiggyBank className="w-4 h-4 text-orange-500" /> Encargos (INSS + FGTS)</span>
                <span className="font-semibold">{formatCurrency(projecaoMesAtual.encargos)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-purple-500" /> Vale Transporte</span>
                <span className="font-semibold">{formatCurrency(projecaoMesAtual.custoVT)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Provisões e Eventos</h4>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-yellow-500" /> Provisão 13º Salário</span>
                <span className="font-semibold">{formatCurrency(projecaoMesAtual.provisao13)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-500" /> Provisão Férias</span>
                <span className="font-semibold">{formatCurrency(projecaoMesAtual.provisaoFerias)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-yellow-600" /> Férias Programadas ({projecaoMesAtual.feriasMes})</span>
                <span className="font-semibold text-yellow-700">{formatCurrency(projecaoMesAtual.custoFerias)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /> Rescisões ({projecaoMesAtual.rescisoesMes})</span>
                <span className="font-semibold text-red-700">{formatCurrency(projecaoMesAtual.custoRescisoes)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-600" /> Apontamentos (proventos - descontos)</span>
                <span className="font-semibold text-blue-700">{formatCurrency(projecaoMesAtual.proventosMes - projecaoMesAtual.descontosMes)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Estimado — {MESES[mesAtual]}</span>
              <span className="text-2xl font-bold text-blue-700">{formatCurrency(projecaoMesAtual.totalMensal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly projection table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Projeção Mensal — {anoSelecionado}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-semibold">Mês</th>
                  <th className="text-right p-3 font-semibold">Salários</th>
                  <th className="text-right p-3 font-semibold">Encargos</th>
                  <th className="text-right p-3 font-semibold">Benefícios</th>
                  <th className="text-right p-3 font-semibold">Provisões</th>
                  <th className="text-right p-3 font-semibold">Férias</th>
                  <th className="text-right p-3 font-semibold">Rescisões</th>
                  <th className="text-right p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {projecaoMensal.map((m, idx) => (
                  <tr key={m.mes} className={`border-b hover:bg-muted/20 ${idx === mesAtual ? 'bg-blue-50/50 font-medium' : ''}`}>
                    <td className="p-3 flex items-center gap-2">
                      {m.mes}
                      {idx === mesAtual && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Atual</Badge>}
                    </td>
                    <td className="text-right p-3">{formatCurrency(m.custoSalarial + m.custoComissoes + m.custoAdicionais)}</td>
                    <td className="text-right p-3">{formatCurrency(m.encargos)}</td>
                    <td className="text-right p-3">{formatCurrency(m.custoVT + m.proventosMes - m.descontosMes)}</td>
                    <td className="text-right p-3">{formatCurrency(m.provisao13 + m.provisaoFerias)}</td>
                    <td className="text-right p-3">
                      {m.custoFerias > 0 ? (
                        <span className="text-yellow-700">{formatCurrency(m.custoFerias)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-right p-3">
                      {m.custoRescisoes > 0 ? (
                        <span className="text-red-600">{formatCurrency(m.custoRescisoes)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-right p-3 font-semibold">{formatCurrency(m.totalMensal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/30 font-bold">
                  <td className="p-3">Total Anual</td>
                  <td className="text-right p-3">{formatCurrency(totalAnual.custoSalarial + totalAnual.custoComissoes + totalAnual.custoAdicionais)}</td>
                  <td className="text-right p-3">{formatCurrency(totalAnual.encargos)}</td>
                  <td className="text-right p-3">{formatCurrency(totalAnual.custoVT)}</td>
                  <td className="text-right p-3">{formatCurrency(totalAnual.provisao13 + totalAnual.provisaoFerias)}</td>
                  <td className="text-right p-3 text-yellow-700">{formatCurrency(totalAnual.custoFerias)}</td>
                  <td className="text-right p-3 text-red-600">{formatCurrency(totalAnual.custoRescisoes)}</td>
                  <td className="text-right p-3 text-blue-700">{formatCurrency(totalAnual.totalMensal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events that impact the projection */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-yellow-600" /> Férias Programadas (próximos 3 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const proxFerias = feriasList.filter(f => {
                if (!f.periodo1Inicio) return false;
                const dt = new Date(f.periodo1Inicio + 'T12:00:00');
                const diff = (dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= 90;
              });
              if (proxFerias.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma férias programada nos próximos 3 meses.</p>;
              return (
                <div className="space-y-2">
                  {proxFerias.map((f: any) => {
                    const colab = colabList.find(c => c.id === f.colaboradorId);
                    const salDiario = parseFloat(colab?.salarioBase || '0') / 30;
                    const dias = f.periodo1Dias || f.diasTotais || 30;
                    const custo = salDiario * dias * (4 / 3);
                    return (
                      <div key={f.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-100">
                        <div>
                          <p className="text-sm font-medium">{colab?.nomeCompleto || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{formatDateBR(f.periodo1Inicio)} — {dias} dias</p>
                        </div>
                        <span className="font-semibold text-sm text-yellow-700">{formatCurrency(custo)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Rescisões Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const recentes = rescisoesList.filter(r => {
                if (!r.dataDesligamento) return false;
                const dt = new Date(r.dataDesligamento + 'T12:00:00');
                const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= 90;
              });
              if (recentes.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma rescisão nos últimos 3 meses.</p>;
              return (
                <div className="space-y-2">
                  {recentes.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
                      <div>
                        <p className="text-sm font-medium">{r.colaboradorNome}</p>
                        <p className="text-xs text-muted-foreground">{formatDateBR(r.dataDesligamento)} — {r.tipoDesligamento?.replace(/_/g, ' ')}</p>
                      </div>
                      <span className="font-semibold text-sm text-red-700">{formatCurrency(parseFloat(r.totalLiquido || '0'))}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Nota sobre a projeção</p>
              <p className="text-xs text-amber-700 mt-1">
                Os valores são estimativas baseadas nos dados cadastrados no sistema. Encargos patronais estimados em 36,8% (INSS 28,8% + FGTS 8%).
                Provisões de 13º e férias são calculadas mensalmente (1/12). Valores reais podem variar conforme convenções coletivas, horas extras, e outros eventos não previstos.
                Ao agendar férias ou registrar rescisões, os valores são automaticamente refletidos neste painel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
