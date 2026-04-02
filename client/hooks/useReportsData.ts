import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/api/services/reports';
import { RequestConfig } from '@/api/requests';
import {
  SupplyOrderReportParams,
  PurchaseOrderReportParams,
  FinancialSummaryParams,
  ExpenseReportParams,
} from '@/types/api/reports';

export function useStockExpiryReport(daysAhead: number = 180, config?: RequestConfig) {
  return useQuery({
    queryKey: ['reports', 'stock-expiry', daysAhead],
    queryFn: () => reportService.getStockExpiryReport(daysAhead, config),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useSupplyOrderReport(params?: SupplyOrderReportParams, config?: RequestConfig) {
  return useQuery({
    queryKey: ['reports', 'supply-orders', params],
    queryFn: () => reportService.getSupplyOrderReport(params, config),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function usePurchaseOrderReport(params?: PurchaseOrderReportParams, config?: RequestConfig) {
  return useQuery({
    queryKey: ['reports', 'purchase-orders', params],
    queryFn: () => reportService.getPurchaseOrderReport(params, config),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useInventoryReport(config?: RequestConfig) {
  return useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: () => reportService.getInventoryReport(config),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useFinancialSummary(params?: FinancialSummaryParams, config?: RequestConfig) {
  return useQuery({
    queryKey: ['reports', 'financial-summary', params],
    queryFn: () => reportService.getFinancialSummary(params, config),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useExpenseReport(params?: ExpenseReportParams, config?: RequestConfig) {
  return useQuery({
    queryKey: ['reports', 'expenses', params],
    queryFn: () => reportService.getExpenseReport(params, config),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
