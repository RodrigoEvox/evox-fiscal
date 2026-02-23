import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileSpreadsheet, Loader2, DollarSign, Users, RefreshCw, Download, FileDown, FileText, ArrowLeft, XCircle} from 'lucide-react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const TIPO_LABELS: Record<string, string> = {
  vale_transporte: 'Vale Transporte', academia: 'Academia', comissao: 'Comissão',
  reajuste: 'Reajuste', pensao: 'Pensão Alimentícia', contribuicao: 'Contribuição Assist.',
  outro: 'Outro',
};
const TIPO_COLORS: Record<string, string> = {
  vale_transporte: 'bg-blue-100 text-blue-700', academia: 'bg-orange-100 text-orange-700',
  comissao: 'bg-amber-100 text-amber-700', reajuste: 'bg-emerald-100 text-emerald-700',
  pensao: 'bg-red-100 text-red-700', contribuicao: 'bg-purple-100 text-purple-700',
  outro: 'bg-gray-100 text-gray-700',
};

function formatCurrency(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ApontamentosFolhaGEG() {
  const now = new Date();
  const [mesRef, setMesRef] = useState(now.getMonth() + 1);
  const [anoRef, setAnoRef] = useState(now.getFullYear());

  const utils = trpc.useUtils();
  const { data: apontamentos, isLoading } = trpc.apontamentosFolha.list.useQuery({ mesReferencia: mesRef, anoReferencia: anoRef });
  const gerarMut = trpc.apontamentosFolha.gerar.useMutation({
    onSuccess: () => { utils.apontamentosFolha.list.invalidate(); toast.success('Apontamentos gerados com sucesso!'); },
    onError: (e) => toast.error(e.message),
  });

  // Group by tipo for summary
  const resumoPorTipo = useMemo(() => {
    if (!apontamentos?.length) return [];
    const map: Record<string, { tipo: string; count: number; total: number }> = {};
    apontamentos.forEach(a => {
      if (!map[a.tipo]) map[a.tipo] = { tipo: a.tipo, count: 0, total: 0 };
      map[a.tipo].count++;
      map[a.tipo].total += Number(a.valor);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [apontamentos]);

  // Group by colaborador
  const resumoPorColab = useMemo(() => {
    if (!apontamentos?.length) return [];
    const map: Record<number, { id: number; nome: string; items: typeof apontamentos; total: number }> = {};
    apontamentos.forEach(a => {
      if (!map[a.colaboradorId]) map[a.colaboradorId] = { id: a.colaboradorId, nome: a.colaboradorNome, items: [], total: 0 };
      map[a.colaboradorId].items.push(a);
      map[a.colaboradorId].total += Number(a.valor);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [apontamentos]);

  const totalGeral = useMemo(() => (apontamentos || []).reduce((s, a) => s + Number(a.valor), 0), [apontamentos]);

  
  const clearAllFilters = () => { setMesRef(new Date().getMonth() + 1); setAnoRef(new Date().getFullYear()); };
return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" /> Apontamentos da Folha
          </h1>

              <p className="text-sm text-muted-foreground mt-1">Relatório consolidado de apontamentos para contabilidade</p>

            </div>

          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => gerarMut.mutate({ mesReferencia: mesRef, anoReferencia: anoRef })} disabled={gerarMut.isPending}>
            {gerarMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Gerar Apontamentos
          </Button>
          {(apontamentos?.length || 0) > 0 && (
            <>
              <Button
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `/api/apontamentos-folha/excel?mes=${mesRef}&ano=${anoRef}`;
                  link.download = `apontamentos-folha-${MESES[mesRef-1]}-${anoRef}.xlsx`;
                  link.click();
                  toast.success('Download do Excel iniciado!');
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => {
                  window.open(`/api/apontamentos-folha/pdf?mes=${mesRef}&ano=${anoRef}`, '_blank');
                  toast.success('PDF gerado com sucesso!');
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-end">
        <div>
          <Label className="text-xs">Mês</Label>
          <Select value={String(mesRef)} onValueChange={v => setMesRef(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Ano</Label>
          <Input type="number" value={anoRef} onChange={e => setAnoRef(Number(e.target.value))} className="w-[100px]" />
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-1" />Limpar Filtros</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold text-indigo-700">{apontamentos?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalGeral)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Colaboradores</p>
                <p className="text-2xl font-bold text-purple-700">{resumoPorColab.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Tipo */}
      {resumoPorTipo.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resumo por Tipo</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-center px-4 py-3 font-medium">Qtd.</th>
                    <th className="text-right px-4 py-3 font-medium">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoPorTipo.map(r => (
                    <tr key={r.tipo} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3"><Badge className={TIPO_COLORS[r.tipo] || 'bg-gray-100'}>{TIPO_LABELS[r.tipo] || r.tipo}</Badge></td>
                      <td className="px-4 py-3 text-center">{r.count}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-center">{apontamentos?.length || 0}</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatCurrency(totalGeral)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhamento por Colaborador */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !apontamentos?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum apontamento para {MESES[mesRef - 1]}/{anoRef}. Clique em "Gerar Apontamentos" para consolidar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detalhamento por Colaborador</h3>
          {resumoPorColab.map(colab => (
            <Card key={colab.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{colab.nome}</CardTitle>
                  <Badge className="bg-green-100 text-green-700">{formatCurrency(colab.total)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <tbody>
                    {colab.items.map(item => (
                      <tr key={item.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-2">
                          <Badge className={TIPO_COLORS[item.tipo] || 'bg-gray-100'} variant="outline">{TIPO_LABELS[item.tipo] || item.tipo}</Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{item.descricao || '-'}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
