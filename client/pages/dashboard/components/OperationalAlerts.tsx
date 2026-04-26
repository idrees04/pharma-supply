import React from 'react';
import { useOperationalAlerts } from '@/hooks/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Package,
    ClipboardList,
    FileText,
    CreditCard,
    TrendingUp,
    DollarSign,
    BarChart3,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

const OperationalAlerts: React.FC = () => {
    const { data, isLoading, error } = useOperationalAlerts();

    if (isLoading) return <OperationalAlertsSkeleton />;
    if (error) return <OperationalAlertsError />;
    if (!data) return <EmptyState />;

    const cards = [
        {
            title: 'Low Stock Products',
            value: formatNumber(data.lowStockProductCount),
            icon: Package,
            color: 'text-amber-600',
            sub: 'Products below reorder level',
        },
        {
            title: 'Unfulfilled Supply Orders',
            value: formatNumber(data.unfulfilledOrPartialSupplyOrderCount),
            icon: ClipboardList,
            color: 'text-orange-600',
            sub: 'Partial or unfulfilled',
        },
        {
            title: 'Pending Purchase Orders',
            value: formatNumber(data.pendingOrSentPurchaseOrderCount),
            icon: FileText,
            color: 'text-blue-600',
            sub: 'Pending or sent',
        },
        {
            title: 'Invoices with Balance',
            value: formatNumber(data.invoicesWithReceivableBalance),
            icon: CreditCard,
            color: 'text-purple-600',
            sub: 'Receivable balance',
        },
        {
            title: 'Overdue Invoices',
            value: formatNumber(data.invoicesWithReceivableOverdue),
            icon: AlertTriangle,
            color: 'text-red-600',
            sub: 'Past due date',
        },
        {
            title: 'POs with Payable',
            value: formatNumber(data.purchaseOrdersWithPayableBalance),
            icon: BarChart3,
            color: 'text-indigo-600',
            sub: 'Payable balance',
        },
        {
            title: 'Total Receivables',
            value: formatCurrency(data.totalOutstandingReceivables),
            icon: TrendingUp,
            color: 'text-green-600',
            sub: 'Outstanding amount',
        },
        {
            title: 'Total Payables',
            value: formatCurrency(data.totalOutstandingPayables),
            icon: DollarSign,
            color: 'text-rose-600',
            sub: 'Outstanding amount',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            <Card className="overflow-hidden">
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Operational Alerts Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cards.map((card, idx) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.03 }}
                                className="cursor-pointer"
                            >
                                <Card className="h-full border shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
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
                </CardContent>
            </Card>
        </motion.div>
    );
};

const OperationalAlertsSkeleton = () => (
    <Card className="animate-pulse">
        <CardContent className="p-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-28 bg-gray-200 rounded" />
                ))}
            </div>
        </CardContent>
    </Card>
);

const OperationalAlertsError = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-48 text-red-500">
            Failed to load operational alerts.
        </CardContent>
    </Card>
);

const EmptyState = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-48 text-gray-500">
            No operational alerts data.
        </CardContent>
    </Card>
);

export default OperationalAlerts;