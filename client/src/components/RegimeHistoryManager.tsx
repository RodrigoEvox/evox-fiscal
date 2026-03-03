import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export interface RegimeHistory {
  id?: string;
  regimeTributario: 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
}

interface RegimeHistoryManagerProps {
  currentRegime: string;
  history: RegimeHistory[];
  onHistoryChange: (history: RegimeHistory[]) => void;
  maxMonths?: number; // Default: 60 months
}

const REGIME_LABELS: Record<string, string> = {
  'simples_nacional': 'Simples Nacional',
  'lucro_presumido': 'Lucro Presumido',
  'lucro_real': 'Lucro Real',
};

/**
 * Component to manage historical tax regime changes over the past 60 months
 * Allows adding, editing, and deleting regime history entries
 */
export function RegimeHistoryManager({
  currentRegime,
  history,
  onHistoryChange,
  maxMonths = 60,
}: RegimeHistoryManagerProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEntry, setNewEntry] = useState<RegimeHistory>({
    regimeTributario: 'simples_nacional',
    dataInicio: '',
    dataFim: '',
  });

  const handleAddRegime = () => {
    if (!newEntry.dataInicio || !newEntry.dataFim) {
      return;
    }

    const entry: RegimeHistory = {
      id: `regime-${Date.now()}`,
      ...newEntry,
    };

    onHistoryChange([...history, entry]);
    setNewEntry({
      regimeTributario: 'simples_nacional',
      dataInicio: '',
      dataFim: '',
    });
    setIsAddingNew(false);
  };

  const handleRemoveRegime = (id: string | undefined) => {
    if (!id) return;
    onHistoryChange(history.filter(h => h.id !== id));
  };

  const calculateMonthsDifference = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  };

  const isWithinMaxMonths = (start: string, end: string): boolean => {
    const months = calculateMonthsDifference(start, end);
    return months <= maxMonths;
  };

  const hasOverlaps = (): boolean => {
    for (let i = 0; i < history.length; i++) {
      for (let j = i + 1; j < history.length; j++) {
        const h1 = history[i];
        const h2 = history[j];
        // Check if date ranges overlap
        if (h1.dataInicio <= h2.dataFim && h2.dataInicio <= h1.dataFim) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold">Regime Tributário Atual *</Label>
        <Badge className="mt-2" variant="outline">
          {REGIME_LABELS[currentRegime] || 'Não selecionado'}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Histórico de Regimes (últimos 60 meses)</CardTitle>
              <CardDescription className="text-xs">
                Registre mudanças de regime tributário nos últimos 5 anos
              </CardDescription>
            </div>
            {!isAddingNew && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsAddingNew(true)}
                className="gap-1 h-8"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {hasOverlaps() && (
            <div className="p-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Detectado sobreposição de períodos. Verifique as datas.</span>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground">Nenhum regime anterior registrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs h-8">Regime</TableHead>
                  <TableHead className="text-xs h-8">Data Início</TableHead>
                  <TableHead className="text-xs h-8">Data Fim</TableHead>
                  <TableHead className="text-xs h-8 text-right">Meses</TableHead>
                  <TableHead className="text-xs h-8 w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id} className="text-xs">
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {REGIME_LABELS[entry.regimeTributario]}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.dataInicio}</TableCell>
                    <TableCell>{entry.dataFim}</TableCell>
                    <TableCell className="text-right">
                      {calculateMonthsDifference(entry.dataInicio, entry.dataFim)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRegime(entry.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {isAddingNew && (
            <div className="border rounded-md p-3 space-y-3 bg-muted/30">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Regime</Label>
                  <Select
                    value={newEntry.regimeTributario}
                    onValueChange={(v: any) => setNewEntry({ ...newEntry, regimeTributario: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                      <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="lucro_real">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Data Início</Label>
                  <Input
                    type="date"
                    value={newEntry.dataInicio}
                    onChange={(e) => setNewEntry({ ...newEntry, dataInicio: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Data Fim</Label>
                  <Input
                    type="date"
                    value={newEntry.dataFim}
                    onChange={(e) => setNewEntry({ ...newEntry, dataFim: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {newEntry.dataInicio && newEntry.dataFim && !isWithinMaxMonths(newEntry.dataInicio, newEntry.dataFim) && (
                <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>O período ultrapassa 60 meses. Registre apenas os últimos 5 anos.</span>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNew(false)}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddRegime}
                  disabled={!newEntry.dataInicio || !newEntry.dataFim}
                  className="h-8 text-xs"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
