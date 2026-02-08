import { useState } from 'react';
import { useStore, SalesOrder } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import SalesOrderForm from './SalesOrderForm';
import { formatCurrency } from '@/lib/utils';

export default function SalesOrderList() {
  const { salesOrders, deleteSalesOrder } = useStore();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<string | null>(null);

  const canCreate = hasPermission('salesOrders', 'create');
  const canUpdate = hasPermission('salesOrders', 'update');
  const canDelete = hasPermission('salesOrders', 'delete');

  const filteredSOs = salesOrders.filter(
    (so) =>
      so.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      so.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cleared':
        return 'bg-green-100 text-green-800';
      case 'Partial':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const columns: Column<SalesOrder>[] = [
    {
      header: 'Order ID',
      accessor: 'orderId',
    },
    {
      header: 'Hospital',
      accessor: 'hospitalName',
    },
    {
      header: 'Sale Total',
      accessor: (row) => formatCurrency(row.saleTotal),
    },
    {
      header: 'Purchase Total',
      accessor: (row) => formatCurrency(row.purchaseTotal),
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Profit',
      accessor: (row) => formatCurrency(row.profit),
      className: 'hidden md:table-cell',
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge className={getStatusColor(row.paymentStatus)}>{row.paymentStatus}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Track hospital sales orders</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedSO(null);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New SO
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by hospital name or order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={salesOrders.length.toString()} />
        <StatCard label="Total Sales" value={formatCurrency(
          salesOrders.reduce((sum, so) => sum + so.saleTotal, 0)
        )} />
        <StatCard label="Total Profit" value={formatCurrency(
          salesOrders.reduce((sum, so) => sum + so.profit, 0)
        )} />
        <StatCard label="Cleared" value={salesOrders.filter(so => so.paymentStatus === 'Cleared').length.toString()} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={filteredSOs}
          onEdit={canUpdate ? (so) => {
            setSelectedSO(so);
            setIsFormOpen(true);
          } : undefined}
          onDelete={canDelete ? (so) => setIsDeleteConfirming(so.id) : undefined}
          emptyMessage="No sales orders found. Create your first SO to get started."
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSO ? 'Edit Sales Order' : 'Create New Sales Order'}</DialogTitle>
            <DialogDescription>
              {selectedSO ? 'Update sales order details' : 'Add a new sales order from hospitals'}
            </DialogDescription>
          </DialogHeader>
          <SalesOrderForm
            initialData={selectedSO || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedSO(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {isDeleteConfirming && (
        <Dialog open={!!isDeleteConfirming} onOpenChange={() => setIsDeleteConfirming(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Sales Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this sales order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteSalesOrder(isDeleteConfirming);
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
