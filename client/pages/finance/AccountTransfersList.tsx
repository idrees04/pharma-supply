// AccountTransfersList.tsx
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useAccountTransfers,
  useAccountTransfer,
  useCreateAccountTransfer,
  useDeleteAccountTransfer,
} from '@/hooks/accountTransfers';
import { AccountTransferDto } from '@/types/api/accountTransfers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/common/DataTable';
import AccountTransferForm from './AccountTransferForm';
import { cn, formatCurrency } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;
const PAGE_SIZE = 1000;

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);
  return debouncedValue;
}

// Stats Cards (optional but follows the pattern)
const StatsCards = memo(function StatsCards({
  totalTransfers,
  totalAmount,
  activeCount,
  inactiveCount,
}: {
  totalTransfers: number;
  totalAmount: number;
  activeCount: number;
  inactiveCount: number;
}) {
  const cards = [
    {
      label: 'Total Transfers',
      value: totalTransfers.toString(),
      helper: formatCurrency(totalAmount),
      icon: ArrowLeftRight,
      tone: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'Active',
      value: activeCount.toString(),
      helper: 'Active transfers',
      icon: CircleDollarSign,
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Inactive',
      value: inactiveCount.toString(),
      helper: 'Disabled transfers',
      icon: TriangleAlert,
      tone: 'text-slate-700 bg-slate-50',
    },
    {
      label: 'Recent (30d)',
      value: '—',
      helper: 'Based on transfer date',
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

// Detail Panel for selected transfer
const TransferDetailPanel = memo(function TransferDetailPanel({
  transfer,
  isLoading,
}: {
  transfer: AccountTransferDto | undefined;
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

  if (!transfer) {
    return (
      <Card className="flex h-full min-h-[220px] items-center justify-center border-dashed p-6 text-center">
        <div className="space-y-2">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <h3 className="font-semibold">Select a transfer</h3>
          <p className="text-sm text-muted-foreground">
            Select a transfer from the list to see its full details.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{transfer.transferNumber || `Transfer #${transfer.id}`}</h3>
          <p className="text-sm text-muted-foreground">{formatDateTime(transfer.transferDate)}</p>
        </div>
        <Badge variant="outline" className={transfer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
          {transfer.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From Account</p>
          <p className="mt-1 font-medium">{transfer.fromAccountName || `Account #${transfer.fromAccountId}`}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To Account</p>
          <p className="mt-1 font-medium">{transfer.toAccountName || `Account #${transfer.toAccountId}`}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
          <p className="mt-1 text-lg font-bold">{formatCurrency(transfer.amount)}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference Number</p>
          <p className="mt-1 font-medium">{transfer.referenceNumber || '—'}</p>
        </div>
      </div>

      {transfer.notes && (
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{transfer.notes}</p>
        </div>
      )}
    </Card>
  );
});

export default function AccountTransfersList() {
  const { hasPermission } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferToDelete, setTransferToDelete] = useState<AccountTransferDto | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const canCreate = hasPermission('accountTransfers', 'create');
  const canDelete = hasPermission('accountTransfers', 'delete');

  // Query params for list
  const queryParams = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: PAGE_SIZE,
      searchTerm: debouncedSearch || undefined,
    }),
    [debouncedSearch]
  );

  const {
    data: transfersResponse,
    isPending: isLoadingTransfers,
    error: transfersError,
  } = useAccountTransfers(queryParams);
  const { data: selectedTransferResponse, isPending: isLoadingTransfer } = useAccountTransfer(selectedTransferId);
  const createTransferMutation = useCreateAccountTransfer();
  const deleteTransferMutation = useDeleteAccountTransfer();

  const transfers = transfersResponse?.items ?? [];
  const selectedTransfer = selectedTransferResponse ?? undefined;

  // Auto-select first transfer when list loads
  useEffect(() => {
    if (transfers.length === 0) {
      setSelectedTransferId(null);
      return;
    }
    setSelectedTransferId((current) => {
      if (current !== null && transfers.some((t) => t.id === current)) return current;
      return transfers[0]?.id ?? null;
    });
  }, [transfers]);

  // Compute stats
  const stats = useMemo(() => {
    const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);
    const activeCount = transfers.filter((t) => t.isActive).length;
    const inactiveCount = transfers.filter((t) => !t.isActive).length;
    return { totalAmount, activeCount, inactiveCount };
  }, [transfers]);

  const handleRowClick = useCallback((transfer: AccountTransferDto) => {
    setSelectedTransferId(transfer.id);
  }, []);

  const handleDeleteClick = useCallback((transfer: AccountTransferDto) => {
    setTransferToDelete(transfer);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!transferToDelete) return;
    try {
      await deleteTransferMutation.mutateAsync(transferToDelete.id);
      // If the deleted transfer was selected, clear selection
      if (selectedTransferId === transferToDelete.id) {
        setSelectedTransferId(null);
      }
    } finally {
      setDeleteDialogOpen(false);
      setTransferToDelete(null);
    }
  }, [deleteTransferMutation, transferToDelete, selectedTransferId]);

  // Columns for DataTable
  const columns: Column<AccountTransferDto>[] = useMemo(
    () => [
      {
        header: 'Transfer #',
        accessor: (row) => (
          <div>
            <div className="font-semibold text-slate-900">{row.transferNumber || `#${row.id}`}</div>
            <div className="text-xs text-muted-foreground">{formatDate(row.transferDate)}</div>
          </div>
        ),
        className: 'w-32',
      },
      {
        header: 'From → To',
        accessor: (row) => (
          <div className="text-sm">
            <span>{row.fromAccountName || `Acc ${row.fromAccountId}`}</span>
            <span className="mx-1 text-muted-foreground">→</span>
            <span>{row.toAccountName || `Acc ${row.toAccountId}`}</span>
          </div>
        ),
        className: 'w-48',
      },
      {
        header: 'Amount (PKR)',
        accessor: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span>,
        className: 'w-24 text-right',
      },
      {
        header: 'Reference',
        accessor: (row) => row.referenceNumber || '—',
        mobileHidden: true,
        className: 'w-32',
      },
      {
        header: 'Status',
        accessor: (row) => (
          <Badge variant="outline" className={row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        className: 'w-20',
      },
      ...(canDelete
        ? [
            {
              header: 'Actions',
              accessor: (row: AccountTransferDto) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(row);
                  }}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ),
              className: 'w-16 text-center',
            } as Column<AccountTransferDto>,
          ]
        : []),
    ],
    [canDelete, handleDeleteClick]
  );

  if (transfersError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Account Transfers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage transfers between accounts.
          </p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
          <h2 className="mt-4 text-lg font-semibold text-red-900">Unable to load transfers</h2>
          <p className="mt-1 text-sm text-red-700">
            {transfersError.userMessage || 'Please try again later.'}
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
            Account Transfers
          </motion.h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record and track fund movements between accounts.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by transfer number, reference, or notes..."
              className="pl-10"
            />
          </div>
          {/* {canCreate && ( */}
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Transfer
            </Button>
          {/* )} */}
        </div>
      </div>

      <StatsCards
        totalTransfers={transfersResponse?.totalCount ?? transfers.length}
        totalAmount={stats.totalAmount}
        activeCount={stats.activeCount}
        inactiveCount={stats.inactiveCount}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-border/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Transfers</h2>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={debouncedSearch || 'all-transfers'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DataTable
                  columns={columns}
                  data={transfers}
                  isLoading={isLoadingTransfers}
                  itemsPerPage={ITEMS_PER_PAGE}
                  emptyMessage="No transfers found for the current search."
                  showSearch={false}
                  showColumnVisibility={false}
                  onRowClick={handleRowClick}
                />
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <TransferDetailPanel transfer={selectedTransfer} isLoading={isLoadingTransfer} />
        </motion.div>
      </div>

      {/* Create Transfer Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl p-0 flex flex-col">
          <div className="border-b bg-background p-6">
            <DialogHeader>
              <DialogTitle>Create Account Transfer</DialogTitle>
              <DialogDescription>
                Move funds from one account to another. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="overflow-y-auto p-6">            
            <AccountTransferForm
            //   onSuccess={() => {
            //     setIsCreateOpen(false);
            //     // Refetch is handled by the mutation's onSuccess invalidation
            //   }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the transfer{' '}
              <strong>{transferToDelete?.transferNumber || `#${transferToDelete?.id}`}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}