import { eq, desc, and, sql, like, or, asc, inArray, isNull, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  demandRequests,
  portfolioMigrationRequests,
  creditCases,
  rtiReports,
  creditTasks,
  creditTickets,
  creditCompensationGroups,
  creditLedger,
  dueSchedulePolicies,
  clientDuePolicySubscriptions,
  successEvents,
  creditAuditLog,
  creditSlaConfigs,
  creditTicketMessages,
  clientes,
  parceiros,
} from "../drizzle/schema";

// ===== TYPE ALIASES =====
type InsertDemandRequest = typeof demandRequests.$inferInsert;
type InsertPortfolioMigration = typeof portfolioMigrationRequests.$inferInsert;
type InsertCreditCase = typeof creditCases.$inferInsert;
type InsertRtiReport = typeof rtiReports.$inferInsert;
type InsertCreditTask = typeof creditTasks.$inferInsert;
type InsertCreditTicket = typeof creditTickets.$inferInsert;
type InsertCreditLedger = typeof creditLedger.$inferInsert;
type InsertSuccessEvent = typeof successEvents.$inferInsert;
type InsertCreditAuditLog = typeof creditAuditLog.$inferInsert;
type InsertTicketMessage = typeof creditTicketMessages.$inferInsert;

// ===== SEQUENCES =====
async function getNextSequence(prefix: string, table: string, column: string): Promise<string> {
  const db_ = await getDb();
  if (!db_) return `${prefix}-0001`;
  const [row] = await db_.execute(sql.raw(`SELECT MAX(${column}) as maxNum FROM ${table}`));
  const maxNum = (row as any)?.maxNum;
  if (!maxNum) return `${prefix}-0001`;
  const num = parseInt(maxNum.replace(`${prefix}-`, '')) + 1;
  return `${prefix}-${String(num).padStart(4, '0')}`;
}

// ===== DEMAND REQUESTS =====
export async function listDemandRequests(filters?: { status?: string; parceiroId?: number; clienteId?: number }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(demandRequests.status, filters.status as any));
  if (filters?.parceiroId) conditions.push(eq(demandRequests.parceiroId, filters.parceiroId));
  if (filters?.clienteId) conditions.push(eq(demandRequests.clienteId, filters.clienteId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db_.select().from(demandRequests).where(where).orderBy(desc(demandRequests.createdAt));
}

export async function getDemandRequestById(id: number) {
  const db_ = await getDb();
  if (!db_) return null;
  const [row] = await db_.select().from(demandRequests).where(eq(demandRequests.id, id));
  return row || null;
}

export async function createDemandRequest(data: Omit<InsertDemandRequest, 'numero'>) {
  const db_ = await getDb();
  if (!db_) return null;
  const numero = await getNextSequence('DR', 'demand_requests', 'numero');
  const [result] = await db_.insert(demandRequests).values({ ...data, numero } as any);
  return { id: (result as any).insertId, numero };
}

export async function updateDemandRequest(id: number, data: Partial<InsertDemandRequest>) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(demandRequests).set(data as any).where(eq(demandRequests.id, id));
}

