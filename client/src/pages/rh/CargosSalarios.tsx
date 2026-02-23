import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useMemo, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  BarChart3, Users, DollarSign, Building2, TrendingUp, ArrowLeft,
  ChevronDown, ChevronRight, User, GitBranch, Plus, Layers, Trash2,
  Loader2, GraduationCap, Download, FileText, FileSpreadsheet, Calculator,
  Briefcase, ArrowUpCircle, Edit2, Eye, X, Search, Check, XCircle
} from 'lucide-react';

// ===== CONSTANTS =====
const NIVEL_LABELS: Record<string, string> = {
  estagiario: 'Estagiário', auxiliar: 'Auxiliar', assistente: 'Assistente',
  analista_jr: 'Analista Jr', analista_pl: 'Analista Pleno', analista_sr: 'Analista Sênior',
  coordenador: 'Coordenador', supervisor: 'Supervisor', gerente: 'Gerente', diretor: 'Diretor',
};

const NIVEL_ORDER = ['diretor', 'gerente', 'supervisor', 'coordenador', 'analista_sr', 'analista_pl', 'analista_jr', 'assistente', 'auxiliar', 'estagiario'];
const NIVEL_ORDER_ASC = ['estagiario', 'auxiliar', 'assistente', 'analista_jr', 'analista_pl', 'analista_sr', 'coordenador', 'supervisor', 'gerente', 'diretor'];

const NIVEL_COLORS: Record<string, string> = {
  diretor: 'bg-red-100 text-red-800 border-red-300',
  gerente: 'bg-orange-100 text-orange-800 border-orange-300',
  supervisor: 'bg-amber-100 text-amber-800 border-amber-300',
  coordenador: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  analista_sr: 'bg-blue-100 text-blue-800 border-blue-300',
  analista_pl: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  analista_jr: 'bg-violet-100 text-violet-800 border-violet-300',
  assistente: 'bg-green-100 text-green-800 border-green-300',
  auxiliar: 'bg-teal-100 text-teal-800 border-teal-300',
  estagiario: 'bg-gray-100 text-gray-800 border-gray-300',
};

const GRAU_LABELS: Record<string, string> = {
  fundamental_incompleto: 'Fund. Incompleto', fundamental_completo: 'Fund. Completo',
  medio_incompleto: 'Médio Incompleto', medio_completo: 'Médio Completo',
  tecnico: 'Técnico', superior_incompleto: 'Superior Incompleto',
  superior_completo: 'Superior Completo', pos_graduacao: 'Pós-Graduação',
  mestrado: 'Mestrado', doutorado: 'Doutorado',
};

const EMPTY_CARGO_FORM = {
  cargo: '', funcao: '', setorId: 0, salarioBase: '',
  salarioMinimo: '', salarioMaximo: '', grauInstrucaoMinimo: 'medio_completo',
  comissionado: 0, cargoConfianca: 0, requisitosFormacao: '',
  requisitos: '', competencias: '', nivel: 1, descricaoNivel: '',
};

// ===== HELPERS =====
function parseSalario(val: string | number | null | undefined): number {
  if (!val) return 0;
  const str = String(val).replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(str) || 0;
}

