import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus, Search, Edit, Trash2, UserCheck, UserX,
  Briefcase, Mail, Phone, Users,
} from 'lucide-react';

export default function ExecutivosComerciais() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const utils = trpc.useUtils();

  const executivos = trpc.executivos.list.useQuery();
  const createMut = trpc.executivos.create.useMutation({
    onSuccess: () => { utils.executivos.list.invalidate(); toast.success('Executivo cadastrado com sucesso'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.executivos.update.useMutation({
    onSuccess: () => { utils.executivos.list.invalidate(); toast.success('Executivo atualizado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.executivos.delete.useMutation({
    onSuccess: () => { utils.executivos.list.invalidate(); toast.success('Executivo excluído'); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMut = trpc.executivos.toggleActive.useMutation({
    onSuccess: () => { utils.executivos.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Form fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');

  const resetForm = () => {
    setNome(''); setEmail(''); setTelefone(''); setCargo('');
    setEditingId(null);
  };

  const handleEdit = (exec: any) => {
    setEditingId(exec.id);
    setNome(exec.nome || '');
    setEmail(exec.email || '');
    setTelefone(exec.telefone || '');
    setCargo(exec.cargo || '');
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!nome.trim()) { toast.error('Nome é obrigatório'); return; }
    const data = { nome: nome.trim(), email: email.trim() || undefined, telefone: telefone.trim() || undefined, cargo: cargo.trim() || undefined };
    if (editingId) {
      updateMut.mutate({ id: editingId, ...data });
    } else {
      createMut.mutate(data);
    }
  };

  const maskPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  };

  const filtered = useMemo(() => {
    if (!executivos.data) return [];
    const term = searchTerm.toLowerCase();
    return (executivos.data as any[]).filter((e: any) =>
      e.nome.toLowerCase().includes(term) ||
      (e.email || '').toLowerCase().includes(term) ||
      (e.cargo || '').toLowerCase().includes(term)
    );
  }, [executivos.data, searchTerm]);

  const ativos = filtered.filter((e: any) => e.ativo);
  const inativos = filtered.filter((e: any) => !e.ativo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            Executivos Comerciais
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Gerencie os executivos comerciais internos da Evox Fiscal
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Novo Executivo
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          placeholder="Buscar executivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">Total</p>
              <p className="text-xl font-bold text-white">{(executivos.data as any[])?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <UserCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">Ativos</p>
              <p className="text-xl font-bold text-white">{ativos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <UserX className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">Inativos</p>
              <p className="text-xl font-bold text-white">{inativos.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {executivos.isLoading ? (
        <div className="text-center py-12 text-white/40">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">Nenhum executivo comercial encontrado</p>
            {isAdmin && (
              <Button variant="outline" className="mt-4 gap-2" onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="w-4 h-4" /> Cadastrar Primeiro Executivo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((exec: any) => (
            <Card key={exec.id} className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {exec.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{exec.nome}</h3>
                      {exec.cargo && <p className="text-xs text-white/40">{exec.cargo}</p>}
                    </div>
                  </div>
                  <Badge variant={exec.ativo ? 'default' : 'secondary'} className={exec.ativo ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                    {exec.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-white/50">
                  {exec.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{exec.email}</span>
                    </div>
                  )}
                  {exec.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{exec.telefone}</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                    <Button variant="ghost" size="sm" className="text-white/50 hover:text-white h-8 gap-1.5" onClick={() => handleEdit(exec)}>
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <div className="flex items-center gap-2 ml-auto">
                      <Switch
                        checked={exec.ativo}
                        onCheckedChange={(checked) => toggleMut.mutate({ id: exec.id, ativo: checked })}
                        className="scale-75"
                      />
                      <Button variant="ghost" size="sm" className="text-red-400/60 hover:text-red-400 h-8" onClick={() => setConfirmDelete(exec.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { resetForm(); } setShowForm(open); }}>
        <DialogContent className="bg-[#0F1A2E] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Executivo' : 'Novo Executivo Comercial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-white/70 text-xs">Nome Completo *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do executivo" className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70 text-xs">Cargo</Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Executivo Comercial Sênior" className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70 text-xs">E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@evoxfiscal.com.br" type="email" className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70 text-xs">Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }} className="text-white/50">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {(createMut.isPending || updateMut.isPending) ? 'Salvando...' : editingId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete !== null} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-[#0F1A2E] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/60">Tem certeza que deseja excluir este executivo comercial? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} className="text-white/50">Cancelar</Button>
            <Button variant="destructive" onClick={() => { if (confirmDelete) { deleteMut.mutate({ id: confirmDelete }); setConfirmDelete(null); } }}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
