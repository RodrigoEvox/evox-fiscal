import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ChevronRight, Loader2, Search, DollarSign, Building2,
  AlertTriangle, TrendingUp, PiggyBank, Banknote, Receipt,
  FileText, History, ShieldCheck, Eye, Scale, ArrowRight,
  CalendarClock, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BackToDashboard from '@/components/BackToDashboard';

const PERDCOMP_STATUS: Record<string, { label: string; color: string }> = {
  transmitido: { label: 'Transmitido', color: 'bg-blue-100 text-blue-800' },
  homologado: { label: 'Homologado', color: 'bg-emerald-100 text-emerald-800' },
  nao_homologado: { label: 'Não Homologado', color: 'bg-red-100 text-red-800' },
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

const MODALIDADE_LABELS: Record<string, string> = {
  compensacao: 'Compensação',
  ressarcimento: 'Ressarcimento',
  restituicao: 'Restituição',
};

export default function CreditoGestaoCreditos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [selectedClienteNome, setSelectedClienteNome] = useState('');
  const [activeTab, setActiveTab] = useState('resumo');
  const [showPerdcompDetail, setShowPerdcompDetail] = useState(false);
  const [selectedPerdcomp, setSelectedPerdcomp] = useState<any>(null);

  const { data: clientes, isLoading: loadingClientes } = trpc.clientes.list.useQuery();
  const { data: gestaoData, isLoading: loadingGestao } = trpc.creditRecovery.admin.gestaoCompleta.useQuery(
    { clienteId: selectedClienteId! },
    { enabled: !!selectedClienteId }
  );

  const filteredClientes = useMemo(() => {
    if (!clientes) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return (clientes as any[]).slice(0, 30);
    return (clientes as any[]).filter((c: any) =>
      c.razaoSocial?.toLowerCase().includes(term) ||
      c.cnpj?.includes(term) ||
      c.nomeFantasia?.toLowerCase().includes(term)
    ).slice(0, 30);
  }, [clientes, searchTerm]);

  const gd = gestaoData as any;
  const totals = gd?.totals || {};
  const ledger = gd?.ledger || [];
  const perdcomps = gd?.perdcomps || [];
  const retificacoes = gd?.retificacoes || [];
  const guias = gd?.guias || [];
  const strategies = gd?.strategies || [];
  const rtis = gd?.rtis || [];
  const saldoPorGrupo = gd?.saldoPorGrupo || {};
  const prescricaoRisk = gd?.prescricaoRisk || [];
  const historicoUtilizacao = gd?.historicoUtilizacao || [];

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  // Build timeline from all events
  const timeline = useMemo(() => {
    const events: any[] = [];
    rtis.forEach((r: any) => events.push({ date: r.createdAt, type: 'RTI', desc: `RTI gerado — ${r.taskTitulo || 'Apuração'}`, valor: Number(r.totalBruto || 0), icon: 'rti' }));
    retificacoes.forEach((r: any) => events.push({ date: r.createdAt, type: 'Retificação', desc: `Retificação ${r.tipoRetificacao || 'total'} — Período: ${r.periodoRetificado || '—'}`, valor: Number(r.valorCreditoDisponivel || 0), icon: 'retificacao' }));
    perdcomps.forEach((p: any) => events.push({ date: p.dataTransmissao || p.createdAt, type: 'PerdComp', desc: `PerdComp ${p.numeroPerdcomp || '—'} — ${MODALIDADE_LABELS[p.modalidade] || p.modalidade || 'Compensação'}`, valor: Number(p.valorCredito || 0), icon: 'perdcomp', status: p.status }));
    guias.forEach((g: any) => events.push({ date: g.createdAt, type: 'Guia', desc: `Guia ${g.codigoReceita || ''} — ${g.grupoTributo || ''}`, valor: Number(g.valorTotal || 0), icon: 'guia' }));
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }, [rtis, retificacoes, perdcomps, guias]);

  return (
    <div className="space-y-6">
      {/* Back to Dashboard */}
      <BackToDashboard />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Crédito Tributário</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Gestão de Créditos</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-primary" />
          Gestão de Créditos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico completo de créditos: apuração, retificação, saldos, PerdComps e alertas de prescrição.
        </p>
      </div>

      {/* Client Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4" />
            Selecionar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por razão social, CNPJ ou nome fantasia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {loadingClientes ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="max-h-[180px] overflow-y-auto border rounded-lg divide-y">
              {filteredClientes.map((c: any) => (
                <div
                  key={c.id}
                  className={cn(
                    'p-2.5 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between',
                    selectedClienteId === c.id && 'bg-primary/5 border-l-4 border-l-primary'
                  )}
                  onClick={() => { setSelectedClienteId(c.id); setSelectedClienteNome(c.razaoSocial); setActiveTab('resumo'); }}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{c.razaoSocial}</p>
                    <span className="text-xs text-muted-foreground">{c.cnpj} {c.nomeFantasia ? `— ${c.nomeFantasia}` : ''}</span>
                  </div>
                  {selectedClienteId === c.id && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      {selectedClienteId && (
        <>
          {loadingGestao ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Prescricao Alert */}
              {prescricaoRisk.length > 0 && (
                <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Alerta de Prescrição</p>
                    <p className="text-xs mt-0.5">
                      {prescricaoRisk.length} crédito(s) com risco de prescrição iminente (menos de 6 meses ou mais de 4,5 anos). Saldo em risco: {formatCurrency(prescricaoRisk.reduce((s: number, l: any) => s + Number(l.saldoDisponivel || l.saldoResidual || 0), 0))}
                    </p>
                  </div>
                </div>
              )}

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Estimado (RTI)', value: formatCurrency(totals.totalEstimado), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Validado', value: formatCurrency(totals.totalValidado), icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
                  { label: 'Retificado', value: formatCurrency(totals.totalRetificado), icon: FileText, color: 'text-cyan-600 bg-cyan-50' },
                  { label: 'Protocolado', value: formatCurrency(totals.totalProtocolado), icon: Banknote, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Efetivado', value: formatCurrency(totals.totalEfetivado), icon: PiggyBank, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Saldo Disponível', value: formatCurrency(totals.saldoDisponivel), icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Saldo Utilizado', value: formatCurrency(totals.saldoUtilizado), icon: Receipt, color: 'text-rose-600 bg-rose-50' },
                ].map(kpi => (
                  <Card key={kpi.label}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', kpi.color)}>
                          <kpi.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{kpi.label}</p>
                          <p className="text-sm font-bold text-foreground">{kpi.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Saldo por Grupo de Tributo */}
              {Object.keys(saldoPorGrupo).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Scale className="w-4 h-4" />Saldo por Grupo de Tributo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(saldoPorGrupo).map(([grupo, vals]: [string, any]) => (
                        <div key={grupo} className="border rounded-lg p-3 space-y-2">
                          <p className="font-semibold text-sm text-foreground">{grupo}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-muted-foreground">Estimado</span><span className="font-medium">{formatCurrency(vals.estimado)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Disponível</span><span className="font-medium text-emerald-600">{formatCurrency(vals.disponivel)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Utilizado</span><span className="font-medium text-rose-600">{formatCurrency(vals.utilizado)}</span></div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${vals.estimado > 0 ? Math.min(100, ((vals.disponivel) / vals.estimado) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estratégia de Monetização */}
              {strategies.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4" />Estratégia de Monetização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {strategies.map((s: any, i: number) => (
                        <div key={i} className="border rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Case: {s.caseNumero || `#${s.caseId}`}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Definida em: {formatDate(s.createdAt)}</p>
                          </div>
                          <div className="flex gap-2">
                            {s.compensacao && <Badge className="bg-blue-100 text-blue-800 text-[10px]">Compensação</Badge>}
                            {s.ressarcimento && <Badge className="bg-purple-100 text-purple-800 text-[10px]">Ressarcimento</Badge>}
                            {s.restituicao && <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">Restituição</Badge>}
                            {s.mista && <Badge className="bg-amber-100 text-amber-800 text-[10px]">Mista</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="resumo" className="gap-1 text-xs"><DollarSign className="w-3.5 h-3.5" />Ledger</TabsTrigger>
                  <TabsTrigger value="retificacoes" className="gap-1 text-xs"><FileText className="w-3.5 h-3.5" />Retificações</TabsTrigger>
                  <TabsTrigger value="perdcomps" className="gap-1 text-xs"><Receipt className="w-3.5 h-3.5" />PerdComps</TabsTrigger>
                  <TabsTrigger value="guias" className="gap-1 text-xs"><Banknote className="w-3.5 h-3.5" />Guias</TabsTrigger>
                  <TabsTrigger value="historico" className="gap-1 text-xs"><History className="w-3.5 h-3.5" />Utilização</TabsTrigger>
                  <TabsTrigger value="timeline" className="gap-1 text-xs"><CalendarClock className="w-3.5 h-3.5" />Timeline</TabsTrigger>
                </TabsList>

                {/* Ledger Tab */}
                <TabsContent value="resumo">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Ledger de Créditos ({ledger.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {ledger.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">Nenhum crédito registrado para este cliente.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                <th className="px-3 py-2 text-left">Tese</th>
                                <th className="px-3 py-2 text-left">Grupo</th>
                                <th className="px-3 py-2 text-right">Estimado</th>
                                <th className="px-3 py-2 text-right">Validado</th>
                                <th className="px-3 py-2 text-right">Retificado</th>
                                <th className="px-3 py-2 text-right">Efetivado</th>
                                <th className="px-3 py-2 text-right">Saldo Disp.</th>
                                <th className="px-3 py-2 text-right">Utilizado</th>
                                <th className="px-3 py-2 text-left">Prescrição</th>
                                <th className="px-3 py-2 text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {ledger.map((l: any, i: number) => {
                                const hasPrescRisk = prescricaoRisk.some((p: any) => p.id === l.id);
                                return (
                                  <tr key={i} className={cn('hover:bg-muted/30', hasPrescRisk && 'bg-red-50/50')}>
                                    <td className="px-3 py-2 font-medium max-w-[200px] truncate">{l.teseNome || '—'}</td>
                                    <td className="px-3 py-2">{l.grupoSigla || l.grupoDebito || '—'}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(l.valorEstimado || 0))}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(l.valorValidado || 0))}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(l.valorRetificado || 0))}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(l.valorEfetivado || 0))}</td>
                                    <td className="px-3 py-2 text-right font-medium text-emerald-600">{formatCurrency(Number(l.saldoDisponivel || l.saldoResidual || 0))}</td>
                                    <td className="px-3 py-2 text-right text-rose-600">{formatCurrency(Number(l.saldoUtilizado || 0))}</td>
                                    <td className="px-3 py-2">
                                      {l.dataPrescricao ? (
                                        <span className={cn('text-[10px]', hasPrescRisk ? 'text-red-600 font-bold' : 'text-muted-foreground')}>{formatDate(l.dataPrescricao)}</span>
                                      ) : hasPrescRisk ? (
                                        <Badge variant="destructive" className="text-[9px]">Risco</Badge>
                                      ) : <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{l.status || '—'}</Badge></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-muted/30 font-medium">
                                <td className="px-3 py-2" colSpan={2}>TOTAL</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(totals.totalEstimado)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(totals.totalValidado)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(totals.totalRetificado)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(totals.totalEfetivado)}</td>
                                <td className="px-3 py-2 text-right text-emerald-600">{formatCurrency(totals.saldoDisponivel)}</td>
                                <td className="px-3 py-2 text-right text-rose-600">{formatCurrency(totals.saldoUtilizado)}</td>
                                <td className="px-3 py-2" colSpan={2}></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Retificações Tab */}
                <TabsContent value="retificacoes">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Retificações ({retificacoes.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {retificacoes.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma retificação registrada.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                <th className="px-3 py-2 text-left">Tipo</th>
                                <th className="px-3 py-2 text-left">Período</th>
                                <th className="px-3 py-2 text-right">Apurado (RTI)</th>
                                <th className="px-3 py-2 text-right">Disponível</th>
                                <th className="px-3 py-2 text-right">Divergência</th>
                                <th className="px-3 py-2 text-left">Grupo Débito</th>
                                <th className="px-3 py-2 text-left">Data</th>
                                <th className="px-3 py-2 text-left">Alerta</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {retificacoes.map((r: any, i: number) => {
                                const divergencia = Number(r.divergencia || 0);
                                const hasAlert = r.alertaDivergencia || Math.abs(divergencia) > Number(r.valorApuradoRti || 0) * 0.1;
                                return (
                                  <tr key={i} className={cn('hover:bg-muted/30', hasAlert && 'bg-amber-50/50')}>
                                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{r.tipoRetificacao === 'total' ? 'Total' : 'Parcial'}</Badge></td>
                                    <td className="px-3 py-2">{r.periodoRetificado || '—'}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(r.valorApuradoRti || 0))}</td>
                                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(Number(r.valorCreditoDisponivel || 0))}</td>
                                    <td className="px-3 py-2 text-right">
                                      <span className={cn('font-medium', divergencia > 0 ? 'text-emerald-600' : divergencia < 0 ? 'text-red-600' : 'text-muted-foreground')}>
                                        {divergencia > 0 ? '+' : ''}{formatCurrency(divergencia)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">{r.grupoDebito || '—'}</td>
                                    <td className="px-3 py-2">{formatDate(r.createdAt)}</td>
                                    <td className="px-3 py-2">
                                      {hasAlert ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* PerdComps Tab */}
                <TabsContent value="perdcomps">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">PerdComps ({perdcomps.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {perdcomps.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma PerdComp registrada.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                <th className="px-3 py-2 text-left">Número</th>
                                <th className="px-3 py-2 text-left">Modalidade</th>
                                <th className="px-3 py-2 text-left">Tipo Crédito</th>
                                <th className="px-3 py-2 text-left">Grupo</th>
                                <th className="px-3 py-2 text-right">Valor Crédito</th>
                                <th className="px-3 py-2 text-right">Débitos Comp.</th>
                                <th className="px-3 py-2 text-right">Saldo Rem.</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-left">Transmissão</th>
                                <th className="px-3 py-2 text-left">Evox</th>
                                <th className="px-3 py-2 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {perdcomps.map((p: any, i: number) => {
                                const statusInfo = PERDCOMP_STATUS[p.status] || { label: p.status, color: 'bg-gray-100 text-gray-800' };
                                return (
                                  <tr key={i} className="hover:bg-muted/30">
                                    <td className="px-3 py-2 font-mono font-medium">{p.numeroPerdcomp || '—'}</td>
                                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{MODALIDADE_LABELS[p.modalidade] || p.modalidade || '—'}</Badge></td>
                                    <td className="px-3 py-2">{p.tipoCredito || '—'}</td>
                                    <td className="px-3 py-2">{p.grupoTributo || '—'}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(p.valorCredito || 0))}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(p.valorDebitosCompensados || 0))}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(p.saldoRemanescente || 0))}</td>
                                    <td className="px-3 py-2"><Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge></td>
                                    <td className="px-3 py-2">{formatDate(p.dataTransmissao)}</td>
                                    <td className="px-3 py-2">
                                      {p.feitoPelaEvox ? <Badge className="bg-emerald-100 text-emerald-800 text-[9px]">Sim</Badge> : <Badge className="bg-gray-100 text-gray-800 text-[9px]">Não</Badge>}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => { setSelectedPerdcomp(p); setShowPerdcompDetail(true); }}>
                                        <Eye className="w-3.5 h-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Guias Tab */}
                <TabsContent value="guias">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Guias ({guias.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {guias.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma guia registrada.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                <th className="px-3 py-2 text-left">CNPJ</th>
                                <th className="px-3 py-2 text-left">Cód. Receita</th>
                                <th className="px-3 py-2 text-left">Grupo</th>
                                <th className="px-3 py-2 text-left">Período</th>
                                <th className="px-3 py-2 text-left">Vencimento</th>
                                <th className="px-3 py-2 text-right">Original</th>
                                <th className="px-3 py-2 text-right">Total</th>
                                <th className="px-3 py-2 text-right">Compensado</th>
                                <th className="px-3 py-2 text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {guias.map((g: any, i: number) => {
                                const isVencida = g.statusGuia === 'vencida';
                                return (
                                  <tr key={i} className={cn('hover:bg-muted/30', isVencida && 'bg-red-50/50')}>
                                    <td className="px-3 py-2 font-mono">{g.cnpjGuia || '—'}</td>
                                    <td className="px-3 py-2">{g.codigoReceita || '—'}</td>
                                    <td className="px-3 py-2">{g.grupoTributo || '—'}</td>
                                    <td className="px-3 py-2">{g.periodoApuracao || '—'}</td>
                                    <td className="px-3 py-2 flex items-center gap-1">
                                      <CalendarClock className="w-3 h-3 text-muted-foreground" />
                                      {formatDate(g.dataVencimento)}
                                    </td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(g.valorOriginal || 0))}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(Number(g.valorTotal || 0))}</td>
                                    <td className="px-3 py-2 text-right text-emerald-600">{formatCurrency(Number(g.valorCompensado || 0))}</td>
                                    <td className="px-3 py-2">
                                      <Badge className={cn('text-[10px]',
                                        g.statusGuia === 'compensada' ? 'bg-emerald-100 text-emerald-800' :
                                        g.statusGuia === 'vencida' ? 'bg-red-100 text-red-800' :
                                        g.statusGuia === 'perto_vencimento' ? 'bg-amber-100 text-amber-800' :
                                        'bg-blue-100 text-blue-800'
                                      )}>{g.statusGuia === 'a_vencer' ? 'A Vencer' : g.statusGuia === 'vencida' ? 'Vencida' : g.statusGuia === 'perto_vencimento' ? 'Próx. Venc.' : g.statusGuia === 'compensada' ? 'Compensada' : g.statusGuia}</Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-muted/30 font-medium">
                                <td className="px-3 py-2" colSpan={5}>TOTAL</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(guias.reduce((s: number, g: any) => s + Number(g.valorOriginal || 0), 0))}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(guias.reduce((s: number, g: any) => s + Number(g.valorTotal || 0), 0))}</td>
                                <td className="px-3 py-2 text-right text-emerald-600">{formatCurrency(guias.reduce((s: number, g: any) => s + Number(g.valorCompensado || 0), 0))}</td>
                                <td className="px-3 py-2"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Histórico de Utilização Tab */}
                <TabsContent value="historico">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Histórico de Utilização de Créditos ({historicoUtilizacao.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {historicoUtilizacao.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma utilização registrada.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                <th className="px-3 py-2 text-left">PerdComp</th>
                                <th className="px-3 py-2 text-left">Modalidade</th>
                                <th className="px-3 py-2 text-left">Grupo Tributo</th>
                                <th className="px-3 py-2 text-right">Valor</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-left">Data</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {historicoUtilizacao.map((h: any, i: number) => {
                                const statusInfo = PERDCOMP_STATUS[h.status] || { label: h.status, color: 'bg-gray-100 text-gray-800' };
                                return (
                                  <tr key={i} className="hover:bg-muted/30">
                                    <td className="px-3 py-2 font-mono font-medium">{h.numeroPerdcomp || '—'}</td>
                                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{MODALIDADE_LABELS[h.tipo] || h.tipo}</Badge></td>
                                    <td className="px-3 py-2">{h.grupoTributo || '—'}</td>
                                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(h.valor)}</td>
                                    <td className="px-3 py-2"><Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge></td>
                                    <td className="px-3 py-2">{formatDate(h.data)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-muted/30 font-medium">
                                <td className="px-3 py-2" colSpan={3}>TOTAL UTILIZADO</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(historicoUtilizacao.reduce((s: number, h: any) => s + h.valor, 0))}</td>
                                <td className="px-3 py-2" colSpan={2}></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Timeline de Eventos ({timeline.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {timeline.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-6">Nenhum evento registrado.</p>
                      ) : (
                        <div className="relative pl-6 space-y-4">
                          <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
                          {timeline.map((ev, i) => {
                            const iconMap: Record<string, { icon: any; color: string }> = {
                              rti: { icon: FileText, color: 'bg-blue-100 text-blue-600' },
                              retificacao: { icon: ShieldCheck, color: 'bg-cyan-100 text-cyan-600' },
                              perdcomp: { icon: Receipt, color: 'bg-purple-100 text-purple-600' },
                              guia: { icon: Banknote, color: 'bg-amber-100 text-amber-600' },
                            };
                            const { icon: Icon, color } = iconMap[ev.icon] || iconMap.rti;
                            return (
                              <div key={i} className="relative flex gap-3">
                                <div className={cn('absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center shrink-0', color)}>
                                  <Icon className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-foreground">{ev.type}</p>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{formatDateTime(ev.date)}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{ev.desc}</p>
                                  {ev.valor > 0 && <p className="text-xs font-medium text-foreground mt-0.5">{formatCurrency(ev.valor)}</p>}
                                  {ev.status && <Badge className={cn('text-[9px] mt-1', PERDCOMP_STATUS[ev.status]?.color)}>{PERDCOMP_STATUS[ev.status]?.label}</Badge>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}

      {/* PerdComp Detail Dialog */}
      <Dialog open={showPerdcompDetail} onOpenChange={setShowPerdcompDetail}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              PerdComp — {selectedPerdcomp?.numeroPerdcomp}
            </DialogTitle>
          </DialogHeader>
          {selectedPerdcomp && (
            <div className="space-y-4">
              <Card className="border-dashed">
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Dados da Declaração</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Número</p><p className="font-mono font-medium">{selectedPerdcomp.numeroPerdcomp}</p></div>
                    <div><p className="text-xs text-muted-foreground">Nº Controle</p><p className="font-mono">{selectedPerdcomp.numeroControle || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">CNPJ</p><p className="font-mono">{selectedPerdcomp.cnpjDeclarante || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Nome Empresarial</p><p>{selectedPerdcomp.nomeEmpresarial || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Tipo Documento</p><p>{selectedPerdcomp.tipoDocumento || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Data Transmissão</p><p>{formatDate(selectedPerdcomp.dataTransmissao)}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Dados do Crédito</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Tipo Crédito</p><p>{selectedPerdcomp.tipoCredito || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Cód. Receita</p><p>{selectedPerdcomp.codigoReceita || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Grupo Tributo</p><p>{selectedPerdcomp.grupoTributo || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Ação Judicial</p><p>{selectedPerdcomp.oriundoAcaoJudicial ? 'Sim' : 'Não'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Valor Crédito</p><p className="font-bold text-lg">{formatCurrency(Number(selectedPerdcomp.valorCredito || 0))}</p></div>
                    <div><p className="text-xs text-muted-foreground">Débitos Compensados</p><p className="font-bold text-lg">{formatCurrency(Number(selectedPerdcomp.valorDebitosCompensados || 0))}</p></div>
                    <div><p className="text-xs text-muted-foreground">Saldo Remanescente</p><p className="font-bold text-lg text-emerald-600">{formatCurrency(Number(selectedPerdcomp.saldoRemanescente || 0))}</p></div>
                    <div><p className="text-xs text-muted-foreground">Modalidade</p><Badge variant="outline">{MODALIDADE_LABELS[selectedPerdcomp.modalidade] || selectedPerdcomp.modalidade}</Badge></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Status e Representante</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Status</p><Badge className={cn(PERDCOMP_STATUS[selectedPerdcomp.status]?.color)}>{PERDCOMP_STATUS[selectedPerdcomp.status]?.label}</Badge></div>
                    <div><p className="text-xs text-muted-foreground">Feita pela Evox</p>{selectedPerdcomp.feitoPelaEvox ? <Badge className="bg-emerald-100 text-emerald-800">Sim</Badge> : <Badge className="bg-gray-100 text-gray-800">Não</Badge>}</div>
                    <div><p className="text-xs text-muted-foreground">Representante</p><p>{selectedPerdcomp.representanteNome || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">CPF Representante</p><p className="font-mono">{selectedPerdcomp.representanteCpf || '—'}</p></div>
                    {selectedPerdcomp.despachoDecisorio && <div className="col-span-2"><p className="text-xs text-muted-foreground">Despacho Decisório</p><p>{selectedPerdcomp.despachoDecisorio}</p></div>}
                    {selectedPerdcomp.observacoes && <div className="col-span-2"><p className="text-xs text-muted-foreground">Observações</p><p>{selectedPerdcomp.observacoes}</p></div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
