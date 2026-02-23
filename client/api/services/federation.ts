import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
    FederationDto,
    CreateFederationRequest,
    UpdateFederationRequest,
    GetFederationsResponse,
    GetFederationResponse,
    CreateFederationResponse,
    UpdateFederationResponse,
    DeleteFederationResponse,
} from '@/types/api/federation';

export const federationService = {
    /**
     * Get all federations
     */
    getFederations: async (config?: RequestConfig): Promise<FederationDto[]> => {
        const response = await get<GetFederationsResponse>('/api/Federation', config);
        return response.data;
    },

    /**
     * Get a single federation by ID
     */
    getFederation: async (id: number, config?: RequestConfig): Promise<FederationDto> => {
        const response = await get<GetFederationResponse>(`/api/Federation/${id}`, config);
        return response.data;
    },

    /**
     * Create a new federation
     */
    createFederation: async (
        data: CreateFederationRequest,
        config?: RequestConfig
    ): Promise<FederationDto> => {
        const response = await post<CreateFederationResponse, CreateFederationRequest>(
            '/api/Federation',
            data,
            config
        );
        return response.data;
    },

    /**
     * Update a federation
     */
    updateFederation: async (
        id: number,
        data: UpdateFederationRequest,
        config?: RequestConfig
    ): Promise<FederationDto> => {
        const response = await put<UpdateFederationResponse, UpdateFederationRequest>(
            `/api/Federation/${id}`,
            data,
            config
        );
        return response.data;
    },

    /**
     * Delete a federation
     */
    deleteFederation: async (id: number, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeleteFederationResponse>(`/api/Federation/${id}`, config);
    },
};