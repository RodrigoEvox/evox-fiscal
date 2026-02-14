import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, Clock, Calendar, User, MessageSquare, Send,
  CheckCircle2, Timer, AlertTriangle, Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'a_fazer', label: 'A Fazer' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

const prioridadeColors: Record<string, string> = {
  urgente: 'bg-red-500 text-white',
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baixa: 'bg-blue-100 text-blue-700',
};

export default function TarefaDetalhe() {
  const [, params] = useRoute('/tarefas/:id');
  const id = parseInt(params?.id || '0');
  const { user } = useAuth();
  const [comment, setComment] = useState('');

  const tarefa = trpc.tarefas.getById.useQuery({ id }, { enabled: id > 0 });
  const updateTarefa = trpc.tarefas.update.useMutation({
    onSuccess: () => { tarefa.refetch(); toast.success('Tarefa atualizada!'); },
    onError: (e) => toast.error(e.message),
  });
  const addComment = trpc.tarefas.addComment.useMutation({
    onSuccess: () => { tarefa.refetch(); setComment(''); toast.success('Comentário adicionado!'); },
    onError: (e) => toast.error(e.message),
  });

  if (!tarefa.data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando tarefa...</p>
      </div>
    );
  }

  const t = tarefa.data;

  const handleStatusChange = (newStatus: string) => {
    updateTarefa.mutate({ id, data: { status: newStatus } });
  };

  const handleProgressChange = (progress: number) => {
    updateTarefa.mutate({ id, data: { progresso: progress } });
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    addComment.mutate({ tarefaId: id, conteudo: comment });
  };

  const slaInfo = () => {
    if (!t.slaHoras || !t.dataInicio) return null;
    const start = new Date(t.dataInicio).getTime();
    const deadline = start + t.slaHoras * 60 * 60 * 1000;
    const now = Date.now();
    const remaining = deadline - now;
    const hoursRemaining = Math.round(remaining / (60 * 60 * 1000));
    if (t.status === 'concluido') return { status: 'ok', text: 'Concluído' };
    if (remaining <= 0) return { status: 'vencido', text: `Vencido há ${Math.abs(hoursRemaining)}h` };
    if (hoursRemaining <= t.slaHoras * 0.2) return { status: 'atencao', text: `${hoursRemaining}h restantes` };
    return { status: 'ok', text: `${hoursRemaining}h restantes` };
  };

  const sla = slaInfo();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/tarefas">
        <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground">{t.codigo}</span>
            <Badge className={cn(prioridadeColors[t.prioridade])}>{t.prioridade}</Badge>
            {sla && (
              <Badge variant={sla.status === 'vencido' ? 'destructive' : sla.status === 'atencao' ? 'outline' : 'secondary'} className="text-xs">
                <Timer className="w-3 h-3 mr-1" />
                {sla.text}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{t.titulo}</h1>
        </div>
        <Select value={t.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {t.descricao && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Descrição</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.descricao}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Progresso</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${t.progresso || 0}%` }} />
                </div>
                <span className="text-sm font-medium">{t.progresso || 0}%</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[0, 25, 50, 75, 100].map(p => (
                  <Button key={p} variant={t.progresso === p ? 'default' : 'outline'} size="sm" className="text-xs"
                    onClick={() => handleProgressChange(p)}>{p}%</Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subtarefas */}
          {t.subtarefas && t.subtarefas.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Subtarefas ({t.subtarefas.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {t.subtarefas.map((sub: any) => (
                  <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <CheckCircle2 className={cn('w-4 h-4', sub.status === 'concluido' ? 'text-green-500' : 'text-muted-foreground')} />
                    <span className={cn('text-sm', sub.status === 'concluido' && 'line-through text-muted-foreground')}>{sub.titulo}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">{sub.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Comentários */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Comentários ({t.comentarios?.length || 0})
            </CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {t.comentarios?.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                    {c.autorNome?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.autorNome}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.conteudo}</p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex gap-2">
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  rows={2}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSendComment} disabled={!comment.trim() || addComment.isPending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Detalhes</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span className="capitalize">{t.tipo}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              {t.dataVencimento && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencimento</span>
                    <span>{new Date(t.dataVencimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                </>
              )}
              {t.slaHoras && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SLA</span>
                    <span>{t.slaHoras} horas</span>
                  </div>
                </>
              )}
              {t.estimativaHoras && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimativa</span>
                    <span>{t.estimativaHoras}h</span>
                  </div>
                </>
              )}
              {t.horasGastas && Number(t.horasGastas) > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas gastas</span>
                    <span>{t.horasGastas}h</span>
                  </div>
                </>
              )}
              {t.tags && (t.tags as string[]).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground block mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {(t.tags as string[]).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Arquivos */}
          {t.arquivos && t.arquivos.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Arquivos ({t.arquivos.length})
              </CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {t.arquivos.map((a: any) => (
                  <a key={a.id} href={a.storageUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-sm text-primary">
                    <Paperclip className="w-3 h-3" />
                    {a.nomeOriginal}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
