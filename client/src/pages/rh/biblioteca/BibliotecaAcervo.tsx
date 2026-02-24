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
import { ArrowLeft, Plus, Search, Edit2, Trash2, BookOpen, Loader2 } from 'lucide-react';

const CATEGORIAS = [
  'Administração', 'Autoajuda', 'Biografia', 'Ciência', 'Comunicação',
  'Contabilidade', 'Direito', 'Economia', 'Educação', 'Empreendedorismo',
  'Ficção', 'Filosofia', 'Finanças', 'Gestão de Pessoas', 'História',
  'Inovação', 'Liderança', 'Marketing', 'Negócios', 'Psicologia',
  'Tecnologia', 'Tributário', 'Vendas', 'Outro',
];

export default function BibliotecaAcervo() {
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    titulo: '', autores: '', isbn: '', editora: '', ano: '',
    categoria: '', subcategoria: '', sinopse: '', capaUrl: '',
    idioma: 'Português', edicao: '', classificacao: '' as '' | 'essencial' | 'recomendado' | 'avancado',
    areaSugerida: '', linkReferencia: '',
  });

  const utils = trpc.useUtils();
  const livros = trpc.biblioteca.livros.list.useQuery();
  const createLivro = trpc.biblioteca.livros.create.useMutation({
    onSuccess: () => { utils.biblioteca.livros.list.invalidate(); toast.success('Livro cadastrado!'); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateLivro = trpc.biblioteca.livros.update.useMutation({
    onSuccess: () => { utils.biblioteca.livros.list.invalidate(); toast.success('Livro atualizado!'); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteLivro = trpc.biblioteca.livros.delete.useMutation({
    onSuccess: () => { utils.biblioteca.livros.list.invalidate(); toast.success('Livro removido!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      titulo: '', autores: '', isbn: '', editora: '', ano: '',
      categoria: '', subcategoria: '', sinopse: '', capaUrl: '',
      idioma: 'Português', edicao: '', classificacao: '',
      areaSugerida: '', linkReferencia: '',
    });
  };

  const handleEdit = (livro: any) => {
    setEditingId(livro.id);
    setForm({
      titulo: livro.titulo || '',
      autores: livro.autores || '',
      isbn: livro.isbn || '',
      editora: livro.editora || '',
      ano: livro.ano?.toString() || '',
      categoria: livro.categoria || '',
      subcategoria: livro.subcategoria || '',
      sinopse: livro.sinopse || '',
      capaUrl: livro.capaUrl || '',
      idioma: livro.idioma || 'Português',
      edicao: livro.edicao || '',
      classificacao: livro.classificacao || '',
      areaSugerida: livro.areaSugerida || '',
      linkReferencia: livro.linkReferencia || '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.titulo.trim() || !form.autores.trim()) {
      toast.error('Título e Autor são obrigatórios');
      return;
    }
    const data: any = {
      titulo: form.titulo,
      autores: form.autores,
      editora: form.editora || undefined,
      edicao: form.edicao || undefined,
      ano: form.ano ? parseInt(form.ano) : undefined,
      isbn: form.isbn || undefined,
      idioma: form.idioma || undefined,
      categoria: form.categoria || undefined,
      subcategoria: form.subcategoria || undefined,
      sinopse: form.sinopse || undefined,
      capaUrl: form.capaUrl || undefined,
      linkReferencia: form.linkReferencia || undefined,
      classificacao: (form.classificacao as any) || undefined,
      areaSugerida: form.areaSugerida || undefined,
    };
    if (editingId) {
      updateLivro.mutate({ id: editingId, ...data });
    } else {
      createLivro.mutate(data);
    }
  };

  const filtered = useMemo(() => {
    if (!livros.data) return [];
    return livros.data.filter((l: any) => {
      const matchSearch = !search || [l.titulo, l.autores, l.isbn, l.editora, l.categoria]
        .some((f: any) => f?.toLowerCase().includes(search.toLowerCase()));
      const matchCat = filterCategoria === 'all' || l.categoria === filterCategoria;
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [livros.data, search, filterCategoria, filterStatus]);

  return (
    <div className="min-h-screen bg-[#0A1929]">
      <div className="border-b border-white/10 bg-[#0A1929]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/rh/biblioteca">
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" /> Acervo de Livros
              </h1>
              <p className="text-sm text-white/50">{filtered.length} título(s) encontrado(s)</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Livro
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input placeholder="Buscar por título, autor, ISBN, editora..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
              <SelectItem value="descontinuado">Descontinuado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Título</TableHead>
                  <TableHead className="text-white/60">Autor(es)</TableHead>
                  <TableHead className="text-white/60">Categoria</TableHead>
                  <TableHead className="text-white/60">Editora</TableHead>
                  <TableHead className="text-white/60">Ano</TableHead>
                  <TableHead className="text-white/60">ISBN</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livros.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-white/30 py-10">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-white/30 py-10">Nenhum livro encontrado</TableCell></TableRow>
                ) : filtered.map((livro: any) => (
                  <TableRow key={livro.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-white font-medium">{livro.titulo}</TableCell>
                    <TableCell className="text-white/70">{livro.autores}</TableCell>
                    <TableCell><Badge variant="outline" className="border-white/20 text-white/60">{livro.categoria || '-'}</Badge></TableCell>
                    <TableCell className="text-white/70">{livro.editora || '-'}</TableCell>
                    <TableCell className="text-white/70">{livro.ano || '-'}</TableCell>
                    <TableCell className="text-white/50 text-xs font-mono">{livro.isbn || '-'}</TableCell>
                    <TableCell>
                      <Badge className={livro.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                        {livro.status === 'ativo' ? 'Ativo' : livro.status === 'inativo' ? 'Inativo' : 'Descontinuado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => handleEdit(livro)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400" onClick={() => { if (confirm('Remover este livro?')) deleteLivro.mutate({ id: livro.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-[#0F2137] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Livro' : 'Novo Livro'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-white/70">Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Autor(es) *</Label>
              <Input value={form.autores} onChange={(e) => setForm(p => ({ ...p, autores: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="Separar com vírgula" />
            </div>
            <div>
              <Label className="text-white/70">ISBN</Label>
              <Input value={form.isbn} onChange={(e) => setForm(p => ({ ...p, isbn: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Editora</Label>
              <Input value={form.editora} onChange={(e) => setForm(p => ({ ...p, editora: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Ano de Publicação</Label>
              <Input type="number" value={form.ano} onChange={(e) => setForm(p => ({ ...p, ano: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Categoria</Label>
              <Select value={form.categoria || "none"} onValueChange={(v) => setForm(p => ({ ...p, categoria: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione</SelectItem>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Subcategoria</Label>
              <Input value={form.subcategoria} onChange={(e) => setForm(p => ({ ...p, subcategoria: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Idioma</Label>
              <Input value={form.idioma} onChange={(e) => setForm(p => ({ ...p, idioma: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Edição</Label>
              <Input value={form.edicao} onChange={(e) => setForm(p => ({ ...p, edicao: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Classificação</Label>
              <Select value={form.classificacao || "none"} onValueChange={(v) => setForm(p => ({ ...p, classificacao: v === "none" ? "" : v as any }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="recomendado">Recomendado</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Área Sugerida</Label>
              <Input value={form.areaSugerida} onChange={(e) => setForm(p => ({ ...p, areaSugerida: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Link de Referência</Label>
              <Input value={form.linkReferencia} onChange={(e) => setForm(p => ({ ...p, linkReferencia: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label className="text-white/70">URL da Capa</Label>
              <Input value={form.capaUrl} onChange={(e) => setForm(p => ({ ...p, capaUrl: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label className="text-white/70">Sinopse</Label>
              <Textarea value={form.sinopse} onChange={(e) => setForm(p => ({ ...p, sinopse: e.target.value }))} className="bg-white/5 border-white/10 text-white" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-white/20 text-white/70 hover:bg-white/10">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createLivro.isPending || updateLivro.isPending} className="bg-blue-600 hover:bg-blue-700">
              {(createLivro.isPending || updateLivro.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
