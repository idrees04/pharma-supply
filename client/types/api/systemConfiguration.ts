import type { ApiResponse } from '@/types/api/common';

export const SYSTEM_CONFIGURATION_DATA_TYPES = [
  'string',
  'number',
  'boolean',
  'email',
  'url',
  'json',
  'password',
] as const;

export type SystemConfigurationDataType = (typeof SYSTEM_CONFIGURATION_DATA_TYPES)[number];

export interface SystemConfiguration {
  id: number;
  configKey: string;
  configValue: string;
  displayName: string | null;
  description: string | null;
  dataType: SystemConfigurationDataType | null;
  category: string | null;
  isEncrypted: boolean;
  isEditable: boolean;
  isActive: boolean;
}

export interface SystemConfigurationMutationInput {
  configKey: string;
  configValue: string;
  displayName: string | null;
  description: string | null;
  dataType: SystemConfigurationDataType | null;
  category: string | null;
  isEncrypted: boolean;
  isEditable: boolean;
  isActive?: boolean;
}

export type CreateSystemConfigurationRequest = SystemConfigurationMutationInput;
export type UpdateSystemConfigurationRequest = Partial<SystemConfigurationMutationInput>;

export type GetSystemConfigurationsResponse = ApiResponse<SystemConfiguration[]>;
export type GetSystemConfigurationResponse = ApiResponse<SystemConfiguration>;
export type CreateSystemConfigurationResponse = ApiResponse<SystemConfiguration>;
export type UpdateSystemConfigurationResponse = ApiResponse<SystemConfiguration>;
export type DeleteSystemConfigurationResponse = ApiResponse<null>;
