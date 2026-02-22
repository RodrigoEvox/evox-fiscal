CREATE TABLE `academia_beneficio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`nomeAcademia` varchar(255) NOT NULL,
	`plano` varchar(255),
	`valorPlano` decimal(12,2) NOT NULL,
	`descontoFolha` boolean DEFAULT false,
	`valorDesconto` decimal(12,2),
	`dataEntrada` varchar(10),
	`fidelidade` boolean DEFAULT false,
	`fidelidadeMeses` int,
	`ativo` boolean NOT NULL DEFAULT true,
	`observacao` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academia_beneficio_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `acoes_beneficios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`tipo` enum('fit','solidaria','engajamento','doacao_sangue','sustentabilidade','outro') NOT NULL,
	`descricao` text,
	`dataInicio` varchar(10),
	`dataFim` varchar(10),
	`status` enum('planejada','ativa','concluida','cancelada') NOT NULL DEFAULT 'planejada',
	`participantes` json,
	`metaParticipacao` int,
	`engajamentoScore` int,
	`observacao` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`horario` varchar(20),
	`local` varchar(500),
	`arteConviteUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `acoes_beneficios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apontamentos_folha` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`mesReferencia` int NOT NULL,
	`anoReferencia` int NOT NULL,
	`tipo` enum('vale_transporte','academia','comissao','reajuste_sindical','reajuste_dois_anos','pensao_alimenticia','contribuicao_assistencial','banco_horas','outro') NOT NULL,
	`descricao` varchar(500),
	`valor` decimal(12,2) NOT NULL,
	`natureza` enum('provento','desconto') NOT NULL DEFAULT 'provento',
	`origemId` int,
	`origemTabela` varchar(100),
	`observacao` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apontamentos_folha_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aprovacao_comissao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parceiroId` int NOT NULL,
	`servicoId` int NOT NULL,
	`percentualSolicitado` decimal(5,2) NOT NULL,
	`percentualPadrao` decimal(5,2) NOT NULL,
	`modeloParceriaId` int NOT NULL,
	`solicitadoPorId` int NOT NULL,
	`solicitadoEm` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`aprovadoPorId` int,
	`aprovadoEm` timestamp,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aprovacao_comissao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atestados_licencas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`tipo` enum('atestado_medico','licenca_maternidade','licenca_paternidade','licenca_casamento','licenca_obito','licenca_medica','licenca_militar','licenca_vestibular','doacao_sangue','acompanhamento_medico','mesario','day_off','outro') NOT NULL,
	`dataInicio` varchar(10) NOT NULL,
	`dataFim` varchar(10) NOT NULL,
	`diasAfastamento` int NOT NULL,
	`cid` varchar(10),
	`medico` varchar(255),
	`crm` varchar(20),
	`observacao` text,
	`documentoUrl` varchar(500),
	`status` enum('ativo','encerrado','cancelado') NOT NULL DEFAULT 'ativo',
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atestados_licencas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avaliacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cicloId` int NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500),
	`avaliadorId` int NOT NULL,
	`avaliadorNome` varchar(500),
	`tipoAvaliador` enum('gestor','par','autoavaliacao','subordinado') NOT NULL,
	`notas` json,
	`notaGeral` decimal(4,2),
	`comentarioGeral` text,
	`pontosFortes` text,
	`pontosDesenvolvimento` text,
	`status` enum('pendente','em_andamento','concluida') NOT NULL DEFAULT 'pendente',
	`planoCarreiraId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avaliacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `banco_horas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`tipo` enum('extra','compensacao','ajuste_positivo','ajuste_negativo') NOT NULL DEFAULT 'extra',
	`data` varchar(10) NOT NULL,
	`horas` decimal(6,2) NOT NULL,
	`motivo` text,
	`aprovado` boolean NOT NULL DEFAULT false,
	`aprovadoPorId` int,
	`aprovadoPorNome` varchar(255),
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `banco_horas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beneficios_custom` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`icone` varchar(50) DEFAULT 'Gift',
	`cor` varchar(7) DEFAULT '#3B82F6',
	`rota` varchar(255),
	`ativo` boolean NOT NULL DEFAULT true,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `beneficios_custom_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`tipo` enum('geral','setor','projeto','dm') NOT NULL DEFAULT 'setor',
	`dmUser1Id` int,
	`dmUser2Id` int,
	`setorId` int,
	`cor` varchar(7) DEFAULT '#3B82F6',
	`icone` varchar(50) DEFAULT 'MessageCircle',
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userAvatar` varchar(500),
	`content` text NOT NULL,
	`mentions` json,
	`fileUrl` varchar(1000),
	`fileName` varchar(500),
	`fileType` varchar(100),
	`fileSize` int,
	`pinned` boolean NOT NULL DEFAULT false,
	`pinnedBy` int,
	`pinnedByName` varchar(255),
	`pinnedAt` timestamp,
	`deletedAt` timestamp,
	`deletedBy` int,
	`replyToId` int,
	`editedAt` timestamp,
	`editedContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messageId` int NOT NULL,
	`channelId` int NOT NULL,
	`tipo` enum('mencao','mensagem') NOT NULL DEFAULT 'mencao',
	`remetenteNome` varchar(255) NOT NULL,
	`preview` varchar(500),
	`lida` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`emoji` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_typing_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userAvatar` varchar(500),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_typing_indicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ciclos_avaliacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`dataInicio` varchar(10) NOT NULL,
	`dataFim` varchar(10) NOT NULL,
	`status` enum('rascunho','em_andamento','encerrado') NOT NULL DEFAULT 'rascunho',
	`criterios` json,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ciclos_avaliacao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `colaborador_documentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`tipo` enum('foto','rg','ctps','aso','contrato','comprovante_residencia','outro') NOT NULL,
	`nomeArquivo` varchar(500) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`tamanho` int,
	`enviadoPorId` int,
	`enviadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `colaborador_documentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `colaboradores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeCompleto` varchar(500) NOT NULL,
	`dataNascimento` varchar(10),
	`cpf` varchar(14) NOT NULL,
	`rgNumero` varchar(20),
	`rgOrgaoEmissor` varchar(50),
	`rgDataEmissao` varchar(10),
	`ctpsNumero` varchar(50),
	`ctpsUfEmissao` varchar(2),
	`pisPasep` varchar(20),
	`nomeMae` varchar(500),
	`nomePai` varchar(500),
	`nacionalidade` varchar(100) DEFAULT 'Brasileira',
	`naturalidade` varchar(255),
	`estadoCivil` enum('solteiro','casado','divorciado','viuvo','uniao_estavel'),
	`tituloEleitor` varchar(20),
	`tituloEleitorZona` varchar(10),
	`tituloEleitorSecao` varchar(10),
	`certificadoReservista` varchar(20),
	`sexo` enum('masculino','feminino','outro'),
	`grauInstrucao` enum('fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao','mestrado','doutorado'),
	`formacaoAcademica` text,
	`contatoEmergenciaNome` varchar(255),
	`contatoEmergenciaTelefone` varchar(20),
	`contatoEmergenciaParentesco` varchar(100),
	`pagaPensaoAlimenticia` boolean DEFAULT false,
	`valorPensaoAlimenticia` decimal(12,2),
	`temContribuicaoAssistencial` boolean DEFAULT false,
	`valorContribuicaoAssistencial` decimal(12,2),
	`cep` varchar(10),
	`logradouro` varchar(500),
	`numero` varchar(20),
	`complemento` varchar(500),
	`bairro` varchar(255),
	`cidade` varchar(255),
	`estado` varchar(2),
	`telefone` varchar(20),
	`email` varchar(320),
	`telefoneCorporativo` varchar(20),
	`emailCorporativo` varchar(320),
	`dataAdmissao` varchar(10) NOT NULL,
	`cargo` varchar(255) NOT NULL,
	`funcao` varchar(255),
	`salarioBase` decimal(12,2) NOT NULL,
	`comissoes` decimal(12,2) DEFAULT '0',
	`recebeComissao` boolean DEFAULT false,
	`adicionais` decimal(12,2) DEFAULT '0',
	`jornadaEntrada` varchar(5),
	`jornadaSaida` varchar(5),
	`jornadaIntervalo` varchar(20),
	`cargaHoraria` varchar(10),
	`tipoContrato` enum('clt','pj','contrato_trabalho') NOT NULL DEFAULT 'clt',
	`periodoExperiencia1Inicio` varchar(10),
	`periodoExperiencia1Fim` varchar(10),
	`periodoExperiencia2Inicio` varchar(10),
	`periodoExperiencia2Fim` varchar(10),
	`localTrabalho` enum('home_office','barueri','uberaba') DEFAULT 'barueri',
	`valeTransporte` boolean NOT NULL DEFAULT false,
	`banco` varchar(100),
	`agencia` varchar(20),
	`conta` varchar(30),
	`tipoConta` enum('corrente','poupanca'),
	`chavePix` varchar(255),
	`jornadaDias` json,
	`asoAdmissionalApto` boolean DEFAULT true,
	`asoAdmissionalData` varchar(10),
	`dependentes` json,
	`setorId` int,
	`nivelHierarquico` enum('estagiario','auxiliar','assistente','analista_jr','analista_pl','analista_sr','coordenador','supervisor','gerente','diretor'),
	`userId` int,
	`foto` varchar(500),
	`statusColaborador` enum('ativo','inativo','afastado','licenca','atestado','desligado','ferias','experiencia','aviso_previo') NOT NULL DEFAULT 'ativo',
	`ativo` boolean NOT NULL DEFAULT true,
	`dataDesligamento` varchar(10),
	`motivoDesligamento` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `colaboradores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comissao_rh` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`tipo` enum('evox_monitor','dpt','credito','outro') NOT NULL,
	`descricao` text,
	`mesReferencia` int NOT NULL,
	`anoReferencia` int NOT NULL,
	`valorBase` decimal(12,2) NOT NULL,
	`percentual` decimal(5,2),
	`valorComissao` decimal(12,2) NOT NULL,
	`observacao` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comissao_rh_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `day_off` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`dataAniversario` varchar(10) NOT NULL,
	`dataOriginal` varchar(10) NOT NULL,
	`dataEfetiva` varchar(10) NOT NULL,
	`alterado` boolean NOT NULL DEFAULT false,
	`motivoAlteracao` text,
	`status` enum('pendente','aprovado','recusado','utilizado') NOT NULL DEFAULT 'pendente',
	`aprovadorGestorId` int,
	`aprovadorGestorStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorGestorEm` timestamp,
	`aprovadorRhId` int,
	`aprovadorRhStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorRhEm` timestamp,
	`aprovadorDiretoriaId` int,
	`aprovadorDiretoriaStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorDiretoriaEm` timestamp,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `day_off_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doacao_sangue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`dataDoacao` varchar(10) NOT NULL,
	`prazoFolga` varchar(10) NOT NULL,
	`dataFolga` varchar(10),
	`comprovanteUrl` varchar(500),
	`status` enum('pendente','aprovado','recusado','utilizado') NOT NULL DEFAULT 'pendente',
	`aprovadorGestorId` int,
	`aprovadorGestorStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorGestorEm` timestamp,
	`aprovadorRhId` int,
	`aprovadorRhStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorRhEm` timestamp,
	`aprovadorDiretoriaId` int,
	`aprovadorDiretoriaStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorDiretoriaEm` timestamp,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doacao_sangue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipamentos_colaborador` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`tipo` enum('notebook','celular','desktop','monitor','headset','teclado','mouse','webcam','impressora','tablet','telefone_fixo','ramal','email_corporativo','telefone_corporativo','outro') NOT NULL,
	`marca` varchar(255),
	`modelo` varchar(255),
	`numeroSerie` varchar(255),
	`patrimonio` varchar(100),
	`descricao` text,
	`dataEntrega` varchar(10),
	`dataDevolucao` varchar(10),
	`statusEquipamento` enum('em_uso','devolvido','manutencao','perdido','descartado') NOT NULL DEFAULT 'em_uso',
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipamentos_colaborador_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executivos_comerciais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320),
	`telefone` varchar(20),
	`cargo` varchar(255),
	`userId` int,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `executivos_comerciais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ferias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`periodoAquisitivoInicio` varchar(10) NOT NULL,
	`periodoAquisitivoFim` varchar(10) NOT NULL,
	`periodoConcessivoFim` varchar(10) NOT NULL,
	`periodo1Inicio` varchar(10),
	`periodo1Fim` varchar(10),
	`periodo1Dias` int,
	`periodo2Inicio` varchar(10),
	`periodo2Fim` varchar(10),
	`periodo2Dias` int,
	`periodo3Inicio` varchar(10),
	`periodo3Fim` varchar(10),
	`periodo3Dias` int,
	`diasTotais` int DEFAULT 30,
	`faltasInjustificadas` int DEFAULT 0,
	`diasDireito` int DEFAULT 30,
	`status` enum('pendente','programada','em_gozo','concluida','vencida') NOT NULL DEFAULT 'pendente',
	`avisoPrevioData` varchar(10),
	`alertas` json,
	`observacao` text,
	`aprovadoPorId` int,
	`aprovadoEm` timestamp,
	`aprovadorGestorId` int,
	`aprovadorGestorStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorGestorEm` timestamp,
	`aprovadorDiretoriaId` int,
	`aprovadorDiretoriaStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorDiretoriaEm` timestamp,
	`justificativaRecusa` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ferias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historico_status_colaborador` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`statusAnterior` varchar(50) NOT NULL,
	`statusNovo` varchar(50) NOT NULL,
	`motivo` text,
	`origemModulo` varchar(50),
	`origemRegistroId` int,
	`alteradoPorId` int,
	`alteradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_status_colaborador_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metas_comissoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parceiroId` int NOT NULL,
	`tipo` enum('mensal','trimestral','semestral','anual') NOT NULL DEFAULT 'mensal',
	`ano` int NOT NULL,
	`mes` int,
	`trimestre` int,
	`valorMeta` decimal(12,2) NOT NULL,
	`observacao` text,
	`criadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metas_comissoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metas_individuais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500),
	`cicloId` int,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`categoria` enum('produtividade','qualidade','financeiro','desenvolvimento','cliente','processo','outro') NOT NULL DEFAULT 'outro',
	`unidadeMedida` varchar(50),
	`valorMeta` decimal(12,2) NOT NULL,
	`valorAtual` decimal(12,2) DEFAULT '0',
	`peso` int DEFAULT 1,
	`dataInicio` varchar(10),
	`dataFim` varchar(10),
	`status` enum('nao_iniciada','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'nao_iniciada',
	`observacao` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metas_individuais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `niveis_cargo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setorId` int NOT NULL,
	`cargo` varchar(255) NOT NULL,
	`nivel` int NOT NULL DEFAULT 1,
	`descricaoNivel` varchar(255),
	`salarioMinimo` decimal(12,2),
	`salarioMaximo` decimal(12,2),
	`grauInstrucaoMinimo` enum('fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao','mestrado','doutorado'),
	`requisitos` text,
	`competencias` text,
	`tempoMinimoMeses` int,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `niveis_cargo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_colaborador` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`templateId` int,
	`templateNome` varchar(255),
	`status` enum('pendente','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'pendente',
	`dataInicio` varchar(10),
	`dataConclusao` varchar(10),
	`observacao` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_colaborador_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_etapas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`onboardingId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`categoria` enum('documentos','treinamentos','acessos','equipamentos','integracao','outros') NOT NULL DEFAULT 'outros',
	`ordem` int NOT NULL DEFAULT 0,
	`obrigatoria` boolean NOT NULL DEFAULT true,
	`prazoEmDias` int DEFAULT 7,
	`status` enum('pendente','em_andamento','concluida','nao_aplicavel') NOT NULL DEFAULT 'pendente',
	`dataConclusao` varchar(10),
	`concluidoPorId` int,
	`concluidoPorNome` varchar(255),
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_etapas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_etapas_template` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`categoria` enum('documentos','treinamentos','acessos','equipamentos','integracao','outros') NOT NULL DEFAULT 'outros',
	`ordem` int NOT NULL DEFAULT 0,
	`obrigatoria` boolean NOT NULL DEFAULT true,
	`prazoEmDias` int DEFAULT 7,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onboarding_etapas_template_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`ativo` boolean NOT NULL DEFAULT true,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `perguntas_clima` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pesquisaId` int NOT NULL,
	`texto` text NOT NULL,
	`tipo` enum('escala','multipla_escolha','texto_livre','sim_nao') NOT NULL DEFAULT 'escala',
	`opcoes` json,
	`ordem` int NOT NULL DEFAULT 0,
	`obrigatoria` boolean NOT NULL DEFAULT true,
	`categoria` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `perguntas_clima_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pesquisas_clima` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`status` enum('rascunho','ativa','encerrada','cancelada') NOT NULL DEFAULT 'rascunho',
	`anonima` boolean NOT NULL DEFAULT true,
	`dataInicio` varchar(10),
	`dataFim` varchar(10),
	`totalRespostas` int DEFAULT 0,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pesquisas_clima_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planos_carreira` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`colaboradorId` int,
	`setorId` int,
	`nivelAtual` varchar(100),
	`nivelAlvo` varchar(100),
	`prazoMeses` int,
	`status` enum('em_andamento','concluido','pausado','cancelado') NOT NULL DEFAULT 'em_andamento',
	`metas` json,
	`competencias` json,
	`treinamentos` json,
	`observacao` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planos_carreira_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programas_carreira` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`icone` varchar(50) DEFAULT 'GraduationCap',
	`cor` varchar(7) DEFAULT '#8B5CF6',
	`rota` varchar(255),
	`ativo` boolean NOT NULL DEFAULT true,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programas_carreira_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rateio_comissao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parceiroId` int NOT NULL,
	`parceiroPaiId` int NOT NULL,
	`servicoId` int NOT NULL,
	`percentualParceiro` decimal(5,2) NOT NULL,
	`percentualSubparceiro` decimal(5,2) NOT NULL,
	`percentualMaximo` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rateio_comissao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reajustes_salariais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`tipo` enum('dois_anos','sindical','promocao','merito','outro') NOT NULL,
	`percentual` decimal(5,2) NOT NULL,
	`salarioAnterior` decimal(12,2) NOT NULL,
	`salarioNovo` decimal(12,2) NOT NULL,
	`dataEfetivacao` varchar(10) NOT NULL,
	`mesReferencia` int,
	`anoReferencia` int,
	`automatico` boolean NOT NULL DEFAULT false,
	`observacao` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reajustes_salariais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rescisoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`dataDesligamento` varchar(10) NOT NULL,
	`tipoDesligamento` enum('sem_justa_causa','justa_causa','pedido_demissao','termino_experiencia_1','termino_experiencia_2','acordo_mutuo') NOT NULL,
	`dataAdmissao` varchar(10) NOT NULL,
	`salarioBase` decimal(12,2) NOT NULL,
	`tipoContrato` varchar(50),
	`periodoExperiencia1Inicio` varchar(10),
	`periodoExperiencia1Fim` varchar(10),
	`periodoExperiencia2Inicio` varchar(10),
	`periodoExperiencia2Fim` varchar(10),
	`saldoSalario` decimal(12,2) DEFAULT '0',
	`avisoPrevio` decimal(12,2) DEFAULT '0',
	`avisoPrevioDias` int DEFAULT 0,
	`decimoTerceiroProporcional` decimal(12,2) DEFAULT '0',
	`decimoTerceiroMeses` int DEFAULT 0,
	`feriasProporcionais` decimal(12,2) DEFAULT '0',
	`feriasMeses` int DEFAULT 0,
	`tercoConstitucional` decimal(12,2) DEFAULT '0',
	`feriasVencidas` decimal(12,2) DEFAULT '0',
	`fgtsDepositado` decimal(12,2) DEFAULT '0',
	`multaFgts` decimal(12,2) DEFAULT '0',
	`multaFgtsPercentual` decimal(5,2) DEFAULT '0',
	`totalProventos` decimal(12,2) DEFAULT '0',
	`totalDescontos` decimal(12,2) DEFAULT '0',
	`totalLiquido` decimal(12,2) DEFAULT '0',
	`observacao` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rescisoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `respostas_clima` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pesquisaId` int NOT NULL,
	`perguntaId` int NOT NULL,
	`respondentId` int,
	`valorEscala` int,
	`valorTexto` text,
	`valorOpcao` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `respostas_clima_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `senhas_autorizacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`tipoSenhaAuth` enum('email','computador','celular','alarme_escritorio','sistema_interno','vpn','wifi','cofre','chave_empresa','chave_sala','chave_armario','veiculo_empresa','estacionamento','cartao_acesso','biometria','outro') NOT NULL,
	`descricao` varchar(500),
	`possuiSenha` boolean DEFAULT false,
	`senhaObs` text,
	`autorizado` boolean DEFAULT false,
	`dataAutorizacao` varchar(10),
	`dataRevogacao` varchar(10),
	`autorizadoPorId` int,
	`autorizadoPorNome` varchar(255),
	`identificador` varchar(255),
	`statusSenhaAuth` enum('ativo','revogado','expirado','pendente') NOT NULL DEFAULT 'ativo',
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `senhas_autorizacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solicitacoes_folga` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`tipo` enum('ferias','folga','abono','compensacao') NOT NULL,
	`dataInicio` varchar(10) NOT NULL,
	`dataFim` varchar(10) NOT NULL,
	`diasSolicitados` int NOT NULL,
	`motivo` text,
	`status` enum('pendente','aprovada','recusada') NOT NULL DEFAULT 'pendente',
	`aprovadorRhId` int,
	`aprovadorRhStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorRhEm` timestamp,
	`aprovadorChefeId` int,
	`aprovadorChefeStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorChefeEm` timestamp,
	`justificativaRecusa` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `solicitacoes_folga_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tarefas_setor` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setorId` int NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`responsavelId` int,
	`responsavelNome` varchar(255),
	`prioridade` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
	`status` enum('a_fazer','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'a_fazer',
	`dataInicio` varchar(10),
	`dataFim` varchar(10),
	`dataConclusao` varchar(10),
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tarefas_setor_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`acao` enum('criacao','edicao','ativacao','inativacao','exclusao') NOT NULL,
	`campo` varchar(255),
	`valorAnterior` text,
	`valorNovo` text,
	`realizadoPorId` int,
	`realizadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_presence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userAvatar` varchar(500),
	`lastSeen` timestamp NOT NULL DEFAULT (now()),
	`status` enum('online','away','offline') NOT NULL DEFAULT 'online',
	CONSTRAINT `user_presence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vale_transporte` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`mesReferencia` int NOT NULL,
	`anoReferencia` int NOT NULL,
	`diasUteis` int NOT NULL,
	`passagensPorDia` int NOT NULL DEFAULT 2,
	`valorPassagem` decimal(8,2) NOT NULL,
	`cidadePassagem` enum('sp','barueri') NOT NULL DEFAULT 'sp',
	`valorTotal` decimal(12,2) NOT NULL,
	`descontoFolha` decimal(12,2) DEFAULT '0',
	`observacao` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vale_transporte_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notificacoes` MODIFY COLUMN `tipo` enum('procuracao_vencendo','procuracao_vencida','analise_concluida','nova_tese','tarefa_atribuida','tarefa_sla_vencendo','tarefa_comentario','geral','avaliacao_ciclo_aberto','avaliacao_pendente') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `nivelAcesso` enum('diretor','gerente','coordenador','supervisor','analista_fiscal') NOT NULL DEFAULT 'analista_fiscal';--> statement-breakpoint
ALTER TABLE `parceiros` ADD `tipoPessoa` enum('pf','pj') DEFAULT 'pj' NOT NULL;--> statement-breakpoint
ALTER TABLE `parceiros` ADD `apelido` varchar(255);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `rg` varchar(20);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `cnpj` varchar(20);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `razaoSocial` varchar(500);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `nomeFantasia` varchar(500);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `situacaoCadastral` varchar(50);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `quadroSocietario` json;--> statement-breakpoint
ALTER TABLE `parceiros` ADD `socioNome` varchar(255);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `socioCpf` varchar(14);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `socioRg` varchar(20);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `socioEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `socioTelefone` varchar(20);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `cep` varchar(10);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `logradouro` varchar(500);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `numero` varchar(20);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `complemento` varchar(500);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `bairro` varchar(255);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `cidade` varchar(255);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `estado` varchar(2);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `banco` varchar(100);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `agencia` varchar(20);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `conta` varchar(30);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `tipoConta` enum('corrente','poupanca');--> statement-breakpoint
ALTER TABLE `parceiros` ADD `titularConta` varchar(255);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `cpfCnpjConta` varchar(20);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `chavePix` varchar(255);--> statement-breakpoint
ALTER TABLE `parceiros` ADD `tipoChavePix` enum('cpf','cnpj','email','telefone','aleatoria');--> statement-breakpoint
ALTER TABLE `parceiros` ADD `executivoComercialId` int;--> statement-breakpoint
ALTER TABLE `parceiros` ADD `ehSubparceiro` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `parceiros` ADD `observacoes` text;--> statement-breakpoint
ALTER TABLE `parceiros` DROP COLUMN `cpfCnpj`;--> statement-breakpoint
ALTER TABLE `parceiros` DROP COLUMN `endereco`;