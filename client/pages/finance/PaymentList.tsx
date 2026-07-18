import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PaymentForm from './PaymentForm';
import { formatCurrency } from '@/lib/utils';
import { usePaymentList, useDeletePayment } from '@/api/services/payments';
import { PaymentDto, PaymentListQueryParams, PaymentMode } from '@/types/api/payments';

const PAGE_SIZE = 10;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function PaymentList() {
  const { hasPermission } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [params, setParams] = useState<PaymentListQueryParams>({
    pageNumber: 1,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    const term = debouncedSearch.trim();
    setParams((p) => ({
      ...p,
      pageNumber: 1,
      searchTerm: term || undefined,
    }));
  }, [debouncedSearch]);

  const { data, isLoading } = usePaymentList(params);
  const { mutate: deletePayment } = useDeletePayment();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canCreate = hasPermission('payments', 'create');
  const canDelete = hasPermission('payments', 'delete');

  const payments = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageNumber = params.pageNumber ?? 1;
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, data?.totalPages ?? (Math.ceil(totalCount / pageSize) || 1));
  const hasPrevious = data?.hasPrevious ?? pageNumber > 1;
  const hasNext = data?.hasNext ?? pageNumber < totalPages;
  const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageNumber * pageSize, totalCount);

  const getPaymentModeLabel = (mode: PaymentMode) => {
    switch (mode) {
      case PaymentMode.Cash:
        return 'Cash';
      case PaymentMode.Cheque:
        return 'Cheque';
      case PaymentMode.BankTransfer:
        return 'Bank';
      case PaymentMode.CreditCard:
        return 'Credit Card';
      case PaymentMode.DebitCard:
        return 'Debit Card';
      default:
        return 'Unknown';
    }
  };

  const getPaymentModeColor = (mode: PaymentMode) => {
    switch (mode) {
      case PaymentMode.Cash:
        return 'bg-green-100 text-green-800';
      case PaymentMode.Cheque:
        return 'bg-blue-100 text-blue-800';
      case PaymentMode.BankTransfer:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: Column<PaymentDto>[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Reference', accessor: 'referenceNumber' },
    {
      header: 'Payment Mode',
      accessor: (row) => (
        <Badge className={getPaymentModeColor(row.paymentMode)}>
          {getPaymentModeLabel(row.paymentMode)}
        </Badge>
      ),
    },
    {
      header: 'Related ID',
      accessor: (row) => row.purchaseOrderNumber || row.invoiceNumber || 'N/A',
    },
    {
      header: 'Date',
      accessor: (row) => new Date(row.paymentDate).toLocaleDateString(),
    },
    {
      header: 'Amount (PKR)',
      accessor: (row) => formatCurrency(row.amount),
    },
    {
      header: 'Account',
      accessor: 'accountName',
      className: 'hidden sm:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage payment transactions
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by reference or payment number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-lg border border-border">
        {isLoading ? (
          <div className="p-8 text-center">Loading payments...</div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={payments}
              onDelete={canDelete ? (payment) => setIsDeleteConfirming(payment.id) : undefined}
              itemsPerPage={PAGE_SIZE}
              showSearch={false}
              showToolbar={false}
              showColumnVisibility={false}
              preserveServerOrder
              hidePaginationFooter
              emptyMessage="No payments found. Record a new payment to get started."
              resetSortTrigger={refreshTrigger}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                of <span className="font-medium text-foreground">{totalCount}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!hasPrevious}
                  onClick={() => setParams((p) => ({ ...p, pageNumber: 1 }))}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!hasPrevious}
                  onClick={() =>
                    setParams((p) => ({
                      ...p,
                      pageNumber: Math.max(1, (p.pageNumber ?? 1) - 1),
                    }))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[100px] text-center text-sm font-medium tabular-nums">
                  {pageNumber} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!hasNext}
                  onClick={() =>
                    setParams((p) => ({
                      ...p,
                      pageNumber: (p.pageNumber ?? 1) + 1,
                    }))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!hasNext}
                  onClick={() => setParams((p) => ({ ...p, pageNumber: totalPages }))}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
            <DialogDescription>Record a new payment transaction</DialogDescription>
          </DialogHeader>
          <PaymentForm
            onSuccess={() => {
              setIsFormOpen(false);
              setRefreshTrigger((prev) => prev + 1);
            }}
          />
        </DialogContent>
      </Dialog>

      {isDeleteConfirming && (
        <Dialog
          open={!!isDeleteConfirming}
          onOpenChange={() => setIsDeleteConfirming(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this payment record? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deletePayment(isDeleteConfirming!, {
                    onSuccess: () => setIsDeleteConfirming(null),
                  });
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
