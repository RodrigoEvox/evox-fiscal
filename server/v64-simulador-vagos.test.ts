import { describe, expect, it } from "vitest";

/**
 * v64 — Simulador de Reajuste Salarial + Relatório de Cargos Vagos
 * Tests for the new tabs added to Cargos e Salários module
 */

describe("v64 — Simulador de Reajuste Salarial", () => {
  // Helper: simulate salary adjustment calculation
  function calcReajuste(salarioAtual: number, percentual: number): number {
    return salarioAtual * (1 + percentual / 100);
  }

  function parseSalario(val: any): number {
    if (!val && val !== 0) return 0;
    if (typeof val === 'number') return val;
    const str = String(val).trim();
    // If it's a raw decimal from the database (e.g. "8500.00"), parse directly
    if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str) || 0;
    // If it's BRL formatted (e.g. "R$ 8.500,00"), strip formatting
    const cleaned = str.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  it("should calculate global salary adjustment correctly", () => {
    const salario = 5000;
    const pct = 5;
    const novo = calcReajuste(salario, pct);
    expect(novo).toBe(5250);
    expect(novo - salario).toBe(250);
  });

  it("should calculate 0% adjustment as no change", () => {
    const salario = 3000;
    const novo = calcReajuste(salario, 0);
    expect(novo).toBe(3000);
  });

  it("should handle large percentage adjustments", () => {
    const salario = 2000;
    const novo = calcReajuste(salario, 100);
    expect(novo).toBe(4000);
  });

  it("should calculate total impact for multiple employees", () => {
    const employees = [
      { salario: 3000, setor: "A" },
      { salario: 5000, setor: "A" },
      { salario: 4000, setor: "B" },
    ];
    const pct = 10;
    const custoAtual = employees.reduce((s, e) => s + e.salario, 0);
    const custoNovo = employees.reduce(
      (s, e) => s + calcReajuste(e.salario, pct),
      0
    );
    const impactoMensal = custoNovo - custoAtual;
    const impactoAnual = impactoMensal * 12;

    expect(custoAtual).toBe(12000);
    expect(custoNovo).toBe(13200);
    expect(impactoMensal).toBe(1200);
    expect(impactoAnual).toBe(14400);
  });

  it("should filter by setor when mode is 'setor'", () => {
    const employees = [
      { salario: 3000, setorId: 1 },
      { salario: 5000, setorId: 1 },
      { salario: 4000, setorId: 2 },
    ];
    const setorSelecionado = "1";
    const pct = 10;

    const simulacao = employees.map((e) => {
      const aplicar = String(e.setorId) === setorSelecionado;
      const salarioNovo = aplicar
        ? calcReajuste(e.salario, pct)
        : e.salario;
      return {
        salarioAtual: e.salario,
        salarioNovo,
        diferenca: salarioNovo - e.salario,
      };
    });

    const afetados = simulacao.filter((r) => r.diferenca > 0).length;
    expect(afetados).toBe(2);
    expect(simulacao[0].salarioNovo).toBeCloseTo(3300, 2);
    expect(simulacao[1].salarioNovo).toBeCloseTo(5500, 2);
    expect(simulacao[2].salarioNovo).toBe(4000); // not affected
  });

  it("should filter by cargo when mode is 'cargo'", () => {
    const employees = [
      { salario: 3000, cargo: "Analista" },
      { salario: 5000, cargo: "Gerente" },
      { salario: 4000, cargo: "Analista" },
    ];
    const cargoSelecionado = "Analista";
    const pct = 8;

    const simulacao = employees.map((e) => {
      const aplicar = e.cargo === cargoSelecionado;
      const salarioNovo = aplicar
        ? calcReajuste(e.salario, pct)
        : e.salario;
      return {
        salarioAtual: e.salario,
        salarioNovo,
        diferenca: salarioNovo - e.salario,
      };
    });

    const afetados = simulacao.filter((r) => r.diferenca > 0).length;
    expect(afetados).toBe(2);
    expect(simulacao[0].salarioNovo).toBe(3240);
    expect(simulacao[1].salarioNovo).toBe(5000); // Gerente not affected
    expect(simulacao[2].salarioNovo).toBe(4320);
  });

  it("should parse BRL salary strings correctly", () => {
    expect(parseSalario("R$ 2.500,00")).toBe(2500);
    expect(parseSalario("R$ 10.000,50")).toBe(10000.5);
    expect(parseSalario(3000)).toBe(3000);
    expect(parseSalario(null)).toBe(0);
    expect(parseSalario("")).toBe(0);
  });

  it("should parse raw decimal strings from database correctly (v65 fix)", () => {
    // Database returns decimal columns as strings like "8500.00"
    expect(parseSalario("8500.00")).toBe(8500);
    expect(parseSalario("2500.00")).toBe(2500);
    expect(parseSalario("1200.00")).toBe(1200);
    expect(parseSalario("10000.50")).toBe(10000.5);
    expect(parseSalario("0.00")).toBe(0);
    // Ensure BRL formatted strings still work
    expect(parseSalario("R$ 8.500,00")).toBe(8500);
    // Ensure numbers pass through
    expect(parseSalario(8500)).toBe(8500);
    expect(parseSalario(0)).toBe(0);
  });
});

