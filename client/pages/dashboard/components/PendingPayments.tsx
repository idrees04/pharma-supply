import React from 'react';
import { usePendingPaymentAlerts } from '@/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { formatRelativeDays } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';

const PendingPaymentsTable: React.FC = () => {
    const { data, isLoading, error } = usePendingPaymentAlerts();

    if (isLoading) return <PendingSkeleton />;
    if (error) return <PendingError />;
    if (!data || data.length === 0) return <EmptyState message="No pending payments." />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Pending Payment Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Hospital</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Outstanding</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((payment) => (
                                <TableRow key={payment.invoiceNumber}>
                                    <TableCell className="font-medium">{payment.invoiceNumber}</TableCell>
                                    <TableCell>{payment.hospitalName}</TableCell>
                                    <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{formatCurrency(payment.outstandingAmount)}</TableCell>
                                    <TableCell>
                                        {payment.daysOverdue > 0 ? (
                                            <Badge variant="destructive">{formatRelativeDays(payment.daysOverdue)}</Badge>
                                        ) : (
                                            <Badge variant="outline">Due soon</Badge>
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

const PendingSkeleton = () => (
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

const PendingError = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
            Failed to load pending payments.
        </CardContent>
    </Card>
);

const EmptyState = ({ message }: { message: string }) => (
    <Card>
        <CardContent className="flex items-center justify-center h-64 text-gray-500">
            {message}
        </CardContent>
    </Card>
);

export default PendingPaymentsTable;