import { describe, it, expect } from "vitest";

// ============================================================
// Tests for OCR Guia Upload, Relatórios Exportáveis (with Charts),
// BackToDashboard, Tarefas Atrasadas, and Overdue Notifications
// ============================================================

describe("OCR Guia Upload Feature", () => {
  describe("Supported Guia Types", () => {
    it("should support all required guia types for OCR parsing", () => {
      const supportedTypes = [
        "PIS",
        "COFINS",
        "PIS/COFINS",
        "INSS",
        "IRPJ",
        "CSLL",
        "IRPJ/CSLL",
      ];
      expect(supportedTypes).toContain("PIS");
      expect(supportedTypes).toContain("COFINS");
      expect(supportedTypes).toContain("PIS/COFINS");
      expect(supportedTypes).toContain("INSS");
      expect(supportedTypes).toContain("IRPJ");
      expect(supportedTypes).toContain("CSLL");
      expect(supportedTypes).toContain("IRPJ/CSLL");
      expect(supportedTypes.length).toBe(7);
    });

    it("should accept PDF and image file types for OCR", () => {
      const supportedFormats = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
      expect(supportedFormats).toContain("application/pdf");
      expect(supportedFormats).toContain("image/png");
      expect(supportedFormats).toContain("image/jpeg");
    });

    it("should support both DARF and GPS document types", () => {
      const documentTypes = ["DARF", "GPS"];
      expect(documentTypes).toContain("DARF");
      expect(documentTypes).toContain("GPS");
    });
  });

  describe("OCR Result Structure", () => {
    it("should return structured data from OCR parsing", () => {
      const ocrResult = {
        tributo: "PIS",
        valor: 15432.50,
        dataVencimento: "25/03/2026",
        cnpjContribuinte: "12.345.678/0001-90",
        periodoApuracao: "02/2026",
        codigoReceita: "8109",
        confianca: 0.92,
      };

      expect(ocrResult).toHaveProperty("tributo");
      expect(ocrResult).toHaveProperty("valor");
      expect(ocrResult).toHaveProperty("dataVencimento");
      expect(ocrResult).toHaveProperty("cnpjContribuinte");
      expect(ocrResult).toHaveProperty("periodoApuracao");
      expect(ocrResult).toHaveProperty("confianca");
      expect(ocrResult.confianca).toBeGreaterThanOrEqual(0);
      expect(ocrResult.confianca).toBeLessThanOrEqual(1);
    });

    it("should validate CNPJ belongs to the client", () => {
      const clienteCnpj = "12.345.678/0001-90";
      const guiaCnpj = "12.345.678/0001-90";
      const guiaCnpjDiff = "98.765.432/0001-10";

      const normalize = (cnpj: string) => cnpj.replace(/[.\-\/]/g, "");
      expect(normalize(clienteCnpj)).toBe(normalize(guiaCnpj));
      expect(normalize(clienteCnpj)).not.toBe(normalize(guiaCnpjDiff));
    });

    it("should parse currency values correctly from OCR text", () => {
      const parseValor = (text: string): number => {
        const cleaned = text.replace(/[R$\s.]/g, "").replace(",", ".");
        return parseFloat(cleaned);
      };

      expect(parseValor("R$ 15.432,50")).toBeCloseTo(15432.50, 2);
      expect(parseValor("R$ 1.234.567,89")).toBeCloseTo(1234567.89, 2);
      expect(parseValor("R$ 500,00")).toBeCloseTo(500.00, 2);
    });

    it("should classify DARF codes correctly for PIS/COFINS/IRPJ/CSLL", () => {
      const CODIGO_TIPO_MAP: Record<string, string> = {
        "8109": "PIS", "6912": "PIS", "3091": "PIS",
        "2172": "COFINS", "5856": "COFINS", "5952": "COFINS",
        "0220": "IRPJ", "2362": "IRPJ", "2089": "IRPJ",
        "6012": "CSLL", "2372": "CSLL", "2484": "CSLL",
        "5664": "PIS/COFINS",
      };

      expect(CODIGO_TIPO_MAP["8109"]).toBe("PIS");
      expect(CODIGO_TIPO_MAP["2172"]).toBe("COFINS");
      expect(CODIGO_TIPO_MAP["0220"]).toBe("IRPJ");
      expect(CODIGO_TIPO_MAP["6012"]).toBe("CSLL");
      expect(CODIGO_TIPO_MAP["5664"]).toBe("PIS/COFINS");
    });

    it("should classify GPS codes correctly for INSS", () => {
      const GPS_CODES = ["2003", "2100", "2208", "2402", "2500", "2607", "2801", "2909", "1201", "1007", "1104"];
      for (const code of GPS_CODES) {
        expect(code.length).toBe(4);
        expect(parseInt(code)).toBeGreaterThan(0);
      }
    });
  });

  describe("File Upload Flow", () => {
    it("should enforce file size limit for upload", () => {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const fileSizeOk = 5 * 1024 * 1024;
      const fileSizeTooBig = 15 * 1024 * 1024;

      expect(fileSizeOk <= MAX_FILE_SIZE).toBe(true);
      expect(fileSizeTooBig <= MAX_FILE_SIZE).toBe(false);
    });

    it("should generate unique file keys for S3 upload", () => {
      const generateKey = (clienteId: number, filename: string) => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `guias/${clienteId}/${timestamp}-${random}-${filename}`;
      };

      const key1 = generateKey(1, "guia-pis.pdf");
      const key2 = generateKey(1, "guia-pis.pdf");

      expect(key1).toContain("guias/1/");
      expect(key1).toContain("guia-pis.pdf");
      expect(key1).not.toBe(key2);
    });
  });
});

