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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import {
  Plus, Target, Star, Users, User, ClipboardCheck, Trash2,
  ChevronRight, BarChart3, Award, TrendingUp, Calendar, Edit2, ArrowLeft} from 'lucide-react';

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const CRITERIOS_PADRAO = [
  { nome: 'Qualidade do Trabalho', peso: 20, descricao: 'Precisão, atenção aos detalhes e padrão de entrega' },
  { nome: 'Produtividade', peso: 20, descricao: 'Volume de trabalho e cumprimento de prazos' },
  { nome: 'Trabalho em Equipe', peso: 15, descricao: 'Colaboração, comunicação e relacionamento interpessoal' },
  { nome: 'Iniciativa', peso: 15, descricao: 'Proatividade, inovação e resolução de problemas' },
  { nome: 'Conhecimento Técnico', peso: 15, descricao: 'Domínio das ferramentas e processos da área' },
  { nome: 'Comprometimento', peso: 15, descricao: 'Pontualidade, assiduidade e dedicação' },
];

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  em_andamento: 'bg-blue-100 text-blue-700',
  encerrado: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  em_andamento: 'Em Andamento',
  encerrado: 'Encerrado',
};

const TIPO_AVALIADOR_LABELS: Record<string, string> = {
  gestor: 'Gestor',
  par: 'Par',
  autoavaliacao: 'Autoavaliação',
  subordinado: 'Subordinado',
};

