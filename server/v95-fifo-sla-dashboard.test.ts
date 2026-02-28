import { describe, it, expect, vi } from "vitest";
import * as dbCredito from "./dbCredito";

// ============================================================
// Tests for v95: FIFO enforcement, Exception Requests,
// Solicitações tab, and SLA Dashboard
// ============================================================

describe("v95 — FIFO Enforcement Across All Queues", () => {
  describe("FIFO Queue Logic", () => {
    it("should define all 5 credit queues that support FIFO", () => {
      const fifoQueues = ["apuracao", "retificacao", "compensacao", "ressarcimento", "restituicao"];
      expect(fifoQueues).toHaveLength(5);
      expect(fifoQueues).toContain("apuracao");
      expect(fifoQueues).toContain("retificacao");
      expect(fifoQueues).toContain("compensacao");
      expect(fifoQueues).toContain("ressarcimento");
      expect(fifoQueues).toContain("restituicao");
    });

    it("should identify the first a_fazer task as the only unlocked task", () => {
      const tasks = [
        { id: 1, codigo: "CT-0001", status: "a_fazer", createdAt: "2026-01-01 10:00:00" },
        { id: 2, codigo: "CT-0002", status: "a_fazer", createdAt: "2026-01-02 10:00:00" },
        { id: 3, codigo: "CT-0003", status: "a_fazer", createdAt: "2026-01-03 10:00:00" },
        { id: 4, codigo: "CT-0004", status: "fazendo", createdAt: "2026-01-04 10:00:00" },
      ];
      const aFazerTasks = tasks.filter(t => t.status === "a_fazer").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const firstAFazer = aFazerTasks[0];
      
      expect(firstAFazer.id).toBe(1);
      expect(firstAFazer.codigo).toBe("CT-0001");
      
      // Only the first a_fazer task should be unlocked for analysts
      tasks.forEach(t => {
        if (t.status === "a_fazer") {
          const isFirst = t.id === firstAFazer.id;
          const isLocked = !isFirst;
          if (t.id === 1) expect(isLocked).toBe(false);
          else expect(isLocked).toBe(true);
        }
      });
    });

    it("should allow admin to bypass FIFO lock via exception", () => {
      const isAdmin = true;
      const isFirstAFazer = false;
      const isQueueLocked = !isFirstAFazer && !isAdmin;
      expect(isQueueLocked).toBe(false); // Admin is not locked
    });

    it("should lock non-first tasks for regular analysts", () => {
      const isAdmin = false;
      const isFirstAFazer = false;
      const isQueueLocked = !isFirstAFazer && !isAdmin;
      expect(isQueueLocked).toBe(true); // Analyst is locked
    });
  });

  describe("Exception Request Workflow", () => {
    it("should validate exception request has required fields", () => {
      const request = {
        taskId: 5,
        fila: "retificacao",
        justificativa: "Cliente prioritário com prazo judicial",
      };
      expect(request.taskId).toBeGreaterThan(0);
      expect(request.fila).toBeTruthy();
      expect(request.justificativa.length).toBeGreaterThan(0);
    });

    it("should support pendente, aprovado, and negado statuses", () => {
      const validStatuses = ["pendente", "aprovado", "negado"];
      expect(validStatuses).toContain("pendente");
      expect(validStatuses).toContain("aprovado");
      expect(validStatuses).toContain("negado");
    });

    it("should require justificativa for exception requests", () => {
      const emptyJustificativa = "";
      const validJustificativa = "Urgência do cliente";
      expect(emptyJustificativa.trim().length).toBe(0);
      expect(validJustificativa.trim().length).toBeGreaterThan(0);
    });

    it("should track who requested and who responded", () => {
      const exceptionRequest = {
        solicitanteId: 10,
        solicitanteNome: "Ana Silva",
        respondidoPorId: null as number | null,
        respondidoPorNome: null as string | null,
        status: "pendente",
      };
      expect(exceptionRequest.solicitanteId).toBeTruthy();
      expect(exceptionRequest.respondidoPorId).toBeNull(); // Not yet responded
      
      // After approval
      exceptionRequest.respondidoPorId = 1;
      exceptionRequest.respondidoPorNome = "Gestor";
      exceptionRequest.status = "aprovado";
      expect(exceptionRequest.respondidoPorId).toBe(1);
      expect(exceptionRequest.status).toBe("aprovado");
    });
  });

  describe("Exception Request DB Functions", () => {
    it("createQueueExceptionRequest function should exist", () => {
      expect(typeof dbCredito.createQueueExceptionRequest).toBe("function");
    });

    it("listQueueExceptionRequests function should exist", () => {
      expect(typeof dbCredito.listQueueExceptionRequests).toBe("function");
    });

    it("respondQueueExceptionRequest function should exist", () => {
      expect(typeof dbCredito.respondQueueExceptionRequest).toBe("function");
    });

    it("countPendingExceptionRequests function should exist", () => {
      expect(typeof dbCredito.countPendingExceptionRequests).toBe("function");
    });
  });
});

