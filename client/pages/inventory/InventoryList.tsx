import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package, TrendingDown, TrendingUp, Calendar, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTable, Column } from '@/components/common/DataTable';
import InventoryAdjustmentForm from './InventoryAdjustmentForm';
import { useInventoryStocks, useExpiringBatches } from '@/api/services/inventory';
import { InventoryStockDto } from '@/types/api/inventory';

export default function InventoryList() {
  const { hasPermission } = useAuth();
  const [params, setParams] = useState({ pageNumber: 1, pageSize: 10 });
  const { data, isLoading } = useInventoryStocks(params);
  const { data: expiringBatches } = useExpiringBatches();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryStockDto | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canUpdate = hasPermission('inventory', 'update');

  const handleAdjustment = (item: InventoryStockDto) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
    if (!selectedItem) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const expiredCount = useMemo(() => {
    if (!expiringBatches) return 0;
    const today = new Date();
    return expiringBatches.filter(batch => {
      if (!batch.expiryDate) return false;
      return new Date(batch.expiryDate) < today && batch.currentQuantity > 0;
    }).length;
  }, [expiringBatches]);

  const columns: Column<InventoryStockDto>[] = [
    { header: 'ID', accessor: 'id', className: 'w-[80px]' },
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
    { header: 'Last Dispatch', accessor: (row: InventoryStockDto) => row.lastDispatchedDate ? new Date(row.lastDispatchedDate).toLocaleDateString() : 'N/A' },

    {
      header: 'Status',
      accessor: (item: InventoryStockDto) => {
        const isLow = item.availableQuantity <= 10;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage stock levels independently</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Active Products</p>
              <p className="text-2xl font-bold">{data?.totalCount || 0}</p>
            </div>
            <Package className="w-8 h-8 text-primary/40" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-600/40" />
          </div>
        </div>
        <div className="bg-card border border-red-100 rounded-lg p-4 shadow-sm bg-red-50/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-muted-foreground text-sm font-medium">Expired Products</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>Total count of products whose expiry date is earlier than today and still have available stock.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
            </div>
            <Calendar className="w-8 h-8 text-red-600/40" />
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
          resetSortTrigger={refreshTrigger}
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
