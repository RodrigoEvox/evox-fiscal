import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ClipboardList, Plus, Edit2, Trash2, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SlaConfig() {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: '',
    setorId: null as number | null,
    servicoId: null as number | null,
    prioridadePadrao: 'media' as string,
    slaHorasPadrao: 48,
    slaHorasAlerta: 24,
    autoAtribuir: false,
    responsavelPadraoId: null as number | null,
  });

  const slaConfigs = trpc.slaConfig.list.useQuery();
  const setores = trpc.setores.list.useQuery();
  const servicos = trpc.servicos.list.useQuery();
  const usuarios = trpc.users.list.useQuery();

  const createSla = trpc.slaConfig.create.useMutation({
    onSuccess: () => { slaConfigs.refetch(); setShowNew(false); toast.success('Configuração SLA criada'); },
    onError: (e) => toast.error(e.message),
  });
  const updateSla = trpc.slaConfig.update.useMutation({
    onSuccess: () => { slaConfigs.refetch(); setEditingId(null); toast.success('Configuração SLA atualizada'); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSla = trpc.slaConfig.delete.useMutation({
    onSuccess: () => { slaConfigs.refetch(); toast.success('Configuração SLA removida'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({
    nome: '', setorId: null, servicoId: null, prioridadePadrao: 'media',
    slaHorasPadrao: 48, slaHorasAlerta: 24, autoAtribuir: false, responsavelPadraoId: null,
  });

  const prioridadeBadge = (p: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      baixa: { label: 'Baixa', variant: 'secondary' },
      media: { label: 'Média', variant: 'default' },
      alta: { label: 'Alta', variant: 'destructive' },
      urgente: { label: 'Urgente', variant: 'destructive' },
    };
    const item = map[p] || { label: p, variant: 'outline' as const };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  const getSetorNome = (id: number | null) => {
    if (!id || !setores.data) return 'Todos';
    return (setores.data as any[]).find(s => s.id === id)?.nome || '—';
  };

  const getServicoNome = (id: number | null) => {
    if (!id || !servicos.data) return 'Todos';
    return (servicos.data as any[]).find(s => s.id === id)?.nome || '—';
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-500" />
            Configuração de SLA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Defina os prazos padrão, prioridades e alertas para cada tipo de tarefa
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowNew(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Configuração
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>SLA (horas)</TableHead>
                <TableHead>Alerta (horas)</TableHead>
                <TableHead>Auto-atribuir</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(slaConfigs.data as any[] | undefined)?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                    Nenhuma configuração de SLA cadastrada
                  </TableCell>
                </TableRow>
              )}
              {(slaConfigs.data as any[] | undefined)?.map((sla: any) => (
                <TableRow key={sla.id}>
                  <TableCell className="font-medium">{sla.nome}</TableCell>
                  <TableCell className="text-sm">{getSetorNome(sla.setorId)}</TableCell>
                  <TableCell className="text-sm">{getServicoNome(sla.servicoId)}</TableCell>
                  <TableCell>{prioridadeBadge(sla.prioridadePadrao || 'media')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{sla.slaHorasPadrao}h</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>{sla.slaHorasAlerta || '—'}h</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sla.autoAtribuir ? 'default' : 'outline'}>
                      {sla.autoAtribuir ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingId(sla.id);
                          setForm({
                            nome: sla.nome,
                            setorId: sla.setorId,
                            servicoId: sla.servicoId,
                            prioridadePadrao: sla.prioridadePadrao || 'media',
                            slaHorasPadrao: sla.slaHorasPadrao,
                            slaHorasAlerta: sla.slaHorasAlerta || 24,
                            autoAtribuir: sla.autoAtribuir || false,
                            responsavelPadraoId: sla.responsavelPadraoId,
                          });
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Remover esta configuração de SLA?')) {
                            deleteSla.mutate({ id: sla.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar SLA */}
      <Dialog open={showNew || !!editingId} onOpenChange={() => { setShowNew(false); setEditingId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Nova'} Configuração de SLA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: SLA Padrão Crédito" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Setor</Label>
                <Select value={form.setorId?.toString() || 'todos'} onValueChange={v => setForm(f => ({ ...f, setorId: v === 'todos' ? null : parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os setores</SelectItem>
                    {(setores.data as any[] | undefined)?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço</Label>
                <Select value={form.servicoId?.toString() || 'todos'} onValueChange={v => setForm(f => ({ ...f, servicoId: v === 'todos' ? null : parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os serviços</SelectItem>
                    {(servicos.data as any[] | undefined)?.filter((s: any) => s.ativo).map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prioridade Padrão</Label>
                <Select value={form.prioridadePadrao} onValueChange={v => setForm(f => ({ ...f, prioridadePadrao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SLA (horas)</Label>
                <Input type="number" value={form.slaHorasPadrao} onChange={e => setForm(f => ({ ...f, slaHorasPadrao: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Alerta (horas antes)</Label>
                <Input type="number" value={form.slaHorasAlerta} onChange={e => setForm(f => ({ ...f, slaHorasAlerta: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.autoAtribuir} onCheckedChange={v => setForm(f => ({ ...f, autoAtribuir: v }))} />
              <Label>Auto-atribuir tarefas ao responsável padrão</Label>
            </div>
            {form.autoAtribuir && (
              <div>
                <Label>Responsável Padrão</Label>
                <Select value={form.responsavelPadraoId?.toString() || 'none'} onValueChange={v => setForm(f => ({ ...f, responsavelPadraoId: v === 'none' ? null : parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(usuarios.data as any[] | undefined)?.filter((u: any) => u.ativo).map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.apelido || u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNew(false); setEditingId(null); }}>Cancelar</Button>
            <Button
              onClick={() => {
                if (editingId) {
                  updateSla.mutate({ id: editingId, data: form as any });
                } else {
                  createSla.mutate({
                    nome: form.nome,
                    setorId: form.setorId,
                    servicoId: form.servicoId,
                    prioridadePadrao: form.prioridadePadrao as any,
                    slaHorasPadrao: form.slaHorasPadrao,
                    slaHorasAlerta: form.slaHorasAlerta,
                    autoAtribuir: form.autoAtribuir,
                    responsavelPadraoId: form.responsavelPadraoId,
                  });
                }
              }}
              disabled={!form.nome || createSla.isPending || updateSla.isPending}
            >
              {(createSla.isPending || updateSla.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
