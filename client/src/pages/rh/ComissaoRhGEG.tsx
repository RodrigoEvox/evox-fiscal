import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Coins, Trash2, Loader2, DollarSign, TrendingUp } from 'lucide-react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const TIPO_LABELS: Record<string, string> = { evox_monitor: 'Evox Monitor', dpt: 'DPT', credito: 'Crédito', outro: 'Outro' };
const TIPO_COLORS: Record<string, string> = { evox_monitor: 'bg-blue-100 text-blue-700', dpt: 'bg-purple-100 text-purple-700', credito: 'bg-green-100 text-green-700', outro: 'bg-gray-100 text-gray-700' };

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ComissaoRhGEG() {
  const now = new Date();
  const [mesRef, setMesRef] = useState(now.getMonth() + 1);
  const [anoRef, setAnoRef] = useState(now.getFullYear());
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    colaboradorId: 0, tipo: 'evox_monitor' as 'evox_monitor' | 'dpt' | 'credito' | 'outro',
    descricao: '', valorBase: '', percentual: '', valorComissao: '', observacao: '',
  });

  const utils = trpc.useUtils();
  const { data: comissoes, isLoading } = trpc.comissaoRh.list.useQuery({ mesReferencia: mesRef, anoReferencia: anoRef });
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const createMut = trpc.comissaoRh.create.useMutation({
    onSuccess: () => { utils.comissaoRh.list.invalidate(); toast.success('Comissão registrada!'); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.comissaoRh.delete.useMutation({
    onSuccess: () => { utils.comissaoRh.list.invalidate(); toast.success('Comissão removida'); },
  });

  const totalComissoes = useMemo(() => (comissoes || []).reduce((s, c) => s + Number(c.valorComissao), 0), [comissoes]);

  // Auto-calculate commission value
  const calcComissao = useMemo(() => {
    if (form.valorBase && form.percentual) {
      return (Number(form.valorBase) * Number(form.percentual) / 100).toFixed(2);
    }
    return form.valorComissao;
  }, [form.valorBase, form.percentual, form.valorComissao]);

  function handleSave() {
    if (!form.colaboradorId) { toast.error('Selecione o colaborador'); return; }
    const colab = (colaboradores || []).find((c: any) => c.id === form.colaboradorId);
    createMut.mutate({
      colaboradorId: form.colaboradorId,
      colaboradorNome: colab?.nomeCompleto || '',
      tipo: form.tipo,
      descricao: form.descricao || undefined,
      mesReferencia: mesRef,
      anoReferencia: anoRef,
      valorBase: form.valorBase,
      percentual: form.percentual || undefined,
      valorComissao: calcComissao || form.valorComissao,
      observacao: form.observacao || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-600" /> Comissões e Prêmios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Comissões e prêmios por tipo — Evox Monitor, DPT, Crédito</p>
        </div>
        <Button onClick={() => { setForm({ colaboradorId: 0, tipo: 'evox_monitor', descricao: '', valorBase: '', percentual: '', valorComissao: '', observacao: '' }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Comissão
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
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold text-amber-700">{comissoes?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Comissões</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalComissoes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Média por Registro</p>
                <p className="text-2xl font-bold text-blue-700">{comissoes?.length ? formatCurrency(totalComissoes / comissoes.length) : 'R$ 0,00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !comissoes?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma comissão registrada para {MESES[mesRef - 1]}/{anoRef}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                    <th className="text-center px-4 py-3 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium">Descrição</th>
                    <th className="text-right px-4 py-3 font-medium">Valor Base</th>
                    <th className="text-center px-4 py-3 font-medium">%</th>
                    <th className="text-right px-4 py-3 font-medium">Comissão</th>
                    <th className="text-center px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {comissoes.map(c => (
                    <tr key={c.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{c.colaboradorNome}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={TIPO_COLORS[c.tipo] || 'bg-gray-100'}>{TIPO_LABELS[c.tipo] || c.tipo}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.descricao || '-'}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(c.valorBase)}</td>
                      <td className="px-4 py-3 text-center">{c.percentual ? `${c.percentual}%` : '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(c.valorComissao)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { if (confirm('Remover?')) deleteMut.mutate({ id: c.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td colSpan={5} className="px-4 py-3 text-right">Total:</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatCurrency(totalComissoes)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Coins className="w-5 h-5" /> Nova Comissão</DialogTitle></DialogHeader>
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
              <Label>Tipo de Comissão *</Label>
              <Select value={form.tipo} onValueChange={(v: any) => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="evox_monitor">Evox Monitor</SelectItem>
                  <SelectItem value="dpt">DPT</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Valor Base (R$) *</Label>
                <Input type="number" step="0.01" value={form.valorBase} onChange={e => setForm(f => ({ ...f, valorBase: e.target.value }))} />
              </div>
              <div>
                <Label>Percentual (%)</Label>
                <Input type="number" step="0.01" value={form.percentual} onChange={e => setForm(f => ({ ...f, percentual: e.target.value }))} />
              </div>
              <div>
                <Label>Comissão (R$)</Label>
                <Input type="number" step="0.01" value={calcComissao} onChange={e => setForm(f => ({ ...f, valorComissao: e.target.value }))} />
              </div>
            </div>
            {form.valorBase && form.percentual && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="py-2 text-center text-sm">
                  Cálculo: {formatCurrency(form.valorBase)} × {form.percentual}% = <strong>{formatCurrency(calcComissao)}</strong>
                </CardContent>
              </Card>
            )}
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
