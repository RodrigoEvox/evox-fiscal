import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';
import {
  ChevronRight, Loader2, Search, Clock, AlertTriangle, CheckCircle,
  User, Calendar, PlusCircle, ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditoFilaPageProps {
  fila: string;
  filaLabel: string;
  icon: React.ReactNode;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
  fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
  feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
};

const PRIORIDADE_LABELS: Record<string, { label: string; color: string }> = {
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  media: { label: 'Média', color: 'bg-amber-100 text-amber-800' },
  baixa: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
};

export default function CreditoFilaPage({ fila, filaLabel, icon }: CreditoFilaPageProps) {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: tasks, isLoading } = trpc.creditRecovery.credito.tasks.list.useQuery({ fila } as any);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks as any[];
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.titulo?.toLowerCase().includes(term) ||
        t.codigo?.toLowerCase().includes(term) ||
        t.responsavelNome?.toLowerCase().includes(term)
      );
    }
    // Sort by creation date (FIFO)
    result.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return result;
  }, [tasks, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const all = (tasks as any[]) || [];
    return {
      total: all.length,
      aFazer: all.filter(t => t.status === 'a_fazer').length,
      fazendo: all.filter(t => t.status === 'fazendo').length,
      feito: all.filter(t => t.status === 'feito').length,
      concluido: all.filter(t => t.status === 'concluido').length,
      emAtraso: all.filter(t => t.slaStatus === 'vencido').length,
    };
  }, [tasks]);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{filaLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            {icon}
            Fila de {filaLabel}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tarefas ordenadas por data/hora de criação (FIFO). As coordenadas detalhadas serão configuradas posteriormente.
          </p>
        </div>
        <Button onClick={() => navigate('/credito/nova-tarefa-credito')} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'A Fazer', value: stats.aFazer, color: 'text-amber-600' },
          { label: 'Fazendo', value: stats.fazendo, color: 'text-blue-600' },
          { label: 'Feito', value: stats.feito, color: 'text-purple-600' },
          { label: 'Concluído', value: stats.concluido, color: 'text-emerald-600' },
          { label: 'Em Atraso', value: stats.emAtraso, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, título ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="a_fazer">A Fazer</SelectItem>
            <SelectItem value="fazendo">Fazendo</SelectItem>
            <SelectItem value="feito">Feito</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Nenhuma tarefa encontrada nesta fila.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/credito/nova-tarefa-credito')}>
                <PlusCircle className="w-4 h-4" />
                Criar Nova Tarefa
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Código</div>
                <div className="col-span-3">Título</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Prioridade</div>
                <div className="col-span-2">Responsável</div>
                <div className="col-span-1">SLA</div>
                <div className="col-span-1">Criado em</div>
                <div className="col-span-1">Criado por</div>
                <div className="col-span-1">Vencimento</div>
              </div>
              {filteredTasks.map((task: any) => {
                const statusInfo = STATUS_LABELS[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-800' };
                const prioridadeInfo = PRIORIDADE_LABELS[task.prioridade] || { label: task.prioridade, color: 'bg-gray-100 text-gray-800' };
                const isOverdue = task.slaStatus === 'vencido';
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-sm',
                      isOverdue && 'bg-red-50/50'
                    )}
                  >
                    <div className="col-span-1">
                      <span className="font-mono text-xs text-muted-foreground">{task.codigo}</span>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <p className="font-medium text-foreground truncate">{task.titulo}</p>
                    </div>
                    <div className="col-span-1">
                      <div className="flex flex-col gap-0.5">
                        <Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge>
                        {(task.status === 'feito' || task.status === 'concluido') && task.viabilidade && (
                          <Badge className={cn('text-[9px] gap-0.5 w-fit', task.viabilidade === 'viavel' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                            {task.viabilidade === 'viavel' ? 'Viável' : 'Inviável'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Badge className={cn('text-[10px]', prioridadeInfo.color)}>{prioridadeInfo.label}</Badge>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{task.responsavelNome || '—'}</span>
                    </div>
                    <div className="col-span-1">
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertTriangle className="w-3 h-3" />Atraso
                        </Badge>
                      ) : task.slaStatus === 'atencao' ? (
                        <Badge className="text-[10px] bg-amber-100 text-amber-800 gap-1">
                          <Clock className="w-3 h-3" />Atenção
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-1">
                          <CheckCircle className="w-3 h-3" />OK
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs text-muted-foreground">{formatDateTime(task.createdAt)}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs text-muted-foreground truncate">{task.criadoPorNome || '—'}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs text-muted-foreground">{formatDate(task.dataVencimento)}</span>
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
