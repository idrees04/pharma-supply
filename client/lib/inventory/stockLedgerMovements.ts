import {
  InventoryMovementType,
  type InventoryStockLedgerDto,
  type InventoryStockMovementDto,
} from '@/types/api/inventory';

/**
 * Older API deployments return stock + batches only (no movements array).
 * Derive receipt/dispatch rows from batch quantities until the ledger endpoint is updated.
 */
export function resolveStockLedgerMovements(
  ledger: InventoryStockLedgerDto,
): InventoryStockMovementDto[] {
  if (ledger.movements?.length) {
    return ledger.movements;
  }

  return synthesizeMovementsFromLedger(ledger);
}

function synthesizeMovementsFromLedger(
  ledger: InventoryStockLedgerDto,
): InventoryStockMovementDto[] {
  const dispatchDate = ledger.stock.lastDispatchedDate;
  const movements: InventoryStockMovementDto[] = [];

  for (const batch of ledger.batches ?? []) {
    if (batch.receivedQuantity > 0) {
      movements.push({
        movementDate: batch.receivedDate,
        type: InventoryMovementType.Receipt,
        quantityIn: batch.receivedQuantity,
        quantityOut: 0,
        purchaseOrderId: batch.purchaseOrderId,
        deliveryChallanId: null,
        productBatchId: batch.id,
        batchNumber: batch.batchNumber,
        notes: batch.notes,
      });
    }

    if (batch.dispatchedQuantity > 0) {
      movements.push({
        movementDate: dispatchDate ?? batch.receivedDate,
        type: InventoryMovementType.Dispatch,
        quantityIn: 0,
        quantityOut: batch.dispatchedQuantity,
        purchaseOrderId: null,
        deliveryChallanId: null,
        productBatchId: batch.id,
        batchNumber: batch.batchNumber,
        notes: null,
      });
    }
  }

  return movements.sort(
    (a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime(),
  );
}
