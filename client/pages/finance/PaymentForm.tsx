import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EnumSelect } from "@/components/ui/enum-select";
import { usePaymentModeEnumOptions } from "@/hooks/dropdown";
import { useCreatePayment, useUpdatePayment } from "@/api/services/payments";
import { useAccountList } from "@/api/services/accounts";
import { usePurchaseOrderList } from "@/api/services/purchaseOrders";
import { PaymentDto, PaymentMode, PaymentType, CreatePaymentRequest } from "@/types/api/payments";
import { toast } from "sonner";

const paymentSchema = z.object({
  purchaseOrderId: z.coerce.number().optional().nullable(),
  paymentMode: z.coerce.number(),
  accountId: z.coerce.number().min(1, "Account is required"),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().min(1, "Date is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  initialData?: PaymentDto;
  onSuccess?: () => void;
}

export default function PaymentForm({
  initialData,
  onSuccess,
}: PaymentFormProps) {
  const { data: accounts } = useAccountList();
  const { data: purchaseOrdersData } = usePurchaseOrderList({ pageSize: 100 });
  const { data: paymentModeOptions, isLoading: isLoadingPaymentModes } = usePaymentModeEnumOptions();
  const { mutate: createPayment, isPending: isCreating } = useCreatePayment();
  const { mutate: updatePayment, isPending: isUpdating } = useUpdatePayment(initialData?.id || 0);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData
      ? {
          purchaseOrderId: initialData.purchaseOrderId,
          paymentMode: initialData.paymentMode,
          accountId: initialData.accountId,
          referenceNumber: initialData.referenceNumber || "",
          paymentDate: new Date(initialData.paymentDate).toISOString().split('T')[0],
          amount: initialData.amount,
          notes: initialData.notes || "",
        }
      : {
          paymentMode: PaymentMode.BankTransfer,
          paymentDate: new Date().toISOString().split('T')[0],
          amount: 0,
          notes: "",
        },
  });

  const onSubmit = (data: PaymentFormData) => {
    const payload: CreatePaymentRequest = {
      ...data,
      paymentType: PaymentType.Outgoing, // Defaulting to Outgoing for this form
      paymentDate: new Date(data.paymentDate).toISOString(),
    };

    if (initialData) {
      updatePayment(payload, {
        onSuccess: () => {
          toast.success("Payment updated successfully");
          onSuccess?.();
        },
      });
    } else {
      createPayment(payload, {
        onSuccess: () => {
          toast.success("Payment recorded successfully");
          onSuccess?.();
        },
      });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseOrderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Order</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {purchaseOrdersData?.items.map((po) => (
                      <SelectItem key={po.id} value={po.id.toString()}>
                        {po.poNumber} - {po.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.accountName} ({acc.bankName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Mode *</FormLabel>
                <FormControl>
                  <EnumSelect
                    items={paymentModeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    isLoading={isLoadingPaymentModes}
                    placeholder="Select payment mode"
                    searchPlaceholder="Search payment modes..."
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
                <FormLabel>Payment Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
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
                  <Input placeholder="e.g., Transaction ID" {...field} />
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
                <Input placeholder="Optional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? "Saving..." : (initialData ? "Update Payment" : "Record Payment")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
