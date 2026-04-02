import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupplyOrder, useSupplyOrderStatuses } from '@/api/services/supplyOrders.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  Package,
  FileText,
  User,
  StickyNote,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Mail,
  Save,
  TrendingUp,
  PackageCheck,
  Edit2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { motion, Variants } from 'framer-motion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import SupplyOrderForm from './SupplyOrderForm';

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

export default function SupplyOrderView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const soId = id ? parseInt(id) : null;

  const { data: so, isPending, error, refetch } = useSupplyOrder(soId);
  const { data: statuses = [] } = useSupplyOrderStatuses();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  if (isPending) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Synchronizing fulfillment data...</p>
        </div>
      </div>
    );
  }

  if (error || !so) {
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
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Order Unreachable</h2>
          <p className="text-muted-foreground max-w-sm text-balance">
            {error?.message || 'The requested supply order record could not be retrieved from the central inventory registry.'}
          </p>
        </div>
        <Button onClick={() => navigate('/supply-orders')} variant="default" className="gap-2 h-12 px-6 shadow-xl shadow-primary/10 transition-all hover:scale-[1.05] active:scale-95">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
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
              <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer hover:text-primary transition-colors text-xs font-semibold">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/supply-orders')} className="cursor-pointer hover:text-primary transition-colors text-xs font-semibold">Supply Orders</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-bold text-slate-900 text-xs">Order Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10 shadow-inner">
            <Package className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Supply Order
              </h1>
              <Badge variant="outline" className="px-3 py-1 bg-slate-50 text-slate-600 border-slate-200 font-mono tracking-tighter text-sm">
                {so.supplyOrderNumber}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary/60" /> {so.hospitalName}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-500/70" /> {new Date(so.orderDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 h-11 px-5 border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:scale-[1.02]"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="h-4 w-4 text-primary" />
            <span className="font-bold text-slate-700">Update Order</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-slate-100" onClick={() => window.print()}>
            <Save className="h-5 w-5 text-slate-500" />
          </Button>
        </div>
      </motion.div>

      {/* Status Stepper */}
      <motion.div variants={itemVariants}>
        <Card className="border shadow-xl shadow-slate-200/50 bg-card overflow-hidden rounded-3xl">
          <CardHeader className="bg-slate-50/80 border-b py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Fulfillment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex overflow-x-auto no-scrollbar md:grid md:grid-cols-5 lg:grid-cols-5">
              {statuses.map((status) => {
                const isCurrent = so.status === status.value;
                const isCancelled = so.status === 4; // Assuming 4=Cancelled based on pattern
                const isDone = !isCancelled && so.status > status.value && status.value !== 4;

                const name = status.name.toLowerCase();
                let Icon = Clock;
                let colorClass = "text-slate-400";
                let bgClass = "bg-transparent";

                if (name.includes('pending')) Icon = Clock;
                else if (name.includes('approved')) Icon = CheckCircle2;
                else if (name.includes('fulfilled')) Icon = Truck;
                else if (name.includes('cancelled')) Icon = XCircle;

                if (isCurrent) {
                  colorClass = status.value === 4 ? "text-rose-600" : "text-primary";
                  bgClass = status.value === 4 ? "bg-rose-50/50" : "bg-primary/5";
                } else if (isDone) {
                  colorClass = "text-emerald-600";
                  bgClass = "bg-emerald-50/30";
                }

                return (
                  <div
                    key={status.value}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 min-w-[120px] border-r border-slate-100 last:border-0 transition-all relative",
                      bgClass
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 shadow-sm",
                      isCurrent
                        ? "bg-white border-current scale-110 z-10 rotate-3 shadow-lg"
                        : "bg-slate-50/50 border-slate-100"
                    )}>
                      <Icon className={cn("h-5 w-5", colorClass)} />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1", colorClass)}>
                        {status.name}
                      </span>
                    </div>
                    {isCurrent && (
                      <motion.div
                        layoutId="active-indicator"
                        className={cn(
                          "absolute bottom-0 left-0 h-1 w-full",
                          status.value === 4 ? "bg-rose-600" : "bg-primary"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Logistics */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
              <CardHeader className="bg-slate-50/80 border-b py-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-500" /> Logistics Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-1.5 overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Endpoint</p>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{so.shippingAddress || 'No address specified'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Required By</p>
                        <p className="font-bold text-slate-800">{new Date(so.requiredByDate).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Fulfilled Date</p>
                        <p className={cn("font-bold", so.fulfilledDate ? "text-emerald-600" : "text-slate-400 italic")}>
                          {so.fulfilledDate ? new Date(so.fulfilledDate).toLocaleDateString() : 'Not fulfilled yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <StickyNote className="w-3 h-3" /> Special Instructions
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      {so.notes || 'No tactical annotations recorded for this supply order.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Items Table */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
              <CardHeader className="bg-slate-50/80 border-b py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Supply Manifest
                </CardTitle>
                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold">
                  {(so.items || []).length} Line Items
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Product Information</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Volume</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Unit Rate</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Valuation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(so.items || []).map((item) => {
                        return (
                          <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors group border-b border-slate-100">
                            <TableCell className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors cursor-default">
                                  {item.productName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 w-fit px-1.5 rounded uppercase tracking-tighter">
                                    {item.productCode}
                                  </span>
                                  {item.supplierName && (
                                    <span className="text-[9px] text-muted-foreground font-semibold italic">Supplier: {item.supplierName}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-slate-900 text-sm">{item.orderedQuantity.toLocaleString()}</span>
                                <div className="flex gap-1.5 mt-1">
                                  <Badge variant="outline" className="text-[8px] px-1 h-4 border-emerald-100 text-emerald-600 bg-emerald-50/30">F: {item.fulfilledQuantity}</Badge>
                                  <Badge variant="outline" className="text-[8px] px-1 h-4 border-rose-100 text-rose-600 bg-rose-50/30">M: {item.remainingQuantity}</Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right font-medium text-slate-500 font-mono text-xs">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-black text-slate-900">{formatCurrency(item.totalAmount)}</span>
                                <span className="text-[9px] text-slate-400 font-bold">Tax: {item.taxPercentage}% | Disc: {item.discountPercentage}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-24 space-y-8">
            {/* Financial Summary */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-violet-50 to-purple-50 shadow-xl shadow-primary/10 relative">
                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-violet-200/20 blur-2xl pointer-events-none" />
                <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                  <DollarSign className="h-48 w-48 text-primary" />
                </div>
                <CardHeader className="border-b border-primary/10 pb-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-primary via-violet-600 to-purple-600 bg-clip-text text-transparent">
                      Order Summary
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary shadow-sm">
                      <TrendingUp className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-10 pb-8 space-y-8 relative z-10">
                  <div className="space-y-3 text-center">
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">Total Amount (PKR)</p>
                    <div className="inline-flex flex-col items-center">
                      <h2 className="text-5xl font-black tracking-tighter leading-none mb-2 text-primary">
                        {formatCurrency(so.totalAmount)}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3 px-2">
                    <SummaryRow label="Subtotal" value={so.subTotal} color="text-slate-700" />
                    <SummaryRow label="Tax" value={so.taxAmount} color="text-blue-600" />
                    <SummaryRow label="Discount" value={so.discountAmount} color="text-rose-500" isNegative />
                  </div>
                </CardContent>
                <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-purple-500" />
              </Card>
            </motion.div>

            {/* Approval Info */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200 shadow-none rounded-3xl">
                <CardHeader className="pb-3 bg-slate-50/30 border-b">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Governance</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requested By</p>
                    <p className="text-sm font-bold text-slate-800">{so.requestedBy || 'N/A'}</p>
                  </div>
                  {so.approvedBy && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Approved By</p>
                      <p className="text-sm font-bold text-emerald-600">{so.approvedBy}</p>
                      <p className="text-[10px] text-slate-400">{new Date(so.approvedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-muted/20 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Update Supply Order
            </DialogTitle>
            <DialogDescription>
              Modify status and fulfillment details for SO <span className="font-mono font-bold text-foreground">{so.supplyOrderNumber}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <SupplyOrderForm
              supplyOrderId={so.id}
              onSuccess={() => {
                setIsEditModalOpen(false);
                refetch();
              }}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function SummaryRow({ label, value, color, isNegative }: { label: string; value: number; color?: string; isNegative?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{label}</span>
      <span className={cn("font-mono font-bold", color)}>
        {isNegative ? '-' : ''}{formatCurrency(value)}
      </span>
    </div>
  );
}
