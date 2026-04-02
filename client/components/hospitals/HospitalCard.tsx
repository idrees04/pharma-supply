import { Hospital } from '@/api/services/hospitals.service';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Hospital as HospitalIcon, User, Phone, Mail, MapPin, DollarSign, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

interface HospitalCardProps {
    hospital: Hospital;
    onEdit: (hospital: Hospital) => void;
    onDelete: (hospital: Hospital) => void;
    canUpdate?: boolean;
    canDelete?: boolean;
}

export function HospitalCard({
    hospital,
    onEdit,
    onDelete,
    canUpdate,
    canDelete,
}: HospitalCardProps) {
    const navigate = useNavigate();

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
                !hospital.isActive && "opacity-75 grayscale-[0.5]"
            )}>
                <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <HospitalIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <Badge variant={hospital.isActive ? "default" : "secondary"} className="text-[10px] uppercase font-bold">
                            {hospital.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <h3
                            className="font-bold text-lg leading-tight line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigate(`/hospitals/${hospital.id}`)}
                        >
                            {hospital.hospitalName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">{hospital.contactPerson}</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-1 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-slate-700">{hospital.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-slate-700 truncate">{hospital.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-slate-600 line-clamp-1">{hospital.city}, {hospital.state}</span>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Outstanding
                            </span>
                            <span className={cn(
                                "font-bold text-sm",
                                hospital.outstandingBalance > 0 ? "text-red-600" : "text-green-600"
                            )}>
                                {formatCurrency(hospital.outstandingBalance)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">Credit Limit</span>
                            <span className="text-[10px] font-medium">{formatCurrency(hospital.creditLimit)}</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-2 bg-slate-50/50 border-t flex justify-between gap-1 mt-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                        onClick={() => navigate(`/hospitals/${hospital.id}`)}
                    >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                    <div className="flex gap-1">
                        {canUpdate && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                                onClick={() => onEdit(hospital)}
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                onClick={() => onDelete(hospital)}
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
