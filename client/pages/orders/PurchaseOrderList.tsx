import { useState } from 'react';
import { useStore, PurchaseOrder } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PurchaseOrderForm from './PurchaseOrderForm';
import { formatCurrency } from '@/lib/utils';

export default function PurchaseOrderList() {
  const { purchaseOrders, deletePurchaseOrder } = useStore();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<string | null>(null);

  const canCreate = hasPermission('purchaseOrders', 'create');
  const canUpdate = hasPermission('purchaseOrders', 'update');
  const canDelete = hasPermission('purchaseOrders', 'delete');

  const filteredPOs = purchaseOrders.filter(
    (po) =>
      po.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<PurchaseOrder>[] = [
    {
      header: 'Ref No',
      accessor: 'refNo',
    },
    {
      header: 'Supplier',
      accessor: 'supplierName',
    },
    {
      header: 'PO Date',
      accessor: 'poDate',
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Items',
      accessor: (row) => row.items.length,
      className: 'hidden md:table-cell',
    },
    {
      header: 'Net Amount',
      accessor: (row) => formatCurrency(row.netPayableAmount),
    },
    {
      header: 'Payment',
      accessor: 'paymentMethod',
      className: 'hidden sm:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage supplier purchase orders</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedPO(null);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New PO
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by reference number or supplier name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total POs" value={purchaseOrders.length.toString()} />
        <StatCard label="Total Amount" value={formatCurrency(
          purchaseOrders.reduce((sum, po) => sum + po.netPayableAmount, 0)
        )} />
        <StatCard label="Cash POs" value={purchaseOrders.filter(po => po.paymentMethod === 'Cash').length.toString()} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={filteredPOs}
          onEdit={canUpdate ? (po) => {
            setSelectedPO(po);
            setIsFormOpen(true);
          } : undefined}
          onDelete={canDelete ? (po) => setIsDeleteConfirming(po.id) : undefined}
          emptyMessage="No purchase orders found. Create your first PO to get started."
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPO ? 'Edit Purchase Order' : 'Create New Purchase Order'}</DialogTitle>
            <DialogDescription>
              {selectedPO ? 'Update purchase order details' : 'Add a new purchase order for suppliers'}
            </DialogDescription>
          </DialogHeader>
          <PurchaseOrderForm
            initialData={selectedPO || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedPO(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {isDeleteConfirming && (
        <Dialog open={!!isDeleteConfirming} onOpenChange={() => setIsDeleteConfirming(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Purchase Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this purchase order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deletePurchaseOrder(isDeleteConfirming);
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
