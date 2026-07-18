import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSupplyOrderList } from '@/api/services/supplyOrders.service';

export interface LinkedSupplyOrderOption {
  id: number;
  label: string;
  hospitalName?: string | null;
}

interface SupplyOrderLinkPickerProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
}

export function SupplyOrderLinkPicker({
  value,
  onChange,
  disabled,
  className,
}: SupplyOrderLinkPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isPending } = useSupplyOrderList({
    pageNumber: 1,
    pageSize: 200,
    sortBy: 'Id',
    sortDescending: true,
  });

  const options = useMemo<LinkedSupplyOrderOption[]>(() => {
    const items = data?.items ?? [];
    return items.map((so) => ({
      id: so.id,
      label: so.supplyOrderNumber || `SO #${so.id}`,
      hospitalName: so.hospitalName,
    }));
  }, [data?.items]);

  const selected = useMemo(
    () => options.filter((o) => value.includes(o.id)),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hospitalName?.toLowerCase().includes(q) ?? false) ||
        String(o.id).includes(q),
    );
  }, [options, search]);

  const toggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
      return;
    }
    onChange([...value, id]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-11 w-full justify-between border-muted-foreground/20 font-normal',
              !value.length && 'text-muted-foreground',
            )}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <Link2 className="h-4 w-4 shrink-0 text-primary" />
              {value.length === 0
                ? 'Link supply orders (optional)'
                : `${value.length} supply order${value.length === 1 ? '' : 's'} linked`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="border-b p-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supply orders…"
              className="h-9"
            />
          </div>
          <ScrollArea className="h-56">
            {isPending ? (
              <p className="p-4 text-sm text-muted-foreground">Loading supply orders…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No supply orders found.</p>
            ) : (
              <ul className="p-1">
                {filtered.map((opt) => {
                  const checked = value.includes(opt.id);
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50',
                          checked && 'bg-primary/5',
                        )}
                        onClick={() => toggle(opt.id)}
                      >
                        <Checkbox checked={checked} className="mt-0.5" tabIndex={-1} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 font-semibold text-slate-800">
                            {opt.label}
                            {checked ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                          </span>
                          {opt.hospitalName ? (
                            <span className="block text-xs text-slate-500">{opt.hospitalName}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((opt) => (
            <Badge
              key={opt.id}
              variant="secondary"
              className="gap-1 border border-slate-200 bg-slate-50 pr-1 font-mono text-[11px]"
            >
              {opt.label}
              {!disabled ? (
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-slate-200"
                  onClick={() => toggle(opt.id)}
                  aria-label={`Remove ${opt.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </Badge>
          ))}
        </div>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        Reference only — links this purchase order to one or more supply orders.
      </p>
    </div>
  );
}
