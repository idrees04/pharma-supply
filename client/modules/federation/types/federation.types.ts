import type { ApiResponse } from "@/types/api/common";

export interface Federation {
  id: number;
  federationName: string | null;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
}

export interface CreateFederationRequest {
  federationName: string | null;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
}

export interface UpdateFederationRequest {
  federationName: string | null;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
}

export type FederationListResponse = ApiResponse<Federation[]>;
export type FederationResponse = ApiResponse<Federation>;
export type CreateFederationResponse = ApiResponse<Federation>;
export type UpdateFederationResponse = ApiResponse<Federation>;
export type DeleteFederationResponse = ApiResponse<null>;

export type FederationStatusFilter = "all" | "active" | "inactive";

export function getFederationResponseErrorMessage(errors: unknown): string | null {
  if (!errors) {
    return null;
  }

  if (typeof errors === "string") {
    return errors;
  }

  if (Array.isArray(errors)) {
    const messages = errors.filter((value): value is string => typeof value === "string" && value.length > 0);
    return messages.length > 0 ? messages.join(", ") : null;
  }

  if (typeof errors === "object") {
    const values = Object.values(errors as Record<string, unknown>).flatMap((value) => {
      if (typeof value === "string") {
        return value;
      }

      if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string" && item.length > 0);
      }

      return [];
    });

    return values.length > 0 ? values.join(", ") : null;
  }

  return null;
}
