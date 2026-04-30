import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { deliveryChallanService } from '@/api/services/deliveryChallans';
import { ApiError } from '@/api/errors';
import type {
  DeliveryChallan,
  GetDeliveryChallanResponse,
} from '@/types/api/deliveryChallans';

const deliveryChallanKeys = {
  all: ['deliveryChallans'] as const,
  details: () => [...deliveryChallanKeys.all, 'detail'] as const,
  detail: (id: number) => [...deliveryChallanKeys.details(), id] as const,
};

export function useDeliveryChallan(
  id: number | null,
  options?: Omit<UseQueryOptions<DeliveryChallan, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: deliveryChallanKeys.detail(id || 0),
    queryFn: () => deliveryChallanService.getDeliveryChallanById(id!),
    enabled: id !== null && id > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

export { deliveryChallanKeys };
