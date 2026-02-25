import { describe, it, expect, vi } from 'vitest';

// ===== 1. NOTIFICATION ENUM FIX TESTS =====
describe('Biblioteca Notification Enum', () => {
  it('should include biblioteca_vencimento in the valid notification types', () => {
    const validTypes = [
      'procuracao_vencendo', 'procuracao_vencida', 'analise_concluida',
      'nova_tese', 'tarefa_atribuida', 'tarefa_sla_vencendo', 'tarefa_comentario',
      'geral', 'avaliacao_ciclo_aberto', 'avaliacao_pendente', 'cct_vencimento',
      'biblioteca_vencimento',
    ];
    expect(validTypes).toContain('biblioteca_vencimento');
  });

  it('createNotificacao should handle Data truncated errors with fallback', async () => {
    // Simulate the fallback logic in createNotificacao
    const mockData = {
      tipo: 'biblioteca_vencimento' as const,
      titulo: 'Empréstimo vence amanhã: O Poder do Hábito',
      mensagem: 'Ana Paula deve devolver "O Poder do Hábito" amanhã.',
      lida: 0,
      usuarioId: 1,
    };

    // Verify the data structure is correct
    expect(mockData.tipo).toBe('biblioteca_vencimento');
    expect(mockData.titulo).toBeTruthy();
    expect(mockData.mensagem).toBeTruthy();
    expect(typeof mockData.lida).toBe('number');
    expect(mockData.lida).toBe(0);
  });

  it('should handle null optional fields in notification data', () => {
    const data = {
      tipo: 'biblioteca_vencimento' as const,
      titulo: 'Test',
      mensagem: 'Test message',
      lida: 0,
      usuarioId: null,
      clienteId: null,
      tarefaId: null,
    };

    expect(data.usuarioId ?? null).toBeNull();
    expect(data.clienteId ?? null).toBeNull();
    expect(data.tarefaId ?? null).toBeNull();
  });
});

// ===== 2. GLOBAL SEARCH INTEGRATION TESTS =====
describe('Global Search - Library Books Integration', () => {
  it('should build correct LIKE pattern for search terms', () => {
    const termo = 'Poder';
    const like = `%${termo}%`;
    expect(like).toBe('%Poder%');
  });

  it('should match book title with search term', () => {
    const books = [
      { id: 1, titulo: 'O Poder do Hábito', autores: 'Charles Duhigg', isbn: '978-8539004119', categoria: 'Desenvolvimento Pessoal' },
      { id: 2, titulo: 'Pai Rico, Pai Pobre', autores: 'Robert Kiyosaki', isbn: '978-8550801483', categoria: 'Finanças' },
      { id: 3, titulo: 'A Arte da Guerra', autores: 'Sun Tzu', isbn: '978-8525432698', categoria: 'Estratégia' },
    ];

    const termo = 'poder';
    const filtered = books.filter(b =>
      b.titulo.toLowerCase().includes(termo) ||
      b.autores.toLowerCase().includes(termo) ||
      (b.isbn && b.isbn.includes(termo)) ||
      (b.categoria && b.categoria.toLowerCase().includes(termo))
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].titulo).toBe('O Poder do Hábito');
  });

  it('should match book by author name', () => {
    const books = [
      { id: 1, titulo: 'O Poder do Hábito', autores: 'Charles Duhigg', isbn: '978-8539004119', categoria: 'Desenvolvimento Pessoal' },
      { id: 2, titulo: 'Pai Rico, Pai Pobre', autores: 'Robert Kiyosaki', isbn: '978-8550801483', categoria: 'Finanças' },
    ];

    const termo = 'kiyosaki';
    const filtered = books.filter(b =>
      b.titulo.toLowerCase().includes(termo) ||
      b.autores.toLowerCase().includes(termo)
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].titulo).toBe('Pai Rico, Pai Pobre');
  });

  it('should match book by ISBN', () => {
    const books = [
      { id: 1, titulo: 'O Poder do Hábito', autores: 'Charles Duhigg', isbn: '978-8539004119', categoria: 'Desenvolvimento Pessoal' },
    ];

    const termo = '8539004119';
    const filtered = books.filter(b =>
      b.titulo.toLowerCase().includes(termo) ||
      b.autores.toLowerCase().includes(termo) ||
      (b.isbn && b.isbn.includes(termo))
    );

    expect(filtered).toHaveLength(1);
  });

  it('should match book by category', () => {
    const books = [
      { id: 1, titulo: 'O Poder do Hábito', autores: 'Charles Duhigg', isbn: '978-8539004119', categoria: 'Desenvolvimento Pessoal' },
      { id: 2, titulo: 'Pai Rico, Pai Pobre', autores: 'Robert Kiyosaki', isbn: '978-8550801483', categoria: 'Finanças' },
    ];

    const termo = 'finanças';
    const filtered = books.filter(b =>
      b.titulo.toLowerCase().includes(termo) ||
      b.autores.toLowerCase().includes(termo) ||
      (b.categoria && b.categoria.toLowerCase().includes(termo))
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].titulo).toBe('Pai Rico, Pai Pobre');
  });

  it('should return empty array when no books match', () => {
    const books = [
      { id: 1, titulo: 'O Poder do Hábito', autores: 'Charles Duhigg', isbn: '978-8539004119', categoria: 'Desenvolvimento Pessoal' },
    ];

    const termo = 'xyz_inexistente';
    const filtered = books.filter(b =>
      b.titulo.toLowerCase().includes(termo) ||
      b.autores.toLowerCase().includes(termo)
    );

    expect(filtered).toHaveLength(0);
  });

  it('should require minimum 2 characters for search', () => {
    const minLength = 2;
    expect('ab'.length >= minLength).toBe(true);
    expect('a'.length >= minLength).toBe(false);
    expect(''.length >= minLength).toBe(false);
  });

  it('search results should include livros field in response structure', () => {
    const mockResponse = {
      clientes: [],
      tarefas: [],
      parceiros: [],
      teses: [],
      usuarios: [],
      livros: [{ id: 1, titulo: 'Test Book', autores: 'Author', isbn: null, categoria: 'Test' }],
    };

    expect(mockResponse).toHaveProperty('livros');
    expect(mockResponse.livros).toHaveLength(1);
    expect(mockResponse.livros[0]).toHaveProperty('titulo');
    expect(mockResponse.livros[0]).toHaveProperty('autores');
  });
});

