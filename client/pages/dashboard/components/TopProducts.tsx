import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTopProducts } from '@/hooks/dashboard';
import { formatCurrency } from '@/utils/formatters';

const TopProducts: React.FC = () => {
    const { data, isLoading, error } = useTopProducts();

    if (isLoading) return <TopProductsSkeleton />;
    if (error) return <TopProductsError />;
    if (!data || data.length === 0) return <EmptyState message="No product data available." />;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.map((product, idx) => (
                            <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{idx + 1}</span>
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-xs text-gray-500">Sold: {product.quantitySold}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                        {product.trend >= 0 ? (
                                            <TrendingUp className="w-3 h-3 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 text-red-500" />
                                        )}
                                        <span className={product.trend >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            {Math.abs(product.trend)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const TopProductsSkeleton: React.FC = () => (
    <Card className="h-full animate-pulse">
        <CardHeader className="h-16 bg-gray-200" />
        <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
        </CardContent>
    </Card>
);

const TopProductsError: React.FC = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
            Failed to load top products.
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

export default TopProducts;