import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertTriangle, ArrowLeft, Plus, Loader2, Search, Eye, Trash2,
  CheckCircle2, Clock, XCircle, FileText, Users, BarChart3,
  Shield, AlertCircle, RefreshCw, UserX, Calendar, Info,
} from 'lucide-react';

// ---- Labels & Maps ----
const TIPO_LABELS: Record<string, string> = {
  falta_injustificada: 'Falta Injustificada',
  atraso_frequente: 'Atraso Frequente',
  falta_leve: 'Falta Leve',
  falta_media: 'Falta Média',
  falta_grave: 'Falta Grave',
  erro_trabalho: 'Erro na Execução',
  conduta_inapropriada: 'Conduta Inapropriada',
  conflito_interno: 'Conflito Interno',
};

const GRAVIDADE_LABELS: Record<string, string> = {
  leve: 'Leve',
  media: 'Média',
  grave: 'Grave',
  gravissima: 'Gravíssima',
};

const GRAVIDADE_COLORS: Record<string, string> = {
  leve: 'bg-green-100 text-green-800 border-green-200',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  grave: 'bg-orange-100 text-orange-800 border-orange-200',
  gravissima: 'bg-red-100 text-red-800 border-red-200',
};

const CLASSIFICACAO_COLORS: Record<string, string> = {
  reversivel: 'bg-blue-100 text-blue-800 border-blue-200',
  irreversivel: 'bg-red-100 text-red-800 border-red-200',
};

const RECOMENDACAO_LABELS: Record<string, string> = {
  advertencia: 'Advertência',
  suspensao: 'Suspensão',
  reversao: 'Plano de Reversão',
  desligamento: 'Desligamento',
};

const RECOMENDACAO_COLORS: Record<string, string> = {
  advertencia: 'bg-blue-100 text-blue-800 border-blue-200',
  suspensao: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reversao: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  desligamento: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  registrada: 'Registrada',
  em_analise: 'Em Análise',
  resolvida: 'Resolvida',
  encaminhada_reversao: 'Em Reversão',
  encaminhada_desligamento: 'Enc. Desligamento',
};

const STATUS_COLORS: Record<string, string> = {
  registrada: 'bg-gray-100 text-gray-800',
  em_analise: 'bg-blue-100 text-blue-800',
  resolvida: 'bg-green-100 text-green-800',
  encaminhada_reversao: 'bg-emerald-100 text-emerald-800',
  encaminhada_desligamento: 'bg-red-100 text-red-800',
};

const PLANO_STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  concluido_sucesso: 'Concluído (Sucesso)',
  concluido_fracasso: 'Concluído (Fracasso)',
  cancelado: 'Cancelado',
};

const PLANO_STATUS_COLORS: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-800',
  concluido_sucesso: 'bg-green-100 text-green-800',
  concluido_fracasso: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-100 text-gray-800',
};

// ---- Guia de Classificação Data ----
const TIPOS_OCORRENCIA_GUIA = [
  { tipo: 'Falta Injustificada', desc: 'Ausência sem justificativa legal ou comunicação prévia', gravidade: 'Leve a Média', baseLegal: 'CLT Art. 473, 482(i)' },
  { tipo: 'Atraso Frequente', desc: 'Padrão recorrente de atrasos na jornada de trabalho', gravidade: 'Leve a Média', baseLegal: 'CLT Art. 58, 482(e)' },
  { tipo: 'Falta Leve', desc: 'Infração de baixo impacto, sem dolo ou reincidência', gravidade: 'Leve', baseLegal: 'Regulamento interno' },
  { tipo: 'Falta Média', desc: 'Infração com impacto moderado, possível reincidência', gravidade: 'Média', baseLegal: 'CLT Art. 482' },
  { tipo: 'Falta Grave', desc: 'Infração grave conforme CLT Art. 482 (justa causa)', gravidade: 'Grave a Gravíssima', baseLegal: 'CLT Art. 482(a-l)' },
  { tipo: 'Erro na Execução', desc: 'Falha na execução de tarefas por negligência ou imperícia', gravidade: 'Leve a Grave', baseLegal: 'CLT Art. 482(e)' },
  { tipo: 'Conduta Inapropriada', desc: 'Comportamento inadequado no ambiente de trabalho', gravidade: 'Média a Gravíssima', baseLegal: 'CLT Art. 482(b,j)' },
  { tipo: 'Conflito Interno', desc: 'Desentendimentos ou conflitos entre colaboradores', gravidade: 'Média a Grave', baseLegal: 'CLT Art. 482(j,k)' },
];

