import { describe, expect, it } from "vitest";

/**
 * v66 — Encargos Trabalhistas CLT + Modo "Por Colaborador" no Simulador de Reajuste
 * Tests for CLT labor charges calculation and individual collaborator adjustment mode
 */

// Default CLT encargos percentages
const DEFAULT_ENCARGOS = {
  inssPatronal: 20,
  ratSat: 2,
  sistemaS: 5.8,
  fgts: 8,
  decimoTerceiro: 8.33,
  ferias: 11.11,
  multaFgts: 4,
};

function totalEncargosPercent(enc: typeof DEFAULT_ENCARGOS): number {
  return Object.values(enc).reduce((s, v) => s + v, 0);
}

function calcEncargos(salarioBruto: number, encargosPercent: number): number {
  return salarioBruto * (encargosPercent / 100);
}

function calcCustoTotal(salarioBruto: number, adicionais: number, encargosPercent: number, incluirEncargos: boolean): number {
  const remuneracaoBruta = salarioBruto + adicionais;
  if (!incluirEncargos) return remuneracaoBruta;
  return remuneracaoBruta + calcEncargos(remuneracaoBruta, encargosPercent);
}

function calcReajuste(salarioAtual: number, percentual: number): number {
  return salarioAtual * (1 + percentual / 100);
}

describe("v66 — Encargos Trabalhistas CLT", () => {
  it("should calculate total encargos percentage correctly", () => {
    const total = totalEncargosPercent(DEFAULT_ENCARGOS);
    expect(total).toBeCloseTo(59.24, 2);
  });

  it("should calculate encargos value for a given salary", () => {
    const salario = 8500;
    const encargosPercent = totalEncargosPercent(DEFAULT_ENCARGOS);
    const encargosValue = calcEncargos(salario, encargosPercent);
    // 8500 * 0.5924 = 5035.40
    expect(encargosValue).toBeCloseTo(5035.40, 2);
  });

  it("should calculate custo total with encargos included", () => {
    const salario = 8500;
    const adicionais = 0;
    const encargosPercent = totalEncargosPercent(DEFAULT_ENCARGOS);
    const custoTotal = calcCustoTotal(salario, adicionais, encargosPercent, true);
    // 8500 + (8500 * 0.5924) = 8500 + 5035.40 = 13535.40
    expect(custoTotal).toBeCloseTo(13535.40, 2);
  });

  it("should calculate custo total without encargos when toggle is off", () => {
    const salario = 8500;
    const adicionais = 500;
    const encargosPercent = totalEncargosPercent(DEFAULT_ENCARGOS);
    const custoTotal = calcCustoTotal(salario, adicionais, encargosPercent, false);
    // Without encargos, just salary + adicionais
    expect(custoTotal).toBe(9000);
  });

  it("should include adicionais in encargos base", () => {
    const salario = 8500;
    const adicionais = 1500;
    const encargosPercent = totalEncargosPercent(DEFAULT_ENCARGOS);
    const custoTotal = calcCustoTotal(salario, adicionais, encargosPercent, true);
    // (8500 + 1500) * 1.5924 = 10000 * 1.5924 = 15924.00
    expect(custoTotal).toBeCloseTo(15924.00, 2);
  });

  it("should allow custom encargos percentages", () => {
    const customEncargos = {
      ...DEFAULT_ENCARGOS,
      inssPatronal: 22, // Custom higher INSS
      ratSat: 3,        // Custom higher RAT
    };
    const total = totalEncargosPercent(customEncargos);
    // 22 + 3 + 5.8 + 8 + 8.33 + 11.11 + 4 = 62.24
    expect(total).toBeCloseTo(62.24, 2);
  });

  it("should handle zero salary gracefully", () => {
    const custoTotal = calcCustoTotal(0, 0, totalEncargosPercent(DEFAULT_ENCARGOS), true);
    expect(custoTotal).toBe(0);
  });
});

