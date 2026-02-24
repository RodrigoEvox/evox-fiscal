/**
 * Gera PDFs para o módulo de Ocorrências e Plano de Reversão
 * - Dashboard RH consolidado
 * - Histórico Disciplinar individual do colaborador
 */

const TIPO_LABELS: Record<string, string> = {
  falta_injustificada: 'Falta Injustificada',
  atraso_frequente: 'Atraso Frequente',
  falta_leve: 'Falta Leve',
  falta_media: 'Falta Média',
  falta_grave: 'Falta Grave',
  falta_gravissima: 'Falta Gravíssima',
  erro_trabalho: 'Erro na Execução',
  conduta_inapropriada: 'Conduta Inapropriada',
  conflito_interno: 'Conflito Interno',
};

const GRAVIDADE_LABELS: Record<string, string> = {
  leve: 'Leve',
  media: 'Média',
  grave: 'Grave',
  gravissima: 'Gravíssima',
};

const RECOMENDACAO_LABELS: Record<string, string> = {
  advertencia: 'Advertência',
  suspensao: 'Suspensão',
  reversao: 'Plano de Reversão',
  desligamento: 'Desligamento',
};

const STATUS_LABELS: Record<string, string> = {
  registrada: 'Registrada',
  em_analise: 'Em Análise',
  resolvida: 'Resolvida',
  encaminhada_reversao: 'Em Reversão',
  encaminhada_desligamento: 'Enc. Desligamento',
};

const PLANO_STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  concluido_sucesso: 'Concluído (Sucesso)',
  concluido_fracasso: 'Concluído (Fracasso)',
  cancelado: 'Cancelado',
};

function formatDateBR(d: string) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  secondary: [100, 116, 139] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  warning: [217, 119, 6] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
};

// ===== DASHBOARD RH PDF =====
interface DashboardData {
  porSetor: { setor: string; count: number }[];
  porTipo: { tipo: string; count: number }[];
  porMes: { mes: string; count: number }[];
  planosReversaoStats: {
    total: number;
    ativos: number;
    sucesso: number;
    fracasso: number;
    cancelados: number;
    taxaSucesso: number;
  };
  topReincidentes: { colaboradorId: number; nome: string; setor: string; cargo: string; count: number }[];
}

