import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Calculator, Loader2, Clock, AlertTriangle, CheckCircle,
  User, FileText, ClipboardList, Download, Building2, BarChart3, Handshake,
  Paperclip, ShieldCheck, ShieldAlert, ShieldOff, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FILA_LABELS: Record<string, string> = {
  apuracao: 'Apuração',
  retificacao: 'Retificação',
  compensacao: 'Compensação',
  ressarcimento: 'Ressarcimento',
  restituicao: 'Restituição',
};

interface ClientSummaryPanelProps {
  taskId: number;
  open: boolean;
  onClose: () => void;
  filaLabel?: string;
}

export default function ClientSummaryPanel({ taskId, open, onClose, filaLabel }: ClientSummaryPanelProps) {
  const { data, isLoading } = trpc.creditRecovery.credito.tasks.apuracaoSummary.useQuery(
    { taskId },
    { enabled: open && !!taskId }
  );

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch { return d; }
  };
  const formatDateTime = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };
  const formatCurrency = (v: number | string | null | undefined) => {
    if (!v) return 'R$ 0,00';
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  const regimeLabel = (r: string | null | undefined) => {
    if (!r) return '—';
    const map: Record<string, string> = { simples_nacional: 'Simples Nacional', lucro_presumido: 'Lucro Presumido', lucro_real: 'Lucro Real' };
    return map[r] || r;
  };
  const statusLabel = (s: string | null | undefined) => {
    if (!s) return '—';
    const map: Record<string, { label: string; color: string }> = {
      a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
      fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
      feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
      concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
    };
    return map[s] || { label: s, color: 'bg-gray-100 text-gray-800' };
  };
  const slaLabel = (s: string | null | undefined) => {
    if (s === 'vencido') return { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (s === 'atencao') return { label: 'Atenção', color: 'bg-amber-100 text-amber-800', icon: Clock };
    return { label: 'No Prazo', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle };
  };
  const procLabel = (s: string | null | undefined) => {
    if (s === 'habilitada') return { label: 'Habilitada', color: 'bg-emerald-100 text-emerald-800', icon: ShieldCheck };
    if (s === 'prox_vencimento') return { label: 'Vencendo', color: 'bg-amber-100 text-amber-800', icon: ShieldAlert };
    if (s === 'vencida') return { label: 'Vencida', color: 'bg-red-100 text-red-800', icon: ShieldOff };
    return { label: 'Sem', color: 'bg-gray-100 text-gray-600', icon: ShieldOff };
  };

  const task = data?.task;
  const teses = data?.teses || [];
  const rtis = data?.rtis || [];
  const arquivos = data?.arquivos || [];
  const auditLog = data?.auditLog || [];

  const resolvedFilaLabel = filaLabel || (task?.fila ? FILA_LABELS[task.fila] || task.fila : 'Apuração');

  const sla = slaLabel(task?.slaStatus);
  const proc = procLabel(task?.procuracaoStatus);
  const st = statusLabel(task?.status);
  const SlaIcon = sla.icon;
  const ProcIcon = proc.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando resumo...</span>
          </div>
        ) : !task ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Dados não encontrados.</div>
        ) : (
          <div className="flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{task.codigo}</span>
                    <Badge className={cn('text-xs', (st as any).color)}>{(st as any).label}</Badge>
                    <Badge className={cn('text-xs gap-1', sla.color)}>
                      <SlaIcon className="w-3 h-3" />
                      {sla.label}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-foreground truncate">{task.clienteNome || '—'}</h2>
                  <p className="text-sm text-muted-foreground">{task.clienteCnpj || ''} {task.clienteNomeFantasia ? `• ${task.clienteNomeFantasia}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Código do Cliente</p>
                  <p className="font-mono font-bold text-lg text-primary">{task.clienteCodigo || '—'}</p>
                </div>
              </div>
            </div>

            {/* Body — Grid Layout */}
            <div className="p-6 space-y-5">

              {/* Row 1: Dados do Cliente + Dados da Tarefa side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Dados do Cliente */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Dados do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Regime Tributário</span>
                        <p className="font-medium">{regimeLabel(task.clienteRegime)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Situação Cadastral</span>
                        <p className="font-medium capitalize">{task.clienteSituacao || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Classificação</span>
                        <p className="font-medium">
                          <Badge className={cn('text-[10px]', task.clienteClassificacao === 'novo' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700')}>
                            {task.clienteClassificacao === 'novo' ? 'Novo' : 'Base'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">CNAE Principal</span>
                        <p className="font-medium text-xs">{task.clienteCnae || '—'}</p>
                        {task.clienteCnaeDescricao && <p className="text-[10px] text-muted-foreground truncate">{task.clienteCnaeDescricao}</p>}
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Faturamento Médio</span>
                        <p className="font-medium">{formatCurrency(task.clienteFaturamento)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Valor Médio Guias</span>
                        <p className="font-medium">{formatCurrency(task.clienteGuias)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Folha Pagamento</span>
                        <p className="font-medium">{formatCurrency(task.clienteFolha)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">UF</span>
                        <p className="font-medium">{task.clienteEstado || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground text-xs">Atividades</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {task.clienteIndustrializa ? <Badge variant="outline" className="text-[10px]">Industrializa</Badge> : null}
                          {task.clienteComercializa ? <Badge variant="outline" className="text-[10px]">Comercializa</Badge> : null}
                          {task.clientePrestaServicos ? <Badge variant="outline" className="text-[10px]">Presta Serviços</Badge> : null}
                          {task.clienteContribuinteIcms ? <Badge variant="outline" className="text-[10px]">ICMS</Badge> : null}
                          {task.clienteContribuinteIpi ? <Badge variant="outline" className="text-[10px]">IPI</Badge> : null}
                          {task.clienteRegimeMonofasico ? <Badge variant="outline" className="text-[10px]">Monofásico</Badge> : null}
                          {!task.clienteIndustrializa && !task.clienteComercializa && !task.clientePrestaServicos && <span className="text-xs text-muted-foreground italic">Nenhuma</span>}
                        </div>
                      </div>
                      {(task.clienteProcessos || task.clienteParcelamentos) ? (
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs">Alertas</span>
                          <div className="flex gap-2 mt-0.5">
                            {task.clienteProcessos ? <Badge variant="destructive" className="text-[10px]">Processos Judiciais Ativos</Badge> : null}
                            {task.clienteParcelamentos ? <Badge className="text-[10px] bg-amber-100 text-amber-800">Parcelamentos Ativos</Badge> : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                {/* Dados da Tarefa */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      Dados da Tarefa na Fila
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Analista Responsável</span>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          {task.responsavelApelido || task.responsavelNomeCompleto || <span className="italic text-muted-foreground">Não atribuído</span>}
                        </p>
                        {task.responsavelEmail && <p className="text-[10px] text-muted-foreground">{task.responsavelEmail}</p>}
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Parceiro</span>
                        <p className="font-medium flex items-center gap-1">
                          <Handshake className="w-3.5 h-3.5 text-violet-500" />
                          {task.parceiroNome || <span className="italic text-muted-foreground">Sem parceiro</span>}
                        </p>
                        {task.parceiroCnpj && <p className="text-[10px] text-muted-foreground">{task.parceiroCnpj}</p>}
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Procuração</span>
                        <Badge className={cn('text-[10px] gap-1', proc.color)}>
                          <ProcIcon className="w-3 h-3" />
                          {proc.label}
                        </Badge>
                        {task.clienteProcuracaoValidade && <p className="text-[10px] text-muted-foreground mt-0.5">Validade: {formatDate(task.clienteProcuracaoValidade)}</p>}
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Prioridade</span>
                        <p className="font-medium capitalize">{task.prioridade || 'Média'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">SLA</span>
                        <div className="flex flex-col gap-0.5">
                          <Badge className={cn('text-[10px] gap-1 w-fit', sla.color)}>
                            <SlaIcon className="w-3 h-3" />
                            {sla.label} ({task.slaDias} dias)
                          </Badge>
                          <p className="text-[10px] text-muted-foreground">Início: {formatDate(task.dataInicio)} • Fim: {formatDate(task.dataFimPrevista)}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Criado Por</span>
                        <p className="font-medium">{task.criadoPorNomeCompleto || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDateTime(task.createdAt)}</p>
                      </div>
                      {task.viabilidade && (
                        <div>
                          <span className="text-muted-foreground text-xs">Viabilidade</span>
                          <Badge className={cn('text-[10px] gap-1', task.viabilidade === 'viavel' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                            {task.viabilidade === 'viavel' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {task.viabilidade === 'viavel' ? 'Viável' : 'Inviável'}
                          </Badge>
                          {task.valorGlobalApurado && <p className="text-[10px] text-muted-foreground mt-0.5">Valor: {formatCurrency(task.valorGlobalApurado)}</p>}
                        </div>
                      )}
                      {task.dataConclusao && (
                        <div>
                          <span className="text-muted-foreground text-xs">Concluído em</span>
                          <p className="font-medium">{formatDateTime(task.dataConclusao)}</p>
                        </div>
                      )}
                    </div>
                    {task.observacoes && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-muted-foreground text-xs">Observações</span>
                        <p className="text-sm mt-0.5 whitespace-pre-wrap">{task.observacoes}</p>
                      </div>
                    )}
                    {task.clienteExcecoes && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-muted-foreground text-xs">Exceções / Especificidades</span>
                        <p className="text-sm mt-0.5 whitespace-pre-wrap">{task.clienteExcecoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Teses Vinculadas (full width) */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    Teses em {resolvedFilaLabel}
                    <Badge variant="outline" className="text-[10px] ml-1">{teses.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {teses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">Nenhuma tese vinculada a esta tarefa.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tese</th>
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tributo</th>
                            <th className="text-center px-3 py-2 font-medium text-muted-foreground">Tipo</th>
                            <th className="text-center px-3 py-2 font-medium text-muted-foreground">Classificação</th>
                            <th className="text-center px-3 py-2 font-medium text-muted-foreground">Aderente</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Valor Estimado</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Valor Apurado</th>
                            <th className="text-center px-3 py-2 font-medium text-muted-foreground">SLA (dias)</th>
                            <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teses.map((tese: any) => (
                            <tr key={tese.id} className="border-b hover:bg-muted/20 transition-colors">
                              <td className="px-3 py-2">
                                <p className="font-medium">{tese.teseNome || '—'}</p>
                                {tese.teseFundamentacao && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{tese.teseFundamentacao}</p>}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{tese.tributoEnvolvido || '—'}</td>
                              <td className="px-3 py-2 text-center">
                                <Badge variant="outline" className="text-[10px]">{tese.teseTipo || '—'}</Badge>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Badge variant="outline" className="text-[10px]">{tese.teseClassificacao || '—'}</Badge>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {tese.aderente ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(tese.valorEstimado)}</td>
                              <td className="px-3 py-2 text-right font-medium">{tese.valorApurado ? formatCurrency(tese.valorApurado) : '—'}</td>
                              <td className="px-3 py-2 text-center font-mono">{tese.slaApuracaoDias || '—'}</td>
                              <td className="px-3 py-2 text-center">
                                <Badge className={cn('text-[10px]',
                                  tese.status === 'apurada' ? 'bg-emerald-100 text-emerald-800' :
                                  tese.status === 'em_apuracao' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                )}>{tese.status || 'selecionada'}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Row 3: RTIs + Arquivos side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* RTIs */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      RTIs Emitidos
                      <Badge variant="outline" className="text-[10px] ml-1">{rtis.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {rtis.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">Nenhum RTI emitido.</p>
                    ) : (
                      <div className="space-y-2">
                        {rtis.map((rti: any) => (
                          <div key={rti.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary">{rti.numero}</span>
                                <Badge className={cn('text-[10px]',
                                  rti.status === 'emitido' ? 'bg-emerald-100 text-emerald-800' :
                                  rti.status === 'rascunho' ? 'bg-amber-100 text-amber-800' :
                                  'bg-gray-100 text-gray-800'
                                )}>{rti.status || '—'}</Badge>
                                {rti.versao && <span className="text-[10px] text-muted-foreground">v{rti.versao}</span>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {rti.emitidoPorNome || '—'} • {formatDate(rti.emitidoEm || rti.createdAt)}
                              </p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-bold">{formatCurrency(rti.totalApurado || rti.valorTotalEstimado)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Arquivos */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-primary" />
                      Arquivos Vinculados
                      <Badge variant="outline" className="text-[10px] ml-1">{arquivos.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {arquivos.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">Nenhum arquivo vinculado.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                        {arquivos.map((arq: any) => (
                          <a
                            key={arq.id}
                            href={arq.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/40 transition-colors group"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary">{arq.nomeOriginal || arq.nome}</p>
                              <p className="text-[10px] text-muted-foreground">{formatDateTime(arq.createdAt)}</p>
                            </div>
                            <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 4: Audit Log */}
              {auditLog.length > 0 && (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Histórico de Ações
                      <Badge variant="outline" className="text-[10px] ml-1">{auditLog.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {auditLog.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-2 text-xs py-1.5 border-b last:border-0">
                          <span className="text-muted-foreground shrink-0 w-[120px]">{formatDateTime(log.createdAt)}</span>
                          <span className="font-medium shrink-0">{log.usuarioNome || '—'}</span>
                          <span className="text-muted-foreground flex-1">{log.descricao}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
