import {
  int, mysqlEnum, mysqlTable, text, timestamp, varchar,
  boolean, bigint, json, decimal
} from "drizzle-orm/mysql-core";

// ---- SETORES (Departamentos) ----
export const setores = mysqlTable("setores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  cor: varchar("cor", { length: 7 }).default("#3B82F6"),
  icone: varchar("icone", { length: 50 }).default("Building2"),
  setorPaiId: int("setorPaiId"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setor = typeof setores.$inferSelect;
export type InsertSetor = typeof setores.$inferInsert;

// ---- USERS (auth + hierarquia CRM) ----
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  apelido: varchar("apelido", { length: 100 }),
  email: varchar("email", { length: 320 }),
  cpf: varchar("cpf", { length: 14 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  nivelAcesso: mysqlEnum("nivelAcesso", ["diretor", "gerente", "coordenador", "supervisor", "analista_fiscal"]).default("analista_fiscal").notNull(),
  cargo: varchar("cargo", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  avatar: varchar("avatar", { length: 500 }),
  setorPrincipalId: int("setorPrincipalId"),
  supervisorId: int("supervisorId"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---- USUARIO_SETORES (N:N - usuário pode pertencer a múltiplos setores) ----
export const usuarioSetores = mysqlTable("usuario_setores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  setorId: int("setorId").notNull(),
  papelNoSetor: mysqlEnum("papelNoSetor", ["responsavel", "membro", "observador"]).default("membro").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsuarioSetor = typeof usuarioSetores.$inferSelect;
export type InsertUsuarioSetor = typeof usuarioSetores.$inferInsert;

// ---- PARCEIROS ----
export const parceiros = mysqlTable("parceiros", {
  id: int("id").autoincrement().primaryKey(),
  // Tipo de pessoa
  tipoPessoa: mysqlEnum("tipoPessoa", ["pf", "pj"]).default("pj").notNull(),
  apelido: varchar("apelido", { length: 255 }), // nome de exibição no sistema
  // Dados PF
  nomeCompleto: varchar("nomeCompleto", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  rg: varchar("rg", { length: 20 }),
  // Dados PJ
  cnpj: varchar("cnpj", { length: 20 }),
  razaoSocial: varchar("razaoSocial", { length: 500 }),
  nomeFantasia: varchar("nomeFantasia", { length: 500 }),
  situacaoCadastral: varchar("situacaoCadastral", { length: 50 }),
  quadroSocietario: json("quadroSocietario").$type<{nome: string; qualificacao: string; faixaEtaria?: string}[]>(),
  // Sócio responsável pela parceria (PJ)
  socioNome: varchar("socioNome", { length: 255 }),
  socioCpf: varchar("socioCpf", { length: 14 }),
  socioRg: varchar("socioRg", { length: 20 }),
  socioEmail: varchar("socioEmail", { length: 320 }),
  socioTelefone: varchar("socioTelefone", { length: 20 }),
  // Contato
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  // Endereço completo
  cep: varchar("cep", { length: 10 }),
  logradouro: varchar("logradouro", { length: 500 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 500 }),
  bairro: varchar("bairro", { length: 255 }),
  cidade: varchar("cidade", { length: 255 }),
  estado: varchar("estado", { length: 2 }),
  // Dados bancários
  banco: varchar("banco", { length: 100 }),
  agencia: varchar("agencia", { length: 20 }),
  conta: varchar("conta", { length: 30 }),
  tipoConta: mysqlEnum("tipoConta", ["corrente", "poupanca"]),
  titularConta: varchar("titularConta", { length: 255 }),
  cpfCnpjConta: varchar("cpfCnpjConta", { length: 20 }),
  chavePix: varchar("chavePix", { length: 255 }),
  tipoChavePix: mysqlEnum("tipoChavePix", ["cpf", "cnpj", "email", "telefone", "aleatoria"]),
  // Parceria
  modeloParceriaId: int("modeloParceriaId"), // Diamante, Ouro, Prata
  executivoComercialId: int("executivoComercialId"), // Executivo Comercial responsável
  // Hierarquia parceiro/subparceiro
  ehSubparceiro: boolean("ehSubparceiro").default(false).notNull(),
  parceiroPaiId: int("parceiroPaiId"), // para subparceiros
  percentualRepasseSubparceiro: decimal("percentualRepasseSubparceiro", { precision: 5, scale: 2 }),
  // Observações
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Parceiro = typeof parceiros.$inferSelect;
export type InsertParceiro = typeof parceiros.$inferInsert;

// ---- CLIENTES ----
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  cnpj: varchar("cnpj", { length: 20 }).notNull(),
  tipoPessoa: mysqlEnum("tipoPessoa", ["juridica", "fisica"]).default("juridica").notNull(),
  cpf: varchar("cpf", { length: 14 }),
  razaoSocial: varchar("razaoSocial", { length: 500 }).notNull(),
  nomeFantasia: varchar("nomeFantasia", { length: 500 }),
  dataAbertura: varchar("dataAbertura", { length: 20 }),
  regimeTributario: mysqlEnum("regimeTributario", ["simples_nacional", "lucro_presumido", "lucro_real"]).notNull(),
  situacaoCadastral: mysqlEnum("situacaoCadastral", ["ativa", "baixada", "inapta", "suspensa", "nula"]).default("ativa").notNull(),
  // Classificação Novo/Base
  classificacaoCliente: mysqlEnum("classificacaoCliente", ["novo", "base"]).default("novo").notNull(),
  dataConversaoBase: timestamp("dataConversaoBase"), // quando converteu de novo para base
  cnaePrincipal: varchar("cnaePrincipal", { length: 20 }),
  cnaePrincipalDescricao: text("cnaePrincipalDescricao"),
  cnaesSecundarios: json("cnaesSecundarios").$type<{codigo: string; descricao: string}[]>(),
  segmentoEconomico: varchar("segmentoEconomico", { length: 255 }),
  naturezaJuridica: varchar("naturezaJuridica", { length: 255 }),
  quadroSocietario: json("quadroSocietario").$type<{nome: string; qualificacao: string; faixaEtaria?: string}[]>(),
  endereco: text("endereco"),
  complemento: varchar("complemento", { length: 500 }),
  estado: varchar("estado", { length: 2 }),
  cidade: varchar("cidade", { length: 255 }),
  ativo: boolean("ativo").default(true).notNull(),
  industrializa: boolean("industrializa").default(false).notNull(),
  comercializa: boolean("comercializa").default(false).notNull(),
  prestaServicos: boolean("prestaServicos").default(false).notNull(),
  contribuinteICMS: boolean("contribuinteICMS").default(false).notNull(),
  contribuinteIPI: boolean("contribuinteIPI").default(false).notNull(),
  regimeMonofasico: boolean("regimeMonofasico").default(false).notNull(),
  folhaPagamentoMedia: decimal("folhaPagamentoMedia", { precision: 15, scale: 2 }).default("0"),
  faturamentoMedioMensal: decimal("faturamentoMedioMensal", { precision: 15, scale: 2 }).default("0"),
  valorMedioGuias: decimal("valorMedioGuias", { precision: 15, scale: 2 }).default("0"),
  processosJudiciaisAtivos: boolean("processosJudiciaisAtivos").default(false).notNull(),
  parcelamentosAtivos: boolean("parcelamentosAtivos").default(false).notNull(),
  atividadePrincipalDescritivo: text("atividadePrincipalDescritivo"),
  parceiroId: int("parceiroId"),
  procuracaoHabilitada: boolean("procuracaoHabilitada").default(false).notNull(),
  procuracaoCertificado: varchar("procuracaoCertificado", { length: 100 }),
  procuracaoValidade: varchar("procuracaoValidade", { length: 20 }),
  excecoesEspecificidades: text("excecoesEspecificidades"),
  prioridade: mysqlEnum("prioridade", ["alta", "media", "baixa"]).default("media").notNull(),
  scoreOportunidade: int("scoreOportunidade").default(0),
  redFlags: json("redFlags").$type<any[]>(),
  alertasInformacao: json("alertasInformacao").$type<any[]>(),
  usuarioCadastroId: int("usuarioCadastroId"),
  usuarioCadastroNome: varchar("usuarioCadastroNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// ---- TESES ----
export const teses = mysqlTable("teses", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 500 }).notNull(),
  tributoEnvolvido: varchar("tributoEnvolvido", { length: 100 }).notNull(),
  tipo: mysqlEnum("tipo", ["exclusao_base", "credito_presumido", "recuperacao_indebito", "tese_judicial", "tese_administrativa"]).notNull(),
  classificacao: mysqlEnum("classificacao", ["pacificada", "judicial", "administrativa", "controversa"]).notNull(),
  potencialFinanceiro: mysqlEnum("potencialFinanceiro", ["muito_alto", "alto", "medio", "baixo"]).notNull(),
  potencialMercadologico: mysqlEnum("potencialMercadologico", ["muito_alto", "alto", "medio", "baixo"]).notNull(),
  requisitosObjetivos: json("requisitosObjetivos").$type<string[]>(),
  requisitosImpeditivos: json("requisitosImpeditivos").$type<string[]>(),
  fundamentacaoLegal: text("fundamentacaoLegal"),
  jurisprudenciaRelevante: text("jurisprudenciaRelevante"),
  parecerTecnicoJuridico: text("parecerTecnicoJuridico"),
  prazoPrescricional: varchar("prazoPrescricional", { length: 50 }),
  necessidadeAcaoJudicial: boolean("necessidadeAcaoJudicial").default(false).notNull(),
  viaAdministrativa: boolean("viaAdministrativa").default(false).notNull(),
  grauRisco: mysqlEnum("grauRisco", ["baixo", "medio", "alto"]).notNull(),
  documentosNecessarios: json("documentosNecessarios").$type<string[]>(),
  formulaEstimativaCredito: text("formulaEstimativaCredito"),
  aplicavelComercio: boolean("aplicavelComercio").default(false).notNull(),
  aplicavelIndustria: boolean("aplicavelIndustria").default(false).notNull(),
  aplicavelServico: boolean("aplicavelServico").default(false).notNull(),
  aplicavelContribuinteICMS: boolean("aplicavelContribuinteICMS").default(false).notNull(),
  aplicavelContribuinteIPI: boolean("aplicavelContribuinteIPI").default(false).notNull(),
  aplicavelLucroReal: boolean("aplicavelLucroReal").default(false).notNull(),
  aplicavelLucroPresumido: boolean("aplicavelLucroPresumido").default(false).notNull(),
  aplicavelSimplesNacional: boolean("aplicavelSimplesNacional").default(false).notNull(),
  versao: int("versao").default(1).notNull(),
  ativa: boolean("ativa").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tese = typeof teses.$inferSelect;
export type InsertTese = typeof teses.$inferInsert;

// ---- FILA DE APURAÇÃO ----
export const filaApuracao = mysqlTable("fila_apuracao", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  status: mysqlEnum("status", ["a_fazer", "fazendo", "concluido"]).default("a_fazer").notNull(),
  ordem: int("ordem").default(0).notNull(),
  prioridadeManual: boolean("prioridadeManual").default(false).notNull(),
  analistaId: int("analistaId"),
  analistaNome: varchar("analistaNome", { length: 255 }),
  tempoGastoMs: bigint("tempoGastoMs", { mode: "number" }).default(0),
  dataInicioApuracao: timestamp("dataInicioApuracao"),
  dataConclusao: timestamp("dataConclusao"),
  historico: json("historico").$type<any[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FilaApuracao = typeof filaApuracao.$inferSelect;
export type InsertFilaApuracao = typeof filaApuracao.$inferInsert;

// ---- RELATÓRIOS DE ANÁLISE ----
export const relatorios = mysqlTable("relatorios", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  clienteNome: varchar("clienteNome", { length: 500 }).notNull(),
  diagnosticoTributario: text("diagnosticoTributario"),
  tesesAplicaveis: json("tesesAplicaveis").$type<any[]>(),
  tesesDescartadas: json("tesesDescartadas").$type<any[]>(),
  scoreOportunidade: int("scoreOportunidade").default(0),
  recomendacaoGeral: text("recomendacaoGeral"),
  redFlags: json("redFlags").$type<any[]>(),
  prioridade: mysqlEnum("prioridade", ["alta", "media", "baixa"]).default("media").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Relatorio = typeof relatorios.$inferSelect;
export type InsertRelatorio = typeof relatorios.$inferInsert;

// ---- NOTIFICAÇÕES ----
export const notificacoes = mysqlTable("notificacoes", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["procuracao_vencendo", "procuracao_vencida", "analise_concluida", "nova_tese", "tarefa_atribuida", "tarefa_sla_vencendo", "tarefa_comentario", "geral", "avaliacao_ciclo_aberto", "avaliacao_pendente"]).notNull(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  mensagem: text("mensagem").notNull(),
  lida: boolean("lida").default(false).notNull(),
  usuarioId: int("usuarioId"),
  clienteId: int("clienteId"),
  tarefaId: int("tarefaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;

// ---- TAREFAS (Sistema de tarefas estilo ClickUp) ----
export const tarefas = mysqlTable("tarefas", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 20 }).notNull(), // e.g. EVX-001
  titulo: varchar("titulo", { length: 500 }).notNull(),
  descricao: text("descricao"),
  tipo: mysqlEnum("tipo", ["tarefa", "bug", "melhoria", "reuniao", "documento", "outro"]).default("tarefa").notNull(),
  status: mysqlEnum("status", ["backlog", "a_fazer", "em_andamento", "revisao", "concluido", "cancelado"]).default("a_fazer").notNull(),
  prioridade: mysqlEnum("prioridade", ["urgente", "alta", "media", "baixa"]).default("media").notNull(),
  // Relacionamentos
  setorId: int("setorId"),
  responsavelId: int("responsavelId"),
  criadorId: int("criadorId"),
  clienteId: int("clienteId"),
  tarefaPaiId: int("tarefaPaiId"), // para subtarefas
  // SLA
  dataInicio: timestamp("dataInicio"),
  dataVencimento: timestamp("dataVencimento"),
  dataConclusao: timestamp("dataConclusao"),
  slaHoras: int("slaHoras"), // SLA em horas
  slaStatus: mysqlEnum("slaStatus", ["dentro_prazo", "atencao", "vencido"]).default("dentro_prazo"),
  // Metadados
  tags: json("tags").$type<string[]>(),
  setoresEnvolvidos: json("setoresEnvolvidos").$type<number[]>(), // IDs dos setores envolvidos (multisetorial)
  estimativaHoras: decimal("estimativaHoras", { precision: 6, scale: 1 }),
  horasGastas: decimal("horasGastas", { precision: 6, scale: 1 }).default("0"),
  progresso: int("progresso").default(0), // 0-100%
  ordem: int("ordem").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tarefa = typeof tarefas.$inferSelect;
export type InsertTarefa = typeof tarefas.$inferInsert;

// ---- COMENTÁRIOS DE TAREFAS ----
export const tarefaComentarios = mysqlTable("tarefa_comentarios", {
  id: int("id").autoincrement().primaryKey(),
  tarefaId: int("tarefaId").notNull(),
  autorId: int("autorId").notNull(),
  autorNome: varchar("autorNome", { length: 255 }).notNull(),
  conteudo: text("conteudo").notNull(),
  mencoes: json("mencoes").$type<number[]>(), // IDs de usuários mencionados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TarefaComentario = typeof tarefaComentarios.$inferSelect;
export type InsertTarefaComentario = typeof tarefaComentarios.$inferInsert;

// ---- ARQUIVOS (Armazenamento de documentos) ----
export const arquivos = mysqlTable("arquivos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 500 }).notNull(),
  nomeOriginal: varchar("nomeOriginal", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  tamanhoBytes: bigint("tamanhoBytes", { mode: "number" }).notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1000 }).notNull(),
  // Vinculação polimórfica
  entidadeTipo: mysqlEnum("entidadeTipo", ["cliente", "tarefa", "tese", "parceiro", "relatorio", "geral"]).notNull(),
  entidadeId: int("entidadeId"),
  // Versionamento
  versao: int("versao").default(1).notNull(),
  arquivoPaiId: int("arquivoPaiId"), // para versões anteriores
  // Metadados
  descricao: text("descricao"),
  tags: json("tags").$type<string[]>(),
  uploadPorId: int("uploadPorId"),
  uploadPorNome: varchar("uploadPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Arquivo = typeof arquivos.$inferSelect;
export type InsertArquivo = typeof arquivos.$inferInsert;

// ---- AUDIT LOG (Rastreabilidade) ----
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  acao: mysqlEnum("acao", [
    "criar", "editar", "excluir", "visualizar", "login", "logout",
    "atribuir", "concluir", "comentar", "upload", "download", "exportar",
    "ativar", "inativar"
  ]).notNull(),
  entidadeTipo: varchar("entidadeTipo", { length: 50 }).notNull(), // 'cliente', 'tarefa', 'tese', etc.
  entidadeId: int("entidadeId"),
  entidadeNome: varchar("entidadeNome", { length: 500 }),
  detalhes: json("detalhes").$type<Record<string, any>>(),
  usuarioId: int("usuarioId"),
  usuarioNome: varchar("usuarioNome", { length: 255 }),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// ---- API KEYS (Para integrações externas) ----
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  chave: varchar("chave", { length: 64 }).notNull().unique(),
  descricao: text("descricao"),
  permissoes: json("permissoes").$type<string[]>(), // ['clientes:read', 'clientes:write', 'tarefas:read', etc.]
  ativo: boolean("ativo").default(true).notNull(),
  ultimoUso: timestamp("ultimoUso"),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ---- SERVIÇOS POR SETOR ----
export const servicos = mysqlTable("servicos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 500 }).notNull(),
  descricao: text("descricao"),
  setorId: int("setorId"), // setor principal (pode ser null se multisetorial)
  setoresIds: json("setoresIds").$type<number[]>(), // setores envolvidos na execução
  responsaveisIds: json("responsaveisIds").$type<number[]>(), // pessoas responsáveis
  percentualHonorariosComercial: decimal("percentualHonorariosComercial", { precision: 5, scale: 2 }).default("0"),
  // Honorários ao cliente
  percentualHonorariosCliente: decimal("percentualHonorariosCliente", { precision: 5, scale: 2 }).default("0"),
  formaCobrancaHonorarios: mysqlEnum("formaCobrancaHonorarios", [
    "percentual_credito", "valor_fixo", "mensalidade", "exito", "hibrido",
    "entrada_exito", "valor_fixo_parcelado"
  ]).default("percentual_credito").notNull(),
  valorFixo: decimal("valorFixo", { precision: 15, scale: 2 }),
  // Entrada + Êxito
  valorEntrada: decimal("valorEntrada", { precision: 15, scale: 2 }),
  percentualExito: decimal("percentualExito", { precision: 5, scale: 2 }),
  // Valor fixo parcelado
  quantidadeParcelas: int("quantidadeParcelas"),
  valorParcela: decimal("valorParcela", { precision: 15, scale: 2 }),
  // Comissão padrão por modelo de parceria
  comissaoPadraoDiamante: decimal("comissaoPadraoDiamante", { precision: 5, scale: 2 }),
  comissaoPadraoOuro: decimal("comissaoPadraoOuro", { precision: 5, scale: 2 }),
  comissaoPadraoPrata: decimal("comissaoPadraoPrata", { precision: 5, scale: 2 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Servico = typeof servicos.$inferSelect;
export type InsertServico = typeof servicos.$inferInsert;

// ---- CONFIGURAÇÃO DE SETOR (submenus, workflow, etc.) ----
export const setorConfig = mysqlTable("setor_config", {
  id: int("id").autoincrement().primaryKey(),
  setorId: int("setorId").notNull(),
  sigla: varchar("sigla", { length: 10 }).notNull(), // SPC, RCT, DPT, JUR, RT, CT, FIN, MKT, RH
  submenus: json("submenus").$type<{ key: string; label: string; rota: string }[]>(),
  workflowStatuses: json("workflowStatuses").$type<string[]>(), // status padrão do setor
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SetorConfig = typeof setorConfig.$inferSelect;
export type InsertSetorConfig = typeof setorConfig.$inferInsert;

// ---- MODELOS DE PARCERIA (Diamante, Ouro, Prata) ----
export const modelosParceria = mysqlTable("modelos_parceria", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(), // Diamante, Ouro, Prata
  descricao: text("descricao"),
  ordem: int("ordem").default(0).notNull(), // para ordenação
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModeloParceria = typeof modelosParceria.$inferSelect;
export type InsertModeloParceria = typeof modelosParceria.$inferInsert;

// ---- COMISSÕES POR SERVIÇO E MODELO DE PARCERIA ----
export const comissoesServico = mysqlTable("comissoes_servico", {
  id: int("id").autoincrement().primaryKey(),
  servicoId: int("servicoId").notNull(),
  modeloParceriaId: int("modeloParceriaId").notNull(),
  percentualComissao: decimal("percentualComissao", { precision: 5, scale: 2 }).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComissaoServico = typeof comissoesServico.$inferSelect;
export type InsertComissaoServico = typeof comissoesServico.$inferInsert;

// ---- PARCEIRO-SERVIÇO (serviços que o parceiro trabalha + comissão customizada) ----
export const parceiroServicos = mysqlTable("parceiro_servicos", {
  id: int("id").autoincrement().primaryKey(),
  parceiroId: int("parceiroId").notNull(),
  servicoId: int("servicoId").notNull(),
  percentualCustomizado: decimal("percentualCustomizado", { precision: 5, scale: 2 }), // null = usa padrão
  aprovadoPorId: int("aprovadoPorId"), // se precisou aprovação do diretor
  aprovadoEm: timestamp("aprovadoEm"),
  statusAprovacao: mysqlEnum("statusAprovacao", ["aprovado", "pendente", "rejeitado"]).default("aprovado"),
  observacao: text("observacao"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParceiroServico = typeof parceiroServicos.$inferSelect;
export type InsertParceiroServico = typeof parceiroServicos.$inferInsert;

// ---- SLA CONFIGURÁVEL (Admin define SLA padrão por tipo de tarefa) ----
export const slaConfiguracoes = mysqlTable("sla_configuracoes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(), // ex: "Análise de Crédito", "Revisão Jurídica"
  descricao: text("descricao"),
  setorId: int("setorId"),
  slaHoras: int("slaHoras").notNull(), // SLA padrão em horas
  prioridade: mysqlEnum("prioridade", ["urgente", "alta", "media", "baixa"]).default("media").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  criadoPorId: int("criadoPorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SlaConfiguracao = typeof slaConfiguracoes.$inferSelect;
export type InsertSlaConfiguracao = typeof slaConfiguracoes.$inferInsert;

// ---- ETAPAS DE SERVIÇO (tarefas padrão que são geradas ao atribuir serviço a cliente) ----
export const servicoEtapas = mysqlTable("servico_etapas", {
  id: int("id").autoincrement().primaryKey(),
  servicoId: int("servicoId").notNull(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  descricao: text("descricao"),
  setorResponsavelId: int("setorResponsavelId"), // setor que executa esta etapa
  ordem: int("ordem").default(0).notNull(),
  slaHoras: int("slaHoras"), // SLA específico desta etapa
  obrigatoria: boolean("obrigatoria").default(true).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServicoEtapa = typeof servicoEtapas.$inferSelect;
export type InsertServicoEtapa = typeof servicoEtapas.$inferInsert;

// ---- CLIENTE-SERVIÇO (serviços atribuídos a clientes com automação de tarefas) ----
export const clienteServicos = mysqlTable("cliente_servicos", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  servicoId: int("servicoId").notNull(),
  status: mysqlEnum("status", ["ativo", "em_execucao", "concluido", "cancelado"]).default("ativo").notNull(),
  atribuidoPorId: int("atribuidoPorId"),
  dataInicio: timestamp("dataInicio"),
  dataConclusao: timestamp("dataConclusao"),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClienteServico = typeof clienteServicos.$inferSelect;
export type InsertClienteServico = typeof clienteServicos.$inferInsert;

// ---- EXECUTIVOS COMERCIAIS (internos da Evox) ----
export const executivosComerciais = mysqlTable("executivos_comerciais", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  cargo: varchar("cargo", { length: 255 }),
  userId: int("userId"), // link to users table (optional)
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExecutivoComercial = typeof executivosComerciais.$inferSelect;
export type InsertExecutivoComercial = typeof executivosComerciais.$inferInsert;

// ---- RATEIO DE COMISSÃO (parceiro + subparceiro por serviço) ----
export const rateioComissao = mysqlTable("rateio_comissao", {
  id: int("id").autoincrement().primaryKey(),
  parceiroId: int("parceiroId").notNull(), // subparceiro
  parceiroPaiId: int("parceiroPaiId").notNull(), // parceiro principal
  servicoId: int("servicoId").notNull(),
  percentualParceiro: decimal("percentualParceiro", { precision: 5, scale: 2 }).notNull(), // % do parceiro pai
  percentualSubparceiro: decimal("percentualSubparceiro", { precision: 5, scale: 2 }).notNull(), // % do subparceiro
  percentualMaximo: decimal("percentualMaximo", { precision: 5, scale: 2 }).notNull(), // teto do modelo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RateioComissao = typeof rateioComissao.$inferSelect;
export type InsertRateioComissao = typeof rateioComissao.$inferInsert;

// ---- TAREFAS DE APROVAÇÃO DE COMISSÃO ----
export const aprovacaoComissao = mysqlTable("aprovacao_comissao", {
  id: int("id").autoincrement().primaryKey(),
  parceiroId: int("parceiroId").notNull(),
  servicoId: int("servicoId").notNull(),
  percentualSolicitado: decimal("percentualSolicitado", { precision: 5, scale: 2 }).notNull(),
  percentualPadrao: decimal("percentualPadrao", { precision: 5, scale: 2 }).notNull(),
  modeloParceriaId: int("modeloParceriaId").notNull(),
  solicitadoPorId: int("solicitadoPorId").notNull(),
  solicitadoEm: timestamp("solicitadoEm").defaultNow().notNull(),
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  aprovadoPorId: int("aprovadoPorId"),
  aprovadoEm: timestamp("aprovadoEm"),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AprovacaoComissao = typeof aprovacaoComissao.$inferSelect;
export type InsertAprovacaoComissao = typeof aprovacaoComissao.$inferInsert;

// ---- METAS DE COMISSÕES POR PARCEIRO ----
export const metasComissoes = mysqlTable("metas_comissoes", {
  id: int("id").autoincrement().primaryKey(),
  parceiroId: int("parceiroId").notNull(),
  tipo: mysqlEnum("tipo", ["mensal", "trimestral", "semestral", "anual"]).notNull().default("mensal"),
  ano: int("ano").notNull(),
  mes: int("mes"), // 1-12 for mensal, null for trimestral/semestral/anual
  trimestre: int("trimestre"), // 1-4 for trimestral
  valorMeta: decimal("valorMeta", { precision: 12, scale: 2 }).notNull(),
  observacao: text("observacao"),
  criadoPor: int("criadoPor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetaComissao = typeof metasComissoes.$inferSelect;
export type InsertMetaComissao = typeof metasComissoes.$inferInsert;

// ---- HISTÓRICO DE USUÁRIOS ----
export const userHistory = mysqlTable("user_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  acao: mysqlEnum("acao", ["criacao", "edicao", "ativacao", "inativacao", "exclusao"]).notNull(),
  campo: varchar("campo", { length: 255 }),
  valorAnterior: text("valorAnterior"),
  valorNovo: text("valorNovo"),
  realizadoPorId: int("realizadoPorId"),
  realizadoPorNome: varchar("realizadoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserHistory = typeof userHistory.$inferSelect;
export type InsertUserHistory = typeof userHistory.$inferInsert;

// ---- CHAT: CANAIS ----
export const chatChannels = mysqlTable("chat_channels", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  tipo: mysqlEnum("tipo", ["geral", "setor", "projeto", "dm"]).default("setor").notNull(),
  // For DM channels: store the two user IDs
  dmUser1Id: int("dmUser1Id"),
  dmUser2Id: int("dmUser2Id"),
  setorId: int("setorId"),
  cor: varchar("cor", { length: 7 }).default("#3B82F6"),
  icone: varchar("icone", { length: 50 }).default("MessageCircle"),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive", "deleted"]).default("active").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = typeof chatChannels.$inferInsert;

// ---- CHAT: MENSAGENS ----
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userAvatar: varchar("userAvatar", { length: 500 }),
  content: text("content").notNull(),
  mentions: json("mentions").$type<{type: 'user' | 'client'; id: number; name: string}[]>(),
  // File attachment fields
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileName: varchar("fileName", { length: 500 }),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"),
  pinned: boolean("pinned").default(false).notNull(),
  pinnedBy: int("pinnedBy"),
  pinnedByName: varchar("pinnedByName", { length: 255 }),
  pinnedAt: timestamp("pinnedAt"),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  // Thread / reply
  replyToId: int("replyToId"),
  // Edit tracking
  editedAt: timestamp("editedAt"),
  editedContent: text("editedContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// ---- CHAT: PRESENÇA ONLINE ----
export const userPresence = mysqlTable("user_presence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userAvatar: varchar("userAvatar", { length: 500 }),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
  status: mysqlEnum("status", ["online", "away", "offline"]).default("online").notNull(),
});

export type UserPresence = typeof userPresence.$inferSelect;
export type InsertUserPresence = typeof userPresence.$inferInsert;

// ---- CHAT: NOTIFICAÇÕES ----
export const chatNotifications = mysqlTable("chat_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  messageId: int("messageId").notNull(),
  channelId: int("channelId").notNull(),
  tipo: mysqlEnum("tipo", ["mencao", "mensagem"]).default("mencao").notNull(),
  remetenteNome: varchar("remetenteNome", { length: 255 }).notNull(),
  preview: varchar("preview", { length: 500 }),
  lida: boolean("lida").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatNotification = typeof chatNotifications.$inferSelect;
export type InsertChatNotification = typeof chatNotifications.$inferInsert;

// ---- CHAT: REAÇÕES ----
export const chatReactions = mysqlTable("chat_reactions", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  emoji: varchar("emoji", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatReaction = typeof chatReactions.$inferSelect;
export type InsertChatReaction = typeof chatReactions.$inferInsert;

// ---- CHAT: INDICADOR DE DIGITAÇÃO ----
export const chatTypingIndicators = mysqlTable("chat_typing_indicators", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userAvatar: varchar("userAvatar", { length: 500 }),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
});

export type ChatTypingIndicator = typeof chatTypingIndicators.$inferSelect;
export type InsertChatTypingIndicator = typeof chatTypingIndicators.$inferInsert;

// ============================================================
// MÓDULO RH — GENTE & GESTÃO
// ============================================================

// ---- COLABORADORES ----
export const colaboradores = mysqlTable("colaboradores", {
  id: int("id").autoincrement().primaryKey(),
  // Dados Pessoais
  nomeCompleto: varchar("nomeCompleto", { length: 500 }).notNull(),
  dataNascimento: varchar("dataNascimento", { length: 10 }),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  rgNumero: varchar("rgNumero", { length: 20 }),
  rgOrgaoEmissor: varchar("rgOrgaoEmissor", { length: 50 }),
  rgDataEmissao: varchar("rgDataEmissao", { length: 10 }),
  ctpsNumero: varchar("ctpsNumero", { length: 50 }),
  ctpsUfEmissao: varchar("ctpsUfEmissao", { length: 2 }),
  pisPasep: varchar("pisPasep", { length: 20 }),
  nomeMae: varchar("nomeMae", { length: 500 }),
  nomePai: varchar("nomePai", { length: 500 }),
  nacionalidade: varchar("nacionalidade", { length: 100 }).default("Brasileira"),
  naturalidade: varchar("naturalidade", { length: 255 }),
  estadoCivil: mysqlEnum("estadoCivil", ["solteiro", "casado", "divorciado", "viuvo", "uniao_estavel"]),
  tituloEleitor: varchar("tituloEleitor", { length: 20 }),
  tituloEleitorZona: varchar("tituloEleitorZona", { length: 10 }),
  tituloEleitorSecao: varchar("tituloEleitorSecao", { length: 10 }),
  certificadoReservista: varchar("certificadoReservista", { length: 20 }),
  sexo: mysqlEnum("sexo", ["masculino", "feminino", "outro"]),
  // Grau de Instrução
  grauInstrucao: mysqlEnum("grauInstrucao", ["fundamental_incompleto", "fundamental_completo", "medio_incompleto", "medio_completo", "superior_incompleto", "superior_completo", "pos_graduacao", "mestrado", "doutorado"]),
  formacaoAcademica: text("formacaoAcademica"), // descrição de formação, pós, cursos
  // Contato de Emergência
  contatoEmergenciaNome: varchar("contatoEmergenciaNome", { length: 255 }),
  contatoEmergenciaTelefone: varchar("contatoEmergenciaTelefone", { length: 20 }),
  contatoEmergenciaParentesco: varchar("contatoEmergenciaParentesco", { length: 100 }),
  // Pensão e Contribuição
  pagaPensaoAlimenticia: boolean("pagaPensaoAlimenticia").default(false),
  valorPensaoAlimenticia: decimal("valorPensaoAlimenticia", { precision: 12, scale: 2 }),
  temContribuicaoAssistencial: boolean("temContribuicaoAssistencial").default(false),
  valorContribuicaoAssistencial: decimal("valorContribuicaoAssistencial", { precision: 12, scale: 2 }),
  // Endereço
  cep: varchar("cep", { length: 10 }),
  logradouro: varchar("logradouro", { length: 500 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 500 }),
  bairro: varchar("bairro", { length: 255 }),
  cidade: varchar("cidade", { length: 255 }),
  estado: varchar("estado", { length: 2 }),
  // Contato
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  // Dados Profissionais
  dataAdmissao: varchar("dataAdmissao", { length: 10 }).notNull(),
  cargo: varchar("cargo", { length: 255 }).notNull(),
  funcao: varchar("funcao", { length: 255 }),
  salarioBase: decimal("salarioBase", { precision: 12, scale: 2 }).notNull(),
  comissoes: decimal("comissoes", { precision: 12, scale: 2 }).default("0"),
  adicionais: decimal("adicionais", { precision: 12, scale: 2 }).default("0"),
  jornadaEntrada: varchar("jornadaEntrada", { length: 5 }),
  jornadaSaida: varchar("jornadaSaida", { length: 5 }),
  jornadaIntervalo: varchar("jornadaIntervalo", { length: 20 }),
  cargaHoraria: varchar("cargaHoraria", { length: 10 }),
  tipoContrato: mysqlEnum("tipoContrato", ["clt", "pj", "contrato_trabalho"]).default("clt").notNull(),
  periodoExperiencia: int("periodoExperiencia"), // dias
  localTrabalho: mysqlEnum("localTrabalho", ["home_office", "barueri", "uberaba"]).default("barueri"),
  valeTransporte: boolean("valeTransporte").default(false).notNull(),
  // Dados Bancários
  banco: varchar("banco", { length: 100 }),
  agencia: varchar("agencia", { length: 20 }),
  conta: varchar("conta", { length: 30 }),
  tipoConta: mysqlEnum("tipoConta", ["corrente", "poupanca"]),
  chavePix: varchar("chavePix", { length: 255 }),
  // Jornada - dias da semana (JSON array)
  jornadaDias: json("jornadaDias").$type<string[]>(),
  // Saúde
  asoAdmissionalApto: boolean("asoAdmissionalApto").default(true),
  asoAdmissionalData: varchar("asoAdmissionalData", { length: 10 }),
  // Dependentes (JSON array)
  dependentes: json("dependentes").$type<{nome: string; cpf: string; dataNascimento: string; parentesco: string; dependenteIR?: boolean; dependentePlanoSaude?: boolean}[]>(),
  // Vínculo com setor
  setorId: int("setorId"),
  nivelHierarquico: mysqlEnum("nivelHierarquico", ["estagiario", "auxiliar", "assistente", "analista_jr", "analista_pl", "analista_sr", "coordenador", "supervisor", "gerente", "diretor"]),
  // Vínculo com user (opcional)
  userId: int("userId"),
  foto: varchar("foto", { length: 500 }),
  statusColaborador: mysqlEnum("statusColaborador", ["ativo", "inativo", "afastado", "licenca", "atestado", "desligado", "ferias", "experiencia", "aviso_previo"]).default("ativo").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  dataDesligamento: varchar("dataDesligamento", { length: 10 }),
  motivoDesligamento: text("motivoDesligamento"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Colaborador = typeof colaboradores.$inferSelect;
export type InsertColaborador = typeof colaboradores.$inferInsert;

// ---- FÉRIAS ----
export const ferias = mysqlTable("ferias", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  // Período aquisitivo
  periodoAquisitivoInicio: varchar("periodoAquisitivoInicio", { length: 10 }).notNull(),
  periodoAquisitivoFim: varchar("periodoAquisitivoFim", { length: 10 }).notNull(),
  // Período concessivo
  periodoConcessivoFim: varchar("periodoConcessivoFim", { length: 10 }).notNull(),
  // Férias programadas (pode ser fracionada em até 3 períodos)
  periodo1Inicio: varchar("periodo1Inicio", { length: 10 }),
  periodo1Fim: varchar("periodo1Fim", { length: 10 }),
  periodo1Dias: int("periodo1Dias"),
  periodo2Inicio: varchar("periodo2Inicio", { length: 10 }),
  periodo2Fim: varchar("periodo2Fim", { length: 10 }),
  periodo2Dias: int("periodo2Dias"),
  periodo3Inicio: varchar("periodo3Inicio", { length: 10 }),
  periodo3Fim: varchar("periodo3Fim", { length: 10 }),
  periodo3Dias: int("periodo3Dias"),
  diasTotais: int("diasTotais").default(30),
  faltasInjustificadas: int("faltasInjustificadas").default(0),
  diasDireito: int("diasDireito").default(30), // calculado com base nas faltas
  status: mysqlEnum("status", ["pendente", "programada", "em_gozo", "concluida", "vencida"]).default("pendente").notNull(),
  avisoPrevioData: varchar("avisoPrevioData", { length: 10 }), // 30 dias antes
  alertas: json("alertas").$type<{tipo: string; mensagem: string; gravidade: string}[]>(),
  observacao: text("observacao"),
  aprovadoPorId: int("aprovadoPorId"),
  aprovadoEm: timestamp("aprovadoEm"),
  // Fluxo de aprovação gestor + diretoria
  aprovadorGestorId: int("aprovadorGestorId"),
  aprovadorGestorStatus: mysqlEnum("aprovadorGestorStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorGestorEm: timestamp("aprovadorGestorEm"),
  aprovadorDiretoriaId: int("aprovadorDiretoriaId"),
  aprovadorDiretoriaStatus: mysqlEnum("aprovadorDiretoriaStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorDiretoriaEm: timestamp("aprovadorDiretoriaEm"),
  justificativaRecusa: text("justificativaRecusa"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ferias = typeof ferias.$inferSelect;
export type InsertFerias = typeof ferias.$inferInsert;

// ---- SOLICITAÇÕES DE FOLGA/FÉRIAS ----
export const solicitacoesFolga = mysqlTable("solicitacoes_folga", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  tipo: mysqlEnum("tipo", ["ferias", "folga", "abono", "compensacao"]).notNull(),
  dataInicio: varchar("dataInicio", { length: 10 }).notNull(),
  dataFim: varchar("dataFim", { length: 10 }).notNull(),
  diasSolicitados: int("diasSolicitados").notNull(),
  motivo: text("motivo"),
  status: mysqlEnum("status", ["pendente", "aprovada", "recusada"]).default("pendente").notNull(),
  // Aprovação hierárquica
  aprovadorRhId: int("aprovadorRhId"),
  aprovadorRhStatus: mysqlEnum("aprovadorRhStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorRhEm: timestamp("aprovadorRhEm"),
  aprovadorChefeId: int("aprovadorChefeId"), // coordenador/gerente/diretor
  aprovadorChefeStatus: mysqlEnum("aprovadorChefeStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorChefeEm: timestamp("aprovadorChefeEm"),
  justificativaRecusa: text("justificativaRecusa"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SolicitacaoFolga = typeof solicitacoesFolga.$inferSelect;
export type InsertSolicitacaoFolga = typeof solicitacoesFolga.$inferInsert;

// ---- TAREFAS DO SETOR (Nova Tarefa) ----
export const tarefasSetor = mysqlTable("tarefas_setor", {
  id: int("id").autoincrement().primaryKey(),
  setorId: int("setorId").notNull(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  descricao: text("descricao"),
  responsavelId: int("responsavelId"),
  responsavelNome: varchar("responsavelNome", { length: 255 }),
  prioridade: mysqlEnum("prioridade", ["baixa", "media", "alta", "urgente"]).default("media").notNull(),
  status: mysqlEnum("status", ["a_fazer", "em_andamento", "concluida", "cancelada"]).default("a_fazer").notNull(),
  dataInicio: varchar("dataInicio", { length: 10 }),
  dataFim: varchar("dataFim", { length: 10 }),
  dataConclusao: varchar("dataConclusao", { length: 10 }),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TarefaSetor = typeof tarefasSetor.$inferSelect;
export type InsertTarefaSetor = typeof tarefasSetor.$inferInsert;

// ---- AÇÕES E BENEFÍCIOS ----
export const acoesBeneficios = mysqlTable("acoes_beneficios", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  tipo: mysqlEnum("tipo", ["fit", "solidaria", "campanha_doacao", "sustentabilidade", "engajamento", "beneficio", "outro"]).notNull(),
  descricao: text("descricao"),
  dataInicio: varchar("dataInicio", { length: 10 }),
  dataFim: varchar("dataFim", { length: 10 }),
  status: mysqlEnum("status", ["planejada", "ativa", "concluida", "cancelada"]).default("planejada").notNull(),
  participantes: json("participantes").$type<{colaboradorId: number; nome: string; confirmado: boolean}[]>(),
  metaParticipacao: int("metaParticipacao"),
  engajamentoScore: int("engajamentoScore"),
  observacao: text("observacao"),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  horario: varchar("horario", { length: 20 }),
  local: varchar("local", { length: 500 }),
  arteConviteUrl: varchar("arteConviteUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcaoBeneficio = typeof acoesBeneficios.$inferSelect;
export type InsertAcaoBeneficio = typeof acoesBeneficios.$inferInsert;

// ---- ATESTADOS E LICENÇAS ----
export const atestadosLicencas = mysqlTable("atestados_licencas", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  tipo: mysqlEnum("tipo", ["atestado_medico", "licenca_maternidade", "licenca_paternidade", "licenca_casamento", "licenca_obito", "licenca_medica", "licenca_militar", "licenca_vestibular", "doacao_sangue", "acompanhamento_medico", "mesario", "day_off", "outro"]).notNull(),
  dataInicio: varchar("dataInicio", { length: 10 }).notNull(),
  dataFim: varchar("dataFim", { length: 10 }).notNull(),
  diasAfastamento: int("diasAfastamento").notNull(),
  cid: varchar("cid", { length: 10 }),
  medico: varchar("medico", { length: 255 }),
  crm: varchar("crm", { length: 20 }),
  observacao: text("observacao"),
  documentoUrl: varchar("documentoUrl", { length: 500 }),
  status: mysqlEnum("status", ["ativo", "encerrado", "cancelado"]).default("ativo").notNull(),
  registradoPorId: int("registradoPorId"),
  registradoPorNome: varchar("registradoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AtestadoLicenca = typeof atestadosLicencas.$inferSelect;
export type InsertAtestadoLicenca = typeof atestadosLicencas.$inferInsert;

// ---- PLANOS DE CARREIRA & DESENVOLVIMENTO ----
export const planosCarreira = mysqlTable("planos_carreira", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  descricao: text("descricao"),
  colaboradorId: int("colaboradorId"),
  setorId: int("setorId"),
  nivelAtual: varchar("nivelAtual", { length: 100 }),
  nivelAlvo: varchar("nivelAlvo", { length: 100 }),
  prazoMeses: int("prazoMeses"),
  status: mysqlEnum("status", ["em_andamento", "concluido", "pausado", "cancelado"]).default("em_andamento").notNull(),
  metas: json("metas").$type<{descricao: string; concluida: boolean; prazo?: string}[]>(),
  competencias: json("competencias").$type<{nome: string; nivelAtual: number; nivelAlvo: number}[]>(),
  treinamentos: json("treinamentos").$type<{nome: string; concluido: boolean; data?: string}[]>(),
  observacao: text("observacao"),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlanoCarreira = typeof planosCarreira.$inferSelect;
export type InsertPlanoCarreira = typeof planosCarreira.$inferInsert;


// ---- AVALIAÇÃO DE DESEMPENHO 360° ----
export const ciclosAvaliacao = mysqlTable("ciclos_avaliacao", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  descricao: text("descricao"),
  dataInicio: varchar("dataInicio", { length: 10 }).notNull(),
  dataFim: varchar("dataFim", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["rascunho", "em_andamento", "encerrado"]).default("rascunho").notNull(),
  criterios: json("criterios").$type<{nome: string; peso: number; descricao?: string}[]>(),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CicloAvaliacao = typeof ciclosAvaliacao.$inferSelect;
export type InsertCicloAvaliacao = typeof ciclosAvaliacao.$inferInsert;

export const avaliacoes = mysqlTable("avaliacoes", {
  id: int("id").autoincrement().primaryKey(),
  cicloId: int("cicloId").notNull(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 500 }),
  avaliadorId: int("avaliadorId").notNull(),
  avaliadorNome: varchar("avaliadorNome", { length: 500 }),
  tipoAvaliador: mysqlEnum("tipoAvaliador", ["gestor", "par", "autoavaliacao", "subordinado"]).notNull(),
  notas: json("notas").$type<{criterio: string; nota: number; comentario?: string}[]>(),
  notaGeral: decimal("notaGeral", { precision: 4, scale: 2 }),
  comentarioGeral: text("comentarioGeral"),
  pontosFortes: text("pontosFortes"),
  pontosDesenvolvimento: text("pontosDesenvolvimento"),
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluida"]).default("pendente").notNull(),
  planoCarreiraId: int("planoCarreiraId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Avaliacao = typeof avaliacoes.$inferSelect;
export type InsertAvaliacao = typeof avaliacoes.$inferInsert;

// ---- DOCUMENTOS DO COLABORADOR ----
export const colaboradorDocumentos = mysqlTable("colaborador_documentos", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  tipo: mysqlEnum("tipo", ["foto", "rg", "ctps", "aso", "contrato", "comprovante_residencia", "outro"]).notNull(),
  nomeArquivo: varchar("nomeArquivo", { length: 500 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  tamanho: int("tamanho"), // bytes
  enviadoPorId: int("enviadoPorId"),
  enviadoPorNome: varchar("enviadoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ColaboradorDocumento = typeof colaboradorDocumentos.$inferSelect;
export type InsertColaboradorDocumento = typeof colaboradorDocumentos.$inferInsert;

// ---- METAS INDIVIDUAIS (KPIs) ----
export const metasIndividuais = mysqlTable("metas_individuais", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 500 }),
  cicloId: int("cicloId"), // vínculo com ciclo de avaliação
  titulo: varchar("titulo", { length: 500 }).notNull(),
  descricao: text("descricao"),
  categoria: mysqlEnum("categoria", ["produtividade", "qualidade", "financeiro", "desenvolvimento", "cliente", "processo", "outro"]).default("outro").notNull(),
  unidadeMedida: varchar("unidadeMedida", { length: 50 }), // %, R$, unidades, etc.
  valorMeta: decimal("valorMeta", { precision: 12, scale: 2 }).notNull(), // meta alvo
  valorAtual: decimal("valorAtual", { precision: 12, scale: 2 }).default("0"), // progresso atual
  peso: int("peso").default(1), // peso da meta no cálculo geral
  dataInicio: varchar("dataInicio", { length: 10 }),
  dataFim: varchar("dataFim", { length: 10 }),
  status: mysqlEnum("status", ["nao_iniciada", "em_andamento", "concluida", "cancelada"]).default("nao_iniciada").notNull(),
  observacao: text("observacao"),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetaIndividual = typeof metasIndividuais.$inferSelect;
export type InsertMetaIndividual = typeof metasIndividuais.$inferInsert;

// ---- HISTÓRICO DE STATUS DO COLABORADOR ----
export const historicoStatusColaborador = mysqlTable("historico_status_colaborador", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  statusAnterior: varchar("statusAnterior", { length: 50 }).notNull(),
  statusNovo: varchar("statusNovo", { length: 50 }).notNull(),
  motivo: text("motivo"),
  origemModulo: varchar("origemModulo", { length: 50 }), // 'ferias', 'atestado', 'manual', 'desligamento'
  origemRegistroId: int("origemRegistroId"), // ID do registro que originou a mudança
  alteradoPorId: int("alteradoPorId"),
  alteradoPorNome: varchar("alteradoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HistoricoStatusColaborador = typeof historicoStatusColaborador.$inferSelect;
export type InsertHistoricoStatusColaborador = typeof historicoStatusColaborador.$inferInsert;


// ---- ONBOARDING DIGITAL ----
export const onboardingTemplates = mysqlTable("onboarding_templates", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true).notNull(),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;
export type InsertOnboardingTemplate = typeof onboardingTemplates.$inferInsert;

export const onboardingEtapasTemplate = mysqlTable("onboarding_etapas_template", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  categoria: mysqlEnum("categoria", ["documentos", "treinamentos", "acessos", "equipamentos", "integracao", "outros"]).default("outros").notNull(),
  ordem: int("ordem").default(0).notNull(),
  obrigatoria: boolean("obrigatoria").default(true).notNull(),
  prazoEmDias: int("prazoEmDias").default(7),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OnboardingEtapaTemplate = typeof onboardingEtapasTemplate.$inferSelect;
export type InsertOnboardingEtapaTemplate = typeof onboardingEtapasTemplate.$inferInsert;

export const onboardingColaborador = mysqlTable("onboarding_colaborador", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  templateId: int("templateId"),
  templateNome: varchar("templateNome", { length: 255 }),
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluido", "cancelado"]).default("pendente").notNull(),
  dataInicio: varchar("dataInicio", { length: 10 }),
  dataConclusao: varchar("dataConclusao", { length: 10 }),
  observacao: text("observacao"),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingColaborador = typeof onboardingColaborador.$inferSelect;
export type InsertOnboardingColaborador = typeof onboardingColaborador.$inferInsert;

export const onboardingEtapas = mysqlTable("onboarding_etapas", {
  id: int("id").autoincrement().primaryKey(),
  onboardingId: int("onboardingId").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  categoria: mysqlEnum("categoria", ["documentos", "treinamentos", "acessos", "equipamentos", "integracao", "outros"]).default("outros").notNull(),
  ordem: int("ordem").default(0).notNull(),
  obrigatoria: boolean("obrigatoria").default(true).notNull(),
  prazoEmDias: int("prazoEmDias").default(7),
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluida", "nao_aplicavel"]).default("pendente").notNull(),
  dataConclusao: varchar("dataConclusao", { length: 10 }),
  concluidoPorId: int("concluidoPorId"),
  concluidoPorNome: varchar("concluidoPorNome", { length: 255 }),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingEtapa = typeof onboardingEtapas.$inferSelect;
export type InsertOnboardingEtapa = typeof onboardingEtapas.$inferInsert;

// ---- PESQUISA DE CLIMA ORGANIZACIONAL ----
export const pesquisasClima = mysqlTable("pesquisas_clima", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  status: mysqlEnum("status", ["rascunho", "ativa", "encerrada", "cancelada"]).default("rascunho").notNull(),
  anonima: boolean("anonima").default(true).notNull(),
  dataInicio: varchar("dataInicio", { length: 10 }),
  dataFim: varchar("dataFim", { length: 10 }),
  totalRespostas: int("totalRespostas").default(0),
  criadoPorId: int("criadoPorId"),
  criadoPorNome: varchar("criadoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PesquisaClima = typeof pesquisasClima.$inferSelect;
export type InsertPesquisaClima = typeof pesquisasClima.$inferInsert;

export const perguntasClima = mysqlTable("perguntas_clima", {
  id: int("id").autoincrement().primaryKey(),
  pesquisaId: int("pesquisaId").notNull(),
  texto: text("texto").notNull(),
  tipo: mysqlEnum("tipo", ["escala", "multipla_escolha", "texto_livre", "sim_nao"]).default("escala").notNull(),
  opcoes: json("opcoes"), // array of options for multipla_escolha
  ordem: int("ordem").default(0).notNull(),
  obrigatoria: boolean("obrigatoria").default(true).notNull(),
  categoria: varchar("categoria", { length: 100 }), // liderança, ambiente, benefícios, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerguntaClima = typeof perguntasClima.$inferSelect;
export type InsertPerguntaClima = typeof perguntasClima.$inferInsert;

export const respostasClima = mysqlTable("respostas_clima", {
  id: int("id").autoincrement().primaryKey(),
  pesquisaId: int("pesquisaId").notNull(),
  perguntaId: int("perguntaId").notNull(),
  respondentId: int("respondentId"), // null if anonymous
  valorEscala: int("valorEscala"), // 1-5 for escala type
  valorTexto: text("valorTexto"), // for texto_livre
  valorOpcao: varchar("valorOpcao", { length: 255 }), // for multipla_escolha or sim_nao
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RespostaClima = typeof respostasClima.$inferSelect;
export type InsertRespostaClima = typeof respostasClima.$inferInsert;

// ---- BANCO DE HORAS ----
export const bancoHoras = mysqlTable("banco_horas", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  tipo: mysqlEnum("tipo", ["extra", "compensacao", "ajuste_positivo", "ajuste_negativo"]).default("extra").notNull(),
  data: varchar("data", { length: 10 }).notNull(),
  horas: decimal("horas", { precision: 6, scale: 2 }).notNull(), // always positive, tipo determines sign
  motivo: text("motivo"),
  aprovado: boolean("aprovado").default(false).notNull(),
  aprovadoPorId: int("aprovadoPorId"),
  aprovadoPorNome: varchar("aprovadoPorNome", { length: 255 }),
  registradoPorId: int("registradoPorId"),
  registradoPorNome: varchar("registradoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BancoHoras = typeof bancoHoras.$inferSelect;
export type InsertBancoHoras = typeof bancoHoras.$inferInsert;


// ---- VALE TRANSPORTE ----
export const valeTransporte = mysqlTable("vale_transporte", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  mesReferencia: int("mesReferencia").notNull(),
  anoReferencia: int("anoReferencia").notNull(),
  diasUteis: int("diasUteis").notNull(),
  passagensPorDia: int("passagensPorDia").notNull().default(2),
  valorPassagem: decimal("valorPassagem", { precision: 8, scale: 2 }).notNull(),
  cidadePassagem: mysqlEnum("cidadePassagem", ["sp", "barueri"]).notNull().default("sp"),
  valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }).notNull(),
  descontoFolha: decimal("descontoFolha", { precision: 12, scale: 2 }).default("0"),
  observacao: text("observacao"),
  registradoPorId: int("registradoPorId"),
  registradoPorNome: varchar("registradoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ValeTransporte = typeof valeTransporte.$inferSelect;
export type InsertValeTransporte = typeof valeTransporte.$inferInsert;

// ---- ACADEMIA BENEFÍCIO ----
export const academiaBeneficio = mysqlTable("academia_beneficio", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  nomeAcademia: varchar("nomeAcademia", { length: 255 }).notNull(),
  plano: varchar("plano", { length: 255 }),
  valorPlano: decimal("valorPlano", { precision: 12, scale: 2 }).notNull(),
  descontoFolha: boolean("descontoFolha").default(false),
  valorDesconto: decimal("valorDesconto", { precision: 12, scale: 2 }),
  dataEntrada: varchar("dataEntrada", { length: 10 }),
  fidelidade: boolean("fidelidade").default(false),
  fidelidadeMeses: int("fidelidadeMeses"),
  ativo: boolean("ativo").default(true).notNull(),
  observacao: text("observacao"),
  registradoPorId: int("registradoPorId"),
  registradoPorNome: varchar("registradoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcademiaBeneficio = typeof academiaBeneficio.$inferSelect;
export type InsertAcademiaBeneficio = typeof academiaBeneficio.$inferInsert;

// ---- COMISSÃO RH ----
export const comissaoRh = mysqlTable("comissao_rh", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  tipo: mysqlEnum("tipo", ["evox_monitor", "dpt", "credito", "outro"]).notNull(),
  descricao: text("descricao"),
  mesReferencia: int("mesReferencia").notNull(),
  anoReferencia: int("anoReferencia").notNull(),
  valorBase: decimal("valorBase", { precision: 12, scale: 2 }).notNull(),
  percentual: decimal("percentual", { precision: 5, scale: 2 }),
  valorComissao: decimal("valorComissao", { precision: 12, scale: 2 }).notNull(),
  observacao: text("observacao"),
  registradoPorId: int("registradoPorId"),
  registradoPorNome: varchar("registradoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComissaoRh = typeof comissaoRh.$inferSelect;
export type InsertComissaoRh = typeof comissaoRh.$inferInsert;

// ---- DAY OFF (ANIVERSÁRIO) ----
export const dayOff = mysqlTable("day_off", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  dataAniversario: varchar("dataAniversario", { length: 10 }).notNull(),
  dataOriginal: varchar("dataOriginal", { length: 10 }).notNull(),
  dataEfetiva: varchar("dataEfetiva", { length: 10 }).notNull(),
  alterado: boolean("alterado").default(false).notNull(),
  motivoAlteracao: text("motivoAlteracao"),
  status: mysqlEnum("status", ["pendente", "aprovado", "recusado", "utilizado"]).notNull().default("pendente"),
  aprovadorGestorId: int("aprovadorGestorId"),
  aprovadorGestorStatus: mysqlEnum("aprovadorGestorStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorGestorEm: timestamp("aprovadorGestorEm"),
  aprovadorRhId: int("aprovadorRhId"),
  aprovadorRhStatus: mysqlEnum("aprovadorRhStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorRhEm: timestamp("aprovadorRhEm"),
  aprovadorDiretoriaId: int("aprovadorDiretoriaId"),
  aprovadorDiretoriaStatus: mysqlEnum("aprovadorDiretoriaStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorDiretoriaEm: timestamp("aprovadorDiretoriaEm"),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DayOff = typeof dayOff.$inferSelect;
export type InsertDayOff = typeof dayOff.$inferInsert;

// ---- DOAÇÃO DE SANGUE ----
export const doacaoSangue = mysqlTable("doacao_sangue", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  dataDoacao: varchar("dataDoacao", { length: 10 }).notNull(),
  prazoFolga: varchar("prazoFolga", { length: 10 }).notNull(),
  dataFolga: varchar("dataFolga", { length: 10 }),
  comprovanteUrl: varchar("comprovanteUrl", { length: 500 }),
  status: mysqlEnum("status", ["pendente", "aprovado", "recusado", "utilizado"]).notNull().default("pendente"),
  aprovadorGestorId: int("aprovadorGestorId"),
  aprovadorGestorStatus: mysqlEnum("aprovadorGestorStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorGestorEm: timestamp("aprovadorGestorEm"),
  aprovadorRhId: int("aprovadorRhId"),
  aprovadorRhStatus: mysqlEnum("aprovadorRhStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorRhEm: timestamp("aprovadorRhEm"),
  aprovadorDiretoriaId: int("aprovadorDiretoriaId"),
  aprovadorDiretoriaStatus: mysqlEnum("aprovadorDiretoriaStatus", ["pendente", "aprovado", "recusado"]).default("pendente"),
  aprovadorDiretoriaEm: timestamp("aprovadorDiretoriaEm"),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DoacaoSangue = typeof doacaoSangue.$inferSelect;
export type InsertDoacaoSangue = typeof doacaoSangue.$inferInsert;

// ---- REAJUSTES SALARIAIS ----
export const reajustesSalariais = mysqlTable("reajustes_salariais", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  tipo: mysqlEnum("tipo", ["dois_anos", "sindical", "promocao", "merito", "outro"]).notNull(),
  percentual: decimal("percentual", { precision: 5, scale: 2 }).notNull(),
  salarioAnterior: decimal("salarioAnterior", { precision: 12, scale: 2 }).notNull(),
  salarioNovo: decimal("salarioNovo", { precision: 12, scale: 2 }).notNull(),
  dataEfetivacao: varchar("dataEfetivacao", { length: 10 }).notNull(),
  mesReferencia: int("mesReferencia"),
  anoReferencia: int("anoReferencia"),
  automatico: boolean("automatico").default(false).notNull(),
  observacao: text("observacao"),
  registradoPorId: int("registradoPorId"),
  registradoPorNome: varchar("registradoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReajusteSalarial = typeof reajustesSalariais.$inferSelect;
export type InsertReajusteSalarial = typeof reajustesSalariais.$inferInsert;

// ---- APONTAMENTOS DA FOLHA ----
export const apontamentosFolha = mysqlTable("apontamentos_folha", {
  id: int("id").autoincrement().primaryKey(),
  colaboradorId: int("colaboradorId").notNull(),
  colaboradorNome: varchar("colaboradorNome", { length: 255 }).notNull(),
  mesReferencia: int("mesReferencia").notNull(),
  anoReferencia: int("anoReferencia").notNull(),
  tipo: mysqlEnum("tipo", ["vale_transporte", "academia", "comissao", "reajuste_sindical", "reajuste_dois_anos", "pensao_alimenticia", "contribuicao_assistencial", "banco_horas", "outro"]).notNull(),
  descricao: varchar("descricao", { length: 500 }),
  valor: decimal("valor", { precision: 12, scale: 2 }).notNull(),
  natureza: mysqlEnum("natureza", ["provento", "desconto"]).notNull().default("provento"),
  origemId: int("origemId"),
  origemTabela: varchar("origemTabela", { length: 100 }),
  observacao: text("observacao"),
  registradoPorId: int("registradoPorId"),
  registradoPorNome: varchar("registradoPorNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApontamentoFolha = typeof apontamentosFolha.$inferSelect;
export type InsertApontamentoFolha = typeof apontamentosFolha.$inferInsert;

// ---- NÍVEIS DE CARGO ----
export const niveisCargo = mysqlTable("niveis_cargo", {
  id: int("id").autoincrement().primaryKey(),
  setorId: int("setorId").notNull(),
  cargo: varchar("cargo", { length: 255 }).notNull(),
  nivel: int("nivel").notNull().default(1),
  descricaoNivel: varchar("descricaoNivel", { length: 255 }),
  salarioMinimo: decimal("salarioMinimo", { precision: 12, scale: 2 }),
  salarioMaximo: decimal("salarioMaximo", { precision: 12, scale: 2 }),
  grauInstrucaoMinimo: mysqlEnum("grauInstrucaoMinimo", ["fundamental_incompleto", "fundamental_completo", "medio_incompleto", "medio_completo", "superior_incompleto", "superior_completo", "pos_graduacao", "mestrado", "doutorado"]),
  requisitos: text("requisitos"),
  competencias: text("competencias"),
  tempoMinimoMeses: int("tempoMinimoMeses"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NivelCargo = typeof niveisCargo.$inferSelect;
export type InsertNivelCargo = typeof niveisCargo.$inferInsert;
