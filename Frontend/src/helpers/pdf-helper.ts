import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDateTime } from './format-helper';
import { formatQuantityPretty } from './line-item-calc';
import type IInvoiceResponse from '../models/response/IInvoiceResponse';
import type ISettingsResponse from '../models/response/ISettingsResponse';
import type { IPublicSettingsResponse } from '../models/response/ISettingsResponse';

type InvoiceSettings = ISettingsResponse | IPublicSettingsResponse | null | undefined;
type RGB = [number, number, number];

// jsPDF's built-in fonts (Helvetica/Times/Courier) use WinAnsi encoding, which has no
// glyph for ₹ — it renders as a broken/garbled character. Swap it for "Rs." only in
// PDF output; the browser-rendered print HTML below keeps the real ₹ symbol.
function formatCurrencyForPdf(value: number | undefined | null): string {
  return formatCurrency(value).replace('₹', 'Rs. ');
}

function hexToRgb(hex: string, fallback: RGB): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Brand colours for the document, read from the active theme so the PDF matches the app. */
function themeColors() {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: RGB) => hexToRgb(css.getPropertyValue(name), fallback);
  return {
    dark: read('--color-primary-dark', [20, 83, 45]),
    mid: read('--color-primary-mid', [22, 163, 74]),
    light: read('--color-primary-light', [220, 252, 231]),
    accent: read('--color-accent-mid', [234, 179, 8]),
  };
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Milk-drop badge drawn with vector primitives (no image files). */
function drawLogo(doc: jsPDF, x: number, y: number, size: number, colors: ReturnType<typeof themeColors>) {
  doc.setFillColor(...colors.mid);
  doc.roundedRect(x, y, size, size, size * 0.28, size * 0.28, 'F');
  const cx = x + size / 2;
  const r = size * 0.24;
  const cy = y + size * 0.6;
  doc.setFillColor(255, 253, 246);
  doc.circle(cx, cy, r, 'F');
  doc.triangle(cx, y + size * 0.16, cx - r * 0.93, cy - r * 0.35, cx + r * 0.93, cy - r * 0.35, 'F');
  doc.setFillColor(...colors.accent);
  doc.ellipse(x + size * 0.76, y + size * 0.78, size * 0.1, size * 0.05, 'F');
}

/** Two soft pasture hills along the bottom edge of the page. */
function drawHills(doc: jsPDF, pageWidth: number, pageHeight: number, colors: ReturnType<typeof themeColors>) {
  doc.setFillColor(...colors.light);
  doc.lines(
    [
      [pageWidth * 0.18, -30, pageWidth * 0.36, -34, pageWidth * 0.52, -14],
      [pageWidth * 0.2, 14, pageWidth * 0.36, 8, pageWidth * 0.48, -12],
      [0, 0, 0, 0, 0, 0],
    ],
    0,
    pageHeight - 8,
    [1, 1],
    'F',
  );
  doc.setFillColor(...colors.mid);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
}

