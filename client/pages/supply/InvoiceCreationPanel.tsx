import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateInvoiceFromSupplyOrder } from '@/hooks/invoices';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { SupplyOrder, SupplyOrderItem } from '@/types/api/supplyOrders';
import { CreateInvoiceFromSupplyOrderRequest, InvoiceDto } from '@/types/api/invoices';
import { InvoiceTemplate } from './InvoiceTemplate';
import { downloadElementAsPdf } from '@/lib/downloadPdf';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSupplyOrderDeliveryChallans } from '@/api/services/supplyOrders.service';
import { useTaxConfigurations } from '@/hooks/taxConfiguration';

const invoiceLineRowSchema = z.object({
  supplyOrderItemId: z.number().int(),
  quantity: z.coerce.number().int().min(0),
  include: z.boolean(),
});

function defaultInvoiceNotesForSupplyOrder(so: SupplyOrder): string {
  const ref = so.supplyOrderNumber?.trim() || `SO #${so.id}`;
  return `Invoice for supply order ${ref}.`;
}

const invoiceFromSupplyOrderFormBaseSchema = z
  .object({
    deliveryChallanId: z.coerce.number().int().min(0).optional(),
    invoiceDate: z.string().min(1, 'Invoice date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    shippingCharges: z.coerce.number().min(0),
    adjustmentAmount: z.coerce.number(),
    notes: z
      .string()
      .refine((val) => val.trim().length > 0, { message: 'Notes are required.' }),
    termsAndConditions: z
      .string()
      .refine((val) => val.trim().length > 0, {
        message: 'Terms and conditions are required.',
      }),
    salesTaxConfigurationId: z.coerce.number().int().min(0).optional(),
    lines: z.array(invoiceLineRowSchema),
  })
  .refine((d) => d.lines.some((l) => l.include && l.quantity > 0), {
    message: 'Include at least one line with quantity greater than zero.',
    path: ['lines'],
  });

function invoiceFromSupplyOrderFormSchema(requireDeliveryChallan: boolean) {
  if (!requireDeliveryChallan) return invoiceFromSupplyOrderFormBaseSchema;
  return invoiceFromSupplyOrderFormBaseSchema.superRefine((data, ctx) => {
    if (!data.deliveryChallanId || data.deliveryChallanId <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a delivery challan before creating the invoice.',
        path: ['deliveryChallanId'],
      });
    }
  });
}

type InvoiceFromSupplyOrderFormValues = z.infer<typeof invoiceFromSupplyOrderFormBaseSchema>;

interface InvoiceCreationPanelProps {
  supplyOrderId: number;
  supplyOrder: SupplyOrder;
  /** After creating a delivery challan in the guided flow, pre-select it on the invoice request */
  initialDeliveryChallanId?: number;
  /** When true, user cannot clear or change the linked delivery challan */
  lockDeliveryChallanSelection?: boolean;
  /** When true, a delivery challan must be chosen (no “none”); use from supply order after DC exists */
  requireDeliveryChallan?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

function formatDateToISO(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('T')) return dateStr;
  return new Date(`${dateStr}T12:00:00`).toISOString();
}

