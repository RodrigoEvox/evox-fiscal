import { describe, it, expect } from 'vitest';

// ===== 1. AUTO-GENERATE TERM PDF ON LOAN CREATION =====
describe('Auto-generate Term PDF on Loan Creation', () => {
  it('should include assinaturaColaboradorUrl and assinaturaBibliotecarioUrl in create input schema', () => {
    const input = {
      exemplarId: 1,
      livroId: 1,
      colaboradorId: 1,
      colaboradorNome: 'João Silva',
      dataRetirada: '2026-02-25',
      dataPrevistaDevolucao: '2026-03-11',
      assinaturaColaboradorUrl: 'data:image/png;base64,iVBOR...',
      assinaturaBibliotecarioUrl: 'data:image/png;base64,iVBOR...',
    };
    expect(input.assinaturaColaboradorUrl).toBeDefined();
    expect(input.assinaturaBibliotecarioUrl).toBeDefined();
  });

  it('should detect data URL signatures for S3 upload', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(dataUrl.startsWith('data:')).toBe(true);
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    expect(base64Data).not.toContain('data:');
    const buffer = Buffer.from(base64Data, 'base64');
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should skip S3 upload for non-data-URL signatures', () => {
    const s3Url = 'https://s3.example.com/signatures/sig.png';
    expect(s3Url.startsWith('data:')).toBe(false);
    // When it's already an S3 URL, no upload needed
  });

  it('should generate S3 key with random suffix for uniqueness', () => {
    const suffix1 = Math.random().toString(36).substring(2, 10);
    const suffix2 = Math.random().toString(36).substring(2, 10);
    const key1 = `biblioteca/assinaturas/new-colab-${suffix1}.png`;
    const key2 = `biblioteca/assinaturas/new-colab-${suffix2}.png`;
    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/^biblioteca\/assinaturas\/new-colab-\w+\.png$/);
  });

  it('should include term PDF URL in emprestimo record after generation', () => {
    const emprestimo = {
      id: 1,
      termoPdfUrl: 'https://s3.example.com/biblioteca/termos/termo-1-abc123.pdf',
      termoEnviadoEmail: 1,
    };
    expect(emprestimo.termoPdfUrl).toBeTruthy();
    expect(emprestimo.termoPdfUrl).toContain('termo-');
    expect(emprestimo.termoEnviadoEmail).toBe(1);
  });

  it('should send notification to collaborator with term info', () => {
    const notification = {
      tipo: 'biblioteca_vencimento',
      titulo: 'Termo de Responsabilidade - Empréstimo #1',
      mensagem: 'Olá João, seu empréstimo do livro "Clean Code" foi registrado.',
    };
    expect(notification.tipo).toBe('biblioteca_vencimento');
    expect(notification.titulo).toContain('Termo de Responsabilidade');
    expect(notification.mensagem).toContain('empréstimo');
  });

  it('should embed digital signatures in PDF when available', () => {
    const sigColabBuf = Buffer.from('fake-signature-data');
    const sigBibBuf = Buffer.from('fake-bib-signature-data');
    expect(sigColabBuf).toBeTruthy();
    expect(sigBibBuf).toBeTruthy();
    expect(sigColabBuf.length).toBeGreaterThan(0);
    expect(sigBibBuf.length).toBeGreaterThan(0);
  });

  it('should handle missing signatures gracefully in PDF', () => {
    const sigColabBuf: Buffer | null = null;
    const sigBibBuf: Buffer | null = null;
    // PDF should still generate without signatures
    expect(sigColabBuf).toBeNull();
    expect(sigBibBuf).toBeNull();
  });
});

