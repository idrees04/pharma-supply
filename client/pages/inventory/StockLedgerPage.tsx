import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Package2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventoryStockLedger } from '@/api/services/inventory';
import { formatCurrency, cn } from '@/lib/utils';
import { BatchStatus, InventoryMovementType, type InventoryStockMovementDto } from '@/types/api/inventory';

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

export default function StockLedgerPage() {
  const { productId } = useParams<{ productId: string }>();

  const pid = useMemo(() => {
    const n = parseInt(productId ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [productId]);

  const { data: ledgerRes, isPending, error } = useInventoryStockLedger(pid > 0 ? pid : null);
  const ledger = ledgerRes;
  const stock = ledger?.stock;
  const batches = ledger?.batches ?? [];
  const movements = ledger?.movements ?? [];

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
              {stock.productName ?? `Product #${stock.productId}`}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Movement history</CardTitle>
          </div>
          <Badge variant="secondary">{movements.length} movement(s)</Badge>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              No movements found for this product.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">In</TableHead>
                    <TableHead className="text-right">Out</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">PO</TableHead>
                    <TableHead className="text-right">DC</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m, idx) => (
                    <TableRow key={`${m.type}-${m.movementDate}-${idx}`}>
                      <TableCell className="text-sm">
                        {m.movementDate ? new Date(m.movementDate).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {m.type === InventoryMovementType.Receipt
                            ? 'Receipt'
                            : m.type === InventoryMovementType.Dispatch
                              ? 'Dispatch'
                              : 'Adjustment'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-700 font-semibold">
                        {m.quantityIn || 0}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-rose-700 font-semibold">
                        {m.quantityOut || 0}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {m.batchNumber ?? (m.productBatchId ? `#${m.productBatchId}` : '—')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {m.purchaseOrderId ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {m.deliveryChallanId ? `#${m.deliveryChallanId}` : '—'}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-xs text-muted-foreground">
                        {m.notes ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Batch ledger</CardTitle>
          </div>
          <Badge variant="secondary">{batches.length} batch(es)</Badge>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              No batches found for this product.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Batch ID</TableHead>
                    <TableHead>Batch #</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Dispatched</TableHead>
                    <TableHead>Received date</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Purchase rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{b.id}</TableCell>
                      <TableCell className="font-medium">{b.batchNumber ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.receivedQuantity}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{b.currentQuantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.dispatchedQuantity}</TableCell>
                      <TableCell className="text-sm">
                        {b.receivedDate ? new Date(b.receivedDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(Number(b.purchaseRate))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            b.status === BatchStatus.Expired && 'border-red-200 text-red-700 bg-red-50/40',
                            b.status === BatchStatus.Active && 'border-emerald-200 text-emerald-700 bg-emerald-50/40',
                          )}
                        >
                          {batchStatusLabel(b.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

