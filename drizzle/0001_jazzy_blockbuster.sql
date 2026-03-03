CREATE TABLE `credit_guias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int,
	`caseId` int,
	`clienteId` int NOT NULL,
	`perdcompId` int,
	`cnpjGuia` varchar(20),
	`codigoReceita` varchar(20),
	`grupoTributo` varchar(200),
	`periodoApuracao` varchar(20),
	`dataVencimento` timestamp,
	`valorOriginal` decimal(15,2) DEFAULT '0',
	`valorMulta` decimal(15,2) DEFAULT '0',
	`valorJuros` decimal(15,2) DEFAULT '0',
	`valorTotal` decimal(15,2) DEFAULT '0',
	`valorCompensado` decimal(15,2) DEFAULT '0',
	`statusGuia` enum('a_vencer','vencida','perto_vencimento','compensada','parcial') DEFAULT 'a_vencer',
	`validacaoCliente` tinyint DEFAULT 0,
	`guiaUrl` varchar(1000),
	`comprovanteUrl` varchar(1000),
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_retificacao_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`caseId` int NOT NULL,
	`clienteId` int NOT NULL,
	`teseId` int,
	`teseNome` varchar(500),
	`tipoRetificacao` enum('total','parcial') NOT NULL DEFAULT 'total',
	`periodoInicio` varchar(10),
	`periodoFim` varchar(10),
	`valorApuradoRti` decimal(15,2) DEFAULT '0',
	`valorCreditoDisponivel` decimal(15,2) DEFAULT '0',
	`divergencia` decimal(15,2) DEFAULT '0',
	`divergenciaPct` decimal(5,2) DEFAULT '0',
	`alertaDivergencia` tinyint DEFAULT 0,
	`justificativaDivergencia` text,
	`saldoPorGrupo` json,
	`obrigacoesAcessorias` json,
	`checklistConcluido` tinyint DEFAULT 0,
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `valorRetificado` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `saldoDisponivel` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `saldoUtilizado` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `grupoDebito` varchar(50);--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `dataPrescricao` timestamp;--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `alertaPrescricao` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `tipoDocumento` varchar(50) DEFAULT 'Original';--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `numeroControle` varchar(50);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `cnpjDeclarante` varchar(20);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `nomeEmpresarial` varchar(500);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `oriundoAcaoJudicial` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `creditoSucedida` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `numeroDocArrecadacao` varchar(50);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `codigoReceita` varchar(20);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `grupoTributo` varchar(200);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `dataArrecadacao` timestamp;--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `debitosCompensadosJson` json;--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `representanteNome` varchar(255);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `representanteCpf` varchar(20);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `versaoSistema` varchar(20);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `codigoSerpro` varchar(50);--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `dataRecebimentoSerpro` timestamp;--> statement-breakpoint
ALTER TABLE `credit_perdcomps` ADD `modalidade` enum('compensacao','ressarcimento','restituicao') DEFAULT 'compensacao';--> statement-breakpoint
CREATE INDEX `idx_cg_task` ON `credit_guias` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_cg_case` ON `credit_guias` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_cg_cliente` ON `credit_guias` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cg_perdcomp` ON `credit_guias` (`perdcompId`);--> statement-breakpoint
CREATE INDEX `idx_crr_task` ON `credit_retificacao_records` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_crr_case` ON `credit_retificacao_records` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_crr_cliente` ON `credit_retificacao_records` (`clienteId`);