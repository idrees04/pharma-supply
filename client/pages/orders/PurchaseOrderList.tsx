import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Filter, FileText, CheckCircle, Clock, XCircle, DollarSign, Search, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TableCard } from '@/components/common/TableCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PurchaseOrder, PurchaseOrderStatus } from '@/types/api/purchaseOrders';
import { purchaseOrderService, usePurchaseOrderStatuses, useDeletePurchaseOrder, usePurchaseOrderList } from '@/api/services/purchaseOrders';
import { formatCurrency } from '@/lib/utils';
import { formatAppDate } from '@/lib/dates';
import { getPurchaseOrderStatusClassName, getPurchaseOrderStatusLabel } from '@/lib/purchaseOrderStatusDisplay';
const ITEMS_PER_PAGE = 10;

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
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.linkedSupplyOrders ?? []).some(
          (so) =>
            so.supplyOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (so.hospitalName ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
        );
      return matchesStatus && matchesSearch;
    });
  }, [allPOs, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const totals = {
      count: allPOs.length,
      amount: 0,
      cash: 0,
      credit: 0,
      sent: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      receivedAmount: 0,
      remainingAmount: 0,
    };

    allPOs.forEach((po) => {
      totals.amount += po.totalAmount || 0;
      if (po.paymentMethod === 'Cash') totals.cash++;
      else totals.credit++;

      if (po.status === PurchaseOrderStatus.Sent) totals.sent++;
      else if (po.status === PurchaseOrderStatus.Active) totals.active++;
      else if (po.status === PurchaseOrderStatus.Completed) totals.completed++;
      else if (po.status === PurchaseOrderStatus.Cancelled) totals.cancelled++;

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
      header: 'Supply order / Hospital',
      accessor: (row) => {
        const links = row.linkedSupplyOrders ?? [];
        if (links.length === 0) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        return (
          <div className="flex flex-col gap-1 min-w-[10rem] max-w-[16rem]">
            {links.map((so) => (
              <Link
                key={so.id}
                to={`/supply-orders/view/${so.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex flex-col rounded-md border border-primary/15 bg-primary/5 px-2 py-1 hover:bg-primary/10 transition-colors"
              >
                <span className="font-mono text-xs font-semibold text-primary flex items-center gap-1">
                  <Link2 className="h-3 w-3 shrink-0" />
                  {so.supplyOrderNumber}
                </span>
                {so.hospitalName ? (
                  <span className="text-[11px] text-muted-foreground truncate">{so.hospitalName}</span>
                ) : null}
              </Link>
            ))}
          </div>
        );
      },
      id: 'linkedSupplyOrders',
    },
    {
      header: 'Order Date',
      accessor: (row) => formatAppDate(row.orderDate),
      mobileHidden: true,
    },
    {
      header: 'Expected Delivery',
      accessor: (row) => formatAppDate(row.expectedDeliveryDate),
      mobileHidden: true,
    },
    {
      header: 'Total amount (PKR)',
      accessor: (row) => formatCurrency(row.totalAmount),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const statusName = getPurchaseOrderStatusLabel(row.status);

        return (
          <Badge variant="outline" className={getPurchaseOrderStatusClassName(row.status)}>
            {statusName}
          </Badge>
        );
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
        <KPIBox label="Total amount (PKR)" value={formatCurrency(stats.amount)} icon={<DollarSign className="w-5 h-5" />} color="bg-green-500" />
        <KPIBox label="Sent / Active" value={`${stats.sent} / ${stats.active}`} icon={<Clock className="w-5 h-5" />} color="bg-amber-500" />
        <KPIBox label="Completed" value={stats.completed} icon={<CheckCircle className="w-5 h-5" />} color="bg-emerald-500" />
        <KPIBox label="Cancelled" value={stats.cancelled} icon={<XCircle className="w-5 h-5" />} color="bg-red-500" />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by PO, supplier, supply order, or hospital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-muted/50 border-border focus:bg-card transition-all"
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
      <TableCard
        icon={<FileText />}
        title="All purchase orders"
        count={filteredPOs.length}
        countLabel={(c) => `${c} order(s)`}
        contentClassName="overflow-x-auto p-2 sm:p-4"
      >
        <DataTable
          columns={columns}
          data={filteredPOs}
          isLoading={isLoading}
          onDelete={(row) => {
            setPoToDelete(row);
            setIsDeleteDialogOpen(true);
          }}
          itemsPerPage={ITEMS_PER_PAGE}
          emptyMessage="No purchase orders found."
          showSearch={false}
          onRowClick={(row) => navigate(`/orders/purchase/view/${row.id}`)}
          resetSortTrigger={refreshTrigger}
          defaultSort={{ id: 'id', desc: false }}
        />
      </TableCard>

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
