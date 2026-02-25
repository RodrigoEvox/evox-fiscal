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
import { ArrowLeft, Plus, Search, Edit2, Trash2, Truck, Loader2 } from 'lucide-react';

export default function BibliotecaFornecedores() {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: '', tipo: 'fornecedor', contato: '', email: '',
    telefone: '', endereco: '', cnpjCpf: '', observacoes: '',
  });

  const utils = trpc.useUtils();
  const fornecedores = trpc.biblioteca.fornecedores.list.useQuery();
  const createFornecedor = trpc.biblioteca.fornecedores.create.useMutation({
    onSuccess: () => { utils.biblioteca.fornecedores.list.invalidate(); toast.success('Cadastrado com sucesso!'); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateFornecedor = trpc.biblioteca.fornecedores.update.useMutation({
    onSuccess: () => { utils.biblioteca.fornecedores.list.invalidate(); toast.success('Atualizado!'); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteFornecedor = trpc.biblioteca.fornecedores.delete.useMutation({
    onSuccess: () => { utils.biblioteca.fornecedores.list.invalidate(); toast.success('Removido!'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setForm({ nome: '', tipo: 'fornecedor', contato: '', email: '', telefone: '', endereco: '', cnpjCpf: '', observacoes: '' });
  };

  const handleEdit = (f: any) => {
    setEditingId(f.id);
    setForm({
      nome: f.nome || '', tipo: f.tipo || 'fornecedor', contato: f.contato || '',
      email: f.email || '', telefone: f.telefone || '', endereco: f.endereco || '',
      cnpjCpf: f.cnpjCpf || '', observacoes: f.observacoes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (editingId) {
      updateFornecedor.mutate({
        id: editingId,
        nome: form.nome || undefined,
        tipo: form.tipo as 'fornecedor' | 'doador' | 'ambos',
        contato: form.contato || undefined,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
        observacoes: form.observacoes || undefined,
      });
    } else {
      createFornecedor.mutate({
        nome: form.nome,
        tipo: form.tipo as 'fornecedor' | 'doador' | 'ambos',
        contato: form.contato || undefined,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
        observacoes: form.observacoes || undefined,
      });
    }
  };

  const filtered = useMemo(() => {
    if (!fornecedores.data) return [];
    return fornecedores.data.filter((f: any) => {
      const matchSearch = !search || [f.nome, f.contato, f.email, f.cnpjCpf].some(v => v?.toLowerCase().includes(search.toLowerCase()));
      const matchTipo = filterTipo === 'all' || f.tipo === filterTipo;
      return matchSearch && matchTipo;
    });
  }, [fornecedores.data, search, filterTipo]);

  return (
    <>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input placeholder="Buscar por nome, contato, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted/30 border-border/60 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[160px] bg-muted/30 border-border/60 text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="fornecedor">Fornecedor</SelectItem>
              <SelectItem value="doador">Doador</SelectItem>
              <SelectItem value="parceiro">Parceiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-muted/30 border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground">Tipo</TableHead>
                  <TableHead className="text-muted-foreground">Contato</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Telefone</TableHead>
                  <TableHead className="text-muted-foreground">CNPJ/CPF</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground/50 py-10">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground/50 py-10">Nenhum registro encontrado</TableCell></TableRow>
                ) : filtered.map((f: any) => (
                  <TableRow key={f.id} className="border-border/40 hover:bg-muted/50">
                    <TableCell className="text-foreground font-medium">{f.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border text-muted-foreground capitalize">{f.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{f.contato || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{f.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{f.telefone || '-'}</TableCell>
                    <TableCell className="text-muted-foreground/70 font-mono text-xs">{f.cnpjCpf || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-foreground" onClick={() => handleEdit(f)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/60 hover:text-red-400" onClick={() => { if (confirm('Remover?')) deleteFornecedor.mutate({ id: f.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border/60 text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Novo Fornecedor/Doador'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-muted-foreground">Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger className="bg-muted/30 border-border/60 text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="doador">Doador</SelectItem>
                  <SelectItem value="parceiro">Parceiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">CNPJ/CPF</Label>
              <Input value={form.cnpjCpf} onChange={(e) => setForm(p => ({ ...p, cnpjCpf: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Contato</Label>
              <Input value={form.contato} onChange={(e) => setForm(p => ({ ...p, contato: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <Input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm(p => ({ ...p, telefone: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm(p => ({ ...p, endereco: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-border text-muted-foreground hover:bg-muted/60">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createFornecedor.isPending || updateFornecedor.isPending} className="bg-orange-600 hover:bg-orange-700">
              {(createFornecedor.isPending || updateFornecedor.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
