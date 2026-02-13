import { useForm } from 'react-hook-form';
import { useStore, InventoryItem } from '@/hooks/useStore';
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

interface InventoryAdjustmentFormProps {
  inventoryItem: InventoryItem;
  onClose: () => void;
}

type AdjustmentType = 'stock_in' | 'stock_out' | 'reserve' | 'unreserve';

interface AdjustmentData {
  type: AdjustmentType;
  quantity: number;
  reason: string;
}

export default function InventoryAdjustmentForm({
  inventoryItem,
  onClose,
}: InventoryAdjustmentFormProps) {
  const updateInventoryItem = useStore((state) => state.updateInventoryItem);

  const form = useForm<AdjustmentData>({
    defaultValues: {
      type: 'stock_in',
      quantity: 0,
      reason: '',
    },
  });

  const adjustmentType = form.watch('type');
  const quantity = form.watch('quantity');

  const handleAdjustment = (data: AdjustmentData) => {
    try {
      let newCurrentStock = inventoryItem.currentStock;
      let newReservedStock = inventoryItem.reservedStock;

      switch (data.type) {
        case 'stock_in':
          newCurrentStock += data.quantity;
          break;
        case 'stock_out':
          if (newCurrentStock < data.quantity) {
            toast.error('Insufficient stock for removal');
            return;
          }
          newCurrentStock -= data.quantity;
          break;
        case 'reserve':
          if (newCurrentStock - newReservedStock < data.quantity) {
            toast.error('Insufficient available stock for reservation');
            return;
          }
          newReservedStock += data.quantity;
          break;
        case 'unreserve':
          if (newReservedStock < data.quantity) {
            toast.error('Cannot unreserve more than reserved stock');
            return;
          }
          newReservedStock -= data.quantity;
          break;
      }

      const newAvailableStock = newCurrentStock - newReservedStock;

      updateInventoryItem(inventoryItem.id, {
        currentStock: newCurrentStock,
        reservedStock: newReservedStock,
        availableStock: newAvailableStock,
        lastRestockDate: new Date().toISOString().split('T')[0],
      });

      const messages = {
        stock_in: 'Stock received successfully',
        stock_out: 'Stock removed successfully',
        reserve: 'Stock reserved successfully',
        unreserve: 'Reservation cancelled successfully',
      };

      toast.success(messages[data.type]);
      onClose();
    } catch (error) {
      toast.error('Failed to adjust inventory');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleAdjustment)} className="space-y-6">
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Stock</p>
              <p className="text-xl font-bold">{inventoryItem.currentStock}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reserved</p>
              <p className="text-xl font-bold text-amber-600">{inventoryItem.reservedStock}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-xl font-bold text-green-600">{inventoryItem.availableStock}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">After Adjustment</p>
              <p className="text-xl font-bold">
                {adjustmentType === 'stock_in'
                  ? inventoryItem.currentStock + quantity
                  : adjustmentType === 'stock_out'
                    ? Math.max(0, inventoryItem.currentStock - quantity)
                    : adjustmentType === 'reserve'
                      ? inventoryItem.availableStock - quantity
                      : inventoryItem.reservedStock - quantity}
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
                  <SelectItem value="reserve">Reserve Stock</SelectItem>
                  <SelectItem value="unreserve">Unreserve Stock</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {adjustmentType === 'stock_in' && 'Add stock to inventory (e.g., new delivery)'}
                {adjustmentType === 'stock_out' && 'Remove stock from inventory (e.g., damaged items)'}
                {adjustmentType === 'reserve' && 'Reserve stock for pending orders'}
                {adjustmentType === 'unreserve' && 'Release reserved stock back to available'}
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
          <Button type="submit" disabled={form.formState.isSubmitting || quantity <= 0}>
            {form.formState.isSubmitting ? 'Adjusting...' : 'Apply Adjustment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