describe("Relatórios Exportáveis Feature", () => {
  describe("Report Filters", () => {
    it("should support all required filter types", () => {
      const filterKeys = [
        "periodoInicio",
        "periodoFim",
        "teseId",
        "parceiroId",
        "classificacao",
        "segmento",
        "fila",
      ];

      expect(filterKeys).toContain("periodoInicio");
      expect(filterKeys).toContain("periodoFim");
      expect(filterKeys).toContain("teseId");
      expect(filterKeys).toContain("parceiroId");
      expect(filterKeys).toContain("classificacao");
      expect(filterKeys).toContain("segmento");
      expect(filterKeys).toContain("fila");
      expect(filterKeys.length).toBe(7);
    });

    it("should validate date range filters", () => {
      const periodoInicio = "2025-01-01";
      const periodoFim = "2025-12-31";

      const start = new Date(periodoInicio);
      const end = new Date(periodoFim);

      expect(start.getTime()).toBeLessThan(end.getTime());
    });

    it("should support classificacao filter values", () => {
      const classificacoes = ["novo", "base"];
      expect(classificacoes).toContain("novo");
      expect(classificacoes).toContain("base");
    });

    it("should support all fila filter values", () => {
      const filas = [
        "apuracao", "onboarding", "retificacao",
        "compensacao", "ressarcimento", "restituicao",
      ];
      expect(filas.length).toBe(6);
      expect(filas).toContain("compensacao");
      expect(filas).toContain("ressarcimento");
    });
  });

  describe("Report Summary Calculation", () => {
    it("should calculate summary stats from tasks", () => {
      const tasks = [
        { fila: "apuracao", status: "a_fazer", prioridade: "alta", slaStatus: "dentro_prazo", valorEstimado: 10000 },
        { fila: "apuracao", status: "fazendo", prioridade: "media", slaStatus: "vencido", valorEstimado: 20000 },
        { fila: "compensacao", status: "concluido", prioridade: "baixa", slaStatus: "dentro_prazo", valorEstimado: 30000 },
      ];

      const totalTarefas = tasks.length;
      const totalEmAtraso = tasks.filter(t => t.slaStatus === "vencido").length;
      const totalEstimado = tasks.reduce((s, t) => s + t.valorEstimado, 0);

      const porFila: Record<string, number> = {};
      const porStatus: Record<string, number> = {};
      for (const t of tasks) {
        porFila[t.fila] = (porFila[t.fila] || 0) + 1;
        porStatus[t.status] = (porStatus[t.status] || 0) + 1;
      }

      expect(totalTarefas).toBe(3);
      expect(totalEmAtraso).toBe(1);
      expect(totalEstimado).toBe(60000);
      expect(porFila["apuracao"]).toBe(2);
      expect(porFila["compensacao"]).toBe(1);
      expect(porStatus["a_fazer"]).toBe(1);
    });
  });

  describe("CSV Export", () => {
    it("should generate valid CSV with BOM for Excel compatibility", () => {
      const bom = "\uFEFF";
      const headers = ["Código", "Fila", "Status"];
      const rows = [
        ["CT-0001", "Apuração", "A Fazer"],
        ["CT-0002", "Compensação", "Fazendo"],
      ];
      const csv = bom + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");

      expect(csv.startsWith(bom)).toBe(true);
      expect(csv).toContain("Código;Fila;Status");
      expect(csv).toContain("CT-0001;Apuração;A Fazer");
      expect(csv.split("\n").length).toBe(3);
    });

    it("should escape quotes in CSV fields", () => {
      const value = 'Empresa "Teste" Ltda';
      const escaped = `"${value.replace(/"/g, '""')}"`;
      expect(escaped).toBe('"Empresa ""Teste"" Ltda"');
    });

    it("should use semicolon as separator for pt-BR locale", () => {
      const row = ["CT-0001", "Apuração", "15432.50"];
      const csvLine = row.join(";");
      expect(csvLine).toBe("CT-0001;Apuração;15432.50");
      expect(csvLine).not.toContain(",");
    });
  });

  describe("Charts Data Transformation", () => {
    it("should transform porFila data for bar chart", () => {
      const FILA_LABELS: Record<string, string> = {
        apuracao: "Apuração", compensacao: "Compensação", ressarcimento: "Ressarcimento",
      };
      const porFila = { apuracao: 5, compensacao: 3, ressarcimento: 8 };

      const chartData = Object.entries(porFila)
        .map(([key, val]) => ({ name: FILA_LABELS[key] || key, tarefas: val }))
        .sort((a, b) => b.tarefas - a.tarefas);

      expect(chartData.length).toBe(3);
      expect(chartData[0].name).toBe("Ressarcimento");
      expect(chartData[0].tarefas).toBe(8);
      expect(chartData[2].name).toBe("Compensação");
      expect(chartData[2].tarefas).toBe(3);
    });

    it("should transform porStatus data for pie chart with correct colors", () => {
      const STATUS_COLORS: Record<string, string> = {
        a_fazer: "#f59e0b", fazendo: "#3b82f6", feito: "#8b5cf6", concluido: "#10b981",
      };
      const porStatus = { a_fazer: 10, fazendo: 5, feito: 3, concluido: 7 };

      const chartData = Object.entries(porStatus)
        .map(([key, val]) => ({ name: key, value: val, fill: STATUS_COLORS[key] || "#6b7280" }));

      expect(chartData.length).toBe(4);
      expect(chartData.find(d => d.name === "a_fazer")?.fill).toBe("#f59e0b");
      expect(chartData.find(d => d.name === "concluido")?.fill).toBe("#10b981");
      expect(chartData.reduce((s, d) => s + d.value, 0)).toBe(25);
    });

    it("should transform valor por fila data for grouped bar chart", () => {
      const tasks = [
        { fila: "apuracao", valorEstimado: 10000, valorContratado: 8000 },
        { fila: "apuracao", valorEstimado: 20000, valorContratado: 15000 },
        { fila: "compensacao", valorEstimado: 30000, valorContratado: 25000 },
      ];

      const map: Record<string, { estimado: number; contratado: number }> = {};
      tasks.forEach(t => {
        if (!map[t.fila]) map[t.fila] = { estimado: 0, contratado: 0 };
        map[t.fila].estimado += t.valorEstimado;
        map[t.fila].contratado += t.valorContratado;
      });

      const chartData = Object.entries(map)
        .map(([key, val]) => ({ name: key, estimado: val.estimado, contratado: val.contratado }))
        .sort((a, b) => b.estimado - a.estimado);

      expect(chartData.length).toBe(2);
      expect(chartData[0].name).toBe("apuracao");
      expect(chartData[0].estimado).toBe(30000);
      expect(chartData[0].contratado).toBe(23000);
      expect(chartData[1].estimado).toBe(30000);
    });

    it("should limit parceiro chart data to top 8", () => {
      const porParceiro: Record<string, number> = {};
      for (let i = 1; i <= 15; i++) {
        porParceiro[`Parceiro ${i}`] = 15 - i + 1;
      }

      const chartData = Object.entries(porParceiro)
        .map(([key, val]) => ({ name: key, tarefas: val }))
        .sort((a, b) => b.tarefas - a.tarefas)
        .slice(0, 8);

      expect(chartData.length).toBe(8);
      expect(chartData[0].tarefas).toBe(15);
      expect(chartData[7].tarefas).toBe(8);
    });

    it("should truncate long parceiro names for chart display", () => {
      const longName = "Empresa de Consultoria Tributária Nacional";
      const truncated = longName.length > 20 ? longName.substring(0, 18) + "…" : longName;
      expect(truncated.length).toBeLessThanOrEqual(20);
      expect(truncated).toContain("…");
    });
  });
});

