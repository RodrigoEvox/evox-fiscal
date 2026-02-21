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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, TrendingUp, Loader2, DollarSign, Users, Calendar, Zap, Scale } from 'lucide-react';

const TIPO_LABELS: Record<string, string> = { dois_anos: '2 Anos de Casa', sindical: 'Reajuste Sindical', promocao: 'Promoção', merito: 'Mérito', outro: 'Outro' };
const TIPO_COLORS: Record<string, string> = { dois_anos: 'bg-blue-100 text-blue-700', sindical: 'bg-purple-100 text-purple-700', promocao: 'bg-green-100 text-green-700', merito: 'bg-amber-100 text-amber-700', outro: 'bg-gray-100 text-gray-700' };

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function ReajustesGEG() {
  const [showDialog, setShowDialog] = useState(false);
  const [tab, setTab] = useState('historico');
  const [form, setForm] = useState({
    colaboradorId: 0,  tipo: 'sindical' as 'dois_anos' | 'sindical' | 'promocao' | 'merito',    percentual: '', salarioAnterior: '', salarioNovo: '', dataAplicacao: '', observacao: '',
  });

  const utils = trpc.useUtils();
  const { data: reajustes, isLoading } = trpc.reajustesSalariais.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const { data: elegiveis2AnosData } = trpc.reajustesSalariais.checkDoisAnos.useQuery();
  const elegiveis = (elegiveis2AnosData || []) as any[];
  const createMut = trpc.reajustesSalariais.create.useMutation({
    onSuccess: () => { utils.reajustesSalariais.list.invalidate(); utils.reajustesSalariais.checkDoisAnos.invalidate(); toast.success('Reajuste registrado!'); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });

  const totalReajustes = useMemo(() => (reajustes || []).length, [reajustes]);

  // Auto-calculate new salary
  const salarioCalculado = useMemo(() => {
    if (form.salarioAnterior && form.percentual) {
      return (Number(form.salarioAnterior) * (1 + Number(form.percentual) / 100)).toFixed(2);
    }
    return form.salarioNovo;
  }, [form.salarioAnterior, form.percentual, form.salarioNovo]);

  function handleColabSelect(id: number) {
    const colab = (colaboradores || []).find((c: any) => c.id === id);
    setForm(f => ({ ...f, colaboradorId: id, salarioAnterior: colab?.salarioBase || '' }));
  }

  function handleSave() {
    if (!form.colaboradorId || !form.percentual || !form.dataAplicacao) {
      toast.error('Preencha os campos obrigatórios'); return;
    }
    const colab = (colaboradores || []).find((c: any) => c.id === form.colaboradorId);
    createMut.mutate({
      colaboradorId: form.colaboradorId,
      colaboradorNome: colab?.nomeCompleto || '',
      tipo: form.tipo,
      percentual: form.percentual,
      salarioAnterior: form.salarioAnterior,
      salarioNovo: salarioCalculado || form.salarioNovo,
      dataAplicacao: form.dataAplicacao,
      observacao: form.observacao || undefined,
    });
  }

  function aplicarReajuste2Anos(colabId: number) {
    const colab = (colaboradores || []).find((c: any) => c.id === colabId);
    if (!colab) return;
    const salAnterior = Number(colab.salarioBase || 0);
    const salNovo = (salAnterior * 1.10).toFixed(2);
    const hoje = new Date().toISOString().split('T')[0];
    createMut.mutate({
      colaboradorId: colabId,
      colaboradorNome: colab.nomeCompleto || '',
      tipo: 'dois_anos',
      percentual: '10',
      salarioAnterior: String(salAnterior),
      salarioNovo: salNovo,
      dataAplicacao: hoje,
      observacao: 'Reajuste automático — 2 anos de casa (10%)',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" /> Reajustes Salariais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Reajuste 2 anos (10% automático), sindical anual e outros</p>
        </div>
        <Button onClick={() => { setForm({ colaboradorId: 0, tipo: 'sindical', percentual: '', salarioAnterior: '', salarioNovo: '', dataAplicacao: '', observacao: '' }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Reajuste
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Reajustes</p>
                <p className="text-2xl font-bold text-emerald-700">{totalReajustes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Elegíveis 2 Anos</p>
                <p className="text-2xl font-bold text-blue-700">{elegiveis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Sindicais</p>
                <p className="text-2xl font-bold text-purple-700">{(reajustes || []).filter(r => r.tipo === 'sindical').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="elegiveis">
            Elegíveis 2 Anos {elegiveis.length > 0 && <Badge className="ml-2 bg-red-500 text-white">{elegiveis.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : !reajustes?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum reajuste registrado</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                        <th className="text-center px-4 py-3 font-medium">Tipo</th>
                        <th className="text-center px-4 py-3 font-medium">%</th>
                        <th className="text-right px-4 py-3 font-medium">Sal. Anterior</th>
                        <th className="text-right px-4 py-3 font-medium">Sal. Novo</th>
                        <th className="text-center px-4 py-3 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reajustes.map(r => (
                        <tr key={r.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{r.colaboradorNome}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={TIPO_COLORS[r.tipo] || 'bg-gray-100'}>{TIPO_LABELS[r.tipo] || r.tipo}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">{r.percentual}%</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.salarioAnterior)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(r.salarioNovo)}</td>
                          <td className="px-4 py-3 text-center">{formatDateBR(r.dataEfetivacao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="elegiveis">
          {!elegiveis.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum colaborador elegível para reajuste de 2 anos no momento</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                        <th className="text-center px-4 py-3 font-medium">Data Admissão</th>
                        <th className="text-right px-4 py-3 font-medium">Salário Atual</th>
                        <th className="text-right px-4 py-3 font-medium">Novo (+ 10%)</th>
                        <th className="text-center px-4 py-3 font-medium">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elegiveis.map((e: any) => (
                        <tr key={e.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{e.nomeCompleto}</td>
                          <td className="px-4 py-3 text-center">{formatDateBR(e.dataAdmissao)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(e.salario || 0)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(Number(e.salario || 0) * 1.10)}</td>
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" onClick={() => { if (confirm(`Aplicar reajuste de 10% para ${e.nomeCompleto}?`)) aplicarReajuste2Anos(e.id); }}>
                              <Zap className="w-4 h-4 mr-1" /> Aplicar
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
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Novo Reajuste</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={v => handleColabSelect(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(colaboradores || []).filter((c: any) => c.statusColaborador === 'ativo').map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v: any) => setForm(f => ({ ...f, tipo: v, percentual: v === 'dois_anos' ? '10' : f.percentual }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dois_anos">2 Anos de Casa (10%)</SelectItem>
                  <SelectItem value="sindical">Reajuste Sindical</SelectItem>
                  <SelectItem value="promocao">Promoção</SelectItem>
                  <SelectItem value="merito">Mérito</SelectItem>

                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Percentual (%) *</Label>
                <Input type="number" step="0.01" value={form.percentual} onChange={e => setForm(f => ({ ...f, percentual: e.target.value }))} />
              </div>
              <div>
                <Label>Data Efetivação *</Label>
                <Input type="date" value={form.dataAplicacao} onChange={e => setForm(f => ({ ...f, dataAplicacao: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Salário Anterior</Label>
                <Input type="number" step="0.01" value={form.salarioAnterior} onChange={e => setForm(f => ({ ...f, salarioAnterior: e.target.value }))} />
              </div>
              <div>
                <Label>Salário Novo</Label>
                <Input type="number" step="0.01" value={salarioCalculado} readOnly className="bg-green-50 font-semibold" />
              </div>
            </div>
            {form.salarioAnterior && form.percentual && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="py-2 text-center text-sm">
                  {formatCurrency(form.salarioAnterior)} + {form.percentual}% = <strong>{formatCurrency(salarioCalculado)}</strong>
                </CardContent>
              </Card>
            )}
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
