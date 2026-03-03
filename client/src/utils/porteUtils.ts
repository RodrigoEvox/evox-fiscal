/**
 * Utility functions for determining company size (PORTE) from CNPJ
 * PORTE classification: EPP, PME, Demais Portes
 * 
 * Based on Brazilian tax authorities classification:
 * - EPP (Empresa de Pequeno Porte): faturamento até R$ 4.8 milhões
 * - PME (Pequena e Média Empresa): faturamento de R$ 4.8M até R$ 300 milhões
 * - Demais Portes: faturamento acima de R$ 300 milhões
 */

export type PorteType = 'epp' | 'pme' | 'demais_portes' | null;

/**
 * Determine company size based on CNPJ structure and faturamento médio
 * Note: CNPJ itself doesn't encode size, so we use faturamento as primary indicator
 */
export function determinePorte(faturamentoMedioMensal: number | string): PorteType {
  const faturamento = typeof faturamentoMedioMensal === 'string' 
    ? parseFloat(faturamentoMedioMensal.replace(/[^\d.-]/g, '')) || 0
    : faturamentoMedioMensal;

  // Monthly to annual conversion
  const faturamentoAnual = faturamento * 12;

  if (faturamentoAnual <= 4_800_000) {
    return 'epp';
  } else if (faturamentoAnual <= 300_000_000) {
    return 'pme';
  } else {
    return 'demais_portes';
  }
}

/**
 * Get human-readable label for PORTE
 */
export function getPorteLabel(porte: PorteType): string {
  switch (porte) {
    case 'epp':
      return 'EPP (Pequeno Porte)';
    case 'pme':
      return 'PME (Médio Porte)';
    case 'demais_portes':
      return 'Demais Portes (Grande)';
    default:
      return 'Não classificado';
  }
}

/**
 * Get color badge for PORTE visualization
 */
export function getPorteColor(porte: PorteType): string {
  switch (porte) {
    case 'epp':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'pme':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'demais_portes':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get faturamento range for PORTE
 */
export function getPorteFaturamentoRange(porte: PorteType): { min: number; max: number } {
  switch (porte) {
    case 'epp':
      return { min: 0, max: 4_800_000 };
    case 'pme':
      return { min: 4_800_001, max: 300_000_000 };
    case 'demais_portes':
      return { min: 300_000_001, max: Infinity };
    default:
      return { min: 0, max: 0 };
  }
}
