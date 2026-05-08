import { Product } from '@/types/api/products';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Package, ShieldCheck, AlertTriangle, Info, Calculator, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    canUpdate?: boolean;
    canDelete?: boolean;
}

export function ProductCard({
    product,
    onEdit,
    onDelete,
    canUpdate,
    canDelete,
}: ProductCardProps) {
    const isLowStock = product.availableQuantity <= product.reorderLevel;
    const profit = product.standardSaleRate - product.standardPurchaseRate;
    const margin = product.standardSaleRate > 0 ? (profit / product.standardSaleRate) * 100 : 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <Card className={cn(
                "h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl border-muted",
                !product.isActive && "opacity-75 grayscale-[0.5]"
            )}>
                {/* Card Header with Status & Badges */}
                <CardHeader className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 flex-1">
                            <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                {product.productName}
                            </h3>
                            <p className="text-sm text-muted-foreground italic line-clamp-1">
                                {product.genericName}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant={product.isActive ? "default" : "secondary"} className="text-[10px] uppercase font-bold">
                                {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {isLowStock && (
                                <Badge variant="destructive" className="text-[10px] uppercase font-bold animate-pulse">
                                    Low Stock
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px] bg-blue-50/50 text-blue-700 border-blue-200">
                            {product.productTypeName}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-slate-50/50 text-slate-700 border-slate-200">
                            {product.unitName}
                        </Badge>
                        {product.isBatchRequired && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="secondary" className="text-[10px] rounded-full p-1 h-5 w-5 flex items-center justify-center">
                                            <Package className="w-3 h-3" />
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>Batch Required</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {product.requiresPrescription && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="secondary" className="text-[10px] rounded-full p-1 h-5 w-5 flex items-center justify-center bg-purple-50 text-purple-700 border-purple-200">
                                            <ShieldCheck className="w-3 h-3" />
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>Prescription Required</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex-1 space-y-4">
                    {/* Product Code & Manufacturer */}
                    <div className="flex justify-between text-[11px] text-muted-foreground border-b border-dashed pb-2">
                        <span>Code: <span className="font-mono font-medium text-foreground">{product.productCode}</span></span>
                        <span className="truncate ml-2 max-w-[120px]">{product.manufacturer}</span>
                    </div>

                    {/* Inventory Section */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Package className="w-3 h-3" /> Available Qty
                            </span>
                            <span className={cn(
                                "font-bold",
                                isLowStock ? "text-red-600" : "text-foreground"
                            )}>
                                {product.availableQuantity}
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Reorder Level: {product.reorderLevel}</span>
                            <span className="text-muted-foreground">Reorder Qty: {product.reorderQuantity}</span>
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50/30 p-2 rounded-lg border border-blue-100/50">
                                <p className="text-[10px] text-blue-600 font-medium">Purchase rate (PKR)</p>
                                <p className="text-xs font-bold">{formatCurrency(product.standardPurchaseRate)}</p>
                            </div>
                            <div className="bg-green-50/30 p-2 rounded-lg border border-green-100/50">
                                <p className="text-[10px] text-green-600 font-medium">Sale rate (PKR)</p>
                                <p className="text-xs font-bold">{formatCurrency(product.standardSaleRate)}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-1.5">
                                <Badge variant={margin > 20 ? "default" : "secondary"} className="text-[9px] h-4">
                                    {margin.toFixed(1)}% Margin
                                </Badge>
                                <span className="text-[9px] text-muted-foreground">Tax: {product.taxPercentage}%</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">HSN: {product.hsnCode}</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-2 bg-muted/20 border-t flex justify-between gap-1">
                    <div className="flex-1 px-2">
                        {isLowStock && (
                            <div className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Stock Warning
                            </div>
                        )}
                    </div>
                    <div className="flex gap-1">
                        {canUpdate && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                                onClick={() => onEdit(product)}
                                title="Edit Product"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                onClick={() => onDelete(product)}
                                title="Delete Product"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
