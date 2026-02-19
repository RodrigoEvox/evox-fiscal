import { trpc } from '@/lib/trpc';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, Flag, AlertTriangle, CheckCircle2, XCircle,
  FileText, BarChart3, Clock, User, Shield, Loader2, RefreshCw,
  ShieldAlert, ShieldCheck, CalendarClock,
} from 'lucide-react';

export default function ClienteDetalhe() {
  const [, params] = useRoute('/clientes/:id');
  const [, setLocation] = useLocation();
  const clienteId = Number(params?.id);

  const utils = trpc.useUtils();
  const { data: cliente, isLoading } = trpc.clientes.getById.useQuery({ id: clienteId }, { enabled: !!clienteId });
  const { data: teses = [] } = trpc.teses.list.useQuery();
  const { data: relatorios = [] } = trpc.relatorios.list.useQuery();
  const { data: filaItems = [] } = trpc.fila.list.useQuery();
  const { data: parceiros = [] } = trpc.parceiros.list.useQuery();
  const { data: executivos = [] } = trpc.executivos.list.useQuery();

  const runAnalise = trpc.clientes.runAnalise.useMutation({
    onSuccess: () => {
      utils.clientes.getById.invalidate({ id: clienteId });
      utils.relatorios.list.invalidate();
      toast.success('Análise executada com sucesso!');
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
        <Button variant="outline" onClick={() => setLocation('/clientes')}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
      </div>
    );
  }

  const redFlags = Array.isArray(cliente.redFlags) ? cliente.redFlags : [];
  const alertas = Array.isArray(cliente.alertasInformacao) ? cliente.alertasInformacao : [];
  const clienteRelatorios = relatorios.filter((r: any) => r.clienteId === clienteId);
  const clienteFila = filaItems.filter((f: any) => f.clienteId === clienteId);
  // Get opportunities from the latest report for this client
  const latestReport = clienteRelatorios.length > 0 ? clienteRelatorios[clienteRelatorios.length - 1] : null;
  const oportunidadesAceitas = latestReport ? (Array.isArray(latestReport.tesesAplicaveis) ? latestReport.tesesAplicaveis : []) : [];
  const oportunidadesDescartadas = latestReport ? (Array.isArray(latestReport.tesesDescartadas) ? latestReport.tesesDescartadas : []) : [];
  const parceiro = parceiros.find((p: any) => p.id === cliente.parceiroId);
  const parceiroNomeDisplay = parceiro ? (parceiro.apelido || parceiro.nomeCompleto) : null;
  const parceiroPai = parceiro?.ehSubparceiro && parceiro?.parceiroPaiId ? parceiros.find((p: any) => p.id === parceiro.parceiroPaiId) : null;
  const parceiroPaiNome = parceiroPai ? (parceiroPai.apelido || parceiroPai.nomeCompleto) : null;

  // Procuração status
  const procStatus = (() => {
    if (!cliente.procuracaoHabilitada) return 'desabilitada';
    if (!cliente.procuracaoValidade) return 'habilitada';
    const validade = new Date(cliente.procuracaoValidade);
    const hoje = new Date();
    const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias < 0) return 'vencida';
    if (diffDias <= 7) return 'vencendo';
    return 'habilitada';
  })();

  const prioridadeColor = cliente.prioridade === 'alta' ? 'bg-red-500' : cliente.prioridade === 'media' ? 'bg-amber-500' : 'bg-sky-400';
  const prioridadeText = cliente.prioridade === 'alta' ? 'Alta' : cliente.prioridade === 'media' ? 'Média' : 'Baixa';
  const prioridadeBg = cliente.prioridade === 'alta' ? 'bg-red-100 text-red-700' : cliente.prioridade === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700';

  const fmt = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/clientes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`w-2 h-14 rounded-full ${prioridadeColor}`} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{cliente.razaoSocial}</h1>
              <Badge className={prioridadeBg}>{prioridadeText}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="font-mono">{cliente.cnpj}</span>
              {cliente.nomeFantasia && <span>• {cliente.nomeFantasia}</span>}
              {parceiroNomeDisplay && <Badge variant="outline" className="text-[10px]">{parceiroNomeDisplay}{parceiro?.ehSubparceiro ? ' (Subparceiro)' : ''}</Badge>}
              {parceiroPaiNome && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Parceiro Principal: {parceiroPaiNome}</Badge>}
              {parceiro?.executivoComercialId && (() => { const exec = (executivos as any[]).find((e: any) => e.id === parceiro.executivoComercialId); return exec ? <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Exec. Comercial: {exec.nome}</Badge> : null; })()}
              <Badge className={`text-[10px] ${cliente.classificacaoCliente === 'novo' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {cliente.classificacaoCliente === 'novo' ? 'Cliente Novo' : 'Cliente Base'}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={() => runAnalise.mutate({ id: clienteId })} disabled={runAnalise.isPending} className="gap-2">
          {runAnalise.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Executar Nova Análise
        </Button>
      </div>

      {/* Alerta de Procuração */}
      {procStatus === 'vencida' && (
        <div className="p-4 rounded-lg bg-red-100 border border-red-200 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Procuração Eletrônica Vencida</p>
            <p className="text-xs text-red-600">A procuração deste cliente está vencida. Providencie a renovação imediatamente.</p>
          </div>
        </div>
      )}
      {procStatus === 'vencendo' && (
        <div className="p-4 rounded-lg bg-amber-100 border border-amber-200 flex items-center gap-3">
          <CalendarClock className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Procuração Próxima ao Vencimento</p>
            <p className="text-xs text-amber-600">A procuração deste cliente vence em menos de 7 dias. Providencie a renovação.</p>
          </div>
        </div>
      )}
      {procStatus === 'desabilitada' && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-600">Procuração Não Habilitada</p>
            <p className="text-xs text-red-500">Este cliente não possui procuração eletrônica habilitada.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="panorama">
        <TabsList>
          <TabsTrigger value="panorama">Panorama Geral</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades ({oportunidadesAceitas.length})</TabsTrigger>
          <TabsTrigger value="descartadas">Descartadas ({oportunidadesDescartadas.length})</TabsTrigger>
          <TabsTrigger value="analises">Análises ({clienteRelatorios.length})</TabsTrigger>
          <TabsTrigger value="fila">Fila ({clienteFila.length})</TabsTrigger>
        </TabsList>

        {/* Panorama Geral */}
        <TabsContent value="panorama" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dados Cadastrais */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Dados Cadastrais</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <InfoRow label="Regime Tributário" value={cliente.regimeTributario?.replace('_', ' ') || '-'} />
                <InfoRow label="Situação Cadastral" value={cliente.situacaoCadastral || '-'} />
                <InfoRow label="Data de Abertura" value={cliente.dataAbertura || '-'} />
                <InfoRow label="CNAE" value={`${cliente.cnaePrincipal || '-'} ${cliente.cnaePrincipalDescricao ? `- ${cliente.cnaePrincipalDescricao}` : ''}`} />
                <InfoRow label="Segmento" value={cliente.segmentoEconomico || '-'} />
                <InfoRow label="Estado" value={cliente.estado || '-'} />
                <InfoRow label="Natureza Jurídica" value={cliente.naturezaJuridica || '-'} />
              </CardContent>
            </Card>

            {/* Dados Financeiros */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Dados Financeiros</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <InfoRow label="Faturamento Médio" value={fmt(cliente.faturamentoMedioMensal)} />
                <InfoRow label="Valor Médio Guias" value={fmt(cliente.valorMedioGuias)} />
                <InfoRow label="Folha Pagamento" value={fmt(cliente.folhaPagamentoMedia)} />
              </CardContent>
            </Card>

            {/* Procuração e Rastreamento */}
            <Card className={procStatus === 'vencida' ? 'border-red-200' : procStatus === 'vencendo' ? 'border-amber-200' : ''}>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Procuração e Rastreamento</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-24">Status</span>
                  {procStatus === 'vencida' && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Vencida</Badge>}
                  {procStatus === 'vencendo' && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Vencendo</Badge>}
                  {procStatus === 'habilitada' && <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Válida</Badge>}
                  {procStatus === 'desabilitada' && <Badge className="bg-red-50 text-red-500 border-red-100 text-[10px]">Desabilitada</Badge>}
                </div>
                {cliente.procuracaoHabilitada && (
                  <>
                    <InfoRow label="Certificado" value={cliente.procuracaoCertificado || '-'} />
                    <InfoRow label="Validade" value={cliente.procuracaoValidade ? new Date(cliente.procuracaoValidade).toLocaleDateString('pt-BR') : '-'} />
                  </>
                )}
                <InfoRow label="Classificação" value={cliente.classificacaoCliente === 'novo' ? 'Cliente Novo' : 'Cliente Base'} />
                <Separator className="my-2" />
                <InfoRow label="Cadastrado por" value={cliente.usuarioCadastroNome || '-'} />
                <InfoRow label="Data Cadastro" value={cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('pt-BR') : '-'} />
                {cliente.excecoesEspecificidades && (
                  <>
                    <Separator className="my-2" />
                    <div>
                      <span className="text-muted-foreground">Exceções:</span>
                      <p className="mt-1 text-foreground">{cliente.excecoesEspecificidades}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Red Flags */}
          {redFlags.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <Flag className="w-4 h-4" /> Red Flags ({redFlags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {redFlags.map((rf: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-white border border-red-100">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-red-800">{rf.tipo || rf}</p>
                        {rf.descricao && <p className="text-[10px] text-red-600">{rf.descricao}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {alertas.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-4 h-4" /> Alertas de Informação ({alertas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alertas.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-[10px]">{a.campo}</Badge>
                      <span className="text-amber-700">Justificativa: {a.justificativa}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Oportunidades Aceitas */}
        <TabsContent value="oportunidades" className="mt-4">
          {oportunidadesAceitas.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhuma oportunidade aplicável identificada.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {oportunidadesAceitas.map((op: any, i: number) => {
                const tese = teses.find((t: any) => t.id === op.teseId);
                return (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-semibold text-sm">{tese?.nome || op.teseNome || 'Tese'}</p>
                            <p className="text-xs text-muted-foreground">{tese?.classificacao || '-'} • {tese?.tipo || '-'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">{fmt(op.valorEstimado)}</p>
                          <p className="text-[10px] text-muted-foreground">Economia estimada/mês</p>
                        </div>
                      </div>
                      {op.fundamentacao && <p className="text-xs text-muted-foreground mt-2">{op.fundamentacao}</p>}
                    </CardContent>
                  </Card>
                );
              })}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-800">Total de economia estimada</span>
                  <span className="text-lg font-bold text-green-700">
                    {fmt(oportunidadesAceitas.reduce((sum: number, o: any) => sum + (Number(o.valorEstimado) || 0), 0))}
                    <span className="text-xs font-normal">/mês</span>
                  </span>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Oportunidades Descartadas */}
        <TabsContent value="descartadas" className="mt-4">
          {oportunidadesDescartadas.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhuma oportunidade descartada.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {oportunidadesDescartadas.map((op: any, i: number) => {
                const tese = teses.find((t: any) => t.id === op.teseId);
                return (
                  <Card key={i} className="opacity-70">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-sm">{tese?.nome || op.teseNome || 'Tese'}</p>
                          <p className="text-xs text-muted-foreground">Motivo: {op.motivo || 'Não aplicável ao perfil do cliente'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Análises */}
        <TabsContent value="analises" className="mt-4">
          {clienteRelatorios.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhuma análise realizada para este cliente.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {clienteRelatorios.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Análise #{r.id}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{fmt(r.valorTotalEstimado)}</p>
                      <p className="text-[10px] text-muted-foreground">{r.totalTesesAplicaveis || 0} teses aplicáveis</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Fila */}
        <TabsContent value="fila" className="mt-4">
          {clienteFila.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Este cliente não está na fila de apuração.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {clienteFila.map((f: any) => (
                <Card key={f.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Status: <Badge variant="outline">{f.status}</Badge></p>
                        <p className="text-xs text-muted-foreground">
                          {f.analistaNome ? `Analista: ${f.analistaNome}` : 'Sem analista atribuído'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString('pt-BR')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground capitalize">{value}</span>
    </div>
  );
}
