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


// ===== V84 — CLIENTES 360° & REESTRUTURAÇÃO =====

// --- Clientes 360° ---
export async function getCliente360(clienteId: number) {
  const db = getDb();
  const [rows] = await (await db)!.execute(sql.raw(`
    SELECT c.*,
      p.nomeFantasia as parceiroNome, p.cnpj as parceiroCnpj
    FROM clientes c
    LEFT JOIN parceiros p ON c.parceiroId = p.id
    WHERE c.id = ${clienteId}
  `));
  const cliente = (rows as unknown as any[])[0];
  if (!cliente) return null;

  const db_ = (await db)!;
  const [cases] = await db_.execute(sql.raw(`SELECT id, numero, fase, status, responsavelNome, valorEstimado, valorContratado, createdAt, updatedAt FROM credit_cases WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [tasks] = await db_.execute(sql.raw(`SELECT id, codigo, fila, titulo, status, prioridade, responsavelNome, dataVencimento, dataConclusao, slaStatus, createdAt FROM credit_tasks WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [rtis] = await db_.execute(sql.raw(`SELECT id, numero, versao, valorTotalEstimado, status, emitidoPorNome, emitidoEm, devolutivaStatus, slaDevolutivaVenceEm, createdAt FROM rti_reports WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [tickets] = await db_.execute(sql.raw(`SELECT id, numero, tipo, titulo, status, prioridade, responsavelNome, dataVencimento, createdAt FROM credit_tickets WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [ledger] = await db_.execute(sql.raw(`SELECT cl.*, ccg.sigla as grupoSigla FROM credit_ledger cl LEFT JOIN credit_compensation_groups ccg ON cl.compensationGroupId = ccg.id WHERE cl.clienteId = ${clienteId} ORDER BY cl.createdAt DESC`));
  const [perdcomps] = await db_.execute(sql.raw(`SELECT * FROM credit_perdcomps WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [exitos] = await db_.execute(sql.raw(`SELECT * FROM success_events WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [strategies] = await db_.execute(sql.raw(`SELECT * FROM credit_case_strategy WHERE clienteId = ${clienteId} ORDER BY createdAt DESC LIMIT 1`));
  const [demands] = await db_.execute(sql.raw(`SELECT id, numero, tipoDemanda as tipo, urgencia, status, createdAt FROM demand_requests WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [auditLog] = await db_.execute(sql.raw(`
    SELECT * FROM credit_audit_log
    WHERE (entidade = 'case' AND entidadeId IN (SELECT id FROM credit_cases WHERE clienteId = ${clienteId}))
       OR (entidade = 'task' AND entidadeId IN (SELECT id FROM credit_tasks WHERE clienteId = ${clienteId}))
       OR (entidade = 'rti' AND entidadeId IN (SELECT id FROM rti_reports WHERE clienteId = ${clienteId}))
       OR (entidade = 'ticket' AND entidadeId IN (SELECT id FROM credit_tickets WHERE clienteId = ${clienteId}))
       OR (entidade = 'ledger' AND entidadeId IN (SELECT id FROM credit_ledger WHERE clienteId = ${clienteId}))
       OR (entidade = 'exito' AND entidadeId IN (SELECT id FROM success_events WHERE clienteId = ${clienteId}))
    ORDER BY createdAt DESC LIMIT 50
  `));

  const ledgerArr = ledger as unknown as any[];
  const tasksArr = tasks as unknown as any[];
  const totalEstimado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorEstimado || 0), 0);
  const totalValidado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorValidado || 0), 0);
  const totalEfetivado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorEfetivado || 0), 0);
  const saldoDisponivel = ledgerArr.reduce((s: number, l: any) => s + Number(l.saldoResidual || 0), 0);
  const tasksEmAtraso = tasksArr.filter((t: any) => t.slaStatus === 'vencido').length;
  const tasksAtivas = tasksArr.filter((t: any) => ['a_fazer', 'fazendo'].includes(t.status)).length;

  return {
    cliente,
    cases: cases as unknown as any[],
    tasks: tasksArr,
    rtis: rtis as unknown as any[],
    tickets: tickets as unknown as any[],
    ledger: ledgerArr,
    perdcomps: perdcomps as unknown as any[],
    exitos: exitos as unknown as any[],
    strategy: (strategies as unknown as any[])[0] || null,
    auditLog: auditLog as unknown as any[],
    demands: demands as unknown as any[],
    totals: { totalEstimado, totalValidado, totalEfetivado, saldoDisponivel, tasksEmAtraso, tasksAtivas },
  };
}

// List clients with credit activity summary
export async function listCreditClientes(filters?: { search?: string; parceiroId?: number }) {
  const db_ = (await getDb())!;
  let whereClauses: string[] = [];
  if (filters?.search) {
    const s = filters.search.replace(/'/g, "''");
    whereClauses.push(`(c.razaoSocial LIKE '%${s}%' OR c.cnpj LIKE '%${s}%' OR c.nomeFantasia LIKE '%${s}%')`);
  }
  if (filters?.parceiroId) {
    whereClauses.push(`c.parceiroId = ${Number(filters.parceiroId)}`);
  }
  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const query = `
    SELECT c.id, c.cnpj, c.razaoSocial, c.nomeFantasia, c.regimeTributario, c.situacaoCadastral,
      c.segmentoEconomico, c.parceiroId,
      MAX(p.nomeFantasia) as parceiroNome,
      COUNT(DISTINCT cc.id) as totalCases,
      COUNT(DISTINCT ct.id) as totalTasks,
      SUM(CASE WHEN ct.status IN ('a_fazer','fazendo') THEN 1 ELSE 0 END) as tasksAtivas,
      SUM(CASE WHEN ct.slaStatus = 'vencido' THEN 1 ELSE 0 END) as tasksEmAtraso
    FROM clientes c
    LEFT JOIN parceiros p ON c.parceiroId = p.id
    LEFT JOIN credit_cases cc ON cc.clienteId = c.id
    LEFT JOIN credit_tasks ct ON ct.clienteId = c.id
    ${whereStr}
    GROUP BY c.id, c.cnpj, c.razaoSocial, c.nomeFantasia, c.regimeTributario, c.situacaoCadastral,
      c.segmentoEconomico, c.parceiroId
    ORDER BY tasksEmAtraso DESC, tasksAtivas DESC, c.razaoSocial ASC
  `;
  const [rows] = await db_.execute(sql.raw(query));
  return rows as unknown as any[];
}

// --- Checklist Templates ---
export async function listChecklistTemplates(fila?: string) {
  const db_ = (await getDb())!;
  const conditions = [];
  if (fila) {
    const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_checklist_templates WHERE ativo = 1 AND fila = '${fila}' ORDER BY fila, nome`));
    return rows as unknown as any[];
  }
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_checklist_templates WHERE ativo = 1 ORDER BY fila, nome`));
  return rows as unknown as any[];
}

export async function createChecklistTemplate(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_checklist_templates (fila, teseId, teseNome, nome, itens, criadoPorId, criadoPorNome) VALUES ('${data.fila}', ${data.teseId || 'NULL'}, ${data.teseNome ? `'${data.teseNome}'` : 'NULL'}, '${data.nome}', '${JSON.stringify(data.itens)}', ${data.criadoPorId || 'NULL'}, ${data.criadoPorNome ? `'${data.criadoPorNome}'` : 'NULL'})`));
  return (result as any).insertId;
}

export async function updateChecklistTemplate(id: number, data: any) {
  const db_ = (await getDb())!;
  const sets: string[] = [];
  if (data.nome !== undefined) sets.push(`nome = '${data.nome}'`);
  if (data.itens !== undefined) sets.push(`itens = '${JSON.stringify(data.itens)}'`);
  if (data.ativo !== undefined) sets.push(`ativo = ${data.ativo}`);
  if (sets.length === 0) return;
  await db_.execute(sql.raw(`UPDATE credit_checklist_templates SET ${sets.join(', ')} WHERE id = ${id}`));
}

// --- Checklist Instances ---
export async function getChecklistInstance(taskId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_checklist_instances WHERE taskId = ${taskId}`));
  return (rows as unknown as any[])[0] || null;
}

export async function createChecklistInstance(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_checklist_instances (taskId, templateId, fila, nome, itens, progresso) VALUES (${data.taskId}, ${data.templateId || 'NULL'}, '${data.fila}', '${data.nome}', '${JSON.stringify(data.itens)}', 0)`));
  return (result as any).insertId;
}

export async function updateChecklistInstance(id: number, itens: any[], progresso: number) {
  const db_ = (await getDb())!;
  await db_.execute(sql.raw(`UPDATE credit_checklist_instances SET itens = '${JSON.stringify(itens)}', progresso = ${progresso} WHERE id = ${id}`));
}

// --- Document Folders ---
export async function listDocFolders(filters: { taskId?: number; clienteId?: number; caseId?: number }) {
  const db_ = (await getDb())!;
  let where = '1=1';
  if (filters.taskId) where += ` AND taskId = ${filters.taskId}`;
  if (filters.clienteId) where += ` AND clienteId = ${filters.clienteId}`;
  if (filters.caseId) where += ` AND caseId = ${filters.caseId}`;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_doc_folders WHERE ${where} ORDER BY createdAt DESC`));
  return rows as unknown as any[];
}

export async function createDocFolder(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_doc_folders (taskId, caseId, clienteId, fila, nome, descricao, criadoPorId, criadoPorNome) VALUES (${data.taskId || 'NULL'}, ${data.caseId || 'NULL'}, ${data.clienteId}, ${data.fila ? `'${data.fila}'` : 'NULL'}, '${data.nome}', ${data.descricao ? `'${data.descricao}'` : 'NULL'}, ${data.criadoPorId || 'NULL'}, ${data.criadoPorNome ? `'${data.criadoPorNome}'` : 'NULL'})`));
  return (result as any).insertId;
}

