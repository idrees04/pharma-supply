import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  ClipboardList,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import { getPurchaseOrderStatusClassName, getPurchaseOrderStatusLabel } from '@/lib/purchaseOrderStatusDisplay';
import { useSupplierPurchaseOrders } from '@/api/services/suppliers';

const PAGE_SIZE = 10;

interface SupplierPurchaseOrdersSectionProps {
  supplierId: number;
}

export function SupplierPurchaseOrdersSection({ supplierId }: SupplierPurchaseOrdersSectionProps) {
  const [page, setPage] = useState(1);
  const { data, isPending, error } = useSupplierPurchaseOrders(supplierId, {
    pageNumber: page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const rows = data?.items ?? [];

  return (
    <Card id="supplier-purchase-orders" className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50 scroll-mt-24">
      <CardHeader className="border-b bg-slate-50/80 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Purchase orders</CardTitle>
              <CardDescription>
                From <code className="rounded bg-muted px-1 text-xs">GET /api/Suppliers/&#123;id&#125;/purchase-orders</code>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-destructive">Could not load purchase orders.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Order date</TableHead>
                    <TableHead className="hidden md:table-cell">Expected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total (PKR)</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Paid (PKR)</TableHead>
                    <TableHead className="text-right">Balance (PKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground">
                        No purchase orders for this supplier.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono text-xs font-semibold">{po.purchaseOrderNumber}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {po.expectedDeliveryDate
                            ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs font-semibold', getPurchaseOrderStatusClassName(po.status))}>
                            {getPurchaseOrderStatusLabel(po.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(po.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums hidden sm:table-cell">
                          {formatCurrency(po.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(po.balanceAmount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {data && data.totalCount > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.totalCount)} of {data.totalCount}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!data.hasPrevious}
                    onClick={() => setPage(1)}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!data.hasPrevious}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[72px] text-center text-xs font-medium tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!data.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!data.hasNext}
                    onClick={() => setPage(totalPages)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
