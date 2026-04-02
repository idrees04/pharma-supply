import { get } from '@/api/requests';
import {
    DashboardSummary,
    MonthlySalesPurchase,
    TopProduct,
    LowStockAlert,
    PendingPaymentAlert,
    ApiResponse,
} from '@/types/api/dashboard';

// Helper to unwrap the API response and throw on failure
async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
    const response = await promise;
    if (!response.success) {
        throw new Error(response.message || 'API request failed');
    }
    return response.data;
}

export const dashboardService = {
    // Get summary statistics
    getSummary: async (): Promise<DashboardSummary> => {
        const data = await unwrap(get<ApiResponse<DashboardSummary>>('/api/Dashboard/summary'));
        // No numeric conversion needed if API returns numbers, but we ensure
        return data;
    },

    // Get monthly sales & purchases
    getMonthlySalesPurchases: async (): Promise<MonthlySalesPurchase[]> => {
        const data = await unwrap(get<ApiResponse<MonthlySalesPurchase[]>>('/api/Dashboard/monthly-sales-purchases'));
        // Ensure numeric values
        return data.map(item => ({
            ...item,
            sales: Number(item.sales),
            purchases: Number(item.purchases),
        }));
    },

    // Get top selling products
    getTopSellingProducts: async (): Promise<TopProduct[]> => {
        const data = await unwrap(get<ApiResponse<TopProduct[]>>('/api/Dashboard/top-selling-products'));
        return data.map(p => ({
            ...p,
            totalQuantitySold: Number(p.totalQuantitySold),
            totalRevenue: Number(p.totalRevenue),
        }));
    },

    // Get low stock alerts
    getLowStockAlerts: async (): Promise<LowStockAlert[]> => {
        const data = await unwrap(get<ApiResponse<LowStockAlert[]>>('/api/Dashboard/low-stock-alerts'));
        return data.map(alert => ({
            ...alert,
            availableQuantity: Number(alert.availableQuantity),
            reorderLevel: Number(alert.reorderLevel),
        }));
    },

    // Get pending payment alerts
    getPendingPaymentAlerts: async (): Promise<PendingPaymentAlert[]> => {
        const data = await unwrap(get<ApiResponse<PendingPaymentAlert[]>>('/api/Dashboard/pending-payment-alerts'));
        return data.map(payment => ({
            ...payment,
            outstandingAmount: Number(payment.outstandingAmount),
            daysOverdue: Number(payment.daysOverdue),
        }));
    },
};