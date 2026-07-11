import { formatCurrency } from '@/lib/utils';
import { PrintSignatureBlock } from '@/components/print/PrintSignatureBlock';
import { PrintDocumentHeader } from '@/components/print/PrintDocumentHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface VoucherLinePreview {
  documentNumber?: string | null;
  date?: string | null;
  categoryName?: string | null;
  accountName?: string | null;
  payeeOrSource?: string | null;
  amount: number;
  description?: string | null;
  referenceNumber?: string | null;
}

export interface VoucherPreviewData {
  title: string;
  number?: string | null;
  date: string;
  categoryName?: string | null;
  accountName?: string | null;
  accountBalance?: number | null;
  payeeOrSource?: string | null;
  amount: number;
  totalAmount?: number;
  amountInWords?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  lines?: VoucherLinePreview[];
}

interface VoucherPreviewPanelProps {
  data: VoucherPreviewData;
}

export function VoucherPreviewPanel({ data }: VoucherPreviewPanelProps) {
  const displayAmount = data.totalAmount ?? data.amount;
  const hasLines = (data.lines?.length ?? 0) > 1;

  return (
    <div
      className="rounded-lg border bg-white p-6 text-sm shadow-sm"
      style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}
    >
      <PrintDocumentHeader
        title={data.title}
        subtitle={data.number ?? undefined}
        className="mb-4 border-b-0 pb-4"
      />
      <dl className="grid gap-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="font-medium">{data.date ? new Date(data.date).toLocaleDateString() : '—'}</dd>
        </div>
        {!hasLines && (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium text-right">{data.categoryName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Account</dt>
              <dd className="font-medium text-right">{data.accountName ?? '—'}</dd>
            </div>
          </>
        )}
        {hasLines && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Account(s)</dt>
            <dd className="font-medium text-right">{data.accountName ?? '—'}</dd>
          </div>
        )}
        {data.accountBalance != null ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Account balance</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(data.accountBalance)}</dd>
          </div>
        ) : null}
        {data.payeeOrSource && !hasLines ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payee / source</dt>
            <dd className="font-medium text-right">{data.payeeOrSource}</dd>
          </div>
        ) : null}
        {!hasLines && (
          <>
            <div className="flex justify-between gap-4 border-t pt-2">
              <dt className="font-semibold">Amount</dt>
              <dd className="text-base font-black tabular-nums text-primary">{formatCurrency(data.amount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap">{data.description?.trim() ? data.description : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Reference</dt>
              <dd>{data.referenceNumber?.trim() ? data.referenceNumber : '—'}</dd>
            </div>
          </>
        )}
        {data.notes?.trim() ? (
          <div>
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="mt-1 whitespace-pre-wrap">{data.notes}</dd>
          </div>
        ) : null}
      </dl>

      {hasLines && data.lines ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Line items</p>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[10px] font-black uppercase">Document</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Category</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Account</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lines.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{line.documentNumber ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {line.date ? new Date(line.date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-xs">{line.categoryName ?? '—'}</TableCell>
                  <TableCell className="text-xs">{line.accountName ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-xs">
                    {formatCurrency(line.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between border-t pt-3 text-sm font-bold">
            <span>Total</span>
            <span className="tabular-nums text-primary">{formatCurrency(displayAmount)}</span>
          </div>
        </div>
      ) : null}

      {data.amountInWords ? (
        <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs italic text-muted-foreground">
          {data.amountInWords}
        </div>
      ) : null}

      <PrintSignatureBlock className="mt-6" />
    </div>
  );
}
