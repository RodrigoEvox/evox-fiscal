import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Cake, Loader2, CheckCircle2, XCircle, Clock, Edit, ChevronLeft, ChevronRight, Calendar, User, CalendarDays, CalendarRange, Eye, ArrowLeft} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', utilizado: 'Utilizado' };
const STATUS_COLORS: Record<string, string> = { pendente: 'bg-yellow-100 text-yellow-700', aprovado: 'bg-green-100 text-green-700', recusado: 'bg-red-100 text-red-700', utilizado: 'bg-blue-100 text-blue-700' };

const STATUS_COLAB_COLORS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700 border-green-300',
  inativo: 'bg-gray-100 text-gray-600 border-gray-300',
  afastado: 'bg-orange-100 text-orange-700 border-orange-300',
  licenca: 'bg-blue-100 text-blue-700 border-blue-300',
  'licença': 'bg-blue-100 text-blue-700 border-blue-300',
  atestado: 'bg-purple-100 text-purple-700 border-purple-300',
  desligado: 'bg-red-100 text-red-600 border-red-300',
  'de férias': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  'de ferias': 'bg-cyan-100 text-cyan-700 border-cyan-300',
};

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type ViewMode = 'ano' | 'mes' | 'dia';

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getStatusLabel(s: string) {
  if (!s) return 'Ativo';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Colaborador {
  id: number;
  nomeCompleto?: string;
  nome?: string;
  dataNascimento?: string | null;
  statusColaborador?: string | null;
  cargo?: string | null;
  setor?: string | null;
}

interface AniversarianteInfo {
  nome: string;
  id: number;
  status: string;
  dataNascimento: string;
  cargo?: string;
}

// ============================================================
// Birthday Calendar with filters
// ============================================================
function BirthdayCalendar({
  colaboradores,
  onScheduleDayOff,
}: {
  colaboradores: Colaborador[];
  onScheduleDayOff: (colab: Colaborador) => void;
}) {
  const hoje = new Date();
  const [ano, setAno] = useState(() => hoje.getFullYear());
  const [mes, setMes] = useState(() => hoje.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('ano');

  // Build map: month-day -> list of collaborator info (exclude desligado)
  const aniversariosMap = useMemo(() => {
    const map: Record<string, AniversarianteInfo[]> = {};
    (colaboradores || []).forEach((c) => {
      const status = (c.statusColaborador || 'ativo').toLowerCase();
      if (status === 'desligado') return; // não exibir desligados
      if (!c.dataNascimento) return;
      const parts = c.dataNascimento.split('-');
      if (parts.length < 3) return;
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (isNaN(m) || isNaN(d)) return;
      const key = `${m}-${d}`;
      if (!map[key]) map[key] = [];
      map[key].push({
        nome: c.nomeCompleto || c.nome || 'Sem nome',
        id: c.id,
        status: status,
        dataNascimento: c.dataNascimento || '',
        cargo: c.cargo || undefined,
      });
    });
    return map;
  }, [colaboradores]);

  // Count per month
  const countPerMonth = useMemo(() => {
    const counts: number[] = new Array(12).fill(0);
    Object.entries(aniversariosMap).forEach(([key, list]) => {
      const m = parseInt(key.split('-')[0], 10) - 1;
      if (m >= 0 && m < 12) counts[m] += list.length;
    });
    return counts;
  }, [aniversariosMap]);

  // Aniversariantes do mês selecionado (sorted by day)
  const aniversariantesMes = useMemo(() => {
    const mesNum = viewMode === 'ano' ? hoje.getMonth() + 1 : mes + 1;
    const list: (AniversarianteInfo & { dia: number })[] = [];
    Object.entries(aniversariosMap).forEach(([key, people]) => {
      const [m, d] = key.split('-').map(Number);
      if (m === mesNum) {
        people.forEach(p => list.push({ ...p, dia: d }));
      }
    });
    return list.sort((a, b) => a.dia - b.dia);
  }, [aniversariosMap, mes, viewMode, hoje]);

  // Aniversariantes de hoje
  const aniversariantesHoje = useMemo(() => {
    const key = `${hoje.getMonth() + 1}-${hoje.getDate()}`;
    return aniversariosMap[key] || [];
  }, [aniversariosMap, hoje]);

  const hojeStr = `${hoje.getMonth() + 1}-${hoje.getDate()}`;

  // Navigation handlers
  function navPrev() {
    if (viewMode === 'ano') setAno(a => a - 1);
    else if (viewMode === 'mes') {
      if (mes === 0) { setMes(11); setAno(a => a - 1); }
      else setMes(m => m - 1);
    } else {
      // dia: go to previous day (change mes/ano if needed)
      const d = new Date(ano, mes, hoje.getDate());
      d.setDate(d.getDate() - 1);
      setAno(d.getFullYear());
      setMes(d.getMonth());
    }
  }

  function navNext() {
    if (viewMode === 'ano') setAno(a => a + 1);
    else if (viewMode === 'mes') {
      if (mes === 11) { setMes(0); setAno(a => a + 1); }
      else setMes(m => m + 1);
    } else {
      const d = new Date(ano, mes, hoje.getDate());
      d.setDate(d.getDate() + 1);
      setAno(d.getFullYear());
      setMes(d.getMonth());
    }
  }

  function goToday() {
    setAno(hoje.getFullYear());
    setMes(hoje.getMonth());
  }

  // Render a single month grid
  function renderMonthGrid(mesIdx: number, compact = false) {
    const daysInMonth = getDaysInMonth(ano, mesIdx);
    const firstDay = getFirstDayOfMonth(ano, mesIdx);
    const isCurrentMonth = ano === hoje.getFullYear() && mesIdx === hoje.getMonth();

    return (
      <div key={mesIdx} className={`border rounded-lg p-3 ${isCurrentMonth ? 'border-pink-300 bg-pink-50/30' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className={`text-sm font-semibold ${isCurrentMonth ? 'text-pink-700' : 'text-gray-700'}`}>
            {MESES[mesIdx]}
          </h4>
          {countPerMonth[mesIdx] > 0 && (
            <Badge variant="outline" className="text-xs text-pink-600 border-pink-300">
              <Cake className="w-3 h-3 mr-1" /> {countPerMonth[mesIdx]}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-[10px] text-muted-foreground font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className={compact ? 'h-8' : 'h-7'} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dia = i + 1;
            const key = `${mesIdx + 1}-${dia}`;
            const aniversariantes = aniversariosMap[key] || [];
            const isToday = ano === hoje.getFullYear() && isCurrentMonth && dia === hoje.getDate();
            const hasAniversario = aniversariantes.length > 0;

            return (
              <div
                key={dia}
                className={`${compact ? 'h-8 w-8' : 'h-7'} flex items-center justify-center text-xs rounded relative group cursor-default
                  ${isToday ? 'bg-pink-600 text-white font-bold' : ''}
                  ${hasAniversario && !isToday ? 'bg-pink-100 text-pink-700 font-semibold' : ''}
                  ${!hasAniversario && !isToday ? 'text-gray-600 hover:bg-gray-100' : ''}
                `}
                title={hasAniversario ? aniversariantes.map(a => `${a.nome} (${getStatusLabel(a.status)})`).join(', ') : ''}
              >
                {dia}
                {hasAniversario && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isToday ? 'bg-white' : 'bg-pink-500'}`} />
                )}
                {hasAniversario && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg max-w-[250px]">
                      {aniversariantes.map(a => (
                        <div key={a.id} className="flex items-center gap-1">
                          <Cake className="w-2.5 h-2.5 text-pink-300 shrink-0" />
                          <span className="truncate">{a.nome}</span>
                          <span className={`ml-1 px-1 rounded text-[8px] ${STATUS_COLAB_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                            {getStatusLabel(a.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render view for "Dia" (today)
  function renderDiaView() {
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    return (
      <div className="space-y-4">
        <Card className="border-pink-200 bg-pink-50/30">
          <CardContent className="py-6 text-center">
            <p className="text-lg font-semibold text-pink-700">
              {diaAtual} de {MESES[mesAtual]} de {anoAtual}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {aniversariantesHoje.length > 0
                ? `${aniversariantesHoje.length} aniversariante(s) hoje`
                : 'Nenhum aniversariante hoje'}
            </p>
          </CardContent>
        </Card>
        {aniversariantesHoje.length > 0 && (
          <div className="space-y-2">
            {aniversariantesHoje.map(a => {
              const colab = (colaboradores || []).find(c => c.id === a.id);
              return (
                <Card key={a.id} className="border-pink-200 hover:shadow-md transition-shadow">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                        <Cake className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{a.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {a.cargo && <span className="text-xs text-muted-foreground">{a.cargo}</span>}
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLAB_COLORS[a.status] || ''}`}>
                            {getStatusLabel(a.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-pink-600 hover:bg-pink-700"
                      onClick={() => colab && onScheduleDayOff(colab)}
                    >
                      <CalendarDays className="w-4 h-4 mr-1" /> Agendar Day Off
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Title for navigation
  function getNavTitle() {
    if (viewMode === 'ano') return `Cronograma de Aniversários — ${ano}`;
    if (viewMode === 'mes') return `${MESES[mes]} ${ano}`;
    return `Hoje — ${hoje.getDate()} de ${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  }

  // Current month label for the birthday list
  const mesListaLabel = viewMode === 'ano' ? MESES[hoje.getMonth()] : MESES[mes];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-600" />
              {getNavTitle()}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View mode filter */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'dia' ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setViewMode('dia')}
                >
                  Dia
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-x ${viewMode === 'mes' ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setViewMode('mes')}
                >
                  Mês
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'ano' ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setViewMode('ano')}
                >
                  Ano
                </button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={navPrev}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToday}>
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={navNext}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar grid based on view mode */}
          {viewMode === 'ano' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {MESES.map((_, mesIdx) => renderMonthGrid(mesIdx))}
            </div>
          )}

          {viewMode === 'mes' && (
            <div className="max-w-lg mx-auto">
              {renderMonthGrid(mes, true)}
            </div>
          )}

          {viewMode === 'dia' && renderDiaView()}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-pink-100 border border-pink-300" />
              <span>Aniversário</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-pink-600" />
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
              <span>Indicador de aniversariante</span>
            </div>
            <div className="flex items-center gap-1 ml-2 border-l pl-2">
              <Badge variant="outline" className="text-[9px] bg-green-100 text-green-700 border-green-300">Ativo</Badge>
              <Badge variant="outline" className="text-[9px] bg-orange-100 text-orange-700 border-orange-300">Afastado</Badge>
              <Badge variant="outline" className="text-[9px] bg-cyan-100 text-cyan-700 border-cyan-300">Férias</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de aniversariantes do mês */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-600" />
            Aniversariantes de {mesListaLabel}
            {aniversariantesMes.length > 0 && (
              <Badge className="bg-pink-100 text-pink-700 ml-2">{aniversariantesMes.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aniversariantesMes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversariante neste mês</p>
          ) : (
            <div className="space-y-2">
              {aniversariantesMes.map((a) => {
                const colab = (colaboradores || []).find(c => c.id === a.id);
                const isToday = a.dia === hoje.getDate() && (viewMode === 'ano' ? hoje.getMonth() + 1 : mes + 1) === parseInt(a.dataNascimento.split('-')[1], 10) && ano === hoje.getFullYear();
                const mesNum = viewMode === 'ano' ? hoje.getMonth() + 1 : mes + 1;

                return (
                  <div
                    key={`${a.id}-${a.dia}`}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${isToday ? 'border-pink-300 bg-pink-50/50' : 'border-gray-200 hover:border-pink-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}>
                        {String(a.dia).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{a.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {a.cargo && <span className="text-xs text-muted-foreground">{a.cargo}</span>}
                          <Badge variant="outline" className={`text-[10px] py-0 ${STATUS_COLAB_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                            {getStatusLabel(a.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-pink-600 border-pink-300 hover:bg-pink-50"
                      onClick={() => colab && onScheduleDayOff(colab)}
                    >
                      <CalendarDays className="w-4 h-4 mr-1" /> Agendar Day Off
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Main DayOffGEG component
// ============================================================
export default function DayOffGEG() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    colaboradorId: 0, dataAniversario: '', dataOriginal: '', dataEfetiva: '',
    alterado: false, motivoAlteracao: '', observacao: '',
  });

  const utils = trpc.useUtils();
  const { data: dayoffs, isLoading } = trpc.dayOff.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const createMut = trpc.dayOff.create.useMutation({
    onSuccess: () => { utils.dayOff.list.invalidate(); toast.success('Day Off registrado!'); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.dayOff.update.useMutation({
    onSuccess: () => { utils.dayOff.list.invalidate(); toast.success('Status atualizado'); },
  });

  // Auto-fill birthday from colaborador
  function handleColabSelect(id: number) {
    const colab = (colaboradores || []).find((c: any) => c.id === id);
    if (colab) {
      const dataNasc = colab.dataNascimento || '';
      const hoje = new Date();
      let proxAniv = '';
      if (dataNasc) {
        const [y, m, d] = dataNasc.split('-');
        const anoAtual = hoje.getFullYear();
        const anivEsteAno = new Date(anoAtual, Number(m) - 1, Number(d));
        if (anivEsteAno < hoje) {
          proxAniv = `${anoAtual + 1}-${m}-${d}`;
        } else {
          proxAniv = `${anoAtual}-${m}-${d}`;
        }
      }
      setForm(f => ({ ...f, colaboradorId: id, dataAniversario: dataNasc, dataOriginal: proxAniv, dataEfetiva: proxAniv }));
    }
  }

  // Quick schedule from birthday list
  function handleScheduleFromList(colab: Colaborador) {
    const dataNasc = colab.dataNascimento || '';
    const hoje = new Date();
    let proxAniv = '';
    if (dataNasc) {
      const [y, m, d] = dataNasc.split('-');
      const anoAtual = hoje.getFullYear();
      const anivEsteAno = new Date(anoAtual, Number(m) - 1, Number(d));
      if (anivEsteAno < hoje) {
        proxAniv = `${anoAtual + 1}-${m}-${d}`;
      } else {
        proxAniv = `${anoAtual}-${m}-${d}`;
      }
    }
    setForm({
      colaboradorId: colab.id,
      dataAniversario: dataNasc,
      dataOriginal: proxAniv,
      dataEfetiva: proxAniv,
      alterado: false,
      motivoAlteracao: '',
      observacao: '',
    });
    setShowDialog(true);
  }

  function handleSave() {
    if (!form.colaboradorId || !form.dataOriginal) { toast.error('Preencha os campos obrigatórios'); return; }
    const colab = (colaboradores || []).find((c: any) => c.id === form.colaboradorId);
    createMut.mutate({
      colaboradorId: form.colaboradorId,
      colaboradorNome: colab?.nomeCompleto || '',
      dataNascimento: form.dataAniversario,
      dataOriginal: form.dataOriginal,
      dataEfetiva: form.alterado ? form.dataEfetiva : form.dataOriginal,
      alterado: form.alterado,
      motivoAlteracao: form.alterado ? form.motivoAlteracao : undefined,
      observacao: form.observacao || undefined,
    });
  }

  const pendentes = (dayoffs || []).filter(d => d.status === 'pendente').length;
  const aprovados = (dayoffs || []).filter(d => d.status === 'aprovado').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cake className="w-6 h-6 text-pink-600" /> Day Off — Aniversário
          </h1>

              <p className="text-sm text-muted-foreground mt-1">Folga de aniversário com aprovação e possibilidade de alteração</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { setForm({ colaboradorId: 0, dataAniversario: '', dataOriginal: '', dataEfetiva: '', alterado: false, motivoAlteracao: '', observacao: '' }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Day Off
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-pink-200 bg-pink-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Cake className="w-8 h-8 text-pink-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold text-pink-700">{dayoffs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-700">{pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-green-700">{aprovados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendário de Aniversários com filtros */}
      <BirthdayCalendar
        colaboradores={colaboradores || []}
        onScheduleDayOff={handleScheduleFromList}
      />

      {/* Tabela de Day Offs */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !dayoffs?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum Day Off registrado</CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Registros de Day Off</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                    <th className="text-center px-4 py-3 font-medium">Aniversário</th>
                    <th className="text-center px-4 py-3 font-medium">Data Original</th>
                    <th className="text-center px-4 py-3 font-medium">Data Efetiva</th>
                    <th className="text-center px-4 py-3 font-medium">Alterado?</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dayoffs.map(d => (
                    <tr key={d.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{d.colaboradorNome}</td>
                      <td className="px-4 py-3 text-center">{formatDateBR(d.dataAniversario)}</td>
                      <td className="px-4 py-3 text-center">{formatDateBR(d.dataOriginal)}</td>
                      <td className="px-4 py-3 text-center">{d.dataEfetiva ? formatDateBR(d.dataEfetiva) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {d.alterado ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <Edit className="w-3 h-3 mr-1" /> Sim
                          </Badge>
                        ) : 'Não'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={STATUS_COLORS[d.status || 'pendente']}>{STATUS_LABELS[d.status || 'pendente']}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center flex gap-1 justify-center">
                        {d.status === 'pendente' && (
                          <>
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateMut.mutate({ id: d.id, data: { status: 'aprovado' } })}>
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateMut.mutate({ id: d.id, data: { status: 'recusado' } })}>
                              <XCircle className="w-4 h-4 mr-1" /> Recusar
                            </Button>
                          </>
                        )}
                        {d.status === 'aprovado' && (
                          <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => updateMut.mutate({ id: d.id, data: { status: 'utilizado' } })}>
                            Marcar Utilizado
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Cake className="w-5 h-5" /> Novo Day Off</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={v => handleColabSelect(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(colaboradores || []).filter((c: any) => (c.statusColaborador || 'ativo').toLowerCase() !== 'desligado').map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.dataAniversario && (
              <Card className="bg-pink-50 border-pink-200">
                <CardContent className="py-2 text-center text-sm">
                  <Cake className="w-4 h-4 inline-block mr-1 text-pink-600" /> Aniversário: <strong>{formatDateBR(form.dataAniversario)}</strong>
                </CardContent>
              </Card>
            )}
            <div>
              <Label>Data Original do Day Off *</Label>
              <Input type="date" value={form.dataOriginal} onChange={e => setForm(f => ({ ...f, dataOriginal: e.target.value, dataEfetiva: f.alterado ? f.dataEfetiva : e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.alterado} onCheckedChange={v => setForm(f => ({ ...f, alterado: v }))} />
              <Label>Alteração de data?</Label>
            </div>
            {form.alterado && (
              <>
                <div>
                  <Label>Nova Data Efetiva</Label>
                  <Input type="date" value={form.dataEfetiva} onChange={e => setForm(f => ({ ...f, dataEfetiva: e.target.value }))} />
                </div>
                <div>
                  <Label>Motivo da Alteração</Label>
                  <Textarea value={form.motivoAlteracao} onChange={e => setForm(f => ({ ...f, motivoAlteracao: e.target.value }))} rows={2} />
                </div>
              </>
            )}
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} placeholder="Observações adicionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
