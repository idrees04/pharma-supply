import { useQueryClient } from '@tanstack/react-query';

import { useDeleteMutation, useGetQuery, usePostMutation, usePutMutation } from '@/api/hooks';
import { deleteRequest, get, post, put, RequestConfig } from '@/api/requests';
import {
  CreateSystemConfigurationRequest,
  CreateSystemConfigurationResponse,
  DeleteSystemConfigurationResponse,
  GetSystemConfigurationResponse,
  GetSystemConfigurationsResponse,
  SystemConfiguration,
  UpdateSystemConfigurationRequest,
  UpdateSystemConfigurationResponse,
} from '@/types/api/systemConfiguration';

export const systemConfigurationKeys = {
  all: ['systemConfigurations'] as const,
  detail: (key: string) => [...systemConfigurationKeys.all, key] as const,
};

export const systemConfigService = {
  getConfigurations: async (config?: RequestConfig): Promise<SystemConfiguration[]> => {
    const response = await get<GetSystemConfigurationsResponse>('/api/SystemConfiguration', config);
    return response.data;
  },

  getConfiguration: async (key: string, config?: RequestConfig): Promise<SystemConfiguration> => {
    const response = await get<GetSystemConfigurationResponse>(`/api/SystemConfiguration/${key}`, config);
    return response.data;
  },

  createConfiguration: async (
    data: CreateSystemConfigurationRequest,
    config?: RequestConfig,
  ): Promise<SystemConfiguration> => {
    const response = await post<CreateSystemConfigurationResponse, CreateSystemConfigurationRequest>(
      '/api/SystemConfiguration',
      data,
      config,
    );

    return response.data;
  },

  updateConfiguration: async (
    key: string,
    data: UpdateSystemConfigurationRequest,
    config?: RequestConfig,
  ): Promise<SystemConfiguration> => {
    const response = await put<UpdateSystemConfigurationResponse, UpdateSystemConfigurationRequest>(
      `/api/SystemConfiguration/${key}`,
      data,
      config,
    );

    return response.data;
  },

  deleteConfiguration: async (key: string, config?: RequestConfig): Promise<void> => {
    await deleteRequest<DeleteSystemConfigurationResponse>(`/api/SystemConfiguration/${key}`, config);
  },
};

export function useSystemConfigurations() {
  return useGetQuery<SystemConfiguration[]>(
    systemConfigurationKeys.all,
    () => systemConfigService.getConfigurations(),
    {
      staleTime: 10 * 60 * 1000,
    },
  );
}

export function useSystemConfiguration(key: string | null) {
  return useGetQuery<SystemConfiguration>(
    key ? systemConfigurationKeys.detail(key) : [...systemConfigurationKeys.all, 'new'],
    () => systemConfigService.getConfiguration(key!),
    {
      enabled: key !== null,
    },
  );
}

export function useCreateSystemConfiguration() {
  const queryClient = useQueryClient();

  return usePostMutation<SystemConfiguration, CreateSystemConfigurationRequest>(
    (data) => systemConfigService.createConfiguration(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: systemConfigurationKeys.all });
      },
    },
  );
}

export function useUpdateSystemConfiguration(key: string) {
  const queryClient = useQueryClient();

  return usePutMutation<SystemConfiguration, UpdateSystemConfigurationRequest>(
    (data) => systemConfigService.updateConfiguration(key, data),
    {
      onSuccess: (updatedConfiguration) => {
        queryClient.setQueryData(systemConfigurationKeys.detail(key), updatedConfiguration);
        queryClient.invalidateQueries({ queryKey: systemConfigurationKeys.all });
      },
    },
  );
}

export function useDeleteSystemConfiguration() {
  const queryClient = useQueryClient();

  return useDeleteMutation<void, string>(
    (key) => systemConfigService.deleteConfiguration(key),
    {
      onSuccess: (_, key) => {
        queryClient.removeQueries({ queryKey: systemConfigurationKeys.detail(key) });
        queryClient.invalidateQueries({ queryKey: systemConfigurationKeys.all });
      },
    },
  );
}
