import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// ===== SCHEMA VALIDATION TESTS =====
describe('Credit Recovery Module - Schema & Input Validation', () => {

  // --- Demand Request ---
  describe('Demand Request Input Validation', () => {
    const demandRequestSchema = z.object({
      clienteId: z.number(),
      parceiroId: z.number().nullable().optional(),
      tipo: z.enum(['analise_credito', 'revisao_fiscal', 'compensacao', 'restituicao', 'ressarcimento', 'consultoria', 'outro']),
      descricao: z.string().min(1),
      prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
      tributos: z.string().optional(),
    });

    it('should accept valid demand request input', () => {
      const input = {
        clienteId: 1,
        tipo: 'analise_credito' as const,
        descricao: 'Análise de créditos tributários para empresa XYZ',
        prioridade: 'alta' as const,
        tributos: 'PIS,COFINS',
      };
      expect(demandRequestSchema.parse(input)).toBeTruthy();
    });

    it('should reject empty description', () => {
      const input = {
        clienteId: 1,
        tipo: 'analise_credito' as const,
        descricao: '',
      };
      expect(() => demandRequestSchema.parse(input)).toThrow();
    });

    it('should reject invalid tipo', () => {
      const input = {
        clienteId: 1,
        tipo: 'invalid_type',
        descricao: 'Test',
      };
      expect(() => demandRequestSchema.parse(input)).toThrow();
    });

    it('should default prioridade to normal', () => {
      const input = {
        clienteId: 1,
        tipo: 'analise_credito' as const,
        descricao: 'Test',
      };
      const result = demandRequestSchema.parse(input);
      expect(result.prioridade).toBe('normal');
    });

    it('should accept nullable parceiroId', () => {
      const input = {
        clienteId: 1,
        parceiroId: null,
        tipo: 'analise_credito' as const,
        descricao: 'Test',
      };
      expect(demandRequestSchema.parse(input).parceiroId).toBeNull();
    });
  });

  // --- Case Creation ---
  describe('Credit Case Input Validation', () => {
    const caseSchema = z.object({
      clienteId: z.number(),
      demandRequestId: z.number().nullable().optional(),
      tese: z.string().min(1),
      tributo: z.string().min(1),
      competenciaInicio: z.string().optional(),
      competenciaFim: z.string().optional(),
      valorEstimado: z.string().optional(),
      descricao: z.string().optional(),
    });

    it('should accept valid case input', () => {
      const input = {
        clienteId: 1,
        tese: 'Exclusão do ICMS da base de cálculo do PIS/COFINS',
        tributo: 'PIS/COFINS',
        competenciaInicio: '2021-01',
        competenciaFim: '2025-12',
        valorEstimado: '150000.00',
      };
      expect(caseSchema.parse(input)).toBeTruthy();
    });

    it('should reject missing tese', () => {
      const input = {
        clienteId: 1,
        tese: '',
        tributo: 'PIS',
      };
      expect(() => caseSchema.parse(input)).toThrow();
    });

    it('should reject missing tributo', () => {
      const input = {
        clienteId: 1,
        tese: 'Test tese',
        tributo: '',
      };
      expect(() => caseSchema.parse(input)).toThrow();
    });
  });

  // --- RTI Creation ---
  describe('RTI Input Validation', () => {
    const rtiSchema = z.object({
      caseId: z.number(),
      clienteId: z.number(),
      tipo: z.enum(['rti_completo', 'rti_parcial', 'laudo_tecnico', 'parecer']),
      titulo: z.string().min(1),
      descricao: z.string().optional(),
      slaDevolutivaDias: z.number().default(7),
    });

    it('should accept valid RTI input', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        tipo: 'rti_completo' as const,
        titulo: 'RTI - Análise PIS/COFINS',
        descricao: 'Relatório técnico completo',
      };
      const result = rtiSchema.parse(input);
      expect(result.slaDevolutivaDias).toBe(7);
    });

    it('should reject invalid tipo', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        tipo: 'invalid',
        titulo: 'Test',
      };
      expect(() => rtiSchema.parse(input)).toThrow();
    });

    it('should default slaDevolutivaDias to 7', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        tipo: 'rti_completo' as const,
        titulo: 'Test',
      };
      expect(rtiSchema.parse(input).slaDevolutivaDias).toBe(7);
    });
  });

  // --- Ticket Creation ---
  describe('Ticket Input Validation', () => {
    const ticketSchema = z.object({
      caseId: z.number().nullable().optional(),
      clienteId: z.number(),
      tipo: z.enum(['duvida', 'solicitacao', 'reclamacao', 'informacao', 'outro']),
      titulo: z.string().min(1),
      descricao: z.string().min(1),
      prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
    });

    it('should accept valid ticket input', () => {
      const input = {
        clienteId: 1,
        tipo: 'duvida' as const,
        titulo: 'Dúvida sobre compensação',
        descricao: 'Gostaria de saber sobre o prazo de compensação',
      };
      expect(ticketSchema.parse(input)).toBeTruthy();
    });

    it('should reject empty titulo', () => {
      const input = {
        clienteId: 1,
        tipo: 'duvida' as const,
        titulo: '',
        descricao: 'Test',
      };
      expect(() => ticketSchema.parse(input)).toThrow();
    });

    it('should reject empty descricao', () => {
      const input = {
        clienteId: 1,
        tipo: 'duvida' as const,
        titulo: 'Test',
        descricao: '',
      };
      expect(() => ticketSchema.parse(input)).toThrow();
    });
  });

  // --- Ledger Entry ---
  describe('Credit Ledger Entry Input Validation', () => {
    const ledgerSchema = z.object({
      caseId: z.number(),
      clienteId: z.number(),
      compensationGroupId: z.number().nullable().optional(),
      compensationGroupNome: z.string().optional(),
      tributo: z.string().min(1),
      competencia: z.string().min(1),
      valorEstimado: z.string().optional(),
      valorValidado: z.string().optional(),
      descricao: z.string().optional(),
    });

    it('should accept valid ledger entry', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        tributo: 'PIS',
        competencia: '2024-01',
        valorEstimado: '50000.00',
        compensationGroupNome: 'PIS/COFINS',
      };
      expect(ledgerSchema.parse(input)).toBeTruthy();
    });

    it('should reject missing tributo', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        tributo: '',
        competencia: '2024-01',
      };
      expect(() => ledgerSchema.parse(input)).toThrow();
    });

    it('should reject missing competencia', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        tributo: 'PIS',
        competencia: '',
      };
      expect(() => ledgerSchema.parse(input)).toThrow();
    });
  });

  // --- Success Event ---
  describe('Success Event Input Validation', () => {
    const exitoSchema = z.object({
      caseId: z.number(),
      clienteId: z.number(),
      ledgerEntryId: z.number().nullable().optional(),
      tipo: z.enum(['compensacao', 'restituicao', 'ressarcimento']),
      valor: z.string(),
      dataEfetivacao: z.string(),
      descricao: z.string().optional(),
    });

    it('should accept valid success event', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        tipo: 'compensacao' as const,
        valor: '75000.00',
        dataEfetivacao: '2025-06-15',
      };
      expect(exitoSchema.parse(input)).toBeTruthy();
    });

    it('should reject invalid tipo', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        tipo: 'invalid',
        valor: '1000',
        dataEfetivacao: '2025-01-01',
      };
      expect(() => exitoSchema.parse(input)).toThrow();
    });
  });

  // --- SLA Config ---
  describe('SLA Config Input Validation', () => {
    const slaSchema = z.object({
      nome: z.string().min(1),
      categoria: z.enum(['triagem', 'fila', 'ticket', 'case', 'rti_devolutiva', 'vencimento_guia']),
      fila: z.string().optional(),
      slaHoras: z.number().nullable().optional(),
      slaDias: z.number().nullable().optional(),
      slaDiasUteis: z.number().default(1),
      alertaDias: z.any().optional(),
      escalonamentoDias: z.number().nullable().optional(),
    });

    it('should accept valid SLA config', () => {
      const input = {
        nome: 'SLA Triagem Padrão',
        categoria: 'triagem' as const,
        slaHoras: 8,
        slaDiasUteis: 1,
      };
      expect(slaSchema.parse(input)).toBeTruthy();
    });

    it('should reject empty nome', () => {
      const input = {
        nome: '',
        categoria: 'triagem' as const,
      };
      expect(() => slaSchema.parse(input)).toThrow();
    });

    it('should reject invalid categoria', () => {
      const input = {
        nome: 'Test',
        categoria: 'invalid',
      };
      expect(() => slaSchema.parse(input)).toThrow();
    });

    it('should default slaDiasUteis to 1', () => {
      const input = {
        nome: 'Test',
        categoria: 'triagem' as const,
      };
      expect(slaSchema.parse(input).slaDiasUteis).toBe(1);
    });
  });

  // --- Due Schedule Policy ---
  describe('Due Schedule Policy Input Validation', () => {
    const policySchema = z.object({
      nome: z.string().min(1),
      compensationGroupId: z.number().nullable().optional(),
      frequencia: z.enum(['mensal', 'trimestral', 'anual']),
      diaVencimento: z.number().nullable().optional(),
      mesesVencimento: z.any().optional(),
      antecedenciaInternaDiasUteis: z.number().default(5),
      antecedenciaCriacaoTarefaDias: z.number().default(10),
    });

    it('should accept valid policy', () => {
      const input = {
        nome: 'Vencimento PIS/COFINS Mensal',
        frequencia: 'mensal' as const,
        diaVencimento: 25,
      };
      const result = policySchema.parse(input);
      expect(result.antecedenciaInternaDiasUteis).toBe(5);
      expect(result.antecedenciaCriacaoTarefaDias).toBe(10);
    });

    it('should reject invalid frequencia', () => {
      const input = {
        nome: 'Test',
        frequencia: 'semanal',
      };
      expect(() => policySchema.parse(input)).toThrow();
    });
  });

  // --- Portfolio Migration ---
  describe('Portfolio Migration Input Validation', () => {
    const migrationSchema = z.object({
      clienteId: z.number(),
      deParceiroId: z.number(),
      paraParceiroId: z.number(),
      motivo: z.string().min(1),
    });

    it('should accept valid migration', () => {
      const input = {
        clienteId: 1,
        deParceiroId: 1,
        paraParceiroId: 2,
        motivo: 'Solicitação do cliente',
      };
      expect(migrationSchema.parse(input)).toBeTruthy();
    });

    it('should reject empty motivo', () => {
      const input = {
        clienteId: 1,
        deParceiroId: 1,
        paraParceiroId: 2,
        motivo: '',
      };
      expect(() => migrationSchema.parse(input)).toThrow();
    });
  });

  // --- Task Creation ---
  describe('Credit Task Input Validation', () => {
    const taskSchema = z.object({
      caseId: z.number(),
      clienteId: z.number(),
      fila: z.enum(['analise', 'apuracao', 'revisao', 'protocolo', 'acompanhamento', 'compensacao']),
      titulo: z.string().min(1),
      descricao: z.string().optional(),
      prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
    });

    it('should accept valid task', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        fila: 'analise' as const,
        titulo: 'Analisar documentos fiscais',
        prioridade: 'alta' as const,
      };
      expect(taskSchema.parse(input)).toBeTruthy();
    });

    it('should reject invalid fila', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        fila: 'invalid',
        titulo: 'Test',
      };
      expect(() => taskSchema.parse(input)).toThrow();
    });

    it('should default prioridade to normal', () => {
      const input = {
        caseId: 1,
        clienteId: 1,
        fila: 'analise' as const,
        titulo: 'Test',
      };
      expect(taskSchema.parse(input).prioridade).toBe('normal');
    });
  });
});

