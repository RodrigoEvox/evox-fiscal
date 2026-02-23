import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Bus, Trash2, Calculator, Loader2, DollarSign, Calendar, ArrowLeft, XCircle} from 'lucide-react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ValeTransporteGEG() {
  const now = new Date();
  const [mesRef, setMesRef] = useState(now.getMonth() + 1);
  const [anoRef, setAnoRef] = useState(now.getFullYear());
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    colaboradorId: 0, colaboradorNome: '', diasUteis: 22, passagensPorDia: 2,
    valorPassagem: '4.40', cidadePassagem: 'sp' as 'sp' | 'barueri', observacao: '',
  });

  const utils = trpc.useUtils();
  const { data: vts, isLoading } = trpc.valeTransporte.list.useQuery({ mesReferencia: mesRef, anoReferencia: anoRef });
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const createMut = trpc.valeTransporte.create.useMutation({
    onSuccess: () => { utils.valeTransporte.list.invalidate(); toast.success('VT registrado!'); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.valeTransporte.delete.useMutation({
    onSuccess: () => { utils.valeTransporte.list.invalidate(); toast.success('VT removido'); },
  });

  const clearAllFilters = () => { setMesRef(new Date().getMonth() + 1); setAnoRef(new Date().getFullYear()); };

  const valorTotal = useMemo(() => {
    return (form.diasUteis * form.passagensPorDia * Number(form.valorPassagem)).toFixed(2);
  }, [form.diasUteis, form.passagensPorDia, form.valorPassagem]);

  const totalGeral = useMemo(() => {
    if (!vts) return 0;
    return vts.reduce((s, v) => s + Number(v.valorTotal), 0);
  }, [vts]);

  function handleSave() {
    if (!form.colaboradorId) { toast.error('Selecione o colaborador'); return; }
    const colab = (colaboradores || []).find((c: any) => c.id === form.colaboradorId);
    createMut.mutate({
      colaboradorId: form.colaboradorId,
      colaboradorNome: colab?.nomeCompleto || '',
      mesReferencia: mesRef,
      anoReferencia: anoRef,
      diasUteis: form.diasUteis,
      passagensPorDia: form.passagensPorDia,
      valorPassagem: form.valorPassagem,
      cidadePassagem: form.cidadePassagem,
      valorTotal,
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
            <Bus className="w-6 h-6 text-blue-600" /> Vale Transporte
          </h1>

              <p className="text-sm text-muted-foreground mt-1">Gestão de vale transporte por colaborador — cálculo automático</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { setForm({ colaboradorId: 0, colaboradorNome: '', diasUteis: 22, passagensPorDia: 2, valorPassagem: '4.40', cidadePassagem: 'sp', observacao: '' }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo VT
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-end">
        <div>
          <Label className="text-xs">Mês</Label>
          <Select value={String(mesRef)} onValueChange={v => setMesRef(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Ano</Label>
          <Input type="number" value={anoRef} onChange={e => setAnoRef(Number(e.target.value))} className="w-[100px]" />
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-1" />Limpar Filtros</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Bus className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold text-blue-700">{vts?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total a Pagar</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalGeral)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Referência</p>
                <p className="text-2xl font-bold text-purple-700">{MESES[mesRef - 1]} {anoRef}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !vts?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum VT registrado para {MESES[mesRef - 1]}/{anoRef}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                    <th className="text-center px-4 py-3 font-medium">Cidade</th>
                    <th className="text-center px-4 py-3 font-medium">Dias Úteis</th>
                    <th className="text-center px-4 py-3 font-medium">Passagens/Dia</th>
                    <th className="text-right px-4 py-3 font-medium">Valor Unit.</th>
                    <th className="text-right px-4 py-3 font-medium">Total</th>
                    <th className="text-center px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vts.map(v => (
                    <tr key={v.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{v.colaboradorNome}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{v.cidadePassagem === 'sp' ? 'São Paulo' : 'Barueri'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{v.diasUteis}</td>
                      <td className="px-4 py-3 text-center">{v.passagensPorDia}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(v.valorPassagem)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(v.valorTotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => { if (confirm('Remover VT?')) deleteMut.mutate({ id: v.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td colSpan={5} className="px-4 py-3 text-right">Total Geral:</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatCurrency(totalGeral)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Novo VT */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" /> Novo Vale Transporte</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={v => setForm(f => ({ ...f, colaboradorId: Number(v), colaboradorNome: (colaboradores || []).find((c: any) => c.id === Number(v))?.nomeCompleto || '' }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(colaboradores || []).filter((c: any) => c.statusColaborador === 'ativo' && c.valeTransporte).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cidade da Passagem</Label>
              <Select value={form.cidadePassagem} onValueChange={(v: 'sp' | 'barueri') => setForm(f => ({ ...f, cidadePassagem: v, valorPassagem: v === 'sp' ? '4.40' : '4.80' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sp">São Paulo (R$ 4,40)</SelectItem>
                  <SelectItem value="barueri">Barueri (R$ 4,80)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Dias Úteis</Label>
                <Input type="number" value={form.diasUteis} onChange={e => setForm(f => ({ ...f, diasUteis: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Pass./Dia</Label>
                <Input type="number" value={form.passagensPorDia} onChange={e => setForm(f => ({ ...f, passagensPorDia: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Valor Unit. (R$)</Label>
                <Input type="number" step="0.01" value={form.valorPassagem} onChange={e => setForm(f => ({ ...f, valorPassagem: e.target.value }))} />
              </div>
            </div>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground">Valor Total Calculado</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(valorTotal)}</p>
                <p className="text-xs text-muted-foreground">{form.diasUteis} dias × {form.passagensPorDia} pass. × R$ {form.valorPassagem}</p>
              </CardContent>
            </Card>
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