export function InvoiceCreationPanel({
  supplyOrderId,
  supplyOrder,
  initialDeliveryChallanId,
  lockDeliveryChallanSelection = false,
  requireDeliveryChallan = false,
  onSuccess,
  onClose,
}: InvoiceCreationPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const invoiceTemplateRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<'form' | 'preview' | 'generating'>('form');
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<InvoiceDto | null>(null);

  const { data: deliveryChallans = [], isPending: loadingChallans } =
    useSupplyOrderDeliveryChallans(supplyOrderId);
  const { data: taxConfigurations = [], isPending: loadingTaxConfigs } = useTaxConfigurations();

  const activeTaxOptions = useMemo(
    () => taxConfigurations.filter((t) => t.isActive),
    [taxConfigurations]
  );

  const defaultLines = useMemo(() => {
    return (supplyOrder.items ?? [])
      .filter((it) => it.fulfilledQuantity > 0)
      .map((it) => ({
        supplyOrderItemId: it.id,
        quantity: it.fulfilledQuantity,
        include: true,
      }));
  }, [supplyOrder.items]);

  const formSchema = useMemo(
    () => invoiceFromSupplyOrderFormSchema(requireDeliveryChallan),
    [requireDeliveryChallan]
  );

  const form = useForm<InvoiceFromSupplyOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryChallanId:
        initialDeliveryChallanId && initialDeliveryChallanId > 0 ? initialDeliveryChallanId : 0,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shippingCharges: 0,
      adjustmentAmount: 0,
      notes: defaultInvoiceNotesForSupplyOrder(supplyOrder),
      termsAndConditions:
        'Payment terms: Net 30 days. Please remit payment to the specified account.',
      salesTaxConfigurationId: 0,
      lines: defaultLines.length > 0 ? defaultLines : [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  useEffect(() => {
    const lines = (supplyOrder.items ?? [])
      .filter((it) => it.fulfilledQuantity > 0)
      .map((it) => ({
        supplyOrderItemId: it.id,
        quantity: it.fulfilledQuantity,
        include: true,
      }));

    let deliveryChallanId = 0;
    if (requireDeliveryChallan && deliveryChallans.length > 0) {
      deliveryChallanId =
        initialDeliveryChallanId && deliveryChallans.some((c) => c.id === initialDeliveryChallanId)
          ? initialDeliveryChallanId
          : deliveryChallans[0].id;
    } else if (initialDeliveryChallanId && initialDeliveryChallanId > 0) {
      deliveryChallanId = initialDeliveryChallanId;
    }

    form.reset({
      deliveryChallanId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shippingCharges: 0,
      adjustmentAmount: 0,
      notes: defaultInvoiceNotesForSupplyOrder(supplyOrder),
      termsAndConditions:
        'Payment terms: Net 30 days. Please remit payment to the specified account.',
      salesTaxConfigurationId: 0,
      lines,
    });
  }, [
    supplyOrder.id,
    supplyOrder.supplyOrderNumber,
    supplyOrder.items,
    form,
    initialDeliveryChallanId,
    requireDeliveryChallan,
    deliveryChallans,
  ]);

  const itemBySoLineId = useMemo(() => {
    const map = new Map<number, SupplyOrderItem>();
    (supplyOrder.items ?? []).forEach((it) => map.set(it.id, it));
    return map;
  }, [supplyOrder.items]);

  const deliveryChallanSelectItems = useMemo(() => {
    const rows = deliveryChallans.map((c) => ({
      value: c.id,
      label: `${c.challanNumber} · ${new Date(c.dispatchDate).toLocaleDateString()}`,
    }));
    if (requireDeliveryChallan) return rows;
    return [{ value: 0, label: 'None (optional)' }, ...rows];
  }, [deliveryChallans, requireDeliveryChallan]);

  const lockedChallanLabel = useMemo(() => {
    if (!initialDeliveryChallanId) return '';
    const found = deliveryChallans.find((c) => c.id === initialDeliveryChallanId);
    return found
      ? `${found.challanNumber} · ${new Date(found.dispatchDate).toLocaleDateString()}`
      : `Challan #${initialDeliveryChallanId}`;
  }, [deliveryChallans, initialDeliveryChallanId]);

  const taxSelectItems = useMemo(() => {
    return [
      { value: 0, label: 'Use supply order line tax % (default)' },
      ...activeTaxOptions.map((t) => ({
        value: t.id,
        label: `${t.taxName} (${t.taxPercentage}%)`,
      })),
    ];
  }, [activeTaxOptions]);

  const createInvoiceMutation = useCreateInvoiceFromSupplyOrder({
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['supplyOrders', supplyOrderId] });
      queryClient.invalidateQueries({ queryKey: ['supplyOrders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setGeneratedInvoiceData(response.data);
      setStep('preview');
      toast({
        title: 'Invoice created',
        description: `Invoice ${response.data.invoiceNumber ?? response.data.id} created successfully.`,
      });
    },
    onError: (error: { message?: string }) => {
      toast({
        title: 'Could not create invoice',
        description: error.message || 'Request failed.',
        variant: 'destructive',
      });
      setStep('form');
    },
  });

  const buildRequestPayload = (data: InvoiceFromSupplyOrderFormValues): CreateInvoiceFromSupplyOrderRequest => {
    const lines = data.lines
      .filter((l) => l.include && l.quantity > 0 && l.supplyOrderItemId > 0)
      .map((l) => ({
        supplyOrderItemId: l.supplyOrderItemId,
        quantity: l.quantity,
      }));

    return {
      deliveryChallanId: data.deliveryChallanId && data.deliveryChallanId > 0 ? data.deliveryChallanId : null,
      invoiceDate: formatDateToISO(data.invoiceDate),
      dueDate: formatDateToISO(data.dueDate),
      shippingCharges: data.shippingCharges ?? 0,
      adjustmentAmount: data.adjustmentAmount ?? 0,
      notes: data.notes.trim(),
      termsAndConditions: data.termsAndConditions.trim(),
      salesTaxConfigurationId:
        data.salesTaxConfigurationId && data.salesTaxConfigurationId > 0
          ? data.salesTaxConfigurationId
          : null,
      lines,
    };
  };

  const handleCreateInvoice = form.handleSubmit((data) => {
    const selected = data.lines.filter((l) => l.include && l.quantity > 0);
    for (const line of selected) {
      const row = itemBySoLineId.get(line.supplyOrderItemId);
      if (!row) {
        toast({
          title: 'Invalid line',
          description: `Supply order item ${line.supplyOrderItemId} was not found.`,
          variant: 'destructive',
        });
        return;
      }
      if (row.fulfilledQuantity <= 0) {
        toast({
          title: 'Cannot invoice line',
          description: `${row.productName}: no fulfilled quantity.`,
          variant: 'destructive',
        });
        return;
      }
      if (line.quantity > row.fulfilledQuantity) {
        toast({
          title: 'Quantity too high',
          description: `${row.productName}: max invoice quantity is ${row.fulfilledQuantity} (fulfilled).`,
          variant: 'destructive',
        });
        return;
      }
    }

    setStep('generating');
    createInvoiceMutation.mutate({
      supplyOrderId,
      data: buildRequestPayload(data),
    });
  });

  const handleDownloadPDF = async () => {
    if (!invoiceTemplateRef.current || !generatedInvoiceData) return;

    try {
      setStep('generating');
      await downloadElementAsPdf(
        invoiceTemplateRef.current,
        `Invoice_${generatedInvoiceData.invoiceNumber ?? 'draft'}`
      );
      toast({
        title: 'PDF saved',
        description: 'Invoice downloaded successfully.',
      });
      onSuccess?.();
    } catch {
      toast({
        title: 'PDF failed',
        description: 'Could not generate the PDF.',
        variant: 'destructive',
      });
    } finally {
      setStep('preview');
    }
  };

  const eligibleLineCount = (supplyOrder.items ?? []).filter((i) => i.fulfilledQuantity > 0).length;

  if (step === 'form') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {eligibleLineCount === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Nothing can be invoiced yet: every line needs fulfilled quantity &gt; 0 (dispatch goods first).
          </div>
        )}

        {requireDeliveryChallan && !loadingChallans && deliveryChallans.length === 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            No delivery challans exist for this order. Create a delivery challan first, then create the
            invoice.
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleCreateInvoice} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="deliveryChallanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Delivery challan{requireDeliveryChallan ? ' *' : ''}
                    </FormLabel>
                    {lockDeliveryChallanSelection && initialDeliveryChallanId ? (
                      <>
                        <input type="hidden" {...field} />
                        <div className="flex h-11 items-center rounded-md border border-slate-200 bg-muted/50 px-3 text-sm font-semibold text-slate-800">
                          {lockedChallanLabel}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Linked from the dispatch step; sent as{' '}
                          <code className="rounded bg-slate-100 px-1">deliveryChallanId</code> on the invoice
                          request.
                        </p>
                      </>
                    ) : (
                      <>
                        <FormControl>
                          <SearchableSelect
                            items={deliveryChallanSelectItems}
                            value={field.value ?? 0}
                            onValueChange={(v) => field.onChange(Number(v))}
                            placeholder={
                              requireDeliveryChallan ? 'Select delivery challan' : 'Link to challan (optional)'
                            }
                            isLoading={loadingChallans}
                            className="h-11 w-full"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {requireDeliveryChallan
                            ? 'Required: choose the delivery challan this invoice applies to.'
                            : 'If set, must belong to this supply order. Line items may link to challan lines.'}
                        </p>
                      </>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salesTaxConfigurationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">Sales tax configuration</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        items={taxSelectItems}
                        value={field.value ?? 0}
                        onValueChange={(v) => field.onChange(Number(v))}
                        placeholder="Tax basis"
                        isLoading={loadingTaxConfigs}
                        className="h-11 w-full"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      When set, tax uses the configuration effective for the invoice date (see API).
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">Invoice date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11" {...field} />
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
                    <FormLabel className="font-semibold text-slate-700">Due date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11" {...field} />
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
                    <FormLabel className="font-semibold text-slate-700">Shipping charges</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-11"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
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
                    <FormLabel className="font-semibold text-slate-700">Adjustment amount (PKR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-11"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">Notes *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Required — reference, billing context, or internal memo"
                      className="min-h-[88px] rounded-xl border-slate-200"
                      {...field}
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
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">Terms &amp; conditions *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Payment terms"
                      className="min-h-[100px] rounded-xl border-slate-200"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-800">Invoice lines</Label>
              <p className="text-xs text-muted-foreground">
                Maps to <code className="rounded bg-slate-100 px-1">Lines[]</code>: each{' '}
                <code className="rounded bg-slate-100 px-1">supplyOrderItemId</code> +{' '}
                <code className="rounded bg-slate-100 px-1">quantity</code>. Quantity cannot exceed fulfilled
                (already invoiced amounts are validated on the server).
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10" />
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Fulfilled</TableHead>
                      <TableHead className="w-[120px] text-right">Qty to invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((fieldRow, index) => {
                      const line = form.watch(`lines.${index}`);
                      const meta = itemBySoLineId.get(line.supplyOrderItemId);
                      const disabled = !meta || meta.fulfilledQuantity <= 0;

                      return (
                        <TableRow key={fieldRow.id}>
                          <TableCell className="align-middle">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.include`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={(c) => field.onChange(!!c)}
                                      disabled={disabled}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">
                            {meta?.productName ?? '—'}
                            <span className="mt-0.5 block font-mono text-[10px] text-slate-400">
                              SO line #{line.supplyOrderItemId}
                            </span>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {meta?.fulfilledQuantity ?? 0}
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`lines.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      className="h-9 text-right tabular-nums"
                                      disabled={disabled || !line.include}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))
                                      }
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {(form.formState.errors.lines as { message?: string } | undefined)?.message && (
                <p className="text-sm text-destructive">
                  {(form.formState.errors.lines as { message?: string }).message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => onClose?.()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 gap-2 rounded-xl shadow-lg shadow-primary/15"
                disabled={createInvoiceMutation.isPending || eligibleLineCount === 0}
              >
                {createInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Create invoice
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    );
  }

  if (step === 'preview' && generatedInvoiceData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="max-h-[600px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <InvoiceTemplate ref={invoiceTemplateRef} invoice={generatedInvoiceData} />
        </div>

        <div className="flex justify-end gap-3 border-t pt-6">
          <Button
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => {
              setGeneratedInvoiceData(null);
              setStep('form');
            }}
          >
            Back
          </Button>
          <Button className="h-11 gap-2 rounded-xl" onClick={handleDownloadPDF} disabled={step === 'generating'}>
            {step === 'generating' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
