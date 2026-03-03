import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, decimal, text, timestamp, mysqlEnum, json, index, bigint, tinyint, boolean } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const academiaBeneficio = mysqlTable("academia_beneficio", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	nomeAcademia: varchar({ length: 255 }).notNull(),
	plano: varchar({ length: 255 }),
	valorPlano: decimal({ precision: 12, scale: 2 }).notNull(),
	descontoFolha: tinyint().default(0),
	valorDesconto: decimal({ precision: 12, scale: 2 }),
	dataEntrada: varchar({ length: 10 }),
	fidelidade: tinyint().default(0),
	fidelidadeMeses: int(),
	ativo: tinyint().default(1).notNull(),
	observacao: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const acoesBeneficios = mysqlTable("acoes_beneficios", {
	id: int().autoincrement().notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	tipo: mysqlEnum(['fit','solidaria','engajamento','doacao_sangue','sustentabilidade','outro']).notNull(),
	descricao: text(),
	dataInicio: varchar({ length: 10 }),
	dataFim: varchar({ length: 10 }),
	status: mysqlEnum(['planejada','ativa','concluida','cancelada']).default('planejada').notNull(),
	participantes: json(),
	metaParticipacao: int(),
	engajamentoScore: int(),
	observacao: text(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	horario: varchar({ length: 20 }),
	local: varchar({ length: 500 }),
	arteConviteUrl: varchar({ length: 500 }),
});

export const apiKeys = mysqlTable("api_keys", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	chave: varchar({ length: 64 }).notNull(),
	descricao: text(),
	permissoes: json(),
	ativo: tinyint().default(1).notNull(),
	ultimoUso: timestamp({ mode: 'string' }),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("chave").on(table.chave),
]);

export const apontamentosFolha = mysqlTable("apontamentos_folha", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	mesReferencia: int().notNull(),
	anoReferencia: int().notNull(),
	tipo: mysqlEnum(['vale_transporte','academia','comissao','reajuste_sindical','reajuste_dois_anos','pensao_alimenticia','contribuicao_assistencial','banco_horas','outro']).notNull(),
	descricao: varchar({ length: 500 }),
	valor: decimal({ precision: 12, scale: 2 }).notNull(),
	natureza: mysqlEnum(['provento','desconto']).default('provento').notNull(),
	origemId: int(),
	origemTabela: varchar({ length: 100 }),
	observacao: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const aprovacaoComissao = mysqlTable("aprovacao_comissao", {
	id: int().autoincrement().notNull(),
	parceiroId: int().notNull(),
	servicoId: int().notNull(),
	percentualSolicitado: decimal({ precision: 5, scale: 2 }).notNull(),
	percentualPadrao: decimal({ precision: 5, scale: 2 }).notNull(),
	modeloParceriaId: int().notNull(),
	solicitadoPorId: int().notNull(),
	solicitadoEm: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	status: mysqlEnum(['pendente','aprovado','rejeitado']).default('pendente').notNull(),
	aprovadoPorId: int(),
	aprovadoEm: timestamp({ mode: 'string' }),
	observacao: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const arquivos = mysqlTable("arquivos", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 500 }).notNull(),
	nomeOriginal: varchar({ length: 500 }).notNull(),
	mimeType: varchar({ length: 100 }).notNull(),
	tamanhoBytes: bigint({ mode: "number" }).notNull(),
	storageKey: varchar({ length: 500 }).notNull(),
	storageUrl: varchar({ length: 1000 }).notNull(),
	entidadeTipo: mysqlEnum(['cliente','tarefa','tese','parceiro','relatorio','geral']).notNull(),
	entidadeId: int(),
	versao: int().default(1).notNull(),
	arquivoPaiId: int(),
	descricao: text(),
	tags: json(),
	uploadPorId: int(),
	uploadPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const atestadosLicencas = mysqlTable("atestados_licencas", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	tipo: mysqlEnum(['atestado_medico','licenca_maternidade','licenca_paternidade','licenca_casamento','licenca_obito','licenca_medica','licenca_militar','licenca_vestibular','doacao_sangue','acompanhamento_medico','mesario','day_off','outro']).notNull(),
	dataInicio: varchar({ length: 10 }).notNull(),
	dataFim: varchar({ length: 10 }).notNull(),
	diasAfastamento: int().notNull(),
	cid: varchar({ length: 10 }),
	medico: varchar({ length: 255 }),
	crm: varchar({ length: 20 }),
	observacao: text(),
	documentoUrl: varchar({ length: 500 }),
	status: mysqlEnum(['ativo','encerrado','cancelado']).default('ativo').notNull(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const auditLog = mysqlTable("audit_log", {
	id: int().autoincrement().notNull(),
	acao: mysqlEnum(['criar','editar','excluir','visualizar','login','logout','atribuir','concluir','comentar','upload','download','exportar','ativar','inativar']).notNull(),
	entidadeTipo: varchar({ length: 50 }).notNull(),
	entidadeId: int(),
	entidadeNome: varchar({ length: 500 }),
	detalhes: json(),
	usuarioId: int(),
	usuarioNome: varchar({ length: 255 }),
	ip: varchar({ length: 45 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const avaliacoes = mysqlTable("avaliacoes", {
	id: int().autoincrement().notNull(),
	cicloId: int().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }),
	avaliadorId: int().notNull(),
	avaliadorNome: varchar({ length: 500 }),
	tipoAvaliador: mysqlEnum(['gestor','par','autoavaliacao','subordinado']).notNull(),
	notas: json(),
	notaGeral: decimal({ precision: 4, scale: 2 }),
	comentarioGeral: text(),
	pontosFortes: text(),
	pontosDesenvolvimento: text(),
	status: mysqlEnum(['pendente','em_andamento','concluida']).default('pendente').notNull(),
	planoCarreiraId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const bancoHoras = mysqlTable("banco_horas", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	tipo: mysqlEnum(['extra','compensacao','ajuste_positivo','ajuste_negativo']).default('extra').notNull(),
	data: varchar({ length: 10 }).notNull(),
	horas: decimal({ precision: 6, scale: 2 }).notNull(),
	motivo: text(),
	aprovado: tinyint().default(0).notNull(),
	aprovadoPorId: int(),
	aprovadoPorNome: varchar({ length: 255 }),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const beneficiosCustom = mysqlTable("beneficios_custom", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	descricao: text(),
	icone: varchar({ length: 50 }).default('Gift'),
	cor: varchar({ length: 7 }).default('#3B82F6'),
	rota: varchar({ length: 255 }),
	ativo: tinyint().default(1).notNull(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const birthdayAdvanceNotifications = mysqlTable("birthday_advance_notifications", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	ano: int().notNull(),
	diasAntes: int().notNull(),
	enviadoEm: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("unique_notif").on(table.colaboradorId, table.ano, table.diasAntes),
]);

export const chatChannels = mysqlTable("chat_channels", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	descricao: text(),
	tipo: mysqlEnum(['geral','setor','projeto','dm']).default('setor').notNull(),
	setorId: int(),
	cor: varchar({ length: 7 }).default('#3B82F6'),
	icone: varchar({ length: 50 }).default('MessageCircle'),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	status: mysqlEnum(['active','inactive','deleted']).default('active').notNull(),
	dmUser1Id: int(),
	dmUser2Id: int(),
},
(table) => [
	index("idx_dm_users").on(table.dmUser1Id, table.dmUser2Id),
]);

export const chatMessages = mysqlTable("chat_messages", {
	id: int().autoincrement().notNull(),
	channelId: int().default(1).notNull(),
	userId: int().notNull(),
	userName: varchar({ length: 255 }).notNull(),
	userAvatar: varchar({ length: 500 }),
	content: text().notNull(),
	mentions: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	deletedAt: timestamp({ mode: 'string' }),
	deletedBy: int(),
	pinned: tinyint().default(0).notNull(),
	pinnedBy: int(),
	pinnedByName: varchar({ length: 255 }),
	pinnedAt: timestamp({ mode: 'string' }),
	fileUrl: varchar({ length: 1000 }),
	fileName: varchar({ length: 500 }),
	fileType: varchar({ length: 100 }),
	fileSize: int(),
	replyToId: int(),
	editedAt: timestamp({ mode: 'string' }),
	editedContent: text(),
});

export const chatNotifications = mysqlTable("chat_notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	messageId: int().notNull(),
	channelId: int().notNull(),
	tipo: mysqlEnum(['mencao','mensagem']).default('mencao').notNull(),
	remetenteNome: varchar({ length: 255 }).notNull(),
	preview: varchar({ length: 500 }),
	lida: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_user_lida").on(table.userId, table.lida),
	index("idx_channel").on(table.channelId),
]);

export const chatReactions = mysqlTable("chat_reactions", {
	id: int().autoincrement().notNull(),
	messageId: int().notNull(),
	userId: int().notNull(),
	userName: varchar({ length: 255 }).notNull(),
	emoji: varchar({ length: 20 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_reactions_message").on(table.messageId),
	index("idx_reactions_user").on(table.userId),
]);

export const chatTypingIndicators = mysqlTable("chat_typing_indicators", {
	id: int().autoincrement().notNull(),
	channelId: int().notNull(),
	userId: int().notNull(),
	userName: varchar({ length: 255 }).notNull(),
	userAvatar: varchar({ length: 500 }),
	startedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_typing_channel").on(table.channelId),
	index("idx_typing_user").on(table.userId),
]);

export const ciclosAvaliacao = mysqlTable("ciclos_avaliacao", {
	id: int().autoincrement().notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	descricao: text(),
	dataInicio: varchar({ length: 10 }).notNull(),
	dataFim: varchar({ length: 10 }).notNull(),
	status: mysqlEnum(['rascunho','em_andamento','encerrado']).default('rascunho').notNull(),
	criterios: json(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const clienteServicos = mysqlTable("cliente_servicos", {
	id: int().autoincrement().notNull(),
	clienteId: int().notNull(),
	servicoId: int().notNull(),
	status: mysqlEnum(['ativo','em_execucao','concluido','cancelado']).default('ativo'),
	atribuidoPorId: int(),
	dataInicio: timestamp({ mode: 'string' }),
	dataConclusao: timestamp({ mode: 'string' }),
	observacao: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const clientes = mysqlTable("clientes", {
	id: int().autoincrement().notNull(),
	codigo: varchar({ length: 20 }),
	cnpj: varchar({ length: 20 }).notNull(),
	razaoSocial: varchar({ length: 500 }).notNull(),
	nomeFantasia: varchar({ length: 500 }),
	dataAbertura: varchar({ length: 20 }),
	regimeTributario: mysqlEnum(['simples_nacional','lucro_presumido','lucro_real']).notNull(),
	situacaoCadastral: mysqlEnum(['ativa','baixada','inapta','suspensa','nula']).default('ativa').notNull(),
	classificacaoCliente: mysqlEnum(['novo','base']).default('novo').notNull(),
	dataConversaoBase: timestamp({ mode: 'string' }),
	cnaePrincipal: varchar({ length: 20 }),
	cnaePrincipalDescricao: text(),
	cnaesSecundarios: json(),
	segmentoEconomico: varchar({ length: 255 }),
	naturezaJuridica: varchar({ length: 255 }),
	quadroSocietario: json(),
	endereco: text(),
	complemento: varchar({ length: 500 }),
	estado: varchar({ length: 2 }),
	industrializa: tinyint().default(0).notNull(),
	comercializa: tinyint().default(0).notNull(),
	prestaServicos: tinyint().default(0).notNull(),
	contribuinteIcms: tinyint().default(0).notNull(),
	contribuinteIpi: tinyint().default(0).notNull(),
	regimeMonofasico: tinyint().default(0).notNull(),
	folhaPagamentoMedia: decimal({ precision: 15, scale: 2 }).default('0'),
	faturamentoMedioMensal: decimal({ precision: 15, scale: 2 }).default('0'),
	valorMedioGuias: decimal({ precision: 15, scale: 2 }).default('0'),
	processosJudiciaisAtivos: tinyint().default(0).notNull(),
	parcelamentosAtivos: tinyint().default(0).notNull(),
	atividadePrincipalDescritivo: text(),
	parceiroId: int(),
	procuracaoHabilitada: tinyint().default(0).notNull(),
	procuracaoCertificado: varchar({ length: 100 }),
	procuracaoValidade: varchar({ length: 20 }),	excepcoesEspecificidades: text(),
	prioridade: mysqlEnum(['alta','media','baixa']).default('media').notNull(),
	scoreOportunidade: int().default(0),
	redFlags: json(),
	alertasInformacao: json(),
	usuarioCadastroId: int(),
	usuarioCadastroNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	tipoPessoa: mysqlEnum(['juridica','fisica']).default('juridica').notNull(),
	cpf: varchar({ length: 14 }),
	cidade: varchar({ length: 255 }),
	ativo: tinyint().default(1).notNull(),
});

export const colaboradorDocumentos = mysqlTable("colaborador_documentos", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	tipo: mysqlEnum(['foto','rg','ctps','aso','contrato','comprovante_residencia','outro']).notNull(),
	nomeArquivo: varchar({ length: 500 }).notNull(),
	url: varchar({ length: 1000 }).notNull(),
	fileKey: varchar({ length: 500 }).notNull(),
	mimeType: varchar({ length: 100 }),
	tamanho: int(),
	enviadoPorId: int(),
	enviadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const colaboradores = mysqlTable("colaboradores", {
	id: int().autoincrement().notNull(),
	nomeCompleto: varchar({ length: 500 }).notNull(),
	dataNascimento: varchar({ length: 10 }),
	cpf: varchar({ length: 14 }).notNull(),
	rgNumero: varchar({ length: 20 }),
	rgOrgaoEmissor: varchar({ length: 50 }),
	rgDataEmissao: varchar({ length: 10 }),
	ctpsNumero: varchar({ length: 50 }),
	pisPasep: varchar({ length: 20 }),
	nomeMae: varchar({ length: 500 }),
	nomePai: varchar({ length: 500 }),
	nacionalidade: varchar({ length: 100 }).default('Brasileira'),
	naturalidade: varchar({ length: 255 }),
	estadoCivil: mysqlEnum(['solteiro','casado','divorciado','viuvo','uniao_estavel']),
	tituloEleitor: varchar({ length: 20 }),
	certificadoReservista: varchar({ length: 20 }),
	sexo: mysqlEnum(['masculino','feminino','outro']),
	cep: varchar({ length: 10 }),
	logradouro: varchar({ length: 500 }),
	numero: varchar({ length: 20 }),
	complemento: varchar({ length: 500 }),
	bairro: varchar({ length: 255 }),
	cidade: varchar({ length: 255 }),
	estado: varchar({ length: 2 }),
	telefone: varchar({ length: 20 }),
	email: varchar({ length: 320 }),
	dataAdmissao: varchar({ length: 10 }).notNull(),
	cargo: varchar({ length: 255 }).notNull(),
	funcao: varchar({ length: 255 }),
	salarioBase: decimal({ precision: 12, scale: 2 }).notNull(),
	comissoes: decimal({ precision: 12, scale: 2 }).default('0'),
	adicionais: decimal({ precision: 12, scale: 2 }).default('0'),
	jornadaEntrada: varchar({ length: 5 }),
	jornadaSaida: varchar({ length: 5 }),
	jornadaIntervalo: varchar({ length: 20 }),
	cargaHoraria: varchar({ length: 10 }),
	tipoContrato: mysqlEnum(['clt','pj','contrato_trabalho']).default('clt').notNull(),
	localTrabalho: mysqlEnum(['home_office','barueri','uberaba']).default('barueri'),
	valeTransporte: tinyint().default(0).notNull(),
	banco: varchar({ length: 100 }),
	agencia: varchar({ length: 20 }),
	conta: varchar({ length: 30 }),
	tipoConta: mysqlEnum(['corrente','poupanca']),
	asoAdmissionalApto: tinyint().default(1),
	asoAdmissionalData: varchar({ length: 10 }),
	dependentes: json(),
	setorId: int(),
	nivelHierarquico: mysqlEnum(['estagiario','auxiliar','assistente','analista_jr','analista_pl','analista_sr','coordenador','supervisor','gerente','diretor']),
	userId: int(),
	foto: varchar({ length: 500 }),
	ativo: tinyint().default(1).notNull(),
	dataDesligamento: varchar({ length: 10 }),
	motivoDesligamento: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	chavePix: varchar({ length: 255 }),
	jornadaDias: json(),
	statusColaborador: mysqlEnum(['ativo','inativo','afastado','licenca','atestado','desligado','ferias','experiencia','aviso_previo']).default('ativo').notNull(),
	ctpsUfEmissao: varchar({ length: 2 }),
	tituloEleitorZona: varchar({ length: 10 }),
	tituloEleitorSecao: varchar({ length: 10 }),
	grauInstrucao: mysqlEnum(['fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao','mestrado','doutorado']),
	formacaoAcademica: text(),
	formacoesSuperior: text(),
	formacoesTecnicas: text(),
	habilidadesExtras: text(),
	contatoEmergenciaNome: varchar({ length: 255 }),
	contatoEmergenciaTelefone: varchar({ length: 20 }),
	contatoEmergenciaParentesco: varchar({ length: 100 }),
	pagaPensaoAlimenticia: tinyint().default(0),
	valorPensaoAlimenticia: decimal({ precision: 12, scale: 2 }),
	temContribuicaoAssistencial: tinyint().default(0),
	valorContribuicaoAssistencial: decimal({ precision: 12, scale: 2 }),
	periodoExperiencia1Inicio: varchar({ length: 10 }),
	periodoExperiencia1Fim: varchar({ length: 10 }),
	periodoExperiencia2Inicio: varchar({ length: 10 }),
	periodoExperiencia2Fim: varchar({ length: 10 }),
	recebeComissao: tinyint().default(0),
	telefoneCorporativo: varchar({ length: 20 }),
	emailCorporativo: varchar({ length: 320 }),
});

export const comissaoRh = mysqlTable("comissao_rh", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	tipo: mysqlEnum(['evox_monitor','dpt','credito','outro']).notNull(),
	descricao: text(),
	mesReferencia: int().notNull(),
	anoReferencia: int().notNull(),
	valorBase: decimal({ precision: 12, scale: 2 }).notNull(),
	percentual: decimal({ precision: 5, scale: 2 }),
	valorComissao: decimal({ precision: 12, scale: 2 }).notNull(),
	observacao: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const comissoesServico = mysqlTable("comissoes_servico", {
	id: int().autoincrement().notNull(),
	servicoId: int().notNull(),
	modeloParceriaId: int().notNull(),
	percentualComissao: decimal({ precision: 5, scale: 2 }).notNull(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const dayOff = mysqlTable("day_off", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	dataAniversario: varchar({ length: 10 }).notNull(),
	dataOriginal: varchar({ length: 10 }).notNull(),
	dataEfetiva: varchar({ length: 10 }).notNull(),
	alterado: tinyint().default(0).notNull(),
	motivoAlteracao: text(),
	status: mysqlEnum(['pendente','aprovado','recusado','utilizado']).default('pendente').notNull(),
	aprovadorGestorId: int(),
	aprovadorGestorStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorGestorEm: timestamp({ mode: 'string' }),
	aprovadorRhId: int(),
	aprovadorRhStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorRhEm: timestamp({ mode: 'string' }),
	aprovadorDiretoriaId: int(),
	aprovadorDiretoriaStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorDiretoriaEm: timestamp({ mode: 'string' }),
	observacao: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const doacaoSangue = mysqlTable("doacao_sangue", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	dataDoacao: varchar({ length: 10 }).notNull(),
	prazoFolga: varchar({ length: 10 }).notNull(),
	dataFolga: varchar({ length: 10 }),
	comprovanteUrl: varchar({ length: 500 }),
	status: mysqlEnum(['pendente','aprovado','recusado','utilizado']).default('pendente').notNull(),
	aprovadorGestorId: int(),
	aprovadorGestorStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorGestorEm: timestamp({ mode: 'string' }),
	aprovadorRhId: int(),
	aprovadorRhStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorRhEm: timestamp({ mode: 'string' }),
	aprovadorDiretoriaId: int(),
	aprovadorDiretoriaStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorDiretoriaEm: timestamp({ mode: 'string' }),
	observacao: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailAniversarianteConfig = mysqlTable("email_aniversariante_config", {
	id: int().autoincrement().notNull(),
	assunto: varchar({ length: 500 }).default('Feliz Aniversário!').notNull(),
	mensagem: text().notNull(),
	assinatura: varchar({ length: 500 }).default('Equipe Evox').notNull(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const emailAniversarianteLog = mysqlTable("email_aniversariante_log", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	ano: int().notNull(),
	enviadoEm: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("unique_colab_ano").on(table.colaboradorId, table.ano),
]);

export const emailsCorporativos = mysqlTable("emails_corporativos", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	tipoEmail: mysqlEnum('tipoEmail', ['principal','secundario']).default('principal').notNull(),
	tipoUso: mysqlEnum('tipoUso', ['individual','compartilhado']).default('individual').notNull(),
	colaboradoresVinculados: json('colaboradoresVinculados').$type<{id: number; nome: string}[]>(),
	statusEmail: mysqlEnum('statusEmail', ['ativo','desativado','suspenso']).default('ativo').notNull(),
	dataCriacao: varchar({ length: 10 }),
	dataDesativacao: varchar({ length: 10 }),
	observacoes: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const equipamentosColaborador = mysqlTable("equipamentos_colaborador", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }).notNull(),
	tipo: mysqlEnum(['notebook','celular','desktop','monitor','headset','teclado','mouse','webcam','impressora','tablet','telefone_fixo','ramal','email_corporativo','telefone_corporativo','outro']).notNull(),
	marca: varchar({ length: 255 }),
	modelo: varchar({ length: 255 }),
	numeroSerie: varchar({ length: 255 }),
	patrimonio: varchar({ length: 100 }),
	descricao: text(),
	dataEntrega: varchar({ length: 10 }),
	dataDevolucao: varchar({ length: 10 }),
	statusEquipamento: mysqlEnum(['em_uso','devolvido','manutencao','perdido','descartado']).default('em_uso').notNull(),
	observacoes: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const executivosComerciais = mysqlTable("executivos_comerciais", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }),
	telefone: varchar({ length: 20 }),
	cargo: varchar({ length: 255 }),
	userId: int(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const ferias = mysqlTable("ferias", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	periodoAquisitivoInicio: varchar({ length: 10 }).notNull(),
	periodoAquisitivoFim: varchar({ length: 10 }).notNull(),
	periodoConcessivoFim: varchar({ length: 10 }).notNull(),
	periodo1Inicio: varchar({ length: 10 }),
	periodo1Fim: varchar({ length: 10 }),
	periodo1Dias: int(),
	periodo2Inicio: varchar({ length: 10 }),
	periodo2Fim: varchar({ length: 10 }),
	periodo2Dias: int(),
	periodo3Inicio: varchar({ length: 10 }),
	periodo3Fim: varchar({ length: 10 }),
	periodo3Dias: int(),
	diasTotais: int().default(30),
	faltasInjustificadas: int().default(0),
	diasDireito: int().default(30),
	status: mysqlEnum(['pendente','programada','em_gozo','concluida','vencida']).default('pendente').notNull(),
	avisoPrevioData: varchar({ length: 10 }),
	alertas: json(),
	observacao: text(),
	aprovadoPorId: int(),
	aprovadoEm: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	abonoConvertido: tinyint().default(0),
	aprovadorGestorId: int(),
	aprovadorGestorStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorGestorEm: timestamp({ mode: 'string' }),
	aprovadorDiretoriaId: int(),
	aprovadorDiretoriaStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorDiretoriaEm: timestamp({ mode: 'string' }),
	justificativaRecusa: text(),
	enviadoParaAprovacao: tinyint().default(0),
	enviadoEm: timestamp({ mode: 'string' }),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	alertasCltCct: json(),
});

export const filaApuracao = mysqlTable("fila_apuracao", {
	id: int().autoincrement().notNull(),
	clienteId: int().notNull(),
	status: mysqlEnum(['a_fazer','fazendo','concluido']).default('a_fazer').notNull(),
	ordem: int().default(0).notNull(),
	prioridadeManual: tinyint().default(0).notNull(),
	analistaId: int(),
	analistaNome: varchar({ length: 255 }),
	tempoGastoMs: bigint({ mode: "number" }),
	dataInicioApuracao: timestamp({ mode: 'string' }),
	dataConclusao: timestamp({ mode: 'string' }),
	historico: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const historicoStatusColaborador = mysqlTable("historico_status_colaborador", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	statusAnterior: varchar({ length: 50 }).notNull(),
	statusNovo: varchar({ length: 50 }).notNull(),
	motivo: text(),
	origemModulo: varchar({ length: 50 }),
	origemRegistroId: int(),
	alteradoPorId: int(),
	alteradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const metasComissoes = mysqlTable("metas_comissoes", {
	id: int().autoincrement().notNull(),
	parceiroId: int().notNull(),
	tipo: mysqlEnum(['mensal','trimestral','semestral','anual']).default('mensal').notNull(),
	ano: int().notNull(),
	mes: int(),
	trimestre: int(),
	valorMeta: decimal({ precision: 12, scale: 2 }).notNull(),
	observacao: text(),
	criadoPor: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_metas_parceiro").on(table.parceiroId),
	index("idx_metas_periodo").on(table.ano, table.mes, table.trimestre),
]);

export const metasIndividuais = mysqlTable("metas_individuais", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }),
	cicloId: int(),
	titulo: varchar({ length: 500 }).notNull(),
	descricao: text(),
	categoria: mysqlEnum(['produtividade','qualidade','financeiro','desenvolvimento','cliente','processo','outro']).default('outro').notNull(),
	unidadeMedida: varchar({ length: 50 }),
	valorMeta: decimal({ precision: 12, scale: 2 }).notNull(),
	valorAtual: decimal({ precision: 12, scale: 2 }).default('0'),
	peso: int().default(1),
	dataInicio: varchar({ length: 10 }),
	dataFim: varchar({ length: 10 }),
	status: mysqlEnum(['nao_iniciada','em_andamento','concluida','cancelada']).default('nao_iniciada').notNull(),
	observacao: text(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const modelosParceria = mysqlTable("modelos_parceria", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 100 }).notNull(),
	descricao: text(),
	ordem: int().default(0).notNull(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const niveisCargo = mysqlTable("niveis_cargo", {
	id: int().autoincrement().notNull(),
	setorId: int().notNull(),
	cargo: varchar({ length: 255 }).notNull(),
	funcao: varchar({ length: 255 }),
	nivel: int().default(1).notNull(),
	descricaoNivel: varchar({ length: 255 }),
	salarioMinimo: decimal({ precision: 12, scale: 2 }),
	salarioMaximo: decimal({ precision: 12, scale: 2 }),
	salarioBase: decimal({ precision: 12, scale: 2 }),
	requisitosFormacao: text(),
	comissionado: tinyint().default(0).notNull(),
	cargoConfianca: tinyint().default(0).notNull(),
	grauInstrucaoMinimo: mysqlEnum(['fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao','mestrado','doutorado']),
	requisitos: text(),
	competencias: text(),
	tempoMinimoMeses: int(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const notificacoes = mysqlTable("notificacoes", {
	id: int().autoincrement().notNull(),
	tipo: mysqlEnum(['procuracao_vencendo','procuracao_vencida','analise_concluida','nova_tese','tarefa_atribuida','tarefa_sla_vencendo','tarefa_comentario','geral','avaliacao_ciclo_aberto','avaliacao_pendente','cct_vencimento','biblioteca_vencimento']).notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	mensagem: text().notNull(),
	lida: tinyint().default(0).notNull(),
	usuarioId: int(),
	clienteId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	tarefaId: int(),
});

export const onboardingColaborador = mysqlTable("onboarding_colaborador", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	templateId: int(),
	templateNome: varchar({ length: 255 }),
	status: mysqlEnum(['pendente','em_andamento','concluido','cancelado']).default('pendente').notNull(),
	dataInicio: varchar({ length: 10 }),
	dataConclusao: varchar({ length: 10 }),
	observacao: text(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const onboardingEtapas = mysqlTable("onboarding_etapas", {
	id: int().autoincrement().notNull(),
	onboardingId: int().notNull(),
	titulo: varchar({ length: 255 }).notNull(),
	descricao: text(),
	categoria: mysqlEnum(['documentos','treinamentos','acessos','equipamentos','integracao','outros']).default('outros').notNull(),
	ordem: int().default(0).notNull(),
	obrigatoria: tinyint().default(1).notNull(),
	prazoEmDias: int().default(7),
	status: mysqlEnum(['pendente','em_andamento','concluida','nao_aplicavel']).default('pendente').notNull(),
	dataConclusao: varchar({ length: 10 }),
	concluidoPorId: int(),
	concluidoPorNome: varchar({ length: 255 }),
	observacao: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const onboardingEtapasTemplate = mysqlTable("onboarding_etapas_template", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull(),
	titulo: varchar({ length: 255 }).notNull(),
	descricao: text(),
	categoria: mysqlEnum(['documentos','treinamentos','acessos','equipamentos','integracao','outros']).default('outros').notNull(),
	ordem: int().default(0).notNull(),
	obrigatoria: tinyint().default(1).notNull(),
	prazoEmDias: int().default(7),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const onboardingTemplates = mysqlTable("onboarding_templates", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	descricao: text(),
	ativo: tinyint().default(1).notNull(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const parceiroServicos = mysqlTable("parceiro_servicos", {
	id: int().autoincrement().notNull(),
	parceiroId: int().notNull(),
	servicoId: int().notNull(),
	percentualCustomizado: decimal({ precision: 5, scale: 2 }),
	aprovadoPorId: int(),
	aprovadoEm: timestamp({ mode: 'string' }),
	statusAprovacao: mysqlEnum(['aprovado','pendente','rejeitado']).default('aprovado'),
	observacao: text(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const parceiros = mysqlTable("parceiros", {
	id: int().autoincrement().notNull(),
	tipoPessoa: mysqlEnum(['pf','pj']).default('pj').notNull(),
	apelido: varchar({ length: 255 }),
	nomeCompleto: varchar({ length: 255 }).notNull(),
	cpf: varchar({ length: 14 }),
	rg: varchar({ length: 20 }),
	cnpj: varchar({ length: 20 }),
	razaoSocial: varchar({ length: 500 }),
	nomeFantasia: varchar({ length: 500 }),
	situacaoCadastral: varchar({ length: 50 }),
	quadroSocietario: json(),
	socioNome: varchar({ length: 255 }),
	socioCpf: varchar({ length: 14 }),
	socioRg: varchar({ length: 20 }),
	socioEmail: varchar({ length: 320 }),
	socioTelefone: varchar({ length: 20 }),
	cpfCnpj: varchar({ length: 20 }),
	telefone: varchar({ length: 20 }),
	email: varchar({ length: 320 }),
	cep: varchar({ length: 10 }),
	logradouro: varchar({ length: 500 }),
	numero: varchar({ length: 20 }),
	complemento: varchar({ length: 500 }),
	bairro: varchar({ length: 255 }),
	cidade: varchar({ length: 255 }),
	estado: varchar({ length: 2 }),
	banco: varchar({ length: 100 }),
	agencia: varchar({ length: 20 }),
	conta: varchar({ length: 30 }),
	tipoConta: mysqlEnum(['corrente','poupanca']),
	titularConta: varchar({ length: 255 }),
	cpfCnpjConta: varchar({ length: 20 }),
	chavePix: varchar({ length: 255 }),
	tipoChavePix: mysqlEnum(['cpf','cnpj','email','telefone','aleatoria']),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	modeloParceriaId: int(),
	parceiroPaiId: int(),
	percentualRepasseSubparceiro: decimal({ precision: 5, scale: 2 }),
	ehSubparceiro: tinyint().default(0).notNull(),
	observacoes: text(),
	executivoComercialId: int(),
});

export const perguntasClima = mysqlTable("perguntas_clima", {
	id: int().autoincrement().notNull(),
	pesquisaId: int().notNull(),
	texto: text().notNull(),
	tipo: mysqlEnum(['escala','multipla_escolha','texto_livre','sim_nao']).default('escala').notNull(),
	opcoes: json(),
	ordem: int().default(0).notNull(),
	obrigatoria: tinyint().default(1).notNull(),
	categoria: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const pesquisasClima = mysqlTable("pesquisas_clima", {
	id: int().autoincrement().notNull(),
	titulo: varchar({ length: 255 }).notNull(),
	descricao: text(),
	status: mysqlEnum(['rascunho','ativa','encerrada','cancelada']).default('rascunho').notNull(),
	anonima: tinyint().default(1).notNull(),
	dataInicio: varchar({ length: 10 }),
	dataFim: varchar({ length: 10 }),
	totalRespostas: int().default(0),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const planosCarreira = mysqlTable("planos_carreira", {
	id: int().autoincrement().notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	descricao: text(),
	colaboradorId: int(),
	setorId: int(),
	nivelAtual: varchar({ length: 100 }),
	nivelAlvo: varchar({ length: 100 }),
	prazoMeses: int(),
	status: mysqlEnum(['em_andamento','concluido','pausado','cancelado']).default('em_andamento').notNull(),
	metas: json(),
	competencias: json(),
	treinamentos: json(),
	observacao: text(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const programasCarreira = mysqlTable("programas_carreira", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	descricao: text(),
	icone: varchar({ length: 50 }).default('GraduationCap'),
	cor: varchar({ length: 7 }).default('#8B5CF6'),
	rota: varchar({ length: 255 }),
	ativo: tinyint().default(1).notNull(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const rateioComissao = mysqlTable("rateio_comissao", {
	id: int().autoincrement().notNull(),
	parceiroId: int().notNull(),
	parceiroPaiId: int().notNull(),
	servicoId: int().notNull(),
	percentualParceiro: decimal({ precision: 5, scale: 2 }).notNull(),
	percentualSubparceiro: decimal({ precision: 5, scale: 2 }).notNull(),
	percentualMaximo: decimal({ precision: 5, scale: 2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const reajustesSalariais = mysqlTable("reajustes_salariais", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	tipo: mysqlEnum(['dois_anos','sindical','promocao','merito','outro']).notNull(),
	percentual: decimal({ precision: 5, scale: 2 }).notNull(),
	salarioAnterior: decimal({ precision: 12, scale: 2 }).notNull(),
	salarioNovo: decimal({ precision: 12, scale: 2 }).notNull(),
	dataEfetivacao: varchar({ length: 10 }).notNull(),
	mesReferencia: int(),
	anoReferencia: int(),
	automatico: tinyint().default(0).notNull(),
	observacao: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const relatorios = mysqlTable("relatorios", {
	id: int().autoincrement().notNull(),
	clienteId: int().notNull(),
	clienteNome: varchar({ length: 500 }).notNull(),
	diagnosticoTributario: text(),
	tesesAplicaveis: json(),
	tesesDescartadas: json(),
	scoreOportunidade: int().default(0),
	recomendacaoGeral: text(),
	redFlags: json(),
	prioridade: mysqlEnum(['alta','media','baixa']).default('media').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const rescisoes = mysqlTable("rescisoes", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }).notNull(),
	dataDesligamento: varchar({ length: 10 }).notNull(),
	tipoDesligamento: mysqlEnum(['sem_justa_causa','justa_causa','pedido_demissao','termino_experiencia_1','termino_experiencia_2','acordo_mutuo']).notNull(),
	dataAdmissao: varchar({ length: 10 }).notNull(),
	salarioBase: decimal({ precision: 12, scale: 2 }).notNull(),
	tipoContrato: varchar({ length: 50 }),
	periodoExperiencia1Inicio: varchar({ length: 10 }),
	periodoExperiencia1Fim: varchar({ length: 10 }),
	periodoExperiencia2Inicio: varchar({ length: 10 }),
	periodoExperiencia2Fim: varchar({ length: 10 }),
	saldoSalario: decimal({ precision: 12, scale: 2 }).default('0'),
	avisoPrevio: decimal({ precision: 12, scale: 2 }).default('0'),
	avisoPrevioDias: int().default(0),
	decimoTerceiroProporcional: decimal({ precision: 12, scale: 2 }).default('0'),
	decimoTerceiroMeses: int().default(0),
	feriasProporcionais: decimal({ precision: 12, scale: 2 }).default('0'),
	feriasMeses: int().default(0),
	tercoConstitucional: decimal({ precision: 12, scale: 2 }).default('0'),
	feriasVencidas: decimal({ precision: 12, scale: 2 }).default('0'),
	fgtsDepositado: decimal({ precision: 12, scale: 2 }).default('0'),
	multaFgts: decimal({ precision: 12, scale: 2 }).default('0'),
	multaFgtsPercentual: decimal({ precision: 5, scale: 2 }).default('0'),
	totalProventos: decimal({ precision: 12, scale: 2 }).default('0'),
	totalDescontos: decimal({ precision: 12, scale: 2 }).default('0'),
	totalLiquido: decimal({ precision: 12, scale: 2 }).default('0'),
	observacao: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const respostasClima = mysqlTable("respostas_clima", {
	id: int().autoincrement().notNull(),
	pesquisaId: int().notNull(),
	perguntaId: int().notNull(),
	respondentId: int(),
	valorEscala: int(),
	valorTexto: text(),
	valorOpcao: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const senhaHistorico = mysqlTable("senha_historico", {
	id: int().autoincrement().notNull(),
	senhaAutorizacaoId: int().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }).notNull(),
	acao: mysqlEnum(['criado','atualizado','revogado','reativado','transferido','senha_alterada']).notNull(),
	detalhes: text(),
	realizadoPorId: int(),
	realizadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const senhasAutorizacoes = mysqlTable("senhas_autorizacoes", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }).notNull(),
	tipoSenhaAuth: mysqlEnum('tipoSenhaAuth', ['email','computador','celular','alarme_escritorio','sistema_interno','vpn','wifi','cofre','chave_empresa','chave_sala','chave_armario','veiculo_empresa','estacionamento','cartao_acesso','biometria','outro']).notNull(),
	descricao: varchar({ length: 500 }),
	possuiSenha: tinyint().default(0),
	senhaValor: varchar({ length: 500 }),
	senhaObs: text(),
	tipoUso: mysqlEnum('tipoUsoSenha', ['individual','comum','compartilhado']).default('individual').notNull(),
	colaboradoresVinculados: json('colaboradoresVinculadosSenha').$type<{id: number; nome: string}[]>(),
	autorizado: tinyint().default(0),
	dataAutorizacao: varchar({ length: 10 }),
	dataRevogacao: varchar({ length: 10 }),
	autorizadoPorId: int(),
	autorizadoPorNome: varchar({ length: 255 }),
	identificador: varchar({ length: 255 }),
	statusSenhaAuth: mysqlEnum('statusSenhaAuth', ['ativo','revogado','expirado','pendente']).default('ativo').notNull(),
	observacoes: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const servicoEtapas = mysqlTable("servico_etapas", {
	id: int().autoincrement().notNull(),
	servicoId: int().notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	descricao: text(),
	setorResponsavelId: int(),
	ordem: int().default(0).notNull(),
	slaHoras: int(),
	obrigatoria: tinyint().default(1).notNull(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const servicos = mysqlTable("servicos", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 500 }).notNull(),
	descricao: text(),
	setorId: int(),
	percentualHonorariosComercial: decimal({ precision: 5, scale: 2 }).default('0'),
	formaCobrancaHonorarios: mysqlEnum(['percentual_credito','valor_fixo','mensalidade','exito','hibrido','entrada_exito','valor_fixo_parcelado']).default('percentual_credito').notNull(),
	valorFixo: decimal({ precision: 15, scale: 2 }),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	setoresIds: json(),
	responsaveisIds: json(),
	comissaoPadraoDiamante: decimal({ precision: 5, scale: 2 }),
	comissaoPadraoOuro: decimal({ precision: 5, scale: 2 }),
	comissaoPadraoPrata: decimal({ precision: 5, scale: 2 }),
	percentualHonorariosCliente: decimal({ precision: 5, scale: 2 }).default('0'),
	valorEntrada: decimal({ precision: 15, scale: 2 }),
	percentualExito: decimal({ precision: 5, scale: 2 }),
	quantidadeParcelas: int(),
	valorParcela: decimal({ precision: 15, scale: 2 }),
});

export const setorConfig = mysqlTable("setor_config", {
	id: int().autoincrement().notNull(),
	setorId: int().notNull(),
	sigla: varchar({ length: 10 }).notNull(),
	submenus: json(),
	workflowStatuses: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const setores = mysqlTable("setores", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	descricao: text(),
	cor: varchar({ length: 7 }).default('#3B82F6'),
	icone: varchar({ length: 50 }).default('Building2'),
	setorPaiId: int(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const slaConfiguracoes = mysqlTable("sla_configuracoes", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	descricao: text(),
	setorId: int(),
	slaHoras: int().notNull(),
	prioridade: mysqlEnum(['urgente','alta','media','baixa']).default('media'),
	ativo: tinyint().default(1).notNull(),
	criadoPorId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const solicitacoesFolga = mysqlTable("solicitacoes_folga", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	tipo: mysqlEnum(['ferias','folga','abono','compensacao']).notNull(),
	dataInicio: varchar({ length: 10 }).notNull(),
	dataFim: varchar({ length: 10 }).notNull(),
	diasSolicitados: int().notNull(),
	motivo: text(),
	status: mysqlEnum(['pendente','aprovada','recusada']).default('pendente').notNull(),
	aprovadorRhId: int(),
	aprovadorRhStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorRhEm: timestamp({ mode: 'string' }),
	aprovadorChefeId: int(),
	aprovadorChefeStatus: mysqlEnum(['pendente','aprovado','recusado']).default('pendente'),
	aprovadorChefeEm: timestamp({ mode: 'string' }),
	justificativaRecusa: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const tarefaComentarios = mysqlTable("tarefa_comentarios", {
	id: int().autoincrement().notNull(),
	tarefaId: int().notNull(),
	autorId: int().notNull(),
	autorNome: varchar({ length: 255 }).notNull(),
	conteudo: text().notNull(),
	mencoes: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const tarefas = mysqlTable("tarefas", {
	id: int().autoincrement().notNull(),
	codigo: varchar({ length: 20 }).notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	descricao: text(),
	tipo: mysqlEnum(['tarefa','bug','melhoria','reuniao','documento','outro']).default('tarefa').notNull(),
	status: mysqlEnum(['backlog','a_fazer','em_andamento','revisao','concluido','cancelado']).default('a_fazer').notNull(),
	prioridade: mysqlEnum(['urgente','alta','media','baixa']).default('media').notNull(),
	setorId: int(),
	responsavelId: int(),
	criadorId: int(),
	clienteId: int(),
	tarefaPaiId: int(),
	dataInicio: timestamp({ mode: 'string' }),
	dataVencimento: timestamp({ mode: 'string' }),
	dataConclusao: timestamp({ mode: 'string' }),
	slaHoras: int(),
	slaStatus: mysqlEnum(['dentro_prazo','atencao','vencido']).default('dentro_prazo'),
	tags: json(),
	setoresEnvolvidos: json(),
	estimativaHoras: decimal({ precision: 6, scale: 1 }),
	horasGastas: decimal({ precision: 6, scale: 1 }).default('0'),
	progresso: int().default(0),
	ordem: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const tarefasSetor = mysqlTable("tarefas_setor", {
	id: int().autoincrement().notNull(),
	setorId: int().notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	descricao: text(),
	responsavelId: int(),
	responsavelNome: varchar({ length: 255 }),
	prioridade: mysqlEnum(['baixa','media','alta','urgente']).default('media').notNull(),
	status: mysqlEnum(['a_fazer','em_andamento','concluida','cancelada']).default('a_fazer').notNull(),
	dataInicio: varchar({ length: 10 }),
	dataFim: varchar({ length: 10 }),
	dataConclusao: varchar({ length: 10 }),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	observacao: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const teses = mysqlTable("teses", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 500 }).notNull(),
	tributoEnvolvido: varchar({ length: 100 }).notNull(),
	tipo: mysqlEnum(['exclusao_base','credito_presumido','recuperacao_indebito','tese_judicial','tese_administrativa']).notNull(),
	classificacao: mysqlEnum(['pacificada','judicial','administrativa','controversa']).notNull(),
	potencialFinanceiro: mysqlEnum(['muito_alto','alto','medio','baixo']).notNull(),
	potencialMercadologico: mysqlEnum(['muito_alto','alto','medio','baixo']).notNull(),
	requisitosObjetivos: json(),
	requisitosImpeditivos: json(),
	fundamentacaoLegal: text(),
	jurisprudenciaRelevante: text(),
	parecerTecnicoJuridico: text(),
	prazoPrescricional: varchar({ length: 50 }),
	necessidadeAcaoJudicial: tinyint().default(0).notNull(),
	viaAdministrativa: tinyint().default(0).notNull(),
	grauRisco: mysqlEnum(['baixo','medio','alto']).notNull(),
	documentosNecessarios: json(),
	formulaEstimativaCredito: text(),
	aplicavelComercio: tinyint().default(0).notNull(),
	aplicavelIndustria: tinyint().default(0).notNull(),
	aplicavelServico: tinyint().default(0).notNull(),
	aplicavelContribuinteIcms: tinyint().default(0).notNull(),
	aplicavelContribuinteIpi: tinyint().default(0).notNull(),
	aplicavelLucroReal: tinyint().default(0).notNull(),
	aplicavelLucroPresumido: tinyint().default(0).notNull(),
	aplicavelSimplesNacional: tinyint().default(0).notNull(),
	slaApuracaoDias: int().default(15), // SLA em dias para apuração desta tese
	versao: int().default(1).notNull(),
	ativa: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const userHistory = mysqlTable("user_history", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	acao: mysqlEnum(['criacao','edicao','ativacao','inativacao','exclusao']).notNull(),
	campo: varchar({ length: 255 }),
	valorAnterior: text(),
	valorNovo: text(),
	realizadoPorId: int(),
	realizadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const userPresence = mysqlTable("user_presence", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	userName: varchar({ length: 255 }).notNull(),
	userAvatar: varchar({ length: 500 }),
	lastSeen: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	status: mysqlEnum(['online','away','offline']).default('online').notNull(),
},
(table) => [
	index("unique_user").on(table.userId),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	apelido: varchar({ length: 100 }),
	email: varchar({ length: 320 }),
	cpf: varchar({ length: 14 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	nivelAcesso: mysqlEnum(['diretor','gerente','coordenador','supervisor','analista_fiscal']).default('analista_fiscal').notNull(),
	ativo: tinyint().default(1).notNull(),
	cargo: varchar({ length: 255 }),
	telefone: varchar({ length: 20 }),
	avatar: varchar({ length: 500 }),
	setorPrincipalId: int(),
	supervisorId: int(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const usuarioSetores = mysqlTable("usuario_setores", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	setorId: int().notNull(),
	papelNoSetor: mysqlEnum(['responsavel','membro','observador']).default('membro').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const valeTransporte = mysqlTable("vale_transporte", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 255 }).notNull(),
	mesReferencia: int().notNull(),
	anoReferencia: int().notNull(),
	diasUteis: int().notNull(),
	passagensPorDia: int().default(2).notNull(),
	valorPassagem: decimal({ precision: 8, scale: 2 }).notNull(),
	cidadePassagem: mysqlEnum(['sp','barueri']).default('sp').notNull(),
	valorTotal: decimal({ precision: 12, scale: 2 }).notNull(),
	descontoFolha: decimal({ precision: 12, scale: 2 }).default('0'),
	observacao: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const workflowRenovacaoContrato = mysqlTable("workflow_renovacao_contrato", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }).notNull(),
	cargo: varchar({ length: 255 }).notNull(),
	dataVencimento: varchar({ length: 10 }).notNull(),
	diasRestantes: int().notNull(),
	tarefaId: int(),
	criadoPorId: int().notNull(),
	status: mysqlEnum(['pendente','resolvido','cancelado']).default('pendente').notNull(),
	decisao: mysqlEnum(['renovar','desligar','converter_clt']),
	observacao: text(),
	resolvidoEm: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const termosResponsabilidade = mysqlTable("termos_responsabilidade", {
	id: int().autoincrement().notNull(),
	equipamentoId: int().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }).notNull(),
	tipoTermo: mysqlEnum('tipoTermo', ['entrega','devolucao']).notNull(),
	dataEvento: varchar({ length: 10 }).notNull(),
	equipamentoDescricao: text(),
	equipamentoTipo: varchar({ length: 100 }),
	equipamentoMarca: varchar({ length: 255 }),
	equipamentoModelo: varchar({ length: 255 }),
	equipamentoPatrimonio: varchar({ length: 100 }),
	equipamentoNumeroSerie: varchar({ length: 255 }),
	condicoesEquipamento: mysqlEnum('condicoesEquipamento', ['novo','bom','regular','ruim','defeituoso']).default('bom'),
	observacoes: text(),
	assinaturaColaboradorUrl: text(),
	assinaturaResponsavelUrl: text(),
	termoAceito: tinyint().default(0),
	motivoDevolucao: mysqlEnum('motivoDevolucao', ['desligamento','troca','manutencao','ferias','licenca','outro']),
	motivoOutro: varchar({ length: 500 }),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});


// ===== CONVENÇÃO COLETIVA DE TRABALHO (CCT) =====
export const convencaoColetiva = mysqlTable("convencao_coletiva", {
	id: int().autoincrement().primaryKey().notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	sindicato: varchar({ length: 500 }),
	vigenciaInicio: varchar({ length: 10 }).notNull(),
	vigenciaFim: varchar({ length: 10 }).notNull(),
	dataBase: varchar({ length: 10 }),
	status: mysqlEnum('cctStatus', ['vigente','vencida','pendente']).default('vigente').notNull(),
	arquivoPdfUrl: text(),
	arquivoPdfNome: varchar({ length: 500 }),
	anexosJson: text(),
	resumoLlm: text(),
	clausulasJson: text(),
	regrasFeriasJson: text(),
	regrasJornadaJson: text(),
	regrasSalarioJson: text(),
	regrasBeneficiosJson: text(),
	regrasRescisaoJson: text(),
	observacoes: text(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});


// ---- HISTÓRICO DE SIMULAÇÕES DE RESCISÃO (AUDITORIA) ----
export const rescisaoAuditoria = mysqlTable("rescisao_auditoria", {
	id: int().autoincrement().notNull(),
	colaboradorId: int().notNull(),
	colaboradorNome: varchar({ length: 500 }).notNull(),
	cargo: varchar({ length: 255 }),
	salarioBase: decimal({ precision: 12, scale: 2 }).notNull(),
	dataDesligamento: varchar({ length: 10 }).notNull(),
	tipoDesligamento: mysqlEnum(['sem_justa_causa','justa_causa','pedido_demissao','termino_experiencia_1','termino_experiencia_2','acordo_mutuo']).notNull(),
	resultadoJson: text().notNull(), // JSON com todos os valores calculados
	acao: mysqlEnum(['simulado','descartado','salvo']).notNull(),
	simuladoPorId: int(),
	simuladoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

// ============================================================
// Ocorrências e Plano de Reversão
// ============================================================

export const ocorrencias = mysqlTable("ocorrencias", {
  id: int().autoincrement().notNull(),
  colaboradorId: int().notNull(),
  colaboradorNome: varchar({ length: 255 }).notNull(),
  cargo: varchar({ length: 255 }),
  setor: varchar({ length: 255 }),
  tipo: mysqlEnum('tipo', ['falta_injustificada','atraso_frequente','falta_leve','falta_media','falta_grave','falta_gravissima','erro_trabalho','conduta_inapropriada','conflito_interno']).notNull(),
  gravidade: mysqlEnum('gravidade', ['leve','media','grave','gravissima']).notNull(),
  classificacao: mysqlEnum('classificacao', ['reversivel','irreversivel']).notNull(),
  recomendacao: mysqlEnum('recomendacao', ['advertencia','suspensao','reversao','desligamento']).notNull(),
  descricao: text().notNull(),
  dataOcorrencia: varchar({ length: 10 }).notNull(),
  evidencias: text(),
  testemunhas: text(),
  medidasTomadas: text(),
  status: mysqlEnum('status', ['registrada','em_analise','resolvida','encaminhada_reversao','encaminhada_desligamento']).default('registrada').notNull(),
  registradoPorId: int(),
  registradoPorNome: varchar({ length: 255 }).notNull(),
  planoReversaoId: int(),
  aprovacaoNecessaria: tinyint().default(0).notNull(),
  aprovacaoStatus: mysqlEnum('aprovacaoStatus', ['pendente','aprovada','rejeitada']).default('pendente'),
  aprovadoPorId: int(),
  aprovadoPorNome: varchar({ length: 255 }),
  aprovadoEm: bigint({ mode: "number" }),
  custoRescisaoEstimado: decimal({ precision: 12, scale: 2 }),
  createdAt: bigint({ mode: "number" }).notNull(),
  updatedAt: bigint({ mode: "number" }).notNull(),
});

export const planoReversao = mysqlTable("plano_reversao", {
  id: int().autoincrement().notNull(),
  colaboradorId: int().notNull(),
  colaboradorNome: varchar({ length: 255 }).notNull(),
  cargo: varchar({ length: 255 }),
  setor: varchar({ length: 255 }),
  status: mysqlEnum('status', ['ativo','concluido_sucesso','concluido_fracasso','cancelado']).default('ativo').notNull(),
  motivo: text().notNull(),
  objetivos: text().notNull(),
  dataInicio: varchar({ length: 10 }).notNull(),
  dataFim: varchar({ length: 10 }).notNull(),
  responsavel: varchar({ length: 255 }).notNull(),
  coResponsavel: varchar({ length: 255 }),
  frequenciaAcompanhamento: mysqlEnum('frequenciaAcompanhamento', ['semanal','quinzenal','mensal']).default('quinzenal').notNull(),
  observacoes: text(),
  resultadoFinal: text(),
  criadoPorId: int(),
  criadoPorNome: varchar({ length: 255 }).notNull(),
  createdAt: bigint({ mode: "number" }).notNull(),
  updatedAt: bigint({ mode: "number" }).notNull(),
});

export const planoReversaoEtapas = mysqlTable("plano_reversao_etapas", {
  id: int().autoincrement().notNull(),
  planoId: int().notNull(),
  tipo: mysqlEnum('tipo', ['feedback_inicial','meta','acompanhamento','avaliacao_final']).default('meta').notNull(),
  titulo: varchar({ length: 255 }).notNull(),
  descricao: text(),
  dataPrevista: varchar({ length: 10 }).notNull(),
  dataConclusao: varchar({ length: 10 }),
  status: mysqlEnum('status', ['pendente','em_andamento','concluida','atrasada']).default('pendente').notNull(),
  responsavel: varchar({ length: 255 }),
  observacoes: text(),
  createdAt: bigint({ mode: "number" }).notNull(),
  updatedAt: bigint({ mode: "number" }).notNull(),
});

export const planoReversaoFeedbacks = mysqlTable("plano_reversao_feedbacks", {
  id: int().autoincrement().notNull(),
  planoId: int().notNull(),
  etapaId: int(),
  dataFeedback: varchar({ length: 10 }).notNull(),
  tipo: mysqlEnum('tipo', ['positivo','neutro','negativo','alerta']).default('neutro').notNull(),
  descricao: text().notNull(),
  evolucao: mysqlEnum('evolucao', ['melhorou','estavel','piorou']),
  registradoPorId: int(),
  registradoPorNome: varchar({ length: 255 }).notNull(),
  createdAt: bigint({ mode: "number" }).notNull(),
});


export const ocorrenciaTimeline = mysqlTable("ocorrencia_timeline", {
  id: int().autoincrement().notNull(),
  ocorrenciaId: int().notNull(),
  tipo: mysqlEnum('tipo', ['registro','alteracao_status','aprovacao_solicitada','aprovacao_aprovada','aprovacao_rejeitada','plano_criado','feedback_adicionado','assinatura_colaborador','assinatura_gestor','medida_aplicada','observacao']).notNull(),
  titulo: varchar({ length: 255 }).notNull(),
  descricao: text(),
  executadoPorId: int(),
  executadoPorNome: varchar({ length: 255 }).notNull(),
  metadata: text(),
  createdAt: bigint({ mode: "number" }).notNull(),
});

export const ocorrenciaAssinaturas = mysqlTable("ocorrencia_assinaturas", {
  id: int().autoincrement().notNull(),
  ocorrenciaId: int(),
  planoReversaoId: int(),
  tipo: mysqlEnum('tipo', ['ciencia_colaborador','ciencia_gestor','ciencia_rh','concordancia_plano']).notNull(),
  assinanteName: varchar({ length: 255 }).notNull(),
  assinanteId: int(),
  assinanteCargo: varchar({ length: 255 }),
  ipAddress: varchar({ length: 45 }),
  observacao: text(),
  assinadoEm: bigint({ mode: "number" }).notNull(),
  createdAt: bigint({ mode: "number" }).notNull(),
});


// ===== BIBLIOTECA EVOX =====

export const bibLivros = mysqlTable("bib_livros", {
  id: int().autoincrement().notNull(),
  titulo: varchar({ length: 500 }).notNull(),
  subtitulo: varchar({ length: 500 }),
  autores: varchar({ length: 1000 }).notNull(),
  editora: varchar({ length: 255 }),
  edicao: varchar({ length: 50 }),
  ano: int(),
  isbn: varchar({ length: 20 }),
  idioma: varchar({ length: 50 }).default('Português'),
  categoria: varchar({ length: 100 }),
  subcategoria: varchar({ length: 100 }),
  tags: json(),
  sinopse: text(),
  capaUrl: varchar({ length: 1000 }),
  capaFileKey: varchar({ length: 500 }),
  linkReferencia: varchar({ length: 1000 }),
  classificacao: mysqlEnum(['essencial','recomendado','avancado']).default('recomendado'),
  areaSugerida: varchar({ length: 100 }),
  status: mysqlEnum(['ativo','inativo','descontinuado']).default('ativo').notNull(),
  registradoPorId: int(),
  registradoPorNome: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("idx_bib_livros_isbn").on(table.isbn),
  index("idx_bib_livros_categoria").on(table.categoria),
  index("idx_bib_livros_status").on(table.status),
]);

export const bibExemplares = mysqlTable("bib_exemplares", {
  id: int().autoincrement().notNull(),
  livroId: int().notNull(),
  codigoPatrimonial: varchar({ length: 50 }).notNull(),
  localizacao: varchar({ length: 255 }),
  condicao: mysqlEnum(['novo','bom','regular','danificado']).default('novo').notNull(),
  dataEntrada: varchar({ length: 10 }),
  origem: mysqlEnum(['aquisicao','doacao']).default('aquisicao').notNull(),
  fornecedorId: int(),
  dataCompra: varchar({ length: 10 }),
  valorCompra: decimal({ precision: 10, scale: 2 }),
  doadorTipo: mysqlEnum(['colaborador','parceiro','cliente','pessoa_fisica']),
  doadorNome: varchar({ length: 255 }),
  dataDoacao: varchar({ length: 10 }),
  status: mysqlEnum(['disponivel','emprestado','reservado','indisponivel','perdido','baixado']).default('disponivel').notNull(),
  motivoBaixa: text(),
  observacoes: text(),
  registradoPorId: int(),
  registradoPorNome: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("idx_bib_exemplares_livro").on(table.livroId),
  index("idx_bib_exemplares_status").on(table.status),
  index("idx_bib_exemplares_codigo").on(table.codigoPatrimonial),
]);

export const bibEmprestimos = mysqlTable("bib_emprestimos", {
  id: int().autoincrement().notNull(),
  exemplarId: int().notNull(),
  livroId: int().notNull(),
  colaboradorId: int().notNull(),
  colaboradorNome: varchar({ length: 255 }).notNull(),
  dataRetirada: varchar({ length: 10 }).notNull(),
  dataPrevistaDevolucao: varchar({ length: 10 }).notNull(),
  dataEfetivaDevolucao: varchar({ length: 10 }),
  status: mysqlEnum(['ativo','devolvido','atrasado','cancelado','em_disputa']).default('ativo').notNull(),
  renovacoes: int().default(0).notNull(),
  limiteRenovacoes: int().default(2).notNull(),
  termoAceito: tinyint().default(0).notNull(),
  checklistRetirada: json(),
  checklistDevolucao: json(),
  multaValor: decimal({ precision: 10, scale: 2 }),
  penalidade: varchar({ length: 255 }),
  observacoes: text(),
  assinaturaColaboradorUrl: text(),
  assinaturaBibliotecarioUrl: text(),
  termoPdfUrl: text(),
  termoEnviadoEmail: tinyint().default(0).notNull(),
  registradoPorId: int(),
  registradoPorNome: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("idx_bib_emprestimos_exemplar").on(table.exemplarId),
  index("idx_bib_emprestimos_colab").on(table.colaboradorId),
  index("idx_bib_emprestimos_status").on(table.status),
]);

export const bibReservas = mysqlTable("bib_reservas", {
  id: int().autoincrement().notNull(),
  livroId: int().notNull(),
  exemplarId: int(),
  colaboradorId: int().notNull(),
  colaboradorNome: varchar({ length: 255 }).notNull(),
  dataReserva: varchar({ length: 10 }).notNull(),
  posicaoFila: int().default(1).notNull(),
  prazoRetirada: int().default(3).notNull(),
  status: mysqlEnum(['ativa','atendida','expirada','cancelada']).default('ativa').notNull(),
  dataDisponibilidade: varchar({ length: 10 }),
  dataAtendimento: varchar({ length: 10 }),
  observacoes: text(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("idx_bib_reservas_livro").on(table.livroId),
  index("idx_bib_reservas_colab").on(table.colaboradorId),
  index("idx_bib_reservas_status").on(table.status),
]);

export const bibOcorrencias = mysqlTable("bib_ocorrencias", {
  id: int().autoincrement().notNull(),
  tipo: mysqlEnum(['atraso_recorrente','devolvido_danificado','extravio_perda','divergencia_condicao','ajuste_manual']).notNull(),
  emprestimoId: int(),
  exemplarId: int(),
  colaboradorId: int(),
  colaboradorNome: varchar({ length: 255 }),
  descricao: text().notNull(),
  evidenciaUrl: varchar({ length: 1000 }),
  evidenciaFileKey: varchar({ length: 500 }),
  acaoAplicada: mysqlEnum(['bloqueio','advertencia','reposicao','baixa','nenhuma']).default('nenhuma'),
  diasBloqueio: int(),
  responsavelId: int(),
  responsavelNome: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("idx_bib_ocorrencias_emprestimo").on(table.emprestimoId),
  index("idx_bib_ocorrencias_colab").on(table.colaboradorId),
]);

export const bibFornecedoresDoadores = mysqlTable("bib_fornecedores_doadores", {
  id: int().autoincrement().notNull(),
  nome: varchar({ length: 255 }).notNull(),
  tipo: mysqlEnum(['fornecedor','doador','ambos']).default('fornecedor').notNull(),
  contato: varchar({ length: 255 }),
  email: varchar({ length: 320 }),
  telefone: varchar({ length: 20 }),
  observacoes: text(),
  ativo: tinyint().default(1).notNull(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const bibPoliticas = mysqlTable("bib_politicas", {
  id: int().autoincrement().notNull(),
  chave: varchar({ length: 100 }).notNull(),
  valor: varchar({ length: 255 }).notNull(),
  descricao: text(),
  updatedPorId: int(),
  updatedPorNome: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("idx_bib_politicas_chave").on(table.chave),
]);

export const bibAuditoria = mysqlTable("bib_auditoria", {
  id: int().autoincrement().notNull(),
  acao: mysqlEnum(['criar','editar','excluir','emprestar','devolver','renovar','reservar','baixar','bloquear','desbloquear','ajuste_manual']).notNull(),
  entidadeTipo: varchar({ length: 50 }).notNull(),
  entidadeId: int(),
  entidadeNome: varchar({ length: 500 }),
  detalhes: json(),
  motivo: text(),
  usuarioId: int(),
  usuarioNome: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
  index("idx_bib_auditoria_entidade").on(table.entidadeTipo, table.entidadeId),
  index("idx_bib_auditoria_usuario").on(table.usuarioId),
]);

export const bibBloqueios = mysqlTable("bib_bloqueios", {
  id: int().autoincrement().notNull(),
  colaboradorId: int().notNull(),
  colaboradorNome: varchar({ length: 255 }).notNull(),
  motivo: text().notNull(),
  ocorrenciaId: int(),
  dataInicio: varchar({ length: 10 }).notNull(),
  dataFim: varchar({ length: 10 }),
  ativo: tinyint().default(1).notNull(),
  criadoPorId: int(),
  criadoPorNome: varchar({ length: 255 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
  index("idx_bib_bloqueios_colab").on(table.colaboradorId),
]);

// =====================================================
// MÓDULO: RECUPERAÇÃO DE CRÉDITOS TRIBUTÁRIOS
// =====================================================

// Demand Requests — entidade intermediária entre Parceiro/Suporte e as filas do Crédito
export const demandRequests = mysqlTable("demand_requests", {
	id: int().autoincrement().notNull(),
	numero: varchar({ length: 20 }).notNull(), // sequencial DR-0001
	origem: mysqlEnum(['parceiro','suporte','interno']).default('parceiro').notNull(),
	parceiroId: int(),
	clienteId: int(), // referência a clientes.id
	clienteCnpj: varchar({ length: 20 }),
	tipoDemanda: mysqlEnum(['apuracao','retificacao','compensacao','onboarding','chamado','outro']).notNull(),
	descricao: text(),
	anexos: json(), // [{url, nome, tipo}]
	urgencia: mysqlEnum(['normal','alta','urgente']).default('normal').notNull(),
	status: mysqlEnum(['triagem','classificada','roteada','cancelada']).default('triagem').notNull(),
	motivoCancelamento: text(),
	canceladoPorId: int(),
	canceladoEm: timestamp({ mode: 'string' }),
	classificadoPorId: int(),
	classificadoEm: timestamp({ mode: 'string' }),
	roteadoPorId: int(),
	roteadoEm: timestamp({ mode: 'string' }),
	filaDestino: mysqlEnum(['apuracao','retificacao','compensacao','onboarding','chamados']),
	tarefaCriadaId: int(), // referência à tarefa criada após roteamento
	caseCriadoId: int(), // referência ao case criado
	slaTriagemHoras: int().default(8), // 1 dia útil = 8h
	slaTriagemVenceEm: timestamp({ mode: 'string' }),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_dr_parceiro").on(table.parceiroId),
	index("idx_dr_cliente").on(table.clienteId),
	index("idx_dr_status").on(table.status),
	index("idx_dr_numero").on(table.numero),
]);

// Portfolio Migration Requests — conflito de carteira
export const portfolioMigrationRequests = mysqlTable("portfolio_migration_requests", {
	id: int().autoincrement().notNull(),
	solicitanteParceiroId: int().notNull(),
	cnpj: varchar({ length: 20 }).notNull(),
	clienteId: int(),
	parceiroAtualId: int(), // parceiro que já detém o CNPJ
	motivo: text().notNull(),
	evidencias: json(), // [{url, nome}]
	status: mysqlEnum(['pendente','aprovada','rejeitada']).default('pendente').notNull(),
	aprovadorId: int(),
	aprovadoEm: timestamp({ mode: 'string' }),
	observacaoAprovador: text(),
	criadoPorId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_pmr_cnpj").on(table.cnpj),
	index("idx_pmr_status").on(table.status),
]);

// Credit Cases — cases do Crédito com fases Oportunidade e Contratado
export const creditCases = mysqlTable("credit_cases", {
	id: int().autoincrement().notNull(),
	numero: varchar({ length: 20 }).notNull(), // CC-0001
	clienteId: int().notNull(),
	parceiroId: int(),
	tesesIds: json(), // [1, 2, 3] referências a teses
	fase: mysqlEnum(['oportunidade','contratado']).default('oportunidade').notNull(),
	status: varchar({ length: 50 }).default('nda_pendente').notNull(),
	// Oportunidade: nda_pendente, nda_assinado, em_apuracao, rti_emitido, aguardando_devolutiva, ganho, perdido
	// Contratado: contrato_assinado, onboarding_concluido, retificacao, compensacao, exito_registrado, cobranca_emitida, recebido, pos_venda
	responsavelId: int(),
	responsavelNome: varchar({ length: 255 }),
	valorEstimado: decimal({ precision: 15, scale: 2 }).default('0'),
	valorContratado: decimal({ precision: 15, scale: 2 }).default('0'),
	ndaUrl: varchar({ length: 1000 }),
	ndaAssinadoEm: timestamp({ mode: 'string' }),
	contratoUrl: varchar({ length: 1000 }),
	contratoAssinadoEm: timestamp({ mode: 'string' }),
	onboardingConcluidoEm: timestamp({ mode: 'string' }),
	exitoRegistradoEm: timestamp({ mode: 'string' }),
	observacoes: text(),
	demandRequestId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_cc_cliente").on(table.clienteId),
	index("idx_cc_parceiro").on(table.parceiroId),
	index("idx_cc_fase").on(table.fase),
	index("idx_cc_status").on(table.status),
	index("idx_cc_numero").on(table.numero),
]);

// RTI Reports — Relatório Técnico de Indicação
export const rtiReports = mysqlTable("rti_reports", {
	id: int().autoincrement().notNull(),
	caseId: int().notNull(),
	clienteId: int().notNull(),
	taskId: int(),
	numero: varchar({ length: 20 }).notNull(), // RTI-0001
	versao: int().default(1).notNull(),
	// Campos estruturados do RTI
	tesesAnalisadas: json(), // [{teseId, nome, tributo, valorEstimado, periodoInicio, periodoFim, fundamentacao}]
	valorTotalEstimado: decimal({ precision: 15, scale: 2 }).default('0'),
	periodoAnalise: varchar({ length: 100 }),
	resumoExecutivo: text(),
	metodologia: text(),
	conclusao: text(),
	observacoes: text(),
	// PDF
	pdfUrl: varchar({ length: 1000 }),
	pdfHash: varchar({ length: 64 }),
	status: mysqlEnum(['rascunho','emitido','revisado']).default('rascunho').notNull(),
	emitidoPorId: int(),
	emitidoPorNome: varchar({ length: 255 }),
	emitidoEm: timestamp({ mode: 'string' }),
	// SLA devolutiva
	slaDevolutivaDias: int().default(7),
	slaDevolutivaVenceEm: timestamp({ mode: 'string' }),
	devolutivaRecebidaEm: timestamp({ mode: 'string' }),
	devolutivaStatus: mysqlEnum(['pendente','recebida','expirada']).default('pendente'),
	devolutivaObservacao: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_rti_case").on(table.caseId),
	index("idx_rti_cliente").on(table.clienteId),
	index("idx_rti_numero").on(table.numero),
]);

// Credit Tasks — tarefas nas filas do Crédito
export const creditTasks = mysqlTable("credit_tasks", {
	id: int().autoincrement().notNull(),
	codigo: varchar({ length: 20 }).notNull(), // CT-0001
	fila: mysqlEnum(['apuracao','retificacao','compensacao','ressarcimento','restituicao','revisao','onboarding','chamados']).notNull(),
	caseId: int(),
	clienteId: int(),
	demandRequestId: int(),
	titulo: varchar({ length: 500 }).notNull(),
	descricao: text(),
	status: mysqlEnum(['a_fazer','fazendo','feito','concluido']).default('a_fazer').notNull(),
	prioridade: mysqlEnum(['urgente','alta','media','baixa']).default('media').notNull(),
	ordem: int().default(0).notNull(),
	responsavelId: int(),
	responsavelNome: varchar({ length: 255 }),
	dataVencimento: timestamp({ mode: 'string' }),
	dataConclusao: timestamp({ mode: 'string' }),
	slaHoras: int(),
	slaStatus: mysqlEnum(['dentro_prazo','atencao','vencido']).default('dentro_prazo'),
	anexos: json(),
	observacoes: text(),
	viabilidade: mysqlEnum(['viavel','inviavel']),
		valorGlobalApurado: decimal({ precision: 14, scale: 2 }),
		reaberta: boolean().default(false),
		reaberturaMotivoLog: json(),
		criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_ct_fila").on(table.fila),
	index("idx_ct_case").on(table.caseId),
	index("idx_ct_cliente").on(table.clienteId),
	index("idx_ct_status").on(table.status),
]);

// Credit Tickets — tickets separados do chat
export const creditTickets = mysqlTable("credit_tickets", {
	id: int().autoincrement().notNull(),
	numero: varchar({ length: 20 }).notNull(), // TK-0001
	caseId: int(),
	clienteId: int().notNull(),
	parceiroId: int(),
	tipo: mysqlEnum(['pendencia_cliente','exigencia_rfb','contestacao_saldo','solicitacao_contencioso','solicitacao_financeiro','outros']).notNull(),
	titulo: varchar({ length: 500 }).notNull(),
	descricao: text(),
	status: mysqlEnum(['aberto','em_andamento','aguardando_cliente','resolvido','cancelado']).default('aberto').notNull(),
	prioridade: mysqlEnum(['urgente','alta','media','baixa']).default('media').notNull(),
	responsavelId: int(),
	responsavelNome: varchar({ length: 255 }),
	dataVencimento: timestamp({ mode: 'string' }),
	dataResolucao: timestamp({ mode: 'string' }),
	resolucao: text(),
	anexos: json(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tk_case").on(table.caseId),
	index("idx_tk_cliente").on(table.clienteId),
	index("idx_tk_status").on(table.status),
	index("idx_tk_numero").on(table.numero),
]);

// Credit Compensation Groups — grupos de compensação (INSS, PIS/COFINS, IRPJ/CSLL)
export const creditCompensationGroups = mysqlTable("credit_compensation_groups", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 100 }).notNull(),
	sigla: varchar({ length: 20 }).notNull(),
	descricao: text(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

// Credit Ledger — saldo de créditos por cliente/tese/período
export const creditLedger = mysqlTable("credit_ledger", {
	id: int().autoincrement().notNull(),
	caseId: int().notNull(),
	clienteId: int().notNull(),
	teseId: int(),
	teseNome: varchar({ length: 500 }),
	compensationGroupId: int(), // referência a credit_compensation_groups
	compensationGroupNome: varchar({ length: 100 }),
	periodoInicio: varchar({ length: 10 }), // MM/YYYY
	periodoFim: varchar({ length: 10 }),
	valorEstimado: decimal({ precision: 15, scale: 2 }).default('0'),
	valorValidado: decimal({ precision: 15, scale: 2 }).default('0'),
	valorRetificado: decimal({ precision: 15, scale: 2 }).default('0'),
	valorProtocolado: decimal({ precision: 15, scale: 2 }).default('0'),
	valorEfetivado: decimal({ precision: 15, scale: 2 }).default('0'), // compensado/restituído/ressarcido
	saldoResidual: decimal({ precision: 15, scale: 2 }).default('0'),
	saldoDisponivel: decimal({ precision: 15, scale: 2 }).default('0'),
	saldoUtilizado: decimal({ precision: 15, scale: 2 }).default('0'),
	grupoDebito: varchar({ length: 50 }), // INSS/PREVIDENCIARIOS, PIS/COFINS, IRPJ/CSLL
	dataPrescricao: timestamp({ mode: 'string' }),
	alertaPrescricao: tinyint().default(0),
	tipoEfetivacao: mysqlEnum(['compensacao','restituicao','ressarcimento']),
	status: mysqlEnum(['estimado','validado','protocolado','efetivado','parcial','cancelado']).default('estimado').notNull(),
	observacoes: text(),
	atualizadoPorId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_cl_case").on(table.caseId),
	index("idx_cl_cliente").on(table.clienteId),
	index("idx_cl_group").on(table.compensationGroupId),
]);

// Due Schedule Policies — políticas de vencimento de guias (admin configurável)
export const dueSchedulePolicies = mysqlTable("due_schedule_policies", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	compensationGroupId: int(),
	compensationGroupNome: varchar({ length: 100 }),
	frequencia: mysqlEnum(['mensal','trimestral','anual']).default('mensal').notNull(),
	diaVencimento: int(), // dia do mês (ex: 25 para PIS/COFINS)
	mesesVencimento: json(), // para trimestral: [4,7,10,1] (abril, julho, outubro, janeiro)
	antecedenciaInternaDiasUteis: int().default(5),
	antecedenciaCriacaoTarefaDias: int().default(10), // criar tarefa X dias antes
	ativo: tinyint().default(1).notNull(),
	criadoPorId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Client Due Policy Subscriptions — assinatura de política por cliente/case
export const clientDuePolicySubscriptions = mysqlTable("client_due_policy_subs", {
	id: int().autoincrement().notNull(),
	clienteId: int().notNull(),
	caseId: int(),
	policyId: int().notNull(),
	ativo: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_cdps_cliente").on(table.clienteId),
	index("idx_cdps_policy").on(table.policyId),
]);

// Success Events — eventos de êxito
export const successEvents = mysqlTable("success_events", {
	id: int().autoincrement().notNull(),
	caseId: int().notNull(),
	clienteId: int().notNull(),
	ledgerEntryId: int(), // referência ao credit_ledger
	tipo: mysqlEnum(['compensacao','restituicao','ressarcimento']).notNull(),
	valor: decimal({ precision: 15, scale: 2 }).notNull(),
	dataEfetivacao: timestamp({ mode: 'string' }).notNull(),
	descricao: text(),
	// Gatilho financeiro (stub)
	faturamentoGerado: tinyint().default(0),
	faturamentoId: int(),
	comissaoGerada: tinyint().default(0),
	comissaoId: int(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_se_case").on(table.caseId),
	index("idx_se_cliente").on(table.clienteId),
]);

// Credit Audit Log — auditoria e histórico imutável
export const creditAuditLog = mysqlTable("credit_audit_log", {
	id: int().autoincrement().notNull(),
	entidade: mysqlEnum(['demand_request','case','rti','task','ticket','ledger','policy','migration','sla','exito','partner_return','onboarding']).notNull(),
	entidadeId: int().notNull(),
	acao: varchar({ length: 100 }).notNull(), // ex: 'rti_emitido', 'status_alterado', 'roteamento', 'cancelamento', 'exito_registrado'
	descricao: text(),
	dadosAnteriores: json(),
	dadosNovos: json(),
	usuarioId: int(),
	usuarioNome: varchar({ length: 255 }),
	ip: varchar({ length: 45 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_cal_entidade").on(table.entidade, table.entidadeId),
	index("idx_cal_acao").on(table.acao),
	index("idx_cal_created").on(table.createdAt),
]);

// SLA Configs — SLAs editáveis por administrador
export const creditSlaConfigs = mysqlTable("credit_sla_configs", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	categoria: mysqlEnum(['triagem','fila','ticket','case','rti_devolutiva','vencimento_guia']).notNull(),
	fila: varchar({ length: 50 }), // apuracao, retificacao, etc.
	tipoTarefa: varchar({ length: 50 }),
	tipoTicket: varchar({ length: 50 }),
	statusCase: varchar({ length: 50 }),
	slaHoras: int(), // para SLAs baseados em horas
	slaDias: int(), // para SLAs baseados em dias
	slaDiasUteis: tinyint().default(1), // 1 = dias úteis, 0 = corridos
	alertaDias: json(), // [3, 6] dias para alertas
	escalonamentoDias: int(), // dia para escalonamento
	ativo: tinyint().default(1).notNull(),
	criadoPorId: int(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

// Ticket Messages — mensagens dentro de tickets
export const creditTicketMessages = mysqlTable("credit_ticket_messages", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull(),
	mensagem: text().notNull(),
	anexos: json(),
	autorId: int(),
	autorNome: varchar({ length: 255 }),
	interno: tinyint().default(0).notNull(), // 1 = nota interna, 0 = visível ao parceiro
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_ctm_ticket").on(table.ticketId),
]);


// ===== V84 — REESTRUTURAÇÃO CRÉDITO =====

// Checklist Templates — templates de checklist por fila/tese (admin configurável)
export const creditChecklistTemplates = mysqlTable("credit_checklist_templates", {
	id: int().autoincrement().notNull(),
	fila: varchar({ length: 50 }).notNull(), // apuracao, retificacao, compensacao, etc.
	teseId: int(), // null = genérico para a fila
	teseNome: varchar({ length: 500 }),
	nome: varchar({ length: 255 }).notNull(),
	itens: json().notNull(), // [{ordem, titulo, descricao, obrigatorio}]
	ativo: tinyint().default(1).notNull(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Checklist Instances — instância de checklist vinculada a uma tarefa
export const creditChecklistInstances = mysqlTable("credit_checklist_instances", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	templateId: int(),
	fila: varchar({ length: 50 }).notNull(),
	nome: varchar({ length: 255 }).notNull(),
	itens: json().notNull(), // [{ordem, titulo, descricao, obrigatorio, concluido, concluidoPorNome, concluidoEm, observacao}]
	progresso: int().default(0).notNull(), // % concluído
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_cci_task").on(table.taskId),
]);

// Document Folders — pastas de documentos por tarefa/cliente/fila
export const creditDocFolders = mysqlTable("credit_doc_folders", {
	id: int().autoincrement().notNull(),
	taskId: int(),
	caseId: int(),
	clienteId: int().notNull(),
	fila: varchar({ length: 50 }),
	nome: varchar({ length: 255 }).notNull(),
	descricao: text(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_cdf_task").on(table.taskId),
	index("idx_cdf_cliente").on(table.clienteId),
	index("idx_cdf_case").on(table.caseId),
]);

// Document Files — arquivos dentro de pastas
export const creditDocFiles = mysqlTable("credit_doc_files", {
	id: int().autoincrement().notNull(),
	folderId: int().notNull(),
	nome: varchar({ length: 500 }).notNull(),
	fileUrl: varchar({ length: 1000 }).notNull(),
	fileKey: varchar({ length: 500 }),
	mimeType: varchar({ length: 100 }),
	tamanhoBytes: int(),
	uploadPorId: int(),
	uploadPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_cdfi_folder").on(table.folderId),
]);

// PerdComps — registro de PerdComps para busca futura
export const creditPerdcomps = mysqlTable("credit_perdcomps", {
	id: int().autoincrement().notNull(),
	taskId: int(),
	caseId: int(),
	clienteId: int().notNull(),
	ledgerEntryId: int(),
	numeroPerdcomp: varchar({ length: 50 }).notNull(),
	tipoDocumento: varchar({ length: 50 }).default('Original'), // Original, Retificadora
	numeroControle: varchar({ length: 50 }),
	cnpjDeclarante: varchar({ length: 20 }),
	nomeEmpresarial: varchar({ length: 500 }),
	tipoCredito: varchar({ length: 100 }), // Pagamento Indevido ou a Maior, etc.
	oriundoAcaoJudicial: tinyint().default(0),
	creditoSucedida: tinyint().default(0),
	numeroDocArrecadacao: varchar({ length: 50 }),
	codigoReceita: varchar({ length: 20 }),
	grupoTributo: varchar({ length: 200 }), // Contribuição para o Financiamento da Seguridade Social, etc.
	dataArrecadacao: timestamp({ mode: 'string' }),
	periodoApuracao: varchar({ length: 20 }), // MM/YYYY
	valorCredito: decimal({ precision: 15, scale: 2 }),
	valorDebitosCompensados: decimal({ precision: 15, scale: 2 }),
	debitosCompensadosJson: json(), // [{tributo: 'COFINS', valor: 10889.98}, ...]
	saldoRemanescente: decimal({ precision: 15, scale: 2 }),
	dataTransmissao: timestamp({ mode: 'string' }),
	dataVencimentoGuia: timestamp({ mode: 'string' }),
	guiaNumero: varchar({ length: 100 }),
	guiaUrl: varchar({ length: 1000 }),
	comprovanteUrl: varchar({ length: 1000 }),
	reciboUrl: varchar({ length: 1000 }),
	status: mysqlEnum(['transmitido','homologado','nao_homologado','em_analise','cancelado']).default('transmitido').notNull(),
	despachoDecisorio: text(),
	representanteNome: varchar({ length: 255 }),
	representanteCpf: varchar({ length: 20 }),
	versaoSistema: varchar({ length: 20 }),
	codigoSerpro: varchar({ length: 50 }),
	dataRecebimentoSerpro: timestamp({ mode: 'string' }),
	feitoPelaEvox: tinyint().default(1).notNull(),
	modalidade: mysqlEnum(['compensacao','ressarcimento','restituicao']).default('compensacao'),
	observacoes: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_cp_cliente").on(table.clienteId),
	index("idx_cp_case").on(table.caseId),
	index("idx_cp_numero").on(table.numeroPerdcomp),
	index("idx_cp_task").on(table.taskId),
]);

// Task Teses — teses selecionadas para uma tarefa (com justificativa se não aderente)
export const creditTaskTeses = mysqlTable("credit_task_teses", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	teseId: int().notNull(),
	teseNome: varchar({ length: 500 }),
	aderente: tinyint().default(1).notNull(), // 1 = aderente, 0 = não aderente (com justificativa)
	justificativaNaoAderente: text(), // obrigatória se aderente = 0
	valorEstimado: decimal({ precision: 15, scale: 2 }).default('0'),
	valorApurado: decimal({ precision: 15, scale: 2 }),
	valorValidado: decimal({ precision: 15, scale: 2 }),
	status: mysqlEnum(['selecionada','em_apuracao','apurada','validada','descartada']).default('selecionada').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_ctt_task").on(table.taskId),
	index("idx_ctt_tese").on(table.teseId),
]);

// Credit Case Strategy — estratégia de monetização definida no onboarding
export const creditCaseStrategy = mysqlTable("credit_case_strategy", {
	id: int().autoincrement().notNull(),
	caseId: int().notNull(),
	clienteId: int().notNull(),
	estrategia: mysqlEnum(['compensacao','ressarcimento','restituicao','mista']).notNull(),
	compensacaoPct: int().default(0), // % do saldo para compensação
	ressarcimentoPct: int().default(0),
	restituicaoPct: int().default(0),
	observacoes: text(),
	definidoPorId: int(),
	definidoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_ccs_case").on(table.caseId),
	index("idx_ccs_cliente").on(table.clienteId),
]);

// RTI Templates — template editável pelo admin para geração de RTI
export const rtiTemplates = mysqlTable("rti_templates", {
	id: int().autoincrement().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	textoIntro: text(),
	textoObservacoes: text(),
	textoProximasEtapas: text(),
	cenarioCompensacaoDefault: json(),
	alertasDefault: json(),
	ativo: tinyint().default(1).notNull(),
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// RTI Oportunidades — linhas de oportunidades dentro de um RTI
export const rtiOportunidades = mysqlTable("rti_oportunidades", {
	id: int().autoincrement().notNull(),
	rtiId: int().notNull(),
	teseId: int(),
	descricao: varchar({ length: 500 }).notNull(),
	classificacao: mysqlEnum(['pacificado','nao_pacificado']).notNull(),
	valorApurado: decimal({ precision: 15, scale: 2 }).default('0'),
	detalhamento: json(),
	ordem: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_rtio_rti").on(table.rtiId),
]);

// RTI Cenário Compensação
export const rtiCenarioCompensacao = mysqlTable("rti_cenario_compensacao", {
	id: int().autoincrement().notNull(),
	rtiId: int().notNull(),
	tributo: varchar({ length: 100 }).notNull(),
	mediaMensal: decimal({ precision: 15, scale: 2 }).default('0'),
	ordem: int().default(0).notNull(),
},
(table) => [
	index("idx_rticc_rti").on(table.rtiId),
]);

// RTI Alertas
export const rtiAlertas = mysqlTable("rti_alertas", {
	id: int().autoincrement().notNull(),
	rtiId: int().notNull(),
	tipo: varchar({ length: 100 }).notNull(),
	texto: text().notNull(),
	ordem: int().default(0).notNull(),
},
(table) => [
	index("idx_rtia_rti").on(table.rtiId),
]);

// Partner Return Management — gestão de retorno dos parceiros
export const creditPartnerReturns = mysqlTable("credit_partner_returns", {
	id: int().autoincrement().notNull(),
	rtiId: int().notNull(),
	caseId: int(),
	clienteId: int().notNull(),
	parceiroId: int(),
	parceiroNome: varchar({ length: 255 }),
	enviadoEm: timestamp({ mode: 'string' }).notNull(),
	slaDias: int().default(7).notNull(),
	slaVenceEm: timestamp({ mode: 'string' }).notNull(),
	retornoRecebidoEm: timestamp({ mode: 'string' }),
	retornoStatus: mysqlEnum(['aguardando','fechou','nao_fechou','sem_retorno','em_negociacao']).default('aguardando').notNull(),
	retornoObservacao: text(),
	motivoNaoFechamento: text(),
	valorRti: decimal({ precision: 15, scale: 2 }).default('0'),
	valorContratado: decimal({ precision: 15, scale: 2 }),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_cpr_rti").on(table.rtiId),
	index("idx_cpr_cliente").on(table.clienteId),
	index("idx_cpr_parceiro").on(table.parceiroId),
	index("idx_cpr_status").on(table.retornoStatus),
]);

// Onboarding Records — registro completo do onboarding de crédito
export const creditOnboardingRecords = mysqlTable("credit_onboarding_records", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	caseId: int(),
	clienteId: int().notNull(),
	checklistRevisao: json(),
	checklistRefinamento: json(),
	checklistRegistro: json(),
	reuniaoGravacaoUrl: varchar({ length: 1000 }),
	reuniaoGravacaoFileKey: varchar({ length: 500 }),
	reuniaoTranscricaoUrl: varchar({ length: 1000 }),
	reuniaoTranscricaoFileKey: varchar({ length: 500 }),
	reuniaoData: timestamp({ mode: 'string' }),
	reuniaoParticipantes: json(),
	creditoDescricao: text(),
	periodoCredito: varchar({ length: 100 }),
	valorEstimadoCredito: decimal({ precision: 15, scale: 2 }),
	estrategia: mysqlEnum(['compensacao','ressarcimento','restituicao','judicial','mista']).default('compensacao'),
	estrategiaDetalhes: json(),
	contatoContabil: json(),
	contatoFinanceiro: json(),
	contatoEmpresario: json(),
	contatoOutros: json(),
	responsavelTecnicoId: int(),
	responsavelTecnicoNome: varchar({ length: 255 }),
	empresaTemDebitos: tinyint().default(0),
	empresaPrecisaCnd: tinyint().default(0),
	empresaNoEmac: tinyint().default(0),
	empresaHistoricoMalha: tinyint().default(0),
	empresaAssinanteMonitor: tinyint().default(0),
	status: mysqlEnum(['em_andamento','concluido','cancelado']).default('em_andamento').notNull(),
	concluidoEm: timestamp({ mode: 'string' }),
	concluidoPorId: int(),
	concluidoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_cor_task").on(table.taskId),
	index("idx_cor_case").on(table.caseId),
	index("idx_cor_cliente").on(table.clienteId),
]);

// Retificação Records — registro detalhado de retificações por tese
export const creditRetificacaoRecords = mysqlTable("credit_retificacao_records", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	caseId: int().notNull(),
	clienteId: int().notNull(),
	teseId: int(),
	teseNome: varchar({ length: 500 }),
	tipoRetificacao: mysqlEnum(['total','parcial']).default('total').notNull(),
	periodoInicio: varchar({ length: 10 }),
	periodoFim: varchar({ length: 10 }),
	valorApuradoRti: decimal({ precision: 15, scale: 2 }).default('0'),
	valorCreditoDisponivel: decimal({ precision: 15, scale: 2 }).default('0'),
	divergencia: decimal({ precision: 15, scale: 2 }).default('0'),
	divergenciaPct: decimal({ precision: 5, scale: 2 }).default('0'),
	alertaDivergencia: tinyint().default(0),
	justificativaDivergencia: text(),
	saldoPorGrupo: json(), // {INSS: 50000, PIS_COFINS: 30000, IRPJ_CSLL: 20000}
	obrigacoesAcessorias: json(), // [{nome: 'EFD-Contribuições', status: 'retificada'}, ...]
	checklistConcluido: tinyint().default(0),
	observacoes: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_crr_task").on(table.taskId),
	index("idx_crr_case").on(table.caseId),
	index("idx_crr_cliente").on(table.clienteId),
]);

// Credit Guias — guias a serem compensadas/ressarcidas/restituídas
export const creditGuias = mysqlTable("credit_guias", {
	id: int().autoincrement().notNull(),
	taskId: int(),
	caseId: int(),
	clienteId: int().notNull(),
	perdcompId: int(),
	cnpjGuia: varchar({ length: 20 }),
	codigoReceita: varchar({ length: 20 }),
	grupoTributo: varchar({ length: 200 }),
	periodoApuracao: varchar({ length: 20 }),
	dataVencimento: timestamp({ mode: 'string' }),
	valorOriginal: decimal({ precision: 15, scale: 2 }).default('0'),
	valorMulta: decimal({ precision: 15, scale: 2 }).default('0'),
	valorJuros: decimal({ precision: 15, scale: 2 }).default('0'),
	valorTotal: decimal({ precision: 15, scale: 2 }).default('0'),
	valorCompensado: decimal({ precision: 15, scale: 2 }).default('0'),
	statusGuia: mysqlEnum(['a_vencer','vencida','perto_vencimento','compensada','parcial']).default('a_vencer'),
	validacaoCliente: tinyint().default(0),
	guiaUrl: varchar({ length: 1000 }),
	comprovanteUrl: varchar({ length: 1000 }),
	observacoes: text(),
	registradoPorId: int(),
	registradoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_cg_task").on(table.taskId),
	index("idx_cg_case").on(table.caseId),
	index("idx_cg_cliente").on(table.clienteId),
	index("idx_cg_perdcomp").on(table.perdcompId),
]);

// ===== SETOR CONTRATOS =====

// Contratos — gestão de contratos de prestação de serviços
export const contratos = mysqlTable("contratos", {
	id: int().autoincrement().notNull(),
	numero: varchar({ length: 30 }).notNull(), // CON-0001
	clienteId: int().notNull(),
	clienteNome: varchar({ length: 500 }),
	clienteCnpj: varchar({ length: 20 }),
	parceiroId: int(),
	parceiroNome: varchar({ length: 500 }),
	servicoId: int(),
	servicoNome: varchar({ length: 500 }),
	tipo: mysqlEnum(['prestacao_servicos','honorarios','parceria','nda','aditivo','distrato','outro']).default('prestacao_servicos').notNull(),
	fila: mysqlEnum(['elaboracao','revisao','assinatura','vigencia','renovacao','encerrado']).default('elaboracao').notNull(),
	status: mysqlEnum(['a_fazer','fazendo','feito','concluido']).default('a_fazer').notNull(),
	prioridade: mysqlEnum(['urgente','alta','media','baixa']).default('media').notNull(),
	// Valores
	valorContrato: decimal({ precision: 15, scale: 2 }).default('0'),
	formaCobranca: mysqlEnum(['percentual_credito','valor_fixo','mensalidade','exito','hibrido','entrada_exito','valor_fixo_parcelado']).default('valor_fixo'),
	percentualExito: decimal({ precision: 5, scale: 2 }),
	valorEntrada: decimal({ precision: 15, scale: 2 }),
	quantidadeParcelas: int(),
	valorParcela: decimal({ precision: 15, scale: 2 }),
	// Datas
	dataInicio: timestamp({ mode: 'string' }),
	dataFim: timestamp({ mode: 'string' }),
	dataAssinatura: timestamp({ mode: 'string' }),
	dataVencimento: timestamp({ mode: 'string' }),
	// SLA
	slaHoras: int(),
	slaStatus: mysqlEnum(['dentro_prazo','atencao','vencido']).default('dentro_prazo'),
	// Responsáveis
	responsavelId: int(),
	responsavelNome: varchar({ length: 255 }),
	revisorId: int(),
	revisorNome: varchar({ length: 255 }),
	// Documentos
	contratoUrl: varchar({ length: 1000 }),
	contratoAssinadoUrl: varchar({ length: 1000 }),
	// Observações
	objetoContrato: text(),
	clausulasEspeciais: text(),
	observacoes: text(),
	// Rastreabilidade
	criadoPorId: int(),
	criadoPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_con_cliente").on(table.clienteId),
	index("idx_con_parceiro").on(table.parceiroId),
	index("idx_con_fila").on(table.fila),
	index("idx_con_status").on(table.status),
	index("idx_con_numero").on(table.numero),
	index("idx_con_tipo").on(table.tipo),
]);

// Contrato Documentos — anexos e versões de documentos do contrato
export const contratoDocumentos = mysqlTable("contrato_documentos", {
	id: int().autoincrement().notNull(),
	contratoId: int().notNull(),
	nome: varchar({ length: 500 }).notNull(),
	tipo: mysqlEnum(['minuta','contrato_final','aditivo','distrato','procuracao','nda','comprovante','outro']).default('outro').notNull(),
	versao: int().default(1).notNull(),
	url: varchar({ length: 1000 }).notNull(),
	tamanho: int(), // bytes
	mimeType: varchar({ length: 100 }),
	observacoes: text(),
	uploadPorId: int(),
	uploadPorNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_cd_contrato").on(table.contratoId),
	index("idx_cd_tipo").on(table.tipo),
]);

// Contrato Histórico — audit log de alterações no contrato
export const contratoHistorico = mysqlTable("contrato_historico", {
	id: int().autoincrement().notNull(),
	contratoId: int().notNull(),
	acao: varchar({ length: 100 }).notNull(), // criacao, edicao, mudanca_fila, mudanca_status, upload_documento, assinatura, renovacao, encerramento
	descricao: text(),
	dadosAntigos: json(),
	dadosNovos: json(),
	usuarioId: int(),
	usuarioNome: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_ch_contrato").on(table.contratoId),
	index("idx_ch_acao").on(table.acao),
]);

// ===== Queue Exception Requests =====
export const queueExceptionRequests = mysqlTable('queue_exception_requests', {
	id: int().primaryKey().autoincrement(),
	taskId: int().notNull(),
	taskCodigo: varchar({ length: 50 }),
	fila: varchar({ length: 100 }).notNull(),
	solicitanteId: varchar({ length: 255 }).notNull(),
	solicitanteNome: varchar({ length: 255 }).notNull(),
	justificativa: text().notNull(),
	status: varchar({ length: 50 }).default('pendente').notNull(),
	gestorId: varchar({ length: 255 }),
	gestorNome: varchar({ length: 255 }),
	gestorResposta: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	respondidoEm: timestamp({ mode: 'string' }),
}, (table) => [
	index("idx_qer_task").on(table.taskId),
	index("idx_qer_solicitante").on(table.solicitanteId),
	index("idx_qer_status").on(table.status),
]);
export type SelectQueueExceptionRequest = typeof queueExceptionRequests.$inferSelect;
export type SelectMetaComissao = typeof metasComissoes.$inferSelect;
export type InsertAcademiaBeneficio = typeof academiaBeneficio.$inferInsert;
export type InsertAcoesBeneficios = typeof acoesBeneficios.$inferInsert;
export type InsertApiKeys = typeof apiKeys.$inferInsert;
export type InsertApontamentosFolha = typeof apontamentosFolha.$inferInsert;
export type InsertAprovacaoComissao = typeof aprovacaoComissao.$inferInsert;
export type InsertArquivos = typeof arquivos.$inferInsert;
export type InsertAtestadosLicencas = typeof atestadosLicencas.$inferInsert;
export type InsertAuditLog = typeof auditLog.$inferInsert;
export type InsertAvaliacoes = typeof avaliacoes.$inferInsert;
export type InsertBancoHoras = typeof bancoHoras.$inferInsert;
export type InsertBeneficiosCustom = typeof beneficiosCustom.$inferInsert;
export type InsertBirthdayAdvanceNotifications = typeof birthdayAdvanceNotifications.$inferInsert;
export type InsertChatChannels = typeof chatChannels.$inferInsert;
export type InsertChatMessages = typeof chatMessages.$inferInsert;
export type InsertChatNotifications = typeof chatNotifications.$inferInsert;
export type InsertChatReactions = typeof chatReactions.$inferInsert;
export type InsertChatTypingIndicators = typeof chatTypingIndicators.$inferInsert;
export type InsertCiclosAvaliacao = typeof ciclosAvaliacao.$inferInsert;
export type InsertClienteServicos = typeof clienteServicos.$inferInsert;
export type InsertClientes = typeof clientes.$inferInsert;
export type InsertColaboradorDocumentos = typeof colaboradorDocumentos.$inferInsert;
export type InsertColaboradores = typeof colaboradores.$inferInsert;
export type InsertComissaoRh = typeof comissaoRh.$inferInsert;
export type InsertComissoesServico = typeof comissoesServico.$inferInsert;
export type InsertDayOff = typeof dayOff.$inferInsert;
export type InsertDoacaoSangue = typeof doacaoSangue.$inferInsert;
export type InsertEmailAniversarianteConfig = typeof emailAniversarianteConfig.$inferInsert;
export type InsertEmailAniversarianteLog = typeof emailAniversarianteLog.$inferInsert;
export type InsertEmailsCorporativos = typeof emailsCorporativos.$inferInsert;
export type InsertEquipamentosColaborador = typeof equipamentosColaborador.$inferInsert;
export type InsertExecutivosComerciais = typeof executivosComerciais.$inferInsert;
export type InsertFerias = typeof ferias.$inferInsert;
export type InsertFilaApuracao = typeof filaApuracao.$inferInsert;
export type InsertHistoricoStatusColaborador = typeof historicoStatusColaborador.$inferInsert;
export type InsertMetasComissoes = typeof metasComissoes.$inferInsert;
export type InsertMetasIndividuais = typeof metasIndividuais.$inferInsert;
export type InsertModelosParceria = typeof modelosParceria.$inferInsert;
export type InsertNiveisCargo = typeof niveisCargo.$inferInsert;
export type InsertNotificacoes = typeof notificacoes.$inferInsert;
export type InsertOnboardingColaborador = typeof onboardingColaborador.$inferInsert;
export type InsertOnboardingEtapas = typeof onboardingEtapas.$inferInsert;
export type InsertOnboardingEtapasTemplate = typeof onboardingEtapasTemplate.$inferInsert;
export type InsertOnboardingTemplates = typeof onboardingTemplates.$inferInsert;
export type InsertParceiroServicos = typeof parceiroServicos.$inferInsert;
export type InsertParceiros = typeof parceiros.$inferInsert;
export type InsertPerguntasClima = typeof perguntasClima.$inferInsert;
export type InsertPesquisasClima = typeof pesquisasClima.$inferInsert;
export type InsertPlanosCarreira = typeof planosCarreira.$inferInsert;
export type InsertProgramasCarreira = typeof programasCarreira.$inferInsert;
export type InsertRateioComissao = typeof rateioComissao.$inferInsert;
export type InsertReajustesSalariais = typeof reajustesSalariais.$inferInsert;
export type InsertRelatorios = typeof relatorios.$inferInsert;
export type InsertRescisoes = typeof rescisoes.$inferInsert;
export type InsertRespostasClima = typeof respostasClima.$inferInsert;
export type InsertSenhaHistorico = typeof senhaHistorico.$inferInsert;
export type InsertSenhasAutorizacoes = typeof senhasAutorizacoes.$inferInsert;
export type InsertServicoEtapas = typeof servicoEtapas.$inferInsert;
export type InsertServicos = typeof servicos.$inferInsert;
export type InsertSetorConfig = typeof setorConfig.$inferInsert;
export type InsertSetores = typeof setores.$inferInsert;
export type InsertSlaConfiguracoes = typeof slaConfiguracoes.$inferInsert;
export type InsertSolicitacoesFolga = typeof solicitacoesFolga.$inferInsert;
export type InsertTarefaComentarios = typeof tarefaComentarios.$inferInsert;
export type InsertTarefas = typeof tarefas.$inferInsert;
export type InsertTarefasSetor = typeof tarefasSetor.$inferInsert;
export type InsertTeses = typeof teses.$inferInsert;
export type InsertUserHistory = typeof userHistory.$inferInsert;
export type InsertUserPresence = typeof userPresence.$inferInsert;
export type InsertUsers = typeof users.$inferInsert;
export type InsertUsuarioSetores = typeof usuarioSetores.$inferInsert;
export type InsertValeTransporte = typeof valeTransporte.$inferInsert;
export type InsertWorkflowRenovacaoContrato = typeof workflowRenovacaoContrato.$inferInsert;
export type InsertTermosResponsabilidade = typeof termosResponsabilidade.$inferInsert;
export type InsertConvencaoColetiva = typeof convencaoColetiva.$inferInsert;
export type InsertRescisaoAuditoria = typeof rescisaoAuditoria.$inferInsert;
export type InsertOcorrencias = typeof ocorrencias.$inferInsert;
export type InsertPlanoReversao = typeof planoReversao.$inferInsert;
export type InsertPlanoReversaoEtapas = typeof planoReversaoEtapas.$inferInsert;
export type InsertPlanoReversaoFeedbacks = typeof planoReversaoFeedbacks.$inferInsert;
export type InsertOcorrenciaTimeline = typeof ocorrenciaTimeline.$inferInsert;
export type InsertOcorrenciaAssinaturas = typeof ocorrenciaAssinaturas.$inferInsert;
export type InsertBibLivros = typeof bibLivros.$inferInsert;
export type InsertBibExemplares = typeof bibExemplares.$inferInsert;
export type InsertBibEmprestimos = typeof bibEmprestimos.$inferInsert;
export type InsertBibReservas = typeof bibReservas.$inferInsert;
export type InsertBibOcorrencias = typeof bibOcorrencias.$inferInsert;
export type InsertBibFornecedoresDoadores = typeof bibFornecedoresDoadores.$inferInsert;
export type InsertBibPoliticas = typeof bibPoliticas.$inferInsert;
export type InsertBibAuditoria = typeof bibAuditoria.$inferInsert;
export type InsertBibBloqueios = typeof bibBloqueios.$inferInsert;
export type InsertDemandRequests = typeof demandRequests.$inferInsert;
export type InsertPortfolioMigrationRequests = typeof portfolioMigrationRequests.$inferInsert;
export type InsertCreditCases = typeof creditCases.$inferInsert;
export type InsertRtiReports = typeof rtiReports.$inferInsert;
export type InsertCreditTasks = typeof creditTasks.$inferInsert;
export type InsertCreditTickets = typeof creditTickets.$inferInsert;
export type InsertCreditCompensationGroups = typeof creditCompensationGroups.$inferInsert;
export type InsertCreditLedger = typeof creditLedger.$inferInsert;
export type InsertDueSchedulePolicies = typeof dueSchedulePolicies.$inferInsert;
export type InsertClientDuePolicySubscriptions = typeof clientDuePolicySubscriptions.$inferInsert;
export type InsertSuccessEvents = typeof successEvents.$inferInsert;
export type InsertCreditAuditLog = typeof creditAuditLog.$inferInsert;
export type InsertCreditSlaConfigs = typeof creditSlaConfigs.$inferInsert;
export type InsertCreditTicketMessages = typeof creditTicketMessages.$inferInsert;
export type InsertCreditChecklistTemplates = typeof creditChecklistTemplates.$inferInsert;
export type InsertCreditChecklistInstances = typeof creditChecklistInstances.$inferInsert;
export type InsertCreditDocFolders = typeof creditDocFolders.$inferInsert;
export type InsertCreditDocFiles = typeof creditDocFiles.$inferInsert;
export type InsertCreditPerdcomps = typeof creditPerdcomps.$inferInsert;
export type InsertCreditTaskTeses = typeof creditTaskTeses.$inferInsert;
export type InsertCreditCaseStrategy = typeof creditCaseStrategy.$inferInsert;
export type InsertRtiTemplates = typeof rtiTemplates.$inferInsert;
export type InsertRtiOportunidades = typeof rtiOportunidades.$inferInsert;
export type InsertRtiCenarioCompensacao = typeof rtiCenarioCompensacao.$inferInsert;
export type InsertRtiAlertas = typeof rtiAlertas.$inferInsert;
export type InsertCreditPartnerReturns = typeof creditPartnerReturns.$inferInsert;
export type InsertCreditOnboardingRecords = typeof creditOnboardingRecords.$inferInsert;
export type InsertCreditRetificacaoRecords = typeof creditRetificacaoRecords.$inferInsert;
export type InsertCreditGuias = typeof creditGuias.$inferInsert;
export type InsertContratos = typeof contratos.$inferInsert;
export type InsertContratoDocumentos = typeof contratoDocumentos.$inferInsert;
export type InsertContratoHistorico = typeof contratoHistorico.$inferInsert;
export type InsertQueueExceptionRequests = typeof queueExceptionRequests.$inferInsert;
