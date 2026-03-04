import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  isPublicMode: boolean;
};

// Anonymous user for public mode (read-only access)
const ANONYMOUS_USER: User = {
  id: 0,
  email: "anonymous@public",
  name: "Visitante",
  role: "user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const isPublicMode = ENV.publicMode;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // In public mode, use anonymous user. Otherwise, user is null.
    if (isPublicMode) {
      user = ANONYMOUS_USER as any;
    } else {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    isPublicMode,
  };
}
