import { Undo2 } from 'lucide-react';
import CreditoFilaPage from './CreditoFilaPage';

export default function CreditoFilaRestituicao() {
  return <CreditoFilaPage fila="restituicao" filaLabel="Restituição" icon={<Undo2 className="w-6 h-6" />} />;
}
