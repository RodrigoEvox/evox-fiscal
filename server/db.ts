import { eq, desc, asc, and, sql, or, isNull, isNotNull, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  clientes, InsertCliente,
  parceiros, InsertParceiro,
  teses, InsertTese,
  filaApuracao, InsertFilaApuracao,
  relatorios, InsertRelatorio,
  notificacoes, InsertNotificacao,
  setores, InsertSetor,
  usuarioSetores, InsertUsuarioSetor,
  tarefas, InsertTarefa,
  tarefaComentarios, InsertTarefaComentario,
  arquivos, InsertArquivo,
  auditLog, InsertAuditLog,
  apiKeys, InsertApiKey,
  servicos, InsertServico,
  setorConfig, InsertSetorConfig,
  modelosParceria, InsertModeloParceria,
  comissoesServico, InsertComissaoServico,
  parceiroServicos, InsertParceiroServico,
  slaConfiguracoes, InsertSlaConfiguracao,
  servicoEtapas, InsertServicoEtapa,
  clienteServicos, InsertClienteServico,
  executivosComerciais, InsertExecutivoComercial,
  rateioComissao, InsertRateioComissao,
  aprovacaoComissao,
  userHistory, InsertUserHistory,
  chatMessages, InsertChatMessage,
  chatChannels, InsertChatChannel,
  chatNotifications, InsertChatNotification,
  chatReactions, InsertChatReaction,
  chatTypingIndicators, InsertChatTypingIndicator,
  colaboradores, InsertColaborador,
  ferias, InsertFerias,
  solicitacoesFolga, InsertSolicitacaoFolga,
  tarefasSetor, InsertTarefaSetor,
  acoesBeneficios, InsertAcaoBeneficio,
  atestadosLicencas, InsertAtestadoLicenca,
  planosCarreira, InsertPlanoCarreira,
  historicoStatusColaborador, InsertHistoricoStatusColaborador,
  onboardingTemplates, InsertOnboardingTemplate,
  onboardingEtapasTemplate, InsertOnboardingEtapaTemplate,
  onboardingColaborador, InsertOnboardingColaborador,
  onboardingEtapas, InsertOnboardingEtapa,
  pesquisasClima, InsertPesquisaClima,
  perguntasClima, InsertPerguntaClima,
  respostasClima, InsertRespostaClima,
  bancoHoras, InsertBancoHoras,
  userPresence, InsertUserPresence,
  valeTransporte, InsertValeTransporte,
  academiaBeneficio, InsertAcademiaBeneficio,
  comissaoRh, InsertComissaoRh,
  dayOff, InsertDayOff,
  doacaoSangue, InsertDoacaoSangue,
  reajustesSalariais, InsertReajusteSalarial,
  apontamentosFolha, InsertApontamentoFolha,
  niveisCargo, InsertNivelCargo,
  beneficiosCustom, InsertBeneficioCustom,
  programasCarreira, InsertProgramaCarreira,
  rescisoes, InsertRescisao,
  equipamentosColaborador, InsertEquipamentoColaborador,
  senhasAutorizacoes, InsertSenhaAutorizacao,
  emailsCorporativos, InsertEmailCorporativo,
  senhaHistorico, InsertSenhaHistorico,
  termosResponsabilidade,
  convencaoColetiva,
  rescisaoAuditoria,
  ocorrencias,
  planoReversao,
  planoReversaoEtapas,
  planoReversaoFeedbacks,
  ocorrenciaTimeline,
  ocorrenciaAssinaturas,
  bibLivros,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// =============================================
// ---- USERS ----
// =============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function createUser(data: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(users).values(data);
  return result[0].insertId;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(id: number, role: string, nivelAcesso: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: role as any, nivelAcesso: nivelAcesso as any }).where(eq(users.id, id));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function toggleUserActive(id: number, ativo: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ativo }).where(eq(users.id, id));
}

// =============================================
// ---- SETORES ----
// =============================================

export async function listSetores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(setores).orderBy(asc(setores.nome));
}

export async function getSetorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(setores).where(eq(setores.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createSetor(data: InsertSetor) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(setores).values(data);
  return result[0].insertId;
}

export async function updateSetor(id: number, data: Partial<InsertSetor>) {
  const db = await getDb();
  if (!db) return;
  await db.update(setores).set(data).where(eq(setores.id, id));
}

export async function deleteSetor(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(setores).where(eq(setores.id, id));
}

// =============================================
// ---- USUARIO_SETORES ----
// =============================================

export async function listUsuarioSetores(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    return db.select().from(usuarioSetores).where(eq(usuarioSetores.userId, userId));
  }
  return db.select().from(usuarioSetores);
}

export async function addUsuarioSetor(data: InsertUsuarioSetor) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(usuarioSetores).values(data);
  return result[0].insertId;
}

export async function removeUsuarioSetor(userId: number, setorId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(usuarioSetores).where(and(eq(usuarioSetores.userId, userId), eq(usuarioSetores.setorId, setorId)));
}

// =============================================
// ---- PARCEIROS ----
// =============================================

export async function listParceiros() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parceiros).orderBy(desc(parceiros.createdAt));
}

export async function createParceiro(data: InsertParceiro) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(parceiros).values(data);
  return result[0].insertId;
}

export async function updateParceiro(id: number, data: Partial<InsertParceiro>) {
  const db = await getDb();
  if (!db) return;
  await db.update(parceiros).set(data).where(eq(parceiros.id, id));
}

export async function deleteParceiro(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(parceiros).where(eq(parceiros.id, id));
}

// =============================================
// ---- CLIENTES ----
// =============================================

export async function listClientes() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: clientes.id,
    codigo: clientes.codigo,
    cnpj: clientes.cnpj,
    razaoSocial: clientes.razaoSocial,
    nomeFantasia: clientes.nomeFantasia,
    dataAbertura: clientes.dataAbertura,
    regimeTributario: clientes.regimeTributario,
    situacaoCadastral: clientes.situacaoCadastral,
    classificacaoCliente: clientes.classificacaoCliente,
    segmentoEconomico: clientes.segmentoEconomico,
    prioridade: clientes.prioridade,
    ativo: clientes.ativo,
    createdAt: clientes.createdAt,
    updatedAt: clientes.updatedAt,
  }).from(clientes).orderBy(desc(clientes.createdAt));
}

export async function getClienteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getClienteByCodigo(codigo: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clientes).where(eq(clientes.codigo, codigo)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCliente(data: InsertCliente) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(clientes).values(data);
  const insertId = result[0].insertId;
  // Auto-generate codigo based on the new ID (apenas números, sem prefixo)
  const codigo = String(insertId).padStart(6, '0');
  await db.update(clientes).set({ codigo } as any).where(eq(clientes.id, insertId));
  return { id: insertId, codigo };
}

export async function updateCliente(id: number, data: Partial<InsertCliente>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function deleteCliente(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientes).where(eq(clientes.id, id));
}

// Converte clientes "novo" com mais de 90 dias para "base"
export async function convertClientesNovosToBase() {
  const db = await getDb();
  if (!db) return { converted: 0 };
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const result = await db.update(clientes)
    .set({ classificacaoCliente: 'base', dataConversaoBase: new Date() } as any)
    .where(
      and(
        eq(clientes.classificacaoCliente, 'novo'),
        lt(clientes.createdAt, ninetyDaysAgo)
      )
    );
  return { converted: (result as any)[0]?.affectedRows || 0 };
}

// =============================================
// ---- TESES ----
// =============================================

export async function listTeses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teses).orderBy(desc(teses.createdAt));
}

export async function getTeseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(teses).where(eq(teses.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createTese(data: InsertTese) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(teses).values(data);
  return result[0].insertId;
}

export async function updateTese(id: number, data: Partial<InsertTese>) {
  const db = await getDb();
  if (!db) return;
  await db.update(teses).set(data).where(eq(teses.id, id));
}

export async function deleteTese(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teses).where(eq(teses.id, id));
}

// =============================================
// ---- FILA DE APURAÇÃO ----
// =============================================

export async function listFilaApuracao() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(filaApuracao).orderBy(asc(filaApuracao.ordem));
}

// Optimized version that joins with clientes to avoid N+1 query
export async function listFilaApuracaoWithClientes() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: filaApuracao.id,
      clienteId: filaApuracao.clienteId,
      status: filaApuracao.status,
      ordem: filaApuracao.ordem,
      analistaId: filaApuracao.analistaId,
      analistaNome: filaApuracao.analistaNome,
      dataInicioApuracao: filaApuracao.dataInicioApuracao,
      dataConclusao: filaApuracao.dataConclusao,
      createdAt: filaApuracao.createdAt,
      clienteNome: clientes.razaoSocial,
      clienteCnpj: clientes.cnpj,
      clientePrioridade: clientes.prioridade,
      procuracaoHabilitada: clientes.procuracaoHabilitada,
      procuracaoValidade: clientes.procuracaoValidade,
      redFlags: clientes.redFlags,
    })
    .from(filaApuracao)
    .leftJoin(clientes, eq(filaApuracao.clienteId, clientes.id))
    .orderBy(asc(filaApuracao.ordem));
  return rows.map(r => ({
    ...r,
    clienteNome: r.clienteNome || 'N/A',
    clienteCnpj: r.clienteCnpj || 'N/A',
    clientePrioridade: r.clientePrioridade || 'media',
    procuracaoHabilitada: r.procuracaoHabilitada || false,
    procuracaoValidade: r.procuracaoValidade || null,
    redFlags: r.redFlags || [],
  }));
}

