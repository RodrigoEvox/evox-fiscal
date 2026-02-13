/*
 * Sidebar — Evox Fiscal (v2)
 * Dark navy sidebar with icon + label navigation, includes Parceiros and Fila
 */

import { useLocation, Link } from 'wouter';
import {
  LayoutDashboard, Users, BookOpen, BarChart3, ChevronLeft, ChevronRight,
  FileText, Handshake, ListOrdered, TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const LOGO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663316243305/RLxeVPuGwhontikw.png';
const SYMBOL_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663316243305/PXSEUnBfNjNOBvHq.png';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/parceiros', label: 'Parceiros', icon: Handshake },
  { path: '/teses', label: 'Teses Tributárias', icon: BookOpen },
  { path: '/fila', label: 'Fila de Apuração', icon: ListOrdered },
  { path: '/analise', label: 'Análise', icon: BarChart3 },
  { path: '/relatorios', label: 'Relatórios', icon: FileText },
  { path: '/analitica', label: 'Visão Analítica', icon: TrendingUp },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out',
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
      <nav className="flex-1 py-4 px-2 space-y-1">
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
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-white/5">
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
