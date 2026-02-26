import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  UserPlus, ChevronRight, Loader2, Search, Clock, AlertTriangle, CheckCircle,
  User, PlusCircle, ClipboardList, Video, FileText, ArrowRight,
  Building2, Phone, Mail, Landmark, Shield, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BackToDashboard from '@/components/BackToDashboard';
import TarefasAtrasadasBanner from '@/components/TarefasAtrasadasBanner';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
  fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
  feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
};

// ===== DEFAULT CHECKLIST ITEMS =====
const DEFAULT_CHECKLIST_REVISAO = [
  { id: 'ab1', fase: 'abertura', texto: 'Boas-vindas e apresentação do condutor', concluido: false },
  { id: 'ab2', fase: 'abertura', texto: 'Objetivo da reunião e duração estimada (30-40 min)', concluido: false },
  { id: 'ab3', fase: 'abertura', texto: 'Informar sobre gravação da reunião (documento probatório)', concluido: false },
  { id: 'ab4', fase: 'abertura', texto: 'Link do vídeo será enviado por e-mail', concluido: false },
  { id: 'ab5', fase: 'abertura', texto: 'Confirmação para começar', concluido: false },
  { id: 'ab6', fase: 'abertura', texto: 'Parabenizar pela escolha da Evox', concluido: false },
  { id: 'rv1', fase: 'revisao', texto: 'Apresentação do responsável técnico (Coordenadora RCT)', concluido: false },
  { id: 'rv2', fase: 'revisao', texto: 'Revisão do Crédito: tipo, período e valor estimado', concluido: false },
  { id: 'rv3', fase: 'revisao', texto: 'Disclaimer sobre RTI e base de dados', concluido: false },
];

const DEFAULT_CHECKLIST_REFINAMENTO = [
  { id: 'em1', fase: 'estrategia', texto: 'Definir estratégia: Compensação de guias vincendas', concluido: false },
  { id: 'em2', fase: 'estrategia', texto: 'Definir estratégia: Compensação interna', concluido: false },
  { id: 'em3', fase: 'estrategia', texto: 'Definir estratégia: Restituição', concluido: false },
  { id: 'em4', fase: 'estrategia', texto: 'Definir estratégia: Ressarcimento', concluido: false },
  { id: 'em5', fase: 'estrategia', texto: 'Definir estratégia: Retificação com baixa/redução de débitos', concluido: false },
  { id: 'em6', fase: 'estrategia', texto: 'Se compensação: definir tributos e linha do tempo estimada', concluido: false },
  { id: 'fo1', fase: 'fluxo_operacional', texto: 'Verificar necessidade de retificações', concluido: false },
  { id: 'fo2', fase: 'fluxo_operacional', texto: 'Tempo estimado: retificação → recepção → compensação', concluido: false },
  { id: 'fo3', fase: 'fluxo_operacional', texto: 'Utilização dos créditos somente pela Evox', concluido: false },
  { id: 'fo4', fase: 'fluxo_operacional', texto: 'Escriturações e transmissões em dia', concluido: false },
  { id: 'fo5', fase: 'fluxo_operacional', texto: 'Retificações e PerdComps com certificado Evox', concluido: false },
  { id: 'mf1', fase: 'malha_fiscal', texto: 'Explicação sobre malha fiscal', concluido: false },
  { id: 'mf2', fase: 'malha_fiscal', texto: 'Procedimento se incluído em malha', concluido: false },
  { id: 'mf3', fase: 'malha_fiscal', texto: 'Empresa enquadrada no e-MAC?', concluido: false },
  { id: 'mf4', fase: 'malha_fiscal', texto: 'Histórico de retificações e malha?', concluido: false },
  { id: 'cc1', fase: 'condicoes_contratuais', texto: 'Procuração habilitada durante execução', concluido: false },
  { id: 'cc2', fase: 'condicoes_contratuais', texto: 'Compensações automáticas e contínuas', concluido: false },
  { id: 'cc3', fase: 'condicoes_contratuais', texto: 'Guias disponíveis 5 dias úteis antes do vencimento', concluido: false },
  { id: 'cc4', fase: 'condicoes_contratuais', texto: 'Guias não disponibilizadas: ônus da contratante', concluido: false },
  { id: 'cc5', fase: 'condicoes_contratuais', texto: 'Honorários presumidos (mínimo R$ 5.000)', concluido: false },
  { id: 'cc6', fase: 'condicoes_contratuais', texto: 'Taxa de retrabalho 0,5% (mín R$ 500)', concluido: false },
  { id: 'cc7', fase: 'condicoes_contratuais', texto: 'Inoperância e-CAC: comunicação', concluido: false },
  { id: 'cc8', fase: 'condicoes_contratuais', texto: 'Retificações posteriores com anuência Evox', concluido: false },
  { id: 'cc9', fase: 'condicoes_contratuais', texto: 'Mudanças legislação: revisão estratégia', concluido: false },
  { id: 'cc10', fase: 'condicoes_contratuais', texto: 'Prazo 72h para análise de retificações', concluido: false },
  { id: 'cc11', fase: 'condicoes_contratuais', texto: 'Informar procuradores sobre regras', concluido: false },
  { id: 'cc12', fase: 'condicoes_contratuais', texto: 'Comunicar notificações em 72h', concluido: false },
  { id: 'cc13', fase: 'condicoes_contratuais', texto: 'Empresa assinante do Evox Monitor?', concluido: false },
  { id: 'ff1', fase: 'fluxo_financeiro', texto: 'Condições de honorários, faturamento, cobrança', concluido: false },
  { id: 'ff2', fase: 'fluxo_financeiro', texto: 'Data de vencimento, NF e boleto', concluido: false },
  { id: 'ct1', fase: 'contatos', texto: 'E-mail oficial setor crédito informado', concluido: false },
  { id: 'ct2', fase: 'contatos', texto: 'Contato telefônico coordenadora e suporte informado', concluido: false },
  { id: 'ct3', fase: 'contatos', texto: 'Validar contato: Contábil', concluido: false },
  { id: 'ct4', fase: 'contatos', texto: 'Validar contato: Financeiro', concluido: false },
  { id: 'ct5', fase: 'contatos', texto: 'Validar contato: Empresário', concluido: false },
  { id: 'ct6', fase: 'contatos', texto: 'Validar contato: Outros', concluido: false },
];

