import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Settings, Percent, Search, MoreVertical, Power, PowerOff, Filter, Loader2, Eye, Package, DollarSign, Users, Gem, Award, Medal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const FORMA_COBRANCA_LABELS: Record<string, string> = {
  percentual_credito: '% sobre Crédito',
  valor_fixo: 'Valor Fixo',
  mensalidade: 'Mensalidade',
  exito: 'Êxito',
  hibrido: 'Híbrido',
  entrada_exito: 'Entrada + Êxito',
  valor_fixo_parcelado: 'Valor Fixo Parcelado',
};

const EMPTY_FORM = {
  nome: '', descricao: '', setorId: 0,
  percentualHonorariosComercial: '0',
  percentualHonorariosCliente: '0',
  formaCobrancaHonorarios: 'percentual_credito' as string,
  valorFixo: '',
  valorEntrada: '',
  percentualExito: '',
  quantidadeParcelas: undefined as number | undefined,
  valorParcela: '',
  comissaoPadraoDiamante: '',
  comissaoPadraoOuro: '',
  comissaoPadraoPrata: '',
};

export default function Servicos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedSetorId, setSelectedSetorId] = useState<number | undefined>();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewServico, setViewServico] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const utils = trpc.useUtils();
  const setores = trpc.setores.list.useQuery();
  const servicos = trpc.servicos.list.useQuery(selectedSetorId ? { setorId: selectedSetorId } : undefined);
  const modelosParceria = trpc.modelosParceria.list.useQuery();

  const createServico = trpc.servicos.create.useMutation({
    onSuccess: () => { toast.success('Serviço criado com sucesso!'); utils.servicos.list.invalidate(); utils.comissoes.byModelo.invalidate(); closeForm(); },
    onError: (e) => toast.error(e.message || 'Erro ao criar serviço'),
  });
  const updateServico = trpc.servicos.update.useMutation({
    onSuccess: () => { toast.success('Serviço atualizado!'); utils.servicos.list.invalidate(); utils.comissoes.byModelo.invalidate(); closeForm(); },
    onError: (e) => toast.error(e.message || 'Erro ao atualizar serviço'),
  });
  const deleteServico = trpc.servicos.delete.useMutation({
    onSuccess: () => { toast.success('Serviço excluído!'); utils.servicos.list.invalidate(); setConfirmDelete(null); },
    onError: (e) => toast.error(e.message || 'Erro ao excluir serviço'),
  });
  const toggleServico = trpc.servicos.toggleActive.useMutation({
    onSuccess: (_, vars) => { utils.servicos.list.invalidate(); toast.success(vars.ativo ? 'Serviço ativado!' : 'Serviço inativado!'); },
    onError: (e) => toast.error(e.message),
  });

  const closeForm = () => {
    setDialogOpen(false); setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.nome || !form.setorId) { toast.error('Preencha nome e setor'); return; }
    const payload = {
      ...form,
      quantidadeParcelas: form.quantidadeParcelas || undefined,
    };
    if (editingId) {
      updateServico.mutate({ id: editingId, data: payload });
    } else {
      createServico.mutate(payload as any);
    }
  };

  const handleEdit = (s: any) => {
    setForm({
      nome: s.nome || '',
      descricao: s.descricao || '',
      setorId: s.setorId || 0,
      percentualHonorariosComercial: s.percentualHonorariosComercial || '0',
      percentualHonorariosCliente: s.percentualHonorariosCliente || '0',
      formaCobrancaHonorarios: s.formaCobrancaHonorarios || 'percentual_credito',
      valorFixo: s.valorFixo || '',
      valorEntrada: s.valorEntrada || '',
      percentualExito: s.percentualExito || '',
      quantidadeParcelas: s.quantidadeParcelas || undefined,
      valorParcela: s.valorParcela || '',
      comissaoPadraoDiamante: s.comissaoPadraoDiamante || '',
      comissaoPadraoOuro: s.comissaoPadraoOuro || '',
      comissaoPadraoPrata: s.comissaoPadraoPrata || '',
    });
    setEditingId(s.id);
    setDialogOpen(true);
  };

  const getSetorNome = (setorId: number) => {
    const setor = (setores.data as any[])?.find((s: any) => s.id === setorId);
    return setor?.nome || '-';
  };

  const filtered = ((servicos.data || []) as any[]).filter((s: any) => {
    if (filterStatus === 'ativos' && !s.ativo) return false;
    if (filterStatus === 'inativos' && s.ativo) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.nome.toLowerCase().includes(q) || (s.descricao || '').toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: ((servicos.data || []) as any[]).length,
    ativos: ((servicos.data || []) as any[]).filter((s: any) => s.ativo).length,
    inativos: ((servicos.data || []) as any[]).filter((s: any) => !s.ativo).length,
  };

  const showValorFixo = ['valor_fixo', 'hibrido'].includes(form.formaCobrancaHonorarios);
  const showEntradaExito = form.formaCobrancaHonorarios === 'entrada_exito';
  const showParcelado = form.formaCobrancaHonorarios === 'valor_fixo_parcelado';
  const showPercentualExito = ['exito', 'hibrido', 'entrada_exito'].includes(form.formaCobrancaHonorarios);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#0A2540]" /> Serviços por Setor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} serviços • {stats.ativos} ativos • {stats.inativos} inativos
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { closeForm(); setDialogOpen(true); }} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
            <Plus className="w-4 h-4 mr-2" /> Novo Serviço
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar serviço..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedSetorId ? String(selectedSetorId) : 'all'} onValueChange={(v) => setSelectedSetorId(v === 'all' ? undefined : Number(v))}>
          <SelectTrigger className="w-[200px]">
            <Settings className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Todos os setores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {(setores.data as any[])?.map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[140px]">
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

      {/* Services list */}
      {servicos.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {search || filterStatus !== 'todos' || selectedSetorId ? 'Nenhum serviço encontrado com os filtros aplicados.' : 'Nenhum serviço cadastrado. Clique em "Novo Serviço" para começar.'}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s: any) => (
            <Card key={s.id} className={`hover:shadow-md transition-all group ${!s.ativo ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.ativo ? 'bg-[#0A2540]/10' : 'bg-gray-200'}`}>
                    <Package className="w-5 h-5 text-[#0A2540]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{s.nome}</h3>
                      <Badge variant={s.ativo ? 'default' : 'secondary'} className={`text-[10px] ${s.ativo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{getSetorNome(s.setorId)}</p>
                    {s.descricao && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate max-w-md">{s.descricao}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-0.5">
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <Percent className="w-3.5 h-3.5" />
                      {s.percentualHonorariosCliente || s.percentualHonorariosComercial || '0'}%
                    </div>
                    <span className="text-[11px] text-muted-foreground">{FORMA_COBRANCA_LABELS[s.formaCobrancaHonorarios] || s.formaCobrancaHonorarios}</span>
                    {(s.comissaoPadraoDiamante || s.comissaoPadraoOuro || s.comissaoPadraoPrata) && (
                      <div className="flex items-center gap-1">
                        {s.comissaoPadraoDiamante && <Badge variant="outline" className="text-[9px] h-4 px-1 border-blue-300 text-blue-600"><Gem className="w-2.5 h-2.5 mr-0.5" />{s.comissaoPadraoDiamante}%</Badge>}
                        {s.comissaoPadraoOuro && <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-300 text-amber-600"><Award className="w-2.5 h-2.5 mr-0.5" />{s.comissaoPadraoOuro}%</Badge>}
                        {s.comissaoPadraoPrata && <Badge variant="outline" className="text-[9px] h-4 px-1 border-gray-400 text-gray-600"><Medal className="w-2.5 h-2.5 mr-0.5" />{s.comissaoPadraoPrata}%</Badge>}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewServico(s)}>
                          <Eye className="w-4 h-4 mr-2" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(s)}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleServico.mutate({ id: s.id, ativo: !s.ativo })}>
                          {s.ativo ? <><PowerOff className="w-4 h-4 mr-2" /> Inativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => setConfirmDelete(s)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewServico} onOpenChange={() => setViewServico(null)}>
        <DialogContent className="max-w-lg">
          {viewServico && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#0A2540]" /> {viewServico.nome}
                </DialogTitle>
                <DialogDescription>Detalhes do serviço</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Setor</Label><p className="text-sm font-medium">{getSetorNome(viewServico.setorId)}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Status</Label><Badge variant={viewServico.ativo ? 'default' : 'secondary'} className={viewServico.ativo ? 'bg-green-100 text-green-700' : ''}>{viewServico.ativo ? 'Ativo' : 'Inativo'}</Badge></div>
                  </div>

                  <Separator />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Honorários ao Cliente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">% Honorários Cliente</Label><p className="text-sm font-medium">{viewServico.percentualHonorariosCliente || '0'}%</p></div>
                    <div><Label className="text-xs text-muted-foreground">Forma de Cobrança</Label><p className="text-sm">{FORMA_COBRANCA_LABELS[viewServico.formaCobrancaHonorarios] || viewServico.formaCobrancaHonorarios}</p></div>
                    {viewServico.valorFixo && <div><Label className="text-xs text-muted-foreground">Valor Fixo</Label><p className="text-sm font-medium">R$ {Number(viewServico.valorFixo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>}
                    {viewServico.valorEntrada && <div><Label className="text-xs text-muted-foreground">Valor Entrada</Label><p className="text-sm font-medium">R$ {Number(viewServico.valorEntrada).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>}
                    {viewServico.percentualExito && <div><Label className="text-xs text-muted-foreground">% sobre Êxito</Label><p className="text-sm font-medium">{viewServico.percentualExito}%</p></div>}
                    {viewServico.quantidadeParcelas && <div><Label className="text-xs text-muted-foreground">Parcelas</Label><p className="text-sm font-medium">{viewServico.quantidadeParcelas}x de R$ {Number(viewServico.valorParcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>}
                  </div>

                  <Separator />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Honorários Comercial</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">% Honorários Comercial</Label><p className="text-sm font-medium">{viewServico.percentualHonorariosComercial || '0'}%</p></div>
                  </div>

                  <Separator />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Comissão ao Parceiro (por Modelo)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                      <Gem className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-[10px] text-blue-600 font-semibold">Diamante</p>
                      <p className="text-lg font-bold text-blue-700">{viewServico.comissaoPadraoDiamante || '0'}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                      <Award className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <p className="text-[10px] text-amber-600 font-semibold">Ouro</p>
                      <p className="text-lg font-bold text-amber-700">{viewServico.comissaoPadraoOuro || '0'}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-300 text-center">
                      <Medal className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-[10px] text-gray-500 font-semibold">Prata</p>
                      <p className="text-lg font-bold text-gray-600">{viewServico.comissaoPadraoPrata || '0'}%</p>
                    </div>
                  </div>

                  {viewServico.descricao && (
                    <>
                      <Separator />
                      <div><Label className="text-xs text-muted-foreground">Descrição</Label><p className="text-sm">{viewServico.descricao}</p></div>
                    </>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>Criado em: {viewServico.createdAt ? new Date(viewServico.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                    <div>Atualizado em: {viewServico.updatedAt ? new Date(viewServico.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                {isAdmin && (
                  <>
                    <Button variant="outline" onClick={() => { setViewServico(null); handleEdit(viewServico); }}>
                      <Edit className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button variant={viewServico.ativo ? 'destructive' : 'default'} onClick={() => { toggleServico.mutate({ id: viewServico.id, ativo: !viewServico.ativo }); setViewServico(null); }}>
                      {viewServico.ativo ? <><PowerOff className="w-4 h-4 mr-2" /> Inativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog — Reformulado */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeForm(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            <DialogDescription>{editingId ? 'Altere os dados do serviço.' : 'Preencha os dados para cadastrar um novo serviço.'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
                <TabsTrigger value="honorarios">Honorários</TabsTrigger>
                <TabsTrigger value="comissoes">Comissões Parceiro</TabsTrigger>
              </TabsList>

              {/* Tab: Dados Gerais */}
              <TabsContent value="geral" className="space-y-4 pr-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nome do Serviço *</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Recuperação PIS/COFINS" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Setor *</Label>
                  <Select value={form.setorId ? String(form.setorId) : ''} onValueChange={(v) => setForm({ ...form, setorId: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                    <SelectContent>
                      {(setores.data as any[])?.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Descrição</Label>
                  <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição do serviço" rows={3} />
                </div>
              </TabsContent>

              {/* Tab: Honorários */}
              <TabsContent value="honorarios" className="space-y-4 pr-4">
                <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium mb-1">Honorários cobrados do cliente</p>
                  <p className="text-[11px] text-blue-600/70">Configure o percentual e a forma de cobrança dos honorários para este serviço.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">% Honorários ao Cliente</Label>
                    <Input type="number" min={0} max={100} step="0.01" value={form.percentualHonorariosCliente} onChange={(e) => setForm({ ...form, percentualHonorariosCliente: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Forma de Cobrança</Label>
                    <Select value={form.formaCobrancaHonorarios} onValueChange={(v) => setForm({ ...form, formaCobrancaHonorarios: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FORMA_COBRANCA_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Campos condicionais por forma de cobrança */}
                {showValorFixo && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Valor Fixo (R$)</Label>
                    <Input type="number" min={0} step="0.01" value={form.valorFixo} onChange={(e) => setForm({ ...form, valorFixo: e.target.value })} placeholder="0.00" />
                  </div>
                )}

                {showPercentualExito && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">% sobre o Êxito</Label>
                    <Input type="number" min={0} max={100} step="0.01" value={form.percentualExito} onChange={(e) => setForm({ ...form, percentualExito: e.target.value })} placeholder="0" />
                  </div>
                )}

                {showEntradaExito && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Valor da Entrada (R$)</Label>
                      <Input type="number" min={0} step="0.01" value={form.valorEntrada} onChange={(e) => setForm({ ...form, valorEntrada: e.target.value })} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">% sobre o Êxito</Label>
                      <Input type="number" min={0} max={100} step="0.01" value={form.percentualExito} onChange={(e) => setForm({ ...form, percentualExito: e.target.value })} placeholder="0" />
                    </div>
                  </div>
                )}

                {showParcelado && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Valor Total (R$)</Label>
                      <Input type="number" min={0} step="0.01" value={form.valorFixo} onChange={(e) => {
                        const total = parseFloat(e.target.value) || 0;
                        const parcelas = form.quantidadeParcelas || 1;
                        setForm({ ...form, valorFixo: e.target.value, valorParcela: (total / parcelas).toFixed(2) });
                      }} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Qtd. Parcelas</Label>
                      <Input type="number" min={1} max={120} value={form.quantidadeParcelas || ''} onChange={(e) => {
                        const parcelas = parseInt(e.target.value) || 1;
                        const total = parseFloat(form.valorFixo) || 0;
                        setForm({ ...form, quantidadeParcelas: parcelas, valorParcela: (total / parcelas).toFixed(2) });
                      }} placeholder="1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Valor Parcela (R$)</Label>
                      <Input type="number" min={0} step="0.01" value={form.valorParcela} onChange={(e) => setForm({ ...form, valorParcela: e.target.value })} placeholder="0.00" disabled className="bg-muted" />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="p-3 rounded-lg bg-green-50/50 border border-green-100">
                  <p className="text-xs text-green-700 font-medium mb-1">Honorários comerciais</p>
                  <p className="text-[11px] text-green-600/70">Percentual de honorários da equipe comercial sobre este serviço.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">% Honorários Comercial</Label>
                  <Input type="number" min={0} max={100} step="0.01" value={form.percentualHonorariosComercial} onChange={(e) => setForm({ ...form, percentualHonorariosComercial: e.target.value })} placeholder="0" />
                </div>
              </TabsContent>

              {/* Tab: Comissões ao Parceiro */}
              <TabsContent value="comissoes" className="space-y-4 pr-4">
                <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100">
                  <p className="text-xs text-purple-700 font-medium mb-1">Comissão padrão ao parceiro por modelo de parceria</p>
                  <p className="text-[11px] text-purple-600/70">Defina o percentual de comissão que a Evox pagará ao parceiro comercial de acordo com o modelo de parceria. Estes valores serão vinculados automaticamente à Gestão de Parcerias.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Diamante */}
                  <div className="p-4 rounded-xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Gem className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-700">Diamante</p>
                        <p className="text-[10px] text-blue-500">Maior comissão</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-600">% Comissão</Label>
                      <Input type="number" min={0} max={100} step="0.01" value={form.comissaoPadraoDiamante} onChange={(e) => setForm({ ...form, comissaoPadraoDiamante: e.target.value })} placeholder="0" className="border-blue-200 focus:border-blue-400" />
                    </div>
                  </div>

                  {/* Ouro */}
                  <div className="p-4 rounded-xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Award className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-700">Ouro</p>
                        <p className="text-[10px] text-amber-500">Comissão intermediária</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-amber-600">% Comissão</Label>
                      <Input type="number" min={0} max={100} step="0.01" value={form.comissaoPadraoOuro} onChange={(e) => setForm({ ...form, comissaoPadraoOuro: e.target.value })} placeholder="0" className="border-amber-200 focus:border-amber-400" />
                    </div>
                  </div>

                  {/* Prata */}
                  <div className="p-4 rounded-xl border-2 border-gray-300 bg-gradient-to-b from-gray-50 to-white space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-600">Prata</p>
                        <p className="text-[10px] text-gray-400">Comissão base</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">% Comissão</Label>
                      <Input type="number" min={0} max={100} step="0.01" value={form.comissaoPadraoPrata} onChange={(e) => setForm({ ...form, comissaoPadraoPrata: e.target.value })} placeholder="0" className="border-gray-300 focus:border-gray-400" />
                    </div>
                  </div>
                </div>

                {((modelosParceria.data as any[]) || []).length === 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700">Nenhum modelo de parceria cadastrado. Cadastre os modelos (Diamante, Ouro, Prata) na Gestão de Parcerias para que as comissões sejam vinculadas automaticamente.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createServico.isPending || updateServico.isPending} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
              {(createServico.isPending || updateServico.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? 'Salvar Alterações' : 'Criar Serviço'}
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
              Tem certeza que deseja excluir o serviço <strong>{confirmDelete?.nome}</strong>? Esta ação não pode ser desfeita. Considere inativar o serviço ao invés de excluir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteServico.mutate({ id: confirmDelete.id })} disabled={deleteServico.isPending}>
              {deleteServico.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Excluir Serviço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
