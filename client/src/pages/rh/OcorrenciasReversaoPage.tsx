import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertTriangle, ArrowLeft, Plus, Loader2, Search, Eye, Trash2,
  CheckCircle2, Clock, XCircle, FileText, Users, BarChart3,
  Shield, AlertCircle, RefreshCw, UserX, Calendar, Info, Bell, TrendingUp, PieChart,
  Download, ShieldCheck, ShieldX, DollarSign, Gavel,
  Pen, History, MessageSquare, UserCheck, ClipboardCheck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';

// ---- Labels & Maps ----
const TIPO_LABELS: Record<string, string> = {
  falta_injustificada: 'Falta Injustificada',
  atraso_frequente: 'Atraso Frequente',
  falta_leve: 'Falta Leve',
  falta_media: 'Falta Média',
  falta_grave: 'Falta Grave',
  falta_gravissima: 'Falta Gravíssima',
  erro_trabalho: 'Erro na Execução',
  conduta_inapropriada: 'Conduta Inapropriada',
  conflito_interno: 'Conflito Interno',
};

// Mapeamento automático: tipo → gravidade padrão
const TIPO_GRAVIDADE_MAP: Record<string, string> = {
  falta_injustificada: 'leve',
  atraso_frequente: 'leve',
  falta_leve: 'leve',
  falta_media: 'media',
  falta_grave: 'grave',
  falta_gravissima: 'gravissima',
  erro_trabalho: 'media',
  conduta_inapropriada: 'grave',
  conflito_interno: 'media',
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

const MEDIDAS_OPTIONS = [
  'Advertência Verbal',
  'Advertência Escrita',
  'Suspensão por 1 dia',
  'Suspensão por 3 dias',
  'Suspensão por 5 dias',
  'Suspensão por 7 dias',
  'Suspensão por 15 dias',
  'Suspensão por 30 dias',
  'Encaminhamento para Plano de Reversão',
  'Encaminhamento para Desligamento',
  'Orientação e Acompanhamento',
  'Treinamento/Reciclagem',
  'Mudança de Setor/Função',
  'Redução de Responsabilidades',
  'Outra Medida',
];

const APROVACAO_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente de Aprovação',
  aprovada: 'Aprovada pela Diretoria',
  rejeitada: 'Rejeitada pela Diretoria',
};

const APROVACAO_STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  aprovada: 'bg-green-100 text-green-800',
  rejeitada: 'bg-red-100 text-red-800',
};