export async function listDocFiles(folderId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_doc_files WHERE folderId = ${folderId} ORDER BY createdAt DESC`));
  return rows as unknown as any[];
}

export async function createDocFile(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_doc_files (folderId, nome, fileUrl, fileKey, mimeType, tamanhoBytes, uploadPorId, uploadPorNome) VALUES (${data.folderId}, '${data.nome}', '${data.fileUrl}', ${data.fileKey ? `'${data.fileKey}'` : 'NULL'}, ${data.mimeType ? `'${data.mimeType}'` : 'NULL'}, ${data.tamanhoBytes || 'NULL'}, ${data.uploadPorId || 'NULL'}, ${data.uploadPorNome ? `'${data.uploadPorNome}'` : 'NULL'})`));
  return (result as any).insertId;
}

export async function deleteDocFile(id: number) {
  const db_ = (await getDb())!;
  await db_.execute(sql.raw(`DELETE FROM credit_doc_files WHERE id = ${id}`));
}

// --- PerdComps ---
export async function listPerdcomps(filters?: { clienteId?: number; caseId?: number; taskId?: number; search?: string }) {
  const db_ = (await getDb())!;
  let where = '1=1';
  if (filters?.clienteId) where += ` AND clienteId = ${filters.clienteId}`;
  if (filters?.caseId) where += ` AND caseId = ${filters.caseId}`;
  if (filters?.taskId) where += ` AND taskId = ${filters.taskId}`;
  if (filters?.search) where += ` AND (numeroPerdcomp LIKE '%${filters.search}%' OR tipoCredito LIKE '%${filters.search}%')`;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_perdcomps WHERE ${where} ORDER BY createdAt DESC`));
  return rows as unknown as any[];
}

export async function createPerdcomp(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_perdcomps (taskId, caseId, clienteId, ledgerEntryId, numeroPerdcomp, tipoCredito, periodoApuracao, valorCredito, valorDebitosCompensados, saldoRemanescente, dataTransmissao, dataVencimentoGuia, guiaNumero, status, feitoPelaEvox, observacoes, registradoPorId, registradoPorNome) VALUES (${data.taskId || 'NULL'}, ${data.caseId || 'NULL'}, ${data.clienteId}, ${data.ledgerEntryId || 'NULL'}, '${data.numeroPerdcomp}', ${data.tipoCredito ? `'${data.tipoCredito}'` : 'NULL'}, ${data.periodoApuracao ? `'${data.periodoApuracao}'` : 'NULL'}, ${data.valorCredito || 'NULL'}, ${data.valorDebitosCompensados || 'NULL'}, ${data.saldoRemanescente || 'NULL'}, ${data.dataTransmissao ? `'${data.dataTransmissao}'` : 'NULL'}, ${data.dataVencimentoGuia ? `'${data.dataVencimentoGuia}'` : 'NULL'}, ${data.guiaNumero ? `'${data.guiaNumero}'` : 'NULL'}, '${data.status || 'transmitido'}', ${data.feitoPelaEvox ?? 1}, ${data.observacoes ? `'${data.observacoes}'` : 'NULL'}, ${data.registradoPorId || 'NULL'}, ${data.registradoPorNome ? `'${data.registradoPorNome}'` : 'NULL'})`));
  return (result as any).insertId;
}

