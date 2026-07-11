import {
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  PackageCheck,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  SupplyOrder,
  SupplyOrderStatus,
  type SupplyOrderStatusOption,
} from '@/types/api/supplyOrders';

export function getSupplyOrderStatusLabel(
  status: number,
  statuses?: SupplyOrderStatusOption[]
): string {
  const fromApi = statuses?.find((s) => s.value === status)?.name;
  if (fromApi) return fromApi;

  switch (status) {
    case SupplyOrderStatus.Draft:
      return 'Draft';
    case SupplyOrderStatus.Pending:
      return 'Pending';
    case SupplyOrderStatus.Approved:
      return 'Approved';
    case SupplyOrderStatus.PartiallyFulfilled:
      return 'Partially Fulfilled';
    case SupplyOrderStatus.Fulfilled:
      return 'Fulfilled';
    case SupplyOrderStatus.Invoiced:
      return 'Invoiced';
    case SupplyOrderStatus.Cancelled:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export function getSupplyOrderStatusClassName(status: number): string {
  switch (status) {
    case SupplyOrderStatus.Draft:
      return 'bg-slate-50 text-slate-700 border-slate-200';
    case SupplyOrderStatus.Pending:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case SupplyOrderStatus.Approved:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case SupplyOrderStatus.PartiallyFulfilled:
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case SupplyOrderStatus.Fulfilled:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case SupplyOrderStatus.Invoiced:
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case SupplyOrderStatus.Cancelled:
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function getSupplyOrderStatusIcon(status: number, code?: string): LucideIcon {
  const key = (code ?? '').replace(/_/g, '').toLowerCase();
  if (key === 'draft') return FileText;
  if (key === 'pending') return Clock;
  if (key === 'approved') return CheckCircle2;
  if (key === 'partiallyfulfilled') return PackageCheck;
  if (key === 'fulfilled') return Truck;
  if (key === 'invoiced') return DollarSign;
  if (key === 'cancelled') return XCircle;

  switch (status) {
    case SupplyOrderStatus.Draft:
      return FileText;
    case SupplyOrderStatus.Pending:
      return Clock;
    case SupplyOrderStatus.Approved:
      return CheckCircle2;
    case SupplyOrderStatus.PartiallyFulfilled:
      return PackageCheck;
    case SupplyOrderStatus.Fulfilled:
      return Truck;
    case SupplyOrderStatus.Invoiced:
      return DollarSign;
    case SupplyOrderStatus.Cancelled:
      return XCircle;
    default:
      return Clock;
  }
}

export function isSupplyOrderCancelled(status: number): boolean {
  return status === SupplyOrderStatus.Cancelled;
}

export function getLifecycleSteps(statuses: SupplyOrderStatusOption[]) {
  return [...statuses]
    .filter((s) => s.value !== SupplyOrderStatus.Cancelled)
    .sort((a, b) => a.value - b.value);
}

export interface SupplyOrderProgressSnapshot {
  fulfilled: number;
  ordered: number;
  fulfillmentPercent: number;
  invoicedAmount: number;
  totalAmount: number;
  billingPercent: number;
}

export function getSupplyOrderProgress(so: SupplyOrder): SupplyOrderProgressSnapshot {
  const items = so.items ?? [];
  const ordered = items.reduce((sum, line) => sum + (line.orderedQuantity || 0), 0);
  const fulfilled = items.reduce((sum, line) => sum + (line.fulfilledQuantity || 0), 0);
  const totalAmount = so.totalAmount || 0;
  const invoicedAmount =
    so.status === SupplyOrderStatus.Invoiced || so.invoiceId != null ? totalAmount : 0;

  return {
    fulfilled,
    ordered,
    fulfillmentPercent: ordered > 0 ? Math.min(100, Math.round((fulfilled / ordered) * 100)) : 0,
    invoicedAmount,
    totalAmount,
    billingPercent:
      totalAmount > 0 ? Math.min(100, Math.round((invoicedAmount / totalAmount) * 100)) : 0,
  };
}

export function getFinancialSummaryLabel(so: SupplyOrder): string {
  if (so.status === SupplyOrderStatus.Cancelled) return 'Cancelled';
  if (so.status === SupplyOrderStatus.Invoiced || so.invoiceId != null) return 'Invoiced';
  if (so.status === SupplyOrderStatus.Fulfilled) return 'Ready to invoice';
  if (so.status === SupplyOrderStatus.PartiallyFulfilled) return 'Partially fulfilled';
  if (so.status === SupplyOrderStatus.Approved) return 'Approved';
  if (so.status === SupplyOrderStatus.Pending) return 'Awaiting approval';
  if (so.status === SupplyOrderStatus.Draft) return 'Draft';
  return 'In progress';
}

export function getRecommendedSupplyOrderAction(
  so: SupplyOrder,
  hasDeliveryChallans: boolean
): 'dispatch' | 'invoice' | 'none' {
  if (so.status === SupplyOrderStatus.Cancelled || so.status === SupplyOrderStatus.Invoiced) {
    return 'none';
  }
  if (hasDeliveryChallans && so.status >= SupplyOrderStatus.PartiallyFulfilled) return 'invoice';
  if (so.status >= SupplyOrderStatus.Approved) return 'dispatch';
  return 'none';
}
