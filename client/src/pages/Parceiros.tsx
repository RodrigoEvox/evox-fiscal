import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

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
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Handshake, Plus, Search, Edit, Loader2, Phone, Mail, MapPin, MoreVertical,
  Power, PowerOff, Trash2, Eye, Building2, User, Diamond, Award, Medal, Filter,
  CreditCard, Users, AlertCircle, CheckCircle2, Landmark, KeyRound, Briefcase,
  AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, DollarSign, TrendingUp,
  FileText, Clock, BarChart3,
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
  nomeCompleto: '',
  cpf: '',
  rg: '',
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  situacaoCadastral: '',
  quadroSocietario: [] as { nome: string; qualificacao: string; faixaEtaria?: string }[],
  socioNome: '',
  socioCpf: '',
  socioRg: '',
  socioEmail: '',
  socioTelefone: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  banco: '',
  agencia: '',
  conta: '',
  tipoConta: '' as string,
  titularConta: '',
  cpfCnpjConta: '',
  chavePix: '',
  tipoChavePix: '' as string,
  modeloParceriaId: null as number | null,
  executivoComercialId: null as number | null,
  ehSubparceiro: false,
  parceiroPaiId: null as number | null,
  percentualRepasseSubparceiro: '',
  observacoes: '',
  ativo: true,
  servicoIds: [] as number[],
  // Comissões customizadas por serviço: { servicoId: percentual }
  comissoesCustom: {} as Record<number, string>,
  // Rateio subparceiro por serviço: { servicoId: { parceiro: %, subparceiro: % } }
  rateio: {} as Record<number, { parceiro: string; subparceiro: string }>,
  // Comissões com aprovação pendente: { servicoId: true }
  comissoesPendentes: {} as Record<number, boolean>,
};

const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

