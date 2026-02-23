import { Link } from 'wouter';
import { useState, useMemo, useCallback } from 'react';
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Search, Plus, Laptop, Smartphone, Monitor, Headphones, Keyboard,
  Mouse, Camera, Printer, Tablet, Phone, Mail, Hash, Package,
  Edit2, Trash2, ChevronDown, ChevronUp, Filter, ArrowLeft, XCircle,
  Lock, Key, Car, ParkingCircle, CreditCard, Fingerprint,
  Bell, Server, Wifi, Shield, ShieldCheck, ShieldX, ShieldAlert,
  AtSign, CheckCircle2, AlertCircle, UserCheck, Loader2, Eye, EyeOff,
  Download, FileSpreadsheet, FileText, History, Clock
} from 'lucide-react';

// ===================== EXPORT HELPERS =====================

function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = '\uFEFF';
  const csv = bom + [headers.join(';'), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(';'))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success('Arquivo CSV exportado!');
}

function exportPDF(title: string, headers: string[], rows: string[][]) {
  // Simple HTML-to-print PDF approach
  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
      h1 { font-size: 16px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
      tr:nth-child(even) { background: #fafafa; }
      .footer { margin-top: 20px; font-size: 9px; color: #999; }
    </style></head><body>
    <h1>${title}</h1>
    <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c || '—'}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <p class="footer">Evox Fiscal — Sistema de Gestão</p>
    </body></html>`;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  }
  toast.success('PDF gerado para impressão!');
}

// ===================== CONSTANTS =====================

const EQUIP_TIPO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
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
  telefone_corporativo: { label: 'Telefone Corporativo', icon: Phone, color: 'bg-lime-100 text-lime-700' },
  outro: { label: 'Outro', icon: Package, color: 'bg-neutral-100 text-neutral-700' },
};

const EQUIP_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  em_uso: { label: 'Em Uso', color: 'bg-green-100 text-green-700' },
  devolvido: { label: 'Devolvido', color: 'bg-blue-100 text-blue-700' },
  manutencao: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-700' },
  perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700' },
  descartado: { label: 'Descartado', color: 'bg-gray-100 text-gray-700' },
};

const SENHA_TIPO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
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

const SENHA_STATUS_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  ativo: { label: 'Ativo', icon: ShieldCheck, color: 'bg-green-100 text-green-700' },
  revogado: { label: 'Revogado', icon: ShieldX, color: 'bg-red-100 text-red-700' },
  expirado: { label: 'Expirado', icon: ShieldAlert, color: 'bg-yellow-100 text-yellow-700' },
  pendente: { label: 'Pendente', icon: Shield, color: 'bg-gray-100 text-gray-700' },
};

const EMAIL_TIPO_LABELS: Record<string, { label: string; color: string }> = {
  principal: { label: 'Principal', color: 'bg-blue-100 text-blue-700' },
  alias: { label: 'Alias', color: 'bg-purple-100 text-purple-700' },
  compartilhado: { label: 'Compartilhado', color: 'bg-orange-100 text-orange-700' },
  grupo: { label: 'Grupo', color: 'bg-teal-100 text-teal-700' },
};

const EMAIL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  desativado: { label: 'Desativado', color: 'bg-gray-100 text-gray-700' },
  suspenso: { label: 'Suspenso', color: 'bg-yellow-100 text-yellow-700' },
};

const DOMINIO = '@grupoevox.com.br';

// ===================== EMAIL SUGGESTIONS =====================
function gerarSugestoesEmail(nomeCompleto: string, emailsExistentes: string[]): string[] {
  if (!nomeCompleto || !nomeCompleto.trim()) return [];
  const partes = nomeCompleto.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return [];

  const primeiro = partes[0];
  const ultimo = partes[partes.length - 1];
  const iniciais = partes.map(p => p[0]).join('');

  const candidatos = [
    `${primeiro}.${ultimo}`,
    `${primeiro}${ultimo}`,
    `${primeiro}.${partes.length > 2 ? partes[1][0] + '.' : ''}${ultimo}`,
    `${primeiro[0]}${ultimo}`,
    `${primeiro}`,
    `${primeiro}.${ultimo}${partes.length > 2 ? partes[1][0] : ''}`,
    `${iniciais}`,
  ];

  const existSet = new Set(emailsExistentes.map(e => e.toLowerCase()));
  const sugestoes: string[] = [];
  const seen = new Set<string>();

  for (const c of candidatos) {
    const email = `${c}${DOMINIO}`;
    if (!seen.has(email)) {
      seen.add(email);
      sugestoes.push(email);
    }
  }

  return sugestoes.map(s => ({
    email: s,
    disponivel: !existSet.has(s.toLowerCase()),
  }))
    .sort((a, b) => (a.disponivel === b.disponivel ? 0 : a.disponivel ? -1 : 1))
    .map(s => s.email)
    .slice(0, 5);
}

// ===================== TABS =====================
type TabType = 'equipamentos' | 'emails' | 'senhas';

// ===================== MAIN COMPONENT =====================
export default function EquipamentosGEG() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('equipamentos');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/rh/gestao-rh">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Equipamentos & Comunicações</h1>
            <p className="text-muted-foreground text-sm">
              Gestão de equipamentos, e-mails corporativos e senhas/acessos da equipe
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('equipamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'equipamentos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
          }`}
        >
          <Laptop className="w-4 h-4" />
          Equipamentos
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'emails'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
          }`}
        >
          <Mail className="w-4 h-4" />
          E-mails Corporativos
        </button>
        <button
          onClick={() => setActiveTab('senhas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'senhas'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
          }`}
        >
          <Key className="w-4 h-4" />
          Senhas & Acessos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'equipamentos' && <EquipamentosTab />}
      {activeTab === 'emails' && <EmailsTab />}
      {activeTab === 'senhas' && <SenhasTab />}
    </div>
  );
}

