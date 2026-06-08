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
import { useGetHospitals } from '@/hooks/useHospitals';

function fmtDate(value: string) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export default function HospitalLedgerReport() {
  const [searchParams] = useSearchParams();
  const initialHospital = searchParams.get('hospitalId') ?? '';
  const [hospitalId, setHospitalId] = useState(initialHospital);
  const [view, setView] = useState<'payment' | 'product'>('payment');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: hospitalsData } = useGetHospitals({ pageNumber: 1, pageSize: 500 });
  const hospitals = hospitalsData?.data?.items ?? [];
  const hid = hospitalId ? Number(hospitalId) : 0;

  const params = useMemo(
    () => ({ dateFrom, dateTo, view }),
    [dateFrom, dateTo, view],
  );

  const { data, isPending, refetch, isFetching } = useQuery({
    queryKey: ['hospital-ledger', hid, params],
    queryFn: () => analyticsReportService.getHospitalLedger(hid, params),
    enabled: hid > 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hospital ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Payment-wise or product-wise customer ledger.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Hospital</Label>
            <Select value={hospitalId} onValueChange={setHospitalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={String(h.id)}>
                    {h.hospitalName}
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
        <Button onClick={() => refetch()} disabled={!hid || isFetching} className="gap-2">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </Card>

      {!hid ? (
        <Card className="p-8 text-center text-muted-foreground">Select a hospital to view the ledger.</Card>
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
        <Link to="/reports?module=finance&report=hospital-ar">Back to reports</Link>
      </Button>
    </div>
  );
}
