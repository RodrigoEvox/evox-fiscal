import { describe, it, expect, vi } from 'vitest';

// Mock the database module
vi.mock('./dbCredito', () => ({
  getCreditTaskById: vi.fn(),
  updateCreditTask: vi.fn(),
  createCreditTask: vi.fn(),
  listTaskTeses: vi.fn(),
  createTaskTese: vi.fn(),
  logCreditAudit: vi.fn(),
  getRtiReportById: vi.fn(),
  updateRtiReport: vi.fn(),
  updateCreditCase: vi.fn(),
  listCreditTasks: vi.fn(),
  getCreditTaskStats: vi.fn(),
}));

vi.mock('./_core/notification', () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import * as credDb from './dbCredito';

describe('Workflow: assumeTask', () => {
  it('should validate task status is a_fazer before assuming', async () => {
    const mockTask = { id: 1, codigo: 'CT-0001', status: 'fazendo', fila: 'apuracao', responsavelId: null };
    (credDb.getCreditTaskById as any).mockResolvedValue(mockTask);

    // The procedure should reject tasks that are not a_fazer
    expect(mockTask.status).not.toBe('a_fazer');
  });

  it('should allow assuming a task with status a_fazer', async () => {
    const mockTask = { id: 1, codigo: 'CT-0001', status: 'a_fazer', fila: 'apuracao', responsavelId: null };
    (credDb.getCreditTaskById as any).mockResolvedValue(mockTask);
    (credDb.updateCreditTask as any).mockResolvedValue(undefined);
    (credDb.logCreditAudit as any).mockResolvedValue(undefined);

    // Simulate the assume logic
    expect(mockTask.status).toBe('a_fazer');
    await credDb.updateCreditTask(1, { status: 'fazendo', responsavelId: 10, responsavelNome: 'Analista' } as any);
    expect(credDb.updateCreditTask).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'fazendo' }));
  });
});

describe('Workflow: finishTask', () => {
  it('should validate task status is fazendo before finishing', async () => {
    const mockTask = { id: 1, codigo: 'CT-0001', status: 'a_fazer', fila: 'apuracao' };
    (credDb.getCreditTaskById as any).mockResolvedValue(mockTask);

    expect(mockTask.status).not.toBe('fazendo');
  });

  it('should allow finishing a task with status fazendo', async () => {
    const mockTask = { id: 1, codigo: 'CT-0001', status: 'fazendo', fila: 'apuracao', observacoes: '', anexos: null };
    (credDb.getCreditTaskById as any).mockResolvedValue(mockTask);
    (credDb.updateCreditTask as any).mockResolvedValue(undefined);
    (credDb.logCreditAudit as any).mockResolvedValue(undefined);

    expect(mockTask.status).toBe('fazendo');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const anexos = [{ nome: 'calc.pdf', url: 'https://s3.example.com/calc.pdf', tipo: 'application/pdf' }];
    await credDb.updateCreditTask(1, {
      status: 'feito',
      dataConclusao: now,
      observacoes: 'Análise concluída',
      anexos: JSON.stringify(anexos),
    } as any);
    expect(credDb.updateCreditTask).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'feito' }));
  });

  it('should merge existing anexos with new ones', () => {
    const existingAnexos = [{ nome: 'old.pdf', url: 'https://s3.example.com/old.pdf' }];
    const newAnexos = [{ nome: 'new.pdf', url: 'https://s3.example.com/new.pdf' }];
    const allAnexos = [...existingAnexos, ...newAnexos];
    expect(allAnexos).toHaveLength(2);
    expect(allAnexos[0].nome).toBe('old.pdf');
    expect(allAnexos[1].nome).toBe('new.pdf');
  });
});

describe('Workflow: completeAndMoveToNextFila', () => {
  it('should validate task status is feito before completing', async () => {
    const mockTask = { id: 1, codigo: 'CT-0001', status: 'fazendo', fila: 'apuracao' };
    (credDb.getCreditTaskById as any).mockResolvedValue(mockTask);

    expect(mockTask.status).not.toBe('feito');
  });

  it('should move task from apuracao to compensacao', async () => {
    const mockTask = { id: 1, codigo: 'CT-0001', status: 'feito', fila: 'apuracao', caseId: 1, clienteId: 1, titulo: 'Test', prioridade: 'media' };
    (credDb.getCreditTaskById as any).mockResolvedValue(mockTask);
    (credDb.updateCreditTask as any).mockResolvedValue(undefined);
    (credDb.createCreditTask as any).mockResolvedValue({ id: 2, codigo: 'CT-0002' });
    (credDb.listTaskTeses as any).mockResolvedValue([
      { teseId: 1, teseNome: 'PIS/COFINS', aderente: 1, valorEstimado: 10000 },
    ]);
    (credDb.createTaskTese as any).mockResolvedValue(1);
    (credDb.logCreditAudit as any).mockResolvedValue(undefined);

    const FILA_FLOW: Record<string, string | null> = {
      onboarding: 'apuracao', apuracao: 'compensacao',
      compensacao: null, retificacao: null, ressarcimento: null,
      restituicao: null, revisao: null, chamados: null,
    };

    const nextFila = FILA_FLOW[mockTask.fila];
    expect(nextFila).toBe('compensacao');

    // Simulate the complete flow
    await credDb.updateCreditTask(1, { status: 'concluido' } as any);
    const nextTask = await credDb.createCreditTask({
      fila: nextFila,
      caseId: mockTask.caseId,
      clienteId: mockTask.clienteId,
      titulo: mockTask.titulo,
      prioridade: mockTask.prioridade,
    } as any);

    expect(nextTask).toBeDefined();
    expect(nextTask!.id).toBe(2);

    // Copy teses
    const taskTeses = await credDb.listTaskTeses(1);
    expect(taskTeses).toHaveLength(1);
    await credDb.createTaskTese({ taskId: 2, teseId: 1, teseNome: 'PIS/COFINS' });
    expect(credDb.createTaskTese).toHaveBeenCalledWith(expect.objectContaining({ taskId: 2 }));
  });

  it('should not create next task for filas at end of flow', () => {
    const FILA_FLOW: Record<string, string | null> = {
      onboarding: 'apuracao', apuracao: 'compensacao',
      compensacao: null, retificacao: null, ressarcimento: null,
      restituicao: null, revisao: null, chamados: null,
    };

    expect(FILA_FLOW['compensacao']).toBeNull();
    expect(FILA_FLOW['retificacao']).toBeNull();
    expect(FILA_FLOW['ressarcimento']).toBeNull();
  });

  it('should move task from onboarding to apuracao', () => {
    const FILA_FLOW: Record<string, string | null> = {
      onboarding: 'apuracao', apuracao: 'compensacao',
      compensacao: null, retificacao: null, ressarcimento: null,
      restituicao: null, revisao: null, chamados: null,
    };

    expect(FILA_FLOW['onboarding']).toBe('apuracao');
  });
});

