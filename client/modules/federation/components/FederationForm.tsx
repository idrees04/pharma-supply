import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  useFederationForm,
  type FederationFormValues,
} from "../hooks/useFederationForm";
import type {
  CreateFederationResponse,
  UpdateFederationResponse,
} from "../types/federation.types";

interface FederationFormProps {
  federationId: number | null;
  onCancel: () => void;
  onSuccess: (response: CreateFederationResponse | UpdateFederationResponse) => void;
}

export function FederationForm({ federationId, onCancel, onSuccess }: FederationFormProps) {
  const { form, submit, isEditMode, isLoadingFederation, isSubmitting } = useFederationForm(federationId);

  const handleSubmit = async (values: FederationFormValues) => {
    const response = await submit(values);

    if (response?.success) {
      onSuccess(response);
    }
  };

  if (isEditMode && isLoadingFederation) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div>
          <h3 className="font-semibold">Loading federation</h3>
          <p className="text-sm text-muted-foreground">Fetching the selected federation details.</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="federationName"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Federation Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="National Pharmacy Federation" />
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
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Dr. Ahmed Khan" />
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="0300 1234567" />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="info@federation.org" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditMode ? (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border px-4 py-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Allow this federation to stay available across the workflow.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder="Office address or mailing address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root?.message ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Federation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
