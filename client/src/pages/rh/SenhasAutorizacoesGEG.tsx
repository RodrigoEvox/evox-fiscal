import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Search, Plus, Mail, Monitor, Smartphone, Bell, Server, Wifi, Lock,
  Key, Car, ParkingCircle, CreditCard, Fingerprint, Package,
  Edit2, Trash2, Shield, ShieldCheck, ShieldX, ShieldAlert, Filter, ArrowLeft, XCircle} from 'lucide-react';

const TIPO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  email: { label: 'E-mail', icon: Mail, color: 'bg-blue-100 text-blue-700' },
  computador: { label: 'Computador', icon: Monitor, color: 'bg-purple-100 text-purple-700' },
  celular: { label: 'Celular', icon: Smartphone, color: 'bg-green-100 text-green-700' },
  alarme_escritorio: { label: 'Alarme do Escritório', icon: Bell, color: 'bg-red-100 text-red-700' },
  sistema_interno: { label: 'Sistema Interno', icon: Server, color: 'bg-indigo-100 text-indigo-700' },
  vpn: { label: 'VPN', icon: Shield, color: 'bg-cyan-100 text-cyan-700' },
  wifi: { label: 'Wi-Fi', icon: Wifi, color: 'bg-teal-100 text-teal-700' },
  cofre: { label: 'Cofre', icon: Lock, color: 'bg-amber-100 text-amber-700' },
  chave_empresa: { label: 'Chave da Empresa', icon: Key, color: 'bg-orange-100 text-orange-700' },
  chave_sala: { label: 'Chave de Sala', icon: Key, color: 'bg-yellow-100 text-yellow-700' },
  chave_armario: { label: 'Chave de Armário', icon: Key, color: 'bg-lime-100 text-lime-700' },
  veiculo_empresa: { label: 'Veículo da Empresa', icon: Car, color: 'bg-emerald-100 text-emerald-700' },
  estacionamento: { label: 'Estacionamento', icon: ParkingCircle, color: 'bg-slate-100 text-slate-700' },
  cartao_acesso: { label: 'Cartão de Acesso', icon: CreditCard, color: 'bg-pink-100 text-pink-700' },
  biometria: { label: 'Biometria', icon: Fingerprint, color: 'bg-violet-100 text-violet-700' },
  outro: { label: 'Outro', icon: Package, color: 'bg-neutral-100 text-neutral-700' },
};

const STATUS_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  ativo: { label: 'Ativo', icon: ShieldCheck, color: 'bg-green-100 text-green-700' },
  revogado: { label: 'Revogado', icon: ShieldX, color: 'bg-red-100 text-red-700' },
  expirado: { label: 'Expirado', icon: ShieldAlert, color: 'bg-yellow-100 text-yellow-700' },
  pendente: { label: 'Pendente', icon: Shield, color: 'bg-gray-100 text-gray-700' },
};

const EMPTY_FORM = {
  colaboradorId: 0,
  colaboradorNome: '',
  tipoSenhaAuth: '' as string,
  descricao: '',
  possuiSenha: false,
  senhaObs: '',
  autorizado: false,
  dataAutorizacao: '',
  dataRevogacao: '',
  identificador: '',
  statusSenhaAuth: 'ativo' as string,
  observacoes: '',
};

