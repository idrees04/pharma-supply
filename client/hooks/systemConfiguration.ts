import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { systemConfigService } from '@/api/services/systemConfiguration';
import {
    SystemConfiguration,
    CreateSystemConfigurationRequest,
    UpdateSystemConfigurationRequest,
} from '@/types/api/systemConfiguration';

export function useSystemConfigurations() {
    return useGetQuery<SystemConfiguration[]>(
        ['systemConfigurations'],
        () => systemConfigService.getConfigurations(),
        {
            staleTime: 10 * 60 * 1000,
        }
    );
}

export function useSystemConfiguration(key: string | null) {
    return useGetQuery<SystemConfiguration>(
        ['systemConfigurations', key],
        () => systemConfigService.getConfiguration(key!),
        {
            enabled: key !== null,
        }
    );
}

export function useCreateSystemConfiguration() {
    const queryClient = useQueryClient();

    return usePostMutation<SystemConfiguration, CreateSystemConfigurationRequest>(
        (data) => systemConfigService.createConfiguration(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['systemConfigurations'] });
            },
        }
    );
}

export function useUpdateSystemConfiguration(key: string) {
    const queryClient = useQueryClient();

    return usePutMutation<SystemConfiguration, UpdateSystemConfigurationRequest>(
        (data) => systemConfigService.updateConfiguration(key, data),
        {
            onSuccess: (updated) => {
                queryClient.setQueryData(['systemConfigurations', key], updated);
                queryClient.invalidateQueries({ queryKey: ['systemConfigurations'] });
            },
        }
    );
}

export function useDeleteSystemConfiguration() {
    const queryClient = useQueryClient();

    return useDeleteMutation(
        (key: string) => systemConfigService.deleteConfiguration(key),
        {
            onSuccess: (_, key) => {
                queryClient.removeQueries({ queryKey: ['systemConfigurations', key] });
                queryClient.invalidateQueries({ queryKey: ['systemConfigurations'] });
            },
        }
    );
}