// ============================================================
// Evox Fiscal — Sistema de Análise de Oportunidades Tributárias
// Types & Data Models (v2)
// ============================================================

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
export type SituacaoCadastral = 'ativa' | 'baixada' | 'inapta' | 'suspensa' | 'nula';
export type TipoTese = 'exclusao_base' | 'credito_presumido' | 'recuperacao_indebito' | 'tese_judicial' | 'tese_administrativa';
export type GrauRisco = 'baixo' | 'medio' | 'alto';
export type ClassificacaoTese = 'pacificada' | 'judicial' | 'administrativa' | 'controversa';
export type PotencialFinanceiro = 'muito_alto' | 'alto' | 'medio' | 'baixo';
export type PotencialMercadologico = 'muito_alto' | 'alto' | 'medio' | 'baixo';
export type RecomendacaoEstrategica = 'judicial' | 'administrativa' | 'preventiva' | 'nao_recomendada';
export type PrioridadeCliente = 'alta' | 'media' | 'baixa';
export type NivelAcesso = 'administrador' | 'suporte_comercial' | 'analista_fiscal';
export type StatusApuracao = 'a_fazer' | 'fazendo' | 'concluido' | string;
export type TipoParceiro = 'pf' | 'pj';
export type CertificadoDigital = 'evox_fiscal' | 'gercino_neto' | 'outro';

// ---- RED FLAGS ----
export interface RedFlag {
  id: string;
  tipo: 'abertura_recente' | 'valor_guias_baixo' | 'situacao_irregular' | 'sem_tese_alto_potencial';
  descricao: string;
  impacto: 'nao_prioritario' | 'atencao' | 'bloqueante';
  valor?: string;
}

export interface AlertaInformacao {
  campo: string;
  mensagem: string;
  obrigatorio: boolean;
  justificativa?: string;
}

// ---- USUARIO ----
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivelAcesso: NivelAcesso;
  ativo: boolean;
  dataCriacao: string;
}

// ---- PARCEIRO COMERCIAL ----
export interface Parceiro {
  id: string;
  tipo: TipoParceiro;
  nomeCompleto: string;
  cpf?: string;
  razaoSocial?: string;
  cnpj?: string;
  telefone: string;
  email: string;
  endereco: string;
  ativo: boolean;
  dataCadastro: string;
}

// ---- PROCURACAO ELETRONICA ----
export interface ProcuracaoEletronica {
  habilitada: boolean;
  certificadoDigital?: CertificadoDigital;
  certificadoOutroNome?: string;
  dataValidade?: string;
}

// ---- CLIENTE ----
export interface Cliente {
  id: string;
  // Dados básicos
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  dataAbertura: string;
  regimeTributario: RegimeTributario;
  historicoRegimes?: RegimeTributario[];
  situacaoCadastral: SituacaoCadastral;
  // CNAE
  cnaePrincipal: string;
  cnaePrincipalDescricao: string;
  cnaesSecundarios?: string[];
  // Segmento
  segmentoEconomico: string;
  naturezaJuridica: string;
  // Endereço
  endereco?: string;
  // Atividades
  industrializa: boolean;
  comercializa: boolean;
  prestaServicos: boolean;
  // Tributos
  contribuinteICMS: boolean;
  contribuinteIPI: boolean;
  regimeMonofasico: boolean;
  // Financeiro
  folhaPagamentoMedia: number;
  faturamentoMedioMensal: number;
  valorMedioGuias: number;
  // Jurídico
  processosJudiciaisAtivos: boolean;
  parcelamentosAtivos: boolean;
  // Localização
  estado: string;
  atividadePrincipalDescritivo: string;
  // Parceiro Comercial
  parceiroId?: string;
  // Procuração Eletrônica
  procuracao: ProcuracaoEletronica;
  // Exceções e Especificidades
  excecoesEspecificidades?: string;
  // Metadados
  dataCadastro: string;
  horaCadastro?: string;
  usuarioCadastroId?: string;
  usuarioCadastroNome?: string;
  dataUltimaAnalise?: string;
  // RED FLAGS e Alertas
  redFlags: RedFlag[];
  alertasInformacao: AlertaInformacao[];
  prioridade: PrioridadeCliente;
  scoreOportunidade?: number;
  observacoes?: string;
}

// ---- FILA DE APURAÇÃO ----
export interface HistoricoAlteracao {
  id: string;
  data: string;
  usuarioNome: string;
  acao: string;
  detalhes: string;
}

export interface ItemFilaApuracao {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpj: string;
  parceiroNome?: string;
  prioridade: PrioridadeCliente;
  prioridadeManual?: boolean;
  status: StatusApuracao;
  ordem: number;
  // Timestamps
  dataInsercao: string;
  dataInicioApuracao?: string;
  dataConclusao?: string;
  // Analista
  analistaId?: string;
  analistaNome?: string;
  // Tempo
  tempoGastoMs?: number; // tempo acumulado em ms
  // Procuração
  procuracaoHabilitada: boolean;
  procuracaoValidade?: string;
  // Histórico
  historico: HistoricoAlteracao[];
}

