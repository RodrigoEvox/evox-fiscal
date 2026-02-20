import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const queries = [
  // Rename setor
  `UPDATE setores SET nome = 'Gente & Gestão' WHERE nome = 'Gente e Gestão'`,
  `UPDATE setor_config SET nome = 'Gente & Gestão' WHERE nome = 'Gente e Gestão'`,

  // Colaboradores
  `CREATE TABLE IF NOT EXISTS colaboradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomeCompleto VARCHAR(500) NOT NULL,
    dataNascimento VARCHAR(10),
    cpf VARCHAR(14) NOT NULL,
    rgNumero VARCHAR(20),
    rgOrgaoEmissor VARCHAR(50),
    rgDataEmissao VARCHAR(10),
    ctpsNumero VARCHAR(50),
    pisPasep VARCHAR(20),
    nomeMae VARCHAR(500),
    nomePai VARCHAR(500),
    nacionalidade VARCHAR(100) DEFAULT 'Brasileira',
    naturalidade VARCHAR(255),
    estadoCivil ENUM('solteiro','casado','divorciado','viuvo','uniao_estavel'),
    tituloEleitor VARCHAR(20),
    certificadoReservista VARCHAR(20),
    sexo ENUM('masculino','feminino','outro'),
    cep VARCHAR(10),
    logradouro VARCHAR(500),
    numero VARCHAR(20),
    complemento VARCHAR(500),
    bairro VARCHAR(255),
    cidade VARCHAR(255),
    estado VARCHAR(2),
    telefone VARCHAR(20),
    email VARCHAR(320),
    dataAdmissao VARCHAR(10) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    funcao VARCHAR(255),
    salarioBase DECIMAL(12,2) NOT NULL,
    comissoes DECIMAL(12,2) DEFAULT 0,
    adicionais DECIMAL(12,2) DEFAULT 0,
    jornadaEntrada VARCHAR(5),
    jornadaSaida VARCHAR(5),
    jornadaIntervalo VARCHAR(20),
    cargaHoraria VARCHAR(10),
    tipoContrato ENUM('clt','pj','contrato_trabalho') NOT NULL DEFAULT 'clt',
    periodoExperiencia INT,
    localTrabalho ENUM('home_office','barueri','uberaba') DEFAULT 'barueri',
    valeTransporte BOOLEAN NOT NULL DEFAULT FALSE,
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(30),
    tipoConta ENUM('corrente','poupanca'),
    asoAdmissionalApto BOOLEAN DEFAULT TRUE,
    asoAdmissionalData VARCHAR(10),
    dependentes JSON,
    setorId INT,
    nivelHierarquico ENUM('estagiario','auxiliar','assistente','analista_jr','analista_pl','analista_sr','coordenador','supervisor','gerente','diretor'),
    userId INT,
    foto VARCHAR(500),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    dataDesligamento VARCHAR(10),
    motivoDesligamento TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Férias
  `CREATE TABLE IF NOT EXISTS ferias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    colaboradorId INT NOT NULL,
    periodoAquisitivoInicio VARCHAR(10) NOT NULL,
    periodoAquisitivoFim VARCHAR(10) NOT NULL,
    periodoConcessivoFim VARCHAR(10) NOT NULL,
    periodo1Inicio VARCHAR(10),
    periodo1Fim VARCHAR(10),
    periodo1Dias INT,
    periodo2Inicio VARCHAR(10),
    periodo2Fim VARCHAR(10),
    periodo2Dias INT,
    periodo3Inicio VARCHAR(10),
    periodo3Fim VARCHAR(10),
    periodo3Dias INT,
    diasTotais INT DEFAULT 30,
    faltasInjustificadas INT DEFAULT 0,
    diasDireito INT DEFAULT 30,
    status ENUM('pendente','programada','em_gozo','concluida','vencida') NOT NULL DEFAULT 'pendente',
    avisoPrevioData VARCHAR(10),
    alertas JSON,
    observacao TEXT,
    aprovadoPorId INT,
    aprovadoEm TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Solicitações de Folga/Férias
  `CREATE TABLE IF NOT EXISTS solicitacoes_folga (
    id INT AUTO_INCREMENT PRIMARY KEY,
    colaboradorId INT NOT NULL,
    tipo ENUM('ferias','folga','abono','compensacao') NOT NULL,
    dataInicio VARCHAR(10) NOT NULL,
    dataFim VARCHAR(10) NOT NULL,
    diasSolicitados INT NOT NULL,
    motivo TEXT,
    status ENUM('pendente','aprovada','recusada') NOT NULL DEFAULT 'pendente',
    aprovadorRhId INT,
    aprovadorRhStatus ENUM('pendente','aprovado','recusado') DEFAULT 'pendente',
    aprovadorRhEm TIMESTAMP NULL,
    aprovadorChefeId INT,
    aprovadorChefeStatus ENUM('pendente','aprovado','recusado') DEFAULT 'pendente',
    aprovadorChefeEm TIMESTAMP NULL,
    justificativaRecusa TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Tarefas do Setor
  `CREATE TABLE IF NOT EXISTS tarefas_setor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setorId INT NOT NULL,
    titulo VARCHAR(500) NOT NULL,
    descricao TEXT,
    responsavelId INT,
    responsavelNome VARCHAR(255),
    prioridade ENUM('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
    status ENUM('a_fazer','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'a_fazer',
    dataInicio VARCHAR(10),
    dataFim VARCHAR(10),
    dataConclusao VARCHAR(10),
    criadoPorId INT,
    criadoPorNome VARCHAR(255),
    observacao TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Ações e Benefícios
  `CREATE TABLE IF NOT EXISTS acoes_beneficios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(500) NOT NULL,
    tipo ENUM('fit','solidaria','campanha_doacao','sustentabilidade','engajamento','beneficio','outro') NOT NULL,
    descricao TEXT,
    dataInicio VARCHAR(10),
    dataFim VARCHAR(10),
    status ENUM('planejada','ativa','concluida','cancelada') NOT NULL DEFAULT 'planejada',
    participantes JSON,
    metaParticipacao INT,
    engajamentoScore INT,
    observacao TEXT,
    criadoPorId INT,
    criadoPorNome VARCHAR(255),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Atestados e Licenças
  `CREATE TABLE IF NOT EXISTS atestados_licencas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    colaboradorId INT NOT NULL,
    tipo ENUM('atestado_medico','licenca_maternidade','licenca_paternidade','licenca_casamento','licenca_obito','licenca_medica','outro') NOT NULL,
    dataInicio VARCHAR(10) NOT NULL,
    dataFim VARCHAR(10) NOT NULL,
    diasAfastamento INT NOT NULL,
    cid VARCHAR(10),
    medico VARCHAR(255),
    crm VARCHAR(20),
    observacao TEXT,
    documentoUrl VARCHAR(500),
    status ENUM('ativo','encerrado','cancelado') NOT NULL DEFAULT 'ativo',
    registradoPorId INT,
    registradoPorNome VARCHAR(255),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Planos de Carreira & Desenvolvimento
  `CREATE TABLE IF NOT EXISTS planos_carreira (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(500) NOT NULL,
    descricao TEXT,
    colaboradorId INT,
    setorId INT,
    nivelAtual VARCHAR(100),
    nivelAlvo VARCHAR(100),
    prazoMeses INT,
    status ENUM('em_andamento','concluido','pausado','cancelado') NOT NULL DEFAULT 'em_andamento',
    metas JSON,
    competencias JSON,
    treinamentos JSON,
    observacao TEXT,
    criadoPorId INT,
    criadoPorNome VARCHAR(255),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
];

for (const q of queries) {
  try {
    await conn.execute(q);
    console.log('OK:', q.slice(0, 60) + '...');
  } catch (err) {
    console.error('ERR:', q.slice(0, 60), err.message);
  }
}

// Update setor_config submenus for Gente & Gestão
const ggSubmenus = JSON.stringify([
  { key: "nova-tarefa", label: "Nova Tarefa", rota: "/setor/gg/nova-tarefa" },
  { key: "colaboradores", label: "Colaboradores", rota: "/setor/gg/colaboradores" },
  { key: "ferias", label: "Férias", rota: "/setor/gg/ferias" },
  { key: "acoes-beneficios", label: "Ações e Benefícios", rota: "/setor/gg/acoes-beneficios" },
  { key: "atestados-licencas", label: "Atestados e Licenças", rota: "/setor/gg/atestados-licencas" },
  { key: "cargos-salarios", label: "Cargos e Salários", rota: "/setor/gg/cargos-salarios" },
  { key: "carreira-desenvolvimento", label: "Carreira & Desenvolvimento", rota: "/setor/gg/carreira-desenvolvimento" },
]);

try {
  await conn.execute(
    `UPDATE setor_config SET submenus = ? WHERE sigla = 'GG'`,
    [ggSubmenus]
  );
  console.log('OK: Updated GG submenus');
} catch (err) {
  console.error('ERR updating GG submenus:', err.message);
}

await conn.end();
console.log('Migration v18 complete!');
