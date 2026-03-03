import { Badge } from '@/components/ui/badge';
import { determinePorte, getPorteLabel, getPorteColor } from '@/utils/porteUtils';

interface PorteDisplayProps {
  faturamentoMedioMensal?: number | string;
  showLabel?: boolean;
  className?: string;
}

/**
 * Display company size (PORTE) classification
 * Automatically determines PORTE based on faturamento médio mensal
 */
export function PorteDisplay({ 
  faturamentoMedioMensal = 0, 
  showLabel = true,
  className = ''
}: PorteDisplayProps) {
  const porte = determinePorte(faturamentoMedioMensal);
  const label = getPorteLabel(porte);
  const colorClass = getPorteColor(porte);

  if (!porte) {
    return (
      <Badge variant="outline" className={`${colorClass} ${className}`}>
        Não classificado
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge className={`${colorClass} border`}>
        {porte.toUpperCase()}
      </Badge>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
