import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo } from 'react';
import {
  Loader2, DollarSign, Users, Briefcase, TrendingUp,
  Filter, ChevronDown, ChevronRight, Gem,
} from 'lucide-react';

function formatCurrency(value: string | number | null | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function RelatorioComissoes() {
  const { data: parceiros = [], isLoading: loadingParceiros } = trpc.parceiros.list.useQuery();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: servicos = [] } = trpc.servicos.list.useQuery();
  const { data: modelos = [] } = trpc.modelosParceria.list.useQuery();
  const { data: comissoes = [] } = trpc.comissoes.listAll.useQuery();
  const { data: executivos = [] } = trpc.executivos.list.useQuery();

  const [filterModelo, setFilterModelo] = useState<string>('todos');
  const [filterExecutivo, setFilterExecutivo] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos'); // parceiro/subparceiro
  const [expandedParceiros, setExpandedParceiros] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedParceiros(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build consolidated data
  const relatorio = useMemo(() => {
    let list = parceiros.filter((p: any) => p.ativo !== false);

    // Filter by modelo
    if (filterModelo !== 'todos') {
      list = list.filter((p: any) => String(p.modeloParceriaId) === filterModelo);
    }

    // Filter by executivo
    if (filterExecutivo !== 'todos') {
      list = list.filter((p: any) => String(p.executivoComercialId) === filterExecutivo);
    }

    // Filter by tipo
    if (filterTipo === 'parceiro') {
      list = list.filter((p: any) => !p.ehSubparceiro);
    } else if (filterTipo === 'subparceiro') {
      list = list.filter((p: any) => p.ehSubparceiro);
    }

    return list.map((parceiro: any) => {
      const modelo = modelos.find((m: any) => m.id === parceiro.modeloParceriaId);
      const executivo = executivos.find((e: any) => e.id === parceiro.executivoComercialId);
      const parceiroPai = parceiro.ehSubparceiro && parceiro.parceiroPaiId
        ? parceiros.find((p: any) => p.id === parceiro.parceiroPaiId)
        : null;

      // Clientes vinculados a este parceiro
      const clientesVinculados = clientes.filter((c: any) => c.parceiroId === parceiro.id);

      // Subparceiros deste parceiro
      const subparceiros = parceiros.filter((p: any) => p.ehSubparceiro && p.parceiroPaiId === parceiro.id);

      // Clientes dos subparceiros
      const clientesSubparceiros = clientes.filter((c: any) =>
        subparceiros.some((sp: any) => sp.id === c.parceiroId)
      );

      // Comissões por serviço para este modelo
      const comissoesPorServico = comissoes
        .filter((c: any) => c.modeloParceriaId === parceiro.modeloParceriaId && c.ativo)
        .map((c: any) => {
          const servico = servicos.find((s: any) => s.id === c.servicoId);
          return {
            servicoId: c.servicoId,
            servicoNome: servico?.nome || `Serviço #${c.servicoId}`,
            percentual: Number(c.percentualComissao),
          };
        });

      // Total de faturamento dos clientes vinculados
      const totalFaturamento = clientesVinculados.reduce((sum: number, c: any) =>
        sum + Number(c.faturamentoMedioMensal || 0), 0
      );

      // Total de faturamento incluindo subparceiros
      const totalFaturamentoComSub = totalFaturamento + clientesSubparceiros.reduce((sum: number, c: any) =>
        sum + Number(c.faturamentoMedioMensal || 0), 0
      );

      return {
        ...parceiro,
        modeloNome: modelo?.nome || '-',
        modeloCor: modelo?.nome === 'Diamante' ? '#60A5FA' : modelo?.nome === 'Ouro' ? '#F59E0B' : '#94A3B8',
        executivoNome: executivo ? executivo.nome : '-',
        parceiroPaiNome: parceiroPai ? (parceiroPai.apelido || parceiroPai.nomeCompleto) : null,
        clientesVinculados,
        subparceiros,
        clientesSubparceiros,
        comissoesPorServico,
        totalFaturamento,
        totalFaturamentoComSub,
        totalClientes: clientesVinculados.length,
        totalClientesComSub: clientesVinculados.length + clientesSubparceiros.length,
      };
    }).sort((a: any, b: any) => b.totalFaturamentoComSub - a.totalFaturamentoComSub);
  }, [parceiros, clientes, servicos, modelos, comissoes, executivos, filterModelo, filterExecutivo, filterTipo]);

  // Summary stats
  const stats = useMemo(() => {
    const totalParceiros = relatorio.filter((r: any) => !r.ehSubparceiro).length;
    const totalSubparceiros = relatorio.filter((r: any) => r.ehSubparceiro).length;
    const totalClientes = relatorio.reduce((sum: number, r: any) => sum + r.totalClientes, 0);
    const totalFaturamento = relatorio.reduce((sum: number, r: any) => sum + r.totalFaturamento, 0);
    return { totalParceiros, totalSubparceiros, totalClientes, totalFaturamento };
  }, [relatorio]);

  const isLoading = loadingParceiros;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatório de Comissões</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão consolidada das empresas vinculadas a cada parceiro/subparceiro com comissões por serviço.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalParceiros}</p>
              <p className="text-xs text-muted-foreground">Parceiros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalSubparceiros}</p>
              <p className="text-xs text-muted-foreground">Subparceiros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalClientes}</p>
              <p className="text-xs text-muted-foreground">Clientes Vinculados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-lg font-bold">{formatCurrency(stats.totalFaturamento)}</p>
              <p className="text-xs text-muted-foreground">Faturamento Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        <Select value={filterModelo} onValueChange={setFilterModelo}>
          <SelectTrigger className="w-[180px]">
            <Gem className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Modelos</SelectItem>
            {modelos.map((m: any) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterExecutivo} onValueChange={setFilterExecutivo}>
          <SelectTrigger className="w-[200px]">
            <Briefcase className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Executivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Executivos</SelectItem>
            {executivos.filter((e: any) => e.ativo).map((e: any) => (
              <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <Users className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="parceiro">Apenas Parceiros</SelectItem>
            <SelectItem value="subparceiro">Apenas Subparceiros</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {relatorio.length} resultado(s)
        </span>
      </div>

      {/* Report Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : relatorio.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum parceiro encontrado com os filtros selecionados.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {relatorio.map((item: any) => {
            const isExpanded = expandedParceiros.has(item.id);
            return (
              <Card key={item.id} className="overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{item.apelido || item.nomeCompleto}</span>
                      {item.ehSubparceiro && (
                        <Badge variant="outline" className="text-[10px]">
                          Sub de {item.parceiroPaiNome}
                        </Badge>
                      )}
                      <Badge
                        className="text-[10px]"
                        style={{
                          backgroundColor: `${item.modeloCor}20`,
                          color: item.modeloCor,
                          borderColor: `${item.modeloCor}40`,
                        }}
                      >
                        {item.modeloNome}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Executivo: <strong>{item.executivoNome}</strong></span>
                      <span>Clientes: <strong>{item.totalClientes}</strong></span>
                      {!item.ehSubparceiro && item.subparceiros.length > 0 && (
                        <span>Subparceiros: <strong>{item.subparceiros.length}</strong> ({item.totalClientesComSub} clientes total)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(item.totalFaturamento)}</p>
                    <p className="text-[10px] text-muted-foreground">Faturamento clientes diretos</p>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t">
                    {/* Comissões por Serviço */}
                    {item.comissoesPorServico.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Comissões por Serviço ({item.modeloNome})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {item.comissoesPorServico.map((cs: any) => (
                            <div key={cs.servicoId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                              <span className="truncate">{cs.servicoNome}</span>
                              <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{cs.percentual}%</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Clientes Vinculados */}
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" /> Clientes Vinculados ({item.clientesVinculados.length})
                      </h4>
                      {item.clientesVinculados.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum cliente vinculado diretamente.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Empresa</TableHead>
                              <TableHead className="text-xs">CNPJ/CPF</TableHead>
                              <TableHead className="text-xs">Regime</TableHead>
                              <TableHead className="text-xs text-right">Faturamento Médio</TableHead>
                              <TableHead className="text-xs text-right">Valor Guias</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.clientesVinculados.map((c: any) => (
                              <TableRow key={c.id}>
                                <TableCell className="text-xs font-medium">{c.razaoSocial || c.nomeFantasia || '-'}</TableCell>
                                <TableCell className="text-xs">{c.cnpj || c.cpf || '-'}</TableCell>
                                <TableCell className="text-xs">{c.regimeTributario || '-'}</TableCell>
                                <TableCell className="text-xs text-right">{formatCurrency(c.faturamentoMedioMensal)}</TableCell>
                                <TableCell className="text-xs text-right">{formatCurrency(c.valorMedioGuias)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    {/* Subparceiros e seus clientes */}
                    {!item.ehSubparceiro && item.subparceiros.length > 0 && (
                      <>
                        <Separator />
                        <div className="p-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> Subparceiros ({item.subparceiros.length})
                          </h4>
                          <div className="space-y-3">
                            {item.subparceiros.map((sp: any) => {
                              const spClientes = clientes.filter((c: any) => c.parceiroId === sp.id);
                              const spFaturamento = spClientes.reduce((sum: number, c: any) => sum + Number(c.faturamentoMedioMensal || 0), 0);
                              return (
                                <div key={sp.id} className="p-3 rounded-lg border bg-muted/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold">{sp.apelido || sp.nomeCompleto}</span>
                                      <Badge variant="outline" className="text-[10px]">{spClientes.length} clientes</Badge>
                                    </div>
                                    <span className="text-xs font-medium">{formatCurrency(spFaturamento)}</span>
                                  </div>
                                  {spClientes.length > 0 && (
                                    <div className="space-y-1">
                                      {spClientes.map((c: any) => (
                                        <div key={c.id} className="flex items-center justify-between text-[11px] text-muted-foreground pl-3">
                                          <span>{c.razaoSocial || c.nomeFantasia || '-'}</span>
                                          <span>{formatCurrency(c.faturamentoMedioMensal)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
