import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { apiRouter } from "../publicApi";
import multer from "multer";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ---- SCHEDULED JOBS ----
async function runDailyBirthdayEmails() {
  try {
    const db = await import('../db');
    const config = await db.getEmailAniversarianteConfig();
    if (!config || !config.ativo) return;

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();
    const anoAtual = hoje.getFullYear();

    const aniversariantes = await db.getAniversariantesMes(mesAtual);
    const jaEnviados = await db.getEmailsAniversarianteEnviados(anoAtual);
    const jaEnviadosSet = new Set(jaEnviados);

    const diaStr = String(diaAtual).padStart(2, '0');
    const paraEnviar = (aniversariantes as any[]).filter((c: any) => {
      const diaNasc = c.dataNascimento?.substring(8, 10);
      return diaNasc === diaStr && !jaEnviadosSet.has(c.id);
    });

    let enviados = 0;
    for (const colab of paraEnviar) {
      try {
        const mensagemPersonalizada = config.mensagem.replace(/{nome}/g, colab.nomeCompleto?.split(' ')[0] || 'Colaborador');
        // Get all users to notify them about the birthday
        const allUsers = await db.listUsers();
        for (const u of allUsers) {
          await db.createNotificacao({
            usuarioId: u.id,
            tipo: 'geral' as any,
            titulo: config.assunto,
            mensagem: `${mensagemPersonalizada}\n\n${config.assinatura}`,
            lida: false,
          });
        }
        await db.registrarEmailAniversarianteEnviado(colab.id, anoAtual);
        enviados++;
      } catch (e) { /* ignora erros individuais */ }
    }
    if (enviados > 0) {
      console.log(`[Birthday Scheduler] Sent ${enviados} birthday email(s)`);
    }
  } catch (err) {
    console.error('[Birthday Scheduler Error]', err);
  }
}

async function runContractExpirationCheck() {
  try {
    const db = await import('../db');
    const contratos = await db.getContratosVencendo(30);
    let criados = 0;
    for (const c of contratos) {
      const existing = await db.getWorkflowContratoCriado(c.id);
      if (!existing) {
        // Get owner user to create workflow
        const allUsers = await db.listUsers();
        const owner = allUsers[0]; // First user as owner
        if (owner) {
          await db.criarWorkflowRenovacao({
            colaboradorId: c.id,
            colaboradorNome: c.nomeCompleto,
            cargo: c.cargo,
            dataVencimento: c.dataVencimento,
            diasRestantes: c.diasRestantes,
            tarefaId: null,
            criadoPorId: owner.id,
          });
          // Push notification to all users
          for (const u of allUsers) {
            await db.createNotificacao({
              usuarioId: u.id,
              tipo: 'geral' as any,
              titulo: `Contrato Vencendo: ${c.nomeCompleto}`,
              mensagem: `O contrato de ${c.nomeCompleto} (${c.cargo}) vence em ${c.diasRestantes} dia(s). Um workflow de renovação foi criado automaticamente.`,
              lida: false,
            });
          }
          criados++;
        }
      }
    }
    if (criados > 0) {
      console.log(`[Contract Scheduler] Created ${criados} renewal workflow(s)`);
    }
  } catch (err) {
    console.error('[Contract Scheduler Error]', err);
  }
}

