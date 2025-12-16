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
import HospitalForm from './HospitalForm';
import { DataTable } from '@/components/common/DataTable';

export default function HospitalList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<typeof hospitals[0] | null>(null);
  const { hasPermission } = useAuth();
  const hospitals = useStore((state) => state.hospitals);
  const updateHospital = useStore((state) => state.updateHospital);
  const deleteHospital = useStore((state) => state.deleteHospital);

  const canCreate = hasPermission('hospitals', 'create');
  const canUpdate = hasPermission('hospitals', 'update');
  const canDelete = hasPermission('hospitals', 'delete');

  const handleEdit = (hospital: typeof hospitals[0]) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit hospitals');
      return;
    }
    setSelectedHospital(hospital);
    setIsDialogOpen(true);
  };

  const handleDelete = (hospital: typeof hospitals[0]) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete hospitals');
      return;
    }
    if (confirm('Are you sure you want to delete this hospital?')) {
      deleteHospital(hospital.id);
      toast.success('Hospital deleted successfully');
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedHospital(null);
  };

  const columns = [
    { header: 'Hospital Name', accessor: 'name' as const },
    { header: 'Contact Person', accessor: 'contactPerson' as const },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Phone', accessor: 'phone' as const },
    { header: 'City', accessor: 'city' as const },
    { header: 'Country', accessor: 'country' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospitals</h1>
          <p className="text-muted-foreground">Manage hospital customer accounts</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedHospital(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Hospital
          </Button>
        )}
      </div>

      {hospitals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No hospitals yet</h3>
          <p className="text-muted-foreground">Add your first hospital customer to get started</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={hospitals}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          itemsPerPage={10}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedHospital ? 'Edit Hospital' : 'Add New Hospital'}</DialogTitle>
            <DialogDescription>
              {selectedHospital ? 'Update hospital details' : 'Enter the details for the new hospital'}
            </DialogDescription>
          </DialogHeader>
          <HospitalForm hospital={selectedHospital || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
