import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface BackToDashboardProps {
  className?: string;
}

export default function BackToDashboard({ className }: BackToDashboardProps) {
  const [, navigate] = useLocation();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground ${className || ''}`}
      onClick={() => navigate('/credito/dashboard-credito')}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Voltar ao Dashboard
    </Button>
  );
}
