import { useState, useMemo, useRef } from 'react';
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
  Download, FileSpreadsheet, FileText
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bgCard: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700 border-green-200', icon: UserCheck, bgCard: 'border-l-green-500' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: UserX, bgCard: 'border-l-gray-400' },
  afastado: { label: 'Afastado', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ShieldAlert, bgCard: 'border-l-orange-500' },
  licenca: { label: 'Licença', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: FileWarning, bgCard: 'border-l-purple-500' },
  atestado: { label: 'Atestado', color: 'bg-red-100 text-red-700 border-red-200', icon: HeartPulse, bgCard: 'border-l-red-500' },
  desligado: { label: 'Desligado', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle, bgCard: 'border-l-slate-500' },
  ferias: { label: 'Férias', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Palmtree, bgCard: 'border-l-cyan-500' },
  experiencia: { label: 'Experiência', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, bgCard: 'border-l-yellow-500' },
  aviso_previo: { label: 'Aviso Prévio', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Briefcase, bgCard: 'border-l-amber-500' },
};

type Dependente = { nome: string; cpf: string; dataNascimento: string; parentesco: string };

const EMPTY_FORM = {
  nomeCompleto: '', cpf: '', dataNascimento: '', rgNumero: '', rgOrgaoEmissor: '', rgDataEmissao: '',
  ctpsNumero: '', pisPasep: '', nomeMae: '', nomePai: '', nacionalidade: 'Brasileira', naturalidade: '',
  estadoCivil: '' as string, tituloEleitor: '', certificadoReservista: '', sexo: '' as string,
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  telefone: '', email: '',
  dataAdmissao: '', cargo: '', funcao: '', salarioBase: '', comissoes: '', adicionais: '',
  jornadaEntrada: '08:00', jornadaSaida: '18:00', jornadaIntervalo: '01:00', cargaHoraria: '44',
  jornadaDias: ['seg', 'ter', 'qua', 'qui', 'sex'] as string[],
  tipoContrato: 'clt' as string, periodoExperiencia: 45, localTrabalho: '' as string,
  valeTransporte: false, banco: '', agencia: '', conta: '', tipoConta: '' as string, chavePix: '',
  asoAdmissionalApto: false, asoAdmissionalData: '',
  dependentes: [] as Dependente[],
  setorId: 0, nivelHierarquico: '' as string,
  statusColaborador: 'ativo' as string,
};

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
  const [depForm, setDepForm] = useState<Dependente>({ nome: '', cpf: '', dataNascimento: '', parentesco: '' });
  const formDirtyRef = useRef(false);

  const colaboradores = trpc.colaboradores.list.useQuery();
  const setores = trpc.setores.list.useQuery();
  const historicoStatus = trpc.historicoStatus.list.useQuery(
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
      periodoExperiencia: form.periodoExperiencia || undefined,
      setorId: form.setorId || undefined,
      estadoCivil: (form.estadoCivil || undefined) as any,
      sexo: (form.sexo || undefined) as any,
      tipoContrato: (form.tipoContrato || 'clt') as any,
      localTrabalho: (form.localTrabalho || undefined) as any,
      tipoConta: (form.tipoConta || undefined) as any,
      nivelHierarquico: (form.nivelHierarquico || undefined) as any,
      statusColaborador: (form.statusColaborador || 'ativo') as any,
    };

    if (editId) {
      updateMut.mutate({ id: editId, data: payload });
    } else {
      createMut.mutate(payload);
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

  const openView = (c: any) => {
    setForm({
      ...EMPTY_FORM, ...c,
      jornadaDias: c.jornadaDias ? (typeof c.jornadaDias === 'string' ? JSON.parse(c.jornadaDias) : c.jornadaDias) : ['seg', 'ter', 'qua', 'qui', 'sex'],
      dependentes: c.dependentes ? (typeof c.dependentes === 'string' ? JSON.parse(c.dependentes) : c.dependentes) : [],
      chavePix: c.chavePix || '',
      statusColaborador: c.statusColaborador || 'ativo',
    });
    setEditId(c.id);
    setViewMode(true);
    setShowForm(true);
    formDirtyRef.current = false;
  };

  const addDependente = () => {
    if (!depForm.nome.trim()) { toast.error('Nome do dependente é obrigatório'); return; }
    if (!depForm.parentesco) { toast.error('Parentesco é obrigatório'); return; }
    setForm(f => ({ ...f, dependentes: [...f.dependentes, { ...depForm }] }));
    setDepForm({ nome: '', cpf: '', dataNascimento: '', parentesco: '' });
    markDirty();
  };

  const removeDependente = (idx: number) => {
    setForm(f => ({ ...f, dependentes: f.dependentes.filter((_, i) => i !== idx) }));
    markDirty();
  };

  const allColabs = (colaboradores.data || []) as any[];

  // Extract unique values for filter dropdowns
  const uniqueCargos = useMemo(() => Array.from(new Set(allColabs.map((c: any) => c.cargo).filter(Boolean))).sort(), [allColabs]);
  const uniqueLocais = useMemo(() => Array.from(new Set(allColabs.map((c: any) => c.localTrabalho).filter(Boolean))).sort(), [allColabs]);
  const uniqueNiveis = useMemo(() => Array.from(new Set(allColabs.map((c: any) => c.nivelHierarquico).filter(Boolean))).sort(), [allColabs]);
  const uniqueContratos = useMemo(() => Array.from(new Set(allColabs.map((c: any) => c.tipoContrato).filter(Boolean))).sort(), [allColabs]);
  const setoresList = (setores.data || []) as any[];

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
    const headers = ['Nome Completo','CPF','Data Nascimento','Cargo','Fun\u00e7\u00e3o','Setor','Sal\u00e1rio Base','Status','Tipo Contrato','Local Trabalho','N\u00edvel Hier\u00e1rquico','Data Admiss\u00e3o','Email','Telefone','Vale Transporte'];
    const rows = filtered.map((c: any) => [
      c.nomeCompleto || '', c.cpf || '', c.dataNascimento || '', c.cargo || '', c.funcao || '',
      setoresList.find((s: any) => s.id === c.setorId)?.nome || '', c.salarioBase || '',
      STATUS_CONFIG[c.statusColaborador || 'ativo']?.label || 'Ativo',
      (c.tipoContrato || '').toUpperCase(),
      c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : c.localTrabalho === 'uberaba' ? 'Uberaba' : '',
      c.nivelHierarquico || '', c.dataAdmissao || '', c.email || '', c.telefone || '',
      c.valeTransporte ? 'Sim' : 'N\u00e3o',
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
    const headers = ['Nome Completo','CPF','Data Nascimento','Cargo','Fun\u00e7\u00e3o','Setor','Sal\u00e1rio Base','Status','Tipo Contrato','Local Trabalho','N\u00edvel Hier\u00e1rquico','Data Admiss\u00e3o','Email','Telefone','Vale Transporte'];
    const rows = filtered.map((c: any) => [
      c.nomeCompleto || '', c.cpf || '', c.dataNascimento || '', c.cargo || '', c.funcao || '',
      setoresList.find((s: any) => s.id === c.setorId)?.nome || '', c.salarioBase || '',
      STATUS_CONFIG[c.statusColaborador || 'ativo']?.label || 'Ativo',
      (c.tipoContrato || '').toUpperCase(),
      c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : c.localTrabalho === 'uberaba' ? 'Uberaba' : '',
      c.nivelHierarquico || '', c.dataAdmissao || '', c.email || '', c.telefone || '',
      c.valeTransporte ? 'Sim' : 'N\u00e3o',
    ]);
    // Generate HTML table for Excel compatibility
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
    if (filterStatus !== 'todos') {
      list = list.filter((c: any) => (c.statusColaborador || 'ativo') === filterStatus);
    }
    if (filterCargo !== 'todos') {
      list = list.filter((c: any) => c.cargo === filterCargo);
    }
    if (filterSetor !== 'todos') {
      list = list.filter((c: any) => String(c.setorId) === filterSetor);
    }
    if (filterLocal !== 'todos') {
      list = list.filter((c: any) => c.localTrabalho === filterLocal);
    }
    if (filterVT !== 'todos') {
      list = list.filter((c: any) => {
        if (filterVT === 'sim') return c.valeTransporte === true;
        return c.valeTransporte === false || !c.valeTransporte;
      });
    }
    if (filterNivel !== 'todos') {
      list = list.filter((c: any) => c.nivelHierarquico === filterNivel);
    }
    if (filterContrato !== 'todos') {
      list = list.filter((c: any) => c.tipoContrato === filterContrato);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c: any) =>
        c.nomeCompleto?.toLowerCase().includes(s) || c.cpf?.includes(s) || c.cargo?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [allColabs, search, filterStatus, filterCargo, filterSetor, filterLocal, filterVT, filterNivel, filterContrato]);

  // Status summary counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allColabs.forEach((c: any) => {
      const st = c.statusColaborador || 'ativo';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [allColabs]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground">Cadastro e gestão de colaboradores — Gente & Gestão</p>
        </div>
        <Button onClick={() => { closeFormClean(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Colaborador</Button>
      </div>

      {/* Status Summary Cards */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('todos')}
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
              onClick={() => setFilterStatus(key)}
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

      {/* Search + Advanced Filters Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou cargo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c: any) => {
          const status = c.statusColaborador || 'ativo';
          const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ativo;
          return (
            <Card key={c.id} className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${cfg.bgCard}`} onClick={() => openView(c)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">{c.nomeCompleto}</h4>
                      <p className="text-xs text-muted-foreground truncate">{c.cargo}</p>
                    </div>
                  </div>
                  {getStatusBadge(status)}
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {c.tipoContrato && <Badge variant="outline" className="text-[10px]">{c.tipoContrato.toUpperCase()}</Badge>}
                  {c.localTrabalho && <Badge variant="secondary" className="text-[10px]">{c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : 'Uberaba'}</Badge>}
                  {c.dataAdmissao && <span className="text-[10px] text-muted-foreground">Admissão: {c.dataAdmissao}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
          </CardContent>
        </Card>
      )}

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
              {viewMode ? <Eye className="w-5 h-5" /> : editId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {viewMode ? 'Visualizar Colaborador' : editId ? 'Editar Colaborador' : 'Novo Colaborador'}
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
                    disabled={viewMode}
                    onClick={() => { setForm(f => ({ ...f, statusColaborador: key })); markDirty(); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                      selected
                        ? `${cfg.color} border-current shadow-sm`
                        : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/60'
                    } ${viewMode ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
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
                <Input value={form.nomeCompleto} onChange={e => { setForm(f => ({ ...f, nomeCompleto: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="Nome completo do colaborador" />
              </Field>
              <Field label="CPF" required>
                <div className="relative">
                  <Input
                    value={form.cpf}
                    onChange={e => handleCpfChange(e.target.value)}
                    disabled={viewMode}
                    placeholder="000.000.000-00"
                    className={cpfValid === false ? 'border-red-500 pr-10' : cpfValid === true ? 'border-green-500 pr-10' : 'pr-10'}
                  />
                  {cpfValid === true && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                  {cpfValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
                </div>
                {cpfValid === false && <p className="text-xs text-red-500 mt-1">CPF inválido</p>}
              </Field>
              <Field label="Data de Nascimento">
                <Input type="date" value={form.dataNascimento} onChange={e => { setForm(f => ({ ...f, dataNascimento: e.target.value })); markDirty(); }} disabled={viewMode} />
                {form.dataNascimento && <p className="text-xs text-muted-foreground mt-0.5">{calcIdade(form.dataNascimento)}</p>}
              </Field>
              <Field label="Sexo">
                <Select value={form.sexo} onValueChange={v => { setForm(f => ({ ...f, sexo: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado Civil">
                <Select value={form.estadoCivil} onValueChange={v => { setForm(f => ({ ...f, estadoCivil: v })); markDirty(); }} disabled={viewMode}>
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
                <Input value={form.nacionalidade} onChange={e => { setForm(f => ({ ...f, nacionalidade: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Naturalidade">
                <Input value={form.naturalidade} onChange={e => { setForm(f => ({ ...f, naturalidade: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="Cidade/Estado" />
              </Field>
            </div>

            {/* ===== DOCUMENTOS ===== */}
            <SectionTitle>Documentos</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="RG Número">
                <Input value={form.rgNumero} onChange={e => { setForm(f => ({ ...f, rgNumero: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Órgão Emissor">
                <Input value={form.rgOrgaoEmissor} onChange={e => { setForm(f => ({ ...f, rgOrgaoEmissor: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="Ex: SSP/SP" />
              </Field>
              <Field label="Data de Emissão">
                <Input type="date" value={form.rgDataEmissao} onChange={e => { setForm(f => ({ ...f, rgDataEmissao: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="CTPS (Número/Série)">
                <Input value={form.ctpsNumero} onChange={e => { setForm(f => ({ ...f, ctpsNumero: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="Número e série" />
              </Field>
              <Field label="PIS/PASEP">
                <Input value={form.pisPasep} onChange={e => { setForm(f => ({ ...f, pisPasep: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Título de Eleitor">
                <Input value={form.tituloEleitor} onChange={e => { setForm(f => ({ ...f, tituloEleitor: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Certificado Reservista">
                <Input value={form.certificadoReservista} onChange={e => { setForm(f => ({ ...f, certificadoReservista: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
            </div>

            {/* ===== FILIAÇÃO ===== */}
            <SectionTitle>Filiação</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Nome da Mãe">
                <Input value={form.nomeMae} onChange={e => { setForm(f => ({ ...f, nomeMae: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Nome do Pai">
                <Input value={form.nomePai} onChange={e => { setForm(f => ({ ...f, nomePai: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
            </div>

            {/* ===== ENDEREÇO ===== */}
            <SectionTitle>Endereço</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
              <Field label="CEP">
                <div className="relative">
                  <Input value={form.cep} onChange={e => handleCepChange(e.target.value)} disabled={viewMode} placeholder="00000-000" />
                  {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              </Field>
              <Field label="Logradouro" span={3}>
                <Input value={form.logradouro} onChange={e => { setForm(f => ({ ...f, logradouro: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Número">
                <Input value={form.numero} onChange={e => { setForm(f => ({ ...f, numero: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Complemento">
                <Input value={form.complemento} onChange={e => { setForm(f => ({ ...f, complemento: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Bairro">
                <Input value={form.bairro} onChange={e => { setForm(f => ({ ...f, bairro: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Cidade">
                <Input value={form.cidade} onChange={e => { setForm(f => ({ ...f, cidade: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3 mt-3">
              <Field label="Estado">
                <Input value={form.estado} onChange={e => { setForm(f => ({ ...f, estado: e.target.value })); markDirty(); }} disabled={viewMode} maxLength={2} placeholder="UF" />
              </Field>
            </div>

            {/* ===== CONTATO ===== */}
            <SectionTitle>Contato</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Telefone">
                <Input value={form.telefone} onChange={e => handlePhoneChange(e.target.value)} disabled={viewMode} placeholder="(00) 00000-0000" />
              </Field>
              <Field label="E-mail">
                <Input type="email" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="email@exemplo.com" />
              </Field>
            </div>

            {/* ===== DADOS PROFISSIONAIS ===== */}
            <SectionTitle>Dados Profissionais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Data de Admissão" required>
                <Input type="date" value={form.dataAdmissao} onChange={e => { setForm(f => ({ ...f, dataAdmissao: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Tipo de Contrato">
                <Select value={form.tipoContrato} onValueChange={v => { setForm(f => ({ ...f, tipoContrato: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="contrato_trabalho">Contrato de Trabalho</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Período de Experiência (dias)">
                <Input type="number" value={form.periodoExperiencia} onChange={e => { setForm(f => ({ ...f, periodoExperiencia: Number(e.target.value) })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Cargo" required>
                <Input value={form.cargo} onChange={e => { setForm(f => ({ ...f, cargo: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Função">
                <Input value={form.funcao} onChange={e => { setForm(f => ({ ...f, funcao: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Nível Hierárquico">
                <Select value={form.nivelHierarquico} onValueChange={v => { setForm(f => ({ ...f, nivelHierarquico: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estagiario">Estagiário</SelectItem>
                    <SelectItem value="auxiliar">Auxiliar</SelectItem>
                    <SelectItem value="assistente">Assistente</SelectItem>
                    <SelectItem value="analista_jr">Analista Jr</SelectItem>
                    <SelectItem value="analista_pl">Analista Pleno</SelectItem>
                    <SelectItem value="analista_sr">Analista Sênior</SelectItem>
                    <SelectItem value="coordenador">Coordenador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Setor">
                <Select value={form.setorId ? String(form.setorId) : ''} onValueChange={v => { setForm(f => ({ ...f, setorId: Number(v) })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {((setores.data || []) as any[]).filter((s: any) => s.ativo).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Local de Trabalho">
                <Select value={form.localTrabalho} onValueChange={v => { setForm(f => ({ ...f, localTrabalho: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
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
              <Field label="Salário Base" required>
                <Input value={form.salarioBase} onChange={e => { setForm(f => ({ ...f, salarioBase: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="R$ 0,00" />
              </Field>
              <Field label="Comissões">
                <Input value={form.comissoes} onChange={e => { setForm(f => ({ ...f, comissoes: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="R$ 0,00" />
              </Field>
              <Field label="Adicionais">
                <Input value={form.adicionais} onChange={e => { setForm(f => ({ ...f, adicionais: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="R$ 0,00" />
              </Field>
            </div>

            {/* ===== JORNADA DE TRABALHO ===== */}
            <SectionTitle>Jornada de Trabalho</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
              <Field label="Entrada">
                <Input type="time" value={form.jornadaEntrada} onChange={e => { setForm(f => ({ ...f, jornadaEntrada: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Saída">
                <Input type="time" value={form.jornadaSaida} onChange={e => { setForm(f => ({ ...f, jornadaSaida: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Intervalo">
                <Input type="time" value={form.jornadaIntervalo} onChange={e => { setForm(f => ({ ...f, jornadaIntervalo: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Carga Horária (h/sem)">
                <Input value={form.cargaHoraria} onChange={e => { setForm(f => ({ ...f, cargaHoraria: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
            </div>
            <div className="mt-4">
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(d => {
                  const checked = form.jornadaDias.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      disabled={viewMode}
                      onClick={() => toggleDia(d.key)}
                      className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                        checked
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      } ${viewMode ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vale Transporte */}
            <div className="flex items-center gap-3 mt-5">
              <Label className="text-xs font-medium text-muted-foreground">Vale Transporte</Label>
              <button
                type="button"
                disabled={viewMode}
                onClick={() => { setForm(f => ({ ...f, valeTransporte: !f.valeTransporte })); markDirty(); }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  form.valeTransporte
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                } ${viewMode ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
              >
                {form.valeTransporte ? 'Sim' : 'Não'}
              </button>
            </div>

            {/* ===== DADOS BANCÁRIOS ===== */}
            <SectionTitle>Dados Bancários</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Banco">
                <Input value={form.banco} onChange={e => { setForm(f => ({ ...f, banco: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="Ex: Itaú, Bradesco..." />
              </Field>
              <Field label="Agência">
                <Input value={form.agencia} onChange={e => { setForm(f => ({ ...f, agencia: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Conta">
                <Input value={form.conta} onChange={e => { setForm(f => ({ ...f, conta: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
              <Field label="Tipo de Conta">
                <Select value={form.tipoConta} onValueChange={v => { setForm(f => ({ ...f, tipoConta: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Chave PIX" span={2}>
                <Input value={form.chavePix} onChange={e => { setForm(f => ({ ...f, chavePix: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="CPF, e-mail, telefone ou chave aleatória" />
              </Field>
            </div>

            {/* ===== SAÚDE ===== */}
            <SectionTitle>Saúde — ASO Admissional</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-end">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Apto</Label>
                <button
                  type="button"
                  disabled={viewMode}
                  onClick={() => { setForm(f => ({ ...f, asoAdmissionalApto: !f.asoAdmissionalApto })); markDirty(); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    form.asoAdmissionalApto
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  } ${viewMode ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                >
                  {form.asoAdmissionalApto ? 'Sim' : 'Não'}
                </button>
              </div>
              <Field label="Data do Exame">
                <Input type="date" value={form.asoAdmissionalData} onChange={e => { setForm(f => ({ ...f, asoAdmissionalData: e.target.value })); markDirty(); }} disabled={viewMode} />
              </Field>
            </div>

            {/* ===== DEPENDENTES ===== */}
            <SectionTitle>Dependentes</SectionTitle>
            <p className="text-xs text-muted-foreground mb-3">Dependentes para IRRF / Salário-Família</p>

            {form.dependentes.length > 0 && (
              <div className="space-y-2 mb-4">
                {form.dependentes.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Nome</span>
                        <span className="text-sm font-medium">{d.nome}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Parentesco</span>
                        <span className="text-sm">{d.parentesco}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">CPF</span>
                        <span className="text-sm">{d.cpf || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Nascimento</span>
                        <span className="text-sm">{d.dataNascimento || '—'} {d.dataNascimento && <span className="text-muted-foreground">({calcIdade(d.dataNascimento)})</span>}</span>
                      </div>
                    </div>
                    {!viewMode && (
                      <button onClick={() => removeDependente(i)} className="p-1.5 hover:bg-red-50 rounded-md transition-colors shrink-0">
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ===== HISTÓRICO DE STATUS ===== */}
            {editId && (viewMode || showForm) && (
              <>
                <SectionTitle>Histórico de Status</SectionTitle>
                {historicoStatus.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando histórico...
                  </div>
                ) : (historicoStatus.data || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Nenhuma alteração de status registrada.
                  </div>
                ) : (
                  <div className="relative ml-4 border-l-2 border-border/60 space-y-0">
                    {(historicoStatus.data as any[]).slice(0, 10).map((h: any, i: number) => {
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
              </>
            )}

            {!viewMode && (
              <div className="border-2 border-dashed border-border/60 rounded-lg p-5 space-y-4 bg-muted/10">
                <h5 className="text-sm font-semibold text-foreground">Adicionar Dependente</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Nome Completo" required>
                    <Input placeholder="Nome completo do dependente" value={depForm.nome} onChange={e => setDepForm(f => ({ ...f, nome: e.target.value }))} />
                  </Field>
                  <Field label="Parentesco" required>
                    <Select value={depForm.parentesco} onValueChange={v => setDepForm(f => ({ ...f, parentesco: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar parentesco" /></SelectTrigger>
                      <SelectContent>
                        {PARENTESCOS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="CPF">
                    <Input placeholder="000.000.000-00" value={depForm.cpf} onChange={e => setDepForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} />
                  </Field>
                  <Field label="Data de Nascimento">
                    <Input type="date" value={depForm.dataNascimento} onChange={e => setDepForm(f => ({ ...f, dataNascimento: e.target.value }))} />
                    {depForm.dataNascimento && <p className="text-xs text-muted-foreground mt-0.5">{calcIdade(depForm.dataNascimento)}</p>}
                  </Field>
                </div>
                <Button size="sm" variant="outline" onClick={addDependente} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Adicionar Dependente
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={tryCloseForm}>
              {viewMode ? 'Fechar' : 'Cancelar'}
            </Button>
            {viewMode ? (
              <Button onClick={() => setViewMode(false)}><Edit2 className="w-4 h-4 mr-2" /> Editar</Button>
            ) : (
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editId ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