export async function getDemandRequestStats() {
  const db_ = await getDb();
  if (!db_) return { total: 0, triagem: 0, classificada: 0, roteada: 0, cancelada: 0 };
  const [rows] = await db_.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'triagem' THEN 1 ELSE 0 END) as triagem,
      SUM(CASE WHEN status = 'classificada' THEN 1 ELSE 0 END) as classificada,
      SUM(CASE WHEN status = 'roteada' THEN 1 ELSE 0 END) as roteada,
      SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as cancelada
    FROM demand_requests
  `);
  return rows as any;
}

// ===== PORTFOLIO MIGRATION =====
export async function listPortfolioMigrations(filters?: { status?: string }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(portfolioMigrationRequests.status, filters.status as any));
  return db_.select().from(portfolioMigrationRequests).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(portfolioMigrationRequests.createdAt));
}

export async function createPortfolioMigration(data: InsertPortfolioMigration) {
  const db_ = await getDb();
  if (!db_) return null;
  const [result] = await db_.insert(portfolioMigrationRequests).values(data as any);
  return { id: (result as any).insertId };
}

export async function updatePortfolioMigration(id: number, data: Partial<InsertPortfolioMigration>) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(portfolioMigrationRequests).set(data as any).where(eq(portfolioMigrationRequests.id, id));
}

// ===== CREDIT CASES =====
export async function listCreditCases(filters?: { fase?: string; status?: string; clienteId?: number; parceiroId?: number; responsavelId?: number }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.fase) conditions.push(eq(creditCases.fase, filters.fase as any));
  if (filters?.status) conditions.push(eq(creditCases.status, filters.status));
  if (filters?.clienteId) conditions.push(eq(creditCases.clienteId, filters.clienteId));
  if (filters?.parceiroId) conditions.push(eq(creditCases.parceiroId, filters.parceiroId));
  if (filters?.responsavelId) conditions.push(eq(creditCases.responsavelId, filters.responsavelId));
  return db_.select().from(creditCases).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(creditCases.createdAt));
}

export async function getCreditCaseById(id: number) {
  const db_ = await getDb();
  if (!db_) return null;
  const [row] = await db_.select().from(creditCases).where(eq(creditCases.id, id));
  return row || null;
}

export async function createCreditCase(data: Omit<InsertCreditCase, 'numero'>) {
  const db_ = await getDb();
  if (!db_) return null;
  const numero = await getNextSequence('CC', 'credit_cases', 'numero');
  const [result] = await db_.insert(creditCases).values({ ...data, numero } as any);
  return { id: (result as any).insertId, numero };
}

export async function updateCreditCase(id: number, data: Partial<InsertCreditCase>) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(creditCases).set(data as any).where(eq(creditCases.id, id));
}

export async function getCreditCaseStats() {
  const db_ = await getDb();
  if (!db_) return {};
  const [rows] = await db_.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN fase = 'oportunidade' THEN 1 ELSE 0 END) as oportunidades,
      SUM(CASE WHEN fase = 'contratado' THEN 1 ELSE 0 END) as contratados,
      SUM(COALESCE(valorEstimado, 0)) as totalEstimado,
      SUM(COALESCE(valorContratado, 0)) as totalContratado
    FROM credit_cases
  `);
  return rows as any;
}

// ===== RTI REPORTS =====
export async function listRtiReports(filters?: { caseId?: number; clienteId?: number; status?: string }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.caseId) conditions.push(eq(rtiReports.caseId, filters.caseId));
  if (filters?.clienteId) conditions.push(eq(rtiReports.clienteId, filters.clienteId));
  if (filters?.status) conditions.push(eq(rtiReports.status, filters.status as any));
  return db_.select().from(rtiReports).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(rtiReports.createdAt));
}

export async function getRtiReportById(id: number) {
  const db_ = await getDb();
  if (!db_) return null;
  const [row] = await db_.select().from(rtiReports).where(eq(rtiReports.id, id));
  return row || null;
}

export async function createRtiReport(data: Omit<InsertRtiReport, 'numero'>) {
  const db_ = await getDb();
  if (!db_) return null;
  const numero = await getNextSequence('RTI', 'rti_reports', 'numero');
  const [result] = await db_.insert(rtiReports).values({ ...data, numero } as any);
  return { id: (result as any).insertId, numero };
}

export async function updateRtiReport(id: number, data: Partial<InsertRtiReport>) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(rtiReports).set(data as any).where(eq(rtiReports.id, id));
}

