import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// ===== LIVROS DE TESTE =====
const livros = [
  {
    titulo: 'O Poder do Hábito',
    subtitulo: 'Por que fazemos o que fazemos na vida e nos negócios',
    autores: 'Charles Duhigg',
    editora: 'Objetiva',
    edicao: '1ª',
    ano: 2012,
    isbn: '978-8539004119',
    idioma: 'Português',
    categoria: 'Desenvolvimento Pessoal',
    subcategoria: 'Produtividade',
    sinopse: 'Charles Duhigg, repórter investigativo do The New York Times, mostra que a chave para se exercitar regularmente, perder peso, ser mais produtivo e alcançar o sucesso é entender como os hábitos funcionam.',
    classificacao: 'essencial',
    areaSugerida: 'Todas',
    status: 'ativo',
  },
  {
    titulo: 'Pai Rico, Pai Pobre',
    subtitulo: 'O que os ricos ensinam a seus filhos sobre dinheiro',
    autores: 'Robert T. Kiyosaki',
    editora: 'Alta Books',
    edicao: '2ª',
    ano: 2018,
    isbn: '978-8550801483',
    idioma: 'Português',
    categoria: 'Finanças',
    subcategoria: 'Educação Financeira',
    sinopse: 'A obra ensina conceitos fundamentais sobre dinheiro, investimentos e independência financeira através da história de dois pais com visões opostas sobre riqueza.',
    classificacao: 'essencial',
    areaSugerida: 'Financeiro',
    status: 'ativo',
  },
  {
    titulo: 'A Arte da Guerra',
    subtitulo: null,
    autores: 'Sun Tzu',
    editora: 'Vozes',
    edicao: '3ª',
    ano: 2006,
    isbn: '978-8532636812',
    idioma: 'Português',
    categoria: 'Estratégia',
    subcategoria: 'Liderança',
    sinopse: 'Escrito há mais de 2.500 anos, este clássico da estratégia militar é aplicável a negócios, política e vida pessoal. Seus ensinamentos sobre planejamento e liderança permanecem relevantes.',
    classificacao: 'recomendado',
    areaSugerida: 'Comercial',
    status: 'ativo',
  },
  {
    titulo: 'Código Limpo',
    subtitulo: 'Habilidades Práticas do Agile Software',
    autores: 'Robert C. Martin',
    editora: 'Alta Books',
    edicao: '1ª',
    ano: 2009,
    isbn: '978-8576082675',
    idioma: 'Português',
    categoria: 'Tecnologia',
    subcategoria: 'Programação',
    sinopse: 'Mesmo um código ruim pode funcionar. Mas se ele não for limpo, pode acabar com uma empresa de desenvolvimento. Robert C. Martin apresenta um paradigma revolucionário para escrever código melhor.',
    classificacao: 'essencial',
    areaSugerida: 'IA e Tecnologia',
    status: 'ativo',
  },
  {
    titulo: 'O Monge e o Executivo',
    subtitulo: 'Uma história sobre a essência da liderança',
    autores: 'James C. Hunter',
    editora: 'Sextante',
    edicao: '1ª',
    ano: 2004,
    isbn: '978-8575421024',
    idioma: 'Português',
    categoria: 'Liderança',
    subcategoria: 'Gestão de Pessoas',
    sinopse: 'Leonard Hoffman, um famoso empresário, abandona sua carreira para se tornar monge em um mosteiro beneditino. Neste retiro, ele compartilha princípios fundamentais de liderança servidora.',
    classificacao: 'recomendado',
    areaSugerida: 'Gestão RH',
    status: 'ativo',
  },
  {
    titulo: 'Inteligência Emocional',
    subtitulo: 'A teoria revolucionária que redefine o que é ser inteligente',
    autores: 'Daniel Goleman',
    editora: 'Objetiva',
    edicao: '2ª',
    ano: 2011,
    isbn: '978-8573020809',
    idioma: 'Português',
    categoria: 'Desenvolvimento Pessoal',
    subcategoria: 'Psicologia',
    sinopse: 'Daniel Goleman mostra como a incapacidade de lidar com as próprias emoções pode minar a experiência escolar, acabar com carreiras promissoras e destruir vidas.',
    classificacao: 'essencial',
    areaSugerida: 'Todas',
    status: 'ativo',
  },
  {
    titulo: 'Tributação e Planejamento Fiscal',
    subtitulo: 'Guia Prático para Empresas',
    autores: 'Eduardo Sabbag',
    editora: 'Saraiva',
    edicao: '4ª',
    ano: 2020,
    isbn: '978-8553609451',
    idioma: 'Português',
    categoria: 'Direito Tributário',
    subcategoria: 'Planejamento Fiscal',
    sinopse: 'Obra completa sobre o sistema tributário brasileiro, abordando impostos, contribuições e estratégias de planejamento fiscal para empresas de todos os portes.',
    classificacao: 'essencial',
    areaSugerida: 'Teses Tributárias',
    status: 'ativo',
  },
  {
    titulo: 'Gestão de Projetos',
    subtitulo: 'As melhores práticas',
    autores: 'Harold Kerzner',
    editora: 'Bookman',
    edicao: '3ª',
    ano: 2017,
    isbn: '978-8582604151',
    idioma: 'Português',
    categoria: 'Gestão',
    subcategoria: 'Projetos',
    sinopse: 'Referência mundial em gestão de projetos, esta obra apresenta as melhores práticas utilizadas por organizações de classe mundial para gerenciar projetos com sucesso.',
    classificacao: 'avancado',
    areaSugerida: 'Todas',
    status: 'ativo',
  },
  {
    titulo: 'Marketing 5.0',
    subtitulo: 'Tecnologia para a humanidade',
    autores: 'Philip Kotler, Hermawan Kartajaya, Iwan Setiawan',
    editora: 'Sextante',
    edicao: '1ª',
    ano: 2021,
    isbn: '978-6555641028',
    idioma: 'Português',
    categoria: 'Marketing',
    subcategoria: 'Marketing Digital',
    sinopse: 'Philip Kotler e coautores exploram como a tecnologia pode ser aplicada para criar, comunicar, entregar e aumentar o valor ao longo da jornada do cliente.',
    classificacao: 'recomendado',
    areaSugerida: 'Marketing',
    status: 'ativo',
  },
  {
    titulo: 'Direito do Trabalho',
    subtitulo: 'Curso de Direito do Trabalho Aplicado',
    autores: 'Homero Batista Mateus da Silva',
    editora: 'RT',
    edicao: '5ª',
    ano: 2019,
    isbn: '978-8553213009',
    idioma: 'Português',
    categoria: 'Direito',
    subcategoria: 'Direito Trabalhista',
    sinopse: 'Obra completa sobre direito do trabalho brasileiro, abordando CLT, reforma trabalhista, jurisprudência atualizada e casos práticos para profissionais de RH e jurídico.',
    classificacao: 'avancado',
    areaSugerida: 'Jurídico',
    status: 'ativo',
  },
  {
    titulo: 'Scrum: A Arte de Fazer o Dobro do Trabalho na Metade do Tempo',
    subtitulo: null,
    autores: 'Jeff Sutherland',
    editora: 'Sextante',
    edicao: '1ª',
    ano: 2016,
    isbn: '978-8543107165',
    idioma: 'Português',
    categoria: 'Gestão',
    subcategoria: 'Metodologias Ágeis',
    sinopse: 'Jeff Sutherland, cocriador do Scrum, apresenta a metodologia que revolucionou a gestão de projetos, permitindo equipes entregarem resultados mais rápidos e com maior qualidade.',
    classificacao: 'recomendado',
    areaSugerida: 'IA e Tecnologia',
    status: 'ativo',
  },
  {
    titulo: 'Sapiens: Uma Breve História da Humanidade',
    subtitulo: null,
    autores: 'Yuval Noah Harari',
    editora: 'L&PM',
    edicao: '1ª',
    ano: 2015,
    isbn: '978-8525432186',
    idioma: 'Português',
    categoria: 'História',
    subcategoria: 'Cultura Geral',
    sinopse: 'Yuval Noah Harari percorre a história da humanidade desde os primeiros humanos a caminhar sobre a Terra até as revoluções radicais e por vezes devastadoras da era contemporânea.',
    classificacao: 'recomendado',
    areaSugerida: 'Todas',
    status: 'ativo',
  },
];

