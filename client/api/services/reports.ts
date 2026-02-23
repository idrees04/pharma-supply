import { get, RequestConfig } from '@/api/requests';
import {
    StockExpiryReportDto,
    SupplyOrderReportDto,
    PurchaseOrderReportDto,
    InventoryReportDto,
    FinancialSummaryDto,
    ExpenseReportDto,
    SupplyOrderReportParams,
    PurchaseOrderReportParams,
    FinancialSummaryParams,
    ExpenseReportParams,
    GetStockExpiryReportResponse,
    GetSupplyOrderReportResponse,
    GetPurchaseOrderReportResponse,
    GetInventoryReportResponse,
    GetFinancialSummaryResponse,
    GetExpenseReportResponse,
} from '@/types/api/reports';

export const reportService = {
    /**
     * Get stock expiry report
     */
    getStockExpiryReport: async (
        daysAhead: number = 180,
        config?: RequestConfig
    ): Promise<StockExpiryReportDto[]> => {
        const response = await get<GetStockExpiryReportResponse>(
            `/api/Reports/stock-expiry?daysAhead=${daysAhead}`,
            config
        );
        return response.data;
    },

    /**
     * Get supply orders report
     */
    getSupplyOrderReport: async (
        params?: SupplyOrderReportParams,
        config?: RequestConfig
    ): Promise<SupplyOrderReportDto[]> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.startDate) queryParams.append('StartDate', params.startDate);
            if (params.endDate) queryParams.append('EndDate', params.endDate);
            if (params.supplierId !== undefined) queryParams.append('SupplierId', params.supplierId.toString());
            if (params.hospitalId !== undefined) queryParams.append('HospitalId', params.hospitalId.toString());
            if (params.productId !== undefined) queryParams.append('ProductId', params.productId.toString());
            if (params.categoryId !== undefined) queryParams.append('CategoryId', params.categoryId.toString());
        }

        const url = `/api/Reports/supply-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetSupplyOrderReportResponse>(url, config);
        return response.data;
    },

    /**
     * Get purchase orders report
     */
    getPurchaseOrderReport: async (
        params?: PurchaseOrderReportParams,
        config?: RequestConfig
    ): Promise<PurchaseOrderReportDto[]> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.startDate) queryParams.append('StartDate', params.startDate);
            if (params.endDate) queryParams.append('EndDate', params.endDate);
            if (params.supplierId !== undefined) queryParams.append('SupplierId', params.supplierId.toString());
            if (params.hospitalId !== undefined) queryParams.append('HospitalId', params.hospitalId.toString());
            if (params.productId !== undefined) queryParams.append('ProductId', params.productId.toString());
            if (params.categoryId !== undefined) queryParams.append('CategoryId', params.categoryId.toString());
        }

        const url = `/api/Reports/purchase-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetPurchaseOrderReportResponse>(url, config);
        return response.data;
    },

    /**
     * Get inventory report
     */
    getInventoryReport: async (config?: RequestConfig): Promise<InventoryReportDto[]> => {
        const response = await get<GetInventoryReportResponse>('/api/Reports/inventory', config);
        return response.data;
    },

    /**
     * Get financial summary report
     */
    getFinancialSummary: async (
        params?: FinancialSummaryParams,
        config?: RequestConfig
    ): Promise<FinancialSummaryDto> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.startDate) queryParams.append('StartDate', params.startDate);
            if (params.endDate) queryParams.append('EndDate', params.endDate);
            if (params.supplierId !== undefined) queryParams.append('SupplierId', params.supplierId.toString());
            if (params.hospitalId !== undefined) queryParams.append('HospitalId', params.hospitalId.toString());
            if (params.productId !== undefined) queryParams.append('ProductId', params.productId.toString());
            if (params.categoryId !== undefined) queryParams.append('CategoryId', params.categoryId.toString());
        }

        const url = `/api/Reports/financial-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetFinancialSummaryResponse>(url, config);
        return response.data;
    },

    /**
     * Get expenses report
     */
    getExpenseReport: async (
        params?: ExpenseReportParams,
        config?: RequestConfig
    ): Promise<ExpenseReportDto[]> => {
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.startDate) queryParams.append('StartDate', params.startDate);
            if (params.endDate) queryParams.append('EndDate', params.endDate);
            if (params.supplierId !== undefined) queryParams.append('SupplierId', params.supplierId.toString());
            if (params.hospitalId !== undefined) queryParams.append('HospitalId', params.hospitalId.toString());
            if (params.productId !== undefined) queryParams.append('ProductId', params.productId.toString());
            if (params.categoryId !== undefined) queryParams.append('CategoryId', params.categoryId.toString());
        }

        const url = `/api/Reports/expenses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await get<GetExpenseReportResponse>(url, config);
        return response.data;
    },
};