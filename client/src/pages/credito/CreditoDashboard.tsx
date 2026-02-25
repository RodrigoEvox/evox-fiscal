import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import {
  Briefcase, DollarSign, FileBarChart, ClipboardList, CheckCircle, Clock, AlertTriangle,
  TrendingUp, Loader2, ArrowRight, ChevronRight, Inbox, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreditoDashboard() {
  const [, navigate] = useLocation();
  const { data: dashStats, isLoading } = trpc.creditRecovery.credito.dashboard.useQuery();
  const { data: caseStats } = trpc.creditRecovery.credito.cases.stats.useQuery();
  const { data: taskStats } = trpc.creditRecovery.credito.tasks.stats.useQuery();
  const { data: demandStats } = trpc.creditRecovery.suporte.demandRequests.stats.useQuery();

  const ds = (dashStats || {}) as any;
  const cs = (caseStats || {}) as any;
  const ts = (taskStats || {}) as any;
  const dms = (demandStats || {}) as any;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Crédito Tributário</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard — Recuperação de Créditos</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão consolidada de cases, créditos, tarefas e demandas</p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: '#3B82F6' }} onClick={() => navigate('/credito/cases')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cases Ativos</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{cs.total || ds.totalCases || 0}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: '#10B981' }} onClick={() => navigate('/credito/ledger')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Créditos Apurados</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{formatCurrency(ds.totalCreditosApurados || 0)}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: '#8B5CF6' }} onClick={() => navigate('/credito/rti')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">RTIs Gerados</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{ds.totalRtis || 0}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                <FileBarChart className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: '#F59E0B' }} onClick={() => navigate('/credito/filas')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarefas Pendentes</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{(ts.pendente || 0) + (ts.em_andamento || 0)}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Demandas Triagem', value: dms.triagem || 0, icon: Inbox, color: 'text-amber-600 bg-amber-50', path: '/suporte/inbox' },
          { label: 'Cases Análise', value: cs.analise_inicial || 0, icon: Briefcase, color: 'text-blue-600 bg-blue-50', path: '/credito/cases' },
          { label: 'Cases Apuração', value: cs.apuracao || 0, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50', path: '/credito/cases' },
          { label: 'Cases Compensação', value: cs.compensacao || 0, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', path: '/credito/cases' },
          { label: 'Êxitos', value: ds.totalExitos || 0, icon: CheckCircle, color: 'text-green-600 bg-green-50', path: '/credito/exitos' },
          { label: 'Tickets Abertos', value: ds.totalTickets || 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50', path: '/credito/tickets' },
        ].map(s => (
          <Card key={s.label} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate(s.path)}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', s.color)}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4" />Cases por Fase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { fase: 'Análise Inicial', key: 'analise_inicial', color: 'bg-blue-500' },
                { fase: 'Apuração', key: 'apuracao', color: 'bg-indigo-500' },
                { fase: 'Revisão', key: 'revisao', color: 'bg-purple-500' },
                { fase: 'Compensação', key: 'compensacao', color: 'bg-emerald-500' },
                { fase: 'Acompanhamento', key: 'acompanhamento', color: 'bg-teal-500' },
                { fase: 'Encerrado', key: 'encerrado', color: 'bg-gray-400' },
              ].map(f => {
                const count = cs[f.key] || 0;
                const total = cs.total || 1;
                const pct = Math.round((count / total) * 100) || 0;
                return (
                  <div key={f.key} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 shrink-0">{f.fase}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div className={cn('h-2.5 rounded-full transition-all', f.color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />Filas de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { fila: 'Pendentes', value: ts.pendente || 0, color: 'text-amber-600' },
                { fila: 'Em Andamento', value: ts.em_andamento || 0, color: 'text-blue-600' },
                { fila: 'Concluídas', value: ts.concluida || 0, color: 'text-green-600' },
                { fila: 'Total', value: ts.total || 0, color: 'text-gray-600' },
              ].map(f => (
                <div key={f.fila} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-muted-foreground">{f.fila}</span>
                  <span className={cn('text-lg font-bold', f.color)}>{f.value}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 text-xs" onClick={() => navigate('/credito/filas')}>
              Ver Filas <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
