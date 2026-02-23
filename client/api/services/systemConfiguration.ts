import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
    SystemConfiguration,
    CreateSystemConfigurationRequest,
    UpdateSystemConfigurationRequest,
    GetSystemConfigurationsResponse,
    GetSystemConfigurationResponse,
    CreateSystemConfigurationResponse,
    UpdateSystemConfigurationResponse,
    DeleteSystemConfigurationResponse,
} from '@/types/api/systemConfiguration';

export const systemConfigService = {
    /**
     * Get all system configurations
     */
    getConfigurations: async (config?: RequestConfig): Promise<SystemConfiguration[]> => {
        const response = await get<GetSystemConfigurationsResponse>('/api/SystemConfiguration', config);
        return response.data;
    },

    /**
     * Get a system configuration by key
     */
    getConfiguration: async (key: string, config?: RequestConfig): Promise<SystemConfiguration> => {
        const response = await get<GetSystemConfigurationResponse>(`/api/SystemConfiguration/${key}`, config);
        return response.data;
    },

    /**
     * Create a new system configuration
     */
    createConfiguration: async (
        data: CreateSystemConfigurationRequest,
        config?: RequestConfig
    ): Promise<SystemConfiguration> => {
        const response = await post<CreateSystemConfigurationResponse, CreateSystemConfigurationRequest>(
            '/api/SystemConfiguration',
            data,
            config
        );
        return response.data;
    },

    /**
     * Update a system configuration
     */
    updateConfiguration: async (
        key: string,
        data: UpdateSystemConfigurationRequest,
        config?: RequestConfig
    ): Promise<SystemConfiguration> => {
        const response = await put<UpdateSystemConfigurationResponse, UpdateSystemConfigurationRequest>(
            `/api/SystemConfiguration/${key}`,
            data,
            config
        );
        return response.data;
    },

    /**
     * Delete a system configuration
     */
    deleteConfiguration: async (key: string, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeleteSystemConfigurationResponse>(`/api/SystemConfiguration/${key}`, config);
    },
};