CREATE TABLE `senha_historico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senhaAutorizacaoId` int NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`acao` enum('criado','atualizado','revogado','reativado','transferido','senha_alterada') NOT NULL,
	`detalhes` text,
	`realizadoPorId` int,
	`realizadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `senha_historico_id` PRIMARY KEY(`id`)
);
