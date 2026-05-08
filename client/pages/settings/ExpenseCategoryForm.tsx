import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { ReactNode } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useExpenseCategory,
} from '@/api/services/expenseCategories';
import type {
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
} from '@/types/api/expenseCategories';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/** Matches backend entity limits (ExpenseCategory). */
const NAME_MAX = 200;
const CODE_MAX = 100;
const DESC_MAX = 500;

/** Backend expects string fields in JSON — use "" not null for empty optional text. */
function normalizeStrings(code: string | undefined, description: string | undefined) {
  return {
    categoryCode: (code ?? '').trim(),
    description: (description ?? '').trim(),
  };
}

const baseFieldsSchema = z.object({
  categoryName: z
    .string()
    .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`)
    .refine((s) => s.trim().length > 0, 'Category name is required'),
  categoryCode: z.string().max(CODE_MAX, `Code must be at most ${CODE_MAX} characters`),
  description: z.string().max(DESC_MAX, `Description must be at most ${DESC_MAX} characters`),
  displayOrder: z.coerce
    .number({ invalid_type_error: 'Enter a valid number' })
    .int('Use a whole number')
    .min(0, 'Must be 0 or greater')
    .max(999_999, 'Value is too large'),
});

const editSchema = baseFieldsSchema.extend({
  isActive: z.boolean(),
});

type CreateFormData = z.infer<typeof baseFieldsSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface ExpenseCategoryFormProps {
  categoryId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function FieldLabel({
  children,
  required,
  optional,
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  htmlFor?: string;
}) {
  return (
    <FormLabel
      htmlFor={htmlFor}
      className={cn('flex flex-wrap items-baseline gap-x-1.5 gap-y-0')}
    >
      <span>{children}</span>
      {required ? (
        <span className="text-destructive" title="Required" aria-hidden>
          *
        </span>
      ) : null}
      {optional ? (
        <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">(optional)</span>
      ) : null}
    </FormLabel>
  );
}

export default function ExpenseCategoryForm({
  categoryId,
  onSuccess,
  onCancel,
}: ExpenseCategoryFormProps) {
  const isEdit = Boolean(categoryId);
  const { data: category, isLoading: isLoadingCategory } = useExpenseCategory(categoryId || null);
  const { mutate: createCategory, isPending: isCreating } = useCreateExpenseCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateExpenseCategory(categoryId || 0);

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(baseFieldsSchema),
    mode: 'onBlur',
    defaultValues: {
      categoryName: '',
      categoryCode: '',
      description: '',
      displayOrder: 0,
    },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur',
    defaultValues: {
      categoryName: '',
      categoryCode: '',
      description: '',
      displayOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!category || !isEdit) return;
    editForm.reset({
      categoryName: category.categoryName,
      categoryCode: category.categoryCode ?? '',
      description: category.description ?? '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
  }, [category, isEdit, editForm]);

  const onSubmitCreate = (data: CreateFormData) => {
    const { categoryCode, description } = normalizeStrings(data.categoryCode, data.description);
    const payload: CreateExpenseCategoryRequest = {
      categoryName: data.categoryName.trim(),
      categoryCode,
      description,
      displayOrder: Number.isFinite(data.displayOrder) ? data.displayOrder : 0,
    };
    createCategory(payload, {
      onSuccess: () => {
        toast.success('Category created');
        onSuccess();
      },
      onError: (err) => toast.error(err.userMessage || 'Could not create category'),
    });
  };

  const onSubmitEdit = (data: EditFormData) => {
    const { categoryCode, description } = normalizeStrings(data.categoryCode, data.description);
    const payload: UpdateExpenseCategoryRequest = {
      categoryName: data.categoryName.trim(),
      categoryCode,
      description,
      displayOrder: Number.isFinite(data.displayOrder) ? data.displayOrder : 0,
      isActive: data.isActive,
    };
    updateCategory(payload, {
      onSuccess: () => {
        toast.success('Category updated');
        onSuccess();
      },
      onError: (err) => toast.error(err.userMessage || 'Could not update category'),
    });
  };

  if (isEdit && isLoadingCategory) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!isEdit) {
    return (
      <Form {...createForm}>
        <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-5" noValidate>
          <p className="text-xs text-muted-foreground" aria-hidden>
            <span className="text-destructive">*</span> Required fields must be filled before saving.
          </p>

          <FormField
            control={createForm.control}
            name="categoryName"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required htmlFor="ec-name">
                  Category name
                </FieldLabel>
                <FormControl>
                  <Input
                    id="ec-name"
                    placeholder="e.g. Travel & transport"
                    className="h-11"
                    autoComplete="off"
                    required
                    aria-required="true"
                    maxLength={NAME_MAX}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs tabular-nums">{NAME_MAX} characters max</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={createForm.control}
              name="categoryCode"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel optional htmlFor="ec-code">
                    Code
                  </FieldLabel>
                  <FormControl>
                    <Input
                      id="ec-code"
                      placeholder="e.g. TRV"
                      className="h-11 font-mono text-sm"
                      autoComplete="off"
                      maxLength={CODE_MAX}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Short label for reports ({CODE_MAX} chars max).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required htmlFor="ec-order">
                    Display order
                  </FieldLabel>
                  <FormControl>
                    <Input
                      id="ec-order"
                      type="number"
                      min={0}
                      step={1}
                      className="h-11 tabular-nums"
                      required
                      aria-required="true"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Lower numbers appear first (≥ 0).</FormDescription>
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
                <FieldLabel optional htmlFor="ec-desc">
                  Description
                </FieldLabel>
                <FormControl>
                  <Textarea
                    id="ec-desc"
                    placeholder="What expenses belong in this category?"
                    className="min-h-[88px] resize-y"
                    maxLength={DESC_MAX}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Optional. Empty is sent as blank text for the API. {DESC_MAX} characters max.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <p className="text-xs leading-relaxed text-muted-foreground">
            New categories are saved as <span className="font-medium text-foreground">active</span>. To hide one
            later, edit it and turn off Active.
          </p>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-10 sm:min-w-[100px]" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="h-10 sm:min-w-[120px]" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create category'}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-5" noValidate>
        <p className="text-xs text-muted-foreground" aria-hidden>
          <span className="text-destructive">*</span> Required fields must be filled before saving.
        </p>

        <FormField
          control={editForm.control}
          name="categoryName"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required htmlFor="ec-edit-name">
                Category name
              </FieldLabel>
              <FormControl>
                <Input
                  id="ec-edit-name"
                  className="h-11"
                  required
                  aria-required="true"
                  maxLength={NAME_MAX}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">{NAME_MAX} characters max</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={editForm.control}
            name="categoryCode"
            render={({ field }) => (
              <FormItem>
                <FieldLabel optional htmlFor="ec-edit-code">
                  Code
                </FieldLabel>
                <FormControl>
                  <Input id="ec-edit-code" className="h-11 font-mono text-sm" maxLength={CODE_MAX} {...field} />
                </FormControl>
                <FormDescription className="text-xs">{CODE_MAX} characters max</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required htmlFor="ec-edit-order">
                  Display order
                </FieldLabel>
                <FormControl>
                  <Input
                    id="ec-edit-order"
                    type="number"
                    min={0}
                    step={1}
                    className="h-11 tabular-nums"
                    required
                    aria-required="true"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">Must be ≥ 0</FormDescription>
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
              <FieldLabel optional htmlFor="ec-edit-desc">
                Description
              </FieldLabel>
              <FormControl>
                <Textarea
                  id="ec-edit-desc"
                  className="min-h-[88px] resize-y"
                  maxLength={DESC_MAX}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">Optional. {DESC_MAX} characters max.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between gap-4 rounded-xl border bg-muted/30 p-4">
              <div className="space-y-1">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  When off, this category is hidden from lists and expense category pickers until turned back on.
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-10 sm:min-w-[100px]" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="h-10 sm:min-w-[120px]" disabled={isUpdating}>
            {isUpdating ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
