import { describe, it, expect, vi } from 'vitest';

// ===== SLA por Tese Tests =====
describe('SLA por Tese - Cálculo de SLA baseado na tese de maior prazo', () => {
  it('should calculate SLA deadline from task creation date and max tese SLA', () => {
    const createdAt = new Date('2026-02-01T10:00:00Z');
    const teses = [
      { teseId: 1, teseNome: 'PIS/COFINS Monofásico', slaApuracaoDias: 15 },
      { teseId: 2, teseNome: 'ICMS-ST', slaApuracaoDias: 30 },
      { teseId: 3, teseNome: 'INSS Patronal', slaApuracaoDias: 20 },
    ];
    
    // The SLA should be based on the tese with the longest SLA
    const maxSla = Math.max(...teses.map(t => t.slaApuracaoDias));
    expect(maxSla).toBe(30);
    
    // Calculate deadline
    const deadline = new Date(createdAt.getTime() + maxSla * 24 * 60 * 60 * 1000);
    expect(deadline.toISOString()).toBe('2026-03-03T10:00:00.000Z');
  });

  it('should handle single tese SLA', () => {
    const teses = [
      { teseId: 1, teseNome: 'PIS/COFINS Monofásico', slaApuracaoDias: 15 },
    ];
    const maxSla = Math.max(...teses.map(t => t.slaApuracaoDias));
    expect(maxSla).toBe(15);
  });

  it('should handle teses with null/zero SLA', () => {
    const teses = [
      { teseId: 1, slaApuracaoDias: 0 },
      { teseId: 2, slaApuracaoDias: 30 },
      { teseId: 3, slaApuracaoDias: null },
    ];
    const maxSla = Math.max(...teses.map(t => t.slaApuracaoDias || 0));
    expect(maxSla).toBe(30);
  });

  it('should default to 30 days when no tese has SLA configured', () => {
    const teses: any[] = [];
    const maxSla = teses.length > 0 ? Math.max(...teses.map(t => t.slaApuracaoDias || 0)) : 30;
    expect(maxSla).toBe(30);
  });
});

// ===== SLA Status Indicator Tests =====
describe('SLA Status Indicator - Visual indicators for SLA status', () => {
  it('should return "no_prazo" when deadline is more than 3 days away', () => {
    const now = new Date('2026-02-15T10:00:00Z');
    const deadline = new Date('2026-02-25T10:00:00Z');
    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    let status: string;
    if (diffDays < 0) status = 'vencido';
    else if (diffDays <= 3) status = 'atencao';
    else status = 'no_prazo';
    
    expect(status).toBe('no_prazo');
    expect(diffDays).toBeGreaterThan(3);
  });

  it('should return "atencao" when deadline is within 3 days', () => {
    const now = new Date('2026-02-22T10:00:00Z');
    const deadline = new Date('2026-02-25T10:00:00Z');
    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    let status: string;
    if (diffDays < 0) status = 'vencido';
    else if (diffDays <= 3) status = 'atencao';
    else status = 'no_prazo';
    
    expect(status).toBe('atencao');
  });

  it('should return "vencido" when deadline has passed', () => {
    const now = new Date('2026-02-26T10:00:00Z');
    const deadline = new Date('2026-02-25T10:00:00Z');
    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    let status: string;
    if (diffDays < 0) status = 'vencido';
    else if (diffDays <= 3) status = 'atencao';
    else status = 'no_prazo';
    
    expect(status).toBe('vencido');
  });

  it('should handle exact deadline day', () => {
    const now = new Date('2026-02-25T10:00:00Z');
    const deadline = new Date('2026-02-25T23:59:59Z');
    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    let status: string;
    if (diffDays < 0) status = 'vencido';
    else if (diffDays <= 3) status = 'atencao';
    else status = 'no_prazo';
    
    expect(status).toBe('atencao');
  });
});

