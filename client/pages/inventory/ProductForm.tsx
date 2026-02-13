import { useEffect, useState } from 'react';
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
import { useUnitList } from '@/api/services/units';
import { useProductTypeList } from '@/api/services/productTypes';
import { Unit } from '@/types/api/units';
import { ProductType } from '@/types/api/productTypes';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UnitsForm from '../settings/UnitsForm';
import ProductTypesForm from '../settings/ProductTypesForm';

interface ProductFormProps {
  productId?: number;
  onClose: () => void;
}

export default function ProductForm({ productId, onClose }: ProductFormProps) {
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddProductTypeOpen, setIsAddProductTypeOpen] = useState(false);

  const { data: units, isLoading: isLoadingUnits } = useUnitList() as { data: Unit[] | undefined, isLoading: boolean };
  const { data: productTypes, isLoading: isLoadingProductTypes } = useProductTypeList() as { data: ProductType[] | undefined, isLoading: boolean };
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
      unitId: 0,
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
  const { data: existingProduct, isPending: isLoadingProduct } = useProduct(productId ?? null) as { data: Product | undefined, isPending: boolean };

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
        unitId: existingProduct.unitId,
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
  const isEditMode = typeof productId === 'number';

  const isSubmitting =
    isCreating ||
    isUpdating ||
    (isEditMode && isLoadingProduct);


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
          unitId: data.unitId,
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
          unitId: data.unitId,
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
              <FormItem className="flex-1">
                <FormLabel>Product Type *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <SearchableSelect
                      items={(productTypes || []).map((t) => ({
                        value: t.id,
                        label: t.typeName,
                      }))}
                      value={field.value}
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder="Select type..."
                      isLoading={isLoadingProductTypes}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setIsAddProductTypeOpen(true)}
                    title="Add new product type"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Unit of Measure *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <SearchableSelect
                      items={(units || []).map((u) => ({
                        value: u.id,
                        label: u.name,
                      }))}
                      value={field.value}
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder="Select unit..."
                      isLoading={isLoadingUnits}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setIsAddUnitOpen(true)}
                    title="Add new unit"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
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

      {/* Quick Add Dialogs */}
      <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>
              Create a new unit of measure for products.
            </DialogDescription>
          </DialogHeader>
          <UnitsForm
            onSuccess={() => {
              setIsAddUnitOpen(false);
              toast.success("Unit added successfully");
            }}
            onCancel={() => setIsAddUnitOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddProductTypeOpen} onOpenChange={setIsAddProductTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product Type</DialogTitle>
            <DialogDescription>
              Create a new category/type for products.
            </DialogDescription>
          </DialogHeader>
          <ProductTypesForm
            onSuccess={() => {
              setIsAddProductTypeOpen(false);
              toast.success("Product type added successfully");
            }}
            onCancel={() => setIsAddProductTypeOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Form>
  );
}
