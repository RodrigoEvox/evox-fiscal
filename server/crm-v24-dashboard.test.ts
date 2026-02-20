import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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

describe("aniversariantes", () => {
  it("should return aniversariantes for the current month", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aniversariantes.mes();
    expect(Array.isArray(result)).toBe(true);
    // Each item should have nomeCompleto, dataNascimento, cargo
    for (const item of result) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("nomeCompleto");
      expect(item).toHaveProperty("dataNascimento");
    }
  });

  it("should accept a specific month parameter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aniversariantes.mes({ mes: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should filter by month correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Month 12 (December) - should return array
    const result = await caller.aniversariantes.mes({ mes: 12 });
    expect(Array.isArray(result)).toBe(true);
    // All returned items should have birth month = 12
    for (const item of result) {
      if (item.dataNascimento) {
        const month = parseInt(item.dataNascimento.substring(5, 7));
        expect(month).toBe(12);
      }
    }
  });
});

describe("contratosVencendo", () => {
  it("should return contracts expiring within default 30 days", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contratosVencendo.list();
    expect(Array.isArray(result)).toBe(true);
    for (const item of result) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("nomeCompleto");
      expect(item).toHaveProperty("diasRestantes");
      expect(item).toHaveProperty("dataVencimento");
      expect(typeof item.diasRestantes).toBe("number");
      expect(item.diasRestantes).toBeLessThanOrEqual(30);
      expect(item.diasRestantes).toBeGreaterThanOrEqual(0);
    }
  });

  it("should accept custom diasAntecedencia", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contratosVencendo.list({ diasAntecedencia: 7 });
    expect(Array.isArray(result)).toBe(true);
    for (const item of result) {
      expect(item.diasRestantes).toBeLessThanOrEqual(7);
    }
  });
});

describe("historicoStatus", () => {
  it("should return status history for a collaborator", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.historicoStatus.list({ colaboradorId: 1 });
    expect(Array.isArray(result)).toBe(true);
    for (const item of result) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("statusAnterior");
      expect(item).toHaveProperty("statusNovo");
    }
  });
});

describe("relatoriosRH.dashboard", () => {
  it("should return dashboard data with status distribution", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.relatoriosRH.dashboard();
    expect(result).toHaveProperty("totalAtivos");
    expect(result).toHaveProperty("headcountPorSetor");
    expect(result).toHaveProperty("custoPorSetor");
    expect(result).toHaveProperty("turnoverMensal");
    expect(result).toHaveProperty("absenteismoMensal");
    expect(typeof result.totalAtivos).toBe("number");
    expect(typeof result.custoSalarialTotal).toBe("number");
  });
});
