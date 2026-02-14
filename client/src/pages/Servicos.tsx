import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Settings, DollarSign, Percent } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const FORMA_COBRANCA_LABELS: Record<string, string> = {
  percentual_credito: '% sobre Crédito',
  valor_fixo: 'Valor Fixo',
  mensalidade: 'Mensalidade',
  exito: 'Êxito',
  hibrido: 'Híbrido',
};

export default function Servicos() {
  const [selectedSetorId, setSelectedSetorId] = useState<number | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', setorId: 0, percentualHonorariosComercial: '0', formaCobrancaHonorarios: 'percentual_credito' as string, valorFixo: '' });

  const utils = trpc.useUtils();
  const setores = trpc.setores.list.useQuery();
  const servicos = trpc.servicos.list.useQuery(selectedSetorId ? { setorId: selectedSetorId } : undefined);

  const createServico = trpc.servicos.create.useMutation({
    onSuccess: () => { toast.success('Serviço criado!'); utils.servicos.list.invalidate(); setDialogOpen(false); resetForm(); },
    onError: () => toast.error('Erro ao criar serviço'),
  });
  const updateServico = trpc.servicos.update.useMutation({
    onSuccess: () => { toast.success('Serviço atualizado!'); utils.servicos.list.invalidate(); setDialogOpen(false); resetForm(); },
    onError: () => toast.error('Erro ao atualizar serviço'),
  });
  const deleteServico = trpc.servicos.delete.useMutation({
    onSuccess: () => { toast.success('Serviço excluído!'); utils.servicos.list.invalidate(); },
    onError: () => toast.error('Erro ao excluir serviço'),
  });

  const resetForm = () => {
    setForm({ nome: '', descricao: '', setorId: 0, percentualHonorariosComercial: '0', formaCobrancaHonorarios: 'percentual_credito', valorFixo: '' });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.nome || !form.setorId) { toast.error('Preencha nome e setor'); return; }
    if (editingId) {
      updateServico.mutate({ id: editingId, data: form });
    } else {
      createServico.mutate(form as any);
    }
  };

  const handleEdit = (s: any) => {
    setForm({
      nome: s.nome, descricao: s.descricao || '', setorId: s.setorId,
      percentualHonorariosComercial: s.percentualHonorariosComercial || '0',
      formaCobrancaHonorarios: s.formaCobrancaHonorarios || 'percentual_credito',
      valorFixo: s.valorFixo || '',
    });
    setEditingId(s.id);
    setDialogOpen(true);
  };

  const getSetorNome = (setorId: number) => {
    const setor = (setores.data as any[])?.find((s: any) => s.id === setorId);
    return setor?.nome || '-';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços por Setor</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os serviços oferecidos por cada setor com honorários e forma de cobrança</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Serviço</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome do Serviço</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Recuperação PIS/COFINS" />
              </div>
              <div className="space-y-1.5">
                <Label>Setor</Label>
                <Select value={form.setorId ? String(form.setorId) : ''} onValueChange={(v) => setForm({ ...form, setorId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>
                    {(setores.data as any[])?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>% Honorários Comercial</Label>
                  <Input type="number" value={form.percentualHonorariosComercial} onChange={(e) => setForm({ ...form, percentualHonorariosComercial: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Forma de Cobrança</Label>
                  <Select value={form.formaCobrancaHonorarios} onValueChange={(v) => setForm({ ...form, formaCobrancaHonorarios: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FORMA_COBRANCA_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição do serviço" />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createServico.isPending || updateServico.isPending}>
                {editingId ? 'Atualizar' : 'Criar Serviço'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by setor */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-gray-500">Filtrar por setor:</Label>
        <Select value={selectedSetorId ? String(selectedSetorId) : 'all'} onValueChange={(v) => setSelectedSetorId(v === 'all' ? undefined : Number(v))}>
          <SelectTrigger className="w-[250px]"><SelectValue placeholder="Todos os setores" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {(setores.data as any[])?.map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services list */}
      <div className="grid gap-3">
        {(servicos.data as any[])?.length === 0 && (
          <Card><CardContent className="py-8 text-center text-gray-400">Nenhum serviço cadastrado</CardContent></Card>
        )}
        {(servicos.data as any[])?.map((s: any) => (
          <Card key={s.id} className={!s.ativo ? 'opacity-50' : ''}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{s.nome}</h3>
                  {!s.ativo && <Badge variant="secondary">Inativo</Badge>}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{getSetorNome(s.setorId)}</p>
                {s.descricao && <p className="text-xs text-gray-400 mt-1">{s.descricao}</p>}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <Percent className="w-3.5 h-3.5" />
                    {s.percentualHonorariosComercial || '0'}%
                  </div>
                  <span className="text-[11px] text-gray-400">{FORMA_COBRANCA_LABELS[s.formaCobrancaHonorarios] || s.formaCobrancaHonorarios}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => { if (confirm('Excluir este serviço?')) deleteServico.mutate({ id: s.id }); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
