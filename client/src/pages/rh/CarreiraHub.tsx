import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'carreira-desenvolvimento', label: 'Carreira', rota: '/rh/carreira-desenvolvimento' },
  { key: 'metas', label: 'Metas', rota: '/rh/metas' },
  { key: 'avaliacao-desempenho', label: 'Avaliação 360', rota: '/rh/avaliacao-desempenho' },
  { key: 'pesquisa-clima', label: 'Pesquisa de Clima', rota: '/rh/pesquisa-clima' },
];

export default function CarreiraHub() {
  return <GegHubPage title="Carreira e Desenvolvimento" grupo="Carreira e Desenvolvimento" items={ITEMS} showAddNew addNewType="carreira" backRoute="/rh/geg" />;
}
