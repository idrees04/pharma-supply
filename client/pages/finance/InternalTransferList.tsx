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
import { Plus, Edit2, Trash2, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import InternalTransferForm from './InternalTransferForm';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency } from '@/lib/utils';

export default function InternalTransferList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<typeof internalTransfers[0] | null>(null);
  const { hasPermission } = useAuth();
  const internalTransfers = useStore((state) => state.internalTransfers);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const updateInternalTransfer = useStore((state) => state.updateInternalTransfer);
  const deleteInternalTransfer = useStore((state) => state.deleteInternalTransfer);
  const updateBankAccount = useStore((state) => state.updateBankAccount);

  const canCreate = hasPermission('transfers', 'create');
  const canUpdate = hasPermission('transfers', 'update');
  const canDelete = hasPermission('transfers', 'delete');

  const handleEdit = (transfer: typeof internalTransfers[0]) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit transfers');
      return;
    }
    setSelectedTransfer(transfer);
    setIsDialogOpen(true);
  };

  const handleDelete = (transfer: typeof internalTransfers[0]) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete transfers');
      return;
    }
    if (confirm('Are you sure you want to delete this transfer? This will reverse the transaction.')) {
      const fromAccount = bankAccounts.find((a) => a.id === transfer.fromAccountId);
      const toAccount = bankAccounts.find((a) => a.id === transfer.toAccountId);

      if (fromAccount && toAccount) {
        updateBankAccount(fromAccount.id, { balance: fromAccount.balance + transfer.amount });
        updateBankAccount(toAccount.id, { balance: toAccount.balance - transfer.amount });
      }

      deleteInternalTransfer(transfer.id);
      toast.success('Transfer deleted and reversed successfully');
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedTransfer(null);
  };

  const getTotalTransferred = () => {
    return internalTransfers.reduce((sum, t) => sum + t.amount, 0);
  };

  const getAccountName = (accountId: string) => {
    const account = bankAccounts.find((a) => a.id === accountId);
    return account?.accountName || 'Unknown Account';
  };

  const columns = [
    {
      header: 'From Account',
      accessor: (transfer: typeof internalTransfers[0]) => getAccountName(transfer.fromAccountId),
    },
    {
      header: 'To Account',
      accessor: (transfer: typeof internalTransfers[0]) => getAccountName(transfer.toAccountId),
    },
    { header: 'Reference No', accessor: 'referenceNo' as const },
    { header: 'Date', accessor: 'date' as const },
    {
      header: 'Amount',
      accessor: (transfer: typeof internalTransfers[0]) => (
        <div className="font-semibold">{formatCurrency(transfer.amount)}</div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Transfers</h1>
          <p className="text-muted-foreground">Move funds between bank accounts</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedTransfer(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Transfer
          </Button>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <ArrowRightLeft className="w-10 h-10 text-blue-500/50" />
          <div>
            <p className="text-sm text-muted-foreground">Total Transferred</p>
            <p className="text-3xl font-bold">{formatCurrency(getTotalTransferred())}</p>
          </div>
        </div>
      </div>

      {internalTransfers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No transfers yet</h3>
          <p className="text-muted-foreground">Create your first internal transfer</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={internalTransfers}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          itemsPerPage={10}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTransfer ? 'Edit Transfer' : 'New Internal Transfer'}</DialogTitle>
            <DialogDescription>
              {selectedTransfer ? 'Update transfer details' : 'Transfer funds between accounts'}
            </DialogDescription>
          </DialogHeader>
          <InternalTransferForm transfer={selectedTransfer || undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
