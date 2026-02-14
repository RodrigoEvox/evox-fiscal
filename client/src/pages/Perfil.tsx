import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, User, Mail, Phone, Briefcase, Shield, Building2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

export default function Perfil() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [cargo, setCargo] = useState((user as any)?.cargo || '');
  const [telefone, setTelefone] = useState((user as any)?.telefone || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePerfil = trpc.perfil.update.useMutation({
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      utils.perfil.get.invalidate();
    },
    onError: () => toast.error('Erro ao atualizar perfil'),
  });

  const uploadAvatar = trpc.perfil.uploadAvatar.useMutation({
    onSuccess: () => {
      toast.success('Foto atualizada!');
      utils.perfil.get.invalidate();
      utils.auth.me.invalidate();
    },
    onError: () => toast.error('Erro ao enviar foto'),
  });

  const handleSave = () => {
    updatePerfil.mutate({ cargo, telefone });
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-gray-200">
                {(user as any)?.avatar && <AvatarImage src={(user as any).avatar} />}
                <AvatarFallback className="text-xl font-bold bg-blue-100 text-blue-600">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user?.name || 'Usuário'}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input value={user?.email || ''} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Nível de Acesso
              </Label>
              <Input value={nivelLabel[(user as any)?.nivelAcesso] || 'Analista'} disabled className="bg-gray-50" />
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Cargo
              </Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Analista Tributário Sênior" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Telefone
              </Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updatePerfil.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updatePerfil.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Papel:</span>
              <span className="ml-2 font-medium">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
            </div>
            <div>
              <span className="text-gray-500">Membro desde:</span>
              <span className="ml-2 font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
