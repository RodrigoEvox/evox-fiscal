import { describe, it, expect } from 'vitest';

describe('v98 — ClientSummaryPanel Enhancements', () => {
  describe('Quick Actions', () => {
    it('should have assign analyst action in summary panel', async () => {
      // The ClientSummaryPanel component includes an "Atribuir Analista" quick action
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/ClientSummaryPanel.tsx', 'utf-8');
      expect(content).toContain('Atribuir Analista');
      expect(content).toContain('handleAssignAnalyst');
    });

    it('should have change priority action in summary panel', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/ClientSummaryPanel.tsx', 'utf-8');
      expect(content).toContain('Alterar Prioridade');
      expect(content).toContain('handleChangePriority');
    });

    it('should have add observation action in summary panel', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/ClientSummaryPanel.tsx', 'utf-8');
      expect(content).toContain('Adicionar Observação');
      expect(content).toContain('handleAddObservation');
    });
  });

  describe('PDF Export', () => {
    it('should have PDF export button in summary panel', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/ClientSummaryPanel.tsx', 'utf-8');
      expect(content).toContain('Exportar PDF');
      expect(content).toContain('handleExportPdf');
    });

    it('should generate PDF with client data', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('client/src/components/ClientSummaryPanel.tsx', 'utf-8');
      // PDF generation uses window.print or a canvas-based approach
      expect(content).toMatch(/window\.print|jspdf|html2canvas|printRef/i);
    });
  });

  describe('Visual Indicator', () => {
    it('should have Eye icon indicator on client name in all 5 queues', async () => {
      const fs = await import('fs');
      const queues = [
        'CreditoFilaApuracao',
        'CreditoFilaRetificacao',
        'CreditoFilaCompensacao',
        'CreditoFilaRessarcimento',
        'CreditoFilaRestituicao',
      ];
      for (const queue of queues) {
        const content = fs.readFileSync(`client/src/pages/credito/${queue}.tsx`, 'utf-8');
        expect(content, `${queue} should have Eye icon`).toContain('Eye className=');
        expect(content, `${queue} should have tooltip`).toContain('Clique para ver resumo completo');
        expect(content, `${queue} should have setSummaryTaskId`).toContain('setSummaryTaskId');
      }
    });

    it('should show CNPJ below client name when available', async () => {
      const fs = await import('fs');
      const queues = [
        'CreditoFilaRetificacao',
        'CreditoFilaCompensacao',
        'CreditoFilaRessarcimento',
        'CreditoFilaRestituicao',
      ];
      for (const queue of queues) {
        const content = fs.readFileSync(`client/src/pages/credito/${queue}.tsx`, 'utf-8');
        expect(content, `${queue} should show clienteCnpj`).toContain('task.clienteCnpj');
      }
    });
  });

  describe('Shared Component Integration', () => {
    it('should import ClientSummaryPanel in all 5 queues', async () => {
      const fs = await import('fs');
      const queues = [
        'CreditoFilaApuracao',
        'CreditoFilaRetificacao',
        'CreditoFilaCompensacao',
        'CreditoFilaRessarcimento',
        'CreditoFilaRestituicao',
      ];
      for (const queue of queues) {
        const content = fs.readFileSync(`client/src/pages/credito/${queue}.tsx`, 'utf-8');
        expect(content, `${queue} should import ClientSummaryPanel`).toContain("import ClientSummaryPanel from '@/components/ClientSummaryPanel'");
      }
    });

    it('should render ClientSummaryPanel with correct props in all queues', async () => {
      const fs = await import('fs');
      const queues = [
        'CreditoFilaApuracao',
        'CreditoFilaRetificacao',
        'CreditoFilaCompensacao',
        'CreditoFilaRessarcimento',
        'CreditoFilaRestituicao',
      ];
      for (const queue of queues) {
        const content = fs.readFileSync(`client/src/pages/credito/${queue}.tsx`, 'utf-8');
        expect(content, `${queue} should render ClientSummaryPanel`).toContain('<ClientSummaryPanel');
        expect(content, `${queue} should pass taskId`).toContain('taskId={summaryTaskId');
      }
    });
  });
});
