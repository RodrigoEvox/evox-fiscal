import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Briefcase, Loader2, Calculator, DollarSign, Calendar, Users,
  FileText, Trash2, Eye, AlertTriangle,
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

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d: string | null | undefined) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

export default function RescisaoPage() {
  const [showCalcDialog, setShowCalcDialog] = useState(false);
  const [selectedColabId, setSelectedColabId] = useState<string>('');
  const [dataDesligamento, setDataDesligamento] = useState('');
  const [tipoDesligamento, setTipoDesligamento] = useState<string>('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRescisao, setSelectedRescisao] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: rescisoes, isLoading } = trpc.rescisoes.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();

  const calcularMut = trpc.rescisoes.calcular.useMutation({
    onSuccess: (data) => {
      utils.rescisoes.list.invalidate();
      toast.success(`Rescisão calculada! Total líquido: ${formatCurrency(data.totalLiquido)}`);
      setShowCalcDialog(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
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
    calcularMut.mutate({
      colaboradorId: Number(selectedColabId),
      dataDesligamento,
      tipoDesligamento: tipoDesligamento as any,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" /> Rescisão
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cálculo automático de verbas rescisórias por tipo de desligamento
          </p>
        </div>
        <Button onClick={() => setShowCalcDialog(true)}>
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

      {/* Rescisões List */}
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

      {/* Nova Rescisão Dialog */}
      <Dialog open={showCalcDialog} onOpenChange={setShowCalcDialog}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Calcular Rescisão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={selectedColabId} onValueChange={setSelectedColabId}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {colabsAtivos.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nomeCompleto} — {c.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedColab && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 pb-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
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

            <div>
              <Label>Data de Desligamento *</Label>
              <Input
                type="date"
                value={dataDesligamento}
                onChange={(e) => setDataDesligamento(e.target.value)}
              />
            </div>

            <div>
              <Label>Tipo de Desligamento *</Label>
              <Select value={tipoDesligamento} onValueChange={setTipoDesligamento}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_DESLIGAMENTO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCalcDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCalcular} disabled={calcularMut.isPending}>
              {calcularMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Calcular Rescisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {/* Dados do Colaborador */}
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
                  {(selectedRescisao.periodoExperiencia1Inicio || selectedRescisao.periodoExperiencia2Inicio) && (
                    <div className="pt-2 mt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Períodos de Experiência:</p>
                      {selectedRescisao.periodoExperiencia1Inicio && (
                        <p className="text-xs">1º: {formatDate(selectedRescisao.periodoExperiencia1Inicio)} a {formatDate(selectedRescisao.periodoExperiencia1Fim)}</p>
                      )}
                      {selectedRescisao.periodoExperiencia2Inicio && (
                        <p className="text-xs">2º: {formatDate(selectedRescisao.periodoExperiencia2Inicio)} a {formatDate(selectedRescisao.periodoExperiencia2Fim)}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Verbas Rescisórias */}
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

              {/* FGTS Info */}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
