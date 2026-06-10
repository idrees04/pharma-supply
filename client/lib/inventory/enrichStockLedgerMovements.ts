import { deliveryChallanService } from '@/api/services/deliveryChallans';
import { purchaseOrderService } from '@/api/services/purchaseOrders';
import { supplyOrderService } from '@/api/services/supplyOrders.service';
import {
  InventoryMovementType,
  type InventoryStockMovementDto,
  type ProductBatchDto,
} from '@/types/api/inventory';

interface DispatchMatch {
  deliveryChallanId: number;
  dispatchDate: string;
  notes: string | null;
}

/**
 * When movements are synthesized client-side, attach delivery challan IDs by
 * walking PO → supply order → delivery challan items for dispatched batches.
 */
export async function enrichDispatchMovementsWithDeliveryChallans(
  productId: number,
  movements: InventoryStockMovementDto[],
  batches: ProductBatchDto[],
): Promise<InventoryStockMovementDto[]> {
  const needsEnrichment = movements.some(
    (m) => m.type === InventoryMovementType.Dispatch && !m.deliveryChallanId,
  );
  if (!needsEnrichment) {
    return movements;
  }

  const dispatchMatches = await loadDispatchMatchesByBatch(productId, batches);
  if (!dispatchMatches.size) {
    return movements;
  }

  return movements.map((movement) => {
    if (
      movement.type !== InventoryMovementType.Dispatch ||
      movement.deliveryChallanId ||
      !movement.productBatchId
    ) {
      return movement;
    }

    const match = dispatchMatches.get(movement.productBatchId);
    if (!match || match.quantityOut !== movement.quantityOut) {
      return movement;
    }

    return {
      ...movement,
      deliveryChallanId: match.deliveryChallanId,
      movementDate: match.dispatchDate,
      notes: match.notes ?? movement.notes,
    };
  });
}

async function loadDispatchMatchesByBatch(
  productId: number,
  batches: ProductBatchDto[],
): Promise<Map<number, DispatchMatch & { quantityOut: number }>> {
  const matches = new Map<number, DispatchMatch & { quantityOut: number }>();
  const purchaseOrderIds = [
    ...new Set(
      batches
        .filter((batch) => batch.dispatchedQuantity > 0 && batch.purchaseOrderId)
        .map((batch) => batch.purchaseOrderId as number),
    ),
  ];

  if (!purchaseOrderIds.length) {
    return matches;
  }

  const supplyOrderIds = new Set<number>();
  for (const purchaseOrderId of purchaseOrderIds) {
    try {
      const purchaseOrder = await purchaseOrderService.getPurchaseOrder(purchaseOrderId);
      purchaseOrder.items?.forEach((item) => {
        if (item.productId !== productId) {
          return;
        }
        item.supplyOrderIds?.forEach((supplyOrderId) => supplyOrderIds.add(supplyOrderId));
      });
    } catch {
      // Ignore missing PO links; synthesized movements still render without DC id.
    }
  }

  for (const supplyOrderId of supplyOrderIds) {
    try {
      const challanSummaries = await supplyOrderService.getDeliveryChallansForOrder(supplyOrderId);
      for (const summary of challanSummaries) {
        const challan = await deliveryChallanService.getDeliveryChallanById(summary.id);
        challan.items?.forEach((item) => {
          if (item.productId !== productId || !item.productBatchId) {
            return;
          }

          matches.set(item.productBatchId, {
            deliveryChallanId: challan.id,
            dispatchDate: challan.dispatchDate,
            notes: challan.notes,
            quantityOut: item.quantityDispatched,
          });
        });
      }
    } catch {
      // Ignore lookup failures for individual supply orders.
    }
  }

  return matches;
}
