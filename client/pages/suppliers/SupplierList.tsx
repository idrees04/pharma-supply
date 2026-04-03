import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, AlertCircle, Users, CheckCircle, TrendingUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import SupplierForm from './SupplierForm';
import { DataTable, Column } from '@/components/common/DataTable';
import { supplierService, useSupplierList } from '@/api/services/suppliers';
import { Supplier } from '@/types/api/suppliers';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;

export default function SupplierList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const canCreate = hasPermission('suppliers', 'create');
  const canUpdate = hasPermission('suppliers', 'update');
  const canDelete = hasPermission('suppliers', 'delete');

  const { data: supplierData, isLoading, error: suppliersError } = useSupplierList({
    pageSize: 1000,
    pageNumber: 1
  });

  const allSuppliers = supplierData?.items || [];

  const filteredSuppliers = useMemo(() => {
    return allSuppliers.filter(s =>
      s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSuppliers, searchTerm]);

  useEffect(() => {
    if (editId && allSuppliers.length > 0) {
      const supplier = allSuppliers.find(s => s.id === parseInt(editId));
      if (supplier) {
        setSelectedSupplier(supplier);
        setIsDialogOpen(true);
      }
    }
  }, [editId, allSuppliers]);

  const stats = useMemo(() => {
    const totals = { total: allSuppliers.length, active: 0, outstanding: 0 };
    allSuppliers.forEach((s) => {
      if (s.isActive) totals.active++;
      totals.outstanding += s.outstandingBalance || 0;
    });
    return totals;
  }, [allSuppliers]);

  const handleEdit = (supplier: Supplier) => {
    if (!canUpdate) { toast.error('You do not have permission to edit suppliers'); return; }
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    if (!canDelete) { toast.error('You do not have permission to delete suppliers'); return; }
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
      toast.error(error?.userMessage || 'Failed to delete supplier');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!selectedSupplier) {
      setRefreshTrigger(prev => prev + 1);
    }
    setIsDialogOpen(false);
    setSelectedSupplier(null);
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    if (searchParams.has('edit')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('edit');
      setSearchParams(newParams, { replace: true });
    }
  };

  const columns: Column<Supplier>[] = useMemo(() => [
    {
      header: 'ID',
      accessor: 'id',

    },
    {
      header: 'Supplier Name',
      accessor: (row: Supplier) => (
        <span className="font-semibold text-slate-900">{row.supplierName}</span>
      ),
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
      header: 'City',
      accessor: 'city',
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge className={cn(
          'text-[10px] font-black uppercase tracking-wider px-2',
          row.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500'
        )}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Outstanding (PKR)',
      accessor: (row) => (
        <span className={cn('font-bold tabular-nums', (row.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-emerald-600')}>
          {formatCurrency(row.outstandingBalance)}
        </span>
      ),
    },
    {
      header: 'City / Address',
      accessor: (row) => (
        <span className="text-slate-500 text-sm truncate block max-w-[160px]">{row.address}</span>
      ),
    },
  ], []);

  if (suppliersError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <div className="rounded-xl border border-destructive bg-destructive/5 p-5 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-destructive">Error loading suppliers</h3>
            <p className="text-sm text-destructive/80 mt-1">{(suppliersError as any).userMessage || 'An error occurred while loading suppliers'}</p>
            <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })} className="mt-3">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your pharmaceutical suppliers</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => { setSelectedSupplier(null); setIsDialogOpen(true); }}
            className="gap-2 shadow-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KPIBox label="Total Suppliers" value={stats.total} icon={<Users className="w-5 h-5" />} iconColor="text-blue-600 bg-blue-50" color="bg-blue-500" />
        <KPIBox label="Active Suppliers" value={stats.active} icon={<CheckCircle className="w-5 h-5" />} iconColor="text-emerald-600 bg-emerald-50" color="bg-emerald-500" />
        <KPIBox label="Total Outstanding" value={formatCurrency(stats.outstanding)} icon={<TrendingUp className="w-5 h-5" />} iconColor="text-red-600 bg-red-50" color="bg-red-500" />
      </div>

      {/* Search Bar */}
      <div className="relative group w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by name, contact person, or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 w-full"
        />
      </div>

      {/* Responsive Table */}
      <div className="w-full overflow-x-auto">
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
          resetSortTrigger={refreshTrigger}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription>
              {selectedSupplier ? 'Update supplier details' : 'Enter the details for the new supplier'}
            </DialogDescription>
          </DialogHeader>
          <SupplierForm supplier={selectedSupplier || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Supplier"
        description={
          <span>
            This action cannot be undone. This will permanently delete{' '}
            <span className="font-semibold text-foreground">{supplierToDelete?.supplierName}</span> from your records.
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

function KPIBox({ label, value, icon, color, iconColor }: { label: string; value: string | number; icon: React.ReactNode; color: string; iconColor: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 border-border">
        <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-[0.04] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`} />
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{label}</p>
            <p className="text-xl font-bold tracking-tight mt-0.5 truncate">{value}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
