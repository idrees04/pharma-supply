import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore, Hospital } from '@/hooks/useStore';
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

interface HospitalFormProps {
  hospital?: Hospital;
  onClose: () => void;
}

export default function HospitalForm({ hospital, onClose }: HospitalFormProps) {
  const addHospital = useStore((state) => state.addHospital);
  const updateHospital = useStore((state) => state.updateHospital);

  const form = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: hospital ? {
      name: hospital.name,
      email: hospital.email,
      phone: hospital.phone,
      address: hospital.address,
      city: hospital.city,
      country: hospital.country,
      postalCode: hospital.postalCode,
      licenseNo: hospital.licenseNo,
      contactPerson: hospital.contactPerson,
      isActive: hospital.isActive,
    } : {
      isActive: true,
    },
  });

  const onSubmit = (data: HospitalFormData) => {
    try {
      const hospitalData: Omit<Hospital, 'id' | 'createdAt'> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        licenseNo: data.licenseNo,
        contactPerson: data.contactPerson,
        isActive: data.isActive,
      };

      if (hospital) {
        updateHospital(hospital.id, hospitalData);
        toast.success('Hospital updated successfully');
      } else {
        addHospital(hospitalData);
        toast.success('Hospital created successfully');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save hospital');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="+1-555-0123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="licenseNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License No *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HOS-12345" {...field} />
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : hospital ? 'Update Hospital' : 'Create Hospital'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
