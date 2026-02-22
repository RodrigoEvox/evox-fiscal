import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Search, Plus, Laptop, Smartphone, Monitor, Headphones, Keyboard,
  Mouse, Camera, Printer, Tablet, Phone, Mail, Hash, Package,
  Edit2, Trash2, ChevronDown, ChevronUp, Filter
} from 'lucide-react';

const TIPO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  notebook: { label: 'Notebook', icon: Laptop, color: 'bg-blue-100 text-blue-700' },
  celular: { label: 'Celular', icon: Smartphone, color: 'bg-green-100 text-green-700' },
  desktop: { label: 'Desktop', icon: Monitor, color: 'bg-purple-100 text-purple-700' },
  monitor: { label: 'Monitor', icon: Monitor, color: 'bg-indigo-100 text-indigo-700' },
  headset: { label: 'Headset', icon: Headphones, color: 'bg-pink-100 text-pink-700' },
  teclado: { label: 'Teclado', icon: Keyboard, color: 'bg-orange-100 text-orange-700' },
  mouse: { label: 'Mouse', icon: Mouse, color: 'bg-yellow-100 text-yellow-700' },
  webcam: { label: 'Webcam', icon: Camera, color: 'bg-cyan-100 text-cyan-700' },
  impressora: { label: 'Impressora', icon: Printer, color: 'bg-red-100 text-red-700' },
  tablet: { label: 'Tablet', icon: Tablet, color: 'bg-teal-100 text-teal-700' },
  telefone_fixo: { label: 'Telefone Fixo', icon: Phone, color: 'bg-slate-100 text-slate-700' },
  ramal: { label: 'Ramal', icon: Phone, color: 'bg-gray-100 text-gray-700' },
  email_corporativo: { label: 'E-mail Corporativo', icon: Mail, color: 'bg-emerald-100 text-emerald-700' },
  telefone_corporativo: { label: 'Telefone Corporativo', icon: Phone, color: 'bg-lime-100 text-lime-700' },
  outro: { label: 'Outro', icon: Package, color: 'bg-neutral-100 text-neutral-700' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  em_uso: { label: 'Em Uso', color: 'bg-green-100 text-green-700' },
  devolvido: { label: 'Devolvido', color: 'bg-blue-100 text-blue-700' },
  manutencao: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-700' },
  perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700' },
  descartado: { label: 'Descartado', color: 'bg-gray-100 text-gray-700' },
};

const EMPTY_FORM = {
  colaboradorId: 0,
  colaboradorNome: '',
  tipo: '' as string,
  marca: '',
  modelo: '',
  numeroSerie: '',
  patrimonio: '',
  descricao: '',
  dataEntrega: '',
  dataDevolucao: '',
  statusEquipamento: 'em_uso' as string,
  observacoes: '',
};

