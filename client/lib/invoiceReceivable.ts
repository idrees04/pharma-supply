/** Round to 2 decimal places (currency); avoids float noise in receivable math. */
export function roundMoney2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Mirrors backend `InvoiceReceivableHelper`:
 * collectible = Total − deductions (GST inclusive; taxAmount is not auto-stripped).
 * Sales tax deduction is the manual GST/withholding adjustment.
 */

export function totalInvoiceDeductions(d: {
  lateDeliveryDeduction?: number | null;
  incomeTaxDeduction?: number | null;
  salesTaxDeduction?: number | null;
}): number {
  return roundMoney2(
    (d.lateDeliveryDeduction ?? 0) + (d.incomeTaxDeduction ?? 0) + (d.salesTaxDeduction ?? 0)
  );
}

export function taxExclusiveCollectible(
  totalAmount: number,
  taxAmount: number,
  totalDeduction: number
): number {
  void taxAmount;
  const v = totalAmount - totalDeduction;
  const x = v > 0 ? v : 0;
  return roundMoney2(x);
}

export function outstandingTaxExclusive(
  totalAmount: number,
  taxAmount: number,
  totalDeduction: number,
  paidAmount: number
): number {
  const v = taxExclusiveCollectible(totalAmount, taxAmount, totalDeduction) - paidAmount;
  const x = v > 0 ? v : 0;
  return roundMoney2(x);
}

/** Use for UI / payment gates when API `outstandingAmount` may not match receivable rules. */
export function outstandingExTaxForInvoice(d: {
  totalAmount: number;
  taxAmount: number;
  lateDeliveryDeduction?: number | null;
  incomeTaxDeduction?: number | null;
  salesTaxDeduction?: number | null;
  paidAmount: number;
}): number {
  return outstandingTaxExclusive(
    d.totalAmount,
    d.taxAmount,
    totalInvoiceDeductions(d),
    d.paidAmount
  );
}
