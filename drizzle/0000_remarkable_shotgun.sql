CREATE TABLE `academia_beneficio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`nomeAcademia` varchar(255) NOT NULL,
	`plano` varchar(255),
	`valorPlano` decimal(12,2) NOT NULL,
	`descontoFolha` tinyint DEFAULT 0,
	`valorDesconto` decimal(12,2),
	`dataEntrada` varchar(10),
	`fidelidade` tinyint DEFAULT 0,
	`fidelidadeMeses` int,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`observacao` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`horario` varchar(20),
	`local` varchar(500),
	`arteConviteUrl` varchar(500)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`chave` varchar(64) NOT NULL,
	`descricao` text,
	`permissoes` json,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`ultimoUso` timestamp,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`solicitadoEm` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`aprovadoPorId` int,
	`aprovadoEm` timestamp,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `arquivos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(500) NOT NULL,
	`nomeOriginal` varchar(500) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`tamanhoBytes` bigint NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` varchar(1000) NOT NULL,
	`entidadeTipo` enum('cliente','tarefa','tese','parceiro','relatorio','geral') NOT NULL,
	`entidadeId` int,
	`versao` int NOT NULL DEFAULT 1,
	`arquivoPaiId` int,
	`descricao` text,
	`tags` json,
	`uploadPorId` int,
	`uploadPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`acao` enum('criar','editar','excluir','visualizar','login','logout','atribuir','concluir','comentar','upload','download','exportar','ativar','inativar') NOT NULL,
	`entidadeTipo` varchar(50) NOT NULL,
	`entidadeId` int,
	`entidadeNome` varchar(500),
	`detalhes` json,
	`usuarioId` int,
	`usuarioNome` varchar(255),
	`ip` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`aprovado` tinyint NOT NULL DEFAULT 0,
	`aprovadoPorId` int,
	`aprovadoPorNome` varchar(255),
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `beneficios_custom` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`icone` varchar(50) DEFAULT 'Gift',
	`cor` varchar(7) DEFAULT '#3B82F6',
	`rota` varchar(255),
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_auditoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`acao` enum('criar','editar','excluir','emprestar','devolver','renovar','reservar','baixar','bloquear','desbloquear','ajuste_manual') NOT NULL,
	`entidadeTipo` varchar(50) NOT NULL,
	`entidadeId` int,
	`entidadeNome` varchar(500),
	`detalhes` json,
	`motivo` text,
	`usuarioId` int,
	`usuarioNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_bloqueios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`motivo` text NOT NULL,
	`ocorrenciaId` int,
	`dataInicio` varchar(10) NOT NULL,
	`dataFim` varchar(10),
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_emprestimos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exemplarId` int NOT NULL,
	`livroId` int NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`dataRetirada` varchar(10) NOT NULL,
	`dataPrevistaDevolucao` varchar(10) NOT NULL,
	`dataEfetivaDevolucao` varchar(10),
	`status` enum('ativo','devolvido','atrasado','cancelado','em_disputa') NOT NULL DEFAULT 'ativo',
	`renovacoes` int NOT NULL DEFAULT 0,
	`limiteRenovacoes` int NOT NULL DEFAULT 2,
	`termoAceito` tinyint NOT NULL DEFAULT 0,
	`checklistRetirada` json,
	`checklistDevolucao` json,
	`multaValor` decimal(10,2),
	`penalidade` varchar(255),
	`observacoes` text,
	`assinaturaColaboradorUrl` text,
	`assinaturaBibliotecarioUrl` text,
	`termoPdfUrl` text,
	`termoEnviadoEmail` tinyint NOT NULL DEFAULT 0,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_exemplares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`livroId` int NOT NULL,
	`codigoPatrimonial` varchar(50) NOT NULL,
	`localizacao` varchar(255),
	`condicao` enum('novo','bom','regular','danificado') NOT NULL DEFAULT 'novo',
	`dataEntrada` varchar(10),
	`origem` enum('aquisicao','doacao') NOT NULL DEFAULT 'aquisicao',
	`fornecedorId` int,
	`dataCompra` varchar(10),
	`valorCompra` decimal(10,2),
	`doadorTipo` enum('colaborador','parceiro','cliente','pessoa_fisica'),
	`doadorNome` varchar(255),
	`dataDoacao` varchar(10),
	`status` enum('disponivel','emprestado','reservado','indisponivel','perdido','baixado') NOT NULL DEFAULT 'disponivel',
	`motivoBaixa` text,
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_fornecedores_doadores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`tipo` enum('fornecedor','doador','ambos') NOT NULL DEFAULT 'fornecedor',
	`contato` varchar(255),
	`email` varchar(320),
	`telefone` varchar(20),
	`observacoes` text,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_livros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`subtitulo` varchar(500),
	`autores` varchar(1000) NOT NULL,
	`editora` varchar(255),
	`edicao` varchar(50),
	`ano` int,
	`isbn` varchar(20),
	`idioma` varchar(50) DEFAULT 'Português',
	`categoria` varchar(100),
	`subcategoria` varchar(100),
	`tags` json,
	`sinopse` text,
	`capaUrl` varchar(1000),
	`capaFileKey` varchar(500),
	`linkReferencia` varchar(1000),
	`classificacao` enum('essencial','recomendado','avancado') DEFAULT 'recomendado',
	`areaSugerida` varchar(100),
	`status` enum('ativo','inativo','descontinuado') NOT NULL DEFAULT 'ativo',
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_ocorrencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('atraso_recorrente','devolvido_danificado','extravio_perda','divergencia_condicao','ajuste_manual') NOT NULL,
	`emprestimoId` int,
	`exemplarId` int,
	`colaboradorId` int,
	`colaboradorNome` varchar(255),
	`descricao` text NOT NULL,
	`evidenciaUrl` varchar(1000),
	`evidenciaFileKey` varchar(500),
	`acaoAplicada` enum('bloqueio','advertencia','reposicao','baixa','nenhuma') DEFAULT 'nenhuma',
	`diasBloqueio` int,
	`responsavelId` int,
	`responsavelNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_politicas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(100) NOT NULL,
	`valor` varchar(255) NOT NULL,
	`descricao` text,
	`updatedPorId` int,
	`updatedPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `bib_reservas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`livroId` int NOT NULL,
	`exemplarId` int,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`dataReserva` varchar(10) NOT NULL,
	`posicaoFila` int NOT NULL DEFAULT 1,
	`prazoRetirada` int NOT NULL DEFAULT 3,
	`status` enum('ativa','atendida','expirada','cancelada') NOT NULL DEFAULT 'ativa',
	`dataDisponibilidade` varchar(10),
	`dataAtendimento` varchar(10),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `birthday_advance_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`ano` int NOT NULL,
	`diasAntes` int NOT NULL,
	`enviadoEm` timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `chat_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`tipo` enum('geral','setor','projeto','dm') NOT NULL DEFAULT 'setor',
	`setorId` int,
	`cor` varchar(7) DEFAULT '#3B82F6',
	`icone` varchar(50) DEFAULT 'MessageCircle',
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
	`dmUser1Id` int,
	`dmUser2Id` int
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL DEFAULT 1,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userAvatar` varchar(500),
	`content` text NOT NULL,
	`mentions` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	`deletedBy` int,
	`pinned` tinyint NOT NULL DEFAULT 0,
	`pinnedBy` int,
	`pinnedByName` varchar(255),
	`pinnedAt` timestamp,
	`fileUrl` varchar(1000),
	`fileName` varchar(500),
	`fileType` varchar(100),
	`fileSize` int,
	`replyToId` int,
	`editedAt` timestamp,
	`editedContent` text
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
	`lida` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `chat_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`emoji` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `chat_typing_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userAvatar` varchar(500),
	`startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `client_due_policy_subs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`caseId` int,
	`policyId` int NOT NULL,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `cliente_servicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`servicoId` int NOT NULL,
	`status` enum('ativo','em_execucao','concluido','cancelado') DEFAULT 'ativo',
	`atribuidoPorId` int,
	`dataInicio` timestamp,
	`dataConclusao` timestamp,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cnpj` varchar(20) NOT NULL,
	`razaoSocial` varchar(500) NOT NULL,
	`nomeFantasia` varchar(500),
	`dataAbertura` varchar(20),
	`regimeTributario` enum('simples_nacional','lucro_presumido','lucro_real') NOT NULL,
	`situacaoCadastral` enum('ativa','baixada','inapta','suspensa','nula') NOT NULL DEFAULT 'ativa',
	`classificacaoCliente` enum('novo','base') NOT NULL DEFAULT 'novo',
	`dataConversaoBase` timestamp,
	`cnaePrincipal` varchar(20),
	`cnaePrincipalDescricao` text,
	`cnaesSecundarios` json,
	`segmentoEconomico` varchar(255),
	`naturezaJuridica` varchar(255),
	`quadroSocietario` json,
	`endereco` text,
	`complemento` varchar(500),
	`estado` varchar(2),
	`industrializa` tinyint NOT NULL DEFAULT 0,
	`comercializa` tinyint NOT NULL DEFAULT 0,
	`prestaServicos` tinyint NOT NULL DEFAULT 0,
	`contribuinteIcms` tinyint NOT NULL DEFAULT 0,
	`contribuinteIpi` tinyint NOT NULL DEFAULT 0,
	`regimeMonofasico` tinyint NOT NULL DEFAULT 0,
	`folhaPagamentoMedia` decimal(15,2) DEFAULT '0',
	`faturamentoMedioMensal` decimal(15,2) DEFAULT '0',
	`valorMedioGuias` decimal(15,2) DEFAULT '0',
	`processosJudiciaisAtivos` tinyint NOT NULL DEFAULT 0,
	`parcelamentosAtivos` tinyint NOT NULL DEFAULT 0,
	`atividadePrincipalDescritivo` text,
	`parceiroId` int,
	`procuracaoHabilitada` tinyint NOT NULL DEFAULT 0,
	`procuracaoCertificado` varchar(100),
	`procuracaoValidade` varchar(20),
	`excecoesEspecificidades` text,
	`prioridade` enum('alta','media','baixa') NOT NULL DEFAULT 'media',
	`scoreOportunidade` int DEFAULT 0,
	`redFlags` json,
	`alertasInformacao` json,
	`usuarioCadastroId` int,
	`usuarioCadastroNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`tipoPessoa` enum('juridica','fisica') NOT NULL DEFAULT 'juridica',
	`cpf` varchar(14),
	`cidade` varchar(255),
	`ativo` tinyint NOT NULL DEFAULT 1
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`pisPasep` varchar(20),
	`nomeMae` varchar(500),
	`nomePai` varchar(500),
	`nacionalidade` varchar(100) DEFAULT 'Brasileira',
	`naturalidade` varchar(255),
	`estadoCivil` enum('solteiro','casado','divorciado','viuvo','uniao_estavel'),
	`tituloEleitor` varchar(20),
	`certificadoReservista` varchar(20),
	`sexo` enum('masculino','feminino','outro'),
	`cep` varchar(10),
	`logradouro` varchar(500),
	`numero` varchar(20),
	`complemento` varchar(500),
	`bairro` varchar(255),
	`cidade` varchar(255),
	`estado` varchar(2),
	`telefone` varchar(20),
	`email` varchar(320),
	`dataAdmissao` varchar(10) NOT NULL,
	`cargo` varchar(255) NOT NULL,
	`funcao` varchar(255),
	`salarioBase` decimal(12,2) NOT NULL,
	`comissoes` decimal(12,2) DEFAULT '0',
	`adicionais` decimal(12,2) DEFAULT '0',
	`jornadaEntrada` varchar(5),
	`jornadaSaida` varchar(5),
	`jornadaIntervalo` varchar(20),
	`cargaHoraria` varchar(10),
	`tipoContrato` enum('clt','pj','contrato_trabalho') NOT NULL DEFAULT 'clt',
	`localTrabalho` enum('home_office','barueri','uberaba') DEFAULT 'barueri',
	`valeTransporte` tinyint NOT NULL DEFAULT 0,
	`banco` varchar(100),
	`agencia` varchar(20),
	`conta` varchar(30),
	`tipoConta` enum('corrente','poupanca'),
	`asoAdmissionalApto` tinyint DEFAULT 1,
	`asoAdmissionalData` varchar(10),
	`dependentes` json,
	`setorId` int,
	`nivelHierarquico` enum('estagiario','auxiliar','assistente','analista_jr','analista_pl','analista_sr','coordenador','supervisor','gerente','diretor'),
	`userId` int,
	`foto` varchar(500),
	`ativo` tinyint NOT NULL DEFAULT 1,
	`dataDesligamento` varchar(10),
	`motivoDesligamento` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`chavePix` varchar(255),
	`jornadaDias` json,
	`statusColaborador` enum('ativo','inativo','afastado','licenca','atestado','desligado','ferias','experiencia','aviso_previo') NOT NULL DEFAULT 'ativo',
	`ctpsUfEmissao` varchar(2),
	`tituloEleitorZona` varchar(10),
	`tituloEleitorSecao` varchar(10),
	`grauInstrucao` enum('fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao','mestrado','doutorado'),
	`formacaoAcademica` text,
	`formacoesSuperior` text,
	`formacoesTecnicas` text,
	`habilidadesExtras` text,
	`contatoEmergenciaNome` varchar(255),
	`contatoEmergenciaTelefone` varchar(20),
	`contatoEmergenciaParentesco` varchar(100),
	`pagaPensaoAlimenticia` tinyint DEFAULT 0,
	`valorPensaoAlimenticia` decimal(12,2),
	`temContribuicaoAssistencial` tinyint DEFAULT 0,
	`valorContribuicaoAssistencial` decimal(12,2),
	`periodoExperiencia1Inicio` varchar(10),
	`periodoExperiencia1Fim` varchar(10),
	`periodoExperiencia2Inicio` varchar(10),
	`periodoExperiencia2Fim` varchar(10),
	`recebeComissao` tinyint DEFAULT 0,
	`telefoneCorporativo` varchar(20),
	`emailCorporativo` varchar(320)
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `comissoes_servico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servicoId` int NOT NULL,
	`modeloParceriaId` int NOT NULL,
	`percentualComissao` decimal(5,2) NOT NULL,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
