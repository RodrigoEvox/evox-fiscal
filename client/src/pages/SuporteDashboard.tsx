import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Users, AlertCircle, Clock, CheckCircle2, Inbox } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

export default function SuporteDashboard() {
  const clientes = trpc.clientes.list.useQuery(undefined, { staleTime: 60000 });
  const parceiros = trpc.parceiros.list.useQuery(undefined, { staleTime: 60000 });
  
  const totalClientes = clientes.data?.length || 0;
  const totalParceiros = parceiros.data?.length || 0;
  
  // Simulated data for support metrics
  const demandas = 45;
  const emAtendimento = 12;
  const resolvidas = 33;
  const tempoMedioAtendimento = '2.5h';

  if (clientes.isLoading || parceiros.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Dashboard - Suporte</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParceiros}</div>
            <p className="text-xs text-muted-foreground mt-1">Parceiros comerciais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Demandas Abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{demandas}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando resolução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tempoMedioAtendimento}</div>
            <p className="text-xs text-muted-foreground mt-1">Atendimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              Status das Demandas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>Em Aberto</span>
              </div>
              <Badge variant="destructive">{demandas}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>Em Atendimento</span>
              </div>
              <Badge variant="outline">{emAtendimento}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Resolvidas</span>
              </div>
              <Badge variant="secondary">{resolvidas}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">
                O setor de Suporte é responsável pela interlocução principal entre parceiros comerciais e a equipe interna.
              </p>
              <p className="text-muted-foreground">
                Utilize a opção "Nova Tarefa" para criar demandas para os demais setores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
