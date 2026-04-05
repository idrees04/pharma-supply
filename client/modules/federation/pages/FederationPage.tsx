import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe2,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/api/errors";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

import { FederationDetailsSheet } from "../components/FederationDetailsSheet";
import { FederationForm } from "../components/FederationForm";
import { FederationTable } from "../components/FederationTable";
import { useDeleteFederation, useFederationList } from "../hooks/useFederationList";
import type { Federation } from "../types/federation.types";
import { getFederationResponseErrorMessage } from "../types/federation.types";

function formatApiTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return null;
  }

  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return timestamp;
  }

  return parsedDate.toLocaleString();
}

export default function FederationPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("federations", "create");
  const canUpdate = hasPermission("federations", "update");
  const canDelete = hasPermission("federations", "delete");

  const {
    data,
    error,
    isPending,
    isRefetching,
    refetch,
    filteredFederations,
    federations,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    clearFilters,
    hasResponseError,
    responseMessage,
    responseErrors,
    responseTimestamp,
  } = useFederationList();

  const deleteMutation = useDeleteFederation();

  const [selectedFederation, setSelectedFederation] = useState<Federation | null>(null);
  const [editingFederationId, setEditingFederationId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Federation | null>(null);

  const lastSyncedText = useMemo(() => formatApiTimestamp(responseTimestamp), [responseTimestamp]);

  const handleOpenCreate = () => {
    setEditingFederationId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (federation: Federation) => {
    setEditingFederationId(federation.id);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const response = await deleteMutation.mutateAsync(deleteTarget.id);

      if (!response.success) {
        toast.error(response.message || getFederationResponseErrorMessage(response.errors) || "Unable to delete federation.");
        return;
      }

      toast.success(response.message || "Federation deleted successfully.");
      setDeleteTarget(null);
      setSelectedFederation((current) => (current?.id === deleteTarget.id ? null : current));
    } catch (error) {
      const message = error instanceof ApiError ? error.userMessage : "Unable to delete federation.";
      toast.error(message);
    }
  };

  if (error || hasResponseError) {
    const errorMessage =
      (error instanceof ApiError ? error.userMessage : null) ||
      responseMessage ||
      getFederationResponseErrorMessage(responseErrors) ||
      "Federation service unavailable.";

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Federations</h1>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h2 className="text-2xl font-semibold">Unable to load federations</h2>
              <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Federations</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage federation master data, contact profiles, and active status.
          </p>
        </div>
        {canCreate ? (
          <Button onClick={handleOpenCreate} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Add Federation
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          {
            label: "Total Federations",
            value: stats.total,
            icon: Building2,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Inactive",
            value: stats.inactive,
            icon: XCircle,
            color: "text-slate-600 bg-slate-100",
          },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight">{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, contact, phone, email, or address..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 w-full pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={statusFilter === "all" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            type="button"
            variant={statusFilter === "active" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            type="button"
            variant={statusFilter === "inactive" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
            Clear
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Federation Registry</h2>
              <p className="text-sm text-muted-foreground">
                {filteredFederations.length} of {federations.length} records shown.
              </p>
            </div>
            {lastSyncedText ? (
              <p className="text-xs text-muted-foreground">Last synced: {lastSyncedText}</p>
            ) : null}
          </div>

          {isPending && federations.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : filteredFederations.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
              <Globe2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h2 className="mt-4 text-xl font-semibold">No federations found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Adjust your filters to find matching federation records."
                  : "Create the first federation record to start managing the registry."}
              </p>
            </div>
          ) : (
            <FederationTable
              federations={filteredFederations}
              isLoading={isPending}
              canEdit={canUpdate}
              canDelete={canDelete}
              onView={setSelectedFederation}
              onEdit={handleOpenEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingFederationId(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFederationId ? "Edit Federation" : "Add Federation"}</DialogTitle>
            <DialogDescription>
              Maintain federation records with validated contact and address details.
            </DialogDescription>
          </DialogHeader>
          <FederationForm
            federationId={editingFederationId}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingFederationId(null);
            }}
            onSuccess={(response) => {
              toast.success(response.message || (editingFederationId ? "Federation updated successfully." : "Federation created successfully."));
              setSelectedFederation(response.data);
              setIsFormOpen(false);
              setEditingFederationId(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <FederationDetailsSheet
        federation={selectedFederation}
        open={selectedFederation !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFederation(null);
          }
        }}
        canEdit={canUpdate}
        canDelete={canDelete}
        onEdit={(federation) => {
          setSelectedFederation(null);
          handleOpenEdit(federation);
        }}
        onDelete={(federation) => setDeleteTarget(federation)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete Federation"
        description={
          <div className="space-y-3 pt-2 text-left">
            <p>
              You are about to permanently delete <span className="font-semibold">{deleteTarget?.federationName || "this federation"}</span>.
            </p>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              This action cannot be undone.
            </div>
          </div>
        }
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
        confirmText="Delete Federation"
        variant="destructive"
      />
    </div>
  );
}
