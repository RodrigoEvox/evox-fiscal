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
import { Plus, Cake, Loader2, CheckCircle2, XCircle, Clock, Edit } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', utilizado: 'Utilizado' };
const STATUS_COLORS: Record<string, string> = { pendente: 'bg-yellow-100 text-yellow-700', aprovado: 'bg-green-100 text-green-700', recusado: 'bg-red-100 text-red-700', utilizado: 'bg-blue-100 text-blue-700' };

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function DayOffGEG() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    colaboradorId: 0, dataAniversario: '', dataOriginal: '', dataEfetiva: '',
    alterado: false, motivoAlteracao: '', observacao: '',
  });

  const utils = trpc.useUtils();
  const { data: dayoffs, isLoading } = trpc.dayOff.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const createMut = trpc.dayOff.create.useMutation({
    onSuccess: () => { utils.dayOff.list.invalidate(); toast.success('Day Off registrado!'); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.dayOff.update.useMutation({
    onSuccess: () => { utils.dayOff.list.invalidate(); toast.success('Status atualizado'); },
  });

  // Auto-fill birthday from colaborador
  function handleColabSelect(id: number) {
    const colab = (colaboradores || []).find((c: any) => c.id === id);
    if (colab) {
      const dataNasc = colab.dataNascimento || '';
      // Calculate next birthday
      const hoje = new Date();
      let proxAniv = '';
      if (dataNasc) {
        const [y, m, d] = dataNasc.split('-');
        const anoAtual = hoje.getFullYear();
        const anivEsteAno = new Date(anoAtual, Number(m) - 1, Number(d));
        if (anivEsteAno < hoje) {
          proxAniv = `${anoAtual + 1}-${m}-${d}`;
        } else {
          proxAniv = `${anoAtual}-${m}-${d}`;
        }
      }
      setForm(f => ({ ...f, colaboradorId: id, dataAniversario: dataNasc, dataOriginal: proxAniv, dataEfetiva: proxAniv }));
    }
  }

  function handleSave() {
    if (!form.colaboradorId || !form.dataOriginal) { toast.error('Preencha os campos obrigatórios'); return; }
    const colab = (colaboradores || []).find((c: any) => c.id === form.colaboradorId);
    createMut.mutate({
      colaboradorId: form.colaboradorId,
      colaboradorNome: colab?.nomeCompleto || '',
      dataNascimento: form.dataAniversario,
      dataOriginal: form.dataOriginal,
      dataEfetiva: form.alterado ? form.dataEfetiva : form.dataOriginal,
      alterado: form.alterado,
      motivoAlteracao: form.alterado ? form.motivoAlteracao : undefined,
      observacao: form.observacao || undefined,
    });
  }

  const pendentes = (dayoffs || []).filter(d => d.status === 'pendente').length;
  const aprovados = (dayoffs || []).filter(d => d.status === 'aprovado').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cake className="w-6 h-6 text-pink-600" /> Day Off — Aniversário
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Folga de aniversário com aprovação e possibilidade de alteração</p>
        </div>
        <Button onClick={() => { setForm({ colaboradorId: 0, dataAniversario: '', dataOriginal: '', dataEfetiva: '', alterado: false, motivoAlteracao: '', observacao: '' }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Day Off
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-pink-200 bg-pink-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Cake className="w-8 h-8 text-pink-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold text-pink-700">{dayoffs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-700">{pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-green-700">{aprovados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !dayoffs?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum Day Off registrado</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                    <th className="text-center px-4 py-3 font-medium">Aniversário</th>
                    <th className="text-center px-4 py-3 font-medium">Data Original</th>
                    <th className="text-center px-4 py-3 font-medium">Data Efetiva</th>
                    <th className="text-center px-4 py-3 font-medium">Alterado?</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dayoffs.map(d => (
                    <tr key={d.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{d.colaboradorNome}</td>
                      <td className="px-4 py-3 text-center">{formatDateBR(d.dataAniversario)}</td>
                      <td className="px-4 py-3 text-center">{formatDateBR(d.dataOriginal)}</td>
                      <td className="px-4 py-3 text-center">{d.dataEfetiva ? formatDateBR(d.dataEfetiva) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {d.alterado ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <Edit className="w-3 h-3 mr-1" /> Sim
                          </Badge>
                        ) : 'Não'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={STATUS_COLORS[d.status || 'pendente']}>{STATUS_LABELS[d.status || 'pendente']}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center flex gap-1 justify-center">
                        {d.status === 'pendente' && (
                          <>
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateMut.mutate({ id: d.id, data: { status: 'aprovado' } })}>
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateMut.mutate({ id: d.id, data: { status: 'recusado' } })}>
                              <XCircle className="w-4 h-4 mr-1" /> Recusar
                            </Button>
                          </>
                        )}
                        {d.status === 'aprovado' && (
                          <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => updateMut.mutate({ id: d.id, data: { status: 'utilizado' } })}>
                            Marcar Utilizado
                          </Button>
                        )}
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Cake className="w-5 h-5" /> Novo Day Off</DialogTitle></DialogHeader>
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
            {form.dataAniversario && (
              <Card className="bg-pink-50 border-pink-200">
                <CardContent className="py-2 text-center text-sm">
                  🎂 Aniversário: <strong>{formatDateBR(form.dataAniversario)}</strong>
                </CardContent>
              </Card>
            )}
            <div>
              <Label>Data Original do Day Off *</Label>
              <Input type="date" value={form.dataOriginal} onChange={e => setForm(f => ({ ...f, dataOriginal: e.target.value, dataEfetiva: f.alterado ? f.dataEfetiva : e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.alterado} onCheckedChange={v => setForm(f => ({ ...f, alterado: v }))} />
              <Label>Alteração de data?</Label>
            </div>
            {form.alterado && (
              <>
                <div>
                  <Label>Nova Data Efetiva</Label>
                  <Input type="date" value={form.dataEfetiva} onChange={e => setForm(f => ({ ...f, dataEfetiva: e.target.value }))} />
                </div>
                <div>
                  <Label>Motivo da Alteração</Label>
                  <Textarea value={form.motivoAlteracao} onChange={e => setForm(f => ({ ...f, motivoAlteracao: e.target.value }))} rows={2} />
                </div>
              </>
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