// ===== CREDIT TASKS =====
export async function listCreditTasks(filters?: { fila?: string; status?: string; caseId?: number; clienteId?: number; responsavelId?: number }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.fila) conditions.push(eq(creditTasks.fila, filters.fila as any));
  if (filters?.status) conditions.push(eq(creditTasks.status, filters.status as any));
  if (filters?.caseId) conditions.push(eq(creditTasks.caseId, filters.caseId));
  if (filters?.clienteId) conditions.push(eq(creditTasks.clienteId, filters.clienteId));
  if (filters?.responsavelId) conditions.push(eq(creditTasks.responsavelId, filters.responsavelId));
  return db_.select().from(creditTasks).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(creditTasks.ordem), desc(creditTasks.createdAt));
}

export async function getCreditTaskById(id: number) {
  const db_ = await getDb();
  if (!db_) return null;
  const [row] = await db_.select().from(creditTasks).where(eq(creditTasks.id, id));
  return row || null;
}

export async function createCreditTask(data: Omit<InsertCreditTask, 'codigo'>) {
  const db_ = await getDb();
  if (!db_) return null;
  const codigo = await getNextSequence('CT', 'credit_tasks', 'codigo');
  const [result] = await db_.insert(creditTasks).values({ ...data, codigo } as any);
  return { id: (result as any).insertId, codigo };
}

export async function updateCreditTask(id: number, data: Partial<InsertCreditTask>) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(creditTasks).set(data as any).where(eq(creditTasks.id, id));
}

export async function getCreditTaskStats() {
  const db_ = await getDb();
  if (!db_) return {};
  const [rows] = await db_.execute(sql`
    SELECT 
      fila,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'a_fazer' THEN 1 ELSE 0 END) as a_fazer,
      SUM(CASE WHEN status = 'fazendo' THEN 1 ELSE 0 END) as fazendo,
      SUM(CASE WHEN status = 'feito' THEN 1 ELSE 0 END) as feito
    FROM credit_tasks
    GROUP BY fila
  `);
  return rows;
}

// ===== CREDIT TICKETS =====
export async function listCreditTickets(filters?: { status?: string; caseId?: number; clienteId?: number; parceiroId?: number; tipo?: string }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(creditTickets.status, filters.status as any));
  if (filters?.caseId) conditions.push(eq(creditTickets.caseId, filters.caseId));
  if (filters?.clienteId) conditions.push(eq(creditTickets.clienteId, filters.clienteId));
  if (filters?.parceiroId) conditions.push(eq(creditTickets.parceiroId, filters.parceiroId));
  if (filters?.tipo) conditions.push(eq(creditTickets.tipo, filters.tipo as any));
  return db_.select().from(creditTickets).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(creditTickets.createdAt));
}

export async function getCreditTicketById(id: number) {
  const db_ = await getDb();
  if (!db_) return null;
  const [row] = await db_.select().from(creditTickets).where(eq(creditTickets.id, id));
  return row || null;
}

export async function createCreditTicket(data: Omit<InsertCreditTicket, 'numero'>) {
  const db_ = await getDb();
  if (!db_) return null;
  const numero = await getNextSequence('TK', 'credit_tickets', 'numero');
  const [result] = await db_.insert(creditTickets).values({ ...data, numero } as any);
  return { id: (result as any).insertId, numero };
}

export async function updateCreditTicket(id: number, data: Partial<InsertCreditTicket>) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(creditTickets).set(data as any).where(eq(creditTickets.id, id));
}

// ===== TICKET MESSAGES =====
export async function listTicketMessages(ticketId: number) {
  const db_ = await getDb();
  if (!db_) return [];
  return db_.select().from(creditTicketMessages).where(eq(creditTicketMessages.ticketId, ticketId)).orderBy(asc(creditTicketMessages.createdAt));
}

export async function createTicketMessage(data: InsertTicketMessage) {
  const db_ = await getDb();
  if (!db_) return null;
  const [result] = await db_.insert(creditTicketMessages).values(data as any);
  return { id: (result as any).insertId };
}

