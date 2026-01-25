import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import SupplierForm from './SupplierForm';
import { DataTable } from '@/components/common/DataTable';
import { useSupplierList, useDeleteSupplier } from '@/api/services/suppliers';
import { Supplier, SupplierListQueryParams } from '@/types/api/suppliers';

export default function SupplierList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { hasPermission } = useAuth();

  // Fetch suppliers with pagination and search
  const queryParams: SupplierListQueryParams = {
    pageNumber: currentPage,
    pageSize,
    searchTerm: searchTerm || undefined,
  };

  const {
    data: suppliersData,
    isPending: isLoading,
    error: listError,
  } = useSupplierList(queryParams);

  // Delete mutation
  const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplier(
    selectedSupplier?.id || 0
  );

  const canCreate = hasPermission('suppliers', 'create');
  const canUpdate = hasPermission('suppliers', 'update');
  const canDelete = hasPermission('suppliers', 'delete');

  const handleEdit = (supplier: Supplier) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit suppliers');
      return;
    }
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete suppliers');
      return;
    }

    if (confirm(`Are you sure you want to delete ${supplier.supplierName}?`)) {
      deleteSupplier(undefined, {
        onSuccess: () => {
          toast.success('Supplier deleted successfully');
          setSelectedSupplier(null);
        },
        onError: (error) => {
          toast.error(error.userMessage || 'Failed to delete supplier');
        },
      });
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedSupplier(null);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const columns = [
    { header: 'Supplier Name', accessor: 'supplierName' as const },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Phone', accessor: 'phoneNumber' as const },
    { header: 'City', accessor: 'city' as const },
    { header: 'Country', accessor: 'country' as const },
  ];

  const suppliers = suppliersData?.items || [];
  const totalCount = suppliersData?.totalCount || 0;
  const totalPages = suppliersData?.totalPages || 0;

  if (listError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">Manage your suppliers</p>
          </div>
        </div>

        <div className="rounded-lg border border-destructive bg-destructive/5 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Error loading suppliers</h3>
              <p className="text-sm text-destructive/80 mt-1">
                {listError.userMessage || 'An error occurred while loading suppliers'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search suppliers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="rounded-lg border p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchTerm ? 'No suppliers found' : 'No suppliers yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? 'Try adjusting your search term'
              : 'Add your first supplier to get started'}
          </p>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={suppliers}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            isLoading={isDeleting}
            emptyMessage="No suppliers found"
          />

          {/* Pagination Info */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{' '}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} suppliers
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier
                ? 'Update supplier details'
                : 'Enter the details for the new supplier'}
            </DialogDescription>
          </DialogHeader>
          <SupplierForm
            supplier={selectedSupplier || undefined}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
