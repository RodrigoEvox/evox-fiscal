import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import {
  DollarSign, ClipboardList, CheckCircle, AlertTriangle,
  TrendingUp, Loader2, ArrowRight, ChevronRight, Calculator,
  UserPlus, FileEdit, ArrowLeftRight, RefreshCw, Undo2,
  PlusCircle, Clock, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FILAS = [
  { key: 'apuracao', label: 'Apuração', icon: Calculator, color: 'text-blue-600 bg-blue-50', borderColor: '#3B82F6', path: '/credito/fila-apuracao' },
  { key: 'onboarding', label: 'Onboarding', icon: UserPlus, color: 'text-purple-600 bg-purple-50', borderColor: '#8B5CF6', path: '/credito/fila-onboarding' },
  { key: 'retificacao', label: 'Retificação', icon: FileEdit, color: 'text-indigo-600 bg-indigo-50', borderColor: '#6366F1', path: '/credito/fila-retificacao' },
  { key: 'compensacao', label: 'Compensação', icon: ArrowLeftRight, color: 'text-emerald-600 bg-emerald-50', borderColor: '#10B981', path: '/credito/fila-compensacao' },
  { key: 'ressarcimento', label: 'Ressarcimento', icon: RefreshCw, color: 'text-teal-600 bg-teal-50', borderColor: '#14B8A6', path: '/credito/fila-ressarcimento' },
  { key: 'restituicao', label: 'Restituição', icon: Undo2, color: 'text-cyan-600 bg-cyan-50', borderColor: '#06B6D4', path: '/credito/fila-restituicao' },
];

export default function CreditoDashboard() {
  const [, navigate] = useLocation();
  // Auto-refresh every 15 seconds for real-time data
  const { data: taskStats, isLoading } = trpc.creditRecovery.credito.tasks.stats.useQuery(undefined, {
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const ts = (taskStats || {}) as Record<string, number>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Aggregate stats by fila from the flat object
  const filaStats = FILAS.map(f => {
    const aFazer = ts[`${f.key}_a_fazer`] || 0;
    const fazendo = ts[`${f.key}_fazendo`] || 0;
    const feito = ts[`${f.key}_feito`] || 0;
    const concluido = ts[`${f.key}_concluido`] || 0;
    const emAtraso = ts[`${f.key}_em_atraso`] || 0;
    const total = ts[`${f.key}_total`] || 0;
    return { ...f, aFazer, fazendo, feito, concluido, emAtraso, total };
  });

  const totalTarefas = ts.total || 0;
  const totalPendentes = (ts.a_fazer || 0) + (ts.fazendo || 0);
  const totalConcluidas = (ts.feito || 0) + (ts.concluido || 0);
  const totalEmAtraso = ts.em_atraso || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard — Recuperação de Créditos</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão consolidada das filas de trabalho do setor</p>
        </div>
        <Button onClick={() => navigate('/credito/nova-tarefa-credito')} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Tarefas</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{totalTarefas}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendentes</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{totalPendentes}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: '#10B981' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Concluídas</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{totalConcluidas}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: '#EF4444' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em Atraso</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{totalEmAtraso}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filas de Trabalho */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Filas de Trabalho
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filaStats.map(fila => {
            const Icon = fila.icon;
            return (
              <Card
                key={fila.key}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: fila.borderColor }}
                onClick={() => navigate(fila.path)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', fila.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{fila.label}</p>
                        <p className="text-xs text-muted-foreground">{fila.total} tarefa(s)</p>
                      </div>
                    </div>
                    {fila.emAtraso > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        {fila.emAtraso}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-amber-600">{fila.aFazer}</p>
                      <p className="text-[10px] text-muted-foreground">A Fazer</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{fila.fazendo}</p>
                      <p className="text-[10px] text-muted-foreground">Fazendo</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{fila.feito}</p>
                      <p className="text-[10px] text-muted-foreground">Feito</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{fila.concluido}</p>
                      <p className="text-[10px] text-muted-foreground">Concluído</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => navigate('/credito/nova-tarefa-credito')}>
              <PlusCircle className="w-4 h-4" />
              Criar Nova Tarefa
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => navigate('/credito/gestao-creditos')}>
              <DollarSign className="w-4 h-4" />
              Gestão de Créditos
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => navigate('/credito/fila-apuracao')}>
              <Calculator className="w-4 h-4" />
              Fila de Apuração
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => navigate('/credito/relatorios')}>
              <BarChart3 className="w-4 h-4" />
              Relatórios Gerenciais
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Gestão de Créditos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Acompanhe créditos apurados, validados, utilizados e disponíveis. Gerencie PerdComps e estratégias de monetização.
            </p>
            <Button variant="outline" className="w-full text-xs" onClick={() => navigate('/credito/gestao-creditos')}>
              Acessar Gestão de Créditos <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
