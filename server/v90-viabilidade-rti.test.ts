import { describe, it, expect } from 'vitest';

describe('v90 — Correção de Erros e Ajuste de Viabilidade', () => {
  describe('Schema Fix: viabilidade column', () => {
    it('should use "viabilidade" as the column name (not viabilidade_ct)', async () => {
      const schemaContent = await import('fs').then(fs => 
        fs.readFileSync('./drizzle/schema.ts', 'utf-8')
      );
      // Must NOT have viabilidade_ct as a custom enum name
      expect(schemaContent).not.toContain("mysqlEnum('viabilidade_ct'");
      // Must have viabilidade as a simple enum
      expect(schemaContent).toContain("viabilidade: mysqlEnum(['viavel','inviavel'])");
    });

    it('should have viabilidade and valorGlobalApurado in credit_tasks schema', async () => {
      const schemaContent = await import('fs').then(fs => 
        fs.readFileSync('./drizzle/schema.ts', 'utf-8')
      );
      expect(schemaContent).toContain('viabilidade:');
      expect(schemaContent).toContain('valorGlobalApurado:');
    });
  });

  describe('Remove valorEstimado from tese analysis', () => {
    it('should not calculate valorEstimado in routers.ts analyzeTeses', async () => {
      const routersContent = await import('fs').then(fs => 
        fs.readFileSync('./server/routers.ts', 'utf-8')
      );
      // The analyzeTeses section should not have valorEstimado calculation
      const analyzeSection = routersContent.split('tesesAplicaveis')[1]?.split('tesesDescartadas')[0] || '';
      expect(analyzeSection).not.toContain('Math.round(base * mult');
    });

    it('should not calculate valorEstimado in dbCredito analyzeTeses', async () => {
      const dbContent = await import('fs').then(fs => 
        fs.readFileSync('./server/dbCredito.ts', 'utf-8')
      );
      // The analyzeTeses function should not have valorEstimado calculation
      const analyzeSection = dbContent.split('export async function analyzeTeses')[1]?.split('export async function')[0] || '';
      expect(analyzeSection).not.toContain('Math.round(base * mult');
    });

    it('should not show valorEstimado in CreditoNovaTarefa UI', async () => {
      const pageContent = await import('fs').then(fs => 
        fs.readFileSync('./client/src/pages/credito/CreditoNovaTarefa.tsx', 'utf-8')
      );
      // Should not display "estimado" label next to tese items
      expect(pageContent).not.toContain('<p className="text-[10px] text-muted-foreground">estimado</p>');
      // Should not show "Valor estimado total" in the summary
      expect(pageContent).not.toContain('Valor estimado total');
    });
  });

  describe('Viabilidade based on RTI value', () => {
    it('should use RTI reports to calculate viabilidade in finishTask', async () => {
      const routersContent = await import('fs').then(fs => 
        fs.readFileSync('./server/routersCredito.ts', 'utf-8')
      );
      // Should reference listRtisByTask for value calculation
      expect(routersContent).toContain('listRtisByTask');
      // Should reference valorTotalApurado from RTI
      expect(routersContent).toContain('valorTotalApurado');
    });

    it('should have listRtisByTask function in dbCredito', async () => {
      const dbContent = await import('fs').then(fs => 
        fs.readFileSync('./server/dbCredito.ts', 'utf-8')
      );
      expect(dbContent).toContain('export async function listRtisByTask');
      expect(dbContent).toContain('rtiReports');
    });

    it('should auto-calculate viabilidade: >= 20000 viavel, < 20000 inviavel', async () => {
      const routersContent = await import('fs').then(fs => 
        fs.readFileSync('./server/routersCredito.ts', 'utf-8')
      );
      expect(routersContent).toContain("valorGlobal >= 20000 ? 'viavel' : 'inviavel'");
    });

    it('should show RTI-based description in finish dialog', async () => {
      const pageContent = await import('fs').then(fs => 
        fs.readFileSync('./client/src/pages/credito/CreditoFilaApuracao.tsx', 'utf-8')
      );
      expect(pageContent).toContain('Valor real apurado no RTI');
      expect(pageContent).toContain('Baseado no valor real apurado no RTI');
    });
  });

  describe('Viabilidade filter in fila', () => {
    it('should have viabilidade filter state and UI', async () => {
      const pageContent = await import('fs').then(fs => 
        fs.readFileSync('./client/src/pages/credito/CreditoFilaApuracao.tsx', 'utf-8')
      );
      expect(pageContent).toContain('viabilidadeFilter');
      expect(pageContent).toContain('setViabilidadeFilter');
    });

    it('should filter tasks by viabilidade', async () => {
      const pageContent = await import('fs').then(fs => 
        fs.readFileSync('./client/src/pages/credito/CreditoFilaApuracao.tsx', 'utf-8')
      );
      expect(pageContent).toContain("viabilidadeFilter !== 'all'");
      expect(pageContent).toContain('t.viabilidade === viabilidadeFilter');
    });
  });
});
