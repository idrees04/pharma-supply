import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateInvoiceFromSupplyOrder } from '@/hooks/invoices';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { SupplyOrder } from '@/types/api/supplyOrders';
import { CreateInvoiceFromSupplyOrderRequest } from '@/types/api/invoices';
import { InvoiceTemplate } from './InvoiceTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

interface InvoiceCreationPanelProps {
  supplyOrderId: number;
  supplyOrder: SupplyOrder;
  onSuccess?: () => void;
}

type FormInputs = Omit<CreateInvoiceFromSupplyOrderRequest, 'lines'>;

export function InvoiceCreationPanel({
  supplyOrderId,
  supplyOrder,
  onSuccess,
}: InvoiceCreationPanelProps) {
  const { toast } = useToast();
  const invoiceTemplateRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<'form' | 'preview' | 'generating'>('form');
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any>(null);

  const { register, formState: { errors }, getValues } = useForm<FormInputs>({
    defaultValues: {
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shippingCharges: 0,
      adjustmentAmount: 0,
      notes: '',
      termsAndConditions: 'Payment terms: Net 30 days. Please remit payment to the specified account.',
    },
  });


  const createInvoiceMutation = useCreateInvoiceFromSupplyOrder({
    onSuccess: (response) => {
      setGeneratedInvoiceData(response.data);
      setStep('preview');
      toast({
        title: 'Invoice Created',
        description: `Invoice ${response.data.invoiceNumber} created successfully!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invoice',
        variant: 'destructive',
      });
      setStep('form');
    },
  });

  const handleCreateInvoice = async () => {
    const formData = getValues();
    const requestData: CreateInvoiceFromSupplyOrderRequest = {
      ...formData,
      invoiceDate: new Date(formData.invoiceDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      lines: supplyOrder.items?.map((item) => ({
        supplyOrderItemId: item.id,
        quantity: item.fulfilledQuantity || item.orderedQuantity,
      })) || [],
    };

    setStep('generating');
    createInvoiceMutation.mutate({
      supplyOrderId,
      data: requestData,
    });
  };

  const handleDownloadPDF = async () => {
    if (!invoiceTemplateRef.current) return;

    try {
      setStep('generating');
      const canvas = await html2canvas(invoiceTemplateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf_height = pdf.internal.pageSize.getHeight();

      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf_height;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf_height;
      }

      pdf.save(`Invoice_${generatedInvoiceData.invoiceNumber}.pdf`);
      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully!',
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setStep('preview');
    }
  };

  if (step === 'form') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Date */}
          <div className="space-y-2">
            <Label htmlFor="invoiceDate" className="font-bold text-slate-700">
              Invoice Date
            </Label>
            <Input
              id="invoiceDate"
              type="date"
              {...register('invoiceDate', { required: 'Invoice date is required' })}
              className={cn(
                'h-11 rounded-xl border-slate-200',
                errors.invoiceDate && 'border-red-500'
              )}
            />
            {errors.invoiceDate && (
              <p className="text-xs text-red-600">{errors.invoiceDate.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="font-bold text-slate-700">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate', { required: 'Due date is required' })}
              className={cn(
                'h-11 rounded-xl border-slate-200',
                errors.dueDate && 'border-red-500'
              )}
            />
            {errors.dueDate && (
              <p className="text-xs text-red-600">{errors.dueDate.message}</p>
            )}
          </div>

          {/* Shipping Charges */}
          <div className="space-y-2">
            <Label htmlFor="shippingCharges" className="font-bold text-slate-700">
              Shipping Charges (PKR)
            </Label>
            <Input
              id="shippingCharges"
              type="number"
              step="0.01"
              {...register('shippingCharges', {
                valueAsNumber: true,
                min: { value: 0, message: 'Must be positive' },
              })}
              className="h-11 rounded-xl border-slate-200"
            />
          </div>

          {/* Adjustment Amount */}
          <div className="space-y-2">
            <Label htmlFor="adjustmentAmount" className="font-bold text-slate-700">
              Adjustment Amount (PKR)
            </Label>
            <Input
              id="adjustmentAmount"
              type="number"
              step="0.01"
              {...register('adjustmentAmount', { valueAsNumber: true })}
              className="h-11 rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="font-bold text-slate-700">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes for the invoice..."
            {...register('notes')}
            className="rounded-xl border-slate-200 min-h-[100px]"
          />
        </div>

        {/* Terms & Conditions */}
        <div className="space-y-2">
          <Label htmlFor="termsAndConditions" className="font-bold text-slate-700">
            Terms & Conditions
          </Label>
          <Textarea
            id="termsAndConditions"
            placeholder="Enter payment terms and conditions..."
            {...register('termsAndConditions')}
            className="rounded-xl border-slate-200 min-h-[100px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-6 border-t">
          <Button
            variant="outline"
            className="h-11 px-6 rounded-xl"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
          <Button
            className="h-11 px-6 rounded-xl gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={handleCreateInvoice}
            disabled={createInvoiceMutation.isPending}
          >
            {createInvoiceMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Invoice...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Create Invoice
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  if (step === 'preview' && generatedInvoiceData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Invoice Preview */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 max-h-[600px] overflow-y-auto">
          <InvoiceTemplate ref={invoiceTemplateRef} invoice={generatedInvoiceData} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-6 border-t">
          <Button
            variant="outline"
            className="h-11 px-6 rounded-xl"
            onClick={() => {
              setGeneratedInvoiceData(null);
              setStep('form');
            }}
          >
            Back
          </Button>
          <Button
            className="h-11 px-6 rounded-xl gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={handleDownloadPDF}
            disabled={createInvoiceMutation.isPending}
          >
            {createInvoiceMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