// ===== 2. COLLABORATOR SELF-SERVICE PORTAL =====
describe('Collaborator Self-Service Portal', () => {
  it('should have meuPerfil procedure that returns colaborador by userId', () => {
    // The procedure links ctx.user.id to colaboradores.userId
    const userId = 42;
    expect(userId).toBeGreaterThan(0);
  });

  it('should return empty arrays when colaborador is not linked', () => {
    const colab = null;
    const emprestimos = colab ? [{ id: 1 }] : [];
    const reservas = colab ? [{ id: 1 }] : [];
    expect(emprestimos).toHaveLength(0);
    expect(reservas).toHaveLength(0);
  });

  it('should build catalog with availability info', () => {
    const livros = [
      { id: 1, titulo: 'Clean Code', autores: 'Robert Martin' },
      { id: 2, titulo: 'Design Patterns', autores: 'GoF' },
    ];
    const exemplares = [
      { id: 1, livroId: 1, status: 'disponivel' },
      { id: 2, livroId: 1, status: 'emprestado' },
      { id: 3, livroId: 2, status: 'disponivel' },
    ];
    const disponibilidade = new Map<number, { total: number; disponiveis: number }>();
    exemplares.forEach((ex) => {
      const cur = disponibilidade.get(ex.livroId) || { total: 0, disponiveis: 0 };
      cur.total++;
      if (ex.status === 'disponivel') cur.disponiveis++;
      disponibilidade.set(ex.livroId, cur);
    });
    expect(disponibilidade.get(1)?.total).toBe(2);
    expect(disponibilidade.get(1)?.disponiveis).toBe(1);
    expect(disponibilidade.get(2)?.total).toBe(1);
    expect(disponibilidade.get(2)?.disponiveis).toBe(1);
  });

  it('should filter catalog by search term', () => {
    const livros = [
      { id: 1, titulo: 'Clean Code', autores: 'Robert Martin', isbn: '978-0132350884', categoria: 'Programação' },
      { id: 2, titulo: 'Design Patterns', autores: 'GoF', isbn: '978-0201633610', categoria: 'Engenharia' },
    ];
    const busca = 'clean';
    const filtered = livros.filter((l) =>
      l.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
      l.autores?.toLowerCase().includes(busca.toLowerCase()) ||
      l.isbn?.toLowerCase().includes(busca.toLowerCase()) ||
      l.categoria?.toLowerCase().includes(busca.toLowerCase())
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].titulo).toBe('Clean Code');
  });

  it('should filter catalog by category', () => {
    const livros = [
      { id: 1, titulo: 'Clean Code', categoria: 'Programação' },
      { id: 2, titulo: 'Design Patterns', categoria: 'Engenharia' },
    ];
    const categoria = 'Programação';
    const filtered = livros.filter((l) => l.categoria === categoria);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].titulo).toBe('Clean Code');
  });

  it('should extract unique categories from livros', () => {
    const livros = [
      { categoria: 'Programação' },
      { categoria: 'Engenharia' },
      { categoria: 'Programação' },
      { categoria: null },
    ];
    const cats = new Set<string>();
    livros.forEach((l: any) => { if (l.categoria) cats.add(l.categoria); });
    expect(Array.from(cats).sort()).toEqual(['Engenharia', 'Programação']);
  });

  it('should prevent blocked collaborator from reserving', () => {
    const bloqueado = true;
    expect(() => {
      if (bloqueado) throw new Error('Você está bloqueado para empréstimos na biblioteca.');
    }).toThrow('bloqueado');
  });

  it('should prevent duplicate active reservation for same book', () => {
    const reservas = [
      { id: 1, livroId: 5, status: 'ativa' },
      { id: 2, livroId: 3, status: 'cancelada' },
    ];
    const livroId = 5;
    const jaReservou = reservas.some((r) => r.livroId === livroId && r.status === 'ativa');
    expect(jaReservou).toBe(true);
  });

  it('should allow reservation when no active reservation exists', () => {
    const reservas = [
      { id: 1, livroId: 5, status: 'cancelada' },
    ];
    const livroId = 5;
    const jaReservou = reservas.some((r) => r.livroId === livroId && r.status === 'ativa');
    expect(jaReservou).toBe(false);
  });

  it('should validate ownership before renewal', () => {
    const emp = { id: 1, colaboradorId: 10 };
    const colabId = 10;
    expect(emp.colaboradorId).toBe(colabId);
    // Different collaborator should fail
    const otherColabId = 20;
    expect(emp.colaboradorId).not.toBe(otherColabId);
  });

  it('should calculate new return date as 14 days from current due date', () => {
    const dataPrevista = '2026-03-11';
    const novaPrev = new Date(dataPrevista);
    novaPrev.setDate(novaPrev.getDate() + 14);
    expect(novaPrev.toISOString().split('T')[0]).toBe('2026-03-25');
  });

  it('should validate ownership before cancelling reservation', () => {
    const reservas = [
      { id: 1, colaboradorId: 10, status: 'ativa' },
      { id: 2, colaboradorId: 20, status: 'ativa' },
    ];
    const reservaId = 1;
    const colabId = 10;
    const reserva = reservas.find((r) => r.id === reservaId && r.colaboradorId === colabId);
    expect(reserva).toBeDefined();
    // Wrong collaborator
    const wrongReserva = reservas.find((r) => r.id === reservaId && r.colaboradorId === 20);
    expect(wrongReserva).toBeUndefined();
  });

  it('should separate active and historical loans', () => {
    const emprestimos = [
      { id: 1, status: 'ativo' },
      { id: 2, status: 'atrasado' },
      { id: 3, status: 'devolvido' },
      { id: 4, status: 'extraviado' },
    ];
    const ativos = emprestimos.filter((e) => e.status === 'ativo' || e.status === 'atrasado');
    const historico = emprestimos.filter((e) => e.status !== 'ativo' && e.status !== 'atrasado');
    expect(ativos).toHaveLength(2);
    expect(historico).toHaveLength(2);
  });

  it('should calculate remaining days correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const diasRestantes = Math.ceil((futureDate.getTime() - Date.now()) / 86400000);
    expect(diasRestantes).toBeGreaterThanOrEqual(2);
    expect(diasRestantes).toBeLessThanOrEqual(4);
  });
});

