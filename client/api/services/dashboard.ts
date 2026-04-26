import { get } from '@/api/requests';
import {
    DashboardSummary,
    MonthlySalesPurchase,
    TopProduct,
    LowStockAlert,
    PendingPaymentAlert,
    OperationalAlerts,
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
        // Ensure numeric values are numbers (they should be)
        return {
            totalHospitals: Number(data.totalHospitals) || 0,
            activeHospitals: Number(data.activeHospitals) || 0,
            totalSuppliers: Number(data.totalSuppliers) || 0,
            activeSuppliers: Number(data.activeSuppliers) || 0,
            totalProducts: Number(data.totalProducts) || 0,
            lowStockProducts: Number(data.lowStockProducts) || 0,
            pendingSupplyOrders: Number(data.pendingSupplyOrders) || 0,
            pendingPurchaseOrders: Number(data.pendingPurchaseOrders) || 0,
            totalCashBalance: Number(data.totalCashBalance) || 0,
            totalBankBalance: Number(data.totalBankBalance) || 0,
            outstandingReceivables: Number(data.outstandingReceivables) || 0,
            outstandingPayables: Number(data.outstandingPayables) || 0,
        };
    },

    // Get monthly sales & purchases
    getMonthlySalesPurchases: async (): Promise<MonthlySalesPurchase[]> => {
        const data = await unwrap(get<ApiResponse<MonthlySalesPurchase[]>>('/api/Dashboard/monthly-sales-purchases'));
        // Ensure numeric values
        return data.map(item => ({
            month: item.month ?? null,
            sales: Number(item.sales) || 0,
            purchases: Number(item.purchases) || 0,
        }));
    },

    // Get top selling products
    getTopSellingProducts: async (): Promise<TopProduct[]> => {
        const data = await unwrap(get<ApiResponse<TopProduct[]>>('/api/Dashboard/top-selling-products'));
        return data.map(p => ({
            productName: p.productName ?? null,
            productCode: p.productCode ?? null,
            totalQuantitySold: Number(p.totalQuantitySold) || 0,
            totalRevenue: Number(p.totalRevenue) || 0,
        }));
    },

    // Get low stock alerts
    getLowStockAlerts: async (): Promise<LowStockAlert[]> => {
        const data = await unwrap(get<ApiResponse<LowStockAlert[]>>('/api/Dashboard/low-stock-alerts'));
        return data.map(alert => ({
            productName: alert.productName ?? null,
            productCode: alert.productCode ?? null,
            availableQuantity: Number(alert.availableQuantity) || 0,
            reorderLevel: Number(alert.reorderLevel) || 0,
        }));
    },

    // Get pending payment alerts
    getPendingPaymentAlerts: async (): Promise<PendingPaymentAlert[]> => {
        const data = await unwrap(get<ApiResponse<PendingPaymentAlert[]>>('/api/Dashboard/pending-payment-alerts'));
        return data.map(payment => ({
            invoiceNumber: payment.invoiceNumber ?? null,
            hospitalName: payment.hospitalName ?? null,
            dueDate: payment.dueDate,
            outstandingAmount: Number(payment.outstandingAmount) || 0,
            daysOverdue: Number(payment.daysOverdue) || 0,
            netDays: Number(payment.netDays) || 0,
            isOverdue: Boolean(payment.isOverdue),
        }));
    },

    // Get operational alerts
    getOperationalAlerts: async (): Promise<OperationalAlerts> => {
        const data = await unwrap(get<ApiResponse<OperationalAlerts>>('/api/Dashboard/operational-alerts'));
        // Ensure numeric values
        return {
            lowStockProductCount: Number(data.lowStockProductCount) || 0,
            unfulfilledOrPartialSupplyOrderCount: Number(data.unfulfilledOrPartialSupplyOrderCount) || 0,
            pendingOrSentPurchaseOrderCount: Number(data.pendingOrSentPurchaseOrderCount) || 0,
            invoicesWithReceivableBalance: Number(data.invoicesWithReceivableBalance) || 0,
            invoicesWithReceivableOverdue: Number(data.invoicesWithReceivableOverdue) || 0,
            purchaseOrdersWithPayableBalance: Number(data.purchaseOrdersWithPayableBalance) || 0,
            totalOutstandingReceivables: Number(data.totalOutstandingReceivables) || 0,
            totalOutstandingPayables: Number(data.totalOutstandingPayables) || 0,
        };
    },
};