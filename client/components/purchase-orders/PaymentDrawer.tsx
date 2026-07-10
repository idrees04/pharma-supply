import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DollarSign,
  AlertCircle,
  Loader2,
  Check,
  X,
  CreditCard,
  Banknote,
  Building2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

import { poPaymentSchema, POPaymentFormData } from '@/lib/schemas';
import { useSuggestedPayment, useProcessPayment } from '@/api/services/purchaseOrders';
import { useAccountList } from '@/api/services/accounts';
import { formatCurrency, cn } from '@/lib/utils';
import { unwrapSuggestedPayment } from '@/lib/purchaseOrderPayment';
import { PaymentMode } from '@/types/api/payments';

interface PaymentDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrderId: number;
  purchaseOrderNumber: string;
  onSuccess?: () => void;
}

const PAYMENT_MODE_MAP: Record<PaymentMode, string> = {
  [PaymentMode.Cash]: 'Cash',
  [PaymentMode.Cheque]: 'Cheque',
  [PaymentMode.BankTransfer]: 'Bank Transfer',
  [PaymentMode.CreditCard]: 'Credit Card',
  [PaymentMode.DebitCard]: 'Debit Card',
};

const PAYMENT_MODE_ICONS: Record<PaymentMode, React.ReactNode> = {
  [PaymentMode.Cash]: <Banknote className="w-4 h-4" />,
  [PaymentMode.Cheque]: <CreditCard className="w-4 h-4" />,
  [PaymentMode.BankTransfer]: <Building2 className="w-4 h-4" />,
  [PaymentMode.CreditCard]: <CreditCard className="w-4 h-4" />,
  [PaymentMode.DebitCard]: <CreditCard className="w-4 h-4" />,
};

