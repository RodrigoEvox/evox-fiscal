import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SELECT submenus FROM setor_config WHERE sigla='GEG'");
console.log(JSON.stringify(JSON.parse(rows[0].submenus), null, 2));
await conn.end();
