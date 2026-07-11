import React, { useState } from 'react';
import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Search,
    User2,
    Plus,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ReceiveBatchFormData, ReceiveItemsFormData, receiveItemsSchema } from '@/lib/schemas';
import {
    getLineReceivingTotal,
    getReceiveLineFieldIssues,
} from '@/lib/receivePurchaseOrderValidation';
import { useReceiveItems } from '@/api/services/purchaseOrders';
import { PurchaseOrder, ReceivePurchaseOrderRequest } from '@/types/api/purchaseOrders';
import { cn } from '@/lib/utils';
import { isApiError } from '@/api/errors';

interface ReceiveItemsFormProps {
    purchaseOrder: PurchaseOrder;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
};

type ReceiveLineCardProps = {
    lineIndex: number;
    control: Control<ReceiveItemsFormData>;
    lineRow: ReceiveItemsFormData['items'][number] | undefined;
    mfgDateDefault: string;
    expDateDefault: string;
};

const ReceiveLineCard: React.FC<ReceiveLineCardProps> = ({
    lineIndex,
    control,
    lineRow,
    mfgDateDefault,
    expDateDefault,
}) => {
    const { fields: batchFields, append, remove } = useFieldArray({
        control,
        name: `items.${lineIndex}.batches`,
    });

    const lineIssues = getReceiveLineFieldIssues(lineRow);
    const receivingTotal = getLineReceivingTotal(lineRow);
    const remaining = Math.max(0, (lineRow?.orderedQuantity ?? 0) - (lineRow?.previouslyReceived ?? 0));
    const lineHasErrors =
        !!lineIssues.lineTotal || lineIssues.batches.some((b) => Object.keys(b).length > 0);

    const addBatchRow = () => {
        const qtyLeft = Math.max(0, remaining - receivingTotal);
        append({
            receivedQuantity: qtyLeft,
            batchNumber: '',
            manufactureDate: qtyLeft > 0 ? mfgDateDefault : '',
            expiryDate: qtyLeft > 0 ? expDateDefault : '',
            notes: '',
        } satisfies ReceiveBatchFormData);
    };

    return (
        <Card
            className={cn(
                'border-primary/5 shadow-sm hover:border-primary/20 transition-all overflow-hidden',
                lineHasErrors && 'border-destructive/40 ring-1 ring-destructive/20'
            )}
        >
            <div className="bg-muted/30 px-3 py-1.5 flex items-center justify-between border-b border-primary/5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-xs font-bold text-foreground truncate max-w-[300px]">
                        {lineRow?.productName}
                    </span>
                    {lineHasErrors && (
                        <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" aria-hidden />
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <Badge variant="secondary" className="text-[9px] h-4 font-bold bg-primary/5 text-primary border-none">
                        Ordered: {lineRow?.orderedQuantity ?? 0}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] h-4 font-bold">
                        Rem: {remaining}
                    </Badge>
                    <Badge
                        variant={receivingTotal > remaining ? 'destructive' : 'outline'}
                        className="text-[9px] h-4 font-bold"
                    >
                        Receiving: {receivingTotal}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-3 bg-muted/5 space-y-3">
                {lineIssues.lineTotal && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                        {lineIssues.lineTotal}
                    </p>
                )}

                {batchFields.map((batchField, batchIndex) => {
                    const batchIssues = lineIssues.batches[batchIndex] ?? {};
                    const batchRow = lineRow?.batches?.[batchIndex];
                    const rqBatch = Math.trunc(Number(batchRow?.receivedQuantity ?? 0));
                    const needsBatchFields = rqBatch > 0;

                    return (
                        <div
                            key={batchField.id}
                            className={cn(
                                'rounded-lg border border-primary/10 bg-background/60 p-2 space-y-2',
                                Object.keys(batchIssues).length > 0 && 'border-destructive/30'
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    Batch {batchIndex + 1}
                                </span>
                                {batchFields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-destructive hover:text-destructive"
                                        onClick={() => remove(batchIndex)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        Remove
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                <FormField
                                    control={control}
                                    name={`items.${lineIndex}.batches.${batchIndex}.receivedQuantity`}
                                    render={({ field }) => {
                                        const qtyInvalid = !!batchIssues.receivedQuantity;
                                        return (
                                            <FormItem className="space-y-1">
                                                <FormLabel
                                                    className={cn(
                                                        'text-[9px] uppercase font-black tracking-wider',
                                                        qtyInvalid
                                                            ? 'text-destructive'
                                                            : 'text-muted-foreground/70'
                                                    )}
                                                >
                                                    Recv Qty
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={1}
                                                        aria-invalid={qtyInvalid}
                                                        {...field}
                                                        value={
                                                            field.value === undefined || field.value === null
                                                                ? ''
                                                                : field.value
                                                        }
                                                        className={cn(
                                                            'h-9 text-sm font-semibold border-primary/10 focus:border-primary/30',
                                                            qtyInvalid &&
                                                                'border-destructive focus-visible:ring-destructive bg-destructive/5'
                                                        )}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            field.onChange(
                                                                v === ''
                                                                    ? 0
                                                                    : Math.max(0, Math.trunc(parseFloat(v) || 0))
                                                            );
                                                        }}
                                                    />
                                                </FormControl>
                                                {batchIssues.receivedQuantity && (
                                                    <p role="alert" className="text-xs font-medium text-destructive">
                                                        {batchIssues.receivedQuantity}
                                                    </p>
                                                )}
                                            </FormItem>
                                        );
                                    }}
                                />

                                <FormField
                                    control={control}
                                    name={`items.${lineIndex}.batches.${batchIndex}.batchNumber`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel
                                                className={cn(
                                                    'text-[9px] uppercase font-black tracking-wider',
                                                    batchIssues.batchNumber || needsBatchFields
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground/70'
                                                )}
                                            >
                                                Batch #
                                                {needsBatchFields && (
                                                    <span className="text-destructive normal-case font-semibold"> *</span>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    aria-invalid={!!batchIssues.batchNumber}
                                                    aria-required={needsBatchFields}
                                                    className={cn(
                                                        'h-9 text-sm border-primary/10 focus:border-primary/30',
                                                        batchIssues.batchNumber &&
                                                            'border-destructive focus-visible:ring-destructive bg-destructive/5'
                                                    )}
                                                    placeholder="BT-..."
                                                />
                                            </FormControl>
                                            {batchIssues.batchNumber && (
                                                <p role="alert" className="text-xs font-medium text-destructive">
                                                    {batchIssues.batchNumber}
                                                </p>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name={`items.${lineIndex}.batches.${batchIndex}.manufactureDate`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel
                                                className={cn(
                                                    'text-[9px] uppercase font-black tracking-wider',
                                                    batchIssues.manufactureDate || needsBatchFields
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground/70'
                                                )}
                                            >
                                                Mfg Date
                                                {needsBatchFields && (
                                                    <span className="text-destructive normal-case font-semibold"> *</span>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    aria-invalid={!!batchIssues.manufactureDate}
                                                    aria-required={needsBatchFields}
                                                    className={cn(
                                                        'h-9 text-sm border-primary/10 focus:border-primary/30',
                                                        batchIssues.manufactureDate &&
                                                            'border-destructive focus-visible:ring-destructive bg-destructive/5'
                                                    )}
                                                />
                                            </FormControl>
                                            {batchIssues.manufactureDate && (
                                                <p role="alert" className="text-xs font-medium text-destructive">
                                                    {batchIssues.manufactureDate}
                                                </p>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name={`items.${lineIndex}.batches.${batchIndex}.expiryDate`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel
                                                className={cn(
                                                    'text-[9px] uppercase font-black tracking-wider',
                                                    batchIssues.expiryDate || needsBatchFields
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground/70'
                                                )}
                                            >
                                                Exp Date
                                                {needsBatchFields && (
                                                    <span className="text-destructive normal-case font-semibold"> *</span>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    aria-invalid={!!batchIssues.expiryDate}
                                                    aria-required={needsBatchFields}
                                                    className={cn(
                                                        'h-9 text-sm border-primary/10 focus:border-primary/30',
                                                        batchIssues.expiryDate &&
                                                            'border-destructive focus-visible:ring-destructive bg-destructive/5'
                                                    )}
                                                />
                                            </FormControl>
                                            {batchIssues.expiryDate && (
                                                <p role="alert" className="text-xs font-medium text-destructive">
                                                    {batchIssues.expiryDate}
                                                </p>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name={`items.${lineIndex}.batches.${batchIndex}.notes`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[9px] uppercase font-black text-muted-foreground/70 tracking-wider">
                                                Note
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="h-8 text-xs border-primary/10 focus:border-primary/30"
                                                    placeholder="..."
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[9px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    );
                })}

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold border-primary/20"
                    onClick={addBatchRow}
                >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add batch
                </Button>
            </CardContent>
        </Card>
    );
};

export const ReceiveItemsForm: React.FC<ReceiveItemsFormProps> = ({
    purchaseOrder,
    onSuccess,
    onCancel,
}) => {
    const receiveItemsMutation = useReceiveItems();
    const [searchQuery, setSearchQuery] = useState('');

    const mfgDateDefault = format(new Date(), 'yyyy-MM-dd');
    const expDateDefault = format(addMonths(new Date(), 3), 'yyyy-MM-dd');

    const form = useForm<ReceiveItemsFormData>({
        resolver: zodResolver(receiveItemsSchema),
        mode: 'onChange',
        defaultValues: {
            purchaseOrderId: purchaseOrder.id,
            actualDeliveryDate: new Date().toISOString().split('T')[0],
            items: purchaseOrder.items.map((item) => {
                const remaining = Math.max(0, item.remainingQuantity);
                return {
                    purchaseOrderItemId: item.id,
                    productName: item.productName,
                    orderedQuantity: item.orderedQuantity,
                    previouslyReceived: item.receivedQuantity,
                    batches: [
                        {
                            receivedQuantity: remaining,
                            batchNumber: '',
                            manufactureDate: remaining > 0 ? mfgDateDefault : '',
                            expiryDate: remaining > 0 ? expDateDefault : '',
                            notes: '',
                        },
                    ],
                };
            }),
        },
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    const purchaseOrderIdW = useWatch({ control: form.control, name: 'purchaseOrderId' });
    const actualDeliveryDateW = useWatch({ control: form.control, name: 'actualDeliveryDate' });
    const watchedItems = useWatch({ control: form.control, name: 'items' }) ?? [];

    const parsedForm = receiveItemsSchema.safeParse({
        purchaseOrderId: purchaseOrderIdW ?? purchaseOrder.id,
        actualDeliveryDate: actualDeliveryDateW ?? '',
        items: watchedItems,
    });

    const blockingMessages = parsedForm.success
        ? []
        : [...new Set(parsedForm.error.issues.map((issue) => issue.message))];

    const hiddenLinesHaveErrors =
        !!searchQuery.trim() &&
        !parsedForm.success &&
        parsedForm.error.issues.some((issue) => {
            const p = issue.path;
            if (p[0] !== 'items' || typeof p[1] !== 'number') return false;
            const idx = p[1] as number;
            const name = watchedItems[idx]?.productName?.toLowerCase() ?? '';
            return !name.includes(searchQuery.trim().toLowerCase());
        });

    const submitBlocked = receiveItemsMutation.isPending || !parsedForm.success;

    const onSubmit = async (data: ReceiveItemsFormData) => {
        try {
            const payload: ReceivePurchaseOrderRequest = {
                purchaseOrderId: data.purchaseOrderId,
                actualDeliveryDate: new Date(`${data.actualDeliveryDate}T12:00:00`).toISOString(),
                items: data.items
                    .map((item) => ({
                        purchaseOrderItemId: item.purchaseOrderItemId,
                        batches: item.batches
                            .filter((batch) => Math.trunc(Number(batch.receivedQuantity)) > 0)
                            .map((batch) => ({
                                receivedQuantity: Math.trunc(Number(batch.receivedQuantity)),
                                batchNumber: batch.batchNumber.trim(),
                                manufactureDate: new Date(`${batch.manufactureDate}T12:00:00`).toISOString(),
                                expiryDate: new Date(`${batch.expiryDate}T12:00:00`).toISOString(),
                                notes: batch.notes?.trim() ?? '',
                            })),
                    }))
                    .filter((item) => item.batches.length > 0),
            };

            const response = await receiveItemsMutation.mutateAsync(payload);

            toast.success(response.message?.trim() ? response.message : 'Goods received and inventory updated.');
            onSuccess?.();
        } catch (error) {
            if (isApiError(error)) {
                toast.error(error.userMessage);
            } else {
                toast.error('Failed to receive goods. Please try again.');
            }
        }
    };

    const visibleCount = fields.filter((_, i) =>
        watchedItems[i]?.productName?.toLowerCase().includes(searchQuery.toLowerCase())
    ).length;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    <motion.div
                        variants={itemVariants}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-primary/5 p-4 rounded-xl border border-primary/10"
                    >
                        <div className="space-y-1">
                            <FormLabel className="flex items-center gap-2 text-primary/70 uppercase text-[10px] font-black tracking-widest">
                                <User2 className="h-3 w-3" />
                                Supplier
                            </FormLabel>
                            <p className="text-lg font-bold text-foreground">{purchaseOrder.supplierName}</p>
                        </div>
                        <FormField
                            control={form.control}
                            name="actualDeliveryDate"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="flex items-center gap-2 text-primary/70 uppercase text-[10px] font-black tracking-widest">
                                        <Calendar className="h-3 w-3" />
                                        Delivery Date
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="h-9 bg-background border-primary/20" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </motion.div>

                    <Separator className="opacity-50" />

                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Package className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Items to Receive</h3>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        Showing {visibleCount} of {fields.length} lines — add one or more batches per
                                        line with different quantities and dates.
                                    </p>
                                </div>
                            </div>

                            <div className="relative group min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search products..."
                                    className="pl-9 h-10 border-primary/10 group-focus-within:border-primary/40 transition-all bg-muted/20 focus:bg-background"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 min-h-[300px]">
                            <AnimatePresence mode="popLayout">
                                {fields.map((field, index) => {
                                    const lineRow = watchedItems[index];
                                    const matchesSearch = lineRow?.productName
                                        ?.toLowerCase()
                                        .includes(searchQuery.toLowerCase());

                                    if (!matchesSearch) return null;

                                    return (
                                        <motion.div
                                            key={field.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ReceiveLineCard
                                                lineIndex={index}
                                                control={form.control}
                                                lineRow={lineRow}
                                                mfgDateDefault={mfgDateDefault}
                                                expDateDefault={expDateDefault}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {visibleCount === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-primary/10"
                                >
                                    <Search className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm font-medium">
                                        No products found matching &quot;{searchQuery}&quot;
                                    </p>
                                    <Button
                                        variant="link"
                                        onClick={() => setSearchQuery('')}
                                        className="text-xs text-primary"
                                    >
                                        Clear search
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <motion.div variants={itemVariants} className="relative flex flex-col gap-3 pt-4">
                        {!parsedForm.success && !receiveItemsMutation.isPending && blockingMessages.length > 0 && (
                            <div
                                role="alert"
                                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                            >
                                <p className="font-semibold">Cannot submit yet</p>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive/95">
                                    {blockingMessages.map((msg) => (
                                        <li key={msg}>{msg}</li>
                                    ))}
                                </ul>
                                <p className="mt-3 text-xs text-destructive/90">
                                    Each batch with quantity greater than zero needs batch number, manufacture date, and
                                    expiry date. Line totals cannot exceed remaining quantity.
                                </p>
                                {hiddenLinesHaveErrors && (
                                    <p className="mt-3 text-sm font-medium text-foreground">
                                        Some errors are on lines hidden by your search.{' '}
                                        <button
                                            type="button"
                                            className="underline text-primary hover:text-primary/90"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            Clear search to show all lines
                                        </button>
                                        .
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                className="flex-1 h-12 text-base font-bold gap-2"
                                disabled={submitBlocked}
                            >
                                {receiveItemsMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        Receive Goods
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 px-8 font-bold"
                                onClick={onCancel}
                                disabled={receiveItemsMutation.isPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            </form>
        </Form>
    );
};
