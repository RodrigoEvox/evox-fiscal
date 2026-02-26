import ContratosFilaPage from './ContratosFilaPage';
import { RefreshCw } from 'lucide-react';

export default function ContratosFilaRenovacao() {
  return <ContratosFilaPage fila="renovacao" filaLabel="Renovação" icon={<RefreshCw className="w-7 h-7 text-cyan-500" />} />;
}
