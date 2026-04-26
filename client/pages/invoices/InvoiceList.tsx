import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Plus,
  ReceiptText,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useInvoice, useInvoices, useOutstandingInvoices, useOverdueInvoices } from '@/hooks/invoices';
import { type InvoiceDto, InvoiceStatus } from '@/types/api/invoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/common/DataTable';
import InvoiceForm from './InvoiceForm';
import { cn, formatCurrency } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;
const PAGE_SIZE = 1000;

function formatDate(value: string | null): string {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInvoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.Draft:
      return 'Draft';
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
    case InvoiceStatus.Disputed:
      return 'Disputed';
    default:
      return 'Unknown';
  }
}

function getInvoiceStatusClassName(status: InvoiceStatus): string {
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
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getDaysPastDue(dueDate: string): number {
  const current = new Date();
  const due = new Date(dueDate);
  const currentUtc = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.max(0, Math.floor((currentUtc - dueUtc) / (1000 * 60 * 60 * 24)));
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

const StatsCards = memo(function StatsCards({
  totalInvoices,
  totalValue,
  outstandingCount,
  outstandingAmount,
  overdueCount,
  overdueAmount,
}: {
  totalInvoices: number;
  totalValue: number;
  outstandingCount: number;
  outstandingAmount: number;
  overdueCount: number;
  overdueAmount: number;
}) {
  const cards = [
    {
      label: 'Invoices',
      value: totalInvoices.toString(),
      helper: formatCurrency(totalValue),
      icon: ReceiptText,
      tone: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'Outstanding',
      value: outstandingCount.toString(),
      helper: formatCurrency(outstandingAmount),
      icon: CircleDollarSign,
      tone: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Overdue',
      value: overdueCount.toString(),
      helper: formatCurrency(overdueAmount),
      icon: TriangleAlert,
      tone: 'text-red-700 bg-red-50',
    },
    {
      label: 'Due Soon',
      value: Math.max(outstandingCount - overdueCount, 0).toString(),
      helper: 'Requires attention',
      icon: CalendarClock,
      tone: 'text-violet-700 bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.05 }}
        >
          <Card className="h-full border-border/70 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{card.helper}</p>
              </div>
              <div className={cn('rounded-xl p-2.5', card.tone)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
});

const InvoiceDetailPanel = memo(function InvoiceDetailPanel({
  invoice,
  isLoading,
}: {
  invoice: InvoiceDto | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="space-y-3 animate-pulse">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card className="flex h-full min-h-[220px] items-center justify-center border-dashed p-6 text-center">
        <div className="space-y-2">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <h3 className="font-semibold">Select an invoice</h3>
          <p className="text-sm text-muted-foreground">
            Select an invoice from the list to see its full details, including items and payment status.
          </p>
        </div>
      </Card>
    );
  }

  const items = invoice.items ?? [];

  return (
    <Card className="space-y-5 p-5">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{invoice.invoiceNumber || `Invoice #${invoice.id}`}</h3>
          <p className="text-sm text-muted-foreground">{invoice.hospitalName || 'Hospital unavailable'}</p>
        </div>
        <Badge variant="outline" className={cn('w-fit', getInvoiceStatusClassName(invoice.status))}>
          {getInvoiceStatusLabel(invoice.status)}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice date</p>
          <p className="mt-1 font-medium">{formatDate(invoice.invoiceDate)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due date</p>
          <p className="mt-1 font-medium">{formatDate(invoice.dueDate)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outstanding amount</p>
          <p className="mt-1 font-medium">{formatCurrency(invoice.outstandingAmount)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paid amount</p>
          <p className="mt-1 font-medium">{formatCurrency(invoice.paidAmount)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Items</h4>
          <span className="text-sm text-muted-foreground">{items.length} line item(s)</span>
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No item details available for this invoice.
            </div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.productName || `Product #${item.productId}`}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Tax {item.taxPercentage}% · Discount {item.discountPercentage}%
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {invoice.notes ? (
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-1 text-sm">{invoice.notes}</p>
        </div>
      ) : null}
    </Card>
  );
});

export default function InvoiceList() {
  const { hasPermission } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const canCreate = hasPermission('invoices', 'create');

  const invoiceParams = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: PAGE_SIZE,
      searchTerm: debouncedSearch || undefined,
    }),
    [debouncedSearch],
  );

  const {
    data: invoicesResponse,
    isPending: isLoadingInvoices,
    error: invoicesError,
  } = useInvoices(invoiceParams);
  const { data: outstandingResponse, isPending: isLoadingOutstanding } = useOutstandingInvoices();
  const { data: overdueResponse, isPending: isLoadingOverdue } = useOverdueInvoices();
  const { data: selectedInvoiceResponse, isPending: isLoadingInvoice } = useInvoice(selectedInvoiceId);

  const invoices = invoicesResponse?.data.items ?? [];
  const outstandingInvoices = outstandingResponse?.data ?? [];
  const overdueInvoices = overdueResponse?.data ?? [];
  const selectedInvoice = selectedInvoiceResponse?.data;

  useEffect(() => {
    if (invoices.length === 0) {
      setSelectedInvoiceId(null);
      return;
    }

    setSelectedInvoiceId((current) => {
      if (current !== null && invoices.some((invoice) => invoice.id === current)) {
        return current;
      }

      return invoices[0]?.id ?? null;
    });
  }, [invoices]);

  const totals = useMemo(() => {
    const totalValue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const outstandingAmount = outstandingInvoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);

    return {
      totalValue,
      outstandingAmount,
      overdueAmount,
    };
  }, [invoices, outstandingInvoices, overdueInvoices]);

  const handleRowClick = useCallback((invoice: InvoiceDto) => {
    setSelectedInvoiceId(invoice.id);
  }, []);

  const columns: Column<InvoiceDto>[] = useMemo(() => [
    {
      header: 'Invoice',
      accessor: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.invoiceNumber || `Invoice #${row.id}`}</div>
          <div className="text-xs text-muted-foreground">Hospital ID #{row.hospitalId}</div>
        </div>
      ),
      className: 'w-32',
    },
    {
      header: 'Hospital',
      accessor: (row) => row.hospitalName || 'N/A',
      className: 'w-40',
    },
    {
      header: 'Invoice Date',
      accessor: (row) => formatDate(row.invoiceDate),
      mobileHidden: true,
      className: 'w-24',
    },
    {
      header: 'Due Date',
      accessor: (row) => (
        <div className="space-y-1">
          <div>{formatDate(row.dueDate)}</div>
          {row.status === InvoiceStatus.Overdue || row.outstandingAmount > 0 ? (
            <div className="text-xs text-muted-foreground">
              {getDaysPastDue(row.dueDate) > 0 ? `${getDaysPastDue(row.dueDate)} day(s) overdue` : 'Open balance'}
            </div>
          ) : null}
        </div>
      ),
      mobileHidden: true,
      className: 'w-28',
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant="outline" className={cn('font-medium', getInvoiceStatusClassName(row.status))}>
          {getInvoiceStatusLabel(row.status)}
        </Badge>
      ),
      className: 'w-20',
    },
    {
      header: 'Total',
      accessor: (row) => <span className="font-semibold">{formatCurrency(row.totalAmount)}</span>,
      className: 'w-24 text-right',
    },
    {
      header: 'Outstanding',
      accessor: (row) => (
        <span className={cn('font-semibold', row.outstandingAmount > 0 ? 'text-amber-700' : 'text-emerald-700')}>
          {formatCurrency(row.outstandingAmount)}
        </span>
      ),
      className: 'w-28 text-right',
    },
  ], []);

  if (invoicesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Invoice Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage all hospital invoices, track payments, and monitor outstanding balances.</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
          <h2 className="mt-4 text-lg font-semibold text-red-900">Unable to load invoices</h2>
          <p className="mt-1 text-sm text-red-700">
            {invoicesError.userMessage || 'We couldn’t load the invoices. Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Invoice Management
          </motion.h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all hospital invoices, track payments, and monitor outstanding balances.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by invoice number or hospital..."
              className="pl-10"
            />
          </div>

          {canCreate ? (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          ) : null}
        </div>
      </div>

      <StatsCards
        totalInvoices={invoicesResponse?.data.totalCount ?? invoices.length}
        totalValue={totals.totalValue}
        outstandingCount={outstandingInvoices.length}
        outstandingAmount={totals.outstandingAmount}
        overdueCount={overdueInvoices.length}
        overdueAmount={totals.overdueAmount}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-border/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Invoices</h2>
              {(isLoadingOutstanding || isLoadingOverdue) ? (
                <Badge variant="outline">Refreshing insights…</Badge>
              ) : null}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={debouncedSearch || 'all-invoices'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DataTable
                  columns={columns}
                  data={invoices}
                  isLoading={isLoadingInvoices}
                  itemsPerPage={ITEMS_PER_PAGE}
                  emptyMessage="No invoices found for the current search."
                  showSearch={false}
                  showColumnVisibility={false}
                  onRowClick={handleRowClick}
                />
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <InvoiceDetailPanel invoice={selectedInvoice} isLoading={isLoadingInvoice} />
        </motion.div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[92vh] max-w-6xl p-0 flex flex-col">
          <div className="border-b bg-background p-6">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>
                Fill in the invoice details. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="overflow-y-auto p-6">
            <InvoiceForm onSuccess={() => setIsCreateOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}