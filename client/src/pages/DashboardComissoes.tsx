import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/CurrencyInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DollarSign, Users, TrendingUp, Award, Search, Loader2,
  BarChart3, Trophy, CheckCircle2, Clock, Filter, X, FileDown, FileSpreadsheet,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus, Target, Plus, Trash2, Edit2, GitCompareArrows,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line,
} from 'recharts';
const loadJsPDF = () => import('jspdf');
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function DeltaIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value > 0) return <span className="inline-flex items-center text-green-600 text-xs font-medium"><ArrowUpRight className="w-3 h-3" />+{value.toFixed(1)}{suffix}</span>;
  if (value < 0) return <span className="inline-flex items-center text-red-600 text-xs font-medium"><ArrowDownRight className="w-3 h-3" />{value.toFixed(1)}{suffix}</span>;
  return <span className="inline-flex items-center text-muted-foreground text-xs font-medium"><Minus className="w-3 h-3" />0{suffix}</span>;
}

function MetaProgressBar({ percentual }: { percentual: number }) {
  const color = percentual >= 100 ? 'bg-green-500' : percentual >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const bgColor = percentual >= 100 ? 'bg-green-100 dark:bg-green-900/20' : percentual >= 50 ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-red-100 dark:bg-red-900/20';
  return (
    <div className="w-full">
      <div className={`w-full h-2.5 rounded-full ${bgColor}`}>
        <div className={`h-2.5 rounded-full ${color} transition-all`} style={{ width: `${Math.min(percentual, 100)}%` }} />
      </div>
      <span className={`text-xs font-medium mt-0.5 block ${percentual >= 100 ? 'text-green-600' : percentual >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
        {percentual.toFixed(1)}%
      </span>
    </div>
  );
}

// ---- META DIALOG ----
function MetaDialog({ parceiros, onCreated }: { parceiros: { id: number; nome: string }[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [parceiroId, setParceiroId] = useState('');
  const [tipo, setTipo] = useState<string>('mensal');
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [trimestre, setTrimestre] = useState('1');
  const [valorMeta, setValorMeta] = useState('');
  const [observacao, setObservacao] = useState('');

  const createMeta = trpc.comissoesDashboard.createMeta.useMutation({
    onSuccess: () => {
      toast.success('Meta criada com sucesso');
      onCreated();
      setOpen(false);
      setParceiroId('');
      setValorMeta('');
      setObservacao('');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!parceiroId || !valorMeta || !ano) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMeta.mutate({
      parceiroId: Number(parceiroId),
      tipo: tipo as any,
      ano: Number(ano),
      mes: tipo === 'mensal' ? Number(mes) : undefined,
      trimestre: tipo === 'trimestral' ? Number(trimestre) : undefined,
      valorMeta,
      observacao: observacao || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Definir Meta de Comissão
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Parceiro *</label>
            <Select value={parceiroId} onValueChange={setParceiroId}>
              <SelectTrigger><SelectValue placeholder="Selecione o parceiro" /></SelectTrigger>
              <SelectContent>
                {parceiros.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo *</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ano *</label>
              <Input type="number" value={ano} onChange={e => setAno(e.target.value)} min={2020} max={2030} />
            </div>
          </div>
          {tipo === 'mensal' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mês</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {tipo === 'trimestral' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Trimestre</label>
              <Select value={trimestre} onValueChange={setTrimestre}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° Trimestre (Jan-Mar)</SelectItem>
                  <SelectItem value="2">2° Trimestre (Abr-Jun)</SelectItem>
                  <SelectItem value="3">3° Trimestre (Jul-Set)</SelectItem>
                  <SelectItem value="4">4° Trimestre (Out-Dez)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Valor da Meta (R$) *</label>
            <CurrencyInput value={valorMeta} onChange={val => setValorMeta(val)} placeholder="R$ 0,00" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Observação</label>
            <Input value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observação opcional..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={createMeta.isPending}>
            {createMeta.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Target className="w-4 h-4 mr-1.5" />}
            Salvar Meta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardComissoes() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoParceiro, setTipoParceiro] = useState<string>('');
  const [modeloParceriaId, setModeloParceriaId] = useState<string>('');

  // Applied filters (only sent to backend on "Aplicar")
  const [appliedFilters, setAppliedFilters] = useState<{
    dataInicio?: string;
    dataFim?: string;
    tipoParceiro?: 'pf' | 'pj';
    modeloParceriaId?: number;
  }>({});

  // Comparison state
  const [compPeriodoAInicio, setCompPeriodoAInicio] = useState('');
  const [compPeriodoAFim, setCompPeriodoAFim] = useState('');
  const [compPeriodoBInicio, setCompPeriodoBInicio] = useState('');
  const [compPeriodoBFim, setCompPeriodoBFim] = useState('');
  const [compApplied, setCompApplied] = useState(false);
  const [compFilters, setCompFilters] = useState<{
    periodoA: { dataInicio: string; dataFim: string };
    periodoB: { dataInicio: string; dataFim: string };
  } | null>(null);

  // Goals state
  const [metaAno, setMetaAno] = useState(new Date().getFullYear());
  const [metaMes, setMetaMes] = useState<number | undefined>(new Date().getMonth() + 1);

  const queryInput = useMemo(() => {
    const f: any = {};
    if (appliedFilters.dataInicio) f.dataInicio = appliedFilters.dataInicio;
    if (appliedFilters.dataFim) f.dataFim = appliedFilters.dataFim;
    if (appliedFilters.tipoParceiro) f.tipoParceiro = appliedFilters.tipoParceiro;
    if (appliedFilters.modeloParceriaId) f.modeloParceriaId = appliedFilters.modeloParceriaId;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [appliedFilters]);

  const { data, isLoading } = trpc.comissoesDashboard.consolidated.useQuery(queryInput);

  // Comparison query
  const compQueryInput = useMemo(() => {
    if (!compFilters) return undefined;
    return {
      periodoA: compFilters.periodoA,
      periodoB: compFilters.periodoB,
      tipoParceiro: appliedFilters.tipoParceiro,
      modeloParceriaId: appliedFilters.modeloParceriaId,
    };
  }, [compFilters, appliedFilters]);

  const { data: compData, isLoading: compLoading } = trpc.comissoesDashboard.comparativo.useQuery(
    compQueryInput!,
    { enabled: !!compQueryInput }
  );

  // Goals query
  const metasInput = useMemo(() => ({
    ano: metaAno,
    mes: metaMes,
  }), [metaAno, metaMes]);

  const { data: metasData, isLoading: metasLoading, refetch: refetchMetas } = trpc.comissoesDashboard.metasProgresso.useQuery(metasInput);

  const { data: allMetas, refetch: refetchAllMetas } = trpc.comissoesDashboard.listMetas.useQuery({});

  const deleteMeta = trpc.comissoesDashboard.deleteMeta.useMutation({
    onSuccess: () => {
      toast.success('Meta excluída');
      refetchMetas();
      refetchAllMetas();
    },
    onError: (e) => toast.error(e.message),
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.dataInicio || appliedFilters.dataFim) count++;
    if (appliedFilters.tipoParceiro) count++;
    if (appliedFilters.modeloParceriaId) count++;
    return count;
  }, [appliedFilters]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      tipoParceiro: (tipoParceiro as 'pf' | 'pj') || undefined,
      modeloParceriaId: modeloParceriaId ? Number(modeloParceriaId) : undefined,
    });
  }, [dataInicio, dataFim, tipoParceiro, modeloParceriaId]);

  const handleClearFilters = useCallback(() => {
    setDataInicio('');
    setDataFim('');
    setTipoParceiro('');
    setModeloParceriaId('');
    setAppliedFilters({});
  }, []);

  const handleApplyComparison = useCallback(() => {
    if (!compPeriodoAInicio || !compPeriodoAFim || !compPeriodoBInicio || !compPeriodoBFim) {
      toast.error('Preencha todos os campos de período para comparar');
      return;
    }
    setCompFilters({
      periodoA: { dataInicio: compPeriodoAInicio, dataFim: compPeriodoAFim },
      periodoB: { dataInicio: compPeriodoBInicio, dataFim: compPeriodoBFim },
    });
    setCompApplied(true);
  }, [compPeriodoAInicio, compPeriodoAFim, compPeriodoBInicio, compPeriodoBFim]);

  const filteredRanking = useMemo(() => {
    if (!data?.ranking) return [];
    if (!searchQuery.trim()) return data.ranking;
    const q = searchQuery.toLowerCase();
    return data.ranking.filter((p: any) => p.nome.toLowerCase().includes(q));
  }, [data?.ranking, searchQuery]);

  // Parceiros list for meta dialog
  const parceirosForMeta = useMemo(() => {
    if (!data?.parceiros) return [];
    return data.parceiros.map((p: any) => ({ id: p.id, nome: p.nome }));
  }, [data?.parceiros]);

  // Export to CSV (Excel compatible)
  const handleExportExcel = useCallback(() => {
    if (!data) return;
    const summary = (data as any).kpis;
    const ranking = (data as any).ranking || [];

    const BOM = '\uFEFF';
    let csv = BOM;

    csv += 'Dashboard de Comissões - Evox Fiscal\n';
    csv += `Gerado em;${new Date().toLocaleString('pt-BR')}\n`;
    if (appliedFilters.dataInicio || appliedFilters.dataFim) {
      csv += `Período;${appliedFilters.dataInicio || 'Início'} a ${appliedFilters.dataFim || 'Atual'}\n`;
    }
    if (appliedFilters.tipoParceiro) csv += `Tipo Parceiro;${appliedFilters.tipoParceiro === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}\n`;
    csv += '\n';

    csv += 'INDICADORES GERAIS\n';
    csv += `Valor Total Aprovado;${formatCurrency(summary.valorTotalAprovado)}\n`;
    csv += `Valor Pendente;${formatCurrency(summary.valorTotalPendente)}\n`;
    csv += `Aprovações;${summary.totalAprovadas}\n`;
    csv += `Pendentes;${summary.totalPendentes}\n`;
    csv += `Rejeitadas;${summary.totalRejeitadas}\n`;
    csv += `Parceiros Ativos;${summary.parceirosAtivos} de ${summary.totalParceiros}\n`;
    csv += '\n';

    csv += 'RANKING DE PARCEIROS\n';
    csv += '#;Parceiro;Tipo;Status;Modelo;Clientes Ativos;Total Clientes;Serviços;Aprovadas;Pendentes;Valor Aprovado\n';
    ranking.forEach((p: any, idx: number) => {
      csv += `${idx + 1};${p.nome};${p.tipo === 'pj' ? 'PJ' : 'PF'};${p.status === 'ativo' ? 'Ativo' : 'Inativo'};${p.modelo};${p.clientesAtivos};${p.totalClientes};${p.servicosAutorizados};${p.aprovadas};${p.pendentes};${formatCurrency(p.valorTotalAprovado)}\n`;
    });
    csv += '\n';

    const monthlyEvolution = (data as any).evolucaoMensal || [];
    csv += 'EVOLUÇÃO MENSAL\n';
    csv += 'Mês;Valor;Quantidade\n';
    monthlyEvolution.forEach((m: any) => {
      csv += `${m.month};${formatCurrency(m.valor)};${m.quantidade}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-comissoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, appliedFilters]);

  // Export to PDF
  const handleExportPdf = useCallback(async () => {
    if (!data) return;
    const { default: jsPDF } = await loadJsPDF();
    const summary = (data as any).kpis;
    const ranking = (data as any).ranking || [];
    const monthlyEvolution = (data as any).evolucaoMensal || [];

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard de Comissões', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, y);
    y += 5;

    const filterLabels: string[] = [];
    if (appliedFilters.dataInicio || appliedFilters.dataFim) {
      filterLabels.push(`Período: ${appliedFilters.dataInicio || 'Início'} a ${appliedFilters.dataFim || 'Atual'}`);
    }
    if (appliedFilters.tipoParceiro) {
      filterLabels.push(`Tipo: ${appliedFilters.tipoParceiro === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}`);
    }
    if (appliedFilters.modeloParceriaId) {
      const modelo = (data as any).modelos?.find((m: any) => m.id === appliedFilters.modeloParceriaId);
      if (modelo) filterLabels.push(`Modelo: ${modelo.nome}`);
    }
    if (filterLabels.length > 0) {
      doc.text(`Filtros: ${filterLabels.join(' | ')}`, 14, y);
      y += 5;
    }
    y += 5;

    doc.setTextColor(0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores Gerais', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const kpiData = [
      ['Valor Total Aprovado', formatCurrency(summary.valorTotalAprovado)],
      ['Valor Pendente', formatCurrency(summary.valorTotalPendente)],
      ['Aprovações', String(summary.totalAprovadas)],
      ['Pendentes', String(summary.totalPendentes)],
      ['Rejeitadas', String(summary.totalRejeitadas)],
      ['Parceiros Ativos', `${summary.parceirosAtivos} de ${summary.totalParceiros}`],
    ];
    kpiData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 14, y);
      y += 5;
    });
    y += 8;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Evolução Mensal', 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Mês', 14, y);
    doc.text('Valor', 80, y);
    doc.text('Qtd', 140, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    monthlyEvolution.forEach((m: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(m.month, 14, y);
      doc.text(formatCurrency(m.valor), 80, y);
      doc.text(String(m.quantidade), 140, y);
      y += 4.5;
    });
    y += 8;

    if (y > 200) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Ranking de Parceiros', 14, y);
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 14, y);
    doc.text('Parceiro', 22, y);
    doc.text('Tipo', 80, y);
    doc.text('Aprovadas', 100, y);
    doc.text('Pendentes', 125, y);
    doc.text('Valor Aprovado', 150, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    ranking.forEach((p: any, idx: number) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(String(idx + 1), 14, y);
      doc.text(p.nome.length > 25 ? p.nome.slice(0, 25) + '...' : p.nome, 22, y);
      doc.text(p.tipo === 'pj' ? 'PJ' : 'PF', 80, y);
      doc.text(String(p.aprovadas), 100, y);
      doc.text(String(p.pendentes), 125, y);
      doc.text(formatCurrency(p.valorTotalAprovado), 150, y);
      y += 4.5;
    });

    doc.save(`dashboard-comissoes-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [data, appliedFilters]);

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
  const modelos = (data as any).modelos || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            Dashboard de Comissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão consolidada de todas as comissões por parceiro com evolução mensal e ranking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!data}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={!data}>
            <FileDown className="w-4 h-4 mr-1.5" />
            PDF
          </Button>
          <Button
            variant={activeFilterCount > 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1.5" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full">
                {activeFilterCount}
              </Badge>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Início</label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Fim</label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo Parceiro</label>
                <Select value={tipoParceiro} onValueChange={setTipoParceiro}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pf">Pessoa Física (PF)</SelectItem>
                    <SelectItem value="pj">Pessoa Jurídica (PJ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modelo de Parceria</label>
                <Select value={modeloParceriaId} onValueChange={setModeloParceriaId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {modelos.map((m: any) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button size="sm" onClick={handleApplyFilters}>
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Aplicar Filtros
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="w-3.5 h-3.5 mr-1.5" />
                Limpar
              </Button>
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-1.5 ml-2">
                  {appliedFilters.dataInicio && <Badge variant="secondary" className="text-xs">De: {appliedFilters.dataInicio}</Badge>}
                  {appliedFilters.dataFim && <Badge variant="secondary" className="text-xs">Até: {appliedFilters.dataFim}</Badge>}
                  {appliedFilters.tipoParceiro && <Badge variant="secondary" className="text-xs">{appliedFilters.tipoParceiro === 'pf' ? 'PF' : 'PJ'}</Badge>}
                  {appliedFilters.modeloParceriaId && (
                    <Badge variant="secondary" className="text-xs">
                      Modelo: {modelos.find((m: any) => m.id === appliedFilters.modeloParceriaId)?.nome || appliedFilters.modeloParceriaId}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Dashboard | Comparativo | Metas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="flex items-center gap-1.5">
            <GitCompareArrows className="w-4 h-4" />
            Comparativo
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            Metas
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB: DASHBOARD ===== */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
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
                            {idx === 0 ? <span className="text-amber-500 font-bold text-lg">1</span> :
                             idx === 1 ? <span className="text-gray-400 font-bold text-lg">2</span> :
                             idx === 2 ? <span className="text-amber-700 font-bold text-lg">3</span> :
                             <span className="text-muted-foreground">{idx + 1}</span>}
                          </TableCell>
                          <TableCell className="font-medium">{p.nome}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">{p.tipo === 'pj' ? 'PJ' : 'PF'}</Badge>
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
        </TabsContent>

        {/* ===== TAB: COMPARATIVO ===== */}
        <TabsContent value="comparativo" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompareArrows className="w-5 h-5 text-primary" />
                Comparativo de Períodos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione dois períodos para comparar a evolução das comissões lado a lado.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Período A (Atual)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Início</label>
                      <Input type="date" value={compPeriodoAInicio} onChange={e => setCompPeriodoAInicio(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Fim</label>
                      <Input type="date" value={compPeriodoAFim} onChange={e => setCompPeriodoAFim(e.target.value)} className="h-9" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-4 rounded-lg border bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Período B (Referência)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Início</label>
                      <Input type="date" value={compPeriodoBInicio} onChange={e => setCompPeriodoBInicio(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Fim</label>
                      <Input type="date" value={compPeriodoBFim} onChange={e => setCompPeriodoBFim(e.target.value)} className="h-9" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleApplyComparison}>
                  <GitCompareArrows className="w-4 h-4 mr-1.5" />
                  Comparar Períodos
                </Button>
              </div>
            </CardContent>
          </Card>

          {compLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {compApplied && compData && (
            <>
              {/* Comparative KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor Aprovado</p>
                    <div className="flex items-end gap-3 mt-1">
                      <div>
                        <p className="text-xs text-blue-600">Período A</p>
                        <p className="text-lg font-bold">{formatCurrency(compData.periodoA.kpis.valorTotalAprovado)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Período B</p>
                        <p className="text-lg font-semibold text-muted-foreground">{formatCurrency(compData.periodoB.kpis.valorTotalAprovado)}</p>
                      </div>
                    </div>
                    <DeltaIndicator value={compData.deltas.valorTotalAprovado} />
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Aprovadas</p>
                    <div className="flex items-end gap-3 mt-1">
                      <div>
                        <p className="text-xs text-blue-600">Período A</p>
                        <p className="text-lg font-bold">{compData.periodoA.kpis.totalAprovadas}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Período B</p>
                        <p className="text-lg font-semibold text-muted-foreground">{compData.periodoB.kpis.totalAprovadas}</p>
                      </div>
                    </div>
                    <DeltaIndicator value={compData.deltas.totalAprovadas} />
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor Pendente</p>
                    <div className="flex items-end gap-3 mt-1">
                      <div>
                        <p className="text-xs text-blue-600">Período A</p>
                        <p className="text-lg font-bold">{formatCurrency(compData.periodoA.kpis.valorTotalPendente)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Período B</p>
                        <p className="text-lg font-semibold text-muted-foreground">{formatCurrency(compData.periodoB.kpis.valorTotalPendente)}</p>
                      </div>
                    </div>
                    <DeltaIndicator value={compData.deltas.valorTotalPendente} />
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Comissões</p>
                    <div className="flex items-end gap-3 mt-1">
                      <div>
                        <p className="text-xs text-blue-600">Período A</p>
                        <p className="text-lg font-bold">{compData.periodoA.kpis.totalComissoes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Período B</p>
                        <p className="text-lg font-semibold text-muted-foreground">{compData.periodoB.kpis.totalComissoes}</p>
                      </div>
                    </div>
                    <DeltaIndicator value={compData.deltas.totalComissoes} />
                  </CardContent>
                </Card>
              </div>

              {/* Comparative Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Evolução Comparativa (Valor Aprovado)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const maxLen = Math.max(compData.periodoA.evolucao.length, compData.periodoB.evolucao.length);
                    const chartData = Array.from({ length: maxLen }, (_, i) => ({
                      idx: i + 1,
                      periodoA: compData.periodoA.evolucao[i]?.valor || 0,
                      periodoB: compData.periodoB.evolucao[i]?.valor || 0,
                      labelA: compData.periodoA.evolucao[i]?.month || '',
                      labelB: compData.periodoB.evolucao[i]?.month || '',
                    }));
                    return chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="idx" tick={{ fontSize: 11 }} label={{ value: 'Mês #', position: 'insideBottom', offset: -5 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value: number, name: string) => [formatCurrency(value), name === 'periodoA' ? 'Período A' : 'Período B']}
                            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Legend formatter={(value) => value === 'periodoA' ? 'Período A' : 'Período B'} />
                          <Bar dataKey="periodoA" fill="#3b82f6" radius={[4, 4, 0, 0]} name="periodoA" />
                          <Bar dataKey="periodoB" fill="#10b981" radius={[4, 4, 0, 0]} name="periodoB" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">Nenhum dado para comparar</div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Comparative Ranking */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Ranking Comparativo por Parceiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parceiro</TableHead>
                          <TableHead className="text-center bg-blue-50/50 dark:bg-blue-900/10">Aprovadas (A)</TableHead>
                          <TableHead className="text-center bg-blue-50/50 dark:bg-blue-900/10">Valor (A)</TableHead>
                          <TableHead className="text-center bg-emerald-50/50 dark:bg-emerald-900/10">Aprovadas (B)</TableHead>
                          <TableHead className="text-center bg-emerald-50/50 dark:bg-emerald-900/10">Valor (B)</TableHead>
                          <TableHead className="text-right">Variação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compData.rankingComparativo.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum dado para comparar</TableCell>
                          </TableRow>
                        ) : (
                          compData.rankingComparativo.map((p: any) => (
                            <TableRow key={p.parceiroId} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{p.nome}</TableCell>
                              <TableCell className="text-center bg-blue-50/30 dark:bg-blue-900/5">{p.periodoA.aprovadas}</TableCell>
                              <TableCell className="text-center bg-blue-50/30 dark:bg-blue-900/5 font-medium">{formatCurrency(p.periodoA.valor)}</TableCell>
                              <TableCell className="text-center bg-emerald-50/30 dark:bg-emerald-900/5">{p.periodoB.aprovadas}</TableCell>
                              <TableCell className="text-center bg-emerald-50/30 dark:bg-emerald-900/5 font-medium">{formatCurrency(p.periodoB.valor)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-medium">{formatCurrency(p.deltaValor)}</span>
                                  <DeltaIndicator value={p.deltaPercentual} />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {compApplied && !compLoading && !compData && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum dado encontrado para os períodos selecionados.
            </div>
          )}

          {!compApplied && (
            <div className="text-center py-12 text-muted-foreground">
              <GitCompareArrows className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Selecione dois períodos acima e clique em "Comparar Períodos" para visualizar o comparativo.</p>
            </div>
          )}
        </TabsContent>

        {/* ===== TAB: METAS ===== */}
        <TabsContent value="metas" className="space-y-6 mt-4">
          {/* Meta Filters & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Metas de Comissões por Parceiro
                </CardTitle>
                <MetaDialog
                  parceiros={parceirosForMeta}
                  onCreated={() => { refetchMetas(); refetchAllMetas(); }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Defina metas mensais, trimestrais ou anuais e acompanhe o progresso de cada parceiro.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ano</label>
                  <Input
                    type="number"
                    value={metaAno}
                    onChange={e => setMetaAno(Number(e.target.value))}
                    className="h-9 w-24"
                    min={2020}
                    max={2030}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mês (opcional)</label>
                  <Select value={metaMes !== undefined ? String(metaMes) : 'all'} onValueChange={v => setMetaMes(v === 'all' ? undefined : Number(v))}>
                    <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
                      {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {metasLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Metas Progress Cards */}
          {metasData && metasData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metasData.map((m: any) => (
                <Card key={m.id} className={`border-l-4 ${m.status === 'atingida' ? 'border-l-green-500' : m.status === 'em_progresso' ? 'border-l-amber-500' : 'border-l-red-500'}`}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{m.parceiroNome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.tipo === 'mensal' ? `${['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m.mes || 0]}/${m.ano}` :
                           m.tipo === 'trimestral' ? `${m.trimestre}° Tri/${m.ano}` :
                           m.tipo === 'semestral' ? `Semestral/${m.ano}` :
                           `Anual/${m.ano}`}
                          {' '}({m.tipo})
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                        onClick={() => {
                          if (confirm('Excluir esta meta?')) deleteMeta.mutate({ id: m.id });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Meta: {formatCurrency(m.valorMeta)}</span>
                        <span className="font-medium">Realizado: {formatCurrency(m.realizado)}</span>
                      </div>
                      <MetaProgressBar percentual={m.percentual} />
                    </div>
                    {m.observacao && (
                      <p className="text-xs text-muted-foreground mt-2 italic">{m.observacao}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {metasData && metasData.length === 0 && !metasLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma meta definida para o período selecionado.</p>
              <p className="text-sm mt-1">Use o botão "Nova Meta" para definir metas de comissão.</p>
            </div>
          )}

          {/* All Metas Table */}
          {allMetas && allMetas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Todas as Metas Cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parceiro</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                        <TableHead className="text-center">Período</TableHead>
                        <TableHead className="text-right">Valor Meta</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMetas.map((m: any) => {
                        const parceiroNome = parceirosForMeta.find(p => p.id === m.parceiroId)?.nome || `#${m.parceiroId}`;
                        return (
                          <TableRow key={m.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{parceiroNome}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs capitalize">{m.tipo}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {m.tipo === 'mensal' ? `${['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m.mes || 0]}/${m.ano}` :
                               m.tipo === 'trimestral' ? `${m.trimestre}° Tri/${m.ano}` :
                               `${m.ano}`}
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(Number(m.valorMeta))}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{m.observacao || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                                onClick={() => {
                                  if (confirm('Excluir esta meta?')) {
                                    deleteMeta.mutate({ id: m.id });
                                  }
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
