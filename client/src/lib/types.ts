// ============================================================
// Evox Fiscal — Sistema de Análise de Oportunidades Tributárias
// Types & Data Models
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
  // Metadados
  dataCadastro: string;
  dataUltimaAnalise?: string;
  // RED FLAGS e Alertas
  redFlags: RedFlag[];
  alertasInformacao: AlertaInformacao[];
  prioridade: PrioridadeCliente;
  scoreOportunidade?: number;
  observacoes?: string;
}

export interface Tese {
  id: string;
  nome: string;
  tributoEnvolvido: string;
  tipo: TipoTese;
  classificacao: ClassificacaoTese;
  // Potencial
  potencialFinanceiro: PotencialFinanceiro;
  potencialMercadologico: PotencialMercadologico;
  // Requisitos
  requisitosObjetivos: string[];
  requisitosImpeditivos: string[];
  // Fundamentação
  fundamentacaoLegal: string;
  jurisprudenciaRelevante: string;
  parecerTecnicoJuridico: string;
  // Detalhes
  prazoPrescricional: string;
  necessidadeAcaoJudicial: boolean;
  viaAdministrativa: boolean;
  grauRisco: GrauRisco;
  documentosNecessarios: string[];
  formulaEstimativaCredito: string;
  // Aplicabilidade
  aplicavelComercio: boolean;
  aplicavelIndustria: boolean;
  aplicavelServico: boolean;
  aplicavelContribuinteICMS: boolean;
  aplicavelContribuinteIPI: boolean;
  aplicavelLucroReal: boolean;
  aplicavelLucroPresumido: boolean;
  aplicavelSimplesNacional: boolean;
  aplicavelPos2017: boolean;
  // Metadados
  dataCriacao: string;
  dataAtualizacao: string;
  versao: number;
  ativa: boolean;
}

export interface AnaliseTeseCliente {
  teseId: string;
  teseNome: string;
  aplicavel: boolean;
  motivoExclusao?: string;
  grauAderencia: number; // 0-100
  riscoJuridico: GrauRisco;
  fundamentacaoAplicabilidade: string;
  justificativaTecnica: string;
  estimativaRecuperacao: number;
  documentosComplementares: string[];
  recomendacaoEstrategica: RecomendacaoEstrategica;
  complexidadeOperacional: 'baixa' | 'media' | 'alta';
  potencialFinanceiro: number; // score 0-100
  segurancaJuridica: number; // score 0-100
}

export interface RelatorioAnalise {
  id: string;
  clienteId: string;
  clienteNome: string;
  dataAnalise: string;
  // Diagnóstico
  diagnosticoTributario: string;
  // Teses
  tesesAplicaveis: AnaliseTeseCliente[];
  tesesDescartadas: AnaliseTeseCliente[];
  // Score
  scoreOportunidade: number;
  // Recomendação geral
  recomendacaoGeral: string;
  // Red flags do momento da análise
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
}
