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
import { toast } from 'sonner';
import {
  BarChart3, Users, DollarSign, Building2, TrendingUp, ArrowLeft,
  ChevronDown, ChevronRight, User, GitBranch, Plus, Layers, Trash2,
  Loader2, GraduationCap, Download, FileText, FileSpreadsheet, Calculator,
  Briefcase, ArrowUpCircle, Edit2, Eye, X
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
      .map(n => ({ nivel: n, colabs: map.get(n)!.sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || '')) }))
      .concat(map.has('nao_definido') ? [{ nivel: 'nao_definido', colabs: map.get('nao_definido')! }] : []);
  }, [colaboradores]);

  const custoTotal = colaboradores.reduce((sum, c) => sum + parseSalario(c.salarioBase), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <button onClick={() => setExpanded(p => !p)} className="flex items-center justify-between w-full text-left">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            {nome.replace(/^[A-Z]+\s*[–-]\s*/, '')}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}</Badge>
            <span className="text-sm font-medium text-muted-foreground">{formatCurrency(custoTotal)}/mês</span>
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
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
          {/* Summary */}
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

          {/* Detailed Table */}
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

          {/* Breakdown by nivel */}
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

  // Niveis CRUD
  const [showNivelDialog, setShowNivelDialog] = useState(false);
  const [nivelForm, setNivelForm] = useState({
    cargoId: 0, setorId: 0, nivel: 1, titulo: '', descricao: '',
    salarioMinimo: '', salarioMaximo: '', grauInstrucaoMinimo: 'medio_completo',
    requisitosFormacao: '',
  });
  const createNivel = trpc.niveisCargo.create.useMutation({
    onSuccess: () => { utils.niveisCargo.list.invalidate(); toast.success('Nível criado!'); setShowNivelDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteNivel = trpc.niveisCargo.delete.useMutation({
    onSuccess: () => { utils.niveisCargo.list.invalidate(); toast.success('Nível removido'); },
  });

  const colabList = ((colaboradores.data || []) as any[]).filter(c => c.ativo !== false);
  const setoresList = useMemo(() => {
    const raw = setores.data;
    return ((raw as any)?.setores || raw || []) as any[];
  }, [setores.data]);
  const niveis = niveisQuery.data || [];

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

  // Niveis grouped
  const niveisGrouped = useMemo(() => {
    return (niveis || []).reduce((acc: Record<string, typeof niveis>, n) => {
      const key = n.cargo || 'Sem Cargo';
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(n);
      return acc;
    }, {} as Record<string, typeof niveis>);
  }, [niveis]);

  function handleSaveNivel() {
    if (!nivelForm.titulo || !nivelForm.salarioMinimo) {
      toast.error('Preencha os campos obrigatórios'); return;
    }
    const setor = setoresList.find((s: any) => s.id === nivelForm.setorId);
    createNivel.mutate({
      setorId: nivelForm.setorId,
      setorNome: setor?.nome || setor?.sigla || '',
      cargo: nivelForm.titulo,
      nivel: nivelForm.nivel,
      descricao: nivelForm.descricao || undefined,
      salarioMinimo: nivelForm.salarioMinimo || undefined,
      salarioMaximo: nivelForm.salarioMaximo || undefined,
      requisitosGrauInstrucao: nivelForm.grauInstrucaoMinimo || undefined,
      requisitosExperiencia: nivelForm.requisitosFormacao || undefined,
    });
  }

  // Cargos únicos (from colaboradores)
  const cargosUnicos = useMemo(() => {
    const map = new Map<string, { cargo: string; count: number; salarios: number[]; setores: Set<string> }>();
    colabList.forEach(c => {
      const cargo = c.cargo || 'Sem Cargo';
      if (!map.has(cargo)) map.set(cargo, { cargo, count: 0, salarios: [], setores: new Set() });
      const entry = map.get(cargo)!;
      entry.count++;
      entry.salarios.push(parseSalario(c.salarioBase));
      const setor = setoresList.find(s => s.id === c.setorId);
      if (setor) entry.setores.add(setor.nome || setor.sigla || '');
    });
    return Array.from(map.values())
      .map(e => ({
        ...e,
        media: e.salarios.length > 0 ? e.salarios.reduce((a, b) => a + b, 0) / e.salarios.length : 0,
        min: e.salarios.length > 0 ? Math.min(...e.salarios) : 0,
        max: e.salarios.length > 0 ? Math.max(...e.salarios) : 0,
        setoresArr: Array.from(e.setores),
      }))
      .sort((a, b) => b.count - a.count);
  }, [colabList, setoresList]);

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
              <div><p className="text-2xl font-bold">{cargosUnicos.length}</p><p className="text-xs text-muted-foreground">Cargos</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cadastro" className="gap-2"><Briefcase className="w-4 h-4" /> Cadastro</TabsTrigger>
          <TabsTrigger value="organograma" className="gap-2"><GitBranch className="w-4 h-4" /> Organograma</TabsTrigger>
          <TabsTrigger value="analise" className="gap-2"><BarChart3 className="w-4 h-4" /> Análise Salarial</TabsTrigger>
          <TabsTrigger value="niveis" className="gap-2"><Layers className="w-4 h-4" /> Níveis e Funções</TabsTrigger>
        </TabsList>

        {/* ===== ABA CADASTRO ===== */}
        <TabsContent value="cadastro" className="space-y-4 mt-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Visão consolidada dos cargos existentes com base nos colaboradores cadastrados. Os cargos e funções são derivados automaticamente do cadastro de colaboradores.
              </p>
            </CardContent>
          </Card>

          {cargosUnicos.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cargo cadastrado</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Cargo</TableHead>
                        <TableHead className="text-center font-semibold">Qtd</TableHead>
                        <TableHead className="font-semibold">Setores</TableHead>
                        <TableHead className="text-right font-semibold">Menor Salário</TableHead>
                        <TableHead className="text-right font-semibold">Média</TableHead>
                        <TableHead className="text-right font-semibold">Maior Salário</TableHead>
                        <TableHead className="text-right font-semibold">Custo Total/mês</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cargosUnicos.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.cargo}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{c.count}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {c.setoresArr.slice(0, 3).map((s, j) => (
                                <Badge key={j} variant="outline" className="text-[10px]">{s.replace(/^[A-Z]+\s*[–-]\s*/, '')}</Badge>
                              ))}
                              {c.setoresArr.length > 3 && <Badge variant="outline" className="text-[10px]">+{c.setoresArr.length - 3}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(c.min)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.media)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.max)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(c.salarios.reduce((a, b) => a + b, 0))}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-center">{totalColaboradores}</TableCell>
                        <TableCell />
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">{formatCurrency(mediaSalarial)}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">{formatCurrency(custoTotalMensal)}</TableCell>
                      </TableRow>
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
              <p className="text-sm text-muted-foreground">
                O organograma é gerado automaticamente a partir dos colaboradores cadastrados, agrupados por setor e organizados pela hierarquia definida no nível hierárquico de cada colaborador.
              </p>
            </CardContent>
          </Card>
          {porSetor.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum colaborador cadastrado para gerar o organograma</CardContent></Card>
          )}
          {porSetor.map((s, idx) => (
            <SetorOrganograma key={idx} nome={s.nome} colaboradores={s.colaboradores} />
          ))}
        </TabsContent>

        {/* ===== ABA ANÁLISE SALARIAL ===== */}
        <TabsContent value="analise" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custo por Setor */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Custo Salarial por Setor</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {porSetor.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm items-center">
                      <span className="font-medium truncate max-w-[200px]">{s.nome.replace(/^[A-Z]+\s*[–-]\s*/, '')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{s.colaboradores.length} col. — {formatCurrency(s.custoTotal)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => setMemoriaSetor({ nome: s.nome, colaboradores: s.colaboradores })}
                          title="Ver memória de cálculo"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(s.custoTotal / maxBarSetor) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Custo por Nível */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Custo Salarial por Nível</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {porNivel.map((n, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{n.label} ({n.count})</span>
                      <span className="text-muted-foreground">{formatCurrency(n.custoTotal)}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(n.custoTotal / maxBarNivel) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Detalhamento por Nível Hierárquico</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Menor Salário</TableHead>
                    <TableHead className="text-right">Média</TableHead>
                    <TableHead className="text-right">Maior Salário</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porNivel.map((n, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{n.label}</TableCell>
                      <TableCell className="text-right">{n.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(n.min)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(n.media)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(n.max)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(n.custoTotal)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totalColaboradores}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">{formatCurrency(mediaSalarial)}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">{formatCurrency(custoTotalMensal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Colaboradores por Setor - with Memória de Cálculo */}
          {porSetor.map((s, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{s.nome.replace(/^[A-Z]+\s*[–-]\s*/, '')} — {s.colaboradores.length} colaborador(es)</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setMemoriaSetor({ nome: s.nome, colaboradores: s.colaboradores })}
                >
                  <Calculator className="w-4 h-4" /> Memória de Cálculo
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead className="text-right">Salário Base</TableHead>
                      <TableHead>Contrato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.colaboradores.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nomeCompleto}</TableCell>
                        <TableCell>{c.cargo}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{NIVEL_LABELS[c.nivelHierarquico] || 'N/D'}</Badge></TableCell>
                        <TableCell className="text-right">{formatCurrency(c.salarioNum)}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{c.tipoContrato?.toUpperCase() || 'CLT'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ===== ABA NÍVEIS E FUNÇÕES ===== */}
        <TabsContent value="niveis" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Definição de níveis por cargo/setor com requisitos de formação e faixas salariais</p>
            <Button onClick={() => {
              setNivelForm({ cargoId: 0, setorId: 0, nivel: 1, titulo: '', descricao: '', salarioMinimo: '', salarioMaximo: '', grauInstrucaoMinimo: 'medio_completo', requisitosFormacao: '' });
              setShowNivelDialog(true);
            }}>
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
                    <p className="text-2xl font-bold text-blue-700">{Object.keys(niveisGrouped).length}</p>
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
          {niveisQuery.isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : !niveis?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum nível de cargo cadastrado</CardContent></Card>
          ) : (
            Object.entries(niveisGrouped).map(([cargoNome, items]) => (
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
                            <td className="px-4 py-2 text-muted-foreground">{setoresList.find(s => s.id === n.setorId)?.nome || `Setor ${n.setorId}`}</td>
                            <td className="px-4 py-2 text-center">
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200" variant="outline">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {GRAU_LABELS[n.grauInstrucaoMinimo || ''] || n.grauInstrucaoMinimo || '-'}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span className="text-muted-foreground">{formatCurrency(Number(n.salarioMinimo || 0))}</span>
                              {n.salarioMaximo && <span className="text-muted-foreground"> — {formatCurrency(Number(n.salarioMaximo || 0))}</span>}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { if (confirm('Remover?')) deleteNivel.mutate({ id: n.id }); }}>
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

      {/* Nivel Dialog */}
      <Dialog open={showNivelDialog} onOpenChange={setShowNivelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Novo Nível de Cargo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cargo *</Label>
                <Input value={nivelForm.titulo} onChange={e => setNivelForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Analista Fiscal" />
              </div>
              <div>
                <Label>Setor</Label>
                <Select value={nivelForm.setorId ? String(nivelForm.setorId) : ''} onValueChange={v => setNivelForm(f => ({ ...f, setorId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {setoresList.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome || s.sigla}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nível *</Label>
                <Input type="number" value={nivelForm.nivel} onChange={e => setNivelForm(f => ({ ...f, nivel: Number(e.target.value) }))} min={1} />
              </div>
              <div>
                <Label>Título do Nível</Label>
                <Input value={nivelForm.descricao} onChange={e => setNivelForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Júnior, Pleno, Sênior" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Salário Mínimo (R$) *</Label>
                <Input type="number" step="0.01" value={nivelForm.salarioMinimo} onChange={e => setNivelForm(f => ({ ...f, salarioMinimo: e.target.value }))} />
              </div>
              <div>
                <Label>Salário Máximo (R$)</Label>
                <Input type="number" step="0.01" value={nivelForm.salarioMaximo} onChange={e => setNivelForm(f => ({ ...f, salarioMaximo: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Grau de Instrução Mínimo</Label>
              <Select value={nivelForm.grauInstrucaoMinimo} onValueChange={v => setNivelForm(f => ({ ...f, grauInstrucaoMinimo: v }))}>
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
              <Textarea value={nivelForm.requisitosFormacao} onChange={e => setNivelForm(f => ({ ...f, requisitosFormacao: e.target.value }))} rows={2} placeholder="Ex: Graduação em Administração ou áreas afins" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNivelDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveNivel} disabled={createNivel.isPending}>
              {createNivel.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
