import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Loader2, RefreshCw } from 'lucide-react';
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
import { TableCard } from '@/components/common/TableCard';
import { DataTable, type Column } from '@/components/common/DataTable';
import { LedgerPrintTemplate, type LedgerPrintColumn } from '@/components/print/LedgerPrintTemplate';
import { PrintActionsToolbar } from '@/components/print/PrintActionsToolbar';
import { formatCurrency } from '@/lib/utils';
import { analyticsReportService } from '@/api/services/analyticsReports';
import { useSupplierList } from '@/api/services/suppliers';
import type { LedgerEntryRowDto } from '@/types/api/analyticsReports';

function fmtDate(value: string) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

type LedgerRow = LedgerEntryRowDto & { id: number };

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
  const printRef = useRef<HTMLDivElement>(null);

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

  const rows: LedgerRow[] = useMemo(
    () => (data?.rows ?? []).map((row, idx) => ({ ...row, id: idx })),
    [data],
  );

  const columns: Column<LedgerRow>[] = useMemo(() => {
    const cols: Column<LedgerRow>[] = [
      { header: 'Date', accessor: (r) => fmtDate(r.entryDate), id: 'date' },
      { header: 'Type', accessor: 'entryType', id: 'entryType' },
      {
        header: 'Reference',
        accessor: (r) => <span className="font-mono text-xs">{r.referenceNumber}</span>,
        id: 'referenceNumber',
      },
    ];
    if (view === 'product') {
      cols.push({ header: 'Product', accessor: (r) => r.productName ?? '—', id: 'productName' });
    }
    cols.push(
      {
        header: 'Debit',
        accessor: (r) => <div className="text-right tabular-nums">{formatCurrency(r.debit)}</div>,
        id: 'debit',
        className: 'justify-end',
      },
      {
        header: 'Credit',
        accessor: (r) => <div className="text-right tabular-nums">{formatCurrency(r.credit)}</div>,
        id: 'credit',
        className: 'justify-end',
      },
      {
        header: 'Balance',
        accessor: (r) => (
          <div className="text-right tabular-nums font-semibold">{formatCurrency(r.runningBalance)}</div>
        ),
        id: 'runningBalance',
        className: 'justify-end',
      },
      {
        header: 'Notes',
        accessor: (r) => r.notes ?? '—',
        id: 'notes',
        mobileHidden: true,
      },
    );
    return cols;
  }, [view]);

  const printColumns: LedgerPrintColumn<LedgerRow>[] = useMemo(() => {
    const cols: LedgerPrintColumn<LedgerRow>[] = [
      { header: 'Date', render: (r) => fmtDate(r.entryDate) },
      { header: 'Type', render: (r) => r.entryType },
      { header: 'Reference', render: (r) => r.referenceNumber },
    ];
    if (view === 'product') {
      cols.push({ header: 'Product', render: (r) => r.productName ?? '—' });
    }
    cols.push(
      { header: 'Debit', align: 'right', render: (r) => formatCurrency(r.debit) },
      { header: 'Credit', align: 'right', render: (r) => formatCurrency(r.credit) },
      { header: 'Balance', align: 'right', render: (r) => formatCurrency(r.runningBalance) },
      { header: 'Notes', render: (r) => r.notes ?? '—' },
    );
    return cols;
  }, [view]);

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
        <TableCard
          icon={<BookOpen />}
          title={data.entityName}
          description={`Closing balance: ${formatCurrency(data.closingBalance)}`}
          count={rows.length}
          countLabel={(c) => `${c} entr${c === 1 ? 'y' : 'ies'}`}
          actions={
            <PrintActionsToolbar
              targetRef={printRef}
              fileName={`vendor-ledger-${data.entityName}`}
              disabled={rows.length === 0}
              mountId="vendor-ledger-print-mount"
            />
          }
        >
          <DataTable
            columns={columns}
            data={rows}
            defaultSort={{ id: 'date', desc: false }}
            itemsPerPage={15}
            emptyMessage="No ledger entries for the selected period."
          />
        </TableCard>
      ) : null}

      {/* Off-screen printable / downloadable version, kept in sync with the on-screen table. */}
      {data ? (
        <div className="fixed left-[-9999px] top-0" aria-hidden="true">
          <LedgerPrintTemplate
            ref={printRef}
            title="Vendor Ledger"
            subtitle={`${fmtDate(dateFrom)} – ${fmtDate(dateTo)} · ${view === 'product' ? 'Product-wise' : 'Payment-wise'}`}
            entityLabel="Supplier"
            entityName={data.entityName}
            meta={[
              { label: 'Period', value: `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}` },
              { label: 'View', value: view === 'product' ? 'Product-wise' : 'Payment-wise' },
            ]}
            columns={printColumns}
            rows={rows}
            rowKey={(r) => r.id}
            summary={[{ label: 'Closing balance', value: formatCurrency(data.closingBalance) }]}
          />
        </div>
      ) : null}

      <Button variant="link" asChild className="px-0">
        <Link to="/reports?module=purchase&report=payables">Back to reports</Link>
      </Button>
    </div>
  );
}
