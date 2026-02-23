import { ApiResponse } from './common';

// DTOs
export interface DashboardSummaryDto {
    totalHospitals: number;
    activeHospitals: number;
    totalSuppliers: number;
    activeSuppliers: number;
    totalProducts: number;
    lowStockProducts: number;
    pendingSupplyOrders: number;
    pendingPurchaseOrders: number;
    totalCashBalance: number;
    totalBankBalance: number;
    outstandingReceivables: number;
    outstandingPayables: number;
}

export interface MonthlySalesVsPurchasesDto {
    month: string | null;
    sales: number;
    purchases: number;
}

export interface TopSellingProductDto {
    productName: string | null;
    productCode: string | null;
    totalQuantitySold: number;
    totalRevenue: number;
}

export interface LowStockAlertDto {
    productName: string | null;
    productCode: string | null;
    availableQuantity: number;
    reorderLevel: number;
}

export interface PendingPaymentAlertDto {
    invoiceNumber: string | null;
    hospitalName: string | null;
    dueDate: string; // ISO date
    outstandingAmount: number;
    daysOverdue: number;
}

// Response types
export type GetDashboardSummaryResponse = ApiResponse<DashboardSummaryDto>;
export type GetMonthlySalesPurchasesResponse = ApiResponse<MonthlySalesVsPurchasesDto[]>;
export type GetTopSellingProductsResponse = ApiResponse<TopSellingProductDto[]>;
export type GetLowStockAlertsResponse = ApiResponse<LowStockAlertDto[]>;
export type GetPendingPaymentAlertsResponse = ApiResponse<PendingPaymentAlertDto[]>;