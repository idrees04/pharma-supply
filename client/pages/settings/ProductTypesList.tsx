import { useState, useMemo } from "react";
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
import ProductTypesForm from "./ProductTypesForm";
import { ProductType } from "@/types/api/productTypes";
import {
  useProductTypeList,
  useDeleteProductType,
} from "@/api/services/productTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function ProductTypesList() {
  const { hasPermission } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<
    number | undefined
  >(undefined);

  const canCreate = hasPermission('products', 'create');
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  // Fetch product types
  const {
    data: productTypes = [],
    isPending: isLoadingProductTypes,
    error: productTypesError,
  } = useProductTypeList() as { data: ProductType[] | undefined, isPending: boolean, error: any };

  const [isDeleting, setIsDeleting] = useState(false);
  const deleteProductTypeMutation = useDeleteProductType(
    selectedProductTypeId || 0,
  );

  const handleEdit = (productType: ProductType) => {
    setSelectedProductTypeId(productType.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (productType: ProductType) => {
    if (
      !confirm(`Are you sure you want to delete "${productType.typeName}"?`)
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProductTypeMutation.mutateAsync();
      toast.success("Product type deleted successfully");
      setSelectedProductTypeId(undefined);
    } catch (error: any) {
      const message = error?.userMessage || "Failed to delete product type";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProductTypeId(undefined);
  };

  const handleCreate = () => {
    setSelectedProductTypeId(undefined);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    handleCloseDialog();
    toast.success(
      selectedProductTypeId
        ? "Product type updated successfully"
        : "Product type created successfully",
    );
  };

  // Show error state
  if (productTypesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
            <p className="text-muted-foreground">
              Manage product types and categories
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-900">
            Error Loading Product Types
          </h3>
          <p className="text-red-700">
            {productTypesError.userMessage || "Failed to load product types"}
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
          <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
          <p className="text-muted-foreground">
            Manage product types and categories
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Product Type
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoadingProductTypes && (
        <div className="flex items-center justify-center p-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoadingProductTypes && productTypes.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No product types yet</h3>
          <p className="text-muted-foreground">
            Create your first product type to get started
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoadingProductTypes && productTypes.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type Name</TableHead>
                <TableHead>Type Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Display Order</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="text-right w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {productTypes.map((productType) => (
                <TableRow key={productType.id}>
                  <TableCell className="font-medium">
                    {productType.typeName}
                  </TableCell>
                  <TableCell>{productType.typeCode}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {productType.description}
                  </TableCell>
                  <TableCell>{productType.displayOrder}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={productType.isActive ? "default" : "secondary"}
                      className={cn(
                        "font-medium whitespace-nowrap gap-1.5",
                        productType.isActive
                          ? "bg-sidebar-accent/10 text-sidebar-accent border-sidebar-accent/20 hover:bg-sidebar-accent/20"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        productType.isActive ? "bg-sidebar-accent animate-pulse" : "bg-muted-foreground/50"
                      )} />
                      {productType.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(productType)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(productType)}
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
              {selectedProductTypeId ? "Edit Product Type" : "Add Product Type"}
            </DialogTitle>
            <DialogDescription>
              {selectedProductTypeId
                ? "Update the product type details"
                : "Create a new product type"}
            </DialogDescription>
          </DialogHeader>
          <ProductTypesForm
            productTypeId={selectedProductTypeId}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
