import { RefreshCw } from 'lucide-react';
import CreditoFilaPage from './CreditoFilaPage';

export default function CreditoFilaRessarcimento() {
  return <CreditoFilaPage fila="ressarcimento" filaLabel="Ressarcimento" icon={<RefreshCw className="w-6 h-6" />} />;
}