const MATRIZ_CLASSIFICACAO = [
  { cenario: 'Gravidade Leve, 1ª ocorrência', classificacao: 'Reversível', recomendacao: 'Advertência', acao: 'Advertência verbal ou escrita. Orientação ao colaborador.' },
  { cenario: 'Gravidade Média ou 2ª reincidência', classificacao: 'Reversível', recomendacao: 'Suspensão', acao: 'Suspensão disciplinar (1-30 dias). Documentar formalmente.' },
  { cenario: 'Gravidade Grave ou 3+ reincidências', classificacao: 'Reversível', recomendacao: 'Plano de Reversão', acao: 'Abrir plano de reversão com prazo de 30-90 dias.' },
  { cenario: 'Gravidade Gravíssima (qualquer tipo)', classificacao: 'Irreversível', recomendacao: 'Desligamento', acao: 'Desligamento por justa causa ou sem justa causa.' },
  { cenario: 'Conduta Inapropriada Grave/Gravíssima', classificacao: 'Irreversível', recomendacao: 'Desligamento', acao: 'Assédio, discriminação, violência — justa causa imediata.' },
  { cenario: '3+ reincidências (não leve)', classificacao: 'Irreversível', recomendacao: 'Desligamento', acao: 'Padrão reincidente demonstra inaptidão para o cargo.' },
];

