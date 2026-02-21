import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetHospitalById, useDeleteHospital, useGetHospitalOrders } from '@/hooks/useHospitals';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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
    Phone,
    Mail,
    MapPin,
    User,
    CreditCard,
    Banknote,
    FileText,
    Calendar,
    Building,
    CheckCircle2,
    XCircle,
    History,
    TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Variants } from 'framer-motion';

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

export default function HospitalDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const hospitalId = id ? parseInt(id) : null;
    const { hasPermission } = useAuth();
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { data: response, isPending, error } = useGetHospitalById(hospitalId);
    const { data: ordersData, isPending: isOrdersPending } = useGetHospitalOrders(hospitalId);

    const { mutate: deleteHospital, isPending: isDeleting } = useDeleteHospital({
        onSuccess: () => {
            toast.success('Hospital profile archived successfully');
            navigate('/hospitals');
        },
        onError: (err) => {
            toast.error(err.userMessage || 'Failed to archive hospital profile');
        }
    });

    const hospital = response?.data;

    const canUpdate = hasPermission('hospitals', 'update');
    // const canDelete = hasPermission('hospitals', 'delete'); // User requested to replace delete with "Back to List"

    if (isPending) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Initializing hospital intelligence...</p>
                </div>
            </div>
        );
    }

    if (error || !hospital) {
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
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Entity Not Located</h2>
                    <p className="text-muted-foreground max-w-sm text-balance">
                        The hospital profile requested is either restricted or has been retired from the active directory.
                    </p>
                </div>
                <Button onClick={() => navigate('/hospitals')} variant="default" className="gap-2 h-12 px-6 shadow-xl shadow-primary/10 transition-all hover:scale-[1.05] active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Return to Directory
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
                            <BreadcrumbLink onClick={() => navigate('/hospitals')} className="cursor-pointer hover:text-primary transition-colors">Hospital Directory</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-bold text-slate-900">Entity Intelligence</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </motion.div>
            {/* Architectural Header */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                    <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10 shadow-inner">
                        <Building className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                                {hospital.hospitalName}
                            </h1>
                            <Badge className={cn(
                                "px-3 py-1 capitalize text-[10px] font-black tracking-widest border-2",
                                hospital.isActive
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-slate-50 text-slate-500 border-slate-100"
                            )}>
                                {hospital.isActive ? (
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                                ) : (
                                    <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Inactive</span>
                                )}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                            <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">
                                ID: #HOSP-{hospital.id}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary/60" /> {hospital.city}, {hospital.state}
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
                                toast.info('Opening modification suite...');
                                navigate(`/hospitals?edit=${hospital.id}`);
                            }}
                        >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                            <span className="font-bold">Edit Details</span>
                        </Button>
                    )}
                    <Button
                        variant="default"
                        className="gap-2 h-11 px-5 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        onClick={() => navigate('/hospitals')}
                    >
                        <ArrowLeftSquare className="w-4 h-4" />
                        <span className="font-bold">Back to List</span>
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Stream */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Demographics Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" /> Primary Liaison & Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 pb-6">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Identity</p>
                                            <p className="text-lg font-bold text-slate-800 tracking-tight">{hospital.hospitalName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Managing Personnel</p>
                                            <p className="text-lg font-bold text-slate-800 tracking-tight">{hospital.contactPerson}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 group p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Communication Line</p>
                                                <p className="font-bold text-slate-800">{hospital.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Digital Registry</p>
                                                <p className="font-bold text-slate-800 truncate">{hospital.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Geographical Footprint */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500" /> Geographical Placement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 pb-6">
                                <div className="space-y-8">
                                    <div className="relative group">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-slate-200 rounded-full group-hover:bg-rose-500 transition-colors" />
                                        <div className="pl-6 space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Facility Address</p>
                                            <p className="text-xl font-medium text-slate-800 leading-relaxed italic">{hospital.address}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">City</p>
                                            <p className="font-bold text-slate-800">{hospital.city}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">State/Province</p>
                                            <p className="font-bold text-slate-800">{hospital.state}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Postal Index</p>
                                            <p className="font-mono font-bold text-slate-800">{hospital.postalCode}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Operational History */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <History className="w-4 h-4 text-amber-500" /> Operational History
                                </CardTitle>
                                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold">
                                    {ordersData?.orders?.length || 0} Transactions
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isOrdersPending ? (
                                    <div className="p-12 text-center flex flex-col items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing Archives...</p>
                                    </div>
                                ) : !ordersData?.orders || ordersData.orders.length === 0 ? (
                                    <div className="p-16 text-center space-y-4">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-dashed border-slate-200">
                                            <FileText className="w-7 h-7 text-slate-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600">No Historical Records</p>
                                            <p className="text-xs text-slate-400">This entity has no documented transaction history in the central registry.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <th className="px-6 py-4">Reference</th>
                                                    <th className="px-6 py-4">Timeline</th>
                                                    <th className="px-6 py-4">Governance</th>
                                                    <th className="px-6 py-4 text-right">Value (PKR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y text-sm">
                                                {ordersData.orders.map((order: any) => (
                                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-primary group-hover:underline">#{order.orderNo}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                                            {new Date(order.orderDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tighter bg-white">
                                                                {order.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="font-black text-slate-800">{formatCurrency(order.saleTotal)}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Sticky Side Summary */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-24 space-y-8">
                        {/* Financial Exposure High-Impact Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="overflow-hidden border-slate-200 bg-slate-900 text-white shadow-2xl shadow-slate-900/40 relative">
                                <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                                    <Banknote className="h-48 w-48" />
                                </div>
                                <CardHeader className="border-b border-white/10 pb-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                                            Financial Overview
                                        </CardTitle>
                                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-10 pb-8 space-y-10 relative z-10">
                                    <div className="space-y-3 text-center">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Active Fiscal Exposure</p>
                                        <div className="inline-flex flex-col items-center">
                                            <h2 className="text-5xl font-black tracking-tighter leading-none mb-2">
                                                {formatCurrency(hospital.outstandingBalance || 0)}
                                            </h2>
                                            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-black text-[9px] uppercase tracking-widest px-3">
                                                Risk Factor: High
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                                        <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Utilization</p>
                                            <p className="text-xl font-bold tracking-tight">
                                                {hospital.creditLimit ? Math.round((hospital.outstandingBalance / hospital.creditLimit) * 100) : 0}%
                                            </p>
                                        </div>
                                        <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Term Days</p>
                                            <p className="text-xl font-bold tracking-tight">{hospital.creditTermDays} <span className="text-[10px] opacity-40">D</span></p>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-rose-500" />
                            </Card>
                        </motion.div>

                        {/* Credit Capacity Monitor */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
                                <CardHeader className="pb-3 border-b bg-slate-50/50">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-indigo-500" /> Fiscal Limits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Max Authorization</p>
                                            <p className="text-lg font-black text-slate-800">{formatCurrency(hospital.creditLimit || 0)}</p>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (hospital.outstandingBalance / (hospital.creditLimit || 1)) * 100)}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className={cn(
                                                    "h-full rounded-full transition-all shadow-sm",
                                                    (hospital.outstandingBalance / (hospital.creditLimit || 1)) > 0.8 ? "bg-rose-500" : "bg-primary"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-100" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Term Period
                                            </p>
                                            <div className="text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                                                {hospital.creditTermDays} Days
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                                                <Building className="w-3 h-3" /> Registry
                                            </p>
                                            <div className="text-[10px] font-black text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 text-center truncate uppercase">
                                                {hospital.taxNumber || 'NTN-PEND'}
                                            </div>
                                        </div>
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
                    deleteHospital(hospitalId!);
                    setIsDeleteConfirmOpen(false);
                }}
                title="Institutional Termination"
                description={`You are about to permanently terminate the operational profile for ${hospital.hospitalName}. This action is irreversible and will archive all associated operational clearance. Are you absolutely certain?`}
                confirmText="Confirm Termination"
                variant="destructive"
            />
        </motion.div>
    );
}