export function PaymentDrawer({
  isOpen,
  onOpenChange,
  purchaseOrderId,
  purchaseOrderNumber,
  onSuccess,
}: PaymentDrawerProps) {
  const { data: suggestedPayment, isPending: isLoadingSuggested, error: suggestionError } = useSuggestedPayment(
    isOpen ? purchaseOrderId : null
  );
  const { data: accountsList, isLoading: isLoadingAccounts } = useAccountList();
  const { mutate: processPayment, isPending: isProcessing } = useProcessPayment(purchaseOrderId);

  const form = useForm<POPaymentFormData>({
    resolver: zodResolver(poPaymentSchema),
    defaultValues: {
      accountId: 0,
      amount: 0,
      paymentDate: null,
      paymentMode: 1,
      referenceNumber: '',
      notes: '',
    },
  });

  const suggested = useMemo(() => unwrapSuggestedPayment(suggestedPayment), [suggestedPayment]);

  // Populate form with suggested payment data
  useEffect(() => {
    if (suggested && suggested.suggestedPayableAmount !== undefined) {
      form.setValue('amount', suggested.suggestedPayableAmount);
    }
  }, [suggested, form]);

  const amount = form.watch('amount');
  const paymentMode = form.watch('paymentMode');
  const accountId = form.watch('accountId');

  const selectedAccount = useMemo(() => {
    return accountsList?.find(a => a.id === accountId);
  }, [accountId, accountsList]);

  /** Matches server max payable (PO outstanding balance; advance payment allowed). */
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!suggested) return errors;

    const maxPayable = Number(suggested.suggestedPayableAmount ?? suggested.totalOutstanding ?? 0);
    const amt = typeof amount === 'number' && Number.isFinite(amount) ? amount : NaN;

    if (!amt || amt <= 0) {
      errors.push('Enter a payment amount greater than zero.');
    } else if (amt > maxPayable + 1e-6) {
      errors.push(
        `Amount cannot exceed ${formatCurrency(maxPayable)} (remaining PO outstanding balance).`
      );
    }

    if (!paymentMode || paymentMode < 1 || paymentMode > 5) {
      errors.push('Select a payment mode.');
    }

    if (!accountId || accountId < 1) {
      errors.push('Select a source account.');
    }

    if (selectedAccount && amt > 0 && amt > selectedAccount.currentBalance + 1e-6) {
      errors.push(
        `Insufficient balance in ${selectedAccount.accountName} (${formatCurrency(selectedAccount.currentBalance)} available).`
      );
    }

    return errors;
  }, [amount, paymentMode, accountId, suggested, selectedAccount]);

  const canSubmit = validationErrors.length === 0 && !isProcessing;

  const onSubmit = (data: POPaymentFormData) => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors');
      return;
    }

    const payload = {
      ...data,
      paymentDate: data.paymentDate?.trim() ? data.paymentDate : null,
    };

    processPayment(payload, {
      onSuccess: () => {
        toast.success('Payment processed successfully');
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error: any) => {
        toast.error(error.userMessage || 'Failed to process payment');
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[560px] p-0 border-l-0 flex flex-col max-h-[100dvh]">
        <div className="h-full flex flex-col focus-visible:outline-none min-h-0">
          <div className="px-6 py-5 border-b shrink-0 bg-background">
            <SheetHeader className="space-y-2 text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <SheetTitle className="text-xl font-semibold tracking-tight">Record supplier payment</SheetTitle>
                  <SheetDescription className="text-sm font-medium text-muted-foreground">
                    Purchase order{' '}
                    <span className="font-mono font-semibold text-foreground">{purchaseOrderNumber}</span>
                  </SheetDescription>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </SheetHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5 bg-muted/30">
            {/* Loading Indicator */}
            {isLoadingSuggested && !suggested && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading payment limits…</p>
              </div>
            )}

            {/* Error State */}
            <AnimatePresence>
              {suggestionError && !isLoadingSuggested && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Unable to load payment details</p>
                    <p className="text-sm text-destructive/90 mt-1">
                      Try again later or confirm this purchase order still exists.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Unified Dashboard View */}
            {suggested && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pay the supplier in advance or against received goods. Amount cannot exceed the PO outstanding balance.
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                  <SummaryTile label="Agreed order total (PKR)" value={suggested.agreedOrderTotal || 0} />
                  <SummaryTile label="Goods received value (PKR)" value={suggested.goodsReceivedValue || 0} emphasize="emerald" />
                  <SummaryTile label="Previously paid (PKR)" value={suggested.previouslyPaidAmount || 0} emphasize="blue" />
                  <SummaryTile label="Outstanding (PKR)" value={suggested.totalOutstanding || 0} emphasize="amber" />
                </div>

                <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-md">
                  <p className="text-sm font-medium opacity-90">Maximum you can pay now (PKR)</p>
                  <p className="text-3xl font-bold tracking-tight mt-1 tabular-nums">
                    {formatCurrency(suggested.suggestedPayableAmount || 0)}
                  </p>
                  <p className="text-xs opacity-90 mt-2">
                    Advance payment is allowed before goods are received, up to the outstanding PO total.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b pb-3 mb-4">
                    <p className="text-sm font-semibold">Selected account</p>
                    <Badge variant={selectedAccount ? 'default' : 'secondary'} className="text-xs font-medium">
                      {selectedAccount ? 'Ready' : 'Choose below'}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Bank</dt>
                      <dd className="font-medium mt-0.5">{selectedAccount?.bankName ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Branch</dt>
                      <dd className="font-medium mt-0.5">{selectedAccount?.bankBranch ?? '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Account number</dt>
                      <dd className="font-mono font-medium mt-0.5">{selectedAccount?.accountNumber ?? '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Available balance</dt>
                      <dd className="text-lg font-semibold text-emerald-600 tabular-nums mt-0.5">
                        {selectedAccount ? formatCurrency(selectedAccount.currentBalance) : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <Form {...form}>
                    <form id="po-payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Pay from account</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={field.value ? field.value.toString() : undefined}>
                              <FormControl>
                                <SelectTrigger className="h-11 text-base">
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accountsList?.map((a) => (
                                  <SelectItem key={a.id} value={a.id.toString()}>
                                    <div className="flex flex-col py-1 gap-0.5">
                                      <span className="font-medium">{a.accountName}</span>
                                      <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(a.currentBalance)} available</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Amount (PKR)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden />
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min={0}
                                    {...field}
                                    value={field.value === undefined || field.value === null ? '' : field.value}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      field.onChange(v === '' ? 0 : parseFloat(v));
                                    }}
                                    className="h-11 pl-8 text-base font-medium tabular-nums"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                Max {formatCurrency(suggested.suggestedPayableAmount || 0)}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentMode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Payment mode</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="h-11 text-base">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[
                                    { val: PaymentMode.Cash, label: PAYMENT_MODE_MAP[PaymentMode.Cash] },
                                    { val: PaymentMode.Cheque, label: PAYMENT_MODE_MAP[PaymentMode.Cheque] },
                                    { val: PaymentMode.BankTransfer, label: PAYMENT_MODE_MAP[PaymentMode.BankTransfer] },
                                    { val: PaymentMode.CreditCard, label: PAYMENT_MODE_MAP[PaymentMode.CreditCard] },
                                    { val: PaymentMode.DebitCard, label: PAYMENT_MODE_MAP[PaymentMode.DebitCard] },
                                  ].map((m) => (
                                    <SelectItem key={m.val} value={m.val.toString()} className="text-base">
                                      <span className="flex items-center gap-2">
                                        {PAYMENT_MODE_ICONS[m.val as PaymentMode]}
                                        {m.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="paymentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Payment date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} value={field.value ?? ''} className="h-11 text-base" />
                              </FormControl>
                              <FormDescription className="text-xs">Leave empty to use today on the server.</FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="referenceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Reference number</FormLabel>
                              <FormControl>
                                <Input placeholder="Cheque / transfer ref." {...field} className="h-11 text-base" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional internal note" {...field} className="h-11 text-base" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>

                {validationErrors.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Fix before paying</p>
                        <ul className="text-sm text-amber-900/90 dark:text-amber-50/90 list-disc pl-4 space-y-1">
                          {validationErrors.map((msg) => (
                            <li key={msg}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t bg-background shrink-0 space-y-2">
            <Button
              type="submit"
              form="po-payment-form"
              className="w-full h-12 rounded-lg gap-2 text-base font-semibold"
              disabled={!canSubmit || isProcessing || !suggested || isLoadingAccounts}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Pay {suggested ? formatCurrency(amount || 0) : ''}
            </Button>
            {isLoadingAccounts && (
              <p className="text-xs text-center text-muted-foreground">Loading accounts…</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryTile({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: 'emerald' | 'blue' | 'amber';
}) {
  const valueClass =
    emphasize === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-400'
      : emphasize === 'blue'
        ? 'text-blue-700 dark:text-blue-400'
        : emphasize === 'amber'
          ? 'text-amber-700 dark:text-amber-400'
          : 'text-foreground';

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums mt-1', valueClass)}>{formatCurrency(value)}</p>
    </div>
  );
}
