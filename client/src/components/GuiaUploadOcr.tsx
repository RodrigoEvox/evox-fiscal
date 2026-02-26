import { useState, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload, FileText, Loader2, CheckCircle, AlertTriangle,
  X, Eye, Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuiaOcrItem {
  codigo: string;
  denominacao: string;
  subtipo: string;
  periodoApuracao: string;
  vencimento: string;
  principal: number;
  multa: number;
  juros: number;
  total: number;
}

export interface GuiaOcrResult {
  cnpj: string;
  razaoSocial: string;
  periodoApuracao: string;
  dataVencimento: string;
  numeroDocumento: string;
  valorTotal: number;
  observacoes: string;
  itens: GuiaOcrItem[];
  grupoTributo: string;
  tipoGuia: string;
  statusVencimento: string;
  confianca: number;
  fileUrl: string;
  fileKey: string;
  cnpjValidation: { valido: boolean; clienteCnpj: string; razaoSocial: string } | null;
}

interface GuiaUploadOcrProps {
  clienteId?: number;
  onGuiaProcessed: (result: GuiaOcrResult) => void;
  onAutoFillGuia?: (data: {
    cnpjGuia: string;
    codigoReceita: string;
    grupoTributo: string;
    periodoApuracao: string;
    dataVencimento: string;
    valorOriginal: number;
    valorMulta: number;
    valorJuros: number;
    valorTotal: number;
    statusGuia: string;
  }) => void;
  className?: string;
}

const STATUS_MAP: Record<string, string> = {
  vencida: 'vencida',
  proxima_vencer: 'perto_vencimento',
  a_vencer: 'a_vencer',
  desconhecido: 'a_vencer',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function GuiaUploadOcr({ clienteId, onGuiaProcessed, onAutoFillGuia, className }: GuiaUploadOcrProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [result, setResult] = useState<GuiaOcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadAndParse = trpc.creditRecovery.admin.uploadAndParseGuia.useMutation({
    onSuccess: (data: any) => {
      const res = data as GuiaOcrResult;
      setResult(res);
      setError(null);
      onGuiaProcessed(res);

      if (res.cnpjValidation && !res.cnpjValidation.valido) {
        toast.warning(
          `CNPJ da guia (${res.cnpj}) não corresponde ao cliente (${res.cnpjValidation.clienteCnpj}). Verifique!`,
          { duration: 8000 }
        );
      } else if (res.cnpjValidation?.valido) {
        toast.success('CNPJ da guia validado com sucesso!');
      }

      if (onAutoFillGuia && res.itens.length > 0) {
        const totalPrincipal = res.itens.reduce((s, i) => s + i.principal, 0);
        const totalMulta = res.itens.reduce((s, i) => s + i.multa, 0);
        const totalJuros = res.itens.reduce((s, i) => s + i.juros, 0);
        const codes = res.itens.map(i => i.codigo).filter(Boolean).join(', ');

        // Convert DD/MM/YYYY to YYYY-MM-DD for date input
        let dataVencimentoISO = '';
        if (res.dataVencimento) {
          const parts = res.dataVencimento.split('/');
          if (parts.length === 3) {
            dataVencimentoISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        onAutoFillGuia({
          cnpjGuia: res.cnpj,
          codigoReceita: codes,
          grupoTributo: res.grupoTributo,
          periodoApuracao: res.periodoApuracao,
          dataVencimento: dataVencimentoISO,
          valorOriginal: totalPrincipal,
          valorMulta: totalMulta,
          valorJuros: totalJuros,
          valorTotal: res.valorTotal || (totalPrincipal + totalMulta + totalJuros),
          statusGuia: STATUS_MAP[res.statusVencimento] || 'a_vencer',
        });
        toast.success('Dados da guia preenchidos automaticamente!');
      }
    },
    onError: (err) => {
      setError(err.message);
      toast.error(`Erro ao processar guia: ${err.message}`);
    },
  });

  const processFile = useCallback((file: File) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use PDF, PNG, JPG ou WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setFileName(file.name);
    setResult(null);
    setError(null);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Convert to base64 and upload
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      uploadAndParse.mutate({
        base64Data: base64,
        fileName: file.name,
        mimeType: file.type,
        clienteId,
      });
    };
    reader.readAsDataURL(file);
  }, [clienteId, uploadAndParse]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = '';
  }, [processFile]);

  const clearResult = () => {
    setResult(null);
    setError(null);
    setPreview(null);
    setFileName('');
  };

  return (
    <Card className={cn('border-dashed', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Leitura Automática de Guia (OCR)
          </CardTitle>
          {result && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearResult}>
              <X className="w-3 h-3" />Nova Leitura
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload Area */}
        {!result && !uploadAndParse.isPending && (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              Arraste a guia aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF ou imagem (PNG, JPG) — máx. 10MB
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Os dados serão extraídos automaticamente via IA
            </p>
          </div>
        )}

        {/* Processing State */}
        {uploadAndParse.isPending && (
          <div className="border rounded-lg p-6 text-center bg-muted/30">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Processando guia...</p>
            <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A IA está extraindo os dados do documento. Isso pode levar alguns segundos.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Erro ao processar guia</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={clearResult}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            {/* CNPJ Validation Alert */}
            {result.cnpjValidation && !result.cnpjValidation.valido && (
              <div className="border border-amber-200 rounded-lg p-3 bg-amber-50 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800">CNPJ não corresponde ao cliente</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">
                    Guia: {result.cnpj} — Cliente: {result.cnpjValidation.clienteCnpj} ({result.cnpjValidation.razaoSocial})
                  </p>
                </div>
              </div>
            )}
            {result.cnpjValidation?.valido && (
              <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-800">CNPJ validado</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    {result.cnpj} — {result.razaoSocial}
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-muted/30 rounded p-2">
                <p className="text-[10px] text-muted-foreground uppercase">Tipo</p>
                <p className="text-xs font-medium">{result.tipoGuia}</p>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <p className="text-[10px] text-muted-foreground uppercase">Grupo</p>
                <p className="text-xs font-medium">{result.grupoTributo}</p>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <p className="text-[10px] text-muted-foreground uppercase">Valor Total</p>
                <p className="text-xs font-bold text-primary">{formatCurrency(result.valorTotal)}</p>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <p className="text-[10px] text-muted-foreground uppercase">Confiança</p>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', result.confianca >= 80 ? 'bg-emerald-500' : result.confianca >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: `${result.confianca}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{result.confianca}%</span>
                </div>
              </div>
            </div>

            {/* Header Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">CNPJ:</span> <span className="font-medium">{result.cnpj || '—'}</span></div>
              <div><span className="text-muted-foreground">Razão Social:</span> <span className="font-medium">{result.razaoSocial || '—'}</span></div>
              <div><span className="text-muted-foreground">Período:</span> <span className="font-medium">{result.periodoApuracao || '—'}</span></div>
              <div><span className="text-muted-foreground">Vencimento:</span> <span className="font-medium">{result.dataVencimento || '—'}</span>
                {result.statusVencimento && (
                  <Badge className={cn('ml-1 text-[9px]',
                    result.statusVencimento === 'vencida' ? 'bg-red-100 text-red-800' :
                    result.statusVencimento === 'proxima_vencer' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  )}>
                    {result.statusVencimento === 'vencida' ? 'Vencida' :
                     result.statusVencimento === 'proxima_vencer' ? 'Próx. Vencimento' : 'A Vencer'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Items Table */}
            {result.itens.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1.5">Itens Extraídos ({result.itens.length})</p>
                <div className="border rounded overflow-hidden">
                  <div className="grid grid-cols-6 gap-1 px-2 py-1 bg-muted/50 text-[9px] font-medium text-muted-foreground uppercase">
                    <div>Código</div><div className="col-span-2">Denominação</div><div className="text-right">Principal</div><div className="text-right">Multa/Juros</div><div className="text-right">Total</div>
                  </div>
                  {result.itens.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-1 px-2 py-1.5 border-t text-[11px]">
                      <div className="font-mono">{item.codigo}</div>
                      <div className="col-span-2 truncate">{item.denominacao}</div>
                      <div className="text-right">{formatCurrency(item.principal)}</div>
                      <div className="text-right text-muted-foreground">{formatCurrency(item.multa + item.juros)}</div>
                      <div className="text-right font-medium">{formatCurrency(item.total)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Info */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t">
              {preview ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              <span>{fileName}</span>
              <span>•</span>
              <span>Nº Doc: {result.numeroDocumento || '—'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
