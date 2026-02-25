import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Settings, Plus, Loader2, ChevronRight, Clock, Shield, DollarSign, Edit, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CreditoConfiguracoes() {
  const [tab, setTab] = useState('slas');
  const [showCreateSla, setShowCreateSla] = useState(false);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [editingSla, setEditingSla] = useState<any>(null);

  const slas = trpc.creditRecovery.admin.slas.list.useQuery();
  const policies = trpc.creditRecovery.admin.policies.list.useQuery();
  const compensationGroups = trpc.creditRecovery.admin.compensationGroups.list.useQuery();
  const utils = trpc.useUtils();

  // SLA mutations
  const [newSla, setNewSla] = useState({
    nome: '',
    etapa: 'triagem',
    prazoHoras: 24,
    descricao: '',
  });

  const createSlaMutation = trpc.creditRecovery.admin.slas.create.useMutation({
    onSuccess: () => {
      toast.success('SLA criado');
      setShowCreateSla(false);
      setNewSla({ nome: '', etapa: 'triagem', prazoHoras: 24, descricao: '' });
      utils.creditRecovery.admin.slas.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateSlaMutation = trpc.creditRecovery.admin.slas.update.useMutation({
    onSuccess: () => {
      toast.success('SLA atualizado');
      setEditingSla(null);
      utils.creditRecovery.admin.slas.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Policy mutations
  const [newPolicy, setNewPolicy] = useState({
    nome: '',
    tributo: '',
    prazoMeses: 60,
    descricao: '',
    ativo: true,
  });

  const createPolicyMutation = trpc.creditRecovery.admin.policies.create.useMutation({
    onSuccess: () => {
      toast.success('Política criada');
      setShowCreatePolicy(false);
      setNewPolicy({ nome: '', tributo: '', prazoMeses: 60, descricao: '', ativo: true });
      utils.creditRecovery.admin.policies.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const togglePolicyMutation = trpc.creditRecovery.admin.policies.toggle.useMutation({
    onSuccess: () => {
      utils.creditRecovery.admin.policies.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const ETAPA_MAP: Record<string, string> = {
    triagem: 'Triagem',
    classificacao: 'Classificação',
    roteamento: 'Roteamento',
    analise_inicial: 'Análise Inicial',
    apuracao: 'Apuração',
    revisao: 'Revisão',
    compensacao: 'Compensação',
    entrega_rti: 'Entrega RTI',
    ticket_resposta: 'Resposta Ticket',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Crédito Tributário</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Configurações</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">SLAs editáveis, políticas de vencimento e grupos de compensação</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="slas" className="gap-1.5"><Clock className="w-3.5 h-3.5" />SLAs</TabsTrigger>
          <TabsTrigger value="policies" className="gap-1.5"><Shield className="w-3.5 h-3.5" />Políticas de Vencimento</TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" />Grupos de Compensação</TabsTrigger>
        </TabsList>

        {/* SLAs Tab */}
        <TabsContent value="slas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={showCreateSla} onOpenChange={setShowCreateSla}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo SLA</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo SLA</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={newSla.nome} onChange={e => setNewSla(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do SLA" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Etapa</Label>
                      <Select value={newSla.etapa} onValueChange={v => setNewSla(p => ({ ...p, etapa: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ETAPA_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prazo (horas)</Label>
                      <Input type="number" value={newSla.prazoHoras} onChange={e => setNewSla(p => ({ ...p, prazoHoras: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={newSla.descricao} onChange={e => setNewSla(p => ({ ...p, descricao: e.target.value }))} rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateSla(false)}>Cancelar</Button>
                  <Button onClick={() => createSlaMutation.mutate(newSla as any)} disabled={createSlaMutation.isPending || !newSla.nome}>
                    {createSlaMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {slas.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead className="w-28">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(slas.data as any[] || []).map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{s.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{ETAPA_MAP[s.etapa] || s.etapa}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{s.prazoHoras}h</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{s.descricao || '—'}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', s.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>{s.ativo ? 'Sim' : 'Não'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog open={editingSla?.id === s.id} onOpenChange={open => !open && setEditingSla(null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingSla({ ...s })}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Editar SLA</DialogTitle></DialogHeader>
                              {editingSla && (
                                <div className="space-y-4">
                                  <div>
                                    <Label>Nome</Label>
                                    <Input value={editingSla.nome} onChange={e => setEditingSla((p: any) => ({ ...p, nome: e.target.value }))} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Etapa</Label>
                                      <Select value={editingSla.etapa} onValueChange={v => setEditingSla((p: any) => ({ ...p, etapa: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(ETAPA_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Prazo (horas)</Label>
                                      <Input type="number" value={editingSla.prazoHoras} onChange={e => setEditingSla((p: any) => ({ ...p, prazoHoras: parseInt(e.target.value) || 0 }))} />
                                    </div>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingSla(null)}>Cancelar</Button>
                                <Button onClick={() => editingSla && updateSlaMutation.mutate({ id: editingSla.id, nome: editingSla.nome, slaHoras: editingSla.prazoHoras, slaDias: editingSla.prazoHoras ? Math.ceil(editingSla.prazoHoras / 8) : undefined })} disabled={updateSlaMutation.isPending}>
                                  {updateSlaMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                  <Save className="w-4 h-4 mr-2" />Salvar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Nova Política</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Política de Vencimento</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={newPolicy.nome} onChange={e => setNewPolicy(p => ({ ...p, nome: e.target.value }))} placeholder="Nome da política" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tributo</Label>
                      <Input value={newPolicy.tributo} onChange={e => setNewPolicy(p => ({ ...p, tributo: e.target.value }))} placeholder="PIS, COFINS..." />
                    </div>
                    <div>
                      <Label>Prazo (meses)</Label>
                      <Input type="number" value={newPolicy.prazoMeses} onChange={e => setNewPolicy(p => ({ ...p, prazoMeses: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={newPolicy.descricao} onChange={e => setNewPolicy(p => ({ ...p, descricao: e.target.value }))} rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreatePolicy(false)}>Cancelar</Button>
                  <Button onClick={() => createPolicyMutation.mutate(newPolicy as any)} disabled={createPolicyMutation.isPending || !newPolicy.nome}>
                    {createPolicyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {policies.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tributo</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(policies.data as any[] || []).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.nome}</TableCell>
                        <TableCell className="text-sm">{p.tributo || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{p.prazoMeses} meses</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{p.descricao || '—'}</TableCell>
                        <TableCell>
                          <Switch checked={p.ativo} onCheckedChange={() => togglePolicyMutation.mutate({ id: p.id, ativo: !p.ativo })} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compensation Groups Tab */}
        <TabsContent value="groups" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grupos de Compensação</CardTitle>
              <CardDescription>Grupos configurados para organização das compensações tributárias</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {compensationGroups.isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(compensationGroups.data as any[] || []).map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-mono text-xs font-medium">{g.codigo}</TableCell>
                        <TableCell className="font-medium text-sm">{g.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">{g.descricao || '—'}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px]', g.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>{g.ativo ? 'Sim' : 'Não'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
