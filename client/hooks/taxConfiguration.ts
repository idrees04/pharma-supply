import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { taxConfigService } from '@/api/services/taxConfiguration';
import {
    TaxConfiguration,
    CreateTaxConfigurationRequest,
    UpdateTaxConfigurationRequest,
} from '@/types/api/taxConfiguration';

export function useTaxConfigurations() {
    return useGetQuery<TaxConfiguration[]>(
        ['taxConfigurations'],
        () => taxConfigService.getTaxConfigurations(),
        {
            staleTime: 10 * 60 * 1000,
        }
    );
}

export function useTaxConfiguration(id: number | null) {
    return useGetQuery<TaxConfiguration>(
        ['taxConfigurations', id],
        () => taxConfigService.getTaxConfiguration(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useCreateTaxConfiguration() {
    const queryClient = useQueryClient();

    return usePostMutation<TaxConfiguration, CreateTaxConfigurationRequest>(
        (data) => taxConfigService.createTaxConfiguration(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['taxConfigurations'] });
            },
        }
    );
}

export function useUpdateTaxConfiguration(id: number) {
    const queryClient = useQueryClient();

    return usePutMutation<TaxConfiguration, UpdateTaxConfigurationRequest>(
        (data) => taxConfigService.updateTaxConfiguration(id, data),
        {
            onSuccess: (updated) => {
                queryClient.setQueryData(['taxConfigurations', id], updated);
                queryClient.invalidateQueries({ queryKey: ['taxConfigurations'] });
            },
        }
    );
}

export function useDeleteTaxConfiguration() {
    const queryClient = useQueryClient();

    return useDeleteMutation(
        (id: number) => taxConfigService.deleteTaxConfiguration(id),
        {
            onSuccess: (_, id) => {
                queryClient.removeQueries({ queryKey: ['taxConfigurations', id] });
                queryClient.invalidateQueries({ queryKey: ['taxConfigurations'] });
            },
        }
    );
}