import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'niveis-cargo', label: 'Carreira', rota: '/rh/niveis-cargo' },
  { key: 'metas', label: 'Metas', rota: '/rh/metas' },
  { key: 'avaliacao-desempenho', label: 'Avaliação 360', rota: '/rh/avaliacao-desempenho' },
  { key: 'pesquisa-clima', label: 'Pesquisa de Clima', rota: '/rh/pesquisa-clima' },
];

export default function CarreiraHub() {
  return <GegHubPage title="Carreira e Desenvolvimento" grupo="Carreira e Desenvolvimento" items={ITEMS} showAddNew addNewType="carreira" />;
}