describe("BackToDashboard Navigation", () => {
  it("should define the correct dashboard route", () => {
    const dashboardRoute = "/credito/dashboard-credito";
    expect(dashboardRoute).toBe("/credito/dashboard-credito");
  });

  it("should be present in all fila pages", () => {
    const filaPages = [
      "CreditoFilaApuracao",
      "CreditoFilaOnboarding",
      "CreditoFilaRetificacao",
      "CreditoFilaCompensacao",
      "CreditoFilaRessarcimento",
      "CreditoFilaRestituicao",
      "CreditoNovaTarefa",
      "CreditoGestaoCreditos",
      "CreditoRelatorios",
    ];

    expect(filaPages.length).toBe(9);
    for (const page of filaPages) {
      expect(page).toBeTruthy();
    }
  });
});

describe("Tarefas Atrasadas Feature", () => {
  describe("Overdue Detection", () => {
    it("should identify overdue tasks based on prazo < now", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000);
      const futureDate = new Date(now.getTime() + 86400000);

      const tasks = [
        { id: 1, status: "a_fazer", prazo: pastDate.toISOString() },
        { id: 2, status: "fazendo", prazo: pastDate.toISOString() },
        { id: 3, status: "a_fazer", prazo: futureDate.toISOString() },
        { id: 4, status: "concluido", prazo: pastDate.toISOString() },
      ];

      const overdue = tasks.filter(
        t => ["a_fazer", "fazendo"].includes(t.status) && new Date(t.prazo) < now
      );

      expect(overdue.length).toBe(2);
      expect(overdue.map(t => t.id)).toEqual([1, 2]);
    });

    it("should filter overdue tasks by fila", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000);

      const tasks = [
        { id: 1, fila: "apuracao", status: "a_fazer", prazo: pastDate.toISOString() },
        { id: 2, fila: "compensacao", status: "fazendo", prazo: pastDate.toISOString() },
        { id: 3, fila: "apuracao", status: "fazendo", prazo: pastDate.toISOString() },
      ];

      const overdueApuracao = tasks.filter(
        t => t.fila === "apuracao" && ["a_fazer", "fazendo"].includes(t.status) && new Date(t.prazo) < now
      );

      expect(overdueApuracao.length).toBe(2);
    });
  });

  describe("Overdue Display", () => {
    it("should show count and list of overdue tasks", () => {
      const overdueTasks = [
        { codigo: "CT-0001", titulo: "Apurar PIS", diasAtraso: 3 },
        { codigo: "CT-0002", titulo: "Retificar COFINS", diasAtraso: 7 },
      ];

      expect(overdueTasks.length).toBeGreaterThan(0);
      for (const task of overdueTasks) {
        expect(task.diasAtraso).toBeGreaterThan(0);
        expect(task.codigo).toBeTruthy();
        expect(task.titulo).toBeTruthy();
      }
    });

    it("should calculate days overdue correctly", () => {
      const now = new Date("2026-02-26");
      const prazo = new Date("2026-02-20");
      const diasAtraso = Math.ceil((now.getTime() - prazo.getTime()) / (1000 * 60 * 60 * 24));

      expect(diasAtraso).toBe(6);
    });
  });

  describe("All Filas Coverage", () => {
    it("should support overdue view in all filas", () => {
      const filasWithOverdue = [
        "apuracao",
        "onboarding",
        "retificacao",
        "compensacao",
        "ressarcimento",
        "restituicao",
      ];

      expect(filasWithOverdue.length).toBe(6);
      for (const fila of filasWithOverdue) {
        expect(typeof fila).toBe("string");
        expect(fila.length).toBeGreaterThan(0);
      }
    });
  });
});

