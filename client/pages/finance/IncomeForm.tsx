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
import { useCreateIncome, useUpdateIncome, useIncome } from '@/api/services/incomes';
import { useIncomeCategories } from '@/api/services/incomeCategories';
import { useAccountList } from '@/api/services/accounts';
import type { CreateIncomeRequest, UpdateIncomeRequest } from '@/types/api/incomes';
import { IncomeStatus } from '@/types/api/incomes';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

const createSchema = z.object({
  incomeCategoryId: z.coerce.number().min(1, 'Select a category'),
  accountId: z.coerce.number().min(1, 'Select an account'),
  incomeDate: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  referenceNumber: z.string(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string(),
});

const editSchema = z.object({
  incomeCategoryId: z.coerce.number().min(1, 'Select a category'),
  accountId: z.coerce.number().min(1, 'Select an account'),
  incomeDate: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string(),
  status: z.nativeEnum(IncomeStatus),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface IncomeFormProps {
  incomeId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function IncomeForm({ incomeId, onSuccess, onCancel }: IncomeFormProps) {
  const isEdit = Boolean(incomeId && incomeId > 0);
  const { data: income, isPending: loadingIncome } = useIncome(isEdit ? incomeId! : null);
  const { data: categories } = useIncomeCategories();
  const { data: accounts } = useAccountList();

  const { mutate: createIncome, isPending: creating } = useCreateIncome();
  const { mutate: updateIncome, isPending: updating } = useUpdateIncome(incomeId || 0);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      incomeCategoryId: 0,
      accountId: 0,
      incomeDate: new Date().toISOString().split('T')[0],
      amount: 0,
      referenceNumber: '',
      description: '',
      notes: '',
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      incomeCategoryId: 0,
      accountId: 0,
      incomeDate: new Date().toISOString().split('T')[0],
      amount: 0,
      description: '',
      notes: '',
      status: IncomeStatus.Pending,
    },
  });

  useEffect(() => {
    if (!income || !isEdit) return;
    if (income.status !== IncomeStatus.Pending) return;
    const d = income.incomeDate ? new Date(income.incomeDate).toISOString().split('T')[0] : '';
    editForm.reset({
      incomeCategoryId: income.incomeCategoryId,
      accountId: income.accountId,
      incomeDate: d,
      amount: income.amount,
      description: income.description ?? '',
      notes: income.notes ?? '',
      status: income.status,
    });
  }, [income, isEdit, editForm]);

  const onCreate = (v: CreateValues) => {
    const payload: CreateIncomeRequest = {
      incomeDate: new Date(v.incomeDate).toISOString(),
      incomeCategoryId: v.incomeCategoryId,
      amount: v.amount,
      description: v.description.trim(),
      accountId: v.accountId,
      referenceNumber: v.referenceNumber.trim(),
      notes: v.notes.trim(),
    };
    createIncome(payload, {
      onSuccess: () => {
        toast.success('Income recorded');
        onSuccess();
      },
      onError: (e) => toast.error(e.userMessage || 'Could not create income'),
    });
  };

  const onEdit = (v: EditValues) => {
    if (!incomeId) return;
    const payload: UpdateIncomeRequest = {
      incomeDate: new Date(v.incomeDate).toISOString(),
      incomeCategoryId: v.incomeCategoryId,
      amount: v.amount,
      description: v.description.trim(),
      accountId: v.accountId,
      status: v.status,
      notes: v.notes.trim(),
    };
    updateIncome(payload, {
      onSuccess: () => {
        toast.success('Income updated');
        onSuccess();
      },
      onError: (e) => toast.error(e.userMessage || 'Could not update income'),
    });
  };

  if (isEdit && loadingIncome) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Loading income…</div>;
  }

  if (isEdit && income && income.status !== IncomeStatus.Pending) {
    return (
      <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">This income cannot be edited</p>
          <p className="mt-1 text-amber-800">
            Only income in <strong>Pending</strong> status can be changed. Received income is locked after posting.
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
              name="incomeCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
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
                  <FormLabel>Deposit to account *</FormLabel>
                  <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
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
                  <FormDescription className="text-xs">Amount will be added to this account balance.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={createForm.control}
              name="incomeDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income date *</FormLabel>
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
                  <FormLabel>Amount (PKR) *</FormLabel>
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
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference number</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="e.g. Deposit slip / Ref" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input className="h-11" placeholder="Short description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={createForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Optional notes…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Saving…' : 'Record income'}
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
            name="incomeCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
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
            control={editForm.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account *</FormLabel>
                <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={editForm.control}
            name="incomeDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Income date *</FormLabel>
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
                <FormLabel>Amount (PKR) *</FormLabel>
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
                <Input className="h-11" {...field} />
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
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

