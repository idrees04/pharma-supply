import { ApiResponse } from './common';

// DTOs
export interface TaxConfiguration {
    id: number;
    taxName: string;
    taxCode: string;
    taxPercentage: number;
    isCompound: boolean;
    description: string | null;
    effectiveFrom: string; // ISO date
    effectiveTo: string | null;
    isActive: boolean;
}

// Request DTOs
export type CreateTaxConfigurationRequest = Omit<TaxConfiguration, 'id' | 'isActive'> & {
    isActive?: boolean;
};
export type UpdateTaxConfigurationRequest = Partial<Omit<TaxConfiguration, 'id'>>;

// Response types
export type GetTaxConfigurationsResponse = ApiResponse<TaxConfiguration[]>;
export type GetTaxConfigurationResponse = ApiResponse<TaxConfiguration>;
export type CreateTaxConfigurationResponse = ApiResponse<TaxConfiguration>;
export type UpdateTaxConfigurationResponse = ApiResponse<TaxConfiguration>;
export type DeleteTaxConfigurationResponse = ApiResponse<null>;