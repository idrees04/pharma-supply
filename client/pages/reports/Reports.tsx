import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileDown, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { analyticsReportService } from '@/api/services/analyticsReports';
import type {
  AnalyticsReportId,
  AnalyticsReportQueryParams,
  ReportModuleId,
} from '@/types/api/analyticsReports';
import { useGetHospitals } from '@/hooks/useHospitals';
import { useSupplierList } from '@/api/services/suppliers';
import { useProductList } from '@/api/services/products';
import { ApiError } from '@/api/errors';
import { downloadAnalyticsReportPdf } from '@/lib/reportsPdfExport';

const MODULE_OPTIONS: { id: ReportModuleId; label: string }[] = [
  { id: 'supply-order', label: 'Supply orders' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'finance', label: 'Finance' },
  { id: 'invoices', label: 'Invoices' },
];

const REPORTS_BY_MODULE: Record<ReportModuleId, { id: AnalyticsReportId; label: string }[]> = {
  'supply-order': [
    { id: 'pipeline', label: 'Pipeline by status' },
    { id: 'by-hospital', label: 'Orders by hospital' },
    { id: 'fulfillment-sla', label: 'Fulfillment / SLA' },
  ],
  inventory: [
    { id: 'stock-position', label: 'Stock position & value' },
    { id: 'batch-expiry', label: 'Batch expiry window' },
  ],
  purchase: [
    { id: 'payables', label: 'PO payables by supplier' },
    { id: 'receipt-vs-order', label: 'Receipt vs order (lines)' },
  ],
  finance: [
    { id: 'hospital-ar', label: 'Hospital AR / aging' },
    { id: 'cash-collections', label: 'Cash collections (receipts)' },
    { id: 'expenses-summary', label: 'Expenses by category' },
  ],
  invoices: [
    { id: 'invoice-tax-lines', label: 'Tax on invoices' },
    { id: 'invoice-late-fees', label: 'Late delivery / fee charges' },
    { id: 'invoices-outstanding', label: 'Outstanding invoices' },
    { id: 'outstanding-by-hospital', label: 'Outstanding by hospital' },
  ],
};

function isModule(s: string | null): s is ReportModuleId {
  return (
    s === 'supply-order' ||
    s === 'inventory' ||
    s === 'purchase' ||
    s === 'finance' ||
    s === 'invoices'
  );
}

function defaultReportForModule(m: ReportModuleId): AnalyticsReportId {
  return REPORTS_BY_MODULE[m][0].id;
}

function parseReport(module: ReportModuleId, r: string | null): AnalyticsReportId {
  const allowed = REPORTS_BY_MODULE[module].map((x) => x.id);
  if (r && allowed.includes(r as AnalyticsReportId)) return r as AnalyticsReportId;
  return defaultReportForModule(module);
}

function startOfDayISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  return { from: startOfDayISO(from), to: startOfDayISO(to) };
}

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleParam = searchParams.get('module');
  const reportParam = searchParams.get('report');

  const module: ReportModuleId = isModule(moduleParam) ? moduleParam : 'supply-order';
  const reportId = parseReport(module, reportParam);

  const { from: defaultFrom, to: defaultTo } = defaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [hospitalId, setHospitalId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');

  const { data: hospitalsData } = useGetHospitals({ pageNumber: 1, pageSize: 500 });
  const { data: suppliersData } = useSupplierList({ pageNumber: 1, pageSize: 500 });
  const { data: productsData } = useProductList({ pageNumber: 1, pageSize: 500 });

  const hospitals = hospitalsData?.data?.items ?? [];
  const suppliers = suppliersData?.items ?? [];
  const products = productsData?.items ?? [];

  const syncUrl = useCallback(
    (m: ReportModuleId, r: AnalyticsReportId) => {
      setSearchParams({ module: m, report: r }, { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (!isModule(moduleParam)) {
      syncUrl('supply-order', defaultReportForModule('supply-order'));
      return;
    }
    const valid = parseReport(module, reportParam);
    if (reportParam !== valid) syncUrl(module, valid);
  }, [moduleParam, reportParam, module, syncUrl]);

  const apiParams: AnalyticsReportQueryParams = useMemo(() => {
    const p: AnalyticsReportQueryParams = {
      dateFrom,
      dateTo,
    };
    const hid = hospitalId ? Number(hospitalId) : undefined;
    const sid = supplierId ? Number(supplierId) : undefined;
    const pid = productId ? Number(productId) : undefined;
    if (hid && hid > 0) p.hospitalId = hid;
    if (sid && sid > 0) p.supplierId = sid;
    if (pid && pid > 0) p.productId = pid;
    return p;
  }, [dateFrom, dateTo, hospitalId, supplierId, productId]);

  const queryFn = useCallback(async () => {
    switch (reportId) {
      case 'pipeline':
        return analyticsReportService.getSupplyOrderPipeline(apiParams);
      case 'by-hospital':
        return analyticsReportService.getSupplyOrdersByHospital(apiParams);
      case 'fulfillment-sla':
        return analyticsReportService.getSupplyOrderFulfillmentSla(apiParams);
      case 'stock-position':
        return analyticsReportService.getInventoryStockPosition(apiParams);
      case 'batch-expiry':
        return analyticsReportService.getInventoryBatchExpiry(apiParams);
      case 'payables':
        return analyticsReportService.getPurchasePayables(apiParams);
      case 'receipt-vs-order':
        return analyticsReportService.getPurchaseReceiptVsOrder(apiParams);
      case 'hospital-ar':
        return analyticsReportService.getHospitalAr(apiParams);
      case 'cash-collections':
        return analyticsReportService.getCashCollections(apiParams);
      case 'expenses-summary':
        return analyticsReportService.getExpensesSummary(apiParams);
      case 'invoice-tax-lines':
        return analyticsReportService.getInvoiceTaxLines(apiParams);
      case 'invoice-late-fees':
        return analyticsReportService.getInvoiceLateFees(apiParams);
      case 'invoices-outstanding':
        return analyticsReportService.getInvoicesOutstanding(apiParams);
      case 'outstanding-by-hospital':
        return analyticsReportService.getOutstandingByHospital(apiParams);
      default:
        throw new Error('Unknown report');
    }
  }, [reportId, apiParams]);

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['analytics-report', reportId, apiParams],
    queryFn,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (error instanceof ApiError) toast.error(error.userMessage || 'Report failed to load');
    else if (error) toast.error('Report failed to load');
  }, [error]);

  const showHospital =
    reportId === 'pipeline' ||
    reportId === 'by-hospital' ||
    reportId === 'fulfillment-sla' ||
    reportId === 'hospital-ar' ||
    reportId === 'cash-collections' ||
    reportId === 'invoice-tax-lines' ||
    reportId === 'invoice-late-fees' ||
    reportId === 'invoices-outstanding' ||
    reportId === 'outstanding-by-hospital';
  const showSupplier = reportId === 'payables' || reportId === 'receipt-vs-order';
  const showProduct =
    reportId === 'stock-position' || reportId === 'batch-expiry' || reportId === 'receipt-vs-order';

  const reportLabel = REPORTS_BY_MODULE[module].find((x) => x.id === reportId)?.label ?? reportId;

  const hospitalFilterLabel = useMemo(() => {
    if (!hospitalId) return 'All hospitals';
    const h = hospitals.find((x) => String(x.id) === hospitalId);
    return h?.hospitalName ?? `Hospital ID ${hospitalId}`;
  }, [hospitalId, hospitals]);

  const supplierFilterLabel = useMemo(() => {
    if (!supplierId) return 'All suppliers';
    const s = suppliers.find((x) => String(x.id) === supplierId);
    return s?.supplierName ?? `Supplier ID ${supplierId}`;
  }, [supplierId, suppliers]);

  const productFilterLabel = useMemo(() => {
    if (!productId) return 'All products';
    const p = products.find((x) => String(x.id) === productId);
    return p ? `${p.productCode} — ${p.productName}` : `Product ID ${productId}`;
  }, [productId, products]);

  const moduleLabel = useMemo(
    () => `${MODULE_OPTIONS.find((o) => o.id === module)?.label ?? module} — analytics reports`,
    [module],
  );

  const canExportPdf = Boolean(data) && !error && !isPending && !isFetching;

  const handleExportPdf = useCallback(() => {
    if (!data) return;
    try {
      downloadAnalyticsReportPdf({
        reportId,
        reportTitle: reportLabel,
        moduleLabel,
        dateFrom,
        dateTo,
        hospitalLabel: hospitalFilterLabel,
        supplierLabel: supplierFilterLabel,
        productLabel: productFilterLabel,
        data,
      });
      toast.success('PDF downloaded');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      toast.error(msg);
    }
  }, [
    data,
    reportId,
    reportLabel,
    moduleLabel,
    dateFrom,
    dateTo,
    hospitalFilterLabel,
    supplierFilterLabel,
    productFilterLabel,
  ]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Choose a module and report, set filters, then refresh. Data comes from the analytics API.
        </p>
      </div>

      <Card className="p-4 md:p-6 space-y-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Module</Label>
            <Select
              value={module}
              onValueChange={(v) => {
                const m = v as ReportModuleId;
                syncUrl(m, defaultReportForModule(m));
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Report name</Label>
            <Select
              value={reportId}
              onValueChange={(v) => syncUrl(module, v as AnalyticsReportId)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Report" />
              </SelectTrigger>
              <SelectContent>
                {REPORTS_BY_MODULE[module].map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rep-df">Date from</Label>
            <input
              id="rep-df"
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rep-dt">Date to</Label>
            <input
              id="rep-dt"
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {showHospital ? (
            <div className="space-y-2">
              <Label>Hospital</Label>
              <Select value={hospitalId || '__all'} onValueChange={(v) => setHospitalId(v === '__all' ? '' : v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All hospitals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All hospitals</SelectItem>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.hospitalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {showSupplier ? (
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={supplierId || '__all'} onValueChange={(v) => setSupplierId(v === '__all' ? '' : v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All suppliers</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {showProduct ? (
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={productId || '__all'} onValueChange={(v) => setProductId(v === '__all' ? '' : v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.productCode} — {p.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="default" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh report
          </Button>
          {canExportPdf ? (
            <Button type="button" variant="outline" className="gap-2" onClick={handleExportPdf}>
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
          ) : null}
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="font-medium text-foreground">{reportLabel}</span>
            <span className="hidden sm:inline">— dates apply per report (see API).</span>
          </p>
        </div>
      </Card>

      <ReportResults reportId={reportId} data={data} isPending={isPending} error={error} />
    </div>
  );
}

function ReportResults({
  reportId,
  data,
  isPending,
  error,
}: {
  reportId: AnalyticsReportId;
  data: unknown;
  isPending: boolean;
  error: Error | null;
}) {
  if (isPending && !data) {
    return (
      <Card className="flex min-h-[240px] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5 p-6 text-sm text-destructive">
        {error instanceof ApiError ? error.userMessage : error.message}
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        No data. Adjust filters and click Refresh report.
      </Card>
    );
  }

  switch (reportId) {
    case 'pipeline': {
      const d = data as import('@/types/api/analyticsReports').SupplyOrderPipelineReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip
            items={[
              { label: 'Orders', value: String(d.totalOrderCount) },
              { label: 'Total amount (PKR)', value: formatCurrency(d.grandTotalAmount) },
            ]}
          />
          <DataCardTable
            headers={['Status', 'Orders', 'Amount (PKR)']}
            rows={d.rows.map((r) => [r.statusName, String(r.orderCount), formatCurrency(r.totalAmount)])}
          />
        </div>
      );
    }
    case 'by-hospital': {
      const d = data as import('@/types/api/analyticsReports').SupplyOrdersByHospitalReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip
            items={[
              { label: 'Orders', value: String(d.totalOrderCount) },
              { label: 'Total amount (PKR)', value: formatCurrency(d.grandTotalAmount) },
            ]}
          />
          <DataCardTable
            headers={['Hospital', 'Orders', 'Amount (PKR)']}
            rows={d.rows.map((r) => [r.hospitalName, String(r.orderCount), formatCurrency(r.totalAmount)])}
          />
        </div>
      );
    }
    case 'fulfillment-sla': {
      const d = data as import('@/types/api/analyticsReports').SupplyOrderFulfillmentSlaReportDto;
      return (
        <DataCardTable
          headers={['SO #', 'Hospital', 'Order', 'Required', 'Fulfilled', '1st dispatch', 'Δ days']}
          rows={d.rows.map((r) => [
            r.supplyOrderNumber,
            r.hospitalName,
            fmtDate(r.orderDate),
            fmtDate(r.requiredByDate),
            fmtDate(r.fulfilledDate),
            fmtDate(r.firstDispatchDate),
            r.daysVarianceVsRequired == null ? '—' : String(r.daysVarianceVsRequired),
          ])}
        />
      );
    }
    case 'stock-position': {
      const d = data as import('@/types/api/analyticsReports').InventoryStockPositionReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip items={[{ label: 'Stock value (PKR)', value: formatCurrency(d.grandTotalStockValue) }]} />
          <DataCardTable
            headers={['Code', 'Product', 'Avail', 'Reserved', 'Total qty', 'Avg cost (PKR)', 'Value (PKR)']}
            rows={d.rows.map((r) => [
              r.productCode,
              r.productName,
              String(r.availableQuantity),
              String(r.reservedQuantity),
              String(r.totalQuantity),
              formatCurrency(r.averageCost),
              formatCurrency(r.totalValue),
            ])}
          />
        </div>
      );
    }
    case 'batch-expiry': {
      const d = data as import('@/types/api/analyticsReports').InventoryBatchExpiryReportDto;
      return (
        <DataCardTable
          headers={['Product', 'Batch', 'Expiry', 'Qty', 'Rate (PKR)', 'Days left']}
          rows={d.rows.map((r) => [
            `${r.productCode} ${r.productName}`,
            r.batchNumber,
            fmtDate(r.expiryDate),
            String(r.currentQuantity),
            formatCurrency(r.purchaseRate),
            r.daysUntilExpiry == null ? '—' : String(r.daysUntilExpiry),
          ])}
        />
      );
    }
    case 'payables': {
      const d = data as import('@/types/api/analyticsReports').PurchaseOrderPayablesReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip
            items={[
              { label: 'Outstanding (PKR)', value: formatCurrency(d.totalOutstanding) },
              { label: 'Paid (PKR)', value: formatCurrency(d.totalPaid) },
            ]}
          />
          <DataCardTable
            headers={['Supplier', 'POs', 'Total (PKR)', 'Paid (PKR)', 'Outstanding (PKR)']}
            rows={d.rows.map((r) => [
              r.supplierName,
              String(r.purchaseOrderCount),
              formatCurrency(r.totalAmount),
              formatCurrency(r.paidAmount),
              formatCurrency(r.outstandingAmount),
            ])}
          />
        </div>
      );
    }
    case 'receipt-vs-order': {
      const d = data as import('@/types/api/analyticsReports').PurchaseReceiptVsOrderReportDto;
      return (
        <DataCardTable
          headers={['PO #', 'Supplier', 'Product', 'Ordered', 'Received', 'Remain', 'Fill %']}
          rows={d.rows.map((r) => [
            r.purchaseOrderNumber,
            r.supplierName,
            `${r.productCode} ${r.productName}`,
            String(r.orderedQuantity),
            String(r.receivedQuantity),
            String(r.remainingQuantity),
            r.fillRatePercent == null ? '—' : `${r.fillRatePercent}%`,
          ])}
        />
      );
    }
    case 'hospital-ar': {
      const d = data as import('@/types/api/analyticsReports').HospitalInvoicesArReportDto;
      const a = d.agingSummary;
      return (
        <div className="space-y-4">
          <SummaryStrip
            items={[
              { label: 'Outstanding (PKR)', value: formatCurrency(d.totalOutstanding) },
              { label: 'Current (PKR)', value: formatCurrency(a.current) },
              { label: '1–30 (PKR)', value: formatCurrency(a.days1To30) },
              { label: '31–60 (PKR)', value: formatCurrency(a.days31To60) },
              { label: '61–90 (PKR)', value: formatCurrency(a.days61To90) },
              { label: '90+ (PKR)', value: formatCurrency(a.daysOver90) },
            ]}
          />
          <DataCardTable
            headers={['Invoice', 'Hospital', 'Due', 'Outstanding (PKR)', 'Bucket', 'Days late']}
            rows={d.rows.map((r) => [
              r.invoiceNumber,
              r.hospitalName,
              fmtDate(r.dueDate),
              formatCurrency(r.outstandingAmount),
              r.agingBucket ?? '—',
              r.daysPastDue == null ? '—' : String(r.daysPastDue),
            ])}
          />
        </div>
      );
    }
    case 'cash-collections': {
      const d = data as import('@/types/api/analyticsReports').CashCollectionsReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip items={[{ label: 'Collected (PKR)', value: formatCurrency(d.totalCollected) }]} />
          <DataCardTable
            headers={['Payment #', 'Date', 'Amount (PKR)', 'Mode', 'Hospital']}
            rows={d.rows.map((r) => [
              r.paymentNumber,
              fmtDate(r.paymentDate),
              formatCurrency(r.amount),
              r.paymentModeName,
              r.hospitalName ?? '—',
            ])}
          />
        </div>
      );
    }
    case 'expenses-summary': {
      const d = data as import('@/types/api/analyticsReports').ExpensesSummaryReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip items={[{ label: 'Total expenses (PKR)', value: formatCurrency(d.grandTotal) }]} />
          <DataCardTable
            headers={['Category', 'Count', 'Amount (PKR)']}
            rows={d.rows.map((r) => [r.categoryName, String(r.expenseCount), formatCurrency(r.totalAmount)])}
          />
        </div>
      );
    }
    case 'invoice-tax-lines': {
      const d = data as import('@/types/api/analyticsReports').InvoiceTaxLinesReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip
            items={[
              { label: 'Taxable (PKR)', value: formatCurrency(d.grandTotalTaxableAmount) },
              { label: 'Tax collected (PKR)', value: formatCurrency(d.grandTotalTaxCollected) },
            ]}
          />
          <DataCardTable
            headers={['Invoice', 'Date', 'Hospital', 'Tax type', 'Rate %', 'Taxable (PKR)', 'Tax (PKR)']}
            rows={d.rows.map((r) => [
              r.invoiceNumber,
              fmtDate(r.invoiceDate),
              r.hospitalName,
              r.taxTypeName,
              String(r.taxPercentage),
              formatCurrency(r.taxableAmount),
              formatCurrency(r.taxCollected),
            ])}
          />
        </div>
      );
    }
    case 'invoice-late-fees': {
      const d = data as import('@/types/api/analyticsReports').InvoiceLateFeesReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip items={[{ label: 'Total late delivery / fees (PKR)', value: formatCurrency(d.grandTotalLateFees) }]} />
          <DataCardTable
            headers={[
              'Invoice',
              'Hospital',
              'Invoice date',
              'Due',
              'Days past due',
              'Late fee (PKR)',
              'Payable excl. tax (PKR)',
              'Invoice total (PKR)',
              'Outstanding (PKR)',
            ]}
            rows={d.rows.map((r) => [
              r.invoiceNumber,
              r.hospitalName,
              fmtDate(r.invoiceDate),
              fmtDate(r.dueDate),
              r.daysPastDue == null ? '—' : String(r.daysPastDue),
              formatCurrency(r.lateFeeAmount),
              formatCurrency(r.totalPayableAmount),
              formatCurrency(r.totalInvoiceAmount),
              formatCurrency(r.outstandingAmount),
            ])}
          />
        </div>
      );
    }
    case 'invoices-outstanding': {
      const d = data as import('@/types/api/analyticsReports').OutstandingInvoicesReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip items={[{ label: 'Remaining balance (PKR)', value: formatCurrency(d.totalRemainingBalance) }]} />
          <DataCardTable
            headers={['Invoice', 'Hospital', 'Due', 'Invoice (PKR)', 'Paid (PKR)', 'Balance (PKR)', 'Status']}
            rows={d.rows.map((r) => [
              r.invoiceNumber,
              r.hospitalName,
              fmtDate(r.dueDate),
              formatCurrency(r.invoiceAmount),
              formatCurrency(r.paidAmount),
              formatCurrency(r.remainingBalance),
              r.statusName,
            ])}
          />
        </div>
      );
    }
    case 'outstanding-by-hospital': {
      const d = data as import('@/types/api/analyticsReports').OutstandingBalanceByHospitalReportDto;
      return (
        <div className="space-y-4">
          <SummaryStrip
            items={[
              { label: 'Unpaid invoices', value: String(d.totalUnpaidInvoiceCount) },
              { label: 'Outstanding (PKR)', value: formatCurrency(d.grandTotalOutstanding) },
              { label: 'Overdue (PKR)', value: formatCurrency(d.grandTotalOverdue) },
            ]}
          />
          <DataCardTable
            headers={[
              'Hospital',
              'Invoices',
              'Outstanding (PKR)',
              'Overdue (PKR)',
              'Current',
              '1–30',
              '31–60',
              '61–90',
              '90+',
            ]}
            rows={d.rows.map((r) => {
              const a = r.agingSummary;
              return [
                r.hospitalName,
                String(r.unpaidInvoiceCount),
                formatCurrency(r.totalOutstandingAmount),
                formatCurrency(r.overdueOutstandingAmount),
                formatCurrency(a.current),
                formatCurrency(a.days1To30),
                formatCurrency(a.days31To60),
                formatCurrency(a.days61To90),
                formatCurrency(a.daysOver90),
              ];
            })}
          />
        </div>
      );
    }
    default:
      return null;
  }
}

function SummaryStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((it) => (
        <Card key={it.label} className="px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{it.label}</p>
          <p className="text-lg font-bold tabular-nums">{it.value}</p>
        </Card>
      ))}
    </div>
  );
}

function DataCardTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} className="text-muted-foreground">
                  No rows
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j} className="max-w-[280px] truncate">
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
