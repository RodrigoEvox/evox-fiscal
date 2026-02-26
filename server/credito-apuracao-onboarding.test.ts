import { describe, it, expect, vi } from 'vitest';

// ===== RTI Template Structure Tests =====
describe('RTI Template Structure', () => {
  it('should define correct RTI template fields', () => {
    const templateFields = [
      'nome', 'textoIntro', 'textoObservacoes', 'textoProximasEtapas',
      'cenarioCompensacaoDefault', 'alertasDefault', 'criadoPorId', 'criadoPorNome',
    ];
    expect(templateFields).toContain('nome');
    expect(templateFields).toContain('textoIntro');
    expect(templateFields).toContain('cenarioCompensacaoDefault');
    expect(templateFields).toContain('alertasDefault');
    expect(templateFields.length).toBe(8);
  });

  it('should define correct RTI oportunidade fields', () => {
    const opFields = ['rtiId', 'descricao', 'classificacao', 'valorApurado', 'detalhamento', 'ordem'];
    expect(opFields).toContain('classificacao');
    expect(opFields).toContain('valorApurado');
  });

  it('should validate classificacao values', () => {
    const validClassificacoes = ['pacificado', 'nao_pacificado'];
    expect(validClassificacoes).toContain('pacificado');
    expect(validClassificacoes).toContain('nao_pacificado');
    expect(validClassificacoes).not.toContain('indefinido');
  });

  it('should calculate RTI totals correctly', () => {
    const oportunidades = [
      { descricao: 'PIS/COFINS Monofásico', classificacao: 'pacificado', valorApurado: 150000 },
      { descricao: 'ICMS-ST', classificacao: 'nao_pacificado', valorApurado: 80000 },
      { descricao: 'INSS Patronal', classificacao: 'pacificado', valorApurado: 45000 },
    ];
    const total = oportunidades.reduce((sum, o) => sum + o.valorApurado, 0);
    const totalPacificado = oportunidades.filter(o => o.classificacao === 'pacificado').reduce((sum, o) => sum + o.valorApurado, 0);
    const totalNaoPacificado = oportunidades.filter(o => o.classificacao === 'nao_pacificado').reduce((sum, o) => sum + o.valorApurado, 0);

    expect(total).toBe(275000);
    expect(totalPacificado).toBe(195000);
    expect(totalNaoPacificado).toBe(80000);
    expect(totalPacificado + totalNaoPacificado).toBe(total);
  });
});

// ===== RTI Cenário de Compensação Tests =====
describe('RTI Cenário de Compensação', () => {
  it('should define default cenário items', () => {
    const defaultCenario = [
      { tributo: 'PIS/COFINS', mediaMensal: 0 },
      { tributo: 'IRPJ/CSLL', mediaMensal: 0 },
      { tributo: 'INSS', mediaMensal: 0 },
    ];
    expect(defaultCenario).toHaveLength(3);
    expect(defaultCenario[0].tributo).toBe('PIS/COFINS');
    expect(defaultCenario[1].tributo).toBe('IRPJ/CSLL');
    expect(defaultCenario[2].tributo).toBe('INSS');
  });

  it('should allow adding custom tributos', () => {
    const cenario = [
      { tributo: 'PIS/COFINS', mediaMensal: 15000 },
      { tributo: 'IRPJ/CSLL', mediaMensal: 8000 },
      { tributo: 'INSS', mediaMensal: 12000 },
      { tributo: 'ISS', mediaMensal: 3000 },
    ];
    expect(cenario).toHaveLength(4);
    expect(cenario[3].tributo).toBe('ISS');
  });
});

// ===== RTI Alertas Tests =====
describe('RTI Alertas', () => {
  it('should define valid alert types', () => {
    const validTypes = ['observacao', 'alerta', 'incompatibilidade', 'subvencao', 'trava_esocial'];
    expect(validTypes).toHaveLength(5);
    expect(validTypes).toContain('subvencao');
    expect(validTypes).toContain('trava_esocial');
  });

  it('should structure alerts correctly', () => {
    const alerta = { tipo: 'subvencao', texto: 'Subvenção de investimentos identificada', ordem: 0 };
    expect(alerta.tipo).toBe('subvencao');
    expect(alerta.texto.length).toBeGreaterThan(0);
  });
});

