/**
 * Shared rules for PO receive lines and nested batches (UI + Zod).
 * Batches with received qty 0 skip batch/dates; line total must not exceed remaining.
 */

export type ReceiveBatchInput = {
  receivedQuantity: unknown;
  batchNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
  notes?: string;
};

export type ReceiveLineInput = {
  orderedQuantity: number;
  previouslyReceived: number;
  batches: ReceiveBatchInput[];
};

export type ReceiveBatchFieldIssues = Partial<
  Record<'receivedQuantity' | 'batchNumber' | 'manufactureDate' | 'expiryDate', string>
>;

export type ReceiveLineFieldIssues = {
  lineTotal?: string;
  batches: ReceiveBatchFieldIssues[];
};

export function getReceiveBatchFieldIssues(batch: ReceiveBatchInput | undefined): ReceiveBatchFieldIssues {
  const issues: ReceiveBatchFieldIssues = {};
  if (!batch) return issues;

  const rq = Math.trunc(Number(batch.receivedQuantity));
  if (!Number.isFinite(rq) || rq < 0) {
    issues.receivedQuantity = 'Enter a valid whole number.';
    return issues;
  }

  if (rq <= 0) return issues;

  if (!batch.batchNumber?.trim()) {
    issues.batchNumber = 'Required when receiving quantity (inventory batch).';
  }
  if (!batch.manufactureDate?.trim()) {
    issues.manufactureDate = 'Required when receiving quantity.';
  }
  if (!batch.expiryDate?.trim()) {
    issues.expiryDate = 'Required when receiving quantity.';
  }

  const mStr = batch.manufactureDate?.trim();
  const eStr = batch.expiryDate?.trim();
  if (mStr && eStr) {
    const m = new Date(`${mStr}T00:00:00`);
    const e = new Date(`${eStr}T00:00:00`);
    const mBad = Number.isNaN(m.getTime());
    const eBad = Number.isNaN(e.getTime());
    if (mBad) issues.manufactureDate = 'Enter a valid manufacture date.';
    if (eBad) issues.expiryDate = 'Enter a valid expiry date.';
    if (!mBad && !eBad && e < m) {
      issues.expiryDate = 'Must be on or after manufacture date.';
    }
  }

  return issues;
}

export function getLineReceivingTotal(line: ReceiveLineInput | undefined): number {
  if (!line?.batches?.length) return 0;
  return line.batches.reduce(
    (sum, batch) => sum + Math.max(0, Math.trunc(Number(batch.receivedQuantity))),
    0
  );
}

export function getReceiveLineFieldIssues(line: ReceiveLineInput | undefined): ReceiveLineFieldIssues {
  const batches = line?.batches ?? [];
  const batchIssues = batches.map((batch) => getReceiveBatchFieldIssues(batch));

  if (!line) {
    return { batches: batchIssues };
  }

  const remaining = line.orderedQuantity - line.previouslyReceived;
  if (remaining < 0) {
    return {
      lineTotal: 'Line data is inconsistent; refresh the page.',
      batches: batchIssues,
    };
  }

  const lineTotal = getLineReceivingTotal(line);
  const lineTotalIssue =
    lineTotal > remaining ? `Total receiving (${lineTotal}) cannot exceed remaining (${remaining}).` : undefined;

  return {
    lineTotal: lineTotalIssue,
    batches: batchIssues,
  };
}

export function hasAnyReceiveQuantity(items: ReceiveLineInput[]): boolean {
  return items.some((item) => getLineReceivingTotal(item) > 0);
}
