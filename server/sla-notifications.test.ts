import { describe, it, expect, vi } from 'vitest';

describe('SLA Approaching Notifications', () => {
  describe('getApproachingSLATasks function', () => {
    it('should be exported from dbCredito', async () => {
      const dbCredito = await import('./dbCredito');
      expect(typeof dbCredito.getApproachingSLATasks).toBe('function');
    });

    it('should return tasks48h and tasks24h arrays', async () => {
      const dbCredito = await import('./dbCredito');
      // The function returns a specific shape
      const result = await dbCredito.getApproachingSLATasks();
      expect(result).toHaveProperty('tasks48h');
      expect(result).toHaveProperty('tasks24h');
      expect(Array.isArray(result.tasks48h)).toBe(true);
      expect(Array.isArray(result.tasks24h)).toBe(true);
    });

    it('should return tasks with correct fields', async () => {
      const dbCredito = await import('./dbCredito');
      const result = await dbCredito.getApproachingSLATasks();
      // Even if empty, the structure should be correct
      for (const task of [...result.tasks48h, ...result.tasks24h]) {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('codigo');
        expect(task).toHaveProperty('fila');
        expect(task).toHaveProperty('titulo');
        expect(task).toHaveProperty('horasRestantes');
      }
    });
  });

  describe('RTI Versioning', () => {
    it('should export listRtiByTaskId from dbCredito', async () => {
      const dbCredito = await import('./dbCredito');
      expect(typeof dbCredito.listRtiByTaskId).toBe('function');
    });

    it('should export createRtiVersion from dbCredito', async () => {
      const dbCredito = await import('./dbCredito');
      expect(typeof dbCredito.createRtiVersion).toBe('function');
    });

    it('listRtiByTaskId should return an array for non-existent task', async () => {
      const dbCredito = await import('./dbCredito');
      const result = await dbCredito.listRtiByTaskId(999999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('updateOverdueSlaStatuses', () => {
    it('should be exported from dbCredito', async () => {
      const dbCredito = await import('./dbCredito');
      expect(typeof dbCredito.updateOverdueSlaStatuses).toBe('function');
    });

    it('should return a number (affected rows)', async () => {
      const dbCredito = await import('./dbCredito');
      const result = await dbCredito.updateOverdueSlaStatuses();
      expect(typeof result).toBe('number');
    });
  });

  describe('getOverdueCreditTasks', () => {
    it('should be exported from dbCredito', async () => {
      const dbCredito = await import('./dbCredito');
      expect(typeof dbCredito.getOverdueCreditTasks).toBe('function');
    });

    it('should return overdueTasks and summary', async () => {
      const dbCredito = await import('./dbCredito');
      const result = await dbCredito.getOverdueCreditTasks();
      expect(result).toHaveProperty('overdueTasks');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.overdueTasks)).toBe(true);
      expect(result.summary).toHaveProperty('total');
      expect(result.summary).toHaveProperty('porFila');
      expect(result.summary).toHaveProperty('porResponsavel');
    });
  });

  describe('listCreditTasks with client and partner info', () => {
    it('should be exported from dbCredito', async () => {
      const dbCredito = await import('./dbCredito');
      expect(typeof dbCredito.listCreditTasks).toBe('function');
    });

    it('should return tasks with clienteRazaoSocial and parceiroNome fields', async () => {
      const dbCredito = await import('./dbCredito');
      const result = await dbCredito.listCreditTasks('apuracao');
      expect(Array.isArray(result)).toBe(true);
      // If there are tasks, they should have the new fields
      for (const task of result) {
        expect(task).toHaveProperty('clienteNome');
        expect(task).toHaveProperty('clienteCnpj');
        expect(task).toHaveProperty('parceiroNome');
      }
    });
  });
});
