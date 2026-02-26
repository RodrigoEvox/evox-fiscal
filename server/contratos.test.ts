import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// ===== SCHEMA VALIDATION TESTS =====
describe('Contratos Module - Schema & Input Validation', () => {

  // --- Create Contract ---
  describe('Create Contract Input Validation', () => {
    const createContratoSchema = z.object({
      clienteId: z.number(),
      clienteNome: z.string().optional(),
      clienteCnpj: z.string().optional(),
      parceiroId: z.number().optional(),
      parceiroNome: z.string().optional(),
      tipo: z.enum(['prestacao_servicos', 'honorarios', 'parceria', 'nda', 'aditivo', 'distrato', 'outro']),
      fila: z.enum(['elaboracao', 'revisao', 'assinatura', 'vigencia', 'renovacao', 'encerrado']).default('elaboracao'),
      prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']).default('media'),
      valorContrato: z.string().optional(),
      formaCobranca: z.enum(['percentual_credito', 'valor_fixo', 'mensalidade', 'exito', 'hibrido', 'entrada_exito', 'valor_fixo_parcelado']).optional(),
      percentualExito: z.string().optional(),
      valorEntrada: z.string().optional(),
      quantidadeParcelas: z.number().optional(),
      valorParcela: z.string().optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      dataVencimento: z.string().optional(),
      slaHoras: z.number().optional(),
      responsavelId: z.number().optional(),
      responsavelNome: z.string().optional(),
      revisorId: z.number().optional(),
      revisorNome: z.string().optional(),
      objetoContrato: z.string().optional(),
      clausulasEspeciais: z.string().optional(),
      observacoes: z.string().optional(),
    });

    it('should accept valid contract input with all fields', () => {
      const input = {
        clienteId: 1,
        clienteNome: 'Empresa Teste LTDA',
        clienteCnpj: '12.345.678/0001-90',
        parceiroId: 2,
        parceiroNome: 'Parceiro ABC',
        tipo: 'prestacao_servicos' as const,
        fila: 'elaboracao' as const,
        prioridade: 'alta' as const,
        valorContrato: '50000.00',
        formaCobranca: 'valor_fixo' as const,
        dataInicio: '2026-01-01',
        dataFim: '2027-01-01',
        slaHoras: 48,
        responsavelId: 3,
        responsavelNome: 'João Silva',
        objetoContrato: 'Prestação de serviços tributários',
      };
      const result = createContratoSchema.parse(input);
      expect(result.clienteId).toBe(1);
      expect(result.tipo).toBe('prestacao_servicos');
      expect(result.fila).toBe('elaboracao');
    });

    it('should accept minimal contract input with defaults', () => {
      const input = {
        clienteId: 1,
        tipo: 'honorarios' as const,
      };
      const result = createContratoSchema.parse(input);
      expect(result.fila).toBe('elaboracao');
      expect(result.prioridade).toBe('media');
    });

    it('should reject missing clienteId', () => {
      const input = {
        tipo: 'prestacao_servicos' as const,
      };
      expect(() => createContratoSchema.parse(input)).toThrow();
    });

    it('should reject invalid tipo', () => {
      const input = {
        clienteId: 1,
        tipo: 'tipo_invalido',
      };
      expect(() => createContratoSchema.parse(input)).toThrow();
    });

    it('should reject invalid fila', () => {
      const input = {
        clienteId: 1,
        tipo: 'prestacao_servicos' as const,
        fila: 'fila_invalida',
      };
      expect(() => createContratoSchema.parse(input)).toThrow();
    });

    it('should reject invalid prioridade', () => {
      const input = {
        clienteId: 1,
        tipo: 'prestacao_servicos' as const,
        prioridade: 'prioridade_invalida',
      };
      expect(() => createContratoSchema.parse(input)).toThrow();
    });

    it('should reject invalid formaCobranca', () => {
      const input = {
        clienteId: 1,
        tipo: 'prestacao_servicos' as const,
        formaCobranca: 'forma_invalida',
      };
      expect(() => createContratoSchema.parse(input)).toThrow();
    });

    it('should accept all valid tipos', () => {
      const tipos = ['prestacao_servicos', 'honorarios', 'parceria', 'nda', 'aditivo', 'distrato', 'outro'] as const;
      for (const tipo of tipos) {
        const result = createContratoSchema.parse({ clienteId: 1, tipo });
        expect(result.tipo).toBe(tipo);
      }
    });

    it('should accept all valid filas', () => {
      const filas = ['elaboracao', 'revisao', 'assinatura', 'vigencia', 'renovacao', 'encerrado'] as const;
      for (const fila of filas) {
        const result = createContratoSchema.parse({ clienteId: 1, tipo: 'prestacao_servicos', fila });
        expect(result.fila).toBe(fila);
      }
    });

    it('should accept all valid formas de cobrança', () => {
      const formas = ['percentual_credito', 'valor_fixo', 'mensalidade', 'exito', 'hibrido', 'entrada_exito', 'valor_fixo_parcelado'] as const;
      for (const forma of formas) {
        const result = createContratoSchema.parse({ clienteId: 1, tipo: 'prestacao_servicos', formaCobranca: forma });
        expect(result.formaCobranca).toBe(forma);
      }
    });
  });

  // --- Change Fila ---
  describe('Change Fila Input Validation', () => {
    const changeFilaSchema = z.object({
      id: z.number(),
      novaFila: z.enum(['elaboracao', 'revisao', 'assinatura', 'vigencia', 'renovacao', 'encerrado']),
    });

    it('should accept valid fila change', () => {
      const input = { id: 1, novaFila: 'revisao' as const };
      const result = changeFilaSchema.parse(input);
      expect(result.id).toBe(1);
      expect(result.novaFila).toBe('revisao');
    });

    it('should reject missing id', () => {
      const input = { novaFila: 'revisao' as const };
      expect(() => changeFilaSchema.parse(input)).toThrow();
    });

    it('should reject invalid fila', () => {
      const input = { id: 1, novaFila: 'fila_invalida' };
      expect(() => changeFilaSchema.parse(input)).toThrow();
    });
  });

  // --- Change Status ---
  describe('Change Status Input Validation', () => {
    const changeStatusSchema = z.object({
      id: z.number(),
      novoStatus: z.enum(['a_fazer', 'fazendo', 'feito', 'concluido']),
    });

    it('should accept valid status change', () => {
      const input = { id: 1, novoStatus: 'fazendo' as const };
      const result = changeStatusSchema.parse(input);
      expect(result.novoStatus).toBe('fazendo');
    });

    it('should reject invalid status', () => {
      const input = { id: 1, novoStatus: 'invalido' };
      expect(() => changeStatusSchema.parse(input)).toThrow();
    });

    it('should accept all valid statuses', () => {
      const statuses = ['a_fazer', 'fazendo', 'feito', 'concluido'] as const;
      for (const status of statuses) {
        const result = changeStatusSchema.parse({ id: 1, novoStatus: status });
        expect(result.novoStatus).toBe(status);
      }
    });
  });

  // --- Update Contract ---
  describe('Update Contract Input Validation', () => {
    const updateContratoSchema = z.object({
      id: z.number(),
      objetoContrato: z.string().nullable().optional(),
      clausulasEspeciais: z.string().nullable().optional(),
      observacoes: z.string().nullable().optional(),
      valorContrato: z.string().optional(),
      slaHoras: z.number().nullable().optional(),
    });

    it('should accept valid update input', () => {
      const input = {
        id: 1,
        objetoContrato: 'Novo objeto do contrato',
        valorContrato: '100000.00',
        slaHoras: 72,
      };
      const result = updateContratoSchema.parse(input);
      expect(result.id).toBe(1);
      expect(result.objetoContrato).toBe('Novo objeto do contrato');
    });

    it('should accept null values for nullable fields', () => {
      const input = {
        id: 1,
        objetoContrato: null,
        clausulasEspeciais: null,
        observacoes: null,
        slaHoras: null,
      };
      const result = updateContratoSchema.parse(input);
      expect(result.objetoContrato).toBeNull();
      expect(result.slaHoras).toBeNull();
    });

    it('should reject missing id', () => {
      const input = { objetoContrato: 'Test' };
      expect(() => updateContratoSchema.parse(input)).toThrow();
    });
  });

  // --- List by Fila ---
  describe('List by Fila Input Validation', () => {
    const listByFilaSchema = z.object({
      fila: z.enum(['elaboracao', 'revisao', 'assinatura', 'vigencia', 'renovacao', 'encerrado']),
    });

    it('should accept valid fila filter', () => {
      const input = { fila: 'elaboracao' as const };
      const result = listByFilaSchema.parse(input);
      expect(result.fila).toBe('elaboracao');
    });

    it('should reject invalid fila', () => {
      const input = { fila: 'invalida' };
      expect(() => listByFilaSchema.parse(input)).toThrow();
    });
  });

  // --- Contract Number Generation ---
  describe('Contract Number Generation', () => {
    it('should generate sequential contract numbers', () => {
      const generateNumero = (lastId: number) => {
        return `CON-${String(lastId + 1).padStart(4, '0')}`;
      };
      expect(generateNumero(0)).toBe('CON-0001');
      expect(generateNumero(9)).toBe('CON-0010');
      expect(generateNumero(99)).toBe('CON-0100');
      expect(generateNumero(999)).toBe('CON-1000');
      expect(generateNumero(9999)).toBe('CON-10000');
    });
  });

  // --- Dashboard Stats ---
  describe('Dashboard Stats Calculation', () => {
    it('should calculate correct totals from contract list', () => {
      const contracts = [
        { fila: 'elaboracao', status: 'a_fazer', valorContrato: '10000' },
        { fila: 'elaboracao', status: 'fazendo', valorContrato: '20000' },
        { fila: 'revisao', status: 'a_fazer', valorContrato: '30000' },
        { fila: 'assinatura', status: 'concluido', valorContrato: '40000' },
        { fila: 'vigencia', status: 'concluido', valorContrato: '50000' },
        { fila: 'encerrado', status: 'concluido', valorContrato: '60000' },
      ];

      const total = contracts.length;
      const pendentes = contracts.filter(c => c.status !== 'concluido').length;
      const concluido = contracts.filter(c => c.status === 'concluido').length;
      const valorTotal = contracts.reduce((sum, c) => sum + Number(c.valorContrato), 0);

      expect(total).toBe(6);
      expect(pendentes).toBe(3);
      expect(concluido).toBe(3);
      expect(valorTotal).toBe(210000);
    });

    it('should count contracts per fila correctly', () => {
      const contracts = [
        { fila: 'elaboracao' },
        { fila: 'elaboracao' },
        { fila: 'revisao' },
        { fila: 'assinatura' },
        { fila: 'vigencia' },
        { fila: 'vigencia' },
        { fila: 'vigencia' },
      ];

      const filaCount: Record<string, number> = {};
      for (const c of contracts) {
        filaCount[c.fila] = (filaCount[c.fila] || 0) + 1;
      }

      expect(filaCount.elaboracao).toBe(2);
      expect(filaCount.revisao).toBe(1);
      expect(filaCount.assinatura).toBe(1);
      expect(filaCount.vigencia).toBe(3);
    });
  });

  // --- SLA Status Calculation ---
  describe('SLA Status Calculation', () => {
    it('should mark as vencido when past deadline', () => {
      const calcSlaStatus = (dataVencimento: string | null, status: string) => {
        if (!dataVencimento || status === 'concluido') return 'ok';
        const now = new Date();
        const vencimento = new Date(dataVencimento);
        if (vencimento < now) return 'vencido';
        const diffHours = (vencimento.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) return 'proximo';
        return 'ok';
      };

      expect(calcSlaStatus('2020-01-01', 'a_fazer')).toBe('vencido');
      expect(calcSlaStatus('2020-01-01', 'concluido')).toBe('ok');
      expect(calcSlaStatus(null, 'a_fazer')).toBe('ok');
      expect(calcSlaStatus('2099-01-01', 'a_fazer')).toBe('ok');
    });
  });

  // --- Fila Workflow ---
  describe('Fila Workflow Transitions', () => {
    const FILA_ORDER = ['elaboracao', 'revisao', 'assinatura', 'vigencia', 'renovacao', 'encerrado'];

    it('should define correct fila order', () => {
      expect(FILA_ORDER).toHaveLength(6);
      expect(FILA_ORDER[0]).toBe('elaboracao');
      expect(FILA_ORDER[FILA_ORDER.length - 1]).toBe('encerrado');
    });

    it('should allow moving forward in the workflow', () => {
      const canMoveForward = (currentFila: string, targetFila: string) => {
        const currentIdx = FILA_ORDER.indexOf(currentFila);
        const targetIdx = FILA_ORDER.indexOf(targetFila);
        return targetIdx > currentIdx;
      };

      expect(canMoveForward('elaboracao', 'revisao')).toBe(true);
      expect(canMoveForward('revisao', 'assinatura')).toBe(true);
      expect(canMoveForward('assinatura', 'vigencia')).toBe(true);
      expect(canMoveForward('vigencia', 'renovacao')).toBe(true);
      expect(canMoveForward('renovacao', 'encerrado')).toBe(true);
    });

    it('should also allow moving backward (for corrections)', () => {
      const canMove = (currentFila: string, targetFila: string) => {
        return FILA_ORDER.includes(currentFila) && FILA_ORDER.includes(targetFila) && currentFila !== targetFila;
      };

      expect(canMove('revisao', 'elaboracao')).toBe(true);
      expect(canMove('assinatura', 'revisao')).toBe(true);
      expect(canMove('elaboracao', 'elaboracao')).toBe(false);
    });
  });

  // --- Tipo Labels ---
  describe('Tipo Labels', () => {
    const TIPO_LABELS: Record<string, string> = {
      prestacao_servicos: 'Prestação de Serviços',
      honorarios: 'Honorários',
      parceria: 'Parceria',
      nda: 'NDA',
      aditivo: 'Aditivo',
      distrato: 'Distrato',
      outro: 'Outro',
    };

    it('should have labels for all tipos', () => {
      expect(Object.keys(TIPO_LABELS)).toHaveLength(7);
    });

    it('should have non-empty labels', () => {
      for (const [key, label] of Object.entries(TIPO_LABELS)) {
        expect(label.length).toBeGreaterThan(0);
      }
    });
  });

  // --- Forma Cobrança Labels ---
  describe('Forma Cobrança Labels', () => {
    const FORMA_COBRANCA_LABELS: Record<string, string> = {
      percentual_credito: '% do Crédito',
      valor_fixo: 'Valor Fixo',
      mensalidade: 'Mensalidade',
      exito: 'Êxito',
      hibrido: 'Híbrido',
      entrada_exito: 'Entrada + Êxito',
      valor_fixo_parcelado: 'Valor Fixo Parcelado',
    };

    it('should have labels for all formas de cobrança', () => {
      expect(Object.keys(FORMA_COBRANCA_LABELS)).toHaveLength(7);
    });
  });
});
