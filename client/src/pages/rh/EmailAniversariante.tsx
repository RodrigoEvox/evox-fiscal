import { Link } from 'wouter';
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Mail, Send, Settings, Cake, Users, CheckCircle2, Eye, ArrowLeft} from 'lucide-react';

export default function EmailAniversariante() {
  const [tab, setTab] = useState("config");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [assinatura, setAssinatura] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [previewNome, setPreviewNome] = useState("João");

  const { data: config, isLoading } = trpc.emailAniversariante.getConfig.useQuery();
  const { data: aniversariantes } = trpc.aniversariantes.mes.useQuery({});
  const { data: historico } = trpc.emailAniversariante.historico.useQuery({});

  const saveMut = trpc.emailAniversariante.saveConfig.useMutation({
    onSuccess: () => toast.success("Configuração salva com sucesso"),
  });

  const enviarMut = trpc.emailAniversariante.enviar.useMutation({
    onSuccess: (res) => toast.success(res.mensagem),
  });

  useEffect(() => {
    if (config) {
      setAssunto((config as any).assunto || "");
      setMensagem((config as any).mensagem || "");
      setAssinatura((config as any).assinatura || "");
      setAtivo((config as any).ativo ?? true);
    }
  }, [config]);

  const hoje = new Date();
  const diaHoje = String(hoje.getDate()).padStart(2, "0");
  const aniversariantesHoje = (aniversariantes as any[] || []).filter(
    (c: any) => c.dataNascimento?.substring(8, 10) === diaHoje
  );

  const jaEnviadosSet = new Set(historico as number[] || []);

  const previewMensagem = mensagem.replace(/{nome}/g, previewNome);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-6">

            <Link href="/rh/gestao-rh"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button></Link>

            <div>

              <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-7 h-7 text-primary" />
            E-mail de Aniversariantes
          </h1>

              <p className="text-muted-foreground mt-1">
            Configure e envie mensagens de parabéns automáticas para os colaboradores
          </p>

            </div>

          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={ativo} onCheckedChange={setAtivo} />
            <span className="text-sm">{ativo ? "Ativo" : "Inativo"}</span>
          </div>
          <Button
            onClick={() => enviarMut.mutate()}
            disabled={enviarMut.isPending || !ativo}
          >
            <Send className="w-4 h-4 mr-2" />
            {enviarMut.isPending ? "Enviando..." : "Enviar Hoje"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-pink-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Aniversariantes Hoje</p>
            <p className="text-2xl font-bold mt-1">{aniversariantesHoje.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Aniversariantes do Mês</p>
            <p className="text-2xl font-bold mt-1">{(aniversariantes as any[] || []).length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">E-mails Enviados (Ano)</p>
            <p className="text-2xl font-bold mt-1">{(historico as any[] || []).length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Status</p>
            <p className="text-2xl font-bold mt-1">
              <Badge variant={ativo ? "default" : "secondary"}>{ativo ? "Ativo" : "Inativo"}</Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="aniversariantes">
            <Cake className="w-4 h-4 mr-2" />
            Aniversariantes
          </TabsTrigger>
        </TabsList>

        {/* CONFIGURAÇÃO */}
        <TabsContent value="config" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template do E-mail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Assunto do E-mail</Label>
                <Input
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Feliz Aniversário!"
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem</Label>
                <p className="text-xs text-muted-foreground">Use {"{nome}"} para inserir o primeiro nome do colaborador</p>
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Olá {nome}, parabéns pelo seu aniversário..."
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Assinatura</Label>
                <Input
                  value={assinatura}
                  onChange={(e) => setAssinatura(e.target.value)}
                  placeholder="Com carinho, Equipe Evox"
                />
              </div>

              <Button
                onClick={() => saveMut.mutate({ assunto, mensagem, assinatura, ativo })}
                disabled={saveMut.isPending}
              >
                {saveMut.isPending ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREVIEW */}
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview do E-mail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Nome para preview</Label>
                <Input
                  value={previewNome}
                  onChange={(e) => setPreviewNome(e.target.value)}
                  className="max-w-xs mt-1"
                />
              </div>

              <div className="border rounded-lg p-6 bg-white dark:bg-zinc-900 max-w-lg">
                <div className="border-b pb-3 mb-4">
                  <p className="text-xs text-muted-foreground">Assunto:</p>
                  <p className="font-semibold">{assunto || "(sem assunto)"}</p>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {previewMensagem || "(sem mensagem)"}
                </div>
                <div className="border-t mt-4 pt-3 text-sm text-muted-foreground italic">
                  {assinatura || "(sem assinatura)"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANIVERSARIANTES */}
        <TabsContent value="aniversariantes" className="mt-4">
          <div className="space-y-4">
            {/* Hoje */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cake className="w-4 h-4 text-pink-500" />
                  Aniversariantes de Hoje ({hoje.toLocaleDateString("pt-BR")})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aniversariantesHoje.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhum aniversariante hoje</p>
                ) : (
                  <div className="space-y-2">
                    {aniversariantesHoje.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                            <Cake className="w-5 h-5 text-pink-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{c.nomeCompleto}</p>
                            <p className="text-xs text-muted-foreground">{c.cargo} — {c.setor}</p>
                          </div>
                        </div>
                        {jaEnviadosSet.has(c.id) ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mês */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Todos do Mês ({hoje.toLocaleDateString("pt-BR", { month: "long" })})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(aniversariantes as any[] || []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhum aniversariante este mês</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(aniversariantes as any[]).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{c.nomeCompleto}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.dataNascimento ? new Date(c.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : "—"}
                          </p>
                        </div>
                        {jaEnviadosSet.has(c.id) ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
