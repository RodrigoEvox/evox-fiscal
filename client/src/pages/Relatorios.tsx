/*
 * Relatórios — Evox Fiscal
 * Histórico de análises com exportação para Excel e PDF
 */

import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet, FileText, BarChart3, Calendar, Target, Flag, CheckCircle, XCircle,
} from 'lucide-react';
import { exportarAnaliseExcel, exportarAnalisePDF } from '@/lib/export-utils';

export default function Relatorios() {
  const { state } = useApp();

  const relatorios = [...state.relatorios].sort(
    (a, b) => new Date(b.dataAnalise).getTime() - new Date(a.dataAnalise).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Histórico de análises tributárias realizadas</p>
      </div>

      {relatorios.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma análise realizada ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Execute uma análise na aba "Análise" para gerar relatórios</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {relatorios.map(report => (
            <Card key={report.id} className="transition-all hover:shadow-md">
              <CardContent className="py-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold">{report.clienteNome}</h3>
                      <Badge className={`text-[10px] ${
                        report.prioridade === 'alta' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' :
                        report.prioridade === 'media' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
                        'bg-red-500/10 text-red-700 border-red-200'
                      }`}>
                        {report.prioridade === 'alta' ? 'Alta' : report.prioridade === 'media' ? 'Média' : 'Baixa'}
                      </Badge>
                      {report.redFlags.length > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-0.5">
                          <Flag className="w-3 h-3" /> {report.redFlags.length}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.dataAnalise).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Score: <span className="font-bold font-data">{report.scoreOportunidade}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {report.tesesAplicaveis.length} aplicável(is)
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-gray-400" />
                        {report.tesesDescartadas.length} descartada(s)
                      </span>
                    </div>
                    {report.tesesAplicaveis.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Estimativa Total de Recuperação</p>
                        <p className="text-lg font-bold font-data text-emerald-600">
                          R$ {report.tesesAplicaveis.reduce((a, t) => a + t.estimativaRecuperacao, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportarAnaliseExcel(report)}>
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportarAnalisePDF(report)}>
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
