import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import SupplyOrderForm from './SupplyOrderForm';
import { DataTable } from '@/components/common/DataTable';

export default function SupplyOrderList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof supplyOrders[0] | null>(null);
  const { hasPermission } = useAuth();
  const supplyOrders = useStore((state) => state.supplyOrders);
  const updateSupplyOrder = useStore((state) => state.updateSupplyOrder);
  const deleteSupplyOrder = useStore((state) => state.deleteSupplyOrder);
  const addPurchaseOrder = useStore((state) => state.addPurchaseOrder);

  const canCreate = hasPermission('supplyOrders', 'create');
  const canUpdate = hasPermission('supplyOrders', 'update');
  const canDelete = hasPermission('supplyOrders', 'delete');

  const handleEdit = (order: typeof supplyOrders[0]) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit supply orders');
      return;
    }
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleDelete = (order: typeof supplyOrders[0]) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete supply orders');
      return;
    }
    if (confirm('Are you sure you want to delete this supply order?')) {
      deleteSupplyOrder(order.id);
      toast.success('Supply order deleted successfully');
    }
  };

  const handleGeneratePO = (order: typeof supplyOrders[0]) => {
    try {
      const poRefNo = `PO-${order.orderNo}-${Date.now().toString(36).toUpperCase()}`;
      addPurchaseOrder({
        refNo: poRefNo,
        supplierName: 'Auto Generated from Supply Order',
        poDate: new Date().toISOString().split('T')[0],
        deliveryAddress: '',
        items: order.items.map((item) => ({
          id: Math.random().toString(36).substring(2, 11),
          nomenclature: item.productName,
          unit: 'unit',
          quantity: item.quantity,
          rate: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
        totalAmount: order.totalAmount,
        distributorDiscount: 0,
        netPayableAmount: order.totalAmount,
        paymentMethod: 'Bank',
        notes: `Auto-generated from Supply Order ${order.orderNo}`,
      });

      updateSupplyOrder(order.id, { generatedPOId: poRefNo });
      toast.success(`Purchase Order ${poRefNo} generated successfully`);
    } catch (error) {
      toast.error('Failed to generate purchase order');
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedOrder(null);
  };

  const columns = [
    { header: 'Order No', accessor: 'orderNo' as const },
    { header: 'Hospital', accessor: 'hospitalName' as const },
    { header: 'Order Date', accessor: 'orderDate' as const },
    { header: 'Delivery Date', accessor: 'deliveryDate' as const },
    { header: 'Amount', accessor: 'totalAmount' as const },
    { header: 'Status', accessor: 'status' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supply Orders</h1>
          <p className="text-muted-foreground">Manage hospital supply orders</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedOrder(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Supply Order
          </Button>
        )}
      </div>

      {supplyOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No supply orders yet</h3>
          <p className="text-muted-foreground">Create your first supply order to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={supplyOrders}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            itemsPerPage={10}
          />
          <div className="space-y-2">
            {supplyOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{order.orderNo}</span>
                {!order.generatedPOId && order.status === 'Confirmed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGeneratePO(order)}
                    className="gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Generate PO
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedOrder ? 'Edit Supply Order' : 'New Supply Order'}</DialogTitle>
            <DialogDescription>
              {selectedOrder ? 'Update supply order details' : 'Create a new supply order from hospital'}
            </DialogDescription>
          </DialogHeader>
          <SupplyOrderForm order={selectedOrder || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
