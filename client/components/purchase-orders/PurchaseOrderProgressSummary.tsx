import React, { useMemo } from 'react';
import { PackageCheck, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { getPurchaseOrderProgress } from '@/lib/purchaseOrderStatusDisplay';
import type { PurchaseOrder } from '@/types/api/purchaseOrders';

interface PurchaseOrderProgressSummaryProps {
  purchaseOrder: PurchaseOrder;
}

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', className)}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function PurchaseOrderProgressSummary({ purchaseOrder }: PurchaseOrderProgressSummaryProps) {
  const progress = useMemo(() => getPurchaseOrderProgress(purchaseOrder), [purchaseOrder]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <PackageCheck className="h-4 w-4 text-primary" />
              Goods receipt
            </div>
            <span className="text-xs font-black text-slate-500 tabular-nums">{progress.percent}%</span>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900 tabular-nums">{progress.received.toLocaleString()}</span>
            {' / '}
            <span className="tabular-nums">{progress.ordered.toLocaleString()}</span>
            {' units received'}
          </p>
          <ProgressBar percent={progress.percent} className="bg-gradient-to-r from-primary to-violet-500" />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Supplier payment
            </div>
            <span className="text-xs font-black text-slate-500 tabular-nums">{progress.paymentPercent}%</span>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-bold text-emerald-700 tabular-nums">{formatCurrency(progress.paid)}</span>
            {' paid · '}
            <span className="font-bold text-rose-600 tabular-nums">{formatCurrency(progress.outstanding)}</span>
            {' due'}
          </p>
          <ProgressBar percent={progress.paymentPercent} className="bg-gradient-to-r from-emerald-500 to-teal-500" />
        </CardContent>
      </Card>
    </div>
  );
}
