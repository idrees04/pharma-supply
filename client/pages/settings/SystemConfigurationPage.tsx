import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Eye,
  FilterX,
  KeyRound,
  LockKeyhole,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { SystemConfigurationForm } from '@/components/settings/SystemConfigurationForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import {
  useDeleteSystemConfiguration,
  useSystemConfigurations,
} from '@/hooks/systemConfiguration';
import {
  SYSTEM_CONFIGURATION_DATA_TYPES,
  SystemConfiguration,
  SystemConfigurationDataType,
} from '@/types/api/systemConfiguration';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
] as const;

type StatusFilter = (typeof statusOptions)[number]['value'];

type DialogMode = 'create' | 'edit';

interface SummaryCardDefinition {
  title: string;
  value: number;
  description: string;
  icon: typeof Settings2;
}

function normalizeText(value: string | null | undefined, fallback = 'Uncategorized') {
  const trimmedValue = value?.trim();
  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : fallback;
}

function isSystemConfigurationDataType(
  value: string,
): value is SystemConfigurationDataType {
  return SYSTEM_CONFIGURATION_DATA_TYPES.some((option) => option === value);
}

function normalizeDataType(value: string | null | undefined): SystemConfigurationDataType {
  const normalizedValue = value?.trim().toLowerCase();
  return normalizedValue && isSystemConfigurationDataType(normalizedValue)
    ? normalizedValue
    : 'string';
}

function formatLabel(value: string | null | undefined, fallback = 'Not provided') {
  return normalizeText(value, fallback);
}

function formatDataType(dataType: string | null | undefined) {
  const normalizedType = normalizeDataType(dataType);
  return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
}

function formatConfigValue(configuration: SystemConfiguration) {
  if (configuration.isEncrypted) {
    return '••••••••••';
  }

  if (!configuration.configValue) {
    return '—';
  }

  return configuration.configValue.length > 64
    ? `${configuration.configValue.slice(0, 64)}…`
    : configuration.configValue;
}

