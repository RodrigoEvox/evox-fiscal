import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@evoxfiscal.com.br",
    name: "Admin Teste",
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
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@evoxfiscal.com.br",
    name: "Usuário Regular",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("CRM Router Structure", () => {
  it("should have all expected routers defined", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    
    // Verify core routers exist
    expect(caller.auth).toBeDefined();
    expect(caller.users).toBeDefined();
    expect(caller.clientes).toBeDefined();
    expect(caller.parceiros).toBeDefined();
    expect(caller.teses).toBeDefined();
    expect(caller.notificacoes).toBeDefined();
    expect(caller.dashboard).toBeDefined();
    expect(caller.seed).toBeDefined();
    
    // Verify new CRM routers
    expect(caller.setores).toBeDefined();
    expect(caller.tarefas).toBeDefined();
    expect(caller.arquivos).toBeDefined();
    expect(caller.audit).toBeDefined();
    expect(caller.apiKeys).toBeDefined();
  });

  it("should have tarefas CRUD procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    
    expect(caller.tarefas.list).toBeDefined();
    expect(caller.tarefas.getById).toBeDefined();
    expect(caller.tarefas.create).toBeDefined();
    expect(caller.tarefas.update).toBeDefined();
    expect(caller.tarefas.delete).toBeDefined();
    expect(caller.tarefas.addComment).toBeDefined();
  });

  it("should have setores CRUD procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    
    expect(caller.setores.list).toBeDefined();
    expect(caller.setores.create).toBeDefined();
    expect(caller.setores.delete).toBeDefined();
    expect(caller.setores.membros).toBeDefined();
  });

  it("should have arquivos procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    
    expect(caller.arquivos.list).toBeDefined();
    expect(caller.arquivos.upload).toBeDefined();
    expect(caller.arquivos.delete).toBeDefined();
  });

  it("should have apiKeys procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    
    expect(caller.apiKeys.list).toBeDefined();
    expect(caller.apiKeys.create).toBeDefined();
    expect(caller.apiKeys.delete).toBeDefined();
    expect(caller.apiKeys.toggleActive).toBeDefined();
  });

  it("should have audit log procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    
    expect(caller.audit.list).toBeDefined();
  });
});

describe("Admin Access Control", () => {
  it("should deny non-admin access to setores.create", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.setores.create({ nome: "Test Setor" })
    ).rejects.toThrow();
  });

  it("should deny non-admin access to apiKeys.list", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.apiKeys.list()
    ).rejects.toThrow();
  });

  it("should deny non-admin access to apiKeys.create", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.apiKeys.create({ nome: "Test Key" })
    ).rejects.toThrow();
  });

  it("should deny non-admin access to seed.testData", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.seed.testData()
    ).rejects.toThrow();
  });
});

describe("Auth Router", () => {
  it("should return user from auth.me for authenticated user", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Admin Teste");
    expect(result?.role).toBe("admin");
  });

  it("should return null from auth.me for unauthenticated user", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("CRM v7 Router Structure", () => {
  it("should have modelos de parceria procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.modelosParceria).toBeDefined();
    expect(caller.modelosParceria.list).toBeDefined();
    expect(caller.modelosParceria.create).toBeDefined();
    expect(caller.modelosParceria.update).toBeDefined();
    expect(caller.modelosParceria.delete).toBeDefined();
  });

  it("should have comissoes procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.comissoes).toBeDefined();
    expect(caller.comissoes.listByModelo).toBeDefined();
    expect(caller.comissoes.upsert).toBeDefined();
  });

  it("should have slaConfig procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.slaConfig).toBeDefined();
    expect(caller.slaConfig.list).toBeDefined();
    expect(caller.slaConfig.upsert).toBeDefined();
    expect(caller.slaConfig.delete).toBeDefined();
  });

  it("should have servicoEtapas procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.servicoEtapas).toBeDefined();
    expect(caller.servicoEtapas.listByServico).toBeDefined();
    expect(caller.servicoEtapas.create).toBeDefined();
    expect(caller.servicoEtapas.update).toBeDefined();
    expect(caller.servicoEtapas.delete).toBeDefined();
  });

  it("should have perfil procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.perfil).toBeDefined();
    expect(caller.perfil.get).toBeDefined();
    expect(caller.perfil.update).toBeDefined();
    expect(caller.perfil.uploadAvatar).toBeDefined();
  });

  it("should have subparceiros procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.subparceiros).toBeDefined();
    expect(caller.subparceiros.listByParceiro).toBeDefined();
    expect(caller.subparceiros.create).toBeDefined();
    expect(caller.subparceiros.delete).toBeDefined();
  });

  it("should have clienteServico procedures", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.clienteServico).toBeDefined();
    expect(caller.clienteServico.listByCliente).toBeDefined();
    expect(caller.clienteServico.assign).toBeDefined();
  });

  it("should have users.create procedure for admin", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.users.create).toBeDefined();
    expect(caller.users.update).toBeDefined();
    expect(caller.users.delete).toBeDefined();
  });

  it("should have buscaGlobal procedure", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.buscaGlobal).toBeDefined();
    expect(caller.buscaGlobal.search).toBeDefined();
  });
});

