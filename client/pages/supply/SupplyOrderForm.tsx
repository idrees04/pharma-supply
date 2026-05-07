import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, Save, ShoppingCart, Calculator, Calendar, MapPin, StickyNote, Package, User, ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { EnumSelect } from '@/components/ui/enum-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supplyOrderSchema, SupplyOrderFormData } from '@/lib/schemas';
import {
  useCreateSupplyOrder,
  useUpdateSupplyOrder,
  useSupplyOrder,
  useSupplyOrderStatuses
} from '@/api/services/supplyOrders.service';
import { useSupplyOrderFulfillmentSourceOptions, useSupplyOrderStatusOptions } from '@/hooks/dropdown';
import { useProductSuppliersByProduct } from '@/api/services/productSuppliers';
import { useGetHospitals } from '@/hooks/useHospitals';
import { useProductList } from '@/api/services/products';
import { formatCurrency, cn } from '@/lib/utils';
import { CreateSupplyOrderRequest, UpdateSupplyOrderRequest } from '@/types/api/supplyOrders';
import { Product } from '@/types/api/products';

interface SupplyOrderFormProps {
  supplyOrderId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type SupplyOrderFormValues = SupplyOrderFormData & {
  status?: number;
};

interface OrderItemRowProps {
  index: number;
  isEditMode: boolean;
  form: UseFormReturn<SupplyOrderFormValues>;
  products: Product[];
  isLoadingProducts: boolean;
  onRemove: (index: number) => void;
  handleProductChange: (index: number, productId: number) => void;
  selectedProductIds: number[];
  rowTotal: number;
  fulfillmentSourceOptions: Array<{ value: number; displayName: string }>;
}

function OrderItemRow({
  index,
  isEditMode,
  form,
  products,
  isLoadingProducts,
  onRemove,
  handleProductChange,
  selectedProductIds,
  rowTotal,
  fulfillmentSourceOptions
}: OrderItemRowProps) {
  const productId = useWatch({
    control: form.control,
    name: `items.${index}.productId`
  });

  const { data: productSuppliers, isPending: isLoadingSuppliers } = useProductSuppliersByProduct(productId || null);

  // Filter out already selected products (except the current one)
  const availableProducts = useMemo(() => {
    return products.filter(p => !selectedProductIds.includes(p.id) || p.id === productId);
  }, [products, selectedProductIds, productId]);

  return (
    <TableRow className={cn("border-b border-slate-100 transition-colors hover:bg-primary/[0.02]", index % 2 === 0 ? "bg-white" : "bg-slate-50/60")}>
      <TableCell className="text-center border-r border-slate-100 bg-slate-50/80">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-200/80 text-slate-600 text-[11px] font-black">
          {index + 1}
        </span>
      </TableCell>

      <TableCell className="pl-3 py-2">
        <FormField
          control={form.control}
          name={`items.${index}.productId`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <SearchableSelect
                  items={availableProducts.map(p => ({ value: p.id, label: p.productName }))}
                  value={field.value}
                  onValueChange={(val) => {
                    // Clear supplier when product changes
                    form.setValue(`items.${index}.supplierId`, 0);
                    field.onChange(Number(val));
                    handleProductChange(index, Number(val));
                  }}
                  placeholder="Find Product..."
                  isLoading={isLoadingProducts}
                  className="w-full font-semibold h-9"
                  disabled={isEditMode}
                />
              </FormControl>
              <FormMessage className="text-[10px] mt-0.5" />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className="px-2 py-2">
        <FormField
          control={form.control}
          name={`items.${index}.orderedQuantity`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  disabled={isEditMode}
                  className="text-center font-black h-9 tabular-nums bg-white border-slate-200 focus:border-primary"
                />
              </FormControl>
              <FormMessage className="text-[10px] mt-0.5" />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className="px-2 py-2 text-right">
        <FormField
          control={form.control}
          name={`items.${index}.unitPrice`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  disabled={isEditMode}
                  className="text-right font-semibold h-9 tabular-nums bg-white border-slate-200 focus:border-primary"
                />
              </FormControl>
              <FormMessage className="text-[10px] mt-0.5" />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className="px-1 py-2">
        <FormField
          control={form.control}
          name={`items.${index}.taxPercentage`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  {...field}
                  disabled={isEditMode}
                  className="text-center font-medium h-9 tabular-nums bg-white border-slate-200 focus:border-primary px-1"
                />
              </FormControl>
              <FormMessage className="text-[10px] mt-0.5" />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className="px-1 py-2">
        <FormField
          control={form.control}
          name={`items.${index}.discountPercentage`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  {...field}
                  disabled={isEditMode}
                  className="text-center font-medium h-9 tabular-nums bg-white border-slate-200 focus:border-primary px-1"
                />
              </FormControl>
              <FormMessage className="text-[10px] mt-0.5" />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className="px-2 py-2">
        <FormField
          control={form.control}
          name={`items.${index}.fulfillmentSource`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <EnumSelect
                  items={fulfillmentSourceOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditMode}
                  placeholder="Select source"
                  searchPlaceholder="Search sources..."
                  className="h-9"
                />
              </FormControl>
              <FormMessage className="text-[10px] mt-0.5" />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className="px-2 py-2">
        <FormField
          control={form.control}
          name={`items.${index}.supplierId`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <SearchableSelect
                  items={[{ value: 0, label: 'None' }, ...(productSuppliers || []).map(s => ({ value: s.supplierId, label: s.supplierName }))]}
                  value={field.value}
                  onValueChange={(val) => field.onChange(Number(val))}
                  placeholder="Supplier (Optional)"
                  isLoading={isLoadingSuppliers}
                  className="w-full font-semibold h-9"
                  disabled={isEditMode || !productId}
                />
              </FormControl>
              <FormMessage className="text-[10px] mt-0.5" />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className="text-right pr-5 bg-primary/[0.04]">
        <span className="font-black text-primary tabular-nums text-[14px]">
          {formatCurrency(rowTotal)}
        </span>
      </TableCell>

      {!isEditMode && (
        <TableCell className="text-center py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

export default function SupplyOrderForm({ supplyOrderId: propSupplyOrderId, onSuccess, onCancel }: SupplyOrderFormProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const supplyOrderId = propSupplyOrderId || (id ? Number(id) : undefined);
  const isEditMode = !!supplyOrderId;

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/supply-orders');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/supply-orders');
    }
  };

  // 1. Fetch Data
  const { data: existingSO, isPending: isLoadingSO } = useSupplyOrder(supplyOrderId || null);
  const { data: hospitalsData, isPending: isLoadingHospitals } = useGetHospitals({ pageSize: 1000, pageNumber: 1 });
  const { data: productsData, isPending: isLoadingProducts } = useProductList({ pageSize: 1000, pageNumber: 1 });
  useSupplyOrderStatuses();
  const { data: supplyOrderStatusOptions, isLoading: isLoadingSupplyOrderStatuses } = useSupplyOrderStatusOptions();
  const { data: fulfillmentSourceOptions = [] } = useSupplyOrderFulfillmentSourceOptions();

  const hospitals = hospitalsData?.data?.items || [];
  const products = productsData?.items || [];
  const sortedHospitals = useMemo(() => {
    return [...hospitals].sort((a, b) => b.id - a.id);
  }, [hospitals]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => b.id - a.id);
  }, [products]);

  // 2. Form Setup
  const form = useForm<SupplyOrderFormValues>({
    resolver: zodResolver(supplyOrderSchema),
    defaultValues: {
      hospitalId: 0,
      orderDate: new Date().toISOString().split('T')[0],
      requiredByDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      requestedBy: '',
      shippingAddress: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // 3. Sync existing data in edit mode
  useEffect(() => {
    if (existingSO && isEditMode) {
      form.reset({
        hospitalId: existingSO.hospitalId,
        orderDate: existingSO.orderDate.split('T')[0],
        requiredByDate: existingSO.requiredByDate.split('T')[0],
        requestedBy: existingSO.requestedBy,
        shippingAddress: existingSO.shippingAddress,
        notes: existingSO.notes || '',
        items: existingSO.items.map(item => ({
          productId: item.productId,
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          taxPercentage: item.taxPercentage,
          discountPercentage: item.discountPercentage,
          fulfillmentSource: item.fulfillmentSource,
          supplierId: item.supplierId,
        })),
        status: existingSO.status,
      });
    }
  }, [existingSO, isEditMode, form]);

  // 4. Mutations
  const { mutate: createSO, isPending: isCreating } = useCreateSupplyOrder();
  const { mutate: updateSO, isPending: isUpdating } = useUpdateSupplyOrder(supplyOrderId || 0);

  const onSubmit = (data: SupplyOrderFormValues) => {
    // Helper to format date to ISO string if it's just a YYYY-MM-DD string
    const formatToISO = (dateStr: string) => {
      if (!dateStr) return '';
      if (dateStr.includes('T')) return dateStr;
      return new Date(dateStr).toISOString();
    };

    if (isEditMode && supplyOrderId) {
      const updateData: UpdateSupplyOrderRequest = {
        requiredByDate: formatToISO(data.requiredByDate),
        requestedBy: data.requestedBy,
        shippingAddress: data.shippingAddress,
        notes: data.notes || '',
        status: data.status ?? existingSO?.status ?? 1,
      };
      updateSO(updateData, {
        onSuccess: () => {
          toast.success('Supply order updated successfully');
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.userMessage || 'Failed to update supply order');
        },
      });
    } else {
      const createData: CreateSupplyOrderRequest = {
        hospitalId: data.hospitalId,
        orderDate: formatToISO(data.orderDate),
        requiredByDate: formatToISO(data.requiredByDate),
        requestedBy: data.requestedBy,
        shippingAddress: data.shippingAddress,
        notes: data.notes || '',
        items: data.items.map(item => ({
          productId: item.productId,
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          taxPercentage: item.taxPercentage,
          discountPercentage: item.discountPercentage,
          fulfillmentSource: item.fulfillmentSource,
          supplierId: item.supplierId,
        }))
      };
      createSO(createData, {
        onSuccess: () => {
          toast.success('Supply order created successfully');
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.userMessage || 'Failed to create supply order');
        },
      });
    }
  };

  // 5. Calculations
  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const selectedProductIds = useMemo(() => {
    return (watchedItems || []).map(item => item?.productId).filter(Boolean) as number[];
  }, [watchedItems]);

  const calculations = useMemo(() => {
    const rowTotals = (watchedItems || []).map((item) => {
      const subtotal = (item.orderedQuantity || 0) * (item.unitPrice || 0);
      const taxAmount = subtotal * ((item.taxPercentage || 0) / 100);
      const discountAmount = subtotal * ((item.discountPercentage || 0) / 100);
      const total = subtotal + taxAmount - discountAmount;
      return { subtotal, taxAmount, discountAmount, total };
    });

    const grandSubtotal = rowTotals.reduce((sum, row) => sum + row.subtotal, 0);
    const grandTax = rowTotals.reduce((sum, row) => sum + row.taxAmount, 0);
    const grandDiscount = rowTotals.reduce((sum, row) => sum + row.discountAmount, 0);
    const grandTotal = rowTotals.reduce((sum, row) => sum + row.total, 0);

    return { rowTotals, grandSubtotal, grandTax, grandDiscount, grandTotal };
  }, [watchedItems]);

  // Handle Product Change
  const handleProductChange = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.unitPrice`, product.standardSaleRate);
      form.setValue(`items.${index}.taxPercentage`, product.taxPercentage);
      form.setValue(`items.${index}.discountPercentage`, 0);
      form.setValue(`items.${index}.fulfillmentSource`, 1); // Default to Warehouse
      form.setValue(`items.${index}.supplierId`, 0); // Default to None
    }
  };

  if (isEditMode && isLoadingSO) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading supply order details...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-slide-up">
        {/* Header navigation if in page mode */}
        {!propSupplyOrderId && (
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditMode ? 'Edit Supply Order' : 'Create Supply Order'}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode ? 'Update existing supply order details' : 'Fill in the details to create a new hospital supply order'}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to List
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Basic Info & Items */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="hospitalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Hospital
                        </FormLabel>
                        <FormControl>
                          <SearchableSelect
                            items={sortedHospitals.map(h => ({ value: h.id, label: h.hospitalName }))}
                            value={field.value}
                            onValueChange={(val) => field.onChange(Number(val))}
                            placeholder="Choose Hospital"
                            isLoading={isLoadingHospitals}
                            className={cn(
                              "h-11 border-muted-foreground/20",
                              isEditMode && "bg-muted cursor-not-allowed border-none opacity-80"
                            )}
                            disabled={isEditMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Order Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            disabled={isEditMode}
                            className="h-11 border-muted-foreground/20 bg-muted/5 focus-visible:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requiredByDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Required By</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="h-11 border-muted-foreground/20 focus-visible:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="requestedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Requested By
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter requester name"
                            {...field}
                            className="h-11 border-muted-foreground/20 focus-visible:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Shipping Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter shipping destination"
                            {...field}
                            className="h-11 border-muted-foreground/20 focus-visible:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isEditMode && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Status</FormLabel>
                        <FormControl>
                          <EnumSelect
                            items={supplyOrderStatusOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            isLoading={isLoadingSupplyOrderStatuses}
                            placeholder="Select status"
                            searchPlaceholder="Search statuses..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <StickyNote className="h-3 w-3" /> Notes
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Any additional notes..."
                          {...field}
                          className="h-11 border-muted-foreground/20 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Order Items
                    {fields.length > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-5 px-2 rounded-full bg-primary/10 text-primary text-xs font-black">
                        {fields.length}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Add products and fulfillment details</CardDescription>
                </div>
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => append({
                      productId: 0,
                      orderedQuantity: 1,
                      unitPrice: 0,
                      taxPercentage: 0,
                      discountPercentage: 0,
                      fulfillmentSource: 1,
                      supplierId: 0
                    })}
                    className="gap-2 shadow-sm border border-primary/20 hover:bg-primary/10 transition-colors text-primary font-bold"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="overflow-x-auto">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow className="hover:bg-slate-50 border-b-2 border-slate-200">
                        <TableHead className="w-[52px] text-center font-black text-slate-500 border-r border-slate-200 text-xs uppercase tracking-wider">#</TableHead>
                        <TableHead className="min-w-[200px] pl-4 font-black text-slate-700 text-xs uppercase tracking-wider">Product</TableHead>
                        <TableHead className="w-[80px] font-black text-slate-700 text-center text-xs uppercase tracking-wider">Qty</TableHead>
                        <TableHead className="w-[110px] font-black text-slate-700 text-xs uppercase tracking-wider text-right">Price</TableHead>
                        <TableHead className="w-[80px] font-black text-slate-700 text-center text-xs uppercase tracking-wider">Tax %</TableHead>
                        <TableHead className="w-[80px] font-black text-slate-700 text-center text-xs uppercase tracking-wider">Disc %</TableHead>
                        <TableHead className="w-[120px] font-black text-slate-700 text-xs uppercase tracking-wider">Source</TableHead>
                        <TableHead className="w-[150px] font-black text-slate-700 text-xs uppercase tracking-wider">Supplier</TableHead>
                        <TableHead className="w-[130px] font-black text-primary text-right pr-5 text-xs uppercase tracking-wider bg-primary/5">Total</TableHead>
                        {!isEditMode && <TableHead className="w-[52px]" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <OrderItemRow
                          key={field.id}
                          index={index}
                          form={form}
                          isEditMode={isEditMode}
                          products={sortedProducts}
                          isLoadingProducts={isLoadingProducts}
                          onRemove={remove}
                          handleProductChange={handleProductChange}
                          selectedProductIds={selectedProductIds}
                          rowTotal={calculations.rowTotals[index]?.total || 0}
                          fulfillmentSourceOptions={fulfillmentSourceOptions}
                        />
                      ))}
                      {fields.length > 0 && (
                        <>
                          <TableRow className="bg-slate-100/50 font-bold border-t-2 border-slate-200">
                            <TableCell colSpan={8} className="text-right py-3 text-slate-600 uppercase text-[11px] tracking-wider pr-4">
                              Total Gross Amount
                            </TableCell>
                            <TableCell className="text-right pr-5 bg-primary/5">
                              <span className="font-bold text-slate-700 tabular-nums text-sm">
                                {formatCurrency(calculations.grandSubtotal)}
                              </span>
                            </TableCell>
                            {!isEditMode && <TableCell />}
                          </TableRow>
                          <TableRow className="bg-primary/5 font-black border-t border-slate-200">
                            <TableCell colSpan={8} className="text-right py-3 text-primary uppercase text-[12px] tracking-widest pr-4">
                              Total Net Amount
                            </TableCell>
                            <TableCell className="text-right pr-5 bg-primary/10">
                              <span className="font-black text-primary tabular-nums text-md">
                                {formatCurrency(calculations.grandTotal)}
                              </span>
                            </TableCell>
                            {!isEditMode && <TableCell />}
                          </TableRow>
                        </>
                      )}
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center text-muted-foreground bg-muted/5">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-8 w-8 opacity-20" />
                              <p className="italic">No items added to this supply order.</p>
                              {!isEditMode && (
                                <Button type="button" variant="link" size="sm" onClick={() => append({ productId: 0, orderedQuantity: 1, unitPrice: 0, taxPercentage: 0, discountPercentage: 0, fulfillmentSource: 1, supplierId: 0 })}>
                                  Click here to add the first item
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary Box */}
          <div className="space-y-6">
            <Card className="sticky top-6 shadow-lg border-primary/20 overflow-hidden">
              <div className="h-2 bg-primary" />
              <CardHeader className="bg-muted/20 border-b">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-medium border-b border-slate-100 pb-2">
                    <span className="text-muted-foreground uppercase tracking-tight text-xs">Gross Amount</span>
                    <div className="text-md font-bold text-slate-700 tracking-tight">
                      {formatCurrency(calculations.grandSubtotal)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium border-b border-slate-100 pb-2">
                    <span className="text-muted-foreground uppercase tracking-tight text-xs">Tax Amount</span>
                    <div className="text-md font-bold text-slate-700 tracking-tight">
                      + {formatCurrency(calculations.grandTax)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium border-b border-slate-100 pb-2">
                    <span className="text-muted-foreground uppercase tracking-tight text-xs">Discount</span>
                    <div className="text-md font-bold text-slate-700 tracking-tight">
                      - {formatCurrency(calculations.grandDiscount)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground uppercase tracking-tight text-xs font-bold">Net Total</span>
                    <div className="text-2xl font-black text-primary tracking-tighter">
                      {formatCurrency(calculations.grandTotal)}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 bg-muted/10 pt-4 border-t">
                <Button
                  type="submit"
                  className="w-full gap-2 h-12 text-md font-bold shadow-md hover:shadow-lg transition-all"
                  disabled={isCreating || isUpdating}
                >
                  {(isCreating || isUpdating) ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {isEditMode ? 'Update Supply Order' : 'Create Supply Order'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
