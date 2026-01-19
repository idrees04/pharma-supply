import { useState } from 'react';
import { Product, useStore } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import { DataTable } from '@/components/common/DataTable';

export default function ProductList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { hasPermission } = useAuth();
  const products = useStore((state) => state.products);
  const updateProduct = useStore((state) => state.updateProduct);
  const deleteProduct = useStore((state) => state.deleteProduct);

  const canCreate = hasPermission('products', 'create');
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  const handleEdit = (product: typeof products[0]) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit products');
      return;
    }
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = (product: typeof products[0]) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete products');
      return;
    }
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(product.id);
      toast.success('Product deleted successfully');
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
  };

  const columns = [
    { header: 'Generic Name', accessor: 'genericName' as const },
    { header: 'Brand Name', accessor: 'brandName' as const },
    { header: 'Manufacturer', accessor: 'manufacturer' as const },
    { header: 'Strength', accessor: 'strength' as const },
    { header: 'Pack Size', accessor: 'packSize' as const },
    { header: 'GST %', accessor: 'gstRate' as const },
    { header: 'Min Stock', accessor: 'minimumStock' as const },
    { header: 'Max Stock', accessor: 'maximumStock' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage pharmaceutical products in your inventory</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
          <p className="text-muted-foreground">Create your first product to get started</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          itemsPerPage={10}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update product details' : 'Enter the details for the new product'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm product={selectedProduct || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
