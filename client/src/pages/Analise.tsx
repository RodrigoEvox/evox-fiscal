/*
 * Análise — Evox Fiscal
 * Execução de análise tributária com motor de regras e geração de relatório
 */

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Play, FileSpreadsheet, FileText, CheckCircle, XCircle, AlertTriangle,
  Flag, Target, BarChart3,
} from 'lucide-react';
import { exportarAnaliseExcel, exportarAnalisePDF } from '@/lib/export-utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Analise() {
  const { state, dispatch } = useApp();
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisJustDone, setAnalysisJustDone] = useState(false);

  const cliente = state.clientes.find(c => c.id === selectedClienteId);

  // Get report from state — this will update after dispatch triggers re-render
  const report = state.relatorios.find(r => r.clienteId === selectedClienteId);

  const handleRunAnalysis = async () => {
    if (!selectedClienteId) {
      toast.error('Selecione um cliente para análise.');
      return;
    }
    setAnalyzing(true);
    setAnalysisJustDone(false);
    await new Promise(r => setTimeout(r, 1500));
    dispatch({ type: 'GERAR_ANALISE', payload: selectedClienteId });
    setAnalyzing(false);
    setAnalysisJustDone(true);
    toast.success('Análise tributária concluída!');
  };

  // Reset analysisJustDone when client changes
  useEffect(() => {
    setAnalysisJustDone(false);
  }, [selectedClienteId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise Tributária</h1>
        <p className="text-sm text-muted-foreground mt-1">Execute a análise de oportunidades tributárias para um cliente</p>
      </div>

      {/* Client Selection */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Selecione o Cliente</label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Escolha um cliente para análise..." />
                </SelectTrigger>
                <SelectContent>
                  {state.clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.razaoSocial}</span>
                        <span className="text-muted-foreground text-xs font-data">({c.cnpj})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRunAnalysis}
              disabled={!selectedClienteId || analyzing}
              className="gap-2 bg-[#0A2540] hover:bg-[#0A2540]/90 h-10"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Executar Análise
                </>
              )}
            </Button>
          </div>

          {/* Client Quick Info */}
          {cliente && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center gap-6 text-xs flex-wrap">
              <div>
                <span className="text-muted-foreground">Regime:</span>
                <span className="ml-1 font-medium">
                  {cliente.regimeTributario === 'lucro_real' ? 'Lucro Real' :
                   cliente.regimeTributario === 'lucro_presumido' ? 'Lucro Presumido' : 'Simples Nacional'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Situação:</span>
                <span className="ml-1 font-medium capitalize">{cliente.situacaoCadastral}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Faturamento:</span>
                <span className="ml-1 font-medium font-data">R$ {cliente.faturamentoMedioMensal.toLocaleString('pt-BR')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Guias:</span>
                <span className="ml-1 font-medium font-data">R$ {cliente.valorMedioGuias.toLocaleString('pt-BR')}</span>
              </div>
              {cliente.redFlags.length > 0 && (
                <Badge variant="destructive" className="text-[10px] gap-0.5">
                  <Flag className="w-3 h-3" /> {cliente.redFlags.length} RED FLAG(S)
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardContent className="py-8 text-center">
                <div className="w-12 h-12 border-3 border-[#0A2540]/20 border-t-[#0A2540] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium">Executando análise tributária...</p>
                <p className="text-xs text-muted-foreground mt-1">Cruzando dados com o banco de teses e aplicando motor de regras</p>
                <Progress value={66} className="w-64 mx-auto mt-4" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report */}
      {report && !analyzing && (
        <motion.div
          initial={analysisJustDone ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Report Header */}
          <Card className="border-t-4 border-t-[#0A2540]">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Relatório de Análise</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {report.clienteNome} — {new Date(report.dataAnalise).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportarAnaliseExcel(report)}>
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportarAnalisePDF(report)}>
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </Button>
                </div>
              </div>

              {/* Score and Priority */}
              <div className="grid grid-cols-4 gap-4 mt-5">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold font-data text-[#0A2540]">{report.scoreOportunidade}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Score Oportunidade</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold font-data text-emerald-600">{report.tesesAplicaveis.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Teses Aplicáveis</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold font-data text-gray-500">{report.tesesDescartadas.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Teses Descartadas</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Badge className={`text-sm px-3 py-1 ${
                    report.prioridade === 'alta' ? 'bg-emerald-500 text-white' :
                    report.prioridade === 'media' ? 'bg-amber-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {report.prioridade === 'alta' ? 'ALTA' : report.prioridade === 'media' ? 'MÉDIA' : 'BAIXA'}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Prioridade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Red Flags */}
          {report.redFlags.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <Flag className="w-4 h-4" /> RED FLAGS ({report.redFlags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.redFlags.map(flag => (
                    <div key={flag.id} className="flex items-start gap-2 p-2 rounded bg-white/60">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-red-800">{flag.tipo.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-xs text-red-600/80 mt-0.5">{flag.descricao}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] ml-auto border-red-300 text-red-600 shrink-0">
                        {flag.impacto.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnóstico */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Diagnóstico Tributário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.diagnosticoTributario}</p>
            </CardContent>
          </Card>

          {/* Teses Tabs */}
          <Tabs defaultValue="aplicaveis">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="aplicaveis" className="gap-1.5">
                <CheckCircle className="w-4 h-4" /> Teses Aplicáveis ({report.tesesAplicaveis.length})
              </TabsTrigger>
              <TabsTrigger value="descartadas" className="gap-1.5">
                <XCircle className="w-4 h-4" /> Teses Descartadas ({report.tesesDescartadas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aplicaveis" className="space-y-3 mt-4">
              {report.tesesAplicaveis.map((tese, idx) => (
                <Card key={tese.teseId} className="border-l-4 border-l-emerald-500">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-data text-muted-foreground">#{idx + 1}</span>
                          <p className="text-sm font-semibold">{tese.teseNome}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-3 mt-3">
                          <div className="text-center p-2 rounded bg-muted/50">
                            <p className="text-lg font-bold font-data text-[#0A2540]">{tese.grauAderencia}%</p>
                            <p className="text-[10px] text-muted-foreground">Aderência</p>
                          </div>
                          <div className="text-center p-2 rounded bg-muted/50">
                            <p className="text-lg font-bold font-data text-emerald-600">
                              R$ {(tese.estimativaRecuperacao / 1000).toFixed(0)}k
                            </p>
                            <p className="text-[10px] text-muted-foreground">Estimativa</p>
                          </div>
                          <div className="text-center p-2 rounded bg-muted/50">
                            <p className="text-lg font-bold font-data">{tese.segurancaJuridica}%</p>
                            <p className="text-[10px] text-muted-foreground">Segurança</p>
                          </div>
                          <div className="text-center p-2 rounded bg-muted/50">
                            <Badge className={`text-[10px] ${
                              tese.recomendacaoEstrategica === 'administrativa' ? 'bg-emerald-500/10 text-emerald-700' :
                              tese.recomendacaoEstrategica === 'judicial' ? 'bg-blue-500/10 text-blue-700' :
                              tese.recomendacaoEstrategica === 'preventiva' ? 'bg-amber-500/10 text-amber-700' :
                              'bg-red-500/10 text-red-700'
                            }`}>
                              {tese.recomendacaoEstrategica === 'administrativa' ? 'Administrativa' :
                               tese.recomendacaoEstrategica === 'judicial' ? 'Judicial' :
                               tese.recomendacaoEstrategica === 'preventiva' ? 'Preventiva' : 'Não Recomendada'}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground mt-1">Via</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Fundamentação:</span> {tese.fundamentacaoAplicabilidade}</p>
                          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Justificativa:</span> {tese.justificativaTecnica}</p>
                        </div>
                        {tese.documentosComplementares.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] font-medium text-foreground mb-1">Documentos necessários:</p>
                            <div className="flex flex-wrap gap-1">
                              {tese.documentosComplementares.map((d, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {report.tesesAplicaveis.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <XCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma tese aplicável identificada para este perfil.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="descartadas" className="space-y-2 mt-4">
              {report.tesesDescartadas.map(tese => (
                <Card key={tese.teseId} className="border-l-4 border-l-gray-300">
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{tese.teseNome}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium text-red-600">Motivo:</span> {tese.motivoExclusao || tese.justificativaTecnica}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Recomendação Geral */}
          <Card className="bg-[#0A2540] text-white">
            <CardContent className="py-5">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Recomendação Estratégica</p>
                  <p className="text-sm text-white/80 mt-1 leading-relaxed">{report.recomendacaoGeral}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {!report && !analyzing && (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Selecione um cliente e execute a análise</p>
            <p className="text-xs text-muted-foreground mt-1">O motor de regras irá cruzar os dados do cliente com o banco de teses tributárias</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
