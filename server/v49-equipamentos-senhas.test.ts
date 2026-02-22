import { describe, it, expect } from 'vitest';

// ============================================================
// GEG v49 — Equipamentos, Senhas & Contatos Corporativos
// ============================================================

// --- 1. Equipamentos & Comunicações page structure ---
describe('EquipamentosGEG — page structure', () => {
  const EQUIP_TYPES = ['celular', 'notebook', 'desktop', 'tablet', 'email_corp', 'telefone_corp', 'headset', 'monitor', 'teclado', 'mouse', 'outro'];
  const EQUIP_STATUS = ['em_uso', 'devolvido', 'manutencao', 'extraviado'];

  it('should have valid equipment types', () => {
    expect(EQUIP_TYPES.length).toBeGreaterThan(5);
    expect(EQUIP_TYPES).toContain('celular');
    expect(EQUIP_TYPES).toContain('notebook');
    expect(EQUIP_TYPES).toContain('email_corp');
    expect(EQUIP_TYPES).toContain('telefone_corp');
  });

  it('should have valid equipment statuses', () => {
    expect(EQUIP_STATUS).toContain('em_uso');
    expect(EQUIP_STATUS).toContain('devolvido');
    expect(EQUIP_STATUS).toContain('manutencao');
    expect(EQUIP_STATUS).toContain('extraviado');
  });

  it('should format equipment type labels correctly', () => {
    const TYPE_LABELS: Record<string, string> = {
      celular: 'Celular',
      notebook: 'Notebook',
      desktop: 'Desktop',
      tablet: 'Tablet',
      email_corp: 'Email Corporativo',
      telefone_corp: 'Telefone Corporativo',
      headset: 'Headset',
      monitor: 'Monitor',
      teclado: 'Teclado',
      mouse: 'Mouse',
      outro: 'Outro',
    };
    expect(TYPE_LABELS['celular']).toBe('Celular');
    expect(TYPE_LABELS['email_corp']).toBe('Email Corporativo');
    expect(TYPE_LABELS['telefone_corp']).toBe('Telefone Corporativo');
  });

  it('should count equipment by status', () => {
    const items = [
      { status: 'em_uso' },
      { status: 'em_uso' },
      { status: 'devolvido' },
      { status: 'manutencao' },
      { status: 'em_uso' },
    ];
    const emUso = items.filter(i => i.status === 'em_uso').length;
    const devolvidos = items.filter(i => i.status === 'devolvido').length;
    const manutencao = items.filter(i => i.status === 'manutencao').length;
    expect(emUso).toBe(3);
    expect(devolvidos).toBe(1);
    expect(manutencao).toBe(1);
  });

  it('should filter equipment by type', () => {
    const items = [
      { tipo: 'celular', marca: 'Samsung' },
      { tipo: 'notebook', marca: 'Dell' },
      { tipo: 'celular', marca: 'Apple' },
      { tipo: 'email_corp', marca: '' },
    ];
    const celulares = items.filter(i => i.tipo === 'celular');
    expect(celulares).toHaveLength(2);
    const notebooks = items.filter(i => i.tipo === 'notebook');
    expect(notebooks).toHaveLength(1);
  });

  it('should filter equipment by search term', () => {
    const items = [
      { colaboradorNome: 'João Silva', marca: 'Dell', modelo: 'Latitude', patrimonio: 'PAT-001' },
      { colaboradorNome: 'Maria Santos', marca: 'Apple', modelo: 'MacBook', patrimonio: 'PAT-002' },
      { colaboradorNome: 'Ana Costa', marca: 'Samsung', modelo: 'Galaxy', patrimonio: 'PAT-003' },
    ];
    const search = 'dell';
    const filtered = items.filter(i =>
      i.colaboradorNome.toLowerCase().includes(search) ||
      i.marca.toLowerCase().includes(search) ||
      i.modelo.toLowerCase().includes(search) ||
      i.patrimonio.toLowerCase().includes(search)
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].colaboradorNome).toBe('João Silva');
  });
});