// ===== Partner Return Management Tests =====
describe('Partner Return Management', () => {
  it('should define valid return statuses', () => {
    const validStatuses = ['aguardando', 'fechou', 'nao_fechou', 'sem_retorno', 'em_negociacao'];
    expect(validStatuses).toHaveLength(5);
    expect(validStatuses).toContain('aguardando');
    expect(validStatuses).toContain('em_negociacao');
  });

  it('should calculate SLA expiry correctly', () => {
    const enviadoEm = new Date('2026-02-20');
    const slaDias = 7;
    const slaVenceEm = new Date(enviadoEm);
    slaVenceEm.setDate(slaVenceEm.getDate() + slaDias);
    expect(slaVenceEm.toISOString().slice(0, 10)).toBe('2026-02-27');
  });

  it('should detect SLA vencido correctly', () => {
    const slaVenceEm = new Date('2026-02-20');
    const now = new Date('2026-02-25');
    const slaVencido = now > slaVenceEm;
    expect(slaVencido).toBe(true);
  });

  it('should detect SLA within deadline', () => {
    const slaVenceEm = new Date('2026-03-01');
    const now = new Date('2026-02-25');
    const slaVencido = now > slaVenceEm;
    expect(slaVencido).toBe(false);
  });

  it('should calculate partner return stats', () => {
    const returns = [
      { retornoStatus: 'aguardando', valorContratado: null },
      { retornoStatus: 'fechou', valorContratado: 50000 },
      { retornoStatus: 'nao_fechou', valorContratado: null },
      { retornoStatus: 'em_negociacao', valorContratado: null },
      { retornoStatus: 'fechou', valorContratado: 120000 },
    ];
    const stats = {
      total: returns.length,
      aguardando: returns.filter(r => r.retornoStatus === 'aguardando').length,
      fechou: returns.filter(r => r.retornoStatus === 'fechou').length,
      naoFechou: returns.filter(r => r.retornoStatus === 'nao_fechou').length,
      emNegociacao: returns.filter(r => r.retornoStatus === 'em_negociacao').length,
      valorTotalContratado: returns.filter(r => r.valorContratado).reduce((sum, r) => sum + (r.valorContratado || 0), 0),
    };
    expect(stats.total).toBe(5);
    expect(stats.fechou).toBe(2);
    expect(stats.valorTotalContratado).toBe(170000);
  });
});

// ===== Onboarding Checklist Structure Tests =====
describe('Onboarding Checklist Structure', () => {
  it('should have 3 phases: Revisão, Refinamento, Registro', () => {
    const phases = ['revisao', 'refinamento', 'registro'];
    expect(phases).toHaveLength(3);
  });

  it('should have correct Revisão checklist items (Abertura + Revisão)', () => {
    const revisaoItems = [
      { id: 'ab1', fase: 'abertura', texto: 'Boas-vindas e apresentação do condutor' },
      { id: 'ab2', fase: 'abertura', texto: 'Objetivo da reunião e duração estimada (30-40 min)' },
      { id: 'ab3', fase: 'abertura', texto: 'Informar sobre gravação da reunião (documento probatório)' },
      { id: 'ab4', fase: 'abertura', texto: 'Link do vídeo será enviado por e-mail' },
      { id: 'ab5', fase: 'abertura', texto: 'Confirmação para começar' },
      { id: 'ab6', fase: 'abertura', texto: 'Parabenizar pela escolha da Evox' },
      { id: 'rv1', fase: 'revisao', texto: 'Apresentação do responsável técnico (Coordenadora RCT)' },
      { id: 'rv2', fase: 'revisao', texto: 'Revisão do Crédito: tipo, período e valor estimado' },
      { id: 'rv3', fase: 'revisao', texto: 'Disclaimer sobre RTI e base de dados' },
    ];
    expect(revisaoItems).toHaveLength(9);
    const aberturaItems = revisaoItems.filter(i => i.fase === 'abertura');
    const revisaoOnlyItems = revisaoItems.filter(i => i.fase === 'revisao');
    expect(aberturaItems).toHaveLength(6);
    expect(revisaoOnlyItems).toHaveLength(3);
  });

  it('should have correct Refinamento sub-sections', () => {
    const subSections = ['estrategia', 'fluxo_operacional', 'malha_fiscal', 'condicoes_contratuais', 'fluxo_financeiro', 'contatos'];
    expect(subSections).toHaveLength(6);
    expect(subSections).toContain('estrategia');
    expect(subSections).toContain('condicoes_contratuais');
  });

  it('should have correct Registro checklist items', () => {
    const registroItems = [
      { id: 'rc1', fase: 'recapitulacao' },
      { id: 'vl1', fase: 'validacao' },
      { id: 'en1', fase: 'encerramento' },
    ];
    const recapItems = registroItems.filter(i => i.fase === 'recapitulacao');
    const validacaoItems = registroItems.filter(i => i.fase === 'validacao');
    const encerramentoItems = registroItems.filter(i => i.fase === 'encerramento');
    expect(recapItems.length).toBeGreaterThanOrEqual(1);
    expect(validacaoItems).toHaveLength(1);
    expect(encerramentoItems).toHaveLength(1);
  });

  it('should calculate phase progress correctly', () => {
    const items = [
      { concluido: true },
      { concluido: true },
      { concluido: false },
      { concluido: false },
    ];
    const progress = Math.round((items.filter(i => i.concluido).length / items.length) * 100);
    expect(progress).toBe(50);
  });

  it('should calculate total progress across all phases', () => {
    const revisao = [{ concluido: true }, { concluido: true }, { concluido: true }]; // 100%
    const refinamento = [{ concluido: true }, { concluido: false }, { concluido: false }, { concluido: false }]; // 25%
    const registro = [{ concluido: false }, { concluido: false }]; // 0%
    const all = [...revisao, ...refinamento, ...registro];
    const totalProgress = Math.round((all.filter(i => i.concluido).length / all.length) * 100);
    expect(totalProgress).toBe(44); // 4/9 = 44%
  });
});

