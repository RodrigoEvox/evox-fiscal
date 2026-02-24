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
  Briefcase, ArrowUpCircle, Edit2, Eye, X, Search, Check, XCircle,
  Info, Shield, Receipt, UserCheck
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CurrencyInput } from '@/components/CurrencyInput';

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

const GRAU_FORMACAO_OPTIONS = [
  { value: 'sem_formacao', label: 'Sem Formação' },
  { value: 'fundamental_incompleto', label: 'Fundamental Incompleto' },
  { value: 'fundamental_completo', label: 'Fundamental Completo' },
  { value: 'medio_incompleto', label: 'Médio Incompleto' },
  { value: 'medio_completo', label: 'Médio Completo' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'superior_incompleto', label: 'Superior Incompleto' },
  { value: 'superior_completo', label: 'Superior Completo' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
];

const EMPTY_CARGO_FORM = {
  cargo: '', funcao: '', setorId: 0, salarioBase: '',
  grauInstrucaoMinimo: 'medio_completo',
  comissionado: 0, cargoConfianca: 0, requisitosFormacao: '',
  requisitos: '', competencias: '', nivel: 1, descricaoNivel: '',
};

// ===== HELPERS =====
function parseSalario(val: string | number | null | undefined): number {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  // If it's a raw decimal from the database (e.g. "8500.00"), parse directly
  if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str) || 0;
  // If it's BRL formatted (e.g. "R$ 8.500,00"), strip formatting
  const cleaned = str.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ===== ORGANOGRAMA COMPONENT (Lista) =====
function OrgNode({ nivel, colabs, isLast }: { nivel: string; colabs: any[]; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
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
function SetorOrganograma({ nome, colaboradores, custoTotal }: { nome: string; colaboradores: any[]; custoTotal: number }) {
  const [expanded, setExpanded] = useState(false);
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
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary">{formatCurrency(custoTotal)}</span>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
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

// ===== ENCARGOS CLT =====
// Percentuais padrão de encargos trabalhistas CLT sobre o salário bruto
const ENCARGOS_CLT_PADRAO = {
  inssPatronal: { label: 'INSS Patronal', pct: 20.0, desc: '20% sobre a remuneração bruta (art. 22, Lei 8.212/91)' },
  rat: { label: 'RAT/SAT', pct: 2.0, desc: 'Risco Ambiental do Trabalho — 1% a 3%, média 2%' },
  terceiros: { label: 'Sistema S / Terceiros', pct: 5.8, desc: 'SENAI, SESI, SEBRAE, INCRA, Salário-Educação etc.' },
  fgts: { label: 'FGTS', pct: 8.0, desc: '8% sobre a remuneração bruta (Lei 8.036/90)' },
  decimoTerceiro: { label: '13º Salário (provisão)', pct: 8.33, desc: '1/12 avos por mês trabalhado' },
  ferias: { label: 'Férias + 1/3 (provisão)', pct: 11.11, desc: '1/12 avos + 1/3 constitucional = 1/12 × 4/3' },
  multaFgtsProvisao: { label: 'Multa FGTS (provisão)', pct: 4.0, desc: 'Provisão de 40% sobre 8% FGTS + 13º + férias (estimativa)' },
};

type EncargoKey = keyof typeof ENCARGOS_CLT_PADRAO;

// ===== SIMULADOR DE REAJUSTE =====
function SimuladorReajuste({ colabList, setoresList, niveis, porSetor, custoTotalMensal }: {
  colabList: any[]; setoresList: any[]; niveis: any[]; porSetor: any[]; custoTotalMensal: number;
}) {
  const [modo, setModo] = useState<'global' | 'setor' | 'cargo' | 'colaborador'>('global');
  const [percentual, setPercentual] = useState('5');
  const [setorSelecionado, setSetorSelecionado] = useState('todos');
  const [cargoSelecionado, setCargoSelecionado] = useState('todos');
  const [colabSelecionado, setColabSelecionado] = useState('todos');
  const [colabSearch, setColabSearch] = useState('');
  const [reajustesCustom, setReajustesCustom] = useState<Record<string, string>>({});
  const [exportingPdf, setExportingPdf] = useState(false);
  const [incluirEncargos, setIncluirEncargos] = useState(true);
  const [showEncargosDetail, setShowEncargosDetail] = useState(false);
  const [encargosCustom, setEncargosCustom] = useState<Record<EncargoKey, number>>(
    Object.fromEntries(Object.entries(ENCARGOS_CLT_PADRAO).map(([k, v]) => [k, v.pct])) as Record<EncargoKey, number>
  );

  // Fetch CCT vigente for salary rules
  const cctVigente = trpc.cct.getVigente.useQuery(undefined, { retry: false });
  const cctSalarioRules = useMemo(() => {
    if (!cctVigente.data?.regrasSalarioJson) return null;
    try { return JSON.parse(cctVigente.data.regrasSalarioJson as string); } catch { return null; }
  }, [cctVigente.data]);

  const pct = parseFloat(percentual) || 0;
  const totalEncargoPct = incluirEncargos
    ? Object.values(encargosCustom).reduce((s, v) => s + v, 0)
    : 0;

  // Build simulation data
  const simulacao = useMemo(() => {
    type SimRow = {
      id: number; nome: string; cargo: string; setor: string; nivel: string;
      salarioAtual: number; salarioNovo: number; diferenca: number;
      encargosAtual: number; encargosNovo: number; custoTotalAtual: number; custoTotalNovo: number;
      adicionais: number; tipoContrato: string;
      liquidoAtual: number; liquidoNovo: number;
    };

    // INSS empregado — faixas progressivas 2025/2026
    function calcINSSEmpregado(bruto: number): number {
      const faixas = [
        { teto: 1518.00, aliq: 0.075 },
        { teto: 2793.88, aliq: 0.09 },
        { teto: 4190.83, aliq: 0.12 },
        { teto: 8157.41, aliq: 0.14 },
      ];
      let desconto = 0;
      let anterior = 0;
      for (const f of faixas) {
        if (bruto <= anterior) break;
        const base = Math.min(bruto, f.teto) - anterior;
        if (base > 0) desconto += base * f.aliq;
        anterior = f.teto;
      }
      return desconto;
    }

    // IRRF — faixas progressivas 2025/2026
    function calcIRRF(bruto: number, inss: number, dependentes: number = 0): number {
      const deducaoDep = dependentes * 189.59;
      const base = bruto - inss - deducaoDep;
      if (base <= 2259.20) return 0;
      const faixas = [
        { teto: 2826.65, aliq: 0.075, deduz: 169.44 },
        { teto: 3751.05, aliq: 0.15, deduz: 381.44 },
        { teto: 4664.68, aliq: 0.225, deduz: 662.77 },
        { teto: Infinity, aliq: 0.275, deduz: 896.00 },
      ];
      for (const f of faixas) {
        if (base <= f.teto) return Math.max(0, base * f.aliq - f.deduz);
      }
      return 0;
    }

    function calcLiquido(bruto: number, isCLT: boolean): number {
      if (!isCLT) return bruto; // PJ: sem descontos CLT
      const inss = calcINSSEmpregado(bruto);
      const irrf = calcIRRF(bruto, inss);
      return bruto - inss - irrf;
    }
    const result: SimRow[] = [];

    colabList.forEach(c => {
      const salarioAtual = parseSalario(c.salarioBase);
      if (salarioAtual <= 0) return;

      const setorNome = setoresList.find((s: any) => s.id === c.setorId)?.nome || 'Sem Setor';
      const cargoNome = c.cargo || 'Sem Cargo';
      const adicionais = parseSalario(c.adicionais);
      let aplicar = false;
      let pctAplicar = pct;

      if (modo === 'global') {
        aplicar = true;
      } else if (modo === 'setor') {
        if (setorSelecionado === 'todos') {
          aplicar = true;
        } else {
          aplicar = String(c.setorId) === setorSelecionado;
          if (reajustesCustom[String(c.setorId)]) {
            pctAplicar = parseFloat(reajustesCustom[String(c.setorId)]) || 0;
          }
        }
      } else if (modo === 'cargo') {
        if (cargoSelecionado === 'todos') {
          aplicar = true;
        } else {
          aplicar = cargoNome === cargoSelecionado;
          if (reajustesCustom[cargoNome]) {
            pctAplicar = parseFloat(reajustesCustom[cargoNome]) || 0;
          }
        }
      } else if (modo === 'colaborador') {
        if (colabSelecionado === 'todos') {
          aplicar = true;
        } else {
          aplicar = String(c.id) === colabSelecionado;
          if (reajustesCustom[String(c.id)]) {
            pctAplicar = parseFloat(reajustesCustom[String(c.id)]) || 0;
          }
        }
      }

      const salarioNovo = aplicar ? salarioAtual * (1 + pctAplicar / 100) : salarioAtual;
      // Encargos apply only to CLT contracts
      const isCLT = (c.tipoContrato || 'clt') === 'clt';
      const baseEncAtual = isCLT ? (salarioAtual + adicionais) : 0;
      const baseEncNovo = isCLT ? (salarioNovo + adicionais) : 0;
      const encargosAtual = baseEncAtual * (totalEncargoPct / 100);
      const encargosNovo = baseEncNovo * (totalEncargoPct / 100);

      result.push({
        id: c.id,
        nome: c.nomeCompleto || '',
        cargo: cargoNome,
        setor: setorNome.replace(/^[A-Z]+\s*[\u2013-]\s*/, ''),
        nivel: NIVEL_LABELS[c.nivelHierarquico] || c.nivelHierarquico || 'N/D',
        salarioAtual,
        salarioNovo,
        diferenca: salarioNovo - salarioAtual,
        adicionais,
        tipoContrato: c.tipoContrato || 'clt',
        encargosAtual,
        encargosNovo,
        custoTotalAtual: salarioAtual + adicionais + encargosAtual,
        custoTotalNovo: salarioNovo + adicionais + encargosNovo,
        liquidoAtual: calcLiquido(salarioAtual + adicionais, isCLT),
        liquidoNovo: calcLiquido(salarioNovo + adicionais, isCLT),
      });
    });

    return result.sort((a, b) => (b.custoTotalNovo - b.custoTotalAtual) - (a.custoTotalNovo - a.custoTotalAtual));
  }, [colabList, setoresList, modo, pct, setorSelecionado, cargoSelecionado, colabSelecionado, reajustesCustom, totalEncargoPct]);

  const custoAtualTotal = simulacao.reduce((s, r) => s + r.custoTotalAtual, 0);
  const custoNovoTotal = simulacao.reduce((s, r) => s + r.custoTotalNovo, 0);
  const salAtualTotal = simulacao.reduce((s, r) => s + r.salarioAtual, 0);
  const salNovoTotal = simulacao.reduce((s, r) => s + r.salarioNovo, 0);
  const encAtualTotal = simulacao.reduce((s, r) => s + r.encargosAtual, 0);
  const encNovoTotal = simulacao.reduce((s, r) => s + r.encargosNovo, 0);
  const impactoMensal = custoNovoTotal - custoAtualTotal;
  const impactoAnual = impactoMensal * 12;
  const afetados = simulacao.filter(r => r.diferenca > 0).length;

  // Unique cargos list
  const cargosUnicos = useMemo(() => {
    const set = new Set<string>();
    colabList.forEach(c => { if (c.cargo) set.add(c.cargo); });
    return Array.from(set).sort();
  }, [colabList]);

  // Filtered collaborators for search
  const colabsFiltrados = useMemo(() => {
    const term = colabSearch.toLowerCase();
    return colabList
      .filter(c => parseSalario(c.salarioBase) > 0)
      .filter(c => !term || (c.nomeCompleto || '').toLowerCase().includes(term) || (c.cargo || '').toLowerCase().includes(term))
      .sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''));
  }, [colabList, colabSearch]);

  // Summary by setor
  const resumoPorSetor = useMemo(() => {
    const map = new Map<string, { salAtual: number; salNovo: number; encAtual: number; encNovo: number; custoAtual: number; custoNovo: number; qtd: number }>(); 
    simulacao.forEach(r => {
      if (!map.has(r.setor)) map.set(r.setor, { salAtual: 0, salNovo: 0, encAtual: 0, encNovo: 0, custoAtual: 0, custoNovo: 0, qtd: 0 });
      const e = map.get(r.setor)!;
      e.salAtual += r.salarioAtual;
      e.salNovo += r.salarioNovo;
      e.encAtual += r.encargosAtual;
      e.encNovo += r.encargosNovo;
      e.custoAtual += r.custoTotalAtual;
      e.custoNovo += r.custoTotalNovo;
      e.qtd++;
    });
    return Array.from(map.entries()).map(([setor, d]) => ({ setor, ...d, diferenca: d.custoNovo - d.custoAtual })).sort((a, b) => b.diferenca - a.diferenca);
  }, [simulacao]);

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      const params = new URLSearchParams({
        modo,
        percentual: String(pct),
        custoAtual: String(custoAtualTotal),
        custoNovo: String(custoNovoTotal),
        impactoMensal: String(impactoMensal),
        impactoAnual: String(impactoAnual),
        afetados: String(afetados),
        incluirEncargos: String(incluirEncargos),
        totalEncargoPct: String(totalEncargoPct),
        dados: JSON.stringify(simulacao.slice(0, 200).map(r => ({
          ...r,
          encargosAtual: r.encargosAtual,
          encargosNovo: r.encargosNovo,
          custoTotalAtual: r.custoTotalAtual,
          custoTotalNovo: r.custoTotalNovo,
        }))),
      });
      const resp = await fetch(`/api/cargos-salarios/simulador-reajuste-pdf?${params}`);
      if (!resp.ok) throw new Error('Erro ao gerar PDF');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulacao-reajuste-${modo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exportado!');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao exportar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    const headers = incluirEncargos
      ? ['Nome', 'Cargo', 'Setor', 'Tipo', 'Sal. Atual', 'Sal. Novo', 'Líquido Atual', 'Líquido Novo', 'Dif. Sal.', 'Encargos Atual', 'Encargos Novo', 'Custo Total Atual', 'Custo Total Novo', 'Impacto Total']
      : ['Nome', 'Cargo', 'Setor', 'Tipo', 'Sal. Atual', 'Sal. Novo', 'Líquido Atual', 'Líquido Novo', 'Diferença'];
    const fmt = (v: number) => v.toFixed(2).replace('.', ',');
    const rows = simulacao.map(r => incluirEncargos ? [
      r.nome, r.cargo, r.setor, r.tipoContrato.toUpperCase(),
      fmt(r.salarioAtual), fmt(r.salarioNovo), fmt(r.liquidoAtual), fmt(r.liquidoNovo),
      fmt(r.diferenca), fmt(r.encargosAtual), fmt(r.encargosNovo),
      fmt(r.custoTotalAtual), fmt(r.custoTotalNovo),
      fmt(r.custoTotalNovo - r.custoTotalAtual),
    ] : [
      r.nome, r.cargo, r.setor, r.tipoContrato.toUpperCase(),
      fmt(r.salarioAtual), fmt(r.salarioNovo), fmt(r.liquidoAtual), fmt(r.liquidoNovo),
      fmt(r.diferenca),
    ]);
    rows.push(Array(headers.length).fill(''));
    const liqAtualTotal = simulacao.reduce((s, r) => s + r.liquidoAtual, 0);
    const liqNovoTotal = simulacao.reduce((s, r) => s + r.liquidoNovo, 0);
    if (incluirEncargos) {
      rows.push(['TOTAL', '', '', '', fmt(salAtualTotal), fmt(salNovoTotal), fmt(liqAtualTotal), fmt(liqNovoTotal), fmt(salNovoTotal - salAtualTotal), fmt(encAtualTotal), fmt(encNovoTotal), fmt(custoAtualTotal), fmt(custoNovoTotal), fmt(impactoMensal)]);
    } else {
      rows.push(['TOTAL', '', '', '', fmt(salAtualTotal), fmt(salNovoTotal), fmt(liqAtualTotal), fmt(liqNovoTotal), fmt(salNovoTotal - salAtualTotal)]);
    }
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacao-reajuste-${modo}${incluirEncargos ? '-com-encargos' : ''}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);
    toast.success('Excel/CSV exportado!');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Simule reajustes salariais por percentual, setor, cargo ou colaborador individual e visualize o impacto financeiro completo incluindo encargos trabalhistas CLT antes de aplicar.</p>
        </CardContent>
      </Card>

      {/* Controles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Parâmetros da Simulação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Modo de Reajuste</Label>
              <Select value={modo} onValueChange={(v: any) => { setModo(v); setReajustesCustom({}); setColabSelecionado('todos'); setColabSearch(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (todos)</SelectItem>
                  <SelectItem value="setor">Por Setor</SelectItem>
                  <SelectItem value="cargo">Por Cargo</SelectItem>
                  <SelectItem value="colaborador">Por Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Percentual de Reajuste (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={percentual}
                onChange={e => setPercentual(e.target.value)}
                placeholder="Ex: 5.0"
              />
            </div>

            {modo === 'setor' && (
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Setores</SelectItem>
                    {setoresList.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {modo === 'cargo' && (
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={cargoSelecionado} onValueChange={setCargoSelecionado}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Cargos</SelectItem>
                    {cargosUnicos.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {modo === 'colaborador' && (
              <div className="space-y-2">
                <Label>Colaborador</Label>
                <Select value={colabSelecionado} onValueChange={setColabSelecionado}>
                  <SelectTrigger><SelectValue placeholder="Selecione um colaborador" /></SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-2">
                      <Input
                        placeholder="Buscar por nome ou cargo..."
                        value={colabSearch}
                        onChange={e => setColabSearch(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <SelectItem value="todos">Todos os Colaboradores</SelectItem>
                    {colabsFiltrados.slice(0, 50).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nomeCompleto} — {c.cargo || 'Sem Cargo'}
                      </SelectItem>
                    ))}
                    {colabsFiltrados.length > 50 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground text-center">Mostrando 50 de {colabsFiltrados.length}. Refine a busca.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Encargos CLT */}
      <Card className="border-amber-200/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" /> Encargos Trabalhistas CLT
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Encargos calculados sobre a remuneração bruta (salário + adicionais) de cada colaborador CLT. PJ não tem encargos. Os percentuais podem ser ajustados conforme a CCT vigente.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="flex items-center gap-3">
              {cctSalarioRules && (
                <Badge variant="outline" className="text-[10px] text-green-700 border-green-300 gap-1">
                  <Check className="w-3 h-3" /> CCT Vigente Aplicada
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Incluir encargos</Label>
                <Switch checked={incluirEncargos} onCheckedChange={setIncluirEncargos} />
              </div>
              {incluirEncargos && (
                <Button variant="ghost" size="sm" onClick={() => setShowEncargosDetail(!showEncargosDetail)} className="gap-1 text-xs">
                  {showEncargosDetail ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  {showEncargosDetail ? 'Ocultar' : 'Detalhar'}
                </Button>
              )}
            </div>
          </div>
          {incluirEncargos && (
            <p className="text-xs text-muted-foreground mt-1">
              Total de encargos: <span className="font-semibold text-amber-700">{totalEncargoPct.toFixed(2)}%</span> sobre a remuneração bruta de cada colaborador CLT
            </p>
          )}
        </CardHeader>
        {incluirEncargos && showEncargosDetail && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.entries(ENCARGOS_CLT_PADRAO) as [EncargoKey, typeof ENCARGOS_CLT_PADRAO[EncargoKey]][]).map(([key, enc]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs font-medium truncate cursor-help">{enc.label}</p>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs max-w-xs">{enc.desc}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={encargosCustom[key]}
                    onChange={e => setEncargosCustom(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    className="w-20 h-7 text-xs text-right"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* KPIs do Impacto */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-blue-600 font-medium">Custo Total Atual</p>
            <p className="text-lg font-bold text-blue-800">{formatCurrency(custoAtualTotal)}</p>
            {incluirEncargos && <p className="text-[10px] text-blue-500">Sal: {formatCurrency(salAtualTotal)} + Enc: {formatCurrency(encAtualTotal)}</p>}
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-green-600 font-medium">Custo Total Projetado</p>
            <p className="text-lg font-bold text-green-800">{formatCurrency(custoNovoTotal)}</p>
            {incluirEncargos && <p className="text-[10px] text-green-500">Sal: {formatCurrency(salNovoTotal)} + Enc: {formatCurrency(encNovoTotal)}</p>}
          </CardContent>
        </Card>
        <Card className={impactoMensal > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}>
          <CardContent className="p-4 text-center">
            <p className={`text-xs ${impactoMensal > 0 ? 'text-red-600' : 'text-gray-600'} font-medium`}>Impacto Mensal</p>
            <p className={`text-lg font-bold ${impactoMensal > 0 ? 'text-red-800' : 'text-gray-800'}`}>+ {formatCurrency(impactoMensal)}</p>
          </CardContent>
        </Card>
        <Card className={impactoAnual > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'}>
          <CardContent className="p-4 text-center">
            <p className={`text-xs ${impactoAnual > 0 ? 'text-orange-600' : 'text-gray-600'} font-medium`}>Impacto Anual</p>
            <p className={`text-lg font-bold ${impactoAnual > 0 ? 'text-orange-800' : 'text-gray-800'}`}>+ {formatCurrency(impactoAnual)}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-purple-600 font-medium">Colaboradores Afetados</p>
            <p className="text-lg font-bold text-purple-800">{afetados} / {simulacao.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Setor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Impacto por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resumoPorSetor.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Setor</TableHead>
                    <TableHead className="text-center font-semibold">Qtd</TableHead>
                    <TableHead className="text-right font-semibold">Custo Atual</TableHead>
                    <TableHead className="text-right font-semibold">Custo Projetado</TableHead>
                    <TableHead className="text-right font-semibold">Diferença</TableHead>
                    <TableHead className="font-semibold">Impacto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumoPorSetor.map(r => (
                    <TableRow key={r.setor}>
                      <TableCell className="font-medium">{r.setor}</TableCell>
                      <TableCell className="text-center">{r.qtd}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(r.custoAtual)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(r.custoNovo)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">+ {formatCurrency(r.diferenca)}</TableCell>
                      <TableCell>
                        <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${impactoMensal > 0 ? (r.diferenca / impactoMensal) * 100 : 0}%` }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2 bg-muted/30">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-center">{simulacao.length}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(custoAtualTotal)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(custoNovoTotal)}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">+ {formatCurrency(impactoMensal)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhamento Individual */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Detalhamento Individual
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </Button>
              <Button size="sm" onClick={handleExportPDF} disabled={exportingPdf} className="gap-1">
                {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 sticky top-0">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Cargo</TableHead>
                  <TableHead className="font-semibold">Setor</TableHead>
                  <TableHead className="text-center font-semibold">Tipo</TableHead>
                  <TableHead className="text-right font-semibold">Sal. Atual</TableHead>
                  <TableHead className="text-right font-semibold">Sal. Novo</TableHead>
                  <TableHead className="text-right font-semibold">Líquido Atual</TableHead>
                  <TableHead className="text-right font-semibold">Líquido Novo</TableHead>
                  {incluirEncargos && <TableHead className="text-right font-semibold">Encargos</TableHead>}
                  <TableHead className="text-right font-semibold">{incluirEncargos ? 'Custo Total' : 'Diferença'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulacao.slice(0, 100).map((r, idx) => {
                  const impactoRow = r.custoTotalNovo - r.custoTotalAtual;
                  return (
                    <TableRow key={idx} className={impactoRow > 0 ? 'bg-red-50/30' : ''}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell>{r.cargo}</TableCell>
                      <TableCell>{r.setor}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[9px] ${r.tipoContrato === 'pj' ? 'text-purple-700 border-purple-300' : 'text-blue-700 border-blue-300'}`}>
                          {r.tipoContrato.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(r.salarioAtual)}</TableCell>
                      <TableCell className="text-right font-mono text-green-700">{formatCurrency(r.salarioNovo)}</TableCell>
                      <TableCell className="text-right font-mono text-slate-600">{formatCurrency(r.liquidoAtual)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">{formatCurrency(r.liquidoNovo)}</TableCell>
                      {incluirEncargos && (
                        <TableCell className="text-right font-mono text-amber-600">{formatCurrency(r.encargosNovo)}</TableCell>
                      )}
                      <TableCell className="text-right font-mono text-red-600">
                        {impactoRow > 0 ? `+ ${formatCurrency(impactoRow)}` : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {simulacao.length > 100 && (
            <p className="text-xs text-muted-foreground text-center mt-2">Exibindo 100 de {simulacao.length} colaboradores. Exporte para ver todos.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== CARGOS VAGOS =====
function CargosVagos({ colabList, setoresList, niveis }: {
  colabList: any[]; setoresList: any[]; niveis: any[];
}) {
  const [filterSetorVago, setFilterSetorVago] = useState('todos');

  // Compare registered cargos vs active employees
  const analiseVagas = useMemo(() => {
    const result: {
      cargo: string; funcao: string; setor: string; setorId: number;
      salarioBase: number; comissionado: boolean; cargoConfianca: boolean;
      totalCadastrado: number; totalPreenchido: number; vagasAbertas: number;
    }[] = [];

    // Group niveis by cargo+setor
    const cargoMap = new Map<string, any>();
    niveis.forEach(n => {
      const key = `${n.cargo}__${n.setorId}`;
      if (!cargoMap.has(key)) {
        const setor = setoresList.find(s => s.id === n.setorId);
        cargoMap.set(key, {
          cargo: n.cargo,
          funcao: n.funcao || '',
          setor: setor?.nome?.replace(/^[A-Z]+\s*[\u2013-]\s*/, '') || 'Sem Setor',
          setorId: n.setorId,
          salarioBase: parseSalario(n.salarioBase),
          comissionado: n.comissionado === 1,
          cargoConfianca: n.cargoConfianca === 1,
          totalCadastrado: 1,
        });
      } else {
        cargoMap.get(key)!.totalCadastrado++;
      }
    });

    // Count active employees per cargo+setor
    const colabCountMap = new Map<string, number>();
    colabList.forEach(c => {
      if (c.status === 'Desligado' || c.status === 'desligado') return;
      const key = `${c.cargo}__${c.setorId}`;
      colabCountMap.set(key, (colabCountMap.get(key) || 0) + 1);
    });

    cargoMap.forEach((data, key) => {
      const preenchido = colabCountMap.get(key) || 0;
      result.push({
        ...data,
        totalPreenchido: preenchido,
        vagasAbertas: Math.max(0, data.totalCadastrado - preenchido),
      });
    });

    // Also find employees with cargos NOT in the base
    const cargosRegistrados = new Set(niveis.map(n => `${n.cargo}__${n.setorId}`));
    const colabSemBase = new Map<string, { cargo: string; setor: string; setorId: number; count: number }>();
    colabList.forEach(c => {
      if (c.status === 'Desligado' || c.status === 'desligado') return;
      const key = `${c.cargo}__${c.setorId}`;
      if (!cargosRegistrados.has(key) && c.cargo) {
        if (!colabSemBase.has(key)) {
          const setor = setoresList.find(s => s.id === c.setorId);
          colabSemBase.set(key, {
            cargo: c.cargo,
            setor: setor?.nome?.replace(/^[A-Z]+\s*[\u2013-]\s*/, '') || 'Sem Setor',
            setorId: c.setorId,
            count: 0,
          });
        }
        colabSemBase.get(key)!.count++;
      }
    });

    return {
      vagas: result.sort((a, b) => b.vagasAbertas - a.vagasAbertas),
      semBase: Array.from(colabSemBase.values()).sort((a, b) => b.count - a.count),
    };
  }, [colabList, setoresList, niveis]);

  const vagasFiltradas = useMemo(() => {
    if (filterSetorVago === 'todos') return analiseVagas.vagas;
    return analiseVagas.vagas.filter(v => String(v.setorId) === filterSetorVago);
  }, [analiseVagas.vagas, filterSetorVago]);

  const totalVagas = vagasFiltradas.reduce((s, v) => s + v.totalCadastrado, 0);
  const totalPreenchidas = vagasFiltradas.reduce((s, v) => s + v.totalPreenchido, 0);
  const totalAbertas = vagasFiltradas.reduce((s, v) => s + v.vagasAbertas, 0);
  const taxaOcupacao = totalVagas > 0 ? ((totalPreenchidas / totalVagas) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Comparação entre cargos cadastrados na base e colaboradores ativos para identificar posições em aberto e cargos sem registro.</p>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-blue-600 font-medium">Total de Posições</p>
            <p className="text-2xl font-bold text-blue-800">{totalVagas}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-green-600 font-medium">Preenchidas</p>
            <p className="text-2xl font-bold text-green-800">{totalPreenchidas}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-red-600 font-medium">Vagas em Aberto</p>
            <p className="text-2xl font-bold text-red-800">{totalAbertas}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-purple-600 font-medium">Taxa de Ocupação</p>
            <p className="text-2xl font-bold text-purple-800">{taxaOcupacao}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Filtrar por Setor</Label>
          <Select value={filterSetorVago} onValueChange={setFilterSetorVago}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Setores</SelectItem>
              {setoresList.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Vagas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" /> Posições Cadastradas vs Colaboradores Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vagasFiltradas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum cargo cadastrado na base. Cadastre cargos na aba "Cadastro" primeiro.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Cargo</TableHead>
                    <TableHead className="font-semibold">Função</TableHead>
                    <TableHead className="font-semibold">Setor</TableHead>
                    <TableHead className="text-right font-semibold">Sal. Base</TableHead>
                    <TableHead className="text-center font-semibold">Cadastrado</TableHead>
                    <TableHead className="text-center font-semibold">Preenchido</TableHead>
                    <TableHead className="text-center font-semibold">Vagas</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vagasFiltradas.map((v, idx) => (
                    <TableRow key={idx} className={v.vagasAbertas > 0 ? 'bg-red-50/40' : ''}>
                      <TableCell className="font-medium">{v.cargo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.funcao || '\u2014'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{v.setor}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(v.salarioBase)}</TableCell>
                      <TableCell className="text-center">{v.totalCadastrado}</TableCell>
                      <TableCell className="text-center">{v.totalPreenchido}</TableCell>
                      <TableCell className="text-center">
                        {v.vagasAbertas > 0 ? (
                          <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">{v.vagasAbertas} vaga{v.vagasAbertas > 1 ? 's' : ''}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.vagasAbertas > 0 ? (
                          <Badge className="bg-red-100 text-red-700 text-[10px] gap-1"><XCircle className="w-3 h-3" /> Em Aberto</Badge>
                        ) : v.totalPreenchido > v.totalCadastrado ? (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1"><TrendingUp className="w-3 h-3" /> Excedente</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-[10px] gap-1"><Check className="w-3 h-3" /> Completo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cargos sem registro na base */}
      {analiseVagas.semBase.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <XCircle className="w-4 h-4" /> Cargos sem Registro na Base ({analiseVagas.semBase.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Estes cargos existem em colaboradores ativos mas não estão cadastrados na base de Cargos e Salários.</p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Cargo</TableHead>
                    <TableHead className="font-semibold">Setor</TableHead>
                    <TableHead className="text-center font-semibold">Colaboradores</TableHead>
                    <TableHead className="font-semibold">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analiseVagas.semBase.map((c, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{c.cargo}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{c.setor}</Badge></TableCell>
                      <TableCell className="text-center">{c.count}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">Cadastrar na base</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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

      {/* Tabs - 5 tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cadastro" className="gap-2"><Briefcase className="w-4 h-4" /> Cadastro</TabsTrigger>
          <TabsTrigger value="organograma" className="gap-2"><GitBranch className="w-4 h-4" /> Organograma</TabsTrigger>
          <TabsTrigger value="analise" className="gap-2"><BarChart3 className="w-4 h-4" /> Análise Salarial</TabsTrigger>
          <TabsTrigger value="simulador" className="gap-2"><Calculator className="w-4 h-4" /> Simulador</TabsTrigger>
          <TabsTrigger value="vagos" className="gap-2"><Users className="w-4 h-4" /> Cargos Vagos</TabsTrigger>
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
        <TabsContent value="organograma" className="space-y-6 mt-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Organograma por setor em formato lista. Clique em um setor para expandir e ver os colaboradores agrupados por nível hierárquico. Os dados são atualizados automaticamente ao cadastrar ou desligar colaboradores.</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{porSetor.length}</span>
                    <span className="text-muted-foreground">setores</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{totalColaboradores}</span>
                    <span className="text-muted-foreground">colaboradores</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organograma em lista - setores recolhidos por padrão */}
          {porSetor.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum colaborador cadastrado</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {porSetor.map((s, idx) => (
                <SetorOrganograma key={idx} nome={s.nome} colaboradores={s.colaboradores} custoTotal={s.custoTotal} />
              ))}
            </div>
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

        {/* ===== ABA SIMULADOR DE REAJUSTE ===== */}
        <TabsContent value="simulador" className="space-y-6 mt-4">
          <SimuladorReajuste
            colabList={colabList}
            setoresList={setoresList}
            niveis={niveis}
            porSetor={porSetor}
            custoTotalMensal={custoTotalMensal}
          />
        </TabsContent>

        {/* ===== ABA CARGOS VAGOS ===== */}
        <TabsContent value="vagos" className="space-y-6 mt-4">
          <CargosVagos
            colabList={colabList}
            setoresList={setoresList}
            niveis={niveis}
          />
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
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {GRAU_FORMACAO_OPTIONS.find(o => o.value === viewingCargo.requisitosFormacao)?.label || viewingCargo.requisitosFormacao}
                  </p>
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

            {/* Row 3: Salário Base */}
            <div>
              <Label className="text-sm font-medium">Salário Base (R$) <span className="text-red-500">*</span></Label>
              <CurrencyInput
                value={cargoForm.salarioBase}
                onChange={val => setCargoForm(f => ({ ...f, salarioBase: val }))}
                placeholder="R$ 0,00"
                className="mt-1"
              />
            </div>

            {/* Row 4: Comissionado + Cargo de Confiança */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Label className="text-sm font-medium">Cargo Comissionado</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Este cargo recebe comissão?</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${!cargoForm.comissionado ? 'text-foreground' : 'text-muted-foreground'}`}>Não</span>
                    <Switch
                      checked={!!cargoForm.comissionado}
                      onCheckedChange={checked => setCargoForm(f => ({ ...f, comissionado: checked ? 1 : 0 }))}
                    />
                    <span className={`text-xs font-medium ${cargoForm.comissionado ? 'text-green-600' : 'text-muted-foreground'}`}>Sim</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Label className="text-sm font-medium">Cargo de Confiança</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Este é um cargo de confiança?</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${!cargoForm.cargoConfianca ? 'text-foreground' : 'text-muted-foreground'}`}>Não</span>
                    <Switch
                      checked={!!cargoForm.cargoConfianca}
                      onCheckedChange={checked => setCargoForm(f => ({ ...f, cargoConfianca: checked ? 1 : 0 }))}
                    />
                    <span className={`text-xs font-medium ${cargoForm.cargoConfianca ? 'text-amber-600' : 'text-muted-foreground'}`}>Sim</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Requisitos de Formação */}
            <div>
              <Label className="text-sm font-medium">Requisitos de Formação</Label>
              <Select value={cargoForm.requisitosFormacao || 'sem_formacao'} onValueChange={v => setCargoForm(f => ({ ...f, requisitosFormacao: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o nível de formação..." /></SelectTrigger>
                <SelectContent>
                  {GRAU_FORMACAO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
