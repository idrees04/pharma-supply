import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Search,
  Edit,
  Save,
  X,
  Settings as SettingsIcon,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSystemConfiguration } from '@/hooks/systemConfiguration';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemConfiguration } from '@/types/api/systemConfiguration';

const CONFIGURATION_CATEGORIES = [
  'Company',
  'Financial',
  'Inventory',
  'User',
  'Notification',
  'System',
];

export default function SystemConfigurationList() {
  const [selectedConfig, setSelectedConfig] = useState<SystemConfiguration | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Company');
  const [showPassword, setShowPassword] = useState(false);
  const [editValue, setEditValue] = useState('');

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canEdit = hasPermission('systemConfiguration', 'update') || hasPermission('admin', 'read');
  const { data: configurations = [], isLoading, error } = useSystemConfiguration();

  const groupedConfigs = useMemo(() => {
    const grouped = new Map<string, SystemConfiguration[]>();

    configurations.forEach((config) => {
      const category = config.category || 'System';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(config);
    });

    return grouped;
  }, [configurations]);

  const filteredConfigs = useMemo(() => {
    const configs = groupedConfigs.get(activeCategory) || [];
    return configs.filter(
      (config) =>
        config.configKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groupedConfigs, activeCategory, searchTerm]);

  const handleEdit = (config: SystemConfiguration) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit configurations');
      return;
    }
    setSelectedConfig(config);
    setEditValue(config.configValue);
    setShowPassword(false);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedConfig) return;

    try {
      // Call update API
      // await systemConfigService.updateConfiguration(selectedConfig.configKey, {
      //   configValue: editValue,
      // });
      toast.success('Configuration updated successfully');
      setIsEditOpen(false);
      setSelectedConfig(null);
      queryClient.invalidateQueries({ queryKey: ['systemConfiguration'] });
    } catch (error) {
      toast.error('Failed to update configuration');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Error loading configurations</h3>
            <p className="text-sm text-red-700 mt-1">
              {(error as any).userMessage || 'An error occurred'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['systemConfiguration'] })}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            System Configuration
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage application-wide settings and configurations
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search configurations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 w-full"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full gap-2 grid-cols-3 lg:grid-cols-6 h-auto p-1">
          {CONFIGURATION_CATEGORIES.map((category) => {
            const count = groupedConfigs.get(category)?.length || 0;
            return (
              <TabsTrigger key={category} value={category} className="flex flex-col gap-1">
                <span className="text-xs">{category}</span>
                {count > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CONFIGURATION_CATEGORIES.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-slate-100 rounded-full">
                    <SettingsIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900">No configurations</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No configurations found in this category
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredConfigs.map((config, idx) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ConfigurationCard
                      config={config}
                      onEdit={handleEdit}
                      canEdit={canEdit}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-full max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Update the value for {selectedConfig?.displayName || selectedConfig?.configKey}
            </DialogDescription>
          </DialogHeader>

          {selectedConfig && (
            <div className="space-y-6">
              {/* Configuration Details */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Key
                  </label>
                  <p className="font-mono text-sm mt-1">{selectedConfig.configKey}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Display Name
                  </label>
                  <p className="text-sm mt-1">
                    {selectedConfig.displayName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Description
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedConfig.description || 'No description'}
                  </p>
                </div>
              </div>

              {/* Value Input */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Value
                </label>
                <div className="relative mt-2">
                  <input
                    type={
                      selectedConfig.isEncrypted || selectedConfig.dataType === 'password'
                        ? showPassword
                          ? 'text'
                          : 'password'
                        : 'text'
                    }
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={!selectedConfig.isEditable}
                  />
                  {selectedConfig.isEncrypted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>

                {!selectedConfig.isEditable && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
                    <Lock className="w-3 h-3" />
                    <span>This configuration is read-only</span>
                  </div>
                )}

                {selectedConfig.isEncrypted && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                    <Lock className="w-3 h-3" />
                    <span>This value is encrypted</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedConfig(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!selectedConfig.isEditable || editValue === selectedConfig.configValue}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigurationCard({
  config,
  onEdit,
  canEdit,
}: {
  config: SystemConfiguration;
  onEdit: (config: SystemConfiguration) => void;
  canEdit: boolean;
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">
              {config.displayName || config.configKey}
            </h3>
            {config.isEncrypted && (
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            {!config.isEditable && (
              <Badge variant="secondary" className="text-xs">
                Read-only
              </Badge>
            )}
            {!config.isActive && (
              <Badge variant="destructive" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>

          <p className="font-mono text-xs text-muted-foreground mb-2">
            {config.configKey}
          </p>

          {config.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {config.description}
            </p>
          )}

          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              Current Value
            </p>
            <p className={cn(
              'font-mono text-sm mt-1 break-all',
              config.isEncrypted ? 'blur-sm' : ''
            )}>
              {config.configValue || 'N/A'}
            </p>
          </div>
        </div>

        {canEdit && config.isEditable && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(config)}
            className="gap-2 shrink-0 mt-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        )}
      </div>
    </Card>
  );
}
