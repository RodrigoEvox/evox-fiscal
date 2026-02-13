// ============================================================
// Evox Fiscal — Global State Management (v2)
// ============================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type {
  Cliente, Tese, RelatorioAnalise, DashboardStats,
  Parceiro, Usuario, ItemFilaApuracao, NivelAcesso,
  Permissoes, HistoricoAlteracao,
} from '@/lib/types';
import { getPermissoes } from '@/lib/types';
import { tesesDatabase } from '@/lib/teses-database';
import { calcularRedFlags, verificarInformacoesFaltantes, gerarRelatorioAnalise } from '@/lib/rules-engine';
import { v4 as uuidv4 } from 'uuid';

// ---- STATUS CUSTOMIZÁVEIS ----
const DEFAULT_STATUS_LIST = ['a_fazer', 'fazendo', 'concluido'];

interface AppState {
  clientes: Cliente[];
  teses: Tese[];
  relatorios: RelatorioAnalise[];
  parceiros: Parceiro[];
  filaApuracao: ItemFilaApuracao[];
  usuarios: Usuario[];
  usuarioAtual: Usuario;
  statusApuracaoList: string[];
  clienteSelecionado: string | null;
}

type AppAction =
  | { type: 'ADD_CLIENTE'; payload: Omit<Cliente, 'id' | 'dataCadastro' | 'horaCadastro' | 'redFlags' | 'alertasInformacao' | 'prioridade' | 'usuarioCadastroId' | 'usuarioCadastroNome'> }
  | { type: 'UPDATE_CLIENTE'; payload: Cliente }
  | { type: 'DELETE_CLIENTE'; payload: string }
  | { type: 'SELECT_CLIENTE'; payload: string | null }
  | { type: 'ADD_TESE'; payload: Omit<Tese, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'versao'> }
  | { type: 'UPDATE_TESE'; payload: Tese }
  | { type: 'DELETE_TESE'; payload: string }
  | { type: 'GERAR_ANALISE'; payload: string }
  | { type: 'ADD_PARCEIRO'; payload: Omit<Parceiro, 'id' | 'dataCadastro'> }
  | { type: 'UPDATE_PARCEIRO'; payload: Parceiro }
  | { type: 'DELETE_PARCEIRO'; payload: string }
  | { type: 'INICIAR_APURACAO'; payload: { itemId: string } }
  | { type: 'CANCELAR_APURACAO'; payload: { itemId: string } }
  | { type: 'MUDAR_STATUS_APURACAO'; payload: { itemId: string; novoStatus: string } }
  | { type: 'REORDENAR_FILA'; payload: { itemId: string; novaOrdem: number } }
  | { type: 'SET_PRIORIDADE_FILA'; payload: { itemId: string; prioridade: 'alta' | 'media' | 'baixa' } }
  | { type: 'ADD_STATUS_APURACAO'; payload: string }
  | { type: 'SET_USUARIO'; payload: NivelAcesso }
  | { type: 'SET_STATE'; payload: AppState };

// ---- SAMPLE DATA ----
const sampleUsuarios: Usuario[] = [
  { id: 'usr-001', nome: 'Carlos Admin', email: 'carlos@evoxfiscal.com.br', nivelAcesso: 'administrador', ativo: true, dataCriacao: '2024-01-01' },
  { id: 'usr-002', nome: 'Ana Suporte', email: 'ana@evoxfiscal.com.br', nivelAcesso: 'suporte_comercial', ativo: true, dataCriacao: '2024-02-01' },
  { id: 'usr-003', nome: 'Pedro Analista', email: 'pedro@evoxfiscal.com.br', nivelAcesso: 'analista_fiscal', ativo: true, dataCriacao: '2024-03-01' },
  { id: 'usr-004', nome: 'Mariana Analista', email: 'mariana@evoxfiscal.com.br', nivelAcesso: 'analista_fiscal', ativo: true, dataCriacao: '2024-04-01' },
];

