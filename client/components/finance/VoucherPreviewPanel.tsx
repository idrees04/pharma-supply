import { formatCurrency } from '@/lib/utils';
import { PrintSignatureBlock } from '@/components/print/PrintSignatureBlock';

export interface VoucherPreviewData {
  title: string;
  number?: string | null;
  date: string;
  categoryName?: string | null;
  accountName?: string | null;
  accountBalance?: number | null;
  payeeOrSource?: string | null;
  amount: number;
  description?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

interface VoucherPreviewPanelProps {
  data: VoucherPreviewData;
}

export function VoucherPreviewPanel({ data }: VoucherPreviewPanelProps) {
  return (
    <div
      className="rounded-lg border bg-white p-6 text-sm shadow-sm"
      style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}
    >
      <div className="mb-4 border-b pb-3">
        <h3 className="text-lg font-black uppercase tracking-wide text-primary">{data.title}</h3>
        {data.number ? <p className="font-mono text-xs text-muted-foreground">{data.number}</p> : null}
      </div>
      <dl className="grid gap-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="font-medium">{data.date ? new Date(data.date).toLocaleDateString() : '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Category</dt>
          <dd className="font-medium text-right">{data.categoryName ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Account</dt>
          <dd className="font-medium text-right">{data.accountName ?? '—'}</dd>
        </div>
        {data.accountBalance != null ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Account balance</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(data.accountBalance)}</dd>
          </div>
        ) : null}
        {data.payeeOrSource ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payee / source</dt>
            <dd className="font-medium text-right">{data.payeeOrSource}</dd>
          </div>
        ) : null}
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
        <div>
          <dt className="text-muted-foreground">Notes</dt>
          <dd className="mt-1 whitespace-pre-wrap">{data.notes?.trim() ? data.notes : '—'}</dd>
        </div>
      </dl>
      <PrintSignatureBlock className="mt-6" />
    </div>
  );
}
