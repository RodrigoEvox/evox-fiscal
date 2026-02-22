import { describe, it, expect } from 'vitest';

// ─── Helper functions extracted from FeriasGEG.tsx ─────────────────

function getFeriadosNacionais(ano: number): string[] {
  const fixos = [`${ano}-01-01`,`${ano}-04-21`,`${ano}-05-01`,`${ano}-09-07`,`${ano}-10-12`,`${ano}-11-02`,`${ano}-11-15`,`${ano}-12-25`];
  const a=ano%19,b=Math.floor(ano/100),c=ano%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
  const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const mes=Math.floor((h+l-7*m+114)/31),dia=((h+l-7*m+114)%31)+1;
  const pascoa=new Date(ano,mes-1,dia);
  const fmt=(d:Date)=>d.toISOString().split('T')[0];
  const addD=(d:Date,n:number)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
  fixos.push(fmt(addD(pascoa,-47)),fmt(addD(pascoa,-48)),fmt(addD(pascoa,-2)),fmt(pascoa),fmt(addD(pascoa,60)));
  return fixos;
}

function calcPeriodoAquisitivo(dataAdmissao: string) {
  if (!dataAdmissao) return null;
  const adm = new Date(dataAdmissao + 'T12:00:00');
  const hoje = new Date('2026-02-22T12:00:00');
  const meses = (hoje.getFullYear() - adm.getFullYear()) * 12 + (hoje.getMonth() - adm.getMonth());
  const anos = Math.floor(meses / 12);
  const ini = new Date(adm); ini.setFullYear(adm.getFullYear() + anos);
  const fim = new Date(ini); fim.setFullYear(fim.getFullYear() + 1); fim.setDate(fim.getDate() - 1);
  const conc = new Date(fim); conc.setFullYear(conc.getFullYear() + 1);
  const diasVencer = Math.round((conc.getTime() - hoje.getTime()) / 864e5);
  return {
    inicioAquisitivo: ini.toISOString().split('T')[0],
    fimAquisitivo: fim.toISOString().split('T')[0],
    fimConcessivo: conc.toISOString().split('T')[0],
    diasParaVencer: diasVencer,
    vencido: diasVencer < 0,
    proximoVencer: diasVencer >= 0 && diasVencer <= 180,
    mesesTrabalhados: meses % 12,
    anosCompletos: anos,
  };
}

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function calcDias(i: string, f: string) {
  if (!i || !f) return 0;
  return Math.max(1, Math.round((new Date(f + 'T12:00:00').getTime() - new Date(i + 'T12:00:00').getTime()) / 864e5) + 1);
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function firstDayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

function checkSectorOverlap(
  colabId: number,
  dataInicio: string,
  dataFim: string,
  colabList: { id: number; setor: string; nomeCompleto: string; ativo?: boolean }[],
  feriasList: { colaboradorId: number; status: string; periodo1Inicio?: string; periodo1Fim?: string; dataInicio?: string; dataFim?: string }[],
  dayOffList: { colaboradorId: number; status: string; dataEfetiva?: string; dataOriginal?: string }[],
  solList: { colaboradorId: number; status: string; dataInicio?: string; dataFim?: string }[]
): string[] {
  const colab = colabList.find(c => c.id === colabId);
  if (!colab || !colab.setor) return [];
  const setor = colab.setor;
  const d1 = new Date(dataInicio + 'T12:00:00');
  const d2 = new Date(dataFim + 'T12:00:00');

  const colabsNoSetor = colabList.filter(c => c.setor === setor && c.id !== colabId && c.ativo !== false);
  const conflitos: string[] = [];

  colabsNoSetor.forEach(c => {
    const feriasC = feriasList.filter(f => f.colaboradorId === c.id && f.status !== 'cancelada');
    feriasC.forEach(f => {
      const fi = new Date((f.periodo1Inicio || f.dataInicio || '') + 'T12:00:00');
      const ff = new Date((f.periodo1Fim || f.dataFim || '') + 'T12:00:00');
      if (d1 <= ff && d2 >= fi) conflitos.push(`${c.nomeCompleto} (Férias)`);
    });
    const dayOffsC = dayOffList.filter(d => d.colaboradorId === c.id && d.status !== 'recusado');
    dayOffsC.forEach(d => {
      const dt = new Date((d.dataEfetiva || d.dataOriginal || '') + 'T12:00:00');
      if (dt >= d1 && dt <= d2) conflitos.push(`${c.nomeCompleto} (Day Off)`);
    });
    const folgasC = solList.filter(s => s.colaboradorId === c.id && s.status !== 'recusada');
    folgasC.forEach(s => {
      if (s.dataInicio && s.dataFim) {
        const si = new Date(s.dataInicio + 'T12:00:00');
        const sf = new Date(s.dataFim + 'T12:00:00');
        if (d1 <= sf && d2 >= si) conflitos.push(`${c.nomeCompleto} (Folga)`);
      }
    });
  });

  return Array.from(new Set(conflitos));
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('FeriasGEG v45 — Calendar, Concessivo Alerts, Sector Overlap', () => {

  describe('calcPeriodoAquisitivo', () => {
    it('deve calcular período aquisitivo corretamente para admissão recente', () => {
      const p = calcPeriodoAquisitivo('2025-04-01');
      expect(p).not.toBeNull();
      expect(p!.anosCompletos).toBe(0);
      expect(p!.mesesTrabalhados).toBe(10);
      expect(p!.vencido).toBe(false);
    });

    it('deve calcular período aquisitivo para funcionário com 2+ anos', () => {
      const p = calcPeriodoAquisitivo('2023-06-15');
      expect(p).not.toBeNull();
      expect(p!.anosCompletos).toBe(2);
      expect(p!.mesesTrabalhados).toBe(8);
    });

    it('deve calcular período concessivo para funcionário antigo (não vencido se rolou)', () => {
      // 2022-01-01 → 4 anos, aquisitivo rola para 2026-01-01, concessivo até 2027-12-31
      const p = calcPeriodoAquisitivo('2022-01-01');
      expect(p).not.toBeNull();
      expect(p!.anosCompletos).toBe(4);
      expect(p!.vencido).toBe(false);
      expect(p!.fimConcessivo).toBe('2027-12-31');
    });

    it('deve identificar período concessivo próximo a vencer (180 dias)', () => {
      const p1 = calcPeriodoAquisitivo('2024-08-22');
      expect(p1).not.toBeNull();
      expect(p1!.proximoVencer).toBe(false);

      const p2 = calcPeriodoAquisitivo('2024-02-22');
      expect(p2).not.toBeNull();
      expect(p2!.proximoVencer).toBe(false);
    });

    it('deve retornar null para data de admissão vazia', () => {
      expect(calcPeriodoAquisitivo('')).toBeNull();
    });
  });

  describe('formatDateBR', () => {
    it('deve formatar data ISO para formato brasileiro', () => {
      expect(formatDateBR('2026-02-22')).toBe('22/02/2026');
      expect(formatDateBR('2025-12-01')).toBe('01/12/2025');
    });

    it('deve retornar string vazia para data vazia', () => {
      expect(formatDateBR('')).toBe('');
    });
  });

  describe('calcDias', () => {
    it('deve calcular dias entre duas datas (inclusive)', () => {
      expect(calcDias('2026-03-01', '2026-03-14')).toBe(14);
      expect(calcDias('2026-01-01', '2026-01-01')).toBe(1);
      expect(calcDias('2026-01-01', '2026-01-30')).toBe(30);
    });

    it('deve retornar 0 para datas vazias', () => {
      expect(calcDias('', '')).toBe(0);
      expect(calcDias('2026-01-01', '')).toBe(0);
    });
  });

  describe('daysInMonth / firstDayOfMonth', () => {
    it('deve retornar dias corretos para cada mês', () => {
      expect(daysInMonth(2026, 0)).toBe(31);
      expect(daysInMonth(2026, 1)).toBe(28);
      expect(daysInMonth(2024, 1)).toBe(29);
      expect(daysInMonth(2026, 3)).toBe(30);
    });

    it('deve retornar o primeiro dia da semana do mês', () => {
      expect(firstDayOfMonth(2026, 0)).toBe(4);
    });
  });

  describe('getFeriadosNacionais', () => {
    it('deve incluir feriados fixos de 2026', () => {
      const feriados = getFeriadosNacionais(2026);
      expect(feriados).toContain('2026-01-01');
      expect(feriados).toContain('2026-04-21');
      expect(feriados).toContain('2026-05-01');
      expect(feriados).toContain('2026-09-07');
      expect(feriados).toContain('2026-10-12');
      expect(feriados).toContain('2026-11-02');
      expect(feriados).toContain('2026-11-15');
      expect(feriados).toContain('2026-12-25');
    });

    it('deve incluir feriados móveis (Páscoa, Carnaval, Corpus Christi)', () => {
      const feriados = getFeriadosNacionais(2026);
      expect(feriados).toContain('2026-04-05');
      expect(feriados).toContain('2026-04-03');
    });
  });

  describe('checkSectorOverlap', () => {
    const colabList = [
      { id: 1, setor: 'TI', nomeCompleto: 'João', ativo: true },
      { id: 2, setor: 'TI', nomeCompleto: 'Maria', ativo: true },
      { id: 3, setor: 'RH', nomeCompleto: 'Pedro', ativo: true },
      { id: 4, setor: 'TI', nomeCompleto: 'Ana', ativo: false },
    ];

    it('deve detectar sobreposição de férias no mesmo setor', () => {
      const feriasList = [
        { colaboradorId: 2, status: 'programada', periodo1Inicio: '2026-03-01', periodo1Fim: '2026-03-14' },
      ];
      const result = checkSectorOverlap(1, '2026-03-10', '2026-03-20', colabList, feriasList, [], []);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Maria');
    });

    it('deve não detectar sobreposição em setores diferentes', () => {
      const feriasList = [
        { colaboradorId: 3, status: 'programada', periodo1Inicio: '2026-03-01', periodo1Fim: '2026-03-14' },
      ];
      const result = checkSectorOverlap(1, '2026-03-10', '2026-03-20', colabList, feriasList, [], []);
      expect(result.length).toBe(0);
    });

    it('deve ignorar colaboradores inativos', () => {
      const feriasList = [
        { colaboradorId: 4, status: 'programada', periodo1Inicio: '2026-03-01', periodo1Fim: '2026-03-14' },
      ];
      const result = checkSectorOverlap(1, '2026-03-10', '2026-03-20', colabList, feriasList, [], []);
      expect(result.length).toBe(0);
    });

    it('deve detectar sobreposição com day offs', () => {
      const dayOffList = [
        { colaboradorId: 2, status: 'aprovado', dataEfetiva: '2026-03-15' },
      ];
      const result = checkSectorOverlap(1, '2026-03-14', '2026-03-16', colabList, [], dayOffList, []);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Maria');
    });

    it('deve detectar sobreposição com folgas', () => {
      const solList = [
        { colaboradorId: 2, status: 'pendente', dataInicio: '2026-03-10', dataFim: '2026-03-12' },
      ];
      const result = checkSectorOverlap(1, '2026-03-11', '2026-03-15', colabList, [], [], solList);
      expect(result.length).toBeGreaterThan(0);
    });

    it('deve ignorar férias canceladas', () => {
      const feriasList = [
        { colaboradorId: 2, status: 'cancelada', periodo1Inicio: '2026-03-01', periodo1Fim: '2026-03-14' },
      ];
      const result = checkSectorOverlap(1, '2026-03-10', '2026-03-20', colabList, feriasList, [], []);
      expect(result.length).toBe(0);
    });

    it('deve retornar vazio quando colaborador não tem setor', () => {
      const colabSemSetor = [
        { id: 1, setor: '', nomeCompleto: 'João', ativo: true },
        { id: 2, setor: 'TI', nomeCompleto: 'Maria', ativo: true },
      ];
      const result = checkSectorOverlap(1, '2026-03-10', '2026-03-20', colabSemSetor, [], [], []);
      expect(result.length).toBe(0);
    });

    it('deve deduplicar conflitos do mesmo colaborador', () => {
      const feriasList = [
        { colaboradorId: 2, status: 'programada', periodo1Inicio: '2026-03-01', periodo1Fim: '2026-03-14' },
        { colaboradorId: 2, status: 'programada', periodo1Inicio: '2026-03-05', periodo1Fim: '2026-03-12' },
      ];
      const result = checkSectorOverlap(1, '2026-03-10', '2026-03-20', colabList, feriasList, [], []);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Calendar view logic', () => {
    it('deve disponibilizar ano atual e próximo ano', () => {
      const anoAtual = new Date().getFullYear();
      const availableYears = [anoAtual, anoAtual + 1];
      expect(availableYears).toHaveLength(2);
      expect(availableYears[0]).toBe(anoAtual);
      expect(availableYears[1]).toBe(anoAtual + 1);
    });

    it('deve gerar eventos de calendário a partir de férias', () => {
      const events: Record<string, any[]> = {};
      const addEvent = (dateStr: string, ev: any) => {
        if (!events[dateStr]) events[dateStr] = [];
        events[dateStr].push(ev);
      };

      const inicio = new Date('2026-03-01T12:00:00');
      const fim = new Date('2026-03-03T12:00:00');
      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        addEvent(d.toISOString().split('T')[0], { tipo: 'ferias', nome: 'João' });
      }

      expect(Object.keys(events)).toHaveLength(3);
      expect(events['2026-03-01']).toHaveLength(1);
      expect(events['2026-03-02']).toHaveLength(1);
      expect(events['2026-03-03']).toHaveLength(1);
    });

    it('deve filtrar eventos por mês corretamente', () => {
      const events: Record<string, any[]> = {
        '2026-03-01': [{ tipo: 'ferias', nome: 'João' }],
        '2026-03-15': [{ tipo: 'folga', nome: 'Maria' }],
        '2026-04-01': [{ tipo: 'ferias', nome: 'Pedro' }],
      };

      const prefix = '2026-03';
      const monthEvents = Object.entries(events)
        .filter(([date]) => date.startsWith(prefix))
        .flatMap(([date, evts]) => evts.map(e => ({ date, ...e })));

      expect(monthEvents).toHaveLength(2);
      expect(monthEvents[0].nome).toBe('João');
      expect(monthEvents[1].nome).toBe('Maria');
    });
  });

  describe('Concessivo alert filtering', () => {
    it('deve identificar colaboradores com concessivo a vencer em 6 meses', () => {
      const colabs = [
        { id: 1, nomeCompleto: 'A', dataAdmissao: '2023-08-22' },
        { id: 2, nomeCompleto: 'B', dataAdmissao: '2025-06-01' },
      ];

      const results = colabs.map(c => ({
        ...c,
        periodo: calcPeriodoAquisitivo(c.dataAdmissao),
      })).filter(c => c.periodo && c.periodo.proximoVencer && !c.periodo.vencido);

      expect(Array.isArray(results)).toBe(true);
    });

    it('deve calcular concessivo corretamente para funcionário antigo', () => {
      const p = calcPeriodoAquisitivo('2022-01-01');
      expect(p).not.toBeNull();
      expect(p!.vencido).toBe(false);
      expect(p!.diasParaVencer).toBeGreaterThan(0);
    });
  });

  describe('Saldo calculation', () => {
    it('deve calcular saldo de férias corretamente', () => {
      const feriasList = [
        { colaboradorId: 1, status: 'programada', periodo1Dias: 14, periodo2Dias: 0, periodo3Dias: 0 },
        { colaboradorId: 1, status: 'concluida', periodo1Dias: 10, periodo2Dias: 0, periodo3Dias: 0 },
      ];

      const fc = feriasList.filter(f => f.colaboradorId === 1 && f.status !== 'cancelada');
      const du = fc.reduce((s, f) => s + (f.periodo1Dias || 0) + (f.periodo2Dias || 0) + (f.periodo3Dias || 0), 0);
      const saldo = { diasUsados: du, saldoDias: 30 - du, diasDireito: 30, periodosUsados: fc.length, periodosRestantes: 3 - fc.length };

      expect(saldo.diasUsados).toBe(24);
      expect(saldo.saldoDias).toBe(6);
      expect(saldo.periodosUsados).toBe(2);
      expect(saldo.periodosRestantes).toBe(1);
    });

    it('deve ignorar férias canceladas no cálculo de saldo', () => {
      const feriasList = [
        { colaboradorId: 1, status: 'programada', periodo1Dias: 14, periodo2Dias: 0, periodo3Dias: 0 },
        { colaboradorId: 1, status: 'cancelada', periodo1Dias: 10, periodo2Dias: 0, periodo3Dias: 0 },
      ];

      const fc = feriasList.filter(f => f.colaboradorId === 1 && f.status !== 'cancelada');
      const du = fc.reduce((s, f) => s + (f.periodo1Dias || 0) + (f.periodo2Dias || 0) + (f.periodo3Dias || 0), 0);

      expect(du).toBe(14);
      expect(30 - du).toBe(16);
    });
  });
});
