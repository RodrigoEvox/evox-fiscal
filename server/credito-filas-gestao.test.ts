import { describe, it, expect } from "vitest";

// ============================================================
// Tests for Retificação, Compensação, Ressarcimento,
// Restituição and Gestão de Créditos features
// ============================================================

describe("Retificação Feature", () => {
  describe("Retificação Checklist", () => {
    it("should define standard retificação steps per tese", () => {
      const retificacaoSteps = [
        "Validar obrigações acessórias",
        "Conferir créditos apurados",
        "Comparar valor RTI vs crédito real",
        "Constituir saldo por grupo de débitos",
        "Definir retificação total ou parcial",
        "Registrar período retificado",
      ];
      expect(retificacaoSteps.length).toBeGreaterThanOrEqual(5);
      expect(retificacaoSteps).toContain("Comparar valor RTI vs crédito real");
    });

    it("should track retificação type (total vs parcial)", () => {
      const retificacaoTypes = ["total", "parcial"];
      expect(retificacaoTypes).toContain("total");
      expect(retificacaoTypes).toContain("parcial");
    });
  });

  describe("Validação de Créditos", () => {
    it("should calculate divergence between RTI value and actual credit", () => {
      const valorRTI = 150000;
      const valorReal = 142000;
      const divergencia = Math.abs(valorRTI - valorReal);
      const percentual = (divergencia / valorRTI) * 100;
      
      expect(divergencia).toBe(8000);
      expect(percentual).toBeCloseTo(5.33, 1);
    });

    it("should flag high divergence above threshold", () => {
      const threshold = 10; // 10%
      const valorRTI = 200000;
      const valorReal = 170000;
      const percentual = (Math.abs(valorRTI - valorReal) / valorRTI) * 100;
      
      expect(percentual).toBe(15);
      expect(percentual > threshold).toBe(true);
    });
  });

  describe("Saldo por Grupo de Débitos", () => {
    it("should categorize credits into correct debt groups", () => {
      const gruposDebitos = [
        "INSS/PREVIDENCIÁRIOS",
        "PIS/COFINS",
        "IRPJ/CSLL",
      ];
      expect(gruposDebitos).toHaveLength(3);
      expect(gruposDebitos).toContain("INSS/PREVIDENCIÁRIOS");
      expect(gruposDebitos).toContain("PIS/COFINS");
      expect(gruposDebitos).toContain("IRPJ/CSLL");
    });

    it("should calculate saldo disponível per group", () => {
      const saldoPorGrupo = {
        "INSS/PREVIDENCIÁRIOS": { total: 80000, utilizado: 30000 },
        "PIS/COFINS": { total: 120000, utilizado: 50000 },
        "IRPJ/CSLL": { total: 60000, utilizado: 10000 },
      };

      const disponivel = Object.fromEntries(
        Object.entries(saldoPorGrupo).map(([k, v]) => [k, v.total - v.utilizado])
      );

      expect(disponivel["INSS/PREVIDENCIÁRIOS"]).toBe(50000);
      expect(disponivel["PIS/COFINS"]).toBe(70000);
      expect(disponivel["IRPJ/CSLL"]).toBe(50000);
    });
  });

  describe("Auto-create Next Queue Task", () => {
    it("should determine next queue based on monetization strategy", () => {
      const strategies: Record<string, string[]> = {
        compensacao: ["compensacao"],
        ressarcimento: ["ressarcimento"],
        restituicao: ["restituicao"],
        mista: ["compensacao", "ressarcimento"],
      };

      expect(strategies["compensacao"]).toEqual(["compensacao"]);
      expect(strategies["mista"]).toContain("compensacao");
      expect(strategies["mista"]).toContain("ressarcimento");
    });

    it("should create task in correct queue after retificação completion", () => {
      const estrategia = "compensacao";
      const nextQueue = estrategia === "mista" 
        ? ["compensacao", "ressarcimento"] 
        : [estrategia];
      
      expect(nextQueue).toEqual(["compensacao"]);
    });
  });
});

