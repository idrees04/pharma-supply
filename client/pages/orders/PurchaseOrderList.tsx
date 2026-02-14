import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { CommonTable } from '@/components/table/CommonTable';
import { useTableState } from '@/components/table/hooks/useTableState';
import { useTableQuery } from '@/components/table/hooks/useTableQuery';
import { CommonTableColumn, RowAction, TableQueryParams } from '@/components/table/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PurchaseOrder } from '@/types/api/purchaseOrders';
import { purchaseOrderService, usePurchaseOrderStatuses, useDeletePurchaseOrder } from '@/api/services/purchaseOrders';
import { formatCurrency } from '@/lib/utils';

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 1. Manage table state
  const tableState = useTableState({
    initialPagination: { pageIndex: 1, pageSize: 10 },
  });

  // 2. Fetch statuses for filter
  const { data: statuses = [] } = usePurchaseOrderStatuses();

  // 3. Fetch data from server
  const tableQuery = useTableQuery({
    queryKey: ['purchaseOrders', 'table', statusFilter],
    queryFn: async (params: TableQueryParams) => {
      // If a specific status is selected, we might need to handle it differently 
      // based on whether getPurchaseOrders supports status param or we use by-status endpoint.
      // The prompt suggests using GET /api/PurchaseOrders/by-status/:status for filtering.
      // However, by-status doesn't seem to support pagination in the example.
      // Let's check if we can pass status to getPurchaseOrders or if we must use by-status.
      
      if (statusFilter !== 'all') {
        const results = await purchaseOrderService.getPurchaseOrdersByStatus(Number(statusFilter));
        // Map array to TableDataResponse
        return {
          items: results,
          total: results.length,
          page: 1,
          pageSize: results.length,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      const response = await purchaseOrderService.getPurchaseOrders({
        pageNumber: params.page,
        pageSize: params.pageSize,
        searchTerm: params.globalFilter,
        sortBy: params.sorting?.[0]?.id,
        sortDescending: params.sorting?.[0]?.desc,
      });

      return {
        items: response.items,
        total: response.totalCount,
        page: response.pageNumber,
        pageSize: response.pageSize,
        hasNextPage: response.hasNext,
        hasPreviousPage: response.hasPrevious,
      };
    },
    pagination: tableState.pagination,
    sorting: tableState.sorting,
    globalFilter: tableState.globalFilter,
  });

  // 4. Mutations
  const { mutate: deletePO, isPending: isDeleting } = useDeletePurchaseOrder();

  const handleDelete = async () => {
    if (!poToDelete) return;
    deletePO(poToDelete.id, {
      onSuccess: () => {
        toast.success('Purchase order deleted successfully');
        setIsDeleteDialogOpen(false);
        setPoToDelete(null);
      },
      onError: (error: any) => {
        toast.error(error?.userMessage || 'Failed to delete purchase order');
      },
    });
  };

  // 5. Define Columns
  const columns = useMemo((): CommonTableColumn<PurchaseOrder>[] => [
    {
      accessorKey: 'purchaseOrderNumber',
      header: 'PO Number',
      label: 'PO Number',
      sortable: true,
      cell: (info) => <span className="font-medium text-primary">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'supplierName',
      header: 'Supplier',
      label: 'Supplier',
      sortable: true,
    },
    {
      accessorKey: 'orderDate',
      header: 'Order Date',
      label: 'Order Date',
      sortable: true,
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: 'expectedDeliveryDate',
      header: 'Expected Delivery',
      label: 'Expected Delivery',
      sortable: true,
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      label: 'Total Amount',
      sortable: true,
      cell: (info) => formatCurrency(info.getValue() as number),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      label: 'Status',
      sortable: true,
      cell: (info) => {
        const status = info.getValue() as number;
        const statusName = statuses.find(s => s.value === status)?.name || `Status ${status}`;
        
        let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'outline';
        if (status === 1) variant = 'secondary'; // Pending/Draft
        if (status === 2) variant = 'default';   // Confirmed
        if (status === 3) variant = 'outline';   // Completed/Received
        
        return <Badge variant={variant}>{statusName}</Badge>;
      },
    },
  ], [statuses]);

  // 6. Row Actions
  const rowActions = useMemo((): RowAction<PurchaseOrder>[] => [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit2 className="h-4 w-4 text-blue-600" />,
      onClick: ({ row }) => {
        navigate(`/orders/purchase/edit/${row.id}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4 text-red-600" />,
      variant: 'ghost',
      onClick: ({ row }) => {
        setPoToDelete(row);
        setIsDeleteDialogOpen(true);
      },
    },
  ], [navigate]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage and track your supplier purchase orders</p>
        </div>
        <Button onClick={() => navigate('/orders/purchase/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by Status:</span>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            tableState.resetPagination();
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Status" />
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

      {/* Table */}
      <CommonTable<PurchaseOrder>
        columns={columns}
        data={tableQuery.data}
        totalCount={tableQuery.totalCount}
        isLoading={tableQuery.isPending}
        error={tableQuery.error as Error}
        onRetry={() => tableQuery.refetch()}

        pagination={tableState.pagination}
      onPaginationChange={tableState.setPagination}

      sorting={tableState.sorting}
        onSortingChange={tableState.setSorting}

        globalFilter={tableState.globalFilter}
        onGlobalFilterChange={tableState.setGlobalFilter}

        rowActions={rowActions}
        showToolbar={true}
        emptyStateMessage="No purchase orders found."
      />

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
