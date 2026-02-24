import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'biblioteca-dashboard', label: 'Dashboard', rota: '/rh/biblioteca/dashboard' },
  { key: 'biblioteca-acervo', label: 'Acervo de Livros', rota: '/rh/biblioteca/acervo' },
  { key: 'biblioteca-exemplares', label: 'Exemplares e Patrimônio', rota: '/rh/biblioteca/exemplares' },
  { key: 'biblioteca-emprestimos', label: 'Empréstimos', rota: '/rh/biblioteca/emprestimos' },
  { key: 'biblioteca-reservas', label: 'Reservas', rota: '/rh/biblioteca/reservas' },
  { key: 'biblioteca-devolucoes', label: 'Devoluções e Ocorrências', rota: '/rh/biblioteca/devolucoes' },
  { key: 'biblioteca-fornecedores', label: 'Fornecedores e Doadores', rota: '/rh/biblioteca/fornecedores' },
  { key: 'biblioteca-politicas', label: 'Políticas e Regras', rota: '/rh/biblioteca/politicas' },
  { key: 'biblioteca-auditoria', label: 'Auditoria', rota: '/rh/biblioteca/auditoria' },
  { key: 'biblioteca-relatorios', label: 'Relatórios', rota: '/rh/biblioteca/relatorios' },
];

export default function BibliotecaHub() {
  return <GegHubPage title="Biblioteca Evox" grupo="Biblioteca" items={ITEMS} backRoute="/rh/geg" />;
}
