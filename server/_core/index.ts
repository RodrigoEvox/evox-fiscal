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

async function runAdvanceBirthdayNotifications() {
  try {
    const db = await import('../db');
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const allUsers = await db.listUsers();
    if (!allUsers || allUsers.length === 0) return;

    // Check for birthdays 7 days and 3 days from now
    const diasAntecedencia = [7, 3];
    let totalEnviados = 0;

    for (const diasAntes of diasAntecedencia) {
      const dataAlvo = new Date(hoje);
      dataAlvo.setDate(dataAlvo.getDate() + diasAntes);
      const mesAlvo = dataAlvo.getMonth() + 1;
      const diaAlvo = dataAlvo.getDate();

      const aniversariantes = await db.getAniversariantesMes(mesAlvo);
      const jaEnviados = await db.getNotificacoesAniversarioEnviadas(anoAtual, diasAntes);
      const jaEnviadosSet = new Set(jaEnviados);

      const diaStr = String(diaAlvo).padStart(2, '0');
      const paraNotificar = (aniversariantes as any[]).filter((c: any) => {
        const diaNasc = c.dataNascimento?.substring(8, 10);
        // Excluir colaboradores desligados
        const status = c.statusColaborador || 'ativo';
        return diaNasc === diaStr && !jaEnviadosSet.has(c.id) && status !== 'desligado';
      });

      for (const colab of paraNotificar) {
        try {
          const nome = colab.nomeCompleto?.split(' ')[0] || 'Colaborador';
          const dataNascFormatada = colab.dataNascimento ? 
            `${colab.dataNascimento.substring(8, 10)}/${colab.dataNascimento.substring(5, 7)}` : '';
          const titulo = diasAntes === 7 
            ? `\u{1F382} Anivers\u00e1rio em 7 dias: ${colab.nomeCompleto}`
            : `\u{1F382} Anivers\u00e1rio em 3 dias: ${colab.nomeCompleto}`;
          const mensagem = diasAntes === 7
            ? `O colaborador ${colab.nomeCompleto} (${colab.cargo || 'N/I'}) far\u00e1 anivers\u00e1rio em 7 dias (${dataNascFormatada}). Considere agendar o Day Off de anivers\u00e1rio.`
            : `O colaborador ${colab.nomeCompleto} (${colab.cargo || 'N/I'}) far\u00e1 anivers\u00e1rio em 3 dias (${dataNascFormatada}). Lembre-se de agendar o Day Off de anivers\u00e1rio caso ainda n\u00e3o tenha sido feito.`;

          for (const u of allUsers) {
            await db.createNotificacao({
              usuarioId: u.id,
              tipo: 'geral' as any,
              titulo,
              mensagem,
              lida: false,
            });
          }
          await db.registrarNotificacaoAniversarioAntecipada(colab.id, anoAtual, diasAntes);
          totalEnviados++;
        } catch (e) { /* ignora erros individuais */ }
      }
    }
    if (totalEnviados > 0) {
      console.log(`[Birthday Advance Scheduler] Sent ${totalEnviados} advance notification(s)`);
    }
  } catch (err) {
    console.error('[Birthday Advance Scheduler Error]', err);
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

async function runReajusteDoisAnosCheck() {
  try {
    const db = await import('../db');
    const { notifyOwner } = await import('./notification');
    const elegiveis = await db.checkReajusteDoisAnos();
    if (elegiveis.length === 0) return;

    // Notify all users via in-app notifications
    const allUsers = await db.listUsers();
    for (const colab of elegiveis) {
      const salarioNovo = (colab.salarioAtual * 1.10).toFixed(2);
      const titulo = `Reajuste 2 Anos: ${colab.nome}`;
      const mensagem = `${colab.nome} completou ${colab.anosCompletos} anos de casa (admissão: ${colab.dataAdmissao}). ` +
        `Salário atual: R$ ${colab.salarioAtual.toFixed(2)} → Novo salário estimado (10%): R$ ${salarioNovo}. ` +
        `Acesse Reajustes Salariais para registrar o reajuste.`;

      for (const u of allUsers) {
        await db.createNotificacao({
          usuarioId: u.id,
          tipo: 'geral' as any,
          titulo,
          mensagem,
          lida: false,
        });
      }
    }

    // Also notify owner via Manus notification
    const nomes = elegiveis.map(e => `• ${e.nome} (${e.anosCompletos} anos, R$ ${e.salarioAtual.toFixed(2)} → R$ ${(e.salarioAtual * 1.10).toFixed(2)})`).join('\n');
    await notifyOwner({
      title: `⚠️ ${elegiveis.length} colaborador(es) elegível(is) para reajuste de 2 anos`,
      content: `Os seguintes colaboradores completaram múltiplos de 2 anos de casa e são elegíveis para reajuste salarial de 10%:\n\n${nomes}\n\nAcesse o módulo Reajustes Salariais no GEG para registrar os reajustes.`,
    });

    console.log(`[Reajuste Scheduler] Found ${elegiveis.length} eligible employee(s) for 2-year adjustment`);
  } catch (err) {
    console.error('[Reajuste Scheduler Error]', err);
  }
}

function startScheduledJobs() {
  // Run birthday emails daily at 8:00 AM (check every hour)
  const HOUR_MS = 60 * 60 * 1000;
  let lastBirthdayRun = '';
  let lastContractRun = '';
  let lastReajusteRun = '';

  setInterval(async () => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    // Run birthday emails once per day (after 8 AM)
    if (now.getHours() >= 8 && lastBirthdayRun !== todayKey) {
      lastBirthdayRun = todayKey;
      await runDailyBirthdayEmails();
      await runAdvanceBirthdayNotifications();
    }

    // Run contract check once per day (after 9 AM)
    if (now.getHours() >= 9 && lastContractRun !== todayKey) {
      lastContractRun = todayKey;
      await runContractExpirationCheck();
    }

    // Run reajuste 2-year check once per day (after 9 AM)
    if (now.getHours() >= 9 && lastReajusteRun !== todayKey) {
      lastReajusteRun = todayKey;
      await runReajusteDoisAnosCheck();
    }
  }, HOUR_MS);

  // Also run once on startup after a short delay
  setTimeout(async () => {
    await runDailyBirthdayEmails();
    await runAdvanceBirthdayNotifications();
    await runContractExpirationCheck();
    await runReajusteDoisAnosCheck();
  }, 10000);

  console.log('[Scheduler] Birthday emails, contract checks, and reajuste alerts scheduled');
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

  // ---- APONTAMENTOS DA FOLHA EXPORT (Excel) ----
  app.get('/api/apontamentos-folha/excel', async (req: any, res: any) => {
    try {
      const dbMod = await import('../db');
      const mesRef = parseInt(req.query.mes) || (new Date().getMonth() + 1);
      const anoRef = parseInt(req.query.ano) || new Date().getFullYear();
      const apontamentos = await dbMod.listApontamentosFolha(mesRef, anoRef);
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Evox Fiscal';
      wb.created = new Date();

      const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const TIPO_LABELS: Record<string, string> = {
        vale_transporte: 'Vale Transporte', academia: 'Academia', comissao: 'Comissão',
        reajuste_sindical: 'Reajuste Sindical', reajuste_dois_anos: 'Reajuste 2 Anos',
        pensao_alimenticia: 'Pensão Alimentícia', contribuicao_assistencial: 'Contribuição Assist.',
        banco_horas: 'Banco de Horas', outro: 'Outro',
      };

      // Sheet 1: Resumo por Tipo
      const wsResumo = wb.addWorksheet('Resumo');
      wsResumo.columns = [
        { header: 'Tipo', key: 'tipo', width: 25 },
        { header: 'Quantidade', key: 'qtd', width: 14 },
        { header: 'Valor Total (R$)', key: 'total', width: 20 },
      ];
      const tipoMap: Record<string, { qtd: number; total: number }> = {};
      (apontamentos || []).forEach((a: any) => {
        if (!tipoMap[a.tipo]) tipoMap[a.tipo] = { qtd: 0, total: 0 };
        tipoMap[a.tipo].qtd++;
        tipoMap[a.tipo].total += Number(a.valor);
      });
      Object.entries(tipoMap).forEach(([tipo, data]) => {
        wsResumo.addRow({ tipo: TIPO_LABELS[tipo] || tipo, qtd: data.qtd, total: data.total });
      });
      const totalGeral = Object.values(tipoMap).reduce((s, d) => s + d.total, 0);
      const totalRow = wsResumo.addRow({ tipo: 'TOTAL GERAL', qtd: (apontamentos || []).length, total: totalGeral });
      totalRow.font = { bold: true };
      wsResumo.getRow(1).font = { bold: true };
      wsResumo.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      wsResumo.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Sheet 2: Detalhamento por Colaborador
      const wsDetalhe = wb.addWorksheet('Por Colaborador');
      wsDetalhe.columns = [
        { header: 'Colaborador', key: 'nome', width: 35 },
        { header: 'Tipo', key: 'tipo', width: 22 },
        { header: 'Descrição', key: 'descricao', width: 45 },
        { header: 'Natureza', key: 'natureza', width: 12 },
        { header: 'Valor (R$)', key: 'valor', width: 16 },
      ];
      (apontamentos || []).sort((a: any, b: any) => a.colaboradorNome.localeCompare(b.colaboradorNome)).forEach((a: any) => {
        wsDetalhe.addRow({
          nome: a.colaboradorNome,
          tipo: TIPO_LABELS[a.tipo] || a.tipo,
          descricao: a.descricao || '-',
          natureza: a.natureza === 'desconto' ? 'Desconto' : 'Provento',
          valor: Number(a.valor),
        });
      });
      wsDetalhe.getRow(1).font = { bold: true };
      wsDetalhe.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      wsDetalhe.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Sheet 3: Totais por Colaborador
      const wsTotais = wb.addWorksheet('Totais por Colaborador');
      wsTotais.columns = [
        { header: 'Colaborador', key: 'nome', width: 35 },
        { header: 'VT (R$)', key: 'vt', width: 14 },
        { header: 'Academia (R$)', key: 'academia', width: 14 },
        { header: 'Comissões (R$)', key: 'comissao', width: 14 },
        { header: 'Reajustes (R$)', key: 'reajuste', width: 14 },
        { header: 'Outros (R$)', key: 'outros', width: 14 },
        { header: 'Total (R$)', key: 'total', width: 16 },
      ];
      const colabMap: Record<number, any> = {};
      (apontamentos || []).forEach((a: any) => {
        if (!colabMap[a.colaboradorId]) colabMap[a.colaboradorId] = { nome: a.colaboradorNome, vt: 0, academia: 0, comissao: 0, reajuste: 0, outros: 0, total: 0 };
        const val = Number(a.valor);
        colabMap[a.colaboradorId].total += val;
        if (a.tipo === 'vale_transporte') colabMap[a.colaboradorId].vt += val;
        else if (a.tipo === 'academia') colabMap[a.colaboradorId].academia += val;
        else if (a.tipo === 'comissao') colabMap[a.colaboradorId].comissao += val;
        else if (a.tipo.startsWith('reajuste')) colabMap[a.colaboradorId].reajuste += val;
        else colabMap[a.colaboradorId].outros += val;
      });
      Object.values(colabMap).sort((a: any, b: any) => a.nome.localeCompare(b.nome)).forEach((c: any) => {
        wsTotais.addRow(c);
      });
      const totaisRow = wsTotais.addRow({
        nome: 'TOTAL GERAL',
        vt: Object.values(colabMap).reduce((s: number, c: any) => s + c.vt, 0),
        academia: Object.values(colabMap).reduce((s: number, c: any) => s + c.academia, 0),
        comissao: Object.values(colabMap).reduce((s: number, c: any) => s + c.comissao, 0),
        reajuste: Object.values(colabMap).reduce((s: number, c: any) => s + c.reajuste, 0),
        outros: Object.values(colabMap).reduce((s: number, c: any) => s + c.outros, 0),
        total: totalGeral,
      });
      totaisRow.font = { bold: true };
      wsTotais.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      wsTotais.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };

      const fileName = `apontamentos-folha-${MESES[mesRef-1]}-${anoRef}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err: any) {
      console.error('[Apontamentos Excel Export Error]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ---- APONTAMENTOS DA FOLHA EXPORT (PDF via HTML) ----
  app.get('/api/apontamentos-folha/pdf', async (req: any, res: any) => {
    try {
      const dbMod = await import('../db');
      const mesRef = parseInt(req.query.mes) || (new Date().getMonth() + 1);
      const anoRef = parseInt(req.query.ano) || new Date().getFullYear();
      const apontamentos = await dbMod.listApontamentosFolha(mesRef, anoRef);

      const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const TIPO_LABELS: Record<string, string> = {
        vale_transporte: 'Vale Transporte', academia: 'Academia', comissao: 'Comissão',
        reajuste_sindical: 'Reajuste Sindical', reajuste_dois_anos: 'Reajuste 2 Anos',
        pensao_alimenticia: 'Pensão Alimentícia', contribuicao_assistencial: 'Contribuição Assist.',
        banco_horas: 'Banco de Horas', outro: 'Outro',
      };
      const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
      const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

      // Aggregate data
      const tipoMap: Record<string, { qtd: number; total: number }> = {};
      const colabMap: Record<number, { nome: string; items: any[]; total: number }> = {};
      (apontamentos || []).forEach((a: any) => {
        if (!tipoMap[a.tipo]) tipoMap[a.tipo] = { qtd: 0, total: 0 };
        tipoMap[a.tipo].qtd++;
        tipoMap[a.tipo].total += Number(a.valor);
        if (!colabMap[a.colaboradorId]) colabMap[a.colaboradorId] = { nome: a.colaboradorNome, items: [], total: 0 };
        colabMap[a.colaboradorId].items.push(a);
        colabMap[a.colaboradorId].total += Number(a.valor);
      });
      const totalGeral = Object.values(tipoMap).reduce((s, d) => s + d.total, 0);
      const colabs = Object.values(colabMap).sort((a, b) => a.nome.localeCompare(b.nome));

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a2e; font-size: 12px; }
  h1 { color: #1e3a5f; font-size: 20px; border-bottom: 3px solid #3B82F6; padding-bottom: 8px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 11px; margin-bottom: 20px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; border-left: 4px solid; }
  .kpi-card.blue { border-left-color: #3B82F6; } .kpi-card.green { border-left-color: #10B981; } .kpi-card.purple { border-left-color: #8B5CF6; }
  .kpi-label { font-size: 9px; text-transform: uppercase; color: #6b7280; }
  .kpi-value { font-size: 20px; font-weight: 700; margin: 2px 0; }
  h2 { font-size: 14px; color: #1e3a5f; margin-top: 24px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #1e3a5f; color: white; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
  td { padding: 5px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
  tr:nth-child(even) { background: #f8fafc; }
  .total-row { background: #e8f0fe !important; font-weight: 700; }
  .right { text-align: right; }
  .colab-header { background: #f1f5f9; font-weight: 600; font-size: 12px; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #9ca3af; text-align: center; }
  @media print { body { margin: 20px; } }
</style></head>
<body>
  <h1>Apontamentos da Folha — ${MESES[mesRef-1]}/${anoRef}</h1>
  <div class="subtitle">Evox Fiscal — Gente & Gestão | Gerado em ${dataHora}</div>

  <div class="kpi-grid">
    <div class="kpi-card blue"><div class="kpi-label">Total Registros</div><div class="kpi-value">${(apontamentos || []).length}</div></div>
    <div class="kpi-card green"><div class="kpi-label">Valor Total</div><div class="kpi-value" style="font-size:16px">${fmtCurrency(totalGeral)}</div></div>
    <div class="kpi-card purple"><div class="kpi-label">Colaboradores</div><div class="kpi-value">${colabs.length}</div></div>
  </div>

  <h2>Resumo por Tipo</h2>
  <table>
    <thead><tr><th>Tipo</th><th class="right">Qtd.</th><th class="right">Valor Total</th></tr></thead>
    <tbody>
      ${Object.entries(tipoMap).map(([tipo, data]) => `<tr><td>${TIPO_LABELS[tipo] || tipo}</td><td class="right">${data.qtd}</td><td class="right">${fmtCurrency(data.total)}</td></tr>`).join('')}
      <tr class="total-row"><td>TOTAL</td><td class="right">${(apontamentos || []).length}</td><td class="right">${fmtCurrency(totalGeral)}</td></tr>
    </tbody>
  </table>

  <h2>Detalhamento por Colaborador</h2>
  ${colabs.map(c => `
    <table>
      <thead><tr class="colab-header"><th colspan="3">${c.nome} — Total: ${fmtCurrency(c.total)}</th></tr>
      <tr><th>Tipo</th><th>Descrição</th><th class="right">Valor</th></tr></thead>
      <tbody>
        ${c.items.map((i: any) => `<tr><td>${TIPO_LABELS[i.tipo] || i.tipo}</td><td>${i.descricao || '-'}</td><td class="right">${fmtCurrency(Number(i.valor))}</td></tr>`).join('')}
      </tbody>
    </table>
  `).join('')}

  <div class="footer">Documento gerado automaticamente pelo sistema Evox Fiscal — Gente & Gestão | Para uso contábil</div>
</body></html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="apontamentos-folha-${MESES[mesRef-1]}-${anoRef}.html"`);
      res.send(html);
    } catch (err: any) {
      console.error('[Apontamentos PDF Export Error]', err);
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
