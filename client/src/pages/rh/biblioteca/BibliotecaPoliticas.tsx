import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit2, Trash2, Shield, Loader2, BookOpen, Clock, AlertTriangle, Users } from 'lucide-react';

export default function BibliotecaPoliticas() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ chave: '', valor: '', descricao: '' });

  const utils = trpc.useUtils();
  const politicas = trpc.biblioteca.politicas.list.useQuery();
  const createPolitica = trpc.biblioteca.politicas.upsert.useMutation({
    onSuccess: () => { utils.biblioteca.politicas.list.invalidate(); toast.success('Política salva!'); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updatePolitica = trpc.biblioteca.politicas.upsert.useMutation({
    onSuccess: () => { utils.biblioteca.politicas.list.invalidate(); toast.success('Política atualizada!'); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deletePolitica = trpc.biblioteca.politicas.upsert.useMutation({
    onSuccess: () => { utils.biblioteca.politicas.list.invalidate(); toast.success('Política removida!'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setShowForm(false); setEditingId(null); setForm({ chave: '', valor: '', descricao: '' }); };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({ chave: p.chave || '', valor: p.valor || '', descricao: p.descricao || '' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.chave.trim() || !form.valor.trim()) { toast.error('Chave e Valor são obrigatórios'); return; }
    updatePolitica.mutate({ chave: form.chave, valor: form.valor, descricao: form.descricao || undefined });
  };

  const ICON_MAP: Record<string, any> = {
    prazo: Clock,
    limite: BookOpen,
    penalidade: AlertTriangle,
    renovacao: Users,
  };

  const getIcon = (chave: string) => {
    for (const [key, Icon] of Object.entries(ICON_MAP)) {
      if (chave.toLowerCase().includes(key)) return Icon;
    }
    return Shield;
  };

  const defaultPolicies = [
    { chave: 'prazo_emprestimo_padrao', valor: '14', descricao: 'Prazo padrão de empréstimo em dias' },
    { chave: 'limite_livros_por_colaborador', valor: '3', descricao: 'Máximo de livros emprestados simultaneamente por colaborador' },
    { chave: 'max_renovacoes', valor: '2', descricao: 'Número máximo de renovações permitidas por empréstimo' },
    { chave: 'prazo_reserva_expiracao', valor: '3', descricao: 'Dias para retirar livro após disponibilização da reserva' },
    { chave: 'penalidade_atraso', valor: 'Suspensão de empréstimos por 7 dias', descricao: 'Penalidade aplicada em caso de atraso na devolução' },
    { chave: 'penalidade_extravio', valor: 'Reposição do exemplar + suspensão de 30 dias', descricao: 'Penalidade aplicada em caso de extravio' },
  ];

  return (
    <>
        {/* Current Policies */}
        <div className="space-y-3">
          {politicas.isLoading ? (
            <Card className="bg-white/5 border-white/10"><CardContent className="p-6 text-center text-white/30">Carregando...</CardContent></Card>
          ) : !politicas.data?.length ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 text-center">
                <p className="text-white/50 mb-4">Nenhuma política configurada. Deseja carregar as políticas padrão?</p>
                <Button onClick={() => {
                  defaultPolicies.forEach(p => createPolitica.mutate(p));
                }} className="bg-indigo-600 hover:bg-indigo-700">
                  Carregar Políticas Padrão
                </Button>
              </CardContent>
            </Card>
          ) : politicas.data.map((pol: any) => {
            const Icon = getIcon(pol.chave);
            return (
              <Card key={pol.id} className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-white/40">{pol.chave}</span>
                    </div>
                    <p className="text-white font-semibold">{pol.valor}</p>
                    {pol.descricao && <p className="text-sm text-white/50 mt-1">{pol.descricao}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => handleEdit(pol)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400" onClick={() => { toast.info('Políticas não podem ser removidas, apenas editadas'); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-[#0F2137] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Política' : 'Nova Política'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Chave (identificador) *</Label>
              <Input value={form.chave} onChange={(e) => setForm(p => ({ ...p, chave: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="Ex: prazo_emprestimo_padrao" />
            </div>
            <div>
              <Label className="text-white/70">Valor *</Label>
              <Input value={form.valor} onChange={(e) => setForm(p => ({ ...p, valor: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="Ex: 14" />
            </div>
            <div>
              <Label className="text-white/70">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} className="bg-white/5 border-white/10 text-white" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-white/20 text-white/70 hover:bg-white/10">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createPolitica.isPending || updatePolitica.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {(createPolitica.isPending || updatePolitica.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
