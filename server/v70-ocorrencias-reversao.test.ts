import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-ocorrencias",
    email: "rh@grupoevox.com.br",
    name: "Gestor RH",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

describe("ocorrencias", () => {
  const { ctx } = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("lists ocorrencias (initially may be empty or have data)", async () => {
    const result = await caller.ocorrencias.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns stats object with expected keys", async () => {
    const stats = await caller.ocorrencias.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("pendentes");
    expect(stats).toHaveProperty("emAnalise");
    expect(stats).toHaveProperty("resolvidas");
    expect(stats).toHaveProperty("encaminhadasReversao");
    expect(stats).toHaveProperty("encaminhadasDesligamento");
    expect(typeof stats.total).toBe("number");
  });

  it("creates an ocorrencia with automatic classification (leve = reversivel)", async () => {
    const result = await caller.ocorrencias.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Colaborador",
      cargo: "Analista",
      setor: "Financeiro",
      tipo: "falta_injustificada",
      gravidade: "leve",
      descricao: "Faltou sem justificativa no dia 10/02",
      dataOcorrencia: "2026-02-10",
      evidencias: "Registro de ponto",
      testemunhas: "Supervisor Joao",
      medidasTomadas: "Advertencia verbal",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("classificacao");
    expect(result).toHaveProperty("recomendacao");
    expect(result.classificacao).toBe("reversivel");
  });

  it("creates an ocorrencia with gravissima = irreversivel", async () => {
    const result = await caller.ocorrencias.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Grave",
      tipo: "conduta_inapropriada",
      gravidade: "gravissima",
      descricao: "Conduta gravissima no ambiente de trabalho",
      dataOcorrencia: "2026-02-15",
    });
    expect(result.classificacao).toBe("irreversivel");
    expect(result.recomendacao).toBe("desligamento");
  });

  it("gets a specific ocorrencia by id", async () => {
    const created = await caller.ocorrencias.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Get",
      tipo: "atraso_frequente",
      gravidade: "media",
      descricao: "Atrasos recorrentes",
      dataOcorrencia: "2026-02-20",
    });
    const ocorrencia = await caller.ocorrencias.get({ id: created.id });
    expect(ocorrencia).toBeTruthy();
    expect(ocorrencia?.colaboradorNome).toBe("Teste Get");
  });

  it("updates ocorrencia status", async () => {
    const created = await caller.ocorrencias.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Update",
      tipo: "erro_trabalho",
      gravidade: "leve",
      descricao: "Erro no relatorio",
      dataOcorrencia: "2026-02-21",
    });
    const result = await caller.ocorrencias.update({
      id: created.id,
      status: "em_analise",
    });
    expect(result).toEqual({ success: true });
  });

  it("deletes an ocorrencia", async () => {
    const created = await caller.ocorrencias.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Delete",
      tipo: "conflito_interno",
      gravidade: "media",
      descricao: "Conflito entre colegas",
      dataOcorrencia: "2026-02-22",
    });
    const result = await caller.ocorrencias.delete({ id: created.id });
    expect(result).toEqual({ success: true });
  });

  it("lists ocorrencias filtered by colaboradorId", async () => {
    const result = await caller.ocorrencias.list({ colaboradorId: 99999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("planosReversao", () => {
  const { ctx } = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("lists planos (initially may be empty or have data)", async () => {
    const result = await caller.planosReversao.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a plano de reversao", async () => {
    const result = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Plano",
      cargo: "Assistente",
      setor: "Operacoes",
      motivo: "Reincidencia de atrasos",
      objetivos: "Reduzir atrasos a zero em 30 dias",
      dataInicio: "2026-03-01",
      dataFim: "2026-04-01",
      responsavel: "Maria Gestora",
      frequenciaAcompanhamento: "semanal",
      observacoes: "Colaborador comprometeu-se a melhorar",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("gets a specific plano by id", async () => {
    const created = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Get Plano",
      motivo: "Erros recorrentes",
      objetivos: "Melhorar qualidade do trabalho",
      dataInicio: "2026-03-01",
      dataFim: "2026-05-01",
      responsavel: "Joao Supervisor",
    });
    const plano = await caller.planosReversao.get({ id: created.id });
    expect(plano).toBeTruthy();
    expect(plano?.colaboradorNome).toBe("Teste Get Plano");
  });

  it("updates plano status", async () => {
    const created = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Update Plano",
      motivo: "Conduta inapropriada",
      objetivos: "Melhorar comportamento",
      dataInicio: "2026-03-01",
      dataFim: "2026-04-15",
      responsavel: "Ana Diretora",
    });
    const result = await caller.planosReversao.update({
      id: created.id,
      status: "concluido_sucesso",
      resultadoFinal: "Colaborador atingiu todas as metas",
    });
    expect(result).toEqual({ success: true });
  });

  it("deletes a plano", async () => {
    const created = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Delete Plano",
      motivo: "Teste",
      objetivos: "Teste",
      dataInicio: "2026-03-01",
      dataFim: "2026-04-01",
      responsavel: "Teste",
    });
    const result = await caller.planosReversao.delete({ id: created.id });
    expect(result).toEqual({ success: true });
  });

  it("creates and lists etapas for a plano", async () => {
    const plano = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Etapas",
      motivo: "Atrasos",
      objetivos: "Pontualidade",
      dataInicio: "2026-03-01",
      dataFim: "2026-04-01",
      responsavel: "Gestor",
    });

    const etapa = await caller.planosReversao.createEtapa({
      planoId: plano.id,
      tipo: "feedback_inicial",
      titulo: "Reuniao inicial de alinhamento",
      descricao: "Apresentar o plano ao colaborador",
      dataPrevista: "2026-03-02",
      responsavel: "Gestor",
    });
    expect(etapa).toHaveProperty("id");

    const etapas = await caller.planosReversao.listEtapas({ planoId: plano.id });
    expect(Array.isArray(etapas)).toBe(true);
    expect(etapas.length).toBeGreaterThanOrEqual(1);
  });

  it("updates an etapa status", async () => {
    const plano = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Update Etapa",
      motivo: "Teste",
      objetivos: "Teste",
      dataInicio: "2026-03-01",
      dataFim: "2026-04-01",
      responsavel: "Gestor",
    });
    const etapa = await caller.planosReversao.createEtapa({
      planoId: plano.id,
      tipo: "meta",
      titulo: "Meta de pontualidade",
      dataPrevista: "2026-03-15",
    });
    const result = await caller.planosReversao.updateEtapa({
      id: etapa.id,
      status: "concluida",
      dataConclusao: "2026-03-14",
      observacoes: "Meta atingida antes do prazo",
    });
    expect(result).toEqual({ success: true });
  });

  it("creates and lists feedbacks for a plano", async () => {
    const plano = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Feedback",
      motivo: "Teste",
      objetivos: "Teste",
      dataInicio: "2026-03-01",
      dataFim: "2026-04-01",
      responsavel: "Gestor",
    });

    const feedback = await caller.planosReversao.createFeedback({
      planoId: plano.id,
      dataFeedback: "2026-03-10",
      tipo: "positivo",
      descricao: "Colaborador demonstrou melhora significativa",
      evolucao: "melhorou",
    });
    expect(feedback).toHaveProperty("id");

    const feedbacks = await caller.planosReversao.listFeedbacks({ planoId: plano.id });
    expect(Array.isArray(feedbacks)).toBe(true);
    expect(feedbacks.length).toBeGreaterThanOrEqual(1);
  });

  it("deletes an etapa", async () => {
    const plano = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Delete Etapa",
      motivo: "Teste",
      objetivos: "Teste",
      dataInicio: "2026-03-01",
      dataFim: "2026-04-01",
      responsavel: "Gestor",
    });
    const etapa = await caller.planosReversao.createEtapa({
      planoId: plano.id,
      tipo: "acompanhamento",
      titulo: "Acompanhamento semanal",
      dataPrevista: "2026-03-08",
    });
    const result = await caller.planosReversao.deleteEtapa({ id: etapa.id });
    expect(result).toEqual({ success: true });
  });

  it("deletes a feedback", async () => {
    const plano = await caller.planosReversao.create({
      colaboradorId: 0,
      colaboradorNome: "Teste Delete Feedback",
      motivo: "Teste",
      objetivos: "Teste",
      dataInicio: "2026-03-01",
      dataFim: "2026-04-01",
      responsavel: "Gestor",
    });
    const feedback = await caller.planosReversao.createFeedback({
      planoId: plano.id,
      dataFeedback: "2026-03-10",
      tipo: "neutro",
      descricao: "Sem mudancas significativas",
    });
    const result = await caller.planosReversao.deleteFeedback({ id: feedback.id });
    expect(result).toEqual({ success: true });
  });
});

