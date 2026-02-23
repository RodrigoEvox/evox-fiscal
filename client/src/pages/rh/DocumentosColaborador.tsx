import { Link } from 'wouter';
import { useState, useMemo, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload, FileText, Image, Trash2, Download, User, Search,
  Camera, CreditCard, FileCheck, Stethoscope, File, FolderOpen, ArrowLeft, XCircle} from 'lucide-react';

const TIPO_LABELS: Record<string, string> = {
  foto: 'Foto',
  rg: 'RG',
  ctps: 'CTPS',
  aso: 'ASO',
  contrato: 'Contrato',
  comprovante_residencia: 'Comprovante de Residência',
  outro: 'Outro',
};

const TIPO_ICONS: Record<string, any> = {
  foto: Camera,
  rg: CreditCard,
  ctps: FileCheck,
  aso: Stethoscope,
  contrato: FileText,
  comprovante_residencia: File,
  outro: File,
};

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateBR(d: string | Date) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('pt-BR');
}

export default function DocumentosColaborador() {
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedColabId, setSelectedColabId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    colaboradorId: 0,
    tipo: 'foto' as string,
    file: null as File | null,
  });

  const colaboradores = trpc.colaboradores.list.useQuery();
  const documentos = trpc.colaboradorDocumentos.list.useQuery(
    selectedColabId ? { colaboradorId: selectedColabId } : undefined
  );
  const createDoc = trpc.colaboradorDocumentos.create.useMutation({
    onSuccess: () => { documentos.refetch(); setShowUpload(false); setUploadForm({ colaboradorId: 0, tipo: 'foto', file: null }); toast.success('Documento enviado!'); }
  });
  const deleteDoc = trpc.colaboradorDocumentos.delete.useMutation({
    onSuccess: () => { documentos.refetch(); toast.success('Documento excluído!'); }
  });

  const colabList = (colaboradores.data || []) as any[];
  const docList = (documentos.data || []) as any[];

  const filteredColabs = useMemo(() => {
    const ativos = colabList.filter(c => c.ativo !== false);
    if (!search.trim()) return ativos;
    const s = search.toLowerCase();
    return ativos.filter(c => c.nomeCompleto?.toLowerCase().includes(s));
  }, [colabList, search]);

  // Count docs per collaborator
  const allDocs = trpc.colaboradorDocumentos.list.useQuery();
  const docCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    ((allDocs.data || []) as any[]).forEach(d => {
      map[d.colaboradorId] = (map[d.colaboradorId] || 0) + 1;
    });
    return map;
  }, [allDocs.data]);

  const handleUpload = async () => {
    if (!uploadForm.colaboradorId) { toast.error('Selecione o colaborador'); return; }
    if (!uploadForm.file) { toast.error('Selecione um arquivo'); return; }

    setUploading(true);
    try {
      // Upload to server via fetch
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('colaboradorId', String(uploadForm.colaboradorId));
      formData.append('tipo', uploadForm.tipo);

      const res = await fetch('/api/upload-colaborador-doc', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Erro no upload');
      }

      const data = await res.json();
      // Create document record via tRPC
      createDoc.mutate({
        colaboradorId: uploadForm.colaboradorId,
        tipo: uploadForm.tipo as any,
        nomeArquivo: uploadForm.file.name,
        url: data.url,
        fileKey: data.fileKey,
        mimeType: uploadForm.file.type,
        tamanho: uploadForm.file.size,
      });
    } catch (err: any) {
      toast.error(`Erro no upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const isImage = (mimeType: string) => mimeType?.startsWith('image/');

  
  const clearAllFilters = () => {
    setSearch("");
  };
return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold">Documentos dos Colaboradores</h1>

              <p className="text-muted-foreground">Upload e gestão de documentos digitalizados (Foto, RG, CTPS, ASO)</p>

            </div>

          </div>
        </div>
        <Button onClick={() => { setUploadForm({ colaboradorId: selectedColabId || 0, tipo: 'foto', file: null }); setShowUpload(true); }}>
          <Upload className="w-4 h-4 mr-2" /> Enviar Documento
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Collaborator list */}
        <div className="col-span-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredColabs.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedColabId(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  selectedColabId === c.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.nomeCompleto}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.cargo}</p>
                </div>
                {docCountMap[c.id] > 0 && (
                  <Badge variant="outline" className="text-xs shrink-0">{docCountMap[c.id]}</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Documents */}
        <div className="col-span-8">
          {!selectedColabId ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Selecione um colaborador</p>
                <p className="text-sm mt-1">Escolha um colaborador na lista para ver e gerenciar seus documentos.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Selected collaborator header */}
              {(() => {
                const colab = colabList.find(c => c.id === selectedColabId);
                if (!colab) return null;
                return (
                  <Card className="bg-blue-50/50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{colab.nomeCompleto}</h3>
                            <p className="text-sm text-muted-foreground">{colab.cargo} — CPF: {colab.cpf || '—'}</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => { setUploadForm({ colaboradorId: selectedColabId, tipo: 'foto', file: null }); setShowUpload(true); }}>
                          <Upload className="w-4 h-4 mr-1" /> Enviar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Document type sections */}
              {['foto', 'rg', 'ctps', 'aso', 'contrato', 'comprovante_residencia', 'outro'].map(tipo => {
                const docs = docList.filter(d => d.tipo === tipo);
                if (docs.length === 0) return null;
                const Icon = TIPO_ICONS[tipo] || File;
                return (
                  <div key={tipo}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Icon className="w-4 h-4" /> {TIPO_LABELS[tipo]}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {docs.map((doc: any) => (
                        <Card key={doc.id} className="group hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            {isImage(doc.mimeType) && (
                              <div className="w-full h-32 rounded-lg overflow-hidden mb-2 bg-gray-100">
                                <img src={doc.url} alt={doc.nomeArquivo} className="w-full h-full object-cover" />
                              </div>
                            )}
                            {!isImage(doc.mimeType) && (
                              <div className="w-full h-20 rounded-lg bg-gray-50 flex items-center justify-center mb-2">
                                <FileText className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{doc.nomeArquivo}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(doc.tamanho)} — {formatDateBR(doc.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                    <Download className="w-3.5 h-3.5" />
                                  </Button>
                                </a>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => {
                                  if (confirm('Excluir este documento?')) deleteDoc.mutate({ id: doc.id });
                                }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {docList.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum documento enviado para este colaborador.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => { setUploadForm({ colaboradorId: selectedColabId, tipo: 'foto', file: null }); setShowUpload(true); }}>
                      <Upload className="w-4 h-4 mr-1" /> Enviar Primeiro Documento
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Summary of required docs */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-2">Checklist de Documentos</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {['foto', 'rg', 'ctps', 'aso'].map(tipo => {
                      const has = docList.some(d => d.tipo === tipo);
                      const Icon = TIPO_ICONS[tipo] || File;
                      return (
                        <div key={tipo} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${has ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          <Icon className="w-4 h-4" />
                          <span>{TIPO_LABELS[tipo]}</span>
                          {has ? <Badge className="ml-auto bg-green-100 text-green-700 text-[10px]">OK</Badge> : <Badge className="ml-auto bg-red-100 text-red-600 text-[10px]">Pendente</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enviar Documento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={uploadForm.colaboradorId ? String(uploadForm.colaboradorId) : ''} onValueChange={v => setUploadForm(f => ({ ...f, colaboradorId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {colabList.filter(c => c.ativo !== false).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Documento *</Label>
              <Select value={uploadForm.tipo} onValueChange={v => setUploadForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="foto">Foto</SelectItem>
                  <SelectItem value="rg">RG</SelectItem>
                  <SelectItem value="ctps">CTPS</SelectItem>
                  <SelectItem value="aso">ASO</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="comprovante_residencia">Comprovante de Residência</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadForm.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">{uploadForm.file.name}</span>
                    <span className="text-xs text-muted-foreground">({formatBytes(uploadForm.file.size)})</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar um arquivo</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (máx. 10MB)</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('Arquivo muito grande. Máximo 10MB.');
                      return;
                    }
                    setUploadForm(f => ({ ...f, file }));
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || createDoc.isPending}>
              {uploading ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
