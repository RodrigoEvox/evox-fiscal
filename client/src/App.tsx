import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, isPublicMode } from "@/const";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

// Lazy-loaded layout components
const AppSidebar = lazy(() => import("./components/AppSidebar"));
const GlobalSearch = lazy(() => import("./components/GlobalSearch"));

// Lazy-loaded pages (previously static imports causing 2.3MB bundle)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clientes = lazy(() => import("./pages/Clientes"));
const ClienteDetalhe = lazy(() => import("./pages/ClienteDetalhe"));
const Teses = lazy(() => import("./pages/Teses"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Parceiros = lazy(() => import("./pages/Parceiros"));
const FilaApuracao = lazy(() => import("./pages/FilaApuracao"));
const Analitica = lazy(() => import("./pages/Analitica"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Importacao = lazy(() => import("./pages/Importacao"));

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
const MinhaBiblioteca = lazy(() => import("./pages/MinhaBiblioteca"));
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
const DashboardGEG = lazy(() => import("./pages/rh/DashboardGEG"));
const OnboardingDigital = lazy(() => import("./pages/rh/OnboardingDigital"));
const PesquisaClima = lazy(() => import("./pages/rh/PesquisaClima"));
const BancoHoras = lazy(() => import("./pages/rh/BancoHoras"));
const ValeTransporteGEG = lazy(() => import("./pages/rh/ValeTransporteGEG"));
const AcademiaGEG = lazy(() => import("./pages/rh/AcademiaGEG"));
const ComissaoRhGEG = lazy(() => import("./pages/rh/ComissaoRhGEG"));
const DayOffGEG = lazy(() => import("./pages/rh/DayOffGEG"));
const DoacaoSangueGEG = lazy(() => import("./pages/rh/DoacaoSangueGEG"));
const ReajustesGEG = lazy(() => import("./pages/rh/ReajustesGEG"));
const ApontamentosFolhaGEG = lazy(() => import("./pages/rh/ApontamentosFolhaGEG"));
const NiveisCargoGEG = lazy(() => import("./pages/rh/NiveisCargoGEG"));
const DashboardComissoes = lazy(() => import("./pages/DashboardComissoes"));
const GestaoRhHub = lazy(() => import("./pages/rh/GestaoRhHub"));
const AcoesEvoxHub = lazy(() => import("./pages/rh/AcoesEvoxHub"));
const BeneficiosHub = lazy(() => import("./pages/rh/BeneficiosHub"));
const CarreiraHub = lazy(() => import("./pages/rh/CarreiraHub"));
const AdministracaoHub = lazy(() => import("./pages/rh/AdministracaoHub"));
const BibliotecaEvox = lazy(() => import("./pages/rh/BibliotecaEvox"));
const RescisaoPage = lazy(() => import("./pages/rh/RescisaoPage"));
const ProjecaoFinanceiraGEG = lazy(() => import("./pages/rh/ProjecaoFinanceiraGEG"));
const ConflitoCarteira = lazy(() => import("./pages/suporte/ConflitoCarteira"));
const InboxDemandas = lazy(() => import("./pages/suporte/InboxDemandas"));

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <AuthGate>
            <AppLayout />
          </AuthGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppLayout() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        </div>
      }
    >
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <GlobalSearch />
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/clientes" component={Clientes} />
              <Route path="/clientes/:id" component={ClienteDetalhe} />
              <Route path="/teses" component={Teses} />
              <Route path="/relatorios" component={Relatorios} />
              <Route path="/parceiros" component={Parceiros} />
              <Route path="/fila-apuracao" component={FilaApuracao} />
              <Route path="/analitica" component={Analitica} />
              <Route path="/usuarios" component={Usuarios} />
              <Route path="/importacao" component={Importacao} />
              <Route path="/tarefas" component={Tarefas} />
              <Route path="/tarefas/:id" component={TarefaDetalhe} />
              <Route path="/setores" component={Setores} />
              <Route path="/arquivos" component={Arquivos} />
              <Route path="/audit-log" component={AuditLog} />
              <Route path="/api-keys" component={ApiKeys} />
              <Route path="/perfil" component={Perfil} />
              <Route path="/servicos" component={Servicos} />
              <Route path="/setor/:setorId/*" component={SetorPage} />
              <Route path="/gestao-parcerias" component={GestaoParcerias} />
              <Route path="/sla-config" component={SlaConfig} />
              <Route path="/minhas-tarefas" component={MinhasTarefas} />
              <Route path="/minha-biblioteca" component={MinhaBiblioteca} />
              <Route path="/executivos-comerciais" component={ExecutivosComerciais} />
              <Route path="/aprovacoes-comissao" component={AprovacoesComissao} />
              <Route path="/relatorio-comissoes" component={RelatorioComissoes} />
              <Route path="/chat-interno" component={ChatInterno} />
              <Route path="/rh/nova-tarefa" component={NovaTarefaGEG} />
              <Route path="/rh/colaboradores" component={ColaboradoresGEG} />
              <Route path="/rh/ferias" component={FeriasGEG} />
              <Route path="/rh/acoes-beneficios" component={AcoesBeneficios} />
              <Route path="/rh/atestados-licencas" component={AtestadosLicencas} />
              <Route path="/rh/cargos-salarios" component={CargosSalarios} />
              <Route path="/rh/carreira-desenvolvimento" component={CarreiraDesenvolvimento} />
              <Route path="/rh/avaliacao-desempenho" component={AvaliacaoDesempenho} />
              <Route path="/rh/documentos-colaborador" component={DocumentosColaborador} />
              <Route path="/rh/relatorios" component={RelatoriosRH} />
              <Route path="/rh/metas-individuais" component={MetasIndividuais} />
              <Route path="/rh/bi" component={BiRH} />
              <Route path="/rh/workflow-renovacao" component={WorkflowRenovacao} />
              <Route path="/rh/email-aniversariante" component={EmailAniversariante} />
              <Route path="/rh/dashboard" component={DashboardGEG} />
              <Route path="/rh/onboarding" component={OnboardingDigital} />
              <Route path="/rh/pesquisa-clima" component={PesquisaClima} />
              <Route path="/rh/banco-horas" component={BancoHoras} />
              <Route path="/rh/vale-transporte" component={ValeTransporteGEG} />
              <Route path="/rh/academia" component={AcademiaGEG} />
              <Route path="/rh/comissao" component={ComissaoRhGEG} />
              <Route path="/rh/day-off" component={DayOffGEG} />
              <Route path="/rh/doacao-sangue" component={DoacaoSangueGEG} />
              <Route path="/rh/reajustes" component={ReajustesGEG} />
              <Route path="/rh/apontamentos-folha" component={ApontamentosFolhaGEG} />
              <Route path="/rh/niveis-cargo" component={NiveisCargoGEG} />
              <Route path="/dashboard-comissoes" component={DashboardComissoes} />
              <Route path="/rh/gestao-hub" component={GestaoRhHub} />
              <Route path="/rh/acoes-hub" component={AcoesEvoxHub} />
              <Route path="/rh/beneficios-hub" component={BeneficiosHub} />
              <Route path="/rh/carreira-hub" component={CarreiraHub} />
              <Route path="/rh/administracao-hub" component={AdministracaoHub} />
              <Route path="/rh/biblioteca" component={BibliotecaEvox} />
              <Route path="/rh/rescisao" component={RescisaoPage} />
              <Route path="/rh/projecao-financeira" component={ProjecaoFinanceiraGEG} />
              <Route path="/suporte/conflito-carteira" component={ConflitoCarteira} />
              <Route path="/suporte/inbox" component={InboxDemandas} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </Suspense>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const publicMode = isPublicMode();

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

  // In public mode, allow access without authentication
  if (publicMode) {
    return <>{children}</>;
  }

  // In private mode, require authentication
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
