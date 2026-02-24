import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';
import {
  ArrowLeft, BookOpen, Package, BookCopy, CalendarCheck, AlertTriangle,
  TrendingUp, Users, Clock, BarChart3, Library, RotateCcw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function BibliotecaDashboard() {
  const dashboard = trpc.biblioteca.dashboard.useQuery();
  const livros = trpc.biblioteca.livros.list.useQuery();
  const exemplares = trpc.biblioteca.exemplares.list.useQuery();
  const emprestimos = trpc.biblioteca.emprestimos.list.useQuery();
  const reservas = trpc.biblioteca.reservas.list.useQuery();

  const stats = useMemo(() => {
    if (!dashboard.data) return null;
    return dashboard.data;
  }, [dashboard.data]);

  const categoriaData = useMemo(() => {
    if (!livros.data) return [];
    const map = new Map<string, number>();
    livros.data.forEach((l: any) => {
      const cat = l.categoria || 'Sem Categoria';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [livros.data]);

  const statusExemplarData = useMemo(() => {
    if (!exemplares.data) return [];
    const map = new Map<string, number>();
    exemplares.data.forEach((e: any) => {
      const s = e.status === 'disponivel' ? 'Disponível' : e.status === 'emprestado' ? 'Emprestado' : e.status === 'reservado' ? 'Reservado' : e.status === 'manutencao' ? 'Manutenção' : 'Extraviado';
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [exemplares.data]);

  const emprestimosMensais = useMemo(() => {
    if (!emprestimos.data) return [];
    const map = new Map<string, number>();
    emprestimos.data.forEach((e: any) => {
      const d = new Date(e.dataEmprestimo);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([name, total]) => ({
        name: name.split('-').reverse().join('/'),
        total,
      }));
  }, [emprestimos.data]);

  const atrasados = useMemo(() => {
    if (!emprestimos.data) return 0;
    const now = Date.now();
    return emprestimos.data.filter((e: any) => e.status === 'ativo' && new Date(e.dataPrevistaDevolucao).getTime() < now).length;
  }, [emprestimos.data]);

  const isLoading = dashboard.isLoading || livros.isLoading;

  return (
    <div className="min-h-screen bg-[#0A1929]">
      <div className="border-b border-white/10 bg-[#0A1929]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/rh/biblioteca">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Dashboard — Biblioteca Evox
            </h1>
            <p className="text-sm text-white/50">Visão geral e indicadores da biblioteca corporativa</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Títulos', value: stats?.totalLivros ?? '-', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Exemplares', value: stats?.totalExemplares ?? '-', icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Emprestados', value: stats?.totalEmprestimosAtivos ?? '-', icon: BookCopy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Reservas', value: stats?.totalReservasAtivas ?? '-', icon: CalendarCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Atrasados', value: atrasados, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Ocorrências', value: stats?.totalOcorrencias ?? '-', icon: RotateCcw, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{isLoading ? <Skeleton className="h-7 w-10" /> : kpi.value}</p>
                    <p className="text-xs text-white/50">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Empréstimos por Mês */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Empréstimos por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emprestimosMensais.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={emprestimosMensais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-white/30 text-sm">
                  Nenhum empréstimo registrado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status dos Exemplares */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Status dos Exemplares
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusExemplarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusExemplarData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusExemplarData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-white/30 text-sm">
                  Nenhum exemplar cadastrado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Library className="w-4 h-4 text-purple-400" />
              Livros por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoriaData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-white/30 text-sm">
                Nenhum livro cadastrado ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Novo Livro', href: '/rh/biblioteca/acervo', icon: BookOpen, color: 'text-blue-400' },
            { label: 'Novo Empréstimo', href: '/rh/biblioteca/emprestimos', icon: BookCopy, color: 'text-amber-400' },
            { label: 'Devoluções', href: '/rh/biblioteca/devolucoes', icon: RotateCcw, color: 'text-emerald-400' },
            { label: 'Relatórios', href: '/rh/biblioteca/relatorios', icon: BarChart3, color: 'text-purple-400' },
          ].map((link) => (
            <Link key={link.label} href={link.href}>
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <link.icon className={`w-5 h-5 ${link.color}`} />
                  <span className="text-sm font-medium text-white">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