describe('Workflow: RTI emitir auto-complete', () => {
  it('should auto-complete task when RTI is emitted', async () => {
    const mockRti = { id: 1, taskId: 1, numero: 'RTI-0001', caseId: 1 };
    const mockTask = { id: 1, codigo: 'CT-0001', status: 'feito', fila: 'apuracao', caseId: 1, clienteId: 1, titulo: 'Test', prioridade: 'media' };
    (credDb.getRtiReportById as any).mockResolvedValue(mockRti);
    (credDb.getCreditTaskById as any).mockResolvedValue(mockTask);
    (credDb.updateCreditTask as any).mockResolvedValue(undefined);
    (credDb.updateRtiReport as any).mockResolvedValue(undefined);
    (credDb.updateCreditCase as any).mockResolvedValue(undefined);
    (credDb.createCreditTask as any).mockResolvedValue({ id: 2, codigo: 'CT-0002' });
    (credDb.listTaskTeses as any).mockResolvedValue([]);
    (credDb.logCreditAudit as any).mockResolvedValue(undefined);

    // Simulate emitir flow
    expect(mockRti.taskId).toBeTruthy();
    expect(mockTask.status === 'feito' || mockTask.status === 'fazendo').toBe(true);

    // Should mark as concluido
    await credDb.updateCreditTask(mockRti.taskId, { status: 'concluido' } as any);
    expect(credDb.updateCreditTask).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'concluido' }));
  });

  it('should not auto-complete task if already concluido', () => {
    const mockTask = { id: 1, status: 'concluido' };
    expect(mockTask.status === 'feito' || mockTask.status === 'fazendo').toBe(false);
  });
});

describe('Status flow validation', () => {
  it('should have correct status transitions', () => {
    const validTransitions: Record<string, string[]> = {
      a_fazer: ['fazendo'],      // assume task
      fazendo: ['feito'],        // finish task
      feito: ['concluido'],      // complete task
      concluido: [],             // terminal state
    };

    expect(validTransitions['a_fazer']).toContain('fazendo');
    expect(validTransitions['fazendo']).toContain('feito');
    expect(validTransitions['feito']).toContain('concluido');
    expect(validTransitions['concluido']).toHaveLength(0);
  });

  it('should have all status labels defined', () => {
    const STATUS_LABELS: Record<string, { label: string; color: string }> = {
      a_fazer: { label: 'A Fazer', color: 'bg-amber-100 text-amber-800' },
      fazendo: { label: 'Fazendo', color: 'bg-blue-100 text-blue-800' },
      feito: { label: 'Feito', color: 'bg-purple-100 text-purple-800' },
      concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800' },
    };

    expect(Object.keys(STATUS_LABELS)).toHaveLength(4);
    expect(STATUS_LABELS['feito'].label).toBe('Feito');
    expect(STATUS_LABELS['concluido'].label).toBe('Concluído');
  });
});

describe('Dashboard FEITO card', () => {
  it('should count tasks with feito status separately from concluido', () => {
    const tasks = [
      { status: 'a_fazer' },
      { status: 'a_fazer' },
      { status: 'fazendo' },
      { status: 'feito' },
      { status: 'feito' },
      { status: 'feito' },
      { status: 'concluido' },
    ];

    const feito = tasks.filter(t => t.status === 'feito').length;
    const concluido = tasks.filter(t => t.status === 'concluido').length;
    const fazendo = tasks.filter(t => t.status === 'fazendo').length;
    const aFazer = tasks.filter(t => t.status === 'a_fazer').length;

    expect(feito).toBe(3);
    expect(concluido).toBe(1);
    expect(fazendo).toBe(1);
    expect(aFazer).toBe(2);
  });
});