export async function createFilaItem(data: InsertFilaApuracao) {
  const db = await getDb();
  if (!db) return null;
  const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(ordem), 0)` }).from(filaApuracao).where(eq(filaApuracao.status, data.status || 'a_fazer'));
  const nextOrder = (maxOrder[0]?.max || 0) + 1;
  const result = await db.insert(filaApuracao).values({ ...data, ordem: nextOrder });
  return result[0].insertId;
}

export async function updateFilaItem(id: number, data: Partial<InsertFilaApuracao>) {
  const db = await getDb();
  if (!db) return;
  await db.update(filaApuracao).set(data).where(eq(filaApuracao.id, id));
}

// =============================================
// ---- RELATÓRIOS ----
// =============================================

export async function listRelatorios() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(relatorios).orderBy(desc(relatorios.createdAt));
}

export async function getRelatoriosByClienteId(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(relatorios).where(eq(relatorios.clienteId, clienteId)).orderBy(desc(relatorios.createdAt));
}

export async function createRelatorio(data: InsertRelatorio) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(relatorios).values(data);
  return result[0].insertId;
}

// =============================================
// ---- NOTIFICAÇÕES ----
// =============================================

export async function listNotificacoes(usuarioId?: number) {
  const db = await getDb();
  if (!db) return [];
  const cols = {
    id: notificacoes.id,
    tipo: notificacoes.tipo,
    titulo: notificacoes.titulo,
    mensagem: notificacoes.mensagem,
    lida: notificacoes.lida,
    usuarioId: notificacoes.usuarioId,
    clienteId: notificacoes.clienteId,
    createdAt: notificacoes.createdAt,
    tarefaId: notificacoes.tarefaId,
  };
  if (usuarioId) {
    return db.select(cols).from(notificacoes)
      .where(or(eq(notificacoes.usuarioId, usuarioId), isNull(notificacoes.usuarioId)))
      .orderBy(desc(notificacoes.createdAt)).limit(25);
  }
  return db.select(cols).from(notificacoes).orderBy(desc(notificacoes.createdAt)).limit(25);
}

export async function createNotificacao(data: InsertNotificacao) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(notificacoes).values(data);
    return result[0].insertId;
  } catch (err: any) {
    // Fallback to raw SQL if Drizzle enum mapping fails (e.g., Data truncated)
    if (err?.cause?.code === 'WARN_DATA_TRUNCATED' || err?.message?.includes('Data truncated')) {
      const result = await db.execute(
        sql`INSERT INTO notificacoes (tipo, titulo, mensagem, lida, usuarioId, clienteId, tarefaId) VALUES (${data.tipo}, ${data.titulo}, ${data.mensagem}, ${data.lida ?? 0}, ${data.usuarioId ?? null}, ${data.clienteId ?? null}, ${data.tarefaId ?? null})`
      );
      return (result as any)?.[0]?.insertId ?? null;
    }
    throw err;
  }
}

export async function markNotificacaoLida(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notificacoes).set({ lida: true }).where(eq(notificacoes.id, id));
}

export async function markAllNotificacoesLidas(usuarioId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notificacoes).set({ lida: true })
    .where(and(
      or(eq(notificacoes.usuarioId, usuarioId), isNull(notificacoes.usuarioId)),
      eq(notificacoes.lida, false)
    ));
}

// =============================================
// ---- TAREFAS ----
// =============================================

export async function listTarefas(filters?: { setorId?: number; responsavelId?: number; status?: string; clienteId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.setorId) conditions.push(eq(tarefas.setorId, filters.setorId));
  if (filters?.responsavelId) conditions.push(eq(tarefas.responsavelId, filters.responsavelId));
  if (filters?.status) conditions.push(eq(tarefas.status, filters.status as any));
  if (filters?.clienteId) conditions.push(eq(tarefas.clienteId, filters.clienteId));

  if (conditions.length > 0) {
    return db.select().from(tarefas).where(and(...conditions)).orderBy(asc(tarefas.ordem), desc(tarefas.createdAt));
  }
  return db.select().from(tarefas).orderBy(asc(tarefas.ordem), desc(tarefas.createdAt));
}

export async function getTarefaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tarefas).where(eq(tarefas.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getSubtarefas(tarefaPaiId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tarefas).where(eq(tarefas.tarefaPaiId, tarefaPaiId)).orderBy(asc(tarefas.ordem));
}

export async function createTarefa(data: InsertTarefa) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tarefas).values(data);
  return result[0].insertId;
}

export async function updateTarefa(id: number, data: Partial<InsertTarefa>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tarefas).set(data).where(eq(tarefas.id, id));
}

export async function deleteTarefa(id: number) {
  const db = await getDb();
  if (!db) return;
  // Delete subtarefas first
  await db.delete(tarefas).where(eq(tarefas.tarefaPaiId, id));
  await db.delete(tarefaComentarios).where(eq(tarefaComentarios.tarefaId, id));
  await db.delete(tarefas).where(eq(tarefas.id, id));
}

export async function getNextTarefaCodigo() {
  const db = await getDb();
  if (!db) return 'EVX-001';
  const [result] = await db.select({ max: sql<number>`COALESCE(MAX(id), 0)` }).from(tarefas);
  const next = (result?.max || 0) + 1;
  return `EVX-${String(next).padStart(3, '0')}`;
}

// =============================================
// ---- COMENTÁRIOS DE TAREFAS ----
// =============================================

export async function listComentarios(tarefaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tarefaComentarios).where(eq(tarefaComentarios.tarefaId, tarefaId)).orderBy(asc(tarefaComentarios.createdAt));
}

export async function createComentario(data: InsertTarefaComentario) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tarefaComentarios).values(data);
  return result[0].insertId;
}

// =============================================
// ---- ARQUIVOS ----
// =============================================

export async function listArquivos(entidadeTipo?: string, entidadeId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (entidadeTipo) conditions.push(eq(arquivos.entidadeTipo, entidadeTipo as any));
  if (entidadeId) conditions.push(eq(arquivos.entidadeId, entidadeId));

  if (conditions.length > 0) {
    return db.select().from(arquivos).where(and(...conditions)).orderBy(desc(arquivos.createdAt));
  }
  return db.select().from(arquivos).orderBy(desc(arquivos.createdAt));
}

export async function createArquivo(data: InsertArquivo) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(arquivos).values(data);
  return result[0].insertId;
}

export async function deleteArquivo(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(arquivos).where(eq(arquivos.id, id));
}

// =============================================
// ---- AUDIT LOG ----
// =============================================

export async function listAuditLog(limit: number = 100, entidadeTipo?: string, entidadeId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (entidadeTipo) conditions.push(eq(auditLog.entidadeTipo, entidadeTipo));
  if (entidadeId) conditions.push(eq(auditLog.entidadeId, entidadeId));

  if (conditions.length > 0) {
    return db.select().from(auditLog).where(and(...conditions)).orderBy(desc(auditLog.createdAt)).limit(limit);
  }
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}

export async function createAuditEntry(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(auditLog).values(data);
  return result[0].insertId;
}

// =============================================
// ---- API KEYS ----
// =============================================

export async function listApiKeys() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
}

export async function getApiKeyByChave(chave: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(apiKeys).where(eq(apiKeys.chave, chave)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(apiKeys).values(data);
  return result[0].insertId;
}

export async function updateApiKey(id: number, data: Partial<InsertApiKey>) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys).set(data).where(eq(apiKeys.id, id));
}

export async function deleteApiKey(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(apiKeys).where(eq(apiKeys.id, id));
}

export async function touchApiKeyUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys).set({ ultimoUso: new Date() }).where(eq(apiKeys.id, id));
}

// =============================================
// ---- DASHBOARD STATS ----
// =============================================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [clienteStats] = await db.select({
    total: sql<number>`COUNT(*)`,
    prioritarios: sql<number>`SUM(CASE WHEN prioridade = 'alta' THEN 1 ELSE 0 END)`,
    comRedFlags: sql<number>`SUM(CASE WHEN JSON_LENGTH(redFlags) > 0 THEN 1 ELSE 0 END)`,
  }).from(clientes);

  const [teseStats] = await db.select({
    total: sql<number>`COUNT(*)`,
    pacificadas: sql<number>`SUM(CASE WHEN classificacao = 'pacificada' THEN 1 ELSE 0 END)`,
  }).from(teses).where(eq(teses.ativa, true));

  const [filaStats] = await db.select({
    aFazer: sql<number>`SUM(CASE WHEN status = 'a_fazer' THEN 1 ELSE 0 END)`,
    fazendo: sql<number>`SUM(CASE WHEN status = 'fazendo' THEN 1 ELSE 0 END)`,
    concluido: sql<number>`SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END)`,
  }).from(filaApuracao);

  const [parceiroStats] = await db.select({
    total: sql<number>`COUNT(*)`,
  }).from(parceiros).where(eq(parceiros.ativo, true));

  const [tarefaStats] = await db.select({
    total: sql<number>`COUNT(*)`,
    emAndamento: sql<number>`SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END)`,
    concluidas: sql<number>`SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END)`,
    vencidas: sql<number>`SUM(CASE WHEN slaStatus = 'vencido' THEN 1 ELSE 0 END)`,
  }).from(tarefas);

  const [setorStats] = await db.select({
    total: sql<number>`COUNT(*)`,
  }).from(setores).where(eq(setores.ativo, true));

  return {
    totalClientes: Number(clienteStats?.total || 0),
    clientesPrioritarios: Number(clienteStats?.prioritarios || 0),
    clientesComRedFlags: Number(clienteStats?.comRedFlags || 0),
    totalTeses: Number(teseStats?.total || 0),
    tesesPacificadas: Number(teseStats?.pacificadas || 0),
    totalParceiros: Number(parceiroStats?.total || 0),
    filaAFazer: Number(filaStats?.aFazer || 0),
    filaFazendo: Number(filaStats?.fazendo || 0),
    filaConcluido: Number(filaStats?.concluido || 0),
    totalTarefas: Number(tarefaStats?.total || 0),
    tarefasEmAndamento: Number(tarefaStats?.emAndamento || 0),
    tarefasConcluidas: Number(tarefaStats?.concluidas || 0),
    tarefasVencidas: Number(tarefaStats?.vencidas || 0),
    totalSetores: Number(setorStats?.total || 0),
  };
}

// =============================================
// ---- SERVIÇOS POR SETOR ----
// =============================================

// servicos, setorConfig etc. already imported above

export async function listServicos(setorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (setorId) {
    return db.select().from(servicos).where(eq(servicos.setorId, setorId)).orderBy(asc(servicos.nome));
  }
  return db.select().from(servicos).orderBy(asc(servicos.nome));
}

export async function createServico(data: InsertServico) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(servicos).values(data);
  return result[0].insertId;
}

export async function updateServico(id: number, data: Partial<InsertServico>) {
  const db = await getDb();
  if (!db) return;
  await db.update(servicos).set(data).where(eq(servicos.id, id));
}

export async function deleteServico(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(servicos).where(eq(servicos.id, id));
}

// =============================================
// ---- SETOR CONFIG ----
// =============================================

export async function listSetorConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(setorConfig);
}

export async function getSetorConfigBySetorId(setorId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(setorConfig).where(eq(setorConfig.setorId, setorId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getSetorConfigBySigla(sigla: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(setorConfig).where(eq(setorConfig.sigla, sigla)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertSetorConfig(data: InsertSetorConfig) {
  const db = await getDb();
  if (!db) return null;
  // Check if exists
  const existing = await getSetorConfigBySetorId(data.setorId);
  if (existing) {
    await db.update(setorConfig).set(data).where(eq(setorConfig.id, existing.id));
    return existing.id;
  }
  const result = await db.insert(setorConfig).values(data);
  return result[0].insertId;
}

// =============================================
// ---- BUSCA GLOBAL ----
// =============================================

export async function buscaGlobal(termo: string) {
  const db = await getDb();
  if (!db) return { clientes: [], tarefas: [], parceiros: [], teses: [], usuarios: [] };
  const like = `%${termo}%`;

  const clientesResult = await db.select({ id: clientes.id, razaoSocial: clientes.razaoSocial, cnpj: clientes.cnpj, nomeFantasia: clientes.nomeFantasia })
    .from(clientes)
    .where(or(
      sql`${clientes.razaoSocial} LIKE ${like}`,
      sql`${clientes.cnpj} LIKE ${like}`,
      sql`${clientes.nomeFantasia} LIKE ${like}`,
    ))
    .limit(10);

  const tarefasResult = await db.select({ id: tarefas.id, codigo: tarefas.codigo, titulo: tarefas.titulo, status: tarefas.status })
    .from(tarefas)
    .where(or(
      sql`${tarefas.titulo} LIKE ${like}`,
      sql`${tarefas.codigo} LIKE ${like}`,
    ))
    .limit(10);

  const parceirosResult = await db.select({ id: parceiros.id, nomeCompleto: parceiros.nomeCompleto, apelido: parceiros.apelido, cpf: parceiros.cpf, cnpj: parceiros.cnpj })
    .from(parceiros)
    .where(or(
      sql`${parceiros.nomeCompleto} LIKE ${like}`,
      sql`${parceiros.apelido} LIKE ${like}`,
      sql`${parceiros.cpf} LIKE ${like}`,
      sql`${parceiros.cnpj} LIKE ${like}`,
    ))
    .limit(10);

  const tesesResult = await db.select({ id: teses.id, nome: teses.nome, tributoEnvolvido: teses.tributoEnvolvido })
    .from(teses)
    .where(sql`${teses.nome} LIKE ${like}`)
    .limit(10);

  const usuariosResult = await db.select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(or(
      sql`${users.name} LIKE ${like}`,
      sql`${users.email} LIKE ${like}`,
    ))
    .limit(10);

  const livrosResult = await db.select({ id: bibLivros.id, titulo: bibLivros.titulo, autores: bibLivros.autores, isbn: bibLivros.isbn, categoria: bibLivros.categoria })
    .from(bibLivros)
    .where(or(
      sql`${bibLivros.titulo} LIKE ${like}`,
      sql`${bibLivros.autores} LIKE ${like}`,
      sql`${bibLivros.isbn} LIKE ${like}`,
      sql`${bibLivros.categoria} LIKE ${like}`,
    ))
    .limit(10);

  return { clientes: clientesResult, tarefas: tarefasResult, parceiros: parceirosResult, teses: tesesResult, usuarios: usuariosResult, livros: livrosResult };
}

// =============================================
// ---- SEED SETORES REAIS DA EVOX ----
// =============================================

export async function seedSetoresEvox() {
  const db = await getDb();
  if (!db) return;

  const setoresData = [
    { nome: "SPC – Suporte Comercial", descricao: "Suporte comercial e gestão de parcerias", cor: "#F59E0B", icone: "Handshake", sigla: "SPC",
      submenus: [
        { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/spc/nova-tarefa" },
        { key: "parcerias", label: "Gestão de Parcerias", rota: "/setor/spc/parcerias" },
      ] },
    { nome: "RCT – Crédito", descricao: "Recuperação de créditos tributários", cor: "#10B981", icone: "BadgeDollarSign", sigla: "RCT",
      submenus: [
        { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/rct/nova-tarefa" },
        { key: "fila", label: "Fila de Apuração RCT", rota: "/setor/rct/fila" },
        { key: "teses", label: "Teses Tributárias", rota: "/setor/rct/teses" },
        { key: "analitica", label: "Visão Analítica RCT", rota: "/setor/rct/analitica" },
      ] },
    { nome: "DPT – Transação", descricao: "Departamento de transação tributária", cor: "#8B5CF6", icone: "ArrowLeftRight", sigla: "DPT",
      submenus: [
        { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/dpt/nova-tarefa" },
        { key: "fila", label: "Fila de Apuração DPT", rota: "/setor/dpt/fila" },
        { key: "analitica", label: "Visão Analítica DPT", rota: "/setor/dpt/analitica" },
      ] },
    { nome: "JUR – Jurídico", descricao: "Departamento jurídico", cor: "#EF4444", icone: "Scale", sigla: "JUR",
      submenus: [
        { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/jur/nova-tarefa" },
        { key: "fila", label: "Fila de Execução JUR", rota: "/setor/jur/fila" },
      ] },
    { nome: "RT – Reforma Tributária", descricao: "Reforma tributária e consultoria", cor: "#06B6D4", icone: "Landmark", sigla: "RT",
      submenus: [
        { key: "simulador", label: "Simulador de Impactos", rota: "/setor/rt/simulador" },
        { key: "consultoria", label: "Consultoria", rota: "/setor/rt/consultoria" },
      ] },
    { nome: "CT – Contratos", descricao: "Gestão de contratos", cor: "#F97316", icone: "FileText", sigla: "CT",
      submenus: [
        { key: "dashboard-contratos", label: "Dashboard", rota: "/contratos/dashboard", grupo: "Gestão" },
        { key: "novo-contrato", label: "Novo Contrato", rota: "/contratos/novo", grupo: "Gestão" },
        { key: "fila-elaboracao", label: "Elaboração", rota: "/contratos/fila/elaboracao", grupo: "Filas" },
        { key: "fila-revisao", label: "Revisão", rota: "/contratos/fila/revisao", grupo: "Filas" },
        { key: "fila-assinatura", label: "Assinatura", rota: "/contratos/fila/assinatura", grupo: "Filas" },
        { key: "fila-vigencia", label: "Vigência", rota: "/contratos/fila/vigencia", grupo: "Filas" },
        { key: "fila-renovacao", label: "Renovação", rota: "/contratos/fila/renovacao", grupo: "Filas" },
        { key: "fila-encerrado", label: "Encerrados", rota: "/contratos/fila/encerrado", grupo: "Filas" },
      ] },
    { nome: "FIN – Financeiro", descricao: "Departamento financeiro", cor: "#22C55E", icone: "Wallet", sigla: "FIN",
      submenus: [
        { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/fin/nova-tarefa" },
        { key: "contas-pagar", label: "Contas a Pagar", rota: "/setor/fin/contas-pagar" },
        { key: "contas-receber", label: "Contas a Receber", rota: "/setor/fin/contas-receber" },
        { key: "contas-bancarias", label: "Contas Bancárias", rota: "/setor/fin/contas-bancarias" },
      ] },
    { nome: "MKT – Marketing", descricao: "Marketing e comunicação", cor: "#EC4899", icone: "Megaphone", sigla: "MKT",
      submenus: [
        { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/mkt/nova-tarefa" },
        { key: "redes-sociais", label: "Redes Sociais", rota: "/setor/mkt/redes-sociais" },
        { key: "imersoes", label: "Imersões", rota: "/setor/mkt/imersoes" },
        { key: "podcast", label: "Evox Podcast", rota: "/setor/mkt/podcast" },
        { key: "brindes", label: "Brindes", rota: "/setor/mkt/brindes" },
      ] },
    { nome: "RH – Gente e Gestão", descricao: "Recursos humanos e gestão de pessoas", cor: "#6366F1", icone: "Users", sigla: "RH",
      submenus: [
        { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/rh/nova-tarefa" },
        { key: "colaboradores", label: "Colaboradores", rota: "/setor/rh/colaboradores" },
        { key: "ferias", label: "Férias", rota: "/setor/rh/ferias" },
        { key: "vale-transporte", label: "Vale Transporte", rota: "/setor/rh/vale-transporte" },
        { key: "academia", label: "Academia", rota: "/setor/rh/academia" },
        { key: "comissao-rh", label: "Comissão RH", rota: "/setor/rh/comissao-rh" },
        { key: "day-off", label: "Day Off", rota: "/setor/rh/day-off" },
        { key: "doacao-sangue", label: "Doação de Sangue", rota: "/setor/rh/doacao-sangue" },
        { key: "reajustes", label: "Reajustes Salariais", rota: "/setor/rh/reajustes" },
        { key: "apontamentos-folha", label: "Apontamentos Folha", rota: "/setor/rh/apontamentos-folha" },
        { key: "niveis-cargo", label: "Níveis de Cargo", rota: "/setor/rh/niveis-cargo" },
      ] },
  ];

  const defaultWorkflow = ["a_fazer", "fazendo", "feito", "concluido"];

  for (const s of setoresData) {
    const { sigla, submenus, ...setorData } = s;
    // Check if setor already exists
    const existing = await db.select().from(setores).where(sql`${setores.nome} LIKE ${`${sigla}%`}`).limit(1);
    let setorId: number;
    if (existing.length > 0) {
      setorId = existing[0].id;
      await db.update(setores).set(setorData).where(eq(setores.id, setorId));
    } else {
      const result = await db.insert(setores).values(setorData);
      setorId = result[0].insertId;
    }
    // Upsert config
    const existingConfig = await db.select().from(setorConfig).where(eq(setorConfig.setorId, setorId)).limit(1);
    if (existingConfig.length > 0) {
      await db.update(setorConfig).set({ sigla, submenus: submenus as any, workflowStatuses: defaultWorkflow }).where(eq(setorConfig.id, existingConfig[0].id));
    } else {
      await db.insert(setorConfig).values({ setorId, sigla, submenus: submenus as any, workflowStatuses: defaultWorkflow });
    }
  }
}


// =============================================
// ---- MODELOS DE PARCERIA ----
// =============================================

export async function listModelosParceria() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(modelosParceria).where(eq(modelosParceria.ativo, true)).orderBy(asc(modelosParceria.ordem));
}

export async function createModeloParceria(data: InsertModeloParceria) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(modelosParceria).values(data);
  return result[0].insertId;
}

export async function updateModeloParceria(id: number, data: Partial<InsertModeloParceria>) {
  const db = await getDb();
  if (!db) return;
  await db.update(modelosParceria).set(data).where(eq(modelosParceria.id, id));
}

// =============================================
// ---- COMISSÕES POR SERVIÇO ----
// =============================================

export async function listAllComissoes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comissoesServico);
}

export async function listComissoesByServico(servicoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comissoesServico).where(eq(comissoesServico.servicoId, servicoId));
}

export async function listComissoesByModelo(modeloParceriaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comissoesServico).where(eq(comissoesServico.modeloParceriaId, modeloParceriaId));
}

export async function upsertComissaoServico(servicoId: number, modeloParceriaId: number, percentualComissao: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(comissoesServico)
    .where(and(eq(comissoesServico.servicoId, servicoId), eq(comissoesServico.modeloParceriaId, modeloParceriaId)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(comissoesServico).set({ percentualComissao }).where(eq(comissoesServico.id, existing[0].id));
  } else {
    await db.insert(comissoesServico).values({ servicoId, modeloParceriaId, percentualComissao });
  }
}

// =============================================
// ---- PARCEIRO-SERVIÇO ----
// =============================================

export async function listParceiroServicos(parceiroId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parceiroServicos).where(eq(parceiroServicos.parceiroId, parceiroId));
}

export async function addParceiroServico(data: InsertParceiroServico) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(parceiroServicos).values(data);
  return result[0].insertId;
}

export async function updateParceiroServico(id: number, data: Partial<InsertParceiroServico>) {
  const db = await getDb();
  if (!db) return;
  await db.update(parceiroServicos).set(data).where(eq(parceiroServicos.id, id));
}

export async function removeParceiroServico(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(parceiroServicos).where(eq(parceiroServicos.id, id));
}

// =============================================
// ---- SLA CONFIGURAÇÕES ----
// =============================================

export async function listSlaConfiguracoes(setorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (setorId) {
    return db.select().from(slaConfiguracoes).where(eq(slaConfiguracoes.setorId, setorId)).orderBy(asc(slaConfiguracoes.nome));
  }
  return db.select().from(slaConfiguracoes).orderBy(asc(slaConfiguracoes.nome));
}

export async function createSlaConfiguracao(data: InsertSlaConfiguracao) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(slaConfiguracoes).values(data);
  return result[0].insertId;
}

export async function updateSlaConfiguracao(id: number, data: Partial<InsertSlaConfiguracao>) {
  const db = await getDb();
  if (!db) return;
  await db.update(slaConfiguracoes).set(data).where(eq(slaConfiguracoes.id, id));
}

export async function deleteSlaConfiguracao(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(slaConfiguracoes).where(eq(slaConfiguracoes.id, id));
}

// =============================================
// ---- ETAPAS DE SERVIÇO ----
// =============================================

export async function listServicoEtapas(servicoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(servicoEtapas).where(eq(servicoEtapas.servicoId, servicoId)).orderBy(asc(servicoEtapas.ordem));
}

export async function createServicoEtapa(data: InsertServicoEtapa) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(servicoEtapas).values(data);
  return result[0].insertId;
}

export async function updateServicoEtapa(id: number, data: Partial<InsertServicoEtapa>) {
  const db = await getDb();
  if (!db) return;
  await db.update(servicoEtapas).set(data).where(eq(servicoEtapas.id, id));
}

export async function deleteServicoEtapa(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(servicoEtapas).where(eq(servicoEtapas.id, id));
}

// =============================================
// ---- CLIENTE-SERVIÇO ----
// =============================================

export async function listClienteServicos(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clienteServicos).where(eq(clienteServicos.clienteId, clienteId));
}

export async function addClienteServico(data: InsertClienteServico) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(clienteServicos).values(data);
  return result[0].insertId;
}

export async function updateClienteServico(id: number, data: Partial<InsertClienteServico>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clienteServicos).set(data).where(eq(clienteServicos.id, id));
}

// =============================================
// ---- SUBPARCEIROS ----
// =============================================

export async function listSubparceiros(parceiroPaiId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parceiros).where(eq(parceiros.parceiroPaiId, parceiroPaiId)).orderBy(asc(parceiros.nomeCompleto));
}

export async function getParceiroById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(parceiros).where(eq(parceiros.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listParceirosPrincipais() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parceiros)
    .where(eq(parceiros.ehSubparceiro, 0))
    .orderBy(asc(parceiros.nomeCompleto));
}

export async function syncParceiroServicos(parceiroId: number, servicoIds: number[]) {
  const db = await getDb();
  if (!db) return;
  // Remove todos os serviços atuais
  await db.delete(parceiroServicos).where(eq(parceiroServicos.parceiroId, parceiroId));
  // Adiciona os novos
  for (const servicoId of servicoIds) {
    await db.insert(parceiroServicos).values({ parceiroId, servicoId } as any);
  }
}


// =============================================
// ---- EXECUTIVOS COMERCIAIS ----
// =============================================

export async function listExecutivos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(executivosComerciais).orderBy(asc(executivosComerciais.nome));
}

export async function getExecutivoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(executivosComerciais).where(eq(executivosComerciais.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createExecutivo(data: InsertExecutivoComercial) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(executivosComerciais).values(data).$returningId();
  return result[0]?.id;
}

export async function updateExecutivo(id: number, data: Partial<InsertExecutivoComercial>) {
  const db = await getDb();
  if (!db) return;
  await db.update(executivosComerciais).set(data).where(eq(executivosComerciais.id, id));
}

export async function deleteExecutivo(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(executivosComerciais).where(eq(executivosComerciais.id, id));
}

// =============================================
// ---- RATEIO DE COMISSÃO ----
// =============================================

export async function listRateioByParceiro(parceiroId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rateioComissao).where(eq(rateioComissao.parceiroId, parceiroId));
}

export async function upsertRateio(data: InsertRateioComissao) {
  const db = await getDb();
  if (!db) return null;
  // Check if exists
  const existing = await db.select().from(rateioComissao)
    .where(and(
      eq(rateioComissao.parceiroId, data.parceiroId),
      eq(rateioComissao.servicoId, data.servicoId),
    )).limit(1);
  if (existing.length > 0) {
    await db.update(rateioComissao).set(data).where(eq(rateioComissao.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(rateioComissao).values(data).$returningId();
    return result[0]?.id;
  }
}

export async function deleteRateio(parceiroId: number, servicoId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(rateioComissao).where(and(
    eq(rateioComissao.parceiroId, parceiroId),
    eq(rateioComissao.servicoId, servicoId),
  ));
}

// =============================================
// ---- APROVAÇÃO DE COMISSÃO ----
// =============================================

export async function listAprovacoesPendentes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aprovacaoComissao)
    .where(eq(aprovacaoComissao.status, 'pendente'))
    .orderBy(desc(aprovacaoComissao.solicitadoEm));
}

export async function listAllAprovacoes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aprovacaoComissao)
    .orderBy(desc(aprovacaoComissao.solicitadoEm));
}

export async function createAprovacaoComissao(data: typeof aprovacaoComissao.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(aprovacaoComissao).values(data).$returningId();
  return result[0]?.id;
}

export async function updateAprovacaoStatus(id: number, status: 'aprovado' | 'rejeitado', aprovadoPorId: number, observacao?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(aprovacaoComissao).set({
    status,
    aprovadoPorId,
    aprovadoEm: new Date(),
    observacao: observacao || null,
  }).where(eq(aprovacaoComissao.id, id));
}

// =============================================
// ---- HISTÓRICO DE USUÁRIOS ----
// =============================================

export async function createUserHistoryEntry(data: InsertUserHistory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userHistory).values(data).$returningId();
  return result[0]?.id;
}

export async function listUserHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userHistory)
    .where(eq(userHistory.userId, userId))
    .orderBy(desc(userHistory.createdAt));
}

export async function listAllUserHistory() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userHistory)
    .orderBy(desc(userHistory.createdAt))
    .limit(500);
}

// =============================================
// ---- CHAT: CANAIS ----
// =============================================

export async function listChatChannels(includeAll = false) {
  const db = await getDb();
  if (!db) return [];
  if (includeAll) {
    return db.select().from(chatChannels)
      .orderBy(chatChannels.tipo, chatChannels.nome);
  }
  return db.select().from(chatChannels)
    .where(sql`${chatChannels.status} != 'deleted'`)
    .orderBy(chatChannels.tipo, chatChannels.nome);
}

export async function getChatChannel(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(chatChannels).where(sql`${chatChannels.id} = ${id}`);
  return rows[0] || null;
}

export async function createChatChannel(data: InsertChatChannel) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatChannels).values(data).$returningId();
  return result[0]?.id;
}

// ---- CHAT: MENSAGENS ----
// =============================================

export async function createChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatMessages).values(data).$returningId();
  return result[0]?.id;
}

export async function listChatMessages(channelId: number, limit = 100, beforeId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (beforeId) {
    return db.select().from(chatMessages)
      .where(sql`${chatMessages.channelId} = ${channelId} AND ${chatMessages.id} < ${beforeId}`)
      .orderBy(desc(chatMessages.id))
      .limit(limit);
  }
  return db.select().from(chatMessages)
    .where(sql`${chatMessages.channelId} = ${channelId}`)
    .orderBy(desc(chatMessages.id))
    .limit(limit);
}

// Admin: soft-delete a message
export async function deleteChatMessage(messageId: number, deletedByUserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`UPDATE chat_messages SET deletedAt = NOW(), deletedBy = ${deletedByUserId}, content = '[Mensagem excluída pelo administrador]' WHERE id = ${messageId}`
  );
}

// Admin: clear all messages in a channel
export async function clearChatChannel(channelId: number, deletedByUserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`UPDATE chat_messages SET deletedAt = NOW(), deletedBy = ${deletedByUserId}, content = '[Mensagem excluída pelo administrador]' WHERE channelId = ${channelId} AND deletedAt IS NULL`
  );
}

// Admin: toggle channel active/inactive
export async function toggleChatChannel(channelId: number, ativo: boolean) {
  const db = await getDb();
  if (!db) return;
  const newStatus = ativo ? 'active' : 'inactive';
  await db.execute(
    sql`UPDATE chat_channels SET ativo = ${ativo}, status = ${newStatus} WHERE id = ${channelId}`
  );
}

// Admin: soft-delete channel (move to trash)
export async function softDeleteChatChannel(channelId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`UPDATE chat_channels SET status = 'deleted', ativo = false WHERE id = ${channelId}`
  );
}

// Admin: restore channel from trash
export async function restoreChatChannel(channelId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`UPDATE chat_channels SET status = 'active', ativo = true WHERE id = ${channelId}`
  );
}

// Admin: update channel info
export async function updateChatChannel(channelId: number, data: { nome?: string; descricao?: string }) {
  const db = await getDb();
  if (!db) return;
  const sets: string[] = [];
  if (data.nome) sets.push(`nome = '${data.nome.replace(/'/g, "''")}'`);
  if (data.descricao !== undefined) sets.push(`descricao = '${(data.descricao || '').replace(/'/g, "''")}'`);
  if (sets.length > 0) {
    await db.execute(sql.raw(`UPDATE chat_channels SET ${sets.join(', ')} WHERE id = ${channelId}`));
  }
}

