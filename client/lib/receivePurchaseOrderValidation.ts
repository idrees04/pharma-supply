/**
 * Shared rules for PO receive lines (UI + Zod). Lines with received qty 0 skip batch/dates.
 */

export type ReceiveLineInput = {
  orderedQuantity: number;
  previouslyReceived: number;
  receivedQuantity: unknown;
  batchNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
};

export type ReceiveLineFieldIssues = Partial<
  Record<'receivedQuantity' | 'batchNumber' | 'manufactureDate' | 'expiryDate', string>
>;

export function getReceiveLineFieldIssues(line: ReceiveLineInput | undefined): ReceiveLineFieldIssues {
  const issues: ReceiveLineFieldIssues = {};
  if (!line) return issues;
  const remaining = line.orderedQuantity - line.previouslyReceived;
  const rq = Math.trunc(Number(line.receivedQuantity));

  if (!Number.isFinite(rq) || rq < 0) {
    issues.receivedQuantity = 'Enter a valid whole number.';
    return issues;
  }
  if (remaining < 0) {
    issues.receivedQuantity = 'Line data is inconsistent; refresh the page.';
    return issues;
  }
  if (rq > remaining) {
    issues.receivedQuantity = `Cannot exceed remaining (${remaining}).`;
    return issues;
  }

  if (rq <= 0) return issues;

  if (!line.batchNumber?.trim()) {
    issues.batchNumber = 'Required when receiving quantity (inventory batch).';
  }
  if (!line.manufactureDate?.trim()) {
    issues.manufactureDate = 'Required when receiving quantity.';
  }
  if (!line.expiryDate?.trim()) {
    issues.expiryDate = 'Required when receiving quantity.';
  }

  const mStr = line.manufactureDate?.trim();
  const eStr = line.expiryDate?.trim();
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

export function hasAnyReceiveQuantity(items: ReceiveLineInput[]): boolean {
  return items.some((item) => Math.trunc(Number(item.receivedQuantity)) > 0);
}
