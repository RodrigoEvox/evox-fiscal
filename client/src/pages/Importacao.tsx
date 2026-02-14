import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

const TEMPLATE_COLUMNS = [
  'CNPJ', 'Razão Social', 'Nome Fantasia', 'Regime Tributário',
  'Data Abertura', 'Estado', 'CNAE', 'Valor Médio Guias', 'Faturamento'
];

export default function Importacao() {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const importMutation = trpc.clientes.importCsv.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.clientes.list.invalidate();
      toast.success(`${data.success} clientes importados com sucesso!`);
      if (data.errors > 0) toast.warning(`${data.errors} registros com erro.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setParsedData(json as any[]);
        toast.success(`${json.length} registros encontrados no arquivo.`);
      } catch {
        toast.error('Erro ao ler o arquivo. Verifique o formato.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    try {
      // Map columns
      const mapped = parsedData.map(row => {
        const obj: any = {};
        for (const [key, val] of Object.entries(row)) {
          const k = key.toLowerCase().trim();
          if (k.includes('cnpj')) obj.cnpj = String(val);
          else if (k.includes('razao') || k.includes('razão')) obj.razaoSocial = String(val);
          else if (k.includes('fantasia')) obj.nomeFantasia = String(val);
          else if (k.includes('regime')) obj.regimeTributario = String(val);
          else if (k.includes('abertura') || k.includes('data')) obj.dataAbertura = String(val);
          else if (k.includes('estado') || k === 'uf') obj.estado = String(val);
          else if (k.includes('cnae')) obj.cnaePrincipal = String(val);
          else if (k.includes('guia')) obj.valorMedioGuias = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
          else if (k.includes('faturamento') || k.includes('fatur')) obj.faturamentoMedioMensal = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
        }
        return obj;
      });
      await importMutation.mutateAsync({ clientes: mapped });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS,
      ['12.345.678/0001-90', 'Empresa Exemplo LTDA', 'Exemplo', 'Lucro Presumido', '01/01/2020', 'SP', '4751-2/01', '25000', '150000'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'template_importacao_clientes.xlsx');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6" /> Importação em Massa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importe clientes a partir de planilhas Excel ou CSV
        </p>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1. Baixe o Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Use o template abaixo como modelo para preencher os dados dos clientes. As colunas reconhecidas são:
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {TEMPLATE_COLUMNS.map(c => (
              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" /> Baixar Template Excel
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2. Selecione o Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
          />
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            {fileName ? (
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">{parsedData.length} registros encontrados</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Clique para selecionar ou arraste o arquivo</p>
                <p className="text-sm text-muted-foreground">Formatos aceitos: .xlsx, .xls, .csv</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">3. Prévia dos Dados ({parsedData.length} registros)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="text-left p-2">#</th>
                    {Object.keys(parsedData[0] || {}).slice(0, 8).map(k => (
                      <th key={k} className="text-left p-2">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{i + 1}</td>
                      {Object.values(row).slice(0, 8).map((val, j) => (
                        <td key={j} className="p-2 max-w-[150px] truncate">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ... e mais {parsedData.length - 10} registros
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Importar {parsedData.length} Clientes
              </Button>
              <Button variant="outline" onClick={() => { setParsedData([]); setFileName(''); setResult(null); }}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className={result.errors > 0 ? 'border-yellow-500' : 'border-green-500'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {result.errors === 0 ? (
                <CheckCircle className="w-10 h-10 text-green-500" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-yellow-500" />
              )}
              <div>
                <p className="font-semibold text-lg">Importação Concluída</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> {result.success} importados
                  </span>
                  {result.errors > 0 && (
                    <span className="text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {result.errors} com erro
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Os clientes importados foram adicionados automaticamente à fila de apuração.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
