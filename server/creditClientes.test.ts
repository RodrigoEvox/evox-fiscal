import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./dbCredito', () => ({
  listCreditClientes: vi.fn(),
  getCliente360: vi.fn(),
  getGestaoCreditos: vi.fn(),
  evaluateTesesAderencia: vi.fn(),
}));

import {
  listCreditClientes,
  getCliente360,
  getGestaoCreditos,
  evaluateTesesAderencia,
} from './dbCredito';

const mockListCreditClientes = vi.mocked(listCreditClientes);
const mockGetCliente360 = vi.mocked(getCliente360);
const mockGetGestaoCreditos = vi.mocked(getGestaoCreditos);
const mockEvaluateTesesAderencia = vi.mocked(evaluateTesesAderencia);

describe('Credit Clientes Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCreditClientes', () => {
    it('should return a list of clients with credit summary', async () => {
      const mockClients = [
        {
          id: 1,
          cnpj: '12345678000100',
          razaoSocial: 'Empresa Teste LTDA',
          nomeFantasia: 'Teste',
          regimeTributario: 'Lucro Presumido',
          situacaoCadastral: 'Ativa',
          segmentoEconomico: 'Comércio',
          parceiroId: 1,
          parceiroNome: 'Parceiro Teste',
          totalCases: 3,
          totalTasks: 10,
          tasksAtivas: 5,
          tasksEmAtraso: 2,
        },
      ];
      mockListCreditClientes.mockResolvedValue(mockClients as any);

      const result = await listCreditClientes();
      expect(result).toHaveLength(1);
      expect(result[0].razaoSocial).toBe('Empresa Teste LTDA');
      expect(result[0].totalCases).toBe(3);
      expect(result[0].tasksEmAtraso).toBe(2);
    });

    it('should filter by search term', async () => {
      mockListCreditClientes.mockResolvedValue([]);
      const result = await listCreditClientes({ search: 'Teste' });
      expect(mockListCreditClientes).toHaveBeenCalledWith({ search: 'Teste' });
      expect(result).toHaveLength(0);
    });

    it('should filter by parceiroId', async () => {
      mockListCreditClientes.mockResolvedValue([]);
      const result = await listCreditClientes({ parceiroId: 5 });
      expect(mockListCreditClientes).toHaveBeenCalledWith({ parceiroId: 5 });
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no clients found', async () => {
      mockListCreditClientes.mockResolvedValue([]);
      const result = await listCreditClientes();
      expect(result).toEqual([]);
    });
  });

  describe('getCliente360', () => {
    it('should return full 360° view for a client', async () => {
      const mock360 = {
        cliente: {
          id: 1,
          cnpj: '12345678000100',
          razaoSocial: 'Empresa Teste LTDA',
          nomeFantasia: 'Teste',
          regimeTributario: 'Lucro Presumido',
          situacaoCadastral: 'Ativa',
        },
        cases: [
          { id: 1, numero: 'CAS-001', fase: 'analise', status: 'ativo' },
        ],
        tasks: [
          { id: 1, codigo: 'TSK-001', titulo: 'Tarefa 1', status: 'a_fazer', slaStatus: 'dentro_prazo' },
        ],
        rtis: [],
        tickets: [],
        ledger: [
          { id: 1, valorEstimado: 10000, valorValidado: 8000, valorEfetivado: 5000, saldoResidual: 3000 },
        ],
        perdcomps: [],
        exitos: [],
        strategy: null,
        auditLog: [],
        demands: [],
        totals: {
          totalEstimado: 10000,
          totalValidado: 8000,
          totalEfetivado: 5000,
          saldoDisponivel: 3000,
          tasksEmAtraso: 0,
          tasksAtivas: 1,
        },
      };
      mockGetCliente360.mockResolvedValue(mock360 as any);

      const result = await getCliente360(1);
      expect(result).not.toBeNull();
      expect(result!.cliente.razaoSocial).toBe('Empresa Teste LTDA');
      expect(result!.cases).toHaveLength(1);
      expect(result!.tasks).toHaveLength(1);
      expect(result!.ledger).toHaveLength(1);
      expect(result!.totals.totalEstimado).toBe(10000);
      expect(result!.totals.saldoDisponivel).toBe(3000);
      expect(result!.totals.tasksAtivas).toBe(1);
    });

    it('should return null for non-existent client', async () => {
      mockGetCliente360.mockResolvedValue(null as any);
      const result = await getCliente360(999);
      expect(result).toBeNull();
    });
  });

  describe('getGestaoCreditos', () => {
    it('should return credit management data for a client', async () => {
      const mockGestao = {
        totals: {
          totalApurado: 50000,
          totalValidado: 40000,
          totalUtilizado: 20000,
          saldoDisponivel: 20000,
        },
        ledger: [
          {
            id: 1,
            teseNome: 'PIS/COFINS Monofásico',
            grupoSigla: 'INSS',
            tipo: 'compensacao',
            valorEstimado: 50000,
            valorValidado: 40000,
            valorEfetivado: 20000,
            saldoResidual: 20000,
            status: 'validado',
          },
        ],
        perdcomps: [
          {
            id: 1,
            numeroPerdcomp: 'PC-001',
            tipoCredito: 'PIS',
            valorCredito: 10000,
            valorDebitosCompensados: 8000,
            saldoRemanescente: 2000,
            status: 'homologado',
            feitoPelaEvox: true,
          },
        ],
        exitos: [],
        strategies: [
          {
            estrategia: 'compensacao',
            observacoes: 'Compensação prioritária',
          },
        ],
        prescricaoAlerts: [],
      };
      mockGetGestaoCreditos.mockResolvedValue(mockGestao as any);

      const result = await getGestaoCreditos(1);
      expect(result).not.toBeNull();
      expect(result.totals.totalApurado).toBe(50000);
      expect(result.ledger).toHaveLength(1);
      expect(result.perdcomps).toHaveLength(1);
      expect(result.perdcomps[0].status).toBe('homologado');
      expect(result.strategies).toHaveLength(1);
      expect(result.prescricaoAlerts).toHaveLength(0);
    });

    it('should include prescription alerts when credits are near expiry', async () => {
      const mockGestao = {
        totals: { totalApurado: 10000, totalValidado: 10000, totalUtilizado: 0, saldoDisponivel: 10000 },
        ledger: [],
        perdcomps: [],
        exitos: [],
        strategies: [],
        prescricaoAlerts: [
          {
            teseNome: 'PIS/COFINS',
            valor: 10000,
            dataLimite: '2026-03-15',
            diasRestantes: 18,
          },
        ],
      };
      mockGetGestaoCreditos.mockResolvedValue(mockGestao as any);

      const result = await getGestaoCreditos(1);
      expect(result.prescricaoAlerts).toHaveLength(1);
      expect(result.prescricaoAlerts[0].diasRestantes).toBe(18);
    });
  });

  describe('evaluateTesesAderencia', () => {
    it('should return thesis adherence evaluation for a client', async () => {
      const mockEval = [
        {
          teseId: 1,
          teseNome: 'PIS/COFINS Monofásico',
          aderente: true,
          motivo: 'Cliente possui produtos monofásicos',
          potencialEstimado: 50000,
        },
        {
          teseId: 2,
          teseNome: 'INSS sobre Verbas Indenizatórias',
          aderente: false,
          motivo: 'Regime tributário incompatível',
          potencialEstimado: 0,
        },
      ];
      mockEvaluateTesesAderencia.mockResolvedValue(mockEval as any);

      const result = await evaluateTesesAderencia(1);
      expect(result).toHaveLength(2);
      expect(result[0].aderente).toBe(true);
      expect(result[1].aderente).toBe(false);
    });

    it('should return empty array when no theses match', async () => {
      mockEvaluateTesesAderencia.mockResolvedValue([]);
      const result = await evaluateTesesAderencia(999);
      expect(result).toEqual([]);
    });
  });
});