const sampleParceiros: Parceiro[] = [
  { id: 'par-001', tipo: 'pf', nomeCompleto: 'Roberto Silva Mendes', cpf: '123.456.789-00', telefone: '(11) 99999-1234', email: 'roberto@parceiro.com', endereco: 'Rua Augusta, 1500 - São Paulo/SP', ativo: true, dataCadastro: '2024-05-10' },
  { id: 'par-002', tipo: 'pj', nomeCompleto: 'Consultoria Tributária Nacional', razaoSocial: 'CTN Consultoria Ltda', cnpj: '33.444.555/0001-66', telefone: '(21) 3333-4444', email: 'contato@ctn.com.br', endereco: 'Av. Rio Branco, 100 - Rio de Janeiro/RJ', ativo: true, dataCadastro: '2024-06-15' },
  { id: 'par-003', tipo: 'pf', nomeCompleto: 'Fernanda Costa Lima', cpf: '987.654.321-00', telefone: '(31) 98888-5555', email: 'fernanda@parceiro.com', endereco: 'Rua da Bahia, 800 - Belo Horizonte/MG', ativo: false, dataCadastro: '2024-04-20' },
];

const sampleClientes: Cliente[] = [
  {
    id: 'cli-001', cnpj: '12.345.678/0001-90', razaoSocial: 'Indústria Metalúrgica São Paulo Ltda',
    nomeFantasia: 'MetalSP', dataAbertura: '2015-03-15', regimeTributario: 'lucro_real',
    situacaoCadastral: 'ativa', cnaePrincipal: '2599-3/99',
    cnaePrincipalDescricao: 'Fabricação de produtos de metal não especificados anteriormente',
    segmentoEconomico: 'Indústria Metalúrgica', naturezaJuridica: 'Sociedade Empresária Limitada',
    industrializa: true, comercializa: true, prestaServicos: false,
    contribuinteICMS: true, contribuinteIPI: true, regimeMonofasico: false,
    folhaPagamentoMedia: 180000, faturamentoMedioMensal: 850000, valorMedioGuias: 95000,
    processosJudiciaisAtivos: false, parcelamentosAtivos: false, estado: 'SP',
    atividadePrincipalDescritivo: 'Fabricação de peças e componentes metálicos para a indústria automotiva e construção civil.',
    parceiroId: 'par-001',
    procuracao: { habilitada: true, certificadoDigital: 'evox_fiscal', dataValidade: '2026-03-15' },
    dataCadastro: '2024-06-15T10:30:00', horaCadastro: '10:30',
    usuarioCadastroId: 'usr-002', usuarioCadastroNome: 'Ana Suporte',
    redFlags: [], alertasInformacao: [], prioridade: 'alta', scoreOportunidade: 85,
  },
  {
    id: 'cli-002', cnpj: '98.765.432/0001-10', razaoSocial: 'Tech Solutions Consultoria Empresarial Ltda',
    nomeFantasia: 'TechSol', dataAbertura: '2020-08-20', regimeTributario: 'lucro_presumido',
    situacaoCadastral: 'ativa', cnaePrincipal: '6204-0/00',
    cnaePrincipalDescricao: 'Consultoria em tecnologia da informação',
    segmentoEconomico: 'Tecnologia da Informação', naturezaJuridica: 'Sociedade Empresária Limitada',
    industrializa: false, comercializa: false, prestaServicos: true,
    contribuinteICMS: false, contribuinteIPI: false, regimeMonofasico: false,
    folhaPagamentoMedia: 85000, faturamentoMedioMensal: 320000, valorMedioGuias: 28000,
    processosJudiciaisAtivos: false, parcelamentosAtivos: false, estado: 'RJ',
    atividadePrincipalDescritivo: 'Consultoria em tecnologia da informação, desenvolvimento de software e suporte técnico.',
    parceiroId: 'par-002',
    procuracao: { habilitada: true, certificadoDigital: 'gercino_neto', dataValidade: '2026-02-18' },
    dataCadastro: '2024-09-10T14:15:00', horaCadastro: '14:15',
    usuarioCadastroId: 'usr-001', usuarioCadastroNome: 'Carlos Admin',
    redFlags: [], alertasInformacao: [], prioridade: 'media', scoreOportunidade: 62,
  },
  {
    id: 'cli-003', cnpj: '55.123.456/0001-77', razaoSocial: 'Distribuidora Nacional de Alimentos Ltda',
    nomeFantasia: 'DistriNAL', dataAbertura: '2010-01-10', regimeTributario: 'lucro_real',
    situacaoCadastral: 'ativa', cnaePrincipal: '4639-7/01',
    cnaePrincipalDescricao: 'Comércio atacadista de produtos alimentícios em geral',
    segmentoEconomico: 'Comércio Atacadista de Alimentos', naturezaJuridica: 'Sociedade Empresária Limitada',
    industrializa: false, comercializa: true, prestaServicos: false,
    contribuinteICMS: true, contribuinteIPI: false, regimeMonofasico: true,
    folhaPagamentoMedia: 250000, faturamentoMedioMensal: 2500000, valorMedioGuias: 180000,
    processosJudiciaisAtivos: true, parcelamentosAtivos: false, estado: 'MG',
    atividadePrincipalDescritivo: 'Distribuição atacadista de alimentos, bebidas e produtos de higiene.',
    parceiroId: 'par-001',
    procuracao: { habilitada: true, certificadoDigital: 'evox_fiscal', dataValidade: '2026-08-20' },
    dataCadastro: '2024-03-22T09:00:00', horaCadastro: '09:00',
    usuarioCadastroId: 'usr-002', usuarioCadastroNome: 'Ana Suporte',
    redFlags: [], alertasInformacao: [], prioridade: 'alta', scoreOportunidade: 92,
  },
  {
    id: 'cli-004', cnpj: '11.222.333/0001-44', razaoSocial: 'Startup Digital Inovação S.A.',
    nomeFantasia: 'StartDigi', dataAbertura: '2024-11-01', regimeTributario: 'simples_nacional',
    situacaoCadastral: 'ativa', cnaePrincipal: '6201-5/01',
    cnaePrincipalDescricao: 'Desenvolvimento de programas de computador sob encomenda',
    segmentoEconomico: 'Tecnologia', naturezaJuridica: 'Sociedade Anônima Fechada',
    industrializa: false, comercializa: false, prestaServicos: true,
    contribuinteICMS: false, contribuinteIPI: false, regimeMonofasico: false,
    folhaPagamentoMedia: 15000, faturamentoMedioMensal: 45000, valorMedioGuias: 3500,
    processosJudiciaisAtivos: false, parcelamentosAtivos: false, estado: 'SC',
    atividadePrincipalDescritivo: 'Desenvolvimento de software sob encomenda e SaaS.',
    procuracao: { habilitada: false },
    dataCadastro: '2025-01-05T16:45:00', horaCadastro: '16:45',
    usuarioCadastroId: 'usr-001', usuarioCadastroNome: 'Carlos Admin',
    redFlags: [], alertasInformacao: [], prioridade: 'baixa', scoreOportunidade: 15,
  },
  {
    id: 'cli-005', cnpj: '77.888.999/0001-55', razaoSocial: 'Construtora Horizonte Engenharia Ltda',
    nomeFantasia: 'Horizonte Eng.', dataAbertura: '2008-06-20', regimeTributario: 'lucro_presumido',
    situacaoCadastral: 'suspensa', cnaePrincipal: '4120-4/00',
    cnaePrincipalDescricao: 'Construção de edifícios',
    segmentoEconomico: 'Construção Civil', naturezaJuridica: 'Sociedade Empresária Limitada',
    industrializa: false, comercializa: true, prestaServicos: true,
    contribuinteICMS: true, contribuinteIPI: false, regimeMonofasico: false,
    folhaPagamentoMedia: 320000, faturamentoMedioMensal: 1200000, valorMedioGuias: 75000,
    processosJudiciaisAtivos: true, parcelamentosAtivos: true, estado: 'PR',
    atividadePrincipalDescritivo: 'Construção de edifícios residenciais e comerciais, obras de infraestrutura.',
    parceiroId: 'par-002',
    procuracao: { habilitada: true, certificadoDigital: 'evox_fiscal', dataValidade: '2026-02-15' },
    dataCadastro: '2024-07-18T11:20:00', horaCadastro: '11:20',
    usuarioCadastroId: 'usr-002', usuarioCadastroNome: 'Ana Suporte',
    redFlags: [], alertasInformacao: [], prioridade: 'baixa', scoreOportunidade: 30,
  },
];

