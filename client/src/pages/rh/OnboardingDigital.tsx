import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, ClipboardList, CheckCircle2, Clock, XCircle, Trash2, Edit2,
  UserPlus, FileText, BookOpen, Key, Monitor, Users, MoreHorizontal,
  Play, ChevronDown, ChevronUp, AlertCircle, Loader2, ArrowLeft} from 'lucide-react';

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const CATEGORIA_ICONS: Record<string, any> = {
  documentos: FileText,
  treinamentos: BookOpen,
  acessos: Key,
  equipamentos: Monitor,
  integracao: Users,
  outros: MoreHorizontal,
};

const CATEGORIA_LABELS: Record<string, string> = {
  documentos: 'Documentos',
  treinamentos: 'Treinamentos',
  acessos: 'Acessos',
  equipamentos: 'Equipamentos',
  integracao: 'Integração',
  outros: 'Outros',
};

const CATEGORIA_COLORS: Record<string, string> = {
  documentos: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  treinamentos: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  acessos: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  equipamentos: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  integracao: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  outros: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  concluido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  concluida: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  nao_aplicavel: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  concluida: 'Concluída',
  nao_aplicavel: 'N/A',
};

type EtapaForm = {
  titulo: string;
  descricao: string;
  categoria: string;
  obrigatoria: boolean;
  prazoEmDias: number;
};

