import { eq, desc, and, sql, like, or, inArray, asc } from "drizzle-orm";
import { getDb } from "./db";
import {
  bibLivros,
  bibExemplares,
  bibEmprestimos,
  bibReservas,
  bibOcorrencias,
  bibFornecedoresDoadores,
  bibPoliticas,
  bibAuditoria,
  bibBloqueios,
} from "../drizzle/schema";

// ===== TYPE ALIASES =====
type InsertLivro = typeof bibLivros.$inferInsert;
type InsertExemplar = typeof bibExemplares.$inferInsert;
type InsertEmprestimo = typeof bibEmprestimos.$inferInsert;
type InsertReserva = typeof bibReservas.$inferInsert;
type InsertOcorrencia = typeof bibOcorrencias.$inferInsert;
type InsertFornecedorDoador = typeof bibFornecedoresDoadores.$inferInsert;
type InsertPolitica = typeof bibPoliticas.$inferInsert;
type InsertAuditoria = typeof bibAuditoria.$inferInsert;
type InsertBloqueio = typeof bibBloqueios.$inferInsert;

// ===== LIVROS =====

export async function listLivros() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bibLivros).orderBy(desc(bibLivros.updatedAt));
}

export async function getLivro(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(bibLivros).where(eq(bibLivros.id, id)).limit(1);
  return rows[0] || null;
}

export async function createLivro(data: InsertLivro) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(bibLivros).values(data).$returningId() as any;
  return result;
}

export async function updateLivro(id: number, data: Partial<InsertLivro>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bibLivros).set(data).where(eq(bibLivros.id, id));
}

export async function deleteLivro(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bibLivros).where(eq(bibLivros.id, id));
}

// ===== EXEMPLARES =====

export async function listExemplares(livroId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (livroId) {
    return db.select().from(bibExemplares).where(eq(bibExemplares.livroId, livroId)).orderBy(desc(bibExemplares.createdAt));
  }
  return db.select().from(bibExemplares).orderBy(desc(bibExemplares.createdAt));
}

export async function getExemplar(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(bibExemplares).where(eq(bibExemplares.id, id)).limit(1);
  return rows[0] || null;
}

export async function createExemplar(data: InsertExemplar) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(bibExemplares).values(data).$returningId() as any;
  return result;
}

export async function updateExemplar(id: number, data: Partial<InsertExemplar>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bibExemplares).set(data).where(eq(bibExemplares.id, id));
}

export async function deleteExemplar(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bibExemplares).where(eq(bibExemplares.id, id));
}

// ===== EMPRÉSTIMOS =====

export async function listEmprestimos(filters?: { status?: string; colaboradorId?: number; livroId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.status) conditions.push(eq(bibEmprestimos.status, filters.status as any));
  if (filters?.colaboradorId) conditions.push(eq(bibEmprestimos.colaboradorId, filters.colaboradorId));
  if (filters?.livroId) conditions.push(eq(bibEmprestimos.livroId, filters.livroId));
  if (conditions.length > 0) {
    return db.select().from(bibEmprestimos).where(and(...conditions)).orderBy(desc(bibEmprestimos.createdAt));
  }
  return db.select().from(bibEmprestimos).orderBy(desc(bibEmprestimos.createdAt));
}

export async function getEmprestimo(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(bibEmprestimos).where(eq(bibEmprestimos.id, id)).limit(1);
  return rows[0] || null;
}

export async function createEmprestimo(data: InsertEmprestimo) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(bibEmprestimos).values(data).$returningId() as any;
  // Update exemplar status to 'emprestado'
  await db.update(bibExemplares).set({ status: 'emprestado' }).where(eq(bibExemplares.id, data.exemplarId));
  return result;
}

export async function updateEmprestimo(id: number, data: Partial<InsertEmprestimo>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bibEmprestimos).set(data).where(eq(bibEmprestimos.id, id));
}

