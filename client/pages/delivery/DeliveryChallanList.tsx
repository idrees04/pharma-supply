import { useState } from 'react';
import { useStore, DeliveryChallan } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DeliveryChallanForm from './DeliveryChallanForm';

export default function DeliveryChallanList() {
  const { deliveryChallans, deleteDeliveryChallan } = useStore();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDC, setSelectedDC] = useState<DeliveryChallan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canCreate = hasPermission('deliveryChallans', 'create');
  const canUpdate = hasPermission('deliveryChallans', 'update');
  const canDelete = hasPermission('deliveryChallans', 'delete');

  const filteredDCs = deliveryChallans.filter(
    (dc) =>
      dc.dcNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<DeliveryChallan>[] = [
    {
      header: 'ID',
      accessor: 'id',

    },
    {
      header: 'DC No',
      accessor: 'dcNo',
    },
    {
      header: 'DC Date',
      accessor: 'dcDate',
    },
    {
      header: 'PO No',
      accessor: 'poNo',
    },
    {
      header: 'Buyer Name',
      accessor: 'buyerName',
    },
    {
      header: 'Items',
      accessor: (row) => row.items.length,
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Total Qty',
      accessor: (row) => row.items.reduce((sum, item) => sum + item.quantity, 0),
      className: 'hidden md:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Delivery Challans</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage delivery challans and shipment tracking</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedDC(null);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New DC
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by DC No, PO No, or Buyer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total DCs" value={deliveryChallans.length.toString()} />
        <StatCard label="Total Items Delivered" value={
          deliveryChallans.reduce((sum, dc) => sum + dc.items.length, 0).toString()
        } />
        <StatCard label="Total Quantity" value={
          deliveryChallans.reduce((sum, dc) => sum + dc.items.reduce((s, item) => s + item.quantity, 0), 0).toString()
        } />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={filteredDCs}
          onEdit={canUpdate ? (dc) => {
            setSelectedDC(dc);
            setIsFormOpen(true);
          } : undefined}
          onDelete={canDelete ? (dc) => setIsDeleteConfirming(dc.id) : undefined}
          emptyMessage="No delivery challans found. Create your first DC to get started."
          resetSortTrigger={refreshTrigger}
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDC ? 'Edit Delivery Challan' : 'Create New Delivery Challan'}</DialogTitle>
            <DialogDescription>
              {selectedDC ? 'Update delivery challan details' : 'Add a new delivery challan'}
            </DialogDescription>
          </DialogHeader>
          <DeliveryChallanForm
            initialData={selectedDC || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedDC(null);
              if (!selectedDC) {
                setRefreshTrigger(prev => prev + 1);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {isDeleteConfirming && (
        <Dialog open={!!isDeleteConfirming} onOpenChange={() => setIsDeleteConfirming(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Delivery Challan</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this delivery challan? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteDeliveryChallan(isDeleteConfirming);
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
