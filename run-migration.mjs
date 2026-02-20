import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
dotenv.config({ path: resolve(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL + '&multipleStatements=true');
  
  const statements = [
    // 1. Update nivelAcesso enum: add supervisor, remove suporte_comercial
    `ALTER TABLE users MODIFY COLUMN nivelAcesso ENUM('diretor','gerente','coordenador','supervisor','analista_fiscal') NOT NULL DEFAULT 'analista_fiscal'`,
    
    // 2. Create user_history table
    `CREATE TABLE IF NOT EXISTS user_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      acao ENUM('criacao','edicao','ativacao','inativacao','exclusao') NOT NULL,
      campo VARCHAR(255),
      valorAnterior TEXT,
      valorNovo TEXT,
      realizadoPorId INT,
      realizadoPorNome VARCHAR(255),
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 3. Create chat_messages table
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      userName VARCHAR(255) NOT NULL,
      userAvatar VARCHAR(500),
      content TEXT NOT NULL,
      mentions JSON,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  
  for (const sql of statements) {
    try {
      await conn.execute(sql);
      console.log('OK:', sql.substring(0, 80) + '...');
    } catch (err) {
      console.error('Error:', err.message);
      // Continue on error (e.g. table already exists)
    }
  }
  
  // Update any existing suporte_comercial users to analista_fiscal
  try {
    await conn.execute(`UPDATE users SET nivelAcesso = 'analista_fiscal' WHERE nivelAcesso = 'suporte_comercial'`);
    console.log('OK: Updated suporte_comercial users to analista_fiscal');
  } catch (err) {
    // Ignore if column doesn't have that value
  }
  
  await conn.end();
  console.log('\nMigration complete!');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
