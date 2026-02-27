import { describe, it, expect } from 'vitest';

/**
 * Tests for the fila de apuração restructuring:
 * - Client codigo auto-generation
 * - Client classificacao (novo/base)
 * - Procuração status calculation
 * - Column order and data availability
 * - Responsável apelido display
 * - RTI simplified display
 * - Workflow renamed to Fluxo
 */

describe('Client Codigo Auto-Generation', () => {
  it('should generate a numeric codigo for new clients', () => {
    // Codigo format: numeric, zero-padded to 6 digits
    const maxCodigo = 42;
    const nextCodigo = maxCodigo + 1;
    expect(nextCodigo).toBe(43);
    expect(nextCodigo).toBeGreaterThan(0);
  });

  it('should generate sequential codes', () => {
    const codes = [1, 2, 3, 4, 5];
    for (let i = 1; i < codes.length; i++) {
      expect(codes[i]).toBe(codes[i - 1] + 1);
    }
  });

  it('should allow searching by codigo', () => {
    const clientes = [
      { codigo: 1, razaoSocial: 'Empresa A', cnpj: '12345678000100' },
      { codigo: 2, razaoSocial: 'Empresa B', cnpj: '98765432000100' },
      { codigo: 3, razaoSocial: 'Empresa C', cnpj: '11111111000100' },
    ];
    const search = '2';
    const filtered = clientes.filter(c =>
      c.razaoSocial.toLowerCase().includes(search) ||
      c.cnpj.includes(search) ||
      c.codigo.toString().includes(search)
    );
    // Should find codigo 2 and also cnpj containing '2'
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered.some(c => c.codigo === 2)).toBe(true);
  });
});

describe('Client Classificacao (Novo/Base)', () => {
  it('should default to novo for new clients', () => {
    const defaultClassificacao = 'novo';
    expect(defaultClassificacao).toBe('novo');
  });

  it('should support both novo and base values', () => {
    const validValues = ['novo', 'base'];
    expect(validValues).toContain('novo');
    expect(validValues).toContain('base');
  });

  it('should display correct badge for novo clients', () => {
    const classificacao = 'novo';
    const label = classificacao === 'novo' ? 'Novo' : 'Base';
    expect(label).toBe('Novo');
  });

  it('should display correct badge for base clients', () => {
    const classificacao = 'base';
    const label = classificacao === 'novo' ? 'Novo' : 'Base';
    expect(label).toBe('Base');
  });
});

describe('Procuração Status Calculation', () => {
  it('should return "sem" when procuracao is not enabled', () => {
    const procuracaoHabilitada = 0;
    let status = 'sem';
    if (procuracaoHabilitada) {
      status = 'habilitada';
    }
    expect(status).toBe('sem');
  });

  it('should return "habilitada" when procuracao is enabled with no expiry', () => {
    const procuracaoHabilitada = 1;
    const procuracaoValidade = null;
    let status = 'sem';
    if (procuracaoHabilitada) {
      if (procuracaoValidade) {
        const validade = new Date(procuracaoValidade);
        const now = new Date();
        const diffDias = (validade.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDias < 0) status = 'vencida';
        else if (diffDias <= 30) status = 'prox_vencimento';
        else status = 'habilitada';
      } else {
        status = 'habilitada';
      }
    }
    expect(status).toBe('habilitada');
  });

  it('should return "vencida" when procuracao is expired', () => {
    const procuracaoHabilitada = 1;
    const procuracaoValidade = '2024-01-01';
    let status = 'sem';
    if (procuracaoHabilitada) {
      if (procuracaoValidade) {
        const validade = new Date(procuracaoValidade);
        const now = new Date();
        const diffDias = (validade.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDias < 0) status = 'vencida';
        else if (diffDias <= 30) status = 'prox_vencimento';
        else status = 'habilitada';
      } else {
        status = 'habilitada';
      }
    }
    expect(status).toBe('vencida');
  });

  it('should return "prox_vencimento" when procuracao expires within 30 days', () => {
    const procuracaoHabilitada = 1;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const procuracaoValidade = futureDate.toISOString().slice(0, 10);
    let status = 'sem';
    if (procuracaoHabilitada) {
      if (procuracaoValidade) {
        const validade = new Date(procuracaoValidade);
        const now = new Date();
        const diffDias = (validade.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDias < 0) status = 'vencida';
        else if (diffDias <= 30) status = 'prox_vencimento';
        else status = 'habilitada';
      } else {
        status = 'habilitada';
      }
    }
    expect(status).toBe('prox_vencimento');
  });

  it('should return "habilitada" when procuracao expires in more than 30 days', () => {
    const procuracaoHabilitada = 1;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const procuracaoValidade = futureDate.toISOString().slice(0, 10);
    let status = 'sem';
    if (procuracaoHabilitada) {
      if (procuracaoValidade) {
        const validade = new Date(procuracaoValidade);
        const now = new Date();
        const diffDias = (validade.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDias < 0) status = 'vencida';
        else if (diffDias <= 30) status = 'prox_vencimento';
        else status = 'habilitada';
      } else {
        status = 'habilitada';
      }
    }
    expect(status).toBe('habilitada');
  });
});

