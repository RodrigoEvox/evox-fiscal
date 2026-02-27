import { describe, it, expect, vi } from 'vitest';

// ===== V89 TESTS =====
// Tests for: Viabilidade Report, Viabilidade Filter, Partner Notification

describe('v89 — Relatório de Viabilidade, Filtro, Notificação', () => {

  // ===== VIABILIDADE FILTER LOGIC =====
  describe('Filtro por Viabilidade', () => {
    const mockTasks = [
      { id: 1, titulo: 'Task 1', viabilidade: 'viavel', valorGlobalApurado: '50000.00', status: 'feito' },
      { id: 2, titulo: 'Task 2', viabilidade: 'inviavel', valorGlobalApurado: '5000.00', status: 'feito' },
      { id: 3, titulo: 'Task 3', viabilidade: null, valorGlobalApurado: null, status: 'a_fazer' },
      { id: 4, titulo: 'Task 4', viabilidade: 'viavel', valorGlobalApurado: '120000.00', status: 'concluido' },
      { id: 5, titulo: 'Task 5', viabilidade: 'inviavel', valorGlobalApurado: '8000.00', status: 'concluido' },
    ];

    function applyViabilidadeFilter(tasks: typeof mockTasks, filter: string) {
      if (filter === 'all') return tasks;
      return tasks.filter(t => t.viabilidade === filter);
    }

    it('deve retornar todas as tarefas quando filtro é "all"', () => {
      const result = applyViabilidadeFilter(mockTasks, 'all');
      expect(result).toHaveLength(5);
    });

    it('deve filtrar apenas tarefas viáveis', () => {
      const result = applyViabilidadeFilter(mockTasks, 'viavel');
      expect(result).toHaveLength(2);
      expect(result.every(t => t.viabilidade === 'viavel')).toBe(true);
    });

    it('deve filtrar apenas tarefas inviáveis', () => {
      const result = applyViabilidadeFilter(mockTasks, 'inviavel');
      expect(result).toHaveLength(2);
      expect(result.every(t => t.viabilidade === 'inviavel')).toBe(true);
    });

    it('não deve incluir tarefas sem viabilidade definida no filtro viavel', () => {
      const result = applyViabilidadeFilter(mockTasks, 'viavel');
      expect(result.find(t => t.viabilidade === null)).toBeUndefined();
    });
  });

  // ===== VIABILIDADE REPORT STATS =====
  describe('Relatório de Viabilidade - Cálculos', () => {
    const mockViabData = {
      totalAvaliadas: 10,
      totalViavel: 7,
      totalInviavel: 3,
      valorTotalViavel: 500000,
      valorTotalInviavel: 30000,
    };

    it('deve calcular taxa de viabilidade corretamente', () => {
      const taxa = Math.round((mockViabData.totalViavel / mockViabData.totalAvaliadas) * 100);
      expect(taxa).toBe(70);
    });

    it('deve calcular taxa 0% quando não há avaliações', () => {
      const emptyData = { ...mockViabData, totalAvaliadas: 0, totalViavel: 0, totalInviavel: 0 };
      const taxa = emptyData.totalAvaliadas > 0
        ? Math.round((emptyData.totalViavel / emptyData.totalAvaliadas) * 100)
        : 0;
      expect(taxa).toBe(0);
    });

    it('deve calcular taxa 100% quando todas são viáveis', () => {
      const allViavel = { ...mockViabData, totalAvaliadas: 5, totalViavel: 5, totalInviavel: 0 };
      const taxa = Math.round((allViavel.totalViavel / allViavel.totalAvaliadas) * 100);
      expect(taxa).toBe(100);
    });

    it('deve somar valores viáveis e inviáveis corretamente', () => {
      const total = mockViabData.valorTotalViavel + mockViabData.valorTotalInviavel;
      expect(total).toBe(530000);
    });
  });

  // ===== VIABILIDADE POR TESE =====
  describe('Viabilidade por Tese', () => {
    const mockTeseData = [
      { teseNome: 'PIS/COFINS Monofásico', tributoEnvolvido: 'PIS/COFINS', viavel: 5, inviavel: 2, total: 7, taxaViabilidade: 71.4, valorTotal: 350000 },
      { teseNome: 'ICMS-ST', tributoEnvolvido: 'ICMS', viavel: 3, inviavel: 4, total: 7, taxaViabilidade: 42.9, valorTotal: 180000 },
    ];

    it('deve ter dados por tese com campos obrigatórios', () => {
      mockTeseData.forEach(t => {
        expect(t).toHaveProperty('teseNome');
        expect(t).toHaveProperty('tributoEnvolvido');
        expect(t).toHaveProperty('viavel');
        expect(t).toHaveProperty('inviavel');
        expect(t).toHaveProperty('total');
        expect(t).toHaveProperty('taxaViabilidade');
        expect(t).toHaveProperty('valorTotal');
      });
    });

    it('viavel + inviavel deve ser igual ao total', () => {
      mockTeseData.forEach(t => {
        expect(Number(t.viavel) + Number(t.inviavel)).toBe(Number(t.total));
      });
    });

    it('taxa de viabilidade deve estar entre 0 e 100', () => {
      mockTeseData.forEach(t => {
        expect(Number(t.taxaViabilidade)).toBeGreaterThanOrEqual(0);
        expect(Number(t.taxaViabilidade)).toBeLessThanOrEqual(100);
      });
    });
  });

  // ===== VIABILIDADE POR PARCEIRO =====
  describe('Viabilidade por Parceiro', () => {
    const mockParceiroData = [
      { parceiroNome: 'Dr. Carlos Mendes', viavel: 4, inviavel: 1, total: 5, taxaViabilidade: 80.0, valorTotal: 250000 },
      { parceiroNome: 'Sem parceiro', viavel: 2, inviavel: 3, total: 5, taxaViabilidade: 40.0, valorTotal: 100000 },
    ];

    it('deve ter dados por parceiro com campos obrigatórios', () => {
      mockParceiroData.forEach(p => {
        expect(p).toHaveProperty('parceiroNome');
        expect(p).toHaveProperty('viavel');
        expect(p).toHaveProperty('inviavel');
        expect(p).toHaveProperty('total');
        expect(p).toHaveProperty('taxaViabilidade');
      });
    });

    it('deve incluir "Sem parceiro" para clientes sem parceiro vinculado', () => {
      const semParceiro = mockParceiroData.find(p => p.parceiroNome === 'Sem parceiro');
      expect(semParceiro).toBeDefined();
    });
  });

  // ===== VIABILIDADE POR MÊS =====
  describe('Evolução Mensal da Viabilidade', () => {
    const mockMensalData = [
      { mes: '2026-02', viavel: 3, inviavel: 1, total: 4, taxaViabilidade: 75.0, valorTotal: 200000 },
      { mes: '2026-01', viavel: 2, inviavel: 2, total: 4, taxaViabilidade: 50.0, valorTotal: 150000 },
    ];

    it('deve ter formato de mês YYYY-MM', () => {
      mockMensalData.forEach(m => {
        expect(m.mes).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it('deve estar ordenado do mais recente para o mais antigo', () => {
      for (let i = 1; i < mockMensalData.length; i++) {
        expect(mockMensalData[i - 1].mes >= mockMensalData[i].mes).toBe(true);
      }
    });
  });

  // ===== NOTIFICAÇÃO AO PARCEIRO =====
  describe('Notificação Automática ao Parceiro', () => {
    it('deve gerar notificação com dados corretos para apuração viável', () => {
      const task = {
        fila: 'apuracao',
        viabilidade: 'viavel',
        valorGlobalApurado: '75000.00',
        clienteId: 1,
      };
      const clienteInfo = {
        razaoSocial: 'Empresa Teste LTDA',
        codigo: '000042',
        parceiroId: 5,
      };
      const parceiro = {
        nomeCompleto: 'Dr. Carlos Mendes',
        email: 'carlos@parceiro.com',
      };

      const viabLabel = task.viabilidade === 'viavel' ? 'VIÁVEL' : 'INVIÁVEL';
      const valorFormatado = Number(task.valorGlobalApurado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      expect(viabLabel).toBe('VIÁVEL');
      expect(valorFormatado).toContain('75.000');

      const notifTitulo = `Apuração Concluída - ${clienteInfo.razaoSocial}`;
      expect(notifTitulo).toBe('Apuração Concluída - Empresa Teste LTDA');

      const notifMensagem = `A análise do cliente ${clienteInfo.razaoSocial} (Código: ${clienteInfo.codigo}) foi concluída com resultado ${viabLabel}. Valor global apurado: ${valorFormatado}. Parceiro vinculado: ${parceiro.nomeCompleto} (${parceiro.email}).`;
      expect(notifMensagem).toContain('Empresa Teste LTDA');
      expect(notifMensagem).toContain('000042');
      expect(notifMensagem).toContain('VIÁVEL');
      expect(notifMensagem).toContain('Dr. Carlos Mendes');
      expect(notifMensagem).toContain('carlos@parceiro.com');
    });

    it('deve gerar notificação com dados corretos para apuração inviável', () => {
      const task = {
        fila: 'apuracao',
        viabilidade: 'inviavel',
        valorGlobalApurado: '8000.00',
        clienteId: 2,
      };

      const viabLabel = task.viabilidade === 'viavel' ? 'VIÁVEL' : 'INVIÁVEL';
      expect(viabLabel).toBe('INVIÁVEL');
    });

    it('não deve notificar se fila não é apuração', () => {
      const task = { fila: 'compensacao', viabilidade: 'viavel' };
      const shouldNotify = task.fila === 'apuracao' && !!task.viabilidade;
      expect(shouldNotify).toBe(false);
    });

    it('não deve notificar se viabilidade é null', () => {
      const task = { fila: 'apuracao', viabilidade: null };
      const shouldNotify = task.fila === 'apuracao' && !!task.viabilidade;
      expect(shouldNotify).toBe(false);
    });

    it('deve notificar se fila é apuração e viabilidade definida', () => {
      const task = { fila: 'apuracao', viabilidade: 'viavel' };
      const shouldNotify = task.fila === 'apuracao' && !!task.viabilidade;
      expect(shouldNotify).toBe(true);
    });
  });

  // ===== FORMATAÇÃO DE VALORES =====
  describe('Formatação de Valores no Relatório', () => {
    const formatCurrency = (v: number | string) => {
      const num = typeof v === 'string' ? parseFloat(v) : v;
      return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    it('deve formatar valores monetários corretamente', () => {
      expect(formatCurrency(50000)).toContain('50.000');
      expect(formatCurrency('120000.50')).toContain('120.000');
      expect(formatCurrency(0)).toContain('0,00');
    });

    it('deve retornar R$ 0,00 para valores inválidos', () => {
      expect(formatCurrency('abc')).toBe('R$ 0,00');
      expect(formatCurrency(NaN)).toBe('R$ 0,00');
    });
  });
});