export async function searchChatMessages(query: string, channelId?: number) {
  const db = await getDb();
  if (!db) return [];
  const like = `%${query}%`;
  if (channelId) {
    return db.select().from(chatMessages)
      .where(sql`${chatMessages.content} LIKE ${like} AND ${chatMessages.channelId} = ${channelId} AND ${chatMessages.deletedAt} IS NULL`)
      .orderBy(desc(chatMessages.id))
      .limit(50);
  }
  return db.select().from(chatMessages)
    .where(sql`${chatMessages.content} LIKE ${like} AND ${chatMessages.deletedAt} IS NULL`)
    .orderBy(desc(chatMessages.id))
    .limit(50);
}

// ---- CHAT: REAÇÕES ----
// =============================================

export async function addReaction(data: InsertChatReaction) {
  const db = await getDb();
  if (!db) return null;
  // Check if user already reacted with this emoji
  const existing = await db.select().from(chatReactions)
    .where(sql`${chatReactions.messageId} = ${data.messageId} AND ${chatReactions.userId} = ${data.userId} AND ${chatReactions.emoji} = ${data.emoji}`);
  if (existing.length > 0) return null; // already reacted
  const result = await db.insert(chatReactions).values(data).$returningId();
  return result[0]?.id;
}

export async function removeReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`DELETE FROM chat_reactions WHERE messageId = ${messageId} AND userId = ${userId} AND emoji = ${emoji}`
  );
}

export async function getReactionsForMessages(messageIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (messageIds.length === 0) return [];
  const idList = messageIds.join(',');
  const result = await db.execute(sql.raw(`SELECT * FROM chat_reactions WHERE messageId IN (${idList}) ORDER BY createdAt ASC`));
  return ((result as unknown as any[])[0] as any[]) || [];
}

// ---- CHAT: MENSAGENS FIXADAS (PIN) ----
// =============================================

export async function pinMessage(messageId: number, userId: number, userName: string) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`UPDATE chat_messages SET pinned = true, pinnedBy = ${userId}, pinnedByName = ${userName}, pinnedAt = NOW() WHERE id = ${messageId}`
  );
}

export async function unpinMessage(messageId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`UPDATE chat_messages SET pinned = false, pinnedBy = NULL, pinnedByName = NULL, pinnedAt = NULL WHERE id = ${messageId}`
  );
}

export async function getPinnedMessages(channelId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(sql`${chatMessages.channelId} = ${channelId} AND ${chatMessages.pinned} = true AND ${chatMessages.deletedAt} IS NULL`)
    .orderBy(desc(chatMessages.pinnedAt));
}

// ---- CHAT: NOTIFICAÇÕES ----
// =============================================

export async function createChatNotification(data: InsertChatNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatNotifications).values(data).$returningId();
  return result[0]?.id;
}

export async function listUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatNotifications)
    .where(sql`${chatNotifications.userId} = ${userId} AND ${chatNotifications.lida} = false`)
    .orderBy(desc(chatNotifications.createdAt))
    .limit(50);
}

export async function countUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, byChannel: [] as {channelId: number; count: number}[] };
  const [totalRows] = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM chat_notifications WHERE userId = ${userId} AND lida = false`
  );
  const total = (totalRows as any)[0]?.cnt || 0;
  const byChannelRows = await db.execute(
    sql`SELECT channelId, COUNT(*) as cnt FROM chat_notifications WHERE userId = ${userId} AND lida = false GROUP BY channelId`
  );
  const byChannel = ((byChannelRows as any)[0] || []).map((r: any) => ({ channelId: r.channelId, count: Number(r.cnt) }));
  return { total: Number(total), byChannel };
}

export async function markNotificationsRead(userId: number, channelId?: number) {
  const db = await getDb();
  if (!db) return;
  if (channelId) {
    await db.execute(
      sql`UPDATE chat_notifications SET lida = true WHERE userId = ${userId} AND channelId = ${channelId}`
    );
  } else {
    await db.execute(
      sql`UPDATE chat_notifications SET lida = true WHERE userId = ${userId}`
    );
  }
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`UPDATE chat_notifications SET lida = true WHERE userId = ${userId}`
  );
}


// ============================================================
// MÓDULO RH — GENTE & GESTÃO
// ============================================================

// ---- COLABORADORES ----
export async function listColaboradores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(colaboradores).orderBy(desc(colaboradores.createdAt));
}

export async function getColaboradorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(colaboradores).where(eq(colaboradores.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getColaboradorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(colaboradores).where(eq(colaboradores.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createColaborador(data: InsertColaborador) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(colaboradores).values(data);
  return result[0].insertId;
}

export async function updateColaborador(id: number, data: Partial<InsertColaborador>) {
  const db = await getDb();
  if (!db) return;
  await db.update(colaboradores).set(data).where(eq(colaboradores.id, id));
}

export async function deleteColaborador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(colaboradores).set({ ativo: false }).where(eq(colaboradores.id, id));
}

// ---- FÉRIAS ----
export async function listFerias(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(ferias).where(eq(ferias.colaboradorId, colaboradorId)).orderBy(desc(ferias.createdAt));
  }
  return db.select().from(ferias).orderBy(desc(ferias.createdAt));
}

export async function getFeriasById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(ferias).where(eq(ferias.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createFerias(data: InsertFerias) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(ferias).values(data);
  return result[0].insertId;
}

export async function updateFerias(id: number, data: Partial<InsertFerias>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ferias).set(data).where(eq(ferias.id, id));
}

export async function deleteFerias(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ferias).where(eq(ferias.id, id));
}

// ---- SOLICITAÇÕES DE FOLGA ----
export async function listSolicitacoesFolga(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(solicitacoesFolga).where(eq(solicitacoesFolga.colaboradorId, colaboradorId)).orderBy(desc(solicitacoesFolga.createdAt));
  }
  return db.select().from(solicitacoesFolga).orderBy(desc(solicitacoesFolga.createdAt));
}

export async function createSolicitacaoFolga(data: InsertSolicitacaoFolga) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(solicitacoesFolga).values(data);
  return result[0].insertId;
}

export async function updateSolicitacaoFolga(id: number, data: Partial<InsertSolicitacaoFolga>) {
  const db = await getDb();
  if (!db) return;
  await db.update(solicitacoesFolga).set(data).where(eq(solicitacoesFolga.id, id));
}

// ---- TAREFAS DO SETOR ----
export async function listTarefasSetor(setorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (setorId) {
    return db.select().from(tarefasSetor).where(eq(tarefasSetor.setorId, setorId)).orderBy(desc(tarefasSetor.createdAt));
  }
  return db.select().from(tarefasSetor).orderBy(desc(tarefasSetor.createdAt));
}

export async function createTarefaSetor(data: InsertTarefaSetor) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tarefasSetor).values(data);
  return result[0].insertId;
}

export async function updateTarefaSetor(id: number, data: Partial<InsertTarefaSetor>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tarefasSetor).set(data).where(eq(tarefasSetor.id, id));
}

export async function deleteTarefaSetor(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tarefasSetor).where(eq(tarefasSetor.id, id));
}

// ---- AÇÕES E BENEFÍCIOS ----
export async function listAcoesBeneficios() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(acoesBeneficios).orderBy(desc(acoesBeneficios.createdAt));
}

export async function createAcaoBeneficio(data: InsertAcaoBeneficio) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(acoesBeneficios).values(data);
  return result[0].insertId;
}

export async function updateAcaoBeneficio(id: number, data: Partial<InsertAcaoBeneficio>) {
  const db = await getDb();
  if (!db) return;
  await db.update(acoesBeneficios).set(data).where(eq(acoesBeneficios.id, id));
}

export async function deleteAcaoBeneficio(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(acoesBeneficios).where(eq(acoesBeneficios.id, id));
}

// ---- ATESTADOS E LICENÇAS ----
export async function listAtestadosLicencas(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(atestadosLicencas).where(eq(atestadosLicencas.colaboradorId, colaboradorId)).orderBy(desc(atestadosLicencas.createdAt));
  }
  return db.select().from(atestadosLicencas).orderBy(desc(atestadosLicencas.createdAt));
}

export async function createAtestadoLicenca(data: InsertAtestadoLicenca) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(atestadosLicencas).values(data);
  return result[0].insertId;
}

export async function updateAtestadoLicenca(id: number, data: Partial<InsertAtestadoLicenca>) {
  const db = await getDb();
  if (!db) return;
  await db.update(atestadosLicencas).set(data).where(eq(atestadosLicencas.id, id));
}

// ---- PLANOS DE CARREIRA ----
export async function listPlanosCarreira(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(planosCarreira).where(eq(planosCarreira.colaboradorId, colaboradorId)).orderBy(desc(planosCarreira.createdAt));
  }
  return db.select().from(planosCarreira).orderBy(desc(planosCarreira.createdAt));
}

export async function createPlanoCarreira(data: InsertPlanoCarreira) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(planosCarreira).values(data);
  return result[0].insertId;
}

export async function updatePlanoCarreira(id: number, data: Partial<InsertPlanoCarreira>) {
  const db = await getDb();
  if (!db) return;
  await db.update(planosCarreira).set(data).where(eq(planosCarreira.id, id));
}

export async function deletePlanoCarreira(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(planosCarreira).where(eq(planosCarreira.id, id));
}


// ---- CICLOS DE AVALIAÇÃO ----
import { ciclosAvaliacao, InsertCicloAvaliacao, avaliacoes, InsertAvaliacao, colaboradorDocumentos, InsertColaboradorDocumento } from "../drizzle/schema";

export async function listCiclosAvaliacao() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ciclosAvaliacao).orderBy(desc(ciclosAvaliacao.createdAt));
}

export async function getCicloAvaliacaoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(ciclosAvaliacao).where(eq(ciclosAvaliacao.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCicloAvaliacao(data: InsertCicloAvaliacao) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(ciclosAvaliacao).values(data);
  return result[0].insertId;
}

export async function updateCicloAvaliacao(id: number, data: Partial<InsertCicloAvaliacao>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ciclosAvaliacao).set(data).where(eq(ciclosAvaliacao.id, id));
}

export async function deleteCicloAvaliacao(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ciclosAvaliacao).where(eq(ciclosAvaliacao.id, id));
}

// ---- AVALIAÇÕES ----
export async function listAvaliacoes(cicloId?: number, colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (cicloId && colaboradorId) {
    return db.select().from(avaliacoes).where(and(eq(avaliacoes.cicloId, cicloId), eq(avaliacoes.colaboradorId, colaboradorId))).orderBy(desc(avaliacoes.createdAt));
  }
  if (cicloId) {
    return db.select().from(avaliacoes).where(eq(avaliacoes.cicloId, cicloId)).orderBy(desc(avaliacoes.createdAt));
  }
  if (colaboradorId) {
    return db.select().from(avaliacoes).where(eq(avaliacoes.colaboradorId, colaboradorId)).orderBy(desc(avaliacoes.createdAt));
  }
  return db.select().from(avaliacoes).orderBy(desc(avaliacoes.createdAt));
}

export async function createAvaliacao(data: InsertAvaliacao) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(avaliacoes).values(data);
  return result[0].insertId;
}

export async function updateAvaliacao(id: number, data: Partial<InsertAvaliacao>) {
  const db = await getDb();
  if (!db) return;
  await db.update(avaliacoes).set(data).where(eq(avaliacoes.id, id));
}

export async function deleteAvaliacao(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(avaliacoes).where(eq(avaliacoes.id, id));
}

// ---- DOCUMENTOS DO COLABORADOR ----
export async function listColaboradorDocumentos(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(colaboradorDocumentos).where(eq(colaboradorDocumentos.colaboradorId, colaboradorId)).orderBy(desc(colaboradorDocumentos.createdAt));
  }
  return db.select().from(colaboradorDocumentos).orderBy(desc(colaboradorDocumentos.createdAt));
}

export async function createColaboradorDocumento(data: InsertColaboradorDocumento) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(colaboradorDocumentos).values(data);
  return result[0].insertId;
}

export async function deleteColaboradorDocumento(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(colaboradorDocumentos).where(eq(colaboradorDocumentos.id, id));
}

import { metasIndividuais, InsertMetaIndividual } from "../drizzle/schema";

// ---- METAS INDIVIDUAIS (KPIs) ----
export async function listMetasIndividuais(colaboradorId?: number, cicloId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId && cicloId) {
    return db.select().from(metasIndividuais).where(and(eq(metasIndividuais.colaboradorId, colaboradorId), eq(metasIndividuais.cicloId, cicloId))).orderBy(desc(metasIndividuais.createdAt));
  }
  if (colaboradorId) {
    return db.select().from(metasIndividuais).where(eq(metasIndividuais.colaboradorId, colaboradorId)).orderBy(desc(metasIndividuais.createdAt));
  }
  if (cicloId) {
    return db.select().from(metasIndividuais).where(eq(metasIndividuais.cicloId, cicloId)).orderBy(desc(metasIndividuais.createdAt));
  }
  return db.select().from(metasIndividuais).orderBy(desc(metasIndividuais.createdAt));
}

export async function getMetaIndividualById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(metasIndividuais).where(eq(metasIndividuais.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createMetaIndividual(data: InsertMetaIndividual) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(metasIndividuais).values(data);
  return result[0].insertId;
}

export async function updateMetaIndividual(id: number, data: Partial<InsertMetaIndividual>) {
  const db = await getDb();
  if (!db) return;
  await db.update(metasIndividuais).set(data).where(eq(metasIndividuais.id, id));
}

export async function deleteMetaIndividual(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(metasIndividuais).where(eq(metasIndividuais.id, id));
}

// ---- NOTIFICAÇÕES DE AVALIAÇÃO ----
export async function notificarCicloAberto(cicloTitulo: string, cicloId: number) {
  const db = await getDb();
  if (!db) return;
  // Get all active users to notify
  const allUsers = await db.select({ id: users.id }).from(users).where(eq(users.ativo, true));
  for (const u of allUsers) {
    await db.insert(notificacoes).values({
      tipo: 'avaliacao_ciclo_aberto' as any,
      titulo: 'Novo Ciclo de Avaliação Aberto',
      mensagem: `O ciclo de avaliação "${cicloTitulo}" foi aberto. Acesse o módulo de Avaliação 360° para participar.`,
      usuarioId: u.id,
    });
  }
}

export async function notificarAvaliacaoPendente(colaboradorNome: string, avaliadorUserId: number | null, cicloTitulo: string) {
  const db = await getDb();
  if (!db || !avaliadorUserId) return;
  await db.insert(notificacoes).values({
    tipo: 'avaliacao_pendente' as any,
    titulo: 'Avaliação Pendente',
    mensagem: `Você tem uma avaliação pendente para ${colaboradorNome} no ciclo "${cicloTitulo}". Acesse o módulo de Avaliação 360° para completar.`,
    usuarioId: avaliadorUserId,
  });
}

// ---- HISTÓRICO DE STATUS DO COLABORADOR ----
export async function listHistoricoStatus(colaboradorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(historicoStatusColaborador)
    .where(eq(historicoStatusColaborador.colaboradorId, colaboradorId))
    .orderBy(desc(historicoStatusColaborador.createdAt));
}

export async function createHistoricoStatus(data: InsertHistoricoStatusColaborador) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(historicoStatusColaborador).values(data);
  return result[0].insertId;
}

// Helper: change colaborador status with audit trail
export async function changeColaboradorStatus(
  colaboradorId: number,
  novoStatus: string,
  motivo: string,
  origemModulo: string,
  origemRegistroId: number | null,
  alteradoPorId: number | null,
  alteradoPorNome: string
) {
  const db = await getDb();
  if (!db) return;
  // Get current status
  const [colab] = await db.select({ statusColaborador: colaboradores.statusColaborador })
    .from(colaboradores)
    .where(eq(colaboradores.id, colaboradorId))
    .limit(1);
  if (!colab) return;
  const statusAnterior = colab.statusColaborador || 'ativo';
  if (statusAnterior === novoStatus) return; // no change needed
  // Update status
  await db.update(colaboradores)
    .set({ statusColaborador: novoStatus as any })
    .where(eq(colaboradores.id, colaboradorId));
  // Record history
  await db.insert(historicoStatusColaborador).values({
    colaboradorId,
    statusAnterior,
    statusNovo: novoStatus,
    motivo,
    origemModulo,
    origemRegistroId,
    alteradoPorId,
    alteradoPorNome,
  });
}

// =============================================
// ---- ANIVERSARIANTES DO MÊS ----
// =============================================

export async function getAniversariantesMes(mes?: number) {
  const db = await getDb();
  if (!db) return [];
  const mesAtual = mes || (new Date().getMonth() + 1);
  const mesStr = String(mesAtual).padStart(2, '0');
  const rows = await db.select().from(colaboradores)
    .where(sql`SUBSTRING(${colaboradores.dataNascimento}, 6, 2) = ${mesStr}`)
    .orderBy(sql`SUBSTRING(${colaboradores.dataNascimento}, 9, 2) ASC`);
  return rows;
}

// =============================================
// ---- CONTRATOS PRÓXIMOS DO VENCIMENTO ----
// =============================================

export async function getContratosVencendo(diasAntecedencia: number = 30) {
  const db = await getDb();
  if (!db) return [];
  // Buscar colaboradores com períodos de experiência definidos e status ativo/experiencia
  const rows = await db.select().from(colaboradores)
    .where(
      and(
        sql`${colaboradores.statusColaborador} IN ('ativo', 'experiencia')`,
        isNotNull(colaboradores.dataAdmissao),
        sql`(${colaboradores.periodoExperiencia1Fim} IS NOT NULL OR ${colaboradores.periodoExperiencia2Fim} IS NOT NULL)`,
      )
    );
  
  const hoje = new Date();
  const resultado: any[] = [];
  
  for (const c of rows) {
    if (!c.dataAdmissao) continue;
    // Check both experience periods
    const periodos = [
      { inicio: c.periodoExperiencia1Inicio, fim: c.periodoExperiencia1Fim, label: '1º Período' },
      { inicio: c.periodoExperiencia2Inicio, fim: c.periodoExperiencia2Fim, label: '2º Período' },
    ];
    for (const p of periodos) {
      if (!p.fim) continue;
      const vencimento = new Date(p.fim);
      const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDias >= 0 && diffDias <= diasAntecedencia) {
        resultado.push({
          ...c,
          periodoLabel: p.label,
          dataVencimento: p.fim,
          diasRestantes: diffDias,
        });
      }
    }
  }
  
  return resultado.sort((a, b) => a.diasRestantes - b.diasRestantes);
}

// =============================================
// ---- E-MAIL ANIVERSARIANTES ----
// =============================================

export async function getEmailAniversarianteConfig() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(
    sql`SELECT * FROM email_aniversariante_config ORDER BY id DESC LIMIT 1`
  );
  const result = (rows as any)[0];
  return result?.[0] || null;
}

export async function upsertEmailAniversarianteConfig(data: {
  assunto: string;
  mensagem: string;
  assinatura: string;
  ativo: boolean;
}) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getEmailAniversarianteConfig();
  if (existing) {
    await db.execute(
      sql`UPDATE email_aniversariante_config SET assunto = ${data.assunto}, mensagem = ${data.mensagem}, assinatura = ${data.assinatura}, ativo = ${data.ativo}, updatedAt = NOW() WHERE id = ${existing.id}`
    );
    return existing.id;
  } else {
    const result = await db.execute(
      sql`INSERT INTO email_aniversariante_config (assunto, mensagem, assinatura, ativo) VALUES (${data.assunto}, ${data.mensagem}, ${data.assinatura}, ${data.ativo})`
    );
    return (result as any)[0]?.insertId;
  }
}

export async function registrarEmailAniversarianteEnviado(colaboradorId: number, ano: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`INSERT IGNORE INTO email_aniversariante_log (colaboradorId, ano, enviadoEm) VALUES (${colaboradorId}, ${ano}, NOW())`
  );
}

export async function getEmailsAniversarianteEnviados(ano: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT colaboradorId FROM email_aniversariante_log WHERE ano = ${ano}`
  );
  return ((rows as any)[0] || []).map((r: any) => r.colaboradorId);
}

// =============================================
// ---- NOTIFICAÇÕES ANTECIPADAS DE ANIVERSÁRIO ----
// =============================================

export async function registrarNotificacaoAniversarioAntecipada(colaboradorId: number, ano: number, diasAntes: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`INSERT IGNORE INTO birthday_advance_notifications (colaboradorId, ano, diasAntes, enviadoEm) VALUES (${colaboradorId}, ${ano}, ${diasAntes}, NOW())`
  );
}

