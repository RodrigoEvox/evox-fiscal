import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Key, Trash2, Copy, Shield, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const allPermissions = [
  { key: 'clientes:read', label: 'Clientes (Leitura)' },
  { key: 'clientes:write', label: 'Clientes (Escrita)' },
  { key: 'parceiros:read', label: 'Parceiros (Leitura)' },
  { key: 'tarefas:read', label: 'Tarefas (Leitura)' },
  { key: 'tarefas:write', label: 'Tarefas (Escrita)' },
  { key: 'setores:read', label: 'Setores (Leitura)' },
  { key: 'teses:read', label: 'Teses (Leitura)' },
  { key: 'relatorios:read', label: 'Relatórios (Leitura)' },
  { key: 'audit:read', label: 'Audit Log (Leitura)' },
  { key: '*', label: 'Acesso Total' },
];

export default function ApiKeys() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nome: '', permissoes: [] as string[] });
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});

  const apiKeys = trpc.apiKeys.list.useQuery();
  const createKey = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      apiKeys.refetch();
      setNewKey(data.chave);
      toast.success('API Key criada!');
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteKey = trpc.apiKeys.delete.useMutation({
    onSuccess: () => { apiKeys.refetch(); toast.success('API Key excluída!'); },
    onError: (e) => toast.error(e.message),
  });

  const togglePermission = (perm: string) => {
    setForm(f => ({
      ...f,
      permissoes: f.permissoes.includes(perm)
        ? f.permissoes.filter(p => p !== perm)
        : [...f.permissoes, perm],
    }));
  };

  const handleCreate = () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (form.permissoes.length === 0) { toast.error('Selecione ao menos uma permissão'); return; }
    createKey.mutate({ nome: form.nome, permissoes: form.permissoes });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API & Integrações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie chaves de API para integrações externas (Conta Azul, etc.)</p>
        </div>
        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setNewKey(null); setForm({ nome: '', permissoes: [] }); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova API Key</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{newKey ? 'API Key Criada' : 'Nova API Key'}</DialogTitle></DialogHeader>
            {newKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">Copie esta chave agora. Ela não será exibida novamente.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white p-2 rounded border font-mono break-all">{newKey}</code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={() => { setShowCreate(false); setNewKey(null); setForm({ nome: '', permissoes: [] }); }} className="w-full">
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Nome da Integração *</Label>
                  <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Conta Azul, Zapier" />
                </div>
                <div>
                  <Label>Permissões</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {allPermissions.map(p => (
                      <button
                        key={p.key}
                        onClick={() => togglePermission(p.key)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-colors',
                          form.permissoes.includes(p.key)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        <Shield className="w-3 h-3 shrink-0" />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={createKey.isPending} className="w-full">
                  {createKey.isPending ? 'Criando...' : 'Criar API Key'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Documentation Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Documentação da API REST</p>
              <p className="text-xs text-blue-700 mt-1">
                Base URL: <code className="bg-blue-100 px-1 rounded">/api/v1</code> •
                Auth: <code className="bg-blue-100 px-1 rounded">Authorization: Bearer {'<chave>'}</code>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Endpoints: GET /clientes, GET /parceiros, GET /tarefas, POST /tarefas, GET /setores, GET /teses, GET /relatorios, GET /audit, GET /health
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.data?.map((key: any) => (
          <Card key={key.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{key.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[10px] font-mono text-muted-foreground">
                        {showKeys[key.id] ? key.chave : `evx_${'•'.repeat(20)}`}
                      </code>
                      <button onClick={() => setShowKeys(s => ({ ...s, [key.id]: !s[key.id] }))} className="text-muted-foreground hover:text-foreground">
                        {showKeys[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button onClick={() => copyToClipboard(key.chave)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(key.permissoes as string[])?.map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={key.ativo ? 'default' : 'destructive'} className="text-[10px]">
                    {key.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm('Excluir esta API Key?')) deleteKey.mutate({ id: key.id }); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {key.lastUsedAt && (
                <p className="text-[10px] text-muted-foreground mt-2 ml-13">
                  Último uso: {new Date(key.lastUsedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {(!apiKeys.data || apiKeys.data.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma API Key criada</p>
            <p className="text-xs mt-1">Crie chaves para integrar com sistemas externos</p>
          </div>
        )}
      </div>
    </div>
  );
}
