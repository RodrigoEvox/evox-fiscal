import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useMemo } from 'react';
import {
  Users, BookOpen, ListOrdered, Handshake, AlertTriangle, TrendingUp,
  CheckCircle, Clock, Loader2, Flag, ArrowRight, Play,
  Cake, PartyPopper, FileWarning, CalendarClock, User, Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: clientes } = trpc.clientes.list.useQuery();
  const { data: filaItems } = trpc.fila.list.useQuery();
  const { data: aniversariantes } = trpc.aniversariantes.mes.useQuery();
  const { data: contratosVencendo } = trpc.contratosVencendo.list.useQuery({ diasAntecedencia: 30 });
  const seedTeses = trpc.seed.teses.useMutation({
    onSuccess: () => {
      trpc.useUtils().dashboard.stats.invalidate();
    },
  });
  const utils = trpc.useUtils();

  // Seed teses on first load if none exist
  if (stats && stats.totalTeses === 0 && !seedTeses.isPending && !seedTeses.isSuccess) {
    seedTeses.mutate(undefined, {
      onSuccess: () => utils.dashboard.stats.invalidate(),
    });
  }

  const hoje = useMemo(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const mesAtual = new Date().getMonth() + 1;

  const aniversariantesHoje = useMemo(() => {
    if (!aniversariantes) return [];
    return aniversariantes.filter((a: any) => {
      if (!a.dataNascimento) return false;
      const parts = a.dataNascimento.substring(5); // MM-DD
      return parts === hoje;
    });
  }, [aniversariantes, hoje]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const filaFazendo = (filaItems || []).filter((f: any) => f.status === 'fazendo');
  const recentClientes = (clientes || []).slice(0, 5);

  const metricCards = [
    { title: 'Total de Clientes', value: stats.totalClientes, icon: Users, color: 'text-blue-600 bg-blue-50', borderColor: '#0A2540', onClick: () => setLocation('/clientes') },
    { title: 'Clientes Prioritários', value: stats.clientesPrioritarios, icon: Flag, color: 'text-red-600 bg-red-50', borderColor: '#EF4444', onClick: () => setLocation('/clientes?prioridade=alta') },
    { title: 'Com Red Flags', value: stats.clientesComRedFlags, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', borderColor: '#F59E0B', onClick: () => setLocation('/clientes?redflags=true') },
    { title: 'Teses Ativas', value: stats.totalTeses, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50', borderColor: '#10B981', onClick: () => setLocation('/teses') },
    { title: 'Teses Pacificadas', value: stats.tesesPacificadas, icon: CheckCircle, color: 'text-teal-600 bg-teal-50', borderColor: '#14B8A6', onClick: () => setLocation('/teses?classificacao=pacificada') },
    { title: 'Parceiros Ativos', value: stats.totalParceiros, icon: Handshake, color: 'text-indigo-600 bg-indigo-50', borderColor: '#6366F1', onClick: () => setLocation('/parceiros') },
  ];

  const filaCards = [
    { title: 'A Fazer', value: stats.filaAFazer, color: 'bg-slate-50 text-slate-700', onClick: () => setLocation('/fila?status=a_fazer') },
    { title: 'Em Andamento', value: stats.filaFazendo, color: 'bg-blue-50 text-blue-700', onClick: () => setLocation('/fila?status=fazendo') },
    { title: 'Concluídos', value: stats.filaConcluido, color: 'bg-emerald-50 text-emerald-700', onClick: () => setLocation('/fila?status=concluido') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bem-vindo(a), {user?.name || 'Usuário'}. Visão geral do sistema.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
            style={{ borderLeftColor: card.borderColor }}
            onClick={card.onClick}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                  <p className="text-3xl font-bold font-data mt-2 text-foreground">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Birthday + Contract Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aniversariantes do Mês */}
        <Card className="border-l-4" style={{ borderLeftColor: '#EC4899' }}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" /> Aniversariantes — {meses[mesAtual]}
            </CardTitle>
            <Badge className="bg-pink-50 text-pink-700 border-pink-200 text-[10px]">
              {(aniversariantes || []).length} neste mês
            </Badge>
          </CardHeader>
          <CardContent>
            {!aniversariantes || aniversariantes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversariante neste mês.</p>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {/* Aniversariantes de hoje primeiro */}
                {aniversariantesHoje.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <PartyPopper className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Hoje!</span>
                    </div>
                    {aniversariantesHoje.map((a: any) => (
                      <div key={`hoje-${a.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-pink-50 to-amber-50 border border-pink-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                            <PartyPopper className="w-4 h-4 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{a.nomeCompleto}</p>
                            <p className="text-[10px] text-muted-foreground">{a.cargo}</p>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] animate-pulse">
                          Parabéns!
                        </Badge>
                      </div>
                    ))}
                    <Separator className="my-2" />
                  </>
                )}
                {/* Demais aniversariantes do mês */}
                {(aniversariantes || []).filter((a: any) => {
                  if (!a.dataNascimento) return false;
                  return a.dataNascimento.substring(5) !== hoje;
                }).map((a: any) => {
                  const dia = a.dataNascimento ? a.dataNascimento.substring(8, 10) : '??';
                  return (
                    <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                          <User className="w-4 h-4 text-pink-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.nomeCompleto}</p>
                          <p className="text-[10px] text-muted-foreground">{a.cargo}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-pink-50/50 text-pink-600 border-pink-200">
                        Dia {dia}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contratos Próximos do Vencimento */}
        <Card className="border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-500" /> Contratos Vencendo
            </CardTitle>
            <Badge className={`text-[10px] ${(contratosVencendo || []).length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {(contratosVencendo || []).length > 0 ? `${(contratosVencendo || []).length} alerta(s)` : 'Sem alertas'}
            </Badge>
          </CardHeader>
          <CardContent>
            {!contratosVencendo || contratosVencendo.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum contrato próximo do vencimento nos próximos 30 dias.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {contratosVencendo.map((c: any) => {
                  const urgente = c.diasRestantes <= 7;
                  const atencao = c.diasRestantes <= 15;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors ${
                        urgente ? 'bg-red-50/80 border-red-200' :
                        atencao ? 'bg-amber-50/80 border-amber-200' :
                        'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          urgente ? 'bg-red-100' : atencao ? 'bg-amber-100' : 'bg-slate-100'
                        }`}>
                          <FileWarning className={`w-4 h-4 ${
                            urgente ? 'text-red-600' : atencao ? 'text-amber-600' : 'text-slate-500'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.nomeCompleto}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-muted-foreground">{c.cargo}</p>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <p className="text-[10px] text-muted-foreground">
                              {c.tipoContrato === 'clt' ? 'CLT' : c.tipoContrato === 'pj' ? 'PJ' : 'Contrato'} — {c.periodoExperiencia} dias
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-[10px] ${
                          urgente ? 'bg-red-100 text-red-700 border-red-300' :
                          atencao ? 'bg-amber-100 text-amber-700 border-amber-300' :
                          'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          {c.diasRestantes === 0 ? 'Vence hoje!' :
                           c.diasRestantes === 1 ? 'Amanhã' :
                           `${c.diasRestantes} dias`}
                        </Badge>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          Venc: {c.dataVencimento ? new Date(c.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila de Apuração */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ListOrdered className="w-4 h-4" /> Fila de Apuração
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setLocation('/fila')}>
            Ver fila completa <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {filaCards.map((fc) => (
              <div key={fc.title} className={`text-center p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${fc.color}`} onClick={fc.onClick}>
                <p className="text-xs font-medium">{fc.title}</p>
                <p className="text-2xl font-bold font-data">{fc.value}</p>
              </div>
            ))}
          </div>
          {filaFazendo.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Em andamento agora</p>
              {filaFazendo.slice(0, 3).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Play className="w-3 h-3 text-blue-600" />
                    <span className="text-sm font-medium">{item.analistaNome || 'Analista'}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">Em apuração</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Clients */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Clientes Recentes</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setLocation('/clientes')}>
            Ver todos <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentClientes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {recentClientes.map((cliente: any) => {
                const redFlagCount = Array.isArray(cliente.redFlags) ? cliente.redFlags.length : 0;
                return (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/clientes/${cliente.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full ${
                        cliente.prioridade === 'alta' ? 'bg-red-500' :
                        cliente.prioridade === 'media' ? 'bg-amber-500' : 'bg-sky-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{cliente.razaoSocial}</p>
                        <p className="text-xs text-muted-foreground font-data">{cliente.cnpj}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <Badge className={`text-[9px] ${cliente.classificacaoCliente === 'novo' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {cliente.classificacaoCliente === 'novo' ? 'Novo' : 'Base'}
                      </Badge>
                      {redFlagCount > 0 && (
                        <Badge variant="destructive" className="text-[9px] gap-1">
                          <Flag className="w-3 h-3" /> {redFlagCount}
                        </Badge>
                      )}
                      <Badge className={`text-[9px] ${
                        cliente.prioridade === 'alta' ? 'bg-red-100 text-red-700 border-red-200' :
                        cliente.prioridade === 'media' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-sky-100 text-sky-700 border-sky-200'
                      }`}>
                        {cliente.prioridade === 'alta' ? 'Alta' : cliente.prioridade === 'media' ? 'Média' : 'Baixa'}
                      </Badge>
                      {cliente.regimeTributario && (
                        <Badge variant="outline" className="text-[8px] h-4 bg-teal-50 text-teal-700 border-teal-200">{cliente.regimeTributario}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
