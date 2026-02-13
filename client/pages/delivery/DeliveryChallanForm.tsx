import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deliveryChallanSchema, DeliveryChallanFormData } from '@/lib/schemas';
import { useStore, DeliveryChallan } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface DeliveryChallanFormProps {
  initialData?: DeliveryChallan;
  onSuccess?: () => void;
}

export default function DeliveryChallanForm({ initialData, onSuccess }: DeliveryChallanFormProps) {
  const { addDeliveryChallan, updateDeliveryChallan } = useStore();
  const form = useForm<DeliveryChallanFormData>({
    resolver: zodResolver(deliveryChallanSchema),
    defaultValues: initialData ? {
      dcNo: initialData.dcNo,
      dcDate: initialData.dcDate,
      poNo: initialData.poNo,
      poDate: initialData.poDate,
      buyerName: initialData.buyerName,
      address: initialData.address,
      items: initialData.items.map(item => ({
        product: item.product,
        genericName: item.genericName,
        company: item.company,
        quantity: item.quantity,
        batch: item.batch,
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
      })),
    } : {
      items: [{ 
        product: '', 
        genericName: '', 
        company: '', 
        quantity: 0, 
        batch: '', 
        mfgDate: '', 
        expiryDate: '' 
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const totalQuantity = form.watch('items').reduce((sum, item) => sum + item.quantity, 0);

  const onSubmit = (data: DeliveryChallanFormData) => {
    const dcData: Omit<DeliveryChallan, 'id' | 'createdAt'> = {
      dcNo: data.dcNo,
      dcDate: data.dcDate,
      poNo: data.poNo,
      poDate: data.poDate,
      buyerName: data.buyerName,
      address: data.address,
      items: data.items.map((item, idx) => ({
        id: `item-${idx}`,
        product: item.product,
        genericName: item.genericName,
        company: item.company,
        quantity: item.quantity,
        batch: item.batch,
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
      })),
    };

    if (initialData) {
      updateDeliveryChallan(initialData.id, dcData);
    } else {
      addDeliveryChallan(dcData);
    }
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Information */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Delivery Challan Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dcNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DC No</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 240909-5583" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dcDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DC Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* PO Information */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Purchase Order Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="poNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PO No</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MS / Ideal Distrs / 04" {...field} />
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
        </div>

        {/* Buyer Information */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Buyer Information</h3>
          <FormField
            control={form.control}
            name="buyerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buyer Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., ARMED FORCES INSTITUTE OF CARDIOLOGY" {...field} />
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

        {/* Line Items */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Products</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ 
                product: '', 
                genericName: '', 
                company: '', 
                quantity: 0, 
                batch: '', 
                mfgDate: '', 
                expiryDate: '' 
              })}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
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
                        <FormLabel className="text-xs">Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CAP NEXUM 40MG" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.genericName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Generic Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Nexum" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.company`}
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
                    name={`items.${index}.batch`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Batch No</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., C02084" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.mfgDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Mfg Date</FormLabel>
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
                  name={`items.${index}.expiryDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                  className="text-destructive hover:text-destructive gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-semibold">
              Total Quantity: <span className="text-primary ml-2">{totalQuantity}</span>
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" className="gap-2">
            {initialData ? 'Update DC' : 'Create DC'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
