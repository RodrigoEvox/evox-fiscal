import { UserPlus } from 'lucide-react';
import CreditoFilaPage from './CreditoFilaPage';

export default function CreditoFilaOnboarding() {
  return <CreditoFilaPage fila="onboarding" filaLabel="Onboarding" icon={<UserPlus className="w-6 h-6" />} />;
}
