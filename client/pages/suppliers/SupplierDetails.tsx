import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupplier } from '@/api/services/suppliers';
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

    const canUpdate = hasPermission('suppliers', 'update');

    if (isPending) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Syncing supplier intelligence...</p>
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
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Partner Node Offline</h2>
                    <p className="text-muted-foreground max-sm text-balance">
                        The requested supplier entity could not be retrieved from the global partner registry.
                    </p>
                </div>
                <Button onClick={() => navigate('/suppliers')} variant="default" className="gap-2 h-12 px-6 shadow-xl shadow-primary/10 transition-all hover:scale-[1.05] active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Exit Partner Hub
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
                            <BreadcrumbLink onClick={() => navigate('/suppliers')} className="cursor-pointer hover:text-primary transition-colors">Partner Registry</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-bold text-slate-900">Partner Intelligence</BreadcrumbPage>
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
                                {supplier.isActive ? 'System Active' : 'Suspended'}
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
                    {canUpdate && (
                        <Button
                            variant="outline"
                            className="gap-2 h-11 px-5 border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:scale-[1.02]"
                            onClick={() => {
                                toast.info('Accessing partner modification suite...');
                                navigate(`/suppliers?edit=${supplier.id}`);
                            }}
                        >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-slate-700">Modify Profile</span>
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
                                    <Contact className="w-4 h-4 text-blue-500" /> Professional Footprint
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 pb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decision Maker</p>
                                            <p className="text-lg font-bold text-slate-800">{supplier.contactPerson}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Primary Line</p>
                                                    <p className="font-bold text-slate-700">{supplier.phoneNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Electronic Mail</p>
                                                    <p className="font-bold text-slate-700">{supplier.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geographical Node</p>
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
                                        <FileText className="w-3 h-3 text-blue-500" /> Partner Brief
                                    </p>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                            {supplier.notes || "No tactical annotations recorded for this partner node."}
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
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Supply Portfolio</h3>
                                <p className="text-sm text-slate-500 font-medium">Active SKUs associated with this partner entity.</p>
                            </div>
                            <Button
                                onClick={() => setIsLinkModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 mr-2" /> Link New SKU
                            </Button>
                        </div>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <LinkedProductsTable supplierId={supplierId!} />
                        </Card>
                    </motion.div>
                </div>

                {/* Vertical Intelligence Stack */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-24 space-y-8">
                        {/* Financial Equilibrium Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="overflow-hidden border-slate-200 bg-slate-900 text-white shadow-2xl shadow-slate-900/40 relative">
                                <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                                    <TrendingUp className="h-48 w-48" />
                                </div>
                                <CardHeader className="border-b border-white/10 pb-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                                            Financial Equilibrium
                                        </CardTitle>
                                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-10 pb-8 space-y-10 relative z-10">
                                    <div className="space-y-3 text-center">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Outstanding Exposure</p>
                                        <h2 className={cn(
                                            "text-5xl font-black tracking-tighter leading-none mb-2",
                                            supplier.outstandingBalance > supplier.creditLimit ? "text-rose-400" : "text-white"
                                        )}>
                                            {formatCurrency(supplier.outstandingBalance)}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-8 px-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-white/30 uppercase">Credit Ceiling</p>
                                                <p className="text-lg font-bold">{formatCurrency(supplier.creditLimit)}</p>
                                            </div>
                                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 space-y-2">
                                        <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest px-1">
                                            <span>Utilization</span>
                                            <span>{Math.min(100, (supplier.outstandingBalance / supplier.creditLimit) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (supplier.outstandingBalance / supplier.creditLimit) * 100)}%` }}
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    supplier.outstandingBalance > (supplier.creditLimit * 0.8) ? "bg-rose-500" : "bg-emerald-500"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            </Card>
                        </motion.div>

                        {/* Regulatory Governance Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
                                <CardHeader className="pb-3 border-b bg-slate-50/50">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <Banknote className="w-4 h-4 text-emerald-500" /> Operational Governance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax Registry ID</p>
                                        <p className="font-mono text-sm font-bold text-slate-800">{supplier.taxNumber}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-6">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trade License</p>
                                        <p className="text-sm font-bold text-slate-800">{supplier.licenseNumber || 'N/A'}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-6">
                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Default Payment Term</p>
                                        <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black text-[10px]">
                                            {supplier.paymentTermDays} Days
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Ancillary Historical Data */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-slate-200 shadow-none">
                                <CardHeader className="pb-3 bg-slate-50/30 border-b">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Partner Intelligence</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="p-4 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <History className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                                            <span className="text-xs font-bold text-slate-600">Historical Engagement</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">Premium</span>
                                    </div>
                                    <div className="p-4 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <ShieldCheck className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                                            <span className="text-xs font-bold text-slate-600">Verification Status</span>
                                        </div>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black">CLEARED</Badge>
                                    </div>
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
