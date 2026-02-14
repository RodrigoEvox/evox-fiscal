import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  listUsers: vi.fn().mockResolvedValue([
    { id: 1, openId: "owner-1", name: "Admin", email: "admin@evox.com", role: "admin", nivelAcesso: "administrador", ativo: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    { id: 2, openId: "user-2", name: "Analista", email: "analista@evox.com", role: "user", nivelAcesso: "analista_fiscal", ativo: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  ]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  toggleUserActive: vi.fn().mockResolvedValue(undefined),
  listParceiros: vi.fn().mockResolvedValue([]),
  createParceiro: vi.fn().mockResolvedValue(1),
  listTeses: vi.fn().mockResolvedValue([
    { id: 1, nome: "Exclusão do ICMS da Base PIS/COFINS", tributo: "PIS/COFINS", classificacao: "pacificada", potencialFinanceiro: "muito_alto", potencialMercadologico: "muito_alto", nivelRisco: "baixo", viaExecucao: "judicial", ativa: true },
    { id: 2, nome: "Recuperação PIS/COFINS Monofásico", tributo: "PIS/COFINS", classificacao: "pacificada", potencialFinanceiro: "alto", potencialMercadologico: "muito_alto", nivelRisco: "baixo", viaExecucao: "administrativa", ativa: true },
  ]),
  createTese: vi.fn().mockResolvedValue(3),
  listClientes: vi.fn().mockResolvedValue([]),
  createCliente: vi.fn().mockResolvedValue(1),
  getClienteById: vi.fn().mockResolvedValue({ id: 1, razaoSocial: "Empresa Teste", cnpj: "12345678000100", regimeTributario: "lucro_real", dataAbertura: new Date("2020-01-01"), valorMedioGuias: 50000, situacaoCadastral: "ativa", estado: "SP", cnae: "2599-3/99", createdAt: new Date() }),
  listRelatorios: vi.fn().mockResolvedValue([]),
  createRelatorio: vi.fn().mockResolvedValue(1),
  listFilaApuracao: vi.fn().mockResolvedValue([]),
  createFilaItem: vi.fn().mockResolvedValue(1),
  updateFilaStatus: vi.fn().mockResolvedValue(undefined),
  listNotificacoes: vi.fn().mockResolvedValue([]),
  createNotificacao: vi.fn().mockResolvedValue(1),
  markNotificacaoRead: vi.fn().mockResolvedValue(undefined),
  getAnalyticData: vi.fn().mockResolvedValue({ clientes: [], relatorios: [], fila: [] }),
  seedTeses: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "owner-1",
    email: "admin@evox.com",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "user-2",
    email: "analista@evox.com",
    name: "Analista",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Evox Fiscal — Users", () => {
  it("admin can list users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const users = await caller.users.list();
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe("Admin");
  });

  it("regular user can list users (protected, not admin-only)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const users = await caller.users.list();
    expect(users).toHaveLength(2);
  });

  it("anonymous user cannot list users", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("admin can update user role", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.users.updateRole({ id: 2, role: "admin", nivelAcesso: "administrador" });
    expect(result).toEqual({ success: true });
  });

  it("regular user cannot update user role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.users.updateRole({ id: 2, role: "admin", nivelAcesso: "administrador" })).rejects.toThrow();
  });

  it("admin can toggle user active status", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.users.toggleActive({ id: 2, ativo: false });
    expect(result).toEqual({ success: true });
  });
});

describe("Evox Fiscal — Parceiros", () => {
  it("authenticated user can list parceiros", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const parceiros = await caller.parceiros.list();
    expect(Array.isArray(parceiros)).toBe(true);
  });

  it("authenticated user can create parceiro", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.parceiros.create({
      nomeCompleto: "Parceiro Teste",
      cpfCnpj: "12345678000100",
      telefone: "(11) 99999-9999",
      email: "parceiro@teste.com",
    });
    expect(result).toEqual({ id: 1 });
  });

  it("anonymous user cannot create parceiro", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(caller.parceiros.create({ nomeCompleto: "Teste" })).rejects.toThrow();
  });
});

describe("Evox Fiscal — Teses", () => {
  it("authenticated user can list teses", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const teses = await caller.teses.list();
    expect(teses).toHaveLength(2);
    expect(teses[0].nome).toBe("Exclusão do ICMS da Base PIS/COFINS");
  });

  it("authenticated user can create tese", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.teses.create({
      nome: "Nova Tese Teste",
      tributoEnvolvido: "ICMS",
      tipo: "tese_judicial",
      classificacao: "judicial",
      potencialFinanceiro: "alto",
      potencialMercadologico: "medio",
      grauRisco: "medio",
      parecerTecnicoJuridico: "Parecer técnico da tese.",
      fundamentacaoLegal: "Art. 150 CF",
    });
    expect(result).toHaveProperty("id", 3);
  });
});

describe("Evox Fiscal — Clientes", () => {
  it("authenticated user can list clientes", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const clientes = await caller.clientes.list();
    expect(Array.isArray(clientes)).toBe(true);
  });

  it("authenticated user can create cliente", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.clientes.create({
      cnpj: "12345678000100",
      razaoSocial: "Empresa Teste LTDA",
      nomeFantasia: "Empresa Teste",
      regimeTributario: "lucro_real",
      dataAbertura: "2020-01-01",
      valorMedioGuias: "50000",
      situacaoCadastral: "ativa",
      estado: "SP",
      cnaePrincipal: "2599-3/99",
    });
    expect(result).toHaveProperty("id", 1);
  });

  it("authenticated user can get cliente by id", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const cliente = await caller.clientes.getById({ id: 1 });
    expect(cliente).toBeTruthy();
    expect(cliente?.razaoSocial).toBe("Empresa Teste");
  });
});

describe("Evox Fiscal — Relatórios", () => {
  it("authenticated user can list relatorios", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const relatorios = await caller.relatorios.list();
    expect(Array.isArray(relatorios)).toBe(true);
  });
});

describe("Evox Fiscal — Fila de Apuração", () => {
  it("authenticated user can list fila", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const fila = await caller.fila.list();
    expect(Array.isArray(fila)).toBe(true);
  });
});

describe("Evox Fiscal — Notificações", () => {
  it("authenticated user can list notificacoes", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const notificacoes = await caller.notificacoes.list();
    expect(Array.isArray(notificacoes)).toBe(true);
  });
});

describe("Evox Fiscal — Auth", () => {
  it("returns user for authenticated request", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const user = await caller.auth.me();
    expect(user).toBeTruthy();
    expect(user?.name).toBe("Admin");
    expect(user?.role).toBe("admin");
  });

  it("returns null for anonymous request", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});
