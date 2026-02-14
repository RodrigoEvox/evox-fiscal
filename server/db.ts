import { eq, desc, asc, and, sql, or, isNull } from "drizzle-orm";
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

import { servicos, InsertServico, setorConfig, InsertSetorConfig } from "../drizzle/schema";

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

  const parceirosResult = await db.select({ id: parceiros.id, nomeCompleto: parceiros.nomeCompleto, cpfCnpj: parceiros.cpfCnpj })
    .from(parceiros)
    .where(or(
      sql`${parceiros.nomeCompleto} LIKE ${like}`,
      sql`${parceiros.cpfCnpj} LIKE ${like}`,
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
