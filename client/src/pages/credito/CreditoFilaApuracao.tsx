import { useState, useMemo } from 'react';
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
  Calculator, ChevronRight, Loader2, Search, Clock, AlertTriangle, CheckCircle,
  User, FileText, ClipboardList, Send, Eye, Trash2, Download, Filter,
  Plus, ArrowRight, Building2, BarChart3, Handshake, Play, Square, CheckSquare2,
  Upload, Paperclip, UserCheck, Flag, ShieldCheck, ShieldAlert, ShieldOff, Sparkles, Hash,
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

const RETORNO_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aguardando: { label: 'Aguardando', color: 'bg-amber-100 text-amber-800' },
  fechou: { label: 'Fechou', color: 'bg-emerald-100 text-emerald-800' },
  nao_fechou: { label: 'Não Fechou', color: 'bg-red-100 text-red-800' },
  sem_retorno: { label: 'Sem Retorno', color: 'bg-gray-100 text-gray-800' },
  em_negociacao: { label: 'Em Negociação', color: 'bg-blue-100 text-blue-800' },
};

export default function CreditoFilaApuracao() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('fila');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parceiroFilter, setParceiroFilter] = useState('all');
  const [teseFilter, setTeseFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [procuracaoFilter, setProcuracaoFilter] = useState('all');
  const [tipoClienteFilter, setTipoClienteFilter] = useState('all');
  const [slaStatusFilter, setSlaStatusFilter] = useState('all');
  const [viabilidadeFilter, setViabilidadeFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // RTI Dialog
  const [rtiDialogOpen, setRtiDialogOpen] = useState(false);
  const [rtiViewDialogOpen, setRtiViewDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [rtiTab, setRtiTab] = useState('dados');
  const [viewingRti, setViewingRti] = useState<any>(null);
  const [showTeseSelector, setShowTeseSelector] = useState(false);

  // RTI Form
  const [rtiForm, setRtiForm] = useState({
    periodoAnalise: '',
    resumoExecutivo: '',
    metodologia: '',
    conclusao: '',
    observacoes: '',
  });
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [cenarioCompensacao, setCenarioCompensacao] = useState<any[]>([
    { tributo: 'PIS/COFINS', mediaMensal: 0 },
    { tributo: 'IRPJ/CSLL', mediaMensal: 0 },
    { tributo: 'INSS', mediaMensal: 0 },
  ]);
  const [alertas, setAlertas] = useState<any[]>([]);

  // Checklist Dialog
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [checklistTask, setChecklistTask] = useState<any>(null);

  // Partner Return Dialog
  const [retornoDialogOpen, setRetornoDialogOpen] = useState(false);
  const [retornoForm, setRetornoForm] = useState<any>({});

  // RTI History
  const [rtiHistoryDialogOpen, setRtiHistoryDialogOpen] = useState(false);
  const [rtiHistoryTaskId, setRtiHistoryTaskId] = useState<number | null>(null);
  const [comparingRtis, setComparingRtis] = useState<[any, any] | null>(null);

  // Queries
  const { data: tasks, isLoading, refetch: refetchTasks } = trpc.creditRecovery.credito.tasks.list.useQuery({ fila: 'apuracao' } as any);
  const { data: partnerReturns, refetch: refetchReturns } = trpc.creditRecovery.admin.partnerReturns.list.useQuery({});
  const { data: partnerReturnStats } = trpc.creditRecovery.admin.partnerReturns.stats.useQuery();
  const { data: checklistTemplates } = trpc.creditRecovery.admin.checklists.templates.useQuery({ fila: 'apuracao' });
  const { data: rtiTemplates } = trpc.creditRecovery.admin.rtiTemplates.list.useQuery();
  const { data: allTeses } = trpc.teses.list.useQuery();
  const { data: parceirosData } = trpc.parceiros.list.useQuery();
  // Query task teses when a task is selected
  const { data: taskTesesData } = trpc.creditRecovery.admin.taskTeses.list.useQuery(
    { taskId: selectedTask?.id },
    { enabled: !!selectedTask?.id }
  );

  // Mutations
  const createRti = trpc.creditRecovery.credito.rti.create.useMutation();
  const updateRti = trpc.creditRecovery.credito.rti.update.useMutation();
  const emitirRti = trpc.creditRecovery.credito.rti.emitir.useMutation();
  const createOportunidade = trpc.creditRecovery.admin.rtiOportunidades.create.useMutation();
  const upsertCenario = trpc.creditRecovery.admin.rtiCenario.upsert.useMutation();
  const upsertAlertas = trpc.creditRecovery.admin.rtiAlertas.upsert.useMutation();
  const createPartnerReturn = trpc.creditRecovery.admin.partnerReturns.create.useMutation();
  const updatePartnerReturn = trpc.creditRecovery.admin.partnerReturns.update.useMutation();
  const createChecklistInstance = trpc.creditRecovery.admin.checklists.createInstance.useMutation();
  const updateChecklistInstance = trpc.creditRecovery.admin.checklists.updateInstance.useMutation();
  const assumeTask = trpc.creditRecovery.credito.tasks.assumeTask.useMutation();
  const finishTask = trpc.creditRecovery.credito.tasks.finishTask.useMutation();
  const completeAndMove = trpc.creditRecovery.credito.tasks.completeAndMoveToNextFila.useMutation();
  const uploadFile = trpc.arquivos.upload.useMutation();

  // Workflow states
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [finishingTask, setFinishingTask] = useState<any>(null);
  const [finishObs, setFinishObs] = useState('');
  const [finishAnexos, setFinishAnexos] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [finishViabilidade, setFinishViabilidade] = useState<'viavel' | 'inviavel' | ''>('');
  const [finishValorGlobal, setFinishValorGlobal] = useState<string>('');

  // Workflow handlers
  const handleAssumeTask = async (task: any) => {
    try {
      await assumeTask.mutateAsync({ id: task.id });
      toast.success(`Tarefa ${task.codigo} assumida! Status alterado para "Fazendo".`);
      refetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao assumir tarefa');
    }
  };

  const handleOpenFinishDialog = (task: any) => {
    setFinishingTask(task);
    setFinishObs(task.observacoes || '');
    setFinishAnexos([]);
    setFinishViabilidade('');
    setFinishValorGlobal('');
    setFinishDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        const result = await uploadFile.mutateAsync({
          nome: file.name,
          nomeOriginal: file.name,
          mimeType: file.type,
          tamanhoBytes: file.size,
          base64Data: base64,
          entidadeTipo: 'tarefa',
          entidadeId: finishingTask?.id,
          descricao: 'Memória de cálculo / Documento de análise',
        });
        setFinishAnexos(prev => [...prev, { nome: file.name, url: result.url, tipo: file.type }]);
      }
      toast.success('Arquivo(s) enviado(s) com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar arquivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFinishTask = async () => {
    if (!finishingTask) return;
    try {
      const valorNum = finishValorGlobal ? parseFloat(finishValorGlobal.replace(/\./g, '').replace(',', '.')) : undefined;
      // Auto-calculate viabilidade if valor is provided but viabilidade not selected
      let viab = finishViabilidade || undefined;
      if (!viab && valorNum !== undefined) {
        viab = valorNum >= 20000 ? 'viavel' : 'inviavel';
      }
      const result = await finishTask.mutateAsync({
        id: finishingTask.id,
        observacoes: finishObs,
        anexos: finishAnexos,
        viabilidade: viab as any,
        valorGlobalApurado: valorNum,
      });
      const viabLabel = (result.viabilidade || viab) === 'viavel' ? 'VIÁVEL' : 'INVIÁVEL';
      const valorLabel = result.valorGlobalApurado !== undefined ? `R$ ${Number(result.valorGlobalApurado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
      toast.success(`Tarefa ${finishingTask.codigo} finalizada! Apuração: ${viabLabel} ${valorLabel ? `(${valorLabel})` : ''}. Status alterado para "Feito".`);
      setFinishDialogOpen(false);
      refetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar tarefa');
    }
  };

  const handleCompleteAndMove = async (task: any) => {
    try {
      const result = await completeAndMove.mutateAsync({ id: task.id });
      const nextFilaLabel: Record<string, string> = {
        apuracao: 'Apuração', compensacao: 'Compensação', retificacao: 'Retificação',
        ressarcimento: 'Ressarcimento', restituicao: 'Restituição', onboarding: 'Onboarding',
      };
      if (result.nextFila) {
        toast.success(`Tarefa concluída e movida para a fila "${nextFilaLabel[result.nextFila] || result.nextFila}". Notificação enviada.`);
      } else {
        toast.success(`Tarefa concluída! Não há próxima fila no fluxo.`);
      }
      refetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao concluir tarefa');
    }
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks as any[];
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (parceiroFilter !== 'all') result = result.filter(t => String(t._parceiroId) === parceiroFilter || t.parceiroNome === parceiroFilter);
    if (teseFilter !== 'all') result = result.filter(t => {
      // Match by task title containing tese name or by tese association
      const teseName = (allTeses as any[])?.find((ts: any) => String(ts.id) === teseFilter)?.nome || '';
      return t.titulo?.toLowerCase().includes(teseName.toLowerCase());
    });
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(t => new Date(t.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      result = result.filter(t => new Date(t.createdAt) <= to);
    }
    if (procuracaoFilter !== 'all') {
      result = result.filter(t => (t.procuracaoStatus || 'sem') === procuracaoFilter);
    }
    if (tipoClienteFilter !== 'all') {
      result = result.filter(t => (t.clienteClassificacao || 'base') === tipoClienteFilter);
    }
    if (slaStatusFilter !== 'all') {
      result = result.filter(t => {
        const sla = t.slaStatus || 'dentro_prazo';
        return sla === slaStatusFilter;
      });
    }
    if (viabilidadeFilter !== 'all') {
      result = result.filter(t => t.viabilidade === viabilidadeFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.titulo?.toLowerCase().includes(term) ||
        t.codigo?.toLowerCase().includes(term) ||
        t.responsavelNome?.toLowerCase().includes(term) ||
        t.clienteNome?.toLowerCase().includes(term) ||
        t.clienteCnpj?.includes(term) ||
        t.parceiroNome?.toLowerCase().includes(term)
      );
    }
    result.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return result;
  }, [tasks, statusFilter, parceiroFilter, teseFilter, dateFrom, dateTo, procuracaoFilter, tipoClienteFilter, slaStatusFilter, viabilidadeFilter, searchTerm, allTeses]);

  const stats = useMemo(() => {
    const all = (tasks as any[]) || [];
    return {
      total: all.length,
      aFazer: all.filter(t => t.status === 'a_fazer').length,
      fazendo: all.filter(t => t.status === 'fazendo').length,
      feito: all.filter(t => t.status === 'feito').length,
      emAtraso: all.filter(t => t.slaStatus === 'vencido').length,
    };
  }, [tasks]);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatCurrency = (v: number | string) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // ===== RTI Generation =====
  const handleOpenRtiDialog = (task: any) => {
    setSelectedTask(task);
    setRtiForm({ periodoAnalise: '', resumoExecutivo: '', metodologia: '', conclusao: '', observacoes: '' });
    setCenarioCompensacao([
      { tributo: 'PIS/COFINS', mediaMensal: 0 },
      { tributo: 'IRPJ/CSLL', mediaMensal: 0 },
      { tributo: 'INSS', mediaMensal: 0 },
    ]);
    setAlertas([]);
    setRtiTab('dados');
    setShowTeseSelector(false);

    // Auto-populate oportunidades from task teses
    if (taskTesesData && (taskTesesData as any[]).length > 0) {
      const autoOps = (taskTesesData as any[]).map((tt: any, idx: number) => ({
        descricao: tt.teseNome || `Tese #${tt.teseId}`,
        classificacao: tt.classificacao === 'pacificada' ? 'pacificado' : 'nao_pacificado',
        valorApurado: parseFloat(tt.valorEstimado) || 0,
        teseId: tt.teseId,
        ordem: idx,
      }));
      setOportunidades(autoOps);
    } else {
      setOportunidades([]);
    }

    // Load template if available
    if (rtiTemplates && (rtiTemplates as any[]).length > 0) {
      const tpl = (rtiTemplates as any[])[0];
      setRtiForm(prev => ({
        ...prev,
        resumoExecutivo: tpl.textoIntro || '',
        observacoes: tpl.textoObservacoes || '',
      }));
      if (tpl.cenarioCompensacaoDefault) {
        try {
          const parsed = typeof tpl.cenarioCompensacaoDefault === 'string' ? JSON.parse(tpl.cenarioCompensacaoDefault) : tpl.cenarioCompensacaoDefault;
          if (Array.isArray(parsed)) setCenarioCompensacao(parsed);
        } catch {}
      }
      if (tpl.alertasDefault) {
        try {
          const parsed = typeof tpl.alertasDefault === 'string' ? JSON.parse(tpl.alertasDefault) : tpl.alertasDefault;
          if (Array.isArray(parsed)) setAlertas(parsed);
        } catch {}
      }
    }
    setRtiDialogOpen(true);
  };

  // Add oportunidade from tese catalog
  const addOportunidadeFromTese = (tese: any) => {
    setOportunidades(prev => [...prev, {
      descricao: tese.nome,
      classificacao: tese.classificacao === 'pacificada' ? 'pacificado' : 'nao_pacificado',
      valorApurado: 0,
      teseId: tese.id,
      ordem: prev.length,
    }]);
    setShowTeseSelector(false);
  };

  // Generate RTI PDF client-side
  const generateRtiPdf = async (rtiData: { clienteNome: string; clienteCnpj: string; periodoAnalise: string; resumoExecutivo: string; metodologia: string; conclusao: string; observacoes: string; oportunidades: any[]; cenario: any[]; alertas: any[]; totalOportunidades: number; totalPacificado: number; totalNaoPacificado: number; numero?: string; data?: string }) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EVOX FISCAL', margin, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RTI — Relatório Técnico Inicial', margin, 23);
    doc.text(`${rtiData.numero || ''} | ${rtiData.data || new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, margin, 30);
    y = 45;

    // Client info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Cliente', margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Razão Social: ${rtiData.clienteNome || '—'}`, margin, y); y += 5;
    doc.text(`CNPJ: ${rtiData.clienteCnpj || '—'}`, margin, y); y += 5;
    doc.text(`Período Analisado: ${rtiData.periodoAnalise || '—'}`, margin, y); y += 10;

    // Resumo Executivo
    if (rtiData.resumoExecutivo) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Introdução / Resumo Executivo', margin, y); y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(rtiData.resumoExecutivo, pageWidth - margin * 2);
      doc.text(lines, margin, y); y += lines.length * 4.5 + 6;
    }

    // Metodologia
    if (rtiData.metodologia) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Metodologia', margin, y); y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(rtiData.metodologia, pageWidth - margin * 2);
      doc.text(lines, margin, y); y += lines.length * 4.5 + 6;
    }

    // Oportunidades table
    if (rtiData.oportunidades.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Oportunidades Identificadas', margin, y); y += 6;
      autoTable(doc, {
        startY: y,
        head: [['Descrição', 'Classificação', 'Valor Apurado (R$)']],
        body: [
          ...rtiData.oportunidades.map((op: any) => [
            op.descricao,
            op.classificacao === 'pacificado' ? 'Pacificado' : 'Não Pacificado',
            formatCurrency(op.valorApurado),
          ]),
          ['Somatório Bruto', '', formatCurrency(rtiData.totalOportunidades)],
          ['Total Pacificado', '', formatCurrency(rtiData.totalPacificado)],
          ['Total Não Pacificado', '', formatCurrency(rtiData.totalNaoPacificado)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Cenário Compensação
    if (rtiData.cenario.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Cenário de Compensação', margin, y); y += 6;
      autoTable(doc, {
        startY: y,
        head: [['Tributo', 'Média Mensal (R$)']],
        body: rtiData.cenario.map((c: any) => [c.tributo, formatCurrency(c.mediaMensal)]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Alertas
    if (rtiData.alertas.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações / Alertas', margin, y); y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      rtiData.alertas.forEach((a: any) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`• [${a.tipo?.toUpperCase() || 'OBS'}] ${a.texto}`, margin, y);
        y += 5;
      });
      y += 5;
    }

    // Conclusão
    if (rtiData.conclusao) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Conclusão', margin, y); y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(rtiData.conclusao, pageWidth - margin * 2);
      doc.text(lines, margin, y); y += lines.length * 4.5 + 6;
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`EVOX FISCAL — RTI — Página ${i}/${totalPages}`, margin, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    return doc;
  };

  // View existing RTI history
  const handleViewRti = async (task: any) => {
    setSelectedTask(task);
    setRtiHistoryTaskId(task.id);
    setRtiHistoryDialogOpen(true);
    setComparingRtis(null);
  };

  // Download RTI as PDF
  const handleDownloadRtiPdf = async () => {
    try {
      const doc = await generateRtiPdf({
        clienteNome: selectedTask?.clienteNome || '—',
        clienteCnpj: selectedTask?.clienteCnpj || '—',
        periodoAnalise: rtiForm.periodoAnalise,
        resumoExecutivo: rtiForm.resumoExecutivo,
        metodologia: rtiForm.metodologia,
        conclusao: rtiForm.conclusao,
        observacoes: rtiForm.observacoes,
        oportunidades,
        cenario: cenarioCompensacao,
        alertas,
        totalOportunidades,
        totalPacificado,
        totalNaoPacificado,
      });
      doc.save(`RTI_${selectedTask?.clienteNome || 'Cliente'}_${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '-')}.pdf`);
      toast.success('PDF do RTI baixado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao gerar PDF: ' + (err.message || ''));
    }
  };

  const addOportunidade = () => {
    setShowTeseSelector(true);
  };

  const addOportunidadeManual = () => {
    setOportunidades(prev => [...prev, {
      descricao: '',
      classificacao: 'pacificado',
      valorApurado: 0,
      ordem: prev.length,
    }]);
    setShowTeseSelector(false);
  };

  const removeOportunidade = (idx: number) => {
    setOportunidades(prev => prev.filter((_, i) => i !== idx));
  };

  const updateOportunidade = (idx: number, field: string, value: any) => {
    setOportunidades(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const addAlerta = () => {
    setAlertas(prev => [...prev, { tipo: 'observacao', texto: '', ordem: prev.length }]);
  };

  const totalOportunidades = useMemo(() => {
    return oportunidades.reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
  }, [oportunidades]);

  const totalPacificado = useMemo(() => {
    return oportunidades.filter(o => o.classificacao === 'pacificado').reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
  }, [oportunidades]);

  const totalNaoPacificado = useMemo(() => {
    return oportunidades.filter(o => o.classificacao === 'nao_pacificado').reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
  }, [oportunidades]);

  const handleSaveRti = async () => {
    if (!selectedTask) return;
    try {
      const rti = await createRti.mutateAsync({
        caseId: selectedTask.caseId || 0,
        clienteId: selectedTask.clienteId,
        taskId: selectedTask.id,
        tesesAnalisadas: oportunidades.map(op => ({
          descricao: op.descricao,
          classificacao: op.classificacao,
          valorApurado: parseFloat(op.valorApurado) || 0,
          teseId: op.teseId,
        })),
        periodoAnalise: rtiForm.periodoAnalise,
        resumoExecutivo: rtiForm.resumoExecutivo,
        metodologia: rtiForm.metodologia,
        conclusao: rtiForm.conclusao,
        observacoes: rtiForm.observacoes,
        valorTotalEstimado: totalOportunidades.toFixed(2),
      } as any);

      const rtiId = (rti as any)?.id;
      if (rtiId) {
        // Save oportunidades
        for (const op of oportunidades) {
          await createOportunidade.mutateAsync({ ...op, rtiId, valorApurado: parseFloat(op.valorApurado) || 0 });
        }
        // Save cenário compensação
        await upsertCenario.mutateAsync({
          rtiId,
          items: cenarioCompensacao.map((c, i) => ({ ...c, mediaMensal: parseFloat(c.mediaMensal) || 0, ordem: i })),
        });
        // Save alertas
        if (alertas.length > 0) {
          await upsertAlertas.mutateAsync({
            rtiId,
            items: alertas.map((a, i) => ({ ...a, ordem: i })),
          });
        }
      }

      // Auto-generate and download PDF
      try {
        const doc = await generateRtiPdf({
          clienteNome: selectedTask?.clienteNome || '—',
          clienteCnpj: selectedTask?.clienteCnpj || '—',
          periodoAnalise: rtiForm.periodoAnalise,
          resumoExecutivo: rtiForm.resumoExecutivo,
          metodologia: rtiForm.metodologia,
          conclusao: rtiForm.conclusao,
          observacoes: rtiForm.observacoes,
          oportunidades,
          cenario: cenarioCompensacao,
          alertas,
          totalOportunidades,
          totalPacificado,
          totalNaoPacificado,
          numero: `RTI-${rtiId || ''}`,
        });
        doc.save(`RTI_${selectedTask?.clienteNome || 'Cliente'}_${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '-')}.pdf`);
      } catch (pdfErr) {
        console.warn('PDF auto-download failed:', pdfErr);
      }

      toast.success('RTI criado e PDF salvo com sucesso!');
      setRtiDialogOpen(false);
      refetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar RTI');
    }
  };

  // ===== Checklist =====
  const handleOpenChecklist = (task: any) => {
    setChecklistTask(task);
    setChecklistDialogOpen(true);
  };

  // ===== Partner Return =====
  const handleOpenRetornoDialog = (returnItem?: any) => {
    if (returnItem) {
      setRetornoForm(returnItem);
    } else {
      setRetornoForm({});
    }
    setRetornoDialogOpen(true);
  };

  const handleUpdateRetorno = async (id: number, status: string, obs?: string, motivo?: string, valor?: number) => {
    try {
      await updatePartnerReturn.mutateAsync({
        id,
        retornoStatus: status,
        retornoObservacao: obs,
        motivoNaoFechamento: motivo,
        valorContratado: valor,
      });
      toast.success('Retorno atualizado!');
      refetchReturns();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar retorno');
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
      <TarefasAtrasadasBanner fila="apuracao" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Apuração</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Calculator className="w-6 h-6" />
            Fila de Apuração
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Geração de RTI, acompanhamento de SLA e gestão de retorno dos parceiros.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fila" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Fila de Tarefas
          </TabsTrigger>
          <TabsTrigger value="retornos" className="gap-2">
            <Handshake className="w-4 h-4" />
            Retorno Parceiros
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* ===== FILA TAB ===== */}
        <TabsContent value="fila" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-gray-700' },
              { label: 'A Fazer', value: stats.aFazer, color: 'text-amber-600' },
              { label: 'Fazendo', value: stats.fazendo, color: 'text-blue-600' },
              { label: 'Feito (RTI Gerado)', value: stats.feito, color: 'text-purple-600' },
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
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por código, cliente, parceiro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="a_fazer">A Fazer</SelectItem>
                  <SelectItem value="fazendo">Fazendo</SelectItem>
                  <SelectItem value="feito">Feito</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                <Filter className="w-4 h-4" />
                Filtros
                {(parceiroFilter !== 'all' || teseFilter !== 'all' || dateFrom || dateTo || procuracaoFilter !== 'all' || tipoClienteFilter !== 'all' || slaStatusFilter !== 'all' || viabilidadeFilter !== 'all') && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                    {[parceiroFilter !== 'all', teseFilter !== 'all', dateFrom, dateTo, procuracaoFilter !== 'all', tipoClienteFilter !== 'all', slaStatusFilter !== 'all', viabilidadeFilter !== 'all'].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>
            {showAdvancedFilters && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Parceiro</label>
                      <Select value={parceiroFilter} onValueChange={setParceiroFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Parceiros</SelectItem>
                          {(parceirosData as any[] || []).map((p: any) => (
                            <SelectItem key={p.id} value={p.nomeCompleto || p.nome}>{p.nomeCompleto || p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Tese/Tributo</label>
                      <Select value={teseFilter} onValueChange={setTeseFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as Teses</SelectItem>
                          {(allTeses as any[] || []).map((t: any) => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Procuração</label>
                      <Select value={procuracaoFilter} onValueChange={setProcuracaoFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="habilitada">Habilitada</SelectItem>
                          <SelectItem value="prox_vencimento">Próx. Vencimento</SelectItem>
                          <SelectItem value="vencida">Vencida</SelectItem>
                          <SelectItem value="sem">Sem Procuração</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Tipo Cliente</label>
                      <Select value={tipoClienteFilter} onValueChange={setTipoClienteFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Status SLA</label>
                      <Select value={slaStatusFilter} onValueChange={setSlaStatusFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="dentro_prazo">No Prazo</SelectItem>
                          <SelectItem value="atencao">Perto do Vencimento</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Viabilidade</label>
                      <Select value={viabilidadeFilter} onValueChange={setViabilidadeFilter}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="viavel">Viável (≥ R$ 20 mil)</SelectItem>
                          <SelectItem value="inviavel">Inviável (&lt; R$ 20 mil)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Data Início</label>
                      <Input type="date" className="h-9 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Data Fim</label>
                      <Input type="date" className="h-9 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                  </div>
                  {(parceiroFilter !== 'all' || teseFilter !== 'all' || dateFrom || dateTo || procuracaoFilter !== 'all' || tipoClienteFilter !== 'all' || slaStatusFilter !== 'all' || viabilidadeFilter !== 'all') && (
                    <div className="flex justify-end mt-3">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setParceiroFilter('all'); setTeseFilter('all'); setDateFrom(''); setDateTo(''); setProcuracaoFilter('all'); setTipoClienteFilter('all'); setSlaStatusFilter('all'); setViabilidadeFilter('all'); }}>
                        Limpar Filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Task List */}
          <Card>
            <CardContent className="p-0">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">Nenhuma tarefa de apuração encontrada.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px]">Código</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Cliente</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px] text-center">Tipo</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px]">Parceiro</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[110px] text-center">Procuração</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[90px]">Status</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[180px]">SLA</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Responsável</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-[120px]">RTI</th>
                        <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-[140px]">Fluxo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTasks.map((task: any) => {
                        const statusInfo = STATUS_LABELS[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-800' };
                        const slaStatus = task.slaStatus || 'dentro_prazo';
                        const hasRti = (task.rtiCount && Number(task.rtiCount) > 0);
                        const procStatus = task.procuracaoStatus || 'sem';
                        return (
                          <tr key={task.id} className={cn('hover:bg-muted/30 transition-colors', slaStatus === 'vencido' && 'bg-red-50/50 dark:bg-red-950/20', slaStatus === 'atencao' && 'bg-amber-50/50 dark:bg-amber-950/20')}>
                            {/* Código do Cliente */}
                            <td className="px-3 py-3">
                              <span className="font-mono text-sm font-bold text-primary">{task.clienteCodigo || '—'}</span>
                            </td>
                            {/* Cliente (Razão Social + CNPJ) */}
                            <td className="px-3 py-3">
                              <p className="text-sm font-semibold text-foreground truncate max-w-[250px]">{task.clienteNome || '—'}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{task.clienteCnpj || ''}</p>
                            </td>
                            {/* Tipo: Novo ou Base */}
                            <td className="px-3 py-3 text-center">
                              {task.clienteClassificacao === 'novo' ? (
                                <Badge className="text-[10px] bg-blue-100 text-blue-800 gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Novo
                                </Badge>
                              ) : (
                                <Badge className="text-[10px] bg-slate-100 text-slate-700 gap-1">
                                  <Building2 className="w-3 h-3" />
                                  Base
                                </Badge>
                              )}
                            </td>
                            {/* Parceiro */}
                            <td className="px-3 py-3">
                              {task.parceiroNome ? (
                                <div className="flex items-center gap-1.5">
                                  <Handshake className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{task.parceiroNome}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Sem parceiro</span>
                              )}
                            </td>
                            {/* Procuração */}
                            <td className="px-3 py-3 text-center">
                              {procStatus === 'habilitada' ? (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  Habilitada
                                </Badge>
                              ) : procStatus === 'prox_vencimento' ? (
                                <Badge className="text-[10px] bg-amber-100 text-amber-800 gap-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  Vencendo
                                </Badge>
                              ) : procStatus === 'vencida' ? (
                                <Badge variant="destructive" className="text-[10px] gap-1">
                                  <ShieldOff className="w-3 h-3" />
                                  Vencida
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                                  <ShieldOff className="w-3 h-3" />
                                  Sem
                                </Badge>
                              )}
                            </td>
                            {/* Status */}
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1">
                                <Badge className={cn('text-xs', statusInfo.color)}>{statusInfo.label}</Badge>
                                {(task.status === 'feito' || task.status === 'concluido') && task.viabilidade && (
                                  <Badge className={cn('text-[10px] gap-1 w-fit', task.viabilidade === 'viavel' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                                    {task.viabilidade === 'viavel' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {task.viabilidade === 'viavel' ? 'Viável' : 'Inviável'}
                                    {task.valorGlobalApurado ? ` (R$ ${Number(task.valorGlobalApurado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : ''}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            {/* SLA */}
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-0.5">
                                {slaStatus === 'vencido' ? (
                                  <Badge variant="destructive" className="text-[10px] gap-1 w-fit"><AlertTriangle className="w-3 h-3" />Vencido</Badge>
                                ) : slaStatus === 'atencao' ? (
                                  <Badge className="text-[10px] bg-amber-100 text-amber-800 gap-1 w-fit"><Clock className="w-3 h-3" />Atenção</Badge>
                                ) : (
                                  <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-1 w-fit"><CheckCircle className="w-3 h-3" />No Prazo</Badge>
                                )}
                                <div className="text-[11px] text-muted-foreground space-y-0">
                                  <p>Início: <span className="font-medium text-foreground">{formatDate(task.dataInicio || task.createdAt)}</span></p>
                                  <p>Fim: <span className={cn('font-medium', slaStatus === 'vencido' ? 'text-red-600' : slaStatus === 'atencao' ? 'text-amber-600' : 'text-foreground')}>{task.dataFimPrevista ? formatDate(task.dataFimPrevista) : '—'}</span></p>
                                </div>
                              </div>
                            </td>
                            {/* Responsável (Apelido) */}
                            <td className="px-3 py-3">
                              {(task.responsavelApelido || task.responsavelNome) ? (
                                <div className="flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="text-sm font-medium text-foreground truncate">{task.responsavelApelido || task.responsavelNome}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Não atribuído</span>
                              )}
                            </td>
                            {/* RTI */}
                            <td className="px-3 py-3 text-center">
                              {hasRti ? (
                                <Button variant="default" size="sm" className="h-7 px-2.5 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={() => handleViewRti(task)} title="Baixar RTI">
                                  <Download className="w-3.5 h-3.5" />
                                  Baixar
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Não disponível</span>
                              )}
                            </td>
                            {/* Fluxo */}
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1 items-center">
                                {task.status === 'a_fazer' && (
                                  <Button variant="default" size="sm" className="h-7 px-2.5 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full" onClick={() => handleAssumeTask(task)} disabled={assumeTask.isPending}>
                                    {assumeTask.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                    Pegar
                                  </Button>
                                )}
                                {task.status === 'fazendo' && (
                                  <Button variant="default" size="sm" className="h-7 px-2.5 text-xs gap-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold w-full" onClick={() => handleOpenFinishDialog(task)} disabled={finishTask.isPending}>
                                    <Flag className="w-3 h-3" />
                                    Finalizar
                                  </Button>
                                )}
                                {task.status === 'feito' && (
                                  <Button variant="default" size="sm" className="h-7 px-2.5 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full" onClick={() => handleCompleteAndMove(task)} disabled={completeAndMove.isPending}>
                                    {completeAndMove.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                    Concluir
                                  </Button>
                                )}
                                {task.status === 'concluido' && (
                                  <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Concluído
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== RETORNO PARCEIROS TAB ===== */}
        <TabsContent value="retornos" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total Enviados', value: partnerReturnStats?.total || 0, color: 'text-gray-700' },
              { label: 'Aguardando', value: partnerReturnStats?.aguardando || 0, color: 'text-amber-600' },
              { label: 'Fechou', value: partnerReturnStats?.fechou || 0, color: 'text-emerald-600' },
              { label: 'Não Fechou', value: partnerReturnStats?.naoFechou || 0, color: 'text-red-600' },
              { label: 'Em Negociação', value: partnerReturnStats?.emNegociacao || 0, color: 'text-blue-600' },
              { label: 'SLA Vencido', value: partnerReturnStats?.slaVencido || 0, color: 'text-red-700' },
              { label: 'Valor Contratado', value: formatCurrency(partnerReturnStats?.valorTotalContratado || 0), color: 'text-emerald-700', isText: true },
            ].map((s: any) => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <p className={cn('text-lg font-bold', s.color)}>{s.isText ? s.value : s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Partner Returns List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Handshake className="w-5 h-5" />
                Gestão de Retorno dos Parceiros (Comercial)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!partnerReturns || (partnerReturns as any[]).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">Nenhum RTI enviado a parceiros ainda.</p>
                  <p className="text-xs mt-1">Gere um RTI e envie ao parceiro para iniciar o acompanhamento.</p>
                </div>
              ) : (
                <div className="divide-y">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-1">RTI</div>
                    <div className="col-span-2">Cliente</div>
                    <div className="col-span-2">Parceiro</div>
                    <div className="col-span-1">Valor RTI</div>
                    <div className="col-span-1">Enviado</div>
                    <div className="col-span-1">SLA Vence</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Valor Contratado</div>
                    <div className="col-span-2 text-center">Ações</div>
                  </div>
                  {(partnerReturns as any[]).map((pr: any) => {
                    const statusInfo = RETORNO_STATUS_LABELS[pr.retornoStatus] || { label: pr.retornoStatus, color: 'bg-gray-100 text-gray-800' };
                    const slaVencido = pr.retornoStatus === 'aguardando' && new Date(pr.slaVenceEm) < new Date();
                    return (
                      <div key={pr.id} className={cn('grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center text-sm', slaVencido && 'bg-red-50/50')}>
                        <div className="col-span-1">
                          <span className="font-mono text-xs">{pr.rtiNumero || `#${pr.rtiId}`}</span>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <p className="text-xs font-medium truncate">{pr.clienteNome || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{pr.clienteCnpj || ''}</p>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <p className="text-xs truncate">{pr.parceiroNome || '—'}</p>
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs font-medium">{formatCurrency(pr.valorRti)}</span>
                        </div>
                        <div className="col-span-1">
                          <span className="text-[10px] text-muted-foreground">{formatDate(pr.enviadoEm)}</span>
                        </div>
                        <div className="col-span-1">
                          <span className={cn('text-[10px]', slaVencido ? 'text-red-600 font-bold' : 'text-muted-foreground')}>
                            {formatDate(pr.slaVenceEm)}
                            {slaVencido && ' ⚠️'}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <Badge className={cn('text-[10px]', statusInfo.color)}>{statusInfo.label}</Badge>
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs">{pr.valorContratado ? formatCurrency(pr.valorContratado) : '—'}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1 justify-center">
                          {pr.retornoStatus === 'aguardando' && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600" onClick={() => handleUpdateRetorno(pr.id, 'fechou')}>
                                Fechou
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600" onClick={() => handleUpdateRetorno(pr.id, 'em_negociacao')}>
                                Negociando
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600" onClick={() => handleUpdateRetorno(pr.id, 'nao_fechou')}>
                                Não Fechou
                              </Button>
                            </>
                          )}
                          {pr.retornoStatus === 'em_negociacao' && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600" onClick={() => handleUpdateRetorno(pr.id, 'fechou')}>
                                Fechou
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600" onClick={() => handleUpdateRetorno(pr.id, 'nao_fechou')}>
                                Não Fechou
                              </Button>
                            </>
                          )}
                          {(pr.retornoStatus === 'fechou' || pr.retornoStatus === 'nao_fechou') && (
                            <span className="text-[10px] text-muted-foreground">Finalizado</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== RELATÓRIOS TAB ===== */}
        <TabsContent value="relatorios" className="space-y-4">
          <ApuracaoRelatorios />
        </TabsContent>
      </Tabs>

      {/* ===== RTI GENERATION DIALOG ===== */}
      <Dialog open={rtiDialogOpen} onOpenChange={setRtiDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gerar RTI — Relatório Técnico Inicial
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedTask?.titulo} — {selectedTask?.clienteNome || 'Cliente'}
            </p>
          </DialogHeader>

          <Tabs value={rtiTab} onValueChange={setRtiTab} className="w-full">
            <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1">
              <TabsTrigger value="checklist" className="text-xs">Checklist por Tese</TabsTrigger>
              <TabsTrigger value="dados" className="text-xs">Dados Gerais</TabsTrigger>
              <TabsTrigger value="oportunidades" className="text-xs">Oportunidades</TabsTrigger>
              <TabsTrigger value="cenario" className="text-xs">Cenário Compensação</TabsTrigger>
              <TabsTrigger value="alertas" className="text-xs">Alertas</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
            </TabsList>

            {/* CHECKLIST POR TESE - Passo a passo para o operador/analista */}
            <TabsContent value="checklist" className="space-y-4 mt-4">
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Checklist de Apuração por Tese
                </h3>
                <p className="text-xs text-muted-foreground">
                  Passo a passo de como deve ser executada a apuração de cada tese vinculada a esta tarefa.
                </p>
              </div>
              {selectedTask && <TeseChecklistContent taskId={selectedTask.id} />}
            </TabsContent>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Período Analisado</Label>
                  <Input placeholder="Ex: 01/2020 a 12/2024" value={rtiForm.periodoAnalise} onChange={(e) => setRtiForm(prev => ({ ...prev, periodoAnalise: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Texto Introdutório / Resumo Executivo</Label>
                <Textarea rows={4} placeholder="A EVOX FISCAL LTDA, empresa especializada em consultoria tributária..." value={rtiForm.resumoExecutivo} onChange={(e) => setRtiForm(prev => ({ ...prev, resumoExecutivo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Metodologia</Label>
                <Textarea rows={3} placeholder="Descreva a metodologia utilizada na análise..." value={rtiForm.metodologia} onChange={(e) => setRtiForm(prev => ({ ...prev, metodologia: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Conclusão</Label>
                <Textarea rows={3} placeholder="Conclusão da análise técnica..." value={rtiForm.conclusao} onChange={(e) => setRtiForm(prev => ({ ...prev, conclusao: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea rows={3} placeholder="Observações adicionais..." value={rtiForm.observacoes} onChange={(e) => setRtiForm(prev => ({ ...prev, observacoes: e.target.value }))} />
              </div>
            </TabsContent>

            <TabsContent value="oportunidades" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Oportunidades Identificadas</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={addOportunidade}>
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Tese Selector Dropdown */}
              {showTeseSelector && (
                <Card className="border-2 border-primary/30">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Selecione uma tese do banco:</p>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowTeseSelector(false)}>Fechar</Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {(allTeses as any[] || []).filter((t: any) => t.ativa).map((tese: any) => {
                        const alreadyAdded = oportunidades.some(o => o.teseId === tese.id);
                        return (
                          <div key={tese.id} className={cn('flex items-center justify-between p-2 rounded hover:bg-muted/50 text-sm cursor-pointer', alreadyAdded && 'opacity-50')} onClick={() => !alreadyAdded && addOportunidadeFromTese(tese)}>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{tese.nome}</p>
                              <p className="text-xs text-muted-foreground">{tese.tributoEnvolvido} • {tese.classificacao}</p>
                            </div>
                            {alreadyAdded ? (
                              <Badge variant="secondary" className="text-[10px] shrink-0">Já adicionada</Badge>
                            ) : (
                              <Plus className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                        );
                      })}
                      {(!allTeses || (allTeses as any[]).length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-2">Nenhuma tese cadastrada no banco.</p>
                      )}
                    </div>
                    <Separator />
                    <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={addOportunidadeManual}>
                      <Plus className="w-3 h-3" />
                      Adicionar manualmente
                    </Button>
                  </CardContent>
                </Card>
              )}

              {oportunidades.length === 0 && !showTeseSelector ? (
                <div className="p-6 text-center text-muted-foreground border rounded-lg border-dashed">
                  <p className="text-sm">Nenhuma oportunidade adicionada.</p>
                  <p className="text-xs mt-1">As teses selecionadas na criação da tarefa são preenchidas automaticamente.</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={addOportunidade}>
                    <Plus className="w-4 h-4" />
                    Adicionar Oportunidade
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {oportunidades.map((op, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1">
                          <Label className="text-xs">Descrição</Label>
                          <Input placeholder="Ex: PIS/COFINS Monofásico" value={op.descricao} onChange={(e) => updateOportunidade(idx, 'descricao', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Classificação</Label>
                          <Select value={op.classificacao} onValueChange={(v) => updateOportunidade(idx, 'classificacao', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pacificado">Pacificado</SelectItem>
                              <SelectItem value="nao_pacificado">Não Pacificado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor Apurado (R$)</Label>
                          <Input type="number" step="0.01" value={op.valorApurado} onChange={(e) => updateOportunidade(idx, 'valorApurado', e.target.value)} />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 mt-5" onClick={() => removeOportunidade(idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {oportunidades.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Somatório Bruto</p>
                        <p className="text-lg font-bold">{formatCurrency(totalOportunidades)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Pacificado</p>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPacificado)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Não Pacificado</p>
                        <p className="text-lg font-bold text-amber-600">{formatCurrency(totalNaoPacificado)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cenario" className="space-y-4 mt-4">
              <h3 className="font-medium">Cenário de Compensação</h3>
              <p className="text-sm text-muted-foreground">Média mensal de tributos pagos para cálculo do cenário de compensação.</p>
              <div className="space-y-3">
                {cenarioCompensacao.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Input className="flex-1" value={item.tributo} onChange={(e) => {
                      const updated = [...cenarioCompensacao];
                      updated[idx] = { ...updated[idx], tributo: e.target.value };
                      setCenarioCompensacao(updated);
                    }} />
                    <div className="w-48">
                      <Input type="number" step="0.01" placeholder="Média Mensal (R$)" value={item.mediaMensal} onChange={(e) => {
                        const updated = [...cenarioCompensacao];
                        updated[idx] = { ...updated[idx], mediaMensal: e.target.value };
                        setCenarioCompensacao(updated);
                      }} />
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setCenarioCompensacao(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setCenarioCompensacao(prev => [...prev, { tributo: '', mediaMensal: 0 }])}>
                  <Plus className="w-4 h-4" />
                  Adicionar Tributo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="alertas" className="space-y-4 mt-4">
              <h3 className="font-medium">Observações e Alertas</h3>
              <p className="text-sm text-muted-foreground">Alertas importantes para o cliente, como subvenções, incompatibilidades, travas do e-Social, etc.</p>
              <div className="space-y-3">
                {alertas.map((alerta, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Select value={alerta.tipo} onValueChange={(v) => {
                          const updated = [...alertas];
                          updated[idx] = { ...updated[idx], tipo: v };
                          setAlertas(updated);
                        }}>
                          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="observacao">Observação</SelectItem>
                            <SelectItem value="alerta">Alerta</SelectItem>
                            <SelectItem value="incompatibilidade">Incompatibilidade</SelectItem>
                            <SelectItem value="subvencao">Subvenção</SelectItem>
                            <SelectItem value="trava_esocial">Trava e-Social</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea rows={2} placeholder="Texto do alerta..." value={alerta.texto} onChange={(e) => {
                        const updated = [...alertas];
                        updated[idx] = { ...updated[idx], texto: e.target.value };
                        setAlertas(updated);
                      }} />
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setAlertas(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-1" onClick={addAlerta}>
                  <Plus className="w-4 h-4" />
                  Adicionar Alerta
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card className="bg-white border-2">
                <CardContent className="p-6 space-y-6">
                  {/* RTI Preview */}
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-gray-900">RTI — RELATÓRIO TÉCNICO INICIAL</h2>
                    <p className="text-sm text-gray-600">Análise de possíveis oportunidades de recuperação de créditos tributários</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Razão Social:</span> {selectedTask?.clienteNome || '—'}</div>
                    <div><span className="font-medium">CNPJ:</span> {selectedTask?.clienteCnpj || '—'}</div>
                    <div><span className="font-medium">Período Analisado:</span> {rtiForm.periodoAnalise || '—'}</div>
                    <div><span className="font-medium">Data:</span> {new Date().toLocaleDateString('pt-BR')}</div>
                  </div>
                  {rtiForm.resumoExecutivo && (
                    <div>
                      <h3 className="font-medium text-sm mb-1">Introdução</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{rtiForm.resumoExecutivo}</p>
                    </div>
                  )}
                  {oportunidades.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-2">Oportunidades Identificadas</h3>
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Descrição</th>
                            <th className="border p-2 text-center">Classificação</th>
                            <th className="border p-2 text-right">Valor Apurado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oportunidades.map((op, idx) => (
                            <tr key={idx}>
                              <td className="border p-2">{op.descricao}</td>
                              <td className="border p-2 text-center">{op.classificacao === 'pacificado' ? 'Pacificado' : 'Não Pacificado'}</td>
                              <td className="border p-2 text-right">{formatCurrency(op.valorApurado)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td className="border p-2" colSpan={2}>Somatório Bruto</td>
                            <td className="border p-2 text-right">{formatCurrency(totalOportunidades)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {cenarioCompensacao.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-2">Cenário de Compensação</h3>
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Tributo</th>
                            <th className="border p-2 text-right">Média Mensal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cenarioCompensacao.map((c, idx) => (
                            <tr key={idx}>
                              <td className="border p-2">{c.tributo}</td>
                              <td className="border p-2 text-right">{formatCurrency(c.mediaMensal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {alertas.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-2">Observações / Alertas</h3>
                      <ul className="space-y-2">
                        {alertas.map((a, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>{a.texto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadRtiPdf}>
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRtiDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveRti} disabled={createRti.isPending} className="gap-2">
                {createRti.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Salvar RTI
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== RTI HISTORY DIALOG ===== */}
      <Dialog open={rtiHistoryDialogOpen} onOpenChange={setRtiHistoryDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] max-h-[92vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Histórico de RTIs — {selectedTask?.clienteNome || 'Tarefa'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedTask?.titulo} ({selectedTask?.codigo})
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {rtiHistoryTaskId && <RtiHistoryContent taskId={rtiHistoryTaskId} comparingRtis={comparingRtis} setComparingRtis={setComparingRtis} formatDate={formatDate} formatCurrency={formatCurrency} generateRtiPdf={generateRtiPdf} selectedTask={selectedTask} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist foi movido para a visão do operador/analista por tese */}

      {/* ===== FINISH TASK DIALOG ===== */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-purple-600" />
              Finalizar Análise
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {finishingTask?.codigo} — {finishingTask?.clienteNome || finishingTask?.titulo}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Observações */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações da Análise</Label>
              <Textarea
                placeholder="Descreva as conclusões da análise, pontos de atenção, etc."
                value={finishObs}
                onChange={(e) => setFinishObs(e.target.value)}
                rows={4}
              />
            </div>

            {/* Viabilidade */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Valor Global Apurado (R$)</Label>
              <Input
                placeholder="Ex: 25000.00"
                value={finishValorGlobal}
                onChange={(e) => {
                  setFinishValorGlobal(e.target.value);
                  // Auto-set viabilidade based on value
                  const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
                  if (!isNaN(val)) {
                    setFinishViabilidade(val >= 20000 ? 'viavel' : 'inviavel');
                  }
                }}
                type="number"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-muted-foreground">Somatório de todas as teses apuradas. Se não informado, será calculado automaticamente.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Viabilidade da Apuração</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={finishViabilidade === 'viavel' ? 'default' : 'outline'}
                  className={cn('flex-1 gap-2', finishViabilidade === 'viavel' && 'bg-emerald-600 hover:bg-emerald-700')}
                  onClick={() => setFinishViabilidade('viavel')}
                >
                  <CheckCircle className="w-4 h-4" />
                  Viável (≥ R$ 20 mil)
                </Button>
                <Button
                  type="button"
                  variant={finishViabilidade === 'inviavel' ? 'default' : 'outline'}
                  className={cn('flex-1 gap-2', finishViabilidade === 'inviavel' && 'bg-red-600 hover:bg-red-700')}
                  onClick={() => setFinishViabilidade('inviavel')}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Inviável (&lt; R$ 20 mil)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Se não selecionado, será calculado automaticamente com base no valor global.</p>
            </div>

            <Separator />

            {/* Anexos */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Anexar Documentos (Memória de Cálculo, etc.)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="finish-file-upload"
                  accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
                />
                <label htmlFor="finish-file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar arquivos</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Excel, Word, Imagens</p>
                </label>
                {uploadingFile && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs text-muted-foreground">Enviando...</span>
                  </div>
                )}
              </div>
              {finishAnexos.length > 0 && (
                <div className="space-y-2 mt-2">
                  {finishAnexos.map((anexo, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{anexo.nome}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => setFinishAnexos(prev => prev.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleFinishTask} disabled={finishTask.isPending} className="gap-2 bg-purple-600 hover:bg-purple-700">
              {finishTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              Finalizar Análise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== CHECKLIST COMPONENT =====
function ChecklistContent({ taskId, fila, templates }: { taskId: number; fila: string; templates: any[] }) {
  const { data: instance, refetch } = trpc.creditRecovery.admin.checklists.getInstance.useQuery({ taskId }, { enabled: !!taskId });
  const createInstance = trpc.creditRecovery.admin.checklists.createInstance.useMutation();
  const updateInstance = trpc.creditRecovery.admin.checklists.updateInstance.useMutation();

  const [items, setItems] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (instance && !initialized) {
    try {
      const parsed = typeof instance.itens === 'string' ? JSON.parse(instance.itens) : instance.itens;
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {}
    setInitialized(true);
  }

  const handleInitFromTemplate = async (template: any) => {
    try {
      const itens = typeof template.itens === 'string' ? JSON.parse(template.itens) : template.itens;
      const formattedItems = (itens || []).map((item: any, idx: number) => ({
        id: idx,
        texto: typeof item === 'string' ? item : item.texto || item.label || '',
        concluido: false,
        concluidoEm: null,
        concluidoPor: null,
      }));
      await createInstance.mutateAsync({ taskId, templateId: template.id, fila, nome: template.nome, itens: formattedItems, progresso: 0 } as any);
      setItems(formattedItems);
      setInitialized(true);
      refetch();
      toast.success('Checklist iniciado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar checklist');
    }
  };

  const toggleItem = async (idx: number) => {
    if (!instance) return;
    const updated = items.map((item, i) => i === idx ? { ...item, concluido: !item.concluido, concluidoEm: !item.concluido ? new Date().toISOString() : null } : item);
    setItems(updated);
    const progresso = Math.round((updated.filter(i => i.concluido).length / updated.length) * 100);
    await updateInstance.mutateAsync({ id: (instance as any).id, itens: updated, progresso });
  };

  const progresso = items.length > 0 ? Math.round((items.filter(i => i.concluido).length / items.length) * 100) : 0;

  if (!instance && !initialized) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Selecione um template de checklist para iniciar:</p>
        {templates && templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map((t: any) => (
              <Button key={t.id} variant="outline" className="w-full justify-start gap-2" onClick={() => handleInitFromTemplate(t)}>
                <ClipboardList className="w-4 h-4" />
                {t.nome}
              </Button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground border rounded-lg border-dashed">
            <p className="text-sm">Nenhum template de checklist configurado para Apuração.</p>
            <p className="text-xs mt-1">O administrador pode criar templates em Configurações.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">{progresso}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${progresso}%` }} />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className={cn('flex items-start gap-3 p-3 border rounded-lg transition-colors', item.concluido && 'bg-emerald-50/50 border-emerald-200')}>
            <Checkbox checked={item.concluido} onCheckedChange={() => toggleItem(idx)} className="mt-0.5" />
            <div className="flex-1">
              <p className={cn('text-sm', item.concluido && 'line-through text-muted-foreground')}>{item.texto}</p>
              {item.concluidoEm && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Concluído em {new Date(item.concluidoEm).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== CHECKLIST POR TESE COMPONENT =====
function TeseChecklistContent({ taskId }: { taskId: number }) {
  const { data: taskTeses } = trpc.creditRecovery.admin.taskTeses.list.useQuery({ taskId }, { enabled: !!taskId });
  const { data: allTemplates } = trpc.creditRecovery.admin.checklists.templates.useQuery({ fila: 'apuracao' });
  const { data: instance, refetch } = trpc.creditRecovery.admin.checklists.getInstance.useQuery({ taskId }, { enabled: !!taskId });
  const createInstance = trpc.creditRecovery.admin.checklists.createInstance.useMutation();
  const updateInstance = trpc.creditRecovery.admin.checklists.updateInstance.useMutation();
  const [items, setItems] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Parse existing instance items
  if (instance && !initialized) {
    try {
      const parsed = typeof (instance as any).itens === 'string' ? JSON.parse((instance as any).itens) : (instance as any).itens;
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {}
    setInitialized(true);
  }

  const teses = (taskTeses as any[] || []);
  const templates = (allTemplates as any[] || []);

  // Group templates by tese
  const getTemplatesForTese = (teseId: number) => {
    return templates.filter(t => t.teseId === teseId || t.teseId === null);
  };

  // Initialize checklist from all tese templates combined
  const handleInitAll = async () => {
    try {
      let allItems: any[] = [];
      let itemIdx = 0;
      for (const tese of teses) {
        const teseTemplates = templates.filter(t => t.teseId === (tese as any).teseId);
        // If no specific template, use generic ones
        const useTemplates = teseTemplates.length > 0 ? teseTemplates : templates.filter(t => !t.teseId);
        for (const tmpl of useTemplates) {
          const tmplItems = typeof tmpl.itens === 'string' ? JSON.parse(tmpl.itens) : tmpl.itens;
          for (const item of (tmplItems || [])) {
            allItems.push({
              id: itemIdx++,
              teseId: (tese as any).teseId,
              teseNome: (tese as any).teseNome || (tese as any).nome || 'Tese',
              texto: typeof item === 'string' ? item : (item.titulo || item.texto || item.label || ''),
              descricao: typeof item === 'object' ? (item.descricao || '') : '',
              concluido: false,
              concluidoEm: null,
              concluidoPor: null,
            });
          }
        }
      }
      if (allItems.length === 0) {
        toast.error('Nenhum template de checklist encontrado para as teses desta tarefa.');
        return;
      }
      await createInstance.mutateAsync({
        taskId,
        templateId: null,
        fila: 'apuracao',
        nome: 'Checklist de Apuração por Tese',
        itens: allItems,
      } as any);
      setItems(allItems);
      setInitialized(true);
      refetch();
      toast.success('Checklist iniciado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar checklist');
    }
  };

  const toggleItem = async (idx: number) => {
    if (!instance) return;
    const updated = items.map((item, i) => i === idx ? { ...item, concluido: !item.concluido, concluidoEm: !item.concluido ? new Date().toISOString() : null } : item);
    setItems(updated);
    const progresso = Math.round((updated.filter(i => i.concluido).length / updated.length) * 100);
    await updateInstance.mutateAsync({ id: (instance as any).id, itens: updated, progresso });
  };

  const progresso = items.length > 0 ? Math.round((items.filter(i => i.concluido).length / items.length) * 100) : 0;

  if (!teses.length) {
    return (
      <div className="p-6 text-center text-muted-foreground border rounded-lg border-dashed">
        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma tese vinculada a esta tarefa.</p>
        <p className="text-xs mt-1">Vincule teses à tarefa para ver o checklist de apuração.</p>
      </div>
    );
  }

  if (!instance && !initialized) {
    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg border-dashed text-center space-y-3">
          <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum checklist iniciado para esta tarefa.</p>
          <p className="text-xs text-muted-foreground">O checklist será gerado com base nos templates configurados para cada tese.</p>
          <div className="space-y-2">
            <p className="text-xs font-medium">Teses vinculadas:</p>
            {teses.map((t: any) => {
              const teseTemplates = getTemplatesForTese(t.teseId);
              return (
                <div key={t.id} className="flex items-center justify-between text-xs px-3 py-2 bg-muted/50 rounded">
                  <span>{t.teseNome || t.nome || `Tese #${t.teseId}`}</span>
                  <Badge variant={teseTemplates.length > 0 ? 'default' : 'secondary'} className="text-[10px]">
                    {teseTemplates.length > 0 ? `${teseTemplates.length} template(s)` : 'Sem template'}
                  </Badge>
                </div>
              );
            })}
          </div>
          <Button onClick={handleInitAll} className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Iniciar Checklist
          </Button>
        </div>
      </div>
    );
  }

  // Group items by tese
  const groupedByTese = teses.reduce((acc: Record<string, any[]>, tese: any) => {
    const teseId = tese.teseId;
    const teseNome = tese.teseNome || tese.nome || `Tese #${teseId}`;
    acc[teseNome] = items.filter(item => item.teseId === teseId);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso Geral</span>
          <span className="font-semibold">{progresso}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div className={cn('rounded-full h-2.5 transition-all', progresso === 100 ? 'bg-emerald-500' : progresso >= 50 ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${progresso}%` }} />
        </div>
      </div>

      {/* Items grouped by tese */}
      <div className="space-y-4">
        {Object.entries(groupedByTese).map(([teseNome, teseItems]) => {
          const teseProgresso = teseItems.length > 0 ? Math.round((teseItems.filter((i: any) => i.concluido).length / teseItems.length) * 100) : 0;
          return (
            <Card key={teseNome}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    {teseNome}
                  </span>
                  <Badge variant={teseProgresso === 100 ? 'default' : 'secondary'} className={cn('text-[10px]', teseProgresso === 100 && 'bg-emerald-600')}>
                    {teseProgresso}%
                  </Badge>
                </CardTitle>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className={cn('rounded-full h-1.5 transition-all', teseProgresso === 100 ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${teseProgresso}%` }} />
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {teseItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Nenhum item de checklist para esta tese.</p>
                ) : (
                  teseItems.map((item: any) => {
                    const globalIdx = items.findIndex(i => i.id === item.id);
                    return (
                      <div key={item.id} className={cn('flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-muted/50', item.concluido && 'bg-emerald-50/50 dark:bg-emerald-950/20')} onClick={() => toggleItem(globalIdx)}>
                        <Checkbox checked={item.concluido} onCheckedChange={() => toggleItem(globalIdx)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm', item.concluido && 'line-through text-muted-foreground')}>{item.texto}</p>
                          {item.descricao && <p className="text-xs text-muted-foreground mt-0.5">{item.descricao}</p>}
                          {item.concluidoEm && (
                            <p className="text-[10px] text-emerald-600 mt-1">
                              Concluído em {new Date(item.concluidoEm).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ===== RELATÓRIOS COMPONENT =====
function ApuracaoRelatorios() {
  const { data: stats, isLoading } = trpc.creditRecovery.admin.apuracaoStats.useQuery({});

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const formatCurrency = (v: number | string) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats?.totalRtis || 0}</p>
            <p className="text-xs text-muted-foreground">RTIs Gerados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats?.totalClientes || 0}</p>
            <p className="text-xs text-muted-foreground">Clientes Analisados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.valorTotalApurado || 0)}</p>
            <p className="text-xs text-muted-foreground">Valor Total Apurado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats?.rtisEmitidos || 0}</p>
            <p className="text-xs text-muted-foreground">RTIs Emitidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Por Tese */}
      {stats?.porTese && (stats.porTese as any[]).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Valor Apurado por Tese</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                <div className="col-span-1">Tese</div>
                <div className="col-span-1">Classificação</div>
                <div className="col-span-1 text-center">Quantidade</div>
                <div className="col-span-1 text-right">Valor Total</div>
              </div>
              {(stats.porTese as any[]).map((t: any, idx: number) => (
                <div key={idx} className="grid grid-cols-4 gap-2 px-4 py-3 text-sm">
                  <div className="col-span-1 font-medium">{t.tese}</div>
                  <div className="col-span-1">
                    <Badge className={cn('text-[10px]', t.classificacao === 'pacificado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                      {t.classificacao === 'pacificado' ? 'Pacificado' : 'Não Pacificado'}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-center">{t.quantidade}</div>
                  <div className="col-span-1 text-right font-medium">{formatCurrency(t.valorTotal)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== RELATÓRIO DE VIABILIDADE ===== */}
      <Separator className="my-4" />
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Relatório de Viabilidade
      </h2>

      {/* Cards de Viabilidade */}
      {stats?.viabilidade && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{Number(stats.viabilidade.totalAvaliadas) || 0}</p>
              <p className="text-xs text-muted-foreground">Total Avaliadas</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{Number(stats.viabilidade.totalViavel) || 0}</p>
              <p className="text-xs text-muted-foreground">Viáveis</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{Number(stats.viabilidade.totalInviavel) || 0}</p>
              <p className="text-xs text-muted-foreground">Inviáveis</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.viabilidade.valorTotalViavel)}</p>
              <p className="text-xs text-muted-foreground">Valor Viável</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {Number(stats.viabilidade.totalAvaliadas) > 0
                  ? `${Math.round((Number(stats.viabilidade.totalViavel) / Number(stats.viabilidade.totalAvaliadas)) * 100)}%`
                  : '0%'}
              </p>
              <p className="text-xs text-muted-foreground">Taxa de Viabilidade</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Viabilidade por Tese */}
      {stats?.viabilidadePorTese && (stats.viabilidadePorTese as any[]).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Taxa de Viabilidade por Tese</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="grid grid-cols-7 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                <div className="col-span-2">Tese</div>
                <div className="col-span-1">Tributo</div>
                <div className="col-span-1 text-center">Viável</div>
                <div className="col-span-1 text-center">Inviável</div>
                <div className="col-span-1 text-center">Taxa</div>
                <div className="col-span-1 text-right">Valor Total</div>
              </div>
              {(stats.viabilidadePorTese as any[]).map((t: any, idx: number) => (
                <div key={idx} className="grid grid-cols-7 gap-2 px-4 py-3 text-sm items-center">
                  <div className="col-span-2 font-medium truncate">{t.teseNome}</div>
                  <div className="col-span-1 text-xs text-muted-foreground">{t.tributoEnvolvido}</div>
                  <div className="col-span-1 text-center">
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-800">{Number(t.viavel)}</Badge>
                  </div>
                  <div className="col-span-1 text-center">
                    <Badge className="text-[10px] bg-red-100 text-red-800">{Number(t.inviavel)}</Badge>
                  </div>
                  <div className="col-span-1 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Number(t.taxaViabilidade) || 0}%` }} />
                      </div>
                      <span className="text-xs font-medium">{Number(t.taxaViabilidade) || 0}%</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-right font-medium">{formatCurrency(t.valorTotal)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Viabilidade por Parceiro */}
      {stats?.viabilidadePorParceiro && (stats.viabilidadePorParceiro as any[]).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Taxa de Viabilidade por Parceiro</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                <div className="col-span-2">Parceiro</div>
                <div className="col-span-1 text-center">Viável</div>
                <div className="col-span-1 text-center">Inviável</div>
                <div className="col-span-1 text-center">Taxa</div>
                <div className="col-span-1 text-right">Valor Total</div>
              </div>
              {(stats.viabilidadePorParceiro as any[]).map((p: any, idx: number) => (
                <div key={idx} className="grid grid-cols-6 gap-2 px-4 py-3 text-sm items-center">
                  <div className="col-span-2 font-medium">{p.parceiroNome}</div>
                  <div className="col-span-1 text-center">
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-800">{Number(p.viavel)}</Badge>
                  </div>
                  <div className="col-span-1 text-center">
                    <Badge className="text-[10px] bg-red-100 text-red-800">{Number(p.inviavel)}</Badge>
                  </div>
                  <div className="col-span-1 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Number(p.taxaViabilidade) || 0}%` }} />
                      </div>
                      <span className="text-xs font-medium">{Number(p.taxaViabilidade) || 0}%</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-right font-medium">{formatCurrency(p.valorTotal)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Viabilidade por Mês */}
      {stats?.viabilidadePorMes && (stats.viabilidadePorMes as any[]).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Evolução Mensal da Viabilidade</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                <div className="col-span-1">Mês</div>
                <div className="col-span-1 text-center">Viável</div>
                <div className="col-span-1 text-center">Inviável</div>
                <div className="col-span-1 text-center">Total</div>
                <div className="col-span-1 text-center">Taxa</div>
                <div className="col-span-1 text-right">Valor Total</div>
              </div>
              {(stats.viabilidadePorMes as any[]).map((m: any, idx: number) => {
                const [year, month] = (m.mes || '').split('-');
                const mesLabel = month ? `${month}/${year}` : m.mes;
                return (
                  <div key={idx} className="grid grid-cols-6 gap-2 px-4 py-3 text-sm items-center">
                    <div className="col-span-1 font-medium">{mesLabel}</div>
                    <div className="col-span-1 text-center">
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-800">{Number(m.viavel)}</Badge>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge className="text-[10px] bg-red-100 text-red-800">{Number(m.inviavel)}</Badge>
                    </div>
                    <div className="col-span-1 text-center">{Number(m.total)}</div>
                    <div className="col-span-1 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Number(m.taxaViabilidade) || 0}%` }} />
                        </div>
                        <span className="text-xs font-medium">{Number(m.taxaViabilidade) || 0}%</span>
                      </div>
                    </div>
                    <div className="col-span-1 text-right font-medium">{formatCurrency(m.valorTotal)}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// ===== RTI HISTORY COMPONENT =====
function RtiHistoryContent({ taskId, comparingRtis, setComparingRtis, formatDate, formatCurrency, generateRtiPdf, selectedTask }: {
  taskId: number;
  comparingRtis: [any, any] | null;
  setComparingRtis: (v: [any, any] | null) => void;
  formatDate: (d: string) => string;
  formatCurrency: (v: number | string) => string;
  generateRtiPdf: (data: any) => Promise<any>;
  selectedTask: any;
}) {
  const { data: rtiHistory, isLoading } = trpc.creditRecovery.credito.rti.listByTask.useQuery({ taskId });
  const [selectedRtiId, setSelectedRtiId] = useState<number | null>(null);
  const { data: selectedRtiFull } = trpc.creditRecovery.credito.rti.getById.useQuery(
    { id: selectedRtiId! },
    { enabled: !!selectedRtiId }
  );
  const { data: selectedRtiOps } = trpc.creditRecovery.admin.rtiOportunidades.list.useQuery(
    { rtiId: selectedRtiId! },
    { enabled: !!selectedRtiId }
  );

  const trpcUtils = trpc.useUtils();

  const handleDownloadVersion = async (rti: any) => {
    try {
      // Load full RTI data including oportunidades, cenário and alertas from the backend
      const fullRti = await trpcUtils.creditRecovery.admin.rtiFull.fetch({ rtiId: rti.id });
      const oportunidades = (fullRti as any)?.oportunidades || [];
      const cenario = (fullRti as any)?.cenarioCompensacao || [];
      const alertas = (fullRti as any)?.alertas || [];

      // Calculate totals from oportunidades
      const totalOps = oportunidades.reduce((sum: number, o: any) => sum + (parseFloat(o.valorApurado) || 0), 0);
      const totalPac = oportunidades.filter((o: any) => o.classificacao === 'pacificado').reduce((sum: number, o: any) => sum + (parseFloat(o.valorApurado) || 0), 0);
      const totalNaoPac = oportunidades.filter((o: any) => o.classificacao === 'nao_pacificado').reduce((sum: number, o: any) => sum + (parseFloat(o.valorApurado) || 0), 0);

      // Use oportunidades from DB if available, otherwise fall back to tesesAnalisadas JSON
      const opsForPdf = oportunidades.length > 0 ? oportunidades.map((o: any) => ({
        descricao: o.descricao,
        classificacao: o.classificacao,
        valorApurado: parseFloat(o.valorApurado) || 0,
      })) : (rti.tesesAnalisadas ? (typeof rti.tesesAnalisadas === 'string' ? JSON.parse(rti.tesesAnalisadas) : rti.tesesAnalisadas) : []);

      const cenarioForPdf = cenario.map((c: any) => ({
        tributo: c.tributo,
        mediaMensal: parseFloat(c.mediaMensal) || 0,
      }));

      const alertasForPdf = alertas.map((a: any) => ({
        tipo: a.tipo,
        texto: a.texto,
      }));

      const doc = await generateRtiPdf({
        clienteNome: rti.clienteNome || selectedTask?.clienteNome || '—',
        clienteCnpj: rti.clienteCnpj || selectedTask?.clienteCnpj || '—',
        periodoAnalise: rti.periodoAnalise || (fullRti as any)?.periodoAnalise || '—',
        resumoExecutivo: rti.resumoExecutivo || (fullRti as any)?.resumoExecutivo || '',
        metodologia: rti.metodologia || (fullRti as any)?.metodologia || '',
        conclusao: rti.conclusao || (fullRti as any)?.conclusao || '',
        observacoes: rti.observacoes || (fullRti as any)?.observacoes || '',
        oportunidades: opsForPdf,
        cenario: cenarioForPdf,
        alertas: alertasForPdf,
        totalOportunidades: totalOps || parseFloat(rti.valorTotalEstimado) || 0,
        totalPacificado: totalPac,
        totalNaoPacificado: totalNaoPac,
        numero: rti.numero,
        data: formatDate(rti.createdAt),
      });
      doc.save(`${rti.numero}_v${rti.versao}_${formatDate(rti.createdAt).replace(/\//g, '-')}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast.error('Erro ao baixar PDF: ' + (err.message || ''));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rtis = (rtiHistory as any[]) || [];

  if (rtis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Nenhum RTI gerado para esta tarefa</p>
        <p className="text-sm mt-1">Clique em "Gerar RTI" na tabela para criar o primeiro relatório.</p>
      </div>
    );
  }

  // Comparison mode
  if (comparingRtis) {
    const [rtiA, rtiB] = comparingRtis;
    const parseField = (v: any) => typeof v === 'string' ? v : JSON.stringify(v) || '';
    const fields = [
      { label: 'Período Analisado', a: rtiA.periodoAnalise, b: rtiB.periodoAnalise },
      { label: 'Valor Total Estimado', a: formatCurrency(rtiA.valorTotalEstimado || 0), b: formatCurrency(rtiB.valorTotalEstimado || 0) },
      { label: 'Resumo Executivo', a: rtiA.resumoExecutivo || '—', b: rtiB.resumoExecutivo || '—' },
      { label: 'Metodologia', a: rtiA.metodologia || '—', b: rtiB.metodologia || '—' },
      { label: 'Conclusão', a: rtiA.conclusao || '—', b: rtiB.conclusao || '—' },
      { label: 'Status', a: rtiA.status, b: rtiB.status },
    ];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Comparando {rtiA.numero} (v{rtiA.versao}) vs {rtiB.numero} (v{rtiB.versao})</h3>
          <Button variant="outline" size="sm" onClick={() => setComparingRtis(null)}>Voltar</Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border-b p-3 text-left font-medium w-1/4">Campo</th>
                <th className="border-b p-3 text-left font-medium w-[37.5%]">{rtiA.numero} (v{rtiA.versao})</th>
                <th className="border-b p-3 text-left font-medium w-[37.5%]">{rtiB.numero} (v{rtiB.versao})</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, idx) => {
                const isDiff = parseField(f.a) !== parseField(f.b);
                return (
                  <tr key={idx} className={isDiff ? 'bg-amber-50' : ''}>
                    <td className="border-b p-3 font-medium text-muted-foreground">{f.label}</td>
                    <td className={cn('border-b p-3', isDiff && 'text-red-600')}>{f.a || '—'}</td>
                    <td className={cn('border-b p-3', isDiff && 'text-emerald-600')}>{f.b || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Detail view
  if (selectedRtiId && selectedRtiFull) {
    const rti = selectedRtiFull as any;
    const ops = (selectedRtiOps as any[]) || [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{rti.numero} — Versão {rti.versao}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownloadVersion(rti)}>
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedRtiId(null)}>Voltar</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium text-muted-foreground">Status:</span> <Badge className="ml-1">{rti.status}</Badge></div>
          <div><span className="font-medium text-muted-foreground">Valor Total:</span> {formatCurrency(rti.valorTotalEstimado || 0)}</div>
          <div><span className="font-medium text-muted-foreground">Período:</span> {rti.periodoAnalise || '—'}</div>
          <div><span className="font-medium text-muted-foreground">Criado em:</span> {formatDate(rti.createdAt)}</div>
          <div><span className="font-medium text-muted-foreground">Emitido por:</span> {rti.emitidoPorNome || '—'}</div>
        </div>
        {rti.resumoExecutivo && (
          <div>
            <h4 className="font-medium text-sm mb-1">Resumo Executivo</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rti.resumoExecutivo}</p>
          </div>
        )}
        {rti.metodologia && (
          <div>
            <h4 className="font-medium text-sm mb-1">Metodologia</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rti.metodologia}</p>
          </div>
        )}
        {ops.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Oportunidades ({ops.length})</h4>
            <table className="w-full text-sm border rounded">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border-b p-2 text-left">Descrição</th>
                  <th className="border-b p-2 text-center">Classificação</th>
                  <th className="border-b p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {ops.map((op: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border-b p-2">{op.descricao}</td>
                    <td className="border-b p-2 text-center">
                      <Badge className={cn('text-[10px]', op.classificacao === 'pacificado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                        {op.classificacao === 'pacificado' ? 'Pacificado' : 'Não Pacificado'}
                      </Badge>
                    </td>
                    <td className="border-b p-2 text-right">{formatCurrency(op.valorApurado || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rti.conclusao && (
          <div>
            <h4 className="font-medium text-sm mb-1">Conclusão</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rti.conclusao}</p>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rtis.length} versão(ões) encontrada(s)</p>
        {rtis.length >= 2 && (
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setComparingRtis([rtis[0], rtis[1]])}>
            <ArrowRight className="w-4 h-4" />
            Comparar últimas 2 versões
          </Button>
        )}
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="border-b p-3 text-left font-medium">Número</th>
              <th className="border-b p-3 text-center font-medium">Versão</th>
              <th className="border-b p-3 text-center font-medium">Status</th>
              <th className="border-b p-3 text-right font-medium">Valor Total</th>
              <th className="border-b p-3 text-left font-medium">Criado em</th>
              <th className="border-b p-3 text-left font-medium">Emitido por</th>
              <th className="border-b p-3 text-center font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rtis.map((rti: any) => (
              <tr key={rti.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedRtiId(rti.id)}>
                <td className="border-b p-3 font-medium text-primary">{rti.numero}</td>
                <td className="border-b p-3 text-center">
                  <Badge variant="outline">v{rti.versao}</Badge>
                </td>
                <td className="border-b p-3 text-center">
                  <Badge className={cn('text-[10px]',
                    rti.status === 'emitido' ? 'bg-emerald-100 text-emerald-800' :
                    rti.status === 'rascunho' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {rti.status === 'emitido' ? 'Emitido' : rti.status === 'rascunho' ? 'Rascunho' : rti.status}
                  </Badge>
                </td>
                <td className="border-b p-3 text-right font-medium">{formatCurrency(rti.valorTotalEstimado || 0)}</td>
                <td className="border-b p-3 text-muted-foreground">{formatDate(rti.createdAt)}</td>
                <td className="border-b p-3 text-muted-foreground">{rti.emitidoPorNome || '—'}</td>
                <td className="border-b p-3 text-center">
                  <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedRtiId(rti.id)} title="Visualizar">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleDownloadVersion(rti)} title="Baixar PDF">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
