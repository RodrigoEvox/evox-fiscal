import { Link } from 'wouter';
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileCheck, AlertTriangle, Clock, CheckCircle2, XCircle, RefreshCw,
  UserCheck, UserMinus, Briefcase, Play, Filter, ArrowLeft} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  resolvido: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const DECISAO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  renovar: { label: "Renovar Contrato", icon: RefreshCw, color: "text-blue-600" },
  desligar: { label: "Desligar Colaborador", icon: UserMinus, color: "text-red-600" },
  converter_clt: { label: "Converter para CLT", icon: UserCheck, color: "text-green-600" },
};

export default function WorkflowRenovacao() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [resolverDialog, setResolverDialog] = useState<any>(null);
  const [decisao, setDecisao] = useState("");
  const [observacao, setObservacao] = useState("");

  const { data: workflows, isLoading, refetch } = trpc.workflowRenovacao.list.useQuery(
    filtroStatus !== "todos" ? { status: filtroStatus } : {}
  );
  const { data: contratos } = trpc.contratosVencendo.list.useQuery({});

  const verificarMut = trpc.workflowRenovacao.verificar.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.criados} workflow(s) criado(s) de ${res.total} contrato(s) vencendo`);
      refetch();
    },
  });

  const resolverMut = trpc.workflowRenovacao.resolver.useMutation({
    onSuccess: () => {
      toast.success("Workflow resolvido com sucesso");
      setResolverDialog(null);
      setDecisao("");
      setObservacao("");
      refetch();
    },
  });

  const cancelarMut = trpc.workflowRenovacao.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Workflow cancelado");
      refetch();
    },
  });

  const criarMut = trpc.workflowRenovacao.criar.useMutation({
    onSuccess: (res) => {
      if (res.duplicado) {
        toast.info("Workflow já existe para este colaborador");
      } else {
        toast.success("Workflow e tarefa criados com sucesso");
      }
      refetch();
    },
  });

  const pendentes = (workflows as any[] || []).filter((w: any) => w.status === "pendente").length;
  const resolvidos = (workflows as any[] || []).filter((w: any) => w.status === "resolvido").length;

  
  const clearAllFilters = () => { setFiltroStatus("todos"); };
return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/dashboard"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-primary" />
            Workflow de Renovação de Contratos
          </h1>

              <p className="text-muted-foreground mt-1">
            Gerencie decisões sobre contratos de experiência próximos do vencimento
          </p>

            </div>

          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => verificarMut.mutate()}
            disabled={verificarMut.isPending}
          >
            <Play className="w-4 h-4 mr-2" />
            {verificarMut.isPending ? "Verificando..." : "Verificar Contratos"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Pendentes</p>
            <p className="text-2xl font-bold mt-1">{pendentes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Resolvidos</p>
            <p className="text-2xl font-bold mt-1">{resolvidos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Total Workflows</p>
            <p className="text-2xl font-bold mt-1">{(workflows as any[] || []).length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Contratos Vencendo</p>
            <p className="text-2xl font-bold mt-1">{(contratos as any[] || []).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contratos sem workflow */}
      {contratos && (contratos as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Contratos Vencendo sem Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(contratos as any[]).slice(0, 5).map((c: any) => {
                const hasWorkflow = (workflows as any[] || []).some((w: any) => w.colaboradorId === c.id && w.status === "pendente");
                if (hasWorkflow) return null;
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${c.diasRestantes <= 7 ? "bg-red-500" : c.diasRestantes <= 15 ? "bg-amber-500" : "bg-blue-500"}`} />
                      <div>
                        <p className="font-medium text-sm">{c.nomeCompleto}</p>
                        <p className="text-xs text-muted-foreground">{c.cargo} — Vence em {c.diasRestantes} dia(s)</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => criarMut.mutate({
                        colaboradorId: c.id,
                        colaboradorNome: c.nomeCompleto,
                        cargo: c.cargo || "N/A",
                        dataVencimento: c.dataVencimento,
                        diasRestantes: c.diasRestantes,
                      })}
                      disabled={criarMut.isPending}
                    >
                      Criar Workflow
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground"><XCircle className="w-4 h-4 mr-1" />Limpar Filtros</Button>
      </div>

      {/* Workflow List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (workflows as any[] || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum workflow encontrado</p>
            <p className="text-sm mt-1">Clique em "Verificar Contratos" para criar workflows automaticamente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(workflows as any[]).map((w: any) => (
            <Card key={w.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${w.diasRestantes <= 7 ? "bg-red-100 dark:bg-red-900/30" : w.diasRestantes <= 15 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                      <Briefcase className={`w-5 h-5 ${w.diasRestantes <= 7 ? "text-red-600" : w.diasRestantes <= 15 ? "text-amber-600" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{w.colaboradorNome}</p>
                      <p className="text-sm text-muted-foreground">{w.cargo}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Vence: {w.dataVencimento ? new Date(w.dataVencimento + "T12:00:00").toLocaleDateString("pt-BR") : "N/A"}
                        </span>
                        <span>{w.diasRestantes} dia(s) restante(s)</span>
                      </div>
                      {w.decisao && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs font-medium">Decisão:</span>
                          <Badge variant="outline" className="text-xs">
                            {DECISAO_LABELS[w.decisao]?.label || w.decisao}
                          </Badge>
                        </div>
                      )}
                      {w.observacao && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{w.observacao}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[w.status] || ""}>
                      {w.status === "pendente" ? "Pendente" : w.status === "resolvido" ? "Resolvido" : "Cancelado"}
                    </Badge>
                    {w.status === "pendente" && (
                      <>
                        <Button size="sm" onClick={() => setResolverDialog(w)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Resolver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => {
                            if (confirm("Cancelar este workflow?")) {
                              cancelarMut.mutate({ id: w.id });
                            }
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolver Dialog */}
      <Dialog open={!!resolverDialog} onOpenChange={() => setResolverDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Workflow — {resolverDialog?.colaboradorNome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p><strong>Cargo:</strong> {resolverDialog?.cargo}</p>
              <p><strong>Vencimento:</strong> {resolverDialog?.dataVencimento ? new Date(resolverDialog.dataVencimento + "T12:00:00").toLocaleDateString("pt-BR") : "N/A"}</p>
              <p><strong>Dias restantes:</strong> {resolverDialog?.diasRestantes}</p>
            </div>

            <div className="space-y-2">
              <Label>Decisão *</Label>
              <Select value={decisao} onValueChange={setDecisao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a decisão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renovar">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      Renovar Contrato
                    </span>
                  </SelectItem>
                  <SelectItem value="converter_clt">
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Converter para CLT Efetivo
                    </span>
                  </SelectItem>
                  <SelectItem value="desligar">
                    <span className="flex items-center gap-2">
                      <UserMinus className="w-4 h-4 text-red-600" />
                      Desligar Colaborador
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Justificativa ou observações sobre a decisão..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolverDialog(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!decisao) { toast.error("Selecione uma decisão"); return; }
                resolverMut.mutate({
                  id: resolverDialog.id,
                  decisao: decisao as any,
                  observacao,
                });
              }}
              disabled={resolverMut.isPending}
            >
              {resolverMut.isPending ? "Salvando..." : "Confirmar Decisão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
