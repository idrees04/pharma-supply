import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePurchaseOrder } from '@/api/services/purchaseOrders';
import { PurchaseOrderTemplate } from './PurchaseOrderTemplate';
import { downloadElementAsPdf } from '@/lib/downloadPdf';
import { printElement } from '@/lib/printElement';

export default function PurchaseOrderPrintPage() {
  const { id } = useParams<{ id: string }>();
  const poId = Number(id);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: purchaseOrder, isPending, error } = usePurchaseOrder(
    Number.isFinite(poId) && poId > 0 ? poId : null,
  );

  const handleDownloadPdf = async () => {
    if (!printRef.current || !purchaseOrder) return;
    await downloadElementAsPdf(
      printRef.current,
      `PO-${purchaseOrder.purchaseOrderNumber ?? poId}.pdf`,
    );
  };

  const handlePrint = () => {
    printElement(printRef.current, { mountId: 'purchase-order-print-mount' });
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm">Loading purchase order…</p>
      </div>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/orders/purchase">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <p className="text-sm text-red-700">Unable to load purchase order for printing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/orders/purchase/view/${poId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to PO
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button size="sm" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[210mm]">
        <PurchaseOrderTemplate ref={printRef} purchaseOrder={purchaseOrder} />
      </div>
    </div>
  );
}
