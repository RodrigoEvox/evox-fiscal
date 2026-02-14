import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Handshake, Plus, Search, Edit, Loader2, Phone, Mail, MapPin, Trash2 } from 'lucide-react';

export default function Parceiros() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewParceiro, setViewParceiro] = useState<any>(null);
  const [form, setForm] = useState({
    nome: '', documento: '', tipo: 'pj' as string, email: '', telefone: '',
    endereco: '', comissaoPercentual: 0, ativo: true,
  });
  const utils = trpc.useUtils();

  const { data: parceiros = [], isLoading } = trpc.parceiros.list.useQuery();
  const createMutation = trpc.parceiros.create.useMutation({
    onSuccess: () => {
      utils.parceiros.list.invalidate();
      setShowForm(false);
      setForm({ nome: '', documento: '', tipo: 'pj', email: '', telefone: '', endereco: '', comissaoPercentual: 0, ativo: true });
      toast.success('Parceiro cadastrado!');
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = parceiros.filter((p: any) => {
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase()) && !p.documento.includes(search)) return false;
    return true;
  });

  const handleCreate = () => {
    if (!form.nome || !form.documento) { toast.error('Preencha nome e documento'); return; }
    createMutation.mutate(form as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Handshake className="w-6 h-6" /> Parceiros Comerciais</h1>
          <p className="text-sm text-muted-foreground mt-1">{parceiros.length} parceiros cadastrados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#0A2540] hover:bg-[#0A2540]/90"><Plus className="w-4 h-4 mr-2" /> Novo Parceiro</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar parceiros..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum parceiro cadastrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: any) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewParceiro(p)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center shrink-0">
                    <Handshake className="w-5 h-5 text-[#0A2540]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{p.nome}</h3>
                      <Badge variant={p.ativo ? 'default' : 'secondary'} className={p.ativo ? 'bg-green-100 text-green-700' : ''}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.documento}</p>
                    {p.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {p.email}</p>}
                    {p.telefone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {p.telefone}</p>}
                    {p.comissaoPercentual > 0 && <p className="text-xs font-medium text-[#0A2540] mt-1">Comissão: {p.comissaoPercentual}%</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewParceiro} onOpenChange={() => setViewParceiro(null)}>
        <DialogContent>
          {viewParceiro && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Handshake className="w-5 h-5" /> {viewParceiro.nome}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Documento</Label><p className="text-sm font-medium">{viewParceiro.documento}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Tipo</Label><p className="text-sm font-medium">{viewParceiro.tipo === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">E-mail</Label><p className="text-sm">{viewParceiro.email || 'N/A'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Telefone</Label><p className="text-sm">{viewParceiro.telefone || 'N/A'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Comissão</Label><p className="text-sm font-medium">{viewParceiro.comissaoPercentual}%</p></div>
                  <div><Label className="text-xs text-muted-foreground">Status</Label><Badge variant={viewParceiro.ativo ? 'default' : 'secondary'}>{viewParceiro.ativo ? 'Ativo' : 'Inativo'}</Badge></div>
                </div>
                {viewParceiro.endereco && (
                  <div><Label className="text-xs text-muted-foreground">Endereço</Label><p className="text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {viewParceiro.endereco}</p></div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Parceiro</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label className="text-xs">Documento (CPF/CNPJ) *</Label><Input value={form.documento} onChange={e => setForm(f => ({ ...f, documento: e.target.value }))} /></div>
            <div><Label className="text-xs">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pf">Pessoa Física</SelectItem>
                  <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Endereço</Label><Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
            <div><Label className="text-xs">Comissão (%)</Label><Input type="number" value={form.comissaoPercentual} onChange={e => setForm(f => ({ ...f, comissaoPercentual: Number(e.target.value) }))} /></div>
            <div className="flex items-end"><div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} /><Label className="text-xs">Ativo</Label></div></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
