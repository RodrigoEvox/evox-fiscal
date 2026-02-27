import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocation } from 'wouter';
import { useState, useMemo } from 'react';
import {
  ChevronRight, ArrowLeft, Loader2, Search, Filter, X,
  Calculator, UserPlus, FileEdit, ArrowLeftRight, RefreshCw, Undo2,
  CheckCircle2, Clock, AlertTriangle, User, Building2,
  Sparkles, GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FILA_ORDER = ['onboarding', 'apuracao', 'retificacao', 'compensacao', 'ressarcimento', 'restituicao'] as const;

const FILA_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  onboarding: { label: 'Onboarding', icon: UserPlus, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
  apuracao: { label: 'Apuração', icon: Calculator, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  retificacao: { label: 'Retificação', icon: FileEdit, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-300' },
  compensacao: { label: 'Compensação', icon: ArrowLeftRight, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300' },
  ressarcimento: { label: 'Ressarcimento', icon: RefreshCw, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-300' },
  restituicao: { label: 'Restituição', icon: Undo2, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-300' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
  fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
  feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
};

const SLA_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  dentro_prazo: { label: 'No prazo', icon: CheckCircle2, color: 'text-green-600' },
  atencao: { label: 'Atenção', icon: Clock, color: 'text-amber-600' },
  vencido: { label: 'Vencido', icon: AlertTriangle, color: 'text-red-600' },
};

export default function CreditoFluxoGeral() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFila, setFilterFila] = useState<string>('all');
  const [filterClassificacao, setFilterClassificacao] = useState<string>('all');
  const [filterSla, setFilterSla] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: flowData, isLoading } = trpc.creditRecovery.credito.flowOverview.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const filteredData = useMemo(() => {
    if (!flowData) return [];
    return (flowData as any[]).filter((cliente: any) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = cliente.clienteNome?.toLowerCase().includes(term);
        const matchCnpj = cliente.clienteCnpj?.includes(term);
        const matchCodigo = cliente.clienteCodigo?.toLowerCase().includes(term);
        const matchParceiro = cliente.parceiroNome?.toLowerCase().includes(term);
        if (!matchName && !matchCnpj && !matchCodigo && !matchParceiro) return false;
      }
      // Fila filter
      if (filterFila !== 'all') {
        if (!cliente.filas[filterFila] || cliente.filas[filterFila].length === 0) return false;
      }
      // Classificação filter
      if (filterClassificacao !== 'all') {
        if (cliente.classificacao !== filterClassificacao) return false;
      }
      // SLA filter
      if (filterSla !== 'all') {
        const allTasks = Object.values(cliente.filas).flat() as any[];
        const hasSlaMatch = allTasks.some((t: any) => t.slaStatus === filterSla);
        if (!hasSlaMatch) return false;
      }
      return true;
    });
  }, [flowData, searchTerm, filterFila, filterClassificacao, filterSla]);

  const activeFilterCount = [
    filterFila !== 'all',
    filterClassificacao !== 'all',
    filterSla !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterFila('all');
    setFilterClassificacao('all');
    setFilterSla('all');
    setSearchTerm('');
  };

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
            <button onClick={() => navigate('/credito/dashboard-credito')} className="hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Fluxo Geral</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            Visão Geral do Fluxo por Empresa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe em qual etapa cada empresa se encontra no fluxo de recuperação de créditos.
            Uma empresa pode estar em múltiplas filas simultaneamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nome, CNPJ ou parceiro..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Fila</label>
                  <Select value={filterFila} onValueChange={setFilterFila}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as filas</SelectItem>
                      {FILA_ORDER.map(f => (
                        <SelectItem key={f} value={f}>{FILA_CONFIG[f].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Cliente</label>
                  <Select value={filterClassificacao} onValueChange={setFilterClassificacao}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status SLA</label>
                  <Select value={filterSla} onValueChange={setFilterSla}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="dentro_prazo">No Prazo</SelectItem>
                      <SelectItem value="atencao">Atenção</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
                    <X className="w-3 h-3" /> Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{filteredData.length} empresa(s)</span>
        <span>•</span>
        <span>{filteredData.reduce((acc: number, c: any) => acc + Object.values(c.filas).flat().length, 0)} tarefa(s) ativa(s)</span>
      </div>

      {/* Flow Timeline Header */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr] gap-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
          Empresa
        </div>
        <div className="grid grid-cols-6 gap-2">
          {FILA_ORDER.map(fila => {
            const config = FILA_CONFIG[fila];
            const Icon = config.icon;
            return (
              <div key={fila} className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider py-2">
                <Icon className={cn('w-3.5 h-3.5', config.color)} />
                {config.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Client Flow Cards */}
      <div className="space-y-3">
        {filteredData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhuma empresa encontrada</p>
              <p className="text-sm mt-1">Ajuste os filtros ou aguarde a criação de tarefas.</p>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((cliente: any) => (
            <Card key={cliente.clienteId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="lg:grid lg:grid-cols-[280px_1fr]">
                  {/* Client Info */}
                  <div className="p-4 border-b lg:border-b-0 lg:border-r border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-muted-foreground">{cliente.clienteCodigo}</span>
                          {cliente.classificacao === 'novo' ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-700 bg-emerald-50">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />Novo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-300 text-gray-600">
                              Base
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate" title={cliente.clienteNome}>
                          {cliente.clienteNome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cliente.clienteCnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || 'Sem CNPJ'}
                        </p>
                        {cliente.parceiroNome && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">{cliente.parceiroNome}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flow Timeline */}
                  <div className="p-4">
                    {/* Desktop: Grid layout */}
                    <div className="hidden lg:grid lg:grid-cols-6 gap-2">
                      {FILA_ORDER.map((fila, idx) => {
                        const config = FILA_CONFIG[fila];
                        const tasks = cliente.filas[fila] || [];
                        const hasTasks = tasks.length > 0;
                        const Icon = config.icon;

                        return (
                          <div key={fila} className="relative">
                            {/* Connection line */}
                            {idx > 0 && (
                              <div className="absolute left-0 top-1/2 -translate-x-full w-2 h-0.5 bg-gray-200" />
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      'rounded-lg p-2.5 text-center transition-all border-2',
                                      hasTasks
                                        ? cn(config.bgColor, config.borderColor, 'shadow-sm')
                                        : 'bg-gray-50 border-dashed border-gray-200 opacity-50'
                                    )}
                                  >
                                    <Icon className={cn('w-4 h-4 mx-auto mb-1', hasTasks ? config.color : 'text-gray-400')} />
                                    {hasTasks ? (
                                      <>
                                        <p className={cn('text-lg font-bold', config.color)}>{tasks.length}</p>
                                        <p className="text-[10px] text-muted-foreground">tarefa(s)</p>
                                        {/* SLA indicators */}
                                        <div className="flex justify-center gap-1 mt-1">
                                          {tasks.some((t: any) => t.slaStatus === 'vencido') && (
                                            <AlertTriangle className="w-3 h-3 text-red-500" />
                                          )}
                                          {tasks.some((t: any) => t.slaStatus === 'atencao') && (
                                            <Clock className="w-3 h-3 text-amber-500" />
                                          )}
                                          {tasks.every((t: any) => t.slaStatus === 'dentro_prazo') && (
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-[10px] text-gray-400 mt-1">—</p>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                {hasTasks && (
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <div className="space-y-2">
                                      <p className="font-semibold text-sm">{config.label} — {tasks.length} tarefa(s)</p>
                                      {tasks.map((task: any, i: number) => (
                                        <div key={i} className="border-t pt-1.5 first:border-0 first:pt-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono">{task.taskCodigo}</span>
                                            <Badge className={cn('text-[10px] px-1.5 py-0', STATUS_CONFIG[task.status]?.color || 'bg-gray-100')}>
                                              {STATUS_CONFIG[task.status]?.label || task.status}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                            {task.responsavel && (
                                              <span className="flex items-center gap-0.5">
                                                <User className="w-2.5 h-2.5" />{task.responsavel}
                                              </span>
                                            )}
                                            {task.slaStatus && (
                                              <span className={cn('flex items-center gap-0.5', SLA_CONFIG[task.slaStatus]?.color)}>
                                                {(() => { const SlaIcon = SLA_CONFIG[task.slaStatus]?.icon; return SlaIcon ? <SlaIcon className="w-2.5 h-2.5" /> : null; })()}
                                                {SLA_CONFIG[task.slaStatus]?.label}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile: Horizontal scroll */}
                    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
                      {FILA_ORDER.map(fila => {
                        const config = FILA_CONFIG[fila];
                        const tasks = cliente.filas[fila] || [];
                        const hasTasks = tasks.length > 0;
                        const Icon = config.icon;

                        if (!hasTasks) return null;

                        return (
                          <div
                            key={fila}
                            className={cn(
                              'rounded-lg p-3 border-2 shrink-0 min-w-[120px]',
                              config.bgColor, config.borderColor
                            )}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className={cn('w-3.5 h-3.5', config.color)} />
                              <span className={cn('text-xs font-semibold', config.color)}>{config.label}</span>
                            </div>
                            <p className={cn('text-lg font-bold', config.color)}>{tasks.length}</p>
                            <div className="space-y-1 mt-1">
                              {tasks.map((task: any, i: number) => (
                                <div key={i} className="flex items-center gap-1 text-[10px]">
                                  <Badge className={cn('text-[9px] px-1 py-0', STATUS_CONFIG[task.status]?.color || 'bg-gray-100')}>
                                    {STATUS_CONFIG[task.status]?.label || task.status}
                                  </Badge>
                                  {task.slaStatus && (() => {
                                    const SlaIcon = SLA_CONFIG[task.slaStatus]?.icon;
                                    return SlaIcon ? <SlaIcon className={cn('w-2.5 h-2.5', SLA_CONFIG[task.slaStatus]?.color)} /> : null;
                                  })()}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(cliente.filas).length === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhuma tarefa ativa</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
