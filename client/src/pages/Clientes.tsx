import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Plus, Search, Flag, AlertTriangle, Eye, Pencil, Trash2, Loader2,
  Building2, ArrowLeft, MoreVertical, Power, PowerOff, Filter,
  User, FileCheck, ShieldAlert, ShieldCheck, CalendarClock,
} from 'lucide-react';

const estadosBR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

// Mapeamento de CNAEs para segmentos econômicos
const CNAE_SEGMENTOS: Record<string, string> = {
  '49': 'Transportadora', '50': 'Transportadora', '51': 'Transportadora',
  '47': 'Comércio Varejista', '46': 'Comércio Atacadista',
  '10': 'Indústria Alimentícia', '11': 'Indústria de Bebidas',
  '56': 'Restaurante / Alimentação', '55': 'Hotelaria',
  '62': 'Tecnologia da Informação', '63': 'Tecnologia da Informação',
  '64': 'Serviços Financeiros', '65': 'Seguros',
  '86': 'Saúde', '87': 'Saúde',
  '85': 'Educação', '41': 'Construção Civil', '42': 'Construção Civil', '43': 'Construção Civil',
  '01': 'Agropecuária', '02': 'Agropecuária', '03': 'Agropecuária',
  '13': 'Indústria Têxtil', '14': 'Indústria Têxtil',
  '29': 'Indústria Automotiva', '30': 'Indústria Automotiva',
  '19': 'Combustíveis', '23': 'Mineração',
  '35': 'Energia', '36': 'Saneamento',
  '69': 'Contabilidade / Consultoria', '70': 'Consultoria Empresarial',
  '73': 'Publicidade e Marketing', '74': 'Design e Serviços Técnicos',
  '77': 'Locação de Veículos / Equipamentos',
  '80': 'Segurança Privada', '81': 'Limpeza e Conservação',
};

function inferSegmento(cnaePrincipal: string): string {
  if (!cnaePrincipal) return '';
  const prefix2 = cnaePrincipal.substring(0, 2);
  return CNAE_SEGMENTOS[prefix2] || '';
}

type CnaeSecundario = { codigo: string; descricao: string };
type QuadroSocio = { nome: string; qualificacao: string; faixaEtaria?: string };

const EMPTY_FORM = {
  tipoPessoa: 'juridica' as 'juridica' | 'fisica',
  cnpj: '', cpf: '', razaoSocial: '', nomeFantasia: '', dataAbertura: '',
  regimeTributario: '' as string, situacaoCadastral: 'ativa' as string,
  classificacaoCliente: 'novo' as 'novo' | 'base',
  cnaePrincipal: '', cnaePrincipalDescricao: '', segmentoEconomico: '',
  naturezaJuridica: '', endereco: '', complemento: '', cidade: '', estado: 'SP',
  cnaesSecundarios: [] as CnaeSecundario[],
  quadroSocietario: [] as QuadroSocio[],
  industrializa: false, comercializa: false, prestaServicos: false,
  contribuinteICMS: false, contribuinteIPI: false, regimeMonofasico: false,
  folhaPagamentoMedia: '0', faturamentoMedioMensal: '0', valorMedioGuias: '0',
  processosJudiciaisAtivos: false, parcelamentosAtivos: false,
  atividadePrincipalDescritivo: '',
  parceiroId: undefined as number | undefined,
  procuracaoHabilitada: false, procuracaoCertificado: '', procuracaoValidade: '',
  excecoesEspecificidades: '',
};

