import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DataTable } from "@/components/common/DataTable";
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
import { useExpenseList, useDeleteExpense } from "@/api/services/expenses";
import { ExpenseDto } from "@/types/api/expenses";

export default function DailyExpenseList() {
  const { hasPermission } = useAuth();
  const [params, setParams] = useState({ pageNumber: 1, pageSize: 10, searchTerm: "" });
  const { data, isLoading } = useExpenseList(params);
  const { mutate: deleteExpense } = useDeleteExpense();

  const [selectedExpense, setSelectedExpense] = useState<ExpenseDto | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<number | null>(
    null,
  );

  const canCreate = hasPermission('expenses', 'create');
  const canUpdate = hasPermission('expenses', 'update');
  const canDelete = hasPermission('expenses', 'delete');

  const columns = [
    {
      header: "Reference",
      accessor: "referenceNumber",
    },
    {
      header: "Date",
      accessor: (row: ExpenseDto) => new Date(row.expenseDate).toLocaleDateString(),
    },
    {
      header: "Category",
      accessor: "expenseCategoryName",
    },
    {
      header: "Amount",
      accessor: (row: ExpenseDto) => formatCurrency(row.amount),
    },
    {
      header: "Payment Method",
      accessor: "paymentMethod",
      className: "hidden sm:table-cell",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden md:table-cell",
    },
  ];

  const expenses = data?.items || [];
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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
            New Expense
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by reference or description..."
          value={params.searchTerm}
          onChange={(e) => setParams(p => ({ ...p, searchTerm: e.target.value, pageNumber: 1 }))}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Count"
          value={data?.totalCount.toString() || "0"}
        />
        <StatCard
          label="Total Amount"
          value={formatCurrency(totalAmount)}
        />
        <StatCard
          label="Categories"
          value={new Set(expenses.map(e => e.expenseCategoryId)).size.toString()}
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        {isLoading ? (
          <div className="p-8 text-center">Loading expenses...</div>
        ) : (
          <DataTable
            columns={columns}
            data={expenses}
            onEdit={canUpdate ? (expense) => {
              setSelectedExpense(expense);
              setIsFormOpen(true);
            } : undefined}
            onDelete={canDelete ? (expense) => setIsDeleteConfirming(expense.id) : undefined}
            totalItems={data?.totalCount}
            itemsPerPage={params.pageSize}
            onPageChange={(page) => setParams(p => ({ ...p, pageNumber: page }))}
            emptyMessage="No expenses found. Record your first expense to get started."
          />
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedExpense ? "Edit Expense" : "Record New Expense"}
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
              <DialogTitle>Delete Expense</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this expense record? This
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
                  deleteExpense(isDeleteConfirming!, {
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
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