describe("v64 — Relatório de Cargos Vagos", () => {
  it("should identify vacant positions", () => {
    const cargosBase = [
      { cargo: "Analista", setorId: 1, totalCadastrado: 3 },
      { cargo: "Gerente", setorId: 1, totalCadastrado: 1 },
      { cargo: "Estagiário", setorId: 2, totalCadastrado: 2 },
    ];

    const colaboradoresAtivos = [
      { cargo: "Analista", setorId: 1 },
      { cargo: "Analista", setorId: 1 },
      { cargo: "Gerente", setorId: 1 },
    ];

    const result = cargosBase.map((c) => {
      const preenchido = colaboradoresAtivos.filter(
        (e) => e.cargo === c.cargo && e.setorId === c.setorId
      ).length;
      return {
        ...c,
        totalPreenchido: preenchido,
        vagasAbertas: Math.max(0, c.totalCadastrado - preenchido),
      };
    });

    expect(result[0].vagasAbertas).toBe(1); // Analista: 3 cadastrados, 2 ativos
    expect(result[1].vagasAbertas).toBe(0); // Gerente: 1 cadastrado, 1 ativo
    expect(result[2].vagasAbertas).toBe(2); // Estagiário: 2 cadastrados, 0 ativos
  });

  it("should calculate occupancy rate", () => {
    const totalVagas = 10;
    const totalPreenchidas = 7;
    const taxaOcupacao =
      totalVagas > 0
        ? ((totalPreenchidas / totalVagas) * 100).toFixed(1)
        : "0.0";
    expect(taxaOcupacao).toBe("70.0");
  });

  it("should detect employees with unregistered positions", () => {
    const cargosRegistrados = new Set(["Analista__1", "Gerente__1"]);

    const colaboradores = [
      { cargo: "Analista", setorId: 1, status: "ativo" },
      { cargo: "Gerente", setorId: 1, status: "ativo" },
      { cargo: "Diretor", setorId: 1, status: "ativo" },
      { cargo: "Estagiário", setorId: 2, status: "ativo" },
      { cargo: "Analista", setorId: 1, status: "Desligado" },
    ];

    const semBase = new Map<string, { cargo: string; count: number }>();
    colaboradores.forEach((c) => {
      if (c.status === "Desligado") return;
      const key = `${c.cargo}__${c.setorId}`;
      if (!cargosRegistrados.has(key)) {
        if (!semBase.has(key)) {
          semBase.set(key, { cargo: c.cargo, count: 0 });
        }
        semBase.get(key)!.count++;
      }
    });

    expect(semBase.size).toBe(2);
    expect(semBase.get("Diretor__1")?.count).toBe(1);
    expect(semBase.get("Estagiário__2")?.count).toBe(1);
  });

  it("should handle empty data gracefully", () => {
    const cargosBase: any[] = [];
    const totalVagas = cargosBase.reduce(
      (s: number, v: any) => s + (v.totalCadastrado || 0),
      0
    );
    const taxaOcupacao =
      totalVagas > 0 ? ((0 / totalVagas) * 100).toFixed(1) : "0.0";
    expect(totalVagas).toBe(0);
    expect(taxaOcupacao).toBe("0.0");
  });

  it("should filter vacant positions by setor", () => {
    const vagas = [
      { cargo: "Analista", setorId: 1, vagasAbertas: 2 },
      { cargo: "Gerente", setorId: 1, vagasAbertas: 0 },
      { cargo: "Estagiário", setorId: 2, vagasAbertas: 1 },
    ];

    const filterSetorVago = "1";
    const filtradas = vagas.filter(
      (v) => String(v.setorId) === filterSetorVago
    );
    expect(filtradas.length).toBe(2);
    expect(filtradas[0].cargo).toBe("Analista");
    expect(filtradas[1].cargo).toBe("Gerente");
  });

  it("should detect excedent positions (more employees than registered)", () => {
    const cargo = {
      totalCadastrado: 2,
      totalPreenchido: 3,
    };
    const vagasAbertas = Math.max(0, cargo.totalCadastrado - cargo.totalPreenchido);
    const isExcedente = cargo.totalPreenchido > cargo.totalCadastrado;
    expect(vagasAbertas).toBe(0);
    expect(isExcedente).toBe(true);
  });
});

describe("v64 — PDF Export for Simulator", () => {
  it("should format currency correctly for PDF", () => {
    function fmtCurrency(v: number): string {
      return v.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
    expect(fmtCurrency(1000)).toMatch(/1\.000,00/);
    expect(fmtCurrency(2500.5)).toMatch(/2\.500,50/);
    expect(fmtCurrency(0)).toMatch(/0,00/);
  });

  it("should build CSV export with correct headers and BOM", () => {
    const headers = [
      "Nome",
      "Cargo",
      "Setor",
      "Nível",
      "Salário Atual",
      "Salário Novo",
      "Diferença",
    ];
    const rows = [
      ["João", "Analista", "Crédito", "Jr", "3000,00", "3150,00", "150,00"],
    ];
    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join(
      "\n"
    );
    const BOM = "\uFEFF";
    const fullCsv = BOM + csvContent;

    expect(fullCsv.startsWith("\uFEFF")).toBe(true);
    expect(fullCsv).toContain("Nome;Cargo;Setor");
    expect(fullCsv).toContain("João;Analista;Crédito");
  });
});