export default function EquipamentosGEG() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const equipQ = trpc.equipamentos.list.useQuery();
  const colabQ = trpc.colaboradores.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.equipamentos.create.useMutation({
    onSuccess: () => { utils.equipamentos.list.invalidate(); toast.success('Equipamento registrado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.equipamentos.update.useMutation({
    onSuccess: () => { utils.equipamentos.list.invalidate(); toast.success('Equipamento atualizado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.equipamentos.delete.useMutation({
    onSuccess: () => { utils.equipamentos.list.invalidate(); toast.success('Equipamento removido'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); };

  const colabOptions = useMemo(() => {
    if (!colabQ.data) return [];
    return (colabQ.data as any[])
      .filter((c: any) => c.ativo !== false)
      .sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''))
      .map((c: any) => ({ id: c.id, nome: c.nomeCompleto }));
  }, [colabQ.data]);

  const filtered = useMemo(() => {
    if (!equipQ.data) return [];
    let list = [...(equipQ.data as any[])];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => e.colaboradorNome?.toLowerCase().includes(s) || e.marca?.toLowerCase().includes(s) || e.modelo?.toLowerCase().includes(s) || e.patrimonio?.toLowerCase().includes(s) || e.numeroSerie?.toLowerCase().includes(s));
    }
    if (filterTipo !== 'all') list = list.filter(e => e.tipo === filterTipo);
    if (filterStatus !== 'all') list = list.filter(e => e.statusEquipamento === filterStatus);
    return list.sort((a, b) => (a.colaboradorNome || '').localeCompare(b.colaboradorNome || ''));
  }, [equipQ.data, search, filterTipo, filterStatus]);

  const handleSubmit = () => {
    if (!form.colaboradorId || !form.tipo) { toast.error('Selecione o colaborador e o tipo'); return; }
    if (editId) {
      const { colaboradorId, colaboradorNome, ...data } = form;
      updateMut.mutate({ id: editId, data: data as any });
    } else {
      createMut.mutate(form as any);
    }
  };

  const openEdit = (e: any) => {
    setForm({
      colaboradorId: e.colaboradorId,
      colaboradorNome: e.colaboradorNome,
      tipo: e.tipo,
      marca: e.marca || '',
      modelo: e.modelo || '',
      numeroSerie: e.numeroSerie || '',
      patrimonio: e.patrimonio || '',
      descricao: e.descricao || '',
      dataEntrega: e.dataEntrega || '',
      dataDevolucao: e.dataDevolucao || '',
      statusEquipamento: e.statusEquipamento || 'em_uso',
      observacoes: e.observacoes || '',
    });
    setEditId(e.id);
    setShowForm(true);
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Stats
  const totalEmUso = filtered.filter(e => e.statusEquipamento === 'em_uso').length;
  const totalDevolvido = filtered.filter(e => e.statusEquipamento === 'devolvido').length;
  const totalManutencao = filtered.filter(e => e.statusEquipamento === 'manutencao').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipamentos & Comunicações</h1>
          <p className="text-muted-foreground text-sm">Gestão de equipamentos, emails e telefones corporativos da equipe</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Registro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Em Uso</p>
          <p className="text-2xl font-bold text-green-600">{totalEmUso}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Devolvidos</p>
          <p className="text-2xl font-bold text-blue-600">{totalDevolvido}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Manutenção</p>
          <p className="text-2xl font-bold text-yellow-600">{totalManutencao}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador, marca, modelo, patrimônio..." className="pl-9" />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium">Colaborador</th>
                  <th className="text-left p-3 font-medium">Tipo</th>
                  <th className="text-left p-3 font-medium">Marca / Modelo</th>
                  <th className="text-left p-3 font-medium">Patrimônio</th>
                  <th className="text-left p-3 font-medium">Entrega</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">Nenhum equipamento encontrado</td></tr>
                )}
                {filtered.map(eq => {
                  const tipoCfg = TIPO_LABELS[eq.tipo] || TIPO_LABELS.outro;
                  const statusCfg = STATUS_LABELS[eq.statusEquipamento] || STATUS_LABELS.em_uso;
                  const TipoIcon = tipoCfg.icon;
                  const expanded = expandedRows.has(eq.id);
                  return (
                    <tr key={eq.id} className="border-b hover:bg-muted/20 cursor-pointer" onClick={() => toggleRow(eq.id)}>
                      <td className="p-3 font-medium">{eq.colaboradorNome}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`gap-1 ${tipoCfg.color}`}>
                          <TipoIcon className="w-3 h-3" /> {tipoCfg.label}
                        </Badge>
                      </td>
                      <td className="p-3">{[eq.marca, eq.modelo].filter(Boolean).join(' ') || '—'}</td>
                      <td className="p-3 font-mono text-xs">{eq.patrimonio || '—'}</td>
                      <td className="p-3">{eq.dataEntrega ? new Date(eq.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="p-3"><Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge></td>
                      <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(eq)}><Edit2 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => { if (confirm('Remover este registro?')) deleteMut.mutate({ id: eq.id }); }}><Trash2 className="w-4 h-4" /></Button>
                          {expanded ? <ChevronUp className="w-4 h-4 mt-2" /> : <ChevronDown className="w-4 h-4 mt-2" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) { resetForm(); } setShowForm(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Registro' : 'Novo Equipamento / Comunicação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Colaborador *</label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={v => {
                const c = colabOptions.find(o => o.id === Number(v));
                setForm(f => ({ ...f, colaboradorId: Number(v), colaboradorNome: c?.nome || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger>
                <SelectContent>
                  {colabOptions.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo *</label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Marca</label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
              <div><label className="text-sm font-medium mb-1 block">Modelo</label><Input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Nº Série</label><Input value={form.numeroSerie} onChange={e => setForm(f => ({ ...f, numeroSerie: e.target.value }))} /></div>
              <div><label className="text-sm font-medium mb-1 block">Patrimônio</label><Input value={form.patrimonio} onChange={e => setForm(f => ({ ...f, patrimonio: e.target.value }))} /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Descrição</label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição do item" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Data Entrega</label><Input type="date" value={form.dataEntrega} onChange={e => setForm(f => ({ ...f, dataEntrega: e.target.value }))} /></div>
              <div><label className="text-sm font-medium mb-1 block">Data Devolução</label><Input type="date" value={form.dataDevolucao} onChange={e => setForm(f => ({ ...f, dataDevolucao: e.target.value }))} /></div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={form.statusEquipamento} onValueChange={v => setForm(f => ({ ...f, statusEquipamento: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Observações</label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
                {editId ? 'Salvar Alterações' : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