export async function generateDashboardPdf(data: DashboardData) {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkNewPage(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  }

  function drawLine(yPos: number) {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  }

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Dashboard RH — Ocorrências e Planos de Reversão', margin, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, 26);
  doc.text('Evox Fiscal — Sistema de Gestão', pageWidth - margin, 26, { align: 'right' });
  y = 45;

  // KPIs
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicadores Gerais', margin, y);
  y += 8;

  const kpis = [
    { label: 'Total de Planos', value: String(data.planosReversaoStats.total) },
    { label: 'Planos Ativos', value: String(data.planosReversaoStats.ativos) },
    { label: 'Taxa de Sucesso', value: `${data.planosReversaoStats.taxaSucesso}%` },
    { label: 'Reincidentes (3+)', value: String(data.topReincidentes.length) },
  ];

  const kpiWidth = contentWidth / 4;
  for (let i = 0; i < kpis.length; i++) {
    const x = margin + i * kpiWidth;
    doc.setFillColor(...COLORS.bg);
    doc.roundedRect(x + 1, y, kpiWidth - 2, 18, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(kpis[i].label, x + kpiWidth / 2, y + 7, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(kpis[i].value, x + kpiWidth / 2, y + 15, { align: 'center' });
  }
  y += 26;

  drawLine(y);
  y += 6;

  // Ocorrências por Tipo
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ocorrências por Tipo', margin, y);
  y += 4;

  if (data.porTipo.length > 0) {
    (autoTable as any)(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Tipo de Ocorrência', 'Quantidade', '% do Total']],
      body: data.porTipo.map(t => {
        const total = data.porTipo.reduce((s, x) => s + x.count, 0);
        return [TIPO_LABELS[t.tipo] || t.tipo, String(t.count), `${total > 0 ? Math.round((t.count / total) * 100) : 0}%`];
      }),
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.muted);
    doc.text('Sem dados disponíveis', margin, y + 4);
    y += 10;
  }

  checkNewPage(40);

  // Ocorrências por Setor
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ocorrências por Setor', margin, y);
  y += 4;

  if (data.porSetor.length > 0) {
    (autoTable as any)(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Setor', 'Quantidade']],
      body: data.porSetor.map(s => [s.setor, String(s.count)]),
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  checkNewPage(40);

  // Evolução Temporal
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Evolução Temporal de Ocorrências', margin, y);
  y += 4;

  if (data.porMes.length > 0) {
    (autoTable as any)(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Mês', 'Ocorrências']],
      body: data.porMes.map(m => [m.mes, String(m.count)]),
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  checkNewPage(40);

  // Planos de Reversão Stats
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Planos de Reversão — Resumo', margin, y);
  y += 4;

  const ps = data.planosReversaoStats;
  (autoTable as any)(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de Planos', String(ps.total)],
      ['Ativos', String(ps.ativos)],
      ['Concluídos com Sucesso', String(ps.sucesso)],
      ['Concluídos com Fracasso', String(ps.fracasso)],
      ['Cancelados', String(ps.cancelados)],
      ['Taxa de Sucesso', `${ps.taxaSucesso}%`],
    ],
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold' } },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  checkNewPage(40);

  // Top Reincidentes
  if (data.topReincidentes.length > 0) {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Colaboradores com Maior Número de Ocorrências', margin, y);
    y += 4;

    (autoTable as any)(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Colaborador', 'Cargo', 'Setor', 'Ocorrências', 'Nível de Risco']],
      body: data.topReincidentes.map(r => [
        r.nome,
        r.cargo || '—',
        r.setor || '—',
        String(r.count),
        r.count >= 5 ? 'Crítico' : r.count >= 3 ? 'Alto' : 'Moderado',
      ]),
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Evox Fiscal — Dashboard RH — Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  doc.save('dashboard-rh-ocorrencias.pdf');
}

// ===== HISTÓRICO DISCIPLINAR PDF =====
interface HistoricoData {
  colaboradorNome: string;
  cargo?: string;
  setor?: string;
  ocorrencias: any[];
  planos: any[];
  resumo: {
    totalOcorrencias: number;
    reversiveis: number;
    irreversiveis: number;
    planosAtivos: number;
    planosConcluidos: number;
  };
}

export async function generateHistoricoDisciplinarPdf(data: HistoricoData) {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  function checkNewPage(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  }

  function drawLine(yPos: number) {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  }

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Histórico Disciplinar — ${data.colaboradorNome}`, margin, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoLine = [data.cargo, data.setor].filter(Boolean).join(' — ');
  doc.text(infoLine || '', margin, 26);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 26, { align: 'right' });
  y = 45;

  // Resumo
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo', margin, y);
  y += 6;

  (autoTable as any)(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de Ocorrências', String(data.resumo.totalOcorrencias)],
      ['Reversíveis', String(data.resumo.reversiveis)],
      ['Irreversíveis', String(data.resumo.irreversiveis)],
      ['Planos Ativos', String(data.resumo.planosAtivos)],
      ['Planos Concluídos', String(data.resumo.planosConcluidos)],
    ],
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold' } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  drawLine(y);
  y += 6;

  // Ocorrências
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ocorrências Registradas', margin, y);
  y += 4;

  if (data.ocorrencias.length > 0) {
    (autoTable as any)(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Data', 'Tipo', 'Gravidade', 'Classificação', 'Recomendação', 'Status']],
      body: data.ocorrencias.map((o: any) => [
        formatDateBR(o.dataOcorrencia),
        TIPO_LABELS[o.tipo] || o.tipo,
        GRAVIDADE_LABELS[o.gravidade] || o.gravidade,
        o.classificacao === 'reversivel' ? 'Reversível' : 'Irreversível',
        RECOMENDACAO_LABELS[o.recomendacao] || o.recomendacao,
        STATUS_LABELS[o.status] || o.status,
      ]),
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Detalhes de cada ocorrência
    for (const o of data.ocorrencias) {
      checkNewPage(40);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(`Ocorrência #${o.id} — ${formatDateBR(o.dataOcorrencia)} — ${TIPO_LABELS[o.tipo] || o.tipo}`, margin, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);

      if (o.descricao) {
        const lines = doc.splitTextToSize(`Descrição: ${o.descricao}`, pageWidth - margin * 2);
        checkNewPage(lines.length * 4 + 4);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      }
      if (o.evidencias) {
        const lines = doc.splitTextToSize(`Evidências: ${o.evidencias}`, pageWidth - margin * 2);
        checkNewPage(lines.length * 4 + 4);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      }
      if (o.testemunhas) {
        doc.text(`Testemunhas: ${o.testemunhas}`, margin, y);
        y += 5;
      }
      if (o.medidasTomadas) {
        doc.text(`Medidas Tomadas: ${o.medidasTomadas}`, margin, y);
        y += 5;
      }
      y += 3;
    }
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.muted);
    doc.text('Nenhuma ocorrência registrada para este colaborador.', margin, y + 4);
    y += 12;
  }

  checkNewPage(30);
  drawLine(y);
  y += 6;

  // Planos de Reversão
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Planos de Reversão', margin, y);
  y += 4;

  if (data.planos.length > 0) {
    (autoTable as any)(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Período', 'Responsável', 'Status', 'Frequência']],
      body: data.planos.map((p: any) => [
        `${formatDateBR(p.dataInicio)} a ${formatDateBR(p.dataFim)}`,
        p.responsavel,
        PLANO_STATUS_LABELS[p.status] || p.status,
        p.frequenciaAcompanhamento || '—',
      ]),
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Detalhes de cada plano
    for (const p of data.planos) {
      checkNewPage(30);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(`Plano #${p.id} — ${formatDateBR(p.dataInicio)} a ${formatDateBR(p.dataFim)}`, margin, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);

      if (p.motivo) {
        const lines = doc.splitTextToSize(`Motivo: ${p.motivo}`, pageWidth - margin * 2);
        checkNewPage(lines.length * 4 + 4);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      }
      if (p.objetivos) {
        const lines = doc.splitTextToSize(`Objetivos: ${p.objetivos}`, pageWidth - margin * 2);
        checkNewPage(lines.length * 4 + 4);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      }
      if (p.resultadoFinal) {
        const lines = doc.splitTextToSize(`Resultado Final: ${p.resultadoFinal}`, pageWidth - margin * 2);
        checkNewPage(lines.length * 4 + 4);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      }
      y += 3;
    }
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.muted);
    doc.text('Nenhum plano de reversão registrado para este colaborador.', margin, y + 4);
    y += 12;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Evox Fiscal — Histórico Disciplinar — ${data.colaboradorNome} — Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  doc.save(`historico-disciplinar-${data.colaboradorNome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
