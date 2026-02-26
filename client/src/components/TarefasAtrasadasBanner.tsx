import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TarefasAtrasadasBannerProps {
  fila?: string;
  className?: string;
}

export default function TarefasAtrasadasBanner({ fila, className }: TarefasAtrasadasBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: count } = trpc.creditRecovery.admin.countAtrasadas.useQuery(
    fila ? { fila } : undefined
  );
  const { data: tarefas } = trpc.creditRecovery.admin.tarefasAtrasadas.useQuery(
    fila ? { fila } : undefined,
    { enabled: expanded && (count as number) > 0 }
  );

  const total = typeof count === 'number' ? count : (count as any)?.total || 0;

  if (total === 0) return null;

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const calcDaysOverdue = (prazo: string) => {
    if (!prazo) return 0;
    const diff = Date.now() - new Date(prazo).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <Card className={cn('border-red-200 bg-red-50/50', className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">
                {total} tarefa{total !== 1 ? 's' : ''} com SLA vencido
              </p>
              <p className="text-[10px] text-red-600">
                {fila ? `Fila: ${fila}` : 'Todas as filas'} — Requer atenção imediata
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-red-700 hover:text-red-900 hover:bg-red-100"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Ocultar' : 'Ver detalhes'}
          </Button>
        </div>

        {expanded && tarefas && (tarefas as any[]).length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-red-200 pt-2">
            {(tarefas as any[]).slice(0, 10).map((t: any) => {
              const daysOverdue = calcDaysOverdue(t.prazo);
              return (
                <div key={t.id} className="flex items-center justify-between py-1.5 px-2 bg-white/60 rounded text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-muted-foreground shrink-0">{t.codigo || `#${t.id}`}</span>
                    <span className="font-medium text-foreground truncate">{t.titulo}</span>
                    {t.clienteNome && (
                      <span className="text-muted-foreground truncate">— {t.clienteNome}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.responsavelNome && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span className="text-[10px]">{t.responsavelNome}</span>
                      </div>
                    )}
                    <Badge variant="destructive" className="text-[9px] gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {daysOverdue}d atraso
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Prazo: {formatDate(t.prazo)}
                    </span>
                  </div>
                </div>
              );
            })}
            {(tarefas as any[]).length > 10 && (
              <p className="text-[10px] text-red-600 text-center pt-1">
                ... e mais {(tarefas as any[]).length - 10} tarefa(s) atrasada(s)
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
