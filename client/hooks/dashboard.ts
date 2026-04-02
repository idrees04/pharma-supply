import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { dashboardService } from '@/api/services/dashboard';
import { DashboardSummary, SalesPurchaseDataPoint, TopProduct, LowStockProduct, PendingPayment } from '@/types/api/dashboard';

// Individual queries
export const useSummary = (): UseQueryResult<DashboardSummary, Error> => {
    return useQuery({
        queryKey: ['dashboard', 'summary'],
        queryFn: dashboardService.getSummary,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useSalesPurchases = (period: string = 'month'): UseQueryResult<SalesPurchaseDataPoint[], Error> => {
    return useQuery({
        queryKey: ['dashboard', 'salesPurchases', period],
        queryFn: () => dashboardService.getSalesPurchases(period),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useTopProducts = (limit: number = 5): UseQueryResult<TopProduct[], Error> => {
    return useQuery({
        queryKey: ['dashboard', 'topProducts', limit],
        queryFn: () => dashboardService.getTopProducts(limit),
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useLowStock = (): UseQueryResult<LowStockProduct[], Error> => {
    return useQuery({
        queryKey: ['dashboard', 'lowStock'],
        queryFn: dashboardService.getLowStock,
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const usePendingPayments = (): UseQueryResult<PendingPayment[], Error> => {
    return useQuery({
        queryKey: ['dashboard', 'pendingPayments'],
        queryFn: dashboardService.getPendingPayments,
        staleTime: 3 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

// Combined hook for the whole dashboard
export const useDashboardData = () => {
    const summary = useSummary();
    const salesPurchases = useSalesPurchases();
    const topProducts = useTopProducts();
    const lowStock = useLowStock();
    const pendingPayments = usePendingPayments();

    const isLoading =
        summary.isLoading ||
        salesPurchases.isLoading ||
        topProducts.isLoading ||
        lowStock.isLoading ||
        pendingPayments.isLoading;

    const isError =
        summary.isError ||
        salesPurchases.isError ||
        topProducts.isError ||
        lowStock.isError ||
        pendingPayments.isError;

    const error =
        summary.error ||
        salesPurchases.error ||
        topProducts.error ||
        lowStock.error ||
        pendingPayments.error;

    const refetch = () => {
        summary.refetch();
        salesPurchases.refetch();
        topProducts.refetch();
        lowStock.refetch();
        pendingPayments.refetch();
    };

    return {
        summary: summary.data,
        salesPurchases: salesPurchases.data,
        topProducts: topProducts.data,
        lowStock: lowStock.data,
        pendingPayments: pendingPayments.data,
        isLoading,
        isError,
        error,
        refetch,
    };
};