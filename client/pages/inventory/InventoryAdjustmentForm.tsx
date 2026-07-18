import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAdjustStock, useInventoryStockLedger } from '@/api/services/inventory';
import {
  AdjustInventoryBatchLineRequest,
  InventoryStockDto,
  ProductBatchDto,
} from '@/types/api/inventory';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryAdjustmentFormProps {
  inventoryItem: InventoryStockDto;
  onClose: () => void;
}

const batchLineSchema = z.object({
  mode: z.enum(['existing', 'new']),
  productBatchId: z.string().optional(),
  batchNumber: z.string().optional(),
  manufactureDate: z.string().optional(),
  expiryDate: z.string().optional(),
  purchaseRate: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
});

const adjustmentSchema = z
  .object({
    type: z.enum(['stock_in', 'stock_out']),
    reason: z.string().optional(),
    batches: z.array(batchLineSchema).min(1, 'Add at least one batch line'),
  })
  .superRefine((data, ctx) => {
    data.batches.forEach((line, index) => {
      if (data.type === 'stock_out' || line.mode === 'existing') {
        if (!line.productBatchId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Select a batch',
            path: ['batches', index, 'productBatchId'],
          });
        }
      }
      if (data.type === 'stock_in' && line.mode === 'new') {
        if (!line.batchNumber?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Batch number is required',
            path: ['batches', index, 'batchNumber'],
          });
        }
      }
    });
  });

type AdjustmentData = z.infer<typeof adjustmentSchema>;

const emptyLine = (type: 'stock_in' | 'stock_out'): AdjustmentData['batches'][number] => ({
  mode: type === 'stock_out' ? 'existing' : 'new',
  productBatchId: '',
  batchNumber: '',
  manufactureDate: '',
  expiryDate: '',
  purchaseRate: '',
  quantity: 1,
  notes: '',
});

const formatBatchLabel = (batch: ProductBatchDto) => {
  const expiry = batch.expiryDate
    ? ` · exp ${new Date(batch.expiryDate).toLocaleDateString()}`
    : '';
  return `${batch.batchNumber ?? `Batch #${batch.id}`} (${batch.currentQuantity} avail${expiry})`;
};

