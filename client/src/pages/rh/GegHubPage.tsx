import { Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  Users, UserPlus, DollarSign, Clock, FileText, Calendar, TrendingUp,
  Heart, Gift, Dumbbell, Bus, Cake, GraduationCap, Target, ClipboardCheck,
  BarChart3, Layers, FileBarChart, FolderOpen, Banknote,
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
};

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
  'niveis-cargo': { desc: 'Níveis de cargo com requisitos de formação' },
  'apontamentos-folha': { desc: 'Consolidação de apontamentos para folha' },
  'documentos': { desc: 'Documentos e arquivos por colaborador' },
  'relatorios-rh': { desc: 'Relatórios e indicadores analíticos' },
};

interface HubItem {
  key: string;
  label: string;
  rota: string;
}

interface GegHubPageProps {
  title: string;
  grupo: string;
  items: HubItem[];
  showAddNew?: boolean;
}

export default function GegHubPage({ title, grupo, items, showAddNew }: GegHubPageProps) {
  const colorClass = COLOR_MAP[grupo] || COLOR_MAP['Administração'];
  const iconColor = ICON_COLOR_MAP[grupo] || 'text-slate-400';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/rh/dashboard">
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
        {items.map((item) => {
          const Icon = ICON_MAP[item.key] || FileText;
          const desc = DESCRIPTION_MAP[item.key]?.desc || '';
          return (
            <Link key={item.key} href={item.rota}>
              <Card className={`cursor-pointer transition-all duration-200 bg-gradient-to-br ${colorClass} border hover:shadow-lg hover:scale-[1.02] h-full`}>
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
          <Card className="cursor-pointer transition-all duration-200 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 h-full flex items-center justify-center min-h-[100px]">
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
    </div>
  );
}
