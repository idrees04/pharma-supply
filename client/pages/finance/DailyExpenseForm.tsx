import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dailyExpenseSchema, DailyExpenseFormData } from "@/lib/schemas";
import { useStore, DailyExpense } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCurrency } from "@/lib/utils";

interface DailyExpenseFormProps {
  initialData?: DailyExpense;
  onSuccess?: () => void;
}

export default function DailyExpenseForm({
  initialData,
  onSuccess,
}: DailyExpenseFormProps) {
  const { addDailyExpense, updateDailyExpense } = useStore();
  const form = useForm<DailyExpenseFormData>({
    resolver: zodResolver(dailyExpenseSchema),
    defaultValues: initialData
      ? {
          voucherNo: initialData.voucherNo,
          date: initialData.date,
          payTo: initialData.payTo,
          expenses: initialData.expenses.map((exp) => ({
            reference: exp.reference,
            description: exp.description,
            concernPerson: exp.concernPerson,
            amount: exp.amount,
            headWiseCategory: exp.headWiseCategory,
          })),
          attachedReceipts: initialData.attachedReceipts,
        }
      : {
          expenses: [
            {
              reference: "",
              description: "",
              concernPerson: "",
              amount: 0,
              headWiseCategory: "Other",
            },
          ],
          attachedReceipts: 0,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expenses",
  });

  const expenses = form.watch("expenses");
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const onSubmit = (data: DailyExpenseFormData) => {
    const expenseData: Omit<DailyExpense, "id" | "createdAt"> = {
      voucherNo: data.voucherNo,
      date: data.date,
      payTo: data.payTo,
      expenses: data.expenses.map((exp, idx) => ({
        id: `exp-${idx}`,
        reference: exp.reference,
        description: exp.description,
        concernPerson: exp.concernPerson,
        amount: exp.amount,
        headWiseCategory: exp.headWiseCategory,
      })),
      totalAmount,
      attachedReceipts: data.attachedReceipts,
    };

    if (initialData) {
      updateDailyExpense(initialData.id, expenseData);
    } else {
      addDailyExpense(expenseData);
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
                    <Input placeholder="e.g., 3688" {...field} />
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
            <FormField
              control={form.control}
              name="payTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay To</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ibrahim Sb" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Expense Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  reference: "",
                  description: "",
                  concernPerson: "",
                  amount: 0,
                  headWiseCategory: "Other",
                })
              }
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 bg-card border border-border rounded-lg space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`expenses.${index}.reference`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Activity" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`expenses.${index}.headWiseCategory`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Category</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm"
                          >
                            <option value="Activity">Activity</option>
                            <option value="Carriage">Carriage</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Salary">Salary</option>
                            <option value="Other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`expenses.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of expense..."
                          {...field}
                          className="min-h-[60px] text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`expenses.${index}.concernPerson`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Concern Person
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ibrahim Sb" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`expenses.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
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
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Receipts */}
        <FormField
          control={form.control}
          name="attachedReceipts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attached Receipts</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Summary */}
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Expenses:</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(totalAmount)}
            </span>
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
