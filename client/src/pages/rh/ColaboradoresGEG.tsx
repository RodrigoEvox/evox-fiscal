import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Search, User, Briefcase, Heart, Users, Edit2, Eye, X, AlertTriangle } from 'lucide-react';

type Dependente = { nome: string; cpf: string; dataNascimento: string; parentesco: string };

const EMPTY_FORM = {
  nomeCompleto: '', cpf: '', dataNascimento: '', rgNumero: '', rgOrgaoEmissor: '', rgDataEmissao: '',
  ctpsNumero: '', pisPasep: '', nomeMae: '', nomePai: '', nacionalidade: 'Brasileira', naturalidade: '',
  estadoCivil: '' as string, tituloEleitor: '', certificadoReservista: '', sexo: '' as string,
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  telefone: '', email: '',
  dataAdmissao: '', cargo: '', funcao: '', salarioBase: '', comissoes: '', adicionais: '',
  jornadaEntrada: '08:00', jornadaSaida: '18:00', jornadaIntervalo: '01:00', cargaHoraria: '44',
  tipoContrato: 'clt' as string, periodoExperiencia: 45, localTrabalho: '' as string,
  valeTransporte: false, banco: '', agencia: '', conta: '', tipoConta: '' as string,
  asoAdmissionalApto: false, asoAdmissionalData: '',
  dependentes: [] as Dependente[],
  setorId: 0, nivelHierarquico: '' as string,
};