// ===== CREDIT LEDGER =====
export async function listCreditLedger(filters?: { caseId?: number; clienteId?: number; status?: string; compensationGroupId?: number }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.caseId) conditions.push(eq(creditLedger.caseId, filters.caseId));
  if (filters?.clienteId) conditions.push(eq(creditLedger.clienteId, filters.clienteId));
  if (filters?.status) conditions.push(eq(creditLedger.status, filters.status as any));
  if (filters?.compensationGroupId) conditions.push(eq(creditLedger.compensationGroupId, filters.compensationGroupId));
  return db_.select().from(creditLedger).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(creditLedger.createdAt));
}

export async function createCreditLedgerEntry(data: InsertCreditLedger) {
  const db_ = await getDb();
  if (!db_) return null;
  const [result] = await db_.insert(creditLedger).values(data as any);
  return { id: (result as any).insertId };
}

export async function updateCreditLedgerEntry(id: number, data: Partial<InsertCreditLedger>) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(creditLedger).set(data as any).where(eq(creditLedger.id, id));
}

export async function getCreditLedgerSummary(clienteId?: number) {
  const db_ = await getDb();
  if (!db_) return {};
  const whereClause = clienteId ? sql`WHERE clienteId = ${clienteId}` : sql``;
  const [rows] = await db_.execute(sql`
    SELECT 
      compensationGroupNome,
      SUM(COALESCE(valorEstimado, 0)) as totalEstimado,
      SUM(COALESCE(valorValidado, 0)) as totalValidado,
      SUM(COALESCE(valorProtocolado, 0)) as totalProtocolado,
      SUM(COALESCE(valorEfetivado, 0)) as totalEfetivado,
      SUM(COALESCE(saldoResidual, 0)) as totalResidual,
      COUNT(*) as totalEntradas
    FROM credit_ledger
    ${whereClause}
    GROUP BY compensationGroupNome
  `);
  return rows;
}

// ===== COMPENSATION GROUPS =====
export async function listCompensationGroups() {
  const db_ = await getDb();
  if (!db_) return [];
  return db_.select().from(creditCompensationGroups).orderBy(asc(creditCompensationGroups.nome));
}

// ===== DUE SCHEDULE POLICIES =====
export async function listDueSchedulePolicies() {
  const db_ = await getDb();
  if (!db_) return [];
  return db_.select().from(dueSchedulePolicies).orderBy(asc(dueSchedulePolicies.nome));
}

export async function createDueSchedulePolicy(data: any) {
  const db_ = await getDb();
  if (!db_) return null;
  const [result] = await db_.insert(dueSchedulePolicies).values(data);
  return { id: (result as any).insertId };
}

export async function updateDueSchedulePolicy(id: number, data: any) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(dueSchedulePolicies).set(data).where(eq(dueSchedulePolicies.id, id));
}

// ===== CLIENT DUE POLICY SUBSCRIPTIONS =====
export async function listClientDuePolicySubs(clienteId?: number) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (clienteId) conditions.push(eq(clientDuePolicySubscriptions.clienteId, clienteId));
  return db_.select().from(clientDuePolicySubscriptions).where(conditions.length ? and(...conditions) : undefined);
}

export async function createClientDuePolicySub(data: any) {
  const db_ = await getDb();
  if (!db_) return null;
  const [result] = await db_.insert(clientDuePolicySubscriptions).values(data);
  return { id: (result as any).insertId };
}

export async function deleteClientDuePolicySub(id: number) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.delete(clientDuePolicySubscriptions).where(eq(clientDuePolicySubscriptions.id, id));
}

// ===== SUCCESS EVENTS =====
export async function listSuccessEvents(filters?: { caseId?: number; clienteId?: number }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.caseId) conditions.push(eq(successEvents.caseId, filters.caseId));
  if (filters?.clienteId) conditions.push(eq(successEvents.clienteId, filters.clienteId));
  return db_.select().from(successEvents).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(successEvents.createdAt));
}

export async function createSuccessEvent(data: InsertSuccessEvent) {
  const db_ = await getDb();
  if (!db_) return null;
  const [result] = await db_.insert(successEvents).values(data as any);
  return { id: (result as any).insertId };
}

