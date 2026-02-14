import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Building2, Users, Trash2, Edit } from 'lucide-react';

export default function Setores() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', cor: '#3B82F6' });

  const setores = trpc.setores.list.useQuery();
  const membros = trpc.setores.membros.useQuery({});
  const users = trpc.users.list.useQuery();
  const createSetor = trpc.setores.create.useMutation({
    onSuccess: () => { setores.refetch(); setShowCreate(false); setForm({ nome: '', descricao: '', cor: '#3B82F6' }); toast.success('Setor criado!'); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSetor = trpc.setores.delete.useMutation({
    onSuccess: () => { setores.refetch(); toast.success('Setor excluído!'); },
    onError: (e) => toast.error(e.message),
  });

  const getMembrosCount = (setorId: number) => {
    return membros.data?.filter((m: any) => m.setorId === setorId).length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setores</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os departamentos da Evox Fiscal</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Setor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Setor</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do setor" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição do setor" rows={3} />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-28" />
                </div>
              </div>
              <Button onClick={() => {
                if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
                createSetor.mutate({ nome: form.nome, descricao: form.descricao, cor: form.cor });
              }} disabled={createSetor.isPending} className="w-full">
                {createSetor.isPending ? 'Criando...' : 'Criar Setor'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {setores.data?.map((setor: any) => (
          <Card key={setor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: setor.cor + '20' }}>
                    <Building2 className="w-5 h-5" style={{ color: setor.cor }} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{setor.nome}</CardTitle>
                    {setor.descricao && <p className="text-xs text-muted-foreground mt-0.5">{setor.descricao}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => { if (confirm('Excluir este setor?')) deleteSetor.mutate({ id: setor.id }); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{getMembrosCount(setor.id)} membro(s)</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!setores.data || setores.data.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum setor cadastrado</p>
            <p className="text-xs mt-1">Crie setores para organizar sua equipe</p>
          </div>
        )}
      </div>
    </div>
  );
}
