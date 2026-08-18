import { useEffect } from "react";
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
import {
  useSettleOpeningBalance,
  useOpeningBalanceSuggestion,
} from "@/api/services/payments";
import { useAccountList } from "@/api/services/accounts";
import { useGetHospitals } from "@/hooks/useHospitals";
import { useSupplierList } from "@/api/services/suppliers";
import {
  PaymentMode,
  OpeningBalancePartyType,
  OpeningBalanceSettlementRequest,
} from "@/types/api/payments";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { todayInputValue } from "@/lib/dates";

const openingSchema = z.object({
  partyType: z.coerce.number().min(1),
  partyId: z.coerce.number().min(1, "Party is required"),
  paymentMode: z.coerce.number(),
  accountId: z.coerce.number().min(1, "Account is required"),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().min(1, "Date is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

type OpeningFormData = z.infer<typeof openingSchema>;

interface PaymentFormProps {
  onSuccess?: () => void;
}

export default function PaymentForm({ onSuccess }: PaymentFormProps) {
  const { data: accounts } = useAccountList();
  const { data: hospitalsResponse } = useGetHospitals({ pageSize: 500 });
  const { data: suppliersData } = useSupplierList({ pageSize: 500 });
  const { data: paymentModeOptions, isLoading: isLoadingPaymentModes } =
    usePaymentModeEnumOptions();
  const { mutate: settle, isPending } = useSettleOpeningBalance();

  const form = useForm<OpeningFormData>({
    resolver: zodResolver(openingSchema),
    defaultValues: {
      partyType: OpeningBalancePartyType.Hospital,
      paymentMode: PaymentMode.BankTransfer,
      paymentDate: todayInputValue(),
      amount: 0,
      notes: "",
      referenceNumber: "",
    },
  });

  const partyType = form.watch("partyType");
  const partyId = form.watch("partyId");
  const { data: suggestion } = useOpeningBalanceSuggestion(
    partyType || null,
    partyId || null
  );

  useEffect(() => {
    form.setValue("partyId", undefined as unknown as number);
    form.setValue("amount", 0);
  }, [partyType, form]);

  useEffect(() => {
    if (suggestion?.openingBalanceRemaining != null) {
      form.setValue("amount", suggestion.openingBalanceRemaining);
    }
  }, [suggestion, form]);

  const onSubmit = (data: OpeningFormData) => {
    const remaining = suggestion?.openingBalanceRemaining ?? 0;
    if (data.amount > remaining + 0.01) {
      toast.error(`Amount cannot exceed remaining opening balance (${formatCurrency(remaining)})`);
      return;
    }

    const payload: OpeningBalanceSettlementRequest = {
      partyType: data.partyType as OpeningBalancePartyType,
      partyId: data.partyId,
      accountId: data.accountId,
      amount: data.amount,
      paymentDate: new Date(data.paymentDate).toISOString(),
      paymentMode: data.paymentMode,
      referenceNumber: data.referenceNumber || null,
      notes: data.notes || null,
    };

    settle(payload, {
      onSuccess: () => {
        toast.success(
          data.partyType === OpeningBalancePartyType.Hospital
            ? "Opening balance receipt recorded"
            : "Opening balance payment recorded"
        );
        onSuccess?.();
      },
      onError: (err: any) => {
        toast.error(err?.message || "Failed to record opening balance settlement");
      },
    });
  };

  const hospitals = hospitalsResponse?.data?.items ?? [];
  const suppliers = suppliersData?.items ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Settle brought-forward opening balance for a hospital (receive money) or vendor (pay money). No invoice or PO lines required.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="partyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Party type *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={String(OpeningBalancePartyType.Hospital)}>
                      Hospital (receive)
                    </SelectItem>
                    <SelectItem value={String(OpeningBalancePartyType.Supplier)}>
                      Vendor (pay)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="partyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {partyType === OpeningBalancePartyType.Supplier ? "Vendor" : "Hospital"} *
                </FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value ? field.value.toString() : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select party" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {partyType === OpeningBalancePartyType.Supplier
                      ? suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.supplierName}
                          </SelectItem>
                        ))
                      : hospitals.map((h) => (
                          <SelectItem key={h.id} value={h.id.toString()}>
                            {h.hospitalName}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {suggestion && (
          <div className="rounded-md border px-3 py-2 text-sm space-y-1 bg-muted/40">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Opening balance</span>
              <span>{formatCurrency(suggestion.openingBalance)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Already settled</span>
              <span>{formatCurrency(suggestion.openingBalanceSettled)}</span>
            </div>
            <div className="flex justify-between gap-2 font-medium">
              <span>Remaining</span>
              <span>{formatCurrency(suggestion.openingBalanceRemaining)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value ? field.value.toString() : undefined}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (PKR) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" disabled={isPending || (suggestion?.openingBalanceRemaining ?? 0) <= 0}>
            {isPending ? "Saving..." : "Record opening settlement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
