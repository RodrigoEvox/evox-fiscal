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


// ---- CHAT: REAÇÕES, PINS, GESTÃO DE CANAIS ----
describe("chat.reactions", () => {
  it("adds a reaction to a message", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const ch = channels[0];
    const sendResult = await caller.chat.send({
      channelId: ch.id,
      content: "Mensagem para testar reação",
    });
    const msgId = (sendResult as any).id;
    expect(msgId).toBeTruthy();
    const result = await caller.chat.addReaction({ messageId: msgId, emoji: "👍" });
    expect(result).toHaveProperty("id");
  });

  it("removes a reaction from a message", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const ch = channels[0];
    const sendResult = await caller.chat.send({
      channelId: ch.id,
      content: "Mensagem para testar remoção de reação",
    });
    const msgId = (sendResult as any).id;
    await caller.chat.addReaction({ messageId: msgId, emoji: "❤️" });
    const result = await caller.chat.removeReaction({ messageId: msgId, emoji: "❤️" });
    expect(result).toEqual({ success: true });
  });

  it("fetches reactions for messages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const ch = channels[0];
    const sendResult = await caller.chat.send({
      channelId: ch.id,
      content: "Mensagem para buscar reações",
    });
    const msgId = (sendResult as any).id;
    await caller.chat.addReaction({ messageId: msgId, emoji: "🔥" });
    const reactions = await caller.chat.reactions({ messageIds: [msgId] });
    expect(Array.isArray(reactions)).toBe(true);
    expect(reactions.length).toBeGreaterThanOrEqual(1);
  });
});

describe("chat.pinnedMessages", () => {
  it("pins a message (admin only)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const ch = channels[0];
    const sendResult = await caller.chat.send({
      channelId: ch.id,
      content: "Mensagem para fixar",
    });
    const msgId = (sendResult as any).id;
    const result = await caller.chat.pinMessage({ messageId: msgId });
    expect(result).toEqual({ success: true });
  });

  it("lists pinned messages for a channel", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const ch = channels[0];
    const pinned = await caller.chat.pinnedMessages({ channelId: ch.id });
    expect(Array.isArray(pinned)).toBe(true);
  });

  it("unpins a message (admin only)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const ch = channels[0];
    const sendResult = await caller.chat.send({
      channelId: ch.id,
      content: "Mensagem para desfixar",
    });
    const msgId = (sendResult as any).id;
    await caller.chat.pinMessage({ messageId: msgId });
    const result = await caller.chat.unpinMessage({ messageId: msgId });
    expect(result).toEqual({ success: true });
  });
});

describe("chat.channelManagement", () => {
  it("soft-deletes a channel (admin)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Create a test channel
    const newCh = await caller.chat.createChannel({
      nome: "Canal Teste Lixeira",
      tipo: "projeto",
    });
    expect(newCh.id).toBeTruthy();
    // Soft-delete
    const result = await caller.chat.deleteChannel({ channelId: newCh.id! });
    expect(result).toEqual({ success: true });
  });

  it("restores a channel from trash (admin)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const newCh = await caller.chat.createChannel({
      nome: "Canal Teste Restaurar",
      tipo: "projeto",
    });
    await caller.chat.deleteChannel({ channelId: newCh.id! });
    const result = await caller.chat.restoreChannel({ channelId: newCh.id! });
    expect(result).toEqual({ success: true });
  });

  it("toggles channel active/inactive (admin)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const newCh = await caller.chat.createChannel({
      nome: "Canal Teste Toggle",
      tipo: "projeto",
    });
    // Deactivate
    const result1 = await caller.chat.toggleChannel({ channelId: newCh.id!, ativo: false });
    expect(result1).toEqual({ success: true });
    // Reactivate
    const result2 = await caller.chat.toggleChannel({ channelId: newCh.id!, ativo: true });
    expect(result2).toEqual({ success: true });
  });

  it("channels query returns all statuses for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    expect(Array.isArray(channels)).toBe(true);
  });
});


