/*
 * Dashboard — Evox Fiscal
 * Design: Corporate Intelligence — Data-dense dashboard with metric cards and charts
 */

import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Target,
  DollarSign,
  ArrowRight,
  Flag,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
};

export default function Dashboard() {
  const { state, getDashboardStats } = useApp();
  const stats = getDashboardStats();

  const prioridadeData = [
    { name: 'Alta', value: state.clientes.filter(c => c.prioridade === 'alta').length, color: '#10B981' },
    { name: 'Média', value: state.clientes.filter(c => c.prioridade === 'media').length, color: '#F59E0B' },
    { name: 'Baixa', value: state.clientes.filter(c => c.prioridade === 'baixa').length, color: '#EF4444' },
  ];

  const classificacaoData = [
    { name: 'Pacificada', count: state.teses.filter(t => t.classificacao === 'pacificada' && t.ativa).length },
    { name: 'Judicial', count: state.teses.filter(t => t.classificacao === 'judicial' && t.ativa).length },
    { name: 'Administrativa', count: state.teses.filter(t => t.classificacao === 'administrativa' && t.ativa).length },
    { name: 'Controversa', count: state.teses.filter(t => t.classificacao === 'controversa' && t.ativa).length },
  ];

  const recentClientes = [...state.clientes]
    .sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral das oportunidades tributárias</p>
        </div>
        <Link href="/clientes">
          <Button variant="default" size="sm" className="gap-2 bg-[#0A2540] hover:bg-[#0A2540]/90">
            <Users className="w-4 h-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0 }}>
          <Card className="border-l-4 border-l-[#0A2540]">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Clientes</p>
                  <p className="text-3xl font-bold font-data mt-1">{stats.totalClientes}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#0A2540]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#0A2540]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioritários</p>
                  <p className="text-3xl font-bold font-data mt-1 text-emerald-600">{stats.clientesPrioritarios}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Com Red Flags</p>
                  <p className="text-3xl font-bold font-data mt-1 text-red-600">{stats.clientesComRedFlags}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teses Ativas</p>
                  <p className="text-3xl font-bold font-data mt-1">{stats.totalTeses}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classificação das Teses */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Classificação das Teses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={classificacaoData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0A2540', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    cursor={{ fill: 'rgba(10,37,64,0.05)' }}
                  />
                  <Bar dataKey="count" name="Quantidade" fill="#0A2540" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prioridade dos Clientes */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Prioridade dos Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={prioridadeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {prioridadeData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0A2540', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {prioridadeData.map(item => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                      <span className="text-sm font-bold font-data">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Clients + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Clients */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Clientes Recentes</CardTitle>
              <Link href="/clientes">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentClientes.map(cliente => (
                  <div key={cliente.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full ${
                        cliente.prioridade === 'alta' ? 'bg-emerald-500' :
                        cliente.prioridade === 'media' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{cliente.razaoSocial}</p>
                        <p className="text-xs text-muted-foreground font-data">{cliente.cnpj}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {cliente.redFlags.length > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <Flag className="w-3 h-3" />
                          {cliente.redFlags.length}
                        </Badge>
                      )}
                      <Badge variant={
                        cliente.prioridade === 'alta' ? 'default' :
                        cliente.prioridade === 'media' ? 'secondary' : 'outline'
                      } className={
                        cliente.prioridade === 'alta' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' :
                        cliente.prioridade === 'media' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
                        'bg-red-500/10 text-red-700 border-red-200'
                      }>
                        {cliente.prioridade === 'alta' ? 'Alta' : cliente.prioridade === 'media' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Indicadores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Teses Pacificadas</p>
                  <p className="text-lg font-bold font-data">{stats.tesesPacificadas}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Análises Pendentes</p>
                  <p className="text-lg font-bold font-data">{stats.analisesPendentes}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <TrendingUp className="w-5 h-5 text-[#0A2540]" />
                <div>
                  <p className="text-xs text-muted-foreground">Score Médio</p>
                  <p className="text-lg font-bold font-data">{stats.mediaScoreOportunidade}<span className="text-xs text-muted-foreground">/100</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Potencial Total</p>
                  <p className="text-sm font-bold font-data">
                    {stats.potencialRecuperacaoTotal > 0
                      ? `R$ ${(stats.potencialRecuperacaoTotal / 1000000).toFixed(1)}M`
                      : 'Executar análises'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
