import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { formatCurrency } from '@/lib/utils';
import { getResolvedFederationBranding, loadLogoDataUrl } from '@/lib/federationBranding';
import type { AnalyticsReportId } from '@/types/api/analyticsReports';
import type {
  CashCollectionsReportDto,
  ExpensesSummaryReportDto,
  HospitalInvoicesArReportDto,
  InventoryBatchExpiryReportDto,
  InventoryStockPositionReportDto,
  InvoiceLateFeesReportDto,
  InvoiceTaxLinesReportDto,
  OutstandingBalanceByHospitalReportDto,
  OutstandingInvoicesReportDto,
  PurchaseOrderPayablesReportDto,
  PurchaseReceiptVsOrderReportDto,
  SupplyOrderFulfillmentSlaReportDto,
  SupplyOrderPipelineReportDto,
  SupplyOrdersByHospitalReportDto,
  ProfitReportDto,
  LedgerReportDto,
  PaymentsByAccountReportDto,
  BalanceSheetReportDto,
} from '@/types/api/analyticsReports';


export type AnalyticsReportPdfMeta = {
  reportId: AnalyticsReportId;
  reportTitle: string;
  /** e.g. "Finance — analytics reports" */
  moduleLabel: string;
  dateFrom: string;
  dateTo: string;
  hospitalLabel: string;
  supplierLabel: string;
  productLabel: string;
  data: unknown;
};

function fmtDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

type TableSpec = {
  headers: string[];
  rows: (string | number)[][];
  summaries: { label: string; value: string }[];
  orientation: 'portrait' | 'landscape';
};

function asStrings(row: (string | number)[]): string[] {
  return row.map((c) => (c === null || c === undefined ? '—' : String(c)));
}

