import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { InvoiceDto } from '@/types/api/invoices';
import { motion } from 'framer-motion';

interface InvoiceTemplateProps {
  invoice: InvoiceDto;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice }, ref) => {
    const subtotal = invoice.subTotal;
    const tax = invoice.taxAmount;
    const discount = invoice.discountAmount;
    const shipping = invoice.shippingCharges;
    const adjustment = invoice.adjustmentAmount;
    const total = invoice.totalAmount;

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
      },
    };

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full bg-white p-8 rounded-lg shadow-xl"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          fontSize: '14px',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 pb-6 border-b-2 border-slate-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-black text-primary mb-1">INVOICE</h1>
              <p className="text-slate-500 text-sm font-semibold">
                Invoice #{invoice.invoiceNumber || 'TBD'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700 mb-1">Status</p>
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                {getStatusLabel(invoice.status)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Company & Hospital Info */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              From
            </p>
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-sm">Pharma Supply Company</p>
              <p className="text-xs text-slate-600">Main Office</p>
              <p className="text-xs text-slate-600">Email: accounts@pharmasupply.com</p>
              <p className="text-xs text-slate-600">Phone: +92 (0) 300 1234567</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              Bill To
            </p>
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-sm">{invoice.hospitalName}</p>
              <p className="text-xs text-slate-600">Hospital ID: #{invoice.hospitalId}</p>
              <p className="text-xs text-slate-600">Supply Order ID: {invoice.supplyOrderId}</p>
              <p className="text-xs text-slate-600">Contact the hospital directly</p>
            </div>
          </div>
        </motion.div>

        {/* Invoice Details */}
        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-4 mb-8 p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Invoice Date</p>
            <p className="font-semibold text-slate-900">
              {new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Due Date</p>
            <p className="font-semibold text-slate-900">
              {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Outstanding</p>
            <p className="font-semibold text-red-600">
              {formatCurrency(invoice.outstandingAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Amount Due</p>
            <p className="font-bold text-2xl text-primary">
              {formatCurrency(invoice.totalAmount)}
            </p>
          </div>
        </motion.div>

        {/* Items Table */}
        <motion.div variants={itemVariants} className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100">
                <th className="text-left py-3 px-4 font-bold text-slate-700 text-xs">
                  PRODUCT
                </th>
                <th className="text-center py-3 px-4 font-bold text-slate-700 text-xs">
                  QTY
                </th>
                <th className="text-right py-3 px-4 font-bold text-slate-700 text-xs">
                  UNIT PRICE
                </th>
                <th className="text-right py-3 px-4 font-bold text-slate-700 text-xs">
                  TAX
                </th>
                <th className="text-right py-3 px-4 font-bold text-slate-700 text-xs">
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    variants={itemVariants}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.batchNumber && `Batch: ${item.batchNumber}`}
                        {item.expiryDate && ` | Exp: ${new Date(item.expiryDate).toLocaleDateString()}`}
                      </p>
                    </td>
                    <td className="text-center py-3 px-4 font-semibold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="text-right py-3 px-4 font-mono text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <p className="font-semibold text-slate-900">{item.taxPercentage}%</p>
                      <p className="text-xs text-slate-500">{formatCurrency(item.taxAmount)}</p>
                    </td>
                    <td className="text-right py-3 px-4 font-bold text-slate-900">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>

        {/* Summary Section */}
        <motion.div variants={itemVariants} className="mb-8 flex justify-end">
          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Subtotal</span>
              <span className="text-slate-900 font-bold">{formatCurrency(subtotal)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600 font-semibold">Tax ({invoice.items?.length || 0}%)</span>
                <span className="text-blue-600 font-bold">{formatCurrency(tax)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600 font-semibold">Discount</span>
                <span className="text-red-600 font-bold">-{formatCurrency(discount)}</span>
              </div>
            )}
            {shipping > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600 font-semibold">Shipping</span>
                <span className="text-slate-900 font-bold">{formatCurrency(shipping)}</span>
              </div>
            )}
            {adjustment !== 0 && (
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600 font-semibold">Adjustment</span>
                <span className={`font-bold ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {adjustment > 0 ? '+' : '-'}{formatCurrency(Math.abs(adjustment))}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-primary/10 px-3 rounded-lg mt-4">
              <span className="font-black text-slate-900 uppercase text-sm">Total Amount</span>
              <span className="font-black text-primary text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.termsAndConditions) && (
          <motion.div variants={itemVariants} className="mb-6 space-y-4">
            {invoice.notes && (
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Notes
                </p>
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.termsAndConditions && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Terms & Conditions
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {invoice.termsAndConditions}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="mt-12 pt-6 border-t-2 border-slate-300 text-center space-y-2"
        >
          <p className="text-xs text-slate-500 font-semibold">
            This invoice is a computer-generated document and is valid without signature.
          </p>
          <p className="text-[10px] text-slate-400">
            Generated on {new Date().toLocaleDateString()} | Invoice ID: {invoice.id}
          </p>
          <p className="text-[10px] text-slate-400">
            Thank you for your business. Please remit payment by the due date.
          </p>
        </motion.div>
      </motion.div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';

function getStatusLabel(status: number): string {
  const statusMap: Record<number, string> = {
    1: 'Draft',
    2: 'Sent',
    3: 'Partially Paid',
    4: 'Paid',
    5: 'Overdue',
    6: 'Cancelled',
    7: 'Refunded',
    8: 'Disputed',
  };
  return statusMap[status] || 'Unknown';
}
