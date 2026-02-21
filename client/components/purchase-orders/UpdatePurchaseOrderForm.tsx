import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Save,
    Loader2,
    Calendar,
    MapPin,
    StickyNote,
    Activity,
    CheckCircle2,
    X
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { updatePurchaseOrderSchema, UpdatePurchaseOrderFormData } from '@/lib/schemas';
import {
    useUpdatePurchaseOrder,
    usePurchaseOrderStatuses
} from '@/api/services/purchaseOrders';
import { PurchaseOrder, UpdatePurchaseOrderRequest } from '@/types/api/purchaseOrders';
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
    const { data: statuses = [], isPending: isLoadingStatuses } = usePurchaseOrderStatuses();
    const { mutate: updatePO, isPending: isUpdating } = useUpdatePurchaseOrder(purchaseOrder.id);

    const form = useForm<UpdatePurchaseOrderFormData>({
        resolver: zodResolver(updatePurchaseOrderSchema),
        defaultValues: {
            expectedDeliveryDate: purchaseOrder.expectedDeliveryDate.split('T')[0],
            status: purchaseOrder.status,
            deliveryAddress: purchaseOrder.deliveryAddress,
            notes: purchaseOrder.notes || '',
        },
    });

    const onSubmit = (data: UpdatePurchaseOrderFormData) => {
        const updateData: UpdatePurchaseOrderRequest = {
            expectedDeliveryDate: data.expectedDeliveryDate,
            status: Number(data.status),
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status Selection */}
                        <motion.div variants={itemVariants}>
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                            <Activity className="h-3 w-3" /> Current Status
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 border-muted-foreground/20 focus:ring-primary">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {statuses.map((status) => (
                                                    <SelectItem key={status.value} value={status.value.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                status.value === purchaseOrder.status ? "bg-primary" : "bg-muted-foreground/30"
                                                            )} />
                                                            {status.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </motion.div>

                        {/* Expected Delivery Date */}
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
                    </div>

                    {/* Delivery Address */}
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

                    {/* Notes */}
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

                    {/* Footer Actions */}
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
                            Cancel
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
    );
}