export async function renovarEmprestimo(id: number, novaPrevista: string) {
  const db = await getDb();
  if (!db) return { success: false, message: 'DB não disponível' };
  const emp = await getEmprestimo(id);
  if (!emp) return { success: false, message: 'Empréstimo não encontrado' };
  if (emp.status !== 'ativo') return { success: false, message: 'Empréstimo não está ativo' };
  if (emp.renovacoes >= emp.limiteRenovacoes) return { success: false, message: 'Limite de renovações atingido' };
  // Check if there are active reservations for this book
  const reservas = await db.select().from(bibReservas)
    .where(and(eq(bibReservas.livroId, emp.livroId), eq(bibReservas.status, 'ativa')));
  if (reservas.length > 0) return { success: false, message: 'Há reservas ativas para este livro. Renovação não permitida.' };
  await db.update(bibEmprestimos).set({
    dataPrevistaDevolucao: novaPrevista,
    renovacoes: emp.renovacoes + 1,
  }).where(eq(bibEmprestimos.id, id));
  return { success: true, message: 'Renovação realizada com sucesso' };
}

export async function devolverEmprestimo(id: number, checklistDevolucao: any, dataEfetiva: string) {
  const db = await getDb();
  if (!db) return;
  const emp = await getEmprestimo(id);
  if (!emp) return;
  await db.update(bibEmprestimos).set({
    status: 'devolvido',
    dataEfetivaDevolucao: dataEfetiva,
    checklistDevolucao,
  }).where(eq(bibEmprestimos.id, id));
  // Update exemplar status back to 'disponivel'
  await db.update(bibExemplares).set({ status: 'disponivel' }).where(eq(bibExemplares.id, emp.exemplarId));
  // Check if there are pending reservations for this book and auto-assign
  const reservas = await db.select().from(bibReservas)
    .where(and(eq(bibReservas.livroId, emp.livroId), eq(bibReservas.status, 'ativa')))
    .orderBy(asc(bibReservas.posicaoFila))
    .limit(1);
  if (reservas.length > 0) {
    const reserva = reservas[0];
    const today = new Date().toISOString().slice(0, 10);
    await db.update(bibReservas).set({
      exemplarId: emp.exemplarId,
      dataDisponibilidade: today,
      status: 'ativa',
    }).where(eq(bibReservas.id, reserva.id));
    // Mark exemplar as reserved
    await db.update(bibExemplares).set({ status: 'reservado' }).where(eq(bibExemplares.id, emp.exemplarId));
  }
}

// ===== RESERVAS =====

export async function listReservas(filters?: { status?: string; colaboradorId?: number; livroId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.status) conditions.push(eq(bibReservas.status, filters.status as any));
  if (filters?.colaboradorId) conditions.push(eq(bibReservas.colaboradorId, filters.colaboradorId));
  if (filters?.livroId) conditions.push(eq(bibReservas.livroId, filters.livroId));
  if (conditions.length > 0) {
    return db.select().from(bibReservas).where(and(...conditions)).orderBy(asc(bibReservas.posicaoFila));
  }
  return db.select().from(bibReservas).orderBy(desc(bibReservas.createdAt));
}

export async function createReserva(data: InsertReserva) {
  const db = await getDb();
  if (!db) return null;
  // Calculate queue position
  const existing = await db.select().from(bibReservas)
    .where(and(eq(bibReservas.livroId, data.livroId), eq(bibReservas.status, 'ativa')));
  const posicao = existing.length + 1;
  const [result] = await db.insert(bibReservas).values({ ...data, posicaoFila: posicao }).$returningId() as any;
  return result;
}

export async function updateReserva(id: number, data: Partial<InsertReserva>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bibReservas).set(data).where(eq(bibReservas.id, id));
}

export async function cancelarReserva(id: number) {
  const db = await getDb();
  if (!db) return;
  const reserva = await db.select().from(bibReservas).where(eq(bibReservas.id, id)).limit(1);
  if (!reserva[0]) return;
  await db.update(bibReservas).set({ status: 'cancelada' }).where(eq(bibReservas.id, id));
  // If exemplar was reserved for this, make it available again
  if (reserva[0].exemplarId) {
    await db.update(bibExemplares).set({ status: 'disponivel' }).where(eq(bibExemplares.id, reserva[0].exemplarId));
  }
}

// ===== OCORRÊNCIAS =====

export async function listOcorrencias(filters?: { tipo?: string; colaboradorId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.tipo) conditions.push(eq(bibOcorrencias.tipo, filters.tipo as any));
  if (filters?.colaboradorId) conditions.push(eq(bibOcorrencias.colaboradorId, filters.colaboradorId));
  if (conditions.length > 0) {
    return db.select().from(bibOcorrencias).where(and(...conditions)).orderBy(desc(bibOcorrencias.createdAt));
  }
  return db.select().from(bibOcorrencias).orderBy(desc(bibOcorrencias.createdAt));
}