console.log('Inserindo livros...');
const livroIds = [];
for (const livro of livros) {
  const [result] = await conn.execute(
    `INSERT INTO bib_livros (titulo, subtitulo, autores, editora, edicao, ano, isbn, idioma, categoria, subcategoria, sinopse, classificacao, areaSugerida, status, registradoPorNome)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [livro.titulo, livro.subtitulo, livro.autores, livro.editora, livro.edicao, livro.ano, livro.isbn, livro.idioma, livro.categoria, livro.subcategoria, livro.sinopse, livro.classificacao, livro.areaSugerida, livro.status, 'Sistema (Seed)']
  );
  livroIds.push(result.insertId);
  console.log(`  ✓ ${livro.titulo} (ID: ${result.insertId})`);
}

// ===== EXEMPLARES =====
console.log('\nInserindo exemplares...');
const exemplarIds = [];
const localizacoes = ['Estante A - Prateleira 1', 'Estante A - Prateleira 2', 'Estante B - Prateleira 1', 'Estante B - Prateleira 3', 'Estante C - Prateleira 2', 'Armário Principal'];
const condicoes = ['novo', 'bom', 'bom', 'regular', 'novo', 'bom'];

for (let i = 0; i < livroIds.length; i++) {
  const numExemplares = i < 5 ? 2 : 1; // First 5 books get 2 copies, rest get 1
  for (let j = 0; j < numExemplares; j++) {
    const codigo = `BIB-${String(i + 1).padStart(3, '0')}-${String(j + 1).padStart(2, '0')}`;
    const [result] = await conn.execute(
      `INSERT INTO bib_exemplares (livroId, codigoPatrimonial, localizacao, condicao, dataEntrada, origem, status, registradoPorNome)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [livroIds[i], codigo, localizacoes[(i + j) % localizacoes.length], condicoes[(i + j) % condicoes.length], '2025-01-15', 'aquisicao', 'disponivel', 'Sistema (Seed)']
    );
    exemplarIds.push({ id: result.insertId, livroId: livroIds[i] });
    console.log(`  ✓ Exemplar ${codigo} do livro ID ${livroIds[i]}`);
  }
}

