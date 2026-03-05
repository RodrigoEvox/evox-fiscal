CREATE TABLE `aprovacoes_financeiras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pagamentoId` int NOT NULL,
	`usuarioAprovadorId` int NOT NULL,
	`nivel` int NOT NULL,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`dataAprovacao` timestamp,
	`motivo` text,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `auditoria_financeira` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`operacao` varchar(255) NOT NULL,
	`tabela` varchar(100) NOT NULL,
	`registroId` int NOT NULL,
	`ip` varchar(45),
	`dispositivo` varchar(255),
	`navegador` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `autenticacao_dupla` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`pagamentoId` int NOT NULL,
	`tipo` enum('sms','email','autenticador') NOT NULL,
	`codigo` varchar(10) NOT NULL,
	`tentativas` int NOT NULL DEFAULT 0,
	`dataExpiracao` timestamp NOT NULL,
	`confirmado` tinyint NOT NULL DEFAULT 0,
	`dataConfirmacao` timestamp,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `categorias_financeiras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`tipo` enum('receita','despesa') NOT NULL,
	`descricao` text,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `centros_custo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `contas_pagar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fornecedorId` int NOT NULL,
	`descricao` varchar(500) NOT NULL,
	`valor` decimal(15,2) NOT NULL,
	`dataVencimento` timestamp NOT NULL,
	`dataPagamento` timestamp,
	`status` enum('pendente','aprovado','pago','cancelado','atrasado') NOT NULL DEFAULT 'pendente',
	`competencia` varchar(7) NOT NULL,
	`categoriaId` int,
	`centroCustoId` int,
	`observacoes` text,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `contas_receber` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`descricao` varchar(500) NOT NULL,
	`valor` decimal(15,2) NOT NULL,
	`dataVencimento` timestamp NOT NULL,
	`dataRecebimento` timestamp,
	`status` enum('emitido','vencido','recebido','cancelado','atrasado') NOT NULL DEFAULT 'emitido',
	`competencia` varchar(7) NOT NULL,
	`categoriaId` int,
	`centroCustoId` int,
	`observacoes` text,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `contas_bancarias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`banco` varchar(100) NOT NULL,
	`agencia` varchar(20) NOT NULL,
	`conta` varchar(30) NOT NULL,
	`saldo` decimal(15,2) NOT NULL DEFAULT '0',
	`saldoAnterior` decimal(15,2) NOT NULL DEFAULT '0',
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `fornecedores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cnpjCpf` varchar(20) NOT NULL,
	`email` varchar(255),
	`telefone` varchar(20),
	`endereco` text,
	`banco` varchar(100),
	`agencia` varchar(20),
	`conta` varchar(30),
	`ativo` tinyint NOT NULL DEFAULT 1,
	`validado` tinyint NOT NULL DEFAULT 0,
	`validadoPorId` int,
	`dataValidacao` timestamp,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fornecedores_cnpjCpf_unique` UNIQUE(`cnpjCpf`)
);
--> statement-breakpoint
CREATE TABLE `historico_financeiro` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tabela` varchar(100) NOT NULL,
	`registroId` int NOT NULL,
	`operacao` enum('insert','update','delete') NOT NULL,
	`dadosAntigos` json,
	`dadosNovos` json,
	`usuarioId` int NOT NULL,
	`ip` varchar(45),
	`dispositivo` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `limites_usuario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`limiteAprovacao` decimal(15,2) NOT NULL,
	`limiteTransferencia` decimal(15,2) NOT NULL,
	`limiteCartao` decimal(15,2) NOT NULL,
	`requerAutenticacaoDupla` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `reconciliacao_bancaria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contaBancariaId` int NOT NULL,
	`dataExtrato` timestamp NOT NULL,
	`saldoExtrato` decimal(15,2) NOT NULL,
	`saldoSistema` decimal(15,2) NOT NULL,
	`discrepancia` decimal(15,2) NOT NULL,
	`resolvido` tinyint NOT NULL DEFAULT 0,
	`dataResolucao` timestamp,
	`observacoes` text,
	`criadoPorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_af_pagamento` ON `aprovacoes_financeiras` (`pagamentoId`);--> statement-breakpoint
