import React from 'react';
import { useMonthlySalesPurchases } from '@/hooks/dashboard';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

const MonthlySalesChart: React.FC = () => {
    const { data, isLoading, error } = useMonthlySalesPurchases();

    if (isLoading) return <ChartSkeleton />;
    if (error) return <ChartError />;
    if (!data || data.length === 0) return <EmptyState />;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Sales vs Purchases</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="sales" fill="#10b981" name="Sales" />
                            <Bar dataKey="purchases" fill="#ef4444" name="Purchases" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const ChartSkeleton = () => (
    <Card className="h-[500px] animate-pulse">
        <CardHeader className="h-16 bg-gray-200" />
        <CardContent className="h-[400px] bg-gray-100" />
    </Card>
);

const ChartError = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-96 text-red-500">
            Failed to load monthly data.
        </CardContent>
    </Card>
);

const EmptyState = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-96 text-gray-500">
            No monthly data available.
        </CardContent>
    </Card>
);

export default MonthlySalesChart;