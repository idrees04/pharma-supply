import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn, formatNumber } from '@/lib/utils';

const parseQuantity = (raw: string): number => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
};

export interface QuantityInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

export const QuantityInput = React.forwardRef<HTMLInputElement, QuantityInputProps>(
  ({ value, onChange, onBlur, onFocus, disabled, className, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [draft, setDraft] = React.useState('');

    const numericValue = Math.max(0, Math.trunc(Number(value) || 0));
    const display = focused
      ? draft
      : numericValue > 0
        ? formatNumber(numericValue)
        : '';

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        value={display}
        className={cn(
          'min-w-[5.5rem] w-full text-center text-sm font-black tabular-nums tracking-tight',
          className,
        )}
        onFocus={(e) => {
          setFocused(true);
          setDraft(numericValue > 0 ? String(numericValue) : '');
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onChange(parseQuantity(draft));
          onBlur?.(e);
        }}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          onChange(parseQuantity(next));
        }}
        {...props}
      />
    );
  },
);

QuantityInput.displayName = 'QuantityInput';
