import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL + '&ssl={"rejectUnauthorized":true}');
  
  // Get the 20 kept IDs
  const [keepRows] = await conn.execute('SELECT id FROM colaboradores ORDER BY id ASC');
  const keepIds = keepRows.map(r => r.id);
  console.log(`Current colaboradores: ${keepIds.length} (IDs: ${keepIds.join(', ')})`);
  
  const keepList = keepIds.join(',');
  
  // All tables with colaboradorId column
  const tables = [
    'academia_beneficio',
    'apontamentos_folha',
    'atestados_licencas',
    'avaliacoes',
    'banco_horas',
    'birthday_advance_notifications',
    'colaborador_documentos',
    'comissao_rh',
    'day_off',
    'doacao_sangue',
    'email_aniversariante_log',
    'emails_corporativos',
    'equipamentos_colaborador',
    'ferias',
    'historico_status_colaborador',
    'metas_individuais',
    'onboarding_colaborador',
    'planos_carreira',
    'reajustes_salariais',
    'rescisoes',
    'senha_historico',
    'senhas_autorizacoes',
    'solicitacoes_folga',
    'vale_transporte',
    'workflow_renovacao_contrato',
  ];
  
  for (const table of tables) {
    try {
      const [result] = await conn.execute(`DELETE FROM \`${table}\` WHERE \`colaboradorId\` NOT IN (${keepList})`);
      if (result.affectedRows > 0) {
        console.log(`  ${table}: deleted ${result.affectedRows} rows`);
      }
    } catch (err) {
      console.log(`  ${table}: skipped (${err.message.substring(0, 80)})`);
    }
  }
  
  // Verify counts
  console.log('\n--- Remaining counts ---');
  const [colabCount] = await conn.execute('SELECT COUNT(*) as c FROM colaboradores');
  console.log(`colaboradores: ${colabCount[0].c}`);
  
  for (const table of tables) {
    try {
      const [rows] = await conn.execute(`SELECT COUNT(*) as c FROM \`${table}\``);
      if (rows[0].c > 0) console.log(`${table}: ${rows[0].c}`);
    } catch (err) {}
  }
  
  await conn.end();
  console.log('\nDone!');
}

main().catch(err => { console.error(err); process.exit(1); });
