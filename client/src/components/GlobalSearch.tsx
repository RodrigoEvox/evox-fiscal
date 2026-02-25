import { useState, useRef, useEffect } from 'react';
import { Search, X, Users, FileText, Handshake, BookOpen, CheckSquare, User, Library } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = trpc.busca.global.useQuery(
    { termo: query },
    { enabled: query.length >= 2, staleTime: 5000 }
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const data = searchResults.data;
  const hasResults = data && (
    data.clientes.length > 0 || data.tarefas.length > 0 ||
    data.parceiros.length > 0 || data.teses.length > 0 ||
    data.usuarios.length > 0 || (data.livros && data.livros.length > 0)
  );

  const navigateTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
        isOpen ? 'border-blue-500/50 bg-white shadow-lg' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
      )}>
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar clientes, tarefas, teses, livros... (Ctrl+K)"
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-100 rounded border border-gray-200">
            Ctrl+K
          </kbd>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl z-50 max-h-[400px] overflow-y-auto">
          {searchResults.isLoading && (
            <div className="p-4 text-center text-sm text-gray-400">Buscando...</div>
          )}
          {!searchResults.isLoading && !hasResults && (
            <div className="p-4 text-center text-sm text-gray-400">Nenhum resultado encontrado</div>
          )}
          {hasResults && (
            <div className="py-1">
              {data!.clientes.length > 0 && (
                <ResultSection title="Clientes" icon={Users}>
                  {data!.clientes.map((c: any) => (
                    <ResultItem key={c.id} onClick={() => navigateTo(`/clientes/${c.id}`)}>
                      <span className="font-medium">{c.razaoSocial}</span>
                      <span className="text-gray-400 text-xs ml-2">{c.cnpj}</span>
                    </ResultItem>
                  ))}
                </ResultSection>
              )}
              {data!.tarefas.length > 0 && (
                <ResultSection title="Tarefas" icon={CheckSquare}>
                  {data!.tarefas.map((t: any) => (
                    <ResultItem key={t.id} onClick={() => navigateTo(`/tarefas/${t.id}`)}>
                      <span className="text-blue-600 font-mono text-xs mr-2">{t.codigo}</span>
                      <span className="font-medium">{t.titulo}</span>
                    </ResultItem>
                  ))}
                </ResultSection>
              )}
              {data!.parceiros.length > 0 && (
                <ResultSection title="Parceiros" icon={Handshake}>
                  {data!.parceiros.map((p: any) => (
                    <ResultItem key={p.id} onClick={() => navigateTo(`/parceiros`)}>
                      <span className="font-medium">{p.nomeCompleto}</span>
                    </ResultItem>
                  ))}
                </ResultSection>
              )}
              {data!.teses.length > 0 && (
                <ResultSection title="Teses" icon={BookOpen}>
                  {data!.teses.map((t: any) => (
                    <ResultItem key={t.id} onClick={() => navigateTo(`/teses`)}>
                      <span className="font-medium">{t.nome}</span>
                    </ResultItem>
                  ))}
                </ResultSection>
              )}
              {data!.usuarios.length > 0 && (
                <ResultSection title="Usuários" icon={User}>
                  {data!.usuarios.map((u: any) => (
                    <ResultItem key={u.id} onClick={() => navigateTo(`/usuarios`)}>
                      <span className="font-medium">{u.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{u.email}</span>
                    </ResultItem>
                  ))}
                </ResultSection>
              )}
              {data!.livros && data!.livros.length > 0 && (
                <ResultSection title="Biblioteca" icon={Library}>
                  {data!.livros.map((l: any) => (
                    <ResultItem key={l.id} onClick={() => navigateTo(`/rh/biblioteca`)}>
                      <span className="font-medium">{l.titulo}</span>
                      <span className="text-gray-400 text-xs ml-2">{l.autores}</span>
                      {l.categoria && <span className="text-blue-500 text-[10px] ml-2 px-1.5 py-0.5 bg-blue-50 rounded">{l.categoria}</span>}
                    </ResultItem>
                  ))}
                </ResultSection>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold bg-gray-50">
        <Icon className="w-3 h-3" />
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left"
    >
      {children}
    </button>
  );
}
