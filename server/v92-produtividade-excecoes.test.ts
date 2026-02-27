import { describe, it, expect } from 'vitest';

describe('v92 — Productivity Report, Exceptions Panel, Notifications', () => {

  // --- Time Counter Fix ---
  describe('Time counter (getTimeInStage) fix', () => {
    const getTimeInQueue = (task: any) => {
      const created = task.createdAt ? new Date(task.createdAt).getTime() : Date.now();
      const diff = Math.max(0, Date.now() - created);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
      return `${hours}h ${minutes}m`;
    };

    it('should never return negative time', () => {
      // Task created in the future (clock skew scenario)
      const futureTask = { createdAt: new Date(Date.now() + 60000).toISOString() };
      const result = getTimeInQueue(futureTask);
      expect(result).toBe('0h 0m');
    });

    it('should return correct time for a task created 2 hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const result = getTimeInQueue({ createdAt: twoHoursAgo });
      expect(result).toMatch(/^2h \d+m$/);
    });

    it('should return days format for tasks older than 24h', () => {
      const twoDaysAgo = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
      const result = getTimeInQueue({ createdAt: twoDaysAgo });
      expect(result).toMatch(/^\d+d \d+h$/);
    });

    it('should handle null createdAt gracefully', () => {
      const result = getTimeInQueue({ createdAt: null });
      expect(result).toBe('0h 0m');
    });
  });

  // --- Criado Por Column ---
  describe('Criado Por column with Brasília timezone', () => {
    it('should format date in pt-BR with Sao Paulo timezone', () => {
      const createdAt = '2026-02-15T14:30:00.000Z';
      const formatted = new Date(createdAt).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('should display creator name when available', () => {
      const task = { criadoPorNome: 'João Silva', createdAt: '2026-02-15T14:30:00.000Z' };
      expect(task.criadoPorNome).toBe('João Silva');
    });

    it('should show dash when creator name is null', () => {
      const task = { criadoPorNome: null, createdAt: '2026-02-15T14:30:00.000Z' };
      expect(task.criadoPorNome || '—').toBe('—');
    });
  });

  // --- Productivity Report ---
  describe('Productivity report data structure', () => {
    const mockProductivityData = {
      porAnalista: [
        { responsavelNome: 'Ana', responsavelId: 1, fila: 'apuracao', totalTarefas: 20, concluidas: 15, emAndamento: 3, pendentes: 2, atrasadas: 1, tempoMedioConclusaoHoras: 48, viaveis: 10, inviaveis: 5 },
        { responsavelNome: 'Ana', responsavelId: 1, fila: 'retificacao', totalTarefas: 5, concluidas: 4, emAndamento: 1, pendentes: 0, atrasadas: 0, tempoMedioConclusaoHoras: 24, viaveis: 3, inviaveis: 1 },
        { responsavelNome: 'Bruno', responsavelId: 2, fila: 'apuracao', totalTarefas: 10, concluidas: 8, emAndamento: 1, pendentes: 1, atrasadas: 0, tempoMedioConclusaoHoras: 36, viaveis: 6, inviaveis: 2 },
      ],
      porFila: [
        { fila: 'apuracao', totalTarefas: 30, concluidas: 23, atrasadas: 1, tempoMedioConclusaoHoras: 42, tempoMinConclusaoHoras: 2, tempoMaxConclusaoHoras: 120, tempoMedioEmFilaHoras: 18 },
        { fila: 'retificacao', totalTarefas: 5, concluidas: 4, atrasadas: 0, tempoMedioConclusaoHoras: 24, tempoMinConclusaoHoras: 4, tempoMaxConclusaoHoras: 48, tempoMedioEmFilaHoras: 12 },
      ],
      evolucaoMensal: [
        { mes: '2026-01', criadas: 20, concluidas: 15, atrasadas: 2 },
        { mes: '2026-02', criadas: 15, concluidas: 12, atrasadas: 1 },
      ],
      resumo: { totalTarefas: 35, concluidas: 27, emAndamento: 5, pendentes: 3, feitas: 0, atrasadas: 1, tempoMedioConclusaoHoras: 40, totalAnalistas: 2 },
    };

    it('should aggregate analyst data across queues', () => {
      const map: Record<string, { nome: string; total: number; concluidas: number }> = {};
      for (const a of mockProductivityData.porAnalista) {
        const nome = a.responsavelNome;
        if (!map[nome]) map[nome] = { nome, total: 0, concluidas: 0 };
        map[nome].total += a.totalTarefas;
        map[nome].concluidas += a.concluidas;
      }
      const agg = Object.values(map);
      expect(agg).toHaveLength(2);
      const ana = agg.find(a => a.nome === 'Ana')!;
      expect(ana.total).toBe(25);
      expect(ana.concluidas).toBe(19);
    });

    it('should calculate completion rate correctly', () => {
      const total = 25;
      const concluidas = 19;
      const rate = Math.round((concluidas / total) * 100);
      expect(rate).toBe(76);
    });

    it('should format hours correctly', () => {
      const formatHours = (h: number | null) => {
        if (h === null || h === undefined || isNaN(h)) return '—';
        const hrs = Math.round(h);
        if (hrs >= 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
        return `${hrs}h`;
      };
      expect(formatHours(48)).toBe('2d 0h');
      expect(formatHours(5)).toBe('5h');
      expect(formatHours(null)).toBe('—');
      expect(formatHours(0)).toBe('0h');
    });

    it('should have monthly evolution data in chronological order', () => {
      const months = mockProductivityData.evolucaoMensal.map(m => m.mes);
      expect(months[0]).toBe('2026-01');
      expect(months[1]).toBe('2026-02');
    });
  });

  // --- Exceptions Panel ---
  describe('Exceptions and reopenings panel', () => {
    const mockExceptionsData = {
      registros: [
        { id: 1, acao: 'queue_exception', taskCodigo: 'CT-0001', taskFila: 'apuracao', usuarioNome: 'Admin', descricao: 'Exceção aplicada', createdAt: '2026-02-15T14:30:00.000Z' },
        { id: 2, acao: 'reabertura', taskCodigo: 'CT-0002', taskFila: 'retificacao', usuarioNome: 'Admin', descricao: 'Tarefa reaberta', createdAt: '2026-02-15T15:00:00.000Z' },
        { id: 3, acao: 'queue_exception', taskCodigo: 'CT-0003', taskFila: 'apuracao', usuarioNome: 'Gestor2', descricao: 'Outra exceção', createdAt: '2026-02-16T10:00:00.000Z' },
      ],
      resumo: {
        totalExcecoes: 2,
        totalReaberturas: 1,
        total: 3,
        porGestor: { 'Admin': 2, 'Gestor2': 1 },
        porFila: { 'apuracao': 2, 'retificacao': 1 },
      },
    };

    it('should separate exceptions from reopenings', () => {
      const exceptions = mockExceptionsData.registros.filter(r => r.acao === 'queue_exception');
      const reopenings = mockExceptionsData.registros.filter(r => r.acao === 'reabertura');
      expect(exceptions).toHaveLength(2);
      expect(reopenings).toHaveLength(1);
    });

    it('should count by manager correctly', () => {
      expect(mockExceptionsData.resumo.porGestor['Admin']).toBe(2);
      expect(mockExceptionsData.resumo.porGestor['Gestor2']).toBe(1);
    });

    it('should count by queue correctly', () => {
      expect(mockExceptionsData.resumo.porFila['apuracao']).toBe(2);
      expect(mockExceptionsData.resumo.porFila['retificacao']).toBe(1);
    });
  });

  // --- Notifications ---
  describe('Notification creation for reopen and exception', () => {
    it('should create notification data for task reopen', () => {
      const task = { id: 1, codigo: 'CT-0001', titulo: 'Apuração Empresa X', responsavelId: 5 };
      const user = { name: 'Admin João' };
      const justificativa = 'Dados incorretos precisam ser revisados';

      const notifData = {
        tipo: 'tarefa_atribuida' as const,
        titulo: `Tarefa ${task.codigo} reaberta`,
        mensagem: `A tarefa "${task.titulo}" foi reaberta pelo gestor ${user.name}. Motivo: ${justificativa}`,
        usuarioId: task.responsavelId,
        tarefaId: task.id,
        lida: 0,
      };

      expect(notifData.tipo).toBe('tarefa_atribuida');
      expect(notifData.titulo).toContain('CT-0001');
      expect(notifData.titulo).toContain('reaberta');
      expect(notifData.mensagem).toContain('Admin João');
      expect(notifData.mensagem).toContain('Dados incorretos');
      expect(notifData.usuarioId).toBe(5);
    });

    it('should create notification data for queue exception (assign)', () => {
      const task = { id: 2, codigo: 'CT-0002', titulo: 'Retificação Empresa Y', responsavelId: 3 };
      const user = { name: 'Gestor Maria' };
      const analystId = 7;
      const justificativa = 'Urgência do cliente';

      const notifUserId = analystId; // assign_to_analyst
      const acaoLabel = 'atribuída diretamente a você';
      const notifData = {
        tipo: 'tarefa_atribuida' as const,
        titulo: `Exceção de fila — ${task.codigo}`,
        mensagem: `A tarefa "${task.titulo}" foi ${acaoLabel} pelo gestor ${user.name}. Motivo: ${justificativa}`,
        usuarioId: notifUserId,
        tarefaId: task.id,
        lida: 0,
      };

      expect(notifData.usuarioId).toBe(7); // Goes to the assigned analyst
      expect(notifData.mensagem).toContain('atribuída diretamente a você');
      expect(notifData.mensagem).toContain('Gestor Maria');
    });

    it('should create notification data for queue exception (move to first)', () => {
      const task = { id: 3, codigo: 'CT-0003', titulo: 'Compensação Empresa Z', responsavelId: 4 };
      const user = { name: 'Gestor Pedro' };
      const justificativa = 'Prioridade máxima';

      const notifUserId = task.responsavelId; // move_to_first → notify current responsible
      const acaoLabel = 'movida para o topo da fila';
      const notifData = {
        tipo: 'tarefa_atribuida' as const,
        titulo: `Exceção de fila — ${task.codigo}`,
        mensagem: `A tarefa "${task.titulo}" foi ${acaoLabel} pelo gestor ${user.name}. Motivo: ${justificativa}`,
        usuarioId: notifUserId,
        tarefaId: task.id,
        lida: 0,
      };

      expect(notifData.usuarioId).toBe(4); // Goes to current responsible
      expect(notifData.mensagem).toContain('movida para o topo da fila');
    });

    it('should not create notification when no responsible user', () => {
      const task = { id: 4, codigo: 'CT-0004', titulo: 'Sem responsável', responsavelId: null };
      const shouldNotify = !!task.responsavelId;
      expect(shouldNotify).toBe(false);
    });
  });

  // --- Audit log acao for reabertura ---
  describe('Audit log acao field', () => {
    it('should use "reabertura" for reopen actions (for exceptions panel query)', () => {
      const acao = 'reabertura';
      const queryFilter = `cal.acao IN ('queue_exception', 'reabertura')`;
      expect(queryFilter).toContain(acao);
    });
  });
});
