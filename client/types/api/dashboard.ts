// modules/dashboard/types/dashboard.types.ts

// Summary data from /api/Dashboard/summary
// Generic API response wrapper (used internally by the service)

export interface DashboardSummary {
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

// Monthly sales vs purchases
export interface MonthlySalesPurchase {
    month: string | null;          // e.g., "2025-03", nullable
    sales: number;
    purchases: number;
}

// Top selling product
export interface TopProduct {
    productName: string | null;
    productCode: string | null;
    totalQuantitySold: number;
    totalRevenue: number;
}

// Low stock alert
export interface LowStockAlert {
    productName: string | null;
    productCode: string | null;
    availableQuantity: number;
    reorderLevel: number;
}

// Pending payment alert
export interface PendingPaymentAlert {
    invoiceNumber: string | null;
    hospitalName: string | null;
    dueDate: string;        // ISO date
    outstandingAmount: number;
    daysOverdue: number;
    netDays: number;
    isOverdue: boolean;
}

// Operational alerts (new)
export interface OperationalAlerts {
    lowStockProductCount: number;
    unfulfilledOrPartialSupplyOrderCount: number;
    pendingOrSentPurchaseOrderCount: number;
    invoicesWithReceivableBalance: number;
    invoicesWithReceivableOverdue: number;
    purchaseOrdersWithPayableBalance: number;
    totalOutstandingReceivables: number;
    totalOutstandingPayables: number;
}

// Generic API response wrapper (used internally)
export * from '@/types/api/common';