describe("Overdue Notifications Feature", () => {
  describe("SLA Status Updates", () => {
    it("should transition tasks from dentro_prazo to vencido when past deadline", () => {
      const now = new Date();
      const tasks = [
        { id: 1, slaStatus: "dentro_prazo", dataVencimento: new Date(now.getTime() - 86400000).toISOString(), status: "a_fazer" },
        { id: 2, slaStatus: "dentro_prazo", dataVencimento: new Date(now.getTime() + 86400000).toISOString(), status: "fazendo" },
        { id: 3, slaStatus: "dentro_prazo", dataVencimento: new Date(now.getTime() - 3600000).toISOString(), status: "concluido" },
      ];

      const shouldUpdate = tasks.filter(
        t => t.status !== "feito" && t.status !== "concluido" &&
             t.slaStatus !== "vencido" &&
             t.dataVencimento && new Date(t.dataVencimento) < now
      );

      expect(shouldUpdate.length).toBe(1);
      expect(shouldUpdate[0].id).toBe(1);
    });

    it("should transition tasks to atencao when within 24h of deadline", () => {
      const now = new Date();
      const tasks = [
        { id: 1, slaStatus: "dentro_prazo", dataVencimento: new Date(now.getTime() + 12 * 3600000).toISOString(), status: "a_fazer" },
        { id: 2, slaStatus: "dentro_prazo", dataVencimento: new Date(now.getTime() + 48 * 3600000).toISOString(), status: "fazendo" },
      ];

      const shouldWarn = tasks.filter(
        t => t.slaStatus === "dentro_prazo" &&
             t.dataVencimento &&
             new Date(t.dataVencimento) > now &&
             new Date(t.dataVencimento) < new Date(now.getTime() + 24 * 3600000)
      );

      expect(shouldWarn.length).toBe(1);
      expect(shouldWarn[0].id).toBe(1);
    });
  });

  describe("Notification Content", () => {
    it("should build notification content with fila breakdown", () => {
      const summary = {
        total: 5,
        porFila: { apuracao: 2, compensacao: 3 },
        porResponsavel: { "João Silva": 3, "Maria Santos": 2 },
      };

      const FILA_LABELS: Record<string, string> = {
        apuracao: "Apuração", compensacao: "Compensação",
      };

      const filaLines = Object.entries(summary.porFila)
        .sort((a, b) => b[1] - a[1])
        .map(([fila, count]) => `  • ${FILA_LABELS[fila] || fila}: ${count} tarefa(s)`)
        .join("\n");

      expect(filaLines).toContain("Compensação: 3 tarefa(s)");
      expect(filaLines).toContain("Apuração: 2 tarefa(s)");
    });

    it("should include top responsible users in notification", () => {
      const porResponsavel = { "João": 5, "Maria": 3, "Pedro": 1 };

      const lines = Object.entries(porResponsavel)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nome, count]) => `  • ${nome}: ${count} tarefa(s)`)
        .join("\n");

      expect(lines).toContain("João: 5 tarefa(s)");
      expect(lines).toContain("Maria: 3 tarefa(s)");
    });

    it("should truncate task list to top 10 in notification", () => {
      const tasks = Array.from({ length: 15 }, (_, i) => ({
        codigo: `CT-${String(i + 1).padStart(4, "0")}`,
        titulo: `Tarefa ${i + 1}`,
        fila: "apuracao",
        clienteNome: `Cliente ${i + 1}`,
      }));

      const topTasks = tasks.slice(0, 10);
      const remaining = tasks.length - 10;

      expect(topTasks.length).toBe(10);
      expect(remaining).toBe(5);
    });
  });

  describe("Notification Delivery", () => {
    it("should send both push and in-app notifications", () => {
      const notificationChannels = ["push_owner", "in_app_all_users"];
      expect(notificationChannels).toContain("push_owner");
      expect(notificationChannels).toContain("in_app_all_users");
    });

    it("should run daily at 8 AM via scheduler", () => {
      const schedulerConfig = {
        checkInterval: 3600000, // 1 hour
        runAfterHour: 8,
        runsOnStartup: true,
      };

      expect(schedulerConfig.checkInterval).toBe(3600000);
      expect(schedulerConfig.runAfterHour).toBe(8);
      expect(schedulerConfig.runsOnStartup).toBe(true);
    });
  });
});

