-- Block A: Campos adicionais do colaborador
ALTER TABLE `colaboradores` ADD `ctpsUfEmissao` varchar(2);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `tituloEleitorZona` varchar(10);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `tituloEleitorSecao` varchar(10);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `grauInstrucao` enum('fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao','mestrado','doutorado');--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `formacaoAcademica` text;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `contatoEmergenciaNome` varchar(255);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `contatoEmergenciaTelefone` varchar(20);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `contatoEmergenciaParentesco` varchar(100);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `pagaPensaoAlimenticia` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `valorPensaoAlimenticia` decimal(12,2);--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `temContribuicaoAssistencial` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `colaboradores` ADD `valorContribuicaoAssistencial` decimal(12,2);--> statement-breakpoint

-- Block B: Férias - fluxo aprovação gestor + diretoria
ALTER TABLE `ferias` ADD `aprovadorGestorId` int;--> statement-breakpoint
ALTER TABLE `ferias` ADD `aprovadorGestorStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `ferias` ADD `aprovadorGestorEm` timestamp;--> statement-breakpoint
ALTER TABLE `ferias` ADD `aprovadorDiretoriaId` int;--> statement-breakpoint
ALTER TABLE `ferias` ADD `aprovadorDiretoriaStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `ferias` ADD `aprovadorDiretoriaEm` timestamp;--> statement-breakpoint
ALTER TABLE `ferias` ADD `justificativaRecusa` text;--> statement-breakpoint

-- Block C: Vale Transporte
CREATE TABLE `vale_transporte` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);--> statement-breakpoint

-- Block C: Academia
CREATE TABLE `academia_beneficio` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `ativo` boolean DEFAULT true NOT NULL,
  `observacao` text,
  `registradoPorId` int,
  `registradoPorNome` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);--> statement-breakpoint

-- Block C: Comissão RH (por tipo)
CREATE TABLE `comissao_rh` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);--> statement-breakpoint

-- Block D: Expandir tipos de licenças
ALTER TABLE `atestados_licencas` MODIFY COLUMN `tipo` enum('atestado_medico','licenca_maternidade','licenca_paternidade','licenca_casamento','licenca_obito','licenca_medica','licenca_militar','licenca_vestibular','doacao_sangue','acompanhamento_medico','mesario','day_off','outro') NOT NULL;--> statement-breakpoint

-- Block D: Day Off
CREATE TABLE `day_off` (
  `id` int NOT NULL AUTO_INCREMENT,
  `colaboradorId` int NOT NULL,
  `colaboradorNome` varchar(255) NOT NULL,
  `dataAniversario` varchar(10) NOT NULL,
  `dataOriginal` varchar(10) NOT NULL,
  `dataEfetiva` varchar(10) NOT NULL,
  `alterado` boolean DEFAULT false NOT NULL,
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);--> statement-breakpoint

-- Block D: Doação de Sangue
CREATE TABLE `doacao_sangue` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);--> statement-breakpoint

-- Block E: Reajustes Salariais
CREATE TABLE `reajustes_salariais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `colaboradorId` int NOT NULL,
  `colaboradorNome` varchar(255) NOT NULL,
  `tipo` enum('dois_anos','sindical','promocao','merito','outro') NOT NULL,
  `percentual` decimal(5,2) NOT NULL,
  `salarioAnterior` decimal(12,2) NOT NULL,
  `salarioNovo` decimal(12,2) NOT NULL,
  `dataEfetivacao` varchar(10) NOT NULL,
  `mesReferencia` int,
  `anoReferencia` int,
  `automatico` boolean DEFAULT false NOT NULL,
  `observacao` text,
  `registradoPorId` int,
  `registradoPorNome` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);--> statement-breakpoint

-- Block F: Relatório Apontamentos Folha
CREATE TABLE `apontamentos_folha` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);--> statement-breakpoint

-- Block G: Cargos e Salários - Níveis por setor
CREATE TABLE `niveis_cargo` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `ativo` boolean DEFAULT true NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);--> statement-breakpoint

-- Block H: Ações e Eventos - adicionar campos de horário e local
ALTER TABLE `acoes_beneficios` ADD `horario` varchar(20);--> statement-breakpoint
ALTER TABLE `acoes_beneficios` ADD `local` varchar(500);--> statement-breakpoint
ALTER TABLE `acoes_beneficios` ADD `arteConviteUrl` varchar(500);
