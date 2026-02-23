import { useGetQuery } from '@/api/hooks';
import { reportService } from '@/api/services/reports';
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
} from '@/types/api/reports';

export function useStockExpiryReport(daysAhead: number = 180) {
    return useGetQuery<StockExpiryReportDto[]>(
        ['reports', 'stockExpiry', daysAhead],
        () => reportService.getStockExpiryReport(daysAhead),
        {
            staleTime: 30 * 60 * 1000, // 30 minutes
        }
    );
}

export function useSupplyOrderReport(params?: SupplyOrderReportParams) {
    return useGetQuery<SupplyOrderReportDto[]>(
        ['reports', 'supplyOrders', params],
        () => reportService.getSupplyOrderReport(params),
        {
            staleTime: 10 * 60 * 1000,
        }
    );
}

export function usePurchaseOrderReport(params?: PurchaseOrderReportParams) {
    return useGetQuery<PurchaseOrderReportDto[]>(
        ['reports', 'purchaseOrders', params],
        () => reportService.getPurchaseOrderReport(params),
        {
            staleTime: 10 * 60 * 1000,
        }
    );
}

export function useInventoryReport() {
    return useGetQuery<InventoryReportDto[]>(
        ['reports', 'inventory'],
        () => reportService.getInventoryReport(),
        {
            staleTime: 15 * 60 * 1000,
        }
    );
}

export function useFinancialSummary(params?: FinancialSummaryParams) {
    return useGetQuery<FinancialSummaryDto>(
        ['reports', 'financialSummary', params],
        () => reportService.getFinancialSummary(params),
        {
            staleTime: 10 * 60 * 1000,
        }
    );
}

export function useExpenseReport(params?: ExpenseReportParams) {
    return useGetQuery<ExpenseReportDto[]>(
        ['reports', 'expenses', params],
        () => reportService.getExpenseReport(params),
        {
            staleTime: 10 * 60 * 1000,
        }
    );
}