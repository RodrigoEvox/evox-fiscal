import { Link } from 'wouter';
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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, GraduationCap, Target, Search, Edit2, TrendingUp, Star, BookOpen, ArrowLeft, XCircle} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  pausado: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-800' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function CarreiraDesenvolvimento() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    colaboradorId: 0, colaboradorNome: '', titulo: '', tipo: 'treinamento' as string,
    descricao: '', dataInicio: '', dataFim: '', progresso: 0, competencias: '',
    mentor: '', status: 'em_andamento' as string, observacao: '',
  });

  const colaboradores = trpc.colaboradores.list.useQuery();
  const planos = trpc.planosCarreira.list.useQuery();
  const createMut = trpc.planosCarreira.create.useMutation({ onSuccess: () => { planos.refetch(); setShowForm(false); resetForm(); toast.success('Plano cadastrado!'); } });
  const updateMut = trpc.planosCarreira.update.useMutation({ onSuccess: () => { planos.refetch(); setShowForm(false); resetForm(); toast.success('Plano atualizado!'); } });

  const resetForm = () => {
    setForm({ colaboradorId: 0, colaboradorNome: '', titulo: '', tipo: 'treinamento', descricao: '', dataInicio: '', dataFim: '', progresso: 0, competencias: '', mentor: '', status: 'em_andamento', observacao: '' });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.colaboradorId) { toast.error('Selecione o colaborador'); return; }
    if (!form.titulo.trim()) { toast.error('Informe o título'); return; }
    const competenciasArr = form.competencias ? form.competencias.split(',').map(c => ({ nome: c.trim(), nivelAtual: 1, nivelAlvo: 5 })) : [];
    const payload = { ...form, tipo: form.tipo as any, status: form.status as any, competencias: competenciasArr };
    if (editId) {
      updateMut.mutate({ id: editId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const openEdit = (p: any) => {
    setForm({
      colaboradorId: p.colaboradorId || 0, colaboradorNome: p.colaboradorNome || '',
      titulo: p.titulo || '', tipo: p.tipo || 'treinamento', descricao: p.descricao || '',
      dataInicio: p.dataInicio || '', dataFim: p.dataFim || '', progresso: p.progresso || 0,
      competencias: p.competencias || '', mentor: p.mentor || '',
      status: p.status || 'em_andamento', observacao: p.observacao || '',
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const colabList = (colaboradores.data || []) as any[];
  const list = (planos.data || []) as any[];

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((p: any) => p.colaboradorNome?.toLowerCase().includes(s) || p.titulo?.toLowerCase().includes(s));
  }, [list, search]);

  const emAndamento = filtered.filter(p => p.status === 'em_andamento');
  const concluidos = filtered.filter(p => p.status === 'concluido');
  const outros = filtered.filter(p => p.status !== 'em_andamento' && p.status !== 'concluido');

  // Stats
  const totalPlanos = list.length;
  const totalEmAndamento = list.filter(p => p.status === 'em_andamento').length;
  const totalConcluidos = list.filter(p => p.status === 'concluido').length;
  const progressoMedio = list.length > 0 ? Math.round(list.reduce((sum, p) => sum + (p.progresso || 0), 0) / list.length) : 0;

  const TIPO_ICONS: Record<string, any> = {
    treinamento: BookOpen, certificacao: Star, mentoria: GraduationCap,
    plano_carreira: TrendingUp, meta: Target,
  };
  const TIPO_LABELS: Record<string, string> = {
    treinamento: 'Treinamento', certificacao: 'Certificação', mentoria: 'Mentoria',
    plano_carreira: 'Plano de Carreira', meta: 'Meta',
  };

  
  const clearAllFilters = () => {
    setSearch("");
  };
return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/carreira"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold">Carreira & Desenvolvimento</h1>

              <p className="text-muted-foreground">Planos de carreira, treinamentos e desenvolvimento — Gente & Gestão</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Plano</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalPlanos}</p><p className="text-xs text-muted-foreground">Total de Planos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{totalEmAndamento}</p><p className="text-xs text-muted-foreground">Em Andamento</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{totalConcluidos}</p><p className="text-xs text-muted-foreground">Concluídos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{progressoMedio}%</p><p className="text-xs text-muted-foreground">Progresso Médio</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por colaborador ou título..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Em Andamento */}
      {emAndamento.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Em Andamento ({emAndamento.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emAndamento.map((p: any) => {
              const Icon = TIPO_ICONS[p.tipo] || Target;
              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(p)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{p.titulo}</h4>
                          <p className="text-xs text-muted-foreground">{p.colaboradorNome}</p>
                        </div>
                      </div>
                      <Badge className="text-[10px]" variant="outline">{TIPO_LABELS[p.tipo] || p.tipo}</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progresso</span><span>{p.progresso || 0}%</span>
                      </div>
                      <Progress value={p.progresso || 0} className="h-2" />
                    </div>
                    {p.competencias && <p className="text-[10px] text-muted-foreground">Competências: {p.competencias}</p>}
                    {p.mentor && <p className="text-[10px] text-muted-foreground">Mentor: {p.mentor}</p>}
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      {p.dataInicio && <span>Início: {p.dataInicio}</span>}
                      {p.dataFim && <span>Fim: {p.dataFim}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Concluídos */}
      {concluidos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Concluídos ({concluidos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {concluidos.map((p: any) => (
              <Card key={p.id} className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => openEdit(p)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-green-500" />
                    <div>
                      <h4 className="font-medium text-sm">{p.titulo}</h4>
                      <p className="text-xs text-muted-foreground">{p.colaboradorNome}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {outros.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Outros ({outros.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outros.map((p: any) => (
              <Card key={p.id} className="opacity-60 cursor-pointer" onClick={() => openEdit(p)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{p.titulo}</h4>
                      <p className="text-xs text-muted-foreground">{p.colaboradorNome}</p>
                    </div>
                    <Badge className={`text-[10px] ${STATUS_LABELS[p.status]?.color || ''}`}>{STATUS_LABELS[p.status]?.label || p.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum plano de desenvolvimento encontrado.</p>}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar Plano' : 'Novo Plano de Desenvolvimento'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={v => {
                const c = colabList.find((c: any) => c.id === Number(v));
                setForm(f => ({ ...f, colaboradorId: Number(v), colaboradorNome: c?.nomeCompleto || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {colabList.filter(c => c.ativo !== false).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
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
              <div><Label>Progresso (%)</Label><Input type="number" min={0} max={100} value={form.progresso} onChange={e => setForm(f => ({ ...f, progresso: Number(e.target.value) }))} /></div>
              <div><Label>Mentor</Label><Input value={form.mentor} onChange={e => setForm(f => ({ ...f, mentor: e.target.value }))} /></div>
            </div>
            <div><Label>Competências</Label><Input value={form.competencias} onChange={e => setForm(f => ({ ...f, competencias: e.target.value }))} placeholder="Ex: Liderança, Comunicação, Excel" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
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
