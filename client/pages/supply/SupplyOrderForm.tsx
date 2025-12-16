import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore, SupplyOrder } from '@/hooks/useStore';
import { supplyOrderSchema, SupplyOrderFormData } from '@/lib/schemas';
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
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface SupplyOrderFormProps {
  order?: SupplyOrder;
  onClose: () => void;
}

export default function SupplyOrderForm({ order, onClose }: SupplyOrderFormProps) {
  const addSupplyOrder = useStore((state) => state.addSupplyOrder);
  const updateSupplyOrder = useStore((state) => state.updateSupplyOrder);
  const hospitals = useStore((state) => state.hospitals);
  const products = useStore((state) => state.products);

  const form = useForm<SupplyOrderFormData>({
    resolver: zodResolver(supplyOrderSchema),
    defaultValues: order ? {
      orderNo: order.orderNo,
      hospitalId: order.hospitalId,
      hospitalName: order.hospitalName,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      status: order.status,
    } : {
      status: 'Draft',
      items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

  const onSubmit = (data: SupplyOrderFormData) => {
    try {
      const supplyOrderData: Omit<SupplyOrder, 'id' | 'createdAt'> = {
        orderNo: data.orderNo,
        hospitalId: data.hospitalId,
        hospitalName: data.hospitalName,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate,
        items: data.items.map((item) => ({
          id: Math.random().toString(36).substring(2, 11),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
        totalAmount,
        status: data.status,
      };

      if (order) {
        updateSupplyOrder(order.id, supplyOrderData);
        toast.success('Supply order updated successfully');
      } else {
        addSupplyOrder(supplyOrderData);
        toast.success('Supply order created successfully');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save supply order');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="orderNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order No *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., SO-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hospitalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hospital *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hospitals.filter((h) => h.isActive).map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="orderDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Line Items *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: '', productName: '', quantity: 1, unitPrice: 0 })}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                <FormField
                  control={form.control}
                  name={`items.${index}.productId`}
                  render={({ field }) => (
                    <FormItem className="col-span-4">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.filter((p) => p.isActive).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.brandName}
                            </SelectItem>
                          ))}
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
                    <FormItem className="col-span-2">
                      <FormControl>
                        <Input type="number" min="1" placeholder="Qty" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="Price" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-2 text-right text-sm font-medium">
                  {((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unitPrice`) || 0)).toFixed(2)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="col-span-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="text-right text-lg font-bold">Total: PKR {totalAmount.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
