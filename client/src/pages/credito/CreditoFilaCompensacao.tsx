import { ArrowLeftRight } from 'lucide-react';
import CreditoFilaPage from './CreditoFilaPage';

export default function CreditoFilaCompensacao() {
  return <CreditoFilaPage fila="compensacao" filaLabel="Compensação" icon={<ArrowLeftRight className="w-6 h-6" />} />;
}
