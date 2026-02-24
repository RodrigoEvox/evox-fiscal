import { useLocation, Link } from 'wouter';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Briefcase, Loader2, Calculator, DollarSign, Calendar, Users,
  FileText, Trash2, Eye, AlertTriangle, ArrowLeft, Save, X,
  CheckCircle2, Clock, Ban, Download, FileSpreadsheet, Pencil,
  History, ChevronDown, ChevronUp, Info,
} from 'lucide-react';

const TIPO_DESLIGAMENTO_LABELS: Record<string, string> = {
  sem_justa_causa: 'Sem Justa Causa',
  justa_causa: 'Justa Causa',
  pedido_demissao: 'Pedido de Demissão',
  termino_experiencia_1: 'Término 1º Período Experiência',
  termino_experiencia_2: 'Término 2º Período Experiência',
  acordo_mutuo: 'Acordo Mútuo (Reforma Trabalhista)',
};

const TIPO_DESLIGAMENTO_COLORS: Record<string, string> = {
  sem_justa_causa: 'bg-red-100 text-red-700',
  justa_causa: 'bg-red-200 text-red-800',
  pedido_demissao: 'bg-yellow-100 text-yellow-700',
  termino_experiencia_1: 'bg-blue-100 text-blue-700',
  termino_experiencia_2: 'bg-blue-100 text-blue-700',
  acordo_mutuo: 'bg-purple-100 text-purple-700',
};

