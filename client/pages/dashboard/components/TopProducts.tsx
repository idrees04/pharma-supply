import React from 'react';
import { useTopSellingProducts } from '@/hooks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';

const TopProducts: React.FC = () => {
    const { data, isLoading, error } = useTopSellingProducts();
    const navigate = useNavigate();

    if (isLoading) return <TopProductsSkeleton />;
    if (error) return <TopProductsError />;
    if (!data || data.length === 0) return <EmptyState message="No product sales data." />;

    // Show scroll only if more than 6 items
    const shouldScroll = data.length > 6;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
                    <CardTitle className="text-lg font-bold">Top Selling Products</CardTitle>
                    <Trophy className="w-5 h-5 text-amber-500" />
                </CardHeader>
                <CardContent 
                    className={`flex-1 min-h-0 ${shouldScroll ? 'overflow-y-auto' : ''}`}
                    style={{ 
                        maxHeight: shouldScroll ? '400px' : 'auto',
                    }}
                >
                    <div className="space-y-2">
                        {data.map((product, idx) => {
                            const productName = product.productName ?? 'Unknown Product';
                            const productCode = product.productCode ?? `N/A-${idx}`;
                            return (
                                <div 
                                    key={`${productCode}-${idx}`} 
                                    className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                                    onClick={() => navigate(`/inventory?search=${productCode}`)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-semibold truncate text-sm">{productName}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">{productCode}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 flex items-center gap-2">
                                        <div>
                                            <p className="font-bold text-sm text-primary">{formatCurrency(product.totalRevenue)}</p>
                                            <p className="text-[10px] text-muted-foreground">Qty: {product.totalQuantitySold}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {shouldScroll && data.length > 6 && (
                        <div className="text-xs text-muted-foreground text-center pt-2 border-t mt-2">
                            Showing {data.length} products
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

const TopProductsSkeleton = () => (
    <Card className="h-full animate-pulse flex flex-col">
        <CardHeader className="h-16 bg-muted/50 rounded-t-xl shrink-0" />
        <CardContent className="flex-1 p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center h-12 bg-muted/30 rounded-lg px-4" />
            ))}
        </CardContent>
    </Card>
);

const TopProductsError = () => (
    <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-red-500 gap-2">
            <p className="font-medium">Failed to load top products.</p>
        </CardContent>
    </Card>
);

const EmptyState = ({ message }: { message: string }) => (
    <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
            {message}
        </CardContent>
    </Card>
);

export default TopProducts;