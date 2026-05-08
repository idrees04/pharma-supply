import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { EnumSelect } from '@/components/ui/enum-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { downloadElementAsPdf } from '@/lib/downloadPdf';
import { cn, formatCurrency } from '@/lib/utils';
import { useInvoice, useProcessInvoicePayment } from '@/hooks/invoices';
import { usePaymentModeEnumOptions } from '@/hooks/dropdown';
import { useAccountList } from '@/api/services/accounts';
import { InvoiceTemplate } from '@/pages/supply/InvoiceTemplate';
import { InvoiceStatus, type InvoiceDto } from '@/types/api/invoices';
import { PaymentMode } from '@/types/api/payments';
import { useAuth } from '@/context/AuthContext';

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInvoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.Draft:
      return 'Draft';
    case InvoiceStatus.Sent:
      return 'Sent';
    case InvoiceStatus.PartiallyPaid:
      return 'Partially Paid';
    case InvoiceStatus.Paid:
      return 'Paid';
    case InvoiceStatus.Overdue:
      return 'Overdue';
    case InvoiceStatus.Cancelled:
      return 'Cancelled';
    case InvoiceStatus.Refunded:
      return 'Refunded';
    case InvoiceStatus.Disputed:
      return 'Disputed';
    default:
      return 'Unknown';
  }
}

