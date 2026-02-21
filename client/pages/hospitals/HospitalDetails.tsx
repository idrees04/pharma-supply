import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetHospitalById, useDeleteHospital, useGetHospitalOrders } from '@/hooks/useHospitals';
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
    XCircle
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

export default function HospitalDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const hospitalId = id ? parseInt(id) : null;
    const { hasPermission } = useAuth();
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { data: response, isPending, error } = useGetHospitalById(hospitalId);
    const { data: ordersResponse, isPending: isOrdersPending } = useGetHospitalOrders(hospitalId);
    const { mutate: deleteHospital, isPending: isDeleting } = useDeleteHospital({
        onSuccess: () => {
            toast.success('Hospital deleted successfully');
            navigate('/hospitals');
        },
        onError: (err) => {
            toast.error(err.userMessage || 'Failed to delete hospital');
        }
    });

    const hospital = response?.data;
    const ordersData = ordersResponse?.data;

    const canUpdate = hasPermission('hospitals', 'update');
    const canDelete = hasPermission('hospitals', 'delete');

    if (isPending) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Fetching hospital intelligence...</p>
                </div>
            </div>
        );
    }

    if (error || !hospital) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Access Denied or Not Found</h2>
                    <p className="text-muted-foreground max-w-md">
                        The hospital profile you are looking for might have been retired or you don't have the necessary clearance to view it.
                    </p>
                </div>
                <Button onClick={() => navigate('/hospitals')} variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Return to Command Center
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Structural Header & Quick Actions */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b pb-6">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/hospitals')}
                        className="mt-1 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{hospital.hospitalName}</h1>
                            <Badge className={cn(
                                "px-3 py-1 capitalize text-xs font-semibold tracking-wider",
                                hospital.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                            )} variant="outline">
                                {hospital.isActive ? (
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Active Partner</span>
                                ) : (
                                    <span className="flex items-center gap-1.5"><XCircle className="w-3 h-3" /> Inactive</span>
                                )}
                            </Badge>
                        </div>
                        <p className="text-slate-500 flex items-center gap-2 font-medium">
                            <Building className="w-4 h-4" /> System Reference: <span className="text-slate-900">#HOSP-{hospital.id}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canUpdate && (
                        <Button
                            variant="outline"
                            className="gap-2 border-slate-200 hover:bg-slate-50 shadow-sm"
                            onClick={() => {
                                // Future: open edit dialog if needed, for now navigate might be better if integrated with edit route
                                // For now, let's assume we use the list page dialogs or a dedicated edit page
                                toast.info('Redirecting to edit suite...');
                            }}
                        >
                            <Edit className="w-4 h-4 text-blue-600" /> Modify Profile
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="destructive"
                            className="gap-2 shadow-sm"
                            onClick={() => setIsDeleteConfirmOpen(true)}
                        >
                            <Trash2 className="w-4 h-4" /> Terminate Access
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 border">
                    <TabsTrigger value="overview" className="gap-2 text-xs font-bold uppercase tracking-widest">
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="gap-2 text-xs font-bold uppercase tracking-widest">
                        Financial Suite
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2 text-xs font-bold uppercase tracking-widest">
                        Activity Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 outline-none">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Demographic Module */}
                        <Card className="shadow-none border-slate-200">
                            <CardHeader className="pb-3 border-b bg-slate-50/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <User className="h-4 w-4 text-blue-500" /> Demographic Intelligence
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-5">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Primary Liaison</p>
                                    <p className="font-semibold text-slate-800">{hospital.contactPerson || 'Unassigned'}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 group">
                                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                                            <Phone className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <span>{hospital.phoneNumber || 'No record'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 group">
                                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                                            <Mail className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <span className="truncate">{hospital.email || 'No email on file'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Geographic Module */}
                        <Card className="shadow-none border-slate-200">
                            <CardHeader className="pb-3 border-b bg-slate-50/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <MapPin className="h-4 w-4 text-red-500" /> Geo-spatial Placement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-5">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-800 leading-relaxed italic border-l-2 border-red-200 pl-3 py-1">
                                        {hospital.address || 'Address not registered'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                                    <div className="space-y-1 bg-slate-50 p-3 rounded-lg">
                                        <p className="uppercase tracking-tighter">Municipality</p>
                                        <p className="text-slate-900 border-t pt-1 mt-1">{hospital.city || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-3 rounded-lg">
                                        <p className="uppercase tracking-tighter">Territory</p>
                                        <p className="text-slate-900 border-t pt-1 mt-1">{hospital.state || hospital.country || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Institutional Module */}
                        <Card className="shadow-none border-slate-200 lg:col-span-1">
                            <CardHeader className="pb-3 border-b bg-slate-50/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <FileText className="h-4 w-4 text-emerald-500" /> Institutional Registry
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-5">
                                <div className="flex justify-between items-center text-sm border-b pb-2">
                                    <span className="text-slate-500 font-medium tracking-tight">Tax Identity</span>
                                    <Badge variant="secondary" className="font-mono text-[10px]">{hospital.taxNumber || 'NTN-PENDING'}</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b pb-2">
                                    <span className="text-slate-500 font-medium tracking-tight">Operational Mode</span>
                                    <span className="font-bold text-slate-700">Corporate-B2B</span>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-4 space-y-2 border border-dashed border-slate-300">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Internal Archives</p>
                                    <p className="text-xs text-slate-600 italic">
                                        {hospital.notes || "No historical annotations recorded for this entity."}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="financial" className="outline-none">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Account Summary & Parameters */}
                        <Card className="shadow-none border-slate-200">
                            <CardHeader className="pb-3 border-b bg-slate-50/50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <CreditCard className="h-4 w-4 text-violet-500" /> Account Parameters
                                </CardTitle>
                                <CardDescription>Fiscal governance and credit authorization</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Maximum Credit Authorization</p>
                                        <p className="text-3xl font-black text-slate-900 leading-none">
                                            {formatCurrency(hospital.creditLimit || 0)}
                                        </p>
                                    </div>
                                    <div className="h-10 w-1 bg-violet-500 rounded-full" />
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" /> Settlement Period
                                        </div>
                                        <p className="text-xl font-bold text-slate-800">{hospital.paymentTermDays || 30} <span className="text-sm font-normal text-slate-500">Days</span></p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Building className="w-3 h-3" /> Credit Tier
                                        </div>
                                        <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-500/5 font-bold uppercase text-[9px]">Gold Status</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Exposure Module */}
                        <Card className="shadow-none border-slate-200 bg-slate-900 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Banknote className="w-32 h-32" />
                            </div>
                            <CardHeader className="pb-3 border-b border-white/10">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white/70 uppercase tracking-widest">
                                    Active Exposure Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-8 relative z-10">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em]">Total Outstanding Balance</p>
                                    <div className="flex items-baseline gap-3">
                                        <h2 className="text-5xl font-black tracking-tighter text-white">
                                            {formatCurrency(hospital.outstandingBalance || 0)}
                                        </h2>
                                        <span className="text-xs text-rose-400 font-bold uppercase animate-pulse">Actionable</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-white/40 uppercase">Utilization</p>
                                        <p className="text-lg font-bold">
                                            {hospital.creditLimit ? Math.round((hospital.outstandingBalance / hospital.creditLimit) * 100) : 0}%
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-white/40 uppercase">Overdue</p>
                                        <p className="text-lg font-bold text-rose-400">{formatCurrency(0)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="activity" className="outline-none">
                    <Card className="shadow-none border-slate-200">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                Operational History
                            </CardTitle>
                            <CardDescription>Recent transactions and supply interactions</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isOrdersPending ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-500">Synchronizing activity data...</p>
                                </div>
                            ) : !ordersData || ordersData.orders.length === 0 ? (
                                <div className="p-12 text-center space-y-4">
                                    <FileText className="w-12 h-12 text-slate-200 mx-auto" />
                                    <div className="space-y-1">
                                        <p className="text-slate-600 font-bold">No Records Found</p>
                                        <p className="text-xs text-slate-400">This entity has no documented operational history yet.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {/* Table-like headers */}
                                    <div className="grid grid-cols-4 px-6 py-3 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <div>Reference</div>
                                        <div>Date</div>
                                        <div>Status</div>
                                        <div className="text-right">Total</div>
                                    </div>
                                    {ordersData.orders.map((order: any, idx) => (
                                        <div key={idx} className="grid grid-cols-4 px-6 py-4 text-sm hover:bg-slate-50 transition-colors group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500">
                                            <div className="font-bold text-blue-600">#{order.orderNo}</div>
                                            <div className="text-slate-600">{new Date(order.orderDate).toLocaleDateString()}</div>
                                            <div>
                                                <Badge className="text-[10px] capitalize font-bold" variant="outline">{order.status}</Badge>
                                            </div>
                                            <div className="text-right font-black text-slate-800">{formatCurrency(order.saleTotal)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={() => {
                    deleteHospital(hospitalId!);
                    setIsDeleteConfirmOpen(false);
                }}
                title="Institutional Termination"
                description={`You are about to permanently terminate the operational profile for ${hospital.hospitalName}. This action is irreversible and will archive all associated operational clearance. Are you absolutely certain?`}
                confirmText="Confirm Termination"
                variant="destructive"
            />
        </div>
    );
}
