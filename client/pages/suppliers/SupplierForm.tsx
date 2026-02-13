import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierSchema, SupplierFormData } from '@/lib/schemas';
import { useCreateSupplier, useUpdateSupplier } from '@/api/services/suppliers';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Supplier } from '@/types/api/suppliers';
import { CreateSupplierRequest, UpdateSupplierRequest } from '@/types/api/suppliers';

interface SupplierFormProps {
  supplier?: Supplier;
  onClose: () => void;
}

export default function SupplierForm({ supplier, onClose }: SupplierFormProps) {
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(supplier?.id || 0);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          supplierName: supplier.supplierName,
          contactPerson: supplier.contactPerson,
          phoneNumber: supplier.phoneNumber,
          email: supplier.email,
          address: supplier.address,
          city: supplier.city,
          state: supplier.state,
          postalCode: supplier.postalCode,
          country: supplier.country,
          taxNumber: supplier.taxNumber,
          licenseNumber: supplier.licenseNumber,
          paymentTermDays: supplier.paymentTermDays,
          creditLimit: supplier.creditLimit,
          notes: supplier.notes,
          status: supplier.status,
          isActive: supplier.isActive,
        }
      : {
          paymentTermDays: 0,
          creditLimit: 0,
          notes: '',
          status: 1,
          isActive: true,
        },
  });

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: SupplierFormData) => {
    if (supplier) {
      // Update existing supplier
      const updateData: UpdateSupplierRequest = {
        supplierName: data.supplierName,
        contactPerson: data.contactPerson,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        taxNumber: data.taxNumber,
        licenseNumber: data.licenseNumber,
        paymentTermDays: data.paymentTermDays,
        creditLimit: data.creditLimit,
        status: data.status || 1,
        notes: data.notes,
        isActive: data.isActive,
      };

      updateMutation.mutate(updateData, {
        onSuccess: () => {
          toast.success('Supplier updated successfully');
          onClose();
        },
        onError: (error) => {
          toast.error(error.userMessage || 'Failed to update supplier');
        },
      });
    } else {
      // Create new supplier
      const createData: CreateSupplierRequest = {
        supplierName: data.supplierName,
        contactPerson: data.contactPerson,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        taxNumber: data.taxNumber,
        licenseNumber: data.licenseNumber,
        paymentTermDays: data.paymentTermDays,
        creditLimit: data.creditLimit,
        notes: data.notes,
      };

      createMutation.mutate(createData, {
        onSuccess: () => {
          toast.success('Supplier created successfully');
          onClose();
        },
        onError: (error) => {
          toast.error(error.userMessage || 'Failed to create supplier');
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Name */}
          <FormField
            control={form.control}
            name="supplierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., ABC Pharmaceuticals" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Person */}
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@supplier.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input placeholder="+1-555-0123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Input placeholder="Street address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Karachi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* State */}
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sindh" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Pakistan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Postal Code */}
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 74000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tax Number */}
          <FormField
            control={form.control}
            name="taxNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TAX-123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* License Number */}
          <FormField
            control={form.control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., LIC-12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Term Days */}
          <FormField
            control={form.control}
            name="paymentTermDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Term Days</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Credit Limit */}
          <FormField
            control={form.control}
            name="creditLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Limit</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 100000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes about this supplier..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status - only show on edit */}
        {supplier && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>
                    Supplier is available for purchase orders
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Saving...</span>
              </>
            ) : supplier ? (
              'Update Supplier'
            ) : (
              'Create Supplier'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
