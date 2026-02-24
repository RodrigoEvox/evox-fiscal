import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import {
  Users, UserPlus, DollarSign, Clock, FileText, Calendar, TrendingUp,
  Heart, Gift, Dumbbell, Bus, Cake, GraduationCap, Target, ClipboardCheck,
  BarChart3, Layers, FileBarChart, FolderOpen, Banknote, Briefcase, Award,
  BookOpen, Star, Sparkles, Shield, Zap, Monitor, KeyRound, PieChart, AlertTriangle,
  LayoutDashboard, Library, Package, BookCopy, CalendarCheck, RotateCcw, Truck, ScrollText, Search as SearchIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'colaboradores': Users,
  'onboarding': UserPlus,
  'comissao-rh': DollarSign,
  'banco-horas': Clock,
  'atestados-licencas': FileText,
  'ferias': Calendar,
  'reajustes': TrendingUp,
  'acoes-beneficios': Gift,
  'acao-solidaria': Heart,
  'acao-engajamento': Gift,
  'doacao-sangue': Heart,
  'vale-transporte': Bus,
  'academia': Dumbbell,
  'day-off': Cake,
  'carreira-desenvolvimento': GraduationCap,
  'metas': Target,
  'avaliacao-desempenho': ClipboardCheck,
  'pesquisa-clima': ClipboardCheck,
  'cargos-salarios': Banknote,
  'niveis-cargo': Layers,
  'apontamentos-folha': FileBarChart,
  'documentos': FolderOpen,
  'relatorios-rh': BarChart3,
  'rescisao': Briefcase,
  // Custom icons
  'Gift': Gift,
  'GraduationCap': GraduationCap,
  'Award': Award,
  'BookOpen': BookOpen,
  'Star': Star,
  'Heart': Heart,
  'Sparkles': Sparkles,
  'Shield': Shield,
  'Zap': Zap,
  'Target': Target,
  'Briefcase': Briefcase,
  'Dumbbell': Dumbbell,
  'Bus': Bus,
  'aniversariantes': Cake,
  'contratos-vencendo': FileText,
  'equipamentos': Monitor,
  'senhas-autorizacoes': KeyRound,
  'bi-indicadores': PieChart,
  'cct': Shield,
  'ocorrencias-reversao': AlertTriangle,
  // Biblioteca Evox
  'biblioteca-dashboard': LayoutDashboard,
  'biblioteca-acervo': Library,
  'biblioteca-exemplares': Package,
  'biblioteca-emprestimos': BookCopy,
  'biblioteca-reservas': CalendarCheck,
  'biblioteca-devolucoes': RotateCcw,
  'biblioteca-fornecedores': Truck,
  'biblioteca-politicas': ScrollText,
  'biblioteca-auditoria': SearchIcon,
  'biblioteca-relatorios': FileBarChart,
};

const AVAILABLE_ICONS = [
  { name: 'Gift', label: 'Presente' },
  { name: 'GraduationCap', label: 'Educação' },
  { name: 'Award', label: 'Prêmio' },
  { name: 'BookOpen', label: 'Livro' },
  { name: 'Star', label: 'Estrela' },
  { name: 'Heart', label: 'Coração' },
  { name: 'Sparkles', label: 'Brilho' },
  { name: 'Shield', label: 'Escudo' },
  { name: 'Zap', label: 'Raio' },
  { name: 'Target', label: 'Alvo' },
  { name: 'Briefcase', label: 'Pasta' },
  { name: 'Dumbbell', label: 'Haltere' },
];

const COLOR_MAP: Record<string, string> = {
  'Gestão RH': 'from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10 border-blue-500/20',
  'Ações Evox': 'from-orange-500/10 to-orange-600/5 hover:from-orange-500/20 hover:to-orange-600/10 border-orange-500/20',
  'Benefícios': 'from-emerald-500/10 to-emerald-600/5 hover:from-emerald-500/20 hover:to-emerald-600/10 border-emerald-500/20',
  'Carreira e Desenvolvimento': 'from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 border-purple-500/20',
  'Administração': 'from-slate-500/10 to-slate-600/5 hover:from-slate-500/20 hover:to-slate-600/10 border-slate-500/20',
};

const ICON_COLOR_MAP: Record<string, string> = {
  'Gestão RH': 'text-blue-500',
  'Ações Evox': 'text-orange-500',
  'Benefícios': 'text-emerald-500',
  'Carreira e Desenvolvimento': 'text-purple-500',
  'Administração': 'text-slate-400',
};