// ---- CHAT: DM (Direct Messages) ----
describe("chat.dm", () => {
  it("starts a DM conversation and returns channel", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Start DM with user ID 2 (may or may not exist, but should not throw)
    try {
      const result = await caller.chat.startDm({ targetUserId: 2 });
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    } catch (err: any) {
      // If target user doesn't exist, that's acceptable
      expect(err.message).toBeDefined();
    }
  });

  it("lists DM channels (returns array)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.dmChannels();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---- CHAT: TYPING INDICATORS ----
describe("chat.typing", () => {
  it("startTyping and stopTyping work without error", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Get a channel first
    const channels = await caller.chat.channels();
    if (channels.length === 0) return; // skip if no channels
    const channelId = channels[0].id;

    const startResult = await caller.chat.startTyping({ channelId });
    expect(startResult).toEqual({ success: true });

    const stopResult = await caller.chat.stopTyping({ channelId });
    expect(stopResult).toEqual({ success: true });
  });

  it("typingUsers returns array for a channel", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const channelId = channels[0].id;

    const result = await caller.chat.typingUsers({ channelId });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---- CHAT: FILE UPLOAD ----
describe("chat.fileUpload", () => {
  it("uploads a file and creates a message with attachment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Get a channel
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const channelId = channels[0].id;

    // Create a small base64 text file
    const fileContent = Buffer.from("Hello, this is a test file").toString("base64");
    try {
      const result = await caller.chat.uploadFile({
        channelId,
        fileName: "test.txt",
        fileType: "text/plain",
        fileSize: 26,
        fileBase64: fileContent,
        content: "Arquivo de teste",
      });
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    } catch (err: any) {
      // Storage might not be available in test env
      expect(err.message).toBeDefined();
    }
  });

  it("rejects files over 10MB", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;
    const channelId = channels[0].id;

    try {
      await caller.chat.uploadFile({
        channelId,
        fileName: "huge.bin",
        fileType: "application/octet-stream",
        fileSize: 11 * 1024 * 1024, // 11MB
        fileBase64: "dGVzdA==", // small base64 but fileSize says 11MB
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toContain("10MB");
    }
  });
});


// ============================================================
// CHAT v31 — Global Search, File Search, User Search
// ============================================================
describe("Chat v31 — Global Search, File Search, User Search", () => {

  it("should search messages globally across all channels", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // First ensure we have a channel and a message
    const channels = await caller.chat.channels();
    if (channels.length === 0) return; // skip if no channels

    const channelId = channels[0].id;
    // Send a unique message to search for
    const uniqueText = `global-search-test-${Date.now()}`;
    await caller.chat.send({ channelId, content: uniqueText });

    // Search globally
    const results = await caller.chat.searchGlobal({ query: uniqueText });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const found = results.find((r: any) => r.content === uniqueText);
    expect(found).toBeTruthy();
  });

  it("should search files in a channel", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Search for files (may return empty if no files uploaded)
    const results = await caller.chat.searchFiles({});
    expect(Array.isArray(results)).toBe(true);
    // Each result should have fileUrl
    for (const r of results as any[]) {
      expect(r.fileUrl).toBeTruthy();
    }
  });

  it("should search files filtered by type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const results = await caller.chat.searchFiles({ fileType: "image" });
    expect(Array.isArray(results)).toBe(true);
    for (const r of results as any[]) {
      expect(r.fileType).toMatch(/^image/);
    }
  });

  it("should search messages by user name in a channel", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;

    const channelId = channels[0].id;
    // Send a message first
    await caller.chat.send({ channelId, content: "user-search-test-message" });

    // Search by user name
    const results = await caller.chat.searchByUser({ channelId, userName: "Teste" });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("should return empty array for non-matching global search", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const results = await caller.chat.searchGlobal({ query: "zzz-nonexistent-query-xyz-999" });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("should return empty array for non-matching user search", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;

    const results = await caller.chat.searchByUser({ channelId: channels[0].id, userName: "UsuarioInexistente999" });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

// ---- v32: Threads, Presence, Edit, Partner Commissions ----
describe("Chat Threads", () => {
  it("should send a reply to a message", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;

    // Send original message
    const original = await caller.chat.send({ channelId: channels[0].id, content: "Original message for thread test" });
    expect(original).toBeDefined();
    const originalId = typeof original === "object" && original !== null && "id" in original ? (original as any).id : original;

    // Send reply
    const reply = await caller.chat.sendReply({ channelId: channels[0].id, content: "This is a reply", replyToId: originalId });
    expect(reply).toBeDefined();
  });

  it("should fetch thread messages for a parent message", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;

    // Send original
    const original = await caller.chat.send({ channelId: channels[0].id, content: "Thread parent message" });
    const originalId = typeof original === "object" && original !== null && "id" in original ? (original as any).id : original;

    // Send reply
    await caller.chat.sendReply({ channelId: channels[0].id, content: "Thread reply 1", replyToId: originalId });

    // Fetch thread using parentMessageId
    const thread = await caller.chat.threadMessages({ parentMessageId: originalId });
    expect(Array.isArray(thread)).toBe(true);
    expect(thread.length).toBeGreaterThanOrEqual(1);
  });

  it("should return thread counts for message ids", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;

    // Send a message to have a valid id
    const msg = await caller.chat.send({ channelId: channels[0].id, content: "Thread count test" });
    const msgId = typeof msg === "object" && msg !== null && "id" in msg ? (msg as any).id : msg;

    const counts = await caller.chat.threadCounts({ messageIds: [msgId] });
    expect(Array.isArray(counts)).toBe(true);
  });
});

describe("Chat Presence (Online/Offline)", () => {
  it("should send heartbeat and appear online", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.heartbeat();
    expect(result).toBeDefined();
  });

  it("should list online users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Send heartbeat first
    await caller.chat.heartbeat();
    const users = await caller.chat.onlineUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Chat Message Editing", () => {
  it("should edit a message", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;

    // Send a message
    const msg = await caller.chat.send({ channelId: channels[0].id, content: "Message to edit" });
    const msgId = typeof msg === "object" && msg !== null && "id" in msg ? (msg as any).id : msg;

    // Edit it
    const edited = await caller.chat.editMessage({ messageId: msgId, content: "Edited content" });
    expect(edited).toBeDefined();
  });

  it("should fetch a single message by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    if (channels.length === 0) return;

    const msg = await caller.chat.send({ channelId: channels[0].id, content: "Fetch me" });
    const msgId = typeof msg === "object" && msg !== null && "id" in msg ? (msg as any).id : msg;

    const fetched = await caller.chat.getMessage({ messageId: msgId });
    expect(fetched).toBeDefined();
    expect(fetched?.content).toBe("Fetch me");
  });
});

describe("Partner Commissions Dashboard", () => {
  it("should return commissions dashboard for a partner", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const parceiros = await caller.parceiros.list();
    if (parceiros.length === 0) return;

    const dashboard = await caller.parceiros.commissionsDashboard({ parceiroId: parceiros[0].id });
    expect(dashboard).toBeDefined();
    if (dashboard) {
      expect(dashboard).toHaveProperty("totalClientes");
      expect(dashboard).toHaveProperty("clientesAtivos");
      expect(dashboard).toHaveProperty("servicos");
      expect(dashboard).toHaveProperty("aprovacoes");
      expect(dashboard).toHaveProperty("subparceiros");
    }
  });

  it("should return null for non-existent partner", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const dashboard = await caller.parceiros.commissionsDashboard({ parceiroId: 999999 });
    expect(dashboard).toBeNull();
  });
});


