import { FileEdit } from 'lucide-react';
import CreditoFilaPage from './CreditoFilaPage';

export default function CreditoFilaRetificacao() {
  return <CreditoFilaPage fila="retificacao" filaLabel="Retificação" icon={<FileEdit className="w-6 h-6" />} />;
}
