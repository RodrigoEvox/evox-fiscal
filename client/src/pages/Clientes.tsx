/*
 * Clientes — Evox Fiscal (v2)
 * Cadastro completo com RED FLAGS, alertas, justificativas, parceiro, procuração, exceções, consulta CNPJ
 */

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, Search, Flag, AlertTriangle, FileSpreadsheet, FileText,
  Trash2, Edit, Eye, Building2, Filter, Loader2, FileKey, Clock, User,
} from 'lucide-react';
import { exportarClientesExcel, exportarClientesPDF } from '@/lib/export-utils';
import { verificarInformacoesFaltantes } from '@/lib/rules-engine';
import type { Cliente, RegimeTributario, SituacaoCadastral, CertificadoDigital } from '@/lib/types';

const estadosBR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function ClienteForm({ cliente, onSave, onCancel, parceiros }: {
  cliente?: Cliente;
  onSave: (data: any) => void;
  onCancel: () => void;
  parceiros: { id: string; nome: string }[];
}) {
  const [form, setForm] = useState({
    cnpj: cliente?.cnpj || '',
    razaoSocial: cliente?.razaoSocial || '',
    nomeFantasia: cliente?.nomeFantasia || '',
    dataAbertura: cliente?.dataAbertura || '',
    regimeTributario: (cliente?.regimeTributario || 'lucro_presumido') as RegimeTributario,
    situacaoCadastral: (cliente?.situacaoCadastral || 'ativa') as SituacaoCadastral,
    cnaePrincipal: cliente?.cnaePrincipal || '',
    cnaePrincipalDescricao: cliente?.cnaePrincipalDescricao || '',
    segmentoEconomico: cliente?.segmentoEconomico || '',
    naturezaJuridica: cliente?.naturezaJuridica || '',
    industrializa: cliente?.industrializa || false,
    comercializa: cliente?.comercializa || false,
    prestaServicos: cliente?.prestaServicos || false,
    contribuinteICMS: cliente?.contribuinteICMS || false,
    contribuinteIPI: cliente?.contribuinteIPI || false,
    regimeMonofasico: cliente?.regimeMonofasico || false,
    folhaPagamentoMedia: cliente?.folhaPagamentoMedia || 0,
    faturamentoMedioMensal: cliente?.faturamentoMedioMensal || 0,
    valorMedioGuias: cliente?.valorMedioGuias || 0,
    processosJudiciaisAtivos: cliente?.processosJudiciaisAtivos || false,
    parcelamentosAtivos: cliente?.parcelamentosAtivos || false,
    estado: cliente?.estado || 'SP',
    atividadePrincipalDescritivo: cliente?.atividadePrincipalDescritivo || '',
    observacoes: cliente?.observacoes || '',
    // New fields
    parceiroId: cliente?.parceiroId || '',
    procuracao: cliente?.procuracao || { habilitada: false } as {
      habilitada: boolean;
      certificadoDigital?: CertificadoDigital;
      certificadoOutroNome?: string;
      dataValidade?: string;
    },
    excecoesEspecificidades: cliente?.excecoesEspecificidades || '',
  });

  const [alertJustificativas, setAlertJustificativas] = useState<Record<string, string>>({});
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const alertas = verificarInformacoesFaltantes(form as any);
  const alertasPendentes = alertas.filter(a => !form[a.campo as keyof typeof form] && !alertJustificativas[a.campo]);

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
        estado: data.uf || p.estado,
        situacaoCadastral: (data.situacao_cadastral === 2 ? 'ativa' :
          data.situacao_cadastral === 3 ? 'suspensa' :
          data.situacao_cadastral === 4 ? 'inapta' :
          data.situacao_cadastral === 8 ? 'baixada' : p.situacaoCadastral) as SituacaoCadastral,
      }));
      toast.success('Dados do CNPJ preenchidos automaticamente!');
    } catch {
      toast.error('Não foi possível consultar o CNPJ. Preencha manualmente.');
    } finally {
      setConsultandoCnpj(false);
    }
  };

  const handleSubmit = () => {
    if (!form.cnpj || !form.razaoSocial) { toast.error('CNPJ e Razão Social são obrigatórios.'); return; }
    if (alertasPendentes.length > 0) {
      toast.error('Preencha os campos obrigatórios ou forneça justificativa para prosseguir.');
      return;
    }
    onSave(form);
  };

  return (
    <ScrollArea className="max-h-[75vh]">
      <div className="space-y-6 p-1 pr-4">
        {/* Alertas de informações faltantes */}
        {alertas.length > 0 && alertas.some(a => !form[a.campo as keyof typeof form]) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">Informações faltantes detectadas</span>
            </div>
            {alertas.filter(a => !form[a.campo as keyof typeof form]).map(alerta => (
              <div key={alerta.campo} className="text-xs space-y-1">
                <p className="text-amber-700">{alerta.mensagem}</p>
                <Input
                  placeholder="Justificativa para prosseguir sem este campo..."
                  value={alertJustificativas[alerta.campo] || ''}
                  onChange={e => setAlertJustificativas(prev => ({ ...prev, [alerta.campo]: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>
            ))}
          </div>
        )}

        {/* Dados Básicos */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Dados Básicos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">CNPJ *</Label>
              <div className="flex gap-2">
                <Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="h-9 text-sm" />
                <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1 text-xs" onClick={consultarCNPJ} disabled={consultandoCnpj}>
                  {consultandoCnpj ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  Consultar
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Razão Social *</Label>
              <Input value={form.razaoSocial} onChange={e => setForm(p => ({ ...p, razaoSocial: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Nome Fantasia</Label>
              <Input value={form.nomeFantasia} onChange={e => setForm(p => ({ ...p, nomeFantasia: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Data de Abertura *</Label>
              <Input type="date" value={form.dataAbertura} onChange={e => setForm(p => ({ ...p, dataAbertura: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Regime Tributário *</Label>
              <Select value={form.regimeTributario} onValueChange={v => setForm(p => ({ ...p, regimeTributario: v as RegimeTributario }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Situação Cadastral *</Label>
              <Select value={form.situacaoCadastral} onValueChange={v => setForm(p => ({ ...p, situacaoCadastral: v as SituacaoCadastral }))}>
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

        {/* Parceiro Comercial */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Parceiro Comercial</h3>
          <Select value={form.parceiroId || 'nenhum'} onValueChange={v => setForm(p => ({ ...p, parceiroId: v === 'nenhum' ? '' : v }))}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione o parceiro..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhum">Nenhum parceiro</SelectItem>
              {parceiros.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Procuração Eletrônica */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Procuração Eletrônica</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Procuração habilitada?</Label>
              <Switch
                checked={form.procuracao.habilitada}
                onCheckedChange={v => setForm(p => ({ ...p, procuracao: { ...p.procuracao, habilitada: v } }))}
              />
            </div>
            {form.procuracao.habilitada && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Certificado Digital</Label>
                  <Select
                    value={form.procuracao.certificadoDigital || 'evox_fiscal'}
                    onValueChange={v => setForm(p => ({ ...p, procuracao: { ...p.procuracao, certificadoDigital: v as CertificadoDigital } }))}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="evox_fiscal">Evox Fiscal</SelectItem>
                      <SelectItem value="gercino_neto">Gercino Neto</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.procuracao.certificadoDigital === 'outro' && (
                  <div>
                    <Label className="text-xs">Nome do Certificado</Label>
                    <Input
                      value={form.procuracao.certificadoOutroNome || ''}
                      onChange={e => setForm(p => ({ ...p, procuracao: { ...p.procuracao, certificadoOutroNome: e.target.value } }))}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Data de Validade</Label>
                  <Input
                    type="date"
                    value={form.procuracao.dataValidade || ''}
                    onChange={e => setForm(p => ({ ...p, procuracao: { ...p.procuracao, dataValidade: e.target.value } }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* CNAE e Segmento */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">CNAE e Segmento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">CNAE Principal *</Label>
              <Input value={form.cnaePrincipal} onChange={e => setForm(p => ({ ...p, cnaePrincipal: e.target.value }))} placeholder="0000-0/00" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Descrição CNAE</Label>
              <Input value={form.cnaePrincipalDescricao} onChange={e => setForm(p => ({ ...p, cnaePrincipalDescricao: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Segmento Econômico *</Label>
              <Input value={form.segmentoEconomico} onChange={e => setForm(p => ({ ...p, segmentoEconomico: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Natureza Jurídica *</Label>
              <Input value={form.naturezaJuridica} onChange={e => setForm(p => ({ ...p, naturezaJuridica: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Estado *</Label>
              <Select value={form.estado} onValueChange={v => setForm(p => ({ ...p, estado: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {estadosBR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Atividades e Tributos */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Atividades e Tributos</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'industrializa', label: 'Industrializa' },
              { key: 'comercializa', label: 'Comercializa Mercadorias' },
              { key: 'prestaServicos', label: 'Presta Serviços' },
              { key: 'contribuinteICMS', label: 'Contribuinte de ICMS' },
              { key: 'contribuinteIPI', label: 'Contribuinte de IPI' },
              { key: 'regimeMonofasico', label: 'Regime Monofásico' },
              { key: 'processosJudiciaisAtivos', label: 'Processos Judiciais Ativos' },
              { key: 'parcelamentosAtivos', label: 'Parcelamentos Ativos' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <Label className="text-xs">{item.label}</Label>
                <Switch
                  checked={form[item.key as keyof typeof form] as boolean}
                  onCheckedChange={v => setForm(p => ({ ...p, [item.key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Financeiro */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Dados Financeiros</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Faturamento Médio Mensal (R$) *</Label>
              <Input type="number" value={form.faturamentoMedioMensal} onChange={e => setForm(p => ({ ...p, faturamentoMedioMensal: Number(e.target.value) }))} className="h-9 text-sm font-data" />
            </div>
            <div>
              <Label className="text-xs">Valor Médio das Guias (R$) *</Label>
              <Input type="number" value={form.valorMedioGuias} onChange={e => setForm(p => ({ ...p, valorMedioGuias: Number(e.target.value) }))} className="h-9 text-sm font-data" />
            </div>
            <div>
              <Label className="text-xs">Folha de Pagamento Média (R$) *</Label>
              <Input type="number" value={form.folhaPagamentoMedia} onChange={e => setForm(p => ({ ...p, folhaPagamentoMedia: Number(e.target.value) }))} className="h-9 text-sm font-data" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Exceções e Especificidades */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Exceções e Especificidades</h3>
          <Textarea
            value={form.excecoesEspecificidades}
            onChange={e => setForm(p => ({ ...p, excecoesEspecificidades: e.target.value }))}
            rows={3} className="text-sm"
            placeholder="Descreva exceções tributárias, regimes especiais, benefícios fiscais, ou qualquer especificidade relevante..."
          />
        </div>

        <Separator />

        {/* Descrição e Observações */}
        <div>
          <Label className="text-xs">Atividade Principal (Descrição Detalhada)</Label>
          <Textarea value={form.atividadePrincipalDescritivo} onChange={e => setForm(p => ({ ...p, atividadePrincipalDescritivo: e.target.value }))} rows={3} className="text-sm" />
        </div>
        <div>
          <Label className="text-xs">Observações</Label>
          <Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="text-sm" />
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
            {cliente ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </div>
    </ScrollArea>
  );
}

export default function Clientes() {
  const { state, dispatch, getPermissoes, getParceiroNome } = useApp();
  const perm = getPermissoes();
  const [search, setSearch] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('todas');
  const [filterRegime, setFilterRegime] = useState<string>('todos');
  const [filterParceiro, setFilterParceiro] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | undefined>();
  const [viewCliente, setViewCliente] = useState<Cliente | null>(null);

  const parceirosOptions = state.parceiros.filter(p => p.ativo).map(p => ({ id: p.id, nome: p.nomeCompleto }));

  const filteredClientes = useMemo(() => {
    return state.clientes.filter(c => {
      const matchSearch = !search || c.razaoSocial.toLowerCase().includes(search.toLowerCase())
        || c.cnpj.includes(search) || (c.nomeFantasia || '').toLowerCase().includes(search.toLowerCase());
      const matchPrioridade = filterPrioridade === 'todas' || c.prioridade === filterPrioridade;
      const matchRegime = filterRegime === 'todos' || c.regimeTributario === filterRegime;
      const matchParceiro = filterParceiro === 'todos' || c.parceiroId === filterParceiro;
      return matchSearch && matchPrioridade && matchRegime && matchParceiro;
    });
  }, [state.clientes, search, filterPrioridade, filterRegime, filterParceiro]);

  const handleSave = (data: any) => {
    if (editingCliente) {
      dispatch({ type: 'UPDATE_CLIENTE', payload: { ...editingCliente, ...data } });
      toast.success('Cliente atualizado com sucesso!');
    } else {
      dispatch({ type: 'ADD_CLIENTE', payload: data });
      toast.success('Cliente cadastrado com sucesso!');
    }
    setDialogOpen(false);
    setEditingCliente(undefined);
  };

  const handleDelete = (id: string) => {
    if (!perm.podeExcluirCliente) { toast.error('Sem permissão.'); return; }
    dispatch({ type: 'DELETE_CLIENTE', payload: id });
    toast.success('Cliente removido.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciamento de clientes e análise de RED FLAGS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportarClientesExcel(filteredClientes)}>
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportarClientesPDF(filteredClientes)}>
            <FileText className="w-3.5 h-3.5" /> PDF
          </Button>
          {perm.podeIncluirCliente && (
            <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditingCliente(undefined); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-[#0A2540] hover:bg-[#0A2540]/90">
                  <Plus className="w-4 h-4" /> Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                  <DialogDescription>Preencha os dados do cliente. Campos com * são obrigatórios.</DialogDescription>
                </DialogHeader>
                <ClienteForm
                  cliente={editingCliente}
                  onSave={handleSave}
                  onCancel={() => { setDialogOpen(false); setEditingCliente(undefined); }}
                  parceiros={parceirosOptions}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por razão social, CNPJ ou nome fantasia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
              <SelectTrigger className="w-40 h-9 text-sm"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRegime} onValueChange={setFilterRegime}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Regimes</SelectItem>
                <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                <SelectItem value="lucro_real">Lucro Real</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterParceiro} onValueChange={setFilterParceiro}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Parceiros</SelectItem>
                {parceirosOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <div className="space-y-2">
        {filteredClientes.map(cliente => (
          <Card key={cliente.id} className={`transition-all hover:shadow-md ${
            cliente.prioridade === 'alta' ? 'border-l-4 border-l-emerald-500' :
            cliente.prioridade === 'media' ? 'border-l-4 border-l-amber-500' :
            'border-l-4 border-l-red-400'
          }`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0A2540]/5 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#0A2540]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{cliente.razaoSocial}</p>
                      {cliente.redFlags.length > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-0.5 h-5">
                          <Flag className="w-3 h-3" /> {cliente.redFlags.length} RED FLAG{cliente.redFlags.length > 1 ? 'S' : ''}
                        </Badge>
                      )}
                      {!cliente.procuracao?.habilitada && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 h-5 text-amber-600 border-amber-300">
                          <FileKey className="w-3 h-3" /> Sem Procuração
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-data">{cliente.cnpj}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {cliente.regimeTributario === 'lucro_real' ? 'Lucro Real' :
                         cliente.regimeTributario === 'lucro_presumido' ? 'Lucro Presumido' : 'Simples Nacional'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{cliente.estado}</span>
                      {cliente.parceiroId && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-[#0A2540] font-medium flex items-center gap-1">
                            <User className="w-3 h-3" />{getParceiroNome(cliente.parceiroId)}
                          </span>
                        </>
                      )}
                    </div>
                    {/* Rastreamento */}
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}</span>
                      {cliente.usuarioCadastroNome && <span>por {cliente.usuarioCadastroNome}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-lg font-bold font-data">{cliente.scoreOportunidade || '—'}</p>
                  </div>
                  <Badge className={
                    cliente.prioridade === 'alta' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20' :
                    cliente.prioridade === 'media' ? 'bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20' :
                    'bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20'
                  }>
                    {cliente.prioridade === 'alta' ? 'Alta' : cliente.prioridade === 'media' ? 'Média' : 'Baixa'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewCliente(cliente)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {perm.podeEditarCliente && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCliente(cliente); setDialogOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {perm.podeExcluirCliente && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cliente.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Red Flags inline */}
              {cliente.redFlags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed space-y-1.5">
                  {cliente.redFlags.map(flag => (
                    <div key={flag.id} className="flex items-start gap-2 text-xs">
                      <Flag className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-red-700">{flag.descricao}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredClientes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Client Dialog */}
      <Dialog open={!!viewCliente} onOpenChange={v => { if (!v) setViewCliente(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>{viewCliente?.razaoSocial}</DialogDescription>
          </DialogHeader>
          {viewCliente && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-4 pr-4">
                <Tabs defaultValue="dados">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dados">Dados</TabsTrigger>
                    <TabsTrigger value="flags">
                      Red Flags {viewCliente.redFlags.length > 0 && `(${viewCliente.redFlags.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="procuracao">Procuração</TabsTrigger>
                    <TabsTrigger value="alertas">Alertas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dados" className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground text-xs">CNPJ:</span><p className="font-data">{viewCliente.cnpj}</p></div>
                      <div><span className="text-muted-foreground text-xs">Regime:</span><p>{viewCliente.regimeTributario === 'lucro_real' ? 'Lucro Real' : viewCliente.regimeTributario === 'lucro_presumido' ? 'Lucro Presumido' : 'Simples Nacional'}</p></div>
                      <div><span className="text-muted-foreground text-xs">Situação:</span><p className="capitalize">{viewCliente.situacaoCadastral}</p></div>
                      <div><span className="text-muted-foreground text-xs">Data Abertura:</span><p>{viewCliente.dataAbertura}</p></div>
                      <div><span className="text-muted-foreground text-xs">CNAE:</span><p className="font-data">{viewCliente.cnaePrincipal}</p></div>
                      <div><span className="text-muted-foreground text-xs">Estado:</span><p>{viewCliente.estado}</p></div>
                      <div><span className="text-muted-foreground text-xs">Faturamento Médio:</span><p className="font-data">R$ {viewCliente.faturamentoMedioMensal.toLocaleString('pt-BR')}</p></div>
                      <div><span className="text-muted-foreground text-xs">Valor Médio Guias:</span><p className="font-data">R$ {viewCliente.valorMedioGuias.toLocaleString('pt-BR')}</p></div>
                      <div><span className="text-muted-foreground text-xs">Folha Pagamento:</span><p className="font-data">R$ {viewCliente.folhaPagamentoMedia.toLocaleString('pt-BR')}</p></div>
                      <div><span className="text-muted-foreground text-xs">Score:</span><p className="font-data text-lg font-bold">{viewCliente.scoreOportunidade || '—'}</p></div>
                      <div><span className="text-muted-foreground text-xs">Parceiro:</span><p>{getParceiroNome(viewCliente.parceiroId)}</p></div>
                      <div><span className="text-muted-foreground text-xs">Cadastrado por:</span><p>{viewCliente.usuarioCadastroNome || '—'} em {new Date(viewCliente.dataCadastro).toLocaleString('pt-BR')}</p></div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { k: 'industrializa', l: 'Industrializa' }, { k: 'comercializa', l: 'Comercializa' },
                        { k: 'prestaServicos', l: 'Serviços' }, { k: 'contribuinteICMS', l: 'ICMS' },
                        { k: 'contribuinteIPI', l: 'IPI' }, { k: 'regimeMonofasico', l: 'Monofásico' },
                      ].map(item => (
                        <Badge key={item.k} variant={(viewCliente as any)[item.k] ? 'default' : 'outline'}>
                          {item.l}: {(viewCliente as any)[item.k] ? 'Sim' : 'Não'}
                        </Badge>
                      ))}
                    </div>
                    {viewCliente.excecoesEspecificidades && (
                      <>
                        <Separator />
                        <div>
                          <span className="text-muted-foreground text-xs">Exceções e Especificidades:</span>
                          <p className="text-sm mt-1">{viewCliente.excecoesEspecificidades}</p>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="flags" className="mt-4">
                    {viewCliente.redFlags.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhuma RED FLAG identificada.</p>
                    ) : (
                      <div className="space-y-3">
                        {viewCliente.redFlags.map(flag => (
                          <div key={flag.id} className="p-3 rounded-lg bg-red-50 border border-red-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Flag className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-semibold text-red-800">{flag.tipo.replace(/_/g, ' ').toUpperCase()}</span>
                              <Badge variant="destructive" className="text-[10px] ml-auto">{flag.impacto.replace(/_/g, ' ')}</Badge>
                            </div>
                            <p className="text-xs text-red-700">{flag.descricao}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="procuracao" className="mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileKey className={`w-5 h-5 ${viewCliente.procuracao?.habilitada ? 'text-emerald-500' : 'text-red-500'}`} />
                        <span className="text-sm font-semibold">
                          {viewCliente.procuracao?.habilitada ? 'Procuração Habilitada' : 'Sem Procuração'}
                        </span>
                      </div>
                      {viewCliente.procuracao?.habilitada && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Certificado Digital:</span>
                            <p>{viewCliente.procuracao.certificadoDigital === 'evox_fiscal' ? 'Evox Fiscal' :
                                viewCliente.procuracao.certificadoDigital === 'gercino_neto' ? 'Gercino Neto' :
                                viewCliente.procuracao.certificadoOutroNome || 'Outro'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Validade:</span>
                            <p>{viewCliente.procuracao.dataValidade || '—'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="alertas" className="mt-4">
                    {viewCliente.alertasInformacao.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Todas as informações estão completas.</p>
                    ) : (
                      <div className="space-y-2">
                        {viewCliente.alertasInformacao.map(alerta => (
                          <div key={alerta.campo} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              <span className="text-xs text-amber-800">{alerta.mensagem}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
