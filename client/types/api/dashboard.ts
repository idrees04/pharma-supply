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
    month: string;          // e.g., "2025-03"
    sales: number;
    purchases: number;
}

// Top selling product
export interface TopProduct {
    productName: string;
    productCode: string;
    totalQuantitySold: number;
    totalRevenue: number;
}

// Low stock alert
export interface LowStockAlert {
    productName: string;
    productCode: string;
    availableQuantity: number;
    reorderLevel: number;
}

// Pending payment alert
export interface PendingPaymentAlert {
    invoiceNumber: string;
    hospitalName: string;
    dueDate: string;        // ISO date
    outstandingAmount: number;
    daysOverdue: number;
}

// Generic API response wrapper (used internally)
export * from '@/types/api/common';