// ---- Guia de Classificação Data ----
const TIPOS_OCORRENCIA_GUIA = [
  { tipo: 'Falta Injustificada', desc: 'Ausência sem justificativa legal ou comunicação prévia', gravidade: 'Leve a Média', baseLegal: 'CLT Art. 473, 482(i)' },
  { tipo: 'Atraso Frequente', desc: 'Padrão recorrente de atrasos na jornada de trabalho', gravidade: 'Leve a Média', baseLegal: 'CLT Art. 58, 482(e)' },
  { tipo: 'Falta Leve', desc: 'Infração de baixo impacto, sem dolo ou reincidência', gravidade: 'Leve', baseLegal: 'Regulamento interno' },
  { tipo: 'Falta Média', desc: 'Infração com impacto moderado, possível reincidência', gravidade: 'Média', baseLegal: 'CLT Art. 482' },
  { tipo: 'Falta Grave', desc: 'Infração grave conforme CLT Art. 482 (justa causa)', gravidade: 'Grave a Gravíssima', baseLegal: 'CLT Art. 482(a-l)' },
  { tipo: 'Falta Gravíssima', desc: 'Infração gravíssima: assédio, violência, fraude, roubo, embriaguez habitual', gravidade: 'Gravíssima', baseLegal: 'CLT Art. 482(a,b,f,j,k)' },
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

// ---- Helper: check if form has unsaved data ----
function hasUnsavedOcorrencia(form: any) {
  return form.colaboradorId > 0 || form.tipo || form.gravidade || form.descricao || form.evidencias || form.testemunhas || form.medidasTomadas;
}
function hasUnsavedPlano(form: any) {
  return form.colaboradorId > 0 || form.motivo || form.objetivos || form.dataFim || form.observacoes;
}

export default function OcorrenciasReversaoPage() {
  const [tab, setTab] = useState('ocorrencias');
  const [showNovaOcorrencia, setShowNovaOcorrencia] = useState(false);
  const [showNovoPlano, setShowNovoPlano] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState<number | null>(null);
  const [showDetalhesPlano, setShowDetalhesPlano] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todas');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [showUnsavedAlertOcorrencia, setShowUnsavedAlertOcorrencia] = useState(false);
  const [showUnsavedAlertPlano, setShowUnsavedAlertPlano] = useState(false);

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
    coResponsavel: '',
    frequenciaAcompanhamento: 'quinzenal' as string,
    observacoes: '',
  });

  // Queries
  const statsQuery = trpc.ocorrencias.stats.useQuery();
  const ocorrenciasQuery = trpc.ocorrencias.list.useQuery();
  const planosQuery = trpc.planosReversao.list.useQuery();
  const colaboradoresQuery = trpc.colaboradores?.list?.useQuery?.() ?? { data: [] };
  const gestorRHQuery = trpc.gestorLookup.getGestorRH.useQuery();

  const utils = trpc.useUtils();

  // Mutations
  const createOcorrencia = trpc.ocorrencias.create.useMutation({
    onSuccess: (data) => {
      const needsApproval = data.recomendacao === 'desligamento' || data.gravidade === 'grave' || data.gravidade === 'gravissima';
      let msg = `Ocorrência registrada. Classificação: ${data.classificacao === 'reversivel' ? 'Reversível' : 'Irreversível'}. Recomendação: ${RECOMENDACAO_LABELS[data.recomendacao]}`;
      if (needsApproval) msg += ' — Requer aprovação da diretoria.';
      toast.success(msg);
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

  const aprovarMutation = trpc.aprovacaoOcorrencia.aprovar.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.aprovado ? 'Ocorrência aprovada pela diretoria' : 'Ocorrência rejeitada pela diretoria');
      utils.ocorrencias.list.invalidate();
    },
    onError: () => toast.error('Erro ao processar aprovação'),
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
      dataFim: '', responsavel: '', coResponsavel: '', frequenciaAcompanhamento: 'quinzenal', observacoes: '',
    });
  }

  // Unsaved changes handlers for ocorrência dialog
  function handleCloseOcorrenciaDialog(open: boolean) {
    if (!open && hasUnsavedOcorrencia(formOcorrencia)) {
      setShowUnsavedAlertOcorrencia(true);
    } else if (!open) {
      setShowNovaOcorrencia(false);
      resetFormOcorrencia();
    }
  }

  function handleCloseOcorrenciaConfirm() {
    setShowUnsavedAlertOcorrencia(false);
    setShowNovaOcorrencia(false);
    resetFormOcorrencia();
  }

  // Unsaved changes handlers for plano dialog
  function handleClosePlanoDialog(open: boolean) {
    if (!open && hasUnsavedPlano(formPlano)) {
      setShowUnsavedAlertPlano(true);
    } else if (!open) {
      setShowNovoPlano(false);
      resetFormPlano();
    }
  }

  function handleClosePlanoConfirm() {
    setShowUnsavedAlertPlano(false);
    setShowNovoPlano(false);
    resetFormPlano();
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
      // Auto-fill cargo, setor, and try to find gestor imediato
      const gestorRH = gestorRHQuery.data;
      const coResponsavelNome = gestorRH ? `${gestorRH.nome} (Gestor RH)` : '';
      setFormPlano(prev => ({
        ...prev,
        colaboradorId: colab.id,
        colaboradorNome: colab.nomeCompleto || colab.nome || '',
        cargo: colab.cargo || '',
        setor: colab.setor || '',
        coResponsavel: coResponsavelNome,
      }));
      // Try to find gestor imediato do setor
      if (colab.setor) {
        // We'll use a separate effect to fetch the gestor
        fetchGestorDoSetor(colab.setor);
      }
    }
  }

  function fetchGestorDoSetor(setorNome: string) {
    // Use the gestorLookup query - we'll fetch it imperatively
    // For simplicity, we use the utils to fetch
    utils.gestorLookup.getGestorDoSetor.fetch({ setorNome }).then((gestor) => {
      if (gestor) {
        setFormPlano(prev => ({
          ...prev,
          responsavel: `${gestor.nome} (${gestor.cargo || 'Gestor do Setor'})`,
        }));
      }
    }).catch(() => {});
  }

  // Auto-select gravidade when tipo changes
  function handleTipoChange(tipo: string) {
    const gravidade = TIPO_GRAVIDADE_MAP[tipo] || '';
    setFormOcorrencia(prev => ({
      ...prev,
      tipo,
      gravidade,
    }));
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

      {/* Notification Alerts */}
      <NotificationAlerts />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ocorrencias"><FileText className="w-4 h-4 mr-1" /> Ocorrências</TabsTrigger>
          <TabsTrigger value="planos"><RefreshCw className="w-4 h-4 mr-1" /> Planos de Reversão</TabsTrigger>
          <TabsTrigger value="aprovacoes"><Gavel className="w-4 h-4 mr-1" /> Aprovações</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Dashboard RH</TabsTrigger>
          <TabsTrigger value="relatorio"><Calendar className="w-4 h-4 mr-1" /> Relatório Mensal</TabsTrigger>
          <TabsTrigger value="guia"><Info className="w-4 h-4 mr-1" /> Guia de Classificação</TabsTrigger>
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
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
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
                            {o.aprovacaoNecessaria === 1 && o.aprovacaoStatus && (
                              <Badge variant="outline" className={`text-xs ${APROVACAO_STATUS_COLORS[o.aprovacaoStatus] || ''}`}>
                                {o.aprovacaoStatus === 'pendente' ? '⏳ Aguardando Aprovação' : o.aprovacaoStatus === 'aprovada' ? '✓ Aprovada' : '✗ Rejeitada'}
                              </Badge>
                            )}
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
                          {p.coResponsavel && <><span>•</span><span>Co-resp.: {p.coResponsavel}</span></>}
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

        {/* ---- TAB: APROVAÇÕES ---- */}
        <TabsContent value="aprovacoes">
          <AprovacaoTab ocorrencias={ocorrenciasQuery.data || []} aprovarMutation={aprovarMutation} />
        </TabsContent>

        {/* ---- TAB: DASHBOARD RH ---- */}
        <TabsContent value="dashboard">
          <DashboardRHTab />
        </TabsContent>

        {/* ---- TAB: RELATÓRIO MENSAL ---- */}
        <TabsContent value="relatorio">
          <RelatorioMensalTab />
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
                        <tr key={i} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium">{t.tipo}</td>
                          <td className="py-2 px-3 text-muted-foreground">{t.desc}</td>
                          <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{t.gravidade}</Badge></td>
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
                <p className="text-sm text-muted-foreground mb-3">
                  Esta matriz é utilizada como balizadora e indicadora de medidas a serem tomadas. A decisão final de punibilidade, caso a caso, cabe aos diretores e gestores.
                </p>
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
                        <tr key={i} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium">{m.cenario}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className={`text-xs ${m.classificacao === 'Reversível' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{m.classificacao}</Badge>
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
      <Dialog open={showNovaOcorrencia} onOpenChange={handleCloseOcorrenciaDialog}>
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
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o colaborador..." /></SelectTrigger>
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
                <Input value={formOcorrencia.cargo} readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label>Setor</Label>
                <Input value={formOcorrencia.setor} readOnly className="bg-muted/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Ocorrência *</Label>
                <Select value={formOcorrencia.tipo} onValueChange={handleTipoChange}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
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
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GRAVIDADE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formOcorrencia.tipo && formOcorrencia.gravidade && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Gravidade sugerida automaticamente. Pode ser ajustada manualmente.
                  </p>
                )}
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
              <Select value={formOcorrencia.medidasTomadas} onValueChange={v => setFormOcorrencia(prev => ({ ...prev, medidasTomadas: v }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione a medida..." /></SelectTrigger>
                <SelectContent>
                  {MEDIDAS_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                A decisão final da punibilidade, caso a caso, cabe aos diretores e gestores.
              </p>
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
                  {(formOcorrencia.gravidade === 'grave' || formOcorrencia.gravidade === 'gravissima') && (
                    <div className="flex items-center gap-2 text-sm mt-2 text-amber-700">
                      <Gavel className="w-4 h-4" />
                      <span>Esta ocorrência exigirá aprovação da diretoria antes de ser efetivada.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseOcorrenciaDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitOcorrencia} disabled={createOcorrencia.isPending}>
              {createOcorrencia.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Registrar Ocorrência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- ALERT: SAIR SEM SALVAR OCORRÊNCIA ---- */}
      <AlertDialog open={showUnsavedAlertOcorrencia} onOpenChange={setShowUnsavedAlertOcorrencia}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem dados não salvos no formulário de ocorrência. Se sair agora, todas as informações preenchidas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseOcorrenciaConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- DIALOG: DETALHES OCORRÊNCIA ---- */}
      <Dialog open={!!showDetalhes} onOpenChange={() => setShowDetalhes(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detalheOcorrencia && (
            <DetalhesOcorrenciaContent
              ocorrencia={detalheOcorrencia}
              updateOcorrencia={updateOcorrencia}
              deleteOcorrencia={deleteOcorrencia}
              aprovarMutation={aprovarMutation}
              onClose={() => setShowDetalhes(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ---- DIALOG: NOVO PLANO ---- */}
      <Dialog open={showNovoPlano} onOpenChange={handleClosePlanoDialog}>
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
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o colaborador..." /></SelectTrigger>
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
                <Input placeholder="Gestor imediato (preenchido automaticamente)" value={formPlano.responsavel} onChange={e => setFormPlano(prev => ({ ...prev, responsavel: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1">Preenchido automaticamente com o gestor imediato do setor.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cargo</Label>
                <Input value={formPlano.cargo} readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label>Setor</Label>
                <Input value={formPlano.setor} readOnly className="bg-muted/50" />
              </div>
            </div>
            <div>
              <Label>Co-Responsável (Gestor RH)</Label>
              <Input value={formPlano.coResponsavel} onChange={e => setFormPlano(prev => ({ ...prev, coResponsavel: e.target.value }))} className="bg-muted/50" readOnly />
              <p className="text-xs text-muted-foreground mt-1">O Gestor de RH é co-responsável em todos os planos de reversão.</p>
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
            <Button variant="outline" onClick={() => handleClosePlanoDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitPlano} disabled={createPlano.isPending}>
              {createPlano.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- ALERT: SAIR SEM SALVAR PLANO ---- */}
      <AlertDialog open={showUnsavedAlertPlano} onOpenChange={setShowUnsavedAlertPlano}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem dados não salvos no formulário do plano de reversão. Se sair agora, todas as informações preenchidas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleClosePlanoConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  {detalhePlano.coResponsavel && <div><span className="text-muted-foreground">Co-Responsável:</span> {detalhePlano.coResponsavel}</div>}
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


// ===== DETALHES OCORRÊNCIA CONTENT (with approval + cost estimation) =====
function DetalhesOcorrenciaContent({ ocorrencia, updateOcorrencia, deleteOcorrencia, aprovarMutation, onClose }: any) {
  const needsApproval = ocorrencia.aprovacaoNecessaria === 1;
  const custoQuery = trpc.aprovacaoOcorrencia.estimarCustoRescisao.useQuery(
    { colaboradorId: ocorrencia.colaboradorId },
    { enabled: ocorrencia.recomendacao === 'desligamento' }
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          Ocorrência #{ocorrencia.id} — {ocorrencia.colaboradorNome}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={GRAVIDADE_COLORS[ocorrencia.gravidade]}>
            {GRAVIDADE_LABELS[ocorrencia.gravidade]}
          </Badge>
          <Badge variant="outline" className={CLASSIFICACAO_COLORS[ocorrencia.classificacao]}>
            {ocorrencia.classificacao === 'reversivel' ? 'Reversível' : 'Irreversível'}
          </Badge>
          <Badge className={RECOMENDACAO_COLORS[ocorrencia.recomendacao]}>
            {RECOMENDACAO_LABELS[ocorrencia.recomendacao]}
          </Badge>
          <Badge variant="outline" className={STATUS_COLORS[ocorrencia.status]}>
            {STATUS_LABELS[ocorrencia.status]}
          </Badge>
        </div>

        {/* Approval Status */}
        {needsApproval && (
          <Card className={`border-l-4 ${
            ocorrencia.aprovacaoStatus === 'aprovada' ? 'border-l-green-500 bg-green-50/50' :
            ocorrencia.aprovacaoStatus === 'rejeitada' ? 'border-l-red-500 bg-red-50/50' :
            'border-l-amber-500 bg-amber-50/50'
          }`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ocorrencia.aprovacaoStatus === 'aprovada' ? <ShieldCheck className="w-5 h-5 text-green-600" /> :
                   ocorrencia.aprovacaoStatus === 'rejeitada' ? <ShieldX className="w-5 h-5 text-red-600" /> :
                   <Gavel className="w-5 h-5 text-amber-600" />}
                  <div>
                    <p className="font-semibold text-sm">
                      {APROVACAO_STATUS_LABELS[ocorrencia.aprovacaoStatus] || 'Pendente'}
                    </p>
                    {ocorrencia.aprovadoPorNome && (
                      <p className="text-xs text-muted-foreground">
                        Por: {ocorrencia.aprovadoPorNome} em {ocorrencia.aprovadoEm ? new Date(ocorrencia.aprovadoEm).toLocaleDateString('pt-BR') : ''}
                      </p>
                    )}
                  </div>
                </div>
                {ocorrencia.aprovacaoStatus === 'pendente' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => aprovarMutation.mutate({ id: ocorrencia.id, aprovado: true })}
                      disabled={aprovarMutation.isPending}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50"
                      onClick={() => aprovarMutation.mutate({ id: ocorrencia.id, aprovado: false })}
                      disabled={aprovarMutation.isPending}>
                      <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Tipo:</span> {TIPO_LABELS[ocorrencia.tipo]}</div>
          <div><span className="text-muted-foreground">Data:</span> {ocorrencia.dataOcorrencia}</div>
          {ocorrencia.cargo && <div><span className="text-muted-foreground">Cargo:</span> {ocorrencia.cargo}</div>}
          {ocorrencia.setor && <div><span className="text-muted-foreground">Setor:</span> {ocorrencia.setor}</div>}
          <div><span className="text-muted-foreground">Registrado por:</span> {ocorrencia.registradoPorNome}</div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-1">Descrição</h4>
          <p className="text-sm text-muted-foreground">{ocorrencia.descricao}</p>
        </div>

        {ocorrencia.evidencias && (
          <div>
            <h4 className="font-medium mb-1">Evidências</h4>
            <p className="text-sm text-muted-foreground">{ocorrencia.evidencias}</p>
          </div>
        )}

        {ocorrencia.testemunhas && (
          <div>
            <h4 className="font-medium mb-1">Testemunhas</h4>
            <p className="text-sm text-muted-foreground">{ocorrencia.testemunhas}</p>
          </div>
        )}

        {ocorrencia.medidasTomadas && (
          <div>
            <h4 className="font-medium mb-1">Medidas Tomadas</h4>
            <p className="text-sm text-muted-foreground">{ocorrencia.medidasTomadas}</p>
          </div>
        )}

        {/* Custo de Rescisão Estimado (quando recomendação é desligamento) */}
        {ocorrencia.recomendacao === 'desligamento' && custoQuery.data && (
          <>
            <Separator />
            <Card className="border-l-4 border-l-red-400 bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  Estimativa de Custo de Rescisão
                </CardTitle>
                <CardDescription className="text-xs">Valores estimados para rescisão sem justa causa — vinculados à projeção financeira</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Salário Base:</div>
                  <div className="font-medium text-right">R$ {custoQuery.data.salarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-muted-foreground">Tempo de Serviço:</div>
                  <div className="font-medium text-right">{custoQuery.data.mesesTrabalhados} meses</div>
                  <div className="text-muted-foreground">Saldo de Salário:</div>
                  <div className="text-right">R$ {custoQuery.data.saldoSalario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-muted-foreground">Aviso Prévio:</div>
                  <div className="text-right">R$ {custoQuery.data.avisoPrevio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-muted-foreground">13º Proporcional:</div>
                  <div className="text-right">R$ {custoQuery.data.decimoTerceiroProporcional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-muted-foreground">Férias Proporcionais:</div>
                  <div className="text-right">R$ {custoQuery.data.feriasProporcional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-muted-foreground">1/3 Constitucional:</div>
                  <div className="text-right">R$ {custoQuery.data.tercoConstitucional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="text-muted-foreground">Multa FGTS (40%):</div>
                  <div className="text-right">R$ {custoQuery.data.multaFgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <Separator className="col-span-2 my-1" />
                  <div className="font-bold text-red-700">TOTAL ESTIMADO:</div>
                  <div className="font-bold text-red-700 text-right">R$ {custoQuery.data.totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Separator />

        {/* Alterar Status */}
        <div>
          <Label>Alterar Status</Label>
          <Select value={ocorrencia.status} onValueChange={v => updateOcorrencia.mutate({ id: ocorrencia.id, status: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Separator />

        {/* ===== TIMELINE VISUAL ===== */}
        <TimelineOcorrencia ocorrenciaId={ocorrencia.id} />

        <Separator />

        {/* ===== ASSINATURAS DIGITAIS ===== */}
        <AssinaturasOcorrencia ocorrenciaId={ocorrencia.id} />

      </div>
      <DialogFooter>
        <Button variant="destructive" size="sm" onClick={() => deleteOcorrencia.mutate({ id: ocorrencia.id })} disabled={deleteOcorrencia.isPending}>
          <Trash2 className="w-4 h-4 mr-1" /> Excluir
        </Button>
        <Button variant="outline" onClick={onClose}>Fechar</Button>
      </DialogFooter>
    </>
  );
}

// ===== TIMELINE VISUAL COMPONENT =====
const TIMELINE_ICON_MAP: Record<string, any> = {
  registro: FileText,
  alteracao_status: RefreshCw,
  aprovacao_solicitada: Gavel,
  aprovacao_aprovada: ShieldCheck,
  aprovacao_rejeitada: ShieldX,
  plano_criado: ClipboardCheck,
  feedback_adicionado: MessageSquare,
  assinatura_colaborador: Pen,
  assinatura_gestor: UserCheck,
  medida_aplicada: Shield,
  observacao: Info,
};

const TIMELINE_COLOR_MAP: Record<string, string> = {
  registro: 'bg-blue-500',
  alteracao_status: 'bg-purple-500',
  aprovacao_solicitada: 'bg-amber-500',
  aprovacao_aprovada: 'bg-green-500',
  aprovacao_rejeitada: 'bg-red-500',
  plano_criado: 'bg-teal-500',
  feedback_adicionado: 'bg-indigo-500',
  assinatura_colaborador: 'bg-cyan-500',
  assinatura_gestor: 'bg-emerald-500',
  medida_aplicada: 'bg-orange-500',
  observacao: 'bg-gray-500',
};

function TimelineOcorrencia({ ocorrenciaId }: { ocorrenciaId: number }) {
  const timelineQuery = trpc.ocorrenciaTimeline.getByOcorrencia.useQuery({ ocorrenciaId });
  const addEvent = trpc.ocorrenciaTimeline.addEvent.useMutation({
    onSuccess: () => { timelineQuery.refetch(); toast.success('Observação adicionada à timeline'); },
  });
  const [showAddObs, setShowAddObs] = useState(false);
  const [obsText, setObsText] = useState('');

  const timeline = timelineQuery.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium flex items-center gap-2">
          <History className="w-4 h-4" /> Timeline de Ações
        </h4>
        <Button variant="outline" size="sm" onClick={() => setShowAddObs(!showAddObs)}>
          <Plus className="w-3 h-3 mr-1" /> Observação
        </Button>
      </div>

      {showAddObs && (
        <div className="mb-4 p-3 border rounded-lg bg-muted/30 space-y-2">
          <Textarea placeholder="Adicione uma observação à timeline..." value={obsText} onChange={e => setObsText(e.target.value)} rows={2} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setShowAddObs(false); setObsText(''); }}>Cancelar</Button>
            <Button size="sm" disabled={!obsText.trim() || addEvent.isPending}
              onClick={() => {
                addEvent.mutate({ ocorrenciaId, tipo: 'observacao', titulo: 'Observação adicionada', descricao: obsText });
                setObsText(''); setShowAddObs(false);
              }}>
              {addEvent.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Salvar
            </Button>
          </div>
        </div>
      )}

      {timelineQuery.isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento registrado na timeline</p>
      ) : (
        <div className="relative ml-4">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
          <div className="space-y-4">
            {timeline.map((event: any, idx: number) => {
              const IconComp = TIMELINE_ICON_MAP[event.tipo] || Info;
              const colorClass = TIMELINE_COLOR_MAP[event.tipo] || 'bg-gray-500';
              return (
                <div key={event.id || idx} className="relative flex gap-3 pl-2">
                  <div className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full ${colorClass} flex items-center justify-center`}>
                    <IconComp className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{event.titulo}</span>
                      <span className="text-xs text-muted-foreground">
                        {event.createdAt ? new Date(Number(event.createdAt)).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {event.descricao && <p className="text-xs text-muted-foreground mt-0.5">{event.descricao}</p>}
                    <p className="text-xs text-muted-foreground/70">Por: {event.executadoPorNome}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ASSINATURAS DIGITAIS COMPONENT =====
const ASSINATURA_TIPO_LABELS: Record<string, string> = {
  ciencia_colaborador: 'Ciência do Colaborador',
  ciencia_gestor: 'Ciência do Gestor',
  ciencia_rh: 'Ciência do RH',
  concordancia_plano: 'Concordância com Plano',
};

function AssinaturasOcorrencia({ ocorrenciaId }: { ocorrenciaId: number }) {
  const assinaturasQuery = trpc.ocorrenciaAssinaturas.getByOcorrencia.useQuery({ ocorrenciaId });
  const registrar = trpc.ocorrenciaAssinaturas.registrar.useMutation({
    onSuccess: () => { assinaturasQuery.refetch(); toast.success('Assinatura registrada com sucesso'); },
  });
  const [showForm, setShowForm] = useState(false);
  const [tipoAss, setTipoAss] = useState<string>('');
  const [nomeAss, setNomeAss] = useState('');
  const [cargoAss, setCargoAss] = useState('');
  const [obsAss, setObsAss] = useState('');

  const assinaturas = assinaturasQuery.data || [];

  const handleRegistrar = () => {
    if (!tipoAss || !nomeAss.trim()) { toast.error('Preencha tipo e nome'); return; }
    registrar.mutate({
      ocorrenciaId,
      tipo: tipoAss as any,
      assinanteName: nomeAss,
      assinanteCargo: cargoAss || undefined,
      observacao: obsAss || undefined,
    });
    setShowForm(false); setTipoAss(''); setNomeAss(''); setCargoAss(''); setObsAss('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium flex items-center gap-2">
          <Pen className="w-4 h-4" /> Assinaturas Digitais
        </h4>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3 h-3 mr-1" /> Registrar Assinatura
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 border rounded-lg bg-muted/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo de Assinatura *</Label>
              <Select value={tipoAss} onValueChange={setTipoAss}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSINATURA_TIPO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nome do Assinante *</Label>
              <Input value={nomeAss} onChange={e => setNomeAss(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label className="text-xs">Cargo</Label>
              <Input value={cargoAss} onChange={e => setCargoAss(e.target.value)} placeholder="Cargo" />
            </div>
            <div>
              <Label className="text-xs">Observação</Label>
              <Input value={obsAss} onChange={e => setObsAss(e.target.value)} placeholder="Observação opcional" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" disabled={!tipoAss || !nomeAss.trim() || registrar.isPending} onClick={handleRegistrar}>
              {registrar.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Pen className="w-3 h-3 mr-1" />}
              Registrar Ciência
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Ao registrar, a data/hora e o IP serão gravados automaticamente como comprovante digital.</p>
        </div>
      )}

      {assinaturasQuery.isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : assinaturas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma assinatura registrada</p>
      ) : (
        <div className="space-y-2">
          {assinaturas.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 p-2 border rounded-lg bg-green-50/30">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.assinanteName}</span>
                  <Badge variant="outline" className="text-xs">{ASSINATURA_TIPO_LABELS[a.tipo] || a.tipo}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {a.assinanteCargo && <span>{a.assinanteCargo}</span>}
                  <span>•</span>
                  <span>{a.assinadoEm ? new Date(Number(a.assinadoEm)).toLocaleString('pt-BR') : ''}</span>
                </div>
                {a.observacao && <p className="text-xs text-muted-foreground mt-0.5">{a.observacao}</p>}
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ===== APROVAÇÃO TAB =====
function AprovacaoTab({ ocorrencias, aprovarMutation }: { ocorrencias: any[]; aprovarMutation: any }) {
  const pendentes = ocorrencias.filter((o: any) => o.aprovacaoNecessaria === 1 && o.aprovacaoStatus === 'pendente');
  const historico = ocorrencias.filter((o: any) => o.aprovacaoNecessaria === 1 && o.aprovacaoStatus !== 'pendente');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-600" />
            Aprovações Pendentes
          </CardTitle>
          <CardDescription>Ocorrências graves ou com recomendação de desligamento que requerem aprovação da diretoria</CardDescription>
        </CardHeader>
        <CardContent>
          {pendentes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma aprovação pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendentes.map((o: any) => (
                <Card key={o.id} className="border-l-4 border-l-amber-400">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{o.colaboradorNome}</span>
                          <Badge variant="outline" className={`text-xs ${GRAVIDADE_COLORS[o.gravidade]}`}>
                            {GRAVIDADE_LABELS[o.gravidade]}
                          </Badge>
                          <Badge className={`text-xs ${RECOMENDACAO_COLORS[o.recomendacao]}`}>
                            {RECOMENDACAO_LABELS[o.recomendacao]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{TIPO_LABELS[o.tipo]} — {o.dataOcorrencia}</p>
                        <p className="text-sm mt-1">{o.descricao?.substring(0, 150)}{o.descricao?.length > 150 ? '...' : ''}</p>
                        {o.cargo && <p className="text-xs text-muted-foreground mt-1">{o.cargo} — {o.setor}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0 ml-4">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => aprovarMutation.mutate({ id: o.id, aprovado: true })}
                          disabled={aprovarMutation.isPending}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="destructive"
                          onClick={() => aprovarMutation.mutate({ id: o.id, aprovado: false })}
                          disabled={aprovarMutation.isPending}>
                          <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Histórico de Aprovações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historico.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div className="flex items-center gap-2">
                    {o.aprovacaoStatus === 'aprovada' ? <ShieldCheck className="w-4 h-4 text-green-600" /> : <ShieldX className="w-4 h-4 text-red-600" />}
                    <span className="font-medium">{o.colaboradorNome}</span>
                    <span className="text-muted-foreground">{TIPO_LABELS[o.tipo]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${APROVACAO_STATUS_COLORS[o.aprovacaoStatus]}`}>
                      {o.aprovacaoStatus === 'aprovada' ? 'Aprovada' : 'Rejeitada'}
                    </Badge>
                    {o.aprovadoPorNome && <span className="text-xs text-muted-foreground">por {o.aprovadoPorNome}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// ===== NOTIFICATION ALERTS =====
function NotificationAlerts() {
  const planosVencendoQ = trpc.ocorrenciasDashboard.planosVencendo.useQuery({ diasAntecedencia: 14 });
  const reincidenciasQ = trpc.ocorrenciasDashboard.reincidenciasAlerta.useQuery({ limite: 3 });
  const gerarNotificacoes = trpc.ocorrenciasDashboard.gerarNotificacoes.useMutation({
    onSuccess: (data) => {
      toast.success(`Notificações geradas: ${data.planosVencendo} planos + ${data.reincidencias} reincidências`);
    },
    onError: () => toast.error('Erro ao gerar notificações'),
  });

  const planosVencendo = planosVencendoQ.data || [];
  const reincidentes = reincidenciasQ.data || [];

  if (planosVencendo.length === 0 && reincidentes.length === 0) return null;

  return (
    <div className="space-y-3">
      {planosVencendo.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-amber-800">Planos de Reversão com Prazo Próximo</p>
                  <div className="space-y-1 mt-2">
                    {planosVencendo.map((p: any) => (
                      <div key={p.id} className="text-xs text-amber-700">
                        <span className="font-medium">{p.colaboradorNome}</span>
                        {' — '}
                        {(p as any).vencido ? (
                          <Badge className="bg-red-100 text-red-700 text-[10px]">VENCIDO em {p.dataFim}</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px]">{p.diasRestantes} dia(s) restante(s) — vence em {p.dataFim}</Badge>
                        )}
                        <span className="text-muted-foreground ml-1">({p.cargo} - {p.setor})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => gerarNotificacoes.mutate()} disabled={gerarNotificacoes.isPending}>
                <Bell className="w-3 h-3 mr-1" /> Notificar Gestores
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reincidentes.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-red-800">Colaboradores com Reincidências (3+ ocorrências)</p>
                <div className="space-y-1 mt-2">
                  {reincidentes.map((r: any) => (
                    <div key={r.colaboradorId} className="text-xs text-red-700">
                      <span className="font-medium">{r.nome}</span>
                      {' — '}
                      <Badge className="bg-red-100 text-red-700 text-[10px]">{r.count} ocorrências</Badge>
                      <span className="text-muted-foreground ml-1">({r.cargo} - {r.setor})</span>
                      <span className="text-muted-foreground ml-1">Última: {r.ultimaData}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// ===== DASHBOARD RH TAB =====
const CHART_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function DashboardRHTab() {
  const dashboardQ = trpc.ocorrenciasDashboard.get.useQuery();
  const data = dashboardQ.data;

  if (dashboardQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando dashboard...</span>
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground py-4">Erro ao carregar dados do dashboard.</p>;

  const porTipoData = data.porTipo.map((t: any) => ({
    name: TIPO_LABELS[t.tipo] || t.tipo,
    value: t.count,
  }));

  const porSetorData = data.porSetor.map((s: any) => ({
    name: s.setor,
    value: s.count,
  }));

  const porMesData = data.porMes.map((m: any) => ({
    name: m.mes,
    value: m.count,
  }));

  const planosStats = data.planosReversaoStats;
  const planosChartData = [
    { name: 'Ativos', value: planosStats.ativos, color: '#3b82f6' },
    { name: 'Sucesso', value: planosStats.sucesso, color: '#10b981' },
    { name: 'Fracasso', value: planosStats.fracasso, color: '#ef4444' },
    { name: 'Cancelados', value: planosStats.cancelados, color: '#6b7280' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={async () => {
          if (!data) { toast.error('Sem dados para exportar'); return; }
          try {
            toast.info('Gerando PDF do relatório...');
            const { generateDashboardPdf } = await import('@/lib/ocorrenciasPdf');
            await generateDashboardPdf(data);
            toast.success('PDF do Dashboard gerado com sucesso!');
          } catch (e) { toast.error('Erro ao gerar PDF'); console.error(e); }
        }}>
          <Download className="w-4 h-4 mr-1" /> Exportar PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Total Planos</p>
            <p className="text-3xl font-bold">{planosStats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Planos Ativos</p>
            <p className="text-3xl font-bold text-blue-600">{planosStats.ativos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Taxa de Sucesso</p>
            <p className="text-3xl font-bold text-green-600">{planosStats.taxaSucesso}%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Reincidentes (3+)</p>
            <p className="text-3xl font-bold text-red-600">{data.topReincidentes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocorrências por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><PieChart className="w-4 h-4" /> Ocorrências por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {porTipoData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados para exibir</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie data={porTipoData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={10}>
                    {porTipoData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ocorrências por Setor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Ocorrências por Setor</CardTitle>
          </CardHeader>
          <CardContent>
            {porSetorData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados para exibir</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={porSetorData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={75} fontSize={11} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Ocorrências" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Temporal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Evolução Temporal de Ocorrências</CardTitle>
          </CardHeader>
          <CardContent>
            {porMesData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados para exibir</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={porMesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Ocorrências" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Planos de Reversão - Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Planos de Reversão por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {planosChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem planos de reversão registrados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie data={planosChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={true} fontSize={11}>
                    {planosChartData.map((d: any, i: number) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Reincidentes */}
      {data.topReincidentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /> Colaboradores com Maior Número de Ocorrências</CardTitle>
            <CardDescription>Colaboradores com 2 ou mais ocorrências registradas — atenção para reincidências</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Colaborador</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Cargo</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Setor</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Ocorrências</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Nível de Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topReincidentes.map((r: any) => (
                    <tr key={r.colaboradorId} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">{r.nome}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.cargo || '—'}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.setor || '—'}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge className={r.count >= 5 ? 'bg-red-100 text-red-700' : r.count >= 3 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}>
                          {r.count}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge className={r.count >= 5 ? 'bg-red-100 text-red-700' : r.count >= 3 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}>
                          {r.count >= 5 ? 'Crítico' : r.count >= 3 ? 'Alto' : 'Moderado'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// ===== RELATÓRIO MENSAL CONSOLIDADO TAB =====
function RelatorioMensalTab() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);

  const relatorioQuery = trpc.relatorioMensal.get.useQuery({ mes, ano });
  const relatorio = relatorioQuery.data;

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const handleExportPdf = async () => {
    if (!relatorio) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      let y = 15;

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Consolidado Mensal — Ocorrências e Planos de Reversão', pageW / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${MESES[mes - 1]} / ${ano}`, pageW / 2, y, { align: 'center' });
      y += 4;
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW / 2, y, { align: 'center' });
      y += 10;

      // Resumo KPIs
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Executivo', 14, y);
      y += 7;

      autoTable(doc, {
        startY: y,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total de Ocorrências no Mês', String(relatorio.resumo.totalOcorrencias)],
          ['Planos de Reversão Criados', String(relatorio.resumo.totalPlanosCriados)],
          ['Planos de Reversão Ativos', String(relatorio.resumo.totalPlanosAtivos)],
          ['Feedbacks Registrados', String(relatorio.resumo.totalFeedbacks)],
          ['Colaboradores Reincidentes (3+)', String(relatorio.resumo.totalReincidentes)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      // Por Tipo
      if (Object.keys(relatorio.porTipo).length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Ocorrências por Tipo', 14, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Tipo', 'Quantidade']],
          body: Object.entries(relatorio.porTipo).map(([k, v]) => [TIPO_LABELS[k] || k, String(v)]),
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 9 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Por Gravidade
      if (Object.keys(relatorio.porGravidade).length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Ocorrências por Gravidade', 14, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Gravidade', 'Quantidade']],
          body: Object.entries(relatorio.porGravidade).map(([k, v]) => [GRAVIDADE_LABELS[k] || k, String(v)]),
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 9 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Por Setor
      if (Object.keys(relatorio.porSetor).length > 0) {
        if (y > 230) { doc.addPage(); y = 15; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Ocorrências por Setor', 14, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Setor', 'Quantidade']],
          body: Object.entries(relatorio.porSetor).map(([k, v]) => [k, String(v)]),
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 9 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Classificação e Recomendação
      if (Object.keys(relatorio.porClassificacao).length > 0) {
        if (y > 230) { doc.addPage(); y = 15; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Classificação e Recomendação', 14, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Classificação', 'Qtd', 'Recomendação', 'Qtd']],
          body: (() => {
            const classEntries = Object.entries(relatorio.porClassificacao);
            const recEntries = Object.entries(relatorio.porRecomendacao);
            const maxLen = Math.max(classEntries.length, recEntries.length);
            const rows: string[][] = [];
            for (let i = 0; i < maxLen; i++) {
              rows.push([
                classEntries[i] ? (classEntries[i][0] === 'reversivel' ? 'Reversível' : 'Irreversível') : '',
                classEntries[i] ? String(classEntries[i][1]) : '',
                recEntries[i] ? (RECOMENDACAO_LABELS[recEntries[i][0]] || recEntries[i][0]) : '',
                recEntries[i] ? String(recEntries[i][1]) : '',
              ]);
            }
            return rows;
          })(),
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 9 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Evolução de Feedbacks
      if (relatorio.evolucaoFeedbacks) {
        if (y > 230) { doc.addPage(); y = 15; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Evolução dos Feedbacks de Planos', 14, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Evolução', 'Quantidade']],
          body: [
            ['Melhorou', String(relatorio.evolucaoFeedbacks.melhorou)],
            ['Estável', String(relatorio.evolucaoFeedbacks.estavel)],
            ['Piorou', String(relatorio.evolucaoFeedbacks.piorou)],
          ],
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 9 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Reincidentes
      if (relatorio.reincidentes && relatorio.reincidentes.length > 0) {
        if (y > 200) { doc.addPage(); y = 15; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Colaboradores Reincidentes (3+ ocorrências)', 14, y);
        y += 5;
        autoTable(doc, {
          startY: y,
          head: [['Colaborador', 'Setor', 'Total Ocorrências']],
          body: relatorio.reincidentes.map((r: any) => [r.nome, r.setor, String(r.count)]),
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 9 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Evox Fiscal — Relatório Consolidado Mensal — Página ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }

      doc.save(`relatorio-mensal-ocorrencias-${MESES[mes - 1].toLowerCase()}-${ano}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Relatório Consolidado Mensal
        </CardTitle>
        <CardDescription>Resumo mensal de ocorrências, planos de reversão e indicadores de evolução para a diretoria</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de Mês/Ano */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Mês:</Label>
            <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Ano:</Label>
            <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map(a => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleExportPdf} disabled={!relatorio || exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
            Exportar PDF
          </Button>
        </div>

        {relatorioQuery.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !relatorio ? (
          <p className="text-center text-muted-foreground py-8">Selecione um mês e ano para gerar o relatório</p>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Ocorrências', value: relatorio.resumo.totalOcorrencias, icon: AlertTriangle, color: 'text-red-600' },
                { label: 'Planos Criados', value: relatorio.resumo.totalPlanosCriados, icon: ClipboardCheck, color: 'text-blue-600' },
                { label: 'Planos Ativos', value: relatorio.resumo.totalPlanosAtivos, icon: RefreshCw, color: 'text-amber-600' },
                { label: 'Feedbacks', value: relatorio.resumo.totalFeedbacks, icon: MessageSquare, color: 'text-green-600' },
                { label: 'Reincidentes', value: relatorio.resumo.totalReincidentes, icon: UserX, color: 'text-purple-600' },
              ].map((kpi, i) => (
                <Card key={i}>
                  <CardContent className="p-3 text-center">
                    <kpi.icon className={`w-5 h-5 mx-auto mb-1 ${kpi.color}`} />
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detalhamento por Tipo */}
            {Object.keys(relatorio.porTipo).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ocorrências por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(relatorio.porTipo).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([tipo, qtd]) => (
                      <div key={tipo} className="flex items-center justify-between">
                        <span className="text-sm">{TIPO_LABELS[tipo] || tipo}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((qtd as number) / relatorio.resumo.totalOcorrencias) * 100)}%` }} />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{qtd as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detalhamento por Gravidade */}
            {Object.keys(relatorio.porGravidade).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribuição por Gravidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 flex-wrap">
                    {Object.entries(relatorio.porGravidade).map(([grav, qtd]) => (
                      <Badge key={grav} variant="outline" className={`text-sm py-1 px-3 ${GRAVIDADE_COLORS[grav] || ''}`}>
                        {GRAVIDADE_LABELS[grav] || grav}: {qtd as number}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evolução Feedbacks */}
            {relatorio.evolucaoFeedbacks && (relatorio.evolucaoFeedbacks.melhorou > 0 || relatorio.evolucaoFeedbacks.estavel > 0 || relatorio.evolucaoFeedbacks.piorou > 0) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Evolução dos Feedbacks de Planos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Melhorou: <strong>{relatorio.evolucaoFeedbacks.melhorou}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">Estável: <strong>{relatorio.evolucaoFeedbacks.estavel}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">Piorou: <strong>{relatorio.evolucaoFeedbacks.piorou}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reincidentes */}
            {relatorio.reincidentes && relatorio.reincidentes.length > 0 && (
              <Card className="border-l-4 border-l-red-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-600" />
                    Colaboradores Reincidentes (3+ ocorrências acumuladas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {relatorio.reincidentes.map((r: any) => (
                      <div key={r.colaboradorId} className="flex items-center justify-between p-2 rounded border">
                        <div>
                          <span className="font-medium text-sm">{r.nome}</span>
                          <span className="text-xs text-muted-foreground ml-2">{r.setor}</span>
                        </div>
                        <Badge variant="destructive">{r.count} ocorrências</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensagem se não há dados */}
            {relatorio.resumo.totalOcorrencias === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-medium">Nenhuma ocorrência registrada em {MESES[mes - 1]} de {ano}</p>
                <p className="text-sm">Período sem registros disciplinares</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
