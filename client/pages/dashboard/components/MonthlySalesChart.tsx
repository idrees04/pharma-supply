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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp } from 'lucide-react';

const MonthlySalesChart: React.FC = () => {
    const { data, isLoading, error } = useMonthlySalesPurchases();
    const navigate = useNavigate();

    if (isLoading) return <ChartSkeleton />;
    if (error) return <ChartError />;
    if (!data || data.length === 0) return <EmptyState />;

    const chartData = data.map(item => ({
        ...item,
        month: item.month ?? 'Unknown',
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
        >
            <Card className="overflow-hidden h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between shrink-0 pb-2">
                    <div>
                        <CardTitle className="text-lg font-bold">Sales vs Purchases</CardTitle>
                        <CardDescription>Monthly trend comparison</CardDescription>
                    </div>
                    <div 
                        className="p-2 rounded-full bg-primary/10 text-primary cursor-pointer hover:bg-primary hover:text-white transition-all"
                        onClick={() => navigate('/reports?module=finance')}
                        title="View detailed reports"
                    >
                        <BarChart3 className="w-5 h-5" />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 pt-0">
                    <div className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={chartData} 
                                margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                                onClick={(data) => {
                                  if (data && data.activeLabel) {
                                    navigate(`/reports?module=finance&month=${data.activeLabel}`);
                                  }
                                }}
                                className="cursor-pointer"
                            >
                                <defs>
                                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
                                    </linearGradient>
                                    <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f3f4f6', radius: 4 }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 border rounded-lg shadow-xl">
                                                    <p className="font-bold mb-2 border-b pb-1">{label}</p>
                                                    {payload.map((entry: any, i: number) => (
                                                        <div key={i} className="flex justify-between gap-4 text-sm py-0.5">
                                                            <span className="text-muted-foreground">{entry.name}:</span>
                                                            <span className="font-bold" style={{ color: entry.fill }}>{formatCurrency(entry.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px' }}
                                />
                                <Bar 
                                    dataKey="sales" 
                                    name="Sales" 
                                    fill="url(#salesGradient)" 
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                />
                                <Bar 
                                    dataKey="purchases" 
                                    name="Purchases" 
                                    fill="url(#purchasesGradient)" 
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const ChartSkeleton = () => (
    <Card className="h-full animate-pulse flex flex-col">
        <CardHeader className="h-16 bg-muted/50 rounded-t-xl shrink-0" />
        <CardContent className="flex-1 p-6 min-h-0">
            <div className="h-full w-full bg-muted/20 rounded-lg flex items-end gap-4 p-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex-1 bg-muted/30 rounded-t" style={{ height: `${20 + Math.random() * 60}%` }} />
                ))}
            </div>
        </CardContent>
    </Card>
);

const ChartError = () => (
    <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-red-500 gap-2">
            <TrendingUp className="w-8 h-8 opacity-20" />
            <p>Failed to load monthly data.</p>
        </CardContent>
    </Card>
);

const EmptyState = () => (
    <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
            No monthly data available.
        </CardContent>
    </Card>
);

export default MonthlySalesChart;