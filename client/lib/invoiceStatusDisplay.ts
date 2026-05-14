import { InvoiceStatus } from '@/types/api/invoices';

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.Draft:
      return 'Draft';
    case InvoiceStatus.Generated:
      return 'Generated';
    case InvoiceStatus.Sent:
      return 'Sent';
    case InvoiceStatus.PartiallyPaid:
      return 'Partially Paid';
    case InvoiceStatus.Paid:
      return 'Paid';
    case InvoiceStatus.Overdue:
      return 'Overdue';
    case InvoiceStatus.Cancelled:
      return 'Cancelled';
    case InvoiceStatus.Refunded:
      return 'Refunded';
    default:
      return 'Unknown';
  }
}

export function getInvoiceStatusClassName(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.Paid:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case InvoiceStatus.Overdue:
      return 'bg-red-50 text-red-700 border-red-200';
    case InvoiceStatus.PartiallyPaid:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case InvoiceStatus.Cancelled:
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case InvoiceStatus.Sent:
    case InvoiceStatus.Generated:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case InvoiceStatus.Draft:
      return 'bg-slate-50 text-slate-600 border-slate-200';
    case InvoiceStatus.Refunded:
      return 'bg-violet-50 text-violet-700 border-violet-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}
