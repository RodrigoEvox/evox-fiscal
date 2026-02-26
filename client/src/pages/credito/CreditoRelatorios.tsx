import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronRight, Loader2, Download, FileSpreadsheet, BarChart3,
  Filter, TrendingUp, DollarSign, ClipboardList, AlertTriangle, FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';
import BackToDashboard from '@/components/BackToDashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const FILAS_OPTIONS = [
  { value: 'all', label: 'Todas as Filas' },
  { value: 'apuracao', label: 'Apuração' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'retificacao', label: 'Retificação' },
  { value: 'compensacao', label: 'Compensação' },
  { value: 'ressarcimento', label: 'Ressarcimento' },
  { value: 'restituicao', label: 'Restituição' },
];

const CLASSIFICACAO_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'novo', label: 'Novo' },
  { value: 'base', label: 'Base' },
];

const STATUS_LABELS: Record<string, string> = {
  a_fazer: 'A Fazer', fazendo: 'Fazendo', feito: 'Feito', concluido: 'Concluído',
};

const FILA_LABELS: Record<string, string> = {
  apuracao: 'Apuração', onboarding: 'Onboarding', retificacao: 'Retificação',
  compensacao: 'Compensação', ressarcimento: 'Ressarcimento', restituicao: 'Restituição',
  revisao: 'Revisão', chamados: 'Chamados',
};

const PRIORIDADE_LABELS: Record<string, string> = {
  urgente: 'Urgente', alta: 'Alta', media: 'Média', baixa: 'Baixa',
};

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#a855f7',
];

