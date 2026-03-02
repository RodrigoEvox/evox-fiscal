import { describe, it, expect } from 'vitest';
import {
  detectConflicts, calculateConflictScenarios, determineViabilidade,
  VIABILIDADE_THRESHOLD, type TeseItem,
} from '../shared/teseConflicts';

describe('teseConflicts — detectConflicts', () => {
  it('should return empty array when no conflicting teses exist', () => {
    const teses: TeseItem[] = [
      { nome: 'Exclusão do ICMS da base do PIS/COFINS', valor: 50000, index: 0 },
      { nome: 'IRPJ/CSLL sobre Selic', valor: 30000, index: 1 },
    ];
    const conflicts = detectConflicts(teses);
    expect(conflicts).toHaveLength(0);
  });

  it('should detect PERSE vs Exclusão PIS/COFINS conflict', () => {
    const teses: TeseItem[] = [
      { nome: 'PERSE - Alíquota Zero', valor: 100000, index: 0 },
      { nome: 'Exclusão do ICMS da base de cálculo do PIS/COFINS', valor: 50000, index: 1 },
    ];
    const conflicts = detectConflicts(teses);
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
    const perseConflict = conflicts.find(c => c.ruleId === 'perse_vs_exclusao_pis_cofins');
    expect(perseConflict).toBeDefined();
    expect(perseConflict!.tesesGrupoA.length).toBeGreaterThanOrEqual(1);
    expect(perseConflict!.tesesGrupoB.length).toBeGreaterThanOrEqual(1);
    expect(perseConflict!.totalGrupoA).toBe(100000);
    expect(perseConflict!.totalGrupoB).toBe(50000);
  });

  it('should detect conflict with multiple exclusão teses', () => {
    const teses: TeseItem[] = [
      { nome: 'PERSE', valor: 80000, index: 0 },
      { nome: 'Exclusão do ICMS da base de cálculo do PIS/COFINS', valor: 30000, index: 1 },
      { nome: 'Exclusão do ISS da base de cálculo do PIS/COFINS', valor: 20000, index: 2 },
    ];
    const conflicts = detectConflicts(teses);
    const perseConflict = conflicts.find(c => c.ruleId === 'perse_vs_exclusao_pis_cofins');
    expect(perseConflict).toBeDefined();
    expect(perseConflict!.tesesGrupoB.length).toBe(2);
    expect(perseConflict!.totalGrupoB).toBe(50000);
  });

  it('should not detect conflict when only one group is present', () => {
    const teses: TeseItem[] = [
      { nome: 'PERSE', valor: 100000, index: 0 },
      { nome: 'IRPJ/CSLL sobre Selic', valor: 30000, index: 1 },
    ];
    const conflicts = detectConflicts(teses);
    expect(conflicts).toHaveLength(0);
  });

  it('should handle empty teses array', () => {
    const conflicts = detectConflicts([]);
    expect(conflicts).toHaveLength(0);
  });
});

describe('teseConflicts — calculateConflictScenarios', () => {
  it('should return empty scenarios when no conflicts', () => {
    const teses: TeseItem[] = [
      { nome: 'IRPJ/CSLL sobre Selic', valor: 30000, index: 0 },
    ];
    const scenarios = calculateConflictScenarios(teses, []);
    expect(scenarios).toHaveLength(0);
  });

  it('should generate two scenarios for PERSE vs Exclusão conflict', () => {
    const teses: TeseItem[] = [
      { nome: 'PERSE', valor: 100000, index: 0 },
      { nome: 'Exclusão do ICMS da base de cálculo do PIS/COFINS', valor: 50000, index: 1 },
      { nome: 'IRPJ/CSLL sobre Selic', valor: 30000, index: 2 },
    ];
    const conflicts = detectConflicts(teses);
    const scenarios = calculateConflictScenarios(teses, conflicts);
    expect(scenarios.length).toBeGreaterThanOrEqual(2);

    // Cenário A: PERSE + IRPJ (excluindo Exclusão) = 130000
    const cenarioA = scenarios[0];
    expect(cenarioA.valorTotal).toBe(130000);

    // Cenário B: Exclusão + IRPJ (excluindo PERSE) = 80000
    const cenarioB = scenarios[1];
    expect(cenarioB.valorTotal).toBe(80000);
  });

  it('should identify best scenario correctly', () => {
    const teses: TeseItem[] = [
      { nome: 'PERSE', valor: 40000, index: 0 },
      { nome: 'Exclusão do ICMS da base de cálculo do PIS/COFINS', valor: 80000, index: 1 },
    ];
    const conflicts = detectConflicts(teses);
    const scenarios = calculateConflictScenarios(teses, conflicts);
    const bestValue = Math.max(...scenarios.map(s => s.valorTotal));
    // Exclusão (80k) is better than PERSE (40k)
    expect(bestValue).toBe(80000);
  });
});

