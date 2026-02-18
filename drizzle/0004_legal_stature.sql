CREATE TABLE `cliente_servicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`servicoId` int NOT NULL,
	`status` enum('ativo','em_execucao','concluido','cancelado') NOT NULL DEFAULT 'ativo',
	`atribuidoPorId` int,
	`dataInicio` timestamp,
	`dataConclusao` timestamp,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cliente_servicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comissoes_servico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servicoId` int NOT NULL,
	`modeloParceriaId` int NOT NULL,
	`percentualComissao` decimal(5,2) NOT NULL,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comissoes_servico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modelos_parceria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modelos_parceria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parceiro_servicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parceiroId` int NOT NULL,
	`servicoId` int NOT NULL,
	`percentualCustomizado` decimal(5,2),
	`aprovadoPorId` int,
	`aprovadoEm` timestamp,
	`statusAprovacao` enum('aprovado','pendente','rejeitado') DEFAULT 'aprovado',
	`observacao` text,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parceiro_servicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `servico_etapas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servicoId` int NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`setorResponsavelId` int,
	`ordem` int NOT NULL DEFAULT 0,
	`slaHoras` int,
	`obrigatoria` boolean NOT NULL DEFAULT true,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `servico_etapas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sla_configuracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`setorId` int,
	`slaHoras` int NOT NULL,
	`prioridade` enum('urgente','alta','media','baixa') NOT NULL DEFAULT 'media',
	`ativo` boolean NOT NULL DEFAULT true,
	`criadoPorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sla_configuracoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `servicos` MODIFY COLUMN `setorId` int;--> statement-breakpoint
ALTER TABLE `clientes` ADD `tipoPessoa` enum('juridica','fisica') DEFAULT 'juridica' NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `clientes` ADD `cidade` varchar(255);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `modeloParceriaId` int;--> statement-breakpoint
ALTER TABLE `parceiros` ADD `parceiroPaiId` int;--> statement-breakpoint
ALTER TABLE `parceiros` ADD `percentualRepasseSubparceiro` decimal(5,2);--> statement-breakpoint
ALTER TABLE `servicos` ADD `setoresIds` json;--> statement-breakpoint
ALTER TABLE `servicos` ADD `responsaveisIds` json;--> statement-breakpoint
ALTER TABLE `servicos` ADD `comissaoPadraoDiamante` decimal(5,2);--> statement-breakpoint
ALTER TABLE `servicos` ADD `comissaoPadraoOuro` decimal(5,2);--> statement-breakpoint
ALTER TABLE `servicos` ADD `comissaoPadraoPrata` decimal(5,2);