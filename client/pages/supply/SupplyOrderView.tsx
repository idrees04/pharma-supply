import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupplyOrder, useSupplyOrderStatuses, useSupplyOrderDeliveryChallans } from '@/api/services/supplyOrders.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  Package,
  User,
  StickyNote,
  DollarSign,
  TrendingUp,
  PackageCheck,
  Edit2,
  FileType2,
  Truck,
  Printer,
  Paperclip,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/federationBranding';
import { motion, Variants } from 'framer-motion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PrintDocumentHeader } from '@/components/print/PrintDocumentHeader';
import { SupplyOrderLifecycleStepper } from '@/components/supply-orders/SupplyOrderLifecycleStepper';
import { SupplyOrderProgressSummary } from '@/components/supply-orders/SupplyOrderProgressSummary';
import {
  getFinancialSummaryLabel,
  getRecommendedSupplyOrderAction,
  getSupplyOrderStatusClassName,
  getSupplyOrderStatusLabel,
} from '@/lib/supplyOrderStatusDisplay';
import SupplyOrderForm from './SupplyOrderForm';
import { DeliveryChallanFromSupplyOrderPanel } from './DeliveryChallanFromSupplyOrderPanel';
import { InvoiceCreationPanel } from './InvoiceCreationPanel';
import { SupplyOrderDocumentsSection } from './SupplyOrderDocumentsSection';
import { SupplyOrderStatus } from '@/types/api/supplyOrders';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

