import ContratosFilaPage from './ContratosFilaPage';
import { PenTool } from 'lucide-react';

export default function ContratosFilaElaboracao() {
  return <ContratosFilaPage fila="elaboracao" filaLabel="Elaboração" icon={<PenTool className="w-7 h-7 text-amber-500" />} />;
}