export async function updateSuccessEvent(id: number, data: any) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(successEvents).set(data).where(eq(successEvents.id, id));
}

// ===== CREDIT AUDIT LOG =====
export async function logCreditAudit(data: InsertCreditAuditLog) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.insert(creditAuditLog).values(data as any);
}

export async function listCreditAuditLog(filters?: { entidade?: string; entidadeId?: number; limit?: number }) {
  const db_ = await getDb();
  if (!db_) return [];
  const conditions = [];
  if (filters?.entidade) conditions.push(eq(creditAuditLog.entidade, filters.entidade as any));
  if (filters?.entidadeId) conditions.push(eq(creditAuditLog.entidadeId, filters.entidadeId));
  return db_.select().from(creditAuditLog)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(creditAuditLog.createdAt))
    .limit(filters?.limit || 100);
}

// ===== SLA CONFIGS =====
export async function listCreditSlaConfigs() {
  const db_ = await getDb();
  if (!db_) return [];
  return db_.select().from(creditSlaConfigs).orderBy(asc(creditSlaConfigs.nome));
}

export async function updateCreditSlaConfig(id: number, data: any) {
  const db_ = await getDb();
  if (!db_) return;
  await db_.update(creditSlaConfigs).set(data).where(eq(creditSlaConfigs.id, id));
}

export async function createCreditSlaConfig(data: any) {
  const db_ = await getDb();
  if (!db_) return null;
  const [result] = await db_.insert(creditSlaConfigs).values(data);
  return { id: (result as any).insertId };
}

// ===== DASHBOARD STATS =====
export async function getCreditDashboardStats() {
  const db_ = await getDb();
  if (!db_) return {};
  const [caseStats] = await db_.execute(sql`
    SELECT 
      COUNT(*) as totalCases,
      SUM(CASE WHEN fase = 'oportunidade' THEN 1 ELSE 0 END) as oportunidades,
      SUM(CASE WHEN fase = 'contratado' THEN 1 ELSE 0 END) as contratados,
      SUM(COALESCE(valorEstimado, 0)) as totalEstimado,
      SUM(COALESCE(valorContratado, 0)) as totalContratado
    FROM credit_cases
  `);
  const [taskStats] = await db_.execute(sql`
    SELECT 
      COUNT(*) as totalTasks,
      SUM(CASE WHEN status = 'a_fazer' THEN 1 ELSE 0 END) as pendentes,
      SUM(CASE WHEN status = 'fazendo' THEN 1 ELSE 0 END) as emAndamento,
      SUM(CASE WHEN slaStatus = 'vencido' THEN 1 ELSE 0 END) as slaVencido
    FROM credit_tasks
  `);
  const [ticketStats] = await db_.execute(sql`
    SELECT 
      COUNT(*) as totalTickets,
      SUM(CASE WHEN status IN ('aberto','em_andamento','aguardando_cliente') THEN 1 ELSE 0 END) as abertos
    FROM credit_tickets
  `);
  const [drStats] = await db_.execute(sql`
    SELECT 
      COUNT(*) as totalDRs,
      SUM(CASE WHEN status = 'triagem' THEN 1 ELSE 0 END) as emTriagem
    FROM demand_requests
  `);
  const [ledgerStats] = await db_.execute(sql`
    SELECT 
      SUM(COALESCE(valorEstimado, 0)) as totalEstimado,
      SUM(COALESCE(valorEfetivado, 0)) as totalEfetivado,
      SUM(COALESCE(saldoResidual, 0)) as totalResidual
    FROM credit_ledger
  `);
  const [exitoStats] = await db_.execute(sql`
    SELECT 
      COUNT(*) as totalExitos,
      SUM(COALESCE(valor, 0)) as totalValorExito
    FROM success_events
  `);
  return {
    cases: caseStats,
    tasks: taskStats,
    tickets: ticketStats,
    demandRequests: drStats,
    ledger: ledgerStats,
    exitos: exitoStats,
  };
}
