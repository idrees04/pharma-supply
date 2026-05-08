import React, { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SupplyOrder, SupplyOrderItem } from '@/types/api/supplyOrders';
import {
  useCreateDeliveryChallanForSupplyOrder,
  useSupplyOrderDispatchSuggestion,
} from '@/api/services/supplyOrders.service';
import { useToast } from '@/components/ui/use-toast';
const dcLineSchema = z.object({
  supplyOrderItemId: z.number().int(),
  quantityToDispatch: z.coerce.number().int().min(0),
  include: z.boolean(),
});

const dcFromSupplyOrderSchema = z
  .object({
    dispatchDate: z.string().min(1, 'Dispatch date is required'),
    notes: z
      .string()
      .refine((val) => val.trim().length > 0, {
        message: 'Notes are required for the delivery challan',
      }),
    lines: z.array(dcLineSchema),
  })
  .refine((d) => d.lines.some((l) => l.include && l.quantityToDispatch > 0), {
    message: 'Include at least one line with quantity to dispatch.',
    path: ['lines'],
  });

type DcFromSupplyOrderFormValues = z.infer<typeof dcFromSupplyOrderSchema>;

function formatDispatchDateToISO(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('T')) return dateStr;
  return new Date(`${dateStr}T12:00:00`).toISOString();
}

interface DeliveryChallanFromSupplyOrderPanelProps {
  supplyOrderId: number;
  supplyOrder: SupplyOrder;
  onCreated: (deliveryChallanId: number) => void;
  onCancel?: () => void;
}

export function DeliveryChallanFromSupplyOrderPanel({
  supplyOrderId,
  supplyOrder,
  onCreated,
  onCancel,
}: DeliveryChallanFromSupplyOrderPanelProps) {
  const { toast } = useToast();
  const { data: suggestion, isPending: loadingSuggestion } =
    useSupplyOrderDispatchSuggestion(supplyOrderId);
  const createDc = useCreateDeliveryChallanForSupplyOrder(supplyOrderId);

  const suggestionByLineId = useMemo(() => {
    const m = new Map<number, { maxDispatchableQuantity: number }>();
    suggestion?.lines.forEach((l) =>
      m.set(l.supplyOrderItemId, { maxDispatchableQuantity: l.maxDispatchableQuantity })
    );
    return m;
  }, [suggestion]);

  const itemById = useMemo(() => {
    const m = new Map<number, SupplyOrderItem>();
    (supplyOrder.items ?? []).forEach((i) => m.set(i.id, i));
    return m;
  }, [supplyOrder.items]);

  const form = useForm<DcFromSupplyOrderFormValues>({
    resolver: zodResolver(dcFromSupplyOrderSchema),
    defaultValues: {
      dispatchDate: new Date().toISOString().split('T')[0],
      notes: '',
      lines: [],
    },
  });

  const { fields } = useFieldArray({ control: form.control, name: 'lines' });

  useEffect(() => {
    if (loadingSuggestion) return;

    const lines = (supplyOrder.items ?? [])
      .filter((it) => it.remainingQuantity > 0)
      .map((it) => {
        const max =
          suggestionByLineId.get(it.id)?.maxDispatchableQuantity ?? it.remainingQuantity;
        const qty = Math.min(max, it.remainingQuantity);
        return {
          supplyOrderItemId: it.id,
          quantityToDispatch: Math.max(0, qty),
          include: qty > 0,
        };
      });

    form.reset({
      dispatchDate: new Date().toISOString().split('T')[0],
      notes: '',
      lines,
    });
  }, [loadingSuggestion, supplyOrder.id, supplyOrder.items, suggestionByLineId, form]);

  const onSubmit = form.handleSubmit((data) => {
    const selected = data.lines.filter((l) => l.include && l.quantityToDispatch > 0);
    for (const line of selected) {
      const row = itemById.get(line.supplyOrderItemId);
      if (!row) {
        toast({
          title: 'Invalid line',
          description: `Unknown supply order item ${line.supplyOrderItemId}.`,
          variant: 'destructive',
        });
        return;
      }
      if (line.quantityToDispatch > row.remainingQuantity) {
        toast({
          title: 'Quantity too high',
          description: `${row.productName}: cannot dispatch more than remaining ${row.remainingQuantity}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    createDc.mutate(
      {
        dispatchDate: formatDispatchDateToISO(data.dispatchDate),
        notes: data.notes.trim(),
        items: selected.map((l) => ({
          supplyOrderItemId: l.supplyOrderItemId,
          quantityToDispatch: l.quantityToDispatch,
        })),
      },
      {
        onSuccess: (dc) => {
          toast({
            title: 'Delivery challan created',
            description: `${dc.challanNumber ?? `DC #${dc.id}`} — stock dispatched.`,
          });
          onCreated(dc.id);
        },
        onError: (err: { message?: string }) => {
          toast({
            title: 'Dispatch failed',
            description: err.message ?? 'Could not create delivery challan.',
            variant: 'destructive',
          });
        },
      }
    );
  });

  const hasRemaining = (supplyOrder.items ?? []).some((i) => i.remainingQuantity > 0);

  if (loadingSuggestion) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading dispatch suggestion…</p>
      </div>
    );
  }

  if (!hasRemaining) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        Nothing left to dispatch: every line is fully fulfilled or has no remaining quantity.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <p className="text-sm text-muted-foreground">
        Dispatches inventory using FEFO batches (see API). Quantities default to stock-aware limits from{' '}
        <span className="font-medium text-foreground">dispatch-suggestion</span>.
      </p>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="dispatchDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispatch date</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Notes <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Required — e.g. vehicle reference, gate pass, handling instructions"
                    className="min-h-[88px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel className="text-base">Lines</FormLabel>
            <p className="text-xs text-muted-foreground">
              Maps to <code className="rounded bg-slate-100 px-1">items[]</code> with{' '}
              <code className="rounded bg-slate-100 px-1">supplyOrderItemId</code> and{' '}
              <code className="rounded bg-slate-100 px-1">quantityToDispatch</code>.
            </p>

            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10" />
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                    <TableHead className="text-center text-xs text-muted-foreground">Max dispatch*</TableHead>
                    <TableHead className="w-[130px] text-right">Qty to dispatch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((row, index) => {
                    const line = form.watch(`lines.${index}`);
                    const meta = itemById.get(line.supplyOrderItemId);
                    const maxSug = suggestionByLineId.get(line.supplyOrderItemId)?.maxDispatchableQuantity;

                    return (
                      <TableRow key={row.id}>
                        <TableCell className="align-middle">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.include`}
                            render={({ field }) => (
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(c) => field.onChange(!!c)}
                                disabled={!meta || (maxSug ?? 0) <= 0}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {meta?.productName ?? '—'}
                          <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                            Line #{line.supplyOrderItemId}
                          </span>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{meta?.remainingQuantity ?? 0}</TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {maxSug ?? '—'}
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.quantityToDispatch`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                min={0}
                                className="h-9 text-right tabular-nums"
                                disabled={!line.include || !meta}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))
                                }
                              />
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-[11px] text-muted-foreground">
              *Max dispatch = min(remaining to fulfill, available stock / batch FEFO capacity).
            </p>
            {(form.formState.errors.lines as { message?: string } | undefined)?.message && (
              <p className="text-sm text-destructive">
                {(form.formState.errors.lines as { message?: string }).message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" className="h-11" onClick={() => onCancel?.()}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 gap-2" disabled={createDc.isPending}>
              {createDc.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating challan…
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  Create delivery challan
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
