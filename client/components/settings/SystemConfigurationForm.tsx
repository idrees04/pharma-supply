import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LockKeyhole, Save } from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { systemConfigurationSchema, SystemConfigurationFormData } from '@/lib/schemas';
import {
  SYSTEM_CONFIGURATION_DATA_TYPES,
  SystemConfiguration,
  SystemConfigurationDataType,
} from '@/types/api/systemConfiguration';
import {
  useCreateSystemConfiguration,
  useUpdateSystemConfiguration,
} from '@/hooks/systemConfiguration';

interface SystemConfigurationFormProps {
  configuration?: SystemConfiguration | null;
  onCancel: () => void;
  onSuccess: (configuration: SystemConfiguration) => void;
}

const FALLBACK_TYPE: SystemConfigurationDataType = 'string';

function isSystemConfigurationDataType(
  dataType: string,
): dataType is SystemConfigurationDataType {
  return SYSTEM_CONFIGURATION_DATA_TYPES.some((option) => option === dataType);
}

function normalizeDataType(dataType: string | null | undefined): SystemConfigurationDataType {
  if (!dataType) {
    return FALLBACK_TYPE;
  }

  const normalizedDataType = dataType.toLowerCase();
  return isSystemConfigurationDataType(normalizedDataType)
    ? normalizedDataType
    : FALLBACK_TYPE;
}

function getDefaultValues(
  configuration?: SystemConfiguration | null,
): SystemConfigurationFormData {
  const normalizedType = normalizeDataType(configuration?.dataType);

  return {
    configKey: configuration?.configKey ?? '',
    displayName: configuration?.displayName ?? '',
    category: configuration?.category ?? '',
    description: configuration?.description ?? '',
    dataType: normalizedType,
    configValue:
      normalizedType === 'boolean'
        ? configuration?.configValue === 'false'
          ? 'false'
          : 'true'
        : configuration?.configValue ?? '',
    isEncrypted: configuration?.isEncrypted ?? false,
    isEditable: configuration?.isEditable ?? true,
    isActive: configuration?.isActive ?? true,
  };
}

export function SystemConfigurationForm({
  configuration,
  onCancel,
  onSuccess,
}: SystemConfigurationFormProps) {
  const isEditing = Boolean(configuration);
  const createMutation = useCreateSystemConfiguration();
  const updateMutation = useUpdateSystemConfiguration(configuration?.configKey ?? '');

  const form = useForm<SystemConfigurationFormData>({
    resolver: zodResolver(systemConfigurationSchema),
    defaultValues: getDefaultValues(configuration),
  });

  useEffect(() => {
    form.reset(getDefaultValues(configuration));
  }, [configuration, form]);

  const watchedDataType = form.watch('dataType');
  const normalizedType = watchedDataType;

  const typeOptions = useMemo(() => {
    const currentType = normalizeDataType(configuration?.dataType);
    return SYSTEM_CONFIGURATION_DATA_TYPES.includes(currentType)
      ? SYSTEM_CONFIGURATION_DATA_TYPES
      : [...SYSTEM_CONFIGURATION_DATA_TYPES, currentType];
  }, [configuration?.dataType]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: SystemConfigurationFormData) => {
    const payload = {
      configKey: values.configKey.trim(),
      displayName: values.displayName.trim(),
      category: values.category.trim(),
      description: values.description.trim() || null,
      dataType: values.dataType,
      configValue: values.configValue.trim(),
      isEncrypted: values.isEncrypted,
      isEditable: values.isEditable,
      isActive: values.isActive,
    };

    if (isEditing && configuration) {
      updateMutation.mutate(payload, {
        onSuccess: (updatedConfiguration) => {
          onSuccess(updatedConfiguration);
        },
        onError: (error) => {
          form.setError('root', {
            message: error.userMessage || 'Unable to update the configuration right now.',
          });
        },
      });
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (createdConfiguration) => {
        onSuccess(createdConfiguration);
      },
      onError: (error) => {
        form.setError('root', {
          message: error.userMessage || 'Unable to create the configuration right now.',
        });
      },
    });
  };

  const renderValueField = () => {
    if (normalizedType === 'boolean') {
      return (
        <FormField
          control={form.control}
          name="configValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Configuration value</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a boolean value" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Use boolean values for feature toggles and binary controls.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (normalizedType === 'json') {
      return (
        <FormField
          control={form.control}
          name="configValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Configuration value</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder='{
  "key": "value"
}'
                />
              </FormControl>
              <FormDescription>
                Store structured JSON for grouped application settings.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    const inputType =
      normalizedType === 'number'
        ? 'number'
        : normalizedType === 'email'
          ? 'email'
          : normalizedType === 'url'
            ? 'url'
            : normalizedType === 'password'
              ? 'password'
              : 'text';

    return (
      <FormField
        control={form.control}
        name="configValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Configuration value</FormLabel>
            <FormControl>
              <Input
                {...field}
                type={inputType}
                autoComplete="off"
                step={normalizedType === 'number' ? 'any' : undefined}
                placeholder="Enter configuration value"
              />
            </FormControl>
            <FormDescription>
              {normalizedType === 'password'
                ? 'Sensitive values are masked in the management view.'
                : 'This is the live value the application will read from the backend.'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Inventory sync interval" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="configKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Configuration key</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isEditing}
                    placeholder="inventory.syncIntervalMinutes"
                  />
                </FormControl>
                <FormDescription>
                  Stable identifier used by the backend and clients.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Inventory" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a data type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {renderValueField()}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="Explain what this setting controls and when teams should update it."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <FormLabel>Active</FormLabel>
                  <FormDescription>Available to the application</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isEditable"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <FormLabel>Editable</FormLabel>
                  <FormDescription>Allow business admins to change it</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isEncrypted"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <FormLabel className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    Encrypted
                  </FormLabel>
                  <FormDescription>Mask value previews in the UI</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root?.message ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? 'Save changes' : 'Create configuration'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
