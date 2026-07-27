import { useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadElementAsPdf } from '@/lib/downloadPdf';
import { printElement } from '@/lib/printElement';
import { toast } from '@/hooks/use-toast';

interface PrintActionsToolbarProps {
  /** Ref to the printable element (rendered off-screen or on-screen). */
  targetRef: React.RefObject<HTMLDivElement>;
  /** Base filename (without extension) used for the downloaded PDF. */
  fileName: string;
  /** Disable both actions, e.g. while the underlying data is still loading. */
  disabled?: boolean;
  /** Unique DOM id used to isolate this print job from any other on the page. */
  mountId?: string;
  className?: string;
}

export function PrintActionsToolbar({
  targetRef,
  fileName,
  disabled = false,
  mountId,
  className,
}: PrintActionsToolbarProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    if (!targetRef.current) return;
    printElement(targetRef.current, { mountId });
  };

  const handleDownloadPdf = async () => {
    if (!targetRef.current) return;
    setIsDownloading(true);
    try {
      await downloadElementAsPdf(targetRef.current, `${fileName}.pdf`);
    } catch {
      toast({
        title: 'Download failed',
        description: 'Could not generate the PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={disabled} className="gap-2">
        <Printer className="h-4 w-4" />
        Print
      </Button>
      <Button size="sm" onClick={handleDownloadPdf} disabled={disabled || isDownloading} className="gap-2">
        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download PDF
      </Button>
    </div>
  );
}
