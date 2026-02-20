import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Users, DollarSign, Building2, TrendingUp } from 'lucide-react';

const NIVEL_LABELS: Record<string, string> = {
  estagiario: 'Estagiário', auxiliar: 'Auxiliar', assistente: 'Assistente',
  analista_jr: 'Analista Jr', analista_pl: 'Analista Pleno', analista_sr: 'Analista Sênior',
  coordenador: 'Coordenador', supervisor: 'Supervisor', gerente: 'Gerente', diretor: 'Diretor',
};

const NIVEL_ORDER = ['estagiario', 'auxiliar', 'assistente', 'analista_jr', 'analista_pl', 'analista_sr', 'coordenador', 'supervisor', 'gerente', 'diretor'];

function parseSalario(val: string | number | null | undefined): number {
  if (!val) return 0;
  const str = String(val).replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(str) || 0;
}

function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CargosSalarios() {
  const colaboradores = trpc.colaboradores.list.useQuery();
  const setores = trpc.setores.list.useQuery();

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
      .sort((a, b) => NIVEL_ORDER.indexOf(a.nivel) - NIVEL_ORDER.indexOf(b.nivel));
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
        <h1 className="text-2xl font-bold">Cargos e Salários</h1>
        <p className="text-muted-foreground">Visão analítica da estrutura de colaboradores e custos salariais — Gente & Gestão</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
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

      <div className="grid grid-cols-2 gap-6">
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
    </div>
  );
}
