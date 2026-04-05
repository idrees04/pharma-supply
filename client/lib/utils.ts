import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
