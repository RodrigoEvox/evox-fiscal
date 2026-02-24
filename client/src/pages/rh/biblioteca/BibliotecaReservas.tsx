import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, CalendarCheck, Loader2, X, CheckCircle2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400' },
  disponivel: { label: 'Disponível', color: 'bg-emerald-500/20 text-emerald-400' },
  atendida: { label: 'Atendida', color: 'bg-blue-500/20 text-blue-400' },
  cancelada: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400' },
  expirada: { label: 'Expirada', color: 'bg-gray-500/20 text-gray-400' },
};

export default function BibliotecaReservas() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ livroId: '', colaboradorId: '', colaboradorNome: '' });

  const utils = trpc.useUtils();
  const reservas = trpc.biblioteca.reservas.list.useQuery();
  const livros = trpc.biblioteca.livros.list.useQuery();
  const createReserva = trpc.biblioteca.reservas.create.useMutation({
    onSuccess: () => { utils.biblioteca.reservas.list.invalidate(); toast.success('Reserva criada!'); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const cancelReserva = trpc.biblioteca.reservas.cancelar.useMutation({
    onSuccess: () => { utils.biblioteca.reservas.list.invalidate(); toast.success('Reserva cancelada!'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setShowForm(false); setForm({ livroId: '', colaboradorId: '', colaboradorNome: '' }); };

  const livroMap = useMemo(() => {
    const map = new Map<number, string>();
    livros.data?.forEach((l: any) => map.set(l.id, l.titulo));
    return map;
  }, [livros.data]);

  const handleSubmit = () => {
    if (!form.livroId || !form.colaboradorNome.trim()) {
      toast.error('Selecione o livro e informe o colaborador');
      return;
    }
    createReserva.mutate({
      livroId: parseInt(form.livroId),
      colaboradorId: form.colaboradorId ? parseInt(form.colaboradorId) : 0,
      colaboradorNome: form.colaboradorNome,
      dataReserva: new Date().toISOString().split('T')[0],
    });
  };

  const filtered = useMemo(() => {
    if (!reservas.data) return [];
    return reservas.data.filter((r: any) => {
      const titulo = livroMap.get(r.livroId) || '';
      const matchSearch = !search || [r.colaboradorNome, titulo].some(f => f?.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [reservas.data, search, filterStatus, livroMap]);

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  return (
    <>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input placeholder="Buscar por colaborador, livro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Colaborador</TableHead>
                  <TableHead className="text-white/60">Livro</TableHead>
                  <TableHead className="text-white/60">Data Reserva</TableHead>
                  <TableHead className="text-white/60">Posição Fila</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservas.isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-white/30 py-10">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-white/30 py-10">Nenhuma reserva encontrada</TableCell></TableRow>
                ) : filtered.map((res: any) => {
                  const st = STATUS_MAP[res.status] || { label: res.status, color: 'bg-gray-500/20 text-gray-400' };
                  return (
                    <TableRow key={res.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{res.colaboradorNome}</TableCell>
                      <TableCell className="text-white/70">{livroMap.get(res.livroId) || `#${res.livroId}`}</TableCell>
                      <TableCell className="text-white/70">{formatDate(res.dataReserva)}</TableCell>
                      <TableCell className="text-white/70 text-center">{res.posicaoFila || '-'}</TableCell>
                      <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        {res.status === 'pendente' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => cancelReserva.mutate({ id: res.id })}
                            disabled={cancelReserva.isPending}>
                            <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-[#0F2137] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Nova Reserva</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Livro *</Label>
              <Select value={form.livroId} onValueChange={(v) => setForm(p => ({ ...p, livroId: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {livros.data?.map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Nome do Colaborador *</Label>
              <Input value={form.colaboradorNome} onChange={(e) => setForm(p => ({ ...p, colaboradorNome: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-white/20 text-white/70 hover:bg-white/10">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createReserva.isPending} className="bg-purple-600 hover:bg-purple-700">
              {createReserva.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reservar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
