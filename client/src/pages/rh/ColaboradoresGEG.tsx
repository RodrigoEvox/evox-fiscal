import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Search, User, Edit2, Eye, X, AlertTriangle, Loader2,
  CheckCircle2, XCircle, UserCheck, UserX, Clock, Briefcase,
  HeartPulse, Palmtree, ShieldAlert, FileWarning, Filter, RotateCcw,
  ChevronDown, ChevronUp, History, MapPin, Bus, Building2,
  Download, FileSpreadsheet, FileText, Cake, CalendarDays,
  ArrowLeft, GraduationCap, TrendingUp, DollarSign, Award,
  FileCheck, AlertCircle, Stethoscope, BookOpen, Wrench,
  ChevronRight, ArrowUpDown, ChevronLeft as ChevronLeftIcon, ChevronsLeft, ChevronsRight, Printer
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

// ---- Helpers ----
function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(nums[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(nums[10]);
}

function maskCPF(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

function maskPhone(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 2) return nums.length ? `(${nums}` : '';
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

function maskCEP(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 8);
  if (nums.length <= 5) return nums;
  return `${nums.slice(0, 5)}-${nums.slice(5)}`;
}

function calcIdade(dataNasc: string): string {
  if (!dataNasc) return '';
  const [y, m, d] = dataNasc.split('-').map(Number);
  if (!y || !m || !d) return '';
  const hoje = new Date();
  let idade = hoje.getFullYear() - y;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
  return idade >= 0 ? `${idade} anos` : '';
}

function formatDateBR(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function calcTempoCasa(dataAdm: string): string {
  if (!dataAdm) return '—';
  const [y, m, d] = dataAdm.split('-').map(Number);
  if (!y) return '—';
  const adm = new Date(y, m - 1, d);
  const hoje = new Date();
  const meses = (hoje.getFullYear() - adm.getFullYear()) * 12 + (hoje.getMonth() - adm.getMonth());
  const anos = Math.floor(meses / 12);
  const mesesRest = meses % 12;
  if (anos === 0) return `${mesesRest}m`;
  if (mesesRest === 0) return `${anos}a`;
  return `${anos}a ${mesesRest}m`;
}

function formatCurrency(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(num)) return '—';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const DIAS_SEMANA = [
  { key: 'seg', label: 'Seg' }, { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' }, { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' }, { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

const PARENTESCOS = [
  'Cônjuge', 'Companheiro(a)', 'Filho(a)', 'Enteado(a)',
  'Pai', 'Mãe', 'Irmão(ã)', 'Avô(ó)', 'Neto(a)',
  'Tutelado(a)', 'Menor sob guarda',
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bgCard: string; dot: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700 border-green-200', icon: UserCheck, bgCard: 'border-l-green-500', dot: 'bg-green-500' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: UserX, bgCard: 'border-l-gray-400', dot: 'bg-gray-400' },
  afastado: { label: 'Afastado', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ShieldAlert, bgCard: 'border-l-orange-500', dot: 'bg-orange-500' },
  licenca: { label: 'Licença', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: FileWarning, bgCard: 'border-l-purple-500', dot: 'bg-purple-500' },
  atestado: { label: 'Atestado', color: 'bg-red-100 text-red-700 border-red-200', icon: HeartPulse, bgCard: 'border-l-red-500', dot: 'bg-red-500' },
  desligado: { label: 'Desligado', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle, bgCard: 'border-l-slate-500', dot: 'bg-slate-500' },
  ferias: { label: 'Férias', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Palmtree, bgCard: 'border-l-cyan-500', dot: 'bg-cyan-500' },
  experiencia: { label: 'Experiência', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, bgCard: 'border-l-yellow-500', dot: 'bg-yellow-500' },
  aviso_previo: { label: 'Aviso Prévio', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Briefcase, bgCard: 'border-l-amber-500', dot: 'bg-amber-500' },
};

type Dependente = { nome: string; cpf: string; dataNascimento: string; parentesco: string; dependenteIR?: boolean; dependentePlanoSaude?: boolean };

const GRAUS_INSTRUCAO = [
  { value: 'fundamental_incompleto', label: 'Fundamental Incompleto' },
  { value: 'fundamental_completo', label: 'Fundamental Completo' },
  { value: 'medio_incompleto', label: 'Médio Incompleto' },
  { value: 'medio_completo', label: 'Médio Completo' },
  { value: 'superior_incompleto', label: 'Superior Incompleto' },
  { value: 'superior_completo', label: 'Superior Completo' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
];

const NIVEIS_LABEL: Record<string, string> = {
  estagiario: 'Estagiário', auxiliar: 'Auxiliar', assistente: 'Assistente',
  analista_jr: 'Analista Jr', analista_pl: 'Analista Pleno', analista_sr: 'Analista Sênior',
  coordenador: 'Coordenador', supervisor: 'Supervisor', gerente: 'Gerente', diretor: 'Diretor',
};

const UFS_BRASIL = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const EMPTY_FORM = {
  nomeCompleto: '', cpf: '', dataNascimento: '', rgNumero: '', rgOrgaoEmissor: '', rgDataEmissao: '',
  ctpsNumero: '', ctpsUfEmissao: '' as string, pisPasep: '', nomeMae: '', nomePai: '', nacionalidade: 'Brasileira', naturalidade: '',
  estadoCivil: '' as string, tituloEleitor: '', tituloEleitorZona: '', tituloEleitorSecao: '', certificadoReservista: '', sexo: '' as string,
  grauInstrucao: '' as string, formacaoAcademica: '',
  contatoEmergenciaNome: '', contatoEmergenciaTelefone: '', contatoEmergenciaParentesco: '',
  pagaPensaoAlimenticia: false, valorPensaoAlimenticia: '',
  temContribuicaoAssistencial: false, valorContribuicaoAssistencial: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  telefone: '', email: '',
  dataAdmissao: '', cargo: '', funcao: '', salarioBase: '', comissoes: '', adicionais: '',
  jornadaEntrada: '08:00', jornadaSaida: '18:00', jornadaIntervalo: '01:00', cargaHoraria: '44',
  jornadaDias: ['seg', 'ter', 'qua', 'qui', 'sex'] as string[],
  tipoContrato: 'clt' as string,
  periodoExperiencia1Inicio: '', periodoExperiencia1Fim: '',
  periodoExperiencia2Inicio: '', periodoExperiencia2Fim: '',
  recebeComissao: false,
  localTrabalho: '' as string,
  valeTransporte: false, banco: '', agencia: '', conta: '', tipoConta: '' as string, chavePix: '',
  asoAdmissionalApto: false, asoAdmissionalData: '',
  dependentes: [] as Dependente[],
  setorId: 0, nivelHierarquico: '' as string,
  statusColaborador: 'ativo' as string,
};

// ===== PAINEL DO COLABORADOR =====
function PainelColaborador({ colab, setores, onClose, onEdit }: { colab: any; setores: any[]; onClose: () => void; onEdit: (c: any) => void }) {
  const [activeTab, setActiveTab] = useState('resumo');
  const colabId = colab.id;

  // Fetch all related data
  const feriasQ = trpc.ferias.list.useQuery({ colaboradorId: colabId });
  const folgasQ = trpc.solicitacoesFolga.list.useQuery({ colaboradorId: colabId });
  const dayOffsQ = trpc.dayOff.list.useQuery({ colaboradorId: colabId });
  const atestadosQ = trpc.atestadosLicencas.list.useQuery({ colaboradorId: colabId });
  const historicoStatusQ = trpc.historicoStatus.list.useQuery({ colaboradorId: colabId });
  const reajustesQ = trpc.reajustesSalariais.list.useQuery({ colaboradorId: colabId });
  const planosQ = trpc.planosCarreira.list.useQuery({ colaboradorId: colabId });

  const setorNome = setores.find((s: any) => s.id === colab.setorId)?.nome || '—';
  const status = colab.statusColaborador || 'ativo';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ativo;
  const Icon = cfg.icon;
  const jornadaDias = colab.jornadaDias ? (typeof colab.jornadaDias === 'string' ? JSON.parse(colab.jornadaDias) : colab.jornadaDias) : [];
  const dependentes: Dependente[] = colab.dependentes ? (typeof colab.dependentes === 'string' ? JSON.parse(colab.dependentes) : colab.dependentes) : [];

  const tabs = [
    { id: 'resumo', label: 'Resumo', icon: User },
    { id: 'salarial', label: 'Histórico Salarial', icon: DollarSign },
    { id: 'ferias', label: 'Férias', icon: Palmtree },
    { id: 'folgas', label: 'Folgas & Day Off', icon: CalendarDays },
    { id: 'atestados', label: 'Atestados & Licenças', icon: Stethoscope },
    { id: 'carreira', label: 'Carreira & Formação', icon: GraduationCap },
    { id: 'status', label: 'Histórico de Status', icon: History },
  ];

  const InfoItem = ({ label, value, icon: Ic }: { label: string; value: React.ReactNode; icon?: any }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase text-muted-foreground tracking-wider flex items-center gap-1">
        {Ic && <Ic className="w-3 h-3" />}{label}
      </span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  );

  const SectionCard = ({ title, icon: Ic, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-card border border-border/60 rounded-xl p-5 space-y-4">
      <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
        <Ic className="w-4 h-4" />{title}
      </h4>
      {children}
    </div>
  );

  const statusColors: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700', aprovado: 'bg-green-100 text-green-700',
    aprovada: 'bg-green-100 text-green-700', programada: 'bg-blue-100 text-blue-700',
    em_gozo: 'bg-cyan-100 text-cyan-700', concluida: 'bg-green-100 text-green-700',
    vencida: 'bg-red-100 text-red-700', recusado: 'bg-red-100 text-red-700',
    recusada: 'bg-red-100 text-red-700', utilizado: 'bg-blue-100 text-blue-700',
    ativo: 'bg-green-100 text-green-700', encerrado: 'bg-gray-100 text-gray-700',
    cancelado: 'bg-red-100 text-red-700', em_andamento: 'bg-blue-100 text-blue-700',
    pausado: 'bg-yellow-100 text-yellow-700',
  };

  // ---- Salarial calculations ----
  const reajustes = (reajustesQ.data || []) as any[];
  const salarioAtual = parseFloat(colab.salarioBase || '0');
  const comissoes = parseFloat(colab.comissoes || '0');
  const adicionais = parseFloat(colab.adicionais || '0');
  const custoMensal = salarioAtual + comissoes + adicionais;

  // Build salary timeline from reajustes
  const salaryTimeline = useMemo(() => {
    const sorted = [...reajustes].sort((a, b) => (a.dataEfetivacao || '').localeCompare(b.dataEfetivacao || ''));
    const timeline: { data: string; salarioAnterior: string; salarioNovo: string; tipo: string; percentual: string }[] = [];
    sorted.forEach((r: any) => {
      timeline.push({
        data: r.dataEfetivacao || '',
        salarioAnterior: r.salarioAnterior || '0',
        salarioNovo: r.salarioNovo || '0',
        tipo: r.tipo || '',
        percentual: r.percentual || '0',
      });
    });
    return timeline;
  }, [reajustes]);

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-border/60 rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-background/80 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{colab.nomeCompleto}</h2>
              <p className="text-sm text-muted-foreground">{colab.cargo}{colab.funcao ? ` — ${colab.funcao}` : ''}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge className={`${cfg.color} border text-[10px] gap-1`} variant="secondary">
                  <Icon className="w-3 h-3" /> {cfg.label}
                </Badge>
                {colab.tipoContrato && <Badge variant="outline" className="text-[10px]">{colab.tipoContrato.toUpperCase()}</Badge>}
                <span className="text-xs text-muted-foreground">{setorNome}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => {
              // Print the panel as PDF
              window.print();
            }} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(colab)} className="gap-1.5">
              <Edit2 className="w-3.5 h-3.5" /> Editar
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-5">
          <div className="bg-background/70 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Admissão</p>
            <p className="text-sm font-semibold">{formatDateBR(colab.dataAdmissao)}</p>
          </div>
          <div className="bg-background/70 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Tempo de Casa</p>
            <p className="text-sm font-semibold">{calcTempoCasa(colab.dataAdmissao)}</p>
          </div>
          <div className="bg-background/70 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Aniversário</p>
            <p className="text-sm font-semibold">{colab.dataNascimento ? formatDateBR(colab.dataNascimento) : '—'}</p>
          </div>
          <div className="bg-background/70 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Salário Base</p>
            <p className="text-sm font-semibold">{formatCurrency(colab.salarioBase)}</p>
          </div>
          <div className="bg-background/70 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Unidade</p>
            <p className="text-sm font-semibold">{colab.localTrabalho === 'home_office' ? 'Home Office' : colab.localTrabalho === 'barueri' ? 'Barueri' : colab.localTrabalho === 'uberaba' ? 'Uberaba' : '—'}</p>
          </div>
          <div className="bg-background/70 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Nível</p>
            <p className="text-sm font-semibold">{NIVEIS_LABEL[colab.nivelHierarquico] || colab.nivelHierarquico || '—'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-border/40">
        {tabs.map(t => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* ===== RESUMO ===== */}
        {activeTab === 'resumo' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Dados Pessoais" icon={User}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem label="CPF" value={colab.cpf} />
                  <InfoItem label="Data Nascimento" value={formatDateBR(colab.dataNascimento)} />
                  <InfoItem label="Idade" value={calcIdade(colab.dataNascimento)} />
                  <InfoItem label="Sexo" value={colab.sexo ? colab.sexo.charAt(0).toUpperCase() + colab.sexo.slice(1) : '—'} />
                  <InfoItem label="Estado Civil" value={colab.estadoCivil ? colab.estadoCivil.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : '—'} />
                  <InfoItem label="Nacionalidade" value={colab.nacionalidade} />
                  <InfoItem label="Naturalidade" value={colab.naturalidade} />
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">CONTATOS PESSOAIS</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoItem label="Email Pessoal" value={colab.email} />
                    <InfoItem label="Telefone Pessoal" value={colab.telefone} />
                  </div>
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">CONTATOS CORPORATIVOS</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoItem label="Email Corporativo" value={(colab as any).emailCorporativo} />
                    <InfoItem label="Telefone Corporativo" value={(colab as any).telefoneCorporativo} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Dados Profissionais" icon={Briefcase}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem label="Cargo" value={colab.cargo} />
                  <InfoItem label="Função" value={colab.funcao} />
                  <InfoItem label="Setor" value={setorNome} />
                  <InfoItem label="Nível" value={NIVEIS_LABEL[colab.nivelHierarquico] || '—'} />
                  <InfoItem label="Contrato" value={colab.tipoContrato?.toUpperCase()} />
                  <InfoItem label="Local" value={colab.localTrabalho === 'home_office' ? 'Home Office' : colab.localTrabalho === 'barueri' ? 'Barueri' : colab.localTrabalho === 'uberaba' ? 'Uberaba' : '—'} />
                  <InfoItem label="Jornada" value={`${colab.jornadaEntrada || '—'} às ${colab.jornadaSaida || '—'}`} />
                  <InfoItem label="Carga Horária" value={colab.cargaHoraria ? `${colab.cargaHoraria}h/sem` : '—'} />
                  <InfoItem label="Vale Transporte" value={
                    <span className={colab.valeTransporte ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                      {colab.valeTransporte ? 'Sim' : 'Não'}
                    </span>
                  } />
                </div>
                {jornadaDias.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {DIAS_SEMANA.map(d => (
                      <span key={d.key} className={`px-2 py-0.5 rounded text-[10px] font-medium ${jornadaDias.includes(d.key) ? 'bg-primary/10 text-primary' : 'bg-muted/40 text-muted-foreground'}`}>
                        {d.label}
                      </span>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Endereço" icon={MapPin}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem label="CEP" value={colab.cep} />
                  <InfoItem label="Logradouro" value={colab.logradouro} />
                  <InfoItem label="Número" value={colab.numero} />
                  <InfoItem label="Complemento" value={colab.complemento} />
                  <InfoItem label="Bairro" value={colab.bairro} />
                  <InfoItem label="Cidade/UF" value={colab.cidade && colab.estado ? `${colab.cidade}/${colab.estado}` : colab.cidade || '—'} />
                </div>
              </SectionCard>

              <SectionCard title="Dados Bancários" icon={Building2}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem label="Banco" value={colab.banco} />
                  <InfoItem label="Agência" value={colab.agencia} />
                  <InfoItem label="Conta" value={colab.conta} />
                  <InfoItem label="Tipo Conta" value={colab.tipoConta ? colab.tipoConta.charAt(0).toUpperCase() + colab.tipoConta.slice(1) : '—'} />
                  <InfoItem label="Chave PIX" value={colab.chavePix} />
                </div>
              </SectionCard>
            </div>

            {/* Dependentes */}
            {dependentes.length > 0 && (
              <SectionCard title={`Dependentes (${dependentes.length})`} icon={User}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-3 py-2 text-xs font-medium">Nome</th>
                        <th className="text-left px-3 py-2 text-xs font-medium">Parentesco</th>
                        <th className="text-center px-3 py-2 text-xs font-medium">CPF</th>
                        <th className="text-center px-3 py-2 text-xs font-medium">Nascimento</th>
                        <th className="text-center px-3 py-2 text-xs font-medium">Idade</th>
                        <th className="text-center px-3 py-2 text-xs font-medium">IR</th>
                        <th className="text-center px-3 py-2 text-xs font-medium">Plano</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependentes.map((d, i) => (
                        <tr key={i} className="border-b hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{d.nome}</td>
                          <td className="px-3 py-2 text-muted-foreground">{d.parentesco}</td>
                          <td className="px-3 py-2 text-center">{d.cpf || '—'}</td>
                          <td className="px-3 py-2 text-center">{formatDateBR(d.dataNascimento)}</td>
                          <td className="px-3 py-2 text-center">{calcIdade(d.dataNascimento)}</td>
                          <td className="px-3 py-2 text-center">{d.dependenteIR ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-3 py-2 text-center">{d.dependentePlanoSaude ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* Documentos, Saúde, Filiação, Pensão */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Documentos" icon={FileCheck}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="RG" value={colab.rgNumero} />
                  <InfoItem label="Órgão Emissor" value={colab.rgOrgaoEmissor} />
                  <InfoItem label="CTPS" value={colab.ctpsNumero} />
                  <InfoItem label="PIS/PASEP" value={colab.pisPasep} />
                  <InfoItem label="Título Eleitor" value={colab.tituloEleitor} />
                  <InfoItem label="Cert. Reservista" value={colab.certificadoReservista} />
                </div>
              </SectionCard>

              <SectionCard title="Saúde & Outros" icon={Stethoscope}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="ASO Admissional" value={
                    <span className={colab.asoAdmissionalApto ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                      {colab.asoAdmissionalApto ? 'Apto' : 'Inapto'}
                    </span>
                  } />
                  <InfoItem label="Data Exame" value={formatDateBR(colab.asoAdmissionalData)} />
                  <InfoItem label="Filiação (Mãe)" value={colab.nomeMae} />
                  <InfoItem label="Filiação (Pai)" value={colab.nomePai} />
                  <InfoItem label="Pensão Alimentícia" value={colab.pagaPensaoAlimenticia ? `Sim — ${formatCurrency(colab.valorPensaoAlimenticia)}` : 'Não'} />
                  <InfoItem label="Contrib. Assistencial" value={colab.temContribuicaoAssistencial ? `Sim — ${formatCurrency(colab.valorContribuicaoAssistencial)}` : 'Não'} />
                </div>
              </SectionCard>
            </div>
          </>
        )}

        {/* ===== HISTÓRICO SALARIAL ===== */}
        {activeTab === 'salarial' && (
          <>
            {/* Custo atual */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border/60 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Salário Base</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(colab.salarioBase)}</p>
              </div>
              <div className="bg-card border border-border/60 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Comissões</p>
                <p className="text-lg font-bold">{formatCurrency(colab.comissoes)}</p>
              </div>
              <div className="bg-card border border-border/60 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Adicionais</p>
                <p className="text-lg font-bold">{formatCurrency(colab.adicionais)}</p>
              </div>
              <div className="bg-card border border-border/60 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Custo Mensal Total</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(custoMensal)}</p>
              </div>
            </div>

            <SectionCard title="Custo Anual Estimado" icon={DollarSign}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoItem label="Custo Anual (12x)" value={formatCurrency(custoMensal * 12)} />
                <InfoItem label="Com 13° Salário" value={formatCurrency(custoMensal * 13)} />
                <InfoItem label="Com 13° + Férias (1/3)" value={formatCurrency(custoMensal * 13 + salarioAtual / 3)} />
              </div>
            </SectionCard>

            {/* Salary Evolution Chart */}
            {!reajustesQ.isLoading && salaryTimeline.length > 0 && (() => {
              const chartData = [
                ...salaryTimeline.map(r => ({
                  data: formatDateBR(r.data),
                  salario: parseFloat(r.salarioNovo),
                })),
                { data: 'Atual', salario: salarioAtual },
              ];
              // Remove duplicates if last reajuste equals current
              const unique = chartData.filter((d, i, arr) => i === 0 || d.salario !== arr[i-1].salario || d.data !== arr[i-1].data);
              return (
                <SectionCard title="Evolução Salarial" icon={TrendingUp}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={unique} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$ ${(v/1000).toFixed(1)}k`} />
                      <RechartsTooltip formatter={(v: number) => [formatCurrency(v), 'Salário']} />
                      <Area type="monotone" dataKey="salario" stroke="#6366f1" fill="url(#salaryGrad)" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </SectionCard>
              );
            })()}

            <SectionCard title="Histórico de Reajustes" icon={TrendingUp}>
              {reajustesQ.isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
              ) : salaryTimeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhum reajuste salarial registrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-3 py-2 text-xs font-medium">Data</th>
                        <th className="text-left px-3 py-2 text-xs font-medium">Tipo</th>
                        <th className="text-right px-3 py-2 text-xs font-medium">Anterior</th>
                        <th className="text-right px-3 py-2 text-xs font-medium">Novo</th>
                        <th className="text-right px-3 py-2 text-xs font-medium">Reajuste</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryTimeline.map((r, i) => (
                        <tr key={i} className="border-b hover:bg-muted/20">
                          <td className="px-3 py-2">{formatDateBR(r.data)}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-[10px]">
                              {r.tipo === 'dois_anos' ? '2 Anos' : r.tipo === 'sindical' ? 'Sindical' : r.tipo === 'promocao' ? 'Promoção' : r.tipo === 'merito' ? 'Mérito' : r.tipo}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(r.salarioAnterior)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(r.salarioNovo)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-green-600 font-medium">+{parseFloat(r.percentual).toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ===== FÉRIAS ===== */}
        {activeTab === 'ferias' && (
          <SectionCard title="Histórico de Férias" icon={Palmtree}>
            {feriasQ.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
            ) : (feriasQ.data || []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhum registro de férias encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-3 py-2 text-xs font-medium">Período Aquisitivo</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Período 1</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Período 2</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Período 3</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Dias</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(feriasQ.data as any[]).map((f: any) => (
                      <tr key={f.id} className="border-b hover:bg-muted/20">
                        <td className="px-3 py-2">
                          <span className="font-medium">{formatDateBR(f.periodoAquisitivoInicio)}</span>
                          <span className="text-muted-foreground mx-1">a</span>
                          <span className="font-medium">{formatDateBR(f.periodoAquisitivoFim)}</span>
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {f.periodo1Inicio ? `${formatDateBR(f.periodo1Inicio)} — ${formatDateBR(f.periodo1Fim)} (${f.periodo1Dias || 0}d)` : '—'}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {f.periodo2Inicio ? `${formatDateBR(f.periodo2Inicio)} — ${formatDateBR(f.periodo2Fim)} (${f.periodo2Dias || 0}d)` : '—'}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {f.periodo3Inicio ? `${formatDateBR(f.periodo3Inicio)} — ${formatDateBR(f.periodo3Fim)} (${f.periodo3Dias || 0}d)` : '—'}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">{f.diasTotais || 0}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={statusColors[f.status] || 'bg-gray-100 text-gray-700'} variant="secondary">
                            {f.status?.charAt(0).toUpperCase() + f.status?.slice(1).replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* ===== FOLGAS & DAY OFF ===== */}
        {activeTab === 'folgas' && (
          <SectionCard title="Histórico de Folgas & Day Off" icon={CalendarDays}>
            {(folgasQ.isLoading || dayOffsQ.isLoading) ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
            ) : (() => {
              const folgas = (folgasQ.data || []).map((f: any) => ({
                id: `folga-${f.id}`, tipo: f.tipo === 'folga' ? 'Folga' : f.tipo === 'ferias' ? 'Férias' : f.tipo === 'abono' ? 'Abono' : f.tipo === 'compensacao' ? 'Compensação' : f.tipo,
                motivo: f.motivo || '—', dataInicio: f.dataInicio, dataFim: f.dataFim, status: f.status || 'pendente', origem: 'Programar Folgas',
              }));
              const dayoffs = (dayOffsQ.data || []).map((d: any) => ({
                id: `dayoff-${d.id}`, tipo: 'Day Off', motivo: d.observacao || 'Aniversário',
                dataInicio: d.dataEfetiva || d.dataOriginal, dataFim: d.dataEfetiva || d.dataOriginal, status: d.status || 'pendente', origem: 'Day Off',
              }));
              const todas = [...folgas, ...dayoffs].sort((a, b) => (b.dataInicio || '').localeCompare(a.dataInicio || ''));
              if (todas.length === 0) return <p className="text-sm text-muted-foreground py-4">Nenhuma folga ou day off registrado.</p>;
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-3 py-2 text-xs font-medium">Tipo</th>
                        <th className="text-left px-3 py-2 text-xs font-medium">Motivo</th>
                        <th className="text-center px-3 py-2 text-xs font-medium">Início</th>
                        <th className="text-center px-3 py-2 text-xs font-medium">Fim</th>
                        <th className="text-center px-3 py-2 text-xs font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todas.map(f => (
                        <tr key={f.id} className="border-b hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{f.tipo}</td>
                          <td className="px-3 py-2 text-muted-foreground">{f.motivo}</td>
                          <td className="px-3 py-2 text-center">{formatDateBR(f.dataInicio)}</td>
                          <td className="px-3 py-2 text-center">{formatDateBR(f.dataFim)}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge className={statusColors[f.status] || 'bg-gray-100 text-gray-700'} variant="secondary">
                              {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </SectionCard>
        )}

        {/* ===== ATESTADOS & LICENÇAS ===== */}
        {activeTab === 'atestados' && (
          <SectionCard title="Histórico de Atestados & Licenças" icon={Stethoscope}>
            {atestadosQ.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
            ) : (atestadosQ.data || []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhum atestado ou licença registrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-3 py-2 text-xs font-medium">Tipo</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Início</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Fim</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Dias</th>
                      <th className="text-left px-3 py-2 text-xs font-medium">CID</th>
                      <th className="text-left px-3 py-2 text-xs font-medium">Médico</th>
                      <th className="text-center px-3 py-2 text-xs font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(atestadosQ.data as any[]).map((a: any) => (
                      <tr key={a.id} className="border-b hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium text-xs">
                          {a.tipo?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </td>
                        <td className="px-3 py-2 text-center">{formatDateBR(a.dataInicio)}</td>
                        <td className="px-3 py-2 text-center">{formatDateBR(a.dataFim)}</td>
                        <td className="px-3 py-2 text-center font-semibold">{a.diasAfastamento}</td>
                        <td className="px-3 py-2">{a.cid || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.medico || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={statusColors[a.status] || 'bg-gray-100 text-gray-700'} variant="secondary">
                            {a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {/* ===== CARREIRA & FORMAÇÃO ===== */}
        {activeTab === 'carreira' && (
          <>
            <SectionCard title="Formação Acadêmica" icon={GraduationCap}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Grau de Instrução" value={GRAUS_INSTRUCAO.find(g => g.value === colab.grauInstrucao)?.label || '—'} />
                <InfoItem label="Formação / Curso" value={colab.formacaoAcademica} />
              </div>
            </SectionCard>

            <SectionCard title="Planos de Carreira" icon={Award}>
              {planosQ.isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
              ) : (planosQ.data || []).length === 0 ? (
                <div className="flex items-center gap-2 py-4">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm text-muted-foreground">Colaborador não está vinculado a nenhum plano de carreira.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(planosQ.data as any[]).map((p: any) => (
                    <div key={p.id} className="border border-border/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{p.titulo}</h5>
                        <Badge className={statusColors[p.status] || 'bg-gray-100 text-gray-700'} variant="secondary">
                          {p.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-muted-foreground">Nível Atual:</span> <span className="font-medium">{p.nivelAtual || '—'}</span></div>
                        <div><span className="text-muted-foreground">Nível Alvo:</span> <span className="font-medium">{p.nivelAlvo || '—'}</span></div>
                        <div><span className="text-muted-foreground">Prazo:</span> <span className="font-medium">{p.prazoMeses ? `${p.prazoMeses} meses` : '—'}</span></div>
                        <div><span className="text-muted-foreground">Metas:</span> <span className="font-medium">{p.metas?.length || 0} definidas</span></div>
                      </div>
                      {p.descricao && <p className="text-xs text-muted-foreground mt-2">{p.descricao}</p>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Experience periods */}
            {(colab.periodoExperiencia1Inicio || colab.periodoExperiencia2Inicio) && (
              <SectionCard title="Períodos de Experiência" icon={Clock}>
                <div className="grid grid-cols-2 gap-4">
                  {colab.periodoExperiencia1Inicio && (
                    <InfoItem label="1° Período" value={`${formatDateBR(colab.periodoExperiencia1Inicio)} a ${formatDateBR(colab.periodoExperiencia1Fim)}`} />
                  )}
                  {colab.periodoExperiencia2Inicio && (
                    <InfoItem label="2° Período" value={`${formatDateBR(colab.periodoExperiencia2Inicio)} a ${formatDateBR(colab.periodoExperiencia2Fim)}`} />
                  )}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* ===== HISTÓRICO DE STATUS ===== */}
        {activeTab === 'status' && (
          <SectionCard title="Histórico de Mudanças de Status" icon={History}>
            {historicoStatusQ.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
            ) : (historicoStatusQ.data || []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhuma alteração de status registrada.</p>
            ) : (
              <div className="relative ml-4 border-l-2 border-border/60 space-y-0">
                {(historicoStatusQ.data as any[]).map((h: any, i: number) => {
                  const cfgNovo = STATUS_CONFIG[h.statusNovo] || STATUS_CONFIG.ativo;
                  const cfgAnterior = STATUS_CONFIG[h.statusAnterior] || STATUS_CONFIG.ativo;
                  const IconNovo = cfgNovo.icon;
                  return (
                    <div key={h.id || i} className="relative pl-6 pb-4">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${cfgNovo.color.split(' ')[0]}`}>
                        <IconNovo className="w-2.5 h-2.5" />
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{cfgAnterior.label}</span>
                        <span className="text-muted-foreground mx-1.5">&rarr;</span>
                        <span className="font-semibold">{cfgNovo.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.motivo || 'Sem motivo informado'}</p>
                      <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
                        <span>Módulo: {h.origemModulo || 'manual'}</span>
                        <span>Por: {h.alteradoPorNome || 'Sistema'}</span>
                        <span>{h.createdAt ? new Date(h.createdAt).toLocaleString('pt-BR') : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// ===== EXPERIÊNCIA SECTION =====
function addDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function ExperienciaSection({ form, setForm, markDirty }: { form: any; setForm: (fn: (f: any) => any) => void; markDirty: () => void }) {
  // Derive mode from existing data
  const [formatoExp, setFormatoExp] = useState<'unico' | 'dois'>(() => {
    if (form.periodoExperiencia2Inicio || form.periodoExperiencia2Fim) return 'dois';
    return 'unico';
  });
  const [diasPeriodo1, setDiasPeriodo1] = useState<number>(() => {
    if (form.periodoExperiencia1Inicio && form.periodoExperiencia1Fim) {
      const d1 = new Date(form.periodoExperiencia1Inicio + 'T12:00:00');
      const d2 = new Date(form.periodoExperiencia1Fim + 'T12:00:00');
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 90;
    }
    return 90;
  });
  const [diasPeriodo2, setDiasPeriodo2] = useState<number>(() => {
    if (form.periodoExperiencia2Inicio && form.periodoExperiencia2Fim) {
      const d1 = new Date(form.periodoExperiencia2Inicio + 'T12:00:00');
      const d2 = new Date(form.periodoExperiencia2Fim + 'T12:00:00');
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 45;
    }
    return 45;
  });

  // Recalculate dates when admissão, formato or dias change
  const recalcular = useCallback((admissao: string, formato: 'unico' | 'dois', d1: number, d2: number) => {
    if (!admissao) return;
    const p1Inicio = admissao;
    const p1Fim = addDays(admissao, d1);
    if (formato === 'unico') {
      setForm(f => ({
        ...f,
        periodoExperiencia1Inicio: p1Inicio,
        periodoExperiencia1Fim: p1Fim,
        periodoExperiencia2Inicio: '',
        periodoExperiencia2Fim: '',
      }));
    } else {
      const p2Inicio = addDays(p1Fim, 1);
      const p2Fim = addDays(p1Fim, d2);
      setForm(f => ({
        ...f,
        periodoExperiencia1Inicio: p1Inicio,
        periodoExperiencia1Fim: p1Fim,
        periodoExperiencia2Inicio: p2Inicio,
        periodoExperiencia2Fim: p2Fim,
      }));
    }
    markDirty();
  }, [setForm, markDirty]);

  // Auto-recalculate when admissão changes
  useEffect(() => {
    if (form.dataAdmissao) {
      recalcular(form.dataAdmissao, formatoExp, diasPeriodo1, diasPeriodo2);
    }
  }, [form.dataAdmissao]);

  const handleFormatoChange = (v: 'unico' | 'dois') => {
    setFormatoExp(v);
    if (v === 'unico') {
      setDiasPeriodo1(90);
      recalcular(form.dataAdmissao, 'unico', 90, 0);
    } else {
      setDiasPeriodo1(45);
      setDiasPeriodo2(45);
      recalcular(form.dataAdmissao, 'dois', 45, 45);
    }
  };

  const handleDias1Change = (v: number) => {
    const dias = Math.max(1, Math.min(365, v || 0));
    setDiasPeriodo1(dias);
    recalcular(form.dataAdmissao, formatoExp, dias, diasPeriodo2);
  };

  const handleDias2Change = (v: number) => {
    const dias = Math.max(1, Math.min(365, v || 0));
    setDiasPeriodo2(dias);
    recalcular(form.dataAdmissao, formatoExp, diasPeriodo1, dias);
  };

  const formatDateBR = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Período de Experiência</Label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="formatoExp" checked={formatoExp === 'unico'} onChange={() => handleFormatoChange('unico')} className="h-3.5 w-3.5 accent-primary" />
            <span className="text-xs font-medium">Período Único</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="formatoExp" checked={formatoExp === 'dois'} onChange={() => handleFormatoChange('dois')} className="h-3.5 w-3.5 accent-primary" />
            <span className="text-xs font-medium">Dois Períodos</span>
          </label>
        </div>
      </div>

      {formatoExp === 'unico' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Dias</Label>
            <Input type="number" min={1} max={365} value={diasPeriodo1} onChange={e => handleDias1Change(parseInt(e.target.value) || 0)} className="w-full" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Início</Label>
            <div className="h-9 flex items-center px-3 bg-background border rounded-md text-sm">
              {form.periodoExperiencia1Inicio ? formatDateBR(form.periodoExperiencia1Inicio) : <span className="text-muted-foreground">Preencha a data de admissão</span>}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Fim</Label>
            <div className="h-9 flex items-center px-3 bg-background border rounded-md text-sm font-medium">
              {form.periodoExperiencia1Fim ? formatDateBR(form.periodoExperiencia1Fim) : '—'}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Período 1 */}
          <div>
            <Label className="text-xs font-medium text-blue-600 mb-1.5 block">1° Período</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dias</Label>
                <Input type="number" min={1} max={365} value={diasPeriodo1} onChange={e => handleDias1Change(parseInt(e.target.value) || 0)} className="w-full" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Início</Label>
                <div className="h-9 flex items-center px-3 bg-background border rounded-md text-sm">
                  {form.periodoExperiencia1Inicio ? formatDateBR(form.periodoExperiencia1Inicio) : <span className="text-muted-foreground">Preencha a data de admissão</span>}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Fim</Label>
                <div className="h-9 flex items-center px-3 bg-background border rounded-md text-sm font-medium">
                  {form.periodoExperiencia1Fim ? formatDateBR(form.periodoExperiencia1Fim) : '—'}
                </div>
              </div>
            </div>
          </div>
          {/* Período 2 */}
          <div>
            <Label className="text-xs font-medium text-emerald-600 mb-1.5 block">2° Período</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dias</Label>
                <Input type="number" min={1} max={365} value={diasPeriodo2} onChange={e => handleDias2Change(parseInt(e.target.value) || 0)} className="w-full" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Início</Label>
                <div className="h-9 flex items-center px-3 bg-background border rounded-md text-sm">
                  {form.periodoExperiencia2Inicio ? formatDateBR(form.periodoExperiencia2Inicio) : '—'}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Fim</Label>
                <div className="h-9 flex items-center px-3 bg-background border rounded-md text-sm font-medium">
                  {form.periodoExperiencia2Fim ? formatDateBR(form.periodoExperiencia2Fim) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {form.dataAdmissao && (
        <p className="text-xs text-muted-foreground mt-2">
          Total: <span className="font-semibold">{formatoExp === 'unico' ? diasPeriodo1 : diasPeriodo1 + diasPeriodo2} dias</span> de experiência
          {formatoExp === 'dois' && <span> ({diasPeriodo1} + {diasPeriodo2} dias)</span>}
        </p>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function ColaboradoresGEG() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterCargo, setFilterCargo] = useState<string>('todos');
  const [filterSetor, setFilterSetor] = useState<string>('todos');
  const [filterLocal, setFilterLocal] = useState<string>('todos');
  const [filterVT, setFilterVT] = useState<string>('todos');
  const [filterNivel, setFilterNivel] = useState<string>('todos');
  const [filterContrato, setFilterContrato] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [admissaoAlert, setAdmissaoAlert] = useState(false);
  const [exitAlert, setExitAlert] = useState(false);
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [depForm, setDepForm] = useState<Dependente>({ nome: '', cpf: '', dataNascimento: '', parentesco: '', dependenteIR: false, dependentePlanoSaude: false });
  const formDirtyRef = useRef(false);
  const [selectedColab, setSelectedColab] = useState<any | null>(null);
  const [sortField, setSortField] = useState<string>('nomeCompleto');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  const colaboradores = trpc.colaboradores.list.useQuery();
  const setores = trpc.setores.list.useQuery();
  const niveisCargosQ = trpc.niveisCargo.list.useQuery();
  const historicoStatus = trpc.historicoStatus.list.useQuery(
    { colaboradorId: editId || 0 },
    { enabled: !!editId && (viewMode || showForm) }
  );
  const folgasColab = trpc.solicitacoesFolga.list.useQuery(
    { colaboradorId: editId || 0 },
    { enabled: !!editId && (viewMode || showForm) }
  );
  const dayoffsColab = trpc.dayOff.list.useQuery(
    { colaboradorId: editId || 0 },
    { enabled: !!editId && (viewMode || showForm) }
  );
  const createMut = trpc.colaboradores.create.useMutation({
    onSuccess: () => { colaboradores.refetch(); closeFormClean(); toast.success('Colaborador cadastrado!'); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = trpc.colaboradores.update.useMutation({
    onSuccess: () => { colaboradores.refetch(); closeFormClean(); toast.success('Colaborador atualizado!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const closeFormClean = () => {
    setShowForm(false);
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setViewMode(false);
    setCpfValid(null);
    formDirtyRef.current = false;
  };

  const tryCloseForm = () => {
    if (formDirtyRef.current && !viewMode) {
      setExitAlert(true);
    } else {
      closeFormClean();
    }
  };

  const markDirty = () => { formDirtyRef.current = true; };

  const handleCpfChange = (raw: string) => {
    const masked = maskCPF(raw);
    setForm(f => ({ ...f, cpf: masked }));
    markDirty();
    const nums = masked.replace(/\D/g, '');
    setCpfValid(nums.length === 11 ? validarCPF(nums) : null);
  };

  const handlePhoneChange = (raw: string) => {
    setForm(f => ({ ...f, telefone: maskPhone(raw) }));
    markDirty();
  };

  const handleCepChange = async (raw: string) => {
    const masked = maskCEP(raw);
    setForm(f => ({ ...f, cep: masked }));
    markDirty();
    const nums = masked.replace(/\D/g, '');
    if (nums.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${nums}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(f => ({
            ...f,
            logradouro: data.logradouro || f.logradouro,
            bairro: data.bairro || f.bairro,
            cidade: data.localidade || f.cidade,
            estado: data.uf || f.estado,
            complemento: data.complemento || f.complemento,
          }));
        }
      } catch { /* ignore */ }
      setCepLoading(false);
    }
  };

  const toggleDia = (dia: string) => {
    setForm(f => {
      const dias = f.jornadaDias.includes(dia)
        ? f.jornadaDias.filter(d => d !== dia)
        : [...f.jornadaDias, dia];
      return { ...f, jornadaDias: dias };
    });
    markDirty();
  };

  const handleSave = () => {
    if (!form.nomeCompleto.trim()) { toast.error('Nome completo é obrigatório'); return; }
    if (!form.cpf.trim()) { toast.error('CPF é obrigatório'); return; }
    if (cpfValid === false) { toast.error('CPF inválido'); return; }
    if (!form.dataAdmissao) { toast.error('Data de admissão é obrigatória'); return; }
    if (!form.cargo.trim()) { toast.error('Cargo é obrigatório'); return; }
    if (!form.salarioBase.trim()) { toast.error('Salário base é obrigatório'); return; }

    const today = new Date().toISOString().split('T')[0];
    if (form.dataAdmissao !== today && !admissaoAlert && !editId) {
      setAdmissaoAlert(true);
      return;
    }

    const payload = {
      ...form,
      periodoExperiencia1Inicio: form.periodoExperiencia1Inicio || undefined,
      periodoExperiencia1Fim: form.periodoExperiencia1Fim || undefined,
      periodoExperiencia2Inicio: form.periodoExperiencia2Inicio || undefined,
      periodoExperiencia2Fim: form.periodoExperiencia2Fim || undefined,
      recebeComissao: form.recebeComissao,
      telefoneCorporativo: (form as any).telefoneCorporativo || undefined,
      emailCorporativo: (form as any).emailCorporativo || undefined,
      setorId: form.setorId || undefined,
      estadoCivil: (form.estadoCivil || undefined) as any,
      sexo: (form.sexo || undefined) as any,
      tipoContrato: (form.tipoContrato || 'clt') as any,
      localTrabalho: (form.localTrabalho || undefined) as any,
      tipoConta: (form.tipoConta || undefined) as any,
      nivelHierarquico: (form.nivelHierarquico || undefined) as any,
      statusColaborador: (form.statusColaborador || 'ativo') as any,
      ctpsUfEmissao: form.ctpsUfEmissao || undefined,
      grauInstrucao: (form.grauInstrucao || undefined) as any,
      valorPensaoAlimenticia: form.valorPensaoAlimenticia || undefined,
      valorContribuicaoAssistencial: form.valorContribuicaoAssistencial || undefined,
    };

    if (editId) {
      updateMut.mutate({ id: editId, data: payload });
    } else {
      createMut.mutate(payload as any);
    }
  };

  const openEdit = (c: any) => {
    setForm({
      ...EMPTY_FORM, ...c,
      jornadaDias: c.jornadaDias ? (typeof c.jornadaDias === 'string' ? JSON.parse(c.jornadaDias) : c.jornadaDias) : ['seg', 'ter', 'qua', 'qui', 'sex'],
      dependentes: c.dependentes ? (typeof c.dependentes === 'string' ? JSON.parse(c.dependentes) : c.dependentes) : [],
      chavePix: c.chavePix || '',
      statusColaborador: c.statusColaborador || 'ativo',
    });
    setEditId(c.id);
    setViewMode(false);
    setShowForm(true);
    formDirtyRef.current = false;
    const nums = (c.cpf || '').replace(/\D/g, '');
    setCpfValid(nums.length === 11 ? validarCPF(nums) : null);
  };

  const addDependente = () => {
    if (!depForm.nome.trim()) { toast.error('Nome do dependente é obrigatório'); return; }
    if (!depForm.parentesco) { toast.error('Parentesco é obrigatório'); return; }
    setForm(f => ({ ...f, dependentes: [...f.dependentes, { ...depForm }] }));
    setDepForm({ nome: '', cpf: '', dataNascimento: '', parentesco: '', dependenteIR: false, dependentePlanoSaude: false });
    markDirty();
  };

  const removeDependente = (idx: number) => {
    setForm(f => ({ ...f, dependentes: f.dependentes.filter((_, i) => i !== idx) }));
    markDirty();
  };

  const allColabs = (colaboradores.data || []) as any[];
  const setoresList = (setores.data || []) as any[];
  const niveisCargos = (niveisCargosQ.data || []) as any[];

  const uniqueCargos = useMemo(() => Array.from(new Set(allColabs.map((c: any) => c.cargo).filter(Boolean))).sort(), [allColabs]);

  // Cargos filtrados pelo setor selecionado no formulário (de niveis_cargo)
  const cargosBySetor = useMemo(() => {
    if (!form.setorId) return niveisCargos.filter((nc: any) => nc.ativo !== false);
    return niveisCargos.filter((nc: any) => nc.setorId === form.setorId && nc.ativo !== false);
  }, [niveisCargos, form.setorId]);

  // Handler: ao selecionar setor, limpa cargo se não pertence ao novo setor
  const handleSetorChange = (setorIdStr: string) => {
    const newSetorId = Number(setorIdStr);
    setForm(f => {
      const cargoStillValid = niveisCargos.some((nc: any) => nc.setorId === newSetorId && nc.cargo === f.cargo && nc.ativo !== false);
      return { ...f, setorId: newSetorId, ...(cargoStillValid ? {} : { cargo: '', salarioBase: '', funcao: '' }) };
    });
    markDirty();
  };

  // Handler: ao selecionar cargo, preenche salário base automaticamente
  const handleCargoSelect = (cargoNome: string) => {
    const nc = niveisCargos.find((n: any) => n.cargo === cargoNome && (form.setorId ? n.setorId === form.setorId : true) && n.ativo !== false);
    setForm(f => ({
      ...f,
      cargo: cargoNome,
      salarioBase: nc?.salarioMinimo || nc?.salarioMaximo || f.salarioBase,
      setorId: nc?.setorId || f.setorId,
      nivelHierarquico: f.nivelHierarquico || '',
    }));
    markDirty();
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCargo !== 'todos') count++;
    if (filterSetor !== 'todos') count++;
    if (filterLocal !== 'todos') count++;
    if (filterVT !== 'todos') count++;
    if (filterNivel !== 'todos') count++;
    if (filterContrato !== 'todos') count++;
    return count;
  }, [filterCargo, filterSetor, filterLocal, filterVT, filterNivel, filterContrato]);

  const clearAllFilters = () => {
    setFilterStatus('todos');
    setFilterCargo('todos');
    setFilterSetor('todos');
    setFilterLocal('todos');
    setFilterVT('todos');
    setFilterNivel('todos');
    setFilterContrato('todos');
    setSearch('');
  };

  const getFilterLabel = () => {
    const parts: string[] = [];
    if (filterStatus !== 'todos') parts.push(STATUS_CONFIG[filterStatus]?.label || filterStatus);
    if (filterCargo !== 'todos') parts.push(filterCargo);
    if (filterLocal !== 'todos') parts.push(filterLocal === 'home_office' ? 'HomeOffice' : filterLocal);
    return parts.length > 0 ? parts.join('_') : 'Todos';
  };

  const exportToCSV = () => {
    if (filtered.length === 0) { toast.error('Nenhum colaborador para exportar'); return; }
    const headers = ['Nome Completo','CPF','Data Nascimento','Cargo','Função','Setor','Salário Base','Status','Tipo Contrato','Local Trabalho','Nível Hierárquico','Data Admissão','Email','Telefone','Vale Transporte'];
    const rows = filtered.map((c: any) => [
      c.nomeCompleto || '', c.cpf || '', c.dataNascimento || '', c.cargo || '', c.funcao || '',
      setoresList.find((s: any) => s.id === c.setorId)?.nome || '', c.salarioBase || '',
      STATUS_CONFIG[c.statusColaborador || 'ativo']?.label || 'Ativo',
      (c.tipoContrato || '').toUpperCase(),
      c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : c.localTrabalho === 'uberaba' ? 'Uberaba' : '',
      c.nivelHierarquico || '', c.dataAdmissao || '', c.email || '', c.telefone || '',
      c.valeTransporte ? 'Sim' : 'Não',
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Colaboradores_${getFilterLabel()}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} colaboradores exportados em CSV`);
  };

  const exportToExcel = () => {
    if (filtered.length === 0) { toast.error('Nenhum colaborador para exportar'); return; }
    const headers = ['Nome Completo','CPF','Data Nascimento','Cargo','Função','Setor','Salário Base','Status','Tipo Contrato','Local Trabalho','Nível Hierárquico','Data Admissão','Email','Telefone','Vale Transporte'];
    const rows = filtered.map((c: any) => [
      c.nomeCompleto || '', c.cpf || '', c.dataNascimento || '', c.cargo || '', c.funcao || '',
      setoresList.find((s: any) => s.id === c.setorId)?.nome || '', c.salarioBase || '',
      STATUS_CONFIG[c.statusColaborador || 'ativo']?.label || 'Ativo',
      (c.tipoContrato || '').toUpperCase(),
      c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : c.localTrabalho === 'uberaba' ? 'Uberaba' : '',
      c.nivelHierarquico || '', c.dataAdmissao || '', c.email || '', c.telefone || '',
      c.valeTransporte ? 'Sim' : 'Não',
    ]);
    let html = '<html><head><meta charset="utf-8"></head><body>';
    html += '<table border="1"><thead><tr>';
    headers.forEach(h => { html += `<th style="background:#0A2540;color:white;font-weight:bold;padding:8px">${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => { html += `<td style="padding:6px">${cell}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table></body></html>';
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Colaboradores_${getFilterLabel()}_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} colaboradores exportados em Excel`);
  };

  const filtered = useMemo(() => {
    let list = [...allColabs];
    if (filterStatus !== 'todos') list = list.filter((c: any) => (c.statusColaborador || 'ativo') === filterStatus);
    if (filterCargo !== 'todos') list = list.filter((c: any) => c.cargo === filterCargo);
    if (filterSetor !== 'todos') list = list.filter((c: any) => String(c.setorId) === filterSetor);
    if (filterLocal !== 'todos') list = list.filter((c: any) => c.localTrabalho === filterLocal);
    if (filterVT !== 'todos') list = list.filter((c: any) => filterVT === 'sim' ? c.valeTransporte === true : c.valeTransporte === false || !c.valeTransporte);
    if (filterNivel !== 'todos') list = list.filter((c: any) => c.nivelHierarquico === filterNivel);
    if (filterContrato !== 'todos') list = list.filter((c: any) => c.tipoContrato === filterContrato);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c: any) => c.nomeCompleto?.toLowerCase().includes(s) || c.cpf?.includes(s) || c.cargo?.toLowerCase().includes(s));
    }
    // Sort
    list.sort((a: any, b: any) => {
      let va = '', vb = '';
      if (sortField === 'nomeCompleto') { va = (a.nomeCompleto || '').toLowerCase(); vb = (b.nomeCompleto || '').toLowerCase(); }
      else if (sortField === 'cargo') { va = (a.cargo || '').toLowerCase(); vb = (b.cargo || '').toLowerCase(); }
      else if (sortField === 'setor') {
        va = (setoresList.find((s: any) => s.id === a.setorId)?.nome || '').toLowerCase();
        vb = (setoresList.find((s: any) => s.id === b.setorId)?.nome || '').toLowerCase();
      }
      else if (sortField === 'dataAdmissao') { va = a.dataAdmissao || ''; vb = b.dataAdmissao || ''; }
      else if (sortField === 'status') { va = a.statusColaborador || 'ativo'; vb = b.statusColaborador || 'ativo'; }
      const cmp = va.localeCompare(vb);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [allColabs, search, filterStatus, filterCargo, filterSetor, filterLocal, filterVT, filterNivel, filterContrato, sortField, sortDir, setoresList]);

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allColabs.forEach((c: any) => {
      const st = c.statusColaborador || 'ativo';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [allColabs]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="text-left px-3 py-2.5 text-xs font-medium cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'}`} />
      </span>
    </th>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="border-b border-primary/20 pb-1.5 mt-8 mb-4 first:mt-0">
      <h4 className="font-semibold text-sm text-primary tracking-wide uppercase">{children}</h4>
    </div>
  );

  const Field = ({ label, children, span = 1, required = false }: { label: string; children: React.ReactNode; span?: number; required?: boolean }) => (
    <div className={span === 2 ? 'md:col-span-2' : span === 3 ? 'md:col-span-3' : ''}>
      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ativo;
    const Icon = cfg.icon;
    return (
      <Badge className={`${cfg.color} border text-[10px] gap-1`} variant="secondary">
        <Icon className="w-3 h-3" /> {cfg.label}
      </Badge>
    );
  };

  // If a colaborador is selected, show the panel
  if (selectedColab) {
    return (
      <div className="space-y-6">
        <PainelColaborador
          colab={selectedColab}
          setores={setoresList}
          onClose={() => setSelectedColab(null)}
          onEdit={(c) => { setSelectedColab(null); openEdit(c); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground">Cadastro e gestão de colaboradores — Gente & Gestão</p>
        </div>
        <Button onClick={() => { closeFormClean(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Colaborador</Button>
      </div>

      {/* Status Summary */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setFilterStatus('todos'); setCurrentPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            filterStatus === 'todos' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          Todos ({allColabs.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = statusCounts[key] || 0;
          if (count === 0 && key !== 'ativo') return null;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => { setFilterStatus(key); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                filterStatus === key ? `${cfg.color} border-current` : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou cargo..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="w-4 h-4" />
            Filtros Avançados
            {activeFilterCount > 0 && (
              <Badge className="ml-1 bg-white text-primary h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                {activeFilterCount}
              </Badge>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
          {(activeFilterCount > 0 || filterStatus !== 'todos' || search.trim()) && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Exportar Excel (.xls)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4 text-blue-600" /> Exportar CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block"><MapPin className="w-3 h-3 inline mr-1" />Local de Trabalho</Label>
                <Select value={filterLocal} onValueChange={setFilterLocal}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="home_office">Home Office</SelectItem>
                    <SelectItem value="barueri">Barueri</SelectItem>
                    <SelectItem value="uberaba">Uberaba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block"><Briefcase className="w-3 h-3 inline mr-1" />Cargo</Label>
                <Select value={filterCargo} onValueChange={setFilterCargo}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {uniqueCargos.map((c: string) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block"><Building2 className="w-3 h-3 inline mr-1" />Setor</Label>
                <Select value={filterSetor} onValueChange={setFilterSetor}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {setoresList.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block"><User className="w-3 h-3 inline mr-1" />Nível Hierárquico</Label>
                <Select value={filterNivel} onValueChange={setFilterNivel}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="estagiario">Estagiário</SelectItem>
                    <SelectItem value="auxiliar">Auxiliar</SelectItem>
                    <SelectItem value="assistente">Assistente</SelectItem>
                    <SelectItem value="analista_jr">Analista Jr</SelectItem>
                    <SelectItem value="analista_pl">Analista Pl</SelectItem>
                    <SelectItem value="analista_sr">Analista Sr</SelectItem>
                    <SelectItem value="coordenador">Coordenador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block"><FileWarning className="w-3 h-3 inline mr-1" />Tipo de Contrato</Label>
                <Select value={filterContrato} onValueChange={setFilterContrato}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="contrato_trabalho">Contrato de Trabalho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block"><Bus className="w-3 h-3 inline mr-1" />Vale Transporte</Label>
                <Select value={filterVT} onValueChange={setFilterVT}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Mostrando {filtered.length} de {allColabs.length} colaboradores</p>
          </CardContent>
        </Card>
      )}

      {/* ===== LIST TABLE ===== */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <SortHeader field="nomeCompleto">Nome</SortHeader>
                <SortHeader field="cargo">Cargo</SortHeader>
                <SortHeader field="setor">Setor</SortHeader>
                <SortHeader field="status">Status</SortHeader>
                <th className="text-left px-3 py-2.5 text-xs font-medium">Contrato</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium">Unidade</th>
                <SortHeader field="dataAdmissao">Admissão</SortHeader>
                <th className="text-left px-3 py-2.5 text-xs font-medium">Tempo de Casa</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((c: any) => {
                const status = c.statusColaborador || 'ativo';
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ativo;
                const setorNome = setoresList.find((s: any) => s.id === c.setorId)?.nome || '—';
                return (
                  <tr
                    key={c.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors group"
                    onClick={() => setSelectedColab(c)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{c.nomeCompleto}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">{c.cargo || '—'}</td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">{setorNome}</td>
                    <td className="px-3 py-2.5">{getStatusBadge(status)}</td>
                    <td className="px-3 py-2.5">
                      {c.tipoContrato && <Badge variant="outline" className="text-[10px]">{c.tipoContrato.toUpperCase()}</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">
                      {c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : c.localTrabalho === 'uberaba' ? 'Uberaba' : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-sm">{formatDateBR(c.dataAdmissao)}</td>
                    <td className="px-3 py-2.5 text-sm font-medium">{calcTempoCasa(c.dataAdmissao)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
          </div>
        )}
        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Mostrando {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage <= 1} onClick={() => setCurrentPage(1)}>
                <ChevronsLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeftIcon className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-medium px-2">Página {safePage} de {totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
                <ChevronsRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Exit Alert */}
      <AlertDialog open={exitAlert} onOpenChange={setExitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" /> Descartar Alterações?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja sair e descartar todas as alterações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction onClick={closeFormClean} className="bg-red-600 hover:bg-red-700">
              Sair e Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admissão Alert */}
      <Dialog open={admissaoAlert} onOpenChange={setAdmissaoAlert}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" /> Data de Admissão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">A data de admissão informada é diferente da data atual. Deseja continuar com esta data?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmissaoAlert(false)}>Cancelar</Button>
            <Button onClick={() => { setAdmissaoAlert(false); handleSave(); }}>Sim, Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== MAIN FORM DIALOG ===== */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) tryCloseForm(); }}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {editId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editId ? 'Editar Colaborador' : 'Novo Colaborador'}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6 py-4">

            {/* ===== STATUS DO COLABORADOR ===== */}
            <SectionTitle>Status do Colaborador</SectionTitle>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const selected = form.statusColaborador === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, statusColaborador: key })); markDirty(); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                      selected
                        ? `${cfg.color} border-current shadow-sm`
                        : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/60'
                    } cursor-pointer`}
                  >
                    <Icon className="w-5 h-5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* ===== DADOS PESSOAIS ===== */}
            <SectionTitle>Dados Pessoais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Nome Completo" span={3} required>
                <Input value={form.nomeCompleto} onChange={e => { setForm(f => ({ ...f, nomeCompleto: e.target.value })); markDirty(); }} placeholder="Nome completo do colaborador" />
              </Field>
              <Field label="CPF" required>
                <div className="relative">
                  <Input
                    value={form.cpf}
                    onChange={e => handleCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    className={cpfValid === false ? 'border-red-500 pr-10' : cpfValid === true ? 'border-green-500 pr-10' : 'pr-10'}
                  />
                  {cpfValid === true && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                  {cpfValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
                </div>
                {cpfValid === false && <p className="text-xs text-red-500 mt-1">CPF inválido</p>}
              </Field>
              <Field label="Data de Nascimento">
                <Input type="date" value={form.dataNascimento} onChange={e => { setForm(f => ({ ...f, dataNascimento: e.target.value })); markDirty(); }} />
                {form.dataNascimento && <p className="text-xs text-muted-foreground mt-0.5">{calcIdade(form.dataNascimento)}</p>}
              </Field>
              <Field label="Sexo">
                <Select value={form.sexo} onValueChange={v => { setForm(f => ({ ...f, sexo: v })); markDirty(); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado Civil">
                <Select value={form.estadoCivil} onValueChange={v => { setForm(f => ({ ...f, estadoCivil: v })); markDirty(); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nacionalidade">
                <Input value={form.nacionalidade} onChange={e => { setForm(f => ({ ...f, nacionalidade: e.target.value })); markDirty(); }} />
              </Field>
              <Field label="Naturalidade">
                <Input value={form.naturalidade} onChange={e => { setForm(f => ({ ...f, naturalidade: e.target.value })); markDirty(); }} placeholder="Cidade/Estado" />
              </Field>
            </div>

            {/* ===== DOCUMENTOS ===== */}
            <SectionTitle>Documentos</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="RG Número"><Input value={form.rgNumero} onChange={e => { setForm(f => ({ ...f, rgNumero: e.target.value })); markDirty(); }} /></Field>
              <Field label="Órgão Emissor"><Input value={form.rgOrgaoEmissor} onChange={e => { setForm(f => ({ ...f, rgOrgaoEmissor: e.target.value })); markDirty(); }} placeholder="Ex: SSP/SP" /></Field>
              <Field label="Data de Emissão"><Input type="date" value={form.rgDataEmissao} onChange={e => { setForm(f => ({ ...f, rgDataEmissao: e.target.value })); markDirty(); }} /></Field>
              <Field label="CTPS (Número/Série)"><Input value={form.ctpsNumero} onChange={e => { setForm(f => ({ ...f, ctpsNumero: e.target.value })); markDirty(); }} placeholder="Número e série" /></Field>
              <Field label="CTPS UF Emissão">
                <Select value={form.ctpsUfEmissao} onValueChange={v => { setForm(f => ({ ...f, ctpsUfEmissao: v })); markDirty(); }}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{UFS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="PIS/PASEP"><Input value={form.pisPasep} onChange={e => { setForm(f => ({ ...f, pisPasep: e.target.value })); markDirty(); }} /></Field>
              <Field label="Título de Eleitor"><Input value={form.tituloEleitor} onChange={e => { setForm(f => ({ ...f, tituloEleitor: e.target.value })); markDirty(); }} /></Field>
              <Field label="Zona"><Input value={form.tituloEleitorZona} onChange={e => { setForm(f => ({ ...f, tituloEleitorZona: e.target.value })); markDirty(); }} /></Field>
              <Field label="Seção"><Input value={form.tituloEleitorSecao} onChange={e => { setForm(f => ({ ...f, tituloEleitorSecao: e.target.value })); markDirty(); }} /></Field>
              <Field label="Certificado Reservista"><Input value={form.certificadoReservista} onChange={e => { setForm(f => ({ ...f, certificadoReservista: e.target.value })); markDirty(); }} /></Field>
            </div>

            {/* ===== FORMAÇÃO ===== */}
            <SectionTitle>Formação Acadêmica</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Grau de Instrução">
                <Select value={form.grauInstrucao} onValueChange={v => { setForm(f => ({ ...f, grauInstrucao: v })); markDirty(); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{GRAUS_INSTRUCAO.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Formação / Curso">
                <Input value={form.formacaoAcademica} onChange={e => { setForm(f => ({ ...f, formacaoAcademica: e.target.value })); markDirty(); }} placeholder="Ex: Administração de Empresas" />
              </Field>
            </div>

            {/* ===== CONTATO DE EMERGÊNCIA ===== */}
            <SectionTitle>Contato de Emergência</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Nome"><Input value={form.contatoEmergenciaNome} onChange={e => { setForm(f => ({ ...f, contatoEmergenciaNome: e.target.value })); markDirty(); }} /></Field>
              <Field label="Telefone"><Input value={form.contatoEmergenciaTelefone} onChange={e => { setForm(f => ({ ...f, contatoEmergenciaTelefone: maskPhone(e.target.value) })); markDirty(); }} placeholder="(00) 00000-0000" /></Field>
              <Field label="Parentesco">
                <Select value={form.contatoEmergenciaParentesco} onValueChange={v => { setForm(f => ({ ...f, contatoEmergenciaParentesco: v })); markDirty(); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{PARENTESCOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            {/* ===== FILIAÇÃO ===== */}
            <SectionTitle>Filiação</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Nome da Mãe"><Input value={form.nomeMae} onChange={e => { setForm(f => ({ ...f, nomeMae: e.target.value })); markDirty(); }} /></Field>
              <Field label="Nome do Pai"><Input value={form.nomePai} onChange={e => { setForm(f => ({ ...f, nomePai: e.target.value })); markDirty(); }} /></Field>
            </div>

            {/* ===== ENDEREÇO ===== */}
            <SectionTitle>Endereço</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
              <Field label="CEP">
                <div className="relative">
                  <Input value={form.cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" />
                  {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              </Field>
              <Field label="Logradouro" span={3}><Input value={form.logradouro} onChange={e => { setForm(f => ({ ...f, logradouro: e.target.value })); markDirty(); }} /></Field>
              <Field label="Número"><Input value={form.numero} onChange={e => { setForm(f => ({ ...f, numero: e.target.value })); markDirty(); }} /></Field>
              <Field label="Complemento"><Input value={form.complemento} onChange={e => { setForm(f => ({ ...f, complemento: e.target.value })); markDirty(); }} /></Field>
              <Field label="Bairro"><Input value={form.bairro} onChange={e => { setForm(f => ({ ...f, bairro: e.target.value })); markDirty(); }} /></Field>
              <Field label="Cidade"><Input value={form.cidade} onChange={e => { setForm(f => ({ ...f, cidade: e.target.value })); markDirty(); }} /></Field>
              <Field label="Estado">
                <Select value={form.estado} onValueChange={v => { setForm(f => ({ ...f, estado: v })); markDirty(); }}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{UFS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            {/* ===== CONTATO ===== */}
            <SectionTitle>Contato</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Telefone Pessoal"><Input value={form.telefone} onChange={e => handlePhoneChange(e.target.value)} placeholder="(00) 00000-0000" /></Field>
              <Field label="E-mail Pessoal"><Input type="email" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); markDirty(); }} placeholder="email@exemplo.com" /></Field>
              <Field label="Telefone Corporativo"><Input value={(form as any).telefoneCorporativo || ''} onChange={e => { setForm(f => ({ ...f, telefoneCorporativo: maskPhone(e.target.value) } as any)); markDirty(); }} placeholder="(00) 00000-0000" /></Field>
              <Field label="E-mail Corporativo"><Input type="email" value={(form as any).emailCorporativo || ''} onChange={e => { setForm(f => ({ ...f, emailCorporativo: e.target.value } as any)); markDirty(); }} placeholder="nome@empresa.com.br" /></Field>
            </div>

            {/* ===== DADOS PROFISSIONAIS ===== */}
            <SectionTitle>Dados Profissionais</SectionTitle>
            {/* Row 1: Admissão, Tipo Contrato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Data de Admissão" required><Input type="date" value={form.dataAdmissao} onChange={e => { setForm(f => ({ ...f, dataAdmissao: e.target.value })); markDirty(); }} /></Field>
              <Field label="Tipo de Contrato">
                <Select value={form.tipoContrato} onValueChange={v => { setForm(f => ({ ...f, tipoContrato: v })); markDirty(); }}>
                  <SelectTrigger className="w-full truncate"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="contrato_trabalho">Contrato de Trabalho</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {/* Row 2: Período de Experiência (full width, handled in phase 4) */}
            <ExperienciaSection form={form} setForm={setForm} markDirty={markDirty} />
            {/* Row 3: Setor, Cargo (auto-fill de Cargos e Salários), Nível Hierárquico */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 mt-3">
              <Field label="Setor">
                <Select value={form.setorId ? String(form.setorId) : ''} onValueChange={handleSetorChange}>
                  <SelectTrigger className="w-full truncate"><SelectValue placeholder="Selecionar setor" /></SelectTrigger>
                  <SelectContent>
                    {setoresList.filter((s: any) => s.ativo).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cargo" required>
                {cargosBySetor.length > 0 ? (
                  <Select value={form.cargo} onValueChange={handleCargoSelect}>
                    <SelectTrigger className="w-full truncate"><SelectValue placeholder="Selecionar cargo" /></SelectTrigger>
                    <SelectContent>
                      {cargosBySetor.map((nc: any) => {
                        const setorNome = setoresList.find((s: any) => s.id === nc.setorId)?.nome || '';
                        const faixa = nc.salarioMinimo ? `R$ ${Number(nc.salarioMinimo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
                        return (
                          <SelectItem key={nc.id} value={nc.cargo}>
                            <span>{nc.cargo}</span>
                            {!form.setorId && setorNome && <span className="text-muted-foreground text-xs ml-1">({setorNome})</span>}
                            {faixa && <span className="text-muted-foreground text-xs ml-1">— {faixa}</span>}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.cargo} onChange={e => { setForm(f => ({ ...f, cargo: e.target.value })); markDirty(); }} placeholder="Digite o cargo" />
                )}
                {form.cargo && cargosBySetor.length > 0 && (() => {
                  const nc = cargosBySetor.find((n: any) => n.cargo === form.cargo);
                  if (nc?.salarioMinimo && nc?.salarioMaximo && nc.salarioMinimo !== nc.salarioMaximo) {
                    return <p className="text-xs text-muted-foreground mt-0.5">Faixa salarial: R$ {Number(nc.salarioMinimo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — R$ {Number(nc.salarioMaximo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>;
                  }
                  return null;
                })()}
              </Field>
              <Field label="Nível Hierárquico">
                <Select value={form.nivelHierarquico} onValueChange={v => { setForm(f => ({ ...f, nivelHierarquico: v })); markDirty(); }}>
                  <SelectTrigger className="w-full truncate"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(NIVEIS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {/* Row 4: Função, Local de Trabalho */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 mt-3">
              <Field label="Função"><Input value={form.funcao} onChange={e => { setForm(f => ({ ...f, funcao: e.target.value })); markDirty(); }} /></Field>
              <Field label="Local de Trabalho">
                <Select value={form.localTrabalho} onValueChange={v => { setForm(f => ({ ...f, localTrabalho: v })); markDirty(); }}>
                  <SelectTrigger className="w-full truncate"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home_office">Home Office</SelectItem>
                    <SelectItem value="barueri">Unidade Barueri</SelectItem>
                    <SelectItem value="uberaba">Unidade Uberaba</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* ===== REMUNERAÇÃO ===== */}
            <SectionTitle>Remuneração</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Salário Base" required><Input value={form.salarioBase} onChange={e => { setForm(f => ({ ...f, salarioBase: e.target.value })); markDirty(); }} placeholder="R$ 0,00" /></Field>
              <Field label="Cargo Comissionado?">
                <div className="flex items-center gap-3 h-9">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="recebeComissao" checked={form.recebeComissao === true} onChange={() => { setForm(f => ({ ...f, recebeComissao: true })); markDirty(); }} className="h-4 w-4 accent-primary" />
                    <span className="text-sm font-medium">Sim</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="recebeComissao" checked={form.recebeComissao === false} onChange={() => { setForm(f => ({ ...f, recebeComissao: false })); markDirty(); }} className="h-4 w-4 accent-primary" />
                    <span className="text-sm font-medium">Não</span>
                  </label>
                </div>
              </Field>
              <Field label="Adicionais"><Input value={form.adicionais} onChange={e => { setForm(f => ({ ...f, adicionais: e.target.value })); markDirty(); }} placeholder="R$ 0,00" /></Field>
            </div>

            {/* ===== JORNADA ===== */}
            <SectionTitle>Jornada de Trabalho</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
              <Field label="Entrada"><Input type="time" value={form.jornadaEntrada} onChange={e => { setForm(f => ({ ...f, jornadaEntrada: e.target.value })); markDirty(); }} /></Field>
              <Field label="Saída"><Input type="time" value={form.jornadaSaida} onChange={e => { setForm(f => ({ ...f, jornadaSaida: e.target.value })); markDirty(); }} /></Field>
              <Field label="Intervalo"><Input type="time" value={form.jornadaIntervalo} onChange={e => { setForm(f => ({ ...f, jornadaIntervalo: e.target.value })); markDirty(); }} /></Field>
              <Field label="Carga Horária (h/sem)"><Input value={form.cargaHoraria} onChange={e => { setForm(f => ({ ...f, cargaHoraria: e.target.value })); markDirty(); }} /></Field>
            </div>
            <div className="mt-4">
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(d => {
                  const checked = form.jornadaDias.includes(d.key);
                  return (
                    <button key={d.key} type="button" onClick={() => toggleDia(d.key)}
                      className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                        checked ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      } cursor-pointer`}
                    >{d.label}</button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <Label className="text-xs font-medium text-muted-foreground">Vale Transporte</Label>
              <button type="button" onClick={() => { setForm(f => ({ ...f, valeTransporte: !f.valeTransporte })); markDirty(); }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  form.valeTransporte ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                } cursor-pointer`}
              >{form.valeTransporte ? 'Sim' : 'Não'}</button>
            </div>

            {/* ===== DADOS BANCÁRIOS ===== */}
            <SectionTitle>Dados Bancários</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Banco"><Input value={form.banco} onChange={e => { setForm(f => ({ ...f, banco: e.target.value })); markDirty(); }} placeholder="Ex: Itaú, Bradesco..." /></Field>
              <Field label="Agência"><Input value={form.agencia} onChange={e => { setForm(f => ({ ...f, agencia: e.target.value })); markDirty(); }} /></Field>
              <Field label="Conta"><Input value={form.conta} onChange={e => { setForm(f => ({ ...f, conta: e.target.value })); markDirty(); }} /></Field>
              <Field label="Tipo de Conta">
                <Select value={form.tipoConta} onValueChange={v => { setForm(f => ({ ...f, tipoConta: v })); markDirty(); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Chave PIX" span={2}><Input value={form.chavePix} onChange={e => { setForm(f => ({ ...f, chavePix: e.target.value })); markDirty(); }} placeholder="CPF, e-mail, telefone ou chave aleatória" /></Field>
            </div>

            {/* ===== SAÚDE ===== */}
            <SectionTitle>Saúde — ASO Admissional</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-end">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Apto</Label>
                <button type="button" onClick={() => { setForm(f => ({ ...f, asoAdmissionalApto: !f.asoAdmissionalApto })); markDirty(); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    form.asoAdmissionalApto ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                  } cursor-pointer`}
                >{form.asoAdmissionalApto ? 'Sim' : 'Não'}</button>
              </div>
              <Field label="Data do Exame"><Input type="date" value={form.asoAdmissionalData} onChange={e => { setForm(f => ({ ...f, asoAdmissionalData: e.target.value })); markDirty(); }} /></Field>
            </div>

            {/* ===== DEPENDENTES ===== */}
            <SectionTitle>Dependentes</SectionTitle>
            <p className="text-xs text-muted-foreground mb-3">Dependentes para IRRF / Salário-Família</p>
            {form.dependentes.length > 0 && (
              <div className="space-y-2 mb-4">
                {form.dependentes.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                      <div><span className="text-[10px] uppercase text-muted-foreground">Nome</span><p className="text-sm font-medium">{d.nome}</p></div>
                      <div><span className="text-[10px] uppercase text-muted-foreground">Parentesco</span><p className="text-sm">{d.parentesco}</p></div>
                      <div><span className="text-[10px] uppercase text-muted-foreground">CPF</span><p className="text-sm">{d.cpf || '—'}</p></div>
                      <div><span className="text-[10px] uppercase text-muted-foreground">Nascimento</span><p className="text-sm">{formatDateBR(d.dataNascimento)}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.dependenteIR && <Badge variant="outline" className="text-[10px]">IR</Badge>}
                      {d.dependentePlanoSaude && <Badge variant="outline" className="text-[10px]">Plano</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeDependente(i)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add dependente form */}
            <div className="border border-dashed border-border rounded-lg p-4">
              <h5 className="text-xs font-semibold mb-3">Adicionar Dependente</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                <Field label="Nome" required><Input value={depForm.nome} onChange={e => setDepForm(f => ({ ...f, nome: e.target.value }))} /></Field>
                <Field label="CPF"><Input value={depForm.cpf} onChange={e => setDepForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" /></Field>
                <Field label="Data Nascimento"><Input type="date" value={depForm.dataNascimento} onChange={e => setDepForm(f => ({ ...f, dataNascimento: e.target.value }))} /></Field>
                <Field label="Parentesco" required>
                  <Select value={depForm.parentesco} onValueChange={v => setDepForm(f => ({ ...f, parentesco: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{PARENTESCOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={depForm.dependenteIR} onChange={e => setDepForm(f => ({ ...f, dependenteIR: e.target.checked }))} className="h-4 w-4" />
                    <span className="text-xs">Dep. IR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={depForm.dependentePlanoSaude} onChange={e => setDepForm(f => ({ ...f, dependentePlanoSaude: e.target.checked }))} className="h-4 w-4" />
                    <span className="text-xs">Plano Saúde</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={addDependente} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Adicionar</Button>
                </div>
              </div>
            </div>

            {/* ===== PENSÃO / CONTRIBUIÇÃO ===== */}
            <SectionTitle>Pensão & Contribuição</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex items-center gap-3">
                <Label className="text-xs font-medium text-muted-foreground">Pensão Alimentícia</Label>
                <button type="button" onClick={() => { setForm(f => ({ ...f, pagaPensaoAlimenticia: !f.pagaPensaoAlimenticia })); markDirty(); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    form.pagaPensaoAlimenticia ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                  } cursor-pointer`}
                >{form.pagaPensaoAlimenticia ? 'Sim' : 'Não'}</button>
              </div>
              {form.pagaPensaoAlimenticia && (
                <Field label="Valor Pensão"><Input value={form.valorPensaoAlimenticia} onChange={e => { setForm(f => ({ ...f, valorPensaoAlimenticia: e.target.value })); markDirty(); }} placeholder="R$ 0,00" /></Field>
              )}
              <div className="flex items-center gap-3">
                <Label className="text-xs font-medium text-muted-foreground">Contribuição Assistencial</Label>
                <button type="button" onClick={() => { setForm(f => ({ ...f, temContribuicaoAssistencial: !f.temContribuicaoAssistencial })); markDirty(); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    form.temContribuicaoAssistencial ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                  } cursor-pointer`}
                >{form.temContribuicaoAssistencial ? 'Sim' : 'Não'}</button>
              </div>
              {form.temContribuicaoAssistencial && (
                <Field label="Valor Contribuição"><Input value={form.valorContribuicaoAssistencial} onChange={e => { setForm(f => ({ ...f, valorContribuicaoAssistencial: e.target.value })); markDirty(); }} placeholder="R$ 0,00" /></Field>
              )}
            </div>

          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={tryCloseForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="gap-1.5">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {editId ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