const STATUS_COLORS: Record<string, string> = {
  a_fazer: '#f59e0b', fazendo: '#3b82f6', feito: '#8b5cf6', concluido: '#10b981',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span>{p.name}: <strong>{typeof p.value === 'number' && p.value > 100 ? `R$ ${p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : p.value}</strong></span>
        </p>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CreditoRelatorios() {
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [teseId, setTeseId] = useState('all');
  const [parceiroId, setParceiroId] = useState('all');
  const [classificacao, setClassificacao] = useState('all');
  const [segmento, setSegmento] = useState('all');
  const [fila, setFila] = useState('all');
  const [activeTab, setActiveTab] = useState('resumo');

  const filters = useMemo(() => ({
    periodoInicio: periodoInicio || undefined,
    periodoFim: periodoFim || undefined,
    teseId: teseId !== 'all' ? Number(teseId) : undefined,
    parceiroId: parceiroId !== 'all' ? Number(parceiroId) : undefined,
    classificacao: classificacao !== 'all' ? classificacao : undefined,
    segmento: segmento !== 'all' ? segmento : undefined,
    fila: fila !== 'all' ? fila : undefined,
  }), [periodoInicio, periodoFim, teseId, parceiroId, classificacao, segmento, fila]);

  const { data: reportData, isLoading } = trpc.creditRecovery.credito.reports.getData.useQuery(filters);
  const { data: teses } = trpc.teses.list.useQuery();
  const { data: parceiros } = trpc.parceiros.list.useQuery();
  const { data: segmentos } = trpc.creditRecovery.credito.reports.segmentos.useQuery();

  const report = reportData as any;
  const summary = report?.summary || {};
  const tasks = (report?.tasks || []) as any[];
  const ledger = (report?.ledger || []) as any[];

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  // Chart data transformations
  const filaChartData = useMemo(() => {
    return Object.entries(summary.porFila || {})
      .map(([key, val]: any) => ({ name: FILA_LABELS[key] || key, tarefas: val }))
      .sort((a, b) => b.tarefas - a.tarefas);
  }, [summary.porFila]);

  const statusChartData = useMemo(() => {
    return Object.entries(summary.porStatus || {})
      .map(([key, val]: any) => ({ name: STATUS_LABELS[key] || key, value: val, fill: STATUS_COLORS[key] || '#6b7280' }));
  }, [summary.porStatus]);

  const parceiroChartData = useMemo(() => {
    return Object.entries(summary.porParceiro || {})
      .map(([key, val]: any) => ({ name: key.length > 20 ? key.substring(0, 18) + '…' : key, tarefas: val }))
      .sort((a, b) => b.tarefas - a.tarefas)
      .slice(0, 8);
  }, [summary.porParceiro]);

  const segmentoChartData = useMemo(() => {
    return Object.entries(summary.porSegmento || {})
      .map(([key, val]: any) => ({ name: key.length > 20 ? key.substring(0, 18) + '…' : key, value: val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [summary.porSegmento]);

  const valorPorFilaData = useMemo(() => {
    if (!tasks.length) return [];
    const map: Record<string, { estimado: number; contratado: number }> = {};
    tasks.forEach((t: any) => {
      const f = t.fila || 'outros';
      if (!map[f]) map[f] = { estimado: 0, contratado: 0 };
      map[f].estimado += Number(t.valorEstimado || 0);
      map[f].contratado += Number(t.valorContratado || 0);
    });
    return Object.entries(map)
      .map(([key, val]) => ({ name: FILA_LABELS[key] || key, estimado: val.estimado, contratado: val.contratado }))
      .sort((a, b) => b.estimado - a.estimado);
  }, [tasks]);

  const exportCSV = () => {
    if (!tasks.length) return;
    const headers = ['Código', 'Fila', 'Título', 'Status', 'Prioridade', 'Responsável', 'Cliente', 'CNPJ', 'Parceiro', 'Segmento', 'Classificação', 'Valor Estimado', 'Valor Contratado', 'SLA', 'Criado em', 'Vencimento', 'Conclusão'];
    const rows = tasks.map(t => [
      t.codigo, FILA_LABELS[t.fila] || t.fila, `"${(t.titulo || '').replace(/"/g, '""')}"`,
      STATUS_LABELS[t.status] || t.status, PRIORIDADE_LABELS[t.prioridade] || t.prioridade,
      t.responsavelNome || '', `"${(t.clienteNome || '').replace(/"/g, '""')}"`, t.clienteCnpj || '',
      t.parceiroNome || '', t.segmento || '', t.classificacao || '',
      Number(t.valorEstimado || 0).toFixed(2), Number(t.valorContratado || 0).toFixed(2),
      t.slaStatus || '', formatDate(t.createdAt), formatDate(t.dataVencimento), formatDate(t.dataConclusao),
    ]);
    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-credito-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLedgerCSV = () => {
    if (!ledger.length) return;
    const headers = ['Tese', 'Grupo Débito', 'Status', 'Qtd', 'Estimado', 'Validado', 'Efetivado', 'Residual'];
    const rows = ledger.map((l: any) => [
      `"${(l.teseNome || '').replace(/"/g, '""')}"`, l.grupoDebito || '', l.status || '',
      l.qtd, Number(l.totalEstimado || 0).toFixed(2), Number(l.totalValidado || 0).toFixed(2),
      Number(l.totalEfetivado || 0).toFixed(2), Number(l.totalResidual || 0).toFixed(2),
    ]);
    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setPeriodoInicio('');
    setPeriodoFim('');
    setTeseId('all');
    setParceiroId('all');
    setClassificacao('all');
    setSegmento('all');
    setFila('all');
  };

  const hasActiveFilters = periodoInicio || periodoFim || teseId !== 'all' || parceiroId !== 'all' || classificacao !== 'all' || segmento !== 'all' || fila !== 'all';

  const exportPDF = () => {
    if (!tasks.length && !ledger.length) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;

    // ---- Header ----
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EVOX FISCAL', margin, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório Gerencial — Setor Crédito', margin, 19);
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - margin, 12, { align: 'right' });

    // Filters applied
    const activeFilters: string[] = [];
    if (periodoInicio) activeFilters.push(`De: ${periodoInicio}`);
    if (periodoFim) activeFilters.push(`Até: ${periodoFim}`);
    if (teseId !== 'all') { const t = (teses as any[])?.find((t: any) => String(t.id) === teseId); if (t) activeFilters.push(`Tese: ${t.nome}`); }
    if (parceiroId !== 'all') { const p = (parceiros as any[])?.find((p: any) => String(p.id) === parceiroId); if (p) activeFilters.push(`Parceiro: ${p.nomeFantasia}`); }
    if (classificacao !== 'all') activeFilters.push(`Classificação: ${classificacao}`);
    if (segmento !== 'all') activeFilters.push(`Segmento: ${segmento}`);
    if (fila !== 'all') activeFilters.push(`Fila: ${FILA_LABELS[fila] || fila}`);
    if (activeFilters.length) {
      doc.text(`Filtros: ${activeFilters.join(' | ')}`, pageW - margin, 19, { align: 'right' });
    }

    y = 36;

    // ---- Summary Cards ----
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', margin, y);
    y += 6;

    const cardData = [
      { label: 'Total de Tarefas', value: String(summary.totalTarefas || 0), color: [59, 130, 246] },
      { label: 'Valor Estimado', value: formatCurrency(summary.totalEstimado || 0), color: [16, 185, 129] },
      { label: 'Valor Contratado', value: formatCurrency(summary.totalContratado || 0), color: [139, 92, 246] },
      { label: 'Em Atraso', value: String(summary.totalEmAtraso || 0), color: [239, 68, 68] },
    ];
    const cardW = (pageW - margin * 2 - 12) / 4;
    cardData.forEach((card, i) => {
      const x = margin + i * (cardW + 4);
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.roundedRect(x, y, cardW, 18, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label.toUpperCase(), x + 4, y + 6);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + 4, y + 14);
    });
    y += 26;

    // ---- Distribution by Fila ----
    if (Object.keys(summary.porFila || {}).length > 0) {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição por Fila', margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Fila', 'Quantidade', '% do Total']],
        body: Object.entries(summary.porFila || {}).sort(([,a]: any, [,b]: any) => b - a).map(([k, v]: any) => [
          FILA_LABELS[k] || k, String(v), `${((v / (summary.totalTarefas || 1)) * 100).toFixed(1)}%`
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ---- Distribution by Status ----
    if (Object.keys(summary.porStatus || {}).length > 0) {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição por Status', margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Status', 'Quantidade', '% do Total']],
        body: Object.entries(summary.porStatus || {}).map(([k, v]: any) => [
          STATUS_LABELS[k] || k, String(v), `${((v / (summary.totalTarefas || 1)) * 100).toFixed(1)}%`
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ---- New page for Tasks table ----
    if (tasks.length > 0) {
      doc.addPage();
      y = margin;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento de Tarefas', margin, 9);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${tasks.length} tarefa(s)`, pageW - margin, 9, { align: 'right' });
      y = 20;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Código', 'Fila', 'Título', 'Status', 'Prioridade', 'Responsável', 'Cliente', 'CNPJ', 'Parceiro', 'V. Estimado', 'V. Contratado', 'SLA', 'Vencimento']],
        body: tasks.slice(0, 500).map(t => [
          t.codigo || '',
          FILA_LABELS[t.fila] || t.fila || '',
          (t.titulo || '').substring(0, 40),
          STATUS_LABELS[t.status] || t.status || '',
          PRIORIDADE_LABELS[t.prioridade] || t.prioridade || '',
          t.responsavelNome || '',
          (t.clienteNome || '').substring(0, 25),
          t.clienteCnpj || '',
          (t.parceiroNome || '').substring(0, 20),
          formatCurrency(Number(t.valorEstimado || 0)),
          formatCurrency(Number(t.valorContratado || 0)),
          t.slaStatus || '',
          formatDate(t.dataVencimento),
        ]),
        styles: { fontSize: 6, cellPadding: 1.5, overflow: 'ellipsize' },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 16 }, 1: { cellWidth: 20 }, 2: { cellWidth: 40 },
          3: { cellWidth: 16 }, 4: { cellWidth: 16 }, 5: { cellWidth: 25 },
          6: { cellWidth: 28 }, 7: { cellWidth: 28 }, 8: { cellWidth: 22 },
          9: { cellWidth: 22, halign: 'right' }, 10: { cellWidth: 22, halign: 'right' },
          11: { cellWidth: 16 }, 12: { cellWidth: 18 },
        },
      });
    }

    // ---- Ledger page ----
    if (ledger.length > 0) {
      doc.addPage();
      y = margin;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Gestão de Créditos — Resumo por Tese', margin, 9);
      y = 20;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Tese', 'Grupo Débito', 'Status', 'Qtd', 'Estimado', 'Validado', 'Efetivado', 'Residual']],
        body: ledger.map((l: any) => [
          (l.teseNome || '').substring(0, 40),
          l.grupoDebito || '',
          l.status || '',
          String(l.qtd || 0),
          formatCurrency(Number(l.totalEstimado || 0)),
          formatCurrency(Number(l.totalValidado || 0)),
          formatCurrency(Number(l.totalEfetivado || 0)),
          formatCurrency(Number(l.totalResidual || 0)),
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' },
        },
      });
    }

    // ---- Footer on all pages ----
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(241, 245, 249);
      doc.rect(0, pageH - 10, pageW, 10, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('Evox Fiscal — Relatório Gerencial Confidencial', margin, pageH - 4);
      doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' });
    }

    doc.save(`relatorio-credito-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <BackToDashboard />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Relatórios</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            Relatórios Gerenciais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise gerencial com filtros por período, tese, parceiro, classificação e segmento.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="default" className="gap-2 text-xs" onClick={exportPDF} disabled={!tasks.length && !ledger.length}>
            <FileText className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" className="gap-2 text-xs" onClick={exportCSV} disabled={!tasks.length}>
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Tarefas (CSV)
          </Button>
          <Button variant="outline" className="gap-2 text-xs" onClick={exportLedgerCSV} disabled={!ledger.length}>
            <Download className="w-4 h-4" />
            Exportar Créditos (CSV)
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Período Início</Label>
              <Input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Período Fim</Label>
              <Input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Fila</Label>
              <Select value={fila} onValueChange={setFila}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FILAS_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Tese</Label>
              <Select value={teseId} onValueChange={setTeseId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {(teses as any[] || []).map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Parceiro</Label>
              <Select value={parceiroId} onValueChange={setParceiroId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(parceiros as any[] || []).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.nomeFantasia || p.razaoSocial || p.nomeCompleto}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Classificação</Label>
              <Select value={classificacao} onValueChange={setClassificacao}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASSIFICACAO_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Segmento</Label>
              <Select value={segmento} onValueChange={setSegmento}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(segmentos as string[] || []).map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <ClipboardList className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <p className="text-2xl font-bold text-foreground">{summary.totalTarefas || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Total Tarefas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{summary.totalEmAtraso || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Em Atraso</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(summary.totalEstimado || 0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Valor Estimado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-primary">{formatCurrency(summary.totalContratado || 0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Valor Contratado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{Object.keys(summary.porParceiro || {}).length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Parceiros</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{Object.keys(summary.porSegmento || {}).length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Segmentos</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="graficos">Gráficos</TabsTrigger>
              <TabsTrigger value="tarefas">Tarefas ({tasks.length})</TabsTrigger>
              <TabsTrigger value="creditos">Créditos ({ledger.length})</TabsTrigger>
            </TabsList>

            {/* ===== RESUMO TAB ===== */}
            <TabsContent value="resumo" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Por Fila */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Fila</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(summary.porFila || {}).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(summary.porFila || {}).sort((a: any, b: any) => b[1] - a[1]).map(([key, val]: any) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs font-medium">{FILA_LABELS[key] || key}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${(val / (summary.totalTarefas || 1)) * 100}%` }} />
                              </div>
                              <span className="text-xs font-bold w-8 text-right">{val}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Por Status */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Status</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(summary.porStatus || {}).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(summary.porStatus || {}).sort((a: any, b: any) => b[1] - a[1]).map(([key, val]: any) => {
                          const colors: Record<string, string> = { a_fazer: 'bg-amber-500', fazendo: 'bg-blue-500', feito: 'bg-purple-500', concluido: 'bg-emerald-500' };
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs font-medium">{STATUS_LABELS[key] || key}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full', colors[key] || 'bg-gray-500')} style={{ width: `${(val / (summary.totalTarefas || 1)) * 100}%` }} />
                                </div>
                                <span className="text-xs font-bold w-8 text-right">{val}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Por Parceiro */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Parceiro</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(summary.porParceiro || {}).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(summary.porParceiro || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10).map(([key, val]: any) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate max-w-[150px]">{key}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(val / (summary.totalTarefas || 1)) * 100}%` }} />
                              </div>
                              <span className="text-xs font-bold w-8 text-right">{val}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Por Segmento */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Segmento</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(summary.porSegmento || {}).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(summary.porSegmento || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10).map(([key, val]: any) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate max-w-[150px]">{key}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(val / (summary.totalTarefas || 1)) * 100}%` }} />
                              </div>
                              <span className="text-xs font-bold w-8 text-right">{val}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== GRÁFICOS TAB ===== */}
            <TabsContent value="graficos" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Bar Chart - Tarefas por Fila */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tarefas por Fila</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filaChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={filaChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="tarefas" name="Tarefas" radius={[4, 4, 0, 0]}>
                            {filaChartData.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Pie Chart - Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Distribuição por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={PieLabel}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {statusChartData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            formatter={(value) => <span className="text-xs">{value}</span>}
                            iconSize={10}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Bar Chart - Valores por Fila */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Valores por Fila (Estimado vs Contratado)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {valorPorFilaData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={valorPorFilaData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                          <YAxis
                            tick={{ fontSize: 9 }}
                            tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend formatter={(value) => <span className="text-xs">{value === 'estimado' ? 'Estimado' : 'Contratado'}</span>} iconSize={10} />
                          <Bar dataKey="estimado" name="Estimado" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="contratado" name="Contratado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Pie Chart - Parceiros */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Distribuição por Parceiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {parceiroChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={parceiroChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={PieLabel}
                            outerRadius={100}
                            dataKey="tarefas"
                            nameKey="name"
                          >
                            {parceiroChartData.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            formatter={(value) => <span className="text-xs">{value}</span>}
                            iconSize={10}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Bar Chart - Parceiros */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top Parceiros por Tarefas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {parceiroChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={parceiroChartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="tarefas" name="Tarefas" radius={[0, 4, 4, 0]}>
                            {parceiroChartData.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Pie Chart - Segmentos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Distribuição por Segmento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {segmentoChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={segmentoChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={PieLabel}
                            outerRadius={100}
                            dataKey="value"
                            nameKey="name"
                          >
                            {segmentoChartData.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            formatter={(value) => <span className="text-xs">{value}</span>}
                            iconSize={10}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== TAREFAS TAB ===== */}
            <TabsContent value="tarefas" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  {tasks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma tarefa encontrada com os filtros aplicados.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                            <th className="px-3 py-2 text-left font-medium">Código</th>
                            <th className="px-3 py-2 text-left font-medium">Fila</th>
                            <th className="px-3 py-2 text-left font-medium">Título</th>
                            <th className="px-3 py-2 text-left font-medium">Status</th>
                            <th className="px-3 py-2 text-left font-medium">Prioridade</th>
                            <th className="px-3 py-2 text-left font-medium">Responsável</th>
                            <th className="px-3 py-2 text-left font-medium">Cliente</th>
                            <th className="px-3 py-2 text-left font-medium">Parceiro</th>
                            <th className="px-3 py-2 text-right font-medium">Estimado</th>
                            <th className="px-3 py-2 text-left font-medium">SLA</th>
                            <th className="px-3 py-2 text-left font-medium">Criado em</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {tasks.slice(0, 200).map((t: any) => (
                            <tr key={t.id} className={cn('hover:bg-muted/30', t.slaStatus === 'vencido' && 'bg-red-50/50')}>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{t.codigo}</td>
                              <td className="px-3 py-2">{FILA_LABELS[t.fila] || t.fila}</td>
                              <td className="px-3 py-2 max-w-[200px] truncate font-medium">{t.titulo}</td>
                              <td className="px-3 py-2"><Badge className="text-[9px]">{STATUS_LABELS[t.status] || t.status}</Badge></td>
                              <td className="px-3 py-2"><Badge variant="outline" className="text-[9px]">{PRIORIDADE_LABELS[t.prioridade] || t.prioridade}</Badge></td>
                              <td className="px-3 py-2 text-muted-foreground">{t.responsavelNome || '—'}</td>
                              <td className="px-3 py-2 max-w-[150px] truncate">{t.clienteNome || '—'}</td>
                              <td className="px-3 py-2 max-w-[120px] truncate text-muted-foreground">{t.parceiroNome || '—'}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(Number(t.valorEstimado || 0))}</td>
                              <td className="px-3 py-2">
                                {t.slaStatus === 'vencido' ? (
                                  <Badge variant="destructive" className="text-[9px] gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />Atraso</Badge>
                                ) : (
                                  <Badge className="text-[9px] bg-emerald-100 text-emerald-800">OK</Badge>
                                )}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{formatDate(t.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {tasks.length > 200 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Mostrando 200 de {tasks.length} tarefas. Exporte o CSV para ver todas.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== CRÉDITOS TAB ===== */}
            <TabsContent value="creditos" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  {ledger.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum registro de crédito encontrado.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                            <th className="px-3 py-2 text-left font-medium">Tese</th>
                            <th className="px-3 py-2 text-left font-medium">Grupo Débito</th>
                            <th className="px-3 py-2 text-left font-medium">Status</th>
                            <th className="px-3 py-2 text-right font-medium">Qtd</th>
                            <th className="px-3 py-2 text-right font-medium">Estimado</th>
                            <th className="px-3 py-2 text-right font-medium">Validado</th>
                            <th className="px-3 py-2 text-right font-medium">Efetivado</th>
                            <th className="px-3 py-2 text-right font-medium">Residual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {ledger.map((l: any, idx: number) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="px-3 py-2 max-w-[200px] truncate font-medium">{l.teseNome || '—'}</td>
                              <td className="px-3 py-2">{l.grupoDebito || '—'}</td>
                              <td className="px-3 py-2"><Badge variant="outline" className="text-[9px]">{l.status}</Badge></td>
                              <td className="px-3 py-2 text-right">{l.qtd}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Number(l.totalEstimado || 0))}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Number(l.totalValidado || 0))}</td>
                              <td className="px-3 py-2 text-right font-medium text-emerald-600">{formatCurrency(Number(l.totalEfetivado || 0))}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Number(l.totalResidual || 0))}</td>
                            </tr>
                          ))}
                          <tr className="bg-muted/30 font-bold">
                            <td className="px-3 py-2" colSpan={3}>Total</td>
                            <td className="px-3 py-2 text-right">{ledger.reduce((s: number, l: any) => s + Number(l.qtd || 0), 0)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(ledger.reduce((s: number, l: any) => s + Number(l.totalEstimado || 0), 0))}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(ledger.reduce((s: number, l: any) => s + Number(l.totalValidado || 0), 0))}</td>
                            <td className="px-3 py-2 text-right text-emerald-600">{formatCurrency(ledger.reduce((s: number, l: any) => s + Number(l.totalEfetivado || 0), 0))}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(ledger.reduce((s: number, l: any) => s + Number(l.totalResidual || 0), 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
