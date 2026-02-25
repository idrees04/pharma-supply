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
import ExpenseCategoryForm from "./ExpenseCategoryForm";
import { 
  useExpenseCategories, 
  useDeleteExpenseCategory 
} from "@/api/services/expenseCategories";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ExpenseCategory } from "@/types/api/expenseCategories";

export default function ExpenseCategoriesList() {
  const { hasPermission } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    undefined,
  );

  const canCreate = hasPermission('expenses', 'create');
  const canUpdate = hasPermission('expenses', 'update');
  const canDelete = hasPermission('expenses', 'delete');

  const {
    data: categories = [],
    isPending: isLoading,
    error,
  } = useExpenseCategories();

  const deleteCategoryMutation = useDeleteExpenseCategory();

  const handleEdit = (category: ExpenseCategory) => {
    setSelectedCategoryId(category.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (category: ExpenseCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.categoryName}"?`)) {
      return;
    }

    deleteCategoryMutation.mutate(category.id, {
      onSuccess: () => {
        toast.success("Category deleted successfully");
      },
      onError: (err) => {
        toast.error(err.userMessage || "Failed to delete category");
      }
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCategoryId(undefined);
  };

  const handleCreate = () => {
    setSelectedCategoryId(undefined);
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
            <h1 className="text-3xl font-bold tracking-tight">Expense Categories</h1>
            <p className="text-muted-foreground">Manage categories for daily expenses</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-900">
            Error Loading Categories
          </h3>
          <p className="text-red-700">
            {error.userMessage || "Failed to load categories"}
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
          <h1 className="text-3xl font-bold tracking-tight">Expense Categories</h1>
          <p className="text-muted-foreground">Manage categories for daily expenses</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No categories yet</h3>
          <p className="text-muted-foreground">
            Create your first category to organize expenses
          </p>
        </div>
      )}

      {!isLoading && categories.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                {(canUpdate || canDelete) && <TableHead className="text-right w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.categoryName}</TableCell>
                  <TableCell>{cat.categoryCode || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={cat.isActive ? "default" : "secondary"}
                      className={cn(
                        "font-medium whitespace-nowrap gap-1.5",
                        cat.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
                      )}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cat)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cat)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCategoryId ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategoryId ? "Update the category details" : "Create a new expense category"}
            </DialogDescription>
          </DialogHeader>
          <ExpenseCategoryForm
            categoryId={selectedCategoryId}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
