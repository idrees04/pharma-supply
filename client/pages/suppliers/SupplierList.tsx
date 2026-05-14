import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Plus, AlertCircle, Users, CheckCircle, TrendingUp, Search, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import SupplierForm from './SupplierForm';
import { DataTable, Column } from '@/components/common/DataTable';
import { supplierService, useSupplierList, useSuppliersByStatus } from '@/api/services/suppliers';
import { EntityBulkImportDialog } from '@/components/common/EntityBulkImportDialog';
import { Supplier } from '@/types/api/suppliers';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSupplierStatusOptions } from '@/hooks/dropdown';

const ITEMS_PER_PAGE = 10;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SupplierList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);
  const statusEnum = statusFilter === 'all' ? null : Number(statusFilter);
  const { data: supplierStatusOptions = [] } = useSupplierStatusOptions();

  const canCreate = hasPermission('suppliers', 'create');
  const canUpdate = hasPermission('suppliers', 'update');
  const canDelete = hasPermission('suppliers', 'delete');
  const canReadList = hasPermission('suppliers', 'read');

  const {
    data: supplierData,
    isLoading: loadingAll,
    error: errorAll,
  } = useSupplierList(
    {
      pageSize: 500,
      pageNumber: 1,
      searchTerm: debouncedSearch || undefined,
    },
    { enabled: statusFilter === 'all' }
  );

  const {
    data: suppliersByStatus = [],
    isLoading: loadingByStatus,
    error: errorByStatus,
  } = useSuppliersByStatus(statusFilter === 'all' ? null : statusEnum);

  const suppliersError = statusFilter === 'all' ? errorAll : errorByStatus;

  const filterByLocalSearch = useCallback(
    (rows: Supplier[]) => {
      const q = debouncedSearch.toLowerCase();
      if (!q) return rows;
      return rows.filter(
        (s) =>
          s.supplierName.toLowerCase().includes(q) ||
          (s.contactPerson?.toLowerCase().includes(q) ?? false) ||
          (s.city?.toLowerCase().includes(q) ?? false) ||
          (s.email?.toLowerCase().includes(q) ?? false)
      );
    },
    [debouncedSearch]
  );

  const filteredSuppliers = useMemo(() => {
    if (statusFilter === 'all') return supplierData?.items || [];
    return filterByLocalSearch(suppliersByStatus);
  }, [statusFilter, supplierData?.items, suppliersByStatus, filterByLocalSearch]);

  const isLoading = statusFilter === 'all' ? loadingAll : loadingByStatus;

  useEffect(() => {
    if (!editId || filteredSuppliers.length === 0) return;
    const supplier = filteredSuppliers.find((s) => s.id === parseInt(editId, 10));
    if (supplier) {
      setSelectedSupplier(supplier);
      setIsDialogOpen(true);
    }
  }, [editId, filteredSuppliers]);

  const stats = useMemo(() => {
    const totals = { total: filteredSuppliers.length, active: 0, outstanding: 0 };
    filteredSuppliers.forEach((s) => {
      if (s.isActive) totals.active++;
      totals.outstanding += s.outstandingBalance || 0;
    });
    return totals;
  }, [filteredSuppliers]);

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
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'by-status'] });
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
    queryClient.invalidateQueries({ queryKey: ['suppliers', 'by-status'] });
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
      accessor: (row) => {
        const label =
          supplierStatusOptions.find((o) => o.value === row.status)?.name ??
          (row.isActive ? 'Active' : 'Inactive');
        return (
          <Badge
            className={cn(
              'text-[10px] font-black uppercase tracking-wider px-2',
              row.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500'
            )}
          >
            {label}
          </Badge>
        );
      },
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
  ], [supplierStatusOptions]);

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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
          {canReadList && (
            <Button
              type="button"
              variant="outline"
              className="gap-2 shadow-sm"
              onClick={() =>
                toast.promise(
                  supplierService.exportSuppliersExcel({
                    searchTerm: debouncedSearch || undefined,
                    status: statusFilter === 'all' ? undefined : statusEnum ?? undefined,
                  }),
                  {
                    loading: 'Exporting suppliers…',
                    success: 'Excel file downloaded',
                    error: (e) => (e as Error)?.message || 'Export failed',
                  }
                )
              }
            >
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          )}
          {canCreate && (
            <Button type="button" variant="outline" className="gap-2 shadow-sm" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="w-4 h-4" />
              Bulk import
            </Button>
          )}
          {canCreate && (
            <Button
              onClick={() => { setSelectedSupplier(null); setIsDialogOpen(true); }}
              className="gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KPIBox label="Total Suppliers" value={stats.total} icon={<Users className="w-5 h-5" />} iconColor="text-blue-600 bg-blue-50" color="bg-blue-500" />
        <KPIBox label="Active Suppliers" value={stats.active} icon={<CheckCircle className="w-5 h-5" />} iconColor="text-emerald-600 bg-emerald-50" color="bg-emerald-500" />
        <KPIBox label="Total outstanding (PKR)" value={formatCurrency(stats.outstanding)} icon={<TrendingUp className="w-5 h-5" />} iconColor="text-red-600 bg-red-50" color="bg-red-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={
              statusFilter === 'all'
                ? 'Search (server + name / contact / city / email)…'
                : 'Filter this list by name, contact, city…'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 w-full"
          />
        </div>
        <div className="space-y-2 w-full md:w-56">
          <Label className="text-xs text-muted-foreground">Supplier status (API)</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (paged list)</SelectItem>
              {supplierStatusOptions.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      <EntityBulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Bulk import suppliers"
        description="Upload an Excel file (.xlsx) that matches the template. Valid rows are saved in one transaction; duplicates and invalid rows are skipped with an optional error report."
        fieldLegend={
          'Required: SupplierName. Optional columns match the template (contact, address, tax, payment terms, credit limit, status, etc.).'
        }
        onDownloadTemplate={() => supplierService.downloadSupplierImportTemplate()}
        onImport={(f, opts) => supplierService.bulkImportSuppliers(f, opts)}
        onImported={() => {
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          queryClient.invalidateQueries({ queryKey: ['suppliers', 'by-status'] });
        }}
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