CREATE TABLE `credit_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entidade` enum('demand_request','case','rti','task','ticket','ledger','policy','migration','sla','exito','partner_return','onboarding') NOT NULL,
	`entidadeId` int NOT NULL,
	`acao` varchar(100) NOT NULL,
	`descricao` text,
	`dadosAnteriores` json,
	`dadosNovos` json,
	`usuarioId` int,
	`usuarioNome` varchar(255),
	`ip` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_case_strategy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`clienteId` int NOT NULL,
	`estrategia` enum('compensacao','ressarcimento','restituicao','mista') NOT NULL,
	`compensacaoPct` int DEFAULT 0,
	`ressarcimentoPct` int DEFAULT 0,
	`restituicaoPct` int DEFAULT 0,
	`observacoes` text,
	`definidoPorId` int,
	`definidoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(20) NOT NULL,
	`clienteId` int NOT NULL,
	`parceiroId` int,
	`tesesIds` json,
	`fase` enum('oportunidade','contratado') NOT NULL DEFAULT 'oportunidade',
	`status` varchar(50) NOT NULL DEFAULT 'nda_pendente',
	`responsavelId` int,
	`responsavelNome` varchar(255),
	`valorEstimado` decimal(15,2) DEFAULT '0',
	`valorContratado` decimal(15,2) DEFAULT '0',
	`ndaUrl` varchar(1000),
	`ndaAssinadoEm` timestamp,
	`contratoUrl` varchar(1000),
	`contratoAssinadoEm` timestamp,
	`onboardingConcluidoEm` timestamp,
	`exitoRegistradoEm` timestamp,
	`observacoes` text,
	`demandRequestId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_checklist_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`templateId` int,
	`fila` varchar(50) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`itens` json NOT NULL,
	`progresso` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_checklist_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fila` varchar(50) NOT NULL,
	`teseId` int,
	`teseNome` varchar(500),
	`nome` varchar(255) NOT NULL,
	`itens` json NOT NULL,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_compensation_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(100) NOT NULL,
	`sigla` varchar(20) NOT NULL,
	`descricao` text,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_doc_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folderId` int NOT NULL,
	`nome` varchar(500) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`fileKey` varchar(500),
	`mimeType` varchar(100),
	`tamanhoBytes` int,
	`uploadPorId` int,
	`uploadPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_doc_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int,
	`caseId` int,
	`clienteId` int NOT NULL,
	`fila` varchar(50),
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`clienteId` int NOT NULL,
	`teseId` int,
	`teseNome` varchar(500),
	`compensationGroupId` int,
	`compensationGroupNome` varchar(100),
	`periodoInicio` varchar(10),
	`periodoFim` varchar(10),
	`valorEstimado` decimal(15,2) DEFAULT '0',
	`valorValidado` decimal(15,2) DEFAULT '0',
	`valorProtocolado` decimal(15,2) DEFAULT '0',
	`valorEfetivado` decimal(15,2) DEFAULT '0',
	`saldoResidual` decimal(15,2) DEFAULT '0',
	`tipoEfetivacao` enum('compensacao','restituicao','ressarcimento'),
	`status` enum('estimado','validado','protocolado','efetivado','parcial','cancelado') NOT NULL DEFAULT 'estimado',
	`observacoes` text,
	`atualizadoPorId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_onboarding_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`caseId` int,
	`clienteId` int NOT NULL,
	`checklistRevisao` json,
	`checklistRefinamento` json,
	`checklistRegistro` json,
	`reuniaoGravacaoUrl` varchar(1000),
	`reuniaoGravacaoFileKey` varchar(500),
	`reuniaoTranscricaoUrl` varchar(1000),
	`reuniaoTranscricaoFileKey` varchar(500),
	`reuniaoData` timestamp,
	`reuniaoParticipantes` json,
	`creditoDescricao` text,
	`periodoCredito` varchar(100),
	`valorEstimadoCredito` decimal(15,2),
	`estrategia` enum('compensacao','ressarcimento','restituicao','judicial','mista') DEFAULT 'compensacao',
	`estrategiaDetalhes` json,
	`contatoContabil` json,
	`contatoFinanceiro` json,
	`contatoEmpresario` json,
	`contatoOutros` json,
	`responsavelTecnicoId` int,
	`responsavelTecnicoNome` varchar(255),
	`empresaTemDebitos` tinyint DEFAULT 0,
	`empresaPrecisaCnd` tinyint DEFAULT 0,
	`empresaNoEmac` tinyint DEFAULT 0,
	`empresaHistoricoMalha` tinyint DEFAULT 0,
	`empresaAssinanteMonitor` tinyint DEFAULT 0,
	`status` enum('em_andamento','concluido','cancelado') NOT NULL DEFAULT 'em_andamento',
	`concluidoEm` timestamp,
	`concluidoPorId` int,
	`concluidoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_partner_returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rtiId` int NOT NULL,
	`caseId` int,
	`clienteId` int NOT NULL,
	`parceiroId` int,
	`parceiroNome` varchar(255),
	`enviadoEm` timestamp NOT NULL,
	`slaDias` int NOT NULL DEFAULT 7,
	`slaVenceEm` timestamp NOT NULL,
	`retornoRecebidoEm` timestamp,
	`retornoStatus` enum('aguardando','fechou','nao_fechou','sem_retorno','em_negociacao') NOT NULL DEFAULT 'aguardando',
	`retornoObservacao` text,
	`motivoNaoFechamento` text,
	`valorRti` decimal(15,2) DEFAULT '0',
	`valorContratado` decimal(15,2),
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_perdcomps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int,
	`caseId` int,
	`clienteId` int NOT NULL,
	`ledgerEntryId` int,
	`numeroPerdcomp` varchar(50) NOT NULL,
	`tipoCredito` varchar(100),
	`periodoApuracao` varchar(20),
	`valorCredito` decimal(15,2),
	`valorDebitosCompensados` decimal(15,2),
	`saldoRemanescente` decimal(15,2),
	`dataTransmissao` timestamp,
	`dataVencimentoGuia` timestamp,
	`guiaNumero` varchar(100),
	`guiaUrl` varchar(1000),
	`comprovanteUrl` varchar(1000),
	`reciboUrl` varchar(1000),
	`status` enum('transmitido','homologado','nao_homologado','em_analise','cancelado') NOT NULL DEFAULT 'transmitido',
	`despachoDecisorio` text,
	`feitoPelaEvox` tinyint NOT NULL DEFAULT 1,
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_sla_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`categoria` enum('triagem','fila','ticket','case','rti_devolutiva','vencimento_guia') NOT NULL,
	`fila` varchar(50),
	`tipoTarefa` varchar(50),
	`tipoTicket` varchar(50),
	`statusCase` varchar(50),
	`slaHoras` int,
	`slaDias` int,
	`slaDiasUteis` tinyint DEFAULT 1,
	`alertaDias` json,
	`escalonamentoDias` int,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_task_teses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`teseId` int NOT NULL,
	`teseNome` varchar(500),
	`aderente` tinyint NOT NULL DEFAULT 1,
	`justificativaNaoAderente` text,
	`valorEstimado` decimal(15,2) DEFAULT '0',
	`valorApurado` decimal(15,2),
	`valorValidado` decimal(15,2),
	`status` enum('selecionada','em_apuracao','apurada','validada','descartada') NOT NULL DEFAULT 'selecionada',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(20) NOT NULL,
	`fila` enum('apuracao','retificacao','compensacao','ressarcimento','restituicao','revisao','onboarding','chamados') NOT NULL,
	`caseId` int,
	`clienteId` int,
	`demandRequestId` int,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`status` enum('a_fazer','fazendo','feito','concluido') NOT NULL DEFAULT 'a_fazer',
	`prioridade` enum('urgente','alta','media','baixa') NOT NULL DEFAULT 'media',
	`ordem` int NOT NULL DEFAULT 0,
	`responsavelId` int,
	`responsavelNome` varchar(255),
	`dataVencimento` timestamp,
	`dataConclusao` timestamp,
	`slaHoras` int,
	`slaStatus` enum('dentro_prazo','atencao','vencido') DEFAULT 'dentro_prazo',
	`anexos` json,
	`observacoes` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_ticket_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`mensagem` text NOT NULL,
	`anexos` json,
	`autorId` int,
	`autorNome` varchar(255),
	`interno` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `credit_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(20) NOT NULL,
	`caseId` int,
	`clienteId` int NOT NULL,
	`parceiroId` int,
	`tipo` enum('pendencia_cliente','exigencia_rfb','contestacao_saldo','solicitacao_contencioso','solicitacao_financeiro','outros') NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`status` enum('aberto','em_andamento','aguardando_cliente','resolvido','cancelado') NOT NULL DEFAULT 'aberto',
	`prioridade` enum('urgente','alta','media','baixa') NOT NULL DEFAULT 'media',
	`responsavelId` int,
	`responsavelNome` varchar(255),
	`dataVencimento` timestamp,
	`dataResolucao` timestamp,
	`resolucao` text,
	`anexos` json,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `day_off` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`dataAniversario` varchar(10) NOT NULL,
	`dataOriginal` varchar(10) NOT NULL,
	`dataEfetiva` varchar(10) NOT NULL,
	`alterado` tinyint NOT NULL DEFAULT 0,
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
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `demand_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(20) NOT NULL,
	`origem` enum('parceiro','suporte','interno') NOT NULL DEFAULT 'parceiro',
	`parceiroId` int,
	`clienteId` int,
	`clienteCnpj` varchar(20),
	`tipoDemanda` enum('apuracao','retificacao','compensacao','onboarding','chamado','outro') NOT NULL,
	`descricao` text,
	`anexos` json,
	`urgencia` enum('normal','alta','urgente') NOT NULL DEFAULT 'normal',
	`status` enum('triagem','classificada','roteada','cancelada') NOT NULL DEFAULT 'triagem',
	`motivoCancelamento` text,
	`canceladoPorId` int,
	`canceladoEm` timestamp,
	`classificadoPorId` int,
	`classificadoEm` timestamp,
	`roteadoPorId` int,
	`roteadoEm` timestamp,
	`filaDestino` enum('apuracao','retificacao','compensacao','onboarding','chamados'),
	`tarefaCriadaId` int,
	`caseCriadoId` int,
	`slaTriagemHoras` int DEFAULT 8,
	`slaTriagemVenceEm` timestamp,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `due_schedule_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`compensationGroupId` int,
	`compensationGroupNome` varchar(100),
	`frequencia` enum('mensal','trimestral','anual') NOT NULL DEFAULT 'mensal',
	`diaVencimento` int,
	`mesesVencimento` json,
	`antecedenciaInternaDiasUteis` int DEFAULT 5,
	`antecedenciaCriacaoTarefaDias` int DEFAULT 10,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
CREATE TABLE `emails_corporativos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`email` varchar(320) NOT NULL,
	`tipoEmail` enum('principal','secundario') NOT NULL DEFAULT 'principal',
	`tipoUso` enum('individual','compartilhado') NOT NULL DEFAULT 'individual',
	`colaboradoresVinculados` json,
	`statusEmail` enum('ativo','desativado','suspenso') NOT NULL DEFAULT 'ativo',
	`dataCriacao` varchar(10),
	`dataDesativacao` varchar(10),
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `executivos_comerciais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320),
	`telefone` varchar(20),
	`cargo` varchar(255),
	`userId` int,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`abonoConvertido` tinyint DEFAULT 0,
	`aprovadorGestorId` int,
	`aprovadorGestorStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorGestorEm` timestamp,
	`aprovadorDiretoriaId` int,
	`aprovadorDiretoriaStatus` enum('pendente','aprovado','recusado') DEFAULT 'pendente',
	`aprovadorDiretoriaEm` timestamp,
	`justificativaRecusa` text,
	`enviadoParaAprovacao` tinyint DEFAULT 0,
	`enviadoEm` timestamp,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`alertasCltCct` json
);
--> statement-breakpoint
CREATE TABLE `fila_apuracao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`status` enum('a_fazer','fazendo','concluido') NOT NULL DEFAULT 'a_fazer',
	`ordem` int NOT NULL DEFAULT 0,
	`prioridadeManual` tinyint NOT NULL DEFAULT 0,
	`analistaId` int,
	`analistaNome` varchar(255),
	`tempoGastoMs` bigint,
	`dataInicioApuracao` timestamp,
	`dataConclusao` timestamp,
	`historico` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `modelos_parceria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `niveis_cargo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setorId` int NOT NULL,
	`cargo` varchar(255) NOT NULL,
	`funcao` varchar(255),
	`nivel` int NOT NULL DEFAULT 1,
	`descricaoNivel` varchar(255),
	`salarioMinimo` decimal(12,2),
	`salarioMaximo` decimal(12,2),
	`salarioBase` decimal(12,2),
	`requisitosFormacao` text,
	`comissionado` tinyint NOT NULL DEFAULT 0,
	`cargoConfianca` tinyint NOT NULL DEFAULT 0,
	`grauInstrucaoMinimo` enum('fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao','mestrado','doutorado'),
	`requisitos` text,
	`competencias` text,
	`tempoMinimoMeses` int,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('procuracao_vencendo','procuracao_vencida','analise_concluida','nova_tese','tarefa_atribuida','tarefa_sla_vencendo','tarefa_comentario','geral','avaliacao_ciclo_aberto','avaliacao_pendente','cct_vencimento','biblioteca_vencimento') NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`mensagem` text NOT NULL,
	`lida` tinyint NOT NULL DEFAULT 0,
	`usuarioId` int,
	`clienteId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`tarefaId` int
);
--> statement-breakpoint
CREATE TABLE `ocorrencia_assinaturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ocorrenciaId` int,
	`planoReversaoId` int,
	`tipo` enum('ciencia_colaborador','ciencia_gestor','ciencia_rh','concordancia_plano') NOT NULL,
	`assinanteName` varchar(255) NOT NULL,
	`assinanteId` int,
	`assinanteCargo` varchar(255),
	`ipAddress` varchar(45),
	`observacao` text,
	`assinadoEm` bigint NOT NULL,
	`createdAt` bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ocorrencia_timeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ocorrenciaId` int NOT NULL,
	`tipo` enum('registro','alteracao_status','aprovacao_solicitada','aprovacao_aprovada','aprovacao_rejeitada','plano_criado','feedback_adicionado','assinatura_colaborador','assinatura_gestor','medida_aplicada','observacao') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`executadoPorId` int,
	`executadoPorNome` varchar(255) NOT NULL,
	`metadata` text,
	`createdAt` bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ocorrencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`cargo` varchar(255),
	`setor` varchar(255),
	`tipo` enum('falta_injustificada','atraso_frequente','falta_leve','falta_media','falta_grave','falta_gravissima','erro_trabalho','conduta_inapropriada','conflito_interno') NOT NULL,
	`gravidade` enum('leve','media','grave','gravissima') NOT NULL,
	`classificacao` enum('reversivel','irreversivel') NOT NULL,
	`recomendacao` enum('advertencia','suspensao','reversao','desligamento') NOT NULL,
	`descricao` text NOT NULL,
	`dataOcorrencia` varchar(10) NOT NULL,
	`evidencias` text,
	`testemunhas` text,
	`medidasTomadas` text,
	`status` enum('registrada','em_analise','resolvida','encaminhada_reversao','encaminhada_desligamento') NOT NULL DEFAULT 'registrada',
	`registradoPorId` int,
	`registradoPorNome` varchar(255) NOT NULL,
	`planoReversaoId` int,
	`aprovacaoNecessaria` tinyint NOT NULL DEFAULT 0,
	`aprovacaoStatus` enum('pendente','aprovada','rejeitada') DEFAULT 'pendente',
	`aprovadoPorId` int,
	`aprovadoPorNome` varchar(255),
	`aprovadoEm` bigint,
	`custoRescisaoEstimado` decimal(12,2),
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `onboarding_etapas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`onboardingId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`categoria` enum('documentos','treinamentos','acessos','equipamentos','integracao','outros') NOT NULL DEFAULT 'outros',
	`ordem` int NOT NULL DEFAULT 0,
	`obrigatoria` tinyint NOT NULL DEFAULT 1,
	`prazoEmDias` int DEFAULT 7,
	`status` enum('pendente','em_andamento','concluida','nao_aplicavel') NOT NULL DEFAULT 'pendente',
	`dataConclusao` varchar(10),
	`concluidoPorId` int,
	`concluidoPorNome` varchar(255),
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `onboarding_etapas_template` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`categoria` enum('documentos','treinamentos','acessos','equipamentos','integracao','outros') NOT NULL DEFAULT 'outros',
	`ordem` int NOT NULL DEFAULT 0,
	`obrigatoria` tinyint NOT NULL DEFAULT 1,
	`prazoEmDias` int DEFAULT 7,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `onboarding_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `parceiro_servicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parceiroId` int NOT NULL,
	`servicoId` int NOT NULL,
	`percentualCustomizado` decimal(5,2),
	`aprovadoPorId` int,
	`aprovadoEm` timestamp,
	`statusAprovacao` enum('aprovado','pendente','rejeitado') DEFAULT 'aprovado',
	`observacao` text,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `parceiros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipoPessoa` enum('pf','pj') NOT NULL DEFAULT 'pj',
	`apelido` varchar(255),
	`nomeCompleto` varchar(255) NOT NULL,
	`cpf` varchar(14),
	`rg` varchar(20),
	`cnpj` varchar(20),
	`razaoSocial` varchar(500),
	`nomeFantasia` varchar(500),
	`situacaoCadastral` varchar(50),
	`quadroSocietario` json,
	`socioNome` varchar(255),
	`socioCpf` varchar(14),
	`socioRg` varchar(20),
	`socioEmail` varchar(320),
	`socioTelefone` varchar(20),
	`cpfCnpj` varchar(20),
	`telefone` varchar(20),
	`email` varchar(320),
	`cep` varchar(10),
	`logradouro` varchar(500),
	`numero` varchar(20),
	`complemento` varchar(500),
	`bairro` varchar(255),
	`cidade` varchar(255),
	`estado` varchar(2),
	`banco` varchar(100),
	`agencia` varchar(20),
	`conta` varchar(30),
	`tipoConta` enum('corrente','poupanca'),
	`titularConta` varchar(255),
	`cpfCnpjConta` varchar(20),
	`chavePix` varchar(255),
	`tipoChavePix` enum('cpf','cnpj','email','telefone','aleatoria'),
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`modeloParceriaId` int,
	`parceiroPaiId` int,
	`percentualRepasseSubparceiro` decimal(5,2),
	`ehSubparceiro` tinyint NOT NULL DEFAULT 0,
	`observacoes` text,
	`executivoComercialId` int
);
--> statement-breakpoint
CREATE TABLE `perguntas_clima` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pesquisaId` int NOT NULL,
	`texto` text NOT NULL,
	`tipo` enum('escala','multipla_escolha','texto_livre','sim_nao') NOT NULL DEFAULT 'escala',
	`opcoes` json,
	`ordem` int NOT NULL DEFAULT 0,
	`obrigatoria` tinyint NOT NULL DEFAULT 1,
	`categoria` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `pesquisas_clima` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`status` enum('rascunho','ativa','encerrada','cancelada') NOT NULL DEFAULT 'rascunho',
	`anonima` tinyint NOT NULL DEFAULT 1,
	`dataInicio` varchar(10),
	`dataFim` varchar(10),
	`totalRespostas` int DEFAULT 0,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `plano_reversao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(255) NOT NULL,
	`cargo` varchar(255),
	`setor` varchar(255),
	`status` enum('ativo','concluido_sucesso','concluido_fracasso','cancelado') NOT NULL DEFAULT 'ativo',
	`motivo` text NOT NULL,
	`objetivos` text NOT NULL,
	`dataInicio` varchar(10) NOT NULL,
	`dataFim` varchar(10) NOT NULL,
	`responsavel` varchar(255) NOT NULL,
	`coResponsavel` varchar(255),
	`frequenciaAcompanhamento` enum('semanal','quinzenal','mensal') NOT NULL DEFAULT 'quinzenal',
	`observacoes` text,
	`resultadoFinal` text,
	`criadoPorId` int,
	`criadoPorNome` varchar(255) NOT NULL,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plano_reversao_etapas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planoId` int NOT NULL,
	`tipo` enum('feedback_inicial','meta','acompanhamento','avaliacao_final') NOT NULL DEFAULT 'meta',
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`dataPrevista` varchar(10) NOT NULL,
	`dataConclusao` varchar(10),
	`status` enum('pendente','em_andamento','concluida','atrasada') NOT NULL DEFAULT 'pendente',
	`responsavel` varchar(255),
	`observacoes` text,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plano_reversao_feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planoId` int NOT NULL,
	`etapaId` int,
	`dataFeedback` varchar(10) NOT NULL,
	`tipo` enum('positivo','neutro','negativo','alerta') NOT NULL DEFAULT 'neutro',
	`descricao` text NOT NULL,
	`evolucao` enum('melhorou','estavel','piorou'),
	`registradoPorId` int,
	`registradoPorNome` varchar(255) NOT NULL,
	`createdAt` bigint NOT NULL
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `portfolio_migration_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`solicitanteParceiroId` int NOT NULL,
	`cnpj` varchar(20) NOT NULL,
	`clienteId` int,
	`parceiroAtualId` int,
	`motivo` text NOT NULL,
	`evidencias` json,
	`status` enum('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
	`aprovadorId` int,
	`aprovadoEm` timestamp,
	`observacaoAprovador` text,
	`criadoPorId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `programas_carreira` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`icone` varchar(50) DEFAULT 'GraduationCap',
	`cor` varchar(7) DEFAULT '#8B5CF6',
	`rota` varchar(255),
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`automatico` tinyint NOT NULL DEFAULT 0,
	`observacao` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `relatorios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`clienteNome` varchar(500) NOT NULL,
	`diagnosticoTributario` text,
	`tesesAplicaveis` json,
	`tesesDescartadas` json,
	`scoreOportunidade` int DEFAULT 0,
	`recomendacaoGeral` text,
	`redFlags` json,
	`prioridade` enum('alta','media','baixa') NOT NULL DEFAULT 'media',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `rti_alertas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rtiId` int NOT NULL,
	`tipo` varchar(100) NOT NULL,
	`texto` text NOT NULL,
	`ordem` int NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `rti_cenario_compensacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rtiId` int NOT NULL,
	`tributo` varchar(100) NOT NULL,
	`mediaMensal` decimal(15,2) DEFAULT '0',
	`ordem` int NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `rti_oportunidades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rtiId` int NOT NULL,
	`teseId` int,
	`descricao` varchar(500) NOT NULL,
	`classificacao` enum('pacificado','nao_pacificado') NOT NULL,
	`valorApurado` decimal(15,2) DEFAULT '0',
	`detalhamento` json,
	`ordem` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `rti_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`clienteId` int NOT NULL,
	`numero` varchar(20) NOT NULL,
	`versao` int NOT NULL DEFAULT 1,
	`tesesAnalisadas` json,
	`valorTotalEstimado` decimal(15,2) DEFAULT '0',
	`periodoAnalise` varchar(100),
	`resumoExecutivo` text,
	`metodologia` text,
	`conclusao` text,
	`observacoes` text,
	`pdfUrl` varchar(1000),
	`pdfHash` varchar(64),
	`status` enum('rascunho','emitido','revisado') NOT NULL DEFAULT 'rascunho',
	`emitidoPorId` int,
	`emitidoPorNome` varchar(255),
	`emitidoEm` timestamp,
	`slaDevolutivaDias` int DEFAULT 7,
	`slaDevolutivaVenceEm` timestamp,
	`devolutivaRecebidaEm` timestamp,
	`devolutivaStatus` enum('pendente','recebida','expirada') DEFAULT 'pendente',
	`devolutivaObservacao` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `rti_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`textoIntro` text,
	`textoObservacoes` text,
	`textoProximasEtapas` text,
	`cenarioCompensacaoDefault` json,
	`alertasDefault` json,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`criadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `senha_historico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senhaAutorizacaoId` int NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`acao` enum('criado','atualizado','revogado','reativado','transferido','senha_alterada') NOT NULL,
	`detalhes` text,
	`realizadoPorId` int,
	`realizadoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `senhas_autorizacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`colaboradorNome` varchar(500) NOT NULL,
	`tipoSenhaAuth` enum('email','computador','celular','alarme_escritorio','sistema_interno','vpn','wifi','cofre','chave_empresa','chave_sala','chave_armario','veiculo_empresa','estacionamento','cartao_acesso','biometria','outro') NOT NULL,
	`descricao` varchar(500),
	`possuiSenha` tinyint DEFAULT 0,
	`senhaValor` varchar(500),
	`senhaObs` text,
	`tipoUsoSenha` enum('individual','comum','compartilhado') NOT NULL DEFAULT 'individual',
	`colaboradoresVinculadosSenha` json,
	`autorizado` tinyint DEFAULT 0,
	`dataAutorizacao` varchar(10),
	`dataRevogacao` varchar(10),
	`autorizadoPorId` int,
	`autorizadoPorNome` varchar(255),
	`identificador` varchar(255),
	`statusSenhaAuth` enum('ativo','revogado','expirado','pendente') NOT NULL DEFAULT 'ativo',
	`observacoes` text,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `servico_etapas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servicoId` int NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`setorResponsavelId` int,
	`ordem` int NOT NULL DEFAULT 0,
	`slaHoras` int,
	`obrigatoria` tinyint NOT NULL DEFAULT 1,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `servicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(500) NOT NULL,
	`descricao` text,
	`setorId` int,
	`percentualHonorariosComercial` decimal(5,2) DEFAULT '0',
	`formaCobrancaHonorarios` enum('percentual_credito','valor_fixo','mensalidade','exito','hibrido','entrada_exito','valor_fixo_parcelado') NOT NULL DEFAULT 'percentual_credito',
	`valorFixo` decimal(15,2),
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`setoresIds` json,
	`responsaveisIds` json,
	`comissaoPadraoDiamante` decimal(5,2),
	`comissaoPadraoOuro` decimal(5,2),
	`comissaoPadraoPrata` decimal(5,2),
	`percentualHonorariosCliente` decimal(5,2) DEFAULT '0',
	`valorEntrada` decimal(15,2),
	`percentualExito` decimal(5,2),
	`quantidadeParcelas` int,
	`valorParcela` decimal(15,2)
);
--> statement-breakpoint
CREATE TABLE `setor_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setorId` int NOT NULL,
	`sigla` varchar(10) NOT NULL,
	`submenus` json,
	`workflowStatuses` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `setores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`cor` varchar(7) DEFAULT '#3B82F6',
	`icone` varchar(50) DEFAULT 'Building2',
	`setorPaiId` int,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `sla_configuracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`setorId` int,
	`slaHoras` int NOT NULL,
	`prioridade` enum('urgente','alta','media','baixa') DEFAULT 'media',
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `success_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`clienteId` int NOT NULL,
	`ledgerEntryId` int,
	`tipo` enum('compensacao','restituicao','ressarcimento') NOT NULL,
	`valor` decimal(15,2) NOT NULL,
	`dataEfetivacao` timestamp NOT NULL,
	`descricao` text,
	`faturamentoGerado` tinyint DEFAULT 0,
	`faturamentoId` int,
	`comissaoGerada` tinyint DEFAULT 0,
	`comissaoId` int,
	`registradoPorId` int,
	`registradoPorNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tarefa_comentarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tarefaId` int NOT NULL,
	`autorId` int NOT NULL,
	`autorNome` varchar(255) NOT NULL,
	`conteudo` text NOT NULL,
	`mencoes` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tarefas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(20) NOT NULL,
	`titulo` varchar(500) NOT NULL,
	`descricao` text,
	`tipo` enum('tarefa','bug','melhoria','reuniao','documento','outro') NOT NULL DEFAULT 'tarefa',
	`status` enum('backlog','a_fazer','em_andamento','revisao','concluido','cancelado') NOT NULL DEFAULT 'a_fazer',
	`prioridade` enum('urgente','alta','media','baixa') NOT NULL DEFAULT 'media',
	`setorId` int,
	`responsavelId` int,
	`criadorId` int,
	`clienteId` int,
	`tarefaPaiId` int,
	`dataInicio` timestamp,
	`dataVencimento` timestamp,
	`dataConclusao` timestamp,
	`slaHoras` int,
	`slaStatus` enum('dentro_prazo','atencao','vencido') DEFAULT 'dentro_prazo',
	`tags` json,
	`setoresEnvolvidos` json,
	`estimativaHoras` decimal(6,1),
	`horasGastas` decimal(6,1) DEFAULT '0',
	`progresso` int DEFAULT 0,
	`ordem` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
