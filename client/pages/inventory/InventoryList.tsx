import { useEffect, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import InventoryAdjustmentForm from './InventoryAdjustmentForm';

export default function InventoryList() {
  const { hasPermission } = useAuth();
  const products = useStore((state) => state.products);
  const inventoryItems = useStore((state) => state.inventoryItems);
  const updateInventoryItem = useStore((state) => state.updateInventoryItem);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof inventoryItems[0] | null>(null);

  const canUpdate = hasPermission('inventory', 'update');

  useEffect(() => {
    const productsWithoutInventory = products.filter(
      (p) => !inventoryItems.find((i) => i.productId === p.id)
    );

    productsWithoutInventory.forEach((product) => {
      const newInventory = {
        id: Math.random().toString(36).substring(2, 11),
        productId: product.id,
        productName: product.brandName,
        currentStock: 0,
        reservedStock: 0,
        availableStock: 0,
        lastRestockDate: new Date().toISOString().split('T')[0],
        lastRestockQuantity: 0,
        createdAt: new Date().toISOString(),
      };
      useStore.getState().inventoryItems.push(newInventory);
    });
  }, [products, inventoryItems]);

  const handleAdjustment = (item: typeof inventoryItems[0]) => {
    if (!canUpdate) {
      toast.error('You do not have permission to adjust inventory');
      return;
    }
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  const getLowStockItems = () => {
    const product = products.find((p) => p.id === selectedItem?.productId);
    if (!product) return [];
    return inventoryItems.filter((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return prod && item.currentStock <= prod.reorderPoint;
    });
  };

  const columns = [
    { header: 'Product', accessor: 'productName' as const },
    {
      header: 'Current Stock',
      accessor: (item: typeof inventoryItems[0]) => (
        <div className="font-semibold">{item.currentStock}</div>
      ),
    },
    {
      header: 'Reserved',
      accessor: (item: typeof inventoryItems[0]) => (
        <div className="text-amber-600">{item.reservedStock}</div>
      ),
    },
    {
      header: 'Available',
      accessor: (item: typeof inventoryItems[0]) => (
        <div className="text-green-600 font-medium">{item.availableStock}</div>
      ),
    },
    { header: 'Last Restock', accessor: 'lastRestockDate' as const },
    {
      header: 'Status',
      accessor: (item: typeof inventoryItems[0]) => {
        const product = products.find((p) => p.id === item.productId);
        const isLow = product && item.currentStock <= product.reorderPoint;
        const isOut = item.currentStock === 0;

        if (isOut) {
          return <span className="inline-flex items-center gap-1 text-red-600"><TrendingDown className="w-4 h-4" /> Out of Stock</span>;
        }
        if (isLow) {
          return <span className="inline-flex items-center gap-1 text-amber-600"><TrendingUp className="w-4 h-4" /> Low Stock</span>;
        }
        return <span className="text-green-600">In Stock</span>;
      },
    },
  ];

  const lowStockCount = inventoryItems.filter((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product && item.currentStock <= product.reorderPoint;
  }).length;

  const outOfStockCount = inventoryItems.filter((item) => item.currentStock === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage stock levels independently</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Products</p>
              <p className="text-2xl font-bold">{inventoryItems.length}</p>
            </div>
            <Package className="w-8 h-8 text-primary/50" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-600/50" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600/50" />
          </div>
        </div>
      </div>

      {inventoryItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No inventory items</h3>
          <p className="text-muted-foreground">Add products first to track inventory</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inventoryItems}
          onEdit={canUpdate ? handleAdjustment : undefined}
          itemsPerPage={10}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory Adjustment</DialogTitle>
            <DialogDescription>
              Adjust stock levels for {selectedItem?.productName}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <InventoryAdjustmentForm
              inventoryItem={selectedItem}
              onClose={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
