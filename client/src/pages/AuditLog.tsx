import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  History, Search, FileText, User, Clock,
  Plus, Edit, Trash2, Upload, Eye, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const acaoIcons: Record<string, any> = {
  criar: Plus,
  editar: Edit,
  excluir: Trash2,
  upload: Upload,
  visualizar: Eye,
  download: Download,
};

const acaoColors: Record<string, string> = {
  criar: 'bg-green-100 text-green-700',
  editar: 'bg-blue-100 text-blue-700',
  excluir: 'bg-red-100 text-red-700',
  upload: 'bg-purple-100 text-purple-700',
  visualizar: 'bg-gray-100 text-gray-700',
  download: 'bg-amber-100 text-amber-700',
};

export default function AuditLog() {
  const [filterEntidade, setFilterEntidade] = useState<string>('all');
  const [search, setSearch] = useState('');

  const auditLog = trpc.audit.list.useQuery({ limit: 200 });

  const filtered = (auditLog.data || []).filter((log: any) => {
    if (filterEntidade !== 'all' && log.entidadeTipo !== filterEntidade) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!log.entidadeNome?.toLowerCase().includes(s) && !log.usuarioNome?.toLowerCase().includes(s) && !log.acao?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Rastreabilidade completa de todas as ações no sistema</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, ação ou usuário..." className="pl-9" />
        </div>
        <Select value={filterEntidade} onValueChange={setFilterEntidade}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Entidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="tarefa">Tarefa</SelectItem>
            <SelectItem value="parceiro">Parceiro</SelectItem>
            <SelectItem value="tese">Tese</SelectItem>
            <SelectItem value="relatorio">Relatório</SelectItem>
            <SelectItem value="setor">Setor</SelectItem>
            <SelectItem value="usuario">Usuário</SelectItem>
            <SelectItem value="arquivo">Arquivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log entries */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((log: any) => {
              const Icon = acaoIcons[log.acao] || FileText;
              const colorClass = acaoColors[log.acao] || 'bg-gray-100 text-gray-700';
              return (
                <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.usuarioNome || 'Sistema'}</span>
                      {' '}
                      <span className="text-muted-foreground">{log.acao}</span>
                      {' '}
                      <Badge variant="secondary" className="text-[10px] mx-1">{log.entidadeTipo}</Badge>
                      {' '}
                      <span className="font-medium">{log.entidadeNome || `#${log.entidadeId}`}</span>
                    </p>
                    {log.detalhes && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.detalhes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