export default function SupplyOrderView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const soId = id ? parseInt(id) : null;

  const { data: so, isPending, error, refetch } = useSupplyOrder(soId);
  const { data: statuses = [], isPending: statusesLoading } = useSupplyOrderStatuses();
  const { data: deliveryChallans = [], isPending: deliveryChallansLoading } =
    useSupplyOrderDeliveryChallans(soId);
  const hasDeliveryChallans = deliveryChallans.length > 0;

  const recommendedAction = so ? getRecommendedSupplyOrderAction(so, hasDeliveryChallans) : 'none';

  const [fulfillmentSheetOpen, setFulfillmentSheetOpen] = React.useState(false);
  const [fulfillmentMode, setFulfillmentMode] = React.useState<'dispatch' | 'invoice'>('dispatch');
  const [preselectDeliveryChallanId, setPreselectDeliveryChallanId] = React.useState<number | undefined>(
    undefined
  );
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);

  const openDispatchSheet = () => {
    setFulfillmentMode('dispatch');
    setPreselectDeliveryChallanId(undefined);
    setFulfillmentSheetOpen(true);
  };

  const openInvoiceSheet = () => {
    setFulfillmentMode('invoice');
    setPreselectDeliveryChallanId(undefined);
    setFulfillmentSheetOpen(true);
  };

  const handleFulfillmentSheetOpenChange = (open: boolean) => {
    setFulfillmentSheetOpen(open);
    if (!open) {
      setPreselectDeliveryChallanId(undefined);
      setFulfillmentMode('dispatch');
    }
  };

  const handleDeliveryChallanCreated = async (dcId: number) => {
    await refetch();
    setPreselectDeliveryChallanId(dcId);
    setFulfillmentMode('invoice');
  };

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
            {error?.message ||
              'The requested supply order record could not be retrieved from the central inventory registry.'}
          </p>
        </div>
        <Button
          onClick={() => navigate('/supply-orders')}
          variant="default"
          className="gap-2 h-12 px-6 shadow-xl shadow-primary/10 transition-all hover:scale-[1.05] active:scale-95"
        >
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
      <div className="hidden print:block">
        <PrintDocumentHeader title="SUPPLY ORDER" subtitle={so.supplyOrderNumber} />
      </div>

      <motion.div variants={itemVariants} className="print:hidden">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => navigate('/')}
                className="cursor-pointer hover:text-primary transition-colors text-xs font-semibold"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => navigate('/supply-orders')}
                className="cursor-pointer hover:text-primary transition-colors text-xs font-semibold"
              >
                Supply Orders
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-bold text-slate-900 text-xs">Order Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between print:hidden"
      >
        <div className="flex items-center gap-5">
          <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10 shadow-inner">
            <Package className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">Supply Order</h1>
              <Badge
                variant="outline"
                className="px-3 py-1 bg-slate-50 text-slate-600 border-slate-200 font-mono tracking-tighter text-sm"
              >
                {so.supplyOrderNumber}
              </Badge>
              <Badge
                variant="outline"
                className={cn('px-3 py-1 font-bold', getSupplyOrderStatusClassName(so.status))}
              >
                {getSupplyOrderStatusLabel(so.status, statuses)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary/60" /> {so.hospitalName}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-500/70" />{' '}
                {new Date(so.orderDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
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

          <Button
            type="button"
            className={cn(
              'gap-2 h-12 px-5 text-base shadow-lg shadow-primary/20 font-semibold',
              recommendedAction === 'dispatch' && 'ring-2 ring-primary/30 ring-offset-2'
            )}
            onClick={openDispatchSheet}
          >
            <Truck className="h-5 w-5 shrink-0" />
            Create delivery challan
          </Button>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={!hasDeliveryChallans ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                  {deliveryChallansLoading ? (
                    <Button type="button" variant="secondary" className="gap-2 h-12 px-5" disabled>
                      <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                      <span className="font-semibold">Checking challans…</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className={cn(
                        'gap-2 h-12 px-6 text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/25 font-semibold disabled:opacity-60',
                        recommendedAction === 'invoice' && 'ring-2 ring-emerald-300 ring-offset-2'
                      )}
                      disabled={!hasDeliveryChallans}
                      onClick={() => hasDeliveryChallans && openInvoiceSheet()}
                    >
                      <FileType2 className="h-5 w-5 shrink-0" />
                      Create invoice
                    </Button>
                  )}
                </span>
              </TooltipTrigger>
              {!deliveryChallansLoading && !hasDeliveryChallans && (
                <TooltipContent side="bottom" className="max-w-xs text-sm">
                  Create a delivery challan first. Invoicing is only available after at least one challan exists
                  for this order.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            className="gap-2 h-12 px-5 text-base border-slate-200 hover:bg-slate-50 shadow-sm"
            onClick={() => window.print()}
          >
            <Printer className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold text-slate-700">Preview / Print</span>
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4 print:hidden">
        <SupplyOrderLifecycleStepper
          currentStatus={so.status}
          statuses={statuses}
          isLoading={statusesLoading}
        />
        <SupplyOrderProgressSummary supplyOrder={so} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
              <CardHeader className="bg-slate-50/80 border-b py-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-500" /> Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-1.5 overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Delivery address
                      </p>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                          {so.shippingAddress || 'No address specified'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Required by</p>
                        <p className="font-bold text-slate-800">
                          {new Date(so.requiredByDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Fulfilled date</p>
                        <p
                          className={cn(
                            'font-bold',
                            so.fulfilledDate ? 'text-emerald-600' : 'text-slate-400 italic'
                          )}
                        >
                          {so.fulfilledDate
                            ? new Date(so.fulfilledDate).toLocaleDateString()
                            : 'Not fulfilled yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <StickyNote className="w-3 h-3" /> Special Instructions
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      {so.notes || 'No special instructions recorded.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
              <CardHeader className="bg-slate-50/80 border-b py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Line Items
                </CardTitle>
                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold">
                  {(so.items || []).length} products
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                          Product Information
                        </TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">
                          Volume
                        </TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                          Unit rate (PKR)
                        </TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                          Valuation (PKR)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(so.items || []).map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-slate-50/30 transition-colors group border-b border-slate-100"
                        >
                          <TableCell className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors cursor-default">
                                {item.productName}
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 w-fit px-1.5 rounded uppercase tracking-tighter">
                                  {item.productCode}
                                </span>
                                {item.supplierName && (
                                  <span className="text-[9px] text-muted-foreground font-semibold italic">
                                    Supplier: {item.supplierName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-5 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-black text-slate-900 text-sm">
                                {item.orderedQuantity.toLocaleString()}
                              </span>
                              <div className="flex gap-1.5 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-[8px] px-1 h-4 border-emerald-100 text-emerald-600 bg-emerald-50/30"
                                >
                                  F: {item.fulfilledQuantity}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[8px] px-1 h-4 border-rose-100 text-rose-600 bg-rose-50/30"
                                >
                                  M: {item.remainingQuantity}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-5 text-right font-medium text-slate-500 font-mono text-xs">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="px-6 py-5 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-slate-900">{formatCurrency(item.totalAmount)}</span>
                              <span className="text-[9px] text-slate-400 font-bold">
                                Tax: {item.taxPercentage}% | Disc: {item.discountPercentage}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <SupplyOrderDocumentsSection supplyOrderId={so.id} />
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-24 space-y-8">
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
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">
                      Total Amount (PKR)
                    </p>
                    <div className="inline-flex flex-col items-center">
                      <h2 className="text-5xl font-black tracking-tighter leading-none mb-2 text-primary">
                        {formatCurrency(so.totalAmount)}
                      </h2>
                      <Badge
                        className={cn(
                          'font-black text-[9px] uppercase tracking-widest px-3 border',
                          getSupplyOrderStatusClassName(so.status)
                        )}
                      >
                        {getFinancialSummaryLabel(so)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 px-2">
                    <SummaryRow label="Subtotal" value={so.subTotal} color="text-slate-700" />
                    <SummaryRow label="Tax" value={so.taxAmount} color="text-blue-600" />
                    <SummaryRow label="Discount" value={so.discountAmount} color="text-rose-500" isNegative />
                    <div className="border-t border-primary/10 pt-4 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Discount %
                      </span>
                      <span className="text-xl font-black text-slate-800">
                        {so.subTotal > 0 ? ((so.discountAmount / so.subTotal) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
                <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-purple-500" />
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="pb-3 bg-slate-50/80 border-b py-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Governance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requested by</p>
                    <p className="text-sm font-bold text-slate-800">{so.requestedBy || 'N/A'}</p>
                  </div>
                  {so.attachmentPath ? (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> Attachment
                      </p>
                      <a
                        href={resolveMediaUrl(so.attachmentPath, '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {so.attachmentFileName || 'Download attachment'}
                      </a>
                    </div>
                  ) : null}
                  {so.approvedBy && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Approved by</p>
                      <p className="text-sm font-bold text-emerald-600">{so.approvedBy}</p>
                      {so.approvedDate && (
                        <p className="text-[10px] text-slate-400">
                          {new Date(so.approvedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-[800px] p-0 border-l-0">
          <div className="h-full flex flex-col focus-visible:outline-none">
            <SheetHeader className="p-6 bg-muted/20 border-b">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <Edit2 className="h-6 w-6 text-primary" />
                Update Supply Order
              </SheetTitle>
              <SheetDescription>
                {so.status === SupplyOrderStatus.Draft ? (
                  <>
                    Edit line items, pricing, and fulfillment for draft SO{' '}
                    <span className="font-mono font-bold text-foreground">{so.supplyOrderNumber}</span>
                  </>
                ) : (
                  <>
                    Modify status and fulfillment details for SO{' '}
                    <span className="font-mono font-bold text-foreground">{so.supplyOrderNumber}</span>
                  </>
                )}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {isEditSheetOpen && (
                <SupplyOrderForm
                  supplyOrderId={so.id}
                  onSuccess={() => {
                    setIsEditSheetOpen(false);
                    refetch();
                  }}
                  onCancel={() => setIsEditSheetOpen(false)}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={fulfillmentSheetOpen} onOpenChange={handleFulfillmentSheetOpenChange}>
        <SheetContent className="sm:max-w-[800px] p-0 border-l-0">
          <div className="h-full flex flex-col focus-visible:outline-none">
            <SheetHeader className="p-6 bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {fulfillmentMode === 'dispatch' ? (
                    <PackageCheck className="h-6 w-6 text-primary" />
                  ) : (
                    <FileType2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold">
                    {fulfillmentMode === 'dispatch' ? 'Create delivery challan' : 'Create invoice'}
                  </SheetTitle>
                  <SheetDescription>
                    {fulfillmentMode === 'dispatch' ? (
                      <>
                        Dispatch stock and create a delivery challan for{' '}
                        <span className="font-mono font-bold text-foreground">{so.supplyOrderNumber}</span>
                      </>
                    ) : (
                      <>
                        Generate an invoice for{' '}
                        <span className="font-mono font-bold text-foreground">{so.supplyOrderNumber}</span> linked
                        to an existing delivery challan
                      </>
                    )}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div
              className="flex-1 overflow-y-auto p-6 bg-muted/5"
              key={`${fulfillmentMode}-${preselectDeliveryChallanId ?? 0}`}
            >
              {soId && fulfillmentMode === 'dispatch' && fulfillmentSheetOpen && (
                <DeliveryChallanFromSupplyOrderPanel
                  supplyOrderId={soId}
                  supplyOrder={so}
                  onCreated={handleDeliveryChallanCreated}
                  onCancel={() => handleFulfillmentSheetOpenChange(false)}
                />
              )}
              {soId && fulfillmentMode === 'invoice' && fulfillmentSheetOpen && (
                <InvoiceCreationPanel
                  supplyOrderId={soId}
                  supplyOrder={so}
                  initialDeliveryChallanId={preselectDeliveryChallanId}
                  lockDeliveryChallanSelection={false}
                  requireDeliveryChallan
                  onSuccess={() => {
                    refetch();
                    handleFulfillmentSheetOpenChange(false);
                  }}
                  onClose={() => handleFulfillmentSheetOpenChange(false)}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  color,
  isNegative,
}: {
  label: string;
  value: number;
  color?: string;
  isNegative?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{label}</span>
      <span className={cn('font-mono font-bold', color)}>
        {isNegative ? '-' : ''}
        {formatCurrency(value)}
      </span>
    </div>
  );
}
