import { useForm } from 'react-hook-form';
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

interface InventoryAdjustmentFormProps {
  inventoryItem: InventoryStockDto;
  onClose: () => void;
}

type AdjustmentType = 'stock_in' | 'stock_out';

interface AdjustmentData {
  type: AdjustmentType;
  quantity: number;
  reason: string;
}

export default function InventoryAdjustmentForm({
  inventoryItem,
  onClose,
}: InventoryAdjustmentFormProps) {
  const { mutate: adjustStock, isPending } = useAdjustStock(inventoryItem.productId);

  const form = useForm<AdjustmentData>({
    defaultValues: {
      type: 'stock_in',
      quantity: 0,
      reason: '',
    },
  });

  const adjustmentType = form.watch('type');
  const quantity = Number(form.watch('quantity')) || 0;

  const handleAdjustment = (data: AdjustmentData) => {
    const adjQuantity = data.type === 'stock_in' ? data.quantity : -data.quantity;

    adjustStock(
      {
        quantity: adjQuantity,
        notes: data.reason,
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
              <p className="text-xl font-bold">
                {adjustmentType === 'stock_in'
                  ? inventoryItem.totalQuantity + quantity
                  : Math.max(0, inventoryItem.totalQuantity - quantity)}
              </p>
            </div>
          </div>
        </div>

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
                <Input type="number" min="1" placeholder="Enter quantity" {...field} />
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
          <Button type="submit" disabled={isPending || quantity <= 0}>
            {isPending ? 'Adjusting...' : 'Apply Adjustment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