export async function getNotificacoesAniversarioEnviadas(ano: number, diasAntes: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT colaboradorId FROM birthday_advance_notifications WHERE ano = ${ano} AND diasAntes = ${diasAntes}`
  );
  return ((rows as any)[0] || []).map((r: any) => r.colaboradorId);
}

// =============================================
// ---- WORKFLOW RENOVAÇÃO CONTRATO ----
// =============================================

export async function getWorkflowContratoCriado(colaboradorId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(
    sql`SELECT * FROM workflow_renovacao_contrato WHERE colaboradorId = ${colaboradorId} AND status = 'pendente' LIMIT 1`
  );
  const result = (rows as any)[0];
  return result?.[0] || null;
}

export async function criarWorkflowRenovacao(data: {
  colaboradorId: number;
  colaboradorNome: string;
  cargo: string;
  dataVencimento: string;
  diasRestantes: number;
  tarefaId: number | null;
  criadoPorId: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.execute(
    sql`INSERT INTO workflow_renovacao_contrato (colaboradorId, colaboradorNome, cargo, dataVencimento, diasRestantes, tarefaId, criadoPorId, status) VALUES (${data.colaboradorId}, ${data.colaboradorNome}, ${data.cargo}, ${data.dataVencimento}, ${data.diasRestantes}, ${data.tarefaId}, ${data.criadoPorId}, 'pendente')`
  );
  return (result as any)[0]?.insertId;
}

export async function updateWorkflowRenovacao(id: number, data: { status: string; decisao?: string; observacao?: string }) {
  const db = await getDb();
  if (!db) return;
  if (data.decisao) {
    await db.execute(
      sql`UPDATE workflow_renovacao_contrato SET status = ${data.status}, decisao = ${data.decisao}, observacao = ${data.observacao || ''}, resolvidoEm = NOW() WHERE id = ${id}`
    );
  } else {
    await db.execute(
      sql`UPDATE workflow_renovacao_contrato SET status = ${data.status} WHERE id = ${id}`
    );
  }
}

export async function listWorkflowsRenovacao(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    const rows = await db.execute(
      sql`SELECT * FROM workflow_renovacao_contrato WHERE status = ${status} ORDER BY diasRestantes ASC`
    );
    return (rows as any)[0] || [];
  }
  const rows = await db.execute(
    sql`SELECT * FROM workflow_renovacao_contrato ORDER BY createdAt DESC`
  );
  return (rows as any)[0] || [];
}

// =============================================
// ---- ONBOARDING DIGITAL ----
// =============================================

export async function listOnboardingTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingTemplates).orderBy(desc(onboardingTemplates.createdAt));
}

export async function createOnboardingTemplate(data: InsertOnboardingTemplate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(onboardingTemplates).values(data);
  return result.insertId;
}

export async function updateOnboardingTemplate(id: number, data: Partial<InsertOnboardingTemplate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(onboardingTemplates).set(data).where(eq(onboardingTemplates.id, id));
}

export async function deleteOnboardingTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(onboardingEtapasTemplate).where(eq(onboardingEtapasTemplate.templateId, id));
  await db.delete(onboardingTemplates).where(eq(onboardingTemplates.id, id));
}

export async function listEtapasTemplate(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingEtapasTemplate)
    .where(eq(onboardingEtapasTemplate.templateId, templateId))
    .orderBy(onboardingEtapasTemplate.ordem);
}

export async function createEtapaTemplate(data: InsertOnboardingEtapaTemplate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(onboardingEtapasTemplate).values(data);
  return result.insertId;
}

export async function deleteEtapaTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(onboardingEtapasTemplate).where(eq(onboardingEtapasTemplate.id, id));
}

export async function listOnboardingColaborador(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(onboardingColaborador)
      .where(eq(onboardingColaborador.colaboradorId, colaboradorId))
      .orderBy(desc(onboardingColaborador.createdAt));
  }
  return db.select().from(onboardingColaborador).orderBy(desc(onboardingColaborador.createdAt));
}

export async function createOnboardingColaborador(data: InsertOnboardingColaborador) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(onboardingColaborador).values(data);
  return result.insertId;
}

export async function updateOnboardingColaborador(id: number, data: Partial<InsertOnboardingColaborador>) {
  const db = await getDb();
  if (!db) return;
  await db.update(onboardingColaborador).set(data).where(eq(onboardingColaborador.id, id));
}

export async function listOnboardingEtapas(onboardingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingEtapas)
    .where(eq(onboardingEtapas.onboardingId, onboardingId))
    .orderBy(onboardingEtapas.ordem);
}

export async function createOnboardingEtapa(data: InsertOnboardingEtapa) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(onboardingEtapas).values(data);
  return result.insertId;
}

export async function updateOnboardingEtapa(id: number, data: Partial<InsertOnboardingEtapa>) {
  const db = await getDb();
  if (!db) return;
  await db.update(onboardingEtapas).set(data).where(eq(onboardingEtapas.id, id));
}

export async function iniciarOnboardingFromTemplate(
  colaboradorId: number, colaboradorNome: string,
  templateId: number, templateNome: string,
  criadoPorId: number, criadoPorNome: string
) {
  const db = await getDb();
  if (!db) return null;
  const etapasTemplate = await listEtapasTemplate(templateId);
  const today = new Date().toISOString().split("T")[0];
  const [result] = await db.insert(onboardingColaborador).values({
    colaboradorId, colaboradorNome, templateId, templateNome,
    status: "em_andamento", dataInicio: today,
    criadoPorId, criadoPorNome,
  });
  const onboardingId = result.insertId;
  for (const et of etapasTemplate) {
    await db.insert(onboardingEtapas).values({
      onboardingId, titulo: et.titulo, descricao: et.descricao,
      categoria: et.categoria, ordem: et.ordem, obrigatoria: et.obrigatoria,
      prazoEmDias: et.prazoEmDias, status: "pendente",
    });
  }
  return onboardingId;
}

// =============================================
// ---- PESQUISA DE CLIMA ----
// =============================================

export async function listPesquisasClima() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pesquisasClima).orderBy(desc(pesquisasClima.createdAt));
}

export async function createPesquisaClima(data: InsertPesquisaClima) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(pesquisasClima).values(data);
  return result.insertId;
}

export async function updatePesquisaClima(id: number, data: Partial<InsertPesquisaClima>) {
  const db = await getDb();
  if (!db) return;
  await db.update(pesquisasClima).set(data).where(eq(pesquisasClima.id, id));
}

export async function deletePesquisaClima(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(respostasClima).where(eq(respostasClima.pesquisaId, id));
  await db.delete(perguntasClima).where(eq(perguntasClima.pesquisaId, id));
  await db.delete(pesquisasClima).where(eq(pesquisasClima.id, id));
}

export async function listPerguntasClima(pesquisaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(perguntasClima)
    .where(eq(perguntasClima.pesquisaId, pesquisaId))
    .orderBy(perguntasClima.ordem);
}

export async function createPerguntaClima(data: InsertPerguntaClima) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(perguntasClima).values(data);
  return result.insertId;
}

export async function deletePerguntaClima(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(respostasClima).where(eq(respostasClima.perguntaId, id));
  await db.delete(perguntasClima).where(eq(perguntasClima.id, id));
}

export async function submitRespostasClima(pesquisaId: number, respostas: InsertRespostaClima[]) {
  const db = await getDb();
  if (!db) return;
  if (respostas.length > 0) {
    await db.insert(respostasClima).values(respostas);
  }
  // Increment total responses count
  await db.execute(
    sql`UPDATE pesquisas_clima SET totalRespostas = totalRespostas + 1 WHERE id = ${pesquisaId}`
  );
}

export async function getResultadosClima(pesquisaId: number) {
  const db = await getDb();
  if (!db) return { perguntas: [], respostas: [] };
  const perguntas = await db.select().from(perguntasClima)
    .where(eq(perguntasClima.pesquisaId, pesquisaId))
    .orderBy(perguntasClima.ordem);
  const respostas = await db.select().from(respostasClima)
    .where(eq(respostasClima.pesquisaId, pesquisaId));
  return { perguntas, respostas };
}

// =============================================
// ---- BANCO DE HORAS ----
// =============================================

export async function listBancoHoras(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(bancoHoras)
      .where(eq(bancoHoras.colaboradorId, colaboradorId))
      .orderBy(desc(bancoHoras.data));
  }
  return db.select().from(bancoHoras).orderBy(desc(bancoHoras.data));
}

export async function createBancoHoras(data: InsertBancoHoras) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(bancoHoras).values(data);
  return result.insertId;
}

export async function updateBancoHoras(id: number, data: Partial<InsertBancoHoras>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bancoHoras).set(data).where(eq(bancoHoras.id, id));
}

export async function deleteBancoHoras(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bancoHoras).where(eq(bancoHoras.id, id));
}

export async function getSaldoBancoHoras(colaboradorId: number) {
  const db = await getDb();
  if (!db) return { saldo: 0, extras: 0, compensacoes: 0 };
  const registros = await db.select().from(bancoHoras)
    .where(and(eq(bancoHoras.colaboradorId, colaboradorId), eq(bancoHoras.aprovado, true)));
  let extras = 0;
  let compensacoes = 0;
  for (const r of registros) {
    const h = Number(r.horas);
    if (r.tipo === "extra" || r.tipo === "ajuste_positivo") extras += h;
    else compensacoes += h;
  }
  return { saldo: extras - compensacoes, extras, compensacoes };
}

export async function getSaldosBancoHorasAll() {
  const db = await getDb();
  if (!db) return [];
  const registros = await db.select().from(bancoHoras).where(eq(bancoHoras.aprovado, true));
  const map: Record<number, { colaboradorId: number; colaboradorNome: string; extras: number; compensacoes: number }> = {};
  for (const r of registros) {
    if (!map[r.colaboradorId]) {
      map[r.colaboradorId] = { colaboradorId: r.colaboradorId, colaboradorNome: r.colaboradorNome, extras: 0, compensacoes: 0 };
    }
    const h = Number(r.horas);
    if (r.tipo === "extra" || r.tipo === "ajuste_positivo") map[r.colaboradorId].extras += h;
    else map[r.colaboradorId].compensacoes += h;
  }
  return Object.values(map).map(m => ({ ...m, saldo: m.extras - m.compensacoes }));
}


// ---- CHAT: MENSAGENS PRIVADAS (DM) ----
// =============================================

export async function findOrCreateDmChannel(user1Id: number, user1Name: string, user2Id: number, user2Name: string) {
  const db = await getDb();
  if (!db) return null;
  // Normalize: smaller ID is always user1
  const [uid1, uname1, uid2, uname2] = user1Id < user2Id
    ? [user1Id, user1Name, user2Id, user2Name]
    : [user2Id, user2Name, user1Id, user1Name];
  // Check if DM channel already exists
  const existing = await db.select().from(chatChannels)
    .where(sql`${chatChannels.tipo} = 'dm' AND ${chatChannels.dmUser1Id} = ${uid1} AND ${chatChannels.dmUser2Id} = ${uid2} AND ${chatChannels.status} != 'deleted'`);
  if (existing.length > 0) return existing[0];
  // Create new DM channel
  const nome = `DM: ${uname1} & ${uname2}`;
  const result = await db.insert(chatChannels).values({
    nome,
    tipo: 'dm',
    dmUser1Id: uid1,
    dmUser2Id: uid2,
    criadoPorId: user1Id,
    criadoPorNome: user1Name,
    status: 'active',
    ativo: true,
  } as any).$returningId();
  const newId = result[0]?.id;
  if (!newId) return null;
  const rows = await db.select().from(chatChannels).where(sql`${chatChannels.id} = ${newId}`);
  return rows[0] || null;
}

export async function listDmChannelsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatChannels)
    .where(sql`${chatChannels.tipo} = 'dm' AND (${chatChannels.dmUser1Id} = ${userId} OR ${chatChannels.dmUser2Id} = ${userId}) AND ${chatChannels.status} != 'deleted'`)
    .orderBy(desc(chatChannels.updatedAt));
}

// ---- CHAT: INDICADOR DE DIGITAÇÃO ----
// =============================================

export async function setTyping(channelId: number, userId: number, userName: string, userAvatar: string | null) {
  const db = await getDb();
  if (!db) return;
  // Upsert: delete old entry then insert new
  await db.execute(
    sql`DELETE FROM chat_typing_indicators WHERE channelId = ${channelId} AND userId = ${userId}`
  );
  await db.insert(chatTypingIndicators).values({
    channelId,
    userId,
    userName,
    userAvatar,
  } as any);
}

export async function clearTyping(channelId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`DELETE FROM chat_typing_indicators WHERE channelId = ${channelId} AND userId = ${userId}`
  );
}

export async function getTypingUsers(channelId: number, excludeUserId: number) {
  const db = await getDb();
  if (!db) return [];
  // Only return indicators from the last 5 seconds (stale entries are ignored)
  return db.select().from(chatTypingIndicators)
    .where(sql`${chatTypingIndicators.channelId} = ${channelId} AND ${chatTypingIndicators.userId} != ${excludeUserId} AND ${chatTypingIndicators.startedAt} > DATE_SUB(NOW(), INTERVAL 5 SECOND)`);
}

export async function cleanupStaleTyping() {
  const db = await getDb();
  if (!db) return;
  // Remove typing indicators older than 10 seconds
  await db.execute(
    sql`DELETE FROM chat_typing_indicators WHERE startedAt < DATE_SUB(NOW(), INTERVAL 10 SECOND)`
  );
}

// ---- CHAT: UPLOAD DE ARQUIVOS ----
// =============================================

export async function createChatMessageWithFile(data: {
  channelId: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  content: string;
  mentions?: any[];
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatMessages).values({
    channelId: data.channelId,
    userId: data.userId,
    userName: data.userName,
    userAvatar: data.userAvatar,
    content: data.content,
    mentions: data.mentions || [],
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize,
  } as any).$returningId();
  return result[0]?.id;
}

// ============================================================
// CHAT: BUSCA GLOBAL, BUSCA DE ARQUIVOS, BUSCA POR USUÁRIO
// ============================================================

export async function searchChatMessagesGlobal(query: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const like = `%${query}%`;
  const rows = await db.execute(
    sql`SELECT m.*, c.nome as channelNome, c.tipo as channelTipo
        FROM chat_messages m
        JOIN chat_channels c ON m.channelId = c.id
        WHERE m.content LIKE ${like} AND m.deletedAt IS NULL
        ORDER BY m.id DESC
        LIMIT ${limit}`
  );
  return (rows as any)[0] || [];
}

export async function searchChatFiles(channelId?: number, fileType?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  if (channelId && fileType) {
    const likeType = `${fileType}%`;
    return db.select().from(chatMessages)
      .where(sql`${chatMessages.channelId} = ${channelId} AND ${chatMessages.fileUrl} IS NOT NULL AND ${chatMessages.fileUrl} != '' AND ${chatMessages.fileType} LIKE ${likeType} AND ${chatMessages.deletedAt} IS NULL`)
      .orderBy(desc(chatMessages.id))
      .limit(limit);
  }
  if (channelId) {
    return db.select().from(chatMessages)
      .where(sql`${chatMessages.channelId} = ${channelId} AND ${chatMessages.fileUrl} IS NOT NULL AND ${chatMessages.fileUrl} != '' AND ${chatMessages.deletedAt} IS NULL`)
      .orderBy(desc(chatMessages.id))
      .limit(limit);
  }
  if (fileType) {
    const likeType = `${fileType}%`;
    return db.select().from(chatMessages)
      .where(sql`${chatMessages.fileUrl} IS NOT NULL AND ${chatMessages.fileUrl} != '' AND ${chatMessages.fileType} LIKE ${likeType} AND ${chatMessages.deletedAt} IS NULL`)
      .orderBy(desc(chatMessages.id))
      .limit(limit);
  }
  return db.select().from(chatMessages)
    .where(sql`${chatMessages.fileUrl} IS NOT NULL AND ${chatMessages.fileUrl} != '' AND ${chatMessages.deletedAt} IS NULL`)
    .orderBy(desc(chatMessages.id))
    .limit(limit);
}

export async function searchChatMessagesByUser(channelId: number, userName: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const like = `%${userName}%`;
  return db.select().from(chatMessages)
    .where(sql`${chatMessages.channelId} = ${channelId} AND ${chatMessages.userName} LIKE ${like} AND ${chatMessages.deletedAt} IS NULL`)
    .orderBy(desc(chatMessages.id))
    .limit(limit);
}

export async function countUnreadByChannelForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT channelId, COUNT(*) as cnt FROM chat_notifications WHERE userId = ${userId} AND lida = false GROUP BY channelId`
  );
  return ((rows as any)[0] || []).map((r: any) => ({ channelId: r.channelId, count: Number(r.cnt) }));
}


// ============================================================
// THREADS / REPLIES
// ============================================================
export async function sendMessageWithReply(data: {
  channelId: number;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  content: string;
  mentions?: {type: 'user' | 'client'; id: number; name: string}[];
  replyToId?: number | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(chatMessages).values({
    channelId: data.channelId,
    userId: data.userId,
    userName: data.userName,
    userAvatar: data.userAvatar,
    content: data.content,
    mentions: data.mentions || [],
    replyToId: data.replyToId || null,
  });
  return { id: (result as any).insertId };
}

export async function getThreadMessages(parentMessageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(and(
      eq(chatMessages.replyToId, parentMessageId),
      isNull(chatMessages.deletedAt)
    ))
    .orderBy(asc(chatMessages.createdAt));
}

export async function getThreadCount(messageIds: number[]) {
  if (messageIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT replyToId, COUNT(*) as cnt FROM chat_messages WHERE replyToId IN (${sql.join(messageIds.map(id => sql`${id}`), sql`, `)}) AND deletedAt IS NULL GROUP BY replyToId`
  );
  return ((rows as any)[0] || []).map((r: any) => ({ messageId: Number(r.replyToId), count: Number(r.cnt) }));
}

export async function getMessageById(messageId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  return rows[0] || null;
}

// ============================================================
// USER PRESENCE (ONLINE/OFFLINE)
// ============================================================
export async function updatePresence(userId: number, userName: string, userAvatar?: string | null) {
  const db = await getDb();
  if (!db) return;
  // Upsert: try insert, on duplicate update
  await db.execute(
    sql`INSERT INTO user_presence (userId, userName, userAvatar, lastSeen, status)
        VALUES (${userId}, ${userName}, ${userAvatar || null}, NOW(), 'online')
        ON DUPLICATE KEY UPDATE userName = ${userName}, userAvatar = ${userAvatar || null}, lastSeen = NOW(), status = 'online'`
  );
}

export async function getOnlineUsers(timeoutMinutes: number = 3) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT userId, userName, userAvatar, lastSeen, status FROM user_presence WHERE lastSeen >= DATE_SUB(NOW(), INTERVAL ${timeoutMinutes} MINUTE)`
  );
  return ((rows as any)[0] || []).map((r: any) => ({
    userId: Number(r.userId),
    userName: r.userName,
    userAvatar: r.userAvatar,
    lastSeen: r.lastSeen,
    status: r.status,
  }));
}

export async function setUserOffline(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`UPDATE user_presence SET status = 'offline' WHERE userId = ${userId}`
  );
}

// ============================================================
// MESSAGE EDITING
// ============================================================
export async function editMessage(messageId: number, userId: number, newContent: string) {
  const db = await getDb();
  if (!db) return null;
  // Only allow editing own messages
  const [msg] = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  if (!msg || msg.userId !== userId) return null;
  if (msg.deletedAt) return null;
  
  // Store original content in editedContent if first edit
  const originalContent = msg.editedContent || msg.content;
  
  await db.update(chatMessages)
    .set({
      content: newContent,
      editedContent: originalContent,
      editedAt: new Date(),
    })
    .where(eq(chatMessages.id, messageId));
  
  return { id: messageId, content: newContent, editedAt: new Date() };
}

// ============================================================
// PARTNER COMMISSIONS DASHBOARD
// ============================================================
export async function getParceiroComissoesDashboard(parceiroId: number) {
  const db = await getDb();
  if (!db) return { kpis: { totalComissoes: 0, comissoesPendentes: 0, comissoesAprovadas: 0, clientesVinculados: 0 }, comissoesRecentes: [] };
  
  // Get commission stats
  const statsRows = await db.execute(
    sql`SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN ac.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
      SUM(CASE WHEN ac.status = 'aprovada' THEN 1 ELSE 0 END) as aprovadas,
      SUM(CASE WHEN ac.status = 'aprovada' THEN ac.valorComissao ELSE 0 END) as valorTotal
    FROM aprovacao_comissao ac
    WHERE ac.parceiroId = ${parceiroId}`
  );
  const stats = ((statsRows as any)[0] || [])[0] || {};
  
  // Count linked clients
  const clienteRows = await db.execute(
    sql`SELECT COUNT(DISTINCT c.id) as cnt FROM clientes c WHERE c.parceiroId = ${parceiroId}`
  );
  const clienteCount = Number(((clienteRows as any)[0] || [])[0]?.cnt || 0);
  
  // Recent commissions
  const recentRows = await db.execute(
    sql`SELECT ac.id, ac.valorComissao, ac.status, ac.createdAt, c.nome as clienteNome, s.nome as servicoNome
    FROM aprovacao_comissao ac
    LEFT JOIN clientes c ON ac.clienteId = c.id
    LEFT JOIN servicos s ON ac.servicoId = s.id
    WHERE ac.parceiroId = ${parceiroId}
    ORDER BY ac.createdAt DESC
    LIMIT 20`
  );
  const comissoesRecentes = ((recentRows as any)[0] || []).map((r: any) => ({
    id: r.id,
    valorComissao: Number(r.valorComissao || 0),
    status: r.status,
    createdAt: r.createdAt,
    clienteNome: r.clienteNome,
    servicoNome: r.servicoNome,
  }));
  
  return {
    kpis: {
      totalComissoes: Number(stats.total || 0),
      comissoesPendentes: Number(stats.pendentes || 0),
      comissoesAprovadas: Number(stats.aprovadas || 0),
      valorTotalAprovado: Number(stats.valorTotal || 0),
      clientesVinculados: clienteCount,
    },
    comissoesRecentes,
  };
}

