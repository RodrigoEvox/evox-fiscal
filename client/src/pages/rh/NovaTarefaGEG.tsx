import { Link } from 'wouter';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Clock, CheckCircle2, AlertCircle, Trash2, Edit2, ArrowLeft} from 'lucide-react';

const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-gray-100 text-gray-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
};

export default function NovaTarefaGEG() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    titulo: '', descricao: '', responsavelId: 0, responsavelNome: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente', dataInicio: '', dataFim: '', observacao: '',
  });

  const setores = trpc.setores.list.useQuery();
  const gegSetor = (setores.data as any[])?.find((s: any) => s.nome?.includes('Gente'));
  const setorId = gegSetor?.id || 0;

  const tarefas = trpc.tarefasSetor.list.useQuery({ setorId }, { enabled: !!setorId });
  const users = trpc.users.list.useQuery();
  const createMut = trpc.tarefasSetor.create.useMutation({ onSuccess: () => { tarefas.refetch(); setShowForm(false); resetForm(); toast.success('Tarefa criada!'); } });
  const updateMut = trpc.tarefasSetor.update.useMutation({ onSuccess: () => { tarefas.refetch(); setShowForm(false); resetForm(); toast.success('Tarefa atualizada!'); } });
  const deleteMut = trpc.tarefasSetor.delete.useMutation({ onSuccess: () => { tarefas.refetch(); toast.success('Tarefa excluída!'); } });

  const resetForm = () => {
    setForm({ titulo: '', descricao: '', responsavelId: 0, responsavelNome: '', prioridade: 'media', dataInicio: '', dataFim: '', observacao: '' });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.titulo.trim()) { toast.error('Informe o título da tarefa'); return; }
    if (editId) {
      updateMut.mutate({ id: editId, data: { ...form, setorId } });
    } else {
      createMut.mutate({ ...form, setorId, responsavelId: form.responsavelId || undefined, responsavelNome: form.responsavelNome || undefined });
    }
  };

  const openEdit = (t: any) => {
    setForm({
      titulo: t.titulo || '', descricao: t.descricao || '',
      responsavelId: t.responsavelId || 0, responsavelNome: t.responsavelNome || '',
      prioridade: t.prioridade || 'media', dataInicio: t.dataInicio || '',
      dataFim: t.dataFim || '', observacao: t.observacao || '',
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const tarefasList = (tarefas.data || []) as any[];
  const pendentes = tarefasList.filter(t => t.status === 'pendente' || !t.status);
  const emAndamento = tarefasList.filter(t => t.status === 'em_andamento');
  const concluidas = tarefasList.filter(t => t.status === 'concluida');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/gestao-rh"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold">Nova Tarefa — Gente & Gestão</h1>

              <p className="text-muted-foreground">Gerencie as tarefas do setor</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>
      </div>

      {/* Kanban-like columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pendentes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Pendentes ({pendentes.length})</h3>
          </div>
          {pendentes.map((t: any) => (
            <TarefaCard key={t.id} tarefa={t} onEdit={() => openEdit(t)} onDelete={() => deleteMut.mutate({ id: t.id })} onStatusChange={(s) => updateMut.mutate({ id: t.id, data: { status: s } })} />
          ))}
        </div>
        {/* Em Andamento */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm uppercase tracking-wide text-blue-500">Em Andamento ({emAndamento.length})</h3>
          </div>
          {emAndamento.map((t: any) => (
            <TarefaCard key={t.id} tarefa={t} onEdit={() => openEdit(t)} onDelete={() => deleteMut.mutate({ id: t.id })} onStatusChange={(s) => updateMut.mutate({ id: t.id, data: { status: s } })} />
          ))}
        </div>
        {/* Concluídas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-sm uppercase tracking-wide text-green-500">Concluídas ({concluidas.length})</h3>
          </div>
          {concluidas.map((t: any) => (
            <TarefaCard key={t.id} tarefa={t} onEdit={() => openEdit(t)} onDelete={() => deleteMut.mutate({ id: t.id })} onStatusChange={(s) => updateMut.mutate({ id: t.id, data: { status: s } })} />
          ))}
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Nome da tarefa" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes da tarefa" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsável</Label>
                <Select value={form.responsavelId ? String(form.responsavelId) : ''} onValueChange={v => {
                  const u = (users.data as any[])?.find((u: any) => u.id === Number(v));
                  setForm(f => ({ ...f, responsavelId: Number(v), responsavelNome: u?.name || '' }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {(users.data as any[] || []).filter((u: any) => u.ativo !== false).map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v as 'baixa' | 'media' | 'alta' | 'urgente' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={form.dataFim} onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {editId ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TarefaCard({ tarefa, onEdit, onDelete, onStatusChange }: { tarefa: any; onEdit: () => void; onDelete: () => void; onStatusChange: (s: string) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm leading-tight">{tarefa.titulo}</h4>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1 hover:bg-muted rounded"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
            <button onClick={onDelete} className="p-1 hover:bg-muted rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        </div>
        {tarefa.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{tarefa.descricao}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-[10px] ${PRIORIDADE_COLORS[tarefa.prioridade] || PRIORIDADE_COLORS.media}`}>
            {tarefa.prioridade || 'média'}
          </Badge>
          {tarefa.responsavelNome && <span className="text-[10px] text-muted-foreground">👤 {tarefa.responsavelNome}</span>}
          {tarefa.dataFim && <span className="text-[10px] text-muted-foreground">📅 {tarefa.dataFim}</span>}
        </div>
        <div className="flex gap-1 pt-1">
          {(!tarefa.status || tarefa.status === 'pendente') && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onStatusChange('em_andamento')}>Iniciar</Button>
          )}
          {tarefa.status === 'em_andamento' && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onStatusChange('concluida')}>Concluir</Button>
          )}
          {tarefa.status === 'concluida' && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onStatusChange('pendente')}>Reabrir</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