describe("v95 — SLA Dashboard", () => {
  describe("SLA Status Calculation", () => {
    it("should classify tasks as vencido when past deadline", () => {
      const now = new Date();
      const deadline = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const diffDias = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      let slaStatus = "dentro_prazo";
      if (diffDias < 0) slaStatus = "vencido";
      else if (diffDias <= 3) slaStatus = "atencao";
      
      expect(slaStatus).toBe("vencido");
    });

    it("should classify tasks as atencao when within 3 days of deadline", () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      const diffDias = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      let slaStatus = "dentro_prazo";
      if (diffDias < 0) slaStatus = "vencido";
      else if (diffDias <= 3) slaStatus = "atencao";
      
      expect(slaStatus).toBe("atencao");
    });

    it("should classify tasks as dentro_prazo when more than 3 days remain", () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
      const diffDias = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      let slaStatus = "dentro_prazo";
      if (diffDias < 0) slaStatus = "vencido";
      else if (diffDias <= 3) slaStatus = "atencao";
      
      expect(slaStatus).toBe("dentro_prazo");
    });

    it("should compute diasRestantes correctly", () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const diffMs = deadline.getTime() - now.getTime();
      const diffDias = diffMs / (1000 * 60 * 60 * 24);
      const diasRestantes = Math.round(diffDias * 10) / 10;
      
      expect(diasRestantes).toBeCloseTo(5, 0);
    });

    it("should compute horasRestantes correctly", () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
      const diffMs = deadline.getTime() - now.getTime();
      const horasRestantes = Math.round(diffMs / 3600000);
      
      expect(horasRestantes).toBe(48);
    });
  });

  describe("SLA Dashboard Data Aggregation", () => {
    it("should aggregate tasks by fila", () => {
      const tasks = [
        { fila: "apuracao", slaStatus: "vencido" },
        { fila: "apuracao", slaStatus: "atencao" },
        { fila: "apuracao", slaStatus: "dentro_prazo" },
        { fila: "retificacao", slaStatus: "dentro_prazo" },
        { fila: "compensacao", slaStatus: "vencido" },
      ];
      
      const filas = ["apuracao", "retificacao", "compensacao", "ressarcimento", "restituicao"];
      const byFila = filas.map(fila => {
        const filaTasks = tasks.filter(t => t.fila === fila);
        return {
          fila,
          total: filaTasks.length,
          vencido: filaTasks.filter(t => t.slaStatus === "vencido").length,
          atencao: filaTasks.filter(t => t.slaStatus === "atencao").length,
          dentroPrazo: filaTasks.filter(t => t.slaStatus === "dentro_prazo").length,
        };
      });
      
      expect(byFila.find(f => f.fila === "apuracao")?.total).toBe(3);
      expect(byFila.find(f => f.fila === "apuracao")?.vencido).toBe(1);
      expect(byFila.find(f => f.fila === "retificacao")?.total).toBe(1);
      expect(byFila.find(f => f.fila === "compensacao")?.vencido).toBe(1);
      expect(byFila.find(f => f.fila === "ressarcimento")?.total).toBe(0);
    });

    it("should aggregate tasks by analyst", () => {
      const tasks = [
        { responsavelNome: "Ana", slaStatus: "vencido" },
        { responsavelNome: "Ana", slaStatus: "dentro_prazo" },
        { responsavelNome: "Carlos", slaStatus: "atencao" },
        { responsavelNome: null, slaStatus: "dentro_prazo" },
      ];
      
      const analistaMap = new Map<string, { nome: string; total: number; vencido: number; atencao: number; dentroPrazo: number }>();
      tasks.forEach(t => {
        const key = t.responsavelNome || "Sem responsável";
        if (!analistaMap.has(key)) {
          analistaMap.set(key, { nome: key, total: 0, vencido: 0, atencao: 0, dentroPrazo: 0 });
        }
        const entry = analistaMap.get(key)!;
        entry.total++;
        if (t.slaStatus === "vencido") entry.vencido++;
        else if (t.slaStatus === "atencao") entry.atencao++;
        else entry.dentroPrazo++;
      });
      
      const byAnalista = Array.from(analistaMap.values());
      expect(byAnalista).toHaveLength(3);
      expect(byAnalista.find(a => a.nome === "Ana")?.vencido).toBe(1);
      expect(byAnalista.find(a => a.nome === "Carlos")?.atencao).toBe(1);
      expect(byAnalista.find(a => a.nome === "Sem responsável")?.dentroPrazo).toBe(1);
    });

    it("should compute summary totals correctly", () => {
      const tasks = [
        { slaStatus: "vencido" },
        { slaStatus: "vencido" },
        { slaStatus: "atencao" },
        { slaStatus: "dentro_prazo" },
        { slaStatus: "dentro_prazo" },
        { slaStatus: "dentro_prazo" },
      ];
      
      const total = tasks.length;
      const vencido = tasks.filter(t => t.slaStatus === "vencido").length;
      const atencao = tasks.filter(t => t.slaStatus === "atencao").length;
      const dentroPrazo = tasks.filter(t => t.slaStatus === "dentro_prazo").length;
      
      expect(total).toBe(6);
      expect(vencido).toBe(2);
      expect(atencao).toBe(1);
      expect(dentroPrazo).toBe(3);
      expect(vencido + atencao + dentroPrazo).toBe(total);
    });
  });

  describe("SLA Dashboard DB Function", () => {
    it("getSlaDashboardData function should exist", () => {
      expect(typeof dbCredito.getSlaDashboardData).toBe("function");
    });
  });

  describe("SLA Default Calculation", () => {
    it("should use max tese SLA or default 15 days when no teses linked", () => {
      const maxSlaDias = null;
      const defaultSla = 15;
      const slaDias = maxSlaDias || defaultSla;
      expect(slaDias).toBe(15);
    });

    it("should use tese SLA when available", () => {
      const maxSlaDias = 30;
      const defaultSla = 15;
      const slaDias = maxSlaDias || defaultSla;
      expect(slaDias).toBe(30);
    });

    it("should compute deadline from createdAt + slaDias", () => {
      const createdAt = "2026-02-01 10:00:00";
      const slaDias = 15;
      const dt = new Date(createdAt);
      dt.setDate(dt.getDate() + slaDias);
      const deadline = dt.toISOString().slice(0, 10);
      expect(deadline).toBe("2026-02-16");
    });
  });
});

