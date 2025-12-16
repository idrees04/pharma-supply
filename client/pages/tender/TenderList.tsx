import { useState } from 'react';
import { useStore, Tender } from '@/hooks/useStore';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TenderForm from './TenderForm';
import { formatCurrency } from '@/lib/utils';

export default function TenderList() {
  const { tenders, deleteTender } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<string | null>(null);

  const filteredTenders = tenders.filter(
    (tender) =>
      tender.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.pvmsNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Tender>[] = [
    {
      header: 'PVMS No',
      accessor: 'pvmsNo',
    },
    {
      header: 'Generic Name',
      accessor: 'genericName',
    },
    {
      header: 'Brand Name',
      accessor: 'brandName',
    },
    {
      header: 'Type',
      accessor: 'type',
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Offer Price',
      accessor: (row) => formatCurrency(row.offerPrice),
    },
    {
      header: 'Discount',
      accessor: (row) => `${row.discountOffered}%`,
      className: 'hidden sm:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tender Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all tender quotations and prices</p>
        </div>
        <Button
          onClick={() => {
            setSelectedTender(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Tender
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by generic name, brand name, or PVMS no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tenders" value={tenders.length.toString()} />
        <StatCard label="Filtered Results" value={filteredTenders.length.toString()} />
        <StatCard label="Avg Offer Price" value={formatCurrency(
          tenders.length > 0 ? tenders.reduce((sum, t) => sum + t.offerPrice, 0) / tenders.length : 0
        )} />
        <StatCard label="GST Applicable" value={tenders.filter(t => t.gstApplicable).length.toString()} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={filteredTenders}
          onEdit={(tender) => {
            setSelectedTender(tender);
            setIsFormOpen(true);
          }}
          onDelete={(tender) => setIsDeleteConfirming(tender.id)}
          emptyMessage="No tenders found. Create your first tender to get started."
        />
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTender ? 'Edit Tender' : 'Create New Tender'}</DialogTitle>
            <DialogDescription>
              {selectedTender ? 'Update tender details' : 'Add a new tender to the system'}
            </DialogDescription>
          </DialogHeader>
          <TenderForm
            initialData={selectedTender || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedTender(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {isDeleteConfirming && (
        <Dialog open={!!isDeleteConfirming} onOpenChange={() => setIsDeleteConfirming(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tender</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this tender? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteTender(isDeleteConfirming);
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
