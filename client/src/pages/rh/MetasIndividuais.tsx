import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Plus, Target, TrendingUp, BarChart3, Trash2, Edit2,
  CheckCircle2, Clock, XCircle, AlertCircle, Filter, User, ArrowLeft} from 'lucide-react';

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const CATEGORIA_LABELS: Record<string, string> = {
  produtividade: 'Produtividade',
  qualidade: 'Qualidade',
  financeiro: 'Financeiro',
  desenvolvimento: 'Desenvolvimento',
  cliente: 'Cliente',
  processo: 'Processo',
  outro: 'Outro',
};

const CATEGORIA_COLORS: Record<string, string> = {
  produtividade: 'bg-blue-100 text-blue-700',
  qualidade: 'bg-green-100 text-green-700',
  financeiro: 'bg-purple-100 text-purple-700',
  desenvolvimento: 'bg-orange-100 text-orange-700',
  cliente: 'bg-cyan-100 text-cyan-700',
  processo: 'bg-yellow-100 text-yellow-700',
  outro: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS: Record<string, string> = {
  nao_iniciada: 'Não Iniciada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const STATUS_ICONS: Record<string, any> = {
  nao_iniciada: Clock,
  em_andamento: AlertCircle,
  concluida: CheckCircle2,
  cancelada: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  nao_iniciada: 'bg-gray-100 text-gray-700',
  em_andamento: 'bg-blue-100 text-blue-700',
  concluida: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
};

export default function MetasIndividuais() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [filterColaborador, setFilterColaborador] = useState<string>('all');
  const [filterCiclo, setFilterCiclo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [form, setForm] = useState({
    colaboradorId: 0,
    colaboradorNome: '',
    cicloId: undefined as number | undefined,
    titulo: '',
    descricao: '',
    categoria: 'outro' as string,
    unidadeMedida: '%',
    valorMeta: '',
    valorAtual: '0',
    peso: 1,
    dataInicio: '',
    dataFim: '',
    status: 'nao_iniciada' as string,
    observacao: '',
  });

  const metas = trpc.metasIndividuais.list.useQuery();
  const colaboradores = trpc.colaboradores.list.useQuery();
  const ciclos = trpc.ciclosAvaliacao.list.useQuery();
  const avaliacoes = trpc.avaliacoes.list.useQuery();
  const utils = trpc.useUtils();

  const createMeta = trpc.metasIndividuais.create.useMutation({
    onSuccess: () => { utils.metasIndividuais.invalidate(); toast.success('Meta criada com sucesso!'); resetForm(); },
    onError: (err) => toast.error('Erro ao criar meta: ' + err.message),
  });
  const updateMeta = trpc.metasIndividuais.update.useMutation({
    onSuccess: () => { utils.metasIndividuais.invalidate(); toast.success('Meta atualizada!'); resetForm(); },
    onError: (err) => toast.error('Erro ao atualizar: ' + err.message),
  });
  const deleteMeta = trpc.metasIndividuais.delete.useMutation({
    onSuccess: () => { utils.metasIndividuais.invalidate(); toast.success('Meta excluída!'); },
    onError: (err) => toast.error('Erro ao excluir: ' + err.message),
  });

  const metasList = (metas.data || []) as any[];
  const colabList = (colaboradores.data || []) as any[];
  const cicloList = (ciclos.data || []) as any[];
  const avalList = (avaliacoes.data || []) as any[];
  const ativosColabs = colabList.filter(c => c.ativo !== false);

  // Filtered metas
  const filteredMetas = useMemo(() => {
    let result = [...metasList];
    if (filterColaborador !== 'all') {
      result = result.filter(m => String(m.colaboradorId) === filterColaborador);
    }
    if (filterCiclo !== 'all') {
      result = result.filter(m => String(m.cicloId) === filterCiclo);
    }
    if (filterStatus !== 'all') {
      result = result.filter(m => m.status === filterStatus);
    }
    return result;
  }, [metasList, filterColaborador, filterCiclo, filterStatus]);

  // KPI summary
  const summary = useMemo(() => {
    const total = metasList.length;
    const concluidas = metasList.filter(m => m.status === 'concluida').length;
    const emAndamento = metasList.filter(m => m.status === 'em_andamento').length;
    const naoIniciadas = metasList.filter(m => m.status === 'nao_iniciada').length;
    const avgProgress = total > 0
      ? metasList.reduce((sum, m) => {
          const meta = Number(m.valorMeta) || 1;
          const atual = Number(m.valorAtual) || 0;
          return sum + Math.min((atual / meta) * 100, 100);
        }, 0) / total
      : 0;
    return { total, concluidas, emAndamento, naoIniciadas, avgProgress };
  }, [metasList]);

  // Get avaliação média for a colaborador
  const getAvaliacaoMedia = (colaboradorId: number) => {
    const avalsColab = avalList.filter(a => a.colaboradorId === colaboradorId && a.status === 'concluida');
    if (avalsColab.length === 0) return null;
    const avg = avalsColab.reduce((sum, a) => sum + Number(a.notaGeral || 0), 0) / avalsColab.length;
    return avg.toFixed(1);
  };

  function resetForm() {
    setForm({
      colaboradorId: 0, colaboradorNome: '', cicloId: undefined,
      titulo: '', descricao: '', categoria: 'outro', unidadeMedida: '%',
      valorMeta: '', valorAtual: '0', peso: 1, dataInicio: '', dataFim: '',
      status: 'nao_iniciada', observacao: '',
    });
    setEditId(null);
    setShowForm(false);
  }

  function handleEdit(meta: any) {
    setForm({
      colaboradorId: meta.colaboradorId,
      colaboradorNome: meta.colaboradorNome || '',
      cicloId: meta.cicloId || undefined,
      titulo: meta.titulo,
      descricao: meta.descricao || '',
      categoria: meta.categoria || 'outro',
      unidadeMedida: meta.unidadeMedida || '%',
      valorMeta: String(meta.valorMeta || ''),
      valorAtual: String(meta.valorAtual || '0'),
      peso: meta.peso || 1,
      dataInicio: meta.dataInicio || '',
      dataFim: meta.dataFim || '',
      status: meta.status || 'nao_iniciada',
      observacao: meta.observacao || '',
    });
    setEditId(meta.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.colaboradorId || !form.titulo || !form.valorMeta) {
      toast.error('Preencha os campos obrigatórios: Colaborador, Título e Valor Meta');
      return;
    }
    if (editId) {
      updateMeta.mutate({ id: editId, data: form });
    } else {
      createMeta.mutate(form as any);
    }
  }

  function handleColaboradorSelect(colabId: string) {
    const colab = ativosColabs.find(c => c.id === Number(colabId));
    setForm(prev => ({
      ...prev,
      colaboradorId: Number(colabId),
      colaboradorNome: colab?.nomeCompleto || '',
    }));
  }

  function getProgressPercent(meta: any) {
    const metaVal = Number(meta.valorMeta) || 1;
    const atualVal = Number(meta.valorAtual) || 0;
    return Math.min((atualVal / metaVal) * 100, 100);
  }

  function getProgressColor(pct: number) {
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 70) return 'bg-blue-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" /> Metas Individuais (KPIs)
          </h1>

              <p className="text-muted-foreground">Gerencie metas mensuráveis vinculadas às avaliações 360°</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Meta
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Metas</p>
            <p className="text-3xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Concluídas</p>
            <p className="text-3xl font-bold text-green-600">{summary.concluidas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Em Andamento</p>
            <p className="text-3xl font-bold text-yellow-600">{summary.emAndamento}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Não Iniciadas</p>
            <p className="text-3xl font-bold text-gray-500">{summary.naoIniciadas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Progresso Médio</p>
            <p className="text-3xl font-bold text-purple-600">{summary.avgProgress.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="w-56">
          <Label className="text-xs text-muted-foreground mb-1 block">Colaborador</Label>
          <Select value={filterColaborador} onValueChange={setFilterColaborador}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ativosColabs.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <Label className="text-xs text-muted-foreground mb-1 block">Ciclo de Avaliação</Label>
          <Select value={filterCiclo} onValueChange={setFilterCiclo}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {cicloList.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.titulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="nao_iniciada">Não Iniciada</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(filterColaborador !== 'all' || filterCiclo !== 'all' || filterStatus !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterColaborador('all'); setFilterCiclo('all'); setFilterStatus('all'); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Metas List */}
      {filteredMetas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma meta encontrada</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Crie uma nova meta para acompanhar o desempenho dos colaboradores</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMetas.map(meta => {
            const pct = getProgressPercent(meta);
            const StatusIcon = STATUS_ICONS[meta.status] || Clock;
            const avalMedia = getAvaliacaoMedia(meta.colaboradorId);
            const ciclo = cicloList.find(c => c.id === meta.cicloId);
            return (
              <Card key={meta.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-base">{meta.titulo}</h3>
                        <Badge className={CATEGORIA_COLORS[meta.categoria] || CATEGORIA_COLORS.outro} variant="secondary">
                          {CATEGORIA_LABELS[meta.categoria] || meta.categoria}
                        </Badge>
                        <Badge className={STATUS_COLORS[meta.status] || STATUS_COLORS.nao_iniciada} variant="secondary">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {STATUS_LABELS[meta.status] || meta.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {meta.colaboradorNome || 'N/A'}</span>
                        {ciclo && <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> {ciclo.titulo}</span>}
                        {meta.dataInicio && meta.dataFim && (
                          <span>{formatDateBR(meta.dataInicio)} — {formatDateBR(meta.dataFim)}</span>
                        )}
                        {avalMedia && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <TrendingUp className="w-3.5 h-3.5" /> Avaliação: {avalMedia}/10
                          </span>
                        )}
                      </div>
                      {meta.descricao && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{meta.descricao}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">
                              {Number(meta.valorAtual || 0).toLocaleString('pt-BR')} / {Number(meta.valorMeta || 0).toLocaleString('pt-BR')} {meta.unidadeMedida || ''}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(pct)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-lg font-bold min-w-[50px] text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(meta)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"
                        onClick={() => { if (confirm('Excluir esta meta?')) deleteMeta.mutate({ id: meta.id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Meta' : 'Nova Meta Individual'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Colaborador *</Label>
                <Select value={form.colaboradorId ? String(form.colaboradorId) : ''} onValueChange={handleColaboradorSelect}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {ativosColabs.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ciclo de Avaliação</Label>
                <Select value={form.cicloId ? String(form.cicloId) : 'none'} onValueChange={v => setForm(prev => ({ ...prev, cicloId: v === 'none' ? undefined : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {cicloList.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Título da Meta *</Label>
              <Input value={form.titulo} onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Ex: Aumentar produtividade em 20%" />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descreva a meta e como será medida..." rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(prev => ({ ...prev, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade de Medida</Label>
                <Select value={form.unidadeMedida} onValueChange={v => setForm(prev => ({ ...prev, unidadeMedida: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="%">Percentual (%)</SelectItem>
                    <SelectItem value="R$">Reais (R$)</SelectItem>
                    <SelectItem value="un">Unidades</SelectItem>
                    <SelectItem value="h">Horas</SelectItem>
                    <SelectItem value="pts">Pontos</SelectItem>
                    <SelectItem value="nota">Nota (0-10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Peso</Label>
                <Input type="number" min={1} max={10} value={form.peso} onChange={e => setForm(prev => ({ ...prev, peso: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Meta (Alvo) *</Label>
                <Input type="number" step="0.01" value={form.valorMeta} onChange={e => setForm(prev => ({ ...prev, valorMeta: e.target.value }))} placeholder="Ex: 100" />
              </div>
              <div>
                <Label>Valor Atual (Progresso)</Label>
                <Input type="number" step="0.01" value={form.valorAtual} onChange={e => setForm(prev => ({ ...prev, valorAtual: e.target.value }))} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={form.dataInicio} onChange={e => setForm(prev => ({ ...prev, dataInicio: e.target.value }))} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={form.dataFim} onChange={e => setForm(prev => ({ ...prev, dataFim: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_iniciada">Não Iniciada</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={e => setForm(prev => ({ ...prev, observacao: e.target.value }))} placeholder="Notas adicionais..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMeta.isPending || updateMeta.isPending}>
              {editId ? 'Salvar Alterações' : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
