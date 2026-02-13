// ============================================================
// Evox Fiscal — Global State Management
// ============================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Cliente, Tese, RelatorioAnalise, DashboardStats } from '@/lib/types';
import { tesesDatabase } from '@/lib/teses-database';
import { calcularRedFlags, verificarInformacoesFaltantes, gerarRelatorioAnalise } from '@/lib/rules-engine';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  clientes: Cliente[];
  teses: Tese[];
  relatorios: RelatorioAnalise[];
  clienteSelecionado: string | null;
}

type AppAction =
  | { type: 'ADD_CLIENTE'; payload: Omit<Cliente, 'id' | 'dataCadastro' | 'redFlags' | 'alertasInformacao' | 'prioridade'> }
  | { type: 'UPDATE_CLIENTE'; payload: Cliente }
  | { type: 'DELETE_CLIENTE'; payload: string }
  | { type: 'SELECT_CLIENTE'; payload: string | null }
  | { type: 'ADD_TESE'; payload: Omit<Tese, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'versao'> }
  | { type: 'UPDATE_TESE'; payload: Tese }
  | { type: 'DELETE_TESE'; payload: string }
  | { type: 'GERAR_ANALISE'; payload: string }
  | { type: 'SET_STATE'; payload: AppState };

const sampleClientes: Cliente[] = [
  {
    id: 'cli-001',
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'Indústria Metalúrgica São Paulo Ltda',
    nomeFantasia: 'MetalSP',
    dataAbertura: '2015-03-15',
    regimeTributario: 'lucro_real',
    situacaoCadastral: 'ativa',
    cnaePrincipal: '2599-3/99',
    cnaePrincipalDescricao: 'Fabricação de produtos de metal não especificados anteriormente',
    segmentoEconomico: 'Indústria Metalúrgica',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    industrializa: true,
    comercializa: true,
    prestaServicos: false,
    contribuinteICMS: true,
    contribuinteIPI: true,
    regimeMonofasico: false,
    folhaPagamentoMedia: 180000,
    faturamentoMedioMensal: 850000,
    valorMedioGuias: 95000,
    processosJudiciaisAtivos: false,
    parcelamentosAtivos: false,
    estado: 'SP',
    atividadePrincipalDescritivo: 'Fabricação de peças e componentes metálicos para a indústria automotiva e construção civil.',
    dataCadastro: '2024-06-15',
    redFlags: [],
    alertasInformacao: [],
    prioridade: 'alta',
    scoreOportunidade: 85,
  },
  {
    id: 'cli-002',
    cnpj: '98.765.432/0001-10',
    razaoSocial: 'Tech Solutions Consultoria Empresarial Ltda',
    nomeFantasia: 'TechSol',
    dataAbertura: '2020-08-20',
    regimeTributario: 'lucro_presumido',
    situacaoCadastral: 'ativa',
    cnaePrincipal: '6204-0/00',
    cnaePrincipalDescricao: 'Consultoria em tecnologia da informação',
    segmentoEconomico: 'Tecnologia da Informação',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    industrializa: false,
    comercializa: false,
    prestaServicos: true,
    contribuinteICMS: false,
    contribuinteIPI: false,
    regimeMonofasico: false,
    folhaPagamentoMedia: 85000,
    faturamentoMedioMensal: 320000,
    valorMedioGuias: 28000,
    processosJudiciaisAtivos: false,
    parcelamentosAtivos: false,
    estado: 'RJ',
    atividadePrincipalDescritivo: 'Consultoria em tecnologia da informação, desenvolvimento de software e suporte técnico.',
    dataCadastro: '2024-09-10',
    redFlags: [],
    alertasInformacao: [],
    prioridade: 'media',
    scoreOportunidade: 62,
  },
  {
    id: 'cli-003',
    cnpj: '55.123.456/0001-77',
    razaoSocial: 'Distribuidora Nacional de Alimentos Ltda',
    nomeFantasia: 'DistriNAL',
    dataAbertura: '2010-01-10',
    regimeTributario: 'lucro_real',
    situacaoCadastral: 'ativa',
    cnaePrincipal: '4639-7/01',
    cnaePrincipalDescricao: 'Comércio atacadista de produtos alimentícios em geral',
    segmentoEconomico: 'Comércio Atacadista de Alimentos',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    industrializa: false,
    comercializa: true,
    prestaServicos: false,
    contribuinteICMS: true,
    contribuinteIPI: false,
    regimeMonofasico: true,
    folhaPagamentoMedia: 250000,
    faturamentoMedioMensal: 2500000,
    valorMedioGuias: 180000,
    processosJudiciaisAtivos: true,
    parcelamentosAtivos: false,
    estado: 'MG',
    atividadePrincipalDescritivo: 'Distribuição atacadista de alimentos, bebidas e produtos de higiene para supermercados e restaurantes.',
    dataCadastro: '2024-03-22',
    redFlags: [],
    alertasInformacao: [],
    prioridade: 'alta',
    scoreOportunidade: 92,
  },
  {
    id: 'cli-004',
    cnpj: '11.222.333/0001-44',
    razaoSocial: 'Startup Digital Inovação S.A.',
    nomeFantasia: 'StartDigi',
    dataAbertura: '2024-11-01',
    regimeTributario: 'simples_nacional',
    situacaoCadastral: 'ativa',
    cnaePrincipal: '6201-5/01',
    cnaePrincipalDescricao: 'Desenvolvimento de programas de computador sob encomenda',
    segmentoEconomico: 'Tecnologia',
    naturezaJuridica: 'Sociedade Anônima Fechada',
    industrializa: false,
    comercializa: false,
    prestaServicos: true,
    contribuinteICMS: false,
    contribuinteIPI: false,
    regimeMonofasico: false,
    folhaPagamentoMedia: 15000,
    faturamentoMedioMensal: 45000,
    valorMedioGuias: 3500,
    processosJudiciaisAtivos: false,
    parcelamentosAtivos: false,
    estado: 'SC',
    atividadePrincipalDescritivo: 'Desenvolvimento de software sob encomenda e SaaS.',
    dataCadastro: '2025-01-05',
    redFlags: [],
    alertasInformacao: [],
    prioridade: 'baixa',
    scoreOportunidade: 15,
  },
  {
    id: 'cli-005',
    cnpj: '77.888.999/0001-55',
    razaoSocial: 'Construtora Horizonte Engenharia Ltda',
    nomeFantasia: 'Horizonte Eng.',
    dataAbertura: '2008-06-20',
    regimeTributario: 'lucro_presumido',
    situacaoCadastral: 'suspensa',
    cnaePrincipal: '4120-4/00',
    cnaePrincipalDescricao: 'Construção de edifícios',
    segmentoEconomico: 'Construção Civil',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    industrializa: false,
    comercializa: true,
    prestaServicos: true,
    contribuinteICMS: true,
    contribuinteIPI: false,
    regimeMonofasico: false,
    folhaPagamentoMedia: 320000,
    faturamentoMedioMensal: 1200000,
    valorMedioGuias: 75000,
    processosJudiciaisAtivos: true,
    parcelamentosAtivos: true,
    estado: 'PR',
    atividadePrincipalDescritivo: 'Construção de edifícios residenciais e comerciais, obras de infraestrutura.',
    dataCadastro: '2024-07-18',
    redFlags: [],
    alertasInformacao: [],
    prioridade: 'baixa',
    scoreOportunidade: 30,
  },
];

