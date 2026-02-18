import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gem, Plus, Edit2, Percent, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ModeloParceria {
  id: number;
  nome: string;
  descricao: string | null;
  cor: string | null;
  percentualComissaoPadrao: string | null;
  beneficios: any;
  ordem: number;
  ativo: boolean;
}

interface ComissaoServico {
  id: number;
  servicoId: number;
  modeloParceriaId: number;
  percentualComissao: string;
}

export default function GestaoParcerias() {
  const [editingModelo, setEditingModelo] = useState<ModeloParceria | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [selectedModelo, setSelectedModelo] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', cor: '#3B82F6', percentualComissaoPadrao: '' });

  const modelos = trpc.modelosParceria.list.useQuery();
  const servicos = trpc.servicos.list.useQuery();
  const comissoes = trpc.comissoes.byModelo.useQuery(
    { modeloParceriaId: selectedModelo! },
    { enabled: !!selectedModelo }
  );

  const createModelo = trpc.modelosParceria.create.useMutation({
    onSuccess: () => { modelos.refetch(); setShowNew(false); toast.success('Modelo criado'); },
    onError: (e) => toast.error(e.message),
  });
  const updateModelo = trpc.modelosParceria.update.useMutation({
    onSuccess: () => { modelos.refetch(); setEditingModelo(null); toast.success('Modelo atualizado'); },
    onError: (e) => toast.error(e.message),
  });
  const upsertComissao = trpc.comissoes.upsert.useMutation({
    onSuccess: () => { comissoes.refetch(); toast.success('Comissão atualizada'); },
    onError: (e) => toast.error(e.message),
  });

  const corModelo = (nome: string) => {
    if (nome.toLowerCase().includes('diamante')) return '#60A5FA';
    if (nome.toLowerCase().includes('ouro')) return '#F59E0B';
    if (nome.toLowerCase().includes('prata')) return '#9CA3AF';
    return '#3B82F6';
  };

  const getComissaoForServico = (servicoId: number) => {
    if (!comissoes.data) return null;
    return (comissoes.data as ComissaoServico[]).find(c => c.servicoId === servicoId);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gem className="w-6 h-6 text-blue-500" />
            Gestão de Parcerias
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure os modelos de parceria e os percentuais de comissão por serviço
          </p>
        </div>
        <Button onClick={() => { setForm({ nome: '', descricao: '', cor: '#3B82F6', percentualComissaoPadrao: '' }); setShowNew(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Modelo
        </Button>
      </div>

      {/* Modelos de Parceria */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(modelos.data as ModeloParceria[] | undefined)?.map(modelo => (
          <Card
            key={modelo.id}
            className={`cursor-pointer transition-all hover:shadow-md ${selectedModelo === modelo.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedModelo(modelo.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: modelo.cor || corModelo(modelo.nome) }} />
                  <CardTitle className="text-lg">{modelo.nome}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingModelo(modelo);
                    setForm({
                      nome: modelo.nome,
                      descricao: modelo.descricao || '',
                      cor: modelo.cor || corModelo(modelo.nome),
                      percentualComissaoPadrao: modelo.percentualComissaoPadrao || '',
                    });
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>{modelo.descricao || 'Sem descrição'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Comissão padrão: <strong>{modelo.percentualComissaoPadrao || '—'}%</strong>
                </span>
              </div>
              <Badge variant={modelo.ativo ? 'default' : 'secondary'} className="mt-2">
                {modelo.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comissões por Serviço */}
      {selectedModelo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Comissões por Serviço — {(modelos.data as ModeloParceria[] | undefined)?.find(m => m.id === selectedModelo)?.nome}
            </CardTitle>
            <CardDescription>
              Defina o percentual de comissão para cada serviço neste modelo de parceria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comissoes.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="w-[150px]">% Comissão Padrão (Serviço)</TableHead>
                    <TableHead className="w-[150px]">% Comissão Customizada</TableHead>
                    <TableHead className="w-[80px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(servicos.data as any[] | undefined)?.filter((s: any) => s.ativo).map((servico: any) => {
                    const comissao = getComissaoForServico(servico.id);
                    return (
                      <ComissaoRow
                        key={servico.id}
                        servico={servico}
                        comissao={comissao}
                        modeloParceriaId={selectedModelo}
                        modeloNome={(modelos.data as ModeloParceria[] | undefined)?.find(m => m.id === selectedModelo)?.nome || ''}
                        onSave={(perc) => {
                          upsertComissao.mutate({
                            servicoId: servico.id,
                            modeloParceriaId: selectedModelo,
                            percentualComissao: perc,
                          });
                        }}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Novo Modelo */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Modelo de Parceria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Parceiro Diamante" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>% Comissão Padrão</Label>
                <Input value={form.percentualComissaoPadrao} onChange={e => setForm(f => ({ ...f, percentualComissaoPadrao: e.target.value }))} placeholder="50" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button
              onClick={() => createModelo.mutate({ nome: form.nome, descricao: form.descricao || undefined, cor: form.cor, percentualComissaoPadrao: form.percentualComissaoPadrao || undefined })}
              disabled={!form.nome || createModelo.isPending}
            >
              {createModelo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Modelo */}
      <Dialog open={!!editingModelo} onOpenChange={() => setEditingModelo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Modelo de Parceria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>% Comissão Padrão</Label>
                <Input value={form.percentualComissaoPadrao} onChange={e => setForm(f => ({ ...f, percentualComissaoPadrao: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModelo(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!editingModelo) return;
                updateModelo.mutate({
                  id: editingModelo.id,
                  data: { nome: form.nome, descricao: form.descricao || null, cor: form.cor, percentualComissaoPadrao: form.percentualComissaoPadrao || null },
                });
              }}
              disabled={!form.nome || updateModelo.isPending}
            >
              {updateModelo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComissaoRow({ servico, comissao, modeloParceriaId, modeloNome, onSave }: {
  servico: any;
  comissao: ComissaoServico | null | undefined;
  modeloParceriaId: number;
  modeloNome: string;
  onSave: (perc: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(comissao?.percentualComissao || '');

  // Pegar comissão padrão do serviço baseado no modelo
  const nomeNorm = modeloNome?.toLowerCase() || '';
  let comissaoPadraoServico = '—';
  if (nomeNorm.includes('diamante') && servico.comissaoPadraoDiamante) comissaoPadraoServico = `${servico.comissaoPadraoDiamante}%`;
  else if (nomeNorm.includes('ouro') && servico.comissaoPadraoOuro) comissaoPadraoServico = `${servico.comissaoPadraoOuro}%`;
  else if (nomeNorm.includes('prata') && servico.comissaoPadraoPrata) comissaoPadraoServico = `${servico.comissaoPadraoPrata}%`;

  return (
    <TableRow>
      <TableCell className="font-medium">{servico.nome}</TableCell>
      <TableCell className="text-sm text-gray-500">{servico.setorNome || '—'}</TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{comissaoPadraoServico}</span>
      </TableCell>
      <TableCell>
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-20 h-8 text-sm"
              placeholder="%"
              autoFocus
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        ) : (
          <span className="text-sm">{comissao?.percentualComissao ? `${comissao.percentualComissao}%` : '—'}</span>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { onSave(value); setEditing(false); }}
          >
            <Save className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setValue(comissao?.percentualComissao || ''); setEditing(true); }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