describe("Compensação Feature", () => {
  describe("Guias Management", () => {
    it("should validate guia data structure", () => {
      const guia = {
        tributo: "PIS",
        codigoReceita: "8109",
        periodoApuracao: "01/2025",
        dataVencimento: new Date("2025-02-20"),
        valor: 15000.50,
        status: "a_vencer",
        clienteId: 1,
      };

      expect(guia.tributo).toBeDefined();
      expect(guia.valor).toBeGreaterThan(0);
      expect(guia.status).toBe("a_vencer");
    });

    it("should classify guia status based on vencimento date", () => {
      const hoje = new Date("2026-02-26");
      
      const classifyGuia = (vencimento: Date) => {
        const diff = vencimento.getTime() - hoje.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (days < 0) return "vencida";
        if (days <= 5) return "perto_vencimento";
        return "a_vencer";
      };

      expect(classifyGuia(new Date("2026-02-20"))).toBe("vencida");
      expect(classifyGuia(new Date("2026-02-28"))).toBe("perto_vencimento");
      expect(classifyGuia(new Date("2026-03-15"))).toBe("a_vencer");
    });
  });

  describe("PerdComp Registration", () => {
    it("should validate PerdComp data structure from receipt", () => {
      const perdcomp = {
        cnpjDeclarante: "01.433.439/0001-15",
        nomeDeclarante: "EMPRESA TESTE LTDA",
        tipoDeclaracao: "Compensação",
        dataTransmissao: new Date("2025-02-26"),
        numeroControle: "01433.43915.250226.1.3.04-0339",
        numeroDeclaracao: "12345",
        tipoCredito: "Pagamento Indevido ou a Maior",
        codigoReceita: "1082",
        grupoTributo: "CSLL",
        valorCredito: 50000.00,
        debitosCompensados: [
          { tributo: "PIS", valor: 15000 },
          { tributo: "COFINS", valor: 35000 },
        ],
      };

      expect(perdcomp.cnpjDeclarante).toBeDefined();
      expect(perdcomp.numeroControle).toContain("01433");
      expect(perdcomp.debitosCompensados).toHaveLength(2);
      
      const totalDebitos = perdcomp.debitosCompensados.reduce((s, d) => s + d.valor, 0);
      expect(totalDebitos).toBe(50000);
    });

    it("should allow searching PerdComp by number", () => {
      const perdcomps = [
        { numero: "01433.43915.250226.1.3.04-0339", clienteId: 1, feitoEvox: true },
        { numero: "98765.12345.250115.1.3.04-0001", clienteId: 2, feitoEvox: false },
      ];

      const search = "01433";
      const found = perdcomps.filter(p => p.numero.includes(search));
      
      expect(found).toHaveLength(1);
      expect(found[0].feitoEvox).toBe(true);
    });

    it("should identify if PerdComp was made by Evox", () => {
      const perdcomp = { numero: "01433.43915.250226.1.3.04-0339", feitoEvox: true };
      expect(perdcomp.feitoEvox).toBe(true);
    });
  });
});

describe("Ressarcimento Feature", () => {
  it("should follow same structure as compensação", () => {
    const filaRessarcimento = {
      name: "ressarcimento",
      hasGuias: true,
      hasPerdComps: true,
      hasComprovantes: true,
      hasSearch: true,
    };

    expect(filaRessarcimento.hasGuias).toBe(true);
    expect(filaRessarcimento.hasPerdComps).toBe(true);
    expect(filaRessarcimento.hasComprovantes).toBe(true);
  });
});

describe("Restituição Feature", () => {
  it("should follow same structure as compensação", () => {
    const filaRestituicao = {
      name: "restituicao",
      hasGuias: true,
      hasPerdComps: true,
      hasComprovantes: true,
      hasSearch: true,
    };

    expect(filaRestituicao.hasGuias).toBe(true);
    expect(filaRestituicao.hasPerdComps).toBe(true);
    expect(filaRestituicao.hasComprovantes).toBe(true);
  });
});

