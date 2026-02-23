import { Link } from 'wouter';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Dumbbell, Trash2, Loader2, DollarSign, Users, CheckCircle2, ArrowLeft} from 'lucide-react';

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function AcademiaGEG() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    colaboradorId: 0, nomeAcademia: '', plano: '', valorPlano: '',
    descontoFolha: false, valorDesconto: '', dataEntrada: '',
    fidelidade: false, fidelidadeMeses: 0, observacao: '',
  });

  const utils = trpc.useUtils();
  const { data: academias, isLoading } = trpc.academiaBeneficio.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const createMut = trpc.academiaBeneficio.create.useMutation({
    onSuccess: () => { utils.academiaBeneficio.list.invalidate(); toast.success('Academia registrada!'); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.academiaBeneficio.delete.useMutation({
    onSuccess: () => { utils.academiaBeneficio.list.invalidate(); toast.success('Registro removido'); },
  });
  const updateMut = trpc.academiaBeneficio.update.useMutation({
    onSuccess: () => { utils.academiaBeneficio.list.invalidate(); toast.success('Status atualizado'); },
  });

  const ativos = (academias || []).filter(a => a.ativo);
  const totalDesconto = ativos.reduce((s, a) => s + (a.descontoFolha ? Number(a.valorDesconto || a.valorPlano) : 0), 0);

  function handleSave() {
    if (!form.colaboradorId || !form.nomeAcademia || !form.valorPlano) {
      toast.error('Preencha os campos obrigatórios'); return;
    }
    const colab = (colaboradores || []).find((c: any) => c.id === form.colaboradorId);
    createMut.mutate({
      colaboradorId: form.colaboradorId,
      colaboradorNome: colab?.nomeCompleto || '',
      nomeAcademia: form.nomeAcademia,
      plano: form.plano || undefined,
      valorPlano: form.valorPlano,
      descontoFolha: form.descontoFolha,
      valorDesconto: form.descontoFolha ? form.valorDesconto : undefined,
      dataEntrada: form.dataEntrada || undefined,
      fidelidade: form.fidelidade,
      fidelidadeMeses: form.fidelidade ? form.fidelidadeMeses : undefined,
      observacao: form.observacao || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/beneficios"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-orange-600" /> Benefício Academia
          </h1>

              <p className="text-sm text-muted-foreground mt-1">Gestão de benefício academia por colaborador</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { setForm({ colaboradorId: 0, nomeAcademia: '', plano: '', valorPlano: '', descontoFolha: false, valorDesconto: '', dataEntrada: '', fidelidade: false, fidelidadeMeses: 0, observacao: '' }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Registro
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Colaboradores Ativos</p>
                <p className="text-2xl font-bold text-orange-700">{ativos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Desconto Folha</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalDesconto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Com Fidelidade</p>
                <p className="text-2xl font-bold text-blue-700">{ativos.filter(a => a.fidelidade).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !academias?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum registro de academia</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                    <th className="text-left px-4 py-3 font-medium">Academia</th>
                    <th className="text-left px-4 py-3 font-medium">Plano</th>
                    <th className="text-right px-4 py-3 font-medium">Valor</th>
                    <th className="text-center px-4 py-3 font-medium">Desc. Folha</th>
                    <th className="text-center px-4 py-3 font-medium">Fidelidade</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {academias.map(a => (
                    <tr key={a.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{a.colaboradorNome}</td>
                      <td className="px-4 py-3">{a.nomeAcademia}</td>
                      <td className="px-4 py-3">{a.plano || '-'}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(a.valorPlano)}</td>
                      <td className="px-4 py-3 text-center">
                        {a.descontoFolha ? <Badge className="bg-yellow-100 text-yellow-700">{formatCurrency(a.valorDesconto || a.valorPlano)}</Badge> : <span className="text-muted-foreground">Não</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.fidelidade ? <Badge variant="outline">{a.fidelidadeMeses} meses</Badge> : <span className="text-muted-foreground">Não</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={a.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {a.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center flex gap-1 justify-center">
                        {a.ativo && (
                          <Button variant="ghost" size="sm" className="text-yellow-600" onClick={() => updateMut.mutate({ id: a.id, data: { ativo: false } })}>
                            Desativar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { if (confirm('Remover?')) deleteMut.mutate({ id: a.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Dumbbell className="w-5 h-5" /> Novo Benefício Academia</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={v => setForm(f => ({ ...f, colaboradorId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(colaboradores || []).filter((c: any) => c.statusColaborador === 'ativo').map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome da Academia *</Label>
              <Input value={form.nomeAcademia} onChange={e => setForm(f => ({ ...f, nomeAcademia: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plano</Label>
                <Input value={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.value }))} placeholder="Ex: Premium" />
              </div>
              <div>
                <Label>Valor do Plano (R$) *</Label>
                <Input type="number" step="0.01" value={form.valorPlano} onChange={e => setForm(f => ({ ...f, valorPlano: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Data de Entrada</Label>
              <Input type="date" value={form.dataEntrada} onChange={e => setForm(f => ({ ...f, dataEntrada: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.descontoFolha} onCheckedChange={v => setForm(f => ({ ...f, descontoFolha: v }))} />
              <Label>Desconto em Folha?</Label>
              {form.descontoFolha && (
                <Input type="number" step="0.01" value={form.valorDesconto} onChange={e => setForm(f => ({ ...f, valorDesconto: e.target.value }))} placeholder="Valor desconto" className="w-32" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.fidelidade} onCheckedChange={v => setForm(f => ({ ...f, fidelidade: v }))} />
              <Label>Fidelidade?</Label>
              {form.fidelidade && (
                <Input type="number" value={form.fidelidadeMeses} onChange={e => setForm(f => ({ ...f, fidelidadeMeses: Number(e.target.value) }))} placeholder="Meses" className="w-24" />
              )}
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
