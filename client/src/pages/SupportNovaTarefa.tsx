import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const SETORES = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'contencioso', label: 'Contencioso' },
  { value: 'contratos', label: 'Contratos' },
  { value: 'credito', label: 'Crédito' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'geg', label: 'Gente & Gestão' },
  { value: 'juridico', label: 'Jurídico' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'reforma', label: 'Reforma' },
  { value: 'sofin', label: 'Soluções Financeiras' },
  { value: 'transacao', label: 'Transação' },
];

const PRIORIDADES = [
  { value: 'baixa', label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
  { value: 'media', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'critica', label: 'Crítica', color: 'bg-red-100 text-red-800' },
];

export default function SupportNovaTarefa() {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    setor: '',
    prioridade: 'media',
    cliente: '',
    parceiro: '',
  });

  const [tarefas, setTarefas] = useState<typeof form[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.titulo || !form.setor) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setTarefas([...tarefas, { ...form }]);
    toast.success('Tarefa criada com sucesso');
    setForm({
      titulo: '',
      descricao: '',
      setor: '',
      prioridade: 'media',
      cliente: '',
      parceiro: '',
    });
  };

  const handleDelete = (index: number) => {
    setTarefas(tarefas.filter((_, i) => i !== index));
    toast.success('Tarefa removida');
  };

  const getPrioridadeColor = (prioridade: string) => {
    return PRIORIDADES.find(p => p.value === prioridade)?.color || '';
  };

  const getSetorLabel = (setor: string) => {
    return SETORES.find(s => s.value === setor)?.label || setor;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Plus className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Criar Nova Tarefa</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes da Tarefa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Título da tarefa"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva a tarefa em detalhes"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="setor">Setor Responsável *</Label>
                  <Select value={form.setor} onValueChange={(value) => setForm({ ...form, setor: value })}>
                    <SelectTrigger id="setor">
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETORES.map(setor => (
                        <SelectItem key={setor.value} value={setor.value}>
                          {setor.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={(value) => setForm({ ...form, prioridade: value })}>
                    <SelectTrigger id="prioridade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente">Cliente (opcional)</Label>
                  <Input
                    id="cliente"
                    placeholder="Nome do cliente"
                    value={form.cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="parceiro">Parceiro (opcional)</Label>
                  <Input
                    id="parceiro"
                    placeholder="Nome do parceiro"
                    value={form.parceiro}
                    onChange={(e) => setForm({ ...form, parceiro: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Criar Tarefa
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2">Como usar:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Preencha o título da tarefa</li>
                <li>Selecione o setor responsável</li>
                <li>Defina a prioridade</li>
                <li>Adicione detalhes na descrição</li>
                <li>Clique em "Criar Tarefa"</li>
              </ol>
            </div>
            <div>
              <p className="font-medium mb-2">Prioridades:</p>
              <div className="space-y-1">
                {PRIORIDADES.map(p => (
                  <div key={p.value} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${p.color.split(' ')[0]}`}></div>
                    <span className="text-muted-foreground">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tarefas Criadas */}
      {tarefas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Criadas ({tarefas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tarefas.map((tarefa, index) => (
                <div key={index} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{tarefa.titulo}</h3>
                      <Badge className={getPrioridadeColor(tarefa.prioridade)}>
                        {PRIORIDADES.find(p => p.value === tarefa.prioridade)?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tarefa.descricao}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Setor: <strong>{getSetorLabel(tarefa.setor)}</strong></span>
                      {tarefa.cliente && <span>Cliente: <strong>{tarefa.cliente}</strong></span>}
                      {tarefa.parceiro && <span>Parceiro: <strong>{tarefa.parceiro}</strong></span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
