import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import UnitsForm from "./UnitsForm";
import { Unit } from "@/types/api/units";
import { useUnitList, useDeleteUnit } from "@/api/services/units";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function UnitsList() {
  const { hasPermission } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | undefined>(
    undefined,
  );

  const canCreate = hasPermission('products', 'create');
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  // Fetch units
  const {
    data: units = [],
    isPending: isLoadingUnits,
    error: unitsError,
  } = useUnitList() as { data: Unit[] | undefined, isPending: boolean, error: any };

  const [isDeleting, setIsDeleting] = useState(false);
  const deleteUnitMutation = useDeleteUnit(selectedUnitId || 0);

  const handleEdit = (unit: Unit) => {
    setSelectedUnitId(unit.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (unit: Unit) => {
    if (!confirm(`Are you sure you want to delete "${unit.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUnitMutation.mutateAsync();
      toast.success("Unit deleted successfully");
      setSelectedUnitId(undefined);
    } catch (error: any) {
      const message = error?.userMessage || "Failed to delete unit";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUnitId(undefined);
  };

  const handleCreate = () => {
    setSelectedUnitId(undefined);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    handleCloseDialog();
    toast.success(
      selectedUnitId
        ? "Unit updated successfully"
        : "Unit created successfully",
    );
  };

  // Show error state
  if (unitsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Units</h1>
            <p className="text-muted-foreground">Manage measurement units</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-900">
            Error Loading Units
          </h3>
          <p className="text-red-700">
            {unitsError.userMessage || "Failed to load units"}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Units</h1>
          <p className="text-muted-foreground">Manage measurement units</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Unit
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoadingUnits && (
        <div className="flex items-center justify-center p-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoadingUnits && units.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No units yet</h3>
          <p className="text-muted-foreground">
            Create your first unit to get started
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoadingUnits && units.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Quantity</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="text-right w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.quantity}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={unit.isActive ? "default" : "secondary"}
                      className={cn(
                        "font-medium whitespace-nowrap gap-1.5",
                        unit.isActive
                          ? "bg-sidebar-accent/10 text-sidebar-accent border-sidebar-accent/20 hover:bg-sidebar-accent/20"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        unit.isActive ? "bg-sidebar-accent animate-pulse" : "bg-muted-foreground/50"
                      )} />
                      {unit.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(unit)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(unit)}
                            disabled={isDeleting}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isDeleting ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUnitId ? "Edit Unit" : "Add Unit"}
            </DialogTitle>
            <DialogDescription>
              {selectedUnitId ? "Update the unit details" : "Create a new unit"}
            </DialogDescription>
          </DialogHeader>
          <UnitsForm
            unitId={selectedUnitId}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