const DEFAULT_CHECKLIST_REGISTRO = [
  { id: 'rc1', fase: 'recapitulacao', texto: 'Recapitulação: tipo de crédito e valor estimado', concluido: false },
  { id: 'rc2', fase: 'recapitulacao', texto: 'Recapitulação: estratégia de monetização definida', concluido: false },
  { id: 'rc3', fase: 'recapitulacao', texto: 'Recapitulação: necessidade de retificações', concluido: false },
  { id: 'rc4', fase: 'recapitulacao', texto: 'Recapitulação: prazos estimados', concluido: false },
  { id: 'rc5', fase: 'recapitulacao', texto: 'Recapitulação: condições contratuais confirmadas', concluido: false },
  { id: 'rc6', fase: 'recapitulacao', texto: 'Recapitulação: fluxo financeiro e honorários', concluido: false },
  { id: 'rc7', fase: 'recapitulacao', texto: 'Recapitulação: contatos validados', concluido: false },
  { id: 'rc8', fase: 'recapitulacao', texto: 'Recapitulação: próximos passos definidos', concluido: false },
  { id: 'rc9', fase: 'recapitulacao', texto: 'Recapitulação: responsável técnico confirmado', concluido: false },
  { id: 'rc10', fase: 'recapitulacao', texto: 'Recapitulação: prazo de início dos trabalhos', concluido: false },
  { id: 'vl1', fase: 'validacao', texto: 'Alguma dúvida? Todas as dúvidas esclarecidas', concluido: false },
  { id: 'en1', fase: 'encerramento', texto: 'Agradecimento e início oficial da parceria', concluido: false },
];

const FASE_LABELS: Record<string, { label: string; icon: any }> = {
  abertura: { label: 'Abertura', icon: UserPlus },
  revisao: { label: 'Revisão', icon: FileText },
  estrategia: { label: 'Estratégia de Monetização', icon: DollarSign },
  fluxo_operacional: { label: 'Fluxo Operacional', icon: ArrowRight },
  malha_fiscal: { label: 'Malha Fiscal', icon: Shield },
  condicoes_contratuais: { label: 'Condições Contratuais', icon: Landmark },
  fluxo_financeiro: { label: 'Fluxo Financeiro', icon: DollarSign },
  contatos: { label: 'Contatos', icon: Phone },
  recapitulacao: { label: 'Recapitulação', icon: ClipboardList },
  validacao: { label: 'Validação', icon: CheckCircle },
  encerramento: { label: 'Encerramento', icon: CheckCircle },
};

