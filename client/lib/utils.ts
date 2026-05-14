import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats money using PKR as the unit (app-wide standard). */
export function formatCurrency(amount: number | undefined | null, currency = "PKR"): string {
  const value = amount ?? 0;
  return `${currency} ${value.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};


export const formatRelativeDays = (daysOverdue: number): string => {
    if (daysOverdue <= 0) return 'Due today';
    return `${daysOverdue} day(s) overdue`;
};

/** Download an Excel (or any) blob as a file attachment. */
export function downloadExcelBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
