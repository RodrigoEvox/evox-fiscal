import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useLocation } from 'wouter';

interface BackToDashboardProps {
  className?: string;
}

export default function BackToDashboard({ className }: BackToDashboardProps) {
  const [, navigate] = useLocation();

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => window.history.back()}
        title="Voltar"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/')}
        title="Página Inicial"
      >
        <Home className="w-4 h-4" />
      </Button>
    </div>
  );
}
