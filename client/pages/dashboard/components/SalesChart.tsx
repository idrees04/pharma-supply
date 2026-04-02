import React, { useState } from 'react';
import { useSalesPurchases } from '@/hooks/dashboard';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { formatDate } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';

const periods = ['week', 'month', 'year'] as const;
type Period = typeof periods[number];

const SalesChart: React.FC = () => {
    const [period, setPeriod] = useState<Period>('month');
    const { data, isLoading, error } = useSalesPurchases(period);

    if (isLoading) return <ChartSkeleton />;
    if (error) return <ChartError />;
    if (!data) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Sales vs Purchases</CardTitle>
                    <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => formatDate(date, period === 'week' ? 'EEE' : 'MMM dd')}
                            />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="purchases" stroke="#ef4444" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const ChartSkeleton: React.FC = () => (
    <Card className="h-[500px] animate-pulse">
        <CardHeader className="h-16 bg-gray-200" />
        <CardContent className="h-[400px] bg-gray-100" />
    </Card>
);

const ChartError: React.FC = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-96 text-red-500">
            Failed to load chart data.
        </CardContent>
    </Card>
);

export default SalesChart;