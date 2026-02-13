import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupplier } from '@/api/services/suppliers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertCircle, Phone, Mail, MapPin, Building, CreditCard, Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LinkedProductsTable } from '@/components/suppliers/LinkedProductsTable';
import { LinkProductsModal } from '@/components/suppliers/LinkProductsModal';

export default function SupplierDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const supplierId = id ? parseInt(id) : null;
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const { data: supplier, isPending, error } = useSupplier(supplierId);

    if (isPending) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !supplier) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-lg font-semibold">Error loading supplier</h2>
                <p className="text-muted-foreground">
                    {error?.message || 'Supplier not found'}
                </p>
                <Button onClick={() => navigate('/suppliers')}>Back to Suppliers</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{supplier.supplierName}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                                {supplier.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <span>•</span>
                            <span className="text-sm">code: {supplier.id}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsLinkModalOpen(true)}>
                        + Link Products
                    </Button>
                </div>
            </div>

            {/* Supplier Metadata Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Contact Info */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{supplier.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{supplier.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{supplier.email}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <span>
                                {supplier.address}, {supplier.city}, {supplier.state} {supplier.postalCode}, {supplier.country}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Info */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Financial Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Credit Limit
                            </span>
                            <span className="font-mono font-medium">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(supplier.creditLimit)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <Banknote className="h-4 w-4" /> Outstanding
                            </span>
                            <span className="font-mono font-medium text-destructive">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(supplier.outstandingBalance)}
                            </span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Payment Terms</span>
                            <span>{supplier.paymentTermDays} Days</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Tax Number</span>
                            <span>{supplier.taxNumber}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Info / Stats */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Other Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">License Number</span>
                            <span>{supplier.licenseNumber || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-sm">
                            <span className="text-muted-foreground">Notes</span>
                            <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md min-h-[60px]">
                                {supplier.notes || 'No notes available.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Linked Products Table */}
            <LinkedProductsTable supplierId={supplierId!} />

            {/* Helper Modal */}
            <LinkProductsModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                supplierId={supplierId!}
            />
        </div>
    );
}
