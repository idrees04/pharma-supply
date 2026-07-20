import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { InvoiceDto } from '@/types/api/invoices';
import { PrintDocumentHeader } from '@/components/print/PrintDocumentHeader';
import { PrintFederationFromBlock } from '@/components/print/PrintFederationFromBlock';
import { PrintSignatureBlock } from '@/components/print/PrintSignatureBlock';
import {
  formatInvoiceBatchSlice,
  groupInvoiceItemsByProduct,
} from '@/lib/invoices/groupInvoiceItems';

interface InvoiceTemplateProps {
  invoice: InvoiceDto;
  /** When true, renders the statutory Warranty declaration below the Notes section. */
  showWarranty?: boolean;
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, showWarranty = false }, ref) => {
    const subtotal = invoice.subTotal;
    const tax = invoice.taxAmount;
    const discount = invoice.discountAmount;
    const shipping = invoice.shippingCharges;
    const adjustment = invoice.adjustmentAmount;
    const total = invoice.totalAmount;
    const lateDed = invoice.lateDeliveryDeduction ?? 0;
    const incomeDed = invoice.incomeTaxDeduction ?? 0;
    const salesDed = invoice.salesTaxDeduction ?? 0;
    const notes = invoice.notes?.trim() ?? '';
    const terms = invoice.termsAndConditions?.trim() ?? '';
    const productLines = useMemo(
      () => groupInvoiceItemsByProduct(invoice.items ?? []),
      [invoice.items]
    );

    return (
      <div
        ref={ref}
        className="w-full bg-white p-5 rounded-lg shadow-xl text-slate-900"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          fontSize: '11px',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        <PrintDocumentHeader
          title="INVOICE"
          subtitle={`#${invoice.invoiceNumber || 'TBD'}`}
          className="mb-3 border-b border-slate-200 pb-3 [&_img]:h-10 [&_img]:max-w-[100px] [&_h1]:text-xl sm:[&_h1]:text-xl [&_.text-sm]:text-xs"
        />

        <div className="mb-3 grid grid-cols-2 gap-6">
          <PrintFederationFromBlock
            className="[&_p.text-sm]:text-[11px] [&_.mb-2]:mb-1 [&_.space-y-1]:space-y-0.5 [&_.text-xs]:text-[10px] leading-snug"
          />

          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Bill To
            </p>
            <div className="space-y-0.5 leading-snug">
              <p className="text-[11px] font-bold text-slate-900">{invoice.hospitalName ?? '—'}</p>
              {invoice.hospitalRegistrationNumber ? (
                <p className="text-[10px] text-slate-600">
                  Hospital No: <span className="font-mono">{invoice.hospitalRegistrationNumber}</span>
                </p>
              ) : null}
              {invoice.hospitalAddress ? (
                <p className="text-[10px] text-slate-600">{invoice.hospitalAddress}</p>
              ) : null}
              {invoice.hospitalPhone ? (
                <p className="text-[10px] text-slate-600">Tel: {invoice.hospitalPhone}</p>
              ) : null}
              {invoice.supplyOrderId ? (
                <p className="text-[10px] text-slate-500">Supply Order: #{invoice.supplyOrderId}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-3 border border-slate-200 bg-slate-50 px-3 py-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Invoice date</p>
            <p className="font-semibold text-slate-900">{formatShortDate(invoice.invoiceDate)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Due date</p>
            <p className="font-semibold text-slate-900">{formatShortDate(invoice.dueDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total (PKR)</p>
            <p className="text-base font-black text-primary">{formatCurrency(total)}</p>
          </div>
        </div>

        <div className="mb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="w-7 py-1 px-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  #
                </th>
                <th className="py-1 px-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Product
                </th>
                <th className="w-12 py-1 px-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Qty
                </th>
                <th className="w-20 py-1 px-1.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Rate
                </th>
                <th className="w-14 py-1 px-1.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Tax
                </th>
                <th className="w-24 py-1 px-1.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {productLines.length > 0 ? (
                productLines.map((line, idx) => (
                  <tr key={line.key} className="border-b border-slate-200">
                    <td className="py-1 px-1.5 align-top tabular-nums text-slate-500">{idx + 1}</td>
                    <td className="py-1 px-1.5 align-top">
                      <p className="font-semibold leading-tight text-slate-900">
                        {line.productName ?? `Product #${line.productId}`}
                      </p>
                      {line.batches.length > 0 ? (
                        <ul className="mt-0.5 space-y-0.5">
                          {line.batches.map((batch, batchIdx) => (
                            <li
                              key={`${line.key}-b-${batchIdx}`}
                              className="text-[9px] leading-tight text-slate-500"
                            >
                              {formatInvoiceBatchSlice(batch)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td className="py-1 px-1.5 text-center align-top font-semibold tabular-nums">
                      {line.quantity}
                    </td>
                    <td className="py-1 px-1.5 text-right align-top font-mono tabular-nums text-slate-700">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="py-1 px-1.5 text-right align-top tabular-nums text-slate-700">
                      {line.taxPercentage > 0 ? `${line.taxPercentage}%` : '—'}
                    </td>
                    <td className="py-1 px-1.5 text-right align-top font-semibold tabular-nums">
                      {formatCurrency(line.totalAmount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-3 flex justify-end">
          <div className="w-56 space-y-0.5">
            <div className="flex justify-between border-b border-slate-100 py-0.5">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {tax > 0 ? (
              <div className="flex justify-between border-b border-slate-100 py-0.5">
                <span className="text-slate-600">Tax</span>
                <span className="font-semibold tabular-nums text-blue-700">{formatCurrency(tax)}</span>
              </div>
            ) : null}
            {discount > 0 ? (
              <div className="flex justify-between border-b border-slate-100 py-0.5">
                <span className="text-slate-600">Discount</span>
                <span className="font-semibold tabular-nums text-red-600">−{formatCurrency(discount)}</span>
              </div>
            ) : null}
            {shipping > 0 ? (
              <div className="flex justify-between border-b border-slate-100 py-0.5">
                <span className="text-slate-600">Shipping</span>
                <span className="font-semibold tabular-nums">{formatCurrency(shipping)}</span>
              </div>
            ) : null}
            {adjustment !== 0 ? (
              <div className="flex justify-between border-b border-slate-100 py-0.5">
                <span className="text-slate-600">Adjustment</span>
                <span
                  className={`font-semibold tabular-nums ${adjustment > 0 ? 'text-green-700' : 'text-red-600'}`}
                >
                  {adjustment > 0 ? '+' : '−'}
                  {formatCurrency(Math.abs(adjustment))}
                </span>
              </div>
            ) : null}
            {lateDed > 0 ? (
              <div className="flex justify-between border-b border-slate-100 py-0.5">
                <span className="text-slate-600">Late / other ded.</span>
                <span className="font-semibold tabular-nums text-red-600">−{formatCurrency(lateDed)}</span>
              </div>
            ) : null}
            {incomeDed > 0 ? (
              <div className="flex justify-between border-b border-slate-100 py-0.5">
                <span className="text-slate-600">Income tax ded.</span>
                <span className="font-semibold tabular-nums text-red-600">−{formatCurrency(incomeDed)}</span>
              </div>
            ) : null}
            {salesDed > 0 ? (
              <div className="flex justify-between border-b border-slate-100 py-0.5">
                <span className="text-slate-600">Sales tax ded.</span>
                <span className="font-semibold tabular-nums text-red-600">−{formatCurrency(salesDed)}</span>
              </div>
            ) : null}
            <div className="mt-1 flex justify-between bg-primary/10 px-2 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-900">Total</span>
              <span className="font-black tabular-nums text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {notes ? (
          <div className="mb-2">
            <p className="mb-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Notes</p>
            <p className="line-clamp-2 text-[10px] leading-snug text-slate-700 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        ) : null}

        {showWarranty ? (
          <div className="mb-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
            <p className="mb-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
              Warranty
            </p>
            <p className="text-[9px] leading-snug text-slate-700">
              I Mr. M Banaris Khan S/o Shah Zaman, caring out business in the name of
              &ldquo;IDEAL DISTRIBUTOR&rdquo; at House # E-64, Block-E, Near Jamia Masjid Aqsa,
              Satellite Town, Rawalpindi. Do hereby given this Warranty that drugs / Medicines in
              this memo / invoice as sold by us do not contrivance in any way the provision of
              section 23 of Drugs Act 1976 as Warranty of manufactures / Suppliers.
            </p>
          </div>
        ) : null}

        {terms && terms.length <= 180 ? (
          <div className="mb-2">
            <p className="mb-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
              Terms
            </p>
            <p className="line-clamp-2 text-[9px] leading-snug text-slate-600">{terms}</p>
          </div>
        ) : null}

        <PrintSignatureBlock className="mt-4 gap-4 border-t border-slate-200 pt-3 [&_div.mb-2]:mb-1 [&_div.h-12]:h-8" />

        <div className="mt-3 border-t border-slate-200 pt-2 text-center space-y-1">
          <p className="text-[9px] text-slate-500">
            Computer-generated invoice · #{invoice.invoiceNumber || invoice.id} ·{' '}
            {new Date().toLocaleDateString('en-GB')}
          </p>
          <p className="text-[10px] font-medium text-amber-900">
            Previous balance (PKR):{' '}
            <span className="font-bold tabular-nums">
              {formatCurrency(invoice.previousBalance ?? 0)}
            </span>
            <span className="ml-1 text-[9px] font-normal text-slate-500">
              (amount owed before this invoice, ex. tax)
            </span>
          </p>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
