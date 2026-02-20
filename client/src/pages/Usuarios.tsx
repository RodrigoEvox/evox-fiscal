import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users, Shield, ShieldCheck, ShieldAlert, UserCog, Loader2,
  Plus, Pencil, Trash2, Search, Phone, Mail, IdCard, UserCircle,
  History, Building2, Eye,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const nivelLabels: Record<string, string> = {
  diretor: 'Diretor',
  gerente: 'Gerente',
  coordenador: 'Coordenador',
  supervisor: 'Supervisor',
  analista_fiscal: 'Analista Fiscal',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  user: 'Usuário',
};

const acaoLabels: Record<string, string> = {
  criacao: 'Criação',
  edicao: 'Edição',
  ativacao: 'Ativação',
  inativacao: 'Inativação',
  exclusao: 'Exclusão',
};

const campoLabels: Record<string, string> = {
  name: 'Nome',
  apelido: 'Apelido',
  email: 'Email',
  cpf: 'CPF',
  telefone: 'Telefone',
  cargo: 'Cargo',
  role: 'Papel',
  nivelAcesso: 'Nível de Acesso',
  setorPrincipalId: 'Setor',
  supervisorId: 'Supervisor',
  ativo: 'Status',
};

function cpfMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function phoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface UserForm {
  name: string;
  apelido: string;
  email: string;
  cpf: string;
  telefone: string;
  cargo: string;
  role: string;
  nivelAcesso: string;
  setorPrincipalId: number | null;
}

