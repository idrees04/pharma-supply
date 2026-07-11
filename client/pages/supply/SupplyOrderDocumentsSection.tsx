import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, Download, FileText, Loader2, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

import { useSupplyOrderDeliveryChallans } from '@/api/services/supplyOrders.service';
import { useInvoicesBySupplyOrder, useInvoice } from '@/hooks/invoices';
import { useDeliveryChallan } from '@/hooks/deliveryChallans';
import type { InvoiceDto } from '@/types/api/invoices';
import type { DeliveryChallanSummary } from '@/types/api/supplyOrders';
import { InvoiceTemplate } from './InvoiceTemplate';
import { DeliveryChallanTemplate } from './DeliveryChallanTemplate';
import { downloadElementAsPdf } from '@/lib/downloadPdf';

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

function invoiceStatusLabel(status: number): string {
  const map: Record<number, string> = {
    1: 'Draft',
    2: 'Generated',
    3: 'Sent',
    4: 'Partially paid',
    5: 'Paid',
    6: 'Overdue',
    7: 'Cancelled',
    8: 'Refunded',
  };
  return map[status] ?? `Status ${status}`;
}

function dcStatusLabel(status: number): string {
  const map: Record<number, string> = {
    1: 'Draft',
    2: 'Dispatched',
    3: 'Cancelled',
  };
  return map[status] ?? `Status ${status}`;
}

interface SupplyOrderDocumentsSectionProps {
  supplyOrderId: number;
}

export function SupplyOrderDocumentsSection({ supplyOrderId }: SupplyOrderDocumentsSectionProps) {
  const { data: challans = [], isPending: loadingDc } = useSupplyOrderDeliveryChallans(supplyOrderId);
  const { data: invoices = [], isPending: loadingInv } = useInvoicesBySupplyOrder(supplyOrderId);

  const [invoicePreviewId, setInvoicePreviewId] = useState<number | null>(null);
  const [dcPreviewId, setDcPreviewId] = useState<number | null>(null);
  const [pdfBusy, setPdfBusy] = useState<'inv' | 'dc' | null>(null);

  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const dcPrintRef = useRef<HTMLDivElement>(null);

  const { data: invoiceDetailRes, isPending: loadingInvoiceDetail } = useInvoice(invoicePreviewId);
  const invoiceDetail = invoiceDetailRes?.data;

  const { data: dcDetail, isPending: loadingDcDetail } = useDeliveryChallan(dcPreviewId);

  const handleDownloadInvoice = async () => {
    if (!invoicePrintRef.current || !invoiceDetail) return;
    setPdfBusy('inv');
    try {
      await downloadElementAsPdf(
        invoicePrintRef.current,
        `Invoice_${invoiceDetail.invoiceNumber ?? invoiceDetail.id}`
      );
      toast.success('Invoice PDF downloaded');
    } catch {
      toast.error('Could not generate PDF');
    } finally {
      setPdfBusy(null);
    }
  };

  const handleDownloadDc = async () => {
    if (!dcPrintRef.current || !dcDetail) return;
    setPdfBusy('dc');
    try {
      await downloadElementAsPdf(dcPrintRef.current, `DC_${dcDetail.challanNumber ?? dcDetail.id}`);
      toast.success('Delivery challan PDF downloaded');
    } catch {
      toast.error('Could not generate PDF');
    } finally {
      setPdfBusy(null);
    }
  };

  return (
    <>
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-1">
        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="border-b bg-slate-50/80 py-4">
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <Truck className="h-4 w-4 text-orange-500" />
              Delivery challans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingDc ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : challans.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No delivery challans for this order.</p>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Challan</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Dispatch</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    <TableHead className="w-[140px] px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challans.map((c: DeliveryChallanSummary) => (
                    <TableRow key={c.id} className="hover:bg-slate-50/30 border-b border-slate-100">
                      <TableCell className="px-6 py-4 font-mono font-semibold text-primary">{c.challanNumber}</TableCell>
                      <TableCell className="text-sm">
                        {c.dispatchDate ? new Date(c.dispatchDate).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {dcStatusLabel(c.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mr-1 h-8"
                          onClick={() => setDcPreviewId(c.id)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Preview
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="border-b bg-slate-50/80 py-4">
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <FileText className="h-4 w-4 text-primary" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingInv ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : invoices.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No invoices for this order.</p>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Invoice</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Total</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    <TableHead className="w-[140px] px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: InvoiceDto) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/30 border-b border-slate-100">
                      <TableCell className="px-6 py-4 font-mono font-semibold text-primary">
                        {inv.invoiceNumber ?? `#${inv.id}`}
                      </TableCell>
                      <TableCell className="text-sm">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(inv.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {invoiceStatusLabel(inv.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => setInvoicePreviewId(inv.id)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Preview
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="h-8 px-2" asChild>
                            <Link to={`/invoices/${inv.id}`}>Open</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={invoicePreviewId !== null} onOpenChange={(o) => !o && setInvoicePreviewId(null)}>
        <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 border-none shadow-2xl">
          <DialogHeader className="border-b bg-muted/20 px-6 py-4">
            <DialogTitle>Invoice preview</DialogTitle>
            <DialogDescription>
              {invoiceDetail?.invoiceNumber ? (
                <span className="font-mono font-semibold">{invoiceDetail.invoiceNumber}</span>
              ) : (
                'Loading…'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[62vh] overflow-y-auto bg-slate-100 px-4 py-6">
            {loadingInvoiceDetail || !invoiceDetail ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex justify-center">
                <InvoiceTemplate ref={invoicePrintRef} invoice={invoiceDetail} />
              </div>
            )}
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setInvoicePreviewId(null)}>
              Close
            </Button>
            <Button
              type="button"
              disabled={!invoiceDetail || pdfBusy === 'inv'}
              onClick={handleDownloadInvoice}
              className="gap-2"
            >
              {pdfBusy === 'inv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dcPreviewId !== null} onOpenChange={(o) => !o && setDcPreviewId(null)}>
        <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 border-none shadow-2xl">
          <DialogHeader className="border-b bg-muted/20 px-6 py-4">
            <DialogTitle>Delivery challan preview</DialogTitle>
            <DialogDescription>
              {dcDetail?.challanNumber ? (
                <span className="font-mono font-semibold">{dcDetail.challanNumber}</span>
              ) : (
                'Loading…'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[62vh] overflow-y-auto bg-slate-100 px-4 py-6">
            {loadingDcDetail || !dcDetail ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex justify-center">
                <DeliveryChallanTemplate ref={dcPrintRef} challan={dcDetail} />
              </div>
            )}
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDcPreviewId(null)}>
              Close
            </Button>
            <Button
              type="button"
              disabled={!dcDetail || pdfBusy === 'dc'}
              onClick={handleDownloadDc}
              className="gap-2"
            >
              {pdfBusy === 'dc' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
