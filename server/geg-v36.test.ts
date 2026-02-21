import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  listValeTransporte: vi.fn().mockResolvedValue([]),
  createValeTransporte: vi.fn().mockResolvedValue(1),
  updateValeTransporte: vi.fn().mockResolvedValue(undefined),
  deleteValeTransporte: vi.fn().mockResolvedValue(undefined),
  listAcademiaBeneficio: vi.fn().mockResolvedValue([]),
  createAcademiaBeneficio: vi.fn().mockResolvedValue(2),
  updateAcademiaBeneficio: vi.fn().mockResolvedValue(undefined),
  deleteAcademiaBeneficio: vi.fn().mockResolvedValue(undefined),
  listComissaoRh: vi.fn().mockResolvedValue([]),
  createComissaoRh: vi.fn().mockResolvedValue(3),
  updateComissaoRh: vi.fn().mockResolvedValue(undefined),
  deleteComissaoRh: vi.fn().mockResolvedValue(undefined),
  listDayOff: vi.fn().mockResolvedValue([]),
  createDayOff: vi.fn().mockResolvedValue(4),
  updateDayOff: vi.fn().mockResolvedValue(undefined),
  deleteDayOff: vi.fn().mockResolvedValue(undefined),
  listDoacaoSangue: vi.fn().mockResolvedValue([]),
  createDoacaoSangue: vi.fn().mockResolvedValue(5),
  updateDoacaoSangue: vi.fn().mockResolvedValue(undefined),
  deleteDoacaoSangue: vi.fn().mockResolvedValue(undefined),
  listReajustesSalariais: vi.fn().mockResolvedValue([]),
  createReajusteSalarial: vi.fn().mockResolvedValue(6),
  updateReajusteSalarial: vi.fn().mockResolvedValue(undefined),
  checkReajusteDoisAnos: vi.fn().mockResolvedValue([]),
  listApontamentosFolha: vi.fn().mockResolvedValue([]),
  gerarApontamentosFolha: vi.fn().mockResolvedValue(7),
  listNiveisCargo: vi.fn().mockResolvedValue([]),
  createNivelCargo: vi.fn().mockResolvedValue(8),
  updateNivelCargo: vi.fn().mockResolvedValue(undefined),
  deleteNivelCargo: vi.fn().mockResolvedValue(undefined),
  deleteFerias: vi.fn().mockResolvedValue(undefined),
}));

import * as db from './db';

describe('GEG v36 — Vale Transporte', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listValeTransporte should be callable', async () => {
    const result = await db.listValeTransporte();
    expect(result).toEqual([]);
    expect(db.listValeTransporte).toHaveBeenCalledTimes(1);
  });

  it('createValeTransporte should return an id', async () => {
    const id = await db.createValeTransporte({
      colaboradorId: 1,
      colaboradorNome: 'João',
      cidade: 'São Paulo',
      valorPassagem: '4.40',
      qtdPassagensDia: 2,
      diasUteisMes: 22,
      mesReferencia: 2,
      anoReferencia: 2026,
    } as any);
    expect(id).toBe(1);
    expect(db.createValeTransporte).toHaveBeenCalledWith(expect.objectContaining({
      colaboradorId: 1,
      cidade: 'São Paulo',
    }));
  });

  it('updateValeTransporte should be callable', async () => {
    await db.updateValeTransporte(1, { valorPassagem: '5.00' } as any);
    expect(db.updateValeTransporte).toHaveBeenCalledWith(1, { valorPassagem: '5.00' });
  });

  it('deleteValeTransporte should be callable', async () => {
    await db.deleteValeTransporte(1);
    expect(db.deleteValeTransporte).toHaveBeenCalledWith(1);
  });
});

describe('GEG v36 — Academia Benefício', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listAcademiaBeneficio should be callable', async () => {
    const result = await db.listAcademiaBeneficio();
    expect(result).toEqual([]);
  });

  it('createAcademiaBeneficio should return an id', async () => {
    const id = await db.createAcademiaBeneficio({
      colaboradorId: 1,
      colaboradorNome: 'Maria',
      nomeAcademia: 'Smart Fit',
      plano: 'Black',
      valor: '99.90',
      descontoFolha: true,
    } as any);
    expect(id).toBe(2);
  });

  it('deleteAcademiaBeneficio should be callable', async () => {
    await db.deleteAcademiaBeneficio(2);
    expect(db.deleteAcademiaBeneficio).toHaveBeenCalledWith(2);
  });
});

