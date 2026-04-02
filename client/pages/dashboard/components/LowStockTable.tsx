import React from 'react';
import { useLowStock } from '@/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const LowStockTable: React.FC = () => {
    const { data, isLoading, error } = useLowStock();

    if (isLoading) return <LowStockSkeleton />;
    if (error) return <LowStockError />;
    if (!data || data.length === 0) return <EmptyState message="No low stock items." />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Low Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Reorder Level</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.currentStock}</TableCell>
                                    <TableCell>{product.reorderLevel}</TableCell>
                                    <TableCell>
                                        {product.currentStock <= (product.criticalLevel ?? 0) ? (
                                            <span className="flex items-center gap-1 text-red-600">
                                                <AlertTriangle className="w-4 h-4" /> Critical
                                            </span>
                                        ) : (
                                            <span className="text-yellow-600">Low</span>
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

const LowStockSkeleton: React.FC = () => (
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

const LowStockError: React.FC = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
            Failed to load low stock data.
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

export default LowStockTable;