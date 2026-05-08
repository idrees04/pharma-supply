import type { SuggestedPaymentData } from '@/types/api/payments';

/**
 * Normalizes GET /PurchaseOrders/{id}/suggested-payment body whether the client
 * holds the wrapper ({ data }) or the inner DTO.
 */
export function unwrapSuggestedPayment(raw: unknown): SuggestedPaymentData | null {
  if (raw == null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const inner = r.data;
  if (inner != null && typeof inner === 'object') {
    return inner as SuggestedPaymentData;
  }
  return raw as SuggestedPaymentData;
}
