import { useMemo } from "react";
import { Eye, Edit3, Trash2 } from "lucide-react";

import { DataTable, type Column } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Federation } from "../types/federation.types";

interface FederationTableProps {
  federations: Federation[];
  isLoading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (federation: Federation) => void;
  onEdit: (federation: Federation) => void;
  onDelete: (federation: Federation) => void;
}

export function FederationTable({
  federations,
  isLoading,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: FederationTableProps) {
  const columns = useMemo<Column<Federation>[]>(
    () => [
      {
        header: "ID",
        accessor: "id",
        className: "w-16 text-muted-foreground",
      },
      {
        header: "Federation Name",
        accessor: (row) => <span className="font-semibold text-foreground">{row.federationName || "—"}</span>,
      },
      {
        header: "Contact Person",
        accessor: (row) => row.contactPerson || "—",
      },
      {
        header: "Phone Number",
        accessor: (row) => row.phoneNumber || "—",
        mobileHidden: true,
      },
      {
        header: "Email",
        accessor: (row) => row.email || "—",
        mobileHidden: true,
      },
      {
        header: "Address",
        accessor: (row) => row.address || "—",
        mobileHidden: true,
      },
      {
        header: "Status",
        accessor: (row) => (
          <Badge variant={row.isActive ? "default" : "secondary"}>
            {row.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        accessor: (row) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation();
                onView(row);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(row);
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(row);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, onEdit, onView],
  );

  return (
    <DataTable
      columns={columns}
      data={federations}
      isLoading={isLoading}
      itemsPerPage={10}
      emptyMessage="No federations found."
      showSearch={false}
      onRowClick={onView}
    />
  );
}
