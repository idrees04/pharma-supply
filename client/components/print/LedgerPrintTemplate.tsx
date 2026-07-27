import React from 'react';
import { PrintDocumentHeader } from '@/components/print/PrintDocumentHeader';
import { PrintSignatureBlock } from '@/components/print/PrintSignatureBlock';
import { cn } from '@/lib/utils';

export interface LedgerPrintColumn<T> {
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface LedgerPrintMetaItem {
  label: string;
  value: React.ReactNode;
}

interface LedgerPrintTemplateProps<T> {
  /** Document title, e.g. "Vendor Ledger". */
  title: string;
  /** Short subtitle under the title, e.g. a date range. */
  subtitle?: string;
  /** Name of the entity the ledger belongs to, e.g. supplier or hospital name. */
  entityName?: string;
  /** Small label above the entity name, e.g. "Supplier" / "Hospital" / "Product". */
  entityLabel?: string;
  /** Extra key/value facts shown in the meta strip (period, status, etc.). */
  meta?: LedgerPrintMetaItem[];
  columns: LedgerPrintColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => React.Key;
  emptyMessage?: string;
  /** Totals / closing balance rows shown under the table. */
  summary?: LedgerPrintMetaItem[];
  /** Show the standard prepared/authorized/received signature strip. */
  showSignatureBlock?: boolean;
}

function LedgerPrintTemplateInner<T>(
  {
    title,
    subtitle,
    entityName,
    entityLabel,
    meta = [],
    columns,
    rows,
    rowKey,
    emptyMessage = 'No records found for the selected criteria.',
    summary = [],
    showSignatureBlock = true,
  }: LedgerPrintTemplateProps<T>,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      className="w-full bg-white p-5 text-slate-900"
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        fontSize: '11px',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      <PrintDocumentHeader
        title={title.toUpperCase()}
        subtitle={subtitle}
        className="mb-3 border-b border-slate-200 pb-3 [&_img]:h-10 [&_img]:max-w-[100px] [&_h1]:text-xl sm:[&_h1]:text-xl [&_.text-sm]:text-xs"
      />

      {(entityName || meta.length > 0) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2">
          {entityName ? (
            <div>
              {entityLabel ? (
                <p className="mb-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {entityLabel}
                </p>
              ) : null}
              <p className="text-[13px] font-bold text-slate-900">{entityName}</p>
            </div>
          ) : null}
          {meta.length > 0 ? (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {meta.map((item) => (
                <div key={item.label} className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  <p className="text-[11px] font-semibold tabular-nums text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="border-b-2 border-slate-800">
            {columns.map((col) => (
              <th
                key={col.header}
                className={cn(
                  'py-1.5 px-1.5 text-[9px] font-black uppercase tracking-wide text-slate-600',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  !col.align && 'text-left',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={rowKey(row, idx)} className="border-b border-slate-100">
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={cn(
                      'py-1 px-1.5 align-top text-slate-700',
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {summary.length > 0 ? (
        <div className="mt-3 flex justify-end">
          <div className="w-64 space-y-1 rounded border border-slate-200 bg-slate-50 px-3 py-2">
            {summary.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 text-[10px]">
                <span className="font-semibold uppercase tracking-wide text-slate-500">{item.label}</span>
                <span className="font-black tabular-nums text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-[8px] text-slate-400">
        Generated on {new Date().toLocaleString()} — this is a system-generated report.
      </p>

      {showSignatureBlock ? <PrintSignatureBlock className="mt-8" /> : null}
    </div>
  );
}

export const LedgerPrintTemplate = React.forwardRef(LedgerPrintTemplateInner) as <T>(
  props: LedgerPrintTemplateProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;
