import { formatDistanceToNow } from 'date-fns';

/**
 * App datetimes are stored as UTC (DateTime.UtcNow) but SQL/JSON often omits "Z".
 * JS then treats them as local, so Pakistan (UTC+5) clocks show 5 hours behind.
 * Calendar "today" must not use toISOString() (that is UTC's date).
 */
export const APP_TIME_ZONE = 'Asia/Karachi';
export const APP_LOCALE = 'en-PK';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_TIMEZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

export function parseApiDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  let iso = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
  if (DATE_ONLY.test(iso)) {
    iso = `${iso}T00:00:00Z`;
  } else if (!HAS_TIMEZONE.test(iso)) {
    iso = `${iso}Z`;
  }

  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function karachiParts(date: Date, withTime: boolean) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime
      ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const }
      : {}),
  }).formatToParts(date);
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((p) => p.type === type)?.value ?? '';
}

export function formatAppDate(
  value: string | Date | null | undefined,
  empty = '—',
): string {
  const date = parseApiDate(value);
  if (!date) return empty;
  return date.toLocaleDateString(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAppDateTime(
  value: string | Date | null | undefined,
  empty = '—',
): string {
  const date = parseApiDate(value);
  if (!date) return empty;
  return date.toLocaleString(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** yyyy-MM-dd in Pakistan — for <input type="date"> */
export function toDateInputValue(value?: string | Date | null): string {
  const date = value == null || value === '' ? new Date() : parseApiDate(value);
  if (!date) return '';
  const parts = karachiParts(date, false);
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`;
}

export function todayInputValue(): string {
  return toDateInputValue(new Date());
}

export function addDaysInputValue(days: number, from: Date = new Date()): string {
  const [year, month, day] = toDateInputValue(from).split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const yyyy = String(next.getUTCFullYear());
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** yyyy-MM-ddTHH:mm in Pakistan — for <input type="datetime-local"> */
export function toDateTimeLocalValue(value: string | Date | null | undefined): string {
  const date = parseApiDate(value);
  if (!date) return '';
  const parts = karachiParts(date, true);
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}T${part(parts, 'hour')}:${part(parts, 'minute')}`;
}

export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00+05:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatAppRelative(value: string | Date | null | undefined): string {
  const date = parseApiDate(value);
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}