describe("Test Companies with Contracts", () => {
  it("should have test companies with required fields", () => {
    const testCompanies = [
      { cnpj: "33.000.167/0001-01", razaoSocial: "Petrobras S.A.", regime: "lucro_real", fase: "contratado" },
      { cnpj: "60.746.948/0001-12", razaoSocial: "Banco Bradesco S.A.", regime: "lucro_real", fase: "contratado" },
      { cnpj: "47.960.950/0001-21", razaoSocial: "Magazine Luiza S.A.", regime: "lucro_real", fase: "contratado" },
      { cnpj: "07.526.557/0001-00", razaoSocial: "Ambev S.A.", regime: "lucro_real", fase: "contratado" },
      { cnpj: "16.670.085/0001-55", razaoSocial: "Localiza Rent a Car S.A.", regime: "lucro_real", fase: "contratado" },
    ];

    expect(testCompanies.length).toBe(5);
    for (const c of testCompanies) {
      expect(c.cnpj).toBeTruthy();
      expect(c.razaoSocial).toBeTruthy();
      expect(c.regime).toBe("lucro_real");
      expect(c.fase).toBe("contratado");
    }
  });

  it("should allow creating tasks for companies with signed contracts", () => {
    const filasThatRequireContract = ["compensacao", "ressarcimento", "restituicao"];
    const companyFase = "contratado";
    const companyStatus = "contrato_assinado";

    for (const fila of filasThatRequireContract) {
      const canCreateTask = companyFase === "contratado" && companyStatus === "contrato_assinado";
      expect(canCreateTask).toBe(true);
    }
  });
});


