import React from 'react';
// import { useSummary } from '../hooks/useDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, DollarSign, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSummary } from '@/hooks/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
// import { formatCurrency, formatNumber } from '../utils/formatters';

const SummaryCards: React.FC = () => {
    const { data: summary, isLoading } = useSummary();

    if (isLoading || !summary) {
        return <SummaryCardsSkeleton />;
    }

    const cards = [
        {
            title: 'Total Sales',
            value: formatCurrency(summary.totalSales),
            trend: summary.salesTrend,
            icon: DollarSign,
            color: 'text-green-600',
        },
        {
            title: 'Total Purchases',
            value: formatCurrency(summary.totalPurchases),
            trend: summary.purchasesTrend,
            icon: ShoppingCart,
            color: 'text-red-600',
        },
        {
            title: 'Net Profit',
            value: formatCurrency(summary.netProfit),
            trend: summary.profitTrend,
            icon: TrendingUp,
            color: 'text-blue-600',
        },
        {
            title: 'Orders',
            value: formatNumber(summary.ordersCount),
            trend: summary.ordersTrend,
            icon: Wallet,
            color: 'text-purple-600',
        },
    ];

    return (
        <>
            {cards.map((card, idx) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{card.title}</p>
                                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                                    <div className="flex items-center mt-2">
                                        {card.trend >= 0 ? (
                                            <ArrowUp className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <ArrowDown className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className={`text-sm ml-1 ${card.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {Math.abs(card.trend)}%
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1">vs last period</span>
                                    </div>
                                </div>
                                <card.icon className={`w-12 h-12 ${card.color} opacity-80`} />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </>
    );
};

const SummaryCardsSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        ))}
    </div>
);

export default SummaryCards;