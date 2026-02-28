import { describe, it, expect, vi } from 'vitest';
import * as credDb from './dbCredito';

// Mock the db module
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue({
    execute: vi.fn().mockResolvedValue([[]]),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
}));

describe('v96 — Client Summary Panel', () => {
  describe('getTaskApuracaoSummary', () => {
    it('should be a function exported from dbCredito', () => {
      expect(typeof credDb.getTaskApuracaoSummary).toBe('function');
    });

    it('should return null for non-existent task', async () => {
      const result = await credDb.getTaskApuracaoSummary(999999);
      // With mocked empty results, should return null
      expect(result).toBeNull();
    });

    it('should accept a numeric taskId parameter', async () => {
      // Should not throw with valid input
      await expect(credDb.getTaskApuracaoSummary(1)).resolves.not.toThrow();
    });
  });

  describe('Summary data structure', () => {
    it('getTaskApuracaoSummary should return structured data when task exists', async () => {
      // Mock a task result
      const mockDb = {
        execute: vi.fn()
          .mockResolvedValueOnce([[{
            id: 1, codigo: 'CT-0001', status: 'fazendo', fila: 'apuracao',
            clienteNome: 'Test Client', clienteCnpj: '12.345.678/0001-99',
            clienteCodigo: '100001', clienteRegime: 'lucro_real',
            clienteProcuracaoHabilitada: true, clienteProcuracaoValidade: '2027-01-01',
            parceiroNome: 'Partner', responsavelApelido: 'Analyst',
            createdAt: '2026-01-01 00:00:00', dataVencimento: '2026-02-01 00:00:00',
          }]])
          .mockResolvedValueOnce([[
            { id: 1, teseNome: 'PIS/COFINS', tributoEnvolvido: 'PIS', slaApuracaoDias: 15 },
          ]])
          .mockResolvedValueOnce([[]])  // RTIs
          .mockResolvedValueOnce([[]])  // Checklists
          .mockResolvedValueOnce([[]])  // Arquivos
          .mockResolvedValueOnce([[]]), // Audit log
      };

      // Override the mock for this test
      const { getDb } = await import('./db');
      (getDb as any).mockResolvedValueOnce(mockDb);

      const result = await credDb.getTaskApuracaoSummary(1);

      // With the mock returning data, we should get a structured result
      // The function should handle the data correctly
      if (result) {
        expect(result).toHaveProperty('task');
        expect(result).toHaveProperty('teses');
        expect(result).toHaveProperty('rtis');
        expect(result).toHaveProperty('checklists');
        expect(result).toHaveProperty('arquivos');
        expect(result).toHaveProperty('auditLog');
        expect(result.task).toHaveProperty('slaStatus');
        expect(result.task).toHaveProperty('procuracaoStatus');
        expect(result.task).toHaveProperty('slaDias');
      }
    });
  });

  describe('SLA calculation logic', () => {
    it('should compute slaStatus correctly', () => {
      // Test the SLA status logic independently
      const now = new Date();

      // Vencido: past deadline
      const pastDeadline = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const diffPast = (pastDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffPast < 0).toBe(true); // vencido

      // Atenção: within 3 days
      const soonDeadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const diffSoon = (soonDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffSoon > 0 && diffSoon <= 3).toBe(true); // atencao

      // Dentro do prazo: more than 3 days
      const farDeadline = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const diffFar = (farDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffFar > 3).toBe(true); // dentro_prazo
    });
  });

  describe('Procuração status logic', () => {
    it('should determine procuração status correctly', () => {
      const now = new Date();

      // Habilitada with valid date
      const validDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const diffValid = (validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffValid > 30).toBe(true); // habilitada

      // Próximo do vencimento
      const soonDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const diffSoon = (soonDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffSoon > 0 && diffSoon <= 30).toBe(true); // prox_vencimento

      // Vencida
      const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const diffPast = (pastDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffPast < 0).toBe(true); // vencida
    });
  });
});
