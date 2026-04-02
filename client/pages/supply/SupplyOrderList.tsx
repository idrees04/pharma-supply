import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Filter, FileText, CheckCircle, Clock, XCircle, DollarSign, Search, PackageCheck, Zap, TrendingUp } from 'lucide-react';
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

import { SupplyOrder } from '@/types/api/supplyOrders';
import { useSupplyOrderList, useSupplyOrderStatuses, useDeleteSupplyOrder } from '@/api/services/supplyOrders.service';
import { formatCurrency } from '@/utils/formatters';

export default function SupplyOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [soToDelete, setSoToDelete] = useState<SupplyOrder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Fetch data
  const { data: soData, isLoading } = useSupplyOrderList({
    pageSize: 1000,
    pageNumber: 1,
    searchTerm: searchTerm || undefined
  });
  const allSOs = soData?.items || [];

  // 2. Fetch statuses for filter
  const { data: statuses = [] } = useSupplyOrderStatuses();

  // 3. Filter data (local filter for now as per PO pattern, but can be server-side if needed)
  const filteredSOs = useMemo(() => {
    return allSOs.filter((so) => {
      const matchesStatus = statusFilter === 'all' || so.status.toString() === statusFilter;
      // Search is already done via API if searchTerm is provided, but local filtering as backup
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

      // Status values mapped from API: 1=Pending, 2=Approved, 3=Fulfilled, 4=Cancelled (assuming based on PO pattern)
      if (so.status === 1) totals.pending++;
      else if (so.status === 2) totals.approved++;
      else if (so.status === 3) totals.fulfilled++;
      else if (so.status === 4) totals.cancelled++;
    });

    return totals;
  }, [allSOs]);

  // 4. Mutations
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
      onError: (error: any) => {
        toast.error(error?.userMessage || 'Failed to delete supply order');
      },
    });
  };

  const columns: Column<SupplyOrder>[] = useMemo(() => [
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
    },
    {
      header: 'Required By',
      accessor: (row) => new Date(row.requiredByDate).toLocaleDateString(),
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
        if (row.status === 3) variant = 'outline'; // Fulfilled
        if (row.status === 4) variant = 'destructive'; // Cancelled

        return <Badge variant={variant}>{statusName}</Badge>;
      },
    },
  ], [statuses]);

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
        <KPIBox label="Total SOs" value={stats.count} icon={<FileText className="w-4 h-4" />} color="bg-blue-500" />
        <KPIBox label="Total Amount" value={formatCurrency(stats.amount)} icon={<DollarSign className="w-4 h-4" />} color="bg-green-500" />
        <KPIBox label="Total Tax" value={formatCurrency(stats.tax)} icon={<TrendingUp className="w-4 h-4" />} color="bg-indigo-500" />
        <KPIBox label="Total Discount" value={formatCurrency(stats.discount)} icon={<Zap className="w-4 h-4" />} color="bg-amber-500" />
        <KPIBox label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="bg-orange-500" />
        <KPIBox label="Approved" value={stats.approved} icon={<CheckCircle className="w-4 h-4" />} color="bg-emerald-500" />
        <KPIBox label="Fulfilled" value={stats.fulfilled} icon={<PackageCheck className="w-4 h-4" />} color="bg-purple-500" />
        <KPIBox label="Cancelled" value={stats.cancelled} icon={<XCircle className="w-4 h-4" />} color="bg-red-500" />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by SO number or hospital..."
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
          data={filteredSOs}
          isLoading={isLoading}
          onEdit={(row) => navigate(`/supply-orders/edit/${row.id}`)}
          onDelete={(row) => {
            setSoToDelete(row);
            setIsDeleteDialogOpen(true);
          }}
          itemsPerPage={10}
          emptyMessage="No supply orders found."
          showSearch={false}
          onRowClick={(row) => navigate(`/supply-orders/view/${row.id}`)}
          resetSortTrigger={refreshTrigger}
        />
      </div>

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
