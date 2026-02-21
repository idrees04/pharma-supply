import { useState, useMemo, useEffect } from 'react';
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
import { Plus, AlertCircle, Package, Pill, Stethoscope, TrendingDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import { cn, formatCurrency } from '@/lib/utils';
import { DataTable, Column } from '@/components/common/DataTable';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { productService } from '@/api/services/products';
import { Product } from '@/types/api/products';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;

export default function ProductList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const canCreate = hasPermission('products', 'create');
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  const { data: productData, isLoading, error: productsError } = useQuery({
    queryKey: ['products', 'list'],
    queryFn: () => productService.getProducts({ pageNumber: 1, pageSize: 1000 })
  });

  const allProducts = productData?.items || [];

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p =>
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allProducts, searchTerm]);

  useEffect(() => {
    if (editId && allProducts.length > 0) {
      const id = parseInt(editId);
      if (!isNaN(id)) {
        setSelectedProductId(id);
        setIsDialogOpen(true);
      }
    }
  }, [editId, allProducts]);

  const stats = useMemo(() => ({
    total: allProducts.length,
    medicines: allProducts.filter(p => p.productTypeName?.toLowerCase().includes('medicine') || p.productTypeName?.toLowerCase().includes('tablet')).length,
    equipment: allProducts.filter(p => p.productTypeName?.toLowerCase().includes('equipment') || p.productTypeName?.toLowerCase().includes('surgical')).length,
    lowStock: allProducts.filter(p => p.availableQuantity <= (p.reorderLevel || 0)).length
  }), [allProducts]);

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
      toast.error(error?.userMessage || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProductId(undefined);
    if (searchParams.has('edit')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('edit');
      setSearchParams(newParams, { replace: true });
    }
  };

  const columns: Column<Product>[] = useMemo(() => [
    {
      header: 'Product Name',
      accessor: (row: Product) => (
        <span className="font-semibold text-slate-900">{row.productName}</span>
      ),
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
      accessor: (row) => (
        <Badge variant="outline" className="text-[10px] font-semibold uppercase bg-slate-50 text-slate-600">
          {row.productTypeName || '—'}
        </Badge>
      ),
    },
    {
      header: 'Unit',
      accessor: 'unitName',
    },
    {
      header: 'Purchase Rate',
      accessor: (row) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.standardPurchaseRate)}</span>
      ),
    },
    {
      header: 'Sale Rate',
      accessor: (row) => (
        <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(row.standardSaleRate)}</span>
      ),
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
            <span className="ml-1.5 text-[9px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Low</span>
          )}
        </div>
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage physical inventory and product catalog</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setSelectedProductId(undefined); setIsDialogOpen(true); }} className="gap-2 shadow-md w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <KPIBox label="Total Products" value={stats.total} icon={<Package className="w-5 h-5" />} iconColor="text-blue-600 bg-blue-50" color="bg-blue-500" />
        <KPIBox label="Medicines" value={stats.medicines} icon={<Pill className="w-5 h-5" />} iconColor="text-green-600 bg-green-50" color="bg-green-500" />
        <KPIBox label="Equipment" value={stats.equipment} icon={<Stethoscope className="w-5 h-5" />} iconColor="text-purple-600 bg-purple-50" color="bg-purple-500" />
        <KPIBox label="Low Stock" value={stats.lowStock} icon={<TrendingDown className="w-5 h-5" />} iconColor="text-red-600 bg-red-50" color="bg-red-500" highlight={stats.lowStock > 0} />
      </div>

      {/* Search Bar */}
      <div className="relative group w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by product name, generic name, or manufacturer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 w-full"
        />
      </div>

      {/* Responsive Table */}
      <div className="w-full overflow-x-auto">
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
      </div>

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

function KPIBox({
  label, value, icon, color, iconColor, highlight
}: {
  label: string; value: string | number; icon: React.ReactNode; color: string; iconColor: string; highlight?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={cn(
        'p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 border-border',
        highlight && 'border-red-100 bg-red-50/20'
      )}>
        <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-[0.04] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`} />
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{label}</p>
            <p className={cn('text-xl font-bold tracking-tight mt-0.5', highlight && 'text-red-600')}>{value}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
