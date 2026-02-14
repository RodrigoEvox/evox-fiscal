import { useLocation, Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  LayoutDashboard, Users, BookOpen, BarChart3, ChevronLeft, ChevronRight,
  FileText, Handshake, ListOrdered, TrendingUp, UserCog, Upload, LogOut, Bell,
  CheckSquare, Building2, FolderOpen, Shield, Key, History,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { trpc } from '@/lib/trpc';

const LOGO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663316243305/wqhIjJZIWkVOoine.png';
const SYMBOL_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663316243305/orpBqLHGdGJhclPz.png';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/parceiros', label: 'Parceiros', icon: Handshake },
  { path: '/teses', label: 'Teses Tributárias', icon: BookOpen },
  { path: '/fila', label: 'Fila de Apuração', icon: ListOrdered },
  { path: '/relatorios', label: 'Relatórios', icon: FileText },
  { path: '/analitica', label: 'Visão Analítica', icon: TrendingUp },
  { path: '/arquivos', label: 'Arquivos', icon: FolderOpen },
  { path: '/importacao', label: 'Importação CSV', icon: Upload },
];

const adminItems = [
  { path: '/setores', label: 'Setores', icon: Building2 },
  { path: '/usuarios', label: 'Gestão de Usuários', icon: UserCog },
  { path: '/audit-log', label: 'Audit Log', icon: History },
  { path: '/api-keys', label: 'API & Integrações', icon: Key },
];

export default function AppSidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const notificacoes = trpc.notificacoes.list.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const unreadCount = notificacoes.data?.filter((n: any) => !n.lida).length || 0;

  const nivelLabel = (nivel: string | undefined) => {
    const map: Record<string, string> = {
      diretor: 'Diretor',
      gerente: 'Gerente',
      coordenador: 'Coordenador',
      analista_fiscal: 'Analista Fiscal',
      suporte_comercial: 'Suporte Comercial',
    };
    return map[nivel || ''] || (user?.role === 'admin' ? 'Administrador' : 'Analista');
  };

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out z-30',
        'bg-[#0A1929] border-r border-white/5',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/5',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        {collapsed ? (
          <img src={SYMBOL_URL} alt="Evox" className="w-8 h-8 brightness-0 invert" />
        ) : (
          <img src={LOGO_URL} alt="Evox Fiscal" className="h-8 object-contain brightness-0 invert" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                  'text-sm font-medium',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3">
                <span className="text-[10px] uppercase tracking-wider text-white/25 font-semibold">
                  Administração
                </span>
              </div>
            )}
            {collapsed && <div className="pt-2 border-t border-white/5 mt-2" />}
            {adminItems.map(item => {
              const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                      'text-sm font-medium',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User profile + notifications */}
      <div className="p-2 border-t border-white/5 space-y-1">
        {/* Notifications indicator */}
        {unreadCount > 0 && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
            <Bell className="w-4 h-4" />
            <span>{unreadCount} notificação(ões)</span>
          </div>
        )}

        {/* User info */}
        <div className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-lg',
          collapsed ? 'justify-center' : ''
        )}>
          <Avatar className="h-8 w-8 shrink-0 border border-white/10">
            <AvatarFallback className="text-xs font-medium bg-white/10 text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{user?.name || 'Usuário'}</p>
              <p className="text-[10px] text-white/40 truncate">{nivelLabel((user as any)?.nivelAcesso)}</p>
            </div>
          )}
        </div>

        {/* Logout */}
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

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
            'text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors text-sm',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
