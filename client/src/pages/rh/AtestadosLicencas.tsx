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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Search, FileText, Calendar, AlertTriangle } from 'lucide-react';

const TIPO_LABELS: Record<string, string> = {
  atestado_medico: 'Atestado Médico',
  licenca_maternidade: 'Licença Maternidade',
  licenca_paternidade: 'Licença Paternidade',
  licenca_casamento: 'Licença Casamento',
  licenca_obito: 'Licença Óbito',
  licenca_medica: 'Licença Médica',
  acidente_trabalho: 'Acidente de Trabalho',
  outro: 'Outro',
};

export default function AtestadosLicencas() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    colaboradorId: 0, colaboradorNome: '', tipo: 'atestado_medico' as string,
    dataInicio: '', dataFim: '', diasAfastamento: 1, cid: '', medicoNome: '', crm: '',
    observacao: '', status: 'ativo' as string,
  });

  const colaboradores = trpc.colaboradores.list.useQuery();
  const atestados = trpc.atestadosLicencas.list.useQuery();
  const createMut = trpc.atestadosLicencas.create.useMutation({ onSuccess: () => { atestados.refetch(); setShowForm(false); resetForm(); toast.success('Registro cadastrado!'); } });
  const updateMut = trpc.atestadosLicencas.update.useMutation({ onSuccess: () => { atestados.refetch(); setShowForm(false); resetForm(); toast.success('Registro atualizado!'); } });

  const resetForm = () => {
    setForm({ colaboradorId: 0, colaboradorNome: '', tipo: 'atestado_medico', dataInicio: '', dataFim: '', diasAfastamento: 1, cid: '', medicoNome: '', crm: '', observacao: '', status: 'ativo' });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.colaboradorId) { toast.error('Selecione o colaborador'); return; }
    if (!form.dataInicio) { toast.error('Informe a data de início'); return; }
    const payload = { ...form, tipo: form.tipo as any, status: form.status as any };
    if (editId) {
      updateMut.mutate({ id: editId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const openEdit = (a: any) => {
    setForm({ colaboradorId: a.colaboradorId || 0, colaboradorNome: a.colaboradorNome || '', tipo: a.tipo || 'atestado_medico', dataInicio: a.dataInicio || '', dataFim: a.dataFim || '', diasAfastamento: a.diasAfastamento || 1, cid: a.cid || '', medicoNome: a.medicoNome || '', crm: a.crm || '', observacao: a.observacao || '', status: a.status || 'ativo' });
    setEditId(a.id);
    setShowForm(true);
  };

  const colabList = (colaboradores.data || []) as any[];
  const list = (atestados.data || []) as any[];

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((a: any) => a.colaboradorNome?.toLowerCase().includes(s) || TIPO_LABELS[a.tipo]?.toLowerCase().includes(s));
  }, [list, search]);

  // Stats
  const totalDiasAfastamento = list.reduce((sum, a) => sum + (a.diasAfastamento || 0), 0);
  const ativos = list.filter(a => a.status === 'ativo');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atestados e Licenças</h1>
          <p className="text-muted-foreground">Gestão de atestados e licenças dos colaboradores — Gente & Gestão</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Registro</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{list.length}</p><p className="text-xs text-muted-foreground">Total de Registros</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{ativos.length}</p><p className="text-xs text-muted-foreground">Afastamentos Ativos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{totalDiasAfastamento}</p><p className="text-xs text-muted-foreground">Total Dias Afastamento</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por colaborador ou tipo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>CID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.colaboradorNome}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{TIPO_LABELS[a.tipo] || a.tipo}</Badge></TableCell>
                <TableCell className="text-sm">{a.dataInicio}{a.dataFim ? ` a ${a.dataFim}` : ''}</TableCell>
                <TableCell>{a.diasAfastamento}</TableCell>
                <TableCell className="text-sm">{a.cid || '—'}</TableCell>
                <TableCell>
                  <Badge className={a.status === 'ativo' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                    {a.status === 'ativo' ? 'Ativo' : 'Encerrado'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(a)}>Editar</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar Registro' : 'Novo Atestado/Licença'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={v => {
                const c = colabList.find((c: any) => c.id === Number(v));
                setForm(f => ({ ...f, colaboradorId: Number(v), colaboradorNome: c?.nomeCompleto || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {colabList.filter(c => c.ativo !== false).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Data Início *</Label><Input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={form.dataFim} onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))} /></div>
              <div><Label>Dias Afastamento</Label><Input type="number" min={1} value={form.diasAfastamento} onChange={e => setForm(f => ({ ...f, diasAfastamento: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>CID</Label><Input value={form.cid} onChange={e => setForm(f => ({ ...f, cid: e.target.value }))} placeholder="Ex: J06" /></div>
              <div><Label>Médico</Label><Input value={form.medicoNome} onChange={e => setForm(f => ({ ...f, medicoNome: e.target.value }))} /></div>
              <div><Label>CRM</Label><Input value={form.crm} onChange={e => setForm(f => ({ ...f, crm: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observação</Label><Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
