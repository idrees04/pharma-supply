import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateExpense, useUpdateExpense, useExpense } from '@/api/services/expenses';
import { useExpenseCategories } from '@/api/services/expenseCategories';
import { useAccountList } from '@/api/services/accounts';
import type { CreateExpenseRequest, UpdateExpenseRequest } from '@/types/api/expenses';
import { ExpenseStatus } from '@/types/api/expenses';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

const createSchema = z.object({
  expenseCategoryId: z.coerce.number().min(1, 'Select a category'),
  accountId: z.coerce.number().min(1, 'Select an account'),
  expenseDate: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payeeName: z.string(),
  referenceNumber: z.string(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string(),
});

/** PUT body does not include payee/reference — backend UpdateExpenseDto omits them */
const editSchema = z.object({
  expenseCategoryId: z.coerce.number().min(1, 'Select a category'),
  accountId: z.coerce.number().min(1, 'Select an account'),
  expenseDate: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string(),
  status: z.nativeEnum(ExpenseStatus),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface ExpenseFormProps {
  expenseId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ExpenseForm({ expenseId, onSuccess, onCancel }: ExpenseFormProps) {
  const isEdit = Boolean(expenseId && expenseId > 0);
  const { data: expense, isPending: loadingExpense } = useExpense(isEdit ? expenseId! : null);
  const { data: categories } = useExpenseCategories();
  const { data: accounts } = useAccountList();

  const { mutate: createExpense, isPending: creating } = useCreateExpense();
  const { mutate: updateExpense, isPending: updating } = useUpdateExpense(expenseId || 0);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      expenseCategoryId: 0,
      accountId: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      payeeName: '',
      referenceNumber: '',
      description: '',
      notes: '',
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      expenseCategoryId: 0,
      accountId: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      description: '',
      notes: '',
      status: ExpenseStatus.Pending,
    },
  });

  useEffect(() => {
    if (!expense || !isEdit) return;
    if (expense.status !== ExpenseStatus.Pending) return;
    const d = expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : '';
    editForm.reset({
      expenseCategoryId: expense.expenseCategoryId,
      accountId: expense.accountId,
      expenseDate: d,
      amount: expense.amount,
      description: expense.description ?? '',
      notes: expense.notes ?? '',
      status: expense.status,
    });
  }, [expense, isEdit, editForm]);

  const onCreate = (v: CreateValues) => {
    const payload: CreateExpenseRequest = {
      expenseDate: new Date(v.expenseDate).toISOString(),
      expenseCategoryId: v.expenseCategoryId,
      amount: v.amount,
      description: v.description.trim(),
      accountId: v.accountId,
      payeeName: v.payeeName.trim(),
      referenceNumber: v.referenceNumber.trim(),
      notes: v.notes.trim(),
    };
    createExpense(payload, {
      onSuccess: () => {
        toast.success('Expense recorded');
        onSuccess();
      },
      onError: (e) => toast.error(e.userMessage || 'Could not create expense'),
    });
  };

  const onEdit = (v: EditValues) => {
    if (!expenseId) return;
    const payload: UpdateExpenseRequest = {
      expenseDate: new Date(v.expenseDate).toISOString(),
      expenseCategoryId: v.expenseCategoryId,
      amount: v.amount,
      description: v.description.trim(),
      accountId: v.accountId,
      status: v.status,
      notes: v.notes.trim(),
    };
    updateExpense(payload, {
      onSuccess: () => {
        toast.success('Expense updated');
        onSuccess();
      },
      onError: (e) => toast.error(e.userMessage || 'Could not update expense'),
    });
  };

  if (isEdit && loadingExpense) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Loading expense…</div>;
  }

  if (isEdit && expense && expense.status !== ExpenseStatus.Pending) {
    return (
      <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">This expense cannot be edited</p>
          <p className="mt-1 text-amber-800">
            Only expenses in <strong>Pending</strong> status can be changed. Paid expenses are locked after posting.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (!isEdit) {
    return (
      <Form {...createForm}>
        <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={createForm.control}
              name="expenseCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay from account *</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">Balance must cover the amount.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={createForm.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense date *</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} className="h-11 tabular-nums" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={createForm.control}
              name="payeeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payee</FormLabel>
                  <FormControl>
                    <Input placeholder="Who was paid" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice / ref #" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={createForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="What this expense was for" className="min-h-[88px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional notes (not on voucher)" className="min-h-[72px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Saving…' : 'Record expense'}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={editForm.control}
            name="expenseCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account *</FormLabel>
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts?.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={editForm.control}
            name="expenseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} className="h-11 tabular-nums" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={editForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea className="min-h-[88px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal notes</FormLabel>
              <FormControl>
                <Textarea className="min-h-[72px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v) as ExpenseStatus)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={String(ExpenseStatus.Pending)}>Pending</SelectItem>
                  <SelectItem value={String(ExpenseStatus.Cancelled)}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">Pending expenses can be edited or cancelled.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={updating}>
            {updating ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
