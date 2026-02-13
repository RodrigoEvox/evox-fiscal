// ============================================================
// Evox Fiscal — Utilitários de Exportação (Excel e PDF)
// ============================================================

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Cliente, Tese, RelatorioAnalise, AnaliseTeseCliente } from './types';

// ---- HELPERS ----

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRegime(regime: string): string {
  const map: Record<string, string> = {
    simples_nacional: 'Simples Nacional',
    lucro_presumido: 'Lucro Presumido',
    lucro_real: 'Lucro Real',
  };
  return map[regime] || regime;
}

function formatPrioridade(p: string): string {
  const map: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
  return map[p] || p;
}

function formatClassificacao(c: string): string {
  const map: Record<string, string> = {
    pacificada: 'Pacificada',
    judicial: 'Judicial',
    administrativa: 'Administrativa',
    controversa: 'Controversa',
  };
  return map[c] || c;
}

function formatRisco(r: string): string {
  const map: Record<string, string> = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };
  return map[r] || r;
}

function formatRecomendacao(r: string): string {
  const map: Record<string, string> = {
    judicial: 'Judicial',
    administrativa: 'Administrativa',
    preventiva: 'Preventiva',
    nao_recomendada: 'Não Recomendada',
  };
  return map[r] || r;
}

// ---- EXCEL EXPORTS ----