describe("classificarOcorrencia (business logic)", () => {
  it("can be imported and classifies correctly", async () => {
    const { classificarOcorrencia } = await import("./db");

    // Leve, 0 reincidencias = reversivel, advertencia
    const r1 = classificarOcorrencia("falta_injustificada", "leve", 0);
    expect(r1.classificacao).toBe("reversivel");
    expect(r1.recomendacao).toBe("advertencia");

    // Media, 1 reincidencia = reversivel, suspensao
    const r2 = classificarOcorrencia("atraso_frequente", "media", 1);
    expect(r2.classificacao).toBe("reversivel");
    expect(r2.recomendacao).toBe("suspensao");

    // Grave, 2 reincidencias = reversivel, reversao
    const r3 = classificarOcorrencia("erro_trabalho", "grave", 2);
    expect(r3.classificacao).toBe("reversivel");
    expect(r3.recomendacao).toBe("reversao");

    // Gravissima = irreversivel, desligamento
    const r4 = classificarOcorrencia("conduta_inapropriada", "gravissima", 0);
    expect(r4.classificacao).toBe("irreversivel");
    expect(r4.recomendacao).toBe("desligamento");

    // 3+ reincidencias com gravidade nao leve = irreversivel
    const r5 = classificarOcorrencia("conflito_interno", "media", 3);
    expect(r5.classificacao).toBe("irreversivel");
    expect(r5.recomendacao).toBe("desligamento");
  });
});
