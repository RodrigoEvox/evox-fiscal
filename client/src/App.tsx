import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import AppSidebar from "./components/AppSidebar";
import GlobalSearch from "./components/GlobalSearch";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteDetalhe from "./pages/ClienteDetalhe";
import Teses from "./pages/Teses";
import Relatorios from "./pages/Relatorios";
import Parceiros from "./pages/Parceiros";
import FilaApuracao from "./pages/FilaApuracao";
import Analitica from "./pages/Analitica";
import Usuarios from "./pages/Usuarios";
import Importacao from "./pages/Importacao";
import { lazy, Suspense } from "react";

const Tarefas = lazy(() => import("./pages/Tarefas"));
const TarefaDetalhe = lazy(() => import("./pages/TarefaDetalhe"));
const Setores = lazy(() => import("./pages/Setores"));
const Arquivos = lazy(() => import("./pages/Arquivos"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const ApiKeys = lazy(() => import("./pages/ApiKeys"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Servicos = lazy(() => import("./pages/Servicos"));
const SetorPage = lazy(() => import("./pages/SetorPage"));
const GestaoParcerias = lazy(() => import("./pages/GestaoParcerias"));
const SlaConfig = lazy(() => import("./pages/SlaConfig"));
const MinhasTarefas = lazy(() => import("./pages/MinhasTarefas"));
const ExecutivosComerciais = lazy(() => import("./pages/ExecutivosComerciais"));
const AprovacoesComissao = lazy(() => import("./pages/AprovacoesComissao"));
const RelatorioComissoes = lazy(() => import("./pages/RelatorioComissoes"));
const ChatInterno = lazy(() => import("./pages/ChatInterno"));
const NovaTarefaGEG = lazy(() => import("./pages/rh/NovaTarefaGEG"));
const ColaboradoresGEG = lazy(() => import("./pages/rh/ColaboradoresGEG"));
const FeriasGEG = lazy(() => import("./pages/rh/FeriasGEG"));
const AcoesBeneficios = lazy(() => import("./pages/rh/AcoesBeneficios"));
const AtestadosLicencas = lazy(() => import("./pages/rh/AtestadosLicencas"));
const CargosSalarios = lazy(() => import("./pages/rh/CargosSalarios"));
const CarreiraDesenvolvimento = lazy(() => import("./pages/rh/CarreiraDesenvolvimento"));
const AvaliacaoDesempenho = lazy(() => import("./pages/rh/AvaliacaoDesempenho"));
const DocumentosColaborador = lazy(() => import("./pages/rh/DocumentosColaborador"));
const RelatoriosRH = lazy(() => import("./pages/rh/RelatoriosRH"));
const MetasIndividuais = lazy(() => import("./pages/rh/MetasIndividuais"));
const BiRH = lazy(() => import("./pages/rh/BiRH"));
const WorkflowRenovacao = lazy(() => import("./pages/rh/WorkflowRenovacao"));
const EmailAniversariante = lazy(() => import("./pages/rh/EmailAniversariante"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/minhas-tarefas" component={MinhasTarefas} />
        <Route path="/tarefas" component={Tarefas} />
        <Route path="/tarefas/:id" component={TarefaDetalhe} />
        <Route path="/clientes" component={Clientes} />
        <Route path="/clientes/:id" component={ClienteDetalhe} />
        <Route path="/teses" component={Teses} />
        <Route path="/relatorios" component={Relatorios} />
        <Route path="/parceiros" component={Parceiros} />
        <Route path="/fila" component={FilaApuracao} />
        <Route path="/analitica" component={Analitica} />
        <Route path="/arquivos" component={Arquivos} />
        <Route path="/importacao" component={Importacao} />
        <Route path="/setores" component={Setores} />
        <Route path="/usuarios" component={Usuarios} />
        <Route path="/audit-log" component={AuditLog} />
        <Route path="/api-keys" component={ApiKeys} />
        <Route path="/perfil" component={Perfil} />
        <Route path="/servicos" component={Servicos} />
        <Route path="/gestao-parcerias" component={GestaoParcerias} />
        <Route path="/executivos-comerciais" component={ExecutivosComerciais} />
        <Route path="/aprovacoes-comissao" component={AprovacoesComissao} />
        <Route path="/relatorio-comissoes" component={RelatorioComissoes} />
        <Route path="/sla-config" component={SlaConfig} />
        <Route path="/chat" component={ChatInterno} />
        {/* Gente & Gestão (RH) */}
        <Route path="/rh/nova-tarefa" component={NovaTarefaGEG} />
        <Route path="/rh/colaboradores" component={ColaboradoresGEG} />
        <Route path="/rh/ferias" component={FeriasGEG} />
        <Route path="/rh/acoes-beneficios" component={AcoesBeneficios} />
        <Route path="/rh/atestados-licencas" component={AtestadosLicencas} />
        <Route path="/rh/cargos-salarios" component={CargosSalarios} />
        <Route path="/rh/carreira-desenvolvimento" component={CarreiraDesenvolvimento} />
        <Route path="/rh/avaliacao-desempenho" component={AvaliacaoDesempenho} />
        <Route path="/rh/documentos" component={DocumentosColaborador} />
        <Route path="/rh/relatorios" component={RelatoriosRH} />
        <Route path="/rh/metas" component={MetasIndividuais} />
        <Route path="/rh/bi" component={BiRH} />
        <Route path="/rh/workflow-renovacao" component={WorkflowRenovacao} />
        <Route path="/rh/email-aniversariante" component={EmailAniversariante} />
        {/* Setor pages with sub-routes */}
        <Route path="/setor/:sigla/:sub?" component={SetorPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663316243305/wqhIjJZIWkVOoine.png"
            alt="Evox Fiscal"
            className="h-12 object-contain"
          />
          <h1 className="text-xl font-semibold text-center text-foreground">
            Acesse o sistema para continuar
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            O acesso ao sistema de análise tributária requer autenticação.
          </p>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthGate>
            <div className="flex min-h-screen">
              <AppSidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar with global search */}
                <header className="h-14 border-b border-gray-100 flex items-center px-6 bg-white shrink-0">
                  <GlobalSearch />
                </header>
                <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
                  <Router />
                </main>
              </div>
            </div>
          </AuthGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