// ---- DASHBOARD COMISSÕES DO PARCEIRO ----
export async function getPartnerCommissionsDashboard(parceiroId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');
  // Get the partner info
  const [parceiro] = await db.select().from(parceiros).where(eq(parceiros.id, parceiroId)).limit(1);
  if (!parceiro) return null;

  // Get clients linked to this partner
  const clientesVinculados = await db.select({
    id: clientes.id,
    razaoSocial: clientes.razaoSocial,
    cnpj: clientes.cnpj,
    ativo: clientes.ativo,
    prioridade: clientes.prioridade,
    segmentoEconomico: clientes.segmentoEconomico,
    createdAt: clientes.createdAt,
  }).from(clientes).where(eq(clientes.parceiroId, parceiroId));

  // Get services this partner works with
  const servicos = await db.select({
    id: parceiroServicos.id,
    servicoId: parceiroServicos.servicoId,
    percentualCustomizado: parceiroServicos.percentualCustomizado,
    servicoNome: sql<string>`(SELECT nome FROM servicos WHERE id = ${parceiroServicos.servicoId})`,
  }).from(parceiroServicos).where(eq(parceiroServicos.parceiroId, parceiroId));

  // Get commission approvals
  const aprovacoes = await db.select().from(aprovacaoComissao).where(eq(aprovacaoComissao.parceiroId, parceiroId)).orderBy(desc(aprovacaoComissao.createdAt)).limit(10);

  // Get subpartners if this is a main partner
  const subparceiros = await db.select({
    id: parceiros.id,
    nomeCompleto: parceiros.nomeCompleto,
    apelido: parceiros.apelido,
    ativo: parceiros.ativo,
  }).from(parceiros).where(and(eq(parceiros.parceiroPaiId, parceiroId), eq(parceiros.ehSubparceiro, 1)));

  // Get rateio info if subpartner
  const rateios = parceiro.ehSubparceiro && parceiro.parceiroPaiId
    ? await db.select().from(rateioComissao).where(eq(rateioComissao.parceiroId, parceiroId))
    : [];

  // Get commission model info
  const modelo = parceiro.modeloParceriaId
    ? await db.select().from(modelosParceria).where(eq(modelosParceria.id, parceiro.modeloParceriaId)).limit(1)
    : [];

  return {
    parceiro,
    clientesVinculados,
    totalClientes: clientesVinculados.length,
    clientesAtivos: clientesVinculados.filter((c: any) => c.ativo).length,
    servicos,
    aprovacoes,
    subparceiros,
    rateios,
    modelo: modelo[0] || null,
  };
}


// ---- CHAT HISTORY EXPORT ----
export async function getChatHistoryForExport(channelId: number) {
  const db = await getDb();
  if (!db) return { channel: null, messages: [] };

  const channel = await db.select().from(chatChannels).where(eq(chatChannels.id, channelId)).limit(1);
  if (channel.length === 0) return { channel: null, messages: [] };

  const msgs = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.channelId, channelId))
    .orderBy(asc(chatMessages.createdAt));

  return { channel: channel[0], messages: msgs };
}

// ---- CONSOLIDATED COMMISSIONS DASHBOARD ----
export async function getConsolidatedCommissionsDashboard(filters?: {
  dataInicio?: string;
  dataFim?: string;
  tipoParceiro?: 'pf' | 'pj';
  modeloParceriaId?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  // All parceiros
  let allParceiros = await db.select().from(parceiros).orderBy(desc(parceiros.createdAt));

  // Apply tipoParceiro filter
  if (filters?.tipoParceiro) {
    allParceiros = allParceiros.filter((p: any) => p.tipoPessoa === filters.tipoParceiro);
  }

  // Apply modeloParceriaId filter
  if (filters?.modeloParceriaId) {
    allParceiros = allParceiros.filter((p: any) => p.modeloParceriaId === filters.modeloParceriaId);
  }

  const parceiroIds = new Set(allParceiros.map(p => p.id));

  // All aprovacoes
  let allAprovacoes = await db.select().from(aprovacaoComissao).orderBy(desc(aprovacaoComissao.createdAt));

  // Filter aprovacoes by parceiro ids
  allAprovacoes = allAprovacoes.filter((a: any) => parceiroIds.has(a.parceiroId));

  // Apply date range filter on aprovacoes
  if (filters?.dataInicio) {
    const startDate = new Date(filters.dataInicio);
    allAprovacoes = allAprovacoes.filter((a: any) => new Date(a.createdAt) >= startDate);
  }
  if (filters?.dataFim) {
    const endDate = new Date(filters.dataFim + 'T23:59:59');
    allAprovacoes = allAprovacoes.filter((a: any) => new Date(a.createdAt) <= endDate);
  }

  // All comissoes por servico
  const allComissoes = await db.select().from(comissoesServico);

  // All clientes vinculados a parceiros
  const allClientes = await db.select().from(clientes).where(isNotNull(clientes.parceiroId));

  // All servicos autorizados por parceiro
  const allParceiroServicos = await db.select().from(parceiroServicos);

  // All servicos
  const allServicos = await db.select().from(servicos);

  // All modelos de parceria
  const allModelos = await db.select().from(modelosParceria);

  // Aggregate per parceiro
  const parceiroStats = allParceiros.map(p => {
    const pClientes = allClientes.filter((c: any) => c.parceiroId === p.id);
    const pAprovacoes = allAprovacoes.filter((a: any) => a.parceiroId === p.id);
    const pServicos = allParceiroServicos.filter((s: any) => s.parceiroId === p.id);
    const modelo = allModelos.find((m: any) => m.id === p.modeloParceriaId);

    const aprovadas = pAprovacoes.filter((a: any) => a.status === 'aprovada');
    const pendentes = pAprovacoes.filter((a: any) => a.status === 'pendente');
    const totalValor = aprovadas.reduce((sum: number, a: any) => sum + Number(a.valorComissao || 0), 0);

    return {
      id: p.id,
      nome: p.apelido || p.nomeCompleto,
      tipo: p.tipoPessoa,
      status: p.ativo ? 'ativo' : 'inativo',
      modelo: (modelo as any)?.nome || 'N/A',
      totalClientes: pClientes.length,
      clientesAtivos: pClientes.filter((c: any) => c.ativo).length,
      servicosAutorizados: pServicos.length,
      totalAprovacoes: pAprovacoes.length,
      aprovadas: aprovadas.length,
      pendentes: pendentes.length,
      valorTotalAprovado: totalValor,
      createdAt: p.createdAt,
    };
  });

  // Monthly evolution (last 12 months)
  const now = new Date();
  const monthlyData: { month: string; valor: number; quantidade: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const monthAprovacoes = allAprovacoes.filter((a: any) => {
      if (a.status !== 'aprovada') return false;
      const aDate = new Date(a.createdAt);
      return aDate.getFullYear() === d.getFullYear() && aDate.getMonth() === d.getMonth();
    });
    monthlyData.push({
      month: monthLabel,
      valor: monthAprovacoes.reduce((sum: number, a: any) => sum + Number(a.valorComissao || 0), 0),
      quantidade: monthAprovacoes.length,
    });
  }

  // Summary KPIs
  const totalComissoes = allAprovacoes.length;
  const totalAprovadas = allAprovacoes.filter((a: any) => a.status === 'aprovada').length;
  const totalPendentes = allAprovacoes.filter((a: any) => a.status === 'pendente').length;
  const totalRejeitadas = allAprovacoes.filter((a: any) => a.status === 'rejeitada').length;
  const valorTotalAprovado = allAprovacoes
    .filter((a: any) => a.status === 'aprovada')
    .reduce((sum: number, a: any) => sum + Number(a.valorComissao || 0), 0);
  const valorTotalPendente = allAprovacoes
    .filter((a: any) => a.status === 'pendente')
    .reduce((sum: number, a: any) => sum + Number(a.valorComissao || 0), 0);

  return {
    kpis: {
      totalComissoes,
      totalAprovadas,
      totalPendentes,
      totalRejeitadas,
      valorTotalAprovado,
      valorTotalPendente,
      totalParceiros: allParceiros.length,
      parceirosAtivos: allParceiros.filter((p: any) => p.ativo).length,
    },
    ranking: parceiroStats
      .sort((a, b) => b.valorTotalAprovado - a.valorTotalAprovado)
      .slice(0, 20),
    evolucaoMensal: monthlyData,
    parceiros: parceiroStats,
    modelos: allModelos.map((m: any) => ({ id: m.id, nome: m.nome })),
  };
}


// ============================================================
// METAS DE COMISSÕES POR PARCEIRO
// ============================================================

import { metasComissoes, InsertMetaComissao } from "../drizzle/schema";

export async function listMetasComissoes(parceiroId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (parceiroId) {
    return db.select().from(metasComissoes)
      .where(eq(metasComissoes.parceiroId, parceiroId))
      .orderBy(desc(metasComissoes.ano), desc(metasComissoes.mes));
  }
  return db.select().from(metasComissoes)
    .orderBy(desc(metasComissoes.ano), desc(metasComissoes.mes));
}

export async function getMetaComissao(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(metasComissoes).where(eq(metasComissoes.id, id)).limit(1);
  return rows[0] || null;
}

export async function createMetaComissao(data: InsertMetaComissao) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(metasComissoes).values(data);
  return result.insertId;
}

export async function updateMetaComissao(id: number, data: Partial<InsertMetaComissao>) {
  const db = await getDb();
  if (!db) return;
  await db.update(metasComissoes).set(data).where(eq(metasComissoes.id, id));
}

export async function deleteMetaComissao(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(metasComissoes).where(eq(metasComissoes.id, id));
}

// Get all metas for a specific year/month for all partners
export async function getMetasComissoesByPeriod(ano: number, mes?: number) {
  const db = await getDb();
  if (!db) return [];
  if (mes) {
    return db.select().from(metasComissoes)
      .where(and(eq(metasComissoes.ano, ano), eq(metasComissoes.mes, mes)));
  }
  return db.select().from(metasComissoes)
    .where(eq(metasComissoes.ano, ano));
}

// Get partner goal progress: meta vs realizado
export async function getMetaProgressoParceiro(parceiroId: number, ano: number, mes?: number) {
  const db = await getDb();
  if (!db) return { meta: null, realizado: 0 };

  // Get the meta
  const conditions = [eq(metasComissoes.parceiroId, parceiroId), eq(metasComissoes.ano, ano)];
  if (mes) conditions.push(eq(metasComissoes.mes, mes));
  const metas = await db.select().from(metasComissoes).where(and(...conditions)).limit(1);
  const meta = metas[0] || null;

  // Get realized commissions (approved) for the period using Drizzle ORM
  // Note: aprovacao_comissao uses 'aprovado' status, not 'aprovada'
  // The table doesn't have a valorComissao column, so we count approved commissions
  // and use percentualSolicitado as a proxy for value calculation
  const allAprovacoes = await db.select().from(aprovacaoComissao)
    .where(and(
      eq(aprovacaoComissao.parceiroId, parceiroId),
      eq(aprovacaoComissao.status, 'aprovado')
    ));

  // Filter by year and optionally month
  const filtered = allAprovacoes.filter((a: any) => {
    const d = new Date(a.createdAt);
    if (d.getFullYear() !== ano) return false;
    if (mes && (d.getMonth() + 1) !== mes) return false;
    return true;
  });

  // Calculate realized value using percentualSolicitado as proxy
  const realizado = filtered.reduce((sum: number, a: any) => sum + Number(a.percentualSolicitado || 0), 0);

  return { meta, realizado };
}

// Get all partners' goal progress for dashboard
export async function getAllMetasProgresso(ano: number, mes?: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all metas for the period
  const conditions: any[] = [eq(metasComissoes.ano, ano)];
  if (mes) conditions.push(eq(metasComissoes.mes, mes));
  const metas = await db.select().from(metasComissoes).where(and(...conditions));

  if (metas.length === 0) return [];

  // Get all approved commissions for the period using Drizzle ORM
  const allAprovacoes = await db.select().from(aprovacaoComissao)
    .where(eq(aprovacaoComissao.status, 'aprovado'));

  // Filter by year and optionally month, then group by parceiroId
  const realizadoMap: Record<number, number> = {};
  for (const a of allAprovacoes) {
    const d = new Date(a.createdAt);
    if (d.getFullYear() !== ano) continue;
    if (mes && (d.getMonth() + 1) !== mes) continue;
    if (!realizadoMap[a.parceiroId]) realizadoMap[a.parceiroId] = 0;
    realizadoMap[a.parceiroId] += Number(a.percentualSolicitado || 0);
  }

  // Get parceiro names
  const allParceiros = await db.select({ id: parceiros.id, nome: parceiros.nomeCompleto, apelido: parceiros.apelido }).from(parceiros);
  const parceiroMap: Record<number, string> = {};
  for (const p of allParceiros) {
    parceiroMap[p.id] = p.apelido || p.nome;
  }

  return metas.map(m => {
    const realizado = realizadoMap[m.parceiroId] || 0;
    const valorMeta = Number(m.valorMeta || 0);
    const percentual = valorMeta > 0 ? (realizado / valorMeta) * 100 : 0;
    return {
      id: m.id,
      parceiroId: m.parceiroId,
      parceiroNome: parceiroMap[m.parceiroId] || `Parceiro #${m.parceiroId}`,
      tipo: m.tipo,
      ano: m.ano,
      mes: m.mes,
      trimestre: m.trimestre,
      valorMeta,
      realizado,
      percentual: Math.round(percentual * 100) / 100,
      status: percentual >= 100 ? 'atingida' : percentual >= 50 ? 'em_progresso' : 'abaixo',
      observacao: m.observacao,
    };
  });
}

// ============================================================
// COMPARATIVO DE PERÍODOS
// ============================================================

export async function getComparativoPeriodos(
  periodoA: { dataInicio: string; dataFim: string },
  periodoB: { dataInicio: string; dataFim: string },
  tipoParceiro?: 'pf' | 'pj',
  modeloParceriaId?: number
) {
  const db = await getDb();
  if (!db) return null;

  // Get all parceiros
  let allParceiros = await db.select().from(parceiros).orderBy(desc(parceiros.createdAt));
  if (tipoParceiro) allParceiros = allParceiros.filter((p: any) => p.tipoPessoa === tipoParceiro);
  if (modeloParceriaId) allParceiros = allParceiros.filter((p: any) => p.modeloParceriaId === modeloParceriaId);
  const parceiroIds = new Set(allParceiros.map(p => p.id));

  // Get all aprovacoes
  const allAprovacoes = await db.select().from(aprovacaoComissao).orderBy(desc(aprovacaoComissao.createdAt));

  // Filter for each period
  const filterByPeriod = (aprovacoes: any[], periodo: { dataInicio: string; dataFim: string }) => {
    const startDate = new Date(periodo.dataInicio);
    const endDate = new Date(periodo.dataFim + 'T23:59:59');
    return aprovacoes.filter((a: any) => {
      if (!parceiroIds.has(a.parceiroId)) return false;
      const d = new Date(a.createdAt);
      return d >= startDate && d <= endDate;
    });
  };

  const aprovA = filterByPeriod(allAprovacoes, periodoA);
  const aprovB = filterByPeriod(allAprovacoes, periodoB);

  const calcKpis = (aprovs: any[]) => {
    const aprovadas = aprovs.filter((a: any) => a.status === 'aprovada');
    const pendentes = aprovs.filter((a: any) => a.status === 'pendente');
    return {
      totalComissoes: aprovs.length,
      totalAprovadas: aprovadas.length,
      totalPendentes: pendentes.length,
      valorTotalAprovado: aprovadas.reduce((sum: number, a: any) => sum + Number(a.valorComissao || 0), 0),
      valorTotalPendente: pendentes.reduce((sum: number, a: any) => sum + Number(a.valorComissao || 0), 0),
    };
  };

  const kpisA = calcKpis(aprovA);
  const kpisB = calcKpis(aprovB);

  // Calculate deltas
  const calcDelta = (a: number, b: number) => {
    if (b === 0) return a > 0 ? 100 : 0;
    return Math.round(((a - b) / b) * 10000) / 100;
  };

  const deltas = {
    totalComissoes: calcDelta(kpisA.totalComissoes, kpisB.totalComissoes),
    totalAprovadas: calcDelta(kpisA.totalAprovadas, kpisB.totalAprovadas),
    valorTotalAprovado: calcDelta(kpisA.valorTotalAprovado, kpisB.valorTotalAprovado),
    valorTotalPendente: calcDelta(kpisA.valorTotalPendente, kpisB.valorTotalPendente),
  };

  // Monthly evolution for each period
  const getMonthlyEvolution = (aprovs: any[], periodo: { dataInicio: string; dataFim: string }) => {
    const start = new Date(periodo.dataInicio);
    const end = new Date(periodo.dataFim);
    const months: { month: string; valor: number; quantidade: number }[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const monthLabel = current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const y = current.getFullYear();
      const m = current.getMonth();
      const monthAprovs = aprovs.filter((a: any) => {
        if (a.status !== 'aprovada') return false;
        const d = new Date(a.createdAt);
        return d.getFullYear() === y && d.getMonth() === m;
      });
      months.push({
        month: monthLabel,
        valor: monthAprovs.reduce((sum: number, a: any) => sum + Number(a.valorComissao || 0), 0),
        quantidade: monthAprovs.length,
      });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const evolucaoA = getMonthlyEvolution(aprovA, periodoA);
  const evolucaoB = getMonthlyEvolution(aprovB, periodoB);

  // Ranking comparison per partner
  const calcRankingPeriod = (aprovs: any[]) => {
    const map: Record<number, { total: number; aprovadas: number; valor: number }> = {};
    for (const a of aprovs) {
      if (!map[a.parceiroId]) map[a.parceiroId] = { total: 0, aprovadas: 0, valor: 0 };
      map[a.parceiroId].total++;
      if (a.status === 'aprovada') {
        map[a.parceiroId].aprovadas++;
        map[a.parceiroId].valor += Number(a.valorComissao || 0);
      }
    }
    return map;
  };

  const rankA = calcRankingPeriod(aprovA);
  const rankB = calcRankingPeriod(aprovB);

  // Merge rankings
  const allParceiroIds = new Set([...Object.keys(rankA), ...Object.keys(rankB)].map(Number));
  const rankingComparativo = Array.from(allParceiroIds).map(pid => {
    const p = allParceiros.find(pp => pp.id === pid);
    const a = rankA[pid] || { total: 0, aprovadas: 0, valor: 0 };
    const b = rankB[pid] || { total: 0, aprovadas: 0, valor: 0 };
    return {
      parceiroId: pid,
      nome: p ? (p.apelido || p.nomeCompleto) : `Parceiro #${pid}`,
      periodoA: a,
      periodoB: b,
      deltaValor: a.valor - b.valor,
      deltaPercentual: calcDelta(a.valor, b.valor),
    };
  }).sort((a, b) => b.periodoA.valor - a.periodoA.valor);

  return {
    periodoA: { ...periodoA, kpis: kpisA, evolucao: evolucaoA },
    periodoB: { ...periodoB, kpis: kpisB, evolucao: evolucaoB },
    deltas,
    rankingComparativo: rankingComparativo.slice(0, 20),
  };
}


// ---- VALE TRANSPORTE ----
export async function listValeTransporte(mesRef?: number, anoRef?: number) {
  const db = await getDb();
  if (!db) return [];
  if (mesRef && anoRef) {
    return db.select().from(valeTransporte)
      .where(and(eq(valeTransporte.mesReferencia, mesRef), eq(valeTransporte.anoReferencia, anoRef)))
      .orderBy(desc(valeTransporte.createdAt));
  }
  return db.select().from(valeTransporte).orderBy(desc(valeTransporte.createdAt));
}

export async function createValeTransporte(data: InsertValeTransporte) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(valeTransporte).values(data);
  return result[0].insertId;
}

export async function updateValeTransporte(id: number, data: Partial<InsertValeTransporte>) {
  const db = await getDb();
  if (!db) return;
  await db.update(valeTransporte).set(data).where(eq(valeTransporte.id, id));
}

export async function deleteValeTransporte(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(valeTransporte).where(eq(valeTransporte.id, id));
}

// ---- ACADEMIA BENEFÍCIO ----
export async function listAcademiaBeneficio(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(academiaBeneficio).where(eq(academiaBeneficio.colaboradorId, colaboradorId)).orderBy(desc(academiaBeneficio.createdAt));
  }
  return db.select().from(academiaBeneficio).orderBy(desc(academiaBeneficio.createdAt));
}