export function exportarClientesExcel(clientes: Cliente[]) {
  const data = clientes.map(c => ({
    'CNPJ': c.cnpj,
    'Razão Social': c.razaoSocial,
    'Nome Fantasia': c.nomeFantasia || '',
    'Data Abertura': c.dataAbertura,
    'Regime Tributário': formatRegime(c.regimeTributario),
    'Situação Cadastral': c.situacaoCadastral,
    'CNAE Principal': c.cnaePrincipal,
    'Segmento': c.segmentoEconomico,
    'Estado': c.estado,
    'Industrializa': c.industrializa ? 'Sim' : 'Não',
    'Comercializa': c.comercializa ? 'Sim' : 'Não',
    'Presta Serviços': c.prestaServicos ? 'Sim' : 'Não',
    'Contribuinte ICMS': c.contribuinteICMS ? 'Sim' : 'Não',
    'Contribuinte IPI': c.contribuinteIPI ? 'Sim' : 'Não',
    'Faturamento Médio': c.faturamentoMedioMensal,
    'Valor Médio Guias': c.valorMedioGuias,
    'Folha Pagamento': c.folhaPagamentoMedia,
    'Prioridade': formatPrioridade(c.prioridade),
    'Score Oportunidade': c.scoreOportunidade || 0,
    'Red Flags': c.redFlags.length,
    'Observações': c.observacoes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, `evox_clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportarTesesExcel(teses: Tese[]) {
  const data = teses.map(t => ({
    'Nome': t.nome,
    'Tributo': t.tributoEnvolvido,
    'Tipo': t.tipo.replace(/_/g, ' '),
    'Classificação': formatClassificacao(t.classificacao),
    'Potencial Financeiro': t.potencialFinanceiro,
    'Potencial Mercadológico': t.potencialMercadologico,
    'Grau de Risco': formatRisco(t.grauRisco),
    'Via Judicial': t.necessidadeAcaoJudicial ? 'Sim' : 'Não',
    'Via Administrativa': t.viaAdministrativa ? 'Sim' : 'Não',
    'Prazo Prescricional': t.prazoPrescricional,
    'Fundamentação Legal': t.fundamentacaoLegal,
    'Parecer Técnico/Jurídico': t.parecerTecnicoJuridico,
    'Aplicável Comércio': t.aplicavelComercio ? 'Sim' : 'Não',
    'Aplicável Indústria': t.aplicavelIndustria ? 'Sim' : 'Não',
    'Aplicável Serviço': t.aplicavelServico ? 'Sim' : 'Não',
    'Aplicável Lucro Real': t.aplicavelLucroReal ? 'Sim' : 'Não',
    'Aplicável Lucro Presumido': t.aplicavelLucroPresumido ? 'Sim' : 'Não',
    'Aplicável Simples Nacional': t.aplicavelSimplesNacional ? 'Sim' : 'Não',
    'Ativa': t.ativa ? 'Sim' : 'Não',
    'Versão': t.versao,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Teses Tributárias');
  XLSX.writeFile(wb, `evox_teses_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportarAnaliseExcel(relatorio: RelatorioAnalise) {
  const wb = XLSX.utils.book_new();

  // Aba 1: Resumo
  const resumo = [{
    'Cliente': relatorio.clienteNome,
    'Data Análise': new Date(relatorio.dataAnalise).toLocaleDateString('pt-BR'),
    'Score Oportunidade': relatorio.scoreOportunidade,
    'Prioridade': formatPrioridade(relatorio.prioridade),
    'Teses Aplicáveis': relatorio.tesesAplicaveis.length,
    'Teses Descartadas': relatorio.tesesDescartadas.length,
    'Red Flags': relatorio.redFlags.length,
    'Diagnóstico': relatorio.diagnosticoTributario,
    'Recomendação': relatorio.recomendacaoGeral,
  }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumo), 'Resumo');

  // Aba 2: Teses Aplicáveis
  const aplicaveis = relatorio.tesesAplicaveis.map(t => ({
    'Tese': t.teseNome,
    'Grau Aderência': `${t.grauAderencia}%`,
    'Risco Jurídico': formatRisco(t.riscoJuridico),
    'Estimativa Recuperação': t.estimativaRecuperacao,
    'Recomendação': formatRecomendacao(t.recomendacaoEstrategica),
    'Complexidade': t.complexidadeOperacional,
    'Segurança Jurídica': `${t.segurancaJuridica}%`,
    'Fundamentação': t.fundamentacaoAplicabilidade,
    'Justificativa': t.justificativaTecnica,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aplicaveis), 'Teses Aplicáveis');

  // Aba 3: Teses Descartadas
  const descartadas = relatorio.tesesDescartadas.map(t => ({
    'Tese': t.teseNome,
    'Motivo Exclusão': t.motivoExclusao || '',
    'Justificativa Técnica': t.justificativaTecnica,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(descartadas), 'Teses Descartadas');

  // Aba 4: Red Flags
  if (relatorio.redFlags.length > 0) {
    const flags = relatorio.redFlags.map(f => ({
      'Tipo': f.tipo.replace(/_/g, ' '),
      'Descrição': f.descricao,
      'Impacto': f.impacto.replace(/_/g, ' '),
      'Valor': f.valor || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flags), 'Red Flags');
  }

  XLSX.writeFile(wb, `evox_analise_${relatorio.clienteNome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ---- PDF EXPORTS ----

export function exportarAnalisePDF(relatorio: RelatorioAnalise) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header
  doc.setFillColor(10, 37, 64); // #0A2540
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EVOX FISCAL', 15, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Análise de Oportunidades Tributárias', 15, 27);
  doc.text(`Data: ${new Date(relatorio.dataAnalise).toLocaleDateString('pt-BR')}`, pageWidth - 60, 27);

  y = 45;

  // Cliente Info
  doc.setTextColor(10, 37, 64);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Cliente', 15, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Cliente: ${relatorio.clienteNome}`, 15, y); y += 5;
  doc.text(`Score de Oportunidade: ${relatorio.scoreOportunidade}/100`, 15, y); y += 5;
  doc.text(`Prioridade: ${formatPrioridade(relatorio.prioridade)}`, 15, y); y += 5;
  doc.text(`Teses Aplicáveis: ${relatorio.tesesAplicaveis.length} | Descartadas: ${relatorio.tesesDescartadas.length}`, 15, y); y += 10;

  // Diagnóstico
  doc.setTextColor(10, 37, 64);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnóstico Tributário', 15, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const diagLines = doc.splitTextToSize(relatorio.diagnosticoTributario, pageWidth - 30);
  doc.text(diagLines, 15, y);
  y += diagLines.length * 4 + 8;

  // Red Flags
  if (relatorio.redFlags.length > 0) {
    doc.setTextColor(220, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RED FLAGS', 15, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Tipo', 'Descrição', 'Impacto']],
      body: relatorio.redFlags.map(f => [
        f.tipo.replace(/_/g, ' ').toUpperCase(),
        f.descricao,
        f.impacto.replace(/_/g, ' ').toUpperCase(),
      ]),
      headStyles: { fillColor: [220, 50, 50], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7, textColor: [60, 60, 60] },
      margin: { left: 15, right: 15 },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Teses Aplicáveis
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setTextColor(10, 37, 64);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Teses Aplicáveis', 15, y);
  y += 6;

  if (relatorio.tesesAplicaveis.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Tese', 'Aderência', 'Risco', 'Estimativa', 'Recomendação']],
      body: relatorio.tesesAplicaveis.map(t => [
        t.teseNome,
        `${t.grauAderencia}%`,
        formatRisco(t.riscoJuridico),
        formatCurrency(t.estimativaRecuperacao),
        formatRecomendacao(t.recomendacaoEstrategica),
      ]),
      headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7, textColor: [60, 60, 60] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: 15, right: 15 },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Teses Descartadas
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setTextColor(10, 37, 64);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Teses Descartadas', 15, y);
  y += 6;

  if (relatorio.tesesDescartadas.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Tese', 'Motivo da Exclusão']],
      body: relatorio.tesesDescartadas.map(t => [
        t.teseNome,
        t.motivoExclusao || t.justificativaTecnica,
      ]),
      headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7, textColor: [60, 60, 60] },
      columnStyles: {
        0: { cellWidth: 60 },
      },
      margin: { left: 15, right: 15 },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Recomendação Geral
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setTextColor(10, 37, 64);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Recomendação Estratégica', 15, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const recLines = doc.splitTextToSize(relatorio.recomendacaoGeral, pageWidth - 30);
  doc.text(recLines, 15, y);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Evox Fiscal — Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} — Página ${i}/${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`evox_relatorio_${relatorio.clienteNome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportarClientesPDF(clientes: Cliente[]) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(10, 37, 64);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EVOX FISCAL — Relatório de Clientes', 15, 16);

  autoTable(doc, {
    startY: 35,
    head: [['CNPJ', 'Razão Social', 'Regime', 'Situação', 'Estado', 'Faturamento', 'Guias', 'Prioridade', 'Score', 'Red Flags']],
    body: clientes.map(c => [
      c.cnpj,
      c.razaoSocial,
      formatRegime(c.regimeTributario),
      c.situacaoCadastral,
      c.estado,
      formatCurrency(c.faturamentoMedioMensal),
      formatCurrency(c.valorMedioGuias),
      formatPrioridade(c.prioridade),
      `${c.scoreOportunidade || 0}`,
      `${c.redFlags.length}`,
    ]),
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: [60, 60, 60] },
    margin: { left: 10, right: 10 },
    theme: 'grid',
  });

  doc.save(`evox_clientes_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportarTesesPDF(teses: Tese[]) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(10, 37, 64);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EVOX FISCAL — Repositório de Teses Tributárias', 15, 16);

  autoTable(doc, {
    startY: 35,
    head: [['Nome', 'Tributo', 'Classificação', 'Pot. Financeiro', 'Pot. Mercadológico', 'Risco', 'Via', 'Ativa']],
    body: teses.map(t => [
      t.nome,
      t.tributoEnvolvido,
      formatClassificacao(t.classificacao),
      t.potencialFinanceiro,
      t.potencialMercadologico,
      formatRisco(t.grauRisco),
      t.necessidadeAcaoJudicial ? 'Judicial' : 'Administrativa',
      t.ativa ? 'Sim' : 'Não',
    ]),
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: [60, 60, 60] },
    columnStyles: { 0: { cellWidth: 70 } },
    margin: { left: 10, right: 10 },
    theme: 'grid',
  });

  doc.save(`evox_teses_${new Date().toISOString().split('T')[0]}.pdf`);
}
