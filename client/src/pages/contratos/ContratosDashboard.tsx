import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import {
  Loader2, FileText, PenTool, Eye, FileSignature, ShieldCheck,
  RefreshCw, XCircle, PlusCircle, ChevronRight, TrendingUp,
  DollarSign, Clock, AlertTriangle, BarChart3,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const FILA_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  elaboracao: { label: 'Elaboração', icon: PenTool, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  revisao: { label: 'Revisão', icon: Eye, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  assinatura: { label: 'Assinatura', icon: FileSignature, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  vigencia: { label: 'Vigência', icon: ShieldCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
  renovacao: { label: 'Renovação', icon: RefreshCw, color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200' },
  encerrado: { label: 'Encerrados', icon: XCircle, color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' },
};

const TIPO_LABELS: Record<string, string> = {
  prestacao_servicos: 'Prestação de Serviços',
  honorarios: 'Honorários',
  parceria: 'Parceria',
  nda: 'NDA',
  aditivo: 'Aditivo',
  distrato: 'Distrato',
  outro: 'Outro',
};

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#6b7280'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function ContratosDashboard() {
  const [, navigate] = useLocation();
  const { data: dashboard, isLoading } = trpc.contratos.dashboard.useQuery({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Nenhum dado disponível.</p>
      </div>
    );
  }

  const filaData = Object.entries(FILA_CONFIG).map(([key, cfg]) => ({
    name: cfg.label,
    value: Number((dashboard as any)[key] || 0),
    key,
  })).filter(d => d.value > 0);

  const tipoData = (dashboard.tipoBreakdown || []).map((t: any) => ({
    name: TIPO_LABELS[t.tipo] || t.tipo,
    contratos: t.count,
    valor: t.valor,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Contratos</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-orange-500" />
            Dashboard de Contratos
          </h1>
        </div>
        <Button onClick={() => navigate('/contratos/novo')} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.pendentes}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.concluido}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.vencido}</p>
                <p className="text-xs text-muted-foreground">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(dashboard.valorTotal)}</p>
                <p className="text-xs text-muted-foreground">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filas Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Filas de Contratos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(FILA_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const count = Number((dashboard as any)[key] || 0);
            return (
              <Card
                key={key}
                className={cn('cursor-pointer hover:shadow-md transition-all border', cfg.bgColor)}
                onClick={() => navigate(`/contratos/fila/${key}`)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={cn('w-6 h-6 mx-auto mb-2', cfg.color)} />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Distribution by Fila */}
        {filaData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distribuição por Fila</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={filaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {filaData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Contratos']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bar Chart - Distribution by Tipo */}
        {tipoData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contratos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tipoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="contratos" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Responsáveis */}
      {dashboard.responsavelBreakdown && dashboard.responsavelBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contratos por Responsável</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {dashboard.responsavelBreakdown.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">{r.responsavelNome || 'Não atribuído'}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{r.total} total</Badge>
                    <Badge className="text-xs bg-emerald-100 text-emerald-700">{r.concluido} concluído(s)</Badge>
                    {r.vencido > 0 && (
                      <Badge variant="destructive" className="text-xs">{r.vencido} vencido(s)</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
