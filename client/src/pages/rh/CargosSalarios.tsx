import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Users, DollarSign, Building2, TrendingUp, ArrowLeft, ChevronDown, ChevronRight, User, GitBranch } from 'lucide-react';

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
      {/* Vertical connector from parent */}
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

  // Group by nivel hierarquico, sorted from top (diretor) to bottom (estagiario)
  const byNivel = useMemo(() => {
    const map = new Map<string, any[]>();
    colaboradores.forEach(c => {
      const nivel = c.nivelHierarquico || 'nao_definido';
      if (!map.has(nivel)) map.set(nivel, []);
      map.get(nivel)!.push(c);
    });
    // Sort by hierarchy order
    return NIVEL_ORDER
      .filter(n => map.has(n))
      .map(n => ({ nivel: n, colabs: map.get(n)!.sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || '')) }))
      .concat(
        map.has('nao_definido') ? [{ nivel: 'nao_definido', colabs: map.get('nao_definido')! }] : []
      );
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

// ===== MAIN PAGE =====
export default function CargosSalarios() {
  const colaboradores = trpc.colaboradores.list.useQuery();
  const setores = trpc.setores.list.useQuery();
  const [activeView, setActiveView] = useState<'analytics' | 'organograma'>('analytics');

  const colabList = ((colaboradores.data || []) as any[]).filter(c => c.ativo !== false);
  const setoresList = (setores.data || []) as any[];

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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Custo Salarial</h1>
            <p className="text-muted-foreground">Visão analítica da estrutura de custo com pessoal</p>
          </div>
        </div>
        {/* View toggle */}
        <div className="flex gap-2 ml-12">
          <Button
            variant={activeView === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('analytics')}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" /> Análise Salarial
          </Button>
          <Button
            variant={activeView === 'organograma' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('organograma')}
            className="gap-2"
          >
            <GitBranch className="w-4 h-4" /> Organograma
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold">{totalColaboradores}</p><p className="text-xs text-muted-foreground">Colaboradores Ativos</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{formatCurrency(custoTotalMensal)}</p><p className="text-xs text-muted-foreground">Custo Mensal Total</p></div>
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
      </div>

      {activeView === 'analytics' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custo por Setor */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Custo Salarial por Setor</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {porSetor.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate max-w-[200px]">{s.nome.replace(/^[A-Z]+\s*[–-]\s*/, '')}</span>
                      <span className="text-muted-foreground">{s.colaboradores.length} col. — {formatCurrency(s.custoTotal)}</span>
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

          {/* Colaboradores por Setor */}
          {porSetor.map((s, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base">{s.nome.replace(/^[A-Z]+\s*[–-]\s*/, '')} — {s.colaboradores.length} colaborador(es)</CardTitle>
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
        </>
      )}

      {activeView === 'organograma' && (
        <div className="space-y-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                O organograma é gerado automaticamente a partir dos colaboradores cadastrados, agrupados por setor e organizados pela hierarquia definida no nível hierárquico de cada colaborador. Para alterar a posição de um colaborador, edite seu nível hierárquico no cadastro.
              </p>
            </CardContent>
          </Card>
          {porSetor.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum colaborador cadastrado para gerar o organograma</CardContent></Card>
          )}
          {porSetor.map((s, idx) => (
            <SetorOrganograma key={idx} nome={s.nome} colaboradores={s.colaboradores} />
          ))}
        </div>
      )}
    </div>
  );
}
