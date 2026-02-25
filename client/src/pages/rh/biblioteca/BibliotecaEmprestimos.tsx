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
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, BookCopy, Loader2, RotateCcw, RefreshCw, CheckCircle2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-blue-500/20 text-blue-400' },
  devolvido: { label: 'Devolvido', color: 'bg-emerald-500/20 text-emerald-400' },
  atrasado: { label: 'Atrasado', color: 'bg-red-500/20 text-red-400' },
  renovado: { label: 'Renovado', color: 'bg-amber-500/20 text-amber-400' },
  perdido: { label: 'Perdido', color: 'bg-red-500/20 text-red-400' },
};

export default function BibliotecaEmprestimos() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    exemplarId: '', colaboradorId: '', colaboradorNome: '',
    prazoMaximoDias: '14', observacoes: '',
    checklistCondicao: false, checklistTermo: false,
  });

  const utils = trpc.useUtils();
  const emprestimos = trpc.biblioteca.emprestimos.list.useQuery();
  const exemplares = trpc.biblioteca.exemplares.list.useQuery();
  const livros = trpc.biblioteca.livros.list.useQuery();
  const createEmprestimo = trpc.biblioteca.emprestimos.create.useMutation({
    onSuccess: () => { utils.biblioteca.emprestimos.list.invalidate(); utils.biblioteca.exemplares.list.invalidate(); toast.success('Empréstimo registrado!'); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const returnEmprestimo = trpc.biblioteca.emprestimos.devolver.useMutation({
    onSuccess: () => { utils.biblioteca.emprestimos.list.invalidate(); utils.biblioteca.exemplares.list.invalidate(); toast.success('Devolução registrada!'); },
    onError: (e) => toast.error(e.message),
  });
  const renewEmprestimo = trpc.biblioteca.emprestimos.renovar.useMutation({
    onSuccess: () => { utils.biblioteca.emprestimos.list.invalidate(); toast.success('Empréstimo renovado!'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setForm({ exemplarId: '', colaboradorId: '', colaboradorNome: '', prazoMaximoDias: '14', observacoes: '', checklistCondicao: false, checklistTermo: false });
  };

  const livroMap = useMemo(() => {
    const map = new Map<number, string>();
    livros.data?.forEach((l: any) => map.set(l.id, l.titulo));
    return map;
  }, [livros.data]);

  const exemplarMap = useMemo(() => {
    const map = new Map<number, any>();
    exemplares.data?.forEach((e: any) => map.set(e.id, e));
    return map;
  }, [exemplares.data]);

  const disponiveis = useMemo(() => {
    return exemplares.data?.filter((e: any) => e.status === 'disponivel') || [];
  }, [exemplares.data]);

  const handleSubmit = () => {
    if (!form.exemplarId || !form.colaboradorNome.trim()) {
      toast.error('Selecione o exemplar e informe o colaborador');
      return;
    }
    if (!form.checklistCondicao || !form.checklistTermo) {
      toast.error('Confirme todos os itens do checklist');
      return;
    }
    const exemplar = exemplarMap.get(parseInt(form.exemplarId));
    const prazo = parseInt(form.prazoMaximoDias) || 14;
    const hoje = new Date();
    const prevista = new Date(hoje);
    prevista.setDate(prevista.getDate() + prazo);
    createEmprestimo.mutate({
      exemplarId: parseInt(form.exemplarId),
      livroId: exemplar?.livroId || 0,
      colaboradorId: form.colaboradorId ? parseInt(form.colaboradorId) : 0,
      colaboradorNome: form.colaboradorNome,
      dataRetirada: hoje.toISOString().split('T')[0],
      dataPrevistaDevolucao: prevista.toISOString().split('T')[0],
      observacoes: form.observacoes || undefined,
    });
  };

  const filtered = useMemo(() => {
    if (!emprestimos.data) return [];
    const now = Date.now();
    return emprestimos.data
      .map((e: any) => {
        const isAtrasado = e.status === 'ativo' && new Date(e.dataPrevistaDevolucao).getTime() < now;
        return { ...e, displayStatus: isAtrasado ? 'atrasado' : e.status };
      })
      .filter((e: any) => {
        const ex = exemplarMap.get(e.exemplarId);
        const titulo = ex ? livroMap.get(ex.livroId) || '' : '';
        const matchSearch = !search || [e.colaboradorNome, titulo, ex?.codigoPatrimonio].some(f => f?.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = filterStatus === 'all' || e.displayStatus === filterStatus;
        return matchSearch && matchStatus;
      });
  }, [emprestimos.data, search, filterStatus, exemplarMap, livroMap]);

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  return (
    <>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input placeholder="Buscar por colaborador, livro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted/30 border-border/60 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] bg-muted/30 border-border/60 text-foreground"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-muted/30 border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Colaborador</TableHead>
                  <TableHead className="text-muted-foreground">Livro</TableHead>
                  <TableHead className="text-muted-foreground">Exemplar</TableHead>
                  <TableHead className="text-muted-foreground">Empréstimo</TableHead>
                  <TableHead className="text-muted-foreground">Prev. Devolução</TableHead>
                  <TableHead className="text-muted-foreground">Renovações</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emprestimos.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground/50 py-10">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground/50 py-10">Nenhum empréstimo encontrado</TableCell></TableRow>
                ) : filtered.map((emp: any) => {
                  const ex = exemplarMap.get(emp.exemplarId);
                  const titulo = ex ? livroMap.get(ex.livroId) || `Livro #${ex.livroId}` : '-';
                  const st = STATUS_MAP[emp.displayStatus] || { label: emp.displayStatus, color: 'bg-gray-500/20 text-gray-400' };
                  return (
                    <TableRow key={emp.id} className="border-border/40 hover:bg-muted/50">
                      <TableCell className="text-foreground font-medium">{emp.colaboradorNome}</TableCell>
                      <TableCell className="text-muted-foreground">{titulo}</TableCell>
                      <TableCell className="text-muted-foreground/70 font-mono text-xs">{ex?.codigoPatrimonio || `#${emp.exemplarId}`}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(emp.dataEmprestimo)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(emp.dataPrevistaDevolucao)}</TableCell>
                      <TableCell className="text-muted-foreground text-center">{emp.renovacoes || 0}</TableCell>
                      <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        {emp.displayStatus === 'ativo' || emp.displayStatus === 'atrasado' ? (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => returnEmprestimo.mutate({ id: emp.id, dataEfetiva: new Date().toISOString().split('T')[0] })}
                              disabled={returnEmprestimo.isPending}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Devolver
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              onClick={() => {
                              const novaPrev = new Date(emp.dataPrevistaDevolucao);
                              novaPrev.setDate(novaPrev.getDate() + 14);
                              renewEmprestimo.mutate({ id: emp.id, novaPrevista: novaPrev.toISOString().split('T')[0] });
                            }}
                              disabled={renewEmprestimo.isPending}>
                              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Renovar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">-</span>
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
        <DialogContent className="bg-card border-border/60 text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Empréstimo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Exemplar Disponível *</Label>
              <Select value={form.exemplarId} onValueChange={(v) => setForm(p => ({ ...p, exemplarId: v }))}>
                <SelectTrigger className="bg-muted/30 border-border/60 text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {disponiveis.map((ex: any) => (
                    <SelectItem key={ex.id} value={ex.id.toString()}>
                      {livroMap.get(ex.livroId) || `Livro #${ex.livroId}`} — {ex.codigoPatrimonio || `Exemplar #${ex.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Nome do Colaborador *</Label>
              <Input value={form.colaboradorNome} onChange={(e) => setForm(p => ({ ...p, colaboradorNome: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-muted-foreground">Prazo (dias)</Label>
              <Input type="number" value={form.prazoMaximoDias} onChange={(e) => setForm(p => ({ ...p, prazoMaximoDias: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))} className="bg-muted/30 border-border/60 text-foreground" rows={2} />
            </div>
            <div className="space-y-3 pt-2 border-t border-border/60">
              <p className="text-sm font-semibold text-foreground">Checklist de Empréstimo</p>
              <div className="flex items-center gap-2">
                <Checkbox id="chk1" checked={form.checklistCondicao} onCheckedChange={(v) => setForm(p => ({ ...p, checklistCondicao: !!v }))} />
                <label htmlFor="chk1" className="text-sm text-muted-foreground">Condição do exemplar verificada</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="chk2" checked={form.checklistTermo} onCheckedChange={(v) => setForm(p => ({ ...p, checklistTermo: !!v }))} />
                <label htmlFor="chk2" className="text-sm text-muted-foreground">Termo de responsabilidade aceito pelo colaborador</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm} className="border-border text-muted-foreground hover:bg-muted/60">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createEmprestimo.isPending} className="bg-amber-600 hover:bg-amber-700">
              {createEmprestimo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Empréstimo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