// Recalculate red flags and priority for sample clients
function recalcPriority(c: Cliente) {
  c.redFlags = calcularRedFlags(c);
  c.alertasInformacao = verificarInformacoesFaltantes(c);
  const hasBlockingFlag = c.redFlags.some(f => f.impacto === 'bloqueante');
  const nonPriorityFlags = c.redFlags.filter(f => f.impacto === 'nao_prioritario').length;
  if (hasBlockingFlag || nonPriorityFlags >= 2) {
    c.prioridade = 'baixa';
  } else if (c.valorMedioGuias >= 20000 && c.redFlags.length === 0) {
    c.prioridade = 'alta';
  } else {
    c.prioridade = 'media';
  }
}
sampleClientes.forEach(recalcPriority);

// Build initial fila from sample clients
const sampleFila: ItemFilaApuracao[] = sampleClientes.map((c, idx) => ({
  id: `fila-${c.id}`,
  clienteId: c.id,
  clienteNome: c.razaoSocial,
  clienteCnpj: c.cnpj,
  parceiroNome: sampleParceiros.find(p => p.id === c.parceiroId)?.nomeCompleto,
  prioridade: c.prioridade,
  status: idx < 2 ? 'concluido' : idx === 2 ? 'fazendo' : 'a_fazer',
  ordem: idx + 1,
  dataInsercao: c.dataCadastro,
  dataInicioApuracao: idx === 2 ? '2025-02-10T08:00:00' : idx < 2 ? c.dataCadastro : undefined,
  dataConclusao: idx < 2 ? '2025-01-15T17:00:00' : undefined,
  analistaId: idx === 2 ? 'usr-003' : idx < 2 ? 'usr-003' : undefined,
  analistaNome: idx === 2 ? 'Pedro Analista' : idx < 2 ? 'Pedro Analista' : undefined,
  tempoGastoMs: idx < 2 ? 14400000 : idx === 2 ? 7200000 : undefined,
  procuracaoHabilitada: c.procuracao.habilitada,
  procuracaoValidade: c.procuracao.dataValidade,
  historico: [{
    id: uuidv4(), data: c.dataCadastro, usuarioNome: c.usuarioCadastroNome || 'Sistema',
    acao: 'Inserção na fila', detalhes: 'Empresa inserida automaticamente na fila de apuração após cadastro.'
  }],
}));

