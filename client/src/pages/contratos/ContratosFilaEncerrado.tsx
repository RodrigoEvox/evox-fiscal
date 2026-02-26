import ContratosFilaPage from './ContratosFilaPage';
import { XCircle } from 'lucide-react';

export default function ContratosFilaEncerrado() {
  return <ContratosFilaPage fila="encerrado" filaLabel="Encerrados" icon={<XCircle className="w-7 h-7 text-gray-500" />} />;
}
