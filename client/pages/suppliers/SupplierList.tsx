import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, AlertCircle, Users, CheckCircle, TrendingUp, LayoutGrid, List, Search } from 'lucide-react';
import { toast } from 'sonner';
import SupplierForm from './SupplierForm';
import { DataTable, Column } from '@/components/common/DataTable';
import { supplierService, useSupplierList } from '@/api/services/suppliers';
import { Supplier } from '@/types/api/suppliers';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 10;

export default function SupplierList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete State
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const canCreate = hasPermission('suppliers', 'create');
  const canUpdate = hasPermission('suppliers', 'update');
  const canDelete = hasPermission('suppliers', 'delete');

  // 1. Fetch data (large batch for client-side ops)
  const { data: supplierData, isLoading, error: suppliersError } = useSupplierList({
    pageSize: 1000,
    pageNumber: 1
  });

  const allSuppliers = supplierData?.items || [];

  // 2. Filter data
  const filteredSuppliers = useMemo(() => {
    return allSuppliers.filter(s =>
      s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSuppliers, searchTerm]);

  // Stats calculation
  const stats = useMemo(() => {
    const totals = {
      total: allSuppliers.length,
      active: 0,
      outstanding: 0,
    };

    allSuppliers.forEach((s) => {
      if (s.isActive) totals.active++;
      totals.outstanding += s.outstandingBalance || 0;
    });

    return totals;
  }, [allSuppliers]);

  const handleEdit = (supplier: Supplier) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit suppliers');
      return;
    }
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete suppliers');
      return;
    }
    setSupplierToDelete(supplier);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    setIsDeleting(true);
    try {
      await supplierService.deleteSupplier(supplierToDelete.id);
      toast.success('Supplier deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsDeleteOpen(false);
      setSupplierToDelete(null);
    } catch (error: any) {
      const message = error?.userMessage || 'Failed to delete supplier';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedSupplier(null);
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  };

  const columns: Column<Supplier>[] = useMemo(() => [
    {
      header: 'Supplier Name',
      accessor: 'supplierName',
    },
    {
      header: 'Contact Person',
      accessor: 'contactPerson',
    },
    {
      header: 'Phone',
      accessor: 'phoneNumber',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Outstanding',
      accessor: (row: Supplier) => (
        <span className={cn("font-bold", (row.outstandingBalance || 0) > 0 ? "text-red-600" : "text-green-600")}>
          {formatCurrency(row.outstandingBalance)}
        </span>
      ),
    },
    {
      header: 'Address',
      accessor: (row) => (
        <span className="text-slate-500 line-clamp-1 max-w-[200px]">{row.address}</span>
      ),
    },
  ], []);

  // Pagination for grid view
  const [gridPage, setGridPage] = useState(0);
  const gridItemsPerPage = 12;
  const gridTotalPages = Math.ceil(filteredSuppliers.length / gridItemsPerPage);
  const displaySuppliers = filteredSuppliers.slice(gridPage * gridItemsPerPage, (gridPage + 1) * gridItemsPerPage);

  if (suppliersError) {
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
                {(suppliersError as any).userMessage || 'An error occurred while loading suppliers'}
              </p>
              <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })} className="mt-2">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            className="gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIBox
          label="Total Suppliers"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          color="bg-blue-500"
        />
        <KPIBox
          label="Active Suppliers"
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          color="bg-emerald-500"
        />
        <KPIBox
          label="Total Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-red-500"
        />
      </div>

      {/* Control Bar: Search & View Switcher */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search suppliers by name, contact person or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="table" className="gap-2">
              <List className="w-4 h-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Grid
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white shadow-sm overflow-hidden"
            >
              <DataTable
                columns={columns}
                data={filteredSuppliers}
                isLoading={isLoading}
                onEdit={canUpdate ? handleEdit : undefined}
                onDelete={canDelete ? handleDeleteClick : undefined}
                itemsPerPage={ITEMS_PER_PAGE}
                emptyMessage="No suppliers found. Add your first supplier to get started."
                showSearch={false}
                onRowClick={(s) => navigate(`/suppliers/${s.id}`)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-[300px] bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : filteredSuppliers.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displaySuppliers.map((supplier) => (
                      <SupplierCard
                        key={supplier.id}
                        supplier={supplier}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                      />
                    ))}
                  </div>

                  {gridTotalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t font-medium">
                      <div className="text-sm text-muted-foreground">
                        Displaying <span className="text-foreground">{gridPage * gridItemsPerPage + 1}</span> - {' '}
                        <span className="text-foreground">{Math.min((gridPage + 1) * gridItemsPerPage, filteredSuppliers.length)}</span> of total {filteredSuppliers.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGridPage(p => Math.max(0, p - 1))}
                          disabled={gridPage === 0}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">Page {gridPage + 1} of {gridTotalPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGridPage(p => Math.min(gridTotalPages - 1, p + 1))}
                          disabled={gridPage >= gridTotalPages - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium text-slate-900">No Suppliers Found</h3>
                  <p className="text-muted-foreground">No suppliers match your criteria.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Are you sure?"
        description={
          <span>
            This action cannot be undone. This will permanently delete
            <span className="font-semibold text-foreground"> {supplierToDelete?.supplierName} </span>
            and remove it from your data.
          </span>
        }
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

function KPIBox({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`} />
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-primary flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
