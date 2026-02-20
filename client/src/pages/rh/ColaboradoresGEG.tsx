import { useState, useMemo, useRef, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Search, User, Edit2, Eye, X, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

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
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

const PARENTESCOS = [
  'Cônjuge', 'Companheiro(a)', 'Filho(a)', 'Enteado(a)',
  'Pai', 'Mãe', 'Irmão(ã)', 'Avô(ó)', 'Neto(a)',
  'Tutelado(a)', 'Menor sob guarda',
];

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
};

export default function ColaboradoresGEG() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [admissaoAlert, setAdmissaoAlert] = useState(false);
  const [exitAlert, setExitAlert] = useState(false);
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [depForm, setDepForm] = useState<Dependente>({ nome: '', cpf: '', dataNascimento: '', parentesco: '' });
  const formDirtyRef = useRef(false);

  const colaboradores = trpc.colaboradores.list.useQuery();
  const setores = trpc.setores.list.useQuery();
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

  // CPF handler
  const handleCpfChange = (raw: string) => {
    const masked = maskCPF(raw);
    setForm(f => ({ ...f, cpf: masked }));
    markDirty();
    const nums = masked.replace(/\D/g, '');
    if (nums.length === 11) {
      setCpfValid(validarCPF(nums));
    } else {
      setCpfValid(null);
    }
  };

  // Phone handler
  const handlePhoneChange = (raw: string) => {
    setForm(f => ({ ...f, telefone: maskPhone(raw) }));
    markDirty();
  };

  // CEP handler
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

  // Jornada dias toggle
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

  const filtered = useMemo(() => {
    const list = (colaboradores.data || []) as any[];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((c: any) =>
      c.nomeCompleto?.toLowerCase().includes(s) || c.cpf?.includes(s) || c.cargo?.toLowerCase().includes(s)
    );
  }, [colaboradores.data, search]);

  const ativos = filtered.filter((c: any) => c.ativo !== false);
  const inativos = filtered.filter((c: any) => c.ativo === false);

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h4 className="font-semibold text-sm text-primary border-b pb-1 mt-6 mb-3">{children}</h4>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground">Cadastro e gestão de colaboradores — Gente & Gestão</p>
        </div>
        <Button onClick={() => { closeFormClean(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Colaborador</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, CPF ou cargo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ativos.map((c: any) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openView(c)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{c.nomeCompleto}</h4>
                    <p className="text-xs text-muted-foreground">{c.cargo}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">{c.tipoContrato?.toUpperCase() || 'CLT'}</Badge>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {c.localTrabalho && <Badge variant="secondary" className="text-[10px]">{c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : 'Uberaba'}</Badge>}
                {c.dataAdmissao && <span className="text-[10px] text-muted-foreground">Admissão: {c.dataAdmissao}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inativos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Inativos ({inativos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {inativos.map((c: any) => (
              <Card key={c.id} className="cursor-pointer" onClick={() => openView(c)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{c.nomeCompleto}</h4>
                      <p className="text-xs text-muted-foreground">{c.cargo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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

      {/* Main Form Dialog — Single scrollable page */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) tryCloseForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {viewMode ? <Eye className="w-5 h-5" /> : editId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {viewMode ? 'Visualizar Colaborador' : editId ? 'Editar Colaborador' : 'Novo Colaborador'}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">

            {/* ===== DADOS PESSOAIS ===== */}
            <SectionTitle>Dados Pessoais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome Completo *</Label>
                <Input value={form.nomeCompleto} onChange={e => { setForm(f => ({ ...f, nomeCompleto: e.target.value })); markDirty(); }} disabled={viewMode} />
              </div>
              <div>
                <Label>CPF *</Label>
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
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={form.dataNascimento} onChange={e => { setForm(f => ({ ...f, dataNascimento: e.target.value })); markDirty(); }} disabled={viewMode} />
              </div>
              <div>
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={v => { setForm(f => ({ ...f, sexo: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado Civil</Label>
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
              </div>
            </div>

            {/* Documentos */}
            <SectionTitle>Documentos</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>RG Número</Label><Input value={form.rgNumero} onChange={e => { setForm(f => ({ ...f, rgNumero: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Órgão Emissor</Label><Input value={form.rgOrgaoEmissor} onChange={e => { setForm(f => ({ ...f, rgOrgaoEmissor: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Data Emissão</Label><Input type="date" value={form.rgDataEmissao} onChange={e => { setForm(f => ({ ...f, rgDataEmissao: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>CTPS (Número/Série)</Label><Input value={form.ctpsNumero} onChange={e => { setForm(f => ({ ...f, ctpsNumero: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>PIS/PASEP</Label><Input value={form.pisPasep} onChange={e => { setForm(f => ({ ...f, pisPasep: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Título de Eleitor</Label><Input value={form.tituloEleitor} onChange={e => { setForm(f => ({ ...f, tituloEleitor: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Certificado Reservista</Label><Input value={form.certificadoReservista} onChange={e => { setForm(f => ({ ...f, certificadoReservista: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
            </div>

            {/* Filiação */}
            <SectionTitle>Filiação</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome da Mãe</Label><Input value={form.nomeMae} onChange={e => { setForm(f => ({ ...f, nomeMae: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Nome do Pai</Label><Input value={form.nomePai} onChange={e => { setForm(f => ({ ...f, nomePai: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Nacionalidade</Label><Input value={form.nacionalidade} onChange={e => { setForm(f => ({ ...f, nacionalidade: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Naturalidade</Label><Input value={form.naturalidade} onChange={e => { setForm(f => ({ ...f, naturalidade: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="Cidade/Estado" /></div>
            </div>

            {/* Endereço */}
            <SectionTitle>Endereço</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>CEP</Label>
                <div className="relative">
                  <Input value={form.cep} onChange={e => handleCepChange(e.target.value)} disabled={viewMode} placeholder="00000-000" />
                  {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div className="md:col-span-2"><Label>Logradouro</Label><Input value={form.logradouro} onChange={e => { setForm(f => ({ ...f, logradouro: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Número</Label><Input value={form.numero} onChange={e => { setForm(f => ({ ...f, numero: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Complemento</Label><Input value={form.complemento} onChange={e => { setForm(f => ({ ...f, complemento: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Bairro</Label><Input value={form.bairro} onChange={e => { setForm(f => ({ ...f, bairro: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => { setForm(f => ({ ...f, cidade: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Estado</Label><Input value={form.estado} onChange={e => { setForm(f => ({ ...f, estado: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
            </div>

            {/* Contato */}
            <SectionTitle>Contato</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => handlePhoneChange(e.target.value)} disabled={viewMode} placeholder="(00) 00000-0000" />
              </div>
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
            </div>

            {/* ===== DADOS PROFISSIONAIS ===== */}
            <SectionTitle>Dados Profissionais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data de Admissão *</Label>
                <Input type="date" value={form.dataAdmissao} onChange={e => { setForm(f => ({ ...f, dataAdmissao: e.target.value })); markDirty(); }} disabled={viewMode} />
              </div>
              <div>
                <Label>Tipo de Contrato</Label>
                <Select value={form.tipoContrato} onValueChange={v => { setForm(f => ({ ...f, tipoContrato: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="contrato_trabalho">Contrato de Trabalho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Cargo *</Label><Input value={form.cargo} onChange={e => { setForm(f => ({ ...f, cargo: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Função</Label><Input value={form.funcao} onChange={e => { setForm(f => ({ ...f, funcao: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div>
                <Label>Nível Hierárquico</Label>
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
              </div>
              <div>
                <Label>Setor</Label>
                <Select value={form.setorId ? String(form.setorId) : ''} onValueChange={v => { setForm(f => ({ ...f, setorId: Number(v) })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {((setores.data || []) as any[]).filter((s: any) => s.ativo).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Remuneração */}
            <SectionTitle>Remuneração</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Salário Base *</Label><Input value={form.salarioBase} onChange={e => { setForm(f => ({ ...f, salarioBase: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="R$" /></div>
              <div><Label>Comissões</Label><Input value={form.comissoes} onChange={e => { setForm(f => ({ ...f, comissoes: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="R$" /></div>
              <div><Label>Adicionais</Label><Input value={form.adicionais} onChange={e => { setForm(f => ({ ...f, adicionais: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="R$" /></div>
            </div>

            {/* Jornada de Trabalho */}
            <SectionTitle>Jornada de Trabalho</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><Label>Entrada</Label><Input type="time" value={form.jornadaEntrada} onChange={e => { setForm(f => ({ ...f, jornadaEntrada: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Saída</Label><Input type="time" value={form.jornadaSaida} onChange={e => { setForm(f => ({ ...f, jornadaSaida: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Intervalo</Label><Input type="time" value={form.jornadaIntervalo} onChange={e => { setForm(f => ({ ...f, jornadaIntervalo: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Carga Horária (h/sem)</Label><Input value={form.cargaHoraria} onChange={e => { setForm(f => ({ ...f, cargaHoraria: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
            </div>
            <div className="mt-3">
              <Label className="mb-2 block">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(d => {
                  const checked = form.jornadaDias.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      disabled={viewMode}
                      onClick={() => toggleDia(d.key)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <Label>Período de Experiência (dias)</Label>
                <Input type="number" value={form.periodoExperiencia} onChange={e => { setForm(f => ({ ...f, periodoExperiencia: Number(e.target.value) })); markDirty(); }} disabled={viewMode} />
              </div>
              <div>
                <Label>Local de Trabalho</Label>
                <Select value={form.localTrabalho} onValueChange={v => { setForm(f => ({ ...f, localTrabalho: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home_office">Home Office</SelectItem>
                    <SelectItem value="barueri">Unidade Barueri</SelectItem>
                    <SelectItem value="uberaba">Unidade Uberaba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vale Transporte */}
            <div className="flex items-center gap-3 mt-4">
              <Label className="text-sm">Vale Transporte</Label>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><Label>Banco</Label><Input value={form.banco} onChange={e => { setForm(f => ({ ...f, banco: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Agência</Label><Input value={form.agencia} onChange={e => { setForm(f => ({ ...f, agencia: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div><Label>Conta</Label><Input value={form.conta} onChange={e => { setForm(f => ({ ...f, conta: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
              <div>
                <Label>Tipo de Conta</Label>
                <Select value={form.tipoConta} onValueChange={v => { setForm(f => ({ ...f, tipoConta: v })); markDirty(); }} disabled={viewMode}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Chave PIX</Label><Input value={form.chavePix} onChange={e => { setForm(f => ({ ...f, chavePix: e.target.value })); markDirty(); }} disabled={viewMode} placeholder="CPF, e-mail, telefone ou chave aleatória" /></div>
            </div>

            {/* ===== SAÚDE ===== */}
            <SectionTitle>Saúde — ASO Admissional</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <Label className="mb-2 block">Apto</Label>
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
              <div><Label>Data do Exame</Label><Input type="date" value={form.asoAdmissionalData} onChange={e => { setForm(f => ({ ...f, asoAdmissionalData: e.target.value })); markDirty(); }} disabled={viewMode} /></div>
            </div>

            {/* ===== DEPENDENTES ===== */}
            <SectionTitle>Dependentes</SectionTitle>
            <p className="text-xs text-muted-foreground mb-2">Dependentes para IRRF / Salário-Família</p>
            {form.dependentes.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.dependentes.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <span className="font-medium">{d.nome}</span>
                      <span>{d.parentesco}</span>
                      <span>{d.cpf}</span>
                      <span>{d.dataNascimento}</span>
                      <span className="text-muted-foreground">{calcIdade(d.dataNascimento)}</span>
                    </div>
                    {!viewMode && (
                      <button onClick={() => removeDependente(i)} className="p-1 hover:bg-muted rounded">
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!viewMode && (
              <div className="border rounded-lg p-4 space-y-3">
                <h5 className="text-sm font-medium">Adicionar Dependente</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Nome Completo *</Label>
                    <Input placeholder="Nome completo" value={depForm.nome} onChange={e => setDepForm(f => ({ ...f, nome: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Parentesco *</Label>
                    <Select value={depForm.parentesco} onValueChange={v => setDepForm(f => ({ ...f, parentesco: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        {PARENTESCOS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">CPF</Label>
                    <Input placeholder="000.000.000-00" value={depForm.cpf} onChange={e => setDepForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Data de Nascimento</Label>
                    <Input type="date" value={depForm.dataNascimento} onChange={e => setDepForm(f => ({ ...f, dataNascimento: e.target.value }))} />
                    {depForm.dataNascimento && <p className="text-xs text-muted-foreground mt-1">{calcIdade(depForm.dataNascimento)}</p>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={addDependente}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
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
