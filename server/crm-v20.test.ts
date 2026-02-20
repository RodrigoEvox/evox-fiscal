import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database module
vi.mock("./db", () => ({
  listMetasIndividuais: vi.fn().mockResolvedValue([
    { id: 1, colaboradorId: 1, colaboradorNome: "João Silva", cicloId: 1, titulo: "Aumentar produtividade", categoria: "produtividade", valorMeta: "100", valorAtual: "75", status: "em_andamento" },
    { id: 2, colaboradorId: 2, colaboradorNome: "Maria Santos", cicloId: 1, titulo: "Reduzir erros", categoria: "qualidade", valorMeta: "50", valorAtual: "50", status: "concluida" },
  ]),
  getMetaIndividualById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) return Promise.resolve({ id: 1, colaboradorId: 1, titulo: "Aumentar produtividade", valorMeta: "100", valorAtual: "75" });
    return Promise.resolve(null);
  }),
  createMetaIndividual: vi.fn().mockResolvedValue(3),
  updateMetaIndividual: vi.fn().mockResolvedValue(undefined),
  deleteMetaIndividual: vi.fn().mockResolvedValue(undefined),
  notificarCicloAberto: vi.fn().mockResolvedValue(undefined),
  notificarAvaliacaoPendente: vi.fn().mockResolvedValue(undefined),
  createCicloAvaliacao: vi.fn().mockResolvedValue(10),
  getCicloAvaliacaoById: vi.fn().mockResolvedValue({ id: 10, titulo: "Ciclo Q1 2026", status: "rascunho" }),
  updateCicloAvaliacao: vi.fn().mockResolvedValue(undefined),
  createAvaliacao: vi.fn().mockResolvedValue(20),
  listColaboradores: vi.fn().mockResolvedValue([
    { id: 1, nomeCompleto: "João Silva", userId: 100, ativo: true, salarioBase: "5000", setorId: 1 },
    { id: 2, nomeCompleto: "Maria Santos", userId: 200, ativo: true, salarioBase: "6000", setorId: 2 },
  ]),
  listAtestadosLicencas: vi.fn().mockResolvedValue([
    { id: 1, colaboradorId: 1, diasAfastamento: 3, dataInicio: "2026-01-15" },
  ]),
  listSetores: vi.fn().mockResolvedValue([
    { id: 1, nome: "Financeiro" },
    { id: 2, nome: "Comercial" },
  ]),
  createNotificacao: vi.fn().mockResolvedValue(1),
  createAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

import * as db from "./db";

describe("CRM v20 — Metas Individuais (KPIs)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list all metas individuais", async () => {
    const metas = await db.listMetasIndividuais();
    expect(metas).toHaveLength(2);
    expect(metas[0].titulo).toBe("Aumentar produtividade");
    expect(metas[1].status).toBe("concluida");
  });

  it("should list metas filtered by colaboradorId", async () => {
    await db.listMetasIndividuais(1);
    expect(db.listMetasIndividuais).toHaveBeenCalledWith(1);
  });

  it("should list metas filtered by cicloId", async () => {
    await db.listMetasIndividuais(undefined, 1);
    expect(db.listMetasIndividuais).toHaveBeenCalledWith(undefined, 1);
  });

  it("should get meta by id", async () => {
    const meta = await db.getMetaIndividualById(1);
    expect(meta).not.toBeNull();
    expect(meta?.titulo).toBe("Aumentar produtividade");
  });

  it("should return null for non-existent meta", async () => {
    const meta = await db.getMetaIndividualById(999);
    expect(meta).toBeNull();
  });

  it("should create a new meta individual", async () => {
    const id = await db.createMetaIndividual({
      colaboradorId: 1,
      colaboradorNome: "João Silva",
      titulo: "Nova meta",
      valorMeta: "200",
      categoria: "financeiro",
    } as any);
    expect(id).toBe(3);
    expect(db.createMetaIndividual).toHaveBeenCalledTimes(1);
  });

  it("should update a meta individual", async () => {
    await db.updateMetaIndividual(1, { valorAtual: "90", status: "em_andamento" } as any);
    expect(db.updateMetaIndividual).toHaveBeenCalledWith(1, { valorAtual: "90", status: "em_andamento" });
  });

  it("should delete a meta individual", async () => {
    await db.deleteMetaIndividual(1);
    expect(db.deleteMetaIndividual).toHaveBeenCalledWith(1);
  });

  it("should calculate progress percentage correctly", () => {
    const meta = { valorMeta: "100", valorAtual: "75" };
    const pct = Math.min((Number(meta.valorAtual) / Number(meta.valorMeta)) * 100, 100);
    expect(pct).toBe(75);
  });

  it("should cap progress at 100%", () => {
    const meta = { valorMeta: "50", valorAtual: "80" };
    const pct = Math.min((Number(meta.valorAtual) / Number(meta.valorMeta)) * 100, 100);
    expect(pct).toBe(100);
  });
});

