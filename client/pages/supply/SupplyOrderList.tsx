import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, FileText, CheckCircle, Clock, XCircle, DollarSign, Search, PackageCheck, TrendingUp, Zap } from 'lucide-react';
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

import { SupplyOrder, SupplyOrderStatus } from '@/types/api/supplyOrders';
import { useSupplyOrderList, useSupplyOrderStatuses, useDeleteSupplyOrder } from '@/api/services/supplyOrders.service';
import { formatCurrency } from '@/lib/utils';
import {
  getSupplyOrderStatusClassName,
  getSupplyOrderStatusLabel,
} from '@/lib/supplyOrderStatusDisplay';

const ITEMS_PER_PAGE = 10;

export default function SupplyOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [soToDelete, setSoToDelete] = useState<SupplyOrder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: soData, isLoading } = useSupplyOrderList({
    pageSize: 1000,
    pageNumber: 1,
    searchTerm: searchTerm || undefined,
  });
  const allSOs = soData?.items || [];

  const { data: statuses = [] } = useSupplyOrderStatuses();

  const filteredSOs = useMemo(() => {
    return allSOs.filter((so) => {
      const matchesStatus = statusFilter === 'all' || so.status.toString() === statusFilter;
      const matchesSearch =
        so.supplyOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        so.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [allSOs, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const totals = {
      count: allSOs.length,
      amount: 0,
      tax: 0,
      discount: 0,
      pending: 0,
      approved: 0,
      fulfilled: 0,
      cancelled: 0,
    };

    allSOs.forEach((so) => {
      totals.amount += so.totalAmount || 0;
      totals.tax += so.taxAmount || 0;
      totals.discount += so.discountAmount || 0;

      if (so.status === SupplyOrderStatus.Pending || so.status === SupplyOrderStatus.Draft) {
        totals.pending++;
      } else if (so.status === SupplyOrderStatus.Approved) {
        totals.approved++;
      } else if (
        so.status === SupplyOrderStatus.Fulfilled ||
        so.status === SupplyOrderStatus.PartiallyFulfilled ||
        so.status === SupplyOrderStatus.Invoiced
      ) {
        totals.fulfilled++;
      } else if (so.status === SupplyOrderStatus.Cancelled) {
        totals.cancelled++;
      }
    });

    return totals;
  }, [allSOs]);

  const { mutate: deleteSO, isPending: isDeleting } = useDeleteSupplyOrder();

  const handleDelete = async () => {
    if (!soToDelete) return;
    deleteSO(soToDelete.id, {
      onSuccess: () => {
        toast.success('Supply order deleted successfully');
        setIsDeleteDialogOpen(false);
        setSoToDelete(null);
        queryClient.invalidateQueries({ queryKey: ['supplyOrders'] });
      },
      onError: (error: { userMessage?: string }) => {
        toast.error(error?.userMessage || 'Failed to delete supply order');
      },
    });
  };

  const columns: Column<SupplyOrder>[] = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'id',
      },
      {
        header: 'SO Number',
        accessor: (row) => (
          <span className="font-black text-primary tracking-tight">{row.supplyOrderNumber}</span>
        ),
      },
      {
        header: 'Hospital',
        accessor: 'hospitalName',
      },
      {
        header: 'Order Date',
        accessor: (row) => new Date(row.orderDate).toLocaleDateString(),
        mobileHidden: true,
      },
      {
        header: 'Required By',
        accessor: (row) => new Date(row.requiredByDate).toLocaleDateString(),
        mobileHidden: true,
      },
      {
        header: 'Total amount (PKR)',
        accessor: (row) => formatCurrency(row.totalAmount),
      },
      {
        header: 'Status',
        accessor: (row) => (
          <Badge variant="outline" className={getSupplyOrderStatusClassName(row.status)}>
            {getSupplyOrderStatusLabel(row.status, statuses)}
          </Badge>
        ),
      },
    ],
    [statuses]
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supply Orders</h1>
          <p className="text-muted-foreground">Manage hospital supply orders and fulfillment</p>
        </div>
        <Button onClick={() => navigate('/supply-orders/create')} className="gap-2 shadow-md">
          <Plus className="h-4 w-4" />
          Create Supply Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <KPIBox label="Total SOs" value={stats.count} icon={<FileText className="w-5 h-5" />} color="bg-blue-500" />
        <KPIBox
          label="Total amount (PKR)"
          value={formatCurrency(stats.amount)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-green-500"
        />
        <KPIBox
          label="Total tax (PKR)"
          value={formatCurrency(stats.tax)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-indigo-500"
        />
        <KPIBox
          label="Total discount (PKR)"
          value={formatCurrency(stats.discount)}
          icon={<Zap className="w-5 h-5" />}
          color="bg-amber-500"
        />
        <KPIBox label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="bg-orange-500" />
        <KPIBox label="Approved" value={stats.approved} icon={<CheckCircle className="w-5 h-5" />} color="bg-emerald-500" />
        <KPIBox label="Fulfilled" value={stats.fulfilled} icon={<PackageCheck className="w-5 h-5" />} color="bg-purple-500" />
        <KPIBox label="Cancelled" value={stats.cancelled} icon={<XCircle className="w-5 h-5" />} color="bg-red-500" />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by SO number or hospital..."
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
        title="All supply orders"
        count={filteredSOs.length}
        countLabel={(c) => `${c} order(s)`}
        contentClassName="overflow-x-auto p-2 sm:p-4"
      >
        <DataTable
          columns={columns}
          data={filteredSOs}
          isLoading={isLoading}
          onEdit={(row) => navigate(`/supply-orders/edit/${row.id}`)}
          onDelete={(row) => {
            setSoToDelete(row);
            setIsDeleteDialogOpen(true);
          }}
          itemsPerPage={ITEMS_PER_PAGE}
          emptyMessage="No supply orders found."
          showSearch={false}
          onRowClick={(row) => navigate(`/supply-orders/view/${row.id}`)}
          resetSortTrigger={refreshTrigger}
          defaultSort={{ id: 'id', desc: false }}
        />
      </TableCard>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Supply Order"
        description={
          <span>
            Are you sure you want to delete supply order
            <span className="font-semibold text-foreground"> {soToDelete?.supplyOrderNumber} </span>?
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
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-primary flex items-center justify-center`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{label}</p>
          <p className="text-sm font-bold tracking-tight mt-0.5 truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}
