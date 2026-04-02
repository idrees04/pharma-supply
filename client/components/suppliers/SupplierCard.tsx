import { Supplier } from '@/types/api/suppliers';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Users, User, Phone, Mail, MapPin, DollarSign, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';

interface SupplierCardProps {
    supplier: Supplier;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
    canUpdate?: boolean;
    canDelete?: boolean;
}

export function SupplierCard({
    supplier,
    onEdit,
    onDelete,
    canUpdate,
    canDelete,
}: SupplierCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <Card className={cn(
                "h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl border-muted group",
                !supplier.isActive && "opacity-75 grayscale-[0.5]"
            )}>
                <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <Badge variant={supplier.isActive ? "default" : "secondary"} className="text-[10px] uppercase font-bold">
                            {supplier.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg leading-tight line-clamp-1">
                            {supplier.supplierName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">{supplier.contactPerson}</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-1 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-slate-700">{supplier.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-slate-700 truncate">{supplier.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-slate-600 line-clamp-1">{supplier.city}, {supplier.state}</span>
                        </div>
                    </div>

                    <div className="bg-emerald-50/30 rounded-lg p-3 border border-emerald-100/50 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Outstanding
                            </span>
                            <span className={cn(
                                "font-bold text-sm",
                                supplier.outstandingBalance > 0 ? "text-red-600" : "text-green-600"
                            )}>
                                {formatCurrency(supplier.outstandingBalance)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">Payment Terms</span>
                            <span className="text-[10px] font-medium">{supplier.paymentTermDays} Days</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-2 bg-slate-50/50 border-t flex justify-end gap-1 mt-auto">
                    <div className="flex gap-1">
                        {canUpdate && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                                onClick={() => onEdit(supplier)}
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                onClick={() => onDelete(supplier)}
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