CREATE INDEX `idx_af_aprovador` ON `aprovacoes_financeiras` (`usuarioAprovadorId`);--> statement-breakpoint
CREATE INDEX `idx_af_status` ON `aprovacoes_financeiras` (`status`);--> statement-breakpoint
CREATE INDEX `idx_af_usuario` ON `auditoria_financeira` (`usuarioId`);--> statement-breakpoint
CREATE INDEX `idx_af_operacao` ON `auditoria_financeira` (`operacao`);--> statement-breakpoint
CREATE INDEX `idx_af_tabela` ON `auditoria_financeira` (`tabela`);--> statement-breakpoint
CREATE INDEX `idx_af_data` ON `auditoria_financeira` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_ad_usuario` ON `autenticacao_dupla` (`usuarioId`);--> statement-breakpoint
CREATE INDEX `idx_ad_pagamento` ON `autenticacao_dupla` (`pagamentoId`);--> statement-breakpoint
CREATE INDEX `idx_ad_confirmado` ON `autenticacao_dupla` (`confirmado`);--> statement-breakpoint
CREATE INDEX `idx_catfin_tipo` ON `categorias_financeiras` (`tipo`);--> statement-breakpoint
CREATE INDEX `idx_catfin_ativo` ON `categorias_financeiras` (`ativo`);--> statement-breakpoint
CREATE INDEX `idx_cc_ativo` ON `centros_custo` (`ativo`);--> statement-breakpoint
CREATE INDEX `idx_cap_fornecedor` ON `contas_pagar` (`fornecedorId`);--> statement-breakpoint
CREATE INDEX `idx_cap_status` ON `contas_pagar` (`status`);--> statement-breakpoint
CREATE INDEX `idx_cap_vencimento` ON `contas_pagar` (`dataVencimento`);--> statement-breakpoint
CREATE INDEX `idx_cap_competencia` ON `contas_pagar` (`competencia`);--> statement-breakpoint
CREATE INDEX `idx_car_cliente` ON `contas_receber` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_car_status` ON `contas_receber` (`status`);--> statement-breakpoint
CREATE INDEX `idx_car_vencimento` ON `contas_receber` (`dataVencimento`);--> statement-breakpoint
CREATE INDEX `idx_car_competencia` ON `contas_receber` (`competencia`);--> statement-breakpoint
CREATE INDEX `idx_cb_ativo` ON `contas_bancarias` (`ativo`);--> statement-breakpoint
CREATE INDEX `idx_forn_cnpj` ON `fornecedores` (`cnpjCpf`);--> statement-breakpoint
CREATE INDEX `idx_forn_ativo` ON `fornecedores` (`ativo`);--> statement-breakpoint
CREATE INDEX `idx_forn_validado` ON `fornecedores` (`validado`);--> statement-breakpoint
CREATE INDEX `idx_hf_tabela` ON `historico_financeiro` (`tabela`);--> statement-breakpoint
CREATE INDEX `idx_hf_registro` ON `historico_financeiro` (`registroId`);--> statement-breakpoint
CREATE INDEX `idx_hf_usuario` ON `historico_financeiro` (`usuarioId`);--> statement-breakpoint
CREATE INDEX `idx_hf_operacao` ON `historico_financeiro` (`operacao`);--> statement-breakpoint
CREATE INDEX `idx_lu_usuario` ON `limites_usuario` (`usuarioId`);--> statement-breakpoint
CREATE INDEX `idx_rb_conta` ON `reconciliacao_bancaria` (`contaBancariaId`);--> statement-breakpoint
CREATE INDEX `idx_rb_resolvido` ON `reconciliacao_bancaria` (`resolvido`);--> statement-breakpoint
CREATE INDEX `idx_rb_data` ON `reconciliacao_bancaria` (`dataExtrato`);