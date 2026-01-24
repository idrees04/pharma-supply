import { useState } from "react";
import {
  useGetHospitals,
  useDeleteHospital,
  hospitalKeys,
} from "@/hooks/useHospitals";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import HospitalForm from "./HospitalForm";
import { DataTable } from "@/components/common/DataTable";
import { Hospital } from "@/types/api/hospitals";

export default function HospitalList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null,
  );
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Fetch hospitals list
  const {
    data: hospitalsResponse,
    isPending: isLoadingHospitals,
    error: hospitalsError,
  } = useGetHospitals({
    pageNumber,
    pageSize,
    searchTerm: searchTerm || undefined,
    sortBy: "HospitalName",
    sortDescending: false,
  });

  const hospitals = hospitalsResponse?.data.items || [];
  const totalCount = hospitalsResponse?.data.totalCount || 0;
  const totalPages = hospitalsResponse?.data.totalPages || 0;

  // Delete hospital mutation
  const { mutate: deleteHospital, isPending: isDeleting } = useDeleteHospital({
    onSuccess: () => {
      toast.success("Hospital deleted successfully");
      // Refetch the current page or go back to page 1 if last item was deleted
      if (hospitals.length === 1 && pageNumber > 1) {
        setPageNumber(pageNumber - 1);
      } else {
        queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() });
      }
    },
    onError: (error) => {
      toast.error(error.userMessage || "Failed to delete hospital");
    },
  });

  const canCreate = hasPermission("hospitals", "create");
  const canUpdate = hasPermission("hospitals", "update");
  const canDelete = hasPermission("hospitals", "delete");

  const handleEdit = (hospital: Hospital) => {
    if (!canUpdate) {
      toast.error("You do not have permission to edit hospitals");
      return;
    }
    setSelectedHospital(hospital);
    setIsDialogOpen(true);
  };

  const handleDelete = (hospital: Hospital) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete hospitals");
      return;
    }
    if (confirm("Are you sure you want to delete this hospital?")) {
      deleteHospital(hospital.id);
    }
  };

  const handleAddClick = () => {
    if (!canCreate) {
      toast.error("You do not have permission to create hospitals");
      return;
    }
    setSelectedHospital(null);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedHospital(null);
  };

  const columns = [
    { header: "Hospital Name", accessor: "hospitalName" as const },
    { header: "Contact Person", accessor: "contactPerson" as const },
    { header: "Email", accessor: "email" as const },
    { header: "Phone Number", accessor: "phoneNumber" as const },
    { header: "City", accessor: "city" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospitals</h1>
          <p className="text-muted-foreground">
            Manage hospital customer accounts
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={handleAddClick}
            disabled={isLoadingHospitals}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Hospital
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search hospitals..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPageNumber(1); // Reset to first page on search
          }}
          className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
        />
      </div>

      {/* Error State */}
      {hospitalsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                Error loading hospitals
              </h3>
              <p className="text-sm text-red-700">
                {hospitalsError.userMessage}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  queryClient.refetchQueries({ queryKey: hospitalKeys.lists() })
                }
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingHospitals && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
          <p className="text-muted-foreground">Loading hospitals...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingHospitals && hospitals.length === 0 && !hospitalsError && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No hospitals found</h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Add your first hospital customer to get started"}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoadingHospitals && hospitals.length > 0 && (
        <>
          <DataTable
            columns={columns}
            data={hospitals}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            itemsPerPage={pageSize}
            isLoading={isDeleting}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(pageNumber - 1) * pageSize + 1} to{" "}
              {Math.min(pageNumber * pageSize, totalCount)} of {totalCount}{" "}
              hospitals
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber === 1 || isLoadingHospitals}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Page {pageNumber} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPageNumber(Math.min(totalPages, pageNumber + 1))
                }
                disabled={pageNumber >= totalPages || isLoadingHospitals}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedHospital ? "Edit Hospital" : "Add New Hospital"}
            </DialogTitle>
            <DialogDescription>
              {selectedHospital
                ? "Update hospital details"
                : "Enter the details for the new hospital"}
            </DialogDescription>
          </DialogHeader>
          <HospitalForm
            hospital={selectedHospital || undefined}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
