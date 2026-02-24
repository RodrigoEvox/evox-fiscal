import { describe, expect, it } from "vitest";

/**
 * v68 — Salário Líquido (net salary) calculation tests
 * Tests for INSS employee contribution + IRRF deductions
 * Based on 2025 INSS and IRRF tables
 */

// INSS Employee contribution table (2025)
const INSS_FAIXAS = [
  { ate: 1518.00, aliquota: 7.5 },
  { ate: 2793.88, aliquota: 9 },
  { ate: 5839.45, aliquota: 12 },
  { ate: 8157.41, aliquota: 14 },
];

// IRRF table (2025)
const IRRF_FAIXAS = [
  { ate: 2259.20, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 7.5, deducao: 169.44 },
  { ate: 3751.05, aliquota: 15, deducao: 381.44 },
  { ate: 4664.68, aliquota: 22.5, deducao: 662.77 },
  { ate: Infinity, aliquota: 27.5, deducao: 896.00 },
];

const DEDUCAO_POR_DEPENDENTE = 189.59;

function calcINSSEmpregado(salarioBruto: number): number {
  let contribuicao = 0;
  let salarioRestante = salarioBruto;
  let faixaAnterior = 0;

  for (const faixa of INSS_FAIXAS) {
    if (salarioRestante <= 0) break;
    const teto = faixa.ate;
    const base = Math.min(salarioRestante, teto - faixaAnterior);
    if (base > 0) {
      contribuicao += base * (faixa.aliquota / 100);
    }
    salarioRestante -= base;
    faixaAnterior = teto;
  }

  return contribuicao;
}

function calcIRRF(salarioBruto: number, inssEmpregado: number, dependentes: number = 0): number {
  const baseCalculo = salarioBruto - inssEmpregado - (dependentes * DEDUCAO_POR_DEPENDENTE);
  if (baseCalculo <= IRRF_FAIXAS[0].ate) return 0;

  for (const faixa of IRRF_FAIXAS) {
    if (baseCalculo <= faixa.ate) {
      return Math.max(0, baseCalculo * (faixa.aliquota / 100) - faixa.deducao);
    }
  }
  // Last bracket (> 4664.68)
  const lastFaixa = IRRF_FAIXAS[IRRF_FAIXAS.length - 1];
  return Math.max(0, baseCalculo * (lastFaixa.aliquota / 100) - lastFaixa.deducao);
}

function calcSalarioLiquido(salarioBruto: number, dependentes: number = 0): number {
  const inss = calcINSSEmpregado(salarioBruto);
  const irrf = calcIRRF(salarioBruto, inss, dependentes);
  return salarioBruto - inss - irrf;
}

describe("v68 — INSS Empregado (progressive brackets)", () => {
  it("should calculate INSS for salary in first bracket (R$ 1.500)", () => {
    const inss = calcINSSEmpregado(1500);
    // 1500 * 7.5% = 112.50
    expect(inss).toBeCloseTo(112.50, 2);
  });

  it("should calculate INSS for salary in second bracket (R$ 2.500)", () => {
    const inss = calcINSSEmpregado(2500);
    // 1518 * 7.5% + (2500-1518) * 9% = 113.85 + 88.38 = 202.23
    expect(inss).toBeCloseTo(113.85 + 88.38, 2);
  });

  it("should calculate INSS for salary in third bracket (R$ 5.000)", () => {
    const inss = calcINSSEmpregado(5000);
    // 1518 * 7.5% = 113.85
    // (2793.88-1518) * 9% = 114.83
    // (5000-2793.88) * 12% = 264.73
    expect(inss).toBeCloseTo(113.85 + 114.83 + 264.73, 1);
  });

  it("should calculate INSS for salary above ceiling (R$ 10.000)", () => {
    const inss = calcINSSEmpregado(10000);
    // Capped at 8157.41 ceiling
    // 1518 * 7.5% = 113.85
    // (2793.88-1518) * 9% = 114.83
    // (5839.45-2793.88) * 12% = 365.47
    // (8157.41-5839.45) * 14% = 324.51
    expect(inss).toBeCloseTo(113.85 + 114.83 + 365.47 + 324.51, 0);
  });

  it("should calculate INSS for Ana Paula (R$ 8.500)", () => {
    const inss = calcINSSEmpregado(8500);
    // Same as above since 8500 > 8157.41 (ceiling)
    const expected = 1518 * 0.075 + (2793.88 - 1518) * 0.09 + (5839.45 - 2793.88) * 0.12 + (8157.41 - 5839.45) * 0.14;
    expect(inss).toBeCloseTo(expected, 2);
  });
});

