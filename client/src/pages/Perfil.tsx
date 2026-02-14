import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, User, Mail, Phone, Briefcase, Shield, IdCard, UserCircle, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

function cpfMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function phoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Perfil() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [apelido, setApelido] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Initialize form when user data loads
  useEffect(() => {
    if (user && !loaded) {
      const u = user as any;
      setName(u.name || '');
      setApelido(u.apelido || '');
      setCpf(u.cpf || '');
      setCargo(u.cargo || '');
      setTelefone(u.telefone || '');
      setLoaded(true);
    }
  }, [user, loaded]);

  const updatePerfil = trpc.perfil.update.useMutation({
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      utils.perfil.get.invalidate();
      utils.auth.me.invalidate();
    },
    onError: () => toast.error('Erro ao atualizar perfil'),
  });

  const uploadAvatar = trpc.perfil.uploadAvatar.useMutation({
    onSuccess: () => {
      toast.success('Foto atualizada!');
      utils.perfil.get.invalidate();
      utils.auth.me.invalidate();
    },
    onError: () => toast.error('Erro ao enviar foto. Verifique se a imagem tem no máximo 2MB.'),
  });

  const handleSave = () => {
    updatePerfil.mutate({ cargo, telefone, name, apelido, cpf });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadAvatar.mutate({ base64Data: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const nivelLabel: Record<string, string> = {
    diretor: 'Diretor', gerente: 'Gerente', coordenador: 'Coordenador',
    analista_fiscal: 'Analista Fiscal', suporte_comercial: 'Suporte Comercial',
  };

  const displayName = (user as any)?.apelido || user?.name || 'Usuário';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <UserCircle className="w-6 h-6" /> Meu Perfil
      </h1>

      {/* Avatar Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-gray-200 shadow-sm">
                {(user as any)?.avatar && <AvatarImage src={(user as any).avatar} />}
                <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-600">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{displayName}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Clique no ícone da câmera para alterar sua foto (máx. 2MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Nome Completo
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <UserCircle className="w-3.5 h-3.5" /> Apelido (exibição no sistema)
              </Label>
              <Input value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="Como seu nome aparece no sistema" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input value={user?.email || ''} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5" /> CPF
              </Label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(cpfMask(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Telefone
              </Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(phoneMask(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Cargo
              </Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Analista Tributário Sênior" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={updatePerfil.isPending} className="gap-2">
              {updatePerfil.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="w-4 h-4" /> Salvar Alterações</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" /> Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Papel</span>
              <span className="font-medium">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Nível de Acesso</span>
              <span className="font-medium">{nivelLabel[(user as any)?.nivelAcesso] || 'Analista'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Membro desde</span>
              <span className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
