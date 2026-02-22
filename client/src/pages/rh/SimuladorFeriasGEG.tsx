import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Users, User, DollarSign, CalendarDays, Trash2, Plus, Info } from 'lucide-react';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcFeriasValue(salarioBase: number, dias: number, abono: boolean) {
  const salDiario = salarioBase / 30;
  const valorFerias = salDiario * dias;
  const tercoConstitucional = valorFerias / 3;
  const abonoValue = abono ? (salDiario * 10) + (salDiario * 10 / 3) : 0;

  // Deductions
  const baseINSS = valorFerias + tercoConstitucional;
  let inss = 0;
  if (baseINSS <= 1518.00) inss = baseINSS * 0.075;
  else if (baseINSS <= 2793.88) inss = 1518 * 0.075 + (baseINSS - 1518) * 0.09;
  else if (baseINSS <= 4190.83) inss = 1518 * 0.075 + (2793.88 - 1518) * 0.09 + (baseINSS - 2793.88) * 0.12;
  else inss = 1518 * 0.075 + (2793.88 - 1518) * 0.09 + (4190.83 - 2793.88) * 0.12 + (Math.min(baseINSS, 8157.41) - 4190.83) * 0.14;

  const baseIR = baseINSS - inss;
  let irrf = 0;
  if (baseIR <= 2259.20) irrf = 0;
  else if (baseIR <= 2826.65) irrf = baseIR * 0.075 - 169.44;
  else if (baseIR <= 3751.05) irrf = baseIR * 0.15 - 381.44;
  else if (baseIR <= 4664.68) irrf = baseIR * 0.225 - 662.77;
  else irrf = baseIR * 0.275 - 896.00;
  if (irrf < 0) irrf = 0;

  const totalBruto = valorFerias + tercoConstitucional + abonoValue;
  const totalDescontos = inss + irrf;
  const totalLiquido = totalBruto - totalDescontos;

  return {
    salarioBase, dias, salDiario,
    valorFerias, tercoConstitucional, abonoValue,
    inss, irrf,
    totalBruto, totalDescontos, totalLiquido,
  };
}

interface SimItem {
  id: number;
  colaboradorId: number | null;
  nome: string;
  salarioBase: number;
  dias: number;
  abono: boolean;
}

