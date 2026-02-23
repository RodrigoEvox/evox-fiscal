CREATE TABLE `emails_corporativos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`email` varchar(320) NOT NULL,
	`tipoEmail` enum('principal','alias','compartilhado','grupo') NOT NULL DEFAULT 'principal',
	`statusEmail` enum('ativo','desativado','suspenso') NOT NULL DEFAULT 'ativo',
	`dataCriacao` varchar(10),
	`dataDesativacao` varchar(10),
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emails_corporativos_id` PRIMARY KEY(`id`)
);
