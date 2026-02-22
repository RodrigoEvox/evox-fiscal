import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'acoes-beneficios', label: 'Ação Fit', rota: '/rh/acoes-beneficios?tipo=fit' },
  { key: 'acao-solidaria', label: 'Ação Solidária', rota: '/rh/acoes-beneficios?tipo=solidaria' },
  { key: 'acao-engajamento', label: 'Ação de Engajamento', rota: '/rh/acoes-beneficios?tipo=engajamento' },
  { key: 'doacao-sangue', label: 'Doação de Sangue', rota: '/rh/doacao-sangue' },
];

export default function AcoesEvoxHub() {
  return <GegHubPage title="Ações Evox" grupo="Ações Evox" items={ITEMS} />;
}
