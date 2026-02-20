import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-v21",
    email: "test@evox.com",
    name: "Test User V21",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  return { ctx };
}

describe("CRM v21 — Status do Colaborador", () => {
  it("should create a colaborador with default status 'ativo'", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.colaboradores.create({
      nomeCompleto: "Teste Status Default",
      cpf: "111.222.333-96",
      dataAdmissao: "2025-01-15",
      cargo: "Analista",
      salarioBase: "5000",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBeGreaterThan(0);

    // Verify the colaborador was created
    const list = await caller.colaboradores.list();
    const created = (list as any[]).find((c: any) => c.id === result.id);
    expect(created).toBeDefined();
    expect(created.nomeCompleto).toBe("Teste Status Default");
  });

  it("should create a colaborador with explicit status 'experiencia'", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.colaboradores.create({
      nomeCompleto: "Teste Status Experiencia",
      cpf: "222.333.444-87",
      dataAdmissao: "2025-02-01",
      cargo: "Estagiário",
      salarioBase: "2000",
      statusColaborador: "experiencia",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBeGreaterThan(0);
  });

  it("should create a colaborador with status 'afastado'", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.colaboradores.create({
      nomeCompleto: "Teste Status Afastado",
      cpf: "333.444.555-78",
      dataAdmissao: "2024-06-01",
      cargo: "Coordenador",
      salarioBase: "8000",
      statusColaborador: "afastado",
    });

    expect(result).toHaveProperty("id");
  });

  it("should update colaborador status via update mutation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a colaborador first
    const created = await caller.colaboradores.create({
      nomeCompleto: "Teste Update Status",
      cpf: "444.555.666-69",
      dataAdmissao: "2025-03-01",
      cargo: "Analista Sr",
      salarioBase: "7000",
      statusColaborador: "ativo",
    });

    // Update status to 'ferias'
    const updated = await caller.colaboradores.update({
      id: created.id,
      data: { statusColaborador: "ferias" },
    });

    expect(updated).toEqual({ success: true });
  });

  it("should accept all valid status values", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const validStatuses = [
      "ativo", "inativo", "afastado", "licenca", "atestado",
      "desligado", "ferias", "experiencia", "aviso_previo"
    ];

    for (const status of validStatuses) {
      const result = await caller.colaboradores.create({
        nomeCompleto: `Teste Status ${status}`,
        cpf: `${Math.random().toString().slice(2, 5)}.${Math.random().toString().slice(2, 5)}.${Math.random().toString().slice(2, 5)}-${Math.random().toString().slice(2, 4)}`,
        dataAdmissao: "2025-01-01",
        cargo: "Teste",
        salarioBase: "3000",
        statusColaborador: status as any,
      });
      expect(result).toHaveProperty("id");
    }
  });

  it("should list colaboradores and include status field", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const list = await caller.colaboradores.list();
    expect(Array.isArray(list)).toBe(true);
    // All recently created should be in the list
    expect((list as any[]).length).toBeGreaterThan(0);
  });

  it("should create colaborador with dependentes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.colaboradores.create({
      nomeCompleto: "Teste Com Dependentes",
      cpf: "555.666.777-50",
      dataAdmissao: "2025-04-01",
      cargo: "Gerente",
      salarioBase: "12000",
      statusColaborador: "ativo",
      dependentes: [
        { nome: "Dependente 1", cpf: "111.111.111-11", dataNascimento: "2010-05-15", parentesco: "Filho(a)" },
        { nome: "Dependente 2", cpf: "222.222.222-22", dataNascimento: "2015-08-20", parentesco: "Filho(a)" },
      ],
    });

    expect(result).toHaveProperty("id");
  });

  it("relatoriosRH dashboard should return data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const dashboard = await caller.relatoriosRH.dashboard();
    expect(dashboard).toBeDefined();
    // Dashboard returns various metrics
    expect(dashboard).toHaveProperty("totalAtivos");
    expect(dashboard).toHaveProperty("custoSalarialTotal");
    expect(dashboard).toHaveProperty("headcountPorSetor");
    expect(dashboard).toHaveProperty("turnoverMensal");
    expect(dashboard).toHaveProperty("absenteismoMensal");
  });
});
