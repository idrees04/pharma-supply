import { useState } from 'react';
import { useStore, SalesTaxInvoice } from '@/hooks/useStore';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SalesTaxInvoiceForm from './SalesTaxInvoiceForm';
import { formatCurrency } from '@/lib/utils';

export default function SalesTaxInvoiceList() {
  const { taxInvoices, deleteTaxInvoice } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesTaxInvoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<string | null>(null);

  const filteredInvoices = taxInvoices.filter(
    (invoice) =>
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<SalesTaxInvoice>[] = [
    {
      header: 'Invoice No',
      accessor: 'invoiceNo',
    },
    {
      header: 'Invoice Date',
      accessor: 'invoiceDate',
    },
    {
      header: 'Customer',
      accessor: 'customerName',
    },
    {
      header: 'Items',
      accessor: (row) => row.items.length,
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Total Amount',
      accessor: (row) => formatCurrency(row.totalNetAmount),
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Tax Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tax invoices and billing</p>
        </div>
        <Button
          onClick={() => {
            setSelectedInvoice(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by invoice number or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Invoices" value={taxInvoices.length.toString()} />
        <StatCard label="Total Amount" value={formatCurrency(
          taxInvoices.reduce((sum, inv) => sum + inv.totalNetAmount, 0)
        )} />
        <StatCard label="Total Items" value={
          taxInvoices.reduce((sum, inv) => sum + inv.items.length, 0).toString()
        } />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={filteredInvoices}
          onEdit={(invoice) => {
            setSelectedInvoice(invoice);
            setIsFormOpen(true);
          }}
          onDelete={(invoice) => setIsDeleteConfirming(invoice.id)}
          emptyMessage="No invoices found. Create your first invoice to get started."
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {selectedInvoice ? 'Update invoice details' : 'Add a new sales tax invoice'}
            </DialogDescription>
          </DialogHeader>
          <SalesTaxInvoiceForm
            initialData={selectedInvoice || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedInvoice(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {isDeleteConfirming && (
        <Dialog open={!!isDeleteConfirming} onOpenChange={() => setIsDeleteConfirming(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this invoice? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteTaxInvoice(isDeleteConfirming);
                  setIsDeleteConfirming(null);
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
