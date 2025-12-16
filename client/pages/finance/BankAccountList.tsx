import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, AlertCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import BankAccountForm from './BankAccountForm';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency } from '@/lib/utils';

export default function BankAccountList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<typeof bankAccounts[0] | null>(null);
  const { hasPermission } = useAuth();
  const bankAccounts = useStore((state) => state.bankAccounts);
  const updateBankAccount = useStore((state) => state.updateBankAccount);
  const deleteBankAccount = useStore((state) => state.deleteBankAccount);

  const canCreate = hasPermission('bankAccounts', 'create');
  const canUpdate = hasPermission('bankAccounts', 'update');
  const canDelete = hasPermission('bankAccounts', 'delete');

  const handleEdit = (account: typeof bankAccounts[0]) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit bank accounts');
      return;
    }
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleDelete = (account: typeof bankAccounts[0]) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete bank accounts');
      return;
    }
    if (confirm('Are you sure you want to delete this bank account?')) {
      deleteBankAccount(account.id);
      toast.success('Bank account deleted successfully');
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedAccount(null);
  };

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const columns = [
    { header: 'Account Name', accessor: 'accountName' as const },
    { header: 'Bank', accessor: 'bankName' as const },
    { header: 'Account No', accessor: 'accountNo' as const },
    { header: 'Type', accessor: 'accountType' as const },
    {
      header: 'Balance',
      accessor: (account: typeof bankAccounts[0]) => (
        <div className="font-semibold text-green-600">{formatCurrency(account.balance)}</div>
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

      {bankAccounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No bank accounts yet</h3>
          <p className="text-muted-foreground">Add your first bank account to get started</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={bankAccounts}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          itemsPerPage={10}
        />
      )}

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
    </div>
  );
}