export default function Clientes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const filterPrioridade = params.get('prioridade');
  const filterRedFlags = params.get('redflags') === 'true';

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery();
  const { data: parceiros = [] } = trpc.parceiros.list.useQuery();
  const createCliente = trpc.clientes.create.useMutation({
    onSuccess: () => { utils.clientes.list.invalidate(); utils.dashboard.stats.invalidate(); toast.success('Cliente cadastrado com sucesso!'); setShowForm(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const updateCliente = trpc.clientes.update.useMutation({
    onSuccess: () => { utils.clientes.list.invalidate(); toast.success('Cliente atualizado!'); setShowForm(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteCliente = trpc.clientes.delete.useMutation({
    onSuccess: () => { utils.clientes.list.invalidate(); utils.dashboard.stats.invalidate(); toast.success('Cliente removido!'); },
  });
  const toggleCliente = trpc.clientes.toggleActive.useMutation({
    onSuccess: (_, vars) => { utils.clientes.list.invalidate(); toast.success(vars.ativo ? 'Cliente ativado!' : 'Cliente inativado!'); },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setJustificativas({});
  }

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (form.tipoPessoa === 'juridica') {
      if (!form.dataAbertura) missing.push('dataAbertura');
      if (!form.cnaePrincipal) missing.push('cnaePrincipal');
    }
    if (!form.faturamentoMedioMensal || form.faturamentoMedioMensal === '0') missing.push('faturamentoMedioMensal');
    if (!form.valorMedioGuias || form.valorMedioGuias === '0') missing.push('valorMedioGuias');
    if (!form.segmentoEconomico) missing.push('segmentoEconomico');
    return missing;
  }, [form]);

  const consultarCNPJ = async () => {
    const cnpjLimpo = form.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) { toast.error('CNPJ inválido. Deve conter 14 dígitos.'); return; }
    setConsultandoCnpj(true);
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!resp.ok) throw new Error('CNPJ não encontrado');
      const data = await resp.json();

      // CNAEs secundários
      const cnaesSecundarios: CnaeSecundario[] = (data.cnaes_secundarios || []).map((c: any) => ({
        codigo: c.codigo?.toString() || '',
        descricao: c.descricao || '',
      }));

      // Quadro societário
      const quadroSocietario: QuadroSocio[] = (data.qsa || []).map((s: any) => ({
        nome: s.nome_socio || '',
        qualificacao: s.qualificacao_socio || '',
        faixaEtaria: s.faixa_etaria || '',
      }));

      // Segmento econômico baseado no CNAE
      const cnaePrincipal = data.cnae_fiscal?.toString() || '';
      const segmentoAuto = inferSegmento(cnaePrincipal);

      // Complemento do endereço
      const complemento = data.complemento || '';

      setForm(p => ({
        ...p,
        razaoSocial: data.razao_social || p.razaoSocial,
        nomeFantasia: data.nome_fantasia || p.nomeFantasia,
        dataAbertura: data.data_inicio_atividade || p.dataAbertura,
        cnaePrincipal,
        cnaePrincipalDescricao: data.cnae_fiscal_descricao || p.cnaePrincipalDescricao,
        naturezaJuridica: data.natureza_juridica || p.naturezaJuridica,
        endereco: data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'} - ${data.bairro || ''}` : p.endereco,
        complemento: complemento || p.complemento,
        cidade: data.municipio || p.cidade,
        estado: data.uf || p.estado,
        segmentoEconomico: segmentoAuto || p.segmentoEconomico,
        cnaesSecundarios,
        quadroSocietario,
        situacaoCadastral: data.situacao_cadastral === 2 ? 'ativa' :
          data.situacao_cadastral === 3 ? 'suspensa' :
          data.situacao_cadastral === 4 ? 'inapta' :
          data.situacao_cadastral === 8 ? 'baixada' : p.situacaoCadastral,
      }));
      toast.success('Dados do CNPJ preenchidos automaticamente!');
    } catch {
      toast.error('Não foi possível consultar o CNPJ. Preencha manualmente.');
    } finally {
      setConsultandoCnpj(false);
    }
  };

  function handleSave() {
    if (form.tipoPessoa === 'juridica' && (!form.cnpj || !form.razaoSocial)) {
      toast.error('CNPJ e Razão Social são obrigatórios.'); return;
    }
    if (form.tipoPessoa === 'fisica' && (!form.cpf || !form.razaoSocial)) {
      toast.error('CPF e Nome Completo são obrigatórios.'); return;
    }
    if (!form.regimeTributario) {
      toast.error('Regime Tributário é obrigatório.'); return;
    }
    const unjustified = missingFields.filter(f => !justificativas[f]?.trim());
    if (unjustified.length > 0 && !editingId) {
      toast.warning('Preencha os campos faltantes ou forneça justificativa para cada um.'); return;
    }

    const payload: any = {
      ...form,
      cnpj: form.tipoPessoa === 'fisica' ? (form.cpf || 'PF') : form.cnpj,
      folhaPagamentoMedia: form.folhaPagamentoMedia || '0',
      faturamentoMedioMensal: form.faturamentoMedioMensal || '0',
      valorMedioGuias: form.valorMedioGuias || '0',
      usuarioCadastroId: user?.id,
      usuarioCadastroNome: user?.name || 'Usuário',
      alertasInformacao: missingFields.filter(f => justificativas[f]?.trim()).map(f => ({
        campo: f, justificativa: justificativas[f],
      })),
    };

    if (editingId) {
      updateCliente.mutate({ id: editingId, data: payload });
    } else {
      createCliente.mutate(payload);
    }
  }

  function startEdit(cliente: any) {
    setForm({
      tipoPessoa: cliente.tipoPessoa || 'juridica',
      cnpj: cliente.cnpj || '',
      cpf: cliente.cpf || '',
      razaoSocial: cliente.razaoSocial || '',
      nomeFantasia: cliente.nomeFantasia || '',
      dataAbertura: cliente.dataAbertura || '',
      regimeTributario: cliente.regimeTributario || '',
      situacaoCadastral: cliente.situacaoCadastral || 'ativa',
      classificacaoCliente: cliente.classificacaoCliente || 'novo',
      cnaePrincipal: cliente.cnaePrincipal || '',
      cnaePrincipalDescricao: cliente.cnaePrincipalDescricao || '',
      segmentoEconomico: cliente.segmentoEconomico || '',
      naturezaJuridica: cliente.naturezaJuridica || '',
      endereco: cliente.endereco || '',
      complemento: cliente.complemento || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || 'SP',
      cnaesSecundarios: cliente.cnaesSecundarios || [],
      quadroSocietario: cliente.quadroSocietario || [],
      industrializa: !!cliente.industrializa,
      comercializa: !!cliente.comercializa,
      prestaServicos: !!cliente.prestaServicos,
      contribuinteICMS: !!cliente.contribuinteICMS,
      contribuinteIPI: !!cliente.contribuinteIPI,
      regimeMonofasico: !!cliente.regimeMonofasico,
      folhaPagamentoMedia: cliente.folhaPagamentoMedia || '0',
      faturamentoMedioMensal: cliente.faturamentoMedioMensal || '0',
      valorMedioGuias: cliente.valorMedioGuias || '0',
      processosJudiciaisAtivos: !!cliente.processosJudiciaisAtivos,
      parcelamentosAtivos: !!cliente.parcelamentosAtivos,
      atividadePrincipalDescritivo: cliente.atividadePrincipalDescritivo || '',
      parceiroId: cliente.parceiroId || undefined,
      procuracaoHabilitada: !!cliente.procuracaoHabilitada,
      procuracaoCertificado: cliente.procuracaoCertificado || '',
      procuracaoValidade: cliente.procuracaoValidade || '',
      excecoesEspecificidades: cliente.excecoesEspecificidades || '',
    });
    setEditingId(cliente.id);
    setShowForm(true);
  }

  // Verificar status da procuração
  function procuracaoStatus(cliente: any) {
    if (!cliente.procuracaoHabilitada) return 'desabilitada';
    if (!cliente.procuracaoValidade) return 'habilitada';
    const validade = new Date(cliente.procuracaoValidade);
    const hoje = new Date();
    const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias < 0) return 'vencida';
    if (diffDias <= 7) return 'vencendo';
    return 'habilitada';
  }

  const filtered = useMemo(() => {
    let list = clientes;
    if (filterPrioridade) list = list.filter((c: any) => c.prioridade === filterPrioridade);
    if (filterRedFlags) list = list.filter((c: any) => Array.isArray(c.redFlags) && c.redFlags.length > 0);
    if (filterStatus === 'ativos') list = list.filter((c: any) => c.ativo !== false && c.situacaoCadastral === 'ativa');
    if (filterStatus === 'inativos') list = list.filter((c: any) => c.ativo === false || c.situacaoCadastral !== 'ativa');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c: any) =>
        c.razaoSocial?.toLowerCase().includes(s) ||
        c.cnpj?.includes(s) ||
        c.nomeFantasia?.toLowerCase().includes(s) ||
        c.cpf?.includes(s)
      );
    }
    return list;
  }, [clientes, filterPrioridade, filterRedFlags, filterStatus, search]);

  const prioridadeBadge = (p: string) => {
    if (p === 'alta') return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Alta</Badge>;
    if (p === 'media') return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Média</Badge>;
    return <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[10px]">Baixa</Badge>;
  };

  const activeFilter = filterPrioridade || filterRedFlags;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeFilter && (
            <Button variant="ghost" size="icon" onClick={() => setLocation('/clientes')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeFilter ? (
                filterPrioridade ? `Filtrando: Prioridade ${filterPrioridade}` : 'Filtrando: Com Red Flags'
              ) : `${clientes.length} clientes cadastrados`}
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por razão social, CNPJ, CPF ou nome fantasia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((cliente: any) => {
            const redFlagCount = Array.isArray(cliente.redFlags) ? cliente.redFlags.length : 0;
            const parceiroNome = parceiros.find((p: any) => p.id === cliente.parceiroId)?.nomeCompleto;
            const procStatus = procuracaoStatus(cliente);
            const isAtivo = cliente.ativo !== false && cliente.situacaoCadastral === 'ativa';
            return (
              <Card key={cliente.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/clientes/${cliente.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-1.5 h-12 rounded-full shrink-0 ${
                        cliente.prioridade === 'alta' ? 'bg-red-500' :
                        cliente.prioridade === 'media' ? 'bg-amber-500' : 'bg-sky-400'
                      }`} />
                      {cliente.tipoPessoa === 'fisica' ? (
                        <User className="w-8 h-8 text-muted-foreground/40 shrink-0" />
                      ) : (
                        <Building2 className="w-8 h-8 text-muted-foreground/40 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{cliente.razaoSocial}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {cliente.tipoPessoa === 'fisica' ? cliente.cpf || cliente.cnpj : cliente.cnpj}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {cliente.nomeFantasia && <span className="text-xs text-muted-foreground truncate">{cliente.nomeFantasia}</span>}
                          {parceiroNome && <Badge variant="outline" className="text-[9px] h-4">{parceiroNome}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
                      {/* Classificação Novo/Base */}
                      <Badge className={`text-[10px] ${cliente.classificacaoCliente === 'novo' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {cliente.classificacaoCliente === 'novo' ? 'Novo' : 'Base'}
                      </Badge>
                      {/* Procuração */}
                      {procStatus === 'vencida' && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] gap-1">
                          <ShieldAlert className="w-3 h-3" /> Proc. Vencida
                        </Badge>
                      )}
                      {procStatus === 'vencendo' && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-1">
                          <CalendarClock className="w-3 h-3" /> Proc. Vencendo
                        </Badge>
                      )}
                      {procStatus === 'desabilitada' && (
                        <Badge className="bg-red-50 text-red-500 border-red-100 text-[10px] gap-1">
                          <ShieldAlert className="w-3 h-3" /> S/ Proc.
                        </Badge>
                      )}
                      {procStatus === 'habilitada' && (
                        <Badge className="bg-green-50 text-green-600 border-green-100 text-[10px] gap-1">
                          <ShieldCheck className="w-3 h-3" /> Proc. OK
                        </Badge>
                      )}
                      {redFlagCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <Flag className="w-3 h-3" /> {redFlagCount}
                        </Badge>
                      )}
                      {prioridadeBadge(cliente.prioridade)}
                      <Badge variant={isAtivo ? 'default' : 'secondary'} className={`text-[10px] ${isAtivo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                        {isAtivo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/clientes/${cliente.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startEdit(cliente)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleCliente.mutate({ id: cliente.id, ativo: !isAtivo })}>
                            {isAtivo ? <><PowerOff className="w-4 h-4 mr-2" /> Inativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => setConfirmDelete(cliente)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2" style={{ minHeight: 0 }}>
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-4 sticky top-0 z-10 bg-background">
                <TabsTrigger value="dados" className="text-xs">Dados Básicos</TabsTrigger>
                <TabsTrigger value="cnae" className="text-xs">CNAE e Segmento</TabsTrigger>
                <TabsTrigger value="atividades" className="text-xs">Atividades</TabsTrigger>
                <TabsTrigger value="financeiro" className="text-xs">Financeiro</TabsTrigger>
                <TabsTrigger value="procuracao" className="text-xs">Procuração</TabsTrigger>
              </TabsList>

              {/* ===== ABA 1: DADOS BÁSICOS ===== */}
              <TabsContent value="dados" className="space-y-5">
                {/* Tipo de Pessoa */}
                <div>
                  <Label className="text-xs font-semibold">Tipo de Pessoa</Label>
                  <div className="flex gap-3 mt-2">
                    <Button
                      type="button"
                      variant={form.tipoPessoa === 'juridica' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, tipoPessoa: 'juridica' }))}
                      className="gap-2"
                    >
                      <Building2 className="w-4 h-4" /> Pessoa Jurídica
                    </Button>
                    <Button
                      type="button"
                      variant={form.tipoPessoa === 'fisica' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, tipoPessoa: 'fisica' }))}
                      className="gap-2"
                    >
                      <User className="w-4 h-4" /> Pessoa Física
                    </Button>
                  </div>
                </div>

                {/* Classificação Novo/Base */}
                <div>
                  <Label className="text-xs font-semibold">Classificação do Cliente</Label>
                  <div className="flex gap-3 mt-2">
                    <Button
                      type="button"
                      variant={form.classificacaoCliente === 'novo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, classificacaoCliente: 'novo' }))}
                      className={`gap-2 ${form.classificacaoCliente === 'novo' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      Cliente Novo
                    </Button>
                    <Button
                      type="button"
                      variant={form.classificacaoCliente === 'base' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, classificacaoCliente: 'base' }))}
                    >
                      Cliente Base
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Clientes novos são convertidos automaticamente para "Base" após 90 dias.
                  </p>
                </div>

                <Separator />

                {form.tipoPessoa === 'juridica' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">CNPJ *</Label>
                      <div className="flex gap-2">
                        <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="h-9 text-sm" />
                        <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1 text-xs" onClick={consultarCNPJ} disabled={consultandoCnpj}>
                          {consultandoCnpj ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                          Consultar
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Razão Social *</Label>
                      <Input value={form.razaoSocial} onChange={e => setForm({ ...form, razaoSocial: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Nome Fantasia</Label>
                      <Input value={form.nomeFantasia} onChange={e => setForm({ ...form, nomeFantasia: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Data de Abertura</Label>
                      <Input type="date" value={form.dataAbertura} onChange={e => setForm({ ...form, dataAbertura: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Natureza Jurídica</Label>
                      <Input value={form.naturezaJuridica} onChange={e => setForm({ ...form, naturezaJuridica: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Regime Tributário *</Label>
                      <Select value={form.regimeTributario} onValueChange={v => setForm({ ...form, regimeTributario: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                          <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                          <SelectItem value="lucro_real">Lucro Real</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Situação Cadastral</Label>
                      <Select value={form.situacaoCadastral} onValueChange={v => setForm({ ...form, situacaoCadastral: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativa">Ativa</SelectItem>
                          <SelectItem value="baixada">Baixada</SelectItem>
                          <SelectItem value="inapta">Inapta</SelectItem>
                          <SelectItem value="suspensa">Suspensa</SelectItem>
                          <SelectItem value="nula">Nula</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  /* Pessoa Física */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">CPF *</Label>
                      <Input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Nome Completo *</Label>
                      <Input value={form.razaoSocial} onChange={e => setForm({ ...form, razaoSocial: e.target.value })} className="h-9 text-sm" placeholder="Nome completo" />
                    </div>
                    <div>
                      <Label className="text-xs">Regime Tributário *</Label>
                      <Select value={form.regimeTributario} onValueChange={v => setForm({ ...form, regimeTributario: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                          <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                          <SelectItem value="lucro_real">Lucro Real</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Situação Cadastral</Label>
                      <Select value={form.situacaoCadastral} onValueChange={v => setForm({ ...form, situacaoCadastral: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativa">Ativa</SelectItem>
                          <SelectItem value="baixada">Baixada</SelectItem>
                          <SelectItem value="inapta">Inapta</SelectItem>
                          <SelectItem value="suspensa">Suspensa</SelectItem>
                          <SelectItem value="nula">Nula</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Endereço */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Endereço</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Logradouro, Número, Bairro</Label>
                      <Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="h-9 text-sm" placeholder="Rua, número, bairro" />
                    </div>
                    <div>
                      <Label className="text-xs">Complemento</Label>
                      <Input value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} className="h-9 text-sm" placeholder="Sala, andar, bloco..." />
                    </div>
                    <div>
                      <Label className="text-xs">Cidade</Label>
                      <Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Estado (UF)</Label>
                      <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {estadosBR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Parceiro Comercial */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Parceiro Comercial</h3>
                  <Select value={form.parceiroId?.toString() || 'none'} onValueChange={v => setForm({ ...form, parceiroId: v === 'none' ? undefined : Number(v) })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {parceiros.filter((p: any) => p.ativo).map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.nomeCompleto}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exceções */}
                <div>
                  <Label className="text-xs">Exceções / Especificidades</Label>
                  <Textarea value={form.excecoesEspecificidades} onChange={e => setForm({ ...form, excecoesEspecificidades: e.target.value })} rows={3} className="text-sm" placeholder="Descreva exceções ou especificidades do cliente..." />
                </div>
              </TabsContent>

              {/* ===== ABA 2: CNAE E SEGMENTO ===== */}
              <TabsContent value="cnae" className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">CNAE Principal</Label>
                    <Input value={form.cnaePrincipal} onChange={e => {
                      const val = e.target.value;
                      const seg = inferSegmento(val);
                      setForm(f => ({ ...f, cnaePrincipal: val, segmentoEconomico: seg || f.segmentoEconomico }));
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Descrição CNAE</Label>
                    <Input value={form.cnaePrincipalDescricao} onChange={e => setForm({ ...form, cnaePrincipalDescricao: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Segmento Econômico</Label>
                    <Input value={form.segmentoEconomico} onChange={e => setForm({ ...form, segmentoEconomico: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>

                {/* CNAEs Secundários */}
                {form.cnaesSecundarios.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">CNAEs Secundários ({form.cnaesSecundarios.length})</h3>
                    <div className="max-h-48 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs w-[120px]">Código</TableHead>
                            <TableHead className="text-xs">Descrição</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {form.cnaesSecundarios.map((cnae, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-mono py-1">{cnae.codigo}</TableCell>
                              <TableCell className="text-xs py-1">{cnae.descricao}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Quadro Societário */}
                {form.quadroSocietario.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Quadro Societário ({form.quadroSocietario.length})</h3>
                    <div className="max-h-48 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Nome</TableHead>
                            <TableHead className="text-xs">Qualificação</TableHead>
                            <TableHead className="text-xs w-[100px]">Faixa Etária</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {form.quadroSocietario.map((socio, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs py-1">{socio.nome}</TableCell>
                              <TableCell className="text-xs py-1">{socio.qualificacao}</TableCell>
                              <TableCell className="text-xs py-1">{socio.faixaEtaria || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {form.cnaesSecundarios.length === 0 && form.quadroSocietario.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Consulte o CNPJ na aba "Dados Básicos" para preencher automaticamente os CNAEs secundários e o quadro societário.
                  </div>
                )}
              </TabsContent>

              {/* ===== ABA 3: ATIVIDADES ===== */}
              <TabsContent value="atividades" className="space-y-5">
                <h3 className="text-sm font-semibold mb-3">Atividades e Tributos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'industrializa', label: 'Industrializa' },
                    { key: 'comercializa', label: 'Comercializa' },
                    { key: 'prestaServicos', label: 'Presta Serviços' },
                    { key: 'contribuinteICMS', label: 'Contribuinte ICMS' },
                    { key: 'contribuinteIPI', label: 'Contribuinte IPI' },
                    { key: 'regimeMonofasico', label: 'Regime Monofásico' },
                    { key: 'processosJudiciaisAtivos', label: 'Processos Judiciais' },
                    { key: 'parcelamentosAtivos', label: 'Parcelamentos Ativos' },
                  ].map(sw => (
                    <div key={sw.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <Label className="text-xs">{sw.label}</Label>
                      <Switch checked={(form as any)[sw.key]} onCheckedChange={v => setForm({ ...form, [sw.key]: v })} />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ===== ABA 4: FINANCEIRO ===== */}
              <TabsContent value="financeiro" className="space-y-5">
                <h3 className="text-sm font-semibold mb-3">Dados Financeiros</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Faturamento Médio (R$)</Label>
                    <Input type="number" value={form.faturamentoMedioMensal} onChange={e => setForm({ ...form, faturamentoMedioMensal: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Valor Médio Guias (R$)</Label>
                    <Input type="number" value={form.valorMedioGuias} onChange={e => setForm({ ...form, valorMedioGuias: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Folha Pagamento Média (R$)</Label>
                    <Input type="number" value={form.folhaPagamentoMedia} onChange={e => setForm({ ...form, folhaPagamentoMedia: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>

                {/* Missing fields alerts */}
                {missingFields.length > 0 && !editingId && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">Campos com informações faltantes</span>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                      Forneça uma justificativa para cada campo faltante para prosseguir com o cadastro.
                    </p>
                    <div className="space-y-2">
                      {missingFields.map(field => (
                        <div key={field} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] shrink-0 w-32 justify-center">{fieldLabel(field)}</Badge>
                          <Input
                            placeholder="Justificativa..."
                            value={justificativas[field] || ''}
                            onChange={e => setJustificativas({ ...justificativas, [field]: e.target.value })}
                            className="h-7 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ===== ABA 5: PROCURAÇÃO ===== */}
              <TabsContent value="procuracao" className="space-y-5">
                <h3 className="text-sm font-semibold mb-3">Procuração Eletrônica</h3>

                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  <Switch checked={form.procuracaoHabilitada} onCheckedChange={v => setForm({ ...form, procuracaoHabilitada: v })} />
                  <div>
                    <Label className="text-sm font-medium">
                      {form.procuracaoHabilitada ? (
                        <span className="text-green-600 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Habilitada</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Desabilitada</span>
                      )}
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      {form.procuracaoHabilitada ? 'Procuração eletrônica está ativa para este cliente.' : 'Procuração eletrônica não está habilitada. Ative para configurar.'}
                    </p>
                  </div>
                </div>

                {form.procuracaoHabilitada && (
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-green-50/50 border border-green-100">
                    <div>
                      <Label className="text-xs">Certificado Vinculado *</Label>
                      <Select value={form.procuracaoCertificado || 'none'} onValueChange={v => setForm({ ...form, procuracaoCertificado: v === 'none' ? '' : v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Selecione...</SelectItem>
                          <SelectItem value="Gercino Neto">Gercino Neto</SelectItem>
                          <SelectItem value="Evox Fiscal">Evox Fiscal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Data de Validade *</Label>
                      <Input type="date" value={form.procuracaoValidade} onChange={e => setForm({ ...form, procuracaoValidade: e.target.value })} className="h-9 text-sm" />
                    </div>
                    {form.procuracaoValidade && (() => {
                      const validade = new Date(form.procuracaoValidade);
                      const hoje = new Date();
                      const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                      if (diffDias < 0) return (
                        <div className="col-span-2 p-3 rounded-lg bg-red-100 border border-red-200 flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="text-sm font-semibold text-red-700">Procuração Vencida</p>
                            <p className="text-xs text-red-600">Venceu há {Math.abs(diffDias)} dias. Renove imediatamente.</p>
                          </div>
                        </div>
                      );
                      if (diffDias <= 7) return (
                        <div className="col-span-2 p-3 rounded-lg bg-amber-100 border border-amber-200 flex items-center gap-2">
                          <CalendarClock className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="text-sm font-semibold text-amber-700">Próximo ao Vencimento</p>
                            <p className="text-xs text-amber-600">Vence em {diffDias} dia{diffDias !== 1 ? 's' : ''}. Providencie a renovação.</p>
                          </div>
                        </div>
                      );
                      return (
                        <div className="col-span-2 p-3 rounded-lg bg-green-100 border border-green-200 flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-semibold text-green-700">Procuração Válida</p>
                            <p className="text-xs text-green-600">Vence em {diffDias} dias ({validade.toLocaleDateString('pt-BR')}).</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="pt-4 border-t shrink-0">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createCliente.isPending || updateCliente.isPending}>
              {(createCliente.isPending || updateCliente.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o cliente <strong>{confirmDelete?.razaoSocial}</strong>? Esta ação não pode ser desfeita. Considere inativar o cliente ao invés de excluir.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { deleteCliente.mutate({ id: confirmDelete.id }); setConfirmDelete(null); }} disabled={deleteCliente.isPending}>
              {deleteCliente.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Excluir Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    dataAbertura: 'Data de Abertura',
    cnaePrincipal: 'CNAE Principal',
    faturamentoMedioMensal: 'Faturamento Médio',
    valorMedioGuias: 'Valor Médio Guias',
    segmentoEconomico: 'Segmento',
  };
  return labels[field] || field;
}