// Recalculate red flags and priority for sample clients
sampleClientes.forEach(c => {
  c.redFlags = calcularRedFlags(c);
  c.alertasInformacao = verificarInformacoesFaltantes(c);
  // Recalculate priority
  const hasBlockingFlag = c.redFlags.some(f => f.impacto === 'bloqueante');
  const nonPriorityFlags = c.redFlags.filter(f => f.impacto === 'nao_prioritario').length;
  if (hasBlockingFlag || nonPriorityFlags >= 2) {
    c.prioridade = 'baixa';
  } else if (c.valorMedioGuias >= 20000 && c.redFlags.length === 0) {
    c.prioridade = 'alta';
  } else {
    c.prioridade = 'media';
  }
});

const initialState: AppState = {
  clientes: sampleClientes,
  teses: tesesDatabase,
  relatorios: [],
  clienteSelecionado: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_CLIENTE': {
      const novoCliente: Cliente = {
        ...action.payload,
        id: uuidv4(),
        dataCadastro: new Date().toISOString(),
        redFlags: [],
        alertasInformacao: [],
        prioridade: 'media',
      };
      novoCliente.redFlags = calcularRedFlags(novoCliente);
      novoCliente.alertasInformacao = verificarInformacoesFaltantes(novoCliente);
      const hasBlockingFlag = novoCliente.redFlags.some(f => f.impacto === 'bloqueante');
      const nonPriorityFlags = novoCliente.redFlags.filter(f => f.impacto === 'nao_prioritario').length;
      if (hasBlockingFlag || nonPriorityFlags >= 2) {
        novoCliente.prioridade = 'baixa';
      } else if (novoCliente.valorMedioGuias >= 20000 && novoCliente.redFlags.length === 0) {
        novoCliente.prioridade = 'alta';
      }
      return { ...state, clientes: [...state.clientes, novoCliente] };
    }
    case 'UPDATE_CLIENTE': {
      const updated = { ...action.payload };
      updated.redFlags = calcularRedFlags(updated);
      updated.alertasInformacao = verificarInformacoesFaltantes(updated);
      const hasBlockingFlag = updated.redFlags.some(f => f.impacto === 'bloqueante');
      const nonPriorityFlags = updated.redFlags.filter(f => f.impacto === 'nao_prioritario').length;
      if (hasBlockingFlag || nonPriorityFlags >= 2) {
        updated.prioridade = 'baixa';
      } else if (updated.valorMedioGuias >= 20000 && updated.redFlags.length === 0) {
        updated.prioridade = 'alta';
      } else {
        updated.prioridade = 'media';
      }
      return {
        ...state,
        clientes: state.clientes.map(c => c.id === updated.id ? updated : c),
      };
    }
    case 'DELETE_CLIENTE':
      return {
        ...state,
        clientes: state.clientes.filter(c => c.id !== action.payload),
        relatorios: state.relatorios.filter(r => r.clienteId !== action.payload),
      };
    case 'SELECT_CLIENTE':
      return { ...state, clienteSelecionado: action.payload };
    case 'ADD_TESE': {
      const novaTese: Tese = {
        ...action.payload,
        id: uuidv4(),
        dataCriacao: new Date().toISOString().split('T')[0],
        dataAtualizacao: new Date().toISOString().split('T')[0],
        versao: 1,
      };
      return { ...state, teses: [...state.teses, novaTese] };
    }
    case 'UPDATE_TESE': {
      const updatedTese = {
        ...action.payload,
        dataAtualizacao: new Date().toISOString().split('T')[0],
        versao: action.payload.versao + 1,
      };
      return {
        ...state,
        teses: state.teses.map(t => t.id === updatedTese.id ? updatedTese : t),
      };
    }
    case 'DELETE_TESE':
      return { ...state, teses: state.teses.filter(t => t.id !== action.payload) };
    case 'GERAR_ANALISE': {
      const cliente = state.clientes.find(c => c.id === action.payload);
      if (!cliente) return state;
      const relatorio = gerarRelatorioAnalise(cliente, state.teses);
      const updatedCliente = {
        ...cliente,
        dataUltimaAnalise: new Date().toISOString(),
        scoreOportunidade: relatorio.scoreOportunidade,
        prioridade: relatorio.prioridade,
      };
      return {
        ...state,
        clientes: state.clientes.map(c => c.id === updatedCliente.id ? updatedCliente : c),
        relatorios: [relatorio, ...state.relatorios.filter(r => r.clienteId !== action.payload)],
      };
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

    return {
      totalClientes,
      clientesPrioritarios,
      clientesComRedFlags,
      totalTeses,
      tesesPacificadas,
      analisesPendentes,
      potencialRecuperacaoTotal,
      mediaScoreOportunidade,
    };
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch, getDashboardStats }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
