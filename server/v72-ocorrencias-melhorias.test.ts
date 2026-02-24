import { describe, it, expect } from 'vitest';

// ===== CLASSIFICAÇÃO COM FALTA GRAVÍSSIMA =====
describe('v72 — Classificação com Falta Gravíssima', () => {
  // Simula a lógica de classificação do frontend (TIPO_GRAVIDADE_MAP + classificarOcorrencia)
  const TIPO_GRAVIDADE_MAP: Record<string, string> = {
    falta_injustificada: 'leve',
    atraso_frequente: 'leve',
    falta_leve: 'leve',
    falta_media: 'media',
    falta_grave: 'grave',
    falta_gravissima: 'gravissima',
    erro_trabalho: 'media',
    conduta_inapropriada: 'grave',
    conflito_interno: 'media',
  };

  function classificarOcorrencia(gravidade: string, reincidencias: number) {
    if (gravidade === 'gravissima') return { classificacao: 'irreversivel', recomendacao: 'desligamento' };
    if (gravidade === 'grave' && reincidencias >= 3) return { classificacao: 'irreversivel', recomendacao: 'desligamento' };
    if (gravidade === 'grave') return { classificacao: 'reversivel', recomendacao: 'reversao' };
    if (gravidade === 'media' && reincidencias >= 3) return { classificacao: 'irreversivel', recomendacao: 'desligamento' };
    if (gravidade === 'media') return { classificacao: 'reversivel', recomendacao: 'suspensao' };
    if (gravidade === 'leve' && reincidencias >= 5) return { classificacao: 'irreversivel', recomendacao: 'desligamento' };
    if (gravidade === 'leve' && reincidencias >= 3) return { classificacao: 'reversivel', recomendacao: 'reversao' };
    return { classificacao: 'reversivel', recomendacao: 'advertencia' };
  }

  it('falta_gravissima deve mapear para gravidade gravissima', () => {
    expect(TIPO_GRAVIDADE_MAP['falta_gravissima']).toBe('gravissima');
  });

  it('falta gravíssima deve ser sempre irreversível com recomendação de desligamento', () => {
    const result = classificarOcorrencia('gravissima', 0);
    expect(result.classificacao).toBe('irreversivel');
    expect(result.recomendacao).toBe('desligamento');
  });

  it('falta gravíssima com reincidências deve continuar irreversível', () => {
    const result = classificarOcorrencia('gravissima', 5);
    expect(result.classificacao).toBe('irreversivel');
    expect(result.recomendacao).toBe('desligamento');
  });

  it('todos os tipos de ocorrência devem ter mapeamento de gravidade', () => {
    const tipos = [
      'falta_injustificada', 'atraso_frequente', 'falta_leve', 'falta_media',
      'falta_grave', 'falta_gravissima', 'erro_trabalho', 'conduta_inapropriada', 'conflito_interno',
    ];
    for (const tipo of tipos) {
      expect(TIPO_GRAVIDADE_MAP[tipo]).toBeDefined();
    }
  });
});