export function downloadInvoicePdf(invoice: IInvoiceResponse, settings: InvoiceSettings): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginX = 40;
  const right = pageWidth - marginX;
  const colors = themeColors();
  const shopName = settings?.shopName || 'Vijay Dairy';

  // ---- Header band ----
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 112, 'F');
  doc.setFillColor(...colors.accent);
  doc.rect(0, 112, pageWidth, 3, 'F');

  drawLogo(doc, marginX, 30, 48, colors);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(shopName, marginX + 62, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(210, 235, 218);
  doc.text('Fresh from the farm. Daily.', marginX + 62, 71);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('INVOICE', right, 56, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(210, 235, 218);
  doc.text(`No. ${invoice.invoiceNumber}`, right, 74, { align: 'right' });
  doc.text(formatDateTime(invoice.createdAt), right, 88, { align: 'right' });

  // ---- Shop details ----
  let y = 146;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('FROM', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text(shopName, marginX, y);
  doc.setFont('helvetica', 'normal');
  if (settings?.address) {
    y += 13;
    doc.text(settings.address, marginX, y);
  }
  if (settings?.phone) {
    y += 13;
    doc.text(`Phone: ${settings.phone}`, marginX, y);
  }
  if (settings?.gstNumber) {
    y += 13;
    doc.text(`GSTIN: ${settings.gstNumber}`, marginX, y);
  }

  // ---- Items table ----
  autoTable(doc, {
    startY: Math.max(y + 24, 210),
    head: [['#', 'Item', 'Quantity', 'Rate', 'Discount', 'Amount']],
    body: invoice.items.map((item, idx) => [
      idx + 1,
      `${item.name} (${item.unit})`,
      formatQuantityPretty(item.quantity, item.unit),
      `${formatCurrencyForPdf(item.price)} / ${item.unit}`,
      formatCurrencyForPdf(item.discount || 0),
      formatCurrencyForPdf(item.total),
    ]),
    theme: 'plain',
    headStyles: { fillColor: colors.dark, textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 8, bottom: 8, left: 8, right: 8 } },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59], cellPadding: { top: 7, bottom: 7, left: 8, right: 8 } },
    alternateRowStyles: { fillColor: [247, 248, 242] },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'head' && [2, 3, 4, 5].includes(data.column.index)) data.cell.styles.halign = 'right';
    },
    margin: { left: marginX, right: marginX },
  });

  const table = doc as unknown as { lastAutoTable: { finalY: number } };
  let finalY = table.lastAutoTable.finalY + 22;

  // ---- Totals card ----
  const cardW = 230;
  const cardX = right - cardW;
  const lines: Array<[string, string]> = [['Subtotal', formatCurrencyForPdf(invoice.subtotal)]];
  if (invoice.discount > 0) lines.push(['Discount', `- ${formatCurrencyForPdf(invoice.discount)}`]);
  if (invoice.taxAmount > 0) lines.push([`Tax (${invoice.taxPercent}%)`, formatCurrencyForPdf(invoice.taxAmount)]);
  const cardH = 16 + lines.length * 18 + 44;

  if (finalY + cardH > pageHeight - 90) {
    doc.addPage();
    finalY = 60;
  }

  doc.setFillColor(247, 248, 242);
  doc.roundedRect(cardX, finalY, cardW, cardH, 8, 8, 'F');
  let ly = finalY + 24;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  for (const [label, value] of lines) {
    doc.text(label, cardX + 16, ly);
    doc.text(value, cardX + cardW - 16, ly, { align: 'right' });
    ly += 18;
  }
  doc.setFillColor(...colors.dark);
  doc.roundedRect(cardX, finalY + cardH - 40, cardW, 40, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL', cardX + 16, finalY + cardH - 15);
  doc.setFontSize(13);
  doc.text(formatCurrencyForPdf(invoice.total), cardX + cardW - 16, finalY + cardH - 15, { align: 'right' });

  // ---- Notes ----
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.text('NOTES', marginX, finalY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(invoice.notes, marginX, finalY + 38, { maxWidth: cardX - marginX - 20 });
  }

  // ---- Footer ----
  drawHills(doc, pageWidth, pageHeight, colors);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.dark);
  doc.text(settings?.footerNote || 'Thank you for your business!', pageWidth / 2, pageHeight - 42, { align: 'center' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function buildPrintHtml(invoice: IInvoiceResponse, settings: InvoiceSettings): string {
  const css = getComputedStyle(document.documentElement);
  const dark = css.getPropertyValue('--color-primary-dark').trim() || '#14532d';
  const mid = css.getPropertyValue('--color-primary-mid').trim() || '#16a34a';
  const light = css.getPropertyValue('--color-primary-light').trim() || '#dcfce7';
  const accent = css.getPropertyValue('--color-accent-mid').trim() || '#eab308';
  const shopName = escapeHtml(settings?.shopName || 'Vijay Dairy');

  const rows = invoice.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.name)} <span class="muted">(${escapeHtml(item.unit)})</span></td>
        <td class="r">${escapeHtml(formatQuantityPretty(item.quantity, item.unit))}</td>
        <td class="r">${formatCurrency(item.price)} / ${escapeHtml(item.unit)}</td>
        <td class="r">${formatCurrency(item.discount || 0)}</td>
        <td class="r strong">${formatCurrency(item.total)}</td>
      </tr>`,
    )
    .join('');

  const contact = [settings?.address, settings?.phone ? `Phone: ${settings.phone}` : '', settings?.gstNumber ? `GSTIN: ${settings.gstNumber}` : '']
    .filter(Boolean)
    .map((v) => escapeHtml(v))
    .join(' &nbsp;·&nbsp; ');

  return `<!DOCTYPE html>
  <html><head><meta charset="utf-8" /><title>${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .band { background: ${dark}; color: #fff; padding: 26px 36px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid ${accent}; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo { width: 48px; height: 48px; border-radius: 14px; background: ${mid}; display: flex; align-items: center; justify-content: center; }
    .brand h1 { margin: 0; font-size: 22px; }
    .brand p { margin: 2px 0 0; font-size: 11px; color: #d2ebda; }
    .meta { text-align: right; }
    .meta .title { font-size: 26px; font-weight: 800; letter-spacing: 1px; }
    .meta div { font-size: 12px; color: #d2ebda; }
    .content { padding: 26px 36px 36px; }
    .contact { font-size: 12px; color: #475569; margin: 0 0 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    thead th { background: ${dark}; color: #fff; padding: 10px 10px; font-size: 12px; text-align: left; }
    tbody td { padding: 10px; border-bottom: 1px solid #eef0e8; font-size: 13px; }
    tbody tr:nth-child(even) { background: #f7f8f2; }
    .r { text-align: right; }
    .strong { font-weight: 700; }
    .muted { color: #64748b; font-size: 11px; }
    .totals { margin: 20px 0 0 auto; width: 300px; background: #f7f8f2; border-radius: 10px; overflow: hidden; }
    .totals div { display: flex; justify-content: space-between; padding: 7px 16px; font-size: 13px; color: #475569; }
    .totals .grand { background: ${dark}; color: #fff; font-weight: 800; font-size: 15px; padding: 12px 16px; }
    .notes { margin-top: 22px; font-size: 12px; color: #475569; }
    .footer { margin-top: 34px; text-align: center; color: ${dark}; font-style: italic; font-size: 13px; padding-top: 14px; border-top: 3px solid ${light}; }
    @media print { @page { margin: 0; } }
  </style></head>
  <body>
    <div class="band">
      <div class="brand">
        <div class="logo"><svg width="26" height="26" viewBox="0 0 32 32"><path d="M16 5c-4.400 5.500-7.500 9.200-7.500 13.300a7.500 7.500 0 0 0 15 0C23.500 14.200 20.400 10.500 16 5z" fill="#fffdf6"/></svg></div>
        <div><h1>${shopName}</h1><p>Fresh from the farm. Daily.</p></div>
      </div>
      <div class="meta"><div class="title">INVOICE</div><div>No. ${escapeHtml(invoice.invoiceNumber)}</div><div>${escapeHtml(formatDateTime(invoice.createdAt))}</div></div>
    </div>
    <div class="content">
      ${contact ? `<p class="contact">${contact}</p>` : ''}
      <table>
        <thead><tr><th>Item</th><th class="r">Quantity</th><th class="r">Rate</th><th class="r">Discount</th><th class="r">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${formatCurrency(invoice.subtotal)}</span></div>
        <div><span>Discount</span><span>- ${formatCurrency(invoice.discount)}</span></div>
        <div><span>Tax</span><span>${formatCurrency(invoice.taxAmount)}</span></div>
        <div class="grand"><span>Total</span><span>${formatCurrency(invoice.total)}</span></div>
      </div>
      ${invoice.notes ? `<p class="notes"><strong>Notes:</strong> ${escapeHtml(invoice.notes)}</p>` : ''}
      <p class="footer">${escapeHtml(settings?.footerNote || 'Thank you for your business!')}</p>
    </div>
  </body></html>`;
}