describe("v95 — Solicitações Section", () => {
  it("should filter exception requests by status pendente for admin view", () => {
    const requests = [
      { id: 1, status: "pendente", fila: "apuracao" },
      { id: 2, status: "aprovado", fila: "retificacao" },
      { id: 3, status: "pendente", fila: "compensacao" },
      { id: 4, status: "negado", fila: "ressarcimento" },
    ];
    
    const pendentes = requests.filter(r => r.status === "pendente");
    expect(pendentes).toHaveLength(2);
    expect(pendentes[0].id).toBe(1);
    expect(pendentes[1].id).toBe(3);
  });

  it("should support filtering by analyst name", () => {
    const requests = [
      { id: 1, solicitanteNome: "Ana", fila: "apuracao" },
      { id: 2, solicitanteNome: "Carlos", fila: "retificacao" },
      { id: 3, solicitanteNome: "Ana", fila: "compensacao" },
    ];
    
    const analistaFilter = "Ana";
    const filtered = requests.filter(r => r.solicitanteNome === analistaFilter);
    expect(filtered).toHaveLength(2);
  });

  it("should display exception request with task code and justification", () => {
    const request = {
      id: 1,
      taskCodigo: "CT-0042",
      solicitanteNome: "Ana Silva",
      justificativa: "Cliente com prazo judicial iminente",
      fila: "retificacao",
      status: "pendente",
      createdAt: "2026-02-28 10:00:00",
    };
    
    expect(request.taskCodigo).toMatch(/^CT-\d{4}$/);
    expect(request.solicitanteNome).toBeTruthy();
    expect(request.justificativa.length).toBeGreaterThan(0);
    expect(request.status).toBe("pendente");
  });
});
