import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore, Product } from '@/hooks/useStore';
import { productSchema, ProductFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const addProduct = useStore((state) => state.addProduct);
  const updateProduct = useStore((state) => state.updateProduct);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      genericName: product.genericName,
      brandName: product.brandName,
      manufacturer: product.manufacturer,
      strength: product.strength,
      unit: product.unit,
      packSize: product.packSize,
      gstRate: product.gstRate,
      minimumStock: product.minimumStock,
      maximumStock: product.maximumStock,
      reorderPoint: product.reorderPoint,
      isActive: product.isActive,
    } : {
      isActive: true,
    },
  });

  const onSubmit = (data: ProductFormData) => {
    try {
      const productData: Omit<Product, 'id' | 'createdAt'> = {
        genericName: data.genericName,
        brandName: data.brandName,
        manufacturer: data.manufacturer,
        strength: data.strength,
        unit: data.unit,
        packSize: data.packSize,
        gstRate: data.gstRate,
        minimumStock: data.minimumStock,
        maximumStock: data.maximumStock,
        reorderPoint: data.reorderPoint,
        isActive: data.isActive,
      };

      if (product) {
        updateProduct(product.id, productData);
        toast.success('Product updated successfully');
      } else {
        addProduct(productData);
        toast.success('Product created successfully');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="genericName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Generic Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Paracetamol" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brandName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Panadol" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., GSK" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="strength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strength *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 500mg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Tablet, Capsule, ml" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="packSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pack Size *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gstRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Rate (%) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minimumStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Stock *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maximumStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Stock *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reorderPoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Point *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 250" {...field} />
                </FormControl>
                <FormDescription>Trigger point for purchase orders</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>Product is available for use</FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
