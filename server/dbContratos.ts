import { eq, desc, and, sql, like, or, asc } from "drizzle-orm";
import { getDb } from "./db";
import {
  contratos,
  contratoDocumentos,
  contratoHistorico,
  clientes,
  parceiros,
} from "../drizzle/schema";

// ===== TYPE ALIASES =====
type InsertContrato = typeof contratos.$inferInsert;
type InsertContratoDocumento = typeof contratoDocumentos.$inferInsert;
type InsertContratoHistorico = typeof contratoHistorico.$inferInsert;

// ===== CONTRATOS CRUD =====

export async function listContratos(filters: {
  fila?: string;
  status?: string;
  tipo?: string;
  clienteId?: number;
  parceiroId?: number;
  responsavelId?: number;
  busca?: string;
} = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (filters.fila) conditions.push(eq(contratos.fila, filters.fila as any));
  if (filters.status) conditions.push(eq(contratos.status, filters.status as any));
  if (filters.tipo) conditions.push(eq(contratos.tipo, filters.tipo as any));
  if (filters.clienteId) conditions.push(eq(contratos.clienteId, filters.clienteId));
  if (filters.parceiroId) conditions.push(eq(contratos.parceiroId, filters.parceiroId));
  if (filters.responsavelId) conditions.push(eq(contratos.responsavelId, filters.responsavelId));
  if (filters.busca) {
    conditions.push(or(
      like(contratos.numero, `%${filters.busca}%`),
      like(contratos.clienteNome, `%${filters.busca}%`),
      like(contratos.clienteCnpj, `%${filters.busca}%`),
      like(contratos.parceiroNome, `%${filters.busca}%`),
    ));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db.select().from(contratos)
    .where(whereClause)
    .orderBy(desc(contratos.createdAt));
}

export async function getContratoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(contratos).where(eq(contratos.id, id));
  return row || null;
}

export async function createContrato(data: Omit<InsertContrato, 'numero'>) {
  const db = await getDb();
  if (!db) return null;

  // Generate sequential number
  const [countResult] = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(contratos);
  const nextNum = Number(countResult?.count || 0) + 1;
  const numero = `CON-${String(nextNum).padStart(4, '0')}`;

  const [result] = await db.insert(contratos).values({
    ...data,
    numero,
  } as InsertContrato);

  // Log creation
  await createContratoHistorico({
    contratoId: result.insertId,
    acao: 'criacao',
    descricao: `Contrato ${numero} criado`,
    dadosNovos: { ...data, numero },
    usuarioId: data.criadoPorId,
    usuarioNome: data.criadoPorNome,
  });

  return { id: result.insertId, numero };
}

export async function updateContrato(id: number, data: Partial<InsertContrato>, userId?: number, userName?: string) {
  const db = await getDb();
  if (!db) return null;

  // Get old data for audit
  const oldData = await getContratoById(id);

  await db.update(contratos).set(data).where(eq(contratos.id, id));

  // Log update
  await createContratoHistorico({
    contratoId: id,
    acao: 'edicao',
    descricao: `Contrato atualizado`,
    dadosAntigos: oldData,
    dadosNovos: data,
    usuarioId: userId,
    usuarioNome: userName,
  });

  return { success: true };
}

export async function updateContratoFila(id: number, novaFila: string, userId?: number, userName?: string) {
  const db = await getDb();
  if (!db) return null;

  const oldData = await getContratoById(id);
  const filaAnterior = oldData?.fila;

  await db.update(contratos).set({
    fila: novaFila as any,
    status: 'a_fazer',
  }).where(eq(contratos.id, id));

  await createContratoHistorico({
    contratoId: id,
    acao: 'mudanca_fila',
    descricao: `Movido de ${filaAnterior} para ${novaFila}`,
    dadosAntigos: { fila: filaAnterior },
    dadosNovos: { fila: novaFila },
    usuarioId: userId,
    usuarioNome: userName,
  });

  return { success: true };
}

