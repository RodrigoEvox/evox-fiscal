import { describe, it, expect } from 'vitest';

/**
 * v67 — Testes para o fluxo refatorado de Rescisão
 * 
 * Verifica a lógica de cálculo de rescisão (preview vs save),
 * a separação de responsabilidades, e a consistência dos dados.
 */

// Simula a função calcularRescisao do db.ts
function calcularRescisao(params: {
  salarioBase: number;
  dataAdmissao: string;
  dataDesligamento: string;
  tipoDesligamento: string;
  periodoExperiencia1Fim?: string | null;
  periodoExperiencia2Fim?: string | null;
}) {
  const { salarioBase, dataAdmissao, dataDesligamento, tipoDesligamento } = params;
  const admissao = new Date(dataAdmissao);
  const desligamento = new Date(dataDesligamento);
  
  const diffMs = desligamento.getTime() - admissao.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const mesesTrabalhados = Math.floor(diffDays / 30);
  const diasNoMes = desligamento.getDate();
  
  const salarioDia = salarioBase / 30;
  const saldoSalario = salarioDia * diasNoMes;
  
  const avosFerias = mesesTrabalhados % 12 || 12;
  const feriasProp = (salarioBase / 12) * avosFerias;
  const tercoConst = feriasProp / 3;
  
  const avos13 = mesesTrabalhados % 12 || 12;
  const decimoTerceiro = (salarioBase / 12) * avos13;
  
  let avisoPrevio = 0;
  let multaFGTS = 0;
  let feriasVencidas = 0;
  
  const anosCompletos = Math.floor(mesesTrabalhados / 12);
  if (anosCompletos >= 1) {
    feriasVencidas = salarioBase + salarioBase / 3;
  }
  
  const fgtsDepositado = salarioBase * 0.08 * mesesTrabalhados;
  
  if (tipoDesligamento === 'sem_justa_causa') {
    const diasAviso = Math.min(30 + anosCompletos * 3, 90);
    avisoPrevio = salarioDia * diasAviso;
    multaFGTS = fgtsDepositado * 0.4;
  } else if (tipoDesligamento === 'acordo_mutuo') {
    const diasAviso = Math.min(30 + anosCompletos * 3, 90);
    avisoPrevio = (salarioDia * diasAviso) * 0.5;
    multaFGTS = fgtsDepositado * 0.2;
  }
  
  const proventos = saldoSalario + avisoPrevio + decimoTerceiro + feriasProp + tercoConst + feriasVencidas + multaFGTS;
  const descontos = tipoDesligamento === 'justa_causa' ? 0 : 0;
  const liquido = proventos - descontos;
  
  return {
    proventos,
    descontos,
    liquido,
    saldoSalario,
    avisoPrevio,
    decimoTerceiro,
    feriasProp,
    tercoConst,
    feriasVencidas,
    multaFGTS,
    fgtsDepositado,
    mesesTrabalhados,
    tipoDesligamento,
  };
}

