import { get, RequestConfig } from '@/api/requests';
import type {
  AnalyticsReportQueryParams,
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
  CashCollectionsResponse,
  ExpensesSummaryResponse,
  HospitalArResponse,
  InventoryBatchExpiryResponse,
  InventoryStockPositionResponse,
  InvoiceLateFeesResponse,
  InvoiceTaxLinesResponse,
  OutstandingByHospitalResponse,
  OutstandingInvoicesResponse,
  PurchasePayablesResponse,
  PurchaseReceiptVsOrderResponse,
  SupplyOrderFulfillmentSlaResponse,
  SupplyOrderPipelineResponse,
  SupplyOrdersByHospitalResponse,
} from '@/types/api/analyticsReports';

function appendReportParams(qs: URLSearchParams, p?: AnalyticsReportQueryParams) {
  if (!p) return;
  if (p.dateFrom) qs.append('dateFrom', p.dateFrom);
  if (p.dateTo) qs.append('dateTo', p.dateTo);
  if (p.hospitalId != null) qs.append('hospitalId', String(p.hospitalId));
  if (p.supplierId != null) qs.append('supplierId', String(p.supplierId));
  if (p.productId != null) qs.append('productId', String(p.productId));
}

export const analyticsReportService = {
  getSupplyOrderPipeline: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<SupplyOrderPipelineReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/supply-order/pipeline${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<SupplyOrderPipelineResponse>(url, config);
    return res.data;
  },

  getSupplyOrdersByHospital: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<SupplyOrdersByHospitalReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/supply-order/by-hospital${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<SupplyOrdersByHospitalResponse>(url, config);
    return res.data;
  },

  getSupplyOrderFulfillmentSla: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<SupplyOrderFulfillmentSlaReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/supply-order/fulfillment-sla${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<SupplyOrderFulfillmentSlaResponse>(url, config);
    return res.data;
  },

  getInventoryStockPosition: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<InventoryStockPositionReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/inventory/stock-position${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<InventoryStockPositionResponse>(url, config);
    return res.data;
  },

  getInventoryBatchExpiry: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<InventoryBatchExpiryReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/inventory/batch-expiry${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<InventoryBatchExpiryResponse>(url, config);
    return res.data;
  },

  getPurchasePayables: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<PurchaseOrderPayablesReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/purchase/payables${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<PurchasePayablesResponse>(url, config);
    return res.data;
  },

  getPurchaseReceiptVsOrder: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<PurchaseReceiptVsOrderReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/purchase/receipt-vs-order${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<PurchaseReceiptVsOrderResponse>(url, config);
    return res.data;
  },

  getHospitalAr: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<HospitalInvoicesArReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/finance/hospital-ar${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<HospitalArResponse>(url, config);
    return res.data;
  },

  getCashCollections: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<CashCollectionsReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/finance/cash-collections${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<CashCollectionsResponse>(url, config);
    return res.data;
  },

  getExpensesSummary: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<ExpensesSummaryReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/finance/expenses-summary${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<ExpensesSummaryResponse>(url, config);
    return res.data;
  },

  getInvoiceTaxLines: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<InvoiceTaxLinesReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/finance/invoice-tax-lines${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<InvoiceTaxLinesResponse>(url, config);
    return res.data;
  },

  getInvoiceLateFees: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<InvoiceLateFeesReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/finance/invoice-late-fees${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<InvoiceLateFeesResponse>(url, config);
    return res.data;
  },

  getInvoicesOutstanding: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<OutstandingInvoicesReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/finance/invoices-outstanding${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<OutstandingInvoicesResponse>(url, config);
    return res.data;
  },

  getOutstandingByHospital: async (
    params?: AnalyticsReportQueryParams,
    config?: RequestConfig
  ): Promise<OutstandingBalanceByHospitalReportDto> => {
    const qs = new URLSearchParams();
    appendReportParams(qs, params);
    const url = `/api/reports/finance/outstanding-by-hospital${qs.toString() ? `?${qs}` : ''}`;
    const res = await get<OutstandingByHospitalResponse>(url, config);
    return res.data;
  },
};
