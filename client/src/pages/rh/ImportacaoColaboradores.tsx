import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Download, AlertTriangle, ArrowLeft, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLocation } from 'wouter';

const TEMPLATE_COLUMNS = [
  'Nome Completo', 'CPF', 'Data Nascimento', 'Sexo', 'Estado Civil',
  'RG', 'PIS/PASEP', 'CTPS', 'Data Admissão', 'Cargo', 'Função',
  'Salário Base', 'Tipo Contrato', 'Telefone', 'E-mail',
  'CEP', 'Logradouro', 'Número', 'Bairro', 'Cidade', 'Estado',
  'Banco', 'Agência', 'Conta', 'Nome Mãe', 'Nome Pai',
  'Vale Transporte', 'Nacionalidade'
];

const REQUIRED_COLUMNS = ['Nome Completo', 'CPF', 'Data Admissão', 'Cargo', 'Salário Base'];

export default function ImportacaoColaboradores() {
  const [, navigate] = useLocation();
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number; errorDetails?: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const importMutation = trpc.colaboradores.importBulk.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.colaboradores.list.invalidate();
      toast.success(`${data.success} colaboradores importados com sucesso!`);
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
      const mapped = parsedData.map(row => {
        const obj: any = {};
        for (const [key, val] of Object.entries(row)) {
          const k = key.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (k.includes('nome completo') || k === 'nome' || k === 'nomecompleto') obj.nomeCompleto = String(val);
          else if (k === 'cpf') obj.cpf = String(val);
          else if (k.includes('nascimento') || k === 'datanascimento') obj.dataNascimento = String(val);
          else if (k === 'sexo') obj.sexo = String(val).toLowerCase();
          else if (k.includes('civil') || k === 'estadocivil') obj.estadoCivil = String(val).toLowerCase().replace(/ /g, '_');
          else if (k === 'rg' || k === 'rgnumero') obj.rgNumero = String(val);
          else if (k.includes('pis') || k === 'pispasep') obj.pisPasep = String(val);
          else if (k === 'ctps' || k === 'ctpsnumero') obj.ctpsNumero = String(val);
          else if (k.includes('admissao') || k === 'dataadmissao') obj.dataAdmissao = String(val);
          else if (k === 'cargo') obj.cargo = String(val);
          else if (k === 'funcao' || k === 'funcão') obj.funcao = String(val);
          else if (k.includes('salario') || k === 'salariobase') obj.salarioBase = String(val);
          else if (k.includes('contrato') || k === 'tipocontrato') obj.tipoContrato = String(val).toLowerCase().replace(/ /g, '_');
          else if (k === 'telefone') obj.telefone = String(val);
          else if (k === 'email' || k === 'e-mail') obj.email = String(val);
          else if (k === 'cep') obj.cep = String(val);
          else if (k === 'logradouro' || k === 'endereco') obj.logradouro = String(val);
          else if (k === 'numero') obj.numero = String(val);
          else if (k === 'bairro') obj.bairro = String(val);
          else if (k === 'cidade') obj.cidade = String(val);
          else if (k === 'estado' || k === 'uf') obj.estado = String(val);
          else if (k === 'banco') obj.banco = String(val);
          else if (k === 'agencia') obj.agencia = String(val);
          else if (k === 'conta') obj.conta = String(val);
          else if (k.includes('mae') || k === 'nomemae') obj.nomeMae = String(val);
          else if (k.includes('pai') || k === 'nomepai') obj.nomePai = String(val);
          else if (k.includes('vale') || k === 'valetransporte') obj.valeTransporte = String(val).toLowerCase() === 'sim' || val === true;
          else if (k === 'nacionalidade') obj.nacionalidade = String(val);
        }
        return obj;
      });
      await importMutation.mutateAsync({ colaboradores: mapped });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS,
      [
        'João da Silva', '123.456.789-00', '15/03/1990', 'Masculino', 'Solteiro',
        '12.345.678-9', '123.45678.90-1', '12345/001', '01/02/2024', 'Analista Fiscal', 'Analista',
        '3500', 'CLT', '(11) 99999-0000', 'joao@email.com',
        '01310-100', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP',
        'Itaú', '1234', '12345-6', 'Maria da Silva', 'José da Silva',
        'Sim', 'Brasileira'
      ],
    ]);
    // Set column widths
    ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    XLSX.writeFile(wb, 'template_importacao_colaboradores.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rh/colaboradores')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="w-6 h-6" /> Importação de Colaboradores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importe colaboradores em lote a partir de planilhas Excel ou CSV
          </p>
        </div>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1. Baixe o Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Use o template abaixo como modelo para preencher os dados dos colaboradores.
          </p>
          <div className="mb-3">
            <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Campos obrigatórios:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {REQUIRED_COLUMNS.map(c => (
                <Badge key={c} variant="destructive" className="text-xs">{c}</Badge>
              ))}
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Campos opcionais:</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_COLUMNS.filter(c => !REQUIRED_COLUMNS.includes(c)).map(c => (
                <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
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
            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="text-left p-2 font-semibold">#</th>
                    {Object.keys(parsedData[0] || {}).slice(0, 10).map(k => (
                      <th key={k} className="text-left p-2 font-semibold whitespace-nowrap">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 15).map((row, i) => (
                    <tr key={i} className="border-t hover:bg-muted/50">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      {Object.values(row).slice(0, 10).map((val, j) => (
                        <td key={j} className="p-2 max-w-[180px] truncate">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 15 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ... e mais {parsedData.length - 15} registros
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Importar {parsedData.length} Colaboradores
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
            <div className="flex items-start gap-4">
              {result.errors === 0 ? (
                <CheckCircle className="w-10 h-10 text-green-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-yellow-500 shrink-0" />
              )}
              <div className="flex-1">
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
                {result.errorDetails && result.errorDetails.length > 0 && (
                  <div className="mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Detalhes dos erros:</p>
                    {result.errorDetails.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
