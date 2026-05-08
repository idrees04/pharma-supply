import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, X, ArrowRight } from 'lucide-react';
import { Product } from '@/types/api/products';
import { useProductList } from '@/api/services/products';
import { useProductSuppliersBySupplier, useBulkLinkProductSuppliers } from '@/api/services/productSuppliers';
import { purchaseOrderService } from '@/api/services/purchaseOrders';
import { PartialOrderRequest } from '@/types/api/purchaseOrders';
import { toast } from 'sonner';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface LinkProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierId: number;
    /** If provided, chains POST /api/PurchaseOrders/{id}/partial-order after bulk-link */
    purchaseOrderId?: number;
    /** Supply order IDs to pass in the partial-order request */
    supplyOrderIds?: number[];
}

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Config for each selected product in the right panel */
interface SelectedProductItem {
    productId: number;
    productName: string;
    productCode: string;
    supplierProductCode: string;
    supplierRate: number;
    leadTimeDays: number;
    minimumOrderQuantity: number;
    discountPercentage: number;
    isPreferredSupplier: boolean;
    notes: string;
    isExisting: boolean;
}

/** Keys that can be updated via the card form */
type EditableStringField = 'supplierProductCode' | 'notes';
type EditableNumberField = 'supplierRate' | 'leadTimeDays' | 'minimumOrderQuantity' | 'discountPercentage';
type EditableBooleanField = 'isPreferredSupplier';

// ─── Component ─────────────────────────────────────────────────────────────────

