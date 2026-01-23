import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateHospital, useUpdateHospital, useGetHospitalById } from '@/hooks/useHospitals';
import { hospitalSchema, HospitalFormData } from '@/lib/schemas';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Hospital } from '@/types/api/hospitals';

interface HospitalFormProps {
  hospital?: Hospital;
  onClose: () => void;
}

export default function HospitalForm({ hospital, onClose }: HospitalFormProps) {
  const form = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: {
      hospitalType: 1,
      creditTermDays: 0,
      creditLimit: 0,
      status: 1,
      isActive: true,
    },
  });

  // Fetch hospital details if editing
  const { data: hospitalResponse, isPending: isFetchingDetails } = useGetHospitalById(
    hospital?.id
  );

  // Update form when hospital data is loaded
  useEffect(() => {
    if (hospitalResponse?.data) {
      const data = hospitalResponse.data;
      form.reset({
        hospitalName: data.hospitalName,
        contactPerson: data.contactPerson,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        taxNumber: data.taxNumber,
        registrationNumber: data.registrationNumber,
        hospitalType: data.hospitalType,
        creditTermDays: data.creditTermDays,
        creditLimit: data.creditLimit,
        status: data.status,
        isActive: data.isActive,
      });
    }
  }, [hospitalResponse?.data, form]);

  // Create hospital mutation
  const { mutate: createHospital, isPending: isCreating } = useCreateHospital({
    onSuccess: () => {
      toast.success('Hospital created successfully');
      form.reset();
      onClose();
    },
    onError: (error) => {
      if (error.hasValidationErrors) {
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          const fieldKey = field as keyof HospitalFormData;
          const message = Array.isArray(messages) ? messages[0] : messages;
          form.setError(fieldKey, { message });
        });
      } else {
        toast.error(error.userMessage || 'Failed to create hospital');
      }
    },
  });

  // Update hospital mutation
  const { mutate: updateHospital, isPending: isUpdating } = useUpdateHospital(
    hospital?.id || 0,
    {
      onSuccess: () => {
        toast.success('Hospital updated successfully');
        onClose();
      },
      onError: (error) => {
        if (error.hasValidationErrors) {
          Object.entries(error.validationErrors).forEach(([field, messages]) => {
            const fieldKey = field as keyof HospitalFormData;
            const message = Array.isArray(messages) ? messages[0] : messages;
            form.setError(fieldKey, { message });
          });
        } else {
          toast.error(error.userMessage || 'Failed to update hospital');
        }
      },
    },
  );

  const isSubmitting = isCreating || isUpdating || isFetchingDetails;

  const onSubmit = (data: HospitalFormData) => {
    if (hospital) {
      // Update mode: use full update with all fields
      updateHospital({
        hospitalName: data.hospitalName,
        contactPerson: data.contactPerson,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        taxNumber: data.taxNumber,
        registrationNumber: data.registrationNumber,
        hospitalType: data.hospitalType,
        creditTermDays: data.creditTermDays,
        creditLimit: data.creditLimit,
        status: data.status || 1,
        isActive: data.isActive,
      });
    } else {
      // Create mode: use only creation fields
      createHospital({
        hospitalName: data.hospitalName,
        contactPerson: data.contactPerson,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        taxNumber: data.taxNumber,
        registrationNumber: data.registrationNumber,
        hospitalType: data.hospitalType,
        creditTermDays: data.creditTermDays,
        creditLimit: data.creditLimit,
      });
    }
  };

  // Show loading state while fetching edit data
  if (hospital && isFetchingDetails) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hospitalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hospital Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Aga Khan Hospital" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Dr. Ahmed Khan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@hospital.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <FormField
            control={form.control}
            name="taxNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., NTN123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., REG123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hospitalType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hospital Type *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="creditTermDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Term Days</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="creditLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Limit</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 500000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>Hospital is available for supply orders</FormDescription>
              </div>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {hospital ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              hospital ? 'Update Hospital' : 'Create Hospital'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
