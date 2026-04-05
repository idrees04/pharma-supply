import { Edit3, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { Federation } from "../types/federation.types";

interface FederationDetailsSheetProps {
  federation: Federation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (federation: Federation) => void;
  onDelete: (federation: Federation) => void;
}

export function FederationDetailsSheet({
  federation,
  open,
  onOpenChange,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: FederationDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {federation ? (
          <>
            <SheetHeader>
              <SheetTitle>{federation.federationName || "Federation details"}</SheetTitle>
              <SheetDescription>Review the federation profile and operational status.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant={federation.isActive ? "default" : "secondary"}>
                  {federation.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">ID #{federation.id}</Badge>
              </div>

              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact Person</div>
                    <div className="mt-1 text-sm">{federation.contactPerson || "—"}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone Number</div>
                    <div className="mt-1 text-sm">{federation.phoneNumber || "—"}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</div>
                    <div className="mt-1 text-sm">{federation.email || "—"}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {federation.address || "No address provided."}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {canEdit ? (
                  <Button type="button" variant="outline" className="gap-2" onClick={() => onEdit(federation)}>
                    <Edit3 className="h-4 w-4" />
                    Edit Federation
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button type="button" variant="destructive" className="gap-2" onClick={() => onDelete(federation)}>
                    <Trash2 className="h-4 w-4" />
                    Delete Federation
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
