import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, Heart, Droplets, Leaf, BarChart3, Trophy, Search, Edit2, Trash2 } from 'lucide-react';

const TIPO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  fit: { label: 'Ação Fit', icon: Heart, color: 'bg-green-100 text-green-800' },
  solidaria: { label: 'Ação Solidária', icon: Droplets, color: 'bg-blue-100 text-blue-800' },
  engajamento: { label: 'Ação de Engajamento', icon: BarChart3, color: 'bg-purple-100 text-purple-800' },
  doacao_sangue: { label: 'Doação de Sangue', icon: Droplets, color: 'bg-red-100 text-red-800' },
  sustentabilidade: { label: 'Sustentabilidade', icon: Leaf, color: 'bg-emerald-100 text-emerald-800' },
  outro: { label: 'Outro', icon: Trophy, color: 'bg-gray-100 text-gray-800' },
};

export default function AcoesBeneficios() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [form, setForm] = useState({
    titulo: '', tipo: 'fit' as string, descricao: '', dataInicio: '', dataFim: '',
    metaParticipantes: 0, participantesAtuais: 0, responsavel: '', status: 'ativa' as string,
    observacao: '',
  });

  const acoes = trpc.acoesBeneficios.list.useQuery();
  const createMut = trpc.acoesBeneficios.create.useMutation({ onSuccess: () => { acoes.refetch(); setShowForm(false); resetForm(); toast.success('Ação cadastrada!'); } });
  const updateMut = trpc.acoesBeneficios.update.useMutation({ onSuccess: () => { acoes.refetch(); setShowForm(false); resetForm(); toast.success('Ação atualizada!'); } });
  const deleteMut = trpc.acoesBeneficios.delete.useMutation({ onSuccess: () => { acoes.refetch(); toast.success('Ação excluída!'); } });

  const resetForm = () => {
    setForm({ titulo: '', tipo: 'fit', descricao: '', dataInicio: '', dataFim: '', metaParticipantes: 0, participantesAtuais: 0, responsavel: '', status: 'ativa', observacao: '' });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.titulo.trim()) { toast.error('Informe o título'); return; }
    const payload = { ...form, tipo: form.tipo as any, status: form.status as any };
    if (editId) {
      updateMut.mutate({ id: editId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const openEdit = (a: any) => {
    setForm({ titulo: a.titulo || '', tipo: a.tipo || 'fit', descricao: a.descricao || '', dataInicio: a.dataInicio || '', dataFim: a.dataFim || '', metaParticipantes: a.metaParticipantes || 0, participantesAtuais: a.participantesAtuais || 0, responsavel: a.responsavel || '', status: a.status || 'ativa', observacao: a.observacao || '' });
    setEditId(a.id);
    setShowForm(true);
  };

  const list = (acoes.data || []) as any[];
  const filtered = useMemo(() => {
    let items = list;
    if (filterTipo !== 'todos') items = items.filter(a => a.tipo === filterTipo);
    if (search.trim()) {
      const s = search.toLowerCase();
      items = items.filter(a => a.titulo?.toLowerCase().includes(s) || a.responsavel?.toLowerCase().includes(s));
    }
    return items;
  }, [list, filterTipo, search]);

  const ativas = filtered.filter(a => a.status === 'ativa');
  const concluidas = filtered.filter(a => a.status === 'concluida');

  // Stats
  const totalAcoes = list.length;
  const totalAtivas = list.filter(a => a.status === 'ativa').length;
  const totalParticipantes = list.reduce((sum, a) => sum + (a.participantesAtuais || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ações e Benefícios</h1>
          <p className="text-muted-foreground">Gestão de ações fit, solidárias, engajamento e doação de sangue — Gente & Gestão</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Nova Ação</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalAcoes}</p><p className="text-xs text-muted-foreground">Total de Ações</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{totalAtivas}</p><p className="text-xs text-muted-foreground">Ativas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{totalParticipantes}</p><p className="text-xs text-muted-foreground">Participantes</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar ação..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ativas.map((a: any) => {
          const tipoInfo = TIPO_LABELS[a.tipo] || TIPO_LABELS.outro;
          const Icon = tipoInfo.icon;
          const progress = a.metaParticipantes > 0 ? Math.min(100, Math.round((a.participantesAtuais / a.metaParticipantes) * 100)) : 0;
          return (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tipoInfo.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{a.titulo}</h4>
                      <Badge className={`text-[10px] ${tipoInfo.color}`}>{tipoInfo.label}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="p-1 hover:bg-muted rounded"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => deleteMut.mutate({ id: a.id })} className="p-1 hover:bg-muted rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                {a.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{a.descricao}</p>}
                {a.metaParticipantes > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{a.participantesAtuais}/{a.metaParticipantes} participantes</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  {a.dataInicio && <span>Início: {a.dataInicio}</span>}
                  {a.dataFim && <span>Fim: {a.dataFim}</span>}
                  {a.responsavel && <span>Resp: {a.responsavel}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {concluidas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Concluídas ({concluidas.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {concluidas.map((a: any) => {
              const tipoInfo = TIPO_LABELS[a.tipo] || TIPO_LABELS.outro;
              return (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${tipoInfo.color}`}>{tipoInfo.label}</Badge>
                      <h4 className="font-medium text-sm">{a.titulo}</h4>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar Ação' : 'Nova Ação'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Início</Label><Input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={form.dataFim} onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Meta de Participantes</Label><Input type="number" value={form.metaParticipantes} onChange={e => setForm(f => ({ ...f, metaParticipantes: Number(e.target.value) }))} /></div>
              <div><Label>Participantes Atuais</Label><Input type="number" value={form.participantesAtuais} onChange={e => setForm(f => ({ ...f, participantesAtuais: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observação</Label><Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
