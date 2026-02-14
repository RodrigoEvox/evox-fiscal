CREATE TABLE `servicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(500) NOT NULL,
	`descricao` text,
	`setorId` int NOT NULL,
	`percentualHonorariosComercial` decimal(5,2) DEFAULT '0',
	`formaCobrancaHonorarios` enum('percentual_credito','valor_fixo','mensalidade','exito','hibrido') NOT NULL DEFAULT 'percentual_credito',
	`valorFixo` decimal(15,2),
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `servicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `setor_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setorId` int NOT NULL,
	`sigla` varchar(10) NOT NULL,
	`submenus` json,
	`workflowStatuses` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `setor_config_id` PRIMARY KEY(`id`)
);
