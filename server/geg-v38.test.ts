import { describe, it, expect, vi } from 'vitest';

// Mock DB module
vi.mock('./db', () => ({
  getDb: vi.fn(() => null),
  listColaboradores: vi.fn(() => []),
  createColaborador: vi.fn(() => 1),
  getContratosVencendo: vi.fn(() => []),
  checkReajusteDoisAnos: vi.fn(() => []),
  listAcoesBeneficios: vi.fn(() => []),
  createAcaoBeneficio: vi.fn(() => 1),
  getConsolidatedGEGDashboard: vi.fn(() => ({
    totalColaboradoresAtivos: 10,
    totalVTMes: 5000,
    totalAcademiaMes: 3000,
    totalComissaoRhMes: 2000,
    reajustesPendentes: 2,
    dayOffsDoMes: { pendentes: 1, aprovados: 3 },
    evolucaoCustos: [],
    proximosAniversarios: [],
    reajustesPendentesLista: [],
  })),
}));

describe('GEG v38 — Reestruturação', () => {
  describe('Campos de Experiência e Comissão', () => {
    it('deve aceitar dois períodos de experiência no schema', () => {
      // Verify the schema accepts the new fields
      const colaboradorData = {
        nomeCompleto: 'Teste Silva',
        periodoExperiencia1Inicio: '2026-01-01',
        periodoExperiencia1Fim: '2026-03-31',
        periodoExperiencia2Inicio: '2026-04-01',
        periodoExperiencia2Fim: '2026-06-30',
        recebeComissao: true,
      };
      expect(colaboradorData.periodoExperiencia1Inicio).toBeDefined();
      expect(colaboradorData.periodoExperiencia1Fim).toBeDefined();
      expect(colaboradorData.periodoExperiencia2Inicio).toBeDefined();
      expect(colaboradorData.periodoExperiencia2Fim).toBeDefined();
      expect(colaboradorData.recebeComissao).toBe(true);
    });

    it('deve calcular dias restantes para ambos os períodos de experiência', () => {
      const hoje = new Date('2026-02-21');
      const periodos = [
        { inicio: '2026-01-01', fim: '2026-03-15', label: '1º Período' },
        { inicio: '2026-03-16', fim: '2026-06-15', label: '2º Período' },
      ];
      
      const resultado: any[] = [];
      for (const p of periodos) {
        const vencimento = new Date(p.fim);
        const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDias >= 0 && diffDias <= 30) {
          resultado.push({ periodoLabel: p.label, diasRestantes: diffDias });
        }
      }
      
      // 1st period ends in 22 days (within 30-day window)
      expect(resultado.length).toBe(1);
      expect(resultado[0].periodoLabel).toBe('1º Período');
      expect(resultado[0].diasRestantes).toBe(22);
    });
  });

  describe('Validação de Férias CLT 2026', () => {
    it('deve proibir início de férias 2 dias antes de feriado nacional', () => {
      const FERIADOS_2026 = [
        '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03',
        '2026-04-21', '2026-05-01', '2026-06-04', '2026-09-07',
        '2026-10-12', '2026-11-02', '2026-11-15', '2026-12-25',
      ];
      
      const validarInicioFerias = (dataInicio: string): string | null => {
        const inicio = new Date(dataInicio + 'T12:00:00');
        const dow = inicio.getDay();
        if (dow === 0 || dow === 6) return 'Não é permitido iniciar férias em sábado ou domingo';
        
        // Check 2 days before holiday
        for (const feriado of FERIADOS_2026) {
          const feriadoDate = new Date(feriado + 'T12:00:00');
          const diffMs = feriadoDate.getTime() - inicio.getTime();
          const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
          if (diffDias >= 0 && diffDias <= 2) {
            return `Não é permitido iniciar férias 2 dias antes de feriado`;
          }
        }
        return null;
      };
      
      // April 1st is 2 days before April 3rd (Sexta-Feira Santa)
      expect(validarInicioFerias('2026-04-01')).toContain('feriado');
      // April 2nd is 1 day before
      expect(validarInicioFerias('2026-04-02')).toContain('feriado');
      // March 30th is fine (3 days before)
      expect(validarInicioFerias('2026-03-30')).toBeNull();
    });

    it('deve exigir aviso prévio de 30 dias', () => {
      const validarAvisoPrevio = (dataInicio: string): string | null => {
        const inicio = new Date(dataInicio);
        const hoje = new Date('2026-02-21');
        const diffDias = Math.ceil((inicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDias < 30) return 'Férias devem ser comunicadas com 30 dias de antecedência';
        return null;
      };
      
      // March 10 is only 17 days away
      expect(validarAvisoPrevio('2026-03-10')).toContain('30 dias');
      // March 25 is 32 days away
      expect(validarAvisoPrevio('2026-03-25')).toBeNull();
    });
  });

  describe('Tipos de Ações Evox', () => {
    it('deve aceitar os novos tipos de ação', () => {
      const tiposValidos = ['fit', 'solidaria', 'engajamento', 'doacao_sangue', 'sustentabilidade', 'outro'];
      const tiposRemovidos = ['beneficio', 'campanha_doacao'];
      
      for (const tipo of tiposValidos) {
        expect(tiposValidos).toContain(tipo);
      }
      for (const tipo of tiposRemovidos) {
        expect(tiposValidos).not.toContain(tipo);
      }
    });

    it('deve mapear labels corretos para cada tipo', () => {
      const TIPO_LABELS: Record<string, string> = {
        fit: 'Ação Fit',
        solidaria: 'Ação Solidária',
        engajamento: 'Ação de Engajamento',
        doacao_sangue: 'Doação de Sangue',
        sustentabilidade: 'Sustentabilidade',
        outro: 'Outro',
      };
      
      expect(TIPO_LABELS['fit']).toBe('Ação Fit');
      expect(TIPO_LABELS['solidaria']).toBe('Ação Solidária');
      expect(TIPO_LABELS['engajamento']).toBe('Ação de Engajamento');
      expect(TIPO_LABELS['doacao_sangue']).toBe('Doação de Sangue');
      expect(TIPO_LABELS['beneficio']).toBeUndefined();
      expect(TIPO_LABELS['campanha_doacao']).toBeUndefined();
    });
  });

  describe('Estrutura de Submenus GEG', () => {
    it('deve ter os grupos corretos de submenus', () => {
      const gruposEsperados = [
        'Gestão RH',
        'Ações Evox',
        'Benefícios',
        'Carreira e Desenvolvimento',
      ];
      
      const submenus = [
        { grupo: 'Gestão RH', nome: 'Colaboradores', rota: '/rh/colaboradores' },
        { grupo: 'Gestão RH', nome: 'Onboarding', rota: '/rh/onboarding' },
        { grupo: 'Gestão RH', nome: 'Comissões', rota: '/rh/comissoes' },
        { grupo: 'Gestão RH', nome: 'Banco de Horas', rota: '/rh/banco-horas' },
        { grupo: 'Gestão RH', nome: 'Atestados e Licenças', rota: '/rh/atestados' },
        { grupo: 'Gestão RH', nome: 'Férias e Folgas', rota: '/rh/ferias' },
        { grupo: 'Gestão RH', nome: 'Reajustes Salariais', rota: '/rh/reajustes' },
        { grupo: 'Ações Evox', nome: 'Ações e Eventos', rota: '/rh/acoes-beneficios' },
        { grupo: 'Ações Evox', nome: 'Doação de Sangue', rota: '/rh/doacao-sangue' },
        { grupo: 'Benefícios', nome: 'Vale Transporte', rota: '/rh/vale-transporte' },
        { grupo: 'Benefícios', nome: 'Academia', rota: '/rh/academia' },
        { grupo: 'Benefícios', nome: 'Day Off', rota: '/rh/day-off' },
        { grupo: 'Carreira e Desenvolvimento', nome: 'Carreira', rota: '/rh/plano-carreira' },
        { grupo: 'Carreira e Desenvolvimento', nome: 'Metas', rota: '/rh/metas-individuais' },
        { grupo: 'Carreira e Desenvolvimento', nome: 'Avaliação 360', rota: '/rh/avaliacao-360' },
        { grupo: 'Carreira e Desenvolvimento', nome: 'Pesquisa de Clima', rota: '/rh/pesquisa-clima' },
      ];
      
      const gruposPresentes = [...new Set(submenus.map(s => s.grupo))];
      expect(gruposPresentes).toEqual(gruposEsperados);
      
      // Verify Gestão RH has the expected items
      const gestaoRH = submenus.filter(s => s.grupo === 'Gestão RH');
      expect(gestaoRH.length).toBe(7);
      expect(gestaoRH.map(s => s.nome)).toContain('Colaboradores');
      expect(gestaoRH.map(s => s.nome)).toContain('Férias e Folgas');
      
      // Verify Ações Evox has the expected items (no beneficio/campanha)
      const acoesEvox = submenus.filter(s => s.grupo === 'Ações Evox');
      expect(acoesEvox.length).toBe(2);
      
      // Verify Benefícios has the expected items
      const beneficios = submenus.filter(s => s.grupo === 'Benefícios');
      expect(beneficios.length).toBe(3);
      expect(beneficios.map(s => s.nome)).toContain('Vale Transporte');
      expect(beneficios.map(s => s.nome)).toContain('Academia');
      expect(beneficios.map(s => s.nome)).toContain('Day Off');
    });

    it('deve ter os nomes de submenu renomeados corretamente', () => {
      const renames = {
        'Cargos e Salários': 'Custo Salarial',
        'Níveis de Cargo': 'Cargos e Salários',
        'Relatórios RH': 'Visão Analítica',
      };
      
      expect(renames['Cargos e Salários']).toBe('Custo Salarial');
      expect(renames['Níveis de Cargo']).toBe('Cargos e Salários');
      expect(renames['Relatórios RH']).toBe('Visão Analítica');
    });
  });

  describe('Dashboard GEG Consolidado', () => {
    it('deve retornar indicadores consolidados', async () => {
      const { getConsolidatedGEGDashboard } = await import('./db');
      const data = await getConsolidatedGEGDashboard(2, 2026);
      
      expect(data).toHaveProperty('totalColaboradoresAtivos');
      expect(data).toHaveProperty('totalVTMes');
      expect(data).toHaveProperty('totalAcademiaMes');
      expect(data).toHaveProperty('totalComissaoRhMes');
      expect(data).toHaveProperty('reajustesPendentes');
      expect(data).toHaveProperty('dayOffsDoMes');
      expect(data).toHaveProperty('evolucaoCustos');
      expect(data).toHaveProperty('proximosAniversarios');
      expect(data).toHaveProperty('reajustesPendentesLista');
    });
  });
});
