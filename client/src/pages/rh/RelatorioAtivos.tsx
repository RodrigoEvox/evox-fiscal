import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, Download, FileText, FileSpreadsheet, Laptop, Mail, Key,
  Shield, ChevronDown, ChevronUp, Package, Monitor, Smartphone, Headphones,
  Keyboard, Mouse, Camera, Printer, Tablet, Phone, BarChart3, Users,
  CheckCircle2, AlertCircle, FileSignature, Pen, Filter, XCircle
} from 'lucide-react';

// ===================== LABELS =====================
const EQUIP_TIPO_LABELS: Record<string, string> = {
  notebook: 'Notebook', celular: 'Celular', desktop: 'Desktop', monitor: 'Monitor',
  headset: 'Headset', teclado: 'Teclado', mouse: 'Mouse', webcam: 'Webcam',
  impressora: 'Impressora', tablet: 'Tablet', telefone_fixo: 'Telefone Fixo',
  ramal: 'Ramal', telefone_corporativo: 'Tel. Corporativo', outro: 'Outro',
};

const EQUIP_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  em_uso: { label: 'Em Uso', color: 'bg-green-100 text-green-700' },
  devolvido: { label: 'Devolvido', color: 'bg-blue-100 text-blue-700' },
  manutencao: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-700' },
  perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700' },
  descartado: { label: 'Descartado', color: 'bg-gray-100 text-gray-700' },
};

const SENHA_TIPO_LABELS: Record<string, string> = {
  computador: 'Computador', celular: 'Celular', alarme_escritorio: 'Alarme',
  sistema_interno: 'Sistema Interno', vpn: 'VPN', wifi: 'Wi-Fi', cofre: 'Cofre',
  chave_empresa: 'Chave Empresa', chave_sala: 'Chave Sala', chave_armario: 'Chave Armário',
  veiculo_empresa: 'Veículo', estacionamento: 'Estacionamento', cartao_acesso: 'Cartão Acesso',
  biometria: 'Biometria', outro: 'Outro',
};

const SENHA_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  revogado: { label: 'Revogado', color: 'bg-red-100 text-red-700' },
  expirado: { label: 'Expirado', color: 'bg-yellow-100 text-yellow-700' },
  pendente: { label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
};

// ===================== EXPORT HELPERS =====================
function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = '\uFEFF';
  const csv = bom + [headers.join(';'), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(';'))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV exportado!');
}