describe('teseConflicts — determineViabilidade', () => {
  it('should return viavel for value >= 20000', () => {
    expect(determineViabilidade(20000)).toBe('viavel');
    expect(determineViabilidade(50000)).toBe('viavel');
    expect(determineViabilidade(1000000)).toBe('viavel');
  });

  it('should return inviavel for value < 20000', () => {
    expect(determineViabilidade(0)).toBe('inviavel');
    expect(determineViabilidade(19999.99)).toBe('inviavel');
    expect(determineViabilidade(10000)).toBe('inviavel');
  });

  it('should use correct threshold', () => {
    expect(VIABILIDADE_THRESHOLD).toBe(20000);
  });
});

describe('CurrencyInput formatting logic', () => {
  // Test the core formatting logic that CurrencyInput uses
  function formatFromCents(cents: number): string {
    if (cents === 0) return 'R$ 0,00';
    const negative = cents < 0;
    const absCents = Math.abs(cents);
    const reais = Math.floor(absCents / 100);
    const centavos = absCents % 100;
    const reaisStr = reais.toLocaleString('pt-BR');
    const centavosStr = centavos.toString().padStart(2, '0');
    return `${negative ? '-' : ''}R$ ${reaisStr},${centavosStr}`;
  }

  it('should format 0 cents as R$ 0,00', () => {
    expect(formatFromCents(0)).toBe('R$ 0,00');
  });

  it('should format 1 cent as R$ 0,01', () => {
    expect(formatFromCents(1)).toBe('R$ 0,01');
  });

  it('should format 123 cents as R$ 1,23', () => {
    expect(formatFromCents(123)).toBe('R$ 1,23');
  });

  it('should format 2500000 cents as R$ 25.000,00', () => {
    expect(formatFromCents(2500000)).toBe('R$ 25.000,00');
  });

  it('should format 12345 cents as R$ 123,45', () => {
    expect(formatFromCents(12345)).toBe('R$ 123,45');
  });

  it('should handle negative values', () => {
    expect(formatFromCents(-1500)).toBe('-R$ 15,00');
  });

  // Test the raw value conversion
  it('should convert raw string "1234.56" to cents 123456', () => {
    const raw = '1234.56';
    const num = parseFloat(raw);
    const cents = Math.round(num * 100);
    expect(cents).toBe(123456);
  });

  it('should convert digits-only input to correct value', () => {
    // Simulating user typing "25000" → digits = "25000" → cents = 25000 → R$ 250,00
    const digits = '25000';
    const cents = parseInt(digits, 10);
    const numericValue = cents / 100;
    expect(numericValue.toFixed(2)).toBe('250.00');
  });

  it('should convert digits "2500000" to R$ 25.000,00', () => {
    const digits = '2500000';
    const cents = parseInt(digits, 10);
    const numericValue = cents / 100;
    expect(numericValue.toFixed(2)).toBe('25000.00');
    expect(formatFromCents(cents)).toBe('R$ 25.000,00');
  });
});