const initialState: AppState = {
  clientes: sampleClientes,
  teses: tesesDatabase,
  relatorios: [],
  parceiros: sampleParceiros,
  filaApuracao: sampleFila,
  usuarios: sampleUsuarios,
  usuarioAtual: sampleUsuarios[0], // Admin by default
  statusApuracaoList: [...DEFAULT_STATUS_LIST],
  clienteSelecionado: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  const now = new Date().toISOString();
  const userName = state.usuarioAtual.nome;

  switch (action.type) {
    case 'ADD_CLIENTE': {
      const novoCliente: Cliente = {
        ...action.payload,
        id: uuidv4(),
        dataCadastro: now,
        horaCadastro: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        usuarioCadastroId: state.usuarioAtual.id,
        usuarioCadastroNome: state.usuarioAtual.nome,
        redFlags: [],
        alertasInformacao: [],
        prioridade: 'media',
      };
      recalcPriority(novoCliente);

      const parceiroNome = state.parceiros.find(p => p.id === novoCliente.parceiroId)?.nomeCompleto;

      // Add to fila automatically
      const novoItemFila: ItemFilaApuracao = {
        id: `fila-${novoCliente.id}`,
        clienteId: novoCliente.id,
        clienteNome: novoCliente.razaoSocial,
        clienteCnpj: novoCliente.cnpj,
        parceiroNome,
        prioridade: novoCliente.prioridade,
        status: 'a_fazer',
        ordem: state.filaApuracao.length + 1,
        dataInsercao: now,
        procuracaoHabilitada: novoCliente.procuracao?.habilitada || false,
        procuracaoValidade: novoCliente.procuracao?.dataValidade,
        historico: [{
          id: uuidv4(), data: now, usuarioNome: userName,
          acao: 'Inserção na fila', detalhes: 'Empresa inserida automaticamente na fila de apuração após cadastro.'
        }],
      };

      return {
        ...state,
        clientes: [...state.clientes, novoCliente],
        filaApuracao: [...state.filaApuracao, novoItemFila],
      };
    }

    case 'UPDATE_CLIENTE': {
      const updated = { ...action.payload };
      recalcPriority(updated);
      // Update fila entry too
      const parceiroNome = state.parceiros.find(p => p.id === updated.parceiroId)?.nomeCompleto;
      const updatedFila = state.filaApuracao.map(item =>
        item.clienteId === updated.id
          ? {
              ...item,
              clienteNome: updated.razaoSocial,
              clienteCnpj: updated.cnpj,
              parceiroNome,
              prioridade: updated.prioridade,
              procuracaoHabilitada: updated.procuracao?.habilitada || false,
              procuracaoValidade: updated.procuracao?.dataValidade,
            }
          : item
      );
      return {
        ...state,
        clientes: state.clientes.map(c => c.id === updated.id ? updated : c),
        filaApuracao: updatedFila,
      };
    }

    case 'DELETE_CLIENTE':
      return {
        ...state,
        clientes: state.clientes.filter(c => c.id !== action.payload),
        relatorios: state.relatorios.filter(r => r.clienteId !== action.payload),
        filaApuracao: state.filaApuracao.filter(f => f.clienteId !== action.payload),
      };

    case 'SELECT_CLIENTE':
      return { ...state, clienteSelecionado: action.payload };

    case 'ADD_TESE': {
      const novaTese: Tese = {
        ...action.payload,
        id: uuidv4(),
        dataCriacao: now.split('T')[0],
        dataAtualizacao: now.split('T')[0],
        versao: 1,
      };
      return { ...state, teses: [...state.teses, novaTese] };
    }

    case 'UPDATE_TESE': {
      const updatedTese = { ...action.payload, dataAtualizacao: now.split('T')[0], versao: action.payload.versao + 1 };
      return { ...state, teses: state.teses.map(t => t.id === updatedTese.id ? updatedTese : t) };
    }

    case 'DELETE_TESE':
      return { ...state, teses: state.teses.filter(t => t.id !== action.payload) };

    case 'GERAR_ANALISE': {
      const cliente = state.clientes.find(c => c.id === action.payload);
      if (!cliente) return state;
      const relatorio = gerarRelatorioAnalise(cliente, state.teses);
      const updatedCliente = {
        ...cliente,
        dataUltimaAnalise: now,
        scoreOportunidade: relatorio.scoreOportunidade,
        prioridade: relatorio.prioridade,
      };
      return {
        ...state,
        clientes: state.clientes.map(c => c.id === updatedCliente.id ? updatedCliente : c),
        relatorios: [relatorio, ...state.relatorios.filter(r => r.clienteId !== action.payload)],
      };
    }

    case 'ADD_PARCEIRO': {
      const novoParceiro: Parceiro = { ...action.payload, id: uuidv4(), dataCadastro: now.split('T')[0] };
      return { ...state, parceiros: [...state.parceiros, novoParceiro] };
    }

    case 'UPDATE_PARCEIRO':
      return { ...state, parceiros: state.parceiros.map(p => p.id === action.payload.id ? action.payload : p) };

    case 'DELETE_PARCEIRO':
      return { ...state, parceiros: state.parceiros.filter(p => p.id !== action.payload) };

    case 'INICIAR_APURACAO': {
      return {
        ...state,
        filaApuracao: state.filaApuracao.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                status: 'fazendo',
                analistaId: state.usuarioAtual.id,
                analistaNome: state.usuarioAtual.nome,
                dataInicioApuracao: now,
                historico: [...item.historico, {
                  id: uuidv4(), data: now, usuarioNome: userName,
                  acao: 'Início da apuração', detalhes: `Apuração iniciada pelo analista ${userName}.`
                }],
              }
            : item
        ),
      };
    }

    case 'CANCELAR_APURACAO': {
      return {
        ...state,
        filaApuracao: state.filaApuracao.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                status: 'a_fazer',
                analistaId: undefined,
                analistaNome: undefined,
                dataInicioApuracao: undefined,
                historico: [...item.historico, {
                  id: uuidv4(), data: now, usuarioNome: userName,
                  acao: 'Cancelamento da apuração', detalhes: `Apuração cancelada por ${userName}.`
                }],
              }
            : item
        ),
      };
    }

    case 'MUDAR_STATUS_APURACAO': {
      return {
        ...state,
        filaApuracao: state.filaApuracao.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                status: action.payload.novoStatus,
                dataConclusao: action.payload.novoStatus === 'concluido' ? now : item.dataConclusao,
                tempoGastoMs: action.payload.novoStatus === 'concluido' && item.dataInicioApuracao
                  ? new Date(now).getTime() - new Date(item.dataInicioApuracao).getTime()
                  : item.tempoGastoMs,
                historico: [...item.historico, {
                  id: uuidv4(), data: now, usuarioNome: userName,
                  acao: 'Mudança de status', detalhes: `Status alterado para "${action.payload.novoStatus}" por ${userName}.`
                }],
              }
            : item
        ),
      };
    }

    case 'REORDENAR_FILA': {
      const items = [...state.filaApuracao];
      const itemIdx = items.findIndex(i => i.id === action.payload.itemId);
      if (itemIdx === -1) return state;
      const [moved] = items.splice(itemIdx, 1);
      items.splice(action.payload.novaOrdem - 1, 0, moved);
      const reordered = items.map((item, idx) => ({ ...item, ordem: idx + 1 }));
      return { ...state, filaApuracao: reordered };
    }

    case 'SET_PRIORIDADE_FILA': {
      return {
        ...state,
        filaApuracao: state.filaApuracao.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                prioridade: action.payload.prioridade,
                prioridadeManual: true,
                historico: [...item.historico, {
                  id: uuidv4(), data: now, usuarioNome: userName,
                  acao: 'Alteração de prioridade', detalhes: `Prioridade alterada para "${action.payload.prioridade}" por ${userName}.`
                }],
              }
            : item
        ),
      };
    }

    case 'ADD_STATUS_APURACAO':
      return { ...state, statusApuracaoList: [...state.statusApuracaoList, action.payload] };

    case 'SET_USUARIO': {
      const user = state.usuarios.find(u => u.nivelAcesso === action.payload);
      if (!user) return state;
      return { ...state, usuarioAtual: user };
    }

    case 'SET_STATE':
      return action.payload;

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getDashboardStats: () => DashboardStats;
  getPermissoes: () => Permissoes;
  getParceiroNome: (id?: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const getDashboardStats = useCallback((): DashboardStats => {
    const totalClientes = state.clientes.length;
    const clientesPrioritarios = state.clientes.filter(c => c.prioridade === 'alta').length;
    const clientesComRedFlags = state.clientes.filter(c => c.redFlags.length > 0).length;
    const totalTeses = state.teses.filter(t => t.ativa).length;
    const tesesPacificadas = state.teses.filter(t => t.classificacao === 'pacificada' && t.ativa).length;
    const analisesPendentes = state.clientes.filter(c => !c.dataUltimaAnalise).length;
    const potencialRecuperacaoTotal = state.relatorios.reduce(
      (acc, r) => acc + r.tesesAplicaveis.reduce((a, t) => a + t.estimativaRecuperacao, 0), 0
    );
    const scores = state.clientes.filter(c => c.scoreOportunidade !== undefined).map(c => c.scoreOportunidade!);
    const mediaScoreOportunidade = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const totalParceiros = state.parceiros.filter(p => p.ativo).length;
    const filaAFazer = state.filaApuracao.filter(f => f.status === 'a_fazer').length;
    const filaFazendo = state.filaApuracao.filter(f => f.status === 'fazendo').length;
    const filaConcluido = state.filaApuracao.filter(f => f.status === 'concluido').length;

    return {
      totalClientes, clientesPrioritarios, clientesComRedFlags, totalTeses, tesesPacificadas,
      analisesPendentes, potencialRecuperacaoTotal, mediaScoreOportunidade,
      totalParceiros, filaAFazer, filaFazendo, filaConcluido,
    };
  }, [state]);

  const permissoes = useCallback(() => getPermissoes(state.usuarioAtual.nivelAcesso), [state.usuarioAtual]);

  const getParceiroNomeFunc = useCallback((id?: string) => {
    if (!id) return '—';
    return state.parceiros.find(p => p.id === id)?.nomeCompleto || '—';
  }, [state.parceiros]);

  return (
    <AppContext.Provider value={{ state, dispatch, getDashboardStats, getPermissoes: permissoes, getParceiroNome: getParceiroNomeFunc }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