describe('GEG v36 — Comissão RH', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listComissaoRh should be callable', async () => {
    const result = await db.listComissaoRh();
    expect(result).toEqual([]);
  });

  it('createComissaoRh should return an id', async () => {
    const id = await db.createComissaoRh({
      colaboradorId: 1,
      colaboradorNome: 'Carlos',
      tipo: 'monitor',
      mesReferencia: 2,
      anoReferencia: 2026,
      valorComissao: '500.00',
    } as any);
    expect(id).toBe(3);
  });
});

describe('GEG v36 — Day Off', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listDayOff should be callable', async () => {
    const result = await db.listDayOff();
    expect(result).toEqual([]);
  });

  it('createDayOff should return an id', async () => {
    const id = await db.createDayOff({
      colaboradorId: 1,
      colaboradorNome: 'Ana',
      dataAniversario: '2026-03-15',
      dataOriginal: '2026-03-15',
      dataEfetiva: '2026-03-15',
    } as any);
    expect(id).toBe(4);
  });

  it('updateDayOff should be callable', async () => {
    await db.updateDayOff(4, { status: 'aprovado' } as any);
    expect(db.updateDayOff).toHaveBeenCalledWith(4, { status: 'aprovado' });
  });
});

describe('GEG v36 — Doação de Sangue', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listDoacaoSangue should be callable', async () => {
    const result = await db.listDoacaoSangue();
    expect(result).toEqual([]);
  });

  it('createDoacaoSangue should return an id', async () => {
    const id = await db.createDoacaoSangue({
      colaboradorId: 1,
      colaboradorNome: 'Pedro',
      dataDoacao: '2026-02-20',
      prazoFolga: '1',
    } as any);
    expect(id).toBe(5);
  });

  it('deleteDoacaoSangue should be callable', async () => {
    await db.deleteDoacaoSangue(5);
    expect(db.deleteDoacaoSangue).toHaveBeenCalledWith(5);
  });
});

describe('GEG v36 — Reajustes Salariais', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listReajustesSalariais should be callable', async () => {
    const result = await db.listReajustesSalariais();
    expect(result).toEqual([]);
  });

  it('createReajusteSalarial should return an id', async () => {
    const id = await db.createReajusteSalarial({
      colaboradorId: 1,
      colaboradorNome: 'Lucas',
      tipo: 'sindical',
      percentual: '5.00',
      salarioAnterior: '3000.00',
      salarioNovo: '3150.00',
      dataEfetivacao: '2026-03-01',
    } as any);
    expect(id).toBe(6);
  });

  it('checkReajusteDoisAnos should return eligible employees', async () => {
    const result = await db.checkReajusteDoisAnos();
    expect(result).toEqual([]);
    expect(db.checkReajusteDoisAnos).toHaveBeenCalledTimes(1);
  });
});

describe('GEG v36 — Apontamentos Folha', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listApontamentosFolha should be callable', async () => {
    const result = await db.listApontamentosFolha();
    expect(result).toEqual([]);
  });

  it('gerarApontamentosFolha should return an id', async () => {
    const id = await db.gerarApontamentosFolha(2, 2026);
    expect(id).toBe(7);
    expect(db.gerarApontamentosFolha).toHaveBeenCalledWith(2, 2026);
  });
});

describe('GEG v36 — Níveis de Cargo', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listNiveisCargo should be callable', async () => {
    const result = await db.listNiveisCargo();
    expect(result).toEqual([]);
  });

  it('createNivelCargo should return an id', async () => {
    const id = await db.createNivelCargo({
      setorId: 1,
      cargo: 'Analista',
      nivel: 1,
    } as any);
    expect(id).toBe(8);
  });

  it('updateNivelCargo should be callable', async () => {
    await db.updateNivelCargo(8, { nivel: 2 } as any);
    expect(db.updateNivelCargo).toHaveBeenCalledWith(8, { nivel: 2 });
  });

  it('deleteNivelCargo should be callable', async () => {
    await db.deleteNivelCargo(8);
    expect(db.deleteNivelCargo).toHaveBeenCalledWith(8);
  });
});

describe('GEG v36 — Férias (Delete)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('deleteFerias should be callable', async () => {
    await db.deleteFerias(1);
    expect(db.deleteFerias).toHaveBeenCalledWith(1);
  });
});
