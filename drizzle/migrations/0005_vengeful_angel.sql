ALTER TABLE `audit_log` MODIFY COLUMN `acao` enum('criar','editar','excluir','visualizar','login','logout','atribuir','concluir','comentar','upload','download','exportar','ativar','inativar') NOT NULL;--> statement-breakpoint
ALTER TABLE `servicos` MODIFY COLUMN `formaCobrancaHonorarios` enum('percentual_credito','valor_fixo','mensalidade','exito','hibrido','entrada_exito','valor_fixo_parcelado') NOT NULL DEFAULT 'percentual_credito';--> statement-breakpoint
ALTER TABLE `servicos` ADD `percentualHonorariosCliente` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `servicos` ADD `valorEntrada` decimal(15,2);--> statement-breakpoint
ALTER TABLE `servicos` ADD `percentualExito` decimal(5,2);--> statement-breakpoint
ALTER TABLE `servicos` ADD `quantidadeParcelas` int;--> statement-breakpoint
ALTER TABLE `servicos` ADD `valorParcela` decimal(15,2);