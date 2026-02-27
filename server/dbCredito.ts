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
  // Use CAST to extract numeric part for proper MAX comparison
  const [row] = await db_.execute(sql.raw(
    `SELECT MAX(CAST(SUBSTRING(${column}, ${prefix.length + 2}) AS UNSIGNED)) as maxNum FROM ${table} WHERE ${column} LIKE '${prefix}-%'`
  ));
  const maxNum = Number((row as any)?.maxNum) || 0;
  const next = maxNum + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
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
  const conditions: any[] = [];
  if (filters?.fila) conditions.push(`ct.fila = '${filters.fila}'`);
  if (filters?.status) conditions.push(`ct.status = '${filters.status}'`);
  if (filters?.caseId) conditions.push(`ct.caseId = ${filters.caseId}`);
  if (filters?.clienteId) conditions.push(`ct.clienteId = ${filters.clienteId}`);
  if (filters?.responsavelId) conditions.push(`ct.responsavelId = ${filters.responsavelId}`);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db_.execute(sql.raw(`
    SELECT ct.*,
      c.razaoSocial as clienteNome,
      c.cnpj as clienteCnpj,
      c.codigo as clienteCodigo,
      c.classificacaoCliente as clienteClassificacao,
      c.procuracaoHabilitada as clienteProcuracaoHabilitada,
      c.procuracaoValidade as clienteProcuracaoValidade,
      c.procuracaoCertificado as clienteProcuracaoCertificado,
      COALESCE(p_case.nomeCompleto, p_cli.nomeCompleto) as parceiroNome,
      CASE
        WHEN COALESCE(cc.parceiroId, c.parceiroId) IS NULL THEN 1
        ELSE 0
      END as semParceiro,
      (SELECT COUNT(*) FROM rti_reports r WHERE r.taskId = ct.id) as rtiCount,
      (SELECT MAX(t.slaApuracaoDias) FROM credit_task_teses ctt2 LEFT JOIN teses t ON ctt2.teseId = t.id WHERE ctt2.taskId = ct.id) as maxSlaDias,
      u.apelido as responsavelApelido
    FROM credit_tasks ct
    LEFT JOIN clientes c ON ct.clienteId = c.id
    LEFT JOIN credit_cases cc ON ct.caseId = cc.id
    LEFT JOIN parceiros p_case ON cc.parceiroId = p_case.id
    LEFT JOIN parceiros p_cli ON c.parceiroId = p_cli.id
    LEFT JOIN users u ON ct.responsavelId = u.id
    ${whereClause}
    ORDER BY ct.ordem ASC, ct.createdAt DESC
  `));
  // Compute SLA dates based on max tese SLA
  const enriched = (rows as unknown as any[]).map((task: any) => {
    const maxSla = task.maxSlaDias ? Number(task.maxSlaDias) : null;
    const dataInicio = task.createdAt;
    let dataFimPrevista = task.dataVencimento;
    if (!dataFimPrevista && maxSla && dataInicio) {
      const dt = new Date(dataInicio);
      dt.setDate(dt.getDate() + maxSla);
      dataFimPrevista = dt.toISOString().slice(0, 19).replace('T', ' ');
    }
    // Compute SLA status dynamically
    let slaStatusCalc = task.slaStatus || 'dentro_prazo';
    if (dataFimPrevista && task.status !== 'concluido' && task.status !== 'feito') {
      const now = new Date();
      const venc = new Date(dataFimPrevista);
      const diffMs = venc.getTime() - now.getTime();
      const diffDias = diffMs / (1000 * 60 * 60 * 24);
      if (diffDias < 0) slaStatusCalc = 'vencido';
      else if (diffDias <= 3) slaStatusCalc = 'atencao';
      else slaStatusCalc = 'dentro_prazo';
    }
    // Compute procuracao status
    let procuracaoStatus = 'sem';
    if (task.clienteProcuracaoHabilitada) {
      if (task.clienteProcuracaoValidade) {
        const validade = new Date(task.clienteProcuracaoValidade);
        const now = new Date();
        const diffDias = (validade.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDias < 0) procuracaoStatus = 'vencida';
        else if (diffDias <= 30) procuracaoStatus = 'prox_vencimento';
        else procuracaoStatus = 'habilitada';
      } else {
        procuracaoStatus = 'habilitada';
      }
    }
    return { ...task, dataInicio, dataFimPrevista, slaStatus: slaStatusCalc, slaDias: maxSla, procuracaoStatus };
  });
  return enriched;
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

export async function getCreditTaskStats(filters?: { responsavelId?: number; parceiroId?: number; dataInicio?: string; dataFim?: string }) {
  const db_ = await getDb();
  if (!db_) return {
    total: 0, a_fazer: 0, fazendo: 0, feito: 0, concluido: 0, em_atraso: 0,
    apuracao_total: 0, apuracao_a_fazer: 0, apuracao_fazendo: 0, apuracao_feito: 0, apuracao_concluido: 0, apuracao_em_atraso: 0,
    onboarding_total: 0, onboarding_a_fazer: 0, onboarding_fazendo: 0, onboarding_feito: 0, onboarding_concluido: 0, onboarding_em_atraso: 0,
    retificacao_total: 0, retificacao_a_fazer: 0, retificacao_fazendo: 0, retificacao_feito: 0, retificacao_concluido: 0, retificacao_em_atraso: 0,
    compensacao_total: 0, compensacao_a_fazer: 0, compensacao_fazendo: 0, compensacao_feito: 0, compensacao_concluido: 0, compensacao_em_atraso: 0,
    ressarcimento_total: 0, ressarcimento_a_fazer: 0, ressarcimento_fazendo: 0, ressarcimento_feito: 0, ressarcimento_concluido: 0, ressarcimento_em_atraso: 0,
    restituicao_total: 0, restituicao_a_fazer: 0, restituicao_fazendo: 0, restituicao_feito: 0, restituicao_concluido: 0, restituicao_em_atraso: 0,
  };

  // Build WHERE conditions dynamically
  const conditions: string[] = [];
  if (filters?.responsavelId) conditions.push(`ct.responsavelId = ${Number(filters.responsavelId)}`);
  if (filters?.parceiroId) conditions.push(`cc.parceiroId = ${Number(filters.parceiroId)}`);
  if (filters?.dataInicio) conditions.push(`ct.createdAt >= '${filters.dataInicio}'`);
  if (filters?.dataFim) conditions.push(`ct.createdAt <= '${filters.dataFim} 23:59:59'`);

  const needsJoin = !!filters?.parceiroId;
  const fromClause = needsJoin
    ? `credit_tasks ct LEFT JOIN credit_cases cc ON ct.caseId = cc.id`
    : `credit_tasks ct`;
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await db_.execute(sql.raw(`
    SELECT 
      ct.fila,
      COUNT(*) as total,
      SUM(CASE WHEN ct.status = 'a_fazer' THEN 1 ELSE 0 END) as a_fazer,
      SUM(CASE WHEN ct.status = 'fazendo' THEN 1 ELSE 0 END) as fazendo,
      SUM(CASE WHEN ct.status = 'feito' THEN 1 ELSE 0 END) as feito,
      SUM(CASE WHEN ct.status = 'concluido' THEN 1 ELSE 0 END) as concluido,
      SUM(CASE WHEN ct.slaStatus = 'vencido' THEN 1 ELSE 0 END) as em_atraso
    FROM ${fromClause}
    ${whereClause}
    GROUP BY ct.fila
  `));
  
  const filas = ['apuracao', 'onboarding', 'retificacao', 'compensacao', 'ressarcimento', 'restituicao'];
  const result: Record<string, number> = {
    total: 0, a_fazer: 0, fazendo: 0, feito: 0, concluido: 0, em_atraso: 0,
  };
  for (const f of filas) {
    result[`${f}_total`] = 0;
    result[`${f}_a_fazer`] = 0;
    result[`${f}_fazendo`] = 0;
    result[`${f}_feito`] = 0;
    result[`${f}_concluido`] = 0;
    result[`${f}_em_atraso`] = 0;
  }
  for (const row of (rows as unknown as any[])) {
    const fila = row.fila as string;
    const total = Number(row.total) || 0;
    const aFazer = Number(row.a_fazer) || 0;
    const fazendo = Number(row.fazendo) || 0;
    const feito = Number(row.feito) || 0;
    const concluido = Number(row.concluido) || 0;
    const emAtraso = Number(row.em_atraso) || 0;
    if (filas.includes(fila)) {
      result[`${fila}_total`] = total;
      result[`${fila}_a_fazer`] = aFazer;
      result[`${fila}_fazendo`] = fazendo;
      result[`${fila}_feito`] = feito;
      result[`${fila}_concluido`] = concluido;
      result[`${fila}_em_atraso`] = emAtraso;
    }
    result.total += total;
    result.a_fazer += aFazer;
    result.fazendo += fazendo;
    result.feito += feito;
    result.concluido += concluido;
    result.em_atraso += emAtraso;
  }
  return result;
}

