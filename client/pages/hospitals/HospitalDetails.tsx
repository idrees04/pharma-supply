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
            toast.success('Hospital record deleted successfully');
            navigate('/hospitals');
        },
        onError: (err) => {
            toast.error(err.userMessage || 'Failed to delete hospital record');
        }
    });

    const hospital = response?.data;

    const canUpdate = hasPermission('hospitals', 'update');

    if (isPending) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Loading hospital details...</p>
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
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Hospital Not Found</h2>
                    <p className="text-muted-foreground max-w-sm text-balance">
                        This hospital record may have been removed or you may not have permission to view it.
                    </p>
                </div>
                <Button onClick={() => navigate('/hospitals')} variant="default" className="gap-2 h-12 px-6 shadow-xl shadow-primary/10 transition-all hover:scale-[1.05] active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Back to Hospitals
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
            {/* Breadcrumb */}
            <motion.div variants={itemVariants}>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink onClick={() => navigate('/hospitals')} className="cursor-pointer hover:text-primary transition-colors">Hospitals</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-bold text-slate-900">Hospital Details</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </motion.div>

            {/* Page Header */}
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
                                toast.info('Opening hospital editor...');
                                navigate(`/hospitals?edit=${hospital.id}`);
                            }}
                        >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                            <span className="font-bold">Edit Hospital</span>
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
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Contact Information */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" /> Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 pb-6">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital Name</p>
                                            <p className="text-lg font-bold text-slate-800 tracking-tight">{hospital.hospitalName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Person</p>
                                            <p className="text-lg font-bold text-slate-800 tracking-tight">{hospital.contactPerson}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 group p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Phone Number</p>
                                                <p className="font-bold text-slate-800">{hospital.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Email Address</p>
                                                <p className="font-bold text-slate-800 truncate">{hospital.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Address */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500" /> Address & Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 pb-6">
                                <div className="space-y-8">
                                    <div className="relative group">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-slate-200 rounded-full group-hover:bg-rose-500 transition-colors" />
                                        <div className="pl-6 space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Address</p>
                                            <p className="text-xl font-medium text-slate-800 leading-relaxed italic">{hospital.address}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">City</p>
                                            <p className="font-bold text-slate-800">{hospital.city}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Province</p>
                                            <p className="font-bold text-slate-800">{hospital.state}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Postal Code</p>
                                            <p className="font-mono font-bold text-slate-800">{hospital.postalCode}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Order History */}
                    <motion.div variants={itemVariants}>
                        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
                            <CardHeader className="bg-slate-50/80 border-b py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <History className="w-4 h-4 text-amber-500" /> Order History
                                </CardTitle>
                                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold">
                                    {ordersData?.orders?.length || 0} Orders
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isOrdersPending ? (
                                    <div className="p-12 text-center flex flex-col items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading orders...</p>
                                    </div>
                                ) : !ordersData?.orders || ordersData.orders.length === 0 ? (
                                    <div className="p-16 text-center space-y-4">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-dashed border-slate-200">
                                            <FileText className="w-7 h-7 text-slate-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600">No Orders Yet</p>
                                            <p className="text-xs text-slate-400">This hospital has no orders placed in the system.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <th className="px-6 py-4">Order No.</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Amount (PKR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y text-sm">
                                                {ordersData.orders.map((order: any) => (
                                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-primary group-hover:underline">#{order.orderNo}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                                            {new Date(order.orderDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
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

                {/* Sticky Right Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-24 space-y-8">
                        {/* Outstanding Balance Card — warm green/teal gradient */}
                        <motion.div variants={itemVariants}>
                            <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-xl shadow-emerald-100/60 relative">
                                {/* Decorative blobs */}
                                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl pointer-events-none" />
                                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-teal-300/20 blur-2xl pointer-events-none" />
                                <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                                    <Banknote className="h-48 w-48 text-emerald-900" />
                                </div>
                                <CardHeader className="border-b border-emerald-200/70 pb-4 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                            Account Balance
                                        </CardTitle>
                                        <div className="p-1.5 rounded-lg bg-emerald-500 shadow-sm shadow-emerald-300">
                                            <TrendingUp className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-10 pb-8 space-y-8 relative z-10">
                                    <div className="space-y-3 text-center">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Amount Due (PKR)</p>
                                        <div className="inline-flex flex-col items-center">
                                            <h2 className="text-5xl font-black tracking-tighter leading-none mb-2 text-emerald-700">
                                                {formatCurrency(hospital.outstandingBalance || 0)}
                                            </h2>
                                            <Badge className="bg-rose-100 text-rose-600 border-rose-200 font-black text-[9px] uppercase tracking-widest px-3">
                                                Pending Payment
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 border-t border-emerald-200/60 pt-6 text-center px-2">
                                        <div className="space-y-1.5 p-3 rounded-xl bg-white/60 border border-emerald-100 shadow-sm">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase">Credit Used</p>
                                            <p className="text-xl font-black text-slate-800">
                                                {hospital.creditLimit ? Math.round((hospital.outstandingBalance / hospital.creditLimit) * 100) : 0}%
                                            </p>
                                        </div>
                                        <div className="space-y-1.5 p-3 rounded-xl bg-white/60 border border-emerald-100 shadow-sm">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase">Credit Days</p>
                                            <p className="text-xl font-black text-slate-800">{hospital.creditTermDays} <span className="text-[10px] text-slate-400">days</span></p>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
                            </Card>
                        </motion.div>

                        {/* Credit Limit Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
                                <CardHeader className="pb-3 border-b bg-slate-50/50">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-indigo-500" /> Credit Limit
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Credit Allowed</p>
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
                                                <Calendar className="w-3 h-3" /> Payment Term
                                            </p>
                                            <div className="text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                                                {hospital.creditTermDays} Days
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                                                <Building className="w-3 h-3" /> NTN Number
                                            </p>
                                            <div className="text-[10px] font-black text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 text-center truncate uppercase">
                                                {hospital.taxNumber || 'Not Provided'}
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
                title="Delete Hospital"
                description={`Are you sure you want to delete "${hospital.hospitalName}"? This action cannot be undone.`}
                confirmText="Yes, Delete"
                variant="destructive"
            />
        </motion.div>
    );
}
