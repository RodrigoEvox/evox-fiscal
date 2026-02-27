import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { BookOpen, Plus, Search, Eye, Users, Scale, AlertTriangle, CheckCircle, FileText, Loader2, Gavel, AlertCircle, Pencil, Power, PowerOff } from 'lucide-react';

const potencialColors: Record<string, string> = {
  muito_alto: 'bg-red-100 text-red-700 border-red-200',
  alto: 'bg-orange-100 text-orange-700 border-orange-200',
  medio: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  baixo: 'bg-green-100 text-green-700 border-green-200',
};
const potencialLabels: Record<string, string> = { muito_alto: 'Muito Alto', alto: 'Alto', medio: 'Médio', baixo: 'Baixo' };
const classifLabels: Record<string, string> = { pacificada: 'Pacificada', judicial: 'Judicial', administrativa: 'Administrativa', controversa: 'Controversa' };
const classifColors: Record<string, string> = {
  pacificada: 'bg-green-100 text-green-700',
  judicial: 'bg-blue-100 text-blue-700',
  administrativa: 'bg-purple-100 text-purple-700',
  controversa: 'bg-red-100 text-red-700',
};
const classifIcons: Record<string, any> = {
  pacificada: CheckCircle,
  judicial: Gavel,
  administrativa: Scale,
  controversa: AlertCircle,
};
const tipoLabels: Record<string, string> = { exclusao_base: 'Exclusão de Base', credito_presumido: 'Crédito Presumido', recuperacao_indebito: 'Recuperação de Indébito', tese_judicial: 'Tese Judicial', tese_administrativa: 'Tese Administrativa' };

const emptyForm = {
  nome: '', tributoEnvolvido: '', tipo: '' as any, classificacao: '' as any,
  potencialFinanceiro: '' as any, potencialMercadologico: '' as any,
  grauRisco: '' as any, fundamentacaoLegal: '', jurisprudenciaRelevante: '',
  parecerTecnicoJuridico: '', prazoPrescricional: '5 anos',
  necessidadeAcaoJudicial: false, viaAdministrativa: false,
  aplicavelComercio: false, aplicavelIndustria: false, aplicavelServico: false,
  aplicavelContribuinteICMS: false, aplicavelContribuinteIPI: false,
  aplicavelLucroReal: false, aplicavelLucroPresumido: false, aplicavelSimplesNacional: false,
  slaApuracaoDias: '' as string | number,
};

