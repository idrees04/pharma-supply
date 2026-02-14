import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  usePurchaseOrder,
  usePurchaseOrdersBySupplier
} from '@/api/services/purchaseOrders';
import { useActiveSuppliers } from '@/api/services/suppliers';
import { useProductList, productService } from '@/api/services/products';
import { formatCurrency } from '@/lib/utils';
import { CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest } from '@/types/api/purchaseOrders';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const poId = id ? parseInt(id) : null;

  // 1. Fetch Data
  const { data: existingPO, isPending: isLoadingPO } = usePurchaseOrder(poId);
  const { data: suppliers = [], isPending: isLoadingSuppliers } = useActiveSuppliers();
  const { data: productsData, isPending: isLoadingProducts } = useProductList({ pageSize: 1000 });
  const products = productsData?.items || [];

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

  // 3. Sync existing data in edit mode
  useEffect(() => {
    if (existingPO && isEditMode) {
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
    }
  }, [existingPO, isEditMode, form]);

  // 4. Supplier Selection Logic
  const selectedSupplierId = useWatch({ control: form.control, name: 'supplierId' });
  // Trigger API call when supplier changes (per prompt requirement)
  const { data: supplierPOs } = usePurchaseOrdersBySupplier(selectedSupplierId || null);

  // 5. Mutations
  const { mutate: createPO, isPending: isCreating } = useCreatePurchaseOrder();
  const { mutate: updatePO, isPending: isUpdating } = useUpdatePurchaseOrder(poId || 0);

  const onSubmit = (data: PurchaseOrderFormData) => {
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
        ...data,
        items: data.items.map(item => ({
            ...item,
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
      const product = await productService.getProduct(productId);
      if (product) {
        form.setValue(`items.${index}.unitPrice`, product.standardPurchaseRate);
        form.setValue(`items.${index}.taxPercentage`, product.taxPercentage);
        // Assuming discount starts at 0 or from some product logic
        form.setValue(`items.${index}.discountPercentage`, 0);
      }
    } catch (error) {
      console.error('Failed to fetch product details', error);
    }
  };

  // Prevent duplicate products in dropdown
  const getAvailableProducts = (currentIndex: number) => {
    const selectedProductIds = (watchedItems || [])
      .map((item, idx) => (idx !== currentIndex ? item.productId : null))
      .filter(Boolean);

    return products
      .filter((p) => !selectedProductIds.includes(p.id))
      .map((p) => ({ value: p.id, label: `${p.productName} (${p.productCode})` }));
  };

  if (isEditMode && isLoadingPO) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading purchase order details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders/purchase')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? `Edit Purchase Order #${existingPO?.purchaseOrderNumber}` : 'Create Purchase Order'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update existing order details and items' : 'Fill in the details to create a new purchase order'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              items={suppliers.map(s => ({ value: s.id, label: s.supplierName }))}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select a supplier"
                              isLoading={isLoadingSuppliers}
                              className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
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
                          <FormLabel>Order Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={isEditMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expectedDeliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Delivery Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter delivery address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Any specific instructions for this order..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Products & Items</CardTitle>
                  {!isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({
                        productId: 0,
                        orderedQuantity: 1,
                        unitPrice: 0,
                        taxPercentage: 0,
                        discountPercentage: 0,
                        supplyOrderIds: []
                      })}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Product</TableHead>
                        <TableHead className="w-[100px]">Qty</TableHead>
                        <TableHead className="w-[120px]">Unit Price</TableHead>
                        <TableHead className="w-[100px]">Tax %</TableHead>
                        <TableHead className="w-[100px]">Disc %</TableHead>
                        <TableHead className="w-[120px]">Total</TableHead>
                        {!isEditMode && <TableHead className="w-[50px] pr-6"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell className="pl-6">
                            <FormField
                              control={form.control}
                              name={`items.${index}.productId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <SearchableSelect
                                      items={getAvailableProducts(index)}
                                      value={field.value}
                                      onValueChange={(val) => {
                                        field.onChange(val);
                                        handleProductChange(index, Number(val));
                                      }}
                                      placeholder="Select Product"
                                      isLoading={isLoadingProducts}
                                      className="w-full min-w-[200px]"
                                      disabled={isEditMode}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.orderedQuantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        {...field} 
                                        disabled={isEditMode}
                                        className="w-[80px]" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        {...field} 
                                        disabled={isEditMode}
                                        className="w-[100px]" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.taxPercentage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        {...field} 
                                        disabled={isEditMode}
                                        className="w-[80px]" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.discountPercentage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        {...field} 
                                        disabled={isEditMode}
                                        className="w-[80px]" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(calculations.rowTotals[index]?.total || 0)}
                          </TableCell>
                          {!isEditMode && (
                            <TableCell className="pr-6">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                            No items added yet. Click "Add Item" to start.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Summary */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(calculations.rowTotals.reduce((sum, r) => sum + r.subtotal, 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Tax</span>
                      <span className="text-green-600">+{formatCurrency(calculations.rowTotals.reduce((sum, r) => sum + r.taxAmount, 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Discount</span>
                      <span className="text-red-600">-{formatCurrency(calculations.rowTotals.reduce((sum, r) => sum + r.discountAmount, 0))}</span>
                    </div>
                    <div className="border-t pt-2 mt-4">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Grand Total</span>
                        <span className="text-primary">{formatCurrency(calculations.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button 
                    type="submit" 
                    className="w-full gap-2 h-11" 
                    disabled={isCreating || isUpdating}
                  >
                    {(isCreating || isUpdating) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isEditMode ? 'Update Purchase Order' : 'Submit Purchase Order'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/orders/purchase')}
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </Card>

              {/* Quick Info / History */}
              {selectedSupplierId > 0 && supplierPOs && supplierPOs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Supplier POs</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {supplierPOs.slice(0, 3).map((po) => (
                        <div key={po.id} className="p-3 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{po.purchaseOrderNumber}</p>
                            <p className="text-muted-foreground">{new Date(po.orderDate).toLocaleDateString()}</p>
                          </div>
                          <p className="font-medium">{formatCurrency(po.totalAmount)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
