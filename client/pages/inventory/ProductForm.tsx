import { useEffect, useState, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCreateProduct, useUpdateProduct, useProduct } from '@/api/services/products';
import { Product, CreateProductRequest, UpdateProductRequest } from '@/types/api/products';
import { useUnitList } from '@/api/services/units';
import { useProductTypeList } from '@/api/services/productTypes';
import { Unit } from '@/types/api/units';
import { ProductType } from '@/types/api/productTypes';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PlusCircle, Info, Calculator, Package, ShieldCheck, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UnitsForm from '../settings/UnitsForm';
import ProductTypesForm from '../settings/ProductTypesForm';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProductFormProps {
  productId?: number;
  onClose: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function ProductForm({ productId, onClose }: ProductFormProps) {
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddProductTypeOpen, setIsAddProductTypeOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const { watch } = form;
  const purchaseRate = watch('standardPurchaseRate');
  const saleRate = watch('standardSaleRate');
  const taxPercentage = watch('taxPercentage');

  const marginInfo = useMemo(() => {
    const pRate = Number(purchaseRate) || 0;
    const sRate = Number(saleRate) || 0;
    const tPerc = Number(taxPercentage) || 0;

    if (pRate === 0 && sRate === 0) return null;

    const profit = sRate - pRate;
    const margin = sRate > 0 ? (profit / sRate) * 100 : 0;
    const taxAmount = (sRate * tPerc) / 100;
    const finalPrice = sRate + taxAmount;

    return {
      profit,
      margin,
      taxAmount,
      finalPrice
    };
  }, [purchaseRate, saleRate, taxPercentage]);

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

  const isSubmitting = isCreating || isUpdating;

  const onSubmit = async (data: ProductFormData) => {
    try {
      const payload = {
        ...data,
        description: data.description || '',
        storageConditions: data.storageConditions || '',
      };

      if (productId) {
        updateMutation.mutate(payload as UpdateProductRequest, {
          onSuccess: () => {
            setShowSuccess(true);
            setTimeout(() => {
              onClose();
            }, 1500);
          },
          onError: (error) => {
            toast.error(error.userMessage || 'Failed to update product');
          },
        });
      } else {
        createMutation.mutate(payload as CreateProductRequest, {
          onSuccess: () => {
            setShowSuccess(true);
            setTimeout(() => {
              onClose();
            }, 1500);
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

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-green-100 p-4 rounded-full mb-4"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold"
        >
          Success!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mt-2"
        >
          Product has been {productId ? 'updated' : 'created'} successfully.
        </motion.p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Section: Basic Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Aspirin 500mg"
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
                name="genericName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generic Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Acetylsalicylic Acid"
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
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ASPI-500"
                        {...field}
                        disabled={productId !== undefined}
                        className="transition-all duration-200 focus:scale-[1.01]"
                      />
                    </FormControl>
                    <FormDescription>Unique identifier code</FormDescription>
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
                      <Input
                        placeholder="e.g., Bayer"
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
                name="productTypeId"
                render={({ field }) => (
                  <FormItem>
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
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 border hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setIsAddProductTypeOpen(true)}
                      >
                        <PlusCircle className="h-5 w-5" />
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
                  <FormItem>
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
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 border hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setIsAddUnitOpen(true)}
                      >
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          {/* Section: Pricing & Margin */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calculator className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Pricing & Rates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="standardPurchaseRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Rate *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className="font-mono"
                      />
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
                    <FormLabel>Sale Rate *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className="font-mono text-green-600 font-bold"
                      />
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
                    <FormLabel>Tax % *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Margin Preview Helper */}
            <AnimatePresence>
              {marginInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-muted/50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Profit per Unit</p>
                    <p className={cn("text-sm font-bold", marginInfo.profit >= 0 ? "text-green-600" : "text-red-600")}>
                      PKR {marginInfo.profit.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Margin %</p>
                    <Badge variant={marginInfo.margin > 15 ? "default" : "secondary"}>
                      {marginInfo.margin.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tax Amount</p>
                    <p className="text-sm font-medium">PKR {marginInfo.taxAmount.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Retail Price (Inc. Tax)</p>
                    <p className="text-sm font-bold text-blue-600">PKR {marginInfo.finalPrice.toFixed(2)}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </motion.div>

          {/* Section: Inventory */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Inventory & Ordering</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="reorderLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50" {...field} />
                    </FormControl>
                    <FormDescription>Low stock alert point</FormDescription>
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
                    <FormDescription>Optimized order quantity</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          {/* Section: Compliance & Status */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-2 bg-purple-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Compliance & Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isBatchRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-card hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Batch Required</FormLabel>
                      <FormDescription>Batch tracking for expiry control</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiresPrescription"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-card hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Requires Prescription</FormLabel>
                      <FormDescription>Mandatory prescription for sale</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-card hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Product Status</FormLabel>
                      <FormDescription>Enable or disable this product</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          {/* Section: Notes & Storage */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-2 bg-slate-50 rounded-lg">
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold">Storage & Notes</h3>
            </div>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="storageConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Conditions</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Store below 25°C, protect from light"
                        {...field}
                        className="transition-all duration-200 focus:scale-[1.005]"
                      />
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
                        placeholder="Additional technical or clinical details..."
                        className="min-h-[100px] resize-none transition-all duration-200 focus:scale-[1.005]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 min-w-[140px] relative overflow-hidden group"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{productId ? 'Updating...' : 'Creating...'}</span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                {productId ? 'Update Product' : 'Create Product'}
              </span>
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
