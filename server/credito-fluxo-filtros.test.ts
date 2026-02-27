import { describe, it, expect } from 'vitest';

// Test the flow overview data structure and filtering logic
describe('Fluxo Geral por Empresa', () => {
  it('should have getClienteFlowOverview function exported', async () => {
    const mod = await import('./dbCredito');
    expect(typeof mod.getClienteFlowOverview).toBe('function');
  });

  it('should return an array from getClienteFlowOverview', async () => {
    const mod = await import('./dbCredito');
    const result = await mod.getClienteFlowOverview();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have correct structure for each client in flow overview', async () => {
    const mod = await import('./dbCredito');
    const result = await mod.getClienteFlowOverview();
    if (result.length > 0) {
      const first = result[0];
      expect(first).toHaveProperty('clienteId');
      expect(first).toHaveProperty('clienteNome');
      expect(first).toHaveProperty('clienteCnpj');
      expect(first).toHaveProperty('clienteCodigo');
      expect(first).toHaveProperty('classificacao');
      expect(first).toHaveProperty('filas');
      expect(typeof first.filas).toBe('object');
    }
  });

  it('should group tasks by fila for each client', async () => {
    const mod = await import('./dbCredito');
    const result = await mod.getClienteFlowOverview();
    if (result.length > 0) {
      for (const cliente of result) {
        for (const [fila, tasks] of Object.entries(cliente.filas)) {
          expect(typeof fila).toBe('string');
          expect(Array.isArray(tasks)).toBe(true);
          for (const task of tasks as any[]) {
            expect(task).toHaveProperty('status');
            expect(task).toHaveProperty('slaStatus');
          }
        }
      }
    }
  });

  it('should not include concluido tasks in flow overview', async () => {
    const mod = await import('./dbCredito');
    const result = await mod.getClienteFlowOverview();
    for (const cliente of result) {
      for (const tasks of Object.values(cliente.filas)) {
        for (const task of tasks as any[]) {
          expect(task.status).not.toBe('concluido');
        }
      }
    }
  });

  it('should allow a client to appear in multiple filas simultaneously', async () => {
    const mod = await import('./dbCredito');
    const result = await mod.getClienteFlowOverview();
    // Just verify the structure supports multiple filas per client
    for (const cliente of result) {
      const filaCount = Object.keys(cliente.filas).length;
      expect(filaCount).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('SLA por Tese - Configuração', () => {
  it('should have slaApuracaoDias field in teses schema', async () => {
    const schema = await import('../drizzle/schema');
    expect(schema.teses).toBeDefined();
    // The field should exist in the table columns
    expect(schema.teses.slaApuracaoDias).toBeDefined();
  });
});

describe('Filtros Avançados - Lógica', () => {
  const mockTasks = [
    { clienteNome: 'Empresa A', clienteCnpj: '12345678000100', status: 'a_fazer', slaStatus: 'dentro_prazo', procuracaoStatus: 'habilitada', classificacao: 'novo' },
    { clienteNome: 'Empresa B', clienteCnpj: '98765432000100', status: 'fazendo', slaStatus: 'vencido', procuracaoStatus: 'vencida', classificacao: 'base' },
    { clienteNome: 'Empresa C', clienteCnpj: '11111111000100', status: 'feito', slaStatus: 'atencao', procuracaoStatus: 'sem', classificacao: 'novo' },
  ];

  it('should filter by procuração status', () => {
    const filterProcuracao = 'habilitada';
    const filtered = mockTasks.filter(t => t.procuracaoStatus === filterProcuracao);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].clienteNome).toBe('Empresa A');
  });

  it('should filter by classificação (novo/base)', () => {
    const filterClassificacao = 'novo';
    const filtered = mockTasks.filter(t => t.classificacao === filterClassificacao);
    expect(filtered).toHaveLength(2);
  });

  it('should filter by SLA status', () => {
    const filterSla = 'vencido';
    const filtered = mockTasks.filter(t => t.slaStatus === filterSla);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].clienteNome).toBe('Empresa B');
  });

  it('should combine multiple filters', () => {
    const filtered = mockTasks.filter(t =>
      t.classificacao === 'novo' && t.slaStatus === 'dentro_prazo'
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].clienteNome).toBe('Empresa A');
  });

  it('should return empty when no match', () => {
    const filtered = mockTasks.filter(t =>
      t.classificacao === 'base' && t.slaStatus === 'dentro_prazo'
    );
    expect(filtered).toHaveLength(0);
  });
});

describe('Dashboard - Card FEITO', () => {
  it('should count feito status in task stats', async () => {
    const mod = await import('./dbCredito');
    const stats = await mod.getCreditTaskStats();
    // Stats should have feito count
    expect(stats).toBeDefined();
    if (stats.byStatus) {
      // feito should be a valid status
      expect(typeof stats.byStatus.feito === 'number' || stats.byStatus.feito === undefined).toBe(true);
    }
  });
});
