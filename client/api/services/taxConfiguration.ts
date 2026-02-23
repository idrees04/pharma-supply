import { get, post, put, deleteRequest, RequestConfig } from '@/api/requests';
import {
    TaxConfiguration,
    CreateTaxConfigurationRequest,
    UpdateTaxConfigurationRequest,
    GetTaxConfigurationsResponse,
    GetTaxConfigurationResponse,
    CreateTaxConfigurationResponse,
    UpdateTaxConfigurationResponse,
    DeleteTaxConfigurationResponse,
} from '@/types/api/taxConfiguration';

export const taxConfigService = {
    /**
     * Get all tax configurations
     */
    getTaxConfigurations: async (config?: RequestConfig): Promise<TaxConfiguration[]> => {
        const response = await get<GetTaxConfigurationsResponse>('/api/TaxConfiguration', config);
        return response.data;
    },

    /**
     * Get a tax configuration by ID
     */
    getTaxConfiguration: async (id: number, config?: RequestConfig): Promise<TaxConfiguration> => {
        const response = await get<GetTaxConfigurationResponse>(`/api/TaxConfiguration/${id}`, config);
        return response.data;
    },

    /**
     * Create a new tax configuration
     */
    createTaxConfiguration: async (
        data: CreateTaxConfigurationRequest,
        config?: RequestConfig
    ): Promise<TaxConfiguration> => {
        const response = await post<CreateTaxConfigurationResponse, CreateTaxConfigurationRequest>(
            '/api/TaxConfiguration',
            data,
            config
        );
        return response.data;
    },

    /**
     * Update a tax configuration
     */
    updateTaxConfiguration: async (
        id: number,
        data: UpdateTaxConfigurationRequest,
        config?: RequestConfig
    ): Promise<TaxConfiguration> => {
        const response = await put<UpdateTaxConfigurationResponse, UpdateTaxConfigurationRequest>(
            `/api/TaxConfiguration/${id}`,
            data,
            config
        );
        return response.data;
    },

    /**
     * Delete a tax configuration
     */
    deleteTaxConfiguration: async (id: number, config?: RequestConfig): Promise<void> => {
        await deleteRequest<DeleteTaxConfigurationResponse>(`/api/TaxConfiguration/${id}`, config);
    },
};