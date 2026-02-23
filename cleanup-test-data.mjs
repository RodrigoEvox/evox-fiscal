import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL + '&ssl={"rejectUnauthorized":true}');
  
  // Get the first 20 colaborador IDs to keep
  const [keepRows] = await conn.execute('SELECT id FROM colaboradores ORDER BY id ASC LIMIT 20');
  const keepIds = keepRows.map(r => r.id);
  console.log(`Keeping ${keepIds.length} colaboradores: ${keepIds.join(', ')}`);
  
  // Get total count
  const [countRows] = await conn.execute('SELECT COUNT(*) as total FROM colaboradores');
  const total = countRows[0].total;
  console.log(`Total colaboradores: ${total}, will delete ${total - keepIds.length}`);
  
  if (total <= 20) {
    console.log('Already 20 or fewer. Nothing to do.');
    await conn.end();
    return;
  }
  
  const keepList = keepIds.join(',');
  
  // Tables that reference colaborador_id or colaboradorId
  const relatedTables = [
    { table: 'apontamentos_folha', col: 'colaborador_id' },
    { table: 'atestados_licencas', col: 'colaborador_id' },
    { table: 'banco_horas', col: 'colaborador_id' },
    { table: 'beneficios_colaboradores', col: 'colaborador_id' },
    { table: 'comissoes_rh', col: 'colaborador_id' },
    { table: 'emails_corporativos', col: 'colaborador_id' },
    { table: 'equipamentos', col: 'colaborador_id' },
    { table: 'ferias', col: 'colaborador_id' },
    { table: 'folgas', col: 'colaborador_id' },
    { table: 'horas_extras', col: 'colaborador_id' },
    { table: 'metas_individuais', col: 'colaborador_id' },
    { table: 'movimentacoes', col: 'colaborador_id' },
    { table: 'ocorrencias', col: 'colaborador_id' },
    { table: 'rescisoes', col: 'colaborador_id' },
    { table: 'senhas_autorizacoes', col: 'colaborador_id' },
    { table: 'treinamentos_participantes', col: 'colaborador_id' },
    { table: 'vale_transporte', col: 'colaborador_id' },
    { table: 'avaliacoes', col: 'colaborador_id' },
    { table: 'ponto_registros', col: 'colaborador_id' },
    { table: 'advertencias', col: 'colaborador_id' },
    { table: 'documentos_colaborador', col: 'colaborador_id' },
    { table: 'historico_cargos', col: 'colaborador_id' },
    { table: 'senha_historico', col: 'colaborador_id' },
  ];
  
  // Delete from related tables first
  for (const { table, col } of relatedTables) {
    try {
      const [result] = await conn.execute(`DELETE FROM \`${table}\` WHERE \`${col}\` NOT IN (${keepList})`);
      console.log(`  ${table}: deleted ${result.affectedRows} rows`);
    } catch (err) {
      // Table might not exist or column name might differ
      console.log(`  ${table}: skipped (${err.message.substring(0, 60)})`);
    }
  }
  
  // Also check for nomeColaborador-based tables without ID reference
  // Delete the colaboradores themselves
  const [delResult] = await conn.execute(`DELETE FROM colaboradores WHERE id NOT IN (${keepList})`);
  console.log(`\nDeleted ${delResult.affectedRows} colaboradores. Remaining: 20`);
  
  await conn.end();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