// ===== EMPRÉSTIMOS DE AMOSTRA =====
console.log('\nInserindo empréstimos de amostra...');
const colaboradores = [
  { id: 1, nome: 'Ana Paula Ferreira da Silva' },
  { id: 2, nome: 'Carlos Eduardo Mendes Ribeiro' },
  { id: 3, nome: 'Juliana Costa Oliveira' },
  { id: 4, nome: 'Rafael Santos Pereira' },
  { id: 5, nome: 'Beatriz Almeida Souza' },
];

const today = new Date();
const formatDate = (d) => d.toISOString().slice(0, 10);

// Empréstimo 1: ativo, vence em 3 dias (para testar notificação de vencimento)
const vence3dias = new Date(today);
vence3dias.setDate(vence3dias.getDate() + 3);
await conn.execute(
  `INSERT INTO bib_emprestimos (exemplarId, livroId, colaboradorId, colaboradorNome, dataRetirada, dataPrevistaDevolucao, status, termoAceito, registradoPorNome)
   VALUES (?, ?, ?, ?, ?, ?, 'ativo', 1, ?)`,
  [exemplarIds[0].id, exemplarIds[0].livroId, colaboradores[0].id, colaboradores[0].nome, formatDate(new Date(today.getTime() - 11 * 86400000)), formatDate(vence3dias), 'Sistema (Seed)']
);
await conn.execute(`UPDATE bib_exemplares SET status = 'emprestado' WHERE id = ?`, [exemplarIds[0].id]);
console.log(`  ✓ Empréstimo ativo (vence em 3 dias) - ${colaboradores[0].nome}`);

// Empréstimo 2: ativo, vence em 7 dias
const vence7dias = new Date(today);
vence7dias.setDate(vence7dias.getDate() + 7);
await conn.execute(
  `INSERT INTO bib_emprestimos (exemplarId, livroId, colaboradorId, colaboradorNome, dataRetirada, dataPrevistaDevolucao, status, termoAceito, registradoPorNome)
   VALUES (?, ?, ?, ?, ?, ?, 'ativo', 1, ?)`,
  [exemplarIds[2].id, exemplarIds[2].livroId, colaboradores[1].id, colaboradores[1].nome, formatDate(new Date(today.getTime() - 7 * 86400000)), formatDate(vence7dias), 'Sistema (Seed)']
);
await conn.execute(`UPDATE bib_exemplares SET status = 'emprestado' WHERE id = ?`, [exemplarIds[2].id]);
console.log(`  ✓ Empréstimo ativo (vence em 7 dias) - ${colaboradores[1].nome}`);

// Empréstimo 3: atrasado (venceu há 5 dias)
const venceuHa5dias = new Date(today);
venceuHa5dias.setDate(venceuHa5dias.getDate() - 5);
await conn.execute(
  `INSERT INTO bib_emprestimos (exemplarId, livroId, colaboradorId, colaboradorNome, dataRetirada, dataPrevistaDevolucao, status, termoAceito, registradoPorNome)
   VALUES (?, ?, ?, ?, ?, ?, 'atrasado', 1, ?)`,
  [exemplarIds[4].id, exemplarIds[4].livroId, colaboradores[2].id, colaboradores[2].nome, formatDate(new Date(today.getTime() - 19 * 86400000)), formatDate(venceuHa5dias), 'Sistema (Seed)']
);
await conn.execute(`UPDATE bib_exemplares SET status = 'emprestado' WHERE id = ?`, [exemplarIds[4].id]);
console.log(`  ✓ Empréstimo atrasado (venceu há 5 dias) - ${colaboradores[2].nome}`);