export async function createOcorrencia(data: InsertOcorrencia) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(bibOcorrencias).values(data).$returningId() as any;
  return result;
}

export async function updateOcorrencia(id: number, data: Partial<InsertOcorrencia>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bibOcorrencias).set(data).where(eq(bibOcorrencias.id, id));
}

// ===== FORNECEDORES / DOADORES =====

export async function listFornecedoresDoadores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bibFornecedoresDoadores).orderBy(desc(bibFornecedoresDoadores.createdAt));
}

export async function createFornecedorDoador(data: InsertFornecedorDoador) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(bibFornecedoresDoadores).values(data).$returningId() as any;
  return result;
}

export async function updateFornecedorDoador(id: number, data: Partial<InsertFornecedorDoador>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bibFornecedoresDoadores).set(data).where(eq(bibFornecedoresDoadores.id, id));
}

export async function deleteFornecedorDoador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bibFornecedoresDoadores).where(eq(bibFornecedoresDoadores.id, id));
}

// ===== POLÍTICAS =====

export async function listPoliticas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bibPoliticas).orderBy(asc(bibPoliticas.chave));
}

export async function upsertPolitica(data: InsertPolitica) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(bibPoliticas).where(eq(bibPoliticas.chave, data.chave)).limit(1);
  if (existing.length > 0) {
    await db.update(bibPoliticas).set(data).where(eq(bibPoliticas.id, existing[0].id));
  } else {
    await db.insert(bibPoliticas).values(data);
  }
}

export async function getPoliticaValor(chave: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(bibPoliticas).where(eq(bibPoliticas.chave, chave)).limit(1);
  return rows[0]?.valor || null;
}

// ===== AUDITORIA =====

export async function listAuditoria(filters?: { entidadeTipo?: string; usuarioId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.entidadeTipo) conditions.push(eq(bibAuditoria.entidadeTipo, filters.entidadeTipo));
  if (filters?.usuarioId) conditions.push(eq(bibAuditoria.usuarioId, filters.usuarioId));
  const query = conditions.length > 0
    ? db.select().from(bibAuditoria).where(and(...conditions)).orderBy(desc(bibAuditoria.createdAt)).limit(filters?.limit || 200)
    : db.select().from(bibAuditoria).orderBy(desc(bibAuditoria.createdAt)).limit(filters?.limit || 200);
  return query;
}

export async function createAuditoriaBib(data: InsertAuditoria) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bibAuditoria).values(data);
}

// ===== BLOQUEIOS =====

export async function listBloqueios(colaboradorId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (colaboradorId) {
    return db.select().from(bibBloqueios).where(eq(bibBloqueios.colaboradorId, colaboradorId)).orderBy(desc(bibBloqueios.createdAt));
  }
  return db.select().from(bibBloqueios).orderBy(desc(bibBloqueios.createdAt));
}

export async function createBloqueio(data: InsertBloqueio) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(bibBloqueios).values(data).$returningId() as any;
  return result;
}

export async function desbloquearColaborador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bibBloqueios).set({ ativo: 0, dataFim: new Date().toISOString().slice(0, 10) }).where(eq(bibBloqueios.id, id));
}

export async function isColaboradorBloqueado(colaboradorId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(bibBloqueios)
    .where(and(eq(bibBloqueios.colaboradorId, colaboradorId), eq(bibBloqueios.ativo, 1)))
    .limit(1);
  return rows.length > 0;
}

// ===== DASHBOARD STATS =====