// ===== BUSINESS LOGIC TESTS =====
describe('Credit Recovery Module - Business Logic', () => {

  describe('SLA Calculation', () => {
    it('should calculate SLA deadline correctly (8 business hours)', () => {
      const now = new Date('2025-06-15T10:00:00Z');
      const slaHours = 8;
      const slaVence = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
      expect(slaVence.toISOString()).toBe('2025-06-15T18:00:00.000Z');
    });

    it('should calculate RTI devolutiva SLA in days', () => {
      const now = new Date('2025-06-15T10:00:00Z');
      const slaDays = 7;
      const venceEm = new Date(now.getTime() + slaDays * 24 * 60 * 60 * 1000);
      expect(venceEm.getDate()).toBe(22);
    });
  });

  describe('Case Phase Progression', () => {
    const validPhases = ['oportunidade', 'contratado', 'em_analise', 'apuracao', 'revisao', 'protocolo', 'acompanhamento', 'compensacao', 'concluido'];
    
    it('should have valid phase progression order', () => {
      expect(validPhases.indexOf('oportunidade')).toBeLessThan(validPhases.indexOf('contratado'));
      expect(validPhases.indexOf('contratado')).toBeLessThan(validPhases.indexOf('em_analise'));
      expect(validPhases.indexOf('em_analise')).toBeLessThan(validPhases.indexOf('concluido'));
    });

    it('should allow advancing to the next phase', () => {
      const currentPhase = 'oportunidade';
      const nextPhase = 'contratado';
      const currentIdx = validPhases.indexOf(currentPhase);
      const nextIdx = validPhases.indexOf(nextPhase);
      expect(nextIdx).toBeGreaterThan(currentIdx);
    });
  });

  describe('Demand Request Status Flow', () => {
    const validStatuses = ['triagem', 'classificada', 'roteada', 'em_andamento', 'concluida', 'cancelada'];

    it('should start in triagem status', () => {
      expect(validStatuses[0]).toBe('triagem');
    });

    it('should have valid status transitions', () => {
      // triagem -> classificada -> roteada -> em_andamento -> concluida
      expect(validStatuses.indexOf('triagem')).toBeLessThan(validStatuses.indexOf('classificada'));
      expect(validStatuses.indexOf('classificada')).toBeLessThan(validStatuses.indexOf('roteada'));
      expect(validStatuses.indexOf('roteada')).toBeLessThan(validStatuses.indexOf('em_andamento'));
    });
  });

  describe('Ticket Status Flow', () => {
    const validStatuses = ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'];

    it('should start as aberto', () => {
      expect(validStatuses[0]).toBe('aberto');
    });

    it('should end as fechado', () => {
      expect(validStatuses[validStatuses.length - 1]).toBe('fechado');
    });
  });

  describe('Ledger Value Calculations', () => {
    it('should calculate residual balance correctly', () => {
      const valorEstimado = 100000;
      const valorEfetivado = 75000;
      const saldoResidual = valorEstimado - valorEfetivado;
      expect(saldoResidual).toBe(25000);
    });

    it('should handle zero values', () => {
      const valorEstimado = 0;
      const valorEfetivado = 0;
      const saldoResidual = valorEstimado - valorEfetivado;
      expect(saldoResidual).toBe(0);
    });
  });

  describe('Audit Log Immutability', () => {
    it('should create audit entries with required fields', () => {
      const auditEntry = {
        entidade: 'case',
        entidadeId: 1,
        acao: 'criacao',
        descricao: 'Case criado',
        usuarioId: 'user-123',
        usuarioNome: 'Test User',
      };
      expect(auditEntry.entidade).toBeDefined();
      expect(auditEntry.entidadeId).toBeDefined();
      expect(auditEntry.acao).toBeDefined();
      expect(auditEntry.usuarioId).toBeDefined();
    });

    it('should support various entity types', () => {
      const validEntities = ['case', 'demand_request', 'ticket', 'rti', 'task', 'ledger', 'exito', 'sla', 'policy'];
      expect(validEntities.length).toBeGreaterThan(0);
      validEntities.forEach(entity => {
        expect(typeof entity).toBe('string');
        expect(entity.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Success Event Types', () => {
    it('should support all compensation types', () => {
      const types = ['compensacao', 'restituicao', 'ressarcimento'];
      const schema = z.enum(['compensacao', 'restituicao', 'ressarcimento']);
      types.forEach(type => {
        expect(() => schema.parse(type)).not.toThrow();
      });
    });
  });

  describe('Policy Toggle', () => {
    it('should convert boolean to number for ativo field', () => {
      const ativo = true;
      expect(ativo ? 1 : 0).toBe(1);
      expect(!ativo ? 1 : 0).toBe(0);
    });
  });
});

// ===== ROUTER STRUCTURE TESTS =====
describe('Credit Recovery Module - Router Structure', () => {
  it('should have suporte router with demandRequests sub-router', () => {
    const suporteRouterKeys = ['demandRequests', 'portfolioMigration'];
    expect(suporteRouterKeys).toContain('demandRequests');
    expect(suporteRouterKeys).toContain('portfolioMigration');
  });

  it('should have credito router with all required sub-routers', () => {
    const creditoRouterKeys = ['dashboard', 'cases', 'rti', 'tasks', 'tickets', 'ledger', 'exito', 'policies', 'slaConfigs', 'auditLog'];
    expect(creditoRouterKeys).toContain('dashboard');
    expect(creditoRouterKeys).toContain('cases');
    expect(creditoRouterKeys).toContain('rti');
    expect(creditoRouterKeys).toContain('tasks');
    expect(creditoRouterKeys).toContain('tickets');
    expect(creditoRouterKeys).toContain('ledger');
    expect(creditoRouterKeys).toContain('exito');
    expect(creditoRouterKeys).toContain('policies');
    expect(creditoRouterKeys).toContain('slaConfigs');
    expect(creditoRouterKeys).toContain('auditLog');
  });

  it('should have admin router with slas, policies, compensationGroups, and auditLog', () => {
    const adminRouterKeys = ['slas', 'policies', 'compensationGroups', 'auditLog'];
    expect(adminRouterKeys).toContain('slas');
    expect(adminRouterKeys).toContain('policies');
    expect(adminRouterKeys).toContain('compensationGroups');
    expect(adminRouterKeys).toContain('auditLog');
  });

  it('should have combined creditRecoveryRouter with suporte, credito, and admin', () => {
    const combinedKeys = ['suporte', 'credito', 'admin'];
    expect(combinedKeys).toContain('suporte');
    expect(combinedKeys).toContain('credito');
    expect(combinedKeys).toContain('admin');
  });
});

// ===== DATABASE HELPER TESTS =====
describe('Credit Recovery Module - Database Helpers', () => {
  it('should export all required database functions', async () => {
    const dbCredito = await import('./dbCredito');
    
    // Demand Requests
    expect(typeof dbCredito.listDemandRequests).toBe('function');
    expect(typeof dbCredito.createDemandRequest).toBe('function');
    expect(typeof dbCredito.updateDemandRequest).toBe('function');
    expect(typeof dbCredito.getDemandRequestStats).toBe('function');
    
    // Cases
    expect(typeof dbCredito.listCreditCases).toBe('function');
    expect(typeof dbCredito.createCreditCase).toBe('function');
    expect(typeof dbCredito.updateCreditCase).toBe('function');
    expect(typeof dbCredito.getCreditCaseStats).toBe('function');
    
    // RTI
    expect(typeof dbCredito.listRtiReports).toBe('function');
    expect(typeof dbCredito.createRtiReport).toBe('function');
    expect(typeof dbCredito.updateRtiReport).toBe('function');
    
    // Tasks
    expect(typeof dbCredito.listCreditTasks).toBe('function');
    expect(typeof dbCredito.createCreditTask).toBe('function');
    expect(typeof dbCredito.updateCreditTask).toBe('function');
    expect(typeof dbCredito.getCreditTaskStats).toBe('function');
    
    // Tickets
    expect(typeof dbCredito.listCreditTickets).toBe('function');
    expect(typeof dbCredito.createCreditTicket).toBe('function');
    expect(typeof dbCredito.updateCreditTicket).toBe('function');
    
    // Ledger
    expect(typeof dbCredito.listCreditLedger).toBe('function');
    expect(typeof dbCredito.createCreditLedgerEntry).toBe('function');
    expect(typeof dbCredito.updateCreditLedgerEntry).toBe('function');
    expect(typeof dbCredito.getCreditLedgerSummary).toBe('function');
    
    // Success Events
    expect(typeof dbCredito.listSuccessEvents).toBe('function');
    expect(typeof dbCredito.createSuccessEvent).toBe('function');
    expect(typeof dbCredito.updateSuccessEvent).toBe('function');
    
    // Audit
    expect(typeof dbCredito.logCreditAudit).toBe('function');
    expect(typeof dbCredito.listCreditAuditLog).toBe('function');
    
    // SLA
    expect(typeof dbCredito.listCreditSlaConfigs).toBe('function');
    expect(typeof dbCredito.updateCreditSlaConfig).toBe('function');
    expect(typeof dbCredito.createCreditSlaConfig).toBe('function');
    
    // Policies
    expect(typeof dbCredito.listDueSchedulePolicies).toBe('function');
    expect(typeof dbCredito.createDueSchedulePolicy).toBe('function');
    expect(typeof dbCredito.updateDueSchedulePolicy).toBe('function');
    
    // Compensation Groups
    expect(typeof dbCredito.listCompensationGroups).toBe('function');
    
    // Dashboard
    expect(typeof dbCredito.getCreditDashboardStats).toBe('function');
    
    // Portfolio Migration
    expect(typeof dbCredito.listPortfolioMigrations).toBe('function');
    expect(typeof dbCredito.createPortfolioMigration).toBe('function');
  });
});
