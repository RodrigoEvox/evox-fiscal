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

async function runExperienciaExpirationCheck() {
  try {
    const db = await import('../db');
    const { notifyOwner } = await import('./notification');
    const colabs = await db.listColaboradores();
    const hoje = new Date();
    const alertas: { nome: string; periodo: string; dataFim: string; diasRestantes: number }[] = [];

    for (const c of colabs as any[]) {
      if (c.status === 'desligado') continue;

      // Check periodo 1
      if (c.periodoExperiencia1Fim) {
        const fim = new Date(c.periodoExperiencia1Fim + 'T00:00:00');
        const diff = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 15) {
          alertas.push({
            nome: c.nomeCompleto || c.nome || 'Colaborador',
            periodo: '1º Período',
            dataFim: c.periodoExperiencia1Fim,
            diasRestantes: diff,
          });
        }
      }
      // Check periodo 2
      if (c.periodoExperiencia2Fim) {
        const fim = new Date(c.periodoExperiencia2Fim + 'T00:00:00');
        const diff = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 15) {
          alertas.push({
            nome: c.nomeCompleto || c.nome || 'Colaborador',
            periodo: '2º Período',
            dataFim: c.periodoExperiencia2Fim,
            diasRestantes: diff,
          });
        }
      }
    }

    if (alertas.length > 0) {
      // Create in-app notifications
      const allUsers = await db.listUsers();
      for (const alerta of alertas) {
        const titulo = `Experiência Vencendo: ${alerta.nome}`;
        const mensagem = `O ${alerta.periodo} de experiência de ${alerta.nome} vence em ${alerta.diasRestantes} dia(s) (${alerta.dataFim}). Tome as providências necessárias.`;
        for (const u of allUsers) {
          // Avoid duplicate notifications - check if already notified today
          await db.createNotificacao({
            usuarioId: u.id,
            tipo: 'geral' as any,
            titulo,
            mensagem,
            lida: false,
          });
        }
      }

      // Also notify owner
      const lista = alertas.map(a => `• ${a.nome} - ${a.periodo}: vence em ${a.diasRestantes} dia(s) (${a.dataFim})`).join('\n');
      await notifyOwner({
        title: `⚠️ ${alertas.length} período(s) de experiência vencendo nos próximos 15 dias`,
        content: `Os seguintes períodos de experiência estão próximos do vencimento:\n\n${lista}\n\nAcesse o módulo Colaboradores no GEG para tomar as providências.`,
      });

      console.log(`[Experiencia Scheduler] Found ${alertas.length} expiring experience period(s)`);
    }
  } catch (err) {
    console.error('[Experiencia Scheduler Error]', err);
  }
}

async function checkCCTExpiration() {
  try {
    const db = await import('../db');
    const { notifyOwner } = await import('./notification');
    const ccts = await db.listCCTs();
    const hoje = new Date();
    for (const cct of ccts) {
      if (!cct.vigenciaFim) continue;
      const fim = new Date(cct.vigenciaFim + 'T00:00:00');
      const diffDias = Math.floor((hoje.getTime() - fim.getTime()) / (1000 * 60 * 60 * 24));
      let alerta = '';
      if (diffDias >= 5 && diffDias < 6) alerta = '5 dias';
      else if (diffDias >= 15 && diffDias < 16) alerta = '15 dias';
      else if (diffDias >= 30 && diffDias < 31) alerta = '30 dias';
      if (alerta) {
        const titulo = `CCT Vencida h\u00e1 ${alerta}: ${cct.sindicato || 'Sem sindicato'}`;
        const conteudo = `A Conven\u00e7\u00e3o Coletiva de Trabalho "${cct.sindicato || 'N/A'}" (Vig\u00eancia: ${cct.vigenciaInicio || '?'} a ${cct.vigenciaFim || '?'}) est\u00e1 vencida h\u00e1 ${alerta}. Providencie a renova\u00e7\u00e3o.`;
        await notifyOwner({ title: titulo, content: conteudo });
        // Also create in-app notification for all users
        try {
          const users = await db.listUsers();
          for (const u of users) {
            await db.createNotificacao({ userId: u.id, tipo: 'cct_vencimento', titulo, mensagem: conteudo });
          }
        } catch (e) { console.error('[CCT Notif] Error creating in-app notifications', e); }
        console.log(`[CCT Scheduler] Alert sent: ${titulo}`);
      }
    }
  } catch (err) {
    console.error('[CCT Scheduler Error]', err);
  }
}