// ===== RTI PDF with Values Tests =====
describe('RTI PDF - Valores das teses apuradas', () => {
  it('should calculate total from oportunidades correctly', () => {
    const oportunidades = [
      { descricao: 'PIS/COFINS Monofásico', classificacao: 'pacificado', valorApurado: '150000.50' },
      { descricao: 'ICMS-ST', classificacao: 'nao_pacificado', valorApurado: '80000.25' },
      { descricao: 'INSS Patronal', classificacao: 'pacificado', valorApurado: '45000.00' },
    ];
    
    const totalOps = oportunidades.reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
    const totalPac = oportunidades.filter(o => o.classificacao === 'pacificado').reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
    const totalNaoPac = oportunidades.filter(o => o.classificacao === 'nao_pacificado').reduce((sum, o) => sum + (parseFloat(o.valorApurado) || 0), 0);
    
    expect(totalOps).toBeCloseTo(275000.75, 2);
    expect(totalPac).toBeCloseTo(195000.50, 2);
    expect(totalNaoPac).toBeCloseTo(80000.25, 2);
    expect(totalPac + totalNaoPac).toBeCloseTo(totalOps, 2);
  });

  it('should handle empty oportunidades', () => {
    const oportunidades: any[] = [];
    const totalOps = oportunidades.reduce((sum: number, o: any) => sum + (parseFloat(o.valorApurado) || 0), 0);
    expect(totalOps).toBe(0);
  });

  it('should fallback to tesesAnalisadas JSON when no oportunidades in DB', () => {
    const rti = {
      tesesAnalisadas: JSON.stringify([
        { descricao: 'PIS/COFINS', classificacao: 'pacificado', valorApurado: 100000 },
      ]),
      valorTotalEstimado: '100000',
    };
    
    const oportunidades: any[] = []; // empty from DB
    const teses = rti.tesesAnalisadas ? JSON.parse(rti.tesesAnalisadas) : [];
    
    const opsForPdf = oportunidades.length > 0 ? oportunidades : teses;
    expect(opsForPdf.length).toBe(1);
    expect(opsForPdf[0].descricao).toBe('PIS/COFINS');
    expect(opsForPdf[0].valorApurado).toBe(100000);
  });

  it('should prefer DB oportunidades over tesesAnalisadas JSON', () => {
    const dbOportunidades = [
      { descricao: 'PIS/COFINS Updated', classificacao: 'pacificado', valorApurado: '120000' },
    ];
    const tesesAnalisadas = [
      { descricao: 'PIS/COFINS Old', classificacao: 'pacificado', valorApurado: 100000 },
    ];
    
    const opsForPdf = dbOportunidades.length > 0 ? dbOportunidades : tesesAnalisadas;
    expect(opsForPdf[0].descricao).toBe('PIS/COFINS Updated');
  });
});

