import { useState, useMemo, useRef } from 'react';
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
import { Plus, Search, Edit2, Trash2, BookOpen, Loader2, Upload, ImageIcon, X } from 'lucide-react';

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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const uploadCapa = trpc.biblioteca.livros.uploadCapa.useMutation({
    onSuccess: (data) => {
      if (data) {
        setForm(p => ({ ...p, capaUrl: data.url }));
        setCoverPreview(data.url);
        toast.success('Capa enviada com sucesso!');
      }
    },
    onError: (e: any) => toast.error('Erro ao enviar capa: ' + e.message),
    onSettled: () => setUploadingCover(false),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setCoverPreview(null);
    setForm({
      titulo: '', autores: '', isbn: '', editora: '', ano: '',
      categoria: '', subcategoria: '', sinopse: '', capaUrl: '',
      idioma: 'Português', edicao: '', classificacao: '',
      areaSugerida: '', linkReferencia: '',
    });
  };

  const handleEdit = (livro: any) => {
    setEditingId(livro.id);
    setCoverPreview(livro.capaUrl || null);
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);

    // If editing an existing book, upload immediately
    if (editingId) {
      setUploadingCover(true);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        uploadCapa.mutate({
          livroId: editingId,
          base64Data: base64,
          mimeType: file.type,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    } else {
      // For new books, store the file data to upload after creation
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        (window as any).__pendingCoverUpload = {
          base64Data: base64,
          mimeType: file.type,
          fileName: file.name,
        };
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
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
      createLivro.mutate(data, {
        onSuccess: async (result: any) => {
          // Upload pending cover for new book
          const pending = (window as any).__pendingCoverUpload;
          if (pending && result?.id) {
            setUploadingCover(true);
            uploadCapa.mutate({
              livroId: result.id,
              ...pending,
            });
            delete (window as any).__pendingCoverUpload;
          }
        },
      });
    }
  };

  const removeCover = () => {
    setCoverPreview(null);
    setForm(p => ({ ...p, capaUrl: '' }));
    delete (window as any).__pendingCoverUpload;
    if (editingId) {
      updateLivro.mutate({ id: editingId, capaUrl: '' });
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
    <>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input placeholder="Buscar por título, autor, ISBN, editora..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted/30 border-border/60 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[180px] bg-muted/30 border-border/60 text-foreground"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] bg-muted/30 border-border/60 text-foreground"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
              <SelectItem value="descontinuado">Descontinuado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-muted/30 border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-[50px]">Capa</TableHead>
                  <TableHead className="text-muted-foreground">Título</TableHead>
                  <TableHead className="text-muted-foreground">Autor(es)</TableHead>
                  <TableHead className="text-muted-foreground">Categoria</TableHead>
                  <TableHead className="text-muted-foreground">Editora</TableHead>
                  <TableHead className="text-muted-foreground">Ano</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livros.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground/50 py-10">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground/50 py-10">Nenhum livro encontrado</TableCell></TableRow>
                ) : filtered.map((livro: any) => (
                  <TableRow key={livro.id} className="border-border/40 hover:bg-muted/50">
                    <TableCell className="py-1.5">
                      {livro.capaUrl ? (
                        <img src={livro.capaUrl} alt={livro.titulo} className="w-9 h-12 object-cover rounded border border-border/60" />
                      ) : (
                        <div className="w-9 h-12 rounded border border-border/60 bg-muted/30 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">{livro.titulo}</TableCell>
                    <TableCell className="text-muted-foreground">{livro.autores}</TableCell>
                    <TableCell><Badge variant="outline" className="border-border text-muted-foreground">{livro.categoria || '-'}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{livro.editora || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{livro.ano || '-'}</TableCell>
                    <TableCell>
                      <Badge className={livro.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                        {livro.status === 'ativo' ? 'Ativo' : livro.status === 'inativo' ? 'Inativo' : 'Descontinuado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-foreground" onClick={() => handleEdit(livro)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400" onClick={() => { if (confirm('Remover este livro?')) deleteLivro.mutate({ id: livro.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border/60 text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Livro' : 'Novo Livro'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {/* Cover Upload Section */}
            <div className="col-span-2">
              <Label className="text-muted-foreground mb-2 block">Capa do Livro</Label>
              <div className="flex items-start gap-4">
                <div className="relative group">
                  {coverPreview || form.capaUrl ? (
                    <div className="relative">
                      <img
                        src={coverPreview || form.capaUrl}
                        alt="Capa"
                        className="w-24 h-32 object-cover rounded-lg border border-border/60"
                      />
                      <button
                        type="button"
                        onClick={removeCover}
                        className="absolute -top-2 -right-2 bg-red-500 text-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {uploadingCover && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1">
                      <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground/50">Sem capa</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="border-border text-muted-foreground hover:bg-muted/60"
                  >
                    {uploadingCover ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Enviar Imagem
                  </Button>
                  <p className="text-xs text-muted-foreground/50">JPG, PNG ou WEBP. Máximo 5MB.</p>
                  <div>
                    <Label className="text-muted-foreground/70 text-xs">Ou cole a URL da capa:</Label>
                    <Input
                      value={form.capaUrl}
                      onChange={(e) => {
                        setForm(p => ({ ...p, capaUrl: e.target.value }));
                        setCoverPreview(e.target.value || null);
                      }}
                      className="bg-muted/30 border-border/60 text-foreground text-xs h-8 mt-1"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <Label className="text-muted-foreground">Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Autor(es) *</Label>
              <Input value={form.autores} onChange={(e) => setForm(p => ({ ...p, autores: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" placeholder="Separar com vírgula" />
            </div>
            <div>
              <Label className="text-muted-foreground">ISBN</Label>
              <Input value={form.isbn} onChange={(e) => setForm(p => ({ ...p, isbn: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Editora</Label>
              <Input value={form.editora} onChange={(e) => setForm(p => ({ ...p, editora: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Ano de Publicação</Label>
              <Input type="number" value={form.ano} onChange={(e) => setForm(p => ({ ...p, ano: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Categoria</Label>
              <Select value={form.categoria || "none"} onValueChange={(v) => setForm(p => ({ ...p, categoria: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-muted/30 border-border/60 text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione</SelectItem>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Subcategoria</Label>
              <Input value={form.subcategoria} onChange={(e) => setForm(p => ({ ...p, subcategoria: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Idioma</Label>
              <Input value={form.idioma} onChange={(e) => setForm(p => ({ ...p, idioma: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Edição</Label>
              <Input value={form.edicao} onChange={(e) => setForm(p => ({ ...p, edicao: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Classificação</Label>
              <Select value={form.classificacao || "none"} onValueChange={(v) => setForm(p => ({ ...p, classificacao: v === "none" ? "" : v as any }))}>
                <SelectTrigger className="bg-muted/30 border-border/60 text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="recomendado">Recomendado</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Área Sugerida</Label>
              <Input value={form.areaSugerida} onChange={(e) => setForm(p => ({ ...p, areaSugerida: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Link de Referência</Label>
              <Input value={form.linkReferencia} onChange={(e) => setForm(p => ({ ...p, linkReferencia: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Sinopse</Label>
              <Textarea value={form.sinopse} onChange={(e) => setForm(p => ({ ...p, sinopse: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-border text-muted-foreground hover:bg-muted/60">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createLivro.isPending || updateLivro.isPending || uploadingCover} className="bg-blue-600 hover:bg-blue-700">
              {(createLivro.isPending || updateLivro.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
