import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useLocation } from 'wouter';
import {
  Loader2, ArrowLeft, FileText, Save, Clock, User,
  Building2, DollarSign, Calendar, History, PenTool,
  Eye, FileSignature, ShieldCheck, RefreshCw, XCircle,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FILA_LABELS: Record<string, string> = {
  elaboracao: 'Elaboração', revisao: 'Revisão', assinatura: 'Assinatura',
  vigencia: 'Vigência', renovacao: 'Renovação', encerrado: 'Encerrado',
};
const STATUS_LABELS: Record<string, string> = {
  a_fazer: 'A Fazer', fazendo: 'Em Andamento', feito: 'Feito', concluido: 'Concluído',
};
const TIPO_LABELS: Record<string, string> = {
  prestacao_servicos: 'Prestação de Serviços', honorarios: 'Honorários',
  parceria: 'Parceria', nda: 'NDA', aditivo: 'Aditivo', distrato: 'Distrato', outro: 'Outro',
};
const FORMA_COBRANCA_LABELS: Record<string, string> = {
  percentual_credito: '% do Crédito', valor_fixo: 'Valor Fixo', mensalidade: 'Mensalidade',
  exito: 'Êxito', hibrido: 'Híbrido', entrada_exito: 'Entrada + Êxito', valor_fixo_parcelado: 'Valor Fixo Parcelado',
};
const FILA_COLORS: Record<string, string> = {
  elaboracao: 'bg-amber-100 text-amber-800', revisao: 'bg-blue-100 text-blue-800',
  assinatura: 'bg-purple-100 text-purple-800', vigencia: 'bg-emerald-100 text-emerald-800',
  renovacao: 'bg-cyan-100 text-cyan-800', encerrado: 'bg-gray-100 text-gray-800',
};
const STATUS_COLORS: Record<string, string> = {
  a_fazer: 'bg-amber-100 text-amber-800', fazendo: 'bg-blue-100 text-blue-800',
  feito: 'bg-purple-100 text-purple-800', concluido: 'bg-emerald-100 text-emerald-800',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}
function formatDateTime(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR');
}

export default function ContratoDetalhe() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const contratoId = Number(params.id);
  const utils = trpc.useUtils();

  const { data: contrato, isLoading } = trpc.contratos.getById.useQuery({ id: contratoId });
  const { data: historico } = trpc.contratos.historico.useQuery({ contratoId });
  const { data: documentos } = trpc.contratos.documentos.list.useQuery({ contratoId });

  const updateMutation = trpc.contratos.update.useMutation({
    onSuccess: () => {
      toast.success('Contrato atualizado!');
      utils.contratos.getById.invalidate({ id: contratoId });
      utils.contratos.historico.invalidate({ contratoId });
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const changeFilaMutation = trpc.contratos.changeFila.useMutation({
    onSuccess: () => {
      toast.success('Fila alterada!');
      utils.contratos.getById.invalidate({ id: contratoId });
      utils.contratos.historico.invalidate({ contratoId });
    },
  });

  const changeStatusMutation = trpc.contratos.changeStatus.useMutation({
    onSuccess: () => {
      toast.success('Status atualizado!');
      utils.contratos.getById.invalidate({ id: contratoId });
      utils.contratos.historico.invalidate({ contratoId });
    },
  });

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const startEditing = () => {
    if (!contrato) return;
    setEditForm({
      objetoContrato: contrato.objetoContrato || '',
      clausulasEspeciais: contrato.clausulasEspeciais || '',
      observacoes: contrato.observacoes || '',
      valorContrato: contrato.valorContrato || '',
      slaHoras: contrato.slaHoras || '',
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate({
      id: contratoId,
      objetoContrato: editForm.objetoContrato || null,
      clausulasEspeciais: editForm.clausulasEspeciais || null,
      observacoes: editForm.observacoes || null,
      valorContrato: editForm.valorContrato || undefined,
      slaHoras: editForm.slaHoras ? Number(editForm.slaHoras) : null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Contrato não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/contratos/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Contratos</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{contrato.numero}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/contratos/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-7 h-7 text-orange-500" />
              {contrato.numero}
            </h1>
            <Badge className={cn('text-xs', FILA_COLORS[contrato.fila] || 'bg-gray-100')}>
              {FILA_LABELS[contrato.fila] || contrato.fila}
            </Badge>
            <Badge className={cn('text-xs', STATUS_COLORS[contrato.status] || 'bg-gray-100')}>
              {STATUS_LABELS[contrato.status] || contrato.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <PenTool className="w-4 h-4 mr-1" />
              Editar
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({(historico as any[])?.length || 0})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({(documentos as any[])?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Fila:</span>
                <Select
                  value={contrato.fila}
                  onValueChange={(val) => changeFilaMutation.mutate({ id: contratoId, novaFila: val as any })}
                >
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FILA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Select
                  value={contrato.status}
                  onValueChange={(val) => changeStatusMutation.mutate({ id: contratoId, novoStatus: val as any })}
                >
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Cliente e Parceiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{contrato.clienteNome || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CNPJ</span>
                  <span>{contrato.clienteCnpj || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parceiro</span>
                  <span>{contrato.parceiroNome || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span>{TIPO_LABELS[contrato.tipo] || contrato.tipo}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor do Contrato</span>
                  <span className="font-medium text-green-600">{formatCurrency(Number(contrato.valorContrato || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forma de Cobrança</span>
                  <span>{FORMA_COBRANCA_LABELS[contrato.formaCobranca || ''] || contrato.formaCobranca || '—'}</span>
                </div>
                {contrato.percentualExito && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">% Êxito</span>
                    <span>{contrato.percentualExito}%</span>
                  </div>
                )}
                {contrato.valorEntrada && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Entrada</span>
                    <span>{formatCurrency(Number(contrato.valorEntrada))}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Datas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Início</span>
                  <span>{formatDate(contrato.dataInicio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fim</span>
                  <span>{formatDate(contrato.dataFim)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assinatura</span>
                  <span>{formatDate(contrato.dataAssinatura)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span>{formatDate(contrato.dataVencimento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA</span>
                  <span>{contrato.slaHoras ? `${contrato.slaHoras}h` : '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Responsáveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responsável</span>
                  <span>{contrato.responsavelNome || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revisor</span>
                  <span>{contrato.revisorNome || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado por</span>
                  <span>{contrato.criadoPorNome || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em</span>
                  <span>{formatDateTime(contrato.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label>Objeto do Contrato</Label>
                    <Textarea rows={3} value={editForm.objetoContrato} onChange={e => setEditForm((f: any) => ({ ...f, objetoContrato: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cláusulas Especiais</Label>
                    <Textarea rows={3} value={editForm.clausulasEspeciais} onChange={e => setEditForm((f: any) => ({ ...f, clausulasEspeciais: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea rows={2} value={editForm.observacoes} onChange={e => setEditForm((f: any) => ({ ...f, observacoes: e.target.value }))} />
                  </div>
                </>
              ) : (
                <>
                  {contrato.objetoContrato && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Objeto do Contrato</p>
                      <p className="text-sm whitespace-pre-wrap">{contrato.objetoContrato}</p>
                    </div>
                  )}
                  {contrato.clausulasEspeciais && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cláusulas Especiais</p>
                      <p className="text-sm whitespace-pre-wrap">{contrato.clausulasEspeciais}</p>
                    </div>
                  )}
                  {contrato.observacoes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Observações</p>
                      <p className="text-sm whitespace-pre-wrap">{contrato.observacoes}</p>
                    </div>
                  )}
                  {!contrato.objetoContrato && !contrato.clausulasEspeciais && !contrato.observacoes && (
                    <p className="text-sm text-muted-foreground">Nenhum detalhe registrado.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!(historico as any[])?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum registro no histórico.</p>
              ) : (
                <div className="space-y-3">
                  {(historico as any[]).map((h: any) => (
                    <div key={h.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{h.acao}</p>
                        <p className="text-xs text-muted-foreground">{h.descricao}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {h.usuarioNome || 'Sistema'} — {formatDateTime(h.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {!(documentos as any[])?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum documento anexado. A funcionalidade de upload será implementada em breve.
                </p>
              ) : (
                <div className="space-y-2">
                  {(documentos as any[]).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.nome}</p>
                          <p className="text-xs text-muted-foreground">{doc.tipo} — v{doc.versao}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(doc.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
