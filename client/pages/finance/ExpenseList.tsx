import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Plus,
  Search,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Printer,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/common/DataTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import {
  useExpenseList,
  useIssuedVoucherExpenses,
  useDeleteExpense,
  useIssueExpenseVoucher,
  useVoucherPrint,
} from '@/api/services/expenses';
import type { ExpenseDto, ExpenseListQueryParams } from '@/types/api/expenses';
import { ExpenseStatus } from '@/types/api/expenses';
import { useExpenseStatusOptions } from '@/hooks/dropdown';
import ExpenseForm from './ExpenseForm';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const ITEMS_PER_PAGE_TABLE = 100;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function statusBadgeVariant(status: ExpenseStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === ExpenseStatus.Paid) return 'default';
  if (status === ExpenseStatus.Cancelled) return 'destructive';
  return 'secondary';
}

export default function ExpenseList() {
  const { hasPermission } = useAuth();
  const { data: statusOptions = [] } = useExpenseStatusOptions();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [listParams, setListParams] = useState<ExpenseListQueryParams>({
    pageNumber: 1,
    pageSize: 10,
  });

  useEffect(() => {
    const term = debouncedSearch.trim();
    setListParams((p) => ({
      ...p,
      pageNumber: 1,
      searchTerm: term || undefined,
    }));
  }, [debouncedSearch]);

  const { data: paged, isPending: loadingMain } = useExpenseList(listParams);
  const { data: issuedList = [], isPending: loadingIssued } = useIssuedVoucherExpenses();

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [issueFor, setIssueFor] = useState<ExpenseDto | null>(null);
  const [templateKey, setTemplateKey] = useState('default');
  const [printForId, setPrintForId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canCreate = hasPermission('expenses', 'create');
  const canUpdate = hasPermission('expenses', 'update');
  const canDelete = hasPermission('expenses', 'delete');

  const { mutate: deleteExpense, isPending: deleting } = useDeleteExpense();
  const issueMutation = useIssueExpenseVoucher();

  const rows = paged?.items ?? [];
  const totalCount = paged?.totalCount ?? 0;
  const totalPages = Math.max(1, paged?.totalPages ?? 1);
  const pageNumber = listParams.pageNumber ?? 1;
  const pageSize = listParams.pageSize ?? 10;
  const hasPrevious = paged?.hasPrevious ?? pageNumber > 1;
  const hasNext = paged?.hasNext ?? pageNumber < totalPages;
  const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageNumber * pageSize, totalCount);
  const pageTotal = useMemo(() => rows.reduce((s, e) => s + e.amount, 0), [rows]);

  const statusLabel = useCallback(
    (s: ExpenseStatus) => statusOptions.find((o) => o.value === s)?.name ?? `Status ${s}`,
    [statusOptions],
  );

  const openEdit = useCallback((row: ExpenseDto) => {
    setEditId(row.id);
    setFormOpen(true);
  }, []);

  const requestEdit = useCallback(
    (row: ExpenseDto) => {
      if (row.status !== ExpenseStatus.Pending) {
        toast.error('Only pending expenses can be edited');
        return;
      }
      openEdit(row);
    },
    [openEdit],
  );

  const requestDelete = useCallback((row: ExpenseDto) => {
    if (row.status === ExpenseStatus.Paid) {
      toast.error('Paid expenses cannot be deleted');
      return;
    }
    setDeleteId(row.id);
  }, []);

  const columns: Column<ExpenseDto>[] = useMemo(
    () => [
      {
        header: 'Expense #',
        accessor: (row) => <span className="font-mono text-xs font-semibold">{row.expenseNumber ?? '—'}</span>,
      },
      {
        header: 'Date',
        accessor: (row) => new Date(row.expenseDate).toLocaleDateString(),
        className: 'whitespace-nowrap',
      },
      {
        header: 'Category',
        accessor: (row) => row.expenseCategoryName ?? '—',
      },
      {
        header: 'Account',
        accessor: (row) => row.accountName ?? '—',
        mobileHidden: true,
      },
      {
        header: 'Payee',
        accessor: (row) => row.payeeName?.trim() || '—',
        mobileHidden: true,
      },
      {
        header: 'Amount',
        accessor: (row) => <span className="font-semibold tabular-nums">{formatCurrency(row.amount)}</span>,
        className: 'text-right',
      },
      {
        header: 'Status',
        accessor: (row) => (
          <Badge variant={statusBadgeVariant(row.status)} className="font-normal">
            {statusLabel(row.status)}
          </Badge>
        ),
      },
      {
        header: 'Voucher',
        accessor: (row) =>
          row.voucherNumber ? (
            <span className="font-mono text-xs">{row.voucherNumber}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        className: 'whitespace-nowrap',
      },
      {
        header: '',
        id: 'more',
        accessor: (row) => (
          <div className="flex flex-wrap justify-end gap-1">
            {row.status === ExpenseStatus.Paid && !row.voucherNumber ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setIssueFor(row);
                  setTemplateKey('default');
                }}
              >
                <Ticket className="h-3.5 w-3.5" />
                Issue
              </Button>
            ) : null}
            {row.voucherNumber ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setPrintForId(row.id);
                }}
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
            ) : null}
          </div>
        ),
        className: 'w-[1%]',
      },
    ],
    [statusLabel],
  );

  const confirmIssue = () => {
    if (!issueFor?.id) return;
    issueMutation.mutate(
      {
        expenseId: issueFor.id,
        voucherTemplateKey: templateKey.trim() || 'default',
      },
      {
        onSuccess: () => {
          toast.success('Voucher issued');
          setIssueFor(null);
        },
        onError: (e) => toast.error(e.userMessage || 'Could not issue voucher'),
      },
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Record spending against accounts. New entries post as <strong>Paid</strong> and deduct the selected account.
          </p>
        </div>
        {canCreate ? (
          <Button
            className="gap-2 shadow-md"
            onClick={() => {
              setEditId(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Record expense
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            All expenses
          </TabsTrigger>
          <TabsTrigger value="issued" className="gap-2">
            <Receipt className="h-4 w-4" />
            Issued vouchers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Kpi label="Total records" value={String(totalCount)} icon={<FileText className="h-4 w-4" />} />
            <Kpi label="This page total" value={formatCurrency(pageTotal)} icon={<Receipt className="h-4 w-4" />} />
            <Kpi label="Page" value={`${pageNumber} / ${totalPages}`} icon={<ChevronRight className="h-4 w-4" />} />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expense # or description…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-10 border-slate-200 bg-slate-50 pl-10 focus:bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Rows</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={pageSize}
                onChange={(e) =>
                  setListParams((p) => ({
                    ...p,
                    pageSize: Number(e.target.value),
                    pageNumber: 1,
                  }))
                }
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Card className="overflow-hidden border shadow-sm">
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={rows}
                isLoading={loadingMain}
                onEdit={canUpdate ? requestEdit : undefined}
                onDelete={canDelete ? requestDelete : undefined}
                itemsPerPage={ITEMS_PER_PAGE_TABLE}
                showSearch={false}
                showToolbar={false}
                showColumnVisibility={false}
                preserveServerOrder
                hidePaginationFooter
                resetSortTrigger={refreshTrigger}
              />
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
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
                onClick={() => setListParams((p) => ({ ...p, pageNumber: 1 }))}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={!hasPrevious}
                onClick={() => setListParams((p) => ({ ...p, pageNumber: Math.max(1, (p.pageNumber ?? 1) - 1) }))}
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
                onClick={() => setListParams((p) => ({ ...p, pageNumber: (p.pageNumber ?? 1) + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={!hasNext}
                onClick={() => setListParams((p) => ({ ...p, pageNumber: totalPages }))}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="issued" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Expenses that already have an issued voucher.</p>
          {loadingIssued ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : issuedList.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
              No issued vouchers yet.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={issuedList}
              itemsPerPage={25}
              showSearch={false}
              showToolbar={false}
              showColumnVisibility={false}
              preserveServerOrder
              emptyMessage="No data"
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditId(undefined);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-hidden p-0">
          <div className="border-b bg-muted/40 px-6 py-4">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit expense' : 'Record expense'}</DialogTitle>
              <DialogDescription>
                {editId
                  ? 'Only pending expenses can be edited. Payee & reference were set at creation.'
                  : 'Funds are deducted from the selected account when you save.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="max-h-[min(75vh,560px)] overflow-y-auto px-6 py-5">
            <ExpenseForm
              expenseId={editId}
              onSuccess={() => {
                setFormOpen(false);
                setEditId(undefined);
                setRefreshTrigger((n) => n + 1);
              }}
              onCancel={() => {
                setFormOpen(false);
                setEditId(undefined);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete expense"
        description="Remove this expense? Paid expenses cannot be deleted."
        onConfirm={() => {
          if (deleteId === null) return;
          deleteExpense(deleteId, {
            onSuccess: () => {
              toast.success('Expense deleted');
              setDeleteId(null);
            },
            onError: (e) => toast.error(e.userMessage || 'Delete failed'),
          });
        }}
        isLoading={deleting}
        confirmText="Delete"
        variant="destructive"
      />

      <Dialog open={issueFor !== null} onOpenChange={(o) => !o && setIssueFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue voucher</DialogTitle>
            <DialogDescription>
              Paid expense {issueFor?.expenseNumber}. Generates voucher number on the server.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="tpl">Template key</Label>
            <Input
              id="tpl"
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              placeholder="default"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueFor(null)}>
              Cancel
            </Button>
            <Button onClick={confirmIssue} disabled={issueMutation.isPending}>
              {issueMutation.isPending ? 'Issuing…' : 'Issue voucher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={printForId !== null} onOpenChange={(o) => !o && setPrintForId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Voucher preview</DialogTitle>
            <DialogDescription>Print-friendly voucher details for this expense.</DialogDescription>
          </DialogHeader>
          {printForId ? <VoucherPrintBody expenseId={printForId} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VoucherPrintBody({ expenseId }: { expenseId: number }) {
  const { data: v, isPending, error } = useVoucherPrint(expenseId);

  if (isPending) return <div className="py-8 text-center text-sm text-muted-foreground">Loading voucher…</div>;
  if (error || !v)
    return (
      <div className="py-6 text-center text-sm text-destructive">
        {(error as { userMessage?: string })?.userMessage || 'Could not load voucher'}
      </div>
    );

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Voucher #</span>
        <span className="font-mono font-semibold">{v.voucherNumber}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Expense #</span>
        <span className="font-mono">{v.expenseNumber}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Payee</span>
        <span>{v.payeeName || '—'}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Amount</span>
        <span className="font-bold tabular-nums">{formatCurrency(v.amount)}</span>
      </div>
      <div className="rounded-lg bg-background p-3 text-xs italic text-muted-foreground">{v.amountInWords}</div>
      <div className="flex justify-end pt-2">
        <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </Card>
  );
}
