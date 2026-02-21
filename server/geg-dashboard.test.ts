import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("dashboardGEG", () => {
  it("returns consolidated GEG dashboard data with correct shape", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboardGEG.get({});

    // Verify top-level structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty("vt");
    expect(result).toHaveProperty("academia");
    expect(result).toHaveProperty("comissoes");
    expect(result).toHaveProperty("reajustesPendentes");
    expect(result).toHaveProperty("reajustesPendentesLista");
    expect(result).toHaveProperty("dayOffs");
    expect(result).toHaveProperty("custoTotalMes");
    expect(result).toHaveProperty("evolucao");
    expect(result).toHaveProperty("proximosAniversarios");

    // Verify VT shape
    expect(result.vt).toHaveProperty("total");
    expect(result.vt).toHaveProperty("qtd");
    expect(typeof result.vt.total).toBe("number");
    expect(typeof result.vt.qtd).toBe("number");

    // Verify Academia shape
    expect(result.academia).toHaveProperty("total");
    expect(result.academia).toHaveProperty("qtd");
    expect(typeof result.academia.total).toBe("number");
    expect(typeof result.academia.qtd).toBe("number");

    // Verify Comissoes shape
    expect(result.comissoes).toHaveProperty("total");
    expect(result.comissoes).toHaveProperty("qtd");
    expect(typeof result.comissoes.total).toBe("number");
    expect(typeof result.comissoes.qtd).toBe("number");

    // Verify reajustesPendentes is a number
    expect(typeof result.reajustesPendentes).toBe("number");
    expect(result.reajustesPendentes).toBeGreaterThanOrEqual(0);

    // Verify reajustesPendentesLista is an array
    expect(Array.isArray(result.reajustesPendentesLista)).toBe(true);

    // Verify dayOffs shape
    expect(result.dayOffs).toHaveProperty("total");
    expect(result.dayOffs).toHaveProperty("aprovados");
    expect(result.dayOffs).toHaveProperty("pendentes");
    expect(typeof result.dayOffs.total).toBe("number");
    expect(typeof result.dayOffs.aprovados).toBe("number");
    expect(typeof result.dayOffs.pendentes).toBe("number");

    // Verify custoTotalMes is a number
    expect(typeof result.custoTotalMes).toBe("number");
    expect(result.custoTotalMes).toBeGreaterThanOrEqual(0);

    // Verify evolucao is an array
    expect(Array.isArray(result.evolucao)).toBe(true);

    // Verify proximosAniversarios is an array
    expect(Array.isArray(result.proximosAniversarios)).toBe(true);
  });

  it("custoTotalMes equals sum of VT + Academia + Comissoes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboardGEG.get({});

    const expectedTotal = result.vt.total + result.academia.total + result.comissoes.total;
    expect(result.custoTotalMes).toBeCloseTo(expectedTotal, 2);
  });

  it("reajustesPendentes matches reajustesPendentesLista length", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboardGEG.get({});

    expect(result.reajustesPendentes).toBe(result.reajustesPendentesLista.length);
  });

  it("evolucao entries have correct shape when present", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboardGEG.get({});

    if (result.evolucao.length > 0) {
      const entry = result.evolucao[0];
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("vt");
      expect(entry).toHaveProperty("academia");
      expect(entry).toHaveProperty("comissoes");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.vt).toBe("number");
      expect(typeof entry.academia).toBe("number");
      expect(typeof entry.comissoes).toBe("number");
    }
  });

  it("reajustesPendentesLista entries have correct shape when present", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboardGEG.get({});

    if (result.reajustesPendentesLista.length > 0) {
      const entry = result.reajustesPendentesLista[0];
      expect(entry).toHaveProperty("colaboradorId");
      expect(entry).toHaveProperty("nome");
      expect(entry).toHaveProperty("dataAdmissao");
      expect(entry).toHaveProperty("anosCompletos");
      expect(entry).toHaveProperty("salarioAtual");
      expect(entry).toHaveProperty("salarioEstimado");
      expect(typeof entry.colaboradorId).toBe("number");
      expect(typeof entry.nome).toBe("string");
      expect(typeof entry.anosCompletos).toBe("number");
      expect(typeof entry.salarioAtual).toBe("number");
      expect(typeof entry.salarioEstimado).toBe("number");
    }
  });

  it("proximosAniversarios entries have correct shape when present", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboardGEG.get({});

    if (result.proximosAniversarios.length > 0) {
      const entry = result.proximosAniversarios[0];
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("nome");
      expect(entry).toHaveProperty("dataNascimento");
      expect(entry).toHaveProperty("diasAte");
      expect(typeof entry.id).toBe("number");
      expect(typeof entry.nome).toBe("string");
      expect(typeof entry.diasAte).toBe("number");
    }
  });
});
