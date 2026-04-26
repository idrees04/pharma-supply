import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { poPaymentSchema, POPaymentFormData } from '@/lib/schemas';
import { useSuggestedPayment, useProcessPayment } from '@/api/services/purchaseOrders';
import { useAccountList } from '@/api/services/accounts';
import { formatCurrency, cn } from '@/lib/utils';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
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
  const { mutate: processPayment, isPending: isProcessing, error: paymentError } = useProcessPayment(purchaseOrderId);

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

  // Safely extract the suggestion data with debug logging
  const suggested = useMemo(() => {
    if (!suggestedPayment) return null;

    // The API wraps data in a 'data' property
    // Our service layer returns response.data (the body)
    // So suggestedPayment is { success, message, data, ... }
    const nestedData = (suggestedPayment as any).data;

    // Robust check: use nested data if it exists, otherwise fallback to top level
    const finalData = nestedData && typeof nestedData === 'object' ? nestedData : suggestedPayment;

    return finalData;
  }, [suggestedPayment]);

  // Populate form with suggested payment data
  useEffect(() => {
    if (suggested && suggested.suggestedPayableAmount !== undefined) {
      form.setValue('amount', suggested.suggestedPayableAmount);
    }
  }, [suggested, form]);

  const selectedAccountId = form.watch('accountId');
  const selectedAccount = useMemo(() => {
    return accountsList?.find(a => a.id === selectedAccountId);
  }, [selectedAccountId, accountsList]);

  // Business rule validations - Optimized for instant feedback
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const amount = form.watch('amount');
    const paymentMode = form.watch('paymentMode');
    const accountId = form.watch('accountId');

    if (!suggested) return errors;

    const { totalOutstanding, goodsReceivedValue } = suggested;

    if (amount > totalOutstanding) {
      errors.push(`Exceeds Outstanding (${formatCurrency(totalOutstanding)})`);
    }

    if (amount > goodsReceivedValue) {
      errors.push(`Exceeds Goods Received (${formatCurrency(goodsReceivedValue)})`);
    }

    if (!paymentMode || paymentMode < 1 || paymentMode > 5) {
      errors.push('Select valid mode');
    }

    if (!accountId || accountId < 1) {
      errors.push('Account required');
    }

    return errors;
  }, [form.watch('amount'), form.watch('paymentMode'), form.watch('accountId'), suggested]);

  const canSubmit = validationErrors.length === 0 && !isProcessing;

  const onSubmit = (data: POPaymentFormData) => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors');
      return;
    }

    processPayment(data, {
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
      <SheetContent className="w-full sm:max-w-[450px] p-0 border-l-0 overflow-hidden flex flex-col">
        <div className="h-full flex flex-col focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 py-4 border-b sticky top-0 z-10 bg-white"
          >
            <SheetHeader className="space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-lg font-bold">Process Payment</SheetTitle>
                  <SheetDescription className="text-[10px] uppercase font-bold tracking-tight">
                    PO <span className="font-mono text-primary">{purchaseOrderNumber}</span>
                  </SheetDescription>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </SheetHeader>
          </motion.div>

          {/* Content - Optimized for Zero Scroll */}
          <div className="flex-1 overflow-hidden px-5 py-4 space-y-3 bg-slate-50/30">
            {/* Loading Indicator */}
            {isLoadingSuggested && !suggested && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fetching Insights...</p>
              </div>
            )}

            {/* Error State */}
            <AnimatePresence>
              {suggestionError && !isLoadingSuggested && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Unable to Load Details</p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Unified Dashboard View */}
            {suggested && (
              <div className="space-y-4">
                {/* Financial Summary Strip */}
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-sm flex flex-col justify-center">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Agreed</p>
                    <p className="text-[10px] font-bold text-slate-900 truncate">{formatCurrency(suggested.agreedOrderTotal || 0)}</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-sm flex flex-col justify-center">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Recvd</p>
                    <p className="text-[10px] font-bold text-emerald-600 truncate">{formatCurrency(suggested.goodsReceivedValue || 0)}</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-sm flex flex-col justify-center">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Paid</p>
                    <p className="text-[10px] font-bold text-blue-600 truncate">{formatCurrency(suggested.previouslyPaidAmount || 0)}</p>
                  </div>
                  <div className="bg-orange-50/50 border border-orange-100 p-2 rounded-xl shadow-sm flex flex-col justify-center">
                    <p className="text-[7px] font-black text-orange-400 uppercase tracking-tighter mb-0.5">Outstanding</p>
                    <p className="text-[10px] font-black text-orange-600 truncate">{formatCurrency(suggested.totalOutstanding || 0)}</p>
                  </div>
                </div>

                {/* Decision Layer - Zero Scroll Optimized */}
                <div className="space-y-2">
                  {/* Suggested Payment - New Premium Gradient */}
                  <div className="relative p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg shadow-indigo-200 overflow-hidden border border-white/10 flex items-center justify-between">
                    <div className="absolute right-0 top-0 p-2 opacity-10">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[7px] font-black uppercase tracking-widest text-white/60 mb-0.5">Suggested Payment</p>
                      <p className="text-xl font-black text-white tracking-tighter">
                        {formatCurrency(suggested.suggestedPayableAmount || 0)}
                      </p>
                    </div>
                    <Badge className="relative z-10 bg-white/20 text-white border-0 font-black text-[7px] h-4">SMART VALUE</Badge>
                  </div>

                  {/* Account Insights - Detailed but Compact */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-3 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                      <p className="text-[8px] font-black text-slate-800 uppercase tracking-tight">Source Account Insights</p>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", selectedAccount ? "bg-emerald-500" : "bg-slate-300")} />
                        <p className="text-[8px] font-bold text-slate-400 uppercase">{selectedAccount ? 'Active' : 'Pending Selection'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">Bank / Institution</p>
                        <p className="text-[9px] font-bold text-slate-700 truncate">{selectedAccount?.bankName || '---'}</p>
                      </div>
                      <div>
                        <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">Branch / Loc</p>
                        <p className="text-[9px] font-bold text-slate-700 truncate">{selectedAccount?.bankBranch || '---'}</p>
                      </div>
                      <div>
                        <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">Account Number</p>
                        <p className="text-[9px] font-mono font-bold text-slate-500 truncate">{selectedAccount?.accountNumber || '---'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">Available Funds</p>
                        <p className="text-[10px] font-black text-emerald-600 truncate">
                          {selectedAccount ? formatCurrency(selectedAccount.currentBalance) : '---'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* High Density Form Layer */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="accountId"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-[8px] font-black uppercase text-slate-500">Source Account</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="h-9 rounded-xl bg-slate-50/50 border-slate-100 text-[11px] font-bold">
                                    <SelectValue placeholder="Choose account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl border-slate-100">
                                  {accountsList?.map(a => (
                                    <SelectItem key={a.id} value={a.id.toString()} className="rounded-lg">
                                      <div className="flex flex-col py-0.5">
                                        <span className="text-xs font-bold">{a.accountName}</span>
                                        <span className="text-[9px] text-slate-400">{formatCurrency(a.currentBalance)}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[8px] font-black uppercase text-slate-500">Payment Amount</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    className="h-9 pl-7 rounded-xl bg-slate-50/50 border-slate-100 font-mono font-black text-xs"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentMode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[8px] font-black uppercase text-slate-500">Mode</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="h-9 rounded-xl bg-slate-50/50 border-slate-100 text-[11px] font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl border-slate-100">
                                  {[
                                    { val: 1, label: 'Cash' }, { val: 2, label: 'Cheque' },
                                    { val: 3, label: 'Transfer' }, { val: 4, label: 'Credit' }, { val: 5, label: 'Debit' }
                                  ].map(m => (
                                    <SelectItem key={m.val} value={m.val.toString()} className="text-xs">{m.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[8px] font-black uppercase text-slate-500">Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="h-9 px-2 rounded-xl bg-slate-50/50 border-slate-100 text-[10px] font-bold" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="referenceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[8px] font-black uppercase text-slate-500">Reference #</FormLabel>
                              <FormControl>
                                <Input placeholder="Optional" {...field} className="h-9 rounded-xl bg-slate-50/50 border-slate-100 text-[11px] font-bold" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[8px] font-black uppercase text-slate-500">Internal Notes</FormLabel>
                              <FormControl>
                                <Input placeholder="Brief remarks..." {...field} className="h-9 rounded-xl bg-slate-50/50 border-slate-100 text-[11px] font-bold" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </div>

                {/* Status Bar */}
                {validationErrors.length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl px-4 py-2 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <p className="text-[9px] font-black text-amber-800 uppercase tracking-tight truncate flex-1">
                      {validationErrors[0]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-white">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              className="w-full h-11 rounded-xl gap-2 font-black shadow-md shadow-primary/10 active:scale-95 transition-all text-xs"
              disabled={!canSubmit || isProcessing || !suggested}
            >
              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Settle {suggested && formatCurrency(form.watch('amount'))}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  interface FinancialDetailCardProps {
    label: string;
    value: number;
    color: string;
    icon?: React.ReactNode;
    description?: string;
    isBold?: boolean;
  }

  function FinancialDetailCard({ label, value, color, icon, description, isBold }: FinancialDetailCardProps) {
    return (
      <motion.div
        variants={itemVariants}
        className={cn(
          'rounded-3xl p-5 border shadow-sm transition-all duration-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between h-full',
          color,
          isBold ? 'ring-1 ring-orange-200' : ''
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-50 group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
            {isBold && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 font-black text-[7px] px-1.5 h-4">
                ACTION REQ
              </Badge>
            )}
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              {label}
            </p>
            <p className={cn(
              'font-mono tracking-tighter leading-none',
              isBold ? 'text-2xl font-black text-slate-900' : 'text-xl font-bold text-slate-800'
            )}>
              {formatCurrency(value)}
            </p>
          </div>
        </div>

        {description && (
          <p className="text-[9px] font-medium text-slate-400 mt-3 line-clamp-1 italic">
            {description}
          </p>
        )}
      </motion.div>
    );
  }
}
