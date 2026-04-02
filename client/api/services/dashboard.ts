import { get } from '@/api/requests';
import { DashboardSummary, SalesPurchaseDataPoint, TopProduct, LowStockProduct, PendingPayment } from '@/types/api/dashboard';

export const dashboardService = {
    // Fetch summary stats
    getSummary: async (): Promise<DashboardSummary> => {
        const data = await get<DashboardSummary>('/api/dashboard/summary');
        // Normalize numeric fields (in case API returns strings)
        return {
            ...data,
            totalSales: Number(data.totalSales),
            totalPurchases: Number(data.totalPurchases),
            netProfit: Number(data.netProfit),
            ordersCount: Number(data.ordersCount),
            salesTrend: Number(data.salesTrend),
            purchasesTrend: Number(data.purchasesTrend),
            profitTrend: Number(data.profitTrend),
            ordersTrend: Number(data.ordersTrend),
        };
    },

    // Fetch sales vs purchases data for a given period
    getSalesPurchases: async (period: string = 'month'): Promise<SalesPurchaseDataPoint[]> => {
        const data = await get<any[]>('/api/dashboard/sales-purchases', {
            params: { period },
        });
        return data.map((point: any) => ({
            date: point.date,
            sales: Number(point.sales),
            purchases: Number(point.purchases),
        }));
    },

    // Fetch top products
    getTopProducts: async (limit: number = 5): Promise<TopProduct[]> => {
        const data = await get<TopProduct[]>('/api/dashboard/top-products', {
            params: { limit },
        });
        return data.map((product: any) => ({
            ...product,
            quantitySold: Number(product.quantitySold),
            revenue: Number(product.revenue),
            trend: Number(product.trend),
        }));
    },

    // Fetch low stock products
    getLowStock: async (): Promise<LowStockProduct[]> => {
        const data = await get<LowStockProduct[]>('/api/dashboard/low-stock');
        return data.map((product: any) => ({
            ...product,
            currentStock: Number(product.currentStock),
            reorderLevel: Number(product.reorderLevel),
            criticalLevel: product.criticalLevel ? Number(product.criticalLevel) : undefined,
        }));
    },

    // Fetch pending payments
    getPendingPayments: async (): Promise<PendingPayment[]> => {
        const data = await get<PendingPayment[]>('/api/dashboard/pending-payments');
        return data.map((payment: any) => ({
            ...payment,
            amount: Number(payment.amount),
            dueDate: payment.dueDate,
            status: payment.status,
        }));
    },
};