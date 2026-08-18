import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeliveryChallan } from '@/hooks/deliveryChallans';
import { DeliveryChallanTemplate } from '@/pages/supply/DeliveryChallanTemplate';
import { downloadElementAsPdf } from '@/lib/downloadPdf';

interface DeliveryChallanPreviewDialogProps {
  challanId: number | null;
  onClose: () => void;
}

export function DeliveryChallanPreviewDialog({
  challanId,
  onClose,
}: DeliveryChallanPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const { data: dcDetail, isPending: loadingDcDetail } = useDeliveryChallan(challanId);

  const handleDownload = async () => {
    if (!printRef.current || !dcDetail) return;
    setPdfBusy(true);
    try {
      await downloadElementAsPdf(printRef.current, `DC_${dcDetail.challanNumber ?? dcDetail.id}`);
      toast.success('Delivery challan PDF downloaded');
    } catch {
      toast.error('Could not generate PDF');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <Dialog open={challanId !== null} onOpenChange={(open) => !open && onClose()}>
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
              <DeliveryChallanTemplate ref={printRef} challan={dcDetail} />
            </div>
          )}
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!dcDetail || pdfBusy}
            onClick={handleDownload}
            className="gap-2"
          >
            {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