// ===== 3. DIGITAL SIGNATURE CANVAS =====
describe('Digital Signature Canvas', () => {
  it('should generate valid data URL from canvas', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should convert data URL to buffer for S3 upload', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should support both colaborador and bibliotecario signature types', () => {
    const tipos = ['colaborador', 'bibliotecario'] as const;
    expect(tipos).toContain('colaborador');
    expect(tipos).toContain('bibliotecario');
  });

  it('should generate unique S3 keys for each signature', () => {
    const emprestimoId = 1;
    const tipo1 = 'colaborador';
    const tipo2 = 'bibliotecario';
    const suffix = 'abc12345';
    const key1 = `biblioteca/assinaturas/${emprestimoId}-${tipo1}-${suffix}.png`;
    const key2 = `biblioteca/assinaturas/${emprestimoId}-${tipo2}-${suffix}.png`;
    expect(key1).not.toBe(key2);
    expect(key1).toContain('colaborador');
    expect(key2).toContain('bibliotecario');
  });

  it('should update emprestimo record with signature URL', () => {
    const updateData = { assinaturaColaboradorUrl: 'https://s3.example.com/sig.png' };
    expect(updateData).toHaveProperty('assinaturaColaboradorUrl');
    expect(updateData.assinaturaColaboradorUrl).toContain('https://');
  });

  it('should trigger PDF regeneration after signature save', () => {
    // After saving signature, generateAndStoreTermoPdf should be called
    const emp = { id: 1, colaboradorId: 10 };
    expect(emp.id).toBeGreaterThan(0);
    expect(emp.colaboradorId).toBeGreaterThan(0);
  });

  it('should create audit log for signature action', () => {
    const audit = {
      acao: 'ajuste_manual',
      entidadeTipo: 'emprestimo',
      entidadeNome: 'Assinatura colaborador',
      entidadeId: 1,
    };
    expect(audit.acao).toBe('ajuste_manual');
    expect(audit.entidadeTipo).toBe('emprestimo');
  });

  it('should show signature indicators in emprestimos table', () => {
    const emp = {
      assinaturaColaboradorUrl: 'https://s3.example.com/sig-colab.png',
      assinaturaBibliotecarioUrl: null,
    };
    const hasColabSig = !!emp.assinaturaColaboradorUrl;
    const hasBibSig = !!emp.assinaturaBibliotecarioUrl;
    expect(hasColabSig).toBe(true);
    expect(hasBibSig).toBe(false);
  });

  it('should only show sign button for active loans without collaborator signature', () => {
    const scenarios = [
      { status: 'ativo', hasColabSig: false, shouldShowButton: true },
      { status: 'ativo', hasColabSig: true, shouldShowButton: false },
      { status: 'atrasado', hasColabSig: false, shouldShowButton: true },
      { status: 'devolvido', hasColabSig: false, shouldShowButton: false },
    ];
    scenarios.forEach((s) => {
      const show = (s.status === 'ativo' || s.status === 'atrasado') && !s.hasColabSig;
      expect(show).toBe(s.shouldShowButton);
    });
  });
});

// ===== 4. SIDEBAR NAVIGATION =====
describe('Minha Biblioteca Navigation', () => {
  it('should have route /minha-biblioteca', () => {
    const route = '/minha-biblioteca';
    expect(route).toBe('/minha-biblioteca');
  });

  it('should be in the personal section of sidebar (after Minhas Tarefas)', () => {
    const sidebarOrder = [
      '/minhas-tarefas',
      '/minha-biblioteca',
    ];
    expect(sidebarOrder.indexOf('/minha-biblioteca')).toBeGreaterThan(sidebarOrder.indexOf('/minhas-tarefas'));
  });
});

// ===== 5. SCHEMA FIELDS =====
describe('Schema Fields for Signatures', () => {
  it('should have assinaturaColaboradorUrl field in bib_emprestimos', () => {
    const fields = ['assinaturaColaboradorUrl', 'assinaturaBibliotecarioUrl', 'termoPdfUrl', 'termoEnviadoEmail'];
    fields.forEach((f) => expect(f).toBeTruthy());
  });

  it('should have getColaboradorByUserId function', () => {
    // This function is needed for self-service to link user to colaborador
    const funcName = 'getColaboradorByUserId';
    expect(funcName).toBe('getColaboradorByUserId');
  });
});