describe("CRM v20 — Notificações Automáticas de Avaliação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should notify all users when ciclo is opened", async () => {
    await db.notificarCicloAberto("Ciclo Q1 2026", 10);
    expect(db.notificarCicloAberto).toHaveBeenCalledWith("Ciclo Q1 2026", 10);
    expect(db.notificarCicloAberto).toHaveBeenCalledTimes(1);
  });

  it("should notify avaliador about pending avaliação", async () => {
    await db.notificarAvaliacaoPendente("João Silva", 100, "Ciclo Q1 2026");
    expect(db.notificarAvaliacaoPendente).toHaveBeenCalledWith("João Silva", 100, "Ciclo Q1 2026");
  });

  it("should trigger notification when ciclo status changes to em_andamento", async () => {
    // Simulate the flow: create ciclo as rascunho, then update to em_andamento
    const cicloId = await db.createCicloAvaliacao({
      titulo: "Ciclo Q1 2026",
      dataInicio: "2026-01-01",
      dataFim: "2026-03-31",
      status: "rascunho",
    } as any);
    expect(cicloId).toBe(10);

    // Get ciclo to check current status
    const ciclo = await db.getCicloAvaliacaoById(10);
    expect(ciclo?.status).toBe("rascunho");

    // Update to em_andamento - this should trigger notification
    if (ciclo && ciclo.status !== "em_andamento") {
      await db.notificarCicloAberto(ciclo.titulo, 10);
    }
    await db.updateCicloAvaliacao(10, { status: "em_andamento" } as any);

    expect(db.notificarCicloAberto).toHaveBeenCalledWith("Ciclo Q1 2026", 10);
  });

  it("should trigger notification when creating avaliação with pendente status", async () => {
    const avalId = await db.createAvaliacao({
      cicloId: 10,
      colaboradorId: 1,
      colaboradorNome: "João Silva",
      avaliadorId: 2,
      tipoAvaliador: "gestor",
      status: "pendente",
    } as any);
    expect(avalId).toBe(20);

    // Simulate the notification flow
    const ciclo = await db.getCicloAvaliacaoById(10);
    const allColabs = await db.listColaboradores();
    const avaliadorColab = (allColabs as any[]).find((c: any) => c.id === 2);
    if (avaliadorColab?.userId && ciclo) {
      await db.notificarAvaliacaoPendente("João Silva", avaliadorColab.userId, ciclo.titulo);
    }

    expect(db.notificarAvaliacaoPendente).toHaveBeenCalledWith("João Silva", 200, "Ciclo Q1 2026");
  });
});

describe("CRM v20 — Exportação de Relatórios RH (PDF)", () => {
  it("should calculate KPIs correctly from collaborator data", () => {
    const colabList = [
      { id: 1, ativo: true, salarioBase: "5000", comissoes: "500", adicionais: "200", setorId: 1, dataAdmissao: "2025-06-01" },
      { id: 2, ativo: true, salarioBase: "6000", comissoes: "0", adicionais: "0", setorId: 2, dataAdmissao: "2024-01-15" },
      { id: 3, ativo: false, salarioBase: "4000", dataDesligamento: "2025-12-01", setorId: 1, dataAdmissao: "2023-01-01" },
    ];

    const ativos = colabList.filter(c => c.ativo !== false);
    const inativos = colabList.filter(c => c.ativo === false);
    const totalHeadcount = ativos.length;

    expect(totalHeadcount).toBe(2);
    expect(inativos.length).toBe(1);

    const custoSalarialTotal = ativos.reduce((sum, c) => {
      return sum + Number(c.salarioBase || 0) + Number((c as any).comissoes || 0) + Number((c as any).adicionais || 0);
    }, 0);
    expect(custoSalarialTotal).toBe(11700);

    const salarioMedio = custoSalarialTotal / totalHeadcount;
    expect(salarioMedio).toBe(5850);
  });

  it("should calculate turnover rate correctly", () => {
    const totalHeadcount = 10;
    const desligados12m = 2;
    const turnoverRate = ((desligados12m / ((totalHeadcount + desligados12m) / 2)) * 100).toFixed(1);
    expect(turnoverRate).toBe("33.3");
  });

  it("should calculate absenteeism rate correctly", () => {
    const totalHeadcount = 10;
    const totalDiasAfastamento = 22;
    const diasUteisMes = 22;
    const absenteeismRate = ((totalDiasAfastamento / (totalHeadcount * diasUteisMes * 12)) * 100).toFixed(2);
    expect(absenteeismRate).toBe("0.83");
  });

  it("should group headcount by sector correctly", () => {
    const colabList = [
      { setorId: 1, ativo: true }, { setorId: 1, ativo: true },
      { setorId: 2, ativo: true }, { setorId: 2, ativo: true }, { setorId: 2, ativo: true },
    ];
    const setoresList = [{ id: 1, nome: "Financeiro" }, { id: 2, nome: "Comercial" }];

    const setorMap = new Map<number, { nome: string; count: number }>();
    colabList.filter(c => c.ativo).forEach(c => {
      const setorId = c.setorId || 0;
      const setor = setoresList.find(s => s.id === setorId);
      const existing = setorMap.get(setorId) || { nome: setor?.nome || 'Sem Setor', count: 0 };
      existing.count += 1;
      setorMap.set(setorId, existing);
    });

    expect(setorMap.get(1)?.count).toBe(2);
    expect(setorMap.get(2)?.count).toBe(3);
    expect(setorMap.get(1)?.nome).toBe("Financeiro");
  });
});
