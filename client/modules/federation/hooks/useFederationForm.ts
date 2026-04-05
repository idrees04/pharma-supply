import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, type Path } from "react-hook-form";
import { z } from "zod";

import { usePostMutation, usePutMutation } from "@/api/hooks";
import { ApiError } from "@/api/errors";

import { federationService } from "../services/federation.service";
import type {
  CreateFederationRequest,
  CreateFederationResponse,
  Federation,
  FederationListResponse,
  UpdateFederationRequest,
  UpdateFederationResponse,
} from "../types/federation.types";
import { getFederationResponseErrorMessage } from "../types/federation.types";
import { FEDERATION_QUERY_KEY, useFederation } from "./useFederationList";

export const federationFormSchema = z.object({
  federationName: z
    .string()
    .trim()
    .min(1, "Federation name is required")
    .max(120, "Federation name must be 120 characters or fewer"),
  contactPerson: z
    .string()
    .trim()
    .max(120, "Contact person must be 120 characters or fewer")
    .default(""),
  phoneNumber: z
    .string()
    .trim()
    .max(30, "Phone number must be 30 characters or fewer")
    .default(""),
  email: z.union([z.string().trim().email("Enter a valid email address"), z.literal("")]).default(""),
  address: z
    .string()
    .trim()
    .max(500, "Address must be 500 characters or fewer")
    .default(""),
  isActive: z.boolean().default(true),
});

export type FederationFormValues = z.infer<typeof federationFormSchema>;

const federationFormDefaults: FederationFormValues = {
  federationName: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  address: "",
  isActive: true,
};

function mapFederationToFormValues(federation: Federation | null | undefined): FederationFormValues {
  if (!federation) {
    return federationFormDefaults;
  }

  return {
    federationName: federation.federationName ?? "",
    contactPerson: federation.contactPerson ?? "",
    phoneNumber: federation.phoneNumber ?? "",
    email: federation.email ?? "",
    address: federation.address ?? "",
    isActive: federation.isActive,
  };
}

function mapFormValuesToCreateRequest(values: FederationFormValues): CreateFederationRequest {
  return {
    federationName: values.federationName.trim() || null,
    contactPerson: values.contactPerson.trim() || null,
    phoneNumber: values.phoneNumber.trim() || null,
    email: values.email.trim() || null,
    address: values.address.trim() || null,
  };
}

function mapFormValuesToUpdateRequest(values: FederationFormValues): UpdateFederationRequest {
  return {
    ...mapFormValuesToCreateRequest(values),
    isActive: values.isActive,
  };
}

function updateListCache(
  current: FederationListResponse | undefined,
  nextFederation: Federation,
  response: CreateFederationResponse | UpdateFederationResponse,
): FederationListResponse {
  const currentItems = current?.data ?? [];
  const hasItem = currentItems.some((item) => item.id === nextFederation.id);
  const data = hasItem
    ? currentItems.map((item) => (item.id === nextFederation.id ? nextFederation : item))
    : [nextFederation, ...currentItems];

  return {
    success: response.success,
    message: response.message,
    errors: response.errors,
    timestamp: response.timestamp,
    data,
  };
}

function normalizeFieldKey(key: string): Path<FederationFormValues> | null {
  const cleanedKey = key.includes(".") ? key.split(".").pop() ?? key : key;
  const normalizedKey = `${cleanedKey.charAt(0).toLowerCase()}${cleanedKey.slice(1)}`;

  if (normalizedKey in federationFormDefaults) {
    return normalizedKey as Path<FederationFormValues>;
  }

  return null;
}

function applyServerValidationErrors(
  error: ApiError,
  setError: ReturnType<typeof useForm<FederationFormValues>>["setError"],
) {
  if (!error.hasValidationErrors) {
    return;
  }

  Object.entries(error.validationErrors).forEach(([key, value]) => {
    const fieldName = normalizeFieldKey(key);

    if (!fieldName) {
      return;
    }

    const message = Array.isArray(value) ? value[0] : value;

    if (typeof message === "string" && message.length > 0) {
      setError(fieldName, { message });
    }
  });
}

export function useCreateFederation() {
  const queryClient = useQueryClient();

  return usePostMutation<CreateFederationResponse, CreateFederationRequest>(
    (payload) => federationService.createFederation(payload),
    {
      onSuccess: (response) => {
        if (!response.success) {
          return;
        }

        queryClient.setQueryData<FederationListResponse | undefined>(FEDERATION_QUERY_KEY, (current) =>
          updateListCache(current, response.data, response),
        );
        queryClient.setQueryData([...FEDERATION_QUERY_KEY, response.data.id], response);
        queryClient.invalidateQueries({ queryKey: FEDERATION_QUERY_KEY });
      },
    },
  );
}

export function useUpdateFederation(id: number) {
  const queryClient = useQueryClient();

  return usePutMutation<UpdateFederationResponse, UpdateFederationRequest>(
    (payload) => federationService.updateFederation(id, payload),
    {
      onSuccess: (response) => {
        if (!response.success) {
          return;
        }

        queryClient.setQueryData<FederationListResponse | undefined>(FEDERATION_QUERY_KEY, (current) =>
          updateListCache(current, response.data, response),
        );
        queryClient.setQueryData([...FEDERATION_QUERY_KEY, id], response);
        queryClient.invalidateQueries({ queryKey: FEDERATION_QUERY_KEY });
      },
    },
  );
}

export function useFederationForm(federationId: number | null) {
  const isEditMode = typeof federationId === "number";
  const federationQuery = useFederation(federationId);
  const createMutation = useCreateFederation();
  const updateMutation = useUpdateFederation(federationId ?? 0);

  const form = useForm<FederationFormValues>({
    resolver: zodResolver(federationFormSchema),
    defaultValues: federationFormDefaults,
  });

  useEffect(() => {
    if (isEditMode && federationQuery.data?.data) {
      form.reset(mapFederationToFormValues(federationQuery.data.data));
      return;
    }

    if (!isEditMode) {
      form.reset(federationFormDefaults);
    }
  }, [federationQuery.data, form, isEditMode]);

  const submit = async(values: FederationFormValues) => {
    form.clearErrors();

    try {
      const response = isEditMode
        ? await updateMutation.mutateAsync(mapFormValuesToUpdateRequest(values))
        : await createMutation.mutateAsync(mapFormValuesToCreateRequest(values));

      if (!response.success) {
        form.setError("root", {
          message:
            response.message || getFederationResponseErrorMessage(response.errors) || "Unable to save federation.",
        });
        return null;
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        applyServerValidationErrors(error, form.setError);
        form.setError("root", {
          message: error.userMessage || getFederationResponseErrorMessage(error.validationErrors),
        });
        return null;
      }

      form.setError("root", { message: "Unable to save federation." });
      return null;
    }
  };

  return {
    form,
    submit,
    federation: federationQuery.data?.data ?? null,
    responseMessage: federationQuery.data?.message ?? null,
    responseErrors: federationQuery.data?.errors ?? null,
    responseTimestamp: federationQuery.data?.timestamp ?? null,
    isEditMode,
    isLoadingFederation: federationQuery.isPending,
    isFetchingFederation: federationQuery.isFetching,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
}
