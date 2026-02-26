CREATE TABLE `contrato_documentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contratoId` int NOT NULL,
	`nome` varchar(500) NOT NULL,
	`tipo` enum('minuta','contrato_final','aditivo','distrato','procuracao','nda','comprovante','outro') NOT NULL DEFAULT 'outro',
	`versao` int NOT NULL DEFAULT 1,
	`url` varchar(1000) NOT NULL,
	`tamanho` int,
	`mimeType` varchar(100),
	`observacoes` text,
	`uploadPorId` int,
	`uploadPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `contrato_historico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contratoId` int NOT NULL,
	`acao` varchar(100) NOT NULL,
	`descricao` text,
	`dadosAntigos` json,
	`dadosNovos` json,
	`usuarioId` int,
	`usuarioNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `contratos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(30) NOT NULL,
	`clienteId` int NOT NULL,
	`clienteNome` varchar(500),
	`clienteCnpj` varchar(20),
	`parceiroId` int,
	`parceiroNome` varchar(500),
	`servicoId` int,
	`servicoNome` varchar(500),
	`tipo` enum('prestacao_servicos','honorarios','parceria','nda','aditivo','distrato','outro') NOT NULL DEFAULT 'prestacao_servicos',
	`fila` enum('elaboracao','revisao','assinatura','vigencia','renovacao','encerrado') NOT NULL DEFAULT 'elaboracao',
	`status` enum('a_fazer','fazendo','feito','concluido') NOT NULL DEFAULT 'a_fazer',
	`prioridade` enum('urgente','alta','media','baixa') NOT NULL DEFAULT 'media',
	`valorContrato` decimal(15,2) DEFAULT '0',
	`formaCobranca` enum('percentual_credito','valor_fixo','mensalidade','exito','hibrido','entrada_exito','valor_fixo_parcelado') DEFAULT 'valor_fixo',
	`percentualExito` decimal(5,2),
	`valorEntrada` decimal(15,2),
	`quantidadeParcelas` int,
	`valorParcela` decimal(15,2),
	`dataInicio` timestamp,
	`dataFim` timestamp,
	`dataAssinatura` timestamp,
	`dataVencimento` timestamp,
	`slaHoras` int,
	`slaStatus` enum('dentro_prazo','atencao','vencido') DEFAULT 'dentro_prazo',
	`responsavelId` int,
	`responsavelNome` varchar(255),
	`revisorId` int,
	`revisorNome` varchar(255),
	`contratoUrl` varchar(1000),
	`contratoAssinadoUrl` varchar(1000),
	`objetoContrato` text,
	`clausulasEspeciais` text,
	`observacoes` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_cd_contrato` ON `contrato_documentos` (`contratoId`);--> statement-breakpoint
CREATE INDEX `idx_cd_tipo` ON `contrato_documentos` (`tipo`);--> statement-breakpoint
CREATE INDEX `idx_ch_contrato` ON `contrato_historico` (`contratoId`);--> statement-breakpoint
CREATE INDEX `idx_ch_acao` ON `contrato_historico` (`acao`);--> statement-breakpoint
CREATE INDEX `idx_con_cliente` ON `contratos` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_con_parceiro` ON `contratos` (`parceiroId`);--> statement-breakpoint
CREATE INDEX `idx_con_fila` ON `contratos` (`fila`);--> statement-breakpoint
CREATE INDEX `idx_con_status` ON `contratos` (`status`);--> statement-breakpoint
CREATE INDEX `idx_con_numero` ON `contratos` (`numero`);--> statement-breakpoint
CREATE INDEX `idx_con_tipo` ON `contratos` (`tipo`);