export async function updateContratoStatus(id: number, novoStatus: string, userId?: number, userName?: string) {
  const db = await getDb();
  if (!db) return null;

  const oldData = await getContratoById(id);
  const statusAnterior = oldData?.status;

  await db.update(contratos).set({
    status: novoStatus as any,
  }).where(eq(contratos.id, id));

  await createContratoHistorico({
    contratoId: id,
    acao: 'mudanca_status',
    descricao: `Status alterado de ${statusAnterior} para ${novoStatus}`,
    dadosAntigos: { status: statusAnterior },
    dadosNovos: { status: novoStatus },
    usuarioId: userId,
    usuarioNome: userName,
  });

  return { success: true };
}

// ===== DOCUMENTOS =====

export async function listContratoDocumentos(contratoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contratoDocumentos)
    .where(eq(contratoDocumentos.contratoId, contratoId))
    .orderBy(desc(contratoDocumentos.createdAt));
}

export async function createContratoDocumento(data: InsertContratoDocumento) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(contratoDocumentos).values(data);

  await createContratoHistorico({
    contratoId: data.contratoId,
    acao: 'upload_documento',
    descricao: `Documento "${data.nome}" (${data.tipo}) enviado`,
    dadosNovos: { nome: data.nome, tipo: data.tipo },
    usuarioId: data.uploadPorId,
    usuarioNome: data.uploadPorNome,
  });

  return { id: result.insertId };
}

export async function deleteContratoDocumento(id: number) {
  const db = await getDb();
  if (!db) return null;
  await db.delete(contratoDocumentos).where(eq(contratoDocumentos.id, id));
  return { success: true };
}

// ===== HISTÓRICO =====

export async function listContratoHistorico(contratoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contratoHistorico)
    .where(eq(contratoHistorico.contratoId, contratoId))
    .orderBy(desc(contratoHistorico.createdAt));
}

export async function createContratoHistorico(data: InsertContratoHistorico) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(contratoHistorico).values(data);
  return { id: result.insertId };
}

// ===== DASHBOARD STATS =====