export default function SimuladorFeriasGEG() {
  const [modo, setModo] = useState<'individual' | 'coletiva'>('individual');
  const colaboradores = trpc.colaboradores.list.useQuery();
  const colabList = (colaboradores.data || []) as any[];
  const ativos = useMemo(() => colabList.filter(c => c.statusColaborador !== 'desligado' && c.ativo !== false), [colabList]);

  // Individual
  const [indColab, setIndColab] = useState<number | null>(null);
  const [indDias, setIndDias] = useState(30);
  const [indAbono, setIndAbono] = useState(false);

  const selectedColab = ativos.find(c => c.id === indColab);
  const indResult = selectedColab ? calcFeriasValue(parseFloat(selectedColab.salarioBase || '0'), indDias, indAbono) : null;

  // Coletiva
  const [colItems, setColItems] = useState<SimItem[]>([]);
  const [colDias, setColDias] = useState(30);
  const [colAbono, setColAbono] = useState(false);
  let nextId = colItems.length > 0 ? Math.max(...colItems.map(i => i.id)) + 1 : 1;

  const addColaboradorColetiva = (colabId: number) => {
    const c = ativos.find(x => x.id === colabId);
    if (!c || colItems.some(i => i.colaboradorId === colabId)) return;
    setColItems(prev => [...prev, {
      id: nextId++,
      colaboradorId: colabId,
      nome: c.nomeCompleto,
      salarioBase: parseFloat(c.salarioBase || '0'),
      dias: colDias,
      abono: colAbono,
    }]);
  };

  const addTodos = () => {
    const novos = ativos.filter(c => !colItems.some(i => i.colaboradorId === c.id)).map((c, idx) => ({
      id: nextId + idx,
      colaboradorId: c.id,
      nome: c.nomeCompleto,
      salarioBase: parseFloat(c.salarioBase || '0'),
      dias: colDias,
      abono: colAbono,
    }));
    setColItems(prev => [...prev, ...novos]);
  };

  const removeItem = (id: number) => setColItems(prev => prev.filter(i => i.id !== id));

  const colResults = colItems.map(item => ({
    ...item,
    calc: calcFeriasValue(item.salarioBase, item.dias, item.abono),
  }));

  const colTotal = colResults.reduce((acc, r) => ({
    totalBruto: acc.totalBruto + r.calc.totalBruto,
    totalDescontos: acc.totalDescontos + r.calc.totalDescontos,
    totalLiquido: acc.totalLiquido + r.calc.totalLiquido,
  }), { totalBruto: 0, totalDescontos: 0, totalLiquido: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-7 h-7 text-blue-600" /> Simulador Financeiro de Férias
          </h1>
          <p className="text-muted-foreground">Simule o valor a pagar de férias individuais ou coletivas</p>
        </div>
        <div className="flex gap-2">
          <Button variant={modo === 'individual' ? 'default' : 'outline'} onClick={() => setModo('individual')}>
            <User className="w-4 h-4 mr-2" /> Individual
          </Button>
          <Button variant={modo === 'coletiva' ? 'default' : 'outline'} onClick={() => setModo('coletiva')}>
            <Users className="w-4 h-4 mr-2" /> Coletiva
          </Button>
        </div>
      </div>

      {modo === 'individual' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Input panel */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Parâmetros da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Colaborador</Label>
                <Select value={indColab ? String(indColab) : ''} onValueChange={v => setIndColab(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger>
                  <SelectContent>
                    {ativos.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto} — {c.cargo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedColab && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                  <p><strong>Salário Base:</strong> {formatCurrency(parseFloat(selectedColab.salarioBase || '0'))}</p>
                  <p><strong>Cargo:</strong> {selectedColab.cargo}</p>
                  <p><strong>Admissão:</strong> {selectedColab.dataAdmissao}</p>
                </div>
              )}
              <div>
                <Label>Dias de Férias</Label>
                <Select value={String(indDias)} onValueChange={v => setIndDias(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="20">20 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="14">14 dias (mínimo 1º período)</SelectItem>
                    <SelectItem value="10">10 dias</SelectItem>
                    <SelectItem value="5">5 dias (mínimo 2º/3º período)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={indAbono} onChange={e => setIndAbono(e.target.checked)} className="rounded" />
                <span className="text-sm">Abono pecuniário (vender 10 dias)</span>
              </label>
            </CardContent>
          </Card>

          {/* Result panel */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Resultado da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!indResult ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione um colaborador para simular</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                      <p className="text-xs text-muted-foreground">Total Bruto</p>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(indResult.totalBruto)}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                      <p className="text-xs text-muted-foreground">Descontos</p>
                      <p className="text-xl font-bold text-red-700">{formatCurrency(indResult.totalDescontos)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                      <p className="text-xs text-muted-foreground">Total Líquido</p>
                      <p className="text-xl font-bold text-blue-700">{formatCurrency(indResult.totalLiquido)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Proventos</h4>
                    <div className="flex justify-between p-3 bg-muted/30 rounded">
                      <span className="text-sm">Férias ({indResult.dias} dias × {formatCurrency(indResult.salDiario)}/dia)</span>
                      <span className="font-medium">{formatCurrency(indResult.valorFerias)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded">
                      <span className="text-sm">1/3 Constitucional</span>
                      <span className="font-medium">{formatCurrency(indResult.tercoConstitucional)}</span>
                    </div>
                    {indResult.abonoValue > 0 && (
                      <div className="flex justify-between p-3 bg-muted/30 rounded">
                        <span className="text-sm">Abono Pecuniário (10 dias + 1/3)</span>
                        <span className="font-medium">{formatCurrency(indResult.abonoValue)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Descontos</h4>
                    <div className="flex justify-between p-3 bg-muted/30 rounded">
                      <span className="text-sm">INSS</span>
                      <span className="font-medium text-red-600">- {formatCurrency(indResult.inss)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded">
                      <span className="text-sm">IRRF</span>
                      <span className="font-medium text-red-600">- {formatCurrency(indResult.irrf)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Valor Líquido a Pagar</span>
                      <span className="text-2xl font-bold text-blue-700">{formatCurrency(indResult.totalLiquido)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded border border-amber-200">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Simulação baseada nas tabelas INSS e IRRF vigentes. Valores podem variar conforme dependentes de IR, outros descontos e convenções coletivas.
                      O pagamento deve ser efetuado até 2 dias antes do início das férias (Art. 145 CLT).
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {modo === 'coletiva' && (
        <div className="space-y-4">
          {/* Config bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label>Adicionar Colaborador</Label>
                  <Select onValueChange={v => addColaboradorColetiva(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar colaborador para adicionar" /></SelectTrigger>
                    <SelectContent>
                      {ativos.filter(c => !colItems.some(i => i.colaboradorId === c.id)).map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nomeCompleto} — {formatCurrency(parseFloat(c.salarioBase || '0'))}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-36">
                  <Label>Dias Padrão</Label>
                  <Select value={String(colDias)} onValueChange={v => setColDias(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="20">20 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="14">14 dias</SelectItem>
                      <SelectItem value="10">10 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={colAbono} onChange={e => setColAbono(e.target.checked)} className="rounded" />
                  <span className="text-sm whitespace-nowrap">Abono</span>
                </label>
                <Button variant="outline" onClick={addTodos}>
                  <Plus className="w-4 h-4 mr-1" /> Todos
                </Button>
                {colItems.length > 0 && (
                  <Button variant="outline" className="text-red-600" onClick={() => setColItems([])}>
                    <Trash2 className="w-4 h-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {colItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Adicione colaboradores para simular férias coletivas</p>
                <p className="text-xs mt-1">Use "Todos" para adicionar todos os colaboradores ativos</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-semibold">Colaborador</th>
                          <th className="text-right p-3 font-semibold">Salário</th>
                          <th className="text-center p-3 font-semibold">Dias</th>
                          <th className="text-center p-3 font-semibold">Abono</th>
                          <th className="text-right p-3 font-semibold">Bruto</th>
                          <th className="text-right p-3 font-semibold">INSS</th>
                          <th className="text-right p-3 font-semibold">IRRF</th>
                          <th className="text-right p-3 font-semibold">Líquido</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {colResults.map(r => (
                          <tr key={r.id} className="border-b hover:bg-muted/20">
                            <td className="p-3 font-medium">{r.nome}</td>
                            <td className="text-right p-3">{formatCurrency(r.salarioBase)}</td>
                            <td className="text-center p-3">
                              <Select value={String(r.dias)} onValueChange={v => setColItems(prev => prev.map(i => i.id === r.id ? { ...i, dias: Number(v) } : i))}>
                                <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="30">30</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="15">15</SelectItem>
                                  <SelectItem value="14">14</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="5">5</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="text-center p-3">
                              <input type="checkbox" checked={r.abono} onChange={e => setColItems(prev => prev.map(i => i.id === r.id ? { ...i, abono: e.target.checked } : i))} className="rounded" />
                            </td>
                            <td className="text-right p-3">{formatCurrency(r.calc.totalBruto)}</td>
                            <td className="text-right p-3 text-red-600">{formatCurrency(r.calc.inss)}</td>
                            <td className="text-right p-3 text-red-600">{formatCurrency(r.calc.irrf)}</td>
                            <td className="text-right p-3 font-semibold">{formatCurrency(r.calc.totalLiquido)}</td>
                            <td className="p-3">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removeItem(r.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 bg-muted/30 font-bold">
                          <td className="p-3" colSpan={2}>Total ({colResults.length} colaboradores)</td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="text-right p-3">{formatCurrency(colTotal.totalBruto)}</td>
                          <td className="text-right p-3 text-red-600">{formatCurrency(colTotal.totalDescontos)}</td>
                          <td className="p-3"></td>
                          <td className="text-right p-3 text-blue-700">{formatCurrency(colTotal.totalLiquido)}</td>
                          <td className="p-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Total Bruto</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(colTotal.totalBruto)}</p>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Total Descontos</p>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(colTotal.totalDescontos)}</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Total Líquido a Pagar</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(colTotal.totalLiquido)}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Férias Coletivas — Regras CLT</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Férias coletivas podem ser concedidas em até 2 períodos anuais, nenhum inferior a 10 dias (Art. 139 CLT).
                    O empregador deve comunicar ao órgão local do MTE com antecedência mínima de 15 dias.
                    Colaboradores com menos de 12 meses gozam férias proporcionais, iniciando novo período aquisitivo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