// ===== FLOW OVERVIEW (Visão Geral do Fluxo por Empresa) =====
export async function getClienteFlowOverview() {
  const db_ = await getDb();
  if (!db_) return [];
  const [rows] = await db_.execute(sql.raw(`
    SELECT 
      ct.clienteId,
      c.razaoSocial AS clienteNome,
      c.cnpj AS clienteCnpj,
      c.codigo AS clienteCodigo,
      c.classificacaoCliente,
      cc2.numero AS caseNumero,
      p.nomeCompleto AS parceiroNome,
      p.apelido AS parceiroNomeCurto,
      ct.fila,
      ct.status,
      ct.slaStatus,
      ct.codigo AS taskCodigo,
      ct.responsavelNome,
      ct.dataVencimento,
      ct.createdAt,
      u.apelido AS responsavelApelido
    FROM credit_tasks ct
    LEFT JOIN clientes c ON ct.clienteId = c.id
    LEFT JOIN credit_cases cc2 ON ct.caseId = cc2.id
    LEFT JOIN parceiros p ON cc2.parceiroId = p.id
    LEFT JOIN users u ON ct.responsavelId = u.id
    WHERE ct.status != 'concluido'
    ORDER BY c.razaoSocial, ct.fila, ct.createdAt
  `));
  
  // Group by clienteId
  const clienteMap = new Map<number, any>();
  for (const row of (rows as unknown as any[])) {
    const cId = Number(row.clienteId);
    if (!cId) continue;
    if (!clienteMap.has(cId)) {
      clienteMap.set(cId, {
        clienteId: cId,
        clienteNome: row.clienteNome || 'Sem nome',
        clienteCnpj: row.clienteCnpj || '',
        clienteCodigo: row.clienteCodigo || '',
        classificacao: row.classificacaoCliente || 'base',
        parceiroNome: row.parceiroNome || row.parceiroNomeCurto || null,
        filas: {} as Record<string, any[]>,
      });
    }
    const cliente = clienteMap.get(cId)!;
    const fila = row.fila as string;
    if (!cliente.filas[fila]) cliente.filas[fila] = [];
    cliente.filas[fila].push({
      taskCodigo: row.taskCodigo,
      status: row.status,
      slaStatus: row.slaStatus,
      responsavel: row.responsavelApelido || row.responsavelNome || null,
      dataVencimento: row.dataVencimento,
      createdAt: row.createdAt,
    });
  }
  return Array.from(clienteMap.values());
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
export async function listChecklistTemplates(fila?: string, teseId?: number) {
  const db_ = (await getDb())!;
  if (fila && teseId) {
    // Get templates specific to this tese, plus generic ones for the fila
    const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_checklist_templates WHERE ativo = 1 AND fila = '${fila}' AND (teseId = ${teseId} OR teseId IS NULL) ORDER BY teseId DESC, nome`));
    return rows as unknown as any[];
  }
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
  const [rows] = await db_.execute(sql.raw(`SELECT ctt.*, t.tributoEnvolvido, t.tipo as teseTipo, t.classificacao, t.potencialFinanceiro, t.slaApuracaoDias FROM credit_task_teses ctt LEFT JOIN teses t ON ctt.teseId = t.id WHERE ctt.taskId = ${taskId} ORDER BY ctt.createdAt`));
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


// ===== RTI TEMPLATES =====
export async function listRtiTemplates() {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM rti_templates WHERE ativo = 1 ORDER BY nome`));
  return rows as unknown as any[];
}

export async function getRtiTemplateById(id: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM rti_templates WHERE id = ${id}`));
  return (rows as unknown as any[])[0] || null;
}

export async function createRtiTemplate(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO rti_templates (nome, textoIntro, textoObservacoes, textoProximasEtapas, cenarioCompensacaoDefault, alertasDefault, criadoPorId, criadoPorNome) VALUES ('${(data.nome || '').replace(/'/g, "''")}', ${data.textoIntro ? `'${data.textoIntro.replace(/'/g, "''")}'` : 'NULL'}, ${data.textoObservacoes ? `'${data.textoObservacoes.replace(/'/g, "''")}'` : 'NULL'}, ${data.textoProximasEtapas ? `'${data.textoProximasEtapas.replace(/'/g, "''")}'` : 'NULL'}, ${data.cenarioCompensacaoDefault ? `'${JSON.stringify(data.cenarioCompensacaoDefault)}'` : 'NULL'}, ${data.alertasDefault ? `'${JSON.stringify(data.alertasDefault)}'` : 'NULL'}, ${data.criadoPorId || 'NULL'}, ${data.criadoPorNome ? `'${data.criadoPorNome.replace(/'/g, "''")}'` : 'NULL'})`));
  return (result as unknown as any).insertId;
}

export async function updateRtiTemplate(id: number, data: any) {
  const db_ = (await getDb())!;
  const sets: string[] = [];
  if (data.nome !== undefined) sets.push(`nome = '${data.nome.replace(/'/g, "''")}'`);
  if (data.textoIntro !== undefined) sets.push(`textoIntro = '${data.textoIntro.replace(/'/g, "''")}'`);
  if (data.textoObservacoes !== undefined) sets.push(`textoObservacoes = '${data.textoObservacoes.replace(/'/g, "''")}'`);
  if (data.textoProximasEtapas !== undefined) sets.push(`textoProximasEtapas = '${data.textoProximasEtapas.replace(/'/g, "''")}'`);
  if (data.cenarioCompensacaoDefault !== undefined) sets.push(`cenarioCompensacaoDefault = '${JSON.stringify(data.cenarioCompensacaoDefault)}'`);
  if (data.alertasDefault !== undefined) sets.push(`alertasDefault = '${JSON.stringify(data.alertasDefault)}'`);
  if (data.ativo !== undefined) sets.push(`ativo = ${data.ativo}`);
  if (sets.length === 0) return;
  await db_.execute(sql.raw(`UPDATE rti_templates SET ${sets.join(', ')} WHERE id = ${id}`));
}

// ===== RTI OPORTUNIDADES =====
export async function listRtiOportunidades(rtiId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM rti_oportunidades WHERE rtiId = ${rtiId} ORDER BY ordem`));
  return rows as unknown as any[];
}

export async function createRtiOportunidade(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO rti_oportunidades (rtiId, teseId, descricao, classificacao, valorApurado, detalhamento, ordem) VALUES (${data.rtiId}, ${data.teseId || 'NULL'}, '${(data.descricao || '').replace(/'/g, "''")}', '${data.classificacao}', ${data.valorApurado || 0}, ${data.detalhamento ? `'${JSON.stringify(data.detalhamento)}'` : 'NULL'}, ${data.ordem || 0})`));
  return (result as unknown as any).insertId;
}

export async function updateRtiOportunidade(id: number, data: any) {
  const db_ = (await getDb())!;
  const sets: string[] = [];
  if (data.descricao !== undefined) sets.push(`descricao = '${data.descricao.replace(/'/g, "''")}'`);
  if (data.classificacao !== undefined) sets.push(`classificacao = '${data.classificacao}'`);
  if (data.valorApurado !== undefined) sets.push(`valorApurado = ${data.valorApurado}`);
  if (data.detalhamento !== undefined) sets.push(`detalhamento = '${JSON.stringify(data.detalhamento)}'`);
  if (data.ordem !== undefined) sets.push(`ordem = ${data.ordem}`);
  if (sets.length === 0) return;
  await db_.execute(sql.raw(`UPDATE rti_oportunidades SET ${sets.join(', ')} WHERE id = ${id}`));
}

export async function deleteRtiOportunidade(id: number) {
  const db_ = (await getDb())!;
  await db_.execute(sql.raw(`DELETE FROM rti_oportunidades WHERE id = ${id}`));
}

// ===== RTI CENÁRIO COMPENSAÇÃO =====
export async function listRtiCenarioCompensacao(rtiId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM rti_cenario_compensacao WHERE rtiId = ${rtiId} ORDER BY ordem`));
  return rows as unknown as any[];
}

export async function upsertRtiCenarioCompensacao(rtiId: number, items: any[]) {
  const db_ = (await getDb())!;
  await db_.execute(sql.raw(`DELETE FROM rti_cenario_compensacao WHERE rtiId = ${rtiId}`));
  for (const item of items) {
    await db_.execute(sql.raw(`INSERT INTO rti_cenario_compensacao (rtiId, tributo, mediaMensal, ordem) VALUES (${rtiId}, '${item.tributo}', ${item.mediaMensal || 0}, ${item.ordem || 0})`));
  }
}

// ===== RTI ALERTAS =====
export async function listRtiAlertas(rtiId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM rti_alertas WHERE rtiId = ${rtiId} ORDER BY ordem`));
  return rows as unknown as any[];
}

export async function upsertRtiAlertas(rtiId: number, items: any[]) {
  const db_ = (await getDb())!;
  await db_.execute(sql.raw(`DELETE FROM rti_alertas WHERE rtiId = ${rtiId}`));
  for (const item of items) {
    await db_.execute(sql.raw(`INSERT INTO rti_alertas (rtiId, tipo, texto, ordem) VALUES (${rtiId}, '${item.tipo}', '${(item.texto || '').replace(/'/g, "''")}', ${item.ordem || 0})`));
  }
}

// ===== RTI FULL (with oportunidades, cenário, alertas) =====
export async function getRtiReportFull(rtiId: number) {
  const rti = await getRtiReportById(rtiId);
  if (!rti) return null;
  const oportunidades = await listRtiOportunidades(rtiId);
  const cenarioCompensacao = await listRtiCenarioCompensacao(rtiId);
  const alertas = await listRtiAlertas(rtiId);
  return { ...rti, oportunidades, cenarioCompensacao, alertas };
}

// ===== RTI HISTORY BY TASK =====
export async function listRtiByTaskId(taskId: number) {
  const db_ = await getDb();
  if (!db_) return [];
  const [rows] = await db_.execute(sql.raw(`
    SELECT r.*, c.razaoSocial as clienteNome, c.cnpj as clienteCnpj
    FROM rti_reports r
    LEFT JOIN clientes c ON r.clienteId = c.id
    WHERE r.taskId = ${taskId}
    ORDER BY r.versao DESC, r.createdAt DESC
  `));
  return rows as unknown as any[];
}