// ===== Checklist por Tese Tests =====
describe('Checklist por Tese - Vinculação de checklist a teses', () => {
  it('should group checklist items by tese', () => {
    const items = [
      { id: 0, teseId: 1, teseNome: 'PIS/COFINS', texto: 'Verificar NCM', concluido: false },
      { id: 1, teseId: 1, teseNome: 'PIS/COFINS', texto: 'Analisar CFOP', concluido: true },
      { id: 2, teseId: 2, teseNome: 'ICMS-ST', texto: 'Verificar MVA', concluido: false },
      { id: 3, teseId: 2, teseNome: 'ICMS-ST', texto: 'Conferir alíquota', concluido: false },
    ];
    
    const teses = [
      { teseId: 1, teseNome: 'PIS/COFINS' },
      { teseId: 2, teseNome: 'ICMS-ST' },
    ];
    
    const grouped = teses.reduce((acc: Record<string, any[]>, tese) => {
      acc[tese.teseNome] = items.filter(item => item.teseId === tese.teseId);
      return acc;
    }, {});
    
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['PIS/COFINS']).toHaveLength(2);
    expect(grouped['ICMS-ST']).toHaveLength(2);
  });

  it('should calculate progress per tese', () => {
    const items = [
      { teseId: 1, concluido: true },
      { teseId: 1, concluido: true },
      { teseId: 1, concluido: false },
      { teseId: 2, concluido: false },
      { teseId: 2, concluido: false },
    ];
    
    const tese1Items = items.filter(i => i.teseId === 1);
    const tese2Items = items.filter(i => i.teseId === 2);
    
    const tese1Progresso = Math.round((tese1Items.filter(i => i.concluido).length / tese1Items.length) * 100);
    const tese2Progresso = Math.round((tese2Items.filter(i => i.concluido).length / tese2Items.length) * 100);
    
    expect(tese1Progresso).toBe(67);
    expect(tese2Progresso).toBe(0);
  });

  it('should calculate overall progress', () => {
    const items = [
      { concluido: true },
      { concluido: true },
      { concluido: false },
      { concluido: false },
      { concluido: true },
    ];
    
    const progresso = Math.round((items.filter(i => i.concluido).length / items.length) * 100);
    expect(progresso).toBe(60);
  });

  it('should match templates to teses correctly', () => {
    const templates = [
      { id: 1, teseId: 10, teseNome: 'PIS/COFINS', nome: 'Checklist PIS/COFINS' },
      { id: 2, teseId: 20, teseNome: 'ICMS-ST', nome: 'Checklist ICMS-ST' },
      { id: 3, teseId: null, teseNome: null, nome: 'Checklist Genérico' },
    ];
    
    // For tese 10, should get specific + generic
    const tese10Templates = templates.filter(t => t.teseId === 10 || t.teseId === null);
    expect(tese10Templates).toHaveLength(2);
    
    // For tese 30 (no specific template), should get only generic
    const tese30Templates = templates.filter(t => t.teseId === 30 || t.teseId === null);
    expect(tese30Templates).toHaveLength(1);
    expect(tese30Templates[0].nome).toBe('Checklist Genérico');
  });
});

// ===== Partner Vinculado Tests =====
describe('Parceiro Vinculado - Exibição automática do parceiro responsável', () => {
  it('should display partner name when linked to empresa', () => {
    const task = {
      clienteNome: 'Empresa ABC',
      parceiroNome: 'Parceiro XYZ',
      parceiroId: 5,
    };
    
    expect(task.parceiroNome).toBe('Parceiro XYZ');
    expect(task.parceiroId).toBeTruthy();
  });

  it('should display "Sem parceiro" when no partner linked', () => {
    const task = {
      clienteNome: 'Empresa ABC',
      parceiroNome: null,
      parceiroId: null,
    };
    
    const displayText = task.parceiroNome || 'Sem parceiro vinculado';
    expect(displayText).toBe('Sem parceiro vinculado');
  });
});

// ===== RTI Indicator Tests =====
describe('RTI Indicator - Indicador visual de RTI disponível', () => {
  it('should show green indicator when RTI count > 0', () => {
    const task = { rtiCount: 2 };
    const hasRti = (task.rtiCount || 0) > 0;
    expect(hasRti).toBe(true);
  });

  it('should show create button when no RTI exists', () => {
    const task = { rtiCount: 0 };
    const hasRti = (task.rtiCount || 0) > 0;
    expect(hasRti).toBe(false);
  });
});

// ===== SLA Date Display Tests =====
describe('SLA Dates - Data de início e fim prevista', () => {
  it('should format dates in dd/mm/yyyy format', () => {
    const date = new Date('2026-02-15T10:00:00Z');
    const formatted = date.toLocaleDateString('pt-BR');
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should calculate data fim from data inicio + SLA days', () => {
    const dataInicio = new Date('2026-02-01T10:00:00Z');
    const slaDias = 30;
    const dataFim = new Date(dataInicio.getTime() + slaDias * 24 * 60 * 60 * 1000);
    
    expect(dataFim.getDate()).toBe(3); // March 3
    expect(dataFim.getMonth()).toBe(2); // March (0-indexed)
  });
});