function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ===== ORGANOGRAMA COMPONENT =====
function OrgNode({ nivel, colabs, isLast }: { nivel: string; colabs: any[]; isLast: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const color = NIVEL_COLORS[nivel] || 'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <div className="relative">
      <div className="flex items-start gap-0">
        <div className="flex flex-col items-center w-8 shrink-0">
          <div className="w-0.5 h-4 bg-border" />
          <div className="w-3 h-3 rounded-full border-2 border-primary bg-background shrink-0" />
          {!isLast && <div className="w-0.5 flex-1 bg-border" />}
        </div>
        <div className="flex-1 pb-3">
          <button
            onClick={() => setExpanded(p => !p)}
            className={`w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm ${color}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{NIVEL_LABELS[nivel] || nivel}</span>
                <Badge variant="secondary" className="text-[10px] bg-white/60">{colabs.length} colaborador{colabs.length !== 1 ? 'es' : ''}</Badge>
              </div>
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>
          {expanded && (
            <div className="mt-2 ml-4 space-y-1.5">
              {colabs.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-background border hover:bg-muted/50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{c.nomeCompleto}</span>
                    <span className="text-xs text-muted-foreground">{c.cargo}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{formatCurrency(parseSalario(c.salarioBase))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SetorOrganograma({ nome, colaboradores }: { nome: string; colaboradores: any[] }) {
  const [expanded, setExpanded] = useState(true);

  const byNivel = useMemo(() => {
    const map = new Map<string, any[]>();
    colaboradores.forEach(c => {
      const nivel = c.nivelHierarquico || 'nao_definido';
      if (!map.has(nivel)) map.set(nivel, []);
      map.get(nivel)!.push(c);
    });
    return NIVEL_ORDER
      .filter(n => map.has(n))
      .map(n => ({ nivel: n, colabs: map.get(n)! }))
      .concat(
        Array.from(map.entries())
          .filter(([k]) => !NIVEL_ORDER.includes(k))
          .map(([k, v]) => ({ nivel: k, colabs: v }))
      );
  }, [colaboradores]);

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(p => !p)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            {nome.replace(/^[A-Z]+\s*[–-]\s*/, '')}
            <Badge variant="secondary" className="text-[10px]">{colaboradores.length} colaboradores</Badge>
          </CardTitle>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-2">
          {byNivel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum colaborador com nível hierárquico definido</p>
          ) : (
            <div className="pl-2">
              {byNivel.map((group, idx) => (
                <OrgNode key={group.nivel} nivel={group.nivel} colabs={group.colabs} isLast={idx === byNivel.length - 1} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ===== MEMÓRIA DE CÁLCULO DIALOG =====
function MemoriaCalculoDialog({ open, onClose, setor, colaboradores }: {
  open: boolean; onClose: () => void; setor: string; colaboradores: any[];
}) {
  const [exporting, setExporting] = useState(false);

  const custoTotal = colaboradores.reduce((sum, c) => sum + parseSalario(c.salarioBase), 0);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ setor });
      const resp = await fetch(`/api/cargos-salarios/memoria-calculo-pdf?${params}`, { credentials: 'include' });
      if (!resp.ok) throw new Error('Erro ao gerar PDF');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memoria-calculo-${setor.replace(/\s/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exportado com sucesso!');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Nome', 'Cargo', 'Nível', 'Salário Base', 'Tipo Contrato'];
    const rows = colaboradores.map(c => [
      c.nomeCompleto || '',
      c.cargo || '',
      NIVEL_LABELS[c.nivelHierarquico] || c.nivelHierarquico || 'N/D',
      parseSalario(c.salarioBase).toFixed(2).replace('.', ','),
      (c.tipoContrato || 'CLT').toUpperCase(),
    ]);
    rows.push(['', '', '', '', '']);
    rows.push(['TOTAL', '', `${colaboradores.length} colaboradores`, custoTotal.toFixed(2).replace('.', ','), '']);
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoria-calculo-${setor.replace(/\s/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel/CSV exportado!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Memória de Cálculo — {setor.replace(/^[A-Z]+\s*[–-]\s*/, '')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-blue-600">Colaboradores</p>
                <p className="text-xl font-bold text-blue-800">{colaboradores.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-green-600">Custo Mensal</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(custoTotal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-purple-600">Custo Anual</p>
                <p className="text-xl font-bold text-purple-800">{formatCurrency(custoTotal * 12)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Cargo</TableHead>
                  <TableHead className="font-semibold">Nível</TableHead>
                  <TableHead className="font-semibold text-right">Salário Base</TableHead>
                  <TableHead className="font-semibold">Contrato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.sort((a, b) => parseSalario(b.salarioBase) - parseSalario(a.salarioBase)).map((c: any, idx: number) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{c.nomeCompleto}</TableCell>
                    <TableCell>{c.cargo || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {NIVEL_LABELS[c.nivelHierarquico] || c.nivelHierarquico || 'N/D'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(parseSalario(c.salarioBase))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{(c.tipoContrato || 'CLT').toUpperCase()}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold border-t-2 bg-muted/30">
                  <TableCell colSpan={4}>TOTAL</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(custoTotal)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Composição por Nível Hierárquico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {NIVEL_ORDER.map(nivel => {
                  const colabs = colaboradores.filter(c => (c.nivelHierarquico || 'nao_definido') === nivel);
                  if (colabs.length === 0) return null;
                  const custo = colabs.reduce((sum, c) => sum + parseSalario(c.salarioBase), 0);
                  const pct = custoTotal > 0 ? ((custo / custoTotal) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={nivel} className="flex items-center gap-3">
                      <span className="text-sm w-32 truncate">{NIVEL_LABELS[nivel] || nivel}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">{pct}%</span>
                      <span className="text-sm font-medium w-28 text-right">{formatCurrency(custo)}</span>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
          </Button>
          <Button onClick={handleExportPDF} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN PAGE =====
export default function CargosSalarios() {
  const colaboradores = trpc.colaboradores.list.useQuery();
  const setores = trpc.setores.list.useQuery();
  const niveisQuery = trpc.niveisCargo.list.useQuery();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState('cadastro');
  const [memoriaSetor, setMemoriaSetor] = useState<{ nome: string; colaboradores: any[] } | null>(null);
  const [searchCargo, setSearchCargo] = useState('');
  const [filterSetor, setFilterSetor] = useState('todos');

  // Cargo CRUD state
  const [showCargoDialog, setShowCargoDialog] = useState(false);
  const [editingCargoId, setEditingCargoId] = useState<number | null>(null);
  const [viewingCargo, setViewingCargo] = useState<any | null>(null);
  const [cargoForm, setCargoForm] = useState({ ...EMPTY_CARGO_FORM });

  const createCargo = trpc.niveisCargo.create.useMutation({
    onSuccess: () => { utils.niveisCargo.list.invalidate(); toast.success('Cargo cadastrado com sucesso!'); setShowCargoDialog(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateCargo = trpc.niveisCargo.update.useMutation({
    onSuccess: () => { utils.niveisCargo.list.invalidate(); toast.success('Cargo atualizado!'); setShowCargoDialog(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCargo = trpc.niveisCargo.delete.useMutation({
    onSuccess: () => { utils.niveisCargo.list.invalidate(); toast.success('Cargo removido'); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setCargoForm({ ...EMPTY_CARGO_FORM });
    setEditingCargoId(null);
  }

  function openNewCargo() {
    resetForm();
    setShowCargoDialog(true);
  }

  function openEditCargo(cargo: any) {
    setEditingCargoId(cargo.id);
    setCargoForm({
      cargo: cargo.cargo || '',
      funcao: cargo.funcao || '',
      setorId: cargo.setorId || 0,
      salarioBase: cargo.salarioBase ? String(cargo.salarioBase) : '',
      salarioMinimo: cargo.salarioMinimo ? String(cargo.salarioMinimo) : '',
      salarioMaximo: cargo.salarioMaximo ? String(cargo.salarioMaximo) : '',
      grauInstrucaoMinimo: cargo.grauInstrucaoMinimo || 'medio_completo',
      comissionado: cargo.comissionado || 0,
      cargoConfianca: cargo.cargoConfianca || 0,
      requisitosFormacao: cargo.requisitosFormacao || '',
      requisitos: cargo.requisitos || '',
      competencias: cargo.competencias || '',
      nivel: cargo.nivel || 1,
      descricaoNivel: cargo.descricaoNivel || '',
    });
    setShowCargoDialog(true);
  }

  function handleSaveCargo() {
    if (!cargoForm.cargo.trim()) {
      toast.error('O nome do cargo é obrigatório'); return;
    }
    if (!cargoForm.setorId) {
      toast.error('Selecione o setor'); return;
    }
    if (!cargoForm.salarioBase) {
      toast.error('Informe o salário base'); return;
    }

    if (editingCargoId) {
      updateCargo.mutate({
        id: editingCargoId,
        data: {
          cargo: cargoForm.cargo,
          funcao: cargoForm.funcao || null,
          setorId: cargoForm.setorId,
          salarioBase: cargoForm.salarioBase || null,
          salarioMinimo: cargoForm.salarioMinimo || null,
          salarioMaximo: cargoForm.salarioMaximo || null,
          grauInstrucaoMinimo: cargoForm.grauInstrucaoMinimo || null,
          comissionado: cargoForm.comissionado,
          cargoConfianca: cargoForm.cargoConfianca,
          requisitosFormacao: cargoForm.requisitosFormacao || null,
          requisitos: cargoForm.requisitos || null,
          competencias: cargoForm.competencias || null,
          nivel: cargoForm.nivel,
          descricaoNivel: cargoForm.descricaoNivel || null,
        },
      });
    } else {
      createCargo.mutate({
        cargo: cargoForm.cargo,
        funcao: cargoForm.funcao || undefined,
        setorId: cargoForm.setorId,
        salarioBase: cargoForm.salarioBase || undefined,
        salarioMinimo: cargoForm.salarioMinimo || undefined,
        salarioMaximo: cargoForm.salarioMaximo || undefined,
        grauInstrucaoMinimo: cargoForm.grauInstrucaoMinimo || undefined,
        comissionado: cargoForm.comissionado,
        cargoConfianca: cargoForm.cargoConfianca,
        requisitosFormacao: cargoForm.requisitosFormacao || undefined,
        requisitos: cargoForm.requisitos || undefined,
        competencias: cargoForm.competencias || undefined,
        nivel: cargoForm.nivel,
        descricaoNivel: cargoForm.descricaoNivel || undefined,
      });
    }
  }

  const colabList = ((colaboradores.data || []) as any[]).filter(c => c.ativo !== false);
  const setoresList = useMemo(() => {
    const raw = setores.data;
    return ((raw as any)?.setores || raw || []) as any[];
  }, [setores.data]);
  const niveis = (niveisQuery.data || []) as any[];

  // Filter cargos
  const filteredCargos = useMemo(() => {
    let list = [...niveis];
    if (searchCargo) {
      const term = searchCargo.toLowerCase();
      list = list.filter(c => 
        (c.cargo || '').toLowerCase().includes(term) ||
        (c.funcao || '').toLowerCase().includes(term)
      );
    }
    if (filterSetor !== 'todos') {
      list = list.filter(c => String(c.setorId) === filterSetor);
    }
    return list.sort((a, b) => (a.cargo || '').localeCompare(b.cargo || ''));
  }, [niveis, searchCargo, filterSetor]);

  // Analytics by setor
  const porSetor = useMemo(() => {
    const map = new Map<number, { nome: string; colaboradores: any[]; custoTotal: number }>();
    colabList.forEach(c => {
      const sid = c.setorId || 0;
      if (!map.has(sid)) {
        const setor = setoresList.find(s => s.id === sid);
        map.set(sid, { nome: setor?.nome || 'Sem Setor', colaboradores: [], custoTotal: 0 });
      }
      const entry = map.get(sid)!;
      const salario = parseSalario(c.salarioBase);
      entry.colaboradores.push({ ...c, salarioNum: salario });
      entry.custoTotal += salario;
    });
    return Array.from(map.values()).sort((a, b) => b.custoTotal - a.custoTotal);
  }, [colabList, setoresList]);

  // Analytics by nivel
  const porNivel = useMemo(() => {
    const map = new Map<string, { count: number; custoTotal: number; salarios: number[] }>();
    colabList.forEach(c => {
      const nivel = c.nivelHierarquico || 'nao_definido';
      if (!map.has(nivel)) map.set(nivel, { count: 0, custoTotal: 0, salarios: [] });
      const entry = map.get(nivel)!;
      const salario = parseSalario(c.salarioBase);
      entry.count++;
      entry.custoTotal += salario;
      entry.salarios.push(salario);
    });
    return Array.from(map.entries())
      .map(([nivel, data]) => ({
        nivel,
        label: NIVEL_LABELS[nivel] || 'Não Definido',
        ...data,
        media: data.salarios.length > 0 ? data.custoTotal / data.salarios.length : 0,
        min: data.salarios.length > 0 ? Math.min(...data.salarios) : 0,
        max: data.salarios.length > 0 ? Math.max(...data.salarios) : 0,
      }))
      .sort((a, b) => NIVEL_ORDER_ASC.indexOf(a.nivel) - NIVEL_ORDER_ASC.indexOf(b.nivel));
  }, [colabList]);

  // Totals
  const totalColaboradores = colabList.length;
  const custoTotalMensal = colabList.reduce((sum, c) => sum + parseSalario(c.salarioBase), 0);
  const mediaSalarial = totalColaboradores > 0 ? custoTotalMensal / totalColaboradores : 0;
  const maxBarSetor = porSetor.length > 0 ? Math.max(...porSetor.map(s => s.custoTotal)) : 1;
  const maxBarNivel = porNivel.length > 0 ? Math.max(...porNivel.map(n => n.custoTotal)) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/rh/administracao"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" /> Cargos e Salários
            </h1>
            <p className="text-muted-foreground">Estrutura de cargos e faixas salariais</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold">{totalColaboradores}</p><p className="text-xs text-muted-foreground">Colaboradores</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{formatCurrency(custoTotalMensal)}</p><p className="text-xs text-muted-foreground">Custo Mensal</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
              <div><p className="text-2xl font-bold">{formatCurrency(mediaSalarial)}</p><p className="text-xs text-muted-foreground">Média Salarial</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-orange-600" /></div>
              <div><p className="text-2xl font-bold">{porSetor.length}</p><p className="text-xs text-muted-foreground">Setores</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"><Layers className="w-5 h-5 text-teal-600" /></div>
              <div><p className="text-2xl font-bold">{niveis.length}</p><p className="text-xs text-muted-foreground">Cargos Cadastrados</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - 3 tabs only */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cadastro" className="gap-2"><Briefcase className="w-4 h-4" /> Cadastro</TabsTrigger>
          <TabsTrigger value="organograma" className="gap-2"><GitBranch className="w-4 h-4" /> Organograma</TabsTrigger>
          <TabsTrigger value="analise" className="gap-2"><BarChart3 className="w-4 h-4" /> Análise Salarial</TabsTrigger>
        </TabsList>

        {/* ===== ABA CADASTRO ===== */}
        <TabsContent value="cadastro" className="space-y-4 mt-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Cadastre a estrutura de cargos e salários da Evox Fiscal. Ao cadastrar um colaborador, o sistema buscará automaticamente as informações de cargo e salário desta base.
              </p>
            </CardContent>
          </Card>

          {/* Filters + Add button */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cargo ou função..."
                  value={searchCargo}
                  onChange={e => setSearchCargo(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterSetor} onValueChange={setFilterSetor}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Setores</SelectItem>
                  {setoresList.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nome || s.sigla}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openNewCargo} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Novo Cargo
            </Button>
          </div>

          {/* Cargos Table */}
          {niveisQuery.isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : filteredCargos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {niveis.length === 0 ? 'Nenhum cargo cadastrado. Clique em "Novo Cargo" para começar.' : 'Nenhum cargo encontrado com os filtros aplicados.'}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Cargo</TableHead>
                        <TableHead className="font-semibold">Função</TableHead>
                        <TableHead className="font-semibold">Setor</TableHead>
                        <TableHead className="font-semibold text-center">Grau Mín.</TableHead>
                        <TableHead className="font-semibold text-right">Salário Base</TableHead>
                        <TableHead className="font-semibold text-center">Comissionado</TableHead>
                        <TableHead className="font-semibold text-center">Confiança</TableHead>
                        <TableHead className="font-semibold text-center w-28">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCargos.map((c: any) => {
                        const setor = setoresList.find((s: any) => s.id === c.setorId);
                        return (
                          <TableRow key={c.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">{c.cargo}</TableCell>
                            <TableCell className="text-muted-foreground">{c.funcao || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {setor?.nome || setor?.sigla || `Setor ${c.setorId}`}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200" variant="outline">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {GRAU_LABELS[c.grauInstrucaoMinimo || ''] || c.grauInstrucaoMinimo || '—'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {c.salarioBase ? formatCurrency(Number(c.salarioBase)) : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {c.comissionado ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200" variant="outline"><Check className="w-3 h-3 mr-1" /> Sim</Badge>
                              ) : (
                                <Badge className="bg-gray-50 text-gray-500 border-gray-200" variant="outline"><XCircle className="w-3 h-3 mr-1" /> Não</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {c.cargoConfianca ? (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200" variant="outline"><Check className="w-3 h-3 mr-1" /> Sim</Badge>
                              ) : (
                                <Badge className="bg-gray-50 text-gray-500 border-gray-200" variant="outline"><XCircle className="w-3 h-3 mr-1" /> Não</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingCargo(c)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCargo(c)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => {
                                  if (confirm(`Remover o cargo "${c.cargo}"?`)) deleteCargo.mutate({ id: c.id });
                                }}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== ABA ORGANOGRAMA ===== */}
        <TabsContent value="organograma" className="space-y-4 mt-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Organograma hierárquico por setor, baseado nos colaboradores cadastrados e seus níveis hierárquicos.</p>
            </CardContent>
          </Card>
          {porSetor.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum colaborador cadastrado</CardContent></Card>
          ) : (
            porSetor.map((s, idx) => (
              <SetorOrganograma key={idx} nome={s.nome} colaboradores={s.colaboradores} />
            ))
          )}
        </TabsContent>

        {/* ===== ABA ANÁLISE SALARIAL ===== */}
        <TabsContent value="analise" className="space-y-6 mt-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Análise salarial por setor e nível hierárquico, com custo total e memória de cálculo detalhada.</p>
            </CardContent>
          </Card>

          {/* Por Setor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Custo Salarial por Setor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {porSetor.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              ) : (
                <div className="space-y-3">
                  {porSetor.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm w-40 truncate font-medium">{s.nome.replace(/^[A-Z]+\s*[–-]\s*/, '')}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-primary/50 rounded-full transition-all"
                          style={{ width: `${(s.custoTotal / maxBarSetor) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
                          {s.colaboradores.length} colab.
                        </span>
                      </div>
                      <button
                        onClick={() => setMemoriaSetor({ nome: s.nome, colaboradores: s.colaboradores })}
                        className="text-sm font-semibold text-primary hover:underline cursor-pointer w-32 text-right"
                        title="Clique para ver memória de cálculo"
                      >
                        {formatCurrency(s.custoTotal)}
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-2 border-t font-bold">
                    <span className="text-sm w-40">TOTAL</span>
                    <div className="flex-1" />
                    <span className="text-sm w-32 text-right">{formatCurrency(custoTotalMensal)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Por Nível */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-primary" /> Custo por Nível Hierárquico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {porNivel.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Nível</TableHead>
                        <TableHead className="text-center font-semibold">Qtd</TableHead>
                        <TableHead className="text-right font-semibold">Menor</TableHead>
                        <TableHead className="text-right font-semibold">Média</TableHead>
                        <TableHead className="text-right font-semibold">Maior</TableHead>
                        <TableHead className="text-right font-semibold">Custo Total</TableHead>
                        <TableHead className="font-semibold">Distribuição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {porNivel.map(n => (
                        <TableRow key={n.nivel}>
                          <TableCell className="font-medium">
                            <Badge className={`${NIVEL_COLORS[n.nivel] || 'bg-gray-100 text-gray-800'} text-[10px]`}>{n.label}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{n.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(n.min)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(n.media)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(n.max)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(n.custoTotal)}</TableCell>
                          <TableCell>
                            <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary/50 rounded-full" style={{ width: `${(n.custoTotal / maxBarNivel) * 100}%` }} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Memória de Cálculo Dialog */}
      {memoriaSetor && (
        <MemoriaCalculoDialog
          open={!!memoriaSetor}
          onClose={() => setMemoriaSetor(null)}
          setor={memoriaSetor.nome}
          colaboradores={memoriaSetor.colaboradores}
        />
      )}

      {/* View Cargo Dialog */}
      <Dialog open={!!viewingCargo} onOpenChange={() => setViewingCargo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Detalhes do Cargo
            </DialogTitle>
          </DialogHeader>
          {viewingCargo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cargo</p>
                  <p className="font-semibold">{viewingCargo.cargo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Função</p>
                  <p className="font-medium">{viewingCargo.funcao || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Setor</p>
                  <p className="font-medium">{setoresList.find((s: any) => s.id === viewingCargo.setorId)?.nome || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Grau de Instrução Mínimo</p>
                  <p className="font-medium">{GRAU_LABELS[viewingCargo.grauInstrucaoMinimo || ''] || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Salário Base</p>
                  <p className="font-semibold text-green-700">{viewingCargo.salarioBase ? formatCurrency(Number(viewingCargo.salarioBase)) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Faixa Salarial</p>
                  <p className="font-medium">
                    {viewingCargo.salarioMinimo ? formatCurrency(Number(viewingCargo.salarioMinimo)) : '—'}
                    {viewingCargo.salarioMaximo ? ` — ${formatCurrency(Number(viewingCargo.salarioMaximo))}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comissionado</p>
                  <Badge className={viewingCargo.comissionado ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'} variant="outline">
                    {viewingCargo.comissionado ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cargo de Confiança</p>
                  <Badge className={viewingCargo.cargoConfianca ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'} variant="outline">
                    {viewingCargo.cargoConfianca ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>
              {viewingCargo.requisitosFormacao && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Requisitos de Formação</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewingCargo.requisitosFormacao}</p>
                </div>
              )}
              {viewingCargo.competencias && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Competências</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewingCargo.competencias}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingCargo(null)}>Fechar</Button>
            <Button onClick={() => { openEditCargo(viewingCargo); setViewingCargo(null); }}>
              <Edit2 className="w-4 h-4 mr-2" /> Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Cargo Dialog */}
      <Dialog open={showCargoDialog} onOpenChange={(open) => { if (!open) { setShowCargoDialog(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              {editingCargoId ? 'Editar Cargo' : 'Novo Cargo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Row 1: Cargo + Função */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Nome do Cargo <span className="text-red-500">*</span></Label>
                <Input
                  value={cargoForm.cargo}
                  onChange={e => setCargoForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ex: Analista Fiscal"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Função</Label>
                <Input
                  value={cargoForm.funcao}
                  onChange={e => setCargoForm(f => ({ ...f, funcao: e.target.value }))}
                  placeholder="Ex: Análise de tributos"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Row 2: Setor + Grau Instrução */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Setor <span className="text-red-500">*</span></Label>
                <Select value={cargoForm.setorId ? String(cargoForm.setorId) : ''} onValueChange={v => setCargoForm(f => ({ ...f, setorId: Number(v) }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o setor..." /></SelectTrigger>
                  <SelectContent>
                    {setoresList.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome || s.sigla}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Grau de Instrução Mínimo</Label>
                <Select value={cargoForm.grauInstrucaoMinimo} onValueChange={v => setCargoForm(f => ({ ...f, grauInstrucaoMinimo: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GRAU_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Salário Base + Faixa */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Salário Base (R$) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cargoForm.salarioBase}
                  onChange={e => setCargoForm(f => ({ ...f, salarioBase: e.target.value }))}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Salário Mínimo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cargoForm.salarioMinimo}
                  onChange={e => setCargoForm(f => ({ ...f, salarioMinimo: e.target.value }))}
                  placeholder="Faixa mín."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Salário Máximo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cargoForm.salarioMaximo}
                  onChange={e => setCargoForm(f => ({ ...f, salarioMaximo: e.target.value }))}
                  placeholder="Faixa máx."
                  className="mt-1"
                />
              </div>
            </div>

            {/* Row 4: Comissionado + Cargo de Confiança */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Cargo Comissionado</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Este cargo recebe comissão?</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${!cargoForm.comissionado ? 'text-foreground' : 'text-muted-foreground'}`}>Não</span>
                      <Switch
                        checked={!!cargoForm.comissionado}
                        onCheckedChange={checked => setCargoForm(f => ({ ...f, comissionado: checked ? 1 : 0 }))}
                      />
                      <span className={`text-sm font-medium ${cargoForm.comissionado ? 'text-green-600' : 'text-muted-foreground'}`}>Sim</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Cargo de Confiança</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Este é um cargo de confiança?</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${!cargoForm.cargoConfianca ? 'text-foreground' : 'text-muted-foreground'}`}>Não</span>
                      <Switch
                        checked={!!cargoForm.cargoConfianca}
                        onCheckedChange={checked => setCargoForm(f => ({ ...f, cargoConfianca: checked ? 1 : 0 }))}
                      />
                      <span className={`text-sm font-medium ${cargoForm.cargoConfianca ? 'text-amber-600' : 'text-muted-foreground'}`}>Sim</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 5: Requisitos de Formação */}
            <div>
              <Label className="text-sm font-medium">Requisitos de Formação</Label>
              <Textarea
                value={cargoForm.requisitosFormacao}
                onChange={e => setCargoForm(f => ({ ...f, requisitosFormacao: e.target.value }))}
                rows={2}
                placeholder="Ex: Graduação em Administração, Contabilidade ou áreas afins"
                className="mt-1"
              />
            </div>

            {/* Row 6: Competências */}
            <div>
              <Label className="text-sm font-medium">Competências / Requisitos Adicionais</Label>
              <Textarea
                value={cargoForm.competencias}
                onChange={e => setCargoForm(f => ({ ...f, competencias: e.target.value }))}
                rows={2}
                placeholder="Ex: Excel avançado, conhecimento em legislação tributária"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowCargoDialog(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSaveCargo} disabled={createCargo.isPending || updateCargo.isPending}>
              {(createCargo.isPending || updateCargo.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCargoId ? 'Salvar Alterações' : 'Cadastrar Cargo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