// ---- Section collapsible component ----
function FormSection({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="w-4 h-4 text-[#0A2540]" /> {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ---- DASHBOARD DE COMISSÕES DO PARCEIRO ----
function CommissionsDashboardTab({ parceiroId }: { parceiroId: number }) {
  const { data, isLoading } = trpc.parceiros.commissionsDashboard.useQuery({ parceiroId });

  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">Carregando comissões...</span>
    </div>
  );

  if (!data) return (
    <div className="text-center py-8 text-muted-foreground text-sm">Dados não encontrados.</div>
  );

  const { clientesVinculados, totalClientes, clientesAtivos, servicos, aprovacoes, subparceiros, rateios, modelo } = data;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Clientes Vinculados</span>
          </div>
          <p className="text-xl font-bold text-blue-900">{totalClientes}</p>
          <p className="text-[10px] text-blue-600">{clientesAtivos} ativos</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Serviços Autorizados</span>
          </div>
          <p className="text-xl font-bold text-emerald-900">{servicos.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Subparceiros</span>
          </div>
          <p className="text-xl font-bold text-purple-900">{subparceiros.length}</p>
        </div>
      </div>

      {/* Modelo de Parceria */}
      {modelo && (
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 mb-1">
            <Diamond className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Modelo de Parceria</span>
          </div>
          <p className="text-sm font-medium">{modelo.nome}</p>
          {modelo.descricao && <p className="text-xs text-muted-foreground mt-1">{modelo.descricao}</p>}
        </div>
      )}

      {/* Serviços e Comissões */}
      {servicos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Serviços e Comissões
          </h4>
          <div className="space-y-1">
            {servicos.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                <span className="font-medium">{s.servicoNome || `Serviço #${s.servicoId}`}</span>
                <Badge variant="outline" className="text-xs">
                  {s.percentualCustomizado ? `${s.percentualCustomizado}%` : 'Padrão'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rateio (se subparceiro) */}
      {rateios.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> Rateio de Comissão
          </h4>
          <div className="space-y-1">
            {rateios.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                <span>Serviço #{r.servicoId}</span>
                <div className="flex gap-3">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Parceiro: {r.percentualParceiro || 0}%</Badge>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Sub: {r.percentualSubparceiro || 0}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clientes Vinculados */}
      {clientesVinculados.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Clientes Vinculados ({totalClientes})
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {clientesVinculados.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                <div>
                  <span className="font-medium">{c.razaoSocial}</span>
                  <span className="text-xs text-muted-foreground ml-2">{c.cnpj}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${c.prioridade === 'alta' ? 'bg-red-50 text-red-700' : c.prioridade === 'media' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                    {c.prioridade}
                  </Badge>
                  <span className={`w-2 h-2 rounded-full ${c.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subparceiros */}
      {subparceiros.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Subparceiros ({subparceiros.length})
          </h4>
          <div className="space-y-1">
            {subparceiros.map((sp: any) => (
              <div key={sp.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                <span className="font-medium">{sp.apelido || sp.nomeCompleto}</span>
                <span className={`w-2 h-2 rounded-full ${sp.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de Aprovações */}
      {aprovacoes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Últimas Aprovações de Comissão
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {aprovacoes.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${
                    a.statusAprovacao === 'aprovado' ? 'bg-green-50 text-green-700' :
                    a.statusAprovacao === 'rejeitado' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {a.statusAprovacao === 'aprovado' ? 'Aprovado' : a.statusAprovacao === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                  </Badge>
                  <span className="text-muted-foreground">{a.percentualSolicitado}%</span>
                </div>
                <span className="text-muted-foreground">
                  {a.createdAt ? new Date(a.createdAt).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {clientesVinculados.length === 0 && servicos.length === 0 && aprovacoes.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma comissão ou cliente vinculado ainda.</p>
        </div>
      )}
    </div>
  );
}

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
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cpfErrors, setCpfErrors] = useState<Record<string, string>>({});
  const [formDirty, setFormDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  // Track commission status per service: 'pendente' for above-standard needing approval
  const [comissaoStatus, setComissaoStatus] = useState<Record<number, 'menor' | 'maior' | null>>({});
  const utils = trpc.useUtils();

  const { data: parceiros = [], isLoading } = trpc.parceiros.list.useQuery();
  const { data: modelos = [] } = trpc.modelosParceria.list.useQuery();
  const { data: servicos = [] } = trpc.servicos.list.useQuery();
  const { data: parceirosPrincipais = [] } = trpc.parceiros.listPrincipais.useQuery();
  const { data: executivos = [] } = trpc.executivos.list.useQuery();

  // Get comissões for selected modelo
  const selectedModeloId = form.modeloParceriaId;
  const comissoesByModelo = trpc.comissoes.byModelo.useQuery(
    { modeloParceriaId: selectedModeloId! },
    { enabled: !!selectedModeloId }
  );

  const createMutation = trpc.parceiros.create.useMutation({
    onSuccess: () => { utils.parceiros.list.invalidate(); utils.parceiros.listPrincipais.invalidate(); doCloseForm(); toast.success('Parceiro cadastrado com sucesso!'); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.parceiros.update.useMutation({
    onSuccess: () => { utils.parceiros.list.invalidate(); utils.parceiros.listPrincipais.invalidate(); doCloseForm(); toast.success('Parceiro atualizado com sucesso!'); },
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
  const createAprovacao = trpc.aprovacaoComissao.create.useMutation({
    onSuccess: () => toast.success('Solicitação de aprovação enviada ao Diretor'),
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

  const doCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setCpfErrors({});
    setFormDirty(false);
    setPendingClose(false);
    setComissaoStatus({});
    rateioManualEditsRef.current = {};
  }, []);

  const tryCloseForm = useCallback(() => {
    if (formDirty) {
      setShowExitConfirm(true);
      setPendingClose(true);
    } else {
      doCloseForm();
    }
  }, [formDirty, doCloseForm]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) tryCloseForm();
  }, [tryCloseForm]);

  const updateForm = useCallback((updater: (f: typeof EMPTY_FORM) => typeof EMPTY_FORM) => {
    setForm(prev => {
      const next = updater(prev);
      setFormDirty(true);
      return next;
    });
  }, []);

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
      executivoComercialId: p.executivoComercialId || null,
      ehSubparceiro: p.ehSubparceiro || false,
      parceiroPaiId: p.parceiroPaiId || null,
      percentualRepasseSubparceiro: p.percentualRepasseSubparceiro || '',
      observacoes: p.observacoes || '',
      ativo: p.ativo !== false,
      servicoIds: [],
      comissoesCustom: {},
      rateio: {},
      comissoesPendentes: {},
    });
    setEditingId(p.id);
    setFormDirty(false);
    setShowForm(true);
  };

  // Consulta CNPJ via BrasilAPI + CNPJ.ws (fallback)
  const handleConsultaCNPJ = async () => {
    const cnpjLimpo = form.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) { toast.error('CNPJ deve ter 14 dígitos'); return; }
    setCnpjLoading(true);

    const apis = [
      {
        name: 'BrasilAPI',
        url: `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
        parse: (data: any) => ({
          razaoSocial: data.razao_social || '',
          nomeFantasia: data.nome_fantasia || '',
          situacaoCadastral: data.descricao_situacao_cadastral || (data.situacao_cadastral === 2 ? 'Ativa' : data.situacao_cadastral === 8 ? 'Baixada' : String(data.situacao_cadastral || '')),
          logradouro: data.logradouro || '',
          numero: data.numero || 'S/N',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          estado: data.uf || '',
          cep: data.cep || '',
          quadroSocietario: (data.qsa || []).map((s: any) => ({
            nome: s.nome_socio || '',
            qualificacao: s.qualificacao_socio || '',
            faixaEtaria: s.faixa_etaria || '',
          })),
        }),
      },
      {
        name: 'CNPJ.ws',
        url: `https://publica.cnpj.ws/cnpj/${cnpjLimpo}`,
        parse: (data: any) => ({
          razaoSocial: data.razao_social || '',
          nomeFantasia: data.estabelecimento?.nome_fantasia || '',
          situacaoCadastral: data.estabelecimento?.situacao_cadastral || '',
          logradouro: data.estabelecimento?.logradouro || '',
          numero: data.estabelecimento?.numero || 'S/N',
          complemento: data.estabelecimento?.complemento || '',
          bairro: data.estabelecimento?.bairro || '',
          cidade: data.estabelecimento?.cidade?.nome || '',
          estado: data.estabelecimento?.estado?.sigla || '',
          cep: data.estabelecimento?.cep || '',
          quadroSocietario: (data.socios || []).map((s: any) => ({
            nome: s.nome || '',
            qualificacao: s.qualificacao?.descricao || '',
            faixaEtaria: s.faixa_etaria || '',
          })),
        }),
      },
    ];

    let result: any = null;
    for (const api of apis) {
      try {
        const resp = await fetch(api.url);
        if (!resp.ok) continue;
        const raw = await resp.json();
        result = api.parse(raw);
        break; // Use first successful result
      } catch {
        continue;
      }
    }

    if (!result) {
      toast.error('Não foi possível consultar o CNPJ. Verifique o número e tente novamente.');
      setCnpjLoading(false);
      return;
    }

    setForm(f => ({
      ...f,
      razaoSocial: result.razaoSocial,
      nomeFantasia: result.nomeFantasia,
      situacaoCadastral: result.situacaoCadastral,
      logradouro: result.logradouro,
      numero: result.numero,
      complemento: result.complemento,
      bairro: result.bairro,
      cidade: result.cidade,
      estado: result.estado,
      cep: result.cep ? maskCep(result.cep) : '',
      quadroSocietario: result.quadroSocietario,
    }));
    setFormDirty(true);
    toast.success('Dados do CNPJ carregados com sucesso!');
    setCnpjLoading(false);
  };

  // Consulta CEP via ViaCEP
  const handleConsultaCEP = async (cepValue: string) => {
    const cepLimpo = cepValue.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    setCepLoading(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!resp.ok) throw new Error('CEP não encontrado');
      const data = await resp.json();
      if (data.erro) { toast.error('CEP não encontrado'); setCepLoading(false); return; }
      updateForm(f => ({
        ...f,
        logradouro: data.logradouro || f.logradouro,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        estado: data.uf || f.estado,
        complemento: data.complemento || f.complemento,
      }));
      toast.success('Endereço carregado pelo CEP!');
    } catch {
      toast.error('Não foi possível consultar o CEP.');
    } finally {
      setCepLoading(false);
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

  // Get comissão padrão for a serviço
  const getComissaoPadrao = useCallback((servicoId: number): string | null => {
    if (!comissoesByModelo.data) return null;
    const c = (comissoesByModelo.data as any[]).find((c: any) => c.servicoId === servicoId);
    return c ? c.percentualComissao : null;
  }, [comissoesByModelo.data]);

  // Track which rateio fields have been manually edited (use ref to avoid stale closure)
  const rateioManualEditsRef = useRef<Record<number, { parceiro?: boolean; subparceiro?: boolean }>>({}); 

  // Handle rateio field change with auto-calculation of the other field
  // Auto-calc only happens when the OTHER field has NOT been manually edited yet
  const handleRateioFieldChange = useCallback((servicoId: number, field: 'parceiro' | 'subparceiro', value: string) => {
    // Mark this field as manually edited (ref — always current)
    rateioManualEditsRef.current = {
      ...rateioManualEditsRef.current,
      [servicoId]: { ...rateioManualEditsRef.current[servicoId], [field]: true },
    };

    updateForm(f => {
      const current = f.rateio[servicoId] || { parceiro: '', subparceiro: '' };
      const padrao = getComissaoPadrao(servicoId);
      const padraoNum = padrao ? parseFloat(padrao) : 0;
      const val = parseFloat(value);
      const otherField = field === 'parceiro' ? 'subparceiro' : 'parceiro';
      const otherManuallyEdited = rateioManualEditsRef.current[servicoId]?.[otherField] === true;
      let updated: { parceiro: string; subparceiro: string };

      if (!isNaN(val) && !otherManuallyEdited) {
        // Auto-calc the other field only if it hasn't been manually touched
        const remaining = Math.max(0, padraoNum - val);
        if (field === 'parceiro') {
          updated = { parceiro: value, subparceiro: remaining.toFixed(1) };
        } else {
          updated = { parceiro: remaining.toFixed(1), subparceiro: value };
        }
      } else {
        // Other field was manually edited — don't auto-calc, just update this field
        updated = { ...current, [field]: value };
      }

      // Update comissoesCustom with the total
      const total = parseFloat(updated.parceiro || '0') + parseFloat(updated.subparceiro || '0');
      const newCustom = { ...f.comissoesCustom, [servicoId]: total.toFixed(1) };
      return { ...f, rateio: { ...f.rateio, [servicoId]: updated }, comissoesCustom: newCustom };
    });
    // Update commission status based on total
    setTimeout(() => {
      setForm(prev => {
        const r = prev.rateio[servicoId];
        if (!r) return prev;
        const total = parseFloat(r.parceiro || '0') + parseFloat(r.subparceiro || '0');
        const padrao = getComissaoPadrao(servicoId);
        const padraoNum = padrao ? parseFloat(padrao) : 0;
        if (Math.abs(total - padraoNum) < 0.01) {
          setComissaoStatus(p => ({ ...p, [servicoId]: null }));
        } else if (total < padraoNum) {
          setComissaoStatus(p => ({ ...p, [servicoId]: 'menor' }));
        } else {
          setComissaoStatus(p => ({ ...p, [servicoId]: 'maior' }));
        }
        return prev;
      });
    }, 0);
  }, [updateForm, getComissaoPadrao]);

  // Reset rateio to standard value (split evenly or full to parceiro)
  const handleComissaoReset = useCallback((servicoId: number) => {
    const padrao = getComissaoPadrao(servicoId);
    const padraoVal = padrao || '0';
    updateForm(f => {
      const newRateio = { ...f.rateio, [servicoId]: { parceiro: padraoVal, subparceiro: '0.0' } };
      const newCustom = { ...f.comissoesCustom };
      delete newCustom[servicoId];
      const newPendentes = { ...f.comissoesPendentes };
      delete newPendentes[servicoId];
      return { ...f, rateio: newRateio, comissoesCustom: newCustom, comissoesPendentes: newPendentes };
    });
    setComissaoStatus(prev => ({ ...prev, [servicoId]: null }));
    // Reset manual edits tracking so auto-calc works again
    const edits = { ...rateioManualEditsRef.current };
    delete edits[servicoId];
    rateioManualEditsRef.current = edits;
  }, [updateForm, getComissaoPadrao]);

  // Confirm above-standard commission (mark as pending approval)
  const handleComissaoConfirmAbove = useCallback((servicoId: number) => {
    updateForm(f => ({
      ...f,
      comissoesPendentes: { ...f.comissoesPendentes, [servicoId]: true },
    }));
    setComissaoStatus(prev => ({ ...prev, [servicoId]: null }));
    toast.info('Comissão será enviada para aprovação do Diretor ao salvar o parceiro.');
  }, [updateForm]);

  // Confirm below-standard commission (just acknowledge)
  const handleComissaoConfirmBelow = useCallback((servicoId: number) => {
    setComissaoStatus(prev => ({ ...prev, [servicoId]: null }));
  }, []);



  // Auto-set executivo when selecting parceiro pai for subparceiro
  useEffect(() => {
    if (form.ehSubparceiro && form.parceiroPaiId) {
      const pai = (parceiros as any[]).find((p: any) => p.id === form.parceiroPaiId);
      if (pai?.executivoComercialId) {
        setForm(f => ({ ...f, executivoComercialId: pai.executivoComercialId }));
      }
    }
  }, [form.ehSubparceiro, form.parceiroPaiId, parceiros]);

  const handleSave = () => {
    // Validar Apelido (obrigatório para todos)
    if (!form.apelido.trim()) { toast.error('Preencha o Apelido (nome de exibição)'); return; }

    // Validar campos por tipo de pessoa
    if (form.tipoPessoa === 'pf') {
      if (!form.nomeCompleto.trim()) { toast.error('Preencha o nome completo'); return; }
      const cpfLimpo = form.cpf.replace(/\D/g, '');
      if (!cpfLimpo || cpfLimpo.length !== 11) { toast.error('Preencha o CPF'); return; }
      if (!validarCpf(cpfLimpo)) { toast.error('CPF do parceiro é inválido'); return; }
      if (!form.rg.trim()) { toast.error('Preencha o RG'); return; }
      if (!form.email.trim()) { toast.error('Preencha o e-mail'); return; }
      if (!form.telefone.trim()) { toast.error('Preencha o telefone'); return; }
    } else {
      if (!form.cnpj || form.cnpj.replace(/\D/g, '').length < 14) { toast.error('Preencha o CNPJ'); return; }
      if (!form.razaoSocial?.trim()) { toast.error('Preencha a Razão Social'); return; }
      if (!form.email.trim()) { toast.error('Preencha o e-mail da empresa'); return; }
      if (!form.telefone.trim()) { toast.error('Preencha o telefone da empresa'); return; }
      // Sócio responsável obrigatório para PJ
      if (!form.socioNome.trim()) { toast.error('Preencha o nome do sócio responsável'); return; }
      const socioCpfLimpo = form.socioCpf.replace(/\D/g, '');
      if (!socioCpfLimpo || socioCpfLimpo.length !== 11) { toast.error('Preencha o CPF do sócio responsável'); return; }
      if (!validarCpf(socioCpfLimpo)) { toast.error('CPF do sócio responsável é inválido'); return; }
      if (!form.socioRg.trim()) { toast.error('Preencha o RG do sócio responsável'); return; }
      if (!form.socioEmail.trim()) { toast.error('Preencha o e-mail do sócio responsável'); return; }
      if (!form.socioTelefone.trim()) { toast.error('Preencha o telefone do sócio responsável'); return; }
    }

    // Validar endereço (obrigatório para todos)
    if (!form.cep || form.cep.replace(/\D/g, '').length < 8) { toast.error('Preencha o CEP'); return; }
    if (!form.logradouro.trim()) { toast.error('Preencha o logradouro'); return; }
    if (!form.numero.trim()) { toast.error('Preencha o número'); return; }
    if (!form.bairro.trim()) { toast.error('Preencha o bairro'); return; }
    if (!form.cidade.trim()) { toast.error('Preencha a cidade'); return; }
    if (!form.estado) { toast.error('Selecione o estado (UF)'); return; }

    // Validar dados bancários (obrigatório)
    if (!form.banco.trim()) { toast.error('Preencha o banco'); return; }
    if (!form.agencia.trim()) { toast.error('Preencha a agência'); return; }
    if (!form.conta.trim()) { toast.error('Preencha a conta'); return; }
    if (!form.tipoConta) { toast.error('Selecione o tipo de conta'); return; }
    if (!form.titularConta.trim()) { toast.error('Preencha o titular da conta'); return; }
    if (!form.cpfCnpjConta.trim()) { toast.error('Preencha o CPF/CNPJ da conta'); return; }
    if (!form.tipoChavePix) { toast.error('Selecione o tipo da chave PIX'); return; }
    if (!form.chavePix.trim()) { toast.error('Preencha a chave PIX'); return; }

    // Validar configuração de parceria (obrigatório)
    if (!form.modeloParceriaId) { toast.error('Selecione o modelo de parceria'); return; }
    if (!form.executivoComercialId && !form.ehSubparceiro) { toast.error('Selecione o executivo comercial responsável'); return; }
    if (form.ehSubparceiro && !form.parceiroPaiId) { toast.error('Selecione o parceiro principal'); return; }
    if (form.servicoIds.length === 0) { toast.error('Selecione pelo menos um serviço'); return; }

    // Check rateio totals
    if (form.ehSubparceiro) {
      for (const servicoId of form.servicoIds) {
        const rateio = form.rateio[servicoId];
        if (rateio) {
          const total = parseFloat(rateio.parceiro || '0') + parseFloat(rateio.subparceiro || '0');
          const padrao = getComissaoPadrao(servicoId);
          const max = padrao ? parseFloat(padrao) : 100;
          if (total > max) {
            const servicoNome = (servicos as any[]).find((s: any) => s.id === servicoId)?.nome || `#${servicoId}`;
            toast.error(`Rateio do serviço "${servicoNome}" excede o máximo de ${max}%`);
            return;
          }
        }
      }
    }

    const payload: any = {
      ...form,
      nomeCompleto: form.tipoPessoa === 'pj' ? (form.razaoSocial || form.nomeCompleto) : form.nomeCompleto,
      modeloParceriaId: form.modeloParceriaId || null,
      executivoComercialId: form.executivoComercialId || null,
      parceiroPaiId: form.ehSubparceiro ? form.parceiroPaiId : null,
      tipoConta: form.tipoConta || undefined,
      tipoChavePix: form.tipoChavePix || undefined,
    };
    // Clean empty strings
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') payload[key] = undefined;
    }
    // Keep required fields
    payload.tipoPessoa = form.tipoPessoa;
    payload.ehSubparceiro = form.ehSubparceiro;
    payload.ativo = form.ativo;
    payload.servicoIds = form.servicoIds;
    // Remove non-db fields
    delete payload.comissoesCustom;
    delete payload.rateio;
    delete payload.quadroSocietario;
    delete payload.comissoesPendentes;

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }

    // Send comissão approval requests for above-standard comissões that were confirmed
    if (form.modeloParceriaId) {
      for (const [sIdStr, isPending] of Object.entries(form.comissoesPendentes)) {
        if (!isPending) continue;
        const sId = Number(sIdStr);
        const customPct = form.comissoesCustom[sId];
        const padrao = getComissaoPadrao(sId);
        if (padrao && customPct && parseFloat(customPct) > parseFloat(padrao)) {
          createAprovacao.mutate({
            parceiroId: editingId || 0,
            servicoId: sId,
            percentualSolicitado: customPct,
            percentualPadrao: padrao,
            modeloParceriaId: form.modeloParceriaId,
          });
        }
      }
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

  const getExecutivoNome = (id: number | null) => {
    if (!id) return null;
    const e = (executivos as any[]).find((e: any) => e.id === id);
    return e ? e.nome : null;
  };

  const stats = {
    total: (parceiros as any[]).length,
    ativos: (parceiros as any[]).filter((p: any) => p.ativo).length,
    inativos: (parceiros as any[]).filter((p: any) => !p.ativo).length,
    subparceiros: (parceiros as any[]).filter((p: any) => p.ehSubparceiro).length,
  };

  const displayName = (p: any) => p.apelido || p.nomeCompleto || p.razaoSocial || '';

  const activeExecutivos = useMemo(() => (executivos as any[]).filter((e: any) => e.ativo), [executivos]);

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
          <Button onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); setFormDirty(false); setShowForm(true); }} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
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
            const execNome = getExecutivoNome(p.executivoComercialId);
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
                      {execNome && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3" /> Exec: {execNome}
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
                  <TabsTrigger value="comissoes" className="flex-1">Comissões</TabsTrigger>
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
                    <div><Label className="text-xs text-muted-foreground">Executivo Comercial</Label><p className="text-sm font-medium text-emerald-700">{getExecutivoNome(viewParceiro.executivoComercialId) || 'N/A'}</p></div>
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
                    <div>
                      <Label className="text-xs text-muted-foreground">Executivo Comercial</Label>
                      <p className="text-sm font-medium text-emerald-700">{getExecutivoNome(viewParceiro.executivoComercialId) || 'N/A'}</p>
                    </div>
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
                <TabsContent value="comissoes" className="space-y-4 mt-4">
                  <CommissionsDashboardTab parceiroId={viewParceiro.id} />
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

      {/* ===== CREATE/EDIT DIALOG — SINGLE SCROLLABLE FORM ===== */}
      <Dialog open={showForm} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0" onInteractOutside={(e) => { if (formDirty) { e.preventDefault(); setShowExitConfirm(true); setPendingClose(true); } }}>
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>{editingId ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
            <DialogDescription>{editingId ? 'Altere os dados do parceiro.' : 'Preencha os dados para cadastrar um novo parceiro.'}</DialogDescription>
          </DialogHeader>

          {/* Single scrollable form */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            {/* === SEÇÃO: TIPO DE PESSOA === */}
            <FormSection title="Tipo de Pessoa" icon={User}>
              <div className="flex gap-3">
                <Button type="button" variant={form.tipoPessoa === 'pf' ? 'default' : 'outline'}
                  className={form.tipoPessoa === 'pf' ? 'bg-[#0A2540]' : ''}
                  onClick={() => updateForm(f => ({ ...f, tipoPessoa: 'pf' }))}>
                  <User className="w-4 h-4 mr-2" /> Pessoa Física
                </Button>
                <Button type="button" variant={form.tipoPessoa === 'pj' ? 'default' : 'outline'}
                  className={form.tipoPessoa === 'pj' ? 'bg-[#0A2540]' : ''}
                  onClick={() => updateForm(f => ({ ...f, tipoPessoa: 'pj' }))}>
                  <Building2 className="w-4 h-4 mr-2" /> Pessoa Jurídica
                </Button>
              </div>

              {/* Apelido */}
              <div>
                <Label className="text-xs">Apelido (Nome de Exibição) *</Label>
                <Input value={form.apelido} onChange={e => updateForm(f => ({ ...f, apelido: e.target.value }))} placeholder="Nome que será exibido no sistema" />
                <p className="text-[10px] text-muted-foreground mt-1">Este será o nome principal exibido em todas as telas do sistema.</p>
              </div>
            </FormSection>

            {/* === SEÇÃO: DADOS PF ou PJ === */}
            {form.tipoPessoa === 'pf' ? (
              <FormSection title="Dados Pessoais" icon={User}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Nome Completo *</Label>
                    <Input value={form.nomeCompleto} onChange={e => updateForm(f => ({ ...f, nomeCompleto: e.target.value }))} placeholder="Nome completo do parceiro" />
                  </div>
                  <div>
                    <Label className="text-xs">CPF *</Label>
                    <Input value={form.cpf} onChange={e => updateForm(f => ({ ...f, cpf: maskCpf(e.target.value) }))}
                      onBlur={() => handleCpfBlur('cpf', form.cpf)}
                      placeholder="000.000.000-00" maxLength={14}
                      className={cpfErrors.cpf ? 'border-red-500' : ''} />
                    {cpfErrors.cpf && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> {cpfErrors.cpf}</p>}
                    {form.cpf && !cpfErrors.cpf && form.cpf.replace(/\D/g, '').length === 11 && <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> CPF válido</p>}
                  </div>
                  <div>
                    <Label className="text-xs">RG *</Label>
                    <Input value={form.rg} onChange={e => updateForm(f => ({ ...f, rg: e.target.value }))} placeholder="RG" />
                  </div>
                  <div>
                    <Label className="text-xs">E-mail *</Label>
                    <Input type="email" value={form.email} onChange={e => updateForm(f => ({ ...f, email: e.target.value }))} placeholder="email@parceiro.com" />
                  </div>
                  <div>
                    <Label className="text-xs">Telefone *</Label>
                    <Input value={form.telefone} onChange={e => updateForm(f => ({ ...f, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                </div>
              </FormSection>
            ) : (
              <>
                <FormSection title="Dados da Empresa" icon={Building2}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">CNPJ *</Label>
                      <div className="flex gap-2">
                        <Input value={form.cnpj} onChange={e => updateForm(f => ({ ...f, cnpj: maskCnpj(e.target.value) }))} placeholder="00.000.000/0000-00" maxLength={18} className="flex-1" />
                        <Button type="button" variant="outline" onClick={handleConsultaCNPJ} disabled={cnpjLoading} className="shrink-0">
                          {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          <span className="ml-1 text-xs">Consultar</span>
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Razão Social *</Label>
                      <Input value={form.razaoSocial} onChange={e => updateForm(f => ({ ...f, razaoSocial: e.target.value }))} placeholder="Razão social da empresa" />
                    </div>
                    <div>
                      <Label className="text-xs">Nome Fantasia</Label>
                      <Input value={form.nomeFantasia} onChange={e => updateForm(f => ({ ...f, nomeFantasia: e.target.value }))} placeholder="Nome fantasia" />
                    </div>
                    <div>
                      <Label className="text-xs">Situação Cadastral</Label>
                      <Input value={form.situacaoCadastral} readOnly className="bg-muted/50" />
                    </div>
                    <div>
                      <Label className="text-xs">E-mail *</Label>
                      <Input type="email" value={form.email} onChange={e => updateForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
                    </div>
                    <div>
                      <Label className="text-xs">Telefone *</Label>
                      <Input value={form.telefone} onChange={e => updateForm(f => ({ ...f, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} />
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
                </FormSection>

                <FormSection title="Sócio Responsável pela Parceria" icon={User}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Nome Completo do Sócio *</Label>
                      <Input value={form.socioNome} onChange={e => updateForm(f => ({ ...f, socioNome: e.target.value }))} placeholder="Nome do sócio responsável" />
                    </div>
                    <div>
                      <Label className="text-xs">CPF do Sócio *</Label>
                      <Input value={form.socioCpf} onChange={e => updateForm(f => ({ ...f, socioCpf: maskCpf(e.target.value) }))}
                        onBlur={() => handleCpfBlur('socioCpf', form.socioCpf)}
                        placeholder="000.000.000-00" maxLength={14}
                        className={cpfErrors.socioCpf ? 'border-red-500' : ''} />
                      {cpfErrors.socioCpf && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> {cpfErrors.socioCpf}</p>}
                      {form.socioCpf && !cpfErrors.socioCpf && form.socioCpf.replace(/\D/g, '').length === 11 && <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> CPF válido</p>}
                    </div>
                    <div>
                      <Label className="text-xs">RG do Sócio *</Label>
                      <Input value={form.socioRg} onChange={e => updateForm(f => ({ ...f, socioRg: e.target.value }))} placeholder="RG" />
                    </div>
                    <div>
                      <Label className="text-xs">E-mail do Sócio *</Label>
                      <Input type="email" value={form.socioEmail} onChange={e => updateForm(f => ({ ...f, socioEmail: e.target.value }))} placeholder="email@socio.com" />
                    </div>
                    <div>
                      <Label className="text-xs">Telefone do Sócio *</Label>
                      <Input value={form.socioTelefone} onChange={e => updateForm(f => ({ ...f, socioTelefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                  </div>
                </FormSection>
              </>
            )}

            {/* === SEÇÃO: ENDEREÇO === */}
            <FormSection title="Endereço Completo" icon={MapPin}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">CEP *</Label>
                  <div className="flex gap-2">
                    <Input value={form.cep} onChange={e => updateForm(f => ({ ...f, cep: maskCep(e.target.value) }))} onBlur={e => handleConsultaCEP(e.target.value)} placeholder="00000-000" maxLength={9} className="flex-1" />
                    <Button type="button" variant="outline" onClick={() => handleConsultaCEP(form.cep)} disabled={cepLoading} className="shrink-0">
                      {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span className="ml-1 text-xs">Buscar</span>
                    </Button>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Logradouro *</Label>
                  <Input value={form.logradouro} onChange={e => updateForm(f => ({ ...f, logradouro: e.target.value }))} placeholder="Rua, Avenida, etc." />
                </div>
                <div>
                  <Label className="text-xs">Número *</Label>
                  <Input value={form.numero} onChange={e => updateForm(f => ({ ...f, numero: e.target.value }))} placeholder="Nº" />
                </div>
                <div>
                  <Label className="text-xs">Complemento</Label>
                  <Input value={form.complemento} onChange={e => updateForm(f => ({ ...f, complemento: e.target.value }))} placeholder="Sala, Andar, Bloco..." />
                </div>
                <div>
                  <Label className="text-xs">Bairro *</Label>
                  <Input value={form.bairro} onChange={e => updateForm(f => ({ ...f, bairro: e.target.value }))} placeholder="Bairro" />
                </div>
                <div>
                  <Label className="text-xs">Cidade *</Label>
                  <Input value={form.cidade} onChange={e => updateForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Cidade" />
                </div>
                <div>
                  <Label className="text-xs">UF *</Label>
                  <Select value={form.estado} onValueChange={v => updateForm(f => ({ ...f, estado: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            {/* === SEÇÃO: DADOS BANCÁRIOS === */}
            <FormSection title="Dados Bancários para Comissões" icon={Landmark}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Banco *</Label>
                  <Input value={form.banco} onChange={e => updateForm(f => ({ ...f, banco: e.target.value }))} placeholder="Ex: Banco do Brasil, Itaú..." />
                </div>
                <div>
                  <Label className="text-xs">Agência *</Label>
                  <Input value={form.agencia} onChange={e => updateForm(f => ({ ...f, agencia: e.target.value }))} placeholder="0000" />
                </div>
                <div>
                  <Label className="text-xs">Conta *</Label>
                  <Input value={form.conta} onChange={e => updateForm(f => ({ ...f, conta: e.target.value }))} placeholder="00000-0" />
                </div>
                <div>
                  <Label className="text-xs">Tipo de Conta *</Label>
                  <Select value={form.tipoConta} onValueChange={v => updateForm(f => ({ ...f, tipoConta: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Titular da Conta *</Label>
                  <Input value={form.titularConta} onChange={e => updateForm(f => ({ ...f, titularConta: e.target.value }))} placeholder="Nome do titular" />
                </div>
                <div>
                  <Label className="text-xs">CPF/CNPJ da Conta *</Label>
                  <Input value={form.cpfCnpjConta} onChange={e => updateForm(f => ({ ...f, cpfCnpjConta: e.target.value }))} placeholder="Documento do titular" />
                </div>
              </div>

              <Separator />

              <h4 className="text-sm font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4" /> Chave PIX</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo da Chave PIX *</Label>
                  <Select value={form.tipoChavePix} onValueChange={v => updateForm(f => ({ ...f, tipoChavePix: v }))}>
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
                  <Label className="text-xs">Chave PIX *</Label>
                  <Input value={form.chavePix} onChange={e => updateForm(f => ({ ...f, chavePix: e.target.value }))} placeholder="Informe a chave PIX" />
                </div>
              </div>
            </FormSection>

            {/* === SEÇÃO: CONFIGURAÇÃO DA PARCERIA === */}
            <FormSection title="Configuração da Parceria" icon={Handshake}>
              {/* Modelo de Parceria (Diamante/Ouro/Prata) */}
              <div>
                <Label className="text-xs font-semibold">Modelo de Parceria *</Label>
                <Select value={form.modeloParceriaId ? String(form.modeloParceriaId) : 'none'} onValueChange={v => {
                  const newId = v === 'none' ? null : Number(v);
                  updateForm(f => ({ ...f, modeloParceriaId: newId, comissoesCustom: {} }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(modelos as any[]).map((m: any) => {
                      const info = MODELO_LABELS[m.nome.toLowerCase()];
                      const Icon = info?.icon || Award;
                      return (
                        <SelectItem key={m.id} value={String(m.id)}>
                          <span className="flex items-center gap-2"><Icon className="w-4 h-4" /> {m.nome}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Tipo de Vínculo */}
              <div>
                <Label className="text-xs font-semibold mb-2 block">Tipo de Vínculo</Label>
                <div className="flex gap-3">
                  <Button type="button" variant={!form.ehSubparceiro ? 'default' : 'outline'}
                    className={!form.ehSubparceiro ? 'bg-[#0A2540]' : ''}
                    onClick={() => updateForm(f => ({ ...f, ehSubparceiro: false, parceiroPaiId: null, rateio: {} }))}>
                    <Handshake className="w-4 h-4 mr-2" /> Parceiro Principal
                  </Button>
                  <Button type="button" variant={form.ehSubparceiro ? 'default' : 'outline'}
                    className={form.ehSubparceiro ? 'bg-[#0A2540]' : ''}
                    onClick={() => updateForm(f => ({ ...f, ehSubparceiro: true }))}>
                    <Users className="w-4 h-4 mr-2" /> Subparceiro
                  </Button>
                </div>
              </div>

              {form.ehSubparceiro && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                  <Label className="text-xs font-semibold text-blue-800">Vinculado ao Parceiro Principal *</Label>
                  <Select value={form.parceiroPaiId ? String(form.parceiroPaiId) : 'none'} onValueChange={v => updateForm(f => ({ ...f, parceiroPaiId: v === 'none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o parceiro principal..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione...</SelectItem>
                      {(parceirosPrincipais as any[])
                        .filter((p: any) => p.id !== editingId)
                        .map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.apelido || p.nomeCompleto}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Executivo Comercial */}
              <div>
                <Label className="text-xs font-semibold flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Executivo Comercial Responsável
                </Label>
                {form.ehSubparceiro && form.parceiroPaiId ? (
                  <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Herdado automaticamente do parceiro principal: <strong>{getExecutivoNome(form.executivoComercialId) || 'Nenhum definido'}</strong>
                    </p>
                  </div>
                ) : (
                  <Select value={form.executivoComercialId ? String(form.executivoComercialId) : 'none'} onValueChange={v => updateForm(f => ({ ...f, executivoComercialId: v === 'none' ? null : Number(v) }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um executivo..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {activeExecutivos.map((e: any) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.nome}{e.cargo ? ` — ${e.cargo}` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Separator />

              {/* Observações */}
              <div>
                <Label className="text-xs">Observações</Label>
                <Textarea value={form.observacoes} onChange={e => updateForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} placeholder="Observações sobre o parceiro..." />
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Switch checked={form.ativo} onCheckedChange={v => updateForm(f => ({ ...f, ativo: v }))} />
                <Label className="text-sm">{form.ativo ? 'Parceiro Ativo' : 'Parceiro Inativo'}</Label>
              </div>
            </FormSection>

            {/* === SEÇÃO: SERVIÇOS E COMISSÕES === */}
            <FormSection title="Serviços e Comissões" icon={CreditCard}>
              <p className="text-xs text-muted-foreground">Selecione os serviços que este parceiro está autorizado a trabalhar com a Evox. {form.modeloParceriaId ? 'A comissão padrão do modelo é exibida como referência. Preencha os campos de rateio para definir a distribuição.' : 'Selecione um modelo de parceria para ver as comissões padrão.'}</p>
              {(servicos as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum serviço cadastrado no sistema.</p>
              ) : (
                <div className="space-y-3">
                  {(servicos as any[]).filter((s: any) => s.ativo !== false).map((s: any) => {
                    const isSelected = form.servicoIds.includes(s.id);
                    const comissaoPadrao = getComissaoPadrao(s.id);
                    const rateio = form.rateio[s.id];
                    const rateioTotal = rateio ? parseFloat(rateio.parceiro || '0') + parseFloat(rateio.subparceiro || '0') : 0;
                    const padraoNum = comissaoPadrao ? parseFloat(comissaoPadrao) : 0;
                    return (
                      <div key={s.id} className={`rounded-lg border transition-colors ${isSelected ? 'border-[#0A2540]/30 bg-[#0A2540]/5' : 'hover:bg-muted/30'}`}>
                        {/* Service header with checkbox */}
                        <div className="flex items-center gap-3 p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              updateForm(f => {
                                const newIds = checked
                                  ? [...f.servicoIds, s.id]
                                  : f.servicoIds.filter((id: number) => id !== s.id);
                                // Initialize rateio when selecting with default values
                                let newRateio = { ...f.rateio };
                                if (checked && comissaoPadrao) {
                                  newRateio[s.id] = { parceiro: comissaoPadrao, subparceiro: '0.0' };
                                } else if (!checked) {
                                  delete newRateio[s.id];
                                }
                                return { ...f, servicoIds: newIds, rateio: newRateio };
                              });
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{s.nome}</p>
                            {s.descricao && <p className="text-xs text-muted-foreground">{s.descricao}</p>}
                          </div>
                          {/* Read-only standard commission badge */}
                          {isSelected && comissaoPadrao && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">Padrão:</span>
                              <Badge variant="outline" className="text-xs font-semibold bg-slate-50 border-slate-200 text-slate-700">
                                {comissaoPadrao}%
                              </Badge>
                              {form.comissoesPendentes[s.id] && (
                                <Badge variant="outline" className="text-[9px] h-5 border-blue-300 text-blue-600 bg-blue-50 whitespace-nowrap">
                                  <ShieldCheck className="w-3 h-3 mr-0.5" /> Pendente
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Rateio fields — always shown when service is selected and has standard commission */}
                        {isSelected && comissaoPadrao && (
                          <div className="px-3 pb-3 pt-0">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                              <Label className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Rateio de Comissão
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-[10px] text-slate-600">% Parceiro Principal</Label>
                                  <Input
                                    value={rateio?.parceiro ?? comissaoPadrao}
                                    onChange={e => handleRateioFieldChange(s.id, 'parceiro', e.target.value)}
                                    className="h-8 text-xs"
                                    type="number" min={0} max={100} step={0.1}
                                    placeholder="0.0"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-slate-600">% Subparceiro</Label>
                                  <Input
                                    value={rateio?.subparceiro ?? '0.0'}
                                    onChange={e => handleRateioFieldChange(s.id, 'subparceiro', e.target.value)}
                                    className="h-8 text-xs"
                                    type="number" min={0} max={100} step={0.1}
                                    placeholder="0.0"
                                  />
                                </div>
                              </div>
                              {/* Total display */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                                <span className="text-[10px] text-slate-500">Total do rateio:</span>
                                <span className={`text-xs font-semibold ${Math.abs(rateioTotal - padraoNum) < 0.01 ? 'text-green-600' : rateioTotal > padraoNum ? 'text-red-600' : 'text-amber-600'}`}>
                                  {rateioTotal.toFixed(1)}% {Math.abs(rateioTotal - padraoNum) < 0.01 ? '' : rateioTotal > padraoNum ? `(+${(rateioTotal - padraoNum).toFixed(1)}%)` : `(${(rateioTotal - padraoNum).toFixed(1)}%)`}
                                </span>
                              </div>
                            </div>

                            {/* Alert BELOW the rateio fields — does not overlap anything */}
                            {comissaoStatus[s.id] === 'menor' && (
                              <div className="mt-2 p-2.5 bg-amber-50 rounded-md border border-amber-200">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs text-amber-800">Soma do rateio ({rateioTotal.toFixed(1)}%) está abaixo do padrão ({comissaoPadrao}%).</p>
                                    <div className="flex gap-2 mt-2">
                                      <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={() => handleComissaoReset(s.id)}>Usar Padrão</Button>
                                      <Button size="sm" className="h-7 text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleComissaoConfirmBelow(s.id)}>Confirmar Valor</Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {comissaoStatus[s.id] === 'maior' && !form.comissoesPendentes[s.id] && (
                              <div className="mt-2 p-2.5 bg-red-50 rounded-md border border-red-200">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs text-red-800">Soma do rateio ({rateioTotal.toFixed(1)}%) está acima do padrão ({comissaoPadrao}%). Será enviada para aprovação do Diretor.</p>
                                    <div className="flex gap-2 mt-2">
                                      <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={() => handleComissaoReset(s.id)}>Usar Padrão</Button>
                                      <Button size="sm" className="h-7 text-xs px-3 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleComissaoConfirmAbove(s.id)}>Solicitar Aprovação</Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {form.servicoIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{form.servicoIds.length} serviço(s) selecionado(s)</p>
              )}
            </FormSection>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
            <Button variant="outline" onClick={tryCloseForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== EXIT CONFIRMATION ===== */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Deseja sair do cadastro?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Se sair agora, todas as informações preenchidas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowExitConfirm(false); setPendingClose(false); }}>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowExitConfirm(false); doCloseForm(); }} className="bg-red-600 hover:bg-red-700">
              Sair sem Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



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