export async function createRtiVersion(taskId: number, caseId: number, clienteId: number, data: any, userId: number, userName: string) {
  const db_ = await getDb();
  if (!db_) return null;
  // Get current max version for this task
  const [existing] = await db_.execute(sql.raw(`SELECT MAX(versao) as maxVersao FROM rti_reports WHERE taskId = ${taskId}`));
  const maxVersao = (existing as any)?.[0]?.maxVersao || 0;
  const newVersao = maxVersao + 1;
  const numero = await getNextSequence('RTI', 'rti_reports', 'numero');
  const [result] = await db_.execute(sql.raw(`
    INSERT INTO rti_reports (caseId, clienteId, taskId, numero, versao, tesesAnalisadas, valorTotalEstimado, periodoAnalise, resumoExecutivo, metodologia, conclusao, observacoes, status, emitidoPorId, emitidoPorNome)
    VALUES (${caseId}, ${clienteId}, ${taskId}, '${numero}', ${newVersao}, ${data.tesesAnalisadas ? `'${JSON.stringify(data.tesesAnalisadas).replace(/'/g, "''")}'` : 'NULL'}, '${data.valorTotalEstimado || '0'}', ${data.periodoAnalise ? `'${data.periodoAnalise.replace(/'/g, "''")}'` : 'NULL'}, ${data.resumoExecutivo ? `'${data.resumoExecutivo.replace(/'/g, "''")}'` : 'NULL'}, ${data.metodologia ? `'${data.metodologia.replace(/'/g, "''")}'` : 'NULL'}, ${data.conclusao ? `'${data.conclusao.replace(/'/g, "''")}'` : 'NULL'}, ${data.observacoes ? `'${data.observacoes.replace(/'/g, "''")}'` : 'NULL'}, 'rascunho', ${userId}, '${userName.replace(/'/g, "''")}')
  `));
  return { id: (result as any).insertId, numero, versao: newVersao };
}

// ===== PARTNER RETURNS =====
export async function listPartnerReturns(filters?: { rtiId?: number; clienteId?: number; parceiroId?: number; status?: string }) {
  const db_ = (await getDb())!;
  let where = '1=1';
  if (filters?.rtiId) where += ` AND cpr.rtiId = ${filters.rtiId}`;
  if (filters?.clienteId) where += ` AND cpr.clienteId = ${filters.clienteId}`;
  if (filters?.parceiroId) where += ` AND cpr.parceiroId = ${filters.parceiroId}`;
  if (filters?.status) where += ` AND cpr.retornoStatus = '${filters.status}'`;
  const [rows] = await db_.execute(sql.raw(`
    SELECT cpr.*, c.razaoSocial as clienteNome, c.cnpj as clienteCnpj,
           r.numero as rtiNumero, r.valorTotalEstimado as rtiValorTotal
    FROM credit_partner_returns cpr
    LEFT JOIN clientes c ON cpr.clienteId = c.id
    LEFT JOIN rti_reports r ON cpr.rtiId = r.id
    WHERE ${where}
    ORDER BY cpr.createdAt DESC
  `));
  return rows as unknown as any[];
}

export async function createPartnerReturn(data: any) {
  const db_ = (await getDb())!;
  const now = new Date();
  const venceEm = new Date(now.getTime() + (data.slaDias || 7) * 24 * 60 * 60 * 1000);
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_partner_returns (rtiId, caseId, clienteId, parceiroId, parceiroNome, enviadoEm, slaDias, slaVenceEm, valorRti, registradoPorId, registradoPorNome) VALUES (${data.rtiId}, ${data.caseId || 'NULL'}, ${data.clienteId}, ${data.parceiroId || 'NULL'}, ${data.parceiroNome ? `'${data.parceiroNome.replace(/'/g, "''")}'` : 'NULL'}, '${now.toISOString().slice(0, 19).replace('T', ' ')}', ${data.slaDias || 7}, '${venceEm.toISOString().slice(0, 19).replace('T', ' ')}', ${data.valorRti || 0}, ${data.registradoPorId || 'NULL'}, ${data.registradoPorNome ? `'${data.registradoPorNome.replace(/'/g, "''")}'` : 'NULL'})`));
  return (result as unknown as any).insertId;
}

export async function updatePartnerReturn(id: number, data: any) {
  const db_ = (await getDb())!;
  const sets: string[] = [];
  if (data.retornoStatus !== undefined) sets.push(`retornoStatus = '${data.retornoStatus}'`);
  if (data.retornoObservacao !== undefined) sets.push(`retornoObservacao = '${(data.retornoObservacao || '').replace(/'/g, "''")}'`);
  if (data.motivoNaoFechamento !== undefined) sets.push(`motivoNaoFechamento = '${(data.motivoNaoFechamento || '').replace(/'/g, "''")}'`);
  if (data.valorContratado !== undefined) sets.push(`valorContratado = ${data.valorContratado}`);
  if (data.retornoRecebidoEm !== undefined) sets.push(`retornoRecebidoEm = '${data.retornoRecebidoEm}'`);
  if (sets.length === 0) return;
  await db_.execute(sql.raw(`UPDATE credit_partner_returns SET ${sets.join(', ')} WHERE id = ${id}`));
}

export async function getPartnerReturnStats() {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN retornoStatus = 'aguardando' THEN 1 ELSE 0 END) as aguardando,
      SUM(CASE WHEN retornoStatus = 'fechou' THEN 1 ELSE 0 END) as fechou,
      SUM(CASE WHEN retornoStatus = 'nao_fechou' THEN 1 ELSE 0 END) as naoFechou,
      SUM(CASE WHEN retornoStatus = 'sem_retorno' THEN 1 ELSE 0 END) as semRetorno,
      SUM(CASE WHEN retornoStatus = 'em_negociacao' THEN 1 ELSE 0 END) as emNegociacao,
      SUM(CASE WHEN retornoStatus = 'aguardando' AND slaVenceEm < NOW() THEN 1 ELSE 0 END) as slaVencido,
      COALESCE(SUM(valorRti), 0) as valorTotalRti,
      COALESCE(SUM(valorContratado), 0) as valorTotalContratado
    FROM credit_partner_returns
  `));
  return (rows as unknown as any[])[0];
}

// ===== ONBOARDING RECORDS =====
export async function getOnboardingRecord(taskId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_onboarding_records WHERE taskId = ${taskId}`));
  return (rows as unknown as any[])[0] || null;
}

export async function getOnboardingRecordByCase(caseId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_onboarding_records WHERE caseId = ${caseId}`));
  return (rows as unknown as any[])[0] || null;
}

export async function createOnboardingRecord(data: any) {
  const db_ = (await getDb())!;
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_onboarding_records (taskId, caseId, clienteId, checklistRevisao, checklistRefinamento, checklistRegistro, status) VALUES (${data.taskId}, ${data.caseId || 'NULL'}, ${data.clienteId}, '${JSON.stringify(data.checklistRevisao || [])}', '${JSON.stringify(data.checklistRefinamento || [])}', '${JSON.stringify(data.checklistRegistro || [])}', 'em_andamento')`));
  return (result as unknown as any).insertId;
}

export async function updateOnboardingRecord(id: number, data: any) {
  const db_ = (await getDb())!;
  const sets: string[] = [];
  if (data.checklistRevisao !== undefined) sets.push(`checklistRevisao = '${JSON.stringify(data.checklistRevisao)}'`);
  if (data.checklistRefinamento !== undefined) sets.push(`checklistRefinamento = '${JSON.stringify(data.checklistRefinamento)}'`);
  if (data.checklistRegistro !== undefined) sets.push(`checklistRegistro = '${JSON.stringify(data.checklistRegistro)}'`);
  if (data.reuniaoGravacaoUrl !== undefined) sets.push(`reuniaoGravacaoUrl = '${data.reuniaoGravacaoUrl}'`);
  if (data.reuniaoGravacaoFileKey !== undefined) sets.push(`reuniaoGravacaoFileKey = '${data.reuniaoGravacaoFileKey}'`);
  if (data.reuniaoTranscricaoUrl !== undefined) sets.push(`reuniaoTranscricaoUrl = '${data.reuniaoTranscricaoUrl}'`);
  if (data.reuniaoTranscricaoFileKey !== undefined) sets.push(`reuniaoTranscricaoFileKey = '${data.reuniaoTranscricaoFileKey}'`);
  if (data.reuniaoData !== undefined) sets.push(`reuniaoData = '${data.reuniaoData}'`);
  if (data.reuniaoParticipantes !== undefined) sets.push(`reuniaoParticipantes = '${JSON.stringify(data.reuniaoParticipantes)}'`);
  if (data.creditoDescricao !== undefined) sets.push(`creditoDescricao = '${(data.creditoDescricao || '').replace(/'/g, "''")}'`);
  if (data.periodoCredito !== undefined) sets.push(`periodoCredito = '${data.periodoCredito}'`);
  if (data.valorEstimadoCredito !== undefined) sets.push(`valorEstimadoCredito = ${data.valorEstimadoCredito}`);
  if (data.estrategia !== undefined) sets.push(`estrategia = '${data.estrategia}'`);
  if (data.estrategiaDetalhes !== undefined) sets.push(`estrategiaDetalhes = '${JSON.stringify(data.estrategiaDetalhes)}'`);
  if (data.contatoContabil !== undefined) sets.push(`contatoContabil = '${JSON.stringify(data.contatoContabil)}'`);
  if (data.contatoFinanceiro !== undefined) sets.push(`contatoFinanceiro = '${JSON.stringify(data.contatoFinanceiro)}'`);
  if (data.contatoEmpresario !== undefined) sets.push(`contatoEmpresario = '${JSON.stringify(data.contatoEmpresario)}'`);
  if (data.contatoOutros !== undefined) sets.push(`contatoOutros = '${JSON.stringify(data.contatoOutros)}'`);
  if (data.responsavelTecnicoId !== undefined) sets.push(`responsavelTecnicoId = ${data.responsavelTecnicoId}`);
  if (data.responsavelTecnicoNome !== undefined) sets.push(`responsavelTecnicoNome = '${(data.responsavelTecnicoNome || '').replace(/'/g, "''")}'`);
  if (data.empresaTemDebitos !== undefined) sets.push(`empresaTemDebitos = ${data.empresaTemDebitos}`);
  if (data.empresaPrecisaCnd !== undefined) sets.push(`empresaPrecisaCnd = ${data.empresaPrecisaCnd}`);
  if (data.empresaNoEmac !== undefined) sets.push(`empresaNoEmac = ${data.empresaNoEmac}`);
  if (data.empresaHistoricoMalha !== undefined) sets.push(`empresaHistoricoMalha = ${data.empresaHistoricoMalha}`);
  if (data.empresaAssinanteMonitor !== undefined) sets.push(`empresaAssinanteMonitor = ${data.empresaAssinanteMonitor}`);
  if (data.status !== undefined) sets.push(`status = '${data.status}'`);
  if (data.concluidoEm !== undefined) sets.push(`concluidoEm = '${data.concluidoEm}'`);
  if (data.concluidoPorId !== undefined) sets.push(`concluidoPorId = ${data.concluidoPorId}`);
  if (data.concluidoPorNome !== undefined) sets.push(`concluidoPorNome = '${(data.concluidoPorNome || '').replace(/'/g, "''")}'`);
  if (sets.length === 0) return;
  await db_.execute(sql.raw(`UPDATE credit_onboarding_records SET ${sets.join(', ')} WHERE id = ${id}`));
}

