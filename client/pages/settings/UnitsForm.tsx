import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unitSchema, UnitFormData } from "@/lib/schemas";
import { useCreateUnit, useUpdateUnit, useUnit } from "@/api/services/units";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateUnitRequest, UpdateUnitRequest, Unit } from "@/types/api/units";
import { Loader } from "lucide-react";

interface UnitsFormProps {
  unitId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UnitsForm({
  unitId,
  onSuccess,
  onCancel,
}: UnitsFormProps) {
  const { data: unit, isPending: isLoadingUnit } = useUnit(unitId || 0) as { data: Unit | undefined, isPending: boolean };
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit(unitId || 0);

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: unit
      ? {
        name: unit.name,
        quantity: unit.quantity,
        isActive: unit.isActive,
      }
      : {
        name: "",
        quantity: 0,
        isActive: true,
      },
  });

  // Update form when unit data loads
  if (unit && !form.getValues("name")) {
    form.reset({
      name: unit.name,
      quantity: unit.quantity,
      isActive: unit.isActive,
    });
  }

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    (!!unitId && isLoadingUnit);

  const onSubmit = (data: UnitFormData) => {
    if (unitId) {
      // Update existing unit
      const updateData: UpdateUnitRequest = {
        name: data.name,
        quantity: data.quantity,
        isActive: data.isActive,
      };

      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error) => {
          form.setError("root", {
            message: error.userMessage || "Failed to update unit",
          });
        },
      });
    } else {
      // Create new unit
      const createData: CreateUnitRequest = {
        name: data.name,
        quantity: data.quantity,
      };

      createMutation.mutate(createData, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error) => {
          form.setError("root", {
            message: error.userMessage || "Failed to create unit",
          });
        },
      });
    }
  };

  if (isLoadingUnit && unitId) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Tablet, Capsule, Syrup" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantity */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Active (only for edit) */}
        {unitId && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Active</FormLabel>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Error */}
        {form.formState.errors.root && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {unitId ? "Update" : "Create"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