export const LinkProductsModal: React.FC<LinkProductsModalProps> = ({
    isOpen,
    onClose,
    supplierId,
    purchaseOrderId,
    supplyOrderIds = [],
}) => {
    // ── Local State ──────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<Record<number, SelectedProductItem>>({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [isChainingApi, setIsChainingApi] = useState(false);

    // ── Data Fetching ────────────────────────────────────────────────────────
    // Fetch all products once (large page) and filter locally for instant UX
    const { data: productsData, isPending: isLoadingProducts } = useProductList({
        pageNumber: 1,
        pageSize: 1000,
    });

    // Fetch existing linked products to pre-fill
    const { data: linkedProducts, isPending: isLoadingLinks } = useProductSuppliersBySupplier(supplierId);

    const { mutateAsync: bulkLinkAsync, isPending: isSubmitting } = useBulkLinkProductSuppliers();

    // ── Initialize selection from existing links ─────────────────────────────
    useEffect(() => {
        if (isOpen && linkedProducts && !isInitialized) {
            const initialSelection: Record<number, SelectedProductItem> = {};
            linkedProducts.forEach(lp => {
                initialSelection[lp.productId] = {
                    productId: lp.productId,
                    productName: lp.productName ?? '',
                    productCode: lp.productCode ?? '',
                    supplierProductCode: lp.supplierProductCode ?? '',
                    supplierRate: lp.purchaseRate,
                    leadTimeDays: lp.leadTimeDays,
                    minimumOrderQuantity: lp.minOrderQuantity,
                    discountPercentage: 0,
                    isPreferredSupplier: lp.isPreferredSupplier,
                    notes: '',
                    isExisting: true,
                };
            });
            setSelectedItems(initialSelection);
            setIsInitialized(true);
        } else if (!isOpen) {
            // Reset on close
            setIsInitialized(false);
            setSelectedItems({});
            setSearchTerm('');
            setIsChainingApi(false);
        }
    }, [isOpen, linkedProducts, isInitialized]);

    // ── Product Toggle ───────────────────────────────────────────────────────
    const toggleProduct = useCallback((product: Product) => {
        setSelectedItems(prev => {
            const next = { ...prev };
            if (next[product.id]) {
                delete next[product.id];
            } else {
                next[product.id] = {
                    productId: product.id,
                    productName: product.productName,
                    productCode: product.productCode,
                    supplierProductCode: '',
                    supplierRate: product.standardPurchaseRate || 0,
                    leadTimeDays: 0,
                    minimumOrderQuantity: 1,
                    discountPercentage: 0,
                    isPreferredSupplier: false,
                    notes: '',
                    isExisting: false,
                };
            }
            return next;
        });
    }, []);

    // ── Remove Product ───────────────────────────────────────────────────────
    const removeProduct = useCallback((productId: number) => {
        setSelectedItems(prev => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    }, []);

    // ── Update Item Field (strictly typed, no `any`) ─────────────────────────
    const updateStringField = useCallback((productId: number, field: EditableStringField, value: string) => {
        setSelectedItems(prev => ({
            ...prev,
            [productId]: { ...prev[productId], [field]: value },
        }));
    }, []);

    const updateNumberField = useCallback((productId: number, field: EditableNumberField, value: string) => {
        setSelectedItems(prev => ({
            ...prev,
            [productId]: { ...prev[productId], [field]: value === '' ? 0 : Number(value) },
        }));
    }, []);

    const updateBooleanField = useCallback((productId: number, field: EditableBooleanField, value: boolean) => {
        setSelectedItems(prev => ({
            ...prev,
            [productId]: { ...prev[productId], [field]: value },
        }));
    }, []);

    // ── Submit Handler — API Chaining ────────────────────────────────────────
    const handleSubmit = async () => {
        const productsToLink = Object.values(selectedItems).map(item => ({
            productId: item.productId,
            supplierProductCode: item.supplierProductCode,
            supplierRate: Number(item.supplierRate),
            leadTimeDays: Number(item.leadTimeDays),
            minimumOrderQuantity: Number(item.minimumOrderQuantity),
            discountPercentage: Number(item.discountPercentage),
            isPreferredSupplier: item.isPreferredSupplier,
            notes: item.notes,
        }));

        if (productsToLink.length === 0) {
            toast.error('Please select at least one product.');
            return;
        }

        try {
            // ── Step 1: POST /api/ProductSuppliers/bulk-link ──────────────
            const bulkLinkResult = await bulkLinkAsync({
                supplierId,
                products: productsToLink,
            });

            toast.success(`Successfully linked ${bulkLinkResult.successfullyLinked} products.`);

            // ── Step 2: POST /api/PurchaseOrders/{id}/partial-order ───────
            // Only chain if purchaseOrderId is provided
            if (purchaseOrderId) {
                setIsChainingApi(true);

                const partialOrderPayload: PartialOrderRequest = {
                    expectedDeliveryDate: new Date(
                        Date.now() + 7 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                    items: productsToLink.map(item => ({
                        productId: item.productId,
                        quantity: item.minimumOrderQuantity || 1,
                    })),
                    supplyOrderIds: supplyOrderIds,
                };

                await purchaseOrderService.createPartialOrder(
                    purchaseOrderId,
                    partialOrderPayload
                );

                toast.success('Partial order created successfully.');
            }

            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';

            if (isChainingApi) {
                toast.error(`Products linked, but partial order failed: ${message}`);
            } else {
                toast.error(`Failed to link products: ${message}`);
            }
        } finally {
            setIsChainingApi(false);
        }
    };

    // ── Client-Side Filtering ────────────────────────────────────────────────
    const filteredProducts = useMemo(() => {
        if (!productsData?.items) return [];

        const lower = searchTerm.toLowerCase();

        const filtered = !searchTerm
            ? [...productsData.items]
            : productsData.items.filter((p: Product) =>
                p.productName.toLowerCase().includes(lower) ||
                p.productCode.toLowerCase().includes(lower)
            );

        // Sort by Product ID DESC (newest first)
        return filtered.sort((a: Product, b: Product) => b.id - a.id);
    }, [productsData?.items, searchTerm]);

    const selectedCount = Object.keys(selectedItems).length;
    const isProcessing = isSubmitting || isChainingApi;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>Link Products</DialogTitle>
                    <DialogDescription>
                        Select products to link to this supplier. Configure supplier-specific details in the right panel.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* ── LEFT PANEL: Product Selection ──────────────────── */}
                    <div className="w-1/3 border-r flex flex-col bg-muted/10">
                        <div className="p-4 border-b bg-background">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            {isLoadingProducts || (isLoadingLinks && !isInitialized) ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {filteredProducts.map((product: Product) => {
                                        const isSelected = !!selectedItems[product.id];
                                        return (
                                            <div
                                                key={product.id}
                                                className={`flex items-start gap-3 p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                                                onClick={() => toggleProduct(product)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    className="mt-1 pointer-events-none"
                                                />
                                                <div className="grid gap-1">
                                                    <div className="font-medium leading-none">{product.productName}</div>
                                                    <div className="text-sm text-muted-foreground flex gap-2">
                                                        <span>{product.productCode}</span>
                                                        {product.genericName && <span>• {product.genericName}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            No products found for &quot;{searchTerm}&quot;
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                        <div className="p-2 border-t text-xs text-muted-foreground text-center bg-background">
                            Showing {filteredProducts.length} products
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: Selected Items Configuration ──────── */}
                    <div className="flex-1 flex flex-col bg-slate-50">
                        <div className="p-4 border-b bg-background flex justify-between items-center shadow-sm z-10">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                Selected Products <Badge variant="secondary">{selectedCount}</Badge>
                            </h3>
                            <div className="text-sm text-muted-foreground">
                                Review and edit supplier-specific details below
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            {selectedCount === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <ArrowRight className="h-12 w-12 mb-4" />
                                    <p className="text-lg font-medium">No products selected</p>
                                    <p className="text-sm">Select products from the list to configure them.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {Object.values(selectedItems).map((item) => (
                                        <Card key={item.productId} className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all">
                                            <div className="bg-muted/30 px-4 py-3 flex justify-between items-start border-b">
                                                <div>
                                                    <div className="font-semibold">{item.productName}</div>
                                                    <div className="text-xs text-muted-foreground">{item.productCode}</div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 -mr-1 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeProduct(item.productId)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <CardContent className="p-4 grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Supplier Code</Label>
                                                    <Input
                                                        value={item.supplierProductCode}
                                                        onChange={(e) => updateStringField(item.productId, 'supplierProductCode', e.target.value)}
                                                        className="h-8 text-sm"
                                                        placeholder="Code"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Rate (PKR)</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.supplierRate}
                                                        onChange={(e) => updateNumberField(item.productId, 'supplierRate', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Lead Time (Days)</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.leadTimeDays}
                                                        onChange={(e) => updateNumberField(item.productId, 'leadTimeDays', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Min Order Qty</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.minimumOrderQuantity}
                                                        onChange={(e) => updateNumberField(item.productId, 'minimumOrderQuantity', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2 mt-1">
                                                    <Checkbox
                                                        id={`preferred-${item.productId}`}
                                                        checked={item.isPreferredSupplier}
                                                        onCheckedChange={(c) => updateBooleanField(item.productId, 'isPreferredSupplier', !!c)}
                                                    />
                                                    <Label htmlFor={`preferred-${item.productId}`} className="text-sm cursor-pointer">
                                                        Preferred Supplier
                                                    </Label>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-background shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isProcessing || selectedCount === 0}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isChainingApi
                            ? 'Creating Partial Order...'
                            : isSubmitting
                                ? 'Linking...'
                                : `Link ${selectedCount} Products`
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