// ===== APURAÇÃO STATS (for dashboard/reports) =====
export async function getApuracaoStats(filters?: { periodoInicio?: string; periodoFim?: string }) {
  const db_ = (await getDb())!;
  let dateFilter = '';
  if (filters?.periodoInicio) dateFilter += ` AND r.emitidoEm >= '${filters.periodoInicio}'`;
  if (filters?.periodoFim) dateFilter += ` AND r.emitidoEm <= '${filters.periodoFim}'`;
  
  const [rows] = await db_.execute(sql.raw(`
    SELECT 
      COUNT(DISTINCT r.id) as totalRtis,
      COUNT(DISTINCT r.clienteId) as totalClientes,
      COALESCE(SUM(r.valorTotalEstimado), 0) as valorTotalApurado,
      COUNT(DISTINCT CASE WHEN r.status = 'emitido' THEN r.id END) as rtisEmitidos,
      COUNT(DISTINCT CASE WHEN r.status = 'rascunho' THEN r.id END) as rtisRascunho
    FROM rti_reports r
    WHERE 1=1 ${dateFilter}
  `));
  
  // Stats por tese
  const [teseRows] = await db_.execute(sql.raw(`
    SELECT ro.descricao as tese, ro.classificacao,
           COUNT(*) as quantidade,
           COALESCE(SUM(ro.valorApurado), 0) as valorTotal
    FROM rti_oportunidades ro
    JOIN rti_reports r ON ro.rtiId = r.id
    WHERE 1=1 ${dateFilter}
    GROUP BY ro.descricao, ro.classificacao
    ORDER BY valorTotal DESC
  `));
  
  return { ...(rows as unknown as any[])[0], porTese: teseRows as unknown as any[] };
}


// ===== RETIFICAÇÃO =====
export async function listRetificacaoRecords(taskId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT * FROM credit_retificacao_records WHERE taskId = ${taskId} ORDER BY createdAt DESC`));
  return rows as unknown as any[];
}

export async function getRetificacaoByCase(caseId: number) {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT crr.*, ct.titulo as taskTitulo FROM credit_retificacao_records crr LEFT JOIN credit_tasks ct ON crr.taskId = ct.id WHERE crr.caseId = ${caseId} ORDER BY crr.createdAt DESC`));
  return rows as unknown as any[];
}

export async function createRetificacaoRecord(data: any) {
  const db_ = (await getDb())!;
  const esc = (v: string) => v ? v.replace(/'/g, "''") : '';
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_retificacao_records (taskId, caseId, clienteId, teseId, teseNome, tipoRetificacao, periodoInicio, periodoFim, valorApuradoRti, valorCreditoDisponivel, divergencia, divergenciaPct, alertaDivergencia, justificativaDivergencia, saldoPorGrupo, obrigacoesAcessorias, observacoes, registradoPorId, registradoPorNome) VALUES (${data.taskId}, ${data.caseId}, ${data.clienteId}, ${data.teseId || 'NULL'}, ${data.teseNome ? `'${esc(data.teseNome)}'` : 'NULL'}, '${data.tipoRetificacao || 'total'}', ${data.periodoInicio ? `'${data.periodoInicio}'` : 'NULL'}, ${data.periodoFim ? `'${data.periodoFim}'` : 'NULL'}, ${data.valorApuradoRti || 0}, ${data.valorCreditoDisponivel || 0}, ${data.divergencia || 0}, ${data.divergenciaPct || 0}, ${data.alertaDivergencia ? 1 : 0}, ${data.justificativaDivergencia ? `'${esc(data.justificativaDivergencia)}'` : 'NULL'}, ${data.saldoPorGrupo ? `'${JSON.stringify(data.saldoPorGrupo)}'` : 'NULL'}, ${data.obrigacoesAcessorias ? `'${JSON.stringify(data.obrigacoesAcessorias)}'` : 'NULL'}, ${data.observacoes ? `'${esc(data.observacoes)}'` : 'NULL'}, ${data.registradoPorId || 'NULL'}, ${data.registradoPorNome ? `'${esc(data.registradoPorNome)}'` : 'NULL'})`));
  return { id: (result as unknown as any).insertId };
}

export async function updateRetificacaoRecord(id: number, data: any) {
  const db_ = (await getDb())!;
  const esc = (v: string) => v ? v.replace(/'/g, "''") : '';
  const sets: string[] = [];
  if (data.tipoRetificacao !== undefined) sets.push(`tipoRetificacao = '${data.tipoRetificacao}'`);
  if (data.periodoInicio !== undefined) sets.push(`periodoInicio = '${data.periodoInicio}'`);
  if (data.periodoFim !== undefined) sets.push(`periodoFim = '${data.periodoFim}'`);
  if (data.valorApuradoRti !== undefined) sets.push(`valorApuradoRti = ${data.valorApuradoRti}`);
  if (data.valorCreditoDisponivel !== undefined) sets.push(`valorCreditoDisponivel = ${data.valorCreditoDisponivel}`);
  if (data.divergencia !== undefined) sets.push(`divergencia = ${data.divergencia}`);
  if (data.divergenciaPct !== undefined) sets.push(`divergenciaPct = ${data.divergenciaPct}`);
  if (data.alertaDivergencia !== undefined) sets.push(`alertaDivergencia = ${data.alertaDivergencia ? 1 : 0}`);
  if (data.justificativaDivergencia !== undefined) sets.push(`justificativaDivergencia = '${esc(data.justificativaDivergencia)}'`);
  if (data.saldoPorGrupo !== undefined) sets.push(`saldoPorGrupo = '${JSON.stringify(data.saldoPorGrupo)}'`);
  if (data.obrigacoesAcessorias !== undefined) sets.push(`obrigacoesAcessorias = '${JSON.stringify(data.obrigacoesAcessorias)}'`);
  if (data.checklistConcluido !== undefined) sets.push(`checklistConcluido = ${data.checklistConcluido ? 1 : 0}`);
  if (data.observacoes !== undefined) sets.push(`observacoes = '${esc(data.observacoes)}'`);
  if (sets.length > 0) {
    await db_.execute(sql.raw(`UPDATE credit_retificacao_records SET ${sets.join(', ')} WHERE id = ${id}`));
  }
  return { success: true };
}

// ===== CREDIT GUIAS =====
export async function listGuias(filters: { taskId?: number; caseId?: number; clienteId?: number; perdcompId?: number }) {
  const db_ = (await getDb())!;
  const wheres: string[] = [];
  if (filters.taskId) wheres.push(`cg.taskId = ${filters.taskId}`);
  if (filters.caseId) wheres.push(`cg.caseId = ${filters.caseId}`);
  if (filters.clienteId) wheres.push(`cg.clienteId = ${filters.clienteId}`);
  if (filters.perdcompId) wheres.push(`cg.perdcompId = ${filters.perdcompId}`);
  const where = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';
  const [rows] = await db_.execute(sql.raw(`SELECT cg.* FROM credit_guias cg ${where} ORDER BY cg.dataVencimento ASC`));
  return rows as unknown as any[];
}

export async function createGuia(data: any) {
  const db_ = (await getDb())!;
  const esc = (v: string) => v ? v.replace(/'/g, "''") : '';
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_guias (taskId, caseId, clienteId, perdcompId, cnpjGuia, codigoReceita, grupoTributo, periodoApuracao, dataVencimento, valorOriginal, valorMulta, valorJuros, valorTotal, valorCompensado, statusGuia, validacaoCliente, guiaUrl, comprovanteUrl, observacoes, registradoPorId, registradoPorNome) VALUES (${data.taskId || 'NULL'}, ${data.caseId || 'NULL'}, ${data.clienteId}, ${data.perdcompId || 'NULL'}, ${data.cnpjGuia ? `'${data.cnpjGuia}'` : 'NULL'}, ${data.codigoReceita ? `'${data.codigoReceita}'` : 'NULL'}, ${data.grupoTributo ? `'${esc(data.grupoTributo)}'` : 'NULL'}, ${data.periodoApuracao ? `'${data.periodoApuracao}'` : 'NULL'}, ${data.dataVencimento ? `'${data.dataVencimento}'` : 'NULL'}, ${data.valorOriginal || 0}, ${data.valorMulta || 0}, ${data.valorJuros || 0}, ${data.valorTotal || 0}, ${data.valorCompensado || 0}, '${data.statusGuia || 'a_vencer'}', ${data.validacaoCliente ? 1 : 0}, ${data.guiaUrl ? `'${data.guiaUrl}'` : 'NULL'}, ${data.comprovanteUrl ? `'${data.comprovanteUrl}'` : 'NULL'}, ${data.observacoes ? `'${esc(data.observacoes)}'` : 'NULL'}, ${data.registradoPorId || 'NULL'}, ${data.registradoPorNome ? `'${esc(data.registradoPorNome)}'` : 'NULL'})`));
  return { id: (result as unknown as any).insertId };
}

