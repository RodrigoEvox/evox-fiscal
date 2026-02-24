import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

const TIPO_MAP: Record<string, { label: string; color: string }> = {
  dano: { label: 'Dano', color: 'bg-orange-500/20 text-orange-400' },
  extravio: { label: 'Extravio', color: 'bg-red-500/20 text-red-400' },
  atraso: { label: 'Atraso', color: 'bg-amber-500/20 text-amber-400' },
  outro: { label: 'Outro', color: 'bg-gray-500/20 text-gray-400' },
};

const STATUS_OC: Record<string, { label: string; color: string }> = {
  aberta: { label: 'Aberta', color: 'bg-amber-500/20 text-amber-400' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-500/20 text-blue-400' },
  resolvida: { label: 'Resolvida', color: 'bg-emerald-500/20 text-emerald-400' },
  penalidade_aplicada: { label: 'Penalidade', color: 'bg-red-500/20 text-red-400' },
};

export default function BibliotecaDevolucoes() {
  const [tab, setTab] = useState('devolucoes');
  const [search, setSearch] = useState('');
  const [showOcorrencia, setShowOcorrencia] = useState(false);
  const [ocForm, setOcForm] = useState({
    emprestimoId: '', exemplarId: '', tipo: 'dano',
    descricao: '', colaboradorNome: '', penalidade: '',
  });

  const utils = trpc.useUtils();
  const emprestimos = trpc.biblioteca.emprestimos.list.useQuery();
  const ocorrencias = trpc.biblioteca.ocorrenciasBib.list.useQuery();
  const exemplares = trpc.biblioteca.exemplares.list.useQuery();
  const livros = trpc.biblioteca.livros.list.useQuery();
  const returnEmprestimo = trpc.biblioteca.emprestimos.devolver.useMutation({
    onSuccess: () => { utils.biblioteca.emprestimos.list.invalidate(); utils.biblioteca.exemplares.list.invalidate(); toast.success('Devolução registrada!'); },
    onError: (e) => toast.error(e.message),
  });
  const createOcorrencia = trpc.biblioteca.ocorrenciasBib.create.useMutation({
    onSuccess: () => { utils.biblioteca.ocorrenciasBib.list.invalidate(); toast.success('Ocorrência registrada!'); setShowOcorrencia(false); },
    onError: (e) => toast.error(e.message),
  });

  const livroMap = useMemo(() => {
    const map = new Map<number, string>();
    livros.data?.forEach((l: any) => map.set(l.id, l.titulo));
    return map;
  }, [livros.data]);

  const exemplarMap = useMemo(() => {
    const map = new Map<number, any>();
    exemplares.data?.forEach((e: any) => map.set(e.id, e));
    return map;
  }, [exemplares.data]);

  const ativos = useMemo(() => {
    if (!emprestimos.data) return [];
    return emprestimos.data.filter((e: any) => e.status === 'ativo' || e.status === 'renovado');
  }, [emprestimos.data]);

  const devolvidos = useMemo(() => {
    if (!emprestimos.data) return [];
    return emprestimos.data.filter((e: any) => e.status === 'devolvido');
  }, [emprestimos.data]);

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  return (
    <>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="devolucoes" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
              Pendentes ({ativos.length})
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
              Histórico ({devolvidos.length})
            </TabsTrigger>
            <TabsTrigger value="ocorrencias" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
              Ocorrências ({ocorrencias.data?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devolucoes">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">Colaborador</TableHead>
                      <TableHead className="text-white/60">Livro</TableHead>
                      <TableHead className="text-white/60">Empréstimo</TableHead>
                      <TableHead className="text-white/60">Prev. Devolução</TableHead>
                      <TableHead className="text-white/60">Situação</TableHead>
                      <TableHead className="text-white/60 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ativos.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-white/30 py-10">Nenhum empréstimo ativo</TableCell></TableRow>
                    ) : ativos.map((emp: any) => {
                      const ex = exemplarMap.get(emp.exemplarId);
                      const titulo = ex ? livroMap.get(ex.livroId) || '-' : '-';
                      const isAtrasado = new Date(emp.dataPrevistaDevolucao).getTime() < Date.now();
                      return (
                        <TableRow key={emp.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-white font-medium">{emp.colaboradorNome}</TableCell>
                          <TableCell className="text-white/70">{titulo}</TableCell>
                          <TableCell className="text-white/70">{formatDate(emp.dataEmprestimo)}</TableCell>
                          <TableCell className={isAtrasado ? 'text-red-400 font-semibold' : 'text-white/70'}>{formatDate(emp.dataPrevistaDevolucao)}</TableCell>
                          <TableCell>
                            <Badge className={isAtrasado ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}>
                              {isAtrasado ? 'Atrasado' : 'No prazo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => returnEmprestimo.mutate({ id: emp.id, dataEfetiva: new Date().toISOString().split('T')[0] })}
                              disabled={returnEmprestimo.isPending}>
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Devolver
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">Colaborador</TableHead>
                      <TableHead className="text-white/60">Livro</TableHead>
                      <TableHead className="text-white/60">Empréstimo</TableHead>
                      <TableHead className="text-white/60">Devolução</TableHead>
                      <TableHead className="text-white/60">Condição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devolvidos.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-white/30 py-10">Nenhuma devolução registrada</TableCell></TableRow>
                    ) : devolvidos.map((emp: any) => {
                      const ex = exemplarMap.get(emp.exemplarId);
                      const titulo = ex ? livroMap.get(ex.livroId) || '-' : '-';
                      return (
                        <TableRow key={emp.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-white font-medium">{emp.colaboradorNome}</TableCell>
                          <TableCell className="text-white/70">{titulo}</TableCell>
                          <TableCell className="text-white/70">{formatDate(emp.dataEmprestimo)}</TableCell>
                          <TableCell className="text-white/70">{formatDate(emp.dataDevolucao)}</TableCell>
                          <TableCell className="text-white/70 capitalize">{emp.condicaoDevolucao || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ocorrencias">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">Tipo</TableHead>
                      <TableHead className="text-white/60">Exemplar</TableHead>
                      <TableHead className="text-white/60">Descrição</TableHead>
                      <TableHead className="text-white/60">Data</TableHead>
                      <TableHead className="text-white/60">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!ocorrencias.data?.length ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-white/30 py-10">Nenhuma ocorrência</TableCell></TableRow>
                    ) : ocorrencias.data.map((oc: any) => {
                      const tp = TIPO_MAP[oc.tipo] || { label: oc.tipo, color: 'bg-gray-500/20 text-gray-400' };
                      const st = STATUS_OC[oc.status] || { label: oc.status, color: 'bg-gray-500/20 text-gray-400' };
                      const ex = exemplarMap.get(oc.exemplarId);
                      const titulo = ex ? livroMap.get(ex.livroId) || '-' : '-';
                      return (
                        <TableRow key={oc.id} className="border-white/5 hover:bg-white/5">
                          <TableCell><Badge className={tp.color}>{tp.label}</Badge></TableCell>
                          <TableCell className="text-white/70">{titulo} {ex?.codigoPatrimonio ? `(${ex.codigoPatrimonio})` : ''}</TableCell>
                          <TableCell className="text-white/70 max-w-[300px] truncate">{oc.descricao}</TableCell>
                          <TableCell className="text-white/70">{formatDate(oc.dataOcorrencia)}</TableCell>
                          <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      <Dialog open={showOcorrencia} onOpenChange={setShowOcorrencia}>
        <DialogContent className="bg-[#0F2137] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Nova Ocorrência</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Tipo *</Label>
              <Select value={ocForm.tipo} onValueChange={(v) => setOcForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Exemplar *</Label>
              <Select value={ocForm.exemplarId} onValueChange={(v) => setOcForm(p => ({ ...p, exemplarId: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {exemplares.data?.map((ex: any) => (
                    <SelectItem key={ex.id} value={ex.id.toString()}>
                      {livroMap.get(ex.livroId) || `#${ex.livroId}`} — {ex.codigoPatrimonio || `#${ex.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Descrição *</Label>
              <Textarea value={ocForm.descricao} onChange={(e) => setOcForm(p => ({ ...p, descricao: e.target.value }))} className="bg-white/5 border-white/10 text-white" rows={3} />
            </div>
            <div>
              <Label className="text-white/70">Penalidade (se aplicável)</Label>
              <Input value={ocForm.penalidade} onChange={(e) => setOcForm(p => ({ ...p, penalidade: e.target.value }))} className="bg-white/5 border-white/10 text-white" placeholder="Ex: Suspensão de 30 dias" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOcorrencia(false)} className="border-white/20 text-white/70 hover:bg-white/10">Cancelar</Button>
            <Button onClick={() => {
              if (!ocForm.exemplarId || !ocForm.descricao.trim()) { toast.error('Preencha todos os campos obrigatórios'); return; }
              createOcorrencia.mutate({
                exemplarId: parseInt(ocForm.exemplarId),
                emprestimoId: ocForm.emprestimoId ? parseInt(ocForm.emprestimoId) : undefined,
                tipo: ocForm.tipo as any,
                descricao: ocForm.descricao,

              });
            }} disabled={createOcorrencia.isPending} className="bg-orange-600 hover:bg-orange-700">
              {createOcorrencia.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