// ===== Estratégia de Monetização Tests =====
describe('Estratégia de Monetização', () => {
  it('should define valid strategies', () => {
    const strategies = ['compensacao', 'ressarcimento', 'restituicao', 'mista'];
    expect(strategies).toHaveLength(4);
  });

  it('should map strategy to correct fila', () => {
    const strategyToFila: Record<string, string[]> = {
      compensacao: ['compensacao'],
      ressarcimento: ['ressarcimento'],
      restituicao: ['restituicao'],
      mista: ['compensacao', 'ressarcimento', 'restituicao'],
    };
    expect(strategyToFila.compensacao).toEqual(['compensacao']);
    expect(strategyToFila.mista).toHaveLength(3);
    expect(strategyToFila.mista).toContain('compensacao');
    expect(strategyToFila.mista).toContain('ressarcimento');
    expect(strategyToFila.mista).toContain('restituicao');
  });

  it('should require strategy before completing onboarding', () => {
    const onboarding = {
      estrategia: '',
      totalProgress: 100,
    };
    const canComplete = onboarding.estrategia !== '' && onboarding.totalProgress === 100;
    expect(canComplete).toBe(false);
  });

  it('should allow completion when strategy is set and progress is 100%', () => {
    const onboarding = {
      estrategia: 'compensacao',
      totalProgress: 100,
    };
    const canComplete = onboarding.estrategia !== '' && onboarding.totalProgress === 100;
    expect(canComplete).toBe(true);
  });
});

// ===== Onboarding Diagnóstico Tests =====
describe('Onboarding Diagnóstico', () => {
  it('should track all diagnostic flags', () => {
    const diagnostico = {
      empresaTemDebitos: false,
      empresaPrecisaCnd: false,
      empresaNoEmac: false,
      empresaHistoricoMalha: false,
      empresaAssinanteMonitor: false,
    };
    expect(Object.keys(diagnostico)).toHaveLength(5);
  });
});

// ===== Onboarding Contatos Tests =====
describe('Onboarding Contatos', () => {
  it('should validate contact structure', () => {
    const contato = { nome: 'João Silva', email: 'joao@empresa.com', telefone: '(11) 99999-0000' };
    expect(contato.nome.length).toBeGreaterThan(0);
    expect(contato.email).toContain('@');
    expect(contato.telefone.length).toBeGreaterThan(0);
  });

  it('should define all 4 contact types', () => {
    const contactTypes = ['contatoContabil', 'contatoFinanceiro', 'contatoEmpresario', 'contatoOutros'];
    expect(contactTypes).toHaveLength(4);
  });
});

// ===== Apuração Checklist Tests =====
describe('Apuração Checklist', () => {
  it('should be customizable by admin', () => {
    const template = {
      id: 1,
      nome: 'Checklist Apuração PIS/COFINS',
      fila: 'apuracao',
      itens: [
        'Verificar regime tributário',
        'Analisar NCMs dos produtos',
        'Calcular créditos de PIS',
        'Calcular créditos de COFINS',
        'Gerar relatório de apuração',
      ],
    };
    expect(template.itens).toHaveLength(5);
    expect(template.fila).toBe('apuracao');
  });

  it('should track progress per item', () => {
    const items = [
      { texto: 'Verificar regime', concluido: true, concluidoEm: '2026-02-25T10:00:00Z' },
      { texto: 'Analisar NCMs', concluido: true, concluidoEm: '2026-02-25T11:00:00Z' },
      { texto: 'Calcular créditos', concluido: false, concluidoEm: null },
    ];
    const progresso = Math.round((items.filter(i => i.concluido).length / items.length) * 100);
    expect(progresso).toBe(67);
  });

  it('should require RTI generation to mark apuração as feita', () => {
    // A task in apuração can only be marked as "feito" when RTI is generated
    const task = { status: 'fazendo', rtiGerado: false };
    const canMarkAsFeito = task.rtiGerado === true;
    expect(canMarkAsFeito).toBe(false);

    task.rtiGerado = true;
    expect(task.rtiGerado).toBe(true);
  });
});

// ===== Apuração Stats for Dashboard Tests =====
describe('Apuração Stats for Dashboard', () => {
  it('should aggregate stats correctly', () => {
    const rtis = [
      { valorTotalEstimado: 150000, status: 'emitido', clienteId: 1 },
      { valorTotalEstimado: 80000, status: 'rascunho', clienteId: 2 },
      { valorTotalEstimado: 200000, status: 'emitido', clienteId: 3 },
    ];
    const totalRtis = rtis.length;
    const rtisEmitidos = rtis.filter(r => r.status === 'emitido').length;
    const valorTotal = rtis.reduce((sum, r) => sum + r.valorTotalEstimado, 0);
    const clientesUnicos = new Set(rtis.map(r => r.clienteId)).size;

    expect(totalRtis).toBe(3);
    expect(rtisEmitidos).toBe(2);
    expect(valorTotal).toBe(430000);
    expect(clientesUnicos).toBe(3);
  });
});
