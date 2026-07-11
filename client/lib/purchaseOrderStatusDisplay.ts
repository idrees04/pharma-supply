import {
  CheckCircle2,
  Clock,
  Mail,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  type PurchaseOrderStatusOption,
} from '@/types/api/purchaseOrders';

export function getPurchaseOrderStatusLabel(status: number): string {
  switch (status) {
    case PurchaseOrderStatus.Sent:
      return 'Sent';
    case PurchaseOrderStatus.Active:
      return 'Active';
    case PurchaseOrderStatus.Completed:
      return 'Completed';
    case PurchaseOrderStatus.Cancelled:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export function getPurchaseOrderStatusClassName(status: number): string {
  switch (status) {
    case PurchaseOrderStatus.Sent:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case PurchaseOrderStatus.Active:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case PurchaseOrderStatus.Completed:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case PurchaseOrderStatus.Cancelled:
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function getPurchaseOrderStatusIcon(status: number): LucideIcon {
  switch (status) {
    case PurchaseOrderStatus.Sent:
      return Mail;
    case PurchaseOrderStatus.Active:
      return Clock;
    case PurchaseOrderStatus.Completed:
      return CheckCircle2;
    case PurchaseOrderStatus.Cancelled:
      return XCircle;
    default:
      return Clock;
  }
}

export function isPurchaseOrderCancelled(status: number): boolean {
  return status === PurchaseOrderStatus.Cancelled;
}

export function canReceivePurchaseOrder(po: Pick<PurchaseOrder, 'status' | 'items'>): boolean {
  if (
    po.status === PurchaseOrderStatus.Cancelled ||
    po.status === PurchaseOrderStatus.Completed
  ) {
    return false;
  }
  return (po.items ?? []).some((line) => line.remainingQuantity > 0);
}

export function canPayPurchaseOrder(
  po: Pick<PurchaseOrder, 'status' | 'outstandingAmount'>
): boolean {
  if (
    po.status === PurchaseOrderStatus.Cancelled ||
    po.status === PurchaseOrderStatus.Completed
  ) {
    return false;
  }
  return (po.outstandingAmount ?? 0) > 0;
}

export function canCancelPurchaseOrder(status: number): boolean {
  return status === PurchaseOrderStatus.Sent || status === PurchaseOrderStatus.Active;
}

export function canFullyEditPurchaseOrder(
  po: Pick<PurchaseOrder, 'status' | 'paidAmount' | 'items'>
): boolean {
  if (po.status !== PurchaseOrderStatus.Sent) return false;
  if ((po.paidAmount ?? 0) > 0) return false;
  return (po.items ?? []).every((line) => (line.receivedQuantity ?? 0) <= 0);
}

export interface ProgressSnapshot {
  received: number;
  ordered: number;
  percent: number;
  paid: number;
  total: number;
  outstanding: number;
  paymentPercent: number;
}

export function getPurchaseOrderProgress(po: PurchaseOrder): ProgressSnapshot {
  const items = po.items ?? [];
  const ordered = items.reduce((sum, line) => sum + (line.orderedQuantity || 0), 0);
  const received = items.reduce((sum, line) => sum + (line.receivedQuantity || 0), 0);
  const total = po.totalAmount || 0;
  const paid = po.paidAmount ?? Math.max(0, total - (po.outstandingAmount ?? total));
  const outstanding = po.outstandingAmount ?? Math.max(0, total - paid);

  return {
    received,
    ordered,
    percent: ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0,
    paid,
    total,
    outstanding,
    paymentPercent: total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0,
  };
}

export function getLifecycleSteps(statuses: PurchaseOrderStatusOption[]) {
  return [...statuses]
    .filter((s) => s.value !== PurchaseOrderStatus.Cancelled)
    .sort((a, b) => a.value - b.value);
}

export function getRecommendedAction(po: PurchaseOrder): 'receive' | 'pay' | 'none' {
  if (po.status === PurchaseOrderStatus.Cancelled || po.status === PurchaseOrderStatus.Completed) {
    return 'none';
  }
  if (canReceivePurchaseOrder(po)) return 'receive';
  if (canPayPurchaseOrder(po)) return 'pay';
  return 'none';
}

export function getFinancialSummaryLabel(po: PurchaseOrder): string {
  if (po.status === PurchaseOrderStatus.Cancelled) return 'Cancelled';
  if (po.status === PurchaseOrderStatus.Completed) return 'Settled';
  if ((po.outstandingAmount ?? 0) <= 0) return 'Paid in full';
  if ((po.paidAmount ?? 0) > 0) return 'Partially paid';
  return 'Payment due';
}
