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
  useCreateTaxConfiguration, 
  useUpdateTaxConfiguration,
  useTaxConfiguration 
} from "@/api/services/taxConfiguration";
import { toast } from "sonner";
import { useEffect } from "react";

const taxSchema = z.object({
  taxName: z.string().min(1, "Tax name is required"),
  taxPercentage: z.coerce.number().min(0).max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type TaxFormData = z.infer<typeof taxSchema>;

interface TaxConfigurationFormProps {
  taxId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TaxConfigurationForm({
  taxId,
  onSuccess,
  onCancel,
}: TaxConfigurationFormProps) {
  const { data: tax, isLoading } = useTaxConfiguration(taxId || null);
  const { mutate: createTax, isPending: isCreating } = useCreateTaxConfiguration();
  const { mutate: updateTax, isPending: isUpdating } = useUpdateTaxConfiguration(taxId || 0);

  const form = useForm<TaxFormData>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      taxName: "",
      taxPercentage: 0,
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (tax) {
      form.reset({
        taxName: tax.taxName,
        taxPercentage: tax.taxPercentage,
        description: tax.description || "",
        isActive: tax.isActive,
      });
    }
  }, [tax, form]);

  const onSubmit = (data: TaxFormData) => {
    if (taxId) {
      updateTax(data, {
        onSuccess: () => {
          toast.success("Tax configuration updated successfully");
          onSuccess();
        },
      });
    } else {
      createTax(data, {
        onSuccess: () => {
          toast.success("Tax configuration created successfully");
          onSuccess();
        },
      });
    }
  };

  if (taxId && isLoading) {
    return <div className="py-4 text-center">Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="taxName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., GST, VAT" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Percentage (%) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
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
                <FormDescription>Available for transactions</FormDescription>
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
            {(isCreating || isUpdating) ? "Saving..." : (taxId ? "Update" : "Create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