export default function SenhasAutorizacoesGEG() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const senhasQ = trpc.senhasAutorizacoes.list.useQuery();
  const colabQ = trpc.colaboradores.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.senhasAutorizacoes.create.useMutation({
    onSuccess: () => { utils.senhasAutorizacoes.list.invalidate(); toast.success('Registro criado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.senhasAutorizacoes.update.useMutation({
    onSuccess: () => { utils.senhasAutorizacoes.list.invalidate(); toast.success('Registro atualizado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.senhasAutorizacoes.delete.useMutation({
    onSuccess: () => { utils.senhasAutorizacoes.list.invalidate(); toast.success('Registro removido'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); };

  const colabOptions = useMemo(() => {
    if (!colabQ.data) return [];
    
  const clearAllFilters = () => {
    setSearch("");
    setFilterTipo("");
    setFilterStatus("");
  };
return (colabQ.data as any[])
      .filter((c: any) => c.ativo !== false)
      .sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''))
      .map((c: any) => ({ id: c.id, nome: c.nomeCompleto }));
  }, [colabQ.data]);

  const filtered = useMemo(() => {
    if (!senhasQ.data) return [];
    let list = [...(senhasQ.data as any[])];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => e.colaboradorNome?.toLowerCase().includes(s) || e.descricao?.toLowerCase().includes(s) || e.identificador?.toLowerCase().includes(s));
    }
    if (filterTipo !== 'all') list = list.filter(e => e.tipoSenhaAuth === filterTipo);
    if (filterStatus !== 'all') list = list.filter(e => e.statusSenhaAuth === filterStatus);
    return list.sort((a, b) => (a.colaboradorNome || '').localeCompare(b.colaboradorNome || ''));
  }, [senhasQ.data, search, filterTipo, filterStatus]);

  const handleSubmit = () => {
    if (!form.colaboradorId || !form.tipoSenhaAuth) { toast.error('Selecione o colaborador e o tipo'); return; }
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
      tipoSenhaAuth: e.tipoSenhaAuth,
      descricao: e.descricao || '',
      possuiSenha: e.possuiSenha || false,
      senhaObs: e.senhaObs || '',
      autorizado: e.autorizado || false,
      dataAutorizacao: e.dataAutorizacao || '',
      dataRevogacao: e.dataRevogacao || '',
      identificador: e.identificador || '',
      statusSenhaAuth: e.statusSenhaAuth || 'ativo',
      observacoes: e.observacoes || '',
    });
    setEditId(e.id);
    setShowForm(true);
  };

  // Group by colaborador for summary
  const byColaborador = useMemo(() => {
    const map = new Map<number, { nome: string; items: any[] }>();
    filtered.forEach(e => {
      if (!map.has(e.colaboradorId)) map.set(e.colaboradorId, { nome: e.colaboradorNome, items: [] });
      map.get(e.colaboradorId)!.items.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].nome.localeCompare(b[1].nome));
  }, [filtered]);

  const totalAtivos = filtered.filter(e => e.statusSenhaAuth === 'ativo').length;
  const totalRevogados = filtered.filter(e => e.statusSenhaAuth === 'revogado').length;
  const totalChaves = filtered.filter(e => ['chave_empresa', 'chave_sala', 'chave_armario'].includes(e.tipoSenhaAuth)).length;
  const totalVeiculos = filtered.filter(e => e.tipoSenhaAuth === 'veiculo_empresa').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/gestao-rh"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold">Senhas & Autorizações</h1>

              <p className="text-muted-foreground text-sm">Gestão de senhas, chaves, acessos e autorizações dos colaboradores</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Registro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{totalAtivos}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Revogados</p>
          <p className="text-2xl font-bold text-red-600">{totalRevogados}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Chaves</p>
          <p className="text-2xl font-bold text-orange-600">{totalChaves}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Veículos</p>
          <p className="text-2xl font-bold text-emerald-600">{totalVeiculos}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador, descrição, identificador..." className="pl-9" />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[200px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Tipo" /></SelectTrigger>
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

      {/* Table grouped by collaborator */}
      {byColaborador.map(([colabId, { nome, items }]) => (
        <Card key={colabId}>
          <CardContent className="p-0">
            <div className="p-3 bg-muted/30 border-b flex items-center justify-between">
              <span className="font-semibold">{nome}</span>
              <Badge variant="outline">{items.length} registro(s)</Badge>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2.5 font-medium text-xs text-muted-foreground">Tipo</th>
                  <th className="text-left p-2.5 font-medium text-xs text-muted-foreground">Descrição</th>
                  <th className="text-left p-2.5 font-medium text-xs text-muted-foreground">Identificador</th>
                  <th className="text-left p-2.5 font-medium text-xs text-muted-foreground">Autorizado</th>
                  <th className="text-left p-2.5 font-medium text-xs text-muted-foreground">Status</th>
                  <th className="text-right p-2.5 font-medium text-xs text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s: any) => {
                  const tipoCfg = TIPO_LABELS[s.tipoSenhaAuth] || TIPO_LABELS.outro;
                  const statusCfg = STATUS_LABELS[s.statusSenhaAuth] || STATUS_LABELS.ativo;
                  const TipoIcon = tipoCfg.icon;
                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-2.5">
                        <Badge variant="outline" className={`gap-1 ${tipoCfg.color}`}>
                          <TipoIcon className="w-3 h-3" /> {tipoCfg.label}
                        </Badge>
                      </td>
                      <td className="p-2.5">{s.descricao || '—'}</td>
                      <td className="p-2.5 font-mono text-xs">{s.identificador || '—'}</td>
                      <td className="p-2.5">
                        {s.autorizado
                          ? <span className="text-green-600 font-medium">Sim</span>
                          : <span className="text-red-500 font-medium">Não</span>
                        }
                      </td>
                      <td className="p-2.5"><Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge></td>
                      <td className="p-2.5 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Edit2 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => { if (confirm('Remover este registro?')) deleteMut.mutate({ id: s.id }); }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      {byColaborador.length === 0 && !senhasQ.isLoading && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum registro encontrado</CardContent></Card>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); setShowForm(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Registro' : 'Nova Senha / Autorização'}</DialogTitle>
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
              <Select value={form.tipoSenhaAuth} onValueChange={v => setForm(f => ({ ...f, tipoSenhaAuth: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Descrição</label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Senha do email corporativo" /></div>
            <div><label className="text-sm font-medium mb-1 block">Identificador</label><Input value={form.identificador} onChange={e => setForm(f => ({ ...f, identificador: e.target.value }))} placeholder="Ex: usuario@empresa.com.br, Placa ABC-1234" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.possuiSenha} onChange={e => setForm(f => ({ ...f, possuiSenha: e.target.checked }))} className="h-4 w-4 rounded" />
                <label className="text-sm font-medium">Possui Senha</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.autorizado} onChange={e => setForm(f => ({ ...f, autorizado: e.target.checked }))} className="h-4 w-4 rounded" />
                <label className="text-sm font-medium">Autorizado</label>
              </div>
            </div>
            {form.possuiSenha && (
              <div><label className="text-sm font-medium mb-1 block">Observações da Senha</label><Textarea value={form.senhaObs} onChange={e => setForm(f => ({ ...f, senhaObs: e.target.value }))} rows={2} placeholder="Informações sobre a senha (não armazene a senha real aqui)" /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Data Autorização</label><Input type="date" value={form.dataAutorizacao} onChange={e => setForm(f => ({ ...f, dataAutorizacao: e.target.value }))} /></div>
              <div><label className="text-sm font-medium mb-1 block">Data Revogação</label><Input type="date" value={form.dataRevogacao} onChange={e => setForm(f => ({ ...f, dataRevogacao: e.target.value }))} /></div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={form.statusSenhaAuth} onValueChange={v => setForm(f => ({ ...f, statusSenhaAuth: v }))}>
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