export async function createAcademiaBeneficio(data: InsertAcademiaBeneficio) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(academiaBeneficio).values(data);
  return result[0].insertId;
}

export async function updateAcademiaBeneficio(id: number, data: Partial<InsertAcademiaBeneficio>) {
  const db = await getDb();
  if (!db) return;
  await db.update(academiaBeneficio).set(data).where(eq(academiaBeneficio.id, id));
}

export async function deleteAcademiaBeneficio(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(academiaBeneficio).where(eq(academiaBeneficio.id, id));
}

// ---- COMISSÃO RH ----
export async function listComissaoRh(mesRef?: number, anoRef?: number) {
  const db = await getDb();
  if (!db) return [];
  if (mesRef && anoRef) {
    return db.select().from(comissaoRh)
      .where(and(eq(comissaoRh.mesReferencia, mesRef), eq(comissaoRh.anoReferencia, anoRef)))
      .orderBy(desc(comissaoRh.createdAt));
  }
  return db.select().from(comissaoRh).orderBy(desc(comissaoRh.createdAt));
}

export async function createComissaoRh(data: InsertComissaoRh) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(comissaoRh).values(data);
  return result[0].insertId;
}

export async function updateComissaoRh(id: number, data: Partial<InsertComissaoRh>) {
  const db = await getDb();
  if (!db) return;
  await db.update(comissaoRh).set(data).where(eq(comissaoRh.id, id));
}

export async function deleteComissaoRh(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(comissaoRh).where(eq(comissaoRh.id, id));
}

// ---- DAY OFF ----
export async function listDayOff(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(dayOff).where(eq(dayOff.colaboradorId, colaboradorId)).orderBy(desc(dayOff.createdAt));
  }
  return db.select().from(dayOff).orderBy(desc(dayOff.createdAt));
}

export async function createDayOff(data: InsertDayOff) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(dayOff).values(data);
  return result[0].insertId;
}

export async function updateDayOff(id: number, data: Partial<InsertDayOff>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dayOff).set(data).where(eq(dayOff.id, id));
}

export async function deleteDayOff(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(dayOff).where(eq(dayOff.id, id));
}

// ---- DOAÇÃO DE SANGUE ----
export async function listDoacaoSangue(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(doacaoSangue).where(eq(doacaoSangue.colaboradorId, colaboradorId)).orderBy(desc(doacaoSangue.createdAt));
  }
  return db.select().from(doacaoSangue).orderBy(desc(doacaoSangue.createdAt));
}

export async function createDoacaoSangue(data: InsertDoacaoSangue) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(doacaoSangue).values(data);
  return result[0].insertId;
}

export async function updateDoacaoSangue(id: number, data: Partial<InsertDoacaoSangue>) {
  const db = await getDb();
  if (!db) return;
  await db.update(doacaoSangue).set(data).where(eq(doacaoSangue.id, id));
}

export async function deleteDoacaoSangue(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(doacaoSangue).where(eq(doacaoSangue.id, id));
}

// ---- REAJUSTES SALARIAIS ----
export async function listReajustesSalariais(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(reajustesSalariais).where(eq(reajustesSalariais.colaboradorId, colaboradorId)).orderBy(desc(reajustesSalariais.createdAt));
  }
  return db.select().from(reajustesSalariais).orderBy(desc(reajustesSalariais.createdAt));
}

export async function createReajusteSalarial(data: InsertReajusteSalarial) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(reajustesSalariais).values(data);
  return result[0].insertId;
}

export async function updateReajusteSalarial(id: number, data: Partial<InsertReajusteSalarial>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reajustesSalariais).set(data).where(eq(reajustesSalariais.id, id));
}

// ---- APONTAMENTOS FOLHA ----
export async function listApontamentosFolha(mesRef?: number, anoRef?: number) {
  const db = await getDb();
  if (!db) return [];
  if (mesRef && anoRef) {
    return db.select().from(apontamentosFolha)
      .where(and(eq(apontamentosFolha.mesReferencia, mesRef), eq(apontamentosFolha.anoReferencia, anoRef)))
      .orderBy(desc(apontamentosFolha.createdAt));
  }
  return db.select().from(apontamentosFolha).orderBy(desc(apontamentosFolha.createdAt));
}

export async function createApontamentoFolha(data: InsertApontamentoFolha) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(apontamentosFolha).values(data);
  return result[0].insertId;
}

export async function deleteApontamentosFolhaPorReferencia(mesRef: number, anoRef: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(apontamentosFolha).where(and(
    eq(apontamentosFolha.mesReferencia, mesRef),
    eq(apontamentosFolha.anoReferencia, anoRef)
  ));
}

// ---- NÍVEIS DE CARGO ----
export async function listNiveisCargo(setorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (setorId) {
    return db.select().from(niveisCargo).where(eq(niveisCargo.setorId, setorId)).orderBy(niveisCargo.nivel);
  }
  return db.select().from(niveisCargo).orderBy(niveisCargo.setorId, niveisCargo.nivel);
}

export async function createNivelCargo(data: InsertNivelCargo) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(niveisCargo).values(data);
  return result[0].insertId;
}

export async function updateNivelCargo(id: number, data: Partial<InsertNivelCargo>) {
  const db = await getDb();
  if (!db) return;
  await db.update(niveisCargo).set(data).where(eq(niveisCargo.id, id));
}

export async function deleteNivelCargo(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(niveisCargo).where(eq(niveisCargo.id, id));
}

// ---- GERAR APONTAMENTOS DA FOLHA (consolidar VT, academia, comissões, reajustes) ----
export async function gerarApontamentosFolha(mesRef: number, anoRef: number, registradoPorId: number | null, registradoPorNome: string) {
  const db = await getDb();
  if (!db) return [];

  // Delete existing apontamentos for this month
  await deleteApontamentosFolhaPorReferencia(mesRef, anoRef);

  const apontamentos: InsertApontamentoFolha[] = [];

  // 1. VT
  const vts = await listValeTransporte(mesRef, anoRef);
  for (const vt of vts) {
    apontamentos.push({
      colaboradorId: vt.colaboradorId,
      colaboradorNome: vt.colaboradorNome,
      mesReferencia: mesRef,
      anoReferencia: anoRef,
      tipo: 'vale_transporte',
      descricao: `VT ${vt.cidadePassagem?.toUpperCase()} - ${vt.diasUteis} dias × ${vt.passagensPorDia} pass. × R$${vt.valorPassagem}`,
      valor: String(vt.valorTotal),
      registradoPorId,
      registradoPorNome,
    });
  }

  // 2. Academia
  const academias = await listAcademiaBeneficio();
  for (const ac of academias) {
    if (!ac.ativo || !ac.descontoFolha) continue;
    apontamentos.push({
      colaboradorId: ac.colaboradorId,
      colaboradorNome: ac.colaboradorNome,
      mesReferencia: mesRef,
      anoReferencia: anoRef,
      tipo: 'academia',
      descricao: `Academia ${ac.nomeAcademia} - Plano ${ac.plano || 'N/A'}`,
      valor: String(ac.valorDesconto || ac.valorPlano),
      registradoPorId,
      registradoPorNome,
    });
  }

  // 3. Comissões RH
  const comissoes = await listComissaoRh(mesRef, anoRef);
  for (const c of comissoes) {
    const tipoLabel = c.tipo === 'evox_monitor' ? 'Evox Monitor' : c.tipo === 'dpt' ? 'DPT' : c.tipo === 'credito' ? 'Crédito' : 'Outro';
    apontamentos.push({
      colaboradorId: c.colaboradorId,
      colaboradorNome: c.colaboradorNome,
      mesReferencia: mesRef,
      anoReferencia: anoRef,
      tipo: 'comissao',
      descricao: `Comissão ${tipoLabel}${c.descricao ? ' - ' + c.descricao : ''}`,
      valor: String(c.valorComissao),
      registradoPorId,
      registradoPorNome,
    });
  }

  // 4. Reajustes
  const reajustes = await listReajustesSalariais();
  for (const r of reajustes) {
    // Check if the reajuste was applied in this month
    const dataEfetivacao = r.dataEfetivacao ? new Date(r.dataEfetivacao + 'T12:00:00') : null;
    if (dataEfetivacao && dataEfetivacao.getMonth() + 1 === mesRef && dataEfetivacao.getFullYear() === anoRef) {
      apontamentos.push({
        colaboradorId: r.colaboradorId,
        colaboradorNome: r.colaboradorNome,
        mesReferencia: mesRef,
        anoReferencia: anoRef,
        tipo: r.tipo === 'sindical' ? 'reajuste_sindical' : 'reajuste_dois_anos',
        descricao: `Reajuste ${r.tipo === 'sindical' ? 'Sindical' : '2 anos'} - ${r.percentual}% sobre R$${r.salarioAnterior}`,
        valor: String(Number(r.salarioNovo || 0) - Number(r.salarioAnterior || 0)),
        registradoPorId,
        registradoPorNome,
      });
    }
  }

  // 5. Pensão alimentícia from colaboradores
  const colabs = await listColaboradores();
  for (const c of colabs) {
    if (c.pagaPensaoAlimenticia && Number(c.valorPensaoAlimenticia || 0) > 0) {
      apontamentos.push({
        colaboradorId: c.id,
        colaboradorNome: c.nomeCompleto,
        mesReferencia: mesRef,
        anoReferencia: anoRef,
        tipo: 'pensao_alimenticia',
        descricao: 'Pensão alimentícia',
        valor: String(c.valorPensaoAlimenticia),
        registradoPorId,
        registradoPorNome,
      });
    }
    if (c.temContribuicaoAssistencial && Number(c.valorContribuicaoAssistencial || 0) > 0) {
      apontamentos.push({
        colaboradorId: c.id,
        colaboradorNome: c.nomeCompleto,
        mesReferencia: mesRef,
        anoReferencia: anoRef,
        tipo: 'contribuicao_assistencial',
        descricao: 'Contribuição assistencial',
        valor: String(c.valorContribuicaoAssistencial),
        registradoPorId,
        registradoPorNome,
      });
    }
  }

  // Insert all apontamentos
  if (apontamentos.length > 0) {
    for (const ap of apontamentos) {
      await createApontamentoFolha(ap);
    }
  }

  return apontamentos;
}

// ---- CHECK REAJUSTE 2 ANOS ----
export async function checkReajusteDoisAnos() {
  const db = await getDb();
  if (!db) return [];
  const colabs = await listColaboradores();
  const elegíveis: { colaboradorId: number; nome: string; dataAdmissao: string; anosCompletos: number; salarioAtual: number }[] = [];
  const hoje = new Date();

  for (const c of colabs) {
    if (!c.dataAdmissao || c.statusColaborador !== 'ativo') continue;
    const admissao = new Date(c.dataAdmissao + 'T12:00:00');
    const diffMs = hoje.getTime() - admissao.getTime();
    const anosCompletos = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    if (anosCompletos >= 2 && anosCompletos % 2 === 0) {
      // Check if reajuste already exists for this period
      const existingReajustes = await listReajustesSalariais(c.id);
      const jaTemReajuste = existingReajustes.some(r =>
        r.tipo === 'dois_anos' &&
        r.dataEfetivacao && new Date(r.dataEfetivacao + 'T12:00:00').getFullYear() === hoje.getFullYear()
      );
      if (!jaTemReajuste) {
        elegíveis.push({
          colaboradorId: c.id,
          nome: c.nomeCompleto,
          dataAdmissao: c.dataAdmissao,
          anosCompletos,
          salarioAtual: Number(c.salarioBase || 0),
        });
      }
    }
  }
  return elegíveis;
}


// ===== DASHBOARD GEG CONSOLIDADO =====
export async function getDashboardGEG(mes?: number, ano?: number) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const mesRef = mes ?? (now.getMonth() + 1);
  const anoRef = ano ?? now.getFullYear();

  // 1. Total de colaboradores ativos
  const colabs = await listColaboradores();
  const ativos = colabs.filter(c => c.statusColaborador === 'ativo');
  const totalAtivos = ativos.length;

  // 2. Vale Transporte do mês
  const vts = await db.select().from(valeTransporte)
    .where(and(eq(valeTransporte.mesReferencia, mesRef), eq(valeTransporte.anoReferencia, anoRef)));
  const totalVT = vts.reduce((sum, v) => sum + Number(v.valorTotal || 0), 0);
  const qtdVT = vts.length;

  // 3. Academia do mês
  const academias = await db.select().from(academiaBeneficio);
  const totalAcademia = academias.reduce((sum, a) => sum + (a.descontoFolha ? Number(a.valorPlano || 0) : 0), 0);
  const qtdAcademia = academias.length;

  // 4. Comissões RH do mês
  const comissoes = await db.select().from(comissaoRh)
    .where(and(eq(comissaoRh.mesReferencia, mesRef), eq(comissaoRh.anoReferencia, anoRef)));
  const totalComissoes = comissoes.reduce((sum, c) => sum + Number(c.valorComissao || 0), 0);
  const qtdComissoes = comissoes.length;

  // 5. Reajustes pendentes (elegíveis 2 anos)
  const elegiveis = await checkReajusteDoisAnos();
  const reajustesPendentes = elegiveis.length;

  // 6. Day Offs do mês
  const dayOffs = await db.select().from(dayOff);
  const dayOffsDoMes = dayOffs.filter(d => {
    if (!d.dataEfetiva) return false;
    const dt = new Date(d.dataEfetiva + 'T12:00:00');
    return dt.getMonth() + 1 === mesRef && dt.getFullYear() === anoRef;
  });
  const dayOffsPendentes = dayOffsDoMes.filter(d => d.status === 'pendente').length;
  const dayOffsAprovados = dayOffsDoMes.filter(d => d.status === 'aprovado').length;

  // 7. Férias do mês
  const feriasAll = await listFerias();
  const feriasDoMes = feriasAll.filter((f: any) => {
    if (!f.dataInicio) return false;
    const dt = new Date(f.dataInicio + 'T12:00:00');
    return dt.getMonth() + 1 === mesRef && dt.getFullYear() === anoRef;
  });

  // 8. Atestados/licenças do mês
  const atestados = await listAtestadosLicencas();
  const atestadosDoMes = atestados.filter((a: any) => {
    if (!a.dataInicio) return false;
    const dt = new Date(a.dataInicio + 'T12:00:00');
    return dt.getMonth() + 1 === mesRef && dt.getFullYear() === anoRef;
  });

  // 9. Próximos aniversários (próximos 30 dias)
  const proximosAniversarios: { id: number; nome: string; dataNascimento: string; diasAte: number }[] = [];
  for (const c of ativos) {
    if (!c.dataNascimento) continue;
    const nasc = new Date(c.dataNascimento + 'T12:00:00');
    const anivEsteAno = new Date(anoRef, nasc.getMonth(), nasc.getDate());
    if (anivEsteAno < now) {
      anivEsteAno.setFullYear(anoRef + 1);
    }
    const diffDias = Math.ceil((anivEsteAno.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias >= 0 && diffDias <= 30) {
      proximosAniversarios.push({
        id: c.id,
        nome: c.nomeCompleto,
        dataNascimento: c.dataNascimento,
        diasAte: diffDias,
      });
    }
  }
  proximosAniversarios.sort((a, b) => a.diasAte - b.diasAte);

  // 10. Evolução mensal de custos (últimos 6 meses)
  const evolucao: { mes: number; ano: number; label: string; vt: number; academia: number; comissoes: number; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anoRef, mesRef - 1 - i, 1);
    const m = d.getMonth() + 1;
    const a = d.getFullYear();
    const mLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    const vtMes = await db.select().from(valeTransporte)
      .where(and(eq(valeTransporte.mesReferencia, m), eq(valeTransporte.anoReferencia, a)));
    const vtTotal = vtMes.reduce((s, v) => s + Number(v.valorTotal || 0), 0);

    const comMes = await db.select().from(comissaoRh)
      .where(and(eq(comissaoRh.mesReferencia, m), eq(comissaoRh.anoReferencia, a)));
    const comTotal = comMes.reduce((s, c) => s + Number(c.valorComissao || 0), 0);

    // Academia is monthly recurring, so same value each month
    const acadTotal = totalAcademia;

    evolucao.push({
      mes: m,
      ano: a,
      label: mLabel,
      vt: vtTotal,
      academia: acadTotal,
      comissoes: comTotal,
      total: vtTotal + acadTotal + comTotal,
    });
  }

  // 11. Lista de reajustes pendentes com detalhes
  const reajustesPendentesLista = elegiveis.map(e => ({
    colaboradorId: e.colaboradorId,
    nome: e.nome,
    dataAdmissao: e.dataAdmissao,
    anosCompletos: e.anosCompletos,
    salarioAtual: e.salarioAtual,
    salarioEstimado: Number((e.salarioAtual * 1.10).toFixed(2)),
  }));

  return {
    mesRef,
    anoRef,
    totalAtivos,
    vt: { total: totalVT, qtd: qtdVT },
    academia: { total: totalAcademia, qtd: qtdAcademia },
    comissoes: { total: totalComissoes, qtd: qtdComissoes },
    reajustesPendentes,
    dayOffs: { pendentes: dayOffsPendentes, aprovados: dayOffsAprovados, total: dayOffsDoMes.length },
    ferias: { total: feriasDoMes.length },
    atestados: { total: atestadosDoMes.length },
    proximosAniversarios,
    evolucao,
    reajustesPendentesLista,
    custoTotalMes: totalVT + totalAcademia + totalComissoes,
  };
}

// =============================================
// ---- BENEFÍCIOS CUSTOMIZADOS ----
// =============================================
export async function listBeneficiosCustom() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(beneficiosCustom).orderBy(desc(beneficiosCustom.createdAt));
}

export async function createBeneficioCustom(data: InsertBeneficioCustom) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(beneficiosCustom).values(data);
  return result[0].insertId;
}

export async function updateBeneficioCustom(id: number, data: Partial<InsertBeneficioCustom>) {
  const db = await getDb();
  if (!db) return;
  await db.update(beneficiosCustom).set(data).where(eq(beneficiosCustom.id, id));
}

export async function deleteBeneficioCustom(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(beneficiosCustom).where(eq(beneficiosCustom.id, id));
}

// =============================================
// ---- PROGRAMAS DE CARREIRA CUSTOMIZADOS ----
// =============================================
export async function listProgramasCarreira() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(programasCarreira).orderBy(desc(programasCarreira.createdAt));
}

export async function createProgramaCarreira(data: InsertProgramaCarreira) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(programasCarreira).values(data);
  return result[0].insertId;
}

export async function updateProgramaCarreira(id: number, data: Partial<InsertProgramaCarreira>) {
  const db = await getDb();
  if (!db) return;
  await db.update(programasCarreira).set(data).where(eq(programasCarreira.id, id));
}

export async function deleteProgramaCarreira(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(programasCarreira).where(eq(programasCarreira.id, id));
}

// =============================================
// ---- RESCISÕES ----
// =============================================
export async function listRescisoes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rescisoes).orderBy(desc(rescisoes.createdAt));
}

export async function getRescisaoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(rescisoes).where(eq(rescisoes.id, id));
  return rows[0] || null;
}

export async function createRescisao(data: InsertRescisao) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(rescisoes).values(data);
  return result[0].insertId;
}

export async function updateRescisao(id: number, data: Partial<InsertRescisao>) {
  const db = await getDb();
  if (!db) return;
  await db.update(rescisoes).set(data).where(eq(rescisoes.id, id));
}

export async function deleteRescisao(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(rescisoes).where(eq(rescisoes.id, id));
}

