import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, BarChart3, ClipboardCheck, FileText, Trash2, Send,
  Eye, CheckCircle2, Clock, XCircle, AlertCircle, Loader2,
  Star, MessageSquare, ToggleLeft, ThumbsUp, ThumbsDown,
  Download
} from 'lucide-react';
import { generatePesquisaClimaPdf } from '@/lib/pesquisaClimaPdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  ativa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  encerrada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  ativa: 'Ativa',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
};

const TIPO_LABELS: Record<string, string> = {
  escala: 'Escala (1-5)',
  multipla_escolha: 'Múltipla Escolha',
  texto_livre: 'Texto Livre',
  sim_nao: 'Sim/Não',
};

const TIPO_ICONS: Record<string, any> = {
  escala: Star,
  multipla_escolha: ClipboardCheck,
  texto_livre: MessageSquare,
  sim_nao: ToggleLeft,
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

type PerguntaForm = {
  texto: string;
  tipo: string;
  opcoes: string;
  obrigatoria: boolean;
  categoria: string;
};

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function PesquisaClima() {
  const [tab, setTab] = useState('pesquisas');
  const [showCreate, setShowCreate] = useState(false);
  const [showResponder, setShowResponder] = useState<any>(null);
  const [showResultados, setShowResultados] = useState<any>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [anonima, setAnonima] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([]);
  const [respostas, setRespostas] = useState<Record<number, { escala?: number; texto?: string; opcao?: string }>>({});

  const { data: pesquisas, isLoading, refetch } = trpc.pesquisaClima.list.useQuery();

  const createMut = trpc.pesquisaClima.create.useMutation({
    onSuccess: () => {
      toast.success('Pesquisa de clima criada com sucesso');
      setShowCreate(false);
      resetForm();
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.pesquisaClima.update.useMutation({
    onSuccess: () => {
      toast.success('Pesquisa atualizada');
      refetch();
    },
  });

  const deleteMut = trpc.pesquisaClima.delete.useMutation({
    onSuccess: () => {
      toast.success('Pesquisa excluída');
      refetch();
    },
  });

  const responderMut = trpc.pesquisaClima.responder.useMutation({
    onSuccess: () => {
      toast.success('Respostas enviadas com sucesso! Obrigado pela participação.');
      setShowResponder(null);
      setRespostas({});
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setTitulo('');
    setDescricao('');
    setAnonima(true);
    setDataInicio('');
    setDataFim('');
    setPerguntas([]);
  }

  function addPergunta() {
    setPerguntas([...perguntas, { texto: '', tipo: 'escala', opcoes: '', obrigatoria: true, categoria: '' }]);
  }

  function removePergunta(idx: number) {
    setPerguntas(perguntas.filter((_, i) => i !== idx));
  }

  function updatePerguntaForm(idx: number, field: string, value: any) {
    const updated = [...perguntas];
    (updated[idx] as any)[field] = value;
    setPerguntas(updated);
  }

  function handleCreate() {
    if (!titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    const validPerguntas = perguntas.filter(p => p.texto.trim());
    createMut.mutate({
      titulo,
      descricao: descricao || undefined,
      anonima,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      perguntas: validPerguntas.map((p, i) => ({
        texto: p.texto,
        tipo: p.tipo as any,
        opcoes: p.tipo === 'multipla_escolha' ? p.opcoes.split(',').map(o => o.trim()).filter(Boolean) : undefined,
        ordem: i,
        obrigatoria: p.obrigatoria,
        categoria: p.categoria || undefined,
      })),
    });
  }

  function handleResponder(pesquisa: any) {
    setShowResponder(pesquisa);
    setRespostas({});
  }

  function submitRespostas() {
    if (!showResponder) return;
    const perguntasList = (showResponder as any)._perguntas || [];
    const respostasArr = perguntasList.map((p: any) => {
      const r = respostas[p.id] || {};
      return {
        perguntaId: p.id,
        valorEscala: r.escala,
        valorTexto: r.texto,
        valorOpcao: r.opcao,
      };
    });
    responderMut.mutate({ pesquisaId: showResponder.id, respostas: respostasArr });
  }

  const stats = useMemo(() => {
    const list = pesquisas || [];
    return {
      total: list.length,
      ativas: list.filter((p: any) => p.status === 'ativa').length,
      encerradas: list.filter((p: any) => p.status === 'encerrada').length,
      totalRespostas: list.reduce((acc: number, p: any) => acc + (p.totalRespostas || 0), 0),
    };
  }, [pesquisas]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            Pesquisa de Clima Organizacional
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie pesquisas anônimas, colete feedback e analise o clima da organização
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nova Pesquisa
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Pesquisas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativas}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Encerradas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.encerradas}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Respostas</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalRespostas}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pesquisas List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !pesquisas?.length ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma pesquisa de clima criada ainda.</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Criar Primeira Pesquisa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(pesquisas as any[]).map((p) => (
            <PesquisaCard
              key={p.id}
              pesquisa={p}
              onActivate={() => updateMut.mutate({ id: p.id, status: 'ativa' })}
              onEncerrar={() => updateMut.mutate({ id: p.id, status: 'encerrada' })}
              onDelete={() => { if (confirm('Excluir esta pesquisa?')) deleteMut.mutate({ id: p.id }); }}
              onResponder={() => handleResponder(p)}
              onVerResultados={() => setShowResultados(p)}
            />
          ))}
        </div>
      )}

      {/* Dialog: Create Pesquisa */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Pesquisa de Clima</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Pesquisa de Clima 2026 - 1º Semestre" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição da pesquisa" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input type="checkbox" checked={anonima} onChange={e => setAnonima(e.target.checked)} className="rounded" />
                <Label>Pesquisa Anônima</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Perguntas</Label>
                <Button variant="outline" size="sm" onClick={addPergunta}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Pergunta
                </Button>
              </div>
              {perguntas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Adicione perguntas à pesquisa
                </p>
              )}
              <div className="space-y-3">
                {perguntas.map((p, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-6">#{idx + 1}</span>
                      <Input
                        className="flex-1"
                        value={p.texto}
                        onChange={e => updatePerguntaForm(idx, 'texto', e.target.value)}
                        placeholder="Texto da pergunta"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removePergunta(idx)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={p.tipo} onValueChange={v => updatePerguntaForm(idx, 'tipo', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TIPO_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={p.categoria}
                        onChange={e => updatePerguntaForm(idx, 'categoria', e.target.value)}
                        placeholder="Categoria (ex: Liderança)"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={p.obrigatoria}
                          onChange={e => updatePerguntaForm(idx, 'obrigatoria', e.target.checked)}
                          className="rounded"
                        />
                        <Label className="text-xs">Obrigatória</Label>
                      </div>
                    </div>
                    {p.tipo === 'multipla_escolha' && (
                      <Input
                        value={p.opcoes}
                        onChange={e => updatePerguntaForm(idx, 'opcoes', e.target.value)}
                        placeholder="Opções separadas por vírgula (ex: Ótimo, Bom, Regular, Ruim)"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Pesquisa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Responder Pesquisa */}
      {showResponder && (
        <ResponderDialog
          pesquisa={showResponder}
          respostas={respostas}
          setRespostas={setRespostas}
          onSubmit={submitRespostas}
          onClose={() => { setShowResponder(null); setRespostas({}); }}
          isPending={responderMut.isPending}
        />
      )}

      {/* Dialog: Resultados */}
      {showResultados && (
        <ResultadosDialog
          pesquisa={showResultados}
          onClose={() => setShowResultados(null)}
        />
      )}
    </div>
  );
}

function PesquisaCard({ pesquisa, onActivate, onEncerrar, onDelete, onResponder, onVerResultados }: {
  pesquisa: any;
  onActivate: () => void;
  onEncerrar: () => void;
  onDelete: () => void;
  onResponder: () => void;
  onVerResultados: () => void;
}) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{pesquisa.titulo}</h3>
              <Badge className={STATUS_COLORS[pesquisa.status] || ''}>
                {STATUS_LABELS[pesquisa.status] || pesquisa.status}
              </Badge>
              {pesquisa.anonima && <Badge variant="outline" className="text-xs">Anônima</Badge>}
            </div>
            {pesquisa.descricao && <p className="text-sm text-muted-foreground mb-1">{pesquisa.descricao}</p>}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {pesquisa.dataInicio && <span>Início: {formatDateBR(pesquisa.dataInicio)}</span>}
              {pesquisa.dataFim && <span>Fim: {formatDateBR(pesquisa.dataFim)}</span>}
              <span>{pesquisa.totalRespostas || 0} resposta(s)</span>
              <span>Criada por {pesquisa.criadoPorNome}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {pesquisa.status === 'rascunho' && (
              <Button size="sm" variant="default" onClick={onActivate}>
                <Send className="w-4 h-4 mr-1" /> Ativar
              </Button>
            )}
            {pesquisa.status === 'ativa' && (
              <>
                <Button size="sm" variant="outline" onClick={onResponder}>
                  <ClipboardCheck className="w-4 h-4 mr-1" /> Responder
                </Button>
                <Button size="sm" variant="secondary" onClick={onEncerrar}>
                  <XCircle className="w-4 h-4 mr-1" /> Encerrar
                </Button>
              </>
            )}
            {(pesquisa.status === 'ativa' || pesquisa.status === 'encerrada') && (pesquisa.totalRespostas || 0) > 0 && (
              <Button size="sm" variant="outline" onClick={onVerResultados}>
                <Eye className="w-4 h-4 mr-1" /> Resultados
              </Button>
            )}
            {pesquisa.status === 'rascunho' && (
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResponderDialog({ pesquisa, respostas, setRespostas, onSubmit, onClose, isPending }: {
  pesquisa: any;
  respostas: Record<number, any>;
  setRespostas: (r: Record<number, any>) => void;
  onSubmit: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const { data: perguntasList, isLoading } = trpc.pesquisaClima.perguntas.useQuery({ pesquisaId: pesquisa.id });

  // Store perguntas on pesquisa for submit
  if (perguntasList && !(pesquisa as any)._perguntas) {
    (pesquisa as any)._perguntas = perguntasList;
  }

  function updateResposta(perguntaId: number, field: string, value: any) {
    setRespostas({ ...respostas, [perguntaId]: { ...respostas[perguntaId], [field]: value } });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Responder: {pesquisa.titulo}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {pesquisa.anonima && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Esta pesquisa é anônima. Suas respostas não serão identificadas.
              </div>
            )}
            {(perguntasList as any[] || []).map((p: any, idx: number) => {
              const Icon = TIPO_ICONS[p.tipo] || Star;
              return (
                <div key={p.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{idx + 1}. {p.texto}</span>
                    {p.obrigatoria && <span className="text-red-500 text-xs">*</span>}
                  </div>
                  {p.categoria && <Badge variant="outline" className="text-xs">{p.categoria}</Badge>}

                  {p.tipo === 'escala' && (
                    <div className="flex items-center gap-2 pt-2">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          onClick={() => updateResposta(p.id, 'escala', v)}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                            respostas[p.id]?.escala === v
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-muted-foreground/30 hover:border-primary/50'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">1 = Muito Ruim, 5 = Excelente</span>
                    </div>
                  )}

                  {p.tipo === 'sim_nao' && (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => updateResposta(p.id, 'opcao', 'sim')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                          respostas[p.id]?.opcao === 'sim'
                            ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'border-muted-foreground/30 hover:border-green-300'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Sim
                      </button>
                      <button
                        onClick={() => updateResposta(p.id, 'opcao', 'nao')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                          respostas[p.id]?.opcao === 'nao'
                            ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'border-muted-foreground/30 hover:border-red-300'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" /> Não
                      </button>
                    </div>
                  )}

                  {p.tipo === 'multipla_escolha' && Array.isArray(p.opcoes) && (
                    <div className="space-y-2 pt-2">
                      {(p.opcoes as string[]).map((op: string) => (
                        <button
                          key={op}
                          onClick={() => updateResposta(p.id, 'opcao', op)}
                          className={`block w-full text-left px-4 py-2 rounded-lg border-2 transition-all text-sm ${
                            respostas[p.id]?.opcao === op
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'border-muted-foreground/30 hover:border-primary/50'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  )}

                  {p.tipo === 'texto_livre' && (
                    <Textarea
                      value={respostas[p.id]?.texto || ''}
                      onChange={e => updateResposta(p.id, 'texto', e.target.value)}
                      placeholder="Digite sua resposta..."
                      rows={3}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar Respostas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultadosDialog({ pesquisa, onClose }: { pesquisa: any; onClose: () => void }) {
  const { data, isLoading } = trpc.pesquisaClima.resultados.useQuery({ pesquisaId: pesquisa.id });
  const [exportingPdf, setExportingPdf] = useState(false);

  async function handleExportPdf() {
    if (!data) return;
    setExportingPdf(true);
    try {
      await generatePesquisaClimaPdf(pesquisa, data.perguntas as any[], data.respostas as any[]);
      toast.success('PDF gerado com sucesso!');
    } catch (e: any) {
      toast.error('Erro ao gerar PDF: ' + e.message);
    } finally {
      setExportingPdf(false);
    }
  }

  const chartData = useMemo(() => {
    if (!data) return [];
    return (data.perguntas as any[]).map((p: any) => {
      const resps = (data.respostas as any[]).filter((r: any) => r.perguntaId === p.id);
      if (p.tipo === 'escala') {
        const avg = resps.length > 0
          ? resps.reduce((sum: number, r: any) => sum + (r.valorEscala || 0), 0) / resps.length
          : 0;
        return { pergunta: p.texto.substring(0, 40) + (p.texto.length > 40 ? '...' : ''), media: Number(avg.toFixed(2)), total: resps.length, tipo: p.tipo };
      }
      if (p.tipo === 'sim_nao') {
        const sim = resps.filter((r: any) => r.valorOpcao === 'sim').length;
        const nao = resps.filter((r: any) => r.valorOpcao === 'nao').length;
        return { pergunta: p.texto.substring(0, 40) + (p.texto.length > 40 ? '...' : ''), sim, nao, total: resps.length, tipo: p.tipo };
      }
      if (p.tipo === 'multipla_escolha') {
        const opcoes: Record<string, number> = {};
        resps.forEach((r: any) => { if (r.valorOpcao) opcoes[r.valorOpcao] = (opcoes[r.valorOpcao] || 0) + 1; });
        return { pergunta: p.texto.substring(0, 40) + (p.texto.length > 40 ? '...' : ''), opcoes, total: resps.length, tipo: p.tipo };
      }
      return { pergunta: p.texto.substring(0, 40) + (p.texto.length > 40 ? '...' : ''), textos: resps.map((r: any) => r.valorTexto).filter(Boolean), total: resps.length, tipo: p.tipo };
    });
  }, [data]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resultados: {pesquisa.titulo}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Total de Respostas</p>
                <p className="text-2xl font-bold">{pesquisa.totalRespostas || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Perguntas</p>
                <p className="text-2xl font-bold">{data?.perguntas?.length || 0}</p>
              </div>
            </div>

            {chartData.map((item: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">{idx + 1}. {item.pergunta}</h4>
                <p className="text-xs text-muted-foreground mb-2">{item.total} resposta(s)</p>

                {item.tipo === 'escala' && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={60}>
                        <BarChart data={[item]} layout="vertical">
                          <XAxis type="number" domain={[0, 5]} hide />
                          <YAxis type="category" dataKey="pergunta" hide />
                          <Bar dataKey="media" fill="#3B82F6" radius={4} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{item.media}</p>
                      <p className="text-xs text-muted-foreground">de 5.0</p>
                    </div>
                  </div>
                )}

                {item.tipo === 'sim_nao' && (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={[{ name: 'Sim', value: item.sim }, { name: 'Não', value: item.nao }]}
                          cx="50%" cy="50%" outerRadius={50} dataKey="value" label>
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Legend />
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {item.tipo === 'multipla_escolha' && item.opcoes && (
                  <ResponsiveContainer width="100%" height={Math.max(100, Object.keys(item.opcoes).length * 40)}>
                    <BarChart data={Object.entries(item.opcoes).map(([k, v]) => ({ opcao: k, votos: v }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="opcao" width={120} />
                      <RechartsTooltip />
                      <Bar dataKey="votos" fill="#8B5CF6" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {item.tipo === 'texto_livre' && item.textos && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(item.textos as string[]).map((t: string, i: number) => (
                      <div key={i} className="bg-muted/30 rounded p-2 text-sm">"{t}"</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="default"
            onClick={handleExportPdf}
            disabled={exportingPdf || !data || (data?.respostas?.length || 0) === 0}
          >
            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
