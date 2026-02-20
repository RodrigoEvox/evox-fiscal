import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Calendar, AlertTriangle, CheckCircle2, Clock, XCircle, Send, Search, CalendarDays, User, Briefcase, Info } from 'lucide-react';

// CLT validation helpers
function validateFeriasCLT(dataInicio: string, dataFim: string, diasPeriodo: number, periodoNum: number) {
  const alerts: { tipo: 'erro' | 'aviso'; msg: string }[] = [];
  if (!dataInicio || !dataFim) return alerts;

  const inicio = new Date(dataInicio + 'T12:00:00');

  // Início não pode ser 2 dias antes de feriado/repouso semanal
  const diaSemana = inicio.getDay();
  if (diaSemana === 5 || diaSemana === 4) {
    alerts.push({ tipo: 'aviso', msg: 'CLT Art. 134 §3º: É proibido que o início das férias ocorra no período de dois dias que antecede feriado ou repouso semanal remunerado.' });
  }

  // Fracionamento rules
  if (periodoNum === 1 && diasPeriodo < 14) {
    alerts.push({ tipo: 'erro', msg: 'CLT Art. 134 §1º: O primeiro período de férias fracionadas não pode ser inferior a 14 dias corridos.' });
  }
  if (periodoNum > 1 && diasPeriodo < 5) {
    alerts.push({ tipo: 'erro', msg: 'CLT Art. 134 §1º: Nenhum período de férias fracionadas pode ser inferior a 5 dias corridos.' });
  }

  return alerts;
}

