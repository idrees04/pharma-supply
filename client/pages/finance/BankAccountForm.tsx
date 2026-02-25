import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useCreateAccount, useUpdateAccount } from '@/api/services/accounts';
import { AccountDto, CreateAccountRequest } from '@/types/api/accounts';

const accountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountType: z.string().min(1, 'Account type is required'),
  openingBalance: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface BankAccountFormProps {
  account?: AccountDto;
  onClose: () => void;
}

export default function BankAccountForm({ account, onClose }: BankAccountFormProps) {
  const { mutate: createAccount, isPending: isCreating } = useCreateAccount();
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount(account?.id || 0);

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: account ? {
      accountName: account.accountName || '',
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      openingBalance: account.openingBalance,
      accountType: account.accountType || 'Checking',
      isActive: account.isActive,
    } : {
      accountType: 'Checking',
      isActive: true,
      openingBalance: 0,
    },
  });

  const onSubmit = (data: AccountFormData) => {
    const payload: CreateAccountRequest = {
      ...data,
    };

    if (account) {
      updateAccount(payload, {
        onSuccess: () => {
          toast.success('Bank account updated successfully');
          onClose();
        },
      });
    } else {
      createAccount(payload, {
        onSuccess: () => {
          toast.success('Bank account created successfully');
          onClose();
        },
      });
    }
  };

  const isPending = isCreating || isUpdating;

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
            name="accountNumber"
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
            name="openingBalance"
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
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
