/**
 * Regras de conflito entre teses tributárias.
 * 
 * Certas teses são mutuamente exclusivas — se uma se aplica, a outra não pode ser aplicada
 * simultaneamente. O sistema deve alertar o analista e apresentar cenários alternativos.
 */

export interface ConflictRule {
  /** Identificador único da regra */
  id: string;
  /** Descrição legível da regra de conflito */
  descricao: string;
  /** Padrões de nome de tese do grupo A (regex case-insensitive) */
  grupoA: string[];
  /** Padrões de nome de tese do grupo B (regex case-insensitive) */
  grupoB: string[];
  /** Explicação detalhada do motivo do conflito */
  motivo: string;
}

/**
 * Regras de conflito entre teses.
 * Cada regra define dois grupos de teses que são mutuamente exclusivas.
 */
export const CONFLICT_RULES: ConflictRule[] = [
  {
    id: 'perse_vs_exclusao_pis_cofins',
    descricao: 'PERSE vs Exclusões da Base de Cálculo do PIS/COFINS',
    grupoA: ['perse'],
    grupoB: [
      'exclus.*base.*c[aá]lculo.*pis',
      'exclus.*base.*c[aá]lculo.*cofins',
      'exclus.*pis.*cofins.*pr[oó]pria.*base',
      'exclus.*icms.*base.*pis',
      'exclus.*iss.*base.*pis',
      'exclus.*icms.st.*base.*pis',
      'exclus.*difal.*base.*pis',
    ],
    motivo: 'A tese do PERSE (Programa Emergencial de Retomada do Setor de Eventos) concede alíquota zero de PIS/COFINS. Se a empresa já tem alíquota zero, não há base de cálculo a ser excluída. Portanto, as teses de exclusão da base de cálculo do PIS/COFINS são incompatíveis com o PERSE — aplica-se uma ou outra.',
  },
  {
    id: 'monofasico_vs_exclusao_pis_cofins',
    descricao: 'PIS/COFINS Monofásico vs Exclusões da Base de PIS/COFINS',
    grupoA: ['monof[aá]sico'],
    grupoB: [
      'exclus.*pis.*cofins.*pr[oó]pria.*base',
    ],
    motivo: 'Produtos sujeitos à tributação monofásica de PIS/COFINS já possuem regime especial de tributação concentrada. A exclusão do PIS/COFINS da própria base não se aplica a esses produtos, pois a sistemática de cálculo é diferente.',
  },
];

export interface ConflictDetection {
  ruleId: string;
  descricao: string;
  motivo: string;
  /** Teses do grupo A que estão presentes */
  tesesGrupoA: { index: number; nome: string; valor: number }[];
  /** Teses do grupo B que estão presentes */
  tesesGrupoB: { index: number; nome: string; valor: number }[];
  /** Valor total do grupo A */
  totalGrupoA: number;
  /** Valor total do grupo B */
  totalGrupoB: number;
}

export interface TeseItem {
  nome: string;
  valor: number;
  index: number;
}

/**
 * Detecta conflitos entre teses com base nas regras definidas.
 */
export function detectConflicts(teses: TeseItem[]): ConflictDetection[] {
  const conflicts: ConflictDetection[] = [];

  for (const rule of CONFLICT_RULES) {
    const matchesA: TeseItem[] = [];
    const matchesB: TeseItem[] = [];

    for (const tese of teses) {
      const nome = tese.nome.toLowerCase();
      
      for (const pattern of rule.grupoA) {
        if (new RegExp(pattern, 'i').test(nome)) {
          matchesA.push(tese);
          break;
        }
      }
      
      for (const pattern of rule.grupoB) {
        if (new RegExp(pattern, 'i').test(nome)) {
          matchesB.push(tese);
          break;
        }
      }
    }

    // Conflict exists only if both groups have matches
    if (matchesA.length > 0 && matchesB.length > 0) {
      conflicts.push({
        ruleId: rule.id,
        descricao: rule.descricao,
        motivo: rule.motivo,
        tesesGrupoA: matchesA.map(t => ({ index: t.index, nome: t.nome, valor: t.valor })),
        tesesGrupoB: matchesB.map(t => ({ index: t.index, nome: t.nome, valor: t.valor })),
        totalGrupoA: matchesA.reduce((sum, t) => sum + t.valor, 0),
        totalGrupoB: matchesB.reduce((sum, t) => sum + t.valor, 0),
      });
    }
  }

  return conflicts;
}

/**
 * Calcula cenários alternativos quando há conflitos.
 * Retorna o valor total para cada cenário possível.
 */
export interface ConflictScenario {
  label: string;
  descricao: string;
  valorTotal: number;
  tesesIncluidas: string[];
  tesesExcluidas: string[];
}

export function calculateConflictScenarios(
  teses: TeseItem[],
  conflicts: ConflictDetection[]
): ConflictScenario[] {
  if (conflicts.length === 0) return [];

  const scenarios: ConflictScenario[] = [];
  const totalSemConflito = teses.reduce((sum, t) => sum + t.valor, 0);

  for (const conflict of conflicts) {
    const grupoANomes = conflict.tesesGrupoA.map(t => t.nome);
    const grupoBNomes = conflict.tesesGrupoB.map(t => t.nome);
    const grupoAIndices = new Set(conflict.tesesGrupoA.map(t => t.index));
    const grupoBIndices = new Set(conflict.tesesGrupoB.map(t => t.index));

    // Cenário A: Aplicar grupo A, excluir grupo B
    const valorCenarioA = teses
      .filter(t => !grupoBIndices.has(t.index))
      .reduce((sum, t) => sum + t.valor, 0);

    scenarios.push({
      label: `Cenário A — ${grupoANomes.join(', ')}`,
      descricao: `Aplicando ${grupoANomes.join(', ')} e excluindo ${grupoBNomes.join(', ')}`,
      valorTotal: valorCenarioA,
      tesesIncluidas: grupoANomes,
      tesesExcluidas: grupoBNomes,
    });

    // Cenário B: Aplicar grupo B, excluir grupo A
    const valorCenarioB = teses
      .filter(t => !grupoAIndices.has(t.index))
      .reduce((sum, t) => sum + t.valor, 0);

    scenarios.push({
      label: `Cenário B — ${grupoBNomes.join(', ')}`,
      descricao: `Aplicando ${grupoBNomes.join(', ')} e excluindo ${grupoANomes.join(', ')}`,
      valorTotal: valorCenarioB,
      tesesIncluidas: grupoBNomes,
      tesesExcluidas: grupoANomes,
    });
  }

  return scenarios;
}

/**
 * Determina a viabilidade automática com base no valor total apurado.
 * Critério: ≥ R$ 20.000 = Viável, < R$ 20.000 = Inviável
 */
export function determineViabilidade(valorTotal: number): 'viavel' | 'inviavel' {
  return valorTotal >= 20000 ? 'viavel' : 'inviavel';
}

export const VIABILIDADE_THRESHOLD = 20000;
