import { describe, it, expect, vi } from 'vitest';

// Mock db module
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db') as any;
  return {
    ...actual,
  };
});

describe('v71 — Ocorrências Dashboard, Histórico Disciplinar & Notificações', () => {
  // ---- classificarOcorrencia tests ----
  describe('classificarOcorrencia', () => {
    it('should classify leve 1st occurrence as reversivel with advertencia', async () => {
      const { classificarOcorrencia } = await import('./db');
      const result = classificarOcorrencia('falta_injustificada', 'leve', 0);
      expect(result.classificacao).toBe('reversivel');
      expect(result.recomendacao).toBe('advertencia');
    });

    it('should classify media 2nd occurrence as reversivel with suspensao', async () => {
      const { classificarOcorrencia } = await import('./db');
      const result = classificarOcorrencia('atraso_frequente', 'media', 1);
      expect(result.classificacao).toBe('reversivel');
      expect(result.recomendacao).toBe('suspensao');
    });

    it('should classify grave 3+ occurrences as irreversivel with desligamento', async () => {
      const { classificarOcorrencia } = await import('./db');
      const result = classificarOcorrencia('erro_trabalho', 'grave', 3);
      expect(result.classificacao).toBe('irreversivel');
      expect(result.recomendacao).toBe('desligamento');
    });

    it('should classify grave 1st occurrence as reversivel with reversao', async () => {
      const { classificarOcorrencia } = await import('./db');
      const result = classificarOcorrencia('erro_trabalho', 'grave', 0);
      expect(result.classificacao).toBe('reversivel');
      expect(result.recomendacao).toBe('reversao');
    });

    it('should classify gravissima as irreversivel with desligamento', async () => {
      const { classificarOcorrencia } = await import('./db');
      const result = classificarOcorrencia('conduta_inapropriada', 'gravissima', 0);
      expect(result.classificacao).toBe('irreversivel');
      expect(result.recomendacao).toBe('desligamento');
    });
  });

  // ---- getOcorrenciasDashboard tests ----
  describe('getOcorrenciasDashboard', () => {
    it('should return dashboard structure with all required fields', async () => {
      const { getOcorrenciasDashboard } = await import('./db');
      const result = await getOcorrenciasDashboard();
      expect(result).toHaveProperty('porSetor');
      expect(result).toHaveProperty('porTipo');
      expect(result).toHaveProperty('porMes');
      expect(result).toHaveProperty('planosReversaoStats');
      expect(result).toHaveProperty('topReincidentes');
      expect(result.planosReversaoStats).toHaveProperty('total');
      expect(result.planosReversaoStats).toHaveProperty('ativos');
      expect(result.planosReversaoStats).toHaveProperty('sucesso');
      expect(result.planosReversaoStats).toHaveProperty('fracasso');
      expect(result.planosReversaoStats).toHaveProperty('cancelados');
      expect(result.planosReversaoStats).toHaveProperty('taxaSucesso');
    });

    it('porSetor should be an array of objects with setor and count', async () => {
      const { getOcorrenciasDashboard } = await import('./db');
      const result = await getOcorrenciasDashboard();
      expect(Array.isArray(result.porSetor)).toBe(true);
      if (result.porSetor.length > 0) {
        expect(result.porSetor[0]).toHaveProperty('setor');
        expect(result.porSetor[0]).toHaveProperty('count');
      }
    });

    it('porTipo should be an array of objects with tipo and count', async () => {
      const { getOcorrenciasDashboard } = await import('./db');
      const result = await getOcorrenciasDashboard();
      expect(Array.isArray(result.porTipo)).toBe(true);
      if (result.porTipo.length > 0) {
        expect(result.porTipo[0]).toHaveProperty('tipo');
        expect(result.porTipo[0]).toHaveProperty('count');
      }
    });

    it('porMes should be sorted chronologically', async () => {
      const { getOcorrenciasDashboard } = await import('./db');
      const result = await getOcorrenciasDashboard();
      for (let i = 1; i < result.porMes.length; i++) {
        expect(result.porMes[i].mes >= result.porMes[i - 1].mes).toBe(true);
      }
    });

    it('taxaSucesso should be between 0 and 100', async () => {
      const { getOcorrenciasDashboard } = await import('./db');
      const result = await getOcorrenciasDashboard();
      expect(result.planosReversaoStats.taxaSucesso).toBeGreaterThanOrEqual(0);
      expect(result.planosReversaoStats.taxaSucesso).toBeLessThanOrEqual(100);
    });
  });

  // ---- getHistoricoDisciplinar tests ----
  describe('getHistoricoDisciplinar', () => {
    it('should return historico structure with all required fields', async () => {
      const { getHistoricoDisciplinar } = await import('./db');
      const result = await getHistoricoDisciplinar(1);
      expect(result).toHaveProperty('ocorrencias');
      expect(result).toHaveProperty('planos');
      expect(result).toHaveProperty('resumo');
      expect(Array.isArray(result.ocorrencias)).toBe(true);
      expect(Array.isArray(result.planos)).toBe(true);
    });

    it('resumo should have correct counters', async () => {
      const { getHistoricoDisciplinar } = await import('./db');
      const result = await getHistoricoDisciplinar(1);
      expect(result.resumo).toHaveProperty('totalOcorrencias');
      expect(result.resumo).toHaveProperty('reversiveis');
      expect(result.resumo).toHaveProperty('irreversiveis');
      expect(result.resumo).toHaveProperty('planosAtivos');
      expect(result.resumo).toHaveProperty('planosConcluidos');
      expect(result.resumo.totalOcorrencias).toBe(result.ocorrencias.length);
      expect(result.resumo.reversiveis + result.resumo.irreversiveis).toBeLessThanOrEqual(result.resumo.totalOcorrencias);
    });

    it('should return empty data for non-existent colaborador', async () => {
      const { getHistoricoDisciplinar } = await import('./db');
      const result = await getHistoricoDisciplinar(999999);
      expect(result.ocorrencias.length).toBe(0);
      expect(result.planos.length).toBe(0);
      expect(result.resumo.totalOcorrencias).toBe(0);
    });
  });

  // ---- checkPlanosVencendo tests ----
  describe('checkPlanosVencendo', () => {
    it('should return an array', async () => {
      const { checkPlanosVencendo } = await import('./db');
      const result = await checkPlanosVencendo(7);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include diasRestantes field for each result', async () => {
      const { checkPlanosVencendo } = await import('./db');
      const result = await checkPlanosVencendo(365); // large window to catch any
      for (const p of result) {
        expect(p).toHaveProperty('diasRestantes');
        expect(typeof p.diasRestantes).toBe('number');
      }
    });
  });

  // ---- checkReincidenciasAlerta tests ----
  describe('checkReincidenciasAlerta', () => {
    it('should return an array', async () => {
      const { checkReincidenciasAlerta } = await import('./db');
      const result = await checkReincidenciasAlerta(3);
      expect(Array.isArray(result)).toBe(true);
    });

    it('all returned items should have count >= limit', async () => {
      const { checkReincidenciasAlerta } = await import('./db');
      const limit = 2;
      const result = await checkReincidenciasAlerta(limit);
      for (const r of result) {
        expect(r.count).toBeGreaterThanOrEqual(limit);
      }
    });

    it('results should be sorted by count descending', async () => {
      const { checkReincidenciasAlerta } = await import('./db');
      const result = await checkReincidenciasAlerta(1);
      for (let i = 1; i < result.length; i++) {
        expect(result[i].count).toBeLessThanOrEqual(result[i - 1].count);
      }
    });

    it('each result should have required fields', async () => {
      const { checkReincidenciasAlerta } = await import('./db');
      const result = await checkReincidenciasAlerta(1);
      for (const r of result) {
        expect(r).toHaveProperty('colaboradorId');
        expect(r).toHaveProperty('nome');
        expect(r).toHaveProperty('count');
        expect(r).toHaveProperty('ultimaData');
      }
    });
  });

  // ---- CRUD integration with dashboard ----
  describe('CRUD integration with dashboard', () => {
    it('creating an ocorrencia should increase dashboard totals', async () => {
      const { getOcorrenciasDashboard, createOcorrencia, deleteOcorrencia } = await import('./db');
      
      const before = await getOcorrenciasDashboard();
      const beforeTotal = before.porTipo.reduce((sum: number, t: any) => sum + t.count, 0);
      
      const id = await createOcorrencia({
        colaboradorId: 9999,
        colaboradorNome: 'Teste Dashboard',
        cargo: 'Tester',
        setor: 'QA',
        tipo: 'falta_injustificada',
        gravidade: 'leve',
        classificacao: 'reversivel',
        recomendacao: 'advertencia',
        descricao: 'Teste de integração dashboard',
        dataOcorrencia: '2026-02-24',
        reincidencias: 0,
        status: 'registrada',
        registradoPorNome: 'Sistema',
      });
      
      const after = await getOcorrenciasDashboard();
      const afterTotal = after.porTipo.reduce((sum: number, t: any) => sum + t.count, 0);
      
      expect(afterTotal).toBe(beforeTotal + 1);
      
      // Cleanup
      if (id) await deleteOcorrencia(id);
    });
  });
});
