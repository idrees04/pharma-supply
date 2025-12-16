import { useState } from "react";
import { useStore, SalaryVoucher } from "@/hooks/useStore";
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
import SalaryVoucherForm from "./SalaryVoucherForm";
import { formatCurrency } from "@/lib/utils";

export default function SalaryVoucherList() {
  const { salaryVouchers, deleteSalaryVoucher } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<SalaryVoucher | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<string | null>(
    null,
  );

  const filteredVouchers = salaryVouchers.filter(
    (voucher) =>
      voucher.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: Column<SalaryVoucher>[] = [
    {
      header: "Voucher No",
      accessor: "voucherNo",
    },
    {
      header: "Employee",
      accessor: "employeeName",
    },
    {
      header: "Date",
      accessor: "date",
    },
    {
      header: "Gross Salary",
      accessor: (row) => formatCurrency(row.grossSalary),
    },
    {
      header: "Deductions",
      accessor: (row) =>
        formatCurrency(row.deductions.reduce((sum, d) => sum + d.amount, 0)),
      className: "hidden sm:table-cell",
    },
    {
      header: "Net Payable",
      accessor: (row) => formatCurrency(row.netSalaryPayable),
    },
  ];

  const totalGrossSalary = salaryVouchers.reduce(
    (sum, v) => sum + v.grossSalary,
    0,
  );
  const totalDeductions = salaryVouchers.reduce(
    (sum, v) => sum + v.deductions.reduce((s, d) => s + d.amount, 0),
    0,
  );
  const totalAllowances = salaryVouchers.reduce(
    (sum, v) => sum + v.allowances.reduce((s, a) => s + a.amount, 0),
    0,
  );
  const totalNetPayable = salaryVouchers.reduce(
    (sum, v) => sum + v.netSalaryPayable,
    0,
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Salary Vouchers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee salaries and payroll
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedVoucher(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Voucher
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by employee name or voucher number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Vouchers"
          value={salaryVouchers.length.toString()}
        />
        <StatCard
          label="Total Gross Salary"
          value={formatCurrency(totalGrossSalary)}
        />
        <StatCard
          label="Total Allowances"
          value={formatCurrency(totalAllowances)}
        />
        <StatCard
          label="Total Deductions"
          value={formatCurrency(totalDeductions)}
        />
      </div>

      {/* Summary Card */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Payroll Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Net Payable</p>
            <p className="text-2xl font-bold text-accent">
              {formatCurrency(totalNetPayable)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Salary</p>
            <p className="text-2xl font-bold">
              {formatCurrency(
                salaryVouchers.length > 0
                  ? totalGrossSalary / salaryVouchers.length
                  : 0,
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Employees</p>
            <p className="text-2xl font-bold">{salaryVouchers.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Net Payable</p>
            <p className="text-2xl font-bold">
              {formatCurrency(
                salaryVouchers.length > 0
                  ? totalNetPayable / salaryVouchers.length
                  : 0,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={filteredVouchers}
          onEdit={(voucher) => {
            setSelectedVoucher(voucher);
            setIsFormOpen(true);
          }}
          onDelete={(voucher) => setIsDeleteConfirming(voucher.id)}
          emptyMessage="No salary vouchers found. Create your first voucher to get started."
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVoucher ? "Edit Voucher" : "Create New Voucher"}
            </DialogTitle>
            <DialogDescription>
              {selectedVoucher
                ? "Update salary voucher details"
                : "Add a new salary voucher"}
            </DialogDescription>
          </DialogHeader>
          <SalaryVoucherForm
            initialData={selectedVoucher || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedVoucher(null);
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
              <DialogTitle>Delete Salary Voucher</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this salary voucher? This action
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
                  deleteSalaryVoucher(isDeleteConfirming);
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
