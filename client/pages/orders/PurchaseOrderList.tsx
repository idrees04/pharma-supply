import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus, Filter, FileText, CheckCircle, Clock, XCircle, DollarSign, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PurchaseOrder } from '@/types/api/purchaseOrders';
import { purchaseOrderService, usePurchaseOrderStatuses, useDeletePurchaseOrder, usePurchaseOrderList } from '@/api/services/purchaseOrders';
import { formatCurrency } from '@/lib/utils';

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 1. Fetch data
  const { data: poData, isLoading } = usePurchaseOrderList({
    pageSize: 1000,
    pageNumber: 1
  });
  const allPOs = poData?.items || [];

  // 2. Fetch statuses for filter
  const { data: statuses = [] } = usePurchaseOrderStatuses();

  // 3. Filter data
  const filteredPOs = useMemo(() => {
    return allPOs.filter((po) => {
      const matchesStatus = statusFilter === 'all' || po.status.toString() === statusFilter;
      const matchesSearch =
        po.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [allPOs, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const totals = {
      count: allPOs.length,
      amount: 0,
      cash: 0,
      credit: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      receivedAmount: 0,
      remainingAmount: 0,
    };

    allPOs.forEach((po) => {
      totals.amount += po.totalAmount || 0;
      if (po.paymentMethod === 'Cash') totals.cash++;
      else totals.credit++;

      if (po.status === 1) totals.pending++;
      else if (po.status === 2) totals.confirmed++;
      else if (po.status === 3) totals.completed++;
      else if (po.status === 4) totals.cancelled++;

      po.items?.forEach((item) => {
        totals.receivedAmount += (item.receivedQuantity || 0) * (item.unitPrice || 0);
        totals.remainingAmount += (item.remainingQuantity || 0) * (item.unitPrice || 0);
      });
    });

    return totals;
  }, [allPOs]);

  // 4. Mutations
  const { mutate: deletePO, isPending: isDeleting } = useDeletePurchaseOrder();

  const handleDelete = async () => {
    if (!poToDelete) return;
    deletePO(poToDelete.id, {
      onSuccess: () => {
        toast.success('Purchase order deleted successfully');
        setIsDeleteDialogOpen(false);
        setPoToDelete(null);
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      },
      onError: (error: any) => {
        toast.error(error?.userMessage || 'Failed to delete purchase order');
      },
    });
  };

  // 5. Define Columns
  const columns: Column<PurchaseOrder>[] = useMemo(() => [
    {
      header: 'ID',
      accessor: 'id',

    },
    {
      header: 'PO Number',
      accessor: (row) => (
        <span className="font-black text-primary tracking-tight">{row.purchaseOrderNumber}</span>
      ),
    },
    {
      header: 'Supplier',
      accessor: 'supplierName',
    },
    {
      header: 'Order Date',
      accessor: (row) => new Date(row.orderDate).toLocaleDateString(),
      mobileHidden: true,
    },
    {
      header: 'Expected Delivery',
      accessor: (row) => new Date(row.expectedDeliveryDate).toLocaleDateString(),
      mobileHidden: true,
    },
    {
      header: 'Total Amount',
      accessor: (row) => formatCurrency(row.totalAmount),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const statusName = statuses.find(s => s.value === row.status)?.name || `Status ${row.status}`;

        let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'outline';
        if (row.status === 1) variant = 'secondary';
        if (row.status === 2) variant = 'default';
        if (row.status === 3) variant = 'outline';

        return <Badge variant={variant}>{statusName}</Badge>;
      },
    },
  ], [statuses]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage and track your supplier purchase orders</p>
        </div>
        <Button onClick={() => navigate('/orders/purchase/create')} className="gap-2 shadow-md">
          <Plus className="h-4 w-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPIBox label="Total POs" value={stats.count} icon={<FileText className="w-5 h-5" />} color="bg-blue-500" />
        <KPIBox label="Total Amount" value={formatCurrency(stats.amount)} icon={<DollarSign className="w-5 h-5" />} color="bg-green-500" />
        <KPIBox label="Pending / Confirmed" value={`${stats.pending} / ${stats.confirmed}`} icon={<Clock className="w-5 h-5" />} color="bg-amber-500" />
        <KPIBox label="Completed" value={stats.completed} icon={<CheckCircle className="w-5 h-5" />} color="bg-emerald-500" />
        <KPIBox label="Cancelled" value={stats.cancelled} icon={<XCircle className="w-5 h-5" />} color="bg-red-500" />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by PO number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value.toString()}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredPOs}
          isLoading={isLoading}
          onDelete={(row) => {
            setPoToDelete(row);
            setIsDeleteDialogOpen(true);
          }}
          itemsPerPage={10}
          emptyMessage="No purchase orders found."
          showSearch={false}
          onRowClick={(row) => navigate(`/orders/purchase/view/${row.id}`)}
          resetSortTrigger={refreshTrigger}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Purchase Order"
        description={
          <span>
            Are you sure you want to delete purchase order
            <span className="font-semibold text-foreground"> {poToDelete?.purchaseOrderNumber} </span>?
            This action cannot be undone.
          </span>
        }
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

function KPIBox({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`} />
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-primary flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold tracking-tight mt-0.5">{value}</p>
        </div>
      </div>
    </Card>
  );
}
