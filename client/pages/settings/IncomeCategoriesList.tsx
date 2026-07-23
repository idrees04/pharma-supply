import React, { useMemo, useState } from 'react';
import { Plus, AlertCircle, Search, Tags, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DataTable, Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import IncomeCategoryForm from './IncomeCategoryForm';
import { useIncomeCategories, useDeleteIncomeCategory } from '@/api/services/incomeCategories';
import type { IncomeCategory } from '@/types/api/incomeCategories';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

export default function IncomeCategoriesList() {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [categoryToDelete, setCategoryToDelete] = useState<IncomeCategory | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canCreate = hasPermission('incomeCategories', 'create');
  const canUpdate = hasPermission('incomeCategories', 'update');
  const canDelete = hasPermission('incomeCategories', 'delete');

  const {
    data: categories = [],
    isPending: isLoading,
    error,
  } = useIncomeCategories();

  const deleteCategoryMutation = useDeleteIncomeCategory();

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.categoryName.toLowerCase().includes(q) ||
        (c.categoryCode?.toLowerCase().includes(q) ?? false) ||
        (c.description?.toLowerCase().includes(q) ?? false),
    );
  }, [categories, searchTerm]);

  const columns: Column<IncomeCategory>[] = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'id',
        className: 'w-14 text-muted-foreground tabular-nums',
      },
      {
        header: 'Name',
        accessor: (row) => <span className="font-semibold text-foreground">{row.categoryName}</span>,
      },
      {
        header: 'Code',
        accessor: (row) => <span className="font-mono text-xs text-muted-foreground">{row.categoryCode || '—'}</span>,
      },
      {
        header: 'Description',
        accessor: (row) => {
          const d = row.description?.trim();
          if (!d) return <span className="text-muted-foreground">—</span>;
          const short = d.length > 48 ? `${d.slice(0, 48)}…` : d;
          return (
            <span className="max-w-[240px] truncate text-sm text-muted-foreground" title={d}>
              {short}
            </span>
          );
        },
        mobileHidden: true,
      },
      {
        header: 'Order',
        accessor: (row) => <span className="tabular-nums text-sm text-muted-foreground">{row.displayOrder}</span>,
        className: 'w-20 text-right',
      },
    ],
    [],
  );

  const handleEdit = (category: IncomeCategory) => {
    setSelectedCategoryId(category.id);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category: IncomeCategory) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    deleteCategoryMutation.mutate(categoryToDelete.id, {
      onSuccess: () => {
        toast.success('Category removed');
        setIsDeleteOpen(false);
        setCategoryToDelete(null);
      },
      onError: (err) => {
        toast.error(err.userMessage || 'Failed to delete category');
      },
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCategoryId(undefined);
    setRefreshTrigger((n) => n + 1);
  };

  const handleCreate = () => {
    setSelectedCategoryId(undefined);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedCategoryId(undefined);
      setRefreshTrigger((n) => n + 1);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Income categories</h1>
            <p className="text-muted-foreground">Classify incoming amounts</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
          <h3 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-300">Could not load categories</h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {(error as { userMessage?: string }).userMessage || 'Request failed'}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income categories</h1>
          <p className="text-muted-foreground">
            Only <span className="font-medium text-foreground">active</span> categories are listed (
            <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /api/IncomeCategories</code>
            ). Set inactive on edit to hide a category from pickers and this list.
          </p>
        </div>
        {canCreate ? (
          <Button onClick={handleCreate} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KPIBox label="Active categories" value={categories.length} icon={<Tags className="h-4 w-4" />} accent="bg-primary" />
        {searchTerm.trim() ? (
          <KPIBox label="Matching search" value={filteredCategories.length} icon={<Filter className="h-4 w-4" />} accent="bg-muted/500" />
        ) : null}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search name, code, or description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 border-border bg-muted/50 pl-10 focus:bg-background"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredCategories}
          isLoading={isLoading}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          itemsPerPage={ITEMS_PER_PAGE}
          emptyMessage={searchTerm.trim() ? 'No categories match your search.' : 'No categories yet. Add one to classify income.'}
          showSearch={false}
          showToolbar={false}
          showColumnVisibility={false}
          resetSortTrigger={refreshTrigger}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={cn('gap-0 overflow-hidden p-0 sm:max-w-lg', !selectedCategoryId && 'sm:max-w-[480px]')}>
          <div className="border-b bg-muted/40 px-6 py-4">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {selectedCategoryId ? 'Edit income category' : 'New income category'}
              </DialogTitle>
              <DialogDescription className="text-sm leading-snug">
                {selectedCategoryId
                  ? 'Change details or deactivate to hide from lists and income forms.'
                  : 'Add a label for grouping income. Required API fields are sent even when optional on screen.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="max-h-[min(72vh,560px)] overflow-y-auto px-6 py-5">
            <IncomeCategoryForm categoryId={selectedCategoryId} onSuccess={handleCloseDialog} onCancel={() => handleDialogOpenChange(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Remove category"
        description={
          <span>
            Soft-delete <span className="font-semibold">{categoryToDelete?.categoryName}</span>? It will no longer appear in lists.
          </span>
        }
        onConfirm={confirmDelete}
        isLoading={deleteCategoryMutation.isPending}
        confirmText="Remove"
        variant="destructive"
      />
    </div>
  );
}

function KPIBox({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <Card className="relative overflow-hidden p-4 transition-all hover:shadow-md">
      <div
        className={cn(
          'absolute -right-8 -top-8 h-16 w-16 rounded-full opacity-[0.06] transition-transform duration-500 group-hover:scale-150',
          accent,
        )}
      />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
}