// ---- CÁLCULO DE RESCISÃO ----
export function calcularRescisao(params: {
  salarioBase: number;
  dataAdmissao: string; // YYYY-MM-DD
  dataDesligamento: string; // YYYY-MM-DD
  tipoDesligamento: string;
  periodoExperiencia1Fim?: string | null;
  periodoExperiencia2Fim?: string | null;
}) {
  const { salarioBase, dataAdmissao, dataDesligamento, tipoDesligamento } = params;
  const admissao = new Date(dataAdmissao + 'T12:00:00');
  const desligamento = new Date(dataDesligamento + 'T12:00:00');

  // Tempo de serviço em meses
  const diffMs = desligamento.getTime() - admissao.getTime();
  const mesesTrabalhados = Math.max(1, Math.ceil(diffMs / (30.44 * 24 * 60 * 60 * 1000)));
  const anosTrabalhados = Math.floor(mesesTrabalhados / 12);

  // Saldo de salário (dias trabalhados no mês do desligamento)
  const diaDesligamento = desligamento.getDate();
  const diasNoMes = new Date(desligamento.getFullYear(), desligamento.getMonth() + 1, 0).getDate();
  const saldoSalario = Number(((salarioBase / 30) * diaDesligamento).toFixed(2));

  // 13º proporcional (meses trabalhados no ano / 12)
  const mesDesligamento = desligamento.getMonth() + 1;
  const meses13 = mesDesligamento; // meses trabalhados no ano corrente
  let decimoTerceiroProporcional = 0;
  let decimoTerceiroMeses = 0;

  // Férias proporcionais
  const mesesDesdeUltimoAniversario = mesesTrabalhados % 12 || 12;
  let feriasProporcionais = 0;
  let feriasMeses = 0;
  let tercoConstitucional = 0;
  let feriasVencidas = 0;

  // Aviso prévio
  let avisoPrevio = 0;
  let avisoPrevioDias = 0;

  // FGTS
  const fgtsDepositado = Number((salarioBase * 0.08 * mesesTrabalhados).toFixed(2));
  let multaFgts = 0;
  let multaFgtsPercentual = 0;

  const isExperiencia = tipoDesligamento === 'termino_experiencia_1' || tipoDesligamento === 'termino_experiencia_2';

  switch (tipoDesligamento) {
    case 'sem_justa_causa':
      // Aviso prévio: 30 dias + 3 dias por ano trabalhado (máx 90 dias)
      avisoPrevioDias = Math.min(90, 30 + (anosTrabalhados * 3));
      avisoPrevio = Number(((salarioBase / 30) * avisoPrevioDias).toFixed(2));
      // 13º proporcional
      decimoTerceiroMeses = meses13;
      decimoTerceiroProporcional = Number(((salarioBase / 12) * decimoTerceiroMeses).toFixed(2));
      // Férias proporcionais + 1/3
      feriasMeses = mesesDesdeUltimoAniversario;
      feriasProporcionais = Number(((salarioBase / 12) * feriasMeses).toFixed(2));
      tercoConstitucional = Number((feriasProporcionais / 3).toFixed(2));
      // Férias vencidas (se tiver mais de 1 ano)
      if (anosTrabalhados >= 1) {
        feriasVencidas = Number((salarioBase + salarioBase / 3).toFixed(2));
      }
      // Multa FGTS 40%
      multaFgtsPercentual = 40;
      multaFgts = Number((fgtsDepositado * 0.40).toFixed(2));
      break;

    case 'justa_causa':
      // Apenas saldo de salário e férias vencidas
      if (anosTrabalhados >= 1) {
        feriasVencidas = Number((salarioBase + salarioBase / 3).toFixed(2));
      }
      break;

    case 'pedido_demissao':
      // 13º proporcional
      decimoTerceiroMeses = meses13;
      decimoTerceiroProporcional = Number(((salarioBase / 12) * decimoTerceiroMeses).toFixed(2));
      // Férias proporcionais + 1/3
      feriasMeses = mesesDesdeUltimoAniversario;
      feriasProporcionais = Number(((salarioBase / 12) * feriasMeses).toFixed(2));
      tercoConstitucional = Number((feriasProporcionais / 3).toFixed(2));
      // Férias vencidas
      if (anosTrabalhados >= 1) {
        feriasVencidas = Number((salarioBase + salarioBase / 3).toFixed(2));
      }
      // Sem aviso prévio (empregado deve cumprir ou descontar)
      break;

    case 'termino_experiencia_1':
    case 'termino_experiencia_2':
      // 13º proporcional
      decimoTerceiroMeses = meses13;
      decimoTerceiroProporcional = Number(((salarioBase / 12) * decimoTerceiroMeses).toFixed(2));
      // Férias proporcionais + 1/3
      feriasMeses = mesesDesdeUltimoAniversario;
      feriasProporcionais = Number(((salarioBase / 12) * feriasMeses).toFixed(2));
      tercoConstitucional = Number((feriasProporcionais / 3).toFixed(2));
      // Sem aviso prévio, sem multa FGTS
      break;

    case 'acordo_mutuo':
      // Aviso prévio: 50% do valor
      avisoPrevioDias = Math.min(90, 30 + (anosTrabalhados * 3));
      avisoPrevio = Number((((salarioBase / 30) * avisoPrevioDias) * 0.5).toFixed(2));
      // 13º proporcional integral
      decimoTerceiroMeses = meses13;
      decimoTerceiroProporcional = Number(((salarioBase / 12) * decimoTerceiroMeses).toFixed(2));
      // Férias proporcionais + 1/3
      feriasMeses = mesesDesdeUltimoAniversario;
      feriasProporcionais = Number(((salarioBase / 12) * feriasMeses).toFixed(2));
      tercoConstitucional = Number((feriasProporcionais / 3).toFixed(2));
      // Férias vencidas
      if (anosTrabalhados >= 1) {
        feriasVencidas = Number((salarioBase + salarioBase / 3).toFixed(2));
      }
      // Multa FGTS 20%
      multaFgtsPercentual = 20;
      multaFgts = Number((fgtsDepositado * 0.20).toFixed(2));
      break;
  }

  const totalProventos = Number((saldoSalario + avisoPrevio + decimoTerceiroProporcional + feriasProporcionais + tercoConstitucional + feriasVencidas + multaFgts).toFixed(2));
  const totalDescontos = 0; // Simplificado - descontos de INSS/IR seriam calculados à parte
  const totalLiquido = Number((totalProventos - totalDescontos).toFixed(2));

  return {
    saldoSalario,
    avisoPrevio,
    avisoPrevioDias,
    decimoTerceiroProporcional,
    decimoTerceiroMeses,
    feriasProporcionais,
    feriasMeses,
    tercoConstitucional,
    feriasVencidas,
    fgtsDepositado,
    multaFgts,
    multaFgtsPercentual,
    totalProventos,
    totalDescontos,
    totalLiquido,
    mesesTrabalhados,
    anosTrabalhados,
  };
}


// =============================================
// ---- EQUIPAMENTOS COLABORADOR ----
// =============================================

export async function listEquipamentos(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(equipamentosColaborador).where(eq(equipamentosColaborador.colaboradorId, colaboradorId)).orderBy(desc(equipamentosColaborador.createdAt));
  }
  return db.select().from(equipamentosColaborador).orderBy(desc(equipamentosColaborador.createdAt));
}

export async function createEquipamento(data: InsertEquipamentoColaborador) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(equipamentosColaborador).values(data);
  return result[0].insertId;
}

export async function updateEquipamento(id: number, data: Partial<InsertEquipamentoColaborador>) {
  const db = await getDb();
  if (!db) return;
  await db.update(equipamentosColaborador).set(data).where(eq(equipamentosColaborador.id, id));
}

export async function deleteEquipamento(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(equipamentosColaborador).where(eq(equipamentosColaborador.id, id));
}

// =============================================
// ---- SENHAS E AUTORIZAÇÕES ----
// =============================================

export async function listSenhasAutorizacoes(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(senhasAutorizacoes).where(eq(senhasAutorizacoes.colaboradorId, colaboradorId)).orderBy(desc(senhasAutorizacoes.createdAt));
  }
  return db.select().from(senhasAutorizacoes).orderBy(desc(senhasAutorizacoes.createdAt));
}

export async function createSenhaAutorizacao(data: InsertSenhaAutorizacao) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(senhasAutorizacoes).values(data);
  return result[0].insertId;
}

export async function updateSenhaAutorizacao(id: number, data: Partial<InsertSenhaAutorizacao>) {
  const db = await getDb();
  if (!db) return;
  await db.update(senhasAutorizacoes).set(data).where(eq(senhasAutorizacoes.id, id));
}

export async function deleteSenhaAutorizacao(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(senhasAutorizacoes).where(eq(senhasAutorizacoes.id, id));
}

// ---- HISTÓRICO DE SENHAS E ACESSOS ----
export async function listSenhaHistorico(senhaAutorizacaoId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (senhaAutorizacaoId) {
    return db.select().from(senhaHistorico).where(eq(senhaHistorico.senhaAutorizacaoId, senhaAutorizacaoId)).orderBy(desc(senhaHistorico.createdAt));
  }
  return db.select().from(senhaHistorico).orderBy(desc(senhaHistorico.createdAt));
}

export async function createSenhaHistorico(data: InsertSenhaHistorico) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(senhaHistorico).values(data);
  return result[0].insertId;
}

// ---- EMAILS CORPORATIVOS ----
export async function listEmailsCorporativos(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(emailsCorporativos).where(eq(emailsCorporativos.colaboradorId, colaboradorId)).orderBy(desc(emailsCorporativos.createdAt));
  }
  return db.select().from(emailsCorporativos).orderBy(desc(emailsCorporativos.createdAt));
}

export async function createEmailCorporativo(data: InsertEmailCorporativo) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(emailsCorporativos).values(data);
  return result[0].insertId;
}

export async function updateEmailCorporativo(id: number, data: Partial<InsertEmailCorporativo>) {
  const db = await getDb();
  if (!db) return;
  await db.update(emailsCorporativos).set(data).where(eq(emailsCorporativos.id, id));
}

export async function deleteEmailCorporativo(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailsCorporativos).where(eq(emailsCorporativos.id, id));
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const results = await db.select().from(emailsCorporativos).where(eq(emailsCorporativos.email, email));
  return results.length > 0;
}

// =============================================
// ---- TERMOS DE RESPONSABILIDADE ----
// =============================================

export async function listTermosResponsabilidade(filters?: { colaboradorId?: number; equipamentoId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.colaboradorId) conditions.push(eq(termosResponsabilidade.colaboradorId, filters.colaboradorId));
  if (filters?.equipamentoId) conditions.push(eq(termosResponsabilidade.equipamentoId, filters.equipamentoId));
  if (conditions.length > 0) {
    return db.select().from(termosResponsabilidade).where(and(...conditions)).orderBy(desc(termosResponsabilidade.createdAt));
  }
  return db.select().from(termosResponsabilidade).orderBy(desc(termosResponsabilidade.createdAt));
}

export async function createTermoResponsabilidade(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(termosResponsabilidade).values(data);
  return result[0].insertId;
}

export async function updateTermoResponsabilidade(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(termosResponsabilidade).set(data).where(eq(termosResponsabilidade.id, id));
}

export async function deleteTermoResponsabilidade(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(termosResponsabilidade).where(eq(termosResponsabilidade.id, id));
}

// ---- RELATÓRIO CONSOLIDADO DE ATIVOS POR COLABORADOR ----
export async function getRelatorioAtivosColaborador(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return { equipamentos: [], emails: [], senhas: [], termos: [] };
  
  const conditions = colaboradorId ? [eq(equipamentosColaborador.colaboradorId, colaboradorId)] : [];
  const conditionsEmail = colaboradorId ? [eq(emailsCorporativos.colaboradorId, colaboradorId)] : [];
  const conditionsSenha = colaboradorId ? [eq(senhasAutorizacoes.colaboradorId, colaboradorId)] : [];
  const conditionsTermos = colaboradorId ? [eq(termosResponsabilidade.colaboradorId, colaboradorId)] : [];
  
  const [equipamentos, emails, senhas, termos] = await Promise.all([
    conditions.length > 0
      ? db.select().from(equipamentosColaborador).where(and(...conditions)).orderBy(desc(equipamentosColaborador.createdAt))
      : db.select().from(equipamentosColaborador).orderBy(desc(equipamentosColaborador.createdAt)),
    conditionsEmail.length > 0
      ? db.select().from(emailsCorporativos).where(and(...conditionsEmail)).orderBy(desc(emailsCorporativos.createdAt))
      : db.select().from(emailsCorporativos).orderBy(desc(emailsCorporativos.createdAt)),
    conditionsSenha.length > 0
      ? db.select().from(senhasAutorizacoes).where(and(...conditionsSenha)).orderBy(desc(senhasAutorizacoes.createdAt))
      : db.select().from(senhasAutorizacoes).orderBy(desc(senhasAutorizacoes.createdAt)),
    conditionsTermos.length > 0
      ? db.select().from(termosResponsabilidade).where(and(...conditionsTermos)).orderBy(desc(termosResponsabilidade.createdAt))
      : db.select().from(termosResponsabilidade).orderBy(desc(termosResponsabilidade.createdAt)),
  ]);
  
  return { equipamentos, emails, senhas, termos };
}


// ===== CONVENÇÃO COLETIVA DE TRABALHO (CCT) =====
export async function listCCTs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(convencaoColetiva).orderBy(desc(convencaoColetiva.createdAt));
}

export async function getCCTById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(convencaoColetiva).where(eq(convencaoColetiva.id, id));
  return rows[0] || null;
}

export async function getCCTVigente() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(convencaoColetiva).where(eq(convencaoColetiva.status, 'vigente')).orderBy(desc(convencaoColetiva.createdAt)).limit(1);
  return rows[0] || null;
}

export async function createCCT(data: any) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(convencaoColetiva).values(data);
  return result.insertId;
}

export async function updateCCT(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(convencaoColetiva).set(data).where(eq(convencaoColetiva.id, id));
}

export async function deleteCCT(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(convencaoColetiva).where(eq(convencaoColetiva.id, id));
}


// =============================================
// ---- RESCISÃO AUDITORIA ----
// =============================================

export async function createRescisaoAuditoria(data: {
  colaboradorId: number;
  colaboradorNome: string;
  cargo?: string | null;
  salarioBase: string;
  dataDesligamento: string;
  tipoDesligamento: string;
  resultadoJson: string;
  acao: 'simulado' | 'descartado' | 'salvo';
  simuladoPorId?: number | null;
  simuladoPorNome?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(rescisaoAuditoria).values(data as any);
  return result[0]?.insertId;
}

export async function listRescisaoAuditoria(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rescisaoAuditoria).orderBy(desc(rescisaoAuditoria.createdAt)).limit(limit);
}

// ============================================================
// Ocorrências e Plano de Reversão
// ============================================================

export function classificarOcorrencia(tipo: string, gravidade: string, reincidencias: number) {
  // Mapa de classificação: reversível vs irreversível
  const irreversiveis = new Set([
    'falta_grave:gravissima',
    'conduta_inapropriada:gravissima',
    'conduta_inapropriada:grave',
    'conflito_interno:gravissima',
  ]);

  const key = `${tipo}:${gravidade}`;
  const isIrreversivel = irreversiveis.has(key) || (gravidade === 'gravissima') || (reincidencias >= 3 && gravidade !== 'leve');

  const classificacao = isIrreversivel ? 'irreversivel' : 'reversivel';

  // Recomendação automática
  let recomendacao: string;
  if (isIrreversivel) {
    recomendacao = 'desligamento';
  } else if (gravidade === 'grave' || reincidencias >= 2) {
    recomendacao = 'reversao';
  } else if (gravidade === 'media' || reincidencias === 1) {
    recomendacao = 'suspensao';
  } else {
    recomendacao = 'advertencia';
  }

  return { classificacao, recomendacao };
}

// Ocorrências CRUD
export async function listOcorrencias(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(ocorrencias)
      .where(eq(ocorrencias.colaboradorId, colaboradorId))
      .orderBy(desc(ocorrencias.createdAt));
  }
  return db.select().from(ocorrencias).orderBy(desc(ocorrencias.createdAt));
}

export async function getOcorrencia(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(ocorrencias).where(eq(ocorrencias.id, id)).limit(1);
  return rows[0] || null;
}

export async function countOcorrenciasByColaborador(colaboradorId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(ocorrencias)
    .where(eq(ocorrencias.colaboradorId, colaboradorId));
  return rows.length;
}

export async function createOcorrencia(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const [result] = await db.insert(ocorrencias).values({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertId;
}

export async function updateOcorrencia(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(ocorrencias).set({ ...data, updatedAt: Date.now() }).where(eq(ocorrencias.id, id));
}

export async function deleteOcorrencia(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ocorrencias).where(eq(ocorrencias.id, id));
}

// Plano de Reversão CRUD
export async function listPlanosReversao(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(planoReversao)
      .where(eq(planoReversao.colaboradorId, colaboradorId))
      .orderBy(desc(planoReversao.createdAt));
  }
  return db.select().from(planoReversao).orderBy(desc(planoReversao.createdAt));
}

export async function getPlanoReversao(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(planoReversao).where(eq(planoReversao.id, id)).limit(1);
  return rows[0] || null;
}

export async function createPlanoReversao(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const [result] = await db.insert(planoReversao).values({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertId;
}

export async function updatePlanoReversao(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(planoReversao).set({ ...data, updatedAt: Date.now() }).where(eq(planoReversao.id, id));
}

export async function deletePlanoReversao(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(planoReversao).where(eq(planoReversao.id, id));
}

// Etapas do Plano de Reversão
export async function listEtapasPlano(planoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planoReversaoEtapas)
    .where(eq(planoReversaoEtapas.planoId, planoId))
    .orderBy(planoReversaoEtapas.dataPrevista);
}

export async function createEtapaPlano(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const [result] = await db.insert(planoReversaoEtapas).values({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertId;
}

export async function updateEtapaPlano(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(planoReversaoEtapas).set({ ...data, updatedAt: Date.now() }).where(eq(planoReversaoEtapas.id, id));
}

export async function deleteEtapaPlano(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(planoReversaoEtapas).where(eq(planoReversaoEtapas.id, id));
}

// Feedbacks do Plano de Reversão
export async function listFeedbacksPlano(planoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planoReversaoFeedbacks)
    .where(eq(planoReversaoFeedbacks.planoId, planoId))
    .orderBy(desc(planoReversaoFeedbacks.createdAt));
}

export async function createFeedbackPlano(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const [result] = await db.insert(planoReversaoFeedbacks).values({
    ...data,
    createdAt: now,
  });
  return result.insertId;
}

export async function deleteFeedbackPlano(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(planoReversaoFeedbacks).where(eq(planoReversaoFeedbacks.id, id));
}

// Dashboard stats for ocorrências
export async function getOcorrenciasStats() {
  const db = await getDb();
  if (!db) return { total: 0, pendentes: 0, emAnalise: 0, resolvidas: 0, encaminhadasReversao: 0, encaminhadasDesligamento: 0, porTipo: {}, porGravidade: {} };
  
  const all = await db.select().from(ocorrencias);
  const porTipo: Record<string, number> = {};
  const porGravidade: Record<string, number> = {};
  let pendentes = 0, emAnalise = 0, resolvidas = 0, encaminhadasReversao = 0, encaminhadasDesligamento = 0;
  
  for (const o of all) {
    porTipo[o.tipo] = (porTipo[o.tipo] || 0) + 1;
    porGravidade[o.gravidade] = (porGravidade[o.gravidade] || 0) + 1;
    if (o.status === 'registrada') pendentes++;
    else if (o.status === 'em_analise') emAnalise++;
    else if (o.status === 'resolvida') resolvidas++;
    else if (o.status === 'encaminhada_reversao') encaminhadasReversao++;
    else if (o.status === 'encaminhada_desligamento') encaminhadasDesligamento++;
  }
  
  return { total: all.length, pendentes, emAnalise, resolvidas, encaminhadasReversao, encaminhadasDesligamento, porTipo, porGravidade };
}

// =============================================
// ---- OCORRÊNCIAS DASHBOARD & NOTIFICATIONS ----
// =============================================

export async function getOcorrenciasDashboard() {
  const db = await getDb();
  if (!db) return { porSetor: [], porTipo: [], porMes: [], planosReversaoStats: { total: 0, ativos: 0, sucesso: 0, fracasso: 0, cancelados: 0, taxaSucesso: 0 }, topReincidentes: [] };
  
  const allOcorrencias = await db.select().from(ocorrencias).orderBy(desc(ocorrencias.createdAt));
  const allPlanos = await db.select().from(planoReversao);
  
  // Por setor
  const setorMap: Record<string, number> = {};
  for (const o of allOcorrencias) {
    const setor = o.setor || 'Não informado';
    setorMap[setor] = (setorMap[setor] || 0) + 1;
  }
  const porSetor = Object.entries(setorMap).map(([setor, count]) => ({ setor, count })).sort((a, b) => b.count - a.count);
  
  // Por tipo
  const tipoMap: Record<string, number> = {};
  for (const o of allOcorrencias) {
    tipoMap[o.tipo] = (tipoMap[o.tipo] || 0) + 1;
  }
  const porTipo = Object.entries(tipoMap).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count);
  
  // Por mês (últimos 12 meses)
  const mesMap: Record<string, number> = {};
  for (const o of allOcorrencias) {
    const mes = o.dataOcorrencia ? o.dataOcorrencia.substring(0, 7) : 'N/A';
    mesMap[mes] = (mesMap[mes] || 0) + 1;
  }
  const porMes = Object.entries(mesMap).map(([mes, count]) => ({ mes, count })).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-12);
  
  // Planos de reversão stats
  const total = allPlanos.length;
  const ativos = allPlanos.filter(p => p.status === 'ativo').length;
  const sucesso = allPlanos.filter(p => p.status === 'concluido_sucesso').length;
  const fracasso = allPlanos.filter(p => p.status === 'concluido_fracasso').length;
  const cancelados = allPlanos.filter(p => p.status === 'cancelado').length;
  const concluidos = sucesso + fracasso;
  const taxaSucesso = concluidos > 0 ? Math.round((sucesso / concluidos) * 100) : 0;
  
  // Top reincidentes
  const colabMap: Record<number, { nome: string; setor: string; cargo: string; count: number }> = {};
  for (const o of allOcorrencias) {
    if (!colabMap[o.colaboradorId]) {
      colabMap[o.colaboradorId] = { nome: o.colaboradorNome, setor: o.setor || '', cargo: o.cargo || '', count: 0 };
    }
    colabMap[o.colaboradorId].count++;
  }
  const topReincidentes = Object.entries(colabMap)
    .map(([id, data]) => ({ colaboradorId: Number(id), ...data }))
    .filter(r => r.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return { porSetor, porTipo, porMes, planosReversaoStats: { total, ativos, sucesso, fracasso, cancelados, taxaSucesso }, topReincidentes };
}

export async function getHistoricoDisciplinar(colaboradorId: number) {
  const db = await getDb();
  if (!db) return { ocorrencias: [], planos: [], resumo: { totalOcorrencias: 0, reversiveis: 0, irreversiveis: 0, planosAtivos: 0, planosConcluidos: 0 } };
  
  const ocorrenciasList = await db.select().from(ocorrencias)
    .where(eq(ocorrencias.colaboradorId, colaboradorId))
    .orderBy(desc(ocorrencias.createdAt));
  
  const planosList = await db.select().from(planoReversao)
    .where(eq(planoReversao.colaboradorId, colaboradorId))
    .orderBy(desc(planoReversao.createdAt));
  
  const reversiveis = ocorrenciasList.filter(o => o.classificacao === 'reversivel').length;
  const irreversiveis = ocorrenciasList.filter(o => o.classificacao === 'irreversivel').length;
  const planosAtivos = planosList.filter(p => p.status === 'ativo').length;
  const planosConcluidos = planosList.filter(p => p.status === 'concluido_sucesso' || p.status === 'concluido_fracasso').length;
  
  return {
    ocorrencias: ocorrenciasList,
    planos: planosList,
    resumo: { totalOcorrencias: ocorrenciasList.length, reversiveis, irreversiveis, planosAtivos, planosConcluidos }
  };
}

export async function checkPlanosVencendo(diasAntecedencia: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const planosAtivos = await db.select().from(planoReversao)
    .where(eq(planoReversao.status, 'ativo'));
  
  const hoje = new Date();
  const vencendo: any[] = [];
  
  for (const p of planosAtivos) {
    const [y, m, d] = p.dataFim.split('-').map(Number);
    const dataFim = new Date(y, m - 1, d);
    const diffDias = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDias <= diasAntecedencia && diffDias >= 0) {
      vencendo.push({ ...p, diasRestantes: diffDias });
    } else if (diffDias < 0) {
      vencendo.push({ ...p, diasRestantes: diffDias, vencido: true });
    }
  }
  
  return vencendo;
}

