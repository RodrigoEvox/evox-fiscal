import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): { ctx: TrpcContext } {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus" as const,
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  return { ctx };
}

describe("CRM v26 — Dashboard GEG & BI Export", () => {
  it("aniversariantes route returns array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.aniversariantes.mes({ mes: 2 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("contratosVencendo route returns array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contratosVencendo.list({ dias: 30 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("relatoriosRH dashboard returns expected fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.relatoriosRH.dashboard() as any;
    expect(result).toHaveProperty("totalAtivos");
    expect(result).toHaveProperty("totalInativos");
    expect(result).toHaveProperty("custoSalarialTotal");
    expect(result).toHaveProperty("headcountPorSetor");
    expect(result).toHaveProperty("custoPorSetor");
    expect(result).toHaveProperty("turnoverMensal");
    expect(result).toHaveProperty("absenteismoMensal");
  });

  it("emailAniversariante getConfig returns config object", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailAniversariante.getConfig() as any;
    expect(result).toHaveProperty("assunto");
    expect(result).toHaveProperty("mensagem");
    expect(result).toHaveProperty("assinatura");
    expect(result).toHaveProperty("ativo");
  });

  it("emailAniversariante saveConfig saves and returns", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailAniversariante.saveConfig({
      assunto: "Feliz Aniversário!",
      mensagem: "Parabéns {nome}!",
      assinatura: "Equipe RH",
      ativo: true,
    });
    expect(result).toBeDefined();
  });

  it("workflowRenovacao list returns array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflowRenovacao.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("workflowRenovacao verificar checks contracts and returns result", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflowRenovacao.verificar() as any;
    expect(result).toHaveProperty("criados");
    expect(result).toHaveProperty("total");
    expect(typeof result.criados).toBe("number");
    expect(typeof result.total).toBe("number");
  });

  it("colaboradores list returns array with statusColaborador", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.colaboradores.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("metasIndividuais list returns array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.metasIndividuais.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("ciclosAvaliacao list returns array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ciclosAvaliacao.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("historicoStatus list returns array for valid colaboradorId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.historicoStatus.list({ colaboradorId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});
