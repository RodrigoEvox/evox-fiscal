import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [cols] = await conn.query('SHOW COLUMNS FROM niveis_cargo');
const colNames = cols.map(c => c.Field);
console.log('Current columns:', colNames.join(', '));

if (colNames.indexOf('funcao') === -1) {
  await conn.query('ALTER TABLE niveis_cargo ADD COLUMN funcao VARCHAR(255) DEFAULT NULL AFTER cargo');
  console.log('Added funcao');
}

if (colNames.indexOf('salarioBase') === -1) {
  await conn.query('ALTER TABLE niveis_cargo ADD COLUMN salarioBase DECIMAL(12,2) DEFAULT NULL AFTER salarioMaximo');
  console.log('Added salarioBase');
}

// Re-check after adding salarioBase
const [cols2] = await conn.query('SHOW COLUMNS FROM niveis_cargo');
const colNames2 = cols2.map(c => c.Field);

if (colNames2.indexOf('requisitosFormacao') === -1) {
  await conn.query('ALTER TABLE niveis_cargo ADD COLUMN requisitosFormacao TEXT DEFAULT NULL AFTER salarioBase');
  console.log('Added requisitosFormacao');
}

// Re-check
const [cols3] = await conn.query('SHOW COLUMNS FROM niveis_cargo');
const colNames3 = cols3.map(c => c.Field);

if (colNames3.indexOf('comissionado') === -1) {
  await conn.query('ALTER TABLE niveis_cargo ADD COLUMN comissionado TINYINT DEFAULT 0 NOT NULL AFTER requisitosFormacao');
  console.log('Added comissionado');
}

// Re-check
const [cols4] = await conn.query('SHOW COLUMNS FROM niveis_cargo');
const colNames4 = cols4.map(c => c.Field);

if (colNames4.indexOf('cargoConfianca') === -1) {
  await conn.query('ALTER TABLE niveis_cargo ADD COLUMN cargoConfianca TINYINT DEFAULT 0 NOT NULL AFTER comissionado');
  console.log('Added cargoConfianca');
}

// Final verify
const [finalCols] = await conn.query('SHOW COLUMNS FROM niveis_cargo');
console.log('\nFinal columns:');
finalCols.forEach(r => console.log(`  ${r.Field} | ${r.Type}`));

await conn.end();
console.log('\nDone!');
