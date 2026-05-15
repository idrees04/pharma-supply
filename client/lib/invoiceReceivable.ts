/** Round to 2 decimal places (currency); avoids float noise in tax-exclusive math. */
export function roundMoney2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Mirrors backend `InvoiceReceivableHelper`: legal total is gross; collections use ex-tax net. */

export function taxExclusiveCollectible(
  totalAmount: number,
  taxAmount: number,
  lateDeliveryDeduction: number
): number {
  const v = totalAmount - taxAmount - lateDeliveryDeduction;
  const x = v > 0 ? v : 0;
  return roundMoney2(x);
}

export function outstandingTaxExclusive(
  totalAmount: number,
  taxAmount: number,
  lateDeliveryDeduction: number,
  paidAmount: number
): number {
  const v = taxExclusiveCollectible(totalAmount, taxAmount, lateDeliveryDeduction) - paidAmount;
  const x = v > 0 ? v : 0;
  return roundMoney2(x);
}

/** Use for UI / payment gates when API `outstandingAmount` may not match ex-tax receivable rules. */
export function outstandingExTaxForInvoice(d: {
  totalAmount: number;
  taxAmount: number;
  lateDeliveryDeduction?: number | null;
  paidAmount: number;
}): number {
  return outstandingTaxExclusive(
    d.totalAmount,
    d.taxAmount,
    d.lateDeliveryDeduction ?? 0,
    d.paidAmount
  );
}