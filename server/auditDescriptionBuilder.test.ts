import { describe, it, expect } from "vitest";
import { buildAuditDescription, buildDadosAnteriores } from "./auditDescriptionBuilder";

describe("buildAuditDescription", () => {
  it("should generate detailed description for task status change", () => {
    const oldData = { status: "a_fazer", prioridade: "media", responsavelNome: "João Silva" };
    const newData = { status: "fazendo" };
    const result = buildAuditDescription("task", oldData, newData, "Maria Santos", "CT-0001");
    expect(result).toContain("Maria Santos atualizou tarefa CT-0001");
    expect(result).toContain("Status alterado de 'A Fazer' para 'Fazendo'");
  });

  it("should generate detailed description for task priority change", () => {
    const oldData = { prioridade: "media" };
    const newData = { prioridade: "urgente" };
    const result = buildAuditDescription("task", oldData, newData, "Admin");
    expect(result).toContain("Prioridade alterado de 'Média' para 'Urgente'");
  });

  it("should generate detailed description for analyst reassignment", () => {
    const oldData = { responsavelNome: "João Silva", responsavelId: 1 };
    const newData = { responsavelNome: "Maria Santos", responsavelId: 2 };
    const result = buildAuditDescription("task", oldData, newData, "Gestor");
    expect(result).toContain("Responsável alterado de 'João Silva' para 'Maria Santos'");
    // Should NOT show responsavelId since responsavelNome is present
    expect(result).not.toContain("Responsável (ID)");
  });

  it("should generate detailed description for observation addition", () => {
    const oldData = { observacoes: null };
    const newData = { observacoes: "Cliente solicitou urgência na análise" };
    const result = buildAuditDescription("task", oldData, newData, "Analista");
    expect(result).toContain('Observação adicionada: "Cliente solicitou urgência na análise"');
  });

  it("should truncate long observations to 100 chars", () => {
    const longObs = "A".repeat(150);
    const oldData = { observacoes: null };
    const newData = { observacoes: longObs };
    const result = buildAuditDescription("task", oldData, newData, "Analista");
    expect(result).toContain("...");
  });

  it("should handle multiple changes in a single update", () => {
    const oldData = { status: "a_fazer", prioridade: "baixa", responsavelNome: "João" };
    const newData = { status: "fazendo", prioridade: "alta", responsavelNome: "Maria" };
    const result = buildAuditDescription("task", oldData, newData, "Admin", "CT-0042");
    expect(result).toContain("Status alterado de 'A Fazer' para 'Fazendo'");
    expect(result).toContain("Prioridade alterado de 'Baixa' para 'Alta'");
    expect(result).toContain("Responsável alterado de 'João' para 'Maria'");
  });

  it("should skip internal fields like id, updatedAt, createdAt", () => {
    const oldData = { id: 1, status: "a_fazer", updatedAt: "2024-01-01", createdAt: "2024-01-01" };
    const newData = { id: 1, status: "fazendo", updatedAt: "2024-01-02", createdAt: "2024-01-01" };
    const result = buildAuditDescription("task", oldData, newData, "Admin");
    expect(result).not.toContain("updatedAt");
    expect(result).not.toContain("createdAt");
    expect(result).toContain("Status alterado");
  });

  it("should return 'sem alterações detectadas' when nothing changed", () => {
    const oldData = { status: "a_fazer" };
    const newData = { status: "a_fazer" };
    const result = buildAuditDescription("task", oldData, newData, "Admin");
    expect(result).toContain("sem alterações detectadas");
  });

  it("should handle null oldData gracefully", () => {
    const newData = { status: "a_fazer", prioridade: "media" };
    const result = buildAuditDescription("task", null, newData, "Admin");
    expect(result).toContain("Status definido como 'A Fazer'");
    expect(result).toContain("Prioridade definido como 'Média'");
  });

  // Case entity tests
  it("should generate detailed description for case phase change", () => {
    const oldData = { fase: "oportunidade", status: "contratado" };
    const newData = { fase: "nda_assinado" };
    const result = buildAuditDescription("case", oldData, newData, "Admin", "CS-0001");
    expect(result).toContain("Fase alterado de 'oportunidade' para 'nda_assinado'");
  });

  // Ticket entity tests
  it("should generate detailed description for ticket status change", () => {
    const oldData = { status: "aberto" };
    const newData = { status: "resolvido" };
    const result = buildAuditDescription("ticket", oldData, newData, "Suporte");
    expect(result).toContain("Status alterado de 'Aberto' para 'Resolvido'");
  });

  // Ledger entity tests
  it("should format monetary values correctly", () => {
    const oldData = { valorValidado: "10000.00" };
    const newData = { valorValidado: "15000.50" };
    const result = buildAuditDescription("ledger", oldData, newData, "Financeiro");
    expect(result).toContain("Valor validado");
    expect(result).toContain("R$");
  });

  // Policy entity tests
  it("should generate detailed description for policy frequency change", () => {
    const oldData = { frequencia: "mensal", ativo: 1 };
    const newData = { frequencia: "trimestral", ativo: 0 };
    const result = buildAuditDescription("policy", oldData, newData, "Admin", "Obrigação Federal");
    expect(result).toContain("Frequência alterado de 'Mensal' para 'Trimestral'");
    expect(result).toContain("Ativo alterado de 'Sim' para 'Não'");
  });

  // SLA entity tests
  it("should generate detailed description for SLA config change", () => {
    const oldData = { slaDias: 30, ativo: 1 };
    const newData = { slaDias: 15 };
    const result = buildAuditDescription("sla", oldData, newData, "Admin", "SLA Apuração");
    expect(result).toContain("SLA (dias) alterado de '30' para '15'");
  });
});

describe("buildDadosAnteriores", () => {
  it("should extract old values for changed fields only", () => {
    const oldData = { status: "a_fazer", prioridade: "media", titulo: "Teste" };
    const newData = { status: "fazendo" };
    const result = buildDadosAnteriores(oldData, newData);
    expect(result).toEqual({ status: "a_fazer" });
    expect(result).not.toHaveProperty("prioridade");
    expect(result).not.toHaveProperty("titulo");
  });

  it("should return empty object when oldData is null", () => {
    const result = buildDadosAnteriores(null, { status: "a_fazer" });
    expect(result).toEqual({});
  });

  it("should skip internal fields", () => {
    const oldData = { id: 1, status: "a_fazer", updatedAt: "2024-01-01" };
    const newData = { id: 1, status: "fazendo", updatedAt: "2024-01-02" };
    const result = buildDadosAnteriores(oldData, newData);
    expect(result).toEqual({ status: "a_fazer" });
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("updatedAt");
  });

  it("should handle multiple changed fields", () => {
    const oldData = { status: "a_fazer", prioridade: "baixa", responsavelNome: "João" };
    const newData = { status: "fazendo", prioridade: "alta", responsavelNome: "Maria" };
    const result = buildDadosAnteriores(oldData, newData);
    expect(result).toEqual({
      status: "a_fazer",
      prioridade: "baixa",
      responsavelNome: "João",
    });
  });
});
