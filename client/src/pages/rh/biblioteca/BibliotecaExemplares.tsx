import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Package, Loader2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  disponivel: { label: 'Disponível', color: 'bg-emerald-500/20 text-emerald-400' },
  emprestado: { label: 'Emprestado', color: 'bg-amber-500/20 text-amber-400' },
  reservado: { label: 'Reservado', color: 'bg-blue-500/20 text-blue-400' },
  manutencao: { label: 'Manutenção', color: 'bg-orange-500/20 text-orange-400' },
  extraviado: { label: 'Extraviado', color: 'bg-red-500/20 text-red-400' },
};

const CONDICOES = ['novo', 'bom', 'regular', 'desgastado', 'danificado'];
const ORIGENS = ['compra', 'doacao', 'transferencia', 'outro'];

export default function BibliotecaExemplares() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    livroId: '', codigoPatrimonial: '', condicao: 'novo' as 'novo' | 'bom' | 'regular' | 'danificado',
    localizacao: '', origem: 'aquisicao' as 'aquisicao' | 'doacao' | 'transferencia',
    fornecedorId: '', observacoes: '',
  });

  const utils = trpc.useUtils();
  const exemplares = trpc.biblioteca.exemplares.list.useQuery();
  const livros = trpc.biblioteca.livros.list.useQuery();
  const createExemplar = trpc.biblioteca.exemplares.create.useMutation({
    onSuccess: () => { utils.biblioteca.exemplares.list.invalidate(); toast.success('Exemplar cadastrado!'); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateExemplar = trpc.biblioteca.exemplares.update.useMutation({
    onSuccess: () => { utils.biblioteca.exemplares.list.invalidate(); toast.success('Exemplar atualizado!'); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteExemplar = trpc.biblioteca.exemplares.delete.useMutation({
    onSuccess: () => { utils.biblioteca.exemplares.list.invalidate(); toast.success('Exemplar removido!'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setForm({ livroId: '', codigoPatrimonial: '', condicao: 'novo' as any, localizacao: '', origem: 'aquisicao' as any, fornecedorId: '', observacoes: '' });
  };

  const livroMap = useMemo(() => {
    const map = new Map<number, string>();
    livros.data?.forEach((l: any) => map.set(l.id, l.titulo));
    return map;
  }, [livros.data]);

  const handleEdit = (ex: any) => {
    setEditingId(ex.id);
    setForm({
      livroId: ex.livroId?.toString() || '',
      codigoPatrimonial: ex.codigoPatrimonial || '',
      condicao: (ex.condicao || 'novo') as any,
      localizacao: ex.localizacao || '',
      origem: (ex.origem || 'aquisicao') as any,
      fornecedorId: ex.fornecedorId?.toString() || '',
      observacoes: ex.observacoes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.livroId) { toast.error('Selecione o livro'); return; }
    if (editingId) {
      updateExemplar.mutate({
        id: editingId,
        codigoPatrimonial: form.codigoPatrimonial || undefined,
        condicao: form.condicao as any,
        localizacao: form.localizacao || undefined,
        observacoes: form.observacoes || undefined,
      });
    } else {
      createExemplar.mutate({
        livroId: parseInt(form.livroId),
        codigoPatrimonial: form.codigoPatrimonial || `PAT-${Date.now()}`,
        condicao: form.condicao as any,
        localizacao: form.localizacao || undefined,
        origem: form.origem as any,
        fornecedorId: form.fornecedorId ? parseInt(form.fornecedorId) : undefined,
        observacoes: form.observacoes || undefined,
      });
    }
  };

  const filtered = useMemo(() => {
    if (!exemplares.data) return [];
    return exemplares.data.filter((e: any) => {
      const titulo = livroMap.get(e.livroId) || '';
      const matchSearch = !search || [titulo, e.codigoPatrimonial, e.localizacao]
        .some(f => f?.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [exemplares.data, search, filterStatus, livroMap]);

  return (
    <>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input placeholder="Buscar por título, código, localização..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Livro</TableHead>
                  <TableHead className="text-white/60">Cód. Patrimônio</TableHead>
                  <TableHead className="text-white/60">Condição</TableHead>
                  <TableHead className="text-white/60">Localização</TableHead>
                  <TableHead className="text-white/60">Origem</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exemplares.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-white/30 py-10">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-white/30 py-10">Nenhum exemplar encontrado</TableCell></TableRow>
                ) : filtered.map((ex: any) => {
                  const st = STATUS_MAP[ex.status] || { label: ex.status, color: 'bg-gray-500/20 text-gray-400' };
                  return (
                    <TableRow key={ex.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{livroMap.get(ex.livroId) || `#${ex.livroId}`}</TableCell>
                      <TableCell className="text-white/70 font-mono text-xs">{ex.codigoPatrimonial || '-'}</TableCell>

                      <TableCell className="text-white/70 capitalize">{ex.condicao}</TableCell>
                      <TableCell className="text-white/70">{ex.localizacao || '-'}</TableCell>
                      <TableCell className="text-white/70 capitalize">{ex.origem}</TableCell>
                      <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => handleEdit(ex)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400" onClick={() => { if (confirm('Remover?')) deleteExemplar.mutate({ id: ex.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-[#0F2137] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Exemplar' : 'Novo Exemplar'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Livro *</Label>
              <Select value={form.livroId} onValueChange={(v) => setForm(p => ({ ...p, livroId: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecione o livro" /></SelectTrigger>
                <SelectContent>
                  {livros.data?.map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70">Cód. Patrimônio</Label>
                <Input value={form.codigoPatrimonial} onChange={(e) => setForm(p => ({ ...p, codigoPatrimonial: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="BIB-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70">Condição</Label>
                <Select value={form.condicao} onValueChange={(v) => setForm(p => ({ ...p, condicao: v as any }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDICOES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Origem</Label>
                <Select value={form.origem} onValueChange={(v) => setForm(p => ({ ...p, origem: v as any }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/70">Localização</Label>
              <Input value={form.localizacao} onChange={(e) => setForm(p => ({ ...p, localizacao: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="Estante A, Prateleira 3" />
            </div>
            <div>
              <Label className="text-white/70">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))} className="bg-white/5 border-white/10 text-white" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-white/20 text-white/70 hover:bg-white/10">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createExemplar.isPending || updateExemplar.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {(createExemplar.isPending || updateExemplar.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