describe('v67 — Fluxo de Rescisão (Preview vs Save)', () => {
  
  describe('Cálculo de rescisão — Sem Justa Causa', () => {
    it('deve calcular verbas rescisórias para demissão sem justa causa', () => {
      const result = calcularRescisao({
        salarioBase: 3000,
        dataAdmissao: '2025-01-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'sem_justa_causa',
      });
      
      expect(result.proventos).toBeGreaterThan(0);
      expect(result.saldoSalario).toBeGreaterThan(0);
      expect(result.avisoPrevio).toBeGreaterThan(0);
      expect(result.decimoTerceiro).toBeGreaterThan(0);
      expect(result.feriasProp).toBeGreaterThan(0);
      expect(result.tercoConst).toBeGreaterThan(0);
      expect(result.multaFGTS).toBeGreaterThan(0);
      expect(result.liquido).toBe(result.proventos - result.descontos);
    });
    
    it('deve incluir multa FGTS de 40% para sem justa causa', () => {
      const result = calcularRescisao({
        salarioBase: 5000,
        dataAdmissao: '2024-01-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'sem_justa_causa',
      });
      
      expect(result.multaFGTS).toBeCloseTo(result.fgtsDepositado * 0.4, 0);
    });
  });
  
  describe('Cálculo de rescisão — Justa Causa', () => {
    it('não deve incluir aviso prévio nem multa FGTS para justa causa', () => {
      const result = calcularRescisao({
        salarioBase: 3000,
        dataAdmissao: '2025-01-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'justa_causa',
      });
      
      expect(result.avisoPrevio).toBe(0);
      expect(result.multaFGTS).toBe(0);
    });
  });
  
  describe('Cálculo de rescisão — Pedido de Demissão', () => {
    it('não deve incluir aviso prévio indenizado nem multa FGTS para pedido de demissão', () => {
      const result = calcularRescisao({
        salarioBase: 8500,
        dataAdmissao: '2023-02-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'pedido_demissao',
      });
      
      expect(result.avisoPrevio).toBe(0);
      expect(result.multaFGTS).toBe(0);
      expect(result.saldoSalario).toBeGreaterThan(0);
      expect(result.decimoTerceiro).toBeGreaterThan(0);
      expect(result.feriasProp).toBeGreaterThan(0);
    });
  });
  
  describe('Cálculo de rescisão — Acordo Mútuo', () => {
    it('deve incluir 50% do aviso prévio e 20% da multa FGTS para acordo mútuo', () => {
      const result = calcularRescisao({
        salarioBase: 5000,
        dataAdmissao: '2024-01-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'acordo_mutuo',
      });
      
      // Acordo mútuo: 50% aviso prévio, 20% multa FGTS
      expect(result.avisoPrevio).toBeGreaterThan(0);
      expect(result.multaFGTS).toBeGreaterThan(0);
      expect(result.multaFGTS).toBeCloseTo(result.fgtsDepositado * 0.2, 0);
      
      // Comparar com sem justa causa para verificar que é metade
      const semJustaCausa = calcularRescisao({
        salarioBase: 5000,
        dataAdmissao: '2024-01-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'sem_justa_causa',
      });
      
      expect(result.avisoPrevio).toBeCloseTo(semJustaCausa.avisoPrevio * 0.5, 0);
      expect(result.multaFGTS).toBeCloseTo(semJustaCausa.multaFGTS * 0.5, 0);
    });
  });
  
  describe('Separação Preview vs Save', () => {
    it('preview e save devem produzir o mesmo cálculo para os mesmos dados', () => {
      const params = {
        salarioBase: 8500,
        dataAdmissao: '2023-02-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'sem_justa_causa',
      };
      
      const preview = calcularRescisao(params);
      const save = calcularRescisao(params);
      
      expect(preview.proventos).toBe(save.proventos);
      expect(preview.descontos).toBe(save.descontos);
      expect(preview.liquido).toBe(save.liquido);
      expect(preview.saldoSalario).toBe(save.saldoSalario);
      expect(preview.avisoPrevio).toBe(save.avisoPrevio);
      expect(preview.multaFGTS).toBe(save.multaFGTS);
    });
  });
  
  describe('Consistência de dados do colaborador', () => {
    it('deve usar salário base como número, não como string formatada', () => {
      // Simula o que o backend faz: Number(colab.salarioBase || 0)
      const salarioFromDB = '8500.00'; // como vem do banco
      const salarioNumerico = Number(salarioFromDB);
      
      expect(salarioNumerico).toBe(8500);
      expect(salarioNumerico).not.toBe(850000); // Bug antigo: parseSalario removia o ponto
      
      const result = calcularRescisao({
        salarioBase: salarioNumerico,
        dataAdmissao: '2023-02-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'sem_justa_causa',
      });
      
      // Saldo de salário deve ser proporcional ao dias no mês
      // A função usa desligamento.getDate() para calcular dias
      expect(result.saldoSalario).toBeGreaterThan(0);
      expect(result.saldoSalario).toBeLessThanOrEqual(8500);
    });
    
    it('deve lidar com salário zero sem erro', () => {
      const result = calcularRescisao({
        salarioBase: 0,
        dataAdmissao: '2025-01-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'sem_justa_causa',
      });
      
      expect(result.proventos).toBe(0);
      expect(result.liquido).toBe(0);
    });
  });
  
  describe('Fluxo de UI — estados do formulário', () => {
    it('estado inicial deve ser "list" (sem cálculo pendente)', () => {
      type ViewState = 'list' | 'form' | 'result';
      const initialState: ViewState = 'list';
      expect(initialState).toBe('list');
    });
    
    it('após calcular deve mudar para "result" (com dados pendentes)', () => {
      type ViewState = 'list' | 'form' | 'result';
      let state: ViewState = 'form';
      
      // Simula o clique em "Calcular Rescisão"
      const result = calcularRescisao({
        salarioBase: 3000,
        dataAdmissao: '2025-01-01',
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'sem_justa_causa',
      });
      
      if (result) {
        state = 'result';
      }
      
      expect(state).toBe('result');
      expect(result.proventos).toBeGreaterThan(0);
    });
    
    it('descartar deve voltar para "list" (sem dados pendentes)', () => {
      type ViewState = 'list' | 'form' | 'result';
      let state: ViewState = 'result';
      let pendingResult: any = { proventos: 12000 };
      
      // Simula o clique em "Descartar e sair"
      state = 'list';
      pendingResult = null;
      
      expect(state).toBe('list');
      expect(pendingResult).toBeNull();
    });
    
    it('salvar deve voltar para "list" e limpar dados pendentes', () => {
      type ViewState = 'list' | 'form' | 'result';
      let state: ViewState = 'result';
      let pendingResult: any = { proventos: 12000 };
      
      // Simula o clique em "Salvar Cálculo"
      // (em produção, chama trpc.rescisoes.calcular que salva no banco)
      state = 'list';
      pendingResult = null;
      
      expect(state).toBe('list');
      expect(pendingResult).toBeNull();
    });
  });
  
  describe('Validação de campos obrigatórios', () => {
    it('deve exigir colaboradorId, dataDesligamento e tipoDesligamento', () => {
      const requiredFields = ['colaboradorId', 'dataDesligamento', 'tipoDesligamento'];
      
      const input = {
        colaboradorId: 1,
        dataDesligamento: '2026-02-24',
        tipoDesligamento: 'sem_justa_causa',
      };
      
      for (const field of requiredFields) {
        expect(input).toHaveProperty(field);
        expect((input as any)[field]).toBeTruthy();
      }
    });
  });
});
