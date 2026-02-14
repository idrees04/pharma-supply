import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePurchaseOrder, usePurchaseOrderStatuses } from '@/api/services/purchaseOrders';
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
  Mail
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn } from '@/lib/utils';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

export default function PurchaseOrderView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const poId = id ? parseInt(id) : null;

  const { data: po, isPending, error } = usePurchaseOrder(poId);
  const { data: statuses = [] } = usePurchaseOrderStatuses();

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
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Error loading purchase order</h2>
        <p className="text-muted-foreground max-w-xs">
          {error?.message || 'Purchase order not found. It may have been deleted or the ID is invalid.'}
        </p>
        <Button onClick={() => navigate('/orders/purchase')}>Back to Purchase Orders</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up pb-10 max-w-[1200px] mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/orders/purchase')} className="cursor-pointer">Purchase Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>View Purchase Order</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/orders/purchase')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">View Purchase Order</h1>
              <Badge variant="outline" className="text-sm font-mono border-primary/20 bg-primary/5">
                {po.purchaseOrderNumber}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Details and status of your supplier order</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <FileText className="h-4 w-4" />
            Print Order
          </Button>
        </div>
      </div>

      {/* Status Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold uppercase tracking-tight">Order Lifecycle</h2>
        </div>

        <Card className="border shadow-none bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-4">
              {statuses.map((status, index) => {
                const isCurrent = po.status === status.value;
                const isCancelled = po.status === 4;
                const isNormalFlow = status.value < 4;

                // Determine if this step is "completed" in the flow
                const isDone = !isCancelled && po.status > status.value && isNormalFlow;

                let Icon = Clock;
                let colorClass = "text-muted-foreground";
                let bgClass = "bg-muted/50";
                let borderClass = "border-transparent";

                if (status.name.toLowerCase().includes('pending')) Icon = Clock;
                if (status.name.toLowerCase().includes('confirmed')) Icon = CheckCircle2;
                if (status.name.toLowerCase().includes('completed')) Icon = Truck;
                if (status.name.toLowerCase().includes('cancelled')) Icon = XCircle;

                if (isCurrent) {
                  colorClass = status.value === 4 ? "text-red-600" : "text-primary";
                  bgClass = status.value === 4 ? "bg-red-50" : "bg-primary/10";
                  borderClass = status.value === 4 ? "border-red-200" : "border-primary/20";
                } else if (isDone) {
                  colorClass = "text-emerald-600";
                  bgClass = "bg-emerald-50";
                }

                // If cancelled, and this is a normal step, show it as skipped/muted
                if (isCancelled && isNormalFlow) {
                    colorClass = "text-muted-foreground/40";
                    bgClass = "bg-muted/20";
                }

                return (
                  <div
                    key={status.value}
                    className={cn(
                      "flex items-center gap-4 p-6 border-b md:border-b-0 md:border-r last:border-0 transition-colors relative",
                      bgClass,
                      borderClass
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm",
                      isCurrent ? "bg-background border-current scale-110 z-10" : "bg-transparent border-muted-foreground/20"
                    )}>
                      <Icon className={cn("h-6 w-6", colorClass)} />
                    </div>
                    <div className="flex flex-col">
                      <span className={cn("text-xs font-black uppercase tracking-widest leading-none mb-1", colorClass)}>
                        {status.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {isCurrent ? "Currently Here" : isDone ? "Step Completed" : isCancelled && status.value === 4 ? "Order Terminated" : "Awaiting Progress"}
                      </span>
                    </div>
                    {isCurrent && (
                        <div className={cn(
                            "absolute top-0 left-0 w-1 h-full",
                            status.value === 4 ? "bg-red-600" : "bg-primary"
                        )} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info Blocks */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">General Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <InfoItem 
                icon={<User className="h-4 w-4" />} 
                label="Supplier Name" 
                value={po.supplierName} 
                subValue={`ID: ${po.supplierId}`}
              />
              <InfoItem 
                icon={<Calendar className="h-4 w-4" />} 
                label="Order Date" 
                value={new Date(po.orderDate).toLocaleDateString(undefined, { dateStyle: 'long' })} 
              />
              <InfoItem 
                icon={<Clock className="h-4 w-4" />} 
                label="Expected Delivery" 
                value={new Date(po.expectedDeliveryDate).toLocaleDateString(undefined, { dateStyle: 'long' })} 
              />
              <InfoItem 
                icon={<Truck className="h-4 w-4" />} 
                label="Actual Delivery" 
                value={po.actualDeliveryDate ? new Date(po.actualDeliveryDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Not yet delivered'} 
                className={!po.actualDeliveryDate ? "text-muted-foreground italic" : ""}
              />
              <div className="md:col-span-2">
                <InfoItem 
                  icon={<MapPin className="h-4 w-4" />} 
                  label="Delivery Address" 
                  value={po.deliveryAddress} 
                />
              </div>
              <div className="md:col-span-2">
                <InfoItem 
                  icon={<StickyNote className="h-4 w-4" />} 
                  label="Special Notes" 
                  value={po.notes || 'No special instructions provided.'} 
                  className={!po.notes ? "text-muted-foreground italic" : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="shadow-sm">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Ordered Items</CardTitle>
                </div>
                <Badge variant="secondary">{po.items.length} Items</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[60px] text-center">#</TableHead>
                    <TableHead>Product Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Tax %</TableHead>
                    <TableHead className="text-right">Disc %</TableHead>
                    <TableHead className="text-right pr-6">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.items.map((item, index) => {
                    const lineSubtotal = item.orderedQuantity * item.unitPrice;
                    const lineTax = lineSubtotal * (item.taxPercentage / 100);
                    const lineDiscount = lineSubtotal * (item.discountPercentage / 100);
                    const lineTotal = lineSubtotal + lineTax - lineDiscount;

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/10">
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.productCode}</p>
                        </TableCell>
                        <TableCell className="text-right font-medium">{item.orderedQuantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">{item.taxPercentage}%</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{item.discountPercentage}%</TableCell>
                        <TableCell className="text-right pr-6 font-bold">{formatCurrency(lineTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Financial Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6 shadow-md border-primary/10 overflow-hidden">
            <div className="h-1.5 bg-primary" />
            <CardHeader className="bg-muted/10">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Financial Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <SummaryRow label="Gross Amount" value={calculations.subtotal} />
                <SummaryRow label="Tax Amount" value={calculations.tax} className="text-blue-600" />
                <SummaryRow label="Discount Amount" value={calculations.discount} className="text-red-600" isNegative />
                <Separator className="my-2" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black uppercase text-muted-foreground tracking-widest">Total Payable</span>
                  <span className="text-2xl font-black text-primary tracking-tight">
                    {formatCurrency(calculations.total)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/5 border-t pt-4">
              <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated</span>
                <span>{new Date(po.createdAt).toLocaleString()}</span>
              </div>
            </CardFooter>
          </Card>

          {/* Quick Actions / Help */}
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-primary tracking-widest">Available Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9">
                  <FileText className="h-4 w-4" /> Download PDF
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9">
                  <Mail className="h-4 w-4" /> Email Supplier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, subValue, className }: { icon: React.ReactNode; label: string; value: string; subValue?: string; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <p className="text-sm font-semibold leading-none">{value}</p>
        {subValue && <p className="text-[10px] text-muted-foreground mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, className, isNegative }: { label: string; value: number; className?: string; isNegative?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm font-medium">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono", className)}>
        {isNegative ? '-' : ''}{formatCurrency(value)}
      </span>
    </div>
  );
}
