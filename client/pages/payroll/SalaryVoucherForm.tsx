import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salaryVoucherSchema, SalaryVoucherFormData } from "@/lib/schemas";
import { useStore, SalaryVoucher } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCurrency } from "@/lib/utils";

interface SalaryVoucherFormProps {
  initialData?: SalaryVoucher;
  onSuccess?: () => void;
}

export default function SalaryVoucherForm({
  initialData,
  onSuccess,
}: SalaryVoucherFormProps) {
  const { addSalaryVoucher, updateSalaryVoucher } = useStore();
  const form = useForm<SalaryVoucherFormData>({
    resolver: zodResolver(salaryVoucherSchema),
    defaultValues: initialData
      ? {
          voucherNo: initialData.voucherNo,
          employeeName: initialData.employeeName,
          date: initialData.date,
          grossSalary: initialData.grossSalary,
          allowances: initialData.allowances,
          deductions: initialData.deductions,
          bankName: initialData.bankName,
          accountNo: initialData.accountNo,
        }
      : {
          allowances: [],
          deductions: [],
        },
  });

  const {
    fields: allowanceFields,
    append: appendAllowance,
    remove: removeAllowance,
  } = useFieldArray({
    control: form.control,
    name: "allowances",
  });

  const {
    fields: deductionFields,
    append: appendDeduction,
    remove: removeDeduction,
  } = useFieldArray({
    control: form.control,
    name: "deductions",
  });

  const grossSalary = form.watch("grossSalary");
  const allowances = form.watch("allowances") || [];
  const deductions = form.watch("deductions") || [];

  const totalAllowances = allowances.reduce(
    (sum, a) => sum + (a.amount || 0),
    0,
  );
  const totalDeductions = deductions.reduce(
    (sum, d) => sum + (d.amount || 0),
    0,
  );
  const totalGross = grossSalary + totalAllowances;
  const netSalaryPayable = totalGross - totalDeductions;

  const onSubmit = (data: SalaryVoucherFormData) => {
    const voucherData: Omit<SalaryVoucher, "id" | "createdAt"> = {
      voucherNo: data.voucherNo,
      employeeName: data.employeeName,
      date: data.date,
      grossSalary: data.grossSalary,
      allowances: (data.allowances || []).map((a, idx) => ({
        id: `allow-${idx}`,
        type: a.type,
        amount: a.amount,
      })),
      deductions: (data.deductions || []).map((d, idx) => ({
        id: `ded-${idx}`,
        type: d.type,
        amount: d.amount,
      })),
      netSalaryPayable,
      bankName: data.bankName,
      accountNo: data.accountNo,
    };

    if (initialData) {
      updateSalaryVoucher(initialData.id, voucherData);
    } else {
      addSalaryVoucher(voucherData);
    }
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Voucher Header */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Voucher Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="voucherNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voucher No</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 250926" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employeeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mr Shahid" {...field} />
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
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Gross Salary */}
        <FormField
          control={form.control}
          name="grossSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gross Monthly Salary (PKR)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Allowances */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Allowances</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendAllowance({ type: "", amount: 0 })}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Allowance
            </Button>
          </div>

          <div className="space-y-3">
            {allowanceFields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-3 items-end p-3 bg-card border border-border rounded-lg"
              >
                <FormField
                  control={form.control}
                  name={`allowances.${index}.type`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Daily Allowance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`allowances.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="min-w-[150px]">
                      <FormLabel className="text-xs">Amount (PKR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAllowance(index)}
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Deductions</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendDeduction({ type: "", amount: 0 })}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Deduction
            </Button>
          </div>

          <div className="space-y-3">
            {deductionFields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-3 items-end p-3 bg-card border border-border rounded-lg"
              >
                <FormField
                  control={form.control}
                  name={`deductions.${index}.type`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Loan, Absence" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`deductions.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="min-w-[150px]">
                      <FormLabel className="text-xs">Amount (PKR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDeduction(index)}
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Allied Bank Limited" {...field} />
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
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 0649-0010103479530014"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold">Salary Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Gross Salary:</span>
              <span>{formatCurrency(grossSalary)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Allowances:</span>
              <span className="text-green-600">
                + {formatCurrency(totalAllowances)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Deductions:</span>
              <span className="text-red-600">
                - {formatCurrency(totalDeductions)}
              </span>
            </div>
            <div className="border-t border-primary/30 pt-2 flex justify-between items-center font-semibold">
              <span>Net Salary Payable:</span>
              <span className="text-primary text-lg">
                {formatCurrency(netSalaryPayable)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" className="gap-2">
            {initialData ? "Update Voucher" : "Create Voucher"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
