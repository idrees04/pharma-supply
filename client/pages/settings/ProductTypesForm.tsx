import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productTypeSchema, ProductTypeFormData } from "@/lib/schemas";
import {
  useCreateProductType,
  useUpdateProductType,
  useProductType,
} from "@/api/services/productTypes";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreateProductTypeRequest,
  UpdateProductTypeRequest,
} from "@/types/api/productTypes";
import { Loader } from "lucide-react";

interface ProductTypesFormProps {
  productTypeId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductTypesForm({
  productTypeId,
  onSuccess,
  onCancel,
}: ProductTypesFormProps) {
  const { data: productType, isPending: isLoadingProductType } = useProductType(
    productTypeId || 0,
  );
  const createMutation = useCreateProductType();
  const updateMutation = useUpdateProductType(productTypeId || 0);

  const form = useForm<ProductTypeFormData>({
    resolver: zodResolver(productTypeSchema),
    defaultValues: productType
      ? {
          typeName: productType.typeName,
          typeCode: productType.typeCode,
          description: productType.description,
          displayOrder: productType.displayOrder,
          isActive: productType.isActive,
        }
      : {
          typeName: "",
          typeCode: "",
          description: "",
          displayOrder: 0,
          isActive: true,
        },
  });

  // Update form when productType data loads
  if (productType && !form.getValues("typeName")) {
    form.reset({
      typeName: productType.typeName,
      typeCode: productType.typeCode,
      description: productType.description,
      displayOrder: productType.displayOrder,
      isActive: productType.isActive,
    });
  }

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    isLoadingProductType;

  const onSubmit = (data: ProductTypeFormData) => {
    if (productTypeId) {
      // Update existing product type
      const updateData: UpdateProductTypeRequest = {
        typeName: data.typeName,
        typeCode: data.typeCode,
        description: data.description || "",
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      };

      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error) => {
          form.setError("root", {
            message: error.userMessage || "Failed to update product type",
          });
        },
      });
    } else {
      // Create new product type
      const createData: CreateProductTypeRequest = {
        typeName: data.typeName,
        typeCode: data.typeCode,
        description: data.description || "",
        displayOrder: data.displayOrder,
      };

      createMutation.mutate(createData, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error) => {
          form.setError("root", {
            message: error.userMessage || "Failed to create product type",
          });
        },
      });
    }
  };

  if (isLoadingProductType && productTypeId) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Type Name */}
        <FormField
          control={form.control}
          name="typeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Antibiotics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type Code */}
        <FormField
          control={form.control}
          name="typeCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type Code *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ATB" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter description..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display Order */}
        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Active (only for edit) */}
        {productTypeId && (
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
            {productTypeId ? "Update" : "Create"}
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
