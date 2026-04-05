import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Truck, Package, AlertTriangle, ClipboardList, Wallet, CreditCard, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSummary } from '@/hooks/dashboard';
import { formatCurrency, formatNumber } from '@/lib/utils';

const SummaryCards: React.FC = () => {
    const { data: summary, isLoading } = useSummary();

    if (isLoading || !summary) {
        return <SummaryCardsSkeleton />;
    }

    const cards = [
        { title: 'Total Hospitals', value: formatNumber(summary.totalHospitals), icon: Building2, color: 'text-blue-600', sub: `${summary.activeHospitals} active` },
        { title: 'Total Suppliers', value: formatNumber(summary.totalSuppliers), icon: Truck, color: 'text-green-600', sub: `${summary.activeSuppliers} active` },
        { title: 'Total Products', value: formatNumber(summary.totalProducts), icon: Package, color: 'text-purple-600', sub: `${summary.lowStockProducts} low stock` },
        { title: 'Pending Orders', value: formatNumber(summary.pendingSupplyOrders + summary.pendingPurchaseOrders), icon: ClipboardList, color: 'text-orange-600', sub: `Supply: ${summary.pendingSupplyOrders} | Purchase: ${summary.pendingPurchaseOrders}` },
        { title: 'Cash Balance', value: formatCurrency(summary.totalCashBalance), icon: Wallet, color: 'text-emerald-600' },
        { title: 'Bank Balance', value: formatCurrency(summary.totalBankBalance), icon: CreditCard, color: 'text-teal-600' },
        { title: 'Receivables', value: formatCurrency(summary.outstandingReceivables), icon: TrendingUp, color: 'text-red-600' },
        { title: 'Payables', value: formatCurrency(summary.outstandingPayables), icon: TrendingUp, color: 'text-amber-600' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{card.title}</p>
                                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                                    {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
                                </div>
                                <card.icon className={`w-10 h-10 ${card.color} opacity-80`} />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

const SummaryCardsSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        ))}
    </div>
);

export default SummaryCards;