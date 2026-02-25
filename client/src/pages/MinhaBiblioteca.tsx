import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Library, Search, BookOpen, BookMarked, Clock, RefreshCw, X,
  Loader2, AlertTriangle, CheckCircle2, FileText, Calendar,
  User, BookCopy, Info,
} from 'lucide-react';

const STATUS_EMP: Record<string, { label: string; color: string; icon: any }> = {
  ativo: { label: 'Ativo', color: 'bg-blue-100 text-blue-700', icon: BookOpen },
  devolvido: { label: 'Devolvido', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  atrasado: { label: 'Atrasado', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  extraviado: { label: 'Extraviado', color: 'bg-gray-100 text-gray-700', icon: X },
};

const STATUS_RES: Record<string, { label: string; color: string }> = {
  ativa: { label: 'Ativa', color: 'bg-amber-100 text-amber-700' },
  atendida: { label: 'Atendida', color: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700' },
  expirada: { label: 'Expirada', color: 'bg-red-100 text-red-700' },
};

function fmtDate(d: string | null | undefined) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

export default function MinhaBiblioteca() {
  const { user } = useAuth();
  const [tab, setTab] = useState('catalogo');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [livroDetalhe, setLivroDetalhe] = useState<any>(null);

  // Queries
  const perfil = trpc.biblioteca.autoatendimento.meuPerfil.useQuery();
  const catalogo = trpc.biblioteca.autoatendimento.catalogo.useQuery({ busca, categoria: categoria === 'todas' ? undefined : categoria });
  const categorias = trpc.biblioteca.autoatendimento.categorias.useQuery();
  const meusEmprestimos = trpc.biblioteca.autoatendimento.meusEmprestimos.useQuery();
  const minhasReservas = trpc.biblioteca.autoatendimento.minhasReservas.useQuery();

  // Mutations
  const utils = trpc.useUtils();
  const reservarMut = trpc.biblioteca.autoatendimento.reservar.useMutation({
    onSuccess: () => {
      toast.success('Reserva realizada com sucesso!');
      utils.biblioteca.autoatendimento.minhasReservas.invalidate();
      utils.biblioteca.autoatendimento.catalogo.invalidate();
      setLivroDetalhe(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const renovarMut = trpc.biblioteca.autoatendimento.renovar.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success('Renovação realizada com sucesso!');
        utils.biblioteca.autoatendimento.meusEmprestimos.invalidate();
      } else {
        toast.error(data.message || 'Não foi possível renovar');
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const cancelarReservaMut = trpc.biblioteca.autoatendimento.cancelarReserva.useMutation({
    onSuccess: () => {
      toast.success('Reserva cancelada');
      utils.biblioteca.autoatendimento.minhasReservas.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const empAtivos = useMemo(() =>
    (meusEmprestimos.data || []).filter((e: any) => e.status === 'ativo' || e.status === 'atrasado'),
    [meusEmprestimos.data]
  );
  const empHistorico = useMemo(() =>
    (meusEmprestimos.data || []).filter((e: any) => e.status !== 'ativo' && e.status !== 'atrasado'),
    [meusEmprestimos.data]
  );
  const reservasAtivas = useMemo(() =>
    (minhasReservas.data || []).filter((r: any) => r.status === 'ativa'),
    [minhasReservas.data]
  );

  if (!perfil.data && !perfil.isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Perfil não vinculado</h2>
            <p className="text-muted-foreground text-sm">
              Sua conta ainda não está vinculada a um colaborador no sistema de RH.
              Solicite ao departamento de Gente &amp; Gestão que vincule seu usuário ao seu cadastro de colaborador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Library className="w-6 h-6 text-primary" />
            Minha Biblioteca
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {perfil.data ? `Olá, ${perfil.data.nomeCompleto?.split(' ')[0]}!` : 'Carregando...'} Consulte o catálogo, acompanhe seus empréstimos e faça reservas.
          </p>
        </div>
        <div className="flex gap-2">
          {empAtivos.length > 0 && (
            <Badge variant="outline" className="gap-1 text-blue-700 border-blue-300 bg-blue-50">
              <BookOpen className="w-3.5 h-3.5" />
              {empAtivos.length} empréstimo{empAtivos.length > 1 ? 's' : ''} ativo{empAtivos.length > 1 ? 's' : ''}
            </Badge>
          )}
          {reservasAtivas.length > 0 && (
            <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
              <BookMarked className="w-3.5 h-3.5" />
              {reservasAtivas.length} reserva{reservasAtivas.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="catalogo" className="gap-1.5">
            <Search className="w-4 h-4" /> Catálogo
          </TabsTrigger>
          <TabsTrigger value="emprestimos" className="gap-1.5">
            <BookOpen className="w-4 h-4" /> Meus Empréstimos
          </TabsTrigger>
          <TabsTrigger value="reservas" className="gap-1.5">
            <BookMarked className="w-4 h-4" /> Minhas Reservas
          </TabsTrigger>
        </TabsList>

        {/* ===== CATÁLOGO ===== */}
        <TabsContent value="catalogo" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, autor, ISBN..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {(categorias.data || []).map((c: string) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {catalogo.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (catalogo.data || []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookCopy className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum livro encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(catalogo.data || []).map((livro: any) => (
                <Card key={livro.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setLivroDetalhe(livro)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {livro.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{livro.autores || 'Autor desconhecido'}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-muted-foreground/30 flex-shrink-0" />
                    </div>
                    {livro.categoria && (
                      <Badge variant="outline" className="text-xs">{livro.categoria}</Badge>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        {livro.editora || '-'} {livro.edicao ? `• ${livro.edicao}` : ''}
                      </span>
                      {livro.disponibilidade?.disponiveis > 0 ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          {livro.disponibilidade.disponiveis} disponível{livro.disponibilidade.disponiveis > 1 ? 'is' : ''}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-xs">Indisponível</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== MEUS EMPRÉSTIMOS ===== */}
        <TabsContent value="emprestimos" className="mt-4 space-y-4">
          {meusEmprestimos.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (meusEmprestimos.data || []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Você ainda não possui empréstimos</p>
                <Button variant="outline" className="mt-4" onClick={() => setTab('catalogo')}>
                  Explorar catálogo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {empAtivos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Empréstimos Ativos</h3>
                  <div className="space-y-3">
                    {empAtivos.map((emp: any) => {
                      const st = STATUS_EMP[emp.status] || STATUS_EMP.ativo;
                      const Icon = st.icon;
                      const diasRestantes = Math.ceil((new Date(emp.dataPrevistaDevolucao).getTime() - Date.now()) / 86400000);
                      return (
                        <Card key={emp.id} className={emp.status === 'atrasado' ? 'border-red-300 bg-red-50/30' : ''}>
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className={`p-2 rounded-lg ${st.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm">Empréstimo #{emp.id}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Retirada: {fmtDate(emp.dataRetirada)} • Devolução prevista: {fmtDate(emp.dataPrevistaDevolucao)}
                                  </p>
                                  {emp.status === 'ativo' && diasRestantes <= 3 && diasRestantes > 0 && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> Vence em {diasRestantes} dia{diasRestantes > 1 ? 's' : ''}
                                    </p>
                                  )}
                                  {emp.status === 'atrasado' && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Atrasado — devolva o mais rápido possível
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Renovações: {emp.renovacoes || 0}/{emp.limiteRenovacoes || 2}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                {emp.termoPdfUrl && (
                                  <Button variant="outline" size="sm" className="gap-1" asChild>
                                    <a href={emp.termoPdfUrl} target="_blank" rel="noopener noreferrer">
                                      <FileText className="w-3.5 h-3.5" /> Termo
                                    </a>
                                  </Button>
                                )}
                                {emp.status === 'ativo' && (emp.renovacoes || 0) < (emp.limiteRenovacoes || 2) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    disabled={renovarMut.isPending}
                                    onClick={() => renovarMut.mutate({ emprestimoId: emp.id })}
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${renovarMut.isPending ? 'animate-spin' : ''}`} /> Renovar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              {empHistorico.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Histórico</h3>
                  <div className="space-y-2">
                    {empHistorico.map((emp: any) => {
                      const st = STATUS_EMP[emp.status] || { label: emp.status, color: 'bg-gray-100 text-gray-700', icon: BookOpen };
                      return (
                        <Card key={emp.id} className="opacity-70">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                              <span className="text-sm">Empréstimo #{emp.id}</span>
                              <span className="text-xs text-muted-foreground">
                                {fmtDate(emp.dataRetirada)} → {fmtDate(emp.dataEfetivaDevolucao || emp.dataPrevistaDevolucao)}
                              </span>
                            </div>
                            {emp.termoPdfUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={emp.termoPdfUrl} target="_blank" rel="noopener noreferrer">
                                  <FileText className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ===== MINHAS RESERVAS ===== */}
        <TabsContent value="reservas" className="mt-4 space-y-4">
          {minhasReservas.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (minhasReservas.data || []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookMarked className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Você não possui reservas</p>
                <Button variant="outline" className="mt-4" onClick={() => setTab('catalogo')}>
                  Explorar catálogo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(minhasReservas.data || []).map((res: any) => {
                const st = STATUS_RES[res.status] || { label: res.status, color: 'bg-gray-100 text-gray-700' };
                return (
                  <Card key={res.id}>
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
                        <div>
                          <p className="text-sm font-medium">Reserva #{res.id} — Livro #{res.livroId}</p>
                          <p className="text-xs text-muted-foreground">
                            Reservado em: {fmtDate(res.dataReserva)}
                            {res.posicaoFila ? ` • Posição na fila: ${res.posicaoFila}` : ''}
                          </p>
                        </div>
                      </div>
                      {res.status === 'ativa' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-red-600 hover:text-red-700"
                          disabled={cancelarReservaMut.isPending}
                          onClick={() => cancelarReservaMut.mutate({ reservaId: res.id })}
                        >
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== DIALOG DETALHE DO LIVRO ===== */}
      <Dialog open={!!livroDetalhe} onOpenChange={(open) => !open && setLivroDetalhe(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {livroDetalhe?.titulo}
            </DialogTitle>
            <DialogDescription>{livroDetalhe?.autores || 'Autor desconhecido'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Editora:</span> {livroDetalhe?.editora || '-'}</div>
              <div><span className="text-muted-foreground">Edição:</span> {livroDetalhe?.edicao || '-'}</div>
              <div><span className="text-muted-foreground">ISBN:</span> {livroDetalhe?.isbn || '-'}</div>
              <div><span className="text-muted-foreground">Categoria:</span> {livroDetalhe?.categoria || '-'}</div>
              <div><span className="text-muted-foreground">Ano:</span> {livroDetalhe?.anoPublicacao || '-'}</div>
              <div>
                <span className="text-muted-foreground">Disponibilidade:</span>{' '}
                {livroDetalhe?.disponibilidade?.disponiveis > 0 ? (
                  <span className="text-green-600 font-medium">{livroDetalhe.disponibilidade.disponiveis} de {livroDetalhe.disponibilidade.total}</span>
                ) : (
                  <span className="text-red-600 font-medium">Indisponível</span>
                )}
              </div>
            </div>
            {livroDetalhe?.descricao && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Descrição</p>
                <p className="text-sm">{livroDetalhe.descricao}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setLivroDetalhe(null)}>Fechar</Button>
            {livroDetalhe?.disponibilidade?.disponiveis === 0 && (
              <Button
                disabled={reservarMut.isPending}
                onClick={() => reservarMut.mutate({ livroId: livroDetalhe.id })}
                className="gap-1"
              >
                <BookMarked className="w-4 h-4" />
                {reservarMut.isPending ? 'Reservando...' : 'Reservar'}
              </Button>
            )}
            {livroDetalhe?.disponibilidade?.disponiveis > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                Disponível — solicite o empréstimo ao bibliotecário
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
