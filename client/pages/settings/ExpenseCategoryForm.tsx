import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  useCreateExpenseCategory, 
  useUpdateExpenseCategory,
  useExpenseCategory 
} from "@/api/services/expenseCategories";
import { toast } from "sonner";
import { useEffect } from "react";

const categorySchema = z.object({
  categoryName: z.string().min(1, "Category name is required"),
  categoryCode: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface ExpenseCategoryFormProps {
  categoryId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ExpenseCategoryForm({
  categoryId,
  onSuccess,
  onCancel,
}: ExpenseCategoryFormProps) {
  const { data: category, isLoading: isLoadingCategory } = useExpenseCategory(categoryId || null);
  const { mutate: createCategory, isPending: isCreating } = useCreateExpenseCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateExpenseCategory(categoryId || 0);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryName: "",
      categoryCode: "",
      description: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        categoryName: category.categoryName,
        categoryCode: category.categoryCode || "",
        description: category.description || "",
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      });
    }
  }, [category, form]);

  const onSubmit = (data: CategoryFormData) => {
    if (categoryId) {
      updateCategory(data, {
        onSuccess: () => {
          toast.success("Category updated successfully");
          onSuccess();
        },
      });
    } else {
      createCategory(data, {
        onSuccess: () => {
          toast.success("Category created successfully");
          onSuccess();
        },
      });
    }
  };

  if (categoryId && isLoadingCategory) {
    return <div className="py-4 text-center">Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="categoryName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Office Supplies" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., OFF-SUP" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
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
                <Textarea placeholder="Optional description..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>Available for expenses</FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {(isCreating || isUpdating) ? "Saving..." : (categoryId ? "Update" : "Create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
