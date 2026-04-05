import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useAccountList } from '@/hooks/accounts';
import { useCreateAccountTransfer } from '@/hooks/accountTransfers';
import { CreateAccountTransferRequest } from '@/types/api/accountTransfers';
import { AccountTypeLabels } from '@/types/api/accounts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { AccountTransferFormData, accountTransferSchema } from '@/lib/schemas';

interface AccountTransferFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<AccountTransferFormData>;
}

export default function AccountTransferForm({ 
  onSuccess, 
  onCancel,
  initialData 
}: AccountTransferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch accounts data
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccountList();
  const createAccountTransfer = useCreateAccountTransfer();

  // Filter active accounts
  const activeAccounts = useMemo(() => 
    accounts.filter(account => account.isActive),
    [accounts]
  );

  const form = useForm<AccountTransferFormData>({
    resolver: zodResolver(accountTransferSchema),
    defaultValues: {
      transferDate: initialData?.transferDate || format(new Date(), 'yyyy-MM-dd'),
      fromAccountId: initialData?.fromAccountId,
      toAccountId: initialData?.toAccountId,
      amount: initialData?.amount || 0,
      referenceNumber: initialData?.referenceNumber || '',
      notes: initialData?.notes || '',
    },
  });

  // Watch form values for real-time validation
  const fromAccountId = form.watch('fromAccountId');
  const toAccountId = form.watch('toAccountId');
  const amount = form.watch('amount');
  const transferDate = form.watch('transferDate');

  // Find selected accounts
  const fromAccount = activeAccounts.find(account => account.id === fromAccountId);
  const toAccount = activeAccounts.find(account => account.id === toAccountId);

  // Filter accounts for dropdowns (exclude selected account from opposite dropdown)
  const fromAccountOptions = useMemo(() => 
    activeAccounts.filter(account => account.id !== toAccountId),
    [activeAccounts, toAccountId]
  );

  const toAccountOptions = useMemo(() => 
    activeAccounts.filter(account => account.id !== fromAccountId),
    [activeAccounts, fromAccountId]
  );

  const onSubmit = async (data: AccountTransferFormData) => {
    if (!fromAccount) {
      toast.error('Please select a valid source account');
      return;
    }

    if (!toAccount) {
      toast.error('Please select a valid destination account');
      return;
    }

    if (fromAccount.currentBalance < data.amount) {
      toast.error(`Insufficient balance in ${fromAccount.accountName}. Available: ${formatCurrency(fromAccount.currentBalance)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: CreateAccountTransferRequest = {
        transferDate: new Date(data.transferDate).toISOString(),
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
      };

      await createAccountTransfer.mutateAsync(requestData, {
        onSuccess: () => {
          toast.success('Account transfer created successfully!');
          form.reset();
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(error.userMessage || 'Failed to create account transfer');
        },
      });
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  };

  if (isLoadingAccounts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">New Internal Transfer</h2>
        <p className="text-muted-foreground">
          Transfer funds between accounts within the organization
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* From Account Card */}
            <motion.div variants={cardVariants}>
              <Card className={cn(
                "border-2 transition-all duration-300",
                fromAccount ? "border-blue-200 bg-blue-50/50" : "border-gray-200"
              )}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">From Account </h3>
                      {fromAccount && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {AccountTypeLabels[fromAccount.accountType]}
                        </Badge>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="fromAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Select Source Account</FormLabel>
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Choose account to transfer from" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fromAccountOptions.map((account) => (
                                <SelectItem 
                                  key={account.id} 
                                  value={account.id.toString()}
                                  className="py-3"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{account.accountName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {account.accountNumber} • {formatCurrency(account.currentBalance)}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {fromAccount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 pt-4 border-t"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Current Balance</span>
                          <span className="font-semibold">{formatCurrency(fromAccount.currentBalance)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">After Transfer</span>
                          <span className={cn(
                            "font-semibold",
                            fromAccount.currentBalance - amount < 0 ? "text-red-600" : "text-green-600"
                          )}>
                            {formatCurrency(Math.max(0, fromAccount.currentBalance - amount))}
                          </span>
                        </div>
                        {fromAccount.currentBalance - amount < 0 && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            ⚠️ This transfer will result in a negative balance
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* To Account Card */}
            <motion.div variants={cardVariants}>
              <Card className={cn(
                "border-2 transition-all duration-300",
                toAccount ? "border-green-200 bg-green-50/50" : "border-gray-200"
              )}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">To Account</h3>
                      {toAccount && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {AccountTypeLabels[toAccount.accountType]}
                        </Badge>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="toAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Select Destination Account</FormLabel>
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Choose account to transfer to" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {toAccountOptions.map((account) => (
                                <SelectItem 
                                  key={account.id} 
                                  value={account.id.toString()}
                                  className="py-3"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{account.accountName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {account.accountNumber} • {formatCurrency(account.currentBalance)}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {toAccount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 pt-4 border-t"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Current Balance</span>
                          <span className="font-semibold">{formatCurrency(toAccount.currentBalance)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">After Transfer</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(toAccount.currentBalance + amount)}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Transfer Details Card */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Transfer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transfer Amount *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ₹
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8 text-lg font-medium"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the amount to transfer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transferDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transfer Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Date when transfer should be recorded
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., TRF-001-2024" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional reference for tracking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-6" />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes about this transfer..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes for internal reference
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary and Actions */}
          <motion.div
            variants={cardVariants}
            className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Transfer Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {fromAccount && toAccount && amount > 0 && (
                    <>
                      <p>Transferring {formatCurrency(amount)} from {fromAccount.accountName} to {toAccount.accountName}</p>
                      <p>Date: {new Date(transferDate).toLocaleDateString()}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !fromAccountId || !toAccountId || amount <= 0}
                  className="min-w-[120px] bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Processing...
                    </>
                  ) : (
                    'Create Transfer'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );
}