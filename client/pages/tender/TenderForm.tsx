import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenderSchema, TenderFormData } from '@/lib/schemas';
import { useStore, Tender } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface TenderFormProps {
  initialData?: Tender;
  onSuccess?: () => void;
}

export default function TenderForm({ initialData, onSuccess }: TenderFormProps) {
  const { addTender, updateTender } = useStore();
  const form = useForm<TenderFormData>({
    resolver: zodResolver(tenderSchema),
    defaultValues: initialData ? {
      pvmsNo: initialData.pvmsNo,
      type: initialData.type,
      genericName: initialData.genericName,
      brandName: initialData.brandName,
      manufacturerBrand: initialData.manufacturerBrand,
      quotationSubmittedBy: initialData.quotationSubmittedBy,
      isAuthorizedDistributor: initialData.isAuthorizedDistributor,
      packSize: initialData.packSize,
      retailPrice: initialData.retailPrice,
      tradePrice: initialData.tradePrice,
      offerPrice: initialData.offerPrice,
      gstApplicable: initialData.gstApplicable,
      discountOffered: initialData.discountOffered,
    } : {
      isAuthorizedDistributor: false,
      gstApplicable: false,
      discountOffered: 0,
    },
  });

  const onSubmit = (data: TenderFormData) => {
    const tenderData: Omit<Tender, 'id' | 'createdAt'> = {
      pvmsNo: data.pvmsNo,
      type: data.type,
      genericName: data.genericName,
      brandName: data.brandName,
      manufacturerBrand: data.manufacturerBrand,
      quotationSubmittedBy: data.quotationSubmittedBy,
      isAuthorizedDistributor: data.isAuthorizedDistributor,
      packSize: data.packSize,
      retailPrice: data.retailPrice,
      tradePrice: data.tradePrice,
      offerPrice: data.offerPrice,
      gstApplicable: data.gstApplicable,
      discountOffered: data.discountOffered,
    };

    if (initialData) {
      updateTender(initialData.id, tenderData);
    } else {
      addTender(tenderData);
    }
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Row 1: PVMS No and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pvmsNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PVMS No</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1004" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Tab">Tablet</SelectItem>
                    <SelectItem value="Cap">Capsule</SelectItem>
                    <SelectItem value="Inj">Injection</SelectItem>
                    <SelectItem value="Syrup">Syrup</SelectItem>
                    <SelectItem value="Powder">Powder</SelectItem>
                    <SelectItem value="Cream">Cream</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Generic Name and Brand Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="genericName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Generic Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Diclofenac sodium 50 mg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brandName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name (Quoted)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., MOTIV 50MG TAB" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3: Manufacturer Brand and Pack Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="manufacturerBrand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer Brand</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Biogen Pharma" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="packSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pack Size</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 20's, 30's" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 4: Quotation Submitted By */}
        <FormField
          control={form.control}
          name="quotationSubmittedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quotation Submitted By</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Ideal Distributor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 5: Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="retailPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Retail Price (PKR)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tradePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trade Price (PKR)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="offerPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Offer Price (PKR)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 6: Discount and GST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discountOffered"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Offered (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>Discount percentage on trade price</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="gstApplicable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">18% GST Applicable</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isAuthorizedDistributor"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Authorized Distributor</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="submit" className="gap-2">
            {initialData ? 'Update Tender' : 'Create Tender'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