export async function updatePerdcomp(id: number, data: any) {
  const db_ = (await getDb())!;
  const sets: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (k === 'id' || k === 'createdAt') continue;
    sets.push(`${k} = ${v === null || v === undefined ? 'NULL' : typeof v === 'string' ? `'${v}'` : v}`);
  }
  if (sets.length === 0) return;
  await db_.execute(sql.raw(`UPDATE credit_perdcomps SET ${sets.join(', ')} WHERE id = ${id}`));
}

// --- Task Teses ---
export async function listTaskTeses(taskId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT ctt.*, t.tributoEnvolvido, t.tipo as teseTipo, t.classificacao, t.potencialFinanceiro FROM credit_task_teses ctt LEFT JOIN teses t ON ctt.teseId = t.id WHERE ctt.taskId = ${taskId} ORDER BY ctt.createdAt`));
  return rows as unknown as any[];
}

export async function createTaskTese(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_task_teses (taskId, teseId, teseNome, aderente, justificativaNaoAderente, valorEstimado, status) VALUES (${data.taskId}, ${data.teseId}, ${data.teseNome ? `'${data.teseNome}'` : 'NULL'}, ${data.aderente ?? 1}, ${data.justificativaNaoAderente ? `'${data.justificativaNaoAderente}'` : 'NULL'}, ${data.valorEstimado || 0}, '${data.status || 'selecionada'}')`));
  return (result as any).insertId;
}

