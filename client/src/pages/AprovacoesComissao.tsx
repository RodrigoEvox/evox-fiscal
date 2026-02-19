import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import {
  CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, AlertTriangle,
  ArrowUpRight, ArrowDownRight, User, Briefcase,
} from 'lucide-react';

export default function AprovacoesComissao() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: pendentes = [], isLoading: loadingPendentes } = trpc.aprovacaoComissao.listPendentes.useQuery();
  const { data: todas = [], isLoading: loadingTodas } = trpc.aprovacaoComissao.listAll.useQuery();
  const { data: parceiros = [] } = trpc.parceiros.list.useQuery();
  const { data: servicos = [] } = trpc.servicos.list.useQuery();
  const { data: modelos = [] } = trpc.modelosParceria.list.useQuery();
  const { data: users = [] } = trpc.users.list.useQuery();

  const [actionDialog, setActionDialog] = useState<{ type: 'aprovar' | 'rejeitar'; item: any } | null>(null);
  const [observacao, setObservacao] = useState('');

  const aprovar = trpc.aprovacaoComissao.aprovar.useMutation({
    onSuccess: () => {
      utils.aprovacaoComissao.listPendentes.invalidate();
      utils.aprovacaoComissao.listAll.invalidate();
      toast.success('Comissão aprovada com sucesso!');
      setActionDialog(null);
      setObservacao('');
    },
    onError: (err) => toast.error(err.message),
  });

  const rejeitar = trpc.aprovacaoComissao.rejeitar.useMutation({
    onSuccess: () => {
      utils.aprovacaoComissao.listPendentes.invalidate();
      utils.aprovacaoComissao.listAll.invalidate();
      toast.success('Comissão rejeitada.');
      setActionDialog(null);
      setObservacao('');
    },
    onError: (err) => toast.error(err.message),
  });

  const historico = useMemo(() => {
    return todas.filter((a: any) => a.status !== 'pendente');
  }, [todas]);

  function getParceiroNome(id: number) {
    const p = parceiros.find((p: any) => p.id === id);
    return p ? (p.apelido || p.nomeCompleto) : `Parceiro #${id}`;
  }

  function getServicoNome(id: number) {
    const s = servicos.find((s: any) => s.id === id);
    return s ? s.nome : `Serviço #${id}`;
  }

  function getModeloNome(id: number) {
    const m = modelos.find((m: any) => m.id === id);
    return m ? m.nome : `Modelo #${id}`;
  }

  function getUserNome(id: number) {
    const u = users.find((u: any) => u.id === id);
    return u ? u.name : `Usuário #${id}`;
  }

  function handleAction() {
    if (!actionDialog) return;
    if (actionDialog.type === 'aprovar') {
      aprovar.mutate({ id: actionDialog.item.id, observacao: observacao || undefined });
    } else {
      rejeitar.mutate({ id: actionDialog.item.id, observacao: observacao || undefined });
    }
  }

  const renderCard = (item: any, showActions: boolean) => {
    const parceiro = getParceiroNome(item.parceiroId);
    const servico = getServicoNome(item.servicoId);
    const modelo = getModeloNome(item.modeloParceriaId);
    const solicitante = getUserNome(item.solicitadoPorId);
    const pctSolicitado = Number(item.percentualSolicitado);
    const pctPadrao = Number(item.percentualPadrao);
    const diff = pctSolicitado - pctPadrao;

    return (
      <Card key={item.id} className={`${item.status === 'pendente' ? 'border-amber-200' : item.status === 'aprovado' ? 'border-green-200' : 'border-red-200'}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-xs gap-1">
                  <User className="w-3 h-3" /> {parceiro}
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Briefcase className="w-3 h-3" /> {servico}
                </Badge>
                <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">{modelo}</Badge>
                {item.status === 'pendente' && (
                  <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 gap-1">
                    <Clock className="w-3 h-3" /> Pendente
                  </Badge>
                )}
                {item.status === 'aprovado' && (
                  <Badge className="text-xs bg-green-100 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Aprovado
                  </Badge>
                )}
                {item.status === 'rejeitado' && (
                  <Badge className="text-xs bg-red-100 text-red-700 border-red-200 gap-1">
                    <XCircle className="w-3 h-3" /> Rejeitado
                  </Badge>
                )}
              </div>

              {/* Percentuais */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Padrão</p>
                  <p className="text-lg font-bold text-muted-foreground">{pctPadrao}%</p>
                </div>
                <div className="flex items-center gap-1">
                  {diff > 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-red-500" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-amber-500" />
                  )}
                  <span className={`text-sm font-semibold ${diff > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Solicitado</p>
                  <p className={`text-lg font-bold ${diff > 0 ? 'text-red-600' : 'text-amber-600'}`}>{pctSolicitado}%</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Solicitado por: <strong>{solicitante}</strong></span>
                <span>Em: {new Date(item.solicitadoEm).toLocaleDateString('pt-BR')} às {new Date(item.solicitadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                {item.aprovadoPorId && (
                  <span>{item.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'} por: <strong>{getUserNome(item.aprovadoPorId)}</strong></span>
                )}
                {item.aprovadoEm && (
                  <span>Em: {new Date(item.aprovadoEm).toLocaleDateString('pt-BR')}</span>
                )}
              </div>

              {/* Observação */}
              {item.observacao && (
                <div className="p-2 rounded bg-muted/50 text-xs">
                  <span className="text-muted-foreground">Observação:</span> {item.observacao}
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  className="gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => { setActionDialog({ type: 'aprovar', item }); setObservacao(''); }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => { setActionDialog({ type: 'rejeitar', item }); setObservacao(''); }}
                >
                  <XCircle className="w-4 h-4" /> Rejeitar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aprovações de Comissão</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as solicitações de comissão acima do padrão que precisam de aprovação.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{pendentes.length}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{historico.filter((h: any) => h.status === 'aprovado').length}</p>
              <p className="text-xs text-muted-foreground">Aprovadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{historico.filter((h: any) => h.status === 'rejeitado').length}</p>
              <p className="text-xs text-muted-foreground">Rejeitadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes" className="gap-1">
            <AlertTriangle className="w-4 h-4" /> Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1">
            <ShieldCheck className="w-4 h-4" /> Histórico ({historico.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-4 space-y-3">
          {loadingPendentes ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : pendentes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-300" />
                <p className="text-sm">Nenhuma solicitação pendente de aprovação.</p>
              </CardContent>
            </Card>
          ) : (
            pendentes.map((item: any) => renderCard(item, true))
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4 space-y-3">
          {loadingTodas ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : historico.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="text-sm">Nenhum histórico de aprovações.</p>
              </CardContent>
            </Card>
          ) : (
            historico.map((item: any) => renderCard(item, false))
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => { if (!open) setActionDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'aprovar' ? 'Aprovar Comissão' : 'Rejeitar Comissão'}
            </DialogTitle>
          </DialogHeader>
          {actionDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parceiro:</span>
                  <span className="font-medium">{getParceiroNome(actionDialog.item.parceiroId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-medium">{getServicoNome(actionDialog.item.servicoId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comissão Padrão:</span>
                  <span className="font-medium">{Number(actionDialog.item.percentualPadrao)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comissão Solicitada:</span>
                  <span className={`font-bold ${Number(actionDialog.item.percentualSolicitado) > Number(actionDialog.item.percentualPadrao) ? 'text-red-600' : 'text-amber-600'}`}>
                    {Number(actionDialog.item.percentualSolicitado)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observação (opcional)</label>
                <Textarea
                  placeholder="Adicione uma observação sobre esta decisão..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancelar</Button>
            <Button
              onClick={handleAction}
              disabled={aprovar.isPending || rejeitar.isPending}
              className={actionDialog?.type === 'aprovar' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionDialog?.type === 'rejeitar' ? 'destructive' : 'default'}
            >
              {(aprovar.isPending || rejeitar.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {actionDialog?.type === 'aprovar' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
