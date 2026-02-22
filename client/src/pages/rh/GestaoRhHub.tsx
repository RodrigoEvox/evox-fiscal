import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'colaboradores', label: 'Colaboradores', rota: '/rh/colaboradores' },
  { key: 'onboarding', label: 'Onboarding', rota: '/rh/onboarding' },
  { key: 'banco-horas', label: 'Banco de Horas', rota: '/rh/banco-horas' },
  { key: 'atestados-licencas', label: 'Atestados e Licenças', rota: '/rh/atestados-licencas' },
  { key: 'ferias', label: 'Férias e Folgas', rota: '/rh/ferias' },
  { key: 'reajustes', label: 'Reajustes Salariais', rota: '/rh/reajustes' },
  { key: 'aniversariantes', label: 'Aniversariantes', rota: '/rh/email-aniversariante' },
  { key: 'contratos-vencendo', label: 'Contratos Vencendo', rota: '/rh/workflow-renovacao' },
  { key: 'equipamentos', label: 'Equipamentos & Comunicações', rota: '/rh/equipamentos' },
  { key: 'senhas-autorizacoes', label: 'Senhas & Autorizações', rota: '/rh/senhas-autorizacoes' },
];

export default function GestaoRhHub() {
  return <GegHubPage title="Gestão RH" grupo="Gestão RH" items={ITEMS} />;
}
