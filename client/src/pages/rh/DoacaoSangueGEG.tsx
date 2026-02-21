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
import { toast } from 'sonner';
import { Plus, Heart, Loader2, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado', utilizado: 'Utilizado' };
const STATUS_COLORS: Record<string, string> = { pendente: 'bg-yellow-100 text-yellow-700', aprovado: 'bg-green-100 text-green-700', recusado: 'bg-red-100 text-red-700', utilizado: 'bg-blue-100 text-blue-700' };

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function DoacaoSangueGEG() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    colaboradorId: 0, dataDoacao: '', prazoFolga: '1', dataFolga: '',
    comprovanteUrl: '', observacao: '',
  });

  const utils = trpc.useUtils();
  const { data: doacoes, isLoading } = trpc.doacaoSangue.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const createMut = trpc.doacaoSangue.create.useMutation({
    onSuccess: () => { utils.doacaoSangue.list.invalidate(); toast.success('Doação registrada!'); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.doacaoSangue.update.useMutation({
    onSuccess: () => { utils.doacaoSangue.list.invalidate(); toast.success('Status atualizado'); },
  });

  const pendentes = (doacoes || []).filter(d => d.status === 'pendente').length;

  function handleSave() {
    if (!form.colaboradorId || !form.dataDoacao || !form.dataFolga) {
      toast.error('Preencha os campos obrigatórios'); return;
    }
    const colab = (colaboradores || []).find((c: any) => c.id === form.colaboradorId);
    createMut.mutate({
      colaboradorId: form.colaboradorId,
      colaboradorNome: colab?.nomeCompleto || '',
      dataDoacao: form.dataDoacao,
      prazoFolga: form.prazoFolga,
      dataFolga: form.dataFolga,
      comprovanteUrl: form.comprovanteUrl || undefined,
      observacao: form.observacao || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-600" /> Doação de Sangue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Registro de doações com prazo de folga e fluxo de aprovação</p>
        </div>
        <Button onClick={() => { setForm({ colaboradorId: 0, dataDoacao: '', prazoFolga: '1', dataFolga: '', comprovanteUrl: '', observacao: '' }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Doação
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Doações</p>
                <p className="text-2xl font-bold text-red-700">{doacoes?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pendentes Aprovação</p>
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
                <p className="text-2xl font-bold text-green-700">{(doacoes || []).filter(d => d.status === 'aprovado').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !doacoes?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma doação registrada</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                    <th className="text-center px-4 py-3 font-medium">Data Doação</th>
                    <th className="text-center px-4 py-3 font-medium">Prazo</th>
                    <th className="text-center px-4 py-3 font-medium">Data Folga</th>
                    <th className="text-center px-4 py-3 font-medium">Comprovante</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {doacoes.map(d => {
                    const nextStatus: Record<string, string> = { pendente: 'aprovado' };
                    const nextLabel: Record<string, string> = { pendente: 'Aprovar' };
                    return (
                      <tr key={d.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{d.colaboradorNome}</td>
                        <td className="px-4 py-3 text-center">{formatDateBR(d.dataDoacao || '')}</td>
                        <td className="px-4 py-3 text-center">{d.prazoFolga} dia(s)</td>
                        <td className="px-4 py-3 text-center">{formatDateBR(d.dataFolga || '')}</td>
                        <td className="px-4 py-3 text-center">
                          {d.comprovanteUrl ? (
                            <a href={d.comprovanteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                              <FileText className="w-3 h-3" /> Ver
                            </a>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={STATUS_COLORS[d.status || 'pendente']}>{STATUS_LABELS[d.status || 'pendente']}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center flex gap-1 justify-center">
                          {nextStatus[d.status || ''] && (
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateMut.mutate({ id: d.id, data: { status: nextStatus[d.status || ''] as any } })}>
                              <CheckCircle2 className="w-4 h-4 mr-1" /> {nextLabel[d.status || '']}
                            </Button>
                          )}
                          {d.status !== 'recusado' && d.status !== 'aprovado' && d.status !== 'utilizado' && (
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateMut.mutate({ id: d.id, data: { status: 'recusado' } })}>
                              <XCircle className="w-4 h-4 mr-1" /> Recusar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Heart className="w-5 h-5" /> Nova Doação de Sangue</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data da Doação *</Label>
                <Input type="date" value={form.dataDoacao} onChange={e => setForm(f => ({ ...f, dataDoacao: e.target.value }))} />
              </div>
              <div>
                <Label>Prazo Folga (dias)</Label>
                <Input type="number" value={form.prazoFolga} onChange={e => setForm(f => ({ ...f, prazoFolga: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Data da Folga *</Label>
              <Input type="date" value={form.dataFolga} onChange={e => setForm(f => ({ ...f, dataFolga: e.target.value }))} />
            </div>
            <div>
              <Label>URL do Comprovante</Label>
              <Input value={form.comprovanteUrl} onChange={e => setForm(f => ({ ...f, comprovanteUrl: e.target.value }))} placeholder="https://..." />
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
