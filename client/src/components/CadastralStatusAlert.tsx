import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type SituacaoCadastral = 'ativa' | 'baixada' | 'inapta' | 'suspensa' | 'nula';

interface CadastralStatusAlertProps {
  situacao: SituacaoCadastral;
  showAlert?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<SituacaoCadastral, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  severity: 'info' | 'warning' | 'error';
  description: string;
}> = {
  'ativa': {
    label: 'Ativa',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
    severity: 'info',
    description: 'Empresa em situação regular',
  },
  'baixada': {
    label: 'Baixada',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <AlertTriangle className="w-4 h-4" />,
    severity: 'error',
    description: 'Empresa foi cancelada na Receita Federal. Pode ser impeditivo para execução de serviços.',
  },
  'inapta': {
    label: 'Inapta',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: <AlertTriangle className="w-4 h-4" />,
    severity: 'warning',
    description: 'Empresa não está apta para operações. Pode ser impeditivo para execução de serviços.',
  },
  'suspensa': {
    label: 'Suspensa',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: <AlertCircle className="w-4 h-4" />,
    severity: 'warning',
    description: 'Empresa tem sua inscrição suspensa. Pode ser impeditivo para execução de serviços.',
  },
  'nula': {
    label: 'Nula',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <AlertTriangle className="w-4 h-4" />,
    severity: 'error',
    description: 'Inscrição nula. Pode ser impeditivo para execução de serviços.',
  },
};

/**
 * Display cadastral status with visual alert when status is not "Ativa"
 * Shows prominent warning for critical statuses (Baixada, Inapta, Suspensa, Nula)
 */
export function CadastralStatusAlert({
  situacao,
  showAlert = true,
  className = '',
}: CadastralStatusAlertProps) {
  const config = STATUS_CONFIG[situacao];
  const isCritical = situacao !== 'ativa';

  return (
    <div className={className}>
      {/* Badge */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className={`${config.color} border-current`}>
          {config.icon}
          <span className="ml-1">{config.label}</span>
        </Badge>
      </div>

      {/* Alert for non-active status */}
      {isCritical && showAlert && (
        <Card className={`${config.bgColor} border ${config.borderColor}`}>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className={`${config.color} mt-0.5`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config.color}`}>
                  ⚠️ Situação Cadastral Crítica
                </p>
                <p className={`text-xs ${config.color} opacity-90 mt-1`}>
                  {config.description}
                </p>
                <p className={`text-xs ${config.color} opacity-75 mt-2 italic`}>
                  Recomenda-se confirmar a situação diretamente no site da Receita Federal antes de prosseguir com os serviços.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info for active status */}
      {!isCritical && showAlert && (
        <div className={`${config.bgColor} border ${config.borderColor} rounded-md p-2`}>
          <p className={`text-xs ${config.color} flex items-center gap-2`}>
            {config.icon}
            <span>{config.description}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge-only display of cadastral status (no alert box)
 */
export function CadastralStatusBadge({
  situacao,
  className = '',
}: Omit<CadastralStatusAlertProps, 'showAlert'>) {
  const config = STATUS_CONFIG[situacao];

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} border-current ${className}`}
    >
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </Badge>
  );
}
