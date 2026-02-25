import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  ArrowLeft, FileText, BookOpen, Package, BookCopy, AlertTriangle,
  Users, TrendingUp, Download, BarChart3,
} from 'lucide-react';

export default function BibliotecaRelatorios() {
  const livros = trpc.biblioteca.livros.list.useQuery();
  const exemplares = trpc.biblioteca.exemplares.list.useQuery();
  const emprestimos = trpc.biblioteca.emprestimos.list.useQuery();
  const reservas = trpc.biblioteca.reservas.list.useQuery();
  const ocorrencias = trpc.biblioteca.ocorrenciasBib.list.useQuery();

  const stats = useMemo(() => {
    const totalLivros = livros.data?.length || 0;
    const totalExemplares = exemplares.data?.length || 0;
    const disponiveis = exemplares.data?.filter((e: any) => e.status === 'disponivel').length || 0;
    const emprestados = exemplares.data?.filter((e: any) => e.status === 'emprestado').length || 0;
    const totalEmprestimos = emprestimos.data?.length || 0;
    const ativos = emprestimos.data?.filter((e: any) => e.status === 'ativo').length || 0;
    const now = Date.now();
    const atrasados = emprestimos.data?.filter((e: any) => e.status === 'ativo' && new Date(e.dataPrevistaDevolucao).getTime() < now).length || 0;
    const reservasPendentes = reservas.data?.filter((r: any) => r.status === 'pendente').length || 0;
    const ocorrenciasAbertas = ocorrencias.data?.filter((o: any) => o.status === 'aberta').length || 0;

    // Top borrowed books
    const bookCount = new Map<number, number>();
    emprestimos.data?.forEach((e: any) => {
      const ex = exemplares.data?.find((ex: any) => ex.id === e.exemplarId);
      if (ex) bookCount.set(ex.livroId, (bookCount.get(ex.livroId) || 0) + 1);
    });
    const topBooks = Array.from(bookCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([livroId, count]) => ({
        titulo: livros.data?.find((l: any) => l.id === livroId)?.titulo || `Livro #${livroId}`,
        count,
      }));

    // Top borrowers
    const borrowerCount = new Map<string, number>();
    emprestimos.data?.forEach((e: any) => {
      borrowerCount.set(e.colaboradorNome, (borrowerCount.get(e.colaboradorNome) || 0) + 1);
    });
    const topBorrowers = Array.from(borrowerCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, count]) => ({ nome, count }));

    // Category distribution
    const catCount = new Map<string, number>();
    livros.data?.forEach((l: any) => {
      const cat = l.categoria || 'Sem Categoria';
      catCount.set(cat, (catCount.get(cat) || 0) + 1);
    });
    const categories = Array.from(catCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return {
      totalLivros, totalExemplares, disponiveis, emprestados,
      totalEmprestimos, ativos, atrasados, reservasPendentes,
      ocorrenciasAbertas, topBooks, topBorrowers, categories,
    };
  }, [livros.data, exemplares.data, emprestimos.data, reservas.data, ocorrencias.data]);

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) { toast.error('Nenhum dado para exportar'); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(';'), ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename}.csv exportado!`);
  };

  const exportAcervo = () => {
    if (!livros.data) return;
    exportCSV(livros.data.map((l: any) => ({
      Titulo: l.titulo, Autor: l.autor, ISBN: l.isbn || '',
      Editora: l.editora || '', Ano: l.anoPublicacao || '',
      Categoria: l.categoria || '', Status: l.status,
    })), 'acervo_biblioteca');
  };

  const exportEmprestimos = () => {
    if (!emprestimos.data) return;
    exportCSV(emprestimos.data.map((e: any) => ({
      Colaborador: e.colaboradorNome, ExemplarId: e.exemplarId,
      DataEmprestimo: e.dataEmprestimo ? new Date(e.dataEmprestimo).toLocaleDateString('pt-BR') : '',
      PrevisaoDevolucao: e.dataPrevistaDevolucao ? new Date(e.dataPrevistaDevolucao).toLocaleDateString('pt-BR') : '',
      DataDevolucao: e.dataDevolucao ? new Date(e.dataDevolucao).toLocaleDateString('pt-BR') : '',
      Status: e.status, Renovacoes: e.renovacoes || 0,
    })), 'emprestimos_biblioteca');
  };

  return (
    <>
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Títulos', value: stats.totalLivros, icon: BookOpen, color: 'text-blue-400' },
            { label: 'Exemplares', value: stats.totalExemplares, icon: Package, color: 'text-emerald-400' },
            { label: 'Empréstimos Ativos', value: stats.ativos, icon: BookCopy, color: 'text-amber-400' },
            { label: 'Atrasados', value: stats.atrasados, icon: AlertTriangle, color: 'text-red-400' },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-muted/30 border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                <div>
                  <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground/70">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export Buttons */}
        <Card className="bg-muted/30 border-border/60">
          <CardHeader><CardTitle className="text-foreground text-sm">Exportar Relatórios</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={exportAcervo} variant="outline" className="border-border text-muted-foreground hover:bg-muted/60">
              <Download className="w-4 h-4 mr-2" /> Acervo Completo (CSV)
            </Button>
            <Button onClick={exportEmprestimos} variant="outline" className="border-border text-muted-foreground hover:bg-muted/60">
              <Download className="w-4 h-4 mr-2" /> Empréstimos (CSV)
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Books */}
          <Card className="bg-muted/30 border-border/60">
            <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Livros Mais Emprestados</CardTitle></CardHeader>
            <CardContent>
              {stats.topBooks.length === 0 ? (
                <p className="text-muted-foreground/50 text-sm text-center py-4">Nenhum empréstimo registrado</p>
              ) : (
                <div className="space-y-3">
                  {stats.topBooks.map((b, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-foreground text-sm truncate max-w-[200px]">{b.titulo}</span>
                      </div>
                      <Badge variant="outline" className="border-border text-muted-foreground">{b.count}x</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Borrowers */}
          <Card className="bg-muted/30 border-border/60">
            <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Colaboradores que Mais Leem</CardTitle></CardHeader>
            <CardContent>
              {stats.topBorrowers.length === 0 ? (
                <p className="text-muted-foreground/50 text-sm text-center py-4">Nenhum empréstimo registrado</p>
              ) : (
                <div className="space-y-3">
                  {stats.topBorrowers.map((b, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-foreground text-sm">{b.nome}</span>
                      </div>
                      <Badge variant="outline" className="border-border text-muted-foreground">{b.count}x</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card className="bg-muted/30 border-border/60">
          <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-400" /> Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent>
            {stats.categories.length === 0 ? (
              <p className="text-muted-foreground/50 text-sm text-center py-4">Nenhum livro cadastrado</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.categories.map((c) => (
                  <Badge key={c.name} variant="outline" className="border-border text-muted-foreground px-3 py-1">
                    {c.name} <span className="ml-1 text-muted-foreground/60">({c.count})</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </>
  );
}
