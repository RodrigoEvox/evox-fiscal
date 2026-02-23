import PDFDocument from 'pdfkit';

// Color palette
const COLORS = {
  primary: '#1e3a5f',
  secondary: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  gray: '#6b7280',
  lightGray: '#f1f5f9',
  border: '#e2e8f0',
  text: '#1a1a2e',
  muted: '#9ca3af',
};

export interface KPICard {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

export interface TableColumn {
  header: string;
  key: string;
  align?: 'left' | 'right' | 'center';
  width?: number;
  format?: (val: any) => string;
}

export interface TableRow {
  [key: string]: any;
  isTotal?: boolean;
}

export function createPDF(): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
  });
  return doc;
}

export function addHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.fontSize(20).fillColor(COLORS.primary).text(title, { align: 'left' });
  doc.moveDown(0.2);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(COLORS.secondary).lineWidth(2).stroke();
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor(COLORS.gray).text(subtitle, { align: 'left' });
  doc.moveDown(1);
}

export function addKPIs(doc: PDFKit.PDFDocument, kpis: KPICard[]) {
  const startX = 40;
  const cardWidth = (555 - 40 - (kpis.length - 1) * 10) / kpis.length;
  const startY = doc.y;
  const cardHeight = 55;

  kpis.forEach((kpi, i) => {
    const x = startX + i * (cardWidth + 10);
    // Card background
    doc.save();
    doc.roundedRect(x, startY, cardWidth, cardHeight, 4).fillColor(COLORS.lightGray).fill();
    // Left border accent
    doc.rect(x, startY, 3, cardHeight).fillColor(kpi.color).fill();
    doc.restore();

    // Label
    doc.fontSize(7).fillColor(COLORS.gray).text(kpi.label.toUpperCase(), x + 10, startY + 8, { width: cardWidth - 15 });
    // Value
    doc.fontSize(16).fillColor(COLORS.text).text(kpi.value, x + 10, startY + 20, { width: cardWidth - 15 });
    // Sub
    if (kpi.sub) {
      doc.fontSize(7).fillColor(COLORS.muted).text(kpi.sub, x + 10, startY + 40, { width: cardWidth - 15 });
    }
  });

  doc.y = startY + cardHeight + 15;
  doc.x = 40;
}

export function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  if (doc.y > 700) doc.addPage();
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(COLORS.primary).text(title);
  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

export function addTable(doc: PDFKit.PDFDocument, columns: TableColumn[], rows: TableRow[]) {
  const tableWidth = 515;
  const startX = 40;
  const rowHeight = 18;
  const totalCols = columns.reduce((s, c) => s + (c.width || 1), 0);

  // Header
  if (doc.y > 720) doc.addPage();
  let y = doc.y;
  doc.rect(startX, y, tableWidth, rowHeight).fillColor(COLORS.primary).fill();
  let x = startX;
  columns.forEach(col => {
    const colWidth = ((col.width || 1) / totalCols) * tableWidth;
    doc.fontSize(7).fillColor('#ffffff').text(
      col.header.toUpperCase(),
      x + 4, y + 5,
      { width: colWidth - 8, align: col.align || 'left' }
    );
    x += colWidth;
  });
  y += rowHeight;

  // Rows
  rows.forEach((row, ri) => {
    if (y > 760) {
      doc.addPage();
      y = 40;
      // Re-draw header on new page
      doc.rect(startX, y, tableWidth, rowHeight).fillColor(COLORS.primary).fill();
      let hx = startX;
      columns.forEach(col => {
        const colWidth = ((col.width || 1) / totalCols) * tableWidth;
        doc.fontSize(7).fillColor('#ffffff').text(
          col.header.toUpperCase(),
          hx + 4, y + 5,
          { width: colWidth - 8, align: col.align || 'left' }
        );
        hx += colWidth;
      });
      y += rowHeight;
    }

    const bgColor = row.isTotal ? '#e8f0fe' : (ri % 2 === 0 ? '#ffffff' : COLORS.lightGray);
    doc.rect(startX, y, tableWidth, rowHeight).fillColor(bgColor).fill();

    x = startX;
    columns.forEach(col => {
      const colWidth = ((col.width || 1) / totalCols) * tableWidth;
      const val = col.format ? col.format(row[col.key]) : String(row[col.key] ?? '');
      doc.fontSize(8).fillColor(row.isTotal ? COLORS.primary : COLORS.text).text(
        val,
        x + 4, y + 5,
        { width: colWidth - 8, align: col.align || 'left' }
      );
      x += colWidth;
    });
    y += rowHeight;
  });

  doc.y = y + 10;
  doc.x = 40;
}

export function addFooter(doc: PDFKit.PDFDocument) {
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(COLORS.muted).text(
      `Evox Fiscal — Gente & Gestão | Página ${i + 1} de ${pages.count}`,
      40, 780,
      { align: 'center', width: 515 }
    );
  }
}

export function addTextBlock(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(9).fillColor(COLORS.text).text(text, { align: 'left' });
  doc.moveDown(0.5);
}

export function fmtCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export function fmtDate(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
