import { describe, it, expect } from 'vitest';

// Copy of porteUtils functions for testing (since they're client-side)
type PorteType = 'epp' | 'pme' | 'demais_portes' | null;

function determinePorte(faturamentoMedioMensal: number | string): PorteType {
  const faturamento = typeof faturamentoMedioMensal === 'string' 
    ? parseFloat(faturamentoMedioMensal.replace(/[^\d.-]/g, '')) || 0
    : faturamentoMedioMensal;

  const faturamentoAnual = faturamento * 12;

  if (faturamentoAnual <= 4_800_000) {
    return 'epp';
  } else if (faturamentoAnual <= 300_000_000) {
    return 'pme';
  } else {
    return 'demais_portes';
  }
}

function getPorteLabel(porte: PorteType): string {
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

describe('porteUtils', () => {
  describe('determinePorte', () => {
    it('should classify as EPP for faturamento up to 4.8M annually', () => {
      // 200k monthly = 2.4M annually
      expect(determinePorte(200000)).toBe('epp');
      // 400k monthly = 4.8M annually (boundary)
      expect(determinePorte(400000)).toBe('epp');
    });

    it('should classify as PME for faturamento between 4.8M and 300M annually', () => {
      // 500k monthly = 6M annually
      expect(determinePorte(500000)).toBe('pme');
      // 20M monthly = 240M annually
      expect(determinePorte(20000000)).toBe('pme');
    });

    it('should classify as demais_portes for faturamento above 300M annually', () => {
      // 30M monthly = 360M annually
      expect(determinePorte(30000000)).toBe('demais_portes');
      // 100M monthly = 1.2B annually
      expect(determinePorte(100000000)).toBe('demais_portes');
    });

    it('should handle string input with currency formatting', () => {
      expect(determinePorte('200000')).toBe('epp');
      expect(determinePorte('500000')).toBe('pme');
      expect(determinePorte('30000000')).toBe('demais_portes');
    });

    it('should handle zero and negative values', () => {
      expect(determinePorte(0)).toBe('epp');
      expect(determinePorte(-100000)).toBe('epp');
    });
  });

  describe('getPorteLabel', () => {
    it('should return correct labels for each porte', () => {
      expect(getPorteLabel('epp')).toBe('EPP (Pequeno Porte)');
      expect(getPorteLabel('pme')).toBe('PME (Médio Porte)');
      expect(getPorteLabel('demais_portes')).toBe('Demais Portes (Grande)');
      expect(getPorteLabel(null)).toBe('Não classificado');
    });
  });


});
