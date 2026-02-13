import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore, InternalTransfer } from '@/hooks/useStore';
import { internalTransferSchema, InternalTransferFormData } from '@/lib/schemas';
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
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface InternalTransferFormProps {
  transfer?: InternalTransfer;
  onClose: () => void;
}

export default function InternalTransferForm({ transfer, onClose }: InternalTransferFormProps) {
  const addInternalTransfer = useStore((state) => state.addInternalTransfer);
  const updateInternalTransfer = useStore((state) => state.updateInternalTransfer);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const updateBankAccount = useStore((state) => state.updateBankAccount);

  const form = useForm<InternalTransferFormData>({
    resolver: zodResolver(internalTransferSchema),
    defaultValues: transfer ? {
      fromAccountId: transfer.fromAccountId,
      toAccountId: transfer.toAccountId,
      amount: transfer.amount,
      referenceNo: transfer.referenceNo,
      date: transfer.date,
      notes: transfer.notes,
    } : {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      notes: '',
    },
  });

  const fromAccountId = form.watch('fromAccountId');
  const toAccountId = form.watch('toAccountId');
  const amount = form.watch('amount');

  const fromAccount = bankAccounts.find((a) => a.id === fromAccountId);
  const toAccount = bankAccounts.find((a) => a.id === toAccountId);

  const onSubmit = (data: InternalTransferFormData) => {
    try {
      if (!fromAccount || !toAccount) {
        toast.error('Please select valid accounts');
        return;
      }

      if (fromAccount.balance < data.amount) {
        toast.error('Insufficient balance in source account');
        return;
      }

      if (fromAccountId === toAccountId) {
        toast.error('Cannot transfer to the same account');
        return;
      }

      const transferData: Omit<InternalTransfer, 'id' | 'createdAt'> = {
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        referenceNo: data.referenceNo,
        date: data.date,
        notes: data.notes || '',
      };

      if (transfer) {
        // Reverse the old transfer
        const oldFromAccount = bankAccounts.find((a) => a.id === transfer.fromAccountId);
        const oldToAccount = bankAccounts.find((a) => a.id === transfer.toAccountId);
        if (oldFromAccount && oldToAccount) {
          updateBankAccount(oldFromAccount.id, { balance: oldFromAccount.balance + transfer.amount });
          updateBankAccount(oldToAccount.id, { balance: oldToAccount.balance - transfer.amount });
        }

        updateInternalTransfer(transfer.id, transferData);
        toast.success('Transfer updated successfully');
      } else {
        addInternalTransfer(transferData);
        toast.success('Transfer created successfully');
      }

      // Apply the new transfer
      updateBankAccount(fromAccount.id, { balance: fromAccount.balance - data.amount });
      updateBankAccount(toAccount.id, { balance: toAccount.balance + data.amount });

      onClose();
    } catch (error) {
      toast.error('Failed to save transfer');
    }
  };

  const activeAccounts = bankAccounts.filter((a) => a.isActive);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Account *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName} ({formatCurrency(account.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fromAccount && (
                  <FormDescription>Balance: {formatCurrency(fromAccount.balance)}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Account *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeAccounts
                      .filter((a) => a.id !== fromAccountId)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName} ({formatCurrency(account.balance)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {toAccount && (
                  <FormDescription>Balance: {formatCurrency(toAccount.balance)}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                {fromAccount && amount > 0 && (
                  <FormDescription>
                    Balance after transfer: {formatCurrency(Math.max(0, fromAccount.balance - amount))}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="referenceNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference No *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TRF-001-2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer Date *</FormLabel>
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input placeholder="Optional notes about this transfer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting || !fromAccountId || !toAccountId || amount <= 0}
          >
            {form.formState.isSubmitting ? 'Processing...' : transfer ? 'Update Transfer' : 'Create Transfer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
