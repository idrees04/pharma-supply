import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesOrderSchema, SalesOrderFormData } from '@/lib/schemas';
import { useStore, SalesOrder } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface SalesOrderFormProps {
  initialData?: SalesOrder;
  onSuccess?: () => void;
}

export default function SalesOrderForm({ initialData, onSuccess }: SalesOrderFormProps) {
  const { addSalesOrder, updateSalesOrder } = useStore();
  const form = useForm<SalesOrderFormData>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: initialData ? {
      orderId: initialData.orderId,
      hospitalName: initialData.hospitalName,
      orderDate: initialData.orderDate,
      receivedDate: initialData.receivedDate,
      items: initialData.items.map(item => ({
        itemName: item.itemName,
        strength: item.strength,
        quantity: item.quantity,
        packSize: item.packSize,
        quantityInPacks: item.quantityInPacks,
        poRate: item.poRate,
        purchaseRate: item.purchaseRate,
      })),
      paymentStatus: initialData.paymentStatus,
    } : {
      items: [{ 
        itemName: '', 
        strength: '', 
        quantity: 0, 
        packSize: '', 
        quantityInPacks: 0, 
        poRate: 0, 
        purchaseRate: 0 
      }],
      paymentStatus: 'Pending',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');
  const saleTotal = items.reduce((sum, item) => sum + (item.quantity * item.poRate), 0);
  const purchaseTotal = items.reduce((sum, item) => sum + (item.quantity * item.purchaseRate), 0);
  const profit = saleTotal - purchaseTotal;

  const onSubmit = (data: SalesOrderFormData) => {
    const itemsWithCalculations = data.items.map((item, idx) => ({
      id: `item-${idx}`,
      itemName: item.itemName,
      strength: item.strength,
      quantity: item.quantity,
      packSize: item.packSize,
      quantityInPacks: item.quantityInPacks,
      poRate: item.poRate,
      purchaseRate: item.purchaseRate,
      saleTotal: item.quantity * item.poRate,
      purchaseTotal: item.quantity * item.purchaseRate,
    }));

    const saleTotal = itemsWithCalculations.reduce((sum, item) => sum + item.saleTotal, 0);
    const purchaseTotal = itemsWithCalculations.reduce((sum, item) => sum + item.purchaseTotal, 0);
    const profit = saleTotal - purchaseTotal;

    const soData: Omit<SalesOrder, 'id' | 'createdAt'> = {
      orderId: data.orderId,
      hospitalName: data.hospitalName,
      orderDate: data.orderDate,
      receivedDate: data.receivedDate,
      items: itemsWithCalculations as any,
      saleTotal,
      purchaseTotal,
      profit,
      paymentStatus: data.paymentStatus,
    };

    if (initialData) {
      updateSalesOrder(initialData.id, soData);
    } else {
      addSalesOrder(soData);
    }
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Order Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 3068" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hospitalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ginum Hospital Gujranwala" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receivedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ 
                itemName: '', 
                strength: '', 
                quantity: 0, 
                packSize: '', 
                quantityInPacks: 0, 
                poRate: 0, 
                purchaseRate: 0 
              })}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 bg-card border border-border rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.itemName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Inj Granicip" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.strength`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Strength</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3ml" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.packSize`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Pack Size</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Qty</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantityInPacks`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Qty Packs</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.poRate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">PO Rate</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.purchaseRate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Purchase Rate</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Item
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold mb-3">Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Sale Total:</span>
              <span className="font-semibold">PKR {saleTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Purchase Total:</span>
              <span className="font-semibold">PKR {purchaseTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="font-semibold">Profit:</span>
              <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                PKR {profit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <FormField
          control={form.control}
          name="paymentStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Cleared">Cleared</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" className="gap-2">
            {initialData ? 'Update SO' : 'Create SO'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