export default function Teses() {
  const [search, setSearch] = useState('');
  const [filterClassif, setFilterClassif] = useState('all');
  const [filterPotencial, setFilterPotencial] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewTese, setViewTese] = useState<any>(null);
  const [showCarteira, setShowCarteira] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const utils = trpc.useUtils();

  const { data: teses = [], isLoading } = trpc.teses.list.useQuery();
  const { data: carteiraClientes = [] } = trpc.teses.checkCarteira.useQuery(
    { teseId: showCarteira! },
    { enabled: showCarteira !== null }
  );
  const seedMutation = trpc.seed.teses.useMutation({
    onSuccess: (d) => { utils.teses.list.invalidate(); toast.success(d.message); },
    onError: (e) => toast.error(e.message),
  });
  const createMutation = trpc.teses.create.useMutation({
    onSuccess: () => { utils.teses.list.invalidate(); setShowForm(false); setForm(emptyForm); setEditingId(null); toast.success('Tese criada com sucesso!'); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.teses.update.useMutation({
    onSuccess: () => { utils.teses.list.invalidate(); setShowForm(false); setForm(emptyForm); setEditingId(null); toast.success('Tese atualizada com sucesso!'); },
    onError: (e) => toast.error(e.message),
  });
  const toggleActiveMutation = trpc.teses.toggleActive.useMutation({
    onSuccess: (_, vars) => { utils.teses.list.invalidate(); toast.success(vars.ativa ? 'Tese ativada!' : 'Tese inativada!'); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = teses.filter((t: any) => {
    if (search && !t.nome.toLowerCase().includes(search.toLowerCase()) && !t.tributoEnvolvido.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterClassif !== 'all' && t.classificacao !== filterClassif) return false;
    if (filterPotencial !== 'all' && t.potencialFinanceiro !== filterPotencial) return false;
    return true;
  });

  const handleSave = () => {
    if (!form.nome || !form.tributoEnvolvido || !form.tipo || !form.classificacao || !form.potencialFinanceiro || !form.potencialMercadologico || !form.grauRisco) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form as any });
    } else {
      createMutation.mutate(form as any);
    }
  };

  const startEdit = (tese: any) => {
    setEditingId(tese.id);
    setForm({
      nome: tese.nome || '',
      tributoEnvolvido: tese.tributoEnvolvido || '',
      tipo: tese.tipo || '',
      classificacao: tese.classificacao || '',
      potencialFinanceiro: tese.potencialFinanceiro || '',
      potencialMercadologico: tese.potencialMercadologico || '',
      grauRisco: tese.grauRisco || '',
      fundamentacaoLegal: tese.fundamentacaoLegal || '',
      jurisprudenciaRelevante: tese.jurisprudenciaRelevante || '',
      parecerTecnicoJuridico: tese.parecerTecnicoJuridico || '',
      prazoPrescricional: tese.prazoPrescricional || '5 anos',
      necessidadeAcaoJudicial: !!tese.necessidadeAcaoJudicial,
      viaAdministrativa: !!tese.viaAdministrativa,
      aplicavelComercio: !!tese.aplicavelComercio,
      aplicavelIndustria: !!tese.aplicavelIndustria,
      aplicavelServico: !!tese.aplicavelServico,
      aplicavelContribuinteICMS: !!tese.aplicavelContribuinteICMS || !!tese.aplicavelContribuinteIcms,
      aplicavelContribuinteIPI: !!tese.aplicavelContribuinteIPI || !!tese.aplicavelContribuinteIpi,
      aplicavelLucroReal: !!tese.aplicavelLucroReal,
      aplicavelLucroPresumido: !!tese.aplicavelLucroPresumido,
      aplicavelSimplesNacional: !!tese.aplicavelSimplesNacional,
      slaApuracaoDias: tese.slaApuracaoDias || '',
    });
    setShowForm(true);
  };

  const resetAndClose = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const stats = {
    total: teses.length,
    ativas: teses.filter((t: any) => t.ativa).length,
    pacificadas: teses.filter((t: any) => t.classificacao === 'pacificada').length,
    judiciais: teses.filter((t: any) => t.classificacao === 'judicial').length,
    altosPotenciais: teses.filter((t: any) => t.potencialFinanceiro === 'muito_alto' || t.potencialFinanceiro === 'alto').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BookOpen className="w-6 h-6" /> Repositório de Teses Tributárias</h1>
          <p className="text-sm text-muted-foreground mt-1">Classificação, potencial financeiro/mercadológico e parecer técnico/jurídico</p>
        </div>
        <div className="flex gap-2">
          {teses.length === 0 && (
            <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Carregar Teses Padrão
            </Button>
          )}
          <Button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }} className="bg-[#0A2540] hover:bg-[#0A2540]/90"><Plus className="w-4 h-4 mr-2" /> Nova Tese</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{stats.ativas}</p><p className="text-xs text-muted-foreground">Ativas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.pacificadas}</p><p className="text-xs text-muted-foreground">Pacificadas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.judiciais}</p><p className="text-xs text-muted-foreground">Judiciais</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{stats.altosPotenciais}</p><p className="text-xs text-muted-foreground">Alto Potencial</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou tributo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterClassif} onValueChange={setFilterClassif}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Classificação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Classificações</SelectItem>
            <SelectItem value="pacificada">Pacificadas</SelectItem>
            <SelectItem value="judicial">Judiciais</SelectItem>
            <SelectItem value="administrativa">Administrativas</SelectItem>
            <SelectItem value="controversa">Controversas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPotencial} onValueChange={setFilterPotencial}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Potencial" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Potenciais</SelectItem>
            <SelectItem value="muito_alto">Muito Alto</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="medio">Médio</SelectItem>
            <SelectItem value="baixo">Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {teses.length === 0 ? 'Nenhuma tese cadastrada. Clique em "Carregar Teses Padrão" para iniciar.' : 'Nenhuma tese encontrada com os filtros aplicados.'}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t: any) => {
            const CIcon = classifIcons[t.classificacao] || Scale;
            const isInativa = !t.ativa;
            return (
              <Card key={t.id} className={`hover:shadow-md transition-shadow cursor-pointer ${isInativa ? 'opacity-60 border-dashed' : ''}`} onClick={() => setViewTese(t)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CIcon className={`w-4 h-4 ${t.classificacao === 'pacificada' ? 'text-green-500' : t.classificacao === 'judicial' ? 'text-blue-500' : t.classificacao === 'controversa' ? 'text-red-500' : 'text-amber-500'}`} />
                        <h3 className="font-semibold">{t.nome}</h3>
                        {isInativa && <Badge variant="outline" className="text-red-500 border-red-300 text-[10px]">Inativa</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{t.tributoEnvolvido}</Badge>
                        <Badge className={classifColors[t.classificacao] || ''}>{classifLabels[t.classificacao] || t.classificacao}</Badge>
                        <Badge className={potencialColors[t.potencialFinanceiro] || ''}>Fin: {potencialLabels[t.potencialFinanceiro]}</Badge>
                        <Badge className={potencialColors[t.potencialMercadologico] || ''}>Merc: {potencialLabels[t.potencialMercadologico]}</Badge>
                        <Badge variant={t.grauRisco === 'baixo' ? 'secondary' : t.grauRisco === 'medio' ? 'outline' : 'destructive'}>
                          Risco: {t.grauRisco === 'baixo' ? 'Baixo' : t.grauRisco === 'medio' ? 'Médio' : 'Alto'}
                        </Badge>
                        {t.viaAdministrativa && <Badge className="bg-green-100 text-green-700">Via Administrativa</Badge>}
                        {t.necessidadeAcaoJudicial && <Badge className="bg-blue-100 text-blue-700">Ação Judicial</Badge>}
                        {t.slaApuracaoDias ? <Badge className="bg-purple-100 text-purple-700 border-purple-200">SLA: {t.slaApuracaoDias} dias</Badge> : <Badge variant="outline" className="text-muted-foreground">SLA: N/C</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setViewTese(t)} title="Visualizar"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(t)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ id: t.id, ativa: !t.ativa })}
                        title={t.ativa ? 'Inativar' : 'Ativar'}
                        className={t.ativa ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                      >
                        {t.ativa ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowCarteira(t.id)} title="Ver clientes aderentes"><Users className="w-4 h-4" /></Button>
                    </div>
                  </div>
       
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Tese Dialog */}
      <Dialog open={!!viewTese} onOpenChange={() => setViewTese(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {viewTese && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" /> {viewTese.nome}
                  {!viewTese.ativa && <Badge variant="outline" className="text-red-500 border-red-300 ml-2">Inativa</Badge>}
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="geral">
                <TabsList className="mb-4">
                  <TabsTrigger value="geral">Geral</TabsTrigger>
                  <TabsTrigger value="parecer">Parecer Técnico</TabsTrigger>
                  <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
                </TabsList>
                <TabsContent value="geral" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Tributo</Label><p className="font-medium">{viewTese.tributoEnvolvido}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Tipo</Label><p className="font-medium">{tipoLabels[viewTese.tipo] || viewTese.tipo}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Classificação</Label><Badge className={classifColors[viewTese.classificacao]}>{classifLabels[viewTese.classificacao]}</Badge></div>
                    <div><Label className="text-xs text-muted-foreground">Grau de Risco</Label><p className="font-medium capitalize">{viewTese.grauRisco}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Potencial Financeiro</Label><Badge className={potencialColors[viewTese.potencialFinanceiro]}>{potencialLabels[viewTese.potencialFinanceiro]}</Badge></div>
                    <div><Label className="text-xs text-muted-foreground">Potencial Mercadológico</Label><Badge className={potencialColors[viewTese.potencialMercadologico]}>{potencialLabels[viewTese.potencialMercadologico]}</Badge></div>
                    <div><Label className="text-xs text-muted-foreground">Prazo Prescricional</Label><p>{viewTese.prazoPrescricional || 'N/A'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">SLA de Apuração</Label><p className="font-semibold">{viewTese.slaApuracaoDias ? `${viewTese.slaApuracaoDias} dias` : 'Não configurado'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Via</Label><p>{viewTese.necessidadeAcaoJudicial ? 'Judicial' : ''} {viewTese.viaAdministrativa ? 'Administrativa' : ''}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Status</Label><Badge className={viewTese.ativa ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{viewTese.ativa ? 'Ativa' : 'Inativa'}</Badge></div>
                  </div>
                  {viewTese.fundamentacaoLegal && (
                    <div><Label className="text-xs text-muted-foreground">Fundamentação Legal</Label><p className="text-sm mt-1 bg-muted p-3 rounded">{viewTese.fundamentacaoLegal}</p></div>
                  )}
                  {viewTese.jurisprudenciaRelevante && (
                    <div><Label className="text-xs text-muted-foreground">Jurisprudência Relevante</Label><p className="text-sm mt-1 bg-muted p-3 rounded">{viewTese.jurisprudenciaRelevante}</p></div>
                  )}
                </TabsContent>
                <TabsContent value="parecer" className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Parecer Técnico/Jurídico</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{viewTese.parecerTecnicoJuridico || 'Parecer não disponível.'}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="requisitos" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Requisitos Objetivos</CardTitle></CardHeader>
                      <CardContent>
                        {(viewTese.requisitosObjetivos || []).length > 0 ? (
                          <ul className="text-sm space-y-1">{(viewTese.requisitosObjetivos || []).map((r: string, i: number) => <li key={i} className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> {r}</li>)}</ul>
                        ) : <p className="text-sm text-muted-foreground">Nenhum requisito definido</p>}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Impeditivos</CardTitle></CardHeader>
                      <CardContent>
                        {(viewTese.requisitosImpeditivos || []).length > 0 ? (
                          <ul className="text-sm space-y-1">{(viewTese.requisitosImpeditivos || []).map((r: string, i: number) => <li key={i} className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500 shrink-0" /> {r}</li>)}</ul>
                        ) : <p className="text-sm text-muted-foreground">Nenhum impeditivo definido</p>}
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Aplicabilidade</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {[
                          { key: 'aplicavelComercio', label: 'Comércio' },
                          { key: 'aplicavelIndustria', label: 'Indústria' },
                          { key: 'aplicavelServico', label: 'Serviço' },
                          { key: 'aplicavelLucroReal', label: 'Lucro Real' },
                          { key: 'aplicavelLucroPresumido', label: 'Lucro Presumido' },
                          { key: 'aplicavelSimplesNacional', label: 'Simples Nacional' },
                          { key: 'aplicavelContribuinteICMS', label: 'Contribuinte ICMS' },
                          { key: 'aplicavelContribuinteIPI', label: 'Contribuinte IPI' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${viewTese[key] ? 'bg-green-500' : 'bg-gray-300'}`} />
                            {label}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setViewTese(null); startEdit(viewTese); }}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button
                  variant={viewTese.ativa ? 'destructive' : 'default'}
                  onClick={() => { toggleActiveMutation.mutate({ id: viewTese.id, ativa: !viewTese.ativa }); setViewTese(null); }}
                >
                  {viewTese.ativa ? <><PowerOff className="w-4 h-4 mr-2" /> Inativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Check Carteira Dialog */}
      <Dialog open={showCarteira !== null} onOpenChange={() => setShowCarteira(null)}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Clientes Aderentes a Esta Tese</DialogTitle>
          </DialogHeader>
          {carteiraClientes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum cliente aderente encontrado na carteira atual.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{carteiraClientes.length} clientes potencialmente aderentes:</p>
              {carteiraClientes.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{c.razaoSocial}</p>
                      <p className="text-xs text-muted-foreground">{c.cnpj} — {c.regimeTributario?.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge className={c.prioridade === 'alta' ? 'bg-red-100 text-red-700' : c.prioridade === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-sky-100 text-sky-700'}>
                      {c.prioridade === 'alta' ? 'Alta' : c.prioridade === 'media' ? 'Média' : 'Baixa'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Tese Dialog */}
      <Dialog open={showForm} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Tese Tributária' : 'Nova Tese Tributária'}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-5 pr-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Identificação</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
                  <div><Label className="text-xs">Tributo Envolvido *</Label><Input value={form.tributoEnvolvido} onChange={e => setForm(f => ({ ...f, tributoEnvolvido: e.target.value }))} placeholder="PIS/COFINS, ICMS, etc." /></div>
                  <div><Label className="text-xs">Tipo *</Label>
                    <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Classificação e Potencial</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Classificação *</Label>
                    <Select value={form.classificacao} onValueChange={v => setForm(f => ({ ...f, classificacao: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(classifLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Potencial Financeiro *</Label>
                    <Select value={form.potencialFinanceiro} onValueChange={v => setForm(f => ({ ...f, potencialFinanceiro: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(potencialLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Potencial Mercadológico *</Label>
                    <Select value={form.potencialMercadologico} onValueChange={v => setForm(f => ({ ...f, potencialMercadologico: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(potencialLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Grau de Risco *</Label>
                    <Select value={form.grauRisco} onValueChange={v => setForm(f => ({ ...f, grauRisco: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Prazo Prescricional</Label><Input value={form.prazoPrescricional} onChange={e => setForm(f => ({ ...f, prazoPrescricional: e.target.value }))} /></div>
                  <div><Label className="text-xs">SLA de Apuração (dias)</Label><Input type="number" min="1" placeholder="Ex: 30" value={form.slaApuracaoDias} onChange={e => setForm(f => ({ ...f, slaApuracaoDias: e.target.value ? Number(e.target.value) : '' }))} /><p className="text-[10px] text-muted-foreground mt-1">Prazo em dias para apuração desta tese. Usado no cálculo automático de SLA das tarefas.</p></div>
                </div>
                <div className="flex gap-6 mt-3">
                  <div className="flex items-center gap-2"><Switch checked={form.necessidadeAcaoJudicial} onCheckedChange={v => setForm(f => ({ ...f, necessidadeAcaoJudicial: v }))} /><Label className="text-xs">Judicial</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.viaAdministrativa} onCheckedChange={v => setForm(f => ({ ...f, viaAdministrativa: v }))} /><Label className="text-xs">Administrativa</Label></div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Fundamentação e Parecer</h3>
                <div className="space-y-3">
                  <div><Label className="text-xs">Fundamentação Legal</Label><Textarea value={form.fundamentacaoLegal} onChange={e => setForm(f => ({ ...f, fundamentacaoLegal: e.target.value }))} rows={3} /></div>
                  <div><Label className="text-xs">Jurisprudência Relevante</Label><Textarea value={form.jurisprudenciaRelevante} onChange={e => setForm(f => ({ ...f, jurisprudenciaRelevante: e.target.value }))} rows={3} /></div>
                  <div><Label className="text-xs font-semibold text-[#0A2540]">Parecer Técnico/Jurídico</Label><Textarea value={form.parecerTecnicoJuridico} onChange={e => setForm(f => ({ ...f, parecerTecnicoJuridico: e.target.value }))} rows={4} /></div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Aplicabilidade</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'aplicavelComercio', label: 'Comércio' },
                    { key: 'aplicavelIndustria', label: 'Indústria' },
                    { key: 'aplicavelServico', label: 'Serviço' },
                    { key: 'aplicavelContribuinteICMS', label: 'Contribuinte ICMS' },
                    { key: 'aplicavelContribuinteIPI', label: 'Contribuinte IPI' },
                    { key: 'aplicavelLucroReal', label: 'Lucro Real' },
                    { key: 'aplicavelLucroPresumido', label: 'Lucro Presumido' },
                    { key: 'aplicavelSimplesNacional', label: 'Simples Nacional' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-xs">{label}</Label>
                      <Switch checked={(form as any)[key]} onCheckedChange={v => setForm(f => ({ ...f, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={resetAndClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Salvar Alterações' : 'Criar Tese'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
