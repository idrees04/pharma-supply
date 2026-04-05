import { deleteRequest, get, post, put, type RequestConfig } from "@/api/requests";

import type {
  CreateFederationRequest,
  CreateFederationResponse,
  DeleteFederationResponse,
  FederationListResponse,
  FederationResponse,
  UpdateFederationRequest,
  UpdateFederationResponse,
} from "../types/federation.types";

export const federationService = {
  getFederations(config?: RequestConfig): Promise<FederationListResponse> {
    return get<FederationListResponse>("/api/Federation", config);
  },

  getFederation(id: number, config?: RequestConfig): Promise<FederationResponse> {
    return get<FederationResponse>(`/api/Federation/${id}`, config);
  },

  createFederation(
    data: CreateFederationRequest,
    config?: RequestConfig,
  ): Promise<CreateFederationResponse> {
    return post<CreateFederationResponse, CreateFederationRequest>("/api/Federation", data, config);
  },

  updateFederation(
    id: number,
    data: UpdateFederationRequest,
    config?: RequestConfig,
  ): Promise<UpdateFederationResponse> {
    return put<UpdateFederationResponse, UpdateFederationRequest>(`/api/Federation/${id}`, data, config);
  },

  deleteFederation(id: number, config?: RequestConfig): Promise<DeleteFederationResponse> {
    return deleteRequest<DeleteFederationResponse>(`/api/Federation/${id}`, config);
  },
};