const DESCRIPTION_MAP: Record<string, Record<string, string>> = {
  'colaboradores': { desc: 'Cadastro e gestão de colaboradores CLT e PJ' },
  'onboarding': { desc: 'Processo de integração de novos colaboradores' },
  'comissao-rh': { desc: 'Comissões por tipo (Monitor, DPT, Crédito)' },
  'banco-horas': { desc: 'Controle de banco de horas e compensações' },
  'atestados-licencas': { desc: 'Atestados médicos e licenças CLT' },
  'ferias': { desc: 'Programação, aprovação e controle de férias' },
  'reajustes': { desc: 'Reajustes salariais (2 anos, sindical, manual)' },
  'acoes-beneficios': { desc: 'Ação FIT mensal para saúde e bem-estar' },
  'acao-solidaria': { desc: 'Ações solidárias e de responsabilidade social' },
  'acao-engajamento': { desc: 'Ações de engajamento e integração da equipe' },
  'doacao-sangue': { desc: 'Registro de doações e controle de folgas' },
  'vale-transporte': { desc: 'Cálculo automático de VT por colaborador' },
  'academia': { desc: 'Benefício academia com planos e fidelidade' },
  'day-off': { desc: 'Day Off de aniversário e datas especiais' },
  'carreira-desenvolvimento': { desc: 'Planos de carreira e trilhas de desenvolvimento' },
  'metas': { desc: 'Metas individuais e KPIs por colaborador' },
  'avaliacao-desempenho': { desc: 'Avaliação 360° com ciclos e critérios' },
  'pesquisa-clima': { desc: 'Pesquisas de clima organizacional' },
  'cargos-salarios': { desc: 'Estrutura de cargos e faixas salariais' },
  'apontamentos-folha': { desc: 'Consolidação de apontamentos para folha' },
  'documentos': { desc: 'Documentos e arquivos por colaborador' },
  'relatorios-rh': { desc: 'Relatórios e indicadores analíticos' },
  'rescisao': { desc: 'Cálculo de verbas rescisórias por tipo de desligamento' },
  'projecao-financeira': { desc: 'Projeção mensal e anual de custos com pessoal' },
  'aniversariantes': { desc: 'Calendário de aniversários e agendamento de Day Off' },
  'contratos-vencendo': { desc: 'Workflow de renovação de contratos próximos ao vencimento' },
  'equipamentos': { desc: 'Gestão de equipamentos, e-mails corporativos (@grupoevox.com.br) e senhas/acessos' },
  'bi-indicadores': { desc: 'Business Intelligence com indicadores analíticos de RH' },
  'cct': { desc: 'Gestão de convenções coletivas com análise automática por IA' },
  'ocorrencias-reversao': { desc: 'Registro de ocorrências disciplinares e programa de reversão com acompanhamento' },
  // Biblioteca Evox
  'biblioteca-dashboard': { desc: 'Visão geral com KPIs, gráficos e indicadores da biblioteca' },
  'biblioteca-acervo': { desc: 'Catálogo completo de livros com busca, filtros e classificação' },
  'biblioteca-exemplares': { desc: 'Gestão patrimonial de exemplares físicos com código e condição' },
  'biblioteca-emprestimos': { desc: 'Controle de empréstimos com termos, checklist e renovação' },
  'biblioteca-reservas': { desc: 'Fila de reservas com atribuição automática de exemplares' },
  'biblioteca-devolucoes': { desc: 'Registro de devoluções e ocorrências (dano, extravio, atraso)' },
  'biblioteca-fornecedores': { desc: 'Cadastro de fornecedores e doadores de livros' },
  'biblioteca-politicas': { desc: 'Regras de empréstimo, prazos, limites e penalidades' },
  'biblioteca-auditoria': { desc: 'Log completo de todas as ações realizadas na biblioteca' },
  'biblioteca-relatorios': { desc: 'Relatórios gerenciais exportáveis em PDF e Excel' },
};

export interface HubItem {
  key: string;
  label: string;
  rota: string;
}

interface GegHubPageProps {
  title: string;
  grupo: string;
  items: HubItem[];
  showAddNew?: boolean;
  addNewType?: 'beneficio' | 'carreira';
  backRoute?: string;
}

