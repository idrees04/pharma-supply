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
import { Plus, AlertCircle, CheckCircle, TrendingDown, Search, Hospital as HospitalIcon, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import HospitalForm from './HospitalForm';
import { DataTable, Column } from '@/components/common/DataTable';
import { Hospital, hospitalService } from '@/api/services/hospitals.service';
import { useDeleteHospital, useGetHospitals } from '@/hooks/useHospitals';
import { EntityBulkImportDialog } from '@/components/common/EntityBulkImportDialog';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TableCard } from '@/components/common/TableCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;

export default function HospitalList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [hospitalToDelete, setHospitalToDelete] = useState<Hospital | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const canCreate = hasPermission('hospitals', 'create');
  const canUpdate = hasPermission('hospitals', 'update');
  const canDelete = hasPermission('hospitals', 'delete');
  const canReadList = hasPermission('hospitals', 'read');

  const { data: hospitalData, isLoading, error: hospitalsError } = useGetHospitals({
    pageSize: 1000,
    pageNumber: 1
  });

  const allHospitals = hospitalData?.data?.items || [];

  const filteredHospitals = useMemo(() => {
    return allHospitals.filter(h =>
      h.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allHospitals, searchTerm]);

  useEffect(() => {
    if (editId && allHospitals.length > 0) {
      const hospital = allHospitals.find(h => h.id === parseInt(editId));
      if (hospital) {
        setSelectedHospital(hospital);
        setIsDialogOpen(true);
      }
    }
  }, [editId, allHospitals]);

  const stats = useMemo(() => {
    const totals = { total: allHospitals.length, active: 0, outstanding: 0 };
    allHospitals.forEach((h) => {
      if (h.isActive) totals.active++;
      totals.outstanding += h.outstandingBalance || 0;
    });
    return totals;
  }, [allHospitals]);

  const { mutate: deleteHospital, isPending: isDeleting } = useDeleteHospital({
    onSuccess: () => {
      toast.success('Hospital deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      setIsDeleteOpen(false);
      setHospitalToDelete(null);
    },
    onError: (error) => {
      toast.error(error.userMessage || 'Failed to delete hospital');
    },
  });

  const handleEdit = (hospital: Hospital) => {
    if (!canUpdate) { toast.error('You do not have permission to edit hospitals'); return; }
    setSelectedHospital(hospital);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (hospital: Hospital) => {
    if (!canDelete) { toast.error('You do not have permission to delete hospitals'); return; }
    setHospitalToDelete(hospital);
    setIsDeleteOpen(true);
  };

  const handleAddClick = () => {
    setSelectedHospital(null);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    if (!selectedHospital) {
      setRefreshTrigger(prev => prev + 1);
    }
    setIsDialogOpen(false);
    setSelectedHospital(null);
    queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    if (searchParams.has('edit')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('edit');
      setSearchParams(newParams, { replace: true });
    }
  };

  const columns: Column<Hospital>[] = useMemo(() => [
    {
      header: 'ID',
      accessor: 'id',

    },
    {
      header: 'Hospital Name',
      accessor: (row: Hospital) => (
        <span className="font-semibold text-slate-900">{row.hospitalName}</span>
      ),
      id: 'hospitalName',
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
      header: 'Credit Limit',
      accessor: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.creditLimit)}</span>
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
  ], []);

  if (hospitalsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Hospitals</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Error loading hospitals</h3>
            <p className="text-sm text-red-700 mt-1">{(hospitalsError as any).userMessage || 'An error occurred'}</p>
            <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['hospitals'] })} className="mt-3">
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hospitals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage hospital customer accounts</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
          {canReadList && (
            <Button
              type="button"
              variant="outline"
              className="gap-2 shadow-sm"
              onClick={() =>
                toast.promise(
                  hospitalService.exportExcel({
                    searchTerm: searchTerm.trim() || undefined,
                  }),
                  {
                    loading: 'Exporting hospitals…',
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
            <Button onClick={handleAddClick} disabled={isLoading} className="gap-2 shadow-md">
              <Plus className="w-4 h-4" />
              Add Hospital
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KPIBox label="Total Hospitals" value={stats.total} icon={<HospitalIcon className="w-5 h-5" />} color="bg-blue-500" iconColor="text-blue-600 bg-blue-50" />
        <KPIBox label="Active Hospitals" value={stats.active} icon={<CheckCircle className="w-5 h-5" />} color="bg-emerald-500" iconColor="text-emerald-600 bg-emerald-50" />
        <KPIBox label="Total outstanding (PKR)" value={formatCurrency(stats.outstanding)} icon={<TrendingDown className="w-5 h-5" />} color="bg-red-500" iconColor="text-red-600 bg-red-50" />
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
      <TableCard
        icon={<HospitalIcon />}
        title="All hospitals"
        count={filteredHospitals.length}
        countLabel={(c) => `${c} hospital(s)`}
        contentClassName="overflow-x-auto p-2 sm:p-4"
      >
        <DataTable
          columns={columns}
          data={filteredHospitals}
          isLoading={isLoading}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          itemsPerPage={ITEMS_PER_PAGE}
          emptyMessage="No hospitals found matching your search."
          showSearch={false}
          onRowClick={(h) => navigate(`/hospitals/${h.id}`)}
          resetSortTrigger={refreshTrigger}
          defaultSort={{ id: 'hospitalName', desc: false }}
        />
      </TableCard>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>{selectedHospital ? 'Edit Hospital' : 'Add New Hospital'}</DialogTitle>
            <DialogDescription>
              {selectedHospital ? 'Update hospital details' : 'Enter the details for the new hospital'}
            </DialogDescription>
          </DialogHeader>
          <HospitalForm hospital={selectedHospital || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>

      <EntityBulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Bulk import hospitals"
        description="Upload an Excel file (.xlsx) that matches the template. Valid rows are saved in one transaction; duplicate names or registration numbers are skipped."
        fieldLegend="Required: HospitalName. Optional: contact, address, tax, registration, hospital type, credit terms, credit limit, notes, status."
        onDownloadTemplate={() => hospitalService.downloadImportTemplate()}
        onImport={(f, opts) => hospitalService.bulkImport(f, opts)}
        onImported={() => queryClient.invalidateQueries({ queryKey: ['hospitals'] })}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Hospital"
        description={
          <span>
            This action cannot be undone. This will permanently delete{' '}
            <span className="font-semibold text-foreground">{hospitalToDelete?.hospitalName}</span> from your records.
          </span>
        }
        onConfirm={() => { if (hospitalToDelete) deleteHospital(hospitalToDelete.id); }}
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