export default function OcorrenciasReversaoPage() {
  const [tab, setTab] = useState('ocorrencias');
  const [showNovaOcorrencia, setShowNovaOcorrencia] = useState(false);
  const [showNovoPlano, setShowNovoPlano] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState<number | null>(null);
  const [showDetalhesPlano, setShowDetalhesPlano] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todas');
  const [filterStatus, setFilterStatus] = useState('todos');

  // Form state for nova ocorrência
  const [formOcorrencia, setFormOcorrencia] = useState({
    colaboradorId: 0,
    colaboradorNome: '',
    cargo: '',
    setor: '',
    tipo: '' as string,
    gravidade: '' as string,
    descricao: '',
    dataOcorrencia: new Date().toISOString().split('T')[0],
    evidencias: '',
    testemunhas: '',
    medidasTomadas: '',
  });

  // Form state for novo plano
  const [formPlano, setFormPlano] = useState({
    colaboradorId: 0,
    colaboradorNome: '',
    cargo: '',
    setor: '',
    motivo: '',
    objetivos: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    responsavel: '',
    frequenciaAcompanhamento: 'quinzenal' as string,
    observacoes: '',
  });

  // Queries
  const statsQuery = trpc.ocorrencias.stats.useQuery();
  const ocorrenciasQuery = trpc.ocorrencias.list.useQuery();
  const planosQuery = trpc.planosReversao.list.useQuery();
  const colaboradoresQuery = trpc.colaboradores?.list?.useQuery?.() ?? { data: [] };

  const utils = trpc.useUtils();

  // Mutations
  const createOcorrencia = trpc.ocorrencias.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Ocorrência registrada. Classificação: ${data.classificacao === 'reversivel' ? 'Reversível' : 'Irreversível'}. Recomendação: ${RECOMENDACAO_LABELS[data.recomendacao]}`);
      setShowNovaOcorrencia(false);
      resetFormOcorrencia();
      utils.ocorrencias.list.invalidate();
      utils.ocorrencias.stats.invalidate();
    },
    onError: () => toast.error('Erro ao registrar ocorrência'),
  });

  const updateOcorrencia = trpc.ocorrencias.update.useMutation({
    onSuccess: () => {
      toast.success('Ocorrência atualizada');
      utils.ocorrencias.list.invalidate();
      utils.ocorrencias.stats.invalidate();
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const deleteOcorrencia = trpc.ocorrencias.delete.useMutation({
    onSuccess: () => {
      toast.success('Ocorrência removida');
      setShowDetalhes(null);
      utils.ocorrencias.list.invalidate();
      utils.ocorrencias.stats.invalidate();
    },
    onError: () => toast.error('Erro ao remover'),
  });

  const createPlano = trpc.planosReversao.create.useMutation({
    onSuccess: () => {
      toast.success('Plano de reversão criado');
      setShowNovoPlano(false);
      resetFormPlano();
      utils.planosReversao.list.invalidate();
      utils.ocorrencias.stats.invalidate();
    },
    onError: () => toast.error('Erro ao criar plano'),
  });

  const updatePlano = trpc.planosReversao.update.useMutation({
    onSuccess: () => {
      toast.success('Plano atualizado');
      utils.planosReversao.list.invalidate();
    },
    onError: () => toast.error('Erro ao atualizar plano'),
  });

  const deletePlano = trpc.planosReversao.delete.useMutation({
    onSuccess: () => {
      toast.success('Plano removido');
      setShowDetalhesPlano(null);
      utils.planosReversao.list.invalidate();
      utils.ocorrencias.stats.invalidate();
    },
    onError: () => toast.error('Erro ao remover plano'),
  });

  function resetFormOcorrencia() {
    setFormOcorrencia({
      colaboradorId: 0, colaboradorNome: '', cargo: '', setor: '',
      tipo: '', gravidade: '', descricao: '',
      dataOcorrencia: new Date().toISOString().split('T')[0],
      evidencias: '', testemunhas: '', medidasTomadas: '',
    });
  }

  function resetFormPlano() {
    setFormPlano({
      colaboradorId: 0, colaboradorNome: '', cargo: '', setor: '',
      motivo: '', objetivos: '',
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: '', responsavel: '', frequenciaAcompanhamento: 'quinzenal', observacoes: '',
    });
  }

  // Filtered ocorrências
  const filteredOcorrencias = useMemo(() => {
    const list = ocorrenciasQuery.data || [];
    return list.filter((o: any) => {
      const matchSearch = !searchTerm || o.colaboradorNome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = filterTipo === 'todas' || o.tipo === filterTipo;
      const matchStatus = filterStatus === 'todos' || o.status === filterStatus;
      return matchSearch && matchTipo && matchStatus;
    });
  }, [ocorrenciasQuery.data, searchTerm, filterTipo, filterStatus]);

  const stats = statsQuery.data || { total: 0, pendentes: 0, emAnalise: 0, resolvidas: 0, encaminhadasReversao: 0, encaminhadasDesligamento: 0 };
  const planosAtivos = (planosQuery.data || []).filter((p: any) => p.status === 'ativo').length;

  const colaboradoresList = (colaboradoresQuery as any)?.data || [];

  function handleSelectColaboradorOcorrencia(colabId: string) {
    const id = Number(colabId);
    const colab = colaboradoresList.find((c: any) => c.id === id);
    if (colab) {
      setFormOcorrencia(prev => ({
        ...prev,
        colaboradorId: colab.id,
        colaboradorNome: colab.nomeCompleto || colab.nome || '',
        cargo: colab.cargo || '',
        setor: colab.setor || '',
      }));
    }
  }

  function handleSelectColaboradorPlano(colabId: string) {
    const id = Number(colabId);
    const colab = colaboradoresList.find((c: any) => c.id === id);
    if (colab) {
      setFormPlano(prev => ({
        ...prev,
        colaboradorId: colab.id,
        colaboradorNome: colab.nomeCompleto || colab.nome || '',
        cargo: colab.cargo || '',
        setor: colab.setor || '',
      }));
    }
  }

  function handleSubmitOcorrencia() {
    if (!formOcorrencia.colaboradorNome || !formOcorrencia.tipo || !formOcorrencia.gravidade || !formOcorrencia.descricao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createOcorrencia.mutate({
      ...formOcorrencia,
      tipo: formOcorrencia.tipo as any,
      gravidade: formOcorrencia.gravidade as any,
    });
  }

  function handleSubmitPlano() {
    if (!formPlano.colaboradorNome || !formPlano.motivo || !formPlano.objetivos || !formPlano.dataFim || !formPlano.responsavel) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createPlano.mutate({
      ...formPlano,
      frequenciaAcompanhamento: formPlano.frequenciaAcompanhamento as any,
    });
  }

  const detalheOcorrencia = showDetalhes ? (ocorrenciasQuery.data || []).find((o: any) => o.id === showDetalhes) : null;
  const detalhePlano = showDetalhesPlano ? (planosQuery.data || []).find((p: any) => p.id === showDetalhesPlano) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/rh/gestao-rh">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Ocorrências e Plano de Reversão
          </h1>
          <p className="text-muted-foreground text-sm">
            Registro de ocorrências disciplinares e programa estruturado de recuperação de colaboradores
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-l-4 border-l-slate-400">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Ocorrências</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-400">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Em Análise</p>
            <p className="text-2xl font-bold text-blue-600">{stats.emAnalise}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Resolvidas</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolvidas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-400">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Em Reversão</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.encaminhadasReversao}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Planos Ativos</p>
            <p className="text-2xl font-bold text-red-600">{planosAtivos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ocorrencias"><FileText className="w-4 h-4 mr-1" /> Ocorrências</TabsTrigger>
          <TabsTrigger value="planos"><RefreshCw className="w-4 h-4 mr-1" /> Planos de Reversão</TabsTrigger>
          <TabsTrigger value="guia"><BarChart3 className="w-4 h-4 mr-1" /> Guia de Classificação</TabsTrigger>
        </TabsList>

        {/* ---- TAB: OCORRÊNCIAS ---- */}
        <TabsContent value="ocorrencias">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registro de Ocorrências</CardTitle>
                <CardDescription>Histórico disciplinar dos colaboradores com classificação automática</CardDescription>
              </div>
              <Button onClick={() => setShowNovaOcorrencia(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nova Ocorrência
              </Button>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar colaborador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* List */}
              {ocorrenciasQuery.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : filteredOcorrencias.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Nenhuma ocorrência registrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOcorrencias.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setShowDetalhes(o.id)}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{o.colaboradorNome}</span>
                            <Badge variant="outline" className={`text-xs ${GRAVIDADE_COLORS[o.gravidade] || ''}`}>
                              {GRAVIDADE_LABELS[o.gravidade] || o.gravidade}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${CLASSIFICACAO_COLORS[o.classificacao] || ''}`}>
                              {o.classificacao === 'reversivel' ? 'Reversível' : 'Irreversível'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{TIPO_LABELS[o.tipo] || o.tipo}</span>
                            <span>•</span>
                            <span>{o.dataOcorrencia}</span>
                            {o.setor && <><span>•</span><span>{o.setor}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${RECOMENDACAO_COLORS[o.recomendacao] || ''}`}>
                          {RECOMENDACAO_LABELS[o.recomendacao] || o.recomendacao}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[o.status] || ''}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- TAB: PLANOS DE REVERSÃO ---- */}
        <TabsContent value="planos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Planos de Reversão</CardTitle>
                <CardDescription>Programa estruturado de recuperação com acompanhamento e feedback contínuo</CardDescription>
              </div>
              <Button onClick={() => setShowNovoPlano(true)}>
                <Plus className="w-4 h-4 mr-1" /> Novo Plano
              </Button>
            </CardHeader>
            <CardContent>
              {planosQuery.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : (planosQuery.data || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Nenhum plano de reversão cadastrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(planosQuery.data || []).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setShowDetalhesPlano(p.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{p.colaboradorNome}</span>
                          <Badge variant="outline" className={`text-xs ${PLANO_STATUS_COLORS[p.status] || ''}`}>
                            {PLANO_STATUS_LABELS[p.status] || p.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{p.dataInicio} a {p.dataFim}</span>
                          <span>•</span>
                          <span>Responsável: {p.responsavel}</span>
                          {p.setor && <><span>•</span><span>{p.setor}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowDetalhesPlano(p.id); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- TAB: GUIA DE CLASSIFICAÇÃO ---- */}
        <TabsContent value="guia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Guia de Classificação de Ocorrências</CardTitle>
              <CardDescription>Matriz de classificação automática baseada em boas práticas de RH, CLT e jurisprudência trabalhista</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipos de Ocorrência */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Tipos de Ocorrência e Gravidade Típica</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Tipo</th>
                        <th className="text-left py-2 px-3 font-medium">Descrição</th>
                        <th className="text-left py-2 px-3 font-medium">Gravidade Típica</th>
                        <th className="text-left py-2 px-3 font-medium">Base Legal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TIPOS_OCORRENCIA_GUIA.map((t, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">{t.tipo}</td>
                          <td className="py-2 px-3 text-muted-foreground">{t.desc}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className={`text-xs ${
                              t.gravidade.includes('Gravíssima') ? 'bg-red-50 text-red-700' :
                              t.gravidade.includes('Grave') ? 'bg-orange-50 text-orange-700' :
                              t.gravidade.includes('Média') ? 'bg-yellow-50 text-yellow-700' :
                              'bg-green-50 text-green-700'
                            }`}>{t.gravidade}</Badge>
                          </td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{t.baseLegal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              {/* Matriz de Classificação */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Matriz de Classificação Automática</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Cenário</th>
                        <th className="text-left py-2 px-3 font-medium">Classificação</th>
                        <th className="text-left py-2 px-3 font-medium">Recomendação</th>
                        <th className="text-left py-2 px-3 font-medium">Ação Sugerida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MATRIZ_CLASSIFICACAO.map((m, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">{m.cenario}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className={`text-xs ${m.classificacao === 'Reversível' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                              {m.classificacao}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className={`text-xs ${
                              m.recomendacao === 'Advertência' ? 'bg-blue-50 text-blue-700' :
                              m.recomendacao === 'Suspensão' ? 'bg-yellow-50 text-yellow-700' :
                              m.recomendacao === 'Plano de Reversão' ? 'bg-emerald-50 text-emerald-700' :
                              'bg-red-50 text-red-700'
                            }`}>{m.recomendacao}</Badge>
                          </td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{m.acao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              {/* Estrutura do Plano de Reversão */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Estrutura do Plano de Reversão (Boas Práticas)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-l-4 border-l-blue-400">
                    <CardContent className="p-4">
                      <h4 className="font-semibold">1. Feedback Inicial</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reunião formal com o colaborador para apresentar o plano, explicar os motivos, definir expectativas e obter comprometimento.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-emerald-400">
                    <CardContent className="p-4">
                      <h4 className="font-semibold">2. Metas e Objetivos</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Definir metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes e Temporais) para o período do plano.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-yellow-400">
                    <CardContent className="p-4">
                      <h4 className="font-semibold">3. Acompanhamento Periódico</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reuniões regulares (semanal/quinzenal) para avaliar progresso, dar feedback e ajustar metas se necessário.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-purple-400">
                    <CardContent className="p-4">
                      <h4 className="font-semibold">4. Avaliação Final</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ao final do prazo, avaliar se o colaborador atingiu os objetivos. Decidir entre reintegração plena ou desligamento.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Prazos Recomendados */}
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Prazos Recomendados</h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                    <li>Ocorrências leves: Plano de 30 dias com acompanhamento semanal</li>
                    <li>Ocorrências médias: Plano de 45-60 dias com acompanhamento quinzenal</li>
                    <li>Ocorrências graves (reversíveis): Plano de 60-90 dias com acompanhamento semanal</li>
                    <li>Prazo máximo recomendado: 90 dias (3 meses)</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- DIALOG: NOVA OCORRÊNCIA ---- */}
      <Dialog open={showNovaOcorrencia} onOpenChange={setShowNovaOcorrencia}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Ocorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Colaborador *</Label>
                {colaboradoresList.length > 0 ? (
                  <Select value={formOcorrencia.colaboradorId ? String(formOcorrencia.colaboradorId) : ''} onValueChange={handleSelectColaboradorOcorrencia}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {colaboradoresList.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto || c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Nome do colaborador" value={formOcorrencia.colaboradorNome} onChange={e => setFormOcorrencia(prev => ({ ...prev, colaboradorNome: e.target.value }))} />
                )}
              </div>
              <div>
                <Label>Data da Ocorrência *</Label>
                <Input type="date" value={formOcorrencia.dataOcorrencia} onChange={e => setFormOcorrencia(prev => ({ ...prev, dataOcorrencia: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cargo</Label>
                <Input value={formOcorrencia.cargo} onChange={e => setFormOcorrencia(prev => ({ ...prev, cargo: e.target.value }))} />
              </div>
              <div>
                <Label>Setor</Label>
                <Input value={formOcorrencia.setor} onChange={e => setFormOcorrencia(prev => ({ ...prev, setor: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Ocorrência *</Label>
                <Select value={formOcorrencia.tipo} onValueChange={v => setFormOcorrencia(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gravidade *</Label>
                <Select value={formOcorrencia.gravidade} onValueChange={v => setFormOcorrencia(prev => ({ ...prev, gravidade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GRAVIDADE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição da Ocorrência *</Label>
              <Textarea rows={3} placeholder="Descreva a ocorrência em detalhes..." value={formOcorrencia.descricao} onChange={e => setFormOcorrencia(prev => ({ ...prev, descricao: e.target.value }))} />
            </div>
            <div>
              <Label>Evidências</Label>
              <Textarea rows={2} placeholder="Documentos, testemunhos, registros..." value={formOcorrencia.evidencias} onChange={e => setFormOcorrencia(prev => ({ ...prev, evidencias: e.target.value }))} />
            </div>
            <div>
              <Label>Testemunhas</Label>
              <Input placeholder="Nomes das testemunhas" value={formOcorrencia.testemunhas} onChange={e => setFormOcorrencia(prev => ({ ...prev, testemunhas: e.target.value }))} />
            </div>
            <div>
              <Label>Medidas Tomadas</Label>
              <Textarea rows={2} placeholder="Medidas já adotadas..." value={formOcorrencia.medidasTomadas} onChange={e => setFormOcorrencia(prev => ({ ...prev, medidasTomadas: e.target.value }))} />
            </div>

            {/* Preview de classificação */}
            {formOcorrencia.tipo && formOcorrencia.gravidade && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Classificação prévia:</span>
                    <span>O sistema irá classificar automaticamente com base no tipo, gravidade e histórico do colaborador.</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovaOcorrencia(false)}>Cancelar</Button>
            <Button onClick={handleSubmitOcorrencia} disabled={createOcorrencia.isPending}>
              {createOcorrencia.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Registrar Ocorrência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- DIALOG: DETALHES OCORRÊNCIA ---- */}
      <Dialog open={!!showDetalhes} onOpenChange={() => setShowDetalhes(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detalheOcorrencia && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Ocorrência #{detalheOcorrencia.id} — {detalheOcorrencia.colaboradorNome}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={GRAVIDADE_COLORS[detalheOcorrencia.gravidade]}>
                    {GRAVIDADE_LABELS[detalheOcorrencia.gravidade]}
                  </Badge>
                  <Badge variant="outline" className={CLASSIFICACAO_COLORS[detalheOcorrencia.classificacao]}>
                    {detalheOcorrencia.classificacao === 'reversivel' ? 'Reversível' : 'Irreversível'}
                  </Badge>
                  <Badge className={RECOMENDACAO_COLORS[detalheOcorrencia.recomendacao]}>
                    {RECOMENDACAO_LABELS[detalheOcorrencia.recomendacao]}
                  </Badge>
                  <Badge variant="outline" className={STATUS_COLORS[detalheOcorrencia.status]}>
                    {STATUS_LABELS[detalheOcorrencia.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Tipo:</span> {TIPO_LABELS[detalheOcorrencia.tipo]}</div>
                  <div><span className="text-muted-foreground">Data:</span> {detalheOcorrencia.dataOcorrencia}</div>
                  {detalheOcorrencia.cargo && <div><span className="text-muted-foreground">Cargo:</span> {detalheOcorrencia.cargo}</div>}
                  {detalheOcorrencia.setor && <div><span className="text-muted-foreground">Setor:</span> {detalheOcorrencia.setor}</div>}
                  <div><span className="text-muted-foreground">Registrado por:</span> {detalheOcorrencia.registradoPorNome}</div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{detalheOcorrencia.descricao}</p>
                </div>

                {detalheOcorrencia.evidencias && (
                  <div>
                    <h4 className="font-medium mb-1">Evidências</h4>
                    <p className="text-sm text-muted-foreground">{detalheOcorrencia.evidencias}</p>
                  </div>
                )}

                {detalheOcorrencia.testemunhas && (
                  <div>
                    <h4 className="font-medium mb-1">Testemunhas</h4>
                    <p className="text-sm text-muted-foreground">{detalheOcorrencia.testemunhas}</p>
                  </div>
                )}

                {detalheOcorrencia.medidasTomadas && (
                  <div>
                    <h4 className="font-medium mb-1">Medidas Tomadas</h4>
                    <p className="text-sm text-muted-foreground">{detalheOcorrencia.medidasTomadas}</p>
                  </div>
                )}

                <Separator />

                {/* Alterar Status */}
                <div>
                  <Label>Alterar Status</Label>
                  <Select value={detalheOcorrencia.status} onValueChange={v => updateOcorrencia.mutate({ id: detalheOcorrencia.id, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" size="sm" onClick={() => deleteOcorrencia.mutate({ id: detalheOcorrencia.id })} disabled={deleteOcorrencia.isPending}>
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
                <Button variant="outline" onClick={() => setShowDetalhes(null)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- DIALOG: NOVO PLANO ---- */}
      <Dialog open={showNovoPlano} onOpenChange={setShowNovoPlano}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Plano de Reversão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Colaborador *</Label>
                {colaboradoresList.length > 0 ? (
                  <Select value={formPlano.colaboradorId ? String(formPlano.colaboradorId) : ''} onValueChange={handleSelectColaboradorPlano}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {colaboradoresList.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto || c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Nome do colaborador" value={formPlano.colaboradorNome} onChange={e => setFormPlano(prev => ({ ...prev, colaboradorNome: e.target.value }))} />
                )}
              </div>
              <div>
                <Label>Responsável pelo Acompanhamento *</Label>
                <Input placeholder="Nome do gestor responsável" value={formPlano.responsavel} onChange={e => setFormPlano(prev => ({ ...prev, responsavel: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cargo</Label>
                <Input value={formPlano.cargo} onChange={e => setFormPlano(prev => ({ ...prev, cargo: e.target.value }))} />
              </div>
              <div>
                <Label>Setor</Label>
                <Input value={formPlano.setor} onChange={e => setFormPlano(prev => ({ ...prev, setor: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input type="date" value={formPlano.dataInicio} onChange={e => setFormPlano(prev => ({ ...prev, dataInicio: e.target.value }))} />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input type="date" value={formPlano.dataFim} onChange={e => setFormPlano(prev => ({ ...prev, dataFim: e.target.value }))} />
              </div>
              <div>
                <Label>Frequência</Label>
                <Select value={formPlano.frequenciaAcompanhamento} onValueChange={v => setFormPlano(prev => ({ ...prev, frequenciaAcompanhamento: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Motivo / Justificativa *</Label>
              <Textarea rows={3} placeholder="Motivo para abertura do plano de reversão..." value={formPlano.motivo} onChange={e => setFormPlano(prev => ({ ...prev, motivo: e.target.value }))} />
            </div>
            <div>
              <Label>Objetivos e Metas *</Label>
              <Textarea rows={3} placeholder="Objetivos SMART que o colaborador deve atingir..." value={formPlano.objetivos} onChange={e => setFormPlano(prev => ({ ...prev, objetivos: e.target.value }))} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={2} placeholder="Observações adicionais..." value={formPlano.observacoes} onChange={e => setFormPlano(prev => ({ ...prev, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoPlano(false)}>Cancelar</Button>
            <Button onClick={handleSubmitPlano} disabled={createPlano.isPending}>
              {createPlano.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- DIALOG: DETALHES PLANO ---- */}
      <Dialog open={!!showDetalhesPlano} onOpenChange={() => setShowDetalhesPlano(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detalhePlano && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Plano de Reversão #{detalhePlano.id} — {detalhePlano.colaboradorNome}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={PLANO_STATUS_COLORS[detalhePlano.status]}>
                    {PLANO_STATUS_LABELS[detalhePlano.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detalhePlano.cargo && <div><span className="text-muted-foreground">Cargo:</span> {detalhePlano.cargo}</div>}
                  {detalhePlano.setor && <div><span className="text-muted-foreground">Setor:</span> {detalhePlano.setor}</div>}
                  <div><span className="text-muted-foreground">Período:</span> {detalhePlano.dataInicio} a {detalhePlano.dataFim}</div>
                  <div><span className="text-muted-foreground">Responsável:</span> {detalhePlano.responsavel}</div>
                  <div><span className="text-muted-foreground">Frequência:</span> {detalhePlano.frequenciaAcompanhamento}</div>
                  <div><span className="text-muted-foreground">Criado por:</span> {detalhePlano.criadoPorNome}</div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-1">Motivo</h4>
                  <p className="text-sm text-muted-foreground">{detalhePlano.motivo}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Objetivos e Metas</h4>
                  <p className="text-sm text-muted-foreground">{detalhePlano.objetivos}</p>
                </div>

                {detalhePlano.observacoes && (
                  <div>
                    <h4 className="font-medium mb-1">Observações</h4>
                    <p className="text-sm text-muted-foreground">{detalhePlano.observacoes}</p>
                  </div>
                )}

                {detalhePlano.resultadoFinal && (
                  <div>
                    <h4 className="font-medium mb-1">Resultado Final</h4>
                    <p className="text-sm text-muted-foreground">{detalhePlano.resultadoFinal}</p>
                  </div>
                )}

                <Separator />

                {/* Alterar Status do Plano */}
                <div>
                  <Label>Alterar Status</Label>
                  <Select value={detalhePlano.status} onValueChange={v => updatePlano.mutate({ id: detalhePlano.id, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLANO_STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" size="sm" onClick={() => deletePlano.mutate({ id: detalhePlano.id })} disabled={deletePlano.isPending}>
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
                <Button variant="outline" onClick={() => setShowDetalhesPlano(null)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
