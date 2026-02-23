ALTER TABLE `ferias` ADD `criadoPorId` int;--> statement-breakpoint
ALTER TABLE `ferias` ADD `criadoPorNome` varchar(255);--> statement-breakpoint
ALTER TABLE `ferias` ADD `enviadoParaAprovacao` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `ferias` ADD `enviadoEm` timestamp;--> statement-breakpoint
ALTER TABLE `ferias` ADD `alertasCltCct` json;