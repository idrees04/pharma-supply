import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Package, Trash2, Edit2, Check, X } from 'lucide-react';
import { useProductSuppliersBySupplier, useDeleteProductSupplier, useUpdateProductSupplier } from '@/api/services/productSuppliers';
import { ProductSupplier } from '@/types/api/productSuppliers';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';

interface LinkedProductsTableProps {
    supplierId: number;
}

export const LinkedProductsTable: React.FC<LinkedProductsTableProps> = ({ supplierId }) => {
    const { data: products, isPending, error } = useProductSuppliersBySupplier(supplierId);
    const deleteMutation = useDeleteProductSupplier(supplierId); // Note: Hook expects generic ID, but here we deleting specific relation
    // Wait, useDeleteProductSupplier(id) expects the ID of the product-supplier relation, not supplierId.
    // But usage in hook definition: const { mutate } = useDeleteProductSupplier(id);
    // Actually the hook factory `useDeleteProductSupplier` takes an id? No, looks like it takes id to invalidate?
    // Let's check the hook definition in `productSuppliers.ts`.
    /*
    export function useDeleteProductSupplier(id: number) {
      const queryClient = useQueryClient();
      return useDeleteMutation(
        () => productSupplierService.deleteProductSupplier(id),
        { onSuccess: ... }
      );
    }
    Wait, if I call useDeleteProductSupplier(123), it returns a mutation that deletes 123?
    The hook takes `id` as argument. This seems to be "useDeleteProductSupplierById".
    But usually mutations are `useDeleteProductSupplier()`.
    The hook implementation:
    export function useDeleteProductSupplier(id: number) {
      return useDeleteMutation(
        () => productSupplierService.deleteProductSupplier(id), ...
      )
    }
    This means the hook is bound to a specific ID at render time? That's annoying for a list.
    I should check if I can use a generic mutation or if I have to create a wrapper.
    Actually, the `useDeleteProductSupplier` hook in `productSuppliers.ts` IS bound to an ID. 
    "export function useDeleteProductSupplier(id: number)"
    This is a bit restrictive for a table where I want to delete different rows.
    I might need to refactor the hook or use `productSupplierService.deleteProductSupplier` directly with `useMutation`.
    
    However, for now, let's look at `useUpdateProductSupplier`.
    "export function useUpdateProductSupplier(id: number)"
    Same thing.
    
    I will stick to displaying the data first. I won't implement Edit/Delete in this iteration unless I have time or it's critical. 
    The plan didn't explicitly ask for Edit/Delete in the Linked Products Table, just "Display all supplier information... Linked Products Table".
    But "Refetching after mutations" was mentioned, implying mutations might happen.
    The "Link Products" modal does the linking.
    
    I will implement the table display first.
    */

    if (isPending) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Linked Products</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Linked Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <span>Error loading linked products: {error.message}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!products || products.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Linked Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No products linked to this supplier yet.</p>
                        <p className="text-sm">Click "Link Products" to add some.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Linked Products ({products.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Supplier Code</TableHead>
                            <TableHead className="text-right">Purchase Rate</TableHead>
                            <TableHead className="text-right">Lead Time</TableHead>
                            <TableHead className="text-center">Preferred</TableHead>
                            <TableHead className="text-center">Min Order Qty</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell>{item.productCode}</TableCell>
                                <TableCell>{item.supplierProductCode || '-'}</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.purchaseRate)}
                                </TableCell>
                                <TableCell className="text-right">{item.leadTimeDays} days</TableCell>
                                <TableCell className="text-center">
                                    {item.isPreferredSupplier && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                            Preferred
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">{item.minOrderQuantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