export async function updateGuia(id: number, data: any) {
  const db_ = (await getDb())!;
  const esc = (v: string) => v ? v.replace(/'/g, "''") : '';
  const sets: string[] = [];
  if (data.cnpjGuia !== undefined) sets.push(`cnpjGuia = '${data.cnpjGuia}'`);
  if (data.codigoReceita !== undefined) sets.push(`codigoReceita = '${data.codigoReceita}'`);
  if (data.grupoTributo !== undefined) sets.push(`grupoTributo = '${esc(data.grupoTributo)}'`);
  if (data.periodoApuracao !== undefined) sets.push(`periodoApuracao = '${data.periodoApuracao}'`);
  if (data.dataVencimento !== undefined) sets.push(`dataVencimento = '${data.dataVencimento}'`);
  if (data.valorOriginal !== undefined) sets.push(`valorOriginal = ${data.valorOriginal}`);
  if (data.valorMulta !== undefined) sets.push(`valorMulta = ${data.valorMulta}`);
  if (data.valorJuros !== undefined) sets.push(`valorJuros = ${data.valorJuros}`);
  if (data.valorTotal !== undefined) sets.push(`valorTotal = ${data.valorTotal}`);
  if (data.valorCompensado !== undefined) sets.push(`valorCompensado = ${data.valorCompensado}`);
  if (data.statusGuia !== undefined) sets.push(`statusGuia = '${data.statusGuia}'`);
  if (data.validacaoCliente !== undefined) sets.push(`validacaoCliente = ${data.validacaoCliente ? 1 : 0}`);
  if (data.guiaUrl !== undefined) sets.push(`guiaUrl = '${data.guiaUrl}'`);
  if (data.comprovanteUrl !== undefined) sets.push(`comprovanteUrl = '${data.comprovanteUrl}'`);
  if (data.perdcompId !== undefined) sets.push(`perdcompId = ${data.perdcompId}`);
  if (data.observacoes !== undefined) sets.push(`observacoes = '${esc(data.observacoes)}'`);
  if (sets.length > 0) {
    await db_.execute(sql.raw(`UPDATE credit_guias SET ${sets.join(', ')} WHERE id = ${id}`));
  }
  return { success: true };
}

export async function deleteGuia(id: number) {
  const db_ = (await getDb())!;
  await db_.execute(sql.raw(`DELETE FROM credit_guias WHERE id = ${id}`));
  return { success: true };
}

// ===== ENHANCED PERDCOMP WITH FULL RECEIPT FIELDS =====
export async function createPerdcompFull(data: any) {
  const db_ = (await getDb())!;
  const esc = (v: string) => v ? v.replace(/'/g, "''") : '';
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_perdcomps (taskId, caseId, clienteId, ledgerEntryId, numeroPerdcomp, tipoDocumento, numeroControle, cnpjDeclarante, nomeEmpresarial, tipoCredito, oriundoAcaoJudicial, creditoSucedida, numeroDocArrecadacao, codigoReceita, grupoTributo, dataArrecadacao, periodoApuracao, valorCredito, valorDebitosCompensados, debitosCompensadosJson, saldoRemanescente, dataTransmissao, dataVencimentoGuia, guiaNumero, guiaUrl, comprovanteUrl, reciboUrl, status, despachoDecisorio, representanteNome, representanteCpf, versaoSistema, codigoSerpro, dataRecebimentoSerpro, feitoPelaEvox, modalidade, observacoes, registradoPorId, registradoPorNome) VALUES (${data.taskId || 'NULL'}, ${data.caseId || 'NULL'}, ${data.clienteId}, ${data.ledgerEntryId || 'NULL'}, '${esc(data.numeroPerdcomp || '')}', ${data.tipoDocumento ? `'${data.tipoDocumento}'` : "'Original'"}, ${data.numeroControle ? `'${data.numeroControle}'` : 'NULL'}, ${data.cnpjDeclarante ? `'${data.cnpjDeclarante}'` : 'NULL'}, ${data.nomeEmpresarial ? `'${esc(data.nomeEmpresarial)}'` : 'NULL'}, ${data.tipoCredito ? `'${esc(data.tipoCredito)}'` : 'NULL'}, ${data.oriundoAcaoJudicial ? 1 : 0}, ${data.creditoSucedida ? 1 : 0}, ${data.numeroDocArrecadacao ? `'${data.numeroDocArrecadacao}'` : 'NULL'}, ${data.codigoReceita ? `'${data.codigoReceita}'` : 'NULL'}, ${data.grupoTributo ? `'${esc(data.grupoTributo)}'` : 'NULL'}, ${data.dataArrecadacao ? `'${data.dataArrecadacao}'` : 'NULL'}, ${data.periodoApuracao ? `'${data.periodoApuracao}'` : 'NULL'}, ${data.valorCredito || 0}, ${data.valorDebitosCompensados || 0}, ${data.debitosCompensadosJson ? `'${JSON.stringify(data.debitosCompensadosJson)}'` : 'NULL'}, ${data.saldoRemanescente || 0}, ${data.dataTransmissao ? `'${data.dataTransmissao}'` : 'NULL'}, ${data.dataVencimentoGuia ? `'${data.dataVencimentoGuia}'` : 'NULL'}, ${data.guiaNumero ? `'${data.guiaNumero}'` : 'NULL'}, ${data.guiaUrl ? `'${data.guiaUrl}'` : 'NULL'}, ${data.comprovanteUrl ? `'${data.comprovanteUrl}'` : 'NULL'}, ${data.reciboUrl ? `'${data.reciboUrl}'` : 'NULL'}, '${data.status || 'transmitido'}', ${data.despachoDecisorio ? `'${esc(data.despachoDecisorio)}'` : 'NULL'}, ${data.representanteNome ? `'${esc(data.representanteNome)}'` : 'NULL'}, ${data.representanteCpf ? `'${data.representanteCpf}'` : 'NULL'}, ${data.versaoSistema ? `'${data.versaoSistema}'` : 'NULL'}, ${data.codigoSerpro ? `'${data.codigoSerpro}'` : 'NULL'}, ${data.dataRecebimentoSerpro ? `'${data.dataRecebimentoSerpro}'` : 'NULL'}, ${data.feitoPelaEvox !== undefined ? (data.feitoPelaEvox ? 1 : 0) : 1}, '${data.modalidade || 'compensacao'}', ${data.observacoes ? `'${esc(data.observacoes)}'` : 'NULL'}, ${data.registradoPorId || 'NULL'}, ${data.registradoPorNome ? `'${esc(data.registradoPorNome)}'` : 'NULL'})`));
  return { id: (result as unknown as any).insertId };
}

export async function searchPerdcomps(query: string) {
  const db_ = (await getDb())!;
  const q = query.replace(/'/g, "''");
  const [rows] = await db_.execute(sql.raw(`SELECT cp.*, c.razaoSocial as clienteNome FROM credit_perdcomps cp LEFT JOIN clientes c ON cp.clienteId = c.id WHERE cp.numeroPerdcomp LIKE '%${q}%' OR cp.numeroControle LIKE '%${q}%' OR cp.cnpjDeclarante LIKE '%${q}%' OR c.razaoSocial LIKE '%${q}%' ORDER BY cp.createdAt DESC LIMIT 50`));
  return rows as unknown as any[];
}

// ===== ENHANCED GESTÃO DE CRÉDITOS =====
export async function getGestaoCompletaCreditos(clienteId: number) {
  const db_ = (await getDb())!;
  const [ledger] = await db_.execute(sql.raw(`SELECT cl.*, ccg.sigla as grupoSigla, ccg.nome as grupoNome FROM credit_ledger cl LEFT JOIN credit_compensation_groups ccg ON cl.compensationGroupId = ccg.id WHERE cl.clienteId = ${clienteId} ORDER BY cl.createdAt DESC`));
  const [perdcomps] = await db_.execute(sql.raw(`SELECT * FROM credit_perdcomps WHERE clienteId = ${clienteId} ORDER BY dataTransmissao DESC`));
  const [retificacoes] = await db_.execute(sql.raw(`SELECT * FROM credit_retificacao_records WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [guias] = await db_.execute(sql.raw(`SELECT * FROM credit_guias WHERE clienteId = ${clienteId} ORDER BY dataVencimento ASC`));
  const [strategies] = await db_.execute(sql.raw(`SELECT ccs.*, cc.numero as caseNumero FROM credit_case_strategy ccs LEFT JOIN credit_cases cc ON ccs.caseId = cc.id WHERE ccs.clienteId = ${clienteId} ORDER BY ccs.createdAt DESC`));
  const [exitos] = await db_.execute(sql.raw(`SELECT * FROM success_events WHERE clienteId = ${clienteId} ORDER BY createdAt DESC`));
  const [rtis] = await db_.execute(sql.raw(`SELECT r.*, ct.titulo as taskTitulo FROM rti_reports r LEFT JOIN credit_tasks ct ON r.taskId = ct.id WHERE r.clienteId = ${clienteId} ORDER BY r.createdAt DESC`));
  
  const ledgerArr = ledger as unknown as any[];
  const perdcompsArr = perdcomps as unknown as any[];
  const retificacoesArr = retificacoes as unknown as any[];
  
  const totalEstimado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorEstimado || 0), 0);
  const totalValidado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorValidado || 0), 0);
  const totalRetificado = retificacoesArr.reduce((s: number, r: any) => s + Number(r.valorCreditoDisponivel || 0), 0);
  const totalProtocolado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorProtocolado || 0), 0);
  const totalEfetivado = ledgerArr.reduce((s: number, l: any) => s + Number(l.valorEfetivado || 0), 0);
  const saldoDisponivel = ledgerArr.reduce((s: number, l: any) => s + Number(l.saldoDisponivel || l.saldoResidual || 0), 0);
  const saldoUtilizado = ledgerArr.reduce((s: number, l: any) => s + Number(l.saldoUtilizado || 0), 0);
  
  const saldoPorGrupo: Record<string, { disponivel: number; utilizado: number; estimado: number }> = {};
  ledgerArr.forEach((l: any) => {
    const grupo = l.grupoSigla || l.grupoDebito || 'OUTROS';
    if (!saldoPorGrupo[grupo]) saldoPorGrupo[grupo] = { disponivel: 0, utilizado: 0, estimado: 0 };
    saldoPorGrupo[grupo].disponivel += Number(l.saldoDisponivel || l.saldoResidual || 0);
    saldoPorGrupo[grupo].utilizado += Number(l.saldoUtilizado || 0);
    saldoPorGrupo[grupo].estimado += Number(l.valorEstimado || 0);
  });
  
  const now = Date.now();
  const prescricaoRisk = ledgerArr.filter((l: any) => {
    if (l.dataPrescricao) {
      const prescDate = new Date(l.dataPrescricao).getTime();
      return prescDate < now + (180 * 24 * 60 * 60 * 1000) && Number(l.saldoDisponivel || l.saldoResidual || 0) > 0;
    }
    const created = new Date(l.createdAt).getTime();
    const yearsOld = (now - created) / (365.25 * 24 * 60 * 60 * 1000);
    return yearsOld > 4.5 && Number(l.saldoDisponivel || l.saldoResidual || 0) > 0;
  });
  
  const historicoUtilizacao = perdcompsArr.map((p: any) => ({
    id: p.id, tipo: p.modalidade || 'compensacao', numeroPerdcomp: p.numeroPerdcomp,
    valor: Number(p.valorDebitosCompensados || p.valorCredito || 0),
    data: p.dataTransmissao, status: p.status, grupoTributo: p.grupoTributo,
  }));
  
  return {
    ledger: ledgerArr, perdcomps: perdcompsArr, retificacoes: retificacoesArr,
    guias: guias as unknown as any[], strategies: strategies as unknown as any[],
    exitos: exitos as unknown as any[], rtis: rtis as unknown as any[],
    totals: { totalEstimado, totalValidado, totalRetificado, totalProtocolado, totalEfetivado, saldoDisponivel, saldoUtilizado },
    saldoPorGrupo, prescricaoRisk, historicoUtilizacao,
  };
}