function calcPeriodoAquisitivo(dataAdmissao: string) {
  if (!dataAdmissao) return null;
  const admissao = new Date(dataAdmissao + 'T12:00:00');
  const hoje = new Date();
  const mesesTrabalhados = (hoje.getFullYear() - admissao.getFullYear()) * 12 + (hoje.getMonth() - admissao.getMonth());
  const anosCompletos = Math.floor(mesesTrabalhados / 12);
  const inicioAquisitivo = new Date(admissao);
  inicioAquisitivo.setFullYear(admissao.getFullYear() + anosCompletos);
  const fimAquisitivo = new Date(inicioAquisitivo);
  fimAquisitivo.setFullYear(fimAquisitivo.getFullYear() + 1);
  fimAquisitivo.setDate(fimAquisitivo.getDate() - 1);
  const fimConcessivo = new Date(fimAquisitivo);
  fimConcessivo.setFullYear(fimConcessivo.getFullYear() + 1);

  const diasParaVencer = Math.round((fimConcessivo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  const vencido = diasParaVencer < 0;
  const proximoVencer = diasParaVencer >= 0 && diasParaVencer <= 60;

  return {
    inicioAquisitivo: inicioAquisitivo.toISOString().split('T')[0],
    fimAquisitivo: fimAquisitivo.toISOString().split('T')[0],
    fimConcessivo: fimConcessivo.toISOString().split('T')[0],
    diasParaVencer,
    vencido,
    proximoVencer,
    mesesTrabalhados: mesesTrabalhados % 12,
    anosCompletos,
  };
}

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function calcDias(inicio: string, fim: string) {
  if (!inicio || !fim) return 0;
  const d1 = new Date(inicio + 'T12:00:00');
  const d2 = new Date(fim + 'T12:00:00');
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function FeriasGEG() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('cronograma');
  const [cltAlerts, setCltAlerts] = useState<{ tipo: string; msg: string }[]>([]);
  const [confirmClt, setConfirmClt] = useState(false);
  const [selectedColab, setSelectedColab] = useState<any>(null);

  const [form, setForm] = useState({
    colaboradorId: 0, dataInicio: '', dataFim: '',
    diasPeriodo: 0, periodoNum: 1,
    abonoConvertido: false, observacao: '', status: 'programada' as string,
  });

  const [solForm, setSolForm] = useState({
    colaboradorId: 0, colaboradorNome: '', tipo: 'ferias' as string,
    dataInicio: '', dataFim: '', motivo: '',
  });

  const colaboradores = trpc.colaboradores.list.useQuery();
  const ferias = trpc.ferias.list.useQuery();
  const solicitacoes = trpc.solicitacoesFolga.list.useQuery();
  const createFerias = trpc.ferias.create.useMutation({ onSuccess: () => { ferias.refetch(); setShowForm(false); resetForm(); toast.success('Férias programadas!'); } });
  const updateFerias = trpc.ferias.update.useMutation({ onSuccess: () => { ferias.refetch(); setShowForm(false); resetForm(); toast.success('Férias atualizadas!'); } });
  const createSolicitacao = trpc.solicitacoesFolga.create.useMutation({ onSuccess: () => { solicitacoes.refetch(); setShowSolicitacao(false); toast.success('Solicitação enviada!'); } });
  const updateSolicitacao = trpc.solicitacoesFolga.update.useMutation({ onSuccess: () => { solicitacoes.refetch(); toast.success('Solicitação atualizada!'); } });

  const resetForm = () => {
    setForm({ colaboradorId: 0, dataInicio: '', dataFim: '', diasPeriodo: 0, periodoNum: 1, abonoConvertido: false, observacao: '', status: 'programada' });
    setEditId(null); setCltAlerts([]); setConfirmClt(false); setSelectedColab(null);
  };

  const colabList = (colaboradores.data || []) as any[];
  const feriasList = (ferias.data || []) as any[];
  const solList = (solicitacoes.data || []) as any[];

  // Calculate vacation balance for a collaborator
  const calcSaldo = (colabId: number) => {
    const feriasColab = feriasList.filter(f => f.colaboradorId === colabId && f.status !== 'cancelada');
    const diasUsados = feriasColab.reduce((sum: number, f: any) => {
      return sum + (f.periodo1Dias || 0) + (f.periodo2Dias || 0) + (f.periodo3Dias || 0);
    }, 0);
    const periodosUsados = feriasColab.length;
    const diasDireito = 30; // padrão CLT
    const saldoDias = diasDireito - diasUsados;
    const periodosRestantes = 3 - periodosUsados;
    return { diasUsados, saldoDias, diasDireito, periodosUsados, periodosRestantes };
  };

  const handleSelectColab = (colabId: string) => {
    const c = colabList.find((c: any) => c.id === Number(colabId));
    if (!c) return;
    setSelectedColab(c);
    setForm(f => ({ ...f, colaboradorId: c.id }));
  };

  const handleDatesChange = (field: 'dataInicio' | 'dataFim', value: string) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (updated.dataInicio && updated.dataFim) {
        updated.diasPeriodo = calcDias(updated.dataInicio, updated.dataFim);
      }
      return updated;
    });
  };

  const handleSaveFerias = () => {
    if (!form.colaboradorId) { toast.error('Selecione o colaborador'); return; }
    if (!form.dataInicio || !form.dataFim) { toast.error('Informe as datas'); return; }
    if (form.diasPeriodo <= 0) { toast.error('Período inválido'); return; }

    // Check balance
    const saldo = calcSaldo(form.colaboradorId);
    if (form.diasPeriodo > saldo.saldoDias) {
      toast.error(`Saldo insuficiente! Restam ${saldo.saldoDias} dias. Solicitados: ${form.diasPeriodo} dias.`);
      return;
    }
    if (saldo.periodosRestantes <= 0 && !editId) {
      toast.error('Limite de 3 períodos de fracionamento atingido para este período aquisitivo.');
      return;
    }

    // CLT validation
    const alerts = validateFeriasCLT(form.dataInicio, form.dataFim, form.diasPeriodo, form.periodoNum);
    if (alerts.length > 0 && !confirmClt) {
      setCltAlerts(alerts);
      return;
    }

    const periodo = calcPeriodoAquisitivo(selectedColab?.dataAdmissao || '');
    const payload = {
      colaboradorId: form.colaboradorId,
      periodoAquisitivoInicio: periodo?.inicioAquisitivo || form.dataInicio,
      periodoAquisitivoFim: periodo?.fimAquisitivo || form.dataFim,
      periodoConcessivoFim: periodo?.fimConcessivo || form.dataFim,
      periodo1Inicio: form.dataInicio,
      periodo1Fim: form.dataFim,
      periodo1Dias: form.diasPeriodo,
      diasTotais: form.diasPeriodo,
      status: (form.status || 'programada') as any,
      abonoConvertido: form.abonoConvertido,
      observacao: form.observacao,
    };
    if (editId) {
      updateFerias.mutate({ id: editId, data: payload });
    } else {
      createFerias.mutate(payload);
    }
  };

  // Compute vacation status for each collaborator
  const colabComFerias = useMemo(() => {
    return colabList.filter(c => c.ativo !== false).map(c => {
      const periodo = calcPeriodoAquisitivo(c.dataAdmissao);
      const feriasColab = feriasList.filter(f => f.colaboradorId === c.id);
      const saldo = calcSaldo(c.id);
      return { ...c, periodo, ferias: feriasColab, saldo };
    });
  }, [colabList, feriasList]);

  const vencidos = colabComFerias.filter(c => c.periodo?.vencido);
  const proximoVencer = colabComFerias.filter(c => c.periodo?.proximoVencer && !c.periodo?.vencido);

  const filtered = useMemo(() => {
    if (!search.trim()) return colabComFerias;
    const s = search.toLowerCase();
    return colabComFerias.filter(c => c.nomeCompleto?.toLowerCase().includes(s));
  }, [colabComFerias, search]);

  const saldoSelected = selectedColab ? calcSaldo(selectedColab.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Férias — Gente & Gestão</h1>
          <p className="text-muted-foreground">Gestão de férias conforme regras da CLT com controle de saldo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSolicitacao(true)}><Send className="w-4 h-4 mr-2" /> Solicitação de Folga</Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Programar Férias</Button>
        </div>
      </div>

      {/* Alerts */}
      {vencidos.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <AlertTriangle className="w-5 h-5" /> Férias Vencidas — Risco de Pagamento em Dobro
            </div>
            <div className="space-y-1">
              {vencidos.map(c => (
                <p key={c.id} className="text-sm text-red-600">{c.nomeCompleto} — Vencido há {Math.abs(c.periodo?.diasParaVencer || 0)} dias</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {proximoVencer.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-700 font-semibold mb-2">
              <Clock className="w-5 h-5" /> Férias Próximas de Vencer
            </div>
            <div className="space-y-1">
              {proximoVencer.map(c => (
                <p key={c.id} className="text-sm text-yellow-600">{c.nomeCompleto} — Vence em {c.periodo?.diasParaVencer} dias</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="cronograma"><Calendar className="w-4 h-4 mr-1" /> Cronograma</TabsTrigger>
          <TabsTrigger value="solicitacoes"><Send className="w-4 h-4 mr-1" /> Solicitações ({solList.filter(s => s.status === 'pendente').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="cronograma" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-3">
            {filtered.map(c => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{c.nomeCompleto}</h4>
                        <p className="text-xs text-muted-foreground">{c.cargo} — Admissão: {formatDateBR(c.dataAdmissao)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Saldo badge */}
                      <Badge variant="outline" className={`text-xs ${c.saldo.saldoDias <= 0 ? 'text-red-600 border-red-300' : c.saldo.saldoDias <= 10 ? 'text-yellow-600 border-yellow-300' : 'text-green-600 border-green-300'}`}>
                        Saldo: {c.saldo.saldoDias} dias
                      </Badge>
                      {c.periodo?.vencido && <Badge variant="destructive">Vencido</Badge>}
                      {c.periodo?.proximoVencer && !c.periodo?.vencido && <Badge className="bg-yellow-100 text-yellow-800">Próximo a vencer</Badge>}
                      {!c.periodo?.vencido && !c.periodo?.proximoVencer && <Badge variant="outline" className="text-green-600">Regular</Badge>}
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                        setSelectedColab(c);
                        setForm(f => ({ ...f, colaboradorId: c.id }));
                        setShowForm(true);
                      }}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Férias
                      </Button>
                    </div>
                  </div>
                  {c.periodo && (
                    <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground block">Aquisitivo</span>
                        <span className="font-medium">{formatDateBR(c.periodo.inicioAquisitivo)} a {formatDateBR(c.periodo.fimAquisitivo)}</span>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground block">Concessivo até</span>
                        <span className="font-medium">{formatDateBR(c.periodo.fimConcessivo)}</span>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground block">Tempo de Casa</span>
                        <span className="font-medium">{c.periodo.anosCompletos}a {c.periodo.mesesTrabalhados}m</span>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground block">Períodos Usados</span>
                        <span className="font-medium">{c.saldo.periodosUsados}/3</span>
                      </div>
                    </div>
                  )}
                  {c.ferias.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Férias Registradas:</span>
                      {c.ferias.map((f: any) => (
                        <div key={f.id} className="flex items-center gap-2 text-xs bg-blue-50 rounded p-2">
                          <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                          <span>{formatDateBR(f.periodo1Inicio || f.dataInicio)} a {formatDateBR(f.periodo1Fim || f.dataFim)}</span>
                          <span className="text-muted-foreground">({f.periodo1Dias || f.diasTotais} dias)</span>
                          <Badge variant="outline" className="text-[10px]">{f.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="solicitacoes" className="space-y-4 mt-4">
          {solList.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>}
          {solList.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{s.colaboradorNome}</h4>
                    <p className="text-xs text-muted-foreground">{s.tipo === 'ferias' ? 'Férias' : 'Folga'} — {formatDateBR(s.dataInicio)} a {formatDateBR(s.dataFim)}</p>
                    {s.motivo && <p className="text-xs text-muted-foreground mt-1">{s.motivo}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === 'pendente' && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => updateSolicitacao.mutate({ id: s.id, data: { status: 'aprovada' } })}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => {
                          const justificativa = prompt('Justificativa para recusa:');
                          if (justificativa) updateSolicitacao.mutate({ id: s.id, data: { status: 'recusada', justificativaRecusa: justificativa } });
                        }}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Recusar
                        </Button>
                      </>
                    )}
                    {s.status !== 'pendente' && (
                      <Badge className={s.status === 'aprovada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {s.status === 'aprovada' ? 'Aprovada' : 'Recusada'}
                      </Badge>
                    )}
                  </div>
                </div>
                {s.justificativaRecusa && <p className="text-xs text-red-500 mt-2">Justificativa: {s.justificativaRecusa}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* CLT Alert Dialog */}
      <Dialog open={cltAlerts.length > 0 && !confirmClt} onOpenChange={() => setCltAlerts([])}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" /> Alertas CLT</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {cltAlerts.map((a, i) => (
              <div key={i} className={`p-3 rounded-lg text-sm ${a.tipo === 'erro' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                {a.msg}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCltAlerts([])}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { setConfirmClt(true); setCltAlerts([]); setTimeout(() => handleSaveFerias(), 100); }}>
              Prosseguir Mesmo Assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Programar Férias Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); setShowForm(open); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar Férias' : 'Programar Férias'}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* Colaborador selector */}
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={handleSelectColab}>
                <SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger>
                <SelectContent>
                  {colabList.filter(c => c.ativo !== false).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto} — {c.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-filled collaborator info */}
            {selectedColab && (
              <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                    <User className="w-4 h-4" /> Dados do Colaborador
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><span className="text-muted-foreground block">Nome</span><span className="font-medium">{selectedColab.nomeCompleto}</span></div>
                    <div><span className="text-muted-foreground block">Cargo</span><span className="font-medium">{selectedColab.cargo}</span></div>
                    <div><span className="text-muted-foreground block">Admissão</span><span className="font-medium">{formatDateBR(selectedColab.dataAdmissao)}</span></div>
                  </div>

                  {/* Vacation Balance */}
                  {saldoSelected && (
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-white rounded p-2 text-center border">
                        <span className="text-muted-foreground block">Direito</span>
                        <span className="font-bold text-lg">{saldoSelected.diasDireito}</span>
                        <span className="text-muted-foreground block">dias</span>
                      </div>
                      <div className="bg-white rounded p-2 text-center border">
                        <span className="text-muted-foreground block">Usados</span>
                        <span className="font-bold text-lg text-orange-600">{saldoSelected.diasUsados}</span>
                        <span className="text-muted-foreground block">dias</span>
                      </div>
                      <div className={`rounded p-2 text-center border ${saldoSelected.saldoDias <= 0 ? 'bg-red-50 border-red-200' : saldoSelected.saldoDias <= 10 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                        <span className="text-muted-foreground block">Saldo</span>
                        <span className={`font-bold text-lg ${saldoSelected.saldoDias <= 0 ? 'text-red-600' : saldoSelected.saldoDias <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>{saldoSelected.saldoDias}</span>
                        <span className="text-muted-foreground block">dias</span>
                      </div>
                      <div className="bg-white rounded p-2 text-center border">
                        <span className="text-muted-foreground block">Períodos</span>
                        <span className="font-bold text-lg">{saldoSelected.periodosUsados}/3</span>
                        <span className="text-muted-foreground block">usados</span>
                      </div>
                    </div>
                  )}

                  {saldoSelected && saldoSelected.saldoDias <= 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded p-2 border border-red-200">
                      <AlertTriangle className="w-4 h-4" /> Saldo de férias esgotado para este período aquisitivo.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dates and period */}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Início *</Label><Input type="date" value={form.dataInicio} onChange={e => handleDatesChange('dataInicio', e.target.value)} /></div>
              <div><Label>Data Fim *</Label><Input type="date" value={form.dataFim} onChange={e => handleDatesChange('dataFim', e.target.value)} /></div>
            </div>

            {form.diasPeriodo > 0 && (
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded p-3">
                <Info className="w-4 h-4 text-blue-500" />
                <span>Período de <strong>{form.diasPeriodo} dias</strong></span>
                {saldoSelected && form.diasPeriodo > 0 && (
                  <span className="text-muted-foreground ml-2">
                    (Restará {saldoSelected.saldoDias - form.diasPeriodo} dias após esta programação)
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nº do Período (fracionamento)</Label>
                <Select value={String(form.periodoNum)} onValueChange={v => setForm(f => ({ ...f, periodoNum: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Período (mín. 14 dias)</SelectItem>
                    <SelectItem value="2">2º Período (mín. 5 dias)</SelectItem>
                    <SelectItem value="3">3º Período (mín. 5 dias)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="em_gozo">Em Gozo</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.abonoConvertido} onChange={e => setForm(f => ({ ...f, abonoConvertido: e.target.checked }))} className="rounded" />
                <span className="text-sm">Abono pecuniário (converter 1/3 em dinheiro)</span>
              </label>
            </div>

            <div><Label>Observação</Label><Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancelar</Button>
            <Button onClick={handleSaveFerias} disabled={createFerias.isPending || updateFerias.isPending || (saldoSelected?.saldoDias || 0) <= 0}>
              {editId ? 'Salvar' : 'Programar Férias'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Solicitação de Folga Dialog */}
      <Dialog open={showSolicitacao} onOpenChange={setShowSolicitacao}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Solicitação de Folga/Férias</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={solForm.colaboradorId ? String(solForm.colaboradorId) : ''} onValueChange={v => {
                const c = colabList.find((c: any) => c.id === Number(v));
                setSolForm(f => ({ ...f, colaboradorId: Number(v), colaboradorNome: c?.nomeCompleto || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {colabList.filter(c => c.ativo !== false).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto} — {c.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={solForm.tipo} onValueChange={v => setSolForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="folga">Folga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Início</Label><Input type="date" value={solForm.dataInicio} onChange={e => setSolForm(f => ({ ...f, dataInicio: e.target.value }))} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={solForm.dataFim} onChange={e => setSolForm(f => ({ ...f, dataFim: e.target.value }))} /></div>
            </div>
            <div><Label>Motivo</Label><Textarea value={solForm.motivo} onChange={e => setSolForm(f => ({ ...f, motivo: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSolicitacao(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!solForm.colaboradorId) { toast.error('Selecione o colaborador'); return; }
              const diasSol = calcDias(solForm.dataInicio, solForm.dataFim);
              createSolicitacao.mutate({ colaboradorId: solForm.colaboradorId, tipo: solForm.tipo as any, dataInicio: solForm.dataInicio, dataFim: solForm.dataFim, diasSolicitados: diasSol, motivo: solForm.motivo });
            }} disabled={createSolicitacao.isPending}>
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
