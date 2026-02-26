import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLocation } from 'wouter';
import {
  ChevronRight, Loader2, Search, Clock, AlertTriangle, CheckCircle,
  User, PlusCircle, ArrowRight, FileText, DollarSign, Building2,
  PenTool, Eye, FileSignature, ShieldCheck, RefreshCw, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ContratosFilaPageProps {
  fila: string;
  filaLabel: string;
  icon: React.ReactNode;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
  fazendo: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
};

const PRIORIDADE_LABELS: Record<string, { label: string; color: string }> = {
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  media: { label: 'Média', color: 'bg-amber-100 text-amber-800' },
  baixa: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
};

const TIPO_LABELS: Record<string, string> = {
  prestacao_servicos: 'Prestação de Serviços',
  honorarios: 'Honorários',
  parceria: 'Parceria',
  nda: 'NDA',
  aditivo: 'Aditivo',
  distrato: 'Distrato',
  outro: 'Outro',
};

const FILA_LABELS: Record<string, string> = {
  elaboracao: 'Elaboração',
  revisao: 'Revisão',
  assinatura: 'Assinatura',
  vigencia: 'Vigência',
  renovacao: 'Renovação',
  encerrado: 'Encerrado',
};

const FORMA_COBRANCA_LABELS: Record<string, string> = {
  percentual_credito: '% do Crédito',
  valor_fixo: 'Valor Fixo',
  mensalidade: 'Mensalidade',
  exito: 'Êxito',
  hibrido: 'Híbrido',
  entrada_exito: 'Entrada + Êxito',
  valor_fixo_parcelado: 'Valor Fixo Parcelado',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

export default function ContratosFilaPage({ fila, filaLabel, icon }: ContratosFilaPageProps) {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContrato, setSelectedContrato] = useState<any>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveTarget, setMoveTarget] = useState('');

  const utils = trpc.useUtils();
  const { data: contratos, isLoading } = trpc.contratos.listByFila.useQuery({ fila });
  const changeFilaMutation = trpc.contratos.changeFila.useMutation({
    onSuccess: () => {
      utils.contratos.listByFila.invalidate({ fila });
      utils.contratos.dashboard.invalidate();
      toast.success('Contrato movido com sucesso!');
      setShowMoveDialog(false);
      setSelectedContrato(null);
    },
  });
  const changeStatusMutation = trpc.contratos.changeStatus.useMutation({
    onSuccess: () => {
      utils.contratos.listByFila.invalidate({ fila });
      toast.success('Status atualizado!');
    },
  });

  const filteredContratos = useMemo(() => {
    if (!contratos) return [];
    let result = contratos as any[];
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.numero?.toLowerCase().includes(term) ||
        c.clienteNome?.toLowerCase().includes(term) ||
        c.clienteCnpj?.toLowerCase().includes(term) ||
        c.parceiroNome?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [contratos, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const all = (contratos as any[]) || [];
    return {
      total: all.length,
      aFazer: all.filter(c => c.status === 'a_fazer').length,
      fazendo: all.filter(c => c.status === 'fazendo').length,
      feito: all.filter(c => c.status === 'feito').length,
      concluido: all.filter(c => c.status === 'concluido').length,
      vencido: all.filter(c => c.slaStatus === 'vencido').length,
    };
  }, [contratos]);

  const handleMoveToFila = () => {
    if (!selectedContrato || !moveTarget) return;
    changeFilaMutation.mutate({ id: selectedContrato.id, novaFila: moveTarget as any });
  };

  const handleChangeStatus = (contratoId: number, novoStatus: string) => {
    changeStatusMutation.mutate({ id: contratoId, novoStatus: novoStatus as any });
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
            <span>Contratos</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{filaLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            {icon}
            Fila de {filaLabel}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contratos ordenados por data de criação (FIFO).
          </p>
        </div>
        <Button onClick={() => navigate('/contratos/novo')} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Novo Contrato
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'A Fazer', value: stats.aFazer, color: 'text-amber-600' },
          { label: 'Em Andamento', value: stats.fazendo, color: 'text-blue-600' },
          { label: 'Feito', value: stats.feito, color: 'text-purple-600' },
          { label: 'Concluído', value: stats.concluido, color: 'text-emerald-600' },
          { label: 'Vencido', value: stats.vencido, color: 'text-red-600' },
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
            placeholder="Buscar por número, cliente, CNPJ ou parceiro..."
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
            <SelectItem value="fazendo">Em Andamento</SelectItem>
            <SelectItem value="feito">Feito</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contract List */}
      <Card>
        <CardContent className="p-0">
          {filteredContratos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum contrato nesta fila.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/contratos/novo')}>
                <PlusCircle className="w-4 h-4" />
                Criar Novo Contrato
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Nº</div>
                <div className="col-span-2">Cliente</div>
                <div className="col-span-1">CNPJ</div>
                <div className="col-span-1">Tipo</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Prioridade</div>
                <div className="col-span-1">Responsável</div>
                <div className="col-span-1">Valor</div>
                <div className="col-span-1">Cobrança</div>
                <div className="col-span-2">Ações</div>
              </div>
              {filteredContratos.map((contrato: any) => {
                const statusInfo = STATUS_LABELS[contrato.status] || { label: contrato.status, color: 'bg-gray-100 text-gray-800' };
                const prioridadeInfo = PRIORIDADE_LABELS[contrato.prioridade] || { label: contrato.prioridade, color: 'bg-gray-100 text-gray-800' };
                return (
                  <div
                    key={contrato.id}
                    className={cn(
                      'grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-sm',
                      contrato.slaStatus === 'vencido' && 'bg-red-50/50'
                    )}
                  >
                    <div className="col-span-1">
                      <span className="font-mono text-xs font-medium text-orange-600">{contrato.numero}</span>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="font-medium text-foreground truncate text-xs">{contrato.clienteNome || '—'}</p>
                      {contrato.parceiroNome && (
                        <p className="text-[10px] text-muted-foreground truncate">Parceiro: {contrato.parceiroNome}</p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs text-muted-foreground">{contrato.clienteCnpj || '—'}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs text-muted-foreground">{TIPO_LABELS[contrato.tipo] || contrato.tipo}</span>
                    </div>
                    <div className="col-span-1">
                      <Select
                        value={contrato.status}
                        onValueChange={(val) => handleChangeStatus(contrato.id, val)}
                      >
                        <SelectTrigger className="h-6 text-[10px] px-2 border-0 bg-transparent">
                          <Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a_fazer">A Fazer</SelectItem>
                          <SelectItem value="fazendo">Em Andamento</SelectItem>
                          <SelectItem value="feito">Feito</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Badge className={cn('text-[10px]', prioridadeInfo.color)}>{prioridadeInfo.label}</Badge>
                    </div>
                    <div className="col-span-1 flex items-center gap-1 min-w-0">
                      <User className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{contrato.responsavelNome || '—'}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs font-medium">{formatCurrency(Number(contrato.valorContrato || 0))}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[10px] text-muted-foreground">{FORMA_COBRANCA_LABELS[contrato.formaCobranca] || contrato.formaCobranca || '—'}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => navigate(`/contratos/${contrato.id}`)}
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setSelectedContrato(contrato);
                          setMoveTarget('');
                          setShowMoveDialog(true);
                        }}
                      >
                        <ArrowRight className="w-3 h-3" />
                        Mover
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Contrato para Outra Fila</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Contrato: <span className="font-medium text-foreground">{selectedContrato?.numero}</span> — {selectedContrato?.clienteNome}
            </p>
            <p className="text-sm text-muted-foreground">
              Fila atual: <Badge variant="outline">{FILA_LABELS[fila]}</Badge>
            </p>
            <Select value={moveTarget} onValueChange={setMoveTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fila de destino" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FILA_LABELS).filter(([k]) => k !== fila).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleMoveToFila}
              disabled={!moveTarget || changeFilaMutation.isPending}
            >
              {changeFilaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
