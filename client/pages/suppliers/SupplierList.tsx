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
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SupplierForm from './SupplierForm';
import { DataTable } from '@/components/common/DataTable';

export default function SupplierList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<typeof suppliers[0] | null>(null);
  const { hasPermission } = useAuth();
  const suppliers = useStore((state) => state.suppliers);
  const updateSupplier = useStore((state) => state.updateSupplier);
  const deleteSupplier = useStore((state) => state.deleteSupplier);

  const canCreate = hasPermission('suppliers', 'create');
  const canUpdate = hasPermission('suppliers', 'update');
  const canDelete = hasPermission('suppliers', 'delete');

  const handleEdit = (supplier: typeof suppliers[0]) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit suppliers');
      return;
    }
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = (supplier: typeof suppliers[0]) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete suppliers');
      return;
    }
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(supplier.id);
      toast.success('Supplier deleted successfully');
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedSupplier(null);
  };

  const columns = [
    { header: 'Name', accessor: 'name' as const },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Phone', accessor: 'phone' as const },
    { header: 'City', accessor: 'city' as const },
    { header: 'Country', accessor: 'country' as const },
    { header: 'Payment Terms', accessor: 'paymentTerms' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage your pharmaceutical suppliers</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedSupplier(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No suppliers yet</h3>
          <p className="text-muted-foreground">Add your first supplier to get started</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          itemsPerPage={10}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription>
              {selectedSupplier ? 'Update supplier details' : 'Enter the details for the new supplier'}
            </DialogDescription>
          </DialogHeader>
          <SupplierForm supplier={selectedSupplier || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
