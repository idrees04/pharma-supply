import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore, BankAccount } from '@/hooks/useStore';
import { bankAccountSchema, BankAccountFormData } from '@/lib/schemas';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface BankAccountFormProps {
  account?: BankAccount;
  onClose: () => void;
}

export default function BankAccountForm({ account, onClose }: BankAccountFormProps) {
  const addBankAccount = useStore((state) => state.addBankAccount);
  const updateBankAccount = useStore((state) => state.updateBankAccount);

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: account ? {
      accountName: account.accountName,
      accountNo: account.accountNo,
      bankName: account.bankName,
      balance: account.balance,
      accountType: account.accountType,
      isActive: account.isActive,
    } : {
      accountType: 'Checking',
      isActive: true,
      balance: 0,
    },
  });

  const onSubmit = (data: BankAccountFormData) => {
    try {
      const accountData: Omit<BankAccount, 'id' | 'createdAt'> = {
        accountName: data.accountName,
        accountNo: data.accountNo,
        bankName: data.bankName,
        balance: data.balance,
        accountType: data.accountType,
        isActive: data.isActive,
      };
      
      if (account) {
        updateBankAccount(account.id, accountData);
        toast.success('Bank account updated successfully');
      } else {
        addBankAccount(accountData);
        toast.success('Bank account created successfully');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save bank account');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Main Operating Account" {...field} />
                </FormControl>
                <FormDescription>Friendly name for this account</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., First National Bank" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Checking">Checking</SelectItem>
                    <SelectItem value="Savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Balance *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>Initial balance in PKR</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>Account is available for transactions</FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
