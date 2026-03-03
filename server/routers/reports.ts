import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { getDb } from '../db';

interface ClienteData {
  id: number;
  nomeFantasia?: string;
  razaoSocial?: string;
  cnpj?: string;
  porte?: string;
  regimeTributario?: string;
  situacaoCadastral?: string;
  capitalSocial?: number;
}

interface TaxOpportunity {
  title: string;
  description: string;
  potentialSavings: number;
  complexity: 'low' | 'medium' | 'high';
  applicableRegimes: string[];
}

const generateTaxOpportunities = (cliente: ClienteData): TaxOpportunity[] => {
  const opportunities: TaxOpportunity[] = [];

  // Oportunidade 1: Regime Tributário
  if (cliente.regimeTributario === 'Lucro Presumido') {
    opportunities.push({
      title: 'Análise de Transição para Lucro Real',
      description:
        'Empresa em Lucro Presumido pode ter oportunidade de economia ao migrar para Lucro Real, especialmente se houver despesas operacionais elevadas.',
      potentialSavings: 5000,
      complexity: 'medium',
      applicableRegimes: ['Lucro Presumido'],
    });
  }

  // Oportunidade 2: Porte da Empresa
  if (cliente.porte === 'EPP') {
    opportunities.push({
      title: 'Benefícios de Empresa de Pequeno Porte',
      description:
        'Empresa qualificada como EPP pode aproveitar benefícios fiscais e contribuições reduzidas em programas específicos.',
      potentialSavings: 3000,
      complexity: 'low',
      applicableRegimes: ['Simples Nacional', 'Lucro Presumido'],
    });
  }

  // Oportunidade 3: Deduções Operacionais
  opportunities.push({
    title: 'Otimização de Deduções Operacionais',
    description:
      'Revisão de despesas dedutíveis, como contribuições sindicais, despesas com treinamento e desenvolvimento profissional.',
    potentialSavings: 2000,
    complexity: 'medium',
    applicableRegimes: ['Lucro Real', 'Lucro Presumido'],
  });

  // Oportunidade 4: Incentivos Fiscais
  if (cliente.porte === 'PME' || cliente.porte === 'EPP') {
    opportunities.push({
      title: 'Programas de Incentivo Fiscal',
      description:
        'Verificar elegibilidade para programas como Lei do Bem (P&D), SUDENE, SUDAM e outros incentivos regionais.',
      potentialSavings: 10000,
      complexity: 'high',
      applicableRegimes: ['Todos'],
    });
  }

  return opportunities;
};

export const reportsRouter = router({
  generateTaxOpportunitiesPDF: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        // Fetch cliente data
        const cliente = await db.query.clientes.findFirst({
          where: (clientes, { eq }) => eq(clientes.id, input.clienteId),
        });

        if (!cliente) {
          throw new Error('Cliente not found');
        }

        // Generate opportunities
        const opportunities = generateTaxOpportunities(cliente as ClienteData);

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();
        const fontSize = 12;
        const margin = 40;

        // Helper function to add text
        const addText = (text: string, y: number, size: number = fontSize, bold = false) => {
          page.drawText(text, {
            x: margin,
            y: height - y,
            size,
            color: rgb(0, 0, 0),
            font: bold ? pdfDoc.getFont('Helvetica-Bold') : pdfDoc.getFont('Helvetica'),
          });
        };

        // Header
        addText('RELATÓRIO DE OPORTUNIDADES TRIBUTÁRIAS', 50, 16, true);
        addText(`Cliente: ${cliente.nomeFantasia || cliente.razaoSocial || 'N/A'}`, 80, 12);
        addText(`CNPJ: ${cliente.cnpj || 'N/A'}`, 100, 12);
        addText(`Porte: ${cliente.porte || 'N/A'}`, 120, 12);
        addText(`Regime Tributário: ${cliente.regimeTributario || 'N/A'}`, 140, 12);
        addText(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 160, 10);

        // Separator line
        page.drawLine({
          start: { x: margin, y: height - 180 },
          end: { x: width - margin, y: height - 180 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        let currentY = 200;

        // Opportunities
        opportunities.forEach((opp, index) => {
          // Check if we need a new page
          if (currentY > height - 100) {
            page = pdfDoc.addPage([595, 842]);
            currentY = 50;
          }

          // Opportunity title
          addText(`${index + 1}. ${opp.title}`, currentY, 12, true);
          currentY += 25;

          // Description
          const descLines = opp.description.match(/.{1,80}/g) || [];
          descLines.forEach(line => {
            addText(line, currentY, 10);
            currentY += 15;
          });

          // Potential savings
          addText(`Economia Potencial: R$ ${opp.potentialSavings.toLocaleString('pt-BR')}`, currentY, 11, true);
          currentY += 20;

          // Complexity
          addText(`Complexidade: ${opp.complexity.charAt(0).toUpperCase() + opp.complexity.slice(1)}`, currentY, 10);
          currentY += 15;

          // Applicable regimes
          addText(`Regimes Aplicáveis: ${opp.applicableRegimes.join(', ')}`, currentY, 10);
          currentY += 25;

          // Separator
          page.drawLine({
            start: { x: margin, y: height - currentY },
            end: { x: width - margin, y: height - currentY },
            thickness: 0.5,
            color: rgb(200, 200, 200),
          });
          currentY += 15;
        });

        // Footer
        page.drawText('Relatório gerado automaticamente pelo Sistema Evox Fiscal', {
          x: margin,
          y: 20,
          size: 9,
          color: rgb(100, 100, 100),
        });

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const base64 = Buffer.from(pdfBytes).toString('base64');

        return {
          success: true,
          pdf: base64,
          fileName: `oportunidades_tributarias_${cliente.cnpj?.replace(/\D/g, '')}_${new Date().getTime()}.pdf`,
          opportunities: opportunities.length,
          totalPotentialSavings: opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0),
        };
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  listOpportunities: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        const cliente = await db.query.clientes.findFirst({
          where: (clientes, { eq }) => eq(clientes.id, input.clienteId),
        });

        if (!cliente) {
          throw new Error('Cliente not found');
        }

        const opportunities = generateTaxOpportunities(cliente as ClienteData);

        return {
          clienteId: input.clienteId,
          clienteName: cliente.nomeFantasia || cliente.razaoSocial || 'N/A',
          opportunities,
          summary: {
            totalOpportunities: opportunities.length,
            totalPotentialSavings: opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0),
            avgComplexity:
              opportunities.length > 0
                ? (opportunities.filter(o => o.complexity === 'high').length / opportunities.length) * 100
                : 0,
          },
        };
      } catch (error) {
        console.error('Error listing opportunities:', error);
        throw new Error(`Failed to list opportunities: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