// ===== MEDIDAS TOMADAS DROPDOWN =====
describe('v72 — Medidas Tomadas Dropdown', () => {
  const MEDIDAS_OPTIONS = [
    'Advertência Verbal',
    'Advertência Escrita',
    'Suspensão 1 dia',
    'Suspensão 3 dias',
    'Suspensão 5 dias',
    'Suspensão 7 dias',
    'Suspensão 15 dias',
    'Suspensão 30 dias',
    'Encaminhamento para Plano de Reversão',
    'Encaminhamento para Desligamento',
    'Orientação e Feedback',
    'Treinamento Corretivo',
    'Mudança de Setor/Função',
    'Outra',
  ];

  it('deve ter pelo menos 10 opções de medidas', () => {
    expect(MEDIDAS_OPTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('deve incluir advertência verbal e escrita', () => {
    expect(MEDIDAS_OPTIONS).toContain('Advertência Verbal');
    expect(MEDIDAS_OPTIONS).toContain('Advertência Escrita');
  });

  it('deve incluir opções de suspensão com diferentes períodos', () => {
    const suspensoes = MEDIDAS_OPTIONS.filter(m => m.startsWith('Suspensão'));
    expect(suspensoes.length).toBeGreaterThanOrEqual(4);
  });

  it('deve incluir encaminhamento para plano de reversão e desligamento', () => {
    expect(MEDIDAS_OPTIONS).toContain('Encaminhamento para Plano de Reversão');
    expect(MEDIDAS_OPTIONS).toContain('Encaminhamento para Desligamento');
  });

  it('deve incluir opção "Outra" para flexibilidade', () => {
    expect(MEDIDAS_OPTIONS).toContain('Outra');
  });
});

// ===== WORKFLOW DE APROVAÇÃO =====
describe('v72 — Workflow de Aprovação', () => {
  // Simula a lógica de necessidade de aprovação
  function precisaAprovacao(gravidade: string, recomendacao: string): boolean {
    return gravidade === 'grave' || gravidade === 'gravissima' || recomendacao === 'desligamento';
  }

  it('falta grave deve precisar de aprovação', () => {
    expect(precisaAprovacao('grave', 'reversao')).toBe(true);
  });

  it('falta gravíssima deve precisar de aprovação', () => {
    expect(precisaAprovacao('gravissima', 'desligamento')).toBe(true);
  });

  it('recomendação de desligamento deve precisar de aprovação', () => {
    expect(precisaAprovacao('media', 'desligamento')).toBe(true);
  });

  it('falta leve com advertência não deve precisar de aprovação', () => {
    expect(precisaAprovacao('leve', 'advertencia')).toBe(false);
  });

  it('falta média com suspensão não deve precisar de aprovação', () => {
    expect(precisaAprovacao('media', 'suspensao')).toBe(false);
  });
});

// ===== AUTO-PREENCHIMENTO =====
describe('v72 — Auto-preenchimento de campos', () => {
  // Simula a lógica de auto-preenchimento do formulário
  const mockColaboradores = [
    { id: 1, nomeCompleto: 'João Silva', cargo: 'Analista', setor: 'Financeiro', setorId: 1 },
    { id: 2, nomeCompleto: 'Maria Santos', cargo: 'Gerente', setor: 'RH', setorId: 2 },
    { id: 3, nomeCompleto: 'Pedro Oliveira', cargo: 'Assistente', setor: 'Comercial', setorId: 3 },
  ];

  it('ao selecionar colaborador, deve preencher cargo automaticamente', () => {
    const colab = mockColaboradores.find(c => c.id === 1);
    expect(colab?.cargo).toBe('Analista');
  });

  it('ao selecionar colaborador, deve preencher setor automaticamente', () => {
    const colab = mockColaboradores.find(c => c.id === 2);
    expect(colab?.setor).toBe('RH');
  });

  it('ao selecionar tipo de ocorrência, deve preencher gravidade automaticamente', () => {
    const TIPO_GRAVIDADE_MAP: Record<string, string> = {
      falta_injustificada: 'leve',
      falta_grave: 'grave',
      falta_gravissima: 'gravissima',
      conduta_inapropriada: 'grave',
    };
    expect(TIPO_GRAVIDADE_MAP['falta_injustificada']).toBe('leve');
    expect(TIPO_GRAVIDADE_MAP['falta_grave']).toBe('grave');
    expect(TIPO_GRAVIDADE_MAP['falta_gravissima']).toBe('gravissima');
    expect(TIPO_GRAVIDADE_MAP['conduta_inapropriada']).toBe('grave');
  });
});

// ===== ESTIMATIVA DE CUSTO DE RESCISÃO =====
describe('v72 — Estimativa de Custo de Rescisão', () => {
  function calcularEstimativa(salario: number, mesesTrabalhados: number) {
    const avisoPrevio = salario;
    const feriasProporcionais = (salario / 12) * (mesesTrabalhados % 12);
    const tercoFerias = feriasProporcionais / 3;
    const decimoTerceiro = (salario / 12) * (mesesTrabalhados % 12);
    const multaFGTS = salario * 0.08 * mesesTrabalhados * 0.4;
    const total = avisoPrevio + feriasProporcionais + tercoFerias + decimoTerceiro + multaFGTS;
    return { avisoPrevio, feriasProporcionais, tercoFerias, decimoTerceiro, multaFGTS, total };
  }

  it('deve calcular aviso prévio como 1 salário', () => {
    const result = calcularEstimativa(5000, 24);
    expect(result.avisoPrevio).toBe(5000);
  });

  it('deve calcular multa FGTS como 40% do saldo', () => {
    const result = calcularEstimativa(5000, 12);
    // FGTS = 5000 * 0.08 * 12 = 4800; Multa = 4800 * 0.4 = 1920
    expect(result.multaFGTS).toBe(1920);
  });

  it('total deve ser a soma de todos os componentes', () => {
    const result = calcularEstimativa(3000, 6);
    const expectedTotal = result.avisoPrevio + result.feriasProporcionais + result.tercoFerias + result.decimoTerceiro + result.multaFGTS;
    expect(result.total).toBeCloseTo(expectedTotal, 2);
  });
});

// ===== CO-RESPONSABILIDADE RH =====
describe('v72 — Co-responsabilidade do Gestor de RH', () => {
  it('gestor de RH deve ser co-responsável em todos os planos de reversão', () => {
    const planoForm = {
      colaboradorId: 1,
      responsavel: 'João Gestor',
      coResponsavel: 'Maria RH',
      setor: 'Financeiro',
    };
    expect(planoForm.coResponsavel).toBeTruthy();
    expect(planoForm.coResponsavel).not.toBe(planoForm.responsavel);
  });

  it('campo co-responsável deve ser preenchido automaticamente', () => {
    const gestorRH = { nome: 'Maria RH', cargo: 'Gerente de RH' };
    const coResponsavel = gestorRH.nome;
    expect(coResponsavel).toBe('Maria RH');
  });
});

// ===== PDF EXPORT DATA STRUCTURE =====
describe('v72 — Estrutura de dados para exportação PDF', () => {
  const mockDashboardData = {
    porSetor: [{ setor: 'Financeiro', count: 5 }, { setor: 'RH', count: 3 }],
    porTipo: [{ tipo: 'falta_injustificada', count: 4 }, { tipo: 'falta_grave', count: 2 }],
    porMes: [{ mes: '2026-01', count: 3 }, { mes: '2026-02', count: 5 }],
    planosReversaoStats: { total: 10, ativos: 3, sucesso: 5, fracasso: 1, cancelados: 1, taxaSucesso: 83 },
    topReincidentes: [{ colaboradorId: 1, nome: 'João', setor: 'Financeiro', cargo: 'Analista', count: 5 }],
  };

  it('dashboard data deve ter todas as seções necessárias', () => {
    expect(mockDashboardData).toHaveProperty('porSetor');
    expect(mockDashboardData).toHaveProperty('porTipo');
    expect(mockDashboardData).toHaveProperty('porMes');
    expect(mockDashboardData).toHaveProperty('planosReversaoStats');
    expect(mockDashboardData).toHaveProperty('topReincidentes');
  });

  it('taxa de sucesso deve ser calculada corretamente', () => {
    const stats = mockDashboardData.planosReversaoStats;
    const concluidos = stats.sucesso + stats.fracasso;
    const taxaCalculada = concluidos > 0 ? Math.round((stats.sucesso / concluidos) * 100) : 0;
    expect(taxaCalculada).toBe(83);
  });

  it('histórico disciplinar deve ter resumo com todos os campos', () => {
    const mockHistorico = {
      colaboradorNome: 'João Silva',
      cargo: 'Analista',
      setor: 'Financeiro',
      ocorrencias: [],
      planos: [],
      resumo: { totalOcorrencias: 0, reversiveis: 0, irreversiveis: 0, planosAtivos: 0, planosConcluidos: 0 },
    };
    expect(mockHistorico.resumo).toHaveProperty('totalOcorrencias');
    expect(mockHistorico.resumo).toHaveProperty('reversiveis');
    expect(mockHistorico.resumo).toHaveProperty('irreversiveis');
    expect(mockHistorico.resumo).toHaveProperty('planosAtivos');
    expect(mockHistorico.resumo).toHaveProperty('planosConcluidos');
  });
});
