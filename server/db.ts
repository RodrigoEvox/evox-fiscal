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
  aprovacaoComissao, InsertAprovacaoComissao,
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
  return db.select().from(clientes).orderBy(desc(clientes.createdAt));
}

export async function getClienteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCliente(data: InsertCliente) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(clientes).values(data);
  return result[0].insertId;
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
  if (usuarioId) {
    return db.select().from(notificacoes)
      .where(or(eq(notificacoes.usuarioId, usuarioId), isNull(notificacoes.usuarioId)))
      .orderBy(desc(notificacoes.createdAt)).limit(50);
  }
  return db.select().from(notificacoes).orderBy(desc(notificacoes.createdAt)).limit(50);
}

export async function createNotificacao(data: InsertNotificacao) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notificacoes).values(data);
  return result[0].insertId;
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

  return { clientes: clientesResult, tarefas: tarefasResult, parceiros: parceirosResult, teses: tesesResult, usuarios: usuariosResult };
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
        { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/ct/nova-tarefa" },
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
    .where(eq(parceiros.ehSubparceiro, false))
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

export async function createAprovacaoComissao(data: InsertAprovacaoComissao) {
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
  // Buscar colaboradores com periodoExperiencia definido e status ativo/experiencia
  const rows = await db.select().from(colaboradores)
    .where(
      and(
        isNotNull(colaboradores.periodoExperiencia),
        sql`${colaboradores.periodoExperiencia} > 0`,
        sql`${colaboradores.statusColaborador} IN ('ativo', 'experiencia')`,
        isNotNull(colaboradores.dataAdmissao),
      )
    );
  
  const hoje = new Date();
  const resultado: any[] = [];
  
  for (const c of rows) {
    if (!c.dataAdmissao || !c.periodoExperiencia) continue;
    const admissao = new Date(c.dataAdmissao);
    const vencimento = new Date(admissao);
    vencimento.setDate(vencimento.getDate() + c.periodoExperiencia);
    
    const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDias >= 0 && diffDias <= diasAntecedencia) {
      resultado.push({
        ...c,
        dataVencimento: vencimento.toISOString().split('T')[0],
        diasRestantes: diffDias,
      });
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
  }).from(parceiros).where(and(eq(parceiros.parceiroPaiId, parceiroId), eq(parceiros.ehSubparceiro, true)));

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