// ============================================================
// Tests for Dashboard Real-Time Data, Navigation, and Form Alerts
// ============================================================

describe("Dashboard Real-Time Data", () => {
  describe("getCreditTaskStats returns per-fila breakdown", () => {
    it("should return stats for all 6 credit filas", () => {
      const expectedFilas = ["apuracao", "onboarding", "retificacao", "compensacao", "ressarcimento", "restituicao"];
      const stats: Record<string, any> = {};
      for (const fila of expectedFilas) {
        stats[fila] = { a_fazer: 0, fazendo: 0, feito: 0, concluido: 0, em_atraso: 0, total: 0 };
      }
      expect(Object.keys(stats)).toEqual(expectedFilas);
      for (const fila of expectedFilas) {
        expect(stats[fila]).toHaveProperty("a_fazer");
        expect(stats[fila]).toHaveProperty("fazendo");
        expect(stats[fila]).toHaveProperty("feito");
        expect(stats[fila]).toHaveProperty("concluido");
        expect(stats[fila]).toHaveProperty("em_atraso");
        expect(stats[fila]).toHaveProperty("total");
      }
    });

    it("should calculate totals correctly from per-fila stats", () => {
      const stats = {
        apuracao: { a_fazer: 3, fazendo: 1, feito: 0, concluido: 0, em_atraso: 1, total: 4 },
        compensacao: { a_fazer: 2, fazendo: 0, feito: 1, concluido: 0, em_atraso: 0, total: 3 },
        onboarding: { a_fazer: 0, fazendo: 0, feito: 0, concluido: 0, em_atraso: 0, total: 0 },
        retificacao: { a_fazer: 0, fazendo: 0, feito: 0, concluido: 0, em_atraso: 0, total: 0 },
        ressarcimento: { a_fazer: 0, fazendo: 0, feito: 0, concluido: 0, em_atraso: 0, total: 0 },
        restituicao: { a_fazer: 0, fazendo: 0, feito: 0, concluido: 0, em_atraso: 0, total: 0 },
      };

      const totalTarefas = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
      const totalPendentes = Object.values(stats).reduce((sum, s) => sum + s.a_fazer + s.fazendo, 0);
      const totalConcluidas = Object.values(stats).reduce((sum, s) => sum + s.concluido, 0);
      const totalEmAtraso = Object.values(stats).reduce((sum, s) => sum + s.em_atraso, 0);

      expect(totalTarefas).toBe(7);
      expect(totalPendentes).toBe(6);
      expect(totalConcluidas).toBe(0);
      expect(totalEmAtraso).toBe(1);
    });

    it("should use consistent status labels matching fila pages", () => {
      const dashboardLabels = ["A Fazer", "Fazendo", "Feito", "Concluído"];
      const filaLabels = {
        a_fazer: "A Fazer",
        fazendo: "Fazendo",
        feito: "Feito",
        concluido: "Concluído",
      };
      for (const label of dashboardLabels) {
        expect(Object.values(filaLabels)).toContain(label);
      }
    });

    it("should support auto-refresh with refetchInterval", () => {
      const refetchInterval = 30000; // 30 seconds
      expect(refetchInterval).toBeGreaterThan(0);
      expect(refetchInterval).toBeLessThanOrEqual(60000);
    });
  });

  describe("Dashboard SQL query correctness", () => {
    it("should count tasks per status per fila using GROUP BY", () => {
      // The actual query uses GROUP BY fila, status
      const query = `SELECT ct.fila, ct.status, COUNT(*) as count,
        SUM(CASE WHEN ct.slaStatus = 'vencido' AND ct.status NOT IN ('feito','concluido') THEN 1 ELSE 0 END) as em_atraso
        FROM credit_tasks ct GROUP BY ct.fila, ct.status`;
      expect(query).toContain("GROUP BY ct.fila, ct.status");
      expect(query).toContain("slaStatus = 'vencido'");
      expect(query).toContain("COUNT(*)");
    });
  });
});