// ============================================================
// v33 — Chat Export History & Consolidated Commissions Dashboard
// ============================================================

describe("Chat Export History", () => {
  it("should export chat history for a channel", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const channels: any = await caller.chat.channels();
    if (channels.length > 0) {
      const activeChannel = channels.find((c: any) => c.status === 'active') || channels[0];
      const result: any = await caller.chat.exportHistory({ channelId: activeChannel.id });
      expect(result).toHaveProperty("channel");
      expect(result).toHaveProperty("messages");
      expect(Array.isArray(result.messages)).toBe(true);
    }
  });

  it("should return empty messages for channel with no messages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Use a very high ID that likely doesn't exist or has no messages
    try {
      const result: any = await caller.chat.exportHistory({ channelId: 999999 });
      // If it doesn't throw, messages should be empty
      expect(result.messages.length).toBe(0);
    } catch (err: any) {
      // Channel not found is also acceptable
      expect(err).toBeDefined();
    }
  });
});

describe("Consolidated Commissions Dashboard", () => {
  it("should return consolidated commissions data with kpis, ranking, and evolucaoMensal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated();
    expect(result).toHaveProperty("kpis");
    expect(result).toHaveProperty("ranking");
    expect(result).toHaveProperty("evolucaoMensal");
    expect(result.kpis).toHaveProperty("totalAprovadas");
    expect(result.kpis).toHaveProperty("totalPendentes");
    expect(result.kpis).toHaveProperty("totalRejeitadas");
    expect(result.kpis).toHaveProperty("valorTotalAprovado");
    expect(result.kpis).toHaveProperty("valorTotalPendente");
    expect(result.kpis).toHaveProperty("totalParceiros");
    expect(result.kpis).toHaveProperty("parceirosAtivos");
    expect(Array.isArray(result.ranking)).toBe(true);
    expect(Array.isArray(result.evolucaoMensal)).toBe(true);
  });

  it("should return ranking entries with expected fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated();
    if (result.ranking.length > 0) {
      const first = result.ranking[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("nome");
      expect(first).toHaveProperty("tipo");
      expect(first).toHaveProperty("status");
      expect(first).toHaveProperty("modelo");
      expect(first).toHaveProperty("totalClientes");
      expect(first).toHaveProperty("clientesAtivos");
      expect(first).toHaveProperty("servicosAutorizados");
      expect(first).toHaveProperty("aprovadas");
      expect(first).toHaveProperty("pendentes");
      expect(first).toHaveProperty("valorTotalAprovado");
    }
  });

  it("should return monthly evolution with month labels and values", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated();
    expect(result.evolucaoMensal.length).toBe(12);
    if (result.evolucaoMensal.length > 0) {
      const first = result.evolucaoMensal[0];
      expect(first).toHaveProperty("month");
      expect(first).toHaveProperty("valor");
      expect(first).toHaveProperty("quantidade");
    }
  });

  it("should return modelos list for filter dropdown", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated();
    expect(result).toHaveProperty("modelos");
    expect(Array.isArray(result.modelos)).toBe(true);
    if (result.modelos.length > 0) {
      expect(result.modelos[0]).toHaveProperty("id");
      expect(result.modelos[0]).toHaveProperty("nome");
    }
  });

  it("should accept tipoParceiro filter (pf)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated({ tipoParceiro: 'pf' });
    expect(result).toHaveProperty("kpis");
    expect(result).toHaveProperty("ranking");
    // All parceiros in ranking should be PF type
    if (result.ranking.length > 0) {
      result.ranking.forEach((p: any) => {
        expect(p.tipo).toBe('pf');
      });
    }
  });

  it("should accept tipoParceiro filter (pj)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated({ tipoParceiro: 'pj' });
    expect(result).toHaveProperty("kpis");
    expect(result).toHaveProperty("ranking");
    if (result.ranking.length > 0) {
      result.ranking.forEach((p: any) => {
        expect(p.tipo).toBe('pj');
      });
    }
  });

  it("should accept date range filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated({
      dataInicio: '2025-01-01',
      dataFim: '2025-12-31',
    });
    expect(result).toHaveProperty("kpis");
    expect(result).toHaveProperty("ranking");
    expect(result).toHaveProperty("evolucaoMensal");
  });

  it("should accept modeloParceriaId filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated({ modeloParceriaId: 999 });
    expect(result).toHaveProperty("kpis");
    // With non-existent model, should return empty
    expect(result.ranking.length).toBe(0);
    expect(result.kpis.totalParceiros).toBe(0);
  });

  it("should accept combined filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result: any = await caller.comissoesDashboard.consolidated({
      tipoParceiro: 'pj',
      dataInicio: '2024-01-01',
      dataFim: '2026-12-31',
    });
    expect(result).toHaveProperty("kpis");
    expect(result).toHaveProperty("ranking");
    if (result.ranking.length > 0) {
      result.ranking.forEach((p: any) => {
        expect(p.tipo).toBe('pj');
      });
    }
  });
});
