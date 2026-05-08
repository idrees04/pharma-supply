import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Loader2, Save, ShoppingCart, Calculator, Calendar, MapPin, StickyNote, Package, Type, Search } from 'lucide-react';

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { purchaseOrderSchema, PurchaseOrderFormData } from '@/lib/schemas';
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  usePurchaseOrder
} from '@/api/services/purchaseOrders';
import { useActiveSuppliers, useSupplierProducts } from '@/api/services/suppliers';
import { productService } from '@/api/services/products';
import { formatCurrency, cn } from '@/lib/utils';
import { CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest } from '@/types/api/purchaseOrders';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEditMode = !!id && !location.pathname.includes('/view/');
  const isViewMode = !!id && location.pathname.includes('/view/');
  const isReadOnly = isViewMode;
  const poId = id ? parseInt(id) : null;
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = React.useState(false);
  const [supplierProductsQueryId, setSupplierProductsQueryId] = React.useState<number | null>(null);

  // 1. Fetch Data
  const { data: existingPO, isPending: isLoadingPO } = usePurchaseOrder(poId);
  const { data: suppliers = [], isPending: isLoadingSuppliers } = useActiveSuppliers();
  const sortedSuppliers = useMemo(() => {
    return [...suppliers].sort((a, b) => b.id - a.id);
  }, [suppliers]);
  // 2. Form Setup
  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: 0,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryAddress: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // 3. Sync existing data in edit/view mode
  useEffect(() => {
    if (existingPO && (isEditMode || isViewMode)) {
      form.reset({
        supplierId: existingPO.supplierId,
        orderDate: existingPO.orderDate.split('T')[0],
        expectedDeliveryDate: existingPO.expectedDeliveryDate.split('T')[0],
        deliveryAddress: existingPO.deliveryAddress,
        notes: existingPO.notes || '',
        items: existingPO.items.map(item => ({
          productId: item.productId,
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          taxPercentage: item.taxPercentage,
          discountPercentage: item.discountPercentage,
          supplyOrderIds: item.supplyOrderIds || [],
        })),
      });
      setSupplierProductsQueryId(
        existingPO.supplierId > 0 ? existingPO.supplierId : null
      );
    }
  }, [existingPO, isEditMode, isViewMode, form]);

  // 4. Supplier Selection & Dependent Queries
  // Fetch products by supplier (query id from state so first selection triggers fetch immediately)
  const { data: supplierProductsData, isPending: isLoadingSupplierProducts } = useSupplierProducts(supplierProductsQueryId);

  // Map supplier products to dropdown format
  const supplierProducts = useMemo(() => {
    if (!supplierProductsData) return [];
    return supplierProductsData.map(p => ({
      value: p.productId,
      label: `${p.productName} (${p.productCode})`,
      data: p // Store original data for prefilling
    }));
  }, [supplierProductsData]);

  // Effect to auto-append default row when supplier has products
  useEffect(() => {
    if (
      supplierProductsQueryId != null &&
      supplierProductsData &&
      supplierProductsData.length > 0 &&
      fields.length === 0
    ) {
      append({
        productId: 0,
        orderedQuantity: 1,
        unitPrice: 0,
        taxPercentage: 0,
        discountPercentage: 0,
        supplyOrderIds: []
      });
    }
  }, [supplierProductsQueryId, supplierProductsData, fields.length, append]);

  const handleClearTable = () => {
    if (fields.length > 0) {
      setIsClearAllConfirmOpen(true);
    }
  };

  const confirmClearTable = () => {
    replace([]);
    toast.success('All items cleared');
    setIsClearAllConfirmOpen(false);
  };

  // 5. Mutations
  const { mutate: createPO, isPending: isCreating } = useCreatePurchaseOrder();
  const { mutate: updatePO, isPending: isUpdating } = useUpdatePurchaseOrder(poId || 0);

  const onSubmit = (data: PurchaseOrderFormData) => {
    if (isReadOnly) return;

    if (isEditMode && poId) {
      const updateData: UpdatePurchaseOrderRequest = {
        expectedDeliveryDate: data.expectedDeliveryDate,
        status: existingPO?.status || 1,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes || '',
      };
      updatePO(updateData, {
        onSuccess: () => {
          toast.success('Purchase order updated successfully');
          navigate('/orders/purchase');
        },
        onError: (error: any) => {
          toast.error(error?.userMessage || 'Failed to update purchase order');
        },
      });
    } else {
      const createData: CreatePurchaseOrderRequest = {
        supplierId: data.supplierId,
        orderDate: data.orderDate,
        expectedDeliveryDate: data.expectedDeliveryDate,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes || '',
        items: data.items.map(item => ({
          productId: item.productId,
          productName: item.isManual ? item.productName : undefined,
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          taxPercentage: item.taxPercentage,
          discountPercentage: item.discountPercentage,
          supplyOrderIds: item.supplyOrderIds || []
        }))
      };
      createPO(createData, {
        onSuccess: () => {
          toast.success('Purchase order created successfully');
          navigate('/orders/purchase');
        },
        onError: (error: any) => {
          toast.error(error?.userMessage || 'Failed to create purchase order');
        },
      });
    }
  };

  // 6. Calculations
  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const calculations = useMemo(() => {
    const rowTotals = (watchedItems || []).map((item) => {
      const subtotal = (item.orderedQuantity || 0) * (item.unitPrice || 0);
      const taxAmount = subtotal * ((item.taxPercentage || 0) / 100);
      const discountAmount = subtotal * ((item.discountPercentage || 0) / 100);
      const total = subtotal + taxAmount - discountAmount;
      return { subtotal, taxAmount, discountAmount, total };
    });

    const grandTotal = rowTotals.reduce((sum, row) => sum + row.total, 0);

    return { rowTotals, grandTotal };
  }, [watchedItems]);

  // 7. Product Selection Logic
  const handleProductChange = async (index: number, productId: number) => {
    try {
      // Find the product in the prefetched list for immediate prefill
      const supplierProduct = supplierProductsData?.find(p => p.productId === productId);

      if (supplierProduct) {
        // Prefill unit price from supplier product API
        form.setValue(`items.${index}.unitPrice`, supplierProduct.purchaseRate);
        form.setValue(`items.${index}.discountPercentage`, 0);
      }

      // Still fetch full product details to get the tax percentage if not in supplier product
      const product = await productService.getProduct(productId);
      if (product) {
        form.setValue(`items.${index}.taxPercentage`, product.taxPercentage);
      }
    } catch (error) {
      console.error('Failed to fetch product details', error);
    }
  };

  // Prevent duplicate products in dropdown
  const getAvailableProducts = (currentIndex: number) => {
    const selectedProductIds = (watchedItems || [])
      .map((item, idx) => (idx !== currentIndex ? Number(item.productId) : null))
      .filter(Boolean);

    return supplierProducts.filter((p) => !selectedProductIds.includes(Number(p.value)));
  };

  if ((isEditMode || isViewMode) && isLoadingPO) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading purchase order details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/orders/purchase')} className="rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              {isViewMode ? `View Purchase Order #${existingPO?.purchaseOrderNumber}` : isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h1>
            <p className="text-muted-foreground">
              {isViewMode ? 'Detailed view of the purchase order' : isEditMode ? 'Update existing order details and items' : 'Fill in the details to create a new purchase order'}
            </p>
          </div>
        </div>

        {isViewMode && (
          <div />
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column: Basic Info */}
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
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" /> Supplier
                          </FormLabel>
                          <FormControl>
                            <SearchableSelect
                              items={sortedSuppliers.map(s => ({ value: s.id, label: s.supplierName }))}
                              value={field.value === 0 ? undefined : field.value}
                              onValueChange={(val) => {
                                if (isReadOnly) return;
                                const newSupplierId = Number(val);
                                const prev = field.value;
                                if (prev !== 0 && newSupplierId !== prev) {
                                  replace([]);
                                }
                                field.onChange(newSupplierId);
                                const nextQueryId =
                                  Number.isFinite(newSupplierId) && newSupplierId > 0
                                    ? newSupplierId
                                    : null;
                                setSupplierProductsQueryId(nextQueryId);
                              }}
                              placeholder="Choose Supplier"
                              isLoading={isLoadingSuppliers}
                              className={cn(
                                "h-11 border-muted-foreground/20",
                                (isEditMode || isViewMode) && "bg-muted cursor-not-allowed border-none opacity-80"
                              )}
                              disabled={isEditMode || isViewMode}
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
                              disabled={isEditMode || isViewMode}
                              className="h-11 border-muted-foreground/20 bg-muted/5 focus-visible:ring-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expectedDeliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Expected Delivery</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              disabled={isReadOnly}
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
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Delivery Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full delivery destination"
                              {...field}
                              disabled={isReadOnly}
                              className="h-11 border-muted-foreground/20 focus-visible:ring-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <StickyNote className="h-3 w-3" /> Special Instructions
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Any specific requirements or notes for the supplier..."
                              {...field}
                              disabled={isReadOnly}
                              className="h-11 border-muted-foreground/20 focus-visible:ring-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card className="shadow-sm border-muted/60">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Products &amp; Items
                      {fields.length > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center h-5 px-2 rounded-full bg-primary/10 text-primary text-xs font-black">
                          {fields.length} {fields.length === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>Select products and specify quantities for this order</CardDescription>
                  </div>
                  {!isReadOnly && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearTable}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        disabled={fields.length === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear All
                      </Button>
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
                          supplyOrderIds: []
                        })}
                        className="gap-2 shadow-sm border border-primary/20 hover:bg-primary/10 transition-colors text-primary font-bold"
                        disabled={supplierProductsQueryId == null || isLoadingSupplierProducts}
                      >
                        <Plus className="h-4 w-4" />
                        Add Row
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0 border-t">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[860px]">
                      <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <TableRow className="hover:bg-slate-50 border-b-2 border-slate-200">
                          <TableHead className="w-[52px] text-center font-black text-slate-500 border-r border-slate-200 text-xs uppercase tracking-wider">#</TableHead>
                          <TableHead className="min-w-[260px] pl-4 font-black text-slate-700 text-xs uppercase tracking-wider">Product / Description</TableHead>
                          <TableHead className="w-[110px] font-black text-slate-700 text-center text-xs uppercase tracking-wider">Qty</TableHead>
                          <TableHead className="w-[150px] font-black text-slate-700 text-xs uppercase tracking-wider">Unit Price (PKR)</TableHead>
                          <TableHead className="w-[100px] font-black text-blue-700 text-center text-xs uppercase tracking-wider bg-blue-50/60">Tax %</TableHead>
                          <TableHead className="w-[100px] font-black text-rose-700 text-center text-xs uppercase tracking-wider bg-rose-50/60">Disc %</TableHead>
                          <TableHead className="w-[170px] font-black text-primary text-right pr-5 text-xs uppercase tracking-wider bg-primary/5">Row Total (PKR)</TableHead>
                          {!isReadOnly && <TableHead className="w-[52px]" />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow
                            key={field.id}
                            className={cn(
                              "border-b border-slate-100 transition-colors hover:bg-primary/[0.02]",
                              index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                            )}
                          >
                            {/* Row number */}
                            <TableCell className="text-center border-r border-slate-100 bg-slate-50/80">
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-200/80 text-slate-600 text-[11px] font-black">
                                {index + 1}
                              </span>
                            </TableCell>

                            {/* Product */}
                            <TableCell className="pl-3 py-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.productId`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <SearchableSelect
                                        items={getAvailableProducts(index)}
                                        value={field.value}
                                        onValueChange={(val) => {
                                          field.onChange(val);
                                          handleProductChange(index, Number(val));
                                        }}
                                        placeholder="Find Product..."
                                        isLoading={isLoadingSupplierProducts}
                                        className={cn(
                                          "w-full font-semibold h-9",
                                          isReadOnly && "border-none bg-transparent cursor-default pointer-events-none text-foreground"
                                        )}
                                        disabled={isReadOnly}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-[10px] mt-0.5" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>

                            {/* Quantity */}
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
                                        disabled={isReadOnly}
                                        className={cn(
                                          "text-center font-black h-9 tabular-nums bg-white border-slate-200 focus:border-primary focus:bg-white",
                                          isReadOnly && "border-none bg-transparent text-center"
                                        )}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-[10px] mt-0.5" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>

                            {/* Unit Price */}
                            <TableCell className="px-2 py-2">
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
                                        disabled={isReadOnly}
                                        className={cn(
                                          "font-semibold h-9 tabular-nums bg-white border-slate-200 focus:border-primary focus:bg-white",
                                          isReadOnly && "border-none bg-transparent"
                                        )}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-[10px] mt-0.5" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>

                            {/* Tax % */}
                            <TableCell className="px-2 py-2 bg-blue-50/30">
                              <FormField
                                control={form.control}
                                name={`items.${index}.taxPercentage`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        disabled={isReadOnly}
                                        className={cn(
                                          "text-center font-bold text-blue-700 h-9 tabular-nums bg-blue-50/60 border-blue-200/70 focus:border-blue-400 focus:bg-white",
                                          isReadOnly && "border-none bg-transparent text-center"
                                        )}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-[10px] mt-0.5" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>

                            {/* Discount % */}
                            <TableCell className="px-2 py-2 bg-rose-50/30">
                              <FormField
                                control={form.control}
                                name={`items.${index}.discountPercentage`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        disabled={isReadOnly}
                                        className={cn(
                                          "text-center font-bold text-rose-700 h-9 tabular-nums bg-rose-50/60 border-rose-200/70 focus:border-rose-400 focus:bg-white",
                                          isReadOnly && "border-none bg-transparent text-center"
                                        )}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-[10px] mt-0.5" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>

                            {/* Row Total */}
                            <TableCell className="text-right pr-5 bg-primary/[0.04]">
                              <div className="flex flex-col items-end">
                                <span className="font-black text-primary tabular-nums text-[15px] leading-tight">
                                  {formatCurrency(calculations.rowTotals[index]?.total || 0)}
                                </span>
                                {(calculations.rowTotals[index]?.discountAmount > 0 || calculations.rowTotals[index]?.taxAmount > 0) && (
                                  <span className="text-[10px] text-slate-400 tabular-nums">
                                    base: {formatCurrency(calculations.rowTotals[index]?.subtotal || 0)}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Delete */}
                            {!isReadOnly && (
                              <TableCell className="text-center py-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {fields.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={isReadOnly ? 7 : 8} className="h-44 text-center text-muted-foreground bg-muted/5">
                              <div className="flex flex-col items-center gap-3">
                                {supplierProductsQueryId != null && !isLoadingSupplierProducts && (!supplierProductsData || supplierProductsData.length === 0) ? (
                                  <>
                                    <div className="bg-red-50 p-4 rounded-full">
                                      <Package className="h-10 w-10 text-red-400 opacity-80" />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="font-bold text-red-600 text-lg tracking-tight">No Products Linked</p>
                                      <p className="text-sm max-w-[380px] mx-auto leading-relaxed">
                                        We couldn't find any products associated with this supplier. Please link products to the supplier first.
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="bg-primary/5 p-4 rounded-full">
                                      <Package className="h-10 w-10 text-primary opacity-40" />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="italic font-bold text-foreground">No items added yet</p>
                                      <p className="text-xs text-muted-foreground">
                                        {supplierProductsQueryId == null
                                          ? "Please select a supplier to begin adding products."
                                          : 'Click "Add Row" to add products to this order.'}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Table Footer Summary */}
                  {fields.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm">
                      <span className="text-muted-foreground font-medium">{fields.length} product{fields.length !== 1 ? 's' : ''} in this order</span>
                      <span className="font-black text-primary tabular-nums text-base">
                        Total: {formatCurrency(calculations.grandTotal)}
                      </span>
                    </div>
                  )}
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
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-muted-foreground uppercase tracking-tight text-xs">Gross Subtotal</span>
                      <span className="font-bold">{formatCurrency(calculations.rowTotals.reduce((sum, r) => sum + r.subtotal, 0))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-muted-foreground uppercase tracking-tight text-xs">Taxes Accrued</span>
                      <span className="text-blue-600 font-bold">+{formatCurrency(calculations.rowTotals.reduce((sum, r) => sum + r.taxAmount, 0))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-muted-foreground uppercase tracking-tight text-xs">Total Discounts</span>
                      <span className="text-red-600 font-bold">-{formatCurrency(calculations.rowTotals.reduce((sum, r) => sum + r.discountAmount, 0))}</span>
                    </div>

                    <div className="border-t border-dashed pt-4 mt-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Grand net total (PKR)</span>
                        <div className="text-3xl font-black text-primary tracking-tighter drop-shadow-sm">
                          {formatCurrency(calculations.grandTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 bg-muted/10 pt-4 border-t">
                  {!isReadOnly && (
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
                      {isEditMode ? 'Update Purchase Order' : 'Submit Final Order'}
                    </Button>
                  )}
                  {isReadOnly && (
                    <div />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => navigate('/orders/purchase')}
                  >
                    Return to List
                  </Button>
                </CardFooter>
              </Card>

              {/* Related Info */}
              {supplierProductsQueryId != null && !isReadOnly && (
                <Card className="border-none shadow-none bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Supplier Inventory Hints</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed">
                    This supplier has {supplierProducts.length} items cataloged based on historical purchase orders.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={isClearAllConfirmOpen}
        onOpenChange={setIsClearAllConfirmOpen}
        title="Clear All Items?"
        description="This will remove all products from the table. This action cannot be undone."
        onConfirm={confirmClearTable}
        confirmText="Clear Everything"
        variant="destructive"
      />
    </div>
  );
}
