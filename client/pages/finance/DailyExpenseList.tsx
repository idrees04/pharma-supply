import { useState } from "react";
import { useStore, DailyExpense } from "@/hooks/useStore";
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
import DailyExpenseForm from "./DailyExpenseForm";
import { formatCurrency } from "@/lib/utils";

export default function DailyExpenseList() {
  const { dailyExpenses, deleteDailyExpense } = useStore();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<DailyExpense | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<string | null>(
    null,
  );

  const canCreate = hasPermission('expenses', 'create');
  const canUpdate = hasPermission('expenses', 'update');
  const canDelete = hasPermission('expenses', 'delete');

  const filteredExpenses = dailyExpenses.filter(
    (expense) =>
      expense.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.payTo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: Column<DailyExpense>[] = [
    {
      header: "Voucher No",
      accessor: "voucherNo",
    },
    {
      header: "Date",
      accessor: "date",
    },
    {
      header: "Pay To",
      accessor: "payTo",
    },
    {
      header: "Items",
      accessor: (row) => row.expenses.length,
      className: "hidden sm:table-cell",
    },
    {
      header: "Total Amount",
      accessor: (row) => formatCurrency(row.totalAmount),
    },
    {
      header: "Receipts",
      accessor: (row) => row.attachedReceipts,
      className: "hidden md:table-cell",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Daily Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record and track daily expenses
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedExpense(null);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Voucher
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by voucher number or pay to..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Vouchers"
          value={dailyExpenses.length.toString()}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(
            dailyExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0),
          )}
        />
        <StatCard
          label="Total Receipts"
          value={dailyExpenses
            .reduce((sum, exp) => sum + exp.attachedReceipts, 0)
            .toString()}
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={filteredExpenses}
          onEdit={canUpdate ? (expense) => {
            setSelectedExpense(expense);
            setIsFormOpen(true);
          } : undefined}
          onDelete={canDelete ? (expense) => setIsDeleteConfirming(expense.id) : undefined}
          emptyMessage="No expenses found. Create your first voucher to get started."
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedExpense ? "Edit Expense" : "Create New Expense"}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense
                ? "Update expense details"
                : "Record a new daily expense"}
            </DialogDescription>
          </DialogHeader>
          <DailyExpenseForm
            initialData={selectedExpense || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedExpense(null);
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
              <DialogTitle>Delete Expense Voucher</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this expense voucher? This
                action cannot be undone.
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
                  deleteDailyExpense(isDeleteConfirming);
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
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
