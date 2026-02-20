/**
 * Gera PDF dos resultados da Pesquisa de Clima Organizacional
 * Usa jsPDF para gerar o relatório no frontend
 */

interface PerguntaResult {
  id: number;
  texto: string;
  tipo: string;
  opcoes?: any;
  categoria?: string;
  obrigatoria?: boolean;
}

interface RespostaResult {
  perguntaId: number;
  valorEscala?: number;
  valorTexto?: string;
  valorOpcao?: string;
}

interface PesquisaData {
  titulo: string;
  descricao?: string;
  anonima?: boolean;
  status: string;
  dataInicio?: string;
  dataFim?: string;
  totalRespostas?: number;
  criadoPorNome?: string;
}

function formatDateBR(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export async function generatePesquisaClimaPdf(
  pesquisa: PesquisaData,
  perguntas: PerguntaResult[],
  respostas: RespostaResult[]
) {
  // Dynamically import jsPDF
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const COLORS = {
    primary: [30, 64, 175] as [number, number, number],      // Blue-800
    secondary: [100, 116, 139] as [number, number, number],   // Slate-500
    success: [22, 163, 74] as [number, number, number],       // Green-600
    danger: [220, 38, 38] as [number, number, number],        // Red-600
    warning: [217, 119, 6] as [number, number, number],       // Amber-600
    text: [15, 23, 42] as [number, number, number],           // Slate-900
    muted: [100, 116, 139] as [number, number, number],       // Slate-500
    bg: [248, 250, 252] as [number, number, number],          // Slate-50
    border: [226, 232, 240] as [number, number, number],      // Slate-200
    barFill: [59, 130, 246] as [number, number, number],      // Blue-500
    barBg: [226, 232, 240] as [number, number, number],       // Slate-200
  };

  function checkNewPage(needed: number) {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  }

  function drawLine(yPos: number, color: [number, number, number] = COLORS.border) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  }

  // ========== HEADER ==========
  // Background header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Pesquisa de Clima', margin, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Evox Fiscal — Gente & Gestão', margin, 28);

  // Date
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 28, { align: 'right' });

  y = 50;

  // ========== PESQUISA INFO ==========
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(pesquisa.titulo, margin, y);
  y += 8;

  if (pesquisa.descricao) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    const descLines = doc.splitTextToSize(pesquisa.descricao, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;
  }

  // Info box
  doc.setFillColor(...COLORS.bg);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);

  const infoItems = [];
  if (pesquisa.dataInicio) infoItems.push(`Início: ${formatDateBR(pesquisa.dataInicio)}`);
  if (pesquisa.dataFim) infoItems.push(`Fim: ${formatDateBR(pesquisa.dataFim)}`);
  infoItems.push(`Status: ${pesquisa.status?.toUpperCase()}`);
  infoItems.push(`Anônima: ${pesquisa.anonima ? 'Sim' : 'Não'}`);
  if (pesquisa.criadoPorNome) infoItems.push(`Criada por: ${pesquisa.criadoPorNome}`);

  doc.text(infoItems.join('   |   '), margin + 4, y + 8);

  // Total respostas highlight
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(`${pesquisa.totalRespostas || respostas.length} resposta(s)`, margin + 4, y + 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(`${perguntas.length} pergunta(s)`, margin + 60, y + 17);

  y += 30;
  drawLine(y);
  y += 8;

  // ========== RESULTADOS POR PERGUNTA ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Resultados por Pergunta', margin, y);
  y += 10;

  perguntas.forEach((pergunta, idx) => {
    const resps = respostas.filter(r => r.perguntaId === pergunta.id);

    // Estimate space needed
    let spaceNeeded = 30;
    if (pergunta.tipo === 'escala') spaceNeeded = 45;
    if (pergunta.tipo === 'sim_nao') spaceNeeded = 40;
    if (pergunta.tipo === 'multipla_escolha' && pergunta.opcoes) {
      const opts = Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [];
      spaceNeeded = 30 + opts.length * 10;
    }
    if (pergunta.tipo === 'texto_livre') {
      spaceNeeded = 30 + Math.min(resps.length, 5) * 12;
    }

    checkNewPage(spaceNeeded);

    // Question header
    doc.setFillColor(...COLORS.bg);
    doc.roundedRect(margin, y, contentWidth, spaceNeeded, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    const questionText = `${idx + 1}. ${pergunta.texto}`;
    const questionLines = doc.splitTextToSize(questionText, contentWidth - 8);
    doc.text(questionLines, margin + 4, y + 7);

    let qy = y + 7 + questionLines.length * 5;

    // Category and type badges
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    const tipoLabel = pergunta.tipo === 'escala' ? 'Escala (1-5)' :
      pergunta.tipo === 'sim_nao' ? 'Sim/Não' :
      pergunta.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Texto Livre';
    const metaText = `${tipoLabel}${pergunta.categoria ? ` | ${pergunta.categoria}` : ''} | ${resps.length} resposta(s)`;
    doc.text(metaText, margin + 4, qy);
    qy += 6;

    // ---- ESCALA ----
    if (pergunta.tipo === 'escala') {
      const avg = resps.length > 0
        ? resps.reduce((sum, r) => sum + (r.valorEscala || 0), 0) / resps.length
        : 0;

      // Draw bar
      const barWidth = contentWidth - 50;
      const barHeight = 8;
      doc.setFillColor(...COLORS.barBg);
      doc.roundedRect(margin + 4, qy, barWidth, barHeight, 2, 2, 'F');
      doc.setFillColor(...COLORS.barFill);
      doc.roundedRect(margin + 4, qy, barWidth * (avg / 5), barHeight, 2, 2, 'F');

      // Score
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(avg.toFixed(2), margin + barWidth + 10, qy + 7);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.muted);
      doc.text('de 5.0', margin + barWidth + 10, qy + 12);

      // Distribution
      qy += 16;
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      const dist = [1, 2, 3, 4, 5].map(v => {
        const count = resps.filter(r => r.valorEscala === v).length;
        return `${v}: ${count}`;
      });
      doc.text(`Distribuição: ${dist.join('  |  ')}`, margin + 4, qy);
    }

    // ---- SIM/NÃO ----
    if (pergunta.tipo === 'sim_nao') {
      const sim = resps.filter(r => r.valorOpcao === 'sim').length;
      const nao = resps.filter(r => r.valorOpcao === 'nao').length;
      const total = sim + nao;
      const pctSim = total > 0 ? (sim / total * 100).toFixed(1) : '0.0';
      const pctNao = total > 0 ? (nao / total * 100).toFixed(1) : '0.0';

      // Sim bar
      doc.setFillColor(...COLORS.success);
      const simBarW = total > 0 ? (contentWidth - 60) * (sim / total) : 0;
      doc.roundedRect(margin + 4, qy, Math.max(simBarW, 2), 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.success);
      doc.text(`Sim: ${sim} (${pctSim}%)`, margin + Math.max(simBarW, 2) + 8, qy + 6);

      qy += 12;

      // Não bar
      doc.setFillColor(...COLORS.danger);
      const naoBarW = total > 0 ? (contentWidth - 60) * (nao / total) : 0;
      doc.roundedRect(margin + 4, qy, Math.max(naoBarW, 2), 8, 2, 2, 'F');
      doc.setTextColor(...COLORS.danger);
      doc.text(`Não: ${nao} (${pctNao}%)`, margin + Math.max(naoBarW, 2) + 8, qy + 6);
    }

    // ---- MÚLTIPLA ESCOLHA ----
    if (pergunta.tipo === 'multipla_escolha' && pergunta.opcoes) {
      const opcoes: Record<string, number> = {};
      const opList = Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [];
      opList.forEach((op: string) => { opcoes[op] = 0; });
      resps.forEach(r => { if (r.valorOpcao) opcoes[r.valorOpcao] = (opcoes[r.valorOpcao] || 0) + 1; });
      const maxVotes = Math.max(...Object.values(opcoes), 1);

      Object.entries(opcoes).forEach(([opcao, votos]) => {
        const barW = (contentWidth - 80) * (votos / maxVotes);
        doc.setFillColor(...COLORS.barFill);
        doc.roundedRect(margin + 40, qy, Math.max(barW, 2), 7, 1, 1, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        const opcaoTrunc = opcao.length > 15 ? opcao.substring(0, 15) + '…' : opcao;
        doc.text(opcaoTrunc, margin + 4, qy + 5);

        doc.setTextColor(...COLORS.muted);
        doc.text(`${votos}`, margin + 42 + Math.max(barW, 2), qy + 5);

        qy += 10;
      });
    }

    // ---- TEXTO LIVRE ----
    if (pergunta.tipo === 'texto_livre') {
      const textos = resps.map(r => r.valorTexto).filter(Boolean);
      if (textos.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.muted);
        doc.text('Nenhuma resposta de texto recebida.', margin + 4, qy + 4);
      } else {
        textos.slice(0, 5).forEach((t) => {
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.text);
          const lines = doc.splitTextToSize(`"${t}"`, contentWidth - 12);
          doc.text(lines, margin + 6, qy + 4);
          qy += lines.length * 4 + 4;
        });
        if (textos.length > 5) {
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.muted);
          doc.text(`+${textos.length - 5} resposta(s) adicionais`, margin + 6, qy + 2);
        }
      }
    }

    y += spaceNeeded + 6;
  });

  // ========== RESUMO GERAL ==========
  checkNewPage(50);
  drawLine(y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Resumo Geral', margin, y);
  y += 10;

  // Compute overall stats
  const escalas = perguntas.filter(p => p.tipo === 'escala');
  if (escalas.length > 0) {
    const mediaGeral = escalas.reduce((acc, p) => {
      const resps = respostas.filter(r => r.perguntaId === p.id);
      const avg = resps.length > 0 ? resps.reduce((s, r) => s + (r.valorEscala || 0), 0) / resps.length : 0;
      return acc + avg;
    }, 0) / escalas.length;

    doc.setFillColor(...COLORS.bg);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text('Média Geral (perguntas de escala):', margin + 4, y + 8);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(mediaGeral.toFixed(2), margin + 4, y + 17);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(`de 5.0 (${escalas.length} pergunta(s) de escala)`, margin + 24, y + 17);

    y += 26;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(`Evox Fiscal — Pesquisa de Clima Organizacional`, margin, pageHeight - 10);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // Save
  const filename = `pesquisa-clima-${pesquisa.titulo.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
