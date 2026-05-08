import React from 'react';
import { useLowStockAlerts } from '@/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const LowStockTable: React.FC = () => {
    const { data, isLoading, error } = useLowStockAlerts();
    const navigate = useNavigate();

    if (isLoading) return <LowStockSkeleton />;
    if (error) return <LowStockError />;
    if (!data || data.length === 0) return <EmptyState message="No low stock items." />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-bold">Low Stock Alerts</CardTitle>
                    <Badge variant="outline" className="font-mono">
                        {data.length} items
                    </Badge>
                </CardHeader>
                <CardContent>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Available</TableHead>
                                    <TableHead className="text-right">Reorder</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((alert, idx) => {
                                    const isCritical = alert.availableQuantity <= alert.reorderLevel / 2;
                                    return (
                                        <TableRow 
                                            key={`${alert.productCode}-${idx}`}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                            onClick={() => navigate(`/inventory?search=${alert.productCode}`)}
                                        >
                                            <TableCell>
                                                <div className="font-medium">{alert.productName}</div>
                                                <div className="text-xs text-muted-foreground">{alert.productCode}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{alert.availableQuantity}</TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">{alert.reorderLevel}</TableCell>
                                            <TableCell>
                                                <Badge variant={isCritical ? "destructive" : "secondary"} className="gap-1">
                                                    {isCritical && <AlertTriangle className="w-3 h-3" />}
                                                    {isCritical ? "Critical" : "Low"}
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

                    {/* Mobile View - Card Stack */}
                    <div className="md:hidden space-y-3">
                        {data.map((alert, idx) => {
                            const isCritical = alert.availableQuantity <= alert.reorderLevel / 2;
                            return (
                                <div 
                                    key={`${alert.productCode}-${idx}`}
                                    className="p-4 rounded-lg border bg-card hover:border-primary transition-colors cursor-pointer"
                                    onClick={() => navigate(`/inventory?search=${alert.productCode}`)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold">{alert.productName}</div>
                                            <div className="text-xs text-muted-foreground">{alert.productCode}</div>
                                        </div>
                                        <Badge variant={isCritical ? "destructive" : "secondary"}>
                                            {isCritical ? "Critical" : "Low"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                                        <div className="text-muted-foreground">Available: <span className="font-mono text-foreground font-bold">{alert.availableQuantity}</span></div>
                                        <div className="text-muted-foreground">Reorder: <span className="font-mono text-foreground">{alert.reorderLevel}</span></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const LowStockSkeleton = () => (
    <Card className="animate-pulse">
        <CardHeader className="h-16 bg-muted/50 rounded-t-xl" />
        <CardContent className="p-6">
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/30 rounded-lg" />
                ))}
            </div>
        </CardContent>
    </Card>
);

const LowStockError = () => (
    <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-red-500 gap-2">
            <AlertTriangle className="w-8 h-8" />
            <p>Failed to load low stock alerts.</p>
        </CardContent>
    </Card>
);

const EmptyState = ({ message }: { message: string }) => (
    <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
            {message}
        </CardContent>
    </Card>
);

export default LowStockTable;