CREATE TABLE `teses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(500) NOT NULL,
	`tributoEnvolvido` varchar(100) NOT NULL,
	`tipo` enum('exclusao_base','credito_presumido','recuperacao_indebito','tese_judicial','tese_administrativa') NOT NULL,
	`classificacao` enum('pacificada','judicial','administrativa','controversa') NOT NULL,
	`potencialFinanceiro` enum('muito_alto','alto','medio','baixo') NOT NULL,
	`potencialMercadologico` enum('muito_alto','alto','medio','baixo') NOT NULL,
	`requisitosObjetivos` json,
	`requisitosImpeditivos` json,
	`fundamentacaoLegal` text,
	`jurisprudenciaRelevante` text,
	`parecerTecnicoJuridico` text,
	`prazoPrescricional` varchar(50),
	`necessidadeAcaoJudicial` tinyint NOT NULL DEFAULT 0,
	`viaAdministrativa` tinyint NOT NULL DEFAULT 0,
	`grauRisco` enum('baixo','medio','alto') NOT NULL,
	`documentosNecessarios` json,
	`formulaEstimativaCredito` text,
	`aplicavelComercio` tinyint NOT NULL DEFAULT 0,
	`aplicavelIndustria` tinyint NOT NULL DEFAULT 0,
	`aplicavelServico` tinyint NOT NULL DEFAULT 0,
	`aplicavelContribuinteIcms` tinyint NOT NULL DEFAULT 0,
	`aplicavelContribuinteIpi` tinyint NOT NULL DEFAULT 0,
	`aplicavelLucroReal` tinyint NOT NULL DEFAULT 0,
	`aplicavelLucroPresumido` tinyint NOT NULL DEFAULT 0,
	`aplicavelSimplesNacional` tinyint NOT NULL DEFAULT 0,
	`versao` int NOT NULL DEFAULT 1,
	`ativa` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `user_presence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userAvatar` varchar(500),
	`lastSeen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`status` enum('online','away','offline') NOT NULL DEFAULT 'online'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`apelido` varchar(100),
	`email` varchar(320),
	`cpf` varchar(14),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`nivelAcesso` enum('diretor','gerente','coordenador','supervisor','analista_fiscal') NOT NULL DEFAULT 'analista_fiscal',
	`ativo` tinyint NOT NULL DEFAULT 1,
	`cargo` varchar(255),
	`telefone` varchar(20),
	`avatar` varchar(500),
	`setorPrincipalId` int,
	`supervisorId` int
);
--> statement-breakpoint
CREATE TABLE `usuario_setores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`setorId` int NOT NULL,
	`papelNoSetor` enum('responsavel','membro','observador') NOT NULL DEFAULT 'membro',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX `chave` ON `api_keys` (`chave`);--> statement-breakpoint
CREATE INDEX `idx_bib_auditoria_entidade` ON `bib_auditoria` (`entidadeTipo`,`entidadeId`);--> statement-breakpoint
CREATE INDEX `idx_bib_auditoria_usuario` ON `bib_auditoria` (`usuarioId`);--> statement-breakpoint
CREATE INDEX `idx_bib_bloqueios_colab` ON `bib_bloqueios` (`colaboradorId`);--> statement-breakpoint
CREATE INDEX `idx_bib_emprestimos_exemplar` ON `bib_emprestimos` (`exemplarId`);--> statement-breakpoint
CREATE INDEX `idx_bib_emprestimos_colab` ON `bib_emprestimos` (`colaboradorId`);--> statement-breakpoint
CREATE INDEX `idx_bib_emprestimos_status` ON `bib_emprestimos` (`status`);--> statement-breakpoint
CREATE INDEX `idx_bib_exemplares_livro` ON `bib_exemplares` (`livroId`);--> statement-breakpoint
CREATE INDEX `idx_bib_exemplares_status` ON `bib_exemplares` (`status`);--> statement-breakpoint
CREATE INDEX `idx_bib_exemplares_codigo` ON `bib_exemplares` (`codigoPatrimonial`);--> statement-breakpoint
CREATE INDEX `idx_bib_livros_isbn` ON `bib_livros` (`isbn`);--> statement-breakpoint
CREATE INDEX `idx_bib_livros_categoria` ON `bib_livros` (`categoria`);--> statement-breakpoint
CREATE INDEX `idx_bib_livros_status` ON `bib_livros` (`status`);--> statement-breakpoint
CREATE INDEX `idx_bib_ocorrencias_emprestimo` ON `bib_ocorrencias` (`emprestimoId`);--> statement-breakpoint
CREATE INDEX `idx_bib_ocorrencias_colab` ON `bib_ocorrencias` (`colaboradorId`);--> statement-breakpoint
CREATE INDEX `idx_bib_politicas_chave` ON `bib_politicas` (`chave`);--> statement-breakpoint
CREATE INDEX `idx_bib_reservas_livro` ON `bib_reservas` (`livroId`);--> statement-breakpoint
CREATE INDEX `idx_bib_reservas_colab` ON `bib_reservas` (`colaboradorId`);--> statement-breakpoint
CREATE INDEX `idx_bib_reservas_status` ON `bib_reservas` (`status`);--> statement-breakpoint
CREATE INDEX `unique_notif` ON `birthday_advance_notifications` (`colaboradorId`,`ano`,`diasAntes`);--> statement-breakpoint
CREATE INDEX `idx_dm_users` ON `chat_channels` (`dmUser1Id`,`dmUser2Id`);--> statement-breakpoint
CREATE INDEX `idx_user_lida` ON `chat_notifications` (`userId`,`lida`);--> statement-breakpoint
CREATE INDEX `idx_channel` ON `chat_notifications` (`channelId`);--> statement-breakpoint
CREATE INDEX `idx_reactions_message` ON `chat_reactions` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_reactions_user` ON `chat_reactions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_typing_channel` ON `chat_typing_indicators` (`channelId`);--> statement-breakpoint
CREATE INDEX `idx_typing_user` ON `chat_typing_indicators` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_cdps_cliente` ON `client_due_policy_subs` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cdps_policy` ON `client_due_policy_subs` (`policyId`);--> statement-breakpoint
CREATE INDEX `idx_cal_entidade` ON `credit_audit_log` (`entidade`,`entidadeId`);--> statement-breakpoint
CREATE INDEX `idx_cal_acao` ON `credit_audit_log` (`acao`);--> statement-breakpoint
CREATE INDEX `idx_cal_created` ON `credit_audit_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_ccs_case` ON `credit_case_strategy` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_ccs_cliente` ON `credit_case_strategy` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cc_cliente` ON `credit_cases` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cc_parceiro` ON `credit_cases` (`parceiroId`);--> statement-breakpoint
CREATE INDEX `idx_cc_fase` ON `credit_cases` (`fase`);--> statement-breakpoint
CREATE INDEX `idx_cc_status` ON `credit_cases` (`status`);--> statement-breakpoint
CREATE INDEX `idx_cc_numero` ON `credit_cases` (`numero`);--> statement-breakpoint
CREATE INDEX `idx_cci_task` ON `credit_checklist_instances` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_cdfi_folder` ON `credit_doc_files` (`folderId`);--> statement-breakpoint
CREATE INDEX `idx_cdf_task` ON `credit_doc_folders` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_cdf_cliente` ON `credit_doc_folders` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cdf_case` ON `credit_doc_folders` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_cl_case` ON `credit_ledger` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_cl_cliente` ON `credit_ledger` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cl_group` ON `credit_ledger` (`compensationGroupId`);--> statement-breakpoint
CREATE INDEX `idx_cor_task` ON `credit_onboarding_records` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_cor_case` ON `credit_onboarding_records` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_cor_cliente` ON `credit_onboarding_records` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cpr_rti` ON `credit_partner_returns` (`rtiId`);--> statement-breakpoint
CREATE INDEX `idx_cpr_cliente` ON `credit_partner_returns` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cpr_parceiro` ON `credit_partner_returns` (`parceiroId`);--> statement-breakpoint
CREATE INDEX `idx_cpr_status` ON `credit_partner_returns` (`retornoStatus`);--> statement-breakpoint
CREATE INDEX `idx_cp_cliente` ON `credit_perdcomps` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_cp_case` ON `credit_perdcomps` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_cp_numero` ON `credit_perdcomps` (`numeroPerdcomp`);--> statement-breakpoint
CREATE INDEX `idx_cp_task` ON `credit_perdcomps` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_ctt_task` ON `credit_task_teses` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_ctt_tese` ON `credit_task_teses` (`teseId`);--> statement-breakpoint
CREATE INDEX `idx_ct_fila` ON `credit_tasks` (`fila`);--> statement-breakpoint
CREATE INDEX `idx_ct_case` ON `credit_tasks` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_ct_cliente` ON `credit_tasks` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_ct_status` ON `credit_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ctm_ticket` ON `credit_ticket_messages` (`ticketId`);--> statement-breakpoint
CREATE INDEX `idx_tk_case` ON `credit_tickets` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_tk_cliente` ON `credit_tickets` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_tk_status` ON `credit_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tk_numero` ON `credit_tickets` (`numero`);--> statement-breakpoint
CREATE INDEX `idx_dr_parceiro` ON `demand_requests` (`parceiroId`);--> statement-breakpoint
CREATE INDEX `idx_dr_cliente` ON `demand_requests` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_dr_status` ON `demand_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_dr_numero` ON `demand_requests` (`numero`);--> statement-breakpoint
CREATE INDEX `unique_colab_ano` ON `email_aniversariante_log` (`colaboradorId`,`ano`);--> statement-breakpoint
CREATE INDEX `idx_metas_parceiro` ON `metas_comissoes` (`parceiroId`);--> statement-breakpoint
CREATE INDEX `idx_metas_periodo` ON `metas_comissoes` (`ano`,`mes`,`trimestre`);--> statement-breakpoint
CREATE INDEX `idx_pmr_cnpj` ON `portfolio_migration_requests` (`cnpj`);--> statement-breakpoint
CREATE INDEX `idx_pmr_status` ON `portfolio_migration_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_rtia_rti` ON `rti_alertas` (`rtiId`);--> statement-breakpoint
CREATE INDEX `idx_rticc_rti` ON `rti_cenario_compensacao` (`rtiId`);--> statement-breakpoint
CREATE INDEX `idx_rtio_rti` ON `rti_oportunidades` (`rtiId`);--> statement-breakpoint
CREATE INDEX `idx_rti_case` ON `rti_reports` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_rti_cliente` ON `rti_reports` (`clienteId`);--> statement-breakpoint
CREATE INDEX `idx_rti_numero` ON `rti_reports` (`numero`);--> statement-breakpoint
CREATE INDEX `idx_se_case` ON `success_events` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_se_cliente` ON `success_events` (`clienteId`);--> statement-breakpoint
CREATE INDEX `unique_user` ON `user_presence` (`userId`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);