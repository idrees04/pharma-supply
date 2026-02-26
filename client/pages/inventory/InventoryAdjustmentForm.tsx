import { useForm } from 'react-hook-form';
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
import { useAdjustStock } from '@/api/services/inventory';
import { InventoryStockDto } from '@/types/api/inventory';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryAdjustmentFormProps {
  inventoryItem: InventoryStockDto;
  onClose: () => void;
}

const adjustmentSchema = z.object({
  type: z.enum(['stock_in', 'stock_out']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().optional(),
});

type AdjustmentData = z.infer<typeof adjustmentSchema>;

export default function InventoryAdjustmentForm({
  inventoryItem,
  onClose,
}: InventoryAdjustmentFormProps) {
  const { mutate: adjustStock, isPending } = useAdjustStock(inventoryItem.productId);

  const form = useForm<AdjustmentData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: 'stock_in',
      quantity: 0,
      reason: '',
    },
  });

  const adjustmentType = form.watch('type');
  const quantity = Number(form.watch('quantity')) || 0;

  // Real-time validation for Stock Out
  const isInvalidStockOut = adjustmentType === 'stock_out' && quantity > inventoryItem.availableQuantity;

  const handleAdjustment = (data: AdjustmentData) => {
    // Additional safeguard
    if (data.type === 'stock_out' && data.quantity > inventoryItem.availableQuantity) {
      toast.error('Cannot remove more than available stock');
      return;
    }

    const adjQuantity = data.type === 'stock_in' ? data.quantity : -data.quantity;

    adjustStock(
      {
        quantity: adjQuantity,
        notes: data.reason || '',
      },
      {
        onSuccess: () => {
          toast.success(data.type === 'stock_in' ? 'Stock added successfully' : 'Stock removed successfully');
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
      <form onSubmit={form.handleSubmit(handleAdjustment)} className="space-y-6">
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-4">
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
              <p className={cn(
                "text-xl font-bold",
                isInvalidStockOut ? "text-red-600" : "text-foreground"
              )}>
                {adjustmentType === 'stock_in'
                  ? inventoryItem.totalQuantity + quantity
                  : Math.max(0, inventoryItem.totalQuantity - quantity)}
              </p>
            </div>
          </div>
        </div>

        {isInvalidStockOut && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-start gap-2 text-red-700 text-sm animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Invalid Stock Out Quantity</p>
              <p>You cannot remove {quantity} units. Only {inventoryItem.availableQuantity} units are available in stock.</p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adjustment Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                {adjustmentType === 'stock_in' && 'Add stock to inventory (e.g., new delivery)'}
                {adjustmentType === 'stock_out' && 'Remove stock from inventory (e.g., damaged items)'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  {...field}
                  className={cn(isInvalidStockOut && "border-red-500 focus-visible:ring-red-500")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Supplier delivery, Damage, Order reservation"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional note for tracking purposes</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || quantity <= 0 || isInvalidStockOut}>
            {isPending ? 'Adjusting...' : 'Apply Adjustment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