function buildSpec(reportId: AnalyticsReportId, data: unknown): TableSpec {
  switch (reportId) {
    case 'pipeline': {
      const d = data as SupplyOrderPipelineReportDto;
      return {
        orientation: 'portrait',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Total orders', value: String(d.totalOrderCount) },
          { label: 'Grand total (PKR)', value: formatCurrency(d.grandTotalAmount) },
        ],
        headers: ['Status', 'Orders', 'Amount (PKR)'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) => asStrings([r.statusName, r.orderCount, formatCurrency(r.totalAmount)]))
            : [],
      };
    }
    case 'by-hospital': {
      const d = data as SupplyOrdersByHospitalReportDto;
      return {
        orientation: 'portrait',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Total orders', value: String(d.totalOrderCount) },
          { label: 'Grand total (PKR)', value: formatCurrency(d.grandTotalAmount) },
        ],
        headers: ['Hospital', 'Orders', 'Amount (PKR)'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) => asStrings([r.hospitalName, r.orderCount, formatCurrency(r.totalAmount)]))
            : [],
      };
    }
    case 'fulfillment-sla': {
      const d = data as SupplyOrderFulfillmentSlaReportDto;
      return {
        orientation: 'landscape',
        summaries: [{ label: 'Data rows', value: String(d.rows.length) }],
        headers: ['SO #', 'Hospital', 'Order', 'Required', 'Fulfilled', '1st dispatch', 'Δ days'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.supplyOrderNumber,
                  r.hospitalName,
                  fmtDisplayDate(r.orderDate),
                  fmtDisplayDate(r.requiredByDate),
                  fmtDisplayDate(r.fulfilledDate),
                  fmtDisplayDate(r.firstDispatchDate),
                  r.daysVarianceVsRequired == null ? '—' : r.daysVarianceVsRequired,
                ]),
              )
            : [],
      };
    }
    case 'stock-position': {
      const d = data as InventoryStockPositionReportDto;
      return {
        orientation: 'landscape',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Grand total stock value (PKR)', value: formatCurrency(d.grandTotalStockValue) },
        ],
        headers: ['Code', 'Product', 'Avail', 'Reserved', 'Total qty', 'Avg cost (PKR)', 'Value (PKR)'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.productCode,
                  r.productName,
                  r.availableQuantity,
                  r.reservedQuantity,
                  r.totalQuantity,
                  formatCurrency(r.averageCost),
                  formatCurrency(r.totalValue),
                ]),
              )
            : [],
      };
    }
    case 'batch-expiry': {
      const d = data as InventoryBatchExpiryReportDto;
      return {
        orientation: 'portrait',
        summaries: [{ label: 'Data rows', value: String(d.rows.length) }],
        headers: ['Product', 'Batch', 'Expiry', 'Qty', 'Rate (PKR)', 'Days left'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  `${r.productCode} ${r.productName}`,
                  r.batchNumber,
                  fmtDisplayDate(r.expiryDate),
                  r.currentQuantity,
                  formatCurrency(r.purchaseRate),
                  r.daysUntilExpiry == null ? '—' : r.daysUntilExpiry,
                ]),
              )
            : [],
      };
    }
    case 'payables': {
      const d = data as PurchaseOrderPayablesReportDto;
      return {
        orientation: 'portrait',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Total outstanding (PKR)', value: formatCurrency(d.totalOutstanding) },
          { label: 'Total paid (PKR)', value: formatCurrency(d.totalPaid) },
        ],
        headers: ['Supplier', 'POs', 'Total (PKR)', 'Paid (PKR)', 'Outstanding (PKR)'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.supplierName,
                  r.purchaseOrderCount,
                  formatCurrency(r.totalAmount),
                  formatCurrency(r.paidAmount),
                  formatCurrency(r.outstandingAmount),
                ]),
              )
            : [],
      };
    }
    case 'receipt-vs-order': {
      const d = data as PurchaseReceiptVsOrderReportDto;
      return {
        orientation: 'landscape',
        summaries: [{ label: 'Data rows', value: String(d.rows.length) }],
        headers: ['PO #', 'Supplier', 'Product', 'Ordered', 'Received', 'Remain', 'Fill %'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.purchaseOrderNumber,
                  r.supplierName,
                  `${r.productCode} ${r.productName}`,
                  r.orderedQuantity,
                  r.receivedQuantity,
                  r.remainingQuantity,
                  r.fillRatePercent == null ? '—' : `${r.fillRatePercent}%`,
                ]),
              )
            : [],
      };
    }
    case 'hospital-ar': {
      const d = data as HospitalInvoicesArReportDto;
      const a = d.agingSummary;
      return {
        orientation: 'landscape',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Outstanding (PKR)', value: formatCurrency(d.totalOutstanding) },
          { label: 'Aging current (PKR)', value: formatCurrency(a.current) },
          { label: 'Aging 1–30 (PKR)', value: formatCurrency(a.days1To30) },
          { label: 'Aging 31–60 (PKR)', value: formatCurrency(a.days31To60) },
          { label: 'Aging 61–90 (PKR)', value: formatCurrency(a.days61To90) },
          { label: 'Aging 90+ (PKR)', value: formatCurrency(a.daysOver90) },
        ],
        headers: ['Invoice', 'Hospital', 'Due', 'Outstanding (PKR)', 'Bucket', 'Days late'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.invoiceNumber,
                  r.hospitalName,
                  fmtDisplayDate(r.dueDate),
                  formatCurrency(r.outstandingAmount),
                  r.agingBucket ?? '—',
                  r.daysPastDue == null ? '—' : r.daysPastDue,
                ]),
              )
            : [],
      };
    }
    case 'cash-collections': {
      const d = data as CashCollectionsReportDto;
      return {
        orientation: 'portrait',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Total collected (PKR)', value: formatCurrency(d.totalCollected) },
        ],
        headers: ['Payment #', 'Date', 'Amount (PKR)', 'Mode', 'Hospital'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.paymentNumber,
                  fmtDisplayDate(r.paymentDate),
                  formatCurrency(r.amount),
                  r.paymentModeName,
                  r.hospitalName ?? '—',
                ]),
              )
            : [],
      };
    }
    case 'expenses-summary': {
      const d = data as ExpensesSummaryReportDto;
      return {
        orientation: 'portrait',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Grand total (PKR)', value: formatCurrency(d.grandTotal) },
        ],
        headers: ['Category', 'Count', 'Amount (PKR)'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) => asStrings([r.categoryName, r.expenseCount, formatCurrency(r.totalAmount)]))
            : [],
      };
    }
    case 'invoice-tax-lines': {
      const d = data as InvoiceTaxLinesReportDto;
      return {
        orientation: 'portrait',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Total taxable (PKR)', value: formatCurrency(d.grandTotalTaxableAmount) },
          { label: 'Total tax collected (PKR)', value: formatCurrency(d.grandTotalTaxCollected) },
        ],
        headers: ['Invoice', 'Date', 'Hospital', 'Tax type', 'Rate %', 'Taxable (PKR)', 'Tax (PKR)'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.invoiceNumber,
                  fmtDisplayDate(r.invoiceDate),
                  r.hospitalName,
                  r.taxTypeName,
                  r.taxPercentage,
                  formatCurrency(r.taxableAmount),
                  formatCurrency(r.taxCollected),
                ]),
              )
            : [],
      };
    }
    case 'invoice-late-fees': {
      const d = data as InvoiceLateFeesReportDto;
      return {
        orientation: 'landscape',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Total late delivery / fees (PKR)', value: formatCurrency(d.grandTotalLateFees) },
        ],
        headers: [
          'Invoice',
          'Hospital',
          'Invoice date',
          'Due',
          'Days past due',
          'Late fee (PKR)',
          'Payable excl. tax (PKR)',
          'Invoice total (PKR)',
          'Outstanding (PKR)',
        ],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.invoiceNumber,
                  r.hospitalName,
                  fmtDisplayDate(r.invoiceDate),
                  fmtDisplayDate(r.dueDate),
                  r.daysPastDue == null ? '—' : r.daysPastDue,
                  formatCurrency(r.lateFeeAmount),
                  formatCurrency(r.totalPayableAmount),
                  formatCurrency(r.totalInvoiceAmount),
                  formatCurrency(r.outstandingAmount),
                ]),
              )
            : [],
      };
    }
    case 'invoices-outstanding': {
      const d = data as OutstandingInvoicesReportDto;
      return {
        orientation: 'portrait',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Total remaining balance (PKR)', value: formatCurrency(d.totalRemainingBalance) },
        ],
        headers: ['Invoice', 'Hospital', 'Due', 'Invoice (PKR)', 'Paid (PKR)', 'Balance (PKR)', 'Status'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.invoiceNumber,
                  r.hospitalName,
                  fmtDisplayDate(r.dueDate),
                  formatCurrency(r.invoiceAmount),
                  formatCurrency(r.paidAmount),
                  formatCurrency(r.remainingBalance),
                  r.statusName,
                ]),
              )
            : [],
      };
    }
    case 'outstanding-by-hospital': {
      const d = data as OutstandingBalanceByHospitalReportDto;
      return {
        orientation: 'landscape',
        summaries: [
          { label: 'Hospitals listed', value: String(d.rows.length) },
          { label: 'Unpaid invoices (count)', value: String(d.totalUnpaidInvoiceCount) },
          { label: 'Grand total outstanding (PKR)', value: formatCurrency(d.grandTotalOutstanding) },
          { label: 'Grand total overdue (PKR)', value: formatCurrency(d.grandTotalOverdue) },
        ],
        headers: [
          'Hospital',
          'Invoices',
          'Outstanding (PKR)',
          'Overdue (PKR)',
          'Current (PKR)',
          '1–30 (PKR)',
          '31–60 (PKR)',
          '61–90 (PKR)',
          '90+ (PKR)',
        ],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) => {
                const a = r.agingSummary;
                return asStrings([
                  r.hospitalName,
                  r.unpaidInvoiceCount,
                  formatCurrency(r.totalOutstandingAmount),
                  formatCurrency(r.overdueOutstandingAmount),
                  formatCurrency(a.current),
                  formatCurrency(a.days1To30),
                  formatCurrency(a.days31To60),
                  formatCurrency(a.days61To90),
                  formatCurrency(a.daysOver90),
                ]);
              })
            : [],
      };
    }
    case 'profit-by-product':
    case 'profit-by-hospital': {
      const d = data as ProfitReportDto;
      return {
        orientation: 'landscape',
        summaries: [
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Total revenue (PKR)', value: formatCurrency(d.totalRevenue) },
          { label: 'Total cost (PKR)', value: formatCurrency(d.totalCost) },
          { label: 'Total profit (PKR)', value: formatCurrency(d.totalProfit) },
        ],
        headers: ['Code', 'Name', 'Revenue (PKR)', 'Cost (PKR)', 'Profit (PKR)', 'Margin %', 'Lines'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  r.entityCode ?? '—',
                  r.entityName,
                  formatCurrency(r.revenue),
                  formatCurrency(r.cost),
                  formatCurrency(r.profit),
                  r.marginPercent == null ? '—' : `${r.marginPercent}%`,
                  r.lineCount,
                ]),
              )
            : [],
      };
    }
    case 'vendor-ledger':
    case 'hospital-ledger': {
      const d = data as LedgerReportDto;
      return {
        orientation: 'landscape',
        summaries: [
          { label: 'Entity', value: d.entityName },
          { label: 'View', value: d.view },
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Closing balance (PKR)', value: formatCurrency(d.closingBalance) },
        ],
        headers: ['Date', 'Type', 'Reference', 'Product', 'Qty', 'Debit (PKR)', 'Credit (PKR)', 'Balance (PKR)', 'Notes'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  fmtDisplayDate(r.entryDate),
                  r.entryType,
                  r.referenceNumber,
                  r.productName ?? '—',
                  r.quantity == null ? '—' : r.quantity,
                  formatCurrency(r.debit),
                  formatCurrency(r.credit),
                  formatCurrency(r.runningBalance),
                  r.notes ?? '—',
                ]),
              )
            : [],
      };
    }
    case 'payments-by-account': {
      const d = data as PaymentsByAccountReportDto;
      return {
        orientation: 'landscape',
        summaries: [
          { label: 'Account', value: d.accountName },
          { label: 'Data rows', value: String(d.rows.length) },
          { label: 'Closing balance (PKR)', value: formatCurrency(d.closingBalance) },
        ],
        headers: ['Date', 'Type', 'Reference', 'Party', 'Debit (PKR)', 'Credit (PKR)', 'Balance (PKR)', 'Description'],
        rows:
          d.rows.length > 0
            ? d.rows.map((r) =>
                asStrings([
                  fmtDisplayDate(r.transactionDate),
                  r.transactionType,
                  r.referenceNumber,
                  r.partyName ?? '—',
                  formatCurrency(r.debit),
                  formatCurrency(r.credit),
                  formatCurrency(r.runningBalance),
                  r.description ?? '—',
                ]),
              )
            : [],
      };
    }
    case 'balance-sheet': {
      const d = data as BalanceSheetReportDto;
      return {
        orientation: 'portrait',
        summaries: [
          { label: 'As of date', value: fmtDisplayDate(d.asOfDate) },
          { label: 'Total assets (PKR)', value: formatCurrency(d.totalAssets) },
          { label: 'Total liabilities (PKR)', value: formatCurrency(d.totalLiabilities) },
          { label: 'Equity (proxy) (PKR)', value: formatCurrency(d.equityProxy) },
        ],
        headers: ['Section', 'Label', 'Amount (PKR)'],
        rows:
          d.lines.length > 0
            ? d.lines.map((l) => asStrings([l.section, l.label, formatCurrency(l.amount)]))
            : [],
      };
    }
    default:
      throw new Error(`Unsupported report for PDF export: ${String(reportId)}`);
  }
}