// ===================== EQUIPAMENTOS TAB =====================
function EquipamentosTab() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
  const [form, setForm] = useState(EMPTY_FORM);

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

  const clearAllFilters = () => {
    setSearch('');
    setFilterTipo('all');
    setFilterStatus('all');
  };

  const colabOptions = useMemo(() => {
    if (!colabQ.data) return [];
    return (colabQ.data as any[])
      .filter((c: any) => c.ativo !== false)
      .sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''))
      .map((c: any) => ({ id: c.id, nome: c.nomeCompleto }));
  }, [colabQ.data]);

  // Filter out email_corporativo from equipment list (now in its own tab)
  const filtered = useMemo(() => {
    if (!equipQ.data) return [];
    let list = [...(equipQ.data as any[])].filter(e => e.tipo !== 'email_corporativo');
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

  const totalEmUso = filtered.filter(e => e.statusEquipamento === 'em_uso').length;
  const totalDevolvido = filtered.filter(e => e.statusEquipamento === 'devolvido').length;
  const totalManutencao = filtered.filter(e => e.statusEquipamento === 'manutencao').length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
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

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador, marca, modelo, patrimônio..." className="pl-9" />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {Object.entries(EQUIP_TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(EQUIP_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
          <XCircle className="w-4 h-4 mr-1" />Limpar Filtros
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              const headers = ['Colaborador', 'Tipo', 'Marca', 'Modelo', 'Nº Série', 'Patrimônio', 'Status', 'Data Entrega'];
              const rows = filtered.map((e: any) => [
                e.colaboradorNome, EQUIP_TIPO_LABELS[e.tipo]?.label || e.tipo, e.marca, e.modelo,
                e.numeroSerie, e.patrimonio, EQUIP_STATUS_LABELS[e.statusEquipamento]?.label || e.statusEquipamento,
                e.dataEntrega || ''
              ]);
              exportCSV('equipamentos.csv', headers, rows);
            }}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const headers = ['Colaborador', 'Tipo', 'Marca', 'Modelo', 'Nº Série', 'Patrimônio', 'Status', 'Data Entrega'];
              const rows = filtered.map((e: any) => [
                e.colaboradorNome, EQUIP_TIPO_LABELS[e.tipo]?.label || e.tipo, e.marca, e.modelo,
                e.numeroSerie, e.patrimonio, EQUIP_STATUS_LABELS[e.statusEquipamento]?.label || e.statusEquipamento,
                e.dataEntrega || ''
              ]);
              exportPDF('Relatório de Equipamentos', headers, rows);
            }}>
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Novo Equipamento
        </Button>
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
                  const tipoCfg = EQUIP_TIPO_LABELS[eq.tipo] || EQUIP_TIPO_LABELS.outro;
                  const statusCfg = EQUIP_STATUS_LABELS[eq.statusEquipamento] || EQUIP_STATUS_LABELS.em_uso;
                  const TipoIcon = tipoCfg.icon;
                  const expanded = expandedRows.has(eq.id);
                  return (
                    <>
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
                      {expanded && (
                        <tr key={`${eq.id}-detail`} className="bg-muted/10">
                          <td colSpan={7} className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div><span className="text-muted-foreground">Nº Série:</span> <span className="font-medium">{eq.numeroSerie || '—'}</span></div>
                              <div><span className="text-muted-foreground">Descrição:</span> <span className="font-medium">{eq.descricao || '—'}</span></div>
                              <div><span className="text-muted-foreground">Data Devolução:</span> <span className="font-medium">{eq.dataDevolucao ? new Date(eq.dataDevolucao + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
                              <div><span className="text-muted-foreground">Observações:</span> <span className="font-medium">{eq.observacoes || '—'}</span></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); setShowForm(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
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
                  {Object.entries(EQUIP_TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
                  {Object.entries(EQUIP_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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

// ===================== EMAILS TAB =====================
function EmailsTab() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const EMPTY_FORM = {
    colaboradorId: 0,
    colaboradorNome: '',
    email: '',
    tipoEmail: 'principal' as string,
    statusEmail: 'ativo' as string,
    dataCriacao: '',
    dataDesativacao: '',
    observacoes: '',
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [emailSugestoes, setEmailSugestoes] = useState<string[]>([]);
  const [emailDisponivel, setEmailDisponivel] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const emailsQ = trpc.emailsCorporativos.list.useQuery();
  const colabQ = trpc.colaboradores.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.emailsCorporativos.create.useMutation({
    onSuccess: () => { utils.emailsCorporativos.list.invalidate(); toast.success('E-mail corporativo criado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.emailsCorporativos.update.useMutation({
    onSuccess: () => { utils.emailsCorporativos.list.invalidate(); toast.success('E-mail atualizado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.emailsCorporativos.delete.useMutation({
    onSuccess: () => { utils.emailsCorporativos.list.invalidate(); toast.success('E-mail removido'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setEmailSugestoes([]); setEmailDisponivel(null); };

  const clearAllFilters = () => {
    setSearch('');
    setFilterTipo('all');
    setFilterStatus('all');
  };

  const colabOptions = useMemo(() => {
    if (!colabQ.data) return [];
    return (colabQ.data as any[])
      .filter((c: any) => c.ativo !== false)
      .sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''))
      .map((c: any) => ({ id: c.id, nome: c.nomeCompleto }));
  }, [colabQ.data]);

  const allExistingEmails = useMemo(() => {
    if (!emailsQ.data) return [];
    return (emailsQ.data as any[]).map((e: any) => e.email);
  }, [emailsQ.data]);

  const handleColaboradorChange = useCallback((v: string) => {
    const c = colabOptions.find(o => o.id === Number(v));
    setForm(f => ({ ...f, colaboradorId: Number(v), colaboradorNome: c?.nome || '' }));
    if (c) {
      const sugestoes = gerarSugestoesEmail(c.nome, allExistingEmails);
      setEmailSugestoes(sugestoes);
      if (sugestoes.length > 0) {
        const disponivel = !allExistingEmails.some(e => e.toLowerCase() === sugestoes[0].toLowerCase());
        setForm(f => ({ ...f, email: sugestoes[0] }));
        setEmailDisponivel(disponivel);
      }
    }
  }, [colabOptions, allExistingEmails]);

  const handleEmailChange = useCallback((email: string) => {
    setForm(f => ({ ...f, email }));
    if (email && email.includes('@')) {
      const exists = allExistingEmails.some(e => e.toLowerCase() === email.toLowerCase());
      setEmailDisponivel(!exists);
    } else {
      setEmailDisponivel(null);
    }
  }, [allExistingEmails]);

  const filtered = useMemo(() => {
    if (!emailsQ.data) return [];
    let list = [...(emailsQ.data as any[])];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => e.colaboradorNome?.toLowerCase().includes(s) || e.email?.toLowerCase().includes(s));
    }
    if (filterTipo !== 'all') list = list.filter(e => e.tipoEmail === filterTipo);
    if (filterStatus !== 'all') list = list.filter(e => e.statusEmail === filterStatus);
    return list.sort((a, b) => (a.colaboradorNome || '').localeCompare(b.colaboradorNome || ''));
  }, [emailsQ.data, search, filterTipo, filterStatus]);

  const handleSubmit = () => {
    if (!form.colaboradorId || !form.email) { toast.error('Selecione o colaborador e informe o e-mail'); return; }
    if (!form.email.includes('@')) { toast.error('E-mail inválido'); return; }
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
      email: e.email || '',
      tipoEmail: e.tipoEmail || 'principal',
      statusEmail: e.statusEmail || 'ativo',
      dataCriacao: e.dataCriacao || '',
      dataDesativacao: e.dataDesativacao || '',
      observacoes: e.observacoes || '',
    });
    setEditId(e.id);
    setShowForm(true);
    setEmailSugestoes([]);
    setEmailDisponivel(null);
  };

  const totalAtivos = filtered.filter(e => e.statusEmail === 'ativo').length;
  const totalDesativados = filtered.filter(e => e.statusEmail === 'desativado').length;
  const totalPrincipal = filtered.filter(e => e.tipoEmail === 'principal').length;
  const totalCompartilhado = filtered.filter(e => e.tipoEmail === 'compartilhado' || e.tipoEmail === 'grupo').length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{totalAtivos}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Desativados</p>
          <p className="text-2xl font-bold text-gray-500">{totalDesativados}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Compartilhados/Grupo</p>
          <p className="text-2xl font-bold text-purple-600">{totalCompartilhado}</p>
        </CardContent></Card>
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador ou e-mail..." className="pl-9" />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {Object.entries(EMAIL_TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(EMAIL_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
          <XCircle className="w-4 h-4 mr-1" />Limpar Filtros
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              const headers = ['Colaborador', 'E-mail', 'Status', 'Data Criação', 'Observações'];
              const rows = filtered.map((e: any) => [
                e.colaboradorNome, e.email, e.statusEmail || 'ativo',
                e.dataCriacao || '', e.observacoes || ''
              ]);
              exportCSV('emails-corporativos.csv', headers, rows);
            }}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const headers = ['Colaborador', 'E-mail', 'Status', 'Data Criação', 'Observações'];
              const rows = filtered.map((e: any) => [
                e.colaboradorNome, e.email, e.statusEmail || 'ativo',
                e.dataCriacao || '', e.observacoes || ''
              ]);
              exportPDF('Relatório de E-mails Corporativos', headers, rows);
            }}>
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Novo E-mail
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium">Colaborador</th>
                  <th className="text-left p-3 font-medium">E-mail</th>
                  <th className="text-left p-3 font-medium">Tipo</th>
                  <th className="text-left p-3 font-medium">Criação</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">Nenhum e-mail corporativo encontrado</td></tr>
                )}
                {filtered.map(em => {
                  const tipoCfg = EMAIL_TIPO_LABELS[em.tipoEmail] || EMAIL_TIPO_LABELS.principal;
                  const statusCfg = EMAIL_STATUS_LABELS[em.statusEmail] || EMAIL_STATUS_LABELS.ativo;
                  return (
                    <tr key={em.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-medium">{em.colaboradorNome}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{em.email}</span>
                        </div>
                      </td>
                      <td className="p-3"><Badge variant="outline" className={tipoCfg.color}>{tipoCfg.label}</Badge></td>
                      <td className="p-3">{em.dataCriacao ? new Date(em.dataCriacao + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="p-3"><Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge></td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(em)}><Edit2 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => { if (confirm('Remover este e-mail?')) deleteMut.mutate({ id: em.id }); }}><Trash2 className="w-4 h-4" /></Button>
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
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); setShowForm(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar E-mail Corporativo' : 'Novo E-mail Corporativo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Colaborador *</label>
              <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={handleColaboradorChange}>
                <SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger>
                <SelectContent>
                  {colabOptions.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Email field with suggestions */}
            <div>
              <label className="text-sm font-medium mb-1 block">E-mail *</label>
              <div className="relative">
                <Input
                  value={form.email}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder={`nome${DOMINIO}`}
                  className={`pr-10 ${emailDisponivel === false ? 'border-red-400 focus-visible:ring-red-400' : emailDisponivel === true ? 'border-green-400 focus-visible:ring-green-400' : ''}`}
                />
                {emailDisponivel !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailDisponivel ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {emailDisponivel === false && (
                <p className="text-xs text-red-500 mt-1">Este e-mail já está cadastrado no sistema</p>
              )}
              {emailDisponivel === true && (
                <p className="text-xs text-green-600 mt-1">E-mail disponível</p>
              )}
            </div>

            {/* Suggestions */}
            {emailSugestoes.length > 0 && !editId && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Sugestões de e-mail:</label>
                <div className="flex flex-wrap gap-1.5">
                  {emailSugestoes.map(sug => {
                    const isUsed = allExistingEmails.some(e => e.toLowerCase() === sug.toLowerCase());
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          if (!isUsed) {
                            handleEmailChange(sug);
                          }
                        }}
                        disabled={isUsed}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          form.email === sug
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : isUsed
                            ? 'bg-red-50 border-red-200 text-red-400 line-through cursor-not-allowed'
                            : 'bg-muted hover:bg-muted/80 border-border cursor-pointer'
                        }`}
                      >
                        {isUsed && <XCircle className="w-3 h-3 inline mr-1" />}
                        {!isUsed && form.email === sug && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {sug}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <Select value={form.tipoEmail} onValueChange={v => setForm(f => ({ ...f, tipoEmail: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EMAIL_TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Data Criação</label><Input type="date" value={form.dataCriacao} onChange={e => setForm(f => ({ ...f, dataCriacao: e.target.value }))} /></div>
              <div><label className="text-sm font-medium mb-1 block">Data Desativação</label><Input type="date" value={form.dataDesativacao} onChange={e => setForm(f => ({ ...f, dataDesativacao: e.target.value }))} /></div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={form.statusEmail} onValueChange={v => setForm(f => ({ ...f, statusEmail: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EMAIL_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Observações</label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending || emailDisponivel === false}>
                {editId ? 'Salvar Alterações' : 'Criar E-mail'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== SENHAS TAB =====================
function SenhasTab() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const EMPTY_FORM = {
    colaboradorId: 0,
    colaboradorNome: '',
    tipoSenhaAuth: '' as string,
    descricao: '',
    possuiSenha: false,
    senhaValor: '',
    senhaObs: '',
    autorizado: false,
    dataAutorizacao: '',
    dataRevogacao: '',
    identificador: '',
    statusSenhaAuth: 'ativo' as string,
    observacoes: '',
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);

  const senhasQ = trpc.senhasAutorizacoes.list.useQuery();
  const colabQ = trpc.colaboradores.list.useQuery();
  const historicoQ = trpc.senhasAutorizacoes.historico.useQuery();
  const utils = trpc.useUtils();
  const [showHistorico, setShowHistorico] = useState(false);

  const createMut = trpc.senhasAutorizacoes.create.useMutation({
    onSuccess: () => { utils.senhasAutorizacoes.list.invalidate(); utils.senhasAutorizacoes.historico.invalidate(); toast.success('Registro criado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.senhasAutorizacoes.update.useMutation({
    onSuccess: () => { utils.senhasAutorizacoes.list.invalidate(); utils.senhasAutorizacoes.historico.invalidate(); toast.success('Registro atualizado'); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.senhasAutorizacoes.delete.useMutation({
    onSuccess: () => { utils.senhasAutorizacoes.list.invalidate(); utils.senhasAutorizacoes.historico.invalidate(); toast.success('Registro removido'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowPassword(false); };

  const clearAllFilters = () => {
    setSearch('');
    setFilterTipo('all');
    setFilterStatus('all');
  };

  const colabOptions = useMemo(() => {
    if (!colabQ.data) return [];
    return (colabQ.data as any[])
      .filter((c: any) => c.ativo !== false)
      .sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''))
      .map((c: any) => ({ id: c.id, nome: c.nomeCompleto }));
  }, [colabQ.data]);

  // Filter out email type from senhas (emails now have their own tab)
  const filtered = useMemo(() => {
    if (!senhasQ.data) return [];
    let list = [...(senhasQ.data as any[])].filter(e => e.tipoSenhaAuth !== 'email');
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
      senhaValor: e.senhaValor || '',
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
    setShowPassword(false);
  };

  // Group by colaborador
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
    <div className="space-y-4">
      {/* KPIs */}
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

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador, descrição, identificador..." className="pl-9" />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[200px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {Object.entries(SENHA_TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(SENHA_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
          <XCircle className="w-4 h-4 mr-1" />Limpar Filtros
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              const headers = ['Colaborador', 'Tipo', 'Descrição', 'Identificador', 'Status', 'Data Autorização', 'Data Revogação'];
              const rows = filtered.map((e: any) => [
                e.colaboradorNome, SENHA_TIPO_LABELS[e.tipoSenhaAuth]?.label || e.tipoSenhaAuth,
                e.descricao || '', e.identificador || '',
                SENHA_STATUS_LABELS[e.statusSenhaAuth]?.label || e.statusSenhaAuth,
                e.dataAutorizacao || '', e.dataRevogacao || ''
              ]);
              exportCSV('senhas-acessos.csv', headers, rows);
            }}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const headers = ['Colaborador', 'Tipo', 'Descrição', 'Identificador', 'Status', 'Data Autorização', 'Data Revogação'];
              const rows = filtered.map((e: any) => [
                e.colaboradorNome, SENHA_TIPO_LABELS[e.tipoSenhaAuth]?.label || e.tipoSenhaAuth,
                e.descricao || '', e.identificador || '',
                SENHA_STATUS_LABELS[e.statusSenhaAuth]?.label || e.statusSenhaAuth,
                e.dataAutorizacao || '', e.dataRevogacao || ''
              ]);
              exportPDF('Relatório de Senhas & Acessos', headers, rows);
            }}>
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Nova Senha/Acesso
        </Button>
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
                  const tipoCfg = SENHA_TIPO_LABELS[s.tipoSenhaAuth] || SENHA_TIPO_LABELS.outro;
                  const statusCfg = SENHA_STATUS_LABELS[s.statusSenhaAuth] || SENHA_STATUS_LABELS.ativo;
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
            <DialogTitle>{editId ? 'Editar Registro' : 'Nova Senha / Acesso'}</DialogTitle>
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
                  {Object.entries(SENHA_TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Descrição</label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Senha do sistema ERP" /></div>
            <div><label className="text-sm font-medium mb-1 block">Identificador</label><Input value={form.identificador} onChange={e => setForm(f => ({ ...f, identificador: e.target.value }))} placeholder="Ex: Placa ABC-1234, Chave nº 5" /></div>
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
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Senha</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.senhaValor}
                      onChange={e => setForm(f => ({ ...f, senhaValor: e.target.value }))}
                      placeholder="Digite a senha do colaborador"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Visível apenas para gestores do setor</p>
                </div>
                <div><label className="text-sm font-medium mb-1 block">Observações da Senha</label><Textarea value={form.senhaObs} onChange={e => setForm(f => ({ ...f, senhaObs: e.target.value }))} rows={2} placeholder="Informações adicionais sobre a senha" /></div>
              </>
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
                  {Object.entries(SENHA_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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

      {/* Histórico de Alterações */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <button
            onClick={() => setShowHistorico(p => !p)}
            className="flex items-center gap-2 w-full text-left"
          >
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Histórico de Alterações</span>
            <Badge variant="outline" className="text-[10px] ml-1">{(historicoQ.data as any[] || []).length}</Badge>
            <span className="ml-auto">{showHistorico ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
          </button>
          {showHistorico && (
            <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
              {(historicoQ.data as any[] || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro no histórico</p>
              ) : (
                (historicoQ.data as any[]).map((h: any) => {
                  const acaoColors: Record<string, string> = {
                    criado: 'bg-green-100 text-green-700',
                    atualizado: 'bg-blue-100 text-blue-700',
                    revogado: 'bg-red-100 text-red-700',
                    reativado: 'bg-emerald-100 text-emerald-700',
                    transferido: 'bg-purple-100 text-purple-700',
                    senha_alterada: 'bg-amber-100 text-amber-700',
                  };
                  const acaoLabels: Record<string, string> = {
                    criado: 'Criado',
                    atualizado: 'Atualizado',
                    revogado: 'Revogado',
                    reativado: 'Reativado',
                    transferido: 'Transferido',
                    senha_alterada: 'Senha Alterada',
                  };
                  return (
                    <div key={h.id} className="flex items-start gap-3 p-2 rounded-md border bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{h.colaboradorNome}</span>
                          <Badge className={`text-[10px] ${acaoColors[h.acao] || 'bg-gray-100 text-gray-700'}`}>
                            {acaoLabels[h.acao] || h.acao}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.detalhes}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {h.createdAt ? new Date(h.createdAt).toLocaleString('pt-BR') : ''}
                          {h.realizadoPorNome ? ` — por ${h.realizadoPorNome}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