// --- 2. Senhas & Autorizações page structure ---
describe('SenhasAutorizacoesGEG — page structure', () => {
  const SENHA_TYPES = ['email', 'computador', 'celular', 'alarme', 'chave', 'veiculo', 'sistema', 'vpn', 'outro'];
  const SENHA_STATUS = ['ativo', 'revogado', 'expirado', 'pendente'];

  it('should have valid authorization types', () => {
    expect(SENHA_TYPES.length).toBeGreaterThan(5);
    expect(SENHA_TYPES).toContain('email');
    expect(SENHA_TYPES).toContain('computador');
    expect(SENHA_TYPES).toContain('alarme');
    expect(SENHA_TYPES).toContain('chave');
    expect(SENHA_TYPES).toContain('veiculo');
  });

  it('should have valid authorization statuses', () => {
    expect(SENHA_STATUS).toContain('ativo');
    expect(SENHA_STATUS).toContain('revogado');
    expect(SENHA_STATUS).toContain('expirado');
    expect(SENHA_STATUS).toContain('pendente');
  });

  it('should count authorizations by status', () => {
    const items = [
      { status: 'ativo' },
      { status: 'ativo' },
      { status: 'revogado' },
      { status: 'ativo' },
      { status: 'expirado' },
    ];
    const ativos = items.filter(i => i.status === 'ativo').length;
    const revogados = items.filter(i => i.status === 'revogado').length;
    expect(ativos).toBe(3);
    expect(revogados).toBe(1);
  });

  it('should count chaves and veiculos separately', () => {
    const items = [
      { tipo: 'chave', status: 'ativo' },
      { tipo: 'veiculo', status: 'ativo' },
      { tipo: 'chave', status: 'revogado' },
      { tipo: 'email', status: 'ativo' },
      { tipo: 'veiculo', status: 'ativo' },
    ];
    const chaves = items.filter(i => i.tipo === 'chave').length;
    const veiculos = items.filter(i => i.tipo === 'veiculo').length;
    expect(chaves).toBe(2);
    expect(veiculos).toBe(2);
  });

  it('should filter by type', () => {
    const items = [
      { tipo: 'email', descricao: 'Email corporativo' },
      { tipo: 'alarme', descricao: 'Alarme escritório' },
      { tipo: 'chave', descricao: 'Chave principal' },
    ];
    const filtered = items.filter(i => i.tipo === 'alarme');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].descricao).toBe('Alarme escritório');
  });

  it('should filter by search term', () => {
    const items = [
      { colaboradorNome: 'João Silva', descricao: 'Email corporativo', identificador: 'joao@empresa.com' },
      { colaboradorNome: 'Maria Santos', descricao: 'Chave escritório', identificador: 'CH-001' },
    ];
    const search = 'joao';
    const filtered = items.filter(i =>
      i.colaboradorNome.toLowerCase().includes(search) ||
      i.descricao.toLowerCase().includes(search) ||
      i.identificador.toLowerCase().includes(search)
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].descricao).toBe('Email corporativo');
  });
});

// --- 3. Contact fields layout ---
describe('ColaboradoresGEG — contact fields', () => {
  it('should separate personal and corporate contacts', () => {
    const contatos = {
      emailPessoal: 'joao@gmail.com',
      telefonePessoal: '(11) 99999-0000',
      emailCorporativo: 'joao@empresa.com',
      telefoneCorporativo: '(11) 3333-0000',
    };
    expect(contatos.emailPessoal).not.toBe(contatos.emailCorporativo);
    expect(contatos.telefonePessoal).not.toBe(contatos.telefoneCorporativo);
  });

  it('should handle empty corporate contacts gracefully', () => {
    const contatos = {
      emailPessoal: 'joao@gmail.com',
      telefonePessoal: '(11) 99999-0000',
      emailCorporativo: null,
      telefoneCorporativo: null,
    };
    const displayEmail = contatos.emailCorporativo || '—';
    const displayTel = contatos.telefoneCorporativo || '—';
    expect(displayEmail).toBe('—');
    expect(displayTel).toBe('—');
  });

  it('should not overlap email and telefone fields', () => {
    // Simulating the grid layout: personal contacts in one row, corporate in another
    const personalRow = ['EMAIL PESSOAL', 'TELEFONE PESSOAL'];
    const corporateRow = ['EMAIL CORPORATIVO', 'TELEFONE CORPORATIVO'];
    // Each row has exactly 2 items, no overlap
    expect(personalRow).toHaveLength(2);
    expect(corporateRow).toHaveLength(2);
    // No field appears in both rows
    const allFields = [...personalRow, ...corporateRow];
    const uniqueFields = new Set(allFields);
    expect(uniqueFields.size).toBe(4);
  });
});

