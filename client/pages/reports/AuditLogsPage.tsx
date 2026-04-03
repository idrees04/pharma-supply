import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowDownUp,
  ArrowUpDown,
  Download,
  Eye,
  FileText,
  FilterX,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuditLogs } from '@/hooks/auditLogs';
import { AuditLogDto } from '@/types/api/auditLogs';
import { cn } from '@/lib/utils';

const actionOptions = [
  { value: 'all', label: 'All actions' },
  { value: 'Create', label: 'Create' },
  { value: 'Update', label: 'Update' },
  { value: 'Delete', label: 'Delete' },
  { value: 'Read', label: 'Read' },
] as const;

type ActionFilter = (typeof actionOptions)[number]['value'];

function exportAuditLogsCsv(logs: AuditLogDto[]) {
  const header = ['id', 'timestamp', 'userName', 'action', 'entityName', 'entityId', 'ipAddress'];
  const rows = logs.map((log) => [
    log.id,
    log.timestamp,
    log.userName ?? '',
    log.action ?? '',
    log.entityName ?? '',
    log.entityId ?? '',
    log.ipAddress ?? '',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit-logs.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function formatJson(value: string | null) {
  if (!value) {
    return '—';
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function getActionTone(action: string | null) {
  switch (action?.toLowerCase()) {
    case 'create':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'update':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'delete':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityName, setEntityName] = useState('all');
  const [action, setAction] = useState<ActionFilter>('all');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortDescending, setSortDescending] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const queryParams = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: 100,
      searchTerm: searchTerm.trim() || undefined,
      sortBy: 'timestamp',
      sortDescending,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userId ? Number(userId) : undefined,
      entityName: entityName === 'all' ? undefined : entityName,
      action: action === 'all' ? undefined : action,
    }),
    [action, endDate, entityName, searchTerm, sortDescending, startDate, userId],
  );

  const { data, isPending, error, refetch, isRefetching } = useAuditLogs(queryParams);
  const logs = data?.items ?? [];

  const entityOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.entityName ?? 'Unknown'))).sort((left, right) => left.localeCompare(right));
  }, [logs]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      users: new Set(logs.map((log) => log.userName ?? 'Unknown')).size,
      entities: new Set(logs.map((log) => log.entityName ?? 'Unknown')).size,
      actions: new Set(logs.map((log) => log.action ?? 'Unknown')).size,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (entityName !== 'all' && (log.entityName ?? 'Unknown') !== entityName) {
        return false;
      }

      if (action !== 'all' && (log.action ?? '') !== action) {
        return false;
      }

      if (userId && String(log.userId) !== userId) {
        return false;
      }

      if (startDate && new Date(log.timestamp) < new Date(startDate)) {
        return false;
      }

      if (endDate && new Date(log.timestamp) > new Date(`${endDate}T23:59:59.999`)) {
        return false;
      }

      return true;
    });
  }, [action, endDate, entityName, logs, startDate, userId]);

  const clearFilters = () => {
    setSearchTerm('');
    setEntityName('all');
    setAction('all');
    setUserId('');
    setStartDate('');
    setEndDate('');
    setSortDescending(true);
  };

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <div>
            <h1 className="text-2xl font-semibold">Unable to load audit logs</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error.userMessage || 'Audit log service unavailable.'}</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Audit logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track user actions, data changes, and critical system events.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => exportAuditLogsCsv(filteredLogs)} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total logs</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Users</CardDescription>
            <CardTitle className="text-3xl">{stats.users}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Entities</CardDescription>
            <CardTitle className="text-3xl">{stats.entities}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Actions</CardDescription>
            <CardTitle className="text-3xl">{stats.actions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Filter and search</CardTitle>
            <CardDescription>Use server-side search for quick investigation, then narrow further with filters.</CardDescription>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search entities, users, or actions"
                className="pl-9"
              />
            </div>

            <Select value={entityName} onValueChange={setEntityName}>
              <SelectTrigger>
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {entityOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={action} onValueChange={(value) => setAction(value as ActionFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User ID" />
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />

            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <FilterX className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Audit trail</CardTitle>
            <CardDescription>
              {filteredLogs.length} of {logs.length} logs shown.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => setSortDescending((current) => !current)} className="gap-2">
            {sortDescending ? <ArrowDownUp className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
            {sortDescending ? 'Newest first' : 'Oldest first'}
          </Button>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h2 className="mt-4 text-xl font-semibold">No audit logs match the current filters</h2>
              <p className="mt-2 text-sm text-muted-foreground">Clear the filters or broaden the search to review more history.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p>
                          <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>{log.userName || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getActionTone(log.action)}>
                          {log.action || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entityName || 'Unknown'}</TableCell>
                      <TableCell>{log.entityId ?? '—'}</TableCell>
                      <TableCell>{log.ipAddress || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedLog ? (
            <>
              <SheetHeader>
                <SheetTitle>Audit log details</SheetTitle>
                <SheetDescription>Inspect the full before-and-after payload for this event.</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={getActionTone(selectedLog.action)}>
                    {selectedLog.action || 'Unknown'}
                  </Badge>
                  <Badge variant="secondary">{selectedLog.entityName || 'Unknown entity'}</Badge>
                </div>

                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User</div>
                        <div className="mt-1 text-sm">{selectedLog.userName || 'Unknown'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Timestamp</div>
                        <div className="mt-1 text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entity ID</div>
                        <div className="mt-1 text-sm">{selectedLog.entityId ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">IP Address</div>
                        <div className="mt-1 text-sm">{selectedLog.ipAddress || '—'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Changed values</CardTitle>
                    <CardDescription>Structured diffs are shown where the backend provided JSON payloads.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Before</p>
                      <pre className="max-h-72 overflow-auto rounded-xl bg-muted/60 p-4 text-xs leading-6">
                        {formatJson(selectedLog.oldValues)}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">After</p>
                      <pre className="max-h-72 overflow-auto rounded-xl bg-muted/60 p-4 text-xs leading-6">
                        {formatJson(selectedLog.newValues)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
