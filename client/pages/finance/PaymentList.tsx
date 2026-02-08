import { useState } from "react";
import { useStore, Payment } from "@/hooks/useStore";
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
import { formatCurrency } from "@/lib/utils";

export default function PaymentList() {
  const { payments, deletePayment } = useStore();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<string | null>(
    null,
  );

  const canCreate = hasPermission('payments', 'create');
  const canUpdate = hasPermission('payments', 'update');
  const canDelete = hasPermission('payments', 'delete');

  const filteredPayments = payments.filter(
    (payment) =>
      payment.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.poId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getPaymentModeColor = (mode: string) => {
    switch (mode) {
      case "Cash":
        return "bg-green-100 text-green-800";
      case "Cheque":
        return "bg-blue-100 text-blue-800";
      case "Bank":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: "PO ID",
      accessor: "poId",
    },
    {
      header: "Payment Mode",
      accessor: (row) => (
        <Badge className={getPaymentModeColor(row.paymentMode)}>
          {row.paymentMode}
        </Badge>
      ),
    },
    {
      header: "Reference No",
      accessor: "referenceNo",
    },
    {
      header: "Payment Date",
      accessor: "paymentDate",
    },
    {
      header: "Amount",
      accessor: (row) => formatCurrency(row.amount),
    },
  ];

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const cashPayments = payments
    .filter((p) => p.paymentMode === "Cash")
    .reduce((sum, p) => sum + p.amount, 0);
  const chequePayments = payments
    .filter((p) => p.paymentMode === "Cheque")
    .reduce((sum, p) => sum + p.amount, 0);
  const bankPayments = payments
    .filter((p) => p.paymentMode === "Bank")
    .reduce((sum, p) => sum + p.amount, 0);

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
          placeholder="Search by PO ID or reference number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Payments" value={payments.length.toString()} />
        <StatCard label="Total Amount" value={formatCurrency(totalPayments)} />
        <StatCard label="Cash" value={formatCurrency(cashPayments)} />
        <StatCard label="Cheque" value={formatCurrency(chequePayments)} />
        <StatCard label="Bank" value={formatCurrency(bankPayments)} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={filteredPayments}
          onEdit={canUpdate ? (payment) => {
            setSelectedPayment(payment);
            setIsFormOpen(true);
          } : undefined}
          onDelete={canDelete ? (payment) => setIsDeleteConfirming(payment.id) : undefined}
          emptyMessage="No payments found. Record a new payment to get started."
        />
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
                  deletePayment(isDeleteConfirming);
                  setIsDeleteConfirming(null);
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
