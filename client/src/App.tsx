import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Teses from "./pages/Teses";
import Analise from "./pages/Analise";
import Relatorios from "./pages/Relatorios";
import Parceiros from "./pages/Parceiros";
import FilaApuracao from "./pages/FilaApuracao";
import Analitica from "./pages/Analitica";
import Sidebar from "./components/Sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/teses" component={Teses} />
      <Route path="/analise" component={Analise} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/parceiros" component={Parceiros} />
      <Route path="/fila" component={FilaApuracao} />
      <Route path="/analitica" component={Analitica} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 p-6 overflow-auto">
                <Router />
              </main>
            </div>
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
