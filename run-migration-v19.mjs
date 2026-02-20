import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Add abonoConvertido column to ferias if not exists
try {
  await conn.execute(`ALTER TABLE ferias ADD COLUMN abonoConvertido BOOLEAN DEFAULT FALSE`);
  console.log('Added abonoConvertido to ferias');
} catch(e) { console.log('abonoConvertido already exists or error:', e.message); }

// Create ciclos_avaliacao table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS ciclos_avaliacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(500) NOT NULL,
    descricao TEXT,
    dataInicio VARCHAR(10) NOT NULL,
    dataFim VARCHAR(10) NOT NULL,
    status ENUM('rascunho','em_andamento','encerrado') NOT NULL DEFAULT 'rascunho',
    criterios JSON,
    criadoPorId INT,
    criadoPorNome VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )
`);
console.log('Created ciclos_avaliacao');

// Create avaliacoes table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cicloId INT NOT NULL,
    colaboradorId INT NOT NULL,
    colaboradorNome VARCHAR(500),
    avaliadorId INT NOT NULL,
    avaliadorNome VARCHAR(500),
    tipoAvaliador ENUM('gestor','par','autoavaliacao','subordinado') NOT NULL,
    notas JSON,
    notaGeral DECIMAL(4,2),
    comentarioGeral TEXT,
    pontosFortes TEXT,
    pontosDesenvolvimento TEXT,
    status ENUM('pendente','em_andamento','concluida') NOT NULL DEFAULT 'pendente',
    planoCarreiraId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )
`);
console.log('Created avaliacoes');

// Create colaborador_documentos table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS colaborador_documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    colaboradorId INT NOT NULL,
    tipo ENUM('foto','rg','ctps','aso','contrato','comprovante_residencia','outro') NOT NULL,
    nomeArquivo VARCHAR(500) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    fileKey VARCHAR(500) NOT NULL,
    mimeType VARCHAR(100),
    tamanho INT,
    enviadoPorId INT,
    enviadoPorNome VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )
`);
console.log('Created colaborador_documentos');

await conn.end();
console.log('Migration v19 complete!');
