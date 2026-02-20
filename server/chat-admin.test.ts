import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "admin" | "user" = "admin", userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("chat admin features", () => {
  describe("chat.deleteMessage", () => {
    it("rejects non-admin users", async () => {
      const ctx = createContext("user");
      const caller = appRouter.createCaller(ctx);
      await expect(caller.chat.deleteMessage({ messageId: 999999 })).rejects.toThrow(
        /administradores/i
      );
    });

    it("allows admin to delete a message", async () => {
      const ctx = createContext("admin");
      const caller = appRouter.createCaller(ctx);
      // Should not throw for admin (message may not exist but permission check passes)
      const result = await caller.chat.deleteMessage({ messageId: 999999 });
      expect(result).toEqual({ success: true });
    });
  });

  describe("chat.clearChannel", () => {
    it("rejects non-admin users", async () => {
      const ctx = createContext("user");
      const caller = appRouter.createCaller(ctx);
      await expect(caller.chat.clearChannel({ channelId: 999999 })).rejects.toThrow(
        /administradores/i
      );
    });

    it("allows admin to clear a channel", async () => {
      const ctx = createContext("admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.clearChannel({ channelId: 999999 });
      expect(result).toEqual({ success: true });
    });
  });

  describe("chat.toggleChannel", () => {
    it("rejects non-admin users", async () => {
      const ctx = createContext("user");
      const caller = appRouter.createCaller(ctx);
      await expect(caller.chat.toggleChannel({ channelId: 999999, ativo: false })).rejects.toThrow(
        /administradores/i
      );
    });

    it("allows admin to toggle a channel", async () => {
      const ctx = createContext("admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.toggleChannel({ channelId: 999999, ativo: false });
      expect(result).toEqual({ success: true });
    });
  });

  describe("chat.channels", () => {
    it("returns a list of channels", async () => {
      const ctx = createContext("user");
      const caller = appRouter.createCaller(ctx);
      const channels = await caller.chat.channels();
      expect(Array.isArray(channels)).toBe(true);
    });
  });

  describe("chat.unreadCount", () => {
    it("returns unread count structure", async () => {
      const ctx = createContext("user");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.unreadCount();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("byChannel");
      expect(typeof result.total).toBe("number");
      expect(Array.isArray(result.byChannel)).toBe(true);
    });
  });

  describe("chat.unreadList", () => {
    it("returns a list of unread notifications", async () => {
      const ctx = createContext("user");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.unreadList();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("chat.markAllRead", () => {
    it("marks all notifications as read", async () => {
      const ctx = createContext("user");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.markAllRead();
      expect(result).toEqual({ success: true });
    });
  });

  describe("chat.send", () => {
    it("requires channelId and content", async () => {
      const ctx = createContext("user");
      const caller = appRouter.createCaller(ctx);
      // Should fail with invalid input (empty content)
      await expect(caller.chat.send({ channelId: 1, content: "" })).rejects.toThrow();
    });
  });
});