const emptyForm: UserForm = {
  name: '', apelido: '', email: '', cpf: '', telefone: '',
  cargo: '', role: 'user', nivelAcesso: 'analista_fiscal',
  setorPrincipalId: null,
};

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.users.list.useQuery();
  const { data: setores = [] } = trpc.setores.list.useQuery();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [historyUserId, setHistoryUserId] = useState<number | null>(null);
  const [historyUserName, setHistoryUserName] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success('Usuário criado com sucesso!'); setDialogOpen(false); },
    onError: (err) => toast.error(err.message),
  });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success('Usuário atualizado!'); setDialogOpen(false); },
    onError: (err) => toast.error(err.message),
  });

  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success('Usuário desativado!'); setDeleteConfirm(null); },
    onError: (err) => toast.error(err.message),
  });

  const toggleActive = trpc.users.toggleActive.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success('Status atualizado!'); },
    onError: (err) => toast.error(err.message),
  });

  const userHistory = trpc.userHistory.byUser.useQuery(
    { userId: historyUserId! },
    { enabled: historyUserId !== null }
  );

  const isAdmin = currentUser?.role === 'admin';

  // Build setor name lookup
  const setorNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    (setores as any[]).forEach((s: any) => {
      // Remove sigla prefix if present
      const cleanName = s.nome?.replace(/^[A-Z]+\s*[–-]\s*/, '') || s.nome;
      map[s.id] = cleanName;
    });
    return map;
  }, [setores]);

  const filteredUsers = useMemo(() => {
    let list = users as any[];
    if (!showInactive) {
      list = list.filter((u: any) => u.ativo);
    }
    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter((u: any) =>
      (u.name || '').toLowerCase().includes(term) ||
      (u.apelido || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.cpf || '').toLowerCase().includes(term)
    );
  }, [users, search, showInactive]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingId(u.id);
    setForm({
      name: u.name || '',
      apelido: u.apelido || '',
      email: u.email || '',
      cpf: u.cpf || '',
      telefone: u.telefone || '',
      cargo: u.cargo || '',
      role: u.role || 'user',
      nivelAcesso: u.nivelAcesso || 'analista_fiscal',
      setorPrincipalId: u.setorPrincipalId || null,
    });
    setDialogOpen(true);
  };

  const openHistory = (u: any) => {
    setHistoryUserId(u.id);
    setHistoryUserName(u.apelido || u.name || 'Usuário');
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome completo é obrigatório'); return; }
    if (!form.apelido.trim()) { toast.error('Apelido é obrigatório'); return; }
    if (!form.email.trim()) { toast.error('Email é obrigatório'); return; }
    if (!form.setorPrincipalId) { toast.error('Setor é obrigatório'); return; }

    if (editingId) {
      updateUser.mutate({
        id: editingId,
        name: form.name,
        apelido: form.apelido,
        email: form.email,
        cpf: form.cpf || undefined,
        telefone: form.telefone || undefined,
        cargo: form.cargo || undefined,
        role: form.role,
        nivelAcesso: form.nivelAcesso,
        setorPrincipalId: form.setorPrincipalId,
      });
    } else {
      createUser.mutate({
        name: form.name,
        apelido: form.apelido,
        email: form.email,
        cpf: form.cpf || undefined,
        telefone: form.telefone || undefined,
        cargo: form.cargo || undefined,
        role: form.role as any,
        nivelAcesso: form.nivelAcesso as any,
        setorPrincipalId: form.setorPrincipalId,
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6" /> Gestão de Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} usuários cadastrados
            {(users as any[]).filter((u: any) => !u.ativo).length > 0 && (
              <span className="ml-2 text-orange-500">
                ({(users as any[]).filter((u: any) => !u.ativo).length} inativos)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showInactive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className="gap-1 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            {showInactive ? 'Ocultar Inativos' : 'Mostrar Inativos'}
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Usuário
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, apelido, email ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Usuário</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 hidden md:table-cell">Setor</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 hidden md:table-cell">Telefone</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Papel / Nível</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 hidden lg:table-cell">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u: any) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className={`border-b last:border-0 hover:bg-gray-50/50 transition-colors ${!u.ativo ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        {u.avatar && <AvatarImage src={u.avatar} />}
                        <AvatarFallback className={`text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {(u.apelido || u.name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-900 truncate">{u.apelido || u.name || 'Sem nome'}</p>
                          {isSelf && <Badge variant="outline" className="text-[10px] shrink-0">Você</Badge>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{u.name || ''}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email || 'Sem e-mail'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs">{u.setorPrincipalId ? (setorNameMap[u.setorPrincipalId] || '—') : <span className="text-gray-300">Não definido</span>}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                    {u.telefone || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {roleLabels[u.role] || u.role}
                      </Badge>
                      <p className="text-xs text-gray-500">{nivelLabels[u.nivelAcesso] || u.nivelAcesso}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <Badge variant={u.ativo ? 'default' : 'outline'} className={`text-[10px] ${u.ativo ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'text-gray-400'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openHistory(u)} className="h-8 w-8 p-0" title="Histórico">
                        <History className="w-3.5 h-3.5 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)} className="h-8 w-8 p-0" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {!isSelf && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={u.ativo ? 'Desativar' : 'Ativar'}
                            onClick={() => toggleActive.mutate({ id: u.id, ativo: !u.ativo })}
                          >
                            <Shield className={`w-3.5 h-3.5 ${u.ativo ? 'text-green-600' : 'text-gray-400'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            title="Excluir"
                            onClick={() => setDeleteConfirm(u.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  {search ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              {editingId ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize as informações do usuário.' : 'Preencha os dados para criar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nome Completo *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome completo do usuário"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Apelido (exibição) *</Label>
                <Input
                  value={form.apelido}
                  onChange={(e) => setForm({ ...form, apelido: e.target.value })}
                  placeholder="Como aparece no sistema"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1"><Mail className="w-3 h-3" /> Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1"><IdCard className="w-3 h-3" /> CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: cpfMask(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: phoneMask(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cargo</Label>
                <Input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex: Analista Tributário"
                />
              </div>
            </div>

            {/* Setor obrigatório */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Setor *
              </Label>
              <Select
                value={form.setorPrincipalId ? String(form.setorPrincipalId) : ''}
                onValueChange={(val) => setForm({ ...form, setorPrincipalId: val ? Number(val) : null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor do usuário" />
                </SelectTrigger>
                <SelectContent>
                  {(setores as any[])
                    .filter((s: any) => s.ativo)
                    .sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))
                    .map((s: any) => {
                      const cleanName = s.nome?.replace(/^[A-Z]+\s*[–-]\s*/, '') || s.nome;
                      return (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {cleanName}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Papel no Sistema</Label>
                <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nível de Acesso</Label>
                <Select value={form.nivelAcesso} onValueChange={(val) => setForm({ ...form, nivelAcesso: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="coordenador">Coordenador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="analista_fiscal">Analista Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createUser.isPending || updateUser.isPending}>
              {(createUser.isPending || updateUser.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                editingId ? 'Salvar Alterações' : 'Criar Usuário'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              O usuário será desativado (soft delete). Ele não poderá mais acessar o sistema, mas seus dados serão preservados para histórico e auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteUser.mutate({ id: deleteConfirm })}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Desativando...' : 'Desativar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User History Dialog */}
      <Dialog open={historyUserId !== null} onOpenChange={() => setHistoryUserId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Histórico — {historyUserName}
            </DialogTitle>
            <DialogDescription>
              Registro completo de criação, alterações e mudanças de status deste usuário.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            {userHistory.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !userHistory.data || userHistory.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhum registro de histórico encontrado.</p>
              </div>
            ) : (
              <div className="space-y-0">
                {(userHistory.data as any[]).map((h: any, idx: number) => (
                  <div key={h.id || idx} className={`flex gap-3 py-3 ${idx > 0 ? 'border-t' : ''}`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        h.acao === 'criacao' ? 'bg-green-100 text-green-600' :
                        h.acao === 'edicao' ? 'bg-blue-100 text-blue-600' :
                        h.acao === 'ativacao' ? 'bg-emerald-100 text-emerald-600' :
                        h.acao === 'inativacao' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {h.acao === 'criacao' ? <Plus className="w-4 h-4" /> :
                         h.acao === 'edicao' ? <Pencil className="w-4 h-4" /> :
                         <Shield className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {acaoLabels[h.acao] || h.acao}
                        </Badge>
                        {h.campo && (
                          <span className="text-xs text-gray-500">
                            Campo: <strong>{campoLabels[h.campo] || h.campo}</strong>
                          </span>
                        )}
                      </div>
                      {h.campo && (h.valorAnterior || h.valorNovo) && (
                        <div className="mt-1 text-xs">
                          {h.valorAnterior && (
                            <span className="text-red-500 line-through mr-2">{h.valorAnterior}</span>
                          )}
                          {h.valorNovo && (
                            <span className="text-green-600">{h.valorNovo}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span>por {h.realizadoPorNome || 'Sistema'}</span>
                        <span>•</span>
                        <span>{new Date(h.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
