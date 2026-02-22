import React, { useState, useMemo, useCallback } from 'react';
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
import {
  Plus, Calendar, AlertTriangle, CheckCircle2, Clock, XCircle, Send, Search,
  CalendarDays, User, Briefcase, Info, Edit2, Trash2, ShieldCheck, ShieldAlert,
  Calculator, ChevronLeft, ChevronRight, Eye, X, History, Building2
} from 'lucide-react';
import { useLocation } from 'wouter';

// ─── Helpers ───────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getFeriadosNacionais(ano: number): string[] {
  const fixos = [`${ano}-01-01`,`${ano}-04-21`,`${ano}-05-01`,`${ano}-09-07`,`${ano}-10-12`,`${ano}-11-02`,`${ano}-11-15`,`${ano}-12-25`];
  const a=ano%19,b=Math.floor(ano/100),c=ano%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
  const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const mes=Math.floor((h+l-7*m+114)/31),dia=((h+l-7*m+114)%31)+1;
  const pascoa=new Date(ano,mes-1,dia);
  const fmt=(d:Date)=>d.toISOString().split('T')[0];
  const addD=(d:Date,n:number)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
  fixos.push(fmt(addD(pascoa,-47)),fmt(addD(pascoa,-48)),fmt(addD(pascoa,-2)),fmt(pascoa),fmt(addD(pascoa,60)));
  return fixos;
}
function isFeriado(d:string){const dt=new Date(d+'T12:00:00');return getFeriadosNacionais(dt.getFullYear()).includes(d);}

function validateFeriasCLT(dataInicio:string,dataFim:string,diasPeriodo:number,periodoNum:number){
  const alerts:{tipo:'erro'|'aviso';msg:string}[]=[];
  if(!dataInicio||!dataFim)return alerts;
  const inicio=new Date(dataInicio+'T12:00:00'),hoje=new Date();
  const diaSemana=inicio.getDay();
  if(diaSemana===0||diaSemana===6) alerts.push({tipo:'erro',msg:'CLT Art. 134 §3º: O início das férias não pode coincidir com repouso semanal remunerado (sábado/domingo).'});
  if(isFeriado(dataInicio)) alerts.push({tipo:'erro',msg:'CLT Art. 134 §3º: O início das férias não pode coincidir com feriado nacional.'});
  for(let i=1;i<=2;i++){const p=new Date(inicio);p.setDate(p.getDate()+i);const ps=p.getDay(),pStr=p.toISOString().split('T')[0];if(ps===0||ps===6||isFeriado(pStr)){alerts.push({tipo:'aviso',msg:`CLT Art. 134 §3º: O início das férias está a ${i} dia(s) de feriado/DSR.`});break;}}
  const diasAte=Math.round((inicio.getTime()-hoje.getTime())/(864e5));
  if(diasAte<30) alerts.push({tipo:'aviso',msg:`CLT Art. 135: Aviso de férias deve ser feito com 30 dias de antecedência. Faltam ${diasAte} dias.`});
  const dataPag=new Date(inicio);dataPag.setDate(dataPag.getDate()-2);
  if(dataPag<hoje) alerts.push({tipo:'aviso',msg:`CLT Art. 145: Pagamento deve ocorrer até 2 dias antes. Prazo: ${dataPag.toLocaleDateString('pt-BR')}.`});
  if(periodoNum===1&&diasPeriodo<14) alerts.push({tipo:'erro',msg:'CLT Art. 134 §1º: 1º período não pode ser inferior a 14 dias.'});
  if(periodoNum>1&&diasPeriodo<5) alerts.push({tipo:'erro',msg:'CLT Art. 134 §1º: Nenhum período pode ser inferior a 5 dias.'});
  if(periodoNum>3) alerts.push({tipo:'erro',msg:'CLT Art. 134 §1º: Máximo 3 períodos de fracionamento.'});
  return alerts;
}

function calcPeriodoAquisitivo(dataAdmissao:string){
  if(!dataAdmissao)return null;
  const adm=new Date(dataAdmissao+'T12:00:00'),hoje=new Date();
  const meses=(hoje.getFullYear()-adm.getFullYear())*12+(hoje.getMonth()-adm.getMonth());
  const anos=Math.floor(meses/12);
  const ini=new Date(adm);ini.setFullYear(adm.getFullYear()+anos);
  const fim=new Date(ini);fim.setFullYear(fim.getFullYear()+1);fim.setDate(fim.getDate()-1);
  const conc=new Date(fim);conc.setFullYear(conc.getFullYear()+1);
  const diasVencer=Math.round((conc.getTime()-hoje.getTime())/864e5);
  return {inicioAquisitivo:ini.toISOString().split('T')[0],fimAquisitivo:fim.toISOString().split('T')[0],fimConcessivo:conc.toISOString().split('T')[0],diasParaVencer:diasVencer,vencido:diasVencer<0,proximoVencer:diasVencer>=0&&diasVencer<=180,mesesTrabalhados:meses%12,anosCompletos:anos};
}
function formatDateBR(d:string){if(!d)return '';const[y,m,day]=d.split('-');return `${day}/${m}/${y}`;}
function calcDias(i:string,f:string){if(!i||!f)return 0;return Math.max(1,Math.round((new Date(f+'T12:00:00').getTime()-new Date(i+'T12:00:00').getTime())/864e5)+1);}
function daysInMonth(y:number,m:number){return new Date(y,m+1,0).getDate();}
function firstDayOfMonth(y:number,m:number){return new Date(y,m,1).getDay();}

