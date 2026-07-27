import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, AlertCircle, CheckCircle, CreditCard, Building2, Wallet, Search } from 'lucide-react';
import { toast } from 'sonner';
import BankAccountForm from './BankAccountForm';
import { DataTable, Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatCurrency, cn } from '@/lib/utils';
import { useAccountList, useDeleteAccount } from '@/api/services/accounts';
import { AccountDto, AccountType, AccountTypeLabels } from '@/types/api/accounts';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const ITEMS_PER_PAGE = 10;

export default function BankAccountList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AccountDto | null>(null);

  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const { data: accounts, isLoading, error } = useAccountList();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();

  const canCreate = hasPermission('bankAccounts', 'create');
  const canUpdate = hasPermission('bankAccounts', 'update');
  const canDelete = hasPermission('bankAccounts', 'delete');

  const bankAccounts = accounts || [];

  // ─── Statistics (matching HospitalList style) ──────────────────────────
  const stats = useMemo(() => {
    const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const activeAccounts = bankAccounts.filter(a => a.isActive).length;
    const bankTotal = bankAccounts
      .filter(a => a.accountType === AccountType.Bank)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);

    return { totalBalance, activeAccounts, bankTotal };
  }, [bankAccounts]);

  // ─── Filtered accounts based on search ──────────────────────────────────
  const filteredAccounts = useMemo(() => {
    return bankAccounts.filter(acc =>
      acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.bankName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bankAccounts, searchTerm]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleEdit = (account: AccountDto) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit accounts');
      return;
    }
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (account: AccountDto) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete accounts');
      return;
    }
    setDeleteTarget(account);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    deleteAccount(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`Account "${deleteTarget.accountName}" deleted successfully.`);
        setDeleteTarget(null);
        setRefreshTrigger(prev => prev + 1);
      },
      onError: (err: any) => {
        toast.error(err.userMessage || `Failed to delete account: ${err.message}`);
      },
    });
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedAccount(null);
  };

  // ─── Table Columns (matching HospitalList style) ────────────────────────
  const columns: Column<AccountDto>[] = useMemo(() => [
    {
      header: 'ID',
      accessor: 'id',
    },
    {
      header: 'Account Details',
      accessor: (account: AccountDto) => (
        <div>
          <span className="font-semibold text-foreground">{account.accountName}</span>
          {account.accountNumber && (
            <div className="text-xs text-muted-foreground">{account.accountNumber}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Bank / Branch',
      accessor: (account: AccountDto) => (
        <div>
          <span>{account.bankName || '—'}</span>
          {account.bankBranch && (
            <div className="text-xs text-muted-foreground">{account.bankBranch}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (account: AccountDto) => (
        <div className="flex items-center gap-2">
          {account.accountType === AccountType.Cash ? (
            <Wallet className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
          ) : account.accountType === AccountType.CreditCard ? (
            <CreditCard className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          )}
          <span className="text-xs font-medium">{AccountTypeLabels[account.accountType]}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (account: AccountDto) => (
        <Badge className={cn(
          'text-[10px] font-black uppercase tracking-wider px-2',
          account.isActive
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
            : 'bg-muted text-muted-foreground'
        )}>
          {account.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Balance (PKR)',
      accessor: (account: AccountDto) => (
        <span className={cn(
          'font-bold tabular-nums',
          account.currentBalance < 1000 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
        )}>
          {formatCurrency(account.currentBalance)}
        </span>
      ),
    },
  ], []);

  // ─── Error handling (inline alert, matching HospitalList) ──────────────
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 p-5 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Error loading accounts</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              {(error as any).userMessage || 'An error occurred'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render (UI identical to HospitalList) ─────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage bank and cash accounts</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedAccount(null);
              setIsDialogOpen(true);
            }}
            disabled={isLoading}
            className="gap-2 shadow-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        )}
      </div>

      {/* KPI Cards (same KPIBox component as HospitalList) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KPIBox
          label="Total Balance"
          value={formatCurrency(stats.totalBalance)}
          icon={<CreditCard className="w-5 h-5" />}
          color="bg-blue-500"
          iconColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
        />
        <KPIBox
          label="Active Accounts"
          value={stats.activeAccounts}
          icon={<CheckCircle className="w-5 h-5" />}
          color="bg-emerald-500"
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
        />
        <KPIBox
          label="Bank Reserves"
          value={formatCurrency(stats.bankTotal)}
          icon={<Building2 className="w-5 h-5" />}
          color="bg-indigo-500"
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
        />
      </div>

      {/* Search Bar */}
      <div className="relative group w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by name, account number, or bank..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 w-full"
        />
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredAccounts}
          isLoading={isLoading}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDeleteRequest : undefined}
          itemsPerPage={ITEMS_PER_PAGE}
          emptyMessage="No bank accounts found matching your search."
          showSearch={false}
          resetSortTrigger={refreshTrigger}
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>{selectedAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            <DialogDescription>
              {selectedAccount
                ? 'Update account details'
                : 'Enter the details for the new bank or cash account'}
            </DialogDescription>
          </DialogHeader>
          <BankAccountForm account={selectedAccount || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Account"
        description={
          <span>
            This action cannot be undone. This will permanently delete{' '}
            <span className="font-semibold text-foreground">{deleteTarget?.accountName}</span>{' '}
            from your records.
          </span>
        }
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

// ─── Reusable KPI Card (exactly as in HospitalList) ─────────────────────────
function KPIBox({
  label,
  value,
  icon,
  color,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  iconColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 border-border">
        <div
          className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-[0.04] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`}
        />
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {label}
            </p>
            <p className="text-xl font-bold tracking-tight mt-0.5 truncate">
              {value}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}