async function runBibliotecaEmprestimoAlerts() {
  try {
    const bibDb = await import('../dbBiblioteca');
    const { notifyOwner } = await import('./notification');
    const db = await import('../db');

    // 1. Mark overdue loans as 'atrasado'
    const marcados = await bibDb.marcarEmprestimosAtrasados();
    if (marcados > 0) {
      console.log(`[Biblioteca Scheduler] ${marcados} empréstimo(s) marcado(s) como atrasado(s)`);
    }

    // 2. Get the notification threshold from policies (default: 3 days)
    const diasAvisoStr = await bibDb.getPoliticaValor('dias_aviso_vencimento');
    const diasAviso = parseInt(diasAvisoStr || '3', 10);

    // 3. Notify about loans expiring in 1 day (tomorrow)
    const venceAmanha = await bibDb.getEmprestimosVencendoEm(1);
    for (const emp of venceAmanha) {
      const tituloLivro = await bibDb.getLivroTitulo(emp.livroId);
      await notifyOwner({
        title: `📚 Biblioteca: Empréstimo vence AMANHÃ`,
        content: `O colaborador ${emp.colaboradorNome} tem o livro "${tituloLivro}" com devolução prevista para amanhã (${emp.dataPrevistaDevolucao}). Renovações: ${emp.renovacoes}/${emp.limiteRenovacoes}.`,
      });
      try {
        const users = await db.listUsers();
        for (const u of users) {
          await db.createNotificacao({
            usuarioId: u.id,
            tipo: 'biblioteca_vencimento',
            titulo: `Empréstimo vence amanhã: ${tituloLivro}`,
            mensagem: `${emp.colaboradorNome} deve devolver "${tituloLivro}" amanhã (${emp.dataPrevistaDevolucao}).`,
            lida: 0,
          } as any);
        }
      } catch (e) { console.error('[Bib Notif] Error creating in-app notifications', e); }
    }

    // 4. Notify about loans expiring in N days (configurable)
    if (diasAviso > 1) {
      const venceEmNDias = await bibDb.getEmprestimosVencendoEm(diasAviso);
      for (const emp of venceEmNDias) {
        const tituloLivro = await bibDb.getLivroTitulo(emp.livroId);
        await notifyOwner({
          title: `📚 Biblioteca: Empréstimo vence em ${diasAviso} dias`,
          content: `O colaborador ${emp.colaboradorNome} tem o livro "${tituloLivro}" com devolução prevista para ${emp.dataPrevistaDevolucao} (${diasAviso} dias). Renovações: ${emp.renovacoes}/${emp.limiteRenovacoes}.`,
        });
      }
    }

    // 5. Notify about overdue loans (atrasados)
    const atrasados = await bibDb.getEmprestimosAtrasados();
    if (atrasados.length > 0) {
      const detalhes = [];
      for (const emp of atrasados) {
        const tituloLivro = await bibDb.getLivroTitulo(emp.livroId);
        const diasAtraso = Math.floor((Date.now() - new Date(emp.dataPrevistaDevolucao + 'T00:00:00').getTime()) / 86400000);
        detalhes.push(`• ${emp.colaboradorNome} - "${tituloLivro}" (${diasAtraso} dia(s) de atraso)`);
      }
      await notifyOwner({
        title: `📚 Biblioteca: ${atrasados.length} empréstimo(s) em atraso`,
        content: `Os seguintes empréstimos estão com devolução em atraso:\n\n${detalhes.join('\n')}`,
      });
    }

    const total = venceAmanha.length + (diasAviso > 1 ? (await bibDb.getEmprestimosVencendoEm(diasAviso)).length : 0) + atrasados.length;
    if (total > 0) {
      console.log(`[Biblioteca Scheduler] Sent ${total} notification(s): ${venceAmanha.length} vencendo amanhã, ${atrasados.length} atrasados`);
    }
  } catch (err) {
    console.error('[Biblioteca Scheduler Error]', err);
  }
}

