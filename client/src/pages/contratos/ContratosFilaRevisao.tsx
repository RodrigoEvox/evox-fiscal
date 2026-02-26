import ContratosFilaPage from './ContratosFilaPage';
import { Eye } from 'lucide-react';

export default function ContratosFilaRevisao() {
  return <ContratosFilaPage fila="revisao" filaLabel="Revisão" icon={<Eye className="w-7 h-7 text-blue-500" />} />;
}