export default function AvaliacaoDesempenho() {
  const { user } = useAuth();
  const [tab, setTab] = useState('ciclos');
  const [showCicloForm, setShowCicloForm] = useState(false);
  const [showAvalForm, setShowAvalForm] = useState(false);
  const [selectedCiclo, setSelectedCiclo] = useState<any>(null);
  const [editCicloId, setEditCicloId] = useState<number | null>(null);

  const [cicloForm, setCicloForm] = useState({
    titulo: '', descricao: '', dataInicio: '', dataFim: '',
    status: 'rascunho' as string,
    criterios: CRITERIOS_PADRAO.map(c => ({ ...c })),
  });

  const [avalForm, setAvalForm] = useState({
    cicloId: 0, colaboradorId: 0, avaliadorId: 0,
    tipoAvaliador: 'gestor' as string,
    notas: [] as { criterio: string; nota: number; comentario: string }[],
    comentarioGeral: '', pontosFortes: '', pontosDesenvolvimento: '',
    planoCarreiraId: undefined as number | undefined,
  });

  const ciclos = trpc.ciclosAvaliacao.list.useQuery();
  const avaliacoes = trpc.avaliacoes.list.useQuery(selectedCiclo ? { cicloId: selectedCiclo.id } : undefined);
  const colaboradores = trpc.colaboradores.list.useQuery();
  const planosCarreira = trpc.planosCarreira.list.useQuery();

  const createCiclo = trpc.ciclosAvaliacao.create.useMutation({ onSuccess: () => { ciclos.refetch(); setShowCicloForm(false); toast.success('Ciclo criado!'); } });
  const updateCiclo = trpc.ciclosAvaliacao.update.useMutation({ onSuccess: () => { ciclos.refetch(); setShowCicloForm(false); toast.success('Ciclo atualizado!'); } });
  const deleteCiclo = trpc.ciclosAvaliacao.delete.useMutation({ onSuccess: () => { ciclos.refetch(); toast.success('Ciclo excluído!'); } });

  const createAval = trpc.avaliacoes.create.useMutation({ onSuccess: () => { avaliacoes.refetch(); setShowAvalForm(false); toast.success('Avaliação registrada!'); } });
  const updateAval = trpc.avaliacoes.update.useMutation({ onSuccess: () => { avaliacoes.refetch(); toast.success('Avaliação atualizada!'); } });
  const deleteAval = trpc.avaliacoes.delete.useMutation({ onSuccess: () => { avaliacoes.refetch(); toast.success('Avaliação excluída!'); } });

  const colabList = (colaboradores.data || []) as any[];
  const ciclosList = (ciclos.data || []) as any[];
  const avalList = (avaliacoes.data || []) as any[];
  const planosList = (planosCarreira.data || []) as any[];

  const resetCicloForm = () => {
    setCicloForm({ titulo: '', descricao: '', dataInicio: '', dataFim: '', status: 'rascunho', criterios: CRITERIOS_PADRAO.map(c => ({ ...c })) });
    setEditCicloId(null);
  };

  const handleSaveCiclo = () => {
    if (!cicloForm.titulo || !cicloForm.dataInicio || !cicloForm.dataFim) {
      toast.error('Preencha título e datas'); return;
    }
    if (editCicloId) {
      updateCiclo.mutate({ id: editCicloId, data: cicloForm });
    } else {
      createCiclo.mutate(cicloForm as any);
    }
  };

  const handleEditCiclo = (ciclo: any) => {
    setCicloForm({
      titulo: ciclo.titulo, descricao: ciclo.descricao || '',
      dataInicio: ciclo.dataInicio, dataFim: ciclo.dataFim,
      status: ciclo.status,
      criterios: ciclo.criterios || CRITERIOS_PADRAO.map(c => ({ ...c })),
    });
    setEditCicloId(ciclo.id);
    setShowCicloForm(true);
  };

  const openAvalForm = (ciclo: any) => {
    const criterios = (ciclo.criterios || CRITERIOS_PADRAO).map((c: any) => ({
      criterio: c.nome, nota: 0, comentario: '',
    }));
    setAvalForm({
      cicloId: ciclo.id, colaboradorId: 0, avaliadorId: user?.id || 0,
      tipoAvaliador: 'gestor', notas: criterios,
      comentarioGeral: '', pontosFortes: '', pontosDesenvolvimento: '',
      planoCarreiraId: undefined,
    });
    setShowAvalForm(true);
  };

  const calcNotaGeral = () => {
    const criterios = selectedCiclo?.criterios || CRITERIOS_PADRAO;
    let totalPeso = 0;
    let totalPonderado = 0;
    avalForm.notas.forEach((n, i) => {
      const peso = criterios[i]?.peso || 1;
      totalPeso += peso;
      totalPonderado += n.nota * peso;
    });
    return totalPeso > 0 ? (totalPonderado / totalPeso).toFixed(2) : '0.00';
  };

  const handleSaveAval = () => {
    if (!avalForm.colaboradorId) { toast.error('Selecione o colaborador'); return; }
    const colab = colabList.find(c => c.id === avalForm.colaboradorId);
    createAval.mutate({
      ...avalForm,
      colaboradorNome: colab?.nomeCompleto || '',
      avaliadorNome: user?.name || '',
      notaGeral: calcNotaGeral(),
      status: 'concluida',
    } as any);
  };

  // Stats for selected ciclo
  const cicloStats = useMemo(() => {
    if (!selectedCiclo) return null;
    const avs = avalList;
    const concluidas = avs.filter((a: any) => a.status === 'concluida');
    const mediaGeral = concluidas.length > 0
      ? (concluidas.reduce((sum: number, a: any) => sum + parseFloat(a.notaGeral || '0'), 0) / concluidas.length).toFixed(2)
      : '0.00';

    // Group by collaborator
    const porColab: Record<number, { nome: string; avaliacoes: any[]; media: number }> = {};
    avs.forEach((a: any) => {
      if (!porColab[a.colaboradorId]) {
        porColab[a.colaboradorId] = { nome: a.colaboradorNome || '', avaliacoes: [], media: 0 };
      }
      porColab[a.colaboradorId].avaliacoes.push(a);
    });
    Object.values(porColab).forEach(p => {
      const concl = p.avaliacoes.filter(a => a.status === 'concluida');
      p.media = concl.length > 0 ? concl.reduce((s, a) => s + parseFloat(a.notaGeral || '0'), 0) / concl.length : 0;
    });

    return { total: avs.length, concluidas: concluidas.length, mediaGeral, porColab };
  }, [avalList, selectedCiclo]);

  const getNotaColor = (nota: number) => {
    if (nota >= 8) return 'text-green-600';
    if (nota >= 6) return 'text-blue-600';
    if (nota >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNotaLabel = (nota: number) => {
    if (nota >= 9) return 'Excepcional';
    if (nota >= 8) return 'Excelente';
    if (nota >= 7) return 'Bom';
    if (nota >= 6) return 'Satisfatório';
    if (nota >= 4) return 'Regular';
    return 'Insuficiente';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold">Avaliação de Desempenho 360°</h1>

              <p className="text-muted-foreground">Ciclos de avaliação por múltiplas perspectivas vinculados aos planos de carreira</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { resetCicloForm(); setShowCicloForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Ciclo
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ciclos"><Target className="w-4 h-4 mr-1" /> Ciclos</TabsTrigger>
          <TabsTrigger value="resultados" disabled={!selectedCiclo}><BarChart3 className="w-4 h-4 mr-1" /> Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="ciclos" className="space-y-4 mt-4">
          {ciclosList.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum ciclo de avaliação criado.</p>
              <p className="text-sm mt-1">Crie o primeiro ciclo para iniciar as avaliações 360°.</p>
            </CardContent></Card>
          )}

          <div className="grid gap-4">
            {ciclosList.map((ciclo: any) => (
              <Card key={ciclo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{ciclo.titulo}</h3>
                        <Badge className={STATUS_COLORS[ciclo.status]}>{STATUS_LABELS[ciclo.status]}</Badge>
                      </div>
                      {ciclo.descricao && <p className="text-sm text-muted-foreground mb-3">{ciclo.descricao}</p>}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDateBR(ciclo.dataInicio)} a {formatDateBR(ciclo.dataFim)}</span>
                        <span className="flex items-center gap-1"><ClipboardCheck className="w-4 h-4" /> {(ciclo.criterios || []).length} critérios</span>
                        {ciclo.criadoPorNome && <span className="flex items-center gap-1"><User className="w-4 h-4" /> {ciclo.criadoPorNome}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditCiclo(ciclo)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedCiclo(ciclo); openAvalForm(ciclo); }}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Avaliar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedCiclo(ciclo); setTab('resultados'); }}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => {
                        if (confirm('Excluir este ciclo?')) deleteCiclo.mutate({ id: ciclo.id });
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resultados" className="space-y-4 mt-4">
          {selectedCiclo && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedCiclo.titulo}</h2>
                  <p className="text-sm text-muted-foreground">{formatDateBR(selectedCiclo.dataInicio)} a {formatDateBR(selectedCiclo.dataFim)}</p>
                </div>
                <Button onClick={() => openAvalForm(selectedCiclo)}>
                  <Plus className="w-4 h-4 mr-2" /> Nova Avaliação
                </Button>
              </div>

              {cicloStats && (
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{cicloStats.concluidas}/{cicloStats.total}</p>
                      <p className="text-xs text-muted-foreground">Avaliações Concluídas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <p className={`text-2xl font-bold ${getNotaColor(parseFloat(cicloStats.mediaGeral))}`}>{cicloStats.mediaGeral}</p>
                      <p className="text-xs text-muted-foreground">Média Geral</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{Object.keys(cicloStats.porColab).length}</p>
                      <p className="text-xs text-muted-foreground">Colaboradores Avaliados</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Results by collaborator */}
              {cicloStats && Object.entries(cicloStats.porColab).map(([colabId, data]) => (
                <Card key={colabId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{data.nome}</h4>
                          <p className="text-xs text-muted-foreground">{data.avaliacoes.length} avaliação(ões)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getNotaColor(data.media)}`}>{data.media.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{getNotaLabel(data.media)}</p>
                      </div>
                    </div>
                    <Progress value={data.media * 10} className="h-2 mb-3" />
                    <div className="space-y-2">
                      {data.avaliacoes.map((av: any) => (
                        <div key={av.id} className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{TIPO_AVALIADOR_LABELS[av.tipoAvaliador]}</Badge>
                            <span className="text-muted-foreground">{av.avaliadorNome}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold ${getNotaColor(parseFloat(av.notaGeral || '0'))}`}>
                              {parseFloat(av.notaGeral || '0').toFixed(2)}
                            </span>
                            <Badge className={av.status === 'concluida' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                              {av.status === 'concluida' ? 'Concluída' : 'Pendente'}
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => {
                              if (confirm('Excluir esta avaliação?')) deleteAval.mutate({ id: av.id });
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {avalList.length === 0 && (
                <Card><CardContent className="p-8 text-center text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma avaliação registrada neste ciclo.</p>
                </CardContent></Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Ciclo Form Dialog */}
      <Dialog open={showCicloForm} onOpenChange={(open) => { if (!open) resetCicloForm(); setShowCicloForm(open); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editCicloId ? 'Editar Ciclo' : 'Novo Ciclo de Avaliação'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={cicloForm.titulo} onChange={e => setCicloForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Avaliação 1º Semestre 2026" /></div>
            <div><Label>Descrição</Label><Textarea value={cicloForm.descricao} onChange={e => setCicloForm(f => ({ ...f, descricao: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Início *</Label><Input type="date" value={cicloForm.dataInicio} onChange={e => setCicloForm(f => ({ ...f, dataInicio: e.target.value }))} /></div>
              <div><Label>Data Fim *</Label><Input type="date" value={cicloForm.dataFim} onChange={e => setCicloForm(f => ({ ...f, dataFim: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={cicloForm.status} onValueChange={v => setCicloForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Critérios de Avaliação</Label>
                <Button size="sm" variant="outline" onClick={() => setCicloForm(f => ({
                  ...f, criterios: [...f.criterios, { nome: '', peso: 10, descricao: '' }]
                }))}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {cicloForm.criterios.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded p-2">
                    <Input className="flex-1" placeholder="Nome do critério" value={c.nome} onChange={e => {
                      const arr = [...cicloForm.criterios]; arr[i] = { ...arr[i], nome: e.target.value };
                      setCicloForm(f => ({ ...f, criterios: arr }));
                    }} />
                    <div className="flex items-center gap-1 w-24">
                      <Input type="number" className="w-16" value={c.peso} onChange={e => {
                        const arr = [...cicloForm.criterios]; arr[i] = { ...arr[i], peso: Number(e.target.value) };
                        setCicloForm(f => ({ ...f, criterios: arr }));
                      }} />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => {
                      setCicloForm(f => ({ ...f, criterios: f.criterios.filter((_, j) => j !== i) }));
                    }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total dos pesos: {cicloForm.criterios.reduce((s, c) => s + c.peso, 0)}%
                {cicloForm.criterios.reduce((s, c) => s + c.peso, 0) !== 100 && (
                  <span className="text-yellow-600 ml-2">(recomendado: 100%)</span>
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetCicloForm(); setShowCicloForm(false); }}>Cancelar</Button>
            <Button onClick={handleSaveCiclo} disabled={createCiclo.isPending || updateCiclo.isPending}>
              {editCicloId ? 'Salvar' : 'Criar Ciclo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avaliação Form Dialog */}
      <Dialog open={showAvalForm} onOpenChange={setShowAvalForm}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Avaliação 360°</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Colaborador Avaliado *</Label>
                <Select value={avalForm.colaboradorId ? String(avalForm.colaboradorId) : ''} onValueChange={v => setAvalForm(f => ({ ...f, colaboradorId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger>
                  <SelectContent>
                    {colabList.filter(c => c.ativo !== false).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto} — {c.cargo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Avaliador</Label>
                <Select value={avalForm.tipoAvaliador} onValueChange={v => setAvalForm(f => ({ ...f, tipoAvaliador: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gestor">Gestor (Superior)</SelectItem>
                    <SelectItem value="par">Par (Colega)</SelectItem>
                    <SelectItem value="autoavaliacao">Autoavaliação</SelectItem>
                    <SelectItem value="subordinado">Subordinado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vincular a plano de carreira */}
            <div>
              <Label>Vincular a Plano de Carreira (opcional)</Label>
              <Select value={avalForm.planoCarreiraId ? String(avalForm.planoCarreiraId) : 'none'} onValueChange={v => setAvalForm(f => ({ ...f, planoCarreiraId: v === 'none' ? undefined : Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {planosList.filter((p: any) => !avalForm.colaboradorId || p.colaboradorId === avalForm.colaboradorId).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Criteria scoring */}
            <div>
              <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-500" /> Avaliação por Critérios
              </Label>
              <div className="space-y-3">
                {avalForm.notas.map((n, i) => {
                  const criterios = selectedCiclo?.criterios || CRITERIOS_PADRAO;
                  const criterio = criterios[i];
                  return (
                    <Card key={i} className="border">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-sm">{n.criterio}</span>
                            {criterio?.descricao && <p className="text-xs text-muted-foreground">{criterio.descricao}</p>}
                          </div>
                          <Badge variant="outline" className="text-xs">Peso: {criterio?.peso || 0}%</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[1,2,3,4,5,6,7,8,9,10].map(v => (
                              <button key={v} onClick={() => {
                                const arr = [...avalForm.notas]; arr[i] = { ...arr[i], nota: v };
                                setAvalForm(f => ({ ...f, notas: arr }));
                              }}
                              className={`w-7 h-7 rounded-full text-xs font-medium transition-all ${
                                n.nota >= v
                                  ? v >= 8 ? 'bg-green-500 text-white' : v >= 6 ? 'bg-blue-500 text-white' : v >= 4 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}>
                                {v}
                              </button>
                            ))}
                          </div>
                          <span className={`text-sm font-semibold min-w-[80px] ${getNotaColor(n.nota)}`}>
                            {n.nota > 0 ? getNotaLabel(n.nota) : '—'}
                          </span>
                        </div>
                        <Input className="mt-2" placeholder="Comentário (opcional)" value={n.comentario} onChange={e => {
                          const arr = [...avalForm.notas]; arr[i] = { ...arr[i], comentario: e.target.value };
                          setAvalForm(f => ({ ...f, notas: arr }));
                        }} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {avalForm.notas.some(n => n.nota > 0) && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium">Nota Geral Ponderada:</span>
                  <span className={`text-xl font-bold ${getNotaColor(parseFloat(calcNotaGeral()))}`}>
                    {calcNotaGeral()} — {getNotaLabel(parseFloat(calcNotaGeral()))}
                  </span>
                </div>
              )}
            </div>

            <div><Label>Pontos Fortes</Label><Textarea value={avalForm.pontosFortes} onChange={e => setAvalForm(f => ({ ...f, pontosFortes: e.target.value }))} rows={2} placeholder="Destaque os pontos positivos do colaborador" /></div>
            <div><Label>Pontos a Desenvolver</Label><Textarea value={avalForm.pontosDesenvolvimento} onChange={e => setAvalForm(f => ({ ...f, pontosDesenvolvimento: e.target.value }))} rows={2} placeholder="Áreas que precisam de melhoria" /></div>
            <div><Label>Comentário Geral</Label><Textarea value={avalForm.comentarioGeral} onChange={e => setAvalForm(f => ({ ...f, comentarioGeral: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvalForm(false)}>Cancelar</Button>
            <Button onClick={handleSaveAval} disabled={createAval.isPending}>
              Registrar Avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
