/*
 * Fila de Apuração — Evox Fiscal
 * Kanban board com colunas de status, prioridade, timer, histórico e confirmações
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Search, Play, Pause, CheckCircle2, Clock, History, FileKey, AlertTriangle,
  ChevronRight, Plus, ListOrdered, LayoutGrid, CalendarClock,
} from 'lucide-react';
import type { ItemFilaApuracao } from '@/lib/types';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatWaitTime(dateStr: string): string {
  const now = Date.now();
  const inserted = new Date(dateStr).getTime();
  const diffMs = now - inserted;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h na fila`;
  return `${hours}h na fila`;
}

function statusLabel(s: string) {
  switch (s) {
    case 'a_fazer': return 'A Fazer';
    case 'fazendo': return 'Fazendo';
    case 'concluido': return 'Concluído';
    default: return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }
}

function statusColor(s: string) {
  switch (s) {
    case 'a_fazer': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'fazendo': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'concluido': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-purple-100 text-purple-700 border-purple-200';
  }
}

function prioridadeColor(p: string) {
  switch (p) {
    case 'alta': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    case 'media': return 'bg-amber-500/10 text-amber-700 border-amber-200';
    case 'baixa': return 'bg-red-500/10 text-red-700 border-red-200';
    default: return '';
  }
}

function procuracaoStatus(item: ItemFilaApuracao): { label: string; color: string } | null {
  if (!item.procuracaoHabilitada) return { label: 'Sem procuração', color: 'text-amber-600 border-amber-300 bg-amber-50' };
  if (!item.procuracaoValidade) return null;
  const today = new Date();
  const validade = new Date(item.procuracaoValidade);
  const diffDays = Math.ceil((validade.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Procuração vencida (${Math.abs(diffDays)}d)`, color: 'text-red-600 border-red-300 bg-red-50' };
  if (diffDays <= 5) return { label: `Vence em ${diffDays}d`, color: 'text-orange-600 border-orange-300 bg-orange-50' };
  return null;
}

function ActiveTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const update = () => setElapsed(Date.now() - start);
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  return <span className="font-data text-blue-600 text-xs font-bold">{formatDuration(elapsed)}</span>;
}

function FilaCard({ item, onAction }: {
  item: ItemFilaApuracao;
  onAction: (action: string, itemId: string) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const procStatus = procuracaoStatus(item);

  return (
    <>
      <Card className={`transition-all hover:shadow-md border-l-4 ${
        item.prioridade === 'alta' ? 'border-l-emerald-500' :
        item.prioridade === 'media' ? 'border-l-amber-500' : 'border-l-red-400'
      }`}>
        <CardContent className="py-3 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.clienteNome}</p>
              <p className="text-[11px] text-muted-foreground font-data">{item.clienteCnpj}</p>
              {item.parceiroNome && (
                <p className="text-[11px] text-muted-foreground mt-0.5">Parceiro: {item.parceiroNome}</p>
              )}
            </div>
            <Badge className={`text-[10px] shrink-0 ${prioridadeColor(item.prioridade)}`}>
              {item.prioridade === 'alta' ? 'Alta' : item.prioridade === 'media' ? 'Média' : 'Baixa'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {procStatus && (
              <Badge variant="outline" className={`text-[9px] gap-0.5 ${procStatus.color}`}>
                <FileKey className="w-3 h-3" /> {procStatus.label}
              </Badge>
            )}
            {item.analistaNome && (
              <Badge variant="outline" className="text-[9px] gap-0.5">
                {item.analistaNome}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              {item.status === 'fazendo' && item.dataInicioApuracao ? (
                <ActiveTimer startTime={item.dataInicioApuracao} />
              ) : item.tempoGastoMs ? (
                <span className="text-[11px] font-data text-muted-foreground">{formatDuration(item.tempoGastoMs)}</span>
              ) : (
                <span className="text-[11px] text-muted-foreground">—</span>
              )}
              {item.status === 'a_fazer' && item.dataInsercao && (
                <span className="text-[10px] text-muted-foreground ml-1 flex items-center gap-0.5">
                  <CalendarClock className="w-3 h-3" /> {formatWaitTime(item.dataInsercao)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {item.status === 'a_fazer' && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 text-blue-600" onClick={() => onAction('iniciar', item.id)}>
                  <Play className="w-3 h-3" /> Iniciar
                </Button>
              )}
              {item.status === 'fazendo' && (
                <>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 text-emerald-600" onClick={() => onAction('concluir', item.id)}>
                    <CheckCircle2 className="w-3 h-3" /> Concluir
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 text-red-600" onClick={() => onAction('cancelar', item.id)}>
                    <Pause className="w-3 h-3" /> Parar
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHistory(true)}>
                <History className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico — {item.clienteNome}</DialogTitle>
            <DialogDescription>Rastreamento de alterações e movimentações na fila.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3 pr-4">
              {[...item.historico].reverse().map(h => (
                <div key={h.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#0A2540] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">{h.acao}</p>
                    <p className="text-[11px] text-muted-foreground">{h.detalhes}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(h.data).toLocaleString('pt-BR')} — {h.usuarioNome}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function FilaApuracao() {
  const { state, dispatch, getPermissoes } = useApp();
  const perm = getPermissoes();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [newStatus, setNewStatus] = useState('');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });

  const filteredFila = useMemo(() => {
    if (!search) return state.filaApuracao;
    const s = search.toLowerCase();
    return state.filaApuracao.filter(item =>
      item.clienteNome.toLowerCase().includes(s) || item.clienteCnpj.includes(s) || (item.parceiroNome || '').toLowerCase().includes(s)
    );
  }, [state.filaApuracao, search]);

  const byStatus = useMemo(() => {
    const map: Record<string, ItemFilaApuracao[]> = {};
    state.statusApuracaoList.forEach(s => { map[s] = []; });
    filteredFila.forEach(item => {
      if (!map[item.status]) map[item.status] = [];
      map[item.status].push(item);
    });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        const prioOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
        const diff = (prioOrder[a.prioridade] ?? 3) - (prioOrder[b.prioridade] ?? 3);
        return diff !== 0 ? diff : a.ordem - b.ordem;
      });
    });
    return map;
  }, [filteredFila, state.statusApuracaoList]);

  const confirmAction = (title: string, description: string, action: () => void) => {
    setConfirmDialog({ open: true, title, description, action });
  };

  const handleAction = (action: string, itemId: string) => {
    const item = state.filaApuracao.find(i => i.id === itemId);
    const nome = item?.clienteNome || '';

    switch (action) {
      case 'iniciar':
        if (!perm.podeIniciarApuracao) { toast.error('Sem permissão para iniciar apuração.'); return; }
        confirmAction(
          'Iniciar Apuração',
          `Deseja iniciar a apuração de "${nome}"? A empresa será associada ao seu usuário e o cronômetro será iniciado.`,
          () => {
            dispatch({ type: 'INICIAR_APURACAO', payload: { itemId } });
            toast.success('Apuração iniciada!');
          }
        );
        break;
      case 'concluir':
        confirmAction(
          'Concluir Apuração',
          `Deseja concluir a apuração de "${nome}"? O cronômetro será parado e o status alterado para Concluído.`,
          () => {
            dispatch({ type: 'MUDAR_STATUS_APURACAO', payload: { itemId, novoStatus: 'concluido' } });
            toast.success('Apuração concluída!');
          }
        );
        break;
      case 'cancelar':
        confirmAction(
          'Cancelar Apuração',
          `Deseja cancelar a apuração de "${nome}"? A empresa voltará para o status "A Fazer" e o analista será desvinculado.`,
          () => {
            dispatch({ type: 'CANCELAR_APURACAO', payload: { itemId } });
            toast.info('Apuração cancelada.');
          }
        );
        break;
    }
  };

  const handleAddStatus = () => {
    if (!newStatus.trim()) return;
    const slug = newStatus.trim().toLowerCase().replace(/\s+/g, '_');
    if (state.statusApuracaoList.includes(slug)) { toast.error('Status já existe.'); return; }
    dispatch({ type: 'ADD_STATUS_APURACAO', payload: slug });
    setNewStatus('');
    toast.success(`Status "${newStatus}" adicionado!`);
  };

  const handleChangePrioridade = (itemId: string, prioridade: 'alta' | 'media' | 'baixa') => {
    if (!perm.podeAlterarPrioridadeFila) { toast.error('Sem permissão.'); return; }
    const item = state.filaApuracao.find(i => i.id === itemId);
    confirmAction(
      'Alterar Prioridade',
      `Deseja alterar a prioridade de "${item?.clienteNome}" para "${prioridade === 'alta' ? 'Alta' : prioridade === 'media' ? 'Média' : 'Baixa'}"?`,
      () => {
        dispatch({ type: 'SET_PRIORIDADE_FILA', payload: { itemId, prioridade } });
        toast.success('Prioridade alterada!');
      }
    );
  };

  const handleMoveStatus = (itemId: string, novoStatus: string) => {
    if (!perm.podeAlterarOrdemFila) { toast.error('Sem permissão.'); return; }
    const item = state.filaApuracao.find(i => i.id === itemId);
    confirmAction(
      'Alterar Status',
      `Deseja mover "${item?.clienteNome}" para "${statusLabel(novoStatus)}"?`,
      () => {
        dispatch({ type: 'MUDAR_STATUS_APURACAO', payload: { itemId, novoStatus } });
        toast.success('Status alterado!');
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={v => setConfirmDialog(prev => ({ ...prev, open: v }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-[#0A2540] hover:bg-[#0A2540]/90" onClick={() => { confirmDialog.action(); setConfirmDialog(prev => ({ ...prev, open: false })); }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fila de Apuração</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciamento e acompanhamento das apurações tributárias</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="sm" className={`gap-1.5 text-xs ${viewMode === 'kanban' ? 'bg-[#0A2540]' : ''}`} onClick={() => setViewMode('kanban')}>
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </Button>
          <Button variant={viewMode === 'lista' ? 'default' : 'outline'} size="sm" className={`gap-1.5 text-xs ${viewMode === 'lista' ? 'bg-[#0A2540]' : ''}`} onClick={() => setViewMode('lista')}>
            <ListOrdered className="w-3.5 h-3.5" /> Lista
          </Button>
        </div>
      </div>

      {/* Search + Add Status */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por empresa, CNPJ ou parceiro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            {perm.podeAlterarOrdemFila && (
              <div className="flex items-center gap-2">
                <Input placeholder="Novo status..." value={newStatus} onChange={e => setNewStatus(e.target.value)} className="h-9 text-sm w-40" />
                <Button size="sm" variant="outline" className="h-9 gap-1" onClick={handleAddStatus}>
                  <Plus className="w-3.5 h-3.5" /> Status
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {state.statusApuracaoList.map(status => (
          <Card key={status}>
            <CardContent className="py-3 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{statusLabel(status)}</p>
              <p className="text-2xl font-bold font-data mt-1">{byStatus[status]?.length || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${state.statusApuracaoList.length}, minmax(280px, 1fr))` }}>
          {state.statusApuracaoList.map(status => (
            <div key={status} className="space-y-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusColor(status)}`}>
                <span className="text-xs font-semibold">{statusLabel(status)}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">{byStatus[status]?.length || 0}</Badge>
              </div>
              <div className="space-y-2">
                {(byStatus[status] || []).map(item => (
                  <div key={item.id}>
                    <FilaCard item={item} onAction={handleAction} />
                    {/* Move buttons */}
                    {perm.podeAlterarOrdemFila && (
                      <div className="flex items-center gap-1 mt-1 px-1">
                        {state.statusApuracaoList.filter(s => s !== status).map(targetStatus => (
                          <Button key={targetStatus} variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] gap-0.5 text-muted-foreground"
                            onClick={() => handleMoveStatus(item.id, targetStatus)}>
                            <ChevronRight className="w-2.5 h-2.5" /> {statusLabel(targetStatus)}
                          </Button>
                        ))}
                        {perm.podeAlterarPrioridadeFila && (
                          <Select value={item.prioridade} onValueChange={v => handleChangePrioridade(item.id, v as any)}>
                            <SelectTrigger className="h-5 text-[9px] w-16 ml-auto"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="media">Média</SelectItem>
                              <SelectItem value="baixa">Baixa</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {(byStatus[status] || []).length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                    Nenhum item
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista View */}
      {viewMode === 'lista' && (
        <div className="space-y-2">
          {filteredFila.sort((a, b) => a.ordem - b.ordem).map(item => {
            const procStatus = procuracaoStatus(item);
            return (
              <Card key={item.id} className={`transition-all hover:shadow-md border-l-4 ${
                item.prioridade === 'alta' ? 'border-l-emerald-500' :
                item.prioridade === 'media' ? 'border-l-amber-500' : 'border-l-red-400'
              }`}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-data text-muted-foreground w-6 text-center">#{item.ordem}</span>
                      <div>
                        <p className="text-sm font-semibold">{item.clienteNome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground font-data">{item.clienteCnpj}</span>
                          {item.parceiroNome && <span className="text-[11px] text-muted-foreground">• {item.parceiroNome}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-[10px] ${statusColor(item.status)}`}>{statusLabel(item.status)}</Badge>
                      <Badge className={`text-[10px] ${prioridadeColor(item.prioridade)}`}>
                        {item.prioridade === 'alta' ? 'Alta' : item.prioridade === 'media' ? 'Média' : 'Baixa'}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {item.status === 'fazendo' && item.dataInicioApuracao ? (
                          <ActiveTimer startTime={item.dataInicioApuracao} />
                        ) : item.tempoGastoMs ? (
                          <span className="text-[11px] font-data text-muted-foreground">{formatDuration(item.tempoGastoMs)}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </div>
                      {procStatus && (
                        <Badge variant="outline" className={`text-[9px] gap-0.5 ${procStatus.color}`}>
                          <FileKey className="w-3 h-3" /> {procStatus.label}
                        </Badge>
                      )}
                      {item.status === 'a_fazer' && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-blue-600" onClick={() => handleAction('iniciar', item.id)}>
                          <Play className="w-3 h-3" /> Iniciar
                        </Button>
                      )}
                      {item.status === 'fazendo' && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-emerald-600" onClick={() => handleAction('concluir', item.id)}>
                          <CheckCircle2 className="w-3 h-3" /> Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