const ESTRATEGIA_OPTIONS = [
  { value: 'compensacao', label: 'Compensação' },
  { value: 'ressarcimento', label: 'Ressarcimento' },
  { value: 'restituicao', label: 'Restituição' },
  { value: 'mista', label: 'Mista (múltiplas filas)' },
];

export default function CreditoFilaOnboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Onboarding Dialog
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [onboardingPhase, setOnboardingPhase] = useState('revisao');

  // Onboarding Form
  const [checklistRevisao, setChecklistRevisao] = useState<any[]>([...DEFAULT_CHECKLIST_REVISAO]);
  const [checklistRefinamento, setChecklistRefinamento] = useState<any[]>([...DEFAULT_CHECKLIST_REFINAMENTO]);
  const [checklistRegistro, setChecklistRegistro] = useState<any[]>([...DEFAULT_CHECKLIST_REGISTRO]);

  const [reuniaoForm, setReuniaoForm] = useState({
    reuniaoGravacaoUrl: '',
    reuniaoTranscricaoUrl: '',
    reuniaoData: '',
    reuniaoParticipantes: '',
  });

  const [estrategiaForm, setEstrategiaForm] = useState({
    estrategia: '',
    estrategiaDetalhes: '',
    creditoDescricao: '',
    periodoCredito: '',
    valorEstimadoCredito: '',
  });

  const [contatosForm, setContatosForm] = useState({
    contatoContabil: { nome: '', email: '', telefone: '' },
    contatoFinanceiro: { nome: '', email: '', telefone: '' },
    contatoEmpresario: { nome: '', email: '', telefone: '' },
    contatoOutros: { nome: '', email: '', telefone: '' },
  });

  const [diagnosticoForm, setDiagnosticoForm] = useState({
    empresaTemDebitos: false,
    empresaPrecisaCnd: false,
    empresaNoEmac: false,
    empresaHistoricoMalha: false,
    empresaAssinanteMonitor: false,
  });

  // Queries
  const { data: tasks, isLoading, refetch: refetchTasks } = trpc.creditRecovery.credito.tasks.list.useQuery({ fila: 'onboarding' } as any);

  // Mutations
  const createOnboarding = trpc.creditRecovery.admin.onboarding.create.useMutation();
  const updateOnboarding = trpc.creditRecovery.admin.onboarding.update.useMutation();

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks as any[];
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.titulo?.toLowerCase().includes(term) ||
        t.codigo?.toLowerCase().includes(term) ||
        t.responsavelNome?.toLowerCase().includes(term)
      );
    }
    result.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return result;
  }, [tasks, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const all = (tasks as any[]) || [];
    return {
      total: all.length,
      aFazer: all.filter(t => t.status === 'a_fazer').length,
      fazendo: all.filter(t => t.status === 'fazendo').length,
      concluido: all.filter(t => t.status === 'concluido' || t.status === 'feito').length,
      emAtraso: all.filter(t => t.slaStatus === 'vencido').length,
    };
  }, [tasks]);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  // ===== Open Onboarding Dialog =====
  const handleOpenOnboarding = (task: any) => {
    setSelectedTask(task);
    setChecklistRevisao(DEFAULT_CHECKLIST_REVISAO.map(i => ({ ...i, concluido: false })));
    setChecklistRefinamento(DEFAULT_CHECKLIST_REFINAMENTO.map(i => ({ ...i, concluido: false })));
    setChecklistRegistro(DEFAULT_CHECKLIST_REGISTRO.map(i => ({ ...i, concluido: false })));
    setReuniaoForm({ reuniaoGravacaoUrl: '', reuniaoTranscricaoUrl: '', reuniaoData: '', reuniaoParticipantes: '' });
    setEstrategiaForm({ estrategia: '', estrategiaDetalhes: '', creditoDescricao: '', periodoCredito: '', valorEstimadoCredito: '' });
    setContatosForm({
      contatoContabil: { nome: '', email: '', telefone: '' },
      contatoFinanceiro: { nome: '', email: '', telefone: '' },
      contatoEmpresario: { nome: '', email: '', telefone: '' },
      contatoOutros: { nome: '', email: '', telefone: '' },
    });
    setDiagnosticoForm({ empresaTemDebitos: false, empresaPrecisaCnd: false, empresaNoEmac: false, empresaHistoricoMalha: false, empresaAssinanteMonitor: false });
    setOnboardingPhase('revisao');
    setOnboardingDialogOpen(true);
  };

  const toggleChecklistItem = (list: any[], setList: Function, id: string) => {
    setList(list.map((item: any) => item.id === id ? { ...item, concluido: !item.concluido, concluidoEm: !item.concluido ? new Date().toISOString() : null } : item));
  };

  const getPhaseProgress = (list: any[]) => {
    if (list.length === 0) return 0;
    return Math.round((list.filter(i => i.concluido).length / list.length) * 100);
  };

  const totalProgress = useMemo(() => {
    const all = [...checklistRevisao, ...checklistRefinamento, ...checklistRegistro];
    if (all.length === 0) return 0;
    return Math.round((all.filter(i => i.concluido).length / all.length) * 100);
  }, [checklistRevisao, checklistRefinamento, checklistRegistro]);

  // ===== Save Onboarding =====
  const handleSaveOnboarding = async () => {
    if (!selectedTask) return;
    try {
      const result = await createOnboarding.mutateAsync({
        taskId: selectedTask.id,
        caseId: selectedTask.caseId || undefined,
        clienteId: selectedTask.clienteId,
        checklistRevisao: checklistRevisao,
        checklistRefinamento: checklistRefinamento,
        checklistRegistro: checklistRegistro,
      });

      const onbId = (result as any)?.id;
      if (onbId) {
        await updateOnboarding.mutateAsync({
          id: onbId,
          reuniaoGravacaoUrl: reuniaoForm.reuniaoGravacaoUrl || undefined,
          reuniaoTranscricaoUrl: reuniaoForm.reuniaoTranscricaoUrl || undefined,
          reuniaoData: reuniaoForm.reuniaoData || undefined,
          reuniaoParticipantes: reuniaoForm.reuniaoParticipantes ? reuniaoForm.reuniaoParticipantes.split(',').map(s => s.trim()) : undefined,
          creditoDescricao: estrategiaForm.creditoDescricao || undefined,
          periodoCredito: estrategiaForm.periodoCredito || undefined,
          valorEstimadoCredito: estrategiaForm.valorEstimadoCredito ? parseFloat(estrategiaForm.valorEstimadoCredito) : undefined,
          estrategia: estrategiaForm.estrategia || undefined,
          estrategiaDetalhes: estrategiaForm.estrategiaDetalhes ? { descricao: estrategiaForm.estrategiaDetalhes } : undefined,
          contatoContabil: contatosForm.contatoContabil,
          contatoFinanceiro: contatosForm.contatoFinanceiro,
          contatoEmpresario: contatosForm.contatoEmpresario,
          contatoOutros: contatosForm.contatoOutros,
          empresaTemDebitos: diagnosticoForm.empresaTemDebitos ? 1 : 0,
          empresaPrecisaCnd: diagnosticoForm.empresaPrecisaCnd ? 1 : 0,
          empresaNoEmac: diagnosticoForm.empresaNoEmac ? 1 : 0,
          empresaHistoricoMalha: diagnosticoForm.empresaHistoricoMalha ? 1 : 0,
          empresaAssinanteMonitor: diagnosticoForm.empresaAssinanteMonitor ? 1 : 0,
          status: totalProgress === 100 ? 'concluido' : 'em_andamento',
        });
      }

      toast.success('Onboarding salvo com sucesso!');
      setOnboardingDialogOpen(false);
      refetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar onboarding');
    }
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
      {/* Back to Dashboard */}
      <BackToDashboard />

      {/* Tarefas Atrasadas */}
      <TarefasAtrasadasBanner fila="onboarding" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <UserPlus className="w-6 h-6" />
            Fila de Onboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Checklist de 3 fases (Revisão, Refinamento, Registro), reunião gravada e definição da estratégia de monetização.
          </p>
        </div>
        <Button onClick={() => navigate('/credito/nova-tarefa-credito')} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'A Fazer', value: stats.aFazer, color: 'text-amber-600' },
          { label: 'Fazendo', value: stats.fazendo, color: 'text-blue-600' },
          { label: 'Concluído', value: stats.concluido, color: 'text-emerald-600' },
          { label: 'Em Atraso', value: stats.emAtraso, color: 'text-red-600' },
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
          <Input placeholder="Buscar por código, título ou responsável..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="a_fazer">A Fazer</SelectItem>
            <SelectItem value="fazendo">Fazendo</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Nenhuma tarefa de onboarding encontrada.</p>
              <p className="text-xs mt-1">Tarefas de onboarding são criadas automaticamente quando um contrato de crédito é assinado.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/credito/nova-tarefa-credito')}>
                <PlusCircle className="w-4 h-4" />
                Criar Manualmente
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Código</div>
                <div className="col-span-2">Cliente</div>
                <div className="col-span-2">Título</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Responsável</div>
                <div className="col-span-1">SLA</div>
                <div className="col-span-1">Criado</div>
                <div className="col-span-1">Por</div>
                <div className="col-span-2 text-center">Ações</div>
              </div>
              {filteredTasks.map((task: any) => {
                const statusInfo = STATUS_LABELS[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-800' };
                const isOverdue = task.slaStatus === 'vencido';
                return (
                  <div key={task.id} className={cn('grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-sm', isOverdue && 'bg-red-50/50')}>
                    <div className="col-span-1">
                      <span className="font-mono text-xs text-muted-foreground">{task.codigo}</span>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="text-xs font-medium truncate">{task.clienteNome || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{task.clienteCnpj || ''}</p>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="font-medium text-foreground truncate text-xs">{task.titulo}</p>
                    </div>
                    <div className="col-span-1">
                      <Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge>
                    </div>
                    <div className="col-span-1 flex items-center gap-1 min-w-0">
                      <User className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate">{task.responsavelNome || '—'}</span>
                    </div>
                    <div className="col-span-1">
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-[10px] gap-0.5"><AlertTriangle className="w-3 h-3" />Atraso</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-0.5"><CheckCircle className="w-3 h-3" />OK</Badge>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span className="text-[10px] text-muted-foreground">{formatDateTime(task.createdAt)}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[10px] text-muted-foreground truncate">{task.criadoPorNome || '—'}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 justify-center">
                      <Button variant="default" size="sm" className="h-7 px-3 text-xs gap-1" onClick={() => handleOpenOnboarding(task)}>
                        <ClipboardList className="w-3.5 h-3.5" />
                        Iniciar Onboarding
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== ONBOARDING DIALOG ===== */}
      <Dialog open={onboardingDialogOpen} onOpenChange={setOnboardingDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Onboarding — {selectedTask?.clienteNome || 'Cliente'}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Tarefa: {selectedTask?.codigo}</span>
              <span>Progresso Total: <span className="font-bold text-foreground">{totalProgress}%</span></span>
            </div>
            {/* Global progress bar */}
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className={cn('rounded-full h-2 transition-all', totalProgress === 100 ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${totalProgress}%` }} />
            </div>
          </DialogHeader>

          <Tabs value={onboardingPhase} onValueChange={setOnboardingPhase}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="revisao" className="gap-2">
                <FileText className="w-4 h-4" />
                1. Revisão
                <Badge className="ml-1 text-[10px]">{getPhaseProgress(checklistRevisao)}%</Badge>
              </TabsTrigger>
              <TabsTrigger value="refinamento" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                2. Refinamento
                <Badge className="ml-1 text-[10px]">{getPhaseProgress(checklistRefinamento)}%</Badge>
              </TabsTrigger>
              <TabsTrigger value="registro" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                3. Registro
                <Badge className="ml-1 text-[10px]">{getPhaseProgress(checklistRegistro)}%</Badge>
              </TabsTrigger>
              <TabsTrigger value="reuniao" className="gap-2">
                <Video className="w-4 h-4" />
                Reunião
              </TabsTrigger>
              <TabsTrigger value="estrategia" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Estratégia
              </TabsTrigger>
              <TabsTrigger value="contatos" className="gap-2">
                <Phone className="w-4 h-4" />
                Contatos
              </TabsTrigger>
            </TabsList>

            {/* ===== REVISÃO TAB ===== */}
            <TabsContent value="revisao" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Fase 1: Revisão</h3>
                  <span className="text-sm text-muted-foreground">{checklistRevisao.filter(i => i.concluido).length}/{checklistRevisao.length}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${getPhaseProgress(checklistRevisao)}%` }} />
                </div>
              </div>
              <ChecklistPhaseView items={checklistRevisao} onToggle={(id) => toggleChecklistItem(checklistRevisao, setChecklistRevisao, id)} />
            </TabsContent>

            {/* ===== REFINAMENTO TAB ===== */}
            <TabsContent value="refinamento" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Fase 2: Refinamento</h3>
                  <span className="text-sm text-muted-foreground">{checklistRefinamento.filter(i => i.concluido).length}/{checklistRefinamento.length}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${getPhaseProgress(checklistRefinamento)}%` }} />
                </div>
              </div>
              <ChecklistPhaseView items={checklistRefinamento} onToggle={(id) => toggleChecklistItem(checklistRefinamento, setChecklistRefinamento, id)} />

              {/* Diagnóstico rápido */}
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Diagnóstico Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: 'empresaTemDebitos', label: 'Empresa possui débitos fiscais?' },
                    { key: 'empresaPrecisaCnd', label: 'Empresa precisa de CND?' },
                    { key: 'empresaNoEmac', label: 'Empresa enquadrada no e-MAC?' },
                    { key: 'empresaHistoricoMalha', label: 'Histórico de malha fiscal?' },
                    { key: 'empresaAssinanteMonitor', label: 'Assinante do Evox Monitor?' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-3">
                      <Checkbox
                        checked={(diagnosticoForm as any)[item.key]}
                        onCheckedChange={(v) => setDiagnosticoForm(prev => ({ ...prev, [item.key]: !!v }))}
                      />
                      <Label className="text-sm">{item.label}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== REGISTRO TAB ===== */}
            <TabsContent value="registro" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Fase 3: Registro</h3>
                  <span className="text-sm text-muted-foreground">{checklistRegistro.filter(i => i.concluido).length}/{checklistRegistro.length}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${getPhaseProgress(checklistRegistro)}%` }} />
                </div>
              </div>
              <ChecklistPhaseView items={checklistRegistro} onToggle={(id) => toggleChecklistItem(checklistRegistro, setChecklistRegistro, id)} />
            </TabsContent>

            {/* ===== REUNIÃO TAB ===== */}
            <TabsContent value="reuniao" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Reunião de Onboarding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data da Reunião</Label>
                      <Input type="datetime-local" value={reuniaoForm.reuniaoData} onChange={(e) => setReuniaoForm(prev => ({ ...prev, reuniaoData: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Participantes (separados por vírgula)</Label>
                      <Input placeholder="Nome 1, Nome 2, ..." value={reuniaoForm.reuniaoParticipantes} onChange={(e) => setReuniaoForm(prev => ({ ...prev, reuniaoParticipantes: e.target.value }))} />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Link da Gravação da Reunião</Label>
                    <Input placeholder="https://drive.google.com/... ou URL do vídeo" value={reuniaoForm.reuniaoGravacaoUrl} onChange={(e) => setReuniaoForm(prev => ({ ...prev, reuniaoGravacaoUrl: e.target.value }))} />
                    <p className="text-xs text-muted-foreground">Cole o link da gravação ou faça upload do arquivo.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Link da Transcrição da Reunião</Label>
                    <Input placeholder="https://... ou URL do documento" value={reuniaoForm.reuniaoTranscricaoUrl} onChange={(e) => setReuniaoForm(prev => ({ ...prev, reuniaoTranscricaoUrl: e.target.value }))} />
                    <p className="text-xs text-muted-foreground">Documento probatório do alinhamento realizado.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== ESTRATÉGIA TAB ===== */}
            <TabsContent value="estrategia" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Estratégia de Monetização do Crédito
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      A estratégia definida aqui determinará para qual fila o cliente será encaminhado após a retificação.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Crédito</Label>
                      <Input placeholder="Ex: PIS/COFINS Monofásico" value={estrategiaForm.creditoDescricao} onChange={(e) => setEstrategiaForm(prev => ({ ...prev, creditoDescricao: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Período do Crédito</Label>
                      <Input placeholder="Ex: 01/2020 a 12/2024" value={estrategiaForm.periodoCredito} onChange={(e) => setEstrategiaForm(prev => ({ ...prev, periodoCredito: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Estimado do Crédito (R$)</Label>
                      <Input type="number" step="0.01" placeholder="0,00" value={estrategiaForm.valorEstimadoCredito} onChange={(e) => setEstrategiaForm(prev => ({ ...prev, valorEstimadoCredito: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Estratégia de Monetização</Label>
                      <Select value={estrategiaForm.estrategia} onValueChange={(v) => setEstrategiaForm(prev => ({ ...prev, estrategia: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione a estratégia" /></SelectTrigger>
                        <SelectContent>
                          {ESTRATEGIA_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {estrategiaForm.estrategia && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm font-medium text-primary mb-1">Fila(s) de destino após retificação:</p>
                      <div className="flex items-center gap-2">
                        {estrategiaForm.estrategia === 'compensacao' && <Badge className="bg-blue-100 text-blue-800">Compensação</Badge>}
                        {estrategiaForm.estrategia === 'ressarcimento' && <Badge className="bg-purple-100 text-purple-800">Ressarcimento</Badge>}
                        {estrategiaForm.estrategia === 'restituicao' && <Badge className="bg-emerald-100 text-emerald-800">Restituição</Badge>}
                        {estrategiaForm.estrategia === 'mista' && (
                          <>
                            <Badge className="bg-blue-100 text-blue-800">Compensação</Badge>
                            <Badge className="bg-purple-100 text-purple-800">Ressarcimento</Badge>
                            <Badge className="bg-emerald-100 text-emerald-800">Restituição</Badge>
                          </>
                        )}
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Após Retificação</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Detalhes da Estratégia</Label>
                    <Textarea rows={3} placeholder="Detalhes adicionais sobre a estratégia definida..." value={estrategiaForm.estrategiaDetalhes} onChange={(e) => setEstrategiaForm(prev => ({ ...prev, estrategiaDetalhes: e.target.value }))} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== CONTATOS TAB ===== */}
            <TabsContent value="contatos" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contatos Validados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { key: 'contatoContabil', label: 'Contato Contábil', icon: Building2 },
                    { key: 'contatoFinanceiro', label: 'Contato Financeiro', icon: DollarSign },
                    { key: 'contatoEmpresario', label: 'Contato Empresário', icon: User },
                    { key: 'contatoOutros', label: 'Outros Contatos', icon: Phone },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key}>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4" />
                        {label}
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome</Label>
                          <Input placeholder="Nome" value={(contatosForm as any)[key].nome} onChange={(e) => setContatosForm(prev => ({ ...prev, [key]: { ...(prev as any)[key], nome: e.target.value } }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">E-mail</Label>
                          <Input placeholder="email@empresa.com" value={(contatosForm as any)[key].email} onChange={(e) => setContatosForm(prev => ({ ...prev, [key]: { ...(prev as any)[key], email: e.target.value } }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Telefone</Label>
                          <Input placeholder="(00) 00000-0000" value={(contatosForm as any)[key].telefone} onChange={(e) => setContatosForm(prev => ({ ...prev, [key]: { ...(prev as any)[key], telefone: e.target.value } }))} />
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Progresso: {totalProgress}% concluído
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setOnboardingDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveOnboarding} disabled={createOnboarding.isPending || updateOnboarding.isPending} className="gap-2">
                {(createOnboarding.isPending || updateOnboarding.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {totalProgress === 100 ? 'Concluir Onboarding' : 'Salvar Progresso'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== CHECKLIST PHASE VIEW COMPONENT =====
function ChecklistPhaseView({ items, onToggle }: { items: any[]; onToggle: (id: string) => void }) {
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
      const fase = item.fase || 'geral';
      if (!groups[fase]) groups[fase] = [];
      groups[fase].push(item);
    });
    return groups;
  }, [items]);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([fase, faseItems]) => {
        const faseInfo = FASE_LABELS[fase] || { label: fase, icon: ClipboardList };
        const FaseIcon = faseInfo.icon;
        const done = faseItems.filter(i => i.concluido).length;
        return (
          <Card key={fase}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FaseIcon className="w-4 h-4" />
                  {faseInfo.label}
                </span>
                <Badge variant="outline" className="text-[10px]">{done}/{faseItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {faseItems.map((item: any) => (
                <div key={item.id} className={cn('flex items-start gap-3 p-2 rounded-md transition-colors', item.concluido && 'bg-emerald-50/50')}>
                  <Checkbox checked={item.concluido} onCheckedChange={() => onToggle(item.id)} className="mt-0.5" />
                  <div className="flex-1">
                    <p className={cn('text-sm', item.concluido && 'line-through text-muted-foreground')}>{item.texto}</p>
                    {item.concluidoEm && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(item.concluidoEm).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
