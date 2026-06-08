import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Package,
  TrendingDown,
  TrendingUp,
  Calendar,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { DataTable, Column } from '@/components/common/DataTable';
import InventoryAdjustmentForm from './InventoryAdjustmentForm';
import { useInventoryStocks, useExpiringBatches } from '@/api/services/inventory';
import { useLowStockProducts } from '@/api/services/products';
import { InventoryStockDto } from '@/types/api/inventory';
import { formatCurrency } from '@/lib/utils';
import type { InventoryListQueryParams } from '@/types/api/inventory';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** Must match `InventoryStock` entity property names (backend EF.Property). */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Id', label: 'Record ID' },
  { value: 'ProductId', label: 'Product ID' },
  { value: 'AvailableQuantity', label: 'Available qty' },
  { value: 'ReservedQuantity', label: 'Reserved qty' },
  { value: 'TotalQuantity', label: 'Total qty' },
  { value: 'AverageCost', label: 'Average cost' },
  { value: 'TotalValue', label: 'Stock value' },
  { value: 'LastRestockedDate', label: 'Last restock' },
  { value: 'LastDispatchedDate', label: 'Last dispatch' },
];

export default function InventoryList() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const [listParams, setListParams] = useState<InventoryListQueryParams>({
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'Id',
    sortDescending: true,
  });

  useEffect(() => {
    const term = debouncedSearch.trim();
    setListParams((prev) => ({
      ...prev,
      pageNumber: 1,
      searchTerm: term || undefined,
    }));
  }, [debouncedSearch]);

  const {
    data,
    isLoading,
    isFetching: isStocksFetching,
    refetch: refetchStocks,
  } = useInventoryStocks(listParams);
  const {
    data: lowStockProducts,
    refetch: refetchLowStock,
    isFetching: isLowStockFetching,
  } = useLowStockProducts();
  const {
    data: expiringBatches,
    refetch: refetchExpiring,
    isFetching: isExpiringFetching,
  } = useExpiringBatches();

  const isRefreshing = isStocksFetching || isLowStockFetching || isExpiringFetching;

  const handleRefresh = () => {
    void Promise.all([refetchStocks(), refetchLowStock(), refetchExpiring()]);
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryStockDto | null>(null);

  const canUpdate = hasPermission('inventory', 'update');

  const lowStockByProductId = useMemo(() => {
    const m = new Map<number, { reorderLevel: number }>();
    lowStockProducts?.forEach((p) => {
      m.set(p.id, { reorderLevel: p.reorderLevel });
    });
    return m;
  }, [lowStockProducts]);

  const lowStockCount = lowStockProducts?.length ?? 0;

  const handleAdjustment = (item: InventoryStockDto) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  const expiredCount = useMemo(() => {
    if (!expiringBatches) return 0;
    const today = new Date();
    return expiringBatches.filter((batch) => {
      if (!batch.expiryDate) return false;
      return new Date(batch.expiryDate) < today && batch.currentQuantity > 0;
    }).length;
  }, [expiringBatches]);

  const columns: Column<InventoryStockDto>[] = useMemo(
    () => [
      {
        header: 'Code',
        accessor: (row) => (
          <span className="font-mono text-xs text-muted-foreground">{row.productCode ?? '—'}</span>
        ),
        className: 'w-[100px]',
      },
      {
        header: 'Product',
        accessor: (row) => (
          <span className="font-semibold text-slate-900">{row.productName ?? `#${row.productId}`}</span>
        ),
      },
      {
        header: 'Available',
        accessor: (item) => <span className="font-medium text-emerald-700">{item.availableQuantity}</span>,
        className: 'text-right w-[88px]',
      },
      {
        header: 'Reserved',
        accessor: (item) => <span className="text-amber-700">{item.reservedQuantity}</span>,
        className: 'text-right w-[88px]',
      },
      {
        header: 'Total',
        accessor: (item) => <span className="font-semibold tabular-nums">{item.totalQuantity}</span>,
        className: 'text-right w-[80px]',
      },
      {
        header: 'Avg cost (PKR)',
        accessor: (item) => (
          <span className="tabular-nums text-muted-foreground">{formatCurrency(Number(item.averageCost))}</span>
        ),
        className: 'text-right w-[100px]',
      },
      {
        header: 'Stock value (PKR)',
        accessor: (item) => (
          <span className="tabular-nums font-medium">{formatCurrency(Number(item.totalValue))}</span>
        ),
        className: 'text-right w-[110px]',
      },
      {
        header: 'Reorder at',
        accessor: (item) => {
          const info = lowStockByProductId.get(item.productId);
          if (!info) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="tabular-nums text-muted-foreground">{info.reorderLevel}</span>
          );
        },
        className: 'w-[88px] text-right',
      },
      {
        header: 'Restock',
        accessor: (row) =>
          row.lastRestockedDate ? new Date(row.lastRestockedDate).toLocaleDateString() : '—',
        mobileHidden: true,
      },
      {
        header: 'Dispatch',
        accessor: (row) =>
          row.lastDispatchedDate ? new Date(row.lastDispatchedDate).toLocaleDateString() : '—',
        mobileHidden: true,
      },
      {
        header: 'Status',
        accessor: (item) => {
          const isLow = lowStockByProductId.has(item.productId);
          const isOut = item.availableQuantity <= 0;

          if (isOut) {
            return (
              <span className="inline-flex items-center gap-1 text-red-600">
                <TrendingDown className="h-4 w-4" /> Out
              </span>
            );
          }
          if (isLow) {
            return (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <TrendingUp className="h-4 w-4" /> Low
              </span>
            );
          }
          return <span className="text-emerald-600">OK</span>;
        },
      },
    ],
    [lowStockByProductId],
  );

  const inventoryItems = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const pageNumber = listParams.pageNumber ?? 1;
  const pageSize = listParams.pageSize ?? 10;
  const hasPrevious = data?.hasPrevious ?? pageNumber > 1;
  const hasNext = data?.hasNext ?? pageNumber < totalPages;

  const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock levels</h1>
          <p className="text-muted-foreground">
            Search and sort are applied on the server. Low stock uses each product&apos;s{' '}
            <span className="font-medium text-foreground">reorder level</span> (
            <Link className="text-primary underline-offset-4 hover:underline" to="/inventory/products">
              Products
            </Link>
            ).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-fit shrink-0 gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="SKU locations"
          value={totalCount}
          icon={<Package className="h-4 w-4" />}
        />
        <KpiCard
          label="Low stock (reorder)"
          value={lowStockCount}
          icon={<TrendingUp className="h-4 w-4" />}
          valueClassName="text-amber-700"
        />
        <KpiCard
          label="Past-expiry batches"
          description="Batches past expiry that still show on-hand quantity"
          value={expiredCount}
          icon={<Calendar className="h-4 w-4" />}
          valueClassName="text-red-600"
          tooltip="Counts how many batch lines are already past expiry but still have remaining quantity. Based on the near-expiry batch feed, filtered to expiry dates before today."
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:flex-wrap md:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search product name or code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 border-slate-200 bg-slate-50 pl-10 focus:bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort</span>
          <Select
            value={listParams.sortBy ?? 'Id'}
            onValueChange={(sortBy) =>
              setListParams((p) => ({ ...p, sortBy, pageNumber: 1 }))
            }
          >
            <SelectTrigger className="h-10 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={listParams.sortDescending ? 'desc' : 'asc'}
            onValueChange={(v) =>
              setListParams((p) => ({
                ...p,
                sortDescending: v === 'desc',
                pageNumber: 1,
              }))
            }
          >
            <SelectTrigger className="h-10 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) =>
              setListParams((p) => ({
                ...p,
                pageSize: Number(v),
                pageNumber: 1,
              }))
            }
          >
            <SelectTrigger className="h-10 w-[88px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">Loading inventory…</div>
      ) : inventoryItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No inventory rows</h3>
          <p className="text-muted-foreground">
            Try another search, or receive stock via purchase orders / batches.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={inventoryItems}
              onRowClick={(row) => navigate(`/inventory/stock-ledger/${row.productId}`)}
              onEdit={canUpdate ? handleAdjustment : undefined}
              itemsPerPage={Math.max(inventoryItems.length, 1)}
              emptyMessage="No inventory items"
              showSearch={false}
              showToolbar={false}
              showColumnVisibility={false}
              preserveServerOrder
              hidePaginationFooter
            />
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
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
                onClick={() =>
                  setListParams((p) => ({
                    ...p,
                    pageNumber: 1,
                  }))
                }
                aria-label="First page"
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
                  setListParams((p) => ({
                    ...p,
                    pageNumber: Math.max(1, (p.pageNumber ?? 1) - 1),
                  }))
                }
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center text-sm font-medium tabular-nums">
                Page {pageNumber} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={!hasNext}
                onClick={() =>
                  setListParams((p) => ({
                    ...p,
                    pageNumber: (p.pageNumber ?? 1) + 1,
                  }))
                }
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={!hasNext}
                onClick={() =>
                  setListParams((p) => ({
                    ...p,
                    pageNumber: totalPages,
                  }))
                }
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory adjustment</DialogTitle>
            <DialogDescription>
              Adjust stock for {selectedItem?.productName ?? 'product'}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <InventoryAdjustmentForm inventoryItem={selectedItem} onClose={handleClose} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({
  label,
  description,
  value,
  icon,
  valueClassName,
  tooltip,
}: {
  label: string;
  description?: string;
  value: number;
  icon: ReactNode;
  valueClassName?: string;
  tooltip?: string;
}) {
  return (
    <Card className="group relative overflow-hidden p-4 transition-all hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-primary opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            {tooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 shrink-0 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
          {description ? (
            <p className="text-xs leading-snug text-muted-foreground">{description}</p>
          ) : null}
          <p className={`text-2xl font-bold tracking-tight ${valueClassName ?? ''}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
