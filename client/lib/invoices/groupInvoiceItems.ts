import type { InvoiceItemDto } from '@/types/api/invoices';

export type InvoiceLineBatchSlice = {
  batchNumber: string | null;
  expiryDate: string | null;
  quantity: number;
};

export type GroupedInvoiceLine = {
  key: string;
  productId: number;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  taxPercentage: number;
  taxAmount: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number;
  batches: InvoiceLineBatchSlice[];
};

/** Collapse per-batch invoice rows into one product line with batch slices under it. */
export function groupInvoiceItemsByProduct(items: InvoiceItemDto[]): GroupedInvoiceLine[] {
  const groups = new Map<string, GroupedInvoiceLine>();

  for (const item of items) {
    const key = [
      item.productId,
      item.unitPrice,
      item.taxPercentage,
      item.discountPercentage,
    ].join('|');

    const existing = groups.get(key);
    const batchSlice: InvoiceLineBatchSlice | null =
      item.batchNumber?.trim() || item.expiryDate || item.productBatchId
        ? {
            batchNumber: item.batchNumber?.trim() || null,
            expiryDate: item.expiryDate ?? null,
            quantity: item.quantity,
          }
        : null;

    if (!existing) {
      groups.set(key, {
        key,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxPercentage: item.taxPercentage,
        taxAmount: item.taxAmount,
        discountPercentage: item.discountPercentage,
        discountAmount: item.discountAmount,
        totalAmount: item.totalAmount,
        batches: batchSlice ? [batchSlice] : [],
      });
      continue;
    }

    existing.quantity += item.quantity;
    existing.taxAmount += item.taxAmount;
    existing.discountAmount += item.discountAmount;
    existing.totalAmount += item.totalAmount;
    if (batchSlice) existing.batches.push(batchSlice);
  }

  return Array.from(groups.values());
}

export function formatInvoiceBatchSlice(slice: InvoiceLineBatchSlice): string {
  const parts: string[] = [];
  if (slice.quantity > 0) parts.push(`Qty ${slice.quantity}`);
  if (slice.batchNumber?.trim()) parts.push(`Batch ${slice.batchNumber.trim()}`);
  if (slice.expiryDate) {
    parts.push(
      `Exp ${new Date(slice.expiryDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`
    );
  }
  return parts.join(' · ');
}