// ===== AUTO-CREATE NEXT QUEUE TASK =====
export async function createNextQueueTask(data: { caseId: number; clienteId: number; fila: string; titulo: string; criadoPorId: number; criadoPorNome: string; }) {
  const db_ = (await getDb())!;
  const esc = (v: string) => v ? v.replace(/'/g, "''") : '';
  const [result] = await db_.execute(sql.raw(`INSERT INTO credit_tasks (caseId, clienteId, titulo, fila, status, prioridade, criadoPorId, criadoPorNome) VALUES (${data.caseId}, ${data.clienteId}, '${esc(data.titulo)}', '${data.fila}', 'pendente', 'media', ${data.criadoPorId}, '${esc(data.criadoPorNome)}')`));
  return { id: (result as unknown as any).insertId };
}

// ===== RETIFICAÇÃO STATS =====
export async function getRetificacaoStats(clienteId?: number) {
  const db_ = (await getDb())!;
  const where = clienteId ? `WHERE clienteId = ${clienteId}` : '';
  const [rows] = await db_.execute(sql.raw(`SELECT COUNT(*) as total, COALESCE(SUM(valorApuradoRti),0) as totalApurado, COALESCE(SUM(valorCreditoDisponivel),0) as totalDisponivel, COALESCE(SUM(divergencia),0) as totalDivergencia, SUM(CASE WHEN alertaDivergencia = 1 THEN 1 ELSE 0 END) as totalAlertas FROM credit_retificacao_records ${where}`));
  return (rows as unknown as any[])[0];
}


// ===== OCR / PARSER DE GUIAS TRIBUTÁRIAS =====
import { invokeLLM } from "./_core/llm";

export interface GuiaOcrResult {
  cnpj: string;
  razaoSocial: string;
  periodoApuracao: string;
  dataVencimento: string;
  numeroDocumento: string;
  valorTotal: number;
  observacoes: string;
  itens: Array<{
    codigo: string;
    denominacao: string;
    subtipo: string;
    periodoApuracao: string;
    vencimento: string;
    principal: number;
    multa: number;
    juros: number;
    total: number;
  }>;
  grupoTributo: string;
  tipoGuia: string;
  statusVencimento: string;
  confianca: number;
}

const CODIGO_GRUPO_MAP: Record<string, string> = {
  // PIS/COFINS
  '8109': 'PIS/COFINS', '6912': 'PIS/COFINS',
  '2172': 'PIS/COFINS', '5856': 'PIS/COFINS',
  '5952': 'PIS/COFINS', '5979': 'PIS/COFINS', '5960': 'PIS/COFINS',
  // IRPJ/CSLL
  '3373': 'IRPJ/CSLL', '2089': 'IRPJ/CSLL', '2362': 'IRPJ/CSLL', '0220': 'IRPJ/CSLL', '5993': 'IRPJ/CSLL',
  '6012': 'IRPJ/CSLL', '2484': 'IRPJ/CSLL', '6773': 'IRPJ/CSLL', '2372': 'IRPJ/CSLL',
  '1599': 'IRPJ/CSLL', '2430': 'IRPJ/CSLL', '2456': 'IRPJ/CSLL',
  // INSS/PREVIDENCIÁRIOS (DARF codes for DCTFWeb)
  '1138': 'INSS/PREVIDENCIÁRIOS', '1646': 'INSS/PREVIDENCIÁRIOS',
  '1170': 'INSS/PREVIDENCIÁRIOS', '1176': 'INSS/PREVIDENCIÁRIOS',
  '1191': 'INSS/PREVIDENCIÁRIOS', '1196': 'INSS/PREVIDENCIÁRIOS',
  '1200': 'INSS/PREVIDENCIÁRIOS',
  // GPS codes
  '1007': 'INSS/PREVIDENCIÁRIOS', '1104': 'INSS/PREVIDENCIÁRIOS',
  '1120': 'INSS/PREVIDENCIÁRIOS', '1147': 'INSS/PREVIDENCIÁRIOS',
  '1163': 'INSS/PREVIDENCIÁRIOS', '1201': 'INSS/PREVIDENCIÁRIOS',
  '1406': 'INSS/PREVIDENCIÁRIOS', '1473': 'INSS/PREVIDENCIÁRIOS',
  '1503': 'INSS/PREVIDENCIÁRIOS', '1554': 'INSS/PREVIDENCIÁRIOS',
  '2003': 'INSS/PREVIDENCIÁRIOS', '2100': 'INSS/PREVIDENCIÁRIOS',
  '2208': 'INSS/PREVIDENCIÁRIOS', '2402': 'INSS/PREVIDENCIÁRIOS',
  '2500': 'INSS/PREVIDENCIÁRIOS', '2607': 'INSS/PREVIDENCIÁRIOS',
  '2631': 'INSS/PREVIDENCIÁRIOS', '2658': 'INSS/PREVIDENCIÁRIOS',
};
const CODIGO_TIPO_MAP: Record<string, string> = {
  // PIS
  '8109': 'PIS', '6912': 'PIS', '5952': 'PIS',
  // COFINS
  '2172': 'COFINS', '5856': 'COFINS', '5960': 'COFINS', '5979': 'COFINS',
  // IRPJ
  '3373': 'IRPJ', '2089': 'IRPJ', '2362': 'IRPJ', '0220': 'IRPJ', '5993': 'IRPJ', '1599': 'IRPJ', '2430': 'IRPJ',
  // CSLL
  '6012': 'CSLL', '2484': 'CSLL', '6773': 'CSLL', '2372': 'CSLL', '2456': 'CSLL',
  // INSS (DARF DCTFWeb)
  '1138': 'INSS', '1646': 'INSS', '1170': 'INSS', '1176': 'INSS',
  '1191': 'INSS', '1196': 'INSS', '1200': 'INSS',
  // INSS (GPS)
  '1007': 'INSS', '1104': 'INSS', '1120': 'INSS', '1147': 'INSS',
  '1163': 'INSS', '1201': 'INSS', '1406': 'INSS', '1473': 'INSS',
  '1503': 'INSS', '1554': 'INSS', '2003': 'INSS', '2100': 'INSS',
  '2208': 'INSS', '2402': 'INSS', '2500': 'INSS', '2607': 'INSS',
  '2631': 'INSS', '2658': 'INSS',
};

function classifyGuia(itens: Array<{ codigo: string }>): { grupoTributo: string; tipoGuia: string } {
  const tipos = new Set<string>();
  const grupos = new Set<string>();
  for (const item of itens) {
    const code = item.codigo?.trim();
    if (CODIGO_TIPO_MAP[code]) tipos.add(CODIGO_TIPO_MAP[code]);
    if (CODIGO_GRUPO_MAP[code]) grupos.add(CODIGO_GRUPO_MAP[code]);
  }
  let tipoGuia = 'OUTROS';
  if (tipos.has('PIS') && tipos.has('COFINS')) tipoGuia = 'PIS+COFINS';
  else if (tipos.has('IRPJ') && tipos.has('CSLL')) tipoGuia = 'IRPJ+CSLL';
  else if (tipos.has('PIS')) tipoGuia = 'PIS';
  else if (tipos.has('COFINS')) tipoGuia = 'COFINS';
  else if (tipos.has('IRPJ')) tipoGuia = 'IRPJ';
  else if (tipos.has('CSLL')) tipoGuia = 'CSLL';
  else if (tipos.has('INSS')) tipoGuia = 'DCTFWEB';
  const grupoTributo = grupos.size === 1 ? Array.from(grupos)[0] : grupos.size > 1 ? Array.from(grupos).join(' / ') : 'OUTROS';
  return { grupoTributo, tipoGuia };
}

function calcStatusVencimento(dataVencimento: string): string {
  try {
    const parts = dataVencimento.split('/');
    if (parts.length !== 3) return 'desconhecido';
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'vencida';
    if (diffDays <= 5) return 'proxima_vencer';
    return 'a_vencer';
  } catch { return 'desconhecido'; }
}

export async function parseGuiaWithOcr(fileUrl: string, mimeType: string): Promise<GuiaOcrResult> {
  const isImage = mimeType.startsWith('image/');
  const content: any[] = [
    {
      type: "text",
      text: `Analise esta guia tributária brasileira e extraia TODOS os dados estruturados.

O documento pode ser um dos seguintes tipos:
1. DARF (Documento de Arrecadação de Receitas Federais) — contém campos como "Período de Apuração", "Código da Receita", "Valor Principal", "Composição do Documento de Arrecadação" com códigos como 0220 (IRPJ), 6012 (CSLL), 8109 (PIS), 2172 (COFINS), 5856 (COFINS), 1138 (INSS).
2. GPS (Guia da Previdência Social) — emitida pelo INSS/MPS, contém campos como "Código de Pagamento", "Competência", "Identificador (NIT/PIS/PASEP)", "Valor do INSS", "Valor de Outras Entidades", "ATM, Multa e Juros", "Total". Códigos comuns: 1007, 1104, 1120, 1163, 1201, 1406, 1473, 2003, 2100, 2208, 2402, 2500, 2607.
3. DCTFWeb DARF — guia gerada pela DCTFWeb para contribuições previdenciárias, similar ao DARF mas com códigos INSS.

Retorne um JSON com exatamente esta estrutura:
{
  "tipoDocumento": "DARF" ou "GPS" ou "DCTFWEB",
  "cnpj": "XX.XXX.XXX/XXXX-XX",
  "razaoSocial": "NOME DA EMPRESA ou CONTRIBUINTE",
  "periodoApuracao": "Mês/Ano conforme documento (ex: Março/2025, 03/2025, 1º Trimestre/2025)",
  "dataVencimento": "DD/MM/AAAA",
  "numeroDocumento": "número do documento se disponível",
  "valorTotal": 0.00,
  "observacoes": "texto das observações ou vazio",
  "itens": [
    {
      "codigo": "XXXX",
      "denominacao": "NOME DO TRIBUTO (ex: IRPJ, CSLL, PIS, COFINS, INSS, Contribuição Previdenciária)",
      "subtipo": "DETALHAMENTO (ex: OB L REAL-DEMAIS BAL TRIM, LUCRO REAL, etc)",
      "periodoApuracao": "PA do item se disponível",
      "vencimento": "DD/MM/AAAA do item se disponível",
      "principal": 0.00,
      "multa": 0.00,
      "juros": 0.00,
      "total": 0.00
    }
  ],
  "confianca": 95
}

REGRAS IMPORTANTES:
- Valores monetários devem ser números decimais (use ponto como separador decimal, ex: 1234.56)
- Para DARF: extraia TODOS os itens da tabela "Composição do Documento de Arrecadação". O código é o número de 4 dígitos à esquerda.
- Para GPS: crie um único item com o código de pagamento (campo 3), denominação "Contribuição Previdenciária INSS", e o valor total do campo 11.
  - O CNPJ da GPS pode estar no campo "Identificador" ou no cabeçalho.
  - A competência (campo 4) é o período de apuração (formato MM/AAAA).
  - O vencimento (campo 2) é a data de vencimento.
- Se não encontrar multa ou juros, use 0.
- O campo "confianca" é um número de 0 a 100 indicando sua confiança na extração.
- Se o CNPJ estiver parcial ou ilegível, extraia o que for possível e reduza a confiança.`
    }
  ];
  if (isImage) {
    content.push({ type: "image_url", image_url: { url: fileUrl, detail: "high" } });
  } else {
    content.push({ type: "file_url", file_url: { url: fileUrl, mime_type: "application/pdf" } });
  }

  const result = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um especialista em documentos fiscais brasileiros. Extraia dados de guias tributárias (DARF, GPS, DCTFWeb) com máxima precisão. Identifique primeiro o tipo de documento e depois extraia todos os campos relevantes. Retorne APENAS JSON válido, sem markdown ou texto adicional." },
      { role: "user", content: content }
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = result.choices[0]?.message?.content;
  const textContent = typeof rawContent === 'string' ? rawContent : Array.isArray(rawContent) ? rawContent.map((p: any) => p.type === 'text' ? p.text : '').join('') : '';
  let parsed: any;
  try {
    parsed = JSON.parse(textContent);
  } catch {
    const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[1].trim());
    else throw new Error('Não foi possível extrair dados da guia. Verifique se o arquivo é um DARF válido.');
  }

  const itens = (parsed.itens || []).map((item: any) => ({
    codigo: String(item.codigo || '').trim(),
    denominacao: String(item.denominacao || ''),
    subtipo: String(item.subtipo || ''),
    periodoApuracao: String(item.periodoApuracao || ''),
    vencimento: String(item.vencimento || ''),
    principal: parseFloat(item.principal) || 0,
    multa: parseFloat(item.multa) || 0,
    juros: parseFloat(item.juros) || 0,
    total: parseFloat(item.total) || 0,
  }));
  const { grupoTributo, tipoGuia } = classifyGuia(itens);
  const dataVencimento = String(parsed.dataVencimento || '');
  const statusVencimento = calcStatusVencimento(dataVencimento);

  return {
    cnpj: String(parsed.cnpj || ''),
    razaoSocial: String(parsed.razaoSocial || ''),
    periodoApuracao: String(parsed.periodoApuracao || ''),
    dataVencimento,
    numeroDocumento: String(parsed.numeroDocumento || ''),
    valorTotal: parseFloat(parsed.valorTotal) || 0,
    observacoes: String(parsed.observacoes || ''),
    itens, grupoTributo, tipoGuia, statusVencimento,
    confianca: parseInt(parsed.confianca) || 0,
  };
}

