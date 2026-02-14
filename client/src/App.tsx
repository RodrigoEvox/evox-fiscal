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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/clientes/:id" component={ClienteDetalhe} />
      <Route path="/teses" component={Teses} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/parceiros" component={Parceiros} />
      <Route path="/fila" component={FilaApuracao} />
      <Route path="/analitica" component={Analitica} />
      <Route path="/usuarios" component={Usuarios} />
      <Route path="/importacao" component={Importacao} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
              <main className="flex-1 p-6 overflow-auto bg-background">
                <Router />
              </main>
            </div>
          </AuthGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
