import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesTaxInvoiceSchema, SalesTaxInvoiceFormData } from '@/lib/schemas';
import { useStore, SalesTaxInvoice } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { formatCurrency } from '@/utils/formatters';

interface SalesTaxInvoiceFormProps {
  initialData?: SalesTaxInvoice;
  onSuccess?: () => void;
}

export default function SalesTaxInvoiceForm({ initialData, onSuccess }: SalesTaxInvoiceFormProps) {
  const { addTaxInvoice, updateTaxInvoice } = useStore();
  const form = useForm<SalesTaxInvoiceFormData>({
    resolver: zodResolver(salesTaxInvoiceSchema),
    defaultValues: initialData ? {
      invoiceNo: initialData.invoiceNo,
      invoiceDate: initialData.invoiceDate,
      customerName: initialData.customerName,
      address: initialData.address,
      orderNumbers: initialData.orderNumbers,
      orderDates: initialData.orderDates,
      items: initialData.items.map(item => ({
        product: item.product,
        manufacturerCompany: item.manufacturerCompany,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        batchNo: item.batchNo,
        rate: item.rate,
        gstApplicable: item.gstApplicable,
      })),
    } : {
      items: [{
        product: '',
        manufacturerCompany: '',
        expiryDate: '',
        quantity: 0,
        batchNo: '',
        rate: 0,
        gstApplicable: false
      }],
      orderNumbers: [''],
      orderDates: [''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');
  const totalNetAmount = items.reduce((sum, item) => {
    const gstAmount = item.gstApplicable ? (item.quantity * item.rate * 0.18) : 0;
    return sum + (item.quantity * item.rate) + gstAmount;
  }, 0);

  const onSubmit = (data: SalesTaxInvoiceFormData) => {
    const invoiceData: Omit<SalesTaxInvoice, 'id' | 'createdAt'> = {
      invoiceNo: data.invoiceNo,
      invoiceDate: data.invoiceDate,
      customerName: data.customerName,
      address: data.address,
      orderNumbers: data.orderNumbers,
      orderDates: data.orderDates,
      items: data.items.map((item, idx) => {
        const gstAmount = item.gstApplicable ? (item.quantity * item.rate * 0.18) : 0;
        const netRate = item.rate;
        const amount = (item.quantity * netRate) + gstAmount;
        return {
          id: `item-${idx}`,
          product: item.product,
          manufacturerCompany: item.manufacturerCompany,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          batchNo: item.batchNo,
          rate: item.rate,
          gstApplicable: item.gstApplicable,
          netRate,
          amount,
        };
      }),
      totalNetAmount,
    };

    if (initialData) {
      updateTaxInvoice(initialData.id, invoiceData);
    } else {
      addTaxInvoice(invoiceData);
    }
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Header */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Invoice Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="invoiceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice No</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 03698-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Customer Information</h3>
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., AFIC-NIHD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., RAWALPINDI CANTT" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Order Numbers and Dates */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Related Orders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="orderNumbers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Numbers (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 230830-5525, 240913-6018"
                      {...field}
                      value={field.value?.join(', ')}
                      onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderDates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Dates (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 30-Aug-2024, 03-Oct-2024"
                      {...field}
                      value={field.value?.join(', ')}
                      onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                    />
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
                product: '',
                manufacturerCompany: '',
                expiryDate: '',
                quantity: 0,
                batchNo: '',
                rate: 0,
                gstApplicable: false
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.product`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Product</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., TAB GETRYL 1MG" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.manufacturerCompany`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Company</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., GETZ" {...field} />
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
                    name={`items.${index}.rate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Rate</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.batchNo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Batch</FormLabel>
                        <FormControl>
                          <Input placeholder="Batch no" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.expiryDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Expiry</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name={`items.${index}.gstApplicable`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0 text-xs">18% GST</FormLabel>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(items.reduce((sum, item) => sum + (item.quantity * item.rate), 0))}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>GST (18%):</span>
              <span>{formatCurrency(items.reduce((sum, item) => {
                const gst = item.gstApplicable ? (item.quantity * item.rate * 0.18) : 0;
                return sum + gst;
              }, 0))}</span>
            </div>
            <div className="border-t border-primary/30 pt-2 flex justify-between items-center font-semibold">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(totalNetAmount)}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" className="gap-2">
            {initialData ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
