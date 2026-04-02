import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PaymentForm from "./PaymentForm";
import { formatCurrency } from '@/utils/formatters';
import { usePaymentList, useDeletePayment } from "@/api/services/payments";
import { PaymentDto, PaymentMode } from "@/types/api/payments";

export default function PaymentList() {
  const { hasPermission } = useAuth();
  const [params, setParams] = useState({ pageNumber: 1, pageSize: 10, searchTerm: "" });
  const { data, isLoading } = usePaymentList(params);
  const { mutate: deletePayment } = useDeletePayment();

  const [selectedPayment, setSelectedPayment] = useState<PaymentDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<number | null>(
    null,
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canCreate = hasPermission('payments', 'create');
  const canUpdate = hasPermission('payments', 'update');
  const canDelete = hasPermission('payments', 'delete');

  const getPaymentModeLabel = (mode: PaymentMode) => {
    switch (mode) {
      case PaymentMode.Cash: return "Cash";
      case PaymentMode.Cheque: return "Cheque";
      case PaymentMode.BankTransfer: return "Bank";
      case PaymentMode.CreditCard: return "Credit Card";
      case PaymentMode.DebitCard: return "Debit Card";
      default: return "Unknown";
    }
  };

  const getPaymentModeColor = (mode: PaymentMode) => {
    switch (mode) {
      case PaymentMode.Cash:
        return "bg-green-100 text-green-800";
      case PaymentMode.Cheque:
        return "bg-blue-100 text-blue-800";
      case PaymentMode.BankTransfer:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: Column<PaymentDto>[] = [
    {
      header: 'ID',
      accessor: 'id',

    },
    {
      header: "Reference",
      accessor: "referenceNumber",
    },
    {
      header: "Payment Mode",
      accessor: (row: PaymentDto) => (
        <Badge className={getPaymentModeColor(row.paymentMode)}>
          {getPaymentModeLabel(row.paymentMode)}
        </Badge>
      ),
    },
    {
      header: "Related ID",
      accessor: (row: PaymentDto) => row.purchaseOrderNumber || row.invoiceNumber || "N/A",
    },
    {
      header: "Date",
      accessor: (row: PaymentDto) => new Date(row.paymentDate).toLocaleDateString(),
    },
    {
      header: "Amount",
      accessor: (row: PaymentDto) => formatCurrency(row.amount),
    },
    {
      header: "Account",
      accessor: "accountName",
      className: "hidden sm:table-cell",
    },
  ];

  const payments = data?.items || [];
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage payment transactions
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedPayment(null);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by reference or related order..."
          value={params.searchTerm}
          onChange={(e) => setParams(p => ({ ...p, searchTerm: e.target.value, pageNumber: 1 }))}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Payments" value={data?.totalCount.toString() || "0"} />
        <StatCard label="Listed Amount" value={formatCurrency(totalAmount)} />
        <StatCard label="Accounts Involved" value={new Set(payments.map(p => p.accountId)).size.toString()} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        {isLoading ? (
          <div className="p-8 text-center">Loading payments...</div>
        ) : (
          <DataTable
            columns={columns}
            data={payments}
            onEdit={canUpdate ? (payment) => {
              setSelectedPayment(payment);
              setIsFormOpen(true);
            } : undefined}
            onDelete={canDelete ? (payment) => setIsDeleteConfirming(payment.id) : undefined}
            totalItems={data?.totalCount}
            itemsPerPage={params.pageSize}
            onPageChange={(page) => setParams(p => ({ ...p, pageNumber: page }))}
            emptyMessage="No payments found. Record a new payment to get started."
            resetSortTrigger={refreshTrigger}
          />
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPayment ? "Edit Payment" : "Record New Payment"}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment
                ? "Update payment details"
                : "Record a new payment transaction"}
            </DialogDescription>
          </DialogHeader>
          <PaymentForm
            initialData={selectedPayment || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedPayment(null);
              if (!selectedPayment) {
                setRefreshTrigger(prev => prev + 1);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {isDeleteConfirming && (
        <Dialog
          open={!!isDeleteConfirming}
          onOpenChange={() => setIsDeleteConfirming(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this payment record? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirming(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deletePayment(isDeleteConfirming!, {
                    onSuccess: () => setIsDeleteConfirming(null)
                  });
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}
