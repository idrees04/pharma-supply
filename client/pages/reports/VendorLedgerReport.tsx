import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { analyticsReportService } from '@/api/services/analyticsReports';
import { useSupplierList } from '@/api/services/suppliers';

function fmtDate(value: string) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export default function VendorLedgerReport() {
  const [searchParams] = useSearchParams();
  const initialSupplier = searchParams.get('supplierId') ?? '';
  const [supplierId, setSupplierId] = useState(initialSupplier);
  const [view, setView] = useState<'payment' | 'product'>('payment');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: suppliersData } = useSupplierList({ pageNumber: 1, pageSize: 500 });
  const suppliers = suppliersData?.items ?? [];
  const sid = supplierId ? Number(supplierId) : 0;

  const params = useMemo(
    () => ({ dateFrom, dateTo, view }),
    [dateFrom, dateTo, view],
  );

  const { data, isPending, refetch, isFetching } = useQuery({
    queryKey: ['vendor-ledger', sid, params],
    queryFn: () => analyticsReportService.getVendorLedger(sid, params),
    enabled: sid > 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendor ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Payment-wise or product-wise ledger for a supplier.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.supplierName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <input type="date" className="flex h-10 w-full rounded-md border px-3 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <input type="date" className="flex h-10 w-full rounded-md border px-3 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>View</Label>
            <Tabs value={view} onValueChange={(v) => setView(v as 'payment' | 'product')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="product">Product</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <Button onClick={() => refetch()} disabled={!sid || isFetching} className="gap-2">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </Card>

      {!sid ? (
        <Card className="p-8 text-center text-muted-foreground">Select a supplier to view the ledger.</Card>
      ) : isPending ? (
        <Card className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </Card>
      ) : data ? (
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{data.entityName}</p>
            <p className="text-sm">
              Closing balance:{' '}
              <span className="font-bold tabular-nums">{formatCurrency(data.closingBalance)}</span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  {view === 'product' ? <TableHead>Product</TableHead> : null}
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row, idx) => (
                  <TableRow key={`${row.referenceNumber}-${idx}`}>
                    <TableCell>{fmtDate(row.entryDate)}</TableCell>
                    <TableCell>{row.entryType}</TableCell>
                    <TableCell className="font-mono text-xs">{row.referenceNumber}</TableCell>
                    {view === 'product' ? (
                      <TableCell>{row.productName ?? '—'}</TableCell>
                    ) : null}
                    <TableCell className="text-right tabular-nums">{formatCurrency(row.debit)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(row.credit)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrency(row.runningBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      <Button variant="link" asChild className="px-0">
        <Link to="/reports?module=purchase&report=payables">Back to reports</Link>
      </Button>
    </div>
  );
}
