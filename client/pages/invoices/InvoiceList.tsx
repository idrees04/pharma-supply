import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CalendarClock,
  CircleDollarSign,
  ExternalLink,
  FileText,
  ReceiptText,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { useInvoice, useInvoices, useOutstandingInvoices, useOverdueInvoices } from '@/hooks/invoices';
import { type InvoiceDto, InvoiceStatus } from '@/types/api/invoices';
import { getInvoiceStatusClassName, getInvoiceStatusLabel } from '@/lib/invoiceStatusDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { TableCard } from '@/components/common/TableCard';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/common/DataTable';
import { cn, formatCurrency } from '@/lib/utils';
import {
  formatInvoiceBatchSlice,
  groupInvoiceItemsByProduct,
} from '@/lib/invoices/groupInvoiceItems';

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
      label: 'Outstanding (PKR)',
      value: outstandingCount.toString(),
      helper: formatCurrency(outstandingAmount),
      icon: CircleDollarSign,
      tone: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Overdue (PKR)',
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
  className,
}: {
  invoice: InvoiceDto | undefined;
  isLoading: boolean;
  className?: string;
}) {
  if (isLoading) {
    return (
      <Card className={cn('p-5', className)}>
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
      <Card className={cn('flex h-full min-h-[220px] items-center justify-center border-dashed p-6 text-center', className)}>
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

  const productLines = groupInvoiceItemsByProduct(invoice.items ?? []);

  return (
    <Card className={cn('space-y-5 p-5', className)}>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outstanding amount (PKR)</p>
          <p className="mt-1 font-medium">{formatCurrency(invoice.outstandingAmount)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paid amount (PKR)</p>
          <p className="mt-1 font-medium">{formatCurrency(invoice.paidAmount)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Items</h4>
          <span className="text-sm text-muted-foreground">{productLines.length} product(s)</span>
        </div>

        <div className="space-y-2">
          {productLines.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No item details available for this invoice.
            </div>
          ) : (
            productLines.map((line) => (
              <motion.div
                key={line.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{line.productName || `Product #${line.productId}`}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty {line.quantity} x {formatCurrency(line.unitPrice)}
                    </p>
                    {line.batches.length > 0 ? (
                      <ul className="mt-1.5 space-y-0.5">
                        {line.batches.map((batch, batchIdx) => (
                          <li
                            key={`${line.key}-b-${batchIdx}`}
                            className="text-xs text-muted-foreground"
                          >
                            {formatInvoiceBatchSlice(batch)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCurrency(line.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Tax {line.taxPercentage}% · Discount {line.discountPercentage}%
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
  const [searchInput, setSearchInput] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

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
    if (selectedInvoiceId === null) return;
    if (invoices.length === 0 || !invoices.some((inv) => inv.id === selectedInvoiceId)) {
      setSelectedInvoiceId(null);
    }
  }, [invoices, selectedInvoiceId]);

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
          <div className="font-semibold text-foreground">{row.invoiceNumber || `Invoice #${row.id}`}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {row.hospitalName || `Hospital #${row.hospitalId}`}
          </div>
        </div>
      ),
      className: 'min-w-[140px]',
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
      id: 'invoiceDate',
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
      header: 'Total incl. tax (PKR)',
      accessor: (row) => <span className="font-semibold">{formatCurrency(row.totalAmount)}</span>,
      className: 'w-24 text-right',
    },
    {
      header: 'Due ex. tax (PKR)',
      accessor: (row) => (
        <span className={cn('font-semibold', row.outstandingAmount > 0 ? 'text-amber-700' : 'text-emerald-700')}>
          {formatCurrency(row.outstandingAmount)}
        </span>
      ),
      className: 'w-28 text-right',
    },
    {
      header: '',
      id: 'actions',
      accessor: (row) => (
        <Button variant="outline" size="sm" className="h-8 shrink-0 px-3" asChild>
          <Link to={`/invoices/${row.id}`} onClick={(e) => e.stopPropagation()}>
            Details
          </Link>
        </Button>
      ),
      className: 'w-[92px]',
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
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Browse invoices below. Click a row to preview in the side panel, then open the full page for payments and PDF.
          </p>
        </div>

        <div className="relative w-full min-w-0 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search invoice number or hospital..."
            className="h-11 pl-10"
          />
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <TableCard
          icon={<ReceiptText />}
          title="All invoices"
          description="Click any row to open the preview drawer."
          count={invoicesResponse?.data.totalCount ?? invoices.length}
          countLabel={(c) => `${c} invoice(s)`}
          actions={
            (isLoadingOutstanding || isLoadingOverdue) ? (
              <Badge variant="outline" className="w-fit text-xs font-normal">
                Refreshing insights…
              </Badge>
            ) : null
          }
          contentClassName="p-2 sm:p-4 pt-2 sm:pt-4"
        >
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
                emptyMessage="No invoices match your search."
                showSearch={false}
                showColumnVisibility={false}
                showToolbar={false}
                defaultSort={{ id: 'invoiceDate', desc: false }}
                onRowClick={handleRowClick}
              />
            </motion.div>
          </AnimatePresence>
        </TableCard>
      </motion.div>

      <Sheet open={selectedInvoiceId !== null} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-6 py-4 text-left">
            <SheetTitle className="text-lg">Invoice preview</SheetTitle>
            <SheetDescription>
              {selectedInvoice?.invoiceNumber ? (
                <span className="font-mono font-semibold text-foreground">{selectedInvoice.invoiceNumber}</span>
              ) : selectedInvoiceId ? (
                <span className="text-muted-foreground">Loading invoice #{selectedInvoiceId}…</span>
              ) : null}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <InvoiceDetailPanel
              invoice={selectedInvoice}
              isLoading={isLoadingInvoice}
              className="border-0 bg-transparent shadow-none"
            />
          </div>
          <div className="border-t bg-muted/20 px-4 py-4 sm:px-6">
            {selectedInvoice && selectedInvoiceId ? (
              <Button asChild className="w-full gap-2">
                <Link to={`/invoices/${selectedInvoiceId}`}>
                  Open full details
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button type="button" className="w-full gap-2" disabled>
                Open full details
                <ExternalLink className="h-4 w-4 opacity-50" />
              </Button>
            )}
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Record payments, download PDF, and edit from the full page.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}