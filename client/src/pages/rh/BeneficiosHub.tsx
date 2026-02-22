import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'vale-transporte', label: 'Vale Transporte', rota: '/rh/vale-transporte' },
  { key: 'academia', label: 'Academia', rota: '/rh/academia' },
  { key: 'day-off', label: 'Day Off', rota: '/rh/day-off' },
];

export default function BeneficiosHub() {
  return <GegHubPage title="Benefícios" grupo="Benefícios" items={ITEMS} showAddNew addNewType="beneficio" />;
}
