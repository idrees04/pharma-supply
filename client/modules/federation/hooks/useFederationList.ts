import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useDeleteMutation, useGetQuery } from "@/api/hooks";

import { federationService } from "../services/federation.service";
import type {
  DeleteFederationResponse,
  Federation,
  FederationListResponse,
  FederationResponse,
  FederationStatusFilter,
} from "../types/federation.types";

export const FEDERATION_QUERY_KEY = ["federations"] as const;

function normalizeFederationSearchValue(federation: Federation) {
  return [
    federation.id.toString(),
    federation.federationName,
    federation.contactPerson,
    federation.phoneNumber,
    federation.email,
    federation.address,
    federation.isActive ? "active" : "inactive",
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

export function useFederations() {
  return useGetQuery<FederationListResponse>(FEDERATION_QUERY_KEY, () => federationService.getFederations(), {
    staleTime: 10 * 60 * 1000,
  });
}

export function useFederation(id: number | null) {
  return useGetQuery<FederationResponse>(
    [...FEDERATION_QUERY_KEY, id],
    () => federationService.getFederation(id as number),
    {
      enabled: typeof id === "number",
    },
  );
}

export function useDeleteFederation() {
  const queryClient = useQueryClient();

  return useDeleteMutation<DeleteFederationResponse, number>((id) => federationService.deleteFederation(id), {
    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: [...FEDERATION_QUERY_KEY, id] });
      queryClient.setQueryData<FederationListResponse | undefined>(FEDERATION_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          message: response.message,
          timestamp: response.timestamp,
          errors: response.errors,
          data: current.data.filter((item) => item.id !== id),
        };
      });
      queryClient.invalidateQueries({ queryKey: FEDERATION_QUERY_KEY });
    },
  });
}

export function useFederationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FederationStatusFilter>("all");

  const listQuery = useFederations();
  const federations = listQuery.data?.data ?? [];

  const filteredFederations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return federations.filter((federation) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && federation.isActive) ||
        (statusFilter === "inactive" && !federation.isActive);

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return normalizeFederationSearchValue(federation).includes(normalizedSearch);
    });
  }, [federations, searchTerm, statusFilter]);

  const stats = useMemo(
    () => ({
      total: federations.length,
      active: federations.filter((item) => item.isActive).length,
      inactive: federations.filter((item) => !item.isActive).length,
    }),
    [federations],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return {
    ...listQuery,
    federations,
    filteredFederations,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    clearFilters,
    hasResponseError: Boolean(listQuery.data && !listQuery.data.success),
    responseMessage: listQuery.data?.message ?? null,
    responseErrors: listQuery.data?.errors ?? null,
    responseTimestamp: listQuery.data?.timestamp ?? null,
  };
}
