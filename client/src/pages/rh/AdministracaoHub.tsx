import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'cargos-salarios', label: 'Custo Salarial', rota: '/rh/cargos-salarios' },
  { key: 'niveis-cargo', label: 'Cargos e Salários', rota: '/rh/niveis-cargo' },
  { key: 'apontamentos-folha', label: 'Apontamentos da Folha', rota: '/rh/apontamentos-folha' },
  { key: 'rescisao', label: 'Rescisão', rota: '/rh/rescisao' },
  { key: 'relatorios-rh', label: 'Visão Analítica', rota: '/rh/relatorios' },
];

export default function AdministracaoHub() {
  return <GegHubPage title="Administração" grupo="Administração" items={ITEMS} />;
}