function exportPDFReport(title: string, sections: { heading: string; headers: string[]; rows: string[][] }[]) {
  const html = `<html><head><title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 30px; color: #333; }
    h1 { font-size: 18px; margin-bottom: 5px; text-align: center; }
    h2 { font-size: 12px; text-align: center; color: #666; margin-bottom: 25px; }
    h3 { font-size: 13px; margin-top: 25px; margin-bottom: 8px; border-bottom: 2px solid #1a1a2e; padding-bottom: 4px; color: #1a1a2e; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; font-size: 10px; }
    th { background: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background: #fafafa; }
    .summary { background: #f8f9fa; border: 1px solid #dee2e6; padding: 12px; border-radius: 4px; margin-bottom: 20px; }
    .summary span { margin-right: 20px; }
    .footer { text-align: center; margin-top: 30px; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
  </style></head><body>
  <h1>${title}</h1>
  <h2>Evox Fiscal — Relatório de Auditoria</h2>
  <p style="text-align:center;font-size:10px;color:#666;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
  ${sections.map(s => `
    <h3>${s.heading}</h3>
    ${s.rows.length === 0 ? '<p style="color:#999;font-style:italic;">Nenhum registro encontrado</p>' : `
    <table>
      <thead><tr>${s.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${s.rows.map(r => `<tr>${r.map(c => `<td>${c || '—'}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`}
  `).join('')}
  <p class="footer">Este relatório é confidencial e destinado exclusivamente para fins de auditoria interna. — Evox Fiscal</p>
  </body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
}

// ===================== MAIN COMPONENT =====================
export default function RelatorioAtivos() {
  const { user } = useAuth();
  const [selectedColabId, setSelectedColabId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [expandedColabs, setExpandedColabs] = useState<Set<number>>(new Set());

  const colabQ = trpc.colaboradores.list.useQuery();
  const ativosQ = trpc.relatorioAtivos.get.useQuery(
    selectedColabId ? { colaboradorId: selectedColabId } : undefined
  );

  const colabOptions = useMemo(() => {
    if (!colabQ.data) return [];
    return (colabQ.data as any[])
      .filter((c: any) => c.ativo !== false)
      .sort((a: any, b: any) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''))
      .map((c: any) => ({ id: c.id, nome: c.nomeCompleto, cargo: c.cargo, setor: c.setor }));
  }, [colabQ.data]);

  // Group assets by collaborator
  const groupedByColab = useMemo(() => {
    if (!ativosQ.data) return [];
    const { equipamentos, emails, senhas, termos } = ativosQ.data as any;
    const map = new Map<number, { id: number; nome: string; equipamentos: any[]; emails: any[]; senhas: any[]; termos: any[] }>();

    for (const e of (equipamentos || [])) {
      if (!map.has(e.colaboradorId)) map.set(e.colaboradorId, { id: e.colaboradorId, nome: e.colaboradorNome, equipamentos: [], emails: [], senhas: [], termos: [] });
      map.get(e.colaboradorId)!.equipamentos.push(e);
    }
    for (const e of (emails || [])) {
      if (!map.has(e.colaboradorId)) map.set(e.colaboradorId, { id: e.colaboradorId, nome: e.colaboradorNome, equipamentos: [], emails: [], senhas: [], termos: [] });
      map.get(e.colaboradorId)!.emails.push(e);
    }
    for (const s of (senhas || [])) {
      if (!map.has(s.colaboradorId)) map.set(s.colaboradorId, { id: s.colaboradorId, nome: s.colaboradorNome, equipamentos: [], emails: [], senhas: [], termos: [] });
      map.get(s.colaboradorId)!.senhas.push(s);
    }
    for (const t of (termos || [])) {
      if (!map.has(t.colaboradorId)) map.set(t.colaboradorId, { id: t.colaboradorId, nome: t.colaboradorNome, equipamentos: [], emails: [], senhas: [], termos: [] });
      map.get(t.colaboradorId)!.termos.push(t);
    }

    let result = Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => c.nome.toLowerCase().includes(s));
    }
    return result;
  }, [ativosQ.data, search]);

  const totalEquip = groupedByColab.reduce((sum, c) => sum + c.equipamentos.length, 0);
  const totalEmails = groupedByColab.reduce((sum, c) => sum + c.emails.length, 0);
  const totalSenhas = groupedByColab.reduce((sum, c) => sum + c.senhas.length, 0);
  const totalTermos = groupedByColab.reduce((sum, c) => sum + c.termos.length, 0);
  const totalEquipEmUso = groupedByColab.reduce((sum, c) => sum + c.equipamentos.filter((e: any) => e.statusEquipamento === 'em_uso').length, 0);
  const totalSenhasAtivas = groupedByColab.reduce((sum, c) => sum + c.senhas.filter((s: any) => s.statusSenhaAuth === 'ativo').length, 0);

  const toggleColab = (id: number) => {
    setExpandedColabs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExportCSV = () => {
    const headers = ['Colaborador', 'Categoria', 'Tipo', 'Descrição', 'Status', 'Data'];
    const rows: string[][] = [];
    for (const c of groupedByColab) {
      for (const e of c.equipamentos) {
        rows.push([c.nome, 'Equipamento', EQUIP_TIPO_LABELS[e.tipo] || e.tipo, [e.marca, e.modelo].filter(Boolean).join(' '), EQUIP_STATUS_LABELS[e.statusEquipamento]?.label || e.statusEquipamento, e.dataEntrega || '']);
      }
      for (const e of c.emails) {
        rows.push([c.nome, 'E-mail', e.tipoEmail, e.email, e.statusEmail, e.dataCriacao || '']);
      }
      for (const s of c.senhas) {
        rows.push([c.nome, 'Senha/Acesso', SENHA_TIPO_LABELS[s.tipoSenhaAuth] || s.tipoSenhaAuth, s.descricao || s.identificador || '', SENHA_STATUS_LABELS[s.statusSenhaAuth]?.label || s.statusSenhaAuth, s.dataAutorizacao || '']);
      }
    }
    exportCSV('relatorio_ativos_consolidado.csv', headers, rows);
  };

  const handleExportPDF = () => {
    const sections: { heading: string; headers: string[]; rows: string[][] }[] = [];

    if (selectedColabId) {
      const colab = groupedByColab[0];
      if (colab) {
        sections.push({
          heading: `Equipamentos — ${colab.nome}`,
          headers: ['Tipo', 'Marca/Modelo', 'Patrimônio', 'Nº Série', 'Status', 'Entrega'],
          rows: colab.equipamentos.map((e: any) => [
            EQUIP_TIPO_LABELS[e.tipo] || e.tipo,
            [e.marca, e.modelo].filter(Boolean).join(' '),
            e.patrimonio || '', e.numeroSerie || '',
            EQUIP_STATUS_LABELS[e.statusEquipamento]?.label || e.statusEquipamento,
            e.dataEntrega ? new Date(e.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR') : '',
          ]),
        });
        sections.push({
          heading: `E-mails Corporativos — ${colab.nome}`,
          headers: ['E-mail', 'Tipo', 'Status'],
          rows: colab.emails.map((e: any) => [e.email, e.tipoEmail, e.statusEmail]),
        });
        sections.push({
          heading: `Senhas & Acessos — ${colab.nome}`,
          headers: ['Tipo', 'Descrição', 'Identificador', 'Status'],
          rows: colab.senhas.map((s: any) => [
            SENHA_TIPO_LABELS[s.tipoSenhaAuth] || s.tipoSenhaAuth,
            s.descricao || '', s.identificador || '',
            SENHA_STATUS_LABELS[s.statusSenhaAuth]?.label || s.statusSenhaAuth,
          ]),
        });
        sections.push({
          heading: `Termos de Responsabilidade — ${colab.nome}`,
          headers: ['Tipo', 'Data', 'Equipamento', 'Condições', 'Assinatura'],
          rows: colab.termos.map((t: any) => [
            t.tipoTermo === 'entrega' ? 'Entrega' : 'Devolução',
            t.dataEvento ? new Date(t.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR') : '',
            [t.equipamentoMarca, t.equipamentoModelo].filter(Boolean).join(' ') || t.equipamentoTipo || '',
            t.condicoesEquipamento || '',
            t.assinaturaColaboradorUrl ? 'Sim' : 'Não',
          ]),
        });
      }
    } else {
      sections.push({
        heading: 'Resumo Geral de Ativos',
        headers: ['Colaborador', 'Equipamentos', 'E-mails', 'Senhas/Acessos', 'Termos'],
        rows: groupedByColab.map(c => [c.nome, String(c.equipamentos.length), String(c.emails.length), String(c.senhas.length), String(c.termos.length)]),
      });
    }

    exportPDFReport(
      selectedColabId ? `Relatório de Ativos — ${groupedByColab[0]?.nome || 'Colaborador'}` : 'Relatório Consolidado de Ativos',
      sections
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/rh/gestao-rh/equipamentos">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Relatório Consolidado de Ativos
            </h1>
            <p className="text-muted-foreground text-sm">
              Visão completa de equipamentos, e-mails, senhas e termos por colaborador — para auditorias
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Colaboradores</p>
          <p className="text-2xl font-bold">{groupedByColab.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Equipamentos</p>
          <p className="text-2xl font-bold text-blue-600">{totalEquip}</p>
          <p className="text-xs text-muted-foreground">{totalEquipEmUso} em uso</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">E-mails</p>
          <p className="text-2xl font-bold text-emerald-600">{totalEmails}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Senhas/Acessos</p>
          <p className="text-2xl font-bold text-amber-600">{totalSenhas}</p>
          <p className="text-xs text-muted-foreground">{totalSenhasAtivas} ativos</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Termos</p>
          <p className="text-2xl font-bold text-purple-600">{totalTermos}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total Ativos</p>
          <p className="text-2xl font-bold">{totalEquip + totalEmails + totalSenhas}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador..." className="pl-9" />
        </div>
        <Select value={selectedColabId ? String(selectedColabId) : 'all'} onValueChange={v => setSelectedColabId(v === 'all' ? undefined : Number(v))}>
          <SelectTrigger className="w-[250px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Filtrar por colaborador" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Colaboradores</SelectItem>
            {colabOptions.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSelectedColabId(undefined); }} className="text-muted-foreground">
          <XCircle className="w-4 h-4 mr-1" /> Limpar
        </Button>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <FileText className="w-4 h-4" /> PDF Auditoria
          </Button>
        </div>
      </div>

      {/* Collaborator Cards */}
      {ativosQ.isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando dados...</div>
      ) : groupedByColab.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Nenhum ativo encontrado para os filtros selecionados
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {groupedByColab.map(colab => {
            const expanded = expandedColabs.has(colab.id);
            const equipEmUso = colab.equipamentos.filter((e: any) => e.statusEquipamento === 'em_uso').length;
            const senhasAtivas = colab.senhas.filter((s: any) => s.statusSenhaAuth === 'ativo').length;
            const emailsAtivos = colab.emails.filter((e: any) => e.statusEmail === 'ativo').length;

            return (
              <Card key={colab.id} className="overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => toggleColab(colab.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {colab.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{colab.nome}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Laptop className="w-3 h-3" /> {equipEmUso}/{colab.equipamentos.length} equip.</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {emailsAtivos}/{colab.emails.length} e-mails</span>
                      <span className="flex items-center gap-1"><Key className="w-3 h-3" /> {senhasAtivas}/{colab.senhas.length} acessos</span>
                      <span className="flex items-center gap-1"><FileSignature className="w-3 h-3" /> {colab.termos.length} termos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {colab.equipamentos.length + colab.emails.length + colab.senhas.length} ativos
                    </Badge>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {expanded && (
                  <CardContent className="border-t p-4 space-y-4">
                    {/* Equipamentos */}
                    {colab.equipamentos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Laptop className="w-4 h-4 text-blue-600" /> Equipamentos ({colab.equipamentos.length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/20">
                                <th className="text-left p-2 font-medium">Tipo</th>
                                <th className="text-left p-2 font-medium">Marca/Modelo</th>
                                <th className="text-left p-2 font-medium">Patrimônio</th>
                                <th className="text-left p-2 font-medium">Nº Série</th>
                                <th className="text-left p-2 font-medium">Status</th>
                                <th className="text-left p-2 font-medium">Entrega</th>
                              </tr>
                            </thead>
                            <tbody>
                              {colab.equipamentos.map((e: any) => (
                                <tr key={e.id} className="border-b">
                                  <td className="p-2">{EQUIP_TIPO_LABELS[e.tipo] || e.tipo}</td>
                                  <td className="p-2">{[e.marca, e.modelo].filter(Boolean).join(' ') || '—'}</td>
                                  <td className="p-2 font-mono">{e.patrimonio || '—'}</td>
                                  <td className="p-2 font-mono">{e.numeroSerie || '—'}</td>
                                  <td className="p-2">
                                    <Badge variant="outline" className={EQUIP_STATUS_LABELS[e.statusEquipamento]?.color || ''}>
                                      {EQUIP_STATUS_LABELS[e.statusEquipamento]?.label || e.statusEquipamento}
                                    </Badge>
                                  </td>
                                  <td className="p-2">{e.dataEntrega ? new Date(e.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* E-mails */}
                    {colab.emails.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-emerald-600" /> E-mails Corporativos ({colab.emails.length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/20">
                                <th className="text-left p-2 font-medium">E-mail</th>
                                <th className="text-left p-2 font-medium">Tipo</th>
                                <th className="text-left p-2 font-medium">Uso</th>
                                <th className="text-left p-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {colab.emails.map((e: any) => (
                                <tr key={e.id} className="border-b">
                                  <td className="p-2 font-mono">{e.email}</td>
                                  <td className="p-2">{e.tipoEmail === 'principal' ? 'Principal' : 'Secundário'}</td>
                                  <td className="p-2">{e.tipoUso === 'compartilhado' ? 'Compartilhado' : 'Individual'}</td>
                                  <td className="p-2">
                                    <Badge variant="outline" className={e.statusEmail === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                      {e.statusEmail === 'ativo' ? 'Ativo' : e.statusEmail === 'desativado' ? 'Desativado' : 'Suspenso'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Senhas & Acessos */}
                    {colab.senhas.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-600" /> Senhas & Acessos ({colab.senhas.length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/20">
                                <th className="text-left p-2 font-medium">Tipo</th>
                                <th className="text-left p-2 font-medium">Descrição</th>
                                <th className="text-left p-2 font-medium">Uso</th>
                                <th className="text-left p-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {colab.senhas.map((s: any) => (
                                <tr key={s.id} className="border-b">
                                  <td className="p-2">{SENHA_TIPO_LABELS[s.tipoSenhaAuth] || s.tipoSenhaAuth}</td>
                                  <td className="p-2">{s.descricao || s.identificador || '—'}</td>
                                  <td className="p-2">{s.tipoUso === 'comum' ? 'Comum (Todos)' : s.tipoUso === 'compartilhado' ? 'Compartilhado' : 'Individual'}</td>
                                  <td className="p-2">
                                    <Badge variant="outline" className={SENHA_STATUS_LABELS[s.statusSenhaAuth]?.color || ''}>
                                      {SENHA_STATUS_LABELS[s.statusSenhaAuth]?.label || s.statusSenhaAuth}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Termos de Responsabilidade */}
                    {colab.termos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <FileSignature className="w-4 h-4 text-purple-600" /> Termos de Responsabilidade ({colab.termos.length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/20">
                                <th className="text-left p-2 font-medium">Tipo</th>
                                <th className="text-left p-2 font-medium">Data</th>
                                <th className="text-left p-2 font-medium">Equipamento</th>
                                <th className="text-left p-2 font-medium">Condições</th>
                                <th className="text-left p-2 font-medium">Assinatura</th>
                              </tr>
                            </thead>
                            <tbody>
                              {colab.termos.map((t: any) => (
                                <tr key={t.id} className="border-b">
                                  <td className="p-2">
                                    <Badge variant="outline" className={t.tipoTermo === 'entrega' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                                      {t.tipoTermo === 'entrega' ? 'Entrega' : 'Devolução'}
                                    </Badge>
                                  </td>
                                  <td className="p-2">{t.dataEvento ? new Date(t.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                                  <td className="p-2">{[t.equipamentoMarca, t.equipamentoModelo].filter(Boolean).join(' ') || EQUIP_TIPO_LABELS[t.equipamentoTipo] || '—'}</td>
                                  <td className="p-2">{t.condicoesEquipamento || '—'}</td>
                                  <td className="p-2">
                                    {t.assinaturaColaboradorUrl ? (
                                      <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Assinado</span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-yellow-600"><AlertCircle className="w-3 h-3" /> Pendente</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {colab.equipamentos.length === 0 && colab.emails.length === 0 && colab.senhas.length === 0 && colab.termos.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum ativo registrado para este colaborador</p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
