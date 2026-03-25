import mysql from 'mysql2/promise';
import tls from 'tls';

// Parse DATABASE_URL: mysql://user:pass@host:port/database
const dbUrl = process.env.DATABASE_URL || '';
const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):([^/]+)\/(.+)/);

if (!urlMatch) {
  console.error('❌ DATABASE_URL inválida:', dbUrl);
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

const connection = await mysql.createConnection({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: {},
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
});

// 8 novas rotas de RH a adicionar
const novasRotas = [
  {
    "grupo": "Hub",
    "key": "biblioteca-hub",
    "label": "Biblioteca Hub",
    "rota": "/rh/biblioteca-hub"
  },
  {
    "grupo": "Hub",
    "key": "convencao-coletiva",
    "label": "Convenção Coletiva",
    "rota": "/rh/convencao-coletiva"
  },
  {
    "grupo": "Hub",
    "key": "geg-hub",
    "label": "GEG Hub",
    "rota": "/rh/geg-hub"
  },
  {
    "grupo": "Recursos",
    "key": "importacao-colaboradores",
    "label": "Importação Colaboradores",
    "rota": "/rh/importacao-colaboradores"
  },
  {
    "grupo": "Gestão",
    "key": "ocorrencias-reversao",
    "label": "Ocorrências e Reversão",
    "rota": "/rh/ocorrencias-reversao"
  },
  {
    "grupo": "Análise",
    "key": "relatorio-ativos",
    "label": "Relatório Ativos",
    "rota": "/rh/relatorio-ativos"
  },
  {
    "grupo": "Gestão",
    "key": "senhas-autorizacoes",
    "label": "Senhas & Autorizações",
    "rota": "/rh/senhas-autorizacoes"
  },
  {
    "grupo": "Recursos",
    "key": "simulador-ferias",
    "label": "Simulador Férias",
    "rota": "/rh/simulador-ferias"
  }
];

try {
  console.log('🔗 Conectando ao banco de dados...');
  
  // Buscar configuração atual do setor GEG (id=9)
  const [rows] = await connection.execute(
    'SELECT id, submenus FROM setor_config WHERE setorId = ?',
    [9]
  );

  if (rows.length === 0) {
    console.error('❌ Setor GEG não encontrado em setor_config');
    process.exit(1);
  }

  const config = rows[0];
  let submenus = JSON.parse(config.submenus);

  console.log(`📋 Menu atual tem ${submenus.length} itens`);

  // Adicionar novas rotas, evitando duplicatas
  let adicionadas = 0;
  for (const novaRota of novasRotas) {
    const existe = submenus.some(item => item.key === novaRota.key);
    if (!existe) {
      submenus.push(novaRota);
      adicionadas++;
      console.log(`✅ Adicionada: ${novaRota.label}`);
    } else {
      console.log(`⏭️  Já existe: ${novaRota.label}`);
    }
  }

  console.log(`\n📊 Total: ${adicionadas} novas rotas adicionadas`);
  console.log(`📊 Menu agora tem ${submenus.length} itens`);

  // Atualizar banco de dados
  if (adicionadas > 0) {
    await connection.execute(
      'UPDATE setor_config SET submenus = ? WHERE setorId = ?',
      [JSON.stringify(submenus), 9]
    );
    console.log('\n✅ Banco de dados atualizado com sucesso!');
  } else {
    console.log('\n⏭️  Nenhuma rota nova para adicionar (todas já existem)');
  }

  await connection.end();
  process.exit(0);

} catch (error) {
  console.error('❌ Erro:', error.message);
  await connection.end();
  process.exit(1);
}
