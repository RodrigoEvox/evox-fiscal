import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@evox.com",
    name: "Teste Evox",
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

// ---- ONBOARDING DIGITAL ----
describe("onboarding.templates", () => {
  it("lists templates (returns array)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.onboarding.templates.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a template with etapas", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const templateId = await caller.onboarding.templates.create({
      nome: "Template Teste Onboarding",
      descricao: "Template para testes automatizados",
      etapas: [
        { titulo: "Enviar documentos pessoais", categoria: "documentos", ordem: 0, obrigatoria: true, prazoEmDias: 3 },
        { titulo: "Treinamento de integração", categoria: "treinamentos", ordem: 1, obrigatoria: true, prazoEmDias: 5 },
        { titulo: "Configurar acessos ao sistema", categoria: "acessos", ordem: 2, obrigatoria: true, prazoEmDias: 2 },
      ],
    });
    expect(templateId).toBeDefined();
    expect(typeof templateId).toBe("number");

    // Verify etapas were created
    const etapas = await caller.onboarding.templates.etapas({ templateId: templateId as number });
    expect(Array.isArray(etapas)).toBe(true);
    expect(etapas.length).toBe(3);
    expect(etapas[0].titulo).toBe("Enviar documentos pessoais");
  });

  it("updates a template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const templates = await caller.onboarding.templates.list();
    if (templates.length > 0) {
      const t = templates[0] as any;
      const result = await caller.onboarding.templates.update({ id: t.id, nome: "Template Atualizado" });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("onboarding.list", () => {
  it("lists onboardings (returns array)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.onboarding.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---- PESQUISA DE CLIMA ----
describe("pesquisaClima", () => {
  it("lists pesquisas (returns array)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pesquisaClima.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a pesquisa with perguntas", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pesquisaId = await caller.pesquisaClima.create({
      titulo: "Pesquisa Clima Teste Q1",
      descricao: "Pesquisa de teste automatizado",
      anonima: true,
      dataInicio: "2026-01-01",
      dataFim: "2026-03-31",
      perguntas: [
        { texto: "Como você avalia o ambiente de trabalho?", tipo: "escala", ordem: 0, obrigatoria: true, categoria: "Ambiente" },
        { texto: "Você se sente valorizado?", tipo: "sim_nao", ordem: 1, obrigatoria: true, categoria: "Reconhecimento" },
        { texto: "Qual aspecto precisa melhorar?", tipo: "texto_livre", ordem: 2, obrigatoria: false },
        { texto: "Como avalia a liderança?", tipo: "multipla_escolha", opcoes: ["Excelente", "Bom", "Regular", "Ruim"], ordem: 3, obrigatoria: true, categoria: "Liderança" },
      ],
    });
    expect(pesquisaId).toBeDefined();
    expect(typeof pesquisaId).toBe("number");

    // Verify perguntas were created
    const perguntas = await caller.pesquisaClima.perguntas({ pesquisaId: pesquisaId as number });
    expect(Array.isArray(perguntas)).toBe(true);
    expect(perguntas.length).toBe(4);
  });

  it("updates pesquisa status to ativa", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pesquisas = await caller.pesquisaClima.list();
    const rascunho = (pesquisas as any[]).find(p => p.status === "rascunho");
    if (rascunho) {
      const result = await caller.pesquisaClima.update({ id: rascunho.id, status: "ativa" });
      expect(result).toEqual({ success: true });
    }
  });

  it("submits respostas to a pesquisa", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pesquisas = await caller.pesquisaClima.list();
    const ativa = (pesquisas as any[]).find(p => p.status === "ativa");
    if (ativa) {
      const perguntas = await caller.pesquisaClima.perguntas({ pesquisaId: ativa.id });
      if (perguntas.length > 0) {
        const respostas = (perguntas as any[]).map(p => ({
          perguntaId: p.id,
          valorEscala: p.tipo === "escala" ? 4 : undefined,
          valorTexto: p.tipo === "texto_livre" ? "Precisa melhorar comunicação" : undefined,
          valorOpcao: p.tipo === "sim_nao" ? "sim" : p.tipo === "multipla_escolha" ? "Bom" : undefined,
        }));
        const result = await caller.pesquisaClima.responder({ pesquisaId: ativa.id, respostas });
        expect(result).toEqual({ success: true });
      }
    }
  });

  it("gets resultados of a pesquisa", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pesquisas = await caller.pesquisaClima.list();
    if (pesquisas.length > 0) {
      const p = pesquisas[0] as any;
      const resultados = await caller.pesquisaClima.resultados({ pesquisaId: p.id });
      expect(resultados).toBeDefined();
      expect(resultados).toHaveProperty("perguntas");
      expect(resultados).toHaveProperty("respostas");
    }
  });

  it("exports PDF data for a pesquisa", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pesquisas = await caller.pesquisaClima.list();
    if (pesquisas.length > 0) {
      const p = pesquisas[0] as any;
      const pdfData = await caller.pesquisaClima.exportPdf({ pesquisaId: p.id });
      expect(pdfData).toBeDefined();
      expect(pdfData).toHaveProperty("pesquisa");
      expect(pdfData).toHaveProperty("perguntas");
      expect(pdfData).toHaveProperty("respostas");
      expect(pdfData.pesquisa.titulo).toBeDefined();
    }
  });
});

// ---- BANCO DE HORAS ----
describe("bancoHoras", () => {
  it("lists registros (returns array)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bancoHoras.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a banco de horas entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const id = await caller.bancoHoras.create({
      colaboradorId: 1,
      colaboradorNome: "Colaborador Teste",
      tipo: "extra",
      data: "2026-02-15",
      horas: "2.5",
      motivo: "Projeto urgente",
    });
    expect(id).toBeDefined();
    expect(typeof id).toBe("number");
  });

  it("creates a compensacao entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const id = await caller.bancoHoras.create({
      colaboradorId: 1,
      colaboradorNome: "Colaborador Teste",
      tipo: "compensacao",
      data: "2026-02-17",
      horas: "1.0",
      motivo: "Compensação de horas",
    });
    expect(id).toBeDefined();
  });

  it("approves a banco de horas entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const registros = await caller.bancoHoras.list();
    const pendente = (registros as any[]).find(r => !r.aprovado);
    if (pendente) {
      const result = await caller.bancoHoras.update({ id: pendente.id, aprovado: true });
      expect(result).toEqual({ success: true });
    }
  });

  it("gets saldo for a colaborador", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const saldo = await caller.bancoHoras.saldo({ colaboradorId: 1 });
    expect(saldo).toBeDefined();
    expect(saldo).toHaveProperty("extras");
    expect(saldo).toHaveProperty("compensacoes");
    expect(saldo).toHaveProperty("saldo");
  });

  it("gets all saldos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const saldos = await caller.bancoHoras.saldos();
    expect(Array.isArray(saldos)).toBe(true);
    if (saldos.length > 0) {
      expect(saldos[0]).toHaveProperty("colaboradorId");
      expect(saldos[0]).toHaveProperty("saldo");
    }
  });

  it("deletes a banco de horas entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const registros = await caller.bancoHoras.list();
    if (registros.length > 0) {
      const last = registros[registros.length - 1] as any;
      const result = await caller.bancoHoras.delete({ id: last.id });
      expect(result).toEqual({ success: true });
    }
  });
});
