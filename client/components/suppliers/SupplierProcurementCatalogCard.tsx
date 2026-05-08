import { Loader2, Package } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useSupplierProducts } from '@/api/services/suppliers';

interface SupplierProcurementCatalogCardProps {
  supplierId: number;
}

/** Snapshot from GET /api/Suppliers/{id}/products (includes last purchase metadata). */
export function SupplierProcurementCatalogCard({ supplierId }: SupplierProcurementCatalogCardProps) {
  const { data: rows = [], isPending, error } = useSupplierProducts(supplierId);

  return (
    <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
      <CardHeader className="border-b bg-slate-50/80 py-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-indigo-600" />
          <div>
            <CardTitle className="text-lg">Procurement catalogue</CardTitle>
            <CardDescription>
              Contract rates and last purchase —{' '}
              <code className="rounded bg-muted px-1 text-xs">GET /api/Suppliers/&#123;id&#125;/products</code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-destructive">Could not load procurement catalogue.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right hidden md:table-cell">MOQ</TableHead>
                  <TableHead className="hidden lg:table-cell">Lead (d)</TableHead>
                  <TableHead className="hidden md:table-cell">Last purchase</TableHead>
                  <TableHead>Preferred</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      No products on file for this supplier via this endpoint. Use Linked Products to manage links.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.productId}>
                      <TableCell>
                        <span className="font-medium text-slate-900">{r.productName}</span>
                        <div className="text-[10px] text-muted-foreground sm:hidden">{r.productCode}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{r.productCode}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(r.purchaseRate)}</TableCell>
                      <TableCell className="text-right hidden md:table-cell">{r.minOrderQuantity}</TableCell>
                      <TableCell className="hidden lg:table-cell">{r.leadTimeDays}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {r.lastPurchaseDate ? (
                          <span>
                            {new Date(r.lastPurchaseDate).toLocaleDateString()}
                            {r.lastPurchaseRate != null ? (
                              <span className="block text-xs">{formatCurrency(r.lastPurchaseRate)}</span>
                            ) : null}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {r.isPreferred ? (
                          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">Preferred</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
