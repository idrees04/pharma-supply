import React from 'react';
import { usePendingPayments } from '@/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { formatRelativeDate } from '@/utils/dateUtils';

const PendingPayments: React.FC = () => {
    const { data, isLoading, error } = usePendingPayments();

    if (isLoading) return <PendingPaymentsSkeleton />;
    if (error) return <PendingPaymentsError />;
    if (!data || data.length === 0) return <EmptyState message="No pending payments." />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{payment.customerName}</TableCell>
                                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell>{formatRelativeDate(payment.dueDate)}</TableCell>
                                    <TableCell>
                                        {payment.status === 'overdue' ? (
                                            <Badge variant="destructive">Overdue</Badge>
                                        ) : (
                                            <Badge variant="outline">Pending</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const PendingPaymentsSkeleton: React.FC = () => (
    <Card className="animate-pulse">
        <CardHeader className="h-16 bg-gray-200" />
        <CardContent>
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded" />
                ))}
            </div>
        </CardContent>
    </Card>
);

const PendingPaymentsError: React.FC = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
            Failed to load pending payments.
        </CardContent>
    </Card>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <Card>
        <CardContent className="flex items-center justify-center h-64 text-gray-500">
            {message}
        </CardContent>
    </Card>
);

export default PendingPayments;