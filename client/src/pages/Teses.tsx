/*
 * Teses Tributárias — Evox Fiscal
 * Repositório com classificação, potencial financeiro/mercadológico e parecer técnico/jurídico
 */

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  Plus, Search, BookOpen, Shield, Scale, FileSpreadsheet, FileText,
  Trash2, Edit, Eye, Gavel, AlertCircle, CheckCircle, TrendingUp, Tag,
} from 'lucide-react';
import { exportarTesesExcel, exportarTesesPDF } from '@/lib/export-utils';
import type { Tese, TipoTese, GrauRisco, ClassificacaoTese, PotencialFinanceiro, PotencialMercadologico } from '@/lib/types';

const potencialColors: Record<string, string> = {
  muito_alto: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  alto: 'bg-blue-500/10 text-blue-700 border-blue-200',
  medio: 'bg-amber-500/10 text-amber-700 border-amber-200',
  baixo: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

const classificacaoIcons: Record<string, { icon: typeof CheckCircle; color: string }> = {
  pacificada: { icon: CheckCircle, color: 'text-emerald-500' },
  judicial: { icon: Gavel, color: 'text-blue-500' },
  administrativa: { icon: Scale, color: 'text-amber-500' },
  controversa: { icon: AlertCircle, color: 'text-red-500' },
};

function TeseForm({ tese, onSave, onCancel }: {
  tese?: Tese;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    nome: tese?.nome || '',
    tributoEnvolvido: tese?.tributoEnvolvido || '',
    tipo: tese?.tipo || 'tese_judicial' as TipoTese,
    classificacao: tese?.classificacao || 'judicial' as ClassificacaoTese,
    potencialFinanceiro: tese?.potencialFinanceiro || 'medio' as PotencialFinanceiro,
    potencialMercadologico: tese?.potencialMercadologico || 'medio' as PotencialMercadologico,
    requisitosObjetivos: tese?.requisitosObjetivos?.join('\n') || '',
    requisitosImpeditivos: tese?.requisitosImpeditivos?.join('\n') || '',
    fundamentacaoLegal: tese?.fundamentacaoLegal || '',
    jurisprudenciaRelevante: tese?.jurisprudenciaRelevante || '',
    parecerTecnicoJuridico: tese?.parecerTecnicoJuridico || '',
    prazoPrescricional: tese?.prazoPrescricional || '5 anos',
    necessidadeAcaoJudicial: tese?.necessidadeAcaoJudicial || false,
    viaAdministrativa: tese?.viaAdministrativa || false,
    grauRisco: tese?.grauRisco || 'medio' as GrauRisco,
    documentosNecessarios: tese?.documentosNecessarios?.join('\n') || '',
    formulaEstimativaCredito: tese?.formulaEstimativaCredito || '',
    aplicavelComercio: tese?.aplicavelComercio || false,
    aplicavelIndustria: tese?.aplicavelIndustria || false,
    aplicavelServico: tese?.aplicavelServico || false,
    aplicavelContribuinteICMS: tese?.aplicavelContribuinteICMS || false,
    aplicavelContribuinteIPI: tese?.aplicavelContribuinteIPI || false,
    aplicavelLucroReal: tese?.aplicavelLucroReal || false,
    aplicavelLucroPresumido: tese?.aplicavelLucroPresumido || false,
    aplicavelSimplesNacional: tese?.aplicavelSimplesNacional || false,
    aplicavelPos2017: tese?.aplicavelPos2017 || true,
    ativa: tese?.ativa ?? true,
  });

  const handleSubmit = () => {
    if (!form.nome || !form.tributoEnvolvido) {
      toast.error('Preencha pelo menos o nome e o tributo envolvido.');
      return;
    }
    onSave({
      ...form,
      requisitosObjetivos: form.requisitosObjetivos.split('\n').filter(Boolean),
      requisitosImpeditivos: form.requisitosImpeditivos.split('\n').filter(Boolean),
      documentosNecessarios: form.documentosNecessarios.split('\n').filter(Boolean),
    });
  };

  return (
    <ScrollArea className="max-h-[75vh]">
      <div className="space-y-5 p-1 pr-4">
        {/* Identificação */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Identificação</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Nome da Tese *</Label>
              <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Tributo Envolvido *</Label>
              <Input value={form.tributoEnvolvido} onChange={e => setForm(p => ({ ...p, tributoEnvolvido: e.target.value }))} placeholder="PIS/COFINS, ICMS, etc." className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as TipoTese }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusao_base">Exclusão de Base</SelectItem>
                  <SelectItem value="credito_presumido">Crédito Presumido</SelectItem>
                  <SelectItem value="recuperacao_indebito">Recuperação de Indébito</SelectItem>
                  <SelectItem value="tese_judicial">Tese Judicial</SelectItem>
                  <SelectItem value="tese_administrativa">Tese Administrativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Classificação e Potencial */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Classificação e Potencial</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Classificação</Label>
              <Select value={form.classificacao} onValueChange={v => setForm(p => ({ ...p, classificacao: v as ClassificacaoTese }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pacificada">Pacificada</SelectItem>
                  <SelectItem value="judicial">Judicial</SelectItem>
                  <SelectItem value="administrativa">Administrativa</SelectItem>
                  <SelectItem value="controversa">Controversa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Potencial Financeiro</Label>
              <Select value={form.potencialFinanceiro} onValueChange={v => setForm(p => ({ ...p, potencialFinanceiro: v as PotencialFinanceiro }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="muito_alto">Muito Alto</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Potencial Mercadológico</Label>
              <Select value={form.potencialMercadologico} onValueChange={v => setForm(p => ({ ...p, potencialMercadologico: v as PotencialMercadologico }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="muito_alto">Muito Alto</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Grau de Risco</Label>
              <Select value={form.grauRisco} onValueChange={v => setForm(p => ({ ...p, grauRisco: v as GrauRisco }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Prazo Prescricional</Label>
              <Input value={form.prazoPrescricional} onChange={e => setForm(p => ({ ...p, prazoPrescricional: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.necessidadeAcaoJudicial} onCheckedChange={v => setForm(p => ({ ...p, necessidadeAcaoJudicial: v }))} />
                <Label className="text-xs">Via Judicial</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.viaAdministrativa} onCheckedChange={v => setForm(p => ({ ...p, viaAdministrativa: v }))} />
                <Label className="text-xs">Via Administrativa</Label>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Fundamentação e Parecer */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Fundamentação e Parecer</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Fundamentação Legal</Label>
              <Textarea value={form.fundamentacaoLegal} onChange={e => setForm(p => ({ ...p, fundamentacaoLegal: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Jurisprudência Relevante</Label>
              <Textarea value={form.jurisprudenciaRelevante} onChange={e => setForm(p => ({ ...p, jurisprudenciaRelevante: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#0A2540]">Parecer Técnico/Jurídico</Label>
              <Textarea value={form.parecerTecnicoJuridico} onChange={e => setForm(p => ({ ...p, parecerTecnicoJuridico: e.target.value }))} rows={4} className="text-sm" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Requisitos */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Requisitos (um por linha)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Requisitos Objetivos</Label>
              <Textarea value={form.requisitosObjetivos} onChange={e => setForm(p => ({ ...p, requisitosObjetivos: e.target.value }))} rows={3} className="text-sm" placeholder="Um requisito por linha" />
            </div>
            <div>
              <Label className="text-xs">Requisitos Impeditivos</Label>
              <Textarea value={form.requisitosImpeditivos} onChange={e => setForm(p => ({ ...p, requisitosImpeditivos: e.target.value }))} rows={3} className="text-sm" placeholder="Um requisito por linha" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Aplicabilidade */}
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
              { key: 'aplicavelPos2017', label: 'Pós 2017' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <Label className="text-xs">{item.label}</Label>
                <Switch
                  checked={form[item.key as keyof typeof form] as boolean}
                  onCheckedChange={v => setForm(p => ({ ...p, [item.key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs">Documentos Necessários (um por linha)</Label>
          <Textarea value={form.documentosNecessarios} onChange={e => setForm(p => ({ ...p, documentosNecessarios: e.target.value }))} rows={3} className="text-sm" />
        </div>
        <div>
          <Label className="text-xs">Fórmula de Estimativa de Crédito</Label>
          <Textarea value={form.formulaEstimativaCredito} onChange={e => setForm(p => ({ ...p, formulaEstimativaCredito: e.target.value }))} rows={2} className="text-sm" />
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={form.ativa} onCheckedChange={v => setForm(p => ({ ...p, ativa: v }))} />
          <Label className="text-xs">Tese Ativa</Label>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
            {tese ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </div>
    </ScrollArea>
  );
}

export default function Teses() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [filterClassificacao, setFilterClassificacao] = useState<string>('todas');
  const [filterPotencial, setFilterPotencial] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTese, setEditingTese] = useState<Tese | undefined>();
  const [viewTese, setViewTese] = useState<Tese | null>(null);

  const filteredTeses = useMemo(() => {
    return state.teses.filter(t => {
      const matchSearch = !search || t.nome.toLowerCase().includes(search.toLowerCase())
        || t.tributoEnvolvido.toLowerCase().includes(search.toLowerCase());
      const matchClassificacao = filterClassificacao === 'todas' || t.classificacao === filterClassificacao;
      const matchPotencial = filterPotencial === 'todos' || t.potencialFinanceiro === filterPotencial;
      return matchSearch && matchClassificacao && matchPotencial;
    });
  }, [state.teses, search, filterClassificacao, filterPotencial]);

  const handleSave = (data: any) => {
    if (editingTese) {
      dispatch({ type: 'UPDATE_TESE', payload: { ...editingTese, ...data } });
      toast.success('Tese atualizada com sucesso!');
    } else {
      dispatch({ type: 'ADD_TESE', payload: data });
      toast.success('Tese cadastrada com sucesso!');
    }
    setDialogOpen(false);
    setEditingTese(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teses Tributárias</h1>
          <p className="text-sm text-muted-foreground mt-1">Repositório com classificação, potencial e parecer técnico/jurídico</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportarTesesExcel(filteredTeses)}>
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportarTesesPDF(filteredTeses)}>
            <FileText className="w-3.5 h-3.5" /> PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditingTese(undefined); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-[#0A2540] hover:bg-[#0A2540]/90">
                <Plus className="w-4 h-4" /> Nova Tese
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingTese ? 'Editar Tese' : 'Nova Tese Tributária'}</DialogTitle>
                <DialogDescription>Cadastre a tese com fundamentação legal e parecer técnico/jurídico.</DialogDescription>
              </DialogHeader>
              <TeseForm
                tese={editingTese}
                onSave={handleSave}
                onCancel={() => { setDialogOpen(false); setEditingTese(undefined); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou tributo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={filterClassificacao} onValueChange={setFilterClassificacao}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Classificações</SelectItem>
                <SelectItem value="pacificada">Pacificada</SelectItem>
                <SelectItem value="judicial">Judicial</SelectItem>
                <SelectItem value="administrativa">Administrativa</SelectItem>
                <SelectItem value="controversa">Controversa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPotencial} onValueChange={setFilterPotencial}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Potenciais</SelectItem>
                <SelectItem value="muito_alto">Muito Alto</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Teses List */}
      <div className="space-y-3">
        {filteredTeses.map(tese => {
          const classInfo = classificacaoIcons[tese.classificacao] || classificacaoIcons.judicial;
          const ClassIcon = classInfo.icon;
          return (
            <Card key={tese.id} className="transition-all hover:shadow-md">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      tese.classificacao === 'pacificada' ? 'bg-emerald-500/10' :
                      tese.classificacao === 'judicial' ? 'bg-blue-500/10' :
                      tese.classificacao === 'administrativa' ? 'bg-amber-500/10' : 'bg-red-500/10'
                    }`}>
                      <ClassIcon className={`w-5 h-5 ${classInfo.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{tese.nome}</p>
                        {!tese.ativa && <Badge variant="outline" className="text-[10px]">Inativa</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{tese.tributoEnvolvido}</Badge>
                        <Badge className={`text-[10px] ${potencialColors[tese.potencialFinanceiro]}`}>
                          <TrendingUp className="w-3 h-3 mr-0.5" /> Fin: {tese.potencialFinanceiro.replace('_', ' ')}
                        </Badge>
                        <Badge className={`text-[10px] ${potencialColors[tese.potencialMercadologico]}`}>
                          <Tag className="w-3 h-3 mr-0.5" /> Merc: {tese.potencialMercadologico.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${
                          tese.grauRisco === 'baixo' ? 'text-emerald-600' :
                          tese.grauRisco === 'medio' ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          <Shield className="w-3 h-3 mr-0.5" /> Risco: {tese.grauRisco}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{tese.parecerTecnicoJuridico}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewTese(tese)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTese(tese); setDialogOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { dispatch({ type: 'DELETE_TESE', payload: tese.id }); toast.success('Tese removida.'); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Tese Dialog */}
      <Dialog open={!!viewTese} onOpenChange={v => { if (!v) setViewTese(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{viewTese?.nome}</DialogTitle>
            <DialogDescription>{viewTese?.tributoEnvolvido} — v{viewTese?.versao}</DialogDescription>
          </DialogHeader>
          {viewTese && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-4 pr-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={potencialColors[viewTese.potencialFinanceiro]}>
                    Potencial Financeiro: {viewTese.potencialFinanceiro.replace('_', ' ')}
                  </Badge>
                  <Badge className={potencialColors[viewTese.potencialMercadologico]}>
                    Potencial Mercadológico: {viewTese.potencialMercadologico.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">Risco: {viewTese.grauRisco}</Badge>
                  <Badge variant="outline">Classificação: {viewTese.classificacao}</Badge>
                </div>

                <Accordion type="multiple" defaultValue={['parecer', 'fundamentacao', 'requisitos']}>
                  <AccordionItem value="parecer">
                    <AccordionTrigger className="text-sm font-semibold">Parecer Técnico/Jurídico</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{viewTese.parecerTecnicoJuridico}</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="fundamentacao">
                    <AccordionTrigger className="text-sm font-semibold">Fundamentação Legal</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{viewTese.fundamentacaoLegal}</p>
                      <Separator className="my-2" />
                      <p className="text-xs font-medium text-foreground mb-1">Jurisprudência Relevante:</p>
                      <p className="text-sm text-muted-foreground">{viewTese.jurisprudenciaRelevante}</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="requisitos">
                    <AccordionTrigger className="text-sm font-semibold">Requisitos</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-emerald-700 mb-2">Requisitos Objetivos</p>
                          <ul className="space-y-1">
                            {viewTese.requisitosObjetivos.map((r, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-2">Requisitos Impeditivos</p>
                          <ul className="space-y-1">
                            {viewTese.requisitosImpeditivos.map((r, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="aplicabilidade">
                    <AccordionTrigger className="text-sm font-semibold">Aplicabilidade</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Comércio', value: viewTese.aplicavelComercio },
                          { label: 'Indústria', value: viewTese.aplicavelIndustria },
                          { label: 'Serviço', value: viewTese.aplicavelServico },
                          { label: 'ICMS', value: viewTese.aplicavelContribuinteICMS },
                          { label: 'IPI', value: viewTese.aplicavelContribuinteIPI },
                          { label: 'Lucro Real', value: viewTese.aplicavelLucroReal },
                          { label: 'Lucro Presumido', value: viewTese.aplicavelLucroPresumido },
                          { label: 'Simples Nacional', value: viewTese.aplicavelSimplesNacional },
                          { label: 'Pós 2017', value: viewTese.aplicavelPos2017 },
                        ].map(item => (
                          <Badge key={item.label} variant={item.value ? 'default' : 'outline'} className={`text-xs justify-center ${item.value ? 'bg-[#0A2540]' : ''}`}>
                            {item.label}: {item.value ? 'Sim' : 'Não'}
                          </Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="documentos">
                    <AccordionTrigger className="text-sm font-semibold">Documentos Necessários</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {viewTese.documentosNecessarios.map((d, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <FileText className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="formula">
                    <AccordionTrigger className="text-sm font-semibold">Fórmula de Estimativa</AccordionTrigger>
                    <AccordionContent>
                      <code className="text-xs bg-muted p-2 rounded block font-data">{viewTese.formulaEstimativaCredito}</code>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
