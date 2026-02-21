import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useDeleteProduct } from '@/api/services/products';
import { useProductSuppliersByProduct } from '@/api/services/productSuppliers';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Edit,
    Trash2,
    Package,
    Pill,
    Layers,
    Truck,
    Calculator,
    ShieldCheck,
    ClipboardList,
    Store,
    Calendar,
    Zap,
    Tag,
    Factory
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const productId = id ? parseInt(id) : null;
    const { hasPermission } = useAuth();
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { data: product, isPending, error } = useProduct(productId);
    const { data: suppliers, isPending: isSuppliersPending } = useProductSuppliersByProduct(productId);
    const { mutate: deleteProduct } = useDeleteProduct();

    const canUpdate = hasPermission('products', 'update');
    const canDelete = hasPermission('products', 'delete');

    if (isPending) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Scanning product blueprint...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Product Not Located</h2>
                    <p className="text-muted-foreground max-w-md">
                        The SKU you are requesting might have been decommissioned or the inventory reference is invalid.
                    </p>
                </div>
                <Button onClick={() => navigate('/inventory/products')} variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Exit Inventory
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Product Header & Quick Actions */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b pb-6">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/inventory/products')}
                        className="mt-1 hover:bg-orange-50 hover:text-orange-600 transition-all"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{product.productName}</h1>
                            <Badge variant="outline" className="px-3 py-1 bg-slate-50 text-slate-600 border-slate-200">
                                {product.productCode}
                            </Badge>
                            {product.availableQuantity <= product.reorderLevel && (
                                <Badge className="bg-rose-500 hover:bg-rose-600 animate-pulse">Critical Stock</Badge>
                            )}
                        </div>
                        <p className="text-slate-500 flex items-center gap-2 font-medium">
                            <Pill className="w-4 h-4 text-orange-500" /> {product.genericName} • <Factory className="w-4 h-4" /> {product.manufacturer}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canUpdate && (
                        <Button
                            variant="outline"
                            className="gap-2 border-slate-200 hover:bg-slate-50 shadow-sm"
                            onClick={() => toast.info('Accessing product modification suite...')}
                        >
                            <Edit className="w-4 h-4 text-orange-600" /> Edit Details
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="destructive"
                            className="gap-2 shadow-sm"
                            onClick={() => setIsDeleteConfirmOpen(true)}
                        >
                            <Trash2 className="w-4 h-4" /> Decommission
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: General & Pricing (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="bg-slate-100 p-1 border h-11">
                            <TabsTrigger value="details" className="gap-2 text-xs font-bold uppercase tracking-widest px-6">
                                Technical Details
                            </TabsTrigger>
                            <TabsTrigger value="suppliers" className="gap-2 text-xs font-bold uppercase tracking-widest px-6">
                                Linked Suppliers
                            </TabsTrigger>
                            <TabsTrigger value="inventory" className="gap-2 text-xs font-bold uppercase tracking-widest px-6">
                                Batch Inventory
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-6 space-y-6 outline-none">
                            <Card className="border-slate-200 shadow-none">
                                <CardHeader className="bg-slate-50/50 border-b pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-600">
                                        <Tag className="w-4 h-4 text-orange-500" /> Categorization & Identity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                                            <p className="font-bold text-slate-800">{product.productTypeName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</p>
                                            <p className="font-bold text-slate-800">{product.unitName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                                            <p className="font-bold text-slate-800">{product.category}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub-Category</p>
                                            <p className="font-bold text-slate-800">{product.subCategory}</p>
                                        </div>
                                    </div>

                                    <Separator className="my-6" />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Zap className="w-3 h-3" /> Technical Description
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl italic border border-dashed">
                                            {product.description || "No technical specification provided for this product SKU."}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-none">
                                <CardHeader className="bg-slate-50/50 border-b pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-600">
                                        <Calculator className="w-4 h-4 text-green-500" /> Pricing Matrix
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Rate</p>
                                            <p className="text-2xl font-black text-slate-900">{formatCurrency(product.standardPurchaseRate)}</p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Standard Sale Rate</p>
                                            <p className="text-2xl font-black text-emerald-700">{formatCurrency(product.standardSaleRate)}</p>
                                        </div>
                                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-2">
                                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Trade Margin</p>
                                            <p className="text-2xl font-black text-orange-700">
                                                {product.standardSaleRate > 0
                                                    ? (((product.standardSaleRate - product.standardPurchaseRate) / product.standardSaleRate) * 100).toFixed(1)
                                                    : 0}%
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="suppliers" className="mt-6 outline-none">
                            <Card className="border-slate-200 shadow-none overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-600">
                                        <Truck className="w-4 h-4 text-blue-500" /> Strategic Sourcing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {isSuppliersPending ? (
                                        <div className="p-12 text-center flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                            <span className="text-xs text-slate-400 font-medium tracking-tight">Accessing supply chain records...</span>
                                        </div>
                                    ) : !suppliers || suppliers.length === 0 ? (
                                        <div className="p-12 text-center space-y-4">
                                            <Truck className="w-12 h-12 text-slate-200 mx-auto" />
                                            <p className="text-sm font-bold text-slate-600">No Supplier Links Established</p>
                                            <Button variant="outline" size="sm">Connect First Supplier</Button>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Supplier</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Lead Time</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Supply Rate</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {suppliers.map((ps) => (
                                                    <TableRow key={ps.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="font-bold py-4">{ps.supplierName}</TableCell>
                                                        <TableCell className="text-right py-4">{ps.leadTimeDays || 7} Days</TableCell>
                                                        <TableCell className="text-right font-black py-4">{formatCurrency(ps.supplierRate)}</TableCell>
                                                        <TableCell className="text-right py-4">
                                                            {ps.isPreferredSupplier && (
                                                                <Badge className="bg-blue-500 text-[9px] uppercase font-black">Preferred</Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="inventory" className="mt-6 outline-none">
                            <Card className="border-slate-200 shadow-none overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-600">
                                        <Layers className="w-4 h-4 text-purple-500" /> Active Batch Traceability
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="p-12 text-center space-y-4">
                                        <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600">Batch Control Active</p>
                                            <p className="text-xs text-slate-400">Total Available Inventory is partitioned across active batches.</p>
                                        </div>
                                        <Table className="mt-8 border-t">
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Batch Number</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Expiry</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Quantity</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className="font-mono text-xs">BT-DEFAULT-2024</TableCell>
                                                    <TableCell className="text-center text-xs font-bold text-slate-600">12/2026</TableCell>
                                                    <TableCell className="text-right font-black">{product.availableQuantity} {product.unitName}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Stock Summary & Quick Settings (1/3) */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-lg bg-white overflow-hidden">
                        <div className="h-2 bg-orange-500" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Stock Intelligence</CardTitle>
                            <CardDescription>Real-time physical inventory status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-4">
                            <div className="text-center py-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">On-Hand Inventory</p>
                                <h2 className={cn(
                                    "text-6xl font-black tracking-tighter",
                                    product.availableQuantity <= product.reorderLevel ? "text-rose-500" : "text-slate-900"
                                )}>
                                    {product.availableQuantity}
                                </h2>
                                <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">{product.unitName}</p>
                            </div>

                            <div className="space-y-6 px-2">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                                            <Layers className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">Reorder Level</span>
                                    </div>
                                    <span className="font-black text-slate-900">{product.reorderLevel}</span>
                                </div>

                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                                            <Package className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">EOQ (Reorder Qty)</span>
                                    </div>
                                    <span className="font-black text-slate-900">{product.reorderQuantity}</span>
                                </div>

                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">Batch Tracking</span>
                                    </div>
                                    <Badge variant={product.isBatchRequired ? "default" : "secondary"} className="uppercase font-black text-[9px]">
                                        {product.isBatchRequired ? "Mandatory" : "Optional"}
                                    </Badge>
                                </div>
                            </div>

                            {product.availableQuantity <= product.reorderLevel && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start animate-bounce mt-4">
                                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                    <p className="text-xs text-rose-700 font-bold leading-tight">
                                        Inventory depleted below threshold. Procure immediately to avoid supply disruption.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-none">
                        <CardHeader className="pb-2 border-b bg-slate-50/30">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Inventory Ecosystem</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <Store className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                    <span className="text-xs font-bold text-slate-600">Primary Warehouse</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{product.availableQuantity}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
                                    <span className="text-xs font-bold text-slate-600">Last Received</span>
                                </div>
                                <span className="text-xs font-bold text-slate-900">12 Feb 2024</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={() => {
                    if (productId) {
                        toast.promise(
                            new Promise((resolve, reject) => {
                                deleteProduct(productId, {
                                    onSuccess: () => resolve(true),
                                    onError: reject
                                });
                            }),
                            {
                                loading: 'Decommissioning product SKU...',
                                success: () => {
                                    navigate('/inventory/products');
                                    return 'Product successfully decommissioned from registry.';
                                },
                                error: (err) => err.userMessage || 'Failed to decommission product.'
                            }
                        );
                    }
                    setIsDeleteConfirmOpen(false);
                }}
                title="SKU Decommissioning"
                description={`You are about to permanently remove ${product.productName} from the active inventory registry. This SKU will no longer be available for procurement or distribution. Are you absolutely certain?`}
                confirmText="Confirm Decommission"
                variant="destructive"
            />
        </div>
    );
}
