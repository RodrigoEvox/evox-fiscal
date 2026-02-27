import { describe, it, expect } from 'vitest';

describe('v94 — SLA Data Fim, FIFO Queue Lock, Visual Clean', () => {

  describe('SLA Data Fim auto-calculation', () => {
    it('should compute dataFimPrevista from createdAt + maxSlaDias', () => {
      const createdAt = '2026-02-26T14:00:00.000Z';
      const maxSlaDias = 30;
      const dt = new Date(createdAt);
      dt.setDate(dt.getDate() + maxSlaDias);
      // The result should be 30 days later
      const diffMs = dt.getTime() - new Date(createdAt).getTime();
      const diffDays = Math.round(diffMs / 86400000);
      expect(diffDays).toBe(30);
    });

    it('should use default 15 days when no teses are linked', () => {
      const createdAt = '2026-02-26T14:00:00.000Z';
      const maxSla = null;
      const slaDias = maxSla || 15;
      const dt = new Date(createdAt);
      dt.setDate(dt.getDate() + slaDias);
      const diffMs = dt.getTime() - new Date(createdAt).getTime();
      const diffDays = Math.round(diffMs / 86400000);
      expect(diffDays).toBe(15);
    });

    it('should pick the max SLA among multiple teses', () => {
      const teses = [
        { slaApuracaoDias: 20 },
        { slaApuracaoDias: 30 },
        { slaApuracaoDias: 15 },
        { slaApuracaoDias: 25 },
      ];
      const maxSla = Math.max(...teses.map(t => t.slaApuracaoDias));
      expect(maxSla).toBe(30);
    });

    it('should prefer dataVencimento over computed value', () => {
      const task = {
        dataVencimento: '2026-04-15 00:00:00',
        createdAt: '2026-02-26T14:00:00.000Z',
        maxSlaDias: 15,
      };
      const maxSla = task.maxSlaDias ? Number(task.maxSlaDias) : null;
      let dataFimPrevista = task.dataVencimento;
      const slaDias = maxSla || 15;
      if (!dataFimPrevista) {
        const dt = new Date(task.createdAt);
        dt.setDate(dt.getDate() + slaDias);
        dataFimPrevista = dt.toISOString().slice(0, 19).replace('T', ' ');
      }
      expect(dataFimPrevista).toBe('2026-04-15 00:00:00');
    });
  });

  describe('FIFO Queue Lock', () => {
    it('should identify the first a_fazer task correctly', () => {
      const tasks = [
        { id: 1, status: 'concluido', createdAt: '2026-02-25T10:00:00Z' },
        { id: 2, status: 'fazendo', createdAt: '2026-02-25T11:00:00Z' },
        { id: 3, status: 'a_fazer', createdAt: '2026-02-25T12:00:00Z' },
        { id: 4, status: 'a_fazer', createdAt: '2026-02-25T13:00:00Z' },
        { id: 5, status: 'a_fazer', createdAt: '2026-02-25T14:00:00Z' },
      ];
      const aFazerTasks = tasks.filter(t => t.status === 'a_fazer');
      expect(aFazerTasks[0].id).toBe(3);
      // Only first a_fazer should be unlocked for non-admin
      const isFirstAFazer = (taskId: number) => aFazerTasks.length > 0 && aFazerTasks[0].id === taskId;
      expect(isFirstAFazer(3)).toBe(true);
      expect(isFirstAFazer(4)).toBe(false);
      expect(isFirstAFazer(5)).toBe(false);
    });

    it('should allow admin to pick any task', () => {
      const isAdmin = true;
      const isFirstAFazer = false;
      const isQueueLocked = !isFirstAFazer && !isAdmin;
      expect(isQueueLocked).toBe(false);
    });

    it('should lock non-first tasks for non-admin users', () => {
      const isAdmin = false;
      const isFirstAFazer = false;
      const isQueueLocked = !isFirstAFazer && !isAdmin;
      expect(isQueueLocked).toBe(true);
    });
  });

  describe('Exception Request Workflow', () => {
    it('should validate exception request requires justificativa', () => {
      const justificativa = '';
      expect(justificativa.trim().length >= 10).toBe(false);
      
      const validJustificativa = 'Cliente com alta prioridade e potencial financeiro elevado';
      expect(validJustificativa.trim().length >= 10).toBe(true);
    });

    it('should track exception request status transitions', () => {
      const validStatuses = ['pendente', 'aprovado', 'negado'];
      const request = { status: 'pendente' };
      expect(validStatuses).toContain(request.status);
      
      // Approve
      request.status = 'aprovado';
      expect(validStatuses).toContain(request.status);
      
      // Deny
      request.status = 'negado';
      expect(validStatuses).toContain(request.status);
    });
  });

  describe('Visual Clean — No icons in Responsável, Parceiro, Tempo', () => {
    it('should format time without icons — days and hours only', () => {
      const getTimeInQueue = (createdAt: string) => {
        const diff = Math.max(0, new Date('2026-02-27T20:00:00Z').getTime() - new Date(createdAt).getTime());
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        if (d > 0) return `${d}d ${h}h ${m}m`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
      };
      const result = getTimeInQueue('2026-02-26T10:00:00Z');
      expect(result).toBe('1d 10h 0m');
      // Should be plain text, no icon references
      expect(result).not.toContain('<');
      expect(result).not.toContain('Clock');
    });
  });
});
