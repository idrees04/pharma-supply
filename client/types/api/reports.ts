import { ApiResponse } from './common';

// DTOs
export interface StockExpiryReportDto {
    productId: number;
    productName: string | null;
    productCode: string | null;
    batchNumber: string | null;
    currentQuantity: number;
    expiryDate: string | null;
    daysToExpiry: number;
}

export interface SupplyOrderReportDto {
    supplyOrderNumber: string | null;
    orderDate: string; // ISO date
    hospitalName: string | null;
    totalAmount: number;
    status: string | null;
    fulfillmentType: string | null;
}

export interface PurchaseOrderReportDto {
    purchaseOrderNumber: string | null;
    orderDate: string; // ISO date
    supplierName: string | null;
    totalAmount: number;
    status: string | null;
}

export interface InventoryReportDto {
    productName: string | null;
    productCode: string | null;
    availableQuantity: number;
    reservedQuantity: number;
    reorderLevel: number;
    isLowStock: boolean;
}

export interface FinancialSummaryDto {
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    netProfit: number;
    totalReceivables: number;
    totalPayables: number;
    cashBalance: number;
    bankBalance: number;
}

export interface ExpenseReportDto {
    expenseNumber: string | null;
    expenseDate: string; // ISO date
    categoryName: string | null;
    amount: number;
    description: string | null;
    status: string | null;
}

// Query parameters
export interface DateRangeParams {
    startDate?: string; // ISO date
    endDate?: string;
}

export interface SupplyOrderReportParams extends DateRangeParams {
    supplierId?: number;
    hospitalId?: number;
    productId?: number;
    categoryId?: number;
}

export interface PurchaseOrderReportParams extends DateRangeParams {
    supplierId?: number;
    hospitalId?: number;
    productId?: number;
    categoryId?: number;
}

export interface FinancialSummaryParams extends DateRangeParams {
    supplierId?: number;
    hospitalId?: number;
    productId?: number;
    categoryId?: number;
}

export interface ExpenseReportParams extends DateRangeParams {
    supplierId?: number;
    hospitalId?: number;
    productId?: number;
    categoryId?: number;
}

// Response types
export type GetStockExpiryReportResponse = ApiResponse<StockExpiryReportDto[]>;
export type GetSupplyOrderReportResponse = ApiResponse<SupplyOrderReportDto[]>;
export type GetPurchaseOrderReportResponse = ApiResponse<PurchaseOrderReportDto[]>;
export type GetInventoryReportResponse = ApiResponse<InventoryReportDto[]>;
export type GetFinancialSummaryResponse = ApiResponse<FinancialSummaryDto>;
export type GetExpenseReportResponse = ApiResponse<ExpenseReportDto[]>;