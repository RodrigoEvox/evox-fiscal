-- Migration: Expand parceiros table with full PF/PJ, banking, hierarchy fields
-- Already applied via ALTER TABLE statements
-- This file exists for drizzle migration tracking

ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `tipoPessoa` ENUM('pf','pj') NOT NULL DEFAULT 'pj';
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `apelido` VARCHAR(255);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `cpf` VARCHAR(14);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `rg` VARCHAR(20);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `cnpj` VARCHAR(20);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `razaoSocial` VARCHAR(500);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `nomeFantasia` VARCHAR(500);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `situacaoCadastral` VARCHAR(50);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `quadroSocietario` JSON;
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `socioNome` VARCHAR(255);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `socioCpf` VARCHAR(14);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `socioRg` VARCHAR(20);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `socioEmail` VARCHAR(320);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `socioTelefone` VARCHAR(20);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `cep` VARCHAR(10);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `logradouro` VARCHAR(500);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `numero` VARCHAR(20);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `complemento` VARCHAR(500);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `bairro` VARCHAR(255);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `cidade` VARCHAR(255);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `estado` VARCHAR(2);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `banco` VARCHAR(100);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `agencia` VARCHAR(20);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `conta` VARCHAR(30);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `tipoConta` ENUM('corrente','poupanca');
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `titularConta` VARCHAR(255);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `cpfCnpjConta` VARCHAR(20);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `chavePix` VARCHAR(255);
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `tipoChavePix` ENUM('cpf','cnpj','email','telefone','aleatoria');
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `ehSubparceiro` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `parceiros` ADD COLUMN IF NOT EXISTS `observacoes` TEXT;
