import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-rh",
    email: "rh@evox.com",
    name: "RH Test User",
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

describe("ciclosAvaliacao router", () => {
  it("should list ciclos de avaliação", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ciclosAvaliacao.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a ciclo de avaliação", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ciclosAvaliacao.create({
      titulo: "Avaliação Teste 1° Semestre",
      descricao: "Ciclo de teste",
      dataInicio: "2026-01-01",
      dataFim: "2026-06-30",
      status: "rascunho",
      criterios: [
        { nome: "Qualidade", peso: 50, descricao: "Qualidade do trabalho" },
        { nome: "Produtividade", peso: 50, descricao: "Volume de entregas" },
      ],
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should update a ciclo de avaliação", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // First create
    const { id } = await caller.ciclosAvaliacao.create({
      titulo: "Ciclo para Update",
      dataInicio: "2026-01-01",
      dataFim: "2026-06-30",
    });
    // Then update
    const result = await caller.ciclosAvaliacao.update({
      id,
      data: { titulo: "Ciclo Atualizado", status: "em_andamento" },
    });
    expect(result).toEqual({ success: true });
  });

  it("should delete a ciclo de avaliação", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { id } = await caller.ciclosAvaliacao.create({
      titulo: "Ciclo para Deletar",
      dataInicio: "2026-01-01",
      dataFim: "2026-06-30",
    });
    const result = await caller.ciclosAvaliacao.delete({ id });
    expect(result).toEqual({ success: true });
  });
});

describe("avaliacoes router", () => {
  it("should list avaliações", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.avaliacoes.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create an avaliação", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Create a ciclo first
    const ciclo = await caller.ciclosAvaliacao.create({
      titulo: "Ciclo para Avaliação",
      dataInicio: "2026-01-01",
      dataFim: "2026-06-30",
    });
    const result = await caller.avaliacoes.create({
      cicloId: ciclo.id,
      colaboradorId: 1,
      colaboradorNome: "Colaborador Teste",
      avaliadorId: 1,
      avaliadorNome: "Avaliador Teste",
      tipoAvaliador: "gestor",
      notas: [{ criterio: "Qualidade", nota: 8, comentario: "Bom trabalho" }],
      notaGeral: "8.00",
      comentarioGeral: "Avaliação positiva",
      pontosFortes: "Proatividade",
      pontosDesenvolvimento: "Comunicação",
      status: "concluida",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should delete an avaliação", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const ciclo = await caller.ciclosAvaliacao.create({
      titulo: "Ciclo para Delete Aval",
      dataInicio: "2026-01-01",
      dataFim: "2026-06-30",
    });
    const aval = await caller.avaliacoes.create({
      cicloId: ciclo.id,
      colaboradorId: 1,
      avaliadorId: 1,
      tipoAvaliador: "par",
    });
    const result = await caller.avaliacoes.delete({ id: aval.id });
    expect(result).toEqual({ success: true });
  });
});

describe("colaboradorDocumentos router", () => {
  it("should list documentos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.colaboradorDocumentos.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a documento", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.colaboradorDocumentos.create({
      colaboradorId: 1,
      tipo: "rg",
      nomeArquivo: "rg-teste.pdf",
      url: "https://example.com/rg-teste.pdf",
      fileKey: "colaborador-docs/1/rg-test123.pdf",
      mimeType: "application/pdf",
      tamanho: 1024,
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should delete a documento", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const doc = await caller.colaboradorDocumentos.create({
      colaboradorId: 1,
      tipo: "foto",
      nomeArquivo: "foto-teste.jpg",
      url: "https://example.com/foto-teste.jpg",
      fileKey: "colaborador-docs/1/foto-test456.jpg",
    });
    const result = await caller.colaboradorDocumentos.delete({ id: doc.id });
    expect(result).toEqual({ success: true });
  });
});

describe("relatoriosRH router", () => {
  it("should return dashboard data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.relatoriosRH.dashboard();
    expect(result).toHaveProperty("totalAtivos");
    expect(result).toHaveProperty("totalInativos");
    expect(result).toHaveProperty("custoSalarialTotal");
    expect(result).toHaveProperty("headcountPorSetor");
    expect(result).toHaveProperty("turnoverMensal");
    expect(result).toHaveProperty("absenteismoMensal");
    expect(result).toHaveProperty("porContrato");
    expect(result).toHaveProperty("porSexo");
    expect(typeof result.totalAtivos).toBe("number");
    expect(typeof result.custoSalarialTotal).toBe("number");
    expect(Array.isArray(result.turnoverMensal)).toBe(true);
    expect(result.turnoverMensal.length).toBe(12);
    expect(Array.isArray(result.absenteismoMensal)).toBe(true);
    expect(result.absenteismoMensal.length).toBe(12);
  });
});