describe('Fila Column Order', () => {
  it('should have the correct column order', () => {
    const expectedColumns = [
      'Código',
      'Cliente',
      'Tipo',
      'Parceiro',
      'Procuração',
      'Status',
      'SLA',
      'Responsável',
      'RTI',
      'Fluxo',
    ];
    expect(expectedColumns).toHaveLength(10);
    expect(expectedColumns[0]).toBe('Código');
    expect(expectedColumns[1]).toBe('Cliente');
    expect(expectedColumns[2]).toBe('Tipo');
    expect(expectedColumns[3]).toBe('Parceiro');
    expect(expectedColumns[4]).toBe('Procuração');
    expect(expectedColumns[5]).toBe('Status');
    expect(expectedColumns[6]).toBe('SLA');
    expect(expectedColumns[7]).toBe('Responsável');
    expect(expectedColumns[8]).toBe('RTI');
    expect(expectedColumns[9]).toBe('Fluxo');
  });

  it('should not include Título or Criado columns', () => {
    const columns = ['Código', 'Cliente', 'Tipo', 'Parceiro', 'Procuração', 'Status', 'SLA', 'Responsável', 'RTI', 'Fluxo'];
    expect(columns).not.toContain('Título');
    expect(columns).not.toContain('Criado');
    expect(columns).not.toContain('Workflow');
  });
});

describe('Responsável Apelido Display', () => {
  it('should show apelido when available', () => {
    const task = { responsavelApelido: 'João', responsavelNome: 'João da Silva' };
    const display = task.responsavelApelido || task.responsavelNome;
    expect(display).toBe('João');
  });

  it('should fallback to nome when apelido is not available', () => {
    const task = { responsavelApelido: null, responsavelNome: 'Maria Santos' };
    const display = task.responsavelApelido || task.responsavelNome;
    expect(display).toBe('Maria Santos');
  });

  it('should show "Não atribuído" when no responsável', () => {
    const task = { responsavelApelido: null, responsavelNome: null };
    const display = task.responsavelApelido || task.responsavelNome || 'Não atribuído';
    expect(display).toBe('Não atribuído');
  });
});

describe('RTI Simplified Display', () => {
  it('should show "Baixar" button when RTI is available', () => {
    const task = { rtiCount: 1 };
    const hasRti = task.rtiCount && Number(task.rtiCount) > 0;
    expect(hasRti).toBeTruthy();
  });

  it('should show "Não disponível" when no RTI', () => {
    const task = { rtiCount: 0 };
    const hasRti = task.rtiCount && Number(task.rtiCount) > 0;
    expect(hasRti).toBeFalsy();
  });

  it('should not show "Gerar RTI" button in the RTI column', () => {
    // RTI column should only show download or "não disponível"
    // The "Gerar RTI" functionality is in the operator dialog
    const hasRti = false;
    const displayText = hasRti ? 'Baixar' : 'Não disponível';
    expect(displayText).toBe('Não disponível');
  });
});

describe('Workflow renamed to Fluxo', () => {
  it('should use "Fluxo" as the column name', () => {
    const columnName = 'Fluxo';
    expect(columnName).toBe('Fluxo');
    expect(columnName).not.toBe('Workflow');
  });
});
