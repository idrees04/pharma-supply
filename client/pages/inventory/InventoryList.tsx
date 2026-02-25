import { useState } from 'react';
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
import { DataTable } from '@/components/common/DataTable';
import InventoryAdjustmentForm from './InventoryAdjustmentForm';
import { useInventoryStocks } from '@/api/services/inventory';
import { InventoryStockDto } from '@/types/api/inventory';

export default function InventoryList() {
  const { hasPermission } = useAuth();
  const [params, setParams] = useState({ pageNumber: 1, pageSize: 10 });
  const { data, isLoading } = useInventoryStocks(params);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryStockDto | null>(null);

  const canUpdate = hasPermission('inventory', 'update');

  const handleAdjustment = (item: InventoryStockDto) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  const columns = [
    { header: 'Product', accessor: 'productName' },
    {
      header: 'Current Stock',
      accessor: (item: InventoryStockDto) => (
        <div className="font-semibold">{item.totalQuantity}</div>
      ),
    },
    {
      header: 'Reserved',
      accessor: (item: InventoryStockDto) => (
        <div className="text-amber-600">{item.reservedQuantity}</div>
      ),
    },
    {
      header: 'Available',
      accessor: (item: InventoryStockDto) => (
        <div className="text-green-600 font-medium">{item.availableQuantity}</div>
      ),
    },
    { header: 'Last Restock', accessor: (row: InventoryStockDto) => row.lastRestockedDate ? new Date(row.lastRestockedDate).toLocaleDateString() : 'N/A' },
    {
      header: 'Status',
      accessor: (item: InventoryStockDto) => {
        const isLow = item.availableQuantity <= 10; // Assuming 10 as threshold if not in DTO
        const isOut = item.totalQuantity === 0;

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

  const inventoryItems = data?.items || [];
  const lowStockCount = inventoryItems.filter((item) => item.availableQuantity <= 10).length;
  const outOfStockCount = inventoryItems.filter((item) => item.totalQuantity === 0).length;

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
              <p className="text-2xl font-bold">{data?.totalCount || 0}</p>
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

      {isLoading ? (
        <div className="flex items-center justify-center p-8">Loading inventory...</div>
      ) : inventoryItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No inventory items</h3>
          <p className="text-muted-foreground">Inventory data will appear here once products are received</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inventoryItems}
          onEdit={canUpdate ? handleAdjustment : undefined}
          itemsPerPage={params.pageSize}
          totalItems={data?.totalCount}
          onPageChange={(page) => setParams(p => ({ ...p, pageNumber: page }))}
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