export async function validateGuiaCnpj(guiaCnpj: string, clienteId: number): Promise<{ valido: boolean; clienteCnpj: string; razaoSocial: string }> {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`SELECT cnpj, razaoSocial FROM clientes WHERE id = ${clienteId}`));
  const cliente = (rows as unknown as any[])[0];
  if (!cliente) return { valido: false, clienteCnpj: '', razaoSocial: '' };
  const normalize = (cnpj: string) => cnpj.replace(/[.\-\/]/g, '');
  const valido = normalize(guiaCnpj) === normalize(cliente.cnpj);
  return { valido, clienteCnpj: cliente.cnpj, razaoSocial: cliente.razaoSocial };
}

// ===== TAREFAS ATRASADAS =====
export async function listTarefasAtrasadas(fila?: string) {
  const db_ = (await getDb())!;
  const filaFilter = fila ? `AND ct.fila = '${fila}'` : '';
  const [rows] = await db_.execute(sql.raw(`
    SELECT ct.*, c.razaoSocial as clienteNome, c.cnpj as clienteCnpj
    FROM credit_tasks ct
    LEFT JOIN clientes c ON ct.clienteId = c.id
    WHERE ct.status IN ('a_fazer', 'fazendo')
    AND ct.prazo IS NOT NULL
    AND ct.prazo < NOW()
    ${filaFilter}
    ORDER BY ct.prazo ASC
  `));
  return rows as unknown as any[];
}

export async function countTarefasAtrasadas(fila?: string) {
  const db_ = (await getDb())!;
  const filaFilter = fila ? `AND fila = '${fila}'` : '';
  const [rows] = await db_.execute(sql.raw(`
    SELECT COUNT(*) as total FROM credit_tasks
    WHERE status IN ('a_fazer', 'fazendo')
    AND dataVencimento IS NOT NULL AND dataVencimento < NOW()
    ${filaFilter}
  `));
  return (rows as unknown as any[])[0]?.total || 0;
}


// ===== RELATÓRIOS EXPORTÁVEIS =====
export interface ReportFilters {
  periodoInicio?: string; // YYYY-MM-DD
  periodoFim?: string;
  teseId?: number;
  parceiroId?: number;
  classificacao?: string; // novo, base
  segmento?: string;
  fila?: string;
}

