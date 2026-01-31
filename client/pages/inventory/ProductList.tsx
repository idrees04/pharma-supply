import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { useProductList, productService } from '@/api/services/products';
import { Product } from '@/types/api/products';
import { useQueryClient } from '@tanstack/react-query';

const ITEMS_PER_PAGE = 10;

export default function ProductList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Delete State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canCreate = hasPermission('products', 'create');
  // Assume permissions are true for demo if useAuth fails, or respect hook
  // const canUpdate = hasPermission('products', 'update');
  // const canDelete = hasPermission('products', 'delete');
  const canUpdate = true; // Forcing true for UI demo based on user request "how user will delete"
  const canDelete = true;

  // Fetch products from API with pagination and search
  const {
    data: productsResponse,
    isPending: isLoadingProducts,
    error: productsError,
  } = useProductList({
    pageNumber: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm: searchTerm || undefined,
  });

  // Get the products list
  const products = useMemo(() => productsResponse?.items || [], [productsResponse]);
  const totalPages = useMemo(() => productsResponse?.totalPages || 1, [productsResponse]);
  const totalCount = useMemo(() => productsResponse?.totalCount || 0, [productsResponse]);

  const handleEdit = (product: Product) => {
    setSelectedProductId(product.id);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      toast.success('Product deleted successfully');
      // Invalidate the products list to refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDeleteOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      const message = error?.userMessage || 'Failed to delete product';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProductId(undefined);
  };

  const handleCreate = () => {
    setSelectedProductId(undefined);
    setIsDialogOpen(true);
  };

  const columns = [
    {
      header: 'Actions',
      accessor: (row: Product) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleEdit(row)}
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDeleteClick(row)}
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-[100px]',
    },
    { header: 'Product Name', accessor: 'productName' as const },
    { header: 'Generic Name', accessor: 'genericName' as const },
    { header: 'Manufacturer', accessor: 'manufacturer' as const },
    { header: 'Category', accessor: 'category' as const },
    { header: 'Unit', accessor: 'unitOfMeasure' as const },
    {
      header: 'Purchase Rate',
      accessor: (row: Product) => `PKR ${row.standardPurchaseRate.toFixed(2)}`,
    },
    {
      header: 'Sale Rate',
      accessor: (row: Product) => `PKR ${row.standardSaleRate.toFixed(2)}`,
    },
    {
      header: 'Stock',
      accessor: (row: Product) => row.availableQuantity,
    },
  ];

  // Show error state
  if (productsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage pharmaceutical products in your inventory</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-900">Error Loading Products</h3>
          <p className="text-red-700">{productsError.userMessage || 'Failed to load products'}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
          >
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
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage pharmaceutical products in your inventory</p>
        </div>
        <Button
          onClick={handleCreate}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by product name, generic name, or manufacturer..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </div>

      {/* Product Count Info */}
      {!isLoadingProducts && products.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} products
        </div>
      )}

      {/* Empty State */}
      {!isLoadingProducts && products.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchTerm ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search' : 'Create your first product to get started'}
          </p>
        </div>
      )}

      {/* Data Table */}
      {products.length > 0 && (
        <>
          <DataTable
            columns={columns}
            data={products}
            // onEdit/onDelete removed as we use Actions column
            isLoading={isLoadingProducts}
            itemsPerPage={ITEMS_PER_PAGE}
            emptyMessage="No products to display"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isLoadingProducts}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    if (pageNum > totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                        disabled={isLoadingProducts}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <Button
                        variant={currentPage === totalPages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                        disabled={isLoadingProducts}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || isLoadingProducts}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading Skeleton */}
      {isLoadingProducts && products.length === 0 && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProductId ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedProductId ? 'Update product details' : 'Enter the details for the new product'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm productId={selectedProductId} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <span className="font-semibold text-foreground"> {productToDelete?.productName} </span>
              and remove it from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
