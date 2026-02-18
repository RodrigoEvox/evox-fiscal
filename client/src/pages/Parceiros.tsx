import { useState } from 'react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Handshake, Plus, Search, Edit, Loader2, Phone, Mail, MapPin, MoreVertical, Power, PowerOff, Trash2, Eye, Building2, User, Diamond, Award, Medal, Filter } from 'lucide-react';

const TIPO_LABELS: Record<string, string> = { pf: 'Pessoa Física', pj: 'Pessoa Jurídica' };
const MODELO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  diamante: { label: 'Diamante', icon: Diamond, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ouro: { label: 'Ouro', icon: Award, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  prata: { label: 'Prata', icon: Medal, color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const emptyForm = {
  nomeCompleto: '', cpfCnpj: '', tipo: 'pj' as string, email: '', telefone: '',
  endereco: '', cidade: '', estado: '', comissaoPercentual: 0, ativo: true,
  modeloParceriaId: null as number | null, observacoes: '',
};

function maskCpfCnpj(v: string) {
  const d = v.replace(/\D/g, '');
  if (d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) => e ? `${a}.${b}.${c}-${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, e, f) => f ? `${a}.${b}.${c}/${e}-${f}` : e ? `${a}.${b}.${c}/${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
}

function maskTelefone(v: string) {
  const d = v.replace(/\D/g, '');
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : '');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : '');
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
  const [form, setForm] = useState({ ...emptyForm });
  const utils = trpc.useUtils();

  const { data: parceiros = [], isLoading } = trpc.parceiros.list.useQuery();
  const { data: modelos = [] } = trpc.modelosParceria.list.useQuery();

  const createMutation = trpc.parceiros.create.useMutation({
    onSuccess: () => { utils.parceiros.list.invalidate(); closeForm(); toast.success('Parceiro cadastrado com sucesso!'); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.parceiros.update.useMutation({
    onSuccess: () => { utils.parceiros.list.invalidate(); closeForm(); toast.success('Parceiro atualizado com sucesso!'); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.parceiros.delete.useMutation({
    onSuccess: () => { utils.parceiros.list.invalidate(); setConfirmDelete(null); toast.success('Parceiro excluído!'); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.parceiros.toggleActive.useMutation({
    onSuccess: (_, vars) => { utils.parceiros.list.invalidate(); toast.success(vars.ativo ? 'Parceiro ativado!' : 'Parceiro inativado!'); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (parceiros as any[]).filter((p: any) => {
    if (filterStatus === 'ativos' && !p.ativo) return false;
    if (filterStatus === 'inativos' && p.ativo) return false;
    if (search) {
      const s = search.toLowerCase();
      return (p.nomeCompleto || p.nome || '').toLowerCase().includes(s) || (p.cpfCnpj || p.documento || '').includes(search) || (p.email || '').toLowerCase().includes(s);
    }
    return true;
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); };

  const openEdit = (p: any) => {
    setForm({
      nomeCompleto: p.nomeCompleto || p.nome || '',
      cpfCnpj: p.cpfCnpj || p.documento || '',
      tipo: p.tipo || p.tipoPessoa || 'pj',
      email: p.email || '',
      telefone: p.telefone || '',
      endereco: p.endereco || '',
      cidade: p.cidade || '',
      estado: p.estado || '',
      comissaoPercentual: p.comissaoPercentual || 0,
      ativo: p.ativo !== false,
      modeloParceriaId: p.modeloParceriaId || null,
      observacoes: p.observacoes || '',
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.nomeCompleto) { toast.error('Preencha o nome do parceiro'); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form } as any);
    } else {
      createMutation.mutate(form as any);
    }
  };

  const getModeloInfo = (modeloId: number | null) => {
    if (!modeloId) return null;
    const m = (modelos as any[]).find((m: any) => m.id === modeloId);
    if (!m) return null;
    const key = m.nome.toLowerCase();
    return MODELO_LABELS[key] || { label: m.nome, icon: Award, color: 'bg-gray-100 text-gray-700' };
  };

  const stats = {
    total: (parceiros as any[]).length,
    ativos: (parceiros as any[]).filter((p: any) => p.ativo).length,
    inativos: (parceiros as any[]).filter((p: any) => !p.ativo).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Handshake className="w-6 h-6 text-[#0A2540]" /> Parceiros Comerciais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} parceiros • {stats.ativos} ativos • {stats.inativos} inativos
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setShowForm(true); }} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
            <Plus className="w-4 h-4 mr-2" /> Novo Parceiro
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, documento ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
            return (
              <Card key={p.id} className={`hover:shadow-md transition-all cursor-pointer group ${!p.ativo ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.ativo ? 'bg-[#0A2540]/10' : 'bg-gray-200'}`}>
                      {p.tipoPessoa === 'pf' || p.tipo === 'pf' ? <User className="w-5 h-5 text-[#0A2540]" /> : <Building2 className="w-5 h-5 text-[#0A2540]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm truncate">{p.nomeCompleto || p.nome}</h3>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <p className="text-xs text-muted-foreground mt-0.5">{p.cpfCnpj || p.documento}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant={p.ativo ? 'default' : 'secondary'} className={`text-[10px] ${p.ativo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {modeloInfo && (
                          <Badge variant="outline" className={`text-[10px] ${modeloInfo.color}`}>
                            {modeloInfo.label}
                          </Badge>
                        )}
                      </div>
                      {p.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5"><Mail className="w-3 h-3" /> {p.email}</p>}
                      {p.telefone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {p.telefone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewParceiro} onOpenChange={() => setViewParceiro(null)}>
        <DialogContent className="max-w-lg">
          {viewParceiro && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-[#0A2540]" /> {viewParceiro.nomeCompleto || viewParceiro.nome}
                </DialogTitle>
                <DialogDescription>Detalhes do parceiro comercial</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Documento</Label><p className="text-sm font-medium">{viewParceiro.cpfCnpj || viewParceiro.documento}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Tipo</Label><p className="text-sm font-medium">{TIPO_LABELS[viewParceiro.tipoPessoa || viewParceiro.tipo] || 'PJ'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">E-mail</Label><p className="text-sm">{viewParceiro.email || 'N/A'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Telefone</Label><p className="text-sm">{viewParceiro.telefone || 'N/A'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Cidade/UF</Label><p className="text-sm">{[viewParceiro.cidade, viewParceiro.estado].filter(Boolean).join('/') || 'N/A'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Comissão</Label><p className="text-sm font-medium">{viewParceiro.comissaoPercentual || 0}%</p></div>
                  <div><Label className="text-xs text-muted-foreground">Status</Label><Badge variant={viewParceiro.ativo ? 'default' : 'secondary'} className={viewParceiro.ativo ? 'bg-green-100 text-green-700' : ''}>{viewParceiro.ativo ? 'Ativo' : 'Inativo'}</Badge></div>
                  {(() => { const mi = getModeloInfo(viewParceiro.modeloParceriaId); return mi ? <div><Label className="text-xs text-muted-foreground">Modelo de Parceria</Label><Badge variant="outline" className={mi.color}>{mi.label}</Badge></div> : null; })()}
                </div>
                {viewParceiro.endereco && (
                  <div><Label className="text-xs text-muted-foreground">Endereço</Label><p className="text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {viewParceiro.endereco}</p></div>
                )}
                {viewParceiro.observacoes && (
                  <div><Label className="text-xs text-muted-foreground">Observações</Label><p className="text-sm">{viewParceiro.observacoes}</p></div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>Cadastrado em: {viewParceiro.createdAt ? new Date(viewParceiro.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  <div>Atualizado em: {viewParceiro.updatedAt ? new Date(viewParceiro.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                </div>
              </div>
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

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
            <DialogDescription>{editingId ? 'Altere os dados do parceiro.' : 'Preencha os dados para cadastrar um novo parceiro.'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-5">
              {/* Dados Básicos */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Dados Básicos</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Nome Completo / Razão Social *</Label>
                    <Input value={form.nomeCompleto} onChange={e => setForm(f => ({ ...f, nomeCompleto: e.target.value }))} placeholder="Nome do parceiro" />
                  </div>
                  <div>
                    <Label className="text-xs">CPF/CNPJ</Label>
                    <Input value={form.cpfCnpj} onChange={e => setForm(f => ({ ...f, cpfCnpj: maskCpfCnpj(e.target.value) }))} placeholder="000.000.000-00" maxLength={18} />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pf">Pessoa Física</SelectItem>
                        <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contato */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Contato</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">E-mail</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@parceiro.com" />
                  </div>
                  <div>
                    <Label className="text-xs">Telefone</Label>
                    <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Endereço</Label>
                    <Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, número, bairro" />
                  </div>
                  <div>
                    <Label className="text-xs">Cidade</Label>
                    <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Cidade" />
                  </div>
                  <div>
                    <Label className="text-xs">UF</Label>
                    <Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="SP" maxLength={2} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Parceria */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Parceria</h3>
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
                  <div>
                    <Label className="text-xs">Comissão Padrão (%)</Label>
                    <Input type="number" min={0} max={100} value={form.comissaoPercentual} onChange={e => setForm(f => ({ ...f, comissaoPercentual: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

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
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
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
              Tem certeza que deseja excluir o parceiro <strong>{confirmDelete?.nomeCompleto || confirmDelete?.nome}</strong>? Esta ação não pode ser desfeita. Considere inativar o parceiro ao invés de excluir.
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
