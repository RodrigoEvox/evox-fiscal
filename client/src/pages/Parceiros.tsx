import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Handshake, Plus, Search, Edit, Loader2, Phone, Mail, MapPin, MoreVertical,
  Power, PowerOff, Trash2, Eye, Building2, User, Diamond, Award, Medal, Filter,
  CreditCard, Users, ChevronDown, AlertCircle, CheckCircle2, Landmark, KeyRound
} from 'lucide-react';

// ---- Helpers ----
const MODELO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  diamante: { label: 'Diamante', icon: Diamond, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ouro: { label: 'Ouro', icon: Award, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  prata: { label: 'Prata', icon: Medal, color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function maskCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) => e ? `${a}.${b}.${c}-${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
}

function maskCnpj(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, e, f) => f ? `${a}.${b}.${c}/${e}-${f}` : e ? `${a}.${b}.${c}/${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
}

function maskTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : '');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : '');
}

function maskCep(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, (_, a, b) => b ? `${a}-${b}` : a);
}

function validarCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(d[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(d[10]);
}

const EMPTY_FORM = {
  tipoPessoa: 'pj' as 'pf' | 'pj',
  apelido: '',
  // PF
  nomeCompleto: '',
  cpf: '',
  rg: '',
  // PJ
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  situacaoCadastral: '',
  quadroSocietario: [] as { nome: string; qualificacao: string; faixaEtaria?: string }[],
  // Sócio responsável
  socioNome: '',
  socioCpf: '',
  socioRg: '',
  socioEmail: '',
  socioTelefone: '',
  // Contato
  telefone: '',
  email: '',
  // Endereço
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  // Bancário
  banco: '',
  agencia: '',
  conta: '',
  tipoConta: '' as string,
  titularConta: '',
  cpfCnpjConta: '',
  chavePix: '',
  tipoChavePix: '' as string,
  // Parceria
  modeloParceriaId: null as number | null,
  ehSubparceiro: false,
  parceiroPaiId: null as number | null,
  percentualRepasseSubparceiro: '',
  observacoes: '',
  ativo: true,
  // Serviços
  servicoIds: [] as number[],
};

const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function Parceiros() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewParceiro, setViewParceiro] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formTab, setFormTab] = useState('dados');
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cpfErrors, setCpfErrors] = useState<Record<string, string>>({});
  const utils = trpc.useUtils();

  const { data: parceiros = [], isLoading } = trpc.parceiros.list.useQuery();
  const { data: modelos = [] } = trpc.modelosParceria.list.useQuery();
  const { data: servicos = [] } = trpc.servicos.list.useQuery();
  const { data: parceirosPrincipais = [] } = trpc.parceiros.listPrincipais.useQuery();

  const createMutation = trpc.parceiros.create.useMutation({
    onSuccess: () => { utils.parceiros.list.invalidate(); utils.parceiros.listPrincipais.invalidate(); closeForm(); toast.success('Parceiro cadastrado com sucesso!'); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.parceiros.update.useMutation({
    onSuccess: () => { utils.parceiros.list.invalidate(); utils.parceiros.listPrincipais.invalidate(); closeForm(); toast.success('Parceiro atualizado com sucesso!'); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.parceiros.delete.useMutation({
    onSuccess: () => { utils.parceiros.list.invalidate(); utils.parceiros.listPrincipais.invalidate(); setConfirmDelete(null); toast.success('Parceiro excluído!'); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.parceiros.toggleActive.useMutation({
    onSuccess: (_, vars) => { utils.parceiros.list.invalidate(); toast.success(vars.ativo ? 'Parceiro ativado!' : 'Parceiro inativado!'); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return (parceiros as any[]).filter((p: any) => {
      if (filterStatus === 'ativos' && !p.ativo) return false;
      if (filterStatus === 'inativos' && p.ativo) return false;
      if (search) {
        const s = search.toLowerCase();
        return (p.apelido || '').toLowerCase().includes(s) ||
          (p.nomeCompleto || '').toLowerCase().includes(s) ||
          (p.razaoSocial || '').toLowerCase().includes(s) ||
          (p.cpf || '').includes(search) ||
          (p.cnpj || '').includes(search) ||
          (p.email || '').toLowerCase().includes(s);
      }
      return true;
    });
  }, [parceiros, filterStatus, search]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormTab('dados');
    setCpfErrors({});
  };

  const openEdit = (p: any) => {
    setForm({
      tipoPessoa: p.tipoPessoa || 'pj',
      apelido: p.apelido || '',
      nomeCompleto: p.nomeCompleto || '',
      cpf: p.cpf || '',
      rg: p.rg || '',
      cnpj: p.cnpj || '',
      razaoSocial: p.razaoSocial || '',
      nomeFantasia: p.nomeFantasia || '',
      situacaoCadastral: p.situacaoCadastral || '',
      quadroSocietario: p.quadroSocietario || [],
      socioNome: p.socioNome || '',
      socioCpf: p.socioCpf || '',
      socioRg: p.socioRg || '',
      socioEmail: p.socioEmail || '',
      socioTelefone: p.socioTelefone || '',
      telefone: p.telefone || '',
      email: p.email || '',
      cep: p.cep || '',
      logradouro: p.logradouro || '',
      numero: p.numero || '',
      complemento: p.complemento || '',
      bairro: p.bairro || '',
      cidade: p.cidade || '',
      estado: p.estado || '',
      banco: p.banco || '',
      agencia: p.agencia || '',
      conta: p.conta || '',
      tipoConta: p.tipoConta || '',
      titularConta: p.titularConta || '',
      cpfCnpjConta: p.cpfCnpjConta || '',
      chavePix: p.chavePix || '',
      tipoChavePix: p.tipoChavePix || '',
      modeloParceriaId: p.modeloParceriaId || null,
      ehSubparceiro: p.ehSubparceiro || false,
      parceiroPaiId: p.parceiroPaiId || null,
      percentualRepasseSubparceiro: p.percentualRepasseSubparceiro || '',
      observacoes: p.observacoes || '',
      ativo: p.ativo !== false,
      servicoIds: [],
    });
    setEditingId(p.id);
    setShowForm(true);
    // Load existing services for this partner
    // We'll fetch them when the form opens
  };

  // Consulta CNPJ
  const handleConsultaCNPJ = async () => {
    const cnpjLimpo = form.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) { toast.error('CNPJ deve ter 14 dígitos'); return; }
    setCnpjLoading(true);
    try {
      const data = await (utils as any).client.parceiros.consultaCNPJ.query({ cnpj: cnpjLimpo });
      if (data) {
        const qsa = (data as any).qsa || [];
        setForm(f => ({
          ...f,
          razaoSocial: (data as any).razao_social || '',
          nomeFantasia: (data as any).nome_fantasia || '',
          situacaoCadastral: (data as any).descricao_situacao_cadastral || '',
          logradouro: (data as any).logradouro || '',
          numero: (data as any).numero || '',
          complemento: (data as any).complemento || '',
          bairro: (data as any).bairro || '',
          cidade: (data as any).municipio || '',
          estado: (data as any).uf || '',
          cep: (data as any).cep ? maskCep((data as any).cep) : '',
          quadroSocietario: qsa.map((s: any) => ({
            nome: s.nome_socio || '',
            qualificacao: s.qualificacao_socio || '',
            faixaEtaria: s.faixa_etaria || '',
          })),
        }));
        toast.success('Dados do CNPJ carregados com sucesso!');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao consultar CNPJ');
    } finally {
      setCnpjLoading(false);
    }
  };

  // Validação CPF
  const handleCpfBlur = (field: string, value: string) => {
    const d = value.replace(/\D/g, '');
    if (d.length === 0) {
      setCpfErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
      return;
    }
    if (d.length === 11 && validarCpf(d)) {
      setCpfErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    } else if (d.length > 0) {
      setCpfErrors(prev => ({ ...prev, [field]: 'CPF inválido' }));
    }
  };

  const handleSave = () => {
    if (!form.apelido.trim()) { toast.error('Preencha o Apelido (nome de exibição)'); return; }
    if (form.tipoPessoa === 'pf') {
      if (!form.nomeCompleto.trim()) { toast.error('Preencha o nome completo'); return; }
      if (form.cpf && !validarCpf(form.cpf.replace(/\D/g, ''))) { toast.error('CPF do parceiro é inválido'); return; }
    } else {
      if (!form.cnpj || form.cnpj.replace(/\D/g, '').length < 14) { toast.error('Preencha o CNPJ'); return; }
      if (!form.razaoSocial?.trim() && !form.nomeCompleto.trim()) { toast.error('Preencha a Razão Social ou Nome'); return; }
    }
    if (form.socioCpf && !validarCpf(form.socioCpf.replace(/\D/g, ''))) { toast.error('CPF do sócio responsável é inválido'); return; }
    if (form.ehSubparceiro && !form.parceiroPaiId) { toast.error('Selecione o parceiro principal'); return; }

    const payload: any = {
      ...form,
      nomeCompleto: form.tipoPessoa === 'pj' ? (form.razaoSocial || form.nomeCompleto) : form.nomeCompleto,
      modeloParceriaId: form.modeloParceriaId || null,
      parceiroPaiId: form.ehSubparceiro ? form.parceiroPaiId : null,
      tipoConta: form.tipoConta || undefined,
      tipoChavePix: form.tipoChavePix || undefined,
    };
    // Clean empty strings
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') payload[key] = undefined;
    }
    payload.tipoPessoa = form.tipoPessoa;
    payload.ehSubparceiro = form.ehSubparceiro;
    payload.ativo = form.ativo;
    payload.servicoIds = form.servicoIds;

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getModeloInfo = (modeloId: number | null) => {
    if (!modeloId) return null;
    const m = (modelos as any[]).find((m: any) => m.id === modeloId);
    if (!m) return null;
    const key = m.nome.toLowerCase();
    return MODELO_LABELS[key] || { label: m.nome, icon: Award, color: 'bg-gray-100 text-gray-700' };
  };

  const getParceiroNome = (id: number | null) => {
    if (!id) return null;
    const p = (parceiros as any[]).find((p: any) => p.id === id);
    return p ? (p.apelido || p.nomeCompleto) : null;
  };

  const stats = {
    total: (parceiros as any[]).length,
    ativos: (parceiros as any[]).filter((p: any) => p.ativo).length,
    inativos: (parceiros as any[]).filter((p: any) => !p.ativo).length,
    subparceiros: (parceiros as any[]).filter((p: any) => p.ehSubparceiro).length,
  };

  const displayName = (p: any) => p.apelido || p.nomeCompleto || p.razaoSocial || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Handshake className="w-6 h-6 text-[#0A2540]" /> Parceiros Comerciais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} parceiros • {stats.ativos} ativos • {stats.subparceiros} subparceiros
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); setFormTab('dados'); setShowForm(true); }} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
            <Plus className="w-4 h-4 mr-2" /> Novo Parceiro
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, apelido, documento ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {search || filterStatus !== 'todos' ? 'Nenhum parceiro encontrado com os filtros aplicados.' : 'Nenhum parceiro cadastrado. Clique em "Novo Parceiro" para começar.'}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: any) => {
            const modeloInfo = getModeloInfo(p.modeloParceriaId);
            const parceiroPaiNome = getParceiroNome(p.parceiroPaiId);
            return (
              <Card key={p.id} className={`hover:shadow-md transition-all cursor-pointer group ${!p.ativo ? 'opacity-60' : ''}`}
                onClick={() => setViewParceiro(p)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.ativo ? 'bg-[#0A2540]/10' : 'bg-gray-200'}`}>
                      {p.tipoPessoa === 'pf' ? <User className="w-5 h-5 text-[#0A2540]" /> : <Building2 className="w-5 h-5 text-[#0A2540]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm truncate">{displayName(p)}</h3>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={e => e.stopPropagation()}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewParceiro(p); }}>
                                <Eye className="w-4 h-4 mr-2" /> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                                <Edit className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleMutation.mutate({ id: p.id, ativo: !p.ativo }); }}>
                                {p.ativo ? <><PowerOff className="w-4 h-4 mr-2" /> Inativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}>
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {p.apelido && p.nomeCompleto && p.apelido !== p.nomeCompleto && (
                        <p className="text-xs text-muted-foreground truncate">{p.tipoPessoa === 'pj' ? (p.razaoSocial || p.nomeCompleto) : p.nomeCompleto}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant={p.ativo ? 'default' : 'secondary'} className={`text-[10px] ${p.ativo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {p.tipoPessoa === 'pf' ? 'PF' : 'PJ'}
                        </Badge>
                        {p.ehSubparceiro && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Subparceiro
                          </Badge>
                        )}
                        {modeloInfo && (
                          <Badge variant="outline" className={`text-[10px] ${modeloInfo.color}`}>
                            {modeloInfo.label}
                          </Badge>
                        )}
                      </div>
                      {parceiroPaiNome && (
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" /> Vinculado a: {parceiroPaiNome}
                        </p>
                      )}
                      {p.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {p.email}</p>}
                      {p.telefone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {p.telefone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== VIEW DIALOG ===== */}
      <Dialog open={!!viewParceiro} onOpenChange={() => setViewParceiro(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewParceiro && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-[#0A2540]" /> {displayName(viewParceiro)}
                </DialogTitle>
                <DialogDescription>Detalhes do parceiro comercial</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">Dados</TabsTrigger>
                  <TabsTrigger value="endereco" className="flex-1">Endereço</TabsTrigger>
                  <TabsTrigger value="bancario" className="flex-1">Bancário</TabsTrigger>
                  <TabsTrigger value="parceria" className="flex-1">Parceria</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Apelido</Label><p className="text-sm font-medium">{viewParceiro.apelido || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Tipo</Label><p className="text-sm font-medium">{viewParceiro.tipoPessoa === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p></div>
                    {viewParceiro.tipoPessoa === 'pf' ? (
                      <>
                        <div><Label className="text-xs text-muted-foreground">Nome Completo</Label><p className="text-sm">{viewParceiro.nomeCompleto || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">CPF</Label><p className="text-sm">{viewParceiro.cpf || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">RG</Label><p className="text-sm">{viewParceiro.rg || 'N/A'}</p></div>
                      </>
                    ) : (
                      <>
                        <div><Label className="text-xs text-muted-foreground">CNPJ</Label><p className="text-sm">{viewParceiro.cnpj || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Razão Social</Label><p className="text-sm">{viewParceiro.razaoSocial || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Nome Fantasia</Label><p className="text-sm">{viewParceiro.nomeFantasia || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Situação Cadastral</Label><p className="text-sm">{viewParceiro.situacaoCadastral || 'N/A'}</p></div>
                      </>
                    )}
                    <div><Label className="text-xs text-muted-foreground">E-mail</Label><p className="text-sm">{viewParceiro.email || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Telefone</Label><p className="text-sm">{viewParceiro.telefone || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Status</Label><Badge variant={viewParceiro.ativo ? 'default' : 'secondary'} className={viewParceiro.ativo ? 'bg-green-100 text-green-700' : ''}>{viewParceiro.ativo ? 'Ativo' : 'Inativo'}</Badge></div>
                  </div>
                  {viewParceiro.tipoPessoa === 'pj' && viewParceiro.quadroSocietario && viewParceiro.quadroSocietario.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Quadro Societário</Label>
                      <div className="space-y-1">
                        {viewParceiro.quadroSocietario.map((s: any, i: number) => (
                          <div key={i} className="text-xs p-2 bg-muted/50 rounded flex justify-between">
                            <span className="font-medium">{s.nome}</span>
                            <span className="text-muted-foreground">{s.qualificacao}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewParceiro.tipoPessoa === 'pj' && viewParceiro.socioNome && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Sócio Responsável pela Parceria</Label>
                      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                        <div><Label className="text-xs text-muted-foreground">Nome</Label><p className="text-sm">{viewParceiro.socioNome}</p></div>
                        <div><Label className="text-xs text-muted-foreground">CPF</Label><p className="text-sm">{viewParceiro.socioCpf || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">E-mail</Label><p className="text-sm">{viewParceiro.socioEmail || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Telefone</Label><p className="text-sm">{viewParceiro.socioTelefone || 'N/A'}</p></div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="endereco" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">CEP</Label><p className="text-sm">{viewParceiro.cep || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Logradouro</Label><p className="text-sm">{viewParceiro.logradouro || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Número</Label><p className="text-sm">{viewParceiro.numero || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Complemento</Label><p className="text-sm">{viewParceiro.complemento || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Bairro</Label><p className="text-sm">{viewParceiro.bairro || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Cidade</Label><p className="text-sm">{viewParceiro.cidade || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">UF</Label><p className="text-sm">{viewParceiro.estado || 'N/A'}</p></div>
                  </div>
                </TabsContent>
                <TabsContent value="bancario" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Banco</Label><p className="text-sm">{viewParceiro.banco || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Agência</Label><p className="text-sm">{viewParceiro.agencia || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Conta</Label><p className="text-sm">{viewParceiro.conta || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Tipo de Conta</Label><p className="text-sm">{viewParceiro.tipoConta === 'corrente' ? 'Corrente' : viewParceiro.tipoConta === 'poupanca' ? 'Poupança' : 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Titular</Label><p className="text-sm">{viewParceiro.titularConta || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">CPF/CNPJ da Conta</Label><p className="text-sm">{viewParceiro.cpfCnpjConta || 'N/A'}</p></div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Chave PIX</Label><p className="text-sm">{viewParceiro.chavePix || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Tipo da Chave</Label><p className="text-sm capitalize">{viewParceiro.tipoChavePix || 'N/A'}</p></div>
                  </div>
                </TabsContent>
                <TabsContent value="parceria" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {(() => { const mi = getModeloInfo(viewParceiro.modeloParceriaId); return mi ? <div><Label className="text-xs text-muted-foreground">Modelo de Parceria</Label><Badge variant="outline" className={mi.color}>{mi.label}</Badge></div> : null; })()}
                    <div>
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <p className="text-sm font-medium">{viewParceiro.ehSubparceiro ? 'Subparceiro' : 'Parceiro Principal'}</p>
                    </div>
                    {viewParceiro.ehSubparceiro && viewParceiro.parceiroPaiId && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Vinculado ao Parceiro</Label>
                        <p className="text-sm font-medium text-blue-700">{getParceiroNome(viewParceiro.parceiroPaiId) || 'N/A'}</p>
                      </div>
                    )}
                    {viewParceiro.percentualRepasseSubparceiro && (
                      <div><Label className="text-xs text-muted-foreground">% Repasse Subparceiro</Label><p className="text-sm">{viewParceiro.percentualRepasseSubparceiro}%</p></div>
                    )}
                  </div>
                  {viewParceiro.observacoes && (
                    <div><Label className="text-xs text-muted-foreground">Observações</Label><p className="text-sm">{viewParceiro.observacoes}</p></div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>Cadastrado em: {viewParceiro.createdAt ? new Date(viewParceiro.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                    <div>Atualizado em: {viewParceiro.updatedAt ? new Date(viewParceiro.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                {isAdmin && (
                  <>
                    <Button variant="outline" onClick={() => { setViewParceiro(null); openEdit(viewParceiro); }}>
                      <Edit className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button variant={viewParceiro.ativo ? 'destructive' : 'default'} onClick={() => { toggleMutation.mutate({ id: viewParceiro.id, ativo: !viewParceiro.ativo }); setViewParceiro(null); }}>
                      {viewParceiro.ativo ? <><PowerOff className="w-4 h-4 mr-2" /> Inativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CREATE/EDIT DIALOG ===== */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
            <DialogDescription>{editingId ? 'Altere os dados do parceiro.' : 'Preencha os dados para cadastrar um novo parceiro.'}</DialogDescription>
          </DialogHeader>

          <Tabs value={formTab} onValueChange={setFormTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="dados" className="flex-1 text-xs">
                <User className="w-3 h-3 mr-1" /> Dados
              </TabsTrigger>
              <TabsTrigger value="endereco" className="flex-1 text-xs">
                <MapPin className="w-3 h-3 mr-1" /> Endereço
              </TabsTrigger>
              <TabsTrigger value="bancario" className="flex-1 text-xs">
                <Landmark className="w-3 h-3 mr-1" /> Bancário
              </TabsTrigger>
              <TabsTrigger value="servicos" className="flex-1 text-xs">
                <CreditCard className="w-3 h-3 mr-1" /> Serviços
              </TabsTrigger>
              <TabsTrigger value="parceria" className="flex-1 text-xs">
                <Handshake className="w-3 h-3 mr-1" /> Parceria
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-2 pr-4">
              {/* ---- TAB DADOS ---- */}
              <TabsContent value="dados" className="space-y-5 mt-0">
                {/* Tipo de Pessoa */}
                <div>
                  <Label className="text-xs font-semibold">Tipo de Pessoa *</Label>
                  <div className="flex gap-3 mt-2">
                    <Button type="button" variant={form.tipoPessoa === 'pf' ? 'default' : 'outline'}
                      className={form.tipoPessoa === 'pf' ? 'bg-[#0A2540]' : ''}
                      onClick={() => setForm(f => ({ ...f, tipoPessoa: 'pf' }))}>
                      <User className="w-4 h-4 mr-2" /> Pessoa Física
                    </Button>
                    <Button type="button" variant={form.tipoPessoa === 'pj' ? 'default' : 'outline'}
                      className={form.tipoPessoa === 'pj' ? 'bg-[#0A2540]' : ''}
                      onClick={() => setForm(f => ({ ...f, tipoPessoa: 'pj' }))}>
                      <Building2 className="w-4 h-4 mr-2" /> Pessoa Jurídica
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Apelido */}
                <div>
                  <Label className="text-xs">Apelido (Nome de Exibição) *</Label>
                  <Input value={form.apelido} onChange={e => setForm(f => ({ ...f, apelido: e.target.value }))} placeholder="Nome que será exibido no sistema" />
                  <p className="text-[10px] text-muted-foreground mt-1">Este será o nome principal exibido em todas as telas do sistema.</p>
                </div>

                <Separator />

                {form.tipoPessoa === 'pf' ? (
                  /* ---- PF ---- */
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Dados Pessoais</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Nome Completo *</Label>
                        <Input value={form.nomeCompleto} onChange={e => setForm(f => ({ ...f, nomeCompleto: e.target.value }))} placeholder="Nome completo do parceiro" />
                      </div>
                      <div>
                        <Label className="text-xs">CPF</Label>
                        <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: maskCpf(e.target.value) }))}
                          onBlur={() => handleCpfBlur('cpf', form.cpf)}
                          placeholder="000.000.000-00" maxLength={14}
                          className={cpfErrors.cpf ? 'border-red-500' : ''} />
                        {cpfErrors.cpf && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> {cpfErrors.cpf}</p>}
                        {form.cpf && !cpfErrors.cpf && form.cpf.replace(/\D/g, '').length === 11 && <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> CPF válido</p>}
                      </div>
                      <div>
                        <Label className="text-xs">RG</Label>
                        <Input value={form.rg} onChange={e => setForm(f => ({ ...f, rg: e.target.value }))} placeholder="RG" />
                      </div>
                      <div>
                        <Label className="text-xs">E-mail</Label>
                        <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@parceiro.com" />
                      </div>
                      <div>
                        <Label className="text-xs">Telefone</Label>
                        <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ---- PJ ---- */
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Dados da Empresa</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">CNPJ *</Label>
                          <div className="flex gap-2">
                            <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: maskCnpj(e.target.value) }))} placeholder="00.000.000/0000-00" maxLength={18} className="flex-1" />
                            <Button type="button" variant="outline" onClick={handleConsultaCNPJ} disabled={cnpjLoading} className="shrink-0">
                              {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                              <span className="ml-1 text-xs">Consultar</span>
                            </Button>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Razão Social</Label>
                          <Input value={form.razaoSocial} onChange={e => setForm(f => ({ ...f, razaoSocial: e.target.value }))} placeholder="Razão social da empresa" />
                        </div>
                        <div>
                          <Label className="text-xs">Nome Fantasia</Label>
                          <Input value={form.nomeFantasia} onChange={e => setForm(f => ({ ...f, nomeFantasia: e.target.value }))} placeholder="Nome fantasia" />
                        </div>
                        <div>
                          <Label className="text-xs">Situação Cadastral</Label>
                          <Input value={form.situacaoCadastral} readOnly className="bg-muted/50" />
                        </div>
                        <div>
                          <Label className="text-xs">E-mail</Label>
                          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
                        </div>
                        <div>
                          <Label className="text-xs">Telefone</Label>
                          <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} />
                        </div>
                      </div>
                    </div>

                    {/* Quadro Societário */}
                    {form.quadroSocietario.length > 0 && (
                      <div>
                        <Label className="text-xs font-semibold mb-2 block">Quadro Societário (da Receita Federal)</Label>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {form.quadroSocietario.map((s, i) => (
                            <div key={i} className="text-xs p-2 bg-muted/50 rounded flex justify-between">
                              <span className="font-medium">{s.nome}</span>
                              <span className="text-muted-foreground">{s.qualificacao}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Sócio Responsável */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Sócio Responsável pela Parceria</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Nome Completo do Sócio</Label>
                          <Input value={form.socioNome} onChange={e => setForm(f => ({ ...f, socioNome: e.target.value }))} placeholder="Nome do sócio responsável" />
                        </div>
                        <div>
                          <Label className="text-xs">CPF do Sócio</Label>
                          <Input value={form.socioCpf} onChange={e => setForm(f => ({ ...f, socioCpf: maskCpf(e.target.value) }))}
                            onBlur={() => handleCpfBlur('socioCpf', form.socioCpf)}
                            placeholder="000.000.000-00" maxLength={14}
                            className={cpfErrors.socioCpf ? 'border-red-500' : ''} />
                          {cpfErrors.socioCpf && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> {cpfErrors.socioCpf}</p>}
                          {form.socioCpf && !cpfErrors.socioCpf && form.socioCpf.replace(/\D/g, '').length === 11 && <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> CPF válido</p>}
                        </div>
                        <div>
                          <Label className="text-xs">RG do Sócio</Label>
                          <Input value={form.socioRg} onChange={e => setForm(f => ({ ...f, socioRg: e.target.value }))} placeholder="RG" />
                        </div>
                        <div>
                          <Label className="text-xs">E-mail do Sócio</Label>
                          <Input type="email" value={form.socioEmail} onChange={e => setForm(f => ({ ...f, socioEmail: e.target.value }))} placeholder="email@socio.com" />
                        </div>
                        <div>
                          <Label className="text-xs">Telefone do Sócio</Label>
                          <Input value={form.socioTelefone} onChange={e => setForm(f => ({ ...f, socioTelefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ---- TAB ENDEREÇO ---- */}
              <TabsContent value="endereco" className="space-y-5 mt-0">
                <h3 className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço Completo</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">CEP</Label>
                    <Input value={form.cep} onChange={e => setForm(f => ({ ...f, cep: maskCep(e.target.value) }))} placeholder="00000-000" maxLength={9} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Logradouro</Label>
                    <Input value={form.logradouro} onChange={e => setForm(f => ({ ...f, logradouro: e.target.value }))} placeholder="Rua, Avenida, etc." />
                  </div>
                  <div>
                    <Label className="text-xs">Número</Label>
                    <Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="Nº" />
                  </div>
                  <div>
                    <Label className="text-xs">Complemento</Label>
                    <Input value={form.complemento} onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))} placeholder="Sala, Andar, Bloco..." />
                  </div>
                  <div>
                    <Label className="text-xs">Bairro</Label>
                    <Input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} placeholder="Bairro" />
                  </div>
                  <div>
                    <Label className="text-xs">Cidade</Label>
                    <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Cidade" />
                  </div>
                  <div>
                    <Label className="text-xs">UF</Label>
                    <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* ---- TAB BANCÁRIO ---- */}
              <TabsContent value="bancario" className="space-y-5 mt-0">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Landmark className="w-4 h-4" /> Dados Bancários para Comissões</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Banco</Label>
                    <Input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} placeholder="Ex: Banco do Brasil, Itaú..." />
                  </div>
                  <div>
                    <Label className="text-xs">Agência</Label>
                    <Input value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))} placeholder="0000" />
                  </div>
                  <div>
                    <Label className="text-xs">Conta</Label>
                    <Input value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))} placeholder="00000-0" />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de Conta</Label>
                    <Select value={form.tipoConta} onValueChange={v => setForm(f => ({ ...f, tipoConta: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Corrente</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Titular da Conta</Label>
                    <Input value={form.titularConta} onChange={e => setForm(f => ({ ...f, titularConta: e.target.value }))} placeholder="Nome do titular" />
                  </div>
                  <div>
                    <Label className="text-xs">CPF/CNPJ da Conta</Label>
                    <Input value={form.cpfCnpjConta} onChange={e => setForm(f => ({ ...f, cpfCnpjConta: e.target.value }))} placeholder="Documento do titular" />
                  </div>
                </div>

                <Separator />

                <h3 className="text-sm font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4" /> Chave PIX</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tipo da Chave PIX</Label>
                    <Select value={form.tipoChavePix} onValueChange={v => setForm(f => ({ ...f, tipoChavePix: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Chave PIX</Label>
                    <Input value={form.chavePix} onChange={e => setForm(f => ({ ...f, chavePix: e.target.value }))} placeholder="Informe a chave PIX" />
                  </div>
                </div>
              </TabsContent>

              {/* ---- TAB SERVIÇOS ---- */}
              <TabsContent value="servicos" className="space-y-5 mt-0">
                <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" /> Serviços que o Parceiro Trabalha</h3>
                <p className="text-xs text-muted-foreground">Selecione os serviços que este parceiro está autorizado a trabalhar com a Evox.</p>
                {(servicos as any[]).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum serviço cadastrado no sistema.</p>
                ) : (
                  <div className="space-y-2">
                    {(servicos as any[]).filter((s: any) => s.ativo !== false).map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <Checkbox
                          checked={form.servicoIds.includes(s.id)}
                          onCheckedChange={(checked) => {
                            setForm(f => ({
                              ...f,
                              servicoIds: checked
                                ? [...f.servicoIds, s.id]
                                : f.servicoIds.filter(id => id !== s.id),
                            }));
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{s.nome}</p>
                          {s.descricao && <p className="text-xs text-muted-foreground">{s.descricao}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {form.servicoIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">{form.servicoIds.length} serviço(s) selecionado(s)</p>
                )}
              </TabsContent>

              {/* ---- TAB PARCERIA ---- */}
              <TabsContent value="parceria" className="space-y-5 mt-0">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Handshake className="w-4 h-4" /> Configuração da Parceria</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Modelo de Parceria</Label>
                    <Select value={form.modeloParceriaId ? String(form.modeloParceriaId) : 'none'} onValueChange={v => setForm(f => ({ ...f, modeloParceriaId: v === 'none' ? null : Number(v) }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {(modelos as any[]).map((m: any) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Parceiro / Subparceiro */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Tipo de Vínculo</Label>
                  <div className="flex gap-3">
                    <Button type="button" variant={!form.ehSubparceiro ? 'default' : 'outline'}
                      className={!form.ehSubparceiro ? 'bg-[#0A2540]' : ''}
                      onClick={() => setForm(f => ({ ...f, ehSubparceiro: false, parceiroPaiId: null }))}>
                      <Handshake className="w-4 h-4 mr-2" /> Parceiro Principal
                    </Button>
                    <Button type="button" variant={form.ehSubparceiro ? 'default' : 'outline'}
                      className={form.ehSubparceiro ? 'bg-[#0A2540]' : ''}
                      onClick={() => setForm(f => ({ ...f, ehSubparceiro: true }))}>
                      <Users className="w-4 h-4 mr-2" /> Subparceiro
                    </Button>
                  </div>
                </div>

                {form.ehSubparceiro && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                    <Label className="text-xs font-semibold text-blue-800">Vinculado ao Parceiro Principal *</Label>
                    <Select value={form.parceiroPaiId ? String(form.parceiroPaiId) : 'none'} onValueChange={v => setForm(f => ({ ...f, parceiroPaiId: v === 'none' ? null : Number(v) }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione o parceiro principal..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione...</SelectItem>
                        {(parceirosPrincipais as any[])
                          .filter((p: any) => p.id !== editingId) // Não pode ser subparceiro de si mesmo
                          .map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.apelido || p.nomeCompleto}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <Label className="text-xs">% Repasse do Parceiro Pai</Label>
                      <Input value={form.percentualRepasseSubparceiro} onChange={e => setForm(f => ({ ...f, percentualRepasseSubparceiro: e.target.value }))} placeholder="Ex: 30" type="number" min={0} max={100} />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Observações */}
                <div>
                  <Label className="text-xs">Observações</Label>
                  <Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} placeholder="Observações sobre o parceiro..." />
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
                  <Label className="text-sm">{form.ativo ? 'Parceiro Ativo' : 'Parceiro Inativo'}</Label>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="pt-4 border-t shrink-0">
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o parceiro <strong>{confirmDelete?.apelido || confirmDelete?.nomeCompleto}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate({ id: confirmDelete.id })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Excluir Parceiro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
