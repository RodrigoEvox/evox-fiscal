import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Shield, ShieldCheck, ShieldAlert, UserCog, Loader2 } from 'lucide-react';

const nivelLabels: Record<string, string> = {
  administrador: 'Administrador',
  suporte_comercial: 'Suporte Comercial',
  analista_fiscal: 'Analista Fiscal',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  user: 'Usuário',
};

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.users.list.useQuery();

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success('Perfil atualizado!'); },
    onError: (err) => toast.error(err.message),
  });

  const toggleActive = trpc.users.toggleActive.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success('Status atualizado!'); },
    onError: (err) => toast.error(err.message),
  });

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="w-6 h-6" /> Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} usuários cadastrados</p>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((u: any) => {
          const isSelf = u.id === currentUser?.id;
          const NivelIcon = u.nivelAcesso === 'administrador' ? ShieldCheck : u.nivelAcesso === 'suporte_comercial' ? Shield : Users;
          return (
            <Card key={u.id} className={`${!u.ativo ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      <NivelIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{u.name || 'Sem nome'}</p>
                        {isSelf && <Badge variant="outline" className="text-[10px]">Você</Badge>}
                        {!u.ativo && <Badge variant="destructive" className="text-[10px]">Inativo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email || 'Sem e-mail'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Último acesso: {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString('pt-BR') : 'Nunca'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Papel</label>
                      <Select
                        value={u.role}
                        onValueChange={(val) => updateRole.mutate({ id: u.id, role: val, nivelAcesso: u.nivelAcesso || 'analista_fiscal' })}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">Usuário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nível de Acesso */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Nível de Acesso</label>
                      <Select
                        value={u.nivelAcesso || 'analista_fiscal'}
                        onValueChange={(val) => updateRole.mutate({ id: u.id, role: u.role, nivelAcesso: val })}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="suporte_comercial">Suporte Comercial</SelectItem>
                          <SelectItem value="analista_fiscal">Analista Fiscal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Toggle Active */}
                    <Button
                      variant={u.ativo ? "destructive" : "default"}
                      size="sm"
                      className="text-xs"
                      disabled={isSelf}
                      onClick={() => toggleActive.mutate({ id: u.id, ativo: !u.ativo })}
                    >
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
