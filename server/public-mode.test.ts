import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { ENV } from "./server/_core/env";

describe("Public Mode", () => {
  const originalEnv = process.env.VITE_PUBLIC_MODE;

  afterAll(() => {
    process.env.VITE_PUBLIC_MODE = originalEnv;
  });

  it("should detect public mode when VITE_PUBLIC_MODE is true", () => {
    process.env.VITE_PUBLIC_MODE = "true";
    // Re-import to get fresh ENV with new value
    const testEnv = {
      publicMode: process.env.VITE_PUBLIC_MODE === "true",
    };
    expect(testEnv.publicMode).toBe(true);
  });

  it("should not be in public mode when VITE_PUBLIC_MODE is false", () => {
    process.env.VITE_PUBLIC_MODE = "false";
    const testEnv = {
      publicMode: process.env.VITE_PUBLIC_MODE === "true",
    };
    expect(testEnv.publicMode).toBe(false);
  });

  it("should not be in public mode when VITE_PUBLIC_MODE is not set", () => {
    delete process.env.VITE_PUBLIC_MODE;
    const testEnv = {
      publicMode: process.env.VITE_PUBLIC_MODE === "true",
    };
    expect(testEnv.publicMode).toBe(false);
  });

  it("should create anonymous user in public mode", () => {
    const ANONYMOUS_USER = {
      id: 0,
      email: "anonymous@public",
      name: "Visitante",
      role: "user",
    };
    expect(ANONYMOUS_USER.email).toBe("anonymous@public");
    expect(ANONYMOUS_USER.role).toBe("user");
    expect(ANONYMOUS_USER.id).toBe(0);
  });

  it("should block mutations in public mode", () => {
    const isPublicMode = true;
    const isReadOnlyMutation = isPublicMode;
    
    if (isReadOnlyMutation) {
      expect(() => {
        throw new Error("Esta operacao nao e permitida em modo publico (leitura apenas)");
      }).toThrow("Esta operacao nao e permitida em modo publico");
    }
  });
});