function startScheduledJobs() {
  // Run birthday emails daily at 8:00 AM (check every hour)
  const HOUR_MS = 60 * 60 * 1000;
  let lastBirthdayRun = '';
  let lastContractRun = '';
  let lastReajusteRun = '';
  let lastExperienciaRun = '';
  let lastCCTRun = '';
  let lastBibliotecaRun = '';

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

    // Run experiencia expiration check once per day (after 9 AM)
    if (now.getHours() >= 9 && lastExperienciaRun !== todayKey) {
      lastExperienciaRun = todayKey;
      await runExperienciaExpirationCheck();
    }

    // Run CCT expiration check once per day (after 9 AM)
    if (now.getHours() >= 9 && lastCCTRun !== todayKey) {
      lastCCTRun = todayKey;
      await checkCCTExpiration();
    }

    // Run biblioteca loan alerts once per day (after 8 AM)
    if (now.getHours() >= 8 && lastBibliotecaRun !== todayKey) {
      lastBibliotecaRun = todayKey;
      await runBibliotecaEmprestimoAlerts();
    }
  }, HOUR_MS);

  // Also run once on startup after a short delay
  setTimeout(async () => {
    await runDailyBirthdayEmails();
    await runAdvanceBirthdayNotifications();
    await runContractExpirationCheck();
    await runReajusteDoisAnosCheck();
    await runExperienciaExpirationCheck();
    await checkCCTExpiration();
    await runBibliotecaEmprestimoAlerts();
  }, 10000);

  console.log('[Scheduler] Birthday emails, contract checks, reajuste alerts, experiencia checks, CCT expiration checks, and biblioteca loan alerts scheduled');
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
  // ---- BI INDICADORES PDF ----
  app.get('/api/bi-rh/pdf', async (req: any, res: any) => {
    try {
      const { createPDF, addHeader, addKPIs, addSectionTitle, addTable, addFooter, fmtCurrency } = await import('../pdfGenerator');
      const db = await import('../db');
      const dashboardData = await db.getDashboardGEG();
      const allColabs = await db.listColaboradores();
      const allMetas = await db.listMetasIndividuais();
      const d = dashboardData as any;
      const colabList = (allColabs || []) as any[];
      const metasList = (allMetas || []) as any[];

      const totalColabs = d.totalAtivos + d.totalInativos;
      const taxaTurnover = totalColabs > 0
        ? ((d.turnoverMensal || []).reduce((s: number, m: any) => s + m.desligamentos, 0) / totalColabs * 100).toFixed(1)
        : '0.0';
      const totalAbsenteismo = (d.absenteismoMensal || []).reduce((s: number, m: any) => s + m.diasAfastamento, 0);
      const custoMedio = d.totalAtivos > 0 ? (d.custoSalarialTotal / d.totalAtivos) : 0;

      const doc = createPDF();
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        const pdfBuf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="bi-indicadores-rh-${new Date().toISOString().slice(0,10)}.pdf"`);
        res.send(pdfBuf);
      });

      const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
      addHeader(doc, 'BI — Indicadores de RH', `Evox Fiscal — Gente & Gestão | Gerado em ${dataHora}`);

      addKPIs(doc, [
        { label: 'Colaboradores Ativos', value: String(d.totalAtivos), sub: `${d.totalInativos} inativos`, color: '#3B82F6' },
        { label: 'Taxa Turnover', value: `${taxaTurnover}%`, sub: 'Últimos 12 meses', color: '#F59E0B' },
        { label: 'Dias Absenteísmo', value: String(totalAbsenteismo), sub: 'Acumulado', color: '#EF4444' },
        { label: 'Custo Médio/Colab', value: fmtCurrency(custoMedio), sub: `Total: ${fmtCurrency(d.custoSalarialTotal)}`, color: '#10B981' },
      ]);

      // Headcount por Setor
      addSectionTitle(doc, 'Headcount por Setor');
      const headcountEntries = Object.entries(d.headcountPorSetor || {}).sort((a: any, b: any) => b[1] - a[1]);
      addTable(doc,
        [{ header: 'Setor', key: 'setor', width: 3 }, { header: 'Quantidade', key: 'qtd', align: 'right', width: 1 }, { header: '% Total', key: 'pct', align: 'right', width: 1 }],
        [...headcountEntries.map(([setor, count]: any) => ({
          setor, qtd: count, pct: d.totalAtivos > 0 ? ((count / d.totalAtivos) * 100).toFixed(1) + '%' : '0%'
        })), { setor: 'Total', qtd: d.totalAtivos, pct: '100%', isTotal: true }]
      );

      // Custo Salarial por Setor
      addSectionTitle(doc, 'Custo Salarial por Setor');
      const custoEntries = Object.entries(d.custoPorSetor || {}).sort((a: any, b: any) => b[1] - a[1]);
      addTable(doc,
        [{ header: 'Setor', key: 'setor', width: 3 }, { header: 'Valor (R$)', key: 'valor', align: 'right', width: 2 }],
        [...custoEntries.map(([setor, valor]: any) => ({ setor, valor: fmtCurrency(valor) })),
         { setor: 'Total', valor: fmtCurrency(d.custoSalarialTotal), isTotal: true }]
      );

      // Turnover Mensal
      addSectionTitle(doc, 'Turnover Mensal (Últimos 12 Meses)');
      const turnoverData = (d.turnoverMensal || []).slice(-12);
      addTable(doc,
        [{ header: 'Mês', key: 'mes', width: 2 }, { header: 'Admissões', key: 'adm', align: 'right', width: 1 }, { header: 'Desligamentos', key: 'desl', align: 'right', width: 1 }, { header: 'Saldo', key: 'saldo', align: 'right', width: 1 }],
        turnoverData.map((m: any) => ({
          mes: new Date(m.mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          adm: m.admissoes, desl: m.desligamentos, saldo: m.admissoes - m.desligamentos,
        }))
      );

      // Distribuição por Status
      addSectionTitle(doc, 'Distribuição por Status');
      const statusLabels: Record<string, string> = {
        ativo: 'Ativo', inativo: 'Inativo', afastado: 'Afastado', licenca: 'Licença',
        atestado: 'Atestado', desligado: 'Desligado', ferias: 'Férias',
        experiencia: 'Experiência', aviso_previo: 'Aviso Prévio',
      };
      const statusCounts: Record<string, number> = {};
      colabList.forEach((c: any) => {
        const st = c.statusColaborador || 'ativo';
        statusCounts[st] = (statusCounts[st] || 0) + 1;
      });
      addTable(doc,
        [{ header: 'Status', key: 'status', width: 2 }, { header: 'Quantidade', key: 'qtd', align: 'right', width: 1 }, { header: '% Total', key: 'pct', align: 'right', width: 1 }],
        Object.entries(statusCounts).filter(([_, v]) => v > 0).map(([k, v]) => ({
          status: statusLabels[k] || k, qtd: v, pct: colabList.length > 0 ? ((v / colabList.length) * 100).toFixed(1) + '%' : '0%'
        }))
      );

      // Metas & KPIs
      addSectionTitle(doc, 'Metas & KPIs');
      const concluidas = metasList.filter((m: any) => m.status === 'concluida').length;
      const emAndamento = metasList.filter((m: any) => m.status === 'em_andamento').length;
      const atrasadas = metasList.filter((m: any) => {
        if (m.status === 'concluida' || m.status === 'cancelada') return false;
        return m.prazo && new Date(m.prazo) < new Date();
      }).length;
      const taxa = metasList.length > 0 ? Math.round((concluidas / metasList.length) * 100) : 0;
      addTable(doc,
        [{ header: 'Indicador', key: 'ind', width: 3 }, { header: 'Valor', key: 'val', align: 'right', width: 1 }],
        [
          { ind: 'Total de Metas', val: metasList.length },
          { ind: 'Concluídas', val: concluidas },
          { ind: 'Em Andamento', val: emAndamento },
          { ind: 'Atrasadas', val: atrasadas },
          { ind: 'Taxa de Conclusão', val: `${taxa}%` },
        ]
      );

      addFooter(doc);
      doc.end();
    } catch (err: any) {
      console.error('[BI PDF Export Error]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ---- VISÃO ANALÍTICA PDF ----
  app.get('/api/relatorios-rh/pdf', async (req: any, res: any) => {
    try {
      const { createPDF, addHeader, addKPIs, addSectionTitle, addTable, addFooter, fmtCurrency, fmtDate } = await import('../pdfGenerator');
      const db = await import('../db');
      const allColabs = await db.listColaboradores();
      const allAtestados = await db.listAtestadosLicencas();
      const allSetores = await db.listSetores();

      const colabList = (allColabs || []) as any[];
      const atestadosList = (allAtestados || []) as any[];
      const setoresList = (allSetores || []) as any[];

      const efetivos = colabList.filter(c => {
        const st = c.statusColaborador || (c.ativo === false ? 'desligado' : 'ativo');
        return st !== 'desligado' && st !== 'inativo';
      });
      const desligados = colabList.filter(c => {
        const st = c.statusColaborador || (c.ativo === false ? 'desligado' : 'ativo');
        return st === 'desligado' || st === 'inativo';
      });
      const totalHeadcount = efetivos.length;

      const hoje = new Date();
      const umAnoAtras = new Date(hoje);
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      const desligados12m = desligados.filter(c => {
        if (!c.dataDesligamento) return false;
        return new Date(c.dataDesligamento + 'T12:00:00') >= umAnoAtras;
      });
      const admitidos12m = colabList.filter(c => new Date(c.dataAdmissao + 'T12:00:00') >= umAnoAtras);
      const turnoverRate = totalHeadcount > 0 ? ((desligados12m.length / ((totalHeadcount + desligados12m.length) / 2)) * 100).toFixed(1) : '0.0';

      const totalDiasAfastamento = atestadosList.reduce((sum: number, a: any) => sum + (a.diasAfastamento || 0), 0);
      const absenteeismRate = totalHeadcount > 0 ? ((totalDiasAfastamento / (totalHeadcount * 22 * 12)) * 100).toFixed(2) : '0.00';

      const custoSalarialTotal = efetivos.reduce((sum: number, c: any) => {
        return sum + Number(c.salarioBase || 0) + Number(c.comissoes || 0) + Number(c.adicionais || 0);
      }, 0);
      const salarioMedio = totalHeadcount > 0 ? custoSalarialTotal / totalHeadcount : 0;

      const doc = createPDF();
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        const pdfBuf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="visao-analitica-rh-${new Date().toISOString().slice(0,10)}.pdf"`);
        res.send(pdfBuf);
      });

      const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
      addHeader(doc, 'Visão Analítica — Relatórios RH', `Evox Fiscal — Gente & Gestão | Gerado em ${dataHora}`);

      addKPIs(doc, [
        { label: 'Headcount Efetivo', value: String(totalHeadcount), sub: `${desligados.length} desligados/inativos`, color: '#3B82F6' },
        { label: 'Turnover (12m)', value: `${turnoverRate}%`, sub: `${desligados12m.length} desligados`, color: Number(turnoverRate) > 10 ? '#EF4444' : '#10B981' },
        { label: 'Absenteísmo', value: `${absenteeismRate}%`, sub: `${totalDiasAfastamento} dias afastamento`, color: Number(absenteeismRate) > 3 ? '#F59E0B' : '#10B981' },
        { label: 'Custo Salarial', value: fmtCurrency(custoSalarialTotal), sub: `Média: ${fmtCurrency(salarioMedio)}`, color: '#8B5CF6' },
      ]);

      // Distribuição por Status
      addSectionTitle(doc, 'Distribuição por Status');
      const statusLabels: Record<string, string> = {
        ativo: 'Ativo', inativo: 'Inativo', afastado: 'Afastado', licenca: 'Licença',
        atestado: 'Atestado', desligado: 'Desligado', ferias: 'Férias',
        experiencia: 'Experiência', aviso_previo: 'Aviso Prévio',
      };
      const statusCounts: Record<string, number> = {};
      colabList.forEach((c: any) => {
        const st = c.statusColaborador || (c.ativo === false ? 'desligado' : 'ativo');
        statusCounts[st] = (statusCounts[st] || 0) + 1;
      });
      addTable(doc,
        [{ header: 'Status', key: 'status', width: 2 }, { header: 'Quantidade', key: 'qtd', align: 'right', width: 1 }, { header: '% Total', key: 'pct', align: 'right', width: 1 }],
        Object.entries(statusCounts).filter(([_, v]) => v > 0).map(([k, v]) => ({
          status: statusLabels[k] || k, qtd: v, pct: colabList.length > 0 ? ((v / colabList.length) * 100).toFixed(1) + '%' : '0%'
        }))
      );

      // Resumo por Setor
      addSectionTitle(doc, 'Resumo por Setor');
      const setorMap = new Map<number, { nome: string; count: number; custo: number; atestados: number }>();
      efetivos.forEach((c: any) => {
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
      addTable(doc,
        [
          { header: 'Setor', key: 'setor', width: 3 },
          { header: 'Headcount', key: 'count', align: 'right', width: 1 },
          { header: '% Total', key: 'pct', align: 'right', width: 1 },
          { header: 'Custo Salarial', key: 'custo', align: 'right', width: 2 },
          { header: 'Dias Afastamento', key: 'atestados', align: 'right', width: 1 },
        ],
        [...porSetor.map(([_, data]) => ({
          setor: data.nome, count: data.count,
          pct: totalHeadcount > 0 ? ((data.count / totalHeadcount) * 100).toFixed(1) + '%' : '0%',
          custo: fmtCurrency(data.custo), atestados: `${data.atestados}d`,
        })),
        { setor: 'Total', count: totalHeadcount, pct: '100%', custo: fmtCurrency(custoSalarialTotal), atestados: `${totalDiasAfastamento}d`, isTotal: true }]
      );

      // Distribuição por Nível Hierárquico
      addSectionTitle(doc, 'Distribuição por Nível Hierárquico');
      const nivelLabels: Record<string, string> = {
        estagiario: 'Estagiário', auxiliar: 'Auxiliar', assistente: 'Assistente',
        analista_jr: 'Analista Jr', analista_pl: 'Analista Pl', analista_sr: 'Analista Sr',
        coordenador: 'Coordenador', supervisor: 'Supervisor', gerente: 'Gerente', diretor: 'Diretor',
      };
      const nivelMap = new Map<string, { count: number; custo: number }>();
      efetivos.forEach((c: any) => {
        const nivel = c.nivelHierarquico || 'sem_nivel';
        const existing = nivelMap.get(nivel) || { count: 0, custo: 0 };
        existing.count += 1;
        existing.custo += Number(c.salarioBase || 0);
        nivelMap.set(nivel, existing);
      });
      addTable(doc,
        [{ header: 'Nível', key: 'nivel', width: 2 }, { header: 'Quantidade', key: 'count', align: 'right', width: 1 }, { header: 'Custo Salarial', key: 'custo', align: 'right', width: 2 }],
        Array.from(nivelMap.entries()).sort((a, b) => b[1].custo - a[1].custo).map(([k, v]) => ({
          nivel: nivelLabels[k] || k, count: v.count, custo: fmtCurrency(v.custo),
        }))
      );

      // Tipo de Contrato
      addSectionTitle(doc, 'Tipo de Contrato');
      const contratoMap = new Map<string, number>();
      efetivos.forEach((c: any) => {
        const tipo = c.tipoContrato || 'clt';
        contratoMap.set(tipo, (contratoMap.get(tipo) || 0) + 1);
      });
      addTable(doc,
        [{ header: 'Tipo', key: 'tipo', width: 2 }, { header: 'Quantidade', key: 'qtd', align: 'right', width: 1 }, { header: '% Total', key: 'pct', align: 'right', width: 1 }],
        Array.from(contratoMap.entries()).map(([tipo, count]) => ({
          tipo: tipo === 'clt' ? 'CLT' : tipo === 'pj' ? 'PJ' : tipo,
          qtd: count,
          pct: totalHeadcount > 0 ? ((count / totalHeadcount) * 100).toFixed(1) + '%' : '0%',
        }))
      );

      // Admissões Recentes
      addSectionTitle(doc, 'Admissões Recentes (Últimos 12 Meses)');
      const recentAdm = [...admitidos12m].sort((a, b) => (b.dataAdmissao || '').localeCompare(a.dataAdmissao || '')).slice(0, 10);
      addTable(doc,
        [{ header: 'Colaborador', key: 'nome', width: 3 }, { header: 'Data Admissão', key: 'data', align: 'right', width: 1 }],
        recentAdm.map((c: any) => ({ nome: c.nomeCompleto, data: fmtDate(c.dataAdmissao) }))
      );

      // Desligamentos Recentes
      addSectionTitle(doc, 'Desligamentos Recentes (Últimos 12 Meses)');
      const recentDesl = [...desligados12m].sort((a, b) => (b.dataDesligamento || '').localeCompare(a.dataDesligamento || '')).slice(0, 10);
      addTable(doc,
        [{ header: 'Colaborador', key: 'nome', width: 3 }, { header: 'Data Desligamento', key: 'data', align: 'right', width: 1 }],
        recentDesl.map((c: any) => ({ nome: c.nomeCompleto, data: fmtDate(c.dataDesligamento) }))
      );

      // Turnover Mensal
      addSectionTitle(doc, 'Turnover Mensal (Últimos 12 Meses)');
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const turnoverMensal = [];
      for (let i = 11; i >= 0; i--) {
        const dt = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        const label = `${meses[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`;
        const adm = colabList.filter((c: any) => c.dataAdmissao?.startsWith(mesStr)).length;
        const desl = desligados.filter((c: any) => c.dataDesligamento?.startsWith(mesStr)).length;
        turnoverMensal.push({ mes: label, admissoes: adm, desligamentos: desl });
      }
      addTable(doc,
        [{ header: 'Mês', key: 'mes', width: 2 }, { header: 'Admissões', key: 'adm', align: 'right', width: 1 }, { header: 'Desligamentos', key: 'desl', align: 'right', width: 1 }],
        turnoverMensal
      );

      // Absenteísmo Mensal
      addSectionTitle(doc, 'Absenteísmo Mensal (Últimos 12 Meses)');
      const absenteismoMensal = [];
      for (let i = 11; i >= 0; i--) {
        const dt = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        const label = `${meses[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`;
        const atMes = atestadosList.filter((a: any) => a.dataInicio?.startsWith(mesStr));
        const dias = atMes.reduce((s: number, a: any) => s + (a.diasAfastamento || 0), 0);
        absenteismoMensal.push({ mes: label, atestados: atMes.length, dias });
      }
      addTable(doc,
        [{ header: 'Mês', key: 'mes', width: 2 }, { header: 'Atestados', key: 'atestados', align: 'right', width: 1 }, { header: 'Dias Afastamento', key: 'dias', align: 'right', width: 1 }],
        absenteismoMensal
      );

      addFooter(doc);
      doc.end();
    } catch (err: any) {
      console.error('[Visão Analítica PDF Export Error]', err);
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

  // ---- COLABORADORES PDF EXPORT ----
  app.get('/api/colaboradores/export-pdf', async (req: any, res: any) => {
    try {
      const { createPDFLandscape, addHeaderLandscape, addSectionTitleLandscape, addTableLandscape, addFooterLandscape, fmtDate, fmtCurrency } = await import('../pdfGenerator');
      const db = await import('../db');
      const allColabs = await db.listColaboradores();
      const setores = await db.listSetores();
      const setorMap = new Map(setores.map((s: any) => [s.id, s.nome]));
      const niveisCargo = await db.listNiveisCargo();
      const academiaList = await db.listAcademiaBeneficio();
      const academiaColabIds = new Set(academiaList.filter((a: any) => a.ativo).map((a: any) => a.colaboradorId));

      // Build cargo info map from niveisCargo
      const cargoInfoMap = new Map<string, { comissionado: boolean; cargoConfianca: boolean }>();
      niveisCargo.forEach((nc: any) => {
        const key = `${nc.cargo}__${nc.setorId || 0}`;
        cargoInfoMap.set(key, { comissionado: !!nc.comissionado, cargoConfianca: !!nc.cargoConfianca });
        if (!cargoInfoMap.has(`${nc.cargo}__fallback`)) {
          cargoInfoMap.set(`${nc.cargo}__fallback`, { comissionado: !!nc.comissionado, cargoConfianca: !!nc.cargoConfianca });
        }
      });
      const getCargoInfo = (c: any) => cargoInfoMap.get(`${c.cargo}__${c.setorId || 0}`) || cargoInfoMap.get(`${c.cargo}__fallback`) || { comissionado: false, cargoConfianca: false };

      // Apply filters
      let filtered = [...allColabs];
      const { status, cargo, setor, local, vt, nivel, contrato, academia, cargoConfianca, comissionado, search } = req.query;
      if (status) filtered = filtered.filter((c: any) => (c.statusColaborador || 'ativo') === status);
      if (cargo) filtered = filtered.filter((c: any) => c.cargo === cargo);
      if (setor) filtered = filtered.filter((c: any) => String(c.setorId) === setor);
      if (local) filtered = filtered.filter((c: any) => c.localTrabalho === local);
      if (vt === 'sim') filtered = filtered.filter((c: any) => !!c.valeTransporte);
      if (vt === 'nao') filtered = filtered.filter((c: any) => !c.valeTransporte);
      if (nivel) filtered = filtered.filter((c: any) => c.nivelHierarquico === nivel);
      if (contrato) filtered = filtered.filter((c: any) => c.tipoContrato === contrato);
      if (academia === 'sim') filtered = filtered.filter((c: any) => academiaColabIds.has(c.id));
      if (academia === 'nao') filtered = filtered.filter((c: any) => !academiaColabIds.has(c.id));
      if (cargoConfianca === 'sim') filtered = filtered.filter((c: any) => getCargoInfo(c).cargoConfianca);
      if (cargoConfianca === 'nao') filtered = filtered.filter((c: any) => !getCargoInfo(c).cargoConfianca);
      if (comissionado === 'sim') filtered = filtered.filter((c: any) => getCargoInfo(c).comissionado);
      if (comissionado === 'nao') filtered = filtered.filter((c: any) => !getCargoInfo(c).comissionado);
      if (search) {
        const q = (search as string).toLowerCase();
        filtered = filtered.filter((c: any) => c.nomeCompleto?.toLowerCase().includes(q) || c.cpf?.includes(q) || c.cargo?.toLowerCase().includes(q));
      }

      const GRAU_LABELS: Record<string, string> = {
        fundamental_incompleto: 'Fund. Inc.', fundamental_completo: 'Fund. Comp.',
        medio_incompleto: 'M\u00e9dio Inc.', medio_completo: 'M\u00e9dio Comp.',
        superior_incompleto: 'Sup. Inc.', superior_completo: 'Sup. Comp.',
        pos_graduacao: 'P\u00f3s-Grad.', mestrado: 'Mestrado', doutorado: 'Doutorado',
      };

      const NIVEL_LABELS: Record<string, string> = {
        estagiario: 'Estag.', auxiliar: 'Auxiliar', assistente: 'Assist.',
        analista_jr: 'An. Jr', analista_pl: 'An. Pl', analista_sr: 'An. Sr',
        coordenador: 'Coord.', supervisor: 'Superv.', gerente: 'Gerente', diretor: 'Diretor',
      };

      const doc = createPDFLandscape();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="colaboradores-${new Date().toISOString().slice(0,10)}.pdf"`);
      doc.pipe(res);

      const filtersApplied: string[] = [];
      if (status) filtersApplied.push(`Status: ${status}`);
      if (cargo) filtersApplied.push(`Cargo: ${cargo}`);
      if (setor) filtersApplied.push(`Setor: ${setorMap.get(Number(setor)) || setor}`);
      if (local) filtersApplied.push(`Local: ${local}`);
      if (contrato) filtersApplied.push(`Contrato: ${contrato}`);
      if (vt) filtersApplied.push(`VT: ${vt}`);
      if (academia) filtersApplied.push(`Academia: ${academia}`);
      if (cargoConfianca) filtersApplied.push(`Cargo Confian\u00e7a: ${cargoConfianca}`);
      if (comissionado) filtersApplied.push(`Comissionado: ${comissionado}`);
      if (search) filtersApplied.push(`Busca: ${search}`);

      addHeaderLandscape(doc, 'Relat\u00f3rio de Colaboradores', `${filtered.length} colaboradores${filtersApplied.length ? ' | Filtros: ' + filtersApplied.join(', ') : ''}`);
      addSectionTitleLandscape(doc, 'Listagem de Colaboradores');

      const parseSal = (v: any) => { const s = String(v || 0).trim(); if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s) || 0; return parseFloat(s.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0; };

      const columns = [
        { header: 'Nome', key: 'nome', width: 110 },
        { header: 'CPF', key: 'cpf', width: 60 },
        { header: 'Cargo', key: 'cargo', width: 70 },
        { header: 'Setor', key: 'setor', width: 60 },
        { header: 'N\u00edvel', key: 'nivel', width: 40 },
        { header: 'Sal\u00e1rio', key: 'salario', width: 55, align: 'right' as const },
        { header: 'Status', key: 'status', width: 45 },
        { header: 'Contrato', key: 'contrato', width: 35 },
        { header: 'Local', key: 'local', width: 45 },
        { header: 'Forma\u00e7\u00e3o', key: 'formacao', width: 45 },
        { header: 'Admiss\u00e3o', key: 'admissao', width: 48 },
        { header: 'VT', key: 'vt', width: 25 },
        { header: 'Acad.', key: 'academia', width: 25 },
        { header: 'Conf.', key: 'confianca', width: 25 },
        { header: 'Comis.', key: 'comis', width: 25 },
      ];

      const rows = filtered.map((c: any) => {
        const info = getCargoInfo(c);
        return {
          nome: c.nomeCompleto || '',
          cpf: c.cpf || '',
          cargo: c.cargo || '',
          setor: setorMap.get(c.setorId) || '',
          nivel: NIVEL_LABELS[c.nivelHierarquico] || '',
          salario: fmtCurrency(parseSal(c.salarioBase)),
          status: c.statusColaborador || 'ativo',
          contrato: (c.tipoContrato || '').toUpperCase(),
          local: c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : c.localTrabalho === 'uberaba' ? 'Uberaba' : '',
          formacao: GRAU_LABELS[c.grauInstrucao] || '',
          admissao: fmtDate(c.dataAdmissao || ''),
          vt: c.valeTransporte ? 'Sim' : 'N\u00e3o',
          academia: academiaColabIds.has(c.id) ? 'Sim' : 'N\u00e3o',
          confianca: info.cargoConfianca ? 'Sim' : 'N\u00e3o',
          comis: info.comissionado ? 'Sim' : 'N\u00e3o',
        };
      });

      addTableLandscape(doc, columns, rows);
      addFooterLandscape(doc);
      doc.end();
    } catch (err: any) {
      console.error('[Colaboradores PDF Export Error]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ---- MEMÓRIA DE CÁLCULO PDF ----
  app.get('/api/cargos-salarios/memoria-calculo-pdf', async (req: any, res: any) => {
    try {
      const { createPDF, addHeader, addKPIs, addSectionTitle, addTable, addFooter, fmtCurrency } = await import('../pdfGenerator');
      const db = await import('../db');
      const setorNome = (req.query.setor || '') as string;
      const allColabs = await db.listColaboradores();
      const allSetores = await db.listSetores();
      const setoresList = (allSetores || []) as any[];
      const colabList = ((allColabs || []) as any[]).filter(c => c.ativo !== false);

      // Find setor by name
      let filteredColabs = colabList;
      if (setorNome && setorNome !== 'Sem Setor') {
        const setor = setoresList.find(s => s.nome === setorNome || s.sigla === setorNome);
        if (setor) {
          filteredColabs = colabList.filter(c => c.setorId === setor.id);
        }
      } else if (setorNome === 'Sem Setor') {
        filteredColabs = colabList.filter(c => !c.setorId);
      }

      const NIVEL_LABELS: Record<string, string> = {
        estagiario: 'Estagiário', auxiliar: 'Auxiliar', assistente: 'Assistente',
        analista_jr: 'Analista Jr', analista_pl: 'Analista Pleno', analista_sr: 'Analista Sênior',
        coordenador: 'Coordenador', supervisor: 'Supervisor', gerente: 'Gerente', diretor: 'Diretor',
      };

      const parseSal = (v: any) => { const s = String(v || 0).trim(); if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s) || 0; return parseFloat(s.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0; };
      const custoTotal = filteredColabs.reduce((sum: number, c: any) => sum + parseSal(c.salarioBase), 0);
      const media = filteredColabs.length > 0 ? custoTotal / filteredColabs.length : 0;

      const doc = createPDF();
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        const pdfBuf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="memoria-calculo-${setorNome.replace(/\s/g, '-').toLowerCase()}.pdf"`);
        res.send(pdfBuf);
      });

      const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
      const setorLabel = setorNome.replace(/^[A-Z]+\s*[–-]\s*/, '');
      addHeader(doc, `Memória de Cálculo — ${setorLabel}`, `Evox Fiscal — Cargos e Salários | Gerado em ${dataHora}`);

      addKPIs(doc, [
        { label: 'Colaboradores', value: String(filteredColabs.length), color: '#3B82F6' },
        { label: 'Custo Mensal', value: fmtCurrency(custoTotal), color: '#10B981' },
        { label: 'Custo Anual', value: fmtCurrency(custoTotal * 12), color: '#8B5CF6' },
        { label: 'Média Salarial', value: fmtCurrency(media), color: '#F59E0B' },
      ]);

      addSectionTitle(doc, 'Detalhamento por Colaborador');
      const columns = [
        { header: '#', key: 'idx', width: 25 },
        { header: 'Nome', key: 'nome', width: 140 },
        { header: 'Cargo', key: 'cargo', width: 100 },
        { header: 'Nível', key: 'nivel', width: 70 },
        { header: 'Salário Base', key: 'salario', width: 80 },
        { header: 'Contrato', key: 'contrato', width: 50 },
      ];
      const sorted = [...filteredColabs].sort((a: any, b: any) => {
        const sa = parseSal(a.salarioBase);
        const sb = parseSal(b.salarioBase);
        return sb - sa;
      });
      const rows = sorted.map((c: any, idx: number) => {
        return {
          idx: String(idx + 1),
          nome: c.nomeCompleto || '',
          cargo: c.cargo || '',
          nivel: NIVEL_LABELS[c.nivelHierarquico] || c.nivelHierarquico || 'N/D',
          salario: fmtCurrency(parseSal(c.salarioBase)),
          contrato: (c.tipoContrato || 'CLT').toUpperCase(),
        };
      });
      rows.push({ idx: '', nome: 'TOTAL', cargo: '', nivel: `${filteredColabs.length} colaboradores`, salario: fmtCurrency(custoTotal), contrato: '', isTotal: true } as any);
      addTable(doc, columns, rows);

      // Breakdown by nivel
      addSectionTitle(doc, 'Composição por Nível Hierárquico');
      const nivelMap = new Map<string, { count: number; custo: number }>();
      filteredColabs.forEach((c: any) => {
        const nivel = c.nivelHierarquico || 'nao_definido';
        if (!nivelMap.has(nivel)) nivelMap.set(nivel, { count: 0, custo: 0 });
        const entry = nivelMap.get(nivel)!;
        entry.count++;
        entry.custo += parseSal(c.salarioBase);
      });
      const nivelCols = [
        { header: 'Nível', key: 'nivel', width: 120 },
        { header: 'Qtd', key: 'qtd', width: 50 },
        { header: 'Custo Total', key: 'custo', width: 100 },
        { header: '% do Total', key: 'pct', width: 80 },
      ];
      const nivelRows = Array.from(nivelMap.entries()).map(([nivel, data]) => ({
        nivel: NIVEL_LABELS[nivel] || 'Não Definido',
        qtd: String(data.count),
        custo: fmtCurrency(data.custo),
        pct: custoTotal > 0 ? `${((data.custo / custoTotal) * 100).toFixed(1)}%` : '0.0%',
      }));
      addTable(doc, nivelCols, nivelRows);

      addFooter(doc);
      doc.end();
    } catch (err: any) {
      console.error('[Memoria Calculo PDF Error]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Simulador Reajuste PDF export
  app.get('/api/cargos-salarios/simulador-reajuste-pdf', async (req: any, res: any) => {
    try {
      const { createPDF, addHeader, addKPIs, addSectionTitle, addTable, addFooter, fmtCurrency } = await import('../pdfGenerator');
      const modo = (req.query.modo || 'global') as string;
      const percentual = parseFloat(req.query.percentual || '0');
      const custoAtual = parseFloat(req.query.custoAtual || '0');
      const custoNovo = parseFloat(req.query.custoNovo || '0');
      const impactoMensal = parseFloat(req.query.impactoMensal || '0');
      const impactoAnual = parseFloat(req.query.impactoAnual || '0');
      const afetados = parseInt(req.query.afetados || '0');
      let dados: any[] = [];
      try { dados = JSON.parse(req.query.dados || '[]'); } catch { dados = []; }

      const doc = createPDF();
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        const pdfBuf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="simulacao-reajuste-${modo}.pdf"`);
        res.send(pdfBuf);
      });

      const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
      const modoLabel = modo === 'global' ? 'Global' : modo === 'setor' ? 'Por Setor' : 'Por Cargo';
      addHeader(doc, `Simulação de Reajuste Salarial — ${modoLabel} (${percentual}%)`, `Evox Fiscal — Cargos e Salários | Gerado em ${dataHora}`);

      addKPIs(doc, [
        { label: 'Custo Atual', value: fmtCurrency(custoAtual), color: '#3B82F6' },
        { label: 'Custo Projetado', value: fmtCurrency(custoNovo), color: '#10B981' },
        { label: 'Impacto Mensal', value: `+ ${fmtCurrency(impactoMensal)}`, color: '#EF4444' },
        { label: 'Impacto Anual', value: `+ ${fmtCurrency(impactoAnual)}`, color: '#F97316' },
      ]);

      addSectionTitle(doc, `Detalhamento — ${afetados} colaborador(es) afetado(s)`);
      const columns = [
        { header: '#', key: 'idx', width: 25 },
        { header: 'Nome', key: 'nome', width: 120 },
        { header: 'Cargo', key: 'cargo', width: 90 },
        { header: 'Setor', key: 'setor', width: 70 },
        { header: 'Sal. Atual', key: 'salAtual', width: 70, align: 'right' as const },
        { header: 'Sal. Novo', key: 'salNovo', width: 70, align: 'right' as const },
        { header: 'Diferença', key: 'dif', width: 70, align: 'right' as const },
      ];
      const rows = dados.map((d: any, idx: number) => ({
        idx: String(idx + 1),
        nome: d.nome || '',
        cargo: d.cargo || '',
        setor: d.setor || '',
        salAtual: fmtCurrency(d.salarioAtual || 0),
        salNovo: fmtCurrency(d.salarioNovo || 0),
        dif: d.diferenca > 0 ? `+ ${fmtCurrency(d.diferenca)}` : '—',
      }));
      rows.push({
        idx: '', nome: 'TOTAL', cargo: '', setor: '',
        salAtual: fmtCurrency(custoAtual), salNovo: fmtCurrency(custoNovo),
        dif: `+ ${fmtCurrency(impactoMensal)}`, isTotal: true,
      } as any);
      addTable(doc, columns, rows);

      addFooter(doc);
      doc.end();
    } catch (err: any) {
      console.error('[Simulador Reajuste PDF Error]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Rescisão PDF Export ───
  app.get('/api/rescisao/export-pdf', async (req: any, res: any) => {
    try {
      const { createPDF, addHeader, addKPIs, addSectionTitle, addTable, addFooter, fmtCurrency } = await import('../pdfGenerator');
      let dados: any;
      try { dados = JSON.parse(req.query.dados || '{}'); } catch { dados = {}; }

      const doc = createPDF();
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        const pdfBuf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="rescisao-${(dados.colaboradorNome || 'calculo').replace(/\s+/g, '-')}.pdf"`);
        res.send(pdfBuf);
      });

      const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
      const tipoLabels: Record<string, string> = {
        sem_justa_causa: 'Sem Justa Causa', justa_causa: 'Justa Causa',
        pedido_demissao: 'Pedido de Demissão', termino_experiencia_1: 'Término 1º Exp.',
        termino_experiencia_2: 'Término 2º Exp.', acordo_mutuo: 'Acordo Mútuo',
      };
      addHeader(doc, `Rescisão Trabalhista — ${dados.colaboradorNome || ''}`, `Evox Fiscal — RH | Gerado em ${dataHora}`);

      addKPIs(doc, [
        { label: 'Total Proventos', value: fmtCurrency(dados.totalProventos || 0), color: '#10B981' },
        { label: 'Total Descontos', value: fmtCurrency(dados.totalDescontos || 0), color: '#EF4444' },
        { label: 'Total Líquido', value: fmtCurrency(dados.totalLiquido || 0), color: '#6366F1' },
      ]);

      // Dados do colaborador
      addSectionTitle(doc, 'Dados do Colaborador');
      const infoCols = [
        { header: 'Campo', key: 'campo', width: 150 },
        { header: 'Valor', key: 'valor', width: 300 },
      ];
      const infoRows = [
        { campo: 'Nome', valor: dados.colaboradorNome || '-' },
        { campo: 'Cargo', valor: dados.cargo || '-' },
        { campo: 'Salário Base', valor: fmtCurrency(dados.salarioBase || 0) },
        { campo: 'Admissão', valor: dados.dataAdmissao || '-' },
        { campo: 'Desligamento', valor: dados.dataDesligamento || '-' },
        { campo: 'Tipo', valor: tipoLabels[dados.tipoDesligamento] || dados.tipoDesligamento || '-' },
        { campo: 'Contrato', valor: (dados.tipoContrato || 'CLT').toUpperCase() },
      ];
      addTable(doc, infoCols, infoRows);

      // Verbas Rescisórias
      addSectionTitle(doc, 'Verbas Rescisórias');
      const verbasCols = [
        { header: 'Verba', key: 'verba', width: 200 },
        { header: 'Referência', key: 'ref', width: 150 },
        { header: 'Valor', key: 'valor', width: 100, align: 'right' as const },
      ];
      const verbasRows: any[] = [];
      verbasRows.push({ verba: 'Saldo de Salário', ref: 'Dias trabalhados', valor: fmtCurrency(dados.saldoSalario || 0) });
      if (Number(dados.avisoPrevio) > 0) verbasRows.push({ verba: 'Aviso Prévio', ref: `${dados.avisoPrevioDias || 0} dias`, valor: fmtCurrency(dados.avisoPrevio) });
      if (Number(dados.decimoTerceiroProporcional) > 0) verbasRows.push({ verba: '13º Proporcional', ref: `${dados.decimoTerceiroMeses || 0}/12 avos`, valor: fmtCurrency(dados.decimoTerceiroProporcional) });
      if (Number(dados.feriasProporcionais) > 0) verbasRows.push({ verba: 'Férias Proporcionais', ref: `${dados.feriasMeses || 0}/12 avos`, valor: fmtCurrency(dados.feriasProporcionais) });
      if (Number(dados.tercoConstitucional) > 0) verbasRows.push({ verba: '1/3 Constitucional', ref: 'Sobre férias', valor: fmtCurrency(dados.tercoConstitucional) });
      if (Number(dados.feriasVencidas) > 0) verbasRows.push({ verba: 'Férias Vencidas + 1/3', ref: 'Período completo', valor: fmtCurrency(dados.feriasVencidas) });
      if (Number(dados.multaFgts) > 0) verbasRows.push({ verba: `Multa FGTS (${dados.multaFgtsPercentual || 0}%)`, ref: `Sobre ${fmtCurrency(dados.fgtsDepositado || 0)}`, valor: fmtCurrency(dados.multaFgts) });
      if (Number(dados.totalDescontos) > 0) verbasRows.push({ verba: 'Descontos', ref: 'Ajuste manual', valor: `- ${fmtCurrency(dados.totalDescontos)}` });
      verbasRows.push({ verba: 'TOTAL LÍQUIDO', ref: '', valor: fmtCurrency(dados.totalLiquido || 0), isTotal: true } as any);
      addTable(doc, verbasCols, verbasRows);

      if (dados.observacao) {
        addSectionTitle(doc, 'Observações');
        doc.fontSize(9).text(dados.observacao, 40, undefined, { width: 500 });
        doc.moveDown();
      }

      addFooter(doc);
      doc.end();
    } catch (err: any) {
      console.error('[Rescisao PDF Error]', err);
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
