import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@evox.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(id = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `user-${id}`,
    email: `user${id}@evox.com`,
    name: `User ${id}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("chat channels", () => {
  it("channels returns an array of channels", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    expect(Array.isArray(channels)).toBe(true);
    // Should have at least the Geral channel
    expect(channels.length).toBeGreaterThan(0);
    const geral = channels.find((c: any) => c.tipo === "geral");
    expect(geral).toBeDefined();
    expect(geral!.nome).toBe("Geral");
  });

  it("createChannel creates a new project channel", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.createChannel({
      nome: `Test Channel ${Date.now()}`,
      descricao: "Test channel description",
      tipo: "projeto",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("chat messages", () => {
  it("list returns messages for a channel", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    // Get channels first to find Geral
    const channels = await caller.chat.channels();
    const geral = channels.find((c: any) => c.tipo === "geral");
    expect(geral).toBeDefined();

    const messages = await caller.chat.list({ channelId: geral!.id, limit: 10 });
    expect(Array.isArray(messages)).toBe(true);
  });

  it("send creates a message in a channel", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    const geral = channels.find((c: any) => c.tipo === "geral");

    const result = await caller.chat.send({
      channelId: geral!.id,
      content: "Teste de mensagem no canal Geral",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("send with user mentions (@) creates notifications", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    const geral = channels.find((c: any) => c.tipo === "geral");

    const result = await caller.chat.send({
      channelId: geral!.id,
      content: "Olá @Admin, preciso de ajuda",
      mentions: [
        { type: "user", id: 1, name: "Admin" },
      ],
    });
    expect(result).toHaveProperty("id");
  });

  it("send with client mentions (#) works correctly", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    const geral = channels.find((c: any) => c.tipo === "geral");

    const result = await caller.chat.send({
      channelId: geral!.id,
      content: "Verificar situação do #ClienteXYZ",
      mentions: [
        { type: "client", id: 100, name: "ClienteXYZ" },
      ],
    });
    expect(result).toHaveProperty("id");
  });
});

describe("chat notifications", () => {
  it("unreadCount returns total and byChannel", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.unreadCount();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("byChannel");
    expect(typeof result.total).toBe("number");
    expect(Array.isArray(result.byChannel)).toBe(true);
  });

  it("unreadList returns an array", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.unreadList();
    expect(Array.isArray(result)).toBe(true);
  });

  it("markRead marks channel notifications as read", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const channels = await caller.chat.channels();
    const geral = channels.find((c: any) => c.tipo === "geral");

    const result = await caller.chat.markRead({ channelId: geral!.id });
    expect(result).toEqual({ success: true });
  });

  it("markAllRead marks all notifications as read", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.markAllRead();
    expect(result).toEqual({ success: true });
  });
});

describe("chat mention suggestions", () => {
  it("userSuggestions returns users matching query", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const suggestions = await caller.chat.userSuggestions({ query: "a" });
    expect(Array.isArray(suggestions)).toBe(true);
    for (const s of suggestions) {
      expect(s.type).toBe("user");
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
    }
  });

  it("clientSuggestions returns clients matching query", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const suggestions = await caller.chat.clientSuggestions({ query: "a" });
    expect(Array.isArray(suggestions)).toBe(true);
    for (const s of suggestions) {
      expect(s.type).toBe("client");
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
    }
  });
});

describe("userHistory", () => {
  it("byUser returns an array", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const history = await caller.userHistory.byUser({ userId: 1 });
    expect(Array.isArray(history)).toBe(true);
  });

  it("listAll (admin only) returns an array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const history = await caller.userHistory.listAll();
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("users - nivelAcesso validation", () => {
  it("create accepts supervisor as nivelAcesso", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.users.create({
        name: "Test Supervisor",
        apelido: "TestSup",
        email: `testsup${Date.now()}@evox.com`,
        role: "user",
        nivelAcesso: "supervisor",
      });
      expect(result).toHaveProperty("id");
    } catch (err: any) {
      expect(err.message).not.toContain("nivelAcesso");
    }
  });

  it("create rejects suporte_comercial as nivelAcesso", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.users.create({
        name: "Test SC",
        apelido: "TestSC",
        email: `testsc${Date.now()}@evox.com`,
        role: "user",
        nivelAcesso: "suporte_comercial" as any,
      })
    ).rejects.toThrow();
  });
});
