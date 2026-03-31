import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  Download,
  Calendar,
  Filter,
  X,
  Logs,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/common/DataTable';
import { useAuditLogs } from '@/hooks/auditLogs';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, cn, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AuditLogDto } from '@/types/api/auditLogs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { downloadJSON, downloadCSV } from '@/lib/exportUtils';

const ITEMS_PER_PAGE = 25;

interface AuditLogFilters {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
  entityName?: string;
  action?: string;
  pageNumber?: number;
  pageSize?: number;
}

export default function AuditLogList() {
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<AuditLogFilters>({
    pageNumber: 1,
    pageSize: ITEMS_PER_PAGE,
  });

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const canRead = hasPermission('auditLogs', 'read') || hasPermission('admin', 'read');

  const { data: auditData, isLoading, error: auditError } = useAuditLogs({
    ...filters,
    pageNumber: currentPage,
    pageSize: ITEMS_PER_PAGE,
  });

  const auditLogs = auditData?.items || [];
  const totalCount = auditData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Statistics
  const stats = useMemo(() => {
    return {
      totalLogs: totalCount,
      todayLogs: auditLogs.filter(
        (log) =>
          new Date(log.timestamp).toDateString() === new Date().toDateString()
      ).length,
    };
  }, [auditLogs, totalCount]);

  const handleViewDetails = (log: AuditLogDto) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const handleExportJSON = () => {
    try {
      downloadJSON(auditLogs, `audit-logs-${new Date().toISOString().split('T')[0]}`);
      toast.success('Audit logs exported as JSON');
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = auditLogs.map((log) => ({
        ID: log.id,
        'User Name': log.userName,
        Action: log.action,
        'Entity Type': log.entityName,
        'Entity ID': log.entityId,
        Timestamp: formatDate(log.timestamp),
        'IP Address': log.ipAddress,
      }));
      downloadCSV(csvData, `audit-logs-${new Date().toISOString().split('T')[0]}`);
      toast.success('Audit logs exported as CSV');
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    setFilters({
      pageNumber: 1,
      pageSize: ITEMS_PER_PAGE,
    });
  }, []);

  const columns: Column<AuditLogDto>[] = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'id',
        width: '80px',
      },
      {
        header: 'User',
        accessor: (row) => (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100">
              <User className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <span className="font-medium text-slate-900">{row.userName || 'Unknown'}</span>
          </div>
        ),
      },
      {
        header: 'Action',
        accessor: (row) => (
          <Badge
            className={cn(
              'text-xs font-semibold uppercase tracking-wider px-2',
              row.action === 'Create'
                ? 'bg-green-50 text-green-700 border-green-100'
                : row.action === 'Update'
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : row.action === 'Delete'
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-slate-50 text-slate-700 border-slate-100'
            )}
          >
            {row.action}
          </Badge>
        ),
      },
      {
        header: 'Entity',
        accessor: (row) => (
          <div className="text-sm">
            <div className="font-medium text-slate-900">{row.entityName}</div>
            <div className="text-xs text-muted-foreground">ID: {row.entityId}</div>
          </div>
        ),
      },
      {
        header: 'Timestamp',
        accessor: (row) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(row.timestamp)}
          </div>
        ),
      },
      {
        header: 'IP Address',
        accessor: (row) => (
          <span className="font-mono text-xs text-slate-600">{row.ipAddress || 'N/A'}</span>
        ),
      },
    ],
    []
  );

  if (auditError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Error loading audit logs</h3>
            <p className="text-sm text-red-700 mt-1">
              {(auditError as any).userMessage || 'An error occurred'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['auditLogs'] })}
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track all system changes and user activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPIBox
          label="Total Logs"
          value={stats.totalLogs}
          icon={<Logs className="w-5 h-5" />}
          color="bg-indigo-500"
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KPIBox
          label="Today's Activity"
          value={stats.todayLogs}
          icon={<Activity className="w-5 h-5" />}
          color="bg-emerald-500"
          iconColor="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Filters Section */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border rounded-lg p-4 space-y-4 bg-slate-50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    startDate: e.target.value || undefined,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value || undefined })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Action
              </label>
              <Select
                value={filters.action || ''}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    action: value || undefined,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="Create">Create</SelectItem>
                  <SelectItem value="Update">Update</SelectItem>
                  <SelectItem value="Delete">Delete</SelectItem>
                  <SelectItem value="View">View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Entity Type
              </label>
              <Input
                placeholder="Filter by entity..."
                value={filters.entityName || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    entityName: e.target.value || undefined,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative group w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by user name, entity, or ID..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setFilters({ ...filters, searchTerm: e.target.value || undefined });
            setCurrentPage(1);
          }}
          className="pl-10 h-10 w-full"
        />
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 justify-end flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportJSON}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={auditLogs}
          isLoading={isLoading}
          onEdit={(log) => handleViewDetails(log)}
          itemsPerPage={ITEMS_PER_PAGE}
          emptyMessage="No audit logs found."
          showSearch={false}
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              View complete details of this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && <AuditLogDetails log={selectedLog} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPIBox({
  label,
  value,
  icon,
  color,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  iconColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 border-border">
        <div
          className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-[0.04] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`}
        />
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {label}
            </p>
            <p className="text-xl font-bold tracking-tight mt-0.5 truncate">
              {value}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function AuditLogDetails({ log }: { log: AuditLogDto }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">ID</label>
          <p className="text-sm font-medium mt-1">{log.id}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">User</label>
          <p className="text-sm font-medium mt-1">{log.userName || 'Unknown'}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Action</label>
          <p className="text-sm font-medium mt-1">
            <Badge className="mt-1">{log.action}</Badge>
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Entity</label>
          <p className="text-sm font-medium mt-1">{log.entityName}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Entity ID</label>
          <p className="text-sm font-medium mt-1">{log.entityId}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            IP Address
          </label>
          <p className="text-sm font-mono mt-1">{log.ipAddress || 'N/A'}</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase">
          Timestamp
        </label>
        <p className="text-sm font-medium mt-1">{formatDate(log.timestamp)}</p>
      </div>

      {log.oldValues && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Old Values
          </label>
          <pre className="text-xs bg-slate-100 p-3 rounded mt-1 overflow-x-auto">
            {log.oldValues}
          </pre>
        </div>
      )}

      {log.newValues && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            New Values
          </label>
          <pre className="text-xs bg-slate-100 p-3 rounded mt-1 overflow-x-auto">
            {log.newValues}
          </pre>
        </div>
      )}
    </div>
  );
}
