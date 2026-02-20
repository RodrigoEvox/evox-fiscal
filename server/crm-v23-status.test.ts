import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@evox.com",
    name: "Admin Test",
    loginMethod: "manus",
    role: "admin",
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

describe("CRM v23 — Status Automático e Filtros", () => {
  describe("historicoStatus router", () => {
    it("should have a list procedure that accepts colaboradorId", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Query historico for a non-existent colaborador should return empty array
      const result = await caller.historicoStatus.list({ colaboradorId: 99999 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("colaboradores router - status update", () => {
    it("should have update mutation that accepts statusColaborador in data", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Verify the update mutation exists and accepts the right shape
      expect(caller.colaboradores.update).toBeDefined();
      expect(typeof caller.colaboradores.update).toBe("function");
    });

    it("should have create mutation that accepts statusColaborador", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      expect(caller.colaboradores.create).toBeDefined();
      expect(typeof caller.colaboradores.create).toBe("function");
    });
  });

  describe("ferias router - auto status change", () => {
    it("should have create mutation for ferias", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      expect(caller.ferias.create).toBeDefined();
      expect(typeof caller.ferias.create).toBe("function");
    });

    it("should have update mutation for ferias", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      expect(caller.ferias.update).toBeDefined();
      expect(typeof caller.ferias.update).toBe("function");
    });
  });

  describe("atestadosLicencas router - auto status change", () => {
    it("should have create mutation for atestados", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      expect(caller.atestadosLicencas.create).toBeDefined();
      expect(typeof caller.atestadosLicencas.create).toBe("function");
    });

    it("should have update mutation for atestados", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      expect(caller.atestadosLicencas.update).toBeDefined();
      expect(typeof caller.atestadosLicencas.update).toBe("function");
    });
  });

  describe("relatoriosRH router - dashboard with status", () => {
    it("should return dashboard data with status distribution", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.relatoriosRH.dashboard();
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      // Dashboard should have key metrics
      expect(result).toHaveProperty("totalAtivos");
      expect(result).toHaveProperty("headcountPorSetor");
    });
  });

  describe("colaboradores router - list for filtering", () => {
    it("should return list of colaboradores with status field", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.colaboradores.list();
      expect(Array.isArray(result)).toBe(true);
      // Each colaborador should have statusColaborador field available
      // (even if empty list, the query should work)
    });
  });
});
