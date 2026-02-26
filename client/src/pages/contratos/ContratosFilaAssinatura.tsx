import ContratosFilaPage from './ContratosFilaPage';
import { FileSignature } from 'lucide-react';

export default function ContratosFilaAssinatura() {
  return <ContratosFilaPage fila="assinatura" filaLabel="Assinatura" icon={<FileSignature className="w-7 h-7 text-purple-500" />} />;
}
