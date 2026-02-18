import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ClipboardList, Clock, AlertTriangle, CheckCircle2, Circle, Loader2, Search, Filter } from 'lucide-react';
import { Link } from 'wouter';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  aberta: { label: 'A Fazer', color: 'bg-gray-100 text-gray-700', icon: Circle },
  em_andamento: { label: 'Fazendo', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  concluida: { label: 'Feito', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: Circle },
};

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

export default function MinhasTarefas() {
  const { user } = useAuth();
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas');
  const [busca, setBusca] = useState('');

  const tarefas = trpc.tarefas.list.useQuery({});

  // Filtrar apenas tarefas atribuídas ao usuário logado
  const minhasTarefas = useMemo(() => {
    if (!tarefas.data || !user) return [];
    return (tarefas.data as any[]).filter((t: any) => t.responsavelId === user.id);
  }, [tarefas.data, user]);

  const tarefasFiltradas = useMemo(() => {
    let result = minhasTarefas;
    if (filtroStatus !== 'todas') result = result.filter(t => t.status === filtroStatus);
    if (filtroPrioridade !== 'todas') result = result.filter(t => t.prioridade === filtroPrioridade);
    if (busca) {
      const q = busca.toLowerCase();
      result = result.filter(t => t.titulo.toLowerCase().includes(q) || (t.descricao || '').toLowerCase().includes(q));
    }
    return result;
  }, [minhasTarefas, filtroStatus, filtroPrioridade, busca]);

  // Contadores
  const counts = useMemo(() => {
    const c = { total: minhasTarefas.length, aberta: 0, em_andamento: 0, concluida: 0, atrasadas: 0 };
    const now = Date.now();
    minhasTarefas.forEach(t => {
      if (t.status === 'aberta') c.aberta++;
      if (t.status === 'em_andamento') c.em_andamento++;
      if (t.status === 'concluida') c.concluida++;
      if (t.slaDeadline && new Date(t.slaDeadline).getTime() < now && t.status !== 'concluida' && t.status !== 'cancelada') c.atrasadas++;
    });
    return c;
  }, [minhasTarefas]);

  const isOverdue = (t: any) => {
    if (!t.slaDeadline || t.status === 'concluida' || t.status === 'cancelada') return false;
    return new Date(t.slaDeadline).getTime() < Date.now();
  };

  const isNearDeadline = (t: any) => {
    if (!t.slaDeadline || t.status === 'concluida' || t.status === 'cancelada') return false;
    const deadline = new Date(t.slaDeadline).getTime();
    const now = Date.now();
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  };

  if (tarefas.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-500" />
          Minhas Tarefas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão focada das suas tarefas atribuídas
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('aberta')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">A Fazer</p>
                <p className="text-2xl font-bold text-gray-900">{counts.aberta}</p>
              </div>
              <Circle className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('em_andamento')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Fazendo</p>
                <p className="text-2xl font-bold text-blue-600">{counts.em_andamento}</p>
              </div>
              <Loader2 className="w-8 h-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroStatus('concluida')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{counts.concluida}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200" onClick={() => setFiltroStatus('todas')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-500 uppercase">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{counts.atrasadas}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar nas minhas tarefas..."
            className="pl-9"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            <SelectItem value="aberta">A Fazer</SelectItem>
            <SelectItem value="em_andamento">Fazendo</SelectItem>
            <SelectItem value="concluida">Concluídas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas prioridades</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
        {(filtroStatus !== 'todas' || filtroPrioridade !== 'todas' || busca) && (
          <Button variant="ghost" size="sm" onClick={() => { setFiltroStatus('todas'); setFiltroPrioridade('todas'); setBusca(''); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-3">
        {tarefasFiltradas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma tarefa encontrada</p>
            </CardContent>
          </Card>
        )}
        {tarefasFiltradas.map((tarefa: any) => {
          const statusCfg = STATUS_CONFIG[tarefa.status] || STATUS_CONFIG.aberta;
          const prioCfg = PRIORIDADE_CONFIG[tarefa.prioridade] || PRIORIDADE_CONFIG.media;
          const overdue = isOverdue(tarefa);
          const nearDeadline = isNearDeadline(tarefa);

          return (
            <Link key={tarefa.id} href={`/tarefas/${tarefa.id}`}>
              <Card className={`hover:shadow-md transition-all cursor-pointer ${overdue ? 'border-red-300 bg-red-50/30' : nearDeadline ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{tarefa.titulo}</h3>
                        {overdue && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Atrasada
                          </Badge>
                        )}
                        {nearDeadline && !overdue && (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px] shrink-0">
                            <Clock className="w-3 h-3 mr-1" /> Prazo próximo
                          </Badge>
                        )}
                      </div>
                      {tarefa.descricao && (
                        <p className="text-sm text-gray-500 truncate">{tarefa.descricao}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className={`${statusCfg.color} text-[11px]`}>{statusCfg.label}</Badge>
                        <Badge className={`${prioCfg.color} text-[11px]`}>{prioCfg.label}</Badge>
                        {tarefa.setorNome && (
                          <span className="text-xs text-gray-400">{tarefa.setorNome}</span>
                        )}
                      </div>
                    </div>
                    {tarefa.slaDeadline && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-400 uppercase">Prazo</p>
                        <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {new Date(tarefa.slaDeadline).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(tarefa.slaDeadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
