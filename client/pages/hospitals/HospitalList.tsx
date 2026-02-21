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
import { Plus, Edit2, Trash2, Hospital as HospitalIcon, AlertCircle, CheckCircle, TrendingDown, LayoutGrid, List, Search } from 'lucide-react';
import { toast } from 'sonner';
import HospitalForm from './HospitalForm';
import { DataTable, Column } from '@/components/common/DataTable';
import { hospitalService } from '@/api/services/hospitals.service';
import { Hospital } from '@/api/services/hospitals.service';
import { useDeleteHospital, useGetHospitals } from '@/hooks/useHospitals';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HospitalCard } from '@/components/hospitals/HospitalCard';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 10;

export default function HospitalList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete State
  const [hospitalToDelete, setHospitalToDelete] = useState<Hospital | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const canCreate = hasPermission('hospitals', 'create');
  const canUpdate = hasPermission('hospitals', 'update');
  const canDelete = hasPermission('hospitals', 'delete');

  // 1. Fetch data (large batch for client-side ops)
  const { data: hospitalData, isLoading, error: hospitalsError } = useGetHospitals({
    pageSize: 1000,
    pageNumber: 1
  });

  const allHospitals = hospitalData?.data?.items || [];

  // 2. Filter data
  const filteredHospitals = useMemo(() => {
    return allHospitals.filter(h =>
      h.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allHospitals, searchTerm]);

  // Handle URL edit parameter
  useEffect(() => {
    if (editId && allHospitals.length > 0) {
      const hospital = allHospitals.find(h => h.id === parseInt(editId));
      if (hospital) {
        setSelectedHospital(hospital);
        setIsDialogOpen(true);
      }
    }
  }, [editId, allHospitals]);

  // Stats calculation
  const stats = useMemo(() => {
    const totals = {
      total: allHospitals.length,
      active: 0,
      outstanding: 0,
    };

    allHospitals.forEach((h) => {
      if (h.isActive) totals.active++;
      totals.outstanding += h.outstandingBalance || 0;
    });

    return totals;
  }, [allHospitals]);

  // Delete hospital mutation
  const { mutate: deleteHospital, isPending: isDeleting } = useDeleteHospital({
    onSuccess: () => {
      toast.success("Hospital deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      setIsDeleteOpen(false);
      setHospitalToDelete(null);
    },
    onError: (error) => {
      toast.error(error.userMessage || "Failed to delete hospital");
    },
  });

  const handleEdit = (hospital: Hospital) => {
    if (!canUpdate) {
      toast.error("You do not have permission to edit hospitals");
      return;
    }
    setSelectedHospital(hospital);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (hospital: Hospital) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete hospitals");
      return;
    }
    setHospitalToDelete(hospital);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (hospitalToDelete) {
      deleteHospital(hospitalToDelete.id);
    }
  };

  const handleAddClick = () => {
    setSelectedHospital(null);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedHospital(null);
    queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    // Clear the edit parameter from URL
    if (searchParams.has('edit')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('edit');
      setSearchParams(newParams, { replace: true });
    }
  };

  const columns: Column<Hospital>[] = useMemo(() => [
    {
      header: 'Hospital Name',
      accessor: (row: Hospital) => (
        <button
          onClick={() => navigate(`/hospitals/${row.id}`)}
          className="font-medium text-slate-900 hover:text-blue-600 transition-colors text-left"
        >
          {row.hospitalName}
        </button>
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
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'City',
      accessor: 'city',
    },
    {
      header: 'Credit Limit',
      accessor: (row) => (
        <span className="font-medium">
          {formatCurrency(row.creditLimit)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      accessor: (row) => (
        <span className={cn("font-bold", (row.outstandingBalance || 0) > 0 ? "text-red-600" : "text-green-600")}>
          {formatCurrency(row.outstandingBalance)}
        </span>
      ),
    },
  ], [navigate]);

  // Pagination for grid view
  const [gridPage, setGridPage] = useState(0);
  const gridItemsPerPage = 12;
  const gridTotalPages = Math.ceil(filteredHospitals.length / gridItemsPerPage);
  const displayHospitals = filteredHospitals.slice(gridPage * gridItemsPerPage, (gridPage + 1) * gridItemsPerPage);

  if (hospitalsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hospitals</h1>
            <p className="text-muted-foreground">Manage hospital customer accounts</p>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Error loading hospitals</h3>
              <p className="text-sm text-red-700">{(hospitalsError as any).userMessage || 'An error occurred'}</p>
              <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['hospitals'] })} className="mt-2">
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
          <h1 className="text-3xl font-bold tracking-tight">Hospitals</h1>
          <p className="text-muted-foreground">Manage hospital customer accounts</p>
        </div>
        {canCreate && (
          <Button onClick={handleAddClick} disabled={isLoading} className="gap-2 shadow-md">
            <Plus className="w-4 h-4" />
            Add Hospital
          </Button>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIBox
          label="Total Hospitals"
          value={stats.total}
          icon={<HospitalIcon className="w-5 h-5" />}
          color="bg-blue-500"
        />
        <KPIBox
          label="Active Hospitals"
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          color="bg-emerald-500"
        />
        <KPIBox
          label="Total Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="bg-red-500"
        />
      </div>

      {/* Control Bar: Search & View Switcher */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search hospitals by name, contact person or city..."
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
                data={filteredHospitals}
                isLoading={isLoading}
                onEdit={canUpdate ? handleEdit : undefined}
                onDelete={canDelete ? handleDeleteClick : undefined}
                itemsPerPage={ITEMS_PER_PAGE}
                emptyMessage="No hospitals found matching your search."
                showSearch={false}
                onRowClick={(h) => navigate(`/hospitals/${h.id}`)}
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
                    <div key={i} className="h-[250px] bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : filteredHospitals.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayHospitals.map((hospital) => (
                      <HospitalCard
                        key={hospital.id}
                        hospital={hospital}
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
                        <span className="text-foreground">{Math.min((gridPage + 1) * gridItemsPerPage, filteredHospitals.length)}</span> of total {filteredHospitals.length}
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
                  <HospitalIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium text-slate-900">No Hospitals Found</h3>
                  <p className="text-muted-foreground">No hospitals match your criteria.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedHospital ? 'Edit Hospital' : 'Add New Hospital'}</DialogTitle>
            <DialogDescription>
              {selectedHospital ? 'Update hospital details' : 'Enter the details for the new hospital'}
            </DialogDescription>
          </DialogHeader>
          <HospitalForm hospital={selectedHospital || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Are you sure?"
        description={
          <span>
            This action cannot be undone. This will permanently delete
            <span className="font-semibold text-foreground"> {hospitalToDelete?.hospitalName} </span>
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