function drawHeaderBlock(
  doc: jsPDF,
  meta: AnalyticsReportPdfMeta,
  spec: TableSpec,
  margin: number,
  pageW: number,
  companyName: string,
  logoDataUrl: string | null,
): number {
  let y = margin;
  const textX = logoDataUrl ? margin + 22 : margin;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, y - 2, 18, 18);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName, textX, y + 4);
  y += logoDataUrl ? 20 : 7;

  doc.setFontSize(11);
  doc.text(meta.reportTitle, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(meta.moduleLabel, margin, y);
  y += 4;

  doc.setFontSize(8);
  const filterLines = [
    `Date range (API): ${meta.dateFrom} to ${meta.dateTo}`,
    `Hospital: ${meta.hospitalLabel}`,
    `Supplier: ${meta.supplierLabel}`,
    `Product: ${meta.productLabel}`,
  ];
  filterLines.forEach((line) => {
    doc.text(line, margin, y, { maxWidth: pageW - 2 * margin });
    y += 4;
  });
  y += 2;

  doc.setTextColor(15, 23, 42);
  if (spec.summaries.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Totals & summaries', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    spec.summaries.forEach((s) => {
      doc.text(`${s.label}: ${s.value}`, margin, y);
      y += 4;
    });
    y += 2;
  }

  return y;
}

