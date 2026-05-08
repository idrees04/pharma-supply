import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePurchaseOrder, usePurchaseOrderStatuses, useSuggestedPayment } from '@/api/services/purchaseOrders';
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
  CreditCard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { UpdatePurchaseOrderForm } from '@/components/purchase-orders/UpdatePurchaseOrderForm';
import { ReceiveItemsForm } from '@/components/purchase-orders/ReceiveItemsForm';
import { PaymentDrawer } from '@/components/purchase-orders/PaymentDrawer';
import { Edit2 } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { unwrapSuggestedPayment } from '@/lib/purchaseOrderPayment';

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

export default function PurchaseOrderView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const poId = id ? parseInt(id) : null;

  const { data: po, isPending, error, refetch } = usePurchaseOrder(poId);
  const { data: statuses = [] } = usePurchaseOrderStatuses();
  const poCancelled = po?.status === 8;
  const { data: paySuggestionRaw, isPending: paySuggestionLoading, error: paySuggestionError } =
    useSuggestedPayment(po && !poCancelled ? po.id : null);
  const paySuggestion = useMemo(() => unwrapSuggestedPayment(paySuggestionRaw), [paySuggestionRaw]);
  const maxPayableNow = paySuggestion?.suggestedPayableAmount ?? 0;

  const payDisabled =
    poCancelled ||
    paySuggestionLoading ||
    (!paySuggestionError && maxPayableNow <= 0);

  const payDisabledReason = poCancelled
    ? 'This purchase order is cancelled. Payments are not allowed.'
    : paySuggestionLoading
      ? 'Checking how much you can pay against received goods…'
      : !paySuggestionError && maxPayableNow <= 0
        ? 'Nothing to pay yet: receive goods for this PO first, or the payable balance is already settled.'
        : '';

  /** POST /PurchaseOrders/receive rejects Received (5) and Cancelled (8); Closed (9) blocked in UI. */
  const receiveDisabled =
    !po ||
    po.status === 5 ||
    po.status === 8 ||
    po.status === 9 ||
    (po.items?.every((line) => line.remainingQuantity <= 0) ?? true);

  const receiveDisabledReason =
    !po
      ? ''
      : po.status === 8
        ? 'Cancelled purchase orders cannot receive goods.'
        : po.status === 5
          ? 'This order is already fully received.'
          : po.status === 9
            ? 'This purchase order is closed.'
            : po.items?.every((line) => line.remainingQuantity <= 0)
              ? 'All lines are fully received; there is nothing left to receive.'
              : '';
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
  const [isReceiveSheetOpen, setIsReceiveSheetOpen] = React.useState(false);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = React.useState(false);

  const calculations = useMemo(() => {
    if (!po?.items) return { subtotal: 0, tax: 0, discount: 0, total: 0 };

    const totals = po.items.reduce((acc, item) => {
      const subtotal = item.orderedQuantity * item.unitPrice;
      acc.subtotal += subtotal;
      acc.tax += subtotal * (item.taxPercentage / 100);
      acc.discount += subtotal * (item.discountPercentage / 100);
      return acc;
    }, { subtotal: 0, tax: 0, discount: 0 });

    return {
      ...totals,
      total: totals.subtotal + totals.tax - totals.discount
    };
  }, [po]);

  if (isPending) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Synchronizing procurement data...</p>
        </div>
      </div>
    );
  }

  if (error || !po) {
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
            {error?.message || 'The requested purchase order record could not be retrieved from the central procurement registry.'}
          </p>
        </div>
        <Button onClick={() => navigate('/orders/purchase')} variant="default" className="gap-2 h-12 px-6 shadow-xl shadow-primary/10 transition-all hover:scale-[1.05] active:scale-95">
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
      className="w-full max-w-none mx-auto space-y-8 py-6 pb-20"
    >
      {/* Breadcrumb Intelligence */}
      <motion.div variants={itemVariants}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer hover:text-primary transition-colors text-xs font-semibold">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/orders/purchase')} className="cursor-pointer hover:text-primary transition-colors text-xs font-semibold">Purchase Orders</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-bold text-slate-900 text-xs">Order Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* High-Fidelity Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10 shadow-inner">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Purchase Order
              </h1>
              <Badge variant="outline" className="px-3 py-1 bg-slate-50 text-slate-600 border-slate-200 font-mono tracking-tighter text-sm">
                {po.purchaseOrderNumber}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary/60" /> {po.supplierName}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-500/70" /> {new Date(po.orderDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 h-12 px-5 text-base border-slate-200 hover:bg-slate-50 shadow-sm"
            onClick={() => setIsEditSheetOpen(true)}
          >
            <Edit2 className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold text-slate-700">Update order</span>
          </Button>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={receiveDisabled ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                  <Button
                    type="button"
                    className="gap-2 h-12 px-5 text-base shadow-lg shadow-primary/20 disabled:opacity-60"
                    disabled={receiveDisabled}
                    onClick={() => !receiveDisabled && setIsReceiveSheetOpen(true)}
                  >
                    <PackageCheck className="h-5 w-5 shrink-0" />
                    <span className="font-semibold">Receive goods</span>
                  </Button>
                </span>
              </TooltipTrigger>
              {receiveDisabled && receiveDisabledReason && (
                <TooltipContent side="bottom" className="max-w-xs text-sm">
                  {receiveDisabledReason}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={payDisabled ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 h-12 px-6 text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/25 font-semibold disabled:opacity-60"
                    disabled={payDisabled}
                    onClick={() => !payDisabled && setIsPaymentDrawerOpen(true)}
                  >
                    <CreditCard className="h-5 w-5 shrink-0" />
                    Pay supplier
                    {!paySuggestionLoading && paySuggestion && maxPayableNow > 0 && (
                      <span className="ml-1 rounded-md bg-white/20 px-2 py-0.5 text-sm tabular-nums font-bold">
                        {formatCurrency(maxPayableNow)}
                      </span>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {payDisabled && payDisabledReason && (
                <TooltipContent side="bottom" className="max-w-xs text-sm">
                  {payDisabledReason}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {/* <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-slate-100" onClick={() => window.print()}>
            <Save className="h-5 w-5 text-slate-500" />
          </Button> */}
        </div>
      </motion.div>

      {/* Lifecycle Intelligence Stepper */}
      <motion.div variants={itemVariants}>
        <Card className="border shadow-xl shadow-slate-200/50 bg-card overflow-hidden rounded-3xl">
          <CardHeader className="bg-slate-50/80 border-b py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Order Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex overflow-x-auto no-scrollbar md:grid md:grid-cols-9 lg:grid-cols-9">
              {statuses.map((status) => {
                const isCurrent = po.status === status.value;
                const isCancelled = po.status === 8;
                const isDone = !isCancelled && po.status > status.value && status.value !== 8;

                const name = status.name.toLowerCase();
                let Icon = Clock;
                let colorClass = "text-slate-400";
                let bgClass = "bg-transparent";

                if (name.includes('draft')) Icon = FileText;
                else if (name.includes('sent')) Icon = Mail;
                else if (name.includes('confirmed')) Icon = CheckCircle2;
                else if (name.includes('partiallyreceived')) Icon = Package;
                else if (name.includes('received')) Icon = Truck;
                else if (name.includes('partiallypaid')) Icon = DollarSign;
                else if (name.includes('paid')) Icon = DollarSign;
                else if (name.includes('cancelled')) Icon = XCircle;
                else if (name.includes('closed')) Icon = Save;

                if (isCurrent) {
                  colorClass = status.value === 8 ? "text-rose-600" : "text-primary";
                  bgClass = status.value === 8 ? "bg-rose-50/50" : "bg-primary/5";
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
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                        {isCurrent ? "Active Node" : isDone ? "Validated" : isCancelled && status.value === 8 ? "Terminated" : "Pending"}
                      </span>
                    </div>
                    {isCurrent && (
                      <motion.div
                        layoutId="active-indicator"
                        className={cn(
                          "absolute bottom-0 left-0 h-1 w-full",
                          status.value === 8 ? "bg-rose-600" : "bg-primary"
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
        {/* Main Content Flux */}
        <div className="lg:col-span-8 space-y-8">
          {/* General Logistics */}
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
                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{po.deliveryAddress || 'No address specified'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Expectation</p>
                        <p className="font-bold text-slate-800">{new Date(po.expectedDeliveryDate).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Actual Arrival</p>
                        <p className={cn("font-bold", po.actualDeliveryDate ? "text-emerald-600" : "text-slate-400 italic")}>
                          {po.actualDeliveryDate ? new Date(po.actualDeliveryDate).toLocaleDateString() : 'Not recorded'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <StickyNote className="w-3 h-3" /> Special Instructions
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      {po.notes || 'No tactical annotations recorded for this procurement cycle.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ordered Items Manifest */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
              <CardHeader className="bg-slate-50/80 border-b py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> SKU Manifest
                </CardTitle>
                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold">
                  {(po.items || []).length} SKUs Identified
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
                      {(po.items || []).map((item, index) => {
                        const lineSubtotal = item.orderedQuantity * item.unitPrice;
                        const lineTax = lineSubtotal * (item.taxPercentage / 100);
                        const lineDiscount = lineSubtotal * (item.discountPercentage / 100);
                        const lineTotal = lineSubtotal + lineTax - lineDiscount;

                        return (
                          <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors group border-b border-slate-100">
                            <TableCell className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors cursor-default">
                                  {item.productName}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 w-fit px-1.5 rounded uppercase tracking-tighter">
                                  {item.productCode}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-slate-900 text-sm">{item.orderedQuantity.toLocaleString()}</span>
                                <div className="flex gap-1.5 mt-1">
                                  <Badge variant="outline" className="text-[8px] px-1 h-4 border-emerald-100 text-emerald-600 bg-emerald-50/30">R: {item.receivedQuantity}</Badge>
                                  <Badge variant="outline" className="text-[8px] px-1 h-4 border-rose-100 text-rose-600 bg-rose-50/30">M: {item.remainingQuantity}</Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right font-medium text-slate-500 font-mono text-xs">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-black text-slate-900">{formatCurrency(lineTotal)}</span>
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

        {/* Vertical Intelligence Stack */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-24 space-y-8">
            {/* Financial Equilibrium Card */}
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
                        {formatCurrency(calculations.total)}
                      </h2>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black text-[9px] uppercase tracking-widest px-3">
                        Payment Due
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 px-2">
                    <SummaryRow label="Subtotal" value={calculations.subtotal} color="text-slate-700" />
                    <SummaryRow label="Tax" value={calculations.tax} color="text-blue-600" />
                    <SummaryRow label="Discount" value={calculations.discount} color="text-rose-500" isNegative />
                    <div className="border-t border-primary/10 pt-4 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Discount %</span>
                      <span className="text-xl font-black text-slate-800">
                        {calculations.subtotal > 0 ? ((calculations.discount / calculations.subtotal) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
                <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-purple-500" />
              </Card>
            </motion.div>

            {/* Ancillary Historical Data */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200 shadow-none rounded-3xl">
                <CardHeader className="pb-3 bg-slate-50/30 border-b">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Info</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="p-4 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <Clock className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-bold text-slate-600">Created At</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-900">{new Date(po.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="p-4 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group text-xs text-muted-foreground italic">
                    Last updated successfully.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-[540px] p-0 border-l-0">
          <div className="h-full flex flex-col focus-visible:outline-none">
            <SheetHeader className="p-6 bg-muted/20 border-b">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <Edit2 className="h-6 w-6 text-primary" />
                Update Purchase Order
              </SheetTitle>
              <SheetDescription>
                Modify the status and delivery details for PO <span className="font-mono font-bold text-foreground">{po.purchaseOrderNumber}</span>
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <UpdatePurchaseOrderForm
                purchaseOrder={po}
                onSuccess={() => {
                  setIsEditSheetOpen(false);
                  refetch();
                }}
                onCancel={() => setIsEditSheetOpen(false)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isReceiveSheetOpen} onOpenChange={setIsReceiveSheetOpen}>
        <SheetContent className="sm:max-w-[800px] p-0 border-l-0">
          <div className="h-full flex flex-col focus-visible:outline-none">
            <SheetHeader className="p-6 bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PackageCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold">Receive Goods</SheetTitle>
                  <SheetDescription>
                    Record quantity received and batch details for PO <span className="font-mono font-bold text-foreground">{po.purchaseOrderNumber}</span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
              <ReceiveItemsForm
                purchaseOrder={po}
                onSuccess={() => {
                  setIsReceiveSheetOpen(false);
                  refetch();
                }}
                onCancel={() => setIsReceiveSheetOpen(false)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <PaymentDrawer
        isOpen={isPaymentDrawerOpen}
        onOpenChange={setIsPaymentDrawerOpen}
        purchaseOrderId={po.id}
        purchaseOrderNumber={po.purchaseOrderNumber}
        onSuccess={() => {
          refetch();
        }}
      />
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