export async function getReportData(filters: ReportFilters) {
  const db_ = (await getDb())!;
  const conditions: string[] = [];

  if (filters.periodoInicio) conditions.push(`ct.createdAt >= '${filters.periodoInicio}'`);
  if (filters.periodoFim) conditions.push(`ct.createdAt <= '${filters.periodoFim} 23:59:59'`);
  if (filters.fila) conditions.push(`ct.fila = '${filters.fila}'`);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Tarefas com dados do cliente e case
  const [taskRows] = await db_.execute(sql.raw(`
    SELECT 
      ct.id, ct.codigo, ct.fila, ct.titulo, ct.status, ct.prioridade,
      ct.responsavelNome, ct.dataVencimento, ct.dataConclusao, ct.slaStatus,
      ct.createdAt, ct.updatedAt,
      c.razaoSocial as clienteNome, c.cnpj as clienteCnpj,
      c.segmentoEconomico as segmento, c.classificacaoCliente as classificacao,
      c.parceiroId,
      p.nomeFantasia as parceiroNome,
      cc.numero as caseNumero, cc.fase as caseFase, cc.valorEstimado, cc.valorContratado
    FROM credit_tasks ct
    LEFT JOIN clientes c ON ct.clienteId = c.id
    LEFT JOIN parceiros p ON c.parceiroId = p.id
    LEFT JOIN credit_cases cc ON ct.caseId = cc.id
    ${whereClause}
    ORDER BY ct.createdAt DESC
  `));

  let tasks = taskRows as unknown as any[];

  // Apply client-level filters
  if (filters.parceiroId) tasks = tasks.filter(t => t.parceiroId === filters.parceiroId);
  if (filters.classificacao) tasks = tasks.filter(t => t.classificacao === filters.classificacao);
  if (filters.segmento) tasks = tasks.filter(t => t.segmento === filters.segmento);

  // Tese filter via case tesesIds
  if (filters.teseId) {
    const [caseRows] = await db_.execute(sql.raw(`
      SELECT id, tesesIds FROM credit_cases WHERE tesesIds IS NOT NULL
    `));
    const casesWithTese = new Set(
      (caseRows as unknown as any[])
        .filter(c => {
          try {
            const ids = typeof c.tesesIds === 'string' ? JSON.parse(c.tesesIds) : c.tesesIds;
            return Array.isArray(ids) && ids.includes(filters.teseId);
          } catch { return false; }
        })
        .map(c => c.id)
    );
    tasks = tasks.filter(t => t.caseId && casesWithTese.has(t.caseId));
  }

  // Summary stats
  const totalTarefas = tasks.length;
  const porFila: Record<string, number> = {};
  const porStatus: Record<string, number> = {};
  const porPrioridade: Record<string, number> = {};
  const porParceiro: Record<string, number> = {};
  const porSegmento: Record<string, number> = {};
  const porClassificacao: Record<string, number> = {};
  let totalEstimado = 0;
  let totalContratado = 0;
  let totalEmAtraso = 0;

  for (const t of tasks) {
    porFila[t.fila] = (porFila[t.fila] || 0) + 1;
    porStatus[t.status] = (porStatus[t.status] || 0) + 1;
    porPrioridade[t.prioridade] = (porPrioridade[t.prioridade] || 0) + 1;
    if (t.parceiroNome) porParceiro[t.parceiroNome] = (porParceiro[t.parceiroNome] || 0) + 1;
    if (t.segmento) porSegmento[t.segmento] = (porSegmento[t.segmento] || 0) + 1;
    if (t.classificacao) porClassificacao[t.classificacao] = (porClassificacao[t.classificacao] || 0) + 1;
    totalEstimado += Number(t.valorEstimado || 0);
    totalContratado += Number(t.valorContratado || 0);
    if (t.slaStatus === 'vencido') totalEmAtraso++;
  }

  // Ledger summary
  const [ledgerRows] = await db_.execute(sql.raw(`
    SELECT 
      cl.teseNome, cl.grupoDebito, cl.status,
      SUM(COALESCE(cl.valorEstimado, 0)) as totalEstimado,
      SUM(COALESCE(cl.valorValidado, 0)) as totalValidado,
      SUM(COALESCE(cl.valorEfetivado, 0)) as totalEfetivado,
      SUM(COALESCE(cl.saldoResidual, 0)) as totalResidual,
      COUNT(*) as qtd
    FROM credit_ledger cl
    LEFT JOIN clientes c ON cl.clienteId = c.id
    ${filters.parceiroId ? `WHERE c.parceiroId = ${filters.parceiroId}` : ''}
    GROUP BY cl.teseNome, cl.grupoDebito, cl.status
    ORDER BY totalEstimado DESC
  `));

  return {
    tasks,
    summary: {
      totalTarefas,
      totalEmAtraso,
      totalEstimado,
      totalContratado,
      porFila,
      porStatus,
      porPrioridade,
      porParceiro,
      porSegmento,
      porClassificacao,
    },
    ledger: ledgerRows as unknown as any[],
  };
}

export async function getDistinctSegmentos() {
  const db_ = (await getDb())!;
  const [rows] = await db_.execute(sql.raw(`
    SELECT DISTINCT segmentoEconomico as segmento FROM clientes 
    WHERE segmentoEconomico IS NOT NULL AND segmentoEconomico != ''
    ORDER BY segmentoEconomico
  `));
  return (rows as unknown as any[]).map(r => r.segmento);
}


// ---- Overdue Tasks Notification ----
export async function getOverdueCreditTasks(): Promise<{
  overdueTasks: Array<{
    id: number;
    codigo: string;
    fila: string;
    titulo: string;
    status: string;
    responsavelNome: string | null;
    clienteNome: string | null;
    dataVencimento: string | null;
    slaHoras: number | null;
  }>;
  summary: {
    total: number;
    porFila: Record<string, number>;
    porResponsavel: Record<string, number>;
  };
}> {
  const db_ = (await getDb())!;
  const rows = await db_.execute(sql`
    SELECT ct.id, ct.codigo, ct.fila, ct.titulo, ct.status,
           ct.responsavelNome, ct.dataVencimento, ct.slaHoras,
           COALESCE(cl.razaoSocial, cl.nomeFantasia) as clienteNome
    FROM credit_tasks ct
    LEFT JOIN credit_cases cc ON ct.caseId = cc.id
    LEFT JOIN clientes cl ON cc.clienteId = cl.id
    WHERE ct.slaStatus = 'vencido'
      AND ct.status NOT IN ('feito', 'concluido')
    ORDER BY ct.dataVencimento ASC
  `);
  const tasks = (rows[0] as unknown as any[]) || [];
  const porFila: Record<string, number> = {};
  const porResponsavel: Record<string, number> = {};
  tasks.forEach((t: any) => {
    const f = t.fila || 'outros';
    porFila[f] = (porFila[f] || 0) + 1;
    const r = t.responsavelNome || 'Sem responsável';
    porResponsavel[r] = (porResponsavel[r] || 0) + 1;
  });
  return {
    overdueTasks: tasks.map((t: any) => ({
      id: t.id,
      codigo: t.codigo,
      fila: t.fila,
      titulo: t.titulo,
      status: t.status,
      responsavelNome: t.responsavelNome,
      clienteNome: t.clienteNome,
      dataVencimento: t.dataVencimento,
      slaHoras: t.slaHoras,
    })),
    summary: { total: tasks.length, porFila, porResponsavel },
  };
}

export async function updateOverdueSlaStatuses(): Promise<number> {
  const db_ = (await getDb())!;
  // Update tasks that have passed their SLA deadline but aren't marked as vencido yet
  const result = await db_.execute(sql`
    UPDATE credit_tasks
    SET slaStatus = 'vencido', updatedAt = NOW()
    WHERE status NOT IN ('feito', 'concluido')
      AND slaStatus != 'vencido'
      AND dataVencimento IS NOT NULL
      AND dataVencimento < NOW()
  `);
  // Also update tasks approaching deadline (within 24h) to 'atencao'
  await db_.execute(sql`
    UPDATE credit_tasks
    SET slaStatus = 'atencao', updatedAt = NOW()
    WHERE status NOT IN ('feito', 'concluido')
      AND slaStatus = 'dentro_prazo'
      AND dataVencimento IS NOT NULL
      AND dataVencimento BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
  `);
  return (result[0] as any)?.affectedRows || 0;
}


// ===== SLA APPROACHING NOTIFICATIONS =====
export async function getApproachingSLATasks(): Promise<{
  tasks48h: Array<{
    id: number; codigo: string; fila: string; titulo: string;
    responsavelNome: string | null; clienteNome: string | null;
    dataVencimento: string | null; horasRestantes: number;
  }>;
  tasks24h: Array<{
    id: number; codigo: string; fila: string; titulo: string;
    responsavelNome: string | null; clienteNome: string | null;
    dataVencimento: string | null; horasRestantes: number;
  }>;
}> {
  const db_ = (await getDb())!;

  // Tasks approaching in 24-48h
  const [rows48h] = await db_.execute(sql`
    SELECT ct.id, ct.codigo, ct.fila, ct.titulo,
           ct.responsavelNome, ct.dataVencimento,
           COALESCE(cl.razaoSocial, cl.nomeFantasia) as clienteNome,
           TIMESTAMPDIFF(HOUR, NOW(), ct.dataVencimento) as horasRestantes
    FROM credit_tasks ct
    LEFT JOIN credit_cases cc ON ct.caseId = cc.id
    LEFT JOIN clientes cl ON cc.clienteId = cl.id
    WHERE ct.status NOT IN ('feito', 'concluido')
      AND ct.slaStatus = 'dentro_prazo'
      AND ct.dataVencimento IS NOT NULL
      AND ct.dataVencimento BETWEEN DATE_ADD(NOW(), INTERVAL 24 HOUR) AND DATE_ADD(NOW(), INTERVAL 48 HOUR)
    ORDER BY ct.dataVencimento ASC
  `);

  // Tasks approaching in <24h (urgent)
  const [rows24h] = await db_.execute(sql`
    SELECT ct.id, ct.codigo, ct.fila, ct.titulo,
           ct.responsavelNome, ct.dataVencimento,
           COALESCE(cl.razaoSocial, cl.nomeFantasia) as clienteNome,
           TIMESTAMPDIFF(HOUR, NOW(), ct.dataVencimento) as horasRestantes
    FROM credit_tasks ct
    LEFT JOIN credit_cases cc ON ct.caseId = cc.id
    LEFT JOIN clientes cl ON cc.clienteId = cl.id
    WHERE ct.status NOT IN ('feito', 'concluido')
      AND ct.dataVencimento IS NOT NULL
      AND ct.dataVencimento BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
    ORDER BY ct.dataVencimento ASC
  `);

  return {
    tasks48h: (rows48h as unknown as any[]).map((t: any) => ({
      id: t.id, codigo: t.codigo, fila: t.fila, titulo: t.titulo,
      responsavelNome: t.responsavelNome, clienteNome: t.clienteNome,
      dataVencimento: t.dataVencimento, horasRestantes: t.horasRestantes || 0,
    })),
    tasks24h: (rows24h as unknown as any[]).map((t: any) => ({
      id: t.id, codigo: t.codigo, fila: t.fila, titulo: t.titulo,
      responsavelNome: t.responsavelNome, clienteNome: t.clienteNome,
      dataVencimento: t.dataVencimento, horasRestantes: t.horasRestantes || 0,
    })),
  };
}
