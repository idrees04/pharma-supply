import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CreditCard,
  Plus,
  Wallet,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import BankAccountForm from './BankAccountForm';
import { DataTable, Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatCurrency, cn } from '@/lib/utils';
import { useAccountList, useDeleteAccount } from '@/api/services/accounts';
import { AccountDto, AccountType, AccountTypeLabels } from '@/types/api/accounts';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function BankAccountList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountDto | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AccountDto | null>(null);

  const { hasPermission } = useAuth();
  const { data: accounts, isLoading, error } = useAccountList();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();

  const canCreate = hasPermission('bankAccounts', 'create');
  const canUpdate = hasPermission('bankAccounts', 'update');
  const canDelete = hasPermission('bankAccounts', 'delete');

  const bankAccounts = accounts || [];

  // ─── Business Logic Calculations ──────────────────────────────────────────

  const stats = useMemo(() => {
    const total = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const active = bankAccounts.filter(a => a.isActive).length;
    const inactive = bankAccounts.length - active;

    const cashTotal = bankAccounts
      .filter(a => a.accountType === AccountType.Cash)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);

    const bankTotal = bankAccounts
      .filter(a => a.accountType === AccountType.Bank)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);

    const cashPercent = total > 0 ? (cashTotal / total) * 100 : 0;
    const bankPercent = total > 0 ? (bankTotal / total) * 100 : 0;

    return {
      total,
      active,
      inactive,
      cashTotal,
      bankTotal,
      cashPercent,
      bankPercent,
      count: bankAccounts.length
    };
  }, [bankAccounts]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleEdit = (account: AccountDto) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (account: AccountDto) => {
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

  // ─── Table Configuration ──────────────────────────────────────────────────

  const columns: Column<AccountDto>[] = [
    {
      header: 'Account Details',
      accessor: (account: AccountDto) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{account.accountName}</span>
          <span className="text-xs text-muted-foreground">{account.accountNumber}</span>
        </div>
      ),
    },
    {
      header: 'Bank/Branch',
      accessor: (account: AccountDto) => (
        <div className="flex flex-col">
          <span className="font-medium">{account.bankName || 'N/A'}</span>
          <span className="text-[11px] text-muted-foreground uppercase">{account.bankBranch || 'Primary'}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (account: AccountDto) => (
        <div className="flex items-center gap-2">
          {account.accountType === AccountType.Cash ? (
            <Wallet className="w-3.5 h-3.5 text-orange-500" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span className="text-xs font-medium">{AccountTypeLabels[account.accountType]}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (account: AccountDto) => (
        <Badge
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider h-5 flex items-center justify-center",
            account.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          )}
          variant="outline"
        >
          {account.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Balance',
      accessor: (account: AccountDto) => (
        <div className="text-right">
          <div className={cn(
            "font-bold tabular-nums",
            account.currentBalance < 1000 ? "text-red-600" : "text-slate-900"
          )}>
            {formatCurrency(account.currentBalance)}
          </div>
          {account.currentBalance < 1000 && account.isActive && (
            <div className="text-[9px] text-red-500 flex items-center justify-end gap-0.5 mt-0.5 uppercase font-bold tracking-tighter">
              <AlertCircle size={8} /> Low Liquidity
            </div>
          )}
        </div>
      ),
    },
  ];

  // ─── Animation Variants ───────────────────────────────────────────────────

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto min-h-screen pb-12">
      {/* ─── Header Section ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Accounts <TrendingUp className="text-primary w-8 h-8" />
          </h1>
          <p className="text-muted-foreground text-lg mt-1 font-medium">
            Financial infrastructure and cash-flow management
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <Button
              onClick={() => {
                setSelectedAccount(null);
                setIsDialogOpen(true);
              }}
              size="lg"
              className="gap-2 shadow-xl shadow-primary/20 h-14 px-6 rounded-2xl bg-primary hover:scale-[1.02] active:scale-95 transition-all text-base font-bold"
            >
              <Plus className="w-5 h-5" />
              Register Account
            </Button>
          )}
        </div>
      </div>

      {/* ─── KPI Dashboard ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <DashboardCard
          variants={itemVariants}
          label="Total Liquidity"
          value={formatCurrency(stats.total)}
          icon={<CreditCard className="w-6 h-6" />}
          trend={{ value: "+4.2%", positive: true }}
          color="bg-primary/5 text-primary"
        />
        <DashboardCard
          variants={itemVariants}
          label="Managed Accounts"
          value={stats.active}
          icon={<Activity className="w-6 h-6" />}
          subValue={`of ${stats.count} Total`}
          color="bg-emerald-50 text-emerald-600"
        />
        <DashboardCard
          variants={itemVariants}
          label="Bank Reserves"
          value={formatCurrency(stats.bankTotal)}
          description={`${stats.bankPercent.toFixed(0)}% of total funds`}
          progress={stats.bankPercent}
          icon={<Building2 className="w-6 h-6" />}
          color="bg-blue-50 text-blue-600"
        />
        <DashboardCard
          variants={itemVariants}
          label="Cash on Hand"
          value={formatCurrency(stats.cashTotal)}
          description={`${stats.cashPercent.toFixed(0)}% of total funds`}
          progress={stats.cashPercent}
          icon={<Wallet className="w-6 h-6" />}
          color="bg-orange-50 text-orange-600"
        />
      </motion.div>

      {/* ─── Main Content Area ─── */}
      <div className="grid grid-cols-1 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <div className="p-8 border-b bg-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl text-primary font-black">
                LB
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900">Ledger Balances</h3>
                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Real-time status</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-10 rounded-xl gap-2 font-bold text-muted-foreground">
                <Filter size={16} /> Filters
              </Button>
              <Button variant="ghost" size="sm" className="h-10 rounded-xl gap-2 font-bold text-muted-foreground">
                <Download size={16} /> Export
              </Button>
            </div>
          </div>
          <div className="p-6">
            <DataTable
              columns={columns}
              data={bankAccounts}
              isLoading={isLoading}
              onEdit={canUpdate ? handleEdit : undefined}
              onDelete={canDelete ? handleDeleteRequest : undefined}
              itemsPerPage={10}
              showSearch={true}
              searchPlaceholder="Search accounts by name or bank..."
              emptyMessage="No bank accounts found matching your search."
              resetSortTrigger={refreshTrigger}
              className="border-none shadow-none"
            />
          </div>
        </Card>
      </div>

      {/* ─── Forms & dialogs ─── */}
      <AnimatePresence>
        {isDialogOpen && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedAccount ? 'Revise Account' : 'New Ledger Entry'}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {selectedAccount
                    ? 'Update operational details for this asset.'
                    : 'Configure and initialize new financial infrastructure.'}
                </DialogDescription>
              </DialogHeader>
              <BankAccountForm account={selectedAccount || undefined} onClose={handleClose} />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Safe Disposal Required"
        description={
          <div className="space-y-3">
            <p className="text-slate-600">
              You are about to decommission the account <strong className="text-slate-900 font-bold">{deleteTarget?.accountName}</strong>.
            </p>
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-xs text-red-700 flex gap-2 items-start">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p>This action is irreversible. Historical transaction data may become orphaned if this account is purged from the registry.</p>
            </div>
          </div>
        }
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        confirmText="Confirm Deletion"
        variant="destructive"
      />

      {error && (
        <div className="fixed bottom-8 right-8 bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10">
          <AlertCircle size={20} />
          <p className="font-bold">Sync error: {error.message}</p>
          <Button size="sm" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

interface DashboardCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  description?: string;
  progress?: number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color: string;
  variants?: any;
}

function DashboardCard({ label, value, subValue, description, progress, icon, trend, color, variants }: DashboardCardProps) {
  return (
    <motion.div variants={variants}>
      <Card className="p-6 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none bg-white shadow-xl shadow-slate-200/50 rounded-[2rem]">
        <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-[0.03] rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150", color.split(' ')[0])} />
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn("p-4 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", color)}>
              {icon}
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-black px-2.5 py-1 rounded-full",
                trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trend.value}
              </div>
            )}
          </div>
          <div className="space-y-1 mt-2">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
            <div className="flex items-baseline gap-2 overflow-hidden">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 truncate">{value}</h2>
              {subValue && <span className="text-xs font-bold text-muted-foreground truncate">{subValue}</span>}
            </div>
            {description && <p className="text-xs text-muted-foreground font-medium">{description}</p>}
            {progress !== undefined && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
