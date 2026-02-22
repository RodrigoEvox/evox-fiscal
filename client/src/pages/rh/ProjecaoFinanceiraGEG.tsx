import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, Users, CalendarDays, AlertTriangle, ArrowUpRight, ArrowDownRight, Briefcase, Wallet, Receipt, PiggyBank, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

type DrillDownType = 'salarios' | 'comissoes' | 'adicionais' | 'encargos' | 'vt' | 'provisao13' | 'provisaoFerias' | 'ferias' | 'rescisoes' | 'apontamentos' | null;

interface DrillDownState {
  type: DrillDownType;
  mes?: number;
  titulo: string;
}

export default function ProjecaoFinanceiraGEG() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const [anoSelecionado, setAnoSelecionado] = useState(currentYear);
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);

  // 5-year range: current year to current year + 4
  const anosDisponiveis = useMemo(() => {
    const anos: number[] = [];
    for (let i = 0; i < 5; i++) {
      anos.push(currentYear + i);
    }
    return anos;
  }, [currentYear]);

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

      const custoSalarial = ativos.reduce((sum, c) => sum + parseFloat(c.salarioBase || '0'), 0);
      const custoComissoes = ativos.filter(c => c.recebeComissao).reduce((sum, c) => sum + parseFloat(c.comissoes || '0'), 0);
      const custoAdicionais = ativos.reduce((sum, c) => sum + parseFloat(c.adicionais || '0'), 0);
      const encargos = custoSalarial * 0.368;

      const apontMes = apontList.filter(a => a.mesReferencia === mesNum && a.anoReferencia === anoSelecionado);
      const proventosMes = apontMes.filter(a => a.natureza === 'provento').reduce((sum: number, a: any) => sum + parseFloat(a.valor || '0'), 0);
      const descontosMes = apontMes.filter(a => a.natureza === 'desconto').reduce((sum: number, a: any) => sum + parseFloat(a.valor || '0'), 0);

      const vtColabs = ativos.filter(c => c.valeTransporte);
      const custoVT = vtColabs.length * 300;

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

      const rescisoesMes = rescisoesList.filter(r => {
        if (!r.dataDesligamento) return false;
        const dt = new Date(r.dataDesligamento + 'T12:00:00');
        return dt.getMonth() + 1 === mesNum && dt.getFullYear() === anoSelecionado;
      });
      const custoRescisoes = rescisoesMes.reduce((sum: number, r: any) => sum + parseFloat(r.totalLiquido || '0'), 0);

      const provisao13 = custoSalarial / 12;
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

  // Only show "Atual" badge if the selected year is the current year
  const isCurrentYear = anoSelecionado === currentYear;
  const displayMonth = isCurrentYear ? currentMonth : 0; // For summary cards, show current month data only for current year
  const projecaoMesDisplay = projecaoMensal[displayMonth];
  const projecaoMesAnterior = displayMonth > 0 ? projecaoMensal[displayMonth - 1] : null;
  const variacao = projecaoMesAnterior ? ((projecaoMesDisplay.totalMensal - projecaoMesAnterior.totalMensal) / projecaoMesAnterior.totalMensal) * 100 : 0;

  // Drill-down: render memory of calculation
  function renderDrillDown() {
    if (!drillDown) return null;
    const { type, mes } = drillDown;

    if (type === 'salarios') {
      const sorted = [...ativos].sort((a, b) => parseFloat(b.salarioBase || '0') - parseFloat(a.salarioBase || '0'));
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-left p-2 font-semibold">Cargo</th>
                <th className="text-left p-2 font-semibold">Setor</th>
                <th className="text-right p-2 font-semibold">Salário Base</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.id} className="border-b hover:bg-muted/20">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{c.nomeCompleto}</td>
                  <td className="p-2 text-muted-foreground">{c.cargo || '—'}</td>
                  <td className="p-2 text-muted-foreground">{c.setor || '—'}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(parseFloat(c.salarioBase || '0'))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td colSpan={4} className="p-2">Total ({sorted.length} colaboradores)</td>
                <td className="p-2 text-right text-blue-700">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0'), 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'comissoes') {
      const comissionados = ativos.filter(c => c.recebeComissao);
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-left p-2 font-semibold">Cargo</th>
                <th className="text-right p-2 font-semibold">Salário Base</th>
                <th className="text-right p-2 font-semibold">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {comissionados.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Nenhum colaborador com comissão cadastrada.</td></tr>
              ) : comissionados.map((c, i) => (
                <tr key={c.id} className="border-b hover:bg-muted/20">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{c.nomeCompleto}</td>
                  <td className="p-2 text-muted-foreground">{c.cargo || '—'}</td>
                  <td className="p-2 text-right">{formatCurrency(parseFloat(c.salarioBase || '0'))}</td>
                  <td className="p-2 text-right font-semibold text-green-700">{formatCurrency(parseFloat(c.comissoes || '0'))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td colSpan={4} className="p-2">Total ({comissionados.length} comissionados)</td>
                <td className="p-2 text-right text-green-700">{formatCurrency(comissionados.reduce((s, c) => s + parseFloat(c.comissoes || '0'), 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'adicionais') {
      const comAdicionais = ativos.filter(c => parseFloat(c.adicionais || '0') > 0);
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-left p-2 font-semibold">Cargo</th>
                <th className="text-right p-2 font-semibold">Adicionais</th>
              </tr>
            </thead>
            <tbody>
              {comAdicionais.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum colaborador com adicionais cadastrados.</td></tr>
              ) : comAdicionais.map((c, i) => (
                <tr key={c.id} className="border-b hover:bg-muted/20">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{c.nomeCompleto}</td>
                  <td className="p-2 text-muted-foreground">{c.cargo || '—'}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(parseFloat(c.adicionais || '0'))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td colSpan={3} className="p-2">Total</td>
                <td className="p-2 text-right text-teal-700">{formatCurrency(ativos.reduce((s, c) => s + parseFloat(c.adicionais || '0'), 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'encargos') {
      const sorted = [...ativos].sort((a, b) => parseFloat(b.salarioBase || '0') - parseFloat(a.salarioBase || '0'));
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
            <p className="font-medium text-amber-800">Fórmula de cálculo:</p>
            <p className="text-amber-700 mt-1">Encargos = Salário Base × 36,8% (INSS Patronal 28,8% + FGTS 8%)</p>
          </div>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-right p-2 font-semibold">Salário Base</th>
                <th className="text-right p-2 font-semibold">INSS (28,8%)</th>
                <th className="text-right p-2 font-semibold">FGTS (8%)</th>
                <th className="text-right p-2 font-semibold">Total Encargos</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const sal = parseFloat(c.salarioBase || '0');
                return (
                  <tr key={c.id} className="border-b hover:bg-muted/20">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-medium">{c.nomeCompleto}</td>
                    <td className="p-2 text-right">{formatCurrency(sal)}</td>
                    <td className="p-2 text-right">{formatCurrency(sal * 0.288)}</td>
                    <td className="p-2 text-right">{formatCurrency(sal * 0.08)}</td>
                    <td className="p-2 text-right font-semibold text-orange-700">{formatCurrency(sal * 0.368)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td colSpan={2} className="p-2">Total</td>
                <td className="p-2 text-right">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0'), 0))}</td>
                <td className="p-2 text-right">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0') * 0.288, 0))}</td>
                <td className="p-2 text-right">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0') * 0.08, 0))}</td>
                <td className="p-2 text-right text-orange-700">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0') * 0.368, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'vt') {
      const vtColabs = ativos.filter(c => c.valeTransporte);
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200 text-sm">
            <p className="font-medium text-purple-800">Estimativa de Vale Transporte:</p>
            <p className="text-purple-700 mt-1">Custo médio estimado: R$ 300,00/mês por colaborador com VT ativo</p>
          </div>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-left p-2 font-semibold">Cargo</th>
                <th className="text-right p-2 font-semibold">Custo VT Estimado</th>
              </tr>
            </thead>
            <tbody>
              {vtColabs.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum colaborador com VT ativo.</td></tr>
              ) : vtColabs.map((c, i) => (
                <tr key={c.id} className="border-b hover:bg-muted/20">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{c.nomeCompleto}</td>
                  <td className="p-2 text-muted-foreground">{c.cargo || '—'}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(300)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td colSpan={3} className="p-2">Total ({vtColabs.length} colaboradores com VT)</td>
                <td className="p-2 text-right text-purple-700">{formatCurrency(vtColabs.length * 300)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'provisao13') {
      const sorted = [...ativos].sort((a, b) => parseFloat(b.salarioBase || '0') - parseFloat(a.salarioBase || '0'));
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm">
            <p className="font-medium text-yellow-800">Fórmula de cálculo:</p>
            <p className="text-yellow-700 mt-1">Provisão 13º = Salário Base ÷ 12 (provisionamento mensal para pagamento em dezembro)</p>
          </div>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-right p-2 font-semibold">Salário Base</th>
                <th className="text-right p-2 font-semibold">Provisão Mensal (1/12)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const sal = parseFloat(c.salarioBase || '0');
                return (
                  <tr key={c.id} className="border-b hover:bg-muted/20">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-medium">{c.nomeCompleto}</td>
                    <td className="p-2 text-right">{formatCurrency(sal)}</td>
                    <td className="p-2 text-right font-semibold text-yellow-700">{formatCurrency(sal / 12)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td colSpan={2} className="p-2">Total</td>
                <td className="p-2 text-right">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0'), 0))}</td>
                <td className="p-2 text-right text-yellow-700">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0') / 12, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'provisaoFerias') {
      const sorted = [...ativos].sort((a, b) => parseFloat(b.salarioBase || '0') - parseFloat(a.salarioBase || '0'));
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <p className="font-medium text-blue-800">Fórmula de cálculo:</p>
            <p className="text-blue-700 mt-1">Provisão Férias = (Salário Base ÷ 12) × 4/3 (inclui 1/3 constitucional)</p>
          </div>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-right p-2 font-semibold">Salário Base</th>
                <th className="text-right p-2 font-semibold">Provisão (1/12)</th>
                <th className="text-right p-2 font-semibold">+ 1/3 Constitucional</th>
                <th className="text-right p-2 font-semibold">Total Mensal</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const sal = parseFloat(c.salarioBase || '0');
                const prov = sal / 12;
                const terco = prov / 3;
                return (
                  <tr key={c.id} className="border-b hover:bg-muted/20">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-medium">{c.nomeCompleto}</td>
                    <td className="p-2 text-right">{formatCurrency(sal)}</td>
                    <td className="p-2 text-right">{formatCurrency(prov)}</td>
                    <td className="p-2 text-right">{formatCurrency(terco)}</td>
                    <td className="p-2 text-right font-semibold text-blue-700">{formatCurrency(prov + terco)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-bold">
                <td colSpan={2} className="p-2">Total</td>
                <td className="p-2 text-right">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0'), 0))}</td>
                <td className="p-2 text-right">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0') / 12, 0))}</td>
                <td className="p-2 text-right">{formatCurrency(sorted.reduce((s, c) => s + parseFloat(c.salarioBase || '0') / 12 / 3, 0))}</td>
                <td className="p-2 text-right text-blue-700">{formatCurrency(sorted.reduce((s, c) => s + (parseFloat(c.salarioBase || '0') / 12) * (4 / 3), 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'ferias') {
      const targetMes = mes;
      const feriasFiltered = targetMes
        ? feriasList.filter(f => {
            if (!f.periodo1Inicio) return false;
            const dt = new Date(f.periodo1Inicio + 'T12:00:00');
            return dt.getMonth() + 1 === targetMes && dt.getFullYear() === anoSelecionado;
          })
        : feriasList.filter(f => {
            if (!f.periodo1Inicio) return false;
            const dt = new Date(f.periodo1Inicio + 'T12:00:00');
            return dt.getFullYear() === anoSelecionado;
          });
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-left p-2 font-semibold">Período</th>
                <th className="text-right p-2 font-semibold">Dias</th>
                <th className="text-right p-2 font-semibold">Salário Base</th>
                <th className="text-right p-2 font-semibold">Custo Férias + 1/3</th>
              </tr>
            </thead>
            <tbody>
              {feriasFiltered.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhuma férias programada {targetMes ? `para ${MESES[targetMes - 1]}` : `em ${anoSelecionado}`}.</td></tr>
              ) : feriasFiltered.map((f: any, i: number) => {
                const colab = colabList.find(c => c.id === f.colaboradorId);
                const sal = parseFloat(colab?.salarioBase || '0');
                const dias = f.periodo1Dias || f.diasTotais || 30;
                const salDiario = sal / 30;
                const custo = salDiario * dias * (4 / 3);
                return (
                  <tr key={f.id} className="border-b hover:bg-muted/20">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-medium">{colab?.nomeCompleto || 'N/A'}</td>
                    <td className="p-2">{formatDateBR(f.periodo1Inicio)} a {formatDateBR(f.periodo1Fim)}</td>
                    <td className="p-2 text-right">{dias}</td>
                    <td className="p-2 text-right">{formatCurrency(sal)}</td>
                    <td className="p-2 text-right font-semibold text-yellow-700">{formatCurrency(custo)}</td>
                  </tr>
                );
              })}
            </tbody>
            {feriasFiltered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 bg-muted/30 font-bold">
                  <td colSpan={5} className="p-2">Total</td>
                  <td className="p-2 text-right text-yellow-700">{formatCurrency(feriasFiltered.reduce((s: number, f: any) => {
                    const colab = colabList.find(c => c.id === f.colaboradorId);
                    const sal = parseFloat(colab?.salarioBase || '0');
                    const dias = f.periodo1Dias || f.diasTotais || 30;
                    return s + (sal / 30) * dias * (4 / 3);
                  }, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      );
    }

    if (type === 'rescisoes') {
      const targetMes = mes;
      const rescFiltered = targetMes
        ? rescisoesList.filter(r => {
            if (!r.dataDesligamento) return false;
            const dt = new Date(r.dataDesligamento + 'T12:00:00');
            return dt.getMonth() + 1 === targetMes && dt.getFullYear() === anoSelecionado;
          })
        : rescisoesList.filter(r => {
            if (!r.dataDesligamento) return false;
            const dt = new Date(r.dataDesligamento + 'T12:00:00');
            return dt.getFullYear() === anoSelecionado;
          });
      return (
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-semibold">#</th>
                <th className="text-left p-2 font-semibold">Colaborador</th>
                <th className="text-left p-2 font-semibold">Data Desligamento</th>
                <th className="text-left p-2 font-semibold">Tipo</th>
                <th className="text-right p-2 font-semibold">Total Líquido</th>
              </tr>
            </thead>
            <tbody>
              {rescFiltered.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Nenhuma rescisão {targetMes ? `em ${MESES[targetMes - 1]}` : `em ${anoSelecionado}`}.</td></tr>
              ) : rescFiltered.map((r: any, i: number) => (
                <tr key={r.id} className="border-b hover:bg-muted/20">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{r.colaboradorNome}</td>
                  <td className="p-2">{formatDateBR(r.dataDesligamento)}</td>
                  <td className="p-2">{r.tipoDesligamento?.replace(/_/g, ' ')}</td>
                  <td className="p-2 text-right font-semibold text-red-700">{formatCurrency(parseFloat(r.totalLiquido || '0'))}</td>
                </tr>
              ))}
            </tbody>
            {rescFiltered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 bg-muted/30 font-bold">
                  <td colSpan={4} className="p-2">Total</td>
                  <td className="p-2 text-right text-red-700">{formatCurrency(rescFiltered.reduce((s: number, r: any) => s + parseFloat(r.totalLiquido || '0'), 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      );
    }

    if (type === 'apontamentos') {
      const targetMes = mes || (isCurrentYear ? currentMonth + 1 : 1);
      const apontMes = apontList.filter(a => a.mesReferencia === targetMes && a.anoReferencia === anoSelecionado);
      const proventos = apontMes.filter(a => a.natureza === 'provento');
      const descontos = apontMes.filter(a => a.natureza === 'desconto');
      return (
        <div className="max-h-[60vh] overflow-y-auto space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-green-700 mb-2">Proventos — {MESES[targetMes - 1]}</h4>
            {proventos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum provento registrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30"><th className="text-left p-2">Colaborador</th><th className="text-left p-2">Descrição</th><th className="text-right p-2">Valor</th></tr></thead>
                <tbody>
                  {proventos.map((a: any) => {
                    const colab = colabList.find(c => c.id === a.colaboradorId);
                    return (
                      <tr key={a.id} className="border-b"><td className="p-2">{colab?.nomeCompleto || 'N/A'}</td><td className="p-2">{a.descricao || a.tipo}</td><td className="p-2 text-right text-green-700">{formatCurrency(parseFloat(a.valor || '0'))}</td></tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-red-700 mb-2">Descontos — {MESES[targetMes - 1]}</h4>
            {descontos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum desconto registrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30"><th className="text-left p-2">Colaborador</th><th className="text-left p-2">Descrição</th><th className="text-right p-2">Valor</th></tr></thead>
                <tbody>
                  {descontos.map((a: any) => {
                    const colab = colabList.find(c => c.id === a.colaboradorId);
                    return (
                      <tr key={a.id} className="border-b"><td className="p-2">{colab?.nomeCompleto || 'N/A'}</td><td className="p-2">{a.descricao || a.tipo}</td><td className="p-2 text-right text-red-700">{formatCurrency(parseFloat(a.valor || '0'))}</td></tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      );
    }

    return null;
  }

  // Clickable cell helper
  function ClickableValue({ value, type, mes, label }: { value: number; type: DrillDownType; mes?: number; label?: string }) {
    return (
      <button
        onClick={() => setDrillDown({ type, mes, titulo: label || '' })}
        className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded px-1 py-0.5 transition-colors group relative"
        title="Clique para ver a memória de cálculo"
      >
        <span className="group-hover:underline">{formatCurrency(value)}</span>
        <Eye className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drill-down dialog */}
      <Dialog open={!!drillDown} onOpenChange={open => { if (!open) setDrillDown(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Memória de Cálculo — {drillDown?.titulo}
            </DialogTitle>
          </DialogHeader>
          {renderDrillDown()}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600" /> Projeção Financeira da Folha
          </h1>
          <p className="text-muted-foreground">Projeção mensal e anual de custos com pessoal</p>
        </div>
        <Select value={String(anoSelecionado)} onValueChange={v => setAnoSelecionado(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {anosDisponiveis.map(ano => (
              <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Custo Mensal Estimado{isCurrentYear ? ` — ${MESES[currentMonth]}` : ''}</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(projecaoMesDisplay.totalMensal)}</p>
                {projecaoMesAnterior && isCurrentYear && (
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
                <p className="text-xl font-bold text-orange-700">{formatCurrency(projecaoMesDisplay.encargos + projecaoMesDisplay.provisao13 + projecaoMesDisplay.provisaoFerias)}</p>
                <p className="text-xs text-muted-foreground mt-1">INSS + FGTS + 13º + Férias</p>
              </div>
              <PiggyBank className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Composição do Custo — {isCurrentYear ? MESES[currentMonth] : 'Janeiro'} {anoSelecionado}
            <span className="text-xs text-muted-foreground font-normal ml-2">(clique nos valores para ver a memória de cálculo)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Custos Fixos</h4>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> Salários Base</span>
                <ClickableValue value={projecaoMesDisplay.custoSalarial} type="salarios" label="Salários Base" />
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /> Comissões</span>
                <ClickableValue value={projecaoMesDisplay.custoComissoes} type="comissoes" label="Comissões" />
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-teal-500" /> Adicionais</span>
                <ClickableValue value={projecaoMesDisplay.custoAdicionais} type="adicionais" label="Adicionais" />
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><PiggyBank className="w-4 h-4 text-orange-500" /> Encargos (INSS + FGTS)</span>
                <ClickableValue value={projecaoMesDisplay.encargos} type="encargos" label="Encargos (INSS + FGTS)" />
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-purple-500" /> Vale Transporte</span>
                <ClickableValue value={projecaoMesDisplay.custoVT} type="vt" label="Vale Transporte" />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Provisões e Eventos</h4>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-yellow-500" /> Provisão 13º Salário</span>
                <ClickableValue value={projecaoMesDisplay.provisao13} type="provisao13" label="Provisão 13º Salário" />
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-500" /> Provisão Férias</span>
                <ClickableValue value={projecaoMesDisplay.provisaoFerias} type="provisaoFerias" label="Provisão Férias" />
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-yellow-600" /> Férias Programadas ({projecaoMesDisplay.feriasMes})</span>
                <ClickableValue value={projecaoMesDisplay.custoFerias} type="ferias" mes={isCurrentYear ? currentMonth + 1 : 1} label={`Férias Programadas — ${isCurrentYear ? MESES[currentMonth] : 'Janeiro'} ${anoSelecionado}`} />
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /> Rescisões ({projecaoMesDisplay.rescisoesMes})</span>
                <ClickableValue value={projecaoMesDisplay.custoRescisoes} type="rescisoes" mes={isCurrentYear ? currentMonth + 1 : 1} label={`Rescisões — ${isCurrentYear ? MESES[currentMonth] : 'Janeiro'} ${anoSelecionado}`} />
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-600" /> Apontamentos (proventos - descontos)</span>
                <ClickableValue value={projecaoMesDisplay.proventosMes - projecaoMesDisplay.descontosMes} type="apontamentos" mes={isCurrentYear ? currentMonth + 1 : 1} label={`Apontamentos — ${isCurrentYear ? MESES[currentMonth] : 'Janeiro'} ${anoSelecionado}`} />
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Estimado — {isCurrentYear ? MESES[currentMonth] : 'Janeiro'}</span>
              <span className="text-2xl font-bold text-blue-700">{formatCurrency(projecaoMesDisplay.totalMensal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly projection table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Projeção Mensal — {anoSelecionado}
            <span className="text-xs text-muted-foreground font-normal ml-2">(clique nos valores para detalhamento)</span>
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
                {projecaoMensal.map((m, idx) => {
                  const isAtual = isCurrentYear && idx === currentMonth;
                  return (
                    <tr key={m.mes} className={`border-b hover:bg-muted/20 ${isAtual ? 'bg-blue-50/50 font-medium' : ''}`}>
                      <td className="p-3 flex items-center gap-2">
                        {m.mes}
                        {isAtual && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Atual</Badge>}
                      </td>
                      <td className="text-right p-3">
                        <ClickableValue value={m.custoSalarial + m.custoComissoes + m.custoAdicionais} type="salarios" label={`Salários — ${m.mes} ${anoSelecionado}`} />
                      </td>
                      <td className="text-right p-3">
                        <ClickableValue value={m.encargos} type="encargos" label={`Encargos — ${m.mes} ${anoSelecionado}`} />
                      </td>
                      <td className="text-right p-3">
                        <ClickableValue value={m.custoVT + m.proventosMes - m.descontosMes} type="vt" label={`Benefícios — ${m.mes} ${anoSelecionado}`} />
                      </td>
                      <td className="text-right p-3">
                        <ClickableValue value={m.provisao13 + m.provisaoFerias} type="provisao13" label={`Provisões — ${m.mes} ${anoSelecionado}`} />
                      </td>
                      <td className="text-right p-3">
                        {m.custoFerias > 0 ? (
                          <ClickableValue value={m.custoFerias} type="ferias" mes={m.mesNum} label={`Férias — ${m.mes} ${anoSelecionado}`} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-right p-3">
                        {m.custoRescisoes > 0 ? (
                          <ClickableValue value={m.custoRescisoes} type="rescisoes" mes={m.mesNum} label={`Rescisões — ${m.mes} ${anoSelecionado}`} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-right p-3 font-semibold">{formatCurrency(m.totalMensal)}</td>
                    </tr>
                  );
                })}
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

      {/* Upcoming events - 6 months */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-yellow-600" /> Férias Programadas (próximos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const proxFerias = feriasList.filter(f => {
                if (!f.periodo1Inicio) return false;
                const dt = new Date(f.periodo1Inicio + 'T12:00:00');
                const diff = (dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                return diff >= -180 && diff <= 180;
              }).sort((a: any, b: any) => {
                const da = new Date(a.periodo1Inicio + 'T12:00:00').getTime();
                const db = new Date(b.periodo1Inicio + 'T12:00:00').getTime();
                return da - db;
              });
              if (proxFerias.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma férias nos últimos/próximos 6 meses.</p>;
              return (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {proxFerias.map((f: any) => {
                    const colab = colabList.find(c => c.id === f.colaboradorId);
                    const salDiario = parseFloat(colab?.salarioBase || '0') / 30;
                    const dias = f.periodo1Dias || f.diasTotais || 30;
                    const custo = salDiario * dias * (4 / 3);
                    const dt = new Date(f.periodo1Inicio + 'T12:00:00');
                    const isPast = dt.getTime() < now.getTime();
                    return (
                      <div key={f.id} className={`flex items-center justify-between p-2 rounded border ${isPast ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-100'}`}>
                        <div>
                          <p className="text-sm font-medium">{colab?.nomeCompleto || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{formatDateBR(f.periodo1Inicio)} — {dias} dias {isPast ? '(passado)' : ''}</p>
                        </div>
                        <span className={`font-semibold text-sm ${isPast ? 'text-gray-500' : 'text-yellow-700'}`}>{formatCurrency(custo)}</span>
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
              <AlertTriangle className="w-5 h-5 text-red-600" /> Rescisões (últimos e próximos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const recentes = rescisoesList.filter(r => {
                if (!r.dataDesligamento) return false;
                const dt = new Date(r.dataDesligamento + 'T12:00:00');
                const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
                return diff >= -180 && diff <= 180;
              }).sort((a: any, b: any) => {
                const da = new Date(a.dataDesligamento + 'T12:00:00').getTime();
                const db = new Date(b.dataDesligamento + 'T12:00:00').getTime();
                return db - da;
              });
              if (recentes.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma rescisão nos últimos/próximos 6 meses.</p>;
              return (
                <div className="space-y-2 max-h-64 overflow-y-auto">
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
                Projeção disponível para os próximos 5 anos a partir do ano corrente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
