import {
  int, mysqlEnum, mysqlTable, text, timestamp, varchar,
  boolean, bigint, json, decimal
} from "drizzle-orm/mysql-core";

// ---- USERS (auth) ----
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  nivelAcesso: mysqlEnum("nivelAcesso", ["administrador", "suporte_comercial", "analista_fiscal"]).default("analista_fiscal").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---- PARCEIROS ----
export const parceiros = mysqlTable("parceiros", {
  id: int("id").autoincrement().primaryKey(),
  nomeCompleto: varchar("nomeCompleto", { length: 255 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  endereco: text("endereco"),
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
  razaoSocial: varchar("razaoSocial", { length: 500 }).notNull(),
  nomeFantasia: varchar("nomeFantasia", { length: 500 }),
  dataAbertura: varchar("dataAbertura", { length: 20 }),
  regimeTributario: mysqlEnum("regimeTributario", ["simples_nacional", "lucro_presumido", "lucro_real"]).notNull(),
  situacaoCadastral: mysqlEnum("situacaoCadastral", ["ativa", "baixada", "inapta", "suspensa", "nula"]).default("ativa").notNull(),
  cnaePrincipal: varchar("cnaePrincipal", { length: 20 }),
  cnaePrincipalDescricao: text("cnaePrincipalDescricao"),
  cnaesSecundarios: json("cnaesSecundarios").$type<string[]>(),
  segmentoEconomico: varchar("segmentoEconomico", { length: 255 }),
  naturezaJuridica: varchar("naturezaJuridica", { length: 255 }),
  endereco: text("endereco"),
  estado: varchar("estado", { length: 2 }),
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
  // Parceiro
  parceiroId: int("parceiroId"),
  // Procuração
  procuracaoHabilitada: boolean("procuracaoHabilitada").default(false).notNull(),
  procuracaoCertificado: varchar("procuracaoCertificado", { length: 100 }),
  procuracaoValidade: varchar("procuracaoValidade", { length: 20 }),
  // Exceções
  excecoesEspecificidades: text("excecoesEspecificidades"),
  // Análise
  prioridade: mysqlEnum("prioridade", ["alta", "media", "baixa"]).default("media").notNull(),
  scoreOportunidade: int("scoreOportunidade").default(0),
  redFlags: json("redFlags").$type<any[]>(),
  alertasInformacao: json("alertasInformacao").$type<any[]>(),
  // Rastreamento
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
  tipo: mysqlEnum("tipo", ["procuracao_vencendo", "procuracao_vencida", "analise_concluida", "nova_tese", "geral"]).notNull(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  mensagem: text("mensagem").notNull(),
  lida: boolean("lida").default(false).notNull(),
  usuarioId: int("usuarioId"),
  clienteId: int("clienteId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;
