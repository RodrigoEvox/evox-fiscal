import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ChevronRight, Loader2, Search, DollarSign, Building2,
  AlertTriangle, TrendingUp, PiggyBank, Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreditoGestaoCreditos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);

  const { data: clientes, isLoading: loadingClientes } = trpc.clientes.list.useQuery();
  const { data: gestaoData, isLoading: loadingGestao } = trpc.creditRecovery.credito.clientes.gestaoCreditos.useQuery(
    { clienteId: selectedClienteId! },
    { enabled: !!selectedClienteId }
  );

  const filteredClientes = useMemo(() => {
    if (!clientes) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return (clientes as any[]).slice(0, 30);
    return (clientes as any[]).filter((c: any) =>
      c.razaoSocial?.toLowerCase().includes(term) ||
      c.cnpj?.includes(term) ||
      c.nomeFantasia?.toLowerCase().includes(term)
    ).slice(0, 30);
  }, [clientes, searchTerm]);

  const gd = gestaoData as any;
  const totals = gd?.totals || {};
  const ledger = gd?.ledger || [];
  const perdcomps = gd?.perdcomps || [];

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>Crédito Tributário</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Gestão de Créditos</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <DollarSign className="w-6 h-6" />
          Gestão de Créditos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe créditos apurados, validados, utilizados e disponíveis por cliente. As coordenadas detalhadas serão configuradas posteriormente.
        </p>
      </div>

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4" />
            Selecionar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por razão social, CNPJ ou nome fantasia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {loadingClientes ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto border rounded-lg divide-y">
              {filteredClientes.map((c: any) => (
                <div
                  key={c.id}
                  className={cn(
                    'p-2.5 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between',
                    selectedClienteId === c.id && 'bg-primary/5 border-l-4 border-l-primary'
                  )}
                  onClick={() => setSelectedClienteId(c.id)}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{c.razaoSocial}</p>
                    <span className="text-xs text-muted-foreground">{c.cnpj}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestão Data */}
      {selectedClienteId && (
        <>
          {loadingGestao ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Estimado', value: formatCurrency(totals.totalEstimado), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Validado', value: formatCurrency(totals.totalValidado), icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
                  { label: 'Protocolado', value: formatCurrency(totals.totalProtocolado), icon: Banknote, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Efetivado', value: formatCurrency(totals.totalEfetivado), icon: PiggyBank, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Saldo Residual', value: formatCurrency(totals.saldoResidual), icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
                ].map(kpi => (
                  <Card key={kpi.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', kpi.color)}>
                          <kpi.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                          <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Prescricao Alert */}
              {gd?.prescricaoRisk > 0 && (
                <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Alerta de Prescrição</p>
                    <p className="text-xs mt-0.5">
                      {gd.prescricaoRisk} crédito(s) com mais de 4,5 anos e saldo residual positivo. Risco de prescrição iminente.
                    </p>
                  </div>
                </div>
              )}

              {/* Ledger */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ledger de Créditos ({ledger.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {ledger.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">Nenhum crédito registrado.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                            <th className="px-3 py-2 text-left">Tese</th>
                            <th className="px-3 py-2 text-left">Grupo</th>
                            <th className="px-3 py-2 text-right">Estimado</th>
                            <th className="px-3 py-2 text-right">Validado</th>
                            <th className="px-3 py-2 text-right">Efetivado</th>
                            <th className="px-3 py-2 text-right">Saldo</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {ledger.map((l: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/30">
                              <td className="px-3 py-2 font-medium">{l.teseNome || '—'}</td>
                              <td className="px-3 py-2">{l.grupoSigla || '—'}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(l.valorEstimado)}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(l.valorValidado)}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(l.valorEfetivado)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(l.saldoResidual)}</td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className="text-[10px]">{l.status || '—'}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PerdComps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">PerdComps ({perdcomps.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {perdcomps.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma PerdComp registrada.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 text-muted-foreground uppercase tracking-wider">
                            <th className="px-3 py-2 text-left">Número</th>
                            <th className="px-3 py-2 text-left">Tipo</th>
                            <th className="px-3 py-2 text-right">Valor</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {perdcomps.map((p: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/30">
                              <td className="px-3 py-2 font-mono">{p.numero || '—'}</td>
                              <td className="px-3 py-2">{p.tipo || '—'}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(p.valor)}</td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className="text-[10px]">{p.status || '—'}</Badge>
                              </td>
                              <td className="px-3 py-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