function getDataTypeBadgeVariant(dataType: string | null | undefined) {
  switch (normalizeDataType(dataType)) {
    case 'boolean':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'number':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'json':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'password':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'email':
    case 'url':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function getStatusBadgeVariant(isActive: boolean) {
  return isActive
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';
}

function getEditableBadgeVariant(isEditable: boolean) {
  return isEditable
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';
}

export default function SystemConfigurationPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('systemConfiguration', 'create');
  const canUpdate = hasPermission('systemConfiguration', 'update');
  const canDelete = hasPermission('systemConfiguration', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeConfiguration, setActiveConfiguration] = useState<SystemConfiguration | null>(null);
  const [detailsConfiguration, setDetailsConfiguration] = useState<SystemConfiguration | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SystemConfiguration | null>(null);

  const {
    data: configurations = [],
    isPending,
    error,
    refetch,
    isRefetching,
  } = useSystemConfigurations();
  const deleteMutation = useDeleteSystemConfiguration();

  const categories = useMemo(() => {
    return Array.from(
      new Set(configurations.map((configuration) => normalizeText(configuration.category))),
    ).sort((left, right) => left.localeCompare(right));
  }, [configurations]);

  const dataTypes = useMemo(() => {
    return Array.from(
      new Set(
        configurations.map((configuration) => normalizeDataType(configuration.dataType)),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }, [configurations]);

  const filteredConfigurations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...configurations]
      .filter((configuration) => {
        if (selectedCategory !== 'all' && normalizeText(configuration.category) !== selectedCategory) {
          return false;
        }

        if (selectedType !== 'all' && normalizeDataType(configuration.dataType) !== selectedType) {
          return false;
        }

        if (selectedStatus === 'active' && !configuration.isActive) {
          return false;
        }

        if (selectedStatus === 'inactive' && configuration.isActive) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableContent = [
          configuration.configKey,
          configuration.displayName,
          configuration.category,
          configuration.description,
          configuration.dataType,
          configuration.configValue,
        ]
          .filter((value): value is string => Boolean(value))
          .join(' ')
          .toLowerCase();

        return searchableContent.includes(normalizedSearch);
      })
      .sort((left, right) => {
        const categoryComparison = normalizeText(left.category).localeCompare(
          normalizeText(right.category),
        );

        if (categoryComparison !== 0) {
          return categoryComparison;
        }

        return formatLabel(left.displayName, left.configKey).localeCompare(
          formatLabel(right.displayName, right.configKey),
        );
      });
  }, [configurations, searchTerm, selectedCategory, selectedStatus, selectedType]);

  const summaryCards = useMemo<SummaryCardDefinition[]>(() => {
    return [
      {
        title: 'Total settings',
        value: configurations.length,
        description: 'All registered runtime configuration keys.',
        icon: Settings2,
      },
      {
        title: 'Active settings',
        value: configurations.filter((configuration) => configuration.isActive).length,
        description: 'Currently enabled and applied by the backend.',
        icon: ShieldCheck,
      },
      {
        title: 'Encrypted values',
        value: configurations.filter((configuration) => configuration.isEncrypted).length,
        description: 'Sensitive entries masked in the management UI.',
        icon: LockKeyhole,
      },
      {
        title: 'Read-only rules',
        value: configurations.filter((configuration) => !configuration.isEditable).length,
        description: 'Protected controls locked against accidental edits.',
        icon: KeyRound,
      },
    ];
  }, [configurations]);

  const openCreateDialog = () => {
    setDialogMode('create');
    setActiveConfiguration(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (configuration: SystemConfiguration) => {
    setDialogMode('edit');
    setActiveConfiguration(configuration);
    setIsFormOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  const handleDelete = () => {
    if (!deleteCandidate) {
      return;
    }

    deleteMutation.mutate(deleteCandidate.configKey, {
      onSuccess: () => {
        toast.success('Configuration deleted successfully.');
        setDeleteCandidate(null);
        if (detailsConfiguration?.configKey === deleteCandidate.configKey) {
          setDetailsConfiguration(null);
        }
      },
      onError: (deleteError) => {
        toast.error(deleteError.userMessage || 'Unable to delete the configuration right now.');
      },
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System configuration</h1>
          <p className="text-muted-foreground">
            Centralize operational rules, runtime toggles, and sensitive application defaults.
          </p>
        </div>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Unable to load system configuration</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                {error.userMessage || 'The system settings service is unavailable right now.'}
              </p>
            </div>
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Enterprise control center
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System configuration</h1>
            <p className="max-w-3xl text-muted-foreground">
              Govern cross-module behavior from a single screen: inventory thresholds, finance controls,
              API endpoints, security flags, and platform defaults.
            </p>
          </div>
        </div>

        {canCreate ? (
          <Button onClick={openCreateDialog} className="gap-2 self-start">
            <Plus className="h-4 w-4" />
            New configuration
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.04 }}
            >
              <Card className="h-full border-border/60 transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardDescription>{card.title}</CardDescription>
                    <CardTitle className="mt-2 text-3xl">{card.value}</CardTitle>
                  </div>
                  <div className="rounded-full border bg-muted/40 p-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border-border/60">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Find and segment configuration rules</CardTitle>
            <CardDescription>
              Search by key, description, category, value, or data type. Use filters to narrow audits quickly.
            </CardDescription>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search keys, names, descriptions, or values"
                className="pl-9"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedType}
              onValueChange={(value) => {
                const nextType =
                  value === 'all' || SYSTEM_CONFIGURATION_DATA_TYPES.some((option) => option === value)
                    ? value
                    : null;

                if (nextType) {
                  setSelectedType(nextType);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All data types</SelectItem>
                {Array.from(new Set([...SYSTEM_CONFIGURATION_DATA_TYPES, ...dataTypes])).map((typeOption) => (
                  <SelectItem key={typeOption} value={typeOption}>
                    {formatDataType(typeOption)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                const nextStatus = statusOptions.find((option) => option.value === value)?.value;
                if (nextStatus) {
                  setSelectedStatus(nextStatus);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <FilterX className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Configuration registry</CardTitle>
            <CardDescription>
              {filteredConfigurations.length} of {configurations.length} settings shown.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} className="gap-2 self-start">
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : configurations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-14 text-center">
              <Settings2 className="h-12 w-12 text-muted-foreground/50" />
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">No configuration records yet</h2>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Start by creating baseline settings for inventory, invoicing, security, and integration endpoints.
                </p>
              </div>
              {canCreate ? (
                <Button onClick={openCreateDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create first configuration
                </Button>
              ) : null}
            </div>
          ) : filteredConfigurations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-14 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">No settings match these filters</h2>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Clear the current filters to review the full registry again.
                </p>
              </div>
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <FilterX className="h-4 w-4" />
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setting</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Data type</TableHead>
                    <TableHead>Value preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigurations.map((configuration) => (
                    <TableRow
                      key={configuration.configKey}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => setDetailsConfiguration(configuration)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatLabel(configuration.displayName, configuration.configKey)}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {configuration.configKey}
                          </div>
                          {configuration.description ? (
                            <div className="max-w-md text-xs text-muted-foreground line-clamp-2">
                              {configuration.description}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{formatLabel(configuration.category)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getDataTypeBadgeVariant(configuration.dataType)}>
                          {formatDataType(configuration.dataType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatConfigValue(configuration)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeVariant(configuration.isActive)}>
                          {configuration.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEditableBadgeVariant(configuration.isEditable)}>
                          {configuration.isEditable ? 'Editable' : 'Read only'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDetailsConfiguration(configuration);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canUpdate && configuration.isEditable ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditDialog(configuration);
                              }}
                            >
                              <PencilLine className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteCandidate(configuration);
                              }}
                            >
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create configuration' : 'Edit configuration'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Add a new runtime setting with the right data type, visibility, and operational controls.'
                : 'Adjust the current setting while keeping the configuration key stable for dependent services.'}
            </DialogDescription>
          </DialogHeader>
          <SystemConfigurationForm
            configuration={dialogMode === 'edit' ? activeConfiguration : null}
            onCancel={() => setIsFormOpen(false)}
            onSuccess={(savedConfiguration) => {
              toast.success(
                dialogMode === 'create'
                  ? 'Configuration created successfully.'
                  : 'Configuration updated successfully.',
              );
              setIsFormOpen(false);
              setActiveConfiguration(savedConfiguration);
              setDetailsConfiguration(savedConfiguration);
            }}
          />
        </DialogContent>
      </Dialog>

      <Sheet
        open={detailsConfiguration !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsConfiguration(null);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {detailsConfiguration ? (
            <>
              <SheetHeader>
                <SheetTitle>{formatLabel(detailsConfiguration.displayName, detailsConfiguration.configKey)}</SheetTitle>
                <SheetDescription>
                  Review configuration metadata, current value posture, and operational controls.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getStatusBadgeVariant(detailsConfiguration.isActive)}>
                    {detailsConfiguration.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className={getEditableBadgeVariant(detailsConfiguration.isEditable)}>
                    {detailsConfiguration.isEditable ? 'Editable' : 'Read only'}
                  </Badge>
                  <Badge variant="outline" className={getDataTypeBadgeVariant(detailsConfiguration.dataType)}>
                    {formatDataType(detailsConfiguration.dataType)}
                  </Badge>
                  {detailsConfiguration.isEncrypted ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Encrypted
                    </Badge>
                  ) : null}
                </div>

                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuration key</div>
                      <div className="mt-1 font-mono text-sm">{detailsConfiguration.configKey}</div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</div>
                      <div className="mt-1 text-sm">{formatLabel(detailsConfiguration.category)}</div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current value</div>
                      <div className="mt-1 rounded-lg bg-muted/50 p-3 font-mono text-sm break-all">
                        {detailsConfiguration.isEncrypted
                          ? 'Encrypted value masked for safety.'
                          : detailsConfiguration.configValue || '—'}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {detailsConfiguration.description || 'No operational guidance has been provided yet.'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommended usage</CardTitle>
                    <CardDescription>
                      Use system configuration for rules that affect multiple modules or runtime behavior.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div>• Inventory thresholds, reorder rules, and expiry alerts</div>
                    <div>• Finance posting controls, invoice numbering, and tax toggles</div>
                    <div>• External integration endpoints and environment-specific flags</div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {canUpdate && detailsConfiguration.isEditable ? (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        openEditDialog(detailsConfiguration);
                      }}
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit setting
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => setDeleteCandidate(detailsConfiguration)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete setting
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCandidate(null);
          }
        }}
        title="Delete configuration"
        description={
          deleteCandidate
            ? `This will permanently remove ${deleteCandidate.configKey} from the configuration registry.`
            : 'This action cannot be undone.'
        }
        confirmText="Delete permanently"
        cancelText="Keep configuration"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
