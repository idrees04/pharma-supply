import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseOrderSchema, PurchaseOrderFormData } from '@/lib/schemas';
import { useStore, PurchaseOrder } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrder;
  onSuccess?: () => void;
}

export default function PurchaseOrderForm({ initialData, onSuccess }: PurchaseOrderFormProps) {
  const { addPurchaseOrder, updatePurchaseOrder } = useStore();
  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: initialData ? {
      refNo: initialData.refNo,
      supplierName: initialData.supplierName,
      poDate: initialData.poDate,
      deliveryAddress: initialData.deliveryAddress,
      items: initialData.items.map(item => ({
        nomenclature: item.nomenclature,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
      })),
      distributorDiscount: initialData.distributorDiscount,
      paymentMethod: initialData.paymentMethod,
      notes: initialData.notes,
    } : {
      items: [{ nomenclature: '', unit: 'Pack', quantity: 0, rate: 0 }],
      distributorDiscount: 0,
      paymentMethod: 'Bank',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const calculateSubtotal = () => {
    return form.getValues('items').reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const subtotal = calculateSubtotal();
  const discount = subtotal * (form.watch('distributorDiscount') / 100);
  const total = subtotal - discount;

  const onSubmit = (data: PurchaseOrderFormData) => {
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discount = subtotal * (data.distributorDiscount / 100);
    const netPayableAmount = subtotal - discount;

    const poData: Omit<PurchaseOrder, 'id' | 'createdAt'> = {
      refNo: data.refNo,
      supplierName: data.supplierName,
      poDate: data.poDate,
      deliveryAddress: data.deliveryAddress,
      items: data.items.map((item, idx) => ({
        id: `item-${idx}`,
        nomenclature: item.nomenclature,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
      })),
      totalAmount: subtotal,
      distributorDiscount: data.distributorDiscount,
      netPayableAmount,
      paymentMethod: data.paymentMethod,
      notes: data.notes || '',
    };

    if (initialData) {
      updatePurchaseOrder(initialData.id, poData);
    } else {
      addPurchaseOrder(poData);
    }
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="refNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., DD/24-25/3890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="poDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PO Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="supplierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Next Pharma Pvt Ltd" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deliveryAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., E-64, Block-E Near Jamia Masjid..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Line Items */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ nomenclature: '', unit: 'Pack', quantity: 0, rate: 0 })}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-end p-3 bg-card border border-border rounded-lg">
                <FormField
                  control={form.control}
                  name={`items.${index}.nomenclature`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[200px]">
                      <FormLabel className="text-xs">Nomenclature</FormLabel>
                      <FormControl>
                        <Input placeholder="Item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unit`}
                  render={({ field }) => (
                    <FormItem className="min-w-[100px]">
                      <FormLabel className="text-xs">Unit</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pack">Pack</SelectItem>
                          <SelectItem value="Box">Box</SelectItem>
                          <SelectItem value="Unit">Unit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="min-w-[100px]">
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
                  name={`items.${index}.rate`}
                  render={({ field }) => (
                    <FormItem className="min-w-[100px]">
                      <FormLabel className="text-xs">Rate</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span>Subtotal:</span>
            <span className="font-semibold">PKR {subtotal.toFixed(2)}</span>
          </div>
          <FormField
            control={form.control}
            name="distributorDiscount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distributor Discount (%)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    <span className="text-sm text-muted-foreground">PKR {discount.toFixed(2)}</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Net Payable Amount:</span>
              <span className="text-lg font-bold text-primary">PKR {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Notes</FormLabel>
                <FormControl>
                  <Input placeholder="Any special instructions..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" className="gap-2">
            {initialData ? 'Update PO' : 'Create PO'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
