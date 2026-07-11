import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    Save,
    Loader2,
    Calendar,
    MapPin,
    StickyNote,
    XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';

import { updatePurchaseOrderSchema, UpdatePurchaseOrderFormData } from '@/lib/schemas';
import {
    useUpdatePurchaseOrder,
    useCancelPurchaseOrder,
} from '@/api/services/purchaseOrders';
import { PurchaseOrder, UpdatePurchaseOrderRequest } from '@/types/api/purchaseOrders';
import {
    canCancelPurchaseOrder,
    getPurchaseOrderStatusClassName,
    getPurchaseOrderStatusLabel,
} from '@/lib/purchaseOrderStatusDisplay';
import { cn } from '@/lib/utils';

interface UpdatePurchaseOrderFormProps {
    purchaseOrder: PurchaseOrder;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function UpdatePurchaseOrderForm({
    purchaseOrder,
    onSuccess,
    onCancel
}: UpdatePurchaseOrderFormProps) {
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const { mutate: updatePO, isPending: isUpdating } = useUpdatePurchaseOrder(purchaseOrder.id);
    const { mutate: cancelPO, isPending: isCancelling } = useCancelPurchaseOrder(purchaseOrder.id);
    const canCancel = canCancelPurchaseOrder(purchaseOrder.status);

    const form = useForm<UpdatePurchaseOrderFormData>({
        resolver: zodResolver(updatePurchaseOrderSchema),
        defaultValues: {
            expectedDeliveryDate: purchaseOrder.expectedDeliveryDate?.split('T')[0] ?? '',
            deliveryAddress: purchaseOrder.deliveryAddress,
            notes: purchaseOrder.notes || '',
        },
    });

    const onSubmit = (data: UpdatePurchaseOrderFormData) => {
        const updateData: UpdatePurchaseOrderRequest = {
            expectedDeliveryDate: data.expectedDeliveryDate,
            deliveryAddress: data.deliveryAddress,
            notes: data.notes || '',
        };

        updatePO(updateData, {
            onSuccess: () => {
                toast.success('Purchase order updated successfully');
                onSuccess?.();
            },
            onError: (error: any) => {
                toast.error(error?.userMessage || 'Failed to update purchase order');
            },
        });
    };

    const handleCancelOrder = () => {
        cancelPO(undefined, {
            onSuccess: () => {
                toast.success('Purchase order cancelled');
                setIsCancelDialogOpen(false);
                onSuccess?.();
            },
            onError: (error: any) => {
                toast.error(error?.userMessage || 'Failed to cancel purchase order');
            },
        });
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        <motion.div variants={itemVariants} className="flex items-center justify-between gap-3 rounded-xl border bg-slate-50 p-4">
                            <div>
                                <p className="text-xs font-bold uppercase text-muted-foreground">Current status</p>
                                <Badge className={cn('mt-1 font-bold', getPurchaseOrderStatusClassName(purchaseOrder.status))}>
                                    {getPurchaseOrderStatusLabel(purchaseOrder.status)}
                                </Badge>
                            </div>
                            {canCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                                    onClick={() => setIsCancelDialogOpen(true)}
                                >
                                    <XCircle className="h-4 w-4" />
                                    Cancel order
                                </Button>
                            )}
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="expectedDeliveryDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Expected Delivery
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                className="h-11 border-muted-foreground/20 focus-visible:ring-primary"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="deliveryAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Delivery Address
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter full delivery destination"
                                                {...field}
                                                className="h-11 border-muted-foreground/20 focus-visible:ring-primary"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                            <StickyNote className="h-3 w-3" /> Special Instructions
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Any specific requirements or notes for the supplier..."
                                                {...field}
                                                className="min-h-[100px] border-muted-foreground/20 focus-visible:ring-primary resize-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="flex items-center justify-end gap-3 pt-4"
                        >
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="h-11 px-6 rounded-lg hover:bg-muted transition-colors"
                            >
                                Close
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="h-11 px-8 rounded-lg shadow-md hover:shadow-lg transition-all gap-2 font-bold"
                            >
                                {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {isUpdating ? 'Updating...' : 'Save Changes'}
                            </Button>
                        </motion.div>
                    </motion.div>
                </form>
            </Form>

            <ConfirmDialog
                open={isCancelDialogOpen}
                onOpenChange={setIsCancelDialogOpen}
                title="Cancel purchase order"
                description={
                    <span>
                        Cancel purchase order
                        <span className="font-semibold text-foreground"> {purchaseOrder.purchaseOrderNumber} </span>?
                        You will not be able to receive goods or pay the supplier after cancellation.
                    </span>
                }
                onConfirm={handleCancelOrder}
                isLoading={isCancelling}
                confirmText="Cancel order"
                variant="destructive"
            />
        </>
    );
}
