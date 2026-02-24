import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, Search, ClipboardList } from 'lucide-react';

const ACAO_MAP: Record<string, { label: string; color: string }> = {
  emprestimo: { label: 'Empréstimo', color: 'bg-blue-500/20 text-blue-400' },
  devolucao: { label: 'Devolução', color: 'bg-emerald-500/20 text-emerald-400' },
  renovacao: { label: 'Renovação', color: 'bg-amber-500/20 text-amber-400' },
  reserva: { label: 'Reserva', color: 'bg-purple-500/20 text-purple-400' },
  cancelamento: { label: 'Cancelamento', color: 'bg-red-500/20 text-red-400' },
  cadastro: { label: 'Cadastro', color: 'bg-cyan-500/20 text-cyan-400' },
  edicao: { label: 'Edição', color: 'bg-orange-500/20 text-orange-400' },
  exclusao: { label: 'Exclusão', color: 'bg-red-500/20 text-red-400' },
  ocorrencia: { label: 'Ocorrência', color: 'bg-orange-500/20 text-orange-400' },
  outro: { label: 'Outro', color: 'bg-gray-500/20 text-gray-400' },
};

export default function BibliotecaAuditoria() {
  const [search, setSearch] = useState('');
  const [filterAcao, setFilterAcao] = useState('all');

  const auditoria = trpc.biblioteca.auditoria.list.useQuery({ limit: 200 });

  const filtered = useMemo(() => {
    if (!auditoria.data) return [];
    return auditoria.data.filter((a: any) => {
      const matchSearch = !search || [a.usuarioNome, a.descricao, a.entidade].some(f => f?.toLowerCase().includes(search.toLowerCase()));
      const matchAcao = filterAcao === 'all' || a.acao === filterAcao;
      return matchSearch && matchAcao;
    });
  }, [auditoria.data, search, filterAcao]);

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    const dt = new Date(d);
    return `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="min-h-screen bg-[#0A1929]">
      <div className="border-b border-white/10 bg-[#0A1929]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/rh/biblioteca">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-teal-400" /> Auditoria</h1>
            <p className="text-sm text-white/50">Registro de todas as ações realizadas na biblioteca</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input placeholder="Buscar por usuário, descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <Select value={filterAcao} onValueChange={setFilterAcao}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Ação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Ações</SelectItem>
              {Object.entries(ACAO_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Data/Hora</TableHead>
                  <TableHead className="text-white/60">Usuário</TableHead>
                  <TableHead className="text-white/60">Ação</TableHead>
                  <TableHead className="text-white/60">Entidade</TableHead>
                  <TableHead className="text-white/60">Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditoria.isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-white/30 py-10">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-white/30 py-10">Nenhum registro de auditoria</TableCell></TableRow>
                ) : filtered.map((a: any) => {
                  const ac = ACAO_MAP[a.acao] || { label: a.acao, color: 'bg-gray-500/20 text-gray-400' };
                  return (
                    <TableRow key={a.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-white/50 text-xs whitespace-nowrap">{formatDate(a.createdAt)}</TableCell>
                      <TableCell className="text-white font-medium">{a.usuarioNome || '-'}</TableCell>
                      <TableCell><Badge className={ac.color}>{ac.label}</Badge></TableCell>
                      <TableCell className="text-white/60 capitalize">{a.entidade || '-'}</TableCell>
                      <TableCell className="text-white/70 max-w-[400px] truncate">{a.descricao}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
