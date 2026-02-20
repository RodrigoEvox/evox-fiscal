import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-v25",
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

describe("CRM v25 — Aniversariantes", () => {
  it("should return aniversariantes.mes as an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.aniversariantes.mes({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CRM v25 — Contratos Vencendo", () => {
  it("should return contratosVencendo.list as an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contratosVencendo.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CRM v25 — Workflow Renovação", () => {
  it("should return workflowRenovacao.list as an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflowRenovacao.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should run verificar and return result", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflowRenovacao.verificar();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("criados");
    expect(typeof result.total).toBe("number");
    expect(typeof result.criados).toBe("number");
  });
});

describe("CRM v25 — Email Aniversariante", () => {
  it("should return email config", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailAniversariante.getConfig();
    expect(result).toHaveProperty("assunto");
    expect(result).toHaveProperty("mensagem");
    expect(result).toHaveProperty("assinatura");
    expect(result).toHaveProperty("ativo");
  });

  it("should save email config", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailAniversariante.saveConfig({
      assunto: "Feliz Aniversário!",
      mensagem: "Olá {nome}, parabéns pelo seu aniversário!",
      assinatura: "Equipe Evox",
      ativo: true,
    });
    expect(result).toBeTruthy();
  });

  it("should return historico as an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailAniversariante.historico({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should run enviar and return result", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailAniversariante.enviar();
    expect(result).toHaveProperty("mensagem");
    expect(typeof result.enviados).toBe("number");
  });
});
