import { describe, expect, it } from 'vitest';
import {
  addDaysInputValue,
  formatAppDate,
  parseApiDate,
  toDateInputValue,
  toDateTimeLocalValue,
} from './dates';

describe('parseApiDate', () => {
  it('treats API datetimes without Z as UTC', () => {
    const date = parseApiDate('2026-08-15T07:00:00');
    expect(date?.toISOString()).toBe('2026-08-15T07:00:00.000Z');
  });

  it('keeps explicit UTC timestamps', () => {
    const date = parseApiDate('2026-08-15T07:00:00Z');
    expect(date?.toISOString()).toBe('2026-08-15T07:00:00.000Z');
  });
});

describe('Pakistan calendar helpers', () => {
  it('uses Karachi date instead of UTC date for late-evening UTC instants', () => {
    // 20:00 UTC = 01:00 next day in Pakistan
    expect(toDateInputValue(new Date('2026-08-15T20:00:00Z'))).toBe('2026-08-16');
  });

  it('formats datetime in Pakistan timezone', () => {
    expect(formatAppDate('2026-08-15T00:00:00Z')).toContain('15');
    expect(toDateTimeLocalValue('2026-08-15T07:00:00')).toBe('2026-08-15T12:00');
  });

  it('adds calendar days without UTC rolling the date', () => {
    expect(addDaysInputValue(1, new Date('2026-08-15T20:00:00Z'))).toBe('2026-08-17');
  });
});