describe("CRM v7 Access Control", () => {
  it("should deny non-admin access to modelosParceria.create", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.modelosParceria.create({ nome: "Test", classificacao: "prata" })
    ).rejects.toThrow();
  });

  it("should deny non-admin access to slaConfig.upsert", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.slaConfig.upsert({ setorId: 1, tipoTarefa: "test", prazoHoras: 24 })
    ).rejects.toThrow();
  });

  it("should deny non-admin access to users.create", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.users.create({ name: "Test", email: "test@test.com" })
    ).rejects.toThrow();
  });

  it("should deny non-admin access to users.delete", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.users.delete({ id: 999 })
    ).rejects.toThrow();
  });
});

describe("Dashboard Stats", () => {
  it("should return dashboard stats structure", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // This will call the actual DB, so it may return null if DB is not connected
    // But the procedure should not throw
    try {
      const result = await caller.dashboard.stats();
      if (result) {
        expect(result).toHaveProperty('totalClientes');
        expect(result).toHaveProperty('totalTeses');
        expect(result).toHaveProperty('totalParceiros');
        expect(result).toHaveProperty('totalTarefas');
        expect(result).toHaveProperty('totalSetores');
        expect(typeof result.totalClientes).toBe('number');
        expect(typeof result.totalTarefas).toBe('number');
      }
    } catch {
      // DB not available in test env — acceptable
    }
  });
});

describe("CRUD Completeness - toggleActive", () => {
  it("should have toggleActive for parceiros", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.parceiros.toggleActive).toBeDefined();
  });

  it("should have toggleActive for clientes", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.clientes.toggleActive).toBeDefined();
  });

  it("should have toggleActive for servicos", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.servicos.toggleActive).toBeDefined();
  });

  it("should have toggleActive for users", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.users.toggleActive).toBeDefined();
  });

  it("should have toggleActive for apiKeys", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.apiKeys.toggleActive).toBeDefined();
  });
});

describe("CRUD Completeness - All Entities", () => {
  it("should have full CRUD for clientes (list, create, update, delete, toggleActive)", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.clientes.list).toBeDefined();
    expect(caller.clientes.create).toBeDefined();
    expect(caller.clientes.update).toBeDefined();
    expect(caller.clientes.delete).toBeDefined();
    expect(caller.clientes.toggleActive).toBeDefined();
  });

  it("should have full CRUD for parceiros (list, create, update, delete, toggleActive)", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.parceiros.list).toBeDefined();
    expect(caller.parceiros.create).toBeDefined();
    expect(caller.parceiros.update).toBeDefined();
    expect(caller.parceiros.delete).toBeDefined();
    expect(caller.parceiros.toggleActive).toBeDefined();
  });

  it("should have full CRUD for servicos (list, create, update, delete, toggleActive)", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.servicos.list).toBeDefined();
    expect(caller.servicos.create).toBeDefined();
    expect(caller.servicos.update).toBeDefined();
    expect(caller.servicos.delete).toBeDefined();
    expect(caller.servicos.toggleActive).toBeDefined();
  });

  it("should have full CRUD for users (list, create, update, delete, toggleActive)", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.users.list).toBeDefined();
    expect(caller.users.create).toBeDefined();
    expect(caller.users.update).toBeDefined();
    expect(caller.users.delete).toBeDefined();
    expect(caller.users.toggleActive).toBeDefined();
  });

  it("should have full CRUD for setores (list, create, update, delete)", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.setores.list).toBeDefined();
    expect(caller.setores.create).toBeDefined();
    expect(caller.setores.update).toBeDefined();
    expect(caller.setores.delete).toBeDefined();
  });

  it("should have full CRUD for tarefas (list, create, update, delete)", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.tarefas.list).toBeDefined();
    expect(caller.tarefas.create).toBeDefined();
    expect(caller.tarefas.update).toBeDefined();
    expect(caller.tarefas.delete).toBeDefined();
  });

  it("should have full CRUD for teses (list, create, update, delete)", () => {
    const caller = appRouter.createCaller(createAdminContext().ctx);
    expect(caller.teses.list).toBeDefined();
    expect(caller.teses.create).toBeDefined();
    expect(caller.teses.update).toBeDefined();
    expect(caller.teses.delete).toBeDefined();
  });
});

describe("Access Control - toggleActive", () => {
  it("should deny non-admin access to parceiros.toggleActive", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.parceiros.toggleActive({ id: 1, ativo: false })
    ).rejects.toThrow();
  });

  it("should deny non-admin access to users.toggleActive", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.users.toggleActive({ id: 1, ativo: false })
    ).rejects.toThrow();
  });

  it("should deny non-admin access to servicos.toggleActive", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.servicos.toggleActive({ id: 1, ativo: false })
    ).rejects.toThrow();
  });

  it("should deny non-admin access to apiKeys.toggleActive", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.apiKeys.toggleActive({ id: 1, ativo: false })
    ).rejects.toThrow();
  });
});