export async function getContratosDashboard(filters: {
  responsavelId?: number;
  parceiroId?: number;
  periodoInicio?: string;
  periodoFim?: string;
} = {}) {
  const db = await getDb();
  if (!db) return null;

  const conditions: any[] = [];
  if (filters.responsavelId) conditions.push(eq(contratos.responsavelId, filters.responsavelId));
  if (filters.parceiroId) conditions.push(eq(contratos.parceiroId, filters.parceiroId));
  if (filters.periodoInicio) conditions.push(sql`${contratos.createdAt} >= ${filters.periodoInicio}`);
  if (filters.periodoFim) conditions.push(sql`${contratos.createdAt} <= ${filters.periodoFim}`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Overall stats
  const [stats] = await db.select({
    total: sql<number>`COUNT(*)`,
    elaboracao: sql<number>`SUM(CASE WHEN ${contratos.fila} = 'elaboracao' THEN 1 ELSE 0 END)`,
    revisao: sql<number>`SUM(CASE WHEN ${contratos.fila} = 'revisao' THEN 1 ELSE 0 END)`,
    assinatura: sql<number>`SUM(CASE WHEN ${contratos.fila} = 'assinatura' THEN 1 ELSE 0 END)`,
    vigencia: sql<number>`SUM(CASE WHEN ${contratos.fila} = 'vigencia' THEN 1 ELSE 0 END)`,
    renovacao: sql<number>`SUM(CASE WHEN ${contratos.fila} = 'renovacao' THEN 1 ELSE 0 END)`,
    encerrado: sql<number>`SUM(CASE WHEN ${contratos.fila} = 'encerrado' THEN 1 ELSE 0 END)`,
    a_fazer: sql<number>`SUM(CASE WHEN ${contratos.status} = 'a_fazer' THEN 1 ELSE 0 END)`,
    fazendo: sql<number>`SUM(CASE WHEN ${contratos.status} = 'fazendo' THEN 1 ELSE 0 END)`,
    feito: sql<number>`SUM(CASE WHEN ${contratos.status} = 'feito' THEN 1 ELSE 0 END)`,
    concluido: sql<number>`SUM(CASE WHEN ${contratos.status} = 'concluido' THEN 1 ELSE 0 END)`,
    vencido: sql<number>`SUM(CASE WHEN ${contratos.slaStatus} = 'vencido' THEN 1 ELSE 0 END)`,
    valorTotal: sql<number>`COALESCE(SUM(CAST(${contratos.valorContrato} AS DECIMAL(15,2))), 0)`,
  }).from(contratos).where(whereClause);

  // Per-type breakdown
  const tipoBreakdown = await db.select({
    tipo: contratos.tipo,
    count: sql<number>`COUNT(*)`,
    valor: sql<number>`COALESCE(SUM(CAST(${contratos.valorContrato} AS DECIMAL(15,2))), 0)`,
  }).from(contratos).where(whereClause).groupBy(contratos.tipo);

  // Per-responsible breakdown
  const responsavelBreakdown = await db.select({
    responsavelId: contratos.responsavelId,
    responsavelNome: contratos.responsavelNome,
    total: sql<number>`COUNT(*)`,
    concluido: sql<number>`SUM(CASE WHEN ${contratos.status} = 'concluido' THEN 1 ELSE 0 END)`,
    vencido: sql<number>`SUM(CASE WHEN ${contratos.slaStatus} = 'vencido' THEN 1 ELSE 0 END)`,
  }).from(contratos).where(whereClause).groupBy(contratos.responsavelId, contratos.responsavelNome);

  return {
    total: Number(stats?.total || 0),
    elaboracao: Number(stats?.elaboracao || 0),
    revisao: Number(stats?.revisao || 0),
    assinatura: Number(stats?.assinatura || 0),
    vigencia: Number(stats?.vigencia || 0),
    renovacao: Number(stats?.renovacao || 0),
    encerrado: Number(stats?.encerrado || 0),
    aFazer: Number(stats?.a_fazer || 0),
    fazendo: Number(stats?.fazendo || 0),
    feito: Number(stats?.feito || 0),
    concluido: Number(stats?.concluido || 0),
    vencido: Number(stats?.vencido || 0),
    pendentes: Number(stats?.a_fazer || 0) + Number(stats?.fazendo || 0) + Number(stats?.feito || 0),
    valorTotal: Number(stats?.valorTotal || 0),
    tipoBreakdown: tipoBreakdown.map(t => ({
      tipo: t.tipo,
      count: Number(t.count),
      valor: Number(t.valor),
    })),
    responsavelBreakdown: responsavelBreakdown.map(r => ({
      responsavelId: r.responsavelId,
      responsavelNome: r.responsavelNome,
      total: Number(r.total),
      concluido: Number(r.concluido),
      vencido: Number(r.vencido),
    })),
  };
}

// ===== FILAS =====

export async function listContratosByFila(fila: string, filters: {
  status?: string;
  responsavelId?: number;
  busca?: string;
} = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [eq(contratos.fila, fila as any)];
  if (filters.status) conditions.push(eq(contratos.status, filters.status as any));
  if (filters.responsavelId) conditions.push(eq(contratos.responsavelId, filters.responsavelId));
  if (filters.busca) {
    conditions.push(or(
      like(contratos.numero, `%${filters.busca}%`),
      like(contratos.clienteNome, `%${filters.busca}%`),
      like(contratos.clienteCnpj, `%${filters.busca}%`),
    ));
  }

  return db.select().from(contratos)
    .where(and(...conditions))
    .orderBy(asc(contratos.createdAt));
}

export async function getFilaStats(fila: string) {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db.select({
    total: sql<number>`COUNT(*)`,
    a_fazer: sql<number>`SUM(CASE WHEN ${contratos.status} = 'a_fazer' THEN 1 ELSE 0 END)`,
    fazendo: sql<number>`SUM(CASE WHEN ${contratos.status} = 'fazendo' THEN 1 ELSE 0 END)`,
    feito: sql<number>`SUM(CASE WHEN ${contratos.status} = 'feito' THEN 1 ELSE 0 END)`,
    concluido: sql<number>`SUM(CASE WHEN ${contratos.status} = 'concluido' THEN 1 ELSE 0 END)`,
    vencido: sql<number>`SUM(CASE WHEN ${contratos.slaStatus} = 'vencido' THEN 1 ELSE 0 END)`,
  }).from(contratos).where(eq(contratos.fila, fila as any));

  return {
    total: Number(stats?.total || 0),
    aFazer: Number(stats?.a_fazer || 0),
    fazendo: Number(stats?.fazendo || 0),
    feito: Number(stats?.feito || 0),
    concluido: Number(stats?.concluido || 0),
    vencido: Number(stats?.vencido || 0),
  };
}
