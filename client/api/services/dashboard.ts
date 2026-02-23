import { get, RequestConfig } from '@/api/requests';
import {
    DashboardSummaryDto,
    MonthlySalesVsPurchasesDto,
    TopSellingProductDto,
    LowStockAlertDto,
    PendingPaymentAlertDto,
    GetDashboardSummaryResponse,
    GetMonthlySalesPurchasesResponse,
    GetTopSellingProductsResponse,
    GetLowStockAlertsResponse,
    GetPendingPaymentAlertsResponse,
} from '@/types/api/dashboard';

export const dashboardService = {
    /**
     * Get dashboard summary statistics
     */
    getSummary: async (config?: RequestConfig): Promise<DashboardSummaryDto> => {
        const response = await get<GetDashboardSummaryResponse>('/api/Dashboard/summary', config);
        return response.data;
    },

    /**
     * Get monthly sales vs purchases data
     */
    getMonthlySalesPurchases: async (
        months: number = 12,
        config?: RequestConfig
    ): Promise<MonthlySalesVsPurchasesDto[]> => {
        const response = await get<GetMonthlySalesPurchasesResponse>(
            `/api/Dashboard/monthly-sales-purchases?months=${months}`,
            config
        );
        return response.data;
    },

    /**
     * Get top selling products
     */
    getTopSellingProducts: async (
        top: number = 10,
        config?: RequestConfig
    ): Promise<TopSellingProductDto[]> => {
        const response = await get<GetTopSellingProductsResponse>(
            `/api/Dashboard/top-selling-products?top=${top}`,
            config
        );
        return response.data;
    },

    /**
     * Get low stock alerts
     */
    getLowStockAlerts: async (config?: RequestConfig): Promise<LowStockAlertDto[]> => {
        const response = await get<GetLowStockAlertsResponse>('/api/Dashboard/low-stock-alerts', config);
        return response.data;
    },

    /**
     * Get pending payment alerts
     */
    getPendingPaymentAlerts: async (config?: RequestConfig): Promise<PendingPaymentAlertDto[]> => {
        const response = await get<GetPendingPaymentAlertsResponse>('/api/Dashboard/pending-payment-alerts', config);
        return response.data;
    },
};