import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('v93 - Performance Optimizations', () => {
  const clientDir = path.resolve(__dirname, '../client/src');
  const appTsx = fs.readFileSync(path.join(clientDir, 'App.tsx'), 'utf-8');
  const mainTsx = fs.readFileSync(path.join(clientDir, 'main.tsx'), 'utf-8');
  const sidebarTsx = fs.readFileSync(path.join(clientDir, 'components/AppSidebar.tsx'), 'utf-8');

  describe('Lazy loading (code splitting)', () => {
    it('should lazy-load Dashboard page', () => {
      expect(appTsx).toContain('const Dashboard = lazy(');
      expect(appTsx).not.toMatch(/^import Dashboard from/m);
    });

    it('should lazy-load Clientes page', () => {
      expect(appTsx).toContain('const Clientes = lazy(');
      expect(appTsx).not.toMatch(/^import Clientes from/m);
    });

    it('should lazy-load Parceiros page', () => {
      expect(appTsx).toContain('const Parceiros = lazy(');
      expect(appTsx).not.toMatch(/^import Parceiros from/m);
    });

    it('should lazy-load Relatorios page', () => {
      expect(appTsx).toContain('const Relatorios = lazy(');
      expect(appTsx).not.toMatch(/^import Relatorios from/m);
    });

    it('should lazy-load Importacao page', () => {
      expect(appTsx).toContain('const Importacao = lazy(');
      expect(appTsx).not.toMatch(/^import Importacao from/m);
    });

    it('should lazy-load AppSidebar component', () => {
      expect(appTsx).toContain('const AppSidebar = lazy(');
      expect(appTsx).not.toMatch(/^import AppSidebar from/m);
    });

    it('should lazy-load GlobalSearch component', () => {
      expect(appTsx).toContain('const GlobalSearch = lazy(');
      expect(appTsx).not.toMatch(/^import GlobalSearch from/m);
    });

    it('should have Suspense wrapper around routes', () => {
      expect(appTsx).toContain('<Suspense');
    });
  });

  describe('Dynamic imports for heavy libraries', () => {
    it('should not have static xlsx import in Relatorios', () => {
      const relatorios = fs.readFileSync(path.join(clientDir, 'pages/Relatorios.tsx'), 'utf-8');
      expect(relatorios).not.toMatch(/^import \* as XLSX from/m);
      expect(relatorios).toContain("loadXLSX");
    });

    it('should not have static jspdf import in Relatorios', () => {
      const relatorios = fs.readFileSync(path.join(clientDir, 'pages/Relatorios.tsx'), 'utf-8');
      expect(relatorios).not.toMatch(/^import jsPDF from/m);
      expect(relatorios).toContain("loadJsPDF");
    });

    it('should not have static xlsx import in Importacao', () => {
      const importacao = fs.readFileSync(path.join(clientDir, 'pages/Importacao.tsx'), 'utf-8');
      expect(importacao).not.toMatch(/^import \* as XLSX from/m);
      expect(importacao).toContain("loadXLSX");
    });

    it('should not have static jspdf import in CreditoRelatorios', () => {
      const creditoRelatorios = fs.readFileSync(path.join(clientDir, 'pages/credito/CreditoRelatorios.tsx'), 'utf-8');
      expect(creditoRelatorios).not.toMatch(/^import jsPDF from/m);
      expect(creditoRelatorios).toContain("loadJsPDF");
    });

    it('should not have static jspdf import in DashboardComissoes', () => {
      const dashComissoes = fs.readFileSync(path.join(clientDir, 'pages/DashboardComissoes.tsx'), 'utf-8');
      expect(dashComissoes).not.toMatch(/^import jsPDF from/m);
      expect(dashComissoes).toContain("loadJsPDF");
    });

    it('should not have static xlsx import in ImportacaoColaboradores', () => {
      const importColabs = fs.readFileSync(path.join(clientDir, 'pages/rh/ImportacaoColaboradores.tsx'), 'utf-8');
      expect(importColabs).not.toMatch(/^import \* as XLSX from/m);
      expect(importColabs).toContain("loadXLSX");
    });
  });

  describe('Query optimization', () => {
    it('should have global staleTime of 30s in QueryClient', () => {
      expect(mainTsx).toContain('staleTime: 30000');
    });

    it('should disable refetchOnWindowFocus globally', () => {
      expect(mainTsx).toContain('refetchOnWindowFocus: false');
    });

    it('should have increased polling interval for chat unread (15s)', () => {
      expect(sidebarTsx).toContain('refetchInterval: 15000');
    });

    it('should have increased polling interval for notifications (60s)', () => {
      expect(sidebarTsx).toContain('refetchInterval: 60000');
    });

    it('should have staleTime for setorConfigs and setoresData', () => {
      expect(sidebarTsx).toContain('staleTime: 120000');
    });
  });

  describe('Vite build optimization', () => {
    const viteConfig = fs.readFileSync(path.resolve(__dirname, '../vite.config.ts'), 'utf-8');

    it('should have manual chunks for vendor-react', () => {
      expect(viteConfig).toContain("'vendor-react'");
    });

    it('should have manual chunks for vendor-recharts', () => {
      expect(viteConfig).toContain("'vendor-recharts'");
    });

    it('should have manual chunks for vendor-ui', () => {
      expect(viteConfig).toContain("'vendor-ui'");
    });

    it('should have manual chunks for vendor-motion', () => {
      expect(viteConfig).toContain("'vendor-motion'");
    });
  });

  describe('Backend query optimization', () => {
    const dbTs = fs.readFileSync(path.resolve(__dirname, 'db.ts'), 'utf-8');
    const routersTs = fs.readFileSync(path.resolve(__dirname, 'routers.ts'), 'utf-8');

    it('should have optimized listFilaApuracaoWithClientes with JOIN', () => {
      expect(dbTs).toContain('listFilaApuracaoWithClientes');
      expect(dbTs).toContain('leftJoin(clientes');
    });

    it('should use optimized fila query in router', () => {
      expect(routersTs).toContain('listFilaApuracaoWithClientes');
    });

    it('should limit notifications to 25', () => {
      expect(dbTs).toContain('.limit(25)');
    });
  });
});