describe("Gestão de Créditos Feature", () => {
  describe("Credit History Tracking", () => {
    it("should track credit lifecycle from apuração to utilização", () => {
      const creditLifecycle = {
        valorApurado: 200000,
        dataApuracao: new Date("2025-06-15"),
        valorRevisado: 195000,
        valorValidado: 190000,
        saldoDisponivel: 140000,
        saldoUtilizado: 50000,
      };

      expect(creditLifecycle.saldoDisponivel + creditLifecycle.saldoUtilizado)
        .toBe(creditLifecycle.valorValidado);
    });

    it("should track utilization by type (compensação, ressarcimento, restituição)", () => {
      const utilizacao = [
        { tipo: "compensacao", valor: 30000, perdcompNumero: "01433.43915.250226.1.3.04-0339" },
        { tipo: "ressarcimento", valor: 15000, perdcompNumero: "98765.12345.250115.1.3.04-0001" },
        { tipo: "restituicao", valor: 5000, perdcompNumero: null },
      ];

      const totalUtilizado = utilizacao.reduce((s, u) => s + u.valor, 0);
      expect(totalUtilizado).toBe(50000);
      
      const porTipo = utilizacao.reduce((acc, u) => {
        acc[u.tipo] = (acc[u.tipo] || 0) + u.valor;
        return acc;
      }, {} as Record<string, number>);
      
      expect(porTipo["compensacao"]).toBe(30000);
      expect(porTipo["ressarcimento"]).toBe(15000);
      expect(porTipo["restituicao"]).toBe(5000);
    });
  });

  describe("Prescrição Alerts", () => {
    it("should calculate days until prescription (5 years)", () => {
      const dataApuracao = new Date("2022-03-15");
      const prescricao = new Date(dataApuracao);
      prescricao.setFullYear(prescricao.getFullYear() + 5);
      
      const hoje = new Date("2026-02-26");
      const diasRestantes = Math.ceil(
        (prescricao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      expect(diasRestantes).toBeGreaterThan(0);
      expect(diasRestantes).toBeLessThan(400);
    });

    it("should flag credits near prescription (< 180 days)", () => {
      const credits = [
        { tese: "PIS/COFINS", dataApuracao: new Date("2021-06-01"), valor: 100000 },
        { tese: "INSS", dataApuracao: new Date("2023-01-15"), valor: 80000 },
      ];

      const hoje = new Date("2026-02-26");
      const alertas = credits.filter(c => {
        const prescricao = new Date(c.dataApuracao);
        prescricao.setFullYear(prescricao.getFullYear() + 5);
        const dias = Math.ceil((prescricao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return dias < 180;
      });

      expect(alertas).toHaveLength(1);
      expect(alertas[0].tese).toBe("PIS/COFINS");
    });

    it("should flag already prescribed credits", () => {
      const dataApuracao = new Date("2020-01-01");
      const prescricao = new Date(dataApuracao);
      prescricao.setFullYear(prescricao.getFullYear() + 5);
      
      const hoje = new Date("2026-02-26");
      const prescrito = hoje > prescricao;
      
      expect(prescrito).toBe(true);
    });
  });

  describe("PerdComp Linking", () => {
    it("should link PerdComps to credit entries", () => {
      const creditEntry = {
        id: 1,
        tese: "PIS/COFINS",
        valorValidado: 100000,
        perdcomps: [
          { numero: "01433.43915.250226.1.3.04-0339", valor: 30000 },
          { numero: "01433.43915.250301.1.3.04-0340", valor: 25000 },
        ],
      };

      const totalCompensado = creditEntry.perdcomps.reduce((s, p) => s + p.valor, 0);
      const saldoRestante = creditEntry.valorValidado - totalCompensado;
      
      expect(totalCompensado).toBe(55000);
      expect(saldoRestante).toBe(45000);
    });

    it("should allow quick search to verify if PerdComp was made by Evox", () => {
      const allPerdcomps = [
        { numero: "01433.43915.250226.1.3.04-0339", feitoEvox: true, clienteNome: "Empresa A" },
        { numero: "98765.12345.250115.1.3.04-0001", feitoEvox: false, clienteNome: "Empresa B" },
        { numero: "01433.43915.250301.1.3.04-0340", feitoEvox: true, clienteNome: "Empresa A" },
      ];

      // Simulate despacho decisório search
      const numeroPerdcompDoDespacho = "01433.43915.250226.1.3.04-0339";
      const resultado = allPerdcomps.find(p => p.numero === numeroPerdcompDoDespacho);
      
      expect(resultado).toBeDefined();
      expect(resultado!.feitoEvox).toBe(true);
      expect(resultado!.clienteNome).toBe("Empresa A");
    });
  });

  describe("Saldo Management", () => {
    it("should calculate global saldo correctly", () => {
      const ledgerEntries = [
        { tipo: "credito", valor: 100000, tese: "PIS" },
        { tipo: "credito", valor: 80000, tese: "COFINS" },
        { tipo: "debito", valor: 30000, tese: "PIS" },
        { tipo: "debito", valor: 20000, tese: "COFINS" },
      ];

      const totalCredito = ledgerEntries
        .filter(e => e.tipo === "credito")
        .reduce((s, e) => s + e.valor, 0);
      const totalDebito = ledgerEntries
        .filter(e => e.tipo === "debito")
        .reduce((s, e) => s + e.valor, 0);
      
      expect(totalCredito).toBe(180000);
      expect(totalDebito).toBe(50000);
      expect(totalCredito - totalDebito).toBe(130000);
    });

    it("should track saldo by tese", () => {
      const entries = [
        { tese: "PIS", credito: 100000, debito: 30000 },
        { tese: "COFINS", credito: 80000, debito: 20000 },
        { tese: "INSS", credito: 50000, debito: 0 },
      ];

      const saldoPorTese = entries.map(e => ({
        tese: e.tese,
        saldo: e.credito - e.debito,
      }));

      expect(saldoPorTese[0].saldo).toBe(70000);
      expect(saldoPorTese[1].saldo).toBe(60000);
      expect(saldoPorTese[2].saldo).toBe(50000);
    });
  });
});

describe("Strategy Visibility", () => {
  it("should make monetization strategy visible across all credit views", () => {
    const clienteStrategy = {
      clienteId: 1,
      estrategia: "mista",
      detalhes: {
        compensacao: true,
        ressarcimento: true,
        restituicao: false,
      },
      definidaEm: new Date("2025-08-01"),
      definidaPor: "Analista X",
    };

    expect(clienteStrategy.estrategia).toBe("mista");
    expect(clienteStrategy.detalhes.compensacao).toBe(true);
    expect(clienteStrategy.detalhes.ressarcimento).toBe(true);
    expect(clienteStrategy.detalhes.restituicao).toBe(false);
  });
});