// ─── Main Component ────────────────────────────────────────────────
export default function FeriasGEG() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  // State
  const [showForm, setShowForm] = useState(false);
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('calendario');
  const [cltAlerts, setCltAlerts] = useState<{tipo:string;msg:string}[]>([]);
  const [confirmClt, setConfirmClt] = useState(false);
  const [selectedColab, setSelectedColab] = useState<any>(null);
  const [expandedColabId, setExpandedColabId] = useState<number|null>(null);
  const [calView, setCalView] = useState<'ano'|'mes'|'dia'>('ano');
  const [calYear, setCalYear] = useState(anoAtual);
  const [calMonth, setCalMonth] = useState(hoje.getMonth());
  const [calDay, setCalDay] = useState(hoje.getDate());
  const [sectorAlertOpen, setSectorAlertOpen] = useState(false);
  const [sectorAlertData, setSectorAlertData] = useState<{setor:string;colabs:string[];onConfirm:()=>void}|null>(null);

  const [form, setForm] = useState({
    colaboradorId:0,dataInicio:'',dataFim:'',diasPeriodo:0,periodoNum:1,
    abonoConvertido:false,observacao:'',status:'programada' as string,
  });
  const [solForm, setSolForm] = useState({
    colaboradorId:0,colaboradorNome:'',tipo:'folga' as string,
    dataInicio:'',dataFim:'',motivo:'day_off' as string,motivoOutro:'',observacoes:'',
  });

  // Queries
  const colaboradores = trpc.colaboradores.list.useQuery();
  const ferias = trpc.ferias.list.useQuery();
  const dayOffs = trpc.dayOff.list.useQuery();
  const solicitacoes = trpc.solicitacoesFolga.list.useQuery();
  const createFerias = trpc.ferias.create.useMutation({onSuccess:()=>{ferias.refetch();setShowForm(false);resetForm();toast.success('Férias programadas!');}});
  const updateFerias = trpc.ferias.update.useMutation({onSuccess:()=>{ferias.refetch();setShowForm(false);resetForm();toast.success('Férias atualizadas!');}});
  const deleteFerias = trpc.ferias.delete.useMutation({onSuccess:()=>{ferias.refetch();toast.success('Férias excluídas!');}});
  const aprovarGestor = trpc.ferias.aprovarGestor.useMutation({onSuccess:()=>{ferias.refetch();toast.success('Aprovação do gestor registrada!');}});
  const aprovarDiretoria = trpc.ferias.aprovarDiretoria.useMutation({onSuccess:()=>{ferias.refetch();toast.success('Aprovação da diretoria registrada!');}});
  const createSolicitacao = trpc.solicitacoesFolga.create.useMutation({onSuccess:()=>{solicitacoes.refetch();setShowSolicitacao(false);toast.success('Solicitação enviada!');}});
  const updateSolicitacao = trpc.solicitacoesFolga.update.useMutation({onSuccess:()=>{solicitacoes.refetch();toast.success('Solicitação atualizada!');}});

  const resetForm = () => {
    setForm({colaboradorId:0,dataInicio:'',dataFim:'',diasPeriodo:0,periodoNum:1,abonoConvertido:false,observacao:'',status:'programada'});
    setEditId(null);setCltAlerts([]);setConfirmClt(false);setSelectedColab(null);
  };

  const colabList = (colaboradores.data||[]) as any[];
  const feriasList = (ferias.data||[]) as any[];
  const dayOffList = (dayOffs.data||[]) as any[];
  const solList = (solicitacoes.data||[]) as any[];

  const calcSaldo = (colabId:number) => {
    const fc=feriasList.filter(f=>f.colaboradorId===colabId&&f.status!=='cancelada');
    const du=fc.reduce((s:number,f:any)=>s+(f.periodo1Dias||0)+(f.periodo2Dias||0)+(f.periodo3Dias||0),0);
    return {diasUsados:du,saldoDias:30-du,diasDireito:30,periodosUsados:fc.length,periodosRestantes:3-fc.length};
  };

  // ─── Calendar data ───────────────────────────────────────────────
  const calendarEvents = useMemo(() => {
    const events: Record<string, {tipo:'ferias'|'folga'|'dayoff';nome:string;setor:string;id:number;status:string;dias?:number}[]> = {};
    const addEvent = (dateStr:string, ev:any) => {
      if (!dateStr) return;
      if (!events[dateStr]) events[dateStr] = [];
      events[dateStr].push(ev);
    };

    feriasList.forEach((f:any) => {
      const c = colabList.find((c:any) => c.id === f.colaboradorId);
      if (!c) return;
      const inicio = f.periodo1Inicio || f.dataInicio;
      const fim = f.periodo1Fim || f.dataFim;
      if (!inicio || !fim) return;
      const d1 = new Date(inicio+'T12:00:00');
      const d2 = new Date(fim+'T12:00:00');
      for (let d = new Date(d1); d <= d2; d.setDate(d.getDate()+1)) {
        addEvent(d.toISOString().split('T')[0], {tipo:'ferias',nome:c.nomeCompleto,setor:c.setor||'',id:f.id,status:f.status,dias:f.periodo1Dias||f.diasTotais});
      }
    });

    dayOffList.forEach((d:any) => {
      const c = colabList.find((c:any) => c.id === d.colaboradorId);
      if (!c) return;
      const dt = d.dataEfetiva || d.dataOriginal;
      if (dt) addEvent(dt, {tipo:'dayoff',nome:c.nomeCompleto,setor:c.setor||'',id:d.id,status:d.status});
    });

    solList.forEach((s:any) => {
      if (s.status === 'recusada') return;
      const c = colabList.find((c:any) => c.id === s.colaboradorId);
      const nome = c?.nomeCompleto || s.colaboradorNome || 'N/A';
      const setor = c?.setor || '';
      if (s.dataInicio && s.dataFim) {
        const d1 = new Date(s.dataInicio+'T12:00:00');
        const d2 = new Date(s.dataFim+'T12:00:00');
        for (let d = new Date(d1); d <= d2; d.setDate(d.getDate()+1)) {
          addEvent(d.toISOString().split('T')[0], {tipo:'folga',nome,setor,id:s.id,status:s.status});
        }
      }
    });

    return events;
  }, [feriasList, dayOffList, solList, colabList]);

  // ─── Concessivo alerts (next 6 months) ───────────────────────────
  const colabComFerias = useMemo(() => {
    return colabList.filter(c => c.ativo !== false && c.status !== 'desligado').map(c => {
      const periodo = calcPeriodoAquisitivo(c.dataAdmissao);
      const feriasColab = feriasList.filter((f:any) => f.colaboradorId === c.id);
      const dayOffsColab = dayOffList.filter((d:any) => d.colaboradorId === c.id);
      const folgas = solList.filter((s:any) => s.colaboradorId === c.id);
      const saldo = calcSaldo(c.id);
      return { ...c, periodo, ferias: feriasColab, dayOffs: dayOffsColab, folgas, saldo };
    });
  }, [colabList, feriasList, dayOffList, solList]);

  const concessivosAVencer = useMemo(() => {
    return colabComFerias.filter(c => c.periodo && c.periodo.diasParaVencer >= 0 && c.periodo.diasParaVencer <= 180 && !c.periodo.vencido);
  }, [colabComFerias]);

  const concessivosVencidos = useMemo(() => {
    return colabComFerias.filter(c => c.periodo?.vencido);
  }, [colabComFerias]);

  const filtered = useMemo(() => {
    if (!search.trim()) return colabComFerias;
    const s = search.toLowerCase();
    return colabComFerias.filter(c => c.nomeCompleto?.toLowerCase().includes(s) || c.cargo?.toLowerCase().includes(s) || c.setor?.toLowerCase().includes(s));
  }, [colabComFerias, search]);

  // ─── Sector overlap check ───────────────────────────────────────
  const checkSectorOverlap = useCallback((colabId:number, dataInicio:string, dataFim:string, onConfirm:()=>void) => {
    const colab = colabList.find((c:any) => c.id === colabId);
    if (!colab || !colab.setor) { onConfirm(); return; }
    const setor = colab.setor;
    const d1 = new Date(dataInicio+'T12:00:00');
    const d2 = new Date(dataFim+'T12:00:00');

    const colabsNoSetor = colabList.filter((c:any) => c.setor === setor && c.id !== colabId && c.ativo !== false);
    const conflitos: string[] = [];

    colabsNoSetor.forEach((c:any) => {
      const feriasC = feriasList.filter((f:any) => f.colaboradorId === c.id && f.status !== 'cancelada');
      feriasC.forEach((f:any) => {
        const fi = new Date((f.periodo1Inicio||f.dataInicio)+'T12:00:00');
        const ff = new Date((f.periodo1Fim||f.dataFim)+'T12:00:00');
        if (d1 <= ff && d2 >= fi) conflitos.push(`${c.nomeCompleto} (Férias: ${formatDateBR(f.periodo1Inicio||f.dataInicio)} a ${formatDateBR(f.periodo1Fim||f.dataFim)})`);
      });
      const dayOffsC = dayOffList.filter((d:any) => d.colaboradorId === c.id && d.status !== 'recusado');
      dayOffsC.forEach((d:any) => {
        const dt = new Date((d.dataEfetiva||d.dataOriginal)+'T12:00:00');
        if (dt >= d1 && dt <= d2) conflitos.push(`${c.nomeCompleto} (Day Off: ${formatDateBR(d.dataEfetiva||d.dataOriginal)})`);
      });
      const folgasC = solList.filter((s:any) => s.colaboradorId === c.id && s.status !== 'recusada');
      folgasC.forEach((s:any) => {
        if (s.dataInicio && s.dataFim) {
          const si = new Date(s.dataInicio+'T12:00:00');
          const sf = new Date(s.dataFim+'T12:00:00');
          if (d1 <= sf && d2 >= si) conflitos.push(`${c.nomeCompleto} (Folga: ${formatDateBR(s.dataInicio)} a ${formatDateBR(s.dataFim)})`);
        }
      });
    });

    if (conflitos.length > 0) {
      setSectorAlertData({setor, colabs: Array.from(new Set(conflitos)), onConfirm});
      setSectorAlertOpen(true);
    } else {
      onConfirm();
    }
  }, [colabList, feriasList, dayOffList, solList]);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleSelectColab = (colabId:string) => {
    const c = colabList.find((c:any) => c.id === Number(colabId));
    if (!c) return;
    setSelectedColab(c);
    setForm(f => ({...f, colaboradorId: c.id}));
  };

  const handleDatesChange = (field:'dataInicio'|'dataFim', value:string) => {
    setForm(f => {
      const u = {...f, [field]: value};
      if (u.dataInicio && u.dataFim) u.diasPeriodo = calcDias(u.dataInicio, u.dataFim);
      return u;
    });
  };

  const doSaveFerias = () => {
    const periodo = calcPeriodoAquisitivo(selectedColab?.dataAdmissao || '');
    const payload = {
      colaboradorId:form.colaboradorId,
      periodoAquisitivoInicio:periodo?.inicioAquisitivo||form.dataInicio,
      periodoAquisitivoFim:periodo?.fimAquisitivo||form.dataFim,
      periodoConcessivoFim:periodo?.fimConcessivo||form.dataFim,
      periodo1Inicio:form.dataInicio,periodo1Fim:form.dataFim,periodo1Dias:form.diasPeriodo,
      diasTotais:form.diasPeriodo,status:(form.status||'programada') as any,
      abonoConvertido:form.abonoConvertido,observacao:form.observacao,
    };
    if (editId) updateFerias.mutate({id:editId,data:payload});
    else createFerias.mutate(payload);
  };

  const handleSaveFerias = () => {
    if (!form.colaboradorId) {toast.error('Selecione o colaborador');return;}
    if (!form.dataInicio || !form.dataFim) {toast.error('Informe as datas');return;}
    if (form.diasPeriodo <= 0) {toast.error('Período inválido');return;}
    const saldo = calcSaldo(form.colaboradorId);
    if (form.diasPeriodo > saldo.saldoDias) {toast.error(`Saldo insuficiente! Restam ${saldo.saldoDias} dias.`);return;}
    if (saldo.periodosRestantes <= 0 && !editId) {toast.error('Limite de 3 períodos atingido.');return;}
    const alerts = validateFeriasCLT(form.dataInicio,form.dataFim,form.diasPeriodo,form.periodoNum);
    if (alerts.length > 0 && !confirmClt) {setCltAlerts(alerts);return;}
    checkSectorOverlap(form.colaboradorId, form.dataInicio, form.dataFim, doSaveFerias);
  };

  const saldoSelected = selectedColab ? calcSaldo(selectedColab.id) : null;

  // ─── Calendar rendering helpers ──────────────────────────────────
  const getEventsForDate = (dateStr:string) => calendarEvents[dateStr] || [];

  const renderMiniMonth = (year:number, month:number) => {
    const days = daysInMonth(year, month);
    const first = firstDayOfMonth(year, month);
    const todayStr = hoje.toISOString().split('T')[0];
    const cells: React.ReactElement[] = [];

    for (let i = 0; i < first; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const evts = getEventsForDate(dateStr);
      const isToday = dateStr === todayStr;
      const hasFerias = evts.some(e => e.tipo === 'ferias');
      const hasFolga = evts.some(e => e.tipo === 'folga' || e.tipo === 'dayoff');

      cells.push(
        <button key={d} onClick={() => {setCalMonth(month);setCalDay(d);setCalView('dia');}}
          className={`relative w-full aspect-square flex items-center justify-center text-xs rounded-md transition-all hover:bg-accent
            ${isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
            ${hasFerias && !isToday ? 'bg-blue-100 text-blue-800 font-medium' : ''}
            ${hasFolga && !hasFerias && !isToday ? 'bg-pink-100 text-pink-800 font-medium' : ''}
          `}
          title={evts.length > 0 ? evts.map(e => `${e.nome} (${e.tipo})`).join(', ') : undefined}
        >
          {d}
          {evts.length > 0 && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
              {hasFerias && <span className="w-1 h-1 rounded-full bg-blue-500" />}
              {hasFolga && <span className="w-1 h-1 rounded-full bg-pink-500" />}
            </span>
          )}
        </button>
      );
    }
    return cells;
  };

  // Events for selected day
  const selectedDayStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(calDay).padStart(2,'0')}`;
  const selectedDayEvents = getEventsForDate(selectedDayStr);

  // Events for selected month
  const monthEvents = useMemo(() => {
    const evts: {date:string;nome:string;tipo:string;status:string;setor:string}[] = [];
    const prefix = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
    Object.entries(calendarEvents).forEach(([date, events]) => {
      if (date.startsWith(prefix)) {
        events.forEach(e => evts.push({date, nome:e.nome, tipo:e.tipo, status:e.status, setor:e.setor}));
      }
    });
    const seen = new Set<string>();
    return evts.filter(e => {
      const key = `${e.nome}-${e.tipo}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b) => a.date.localeCompare(b.date));
  }, [calendarEvents, calYear, calMonth]);

  // Available years: current year + next year (auto-increment)
  const availableYears = [anoAtual, anoAtual + 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Férias & Folgas — Gente & Gestão</h1>
          <p className="text-muted-foreground">Gestão de férias e folgas com calendário, alertas CLT e controle de saldo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/rh/simulador-ferias')}><Calculator className="w-4 h-4 mr-2" /> Simulador</Button>
          <Button variant="outline" onClick={() => setShowSolicitacao(true)}><Send className="w-4 h-4 mr-2" /> Programar Folgas</Button>
          <Button onClick={() => {resetForm();setShowForm(true);}}><Plus className="w-4 h-4 mr-2" /> Programar Férias</Button>
        </div>
      </div>

      {/* Concessivo Alerts */}
      {concessivosVencidos.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2"><AlertTriangle className="w-5 h-5" /> Férias Vencidas — Risco de Pagamento em Dobro</div>
            <div className="space-y-1">{concessivosVencidos.map(c => (<p key={c.id} className="text-sm text-red-600">{c.nomeCompleto} — Vencido há {Math.abs(c.periodo?.diasParaVencer||0)} dias</p>))}</div>
          </CardContent>
        </Card>
      )}
      {concessivosAVencer.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-700 font-semibold mb-2"><Clock className="w-5 h-5" /> Períodos Concessivos a Vencer (próximos 6 meses)</div>
            <div className="space-y-1">{concessivosAVencer.map(c => (<p key={c.id} className="text-sm text-yellow-600">{c.nomeCompleto} — Vence em {c.periodo?.diasParaVencer} dias ({formatDateBR(c.periodo?.fimConcessivo||'')})</p>))}</div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="calendario"><Calendar className="w-4 h-4 mr-1" /> Calendário</TabsTrigger>
          <TabsTrigger value="colaboradores"><User className="w-4 h-4 mr-1" /> Colaboradores</TabsTrigger>
          <TabsTrigger value="solicitacoes"><Send className="w-4 h-4 mr-1" /> Solicitações ({solList.filter(s => s.status === 'pendente').length})</TabsTrigger>
        </TabsList>

        {/* ─── CALENDÁRIO TAB ─────────────────────────────────────── */}
        <TabsContent value="calendario" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={String(calYear)} onValueChange={v => setCalYear(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{availableYears.map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
              </Select>
              {calView !== 'ano' && (
                <Select value={String(calMonth)} onValueChange={v => setCalMonth(Number(v))}>
                  <SelectTrigger className="w-36"><SelectValue>{MESES[calMonth]}</SelectValue></SelectTrigger>
                  <SelectContent>{MESES.map((m,i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}</SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-md overflow-hidden">
                <button onClick={() => setCalView('ano')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${calView==='ano'?'bg-primary text-primary-foreground':'hover:bg-accent'}`}>Ano</button>
                <button onClick={() => setCalView('mes')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${calView==='mes'?'bg-primary text-primary-foreground':'hover:bg-accent'}`}>Mês</button>
                <button onClick={() => {setCalView('dia');setCalDay(hoje.getDate());setCalMonth(hoje.getMonth());setCalYear(anoAtual);}} className={`px-3 py-1.5 text-xs font-medium transition-colors ${calView==='dia'?'bg-primary text-primary-foreground':'hover:bg-accent'}`}>Hoje</button>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                if (calView==='ano') setCalYear(y=>y-1);
                else if (calView==='mes') {if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}
                else {const d=new Date(calYear,calMonth,calDay-1);setCalYear(d.getFullYear());setCalMonth(d.getMonth());setCalDay(d.getDate());}
              }}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => {
                if (calView==='ano') setCalYear(y=>y+1);
                else if (calView==='mes') {if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}
                else {const d=new Date(calYear,calMonth,calDay+1);setCalYear(d.getFullYear());setCalMonth(d.getMonth());setCalDay(d.getDate());}
              }}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Férias</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Folga / Day Off</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary" /> Hoje</span>
          </div>

          {/* ANNUAL VIEW */}
          {calView === 'ano' && (
            <div className="grid grid-cols-4 gap-4">
              {MESES.map((nome, idx) => {
                const isCurrentMonth = calYear === anoAtual && idx === hoje.getMonth();
                return (
                  <Card key={idx} className={`cursor-pointer hover:shadow-md transition-shadow ${isCurrentMonth ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {setCalMonth(idx);setCalView('mes');}}>
                    <CardContent className="p-3">
                      <h4 className={`text-sm font-semibold mb-2 ${isCurrentMonth ? 'text-primary' : ''}`}>{nome}</h4>
                      <div className="grid grid-cols-7 gap-0.5 text-[10px]">
                        {['D','S','T','Q','Q','S','S'].map((d,i) => (<div key={i} className="text-center text-muted-foreground font-medium">{d}</div>))}
                        {renderMiniMonth(calYear, idx)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* MONTHLY VIEW */}
          {calView === 'mes' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3">{MESES[calMonth]} {calYear}</h3>
                  <div className="grid grid-cols-7 gap-1">
                    {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d,i) => (<div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>))}
                    {renderMiniMonth(calYear, calMonth).map((cell, i) => (
                      <div key={i} className="min-h-[48px]">{cell}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Ausências em {MESES[calMonth]} {calYear}</CardTitle></CardHeader>
                <CardContent>
                  {monthEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma ausência programada neste mês.</p>
                  ) : (
                    <div className="space-y-2">
                      {monthEvents.map((e, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${e.tipo==='ferias'?'bg-blue-500':'bg-pink-500'}`} />
                          <span className="text-sm font-medium flex-1">{e.nome}</span>
                          <span className="text-xs text-muted-foreground">{e.setor}</span>
                          <Badge variant="outline" className="text-[10px]">{e.tipo==='ferias'?'Férias':e.tipo==='dayoff'?'Day Off':'Folga'}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDateBR(e.date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* DAY VIEW */}
          {calView === 'dia' && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{calDay} de {MESES[calMonth]} de {calYear}</CardTitle></CardHeader>
              <CardContent>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma ausência neste dia.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((e, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${e.tipo==='ferias'?'bg-blue-100':'bg-pink-100'}`}>
                          {e.tipo==='ferias' ? <Calendar className="w-5 h-5 text-blue-600" /> : <CalendarDays className="w-5 h-5 text-pink-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{e.nome}</p>
                          <p className="text-xs text-muted-foreground">{e.setor} — {e.tipo==='ferias'?'Férias':e.tipo==='dayoff'?'Day Off':'Folga'}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${e.status==='aprovado'||e.status==='aprovada'||e.status==='concluida'?'bg-green-50 text-green-700':'bg-yellow-50 text-yellow-700'}`}>{e.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── COLABORADORES TAB ──────────────────────────────────── */}
        <TabsContent value="colaboradores" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, cargo ou setor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-2">
            {filtered.map(c => {
              const isExpanded = expandedColabId === c.id;
              return (
                <Card key={c.id} className={`transition-shadow ${isExpanded ? 'ring-1 ring-primary shadow-md' : 'hover:shadow-sm cursor-pointer'}`}>
                  <CardContent className="p-0">
                    {/* Compact row */}
                    <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpandedColabId(isExpanded ? null : c.id)}>
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.nomeCompleto}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.cargo}</p>
                      </div>
                      <div className="hidden md:block text-xs text-muted-foreground w-28 text-center">
                        <span className="block text-[10px] uppercase tracking-wide">Setor</span>
                        <span className="font-medium">{c.setor || '—'}</span>
                      </div>
                      <div className="hidden md:block text-xs text-muted-foreground w-40 text-center">
                        <span className="block text-[10px] uppercase tracking-wide">Concessivo até</span>
                        <span className="font-medium">{c.periodo ? formatDateBR(c.periodo.fimConcessivo) : '—'}</span>
                      </div>
                      <div className="hidden md:block text-xs text-muted-foreground w-24 text-center">
                        <span className="block text-[10px] uppercase tracking-wide">Tempo de Casa</span>
                        <span className="font-medium">{c.periodo ? `${c.periodo.anosCompletos}a ${c.periodo.mesesTrabalhados}m` : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${c.saldo.saldoDias<=0?'text-red-600 border-red-300':c.saldo.saldoDias<=10?'text-yellow-600 border-yellow-300':'text-green-600 border-green-300'}`}>
                          {c.saldo.saldoDias}d
                        </Badge>
                        {c.periodo?.vencido && <Badge variant="destructive" className="text-[10px]">Vencido</Badge>}
                        {c.periodo?.proximoVencer && !c.periodo?.vencido && <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">A vencer</Badge>}
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/20">
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <div className="bg-background rounded p-2 border"><span className="text-muted-foreground block">Admissão</span><span className="font-medium">{formatDateBR(c.dataAdmissao)}</span></div>
                          <div className="bg-background rounded p-2 border"><span className="text-muted-foreground block">Aquisitivo</span><span className="font-medium">{c.periodo ? `${formatDateBR(c.periodo.inicioAquisitivo)} a ${formatDateBR(c.periodo.fimAquisitivo)}` : '—'}</span></div>
                          <div className="bg-background rounded p-2 border"><span className="text-muted-foreground block">Concessivo até</span><span className="font-medium">{c.periodo ? formatDateBR(c.periodo.fimConcessivo) : '—'}</span></div>
                          <div className={`rounded p-2 border ${c.saldo.saldoDias<=0?'bg-red-50 border-red-200':c.saldo.saldoDias<=10?'bg-yellow-50 border-yellow-200':'bg-green-50 border-green-200'}`}>
                            <span className="text-muted-foreground block">Saldo</span><span className="font-bold">{c.saldo.saldoDias} dias</span>
                          </div>
                          <div className="bg-background rounded p-2 border"><span className="text-muted-foreground block">Períodos</span><span className="font-medium">{c.saldo.periodosUsados}/3</span></div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {setSelectedColab(c);setForm(f=>({...f,colaboradorId:c.id}));setShowForm(true);}}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Férias
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSolForm(f=>({...f,colaboradorId:c.id,colaboradorNome:c.nomeCompleto}));
                            setShowSolicitacao(true);
                          }}>
                            <Send className="w-3.5 h-3.5 mr-1" /> Folga
                          </Button>
                        </div>

                        {/* Férias history */}
                        <div>
                          <h5 className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2"><History className="w-3.5 h-3.5" /> Histórico de Férias</h5>
                          {c.ferias.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Nenhuma férias registrada.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {c.ferias.map((f:any) => (
                                <div key={f.id} className="flex items-center gap-2 text-xs bg-blue-50 rounded p-2">
                                  <CalendarDays className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                  <span>{formatDateBR(f.periodo1Inicio||f.dataInicio)} a {formatDateBR(f.periodo1Fim||f.dataFim)}</span>
                                  <span className="text-muted-foreground">({f.periodo1Dias||f.diasTotais} dias)</span>
                                  <Badge variant="outline" className="text-[10px]">{f.status}</Badge>
                                  {f.aprovadorGestorStatus && f.aprovadorGestorStatus !== 'pendente' && (
                                    <Badge variant="outline" className={`text-[10px] ${f.aprovadorGestorStatus==='aprovado'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>
                                      Gestor: {f.aprovadorGestorStatus==='aprovado'?'✓':'✗'}
                                    </Badge>
                                  )}
                                  {f.aprovadorDiretoriaStatus && f.aprovadorDiretoriaStatus !== 'pendente' && (
                                    <Badge variant="outline" className={`text-[10px] ${f.aprovadorDiretoriaStatus==='aprovado'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>
                                      Diretoria: {f.aprovadorDiretoriaStatus==='aprovado'?'✓':'✗'}
                                    </Badge>
                                  )}
                                  <div className="ml-auto flex gap-1">
                                    {f.aprovadorGestorStatus === 'pendente' && (
                                      <button onClick={() => aprovarGestor.mutate({id:f.id,aprovado:true})} className="p-1 hover:bg-green-100 rounded" title="Aprovar (Gestor)"><ShieldCheck className="w-3.5 h-3.5 text-green-600" /></button>
                                    )}
                                    {f.aprovadorGestorStatus === 'aprovado' && f.aprovadorDiretoriaStatus === 'pendente' && (
                                      <button onClick={() => aprovarDiretoria.mutate({id:f.id,aprovado:true})} className="p-1 hover:bg-green-100 rounded" title="Aprovar (Diretoria)"><ShieldAlert className="w-3.5 h-3.5 text-blue-600" /></button>
                                    )}
                                    <button onClick={() => {setEditId(f.id);setSelectedColab(c);setForm({colaboradorId:c.id,dataInicio:f.periodo1Inicio||'',dataFim:f.periodo1Fim||'',diasPeriodo:f.periodo1Dias||f.diasTotais||0,periodoNum:1,abonoConvertido:f.abonoConvertido||false,observacao:f.observacao||'',status:f.status||'programada'});setShowForm(true);}} className="p-1 hover:bg-blue-100 rounded" title="Editar"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></button>
                                    {f.status !== 'em_gozo' && (
                                      <button onClick={() => {if(confirm('Excluir férias?'))deleteFerias.mutate({id:f.id});}} className="p-1 hover:bg-red-100 rounded" title="Excluir"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Folgas / Day Offs history */}
                        <div>
                          <h5 className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2"><CalendarDays className="w-3.5 h-3.5" /> Histórico de Folgas & Day Offs</h5>
                          {(c.dayOffs.length === 0 && c.folgas.length === 0) ? (
                            <p className="text-xs text-muted-foreground italic">Nenhuma folga registrada.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {c.dayOffs.map((d:any) => (
                                <div key={`do-${d.id}`} className="flex items-center gap-2 text-xs bg-pink-50 rounded p-2">
                                  <CalendarDays className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
                                  <span>{formatDateBR(d.dataEfetiva||d.dataOriginal)}</span>
                                  <span className="text-muted-foreground">Day Off Aniversário</span>
                                  <Badge variant="outline" className={`text-[10px] ${d.status==='aprovado'?'bg-green-50 text-green-700 border-green-200':d.status==='recusado'?'bg-red-50 text-red-700 border-red-200':'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{d.status}</Badge>
                                </div>
                              ))}
                              {c.folgas.map((s:any) => (
                                <div key={`sol-${s.id}`} className="flex items-center gap-2 text-xs bg-purple-50 rounded p-2">
                                  <Send className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                  <span>{formatDateBR(s.dataInicio)} a {formatDateBR(s.dataFim)}</span>
                                  <span className="text-muted-foreground">{s.motivo?.split('\n')[0] || 'Folga'}</span>
                                  <Badge variant="outline" className={`text-[10px] ${s.status==='aprovada'?'bg-green-50 text-green-700 border-green-200':s.status==='recusada'?'bg-red-50 text-red-700 border-red-200':'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{s.status}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── SOLICITAÇÕES TAB ───────────────────────────────────── */}
        <TabsContent value="solicitacoes" className="space-y-4 mt-4">
          {solList.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>}
          {solList.map((s:any) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{s.colaboradorNome || colabList.find((c:any)=>c.id===s.colaboradorId)?.nomeCompleto || 'N/A'}</h4>
                    <p className="text-xs text-muted-foreground">{s.tipo==='ferias'?'Férias':'Folga'} — {formatDateBR(s.dataInicio)} a {formatDateBR(s.dataFim)}</p>
                    {s.motivo && <p className="text-xs text-muted-foreground mt-1">{s.motivo}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === 'pendente' && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => updateSolicitacao.mutate({id:s.id,data:{status:'aprovada'}})}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovar</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => {const j=prompt('Justificativa:');if(j)updateSolicitacao.mutate({id:s.id,data:{status:'recusada',justificativaRecusa:j}});}}><XCircle className="w-3.5 h-3.5 mr-1" /> Recusar</Button>
                      </>
                    )}
                    {s.status !== 'pendente' && (
                      <Badge className={s.status==='aprovada'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}>{s.status==='aprovada'?'Aprovada':'Recusada'}</Badge>
                    )}
                  </div>
                </div>
                {s.justificativaRecusa && <p className="text-xs text-red-500 mt-2">Justificativa: {s.justificativaRecusa}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ─── SECTOR OVERLAP ALERT ─────────────────────────────────── */}
      <Dialog open={sectorAlertOpen} onOpenChange={setSectorAlertOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-700"><AlertTriangle className="w-5 h-5" /> Alerta de Sobreposição no Setor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Existem outros colaboradores do setor <strong>{sectorAlertData?.setor}</strong> com ausências no mesmo período:</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {sectorAlertData?.colabs.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-yellow-50 rounded p-2 border border-yellow-200">
                  <Building2 className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Programar esta ausência pode causar ruptura de atendimento no setor. Deseja continuar?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectorAlertOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {setSectorAlertOpen(false);sectorAlertData?.onConfirm();}}>Prosseguir Mesmo Assim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── CLT ALERT DIALOG ─────────────────────────────────────── */}
      <Dialog open={cltAlerts.length > 0 && !confirmClt} onOpenChange={() => setCltAlerts([])}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" /> Alertas CLT</DialogTitle></DialogHeader>
          <div className="space-y-3">{cltAlerts.map((a,i) => (<div key={i} className={`p-3 rounded-lg text-sm ${a.tipo==='erro'?'bg-red-50 text-red-700 border border-red-200':'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>{a.msg}</div>))}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCltAlerts([])}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {setConfirmClt(true);setCltAlerts([]);setTimeout(()=>handleSaveFerias(),100);}}>Prosseguir Mesmo Assim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── PROGRAMAR FÉRIAS DIALOG ──────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={(open) => {if(!open)resetForm();setShowForm(open);}}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar Férias' : 'Programar Férias'}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId?String(form.colaboradorId):''} onValueChange={handleSelectColab}>
                <SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger>
                <SelectContent>{colabList.filter(c=>c.ativo!==false).map((c:any)=>(<SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto} — {c.cargo}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {selectedColab && (
              <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-800"><User className="w-4 h-4" /> Dados do Colaborador</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><span className="text-muted-foreground block">Nome</span><span className="font-medium">{selectedColab.nomeCompleto}</span></div>
                    <div><span className="text-muted-foreground block">Cargo</span><span className="font-medium">{selectedColab.cargo}</span></div>
                    <div><span className="text-muted-foreground block">Admissão</span><span className="font-medium">{formatDateBR(selectedColab.dataAdmissao)}</span></div>
                  </div>
                  {saldoSelected && (
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-white rounded p-2 text-center border"><span className="text-muted-foreground block">Direito</span><span className="font-bold text-lg">{saldoSelected.diasDireito}</span><span className="text-muted-foreground block">dias</span></div>
                      <div className="bg-white rounded p-2 text-center border"><span className="text-muted-foreground block">Usados</span><span className="font-bold text-lg text-orange-600">{saldoSelected.diasUsados}</span><span className="text-muted-foreground block">dias</span></div>
                      <div className={`rounded p-2 text-center border ${saldoSelected.saldoDias<=0?'bg-red-50 border-red-200':saldoSelected.saldoDias<=10?'bg-yellow-50 border-yellow-200':'bg-green-50 border-green-200'}`}>
                        <span className="text-muted-foreground block">Saldo</span><span className={`font-bold text-lg ${saldoSelected.saldoDias<=0?'text-red-600':saldoSelected.saldoDias<=10?'text-yellow-600':'text-green-600'}`}>{saldoSelected.saldoDias}</span><span className="text-muted-foreground block">dias</span>
                      </div>
                      <div className="bg-white rounded p-2 text-center border"><span className="text-muted-foreground block">Períodos</span><span className="font-bold text-lg">{saldoSelected.periodosUsados}/3</span><span className="text-muted-foreground block">usados</span></div>
                    </div>
                  )}
                  {saldoSelected && saldoSelected.saldoDias <= 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded p-2 border border-red-200"><AlertTriangle className="w-4 h-4" /> Saldo esgotado.</div>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Início *</Label><Input type="date" value={form.dataInicio} onChange={e=>handleDatesChange('dataInicio',e.target.value)} /></div>
              <div><Label>Data Fim *</Label><Input type="date" value={form.dataFim} onChange={e=>handleDatesChange('dataFim',e.target.value)} /></div>
            </div>
            {form.diasPeriodo > 0 && (
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded p-3">
                <Info className="w-4 h-4 text-blue-500" />
                <span>Período de <strong>{form.diasPeriodo} dias</strong></span>
                {saldoSelected && <span className="text-muted-foreground ml-2">(Restará {saldoSelected.saldoDias - form.diasPeriodo} dias)</span>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nº do Período</Label>
                <Select value={String(form.periodoNum)} onValueChange={v=>setForm(f=>({...f,periodoNum:Number(v)}))}>
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
                <Select value={form.status} onValueChange={v=>setForm(f=>({...f,status:v}))}>
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.abonoConvertido} onChange={e=>setForm(f=>({...f,abonoConvertido:e.target.checked}))} className="rounded" />
              <span className="text-sm">Abono pecuniário (converter 1/3 em dinheiro)</span>
            </label>
            <div><Label>Observação</Label><Textarea value={form.observacao} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {resetForm();setShowForm(false);}}>Cancelar</Button>
            <Button onClick={handleSaveFerias} disabled={createFerias.isPending||updateFerias.isPending||(saldoSelected?.saldoDias||0)<=0}>{editId?'Salvar':'Programar Férias'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── PROGRAMAR FOLGAS DIALOG ──────────────────────────────── */}
      <Dialog open={showSolicitacao} onOpenChange={setShowSolicitacao}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Programar Folgas</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={solForm.colaboradorId?String(solForm.colaboradorId):''} onValueChange={v=>{const c=colabList.find((c:any)=>c.id===Number(v));setSolForm(f=>({...f,colaboradorId:Number(v),colaboradorNome:c?.nomeCompleto||''}));}}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{colabList.filter(c=>c.ativo!==false).map((c:any)=>(<SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto} — {c.cargo}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo *</Label>
              <Select value={solForm.motivo} onValueChange={v=>setSolForm(f=>({...f,motivo:v,motivoOutro:v!=='outros'?'':f.motivoOutro}))}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day_off">Day Off</SelectItem>
                  <SelectItem value="doacao_sangue">Doação de Sangue</SelectItem>
                  <SelectItem value="banco_horas">Banco de Horas</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {solForm.motivo === 'outros' && (
              <div><Label>Especifique o motivo *</Label><Input placeholder="Descreva o motivo..." value={solForm.motivoOutro} onChange={e=>setSolForm(f=>({...f,motivoOutro:e.target.value}))} /></div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Início</Label><Input type="date" value={solForm.dataInicio} onChange={e=>setSolForm(f=>({...f,dataInicio:e.target.value}))} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={solForm.dataFim} onChange={e=>setSolForm(f=>({...f,dataFim:e.target.value}))} /></div>
            </div>
            <div><Label>Observações</Label><Textarea placeholder="Observações adicionais..." value={solForm.observacoes} onChange={e=>setSolForm(f=>({...f,observacoes:e.target.value}))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSolicitacao(false)}>Cancelar</Button>
            <Button onClick={() => {
              if(!solForm.colaboradorId){toast.error('Selecione o colaborador');return;}
              if(!solForm.motivo){toast.error('Selecione o motivo');return;}
              if(solForm.motivo==='outros'&&!solForm.motivoOutro.trim()){toast.error('Especifique o motivo');return;}
              if(!solForm.dataInicio||!solForm.dataFim){toast.error('Informe as datas');return;}
              const diasSol=calcDias(solForm.dataInicio,solForm.dataFim);
              const labels:Record<string,string>={day_off:'Day Off',doacao_sangue:'Doação de Sangue',banco_horas:'Banco de Horas',outros:'Outros'};
              const motivoTexto=solForm.motivo==='outros'?`Outros: ${solForm.motivoOutro}`:labels[solForm.motivo]||solForm.motivo;
              const motivoFinal=solForm.observacoes.trim()?`${motivoTexto}\n\nObs: ${solForm.observacoes}`:motivoTexto;

              checkSectorOverlap(solForm.colaboradorId, solForm.dataInicio, solForm.dataFim, () => {
                createSolicitacao.mutate({colaboradorId:solForm.colaboradorId,tipo:'folga' as any,dataInicio:solForm.dataInicio,dataFim:solForm.dataFim,diasSolicitados:diasSol,motivo:motivoFinal});
              });
            }} disabled={createSolicitacao.isPending}>Programar Folga</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
