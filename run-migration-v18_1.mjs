import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const queries = [
  `ALTER TABLE colaboradores ADD COLUMN chavePix VARCHAR(255) NULL`,
  `ALTER TABLE colaboradores ADD COLUMN jornadaDias JSON NULL`,
];

for (const q of queries) {
  try {
    await conn.execute(q);
    console.log('OK:', q.substring(0, 60));
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('SKIP (exists):', q.substring(0, 60));
    } else {
      console.error('ERR:', e.message);
    }
  }
}

await conn.end();
console.log('Migration v18.1 done');
