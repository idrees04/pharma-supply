import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { outstandingExTaxForInvoice, outstandingTaxExclusive, taxExclusiveCollectible, totalInvoiceDeductions } from '@/lib/invoiceReceivable';
import { cn, formatCurrency } from '@/lib/utils';
import { useInvoice, useProcessInvoicePayment } from '@/hooks/invoices';
import { usePaymentModeEnumOptions } from '@/hooks/dropdown';
import { useAccountList } from '@/api/services/accounts';
import type { AccountDto } from '@/types/api/accounts';
import { InvoiceTemplate } from '@/pages/supply/InvoiceTemplate';
import { InvoiceStatus, type InvoiceDto } from '@/types/api/invoices';
import { getInvoiceStatusClassName, getInvoiceStatusLabel } from '@/lib/invoiceStatusDisplay';
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

const paymentFieldsSchema = z.object({
  accountId: z.coerce.number().min(1, 'Select an account'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  lateDeliveryDeduction: z.coerce.number().min(0, 'Cannot be negative'),
  incomeTaxDeduction: z.coerce.number().min(0, 'Cannot be negative'),
  salesTaxDeduction: z.coerce.number().min(0, 'Cannot be negative'),
  paymentMode: z.coerce.number(),
  paymentDate: z.string().min(1, 'Date is required'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFieldsSchema>;

const AMOUNT_CHECK_EPS = 0.01;

function buildPaymentSchema(invoice: InvoiceDto) {
  const maxDed = invoice.totalAmount - invoice.taxAmount;
  return paymentFieldsSchema.superRefine((data, ctx) => {
    const totalDed = totalInvoiceDeductions(data);
    if (totalDed > maxDed + AMOUNT_CHECK_EPS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total deductions cannot exceed tax-exclusive invoice total (${formatCurrency(maxDed)})`,
        path: ['lateDeliveryDeduction'],
      });
    }
    const maxPay = outstandingTaxExclusive(
      invoice.totalAmount,
      invoice.taxAmount,
      totalDed,
      invoice.paidAmount
    );
    if (data.amount > maxPay + AMOUNT_CHECK_EPS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Amount cannot exceed tax-exclusive outstanding (${formatCurrency(maxPay)})`,
        path: ['amount'],
      });
    }
  });
}

type PaymentModeOption = { value: number; displayName: string };

function RecordPaymentCard({
  invoice,
  accounts,
  paymentModeOptions,
  loadingModes,
  isRecording,
  onSubmit,
}: {
  invoice: InvoiceDto;
  accounts: AccountDto[] | undefined;
  paymentModeOptions: PaymentModeOption[] | undefined;
  loadingModes: boolean;
  isRecording: boolean;
  onSubmit: (values: PaymentFormValues) => void;
}) {
  const defaultsLate = invoice.lateDeliveryDeduction ?? 0;
  const defaultsIncome = invoice.incomeTaxDeduction ?? 0;
  const defaultsSales = invoice.salesTaxDeduction ?? 0;
  const defaultTotalDed = totalInvoiceDeductions(invoice);
  const defaultOutstanding = outstandingTaxExclusive(
    invoice.totalAmount,
    invoice.taxAmount,
    defaultTotalDed,
    invoice.paidAmount
  );
  const paymentSchema = useMemo(() => buildPaymentSchema(invoice), [invoice]);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      accountId: 0,
      amount: defaultOutstanding,
      lateDeliveryDeduction: defaultsLate,
      incomeTaxDeduction: defaultsIncome,
      salesTaxDeduction: defaultsSales,
      paymentMode: PaymentMode.BankTransfer,
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: '',
    },
  });

  const watchedLate = useWatch({ control: form.control, name: 'lateDeliveryDeduction' });
  const watchedIncome = useWatch({ control: form.control, name: 'incomeTaxDeduction' });
  const watchedSales = useWatch({ control: form.control, name: 'salesTaxDeduction' });
  const liveTotalDeduction = totalInvoiceDeductions({
    lateDeliveryDeduction: Number(watchedLate) || 0,
    incomeTaxDeduction: Number(watchedIncome) || 0,
    salesTaxDeduction: Number(watchedSales) || 0,
  });
  const liveExTaxDue = outstandingTaxExclusive(
    invoice.totalAmount,
    invoice.taxAmount,
    liveTotalDeduction,
    invoice.paidAmount
  );

  const syncCashReceivedFromDeductions = (deductions: {
    lateDeliveryDeduction: number;
    incomeTaxDeduction: number;
    salesTaxDeduction: number;
  }) => {
    form.setValue(
      'amount',
      outstandingTaxExclusive(
        invoice.totalAmount,
        invoice.taxAmount,
        totalInvoiceDeductions(deductions),
        invoice.paidAmount
      ),
      { shouldValidate: true }
    );
  };

  const handleDeductionChange = (
    field: 'lateDeliveryDeduction' | 'incomeTaxDeduction' | 'salesTaxDeduction',
    rawValue: string
  ) => {
    const parsed = Number(rawValue) || 0;
    const next = {
      lateDeliveryDeduction: Number(watchedLate) || 0,
      incomeTaxDeduction: Number(watchedIncome) || 0,
      salesTaxDeduction: Number(watchedSales) || 0,
      [field]: parsed,
    };
    form.setValue(field, parsed, { shouldValidate: true });
    syncCashReceivedFromDeductions(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record payment</CardTitle>
        <CardDescription>
          <span className="block">
            Amount due before this payment (ex. sales tax, PKR):{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(
                outstandingTaxExclusive(
                  invoice.totalAmount,
                  invoice.taxAmount,
                  defaultTotalDed,
                  invoice.paidAmount
                )
              )}
            </span>
          </span>
          <span className="mt-1 block text-xs">
            Legal invoice total and PDF remain inclusive of tax; only supplier collections use ex-tax
            figures.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Deductions (cumulative, PKR)</p>
              <div className="grid gap-4 sm:grid-cols-1">
                <FormField
                  control={form.control}
                  name="lateDeliveryDeduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Late delivery / other deduction</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(e) => handleDeductionChange('lateDeliveryDeduction', e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incomeTaxDeduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Income tax deduction</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(e) => handleDeductionChange('incomeTaxDeduction', e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salesTaxDeduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales tax deduction</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(e) => handleDeductionChange('salesTaxDeduction', e.target.value)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Combined deductions (max {formatCurrency(invoice.totalAmount - invoice.taxAmount)} ex. tax):{' '}
                <span className="font-medium text-foreground">{formatCurrency(liveTotalDeduction)}</span>
              </p>
              <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <span className="font-medium text-amber-900">Remaining payable (ex. tax)</span>
                <span className="font-bold tabular-nums text-amber-900">{formatCurrency(liveExTaxDue)}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cash received (ex. tax, PKR) *</FormLabel>
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
  );
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

  const outstandingExTax = useMemo(
    () => (invoice ? outstandingExTaxForInvoice(invoice) : 0),
    [invoice]
  );

  /** Ex-tax amount still to collect; do not rely on API `outstandingAmount` alone (can disagree with model). */
  const collectionSettled = outstandingExTax <= 0.005;

  const canRecordPayment =
    !!invoice &&
    validId &&
    !collectionSettled &&
    invoice.status !== InvoiceStatus.Paid &&
    invoice.status !== InvoiceStatus.Cancelled &&
    hasPermission('invoices', 'update');

  const showFullyPaidBanner =
    !!invoice &&
    invoice.status !== InvoiceStatus.Cancelled &&
    (collectionSettled || invoice.status === InvoiceStatus.Paid);

  const handleRecordPayment = (values: PaymentFormValues) => {
    if (!validId) return;
    recordPayment(
      {
        accountId: values.accountId,
        amount: values.amount,
        lateDeliveryDeduction: values.lateDeliveryDeduction,
        incomeTaxDeduction: values.incomeTaxDeduction,
        salesTaxDeduction: values.salesTaxDeduction,
        paymentMode: values.paymentMode,
        paymentDate: new Date(values.paymentDate).toISOString(),
        referenceNumber: values.referenceNumber?.trim() || '',
        notes: values.notes?.trim() || '',
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
            <RecordPaymentCard
              key={`pay-${invoice.id}-${outstandingExTax}-${invoice.paidAmount}-${invoice.lateDeliveryDeduction ?? 0}-${invoice.incomeTaxDeduction ?? 0}-${invoice.salesTaxDeduction ?? 0}`}
              invoice={invoice}
              accounts={accounts}
              paymentModeOptions={paymentModeOptions}
              loadingModes={loadingModes}
              isRecording={isRecording}
              onSubmit={handleRecordPayment}
            />
          ) : showFullyPaidBanner ? (
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
  const lateDed = invoice.lateDeliveryDeduction ?? 0;
  const incomeDed = invoice.incomeTaxDeduction ?? 0;
  const salesDed = invoice.salesTaxDeduction ?? 0;
  const totalDed = totalInvoiceDeductions(invoice);
  const outstandingEx = outstandingExTaxForInvoice(invoice);
  const collectible =
    invoice.taxExclusiveCollectibleAmount ??
    taxExclusiveCollectible(invoice.totalAmount, invoice.taxAmount, totalDed);

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
          <span className="text-muted-foreground">Invoice total (incl. tax)</span>
          <span className="font-semibold tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sales tax on invoice</span>
          <span className="font-semibold tabular-nums text-blue-700">{formatCurrency(invoice.taxAmount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Collectible (ex. tax)</span>
          <span className="font-semibold tabular-nums">{formatCurrency(collectible)}</span>
        </div>
        {lateDed > 0 ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Late delivery / other deduction</span>
            <span className="font-semibold tabular-nums text-red-700">−{formatCurrency(lateDed)}</span>
          </div>
        ) : null}
        {incomeDed > 0 ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Income tax deduction</span>
            <span className="font-semibold tabular-nums text-red-700">−{formatCurrency(incomeDed)}</span>
          </div>
        ) : null}
        {salesDed > 0 ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Sales tax deduction</span>
            <span className="font-semibold tabular-nums text-red-700">−{formatCurrency(salesDed)}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Received (ex. tax)</span>
          <span className="font-semibold tabular-nums text-emerald-700">{formatCurrency(invoice.paidAmount)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t pt-3">
          <span className="text-muted-foreground">Outstanding (ex. tax)</span>
          <span
            className={cn(
              'font-bold tabular-nums',
              outstandingEx > 0.005 ? 'text-amber-700' : 'text-emerald-700'
            )}
          >
            {formatCurrency(outstandingEx)}
          </span>
        </div>
        {invoice.estimatedContributionMargin != null ? (
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Estimated contribution margin (display only, PKR):{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(invoice.estimatedContributionMargin)}
            </span>
          </p>
        ) : null}
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
