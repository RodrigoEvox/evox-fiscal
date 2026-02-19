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
  nivelAcesso: mysqlEnum("nivelAcesso", ["diretor", "gerente", "coordenador", "analista_fiscal", "suporte_comercial"]).default("analista_fiscal").notNull(),
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
  tipo: mysqlEnum("tipo", ["procuracao_vencendo", "procuracao_vencida", "analise_concluida", "nova_tese", "tarefa_atribuida", "tarefa_sla_vencendo", "tarefa_comentario", "geral"]).notNull(),
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
