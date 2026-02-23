import { describe, it, expect } from 'vitest';

describe('v60 — CCT Alerts, Export, Badges, Duplicate Validation', () => {
  describe('CCT Expiration Alert Logic', () => {
    function calcAlerta(vigenciaFim: string): string {
      const hoje = new Date();
      const fim = new Date(vigenciaFim + 'T00:00:00');
      const diffDias = Math.floor((hoje.getTime() - fim.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDias >= 5 && diffDias < 6) return '5 dias';
      if (diffDias >= 15 && diffDias < 16) return '15 dias';
      if (diffDias >= 30 && diffDias < 31) return '30 dias';
      return '';
    }

    it('should return "5 dias" for CCT expired 5 days ago', () => {
      const d = new Date(); d.setDate(d.getDate() - 5);
      expect(calcAlerta(d.toISOString().slice(0, 10))).toBe('5 dias');
    });

    it('should return "15 dias" for CCT expired 15 days ago', () => {
      const d = new Date(); d.setDate(d.getDate() - 15);
      expect(calcAlerta(d.toISOString().slice(0, 10))).toBe('15 dias');
    });

    it('should return "30 dias" for CCT expired 30 days ago', () => {
      const d = new Date(); d.setDate(d.getDate() - 30);
      expect(calcAlerta(d.toISOString().slice(0, 10))).toBe('30 dias');
    });

    it('should return empty for non-alert days', () => {
      const d = new Date(); d.setDate(d.getDate() + 1);
      expect(calcAlerta(d.toISOString().slice(0, 10))).toBe('');
    });

    it('should return empty for 10 days expired (not 5/15/30)', () => {
      const d = new Date(); d.setDate(d.getDate() - 10);
      expect(calcAlerta(d.toISOString().slice(0, 10))).toBe('');
    });
  });

  describe('PDF Export Filter Logic', () => {
    const mockColabs = [
      { nomeCompleto: 'João Silva', cargo: 'Analista', statusColaborador: 'ativo', tipoContrato: 'clt', setorId: 1, localTrabalho: 'barueri' },
      { nomeCompleto: 'Maria Santos', cargo: 'Gerente', statusColaborador: 'ativo', tipoContrato: 'pj', setorId: 2, localTrabalho: 'home_office' },
      { nomeCompleto: 'Pedro Costa', cargo: 'Estagiário', statusColaborador: 'desligado', tipoContrato: 'estagio', setorId: 1, localTrabalho: 'barueri' },
    ];

    function applyFilters(colabs: any[], filters: Record<string, string>) {
      let filtered = [...colabs];
      if (filters.status) filtered = filtered.filter(c => (c.statusColaborador || 'ativo') === filters.status);
      if (filters.cargo) filtered = filtered.filter(c => c.cargo === filters.cargo);
      if (filters.setor) filtered = filtered.filter(c => String(c.setorId) === filters.setor);
      if (filters.local) filtered = filtered.filter(c => c.localTrabalho === filters.local);
      if (filters.contrato) filtered = filtered.filter(c => c.tipoContrato === filters.contrato);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(c => c.nomeCompleto?.toLowerCase().includes(q) || c.cargo?.toLowerCase().includes(q));
      }
      return filtered;
    }

    it('should filter by status', () => {
      expect(applyFilters(mockColabs, { status: 'ativo' })).toHaveLength(2);
    });

    it('should filter by cargo', () => {
      const r = applyFilters(mockColabs, { cargo: 'Gerente' });
      expect(r).toHaveLength(1);
      expect(r[0].nomeCompleto).toBe('Maria Santos');
    });

    it('should filter by search', () => {
      expect(applyFilters(mockColabs, { search: 'silva' })).toHaveLength(1);
    });

    it('should combine filters', () => {
      expect(applyFilters(mockColabs, { status: 'ativo', local: 'barueri' })).toHaveLength(1);
    });

    it('should return all when no filters', () => {
      expect(applyFilters(mockColabs, {})).toHaveLength(3);
    });
  });

  describe('Education Badge Mapping', () => {
    const GRAU_BADGE: Record<string, { label: string; icon: string }> = {
      fundamental_incompleto: { label: 'Fund.', icon: '' },
      fundamental_completo: { label: 'Fund.', icon: '' },
      medio_incompleto: { label: 'Médio', icon: '' },
      medio_completo: { label: 'Médio', icon: '' },
      superior_incompleto: { label: 'Sup.', icon: '🎓' },
      superior_completo: { label: 'Sup.', icon: '🎓' },
      pos_graduacao: { label: 'Pós', icon: '🎓' },
      mestrado: { label: 'Msc.', icon: '🏅' },
      doutorado: { label: 'Dr.', icon: '🏅' },
    };

    it('should have badges for all levels', () => {
      const levels = ['fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao','mestrado','doutorado'];
      levels.forEach(l => expect(GRAU_BADGE[l]).toBeDefined());
    });

    it('should show graduation icon for superior+', () => {
      expect(GRAU_BADGE.superior_completo.icon).toBe('🎓');
      expect(GRAU_BADGE.pos_graduacao.icon).toBe('🎓');
    });

    it('should show medal for mestrado/doutorado', () => {
      expect(GRAU_BADGE.mestrado.icon).toBe('🏅');
      expect(GRAU_BADGE.doutorado.icon).toBe('🏅');
    });

    it('should not show icon for fundamental/medio', () => {
      expect(GRAU_BADGE.fundamental_completo.icon).toBe('');
      expect(GRAU_BADGE.medio_completo.icon).toBe('');
    });
  });

  describe('Duplicate Formation Validation', () => {
    function checkDuplicate(formacoes: { curso: string }[], newCurso: string, idx: number): boolean {
      return formacoes.some((f, i) => i !== idx && f.curso && f.curso.toLowerCase() === newCurso.toLowerCase());
    }

    it('should detect duplicate course', () => {
      expect(checkDuplicate([{ curso: 'Administração' }, { curso: '' }], 'Administração', 1)).toBe(true);
    });

    it('should detect case-insensitive duplicate', () => {
      expect(checkDuplicate([{ curso: 'Direito' }, { curso: '' }], 'direito', 1)).toBe(true);
    });

    it('should not flag same index', () => {
      expect(checkDuplicate([{ curso: 'Engenharia Civil' }], 'Engenharia Civil', 0)).toBe(false);
    });

    it('should not flag different courses', () => {
      expect(checkDuplicate([{ curso: 'Medicina' }, { curso: '' }], 'Enfermagem', 1)).toBe(false);
    });

    it('should handle empty courses', () => {
      expect(checkDuplicate([{ curso: '' }, { curso: '' }], 'Direito', 1)).toBe(false);
    });
  });

  describe('Alphabetical Index Logic', () => {
    it('should group courses by first letter', () => {
      const cursos = ['Administração', 'Arquitetura', 'Biologia', 'Contabilidade'];
      const groups: Record<string, string[]> = {};
      cursos.forEach(c => { const l = c.charAt(0).toUpperCase(); if (!groups[l]) groups[l] = []; groups[l].push(c); });
      expect(Object.keys(groups).sort()).toEqual(['A', 'B', 'C']);
      expect(groups['A']).toHaveLength(2);
    });

    it('should identify available letters', () => {
      const cursos = ['Direito', 'Engenharia', 'Farmácia'];
      const groups: Record<string, string[]> = {};
      cursos.forEach(c => { const l = c.charAt(0).toUpperCase(); if (!groups[l]) groups[l] = []; groups[l].push(c); });
      expect(Object.keys(groups).sort()).toEqual(['D', 'E', 'F']);
    });
  });
});