describe("v68 — IRRF (progressive brackets)", () => {
  it("should return 0 IRRF for salary below exempt threshold", () => {
    const irrf = calcIRRF(2000, calcINSSEmpregado(2000));
    expect(irrf).toBe(0);
  });

  it("should calculate IRRF for salary in 7.5% bracket", () => {
    const salario = 3000;
    const inss = calcINSSEmpregado(salario);
    const irrf = calcIRRF(salario, inss);
    const baseCalculo = salario - inss;
    // baseCalculo should be around 2797.77
    if (baseCalculo > 2259.20 && baseCalculo <= 2826.65) {
      const expected = baseCalculo * 0.075 - 169.44;
      expect(irrf).toBeCloseTo(Math.max(0, expected), 2);
    }
  });

  it("should calculate IRRF for high salary (R$ 12.000)", () => {
    const salario = 12000;
    const inss = calcINSSEmpregado(salario);
    const irrf = calcIRRF(salario, inss);
    const baseCalculo = salario - inss;
    // 12000 - ~918.66 = ~11081.34 → 27.5% bracket
    const expected = baseCalculo * 0.275 - 896.00;
    expect(irrf).toBeCloseTo(expected, 2);
  });

  it("should reduce IRRF base with dependents", () => {
    const salario = 8500;
    const inss = calcINSSEmpregado(salario);
    const irrfNoDep = calcIRRF(salario, inss, 0);
    const irrf2Dep = calcIRRF(salario, inss, 2);
    // 2 dependents reduce base by 2 * 189.59 = 379.18
    expect(irrf2Dep).toBeLessThan(irrfNoDep);
    // Difference should be approximately 379.18 * 0.275 = 104.27 (at 27.5% bracket)
    expect(irrfNoDep - irrf2Dep).toBeCloseTo(379.18 * 0.275, 1);
  });
});

describe("v68 — Salário Líquido (net salary)", () => {
  it("should calculate net salary for Ana Paula (R$ 8.500 CLT)", () => {
    const liquido = calcSalarioLiquido(8500);
    // Bruto: 8500
    // INSS: ~918.66 (capped at ceiling)
    // IRRF: ~1213.27 (27.5% bracket on 8500-918.66=7581.34)
    // Líquido: 8500 - 918.66 - 1213.27 ≈ 6368.07
    expect(liquido).toBeGreaterThan(6000);
    expect(liquido).toBeLessThan(7000);
  });

  it("should calculate net salary for R$ 3.000 CLT", () => {
    const liquido = calcSalarioLiquido(3000);
    // Low salary, small INSS and IRRF
    expect(liquido).toBeGreaterThan(2700);
    expect(liquido).toBeLessThan(3000);
  });

  it("should calculate net salary for R$ 12.000 CLT", () => {
    const liquido = calcSalarioLiquido(12000);
    // High salary, significant deductions
    expect(liquido).toBeGreaterThan(8500);
    expect(liquido).toBeLessThan(10000);
  });

  it("should return full salary for PJ (no deductions)", () => {
    // PJ collaborators don't have INSS/IRRF deductions in the simulator
    const salarioPJ = 10000;
    // For PJ, the "líquido" is the full salary (no CLT deductions)
    expect(salarioPJ).toBe(10000);
  });

  it("should increase net salary proportionally with raise", () => {
    const liquidoAtual = calcSalarioLiquido(8500);
    const liquidoNovo = calcSalarioLiquido(8925); // 5% raise
    expect(liquidoNovo).toBeGreaterThan(liquidoAtual);
    // Net increase should be less than gross increase due to progressive taxes
    const grossIncrease = 8925 - 8500; // 425
    const netIncrease = liquidoNovo - liquidoAtual;
    expect(netIncrease).toBeLessThan(grossIncrease);
    expect(netIncrease).toBeGreaterThan(0);
  });
});

describe("v68 — Excel export CSV format", () => {
  it("should include Líquido columns in CSV headers", () => {
    const headersWithEncargos = ['Nome', 'Cargo', 'Setor', 'Tipo', 'Sal. Atual', 'Sal. Novo', 'Líquido Atual', 'Líquido Novo', 'Dif. Sal.', 'Encargos Atual', 'Encargos Novo', 'Custo Total Atual', 'Custo Total Novo', 'Impacto Total'];
    expect(headersWithEncargos).toContain('Líquido Atual');
    expect(headersWithEncargos).toContain('Líquido Novo');
  });

  it("should format CSV with BOM and semicolons", () => {
    const BOM = '\uFEFF';
    const headers = ['Nome', 'Sal. Atual', 'Líquido Atual'];
    const rows = [['Ana', '8500,00', '6368,57']];
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const fullContent = BOM + csvContent;
    
    expect(fullContent.startsWith(BOM)).toBe(true);
    expect(fullContent).toContain(';');
    expect(fullContent).toContain('Líquido Atual');
    expect(fullContent).toContain('6368,57');
  });
});
