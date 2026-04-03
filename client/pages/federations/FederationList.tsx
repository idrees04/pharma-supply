import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle2, Edit3, Globe2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import {
  useCreateFederation,
  useDeleteFederation,
  useFederations,
  useUpdateFederation,
} from '@/hooks/federation';
import { FederationDto } from '@/types/api/federation';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from '@radix-ui/react-select';

const federationSchema = z.object({
  federationName: z.string().trim().min(1, 'Federation name is required').max(120, 'Federation name must be 120 characters or fewer'),
  contactPerson: z.string().trim().max(120, 'Contact person must be 120 characters or fewer').optional().default(''),
  phoneNumber: z.string().trim().max(30, 'Phone number must be 30 characters or fewer').optional().default(''),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')).default(''),
  address: z.string().trim().max(500, 'Address must be 500 characters or fewer').optional().default(''),
  isActive: z.boolean().default(true),
});

type FederationFormData = z.infer<typeof federationSchema>;

function FederationForm({
  federation,
  onCancel,
  onSuccess,
}: {
  federation: FederationDto | null;
  onCancel: () => void;
  onSuccess: (federation: FederationDto) => void;
}) {
  const createMutation = useCreateFederation();
  const updateMutation = useUpdateFederation(federation?.id ?? 0);

  const form = useForm<FederationFormData>({
    resolver: zodResolver(federationSchema),
    defaultValues: {
      federationName: federation?.federationName ?? '',
      contactPerson: federation?.contactPerson ?? '',
      phoneNumber: federation?.phoneNumber ?? '',
      email: federation?.email ?? '',
      address: federation?.address ?? '',
      isActive: federation?.isActive ?? true,
    },
  });

  const isEditing = Boolean(federation);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: FederationFormData) => {
    const payload = {
      federationName: values.federationName,
      contactPerson: values.contactPerson || null,
      phoneNumber: values.phoneNumber || null,
      email: values.email || null,
      address: values.address || null,
      ...(isEditing ? { isActive: values.isActive } : {}),
    };

    if (isEditing && federation) {
      updateMutation.mutate(payload, {
        onSuccess: (updated) => onSuccess(updated),
        onError: (error) => {
          form.setError('root', { message: error.userMessage || 'Unable to update federation.' });
        },
      });
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (created) => onSuccess(created),
      onError: (error) => {
        form.setError('root', { message: error.userMessage || 'Unable to create federation.' });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="federationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Federation name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="National Pharmacy Federation" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact person</FormLabel>
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
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="0300 1234567" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <FormLabel>Active</FormLabel>
                  <p className="text-xs text-muted-foreground">Allow this federation to be used in the workflow.</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="Office address or mailing address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.message ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create federation'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function FederationList() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('federations', 'create');
  const canUpdate = hasPermission('federations', 'update');
  const canDelete = hasPermission('federations', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedFederation, setSelectedFederation] = useState<FederationDto | null>(null);
  const [editingFederation, setEditingFederation] = useState<FederationDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FederationDto | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: federations = [], isPending, error, refetch, isRefetching } = useFederations();
  const deleteMutation = useDeleteFederation();

  const filteredFederations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return federations.filter((federation) => {
      if (selectedStatus === 'active' && !federation.isActive) {
        return false;
      }

      if (selectedStatus === 'inactive' && federation.isActive) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableContent = [
        federation.federationName,
        federation.contactPerson,
        federation.phoneNumber,
        federation.email,
        federation.address,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase();

      return searchableContent.includes(normalizedSearch);
    });
  }, [federations, searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    return {
      total: federations.length,
      active: federations.filter((federation) => federation.isActive).length,
      inactive: federations.filter((federation) => !federation.isActive).length,
    };
  }, [federations]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
  };

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <h1 className="text-2xl font-semibold">Unable to load federations</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error.userMessage || 'Federation service unavailable.'}</p>
          </div>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Federations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage federation groups as standalone master data for partnerships and affiliations.
          </p>
        </div>
        {canCreate ? (
          <Button
            className="gap-2 self-start"
            onClick={() => {
              setEditingFederation(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New federation
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Inactive</CardDescription>
            <CardTitle className="text-3xl">{stats.inactive}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Search federations</CardTitle>
            <CardDescription>Find federations by name, contact, phone, email, or address.</CardDescription>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search federations" className="pl-9" />
            </div>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as 'all' | 'active' | 'inactive')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Federation registry</CardTitle>
            <CardDescription>{filteredFederations.length} of {federations.length} records shown.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} className="gap-2 self-start">
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : filteredFederations.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
              <Globe2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h2 className="mt-4 text-xl font-semibold">No federations yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Create the first federation record to start linking groups.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Federation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFederations.map((federation) => (
                    <TableRow key={federation.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setSelectedFederation(federation)}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{federation.federationName || 'Untitled federation'}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{federation.address || 'No address provided'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p>{federation.contactPerson || '—'}</p>
                          <p className="text-muted-foreground">{federation.phoneNumber || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{federation.email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={federation.isActive ? 'default' : 'secondary'}>
                          {federation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate ? (
                            <Button variant="ghost" size="icon" onClick={(event) => {
                              event.stopPropagation();
                              setEditingFederation(federation);
                              setIsDialogOpen(true);
                            }}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(federation);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFederation ? 'Edit federation' : 'Create federation'}</DialogTitle>
            <DialogDescription>
              Maintain federation master records and their contact details.
            </DialogDescription>
          </DialogHeader>
          <FederationForm
            federation={editingFederation}
            onCancel={() => setIsDialogOpen(false)}
            onSuccess={(saved) => {
              toast.success(editingFederation ? 'Federation updated successfully.' : 'Federation created successfully.');
              setSelectedFederation(saved);
              setIsDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Sheet
        open={selectedFederation !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFederation(null);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedFederation ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedFederation.federationName}</SheetTitle>
                <SheetDescription>Review the federation profile and operational status.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedFederation.isActive ? 'default' : 'secondary'}>
                    {selectedFederation.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">Standalone master</Badge>
                </div>
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact person</div>
                      <div className="mt-1 text-sm">{selectedFederation.contactPerson || '—'}</div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</div>
                      <div className="mt-1 text-sm">{selectedFederation.phoneNumber || '—'}</div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</div>
                      <div className="mt-1 text-sm">{selectedFederation.email || '—'}</div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</div>
                      <div className="mt-1 text-sm text-muted-foreground">{selectedFederation.address || 'No address provided.'}</div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {canUpdate ? (
                    <Button variant="outline" className="gap-2" onClick={() => {
                      setEditingFederation(selectedFederation);
                      setIsDialogOpen(true);
                    }}>
                      <Edit3 className="h-4 w-4" />
                      Edit federation
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button variant="destructive" className="gap-2" onClick={() => setDeleteTarget(selectedFederation)}>
                      <Trash2 className="h-4 w-4" />
                      Delete federation
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete federation"
        description={deleteTarget ? `Delete ${deleteTarget.federationName || 'this federation'}?` : 'This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('Federation deleted successfully.');
              setDeleteTarget(null);
              setSelectedFederation(null);
              refetch();
            },
          });
        }}
      />
    </div>
  );
}