// ---- TESE ----
export interface Tese {
  id: string;
  nome: string;
  tributoEnvolvido: string;
  tipo: TipoTese;
  classificacao: ClassificacaoTese;
  potencialFinanceiro: PotencialFinanceiro;
  potencialMercadologico: PotencialMercadologico;
  requisitosObjetivos: string[];
  requisitosImpeditivos: string[];
  fundamentacaoLegal: string;
  jurisprudenciaRelevante: string;
  parecerTecnicoJuridico: string;
  prazoPrescricional: string;
  necessidadeAcaoJudicial: boolean;
  viaAdministrativa: boolean;
  grauRisco: GrauRisco;
  documentosNecessarios: string[];
  formulaEstimativaCredito: string;
  aplicavelComercio: boolean;
  aplicavelIndustria: boolean;
  aplicavelServico: boolean;
  aplicavelContribuinteICMS: boolean;
  aplicavelContribuinteIPI: boolean;
  aplicavelLucroReal: boolean;
  aplicavelLucroPresumido: boolean;
  aplicavelSimplesNacional: boolean;
  aplicavelPos2017: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  versao: number;
  ativa: boolean;
}

// ---- ANÁLISE ----
export interface AnaliseTeseCliente {
  teseId: string;
  teseNome: string;
  aplicavel: boolean;
  motivoExclusao?: string;
  grauAderencia: number;
  riscoJuridico: GrauRisco;
  fundamentacaoAplicabilidade: string;
  justificativaTecnica: string;
  estimativaRecuperacao: number;
  documentosComplementares: string[];
  recomendacaoEstrategica: RecomendacaoEstrategica;
  complexidadeOperacional: 'baixa' | 'media' | 'alta';
  potencialFinanceiro: number;
  segurancaJuridica: number;
}

export interface RelatorioAnalise {
  id: string;
  clienteId: string;
  clienteNome: string;
  dataAnalise: string;
  diagnosticoTributario: string;
  tesesAplicaveis: AnaliseTeseCliente[];
  tesesDescartadas: AnaliseTeseCliente[];
  scoreOportunidade: number;
  recomendacaoGeral: string;
  redFlags: RedFlag[];
  prioridade: PrioridadeCliente;
}

export interface DashboardStats {
  totalClientes: number;
  clientesPrioritarios: number;
  clientesComRedFlags: number;
  totalTeses: number;
  tesesPacificadas: number;
  analisesPendentes: number;
  potencialRecuperacaoTotal: number;
  mediaScoreOportunidade: number;
  totalParceiros: number;
  filaAFazer: number;
  filaFazendo: number;
  filaConcluido: number;
}

// ---- PERMISSÕES ----
export interface Permissoes {
  podeIncluirCliente: boolean;
  podeEditarCliente: boolean;
  podeExcluirCliente: boolean;
  podeIncluirParceiro: boolean;
  podeEditarParceiro: boolean;
  podeExcluirParceiro: boolean;
  podeIncluirTese: boolean;
  podeEditarTese: boolean;
  podeExcluirTese: boolean;
  podeAlterarOrdemFila: boolean;
  podeAlterarPrioridadeFila: boolean;
  podeIniciarApuracao: boolean;
}

export function getPermissoes(nivel: NivelAcesso): Permissoes {
  switch (nivel) {
    case 'administrador':
      return {
        podeIncluirCliente: true, podeEditarCliente: true, podeExcluirCliente: true,
        podeIncluirParceiro: true, podeEditarParceiro: true, podeExcluirParceiro: true,
        podeIncluirTese: true, podeEditarTese: true, podeExcluirTese: true,
        podeAlterarOrdemFila: true, podeAlterarPrioridadeFila: true,
        podeIniciarApuracao: true,
      };
    case 'suporte_comercial':
      return {
        podeIncluirCliente: true, podeEditarCliente: true, podeExcluirCliente: true,
        podeIncluirParceiro: true, podeEditarParceiro: true, podeExcluirParceiro: true,
        podeIncluirTese: false, podeEditarTese: false, podeExcluirTese: false,
        podeAlterarOrdemFila: false, podeAlterarPrioridadeFila: false,
        podeIniciarApuracao: false,
      };
    case 'analista_fiscal':
      return {
        podeIncluirCliente: false, podeEditarCliente: false, podeExcluirCliente: false,
        podeIncluirParceiro: false, podeEditarParceiro: false, podeExcluirParceiro: false,
        podeIncluirTese: false, podeEditarTese: false, podeExcluirTese: false,
        podeAlterarOrdemFila: false, podeAlterarPrioridadeFila: false,
        podeIniciarApuracao: true,
      };
  }
}
