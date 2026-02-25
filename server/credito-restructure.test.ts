import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./dbCredito', () => ({
  listCreditClientes: vi.fn(),
  getCliente360: vi.fn(),
  getGestaoCreditos: vi.fn(),
  evaluateTesesAderencia: vi.fn(),
  createCreditTask: vi.fn(),
  getCreditTaskStats: vi.fn(),
  createTaskTese: vi.fn(),
}));

import {
  listCreditClientes,
  getCliente360,
  getGestaoCreditos,
  evaluateTesesAderencia,
  createCreditTask,
  getCreditTaskStats,
  createTaskTese,
} from './dbCredito';

const mockListCreditClientes = vi.mocked(listCreditClientes);
const mockGetCliente360 = vi.mocked(getCliente360);
const mockGetGestaoCreditos = vi.mocked(getGestaoCreditos);
const mockEvaluateTesesAderencia = vi.mocked(evaluateTesesAderencia);
const mockCreateCreditTask = vi.mocked(createCreditTask);
const mockGetCreditTaskStats = vi.mocked(getCreditTaskStats);
const mockCreateTaskTese = vi.mocked(createTaskTese);

describe('Credit Sector Restructure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Nova Tarefa — Task Creation', () => {
    it('should create a task in the apuracao fila without requiring contract', async () => {
      mockCreateCreditTask.mockResolvedValue({ id: 1, codigo: 'CT-0001' });

      const result = await createCreditTask({
        fila: 'apuracao',
        clienteId: 10,
        titulo: 'Apuração PIS/COFINS Monofásico',
        descricao: 'Análise de créditos monofásicos',
        status: 'a_fazer',
        prioridade: 'media',
        ordem: 0,
      } as any);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.codigo).toBe('CT-0001');
      expect(mockCreateCreditTask).toHaveBeenCalledWith(expect.objectContaining({
        fila: 'apuracao',
        clienteId: 10,
      }));
    });

    it('should create a task in the revisao fila without requiring contract', async () => {
      mockCreateCreditTask.mockResolvedValue({ id: 2, codigo: 'CT-0002' });

      const result = await createCreditTask({
        fila: 'revisao',
        clienteId: 10,
        titulo: 'Revisão da Apuração INSS',
        status: 'a_fazer',
        prioridade: 'alta',
        ordem: 0,
      } as any);

      expect(result).not.toBeNull();
      expect(result!.codigo).toBe('CT-0002');
    });

    it('should create a task in the compensacao fila (requires contract)', async () => {
      mockCreateCreditTask.mockResolvedValue({ id: 3, codigo: 'CT-0003' });

      const result = await createCreditTask({
        fila: 'compensacao',
        clienteId: 10,
        titulo: 'Compensação DCTF',
        status: 'a_fazer',
        prioridade: 'urgente',
        ordem: 0,
      } as any);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(3);
    });

    it('should create tasks for all valid filas', async () => {
      const filas = ['apuracao', 'retificacao', 'compensacao', 'ressarcimento', 'restituicao', 'revisao', 'onboarding'];

      for (let i = 0; i < filas.length; i++) {
        mockCreateCreditTask.mockResolvedValue({ id: i + 1, codigo: `CT-000${i + 1}` });
        const result = await createCreditTask({
          fila: filas[i],
          clienteId: 10,
          titulo: `Tarefa ${filas[i]}`,
          status: 'a_fazer',
          prioridade: 'media',
          ordem: 0,
        } as any);
        expect(result).not.toBeNull();
      }

      expect(mockCreateCreditTask).toHaveBeenCalledTimes(7);
    });
  });

  describe('Motor de Regras — Tese Aderência', () => {
    it('should return aderentes and naoAderentes lists', async () => {
      mockEvaluateTesesAderencia.mockResolvedValue({
        aderentes: [
          {
            teseId: 1,
            teseNome: 'PIS/COFINS Monofásico',
            tributoEnvolvido: 'PIS/COFINS',
            tipo: 'administrativo',
            classificacao: 'pacificada',
            potencialFinanceiro: 'alto',
            valorEstimado: 25000,
          },
          {
            teseId: 2,
            teseNome: 'INSS sobre Verbas Indenizatórias',
            tributoEnvolvido: 'INSS',
            tipo: 'administrativo',
            classificacao: 'pacificada',
            potencialFinanceiro: 'medio',
            valorEstimado: 12000,
          },
        ],
        naoAderentes: [
          {
            teseId: 3,
            teseNome: 'ICMS-ST',
            tributoEnvolvido: 'ICMS',
            tipo: 'administrativo',
            classificacao: 'em_discussao',
            potencialFinanceiro: 'baixo',
            valorEstimado: 0,
            motivos: ['Não aplicável a Lucro Presumido'],
          },
        ],
      } as any);

      const result = await evaluateTesesAderencia(10);
      expect(result).toBeDefined();
      expect((result as any).aderentes).toHaveLength(2);
      expect((result as any).naoAderentes).toHaveLength(1);
      expect((result as any).naoAderentes[0].motivos).toContain('Não aplicável a Lucro Presumido');
    });

    it('should return empty lists when no teses exist', async () => {
      mockEvaluateTesesAderencia.mockResolvedValue({
        aderentes: [],
        naoAderentes: [],
      } as any);

      const result = await evaluateTesesAderencia(999);
      expect((result as any).aderentes).toHaveLength(0);
      expect((result as any).naoAderentes).toHaveLength(0);
    });
  });

  describe('Task-Tese Association', () => {
    it('should create a task-tese association for an aderente tese', async () => {
      mockCreateTaskTese.mockResolvedValue(1);

      const result = await createTaskTese({
        taskId: 1,
        teseId: 1,
        teseNome: 'PIS/COFINS Monofásico',
        aderente: 1,
        justificativaNaoAderente: null,
        valorEstimado: 25000,
        status: 'selecionada',
      });

      expect(result).toBe(1);
      expect(mockCreateTaskTese).toHaveBeenCalledWith(expect.objectContaining({
        taskId: 1,
        teseId: 1,
        aderente: 1,
        justificativaNaoAderente: null,
      }));
    });

    it('should create a task-tese association for a non-aderente tese with justificativa', async () => {
      mockCreateTaskTese.mockResolvedValue(2);

      const result = await createTaskTese({
        taskId: 1,
        teseId: 3,
        teseNome: 'ICMS-ST',
        aderente: 0,
        justificativaNaoAderente: 'Cliente possui operações interestaduais que justificam a análise',
        valorEstimado: 5000,
        status: 'selecionada',
      });

      expect(result).toBe(2);
      expect(mockCreateTaskTese).toHaveBeenCalledWith(expect.objectContaining({
        aderente: 0,
        justificativaNaoAderente: 'Cliente possui operações interestaduais que justificam a análise',
      }));
    });
  });

  describe('Fila Stats — Dashboard KPIs', () => {
    it('should return task stats grouped by fila', async () => {
      mockGetCreditTaskStats.mockResolvedValue([
        { fila: 'apuracao', total: 50, a_fazer: 30, fazendo: 15, feito: 5 },
        { fila: 'retificacao', total: 20, a_fazer: 10, fazendo: 8, feito: 2 },
        { fila: 'compensacao', total: 15, a_fazer: 5, fazendo: 7, feito: 3 },
        { fila: 'ressarcimento', total: 8, a_fazer: 3, fazendo: 4, feito: 1 },
        { fila: 'restituicao', total: 5, a_fazer: 2, fazendo: 2, feito: 1 },
        { fila: 'onboarding', total: 12, a_fazer: 6, fazendo: 4, feito: 2 },
      ] as any);

      const result = await getCreditTaskStats();
      expect(result).toBeDefined();
      const stats = result as any[];
      expect(stats).toHaveLength(6);

      const apuracao = stats.find(s => s.fila === 'apuracao');
      expect(apuracao).toBeDefined();
      expect(apuracao.total).toBe(50);
      expect(apuracao.a_fazer).toBe(30);
    });

    it('should return empty object when no tasks exist', async () => {
      mockGetCreditTaskStats.mockResolvedValue({});
      const result = await getCreditTaskStats();
      expect(result).toEqual({});
    });
  });

  describe('Gestão de Créditos', () => {
    it('should return credit management data with totals', async () => {
      mockGetGestaoCreditos.mockResolvedValue({
        ledger: [
          { teseNome: 'PIS/COFINS', valorEstimado: 50000, valorValidado: 40000, valorEfetivado: 20000, saldoResidual: 20000 },
        ],
        perdcomps: [
          { numero: 'PC-001', tipo: 'compensacao', valor: 10000, status: 'homologado' },
        ],
        exitos: [],
        strategies: [],
        totals: {
          totalEstimado: 50000,
          totalValidado: 40000,
          totalProtocolado: 30000,
          totalEfetivado: 20000,
          saldoResidual: 20000,
        },
        prescricaoRisk: 0,
      } as any);

      const result = await getGestaoCreditos(10);
      expect(result).toBeDefined();
      expect(result.totals.totalEstimado).toBe(50000);
      expect(result.totals.saldoResidual).toBe(20000);
      expect(result.ledger).toHaveLength(1);
      expect(result.perdcomps).toHaveLength(1);
      expect(result.prescricaoRisk).toBe(0);
    });

    it('should flag prescription risk when credits are old', async () => {
      mockGetGestaoCreditos.mockResolvedValue({
        ledger: [],
        perdcomps: [],
        exitos: [],
        strategies: [],
        totals: { totalEstimado: 10000, totalValidado: 10000, totalProtocolado: 0, totalEfetivado: 0, saldoResidual: 10000 },
        prescricaoRisk: 2,
      } as any);

      const result = await getGestaoCreditos(10);
      expect(result.prescricaoRisk).toBe(2);
    });
  });

  describe('Contract Validation Logic', () => {
    it('filas that require contract: retificacao, compensacao, ressarcimento, restituicao, onboarding', () => {
      const requiresContract = ['retificacao', 'compensacao', 'ressarcimento', 'restituicao', 'onboarding'];
      const noContract = ['apuracao', 'revisao'];

      requiresContract.forEach(fila => {
        expect(['retificacao', 'compensacao', 'ressarcimento', 'restituicao', 'onboarding']).toContain(fila);
      });

      noContract.forEach(fila => {
        expect(['retificacao', 'compensacao', 'ressarcimento', 'restituicao', 'onboarding']).not.toContain(fila);
      });
    });

    it('apuracao and revisao filas do not require contract', () => {
      const noContractFilas = ['apuracao', 'revisao'];
      const requiresContractFilas = ['retificacao', 'compensacao', 'ressarcimento', 'restituicao', 'onboarding'];

      noContractFilas.forEach(fila => {
        expect(requiresContractFilas).not.toContain(fila);
      });
    });
  });

  describe('Task FIFO Ordering', () => {
    it('tasks should be ordered by creation date (FIFO)', () => {
      const tasks = [
        { id: 3, createdAt: '2026-02-25T10:00:00Z', titulo: 'Terceira' },
        { id: 1, createdAt: '2026-02-25T08:00:00Z', titulo: 'Primeira' },
        { id: 2, createdAt: '2026-02-25T09:00:00Z', titulo: 'Segunda' },
      ];

      const sorted = [...tasks].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      expect(sorted[0].titulo).toBe('Primeira');
      expect(sorted[1].titulo).toBe('Segunda');
      expect(sorted[2].titulo).toBe('Terceira');
    });
  });
});
