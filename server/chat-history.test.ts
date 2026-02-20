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

describe("chat", () => {
  it("list returns an array of messages", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const messages = await caller.chat.list({ limit: 10 });
    expect(Array.isArray(messages)).toBe(true);
  });

  it("send creates a new message and returns id", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.send({
      content: "Teste de mensagem do chat interno",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("send with mentions creates a message with mentions data", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.send({
      content: "Olá @Admin, preciso de ajuda com o @ClienteXYZ",
      mentions: [
        { type: "user", id: 1, name: "Admin" },
        { type: "client", id: 100, name: "ClienteXYZ" },
      ],
    });
    expect(result).toHaveProperty("id");
  });

  it("mentionSuggestions returns users and clients matching query", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const suggestions = await caller.chat.mentionSuggestions({ query: "a" });
    expect(Array.isArray(suggestions)).toBe(true);
    // Each suggestion should have type, id, name
    for (const s of suggestions) {
      expect(s).toHaveProperty("type");
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
      expect(["user", "client"]).toContain(s.type);
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
    // This should not throw for the enum validation
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
      // If it fails, it should NOT be because of nivelAcesso validation
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
