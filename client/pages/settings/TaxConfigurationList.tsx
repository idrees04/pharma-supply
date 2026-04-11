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
import TaxConfigurationForm from "./TaxConfigurationForm";
import { 
  useTaxConfigurations, 
  useDeleteTaxConfiguration 
} from "@/api/services/taxConfiguration";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TaxConfiguration } from "@/types/api/taxConfiguration";

export default function TaxConfigurationList() {
  const { hasPermission } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTaxId, setSelectedTaxId] = useState<number | undefined>(
    undefined,
  );

  const canCreate = hasPermission('products', 'create'); // Using products permission for tax settings
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  const {
    data: taxes = [],
    isPending: isLoading,
    error,
  } = useTaxConfigurations();

  const deleteTaxMutation = useDeleteTaxConfiguration();

  const handleEdit = (tax: TaxConfiguration) => {
    setSelectedTaxId(tax.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (tax: TaxConfiguration) => {
    if (!confirm(`Are you sure you want to delete "${tax.taxName}"?`)) {
      return;
    }

    deleteTaxMutation.mutate(tax.id, {
      onSuccess: () => {
        toast.success("Tax configuration deleted successfully");
      },
      onError: (err) => {
        toast.error(err.userMessage || "Failed to delete tax configuration");
      }
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTaxId(undefined);
  };

  const handleCreate = () => {
    setSelectedTaxId(undefined);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    handleCloseDialog();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tax Configuration</h1>
            <p className="text-muted-foreground">Manage taxes and percentages</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-900">
            Error Loading Tax Configurations
          </h3>
          <p className="text-red-700">
            {error.userMessage || "Failed to load tax configurations"}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Configuration</h1>
          <p className="text-muted-foreground">Manage taxes and percentages</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Tax
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && taxes.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No tax configurations yet</h3>
          <p className="text-muted-foreground">
            Create your first tax configuration to apply to transactions
          </p>
        </div>
      )}

      {!isLoading && taxes.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax Name</TableHead>
                <TableHead>Percentage (%)</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="text-right w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium">{tax.taxName}</TableCell>
                  <TableCell>{tax.taxPercentage}%</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={tax.isActive ? "default" : "secondary"}
                      className={cn(
                        "font-medium whitespace-nowrap gap-1.5",
                        tax.isActive
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
                      )}
                    >
                      {tax.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tax)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tax)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>
              {selectedTaxId ? "Edit Tax Configuration" : "Add Tax Configuration"}
            </DialogTitle>
            <DialogDescription>
              {selectedTaxId ? "Update the tax details" : "Create a new tax configuration"}
            </DialogDescription>
          </DialogHeader>
          <TaxConfigurationForm
            taxId={selectedTaxId}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
