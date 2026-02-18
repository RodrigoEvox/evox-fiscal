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
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Settings, Percent, Search, MoreVertical, Power, PowerOff, Filter, Loader2, Eye, Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const FORMA_COBRANCA_LABELS: Record<string, string> = {
  percentual_credito: '% sobre Crédito',
  valor_fixo: 'Valor Fixo',
  mensalidade: 'Mensalidade',
  exito: 'Êxito',
  hibrido: 'Híbrido',
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
  const [form, setForm] = useState({
    nome: '', descricao: '', setorId: 0,
    percentualHonorariosComercial: '0',
    formaCobrancaHonorarios: 'percentual_credito' as string,
    valorFixo: '',
  });

  const utils = trpc.useUtils();
  const setores = trpc.setores.list.useQuery();
  const servicos = trpc.servicos.list.useQuery(selectedSetorId ? { setorId: selectedSetorId } : undefined);

  const createServico = trpc.servicos.create.useMutation({
    onSuccess: () => { toast.success('Serviço criado com sucesso!'); utils.servicos.list.invalidate(); closeForm(); },
    onError: (e) => toast.error(e.message || 'Erro ao criar serviço'),
  });
  const updateServico = trpc.servicos.update.useMutation({
    onSuccess: () => { toast.success('Serviço atualizado!'); utils.servicos.list.invalidate(); closeForm(); },
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
    setForm({ nome: '', descricao: '', setorId: 0, percentualHonorariosComercial: '0', formaCobrancaHonorarios: 'percentual_credito', valorFixo: '' });
  };

  const handleSave = () => {
    if (!form.nome || !form.setorId) { toast.error('Preencha nome e setor'); return; }
    if (editingId) {
      updateServico.mutate({ id: editingId, data: form });
    } else {
      createServico.mutate(form as any);
    }
  };

  const handleEdit = (s: any) => {
    setForm({
      nome: s.nome, descricao: s.descricao || '', setorId: s.setorId,
      percentualHonorariosComercial: s.percentualHonorariosComercial || '0',
      formaCobrancaHonorarios: s.formaCobrancaHonorarios || 'percentual_credito',
      valorFixo: s.valorFixo || '',
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
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <Percent className="w-3.5 h-3.5" />
                      {s.percentualHonorariosComercial || '0'}%
                    </div>
                    <span className="text-[11px] text-muted-foreground">{FORMA_COBRANCA_LABELS[s.formaCobrancaHonorarios] || s.formaCobrancaHonorarios}</span>
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Setor</Label><p className="text-sm font-medium">{getSetorNome(viewServico.setorId)}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Status</Label><Badge variant={viewServico.ativo ? 'default' : 'secondary'} className={viewServico.ativo ? 'bg-green-100 text-green-700' : ''}>{viewServico.ativo ? 'Ativo' : 'Inativo'}</Badge></div>
                  <div><Label className="text-xs text-muted-foreground">Honorários</Label><p className="text-sm font-medium">{viewServico.percentualHonorariosComercial || 0}%</p></div>
                  <div><Label className="text-xs text-muted-foreground">Forma de Cobrança</Label><p className="text-sm">{FORMA_COBRANCA_LABELS[viewServico.formaCobrancaHonorarios] || viewServico.formaCobrancaHonorarios}</p></div>
                  {viewServico.valorFixo && <div><Label className="text-xs text-muted-foreground">Valor Fixo</Label><p className="text-sm font-medium">R$ {viewServico.valorFixo}</p></div>}
                </div>
                {viewServico.descricao && (
                  <div><Label className="text-xs text-muted-foreground">Descrição</Label><p className="text-sm">{viewServico.descricao}</p></div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>Criado em: {viewServico.createdAt ? new Date(viewServico.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  <div>Atualizado em: {viewServico.updatedAt ? new Date(viewServico.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                </div>
              </div>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeForm(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            <DialogDescription>{editingId ? 'Altere os dados do serviço.' : 'Preencha os dados para cadastrar um novo serviço.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Serviço *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Recuperação PIS/COFINS" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Setor *</Label>
              <Select value={form.setorId ? String(form.setorId) : ''} onValueChange={(v) => setForm({ ...form, setorId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>
                  {(setores.data as any[])?.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">% Honorários Comercial</Label>
                <Input type="number" min={0} max={100} value={form.percentualHonorariosComercial} onChange={(e) => setForm({ ...form, percentualHonorariosComercial: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Forma de Cobrança</Label>
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
            {(form.formaCobrancaHonorarios === 'valor_fixo' || form.formaCobrancaHonorarios === 'hibrido') && (
              <div className="space-y-1.5">
                <Label className="text-xs">Valor Fixo (R$)</Label>
                <Input type="number" min={0} step="0.01" value={form.valorFixo} onChange={(e) => setForm({ ...form, valorFixo: e.target.value })} placeholder="0.00" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição do serviço" rows={3} />
            </div>
          </div>
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
