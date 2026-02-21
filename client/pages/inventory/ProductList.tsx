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
import { Plus, Edit2, Trash2, AlertCircle, Package, Pill, Stethoscope, TrendingDown, List, LayoutGrid, Search } from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import { cn, formatCurrency } from '@/lib/utils';
import { DataTable, Column } from '@/components/common/DataTable';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { productService } from '@/api/services/products';
import { Product } from '@/types/api/products';
import { ProductCard } from '@/components/inventory/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 10;

export default function ProductList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canCreate = hasPermission('products', 'create');
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  // 1. Fetch products (large batch for client-side ops)
  const { data: productData, isLoading, error: productsError } = useQuery({
    queryKey: ['products', 'list'],
    queryFn: () => productService.getProducts({ pageNumber: 1, pageSize: 1000 })
  });

  const allProducts = productData?.items || [];
  const totalCount = productData?.totalCount || 0;

  // 2. Filter products
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p =>
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allProducts, searchTerm]);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: allProducts.length,
      medicines: allProducts.filter(p => p.productTypeName?.toLowerCase().includes('medicine') || p.productTypeName?.toLowerCase().includes('tablet')).length,
      equipment: allProducts.filter(p => p.productTypeName?.toLowerCase().includes('equipment') || p.productTypeName?.toLowerCase().includes('surgical')).length,
      lowStock: allProducts.filter(p => p.availableQuantity <= (p.reorderLevel || 0)).length
    };
  }, [allProducts]);

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

  const columns: Column<Product>[] = useMemo(() => [
    {
      header: 'Product Name',
      accessor: 'productName',
    },
    {
      header: 'Generic Name',
      accessor: 'genericName',
    },
    {
      header: 'Manufacturer',
      accessor: 'manufacturer',
    },
    {
      header: 'Type',
      accessor: 'productTypeName',
    },
    {
      header: 'Unit',
      accessor: 'unitName',
    },
    {
      header: 'Purchase Rate',
      accessor: (row) => formatCurrency(row.standardPurchaseRate),
    },
    {
      header: 'Sale Rate',
      accessor: (row) => (
        <span className="font-bold text-green-600">{formatCurrency(row.standardSaleRate)}</span>
      ),
    },
    {
      header: 'Stock',
      accessor: (row) => (
        <div className={cn(
          "font-bold",
          row.availableQuantity <= (row.reorderLevel || 0) ? "text-red-600" : ""
        )}>
          {row.availableQuantity}
        </div>
      ),
    },
  ], []);

  // Pagination for grid view (basic implementation)
  const [gridPage, setGridPage] = useState(0);
  const gridItemsPerPage = 12;
  const gridTotalPages = Math.ceil(filteredProducts.length / gridItemsPerPage);
  const displayProducts = filteredProducts.slice(gridPage * gridItemsPerPage, (gridPage + 1) * gridItemsPerPage);

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
          <p className="text-red-700">{(productsError as any)?.userMessage || 'Failed to load products'}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })} className="mt-4">
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
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search products by name, generic name or manufacturer..."
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
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              <DataTable
                columns={columns}
                data={filteredProducts}
                isLoading={isLoading}
                onEdit={canUpdate ? handleEdit : undefined}
                onDelete={canDelete ? handleDeleteClick : undefined}
                itemsPerPage={ITEMS_PER_PAGE}
                emptyMessage="No products found matching your search."
              />
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-[300px] bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayProducts.map((product) => (
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

                  {gridTotalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t font-medium">
                      <div className="text-sm text-muted-foreground">
                        Displaying <span className="text-foreground">{gridPage * gridItemsPerPage + 1}</span> - {' '}
                        <span className="text-foreground">{Math.min((gridPage + 1) * gridItemsPerPage, filteredProducts.length)}</span> of total {filteredProducts.length}
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
