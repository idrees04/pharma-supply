import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, CreditCard, Plus } from 'lucide-react';
import BankAccountForm from './BankAccountForm';
import { DataTable, Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import { useAccountList, useDeleteAccount } from '@/api/services/accounts';
import { AccountDto } from '@/types/api/accounts';
import { toast } from 'sonner';

export default function BankAccountList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountDto | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AccountDto | null>(null);
  const { hasPermission } = useAuth();
  const { data: accounts, isLoading } = useAccountList();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();

  const canCreate = hasPermission('bankAccounts', 'create');
  const canUpdate = hasPermission('bankAccounts', 'update');
  const canDelete = hasPermission('bankAccounts', 'delete');

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
      onError: (error) => {
        toast.error(`Failed to delete account: ${error.message}`);
      },
    });
  };

  const handleClose = () => {
    if (!selectedAccount) {
      setRefreshTrigger(prev => prev + 1);
    }
    setIsDialogOpen(false);
    setSelectedAccount(null);
  };

  const bankAccounts = accounts || [];
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  const columns: Column<AccountDto>[] = [
    { header: 'ID', accessor: 'id', className: 'w-[80px]' },
    { header: 'Account Name', accessor: 'accountName' },
    { header: 'Bank', accessor: 'bankName' },
    { header: 'Account No', accessor: 'accountNumber' },
    { header: 'Type', accessor: 'accountType' },
    {
      header: 'Balance',
      accessor: (account: AccountDto) => (
        <div className="font-semibold text-green-600">{formatCurrency(account.currentBalance)}</div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage cash and bank accounts</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedAccount(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        )}
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <CreditCard className="w-10 h-10 text-primary/50" />
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>


      <DataTable
        columns={columns}
        data={bankAccounts}
        isLoading={isLoading}
        onEdit={canUpdate ? handleEdit : undefined}
        onDelete={canDelete ? handleDeleteRequest : undefined}
        itemsPerPage={10}
        showSearch={true}
        emptyMessage="No bank accounts found matching your search."
        resetSortTrigger={refreshTrigger}
      />
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAccount ? 'Edit Bank Account' : 'Add New Bank Account'}</DialogTitle>
            <DialogDescription>
              {selectedAccount ? 'Update bank account details' : 'Register a new bank or cash account'}
            </DialogDescription>
          </DialogHeader>
          <BankAccountForm account={selectedAccount || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Bank Account"
        description={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.accountName}</strong>?
            This action cannot be undone and will permanently remove this account record.
          </>
        }
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        confirmText="Delete Account"
        variant="destructive"
      />
    </div>
  );
}
