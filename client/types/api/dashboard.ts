// modules/dashboard/types/dashboard.types.ts

// Summary Card
export interface DashboardSummary {
    totalSales: number;
    totalPurchases: number;
    netProfit: number;
    ordersCount: number;
    salesTrend: number;
    purchasesTrend: number;
    profitTrend: number;
    ordersTrend: number;
    lastUpdated: string; // ISO date string
}

// Sales vs Purchases Chart Data Point
export interface SalesPurchaseDataPoint {
    date: string;
    sales: number;
    purchases: number;
}

// Top Product
export interface TopProduct {
    id: string;
    name: string;
    imageUrl?: string | null;
    quantitySold: number;
    revenue: number;
    trend: number;
}

// Low Stock Alert
export interface LowStockProduct {
    id: string;
    name: string;
    currentStock: number;
    reorderLevel: number;
    criticalLevel?: number;
}

// Pending Payment
export interface PendingPayment {
    id: string;
    customerName: string;
    amount: number;
    dueDate: string; // ISO date
    status: 'pending' | 'overdue';
}

// Combined dashboard data type (optional)
export interface DashboardData {
    summary: DashboardSummary;
    salesPurchases: SalesPurchaseDataPoint[];
    topProducts: TopProduct[];
    lowStock: LowStockProduct[];
    pendingPayments: PendingPayment[];
}