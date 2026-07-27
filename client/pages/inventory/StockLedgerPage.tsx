import { useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Loader2, Package2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCard } from '@/components/common/TableCard';
import { DataTable, type Column } from '@/components/common/DataTable';
import { LedgerPrintTemplate, type LedgerPrintColumn } from '@/components/print/LedgerPrintTemplate';
import { PrintActionsToolbar } from '@/components/print/PrintActionsToolbar';
import { useInventoryStockLedger } from '@/api/services/inventory';
import { formatCurrency, cn } from '@/lib/utils';
import { BatchStatus, InventoryMovementType, type InventoryStockMovementDto, type ProductBatchDto } from '@/types/api/inventory';

function batchStatusLabel(status: BatchStatus): string {
  switch (status) {
    case BatchStatus.Active:
      return 'Active';
    case BatchStatus.Expired:
      return 'Expired';
    case BatchStatus.Dispatched:
      return 'Dispatched';
    case BatchStatus.Returned:
      return 'Returned';
    case BatchStatus.Damaged:
      return 'Damaged';
    default:
      return `Status ${status}`;
  }
}

function movementTypeLabel(type: InventoryMovementType): string {
  return type === InventoryMovementType.Receipt
    ? 'Receipt'
    : type === InventoryMovementType.Dispatch
      ? 'Dispatch'
      : 'Adjustment';
}

type MovementRow = InventoryStockMovementDto & { id: number };
type BatchRow = ProductBatchDto & { id: number };

