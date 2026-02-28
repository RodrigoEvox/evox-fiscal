import { useLocation, Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  LayoutDashboard, ChevronLeft, ChevronRight, ChevronDown,
  LogOut, Bell, UserCog, History, Key, Settings, User,
  Handshake, BadgeDollarSign, ArrowLeftRight, Scale, Landmark,
  FileText, Wallet, Megaphone, Users, Plus,
  ListOrdered, BookOpen, TrendingUp, BarChart3,
  Headphones, Podcast, Gift, Calendar, Building2,
  CreditCard, PiggyBank, Building, Shield, ShoppingCart,
  Banknote, GraduationCap, MonitorCheck, Gavel,
  ClipboardList, FileBarChart, Gem, Search, UsersRound, Briefcase, ShieldCheck, Cpu, Library,
  MessageCircle, Target, FolderOpen, FileCheck, Mail, UserPlus, ClipboardCheck, Clock,
  Bus, Dumbbell, DollarSign, Cake, Heart, Layers, Award, Inbox, AlertTriangle,
  PenTool, FileSignature, RefreshCw, XCircle, Eye, GitBranch, Activity,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/lib/trpc';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LOGO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663316243305/wqhIjJZIWkVOoine.png';
const SYMBOL_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663316243305/orpBqLHGdGJhclPz.png';

const ICON_MAP: Record<string, any> = {
  Handshake, BadgeDollarSign, ArrowLeftRight, Scale, Landmark,
  FileText, Wallet, Megaphone, Users, Building2, Shield,
  ShoppingCart, Banknote, GraduationCap, MonitorCheck, Gavel, Cpu,
};
// Mapeamento de siglas para nomes de exibição (sem siglas)
const SIGLA_TO_NOME: Record<string, string> = {
  'COM': 'Comercial',
  'CTN': 'Contencioso',
  'CON': 'Contratos',
  'CRE': 'Crédito',
  'MON': 'Evox Monitor',
  'FIN': 'Financeiro',
  'GEG': 'Gente & Gestão',
  'JUR': 'Jurídico',
  'MKT': 'Marketing',
  'REF': 'Reforma',
  'SOF': 'Soluções Financeiras',
  'SUP': 'Suporte',
  'TRA': 'Transação',
  'UNI': 'Universidade Evox',
  'IAT': 'IA e Tecnologia',
};

// Sigla da Universidade Evox (fica fora do grupo Equipes)
const UNIVERSIDADE_SIGLA = 'UNI';

// Ícones para submenus
const SUBMENU_ICONS: Record<string, any> = {
  'nova-tarefa': Plus,
  'parcerias': Gem,
  'clientes': Users,
  'parceiros': Handshake,
  'fila': ListOrdered,
  'teses': BookOpen,
  'analitica': TrendingUp,
  'media-guias': BarChart3,
  'simulador': BarChart3,
  'consultoria': Headphones,
  'contas-pagar': CreditCard,
  'contas-receber': PiggyBank,
  'contas-bancarias': Building,
  'redes-sociais': Megaphone,
  'imersoes': Calendar,
  'podcast': Podcast,
  'brindes': Gift,
  'colaboradores': Users,
  'ferias': Calendar,
  'fila-execucao': ClipboardList,
  'relatorio': FileBarChart,
  'treinamentos': GraduationCap,
  'monitoramento': MonitorCheck,
  'busca': Search,
  'executivos-comerciais': Briefcase,
  'acoes-beneficios': Gift,
  'atestados-licencas': FileText,
  'cargos-salarios': BarChart3,
  'carreira-desenvolvimento': GraduationCap,
  'solicitacoes-folga': Calendar,
  'avaliacao-desempenho': Target,
  'documentos': FolderOpen,
  'relatorios-rh': FileBarChart,
  'bi-indicadores': BarChart3,
  'workflow-renovacao': FileCheck,
  'email-aniversario': Mail,
  'metas': TrendingUp,
  'dashboard': LayoutDashboard,
  'onboarding': UserPlus,
  'pesquisa-clima': ClipboardCheck,
  'banco-horas': Clock,
  'vale-transporte': Bus,
  'academia': Dumbbell,
  'comissao-rh': DollarSign,
  'day-off': Cake,
  'doacao-sangue': Heart,
  'reajustes': TrendingUp,
  'apontamentos-folha': FileBarChart,
  'niveis-cargo': Layers,
  'gestao-parcerias': Handshake,
  'gestao-rh-hub': Users,
  'acoes-evox-hub': Gift,
  'beneficios-hub': Wallet,
  'carreira-hub': GraduationCap,
  'admin-hub': Settings,
  'biblioteca-hub': BookOpen,
  'cct': Shield,
  'dashboard-contratos': LayoutDashboard,
  'novo-contrato': Plus,
  'fila-elaboracao': PenTool,
  'fila-revisao': Eye,
  'fila-assinatura': FileSignature,
  'fila-vigencia': ShieldCheck,
  'fila-renovacao': RefreshCw,
  'fila-encerrado': XCircle,
  'dashboard-credito': LayoutDashboard,
  'nova-tarefa-credito': Plus,
  'fila-apuracao': ListOrdered,
  'fila-onboarding': UserPlus,
  'fila-retificacao': FileCheck,
  'fila-compensacao': ArrowLeftRight,
  'fila-ressarcimento': Wallet,
  'fila-restituicao': Landmark,
  'fluxo-geral': GitBranch,
  'sla-dashboard': Activity,
  'gestao-creditos': DollarSign,
  'relatorios': FileBarChart,
  'relatorios-credito': FileBarChart,
  'inbox': Mail,
  'conflito-carteira': ArrowLeftRight,
};

interface SetorConfigItem {
  id: number;
  setorId: number;
  sigla: string;
  submenus: { key: string; label: string; rota: string; grupo?: string }[] | null;
  workflowStatuses: string[] | null;
}

interface SetorItem {
  id: number;
  nome: string;
  descricao: string | null;
  cor: string | null;
  icone: string | null;
  ativo: boolean;
}

export default function AppSidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [equipesOpen, setEquipesOpen] = useState(false);
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const notificacoes = trpc.notificacoes.list.useQuery(undefined, { refetchInterval: 60000, staleTime: 30000 });
  const unreadCount = notificacoes.data?.filter((n: any) => !n.lida).length || 0;

  const setorConfigs = trpc.setorConfig.list.useQuery(undefined, { staleTime: 120000 });
  const setoresData = trpc.setores.list.useQuery(undefined, { staleTime: 120000 });

  // Build setor nav from config, sorted alphabetically by display name
  // Separate Universidade Evox from the rest
  const { equipesNav, universidadeEvox } = useMemo(() => {
    if (!setorConfigs.data || !setoresData.data) return { equipesNav: [], universidadeEvox: null };
    const configs = setorConfigs.data as SetorConfigItem[];
    const setoresList = setoresData.data as SetorItem[];

    const allSetores = configs
      .map(cfg => {
        const setor = setoresList.find(s => s.id === cfg.setorId);
        if (!setor || !setor.ativo) return null;
        const displayName = SIGLA_TO_NOME[cfg.sigla] || setor.nome.replace(/^[A-Z]+\s*[–-]\s*/, '');
        return {
          sigla: cfg.sigla,
          nome: displayName,
          cor: setor.cor || '#3B82F6',
          icone: setor.icone || 'Building2',
          setorId: setor.id,
          submenus: (cfg.submenus || []) as { key: string; label: string; rota: string; grupo?: string }[],
        };
      })
      .filter(Boolean) as any[];

    // Separate Universidade Evox
    const uevox = allSetores.find((s: any) => s.sigla === UNIVERSIDADE_SIGLA);
    const equipes = allSetores
      .filter((s: any) => s.sigla !== UNIVERSIDADE_SIGLA)
      .sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));

    return { equipesNav: equipes, universidadeEvox: uevox || null };
  }, [setorConfigs.data, setoresData.data]);

  // Check if any equipe route is active
  const isAnyEquipeActive = useMemo(() => {
    return equipesNav.some((setor: any) =>
      location.startsWith(`/setor/${setor.sigla.toLowerCase()}`) ||
      setor.submenus?.some((sub: any) => location === sub.rota || location.startsWith(sub.rota + '/'))
    );
  }, [equipesNav, location]);

  // Auto-open equipes section if a equipe route is active
  const effectiveEquipesOpen = equipesOpen || isAnyEquipeActive;

  const toggleSection = (sigla: string) => {
    setOpenSections(prev => ({ ...prev, [sigla]: !prev[sigla] }));
  };

  const nivelLabel = (nivel: string | undefined) => {
    const map: Record<string, string> = {
      diretor: 'Diretor', gerente: 'Gerente', coordenador: 'Coordenador',
      supervisor: 'Supervisor', analista_fiscal: 'Analista Fiscal',
    };
    return map[nivel || ''] || (user?.role === 'admin' ? 'Administrador' : 'Analista');
  };

  const displayName = (user as any)?.apelido || user?.name || 'Usuário';

  // Chat unread badge
  const chatUnread = trpc.chat.unreadCount.useQuery(undefined, { refetchInterval: 15000, staleTime: 10000, enabled: !!user });
  const chatBadgeCount = chatUnread.data?.total || 0;

  const ChatNavLink = () => (
    <NavLink path="/chat" icon={MessageCircle} label="Chat" badge={chatBadgeCount > 0 ? chatBadgeCount : undefined} />
  );

  const NavLink = ({ path, icon: Icon, label, color, badge }: { path: string; icon: any; label: string; color?: string; badge?: number }) => {
    const isActive = location === path || (path !== '/' && location.startsWith(path));

    if (collapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={path}>
                <div className={cn(
                  'flex items-center justify-center px-2 py-2 rounded-lg transition-all duration-150 relative',
                  isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                )}>
                  <Icon className="w-[18px] h-[18px] shrink-0" style={color ? { color } : undefined} />
                  {badge && badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">{badge}</span>
                  )}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#0A1929] border-white/10 text-white text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link href={path}>
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-[15px] font-medium',
          isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5',
        )}>
          <Icon className="w-[18px] h-[18px] shrink-0" style={color ? { color } : undefined} />
          <span className="truncate flex-1">{label}</span>
          {badge && badge > 0 && (
            <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center shrink-0">{badge}</span>
          )}
        </div>
      </Link>
    );
  };

  const [, navigate] = useLocation();

  // Render a setor item (used inside Equipes group)
  const renderSetorItem = (setor: any) => {
    const IconComp = ICON_MAP[setor.icone] || Building2;
    const isOpen = openSections[setor.sigla] || false;
    const isActive = location.startsWith(`/setor/${setor.sigla.toLowerCase()}`) ||
      setor.submenus?.some((sub: any) => location === sub.rota || location.startsWith(sub.rota + '/'));

    return (
      <div key={setor.sigla}>
        <button
          onClick={() => {
            toggleSection(setor.sigla);
            // GEG: navigate directly to Dashboard when clicking the section header
            if (setor.sigla === 'GEG') {
              navigate('/rh/dashboard');
            }
            // CRE: navigate directly to Crédito Dashboard
            if (setor.sigla === 'CRE') {
              navigate('/credito/dashboard-credito');
            }
          }}
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg transition-all duration-150 text-[14px] font-medium',
            isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5',
          )}
        >
          <IconComp className="w-4 h-4 shrink-0" style={{ color: setor.cor }} />
          <span className="truncate flex-1 text-left">{setor.nome}</span>
          <ChevronDown className={cn(
            'w-3 h-3 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )} />
        </button>

        {isOpen && setor.submenus.length > 0 && (() => {
          // Group submenus by grupo field
          const hasGroups = setor.submenus.some((s: any) => s.grupo);
          if (!hasGroups) {
            return (
              <div className="ml-4 pl-3 border-l border-white/5 space-y-0.5 py-0.5">
                {setor.submenus.map((sub: any) => {
                  const SubIcon = SUBMENU_ICONS[sub.key] || FileText;
                  const subActive = location === sub.rota;
                  return (
                    <Link key={sub.key} href={sub.rota}>
                      <div className={cn(
                        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-150 text-[13px]',
                        subActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5',
                      )}>
                        <SubIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{sub.label}</span>
                      </div>
                    </Link>
                  );
                })}
                {setor.sigla !== 'GEG' && setor.sigla !== 'CRE' && (
                  <Link href={`/setor/${setor.sigla.toLowerCase()}/relatorio`}>
                    <div className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-150 text-[13px]',
                      location === `/setor/${setor.sigla.toLowerCase()}/relatorio`
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5',
                    )}>
                      <FileBarChart className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Relatórios</span>
                    </div>
                  </Link>
                )}
              </div>
            );
          }
          // Grouped rendering
          const groups: { name: string; items: any[] }[] = [];
          const seen = new Set<string>();
          for (const sub of setor.submenus) {
            const g = sub.grupo || '_sem_grupo';
            if (!seen.has(g)) {
              seen.add(g);
              groups.push({ name: g, items: [] });
            }
            groups.find(gr => gr.name === g)!.items.push(sub);
          }
          return (
            <div className="ml-4 pl-3 border-l border-white/5 py-0.5">
              {groups.map((group) => (
                <div key={group.name} className="mb-1">
                  {group.name !== '_sem_grupo' && (
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/25 px-2.5 pt-2 pb-1">
                      {group.name}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((sub: any) => {
                      const SubIcon = SUBMENU_ICONS[sub.key] || FileText;
                      const subActive = location === sub.rota;
                      return (
                        <Link key={sub.key} href={sub.rota}>
                          <div className={cn(
                            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-150 text-[13px]',
                            subActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5',
                          )}>
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <aside className={cn(
      'h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out z-30',
      'bg-[#0A1929] border-r border-white/5',
      collapsed ? 'w-[68px]' : 'w-[260px]'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 px-4 border-b border-white/5 shrink-0',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        {collapsed ? (
          <img src={SYMBOL_URL} alt="Evox" className="w-8 h-8 brightness-0 invert" />
        ) : (
          <img src={LOGO_URL} alt="Evox Fiscal" className="h-7 object-contain brightness-0 invert" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin min-h-0">
        {/* Dashboard */}
        <NavLink path="/" icon={LayoutDashboard} label="Dashboard" />

        {/* Minhas Tarefas */}
        <NavLink path="/minhas-tarefas" icon={ClipboardList} label="Minhas Tarefas" />

        {/* Minha Biblioteca */}
        <NavLink path="/minha-biblioteca" icon={Library} label="Minha Biblioteca" />

        {/* App do Parceiro */}
        <NavLink path="/app-parceiro" icon={Handshake} label="App do Parceiro" />

        {/* Chat */}
        <ChatNavLink />

        {/* ===== EQUIPES (menu colapsável) ===== */}
        {collapsed ? (
          <>
            {/* When collapsed, show Equipes as a tooltip icon that expands all equipes */}
            <div className="pt-2 border-t border-white/5 mt-2" />
            {equipesNav.map((setor: any) => {
              const IconComp = ICON_MAP[setor.icone] || Building2;
              const isActive = location.startsWith(`/setor/${setor.sigla.toLowerCase()}`) ||
      setor.submenus?.some((sub: any) => location === sub.rota || location.startsWith(sub.rota + '/'));
              return (
                <TooltipProvider key={setor.sigla} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/setor/${setor.sigla.toLowerCase()}`}>
                        <div className={cn(
                          'flex items-center justify-center px-2 py-2 rounded-lg transition-all duration-150',
                          isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                        )}>
                          <IconComp className="w-[18px] h-[18px]" style={{ color: setor.cor }} />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#0A1929] border-white/10 text-white text-xs">
                      {setor.nome}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </>
        ) : (
          <>
            {/* Equipes collapsible group header */}
            <div className="pt-3">
              <button
                onClick={() => setEquipesOpen(!effectiveEquipesOpen)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-150 text-[15px] font-medium',
                  isAnyEquipeActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                )}
              >
                <UsersRound className="w-[18px] h-[18px] shrink-0" />
                <span className="truncate flex-1 text-left">Equipes</span>
                <ChevronDown className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200 shrink-0',
                  effectiveEquipesOpen && 'rotate-180'
                )} />
              </button>

              {/* Equipes children */}
              {effectiveEquipesOpen && (
                <div className="ml-3 pl-3 border-l border-white/5 space-y-0.5 py-1">
                  {equipesNav.map((setor: any) => renderSetorItem(setor))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== UNIVERSIDADE EVOX (fora do grupo Equipes) ===== */}
        {universidadeEvox && (
          <>
            {collapsed ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/setor/${universidadeEvox.sigla.toLowerCase()}`}>
                      <div className={cn(
                        'flex items-center justify-center px-2 py-2 rounded-lg transition-all duration-150',
                        location.startsWith(`/setor/${universidadeEvox.sigla.toLowerCase()}`)
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                      )}>
                        <GraduationCap className="w-[18px] h-[18px]" style={{ color: universidadeEvox.cor }} />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#0A1929] border-white/10 text-white text-xs">
                    Universidade Evox
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              (() => {
                const isUevoxOpen = openSections[universidadeEvox.sigla] || false;
                const isUevoxActive = location.startsWith(`/setor/${universidadeEvox.sigla.toLowerCase()}`);
                return (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleSection(universidadeEvox.sigla)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-150 text-[15px] font-medium',
                        isUevoxActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                      )}
                    >
                      <GraduationCap className="w-[18px] h-[18px] shrink-0" style={{ color: universidadeEvox.cor }} />
                      <span className="truncate flex-1 text-left">Universidade Evox</span>
                      {universidadeEvox.submenus.length > 0 && (
                        <ChevronDown className={cn(
                          'w-3.5 h-3.5 transition-transform duration-200 shrink-0',
                          isUevoxOpen && 'rotate-180'
                        )} />
                      )}
                    </button>

                    {isUevoxOpen && universidadeEvox.submenus.length > 0 && (
                      <div className="ml-4 pl-3 border-l border-white/5 space-y-0.5 py-0.5">
                        {universidadeEvox.submenus.map((sub: any) => {
                          const SubIcon = SUBMENU_ICONS[sub.key] || FileText;
                          const subActive = location === sub.rota;
                          return (
                            <Link key={sub.key} href={sub.rota}>
                              <div className={cn(
                                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-150 text-[14px]',
                                subActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5',
                              )}>
                                <SubIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{sub.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                        <Link href={`/setor/${universidadeEvox.sigla.toLowerCase()}/relatorio`}>
                          <div className={cn(
                            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all duration-150 text-[14px]',
                            location === `/setor/${universidadeEvox.sigla.toLowerCase()}/relatorio`
                              ? 'bg-white/10 text-white'
                              : 'text-white/40 hover:text-white/70 hover:bg-white/5',
                          )}>
                            <FileBarChart className="w-4 h-4 shrink-0" />
                            <span className="truncate">Relatórios</span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </>
        )}

        {/* Administração */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-3 pb-1 px-3">
                <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">Administração</span>
              </div>
            )}
            {collapsed && <div className="pt-2 border-t border-white/5 mt-2" />}
            <NavLink path="/teses" icon={BookOpen} label="Teses Tributárias" />
            <NavLink path="/servicos" icon={Settings} label="Serviços" />
            <NavLink path="/gestao-parcerias" icon={Gem} label="Gestão de Parcerias" />
            <NavLink path="/aprovacoes-comissao" icon={ShieldCheck} label="Aprovações de Comissão" />
            <NavLink path="/relatorio-comissoes" icon={FileBarChart} label="Relatório de Comissões" />
            <NavLink path="/dashboard-comissoes" icon={BarChart3} label="Dashboard Comissões" />
            <NavLink path="/credito/sla-dashboard" icon={Activity} label="Dashboard SLA" />
            <NavLink path="/sla-config" icon={ClipboardList} label="Configuração SLA" />
            <NavLink path="/usuarios" icon={UserCog} label="Gestão de Usuários" />
            <NavLink path="/audit-log" icon={History} label="Audit Log" />
            <NavLink path="/api-keys" icon={Key} label="API & Integrações" />
          </>
        )}
      </nav>

      {/* User profile + notifications */}
      <div className="p-2 border-t border-white/5 space-y-1 shrink-0">
        {unreadCount > 0 && (
          <NavLink path="/notificacoes" icon={Bell} label={`${unreadCount} notificação(ões)`} badge={unreadCount} />
        )}

        {/* Profile link */}
        <Link href="/perfil">
          <div className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer',
            collapsed ? 'justify-center' : '',
            location === '/perfil' ? 'bg-white/10' : ''
          )}>
            <Avatar className="h-8 w-8 shrink-0 border border-white/10">
              {(user as any)?.avatar && <AvatarImage src={(user as any).avatar} />}
              <AvatarFallback className="text-xs font-medium bg-white/10 text-white">
                {displayName.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">{displayName}</p>
                <p className="text-[10px] text-white/40 truncate">{nivelLabel((user as any)?.nivelAcesso)}</p>
              </div>
            )}
          </div>
        </Link>

        <button
          onClick={() => logout()}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
            'text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors text-xs',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sair</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-1.5 rounded-lg',
            'text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors text-sm',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <><ChevronLeft className="w-4 h-4" /><span>Recolher</span></>
          )}
        </button>
      </div>
    </aside>
  );
}
