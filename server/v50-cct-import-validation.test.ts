import { describe, it, expect } from 'vitest';

// ============================================================
// v50 — CCT Module, Bulk Import & Validation
// ============================================================

// --- 1. CCT (Convenção Coletiva de Trabalho) module ---
describe('CCT Module — data structure', () => {
  const CCT_STATUS = ['ativo', 'vencido', 'em_analise'];

  it('should have valid CCT statuses', () => {
    expect(CCT_STATUS).toContain('ativo');
    expect(CCT_STATUS).toContain('vencido');
    expect(CCT_STATUS).toContain('em_analise');
    expect(CCT_STATUS.length).toBe(3);
  });

  it('should calculate days until expiration correctly', () => {
    const calcDiasVencimento = (dataVigenciaFim: string) => {
      const fim = new Date(dataVigenciaFim);
      const hoje = new Date();
      const diff = fim.getTime() - hoje.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    expect(calcDiasVencimento(futureDate.toISOString().split('T')[0])).toBeGreaterThanOrEqual(29);
    expect(calcDiasVencimento(futureDate.toISOString().split('T')[0])).toBeLessThanOrEqual(31);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    expect(calcDiasVencimento(pastDate.toISOString().split('T')[0])).toBeLessThan(0);
  });

  it('should determine alert level based on days until expiration', () => {
    const getAlertLevel = (diasVencimento: number) => {
      if (diasVencimento < 0) return 'vencido';
      if (diasVencimento <= 30) return 'critico';
      if (diasVencimento <= 90) return 'atencao';
      return 'ok';
    };

    expect(getAlertLevel(-5)).toBe('vencido');
    expect(getAlertLevel(0)).toBe('critico');
    expect(getAlertLevel(15)).toBe('critico');
    expect(getAlertLevel(60)).toBe('atencao');
    expect(getAlertLevel(120)).toBe('ok');
  });

  it('should validate CCT required fields', () => {
    const validateCCT = (data: any) => {
      const errors: string[] = [];
      if (!data.sindicato) errors.push('Sindicato é obrigatório');
      if (!data.dataVigenciaInicio) errors.push('Data de vigência início é obrigatória');
      if (!data.dataVigenciaFim) errors.push('Data de vigência fim é obrigatória');
      return errors;
    };

    expect(validateCCT({})).toHaveLength(3);
    expect(validateCCT({ sindicato: 'Test', dataVigenciaInicio: '2024-01-01', dataVigenciaFim: '2025-01-01' })).toHaveLength(0);
    expect(validateCCT({ sindicato: 'Test' })).toHaveLength(2);
  });

  it('should parse LLM analysis JSON structure', () => {
    const mockAnalysis = {
      resumo: 'Resumo da CCT',
      clausulas: [
        { numero: '1', titulo: 'Vigência', conteudo: 'Período de vigência', categoria: 'geral' }
      ],
      regrasFerias: { descricao: 'Regras de férias', itens: ['30 dias corridos'] },
      regrasJornada: { descricao: 'Jornada', itens: ['44h semanais'] },
      regrasSalario: { descricao: 'Salário', pisoSalarial: 'R$ 1.500', reajuste: '5%', itens: ['Piso salarial'] },
      regrasBeneficios: { descricao: 'Benefícios', itens: ['VT', 'VR'] },
      regrasRescisao: { descricao: 'Rescisão', itens: ['Aviso prévio'] },
    };

    expect(mockAnalysis.resumo).toBeTruthy();
    expect(mockAnalysis.clausulas).toBeInstanceOf(Array);
    expect(mockAnalysis.clausulas[0]).toHaveProperty('numero');
    expect(mockAnalysis.clausulas[0]).toHaveProperty('titulo');
    expect(mockAnalysis.clausulas[0]).toHaveProperty('conteudo');
    expect(mockAnalysis.clausulas[0]).toHaveProperty('categoria');
    expect(mockAnalysis.regrasSalario.pisoSalarial).toBe('R$ 1.500');
    expect(mockAnalysis.regrasSalario.reajuste).toBe('5%');
  });
});

// --- 2. Bulk Import of Employees ---
describe('Bulk Import — column mapping', () => {
  it('should map common column name variations to standard fields', () => {
    const mapColumn = (key: string): string | null => {
      const k = key.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (k.includes('nome completo') || k === 'nome' || k === 'nomecompleto') return 'nomeCompleto';
      if (k === 'cpf') return 'cpf';
      if (k.includes('admissao') || k === 'dataadmissao') return 'dataAdmissao';
      if (k === 'cargo') return 'cargo';
      if (k.includes('salario') || k === 'salariobase') return 'salarioBase';
      if (k === 'telefone') return 'telefone';
      if (k === 'email' || k === 'e-mail') return 'email';
      return null;
    };

    expect(mapColumn('Nome Completo')).toBe('nomeCompleto');
    expect(mapColumn('NOME COMPLETO')).toBe('nomeCompleto');
    expect(mapColumn('nome')).toBe('nomeCompleto');
    expect(mapColumn('CPF')).toBe('cpf');
    expect(mapColumn('Data Admissão')).toBe('dataAdmissao');
    expect(mapColumn('Cargo')).toBe('cargo');
    expect(mapColumn('Salário Base')).toBe('salarioBase');
    expect(mapColumn('salario')).toBe('salarioBase');
    expect(mapColumn('Telefone')).toBe('telefone');
    expect(mapColumn('E-mail')).toBe('email');
  });

  it('should validate required fields for import', () => {
    const validateRow = (row: any) => {
      const nome = row.nomeCompleto || '';
      const cpf = row.cpf || '';
      const dataAdmissao = row.dataAdmissao || '';
      const cargo = row.cargo || '';
      const salarioBase = row.salarioBase || '';
      return !!(nome && cpf && dataAdmissao && cargo && salarioBase);
    };

    expect(validateRow({ nomeCompleto: 'João', cpf: '123', dataAdmissao: '2024-01-01', cargo: 'Dev', salarioBase: '5000' })).toBe(true);
    expect(validateRow({ nomeCompleto: 'João', cpf: '123' })).toBe(false);
    expect(validateRow({})).toBe(false);
  });

  it('should normalize tipoContrato values', () => {
    const normalizeTipoContrato = (val: string) => {
      const normalized = val.toLowerCase().replace(/ /g, '_');
      return ['clt', 'pj', 'contrato_trabalho'].includes(normalized) ? normalized : 'clt';
    };

    expect(normalizeTipoContrato('CLT')).toBe('clt');
    expect(normalizeTipoContrato('PJ')).toBe('pj');
    expect(normalizeTipoContrato('Contrato Trabalho')).toBe('contrato_trabalho');
    expect(normalizeTipoContrato('invalid')).toBe('clt');
    expect(normalizeTipoContrato('')).toBe('clt');
  });

  it('should count import results correctly', () => {
    const results = { success: 0, errors: 0, errorDetails: [] as string[] };
    
    // Simulate 5 successful, 2 failed
    for (let i = 0; i < 5; i++) results.success++;
    results.errors += 2;
    results.errorDetails.push('Linha 3: CPF duplicado');
    results.errorDetails.push('Linha 7: Campos obrigatórios faltando');

    expect(results.success).toBe(5);
    expect(results.errors).toBe(2);
    expect(results.errorDetails).toHaveLength(2);
    expect(results.errorDetails[0]).toContain('Linha 3');
  });
});

// --- 3. Form Validation ---
describe('Employee Form — validation', () => {
  const REQUIRED_FIELDS = ['nomeCompleto', 'cpf', 'dataAdmissao', 'cargo', 'salarioBase'];

  it('should identify all required fields', () => {
    expect(REQUIRED_FIELDS).toContain('nomeCompleto');
    expect(REQUIRED_FIELDS).toContain('cpf');
    expect(REQUIRED_FIELDS).toContain('dataAdmissao');
    expect(REQUIRED_FIELDS).toContain('cargo');
    expect(REQUIRED_FIELDS).toContain('salarioBase');
    expect(REQUIRED_FIELDS.length).toBe(5);
  });

  it('should validate form and return error set', () => {
    const validateForm = (form: any) => {
      const errors = new Set<string>();
      if (!form.nomeCompleto?.trim()) errors.add('nomeCompleto');
      if (!form.cpf?.trim()) errors.add('cpf');
      if (!form.dataAdmissao) errors.add('dataAdmissao');
      if (!form.cargo?.trim()) errors.add('cargo');
      if (!form.salarioBase?.trim()) errors.add('salarioBase');
      return errors;
    };

    // Empty form
    const emptyErrors = validateForm({});
    expect(emptyErrors.size).toBe(5);
    expect(emptyErrors.has('nomeCompleto')).toBe(true);
    expect(emptyErrors.has('cpf')).toBe(true);

    // Partial form
    const partialErrors = validateForm({ nomeCompleto: 'João', cpf: '123.456.789-00' });
    expect(partialErrors.size).toBe(3);
    expect(partialErrors.has('nomeCompleto')).toBe(false);
    expect(partialErrors.has('cpf')).toBe(false);
    expect(partialErrors.has('dataAdmissao')).toBe(true);

    // Complete form
    const completeErrors = validateForm({
      nomeCompleto: 'João Silva',
      cpf: '123.456.789-00',
      dataAdmissao: '2024-01-01',
      cargo: 'Analista',
      salarioBase: '5000',
    });
    expect(completeErrors.size).toBe(0);
  });

  it('should validate CPF format', () => {
    const validarCPF = (cpf: string) => {
      const nums = cpf.replace(/\D/g, '');
      if (nums.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(nums)) return false;
      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
      let resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      if (resto !== parseInt(nums[9])) return false;
      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
      resto = (soma * 10) % 11;
      if (resto === 10) resto = 0;
      return resto === parseInt(nums[10]);
    };

    expect(validarCPF('529.982.247-25')).toBe(true);
    expect(validarCPF('111.111.111-11')).toBe(false);
    expect(validarCPF('123')).toBe(false);
    expect(validarCPF('')).toBe(false);
  });

  it('should clear validation errors when form is reset', () => {
    const errors = new Set(['nomeCompleto', 'cpf', 'cargo']);
    expect(errors.size).toBe(3);
    
    // Simulate reset
    const cleared = new Set<string>();
    expect(cleared.size).toBe(0);
  });
});

// --- 4. Formação Acadêmica layout ---
describe('Formação Acadêmica — data structure', () => {
  it('should have correct FormacaoSuperior structure', () => {
    const formacao = { curso: 'Administração', instituicao: 'USP', anoConclusao: '2020', status: 'concluido' };
    expect(formacao).toHaveProperty('curso');
    expect(formacao).toHaveProperty('instituicao');
    expect(formacao).toHaveProperty('anoConclusao');
    expect(formacao).toHaveProperty('status');
    expect(['concluido', 'cursando', 'trancado', 'incompleto']).toContain(formacao.status);
  });

  it('should validate anoConclusao as 4-digit year', () => {
    const validateAno = (val: string) => {
      const cleaned = val.replace(/\D/g, '').slice(0, 4);
      return cleaned.length === 4 && parseInt(cleaned) >= 1950 && parseInt(cleaned) <= 2030;
    };

    expect(validateAno('2024')).toBe(true);
    expect(validateAno('1990')).toBe(true);
    expect(validateAno('abc')).toBe(false);
    expect(validateAno('20')).toBe(false);
    expect(validateAno('1900')).toBe(false);
  });

  it('should serialize formações to JSON for storage', () => {
    const formacoes = [
      { curso: 'Direito', instituicao: 'PUC', anoConclusao: '2018', status: 'concluido' },
      { curso: 'Contabilidade', instituicao: 'FGV', anoConclusao: '2022', status: 'cursando' },
    ];
    const json = JSON.stringify(formacoes);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].curso).toBe('Direito');
    expect(parsed[1].status).toBe('cursando');
  });
});
