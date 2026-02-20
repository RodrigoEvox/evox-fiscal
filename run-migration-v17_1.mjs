import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // 1. Create chat_channels table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS chat_channels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT,
      tipo ENUM('geral','setor','projeto') NOT NULL DEFAULT 'setor',
      setorId INT,
      cor VARCHAR(7) DEFAULT '#3B82F6',
      icone VARCHAR(50) DEFAULT 'MessageCircle',
      criadoPorId INT,
      criadoPorNome VARCHAR(255),
      ativo BOOLEAN NOT NULL DEFAULT true,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ chat_channels table created');

  // 2. Add channelId to chat_messages (if not exists)
  const [cols] = await conn.execute(`SHOW COLUMNS FROM chat_messages LIKE 'channelId'`);
  if (cols.length === 0) {
    await conn.execute(`ALTER TABLE chat_messages ADD COLUMN channelId INT NOT NULL DEFAULT 1 AFTER id`);
    console.log('✅ channelId column added to chat_messages');
  } else {
    console.log('⏭️ channelId column already exists');
  }

  // 3. Create chat_notifications table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS chat_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      messageId INT NOT NULL,
      channelId INT NOT NULL,
      tipo ENUM('mencao','mensagem') NOT NULL DEFAULT 'mencao',
      remetenteNome VARCHAR(255) NOT NULL,
      preview VARCHAR(500),
      lida BOOLEAN NOT NULL DEFAULT false,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_lida (userId, lida),
      INDEX idx_channel (channelId)
    )
  `);
  console.log('✅ chat_notifications table created');

  // 4. Create default "Geral" channel
  const [existing] = await conn.execute(`SELECT id FROM chat_channels WHERE tipo = 'geral' LIMIT 1`);
  if (existing.length === 0) {
    await conn.execute(`INSERT INTO chat_channels (nome, descricao, tipo, cor, icone) VALUES ('Geral', 'Canal geral para toda a equipe', 'geral', '#3B82F6', 'MessageCircle')`);
    console.log('✅ Canal Geral criado');
  } else {
    console.log('⏭️ Canal Geral já existe');
  }

  // 5. Create sector channels for each setor
  const [setores] = await conn.execute(`SELECT id, nome FROM setores WHERE ativo = true`);
  for (const setor of setores) {
    const [existingChannel] = await conn.execute(`SELECT id FROM chat_channels WHERE setorId = ? LIMIT 1`, [setor.id]);
    if (existingChannel.length === 0) {
      await conn.execute(
        `INSERT INTO chat_channels (nome, descricao, tipo, setorId, cor, icone) VALUES (?, ?, 'setor', ?, '#3B82F6', 'Building2')`,
        [setor.nome, `Canal do setor ${setor.nome}`, setor.id]
      );
      console.log(`✅ Canal do setor ${setor.nome} criado`);
    }
  }

  // 6. Update existing messages to point to Geral channel
  const [geralChannel] = await conn.execute(`SELECT id FROM chat_channels WHERE tipo = 'geral' LIMIT 1`);
  if (geralChannel.length > 0) {
    const geralId = geralChannel[0].id;
    await conn.execute(`UPDATE chat_messages SET channelId = ? WHERE channelId = 1 OR channelId = 0`, [geralId]);
    console.log('✅ Mensagens existentes atualizadas para canal Geral');
  }

  console.log('\n🎉 Migration v17.1 completed successfully!');
} catch (err) {
  console.error('❌ Migration error:', err);
} finally {
  await conn.end();
}
