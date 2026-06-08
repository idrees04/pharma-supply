import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncomeCategories } from '@/api/services/incomeCategories';
import { useAccountList } from '@/api/services/accounts';
import { post } from '@/api/requests';
import type { ApiResponse } from '@/types/api/common';
import type { CreateIncomeRequest } from '@/types/api/incomes';
import { toast } from 'sonner';

interface BulkLine extends CreateIncomeRequest {
  key: string;
}

interface BulkIncomeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BulkIncomeForm({ onSuccess, onCancel }: BulkIncomeFormProps) {
  const { data: categories } = useIncomeCategories();
  const { data: accounts } = useAccountList();
  const [sharedDate, setSharedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sharedAccountId, setSharedAccountId] = useState('');
  const [lines, setLines] = useState<BulkLine[]>([
    {
      key: '1',
      incomeCategoryId: 0,
      accountId: 0,
      incomeDate: sharedDate,
      amount: 0,
      referenceNumber: '',
      description: '',
      notes: '',
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        incomeCategoryId: 0,
        accountId: Number(sharedAccountId) || 0,
        incomeDate: sharedDate,
        amount: 0,
        referenceNumber: '',
        description: '',
        notes: '',
      },
    ]);
  };

  const updateLine = (key: string, patch: Partial<BulkLine>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.key !== key)));
  };

  const handleSubmit = async () => {
    const accountId = Number(sharedAccountId);
    if (!accountId) {
      toast.error('Select a shared account');
      return;
    }
    const items = lines.map(({ key: _k, ...line }) => ({
      ...line,
      accountId,
      incomeDate: new Date(sharedDate).toISOString(),
      incomeCategoryId: Number(line.incomeCategoryId),
      amount: Number(line.amount),
    }));
    if (items.some((l) => !l.incomeCategoryId || !l.description || l.amount <= 0)) {
      toast.error('Each row needs category, description, and amount');
      return;
    }
    setSubmitting(true);
    try {
      const res = await post<ApiResponse<number>, { items: CreateIncomeRequest[] }>(
        '/api/Incomes/bulk',
        { items },
      );
      toast.success(res.message ?? `${res.data} income(s) created`);
      onSuccess();
    } catch {
      toast.error('Bulk income creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Shared date</Label>
          <Input type="date" value={sharedDate} onChange={(e) => setSharedDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Shared account</Label>
          <Select value={sharedAccountId} onValueChange={setSharedAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {(accounts ?? []).map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {lines.map((line, idx) => (
          <div key={line.key} className="grid gap-2 rounded-lg border p-3 md:grid-cols-6">
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={line.incomeCategoryId ? String(line.incomeCategoryId) : ''}
                onValueChange={(v) => updateLine(line.key, { incomeCategoryId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={line.amount || ''}
                onChange={(e) => updateLine(line.key, { amount: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                value={line.description}
                onChange={(e) => updateLine(line.key, { description: e.target.value })}
              />
            </div>
            <div className="flex items-end justify-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(line.key)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="md:col-span-6 text-xs text-muted-foreground">Row {idx + 1}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={addLine} className="gap-2">
          <Plus className="h-4 w-4" />
          Add row
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          Save all
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
