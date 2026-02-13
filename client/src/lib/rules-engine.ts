// ============================================================
// Motor de Regras Tributárias — Evox Fiscal
// Lógica jurídico-tributária para análise de oportunidades
// ============================================================

import type { Cliente, Tese, AnaliseTeseCliente, RedFlag, RelatorioAnalise, PrioridadeCliente, RecomendacaoEstrategica, AlertaInformacao } from './types';
import { v4 as uuidv4 } from 'uuid';

// ---- RED FLAGS ----

export function calcularRedFlags(cliente: Cliente): RedFlag[] {
  const flags: RedFlag[] = [];

  // 1. Data de abertura < 2 anos
  const dataAbertura = new Date(cliente.dataAbertura);
  const doisAnosAtras = new Date();
  doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);
  if (dataAbertura > doisAnosAtras) {
    flags.push({
      id: uuidv4(),
      tipo: 'abertura_recente',
      descricao: 'Empresa aberta há menos de 2 anos — histórico fiscal insuficiente para análise robusta.',
      impacto: 'nao_prioritario',
      valor: `Abertura: ${dataAbertura.toLocaleDateString('pt-BR')}`,
    });
  }

  // 2. Valor médio das guias < R$ 20.000
  if (cliente.valorMedioGuias < 20000) {
    flags.push({
      id: uuidv4(),
      tipo: 'valor_guias_baixo',
      descricao: `Valor médio das guias (R$ ${cliente.valorMedioGuias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) inferior a R$ 20.000/mês — potencial de recuperação limitado.`,
      impacto: 'nao_prioritario',
      valor: `R$ ${cliente.valorMedioGuias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    });
  }

  // 3. Situação cadastral irregular
  if (['baixada', 'inapta', 'suspensa', 'nula'].includes(cliente.situacaoCadastral)) {
    flags.push({
      id: uuidv4(),
      tipo: 'situacao_irregular',
      descricao: `Situação cadastral "${cliente.situacaoCadastral}" — empresa com restrições que podem inviabilizar recuperação.`,
      impacto: 'bloqueante',
      valor: cliente.situacaoCadastral,
    });
  }

  return flags;
}

// ---- ALERTAS DE INFORMAÇÕES FALTANTES ----

export function verificarInformacoesFaltantes(cliente: Partial<Cliente>): AlertaInformacao[] {
  const alertas: AlertaInformacao[] = [];
  const camposObrigatorios: { campo: string; label: string; valor: any }[] = [
    { campo: 'cnpj', label: 'CNPJ', valor: cliente.cnpj },
    { campo: 'razaoSocial', label: 'Razão Social', valor: cliente.razaoSocial },
    { campo: 'dataAbertura', label: 'Data de Abertura', valor: cliente.dataAbertura },
    { campo: 'regimeTributario', label: 'Regime Tributário', valor: cliente.regimeTributario },
    { campo: 'situacaoCadastral', label: 'Situação Cadastral', valor: cliente.situacaoCadastral },
    { campo: 'cnaePrincipal', label: 'CNAE Principal', valor: cliente.cnaePrincipal },
    { campo: 'segmentoEconomico', label: 'Segmento Econômico', valor: cliente.segmentoEconomico },
    { campo: 'naturezaJuridica', label: 'Natureza Jurídica', valor: cliente.naturezaJuridica },
    { campo: 'estado', label: 'Estado de Atuação', valor: cliente.estado },
    { campo: 'faturamentoMedioMensal', label: 'Faturamento Médio Mensal', valor: cliente.faturamentoMedioMensal },
    { campo: 'valorMedioGuias', label: 'Valor Médio das Guias', valor: cliente.valorMedioGuias },
    { campo: 'folhaPagamentoMedia', label: 'Folha de Pagamento Média', valor: cliente.folhaPagamentoMedia },
  ];

  for (const item of camposObrigatorios) {
    if (item.valor === undefined || item.valor === null || item.valor === '') {
      alertas.push({
        campo: item.campo,
        mensagem: `O campo "${item.label}" não foi preenchido. Esta informação é importante para a análise tributária.`,
        obrigatorio: true,
      });
    }
  }

  return alertas;
}

// ---- MOTOR DE REGRAS ----

function verificarAplicabilidadeRegime(cliente: Cliente, tese: Tese): { aplicavel: boolean; motivo?: string } {
  // Simples Nacional
  if (cliente.regimeTributario === 'simples_nacional') {
    if (!tese.aplicavelSimplesNacional) {
      return {
        aplicavel: false,
        motivo: `Tese incompatível com o Simples Nacional. ${tese.nome} requer regime de apuração não cumulativa ou regime diferenciado não disponível para optantes do Simples.`,
      };
    }
  }

  // Lucro Presumido
  if (cliente.regimeTributario === 'lucro_presumido') {
    if (!tese.aplicavelLucroPresumido) {
      return {
        aplicavel: false,
        motivo: `Tese requer regime de Lucro Real. No Lucro Presumido, a apuração de ${tese.tributoEnvolvido} segue regime cumulativo, incompatível com esta tese.`,
      };
    }
  }

  // Lucro Real
  if (cliente.regimeTributario === 'lucro_real') {
    if (!tese.aplicavelLucroReal) {
      return {
        aplicavel: false,
        motivo: `Tese não aplicável ao regime de Lucro Real.`,
      };
    }
  }

  return { aplicavel: true };
}

function verificarAplicabilidadeAtividade(cliente: Cliente, tese: Tese): { aplicavel: boolean; motivo?: string } {
  // Se a tese é exclusiva para comércio
  if (tese.aplicavelComercio && !tese.aplicavelIndustria && !tese.aplicavelServico) {
    if (!cliente.comercializa) {
      return {
        aplicavel: false,
        motivo: 'Tese aplicável exclusivamente a empresas comerciais. O cliente não realiza atividade de comercialização de mercadorias.',
      };
    }
  }

  // Se a tese é exclusiva para indústria
  if (tese.aplicavelIndustria && !tese.aplicavelComercio && !tese.aplicavelServico) {
    if (!cliente.industrializa) {
      return {
        aplicavel: false,
        motivo: 'Tese aplicável exclusivamente a estabelecimentos industriais. O cliente não realiza atividade de industrialização.',
      };
    }
  }

  // Se a tese é exclusiva para serviços
  if (tese.aplicavelServico && !tese.aplicavelComercio && !tese.aplicavelIndustria) {
    if (!cliente.prestaServicos) {
      return {
        aplicavel: false,
        motivo: 'Tese aplicável exclusivamente a prestadores de serviço. O cliente não realiza prestação de serviços.',
      };
    }
  }

  // Verificar se pelo menos uma atividade do cliente é coberta
  const atividadesCliente = {
    comercio: cliente.comercializa,
    industria: cliente.industrializa,
    servico: cliente.prestaServicos,
  };

  const atividadesTese = {
    comercio: tese.aplicavelComercio,
    industria: tese.aplicavelIndustria,
    servico: tese.aplicavelServico,
  };

  const temIntersecao = (atividadesCliente.comercio && atividadesTese.comercio)
    || (atividadesCliente.industria && atividadesTese.industria)
    || (atividadesCliente.servico && atividadesTese.servico);

  if (!temIntersecao) {
    return {
      aplicavel: false,
      motivo: `Nenhuma atividade do cliente (${[
        atividadesCliente.comercio ? 'comércio' : '',
        atividadesCliente.industria ? 'indústria' : '',
        atividadesCliente.servico ? 'serviço' : '',
      ].filter(Boolean).join(', ')}) é compatível com os requisitos da tese.`,
    };
  }

  return { aplicavel: true };
}

function verificarAplicabilidadeTributos(cliente: Cliente, tese: Tese): { aplicavel: boolean; motivo?: string } {
  // ICMS
  if (tese.aplicavelContribuinteICMS && !tese.aplicavelContribuinteIPI
    && !tese.aplicavelComercio && !tese.aplicavelServico) {
    if (!cliente.contribuinteICMS) {
      return {
        aplicavel: false,
        motivo: 'Tese requer que a empresa seja contribuinte de ICMS. O cliente não é contribuinte deste tributo.',
      };
    }
  }

  // Se a tese envolve ICMS e o cliente não é contribuinte
  if (tese.tributoEnvolvido.includes('ICMS') && tese.aplicavelContribuinteICMS && !cliente.contribuinteICMS) {
    return {
      aplicavel: false,
      motivo: `A tese "${tese.nome}" envolve ICMS, mas o cliente não é contribuinte de ICMS. Sem operações tributadas pelo ICMS, não há base para aplicação desta tese.`,
    };
  }

  // IPI
  if (tese.aplicavelContribuinteIPI && !cliente.contribuinteIPI && tese.tributoEnvolvido === 'IPI') {
    return {
      aplicavel: false,
      motivo: 'Tese requer que a empresa seja contribuinte de IPI. O cliente não é contribuinte deste tributo.',
    };
  }

  return { aplicavel: true };
}

function calcularGrauAderencia(cliente: Cliente, tese: Tese): number {
  let score = 50; // Base

  // Regime tributário ideal
  if (cliente.regimeTributario === 'lucro_real' && tese.aplicavelLucroReal) score += 15;
  if (cliente.regimeTributario === 'lucro_presumido' && tese.aplicavelLucroPresumido) score += 10;

  // Atividade principal alinhada
  if (cliente.industrializa && tese.aplicavelIndustria) score += 10;
  if (cliente.comercializa && tese.aplicavelComercio) score += 10;
  if (cliente.prestaServicos && tese.aplicavelServico) score += 10;

  // Contribuinte dos tributos relevantes
  if (cliente.contribuinteICMS && tese.aplicavelContribuinteICMS) score += 5;
  if (cliente.contribuinteIPI && tese.aplicavelContribuinteIPI) score += 5;

  // Faturamento alto = maior potencial
  if (cliente.faturamentoMedioMensal > 500000) score += 10;
  else if (cliente.faturamentoMedioMensal > 100000) score += 5;

  // Tese pacificada = mais segura
  if (tese.classificacao === 'pacificada') score += 10;
  if (tese.grauRisco === 'baixo') score += 5;

  return Math.min(100, Math.max(0, score));
}

function calcularEstimativaRecuperacao(cliente: Cliente, tese: Tese): number {
  let base = 0;

  // Estimativa simplificada baseada no faturamento e tipo de tese
  if (tese.tributoEnvolvido.includes('PIS/COFINS')) {
    if (tese.tipo === 'exclusao_base') {
      base = cliente.faturamentoMedioMensal * 0.0925 * 0.15 * 60; // ~15% da base × alíquotas × 60 meses
    } else if (tese.tipo === 'recuperacao_indebito') {
      base = cliente.faturamentoMedioMensal * 0.0925 * 0.10 * 60;
    } else {
      base = cliente.faturamentoMedioMensal * 0.0925 * 0.08 * 60;
    }
  } else if (tese.tributoEnvolvido === 'ICMS') {
    base = cliente.faturamentoMedioMensal * 0.18 * 0.10 * 60;
  } else if (tese.tributoEnvolvido === 'IPI') {
    base = cliente.faturamentoMedioMensal * 0.10 * 0.08 * 60;
  } else if (tese.tributoEnvolvido.includes('IRPJ')) {
    base = cliente.faturamentoMedioMensal * 0.34 * 0.05 * 60;
  } else if (tese.tributoEnvolvido.includes('Contribuição Previdenciária')) {
    base = cliente.folhaPagamentoMedia * 0.20 * 0.15 * 60;
  } else if (tese.tributoEnvolvido.includes('Terceiros')) {
    base = cliente.folhaPagamentoMedia * 0.058 * 0.30 * 60;
  } else if (tese.tributoEnvolvido === 'ISS') {
    base = cliente.faturamentoMedioMensal * 0.05 * 0.10 * 60;
  } else {
    base = cliente.faturamentoMedioMensal * 0.05 * 60;
  }

  // Ajustar pelo risco
  if (tese.grauRisco === 'alto') base *= 0.5;
  if (tese.grauRisco === 'medio') base *= 0.75;

  return Math.round(base);
}

function determinarRecomendacao(tese: Tese, grauAderencia: number): RecomendacaoEstrategica {
  if (grauAderencia < 40) return 'nao_recomendada';
  if (tese.necessidadeAcaoJudicial && tese.grauRisco === 'alto') return 'preventiva';
  if (tese.necessidadeAcaoJudicial) return 'judicial';
  if (tese.viaAdministrativa) return 'administrativa';
  return 'judicial';
}

// ---- ANÁLISE PRINCIPAL ----

export function analisarTesesParaCliente(cliente: Cliente, teses: Tese[]): AnaliseTeseCliente[] {
  const resultados: AnaliseTeseCliente[] = [];

  for (const tese of teses) {
    if (!tese.ativa) continue;

    // Verificar regime tributário
    const checkRegime = verificarAplicabilidadeRegime(cliente, tese);
    if (!checkRegime.aplicavel) {
      resultados.push({
        teseId: tese.id,
        teseNome: tese.nome,
        aplicavel: false,
        motivoExclusao: checkRegime.motivo,
        grauAderencia: 0,
        riscoJuridico: tese.grauRisco,
        fundamentacaoAplicabilidade: '',
        justificativaTecnica: checkRegime.motivo || '',
        estimativaRecuperacao: 0,
        documentosComplementares: [],
        recomendacaoEstrategica: 'nao_recomendada',
        complexidadeOperacional: 'baixa',
        potencialFinanceiro: 0,
        segurancaJuridica: 0,
      });
      continue;
    }

    // Verificar atividade
    const checkAtividade = verificarAplicabilidadeAtividade(cliente, tese);
    if (!checkAtividade.aplicavel) {
      resultados.push({
        teseId: tese.id,
        teseNome: tese.nome,
        aplicavel: false,
        motivoExclusao: checkAtividade.motivo,
        grauAderencia: 0,
        riscoJuridico: tese.grauRisco,
        fundamentacaoAplicabilidade: '',
        justificativaTecnica: checkAtividade.motivo || '',
        estimativaRecuperacao: 0,
        documentosComplementares: [],
        recomendacaoEstrategica: 'nao_recomendada',
        complexidadeOperacional: 'baixa',
        potencialFinanceiro: 0,
        segurancaJuridica: 0,
      });
      continue;
    }

    // Verificar tributos
    const checkTributos = verificarAplicabilidadeTributos(cliente, tese);
    if (!checkTributos.aplicavel) {
      resultados.push({
        teseId: tese.id,
        teseNome: tese.nome,
        aplicavel: false,
        motivoExclusao: checkTributos.motivo,
        grauAderencia: 0,
        riscoJuridico: tese.grauRisco,
        fundamentacaoAplicabilidade: '',
        justificativaTecnica: checkTributos.motivo || '',
        estimativaRecuperacao: 0,
        documentosComplementares: [],
        recomendacaoEstrategica: 'nao_recomendada',
        complexidadeOperacional: 'baixa',
        potencialFinanceiro: 0,
        segurancaJuridica: 0,
      });
      continue;
    }

    // Tese aplicável — calcular métricas
    const grauAderencia = calcularGrauAderencia(cliente, tese);
    const estimativa = calcularEstimativaRecuperacao(cliente, tese);
    const recomendacao = determinarRecomendacao(tese, grauAderencia);

    const segurancaJuridica = tese.classificacao === 'pacificada' ? 90
      : tese.classificacao === 'administrativa' ? 75
      : tese.classificacao === 'judicial' ? 60
      : 40;

    const complexidade = tese.necessidadeAcaoJudicial ? 'alta' : tese.viaAdministrativa ? 'media' : 'alta';

    resultados.push({
      teseId: tese.id,
      teseNome: tese.nome,
      aplicavel: true,
      grauAderencia,
      riscoJuridico: tese.grauRisco,
      fundamentacaoAplicabilidade: `Com base nos dados cadastrais e fiscais do cliente, a tese "${tese.nome}" é aplicável. Fundamentação: ${tese.fundamentacaoLegal}`,
      justificativaTecnica: `O cliente atende aos requisitos objetivos da tese: regime tributário compatível (${cliente.regimeTributario}), atividade econômica compatível, e perfil tributário adequado. ${tese.jurisprudenciaRelevante}`,
      estimativaRecuperacao: estimativa,
      documentosComplementares: tese.documentosNecessarios,
      recomendacaoEstrategica: recomendacao,
      complexidadeOperacional: complexidade,
      potencialFinanceiro: Math.min(100, Math.round(estimativa / 10000)),
      segurancaJuridica,
    });
  }

  return resultados;
}

// ---- RELATÓRIO COMPLETO ----

export function gerarRelatorioAnalise(cliente: Cliente, teses: Tese[]): RelatorioAnalise {
  const analises = analisarTesesParaCliente(cliente, teses);
  const tesesAplicaveis = analises.filter(a => a.aplicavel).sort((a, b) => b.grauAderencia - a.grauAderencia);
  const tesesDescartadas = analises.filter(a => !a.aplicavel);
  const redFlags = calcularRedFlags(cliente);

  // Score de oportunidade
  const scoreBase = tesesAplicaveis.length > 0
    ? tesesAplicaveis.reduce((acc, t) => acc + t.grauAderencia, 0) / tesesAplicaveis.length
    : 0;
  const penalidade = redFlags.length * 10;
  const scoreOportunidade = Math.max(0, Math.round(scoreBase - penalidade));

  // Prioridade
  let prioridade: PrioridadeCliente = 'media';
  const temTeseAltoPotencial = tesesAplicaveis.some(t => t.potencialFinanceiro > 50);
  if (redFlags.some(f => f.impacto === 'bloqueante')) {
    prioridade = 'baixa';
  } else if (redFlags.filter(f => f.impacto === 'nao_prioritario').length >= 2) {
    prioridade = 'baixa';
  } else if (temTeseAltoPotencial && redFlags.length === 0) {
    prioridade = 'alta';
  } else if (temTeseAltoPotencial) {
    prioridade = 'media';
  }

  // Diagnóstico
  const diagnostico = gerarDiagnostico(cliente, tesesAplicaveis, tesesDescartadas, redFlags);

  // Recomendação geral
  const recomendacao = gerarRecomendacaoGeral(tesesAplicaveis, redFlags, prioridade);

  return {
    id: uuidv4(),
    clienteId: cliente.id,
    clienteNome: cliente.razaoSocial,
    dataAnalise: new Date().toISOString(),
    diagnosticoTributario: diagnostico,
    tesesAplicaveis,
    tesesDescartadas,
    scoreOportunidade,
    recomendacaoGeral: recomendacao,
    redFlags,
    prioridade,
  };
}

function gerarDiagnostico(
  cliente: Cliente,
  aplicaveis: AnaliseTeseCliente[],
  descartadas: AnaliseTeseCliente[],
  redFlags: RedFlag[]
): string {
  const partes: string[] = [];

  partes.push(`A empresa ${cliente.razaoSocial} (CNPJ: ${cliente.cnpj}) opera no regime de ${formatarRegime(cliente.regimeTributario)}, com situação cadastral "${cliente.situacaoCadastral}".`);

  const atividades = [
    cliente.industrializa ? 'industrialização' : '',
    cliente.comercializa ? 'comercialização' : '',
    cliente.prestaServicos ? 'prestação de serviços' : '',
  ].filter(Boolean);
  partes.push(`Atividades: ${atividades.join(', ')}.`);

  partes.push(`Faturamento médio mensal: R$ ${cliente.faturamentoMedioMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);

  if (redFlags.length > 0) {
    partes.push(`\n⚠️ ${redFlags.length} RED FLAG(s) identificada(s): ${redFlags.map(f => f.descricao).join(' | ')}`);
  }

  partes.push(`\nForam identificadas ${aplicaveis.length} tese(s) potencialmente aplicável(is) e ${descartadas.length} tese(s) descartada(s) com justificativa técnica.`);

  if (aplicaveis.length > 0) {
    const totalEstimativa = aplicaveis.reduce((acc, t) => acc + t.estimativaRecuperacao, 0);
    partes.push(`Estimativa total preliminar de recuperação: R$ ${totalEstimativa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
  }

  return partes.join(' ');
}

function gerarRecomendacaoGeral(
  aplicaveis: AnaliseTeseCliente[],
  redFlags: RedFlag[],
  prioridade: PrioridadeCliente
): string {
  if (prioridade === 'baixa') {
    return 'Cliente classificado como baixa prioridade devido às RED FLAGS identificadas. Recomenda-se aguardar resolução das pendências antes de prosseguir com a recuperação tributária.';
  }

  if (aplicaveis.length === 0) {
    return 'Não foram identificadas teses aplicáveis ao perfil tributário do cliente no momento. Recomenda-se reavaliação periódica conforme evolução da jurisprudência e alterações no perfil fiscal.';
  }

  const judiciais = aplicaveis.filter(t => t.recomendacaoEstrategica === 'judicial');
  const administrativas = aplicaveis.filter(t => t.recomendacaoEstrategica === 'administrativa');

  const partes: string[] = [];
  if (administrativas.length > 0) {
    partes.push(`${administrativas.length} tese(s) com via administrativa — menor risco e custo operacional.`);
  }
  if (judiciais.length > 0) {
    partes.push(`${judiciais.length} tese(s) com via judicial — maior potencial de recuperação.`);
  }

  return `Recomendação: ${partes.join(' ')} Priorizar teses pacificadas com grau de aderência superior a 70%.`;
}

function formatarRegime(regime: string): string {
  const map: Record<string, string> = {
    simples_nacional: 'Simples Nacional',
    lucro_presumido: 'Lucro Presumido',
    lucro_real: 'Lucro Real',
  };
  return map[regime] || regime;
}