export default function ColaboradoresGEG() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [admissaoAlert, setAdmissaoAlert] = useState(false);
  const [depForm, setDepForm] = useState<Dependente>({ nome: '', cpf: '', dataNascimento: '', parentesco: '' });

  const colaboradores = trpc.colaboradores.list.useQuery();
  const setores = trpc.setores.list.useQuery();
  const createMut = trpc.colaboradores.create.useMutation({
    onSuccess: () => { colaboradores.refetch(); setShowForm(false); resetForm(); toast.success('Colaborador cadastrado!'); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.colaboradores.update.useMutation({
    onSuccess: () => { colaboradores.refetch(); setShowForm(false); resetForm(); toast.success('Colaborador atualizado!'); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setViewMode(false); };

  const handleSave = () => {
    if (!form.nomeCompleto.trim()) { toast.error('Nome completo é obrigatório'); return; }
    if (!form.cpf.trim()) { toast.error('CPF é obrigatório'); return; }
    if (!form.dataAdmissao) { toast.error('Data de admissão é obrigatória'); return; }
    if (!form.cargo.trim()) { toast.error('Cargo é obrigatório'); return; }
    if (!form.salarioBase.trim()) { toast.error('Salário base é obrigatório'); return; }

    // Check if data admissão is not today
    const today = new Date().toISOString().split('T')[0];
    if (form.dataAdmissao !== today && !admissaoAlert && !editId) {
      setAdmissaoAlert(true);
      return;
    }

    const payload = {
      ...form,
      periodoExperiencia: form.periodoExperiencia || undefined,
      setorId: form.setorId || undefined,
      estadoCivil: (form.estadoCivil || undefined) as any,
      sexo: (form.sexo || undefined) as any,
      tipoContrato: (form.tipoContrato || 'clt') as any,
      localTrabalho: (form.localTrabalho || undefined) as any,
      tipoConta: (form.tipoConta || undefined) as any,
      nivelHierarquico: (form.nivelHierarquico || undefined) as any,
    };

    if (editId) {
      updateMut.mutate({ id: editId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const openEdit = (c: any) => {
    setForm({
      ...EMPTY_FORM,
      ...c,
      dependentes: c.dependentes ? (typeof c.dependentes === 'string' ? JSON.parse(c.dependentes) : c.dependentes) : [],
    });
    setEditId(c.id);
    setViewMode(false);
    setShowForm(true);
  };

  const openView = (c: any) => {
    setForm({
      ...EMPTY_FORM,
      ...c,
      dependentes: c.dependentes ? (typeof c.dependentes === 'string' ? JSON.parse(c.dependentes) : c.dependentes) : [],
    });
    setEditId(c.id);
    setViewMode(true);
    setShowForm(true);
  };

  const addDependente = () => {
    if (!depForm.nome.trim()) { toast.error('Nome do dependente é obrigatório'); return; }
    setForm(f => ({ ...f, dependentes: [...f.dependentes, { ...depForm }] }));
    setDepForm({ nome: '', cpf: '', dataNascimento: '', parentesco: '' });
  };

  const removeDependente = (idx: number) => {
    setForm(f => ({ ...f, dependentes: f.dependentes.filter((_, i) => i !== idx) }));
  };

  const filtered = useMemo(() => {
    const list = (colaboradores.data || []) as any[];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((c: any) =>
      c.nomeCompleto?.toLowerCase().includes(s) || c.cpf?.includes(s) || c.cargo?.toLowerCase().includes(s)
    );
  }, [colaboradores.data, search]);

  const ativos = filtered.filter((c: any) => c.ativo !== false);
  const inativos = filtered.filter((c: any) => c.ativo === false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground">Cadastro e gestão de colaboradores — Gente & Gestão</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Colaborador</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, CPF ou cargo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ativos.map((c: any) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openView(c)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{c.nomeCompleto}</h4>
                    <p className="text-xs text-muted-foreground">{c.cargo}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">{c.tipoContrato?.toUpperCase() || 'CLT'}</Badge>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {c.localTrabalho && <Badge variant="secondary" className="text-[10px]">{c.localTrabalho === 'home_office' ? 'Home Office' : c.localTrabalho === 'barueri' ? 'Barueri' : 'Uberaba'}</Badge>}
                {c.dataAdmissao && <span className="text-[10px] text-muted-foreground">Admissão: {c.dataAdmissao}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inativos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Inativos ({inativos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {inativos.map((c: any) => (
              <Card key={c.id} className="cursor-pointer" onClick={() => openView(c)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{c.nomeCompleto}</h4>
                      <p className="text-xs text-muted-foreground">{c.cargo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Admissão Alert */}
      <Dialog open={admissaoAlert} onOpenChange={setAdmissaoAlert}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" /> Data de Admissão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">A data de admissão informada é diferente da data atual. Deseja continuar com esta data?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmissaoAlert(false)}>Cancelar</Button>
            <Button onClick={() => { setAdmissaoAlert(false); handleSave(); }}>Sim, Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewMode ? <Eye className="w-5 h-5" /> : editId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {viewMode ? 'Visualizar Colaborador' : editId ? 'Editar Colaborador' : 'Novo Colaborador'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="pessoais" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pessoais" className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Pessoais</TabsTrigger>
              <TabsTrigger value="profissionais" className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Profissionais</TabsTrigger>
              <TabsTrigger value="saude" className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> Saúde</TabsTrigger>
              <TabsTrigger value="dependentes" className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Dependentes</TabsTrigger>
            </TabsList>

            {/* DADOS PESSOAIS */}
            <TabsContent value="pessoais" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input value={form.nomeCompleto} onChange={e => setForm(f => ({ ...f, nomeCompleto: e.target.value }))} disabled={viewMode} />
                </div>
                <div>
                  <Label>CPF *</Label>
                  <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} disabled={viewMode} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.dataNascimento} onChange={e => setForm(f => ({ ...f, dataNascimento: e.target.value }))} disabled={viewMode} />
                </div>
                <div>
                  <Label>Sexo</Label>
                  <Select value={form.sexo} onValueChange={v => setForm(f => ({ ...f, sexo: v }))} disabled={viewMode}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado Civil</Label>
                  <Select value={form.estadoCivil} onValueChange={v => setForm(f => ({ ...f, estadoCivil: v }))} disabled={viewMode}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="casado">Casado(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      <SelectItem value="uniao_estavel">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h4 className="font-semibold text-sm mt-4">Documentos</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>RG Número</Label><Input value={form.rgNumero} onChange={e => setForm(f => ({ ...f, rgNumero: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Órgão Emissor</Label><Input value={form.rgOrgaoEmissor} onChange={e => setForm(f => ({ ...f, rgOrgaoEmissor: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Data Emissão</Label><Input type="date" value={form.rgDataEmissao} onChange={e => setForm(f => ({ ...f, rgDataEmissao: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>CTPS (Número/Série)</Label><Input value={form.ctpsNumero} onChange={e => setForm(f => ({ ...f, ctpsNumero: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>PIS/PASEP</Label><Input value={form.pisPasep} onChange={e => setForm(f => ({ ...f, pisPasep: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Título de Eleitor</Label><Input value={form.tituloEleitor} onChange={e => setForm(f => ({ ...f, tituloEleitor: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Certificado Reservista</Label><Input value={form.certificadoReservista} onChange={e => setForm(f => ({ ...f, certificadoReservista: e.target.value }))} disabled={viewMode} /></div>
              </div>

              <h4 className="font-semibold text-sm mt-4">Filiação</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome da Mãe</Label><Input value={form.nomeMae} onChange={e => setForm(f => ({ ...f, nomeMae: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Nome do Pai</Label><Input value={form.nomePai} onChange={e => setForm(f => ({ ...f, nomePai: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Nacionalidade</Label><Input value={form.nacionalidade} onChange={e => setForm(f => ({ ...f, nacionalidade: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Naturalidade</Label><Input value={form.naturalidade} onChange={e => setForm(f => ({ ...f, naturalidade: e.target.value }))} disabled={viewMode} placeholder="Cidade/Estado" /></div>
              </div>

              <h4 className="font-semibold text-sm mt-4">Endereço</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>CEP</Label><Input value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))} disabled={viewMode} /></div>
                <div className="col-span-2"><Label>Logradouro</Label><Input value={form.logradouro} onChange={e => setForm(f => ({ ...f, logradouro: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Número</Label><Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Complemento</Label><Input value={form.complemento} onChange={e => setForm(f => ({ ...f, complemento: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Bairro</Label><Input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Estado</Label><Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} disabled={viewMode} /></div>
              </div>

              <h4 className="font-semibold text-sm mt-4">Contato</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={viewMode} /></div>
              </div>
            </TabsContent>

            {/* DADOS PROFISSIONAIS */}
            <TabsContent value="profissionais" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Admissão *</Label>
                  <Input type="date" value={form.dataAdmissao} onChange={e => setForm(f => ({ ...f, dataAdmissao: e.target.value }))} disabled={viewMode} />
                </div>
                <div>
                  <Label>Tipo de Contrato</Label>
                  <Select value={form.tipoContrato} onValueChange={v => setForm(f => ({ ...f, tipoContrato: v }))} disabled={viewMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT</SelectItem>
                      <SelectItem value="pj">PJ</SelectItem>
                      <SelectItem value="contrato_trabalho">Contrato de Trabalho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cargo *</Label>
                  <Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} disabled={viewMode} />
                </div>
                <div>
                  <Label>Função</Label>
                  <Input value={form.funcao} onChange={e => setForm(f => ({ ...f, funcao: e.target.value }))} disabled={viewMode} />
                </div>
                <div>
                  <Label>Nível Hierárquico</Label>
                  <Select value={form.nivelHierarquico} onValueChange={v => setForm(f => ({ ...f, nivelHierarquico: v }))} disabled={viewMode}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estagiario">Estagiário</SelectItem>
                      <SelectItem value="auxiliar">Auxiliar</SelectItem>
                      <SelectItem value="assistente">Assistente</SelectItem>
                      <SelectItem value="analista_jr">Analista Jr</SelectItem>
                      <SelectItem value="analista_pl">Analista Pleno</SelectItem>
                      <SelectItem value="analista_sr">Analista Sênior</SelectItem>
                      <SelectItem value="coordenador">Coordenador</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="diretor">Diretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Setor</Label>
                  <Select value={form.setorId ? String(form.setorId) : ''} onValueChange={v => setForm(f => ({ ...f, setorId: Number(v) }))} disabled={viewMode}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {((setores.data || []) as any[]).filter((s: any) => s.ativo).map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h4 className="font-semibold text-sm mt-4">Remuneração</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Salário Base *</Label><Input value={form.salarioBase} onChange={e => setForm(f => ({ ...f, salarioBase: e.target.value }))} disabled={viewMode} placeholder="R$" /></div>
                <div><Label>Comissões</Label><Input value={form.comissoes} onChange={e => setForm(f => ({ ...f, comissoes: e.target.value }))} disabled={viewMode} placeholder="R$" /></div>
                <div><Label>Adicionais</Label><Input value={form.adicionais} onChange={e => setForm(f => ({ ...f, adicionais: e.target.value }))} disabled={viewMode} placeholder="R$" /></div>
              </div>

              <h4 className="font-semibold text-sm mt-4">Jornada de Trabalho</h4>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Entrada</Label><Input type="time" value={form.jornadaEntrada} onChange={e => setForm(f => ({ ...f, jornadaEntrada: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Saída</Label><Input type="time" value={form.jornadaSaida} onChange={e => setForm(f => ({ ...f, jornadaSaida: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Intervalo</Label><Input type="time" value={form.jornadaIntervalo} onChange={e => setForm(f => ({ ...f, jornadaIntervalo: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Carga Horária (h/sem)</Label><Input value={form.cargaHoraria} onChange={e => setForm(f => ({ ...f, cargaHoraria: e.target.value }))} disabled={viewMode} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Período de Experiência (dias)</Label>
                  <Input type="number" value={form.periodoExperiencia} onChange={e => setForm(f => ({ ...f, periodoExperiencia: Number(e.target.value) }))} disabled={viewMode} />
                </div>
                <div>
                  <Label>Local de Trabalho</Label>
                  <Select value={form.localTrabalho} onValueChange={v => setForm(f => ({ ...f, localTrabalho: v }))} disabled={viewMode}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_office">Home Office</SelectItem>
                      <SelectItem value="barueri">Unidade Barueri</SelectItem>
                      <SelectItem value="uberaba">Unidade Uberaba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <Switch checked={form.valeTransporte} onCheckedChange={c => setForm(f => ({ ...f, valeTransporte: c }))} disabled={viewMode} />
                <Label>Opção pelo Vale Transporte</Label>
              </div>

              <h4 className="font-semibold text-sm mt-4">Dados Bancários</h4>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Banco</Label><Input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Agência</Label><Input value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))} disabled={viewMode} /></div>
                <div><Label>Conta</Label><Input value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))} disabled={viewMode} /></div>
                <div>
                  <Label>Tipo de Conta</Label>
                  <Select value={form.tipoConta} onValueChange={v => setForm(f => ({ ...f, tipoConta: v }))} disabled={viewMode}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* SAÚDE */}
            <TabsContent value="saude" className="space-y-4 mt-4">
              <h4 className="font-semibold text-sm">ASO Admissional</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.asoAdmissionalApto} onCheckedChange={c => setForm(f => ({ ...f, asoAdmissionalApto: c }))} disabled={viewMode} />
                  <Label>Apto</Label>
                </div>
                <div><Label>Data do Exame</Label><Input type="date" value={form.asoAdmissionalData} onChange={e => setForm(f => ({ ...f, asoAdmissionalData: e.target.value }))} disabled={viewMode} /></div>
              </div>
            </TabsContent>

            {/* DEPENDENTES */}
            <TabsContent value="dependentes" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Dependentes para IRRF/Salário-Família</p>
              {form.dependentes.length > 0 && (
                <div className="space-y-2">
                  {form.dependentes.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                        <span className="font-medium">{d.nome}</span>
                        <span>{d.cpf}</span>
                        <span>{d.dataNascimento}</span>
                        <span>{d.parentesco}</span>
                      </div>
                      {!viewMode && <button onClick={() => removeDependente(i)} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4 text-red-400" /></button>}
                    </div>
                  ))}
                </div>
              )}
              {!viewMode && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h5 className="text-sm font-medium">Adicionar Dependente</h5>
                  <div className="grid grid-cols-4 gap-3">
                    <Input placeholder="Nome" value={depForm.nome} onChange={e => setDepForm(f => ({ ...f, nome: e.target.value }))} />
                    <Input placeholder="CPF" value={depForm.cpf} onChange={e => setDepForm(f => ({ ...f, cpf: e.target.value }))} />
                    <Input type="date" value={depForm.dataNascimento} onChange={e => setDepForm(f => ({ ...f, dataNascimento: e.target.value }))} />
                    <Input placeholder="Parentesco" value={depForm.parentesco} onChange={e => setDepForm(f => ({ ...f, parentesco: e.target.value }))} />
                  </div>
                  <Button size="sm" variant="outline" onClick={addDependente}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
              {viewMode ? 'Fechar' : 'Cancelar'}
            </Button>
            {viewMode ? (
              <Button onClick={() => setViewMode(false)}><Edit2 className="w-4 h-4 mr-2" /> Editar</Button>
            ) : (
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                {editId ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
