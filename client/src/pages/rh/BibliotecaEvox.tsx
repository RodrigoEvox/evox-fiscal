import { useState } from 'react';
import { BookOpen, LayoutDashboard, Library, Package, HandshakeIcon, BookMarked, RotateCcw, AlertTriangle, Truck, ScrollText, Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

// Lazy-loaded tab content components
import BibliotecaDashboard from './biblioteca/BibliotecaDashboard';
import BibliotecaAcervo from './biblioteca/BibliotecaAcervo';
import BibliotecaExemplares from './biblioteca/BibliotecaExemplares';
import BibliotecaEmprestimos from './biblioteca/BibliotecaEmprestimos';
import BibliotecaReservas from './biblioteca/BibliotecaReservas';
import BibliotecaDevolucoes from './biblioteca/BibliotecaDevolucoes';
import BibliotecaFornecedores from './biblioteca/BibliotecaFornecedores';
import BibliotecaPoliticas from './biblioteca/BibliotecaPoliticas';
import BibliotecaAuditoria from './biblioteca/BibliotecaAuditoria';
import BibliotecaRelatorios from './biblioteca/BibliotecaRelatorios';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'acervo', label: 'Acervo', icon: Library },
  { id: 'exemplares', label: 'Exemplares', icon: Package },
  { id: 'emprestimos', label: 'Empréstimos', icon: HandshakeIcon },
  { id: 'reservas', label: 'Reservas', icon: BookMarked },
  { id: 'devolucoes', label: 'Devoluções', icon: RotateCcw },
  { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
  { id: 'politicas', label: 'Políticas', icon: ScrollText },
  { id: 'auditoria', label: 'Auditoria', icon: Shield },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
] as const;

type TabId = typeof TABS[number]['id'];

export default function BibliotecaEvox() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <BibliotecaDashboard />;
      case 'acervo': return <BibliotecaAcervo />;
      case 'exemplares': return <BibliotecaExemplares />;
      case 'emprestimos': return <BibliotecaEmprestimos />;
      case 'reservas': return <BibliotecaReservas />;
      case 'devolucoes': return <BibliotecaDevolucoes />;
      case 'fornecedores': return <BibliotecaFornecedores />;
      case 'politicas': return <BibliotecaPoliticas />;
      case 'auditoria': return <BibliotecaAuditoria />;
      case 'relatorios': return <BibliotecaRelatorios />;
      default: return <BibliotecaDashboard />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/rh/gestao-rh" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <BookOpen className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold">Biblioteca Evox</h1>
          <p className="text-xs text-muted-foreground">Gestão completa do acervo corporativo</p>
        </div>
      </div>

      {/* Tab Navigation - Horizontal pills */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}