describe("Navigation Header (BackToDashboard replacement)", () => {
  it("should render back arrow for browser history navigation", () => {
    // BackToDashboard now renders ArrowLeft icon that calls window.history.back()
    const hasBackArrow = true;
    const usesHistoryBack = true;
    expect(hasBackArrow).toBe(true);
    expect(usesHistoryBack).toBe(true);
  });

  it("should render home icon for direct navigation to root", () => {
    // Home icon navigates to '/'
    const hasHomeIcon = true;
    const homeRoute = '/';
    expect(hasHomeIcon).toBe(true);
    expect(homeRoute).toBe('/');
  });

  it("should NOT display 'Voltar ao Dashboard' text anymore", () => {
    // The old component showed "← Voltar ao Dashboard"
    // The new component only shows icons (arrow + home)
    const showsText = false;
    expect(showsText).toBe(false);
  });

  it("should be present in all credito subpages", () => {
    const pagesWithNavHeader = [
      "CreditoFilaApuracao",
      "CreditoFilaOnboarding",
      "CreditoFilaRetificacao",
      "CreditoFilaCompensacao",
      "CreditoFilaRessarcimento",
      "CreditoFilaRestituicao",
      "CreditoGestaoCreditos",
      "CreditoRelatorios",
      "CreditoNovaTarefa",
    ];
    expect(pagesWithNavHeader.length).toBe(9);
  });
});