function getInvoiceStatusClassName(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.Paid:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case InvoiceStatus.Overdue:
      return 'bg-red-50 text-red-700 border-red-200';
    case InvoiceStatus.PartiallyPaid:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case InvoiceStatus.Cancelled:
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case InvoiceStatus.Sent:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

const paymentFieldsSchema = z.object({
  accountId: z.coerce.number().min(1, 'Select an account'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentMode: z.coerce.number(),
  paymentDate: z.string().min(1, 'Date is required'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFieldsSchema>;

function buildPaymentSchema(maxAmount: number) {
  return paymentFieldsSchema.refine((data) => data.amount <= maxAmount + 0.005, {
    message: `Amount cannot exceed outstanding (${formatCurrency(maxAmount)})`,
    path: ['amount'],
  });
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const invoiceId = useMemo(() => {
    const n = parseInt(id ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [id]);
  const validId = invoiceId > 0;

  const { data: invoiceRes, isPending, error } = useInvoice(validId ? invoiceId : null);
  const invoice = invoiceRes?.data;

  const { data: accounts } = useAccountList();
  const { data: paymentModeOptions, isLoading: loadingModes } = usePaymentModeEnumOptions();
  const { mutate: recordPayment, isPending: isRecording } = useProcessInvoicePayment(invoiceId);

  const outstanding = invoice?.outstandingAmount ?? 0;

  const canRecordPayment =
    !!invoice &&
    validId &&
    outstanding > 0 &&
    invoice.status !== InvoiceStatus.Cancelled &&
    hasPermission('invoices', 'update');

  const paymentSchema = useMemo(
    () => buildPaymentSchema(canRecordPayment ? outstanding : Number.MAX_SAFE_INTEGER),
    [canRecordPayment, outstanding],
  );

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      accountId: 0,
      amount: 0,
      paymentMode: PaymentMode.BankTransfer,
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!invoice) return;
    form.reset({
      accountId: 0,
      amount: invoice.outstandingAmount,
      paymentMode: PaymentMode.BankTransfer,
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: '',
    });
  }, [invoice?.id, invoice?.outstandingAmount, invoice, form.reset]);

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !invoice) return;
    setPdfBusy(true);
    try {
      await downloadElementAsPdf(
        pdfRef.current,
        `Invoice_${invoice.invoiceNumber ?? invoice.id}`
      );
      toast.success('Invoice PDF downloaded');
    } catch {
      toast.error('Could not generate PDF');
    } finally {
      setPdfBusy(false);
    }
  };

  const onSubmitPayment = (values: PaymentFormValues) => {
    if (!validId || !invoice) return;
    recordPayment(
      {
        accountId: values.accountId,
        amount: values.amount,
        paymentMode: values.paymentMode,
        paymentDate: new Date(values.paymentDate).toISOString(),
        referenceNumber: values.referenceNumber?.trim() || null,
        notes: values.notes?.trim() || null,
      },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Payment recorded');
        },
        onError: (err) => {
          toast.error(err.userMessage || 'Could not record payment');
        },
      }
    );
  };

  if (!validId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Invalid invoice</CardTitle>
            <CardDescription>The invoice ID in the URL is not valid.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm">Loading invoice…</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </Link>
        </Button>
        <Card className="border-red-200 bg-red-50/80">
          <CardHeader>
            <CardTitle className="text-red-900">Unable to load invoice</CardTitle>
            <CardDescription className="text-red-800">
              {error?.userMessage ?? 'Invoice not found or you may not have access.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/invoices">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {invoice.invoiceNumber ?? `Invoice #${invoice.id}`}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoice.hospitalName ?? `Hospital #${invoice.hospitalId}`}
            </p>
          </div>
          <Badge variant="outline" className={cn('font-medium', getInvoiceStatusClassName(invoice.status))}>
            {getInvoiceStatusLabel(invoice.status)}
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pdfBusy}
          onClick={handleDownloadPdf}
        >
          {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.85fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-base">Invoice</CardTitle>
            <CardDescription>Print layout matches PDF download.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto bg-slate-100/80 p-6">
            <div className="flex justify-center">
              <InvoiceTemplate ref={pdfRef} invoice={invoice} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <SummaryCard invoice={invoice} />

          {canRecordPayment ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record payment</CardTitle>
                <CardDescription>
                  Outstanding {formatCurrency(outstanding)} — amount cannot exceed this balance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    key={invoice.id}
                    onSubmit={form.handleSubmit(onSubmitPayment)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account *</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={field.value ? String(field.value) : ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts?.map((acc) => (
                                <SelectItem key={acc.id} value={String(acc.id)}>
                                  {acc.accountName}
                                  {acc.bankName ? ` (${acc.bankName})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="paymentMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment mode *</FormLabel>
                            <FormControl>
                              <EnumSelect
                                items={paymentModeOptions}
                                value={field.value}
                                onValueChange={field.onChange}
                                isLoading={loadingModes}
                                placeholder="Select mode"
                                searchPlaceholder="Search modes…"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment date *</FormLabel>
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (PKR) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="referenceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference</FormLabel>
                            <FormControl>
                              <Input placeholder="Cheque / transaction ref" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full gap-2 sm:w-auto" disabled={isRecording}>
                      {isRecording ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Record payment
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : outstanding <= 0 && invoice.status !== InvoiceStatus.Cancelled ? (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <CardTitle className="text-base text-emerald-900">Fully paid</CardTitle>
                <CardDescription className="text-emerald-800">
                  No outstanding balance on this invoice.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ invoice }: { invoice: InvoiceDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Invoice date</span>
          <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Due date</span>
          <span className="font-medium">{formatDate(invoice.dueDate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total (PKR)</span>
          <span className="font-semibold tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Paid (PKR)</span>
          <span className="font-semibold tabular-nums text-emerald-700">{formatCurrency(invoice.paidAmount)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t pt-3">
          <span className="text-muted-foreground">Outstanding (PKR)</span>
          <span
            className={cn(
              'font-bold tabular-nums',
              invoice.outstandingAmount > 0 ? 'text-amber-700' : 'text-emerald-700'
            )}
          >
            {formatCurrency(invoice.outstandingAmount)}
          </span>
        </div>
        {invoice.supplyOrderId ? (
          <div className="flex justify-between gap-4 pt-1">
            <span className="text-muted-foreground">Supply order</span>
            <Link
              className="font-medium text-primary hover:underline"
              to={`/supply-orders/view/${invoice.supplyOrderId}`}
            >
              #{invoice.supplyOrderId}
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
