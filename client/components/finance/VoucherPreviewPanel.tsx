import { formatCurrency } from '@/lib/utils';
import { PrintSignatureBlock } from '@/components/print/PrintSignatureBlock';
import { PrintDocumentHeader } from '@/components/print/PrintDocumentHeader';

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

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Compact amount for dense table cells (PKR shown in header/total). */
function formatAmountCell(amount: number): string {
  return amount.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-px truncate text-[10px] font-semibold leading-tight text-slate-900">{value}</p>
    </div>
  );
}

export function VoucherPreviewPanel({ data }: VoucherPreviewPanelProps) {
  const displayAmount = data.totalAmount ?? data.amount;
  const lines = data.lines ?? [];
  const isMultiLine = lines.length > 1;
  const distinctAccounts = new Set(
    lines.map((l) => l.accountName?.trim()).filter((v): v is string => !!v)
  );
  const showAccountCol = isMultiLine && distinctAccounts.size > 1;
  const showRefCol = isMultiLine && lines.some((l) => l.referenceNumber?.trim());

  return (
    <div
      className="voucher-print-sheet mx-auto w-full max-w-full bg-white text-slate-900 shadow-sm"
      style={{
        boxSizing: 'border-box',
        padding: '6mm 6mm',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        fontSize: '10px',
      }}
    >
      <PrintDocumentHeader
        title={data.title}
        subtitle={data.number ?? undefined}
        className="mb-1.5 border-b border-slate-200 pb-1.5 [&_img]:h-7 [&_img]:max-w-[72px] [&_h1]:text-sm sm:[&_h1]:text-base [&_h1]:leading-tight [&_.text-sm]:text-[10px] [&_.text-xs]:text-[9px] [&_.gap-4]:gap-2 [&_.gap-6]:gap-2 [&_.flex.items-start.justify-between]:gap-2"
      />

      <div className="mb-1.5 grid grid-cols-2 gap-x-3 gap-y-1 border border-slate-200 bg-slate-50 px-2 py-1 sm:grid-cols-4">
        <MetaCell label="Voucher date" value={formatShortDate(data.date)} />
        <MetaCell label="Account(s)" value={data.accountName?.trim() || '—'} />
        {!isMultiLine ? (
          <MetaCell label="Category" value={data.categoryName?.trim() || '—'} />
        ) : (
          <MetaCell label="Lines" value={`${lines.length} expense lines`} />
        )}
        <MetaCell label="Total (PKR)" value={formatCurrency(displayAmount)} />
        {!isMultiLine ? (
          <>
            <MetaCell label="Payee / source" value={data.payeeOrSource?.trim() || '—'} />
            <MetaCell label="Reference" value={data.referenceNumber?.trim() || '—'} />
            {data.accountBalance != null ? (
              <MetaCell label="Account balance" value={formatCurrency(data.accountBalance)} />
            ) : null}
          </>
        ) : data.accountBalance != null ? (
          <MetaCell label="Account balance" value={formatCurrency(data.accountBalance)} />
        ) : null}
      </div>

      {!isMultiLine ? (
        <div className="mb-1.5 border border-slate-200 px-2 py-1">
          <p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Description</p>
          <p className="mt-px whitespace-pre-wrap text-[10px] leading-snug text-slate-800">
            {data.description?.trim() ? data.description : '—'}
          </p>
        </div>
      ) : null}

      {data.notes?.trim() ? (
        <div className="mb-1.5 border border-slate-200 px-2 py-1">
          <p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Notes</p>
          <p className="mt-px whitespace-pre-wrap text-[9px] leading-snug text-slate-700">{data.notes}</p>
        </div>
      ) : null}

      {isMultiLine ? (
        <div className="mb-1.5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                <th className="px-1 py-0.5 text-left text-[7px] font-bold uppercase text-slate-600">#</th>
                <th className="px-1 py-0.5 text-left text-[7px] font-bold uppercase text-slate-600">Doc</th>
                <th className="px-1 py-0.5 text-left text-[7px] font-bold uppercase text-slate-600">Date</th>
                <th className="px-1 py-0.5 text-left text-[7px] font-bold uppercase text-slate-600">Category</th>
                <th className="px-1 py-0.5 text-left text-[7px] font-bold uppercase text-slate-600">Description</th>
                {showAccountCol ? (
                  <th className="px-1 py-0.5 text-left text-[7px] font-bold uppercase text-slate-600">Account</th>
                ) : null}
                {showRefCol ? (
                  <th className="px-1 py-0.5 text-left text-[7px] font-bold uppercase text-slate-600">Ref</th>
                ) : null}
                <th className="px-1 py-0.5 text-right text-[7px] font-bold uppercase text-slate-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="border-b border-slate-100 align-top">
                  <td className="px-1 py-0.5 tabular-nums text-[8px] text-slate-500">{idx + 1}</td>
                  <td className="px-1 py-0.5 whitespace-nowrap font-mono text-[8px] text-slate-800">
                    {line.documentNumber ?? '—'}
                  </td>
                  <td className="px-1 py-0.5 whitespace-nowrap text-[8px]">{formatShortDate(line.date)}</td>
                  <td className="px-1 py-0.5 text-[8px] leading-tight text-slate-800">
                    {line.categoryName?.trim() || '—'}
                  </td>
                  <td className="px-1 py-0.5 text-[8px] leading-snug text-slate-800">
                    <span className="whitespace-pre-wrap break-words">
                      {line.description?.trim() || '—'}
                    </span>
                    {line.payeeOrSource?.trim() ? (
                      <span className="block text-[7px] text-slate-500">Payee: {line.payeeOrSource}</span>
                    ) : null}
                  </td>
                  {showAccountCol ? (
                    <td className="px-1 py-0.5 text-[8px] leading-tight text-slate-700">
                      {line.accountName?.trim() || '—'}
                    </td>
                  ) : null}
                  {showRefCol ? (
                    <td className="px-1 py-0.5 text-[8px] leading-tight text-slate-600">
                      {line.referenceNumber?.trim() || '—'}
                    </td>
                  ) : null}
                  <td className="px-1 py-0.5 text-right text-[8px] font-semibold tabular-nums whitespace-nowrap">
                    {formatAmountCell(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-1 flex items-center justify-between border-t border-slate-300 pt-1">
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-700">Total (PKR)</span>
            <span className="text-[11px] font-black tabular-nums text-primary">
              {formatCurrency(displayAmount)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-1.5 flex items-center justify-between border border-slate-200 bg-primary/5 px-2 py-1">
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-700">Amount</span>
          <span className="text-[12px] font-black tabular-nums text-primary">
            {formatCurrency(data.amount)}
          </span>
        </div>
      )}

      {data.amountInWords ? (
        <p className="mb-1.5 text-[8px] italic leading-snug text-slate-600">
          <span className="font-semibold not-italic text-slate-500">In words: </span>
          {data.amountInWords}
        </p>
      ) : null}

      <PrintSignatureBlock className="mt-2 gap-3 border-t border-slate-200 pt-2 [&_div.mb-2]:mb-0 [&_div.h-12]:h-5 [&_p.mt-1]:mt-0.5" />
    </div>
  );
}
