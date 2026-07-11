import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { getPurchaseOrderStatusLabel } from '@/lib/purchaseOrderStatusDisplay';
import type { PurchaseOrder } from '@/types/api/purchaseOrders';
import { PrintSignatureBlock } from '@/components/print/PrintSignatureBlock';
import { PrintDocumentHeader } from '@/components/print/PrintDocumentHeader';
import { PrintFederationFromBlock } from '@/components/print/PrintFederationFromBlock';

interface PurchaseOrderTemplateProps {
  purchaseOrder: PurchaseOrder;
}

export const PurchaseOrderTemplate = React.forwardRef<HTMLDivElement, PurchaseOrderTemplateProps>(
  ({ purchaseOrder }, ref) => {
    const subtotal = purchaseOrder.items?.reduce(
      (sum, item) => sum + item.totalAmount - item.taxAmount,
      0,
    ) ?? 0;
    const taxTotal = purchaseOrder.items?.reduce((sum, item) => sum + item.taxAmount, 0) ?? 0;
    const discountTotal =
      purchaseOrder.items?.reduce((sum, item) => sum + item.discountAmount, 0) ?? 0;

    return (
      <div
        ref={ref}
        className="w-full bg-white p-8"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          fontSize: '13px',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        <PrintDocumentHeader
          title="PURCHASE ORDER"
          subtitle={purchaseOrder.purchaseOrderNumber}
        />

        <div className="mb-8 grid grid-cols-2 gap-8">
          <PrintFederationFromBlock labelClassName="text-[10px]" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Supplier</p>
            <p className="mt-1 font-bold text-slate-900">{purchaseOrder.supplierName}</p>
            <p className="text-xs text-slate-600">Supplier ID: #{purchaseOrder.supplierId}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4 rounded-lg bg-slate-50 p-4 text-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order date</p>
            <p className="font-semibold">
              {purchaseOrder.orderDate
                ? new Date(purchaseOrder.orderDate).toLocaleDateString()
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Expected delivery</p>
            <p className="font-semibold">
              {purchaseOrder.expectedDeliveryDate
                ? new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
            <p className="font-semibold">{getPurchaseOrderStatusLabel(purchaseOrder.status)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Delivery address</p>
            <p className="font-semibold">{purchaseOrder.deliveryAddress || '—'}</p>
          </div>
        </div>

        <table className="mb-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800 bg-slate-50">
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase">Product</th>
              <th className="px-2 py-2 text-center text-[10px] font-black uppercase">Qty</th>
              <th className="px-2 py-2 text-right text-[10px] font-black uppercase">Unit price</th>
              <th className="px-2 py-2 text-right text-[10px] font-black uppercase">Tax</th>
              <th className="px-2 py-2 text-right text-[10px] font-black uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {(purchaseOrder.items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-2 py-2">
                  <p className="font-semibold">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.productCode}</p>
                </td>
                <td className="px-2 py-2 text-center tabular-nums">{item.orderedQuantity}</td>
                <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-xs">
                  {item.taxPercentage}% ({formatCurrency(item.taxAmount)})
                </td>
                <td className="px-2 py-2 text-right tabular-nums font-semibold">
                  {formatCurrency(item.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-8 flex justify-end">
          <div className="w-72 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {taxTotal > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
            )}
            {discountTotal > 0 && (
              <div className="flex justify-between text-red-700">
                <span>Discount</span>
                <span>-{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(purchaseOrder.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-dashed border-slate-200 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {purchaseOrder.notes?.trim() ? purchaseOrder.notes : '—'}
          </p>
        </div>

        <PrintSignatureBlock />

        <p className="mt-6 text-center text-[10px] text-slate-400">
          Vendor copy — please confirm quantities and delivery schedule.
        </p>
      </div>
    );
  },
);

PurchaseOrderTemplate.displayName = 'PurchaseOrderTemplate';
