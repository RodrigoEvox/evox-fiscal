import { Calculator } from 'lucide-react';
import CreditoFilaPage from './CreditoFilaPage';

export default function CreditoFilaApuracao() {
  return <CreditoFilaPage fila="apuracao" filaLabel="Apuração" icon={<Calculator className="w-6 h-6" />} />;
}
