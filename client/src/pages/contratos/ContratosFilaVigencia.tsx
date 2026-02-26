import ContratosFilaPage from './ContratosFilaPage';
import { ShieldCheck } from 'lucide-react';

export default function ContratosFilaVigencia() {
  return <ContratosFilaPage fila="vigencia" filaLabel="Vigência" icon={<ShieldCheck className="w-7 h-7 text-emerald-500" />} />;
}
