import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'gestao-rh', label: 'Gestão RH', rota: '/rh/gestao-hub' },
  { key: 'acoes-hub', label: 'Ações Evox', rota: '/rh/acoes-hub' },
  { key: 'beneficios-hub', label: 'Benefícios', rota: '/rh/beneficios-hub' },
  { key: 'carreira-hub', label: 'Carreira e Desenvolvimento', rota: '/rh/carreira-hub' },
  { key: 'administracao-hub', label: 'Administração', rota: '/rh/administracao-hub' },
  { key: 'biblioteca-hub', label: 'Biblioteca Evox', rota: '/rh/biblioteca-hub' },
];

export default function GegHubPageWrapper() {
  return <GegHubPage title="Hub Gente & Gestão" grupo="Gestão RH" items={ITEMS} backRoute="/rh/dashboard" />;
}