function startScheduledJobs() {
  // Run birthday emails daily at 8:00 AM (check every hour)
  const HOUR_MS = 60 * 60 * 1000;
  let lastBirthdayRun = '';
  let lastContractRun = '';

  setInterval(async () => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    // Run birthday emails once per day (after 8 AM)
    if (now.getHours() >= 8 && lastBirthdayRun !== todayKey) {
      lastBirthdayRun = todayKey;
      await runDailyBirthdayEmails();
    }

    // Run contract check once per day (after 9 AM)
    if (now.getHours() >= 9 && lastContractRun !== todayKey) {
      lastContractRun = todayKey;
      await runContractExpirationCheck();
    }
  }, HOUR_MS);

  // Also run once on startup after a short delay
  setTimeout(async () => {
    await runDailyBirthdayEmails();
    await runContractExpirationCheck();
  }, 10000);

  console.log('[Scheduler] Birthday emails and contract checks scheduled');
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // File upload endpoint for collaborator documents
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post('/api/upload-colaborador-doc', upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { colaboradorId, tipo } = req.body;
      const ext = req.file.originalname.split('.').pop() || 'bin';
      const fileKey = `colaborador-docs/${colaboradorId}/${tipo}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      res.json({ url, fileKey });
    } catch (err: any) {
      console.error('[Upload Error]', err);
      res.status(500).json({ error: err.message });
    }
  });
  // PDF Export endpoint for RH Reports
  app.get('/api/relatorios-rh/pdf', async (req: any, res: any) => {
    try {
      const db = await import('../db');
      const allColabs = await db.listColaboradores();
      const allAtestados = await db.listAtestadosLicencas();
      const allSetores = await db.listSetores();

      const colabList = (allColabs || []) as any[];
      const atestadosList = (allAtestados || []) as any[];
      const setoresList = (allSetores || []) as any[];

      const ativos = colabList.filter(c => c.ativo !== false);
      const inativos = colabList.filter(c => c.ativo === false);
      const totalHeadcount = ativos.length;

      const hoje = new Date();
      const umAnoAtras = new Date(hoje);
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      const desligados12m = inativos.filter(c => {
        if (!c.dataDesligamento) return false;
        const d = new Date(c.dataDesligamento + 'T12:00:00');
        return d >= umAnoAtras;
      });
      const turnoverRate = totalHeadcount > 0 ? ((desligados12m.length / ((totalHeadcount + desligados12m.length) / 2)) * 100).toFixed(1) : '0.0';

      const totalDiasAfastamento = atestadosList.reduce((sum: number, a: any) => sum + (a.diasAfastamento || 0), 0);
      const absenteeismRate = totalHeadcount > 0 ? ((totalDiasAfastamento / (totalHeadcount * 22 * 12)) * 100).toFixed(2) : '0.00';

      const custoSalarialTotal = ativos.reduce((sum: number, c: any) => {
        return sum + Number(c.salarioBase || 0) + Number(c.comissoes || 0) + Number(c.adicionais || 0);
      }, 0);
      const salarioMedio = totalHeadcount > 0 ? custoSalarialTotal / totalHeadcount : 0;

      // By sector
      const setorMap = new Map<number, { nome: string; count: number; custo: number; atestados: number }>();
      ativos.forEach((c: any) => {
        const setorId = c.setorId || 0;
        const setor = setoresList.find((s: any) => s.id === setorId);
        const existing = setorMap.get(setorId) || { nome: setor?.nome || 'Sem Setor', count: 0, custo: 0, atestados: 0 };
        existing.count += 1;
        existing.custo += Number(c.salarioBase || 0) + Number(c.comissoes || 0) + Number(c.adicionais || 0);
        setorMap.set(setorId, existing);
      });
      atestadosList.forEach((a: any) => {
        const colab = colabList.find((c: any) => c.id === a.colaboradorId);
        if (colab) {
          const setorId = colab.setorId || 0;
          const existing = setorMap.get(setorId);
          if (existing) existing.atestados += a.diasAfastamento || 0;
        }
      });
      const porSetor = Array.from(setorMap.entries()).sort((a, b) => b[1].count - a[1].count);

      // Turnover mensal
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const turnoverMensal = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const label = `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        const adm = colabList.filter((c: any) => c.dataAdmissao?.startsWith(mesStr)).length;
        const desl = inativos.filter((c: any) => c.dataDesligamento?.startsWith(mesStr)).length;
        turnoverMensal.push({ mes: label, admissoes: adm, desligamentos: desl });
      }

      const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
      const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

      // Build HTML for PDF
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a2e; font-size: 13px; }
  h1 { color: #1e3a5f; font-size: 22px; border-bottom: 3px solid #3B82F6; padding-bottom: 8px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; border-left: 4px solid; }
  .kpi-card.blue { border-left-color: #3B82F6; } .kpi-card.green { border-left-color: #10B981; }
  .kpi-card.yellow { border-left-color: #F59E0B; } .kpi-card.purple { border-left-color: #8B5CF6; }
  .kpi-label { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
  .kpi-value { font-size: 24px; font-weight: 700; margin: 4px 0; }
  .kpi-sub { font-size: 11px; color: #9ca3af; }
  h2 { font-size: 16px; color: #1e3a5f; margin-top: 28px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #1e3a5f; color: white; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
  td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  tr:nth-child(even) { background: #f8fafc; }
  .total-row { background: #e8f0fe !important; font-weight: 700; }
  .right { text-align: right; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #9ca3af; text-align: center; }
  .turnover-table td, .turnover-table th { text-align: center; padding: 5px 8px; }
</style></head>
<body>
  <h1>Relat\u00f3rio de Recursos Humanos</h1>
  <div class="subtitle">Evox Fiscal \u2014 Gente & Gest\u00e3o | Gerado em ${dataHora}</div>

  <div class="kpi-grid">
    <div class="kpi-card blue"><div class="kpi-label">Headcount Ativo</div><div class="kpi-value">${totalHeadcount}</div><div class="kpi-sub">${inativos.length} inativos</div></div>
    <div class="kpi-card green"><div class="kpi-label">Turnover (12m)</div><div class="kpi-value">${turnoverRate}%</div><div class="kpi-sub">${desligados12m.length} desligados</div></div>
    <div class="kpi-card yellow"><div class="kpi-label">Absente\u00edsmo</div><div class="kpi-value">${absenteeismRate}%</div><div class="kpi-sub">${totalDiasAfastamento} dias afastamento</div></div>
    <div class="kpi-card purple"><div class="kpi-label">Custo Salarial</div><div class="kpi-value" style="font-size:18px">${fmtCurrency(custoSalarialTotal)}</div><div class="kpi-sub">M\u00e9dia: ${fmtCurrency(salarioMedio)}</div></div>
  </div>

  <h2>Distribui\u00e7\u00e3o por Setor</h2>
  <table>
    <thead><tr><th>Setor</th><th class="right">Headcount</th><th class="right">% Total</th><th class="right">Custo Salarial</th><th class="right">Dias Afastamento</th></tr></thead>
    <tbody>
      ${porSetor.map(([id, data]) => {
        const pct = totalHeadcount > 0 ? ((data.count / totalHeadcount) * 100).toFixed(1) : '0.0';
        return `<tr><td>${data.nome}</td><td class="right">${data.count}</td><td class="right">${pct}%</td><td class="right">${fmtCurrency(data.custo)}</td><td class="right">${data.atestados}d</td></tr>`;
      }).join('')}
      <tr class="total-row"><td>Total</td><td class="right">${totalHeadcount}</td><td class="right">100%</td><td class="right">${fmtCurrency(custoSalarialTotal)}</td><td class="right">${totalDiasAfastamento}d</td></tr>
    </tbody>
  </table>

  <h2>Turnover Mensal (\u00daltimos 12 Meses)</h2>
  <table class="turnover-table">
    <thead><tr><th>M\u00eas</th>${turnoverMensal.map(t => `<th>${t.mes}</th>`).join('')}</tr></thead>
    <tbody>
      <tr><td style="font-weight:600">Admiss\u00f5es</td>${turnoverMensal.map(t => `<td style="color:#10B981;font-weight:600">${t.admissoes}</td>`).join('')}</tr>
      <tr><td style="font-weight:600">Desligamentos</td>${turnoverMensal.map(t => `<td style="color:#EF4444;font-weight:600">${t.desligamentos}</td>`).join('')}</tr>
    </tbody>
  </table>

  <div class="footer">Relat\u00f3rio gerado automaticamente pelo sistema Evox Fiscal \u2014 Gente & Gest\u00e3o</div>
</body></html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-rh.html"');
      res.send(html);
    } catch (err: any) {
      console.error('[PDF Export Error]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Public REST API v1
  app.use("/api/v1", apiRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start scheduled jobs after server is running
    startScheduledJobs();
  });
}

startServer().catch(console.error);