export default function InventoryAdjustmentForm({
  inventoryItem,
  onClose,
}: InventoryAdjustmentFormProps) {
  const { mutate: adjustStock, isPending } = useAdjustStock(inventoryItem.productId);
  const { data: ledger, isLoading: ledgerLoading } = useInventoryStockLedger(
    inventoryItem.productId
  );

  const allBatches = ledger?.batches ?? [];
  const stockOutBatches = useMemo(
    () => allBatches.filter((b) => b.currentQuantity > 0),
    [allBatches]
  );

  const form = useForm<AdjustmentData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: 'stock_in',
      reason: '',
      batches: [emptyLine('stock_in')],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'batches',
  });

  const adjustmentType = useWatch({ control: form.control, name: 'type' });
  const watchedBatches = useWatch({ control: form.control, name: 'batches' }) ?? [];
  const selectableBatches =
    adjustmentType === 'stock_out' ? stockOutBatches : allBatches;

  useEffect(() => {
    replace([emptyLine(adjustmentType)]);
    // Reset lines when direction changes; replace is stable from useFieldArray.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustmentType]);

  const totalQty = watchedBatches.reduce(
    (sum, line) => sum + (Number(line?.quantity) || 0),
    0
  );

  const batchQtyUsed = useMemo(() => {
    const map = new Map<number, number>();
    watchedBatches.forEach((line) => {
      const id = Number(line?.productBatchId);
      if (!id) return;
      map.set(id, (map.get(id) ?? 0) + (Number(line?.quantity) || 0));
    });
    return map;
  }, [watchedBatches]);

  const oversoldBatch = useMemo(() => {
    if (adjustmentType !== 'stock_out') return null;
    for (const [batchId, used] of batchQtyUsed) {
      const batch = stockOutBatches.find((b) => b.id === batchId);
      if (batch && used > batch.currentQuantity) {
        return { batch, used };
      }
    }
    return null;
  }, [adjustmentType, batchQtyUsed, stockOutBatches]);

  const isInvalidStockOut =
    adjustmentType === 'stock_out' &&
    (totalQty > inventoryItem.availableQuantity || !!oversoldBatch);

  const afterQty =
    adjustmentType === 'stock_in'
      ? inventoryItem.totalQuantity + totalQty
      : Math.max(0, inventoryItem.totalQuantity - totalQty);

  const handleAdjustment = (data: AdjustmentData) => {
    if (data.type === 'stock_out' && data.batches.reduce((s, b) => s + b.quantity, 0) > inventoryItem.availableQuantity) {
      toast.error('Cannot remove more than available stock');
      return;
    }
    if (oversoldBatch) {
      toast.error(
        `Batch ${oversoldBatch.batch.batchNumber} only has ${oversoldBatch.batch.currentQuantity} available`
      );
      return;
    }

    const sign = data.type === 'stock_in' ? 1 : -1;
    const batches: AdjustInventoryBatchLineRequest[] = data.batches.map((line) => {
      const signedQty = sign * line.quantity;
      if (data.type === 'stock_out' || line.mode === 'existing') {
        return {
          productBatchId: Number(line.productBatchId),
          quantity: signedQty,
          notes: line.notes?.trim() || null,
        };
      }
      const rate = line.purchaseRate?.trim() ? Number(line.purchaseRate) : null;
      return {
        batchNumber: line.batchNumber?.trim() || null,
        manufactureDate: line.manufactureDate || null,
        expiryDate: line.expiryDate || null,
        purchaseRate: rate != null && !Number.isNaN(rate) ? rate : null,
        quantity: signedQty,
        notes: line.notes?.trim() || null,
      };
    });

    adjustStock(
      {
        notes: data.reason?.trim() || null,
        batches,
      },
      {
        onSuccess: () => {
          toast.success(
            data.type === 'stock_in' ? 'Stock added successfully' : 'Stock removed successfully'
          );
          onClose();
        },
        onError: (error) => {
          toast.error(error.userMessage || 'Failed to adjust inventory');
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleAdjustment)} className="space-y-5">
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Stock</p>
              <p className="text-xl font-bold">{inventoryItem.totalQuantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reserved</p>
              <p className="text-xl font-bold text-amber-600">{inventoryItem.reservedQuantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-xl font-bold text-green-600">{inventoryItem.availableQuantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">After Adjustment</p>
              <p
                className={cn(
                  'text-xl font-bold',
                  isInvalidStockOut ? 'text-red-600' : 'text-foreground'
                )}
              >
                {afterQty}
              </p>
            </div>
          </div>
        </div>

        {isInvalidStockOut && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Invalid stock out</p>
              <p>
                {oversoldBatch
                  ? `Batch ${oversoldBatch.batch.batchNumber} has only ${oversoldBatch.batch.currentQuantity} available.`
                  : `You cannot remove ${totalQty} units. Only ${inventoryItem.availableQuantity} are available.`}
              </p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adjustment Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="stock_in">Stock In (Receive)</SelectItem>
                  <SelectItem value="stock_out">Stock Out (Remove)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {adjustmentType === 'stock_in'
                  ? 'Add quantity to existing batches or create new ones'
                  : 'Remove quantity from one or more existing batches'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <FormLabel className="text-sm">Batch lines *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyLine(adjustmentType))}
              disabled={adjustmentType === 'stock_out' && stockOutBatches.length === 0}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add batch
            </Button>
          </div>

          {ledgerLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading batches…
            </div>
          )}

          {!ledgerLoading && adjustmentType === 'stock_out' && stockOutBatches.length === 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No batches with available quantity. Stock out requires an existing batch.
            </div>
          )}

          <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
            {fields.map((field, index) => {
              const line = watchedBatches[index];
              const mode = line?.mode ?? 'new';
              const selectedBatchId = Number(line?.productBatchId) || 0;
              const selectedBatch = selectableBatches.find((b) => b.id === selectedBatchId);
              const maxForLine =
                adjustmentType === 'stock_out' && selectedBatch
                  ? selectedBatch.currentQuantity
                  : undefined;

              return (
                <div
                  key={field.id}
                  className="rounded-lg border border-border/80 bg-background p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Line {index + 1}</p>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {adjustmentType === 'stock_in' && (
                    <FormField
                      control={form.control}
                      name={`batches.${index}.mode`}
                      render={({ field: modeField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Batch source</FormLabel>
                          <Select
                            onValueChange={modeField.onChange}
                            value={modeField.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new">Create new batch</SelectItem>
                              <SelectItem
                                value="existing"
                                disabled={allBatches.length === 0}
                              >
                                Add to existing batch
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(adjustmentType === 'stock_out' || mode === 'existing') && (
                    <FormField
                      control={form.control}
                      name={`batches.${index}.productBatchId`}
                      render={({ field: batchField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Batch *</FormLabel>
                          <Select
                            onValueChange={batchField.onChange}
                            value={batchField.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select batch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectableBatches.map((batch) => (
                                <SelectItem key={batch.id} value={String(batch.id)}>
                                  {formatBatchLabel(batch)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {adjustmentType === 'stock_in' && mode === 'new' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`batches.${index}.batchNumber`}
                        render={({ field: bnField }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="text-xs">Batch number *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. B-2026-01" {...bnField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`batches.${index}.manufactureDate`}
                        render={({ field: dField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Manufacture date</FormLabel>
                            <FormControl>
                              <Input type="date" {...dField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`batches.${index}.expiryDate`}
                        render={({ field: dField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Expiry date</FormLabel>
                            <FormControl>
                              <Input type="date" {...dField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`batches.${index}.purchaseRate`}
                        render={({ field: rField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Purchase rate</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" placeholder="Optional" {...rField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`batches.${index}.quantity`}
                      render={({ field: qField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max={maxForLine}
                              placeholder="Qty"
                              {...qField}
                              className={cn(
                                oversoldBatch?.batch.id === selectedBatchId &&
                                  'border-red-500 focus-visible:ring-red-500'
                              )}
                            />
                          </FormControl>
                          {maxForLine != null && (
                            <FormDescription className="text-[11px]">
                              Max {maxForLine} on this batch
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`batches.${index}.notes`}
                      render={({ field: nField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Line note (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional" {...nField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall reason</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Supplier delivery, Damage, Count correction"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional note for the whole adjustment</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isPending ||
              ledgerLoading ||
              totalQty <= 0 ||
              isInvalidStockOut ||
              (adjustmentType === 'stock_out' && stockOutBatches.length === 0)
            }
          >
            {isPending ? 'Adjusting...' : `Apply (${totalQty} units)`}
          </Button>
        </div>
      </form>
    </Form>
  );
}