function addFooters(doc: jsPDF, reportTitle: string, companyName: string): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  const generated = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const shortTitle = reportTitle.length > 42 ? `${reportTitle.slice(0, 40)}…` : reportTitle;

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    const footer = `${companyName}  ·  ${shortTitle}  ·  Generated ${generated}  ·  Page ${i} of ${total}`;
    doc.text(footer, pageW / 2, pageH - 5, { align: 'center' });
  }
}

/** A4 PDF with auto-paginated tables for any analytics report on the Reports page. */
export async function downloadAnalyticsReportPdf(meta: AnalyticsReportPdfMeta): Promise<void> {
  const branding = getResolvedFederationBranding();
  const logoDataUrl = await loadLogoDataUrl(branding.logoSrc);
  const spec = buildSpec(meta.reportId, meta.data);
  const doc = new jsPDF({ orientation: spec.orientation, unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentW = pageW - 2 * margin;
  const footerReserve = 12;

  const startY = drawHeaderBlock(
    doc,
    meta,
    spec,
    margin,
    pageW,
    branding.federationName,
    logoDataUrl,
  );

  const body =
    spec.rows.length > 0
      ? spec.rows
      : [
          [
            {
              content: 'No rows for the selected filters and date range.',
              colSpan: spec.headers.length,
              styles: { halign: 'center', fontStyle: 'italic' },
            },
          ],
        ];

  autoTable(doc, {
    head: [spec.headers],
    body,
    startY,
    margin: { left: margin, right: margin, bottom: footerReserve },
    tableWidth: contentW,
    styles: {
      fontSize: spec.orientation === 'landscape' ? 7 : 6.5,
      cellPadding: 1.4,
      overflow: 'linebreak',
      valign: 'top',
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    showHead: 'everyPage',
    theme: 'grid',
  });

  addFooters(doc, meta.reportTitle, branding.federationName);

  const slug = meta.reportTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  doc.save(`report-${slug || meta.reportId}-${meta.dateFrom}-${meta.dateTo}.pdf`);
}
