import { useState, useMemo, useCallback, useEffect, memo } from 'react';
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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Plus,
  AlertCircle,
  Package,
  Pill,
  Stethoscope,
  TrendingDown,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import { cn, formatCurrency } from '@/lib/utils';
import { DataTable, Column } from '@/components/common/DataTable';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { productService } from '@/api/services/products';
import { Product } from '@/types/api/products';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

// ----------------------------------------------------------------------
// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

// ----------------------------------------------------------------------
// KPI Cards Component
const StatsCards = memo(function StatsCards({ stats }: { stats: ReturnType<typeof useStats> }) {
  const items = [
    { label: 'Total Products', value: stats.total, icon: Package, color: 'text-blue-600 bg-blue-50', bg: 'bg-blue-500' },
    { label: 'Medicines', value: stats.medicines, icon: Pill, color: 'text-green-600 bg-green-50', bg: 'bg-green-500' },
    { label: 'Equipment', value: stats.equipment, icon: Stethoscope, color: 'text-purple-600 bg-purple-50', bg: 'bg-purple-500' },
    { label: 'Low Stock', value: stats.lowStock, icon: TrendingDown, color: 'text-red-600 bg-red-50', bg: 'bg-red-500', highlight: stats.lowStock > 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <Card className={cn(
            'p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 border-border',
            item.highlight && 'border-red-100 bg-red-50/20'
          )}>
            <div className={`absolute top-0 right-0 w-20 h-20 ${item.bg} opacity-[0.04] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`} />
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{item.label}</p>
                <p className={cn('text-xl font-bold tracking-tight mt-0.5', item.highlight && 'text-red-600')}>
                  {item.value}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
});

// ----------------------------------------------------------------------
// Helper to compute stats
function useStats(products: Product[]) {
  return useMemo(() => ({
    total: products.length,
    medicines: products.filter(p =>
      p.productTypeName?.toLowerCase().includes('medicine') ||
      p.productTypeName?.toLowerCase().includes('tablet')
    ).length,
    equipment: products.filter(p =>
      p.productTypeName?.toLowerCase().includes('equipment') ||
      p.productTypeName?.toLowerCase().includes('surgical')
    ).length,
    lowStock: products.filter(p => p.availableQuantity <= (p.reorderLevel || 0)).length,
  }), [products]);
}

// ----------------------------------------------------------------------
// Main Component
export default function ProductList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'inactive'>('all');

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_DELAY);

  const canCreate = hasPermission('products', 'create');
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  // Fetch products
  const { data: productData, isLoading, error: productsError } = useQuery({
    queryKey: ['products', 'list'],
    queryFn: () => productService.getProducts({ pageNumber: 1, pageSize: 1000 }),
    // Consider adding staleTime if data doesn't change often
  });

  const allProducts = productData?.items || [];

  // Filters
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(lower) ||
        p.genericName?.toLowerCase().includes(lower) ||
        p.manufacturer?.toLowerCase().includes(lower)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(p => p.productTypeName === typeFilter);
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(p => p.availableQuantity <= (p.reorderLevel || 0));
    } else if (stockFilter === 'inactive') {
      filtered = filtered.filter(p => !p.isActive);
    }

    return filtered;
  }, [allProducts, debouncedSearch, typeFilter, stockFilter]);

  const stats = useStats(allProducts);

  // Handle edit from URL
  useEffect(() => {
    if (editId && allProducts.length > 0) {
      const id = parseInt(editId);
      if (!isNaN(id)) {
        setSelectedProductId(id);
        setIsDialogOpen(true);
      }
    }
  }, [editId, allProducts]);

  // Callbacks
  const handleEdit = useCallback((product: Product) => {
    setSelectedProductId(product.id);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((product: Product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDeleteOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast.error(error?.userMessage || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  }, [productToDelete, queryClient]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedProductId(undefined);
    if (searchParams.has('edit')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('edit');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Table columns (dense)
  const columns: Column<Product>[] = useMemo(() => [
    {
      header: 'ID',
      accessor: 'id',
      className: 'w-16 text-muted-foreground',
    },
    {
      header: 'Product',
      accessor: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.productName}</div>
          <div className="text-xs text-muted-foreground">{row.genericName}</div>
        </div>
      ),
    },
    {
      header: 'Manufacturer',
      accessor: 'manufacturer',
    },
    {
      header: 'Type',
      accessor: (row) => (
        <Badge variant="outline" className="text-[10px] font-semibold bg-slate-50">
          {row.productTypeName || '—'}
        </Badge>
      ),
    },
    {
      header: 'Unit',
      accessor: 'unitName',
      className: 'text-center',
    },
    {
      header: 'Purchase',
      accessor: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.standardPurchaseRate)}</span>
      ),
      align: 'right',
    },
    {
      header: 'Sale',
      accessor: (row) => (
        <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(row.standardSaleRate)}</span>
      ),
      align: 'right',
    },
    {
      header: 'Tax %',
      accessor: (row) => (
        <Badge variant={row.taxPercentage > 18 ? 'destructive' : 'secondary'} className="tabular-nums">
          {row.taxPercentage}%
        </Badge>
      ),
      align: 'right',
    },
    {
      header: 'Stock',
      accessor: (row) => (
        <div className={cn(
          'font-bold tabular-nums',
          row.availableQuantity <= (row.reorderLevel || 0) ? 'text-red-600' : 'text-slate-800'
        )}>
          {row.availableQuantity}
          {row.availableQuantity <= (row.reorderLevel || 0) && (
            <Badge variant="destructive" className="ml-2 text-[9px] px-1 py-0">Low</Badge>
          )}
        </div>
      ),
      align: 'right',
    },
    {
      header: 'Reorder',
      accessor: (row) => (
        <span className="tabular-nums text-sm">{row.reorderLevel} / {row.reorderQuantity}</span>
      ),
      align: 'right',
    },
    {
      header: 'Batch',
      accessor: (row) => row.isBatchRequired ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-slate-300" />,
      align: 'center',
    },
    {
      header: 'HSN',
      accessor: (row) => (
        <span className="text-xs font-mono" title={row.hsnCode}>
          {row.hsnCode?.substring(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.isActive ? 'secondary' : 'destructive'} className="text-[10px]">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ], []);

  if (productsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-900">Error Loading Products</h3>
          <p className="text-red-700 text-sm mt-1">{(productsError as any)?.userMessage || 'Failed to load products'}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })} className="mt-4" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage physical inventory and product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={() => { setSelectedProductId(undefined); setIsDialogOpen(true); }} className="gap-2 shadow-md">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <StatsCards stats={stats} />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, generic, or manufacturer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 h-10 w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={typeFilter === null ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(null)}
          >
            All
          </Button>
          <Button
            variant={typeFilter === 'Medicine' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('Medicine')}
          >
            Medicine
          </Button>
          <Button
            variant={typeFilter === 'Equipment' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('Equipment')}
          >
            Equipment
          </Button>
          <Button
            variant={stockFilter === 'low' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          >
            Low Stock
          </Button>
          <Button
            variant={stockFilter === 'inactive' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setStockFilter(stockFilter === 'inactive' ? 'all' : 'inactive')}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key="table"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full overflow-x-auto"
        >
          <DataTable
            columns={columns}
            data={filteredProducts}
            isLoading={isLoading}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDeleteClick : undefined}
            itemsPerPage={ITEMS_PER_PAGE}
            emptyMessage="No products found."
            showSearch={false}
            onRowClick={(p) => navigate(`/inventory/products/${p.id}`)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dialogs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 rounded-3xl p-0 border-none shadow-2xl bg-gradient-to-b from-white to-slate-50">
          <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl p-8 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold tracking-tight">
                {selectedProductId ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription className="text-base">
                Fill in all product details accurately before saving.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8">
            <ProductForm productId={selectedProductId} onClose={handleCloseDialog} />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Product"
        description={
          <div className="space-y-4 pt-2">
            <p className="text-slate-600">
              You are about to permanently delete{' '}
              <span className="font-bold text-slate-900">{productToDelete?.productName}</span> from the system.
            </p>
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>This action cannot be undone and will remove all related inventory records.</p>
            </div>
          </div>
        }
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmText="Delete Product"
        variant="destructive"
      />
    </div>
  );
}