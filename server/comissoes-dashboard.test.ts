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

describe("comissoesDashboard", () => {
  describe("consolidated", () => {
    it("returns consolidated dashboard data without filters", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.consolidated();

      // Should return the expected structure
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("kpis");
        expect(result).toHaveProperty("ranking");
        expect(result).toHaveProperty("evolucaoMensal");
        expect(result).toHaveProperty("parceiros");
        expect(result).toHaveProperty("modelos");

        // KPIs structure
        expect(result.kpis).toHaveProperty("totalComissoes");
        expect(result.kpis).toHaveProperty("totalAprovadas");
        expect(result.kpis).toHaveProperty("totalPendentes");
        expect(result.kpis).toHaveProperty("totalRejeitadas");
        expect(result.kpis).toHaveProperty("valorTotalAprovado");
        expect(result.kpis).toHaveProperty("valorTotalPendente");
        expect(result.kpis).toHaveProperty("totalParceiros");
        expect(result.kpis).toHaveProperty("parceirosAtivos");

        // Types check
        expect(typeof result.kpis.totalComissoes).toBe("number");
        expect(typeof result.kpis.valorTotalAprovado).toBe("number");
        expect(Array.isArray(result.ranking)).toBe(true);
        expect(Array.isArray(result.evolucaoMensal)).toBe(true);
        expect(Array.isArray(result.parceiros)).toBe(true);
        expect(Array.isArray(result.modelos)).toBe(true);
      }
    });

    it("returns consolidated data with date filters", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.consolidated({
        dataInicio: "2025-01-01",
        dataFim: "2025-12-31",
      });

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("kpis");
        expect(typeof result.kpis.valorTotalAprovado).toBe("number");
      }
    });

    it("returns consolidated data with tipo parceiro filter", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.consolidated({
        tipoParceiro: "pj",
      });

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("kpis");
      }
    });
  });

  describe("comparativo", () => {
    it("returns comparison data for two periods", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.comparativo({
        periodoA: { dataInicio: "2025-07-01", dataFim: "2025-12-31" },
        periodoB: { dataInicio: "2025-01-01", dataFim: "2025-06-30" },
      });

      expect(result).toBeDefined();
      if (result) {
        // Structure checks
        expect(result).toHaveProperty("periodoA");
        expect(result).toHaveProperty("periodoB");
        expect(result).toHaveProperty("deltas");
        expect(result).toHaveProperty("rankingComparativo");

        // Period A structure
        expect(result.periodoA).toHaveProperty("kpis");
        expect(result.periodoA).toHaveProperty("evolucao");
        expect(result.periodoA.kpis).toHaveProperty("totalComissoes");
        expect(result.periodoA.kpis).toHaveProperty("totalAprovadas");
        expect(result.periodoA.kpis).toHaveProperty("valorTotalAprovado");

        // Period B structure
        expect(result.periodoB).toHaveProperty("kpis");
        expect(result.periodoB).toHaveProperty("evolucao");

        // Deltas structure
        expect(result.deltas).toHaveProperty("totalComissoes");
        expect(result.deltas).toHaveProperty("totalAprovadas");
        expect(result.deltas).toHaveProperty("valorTotalAprovado");
        expect(result.deltas).toHaveProperty("valorTotalPendente");

        // Types
        expect(typeof result.deltas.totalComissoes).toBe("number");
        expect(typeof result.deltas.valorTotalAprovado).toBe("number");
        expect(Array.isArray(result.periodoA.evolucao)).toBe(true);
        expect(Array.isArray(result.periodoB.evolucao)).toBe(true);
        expect(Array.isArray(result.rankingComparativo)).toBe(true);
      }
    });

    it("returns comparison data with additional filters", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.comparativo({
        periodoA: { dataInicio: "2025-07-01", dataFim: "2025-12-31" },
        periodoB: { dataInicio: "2025-01-01", dataFim: "2025-06-30" },
        tipoParceiro: "pf",
      });

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("deltas");
      }
    });

    it("handles periods with no data gracefully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.comparativo({
        periodoA: { dataInicio: "2030-01-01", dataFim: "2030-06-30" },
        periodoB: { dataInicio: "2030-07-01", dataFim: "2030-12-31" },
      });

      expect(result).toBeDefined();
      if (result) {
        expect(result.periodoA.kpis.totalComissoes).toBe(0);
        expect(result.periodoB.kpis.totalComissoes).toBe(0);
        expect(result.deltas.totalComissoes).toBe(0);
        expect(result.rankingComparativo).toHaveLength(0);
      }
    });
  });

  describe("metas CRUD", () => {
    let createdMetaId: number | null = null;

    it("creates a new meta de comissão", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // We need a valid parceiroId; let's get one from the consolidated data
      const dashboard = await caller.comissoesDashboard.consolidated();
      const parceiros = (dashboard as any)?.parceiros || [];
      
      if (parceiros.length === 0) {
        // Skip if no parceiros exist
        console.log("No parceiros found, skipping meta creation test");
        return;
      }

      const parceiroId = parceiros[0].id;

      const result = await caller.comissoesDashboard.createMeta({
        parceiroId,
        tipo: "mensal",
        ano: 2026,
        mes: 2,
        valorMeta: "50000.00",
        observacao: "Meta de teste vitest",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
      createdMetaId = result.id;
    });

    it("lists metas de comissões", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.listMetas({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // If we created a meta, it should be in the list
      if (createdMetaId) {
        const found = result.find((m: any) => m.id === createdMetaId);
        expect(found).toBeDefined();
        if (found) {
          expect(found.tipo).toBe("mensal");
          expect(found.ano).toBe(2026);
          expect(found.mes).toBe(2);
          expect(found.observacao).toBe("Meta de teste vitest");
        }
      }
    });

    it("gets metas progresso for a period", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.metasProgresso({
        ano: 2026,
        mes: 2,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // If we created a meta, check its progress
      if (createdMetaId && result.length > 0) {
        const found = result.find((m: any) => m.id === createdMetaId);
        if (found) {
          expect(found).toHaveProperty("parceiroNome");
          expect(found).toHaveProperty("valorMeta");
          expect(found).toHaveProperty("realizado");
          expect(found).toHaveProperty("percentual");
          expect(found).toHaveProperty("status");
          expect(typeof found.percentual).toBe("number");
          expect(["atingida", "em_progresso", "abaixo"]).toContain(found.status);
        }
      }
    });

    it("updates a meta de comissão", async () => {
      if (!createdMetaId) return;

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.updateMeta({
        id: createdMetaId,
        valorMeta: "75000.00",
        observacao: "Meta atualizada pelo vitest",
      });

      expect(result).toEqual({ success: true });

      // Verify the update
      const metas = await caller.comissoesDashboard.listMetas({});
      const updated = metas.find((m: any) => m.id === createdMetaId);
      if (updated) {
        expect(updated.observacao).toBe("Meta atualizada pelo vitest");
      }
    });

    it("deletes a meta de comissão", async () => {
      if (!createdMetaId) return;

      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.deleteMeta({
        id: createdMetaId,
      });

      expect(result).toEqual({ success: true });

      // Verify deletion
      const metas = await caller.comissoesDashboard.listMetas({});
      const found = metas.find((m: any) => m.id === createdMetaId);
      expect(found).toBeUndefined();
    });
  });

  describe("metaProgressoParceiro", () => {
    it("returns progress for a specific partner", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.comissoesDashboard.metaProgressoParceiro({
        parceiroId: 1,
        ano: 2026,
        mes: 1,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("meta");
      expect(result).toHaveProperty("realizado");
      expect(typeof result.realizado).toBe("number");
    });
  });
});