export default function OnboardingDigital() {
  const [tab, setTab] = useState('templates');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showIniciar, setShowIniciar] = useState(false);
  const [templateNome, setTemplateNome] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [etapas, setEtapas] = useState<EtapaForm[]>([]);
  const [expandedOnboarding, setExpandedOnboarding] = useState<number | null>(null);
  const [selectedColaborador, setSelectedColaborador] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const { data: templates, isLoading: loadingTemplates, refetch: refetchTemplates } = trpc.onboarding.templates.list.useQuery();
  const { data: onboardings, isLoading: loadingOnboardings, refetch: refetchOnboardings } = trpc.onboarding.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();

  const createTemplateMut = trpc.onboarding.templates.create.useMutation({
    onSuccess: () => {
      toast.success('Template de onboarding criado com sucesso');
      setShowCreateTemplate(false);
      resetTemplateForm();
      refetchTemplates();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTemplateMut = trpc.onboarding.templates.delete.useMutation({
    onSuccess: () => {
      toast.success('Template excluído');
      refetchTemplates();
    },
  });

  const iniciarMut = trpc.onboarding.iniciar.useMutation({
    onSuccess: () => {
      toast.success('Onboarding iniciado com sucesso');
      setShowIniciar(false);
      setSelectedColaborador('');
      setSelectedTemplate('');
      refetchOnboardings();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateOnboardingMut = trpc.onboarding.update.useMutation({
    onSuccess: () => {
      toast.success('Onboarding atualizado');
      refetchOnboardings();
    },
  });

  const updateEtapaMut = trpc.onboarding.updateEtapa.useMutation({
    onSuccess: () => {
      toast.success('Etapa atualizada');
      refetchOnboardings();
    },
  });

  function resetTemplateForm() {
    setTemplateNome('');
    setTemplateDesc('');
    setEtapas([]);
  }

  function addEtapa() {
    setEtapas([...etapas, {
      titulo: '', descricao: '', categoria: 'outros', obrigatoria: true, prazoEmDias: 7
    }]);
  }

  function removeEtapa(idx: number) {
    setEtapas(etapas.filter((_, i) => i !== idx));
  }

  function updateEtapaForm(idx: number, field: string, value: any) {
    const updated = [...etapas];
    (updated[idx] as any)[field] = value;
    setEtapas(updated);
  }

  function handleCreateTemplate() {
    if (!templateNome.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }
    const validEtapas = etapas.filter(e => e.titulo.trim());
    createTemplateMut.mutate({
      nome: templateNome,
      descricao: templateDesc || undefined,
      etapas: validEtapas.map((e, i) => ({
        titulo: e.titulo,
        descricao: e.descricao || undefined,
        categoria: e.categoria as any,
        ordem: i,
        obrigatoria: e.obrigatoria,
        prazoEmDias: e.prazoEmDias,
      })),
    });
  }

  function handleIniciar() {
    if (!selectedColaborador || !selectedTemplate) {
      toast.error('Selecione o colaborador e o template');
      return;
    }
    const colab = (colaboradores || []).find((c: any) => String(c.id) === selectedColaborador);
    const tmpl = (templates || []).find((t: any) => String(t.id) === selectedTemplate);
    if (!colab || !tmpl) return;
    iniciarMut.mutate({
      colaboradorId: colab.id,
      colaboradorNome: colab.nomeCompleto,
      templateId: tmpl.id,
      templateNome: tmpl.nome,
    });
  }

  // Stats
  const stats = useMemo(() => {
    const list = onboardings || [];
    return {
      total: list.length,
      emAndamento: list.filter((o: any) => o.status === 'em_andamento').length,
      concluidos: list.filter((o: any) => o.status === 'concluido').length,
      pendentes: list.filter((o: any) => o.status === 'pendente').length,
    };
  }, [onboardings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Onboarding Digital
          </h1>

              <p className="text-muted-foreground text-sm mt-1">
            Gerencie checklists e acompanhe o onboarding de novos colaboradores
          </p>

            </div>

          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowIniciar(true)}>
            <Play className="w-4 h-4 mr-2" /> Iniciar Onboarding
          </Button>
          <Button onClick={() => setShowCreateTemplate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Novo Template
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Onboardings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{stats.concluidos}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Pendentes</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendentes}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="onboardings">Onboardings Ativos</TabsTrigger>
        </TabsList>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          {loadingTemplates ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : !templates?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum template de onboarding criado ainda.</p>
                <Button className="mt-4" onClick={() => setShowCreateTemplate(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(templates as any[]).map((t) => (
                <TemplateCard key={t.id} template={t} onDelete={() => {
                  if (confirm('Excluir este template?')) deleteTemplateMut.mutate({ id: t.id });
                }} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ONBOARDINGS TAB */}
        <TabsContent value="onboardings" className="space-y-4">
          {loadingOnboardings ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : !onboardings?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum onboarding em andamento.</p>
                <Button className="mt-4" onClick={() => setShowIniciar(true)}>
                  <Play className="w-4 h-4 mr-2" /> Iniciar Primeiro Onboarding
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(onboardings as any[]).map((ob) => (
                <OnboardingCard
                  key={ob.id}
                  onboarding={ob}
                  expanded={expandedOnboarding === ob.id}
                  onToggle={() => setExpandedOnboarding(expandedOnboarding === ob.id ? null : ob.id)}
                  onUpdateStatus={(status: string) => updateOnboardingMut.mutate({ id: ob.id, status: status as any })}
                  onUpdateEtapa={(etapaId: number, status: string) => updateEtapaMut.mutate({ id: etapaId, status: status as any })}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Create Template */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Template de Onboarding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Template *</Label>
              <Input value={templateNome} onChange={e => setTemplateNome(e.target.value)} placeholder="Ex: Onboarding Analista Fiscal" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} placeholder="Descrição do processo de onboarding" />
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Etapas do Checklist</Label>
                <Button variant="outline" size="sm" onClick={addEtapa}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Etapa
                </Button>
              </div>
              {etapas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Adicione etapas ao checklist de onboarding
                </p>
              )}
              <div className="space-y-3">
                {etapas.map((et, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-6">#{idx + 1}</span>
                      <Input
                        className="flex-1"
                        value={et.titulo}
                        onChange={e => updateEtapaForm(idx, 'titulo', e.target.value)}
                        placeholder="Título da etapa"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeEtapa(idx)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={et.categoria} onValueChange={v => updateEtapaForm(idx, 'categoria', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">Prazo (dias):</Label>
                        <Input
                          type="number" min={1}
                          value={et.prazoEmDias}
                          onChange={e => updateEtapaForm(idx, 'prazoEmDias', Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={et.obrigatoria}
                          onChange={e => updateEtapaForm(idx, 'obrigatoria', e.target.checked)}
                          className="rounded"
                        />
                        <Label className="text-xs">Obrigatória</Label>
                      </div>
                    </div>
                    <Textarea
                      value={et.descricao}
                      onChange={e => updateEtapaForm(idx, 'descricao', e.target.value)}
                      placeholder="Descrição da etapa (opcional)"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateTemplate(false); resetTemplateForm(); }}>Cancelar</Button>
            <Button onClick={handleCreateTemplate} disabled={createTemplateMut.isPending}>
              {createTemplateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Iniciar Onboarding */}
      <Dialog open={showIniciar} onOpenChange={setShowIniciar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Onboarding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={selectedColaborador} onValueChange={setSelectedColaborador}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {(colaboradores || []).filter((c: any) => c.statusColaborador === 'ativo' || c.statusColaborador === 'experiencia').map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Template de Onboarding *</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                <SelectContent>
                  {(templates || []).filter((t: any) => t.ativo).map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIniciar(false)}>Cancelar</Button>
            <Button onClick={handleIniciar} disabled={iniciarMut.isPending}>
              {iniciarMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              <Play className="w-4 h-4 mr-2" /> Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({ template, onDelete }: { template: any; onDelete: () => void }) {
  const { data: etapas } = trpc.onboarding.templates.etapas.useQuery({ templateId: template.id });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{template.nome}</CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant={template.ativo ? 'default' : 'secondary'}>
              {template.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {template.descricao && (
          <p className="text-sm text-muted-foreground mb-3">{template.descricao}</p>
        )}
        <div className="text-xs text-muted-foreground mb-2">
          {etapas?.length || 0} etapa(s) • Criado por {template.criadoPorNome}
        </div>
        {etapas && etapas.length > 0 && (
          <div className="space-y-1">
            {(etapas as any[]).slice(0, 5).map((et, i) => {
              const Icon = CATEGORIA_ICONS[et.categoria] || MoreHorizontal;
              return (
                <div key={et.id} className="flex items-center gap-2 text-xs">
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{et.titulo}</span>
                  <Badge variant="outline" className={`text-[10px] px-1 py-0 ${CATEGORIA_COLORS[et.categoria] || ''}`}>
                    {CATEGORIA_LABELS[et.categoria] || et.categoria}
                  </Badge>
                </div>
              );
            })}
            {(etapas as any[]).length > 5 && (
              <p className="text-xs text-muted-foreground">+{(etapas as any[]).length - 5} mais...</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OnboardingCard({
  onboarding, expanded, onToggle, onUpdateStatus, onUpdateEtapa
}: {
  onboarding: any;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (status: string) => void;
  onUpdateEtapa: (etapaId: number, status: string) => void;
}) {
  const { data: etapas } = trpc.onboarding.etapas.useQuery(
    { onboardingId: onboarding.id },
    { enabled: expanded }
  );

  const progress = useMemo(() => {
    if (!etapas || !etapas.length) return 0;
    const done = (etapas as any[]).filter(e => e.status === 'concluida' || e.status === 'nao_aplicavel').length;
    return Math.round((done / etapas.length) * 100);
  }, [etapas]);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserPlus className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate">{onboarding.colaboradorNome}</p>
              <p className="text-xs text-muted-foreground">
                Template: {onboarding.templateNome || 'N/A'} • Início: {formatDateBR(onboarding.dataInicio || '')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge className={STATUS_COLORS[onboarding.status] || ''}>
              {STATUS_LABELS[onboarding.status] || onboarding.status}
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              {onboarding.status === 'em_andamento' && progress === 100 && (
                <Button size="sm" variant="default" onClick={() => onUpdateStatus('concluido')}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir
                </Button>
              )}
              {onboarding.status === 'em_andamento' && (
                <Button size="sm" variant="outline" onClick={() => {
                  if (confirm('Cancelar este onboarding?')) onUpdateStatus('cancelado');
                }}>
                  <XCircle className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              )}
            </div>

            {etapas && (etapas as any[]).length > 0 ? (
              <div className="space-y-2">
                {(etapas as any[]).map((et) => {
                  const Icon = CATEGORIA_ICONS[et.categoria] || MoreHorizontal;
                  return (
                    <div key={et.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50">
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{et.titulo}</span>
                          {et.obrigatoria && <Badge variant="outline" className="text-[10px] px-1 py-0">Obrigatória</Badge>}
                        </div>
                        {et.descricao && <p className="text-xs text-muted-foreground truncate">{et.descricao}</p>}
                      </div>
                      <Badge className={`text-xs ${STATUS_COLORS[et.status] || ''}`}>
                        {STATUS_LABELS[et.status] || et.status}
                      </Badge>
                      {et.status === 'pendente' && onboarding.status === 'em_andamento' && (
                        <Button size="sm" variant="ghost" onClick={() => onUpdateEtapa(et.id, 'concluida')}>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      {et.status === 'pendente' && onboarding.status === 'em_andamento' && (
                        <Button size="sm" variant="ghost" onClick={() => onUpdateEtapa(et.id, 'nao_aplicavel')}>
                          <XCircle className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
