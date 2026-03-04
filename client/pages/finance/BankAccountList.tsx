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
import { formatCurrency } from '@/lib/utils';
import { useAccountList } from '@/api/services/accounts';
import { AccountDto } from '@/types/api/accounts';

export default function BankAccountList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountDto | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { hasPermission } = useAuth();
  const { data: accounts, isLoading } = useAccountList();

  const canCreate = hasPermission('bankAccounts', 'create');
  const canUpdate = hasPermission('bankAccounts', 'update');

  const handleEdit = (account: AccountDto) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
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

      {isLoading ? (
        <div className="p-8 text-center">Loading accounts...</div>
      ) : bankAccounts.length === 0 ? (
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
          itemsPerPage={10}
          resetSortTrigger={refreshTrigger}
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