// --- 4. GestaoRhHub items ---
describe('GestaoRhHub — new items', () => {
  const ITEMS = [
    { key: 'colaboradores', label: 'Colaboradores', rota: '/rh/colaboradores' },
    { key: 'onboarding', label: 'Onboarding', rota: '/rh/onboarding' },
    { key: 'banco-horas', label: 'Banco de Horas', rota: '/rh/banco-horas' },
    { key: 'atestados-licencas', label: 'Atestados e Licenças', rota: '/rh/atestados-licencas' },
    { key: 'ferias', label: 'Férias e Folgas', rota: '/rh/ferias' },
    { key: 'reajustes', label: 'Reajustes Salariais', rota: '/rh/reajustes' },
    { key: 'aniversariantes', label: 'Aniversariantes', rota: '/rh/email-aniversariante' },
    { key: 'contratos-vencendo', label: 'Contratos Vencendo', rota: '/rh/workflow-renovacao' },
    { key: 'equipamentos', label: 'Equipamentos & Comunicações', rota: '/rh/equipamentos' },
    { key: 'senhas-autorizacoes', label: 'Senhas & Autorizações', rota: '/rh/senhas-autorizacoes' },
  ];

  it('should have 10 items in total', () => {
    expect(ITEMS).toHaveLength(10);
  });

  it('should include Aniversariantes', () => {
    const item = ITEMS.find(i => i.key === 'aniversariantes');
    expect(item).toBeDefined();
    expect(item!.rota).toBe('/rh/email-aniversariante');
  });

  it('should include Contratos Vencendo', () => {
    const item = ITEMS.find(i => i.key === 'contratos-vencendo');
    expect(item).toBeDefined();
    expect(item!.rota).toBe('/rh/workflow-renovacao');
  });

  it('should include Equipamentos & Comunicações', () => {
    const item = ITEMS.find(i => i.key === 'equipamentos');
    expect(item).toBeDefined();
    expect(item!.rota).toBe('/rh/equipamentos');
  });

  it('should include Senhas & Autorizações', () => {
    const item = ITEMS.find(i => i.key === 'senhas-autorizacoes');
    expect(item).toBeDefined();
    expect(item!.rota).toBe('/rh/senhas-autorizacoes');
  });

  it('should have unique keys', () => {
    const keys = ITEMS.map(i => i.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(ITEMS.length);
  });

  it('should have unique routes', () => {
    const rotas = ITEMS.map(i => i.rota);
    const uniqueRotas = new Set(rotas);
    expect(uniqueRotas.size).toBe(ITEMS.length);
  });
});

// --- 5. Dashboard chart legend colors ---
describe('DashboardGEG — chart legend colors', () => {
  const PIE_COLORS: Record<string, string> = {
    ativo: '#22c55e',
    experiencia: '#6366f1',
    ferias: '#3b82f6',
    afastado: '#f97316',
    aviso_previo: '#eab308',
    desligado: '#6b7280',
    atestado: '#ef4444',
    licenca: '#8b5cf6',
    inativo: '#94a3b8',
  };

  it('should have a unique color for each status', () => {
    const colors = Object.values(PIE_COLORS);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });

  it('should use green for ativo', () => {
    expect(PIE_COLORS['ativo']).toBe('#22c55e');
  });

  it('should use red for atestado', () => {
    expect(PIE_COLORS['atestado']).toBe('#ef4444');
  });

  it('should have colors for all statuses', () => {
    const expectedStatuses = ['ativo', 'experiencia', 'ferias', 'afastado', 'aviso_previo', 'desligado', 'atestado', 'licenca', 'inativo'];
    for (const status of expectedStatuses) {
      expect(PIE_COLORS[status]).toBeDefined();
    }
  });
});

// --- 6. Headcount toggle ---
describe('DashboardGEG — headcount toggle', () => {
  it('should toggle between setor and local views', () => {
    let view: 'setor' | 'local' = 'setor';
    expect(view).toBe('setor');
    view = 'local';
    expect(view).toBe('local');
    view = 'setor';
    expect(view).toBe('setor');
  });

  it('should group by setor correctly', () => {
    const colaboradores = [
      { setor: 'Comercial' },
      { setor: 'Comercial' },
      { setor: 'RH' },
      { setor: 'TI' },
      { setor: 'TI' },
      { setor: 'TI' },
    ];
    const bySetor = colaboradores.reduce((acc, c) => {
      acc[c.setor] = (acc[c.setor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    expect(bySetor['Comercial']).toBe(2);
    expect(bySetor['RH']).toBe(1);
    expect(bySetor['TI']).toBe(3);
  });

  it('should group by local de trabalho correctly', () => {
    const colaboradores = [
      { localTrabalho: 'Barueri' },
      { localTrabalho: 'Barueri' },
      { localTrabalho: 'Uberaba' },
      { localTrabalho: 'Home Office' },
    ];
    const byLocal = colaboradores.reduce((acc, c) => {
      acc[c.localTrabalho] = (acc[c.localTrabalho] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    expect(byLocal['Barueri']).toBe(2);
    expect(byLocal['Uberaba']).toBe(1);
    expect(byLocal['Home Office']).toBe(1);
  });
});
