import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Upload, FolderOpen, FileText, Image, FileSpreadsheet,
  File, Trash2, Download, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fileIcons: Record<string, any> = {
  'image/': Image,
  'application/pdf': FileText,
  'application/vnd.openxmlformats': FileSpreadsheet,
  'text/': FileText,
};

function getFileIcon(mimeType: string) {
  for (const [prefix, icon] of Object.entries(fileIcons)) {
    if (mimeType.startsWith(prefix)) return icon;
  }
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Arquivos() {
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const arquivos = trpc.arquivos.list.useQuery(
    filterTipo !== 'all' ? { entidadeTipo: filterTipo } : undefined
  );
  const uploadArquivo = trpc.arquivos.upload.useMutation({
    onSuccess: () => { arquivos.refetch(); setUploading(false); toast.success('Arquivo enviado!'); },
    onError: (e) => { setUploading(false); toast.error(e.message); },
  });
  const deleteArquivo = trpc.arquivos.delete.useMutation({
    onSuccess: () => { arquivos.refetch(); toast.success('Arquivo excluído!'); },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande (máx. 10MB)'); return; }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadArquivo.mutate({
        nome: file.name,
        nomeOriginal: file.name,
        mimeType: file.type || 'application/octet-stream',
        tamanhoBytes: file.size,
        base64Data: base64,
        entidadeTipo: 'geral',
      });
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Arquivos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {arquivos.data?.length || 0} arquivo(s) armazenados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
              <SelectItem value="tarefa">Tarefa</SelectItem>
              <SelectItem value="tese">Tese</SelectItem>
              <SelectItem value="parceiro">Parceiro</SelectItem>
              <SelectItem value="relatorio">Relatório</SelectItem>
              <SelectItem value="geral">Geral</SelectItem>
            </SelectContent>
          </Select>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-1" />
            {uploading ? 'Enviando...' : 'Upload'}
          </Button>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {arquivos.data?.map((arquivo: any) => {
          const Icon = getFileIcon(arquivo.mimeType);
          return (
            <Card key={arquivo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{arquivo.nomeOriginal}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{formatBytes(Number(arquivo.tamanhoBytes))}</span>
                      <Badge variant="secondary" className="text-[10px]">{arquivo.entidadeTipo}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {arquivo.uploadPorNome} • {new Date(arquivo.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <a href={arquivo.storageUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => { if (confirm('Excluir este arquivo?')) deleteArquivo.mutate({ id: arquivo.id }); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!arquivos.data || arquivos.data.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum arquivo encontrado</p>
            <p className="text-xs mt-1">Faça upload de documentos para armazená-los no sistema</p>
          </div>
        )}
      </div>
    </div>
  );
}
