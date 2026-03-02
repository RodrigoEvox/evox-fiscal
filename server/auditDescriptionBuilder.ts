/**
 * Audit Description Builder
 * Generates detailed, human-readable descriptions for every field change in audit logs.
 * Instead of generic "Tarefa atualizada", it produces:
 *   "Responsável alterado de 'João Silva' para 'Maria Santos'. Prioridade alterada de 'Média' para 'Urgente'."
 */

// Field label mappings for human-readable descriptions
const TASK_FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  prioridade: 'Prioridade',
  responsavelId: 'Responsável (ID)',
  responsavelNome: 'Responsável',
  observacoes: 'Observações',
  ordem: 'Ordem na fila',
  titulo: 'Título',
  descricao: 'Descrição',
  dataVencimento: 'Data de vencimento',
  dataConclusao: 'Data de conclusão',
  slaHoras: 'SLA (horas)',
  slaStatus: 'Status do SLA',
  viabilidade: 'Viabilidade',
  valorGlobalApurado: 'Valor global apurado',
  fila: 'Fila',
  caseId: 'Case vinculado',
  clienteId: 'Cliente vinculado',
};

const CASE_FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  fase: 'Fase',
  responsavelId: 'Responsável (ID)',
  responsavelNome: 'Responsável',
  valorEstimado: 'Valor estimado',
  valorContratado: 'Valor contratado',
  observacoes: 'Observações',
  tesesIds: 'Teses vinculadas',
  ndaUrl: 'URL do NDA',
  contratoUrl: 'URL do contrato',
  ndaAssinadoEm: 'NDA assinado em',
  contratoAssinadoEm: 'Contrato assinado em',
  onboardingConcluidoEm: 'Onboarding concluído em',
};

const TICKET_FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  responsavelId: 'Responsável (ID)',
  responsavelNome: 'Responsável',
  resolucao: 'Resolução',
  dataResolucao: 'Data de resolução',
};

const LEDGER_FIELD_LABELS: Record<string, string> = {
  valorValidado: 'Valor validado',
  valorProtocolado: 'Valor protocolado',
  valorEfetivado: 'Valor efetivado',
  saldoResidual: 'Saldo residual',
  tipoEfetivacao: 'Tipo de efetivação',
  status: 'Status',
  observacoes: 'Observações',
};

const SLA_CONFIG_FIELD_LABELS: Record<string, string> = {
  nome: 'Nome',
  slaHoras: 'SLA (horas)',
  slaDias: 'SLA (dias)',
  slaDiasUteis: 'SLA (dias úteis)',
  alertaDias: 'Alerta (dias)',
  escalonamentoDias: 'Escalonamento (dias)',
  ativo: 'Ativo',
};

const POLICY_FIELD_LABELS: Record<string, string> = {
  nome: 'Nome',
  frequencia: 'Frequência',
  diaVencimento: 'Dia de vencimento',
  mesesVencimento: 'Meses de vencimento',
  antecedenciaInternaDiasUteis: 'Antecedência interna (dias úteis)',
  antecedenciaCriacaoTarefaDias: 'Antecedência criação tarefa (dias)',
  ativo: 'Ativo',
};

// Value formatters for specific fields
const STATUS_LABELS: Record<string, string> = {
  a_fazer: 'A Fazer',
  fazendo: 'Fazendo',
  feito: 'Feito (RTI Gerado)',
  concluido: 'Concluído',
  aberto: 'Aberto',
  em_andamento: 'Em Andamento',
  aguardando_cliente: 'Aguardando Cliente',
  resolvido: 'Resolvido',
  cancelado: 'Cancelado',
  estimado: 'Estimado',
  validado: 'Validado',
  protocolado: 'Protocolado',
  efetivado: 'Efetivado',
  parcial: 'Parcial',
  oportunidade: 'Oportunidade',
  contratado: 'Contratado',
  nda_assinado: 'NDA Assinado',
  onboarding_concluido: 'Onboarding Concluído',
};

const PRIORIDADE_LABELS: Record<string, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

const VIABILIDADE_LABELS: Record<string, string> = {
  viavel: 'Viável',
  inviavel: 'Inviável',
};

const SLA_STATUS_LABELS: Record<string, string> = {
  dentro_prazo: 'Dentro do Prazo',
  atencao: 'Atenção',
  vencido: 'Vencido',
};

const TIPO_EFETIVACAO_LABELS: Record<string, string> = {
  compensacao: 'Compensação',
  restituicao: 'Restituição',
  ressarcimento: 'Ressarcimento',
};

const FREQUENCIA_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
};

