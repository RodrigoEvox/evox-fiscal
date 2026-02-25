import { trpc } from '@/lib/trpc';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileBarChart, Plus, Search, Loader2, ChevronRight, CheckCircle, Clock, Send, Eye, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  em_revisao: { label: 'Em Revisão', color: 'bg-amber-100 text-amber-800' },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
};

export default function CreditoRTI() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [showCreate, setShowCreate] = useState(false);

  const rtis = trpc.creditRecovery.credito.rti.list.useQuery(
    statusFilter !== 'todas' ? { status: statusFilter } : undefined
  );
  const cases = trpc.creditRecovery.credito.cases.list.useQuery();
  const clientes = trpc.clientes.list.useQuery();
  const utils = trpc.useUtils();

  const [newRTI, setNewRTI] = useState({
    caseId: null as number | null,
    clienteId: null as number | null,
    titulo: '',
    resumoExecutivo: '',
    tributo: '',
    periodoAnalise: '',
    valorApurado: '',
  });

  const createMutation = trpc.creditRecovery.credito.rti.create.useMutation({
    onSuccess: () => {
      toast.success('RTI criado com sucesso');
      setShowCreate(false);
      setNewRTI({ caseId: null, clienteId: null, titulo: '', resumoExecutivo: '', tributo: '', periodoAnalise: '', valorApurado: '' });
      utils.creditRecovery.credito.rti.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatusMutation = trpc.creditRecovery.credito.rti.update.useMutation({
    onSuccess: () => {
      toast.success('Status atualizado');
      utils.creditRecovery.credito.rti.list.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!rtis.data) return [];
    const items = rtis.data as any[];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((r: any) =>
      r.numero?.toLowerCase().includes(q) ||
      r.titulo?.toLowerCase().includes(q) ||
      r.tributo?.toLowerCase().includes(q)
    );
  }, [rtis.data, search]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const getClienteName = (id: number | null) => {
    if (!id || !clientes.data) return '—';
    return (clientes.data as any[]).find((c: any) => c.id === id)?.razaoSocial || '—';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Crédito Tributário</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">RTI</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">RTI — Relatório Técnico de Informação</h1>
          <p className="text-sm text-muted-foreground mt-1">Geração, revisão e envio de relatórios técnicos por case</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo RTI</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo RTI</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Case</Label>
                  <Select value={newRTI.caseId?.toString() || '_none'} onValueChange={v => setNewRTI(p => ({ ...p, caseId: v === '_none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
                      {(cases.data as any[] || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.numero}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Select value={newRTI.clienteId?.toString() || '_none'} onValueChange={v => setNewRTI(p => ({ ...p, clienteId: v === '_none' ? null : Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
                      {(clientes.data as any[] || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.razaoSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={newRTI.titulo} onChange={e => setNewRTI(p => ({ ...p, titulo: e.target.value }))} placeholder="Título do relatório" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tributo</Label>
                  <Input value={newRTI.tributo} onChange={e => setNewRTI(p => ({ ...p, tributo: e.target.value }))} placeholder="PIS, COFINS..." />
                </div>
                <div>
                  <Label>Valor Apurado (R$)</Label>
                  <Input type="number" step="0.01" value={newRTI.valorApurado} onChange={e => setNewRTI(p => ({ ...p, valorApurado: e.target.value }))} placeholder="0,00" />
                </div>
              </div>
              <div>
                <Label>Período de Análise</Label>
                <Input value={newRTI.periodoAnalise} onChange={e => setNewRTI(p => ({ ...p, periodoAnalise: e.target.value }))} placeholder="01/2020 a 12/2024" />
              </div>
              <div>
                <Label>Resumo Executivo</Label>
                <Textarea value={newRTI.resumoExecutivo} onChange={e => setNewRTI(p => ({ ...p, resumoExecutivo: e.target.value }))} rows={3} placeholder="Resumo do relatório..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate({ ...newRTI, valorApurado: parseFloat(newRTI.valorApurado) || 0 } as any)} disabled={createMutation.isPending || !newRTI.titulo}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Criar RTI
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Rascunhos', value: (rtis.data as any[] || []).filter((r: any) => r.status === 'rascunho').length, icon: Clock, color: 'text-gray-600 bg-gray-50' },
          { label: 'Em Revisão', value: (rtis.data as any[] || []).filter((r: any) => r.status === 'em_revisao').length, icon: Eye, color: 'text-amber-600 bg-amber-50' },
          { label: 'Aprovados', value: (rtis.data as any[] || []).filter((r: any) => r.status === 'aprovado').length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Enviados', value: (rtis.data as any[] || []).filter((r: any) => r.status === 'enviado').length, icon: Send, color: 'text-blue-600 bg-blue-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.color)}>
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Relatórios</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 w-56 h-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rtis.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileBarChart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum RTI encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Número</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tributo</TableHead>
                    <TableHead className="text-right">Valor Apurado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-44">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-medium">{r.numero}</TableCell>
                      <TableCell className="text-sm font-medium">{r.titulo}</TableCell>
                      <TableCell className="text-sm">{getClienteName(r.clienteId)}</TableCell>
                      <TableCell className="text-sm">{r.tributo || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-emerald-600">{formatCurrency(r.valorApurado)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', STATUS_MAP[r.status]?.color)}>{STATUS_MAP[r.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(r.criadoEm)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {r.status === 'rascunho' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'em_revisao' })}>
                              Enviar p/ Revisão
                            </Button>
                          )}
                          {r.status === 'em_revisao' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-700" onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'aprovado' })}>
                              Aprovar
                            </Button>
                          )}
                          {r.status === 'aprovado' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-blue-700" onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'enviado' })}>
                              <Send className="w-3 h-3 mr-1" />Enviar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
