import type { ApiResponse } from './common';

export type ReportModuleId = 'supply-order' | 'inventory' | 'purchase' | 'finance' | 'invoices';

export type AnalyticsReportId =
  | 'pipeline'
  | 'by-hospital'
  | 'fulfillment-sla'
  | 'stock-position'
  | 'batch-expiry'
  | 'payables'
  | 'receipt-vs-order'
  | 'hospital-ar'
  | 'cash-collections'
  | 'expenses-summary'
  | 'invoice-tax-lines'
  | 'invoice-late-fees'
  | 'invoices-outstanding'
  | 'outstanding-by-hospital';

export interface AnalyticsReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  hospitalId?: number;
  supplierId?: number;
  productId?: number;
}

// Supply order
export interface SupplyOrderPipelineRowDto {
  status: number;
  statusName: string;
  orderCount: number;
  totalAmount: number;
}

export interface SupplyOrderPipelineReportDto {
  rows: SupplyOrderPipelineRowDto[];
  totalOrderCount: number;
  grandTotalAmount: number;
}

export interface SupplyOrdersByHospitalRowDto {
  hospitalId: number;
  hospitalName: string;
  orderCount: number;
  totalAmount: number;
}

export interface SupplyOrdersByHospitalReportDto {
  rows: SupplyOrdersByHospitalRowDto[];
  totalOrderCount: number;
  grandTotalAmount: number;
}

export interface SupplyOrderFulfillmentSlaRowDto {
  supplyOrderId: number;
  supplyOrderNumber: string;
  hospitalId: number;
  hospitalName: string;
  orderDate: string;
  requiredByDate: string | null;
  fulfilledDate: string | null;
  firstDispatchDate: string | null;
  daysVarianceVsRequired: number | null;
}

export interface SupplyOrderFulfillmentSlaReportDto {
  rows: SupplyOrderFulfillmentSlaRowDto[];
}

// Inventory
export interface InventoryStockPositionRowDto {
  productId: number;
  productCode: string;
  productName: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  averageCost: number;
  totalValue: number;
  lastRestockedDate: string | null;
  lastDispatchedDate: string | null;
}

export interface InventoryStockPositionReportDto {
  rows: InventoryStockPositionRowDto[];
  grandTotalStockValue: number;
}

export interface InventoryBatchExpiryRowDto {
  productBatchId: number;
  productId: number;
  productCode: string;
  productName: string;
  batchNumber: string;
  expiryDate: string | null;
  currentQuantity: number;
  purchaseRate: number;
  daysUntilExpiry: number | null;
}

export interface InventoryBatchExpiryReportDto {
  rows: InventoryBatchExpiryRowDto[];
}

