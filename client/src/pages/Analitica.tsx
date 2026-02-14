import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Scale, Handshake, BarChart3, Calendar, Building2, CheckCircle2, Clock, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const prioridadeColors: Record<string, string> = {
  alta: 'bg-red-100 text-red-700', media: 'bg-yellow-100 text-yellow-700', baixa: 'bg-sky-100 text-sky-700',
};

export default function Analitica() {
  const now = new Date();
  const [periodoTipo, setPeriodoTipo] = useState<string>('mes');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  });

  const { data: clientes = [], isLoading: loadingC } = trpc.clientes.list.useQuery();
  const { data: relatorios = [], isLoading: loadingR } = trpc.relatorios.list.useQuery();
  const { data: teses = [] } = trpc.teses.list.useQuery();
  const { data: parceiros = [] } = trpc.parceiros.list.useQuery();
  const { data: filaItems = [] } = trpc.fila.list.useQuery();

  const isLoading = loadingC || loadingR;

  const handlePeriodoChange = (tipo: string) => {
    setPeriodoTipo(tipo);
    const today = new Date();
    let start: Date, end: Date;
    switch (tipo) {
      case 'mes': start = new Date(today.getFullYear(), today.getMonth(), 1); end = new Date(today.getFullYear(), today.getMonth() + 1, 0); break;
      case 'trimestre': { const q = Math.floor(today.getMonth() / 3); start = new Date(today.getFullYear(), q * 3, 1); end = new Date(today.getFullYear(), q * 3 + 3, 0); break; }
      case 'semestre': { const s = today.getMonth() < 6 ? 0 : 6; start = new Date(today.getFullYear(), s, 1); end = new Date(today.getFullYear(), s + 6, 0); break; }
      case 'ano': start = new Date(today.getFullYear(), 0, 1); end = new Date(today.getFullYear(), 11, 31); break;
      default: return;
    }
    setDataInicio(start.toISOString().split('T')[0]);
    setDataFim(end.toISOString().split('T')[0]);
  };

  const periodoStart = new Date(dataInicio).getTime();
  const periodoEnd = new Date(dataFim + 'T23:59:59').getTime();

  const filteredRelatorios = useMemo(() =>
    relatorios.filter((r: any) => { const d = new Date(r.createdAt).getTime(); return d >= periodoStart && d <= periodoEnd; }),
    [relatorios, periodoStart, periodoEnd]
  );

  const clientesNoPeriodo = useMemo(() =>
    clientes.filter((c: any) => { const d = new Date(c.createdAt).getTime(); return d >= periodoStart && d <= periodoEnd; }),
    [clientes, periodoStart, periodoEnd]
  );

  const stats = useMemo(() => {
    const totalClientes = clientes.length;
    const alta = clientes.filter((c: any) => c.prioridade === 'alta').length;
    const media = clientes.filter((c: any) => c.prioridade === 'media').length;
    const baixa = clientes.filter((c: any) => c.prioridade === 'baixa').length;
    const totalRelatorios = filteredRelatorios.length;
    const avgScore = totalRelatorios > 0 ? Math.round(filteredRelatorios.reduce((a: number, r: any) => a + (r.scoreOportunidade || 0), 0) / totalRelatorios) : 0;
    const emAnalise = filaItems.filter((i: any) => i.status === 'em_analise').length;
    const concluidos = filaItems.filter((i: any) => i.status === 'concluido').length;
    const aguardando = filaItems.filter((i: any) => i.status === 'aguardando').length;
    return { totalClientes, alta, media, baixa, totalRelatorios, avgScore, emAnalise, concluidos, aguardando, novasEmpresas: clientesNoPeriodo.length };
  }, [clientes, filteredRelatorios, filaItems, clientesNoPeriodo]);

  const byTese = useMemo(() => {
    const map = new Map<string, { nome: string; count: number }>();
    filteredRelatorios.forEach((r: any) => {
      (r.tesesAplicaveis || []).forEach((t: any) => {
        const nome = typeof t === 'string' ? t : t.nome || 'Desconhecida';
        const existing = map.get(nome);
        if (existing) existing.count++; else map.set(nome, { nome, count: 1 });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredRelatorios]);

  const byParceiro = useMemo(() => {
    const map = new Map<number, { nome: string; clientes: number; alta: number; media: number; baixa: number }>();
    clientes.forEach((c: any) => {
      if (c.parceiroId) {
        const p = parceiros.find((p: any) => p.id === c.parceiroId);
        const existing = map.get(c.parceiroId);
        if (existing) { existing.clientes++; if (c.prioridade === 'alta') existing.alta++; else if (c.prioridade === 'media') existing.media++; else existing.baixa++; }
        else { map.set(c.parceiroId, { nome: p?.nomeCompleto || `Parceiro #${c.parceiroId}`, clientes: 1, alta: c.prioridade === 'alta' ? 1 : 0, media: c.prioridade === 'media' ? 1 : 0, baixa: c.prioridade === 'baixa' ? 1 : 0 }); }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.clientes - a.clientes);
  }, [clientes, parceiros]);

  const byAnalista = useMemo(() => {
    const map = new Map<string, { nome: string; emAnalise: number; concluidos: number }>();
    filaItems.forEach((i: any) => {
      if (i.analistaId) {
        const nome = i.analistaNome || `Analista #${i.analistaId}`;
        const existing = map.get(nome);
        if (existing) { if (i.status === 'em_analise') existing.emAnalise++; if (i.status === 'concluido') existing.concluidos++; }
        else { map.set(nome, { nome, emAnalise: i.status === 'em_analise' ? 1 : 0, concluidos: i.status === 'concluido' ? 1 : 0 }); }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.concluidos - a.concluidos);
  }, [filaItems]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Visão Analítica</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise consolidada por período</p>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <Label className="text-xs mb-1 block">Período</Label>
              <Select value={periodoTipo} onValueChange={handlePeriodoChange}>
                <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Mês Atual</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                  <SelectItem value="ano">Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">De</Label>
              <Input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPeriodoTipo('custom'); }} className="h-9 text-sm w-40" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Até</Label>
              <Input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPeriodoTipo('custom'); }} className="h-9 text-sm w-40" />
            </div>
            <Badge variant="outline" className="h-9 px-3 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(dataInicio).toLocaleDateString('pt-BR')} — {new Date(dataFim).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0A2540]">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0A2540]/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-[#0A2540]" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Novas Empresas</p><p className="text-2xl font-bold">{stats.novasEmpresas}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-emerald-500" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Análises Realizadas</p><p className="text-2xl font-bold">{stats.totalRelatorios}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-blue-500" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Apurações Concluídas</p><p className="text-2xl font-bold">{stats.concluidos}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-500" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Na Fila</p><p className="text-2xl font-bold">{stats.aguardando}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="analistas">Por Analista</TabsTrigger>
          <TabsTrigger value="teses">Por Tese</TabsTrigger>
          <TabsTrigger value="parceiros">Por Parceiro</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Users className="w-4 h-4" /> Distribuição por Prioridade</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[{ label: 'Alta (Vermelho)', value: stats.alta, color: 'bg-red-500', total: stats.totalClientes },
                    { label: 'Média (Amarelo)', value: stats.media, color: 'bg-yellow-500', total: stats.totalClientes },
                    { label: 'Baixa (Azul)', value: stats.baixa, color: 'bg-sky-500', total: stats.totalClientes }].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1"><span>{item.label}</span><span className="font-mono">{item.value} ({item.total > 0 ? Math.round(item.value / item.total * 100) : 0}%)</span></div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.total > 0 ? (item.value / item.total * 100) : 0}%` }} /></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Score Médio</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold">{stats.avgScore}<span className="text-lg text-muted-foreground">/100</span></p>
                  <p className="text-sm text-muted-foreground mt-1">score médio de oportunidade</p>
                  <div className="flex justify-center gap-4 mt-4 text-sm">
                    <div><p className="font-bold text-blue-600">{stats.emAnalise}</p><p className="text-xs text-muted-foreground">em andamento</p></div>
                    <div><p className="font-bold text-green-600">{stats.concluidos}</p><p className="text-xs text-muted-foreground">concluídas</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Scale className="w-4 h-4" /> Teses Ativas</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold">{teses.filter((t: any) => t.ativo).length}</p>
                  <p className="text-sm text-muted-foreground mt-1">teses no repositório</p>
                  <div className="flex justify-center gap-4 mt-4 text-sm">
                    <div><p className="font-bold">{teses.filter((t: any) => t.classificacao === 'pacificada').length}</p><p className="text-xs text-muted-foreground">pacificadas</p></div>
                    <div><p className="font-bold">{teses.filter((t: any) => t.classificacao === 'judicial').length}</p><p className="text-xs text-muted-foreground">judiciais</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analistas" className="space-y-3 mt-4">
          <h3 className="text-sm font-semibold">Desempenho por Analista</h3>
          {byAnalista.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum analista com atividade no período.</CardContent></Card>
          ) : byAnalista.map((a, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{a.nome.charAt(0)}</div>
                  <div><p className="text-sm font-medium">{a.nome}</p><p className="text-xs text-muted-foreground">{a.concluidos} concluído(s) · {a.emAnalise} em análise</p></div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-green-600">{a.concluidos} concluídos</Badge>
                  {a.emAnalise > 0 && <Badge variant="outline" className="text-blue-600">{a.emAnalise} em análise</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="teses" className="space-y-3 mt-4">
          <h3 className="text-sm font-semibold">Teses mais aplicadas no período</h3>
          {byTese.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma tese aplicada no período.</CardContent></Card>
          ) : byTese.map((t, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                  <div><p className="text-sm font-medium">{t.nome}</p><p className="text-xs text-muted-foreground">{t.count} aplicação(ões)</p></div>
                </div>
                <div className="h-2 w-32 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${byTese[0]?.count ? (t.count / byTese[0].count * 100) : 0}%` }} /></div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="parceiros" className="space-y-3 mt-4">
          <h3 className="text-sm font-semibold">Clientes por Parceiro</h3>
          {byParceiro.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum parceiro com clientes.</CardContent></Card>
          ) : byParceiro.map((p, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Handshake className="w-5 h-5 text-muted-foreground" />
                  <div><p className="text-sm font-medium">{p.nome}</p><p className="text-xs text-muted-foreground">{p.clientes} cliente(s)</p></div>
                </div>
                <div className="flex gap-1">
                  {p.alta > 0 && <Badge className={prioridadeColors.alta}>{p.alta} alta</Badge>}
                  {p.media > 0 && <Badge className={prioridadeColors.media}>{p.media} média</Badge>}
                  {p.baixa > 0 && <Badge className={prioridadeColors.baixa}>{p.baixa} baixa</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
