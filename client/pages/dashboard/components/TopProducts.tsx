import React from 'react';
import { useTopSellingProducts } from '@/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

const TopProducts: React.FC = () => {
    const { data, isLoading, error } = useTopSellingProducts();

    if (isLoading) return <TopProductsSkeleton />;
    if (error) return <TopProductsError />;
    if (!data || data.length === 0) return <EmptyState message="No product sales data." />;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.map((product, idx) => (
                            <div key={product.productCode} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{idx + 1}</span>
                                    <div>
                                        <p className="font-medium">{product.productName}</p>
                                        <p className="text-xs text-gray-500">Code: {product.productCode}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(product.totalRevenue)}</p>
                                    <p className="text-xs text-gray-500">Qty: {product.totalQuantitySold}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const TopProductsSkeleton = () => (
    <Card className="h-full animate-pulse">
        <CardHeader className="h-16 bg-gray-200" />
        <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
        </CardContent>
    </Card>
);

const TopProductsError = () => (
    <Card>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
            Failed to load top products.
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

export default TopProducts;