// Empréstimo 4: devolvido (histórico)
const devolvido = new Date(today);
devolvido.setDate(devolvido.getDate() - 10);
await conn.execute(
  `INSERT INTO bib_emprestimos (exemplarId, livroId, colaboradorId, colaboradorNome, dataRetirada, dataPrevistaDevolucao, dataEfetivaDevolucao, status, termoAceito, registradoPorNome)
   VALUES (?, ?, ?, ?, ?, ?, ?, 'devolvido', 1, ?)`,
  [exemplarIds[6].id, exemplarIds[6].livroId, colaboradores[3].id, colaboradores[3].nome, formatDate(new Date(today.getTime() - 30 * 86400000)), formatDate(new Date(today.getTime() - 16 * 86400000)), formatDate(devolvido), 'Sistema (Seed)']
);
console.log(`  ✓ Empréstimo devolvido (histórico) - ${colaboradores[3].nome}`);

// Empréstimo 5: ativo, vence amanhã (urgente)
const venceAmanha = new Date(today);
venceAmanha.setDate(venceAmanha.getDate() + 1);
await conn.execute(
  `INSERT INTO bib_emprestimos (exemplarId, livroId, colaboradorId, colaboradorNome, dataRetirada, dataPrevistaDevolucao, status, termoAceito, registradoPorNome)
   VALUES (?, ?, ?, ?, ?, ?, 'ativo', 1, ?)`,
  [exemplarIds[8].id, exemplarIds[8].livroId, colaboradores[4].id, colaboradores[4].nome, formatDate(new Date(today.getTime() - 13 * 86400000)), formatDate(venceAmanha), 'Sistema (Seed)']
);
await conn.execute(`UPDATE bib_exemplares SET status = 'emprestado' WHERE id = ?`, [exemplarIds[8].id]);
console.log(`  ✓ Empréstimo ativo (vence amanhã!) - ${colaboradores[4].nome}`);

// ===== RESERVA DE AMOSTRA =====
console.log('\nInserindo reserva de amostra...');
await conn.execute(
  `INSERT INTO bib_reservas (livroId, colaboradorId, colaboradorNome, dataReserva, posicaoFila, status)
   VALUES (?, ?, ?, ?, 1, 'ativa')`,
  [exemplarIds[0].livroId, colaboradores[3].id, colaboradores[3].nome, formatDate(today)]
);
console.log(`  ✓ Reserva ativa - ${colaboradores[3].nome} para livro ID ${exemplarIds[0].livroId}`);

// ===== FORNECEDOR DE AMOSTRA =====
console.log('\nInserindo fornecedor de amostra...');
await conn.execute(
  `INSERT INTO bib_fornecedores_doadores (nome, tipo, contato, email, telefone, observacoes)
   VALUES (?, ?, ?, ?, ?, ?)`,
  ['Livraria Saraiva', 'fornecedor', 'Departamento Corporativo', 'corporativo@saraiva.com.br', '(11) 3333-4444', 'Fornecedor principal de livros corporativos']
);
await conn.execute(
  `INSERT INTO bib_fornecedores_doadores (nome, tipo, contato, email, telefone, observacoes)
   VALUES (?, ?, ?, ?, ?, ?)`,
  ['Instituto Evox de Educação', 'doador', 'Coordenação', 'educacao@grupoevox.com.br', '(11) 5555-6666', 'Doações de livros do programa de educação corporativa']
);
console.log('  ✓ Livraria Saraiva (fornecedor)');
console.log('  ✓ Instituto Evox de Educação (doador)');

// ===== POLÍTICAS PADRÃO =====
console.log('\nInserindo políticas padrão...');
const politicas = [
  { chave: 'prazo_emprestimo_dias', valor: '14', descricao: 'Prazo padrão de empréstimo em dias' },
  { chave: 'limite_renovacoes', valor: '2', descricao: 'Número máximo de renovações permitidas' },
  { chave: 'limite_emprestimos_simultaneos', valor: '3', descricao: 'Máximo de livros emprestados por colaborador' },
  { chave: 'dias_bloqueio_atraso', valor: '30', descricao: 'Dias de bloqueio por atraso na devolução' },
  { chave: 'dias_aviso_vencimento', valor: '3', descricao: 'Dias antes do vencimento para enviar alerta' },
  { chave: 'prazo_reserva_dias', valor: '5', descricao: 'Dias para retirar livro após disponibilidade' },
];
for (const p of politicas) {
  await conn.execute(
    `INSERT INTO bib_politicas (chave, valor, descricao) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
    [p.chave, p.valor, p.descricao]
  );
  console.log(`  ✓ ${p.chave} = ${p.valor}`);
}

console.log('\n✅ Seed da Biblioteca Evox concluído com sucesso!');
console.log(`   ${livros.length} livros, ${exemplarIds.length} exemplares, 5 empréstimos, 1 reserva, 2 fornecedores, ${politicas.length} políticas`);

await conn.end();