export async function updateTaskTese(id: number, data: any) {
  const db_ = (await getDb())!;
  const sets: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (k === 'id' || k === 'createdAt') continue;
    sets.push(`${k} = ${v === null || v === undefined ? 'NULL' : typeof v === 'string' ? `'${v}'` : v}`);
  }
  if (sets.length === 0) return;
  await db_.execute(sql.raw(`UPDATE credit_task_teses SET ${sets.join(', ')} WHERE id = ${id}`));
}

// --- Case Strategy ---
export async function getCaseStrategy(caseId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_case_strategy WHERE caseId = ${caseId} ORDER BY createdAt DESC LIMIT 1`));
  return (rows as unknown as any[])[0] || null;
}

export async function upsertCaseStrategy(data: any) {
  const db_ = (await getDb())!;
  const [existing] = await db_.execute(sql.raw(`SELECT id FROM credit_case_strategy WHERE caseId = ${data.caseId} LIMIT 1`));
  if ((existing as unknown as any[]).length > 0) {
    await db_.execute(sql.raw(`UPDATE credit_case_strategy SET estrategia = '${data.estrategia}', compensacaoPct = ${data.compensacaoPct || 0}, ressarcimentoPct = ${data.ressarcimentoPct || 0}, restituicaoPct = ${data.restituicaoPct || 0}, observacoes = ${data.observacoes ? `'${data.observacoes}'` : 'NULL'}, definidoPorId = ${data.definidoPorId || 'NULL'}, definidoPorNome = ${data.definidoPorNome ? `'${data.definidoPorNome}'` : 'NULL'} WHERE caseId = ${data.caseId}`));
    return (existing as unknown as any[])[0].id;
  } else {
    const [result] = await db_.execute(sql.raw(`INSERT INTO credit_case_strategy (caseId, clienteId, estrategia, compensacaoPct, ressarcimentoPct, restituicaoPct, observacoes, definidoPorId, definidoPorNome) VALUES (${data.caseId}, ${data.clienteId}, '${data.estrategia}', ${data.compensacaoPct || 0}, ${data.ressarcimentoPct || 0}, ${data.restituicaoPct || 0}, ${data.observacoes ? `'${data.observacoes}'` : 'NULL'}, ${data.definidoPorId || 'NULL'}, ${data.definidoPorNome ? `'${data.definidoPorNome}'` : 'NULL'})`));
    return (result as any).insertId;
  }
}

// --- Tese Aderencia Engine ---
export async function evaluateTesesAderencia(clienteId: number) {
  const db_ = (await getDb())!;
  const [clienteRows] = await db_.execute(sql.raw(`SELECT * FROM clientes WHERE id = ${clienteId}`));
  const cliente = (clienteRows as unknown as any[])[0];
  if (!cliente) return { aderentes: [], naoAderentes: [] };

  const [tesesRows] = await db_.execute(sql.raw(`SELECT * FROM teses WHERE ativa = 1`));
  const teses = tesesRows as unknown as any[];

  const aderentes: any[] = [];
  const naoAderentes: any[] = [];

  for (const tese of teses) {
    let aplicavel = true;
    const motivos: string[] = [];
    if (cliente.regimeTributario === 'lucro_real' && !tese.aplicavelLucroReal) { aplicavel = false; motivos.push('Não aplicável a Lucro Real'); }
    if (cliente.regimeTributario === 'lucro_presumido' && !tese.aplicavelLucroPresumido) { aplicavel = false; motivos.push('Não aplicável a Lucro Presumido'); }
    if (cliente.regimeTributario === 'simples_nacional' && !tese.aplicavelSimplesNacional) { aplicavel = false; motivos.push('Não aplicável a Simples Nacional'); }
    const base = Number(cliente.valorMedioGuias || 0);
    const mult = tese.potencialFinanceiro === 'muito_alto' ? 0.15 : tese.potencialFinanceiro === 'alto' ? 0.10 : tese.potencialFinanceiro === 'medio' ? 0.05 : 0.02;
    const valorEstimado = Math.round(base * mult * 100) / 100;

    const item = { teseId: tese.id, teseNome: tese.nome, tributoEnvolvido: tese.tributoEnvolvido, tipo: tese.tipo, classificacao: tese.classificacao, potencialFinanceiro: tese.potencialFinanceiro, valorEstimado };
    if (aplicavel) {
      aderentes.push(item);
    } else {
      naoAderentes.push({ ...item, motivos });
    }
  }

  return { aderentes, naoAderentes };
}

// --- Gestão de Créditos (full history) ---
export async function getGestaoCreditos(clienteId: number) {
  const db_ = (await getDb())!;
  const [ledger] = await db_.execute(sql.raw(`SELECT cl.*, ccg.sigla as grupoSigla, ccg.nome as grupoNome FROM credit_ledger cl LEFT JOIN credit_compensation_groups ccg ON cl.compensationGroupId = ccg.id WHERE cl.clienteId = ${clienteId} ORDER BY cl.createdAt DESC`));
  const [perdcomps] = await db_.execute(sql.raw(`SELECT * FROM credit_perdcomps WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [exitos] = await db_.execute(sql.raw(`SELECT * FROM success_events WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [strategies] = await db_.execute(sql.raw(`SELECT ccs.*, cc.numero as caseNumero FROM credit_case_strategy ccs LEFT JOIN credit_cases cc ON ccs.caseId = cc.id WHERE ccs.clienteId = ${clienteId} ORDER BY ccs.createdAt DESC`));

  const ledgerArr = ledger as unknown as any[];
  const totalEstimado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorEstimado || 0), 0);
  const totalValidado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorValidado || 0), 0);
  const totalProtocolado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorProtocolado || 0), 0);
  const totalEfetivado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorEfetivado || 0), 0);
  const saldoResidual = ledgerArr.reduce((s: number, l: any) => s + Number(l.saldoResidual || 0), 0);

  const now = Date.now();
  const prescricaoRisk = ledgerArr.filter(l => {
    const created = new Date(l.createdAt).getTime();
    const yearsOld = (now - created) / (365.25 * 24 * 60 * 60 * 1000);
    return yearsOld > 4.5 && Number(l.saldoResidual || 0) > 0;
  });

  return {
    ledger: ledgerArr,
    perdcomps: perdcomps as unknown as any[],
    exitos: exitos as unknown as any[],
    strategies: strategies as unknown as any[],
    totals: { totalEstimado, totalValidado, totalProtocolado, totalEfetivado, saldoResidual },
    prescricaoRisk: prescricaoRisk.length,
  };
}
