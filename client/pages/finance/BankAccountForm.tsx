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
import { EnumSelect } from "@/components/ui/enum-select";
import { useAccountTypeOptions } from "@/hooks/dropdown";
import { toast } from "sonner";
import { useCreateAccount, useUpdateAccount, accountService } from "@/api/services/accounts";
import { AccountDto, CreateAccountRequest, UpdateAccountRequest, AccountType } from "@/types/api/accounts";
import { bankAccountSchema, BankAccountFormData } from "@/lib/schemas";
import { useGetQuery } from "@/api/hooks";
import { ApiError } from "@/api/errors";

interface BankAccountFormProps {
  account?: AccountDto;
  onClose: () => void;
}

export default function BankAccountForm({ account, onClose }: BankAccountFormProps) {
  const { data: accountTypeOptions, isLoading: isLoadingAccountTypes } = useAccountTypeOptions();

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

  // Fetch account details if editing
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

  const { mutate: createAccount, isPending: isCreating } = useCreateAccount();
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount(account?.id || 0);

  const isEditMode = !!account?.id;
  const isSubmitting = isCreating || isUpdating || (isEditMode && isFetchingDetails);

  const onSubmit = (data: BankAccountFormData) => {
    if (isEditMode) {
      const payload: UpdateAccountRequest = {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        description: data.description || '',
        isActive: !!data.isActive,
      };

      updateAccount(payload, {
        onSuccess: () => {
          toast.success("Account updated successfully");
          onClose();
        },
        onError: (error: ApiError) => {
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
        accountType: data.accountType || AccountType.Bank,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        openingBalance: data.openingBalance || 0,
        openingBalanceDate: new Date(data.openingBalanceDate || new Date()).toISOString(),
        description: data.description || '',
      };

      createAccount(payload, {
        onSuccess: () => {
          toast.success("Account registered successfully");
          onClose();
        },
        onError: (error: ApiError) => {
          if (error.hasValidationErrors) {
            Object.entries(error.validationErrors).forEach(([field, messages]) => {
              const fieldKey = field as keyof BankAccountFormData;
              const message = Array.isArray(messages) ? messages[0] : messages;
              form.setError(fieldKey, { message: message as string });
            });
          } else {
            toast.error(error.userMessage || "Failed to register account");
          }
        },
      });
    }
  };

  // Loading state (same as HospitalForm)
  if (isEditMode && isFetchingDetails) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 2‑column grid, exactly like HospitalForm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Operating Reserve" {...field} />
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
                <FormControl>
                  <EnumSelect
                    items={accountTypeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    isLoading={isLoadingAccountTypes}
                    disabled={isEditMode}
                    placeholder="Select account type"
                    searchPlaceholder="Search account types..."
                  />
                </FormControl>
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
                  <Input placeholder="e.g., Standard Chartered" {...field} />
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
                  <Input placeholder="e.g., I.I Chundrigar Road" {...field} />
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
                  <Input placeholder="IBAN or Account Number" {...field} />
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
                  <Input type="date" {...field} disabled={isEditMode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description spans both columns, like Address in HospitalForm */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Operational remarks or purpose of this ledger..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Active status – same style as HospitalForm */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  Account is available for financial transactions
                </FormDescription>
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

        {/* Action buttons */}
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
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isEditMode ? "Updating..." : "Creating..."}
              </span>
            ) : isEditMode ? (
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
