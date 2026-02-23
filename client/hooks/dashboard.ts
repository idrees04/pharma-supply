import { useGetQuery } from '@/api/hooks';
import { dashboardService } from '@/api/services/dashboard';
import {
    DashboardSummaryDto,
    MonthlySalesVsPurchasesDto,
    TopSellingProductDto,
    LowStockAlertDto,
    PendingPaymentAlertDto,
} from '@/types/api/dashboard';

export function useDashboardSummary() {
    return useGetQuery<DashboardSummaryDto>(
        ['dashboard', 'summary'],
        () => dashboardService.getSummary(),
        {
            staleTime: 5 * 60 * 1000, // 5 minutes
        }
    );
}

export function useMonthlySalesPurchases(months: number = 12) {
    return useGetQuery<MonthlySalesVsPurchasesDto[]>(
        ['dashboard', 'monthlySalesPurchases', months],
        () => dashboardService.getMonthlySalesPurchases(months),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useTopSellingProducts(top: number = 10) {
    return useGetQuery<TopSellingProductDto[]>(
        ['dashboard', 'topSellingProducts', top],
        () => dashboardService.getTopSellingProducts(top),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useLowStockAlerts() {
    return useGetQuery<LowStockAlertDto[]>(
        ['dashboard', 'lowStockAlerts'],
        () => dashboardService.getLowStockAlerts(),
        {
            staleTime: 2 * 60 * 1000, // 2 minutes
        }
    );
}

export function usePendingPaymentAlerts() {
    return useGetQuery<PendingPaymentAlertDto[]>(
        ['dashboard', 'pendingPaymentAlerts'],
        () => dashboardService.getPendingPaymentAlerts(),
        {
            staleTime: 2 * 60 * 1000,
        }
    );
}