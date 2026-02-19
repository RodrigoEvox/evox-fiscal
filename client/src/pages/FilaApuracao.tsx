import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ClipboardList, Play, Pause, CheckCircle, Clock, User, AlertTriangle, Eye, Loader2, Timer, Lock, Scale, FileText } from 'lucide-react';

const statusColors: Record<string, string> = {
  aguardando: 'bg-gray-100 text-gray-700', em_analise: 'bg-blue-100 text-blue-700',
  concluido: 'bg-green-100 text-green-700', pausado: 'bg-yellow-100 text-yellow-700',
};
const statusLabels: Record<string, string> = {
  aguardando: 'Aguardando', em_analise: 'Em Análise', concluido: 'Concluído', pausado: 'Pausado',
};
const prioridadeColors: Record<string, string> = {
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  baixa: 'bg-sky-100 text-sky-700 border-sky-200',
};

function formatTimer(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function FilaApuracao() {
  const { user } = useAuth();
  const [tab, setTab] = useState('fila');
  const [confirmAction, setConfirmAction] = useState<{ type: string; item: any } | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [observacao, setObservacao] = useState('');
  const [activeTimers, setActiveTimers] = useState<Record<number, number>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const utils = trpc.useUtils();

  const { data: filaItems = [], isLoading } = trpc.fila.list.useQuery();
  const { data: teses = [] } = trpc.teses.list.useQuery();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();

  const updateStatusMutation = trpc.fila.updateStatus.useMutation({
    onSuccess: () => { utils.fila.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveTimers(prev => {
        const next = { ...prev };
        filaItems.filter((i: any) => i.status === 'em_analise').forEach((i: any) => {
          next[i.id] = (next[i.id] || i.tempoGasto || 0) + 1;
        });
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [filaItems]);

  const aguardando = filaItems.filter((i: any) => i.status === 'aguardando');
  const emAnalise = filaItems.filter((i: any) => i.status === 'em_analise');
  const concluidos = filaItems.filter((i: any) => i.status === 'concluido');
  const pausados = filaItems.filter((i: any) => i.status === 'pausado');

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, item } = confirmAction;
    if (type === 'iniciar') {
      updateStatusMutation.mutate({ id: item.id, status: 'em_analise', analistaId: user?.id });
      toast.success('Análise iniciada!');
    } else if (type === 'pausar') {
      updateStatusMutation.mutate({ id: item.id, status: 'pausado' });
      toast.success('Análise pausada.');
    } else if (type === 'concluir') {
      updateStatusMutation.mutate({ id: item.id, status: 'concluido' });
      toast.success('Análise concluída!');
    }
    setConfirmAction(null);
    setObservacao('');
  };

  const getClienteInfo = (clienteId: number) => clientes.find((c: any) => c.id === clienteId);

  const getClienteTeses = (clienteId: number) => {
    const cliente = getClienteInfo(clienteId);
    if (!cliente) return [];
    return teses.filter((t: any) => {
      const regimeMatch = (t.aplicavelLucroReal && cliente.regimeTributario === 'lucro_real') ||
        (t.aplicavelLucroPresumido && cliente.regimeTributario === 'lucro_presumido') ||
        (t.aplicavelSimplesNacional && cliente.regimeTributario === 'simples_nacional');
      return regimeMatch && t.ativo;
    });
  };

  const renderFilaCard = (item: any, isFirst: boolean = false) => {
    const cliente = getClienteInfo(item.clienteId);
    const canInitiate = isFirst && item.status === 'aguardando';
    const procVencida = cliente?.procuracaoValidade ? new Date(cliente.procuracaoValidade) < new Date() : false;
    const semProc = !cliente?.procuracaoHabilitada;

    return (
      <Card key={item.id} className={`transition-all hover:shadow-md ${!canInitiate && item.status === 'aguardando' && !isFirst ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{cliente?.razaoSocial || `Cliente #${item.clienteId}`}</h3>
                <Badge className={prioridadeColors[item.prioridade]}>{item.prioridade === 'alta' ? 'Alta' : item.prioridade === 'media' ? 'Média' : 'Baixa'}</Badge>
                <Badge className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{cliente?.cnpj || ''} — {cliente?.regimeTributario?.replace(/_/g, ' ') || ''}</p>
              {(procVencida || semProc) && (
                <div className="flex gap-2 mt-2">
                  {!cliente?.procuracaoHabilitada && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" /> Sem Procuração</Badge>}
                  {procVencida && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" /> Procuração Vencida</Badge>}
                </div>
              )}
              {item.status === 'em_analise' && (
                <div className="flex items-center gap-2 mt-2">
                  <Timer className="w-3 h-3 text-blue-500" />
                  <span className="text-xs font-mono text-blue-600">{formatTimer(activeTimers[item.id] || item.tempoGasto || 0)}</span>
                  {item.analistaId && <span className="text-xs text-muted-foreground">Analista #{item.analistaId}</span>}
                </div>
              )}
              {item.status === 'concluido' && <p className="text-xs text-muted-foreground mt-1">Tempo total: {formatTimer(item.tempoGasto || 0)}</p>}
            </div>
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm" onClick={() => setViewItem(item)}><Eye className="w-4 h-4" /></Button>
              {item.status === 'aguardando' && (
                <Button variant="ghost" size="sm" disabled={!canInitiate}
                  onClick={() => canInitiate ? setConfirmAction({ type: 'iniciar', item }) : toast.error('Analise a primeira empresa da fila!')}
                  title={canInitiate ? 'Iniciar análise' : 'Bloqueado - não é a primeira da fila'}>
                  {canInitiate ? <Play className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-gray-400" />}
                </Button>
              )}
              {item.status === 'em_analise' && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'pausar', item })}><Pause className="w-4 h-4 text-yellow-600" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'concluir', item })}><CheckCircle className="w-4 h-4 text-green-600" /></Button>
                </>
              )}
              {item.status === 'pausado' && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'iniciar', item })}><Play className="w-4 h-4 text-green-600" /></Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Fila de Apuração</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciamento de análises tributárias</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-gray-500" /> <span className="font-medium">{aguardando.length}</span> aguardando</div>
          <div className="flex items-center gap-1"><Play className="w-4 h-4 text-blue-500" /> <span className="font-medium">{emAnalise.length}</span> em análise</div>
          <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> <span className="font-medium">{concluidos.length}</span> concluídos</div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="fila">Fila</TabsTrigger>
          <TabsTrigger value="analistas">Por Analista</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <>
              {emAnalise.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1"><Play className="w-4 h-4" /> Em Análise ({emAnalise.length})</h3>
                  <div className="space-y-2">{emAnalise.map((i: any) => renderFilaCard(i, false))}</div>
                </div>
              )}
              {pausados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-yellow-600 mb-2 flex items-center gap-1"><Pause className="w-4 h-4" /> Pausados ({pausados.length})</h3>
                  <div className="space-y-2">{pausados.map((i: any) => renderFilaCard(i, false))}</div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1"><Clock className="w-4 h-4" /> Aguardando ({aguardando.length})</h3>
                {aguardando.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma empresa na fila.</CardContent></Card>
                ) : (
                  <div className="space-y-2">
                    {aguardando.map((item: any, idx: number) => (
                      <div key={item.id} className="relative">
                        {idx > 0 && <div className="absolute -top-1 right-2 z-10"><Badge variant="outline" className="text-[10px] bg-white"><Lock className="w-3 h-3 mr-1" /> Bloqueado</Badge></div>}
                        {renderFilaCard(item, idx === 0)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="analistas" className="space-y-4 mt-4">
          {(() => {
            const analistas = new Map<number, any[]>();
            filaItems.filter((i: any) => i.analistaId).forEach((i: any) => {
              if (!analistas.has(i.analistaId)) analistas.set(i.analistaId, []);
              analistas.get(i.analistaId)!.push(i);
            });
            if (analistas.size === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum analista com tarefas atribuídas.</CardContent></Card>;
            return Array.from(analistas.entries()).map(([analistaId, items]) => (
              <Card key={analistaId}>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Analista #{analistaId}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2 text-xs mb-2">
                    <Badge className="bg-blue-100 text-blue-700">{items.filter(i => i.status === 'em_analise').length} em análise</Badge>
                    <Badge className="bg-green-100 text-green-700">{items.filter(i => i.status === 'concluido').length} concluídos</Badge>
                    <Badge className="bg-yellow-100 text-yellow-700">{items.filter(i => i.status === 'pausado').length} pausados</Badge>
                  </div>
                  {items.map((i: any) => {
                    const cli = getClienteInfo(i.clienteId);
                    return (
                      <div key={i.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <p className="text-sm font-medium">{cli?.razaoSocial || `#${i.clienteId}`}</p>
                          <p className="text-xs text-muted-foreground">{statusLabels[i.status]} — {formatTimer(activeTimers[i.id] || i.tempoGasto || 0)}</p>
                        </div>
                        <Badge className={statusColors[i.status]}>{statusLabels[i.status]}</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ));
          })()}
        </TabsContent>

        <TabsContent value="concluidos" className="space-y-2 mt-4">
          {concluidos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma análise concluída.</CardContent></Card>
          ) : concluidos.map((i: any) => renderFilaCard(i, false))}
        </TabsContent>
      </Tabs>

      {/* View Item Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewItem && (() => {
            const cliente = getClienteInfo(viewItem.clienteId);
            const clienteTeses = getClienteTeses(viewItem.clienteId);
            const redFlags: string[] = [];
            if (cliente) {
              if (cliente.dataAbertura) {
                const years = (Date.now() - new Date(cliente.dataAbertura).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                if (years < 2) redFlags.push('Empresa aberta há menos de 2 anos');
              }
              if (cliente.valorMedioGuias && Number(cliente.valorMedioGuias) < 20000) redFlags.push('Valor médio de guias inferior a R$ 20.000');
              if (['baixada', 'inapta', 'suspensa'].includes(cliente.situacaoCadastral || '')) redFlags.push('Situação cadastral irregular');
             if (!cliente.procuracaoHabilitada) redFlags.push('Sem procuração eletrônica');
              if (cliente.procuracaoValidade && new Date(cliente.procuracaoValidade) < new Date()) redFlags.push('Procuração vencida');
            }
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Informações para Análise</DialogTitle>
                  <DialogDescription>{cliente?.razaoSocial || `Cliente #${viewItem.clienteId}`}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="info">
                  <TabsList className="mb-3">
                    <TabsTrigger value="info">Dados da Empresa</TabsTrigger>
                    <TabsTrigger value="teses">Teses Aplicáveis ({clienteTeses.length})</TabsTrigger>
                    <TabsTrigger value="flags">Red Flags ({redFlags.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="space-y-3">
                    {cliente ? (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><Label className="text-xs text-muted-foreground">CNPJ</Label><p className="font-mono">{cliente.cnpj}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Regime Tributário</Label><p className="capitalize">{cliente.regimeTributario?.replace(/_/g, ' ')}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Atividade</Label><p className="capitalize">{cliente.atividadePrincipalDescritivo || cliente.cnaePrincipalDescricao || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Situação Cadastral</Label><p className="capitalize">{cliente.situacaoCadastral}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Valor Médio Guias</Label><p>R$ {Number(cliente.valorMedioGuias || 0).toLocaleString('pt-BR')}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Data Abertura</Label><p>{cliente.dataAbertura ? new Date(cliente.dataAbertura).toLocaleDateString('pt-BR') : 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Procuração</Label><p>{cliente.procuracaoHabilitada ? (cliente.procuracaoCertificado || 'Habilitada') : 'Não cadastrada'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Validade Procuração</Label><p>{cliente.procuracaoValidade ? new Date(cliente.procuracaoValidade).toLocaleDateString('pt-BR') : 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Prioridade</Label>
                          <Badge className={prioridadeColors[cliente.prioridade || 'baixa']}>{cliente.prioridade === 'alta' ? 'Alta' : cliente.prioridade === 'media' ? 'Média' : 'Baixa'}</Badge>
                        </div>
                        <div><Label className="text-xs text-muted-foreground">Segmento</Label><p>{cliente.segmentoEconomico || 'N/A'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Classificação</Label>
                          <Badge className={`text-[10px] ${cliente.classificacaoCliente === 'novo' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{cliente.classificacaoCliente === 'novo' ? 'Novo' : 'Base'}</Badge>
                        </div>
                        <div><Label className="text-xs text-muted-foreground">Folha Pagamento Média</Label><p>R$ {Number(cliente.folhaPagamentoMedia || 0).toLocaleString('pt-BR')}</p></div>
                      </div>
                    ) : <p className="text-muted-foreground">Dados não encontrados.</p>}
                  </TabsContent>
                  <TabsContent value="teses" className="space-y-2">
                    {clienteTeses.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma tese aplicável.</p>
                    ) : clienteTeses.map((t: any) => (
                      <Card key={t.id}><CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div><p className="text-sm font-medium flex items-center gap-1"><Scale className="w-3 h-3" /> {t.nome}</p><p className="text-xs text-muted-foreground">{t.tributoEnvolvido} — {t.classificacao}</p></div>
                          <Badge className={prioridadeColors[t.potencialFinanceiro === 'muito_alto' || t.potencialFinanceiro === 'alto' ? 'alta' : t.potencialFinanceiro === 'medio' ? 'media' : 'baixa']}>
                            {t.potencialFinanceiro}
                          </Badge>
                        </div>
                      </CardContent></Card>
                    ))}
                  </TabsContent>
                  <TabsContent value="flags" className="space-y-2">
                    {redFlags.length === 0 ? (
                      <div className="py-4 text-center"><CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-sm text-green-600">Nenhuma red flag.</p></div>
                    ) : redFlags.map((flag, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-200">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-sm text-red-700">{flag}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => { setConfirmAction(null); setObservacao(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'iniciar' ? 'Iniciar Análise' : confirmAction?.type === 'pausar' ? 'Pausar Análise' : 'Concluir Análise'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'iniciar' ? 'Deseja iniciar a análise? O cronômetro será ativado.' :
               confirmAction?.type === 'pausar' ? 'Deseja pausar? O tempo será registrado.' : 'Deseja concluir? Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(confirmAction?.type === 'pausar' || confirmAction?.type === 'concluir') && (
            <div className="py-2"><Label className="text-xs">Observação</Label><Textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={3} /></div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
