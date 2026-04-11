import { ApiResponse } from './common';

// DTOs
export interface TaxConfiguration {
    id: number;
    federationId: number;
    createdDate: string;
    createdBy: number;
    modifiedDate: string;
    modifiedBy: number;
    isActive: boolean;
    taxName: string;
    taxCode: string;
    taxPercentage: number;
    isCompound: boolean;
    description: string | null;
    effectiveFrom: string; // ISO date
    effectiveTo: string | null;
}

// Request DTOs
export type CreateTaxConfigurationRequest = Omit<TaxConfiguration, 'id' | 'federationId'>;
export type UpdateTaxConfigurationRequest = Partial<Omit<TaxConfiguration, 'id' | 'federationId'>>;

// Response types
export type GetTaxConfigurationsResponse = ApiResponse<TaxConfiguration[]>;
export type GetTaxConfigurationResponse = ApiResponse<TaxConfiguration>;
export type CreateTaxConfigurationResponse = ApiResponse<TaxConfiguration>;
export type UpdateTaxConfigurationResponse = ApiResponse<TaxConfiguration>;
export type DeleteTaxConfigurationResponse = ApiResponse<null>;