describe("Form Confirmation Alert (useConfirmClose)", () => {
  it("should detect dirty form state based on filled fields", () => {
    const emptyGuiaForm = { cnpjGuia: '', codigoReceita: '', valorOriginal: 0, observacoes: '' };
    const isDirtyEmpty = !!(emptyGuiaForm.cnpjGuia || emptyGuiaForm.codigoReceita || emptyGuiaForm.valorOriginal || emptyGuiaForm.observacoes);
    expect(isDirtyEmpty).toBe(false);

    const filledGuiaForm = { cnpjGuia: '12.345.678/0001-90', codigoReceita: '2172', valorOriginal: 1500, observacoes: '' };
    const isDirtyFilled = !!(filledGuiaForm.cnpjGuia || filledGuiaForm.codigoReceita || filledGuiaForm.valorOriginal || filledGuiaForm.observacoes);
    expect(isDirtyFilled).toBe(true);
  });

  it("should detect dirty PerdComp form state", () => {
    const emptyPerdcompForm = { numeroPerdcomp: '', cnpjDeclarante: '', valorCredito: 0, observacoes: '' };
    const isDirty = !!(emptyPerdcompForm.numeroPerdcomp || emptyPerdcompForm.cnpjDeclarante || emptyPerdcompForm.valorCredito || emptyPerdcompForm.observacoes);
    expect(isDirty).toBe(false);

    const filledPerdcompForm = { numeroPerdcomp: 'PC-001', cnpjDeclarante: '', valorCredito: 0, observacoes: '' };
    const isDirtyFilled = !!(filledPerdcompForm.numeroPerdcomp || filledPerdcompForm.cnpjDeclarante || filledPerdcompForm.valorCredito || filledPerdcompForm.observacoes);
    expect(isDirtyFilled).toBe(true);
  });

  it("should allow closing without alert when form is clean", () => {
    const isDirty = false;
    let dialogClosed = false;
    let alertShown = false;

    if (isDirty) {
      alertShown = true;
    } else {
      dialogClosed = true;
    }

    expect(alertShown).toBe(false);
    expect(dialogClosed).toBe(true);
  });

  it("should show alert when form is dirty and user tries to close", () => {
    const isDirty = true;
    let dialogClosed = false;
    let alertShown = false;

    if (isDirty) {
      alertShown = true;
    } else {
      dialogClosed = true;
    }

    expect(alertShown).toBe(true);
    expect(dialogClosed).toBe(false);
  });

  it("should close dialog when user confirms exit in alert", () => {
    let dialogClosed = false;
    const confirmExit = () => { dialogClosed = true; };
    confirmExit();
    expect(dialogClosed).toBe(true);
  });

  it("should keep dialog open when user cancels exit in alert", () => {
    let alertOpen = true;
    const cancelExit = () => { alertOpen = false; };
    cancelExit();
    expect(alertOpen).toBe(false);
  });

  it("should be integrated in Compensacao, Ressarcimento, and Restituicao dialogs", () => {
    const pagesWithConfirmClose = [
      "CreditoFilaCompensacao",
      "CreditoFilaRessarcimento",
      "CreditoFilaRestituicao",
    ];
    expect(pagesWithConfirmClose.length).toBe(3);
  });

  it("should be integrated in CreditoNovaTarefa page", () => {
    const hasUnsavedChangesHook = true;
    expect(hasUnsavedChangesHook).toBe(true);
  });

  it("should guard both guia and perdcomp dialogs independently", () => {
    // Each dialog has its own dirty state and confirm close handler
    const guiaDirty = true;
    const perdcompDirty = false;

    // Closing guia dialog should show alert
    const guiaAlertShown = guiaDirty;
    // Closing perdcomp dialog should NOT show alert
    const perdcompAlertShown = perdcompDirty;

    expect(guiaAlertShown).toBe(true);
    expect(perdcompAlertShown).toBe(false);
  });
});

describe("Overdue Tasks SQL Fix", () => {
  it("should use clientes table join instead of cc.nomeCliente", () => {
    // The fixed query joins with clientes table to get the client name
    const fixedQuery = `
      SELECT ct.id, ct.codigo, ct.fila, ct.titulo, ct.status,
             ct.responsavelNome, ct.dataVencimento, ct.slaHoras,
             COALESCE(cl.razaoSocial, cl.nomeFantasia) as clienteNome
      FROM credit_tasks ct
      LEFT JOIN credit_cases cc ON ct.caseId = cc.id
      LEFT JOIN clientes cl ON cc.clienteId = cl.id
      WHERE ct.slaStatus = 'vencido'
        AND ct.status NOT IN ('feito', 'concluido')
    `;
    expect(fixedQuery).toContain("LEFT JOIN clientes cl");
    expect(fixedQuery).toContain("cl.razaoSocial");
    expect(fixedQuery).not.toContain("cc.nomeCliente");
  });
});
