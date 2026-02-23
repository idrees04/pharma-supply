import { ApiResponse } from './common';

// DTOs
export interface SystemConfiguration {
    id: number;
    configKey: string;
    configValue: string;
    displayName: string | null;
    description: string | null;
    dataType: string | null;
    category: string | null;
    isEncrypted: boolean;
    isEditable: boolean;
    isActive: boolean;
}

// Request DTOs
export type CreateSystemConfigurationRequest = Omit<SystemConfiguration, 'id' | 'isActive'> & {
    isActive?: boolean;
};
export type UpdateSystemConfigurationRequest = Partial<Omit<SystemConfiguration, 'id'>>;

// Response types
export type GetSystemConfigurationsResponse = ApiResponse<SystemConfiguration[]>;
export type GetSystemConfigurationResponse = ApiResponse<SystemConfiguration>;
export type CreateSystemConfigurationResponse = ApiResponse<SystemConfiguration>;
export type UpdateSystemConfigurationResponse = ApiResponse<SystemConfiguration>;
export type DeleteSystemConfigurationResponse = ApiResponse<null>;