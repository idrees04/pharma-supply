import { ApiResponse } from './common';

// DTOs
export interface FederationDto {
    id: number;
    federationName: string | null;
    contactPerson: string | null;
    phoneNumber: string | null;
    email: string | null;
    address: string | null;
    isActive: boolean;
}

// Request DTOs
export interface CreateFederationRequest {
    federationName?: string | null;
    contactPerson?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    address?: string | null;
}

export interface UpdateFederationRequest {
    federationName?: string | null;
    contactPerson?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    address?: string | null;
    isActive?: boolean;
}

// Response types
export type GetFederationsResponse = ApiResponse<FederationDto[]>;
export type GetFederationResponse = ApiResponse<FederationDto>;
export type CreateFederationResponse = ApiResponse<FederationDto>;
export type UpdateFederationResponse = ApiResponse<FederationDto>;
export type DeleteFederationResponse = ApiResponse<null>;