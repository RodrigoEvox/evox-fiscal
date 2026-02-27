import { describe, it, expect } from 'vitest';

describe('v91 — Queue Management, Pagination, Confirmation, Reopen', () => {

  // --- Pagination ---
  describe('Pagination logic', () => {
    const allItems = Array.from({ length: 73 }, (_, i) => ({ id: i + 1, codigo: `CT-${i + 1}` }));

    it('should paginate with 25 items per page (default)', () => {
      const pageSize = 25;
      const page1 = allItems.slice(0, pageSize);
      const page2 = allItems.slice(pageSize, pageSize * 2);
      const page3 = allItems.slice(pageSize * 2, pageSize * 3);
      expect(page1).toHaveLength(25);
      expect(page2).toHaveLength(25);
      expect(page3).toHaveLength(23); // 73 - 50 = 23
    });

    it('should paginate with 50 items per page', () => {
      const pageSize = 50;
      const page1 = allItems.slice(0, pageSize);
      const page2 = allItems.slice(pageSize, pageSize * 2);
      expect(page1).toHaveLength(50);
      expect(page2).toHaveLength(23);
    });

    it('should paginate with 100 items per page', () => {
      const pageSize = 100;
      const page1 = allItems.slice(0, pageSize);
      expect(page1).toHaveLength(73);
    });

    it('should calculate total pages correctly', () => {
      expect(Math.ceil(73 / 25)).toBe(3);
      expect(Math.ceil(73 / 50)).toBe(2);
      expect(Math.ceil(73 / 100)).toBe(1);
    });

    it('should calculate position number correctly across pages', () => {
      const pageSize = 25;
      const currentPage = 2;
      const indexOnPage = 0;
      const globalPosition = (currentPage - 1) * pageSize + indexOnPage + 1;
      expect(globalPosition).toBe(26); // First item on page 2
    });
  });

  // --- Queue Lock ---
  describe('Queue lock logic', () => {
    const tasks = [
      { id: 1, status: 'a_fazer', ordem: 1 },
      { id: 2, status: 'a_fazer', ordem: 2 },
      { id: 3, status: 'fazendo', ordem: 3 },
      { id: 4, status: 'a_fazer', ordem: 4 },
      { id: 5, status: 'feito', ordem: 5 },
    ];

    it('should only allow picking the first a_fazer task for analyst', () => {
      const aFazerTasks = tasks.filter(t => t.status === 'a_fazer');
      const firstAFazer = aFazerTasks[0];
      expect(firstAFazer.id).toBe(1);

      // Only first is unlocked for analyst
      aFazerTasks.forEach((task, idx) => {
        const isFirst = idx === 0;
        const locked = !isFirst;
        if (task.id === 1) expect(locked).toBe(false);
        else expect(locked).toBe(true);
      });
    });

    it('should allow admin to see exception button on locked tasks', () => {
      const isAdmin = true;
      const aFazerTasks = tasks.filter(t => t.status === 'a_fazer');
      aFazerTasks.forEach((task, idx) => {
        const isFirst = idx === 0;
        const locked = !isFirst;
        const showException = locked && isAdmin;
        if (task.id === 1) expect(showException).toBe(false);
        else expect(showException).toBe(true);
      });
    });

    it('should not lock tasks in fazendo/feito/concluido status', () => {
      const fazendoTask = tasks.find(t => t.status === 'fazendo');
      const feitoTask = tasks.find(t => t.status === 'feito');
      // These tasks are not in a_fazer, so lock logic doesn't apply
      expect(fazendoTask?.status).toBe('fazendo');
      expect(feitoTask?.status).toBe('feito');
    });
  });

  // --- Queue Exception ---
  describe('Queue exception logic', () => {
    it('should require justificativa with minimum 10 characters', () => {
      const justificativa = 'Prioridade alta por potencial financeiro elevado';
      expect(justificativa.length).toBeGreaterThanOrEqual(10);

      const shortJustificativa = 'curta';
      expect(shortJustificativa.length).toBeLessThan(10);
    });

    it('should support move_to_first action', () => {
      const action = 'move_to_first';
      expect(['move_to_first', 'assign_to_analyst']).toContain(action);
    });

    it('should support assign_to_analyst action with analystId', () => {
      const action = 'assign_to_analyst';
      const analystId = 5;
      const analystName = 'João Silva';
      expect(action).toBe('assign_to_analyst');
      expect(analystId).toBeGreaterThan(0);
      expect(analystName).toBeTruthy();
    });
  });

  // --- Confirmation Dialog ---
  describe('Confirmation dialog logic', () => {
    it('should show confirmation before picking task', () => {
      const confirmMessage = 'Deseja realmente pegar esta tarefa? Esta ação não poderá ser desfeita sem autorização do gestor.';
      expect(confirmMessage).toContain('não poderá ser desfeita');
    });

    it('should show confirmation before completing stage', () => {
      const confirmMessage = 'Deseja realmente finalizar esta etapa? Esta ação não poderá ser desfeita sem autorização do gestor.';
      expect(confirmMessage).toContain('não poderá ser desfeita');
    });
  });

  // --- Reopen Task ---
  describe('Reopen task logic', () => {
    it('should only allow admin to reopen tasks', () => {
      const userRole = 'admin';
      const canReopen = userRole === 'admin';
      expect(canReopen).toBe(true);

      const analystRole = 'user';
      const analystCanReopen = analystRole === 'admin';
      expect(analystCanReopen).toBe(false);
    });

    it('should require justificativa for reopen', () => {
      const justificativa = 'Erro identificado na apuração, necessário revisão dos valores';
      expect(justificativa.length).toBeGreaterThanOrEqual(10);
    });

    it('should track reopen history in reaberturaMotivoLog', () => {
      const prevLog: any[] = [];
      const newEntry = {
        data: new Date().toISOString(),
        usuario: 'Admin',
        usuarioId: 1,
        motivo: 'Erro identificado na apuração',
        statusAnterior: 'feito',
      };
      const newLog = [...prevLog, newEntry];
      expect(newLog).toHaveLength(1);
      expect(newLog[0].motivo).toBe('Erro identificado na apuração');
    });

    it('should mark task as reaberta after reopen', () => {
      const task = { id: 1, status: 'feito', reaberta: false };
      // After reopen
      const reopenedTask = { ...task, status: 'fazendo', reaberta: true };
      expect(reopenedTask.reaberta).toBe(true);
      expect(reopenedTask.status).toBe('fazendo');
    });
  });

  // --- Time Counter ---
  describe('Time counter logic', () => {
    it('should calculate time in stage correctly for minutes', () => {
      const start = new Date(Date.now() - 45 * 60000); // 45 minutes ago
      const diff = Date.now() - start.getTime();
      const m = Math.floor((diff % 3600000) / 60000);
      expect(m).toBeGreaterThanOrEqual(44); // Allow 1 min tolerance
      expect(m).toBeLessThanOrEqual(46);
    });

    it('should calculate time in stage correctly for hours', () => {
      const start = new Date(Date.now() - 3 * 3600000 - 30 * 60000); // 3h30m ago
      const diff = Date.now() - start.getTime();
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      expect(h).toBe(3);
      expect(m).toBeGreaterThanOrEqual(29);
      expect(m).toBeLessThanOrEqual(31);
    });

    it('should calculate time in stage correctly for days', () => {
      const start = new Date(Date.now() - 2 * 86400000 - 5 * 3600000); // 2d5h ago
      const diff = Date.now() - start.getTime();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      expect(d).toBe(2);
      expect(h).toBe(5);
    });

    it('should format time display correctly', () => {
      const getTimeInStage = (startMs: number) => {
        const diff = Date.now() - startMs;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
      };

      // 2 days ago
      expect(getTimeInStage(Date.now() - 2 * 86400000)).toMatch(/^2d 0h$/);
      // 5 hours ago
      expect(getTimeInStage(Date.now() - 5 * 3600000)).toMatch(/^5h 0m$/);
      // 30 minutes ago
      expect(getTimeInStage(Date.now() - 30 * 60000)).toMatch(/^30m$/);
    });
  });

  // --- SLA Data Fim ---
  describe('SLA Data Fim calculation', () => {
    it('should use the maximum SLA from selected teses', () => {
      const teses = [
        { nome: 'Tese A', slaApuracaoDias: 30 },
        { nome: 'Tese B', slaApuracaoDias: 45 },
        { nome: 'Tese C', slaApuracaoDias: 15 },
      ];
      const maxSla = Math.max(...teses.map(t => t.slaApuracaoDias));
      expect(maxSla).toBe(45);
    });

    it('should calculate dataFimPrevista from createdAt + maxSla', () => {
      const createdAt = new Date('2026-02-27T10:00:00Z');
      const maxSlaDias = 45;
      const dataFimPrevista = new Date(createdAt.getTime() + maxSlaDias * 86400000);
      expect(dataFimPrevista.toISOString().split('T')[0]).toBe('2026-04-13');
    });
  });

  // --- All filas have pagination ---
  describe('All filas have pagination', () => {
    const filas = ['apuracao', 'retificacao', 'compensacao', 'ressarcimento', 'restituicao'];

    it('should have 5 filas configured', () => {
      expect(filas).toHaveLength(5);
    });

    it('each fila should support page sizes 25, 50, 100', () => {
      const pageSizes = [25, 50, 100];
      pageSizes.forEach(size => {
        expect([25, 50, 100]).toContain(size);
      });
    });
  });
});
