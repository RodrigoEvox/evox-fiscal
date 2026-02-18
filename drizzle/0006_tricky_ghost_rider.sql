ALTER TABLE `clientes` ADD `classificacaoCliente` enum('novo','base') DEFAULT 'novo' NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `dataConversaoBase` timestamp;--> statement-breakpoint
ALTER TABLE `clientes` ADD `quadroSocietario` json;--> statement-breakpoint
ALTER TABLE `clientes` ADD `complemento` varchar(500);--> statement-breakpoint
ALTER TABLE `clientes` ADD `ativo` boolean DEFAULT true NOT NULL;