const ACAO_LABELS: Record<string, string> = {
  simulado: 'Simulado',
  descartado: 'Descartado',
  salvo: 'Salvo',
};
const ACAO_COLORS: Record<string, string> = {
  simulado: 'bg-blue-100 text-blue-700',
  descartado: 'bg-red-100 text-red-700',
  salvo: 'bg-green-100 text-green-700',
};

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d: string | null | undefined) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function formatDateTime(d: string | Date | null | undefined) {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── Inline Result View with Editable Verbas ───
function ResultadoRescisao({
  preview,
  onSave,
  onDiscard,
  isSaving,
}: {
  preview: any;
  onSave: (overrides: { avisoPrevioDias?: number; descontosAdicionais?: number; observacao?: string }) => void;
  onDiscard: () => void;
  isSaving: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const [avisoPrevioDias, setAvisoPrevioDias] = useState<number>(preview.avisoPrevioDias || 0);
  const [descontosAdicionais, setDescontosAdicionais] = useState<number>(0);
  const [observacao, setObservacao] = useState('');
  const [showEdits, setShowEdits] = useState(false);

  // Recalculate values with overrides
  const salDia = Number(preview.salarioBase) / 30;
  const avisoPrevioCalc = editMode && avisoPrevioDias !== preview.avisoPrevioDias
    ? (preview.tipoDesligamento === 'acordo_mutuo' ? salDia * avisoPrevioDias * 0.5 : salDia * avisoPrevioDias)
    : Number(preview.avisoPrevio);
  const totalProventosCalc = Number(preview.saldoSalario) + avisoPrevioCalc +
    Number(preview.decimoTerceiroProporcional) + Number(preview.feriasProporcionais) +
    Number(preview.tercoConstitucional) + Number(preview.feriasVencidas) + Number(preview.multaFgts);
  const totalDescontosCalc = editMode ? descontosAdicionais : Number(preview.totalDescontos);
  const totalLiquidoCalc = totalProventosCalc - totalDescontosCalc;

  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    const headers = ['Verba', 'Referência', 'Valor'];
    const rows: string[][] = [];
    rows.push(['Saldo de Salário', 'Dias trabalhados', String(Number(preview.saldoSalario).toFixed(2))]);
    if (Number(preview.avisoPrevio) > 0) rows.push(['Aviso Prévio', `${avisoPrevioDias} dias`, String(avisoPrevioCalc.toFixed(2))]);
    if (Number(preview.decimoTerceiroProporcional) > 0) rows.push(['13º Proporcional', `${preview.decimoTerceiroMeses}/12 avos`, String(Number(preview.decimoTerceiroProporcional).toFixed(2))]);
    if (Number(preview.feriasProporcionais) > 0) rows.push(['Férias Proporcionais', `${preview.feriasMeses}/12 avos`, String(Number(preview.feriasProporcionais).toFixed(2))]);
    if (Number(preview.tercoConstitucional) > 0) rows.push(['1/3 Constitucional', 'Sobre férias', String(Number(preview.tercoConstitucional).toFixed(2))]);
    if (Number(preview.feriasVencidas) > 0) rows.push(['Férias Vencidas + 1/3', 'Período completo', String(Number(preview.feriasVencidas).toFixed(2))]);
    if (Number(preview.multaFgts) > 0) rows.push([`Multa FGTS (${preview.multaFgtsPercentual}%)`, `Sobre ${Number(preview.fgtsDepositado).toFixed(2)}`, String(Number(preview.multaFgts).toFixed(2))]);
    if (totalDescontosCalc > 0) rows.push(['Descontos', 'Ajuste manual', String(totalDescontosCalc.toFixed(2))]);
    rows.push(['TOTAL LÍQUIDO', '', String(totalLiquidoCalc.toFixed(2))]);

    const csv = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rescisao-${(preview.colaboradorNome || 'calculo').replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    toast.success('Excel exportado com sucesso');
  };

  const handleExportPDF = () => {
    const dados = {
      ...preview,
      avisoPrevioDias,
      avisoPrevio: avisoPrevioCalc,
      totalProventos: totalProventosCalc,
      totalDescontos: totalDescontosCalc,
      totalLiquido: totalLiquidoCalc,
      observacao,
    };
    const url = `/api/rescisao/export-pdf?dados=${encodeURIComponent(JSON.stringify(dados))}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Resultado da Simulação</h3>
            <p className="text-xs text-muted-foreground">Revise os valores antes de salvar</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar para CSV/Excel</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
                  <Download className="w-4 h-4" /> PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar para PDF</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" onClick={onDiscard} className="gap-2">
            <X className="w-4 h-4" /> Descartar
          </Button>
          <Button
            onClick={() => onSave({
              avisoPrevioDias: editMode ? avisoPrevioDias : undefined,
              descontosAdicionais: editMode ? descontosAdicionais : undefined,
              observacao: observacao || undefined,
            })}
            disabled={isSaving}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Cálculo
          </Button>
        </div>
      </div>

      {/* Dados do Colaborador */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-4 pb-4 text-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-gray-900">Dados do Colaborador</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><span className="text-muted-foreground text-xs">Nome</span><p className="font-medium">{preview.colaboradorNome}</p></div>
            <div><span className="text-muted-foreground text-xs">Cargo</span><p className="font-medium">{preview.cargo || '-'}</p></div>
            <div><span className="text-muted-foreground text-xs">Admissão</span><p className="font-medium">{formatDate(preview.dataAdmissao)}</p></div>
            <div><span className="text-muted-foreground text-xs">Desligamento</span><p className="font-medium">{formatDate(preview.dataDesligamento)}</p></div>
            <div><span className="text-muted-foreground text-xs">Salário Base</span><p className="font-medium">{formatCurrency(preview.salarioBase)}</p></div>
            <div><span className="text-muted-foreground text-xs">Contrato</span><p className="font-medium">{preview.tipoContrato?.toUpperCase()}</p></div>
            <div><span className="text-muted-foreground text-xs">Tipo Desligamento</span>
              <Badge className={`mt-1 ${TIPO_DESLIGAMENTO_COLORS[preview.tipoDesligamento] || 'bg-gray-100'}`}>
                {TIPO_DESLIGAMENTO_LABELS[preview.tipoDesligamento]}
              </Badge>
            </div>
            <div><span className="text-muted-foreground text-xs">Tempo de Serviço</span><p className="font-medium">{preview.anosTrabalhados}a {preview.mesesTrabalhados % 12}m</p></div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/60">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-green-700 font-medium mb-1">Total Proventos</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalProventosCalc)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/60">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-red-700 font-medium mb-1">Total Descontos</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDescontosCalc)}</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-200 bg-indigo-50/60">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-indigo-700 font-medium mb-1">Total Líquido</p>
            <p className="text-2xl font-bold text-indigo-700">{formatCurrency(totalLiquidoCalc)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Editable Verbas Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setEditMode(!editMode); setShowEdits(!showEdits); }}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" />
          {editMode ? 'Fechar Edição Manual' : 'Editar Verbas Manualmente'}
          {showEdits ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
        {editMode && (
          <Badge className="bg-amber-100 text-amber-700 gap-1">
            <Pencil className="w-3 h-3" /> Modo edição ativo
          </Badge>
        )}
      </div>

      {/* Editable Fields Panel */}
      {showEdits && (
        <Card className="border-amber-200 bg-amber-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Pencil className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-sm text-gray-900">Ajustes Manuais</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Ajuste os dias de aviso prévio ou adicione descontos antes de salvar. Os totais serão recalculados automaticamente.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium">Dias de Aviso Prévio</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={avisoPrevioDias}
                  onChange={(e) => setAvisoPrevioDias(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Original: {preview.avisoPrevioDias} dias
                  {avisoPrevioDias !== preview.avisoPrevioDias && (
                    <span className="text-amber-600 font-medium"> (alterado)</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium">Descontos Adicionais (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={descontosAdicionais}
                  onChange={(e) => setDescontosAdicionais(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: adiantamentos, empréstimos, danos
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium">Observação</Label>
                <Textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Motivo do ajuste, justificativa..."
                  className="mt-1 h-[68px] resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verbas Rescisórias Table */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> Verbas Rescisórias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Verba</th>
                <th className="text-center px-4 py-2 font-medium">Referência</th>
                <th className="text-right px-4 py-2 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2">Saldo de Salário</td>
                <td className="px-4 py-2 text-center text-muted-foreground">Dias trabalhados no mês</td>
                <td className="px-4 py-2 text-right font-medium">{formatCurrency(preview.saldoSalario)}</td>
              </tr>
              {(Number(preview.avisoPrevio) > 0 || avisoPrevioCalc > 0) && (
                <tr className={`border-b ${editMode && avisoPrevioDias !== preview.avisoPrevioDias ? 'bg-amber-50' : ''}`}>
                  <td className="px-4 py-2">
                    Aviso Prévio
                    {editMode && avisoPrevioDias !== preview.avisoPrevioDias && (
                      <Badge className="ml-2 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">editado</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{avisoPrevioDias} dias</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(avisoPrevioCalc)}</td>
                </tr>
              )}
              {Number(preview.decimoTerceiroProporcional) > 0 && (
                <tr className="border-b">
                  <td className="px-4 py-2">13º Proporcional</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{preview.decimoTerceiroMeses}/12 avos</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(preview.decimoTerceiroProporcional)}</td>
                </tr>
              )}
              {Number(preview.feriasProporcionais) > 0 && (
                <tr className="border-b">
                  <td className="px-4 py-2">Férias Proporcionais</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{preview.feriasMeses}/12 avos</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(preview.feriasProporcionais)}</td>
                </tr>
              )}
              {Number(preview.tercoConstitucional) > 0 && (
                <tr className="border-b">
                  <td className="px-4 py-2">1/3 Constitucional</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">Sobre férias proporcionais</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(preview.tercoConstitucional)}</td>
                </tr>
              )}
              {Number(preview.feriasVencidas) > 0 && (
                <tr className="border-b">
                  <td className="px-4 py-2">Férias Vencidas + 1/3</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">Período aquisitivo completo</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(preview.feriasVencidas)}</td>
                </tr>
              )}
              {Number(preview.multaFgts) > 0 && (
                <tr className="border-b">
                  <td className="px-4 py-2">Multa FGTS ({preview.multaFgtsPercentual}%)</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">Sobre {formatCurrency(preview.fgtsDepositado)} depositado</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(preview.multaFgts)}</td>
                </tr>
              )}
              {totalDescontosCalc > 0 && (
                <tr className={`border-b ${editMode ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2 text-red-700">
                    Descontos Adicionais
                    {editMode && <Badge className="ml-2 bg-red-100 text-red-700 text-[10px] px-1.5 py-0">manual</Badge>}
                  </td>
                  <td className="px-4 py-2 text-center text-muted-foreground">Ajuste manual</td>
                  <td className="px-4 py-2 text-right font-medium text-red-700">- {formatCurrency(totalDescontosCalc)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-green-50 font-bold">
                <td className="px-4 py-3" colSpan={2}>Total Líquido</td>
                <td className="px-4 py-3 text-right text-green-700 text-lg">{formatCurrency(totalLiquidoCalc)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* FGTS Info */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-4 pb-4 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-700">Informações FGTS</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-blue-700">
            <div>FGTS Depositado (estimado): <strong>{formatCurrency(preview.fgtsDepositado)}</strong></div>
            <div>Multa FGTS ({preview.multaFgtsPercentual}%): <strong>{formatCurrency(preview.multaFgts)}</strong></div>
          </div>
        </CardContent>
      </Card>

      {/* Observação (if filled) */}
      {observacao && !showEdits && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-3 pb-3 text-sm">
            <span className="text-muted-foreground text-xs font-medium">Observação:</span>
            <p className="mt-1">{observacao}</p>
          </CardContent>
        </Card>
      )}

      {/* Bottom action bar (sticky) */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t py-3 -mx-6 px-6 flex items-center justify-between">
        <p className="text-sm text-amber-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Este cálculo ainda não foi salvo. Revise e clique em "Salvar Cálculo" para confirmar.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDiscard} size="sm" className="gap-1">
            <X className="w-3.5 h-3.5" /> Descartar
          </Button>
          <Button
            onClick={() => onSave({
              avisoPrevioDias: editMode ? avisoPrevioDias : undefined,
              descontosAdicionais: editMode ? descontosAdicionais : undefined,
              observacao: observacao || undefined,
            })}
            disabled={isSaving}
            size="sm"
            className="gap-1 bg-green-600 hover:bg-green-700"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar Cálculo
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Audit History Tab ───
function AuditoriaTab() {
  const { data: auditoria, isLoading } = trpc.rescisoes.auditoria.useQuery({ limit: 100 });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (!auditoria?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>Nenhum registro de auditoria ainda.</p>
          <p className="text-sm mt-1">As simulações calculadas, salvas e descartadas aparecerão aqui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" /> Histórico de Auditoria ({auditoria.length} registros)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Data/Hora</th>
                <th className="text-left px-4 py-2 font-medium">Colaborador</th>
                <th className="text-left px-4 py-2 font-medium">Cargo</th>
                <th className="text-left px-4 py-2 font-medium">Tipo Desligamento</th>
                <th className="text-right px-4 py-2 font-medium">Salário Base</th>
                <th className="text-center px-4 py-2 font-medium">Ação</th>
                <th className="text-left px-4 py-2 font-medium">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {auditoria.map((a: any) => (
                <tr key={a.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                  <td className="px-4 py-2 font-medium">{a.colaboradorNome}</td>
                  <td className="px-4 py-2 text-muted-foreground">{a.cargo || '-'}</td>
                  <td className="px-4 py-2">
                    <Badge className={`text-[10px] ${TIPO_DESLIGAMENTO_COLORS[a.tipoDesligamento] || 'bg-gray-100'}`}>
                      {TIPO_DESLIGAMENTO_LABELS[a.tipoDesligamento] || a.tipoDesligamento}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">{formatCurrency(a.salarioBase)}</td>
                  <td className="px-4 py-2 text-center">
                    <Badge className={`text-[10px] ${ACAO_COLORS[a.acao] || 'bg-gray-100'}`}>
                      {ACAO_LABELS[a.acao] || a.acao}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{a.simuladoPorNome || 'Sistema'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function RescisaoPage() {
  const [view, setView] = useState<'list' | 'form' | 'result'>('list');
  const [activeTab, setActiveTab] = useState('rescisoes');
  const [selectedColabId, setSelectedColabId] = useState<string>('');
  const [dataDesligamento, setDataDesligamento] = useState('');
  const [tipoDesligamento, setTipoDesligamento] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRescisao, setSelectedRescisao] = useState<any>(null);
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const hasUnsavedResult = view === 'result' && previewData !== null;

  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: rescisoes, isLoading } = trpc.rescisoes.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();

  const previewMut = trpc.rescisoes.preview.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      setView('result');
    },
    onError: (e) => toast.error(e.message),
  });

  const saveMut = trpc.rescisoes.calcular.useMutation({
    onSuccess: (data) => {
      utils.rescisoes.list.invalidate();
      utils.rescisoes.auditoria.invalidate();
      toast.success(`Rescisão salva com sucesso! Total líquido: ${formatCurrency(data.totalLiquido)}`);
      setView('list');
      setPreviewData(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const discardMut = trpc.rescisoes.registrarDescarte.useMutation({
    onSuccess: () => {
      utils.rescisoes.auditoria.invalidate();
    },
  });

  const deleteMut = trpc.rescisoes.delete.useMutation({
    onSuccess: () => {
      utils.rescisoes.list.invalidate();
      toast.success('Rescisão removida');
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setSelectedColabId('');
    setDataDesligamento('');
    setTipoDesligamento('');
  };

  const colabsAtivos = useMemo(() => {
    return (colaboradores || []).filter((c: any) => c.statusColaborador !== 'desligado');
  }, [colaboradores]);

  const selectedColab = useMemo(() => {
    if (!selectedColabId) return null;
    return (colaboradores || []).find((c: any) => c.id === Number(selectedColabId));
  }, [selectedColabId, colaboradores]);

  const handleCalcular = () => {
    if (!selectedColabId || !dataDesligamento || !tipoDesligamento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    previewMut.mutate({
      colaboradorId: Number(selectedColabId),
      dataDesligamento,
      tipoDesligamento: tipoDesligamento as any,
    });
  };

  const handleSave = (overrides: { avisoPrevioDias?: number; descontosAdicionais?: number; observacao?: string }) => {
    if (!previewData) return;
    saveMut.mutate({
      colaboradorId: previewData.colaboradorId,
      dataDesligamento: previewData.dataDesligamento,
      tipoDesligamento: previewData.tipoDesligamento as any,
      overrides: overrides.avisoPrevioDias !== undefined || overrides.descontosAdicionais !== undefined || overrides.observacao
        ? overrides
        : undefined,
    });
  };

  const handleDiscard = () => {
    // Register discard in audit
    if (previewData) {
      discardMut.mutate({
        colaboradorId: previewData.colaboradorId,
        colaboradorNome: previewData.colaboradorNome,
        cargo: previewData.cargo,
        salarioBase: String(previewData.salarioBase),
        dataDesligamento: previewData.dataDesligamento,
        tipoDesligamento: previewData.tipoDesligamento,
        resultadoJson: JSON.stringify(previewData),
      });
    }
    setPreviewData(null);
    setView('list');
    resetForm();
    toast.info('Cálculo descartado');
  };

  const tryNavigate = useCallback((target: string) => {
    if (hasUnsavedResult) {
      setPendingNavigation(target);
      setShowDiscardAlert(true);
    } else {
      if (target === '__back_to_list') {
        setView('list');
        resetForm();
      } else {
        navigate(target);
      }
    }
  }, [hasUnsavedResult, navigate]);

  const confirmDiscard = () => {
    setShowDiscardAlert(false);
    // Register discard in audit
    if (previewData) {
      discardMut.mutate({
        colaboradorId: previewData.colaboradorId,
        colaboradorNome: previewData.colaboradorNome,
        cargo: previewData.cargo,
        salarioBase: String(previewData.salarioBase),
        dataDesligamento: previewData.dataDesligamento,
        tipoDesligamento: previewData.tipoDesligamento,
        resultadoJson: JSON.stringify(previewData),
      });
    }
    setPreviewData(null);
    setView('list');
    resetForm();
    if (pendingNavigation && pendingNavigation !== '__back_to_list') {
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  // Browser beforeunload warning
  useEffect(() => {
    if (!hasUnsavedResult) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedResult]);

  // ─── LIST VIEW ───
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/rh/administracao">
              <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-indigo-600" /> Rescisão
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cálculo automático de verbas rescisórias por tipo de desligamento
              </p>
            </div>
          </div>
          <Button onClick={() => setView('form')}>
            <Calculator className="w-4 h-4 mr-2" />
            Nova Rescisão
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Rescisões</p>
                  <p className="text-2xl font-bold text-indigo-700">{rescisoes?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Proventos</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency((rescisoes || []).reduce((s: number, r: any) => s + Number(r.totalProventos || 0), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Colaboradores Ativos</p>
                  <p className="text-2xl font-bold text-purple-700">{colabsAtivos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Rescisões + Auditoria */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rescisoes" className="gap-1.5">
              <FileText className="w-4 h-4" /> Rescisões
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-1.5">
              <History className="w-4 h-4" /> Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rescisoes" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : !rescisoes?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhuma rescisão calculada ainda.</p>
                  <p className="text-sm mt-1">Clique em "Nova Rescisão" para calcular verbas rescisórias.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rescisões Calculadas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium">Colaborador</th>
                          <th className="text-left px-4 py-3 font-medium">Tipo</th>
                          <th className="text-center px-4 py-3 font-medium">Data Desligamento</th>
                          <th className="text-right px-4 py-3 font-medium">Salário Base</th>
                          <th className="text-right px-4 py-3 font-medium">Total Líquido</th>
                          <th className="text-center px-4 py-3 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rescisoes.map((r: any) => (
                          <tr key={r.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{r.colaboradorNome}</td>
                            <td className="px-4 py-3">
                              <Badge className={TIPO_DESLIGAMENTO_COLORS[r.tipoDesligamento] || 'bg-gray-100'}>
                                {TIPO_DESLIGAMENTO_LABELS[r.tipoDesligamento] || r.tipoDesligamento}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">{formatDate(r.dataDesligamento)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(r.salarioBase)}</td>
                            <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(r.totalLiquido)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setSelectedRescisao(r); setShowDetailDialog(true); }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => deleteMut.mutate({ id: r.id })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="auditoria" className="mt-4">
            <AuditoriaTab />
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Detalhes da Rescisão
              </DialogTitle>
            </DialogHeader>
            {selectedRescisao && (
              <div className="space-y-4 py-4">
                <Card className="bg-muted/50">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Dados do Colaborador</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Nome:</span> <strong>{selectedRescisao.colaboradorNome}</strong></div>
                      <div><span className="text-muted-foreground">Admissão:</span> <strong>{formatDate(selectedRescisao.dataAdmissao)}</strong></div>
                      <div><span className="text-muted-foreground">Desligamento:</span> <strong>{formatDate(selectedRescisao.dataDesligamento)}</strong></div>
                      <div><span className="text-muted-foreground">Salário Base:</span> <strong>{formatCurrency(selectedRescisao.salarioBase)}</strong></div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Tipo:</span>{' '}
                        <Badge className={TIPO_DESLIGAMENTO_COLORS[selectedRescisao.tipoDesligamento] || 'bg-gray-100'}>
                          {TIPO_DESLIGAMENTO_LABELS[selectedRescisao.tipoDesligamento]}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Verbas Rescisórias</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-2 font-medium">Verba</th>
                          <th className="text-center px-4 py-2 font-medium">Referência</th>
                          <th className="text-right px-4 py-2 font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-4 py-2">Saldo de Salário</td>
                          <td className="px-4 py-2 text-center text-muted-foreground">Dias trabalhados no mês</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(selectedRescisao.saldoSalario)}</td>
                        </tr>
                        {Number(selectedRescisao.avisoPrevio) > 0 && (
                          <tr className="border-b">
                            <td className="px-4 py-2">Aviso Prévio</td>
                            <td className="px-4 py-2 text-center text-muted-foreground">{selectedRescisao.avisoPrevioDias} dias</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(selectedRescisao.avisoPrevio)}</td>
                          </tr>
                        )}
                        {Number(selectedRescisao.decimoTerceiroProporcional) > 0 && (
                          <tr className="border-b">
                            <td className="px-4 py-2">13º Proporcional</td>
                            <td className="px-4 py-2 text-center text-muted-foreground">{selectedRescisao.decimoTerceiroMeses}/12 avos</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(selectedRescisao.decimoTerceiroProporcional)}</td>
                          </tr>
                        )}
                        {Number(selectedRescisao.feriasProporcionais) > 0 && (
                          <tr className="border-b">
                            <td className="px-4 py-2">Férias Proporcionais</td>
                            <td className="px-4 py-2 text-center text-muted-foreground">{selectedRescisao.feriasMeses}/12 avos</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(selectedRescisao.feriasProporcionais)}</td>
                          </tr>
                        )}
                        {Number(selectedRescisao.tercoConstitucional) > 0 && (
                          <tr className="border-b">
                            <td className="px-4 py-2">1/3 Constitucional</td>
                            <td className="px-4 py-2 text-center text-muted-foreground">Sobre férias proporcionais</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(selectedRescisao.tercoConstitucional)}</td>
                          </tr>
                        )}
                        {Number(selectedRescisao.feriasVencidas) > 0 && (
                          <tr className="border-b">
                            <td className="px-4 py-2">Férias Vencidas + 1/3</td>
                            <td className="px-4 py-2 text-center text-muted-foreground">Período aquisitivo completo</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(selectedRescisao.feriasVencidas)}</td>
                          </tr>
                        )}
                        {Number(selectedRescisao.multaFgts) > 0 && (
                          <tr className="border-b">
                            <td className="px-4 py-2">Multa FGTS ({selectedRescisao.multaFgtsPercentual}%)</td>
                            <td className="px-4 py-2 text-center text-muted-foreground">Sobre {formatCurrency(selectedRescisao.fgtsDepositado)} depositado</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(selectedRescisao.multaFgts)}</td>
                          </tr>
                        )}
                        {Number(selectedRescisao.totalDescontos) > 0 && (
                          <tr className="border-b">
                            <td className="px-4 py-2 text-red-700">Descontos</td>
                            <td className="px-4 py-2 text-center text-muted-foreground">Ajuste manual</td>
                            <td className="px-4 py-2 text-right font-medium text-red-700">- {formatCurrency(selectedRescisao.totalDescontos)}</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-green-50 font-bold">
                          <td className="px-4 py-3" colSpan={2}>Total Líquido</td>
                          <td className="px-4 py-3 text-right text-green-700 text-lg">{formatCurrency(selectedRescisao.totalLiquido)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50/50 border-blue-200">
                  <CardContent className="pt-4 pb-4 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-700">Informações FGTS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-blue-700">
                      <div>FGTS Depositado (estimado): <strong>{formatCurrency(selectedRescisao.fgtsDepositado)}</strong></div>
                      <div>Multa FGTS ({selectedRescisao.multaFgtsPercentual}%): <strong>{formatCurrency(selectedRescisao.multaFgts)}</strong></div>
                    </div>
                  </CardContent>
                </Card>
                {selectedRescisao.observacao && (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="pt-3 pb-3 text-sm">
                      <span className="text-muted-foreground text-xs font-medium">Observação:</span>
                      <p className="mt-1">{selectedRescisao.observacao}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── FORM VIEW ───
  if (view === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => tryNavigate('__back_to_list')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-indigo-600" /> Nova Rescisão
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados abaixo para calcular as verbas rescisórias
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <Label className="text-sm font-medium">Colaborador *</Label>
              <Select value={selectedColabId} onValueChange={setSelectedColabId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {colabsAtivos.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nomeCompleto} — {c.cargo || 'Sem cargo'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedColab && (
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-4 pb-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-muted-foreground">Admissão:</span> <strong>{formatDate(selectedColab.dataAdmissao)}</strong></div>
                    <div><span className="text-muted-foreground">Salário:</span> <strong>{formatCurrency(selectedColab.salarioBase)}</strong></div>
                    <div><span className="text-muted-foreground">Contrato:</span> <strong>{selectedColab.tipoContrato?.toUpperCase()}</strong></div>
                    <div><span className="text-muted-foreground">Cargo:</span> <strong>{selectedColab.cargo}</strong></div>
                  </div>
                  {(selectedColab.periodoExperiencia1Inicio || selectedColab.periodoExperiencia2Inicio) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Períodos de Experiência:</p>
                      {selectedColab.periodoExperiencia1Inicio && (
                        <p className="text-xs">1º: {formatDate(selectedColab.periodoExperiencia1Inicio)} a {formatDate(selectedColab.periodoExperiencia1Fim)}</p>
                      )}
                      {selectedColab.periodoExperiencia2Inicio && (
                        <p className="text-xs">2º: {formatDate(selectedColab.periodoExperiencia2Inicio)} a {formatDate(selectedColab.periodoExperiencia2Fim)}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Data de Desligamento *</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={dataDesligamento}
                  onChange={(e) => setDataDesligamento(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Tipo de Desligamento *</Label>
                <Select value={tipoDesligamento} onValueChange={setTipoDesligamento}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_DESLIGAMENTO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipoDesligamento === 'justa_causa' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Na justa causa, o colaborador perde direito a aviso prévio, 13º proporcional, férias proporcionais e multa do FGTS.
                  Recebe apenas saldo de salário e férias vencidas (se houver).
                </p>
              </div>
            )}

            {tipoDesligamento === 'acordo_mutuo' && (
              <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700">
                  No acordo mútuo (Art. 484-A CLT), o aviso prévio é pago pela metade e a multa do FGTS é de 20% (ao invés de 40%).
                  O colaborador pode sacar 80% do FGTS, mas não tem direito ao seguro-desemprego.
                </p>
              </div>
            )}

            <Separator />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCalcular} disabled={previewMut.isPending}>
                {previewMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Rescisão
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── RESULT VIEW ───
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => {
          if (hasUnsavedResult) {
            setPendingNavigation('__back_to_list');
            setShowDiscardAlert(true);
          } else {
            setView('list');
            resetForm();
          }
        }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" /> Rescisão
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cálculo automático de verbas rescisórias por tipo de desligamento
          </p>
        </div>
      </div>

      {previewData && (
        <ResultadoRescisao
          preview={previewData}
          onSave={handleSave}
          onDiscard={() => setShowDiscardAlert(true)}
          isSaving={saveMut.isPending}
        />
      )}

      {/* Discard Alert Dialog */}
      <AlertDialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Descartar cálculo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O cálculo de rescisão ainda não foi salvo. Se você sair agora, os dados serão perdidos.
              Deseja realmente descartar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-red-600 hover:bg-red-700"
            >
              Descartar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
