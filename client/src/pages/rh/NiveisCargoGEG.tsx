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
import { toast } from 'sonner';
import { Plus, Layers, Trash2, Loader2, GraduationCap, DollarSign, ArrowUpCircle, ArrowLeft} from 'lucide-react';

const GRAU_LABELS: Record<string, string> = {
  fundamental_incompleto: 'Fund. Incompleto', fundamental_completo: 'Fund. Completo',
  medio_incompleto: 'Médio Incompleto', medio_completo: 'Médio Completo',
  tecnico: 'Técnico', superior_incompleto: 'Superior Incompleto',
  superior_completo: 'Superior Completo', pos_graduacao: 'Pós-Graduação',
  mestrado: 'Mestrado', doutorado: 'Doutorado',
};

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function NiveisCargoGEG() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    cargoId: 0, setorId: 0, nivel: 1, titulo: '', descricao: '',
    salarioMinimo: '', salarioMaximo: '', grauInstrucaoMinimo: 'medio_completo',
    requisitosFormacao: '',
  });

  const utils = trpc.useUtils();
  const { data: niveis, isLoading } = trpc.niveisCargo.list.useQuery();
  // No cargosSalarios router - use cargo as free text
  const { data: setoresData } = trpc.setores.list.useQuery();
  const setores = (setoresData as any)?.setores || setoresData || [];
  const createMut = trpc.niveisCargo.create.useMutation({
    onSuccess: () => { utils.niveisCargo.list.invalidate(); toast.success('Nível criado!'); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.niveisCargo.delete.useMutation({
    onSuccess: () => { utils.niveisCargo.list.invalidate(); toast.success('Nível removido'); },
  });

  function handleSave() {
    if (!form.titulo || !form.salarioMinimo) {
      toast.error('Preencha os campos obrigatórios'); return;
    }
    const setor = (setores || []).find((s: any) => s.id === form.setorId);
    createMut.mutate({
      setorId: form.setorId,
      setorNome: setor?.nome || setor?.sigla || '',
      cargo: form.titulo,
      nivel: form.nivel,
      descricao: form.descricao || undefined,
      salarioMinimo: form.salarioMinimo || undefined,
      salarioMaximo: form.salarioMaximo || undefined,
      requisitosGrauInstrucao: form.grauInstrucaoMinimo || undefined,
      requisitosExperiencia: form.requisitosFormacao || undefined,
    });
  }

  // Group by cargo
  const grouped = (niveis || []).reduce((acc: Record<string, typeof niveis>, n) => {
    const key = n.cargo || 'Sem Cargo';
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(n);
    return acc;
  }, {} as Record<string, typeof niveis>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-600" /> Níveis de Cargo
          </h1>

              <p className="text-sm text-muted-foreground mt-1">Definição de níveis por cargo/setor com requisitos de formação</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { setForm({ cargoId: 0, setorId: 0, nivel: 1, titulo: '', descricao: '', salarioMinimo: '', salarioMaximo: '', grauInstrucaoMinimo: 'medio_completo', requisitosFormacao: '' }); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Nível
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Layers className="w-8 h-8 text-teal-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Níveis</p>
                <p className="text-2xl font-bold text-teal-700">{niveis?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Cargos com Níveis</p>
                <p className="text-2xl font-bold text-blue-700">{Object.keys(grouped).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Nível Máximo</p>
                <p className="text-2xl font-bold text-green-700">{niveis?.length ? Math.max(...niveis.map(n => n.nivel)) : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela agrupada */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !niveis?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum nível de cargo cadastrado</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([cargoNome, items]) => (
          <Card key={cargoNome}>
            <CardContent className="p-0">
              <div className="px-4 py-3 bg-muted/50 border-b">
                <h3 className="font-semibold text-sm">{cargoNome}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center px-4 py-2 font-medium w-16">Nível</th>
                      <th className="text-left px-4 py-2 font-medium">Título</th>
                      <th className="text-left px-4 py-2 font-medium">Setor</th>
                      <th className="text-center px-4 py-2 font-medium">Grau Mín.</th>
                      <th className="text-right px-4 py-2 font-medium">Faixa Salarial</th>
                      <th className="text-center px-4 py-2 font-medium w-16">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items || []).sort((a, b) => a.nivel - b.nivel).map(n => (
                      <tr key={n.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2 text-center">
                          <Badge variant="outline" className="font-bold">{n.nivel}</Badge>
                        </td>
                        <td className="px-4 py-2 font-medium">{n.descricaoNivel || `Nível ${n.nivel}`}</td>
                        <td className="px-4 py-2 text-muted-foreground">Setor {n.setorId}</td>
                        <td className="px-4 py-2 text-center">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200" variant="outline">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {GRAU_LABELS[n.grauInstrucaoMinimo || ''] || n.grauInstrucaoMinimo || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-muted-foreground">{formatCurrency(n.salarioMinimo || 0)}</span>
                          {n.salarioMaximo && <span className="text-muted-foreground"> — {formatCurrency(n.salarioMaximo || 0)}</span>}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { if (confirm('Remover?')) deleteMut.mutate({ id: n.id }); }}>
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
        ))
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Novo Nível de Cargo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cargo *</Label>
                <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Analista Fiscal" />
              </div>
              <div>
                <Label>Setor</Label>
                <Select value={form.setorId ? String(form.setorId) : ''} onValueChange={v => setForm(f => ({ ...f, setorId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {(setores || []).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome || s.sigla}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nível *</Label>
                <Input type="number" value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: Number(e.target.value) }))} min={1} />
              </div>
              <div>
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Júnior, Pleno, Sênior" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Salário Mínimo (R$) *</Label>
                <Input type="number" step="0.01" value={form.salarioMinimo} onChange={e => setForm(f => ({ ...f, salarioMinimo: e.target.value }))} />
              </div>
              <div>
                <Label>Salário Máximo (R$)</Label>
                <Input type="number" step="0.01" value={form.salarioMaximo} onChange={e => setForm(f => ({ ...f, salarioMaximo: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Grau de Instrução Mínimo</Label>
              <Select value={form.grauInstrucaoMinimo} onValueChange={v => setForm(f => ({ ...f, grauInstrucaoMinimo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GRAU_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Requisitos de Formação</Label>
              <Textarea value={form.requisitosFormacao} onChange={e => setForm(f => ({ ...f, requisitosFormacao: e.target.value }))} rows={2} placeholder="Ex: Graduação em Administração ou áreas afins" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} />
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
