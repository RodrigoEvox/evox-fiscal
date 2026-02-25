import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Plus, Search, Loader2, RefreshCw, CheckCircle2, FileText, Eraser, Pen } from 'lucide-react';

// ===== SIGNATURE CANVAS COMPONENT =====
function SignatureCanvas({ onSave, label }: { onSave: (dataUrl: string) => void; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const endDraw = () => { setIsDrawing(false); };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    setHasContent(false);
  };

  const save = () => {
    if (!hasContent) { toast.error('Desenhe a assinatura antes de confirmar'); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>
      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} className="gap-1">
          <Eraser className="w-3 h-3" /> Limpar
        </Button>
        <Button type="button" size="sm" onClick={save} className="gap-1" disabled={!hasContent}>
          <CheckCircle2 className="w-3 h-3" /> Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}

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
  const [signatureDialog, setSignatureDialog] = useState<{ emprestimoId: number; tipo: 'colaborador' | 'bibliotecario' } | null>(null);
  const [form, setForm] = useState({
    exemplarId: '', colaboradorId: '', colaboradorNome: '',
    prazoMaximoDias: '14', observacoes: '',
    checklistCondicao: false, checklistTermo: false,
    assinaturaColaboradorUrl: '',
    assinaturaBibliotecarioUrl: '',
  });

  const utils = trpc.useUtils();
  const emprestimos = trpc.biblioteca.emprestimos.list.useQuery();
  const exemplares = trpc.biblioteca.exemplares.list.useQuery();
  const livros = trpc.biblioteca.livros.list.useQuery();
  const createEmprestimo = trpc.biblioteca.emprestimos.create.useMutation({
    onSuccess: () => { utils.biblioteca.emprestimos.list.invalidate(); utils.biblioteca.exemplares.list.invalidate(); toast.success('Empréstimo registrado! Termo PDF será gerado automaticamente.'); resetForm(); },
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
  const salvarAssinatura = trpc.biblioteca.emprestimos.salvarAssinatura.useMutation({
    onSuccess: () => {
      utils.biblioteca.emprestimos.list.invalidate();
      toast.success('Assinatura salva! O termo PDF será regenerado com a assinatura.');
      setSignatureDialog(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setForm({ exemplarId: '', colaboradorId: '', colaboradorNome: '', prazoMaximoDias: '14', observacoes: '', checklistCondicao: false, checklistTermo: false, assinaturaColaboradorUrl: '', assinaturaBibliotecarioUrl: '' });
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
      assinaturaColaboradorUrl: form.assinaturaColaboradorUrl || undefined,
      assinaturaBibliotecarioUrl: form.assinaturaBibliotecarioUrl || undefined,
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
                  const hasColabSig = !!emp.assinaturaColaboradorUrl;
                  const hasBibSig = !!emp.assinaturaBibliotecarioUrl;
                  return (
                    <TableRow key={emp.id} className="border-border/40 hover:bg-muted/50">
                      <TableCell className="text-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          {emp.colaboradorNome}
                          {hasColabSig && <span title="Assinatura do colaborador"><Pen className="w-3 h-3 text-blue-500" /></span>}
                          {hasBibSig && <span title="Assinatura do bibliotecário"><Pen className="w-3 h-3 text-emerald-500" /></span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{titulo}</TableCell>
                      <TableCell className="text-muted-foreground/70 font-mono text-xs">{ex?.codigoPatrimonio || `#${emp.exemplarId}`}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(emp.dataEmprestimo)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(emp.dataPrevistaDevolucao)}</TableCell>
                      <TableCell className="text-muted-foreground text-center">{emp.renovacoes || 0}</TableCell>
                      <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(emp.displayStatus === 'ativo' || emp.displayStatus === 'atrasado') && (
                            <>
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
                            </>
                          )}
                          {/* Signature button - only for active/overdue without collaborator signature */}
                          {(emp.displayStatus === 'ativo' || emp.displayStatus === 'atrasado') && !hasColabSig && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                              onClick={() => setSignatureDialog({ emprestimoId: emp.id, tipo: 'colaborador' })}>
                              <Pen className="w-3.5 h-3.5 mr-1" /> Assinar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                            onClick={() => {
                              const url = emp.termoPdfUrl || `/api/biblioteca/termo-responsabilidade-pdf?emprestimoId=${emp.id}`;
                              window.open(url, '_blank');
                            }}>
                            <FileText className="w-3.5 h-3.5 mr-1" /> Termo
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      {/* ===== NEW LOAN DIALOG ===== */}
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

            {/* Signature section */}
            <div className="space-y-4 pt-2 border-t border-border/60">
              <p className="text-sm font-semibold text-foreground">Assinaturas Digitais</p>
              {form.assinaturaColaboradorUrl ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium block">Assinatura do Colaborador</label>
                  <div className="flex items-center gap-2">
                    <img src={form.assinaturaColaboradorUrl} alt="Assinatura" className="h-16 border rounded" />
                    <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, assinaturaColaboradorUrl: '' }))}>
                      <Eraser className="w-3.5 h-3.5 mr-1" /> Refazer
                    </Button>
                  </div>
                </div>
              ) : (
                <SignatureCanvas label="Assinatura do Colaborador" onSave={(url) => setForm(f => ({ ...f, assinaturaColaboradorUrl: url }))} />
              )}
              {form.assinaturaBibliotecarioUrl ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium block">Assinatura do Bibliotecário</label>
                  <div className="flex items-center gap-2">
                    <img src={form.assinaturaBibliotecarioUrl} alt="Assinatura" className="h-16 border rounded" />
                    <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, assinaturaBibliotecarioUrl: '' }))}>
                      <Eraser className="w-3.5 h-3.5 mr-1" /> Refazer
                    </Button>
                  </div>
                </div>
              ) : (
                <SignatureCanvas label="Assinatura do Bibliotecário (opcional)" onSave={(url) => setForm(f => ({ ...f, assinaturaBibliotecarioUrl: url }))} />
              )}
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

      {/* ===== SIGNATURE DIALOG FOR EXISTING LOANS ===== */}
      <Dialog open={!!signatureDialog} onOpenChange={(open) => { if (!open) setSignatureDialog(null); }}>
        <DialogContent className="bg-card border-border/60 text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pen className="w-5 h-5 text-violet-500" />
              Assinatura Digital
            </DialogTitle>
            <DialogDescription>
              {signatureDialog?.tipo === 'colaborador'
                ? 'Solicite que o colaborador assine abaixo para confirmar o recebimento do livro.'
                : 'Assine abaixo como responsável pela biblioteca.'}
            </DialogDescription>
          </DialogHeader>
          <SignatureCanvas
            label={signatureDialog?.tipo === 'colaborador' ? 'Assinatura do Colaborador' : 'Assinatura do Bibliotecário'}
            onSave={(dataUrl) => {
              if (signatureDialog) {
                salvarAssinatura.mutate({
                  emprestimoId: signatureDialog.emprestimoId,
                  tipo: signatureDialog.tipo,
                  assinaturaDataUrl: dataUrl,
                });
              }
            }}
          />
          {salvarAssinatura.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Salvando assinatura e regenerando termo PDF...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