export async function getBibliotecaDashboard() {
  const db = await getDb();
  if (!db) return null;

  const livros = await db.select({ count: sql<number>`count(*)` }).from(bibLivros).where(eq(bibLivros.status, 'ativo'));
  const totalLivros = livros[0]?.count || 0;

  const exemplares = await db.select({ count: sql<number>`count(*)` }).from(bibExemplares);
  const totalExemplares = exemplares[0]?.count || 0;

  const disponiveis = await db.select({ count: sql<number>`count(*)` }).from(bibExemplares).where(eq(bibExemplares.status, 'disponivel'));
  const totalDisponiveis = disponiveis[0]?.count || 0;

  const emprestados = await db.select({ count: sql<number>`count(*)` }).from(bibExemplares).where(eq(bibExemplares.status, 'emprestado'));
  const totalEmprestados = emprestados[0]?.count || 0;

  const reservados = await db.select({ count: sql<number>`count(*)` }).from(bibExemplares).where(eq(bibExemplares.status, 'reservado'));
  const totalReservados = reservados[0]?.count || 0;

  const atrasados = await db.select({ count: sql<number>`count(*)` }).from(bibEmprestimos).where(eq(bibEmprestimos.status, 'atrasado'));
  const totalAtrasados = atrasados[0]?.count || 0;

  const emprestimosAtivos = await db.select({ count: sql<number>`count(*)` }).from(bibEmprestimos).where(eq(bibEmprestimos.status, 'ativo'));
  const totalEmprestimosAtivos = emprestimosAtivos[0]?.count || 0;

  const reservasAtivas = await db.select({ count: sql<number>`count(*)` }).from(bibReservas).where(eq(bibReservas.status, 'ativa'));
  const totalReservasAtivas = reservasAtivas[0]?.count || 0;

  const ocorrenciasTotal = await db.select({ count: sql<number>`count(*)` }).from(bibOcorrencias);
  const totalOcorrencias = ocorrenciasTotal[0]?.count || 0;

  // Top 10 most borrowed books
  const topLivros = await db.select({
    livroId: bibEmprestimos.livroId,
    count: sql<number>`count(*)`,
  }).from(bibEmprestimos).groupBy(bibEmprestimos.livroId).orderBy(desc(sql`count(*)`)).limit(10);

  // Get book titles for top livros
  const topLivrosComTitulo = [];
  for (const item of topLivros) {
    const livro = await getLivro(item.livroId);
    topLivrosComTitulo.push({
      livroId: item.livroId,
      titulo: livro?.titulo || 'Desconhecido',
      emprestimos: item.count,
    });
  }

  // Empréstimos por categoria
  const porCategoria = await db.select({
    categoria: bibLivros.categoria,
    count: sql<number>`count(*)`,
  }).from(bibEmprestimos)
    .innerJoin(bibLivros, eq(bibEmprestimos.livroId, bibLivros.id))
    .groupBy(bibLivros.categoria);

  return {
    totalLivros,
    totalExemplares,
    totalDisponiveis,
    totalEmprestados,
    totalReservados,
    totalAtrasados,
    totalEmprestimosAtivos,
    totalReservasAtivas,
    totalOcorrencias,
    topLivros: topLivrosComTitulo,
    porCategoria,
  };
}

// ===== NOTIFICATION HELPERS =====

export async function getEmprestimosVencendoEm(diasAntes: number) {
  const db = await getDb();
  if (!db) return [];
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + diasAntes);
  const targetStr = targetDate.toISOString().slice(0, 10);
  
  return db.select().from(bibEmprestimos)
    .where(and(
      eq(bibEmprestimos.status, 'ativo' as any),
      eq(bibEmprestimos.dataPrevistaDevolucao, targetStr)
    ));
}

export async function getEmprestimosAtrasados() {
  const db = await getDb();
  if (!db) return [];
  const todayStr = new Date().toISOString().slice(0, 10);
  
  return db.select().from(bibEmprestimos)
    .where(and(
      eq(bibEmprestimos.status, 'ativo' as any),
      sql`${bibEmprestimos.dataPrevistaDevolucao} < ${todayStr}`
    ));
}

export async function marcarEmprestimosAtrasados() {
  const db = await getDb();
  if (!db) return 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const result = await db.update(bibEmprestimos)
    .set({ status: 'atrasado' as any })
    .where(and(
      eq(bibEmprestimos.status, 'ativo' as any),
      sql`${bibEmprestimos.dataPrevistaDevolucao} < ${todayStr}`
    ));
  return (result as any)[0]?.affectedRows || 0;
}

export async function getLivroTitulo(livroId: number): Promise<string> {
  const db = await getDb();
  if (!db) return 'Livro desconhecido';
  const rows = await db.select({ titulo: bibLivros.titulo }).from(bibLivros).where(eq(bibLivros.id, livroId)).limit(1);
  return rows[0]?.titulo || 'Livro desconhecido';
}