export default function StockLedgerPage() {
  const { productId } = useParams<{ productId: string }>();
  const movementsPrintRef = useRef<HTMLDivElement>(null);
  const batchesPrintRef = useRef<HTMLDivElement>(null);

  const pid = useMemo(() => {
    const n = parseInt(productId ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [productId]);

  const { data: ledgerRes, isPending, error } = useInventoryStockLedger(pid > 0 ? pid : null);
  const ledger = ledgerRes;
  const stock = ledger?.stock;
  const batches: BatchRow[] = useMemo(
    () => (ledger?.batches ?? []).map((b) => ({ ...b, id: b.id })),
    [ledger],
  );
  const movements: MovementRow[] = useMemo(
    () => (ledger?.movements ?? []).map((m, idx) => ({ ...m, id: idx })),
    [ledger],
  );

  const movementColumns: Column<MovementRow>[] = [
    {
      header: 'Date',
      accessor: (m) => (m.movementDate ? new Date(m.movementDate).toLocaleString() : '—'),
      id: 'movementDate',
    },
    {
      header: 'Type',
      accessor: (m) => <Badge variant="outline">{movementTypeLabel(m.type)}</Badge>,
      id: 'type',
    },
    {
      header: 'In',
      accessor: (m) => (
        <div className="text-right tabular-nums text-emerald-700 font-semibold">{m.quantityIn || 0}</div>
      ),
      id: 'quantityIn',
      className: 'justify-end',
    },
    {
      header: 'Out',
      accessor: (m) => (
        <div className="text-right tabular-nums text-rose-700 font-semibold">{m.quantityOut || 0}</div>
      ),
      id: 'quantityOut',
      className: 'justify-end',
    },
    {
      header: 'Batch',
      accessor: (m) => (
        <span className="font-mono text-xs text-muted-foreground">
          {m.batchNumber ?? (m.productBatchId ? `#${m.productBatchId}` : '—')}
        </span>
      ),
      id: 'batchNumber',
    },
    {
      header: 'PO',
      accessor: (m) => (
        <div className="text-right font-mono text-xs text-muted-foreground">{m.purchaseOrderId ?? '—'}</div>
      ),
      id: 'purchaseOrderId',
      className: 'justify-end',
      mobileHidden: true,
    },
    {
      header: 'DC',
      accessor: (m) => (
        <div className="text-right font-mono text-xs text-muted-foreground">
          {m.deliveryChallanId ? `#${m.deliveryChallanId}` : '—'}
        </div>
      ),
      id: 'deliveryChallanId',
      className: 'justify-end',
      mobileHidden: true,
    },
    {
      header: 'Note',
      accessor: (m) => m.notes ?? '—',
      id: 'notes',
      mobileHidden: true,
    },
  ];

  const batchColumns: Column<BatchRow>[] = [
    { header: 'Batch ID', accessor: (b) => <span className="font-mono text-xs text-muted-foreground">{b.id}</span>, id: 'id' },
    { header: 'Batch #', accessor: (b) => <span className="font-medium">{b.batchNumber ?? '—'}</span>, id: 'batchNumber' },
    {
      header: 'Received',
      accessor: (b) => <div className="text-right tabular-nums">{b.receivedQuantity}</div>,
      id: 'receivedQuantity',
      className: 'justify-end',
    },
    {
      header: 'Current',
      accessor: (b) => <div className="text-right tabular-nums font-semibold">{b.currentQuantity}</div>,
      id: 'currentQuantity',
      className: 'justify-end',
    },
    {
      header: 'Dispatched',
      accessor: (b) => <div className="text-right tabular-nums">{b.dispatchedQuantity}</div>,
      id: 'dispatchedQuantity',
      className: 'justify-end',
    },
    {
      header: 'Received date',
      accessor: (b) => (b.receivedDate ? new Date(b.receivedDate).toLocaleDateString() : '—'),
      id: 'receivedDate',
    },
    {
      header: 'Expiry',
      accessor: (b) => (b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'),
      id: 'expiryDate',
    },
    {
      header: 'Purchase rate',
      accessor: (b) => <div className="text-right tabular-nums">{formatCurrency(Number(b.purchaseRate))}</div>,
      id: 'purchaseRate',
      className: 'justify-end',
    },
    {
      header: 'Status',
      accessor: (b) => (
        <Badge
          variant="outline"
          className={cn(
            b.status === BatchStatus.Expired && 'border-red-200 text-red-700 bg-red-50/40',
            b.status === BatchStatus.Active && 'border-emerald-200 text-emerald-700 bg-emerald-50/40',
          )}
        >
          {batchStatusLabel(b.status)}
        </Badge>
      ),
      id: 'status',
    },
  ];

  const movementPrintColumns: LedgerPrintColumn<MovementRow>[] = [
    { header: 'Date', render: (m) => (m.movementDate ? new Date(m.movementDate).toLocaleString() : '—') },
    { header: 'Type', render: (m) => movementTypeLabel(m.type) },
    { header: 'In', align: 'right', render: (m) => String(m.quantityIn || 0) },
    { header: 'Out', align: 'right', render: (m) => String(m.quantityOut || 0) },
    { header: 'Batch', render: (m) => m.batchNumber ?? (m.productBatchId ? `#${m.productBatchId}` : '—') },
    { header: 'PO', align: 'right', render: (m) => String(m.purchaseOrderId ?? '—') },
    { header: 'DC', align: 'right', render: (m) => (m.deliveryChallanId ? `#${m.deliveryChallanId}` : '—') },
    { header: 'Note', render: (m) => m.notes ?? '—' },
  ];

  const batchPrintColumns: LedgerPrintColumn<BatchRow>[] = [
    { header: 'Batch #', render: (b) => b.batchNumber ?? `#${b.id}` },
    { header: 'Received', align: 'right', render: (b) => String(b.receivedQuantity) },
    { header: 'Current', align: 'right', render: (b) => String(b.currentQuantity) },
    { header: 'Dispatched', align: 'right', render: (b) => String(b.dispatchedQuantity) },
    { header: 'Received date', render: (b) => (b.receivedDate ? new Date(b.receivedDate).toLocaleDateString() : '—') },
    { header: 'Expiry', render: (b) => (b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—') },
    { header: 'Rate', align: 'right', render: (b) => formatCurrency(Number(b.purchaseRate)) },
    { header: 'Status', render: (b) => batchStatusLabel(b.status) },
  ];

  if (!pid) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/inventory">
            <ArrowLeft className="h-4 w-4" />
            Back to stock levels
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Invalid product</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The product ID in the URL is not valid.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm">Loading stock ledger…</p>
      </div>
    );
  }

  if (error || !ledger || !stock) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/inventory">
            <ArrowLeft className="h-4 w-4" />
            Back to stock levels
          </Link>
        </Button>
        <Card className="border-red-200 bg-red-50/80">
          <CardHeader>
            <CardTitle className="text-red-900">Unable to load stock ledger</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800">
            {error?.userMessage ?? 'Stock ledger not found.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const productLabel = stock.productName ?? `Product #${stock.productId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/inventory">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Stock ledger
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {productLabel}
              {stock.productCode ? ` — ${stock.productCode}` : null}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit">
          Product ID: <span className="ml-1 font-mono">{stock.productId}</span>
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums text-emerald-700">
            {stock.availableQuantity}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reserved</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums text-amber-700">
            {stock.reservedQuantity}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums">
            {stock.totalQuantity}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Stock value (PKR)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums">
            {formatCurrency(Number(stock.totalValue))}
          </CardContent>
        </Card>
      </div>

      <TableCard
        icon={<Package2 />}
        title="Movement history"
        count={movements.length}
        countLabel={(c) => `${c} movement(s)`}
        actions={
          <PrintActionsToolbar
            targetRef={movementsPrintRef}
            fileName={`stock-movements-${productLabel}`}
            disabled={movements.length === 0}
            mountId="stock-movements-print-mount"
          />
        }
      >
        <DataTable
          columns={movementColumns}
          data={movements}
          defaultSort={{ id: 'movementDate', desc: false }}
          itemsPerPage={15}
          emptyMessage="No movements found for this product."
        />
      </TableCard>

      <TableCard
        icon={<ClipboardList />}
        title="Batch ledger"
        count={batches.length}
        countLabel={(c) => `${c} batch(es)`}
        actions={
          <PrintActionsToolbar
            targetRef={batchesPrintRef}
            fileName={`stock-batches-${productLabel}`}
            disabled={batches.length === 0}
            mountId="stock-batches-print-mount"
          />
        }
      >
        <DataTable
          columns={batchColumns}
          data={batches}
          defaultSort={{ id: 'receivedDate', desc: false }}
          itemsPerPage={15}
          emptyMessage="No batches found for this product."
        />
      </TableCard>

      <div className="fixed left-[-9999px] top-0" aria-hidden="true">
        <LedgerPrintTemplate
          ref={movementsPrintRef}
          title="Stock Movement History"
          entityLabel="Product"
          entityName={productLabel}
          meta={[{ label: 'Product code', value: stock.productCode ?? '—' }]}
          columns={movementPrintColumns}
          rows={movements}
          rowKey={(m) => m.id}
        />
      </div>
      <div className="fixed left-[-9999px] top-0" aria-hidden="true">
        <LedgerPrintTemplate
          ref={batchesPrintRef}
          title="Batch Ledger"
          entityLabel="Product"
          entityName={productLabel}
          meta={[{ label: 'Product code', value: stock.productCode ?? '—' }]}
          columns={batchPrintColumns}
          rows={batches}
          rowKey={(b) => b.id}
        />
      </div>
    </div>
  );
}