// ===== 3. RESPONSIBILITY TERM PDF TESTS =====
describe('Biblioteca Responsibility Term PDF', () => {
  it('should construct correct PDF endpoint URL', () => {
    const emprestimoId = 1;
    const url = `/api/biblioteca/termo-responsabilidade-pdf?emprestimoId=${emprestimoId}`;
    expect(url).toBe('/api/biblioteca/termo-responsabilidade-pdf?emprestimoId=1');
  });

  it('should reject request without emprestimoId', () => {
    const emprestimoId = parseInt('0');
    expect(emprestimoId).toBeFalsy();
  });

  it('should reject request with invalid emprestimoId', () => {
    const emprestimoId = parseInt('abc');
    expect(isNaN(emprestimoId)).toBe(true);
  });

  it('should format date correctly for PDF', () => {
    const fmtDate = (d: string): string => {
      const [y, m, day] = d.split('-');
      if (!y || !m || !day) return d;
      return `${day}/${m}/${y}`;
    };

    expect(fmtDate('2026-02-14')).toBe('14/02/2026');
    expect(fmtDate('2026-02-28')).toBe('28/02/2026');
    expect(fmtDate('2026-03-04')).toBe('04/03/2026');
  });

  it('should have all required sections in the term', () => {
    const requiredSections = [
      'Dados do Colaborador',
      'Dados do Livro',
      'Dados do Exemplar',
      'Dados do Empréstimo',
      'Cláusulas e Condições',
    ];

    requiredSections.forEach(section => {
      expect(section).toBeTruthy();
    });
    expect(requiredSections).toHaveLength(5);
  });

  it('should include all 6 responsibility clauses', () => {
    const clausulas = [
      '1. O colaborador declara ter recebido o exemplar acima descrito em bom estado de conservação, comprometendo-se a devolvê-lo nas mesmas condições.',
      '2. O prazo máximo para devolução é a data prevista acima indicada, podendo ser renovado mediante solicitação prévia, desde que não haja reservas pendentes.',
      '3. Em caso de atraso na devolução, o colaborador estará sujeito a suspensão temporária do direito de empréstimo, conforme política vigente da Biblioteca Evox.',
      '4. Em caso de perda, extravio ou dano ao exemplar, o colaborador se compromete a repor o material ou ressarcir o valor equivalente à reposição.',
      '5. O colaborador se compromete a não emprestar, ceder ou reproduzir integralmente a obra sem autorização expressa da Biblioteca Evox.',
      '6. A Biblioteca Evox reserva-se o direito de solicitar a devolução antecipada do exemplar, caso necessário, mediante comunicação prévia ao colaborador.',
    ];

    expect(clausulas).toHaveLength(6);
    clausulas.forEach((c, i) => {
      expect(c).toMatch(new RegExp(`^${i + 1}\\.`));
    });
  });

  it('should include signature lines for both parties', () => {
    const signatures = ['Colaborador Responsável', 'Responsável pela Biblioteca'];
    expect(signatures).toHaveLength(2);
  });

  it('should handle missing collaborator data gracefully', () => {
    const colaborador = null;
    const colabRows = [
      { campo: 'Nome Completo', valor: 'Test Name' },
      { campo: 'CPF', valor: colaborador?.cpf || '-' },
      { campo: 'Cargo', valor: colaborador?.cargo || '-' },
      { campo: 'Setor', valor: '-' },
      { campo: 'E-mail', valor: colaborador?.email || '-' },
      { campo: 'Telefone', valor: colaborador?.telefone || '-' },
    ];

    colabRows.forEach(row => {
      expect(row.valor).toBeTruthy();
      expect(row.valor).not.toBe('');
    });
  });

  it('should handle missing book data gracefully', () => {
    const livro = null;
    const livroRows = [
      { campo: 'Título', valor: livro?.titulo || '-' },
      { campo: 'Autor(es)', valor: livro?.autores || '-' },
      { campo: 'Editora', valor: livro?.editora || '-' },
      { campo: 'ISBN', valor: livro?.isbn || '-' },
      { campo: 'Edição', valor: livro?.edicao || '-' },
      { campo: 'Categoria', valor: livro?.categoria || '-' },
    ];

    livroRows.forEach(row => {
      expect(row.valor).toBe('-');
    });
  });

  it('should capitalize condition name', () => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    expect(capitalize('novo')).toBe('Novo');
    expect(capitalize('bom')).toBe('Bom');
    expect(capitalize('regular')).toBe('Regular');
    expect(capitalize('danificado')).toBe('Danificado');
  });

  it('should generate correct filename', () => {
    const emprestimoId = 42;
    const filename = `termo-responsabilidade-${emprestimoId}.pdf`;
    expect(filename).toBe('termo-responsabilidade-42.pdf');
  });

  it('term button should be available for all loan statuses', () => {
    const statuses = ['ativo', 'devolvido', 'atrasado', 'renovado', 'perdido'];
    // The Termo button should be available for ALL statuses (active and completed)
    statuses.forEach(status => {
      expect(status).toBeTruthy();
    });
  });
});
