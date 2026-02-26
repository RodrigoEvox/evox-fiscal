import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';
import {
  ChevronRight, Loader2, PlusCircle, ArrowLeft, FileText,
  Building2, User, DollarSign, Calendar, Save,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NovoContrato() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: clientes } = trpc.contratos.clientesList.useQuery();
  const { data: parceiros } = trpc.contratos.parceirosList.useQuery();
  const { data: usuarios } = trpc.contratos.usuariosList.useQuery();

  const [form, setForm] = useState({
    clienteId: '',
    parceiroId: '',
    tipo: 'prestacao_servicos',
    fila: 'elaboracao',
    prioridade: 'media',
    valorContrato: '',
    formaCobranca: 'valor_fixo',
    percentualExito: '',
    valorEntrada: '',
    quantidadeParcelas: '',
    valorParcela: '',
    dataInicio: '',
    dataFim: '',
    dataVencimento: '',
    slaHoras: '',
    responsavelId: '',
    revisorId: '',
    objetoContrato: '',
    clausulasEspeciais: '',
    observacoes: '',
  });

  const createMutation = trpc.contratos.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Contrato ${data?.numero} criado com sucesso!`);
      utils.contratos.dashboard.invalidate();
      navigate('/contratos/dashboard');
    },
    onError: (err) => {
      toast.error(err.message || 'Erro ao criar contrato');
    },
  });

  const selectedCliente = useMemo(() => {
    if (!form.clienteId || !clientes) return null;
    return (clientes as any[]).find(c => String(c.id) === form.clienteId);
  }, [form.clienteId, clientes]);

  const selectedParceiro = useMemo(() => {
    if (!form.parceiroId || !parceiros) return null;
    return (parceiros as any[]).find(p => String(p.id) === form.parceiroId);
  }, [form.parceiroId, parceiros]);

  const selectedResponsavel = useMemo(() => {
    if (!form.responsavelId || !usuarios) return null;
    return (usuarios as any[]).find(u => String(u.id) === form.responsavelId);
  }, [form.responsavelId, usuarios]);

  const selectedRevisor = useMemo(() => {
    if (!form.revisorId || !usuarios) return null;
    return (usuarios as any[]).find(u => String(u.id) === form.revisorId);
  }, [form.revisorId, usuarios]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId) {
      toast.error('Selecione um cliente');
      return;
    }
    createMutation.mutate({
      clienteId: Number(form.clienteId),
      clienteNome: selectedCliente?.razaoSocial || selectedCliente?.nomeFantasia || selectedCliente?.nome || '',
      clienteCnpj: selectedCliente?.cnpj || '',
      parceiroId: form.parceiroId ? Number(form.parceiroId) : undefined,
      parceiroNome: selectedParceiro?.nomeFantasia || selectedParceiro?.apelido || '',
      tipo: form.tipo as any,
      fila: form.fila as any,
      prioridade: form.prioridade as any,
      valorContrato: form.valorContrato || undefined,
      formaCobranca: form.formaCobranca as any,
      percentualExito: form.percentualExito || undefined,
      valorEntrada: form.valorEntrada || undefined,
      quantidadeParcelas: form.quantidadeParcelas ? Number(form.quantidadeParcelas) : undefined,
      valorParcela: form.valorParcela || undefined,
      dataInicio: form.dataInicio || undefined,
      dataFim: form.dataFim || undefined,
      dataVencimento: form.dataVencimento || undefined,
      slaHoras: form.slaHoras ? Number(form.slaHoras) : undefined,
      responsavelId: form.responsavelId ? Number(form.responsavelId) : undefined,
      responsavelNome: selectedResponsavel?.name || selectedResponsavel?.apelido || '',
      revisorId: form.revisorId ? Number(form.revisorId) : undefined,
      revisorNome: selectedRevisor?.name || selectedRevisor?.apelido || '',
      objetoContrato: form.objetoContrato || undefined,
      clausulasEspeciais: form.clausulasEspeciais || undefined,
      observacoes: form.observacoes || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Contratos</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Novo Contrato</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contratos/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <PlusCircle className="w-7 h-7 text-orange-500" />
            Novo Contrato
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente e Parceiro */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Cliente e Parceiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.clienteId} onValueChange={v => setForm(f => ({ ...f, clienteId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clientes as any[] || []).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.razaoSocial || c.nomeFantasia || c.nome} {c.cnpj ? `(${c.cnpj})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Parceiro (opcional)</Label>
                <Select value={form.parceiroId} onValueChange={v => setForm(f => ({ ...f, parceiroId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(parceiros as any[] || []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nomeFantasia || p.apelido || p.nomeCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipo e Classificação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tipo e Classificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prestacao_servicos">Prestação de Serviços</SelectItem>
                    <SelectItem value="honorarios">Honorários</SelectItem>
                    <SelectItem value="parceria">Parceria</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                    <SelectItem value="aditivo">Aditivo</SelectItem>
                    <SelectItem value="distrato">Distrato</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fila Inicial</Label>
                <Select value={form.fila} onValueChange={v => setForm(f => ({ ...f, fila: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elaboracao">Elaboração</SelectItem>
                    <SelectItem value="revisao">Revisão</SelectItem>
                    <SelectItem value="assinatura">Assinatura</SelectItem>
                    <SelectItem value="vigencia">Vigência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valores e Cobrança */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valores e Forma de Cobrança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor do Contrato (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.valorContrato}
                  onChange={e => setForm(f => ({ ...f, valorContrato: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Cobrança</Label>
                <Select value={form.formaCobranca} onValueChange={v => setForm(f => ({ ...f, formaCobranca: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual_credito">% do Crédito</SelectItem>
                    <SelectItem value="valor_fixo">Valor Fixo</SelectItem>
                    <SelectItem value="mensalidade">Mensalidade</SelectItem>
                    <SelectItem value="exito">Êxito</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                    <SelectItem value="entrada_exito">Entrada + Êxito</SelectItem>
                    <SelectItem value="valor_fixo_parcelado">Valor Fixo Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.formaCobranca === 'percentual_credito' || form.formaCobranca === 'exito' || form.formaCobranca === 'hibrido' || form.formaCobranca === 'entrada_exito') && (
                <div className="space-y-2">
                  <Label>Percentual de Êxito (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.percentualExito}
                    onChange={e => setForm(f => ({ ...f, percentualExito: e.target.value }))}
                  />
                </div>
              )}
            </div>
            {(form.formaCobranca === 'entrada_exito' || form.formaCobranca === 'hibrido') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor de Entrada (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.valorEntrada}
                    onChange={e => setForm(f => ({ ...f, valorEntrada: e.target.value }))}
                  />
                </div>
              </div>
            )}
            {form.formaCobranca === 'valor_fixo_parcelado' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade de Parcelas</Label>
                  <Input
                    type="number"
                    placeholder="12"
                    value={form.quantidadeParcelas}
                    onChange={e => setForm(f => ({ ...f, quantidadeParcelas: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor da Parcela (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.valorParcela}
                    onChange={e => setForm(f => ({ ...f, valorParcela: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Datas e SLA */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Datas e SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={form.dataInicio}
                  onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Fim</Label>
                <Input
                  type="date"
                  value={form.dataFim}
                  onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={form.dataVencimento}
                  onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>SLA (horas)</Label>
                <Input
                  type="number"
                  placeholder="48"
                  value={form.slaHoras}
                  onChange={e => setForm(f => ({ ...f, slaHoras: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responsáveis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={form.responsavelId} onValueChange={v => setForm(f => ({ ...f, responsavelId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {(usuarios as any[] || []).filter((u: any) => u.ativo !== false).map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name || u.apelido} {u.cargo ? `(${u.cargo})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Revisor</Label>
                <Select value={form.revisorId} onValueChange={v => setForm(f => ({ ...f, revisorId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o revisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {(usuarios as any[] || []).filter((u: any) => u.ativo !== false).map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name || u.apelido} {u.cargo ? `(${u.cargo})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Detalhes do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objeto do Contrato</Label>
              <Textarea
                placeholder="Descreva o objeto do contrato..."
                rows={3}
                value={form.objetoContrato}
                onChange={e => setForm(f => ({ ...f, objetoContrato: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cláusulas Especiais</Label>
              <Textarea
                placeholder="Cláusulas especiais ou condições específicas..."
                rows={3}
                value={form.clausulasEspeciais}
                onChange={e => setForm(f => ({ ...f, clausulasEspeciais: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações gerais..."
                rows={2}
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/contratos/dashboard')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending} className="gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Criar Contrato
          </Button>
        </div>
      </form>
    </div>
  );
}
