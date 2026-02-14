import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Download, Eye, Search, Loader2, Calendar, Building2, TrendingUp, AlertTriangle, CheckCircle, Scale } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const LOGO_URL = 'https://manus-storage.s3.us-east-1.amazonaws.com/e7e7e5e0-c7e5-4d0a-b845-e6c2f98e9f3a/Logoazul.png';

const prioridadeColors: Record<string, string> = {
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  baixa: 'bg-sky-100 text-sky-700 border-sky-200',
};

export default function Relatorios() {
  const [search, setSearch] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('all');
  const [viewRelatorio, setViewRelatorio] = useState<any>(null);

  const { data: relatorios = [], isLoading } = trpc.relatorios.list.useQuery();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();

  const getCliente = (id: number) => clientes.find((c: any) => c.id === id);

  const filtered = relatorios.filter((r: any) => {
    const cliente = getCliente(r.clienteId);
    const matchSearch = !search || (cliente?.razaoSocial || '').toLowerCase().includes(search.toLowerCase()) || (cliente?.cnpj || '').includes(search);
    const matchPrioridade = filterPrioridade === 'all' || r.prioridade === filterPrioridade;
    return matchSearch && matchPrioridade;
  });

  const exportPDF = async (relatorio: any) => {
    const cliente = getCliente(relatorio.clienteId);
    const doc = new jsPDF();
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); img.src = LOGO_URL; });
      doc.addImage(img, 'PNG', 15, 10, 50, 18);
    } catch { /* logo fallback */ }
    doc.setFontSize(16); doc.setTextColor(10, 37, 64);
    doc.text('Relatório de Análise Tributária', 15, 40);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Data: ${new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}`, 15, 48);
    doc.setDrawColor(10, 37, 64); doc.line(15, 52, 195, 52);
    let y = 60;
    doc.setFontSize(12); doc.setTextColor(10, 37, 64); doc.text('Dados do Cliente', 15, y); y += 8;
    doc.setFontSize(10); doc.setTextColor(50);
    doc.text(`Razão Social: ${cliente?.razaoSocial || 'N/A'}`, 15, y); y += 6;
    doc.text(`CNPJ: ${cliente?.cnpj || 'N/A'}`, 15, y); y += 6;
    doc.text(`Regime: ${cliente?.regimeTributario?.replace(/_/g, ' ') || 'N/A'}`, 15, y); y += 6;
    doc.text(`Prioridade: ${relatorio.prioridade === 'alta' ? 'ALTA' : relatorio.prioridade === 'media' ? 'MÉDIA' : 'BAIXA'}`, 15, y); y += 6;
    doc.text(`Score: ${relatorio.scoreOportunidade || 0}/100`, 15, y); y += 10;
    doc.setFontSize(12); doc.setTextColor(10, 37, 64); doc.text('Red Flags', 15, y); y += 8;
    const redFlags = relatorio.redFlags || [];
    if (redFlags.length === 0) { doc.setTextColor(0, 128, 0); doc.text('Nenhuma red flag identificada.', 15, y); y += 8; }
    else { doc.setFontSize(10); doc.setTextColor(200, 0, 0); redFlags.forEach((f: any) => { doc.text(`• ${typeof f === 'string' ? f : f.descricao || JSON.stringify(f)}`, 15, y); y += 6; if (y > 270) { doc.addPage(); y = 20; } }); }
    y += 4;
    doc.setFontSize(12); doc.setTextColor(10, 37, 64); doc.text('Teses Aplicáveis', 15, y); y += 8;
    const tesesAplic = relatorio.tesesAplicaveis || [];
    doc.setFontSize(10); doc.setTextColor(50);
    if (tesesAplic.length === 0) { doc.text('Nenhuma tese aplicável.', 15, y); y += 6; }
    else { tesesAplic.forEach((t: any) => { doc.text(`• ${typeof t === 'string' ? t : t.nome || JSON.stringify(t)}`, 15, y); y += 6; if (y > 270) { doc.addPage(); y = 20; } }); }
    y += 4;
    doc.setFontSize(12); doc.setTextColor(10, 37, 64); doc.text('Teses Descartadas', 15, y); y += 8;
    const tesesDesc = relatorio.tesesDescartadas || [];
    doc.setFontSize(10); doc.setTextColor(100);
    if (tesesDesc.length === 0) { doc.text('Nenhuma tese descartada.', 15, y); }
    else { tesesDesc.forEach((t: any) => { doc.text(`• ${typeof t === 'string' ? t : t.nome || JSON.stringify(t)}`, 15, y); y += 6; if (y > 270) { doc.addPage(); y = 20; } }); }
    const pc = doc.getNumberOfPages();
    for (let i = 1; i <= pc; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150); doc.text('Evox Fiscal — Sistema Inteligente de Análise de Oportunidades Tributárias', 15, 285); doc.text(`Página ${i} de ${pc}`, 180, 285); }
    doc.save(`relatorio-${cliente?.razaoSocial?.replace(/\s/g, '_') || relatorio.id}-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  const exportExcel = (relatorio: any) => {
    const cliente = getCliente(relatorio.clienteId);
    const wb = XLSX.utils.book_new();
    const data = [
      ['Relatório de Análise Tributária — Evox Fiscal'], [],
      ['Dados do Cliente'],
      ['Razão Social', cliente?.razaoSocial || 'N/A'], ['CNPJ', cliente?.cnpj || 'N/A'],
      ['Regime Tributário', cliente?.regimeTributario?.replace(/_/g, ' ') || 'N/A'],
      ['Prioridade', relatorio.prioridade === 'alta' ? 'ALTA' : relatorio.prioridade === 'media' ? 'MÉDIA' : 'BAIXA'],
      ['Score', relatorio.scoreOportunidade || 0],
      ['Data da Análise', new Date(relatorio.createdAt).toLocaleDateString('pt-BR')], [],
      ['Red Flags'], ...(relatorio.redFlags || []).map((f: any) => [typeof f === 'string' ? f : f.descricao || JSON.stringify(f)]), [],
      ['Teses Aplicáveis'], ...(relatorio.tesesAplicaveis || []).map((t: any) => [typeof t === 'string' ? t : t.nome || JSON.stringify(t)]), [],
      ['Teses Descartadas'], ...(relatorio.tesesDescartadas || []).map((t: any) => [typeof t === 'string' ? t : t.nome || JSON.stringify(t)]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data); ws['!cols'] = [{ wch: 25 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Análise');
    XLSX.writeFile(wb, `relatorio-${cliente?.razaoSocial?.replace(/\s/g, '_') || relatorio.id}.xlsx`);
    toast.success('Excel exportado!');
  };

  const exportAllExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = filtered.map((r: any) => { const c = getCliente(r.clienteId); return { 'Razão Social': c?.razaoSocial || '', 'CNPJ': c?.cnpj || '', 'Regime': c?.regimeTributario?.replace(/_/g, ' ') || '', 'Prioridade': r.prioridade === 'alta' ? 'ALTA' : r.prioridade === 'media' ? 'MÉDIA' : 'BAIXA', 'Score': r.scoreOportunidade || 0, 'Red Flags': (r.redFlags || []).length, 'Teses Aplicáveis': (r.tesesAplicaveis || []).length, 'Data': new Date(r.createdAt).toLocaleDateString('pt-BR') }; });
    const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Relatórios');
    XLSX.writeFile(wb, `relatorios-evox-fiscal-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel exportado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FileText className="w-6 h-6" /> Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} relatório(s)</p>
        </div>
        <Button onClick={exportAllExcel} disabled={filtered.length === 0} variant="outline" className="gap-2"><Download className="w-4 h-4" /> Exportar Todos (Excel)</Button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar por razão social ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="baixa">Baixa</SelectItem></SelectContent>
        </Select>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Nenhum relatório encontrado.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => {
            const cliente = getCliente(r.clienteId);
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{cliente?.razaoSocial || `Cliente #${r.clienteId}`}</h3>
                        <Badge className={prioridadeColors[r.prioridade]}>{r.prioridade === 'alta' ? 'Alta' : r.prioridade === 'media' ? 'Média' : 'Baixa'}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {cliente?.cnpj}</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Score: {r.scoreOportunidade || 0}</span>
                        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {(r.redFlags || []).length} flags</span>
                        <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {(r.tesesAplicaveis || []).length} teses</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewRelatorio(r)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => exportPDF(r)} title="PDF"><Download className="w-4 h-4 text-red-500" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => exportExcel(r)} title="Excel"><Download className="w-4 h-4 text-green-500" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog open={!!viewRelatorio} onOpenChange={() => setViewRelatorio(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewRelatorio && (() => {
            const cliente = getCliente(viewRelatorio.clienteId);
            return (<>
              <DialogHeader><DialogTitle>{cliente?.razaoSocial || `Relatório #${viewRelatorio.id}`}</DialogTitle><DialogDescription>{new Date(viewRelatorio.createdAt).toLocaleDateString('pt-BR')} — Score: {viewRelatorio.scoreOportunidade || 0}/100</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <Badge className={prioridadeColors[viewRelatorio.prioridade]}>Prioridade: {viewRelatorio.prioridade === 'alta' ? 'Alta' : viewRelatorio.prioridade === 'media' ? 'Média' : 'Baixa'}</Badge>
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500" /> Red Flags ({(viewRelatorio.redFlags || []).length})</h4>
                  {(viewRelatorio.redFlags || []).length === 0 ? <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Nenhuma red flag.</p> : (
                    <div className="space-y-1">{(viewRelatorio.redFlags || []).map((f: any, i: number) => (<div key={i} className="text-sm p-2 bg-red-50 rounded border border-red-200 text-red-700">{typeof f === 'string' ? f : f.descricao || JSON.stringify(f)}</div>))}</div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Scale className="w-4 h-4 text-green-500" /> Teses Aplicáveis ({(viewRelatorio.tesesAplicaveis || []).length})</h4>
                  {(viewRelatorio.tesesAplicaveis || []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma.</p> : (
                    <div className="space-y-1">{(viewRelatorio.tesesAplicaveis || []).map((t: any, i: number) => (<div key={i} className="text-sm p-2 bg-green-50 rounded border border-green-200 text-green-700">{typeof t === 'string' ? t : t.nome || JSON.stringify(t)}</div>))}</div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Scale className="w-4 h-4 text-gray-400" /> Teses Descartadas ({(viewRelatorio.tesesDescartadas || []).length})</h4>
                  {(viewRelatorio.tesesDescartadas || []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma.</p> : (
                    <div className="space-y-1">{(viewRelatorio.tesesDescartadas || []).map((t: any, i: number) => (<div key={i} className="text-sm p-2 bg-gray-50 rounded border border-gray-200 text-gray-600">{typeof t === 'string' ? t : t.nome || JSON.stringify(t)}</div>))}</div>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button onClick={() => exportPDF(viewRelatorio)} className="gap-2"><Download className="w-4 h-4" /> PDF</Button>
                  <Button variant="outline" onClick={() => exportExcel(viewRelatorio)} className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
                </div>
              </div>
            </>);
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
