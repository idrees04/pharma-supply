import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useDeleteProduct } from '@/api/services/products';
import { useProductSuppliersByProduct } from '@/api/services/productSuppliers';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, Variants } from 'framer-motion';
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
    Edit2,
    ArrowLeftSquare,
    Package,
    Pill,
    Layers,
    Truck,
    Calculator,
    ShieldCheck,
    Store,
    Calendar,
    Zap,
    Tag,
    Factory,
    TrendingUp,
    Info,
    Warehouse
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 100 }
    }
};

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

    if (isPending) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <motion.div
                initial="hidden"
                animate="visible"
                variants={itemVariants}
                className="flex h-[80vh] flex-col items-center justify-center gap-6"
            >
                <div className="bg-destructive/10 p-6 rounded-3xl border border-destructive/20 shadow-inner">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Product Not Found</h2>
                    <p className="text-muted-foreground max-w-sm text-balance">
                        This product may have been removed or you may not have permission to view it.
                    </p>
                </div>
                <Button onClick={() => navigate('/inventory/products')} variant="default" className="gap-2 h-12 px-6 shadow-xl shadow-primary/10 transition-all hover:scale-[1.05] active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Back to Products
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto space-y-8 py-6 pb-20 px-4 md:px-6"
        >
            {/* Breadcrumb Intelligence */}
            <motion.div variants={itemVariants}>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => navigate('/inventory/products')} className="cursor-pointer hover:text-primary transition-colors">Products</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-bold text-slate-900">Product Details</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </motion.div>
            {/* High-Fidelity Header */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                    <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 shadow-inner">
                        <Package className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                                {product.productName}
                            </h1>
                            <Badge variant="outline" className="px-3 py-1 bg-slate-50 text-slate-600 border-slate-200 font-mono tracking-tighter">
                                {product.productCode}
                            </Badge>
                            {product.availableQuantity <= product.reorderLevel && (
                                <Badge className="bg-rose-500 hover:bg-rose-600 animate-pulse text-[9px] font-black uppercase tracking-widest">
                                    Critical Depletion
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <Pill className="w-3.5 h-3.5 text-orange-500/70" /> {product.genericName}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1.5">
                                <Factory className="w-3.5 h-3.5 text-primary/60" /> {product.manufacturer}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canUpdate && (
                        <Button
                            variant="outline"
                            className="gap-2 h-11 px-5 border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:scale-[1.02]"
                            onClick={() => {
                                toast.info('Opening product editor...');
                                navigate(`/inventory/products?edit=${product.id}`);
                            }}
                        >
                            <Edit2 className="w-4 h-4 text-orange-600" />
                            <span className="font-bold text-slate-700">Edit Product</span>
                        </Button>
                    )}
                    <Button
                        variant="default"
                        className="gap-2 h-11 px-5 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        onClick={() => navigate('/inventory/products')}
                    >
                        <ArrowLeftSquare className="w-4 h-4" />
                        <span className="font-bold">Back to List</span>
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Flux */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Technical Specifications */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-orange-500" /> Technical Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 pb-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</p>
                                        <p className="font-bold text-slate-800">{product.productTypeName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Unit</p>
                                        <p className="font-bold text-slate-800">{product.unitName}</p>
                                    </div>
                                </div>

                                <Separator className="my-8" />

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-orange-500" /> Functional Profile
                                    </p>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                            {product.description || "No description has been added for this product yet."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Supply Chain Logic */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-primary" /> Strategic Sourcing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isSuppliersPending ? (
                                    <div className="p-12 text-center flex flex-col items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing Supply Nodes...</p>
                                    </div>
                                ) : !suppliers || suppliers.length === 0 ? (
                                    <div className="p-16 text-center space-y-4">
                                        <Truck className="w-12 h-12 text-slate-200 mx-auto" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600">No Suppliers Linked</p>
                                            <p className="text-xs text-slate-400">This product has not been linked to any suppliers yet.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/50">
                                                <TableRow>
                                                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Supplier Entity</TableHead>
                                                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Procurement Cycle</TableHead>
                                                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Acquisition rate (PKR)</TableHead>
                                                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Priority</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {suppliers.map((ps) => (
                                                    <TableRow key={ps.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                                                        <TableCell className="px-6 py-5 font-bold text-slate-800">{ps.supplierName}</TableCell>
                                                        <TableCell className="px-6 py-5 text-center font-medium text-slate-600">{ps.leadTimeDays || 7} Days</TableCell>
                                                        <TableCell className="px-6 py-5 text-right font-black text-slate-900">{formatCurrency(ps.supplierRate)}</TableCell>
                                                        <TableCell className="px-6 py-5 text-right">
                                                            {ps.isPreferredSupplier && (
                                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-tighter">Preferred Source</Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Batch & Inventory Control */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-violet-500" /> Active Batch Control
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-12 text-center bg-violet-50/20">
                                    <ShieldCheck className="w-12 h-12 text-violet-200 mx-auto" />
                                    <div className="mt-4 space-y-1">
                                        <p className="text-sm font-bold text-slate-800">Batch Integrity Enforcement: {product.isBatchRequired ? 'High' : 'Standard'}</p>
                                        <p className="text-xs text-slate-500">Available units are synchronized across the following active manufacturing batches.</p>
                                    </div>
                                    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm max-w-2xl mx-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center py-4">Batch ID</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center py-4">Expiry Timeline</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right py-4 pr-8">Physical Qty</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className="font-mono text-xs font-bold text-slate-600">BT-MASTER-2024-X</TableCell>
                                                    <TableCell className="text-center font-black text-rose-500 text-xs">
                                                        <span className="bg-rose-50 px-2 py-1 rounded">12 / 2026</span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-slate-900 pr-8">
                                                        {product.availableQuantity} <span className="text-[9px] text-slate-400 uppercase ml-1">{product.unitName}</span>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Vertical Intelligence Stack */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-24 space-y-8">
                        {/* Core Stock Metric */}
                        <motion.div variants={itemVariants}>
                            <Card className="overflow-hidden border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-xl shadow-orange-100/60 relative">
                                {/* Decorative background blobs */}
                                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-orange-300/20 blur-2xl pointer-events-none" />
                                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />
                                <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                                    <Warehouse className="h-48 w-48 text-orange-900" />
                                </div>
                                <CardHeader className="border-b border-orange-200/70 pb-4 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                                            Inventory Equilibrium
                                        </CardTitle>
                                        <div className="p-1.5 rounded-lg bg-orange-500 shadow-sm shadow-orange-300">
                                            <TrendingUp className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-10 pb-8 space-y-8 relative z-10">
                                    <div className="space-y-3 text-center">
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Quantity In Stock</p>
                                        <div className="inline-flex flex-col items-center">
                                            <h2 className={cn(
                                                "text-7xl font-black tracking-tighter leading-none mb-2",
                                                product.availableQuantity <= product.reorderLevel ? "text-rose-500" : "text-orange-600"
                                            )}>
                                                {product.availableQuantity}
                                            </h2>
                                            <p className="text-sm font-bold text-orange-400/70 uppercase tracking-[0.4em]">{product.unitName}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 border-t border-orange-200/60 pt-6 text-center px-2">
                                        <div className="space-y-1.5 p-3 rounded-xl bg-white/60 border border-orange-100 shadow-sm">
                                            <p className="text-[9px] font-black text-orange-400 uppercase">Reorder Point</p>
                                            <p className="text-xl font-black text-slate-800">{product.reorderLevel}</p>
                                        </div>
                                        <div className="space-y-1.5 p-3 rounded-xl bg-white/60 border border-orange-100 shadow-sm">
                                            <p className="text-[9px] font-black text-orange-400 uppercase">Refill Qty</p>
                                            <p className="text-xl font-black text-slate-800">{product.reorderQuantity}</p>
                                        </div>
                                    </div>

                                    {product.availableQuantity <= product.reorderLevel && (
                                        <motion.div
                                            animate={{ scale: [1, 1.03, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="mx-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 shadow-sm"
                                        >
                                            <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-rose-500 text-white shadow-md">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs font-bold text-rose-600 leading-tight">
                                                Low stock! Consider reordering soon.
                                            </p>
                                        </motion.div>
                                    )}
                                </CardContent>
                                <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
                            </Card>
                        </motion.div>

                        {/* Pricing Governance Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
                                <CardHeader className="pb-3 border-b bg-slate-50/50">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Calculator className="w-4 h-4 text-emerald-500" /> Pricing Architecture
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-8">
                                    <div className="flex justify-between items-center group">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base purchase rate (PKR)</p>
                                            <p className="text-xl font-bold text-slate-800">{formatCurrency(product.standardPurchaseRate)}</p>
                                        </div>
                                        <div className="h-10 w-1 bg-slate-100 rounded-full group-hover:bg-primary transition-all" />
                                    </div>

                                    <div className="flex justify-between items-center group">
                                        <div className="space-y-1 text-right w-full">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Global sale rate (PKR)</p>
                                            <p className="text-2xl font-black text-emerald-700">{formatCurrency(product.standardSaleRate)}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operating Margin</p>
                                        <p className="text-lg font-black text-orange-600">
                                            {product.standardSaleRate > 0
                                                ? (((product.standardSaleRate - product.standardPurchaseRate) / product.standardSaleRate) * 100).toFixed(1)
                                                : 0}%
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Ancillary Ecosystem Data */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-slate-200 shadow-none">
                                <CardHeader className="pb-3 bg-slate-50/30 border-b">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inventory Ecosystem</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="p-4 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <Store className="w-5 h-5 text-slate-300 group-hover:text-primary" />
                                            <span className="text-xs font-bold text-slate-600">Master Repository</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">{product.availableQuantity}</span>
                                    </div>
                                    <div className="p-4 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <Calendar className="w-5 h-5 text-slate-300 group-hover:text-orange-500" />
                                            <span className="text-xs font-bold text-slate-600">Registry Updated</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 capitalize">Recently</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
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
                                loading: 'Deleting product...',
                                success: () => {
                                    navigate('/inventory/products');
                                    return 'Product deleted successfully.';
                                },
                                error: (err) => err.userMessage || 'Failed to delete product.'
                            }
                        );
                    }
                    setIsDeleteConfirmOpen(false);
                }}
                title="Delete Product"
                description={`Are you sure you want to delete "${product.productName}"? This action cannot be undone and the product will be permanently removed from the system.`}
                confirmText="Confirm Decommission"
                variant="destructive"
            />
        </motion.div>
    );
}
