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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, AlertCircle, Search, LayoutGrid, List, Package, Pill, Stethoscope, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { useProductList, productService } from '@/api/services/products';
import { Product } from '@/types/api/products';
import { useQueryClient } from '@tanstack/react-query';
import { ProductCard } from '@/components/inventory/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatCurrency } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

export default function ProductList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Delete State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canCreate = hasPermission('products', 'create');
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  // Fetch products from API with pagination and search
  const {
    data: productsResponse,
    isPending: isLoadingProducts,
    error: productsError,
  } = useProductList({
    pageNumber: currentPage,
    pageSize: viewMode === 'table' ? ITEMS_PER_PAGE : 12, // More items for grid
    searchTerm: searchTerm || undefined,
  });

  // Get the products list
  const products = useMemo(() => productsResponse?.items || [], [productsResponse]);
  const totalPages = useMemo(() => productsResponse?.totalPages || 1, [productsResponse]);
  const totalCount = useMemo(() => productsResponse?.totalCount || 0, [productsResponse]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!productsResponse) return { total: 0, medicines: 0, equipment: 0, lowStock: 0 };

    // Note: In a real app, these stats should probably come from a separate API endpoint 
    // or calculated from a full list. For now, we'll use what's available or mock logic.
    // Assuming productTypeName helps distinguish
    return {
      total: totalCount,
      medicines: products.filter(p => p.productTypeName?.toLowerCase().includes('medicine') || p.productTypeName?.toLowerCase().includes('tablet')).length,
      equipment: products.filter(p => p.productTypeName?.toLowerCase().includes('equipment') || p.productTypeName?.toLowerCase().includes('surgical')).length,
      lowStock: products.filter(p => p.availableQuantity <= p.reorderLevel).length
    };
  }, [productsResponse, products, totalCount]);

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
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => handleEdit(row)}
              title="Edit Product"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDeleteClick(row)}
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      className: 'w-[100px]',
    },
    { header: 'Product Name', accessor: 'productName' as const },
    { header: 'Generic Name', accessor: 'genericName' as const },
    { header: 'Manufacturer', accessor: 'manufacturer' as const },
    { header: 'Type', accessor: 'productTypeName' as const },
    { header: 'Unit', accessor: (row: Product) => `${row.unitName}` },
    {
      header: 'Purchase Rate',
      accessor: (row: Product) => formatCurrency(row.standardPurchaseRate),
    },
    {
      header: 'Sale Rate',
      accessor: (row: Product) => (
        <span className="font-bold text-green-600">{formatCurrency(row.standardSaleRate)}</span>
      ),
    },
    {
      header: 'Stock',
      accessor: (row: Product) => (
        <div className={cn(
          "font-bold",
          row.availableQuantity <= row.reorderLevel ? "text-red-600" : ""
        )}>
          {row.availableQuantity}
        </div>
      ),
    },
  ];

  // Show error state
  if (productsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-900">Error Loading Products</h3>
          <p className="text-red-700">{productsError.userMessage || 'Failed to load products'}</p>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground italic line-clamp-1">Manage physical inventory and product catalog</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate} className="gap-2 shadow-md">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Products</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Pill className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Medicines</p>
              <p className="text-xl font-bold">{stats.medicines}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Stethoscope className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Equipment</p>
              <p className="text-xl font-bold">{stats.equipment}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-red-100 bg-red-50/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Low Stock</p>
              <p className="text-xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar: Search & View Switcher */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, generic, or manufacturer..."
            className="pl-10 h-10 border-muted focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
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

      {/* Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {!isLoadingProducts && products.length === 0 ? (
                <div className="rounded-lg border border-dashed p-20 text-center bg-muted/20">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <h3 className="mt-4 text-lg font-semibold">No products found</h3>
                  <p className="text-muted-foreground italic">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={products}
                  isLoading={isLoadingProducts}
                  itemsPerPage={ITEMS_PER_PAGE}
                  emptyMessage="No products to display"
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isLoadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-[300px] bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-muted bg-muted/5">
                  <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold">No results found</h3>
                  <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2 text-blue-600">
                    Clear current search
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Footer */}
      {!isLoadingProducts && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t font-medium">
          <div className="text-sm text-muted-foreground">
            Displaying <span className="text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - {' '}
            <span className="text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of total {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg h-9"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 text-xs transition-all duration-200",
                      currentPage === pageNum ? "shadow-md" : ""
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg h-9"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl bg-gradient-to-b from-white to-slate-50">
          <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl p-8 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold tracking-tight">
                {selectedProductId ? 'Modify Product Information' : 'Catalogue New Product'}
              </DialogTitle>
              <DialogDescription className="text-base">
                Ensure all mandatory pharmaceutical indices are correctly logged.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8">
            <ProductForm productId={selectedProductId} onClose={handleCloseDialog} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Deletion confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Authorize Deletion"
        description={
          <div className="space-y-4 pt-2">
            <p className="text-slate-600">
              You are about to remove <span className="font-bold text-slate-900">{productToDelete?.productName}</span> from the system records.
            </p>
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>This entry will be wiped from all inventory lists and cannot be recovered.</p>
            </div>
          </div>
        }
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmText="Confirm Deletion"
        variant="destructive"
      />
    </div>
  );
}