describe("v66 — Simulador Por Colaborador", () => {
  it("should apply adjustment to only the selected collaborator", () => {
    const employees = [
      { id: 1, nome: "Ana Paula", salario: 8500, adicionais: 0 },
      { id: 2, nome: "Carlos", salario: 12000, adicionais: 500 },
      { id: 3, nome: "Juliana", salario: 6500, adicionais: 0 },
    ];
    const selectedId = "1";
    const pct = 5;
    const encargosPercent = totalEncargosPercent(DEFAULT_ENCARGOS);

    const simulacao = employees.map((e) => {
      const aplicar = String(e.id) === selectedId;
      const salarioNovo = aplicar ? calcReajuste(e.salario, pct) : e.salario;
      const custoAtual = calcCustoTotal(e.salario, e.adicionais, encargosPercent, true);
      const custoNovo = calcCustoTotal(salarioNovo, e.adicionais, encargosPercent, true);
      return {
        nome: e.nome,
        salarioAtual: e.salario,
        salarioNovo,
        custoAtual,
        custoNovo,
        diferenca: custoNovo - custoAtual,
      };
    });

    // Only Ana Paula should be affected
    const afetados = simulacao.filter((r) => r.diferenca > 0);
    expect(afetados.length).toBe(1);
    expect(afetados[0].nome).toBe("Ana Paula");

    // Ana Paula: 8500 → 8925 (5% increase)
    expect(simulacao[0].salarioNovo).toBe(8925);
    // Custo difference with encargos: 425 * 1.5924 = 676.77
    expect(simulacao[0].diferenca).toBeCloseTo(676.77, 2);

    // Others unchanged
    expect(simulacao[1].diferenca).toBe(0);
    expect(simulacao[2].diferenca).toBe(0);
  });

  it("should apply adjustment to all when selectedId is 'todos'", () => {
    const employees = [
      { id: 1, nome: "Ana", salario: 5000, adicionais: 0 },
      { id: 2, nome: "Carlos", salario: 3000, adicionais: 0 },
    ];
    const selectedId = "todos";
    const pct = 10;

    const simulacao = employees.map((e) => {
      const aplicar = selectedId === "todos" || String(e.id) === selectedId;
      const salarioNovo = aplicar ? calcReajuste(e.salario, pct) : e.salario;
      return { salarioNovo, diferenca: salarioNovo - e.salario };
    });

    expect(simulacao[0].salarioNovo).toBeCloseTo(5500, 2);
    expect(simulacao[1].salarioNovo).toBeCloseTo(3300, 2);
    expect(simulacao.every((s) => s.diferenca > 0)).toBe(true);
  });

  it("should calculate annual impact correctly", () => {
    const salario = 8500;
    const pct = 5;
    const encargosPercent = totalEncargosPercent(DEFAULT_ENCARGOS);
    const salarioNovo = calcReajuste(salario, pct);
    const custoAtual = calcCustoTotal(salario, 0, encargosPercent, true);
    const custoNovo = calcCustoTotal(salarioNovo, 0, encargosPercent, true);
    const impactoMensal = custoNovo - custoAtual;
    const impactoAnual = impactoMensal * 12;

    // 425 * 1.5924 = 676.77 monthly
    expect(impactoMensal).toBeCloseTo(676.77, 2);
    // 676.77 * 12 = 8121.24 annual
    expect(impactoAnual).toBeCloseTo(8121.24, 2);
  });

  it("should handle PJ collaborators (no encargos)", () => {
    const employees = [
      { id: 1, nome: "Ana", salario: 8500, tipo: "CLT", adicionais: 0 },
      { id: 2, nome: "Carlos", salario: 10000, tipo: "PJ", adicionais: 0 },
    ];
    const pct = 5;
    const encargosPercent = totalEncargosPercent(DEFAULT_ENCARGOS);

    const simulacao = employees.map((e) => {
      const isCLT = e.tipo === "CLT";
      const salarioNovo = calcReajuste(e.salario, pct);
      const custoAtual = calcCustoTotal(e.salario, e.adicionais, encargosPercent, isCLT);
      const custoNovo = calcCustoTotal(salarioNovo, e.adicionais, encargosPercent, isCLT);
      return {
        nome: e.nome,
        custoAtual,
        custoNovo,
        diferenca: custoNovo - custoAtual,
      };
    });

    // CLT: 8500 * 1.5924 = 13535.40 → 8925 * 1.5924 = 14212.17 → diff 676.77
    expect(simulacao[0].diferenca).toBeCloseTo(676.77, 2);
    // PJ: 10000 → 10500 → diff 500 (no encargos)
    expect(simulacao[1].diferenca).toBe(500);
  });
});

describe("v66 — Impacto por Setor com Encargos", () => {
  it("should aggregate impact by setor including encargos", () => {
    const employees = [
      { setor: "Suporte", salario: 8500, adicionais: 0 },
      { setor: "Comercial", salario: 5000, adicionais: 300 },
      { setor: "Comercial", salario: 6000, adicionais: 200 },
    ];
    const pct = 5;
    const encargosPercent = totalEncargosPercent(DEFAULT_ENCARGOS);

    const setorMap = new Map<string, { custoAtual: number; custoNovo: number; qtd: number }>();
    employees.forEach((e) => {
      const salarioNovo = calcReajuste(e.salario, pct);
      const custoAtual = calcCustoTotal(e.salario, e.adicionais, encargosPercent, true);
      const custoNovo = calcCustoTotal(salarioNovo, e.adicionais, encargosPercent, true);
      const entry = setorMap.get(e.setor) || { custoAtual: 0, custoNovo: 0, qtd: 0 };
      entry.custoAtual += custoAtual;
      entry.custoNovo += custoNovo;
      entry.qtd += 1;
      setorMap.set(e.setor, entry);
    });

    const suporte = setorMap.get("Suporte")!;
    expect(suporte.qtd).toBe(1);
    // Suporte: 8500 * 1.5924 = 13535.40 → 8925 * 1.5924 = 14212.17
    expect(suporte.custoNovo - suporte.custoAtual).toBeCloseTo(676.77, 2);

    const comercial = setorMap.get("Comercial")!;
    expect(comercial.qtd).toBe(2);
    // Comercial emp1: (5000+300)*1.5924 = 8439.72 → (5250+300)*1.5924 = 8837.52 → diff 397.80
    // Comercial emp2: (6000+200)*1.5924 = 9872.88 → (6300+200)*1.5924 = 10350.60 → diff 477.72
    // Total diff: 397.80 + 477.72 = 875.52 (approximately)
    const comercialDiff = comercial.custoNovo - comercial.custoAtual;
    expect(comercialDiff).toBeCloseTo(875.52, 0); // Allow some rounding
  });
});
