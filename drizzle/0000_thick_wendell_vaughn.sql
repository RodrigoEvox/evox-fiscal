CREATE TABLE `birthday_advance_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`ano` int NOT NULL,
	`diasAntes` int NOT NULL,
	`enviadoEm` timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `convencao_coletiva` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`sindicato` varchar(500),
	`vigenciaInicio` varchar(10) NOT NULL,
	`vigenciaFim` varchar(10) NOT NULL,
	`dataBase` varchar(10),
	`cctStatus` enum('vigente','vencida','pendente') NOT NULL DEFAULT 'vigente',
	`arquivoPdfUrl` text,
	`arquivoPdfNome` varchar(500),
	`anexosJson` text,
	`resumoLlm` text,
	`clausulasJson` text,
	`regrasFeriasJson` text,
	`regrasJornadaJson` text,
	`regrasSalarioJson` text,
	`regrasBeneficiosJson` text,
	`regrasRescisaoJson` text,
	`observacoes` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `convencao_coletiva_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_aniversariante_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assunto` varchar(500) NOT NULL DEFAULT 'Feliz Aniversário!',
	`mensagem` text NOT NULL,
	`assinatura` varchar(500) NOT NULL DEFAULT 'Equipe Evox',
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `email_aniversariante_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`ano` int NOT NULL,
	`enviadoEm` timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `rescisao_auditoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`cargo` varchar(255),
	`salarioBase` decimal(12,2) NOT NULL,
	`dataDesligamento` varchar(10) NOT NULL,
	`tipoDesligamento` enum('sem_justa_causa','justa_causa','pedido_demissao','termino_experiencia_1','termino_experiencia_2','acordo_mutuo') NOT NULL,
	`resultadoJson` text NOT NULL,
	`acao` enum('simulado','descartado','salvo') NOT NULL,
	`simuladoPorId` int,
	`simuladoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `termos_responsabilidade` (
	`id` int AUTO_INCREMENT NOT NULL,
	`equipamentoId` int NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`tipoTermo` enum('entrega','devolucao') NOT NULL,
	`dataEvento` varchar(10) NOT NULL,
	`equipamentoDescricao` text,
	`equipamentoTipo` varchar(100),
	`equipamentoMarca` varchar(255),
	`equipamentoModelo` varchar(255),
	`equipamentoPatrimonio` varchar(100),
	`equipamentoNumeroSerie` varchar(255),
	`condicoesEquipamento` enum('novo','bom','regular','ruim','defeituoso') DEFAULT 'bom',
	`observacoes` text,
	`assinaturaColaboradorUrl` text,
	`assinaturaResponsavelUrl` text,
	`termoAceito` tinyint DEFAULT 0,
	`motivoDevolucao` enum('desligamento','troca','manutencao','ferias','licenca','outro'),
	`motivoOutro` varchar(500),
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `workflow_renovacao_contrato` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`cargo` varchar(255) NOT NULL,
	`dataVencimento` varchar(10) NOT NULL,
	`diasRestantes` int NOT NULL,
	`tarefaId` int,
	`criadoPorId` int NOT NULL,
	`status` enum('pendente','resolvido','cancelado') NOT NULL DEFAULT 'pendente',
	`decisao` enum('renovar','desligar','converter_clt'),
	`observacao` text,
	`resolvidoEm` timestamp,
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `api_keys` DROP INDEX `api_keys_chave_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `academia_beneficio` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `acoes_beneficios` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `api_keys` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `apontamentos_folha` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `aprovacao_comissao` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `arquivos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `atestados_licencas` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `audit_log` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `avaliacoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `banco_horas` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `beneficios_custom` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chat_channels` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chat_messages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chat_notifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chat_reactions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chat_typing_indicators` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ciclos_avaliacao` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `cliente_servicos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `clientes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `colaborador_documentos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `colaboradores` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `comissao_rh` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `comissoes_servico` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `day_off` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `doacao_sangue` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emails_corporativos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `equipamentos_colaborador` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `executivos_comerciais` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ferias` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `fila_apuracao` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `historico_status_colaborador` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `metas_comissoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `metas_individuais` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `modelos_parceria` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `niveis_cargo` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `notificacoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `onboarding_colaborador` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `onboarding_etapas` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `onboarding_etapas_template` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `onboarding_templates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `parceiro_servicos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `parceiros` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `perguntas_clima` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pesquisas_clima` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `planos_carreira` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `programas_carreira` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `rateio_comissao` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `reajustes_salariais` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `relatorios` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `rescisoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `respostas_clima` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `senha_historico` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `senhas_autorizacoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `servico_etapas` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `servicos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `setor_config` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `setores` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `sla_configuracoes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `solicitacoes_folga` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tarefa_comentarios` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tarefas` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tarefas_setor` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `teses` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `user_history` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `user_presence` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `usuario_setores` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `vale_transporte` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `academia_beneficio` MODIFY COLUMN `descontoFolha` tinyint;--> statement-breakpoint
ALTER TABLE `academia_beneficio` MODIFY COLUMN `descontoFolha` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `academia_beneficio` MODIFY COLUMN `fidelidade` tinyint;--> statement-breakpoint
ALTER TABLE `academia_beneficio` MODIFY COLUMN `fidelidade` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `academia_beneficio` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `academia_beneficio` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `acoes_beneficios` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `api_keys` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `api_keys` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `apontamentos_folha` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `aprovacao_comissao` MODIFY COLUMN `solicitadoEm` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `aprovacao_comissao` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `arquivos` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `atestados_licencas` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `avaliacoes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `banco_horas` MODIFY COLUMN `aprovado` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `banco_horas` MODIFY COLUMN `aprovado` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `banco_horas` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `beneficios_custom` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `beneficios_custom` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `chat_channels` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `chat_channels` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `chat_messages` MODIFY COLUMN `channelId` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `chat_messages` MODIFY COLUMN `pinned` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_messages` MODIFY COLUMN `pinned` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `chat_messages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `chat_notifications` MODIFY COLUMN `lida` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_notifications` MODIFY COLUMN `lida` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `chat_notifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `chat_reactions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `chat_typing_indicators` MODIFY COLUMN `startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ciclos_avaliacao` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `cliente_servicos` MODIFY COLUMN `status` enum('ativo','em_execucao','concluido','cancelado') DEFAULT 'ativo';--> statement-breakpoint
ALTER TABLE `cliente_servicos` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `industrializa` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `industrializa` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `comercializa` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `comercializa` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `prestaServicos` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `prestaServicos` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `regimeMonofasico` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `regimeMonofasico` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `processosJudiciaisAtivos` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `processosJudiciaisAtivos` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `parcelamentosAtivos` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `parcelamentosAtivos` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `procuracaoHabilitada` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `procuracaoHabilitada` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `clientes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `colaborador_documentos` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `pagaPensaoAlimenticia` tinyint;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `pagaPensaoAlimenticia` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `temContribuicaoAssistencial` tinyint;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `temContribuicaoAssistencial` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `recebeComissao` tinyint;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `recebeComissao` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `valeTransporte` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `valeTransporte` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `asoAdmissionalApto` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `colaboradores` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `comissao_rh` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `comissoes_servico` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `comissoes_servico` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `day_off` MODIFY COLUMN `alterado` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `day_off` MODIFY COLUMN `alterado` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `day_off` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `doacao_sangue` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `emails_corporativos` MODIFY COLUMN `tipoEmail` enum('principal','secundario') NOT NULL DEFAULT 'principal';--> statement-breakpoint
ALTER TABLE `emails_corporativos` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `equipamentos_colaborador` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `executivos_comerciais` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `executivos_comerciais` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ferias` MODIFY COLUMN `enviadoParaAprovacao` tinyint;--> statement-breakpoint
ALTER TABLE `ferias` MODIFY COLUMN `enviadoParaAprovacao` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `ferias` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `fila_apuracao` MODIFY COLUMN `prioridadeManual` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `fila_apuracao` MODIFY COLUMN `prioridadeManual` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fila_apuracao` MODIFY COLUMN `tempoGastoMs` bigint;--> statement-breakpoint
ALTER TABLE `fila_apuracao` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `historico_status_colaborador` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `metas_comissoes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `metas_individuais` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `modelos_parceria` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `modelos_parceria` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `niveis_cargo` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `niveis_cargo` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `notificacoes` MODIFY COLUMN `lida` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `notificacoes` MODIFY COLUMN `lida` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `notificacoes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `onboarding_colaborador` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `onboarding_etapas` MODIFY COLUMN `obrigatoria` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `onboarding_etapas` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `onboarding_etapas_template` MODIFY COLUMN `obrigatoria` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `onboarding_etapas_template` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `onboarding_templates` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `onboarding_templates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `parceiro_servicos` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `parceiro_servicos` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `parceiros` MODIFY COLUMN `ehSubparceiro` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `parceiros` MODIFY COLUMN `ehSubparceiro` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `parceiros` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `parceiros` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `perguntas_clima` MODIFY COLUMN `obrigatoria` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `perguntas_clima` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pesquisas_clima` MODIFY COLUMN `anonima` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `pesquisas_clima` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `planos_carreira` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `programas_carreira` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `programas_carreira` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `rateio_comissao` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `reajustes_salariais` MODIFY COLUMN `automatico` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `reajustes_salariais` MODIFY COLUMN `automatico` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `reajustes_salariais` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `relatorios` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `rescisoes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `respostas_clima` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `senha_historico` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `senhas_autorizacoes` MODIFY COLUMN `possuiSenha` tinyint;--> statement-breakpoint
ALTER TABLE `senhas_autorizacoes` MODIFY COLUMN `possuiSenha` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `senhas_autorizacoes` MODIFY COLUMN `autorizado` tinyint;--> statement-breakpoint
ALTER TABLE `senhas_autorizacoes` MODIFY COLUMN `autorizado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `senhas_autorizacoes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `servico_etapas` MODIFY COLUMN `obrigatoria` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `servico_etapas` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `servico_etapas` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `servicos` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `servicos` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `setor_config` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `setores` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `setores` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `sla_configuracoes` MODIFY COLUMN `prioridade` enum('urgente','alta','media','baixa') DEFAULT 'media';--> statement-breakpoint
ALTER TABLE `sla_configuracoes` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `sla_configuracoes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `solicitacoes_folga` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tarefa_comentarios` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tarefas` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tarefas_setor` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `necessidadeAcaoJudicial` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `necessidadeAcaoJudicial` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `viaAdministrativa` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `viaAdministrativa` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelComercio` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelComercio` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelIndustria` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelIndustria` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelServico` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelServico` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelLucroReal` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelLucroReal` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelLucroPresumido` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelLucroPresumido` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelSimplesNacional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `aplicavelSimplesNacional` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `ativa` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `teses` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_history` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_presence` MODIFY COLUMN `lastSeen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `ativo` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `usuario_setores` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `vale_transporte` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `clientes` ADD `contribuinteIcms` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `contribuinteIpi` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `formacoesSuperior` text;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `formacoesTecnicas` text;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `habilidadesExtras` text;--> statement-breakpoint
ALTER TABLE `emails_corporativos` ADD `tipoUso` enum('individual','compartilhado') DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE `emails_corporativos` ADD `colaboradoresVinculados` json;--> statement-breakpoint
ALTER TABLE `ferias` ADD `abonoConvertido` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `niveis_cargo` ADD `funcao` varchar(255);--> statement-breakpoint
ALTER TABLE `niveis_cargo` ADD `salarioBase` decimal(12,2);--> statement-breakpoint
ALTER TABLE `niveis_cargo` ADD `requisitosFormacao` text;--> statement-breakpoint
ALTER TABLE `niveis_cargo` ADD `comissionado` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `niveis_cargo` ADD `cargoConfianca` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `parceiros` ADD `cpfCnpj` varchar(20);--> statement-breakpoint
ALTER TABLE `senhas_autorizacoes` ADD `tipoUsoSenha` enum('individual','comum','compartilhado') DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE `senhas_autorizacoes` ADD `colaboradoresVinculadosSenha` json;--> statement-breakpoint
ALTER TABLE `teses` ADD `aplicavelContribuinteIcms` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `teses` ADD `aplicavelContribuinteIpi` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `unique_notif` ON `birthday_advance_notifications` (`colaboradorId`,`ano`,`diasAntes`);--> statement-breakpoint
CREATE INDEX `unique_colab_ano` ON `email_aniversariante_log` (`colaboradorId`,`ano`);--> statement-breakpoint
CREATE INDEX `chave` ON `api_keys` (`chave`);--> statement-breakpoint
CREATE INDEX `idx_dm_users` ON `chat_channels` (`dmUser1Id`,`dmUser2Id`);--> statement-breakpoint
CREATE INDEX `idx_user_lida` ON `chat_notifications` (`userId`,`lida`);--> statement-breakpoint
CREATE INDEX `idx_channel` ON `chat_notifications` (`channelId`);--> statement-breakpoint
CREATE INDEX `idx_reactions_message` ON `chat_reactions` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_reactions_user` ON `chat_reactions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_typing_channel` ON `chat_typing_indicators` (`channelId`);--> statement-breakpoint
CREATE INDEX `idx_typing_user` ON `chat_typing_indicators` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_metas_parceiro` ON `metas_comissoes` (`parceiroId`);--> statement-breakpoint
CREATE INDEX `idx_metas_periodo` ON `metas_comissoes` (`ano`,`mes`,`trimestre`);--> statement-breakpoint
CREATE INDEX `unique_user` ON `user_presence` (`userId`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
ALTER TABLE `clientes` DROP COLUMN `contribuinteICMS`;--> statement-breakpoint
ALTER TABLE `clientes` DROP COLUMN `contribuinteIPI`;--> statement-breakpoint
ALTER TABLE `teses` DROP COLUMN `aplicavelContribuinteICMS`;--> statement-breakpoint
ALTER TABLE `teses` DROP COLUMN `aplicavelContribuinteIPI`;