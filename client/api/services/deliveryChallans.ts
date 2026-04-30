/**
 * Delivery Challans API Service
 *
 * API Base: /api/DeliveryChallans
 */

import { get, RequestConfig } from '@/api/requests';
import {
  DeliveryChallan,
  GetDeliveryChallanResponse,
} from '@/types/api/deliveryChallans';

export const deliveryChallanService = {
  /**
   * Get a single delivery challan by ID
   */
  getDeliveryChallanById: async (id: number, config?: RequestConfig): Promise<DeliveryChallan> => {
    const response = await get<GetDeliveryChallanResponse>(
      `/api/DeliveryChallans/${id}`,
      config
    );
    return response.data;
  },
};
