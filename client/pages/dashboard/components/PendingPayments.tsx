import React from 'react';
import { usePendingPaymentAlerts } from '@/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { formatCurrency, formatRelativeDays } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

const PendingPaymentsTable: React.FC = () => {
    const { data, isLoading, error } = usePendingPaymentAlerts();
    const navigate = useNavigate();

    if (isLoading) return <PendingSkeleton />;
    if (error) return <PendingError />;
    if (!data || data.length === 0) return <EmptyState message="No pending payments." />;

    // Show scroll only if more than 6 items
    const shouldScroll = data.length > 6;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
                    <CardTitle className="text-lg font-bold">Pending Payment Alerts</CardTitle>
                    <Badge variant="outline" className="font-mono">
                        {data.length} active
                    </Badge>
                </CardHeader>
                <CardContent
                    className={`flex-1 min-h-0 p-0 ${shouldScroll ? 'overflow-y-auto' : ''}`}
                    style={{
                        maxHeight: shouldScroll ? '450px' : 'auto',
                    }}
                >
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className={`${shouldScroll ? 'sticky top-0 bg-card z-10' : ''}`}>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Hospital</TableHead>
                                    <TableHead className="text-right">Outstanding</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((payment, idx) => {
                                    const isOverdue = payment.isOverdue;
                                    const netDays = payment.netDays;
                                    const daysOverdue = payment.daysOverdue;
                                    let statusText = '';
                                    let variant: 'destructive' | 'outline' | 'secondary' = 'outline';

                                    if (isOverdue) {
                                        statusText = `Overdue ${daysOverdue > 0 ? formatRelativeDays(daysOverdue) : ''}`;
                                        variant = 'destructive';
                                    } else if (netDays <= 7) {
                                        statusText = 'Due soon';
                                        variant = 'outline';
                                    } else {
                                        statusText = 'On track';
                                        variant = 'secondary';
                                    }

                                    return (
                                        <TableRow
                                            key={`${payment.invoiceNumber}-${idx}`}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                            onClick={() => navigate(`/invoices?search=${payment.invoiceNumber}`)}
                                        >
                                            <TableCell>
                                                <div className="font-medium">{payment.invoiceNumber}</div>
                                                <div className="text-xs text-muted-foreground">{new Date(payment.dueDate).toLocaleDateString()}</div>
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate">{payment.hospitalName}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-foreground">
                                                {formatCurrency(payment.outstandingAmount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={variant} className="whitespace-nowrap">
                                                    {statusText}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden p-4 space-y-3">
                        {data.map((payment, idx) => {
                            const isOverdue = payment.isOverdue;
                            const variant: 'destructive' | 'outline' | 'secondary' = isOverdue ? 'destructive' : payment.netDays <= 7 ? 'outline' : 'secondary';

                            return (
                                <div
                                    key={`${payment.invoiceNumber}-${idx}`}
                                    className="p-4 rounded-lg border bg-card hover:border-primary transition-colors cursor-pointer"
                                    onClick={() => navigate(`/invoices?search=${payment.invoiceNumber}`)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold">{payment.invoiceNumber}</div>
                                            <div className="text-xs text-muted-foreground">{payment.hospitalName}</div>
                                        </div>
                                        <Badge variant={variant}>
                                            {isOverdue ? 'Overdue' : payment.netDays <= 7 ? 'Due Soon' : 'On Track'}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-end pt-2 border-t border-dashed">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(payment.dueDate).toLocaleDateString()}
                                        </div>
                                        <div className="font-mono font-bold text-primary">
                                            {formatCurrency(payment.outstandingAmount)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {shouldScroll && data.length > 6 && (
                        <div className="text-xs text-muted-foreground text-center py-2 border-t">
                            Showing {data.length} payments
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

const PendingSkeleton = () => (
    <Card className="h-full animate-pulse flex flex-col">
        <CardHeader className="h-16 bg-muted/50 rounded-t-xl shrink-0" />
        <CardContent className="flex-1 p-6">
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/30 rounded-lg" />
                ))}
            </div>
        </CardContent>
    </Card>
);

const PendingError = () => (
    <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[300px] text-red-500">
            Failed to load pending payments.
        </CardContent>
    </Card>
);

const EmptyState = ({ message }: { message: string }) => (
    <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
            {message}
        </CardContent>
    </Card>
);

export default PendingPaymentsTable;