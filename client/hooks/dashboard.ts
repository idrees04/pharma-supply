import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
    DashboardSummary,
    MonthlySalesPurchase,
    TopProduct,
    LowStockAlert,
    PendingPaymentAlert,
} from '@/types/api/dashboard';
import { dashboardService } from '@/api/services/dashboard';

export const useSummary = (): UseQueryResult<DashboardSummary, Error> => {
    return useQuery({
        queryKey: ['dashboard', 'summary'],
        queryFn: dashboardService.getSummary,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useMonthlySalesPurchases = (): UseQueryResult<MonthlySalesPurchase[], Error> => {
    return useQuery({
        queryKey: ['dashboard', 'monthlySalesPurchases'],
        queryFn: dashboardService.getMonthlySalesPurchases,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useTopSellingProducts = (): UseQueryResult<TopProduct[], Error> => {
    return useQuery({
        queryKey: ['dashboard', 'topSellingProducts'],
        queryFn: dashboardService.getTopSellingProducts,
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useLowStockAlerts = (): UseQueryResult<LowStockAlert[], Error> => {
    return useQuery({
        queryKey: ['dashboard', 'lowStockAlerts'],
        queryFn: dashboardService.getLowStockAlerts,
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const usePendingPaymentAlerts = (): UseQueryResult<PendingPaymentAlert[], Error> => {
    return useQuery({
        queryKey: ['dashboard', 'pendingPaymentAlerts'],
        queryFn: dashboardService.getPendingPaymentAlerts,
        staleTime: 3 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

// Combined hook for the dashboard page
export const useDashboardData = () => {
    const summary = useSummary();
    const monthly = useMonthlySalesPurchases();
    const topProducts = useTopSellingProducts();
    const lowStock = useLowStockAlerts();
    const pendingPayments = usePendingPaymentAlerts();

    const isLoading =
        summary.isLoading ||
        monthly.isLoading ||
        topProducts.isLoading ||
        lowStock.isLoading ||
        pendingPayments.isLoading;

    const isError =
        summary.isError ||
        monthly.isError ||
        topProducts.isError ||
        lowStock.isError ||
        pendingPayments.isError;

    const error =
        summary.error ||
        monthly.error ||
        topProducts.error ||
        lowStock.error ||
        pendingPayments.error;

    const refetch = () => {
        summary.refetch();
        monthly.refetch();
        topProducts.refetch();
        lowStock.refetch();
        pendingPayments.refetch();
    };

    return {
        summary: summary.data,
        monthlySalesPurchases: monthly.data,
        topProducts: topProducts.data,
        lowStock: lowStock.data,
        pendingPayments: pendingPayments.data,
        isLoading,
        isError,
        error,
        refetch,
    };
};