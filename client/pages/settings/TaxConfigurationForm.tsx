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
import { motion } from "framer-motion";
import {
  useCreateTaxConfiguration,
  useUpdateTaxConfiguration,
  useTaxConfiguration,
} from "@/api/services/taxConfiguration";
import { toast } from "sonner";
import { useEffect } from "react";

const formatDateTimeLocal = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const toIsoDateTime = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const taxSchema = z.object({
  taxName: z.string().min(1, "Tax name is required"),
  taxCode: z.string().min(1, "Tax code is required"),
  taxPercentage: z.coerce.number().min(0).max(100),
  isCompound: z.boolean().default(false),
  description: z.string().optional(),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional().or(z.literal("")),
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
      taxCode: "",
      taxPercentage: 0,
      isCompound: false,
      description: "",
      effectiveFrom: formatDateTimeLocal(new Date().toISOString()),
      effectiveTo: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (tax) {
      form.reset({
        taxName: tax.taxName,
        taxCode: tax.taxCode,
        taxPercentage: tax.taxPercentage,
        isCompound: tax.isCompound,
        description: tax.description || "",
        effectiveFrom: formatDateTimeLocal(tax.effectiveFrom),
        effectiveTo: tax.effectiveTo ? formatDateTimeLocal(tax.effectiveTo) : "",
        isActive: tax.isActive,
      });
    }
  }, [tax, form]);

  const onSubmit = (data: TaxFormData) => {
    const payload = {
      taxName: data.taxName,
      taxCode: data.taxCode,
      taxPercentage: data.taxPercentage,
      isCompound: data.isCompound,
      description: data.description || null,
      effectiveFrom: toIsoDateTime(data.effectiveFrom) ?? new Date().toISOString(),
      effectiveTo: data.effectiveTo ? toIsoDateTime(data.effectiveTo) : null,
      isActive: data.isActive,
      createdDate: tax?.createdDate ?? new Date().toISOString(),
      createdBy: tax?.createdBy ?? 0,
      modifiedDate: new Date().toISOString(),
      modifiedBy: tax?.modifiedBy ?? 0,
    };

    if (taxId) {
      updateTax(payload, {
        onSuccess: () => {
          toast.success("Tax configuration updated successfully");
          onSuccess();
        },
      });
    } else {
      createTax(payload, {
        onSuccess: () => {
          toast.success("Tax configuration created successfully");
          onSuccess();
        },
      });
    }
  };

  if (taxId && isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto inline-flex h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-3xl border border-border/80 bg-muted/70 p-6 shadow-lg ring-1 ring-border/70 backdrop-blur-sm"
    >
      <Form {...form}>
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          layout
        >
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Tax Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Define tax rates and effective periods for transaction tax calculations.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="taxName"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/50">
                  <FormLabel>Tax Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., GST, VAT"
                      {...field}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxCode"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/50">
                  <FormLabel>Tax Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., GST123"
                      {...field}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="taxPercentage"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/50">
                  <FormLabel>Tax Percentage (%) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isCompound"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/50">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <FormLabel>Compound Tax</FormLabel>
                      <FormDescription>Apply this tax on top of other taxes.</FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/50">
                  <FormLabel>Effective From *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveTo"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/50">
                  <FormLabel>Effective To</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      className="transition-all duration-200 focus:scale-[1.01]"
                    />
                  </FormControl>
                  <FormDescription>Leave blank if the tax does not expire.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/50">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Optional description..."
                    {...field}
                    className="min-h-[120px] transition-all duration-200 focus:scale-[1.01]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border focus-within:border-primary/50">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Toggle visibility for live transactions.</FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto transition-all duration-200 hover:shadow-lg"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto transition-all duration-200 hover:shadow-lg"
              disabled={isCreating || isUpdating}
            >
              {(isCreating || isUpdating) ? "Saving..." : taxId ? "Update tax" : "Create tax"}
            </Button>
          </div>
        </motion.form>
      </Form>
    </motion.div>
  );
}
