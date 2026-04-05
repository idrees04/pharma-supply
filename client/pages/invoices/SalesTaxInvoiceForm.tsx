import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memo, useMemo } from 'react';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateInvoice } from '@/hooks/invoices';
import { useGetHospitals } from '@/hooks/useHospitals';
import { useProductList } from '@/api/services/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { CreateInvoiceRequest } from '@/types/api/invoices';

const invoiceItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  taxPercentage: z.coerce.number().min(0, 'Tax must be at least 0').max(100, 'Tax cannot exceed 100'),
  discountPercentage: z.coerce.number().min(0, 'Discount must be at least 0').max(100, 'Discount cannot exceed 100'),
});

const invoiceFormSchema = z.object({
  hospitalId: z.coerce.number().int().positive('Please select a hospital'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  shippingCharges: z.coerce.number().min(0, 'Shipping charges cannot be negative'),
  adjustmentAmount: z.coerce.number(),
  notes: z.string().min(1, 'Notes are required').max(1000, 'Notes are too long'),
  termsAndConditions: z.string()
    .min(1, 'Terms and conditions are required')
    .max(4000, 'Terms and conditions cannot exceed 4000 characters'),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
}).superRefine((data, ctx) => {
  if (new Date(data.dueDate) < new Date(data.invoiceDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dueDate'],
      message: 'Due date must be on or after invoice date',
    });
  }
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface SalesTaxInvoiceFormProps {
  onSuccess?: () => void;
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function buildCreateInvoicePayload(values: InvoiceFormValues): CreateInvoiceRequest {
  return {
    hospitalId: values.hospitalId,
    invoiceDate: values.invoiceDate,
    dueDate: values.dueDate,
    shippingCharges: values.shippingCharges,
    adjustmentAmount: values.adjustmentAmount,
    notes: values.notes?.trim(),
    termsAndConditions: values.termsAndConditions?.trim(),
    items: values.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxPercentage: item.taxPercentage,
      discountPercentage: item.discountPercentage,
      productBatchId: null,
    })),
  };
}

const InvoiceTotals = memo(function InvoiceTotals({
  subtotal,
  tax,
  discount,
  shipping,
  adjustment,
  total,
}: {
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  adjustment: number;
  total: number;
}) {
  return (
    <Card className="border-primary/15 bg-primary/5 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="font-medium">- {formatCurrency(discount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">{formatCurrency(shipping)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Adjustment</span>
          <span className="font-medium">{formatCurrency(adjustment)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-primary/15 pt-3">
          <span className="font-semibold">Estimated total</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </div>
    </Card>
  );
});

export default function SalesTaxInvoiceForm({ onSuccess }: SalesTaxInvoiceFormProps) {
  const { mutate: createInvoice, isPending } = useCreateInvoice();
  const { data: hospitalsResponse, isPending: isLoadingHospitals } = useGetHospitals({
    pageNumber: 1,
    pageSize: 1000,
  });
  const { data: productsResponse, isPending: isLoadingProducts } = useProductList({
    pageNumber: 1,
    pageSize: 1000,
  });

  const hospitals = hospitalsResponse?.data.items ?? [];
  const products = productsResponse?.items ?? [];

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      hospitalId: 0,
      invoiceDate: getTodayIsoDate(),
      dueDate: getDefaultDueDate(),
      shippingCharges: 0,
      adjustmentAmount: 0,
      notes: '',
      termsAndConditions: '',
      items: [
        {
          productId: 0,
          quantity: 1,
          unitPrice: 0,
          taxPercentage: 0,
          discountPercentage: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const watchedShipping = useWatch({ control: form.control, name: 'shippingCharges' });
  const watchedAdjustment = useWatch({ control: form.control, name: 'adjustmentAmount' });

  const totals = useMemo(() => {
    const subtotal = watchedItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );
    const tax = watchedItems.reduce(
      (sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0) * (item.taxPercentage || 0)) / 100,
      0
    );
    const discount = watchedItems.reduce(
      (sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0) * (item.discountPercentage || 0)) / 100,
      0
    );
    const shipping = watchedShipping || 0;
    const adjustment = watchedAdjustment || 0;

    const round = (n: number) => Math.round(n * 100) / 100;

    return {
      subtotal: round(subtotal),
      tax: round(tax),
      discount: round(discount),
      shipping: round(shipping),
      adjustment: round(adjustment),
      total: round(subtotal + tax - discount + shipping + adjustment),
    };
  }, [watchedItems, watchedShipping, watchedAdjustment]);

  const onSubmit = (values: InvoiceFormValues) => {
    createInvoice(buildCreateInvoicePayload(values), {
      onSuccess: () => {
        toast.success('Invoice created successfully');
        form.reset({
          hospitalId: 0,
          invoiceDate: getTodayIsoDate(),
          dueDate: getDefaultDueDate(),
          shippingCharges: 0,
          adjustmentAmount: 0,
          notes: '',
          termsAndConditions: '',
          items: [
            {
              productId: 0,
              quantity: 1,
              unitPrice: 0,
              taxPercentage: 0,
              discountPercentage: 0,
            },
          ],
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.userMessage || 'Failed to create invoice');
      },
    });
  };

  const isLoadingDependencies = isLoadingHospitals || isLoadingProducts;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card className="space-y-4 p-4">
              <div>
                <h3 className="font-semibold">Invoice header</h3>
                <p className="text-sm text-muted-foreground">
                  Select the hospital and set the invoice date. All amounts will be calculated automatically.
                </p>
              </div>

              {isLoadingDependencies ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hospitalId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Hospital <span className="text-destructive">*</span></FormLabel>
                        <Select value={field.value > 0 ? String(field.value) : undefined} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select hospital" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hospitals.map((hospital) => (
                              <SelectItem key={hospital.id} value={String(hospital.id)}>
                                {hospital.hospitalName}
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
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingCharges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping charges</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adjustmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adjustment amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter a positive amount to add a charge, or a negative amount (e.g., -10.00) to give a deduction.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Notes <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Optional billing notes or internal remarks"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsAndConditions"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-1">
                          Terms and conditions <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder="e.g., Payment due within 30 days. Late payment incurs 2% monthly interest."
                            className="resize-y"
                          />
                        </FormControl>
                        {/* <FormDescription>
                          These terms will be displayed on the final invoice and are legally binding.
                        </FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </Card>

            <Card className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Invoice items</h3>
                  <p className="text-sm text-muted-foreground">
                    Add the products, quantities, and any taxes or discounts. The system will compute the totals for you.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      productId: 0,
                      quantity: 1,
                      unitPrice: 0,
                      taxPercentage: 0,
                      discountPercentage: 0,
                    })
                  }
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((lineItem, index) => (
                  <Card key={lineItem.id} className="space-y-4 border-dashed p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-medium">Line item {index + 1}</h4>
                        <p className="text-xs text-muted-foreground">Product, quantity, price, tax, and discount.</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-destructive hover:bg-red-50 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Product <span className="text-destructive">*</span></FormLabel>
                            <Select value={field.value > 0 ? String(field.value) : undefined} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={String(product.id)}>
                                    {product.productName}
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
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit price</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.taxPercentage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax %</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.discountPercentage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount %</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <InvoiceTotals {...totals} />

            <Card className="space-y-3 p-4">
              <h3 className="font-semibold">Submission</h3>
              <p className="text-sm text-muted-foreground">
                You can only create new invoices here. To edit or delete an invoice, please go to the invoice list and use the action buttons.
              </p>
              <Button type="submit" className="w-full" disabled={isPending || isLoadingDependencies}>
                {isPending ? 'Creating invoice...' : 'Create invoice'}
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