export async function checkReincidenciasAlerta(limiteReincidencias: number = 3) {
  const db = await getDb();
  if (!db) return [];
  
  const allOcorrencias = await db.select().from(ocorrencias);
  
  const colabMap: Record<number, { nome: string; setor: string; cargo: string; count: number; ultimaData: string }> = {};
  for (const o of allOcorrencias) {
    if (!colabMap[o.colaboradorId]) {
      colabMap[o.colaboradorId] = { nome: o.colaboradorNome, setor: o.setor || '', cargo: o.cargo || '', count: 0, ultimaData: '' };
    }
    colabMap[o.colaboradorId].count++;
    if (o.dataOcorrencia > colabMap[o.colaboradorId].ultimaData) {
      colabMap[o.colaboradorId].ultimaData = o.dataOcorrencia;
    }
  }
  
  return Object.entries(colabMap)
    .filter(([_, data]) => data.count >= limiteReincidencias)
    .map(([id, data]) => ({ colaboradorId: Number(id), ...data }))
    .sort((a, b) => b.count - a.count);
}

export async function gerarNotificacoesOcorrencias() {
  const db = await getDb();
  if (!db) return { planosVencendo: 0, reincidencias: 0 };
  
  let planosVencendoCount = 0;
  let reincidenciasCount = 0;
  
  // Check planos vencendo (7 dias)
  const planosVencendo = await checkPlanosVencendo(7);
  for (const p of planosVencendo) {
    const titulo = p.vencido 
      ? `Plano de Reversão VENCIDO — ${p.colaboradorNome}`
      : `Plano de Reversão vencendo em ${p.diasRestantes} dia(s) — ${p.colaboradorNome}`;
    const mensagem = p.vencido
      ? `O plano de reversão de ${p.colaboradorNome} (${p.cargo || 'N/A'} - ${p.setor || 'N/A'}) venceu em ${p.dataFim}. É necessário realizar a avaliação final.`
      : `O plano de reversão de ${p.colaboradorNome} (${p.cargo || 'N/A'} - ${p.setor || 'N/A'}) vence em ${p.dataFim}. Restam ${p.diasRestantes} dia(s) para a avaliação final.`;
    
    await createNotificacao({
      tipo: 'geral',
      titulo,
      mensagem,
      lida: 0,
      usuarioId: null,
    } as any);
    planosVencendoCount++;
  }
  
  // Check reincidências (3+)
  const reincidentes = await checkReincidenciasAlerta(3);
  for (const r of reincidentes) {
    const titulo = `Alerta de Reincidência — ${r.nome}`;
    const mensagem = `O colaborador ${r.nome} (${r.cargo || 'N/A'} - ${r.setor || 'N/A'}) possui ${r.count} ocorrências registradas. Última ocorrência em ${r.ultimaData}. Recomenda-se avaliação para possível plano de reversão ou desligamento.`;
    
    await createNotificacao({
      tipo: 'geral',
      titulo,
      mensagem,
      lida: 0,
      usuarioId: null,
    } as any);
    reincidenciasCount++;
  }
  
  return { planosVencendo: planosVencendoCount, reincidencias: reincidenciasCount };
}


// ===== GESTOR DO SETOR (para auto-fill no plano de reversão) =====
export async function getGestorDoSetor(setorNome: string) {
  const db = await getDb();
  if (!db) return null;
  // Find setor by name
  const setoresRows = await db.select().from(setores);
  const setor = setoresRows.find((s: any) => s.nome?.toLowerCase() === setorNome.toLowerCase());
  if (!setor) return null;
  
  const hierarquia = ['diretor','gerente','coordenador','supervisor','analista_sr','analista_pl','analista_jr','assistente','auxiliar','estagiario'];
  const rows = await db.select().from(colaboradores).where(
    and(eq(colaboradores.setorId, setor.id), eq(colaboradores.ativo, 1))
  );
  if (rows.length === 0) return null;
  rows.sort((a: any, b: any) => {
    const ia = hierarquia.indexOf(a.nivelHierarquico || '');
    const ib = hierarquia.indexOf(b.nivelHierarquico || '');
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return { id: rows[0].id, nome: rows[0].nomeCompleto, cargo: rows[0].cargo };
}

// ===== GESTOR DE RH (GEG) =====
export async function getGestorRH() {
  const db = await getDb();
  if (!db) return null;
  const setoresRows = await db.select().from(setores);
  const setorRH = setoresRows.find((s: any) => 
    s.nome?.toLowerCase().includes('rh') || 
    s.nome?.toLowerCase().includes('gente') || 
    s.nome?.toLowerCase().includes('geg') ||
    s.nome?.toLowerCase().includes('recursos humanos') ||
    s.nome?.toLowerCase().includes('pessoas')
  );
  if (!setorRH) return null;
  
  const hierarquia = ['diretor','gerente','coordenador','supervisor','analista_sr','analista_pl','analista_jr','assistente','auxiliar','estagiario'];
  const rows = await db.select().from(colaboradores).where(
    and(eq(colaboradores.setorId, setorRH.id), eq(colaboradores.ativo, 1))
  );
  if (rows.length === 0) return null;
  rows.sort((a: any, b: any) => {
    const ia = hierarquia.indexOf(a.nivelHierarquico || '');
    const ib = hierarquia.indexOf(b.nivelHierarquico || '');
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return { id: rows[0].id, nome: rows[0].nomeCompleto, cargo: rows[0].cargo };
}

// ===== APROVAÇÃO DE OCORRÊNCIA =====
export async function aprovarOcorrencia(id: number, aprovadoPorId: number, aprovadoPorNome: string, aprovado: boolean) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  await db.update(ocorrencias).set({
    aprovacaoStatus: aprovado ? 'aprovada' : 'rejeitada',
    aprovadoPorId,
    aprovadoPorNome,
    aprovadoEm: now,
    updatedAt: now,
  } as any).where(eq(ocorrencias.id, id));
  return { success: true };
}

// ===== ESTIMAR CUSTO DE RESCISÃO =====
export async function estimarCustoRescisao(colaboradorId: number) {
  const db = await getDb();
  if (!db) return null;
  const colab = await db.select().from(colaboradores).where(eq(colaboradores.id, colaboradorId)).limit(1);
  if (colab.length === 0) return null;
  const c = colab[0];
  const salarioBase = parseFloat(String(c.salarioBase || '0'));
  const dataAdmissao = c.dataAdmissao;
  
  const admDate = new Date(dataAdmissao);
  const now = new Date();
  const mesesTrabalhados = Math.max(1, Math.round((now.getTime() - admDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  
  const saldoSalario = salarioBase;
  const avisoPrevio = salarioBase + (Math.min(Math.floor(mesesTrabalhados / 12), 20) * (salarioBase / 30) * 3);
  const decimoTerceiroProporcional = (salarioBase / 12) * (now.getMonth() + 1);
  const feriasProporcional = (salarioBase / 12) * (mesesTrabalhados % 12);
  const tercoConstitucional = feriasProporcional / 3;
  const fgtsEstimado = salarioBase * 0.08 * mesesTrabalhados;
  const multaFgts = fgtsEstimado * 0.4;
  
  const totalEstimado = saldoSalario + avisoPrevio + decimoTerceiroProporcional + feriasProporcional + tercoConstitucional + multaFgts;
  
  return {
    colaboradorNome: c.nomeCompleto,
    cargo: c.cargo,
    salarioBase,
    mesesTrabalhados,
    saldoSalario: Math.round(saldoSalario * 100) / 100,
    avisoPrevio: Math.round(avisoPrevio * 100) / 100,
    decimoTerceiroProporcional: Math.round(decimoTerceiroProporcional * 100) / 100,
    feriasProporcional: Math.round(feriasProporcional * 100) / 100,
    tercoConstitucional: Math.round(tercoConstitucional * 100) / 100,
    fgtsEstimado: Math.round(fgtsEstimado * 100) / 100,
    multaFgts: Math.round(multaFgts * 100) / 100,
    totalEstimado: Math.round(totalEstimado * 100) / 100,
  };
}


// =============================================
// ---- OCORRÊNCIA TIMELINE ----
// =============================================

export async function addTimelineEvent(data: {
  ocorrenciaId: number;
  tipo: 'registro' | 'alteracao_status' | 'aprovacao_solicitada' | 'aprovacao_aprovada' | 'aprovacao_rejeitada' | 'plano_criado' | 'feedback_adicionado' | 'assinatura_colaborador' | 'assinatura_gestor' | 'medida_aplicada' | 'observacao';
  titulo: string;
  descricao?: string;
  executadoPorId?: number;
  executadoPorNome: string;
  metadata?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(ocorrenciaTimeline).values({
    ...data,
    createdAt: Date.now(),
  });
  return result.insertId;
}

export async function getTimelineByOcorrencia(ocorrenciaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ocorrenciaTimeline)
    .where(eq(ocorrenciaTimeline.ocorrenciaId, ocorrenciaId))
    .orderBy(asc(ocorrenciaTimeline.createdAt));
}

// =============================================
// ---- ASSINATURAS DIGITAIS ----
// =============================================

export async function registrarAssinatura(data: {
  ocorrenciaId?: number;
  planoReversaoId?: number;
  tipo: 'ciencia_colaborador' | 'ciencia_gestor' | 'ciencia_rh' | 'concordancia_plano';
  assinanteName: string;
  assinanteId?: number;
  assinanteCargo?: string;
  ipAddress?: string;
  observacao?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const [result] = await db.insert(ocorrenciaAssinaturas).values({
    ...data,
    assinadoEm: now,
    createdAt: now,
  });
  return result.insertId;
}

export async function getAssinaturasByOcorrencia(ocorrenciaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ocorrenciaAssinaturas)
    .where(eq(ocorrenciaAssinaturas.ocorrenciaId, ocorrenciaId))
    .orderBy(asc(ocorrenciaAssinaturas.createdAt));
}

export async function getAssinaturasByPlano(planoReversaoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ocorrenciaAssinaturas)
    .where(eq(ocorrenciaAssinaturas.planoReversaoId, planoReversaoId))
    .orderBy(asc(ocorrenciaAssinaturas.createdAt));
}

// =============================================
// ---- RELATÓRIO MENSAL CONSOLIDADO ----
// =============================================

export async function getRelatorioMensalConsolidado(mes: number, ano: number) {
  const db = await getDb();
  if (!db) return null;

  const inicioMes = new Date(ano, mes - 1, 1).getTime();
  const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999).getTime();

  // Ocorrências do mês
  const ocorrenciasMes = await db.select().from(ocorrencias)
    .where(and(
      sql`${ocorrencias.createdAt} >= ${inicioMes}`,
      sql`${ocorrencias.createdAt} <= ${fimMes}`
    ));

  // Planos criados no mês
  const planosMes = await db.select().from(planoReversao)
    .where(and(
      sql`${planoReversao.createdAt} >= ${inicioMes}`,
      sql`${planoReversao.createdAt} <= ${fimMes}`
    ));

  // Todos os planos ativos
  const planosAtivos = await db.select().from(planoReversao)
    .where(eq(planoReversao.status, 'ativo'));

  // Feedbacks do mês
  const feedbacksMes = await db.select().from(planoReversaoFeedbacks)
    .where(and(
      sql`${planoReversaoFeedbacks.createdAt} >= ${inicioMes}`,
      sql`${planoReversaoFeedbacks.createdAt} <= ${fimMes}`
    ));

  // Contadores por tipo
  const porTipo: Record<string, number> = {};
  const porGravidade: Record<string, number> = {};
  const porSetor: Record<string, number> = {};
  const porClassificacao: Record<string, number> = {};
  const porRecomendacao: Record<string, number> = {};

  for (const o of ocorrenciasMes) {
    porTipo[o.tipo] = (porTipo[o.tipo] || 0) + 1;
    porGravidade[o.gravidade] = (porGravidade[o.gravidade] || 0) + 1;
    porSetor[o.setor || 'Não informado'] = (porSetor[o.setor || 'Não informado'] || 0) + 1;
    porClassificacao[o.classificacao] = (porClassificacao[o.classificacao] || 0) + 1;
    porRecomendacao[o.recomendacao] = (porRecomendacao[o.recomendacao] || 0) + 1;
  }

  // Feedbacks evolução
  const evolucaoFeedbacks = { melhorou: 0, estavel: 0, piorou: 0 };
  for (const f of feedbacksMes) {
    if (f.evolucao && f.evolucao in evolucaoFeedbacks) {
      evolucaoFeedbacks[f.evolucao as keyof typeof evolucaoFeedbacks]++;
    }
  }

  // Colaboradores reincidentes (3+ ocorrências no total)
  const todasOcorrencias = await db.select().from(ocorrencias);
  const contagemPorColab: Record<number, { nome: string; count: number; setor: string }> = {};
  for (const o of todasOcorrencias) {
    if (!contagemPorColab[o.colaboradorId]) {
      contagemPorColab[o.colaboradorId] = { nome: o.colaboradorNome, count: 0, setor: o.setor || 'N/A' };
    }
    contagemPorColab[o.colaboradorId].count++;
  }
  const reincidentes = Object.entries(contagemPorColab)
    .filter(([_, v]) => v.count >= 3)
    .map(([id, v]) => ({ colaboradorId: Number(id), ...v }));

  return {
    periodo: { mes, ano },
    resumo: {
      totalOcorrencias: ocorrenciasMes.length,
      totalPlanosCriados: planosMes.length,
      totalPlanosAtivos: planosAtivos.length,
      totalFeedbacks: feedbacksMes.length,
      totalReincidentes: reincidentes.length,
    },
    porTipo,
    porGravidade,
    porSetor,
    porClassificacao,
    porRecomendacao,
    evolucaoFeedbacks,
    reincidentes,
    ocorrencias: ocorrenciasMes,
    planosCriados: planosMes,
    planosAtivos,
  };
}

// ===== SETOR DASHBOARD STATS =====
export async function getSetorTaskStats(setorId: number, filters?: {
  responsavelId?: number;
  periodoInicio?: string;
  periodoFim?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const conditions: any[] = [eq(tarefas.setorId, setorId)];
  if (filters?.responsavelId) conditions.push(eq(tarefas.responsavelId, filters.responsavelId));
  if (filters?.periodoInicio) conditions.push(sql`${tarefas.createdAt} >= ${filters.periodoInicio}`);
  if (filters?.periodoFim) conditions.push(sql`${tarefas.createdAt} <= ${filters.periodoFim}`);

  const whereClause = and(...conditions);

  const [stats] = await db.select({
    total: sql<number>`COUNT(*)`,
    a_fazer: sql<number>`SUM(CASE WHEN ${tarefas.status} IN ('a_fazer','backlog') THEN 1 ELSE 0 END)`,
    em_andamento: sql<number>`SUM(CASE WHEN ${tarefas.status} IN ('fazendo','em_andamento') THEN 1 ELSE 0 END)`,
    revisao: sql<number>`SUM(CASE WHEN ${tarefas.status} = 'revisao' THEN 1 ELSE 0 END)`,
    concluido: sql<number>`SUM(CASE WHEN ${tarefas.status} = 'concluido' THEN 1 ELSE 0 END)`,
    cancelado: sql<number>`SUM(CASE WHEN ${tarefas.status} = 'cancelado' THEN 1 ELSE 0 END)`,
    vencido: sql<number>`SUM(CASE WHEN ${tarefas.slaStatus} = 'vencido' THEN 1 ELSE 0 END)`,
    atencao: sql<number>`SUM(CASE WHEN ${tarefas.slaStatus} = 'atencao' THEN 1 ELSE 0 END)`,
    urgente: sql<number>`SUM(CASE WHEN ${tarefas.prioridade} IN ('urgente','alta') THEN 1 ELSE 0 END)`,
  }).from(tarefas).where(whereClause);

  // Get per-responsible stats
  const responsavelStats = await db.select({
    responsavelId: tarefas.responsavelId,
    total: sql<number>`COUNT(*)`,
    concluido: sql<number>`SUM(CASE WHEN ${tarefas.status} = 'concluido' THEN 1 ELSE 0 END)`,
    vencido: sql<number>`SUM(CASE WHEN ${tarefas.slaStatus} = 'vencido' THEN 1 ELSE 0 END)`,
  }).from(tarefas).where(whereClause).groupBy(tarefas.responsavelId);

  // Get per-status breakdown
  const statusBreakdown = await db.select({
    status: tarefas.status,
    count: sql<number>`COUNT(*)`,
  }).from(tarefas).where(whereClause).groupBy(tarefas.status);

  // Get per-priority breakdown
  const prioridadeBreakdown = await db.select({
    prioridade: tarefas.prioridade,
    count: sql<number>`COUNT(*)`,
  }).from(tarefas).where(whereClause).groupBy(tarefas.prioridade);

  return {
    total: Number(stats?.total || 0),
    aFazer: Number(stats?.a_fazer || 0),
    emAndamento: Number(stats?.em_andamento || 0),
    revisao: Number(stats?.revisao || 0),
    concluido: Number(stats?.concluido || 0),
    cancelado: Number(stats?.cancelado || 0),
    vencido: Number(stats?.vencido || 0),
    atencao: Number(stats?.atencao || 0),
    urgente: Number(stats?.urgente || 0),
    pendentes: Number(stats?.a_fazer || 0) + Number(stats?.em_andamento || 0) + Number(stats?.revisao || 0),
    responsavelStats: responsavelStats.map(r => ({
      responsavelId: r.responsavelId,
      total: Number(r.total),
      concluido: Number(r.concluido),
      vencido: Number(r.vencido),
    })),
    statusBreakdown: statusBreakdown.map(s => ({
      status: s.status,
      count: Number(s.count),
    })),
    prioridadeBreakdown: prioridadeBreakdown.map(p => ({
      prioridade: p.prioridade,
      count: Number(p.count),
    })),
  };
}