export default function GegHubPage({ title, grupo, items, showAddNew, addNewType, backRoute }: GegHubPageProps) {
  const colorClass = COLOR_MAP[grupo] || COLOR_MAP['Administração'];
  const iconColor = ICON_COLOR_MAP[grupo] || 'text-slate-400';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [icone, setIcone] = useState('Gift');

  const utils = trpc.useUtils();

  // Load custom items
  const { data: customBeneficios } = trpc.beneficiosCustom.list.useQuery(undefined, {
    enabled: addNewType === 'beneficio',
  });
  const { data: customProgramas } = trpc.programasCarreira.list.useQuery(undefined, {
    enabled: addNewType === 'carreira',
  });

  const createBeneficio = trpc.beneficiosCustom.create.useMutation({
    onSuccess: () => {
      utils.beneficiosCustom.list.invalidate();
      toast.success('Benefício adicionado com sucesso!');
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const createPrograma = trpc.programasCarreira.create.useMutation({
    onSuccess: () => {
      utils.programasCarreira.list.invalidate();
      toast.success('Programa adicionado com sucesso!');
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteBeneficio = trpc.beneficiosCustom.delete.useMutation({
    onSuccess: () => {
      utils.beneficiosCustom.list.invalidate();
      toast.success('Benefício removido!');
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePrograma = trpc.programasCarreira.delete.useMutation({
    onSuccess: () => {
      utils.programasCarreira.list.invalidate();
      toast.success('Programa removido!');
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setIcone('Gift');
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (addNewType === 'beneficio') {
      createBeneficio.mutate({ nome, descricao, icone });
    } else if (addNewType === 'carreira') {
      createPrograma.mutate({ nome, descricao, icone });
    }
  };

  const handleDeleteCustom = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addNewType === 'beneficio') {
      deleteBeneficio.mutate({ id });
    } else if (addNewType === 'carreira') {
      deletePrograma.mutate({ id });
    }
  };

  // Merge static items with custom items
  const customItems: HubItem[] = [];
  if (addNewType === 'beneficio' && customBeneficios) {
    customBeneficios.filter((b: any) => b.ativo).forEach((b: any) => {
      customItems.push({
        key: `custom-beneficio-${b.id}`,
        label: b.nome,
        rota: b.rota || '#',
      });
    });
  }
  if (addNewType === 'carreira' && customProgramas) {
    customProgramas.filter((p: any) => p.ativo).forEach((p: any) => {
      customItems.push({
        key: `custom-carreira-${p.id}`,
        label: p.nome,
        rota: p.rota || '#',
      });
    });
  }

  const allItems = [...items, ...customItems];
  const isPending = createBeneficio.isPending || createPrograma.isPending;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={backRoute || '/rh/dashboard'}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Selecione uma opção para acessar
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allItems.map((item) => {
          const isCustom = item.key.startsWith('custom-');
          const customId = isCustom ? parseInt(item.key.split('-').pop() || '0') : 0;
          const customRecord = isCustom
            ? (addNewType === 'beneficio'
              ? customBeneficios?.find((b: any) => b.id === customId)
              : customProgramas?.find((p: any) => p.id === customId))
            : null;
          const iconKey = isCustom ? (customRecord as any)?.icone || 'Gift' : item.key;
          const Icon = ICON_MAP[iconKey] || FileText;
          const desc = isCustom ? (customRecord as any)?.descricao || 'Item personalizado' : DESCRIPTION_MAP[item.key]?.desc || '';

          return (
            <Link key={item.key} href={item.rota}>
              <Card className={`cursor-pointer transition-all duration-200 bg-gradient-to-br ${colorClass} border hover:shadow-lg hover:scale-[1.02] h-full relative group`}>
                {isCustom && (
                  <button
                    onClick={(e) => handleDeleteCustom(customId, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl bg-background/50 ${iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold">{item.label}</CardTitle>
                      {desc && (
                        <CardDescription className="text-xs mt-1.5 line-clamp-2">
                          {desc}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}

        {/* Add New option */}
        {showAddNew && (
          <Card
            className="cursor-pointer transition-all duration-200 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 h-full flex items-center justify-center min-h-[100px]"
            onClick={() => setDialogOpen(true)}
          >
            <CardHeader className="pb-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2.5 rounded-xl bg-muted">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Incluir Novo</CardTitle>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Add New Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {addNewType === 'beneficio' ? 'Novo Benefício' : 'Novo Programa de Carreira'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={addNewType === 'beneficio' ? 'Ex: Plano de Saúde' : 'Ex: Programa de Mentoria'}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Breve descrição do item"
                rows={3}
              />
            </div>
            <div>
              <Label>Ícone</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {AVAILABLE_ICONS.map((ic) => {
                  const IcComp = ICON_MAP[ic.name] || Gift;
                  return (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setIcone(ic.name)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${
                        icone === ic.name
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-transparent hover:bg-muted'
                      }`}
                      title={ic.label}
                    >
                      <IcComp className="w-5 h-5" />
                      <span className="truncate w-full text-center">{ic.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
