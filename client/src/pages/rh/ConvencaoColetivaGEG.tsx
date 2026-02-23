import { useState, useMemo, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, FileText, Calendar, AlertTriangle, CheckCircle2, Clock,
  Download, Trash2, Plus, Search, Eye, Brain, Loader2, BookOpen, Scale,
  Briefcase, DollarSign, Heart, UserX, ChevronDown, ChevronUp, RefreshCw,
  Info, Shield, FileWarning
} from 'lucide-react';

// ---- Types ----
interface CCTRecord {
  id: number;
  titulo: string;
  sindicato: string | null;
  vigenciaInicio: string;
  vigenciaFim: string;
  dataBase: string | null;
  cctStatus: 'vigente' | 'vencida' | 'pendente';
  arquivoPdfUrl: string | null;
  arquivoPdfNome: string | null;
  anexosJson: string | null;
  resumoLlm: string | null;
  clausulasJson: string | null;
  regrasFeriasJson: string | null;
  regrasJornadaJson: string | null;
  regrasSalarioJson: string | null;
  regrasBeneficiosJson: string | null;
  regrasRescisaoJson: string | null;
  observacoes: string | null;
  criadoPorId: number | null;
  criadoPorNome: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Clausula {
  numero: string;
  titulo: string;
  conteudo: string;
  categoria: string;
}

// ---- Helpers ----
function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function diasParaVencer(vigenciaFim: string): number {
  const fim = new Date(vigenciaFim + 'T23:59:59');
  const hoje = new Date();
  return Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function statusBadge(status: string, vigenciaFim: string) {
  const dias = diasParaVencer(vigenciaFim);
  if (status === 'vencida' || dias < 0) {
    return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Vencida</Badge>;
  }
  if (dias <= 90) {
    return <Badge className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3" /> Vence em {dias}d</Badge>;
  }
  return <Badge className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> Vigente</Badge>;
}

function categoriaCor(cat: string) {
  const map: Record<string, string> = {
    geral: 'bg-slate-500/20 text-slate-300',
    salario: 'bg-emerald-500/20 text-emerald-300',
    ferias: 'bg-blue-500/20 text-blue-300',
    jornada: 'bg-purple-500/20 text-purple-300',
    beneficios: 'bg-amber-500/20 text-amber-300',
    rescisao: 'bg-red-500/20 text-red-300',
    outros: 'bg-gray-500/20 text-gray-300',
  };
  return map[cat] || map.outros;
}

function categoriaIcon(cat: string) {
  const map: Record<string, any> = {
    geral: Scale,
    salario: DollarSign,
    ferias: Calendar,
    jornada: Clock,
    beneficios: Heart,
    rescisao: UserX,
    outros: BookOpen,
  };
  const Icon = map[cat] || BookOpen;
  return <Icon className="w-4 h-4" />;
}

// ---- Main Component ----
export default function ConvencaoColetivaGEG() {
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedCCT, setSelectedCCT] = useState<CCTRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    sindicato: '',
    vigenciaInicio: '',
    vigenciaFim: '',
    dataBase: '',
    status: 'vigente' as 'vigente' | 'vencida' | 'pendente',
    observacoes: '',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // tRPC queries
  const cctList = trpc.cct.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.cct.create.useMutation({
    onSuccess: () => {
      utils.cct.list.invalidate();
      toast.success('CCT cadastrada com sucesso!');
      resetForm();
    },
    onError: (err) => toast.error('Erro ao cadastrar: ' + err.message),
  });

  const updateMutation = trpc.cct.update.useMutation({
    onSuccess: () => {
      utils.cct.list.invalidate();
      toast.success('CCT atualizada com sucesso!');
    },
    onError: (err) => toast.error('Erro ao atualizar: ' + err.message),
  });

  const deleteMutation = trpc.cct.delete.useMutation({
    onSuccess: () => {
      utils.cct.list.invalidate();
      setSelectedCCT(null);
      toast.success('CCT excluída com sucesso!');
    },
    onError: (err) => toast.error('Erro ao excluir: ' + err.message),
  });

  const uploadMutation = trpc.cct.uploadPdf.useMutation();
  const analisarMutation = trpc.cct.analisarPdf.useMutation();

  // Filtered list
  const filteredList = useMemo(() => {
    if (!cctList.data) return [];
    const list = cctList.data as CCTRecord[];
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(c =>
      c.titulo.toLowerCase().includes(term) ||
      (c.sindicato && c.sindicato.toLowerCase().includes(term))
    );
  }, [cctList.data, searchTerm]);

  // KPIs
  const kpis = useMemo(() => {
    if (!cctList.data) return { total: 0, vigentes: 0, vencidas: 0, alertas: 0 };
    const list = cctList.data as CCTRecord[];
    const vigentes = list.filter(c => c.cctStatus === 'vigente' && diasParaVencer(c.vigenciaFim) > 90).length;
    const vencidas = list.filter(c => c.cctStatus === 'vencida' || diasParaVencer(c.vigenciaFim) < 0).length;
    const alertas = list.filter(c => {
      const d = diasParaVencer(c.vigenciaFim);
      return d >= 0 && d <= 90;
    }).length;
    return { total: list.length, vigentes, vencidas, alertas };
  }, [cctList.data]);

  const resetForm = useCallback(() => {
    setFormData({
      titulo: '', sindicato: '', vigenciaInicio: '', vigenciaFim: '',
      dataBase: '', status: 'vigente', observacoes: '',
    });
    setPdfFile(null);
    setShowForm(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.titulo || !formData.vigenciaInicio || !formData.vigenciaFim) {
      toast.error('Preencha os campos obrigatórios: Título, Vigência Início e Vigência Fim');
      return;
    }

    let pdfUrl: string | undefined;
    let pdfNome: string | undefined;

    // Upload PDF if provided
    if (pdfFile) {
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfFile);
        });

        const uploadResult = await uploadMutation.mutateAsync({
          fileName: pdfFile.name,
          fileBase64: base64,
          contentType: pdfFile.type || 'application/pdf',
        });
        pdfUrl = uploadResult.url;
        pdfNome = uploadResult.fileName;
      } catch (err: any) {
        toast.error('Erro ao fazer upload do PDF: ' + err.message);
        return;
      }
    }

    await createMutation.mutateAsync({
      ...formData,
      arquivoPdfUrl: pdfUrl,
      arquivoPdfNome: pdfNome,
    });
  }, [formData, pdfFile, createMutation, uploadMutation]);

  const handleAnalisarPdf = useCallback(async (cct: CCTRecord) => {
    if (!cct.arquivoPdfUrl) {
      toast.error('Esta CCT não possui PDF anexado');
      return;
    }
    setAnalisando(true);
    try {
      const result = await analisarMutation.mutateAsync({
        cctId: cct.id,
        pdfUrl: cct.arquivoPdfUrl,
      });
      toast.success(`Análise concluída! ${result.totalClausulas} cláusulas extraídas.`);
      utils.cct.list.invalidate();
      // Refresh selected CCT
      const updated = await utils.cct.list.fetch();
      const refreshed = (updated as CCTRecord[])?.find(c => c.id === cct.id);
      if (refreshed) setSelectedCCT(refreshed);
    } catch (err: any) {
      toast.error('Erro na análise: ' + err.message);
    } finally {
      setAnalisando(false);
    }
  }, [analisarMutation, utils]);

  // Parse JSON fields safely
  const parseJson = (json: string | null) => {
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
  };

  // ---- Render: Detail View ----
  if (selectedCCT) {
    const clausulas: Clausula[] = parseJson(selectedCCT.clausulasJson) || [];
    const regrasFerias = parseJson(selectedCCT.regrasFeriasJson);
    const regrasJornada = parseJson(selectedCCT.regrasJornadaJson);
    const regrasSalario = parseJson(selectedCCT.regrasSalarioJson);
    const regrasBeneficios = parseJson(selectedCCT.regrasBeneficiosJson);
    const regrasRescisao = parseJson(selectedCCT.regrasRescisaoJson);
    const hasAnalysis = !!selectedCCT.resumoLlm || clausulas.length > 0;

    return (
      <div className="min-h-screen bg-[#0B1120] text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setSelectedCCT(null)}
              className="text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{selectedCCT.titulo}</h1>
              <p className="text-sm text-white/50">
                {selectedCCT.sindicato || 'Sindicato não informado'} — Vigência: {formatDate(selectedCCT.vigenciaInicio)} a {formatDate(selectedCCT.vigenciaFim)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(selectedCCT.cctStatus, selectedCCT.vigenciaFim)}
              {selectedCCT.arquivoPdfUrl && (
                <Button variant="outline" size="sm" className="gap-1 border-white/10 text-white/70 hover:text-white"
                  onClick={() => window.open(selectedCCT.arquivoPdfUrl!, '_blank')}>
                  <Download className="w-4 h-4" /> PDF
                </Button>
              )}
              {selectedCCT.arquivoPdfUrl && !hasAnalysis && (
                <Button size="sm" className="gap-1 bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleAnalisarPdf(selectedCCT)} disabled={analisando}>
                  {analisando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  {analisando ? 'Analisando...' : 'Analisar com IA'}
                </Button>
              )}
              {hasAnalysis && (
                <Button size="sm" variant="outline" className="gap-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  onClick={() => handleAnalisarPdf(selectedCCT)} disabled={analisando}>
                  {analisando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Re-analisar
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => {
                  if (confirm('Excluir esta CCT permanentemente?')) {
                    deleteMutation.mutate({ id: selectedCCT.id });
                  }
                }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Alerta de vencimento */}
          {(() => {
            const dias = diasParaVencer(selectedCCT.vigenciaFim);
            if (dias < 0) {
              return (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-300">CCT Vencida</p>
                    <p className="text-xs text-red-400/70">Esta convenção coletiva venceu há {Math.abs(dias)} dias. É necessário providenciar a renovação junto ao sindicato.</p>
                  </div>
                </div>
              );
            }
            if (dias <= 90) {
              return (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Atenção: Vencimento Próximo</p>
                    <p className="text-xs text-amber-400/70">Esta CCT vence em {dias} dias ({formatDate(selectedCCT.vigenciaFim)}). Inicie o processo de renovação com antecedência.</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {analisando && (
            <div className="mb-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-300">Análise em andamento...</p>
                <p className="text-xs text-purple-400/70">A IA está lendo e interpretando o PDF da CCT. Isso pode levar até 2 minutos.</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue={hasAnalysis ? 'resumo' : 'info'} className="space-y-4">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="info" className="data-[state=active]:bg-white/10">Informações</TabsTrigger>
              {hasAnalysis && (
                <>
                  <TabsTrigger value="resumo" className="data-[state=active]:bg-white/10">Resumo IA</TabsTrigger>
                  <TabsTrigger value="clausulas" className="data-[state=active]:bg-white/10">
                    Cláusulas ({clausulas.length})
                  </TabsTrigger>
                  <TabsTrigger value="regras" className="data-[state=active]:bg-white/10">Regras Extraídas</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Tab: Informações */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white/70">Dados Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-white/40">Título</span>
                        <p className="text-white/90 font-medium">{selectedCCT.titulo}</p>
                      </div>
                      <div>
                        <span className="text-white/40">Sindicato</span>
                        <p className="text-white/90">{selectedCCT.sindicato || '—'}</p>
                      </div>
                      <div>
                        <span className="text-white/40">Vigência Início</span>
                        <p className="text-white/90">{formatDate(selectedCCT.vigenciaInicio)}</p>
                      </div>
                      <div>
                        <span className="text-white/40">Vigência Fim</span>
                        <p className="text-white/90">{formatDate(selectedCCT.vigenciaFim)}</p>
                      </div>
                      <div>
                        <span className="text-white/40">Data-Base</span>
                        <p className="text-white/90">{formatDate(selectedCCT.dataBase) || '—'}</p>
                      </div>
                      <div>
                        <span className="text-white/40">Cadastrado por</span>
                        <p className="text-white/90">{selectedCCT.criadoPorNome || '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white/70">Documentos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCCT.arquivoPdfUrl ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <FileText className="w-8 h-8 text-red-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">{selectedCCT.arquivoPdfNome || 'Documento PDF'}</p>
                          <p className="text-xs text-white/40">PDF da Convenção Coletiva</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white"
                          onClick={() => window.open(selectedCCT.arquivoPdfUrl!, '_blank')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = selectedCCT.arquivoPdfUrl!;
                            a.download = selectedCCT.arquivoPdfNome || 'cct.pdf';
                            a.click();
                          }}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-white/30">
                        <FileWarning className="w-10 h-10 mb-2" />
                        <p className="text-sm">Nenhum PDF anexado</p>
                      </div>
                    )}

                    {selectedCCT.observacoes && (
                      <div className="mt-3">
                        <span className="text-xs text-white/40">Observações</span>
                        <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{selectedCCT.observacoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Resumo IA */}
            {hasAnalysis && (
              <TabsContent value="resumo" className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-400" />
                      Resumo Gerado por IA
                    </CardTitle>
                    <CardDescription className="text-white/40">
                      Análise automática do documento da CCT
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                        {selectedCCT.resumoLlm || 'Resumo não disponível.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Total', count: clausulas.length, icon: BookOpen, color: 'text-white/70' },
                    { label: 'Salário', count: clausulas.filter(c => c.categoria === 'salario').length, icon: DollarSign, color: 'text-emerald-400' },
                    { label: 'Férias', count: clausulas.filter(c => c.categoria === 'ferias').length, icon: Calendar, color: 'text-blue-400' },
                    { label: 'Jornada', count: clausulas.filter(c => c.categoria === 'jornada').length, icon: Clock, color: 'text-purple-400' },
                    { label: 'Benefícios', count: clausulas.filter(c => c.categoria === 'beneficios').length, icon: Heart, color: 'text-amber-400' },
                    { label: 'Rescisão', count: clausulas.filter(c => c.categoria === 'rescisao').length, icon: UserX, color: 'text-red-400' },
                  ].map(item => (
                    <Card key={item.label} className="bg-white/5 border-white/10">
                      <CardContent className="p-3 flex items-center gap-2">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <div>
                          <p className="text-lg font-bold text-white">{item.count}</p>
                          <p className="text-[10px] text-white/40">{item.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}

            {/* Tab: Cláusulas */}
            {hasAnalysis && (
              <TabsContent value="clausulas" className="space-y-3">
                <ClausulasView clausulas={clausulas} />
              </TabsContent>
            )}

            {/* Tab: Regras Extraídas */}
            {hasAnalysis && (
              <TabsContent value="regras" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RegrasCard title="Férias" icon={Calendar} color="text-blue-400" regras={regrasFerias} />
                  <RegrasCard title="Jornada de Trabalho" icon={Clock} color="text-purple-400" regras={regrasJornada} />
                  <RegrasCard title="Salário e Remuneração" icon={DollarSign} color="text-emerald-400" regras={regrasSalario} isSalario />
                  <RegrasCard title="Benefícios" icon={Heart} color="text-amber-400" regras={regrasBeneficios} />
                  <RegrasCard title="Rescisão" icon={UserX} color="text-red-400" regras={regrasRescisao} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    );
  }

  // ---- Render: List View ----
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rh/administracao')}
            className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Convenção Coletiva de Trabalho (CCT)
            </h1>
            <p className="text-sm text-white/50">
              Gestão de convenções coletivas com análise automática por IA
            </p>
          </div>
          <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Nova CCT
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.total}</p>
                <p className="text-xs text-white/40">Total de CCTs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.vigentes}</p>
                <p className="text-xs text-white/40">Vigentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.alertas}</p>
                <p className="text-xs text-white/40">Vencendo em 90d</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.vencidas}</p>
                <p className="text-xs text-white/40">Vencidas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta global de CCTs vencidas */}
        {kpis.vencidas > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-300">
                {kpis.vencidas} CCT(s) vencida(s)!
              </p>
              <p className="text-xs text-red-400/70">
                Providencie a renovação junto ao sindicato para manter a conformidade trabalhista.
              </p>
            </div>
          </div>
        )}

        {kpis.alertas > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">
                {kpis.alertas} CCT(s) vencendo nos próximos 90 dias
              </p>
              <p className="text-xs text-amber-400/70">
                Inicie o processo de negociação com antecedência para evitar lacunas de cobertura.
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Buscar por título ou sindicato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        {/* List */}
        {cctList.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <FileText className="w-12 h-12 mb-3" />
            <p className="text-base font-medium">Nenhuma CCT cadastrada</p>
            <p className="text-sm mt-1">Clique em "Nova CCT" para adicionar a primeira convenção coletiva.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredList.map((cct) => {
              const dias = diasParaVencer(cct.vigenciaFim);
              const hasAI = !!cct.resumoLlm;
              return (
                <Card key={cct.id}
                  className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer"
                  onClick={() => setSelectedCCT(cct)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
                      <Scale className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white/90 truncate">{cct.titulo}</h3>
                        {hasAI && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] gap-0.5">
                            <Brain className="w-3 h-3" /> IA
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/40">
                        {cct.sindicato || 'Sindicato não informado'} — {formatDate(cct.vigenciaInicio)} a {formatDate(cct.vigenciaFim)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge(cct.cctStatus, cct.vigenciaFim)}
                      {cct.arquivoPdfUrl && (
                        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); window.open(cct.arquivoPdfUrl!, '_blank'); }}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* New CCT Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="bg-[#0F1A2E] border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Nova Convenção Coletiva
              </DialogTitle>
              <DialogDescription className="text-white/40">
                Cadastre uma nova CCT e faça upload do PDF para análise automática por IA.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-white/60">Título *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: CCT Comércio Varejista 2026/2027"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-white/60">Sindicato</Label>
                <Input
                  value={formData.sindicato}
                  onChange={(e) => setFormData(prev => ({ ...prev, sindicato: e.target.value }))}
                  placeholder="Ex: SINDILOJAS-SP"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/60">Vigência Início *</Label>
                  <Input
                    type="date"
                    value={formData.vigenciaInicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, vigenciaInicio: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/60">Vigência Fim *</Label>
                  <Input
                    type="date"
                    value={formData.vigenciaFim}
                    onChange={(e) => setFormData(prev => ({ ...prev, vigenciaFim: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/60">Data-Base</Label>
                  <Input
                    type="date"
                    value={formData.dataBase}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataBase: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/60">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1A2E] border-white/10">
                      <SelectItem value="vigente">Vigente</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PDF Upload */}
              <div>
                <Label className="text-white/60">Documento PDF</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPdfFile(file);
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors"
                >
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-white/70">{pdfFile.name}</span>
                      <Button variant="ghost" size="sm" className="text-white/40 hover:text-red-400 h-6 px-1"
                        onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-white/30">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Clique para selecionar o PDF da CCT</span>
                      <span className="text-[10px]">Após o cadastro, você poderá analisar o documento com IA</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-white/60">Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Notas adicionais sobre esta CCT..."
                  className="bg-white/5 border-white/10 text-white min-h-[60px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={resetForm} className="text-white/60">Cancelar</Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending || uploadMutation.isPending}>
                {(createMutation.isPending || uploadMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                Cadastrar CCT
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function ClausulasView({ clausulas }: { clausulas: Clausula[] }) {
  const [filter, setFilter] = useState('todas');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const categorias = useMemo(() => {
    const cats = new Set(clausulas.map(c => c.categoria));
    return ['todas', ...Array.from(cats)];
  }, [clausulas]);

  const filtered = useMemo(() => {
    if (filter === 'todas') return clausulas;
    return clausulas.filter(c => c.categoria === filter);
  }, [clausulas, filter]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const catLabels: Record<string, string> = {
    todas: 'Todas',
    geral: 'Geral',
    salario: 'Salário',
    ferias: 'Férias',
    jornada: 'Jornada',
    beneficios: 'Benefícios',
    rescisao: 'Rescisão',
    outros: 'Outros',
  };

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            {catLabels[cat] || cat} ({cat === 'todas' ? clausulas.length : clausulas.filter(c => c.categoria === cat).length})
          </button>
        ))}
      </div>

      {/* Clausulas list */}
      {filtered.map((cl, idx) => {
        const isExpanded = expandedIds.has(cl.numero);
        return (
          <Card key={idx} className="bg-white/5 border-white/10">
            <CardContent className="p-0">
              <button
                onClick={() => toggleExpand(cl.numero)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors rounded-lg"
              >
                <div className={`p-1.5 rounded ${categoriaCor(cl.categoria)}`}>
                  {categoriaIcon(cl.categoria)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 font-mono">Cl. {cl.numero}</span>
                    <Badge className={`text-[10px] ${categoriaCor(cl.categoria)}`}>
                      {catLabels[cl.categoria] || cl.categoria}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-white/90 truncate">{cl.titulo}</p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-3 pt-0">
                  <Separator className="bg-white/10 mb-3" />
                  <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{cl.conteudo}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RegrasCard({ title, icon: Icon, color, regras, isSalario }: {
  title: string;
  icon: any;
  color: string;
  regras: any;
  isSalario?: boolean;
}) {
  if (!regras) return null;

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          {title}
        </CardTitle>
        {regras.descricao && (
          <CardDescription className="text-white/40 text-xs">{regras.descricao}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {isSalario && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {regras.pisoSalarial && (
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[10px] text-emerald-400/70">Piso Salarial</p>
                <p className="text-sm font-semibold text-emerald-300">{regras.pisoSalarial}</p>
              </div>
            )}
            {regras.reajuste && (
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[10px] text-emerald-400/70">Reajuste</p>
                <p className="text-sm font-semibold text-emerald-300">{regras.reajuste}</p>
              </div>
            )}
          </div>
        )}
        {regras.itens?.map((item: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
            <span className="text-white/70">{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