function formatValue(field: string, value: any): string {
  if (value === null || value === undefined) return '(vazio)';
  if (value === '') return '(vazio)';

  // Special formatting by field name
  if (field === 'status') return STATUS_LABELS[value] || value;
  if (field === 'prioridade') return PRIORIDADE_LABELS[value] || value;
  if (field === 'viabilidade') return VIABILIDADE_LABELS[value] || value;
  if (field === 'slaStatus') return SLA_STATUS_LABELS[value] || value;
  if (field === 'tipoEfetivacao') return TIPO_EFETIVACAO_LABELS[value] || value;
  if (field === 'frequencia') return FREQUENCIA_LABELS[value] || value;
  if (field === 'ativo') return value === 1 || value === true ? 'Sim' : 'Não';

  // Format monetary values
  if (field.startsWith('valor') || field === 'saldoResidual' || field === 'folhaPagamento' || field === 'faturamentoMedio') {
    const num = parseFloat(value);
    if (!isNaN(num)) return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  // Format arrays
  if (Array.isArray(value)) return value.join(', ') || '(vazio)';

  // Format JSON objects
  if (typeof value === 'object') return JSON.stringify(value);

  return String(value);
}

// Fields to skip in the diff (internal/auto-generated fields)
const SKIP_FIELDS = new Set([
  'id', 'updatedAt', 'createdAt', 'atualizadoPorId',
  'dataConclusao', 'dataResolucao', 'ndaAssinadoEm', 'contratoAssinadoEm', 'onboardingConcluidoEm',
]);

// Fields that should use the "nome" companion instead of the ID
const ID_TO_NOME_MAP: Record<string, string> = {
  responsavelId: 'responsavelNome',
};

export type EntityType = 'task' | 'case' | 'ticket' | 'ledger' | 'policy' | 'sla' | 'retorno' | 'onboarding';

const RETORNO_FIELD_LABELS: Record<string, string> = {
  retornoStatus: 'Status do retorno',
  retornoObservacao: 'Observação do retorno',
  retornoData: 'Data do retorno',
};

const ONBOARDING_FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  observacoes: 'Observações',
  responsavelId: 'Responsável (ID)',
  responsavelNome: 'Responsável',
};

const ENTITY_LABELS: Record<EntityType, Record<string, string>> = {
  task: TASK_FIELD_LABELS,
  case: CASE_FIELD_LABELS,
  ticket: TICKET_FIELD_LABELS,
  ledger: LEDGER_FIELD_LABELS,
  policy: POLICY_FIELD_LABELS,
  sla: SLA_CONFIG_FIELD_LABELS,
  retorno: RETORNO_FIELD_LABELS,
  onboarding: ONBOARDING_FIELD_LABELS,
};

const ENTITY_NAMES: Record<EntityType, string> = {
  task: 'Tarefa',
  case: 'Case',
  ticket: 'Ticket',
  ledger: 'Ledger',
  policy: 'Política de vencimento',
  sla: 'Configuração de SLA',
  retorno: 'Retorno',
  onboarding: 'Onboarding',
};

/**
 * Build a detailed audit description by comparing old and new data.
 * 
 * @param entityType - The type of entity being updated
 * @param oldData - The previous state of the entity (from getById)
 * @param newData - The new values being applied (from input)
 * @param userName - Name of the user making the change
 * @param entityCode - Optional code/identifier for the entity (e.g., "CT-0001")
 * @returns A detailed human-readable description of all changes
 */
export function buildAuditDescription(
  entityType: EntityType,
  oldData: Record<string, any> | null,
  newData: Record<string, any>,
  userName: string,
  entityCode?: string,
): string {
  const labels = ENTITY_LABELS[entityType] || {};
  const entityName = ENTITY_NAMES[entityType] || entityType;
  const changes: string[] = [];

  // Track which fields we've already described via nome companion
  const describedViaName = new Set<string>();

  for (const [field, newValue] of Object.entries(newData)) {
    // Skip internal fields
    if (SKIP_FIELDS.has(field)) continue;

    // If this field has a nome companion and both are in the update, skip the ID field
    if (ID_TO_NOME_MAP[field] && newData[ID_TO_NOME_MAP[field]] !== undefined) {
      continue; // Will be described by the nome field
    }

    // If this is a nome companion field, describe it with the ID context
    const isNomeField = Object.values(ID_TO_NOME_MAP).includes(field);

    const oldValue = oldData ? oldData[field] : undefined;

    // Skip if value hasn't actually changed
    if (oldValue !== undefined && oldValue !== null && String(oldValue) === String(newValue)) continue;
    if (oldValue === null && newValue === null) continue;
    if (oldValue === undefined && newValue === undefined) continue;

    const label = labels[field] || field;
    const oldFormatted = formatValue(field, oldValue);
    const newFormatted = formatValue(field, newValue);

    if (oldData && oldValue !== undefined && oldValue !== null && String(oldValue) !== String(newValue)) {
      changes.push(`${label} alterado de '${oldFormatted}' para '${newFormatted}'`);
    } else if (newValue !== undefined && newValue !== null && newValue !== '') {
      if (field === 'observacoes') {
        changes.push(`Observação adicionada: "${String(newValue).substring(0, 100)}${String(newValue).length > 100 ? '...' : ''}"`);
      } else {
        changes.push(`${label} definido como '${newFormatted}'`);
      }
    }
  }

  if (changes.length === 0) {
    return `${entityName}${entityCode ? ` ${entityCode}` : ''} atualizada por ${userName} (sem alterações detectadas)`;
  }

  const prefix = `${userName} atualizou ${entityName.toLowerCase()}${entityCode ? ` ${entityCode}` : ''}`;
  return `${prefix}: ${changes.join('. ')}.`;
}

/**
 * Build a complete dadosAnteriores object with all relevant old values
 * for the fields being changed.
 */
export function buildDadosAnteriores(
  oldData: Record<string, any> | null,
  newData: Record<string, any>,
): Record<string, any> {
  if (!oldData) return {};
  const result: Record<string, any> = {};
  for (const field of Object.keys(newData)) {
    if (SKIP_FIELDS.has(field)) continue;
    if (oldData[field] !== undefined) {
      result[field] = oldData[field];
    }
  }
  return result;
}
