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
import { Plus, Calendar, AlertTriangle, CheckCircle2, Clock, XCircle, Send, Search, CalendarDays } from 'lucide-react';

// CLT validation helpers
function validateFeriasCLT(dataInicio: string, dataFim: string, diasTotais: number, fracionamento: number) {
  const alerts: { tipo: 'erro' | 'aviso'; msg: string }[] = [];
  if (!dataInicio || !dataFim) return alerts;

  const inicio = new Date(dataInicio + 'T12:00:00');
  const fim = new Date(dataFim + 'T12:00:00');
  const dias = Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Início não pode ser 2 dias antes de feriado/repouso semanal
  const diaSemana = inicio.getDay(); // 0=dom, 6=sab
  if (diaSemana === 5 || diaSemana === 4) {
    alerts.push({ tipo: 'aviso', msg: 'CLT Art. 134 §3º: É proibido que o início das férias ocorra no período de dois dias que antecede feriado ou repouso semanal remunerado.' });
  }

  // Fracionamento rules
  if (fracionamento > 3) {
    alerts.push({ tipo: 'erro', msg: 'CLT Art. 134 §1º: As férias podem ser divididas em no máximo 3 períodos.' });
  }
  if (fracionamento >= 2) {
    if (dias < 14 && fracionamento === 1) {
      alerts.push({ tipo: 'erro', msg: 'CLT Art. 134 §1º: Um dos períodos de férias fracionadas não pode ser inferior a 14 dias corridos.' });
    }
    if (dias < 5) {
      alerts.push({ tipo: 'erro', msg: 'CLT Art. 134 §1º: Nenhum período de férias fracionadas pode ser inferior a 5 dias corridos.' });
    }
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

export default function FeriasGEG() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('cronograma');
  const [cltAlerts, setCltAlerts] = useState<{ tipo: string; msg: string }[]>([]);
  const [confirmClt, setConfirmClt] = useState(false);

  const [form, setForm] = useState({
    colaboradorId: 0, colaboradorNome: '', dataInicio: '', dataFim: '',
    diasTotais: 30, fracionamento: 1, periodoAquisitivoInicio: '', periodoAquisitivoFim: '',
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
    setForm({ colaboradorId: 0, colaboradorNome: '', dataInicio: '', dataFim: '', diasTotais: 30, fracionamento: 1, periodoAquisitivoInicio: '', periodoAquisitivoFim: '', abonoConvertido: false, observacao: '', status: 'programada' });
    setEditId(null); setCltAlerts([]); setConfirmClt(false);
  };

  const handleSaveFerias = () => {
    if (!form.colaboradorId) { toast.error('Selecione o colaborador'); return; }
    if (!form.dataInicio || !form.dataFim) { toast.error('Informe as datas'); return; }

    // CLT validation
    const alerts = validateFeriasCLT(form.dataInicio, form.dataFim, form.diasTotais, form.fracionamento);
    if (alerts.length > 0 && !confirmClt) {
      setCltAlerts(alerts);
      return;
    }

    const payload = {
      colaboradorId: form.colaboradorId,
      periodoAquisitivoInicio: form.periodoAquisitivoInicio || form.dataInicio,
      periodoAquisitivoFim: form.periodoAquisitivoFim || form.dataFim,
      periodoConcessivoFim: form.dataFim,
      periodo1Inicio: form.dataInicio,
      periodo1Fim: form.dataFim,
      periodo1Dias: form.diasTotais,
      diasTotais: form.diasTotais,
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

  const colabList = (colaboradores.data || []) as any[];
  const feriasList = (ferias.data || []) as any[];
  const solList = (solicitacoes.data || []) as any[];

  // Compute vacation status for each collaborator
  const colabComFerias = useMemo(() => {
    return colabList.filter(c => c.ativo !== false).map(c => {
      const periodo = calcPeriodoAquisitivo(c.dataAdmissao);
      const feriasColab = feriasList.filter(f => f.colaboradorId === c.id);
      return { ...c, periodo, ferias: feriasColab };
    });
  }, [colabList, feriasList]);

  const vencidos = colabComFerias.filter(c => c.periodo?.vencido);
  const proximoVencer = colabComFerias.filter(c => c.periodo?.proximoVencer && !c.periodo?.vencido);

  const filtered = useMemo(() => {
    if (!search.trim()) return colabComFerias;
    const s = search.toLowerCase();
    return colabComFerias.filter(c => c.nomeCompleto?.toLowerCase().includes(s));
  }, [colabComFerias, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Férias — Gente & Gestão</h1>
          <p className="text-muted-foreground">Gestão de férias conforme regras da CLT</p>
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
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{c.nomeCompleto}</h4>
                      <p className="text-xs text-muted-foreground">{c.cargo} — Admissão: {c.dataAdmissao}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.periodo?.vencido && <Badge variant="destructive">Vencido</Badge>}
                      {c.periodo?.proximoVencer && !c.periodo?.vencido && <Badge className="bg-yellow-100 text-yellow-800">Próximo a vencer</Badge>}
                      {!c.periodo?.vencido && !c.periodo?.proximoVencer && <Badge variant="outline" className="text-green-600">Regular</Badge>}
                    </div>
                  </div>
                  {c.periodo && (
                    <div className="mt-2 text-xs text-muted-foreground grid grid-cols-3 gap-2">
                      <span>Aquisitivo: {c.periodo.inicioAquisitivo} a {c.periodo.fimAquisitivo}</span>
                      <span>Concessivo até: {c.periodo.fimConcessivo}</span>
                      <span>{c.periodo.anosCompletos} ano(s) e {c.periodo.mesesTrabalhados} mês(es)</span>
                    </div>
                  )}
                  {c.ferias.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {c.ferias.map((f: any) => (
                        <div key={f.id} className="flex items-center gap-2 text-xs">
                          <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                          <span>{f.dataInicio} a {f.dataFim}</span>
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
                    <p className="text-xs text-muted-foreground">{s.tipo === 'ferias' ? 'Férias' : 'Folga'} — {s.dataInicio} a {s.dataFim}</p>
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
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar Férias' : 'Programar Férias'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={v => {
                const c = colabList.find((c: any) => c.id === Number(v));
                setForm(f => ({ ...f, colaboradorId: Number(v), colaboradorNome: c?.nomeCompleto || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger>
                <SelectContent>
                  {colabList.filter(c => c.ativo !== false).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Início *</Label><Input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} /></div>
              <div><Label>Data Fim *</Label><Input type="date" value={form.dataFim} onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Dias Totais</Label><Input type="number" value={form.diasTotais} onChange={e => setForm(f => ({ ...f, diasTotais: Number(e.target.value) }))} /></div>
              <div><Label>Fracionamento (período nº)</Label><Input type="number" min={1} max={3} value={form.fracionamento} onChange={e => setForm(f => ({ ...f, fracionamento: Number(e.target.value) }))} /></div>
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
            <div><Label>Observação</Label><Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSaveFerias} disabled={createFerias.isPending || updateFerias.isPending}>
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
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
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
              const inicio = new Date(solForm.dataInicio + 'T12:00:00');
              const fim = new Date(solForm.dataFim + 'T12:00:00');
              const diasSol = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1);
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
