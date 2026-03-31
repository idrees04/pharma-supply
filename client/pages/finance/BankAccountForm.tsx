import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateAccount, useUpdateAccount, accountService } from "@/api/services/accounts";
import { AccountDto, CreateAccountRequest, UpdateAccountRequest, AccountType } from "@/types/api/accounts";
import { bankAccountSchema, BankAccountFormData } from "@/lib/schemas";
import { Loader2, CalendarIcon } from "lucide-react";
import { useGetQuery } from "@/api/hooks";

interface BankAccountFormProps {
  account?: AccountDto;
  onClose: () => void;
}

export default function BankAccountForm({ account, onClose }: BankAccountFormProps) {
  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountType: AccountType.Bank,
      isActive: true,
      openingBalance: 0,
      openingBalanceDate: new Date().toISOString().split('T')[0],
      description: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      bankBranch: '',
    },
  });

  // Fetch account details if editing to ensure fresh data
  const { data: accountDetail, isPending: isFetchingDetails } = useGetQuery<AccountDto>(
    ["accounts", account?.id],
    () => accountService.getAccount(account!.id),
    { enabled: !!account?.id }
  );

  // Update form when account data is loaded
  useEffect(() => {
    if (accountDetail) {
      form.reset({
        accountName: accountDetail.accountName,
        accountType: accountDetail.accountType,
        accountNumber: accountDetail.accountNumber,
        bankName: accountDetail.bankName,
        bankBranch: accountDetail.bankBranch,
        openingBalance: accountDetail.openingBalance,
        openingBalanceDate: accountDetail.openingBalanceDate ? accountDetail.openingBalanceDate.split('T')[0] : '',
        description: accountDetail.description || '',
        isActive: accountDetail.isActive,
      });
    }
  }, [accountDetail, form]);

  // Create account mutation
  const { mutate: createAccount, isPending: isCreating } = useCreateAccount();

  // Update account mutation
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount(account?.id || 0);

  const isEditMode = !!account?.id;
  const isSubmitting = isCreating || isUpdating || (isEditMode && isFetchingDetails);

  const onSubmit = (data: BankAccountFormData) => {
    if (account) {
      const payload: UpdateAccountRequest = {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        description: data.description || '',
        isActive: data.isActive,
      };

      updateAccount(payload, {
        onSuccess: () => {
          toast.success("Bank account updated successfully");
          onClose();
        },
        onError: (error: any) => {
          if (error.hasValidationErrors) {
            Object.entries(error.validationErrors).forEach(([field, messages]) => {
              const fieldKey = field as keyof BankAccountFormData;
              const message = Array.isArray(messages) ? messages[0] : messages;
              form.setError(fieldKey, { message: message as string });
            });
          } else {
            toast.error(error.userMessage || "Failed to update account");
          }
        },
      });
    } else {
      const payload: CreateAccountRequest = {
        accountName: data.accountName,
        accountType: data.accountType,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        openingBalance: data.openingBalance,
        openingBalanceDate: new Date(data.openingBalanceDate).toISOString(),
        description: data.description || '',
      };

      createAccount(payload, {
        onSuccess: () => {
          toast.success("Bank account created successfully");
          onClose();
        },
        onError: (error: any) => {
          if (error.hasValidationErrors) {
            Object.entries(error.validationErrors).forEach(([field, messages]) => {
              const fieldKey = field as keyof BankAccountFormData;
              const message = Array.isArray(messages) ? messages[0] : messages;
              form.setError(fieldKey, { message: message as string });
            });
          } else {
            toast.error(error.userMessage || "Failed to create account");
          }
        },
      });
    }
  };

  if (account && isFetchingDetails) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                <Select 
                  onValueChange={(val) => field.onChange(parseInt(val))} 
                  defaultValue={field.value?.toString()}
                  disabled={isEditMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={AccountType.Cash.toString()}>Cash</SelectItem>
                    <SelectItem value={AccountType.Bank.toString()}>Bank</SelectItem>
                  </SelectContent>
                </Select>
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
            name="bankBranch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Branch *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Downtown Branch" {...field} />
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
                    disabled={isEditMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="openingBalanceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Balance Date *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="date"
                      {...field}
                      disabled={isEditMode}
                      className="pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-[72px] self-end space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Account Active</FormLabel>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional details..." 
                    className="resize-none h-20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {account ? "Updating..." : "Creating..."}
              </span>
            ) : account ? (
              "Update Account"
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
