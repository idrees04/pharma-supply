import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCreateProduct, useUpdateProduct, useProduct } from '@/api/services/products';
import { Product, CreateProductRequest, UpdateProductRequest } from '@/types/api/products';

interface ProductFormProps {
  productId?: number;
  onClose: () => void;
}

export default function ProductForm({ productId, onClose }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: '',
      genericName: '',
      productCode: '',
      manufacturer: '',
      productTypeId: 1,
      category: '',
      subCategory: '',
      unitOfMeasure: '',
      standardPurchaseRate: 0,
      standardSaleRate: 0,
      taxPercentage: 0,
      reorderLevel: 0,
      reorderQuantity: 1,
      hsnCode: '',
      isBatchRequired: false,
      description: '',
      requiresPrescription: false,
      storageConditions: '',
      isActive: true,
    },
  });

  // Fetch existing product if editing
  const { data: existingProduct, isPending: isLoadingProduct } = useProduct(productId ?? null);

  // Set form values when existing product is loaded
  useEffect(() => {
    if (existingProduct && productId) {
      form.reset({
        productName: existingProduct.productName,
        genericName: existingProduct.genericName,
        productCode: existingProduct.productCode,
        manufacturer: existingProduct.manufacturer,
        productTypeId: existingProduct.productTypeId,
        category: existingProduct.category,
        subCategory: existingProduct.subCategory,
        unitOfMeasure: existingProduct.unitOfMeasure,
        standardPurchaseRate: existingProduct.standardPurchaseRate,
        standardSaleRate: existingProduct.standardSaleRate,
        taxPercentage: existingProduct.taxPercentage,
        reorderLevel: existingProduct.reorderLevel,
        reorderQuantity: existingProduct.reorderQuantity,
        hsnCode: existingProduct.hsnCode,
        isBatchRequired: existingProduct.isBatchRequired,
        description: existingProduct.description,
        requiresPrescription: existingProduct.requiresPrescription,
        storageConditions: existingProduct.storageConditions,
        isActive: existingProduct.isActive,
      });
    }
  }, [existingProduct, productId, form]);

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(productId ?? 0);

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const isSubmitting = isCreating || isUpdating || isLoadingProduct;

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (productId) {
        // Edit mode - use PUT
        const updateData: UpdateProductRequest = {
          productName: data.productName,
          genericName: data.genericName,
          manufacturer: data.manufacturer,
          productTypeId: data.productTypeId,
          category: data.category,
          subCategory: data.subCategory,
          unitOfMeasure: data.unitOfMeasure,
          standardPurchaseRate: data.standardPurchaseRate,
          standardSaleRate: data.standardSaleRate,
          taxPercentage: data.taxPercentage,
          reorderLevel: data.reorderLevel,
          reorderQuantity: data.reorderQuantity,
          hsnCode: data.hsnCode,
          isBatchRequired: data.isBatchRequired,
          description: data.description || '',
          requiresPrescription: data.requiresPrescription,
          storageConditions: data.storageConditions || '',
          isActive: data.isActive,
        };

        updateMutation.mutate(updateData, {
          onSuccess: () => {
            toast.success('Product updated successfully');
            form.reset();
            onClose();
          },
          onError: (error) => {
            toast.error(error.userMessage || 'Failed to update product');
          },
        });
      } else {
        // Create mode - use POST
        const createData: CreateProductRequest = {
          productName: data.productName,
          genericName: data.genericName,
          productCode: data.productCode,
          manufacturer: data.manufacturer,
          productTypeId: data.productTypeId,
          category: data.category,
          subCategory: data.subCategory,
          unitOfMeasure: data.unitOfMeasure,
          standardPurchaseRate: data.standardPurchaseRate,
          standardSaleRate: data.standardSaleRate,
          taxPercentage: data.taxPercentage,
          reorderLevel: data.reorderLevel,
          reorderQuantity: data.reorderQuantity,
          hsnCode: data.hsnCode,
          isBatchRequired: data.isBatchRequired,
          description: data.description || '',
          requiresPrescription: data.requiresPrescription,
          storageConditions: data.storageConditions || '',
        };

        createMutation.mutate(createData, {
          onSuccess: () => {
            toast.success('Product created successfully');
            form.reset();
            onClose();
          },
          onError: (error) => {
            toast.error(error.userMessage || 'Failed to create product');
          },
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Aspirin 500mg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="genericName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Generic Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Acetylsalicylic Acid" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Code *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., ASPI-500"
                    {...field}
                    disabled={productId !== undefined}
                  />
                </FormControl>
                <FormDescription>Cannot be changed after creation</FormDescription>
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
                  <Input placeholder="e.g., Bayer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Pain Relief" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub Category *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Analgesic" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Type ID *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Tablet, Capsule, ml" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing and Rates */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Pricing & Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="standardPurchaseRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standard Purchase Rate *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="standardSaleRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standard Sale Rate *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                  <FormLabel>Tax Percentage *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hsnCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HSN Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 300210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Inventory & Ordering */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Inventory & Ordering</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="reorderLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Level *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50" {...field} />
                  </FormControl>
                  <FormDescription>Trigger point for purchase orders</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reorderQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Quantity *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100" {...field} />
                  </FormControl>
                  <FormDescription>Standard quantity to order</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Additional Information</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional product details..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storageConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Conditions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Store below 25°C, protect from light" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Flags */}
        <div className="border-t pt-6 space-y-4">
          <FormField
            control={form.control}
            name="isBatchRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Batch Required</FormLabel>
                  <FormDescription>Batch tracking is mandatory for this product</FormDescription>
                </div>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="requiresPrescription"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Requires Prescription</FormLabel>
                  <FormDescription>This product requires prescription for sale</FormDescription>
                </div>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
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
                  <FormDescription>Product is available for use</FormDescription>
                </div>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {productId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              productId ? 'Update Product' : 'Create Product'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
