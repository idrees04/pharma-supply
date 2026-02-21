import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Calendar,
    Hash,
    FileText,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Trash2,
    Plus,
    Search,
    User2
} from 'lucide-react';
import { toast } from 'sonner';

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
    FormDescription
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ReceiveItemsFormData, receiveItemsSchema } from '@/lib/schemas';
import { useReceiveItems } from '@/api/services/purchaseOrders';
import { PurchaseOrder } from '@/types/api/purchaseOrders';
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
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

export const ReceiveItemsForm: React.FC<ReceiveItemsFormProps> = ({
    purchaseOrder,
    onSuccess,
    onCancel
}) => {
    const receiveItemsMutation = useReceiveItems();
    const [searchQuery, setSearchQuery] = React.useState('');

    const form = useForm<ReceiveItemsFormData>({
        resolver: zodResolver(receiveItemsSchema),
        defaultValues: {
            purchaseOrderId: purchaseOrder.id,
            actualDeliveryDate: new Date().toISOString().split('T')[0],
            items: purchaseOrder.items.map(item => ({
                purchaseOrderItemId: item.id,
                productName: item.productName,
                orderedQuantity: item.orderedQuantity,
                previouslyReceived: item.receivedQuantity,
                receivedQuantity: item.remainingQuantity,
                batchNumber: '',
                manufactureDate: '',
                expiryDate: '',
                notes: ''
            }))
        }
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "items"
    });

    const onSubmit = async (data: ReceiveItemsFormData) => {
        try {
            // Filter out items where receivedQuantity is 0
            const itemsToReceive = data.items.filter(item => item.receivedQuantity > 0);

            if (itemsToReceive.length === 0) {
                toast.error("Please specify a received quantity for at least one item.");
                return;
            }

            const payload = {
                purchaseOrderId: data.purchaseOrderId,
                actualDeliveryDate: new Date(data.actualDeliveryDate).toISOString(),
                items: itemsToReceive.map(item => ({
                    purchaseOrderItemId: item.purchaseOrderItemId,
                    receivedQuantity: item.receivedQuantity,
                    batchNumber: item.batchNumber,
                    manufactureDate: new Date(item.manufactureDate).toISOString(),
                    expiryDate: new Date(item.expiryDate).toISOString(),
                    notes: item.notes || ""
                }))
            };

            console.log("Submitting Receive Goods payload:", payload);

            const response = await receiveItemsMutation.mutateAsync(payload);

            toast.success(response.message || "Goods received successfully!");
            onSuccess?.();
        } catch (error) {
            if (isApiError(error)) {
                toast.error(error.userMessage);
                if (error.hasValidationErrors) {
                    console.error("Validation Errors:", error.validationErrors);
                }
            } else {
                toast.error("Failed to receive goods. Please try again.");
            }
            console.error("Receive Goods Error:", error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    {/* Supplier & Header Info */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-primary/5 p-4 rounded-xl border border-primary/10">
                        <div className="space-y-1">
                            <FormLabel className="flex items-center gap-2 text-primary/70 uppercase text-[10px] font-black tracking-widest">
                                <User2 className="h-3 w-3" />
                                Supplier
                            </FormLabel>
                            <p className="text-lg font-bold text-foreground">
                                {purchaseOrder.supplierName}
                            </p>
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

                    {/* Items Section */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Package className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider">
                                        Items to Receive
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        Showing {fields.filter((f, i) => form.getValues(`items.${i}`).productName?.toLowerCase().includes(searchQuery.toLowerCase())).length} of {fields.length} line items
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
                                    const itemValues = form.getValues(`items.${index}`);
                                    const matchesSearch = itemValues.productName?.toLowerCase().includes(searchQuery.toLowerCase());

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
                                            <Card className="border-primary/5 shadow-sm hover:border-primary/20 transition-all overflow-hidden">
                                                <div className="bg-muted/30 px-3 py-1.5 flex items-center justify-between border-b border-primary/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                        <span className="text-xs font-bold text-foreground truncate max-w-[300px]">
                                                            {itemValues.productName}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[9px] h-4 font-bold bg-primary/5 text-primary border-none">
                                                            Ordered: {itemValues.orderedQuantity}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[9px] h-4 font-bold">
                                                            Rem: {itemValues.orderedQuantity - itemValues.previouslyReceived}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <CardContent className="p-3 bg-muted/5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.receivedQuantity`}
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-1">
                                                                    <FormLabel className="text-[9px] uppercase font-black text-muted-foreground/70 tracking-wider">Recv Qty</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            {...field}
                                                                            className="h-8 text-xs font-bold border-primary/10 focus:border-primary/30"
                                                                            onChange={e => field.onChange(Math.max(0, parseFloat(e.target.value) || 0))}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage className="text-[9px]" />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.batchNumber`}
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-1">
                                                                    <FormLabel className="text-[9px] uppercase font-black text-muted-foreground/70 tracking-wider">Batch #</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} className="h-8 text-xs border-primary/10 focus:border-primary/30" placeholder="BT-..." />
                                                                    </FormControl>
                                                                    <FormMessage className="text-[9px]" />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.manufactureDate`}
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-1">
                                                                    <FormLabel className="text-[9px] uppercase font-black text-muted-foreground/70 tracking-wider">Mfg Date</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="date" {...field} className="h-8 text-[10px] border-primary/10 focus:border-primary/30" />
                                                                    </FormControl>
                                                                    <FormMessage className="text-[9px]" />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.expiryDate`}
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-1">
                                                                    <FormLabel className="text-[9px] uppercase font-black text-muted-foreground/70 tracking-wider">Exp Date</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="date" {...field} className="h-8 text-[10px] border-primary/10 focus:border-primary/30" />
                                                                    </FormControl>
                                                                    <FormMessage className="text-[9px]" />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <div className="md:col-span-1 lg:col-span-1">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.notes`}
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-1">
                                                                        <FormLabel className="text-[9px] uppercase font-black text-muted-foreground/70 tracking-wider">Note</FormLabel>
                                                                        <FormControl>
                                                                            <Input {...field} className="h-8 text-xs border-primary/10 focus:border-primary/30" placeholder="..." />
                                                                        </FormControl>
                                                                        <FormMessage className="text-[9px]" />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            {fields.filter((f, i) => form.getValues(`items.${i}`).productName?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-primary/10"
                                >
                                    <Search className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No products found matching "{searchQuery}"</p>
                                    <Button variant="link" onClick={() => setSearchQuery('')} className="text-xs text-primary">Clear search</Button>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <motion.div variants={itemVariants} className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            className="flex-1 h-12 text-base font-bold gap-2"
                            disabled={receiveItemsMutation.isPending}
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
                    </motion.div>
                </motion.div>
            </form>
        </Form>
    );
};
