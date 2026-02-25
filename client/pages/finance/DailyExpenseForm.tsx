import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateExpense, useUpdateExpense } from "@/api/services/expenses";
import { useExpenseCategories } from "@/api/services/expenseCategories";
import { ExpenseDto, CreateExpenseRequest } from "@/types/api/expenses";
import { toast } from "sonner";

const expenseSchema = z.object({
  expenseCategoryId: z.coerce.number().min(1, "Category is required"),
  expenseDate: z.string().min(1, "Date is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface DailyExpenseFormProps {
  initialData?: ExpenseDto;
  onSuccess?: () => void;
}

export default function DailyExpenseForm({
  initialData,
  onSuccess,
}: DailyExpenseFormProps) {
  const { data: categories } = useExpenseCategories();
  const { mutate: createExpense, isPending: isCreating } = useCreateExpense();
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense(initialData?.id || 0);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData
      ? {
          expenseCategoryId: initialData.expenseCategoryId,
          expenseDate: new Date(initialData.expenseDate).toISOString().split('T')[0],
          amount: initialData.amount,
          description: initialData.description || "",
          paymentMethod: initialData.paymentMethod || "Cash",
          referenceNumber: initialData.referenceNumber || "",
        }
      : {
          expenseCategoryId: 0,
          expenseDate: new Date().toISOString().split('T')[0],
          amount: 0,
          description: "",
          paymentMethod: "Cash",
          referenceNumber: "",
        },
  });

  const onSubmit = (data: ExpenseFormData) => {
    const payload: CreateExpenseRequest = {
      ...data,
      expenseDate: new Date(data.expenseDate).toISOString(),
    };

    if (initialData) {
      updateExpense(payload, {
        onSuccess: () => {
          toast.success("Expense updated successfully");
          onSuccess?.();
        },
      });
    } else {
      createExpense(payload, {
        onSuccess: () => {
          toast.success("Expense recorded successfully");
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
            name="expenseCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.categoryName}
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
            name="expenseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
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
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Voucher # or Invoice #" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of expense..."
                  {...field}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? "Saving..." : (initialData ? "Update Expense" : "Record Expense")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
