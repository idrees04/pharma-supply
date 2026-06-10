import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupplier, useSupplierBalance } from '@/api/services/suppliers';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
    Building,
    CreditCard,
    Banknote,
    Edit2,
    ArrowLeftSquare,
    Globe,
    ShieldCheck,
    Contact,
    History,
    TrendingUp,
    FileText,
    Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LinkedProductsTable } from '@/components/suppliers/LinkedProductsTable';
import { LinkProductsModal } from '@/components/suppliers/LinkProductsModal';
import { SupplierPurchaseOrdersSection } from '@/components/suppliers/SupplierPurchaseOrdersSection';
import { SupplierProcurementCatalogCard } from '@/components/suppliers/SupplierProcurementCatalogCard';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

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

export default function SupplierDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const supplierId = id ? parseInt(id) : null;
    const { hasPermission } = useAuth();
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const { data: supplier, isPending, error } = useSupplier(supplierId);
    const { data: balanceDetail, isPending: balanceLoading } = useSupplierBalance(supplierId);

    const canUpdate = hasPermission('suppliers', 'update');

    const payable = balanceDetail?.outstandingBalance ?? supplier?.outstandingBalance ?? 0;
    const creditLimit = balanceDetail?.creditLimit ?? supplier?.creditLimit ?? 0;
    const creditUsedPct =
      creditLimit > 0 ? Math.min(100, (payable / creditLimit) * 100) : 0;

    if (isPending) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Loading supplier details...</p>
                </div>
            </div>
        );
    }

    if (error || !supplier) {
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
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Supplier Not Found</h2>
                    <p className="text-muted-foreground max-sm text-balance">
                        This supplier record may have been removed or you may not have permission to view it.
                    </p>
                </div>
                <Button onClick={() => navigate('/suppliers')} variant="default" className="gap-2 h-12 px-6 shadow-xl shadow-primary/10 transition-all hover:scale-[1.05] active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Back to Suppliers
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-none mx-auto space-y-8 py-6 pb-20"
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
                            <BreadcrumbLink onClick={() => navigate('/suppliers')} className="cursor-pointer hover:text-primary transition-colors">Suppliers</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-bold text-slate-900">Supplier Details</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </motion.div>
            {/* High-Fidelity Header */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                    <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-inner">
                        <Building className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                                {supplier.supplierName}
                            </h1>
                            <Badge variant={supplier.isActive ? 'default' : 'secondary'} className={cn(
                                "px-3 py-1 font-black uppercase tracking-widest text-[10px]",
                                supplier.isActive ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-200 text-slate-500"
                            )}>
                                {supplier.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                            <span className="flex items-center gap-1.5 font-mono text-[10px]">
                                <Globe className="w-3.5 h-3.5 text-blue-500/70" /> ID-{supplier.id.toString().padStart(4, '0')}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500/60" /> {supplier.city}, {supplier.state}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 h-11 px-5 border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:scale-[1.02]"
                        onClick={() => navigate(`/reports/vendor-ledger?supplierId=${supplier.id}`)}
                    >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-700">Vendor ledger</span>
                    </Button>
                    {canUpdate && (
                        <Button
                            variant="outline"
                            className="gap-2 h-11 px-5 border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:scale-[1.02]"
                            onClick={() => {
                                toast.info('Opening supplier editor...');
                                navigate(`/suppliers?edit=${supplier.id}`);
                            }}
                        >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-slate-700">Edit Supplier</span>
                        </Button>
                    )}
                    <Button
                        variant="default"
                        className="gap-2 h-11 px-5 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        onClick={() => navigate('/suppliers')}
                    >
                        <ArrowLeftSquare className="w-4 h-4" />
                        <span className="font-bold">Back to List</span>
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Flux */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Core Identity & Contact Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Contact className="w-4 h-4 text-blue-500" /> Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 pb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Person</p>
                                            <p className="text-lg font-bold text-slate-800">{supplier.contactPerson}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Phone Number</p>
                                                    <p className="font-bold text-slate-700">{supplier.phoneNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Email Address</p>
                                                    <p className="font-bold text-slate-700">{supplier.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                                            <div className="flex items-start gap-3 pt-2">
                                                <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                                    {supplier.address},<br />
                                                    {supplier.city}, {supplier.state} {supplier.postalCode},<br />
                                                    {supplier.country}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-8" />

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-3 h-3 text-blue-500" /> Notes
                                    </p>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                            {supplier.notes || "No notes added for this supplier yet."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Linked Portfolio Section */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Linked Products</h3>
                                <p className="text-sm text-slate-500 font-medium">Products supplied by this supplier.</p>
                            </div>
                            <Button
                                onClick={() => setIsLinkModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 mr-2" /> Link Product
                            </Button>
                        </div>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <LinkedProductsTable supplierId={supplierId!} />
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <SupplierPurchaseOrdersSection supplierId={supplierId!} />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <SupplierProcurementCatalogCard supplierId={supplierId!} />
                    </motion.div>
                </div>

                {/* Vertical Intelligence Stack */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-24 space-y-8">
                        {/* Financial Equilibrium Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 shadow-xl shadow-blue-100/60 relative">
                                {/* Decorative blobs */}
                                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-blue-300/20 blur-2xl pointer-events-none" />
                                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-indigo-300/20 blur-2xl pointer-events-none" />
                                <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                                    <TrendingUp className="h-48 w-48 text-blue-900" />
                                </div>
                                <CardHeader className="border-b border-blue-200/70 pb-4 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                                            Account Balance
                                        </CardTitle>
                                        <div className="p-1.5 rounded-lg bg-blue-500 shadow-sm shadow-blue-300">
                                            <ShieldCheck className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-10 pb-8 space-y-8 relative z-10">
                                    <div className="space-y-3 text-center">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Amount Payable (PKR)</p>
                                        <h2 className={cn(
                                            "text-5xl font-black tracking-tighter leading-none mb-2",
                                            payable > creditLimit ? "text-rose-500" : "text-blue-700"
                                        )}>
                                            {formatCurrency(payable)}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 border-t border-blue-200/60 pt-6 px-2">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-blue-100 shadow-sm">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-blue-500 uppercase">Credit limit (PKR)</p>
                                                <p className="text-lg font-black text-slate-800">{formatCurrency(creditLimit)}</p>
                                            </div>
                                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-2 space-y-2">
                                        <div className="flex justify-between text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">
                                            <span>Credit Used</span>
                                            <span>{creditUsedPct.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${creditUsedPct}%` }}
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    payable > creditLimit * 0.8 ? "bg-rose-500" : "bg-blue-500"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {balanceLoading ? (
                                        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-blue-400 animate-pulse px-2">
                                            Loading balance analytics…
                                        </p>
                                    ) : balanceDetail ? (
                                        <div className="space-y-3 border-t border-blue-200/60 pt-6 px-2 text-left">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                                                From balance API
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="rounded-lg bg-white/70 border border-blue-100 p-3">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Available credit (PKR)</p>
                                                    <p className="font-black tabular-nums text-slate-800">{formatCurrency(balanceDetail.availableCredit)}</p>
                                                </div>
                                                <div className="rounded-lg bg-white/70 border border-blue-100 p-3">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Total PO value (PKR)</p>
                                                    <p className="font-black tabular-nums text-slate-800">{formatCurrency(balanceDetail.totalPurchaseAmount)}</p>
                                                </div>
                                                <div className="rounded-lg bg-white/70 border border-blue-100 p-3">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Total paid (PKR)</p>
                                                    <p className="font-black tabular-nums text-emerald-700">{formatCurrency(balanceDetail.totalPaidAmount)}</p>
                                                </div>
                                                <div className="rounded-lg bg-white/70 border border-blue-100 p-3">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">PO counts</p>
                                                    <p className="font-bold text-slate-800">
                                                        {balanceDetail.pendingOrders} pending · {balanceDetail.completedOrders} done
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </CardContent>
                                <div className="h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400" />
                            </Card>
                        </motion.div>

                        {/* Regulatory Governance Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
                                <CardHeader className="pb-3 border-b bg-slate-50/50">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Banknote className="w-4 h-4 text-emerald-500" /> Business Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NTN Number</p>
                                        <p className="font-mono text-sm font-bold text-slate-800">{supplier.taxNumber}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-6">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">License Number</p>
                                        <p className="text-sm font-bold text-slate-800">{supplier.licenseNumber || 'N/A'}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-6">
                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Payment Days</p>
                                        <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black text-[10px]">
                                            {supplier.paymentTermDays} Days
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Balance API shortcuts */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-slate-200 shadow-none">
                                <CardHeader className="pb-3 bg-slate-50/30 border-b">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between gap-2 h-auto py-3 px-4"
                                        onClick={() =>
                                            document.getElementById('supplier-purchase-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                        }
                                    >
                                        <span className="flex items-center gap-3">
                                            <History className="w-5 h-5 text-blue-500" />
                                            <span className="text-xs font-bold text-slate-700 text-left">Purchase order list</span>
                                        </span>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase">View</span>
                                    </Button>
                                    {balanceDetail ? (
                                        <p className="text-[10px] text-muted-foreground leading-relaxed px-1">
                                            Totals reflect all POs for this supplier (
                                            <span className="font-semibold text-foreground">{balanceDetail.pendingOrders}</span> open workflows).
                                        </p>
                                    ) : balanceLoading ? (
                                        <p className="text-[10px] text-muted-foreground animate-pulse px-1">Loading summary…</p>
                                    ) : null}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>

            <LinkProductsModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                supplierId={supplierId!}
            />
        </motion.div>
    );
}
