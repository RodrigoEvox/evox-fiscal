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
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Plus, Search, Flag, AlertTriangle, Eye, Pencil, Trash2, Loader2,
  Building2, ArrowLeft, MoreVertical, Power, PowerOff, Filter,
} from 'lucide-react';

const estadosBR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const EMPTY_FORM = {
  cnpj: '', razaoSocial: '', nomeFantasia: '', dataAbertura: '',
  regimeTributario: 'lucro_real' as string, situacaoCadastral: 'ativa' as string,
  cnaePrincipal: '', cnaePrincipalDescricao: '', segmentoEconomico: '',
  naturezaJuridica: '',  endereco: '', cidade: '', estado: 'SP',  industrializa: false, comercializa: false, prestaServicos: false,
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

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery();
  const { data: parceiros = [] } = trpc.parceiros.list.useQuery();
  const createCliente = trpc.clientes.create.useMutation({
    onSuccess: () => { utils.clientes.list.invalidate(); utils.dashboard.stats.invalidate(); toast.success('Cliente cadastrado e análise automática executada!'); setShowForm(false); resetForm(); },
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
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setJustificativas({});
  }

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!form.dataAbertura) missing.push('dataAbertura');
    if (!form.cnaePrincipal) missing.push('cnaePrincipal');
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
      setForm(p => ({
        ...p,
        razaoSocial: data.razao_social || p.razaoSocial,
        nomeFantasia: data.nome_fantasia || p.nomeFantasia,
        dataAbertura: data.data_inicio_atividade || p.dataAbertura,
        cnaePrincipal: data.cnae_fiscal?.toString() || p.cnaePrincipal,
        cnaePrincipalDescricao: data.cnae_fiscal_descricao || p.cnaePrincipalDescricao,
        naturezaJuridica: data.natureza_juridica || p.naturezaJuridica,
        endereco: data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'} - ${data.bairro || ''}` : p.endereco,
        cidade: data.municipio || p.cidade,
        estado: data.uf || p.estado,
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
    if (!form.cnpj || !form.razaoSocial) {
      toast.error('CNPJ e Razão Social são obrigatórios.');
      return;
    }
    const unjustified = missingFields.filter(f => !justificativas[f]?.trim());
    if (unjustified.length > 0 && !editingId) {
      toast.warning('Preencha os campos faltantes ou forneça justificativa para cada um.');
      return;
    }

    const payload: any = {
      ...form,
      folhaPagamentoMedia: form.folhaPagamentoMedia || '0',
      faturamentoMedioMensal: form.faturamentoMedioMensal || '0',
      valorMedioGuias: form.valorMedioGuias || '0',
      usuarioCadastroId: user?.id,
      usuarioCadastroNome: user?.name || 'Usuário',
      alertasInformacao: missingFields.filter(f => justificativas[f]?.trim()).map(f => ({
        campo: f,
        justificativa: justificativas[f],
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
      cnpj: cliente.cnpj || '',
      razaoSocial: cliente.razaoSocial || '',
      nomeFantasia: cliente.nomeFantasia || '',
      dataAbertura: cliente.dataAbertura || '',
      regimeTributario: cliente.regimeTributario || 'lucro_real',
      situacaoCadastral: cliente.situacaoCadastral || 'ativa',
      cnaePrincipal: cliente.cnaePrincipal || '',
      cnaePrincipalDescricao: cliente.cnaePrincipalDescricao || '',
      segmentoEconomico: cliente.segmentoEconomico || '',
      naturezaJuridica: cliente.naturezaJuridica || '',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || 'SP',
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

  const filtered = useMemo(() => {
    let list = clientes;
    if (filterPrioridade) list = list.filter((c: any) => c.prioridade === filterPrioridade);
    if (filterRedFlags) list = list.filter((c: any) => Array.isArray(c.redFlags) && c.redFlags.length > 0);
    if (filterStatus === 'ativos') list = list.filter((c: any) => c.situacaoCadastral === 'ativa');
    if (filterStatus === 'inativos') list = list.filter((c: any) => c.situacaoCadastral !== 'ativa');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c: any) =>
        c.razaoSocial?.toLowerCase().includes(s) ||
        c.cnpj?.includes(s) ||
        c.nomeFantasia?.toLowerCase().includes(s)
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
          <Input placeholder="Buscar por razão social, CNPJ ou nome fantasia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
            return (
              <Card key={cliente.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/clientes/${cliente.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-1.5 h-12 rounded-full shrink-0 ${
                        cliente.prioridade === 'alta' ? 'bg-red-500' :
                        cliente.prioridade === 'media' ? 'bg-amber-500' : 'bg-sky-400'
                      }`} />
                      <Building2 className="w-8 h-8 text-muted-foreground/40 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{cliente.razaoSocial}</p>
                        <p className="text-xs text-muted-foreground font-mono">{cliente.cnpj}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {cliente.nomeFantasia && <span className="text-xs text-muted-foreground truncate">{cliente.nomeFantasia}</span>}
                          {parceiroNome && <Badge variant="outline" className="text-[9px] h-4">{parceiroNome}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {redFlagCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <Flag className="w-3 h-3" /> {redFlagCount}
                        </Badge>
                      )}
                      {Array.isArray(cliente.alertasInformacao) && cliente.alertasInformacao.length > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-1">
                          <AlertTriangle className="w-3 h-3" /> {cliente.alertasInformacao.length}
                        </Badge>
                      )}
                      {prioridadeBadge(cliente.prioridade)}
                      <Badge variant={cliente.situacaoCadastral === 'ativa' ? 'default' : 'secondary'} className={`text-[10px] ${cliente.situacaoCadastral === 'ativa' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                        {cliente.situacaoCadastral === 'ativa' ? 'Ativo' : 'Inativo'}
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
                          <DropdownMenuItem onClick={() => toggleCliente.mutate({ id: cliente.id, ativo: cliente.situacaoCadastral !== 'ativa' })}>
                            {cliente.situacaoCadastral === 'ativa' ? <><PowerOff className="w-4 h-4 mr-2" /> Inativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
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
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Dados Básicos */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Dados Básicos</h3>
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
                  </div>                  <div>
                    <Label className="text-xs">Endereço</Label>
                    <Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="h-9 text-sm" placeholder="Rua, número, bairro" />
                  </div>
                  <div>
                    <Label className="text-xs">Natureza Jurídica</Label>
                    <Input type="date" value={form.dataAbertura} onChange={e => setForm({ ...form, dataAbertura: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Regime Tributário *</Label>
                    <Select value={form.regimeTributario} onValueChange={v => setForm({ ...form, regimeTributario: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
              </div>

              <Separator />

              {/* Parceiro */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Parceiro Comercial</h3>
                <Select value={form.parceiroId?.toString() || 'none'} onValueChange={v => setForm({ ...form, parceiroId: v === 'none' ? undefined : Number(v) })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {parceiros.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.nomeCompleto}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Procuração */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Procuração Eletrônica</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.procuracaoHabilitada} onCheckedChange={v => setForm({ ...form, procuracaoHabilitada: v })} />
                    <Label className="text-xs">Habilitada</Label>
                  </div>
                  {form.procuracaoHabilitada && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Certificado</Label>
                        <Input value={form.procuracaoCertificado} onChange={e => setForm({ ...form, procuracaoCertificado: e.target.value })} className="h-9 text-sm" placeholder="Nº do certificado" />
                      </div>
                      <div>
                        <Label className="text-xs">Validade</Label>
                        <Input type="date" value={form.procuracaoValidade} onChange={e => setForm({ ...form, procuracaoValidade: e.target.value })} className="h-9 text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* CNAE e Segmento */}
              <div>
                <h3 className="text-sm font-semibold mb-3">CNAE e Segmento</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">CNAE Principal</Label>
                    <Input value={form.cnaePrincipal} onChange={e => setForm({ ...form, cnaePrincipal: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Descrição CNAE</Label>
                    <Input value={form.cnaePrincipalDescricao} onChange={e => setForm({ ...form, cnaePrincipalDescricao: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Segmento Econômico</Label>
                    <Input value={form.segmentoEconomico} onChange={e => setForm({ ...form, segmentoEconomico: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Cidade</Label>
                    <Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="h-9 text-sm" placeholder="Cidade" />
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

              {/* Atividades */}
              <div>
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
                    <div key={sw.key} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <Label className="text-xs">{sw.label}</Label>
                      <Switch checked={(form as any)[sw.key]} onCheckedChange={v => setForm({ ...form, [sw.key]: v })} />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Financeiro */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Dados Financeiros</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Faturamento Médio Mensal (R$)</Label>
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
              </div>

              <Separator />

              {/* Exceções */}
              <div>
                <Label className="text-xs">Exceções / Especificidades</Label>
                <Textarea value={form.excecoesEspecificidades} onChange={e => setForm({ ...form, excecoesEspecificidades: e.target.value })} rows={3} className="text-sm" placeholder="Descreva exceções ou especificidades do cliente..." />
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
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
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