// Purchase
export interface PurchaseOrderPayablesRowDto {
  supplierId: number;
  supplierName: string;
  purchaseOrderCount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface PurchaseOrderPayablesReportDto {
  rows: PurchaseOrderPayablesRowDto[];
  totalOutstanding: number;
  totalPaid: number;
}

export interface PurchaseReceiptVsOrderRowDto {
  purchaseOrderId: number;
  purchaseOrderNumber: string;
  supplierId: number;
  supplierName: string;
  purchaseOrderItemId: number;
  productId: number;
  productCode: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  fillRatePercent: number | null;
}

export interface PurchaseReceiptVsOrderReportDto {
  rows: PurchaseReceiptVsOrderRowDto[];
}

// Finance
export interface ArAgingSummaryDto {
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  daysOver90: number;
}

export interface HospitalInvoicesArRowDto {
  invoiceId: number;
  invoiceNumber: string;
  hospitalId: number;
  hospitalName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  daysPastDue: number | null;
  agingBucket: string | null;
}

export interface HospitalInvoicesArReportDto {
  rows: HospitalInvoicesArRowDto[];
  agingSummary: ArAgingSummaryDto;
  totalOutstanding: number;
}

export interface CashCollectionsRowDto {
  paymentId: number;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMode: number;
  paymentModeName: string;
  accountId: number;
  invoiceId: number | null;
  hospitalName: string | null;
}

export interface CashCollectionsReportDto {
  rows: CashCollectionsRowDto[];
  totalCollected: number;
}

export interface ExpensesSummaryRowDto {
  expenseCategoryId: number;
  categoryName: string;
  expenseCount: number;
  totalAmount: number;
}

export interface ExpensesSummaryReportDto {
  rows: ExpensesSummaryRowDto[];
  grandTotal: number;
}

// Invoices
export interface InvoiceTaxLineReportRowDto {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  hospitalId: number;
  hospitalName: string;
  taxTypeName: string;
  taxPercentage: number;
  taxableAmount: number;
  taxCollected: number;
  invoiceItemId: number;
}

export interface InvoiceTaxLinesReportDto {
  rows: InvoiceTaxLineReportRowDto[];
  grandTotalTaxableAmount: number;
  grandTotalTaxCollected: number;
}

export interface InvoiceLateFeeRowDto {
  invoiceId: number;
  invoiceNumber: string;
  hospitalId: number;
  hospitalName: string;
  invoiceDate: string;
  dueDate: string;
  daysPastDue: number | null;
  lateFeeAmount: number;
  totalPayableAmount: number;
  totalInvoiceAmount: number;
  outstandingAmount: number;
}

export interface InvoiceLateFeesReportDto {
  rows: InvoiceLateFeeRowDto[];
  grandTotalLateFees: number;
}

export interface OutstandingInvoiceRowDto {
  invoiceId: number;
  invoiceNumber: string;
  hospitalId: number;
  hospitalName: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: number;
  statusName: string;
}

export interface OutstandingInvoicesReportDto {
  rows: OutstandingInvoiceRowDto[];
  totalRemainingBalance: number;
}

export interface OutstandingBalanceByHospitalRowDto {
  hospitalId: number;
  hospitalName: string;
  unpaidInvoiceCount: number;
  totalOutstandingAmount: number;
  overdueOutstandingAmount: number;
  agingSummary: ArAgingSummaryDto;
}

export interface OutstandingBalanceByHospitalReportDto {
  rows: OutstandingBalanceByHospitalRowDto[];
  totalUnpaidInvoiceCount: number;
  grandTotalOutstanding: number;
  grandTotalOverdue: number;
}

export type SupplyOrderPipelineResponse = ApiResponse<SupplyOrderPipelineReportDto>;
export type SupplyOrdersByHospitalResponse = ApiResponse<SupplyOrdersByHospitalReportDto>;
export type SupplyOrderFulfillmentSlaResponse = ApiResponse<SupplyOrderFulfillmentSlaReportDto>;
export type InventoryStockPositionResponse = ApiResponse<InventoryStockPositionReportDto>;
export type InventoryBatchExpiryResponse = ApiResponse<InventoryBatchExpiryReportDto>;
export type PurchasePayablesResponse = ApiResponse<PurchaseOrderPayablesReportDto>;
export type PurchaseReceiptVsOrderResponse = ApiResponse<PurchaseReceiptVsOrderReportDto>;
export type HospitalArResponse = ApiResponse<HospitalInvoicesArReportDto>;
export type CashCollectionsResponse = ApiResponse<CashCollectionsReportDto>;
export type ExpensesSummaryResponse = ApiResponse<ExpensesSummaryReportDto>;
export type InvoiceTaxLinesResponse = ApiResponse<InvoiceTaxLinesReportDto>;
export type InvoiceLateFeesResponse = ApiResponse<InvoiceLateFeesReportDto>;
export type OutstandingInvoicesResponse = ApiResponse<OutstandingInvoicesReportDto>;
export type OutstandingByHospitalResponse = ApiResponse<OutstandingBalanceByHospitalReportDto>;
