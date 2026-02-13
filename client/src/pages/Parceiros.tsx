/*
 * Parceiros Comerciais — Evox Fiscal
 * Cadastro de parceiros PF/PJ com associação a clientes
 */

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Edit, User, Building2, Phone, Mail, MapPin } from 'lucide-react';
import type { Parceiro, TipoParceiro } from '@/lib/types';

function ParceiroForm({ parceiro, onSave, onCancel }: {
  parceiro?: Parceiro;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    tipo: parceiro?.tipo || 'pf' as TipoParceiro,
    nomeCompleto: parceiro?.nomeCompleto || '',
    cpf: parceiro?.cpf || '',
    razaoSocial: parceiro?.razaoSocial || '',
    cnpj: parceiro?.cnpj || '',
    telefone: parceiro?.telefone || '',
    email: parceiro?.email || '',
    endereco: parceiro?.endereco || '',
    ativo: parceiro?.ativo ?? true,
  });

  const handleSubmit = () => {
    if (!form.nomeCompleto) { toast.error('Nome completo é obrigatório.'); return; }
    if (!form.telefone) { toast.error('Telefone é obrigatório.'); return; }
    if (!form.email) { toast.error('Email é obrigatório.'); return; }
    if (form.tipo === 'pf' && !form.cpf) { toast.error('CPF é obrigatório para pessoa física.'); return; }
    if (form.tipo === 'pj' && !form.cnpj) { toast.error('CNPJ é obrigatório para pessoa jurídica.'); return; }
    onSave(form);
  };

  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-5 p-1 pr-4">
        <div>
          <Label className="text-xs">Tipo de Parceiro *</Label>
          <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as TipoParceiro }))}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pf">Pessoa Física</SelectItem>
              <SelectItem value="pj">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Nome Completo *</Label>
            <Input value={form.nomeCompleto} onChange={e => setForm(p => ({ ...p, nomeCompleto: e.target.value }))} className="h-9 text-sm" />
          </div>
          {form.tipo === 'pf' ? (
            <div>
              <Label className="text-xs">CPF *</Label>
              <Input value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" className="h-9 text-sm font-data" />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs">Razão Social</Label>
                <Input value={form.razaoSocial} onChange={e => setForm(p => ({ ...p, razaoSocial: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">CNPJ *</Label>
                <Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="h-9 text-sm font-data" />
              </div>
            </>
          )}
          <div>
            <Label className="text-xs">Telefone *</Label>
            <Input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Endereço</Label>
            <Input value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} className="h-9 text-sm" />
          </div>
          <div className="col-span-2 flex items-center justify-between">
            <Label className="text-xs">Status Ativo</Label>
            <Switch checked={form.ativo} onCheckedChange={v => setForm(p => ({ ...p, ativo: v }))} />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-[#0A2540] hover:bg-[#0A2540]/90">
            {parceiro ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </div>
    </ScrollArea>
  );
}

export default function Parceiros() {
  const { state, dispatch, getPermissoes } = useApp();
  const perm = getPermissoes();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParceiro, setEditingParceiro] = useState<Parceiro | undefined>();

  const filtered = useMemo(() => {
    return state.parceiros.filter(p => {
      const matchSearch = !search || p.nomeCompleto.toLowerCase().includes(search.toLowerCase())
        || (p.cpf || '').includes(search) || (p.cnpj || '').includes(search) || p.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'todos' || (filterStatus === 'ativo' ? p.ativo : !p.ativo);
      return matchSearch && matchStatus;
    });
  }, [state.parceiros, search, filterStatus]);

  const clientesPorParceiro = (parceiroId: string) =>
    state.clientes.filter(c => c.parceiroId === parceiroId).length;

  const handleSave = (data: any) => {
    if (editingParceiro) {
      dispatch({ type: 'UPDATE_PARCEIRO', payload: { ...editingParceiro, ...data } });
      toast.success('Parceiro atualizado!');
    } else {
      dispatch({ type: 'ADD_PARCEIRO', payload: data });
      toast.success('Parceiro cadastrado!');
    }
    setDialogOpen(false);
    setEditingParceiro(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parceiros Comerciais</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastro e gestão de parceiros responsáveis</p>
        </div>
        {perm.podeIncluirParceiro && (
          <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditingParceiro(undefined); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-[#0A2540] hover:bg-[#0A2540]/90">
                <Plus className="w-4 h-4" /> Novo Parceiro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingParceiro ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
                <DialogDescription>Preencha os dados do parceiro comercial.</DialogDescription>
              </DialogHeader>
              <ParceiroForm
                parceiro={editingParceiro}
                onSave={handleSave}
                onCancel={() => { setDialogOpen(false); setEditingParceiro(undefined); }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CPF, CNPJ ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filtered.map(parceiro => (
          <Card key={parceiro.id} className="transition-all hover:shadow-md">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${parceiro.tipo === 'pf' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                    {parceiro.tipo === 'pf' ? <User className="w-5 h-5 text-blue-600" /> : <Building2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{parceiro.nomeCompleto}</p>
                      <Badge variant={parceiro.ativo ? 'default' : 'secondary'} className={`text-[10px] ${parceiro.ativo ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-gray-200 text-gray-600'}`}>
                        {parceiro.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {parceiro.tipo === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-data">{parceiro.tipo === 'pf' ? parceiro.cpf : parceiro.cnpj}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{parceiro.telefone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{parceiro.email}</span>
                      <span className="text-[#0A2540] font-medium">{clientesPorParceiro(parceiro.id)} cliente(s)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {perm.podeEditarParceiro && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingParceiro(parceiro); setDialogOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {perm.podeExcluirParceiro && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { dispatch({ type: 'DELETE_PARCEIRO', payload: parceiro.id }); toast.success('Parceiro removido.'); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum parceiro encontrado.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
