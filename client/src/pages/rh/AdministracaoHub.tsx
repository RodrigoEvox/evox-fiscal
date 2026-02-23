import GegHubPage from './GegHubPage';

const ITEMS = [
  { key: 'cargos-salarios', label: 'Cargos e Salários', rota: '/rh/cargos-salarios' },
  { key: 'apontamentos-folha', label: 'Apontamentos da Folha', rota: '/rh/apontamentos-folha' },
  { key: 'rescisao', label: 'Rescisão', rota: '/rh/rescisao' },
  { key: 'comissao-rh', label: 'Comissões e Prêmios', rota: '/rh/comissao-rh' },
  { key: 'projecao-financeira', label: 'Projeção Financeira', rota: '/rh/projecao-financeira' },
  { key: 'relatorios-rh', label: 'Visão Analítica', rota: '/rh/relatorios' },
  { key: 'bi-indicadores', label: 'BI — Indicadores de RH', rota: '/rh/bi' },
  { key: 'cct', label: 'Convenção Coletiva (CCT)', rota: '/rh/cct' },
];

export default function AdministracaoHub() {
  return <GegHubPage title="Administração" grupo="Administração" items={ITEMS} backRoute="/rh/geg" />;
}
