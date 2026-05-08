import React from 'react';
import type { DeliveryChallan } from '@/types/api/deliveryChallans';

interface DeliveryChallanTemplateProps {
  challan: DeliveryChallan;
}

export const DeliveryChallanTemplate = React.forwardRef<HTMLDivElement, DeliveryChallanTemplateProps>(
  ({ challan }, ref) => {
    return (
      <div
        ref={ref}
        className="w-full bg-white p-8"
        style={{
          width: '210mm',
          minHeight: '260mm',
          margin: '0 auto',
          fontSize: '13px',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        <div className="mb-8 border-b-2 border-slate-800 pb-4">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">DELIVERY CHALLAN</h1>
          <p className="mt-1 font-mono text-lg font-bold text-primary">{challan.challanNumber ?? `#${challan.id}`}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Supply order</p>
            <p className="font-bold text-slate-900">{challan.supplyOrderNumber ?? `SO #${challan.supplyOrderId}`}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dispatch date</p>
            <p className="font-bold text-slate-900">
              {challan.dispatchDate ? new Date(challan.dispatchDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {challan.notes ? (
          <div className="mb-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Notes</p>
            <p className="mt-1 whitespace-pre-wrap">{challan.notes}</p>
          </div>
        ) : null}

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800 bg-slate-50">
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase tracking-wider">Product</th>
              <th className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-wider">Qty</th>
              <th className="px-2 py-2 text-left text-[10px] font-black uppercase tracking-wider">Batch</th>
              <th className="px-2 py-2 text-right text-[10px] font-black uppercase tracking-wider">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {(challan.items ?? []).map((line) => (
              <tr key={line.id} className="border-b border-slate-100">
                <td className="px-2 py-2 font-semibold text-slate-900">{line.productName ?? `Product #${line.productId}`}</td>
                <td className="px-2 py-2 text-center tabular-nums">{line.quantityDispatched}</td>
                <td className="px-2 py-2 font-mono text-xs text-slate-600">{line.batchNumber ?? '—'}</td>
                <td className="px-2 py-2 text-right text-xs text-slate-600">
                  {line.batchExpiryDate ? new Date(line.batchExpiryDate).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-10 text-center text-[10px] text-slate-400">
          Generated from Pharma Supply · Document for dispatch verification only (no pricing shown).
        </p>
      </div>
    );
  }
);

DeliveryChallanTemplate.displayName = 'DeliveryChallanTemplate';
