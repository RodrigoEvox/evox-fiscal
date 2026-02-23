import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, Clock, TrendingUp, TrendingDown, CheckCircle2, XCircle,
  Trash2, Filter, User, Loader2, ArrowUpCircle, ArrowDownCircle,
  BarChart3, AlertCircle, Settings, ArrowLeft} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function formatHoras(h: number | string) {
  const num = Number(h);
  const hrs = Math.floor(Math.abs(num));
  const mins = Math.round((Math.abs(num) - hrs) * 60);
  const sign = num < 0 ? '-' : '';
  return `${sign}${hrs}h${mins > 0 ? mins.toString().padStart(2, '0') + 'min' : ''}`;
}

const TIPO_LABELS: Record<string, string> = {
  extra: 'Hora Extra',
  compensacao: 'Compensação',
  ajuste_positivo: 'Ajuste (+)',
  ajuste_negativo: 'Ajuste (-)',
};

const TIPO_COLORS: Record<string, string> = {
  extra: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  compensacao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ajuste_positivo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ajuste_negativo: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TIPO_ICONS: Record<string, any> = {
  extra: ArrowUpCircle,
  compensacao: ArrowDownCircle,
  ajuste_positivo: TrendingUp,
  ajuste_negativo: TrendingDown,
};

export default function BancoHoras() {
  const [tab, setTab] = useState('registros');
  const [showCreate, setShowCreate] = useState(false);
  const [filtroColaborador, setFiltroColaborador] = useState('todos');
  const [formData, setFormData] = useState({
    colaboradorId: '',
    tipo: 'extra',
    data: new Date().toISOString().split('T')[0],
    horas: '',
    motivo: '',
  });

  const { data: registros, isLoading, refetch } = trpc.bancoHoras.list.useQuery(
    filtroColaborador !== 'todos' ? { colaboradorId: Number(filtroColaborador) } : undefined
  );
  const { data: saldos, refetch: refetchSaldos } = trpc.bancoHoras.saldos.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();

  const createMut = trpc.bancoHoras.create.useMutation({
    onSuccess: () => {
      toast.success('Registro de banco de horas criado');
      setShowCreate(false);
      resetForm();
      refetch();
      refetchSaldos();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.bancoHoras.update.useMutation({
    onSuccess: () => {
      toast.success('Registro atualizado');
      refetch();
      refetchSaldos();
    },
  });

  const deleteMut = trpc.bancoHoras.delete.useMutation({
    onSuccess: () => {
      toast.success('Registro excluído');
      refetch();
      refetchSaldos();
    },
  });

  function resetForm() {
    setFormData({
      colaboradorId: '',
      tipo: 'extra',
      data: new Date().toISOString().split('T')[0],
      horas: '',
      motivo: '',
    });
  }

  function handleCreate() {
    if (!formData.colaboradorId || !formData.horas) {
      toast.error('Colaborador e horas são obrigatórios');
      return;
    }
    const colab = (colaboradores || []).find((c: any) => String(c.id) === formData.colaboradorId);
    if (!colab) return;
    createMut.mutate({
      colaboradorId: colab.id,
      colaboradorNome: colab.nomeCompleto,
      tipo: formData.tipo as any,
      data: formData.data,
      horas: formData.horas,
      motivo: formData.motivo || undefined,
    });
  }

  // Stats
  const stats = useMemo(() => {
    const list = saldos || [];
    const totalExtras = list.reduce((acc: number, s: any) => acc + (s.extras || 0), 0);
    const totalCompensacoes = list.reduce((acc: number, s: any) => acc + (s.compensacoes || 0), 0);
    const saldoGeral = totalExtras - totalCompensacoes;
    const comSaldoPositivo = list.filter((s: any) => s.saldo > 0).length;
    const comSaldoNegativo = list.filter((s: any) => s.saldo < 0).length;
    return { totalExtras, totalCompensacoes, saldoGeral, comSaldoPositivo, comSaldoNegativo, totalColaboradores: list.length };
  }, [saldos]);

  const clearAllFilters = () => { setFiltroColaborador("todos"); };

  // Chart data
  const chartData = useMemo(() => {
    if (!saldos || !saldos.length) return [];
    return (saldos as any[])
      .sort((a: any, b: any) => b.saldo - a.saldo)
      .slice(0, 15)
      .map((s: any) => ({
        nome: s.colaboradorNome.split(' ').slice(0, 2).join(' '),
        extras: Number(s.extras.toFixed(1)),
        compensacoes: Number(s.compensacoes.toFixed(1)),
        saldo: Number(s.saldo.toFixed(1)),
      }));
  }, [saldos]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-7 h-7 text-primary" />
            Banco de Horas
          </h1>

              <p className="text-muted-foreground text-sm mt-1">
            Controle de horas extras e compensações dos colaboradores
          </p>

            </div>

          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Registro
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Saldo Geral</p>
                <p className={`text-2xl font-bold ${stats.saldoGeral >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatHoras(stats.saldoGeral)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Extras</p>
                <p className="text-2xl font-bold text-green-600">{formatHoras(stats.totalExtras)}</p>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Compensações</p>
                <p className="text-2xl font-bold text-blue-600">{formatHoras(stats.totalCompensacoes)}</p>
              </div>
              <ArrowDownCircle className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Colaboradores</p>
                <p className="text-2xl font-bold">{stats.totalColaboradores}</p>
              </div>
              <User className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="saldos">Saldos por Colaborador</TabsTrigger>
          <TabsTrigger value="grafico">Gráfico</TabsTrigger>
        </TabsList>

        {/* REGISTROS TAB */}
        <TabsContent value="registros" className="space-y-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filtroColaborador} onValueChange={setFiltroColaborador}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Colaboradores</SelectItem>
                {(colaboradores || []).map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-1" />Limpar Filtros</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : !registros?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum registro de banco de horas encontrado.</p>
                <Button className="mt-4" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Registro
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Colaborador</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-right p-3 font-medium">Horas</th>
                    <th className="text-left p-3 font-medium">Motivo</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(registros as any[]).map((r) => {
                    const Icon = TIPO_ICONS[r.tipo] || Clock;
                    const isPositivo = r.tipo === 'extra' || r.tipo === 'ajuste_positivo';
                    return (
                      <tr key={r.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">{formatDateBR(r.data)}</td>
                        <td className="p-3 font-medium">{r.colaboradorNome}</td>
                        <td className="p-3">
                          <Badge className={`${TIPO_COLORS[r.tipo] || ''}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {TIPO_LABELS[r.tipo] || r.tipo}
                          </Badge>
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${isPositivo ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositivo ? '+' : '-'}{formatHoras(Number(r.horas))}
                        </td>
                        <td className="p-3 text-muted-foreground truncate max-w-[200px]">{r.motivo || '-'}</td>
                        <td className="p-3 text-center">
                          {r.aprovado ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <AlertCircle className="w-3 h-3 mr-1" /> Pendente
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {!r.aprovado && (
                              <Button size="sm" variant="ghost" onClick={() => updateMut.mutate({ id: r.id, aprovado: true })} title="Aprovar">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (confirm('Excluir este registro?')) deleteMut.mutate({ id: r.id });
                            }} title="Excluir">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* SALDOS TAB */}
        <TabsContent value="saldos" className="space-y-4">
          {!saldos?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum saldo calculado ainda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Colaborador</th>
                    <th className="text-right p-3 font-medium">Horas Extras</th>
                    <th className="text-right p-3 font-medium">Compensações</th>
                    <th className="text-right p-3 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {(saldos as any[]).sort((a: any, b: any) => b.saldo - a.saldo).map((s: any) => (
                    <tr key={s.colaboradorId} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{s.colaboradorNome}</td>
                      <td className="p-3 text-right text-green-600 font-mono">+{formatHoras(s.extras)}</td>
                      <td className="p-3 text-right text-blue-600 font-mono">-{formatHoras(s.compensacoes)}</td>
                      <td className={`p-3 text-right font-mono font-bold ${s.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatHoras(s.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* GRÁFICO TAB */}
        <TabsContent value="grafico" className="space-y-4">
          {chartData.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Sem dados para exibir no gráfico.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Banco de Horas por Colaborador (Top 15)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="nome" width={120} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="extras" name="Extras" fill="#10B981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="compensacoes" name="Compensações" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Create */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Registro de Banco de Horas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={formData.colaboradorId} onValueChange={v => setFormData({ ...formData, colaboradorId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {(colaboradores || []).filter((c: any) => c.statusColaborador === 'ativo').map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={formData.tipo} onValueChange={v => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                <Input type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Horas * (formato decimal, ex: 2.5 = 2h30min)</Label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                value={formData.horas}
                onChange={e => setFormData({ ...formData, horas: e.target.value })}
                placeholder="Ex: 2.5"
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea
                value={formData.motivo}
                onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Motivo da hora extra ou compensação"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
